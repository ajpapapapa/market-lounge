// 공공데이터포털 '금융위원회_주식시세정보'에서 종목별 일별 시세를 받아 data/ 폴더에 저장한다
// 실행: node scripts/fetch-data.mjs
// 인증키는 환경변수 DATA_GO_KR_KEY, 없으면 프로젝트 루트의 .env 파일(DATA_GO_KR_KEY=...)에서 읽는다
// GitHub Actions가 평일마다 실행한다 (.github/workflows/update-data.yml)
//
// 만드는 파일 (브라우저에서 file://로 열어도 되도록 JSON 대신 <script>로 읽는 .js로 저장)
//   data/prices.js          종목별 최신 시세, 1일·1주·1개월 등락률, 최근 60일 종가 → window.LIVE
//   data/history/<코드>.js  종목별 1년치 일봉 [날짜, 종가, 거래량] → window.LIVE_HISTORY

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2";
const DAYS = 250; // 1년 ≈ 250거래일
const SPARK_DAYS = 60; // 라운지 작은 차트용 최근 종가 개수

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ymd = (d) => d.toISOString().slice(0, 10).replaceAll("-", "");
const dashed = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
const round2 = (n) => Math.round(n * 100) / 100;

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

// 받을 종목 목록은 화면과 같은 js/data.js의 HEATMAP에서 가져온다
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
      return Array.isArray(item) ? item : [item];
    } catch (e) {
      lastError = e;
      // 인증키 문제는 다시 해도 안 되므로 바로 멈춘다
      if (e.message.startsWith("접근 거부")) break;
      await sleep(1500 * attempt);
    }
  }
  throw lastError;
}

async function fetchHistory(key, code) {
  const begin = new Date();
  begin.setDate(begin.getDate() - 380);
  const rows = await call(key, { likeSrtnCd: code, beginBasDt: ymd(begin), numOfRows: "400", pageNo: "1" });
  return rows
    .filter((r) => r.srtnCd.replace(/\D/g, "").slice(-6) === code)
    .map((r) => ({
      date: r.basDt,
      close: Number(r.clpr),
      diff: Number(r.vs),
      change: Number(r.fltRt),
      volume: Number(r.trqu),
      cap: Number(r.mrktTotAmt),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-DAYS);
}

function writeJs(file, comment, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `// 자동 생성 파일 — scripts/fetch-data.mjs가 만든다. 직접 고치지 않는다\n// ${comment}\n${body}\n`);
}

async function main() {
  const key = readKey();
  const universe = readUniverse();
  const stocks = {};
  const failed = [];

  for (const s of universe) {
    try {
      const h = await fetchHistory(key, s.code);
      if (h.length < 22) throw new Error(`일봉이 ${h.length}개뿐`);
      const last = h[h.length - 1];
      const ago = (n) => h[h.length - 1 - n].close;
      stocks[s.code] = {
        date: last.date,
        price: last.close,
        diff: last.diff,
        change: [last.change, round2((last.close / ago(5) - 1) * 100), round2((last.close / ago(21) - 1) * 100)],
        cap: round2(last.cap / 1e12),
        volume: last.volume,
        spark: h.slice(-SPARK_DAYS).map((d) => d.close),
      };
      writeJs(
        path.join(ROOT, "data/history", `${s.code}.js`),
        `${s.name} 일봉 [날짜, 종가, 거래량] · 출처: 금융위원회_주식시세정보(공공데이터포털)`,
        `(window.LIVE_HISTORY = window.LIVE_HISTORY || {})["${s.code}"] = ${JSON.stringify(
          h.map((d) => [dashed(d.date), d.close, d.volume])
        )};`
      );
      console.log(`✓ ${s.name} ${last.date} ${last.close.toLocaleString()}원 ${last.change}%`);
    } catch (e) {
      // 인증키 문제면 나머지 종목도 다 실패하므로 바로 멈춘다
      if (e.message.startsWith("접근 거부")) throw e;
      failed.push(s.name);
      console.log(`✗ ${s.name}: ${e.message}`);
    }
    await sleep(150);
  }

  if (!Object.keys(stocks).length) throw new Error("받은 종목이 하나도 없습니다.");

  // 종목마다 기준일이 다를 수 있어(거래정지 등) 가장 최근 날짜를 기준일로 쓴다
  const date = Object.values(stocks)
    .map((s) => s.date)
    .sort()
    .at(-1);
  writeJs(
    path.join(ROOT, "data/prices.js"),
    "종목별 최신 시세 · 출처: 금융위원회_주식시세정보(공공데이터포털)",
    `window.LIVE = ${JSON.stringify({ date: dashed(date), stocks }, null, 1)};`
  );

  console.log(`\n기준일 ${dashed(date)} · ${Object.keys(stocks).length}종목 저장${failed.length ? ` · 실패 ${failed.join(", ")}` : ""}`);
}

main().catch((e) => {
  console.error(`실패: ${e.message}`);
  process.exit(1);
});
