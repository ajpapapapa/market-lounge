// 실제 시세 채우기 — data/prices.js(scripts/fetch-data.mjs가 만든 파일)의 값을 data.js의 종목 목록에 채운다
// 채우는 것: 종목 현재가·등락률(1일·1주·1개월)·시가총액·거래량·최근 60일 종가, 라운지 업종별 등락·거래량 급증
// 파일을 못 읽으면 가짜 숫자를 보여 주지 않고 안내 문구만 띄운다. 각 페이지는 LIVE_ON일 때만 그린다
// 계속 예시인 것: 지수, PER·PBR·배당·외국인 지분율, 투자자별 순매수, 시황 메모(MARKET.stocks의 note)

const LIVE_ON = typeof window.LIVE === "object" && window.LIVE !== null;
const liveStock = (code) => (LIVE_ON ? LIVE.stocks[code] : undefined);

if (LIVE_ON) {
  for (const m of Object.values(HEATMAP.markets)) {
    for (const sec of m.sectors) {
      // 데이터를 못 받은 종목(신규 상장 등)은 화면에서 뺀다
      sec.stocks = sec.stocks.filter((s) => liveStock(s.code));
      for (const s of sec.stocks) {
        const live = liveStock(s.code);
        s.change = live.change;
        s.cap = live.cap;
        QUOTES[s.code].price = live.price;
      }
    }
    m.sectors = m.sectors.filter((sec) => sec.stocks.length);
  }

  MARKET.stocks = MARKET.stocks.filter((s) => liveStock(s.code));
  MARKET.stocks.forEach((s) => {
    const live = liveStock(s.code);
    Object.assign(s, { price: live.price, change: live.change[0], spark: live.spark });
  });
  // 라운지의 거래량 급증: 히트맵 종목 중 오늘 거래량 ÷ 직전 20일 평균이 큰 순서
  MARKET.volSurge = Object.values(HEATMAP.markets)
    .flatMap((m) => m.sectors.flatMap((sec) => sec.stocks.map((s) => ({ ...s, market: m.index }))))
    .map((s) => ({ ...s, price: liveStock(s.code).price, change: s.change[0], volRatio: liveStock(s.code).volRatio }))
    .sort((a, b) => b.volRatio - a.volRatio)
    .slice(0, 5);

  // 라운지의 업종별 등락: KOSPI 업종별 시가총액 가중 1일 등락률, 가장 강한 4개와 약한 4개
  const sectors = HEATMAP.markets.kospi.sectors
    .map((sec) => {
      const total = sec.stocks.reduce((sum, s) => sum + s.cap, 0);
      const change = sec.stocks.reduce((sum, s) => sum + s.cap * s.change[0], 0) / total;
      return { name: sec.name, change: Math.round(change * 100) / 100 };
    })
    .sort((a, b) => b.change - a.change);
  MARKET.sectors = sectors.length > 8 ? [...sectors.slice(0, 4), ...sectors.slice(-4)] : sectors;

  // 라운지 대표 기사 배경: KOSPI 종목 시가총액 합계의 최근 흐름 (오늘 시가총액 × 그날 종가 / 오늘 종가)
  const kospi = HEATMAP.markets.kospi.sectors.flatMap((sec) => sec.stocks).map((s) => liveStock(s.code));
  const days = Math.min(...kospi.map((s) => s.spark.length));
  MARKET.capTrend = Array.from({ length: days }, (_, i) =>
    kospi.reduce((sum, s) => sum + (s.cap * s.spark[s.spark.length - days + i]) / s.price, 0)
  );

  MARKET.date = LIVE.date;
} else {
  // 실제 시세를 못 읽었을 때: 본문을 안내 문구로 바꾼다
  document.querySelector("main").innerHTML = `
    <div class="data-error">
      <h1>시세 데이터를 불러오지 못했습니다</h1>
      <p>잠시 뒤 새로고침해 주세요. 계속 이 화면이 나오면 data/prices.js가 만들어졌는지 확인하세요.</p>
    </div>`;
}

// 화면에 붙는 기준일·출처 문구
const PRICE_NOTE = LIVE_ON ? `${LIVE.date.replaceAll("-", ".")} 종가 기준 · 출처 금융위원회(공공데이터포털)` : "";

document.querySelectorAll(".data-note").forEach((el) => {
  el.textContent =
    "종목 시세와 순위는 금융위원회_주식시세정보(공공데이터포털)를 하루 늦게 반영합니다. 지수, PER 등, 투자자별 순매수, 시황 메모는 예시 데이터입니다.";
});

// 종목 상세에서 쓰는 1년치 일봉. 없으면 null
function loadLiveHistory(code) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `data/history/${code}.js?t=${Math.floor(Date.now() / 600000)}`;
    script.onload = () => resolve((window.LIVE_HISTORY || {})[code] || null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}
