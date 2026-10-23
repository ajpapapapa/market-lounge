// 섹터 히트맵 — 데이터는 data.js의 HEATMAP에서 가져온다
// fmt, dir, sign, arrow는 common.js에 있다

// 기간이 길수록 등락 폭이 커서 색이 꽉 차는 범위를 넓힌다 (1일, 1주, 1개월)
const COLOR_RANGE = [3, 6, 12];

const state = { market: "kospi", period: 0, focus: null };

// 터치 화면에서는 첫 탭에 툴팁만 띄우고, 같은 칸을 한 번 더 누르면 상세 페이지로 간다
let tipCode = null;
let lastPointer = "mouse";

const wrap = document.getElementById("heatmap-wrap");
const box = document.getElementById("treemap");
const tip = document.getElementById("tip");

const currentMarket = () => HEATMAP.markets[state.market];

function colorScale() {
  const r = COLOR_RANGE[state.period];
  return d3.scaleLinear().domain([-r, 0, r]).range(["#1f55c8", "#3b3f46", "#d1302b"]).clamp(true);
}

// 시가총액 가중 평균 등락률
function weighted(stocks) {
  const total = d3.sum(stocks, (s) => s.cap);
  return d3.sum(stocks, (s) => s.cap * s.change[state.period]) / total;
}

// 글자 폭 어림값: 한글은 글자 크기만큼, 숫자·영문은 0.6배
function textWidth(text, size) {
  let w = 0;
  for (const ch of text) w += ch.charCodeAt(0) > 0x1100 ? size : size * 0.6;
  return w;
}

// 칸 안에 들어가는 가장 큰 글자 크기. 9px보다 작아지면 글자를 뺀다
function fitSize(text, width, height) {
  const max = Math.min(34, Math.sqrt(width * height) / 5);
  const size = Math.min(max, (width - 8) / textWidth(text, 1), height * 0.4);
  return size >= 9 ? size : 0;
}

const pct = (n) => `${sign(n)}${fmt(n)}%`;

function renderTreemap() {
  const width = box.clientWidth;
  const height = width < 600 ? Math.round(width * 1.5) : Math.max(460, Math.round(width * 0.56));
  const color = colorScale();
  const p = state.period;

  const root = d3
    .hierarchy({ children: currentMarket().sectors.map((s) => ({ name: s.name, children: s.stocks })) })
    .sum((d) => d.cap || 0)
    .sort((a, b) => b.value - a.value);

  d3
    .treemap()
    .size([width, height])
    .paddingInner((d) => (d.depth === 0 ? 3 : 1))
    .paddingTop((d) => (d.depth === 1 ? 20 : 0))
    .round(true)(root);

  const dimmed = (name) => state.focus && state.focus !== name;
  const svg = d3.select(box).html("").append("svg").attr("width", width).attr("height", height);

  // 업종 칸과 이름
  const sectors = svg
    .selectAll("g.sec")
    .data(root.children)
    .join("g")
    .attr("class", (d) => (dimmed(d.data.name) ? "sec dimmed" : "sec"))
    .on("click", (e, d) => toggleFocus(d.data.name));

  sectors
    .append("rect")
    .attr("class", "sec-bg")
    .attr("x", (d) => d.x0)
    .attr("y", (d) => d.y0)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  sectors
    .append("text")
    .attr("class", "sec-label")
    .attr("x", (d) => d.x0 + 5)
    .attr("y", (d) => d.y0 + 14)
    .text((d) => {
      const room = d.x1 - d.x0 - 10;
      const full = `${d.data.name} ${pct(weighted(d.data.children))}`;
      if (textWidth(full, 12) <= room) return full;
      return textWidth(d.data.name, 12) <= room ? d.data.name : "";
    });

  // 종목 칸
  const tiles = svg
    .selectAll("g.tile")
    .data(root.leaves())
    .join("g")
    .attr("class", (d) => (dimmed(d.parent.data.name) ? "tile dimmed" : "tile"))
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
    .on("pointerenter", function () {
      d3.select(this).raise();
    })
    .on("pointermove", showTip)
    .on("pointerdown", (e, d) => {
      lastPointer = e.pointerType;
      // 툴팁을 띄우기 전에 어떤 종목이 떠 있었는지 기억해 둔다
      e.currentTarget.dataset.tipWas = tipCode;
      showTip(e, d);
    })
    .on("pointerleave", (e) => {
      if (e.pointerType === "mouse") hideTip();
    })
    .on("click", (e, d) => {
      if (lastPointer !== "mouse" && e.currentTarget.dataset.tipWas !== d.data.code) return;
      location.href = stockUrl(d.data.code);
    });

  tiles
    .append("rect")
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("fill", (d) => color(d.data.change[p]));

  tiles.each(function (d) {
    const w = d.x1 - d.x0;
    const h = d.y1 - d.y0;
    const size = fitSize(d.data.name, w, h);
    if (!size) return;

    const change = pct(d.data.change[p]);
    const changeSize = Math.max(9, size * 0.7);
    const withChange = h > size * 2.4 && textWidth(change, changeSize) < w - 6;
    const g = d3.select(this);

    g.append("text")
      .attr("x", w / 2)
      .attr("y", withChange ? h / 2 - size * 0.1 : h / 2 + size * 0.35)
      .style("font-size", `${size}px`)
      .text(d.data.name);

    if (withChange) {
      g.append("text")
        .attr("class", "t-change")
        .attr("x", w / 2)
        .attr("y", h / 2 + changeSize * 1.05)
        .style("font-size", `${changeSize}px`)
        .text(change);
    }
  });
}

