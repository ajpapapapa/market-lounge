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

// 전일 순위표. 상승률·하락률·거래대금은 전체 시장(KOSPI·KOSDAQ, 거래대금 10억 이상), 거래량 급증은 히트맵 종목
function renderRanks() {
  const won = (n) => n.toLocaleString("ko-KR");
  const pctCell = (n) => `<td class="${dir(n)}">${sign(n)}${fmt(n)}%</td>`;
  // 종목 상세가 있는 종목(히트맵 종목)만 링크를 건다
  const nameCell = (s) => (liveStock(s.code) ? `<a href="${stockUrl(s.code)}">${s.name}</a>` : s.name);
  const priceCells = (s) => `<td>${won(s.price)}</td>${pctCell(s.change)}`;
  const tables = [
    { title: "상승률 상위", sub: "전체 시장", rows: LIVE.ranks.gainers, cols: ["종가", "등락률"], cells: priceCells },
    { title: "하락률 상위", sub: "전체 시장", rows: LIVE.ranks.losers, cols: ["종가", "등락률"], cells: priceCells },
    {
      title: "거래대금 상위",
      sub: "전체 시장 · 억원",
      rows: LIVE.ranks.value,
      cols: ["등락률", "거래대금"],
      cells: (s) => `${pctCell(s.change)}<td>${won(s.value)}</td>`,
    },
    {
      title: "거래량 급증",
      sub: "히트맵 종목 · 20일 평균 대비",
      rows: MARKET.volSurge,
      cols: ["등락률", "거래량"],
      cells: (s) => `${pctCell(s.change)}<td>${fmt(s.volRatio, 1)}배</td>`,
    },
  ];

  document.getElementById("rank-sub").textContent = `${PRICE_NOTE} · 코넥스와 거래대금 10억원 미만 종목 제외`;
  document.getElementById("rank-grid").innerHTML = tables
    .map(
      (t) => `<div>
        <div class="rank-head"><h3>${t.title}</h3><span class="sub">${t.sub}</span></div>
        <table class="rank-table">
          <thead><tr><th class="r-num"></th><th class="r-name">종목</th>${t.cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
          <tbody>${t.rows
            .map(
              (s, i) => `<tr>
                <td class="r-num">${i + 1}</td>
                <td class="r-name">${nameCell(s)}<small>${s.market}</small></td>
                ${t.cells(s)}
              </tr>`
            )
            .join("")}</tbody>
        </table>
      </div>`
    )
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
  [renderTicker, renderHero, renderRanks, renderStocks, renderSectors, renderFlows].forEach(safely);
}
