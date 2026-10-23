// 공공데이터포털 '금융위원회_주식시세정보'에서 KOSPI·KOSDAQ 전 종목 일별 시세를 받아 data/ 폴더에 저장한다
// 실행: node scripts/fetch-data.mjs             (새로 나온 거래일만 받아 이어 붙임 — 매일 자동 실행)
//       node scripts/fetch-data.mjs --backfill  (1년치를 처음부터 다시 받음, 약 260번 호출)
// 인증키는 환경변수 DATA_GO_KR_KEY, 없으면 프로젝트 루트의 .env 파일(DATA_GO_KR_KEY=...)에서 읽는다
// GitHub Actions가 평일마다 실행한다 (.github/workflows/update-data.yml)
//
// 날짜 하나를 부르면 그날 전 종목(약 2,900개)이 한 번에 온다. 그래서 종목별이 아니라 날짜별로 받는다
//
// 만드는 파일 (브라우저에서 file://로 열어도 되도록 JSON 대신 <script>로 읽는 .js로 저장)
//   data/history/<코드>.js  종목별 1년치 일봉 [날짜, 종가, 거래량] → window.LIVE_HISTORY  (기존 파일이 곧 누적 상태)
//   data/stocks.js          전 종목 최신 시세 → window.STOCKS  (종목 상세·검색)
//   data/prices.js          히트맵 70종목 상세와 전체 시장 순위 → window.LIVE  (모든 페이지)

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HISTORY_DIR = path.join(ROOT, "data/history");
const API = "https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2";
const DAYS = 250; // 1년 ≈ 250거래일
const SPARK_DAYS = 60; // 라운지 작은 차트용 최근 종가 개수
const RANK_SIZE = 5; // 라운지 순위표 종목 수
const MIN_VALUE = 1e9; // 순위표에 넣을 최소 거래대금(10억원). 거래가 거의 없는 종목이 순위를 차지하지 않게
const STALE_DAYS = 30; // 이만큼 거래일 동안 시세가 없으면(상장폐지 등) 일봉 파일을 지운다

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ymd = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
const dashed = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
const round2 = (n) => Math.round(n * 100) / 100;
const isWeekday = (d) => d.getDay() % 6 !== 0;

function readKey() {
  let key = process.env.DATA_GO_KR_KEY;
  const envFile = path.join(ROOT, ".env");
  if (!key && fs.existsSync(envFile)) {
    const m = fs.readFileSync(envFile, "utf8").match(/^\s*DATA_GO_KR_KEY\s*=\s*(.+?)\s*$/m);
    key = m && m[1].replace(/^["']|["']$/g, "");
  }
  if (!key) throw new Error("인증키가 없습니다. 환경변수 DATA_GO_KR_KEY 또는 .env 파일을 확인하세요.");
  // 포털의 'Encoding' 키(%2B 등이 들어 있음)를 넣어도 되도록 한 번 풀어 둔다. URLSearchParams가 다시 인코딩한다
  return key.includes("%") ? decodeURIComponent(key) : key;
}

// 히트맵 70종목(상세 데이터를 만들 종목)은 화면과 같은 js/data.js의 HEATMAP에서 가져온다
function readUniverse() {
  const ctx = {};
  vm.runInNewContext(`${fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8")}\nthis.HEATMAP = HEATMAP;`, ctx);
  return Object.values(ctx.HEATMAP.markets).flatMap((m) => m.sectors.flatMap((s) => s.stocks));
}

async function call(key, params) {
  const url = `${API}?${new URLSearchParams({ serviceKey: key, resultType: "json", ...params })}`;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`JSON이 아닌 응답 (HTTP ${res.status}): ${text.slice(0, 200)}`);
      }
      // 인증키 문제 등은 이 형식으로 온다
      const denied = json.OpenAPI_ServiceResponse?.cmmMsgHeader;
      if (denied) throw new Error(`접근 거부: ${denied.returnAuthMsg} (${denied.errMsg})`);

      const { header, body } = json.response;
      if (header.resultCode !== "00") throw new Error(`API 오류 ${header.resultCode}: ${header.resultMsg}`);
      const item = body.items?.item ?? [];
      return { rows: Array.isArray(item) ? item : [item], total: body.totalCount };
    } catch (e) {
      lastError = e;
      // 인증키 문제는 다시 해도 안 되므로 바로 멈춘다
      if (e.message.startsWith("접근 거부")) break;
      await sleep(1500 * attempt);
    }
  }
  throw lastError;
}