function showTip(event, d) {
  const s = d.data;
  tip.innerHTML = `
    <p class="tip-head"><strong>${s.name}</strong><span>${s.code}</span></p>
    <p class="tip-sub">${d.parent.data.name} · 시가총액 ${fmt(s.cap, s.cap < 10 ? 1 : 0)}조원</p>
    <table>
      ${HEATMAP.periods
        .map(
          (label, i) => `<tr class="${i === state.period ? "on" : ""}">
            <th>${label}</th><td class="${dir(s.change[i])}">${pct(s.change[i])}</td>
          </tr>`
        )
        .join("")}
    </table>`;
  tip.hidden = false;
  tipCode = s.code;

  // 마우스 오른쪽 아래에 띄우고, 박스 밖으로 나가면 반대쪽으로 넘긴다
  const r = wrap.getBoundingClientRect();
  let x = event.clientX - r.left + 14;
  let y = event.clientY - r.top + 14;
  if (x + tip.offsetWidth > r.width) x = Math.max(0, x - tip.offsetWidth - 28);
  if (y + tip.offsetHeight > r.height) y = Math.max(0, y - tip.offsetHeight - 28);
  tip.style.transform = `translate(${x}px, ${y}px)`;
}

function hideTip() {
  tip.hidden = true;
  tipCode = null;
}

function renderSummary() {
  const market = currentMarket();
  const idx = MARKET.indices.find((i) => i.name === market.index);
  const stocks = market.sectors.flatMap((s) => s.stocks);
  const changes = stocks.map((s) => s.change[state.period]);
  const count = (test) => changes.filter(test).length;
  const avg = weighted(stocks);

  document.getElementById("summary").innerHTML = `
    <li>
      <span class="t-name">${idx.name}</span>
      <strong>${fmt(idx.value)}</strong>
      <span class="${dir(idx.change)}">${pct(idx.change)} ${arrow(idx.change)}</span>
    </li>
    <li><span class="t-name">가중 평균 (${HEATMAP.periods[state.period]})</span><strong class="${dir(avg)}">${pct(avg)}</strong></li>
    <li><span class="t-name">상승</span><strong class="up">${count((c) => c > 0)}</strong></li>
    <li><span class="t-name">하락</span><strong class="down">${count((c) => c < 0)}</strong></li>
    <li><span class="t-name">보합</span><strong>${count((c) => c === 0)}</strong></li>`;
}

function renderLegend() {
  const r = COLOR_RANGE[state.period];
  const color = colorScale();
  document.getElementById("legend").innerHTML = d3
    .range(-r, r + 0.001, r / 3)
    .map((v) => `<span style="background:${color(v)}">${sign(v)}${fmt(v, r < 6 ? 1 : 0)}%</span>`)
    .join("");
  document.getElementById("hm-time").textContent = PRICE_NOTE;
}

function renderSectorTable() {
  const p = state.period;
  const stockCell = (s) =>
    `<a href="${stockUrl(s.code)}">${s.name}</a><small class="${dir(s.change[p])}">${pct(s.change[p])}</small>`;
  const rows = currentMarket()
    .sectors.map((s) => {
      const sorted = [...s.stocks].sort((a, b) => b.change[p] - a.change[p]);
      return {
        name: s.name,
        change: weighted(s.stocks),
        cap: d3.sum(s.stocks, (x) => x.cap),
        up: s.stocks.filter((x) => x.change[p] > 0).length,
        down: s.stocks.filter((x) => x.change[p] < 0).length,
        best: sorted[0],
        worst: sorted[sorted.length - 1],
      };
    })
    .sort((a, b) => b.change - a.change);

  const table = document.getElementById("sector-table");
  table.innerHTML = `
    <thead><tr>
      <th>업종</th><th>등락률</th><th>시가총액</th>
      <th class="hide-sm">상승 / 하락</th><th class="hide-sm">가장 강한 종목</th><th class="hide-sm">가장 약한 종목</th>
    </tr></thead>
    <tbody>${rows
      .map(
        (r) => `<tr data-sector="${r.name}" class="${state.focus === r.name ? "on" : ""}">
          <td>${r.name}</td>
          <td class="${dir(r.change)}">${pct(r.change)}</td>
          <td>${fmt(r.cap, 0)}조</td>
          <td class="hide-sm"><span class="up">${r.up}</span> / <span class="down">${r.down}</span></td>
          <td class="hide-sm">${stockCell(r.best)}</td>
          <td class="hide-sm">${stockCell(r.worst)}</td>
        </tr>`
      )
      .join("")}</tbody>`;

  table.querySelectorAll("tbody tr").forEach((tr) =>
    tr.addEventListener("click", (e) => {
      if (!e.target.closest("a")) toggleFocus(tr.dataset.sector);
    })
  );
}

function toggleFocus(name) {
  state.focus = state.focus === name ? null : name;
  render();
}

function render() {
  hideTip();
  renderSummary();
  renderTreemap();
  renderLegend();
  renderSectorTable();
}

// 시장·기간 버튼
function setupSeg(id, key, parse) {
  const buttons = document.querySelectorAll(`#${id} button`);
  buttons.forEach((btn) =>
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.toggle("on", b === btn));
      state[key] = parse(btn.dataset[key]);
      if (key === "market") state.focus = null;
      render();
    })
  );
}

setupSeg("market-seg", "market", String);
setupSeg("period-seg", "period", Number);

// 화면 폭이 바뀌면 다시 그린다
let lastWidth = 0;
new ResizeObserver(() => {
  if (box.clientWidth === lastWidth) return;
  lastWidth = box.clientWidth;
  renderTreemap();
}).observe(box);

render();
