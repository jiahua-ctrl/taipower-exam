window.QUIZ_CONFIG = {
  GOOGLE_SHEET_CSV_URL: "",

  APP_TITLE: "台電電力交易平台資格測驗｜刷題系統",
  EXAM_DATE: "2026-10-03",
  DAILY_TARGET: 20,
  TARGET_QUESTION_COUNT: 300,

  // 115年備考：兩科各100分；本站正式模擬以兩科平均判定，且單科不得低於60分。
  PASS_TOTAL: 70,
  PASS_SINGLE_SUBJECT: 60,
  SUBJECT1_WEIGHT: 0.50,
  SUBJECT2_WEIGHT: 0.50,

  // 正式模擬考時間依115年筆試時長；題數為本站練習配置，不代表官方實際題數。
  MOCK_SUBJECT1_MINUTES: 60,
  MOCK_SUBJECT2_MINUTES: 90,
  MOCK_SUBJECT1_COUNT: 30,
  MOCK_SUBJECT2_COUNT: 45
};

// 載入入口首頁、備考教練與間隔複習。
if (document.readyState === "loading") {
  document.write('<script src="portal.js?v=20260818"><\/script>');
  document.write('<script src="coach.js?v=20260817"><\/script>');
  document.write('<script src="spaced_review.js?v=20260817"><\/script>');
}