// 날짜 하루치 KOSPI·KOSDAQ 전 종목. 휴장일이거나 아직 안 올라왔으면 빈 배열
async function fetchDay(key, date) {
  const { rows, total } = await call(key, { basDt: date, numOfRows: "5000", pageNo: "1" });
  if (total > rows.length) throw new Error(`${date}: ${total}종목 중 ${rows.length}개만 왔습니다. numOfRows를 늘리세요.`);
  return rows
    .filter((r) => r.mrktCtg === "KOSPI" || r.mrktCtg === "KOSDAQ")
    .map((r) => ({
      // 2024년부터 영문이 섞인 코드(예: 0001A0)가 있어서 숫자만 남기지 않고 그대로 쓴다
      code: r.srtnCd.trim(),
      name: r.itmsNm.trim(),
      market: r.mrktCtg,
      date: r.basDt,
      close: Number(r.clpr),
      diff: Number(r.vs),
      change: Number(r.fltRt),
      volume: Number(r.trqu),
      value: Number(r.trPrc),
      cap: Number(r.mrktTotAmt),
    }));
}

// 기존 일봉 파일 읽기: { 코드: [[날짜(YYYY-MM-DD), 종가, 거래량], ...] }
function readHistories() {
  const histories = {};
  if (!fs.existsSync(HISTORY_DIR)) return histories;
  for (const file of fs.readdirSync(HISTORY_DIR)) {
    if (!file.endsWith(".js")) continue;
    const m = fs.readFileSync(path.join(HISTORY_DIR, file), "utf8").match(/= (\[.*\]);/s);
    if (m) histories[file.slice(0, -3)] = JSON.parse(m[1]);
  }
  return histories;
}

// 지난번에 저장한 기준일 (data/stocks.js의 STOCKS.date). 전 종목 파일이 없으면 null → 1년치를 새로 받는다
function readLastDate() {
  const file = path.join(ROOT, "data/stocks.js");
  if (!fs.existsSync(file)) return null;
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx);
  return ctx.window.STOCKS?.date?.replaceAll("-", "") || null;
}

// 마지막 기준일 다음 평일부터 오늘까지 하루씩 받는다 (오래된 순)
async function fetchNewDays(key, lastDate) {
  const dates = [];
  for (const day = new Date(); ymd(day) > lastDate; day.setDate(day.getDate() - 1)) {
    if (isWeekday(day)) dates.unshift(ymd(day));
  }
  const snapshots = [];
  for (const date of dates) {
    const rows = await fetchDay(key, date);
    console.log(`${date}: ${rows.length ? `${rows.length}종목` : "데이터 없음 (휴장일이거나 아직 안 올라옴)"}`);
    if (rows.length) snapshots.push(rows);
    await sleep(200);
  }
  return snapshots;
}

// 처음(또는 --backfill): 거래일 DAYS개가 모일 때까지 오늘부터 하루씩 거슬러 올라간다 (오래된 순으로 돌려줌)
async function fetchYear(key) {
  const snapshots = [];
  let empty = 0;
  for (const day = new Date(); snapshots.length < DAYS; day.setDate(day.getDate() - 1)) {
    if (!isWeekday(day)) continue;
    const rows = await fetchDay(key, ymd(day));
    if (rows.length) {
      snapshots.unshift(rows);
      empty = 0;
      if (snapshots.length % 25 === 0) console.log(`${snapshots.length}/${DAYS}거래일 (${ymd(day)}까지)`);
    } else if (++empty > 15) {
      throw new Error("15일 넘게 데이터가 없습니다. API를 확인하세요.");
    }
    await sleep(200);
  }
  return snapshots;
}

function writeJs(file, comment, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `// 자동 생성 파일 — scripts/fetch-data.mjs가 만든다. 직접 고치지 않는다\n// ${comment}\n${body}\n`);
}

