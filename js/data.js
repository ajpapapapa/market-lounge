// 예시 데이터 — 나중에 API에서 받아온 값으로 바꾼다
const MARKET = {
  date: "2026-10-23",

  indices: [
    { name: "KOSPI", value: 5397.12, change: -2.48 },
    { name: "KOSDAQ", value: 737.11, change: -3.53 },
    { name: "KOSPI200", value: 721.4, change: -2.61 },
    { name: "원/달러", value: 1325.3, change: 0.13 },
    { name: "국고채 3년", value: 2.684, change: 0.04 },
    { name: "WTI", value: 71.82, change: 1.06 },
    { name: "금", value: 2648.5, change: 0.42 },
  ],

  hero: {
    tag: "장전 브리핑",
    title: "외국인 3거래일 연속 순매도, 반도체 대형주 약세 속 방산·조선만 버텼다",
    minutesAgo: 37,
    chartSeed: 7,
  },

  articles: [
    { title: "[장전 브리핑] 미국 기술주 급락 여파, 오늘 코스피 출발은 어디서", tag: "브리핑", time: "3시간 전", stock: "SK하이닉스", change: -4.12 },
    { title: "HBM4 공급 계약 발표 임박? 증권가가 보는 시점과 규모", tag: "분석", time: "13시간 전", stock: "삼성전자", change: -1.87 },
    { title: "[장마감 정리] 코스닥 3% 넘게 빠진 날, 이차전지만 반등한 이유", tag: "장마감", time: "18시간 전", stock: "에코프로", change: 2.35 },
    { title: "환율 1,320원대 복귀, 수출주에 정말 악재일까", tag: "매크로", time: "19시간 전", stock: "현대차", change: 0.64 },
    { title: "3분기 실적 시즌 체크리스트: 다음 주 발표 종목 12개", tag: "실적", time: "1일 전", stock: "NAVER", change: -0.92 },
    { title: "폴란드 2차 계약 이후 방산주, 지금 가격은 비싼가", tag: "분석", time: "1일 전", stock: "한화에어로스페이스", change: 3.08 },
  ],

  stocks: [
    { name: "삼성전자", code: "005930", price: 61400, change: -1.87, note: "HBM4 공급 계약 기대" },
    { name: "SK하이닉스", code: "000660", price: 198500, change: -4.12, note: "미국 반도체 급락 영향" },
    { name: "한화에어로스페이스", code: "012450", price: 412000, change: 3.08, note: "폴란드 2차 계약" },
    { name: "에코프로", code: "086520", price: 87300, change: 2.35, note: "리튬 가격 반등" },
    { name: "현대차", code: "005380", price: 231500, change: 0.64, note: "환율 효과, 3분기 실적" },
    { name: "두산에너빌리티", code: "034020", price: 24850, change: -2.16, note: "원전 수주 일정 지연" },
    { name: "NAVER", code: "035420", price: 168900, change: -0.92, note: "실적 발표 D-6" },
    { name: "셀트리온", code: "068270", price: 179200, change: 1.21, note: "미국 신제품 출시" },
  ],

  sectors: [
    { name: "방산", change: 2.84 },
    { name: "조선", change: 1.92 },
    { name: "이차전지", change: 1.15 },
    { name: "자동차", change: 0.41 },
    { name: "은행", change: -0.38 },
    { name: "인터넷", change: -1.27 },
    { name: "바이오", change: -1.64 },
    { name: "반도체", change: -3.41 },
  ],

  // 단위: 억원
  flows: [
    { who: "개인", today: 12840, week: 31255 },
    { who: "외국인", today: -9612, week: -24870 },
    { who: "기관", today: -3105, week: -6912 },
    { who: "연기금", today: 1420, week: 3880 },
  ],
};

