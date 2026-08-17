window.QUIZ_CONFIG = {
  // 將 Google 試算表「題庫」工作表發布成 CSV 後，把網址貼在引號內。
  // 留空時，網站會使用 questions.js 與各單元 JS 的內建題庫。
  GOOGLE_SHEET_CSV_URL: "",

  APP_TITLE: "台電電力交易平台資格測驗｜刷題系統",
  EXAM_DATE: "2026-10-03",
  DAILY_TARGET: 20,
  PASS_TOTAL: 70,
  PASS_SINGLE_SUBJECT: 60,
  SUBJECT1_WEIGHT: 0.40,
  SUBJECT2_WEIGHT: 0.60
};

// 「今天推薦爸爸練什麼」：以錯題、弱點單元與低練習量題目自動組成 20 題。
(() => {
  const RECOMMEND_PARAM = "recommended";
  const RECOMMEND_SESSION_KEY = "taipower_exam_recommended_ids_v1";
  const STATS_KEY = "taipower_exam_stats_v1";
  const WRONG_KEY = "taipower_exam_wrong_ids_v1";

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  function loadJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  }

  function activeQuestions(){
    return (Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : [])
      .filter(q => q && q.id && q.is_active !== false);
  }

  function getTopicStats(questions, stats){
    const groups = {};
    questions.forEach(q => {
      const s = stats[q.id];
      if(!s || !s.attempts) return;
      const topic = q.topic || "其他";
      groups[topic] ||= {name:topic, attempts:0, correct:0};
      groups[topic].attempts += s.attempts || 0;
      groups[topic].correct += s.correct || 0;
    });
    return Object.values(groups)
      .map(x => ({...x, rate: x.attempts ? Math.round(x.correct / x.attempts * 100) : 0}))
      .sort((a,b) => a.rate - b.rate || b.attempts - a.attempts);
  }

  function buildRecommendedSet(questions){
    const target = Math.min(window.QUIZ_CONFIG.DAILY_TARGET || 20, questions.length);
    const stats = loadJson(STATS_KEY, {});
    const wrongIds = loadJson(WRONG_KEY, []);
    const weakTopics = getTopicStats(questions, stats).filter(x => x.attempts >= 3);
    const picked = [];
    const seen = new Set();

    function add(pool, limit){
      let added = 0;
      for(const q of shuffle(pool)){
        if(picked.length >= target || added >= limit) break;
        if(seen.has(q.id)) continue;
        seen.add(q.id);
        picked.push(q);
        added++;
      }
    }

    // 約 40%：先複習目前仍在錯題本的題目。
    add(questions.filter(q => wrongIds.includes(q.id)), Math.ceil(target * 0.40));

    // 約 45%：集中在目前正確率最低的前兩個單元。
    if(weakTopics[0]){
      add(questions.filter(q => (q.topic || "其他") === weakTopics[0].name), Math.ceil(target * 0.30));
    }
    if(weakTopics[1]){
      add(questions.filter(q => (q.topic || "其他") === weakTopics[1].name), Math.ceil(target * 0.15));
    }

    // 剩餘題數優先補「做得最少／尚未做過」的題目，避免只背熟同一批題。
    const lowExposure = [...questions].sort((a,b) => {
      const aa = stats[a.id]?.attempts || 0;
      const bb = stats[b.id]?.attempts || 0;
      return aa - bb || Math.random() - 0.5;
    });
    add(lowExposure, target - picked.length);

    // 保險：若前述條件不足，從全題庫補足。
    add(questions, target - picked.length);
    return shuffle(picked).slice(0, target);
  }

  function getRecommendationHint(questions){
    const stats = loadJson(STATS_KEY, {});
    const wrongIds = loadJson(WRONG_KEY, []).filter(id => questions.some(q => q.id === id));
    const weak = getTopicStats(questions, stats).find(x => x.attempts >= 3);
    const hasHistory = Object.values(stats).some(s => s && s.attempts);

    if(!hasHistory) return "先用 20 題建立基準，之後會依弱點自動配題";
    if(wrongIds.length && weak) return `優先：錯題＋「${weak.name}」弱點題`;
    if(wrongIds.length) return `優先複習目前 ${wrongIds.length} 題錯題`;
    if(weak) return `優先加強「${weak.name}」｜目前最低正確率`;
    return "依目前作答紀錄，自動挑 20 題";
  }

  function cleanUrl(){
    return window.location.pathname;
  }

  function restoreFullHome(){
    window.location.replace(cleanUrl());
  }

  function startRecommendedWhenReady(attempt = 0){
    const btn = document.querySelector('[data-mode="random20"]');
    const status = document.getElementById("dataStatus");
    const ready = btn && status && !status.textContent.includes("正在讀取");
    if(ready){
      btn.click();
      return;
    }
    if(attempt < 50) setTimeout(() => startRecommendedWhenReady(attempt + 1), 60);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const isRecommendedRun = params.get(RECOMMEND_PARAM) === "1";

    // 此處比 app.js 的 DOMContentLoaded handler 更早註冊，因此可在 app 載入題庫前完成篩選。
    if(isRecommendedRun){
      let ids = [];
      try { ids = JSON.parse(sessionStorage.getItem(RECOMMEND_SESSION_KEY)) || []; }
      catch { ids = []; }
      if(ids.length && Array.isArray(window.LOCAL_QUESTIONS)){
        const idSet = new Set(ids);
        window.LOCAL_QUESTIONS = window.LOCAL_QUESTIONS.filter(q => idSet.has(q.id));
      }
    }

    // 等 app.js 完成初始化與事件綁定後，再插入推薦按鈕或自動開始推薦題組。
    setTimeout(() => {
      if(isRecommendedRun){
        startRecommendedWhenReady();

        const homeBtn = document.getElementById("homeBtn");
        if(homeBtn) homeBtn.addEventListener("click", () => setTimeout(restoreFullHome, 20));

        const quitBtn = document.getElementById("quitBtn");
        if(quitBtn){
          quitBtn.addEventListener("click", () => {
            setTimeout(() => {
              const home = document.getElementById("homeView");
              if(home && home.classList.contains("active")) restoreFullHome();
            }, 80);
          });
        }
        return;
      }

      const grid = document.querySelector(".quick-mode-grid");
      if(!grid || document.getElementById("adaptiveRecommendBtn")) return;

      const questions = activeQuestions();
      const target = Math.min(window.QUIZ_CONFIG.DAILY_TARGET || 20, questions.length);
      const btn = document.createElement("button");
      btn.id = "adaptiveRecommendBtn";
      btn.className = "mode-card featured-mode";
      btn.type = "button";
      btn.innerHTML = `
        <span class="mode-icon">🔥</span>
        <b>今天推薦 ${target} 題</b>
        <small id="adaptiveRecommendHint"></small>`;
      grid.prepend(btn);

      const hint = document.getElementById("adaptiveRecommendHint");
      if(hint) hint.textContent = getRecommendationHint(questions);

      btn.addEventListener("click", () => {
        const full = activeQuestions();
        const recommended = buildRecommendedSet(full);
        if(!recommended.length){
          alert("目前題庫沒有可用題目。");
          return;
        }
        sessionStorage.setItem(RECOMMEND_SESSION_KEY, JSON.stringify(recommended.map(q => q.id)));
        window.location.href = `${cleanUrl()}?${RECOMMEND_PARAM}=1`;
      });
    }, 0);
  });
})();