async function main() {
  const key = readKey();
  const lastDate = process.argv.includes("--backfill") ? null : readLastDate();
  const histories = lastDate ? readHistories() : {};
  const snapshots = lastDate ? await fetchNewDays(key, lastDate) : await fetchYear(key);

  if (!snapshots.length) {
    console.log(`새 거래일 데이터 없음. 기준일 ${dashed(lastDate)} 그대로`);
    return;
  }

  // 일봉 이어 붙이기
  for (const rows of snapshots) {
    for (const r of rows) {
      const h = (histories[r.code] ||= []);
      const date = dashed(r.date);
      if (h.length && h[h.length - 1][0] >= date) continue; // 이미 있는 날짜
      h.push([date, r.close, r.volume]);
    }
  }

  const latest = snapshots[snapshots.length - 1];
  const date = latest[0].date;
  const byCode = Object.fromEntries(latest.map((r) => [r.code, r]));

  // 일봉 파일 쓰기. 오래 시세가 없는 종목(상장폐지 등)은 파일을 지운다
  const allDates = [...new Set(Object.values(histories).flatMap((h) => h.map((d) => d[0])))].sort();
  const staleBefore = allDates[Math.max(0, allDates.length - STALE_DAYS)];
  let removed = 0;
  for (const [code, h] of Object.entries(histories)) {
    const file = path.join(HISTORY_DIR, `${code}.js`);
    if (h[h.length - 1][0] < staleBefore) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
      delete histories[code];
      removed++;
      continue;
    }
    histories[code] = h.slice(-DAYS);
    writeJs(
      file,
      `${byCode[code]?.name || code} 일봉 [날짜, 종가, 거래량] · 출처: 금융위원회_주식시세정보(공공데이터포털)`,
      `(window.LIVE_HISTORY = window.LIVE_HISTORY || {})["${code}"] = ${JSON.stringify(histories[code])};`
    );
  }

  // 전 종목 최신 시세 (종목 상세·검색용). [이름, 시장, 종가, 전일 대비, 등락률, 시가총액(조원), 거래량, 거래대금(억원)]
  const allStocks = Object.fromEntries(
    latest.map((r) => [
      r.code,
      [r.name, r.market, r.close, r.diff, r.change, round2(r.cap / 1e12), r.volume, Math.round(r.value / 1e8)],
    ])
  );
  writeJs(
    path.join(ROOT, "data/stocks.js"),
    "전 종목 최신 시세 [이름, 시장, 종가, 전일 대비, 등락률, 시가총액(조원), 거래량, 거래대금(억원)] · 출처: 금융위원회_주식시세정보(공공데이터포털)",
    `window.STOCKS = ${JSON.stringify({ date: dashed(date), stocks: allStocks })};`
  );

  // 히트맵 70종목 상세
  const stocks = {};
  const missing = [];
  for (const s of readUniverse()) {
    const r = byCode[s.code];
    const h = histories[s.code];
    if (!r || !h || h.length < 22) {
      missing.push(s.name);
      continue;
    }
    const closes = h.map((d) => d[1]);
    const ago = (n) => closes[closes.length - 1 - n];
    stocks[s.code] = {
      date: r.date,
      price: r.close,
      diff: r.diff,
      change: [r.change, round2((r.close / ago(5) - 1) * 100), round2((r.close / ago(21) - 1) * 100)],
      cap: round2(r.cap / 1e12),
      volume: r.volume,
      value: Math.round(r.value / 1e8), // 거래대금(억원)
      high52: Math.max(...closes), // 52주(약 250거래일) 최고 종가
      spark: closes.slice(-SPARK_DAYS),
      // 오늘 거래량 ÷ 직전 20거래일 평균 거래량
      volRatio: round2(r.volume / (h.slice(-21, -1).reduce((sum, d) => sum + d[2], 0) / 20)),
    };
  }

  // 전체 시장 순위표. 거래대금 10억 미만은 뺀다
  const ranked = latest
    .filter((r) => r.value >= MIN_VALUE)
    .map((r) => ({ code: r.code, name: r.name, market: r.market, price: r.close, change: r.change, value: Math.round(r.value / 1e8) }));
  const top = (sorted) => sorted.slice(0, RANK_SIZE);
  const ranks = {
    gainers: top([...ranked].sort((a, b) => b.change - a.change)),
    losers: top([...ranked].sort((a, b) => a.change - b.change)),
    value: top([...ranked].sort((a, b) => b.value - a.value)),
  };

  writeJs(
    path.join(ROOT, "data/prices.js"),
    "히트맵 종목 최신 시세와 전체 시장 순위 · 출처: 금융위원회_주식시세정보(공공데이터포털)",
    `window.LIVE = ${JSON.stringify({ date: dashed(date), stocks, ranks }, null, 1)};`
  );

  console.log(
    `\n기준일 ${dashed(date)} · 전 종목 ${latest.length}개 · 일봉 파일 ${Object.keys(histories).length}개` +
      (removed ? ` · 지운 파일 ${removed}개` : "") +
      (missing.length ? ` · 히트맵 종목 중 데이터 없음: ${missing.join(", ")}` : "")
  );
}

main().catch((e) => {
  console.error(`실패: ${e.message}`);
  process.exit(1);
});
