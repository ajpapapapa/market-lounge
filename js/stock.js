// 종목 상세 — 종목·업종은 data.js의 HEATMAP, 시세는 live.js가 채운 실제 값, 일봉은 data/history/<코드>.js
// PER·PBR·배당·외국인 지분율은 data.js QUOTES의 예시 값
// fmt, dir, sign, arrow, stockUrl은 common.js에, PRICE_NOTE, loadLiveHistory는 live.js에 있다

// 모든 종목을 시장·업종 정보와 함께 펼쳐 둔다
const ALL = Object.values(HEATMAP.markets).flatMap((m) =>
  m.sectors.flatMap((sec) =>
    sec.stocks.map((s) => ({ ...s, ...QUOTES[s.code], market: m.index, sector: sec.name }))
  )
);

const askedCode = new URLSearchParams(location.search).get("code");
const found = ALL.find((s) => s.code === askedCode);
const stock = found || ALL[0];

const won = (n) => Math.round(n).toLocaleString("ko-KR");
const pct = (n) => `${sign(n)}${fmt(n)}%`;
const dayName = ["일", "월", "화", "수", "목", "금", "토"];
const dateText = (d) =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

let history = [];

// i번째 날의 등락률. 마지막 날은 라운지·히트맵과 같은 공식 등락률을 쓴다
const changeAt = (i) =>
  i === history.length - 1 ? stock.change[0] : (history[i].close / history[i - 1].close - 1) * 100;
let range = 63;

const chartBox = document.getElementById("chart");
const chartTip = document.getElementById("chart-tip");

function renderHead() {
  const prev = history[history.length - 2].close;
  const diff = stock.price - prev;
  document.title = `${stock.name} | 시장노트`;
  document.getElementById("stock-head").innerHTML = `
    ${found || !askedCode ? "" : `<p class="stock-missing">종목코드 ${askedCode}의 예시 데이터가 없어 ${stock.name} 화면을 대신 보여 줍니다.</p>`}
    <p class="stock-path">${stock.market} · ${stock.sector}</p>
    <div class="stock-title"><h1>${stock.name}</h1><span class="code">${stock.code}</span></div>
    <p class="stock-price">
      <strong>${won(stock.price)}</strong><small>원</small>
      <span class="${dir(diff)}">전일 대비 ${arrow(diff)} ${won(Math.abs(diff))} (${pct(stock.change[0])})</span>
    </p>
    <p class="stock-time">${PRICE_NOTE}</p>`;
}

// x축 눈금: 짧은 기간은 주 첫 거래일, 긴 기간은 달 첫 거래일. 너무 많으면 건너뛴다
function xTicks(data, max) {
  const long = range >= 126;
  const starts = data
    .map((d, i) => i)
    .filter((i) => {
      if (i === 0) return false;
      const [a, b] = [data[i - 1].date, data[i].date];
      return long ? a.getMonth() !== b.getMonth() : b.getDay() < a.getDay();
    });
  const step = Math.ceil(starts.length / max);
  return starts
    .filter((_, k) => k % step === 0)
    .map((i) => {
      const d = data[i].date;
      const label = !long
        ? `${d.getMonth() + 1}.${d.getDate()}`
        : d.getMonth() === 0
          ? `${d.getFullYear()}년`
          : `${d.getMonth() + 1}월`;
      return { i, label };
    });
}

