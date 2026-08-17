(() => {
  const CFG = window.QUIZ_CONFIG || {};
  const RECOMMEND_PARAM = "recommended";
  const RECOMMEND_SESSION_KEY = "taipower_exam_recommended_ids_v1";
  const STATS_KEY = "taipower_exam_stats_v1";
  const WRONG_KEY = "taipower_exam_wrong_ids_v1";
  const params = new URLSearchParams(window.location.search);
  const isRecommendedRun = params.get(RECOMMEND_PARAM) === "1";

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
    const target = Math.min(CFG.DAILY_TARGET || 20, questions.length);
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

    // 約 40%：目前仍在錯題本的題目。
    add(questions.filter(q => wrongIds.includes(q.id)), Math.ceil(target * 0.40));

    // 約 45%：正確率最低的前兩個單元。
    if(weakTopics[0]){
      add(questions.filter(q => (q.topic || "其他") === weakTopics[0].name), Math.ceil(target * 0.30));
    }
    if(weakTopics[1]){
      add(questions.filter(q => (q.topic || "其他") === weakTopics[1].name), Math.ceil(target * 0.15));
    }

    // 其餘優先補尚未做過或做得最少的題目，避免只背熟同一批題。
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

  // 這支檔案放在所有 questions*.js 之後、app.js 之前。
  // 因此若是推薦題組模式，可以在 app.js 擷取 LOCAL_QUESTIONS 前先篩成指定 20 題。
  if(isRecommendedRun){
    let ids = [];
    try { ids = JSON.parse(sessionStorage.getItem(RECOMMEND_SESSION_KEY)) || []; }
    catch { ids = []; }

    if(ids.length && Array.isArray(window.LOCAL_QUESTIONS)){
      const idSet = new Set(ids);
      window.LOCAL_QUESTIONS = window.LOCAL_QUESTIONS.filter(q => idSet.has(q.id));
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // app.js 會在稍後的 DOMContentLoaded handler 完成初始化；用 timer 等它綁定完成。
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

      // 若未來改成 Google Sheet 遠端題庫，推薦器需一起改成讀遠端資料；目前先避免誤配。
      if(String(CFG.GOOGLE_SHEET_CSV_URL || "").trim()) return;

      const grid = document.querySelector(".quick-mode-grid");
      if(!grid || document.getElementById("adaptiveRecommendBtn")) return;

      const questions = activeQuestions();
      const target = Math.min(CFG.DAILY_TARGET || 20, questions.length);
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
