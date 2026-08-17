(() => {
  const CFG = window.QUIZ_CONFIG || {};
  const ALL = (Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : []).filter(validQuestion).filter(q => q.is_active !== false);
  const statsKey = "taipower_exam_stats_v1";
  const wrongKey = "taipower_exam_wrong_ids_v1";
  const $ = id => document.getElementById(id);
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  let subjectIndex = 0;
  let timerId = null;
  let secondsLeft = 0;
  const sets = [[], []];
  const answers = [{}, {}];
  const results = [null, null];

  function validQuestion(q){
    return q && q.id && q.question && ["A","B","C","D"].includes(String(q.answer).toUpperCase());
  }

  function loadJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  }
  function saveJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function sameDay(iso){
    if(!iso) return false;
    const a = new Date(iso), b = new Date();
    return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  }

  function prepareSets(){
    const s1Pool = ALL.filter(q => String(q.subject || "").includes("科目一"));
    const s2Pool = ALL.filter(q => String(q.subject || "").includes("科目二"));
    const s1Count = Math.min(Number(CFG.MOCK_SUBJECT1_COUNT || 30), s1Pool.length);
    const s2Count = Math.min(Number(CFG.MOCK_SUBJECT2_COUNT || 45), s2Pool.length);
    sets[0] = shuffle(s1Pool).slice(0, s1Count);
    sets[1] = shuffle(s2Pool).slice(0, s2Count);
    $("s1Count").textContent = s1Count;
    $("s2Count").textContent = s2Count;
  }

  function showOnly(id){
    ["introView","examView","breakView","resultView"].forEach(v => $(v).classList.toggle("hidden", v !== id));
    window.scrollTo({top:0, behavior:"smooth"});
  }

  function startSubject(idx){
    subjectIndex = idx;
    const set = sets[idx];
    if(!set.length){ alert("此科目前題庫不足，請先回首頁更新題庫。"); return; }
    const minutes = idx === 0 ? Number(CFG.MOCK_SUBJECT1_MINUTES || 60) : Number(CFG.MOCK_SUBJECT2_MINUTES || 90);
    secondsLeft = minutes * 60;
    $("subjectTitle").textContent = idx === 0 ? "科目一｜電力系統與電力市場" : "科目二｜電力交易平台市場規則";
    renderQuestions();
    updateProgress();
    updateTimer();
    clearInterval(timerId);
    timerId = setInterval(() => {
      secondsLeft--;
      updateTimer();
      if(secondsLeft <= 0){ clearInterval(timerId); submitSubject(true); }
    }, 1000);
    showOnly("examView");
  }

  function renderQuestions(){
    const set = sets[subjectIndex];
    $("questionList").innerHTML = set.map((q, i) => `
      <section class="mock-card mock-question" id="mq-${esc(q.id)}">
        <div class="mock-meta">第 ${i+1} 題｜${esc(q.topic || "未分類")}｜${esc(q.level || "")}</div>
        <h3>${i+1}. ${esc(q.question)}</h3>
        ${["A","B","C","D"].map(letter => `
          <label class="mock-option">
            <input type="radio" name="q-${esc(q.id)}" value="${letter}" ${answers[subjectIndex][q.id]===letter ? "checked" : ""}>
            <span><b>${letter}.</b> ${esc(q["option_"+letter.toLowerCase()] || "")}</span>
          </label>`).join("")}
      </section>`).join("");

    $("questionList").querySelectorAll("input[type=radio]").forEach(input => {
      input.addEventListener("change", e => {
        const qid = e.target.name.replace(/^q-/, "");
        answers[subjectIndex][qid] = e.target.value;
        updateProgress();
      });
    });
  }

  function updateProgress(){
    const total = sets[subjectIndex].length;
    const answered = Object.keys(answers[subjectIndex]).filter(id => answers[subjectIndex][id]).length;
    $("answerProgress").textContent = `已作答 ${answered} / ${total}`;
    const left = total - answered;
    $("unansweredHint").textContent = left ? `還有 ${left} 題未作答；交卷後未作答題視為錯誤。` : "已全部作答。";
  }

  function updateTimer(){
    const m = Math.max(0, Math.floor(secondsLeft / 60));
    const s = Math.max(0, secondsLeft % 60);
    $("timer").textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    $("timer").classList.toggle("fail", secondsLeft <= 300);
  }

  function submitSubject(auto=false){
    const set = sets[subjectIndex];
    const unanswered = set.filter(q => !answers[subjectIndex][q.id]).length;
    if(!auto && unanswered && !confirm(`還有 ${unanswered} 題未作答，確定交卷嗎？`)) return;
    if(!auto && !confirm("確定交卷？交卷後不能修改本科技答案。")) return;
    clearInterval(timerId);
    results[subjectIndex] = scoreSet(set, answers[subjectIndex]);
    if(subjectIndex === 0) showOnly("breakView");
    else finishMock();
  }

  function scoreSet(set, answerMap){
    let correct = 0;
    const details = [];
    set.forEach(q => {
      const selected = answerMap[q.id] || "";
      const ok = selected === String(q.answer).toUpperCase();
      if(ok) correct++;
      details.push({q, selected, ok});
    });
    return {total:set.length, correct, score:set.length ? Math.round(correct/set.length*100) : 0, details};
  }

  function recordToLearningHistory(){
    const stats = loadJson(statsKey, {});
    let wrong = loadJson(wrongKey, []);
    results.forEach(res => res.details.forEach(({q, ok}) => {
      const s = stats[q.id] || {attempts:0, correct:0, wrong:0};
      const todayAttempts = sameDay(s.last) ? (s.attemptsToday || 0) : 0;
      s.attempts = (s.attempts || 0) + 1;
      if(ok) s.correct = (s.correct || 0) + 1;
      else s.wrong = (s.wrong || 0) + 1;
      s.attemptsToday = todayAttempts + 1;
      s.last = new Date().toISOString();
      stats[q.id] = s;
      if(ok) wrong = wrong.filter(id => id !== q.id);
      else if(!wrong.includes(q.id)) wrong.push(q.id);
    }));
    saveJson(statsKey, stats);
    saveJson(wrongKey, [...new Set(wrong)]);
  }

  function weakTopicsFromMock(){
    const map = {};
    results.forEach(res => res.details.forEach(({q,ok}) => {
      const key = q.topic || "其他";
      map[key] ||= {total:0, correct:0};
      map[key].total++;
      if(ok) map[key].correct++;
    }));
    return Object.entries(map).map(([name,v]) => ({name, total:v.total, correct:v.correct, rate:Math.round(v.correct/v.total*100)}))
      .sort((a,b) => a.rate-b.rate || b.total-a.total).slice(0,6);
  }

  function finishMock(){
    recordToLearningHistory();
    const s1 = results[0].score, s2 = results[1].score;
    const avg = Math.round((s1+s2)/2);
    const passSingle = Number(CFG.PASS_SINGLE_SUBJECT || 60);
    const passTotal = Number(CFG.PASS_TOTAL || 70);
    const pass = s1 >= passSingle && s2 >= passSingle && avg >= passTotal;

    $("s1Score").textContent = s1;
    $("s2Score").textContent = s2;
    $("avgScore").textContent = avg;
    $("s1Pass").textContent = s1 >= passSingle ? "✅ 達單科60分" : "⚠️ 未達單科60分";
    $("s2Pass").textContent = s2 >= passSingle ? "✅ 達單科60分" : "⚠️ 未達單科60分";
    $("s1Score").className = `mock-score ${s1>=passSingle?"pass":"fail"}`;
    $("s2Score").className = `mock-score ${s2>=passSingle?"pass":"fail"}`;
    $("avgScore").className = `mock-score ${pass?"pass":"fail"}`;
    $("passTitle").textContent = pass ? "🎉 本次模擬：通過" : "📚 本次模擬：尚未通過";
    $("resultRule").textContent = pass ? "兩科平均已達70分，且兩科皆不低於60分。" : "請同時檢查兩科平均是否達70分，以及是否有任一科低於60分。";

    const weak = weakTopicsFromMock();
    $("weakTopics").innerHTML = weak.length ? weak.map((x,i) => `<div class="review-item"><b>${i+1}. ${esc(x.name)}</b><div>本次 ${x.correct}/${x.total} 題答對｜正確率 ${x.rate}%</div></div>`).join("") : "無資料";

    const wrongs = results.flatMap(r => r.details).filter(x => !x.ok);
    $("reviewList").innerHTML = wrongs.length ? wrongs.map(({q,selected},i) => `
      <div class="review-item">
        <div class="mock-meta">${esc(q.subject)}｜${esc(q.topic || "")}</div>
        <b>${i+1}. ${esc(q.question)}</b>
        <p><span class="answer-chip">你的答案：${selected || "未作答"}</span><span class="answer-chip">正確答案：${esc(q.answer)}</span></p>
        <p>${esc(q.explanation || "")}</p>
        <small>${esc(q.source_title || "")}｜${esc(q.source_locator || "")}</small>
      </div>`).join("") : "🎉 本次沒有錯題。";

    showOnly("resultView");
  }

  $("startMockBtn").addEventListener("click", () => startSubject(0));
  $("startS2Btn").addEventListener("click", () => startSubject(1));
  $("submitSubjectBtn").addEventListener("click", () => submitSubject(false));
  prepareSets();
})();
