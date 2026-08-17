// 正式模擬考嚴格核對模式：載入高鑑別已核對題，並只保留標示「已核對」的題目。
document.write('<script src="questions_verified_high_discrimination_v1.js"><\/script>');
document.write('<script src="questions_verified_high_discrimination_v2.js"><\/script>');
document.write('<script src="questions_verified_high_discrimination_v3.js"><\/script>');
document.write('<script src="questions_verified_high_discrimination_v4.js"><\/script>');
document.write('<script src="questions_verified_high_discrimination_v5.js"><\/script>');
window.LOCAL_QUESTIONS = (Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : [])
  .filter(q => String(q.tags || "").includes("已核對"));
