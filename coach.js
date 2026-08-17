(() => {
  const CFG = window.QUIZ_CONFIG || {};
  const STATS_KEY = "taipower_exam_stats_v1";
  const WRONG_KEY = "taipower_exam_wrong_ids_v1";
  const DAILY_HISTORY_KEY = "taipower_exam_daily_history_v1";
  const BEST_STREAK_KEY = "taipower_exam_best_answer_streak_v1";
  const SNAPSHOT_KEY = "taipower_exam_progress_snapshot_v1";
  const LAST_MESSAGE_KEY = "taipower_exam_last_coach_message_v1";

  let answerStreak = 0;
  let sessionBest = 0;
  let quizWasActive = false;

  function loadJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  }

  function saveJson(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function questions(){
    const list = Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : [];
    const seen = new Set();
    return list.filter(q => {
      if(!q || !q.id || q.is_active === false || seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
  }

  function stats(){ return loadJson(STATS_KEY, {}); }
  function wrongIds(){ return loadJson(WRONG_KEY, []); }

  function localDateKey(date = new Date()){
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    const d = String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
  }

  function dateFromKey(key){
    const [y,m,d] = key.split("-").map(Number);
    return new Date(y, m-1, d);
  }

  function shiftDateKey(key, delta){
    const d = dateFromKey(key);
    d.setDate(d.getDate()+delta);
    return localDateKey(d);
  }

  function isSameLocalDay(iso, now = new Date()){
    if(!iso) return false;
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  function recordActivityDate(){
    const days = new Set(loadJson(DAILY_HISTORY_KEY, []));
    days.add(localDateKey());
    saveJson(DAILY_HISTORY_KEY, [...days].sort());
  }

  function learningDayStreak(){
    const days = new Set(loadJson(DAILY_HISTORY_KEY, []));
    if(!days.size) return 0;
    const today = localDateKey();
    let cursor = days.has(today) ? today : shiftDateKey(today, -1);
    if(!days.has(cursor)) return 0;
    let count = 0;
    while(days.has(cursor)){
      count++;
      cursor = shiftDateKey(cursor, -1);
    }
    return count;
  }

  function todayAttemptsFor(predicate = () => true){
    const s = stats();
    let total = 0;
    questions().forEach(q => {
      if(!predicate(q)) return;
      const row = s[q.id];
      if(row && row.attempts && isSameLocalDay(row.last)) total += row.attemptsToday || 1;
    });
    return total;
  }

  function allTimeAttemptsFor(predicate = () => true){
    const s = stats();
    let total = 0;
    questions().forEach(q => {
      if(!predicate(q)) return;
      const row = s[q.id];
      if(row && row.attempts) total += row.attempts;
    });
    return total;
  }

  function topicStats(){
    const s = stats();
    const groups = {};
    questions().forEach(q => {
      const row = s[q.id];
      if(!row || !row.attempts) return;
      const name = q.topic || "其他";
      groups[name] ||= {attempts:0, correct:0};
      groups[name].attempts += row.attempts || 0;
      groups[name].correct += row.correct || 0;
    });
    return Object.entries(groups).map(([name,v]) => ({
      name,
      attempts:v.attempts,
      correct:v.correct,
      rate:v.attempts ? Math.round(v.correct/v.attempts*100) : 0
    })).sort((a,b) => a.rate-b.rate || b.attempts-a.attempts);
  }

  function ensureStyles(){
    if(document.getElementById("coachStyles")) return;
    const style = document.createElement("style");
    style.id = "coachStyles";
    style.textContent = `
      .coach-panel{padding:24px;margin-bottom:18px;border-color:color-mix(in srgb,var(--brand) 26%,var(--line))}
      .coach-header-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .coach-day-streak{white-space:nowrap;padding:8px 11px;border-radius:999px;background:var(--soft);font-size:12px;font-weight:800;color:var(--brand)}
      .coach-headline{margin:10px 0 18px;padding:14px 16px;border-radius:14px;background:var(--soft);font-weight:750;line-height:1.6}
      .coach-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:18px}
      .coach-box{border:1px solid var(--line);border-radius:16px;padding:16px}
      .coach-box h4{margin:0 0 12px;font-size:15px}
      .coach-tasks{display:grid;gap:11px}
      .coach-task{padding:11px 12px;border-radius:12px;background:color-mix(in srgb,var(--soft) 62%,var(--panel))}
      .coach-task-top{display:flex;justify-content:space-between;gap:10px;font-size:13px;margin-bottom:7px}
      .coach-task-top b{font-weight:800}.coach-task-top span{color:var(--muted);white-space:nowrap}
      .coach-task.done .coach-task-top b{color:var(--good)}
      .coach-task-bar{height:7px;border-radius:999px;background:var(--line);overflow:hidden}
      .coach-task-bar i{display:block;height:100%;background:var(--brand2);border-radius:999px}
      .coach-badges{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
      .coach-badge{padding:11px;border:1px solid var(--line);border-radius:12px;background:var(--panel);min-height:72px}
      .coach-badge strong{display:block;font-size:13px;margin-bottom:4px}.coach-badge small{color:var(--muted);line-height:1.35}
      .coach-badge.locked{opacity:.48;filter:saturate(.55)}
      .coach-progress-hint{font-size:13px;color:var(--muted);line-height:1.55;margin-top:14px}
      .coach-streak-pill{padding:3px 8px;border-radius:999px;background:var(--soft);color:var(--brand);font-weight:800}
      .coach-feedback{margin:10px 0 12px;padding:10px 12px;border-radius:10px;font-size:13px;font-weight:700;line-height:1.55;background:color-mix(in srgb,var(--panel) 55%,transparent)}
      .coach-feedback.good{color:var(--good)}.coach-feedback.bad{color:var(--bad)}
      .coach-result{margin:18px 0;padding:14px 16px;border-radius:14px;background:var(--soft);font-weight:800;line-height:1.55;text-align:left}
      @media(max-width:760px){.coach-grid{grid-template-columns:1fr}.coach-badges{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:440px){.coach-panel{padding:18px}.coach-header-row{align-items:flex-start}.coach-day-streak{font-size:11px}.coach-badges{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureCoachPanel(){
    if(document.getElementById("coachPanel")) return;
    const todayPlan = document.querySelector(".today-plan");
    if(!todayPlan) return;
    const panel = document.createElement("section");
    panel.id = "coachPanel";
    panel.className = "card coach-panel";
    panel.innerHTML = `
      <div class="coach-header-row">
        <div><span class="eyebrow">備考教練</span><h3 style="margin:4px 0 0">今天的任務與成就</h3></div>
        <div id="coachDayStreak" class="coach-day-streak">🔥 連續練習 0 天</div>
      </div>
      <div id="coachHeadline" class="coach-headline">今天先把基本量做完，剩下交給累積。</div>
      <div class="coach-grid">
        <div class="coach-box"><h4>🎯 今日任務</h4><div id="coachTasks" class="coach-tasks"></div></div>
        <div class="coach-box"><h4>🏆 成就徽章</h4><div id="coachBadges" class="coach-badges"></div></div>
      </div>
      <div id="coachProgressHint" class="coach-progress-hint"></div>`;
    todayPlan.insertAdjacentElement("afterend", panel);
  }

  function renderTask(label, current, target){
    const done = current >= target;
    const width = Math.min(100, Math.round(current/target*100));
    return `<div class="coach-task ${done ? "done" : ""}">
      <div class="coach-task-top"><b>${done ? "✅ " : "□ "}${label}</b><span>${current} / ${target}</span></div>
      <div class="coach-task-bar"><i style="width:${width}%"></i></div>
    </div>`;
  }

  function renderBadge(icon, title, hint, achieved){
    return `<div class="coach-badge ${achieved ? "" : "locked"}"><strong>${icon} ${title}</strong><small>${achieved ? "已解鎖" : hint}</small></div>`;
  }

  function renderCoachPanel(){
    ensureCoachPanel();
    const taskBox = document.getElementById("coachTasks");
    if(!taskBox) return;

    const target = CFG.DAILY_TARGET || 20;
    const todayTotal = todayAttemptsFor();
    const todayCalc = todayAttemptsFor(q => String(q.tags || "").includes("計算"));
    const weak = topicStats().find(x => x.attempts >= 3);
    const thirdLabel = weak ? `弱點「${weak.name}」5題` : "高難度題 5題";
    const thirdCount = weak
      ? todayAttemptsFor(q => (q.topic || "其他") === weak.name)
      : todayAttemptsFor(q => String(q.level || "").includes("綜合") || String(q.tags || "").includes("綜合"));

    taskBox.innerHTML = [
      renderTask(`今日總量 ${target} 題`, todayTotal, target),
      renderTask("計算題 10 題", todayCalc, 10),
      renderTask(thirdLabel, thirdCount, 5)
    ].join("");

    const allAttempts = allTimeAttemptsFor();
    const calcAttempts = allTimeAttemptsFor(q => String(q.tags || "").includes("計算"));
    const unit8Attempts = allTimeAttemptsFor(q => String(q.tags || "").includes("單元08"));
    const dayStreak = learningDayStreak();
    const bestAnswerStreak = Number(localStorage.getItem(BEST_STREAK_KEY) || 0);

    document.getElementById("coachDayStreak").textContent = `🔥 連續練習 ${dayStreak} 天`;
    document.getElementById("coachBadges").innerHTML = [
      renderBadge("🎯","起步者","完成20次作答",allAttempts >= 20),
      renderBadge("⚡","百題節奏","累積100次作答",allAttempts >= 100),
      renderBadge("🧮","計算手感","完成30次計算題",calcAttempts >= 30),
      renderBadge("🔥","連對高手","單輪連對5題",bestAnswerStreak >= 5),
      renderBadge("📅","穩定三日","連續練習3天",dayStreak >= 3),
      renderBadge("📘","第8單元攻克","第8單元累積50次作答",unit8Attempts >= 50)
    ].join("");

    const latest = localStorage.getItem(LAST_MESSAGE_KEY);
    const wrong = wrongIds().length;
    let headline = latest || "先完成今天的基本量；每一次訂正都在縮小真正考試時的失分範圍。";
    if(todayTotal >= target && !latest) headline = "🎉 今日基本量完成。接下來把錯題做對，比繼續堆題數更有效。";
    document.getElementById("coachHeadline").textContent = headline;

    let hint = `目前累積 ${allAttempts} 次作答，其中計算題 ${calcAttempts} 次。`;
    if(wrong) hint += ` 錯題本還有 ${wrong} 題，今天結束前挑幾題重新做。`;
    else if(allAttempts) hint += " 錯題本目前清空，維持這個節奏。";
    document.getElementById("coachProgressHint").textContent = hint;
  }

  function ensureQuizStreak(){
    const meta = document.querySelector(".progress-meta");
    if(!meta || document.getElementById("coachAnswerStreak")) return;
    const span = document.createElement("span");
    span.id = "coachAnswerStreak";
    span.className = "coach-streak-pill";
    span.textContent = "🔥 連對 0";
    meta.appendChild(span);
  }

  function updateQuizStreak(){
    ensureQuizStreak();
    const el = document.getElementById("coachAnswerStreak");
    if(el) el.textContent = `🔥 連對 ${answerStreak}`;
  }

  function currentQuestion(){
    const text = document.getElementById("questionText")?.textContent || "";
    return questions().find(q => q.question === text) || null;
  }

  function ensureCoachFeedback(){
    let box = document.getElementById("coachFeedback");
    if(box) return box;
    const feedback = document.getElementById("feedback");
    const source = document.getElementById("sourceBox");
    if(!feedback) return null;
    box = document.createElement("div");
    box.id = "coachFeedback";
    box.className = "coach-feedback";
    if(source) feedback.insertBefore(box, source); else feedback.appendChild(box);
    return box;
  }

  function encouragement(isCorrect, q){
    const isCalc = String(q?.tags || "").includes("計算") || String(q?.level || "").includes("計算");
    const topic = String(q?.topic || "");
    if(isCorrect){
      if(answerStreak >= 10) return `🏆 連續答對 ${answerStreak} 題，這輪的判斷與計算都很穩。`;
      if(answerStreak >= 5) return `🔥 連續答對 ${answerStreak} 題，節奏很好，繼續守住每一步。`;
      if(answerStreak >= 3) return `🔥 連續答對 ${answerStreak} 題，手感正在建立。`;
      if(isCalc) return "🧮 計算流程抓到了。考場上也照這個順序：先判斷規則，再代入數字。";
      if(String(q?.level || "").includes("綜合")) return "✅ 這題不只靠記憶，你把判斷流程走對了。";
      return "✅ 這個觀念拿下了，繼續把它變成穩定得分題。";
    }
    if(isCalc) return "🧮 這題先別只看答案：找出是『公式、單位、級距還是代入』哪一步出錯。";
    if(topic.includes("第7單元")) return "第7單元先分清楚：每秒SBSPM、4秒滾動、每小時最小值是三個不同層次。";
    if(topic.includes("第8單元")) return "第8單元先判斷這筆錢屬於容量費、效能費、品質指標還是電能費，再開始算。";
    return "這題值得留在錯題本。看完解析後，下一輪再把它做對一次。";
  }

  function handleAnswer(){
    const feedback = document.getElementById("feedback");
    if(!feedback || feedback.classList.contains("hidden")) return;
    const isCorrect = feedback.classList.contains("good");
    if(isCorrect){
      answerStreak++;
      sessionBest = Math.max(sessionBest, answerStreak);
      const oldBest = Number(localStorage.getItem(BEST_STREAK_KEY) || 0);
      if(answerStreak > oldBest) localStorage.setItem(BEST_STREAK_KEY, String(answerStreak));
    }else{
      answerStreak = 0;
    }
    recordActivityDate();
    updateQuizStreak();
    const box = ensureCoachFeedback();
    if(box){
      box.className = `coach-feedback ${isCorrect ? "good" : "bad"}`;
      box.textContent = encouragement(isCorrect, currentQuestion());
    }
    renderCoachPanel();
  }

  function snapshot(){
    const out = {};
    topicStats().forEach(x => {
      if(x.attempts >= 3) out[x.name] = {rate:x.rate, attempts:x.attempts};
    });
    return out;
  }

  function ensureResultCoach(){
    let box = document.getElementById("coachResultMessage");
    if(box) return box;
    const scores = document.getElementById("subjectScores");
    if(!scores) return null;
    box = document.createElement("div");
    box.id = "coachResultMessage";
    box.className = "coach-result";
    scores.insertAdjacentElement("beforebegin", box);
    return box;
  }

  function handleResult(){
    const box = ensureResultCoach();
    if(!box) return;
    const current = snapshot();
    const previous = loadJson(SNAPSHOT_KEY, {});
    let best = null;
    Object.entries(current).forEach(([name,v]) => {
      const prev = previous[name];
      if(!prev) return;
      const delta = v.rate - prev.rate;
      if(delta > 0 && (!best || delta > best.delta)) best = {name, from:prev.rate, to:v.rate, delta};
    });

    const overall = Number(document.getElementById("resultScore")?.textContent || 0);
    let message;
    if(best && best.delta >= 5){
      message = `📈 「${best.name}」正確率 ${best.from}% → ${best.to}%：這個弱點正在變成得分區。`;
    }else if(overall >= 90){
      message = "🏆 這一輪很穩。下一輪可以刻意增加第7、8單元與綜合計算題。";
    }else if(overall >= 80){
      message = "🔥 已進入穩定得分區。把這輪錯題清掉，分數會更扎實。";
    }else if(overall >= 70){
      message = "✅ 已靠近通過節奏。現在最值得做的是把錯題集中重練。";
    }else if(overall >= 60){
      message = "💪 基礎已經有了，先攻最低正確率單元，不用平均用力。";
    }else{
      message = "📚 先不要拼題數。把這輪錯題的公式與判斷步驟弄懂，再重做一次。";
    }
    if(sessionBest >= 5) message += ` 本輪最高連續答對 ${sessionBest} 題。`;
    box.textContent = message;
    localStorage.setItem(LAST_MESSAGE_KEY, message);
    saveJson(SNAPSHOT_KEY, current);
    renderCoachPanel();
  }

  function observeViews(){
    const quizView = document.getElementById("quizView");
    const resultView = document.getElementById("resultView");
    if(quizView){
      const update = () => {
        const active = quizView.classList.contains("active");
        if(active && !quizWasActive){
          answerStreak = 0;
          sessionBest = 0;
          updateQuizStreak();
        }
        quizWasActive = active;
      };
      new MutationObserver(update).observe(quizView,{attributes:true,attributeFilter:["class"]});
      update();
    }
    if(resultView){
      let wasActive = resultView.classList.contains("active");
      new MutationObserver(() => {
        const active = resultView.classList.contains("active");
        if(active && !wasActive) setTimeout(handleResult,0);
        wasActive = active;
      }).observe(resultView,{attributes:true,attributeFilter:["class"]});
    }
  }

  document.addEventListener("click", event => {
    const option = event.target.closest?.(".option");
    if(option) setTimeout(handleAnswer,0);

    const reset = event.target.closest?.("#resetStatsBtn");
    if(reset){
      setTimeout(() => {
        const s = loadJson(STATS_KEY, {});
        if(!Object.keys(s).length){
          [DAILY_HISTORY_KEY,BEST_STREAK_KEY,SNAPSHOT_KEY,LAST_MESSAGE_KEY].forEach(k => localStorage.removeItem(k));
          renderCoachPanel();
        }
      },80);
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    ensureStyles();
    ensureCoachPanel();
    ensureQuizStreak();
    observeViews();
    setTimeout(renderCoachPanel, 20);
  });
})();