function renderChart() {
  const data = history.slice(-range);
  const offset = history.length - data.length;
  const width = chartBox.clientWidth;
  const narrow = width < 600;
  const m = { top: 20, right: 0, bottom: 26 };
  const priceH = narrow ? 200 : 260;
  const volH = 56;
  const volTop = m.top + priceH + 16;
  const height = volTop + volH + m.bottom;
  const [lo, hi] = d3.extent(data, (d) => d.close);
  const pad = (hi - lo) * 0.1 || hi * 0.01;
  const y = d3.scaleLinear().domain([lo - pad, hi + pad]).nice(5).range([m.top + priceH, m.top]);
  // 오른쪽 여백은 가장 긴 가격 글자(굵은 12px 숫자 약 7.5px)에 맞춘다
  m.right = Math.max(56, won(y.domain()[1]).length * 7.5 + 14);
  const innerW = width - m.right;
  const x = d3.scaleLinear().domain([0, data.length - 1]).range([0, innerW]);
  const v = d3.scaleLinear().domain([0, d3.max(data, (d) => d.volume)]).range([volTop + volH, volTop]);

  const start = data[0].close;
  const end = data[data.length - 1].close;
  const trend = dir(end - start);

  const cap = document.getElementById("chart-cap");
  cap.className = `sub ${trend}`;
  cap.textContent = `${range === 250 ? "1년" : `${Math.round(range / 21)}개월`} ${pct((end / start - 1) * 100)}`;

  const svg = d3.select(chartBox).html("").append("svg").attr("width", width).attr("height", height);

  // 가로 눈금선과 오른쪽 가격 축. 현재가 표시와 겹치는 숫자는 뺀다
  const yTicks = y.ticks(5);
  const axisTicks = yTicks.filter((d) => Math.abs(y(d) - y(end)) > 18);
  svg
    .append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(yTicks)
    .join("line")
    .attr("x1", 0)
    .attr("x2", innerW)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d));
  svg
    .append("g")
    .attr("class", "axis")
    .selectAll("text")
    .data(axisTicks)
    .join("text")
    .attr("x", innerW + 8)
    .attr("y", (d) => y(d) + 4)
    .text(won);

  // 아래 날짜 축
  svg
    .append("g")
    .attr("class", "axis")
    .selectAll("text")
    .data(xTicks(data, narrow ? 4 : 7))
    .join("text")
    .attr("x", (d) => x(d.i))
    .attr("y", height - 6)
    .attr("text-anchor", "middle")
    .text((d) => d.label);

  // 기간 시작가 점선
  svg.append("line").attr("class", "base").attr("x1", 0).attr("x2", innerW).attr("y1", y(start)).attr("y2", y(start));

  // 거래량 막대
  const barW = Math.max(1, (innerW / data.length) * 0.7);
  svg.append("text").attr("class", "axis vol-label").attr("x", 0).attr("y", volTop - 4).text("거래량");
  svg
    .append("g")
    .attr("class", "vol")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", (d, i) => x(i) - barW / 2)
    .attr("y", (d) => v(d.volume))
    .attr("width", barW)
    .attr("height", (d) => volTop + volH - v(d.volume));

  // 주가 선
  svg
    .append("path")
    .attr("class", `price-line ${trend}`)
    .attr(
      "d",
      d3
        .line()
        .x((d, i) => x(i))
        .y((d) => y(d.close))(data)
    );

  // 기간 최고·최저 표시
  const extremes = [
    { i: d3.maxIndex(data, (d) => d.close), label: "최고", dy: -8 },
    { i: d3.minIndex(data, (d) => d.close), label: "최저", dy: 16 },
  ];
  svg
    .append("g")
    .selectAll("text")
    .data(extremes)
    .join("text")
    .attr("class", "extreme")
    .attr("x", (d) => x(d.i))
    .attr("y", (d) => y(data[d.i].close) + d.dy)
    .attr("text-anchor", (d) => (x(d.i) < 60 ? "start" : x(d.i) > innerW - 60 ? "end" : "middle"))
    .text((d) => `${d.label} ${won(data[d.i].close)}`);

  // 오른쪽 축의 현재가 표시
  const tag = svg.append("g").attr("class", `last-tag ${trend}`).attr("transform", `translate(${innerW + 2},${y(end)})`);
  tag.append("rect").attr("x", 0).attr("y", -10).attr("width", m.right - 2).attr("height", 20).attr("rx", 3);
  tag.append("text").attr("x", 6).attr("y", 4).text(won(end));

  // 마우스를 올리면 세로선과 그날 시세를 보여 준다
  const cross = svg.append("g").attr("class", "cross").style("display", "none");
  const crossLine = cross.append("line").attr("y1", m.top).attr("y2", volTop + volH);
  const dot = cross.append("circle").attr("r", 4).attr("class", `dot ${trend}`);

  function show(event) {
    const [px] = d3.pointer(event);
    const i = Math.max(0, Math.min(data.length - 1, Math.round(x.invert(px))));
    const d = data[i];
    const gi = offset + i;

    cross.style("display", null);
    crossLine.attr("x1", x(i)).attr("x2", x(i));
    dot.attr("cx", x(i)).attr("cy", y(d.close));

    chartTip.innerHTML = `
      <p class="tip-sub">${dateText(d.date)} (${dayName[d.date.getDay()]})</p>
      <table>
        <tr><th>종가</th><td>${won(d.close)}</td></tr>
        ${gi ? `<tr><th>전일 대비</th><td class="${dir(changeAt(gi))}">${pct(changeAt(gi))}</td></tr>` : ""}
        <tr><th>거래량</th><td>${won(d.volume)}</td></tr>
      </table>`;
    chartTip.hidden = false;
    // 세로선 오른쪽에 띄우고, 공간이 모자라면 왼쪽으로
    const left = x(i) + 12 + chartTip.offsetWidth > innerW ? x(i) - 12 - chartTip.offsetWidth : x(i) + 12;
    chartTip.style.transform = `translate(${left}px, ${m.top}px)`;
  }

  function hide() {
    cross.style("display", "none");
    chartTip.hidden = true;
  }

  svg
    .append("rect")
    .attr("class", "hit")
    .attr("width", innerW)
    .attr("height", height)
    .on("pointermove pointerdown", show)
    .on("pointerleave", (e) => {
      if (e.pointerType === "mouse") hide();
    });

  chartTip.hidden = true;
}

