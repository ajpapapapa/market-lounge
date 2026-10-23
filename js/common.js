// 여러 페이지가 같이 쓰는 함수

const fmt = (n, digits = 2) =>
  n.toLocaleString("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

// 한국식: 상승 빨강, 하락 파랑
const dir = (change) => (change > 0 ? "up" : change < 0 ? "down" : "flat");
const sign = (change) => (change > 0 ? "+" : "");
const arrow = (change) => (change > 0 ? "▲" : change < 0 ? "▼" : "");

const stockUrl = (code) => `stock.html?code=${code}`;

// 상단 바·왼쪽 메뉴. page는 <body data-page>와 같으면 선택된 메뉴로 표시한다
// href가 "#"인 메뉴는 아직 만들지 않은 페이지
const NAV = {
  top: [
    { label: "라운지", href: "index.html", page: "lounge" },
    { label: "시황", href: "#" },
    { label: "투자분석", href: "heatmap.html", page: "heatmap" },
    { label: "종목", href: "stock.html", page: "stock" },
    { label: "커뮤니티", href: "#" },
  ],
  side: [
    {
      title: "즐겨찾기",
      links: [
        { label: "공지사항", href: "#" },
        { label: "오늘의 시황", href: "#" },
        { label: "종목 조회", href: "stock.html", page: "stock" },
        { label: "실시간 속보", href: "#" },
      ],
    },
    {
      title: "콘텐츠",
      links: [
        { label: "라운지", href: "index.html", page: "lounge" },
      ],
    },
    {
      title: "투자분석",
      links: [
        { label: "섹터 히트맵", href: "heatmap.html", page: "heatmap" },
        { label: "투자자별 매매동향", href: "#" },
        { label: "경제지표 캘린더", href: "#" },
        { label: "실적발표 캘린더", href: "#" },
      ],
    },
    {
      title: "커뮤니티",
      links: [
        { label: "자유게시판", href: "#" },
        { label: "종목 토론", href: "#" },
      ],
    },
  ],
};

function renderNav() {
  const page = document.body.dataset.page;
  const link = (l) => {
    if (l.href === "#") return `<a href="#" class="soon">${l.label}</a>`;
    return `<a href="${l.href}"${l.page === page ? ' class="on"' : ""}>${l.label}</a>`;
  };
  document.getElementById("gnb-menu").innerHTML = NAV.top.map(link).join("");
  document.getElementById("sidebar").innerHTML = NAV.side
    .map((g) => `<div class="side-group"><p class="side-title">${g.title}</p>${g.links.map(link).join("")}</div>`)
    .join("");

  // 아직 없는 페이지는 눌러도 맨 위로 튀지 않게 막는다
  document.querySelectorAll("a.soon").forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));
}

// 모바일에서 왼쪽 메뉴 열고 닫기
function setupMenu() {
  const toggle = () => document.body.classList.toggle("menu-open");
  document.getElementById("menu-toggle").addEventListener("click", toggle);
  document.getElementById("dim").addEventListener("click", toggle);
}

renderNav();
setupMenu();
