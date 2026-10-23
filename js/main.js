// 라운지 화면 그리기 — 데이터는 data.js의 MARKET에서 가져온다 (종목 시세와 작은 차트는 live.js가 채운 실제 값)
// fmt, dir, sign, arrow는 common.js에 있다

function sparkline(series, width, height, cls) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const x = (i) => (i / (series.length - 1)) * width;
  const y = (v) => height - ((v - min) / (max - min || 1)) * (height - 4) - 2;
  const d = series.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const base = y(series[0]).toFixed(1);
  return `<svg class="spark ${cls}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
    <line x1="0" y1="${base}" x2="${width}" y2="${base}" class="spark-base" />
    <path d="${d}" />
  </svg>`;
}

function renderTicker() {
  document.getElementById("today").textContent = MARKET.date.replaceAll("-", ".");
  document.getElementById("ticker").innerHTML = MARKET.indices
    .map(
      (i) => `<li>
        <span class="t-name">${i.name}</span>
        <strong>${fmt(i.value, i.value < 100 ? 3 : 2)}</strong>
        <span class="${dir(i.change)}">${sign(i.change)}${fmt(i.change)}% ${arrow(i.change)}</span>
      </li>`
    )
    .join("");
}

// 대표 영역: 실제 시세로 만드는 전일 시장 요약 (KOSPI 히트맵 종목 기준)
function renderHero() {
  const pct = (n) => `${sign(n)}${fmt(n)}%`;
  const sectors = HEATMAP.markets.kospi.sectors
    .map((sec) => {
      const total = sec.stocks.reduce((sum, s) => sum + s.cap, 0);
      return { name: sec.name, change: sec.stocks.reduce((sum, s) => sum + s.cap * s.change[0], 0) / total };
    })
    .sort((a, b) => b.change - a.change);
  const stocks = HEATMAP.markets.kospi.sectors.flatMap((sec) => sec.stocks);
  const up = stocks.filter((s) => s.change[0] > 0).length;
  const down = stocks.filter((s) => s.change[0] < 0).length;
  const trend = MARKET.capTrend;
  const capChange = (trend[trend.length - 1] / trend[trend.length - 2] - 1) * 100;

  // 오른 종목이 많으면 강한 업종 두 개, 내린 종목이 많으면 약한 업종 두 개를 제목에 쓴다
  const [a, b] = up >= down ? sectors : [...sectors].reverse();
  const title =
    up >= down
      ? `${a.name}·${b.name} 강세, 시가총액 상위 ${stocks.length}종목 중 ${up}종목 상승`
      : `${a.name}·${b.name} 약세, 시가총액 상위 ${stocks.length}종목 중 ${down}종목 하락`;

  const hero = document.getElementById("hero");
  hero.href = "heatmap.html";
  hero.innerHTML = `
    ${sparkline(trend, 800, 260, "hero-chart")}
    <div class="hero-text">
      <span class="hero-tag">전일 시장 요약</span>
      <h1>${title}</h1>
      <p class="hero-sub">
        시가총액 합계 <b class="${dir(capChange)}">${pct(capChange)}</b>
        · ${a.name} <b class="${dir(a.change)}">${pct(a.change)}</b>
        · ${b.name} <b class="${dir(b.change)}">${pct(b.change)}</b>
      </p>
      <span class="hero-time">${PRICE_NOTE} · 자동 생성</span>
    </div>`;
}

function renderArticles() {
  document.getElementById("article-list").innerHTML = MARKET.articles
    .map((a, idx) => {
      // 시세를 못 받은 종목은 썸네일에 이름만 남긴다
      const quote = a.spark
        ? `<span class="${dir(a.change)}">${sign(a.change)}${fmt(a.change)}%</span>
            ${sparkline(a.spark.slice(-30), 100, 34, dir(a.change))}`
        : "";
      return `<li>
        <a href="#">
          <span class="num">${idx + 1}</span>
          <div class="a-body">
            <p class="a-title">${a.title}</p>
            <p class="a-meta"><span class="chip">${a.tag}</span>${a.time}</p>
          </div>
          <div class="thumb">
            <span class="thumb-name">${a.stock}</span>
            ${quote}
          </div>
        </a>
      </li>`;
    })
    .join("");
}

function renderStocks() {
  const row = document.getElementById("stock-row");
  row.innerHTML = MARKET.stocks
    .map(
      (s) => `<a href="${stockUrl(s.code)}" class="stock-card">
        <div class="s-head">
          <strong>${s.name}</strong>
          <span class="code">${s.code}</span>
        </div>
        <p class="s-price">${s.price.toLocaleString("ko-KR")}<small>원</small></p>
        <p class="${dir(s.change)}">${sign(s.change)}${fmt(s.change)}% ${arrow(s.change)}</p>
        ${sparkline(s.spark.slice(-40), 220, 48, dir(s.change))}
        <p class="s-note">${s.note}</p>
      </a>`
    )
    .join("");

  document.querySelectorAll("[data-scroll]").forEach((btn) =>
    btn.addEventListener("click", () => {
      row.scrollBy({ left: Number(btn.dataset.scroll) * row.clientWidth * 0.8, behavior: "smooth" });
    })
  );
}

function renderSectors() {
  const maxAbs = Math.max(...MARKET.sectors.map((s) => Math.abs(s.change)));
  document.getElementById("sector-list").innerHTML = MARKET.sectors
    .map((s) => {
      const w = (Math.abs(s.change) / maxAbs) * 50;
      return `<li>
        <span class="sec-name">${s.name}</span>
        <span class="sec-bar"><i class="${dir(s.change)}" style="width:${w}%"></i></span>
        <span class="sec-val ${dir(s.change)}">${sign(s.change)}${fmt(s.change)}%</span>
      </li>`;
    })
    .join("");
}

function renderFlows() {
  const cell = (n) => `<td class="${dir(n)}">${sign(n)}${n.toLocaleString("ko-KR")}</td>`;
  document.getElementById("flow-table").innerHTML = `
    <thead><tr><th></th><th>오늘</th><th>최근 5일</th></tr></thead>
    <tbody>${MARKET.flows.map((f) => `<tr><th>${f.who}</th>${cell(f.today)}${cell(f.week)}</tr>`).join("")}</tbody>`;
}

// 한 구역에서 오류가 나도 나머지 구역은 그린다
function safely(render) {
  try {
    render();
  } catch (e) {
    console.error(`${render.name} 실패`, e);
  }
}

if (LIVE_ON) {
  [renderTicker, renderHero, renderArticles, renderStocks, renderSectors, renderFlows].forEach(safely);
}