function renderMetrics() {
  const year = history.map((d) => d.close);
  const items = [
    ["시가총액", `${fmt(stock.cap, stock.cap < 10 ? 1 : 0)}조원`],
    ["거래량", `${won(history[history.length - 1].volume)}주`],
    ["52주 최고", `${won(Math.max(...year))}원`],
    ["52주 최저", `${won(Math.min(...year))}원`],
    ["PER", stock.per === null ? "적자" : `${fmt(stock.per)}배`],
    ["PBR", `${fmt(stock.pbr)}배`],
    ["배당수익률", `${fmt(stock.div)}%`],
    ["외국인 지분율", `${fmt(stock.foreign)}%`],
  ];
  document.getElementById("metrics").innerHTML = items
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");
}

function renderRecent() {
  const last = history.length - 1;
  const rows = [0, 1, 2, 3, 4].map((k) => last - k);
  document.getElementById("recent-table").innerHTML = `
    <thead><tr><th></th><th>종가</th><th>등락률</th><th>거래량</th></tr></thead>
    <tbody>${rows
      .map((i) => {
        const d = history[i];
        const change = changeAt(i);
        return `<tr>
          <th>${d.date.getMonth() + 1}.${d.date.getDate()} (${dayName[d.date.getDay()]})</th>
          <td>${won(d.close)}</td>
          <td class="${dir(change)}">${pct(change)}</td>
          <td>${won(d.volume)}</td>
        </tr>`;
      })
      .join("")}</tbody>`;
}

