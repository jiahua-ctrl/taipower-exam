window.QUIZ_CONFIG = {
  GOOGLE_SHEET_CSV_URL: "",

  APP_TITLE: "台電電力交易平台資格測驗｜刷題系統",
  EXAM_DATE: "2026-10-03",
  DAILY_TARGET: 20,
  TARGET_QUESTION_COUNT: 300,

  PASS_TOTAL: 70,
  PASS_SINGLE_SUBJECT: 60,
  SUBJECT1_WEIGHT: 0.50,
  SUBJECT2_WEIGHT: 0.50,

  MOCK_SUBJECT1_MINUTES: 60,
  MOCK_SUBJECT2_MINUTES: 90,
  MOCK_SUBJECT1_COUNT: 30,
  MOCK_SUBJECT2_COUNT: 45
};

// 載入備考教練與間隔複習；入口首頁已改為獨立 home.html。
if (document.readyState === "loading") {
  document.write('<script src="coach.js?v=20260820"><\/script>');
  document.write('<script src="spaced_review.js?v=20260820"><\/script>');
}
