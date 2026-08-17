// 正式模擬考嚴格核對模式：只保留已完成官方教材核對的 V / C 題目。
window.LOCAL_QUESTIONS = (Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : [])
  .filter(q => /^(V|C)/.test(String(q.id || "")));
