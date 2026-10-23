// 화면 데이터. 종목 시세(가격·등락률·시가총액·일봉)는 여기 없고 data/prices.js(실제 데이터)에서 온다 → js/live.js
// 여기 남은 것: 종목 목록과 업종 분류, 그리고 아직 API로 받지 않는 예시 항목(지수, 투자자별 순매수, PER 등)
const MARKET = {
  indices: [
    { name: "KOSPI", value: 5397.12, change: -2.48 },
    { name: "KOSDAQ", value: 737.11, change: -3.53 },
    { name: "KOSPI200", value: 721.4, change: -2.61 },
    { name: "원/달러", value: 1325.3, change: 0.13 },
    { name: "국고채 3년", value: 2.684, change: 0.04 },
    { name: "WTI", value: 71.82, change: 1.06 },
    { name: "금", value: 2648.5, change: 0.42 },
  ],


  // 단위: 억원
  flows: [
    { who: "개인", today: 12840, week: 31255 },
    { who: "외국인", today: -9612, week: -24870 },
    { who: "기관", today: -3105, week: -6912 },
    { who: "연기금", today: 1420, week: 3880 },
  ],
};

// 섹터 히트맵에 넣을 종목과 업종 분류. 시가총액·등락률(cap, change)은 live.js가 채운다
// scripts/fetch-data.mjs도 이 목록의 종목만 받는다
const HEATMAP = {
  periods: ["1일", "1주", "1개월"],

  markets: {
    kospi: {
      index: "KOSPI",
      sectors: [
        {
          name: "반도체",
          stocks: [
            { name: "삼성전자", code: "005930" },
            { name: "SK하이닉스", code: "000660" },
            { name: "한미반도체", code: "042700" },
            { name: "DB하이텍", code: "000990" },
          ],
        },
        {
          name: "이차전지",
          stocks: [
            { name: "LG에너지솔루션", code: "373220" },
            { name: "POSCO홀딩스", code: "005490" },
            { name: "LG화학", code: "051910" },
            { name: "삼성SDI", code: "006400" },
            { name: "포스코퓨처엠", code: "003670" },
          ],
        },
        {
          name: "바이오",
          stocks: [
            { name: "삼성바이오로직스", code: "207940" },
            { name: "셀트리온", code: "068270" },
            { name: "유한양행", code: "000100" },
            { name: "SK바이오팜", code: "326030" },
          ],
        },
        {
          name: "자동차",
          stocks: [
            { name: "현대차", code: "005380" },
            { name: "기아", code: "000270" },
            { name: "현대모비스", code: "012330" },
            { name: "한온시스템", code: "018880" },
          ],
        },
        {
          name: "은행",
          stocks: [
            { name: "KB금융", code: "105560" },
            { name: "신한지주", code: "055550" },
            { name: "하나금융지주", code: "086790" },
            { name: "우리금융지주", code: "316140" },
            { name: "카카오뱅크", code: "323410" },
          ],
        },
        {
          name: "보험",
          stocks: [
            { name: "메리츠금융지주", code: "138040" },
            { name: "삼성생명", code: "032830" },
            { name: "삼성화재", code: "000810" },
            { name: "DB손해보험", code: "005830" },
          ],
        },
        {
          name: "인터넷·게임",
          stocks: [
            { name: "NAVER", code: "035420" },
            { name: "카카오", code: "035720" },
            { name: "크래프톤", code: "259960" },
            { name: "엔씨소프트", code: "036570" },
          ],
        },
        {
          name: "전력·에너지",
          stocks: [
            { name: "두산에너빌리티", code: "034020" },
            { name: "한국전력", code: "015760" },
            { name: "SK이노베이션", code: "096770" },
            { name: "HD현대일렉트릭", code: "267260" },
            { name: "LS ELECTRIC", code: "010120" },
          ],
        },
        {
          name: "조선",
          stocks: [
            { name: "HD현대중공업", code: "329180" },
            { name: "HD한국조선해양", code: "009540" },
            { name: "한화오션", code: "042660" },
            { name: "삼성중공업", code: "010140" },
          ],
        },
        {
          name: "방산",
          stocks: [
            { name: "한화에어로스페이스", code: "012450" },
            { name: "현대로템", code: "064350" },
            { name: "LIG넥스원", code: "079550" },
            { name: "한국항공우주", code: "047810" },
          ],
        },
        {
          name: "소비·유통",
          stocks: [
            { name: "삼성물산", code: "028260" },
            { name: "LG전자", code: "066570" },
            { name: "KT&G", code: "033780" },
            { name: "아모레퍼시픽", code: "090430" },
          ],
        },
        {
          name: "통신",
          stocks: [
            { name: "SK텔레콤", code: "017670" },
            { name: "KT", code: "030200" },
            { name: "LG유플러스", code: "032640" },
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
            { name: "알테오젠", code: "196170" },
            { name: "HLB", code: "028300" },
            { name: "리가켐바이오", code: "141080" },
            { name: "휴젤", code: "145020" },
            { name: "삼천당제약", code: "000250" },
          ],
        },
        {
          name: "이차전지",
          stocks: [
            { name: "에코프로비엠", code: "247540" },
            { name: "에코프로", code: "086520" },
            { name: "엘앤에프", code: "066970" },
          ],
        },
        {
          name: "반도체",
          stocks: [
            { name: "리노공업", code: "058470" },
            { name: "HPSP", code: "403870" },
            { name: "이오테크닉스", code: "039030" },
            { name: "ISC", code: "095340" },
          ],
        },
        {
          name: "미용·의료기기",
          stocks: [
            { name: "클래시스", code: "214150" },
            { name: "파마리서치", code: "214450" },
            { name: "실리콘투", code: "257720" },
          ],
        },
        {
          name: "로봇",
          stocks: [
            { name: "레인보우로보틱스", code: "277810" },
            { name: "로보티즈", code: "108490" },
          ],
        },
        {
          name: "엔터·게임",
          stocks: [
            { name: "JYP Ent.", code: "035900" },
            { name: "펄어비스", code: "263750" },
            { name: "에스엠", code: "041510" },
          ],
        },
      ],
    },
  },
};

