# 시장노트 (가칭)

국내 주식 정보 사이트. valley.town 라운지 화면을 참고했다 (레이아웃과 분위기만 참고, 문구·로고·이미지는 가져오지 않음).

## 지금 상태
- 1단계: 예시 데이터로 화면 만들기. 라운지(메인), 섹터 히트맵, 종목 상세 페이지 완성.
- 2단계: 종목 시세를 실제 데이터로 연결 (공공데이터포털, 하루 늦은 종가, 하루 한 번 갱신). 종목 시세에는 예시 값이 남아 있지 않다. 지수·PER·기사·투자자별 순매수는 아직 예시.
- 순수 HTML/CSS/JS (프레임워크 없음). 사용자가 직접 고른 방식.
- GitHub: https://github.com/ajpapapapa/market-lounge (main 브랜치). GitHub Pages 공개 중: https://ajpapapapa.github.io/market-lounge/ (main 루트에서 배포, push하면 1~2분 뒤 반영)

## 파일
- `index.html` 라운지, `heatmap.html` 섹터 히트맵, `stock.html?code=005930` 종목 상세
- `css/style.css` 디자인 (모든 페이지 공용)
- `js/data.js` 종목 목록·업종 분류(`HEATMAP`), 시황 메모(`MARKET.stocks`), 아직 API가 없는 예시 항목(지수, 기사, 투자자별 순매수, `QUOTES`의 PER 등). 종목 가격·등락률·시가총액은 여기 없다.
- `js/common.js` 공용 함수(`fmt`, `dir`, `sign`, `arrow`, `stockUrl`), 상단·왼쪽 메뉴(`NAV`), 모바일 메뉴. 메뉴는 여기 한 곳만 고치면 된다. 선택된 메뉴는 `<body data-page>`로 정한다. `href: "#"`은 "준비 중"으로 표시.
- `js/live.js` `data/prices.js`의 실제 시세를 data.js 종목 목록에 채운다. 못 읽으면 가짜 숫자 없이 "시세 데이터를 불러오지 못했습니다"만 보여 주고, 각 페이지는 `LIVE_ON`일 때만 그린다. `PRICE_NOTE`, `loadLiveHistory`도 여기.
- `js/main.js` 라운지 화면. 작은 차트는 실제 최근 종가(`spark`), 대표 기사 배경은 KOSPI 종목 시가총액 합계 흐름(`MARKET.capTrend`).
- `js/stock.js` 종목 상세. 일봉은 `data/history/<코드>.js`.
- `js/heatmap.js` 히트맵 화면. D3 treemap(cdnjs, d3 7.9.0). 칸 크기 시가총액, 색 등락률(1일 ±3%, 1주 ±6%, 1개월 ±12%에서 꽉 참).

## 실제 데이터
- 출처: 공공데이터포털 '금융위원회_주식시세정보' V2. 주소는 `https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2` (예전 `/service/GetStockSecuritiesInfoService/getStockPriceInfo`는 이 키로 안 됨)
- `scripts/fetch-data.mjs`가 `HEATMAP` 종목 70개의 1년치 일봉을 받아 `data/prices.js`, `data/history/<코드>.js`로 저장. 파일은 JSON 대신 .js(file://에서도 열리도록). `data/`는 자동 생성이라 직접 고치지 않는다.
- 인증키: 로컬은 `.env`(`DATA_GO_KR_KEY=`, gitignore됨), GitHub는 Secrets의 `DATA_GO_KR_KEY`. 키를 코드·커밋·채팅에 남기지 않는다.
- `.github/workflows/update-data.yml`이 평일 18:00(KST)에 실행해 바뀐 data/를 커밋 → Pages 자동 반영. Actions 탭에서 수동 실행도 가능.
- 이 API에 없는 것: 지수, PER·PBR·배당, 외국인 지분율, 업종 분류. 지수는 '금융위원회_지수시세정보'를 따로 신청하면 됨.

## 디자인 원칙 (AI 티 안 나게)
- 모서리 4~6px, 그라데이션·그림자·이모지·화살표 버튼·과한 애니메이션 쓰지 않음
- 카드보다 선과 여백으로 구분, 정보 밀도 높게
- 한국식 색: 상승 빨강(`--up`), 하락 파랑(`--down`)
- 폰트 Pretendard

## 다음 후보
- 지수 실제 데이터 (금융위원회_지수시세정보)
- 실시간 시세가 필요해지면 증권사 API(KIS, 키움) + 서버(Vercel). 로그인/DB는 Supabase.

## 주의
- 실시간 시세를 공개 서비스로 보여주려면 KRX 시세 이용 계약 확인 필요
- 유료로 종목 추천·투자 조언을 하면 유사투자자문업 신고 필요
- 다른 언론사 기사 본문을 그대로 가져오지 않음
