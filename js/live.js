// 실제 시세 덮어쓰기 — data/prices.js(scripts/fetch-data.mjs가 만든 파일)가 있으면 예시 데이터 위에 덮어쓴다
// 파일이 없거나 못 읽으면 data.js의 예시 데이터를 그대로 쓴다
// 실제 값으로 바뀌는 것: 종목 현재가·등락률(1일·1주·1개월)·시가총액·거래량, 종목 상세의 1년치 일봉
// 라운지의 업종별 등락도 실제 등락률로 다시 계산한다
// 계속 예시인 것: 지수, PER·PBR·배당·외국인 지분율, 업종 분류, 기사, 투자자별 순매수

const LIVE_ON = typeof window.LIVE === "object" && window.LIVE !== null;

if (LIVE_ON) {
  const nameToCode = {};
  for (const m of Object.values(HEATMAP.markets)) {
    for (const sec of m.sectors) {
      for (const s of sec.stocks) {
        nameToCode[s.name] = s.code;
        const live = LIVE.stocks[s.code];
        if (!live) continue;
        s.change = live.change;
        s.cap = live.cap;
        QUOTES[s.code].price = live.price;
      }
    }
  }

  MARKET.stocks.forEach((s) => {
    const live = LIVE.stocks[s.code];
    if (live) Object.assign(s, { price: live.price, change: live.change[0] });
  });
  MARKET.articles.forEach((a) => {
    const live = LIVE.stocks[nameToCode[a.stock]];
    if (live) a.change = live.change[0];
  });

  // 라운지의 업종별 등락: KOSPI 업종별 시가총액 가중 1일 등락률, 가장 강한 4개와 약한 4개
  const sectors = HEATMAP.markets.kospi.sectors
    .map((sec) => {
      const total = sec.stocks.reduce((sum, s) => sum + s.cap, 0);
      const change = sec.stocks.reduce((sum, s) => sum + s.cap * s.change[0], 0) / total;
      return { name: sec.name, change: Math.round(change * 100) / 100 };
    })
    .sort((a, b) => b.change - a.change);
  MARKET.sectors = sectors.length > 8 ? [...sectors.slice(0, 4), ...sectors.slice(-4)] : sectors;

  MARKET.date = LIVE.date;
  HEATMAP.time = LIVE.date;
}

// 화면에 붙는 기준일·출처 문구
const PRICE_NOTE = LIVE_ON
  ? `${LIVE.date.replaceAll("-", ".")} 종가 기준 · 출처 금융위원회(공공데이터포털)`
  : `${HEATMAP.time.replaceAll("-", ".")} 기준 · 예시 데이터`;

document.querySelectorAll(".data-note").forEach((el) => {
  el.textContent = LIVE_ON
    ? "종목 시세는 금융위원회_주식시세정보(공공데이터포털)를 하루 늦게 반영합니다. 지수, 기사, PER 등 나머지 항목은 예시 데이터입니다."
    : "화면의 시세와 기사는 예시 데이터입니다.";
});

// 종목 상세에서 쓰는 1년치 일봉. 없으면 null
function loadLiveHistory(code) {
  return new Promise((resolve) => {
    if (!LIVE_ON) return resolve(null);
    const script = document.createElement("script");
    script.src = `data/history/${code}.js`;
    script.onload = () => resolve((window.LIVE_HISTORY || {})[code] || null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}