// 섹터 히트맵 예시 데이터
// cap: 시가총액(조원), change: [1일, 1주, 1개월] 등락률(%)
const HEATMAP = {
  time: "2026-10-23 15:30",
  periods: ["1일", "1주", "1개월"],

  markets: {
    kospi: {
      index: "KOSPI",
      sectors: [
        {
          name: "반도체",
          stocks: [
            { name: "삼성전자", code: "005930", cap: 366, change: [-1.87, -3.2, 4.1] },
            { name: "SK하이닉스", code: "000660", cap: 144, change: [-4.12, -6.8, 9.5] },
            { name: "한미반도체", code: "042700", cap: 10, change: [-5.31, -8.2, 12.4] },
            { name: "DB하이텍", code: "000990", cap: 2, change: [-2.44, -3.1, 1.8] },
          ],
        },
        {
          name: "이차전지",
          stocks: [
            { name: "LG에너지솔루션", code: "373220", cap: 88, change: [1.42, 3.1, -4.2] },
            { name: "POSCO홀딩스", code: "005490", cap: 30, change: [1.12, 1.9, -2.3] },
            { name: "LG화학", code: "051910", cap: 25, change: [1.68, 2.7, -5.6] },
            { name: "삼성SDI", code: "006400", cap: 22, change: [0.95, 2.4, -7.1] },
            { name: "포스코퓨처엠", code: "003670", cap: 15, change: [2.21, 4.6, -3.9] },
          ],
        },
        {
          name: "바이오",
          stocks: [
            { name: "삼성바이오로직스", code: "207940", cap: 68, change: [-2.03, -2.8, 3.2] },
            { name: "셀트리온", code: "068270", cap: 39, change: [1.21, 0.4, -1.1] },
            { name: "유한양행", code: "000100", cap: 8, change: [-2.67, -4.1, 6.8] },
            { name: "SK바이오팜", code: "326030", cap: 7, change: [-1.94, -2.2, -3.5] },
          ],
        },
        {
          name: "자동차",
          stocks: [
            { name: "현대차", code: "005380", cap: 48, change: [0.64, 1.2, 3.4] },
            { name: "기아", code: "000270", cap: 39, change: [0.38, 0.9, 2.1] },
            { name: "현대모비스", code: "012330", cap: 21, change: [0.12, -0.4, 1.6] },
            { name: "한온시스템", code: "018880", cap: 2.5, change: [-0.87, -1.5, -6.2] },
          ],
        },
        {
          name: "은행",
          stocks: [
            { name: "KB금융", code: "105560", cap: 33, change: [-0.42, 1.1, 5.3] },
            { name: "신한지주", code: "055550", cap: 27, change: [-0.31, 0.8, 4.2] },
            { name: "하나금융지주", code: "086790", cap: 18, change: [-0.55, 0.3, 3.6] },
            { name: "우리금융지주", code: "316140", cap: 12, change: [-0.18, 0.6, 2.9] },
            { name: "카카오뱅크", code: "323410", cap: 12, change: [-1.36, -2.4, -4.8] },
          ],
        },
        {
          name: "보험",
          stocks: [
            { name: "메리츠금융지주", code: "138040", cap: 19, change: [-0.64, 0.2, 3.1] },
            { name: "삼성생명", code: "032830", cap: 18, change: [0.47, 1.3, 2.2] },
            { name: "삼성화재", code: "000810", cap: 16, change: [0.22, 0.7, 1.4] },
            { name: "DB손해보험", code: "005830", cap: 7, change: [0.38, 1.0, 2.6] },
          ],
        },
        {
          name: "인터넷·게임",
          stocks: [
            { name: "NAVER", code: "035420", cap: 27, change: [-0.92, -2.1, -3.4] },
            { name: "카카오", code: "035720", cap: 16, change: [-1.58, -3.4, -6.1] },
            { name: "크래프톤", code: "259960", cap: 15, change: [-0.74, 1.2, 4.5] },
            { name: "엔씨소프트", code: "036570", cap: 4, change: [-2.11, -3.8, -8.2] },
          ],
        },
        {
          name: "전력·에너지",
          stocks: [
            { name: "두산에너빌리티", code: "034020", cap: 16, change: [-2.16, -1.4, 6.2] },
            { name: "한국전력", code: "015760", cap: 15, change: [0.83, 1.6, 3.9] },
            { name: "SK이노베이션", code: "096770", cap: 11, change: [0.34, -0.8, -2.6] },
            { name: "HD현대일렉트릭", code: "267260", cap: 9, change: [-1.92, -3.1, 11.4] },
            { name: "LS ELECTRIC", code: "010120", cap: 6, change: [-1.47, -2.2, 9.8] },
          ],
        },
        {
          name: "조선",
          stocks: [
            { name: "HD현대중공업", code: "329180", cap: 20, change: [1.61, 2.9, 8.2] },
            { name: "HD한국조선해양", code: "009540", cap: 16, change: [1.74, 3.8, 9.6] },
            { name: "한화오션", code: "042660", cap: 12, change: [1.88, 3.5, 10.4] },
            { name: "삼성중공업", code: "010140", cap: 10, change: [2.36, 4.2, 12.1] },
          ],
        },
        {
          name: "방산",
          stocks: [
            { name: "한화에어로스페이스", code: "012450", cap: 21, change: [3.08, 6.4, 18.2] },
            { name: "현대로템", code: "064350", cap: 9, change: [2.91, 5.2, 14.6] },
            { name: "LIG넥스원", code: "079550", cap: 6, change: [2.47, 4.8, 11.3] },
            { name: "한국항공우주", code: "047810", cap: 6, change: [2.12, 3.1, 7.4] },
          ],
        },
        {
          name: "소비·유통",
          stocks: [
            { name: "삼성물산", code: "028260", cap: 26, change: [-0.68, -1.2, 2.4] },
            { name: "LG전자", code: "066570", cap: 15, change: [-0.89, -1.6, -2.7] },
            { name: "KT&G", code: "033780", cap: 12, change: [0.27, 0.8, 2.5] },
            { name: "아모레퍼시픽", code: "090430", cap: 7, change: [1.34, 2.9, -4.6] },
          ],
        },
        {
          name: "통신",
          stocks: [
            { name: "SK텔레콤", code: "017670", cap: 11, change: [0.21, 0.6, 1.8] },
            { name: "KT", code: "030200", cap: 10, change: [0.45, 1.1, 3.2] },
            { name: "LG유플러스", code: "032640", cap: 4, change: [-0.12, 0.3, 0.9] },
          ],
        },
      ],
    },

    kosdaq: {
      index: "KOSDAQ",
      sectors: [
        {
          name: "바이오",
          stocks: [
            { name: "알테오젠", code: "196170", cap: 18, change: [-3.84, -5.2, 8.9] },
            { name: "HLB", code: "028300", cap: 9, change: [-4.62, -7.8, -11.4] },
            { name: "리가켐바이오", code: "141080", cap: 3.6, change: [-3.21, -4.5, 5.6] },
            { name: "휴젤", code: "145020", cap: 3, change: [-1.12, -0.6, 2.1] },
            { name: "삼천당제약", code: "000250", cap: 2.8, change: [-5.08, -9.1, 14.2] },
          ],
        },
        {
          name: "이차전지",
          stocks: [
            { name: "에코프로비엠", code: "247540", cap: 17, change: [2.84, 5.1, -8.4] },
            { name: "에코프로", code: "086520", cap: 12, change: [2.35, 4.4, -10.2] },
            { name: "엘앤에프", code: "066970", cap: 3, change: [3.12, 6.2, -12.6] },
          ],
        },
        {
          name: "반도체",
          stocks: [
            { name: "리노공업", code: "058470", cap: 3.5, change: [-4.47, -6.2, 3.8] },
            { name: "HPSP", code: "403870", cap: 2.2, change: [-3.95, -5.7, -2.4] },
            { name: "이오테크닉스", code: "039030", cap: 2, change: [-4.21, -6.9, 4.5] },
            { name: "ISC", code: "095340", cap: 1.5, change: [-5.86, -8.4, 7.2] },
          ],
        },
        {
          name: "미용·의료기기",
          stocks: [
            { name: "클래시스", code: "214150", cap: 3.4, change: [-1.48, -2.1, 4.2] },
            { name: "파마리서치", code: "214450", cap: 3, change: [-0.94, 0.8, 6.1] },
            { name: "실리콘투", code: "257720", cap: 2, change: [1.85, 3.2, 9.4] },
          ],
        },
        {
          name: "로봇",
          stocks: [
            { name: "레인보우로보틱스", code: "277810", cap: 4, change: [-6.12, -9.4, 16.8] },
            { name: "로보티즈", code: "108490", cap: 1.2, change: [-5.42, -8.1, 12.5] },
          ],
        },
        {
          name: "엔터·게임",
          stocks: [
            { name: "JYP Ent.", code: "035900", cap: 2.6, change: [-1.24, -2.6, -5.1] },
            { name: "펄어비스", code: "263750", cap: 2.4, change: [-2.33, -4.1, -6.7] },
            { name: "에스엠", code: "041510", cap: 2, change: [-0.86, -1.8, -3.2] },
          ],
        },
      ],
    },
  },
};

