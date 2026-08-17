(() => {
  const CFG = window.QUIZ_CONFIG || {};
  const LOCAL = Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : [];

  const els = {};
  let allQuestions = [];
  let quiz = [];
  let index = 0;
  let correctCount = 0;
  let answered = false;
  let lastMode = "random10";
  let sessionAnswers = [];

  const $ = (id) => document.getElementById(id);
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
  const pct = (a,b) => b ? Math.round(a / b * 100) : 0;

  function statsKey(){ return "taipower_exam_stats_v1"; }
  function wrongKey(){ return "taipower_exam_wrong_ids_v1"; }
  function themeKey(){ return "taipower_exam_theme_v1"; }

  function loadStats(){
    try { return JSON.parse(localStorage.getItem(statsKey())) || {}; }
    catch { return {}; }
  }
  function saveStats(s){ localStorage.setItem(statsKey(), JSON.stringify(s)); }
  function loadWrong(){
    try { return JSON.parse(localStorage.getItem(wrongKey())) || []; }
    catch { return []; }
  }
  function saveWrong(ids){ localStorage.setItem(wrongKey(), JSON.stringify([...new Set(ids)])); }

  function parseCSV(text){
    const rows = [];
    let row = [], field = "", quoted = false;
    for(let i=0;i<text.length;i++){
      const ch = text[i], next = text[i+1];
      if(ch === '"'){
        if(quoted && next === '"'){ field += '"'; i++; }
        else quoted = !quoted;
      } else if(ch === ',' && !quoted){
        row.push(field); field = "";
      } else if((ch === '\n' || ch === '\r') && !quoted){
        if(ch === '\r' && next === '\n') i++;
        row.push(field); field = "";
        if(row.some(v => v !== "")) rows.push(row);
        row = [];
      } else field += ch;
    }
    if(field.length || row.length){ row.push(field); rows.push(row); }
    if(rows.length < 2) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).map(r => {
      const obj = {};
      headers.forEach((h,i) => obj[h] = (r[i] ?? "").trim());
      obj.is_active = String(obj.is_active).toUpperCase() !== "FALSE";
      return obj;
    });
  }

  async function loadQuestions(){
    const url = (CFG.GOOGLE_SHEET_CSV_URL || "").trim();
    if(url){
      try{
        const res = await fetch(url, {cache:"no-store"});
        if(!res.ok) throw new Error("HTTP " + res.status);
        const text = await res.text();
        const remote = parseCSV(text).filter(validQuestion);
        if(remote.length){
          allQuestions = remote.filter(q => q.is_active !== false);
          $("dataStatus").textContent = `已連線 Google 試算表｜共 ${allQuestions.length} 題`;
          return;
        }
        throw new Error("CSV 無有效題目");
      }catch(err){
        console.warn("Google Sheet 載入失敗，改用內建題庫：", err);
        $("dataStatus").textContent = "Google 試算表讀取失敗，已改用內建題庫";
      }
    }else{
      $("dataStatus").textContent = "目前使用內建題庫｜作答紀錄會保留在這台裝置";
    }
    allQuestions = LOCAL.filter(validQuestion).filter(q => q.is_active !== false);
  }

  function validQuestion(q){
    return q && q.id && q.question && ["A","B","C","D"].includes(String(q.answer).toUpperCase());
  }

  function initEls(){
    ["homeView","quizView","resultView","totalQuestions","wrongCountLabel","weaknessList",
     "questionProgress","quizScore","progressBar","questionSubject","questionTopic","questionLevel",
     "questionText","options","feedback","feedbackTitle","explanation","sourceBox","nextBtn",
     "resultEmoji","resultTitle","resultScore","resultSummary","subjectScores","dataStatus","appTitle",
     "todayPractice","todayPracticeHint","subject1Accuracy","subject1Status","subject2Accuracy","subject2Status",
     "weakestUnit","weakestUnitHint","wrongCountDashboard","daysUntilExam","daysUntilExamCard",
     "todayPlanTitle","todayPlanText"
    ].forEach(id => els[id] = $(id));
  }

  function setView(name){
    ["homeView","quizView","resultView"].forEach(v => $(v).classList.remove("active"));
    $(name).classList.add("active");
    window.scrollTo({top:0, behavior:"smooth"});
  }

  function isSameLocalDay(isoString, now = new Date()){
    if(!isoString) return false;
    const d = new Date(isoString);
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  function getSubjectStats(subjectNeedle, stats){
    let attempts = 0, correct = 0;
    allQuestions.forEach(q => {
      if(!String(q.subject || "").includes(subjectNeedle)) return;
      const s = stats[q.id];
      if(!s || !s.attempts) return;
      attempts += s.attempts || 0;
      correct += s.correct || 0;
    });
    return {attempts, correct, rate: attempts ? pct(correct, attempts) : null};
  }

  function getTopicStats(stats){
    const groups = {};
    allQuestions.forEach(q => {
      const s = stats[q.id];
      if(!s || !s.attempts) return;
      const key = q.topic || "其他";
      groups[key] ||= {attempts:0, correct:0};
      groups[key].attempts += s.attempts || 0;
      groups[key].correct += s.correct || 0;
    });
    return Object.entries(groups)
      .map(([name,v]) => ({name, ...v, rate:pct(v.correct,v.attempts)}))
      .sort((a,b) => a.rate - b.rate || b.attempts - a.attempts);
  }

  function daysUntilExam(){
    const raw = CFG.EXAM_DATE || "2026-10-03";
    const parts = raw.split("-").map(Number);
    if(parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const exam = new Date(parts[0], parts[1]-1, parts[2]);
    return Math.max(0, Math.ceil((exam - today) / 86400000));
  }

  function updateDashboard(){
    const stats = loadStats();
    const wrongIds = loadWrong().filter(id => allQuestions.some(q => q.id === id));
    const dailyTarget = CFG.DAILY_TARGET || 20;

    let todayAttempts = 0;
    Object.values(stats).forEach(s => {
      if(s && isSameLocalDay(s.last) && s.attempts){
        // 舊版紀錄沒有 attemptsToday 時，至少視為今天做過 1 題。
        todayAttempts += s.attemptsToday || 1;
      }
    });

    const s1 = getSubjectStats("科目一", stats);
    const s2 = getSubjectStats("科目二", stats);
    const topics = getTopicStats(stats);
    const weakest = topics[0] || null;
    const days = daysUntilExam();

    els.todayPractice.textContent = todayAttempts;
    els.todayPracticeHint.textContent = todayAttempts >= dailyTarget
      ? "今天達標了，做錯題複習即可"
      : `距離今日目標還有 ${Math.max(0, dailyTarget - todayAttempts)} 題`;

    els.subject1Accuracy.textContent = s1.rate === null ? "--" : s1.rate;
    els.subject1Status.textContent = s1.rate === null ? "尚未作答" :
      `${s1.attempts} 次作答｜${s1.rate >= (CFG.PASS_SINGLE_SUBJECT || 60) ? "達單科及格線" : "需加強"}`;

    els.subject2Accuracy.textContent = s2.rate === null ? "--" : s2.rate;
    els.subject2Status.textContent = s2.rate === null ? "尚未作答" :
      `${s2.attempts} 次作答｜${s2.rate >= (CFG.PASS_SINGLE_SUBJECT || 60) ? "達單科及格線" : "需加強"}`;

    els.weakestUnit.textContent = weakest ? weakest.name : "尚無資料";
    els.weakestUnitHint.textContent = weakest
      ? `目前正確率 ${weakest.rate}%｜共作答 ${weakest.attempts} 次`
      : "作答後自動分析";

    els.wrongCountDashboard.textContent = wrongIds.length;
    els.daysUntilExam.textContent = days === null ? "--" : days;
    els.daysUntilExamCard.textContent = days === null ? "--" : days;

    if(todayAttempts >= dailyTarget){
      els.todayPlanTitle.textContent = "今日基本量已完成 🎉";
      els.todayPlanText.textContent = wrongIds.length
        ? `接下來建議複習 ${wrongIds.length} 題錯題，或針對最弱單元加強。`
        : "今天已達標，可以針對最弱單元做一輪加強。";
    }else if(weakest && weakest.attempts >= 3){
      els.todayPlanTitle.textContent = `今日建議：先完成 ${dailyTarget - todayAttempts} 題，再補強「${weakest.name}」`;
      els.todayPlanText.textContent = `目前最弱單元正確率 ${weakest.rate}%，完成今日基本量後再進入專項練習。`;
    }else{
      els.todayPlanTitle.textContent = `今日建議：先做 ${Math.max(1, dailyTarget - todayAttempts)} 題`;
      els.todayPlanText.textContent = "累積足夠作答紀錄後，系統會開始辨識最弱單元。";
    }
  }

  function refreshHome(){
    els.totalQuestions.textContent = allQuestions.length;
    const wrongIds = loadWrong().filter(id => allQuestions.some(q => q.id === id));
    els.wrongCountLabel.textContent = `目前 ${wrongIds.length} 題`;
    const wrongButton = document.querySelector('[data-mode="wrong"]');
    if(wrongButton) wrongButton.disabled = wrongIds.length === 0;
    updateDashboard();
    renderWeakness();
  }

  function renderWeakness(){
    const arr = getTopicStats(loadStats()).slice(0,6);
    if(!arr.length){
      els.weaknessList.innerHTML = '<div class="empty-state">完成幾題後，這裡會自動整理正確率較低的單元。</div>';
      return;
    }
    els.weaknessList.innerHTML = arr.map((x,i) => `
      <div class="weak-row ${i === 0 ? "weakest-row" : ""}">
        <div class="weak-name">${i === 0 ? "⚠️ " : ""}${escapeHtml(x.name)}</div>
        <div class="weak-track"><div class="weak-fill" style="width:${x.rate}%"></div></div>
        <div class="weak-rate">${x.rate}%</div>
      </div>`).join("");
  }

  function buildQuiz(mode){
    lastMode = mode;
    const active = allQuestions.filter(q => q.is_active !== false);
    const wrongIds = loadWrong();
    if(mode === "random10") quiz = shuffle(active).slice(0, Math.min(10, active.length));
    if(mode === "random20") quiz = shuffle(active).slice(0, Math.min(20, active.length));
    if(mode === "subject1") quiz = shuffle(active.filter(q => String(q.subject).includes("科目一")));
    if(mode === "subject2") quiz = shuffle(active.filter(q => String(q.subject).includes("科目二")));
    if(mode === "calc") quiz = shuffle(active.filter(q => String(q.tags || "").includes("計算")));
    if(mode === "unit4") quiz = shuffle(active.filter(q => String(q.tags || "").includes("單元04")));
    if(mode === "unit6") quiz = shuffle(active.filter(q => String(q.tags || "").includes("單元06")));
    if(mode === "unit7") quiz = shuffle(active.filter(q => String(q.tags || "").includes("單元07")));
    if(mode === "unit8") quiz = shuffle(active.filter(q => String(q.tags || "").includes("單元08")));
    if(mode === "wrong") quiz = shuffle(active.filter(q => wrongIds.includes(q.id)));
    if(mode === "all") quiz = shuffle(active);

    if(!quiz.length){
      alert("目前沒有符合這個模式的題目。");
      return;
    }
    index = 0; correctCount = 0; answered = false; sessionAnswers = [];
    setView("quizView");
    renderQuestion();
  }

  function renderQuestion(){
    answered = false;
    const q = quiz[index];
    els.questionProgress.textContent = `${index+1} / ${quiz.length}`;
    els.quizScore.textContent = `答對 ${correctCount}`;
    els.progressBar.style.width = `${Math.round(index / quiz.length * 100)}%`;
    els.questionSubject.textContent = q.subject || "題目";
    els.questionTopic.textContent = q.topic || "未分類";
    els.questionLevel.textContent = q.level || "";
    els.questionText.textContent = q.question;
    els.feedback.className = "feedback hidden";
    els.nextBtn.classList.add("hidden");

    const opts = ["A","B","C","D"];
    els.options.innerHTML = opts.map(letter => {
      const text = q["option_" + letter.toLowerCase()] || "";
      return `<button class="option" data-answer="${letter}">
        <span class="option-letter">${letter}</span>
        <span>${escapeHtml(text)}</span>
      </button>`;
    }).join("");
    els.options.querySelectorAll(".option").forEach(btn => {
      btn.addEventListener("click", () => answer(btn.dataset.answer));
    });
  }

  function answer(choice){
    if(answered) return;
    answered = true;
    const q = quiz[index];
    const correct = String(q.answer).toUpperCase();
    const isCorrect = choice === correct;
    if(isCorrect) correctCount++;

    els.options.querySelectorAll(".option").forEach(btn => {
      btn.disabled = true;
      if(btn.dataset.answer === correct) btn.classList.add("correct");
      if(btn.dataset.answer === choice && !isCorrect) btn.classList.add("wrong");
    });

    recordAnswer(q, isCorrect);
    sessionAnswers.push({id:q.id, subject:q.subject, correct:isCorrect});

    els.feedback.classList.remove("hidden");
    els.feedback.classList.add(isCorrect ? "good" : "bad");
    els.feedbackTitle.textContent = isCorrect ? "✅ 答對了" : `❌ 答錯了｜正確答案：${correct}`;
    els.explanation.textContent = q.explanation || "目前尚未提供解析。";

    const sourceParts = [];
    if(q.source_title) sourceParts.push(`<b>來源：</b>${escapeHtml(q.source_title)}`);
    if(q.source_locator) sourceParts.push(`<b>位置：</b>${escapeHtml(q.source_locator)}`);
    if(q.source_url){
      const safeUrl = /^https?:\/\//i.test(q.source_url) ? q.source_url : "#";
      sourceParts.push(`<a href="${escapeAttr(safeUrl)}" target="_blank" rel="noopener">查看官方來源 ↗</a>`);
    }
    els.sourceBox.innerHTML = sourceParts.join("　");
    els.nextBtn.textContent = index === quiz.length - 1 ? "查看結果 →" : "下一題 →";
    els.nextBtn.classList.remove("hidden");
    els.quizScore.textContent = `答對 ${correctCount}`;
  }

  function recordAnswer(q, isCorrect){
    const stats = loadStats();
    const s = stats[q.id] || {attempts:0, correct:0, wrong:0};
    const todayWasSame = isSameLocalDay(s.last);
    const priorTodayAttempts = todayWasSame ? (s.attemptsToday || 1) : 0;
    s.attempts++;
    isCorrect ? s.correct++ : s.wrong++;
    s.attemptsToday = priorTodayAttempts + 1;
    s.last = new Date().toISOString();
    stats[q.id] = s;
    saveStats(stats);

    let wrong = loadWrong();
    if(isCorrect){
      wrong = wrong.filter(id => id !== q.id);
    }else if(!wrong.includes(q.id)){
      wrong.push(q.id);
    }
    saveWrong(wrong);
  }

  function next(){
    if(!answered) return;
    if(index < quiz.length - 1){
      index++;
      renderQuestion();
    }else showResult();
  }

  function showResult(){
    els.progressBar.style.width = "100%";
    const overall = pct(correctCount, quiz.length);
    els.resultScore.textContent = overall;
    els.resultEmoji.textContent = overall >= 80 ? "🎉" : overall >= 60 ? "💪" : "📚";
    els.resultTitle.textContent = overall >= 80 ? "很穩，繼續保持！" : overall >= 60 ? "有進步空間，再刷一輪！" : "先抓弱點，再練一次！";
    els.resultSummary.textContent = `本次 ${quiz.length} 題，答對 ${correctCount} 題、答錯 ${quiz.length-correctCount} 題。`;

    const bySubject = {};
    sessionAnswers.forEach(a => {
      const key = String(a.subject).includes("科目一") ? "科目一" :
                  String(a.subject).includes("科目二") ? "科目二" : a.subject || "其他";
      bySubject[key] ||= {total:0, correct:0};
      bySubject[key].total++;
      if(a.correct) bySubject[key].correct++;
    });

    const rows = Object.entries(bySubject).map(([name,v]) => {
      const score = pct(v.correct,v.total);
      const pass = score >= (CFG.PASS_SINGLE_SUBJECT || 60);
      return `<div class="score-row"><span>${name}</span><b>${score}% ${pass ? "✅" : "⚠️"}</b></div>`;
    });

    if(bySubject["科目一"] && bySubject["科目二"]){
      const s1 = pct(bySubject["科目一"].correct, bySubject["科目一"].total);
      const s2 = pct(bySubject["科目二"].correct, bySubject["科目二"].total);
      const weighted = Math.round(s1*(CFG.SUBJECT1_WEIGHT || .4) + s2*(CFG.SUBJECT2_WEIGHT || .6));
      const pass = weighted >= (CFG.PASS_TOTAL || 70) &&
                   s1 >= (CFG.PASS_SINGLE_SUBJECT || 60) &&
                   s2 >= (CFG.PASS_SINGLE_SUBJECT || 60);
      rows.push(`<div class="score-row"><span>依 40%／60% 加權參考</span><b>${weighted}% ${pass ? "✅ 通過線" : "⚠️ 未達通過線"}</b></div>`);
    }
    els.subjectScores.innerHTML = rows.join("");
    setView("resultView");
  }

  function escapeHtml(s){
    return String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }
  function escapeAttr(s){ return escapeHtml(s); }

  function bind(){
    document.querySelectorAll(".mode-card").forEach(btn => {
      btn.addEventListener("click", () => buildQuiz(btn.dataset.mode));
    });
    $("nextBtn").addEventListener("click", next);
    $("quitBtn").addEventListener("click", () => {
      if(confirm("要結束這次練習並回首頁嗎？")) { setView("homeView"); refreshHome(); }
    });
    $("homeBtn").addEventListener("click", () => { setView("homeView"); refreshHome(); });
    $("retryBtn").addEventListener("click", () => buildQuiz(lastMode));
    $("resetStatsBtn").addEventListener("click", () => {
      if(confirm("確定要清除這個裝置上的所有作答與錯題紀錄嗎？")){
        localStorage.removeItem(statsKey());
        localStorage.removeItem(wrongKey());
        refreshHome();
      }
    });
    $("themeBtn").addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem(themeKey(), nextTheme);
      $("themeBtn").textContent = nextTheme === "dark" ? "☀️" : "🌙";
    });
  }

  async function init(){
    initEls();
    els.appTitle.textContent = CFG.APP_TITLE || "台電電力交易平台資格測驗｜刷題系統";
    const savedTheme = localStorage.getItem(themeKey());
    const preferredDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = savedTheme || (preferredDark ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    $("themeBtn").textContent = theme === "dark" ? "☀️" : "🌙";
    bind();
    await loadQuestions();
    refreshHome();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
