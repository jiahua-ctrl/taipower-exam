// 正式模擬考嚴格核對模式：載入高鑑別已核對題、500題V3重整題庫並執行品質守門檢查。
document.write('<script src="questions_verified_high_discrimination_v1.js"><\/script>');
document.write('<script src="questions_verified_high_discrimination_v2.js"><\/script>');
document.write('<script src="questions_verified_high_discrimination_v3.js"><\/script>');
document.write('<script src="questions_verified_high_discrimination_v4.js"><\/script>');
document.write('<script src="questions_verified_high_discrimination_v5.js"><\/script>');
document.write('<script src="questions_advanced_v2_500.js"><\/script>');
document.write('<script src="questions_advanced_v3_quality_patch.js"><\/script>');
document.write('<script src="question_bank_guard.js"><\/script>');
window.LOCAL_QUESTIONS = typeof window.auditVerifiedQuestionBank === "function"
  ? window.auditVerifiedQuestionBank(window.LOCAL_QUESTIONS)
  : (Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : []).filter(q => String(q.tags || "").includes("已核對"));