// 종목별 시세·지표 예시 데이터 (종목 상세 페이지)
// price: 현재가(원), per·pbr: 배, div: 배당수익률(%), foreign: 외국인 지분율(%), 적자 기업은 per: null
const QUOTES = {
  // KOSPI
  "005930": { price: 61400, per: 13.8, pbr: 1.08, div: 2.4, foreign: 51.2 },
  "000660": { price: 198500, per: 8.9, pbr: 1.62, div: 0.6, foreign: 54.8 },
  "042700": { price: 104300, per: 46.2, pbr: 12.4, div: 0.4, foreign: 9.1 },
  "000990": { price: 45600, per: 9.6, pbr: 1.05, div: 1.3, foreign: 21.4 },
  "373220": { price: 376000, per: 148.5, pbr: 4.21, div: 0, foreign: 4.8 },
  "005490": { price: 362500, per: 31.4, pbr: 0.62, div: 2.8, foreign: 26.3 },
  "051910": { price: 354000, per: 42.1, pbr: 0.97, div: 1.0, foreign: 37.5 },
  "006400": { price: 321500, per: 38.7, pbr: 1.1, div: 0.3, foreign: 41.2 },
  "003670": { price: 193700, per: 210.3, pbr: 4.85, div: 0.1, foreign: 6.2 },
  "207940": { price: 955000, per: 70.3, pbr: 6.4, div: 0, foreign: 12.7 },
  "068270": { price: 179200, per: 58.6, pbr: 2.9, div: 0.4, foreign: 21.8 },
  "000100": { price: 99800, per: 63.2, pbr: 3.4, div: 0.4, foreign: 17.5 },
  "326030": { price: 89400, per: 72.8, pbr: 9.7, div: 0, foreign: 9.3 },
  "005380": { price: 231500, per: 4.6, pbr: 0.53, div: 5.4, foreign: 39.6 },
  "000270": { price: 97200, per: 4.1, pbr: 0.81, div: 6.7, foreign: 40.3 },
  "012330": { price: 227000, per: 5.9, pbr: 0.42, div: 2.0, foreign: 37.1 },
  "018880": { price: 4250, per: null, pbr: 0.88, div: 0, foreign: 10.6 },
  "105560": { price: 84300, per: 6.7, pbr: 0.57, div: 3.8, foreign: 77.4 },
  "055550": { price: 53200, per: 5.6, pbr: 0.47, div: 4.1, foreign: 59.8 },
  "086790": { price: 63100, per: 4.8, pbr: 0.43, div: 5.6, foreign: 67.2 },
  "316140": { price: 16050, per: 3.9, pbr: 0.33, div: 6.9, foreign: 44.1 },
  "323410": { price: 24900, per: 26.1, pbr: 1.95, div: 1.2, foreign: 13.6 },
  "138040": { price: 104500, per: 8.1, pbr: 2.3, div: 2.5, foreign: 15.9 },
  "032830": { price: 90100, per: 9.2, pbr: 0.49, div: 4.3, foreign: 14.2 },
  "000810": { price: 338500, per: 7.9, pbr: 1.03, div: 5.1, foreign: 54.6 },
  "005830": { price: 98900, per: 4.4, pbr: 0.78, div: 5.5, foreign: 52.8 },
  "035420": { price: 168900, per: 15.4, pbr: 1.05, div: 0.7, foreign: 43.2 },
  "035720": { price: 36150, per: 85.2, pbr: 1.98, div: 0.2, foreign: 29.1 },
  "259960": { price: 310500, per: 17.8, pbr: 2.6, div: 0, foreign: 42.3 },
  "036570": { price: 182000, per: null, pbr: 1.15, div: 1.0, foreign: 27.6 },
  "034020": { price: 24850, per: 64.8, pbr: 2.1, div: 0, foreign: 25.4 },
  "015760": { price: 23400, per: 4.1, pbr: 0.35, div: 0, foreign: 15.8 },
  "096770": { price: 112400, per: null, pbr: 0.62, div: 2.7, foreign: 18.9 },
  "267260": { price: 251000, per: 22.5, pbr: 7.8, div: 0.6, foreign: 27.2 },
  "010120": { price: 200500, per: 25.3, pbr: 3.1, div: 0.8, foreign: 19.6 },
  "329180": { price: 225000, per: 45.6, pbr: 4.1, div: 0, foreign: 10.8 },
  "009540": { price: 226000, per: 19.8, pbr: 1.15, div: 1.2, foreign: 28.3 },
  "042660": { price: 39200, per: 98.7, pbr: 2.4, div: 0, foreign: 9.7 },
  "010140": { price: 11360, per: 74.3, pbr: 2.2, div: 0, foreign: 21.5 },
  "012450": { price: 412000, per: 24.6, pbr: 5.9, div: 0.4, foreign: 41.5 },
  "064350": { price: 82400, per: 30.2, pbr: 6.1, div: 0.2, foreign: 25.9 },
  "079550": { price: 272000, per: 37.5, pbr: 5.6, div: 0.8, foreign: 19.1 },
  "047810": { price: 61500, per: 52.4, pbr: 3.9, div: 0.4, foreign: 24.7 },
  "028260": { price: 142600, per: 12.3, pbr: 0.72, div: 1.9, foreign: 18.6 },
  "066570": { price: 91700, per: 13.5, pbr: 0.79, div: 0.9, foreign: 30.4 },
  "033780": { price: 104200, per: 12.7, pbr: 1.17, div: 5.2, foreign: 43.8 },
  "090430": { price: 122300, per: 40.5, pbr: 1.8, div: 0.8, foreign: 22.3 },
  "017670": { price: 53800, per: 11.4, pbr: 0.93, div: 6.6, foreign: 42.5 },
  "030200": { price: 40100, per: 9.8, pbr: 0.55, div: 5.0, foreign: 49.0 },
  "032640": { price: 9940, per: 8.7, pbr: 0.38, div: 6.5, foreign: 37.9 },
  // KOSDAQ
  "196170": { price: 336000, per: 312.4, pbr: 45.2, div: 0, foreign: 18.4 },
  "028300": { price: 69500, per: null, pbr: 7.3, div: 0, foreign: 12.8 },
  "141080": { price: 99300, per: null, pbr: 9.8, div: 0, foreign: 14.2 },
  "145020": { price: 240500, per: 26.4, pbr: 3.5, div: 0.6, foreign: 51.3 },
  "000250": { price: 119500, per: 148.2, pbr: 11.6, div: 0.1, foreign: 6.4 },
  "247540": { price: 173800, per: null, pbr: 9.8, div: 0, foreign: 9.6 },
  "086520": { price: 87300, per: null, pbr: 4.1, div: 0.3, foreign: 7.8 },
  "066970": { price: 82600, per: null, pbr: 3.2, div: 0, foreign: 11.5 },
  "058470": { price: 229500, per: 35.6, pbr: 6.4, div: 1.3, foreign: 33.8 },
  "403870": { price: 26600, per: 31.2, pbr: 7.4, div: 0.8, foreign: 17.1 },
  "039030": { price: 163400, per: 38.7, pbr: 4.2, div: 0.2, foreign: 19.8 },
  "095340": { price: 71800, per: 42.5, pbr: 4.0, div: 0.6, foreign: 15.3 },
  "214150": { price: 52600, per: 32.1, pbr: 8.2, div: 0.7, foreign: 49.5 },
  "214450": { price: 287000, per: 31.8, pbr: 5.1, div: 0.4, foreign: 24.6 },
  "257720": { price: 33500, per: 21.4, pbr: 9.5, div: 0, foreign: 14.9 },
  "277810": { price: 206000, per: null, pbr: 26.4, div: 0, foreign: 3.4 },
  "108490": { price: 91800, per: null, pbr: 15.3, div: 0, foreign: 2.1 },
  "035900": { price: 62300, per: 21.7, pbr: 3.6, div: 1.5, foreign: 30.8 },
  "263750": { price: 37400, per: null, pbr: 3.1, div: 0, foreign: 21.9 },
  "041510": { price: 85600, per: 23.5, pbr: 1.4, div: 0.4, foreign: 25.7 },
};