// 종목별 지표 예시 데이터 (종목 상세 페이지). 현재가(price)는 live.js가 채운다
// per·pbr: 배, div: 배당수익률(%), foreign: 외국인 지분율(%), 적자 기업은 per: null
const QUOTES = {
  // KOSPI
  "005930": { per: 13.8, pbr: 1.08, div: 2.4, foreign: 51.2 },
  "000660": { per: 8.9, pbr: 1.62, div: 0.6, foreign: 54.8 },
  "042700": { per: 46.2, pbr: 12.4, div: 0.4, foreign: 9.1 },
  "000990": { per: 9.6, pbr: 1.05, div: 1.3, foreign: 21.4 },
  "373220": { per: 148.5, pbr: 4.21, div: 0, foreign: 4.8 },
  "005490": { per: 31.4, pbr: 0.62, div: 2.8, foreign: 26.3 },
  "051910": { per: 42.1, pbr: 0.97, div: 1.0, foreign: 37.5 },
  "006400": { per: 38.7, pbr: 1.1, div: 0.3, foreign: 41.2 },
  "003670": { per: 210.3, pbr: 4.85, div: 0.1, foreign: 6.2 },
  "207940": { per: 70.3, pbr: 6.4, div: 0, foreign: 12.7 },
  "068270": { per: 58.6, pbr: 2.9, div: 0.4, foreign: 21.8 },
  "000100": { per: 63.2, pbr: 3.4, div: 0.4, foreign: 17.5 },
  "326030": { per: 72.8, pbr: 9.7, div: 0, foreign: 9.3 },
  "005380": { per: 4.6, pbr: 0.53, div: 5.4, foreign: 39.6 },
  "000270": { per: 4.1, pbr: 0.81, div: 6.7, foreign: 40.3 },
  "012330": { per: 5.9, pbr: 0.42, div: 2.0, foreign: 37.1 },
  "018880": { per: null, pbr: 0.88, div: 0, foreign: 10.6 },
  "105560": { per: 6.7, pbr: 0.57, div: 3.8, foreign: 77.4 },
  "055550": { per: 5.6, pbr: 0.47, div: 4.1, foreign: 59.8 },
  "086790": { per: 4.8, pbr: 0.43, div: 5.6, foreign: 67.2 },
  "316140": { per: 3.9, pbr: 0.33, div: 6.9, foreign: 44.1 },
  "323410": { per: 26.1, pbr: 1.95, div: 1.2, foreign: 13.6 },
  "138040": { per: 8.1, pbr: 2.3, div: 2.5, foreign: 15.9 },
  "032830": { per: 9.2, pbr: 0.49, div: 4.3, foreign: 14.2 },
  "000810": { per: 7.9, pbr: 1.03, div: 5.1, foreign: 54.6 },
  "005830": { per: 4.4, pbr: 0.78, div: 5.5, foreign: 52.8 },
  "035420": { per: 15.4, pbr: 1.05, div: 0.7, foreign: 43.2 },
  "035720": { per: 85.2, pbr: 1.98, div: 0.2, foreign: 29.1 },
  "259960": { per: 17.8, pbr: 2.6, div: 0, foreign: 42.3 },
  "036570": { per: null, pbr: 1.15, div: 1.0, foreign: 27.6 },
  "034020": { per: 64.8, pbr: 2.1, div: 0, foreign: 25.4 },
  "015760": { per: 4.1, pbr: 0.35, div: 0, foreign: 15.8 },
  "096770": { per: null, pbr: 0.62, div: 2.7, foreign: 18.9 },
  "267260": { per: 22.5, pbr: 7.8, div: 0.6, foreign: 27.2 },
  "010120": { per: 25.3, pbr: 3.1, div: 0.8, foreign: 19.6 },
  "329180": { per: 45.6, pbr: 4.1, div: 0, foreign: 10.8 },
  "009540": { per: 19.8, pbr: 1.15, div: 1.2, foreign: 28.3 },
  "042660": { per: 98.7, pbr: 2.4, div: 0, foreign: 9.7 },
  "010140": { per: 74.3, pbr: 2.2, div: 0, foreign: 21.5 },
  "012450": { per: 24.6, pbr: 5.9, div: 0.4, foreign: 41.5 },
  "064350": { per: 30.2, pbr: 6.1, div: 0.2, foreign: 25.9 },
  "079550": { per: 37.5, pbr: 5.6, div: 0.8, foreign: 19.1 },
  "047810": { per: 52.4, pbr: 3.9, div: 0.4, foreign: 24.7 },
  "028260": { per: 12.3, pbr: 0.72, div: 1.9, foreign: 18.6 },
  "066570": { per: 13.5, pbr: 0.79, div: 0.9, foreign: 30.4 },
  "033780": { per: 12.7, pbr: 1.17, div: 5.2, foreign: 43.8 },
  "090430": { per: 40.5, pbr: 1.8, div: 0.8, foreign: 22.3 },
  "017670": { per: 11.4, pbr: 0.93, div: 6.6, foreign: 42.5 },
  "030200": { per: 9.8, pbr: 0.55, div: 5.0, foreign: 49.0 },
  "032640": { per: 8.7, pbr: 0.38, div: 6.5, foreign: 37.9 },
  // KOSDAQ
  "196170": { per: 312.4, pbr: 45.2, div: 0, foreign: 18.4 },
  "028300": { per: null, pbr: 7.3, div: 0, foreign: 12.8 },
  "141080": { per: null, pbr: 9.8, div: 0, foreign: 14.2 },
  "145020": { per: 26.4, pbr: 3.5, div: 0.6, foreign: 51.3 },
  "000250": { per: 148.2, pbr: 11.6, div: 0.1, foreign: 6.4 },
  "247540": { per: null, pbr: 9.8, div: 0, foreign: 9.6 },
  "086520": { per: null, pbr: 4.1, div: 0.3, foreign: 7.8 },
  "066970": { per: null, pbr: 3.2, div: 0, foreign: 11.5 },
  "058470": { per: 35.6, pbr: 6.4, div: 1.3, foreign: 33.8 },
  "403870": { per: 31.2, pbr: 7.4, div: 0.8, foreign: 17.1 },
  "039030": { per: 38.7, pbr: 4.2, div: 0.2, foreign: 19.8 },
  "095340": { per: 42.5, pbr: 4.0, div: 0.6, foreign: 15.3 },
  "214150": { per: 32.1, pbr: 8.2, div: 0.7, foreign: 49.5 },
  "214450": { per: 31.8, pbr: 5.1, div: 0.4, foreign: 24.6 },
  "257720": { per: 21.4, pbr: 9.5, div: 0, foreign: 14.9 },
  "277810": { per: null, pbr: 26.4, div: 0, foreign: 3.4 },
  "108490": { per: null, pbr: 15.3, div: 0, foreign: 2.1 },
  "035900": { per: 21.7, pbr: 3.6, div: 1.5, foreign: 30.8 },
  "263750": { per: null, pbr: 3.1, div: 0, foreign: 21.9 },
  "041510": { per: 23.5, pbr: 1.4, div: 0.4, foreign: 25.7 },
};