function renderRelated() {
  // 라운지 전일 순위표·주목 종목에 이 종목이 들었으면 몇 위인지 보여 준다
  const rankLists = [
    ["전일 주목 종목(거래대금)", MARKET.stocks],
    ["상승률 상위", LIVE.ranks.gainers],
    ["하락률 상위", LIVE.ranks.losers],
    ["거래대금 상위", LIVE.ranks.value],
    ["거래량 급증", MARKET.volSurge],
  ];
  const ranked = rankLists
    .map(([title, rows]) => [title, rows.findIndex((s) => s.code === stock.code)])
    .filter(([, i]) => i >= 0);
  const items = [
    ...ranked.map(
      ([title, i]) =>
        `<li><span class="chip">전일 순위</span><a href="index.html" class="r-title">${title} ${i + 1}위</a><span class="r-time">${LIVE.date.replaceAll("-", ".")}</span></li>`
    ),
  ];
  document.getElementById("related").innerHTML = items.length
    ? items.join("")
    : `<li class="empty">이 종목을 다룬 콘텐츠가 아직 없습니다.</li>`;
}

function renderPeers() {
  const peers = ALL.filter((s) => s.market === stock.market && s.sector === stock.sector).sort((a, b) => b.cap - a.cap);
  document.getElementById("peer-title").textContent = `같은 업종 종목 · ${stock.sector}`;
  const table = document.getElementById("peer-table");
  table.innerHTML = `
    <thead><tr><th>종목</th><th>현재가</th><th>등락률</th><th>시가총액</th><th class="hide-sm">PER</th></tr></thead>
    <tbody>${peers
      .map(
        (s) => `<tr class="${s.code === stock.code ? "on" : ""}" data-code="${s.code}">
          <td><a href="${stockUrl(s.code)}">${s.name}</a></td>
          <td>${won(s.price)}</td>
          <td class="${dir(s.change[0])}">${pct(s.change[0])}</td>
          <td>${fmt(s.cap, s.cap < 10 ? 1 : 0)}조</td>
          <td class="hide-sm">${s.per === null ? "적자" : fmt(s.per)}</td>
        </tr>`
      )
      .join("")}</tbody>`;

  // 줄 어디를 눌러도 그 종목으로 간다
  table.querySelectorAll("tbody tr").forEach((tr) =>
    tr.addEventListener("click", () => {
      if (tr.dataset.code !== stock.code) location.href = stockUrl(tr.dataset.code);
    })
  );
}

// 종목 검색: 목록에서 고르거나, 이름 일부·코드를 입력하고 Enter
function setupSearch() {
  const input = document.getElementById("search");
  const option = (s) => `${s.name} ${s.code}`;
  document.getElementById("stock-names").innerHTML = ALL.map((s) => `<option value="${option(s)}"></option>`).join("");

  const go = (s) => s && (location.href = stockUrl(s.code));
  input.addEventListener("input", () => go(ALL.find((s) => option(s) === input.value)));
  document.getElementById("search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim().toLowerCase();
    if (q) go(ALL.find((s) => s.code === q || s.name.toLowerCase() === q) || ALL.find((s) => option(s).toLowerCase().includes(q)));
  });

  if (location.hash === "#search") input.focus();
}

// 기간 버튼
document.querySelectorAll("#range-seg button").forEach((btn, _, all) =>
  btn.addEventListener("click", () => {
    all.forEach((b) => b.classList.toggle("on", b === btn));
    range = Number(btn.dataset.range);
    renderChart();
  })
);

if (LIVE_ON) {
  setupSearch();
  loadLiveHistory(stock.code).then(start);
}

function start(live) {
  if (!live) {
    document.getElementById("stock-head").innerHTML = `<p class="stock-missing">${stock.name}의 일봉 데이터를 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요.</p>`;
    return;
  }
  history = live.map(([date, close, volume]) => ({ date: new Date(`${date}T00:00:00`), close, volume }));

  renderHead();
  renderMetrics();
  renderRecent();
  renderRelated();
  renderPeers();

  // 화면 폭이 바뀌면 차트를 다시 그린다 (처음 한 번은 바로 그려진다)
  let lastWidth = 0;
  new ResizeObserver(() => {
    if (chartBox.clientWidth === lastWidth) return;
    lastWidth = chartBox.clientWidth;
    renderChart();
  }).observe(chartBox);
}
