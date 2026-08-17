(() => {
  const REVIEW_KEY = "taipower_exam_spaced_review_v1";
  const STATS_KEY = "taipower_exam_stats_v1";
  const EXAM_DATE = (window.QUIZ_CONFIG && window.QUIZ_CONFIG.EXAM_DATE) || "2026-10-03";

  function loadJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  }
  function saveJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function qs(){
    const seen = new Set();
    return (Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : []).filter(q => {
      if(!q || !q.id || q.is_active === false || seen.has(q.id)) return false;
      seen.add(q.id); return true;
    });
  }
  const addHours = (date,h) => new Date(date.getTime()+h*3600000);
  const addDays = (date,d) => addHours(date,d*24);

  function bootstrap(){
    const review = loadJson(REVIEW_KEY, {});
    const stats = loadJson(STATS_KEY, {});
    let changed = false;
    qs().forEach(q => {
      if(review[q.id] || !stats[q.id]?.attempts) return;
      const s = stats[q.id];
      const last = s.last ? new Date(s.last) : new Date();
      const accuracy = (s.correct || 0) / Math.max(1, s.attempts || 1);
      const hadWrong = (s.wrong || 0) > 0;
      let correctStreak = 0;
      if(!hadWrong && accuracy === 1) correctStreak = Math.min(3, s.correct || 1);
      else if(accuracy >= .8 && s.correct) correctStreak = 1;
      let due;
      if(hadWrong && accuracy < .6) due = last;
      else if(correctStreak >= 3) due = addDays(last,14);
      else if(correctStreak >= 2) due = addDays(last,7);
      else due = addDays(last,3);
      review[q.id] = {
        due: due.toISOString(),
        correctStreak,
        hadWrong,
        lastResult: hadWrong && accuracy < .6 ? "wrong" : "correct",
        lastReviewed: s.last || null,
        intervalDays: Math.max(0, Math.round((due-last)/86400000))
      };
      changed = true;
    });
    if(changed) saveJson(REVIEW_KEY, review);
    return review;
  }

  function memoryState(q, review, stats, now = new Date()){
    const s = stats[q.id];
    if(!s || !s.attempts) return "new";
    const r = review[q.id];
    const accuracy = (s.correct || 0) / Math.max(1, s.attempts || 1);
    if(!r) return accuracy < .6 ? "red" : "yellow";
    if(r.lastResult === "wrong" || accuracy < .6) return "red";
    if((r.correctStreak || 0) >= 3 && new Date(r.due) > now) return "green";
    return "yellow";
  }

  function summarize(){
    const questions = qs();
    const stats = loadJson(STATS_KEY, {});
    const review = bootstrap();
    const now = new Date();
    const out = {green:0,yellow:0,red:0,new:0,due:[],next:null};
    questions.forEach(q => {
      const state = memoryState(q,review,stats,now);
      out[state]++;
      const r = review[q.id];
      if(r?.due){
        const due = new Date(r.due);
        if(due <= now) out.due.push({q,due,state});
        else if(!out.next || due < out.next) out.next = due;
      }
    });
    out.due.sort((a,b) => {
      const priority = {red:0,yellow:1,green:2,new:3};
      return priority[a.state]-priority[b.state] || a.due-b.due;
    });
    return out;
  }

  function updateSchedule(q, isCorrect){
    const review = bootstrap();
    const stats = loadJson(STATS_KEY, {});
    const prev = review[q.id] || {correctStreak:0,hadWrong:false,lastResult:null};
    const now = new Date();
    let next;
    if(!isCorrect){
      const repeatedWrong = prev.lastResult === "wrong";
      next = repeatedWrong ? addDays(now,1) : addHours(now,4);
      review[q.id] = {
        ...prev,
        due:next.toISOString(),
        correctStreak:0,
        hadWrong:true,
        lastResult:"wrong",
        lastReviewed:now.toISOString(),
        intervalDays:repeatedWrong ? 1 : 0
      };
    }else{
      const correctStreak = (prev.correctStreak || 0) + 1;
      const hadWrong = prev.hadWrong || ((stats[q.id]?.wrong || 0) > 0);
      const interval = correctStreak === 1 ? 3 : correctStreak === 2 ? 7 : correctStreak === 3 ? 14 : 21;
      next = addDays(now, interval);
      review[q.id] = {
        ...prev,
        due:next.toISOString(),
        correctStreak,
        hadWrong,
        lastResult:"correct",
        lastReviewed:now.toISOString(),
        intervalDays:interval
      };
    }
    saveJson(REVIEW_KEY, review);
    return next;
  }

  function formatDate(date){
    if(!date) return "—";
    return `${date.getMonth()+1}/${date.getDate()}`;
  }

  function daysToExam(){
    const [y,m,d] = EXAM_DATE.split("-").map(Number);
    const today = new Date(); today.setHours(0,0,0,0);
    const exam = new Date(y,m-1,d);
    return Math.max(0,Math.ceil((exam-today)/86400000));
  }
  function phaseInfo(){
    const days = daysToExam();
    if(days <= 14) return {name:"大量做題期",text:"以限時模擬、混合題與錯題回收為主。",action:"mock.html",label:"⏱️ 進入正式模擬"};
    if(days <= 35) return {name:"記憶複習期",text:"把理解轉成能快速提取的記憶，增加到期複習與混合題。",action:"review.html",label:"🧠 開始今日到期複習"};
    return {name:"實力累積期",text:"讀新內容後立即練題，再用間隔複習檢查是不是真的懂。",action:"review.html",label:"🧠 開始今日到期複習"};
  }

  function ensureStyles(){
    if(document.getElementById("srsStyles")) return;
    const s=document.createElement("style"); s.id="srsStyles";
    s.textContent=`
      .srs-panel{padding:24px;margin-bottom:18px;border-color:color-mix(in srgb,var(--brand) 30%,var(--line))}
      .srs-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:16px}
      .srs-phase{padding:7px 10px;border-radius:999px;background:var(--soft);color:var(--brand);font-size:12px;font-weight:800;white-space:nowrap}
      .srs-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:16px}
      .srs-due{padding:18px;border-radius:16px;background:var(--soft)}
      .srs-due strong{font-size:42px;color:var(--brand);line-height:1}.srs-due p{margin:7px 0 14px;color:var(--muted);font-size:13px;line-height:1.5}
      .srs-button{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border:0;border-radius:12px;background:var(--brand);color:#fff;padding:11px 14px;font-weight:800;cursor:pointer}
      .srs-button.secondary{background:transparent;color:var(--text);border:1px solid var(--line)}
      .srs-states{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
      .srs-state{padding:13px;border:1px solid var(--line);border-radius:13px}.srs-state b{display:block;font-size:22px;margin-top:3px}.srs-state small{color:var(--muted)}
      .srs-foot{margin-top:14px;color:var(--muted);font-size:13px;line-height:1.55}
      @media(max-width:760px){.srs-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function renderPanel(){
    const home=document.getElementById("homeView"); if(!home) return;
    let panel=document.getElementById("srsPanel");
    if(!panel){
      panel=document.createElement("section"); panel.id="srsPanel"; panel.className="card srs-panel";
      const anchor=document.getElementById("coachPanel") || document.querySelector(".today-plan");
      if(anchor) anchor.insertAdjacentElement("afterend",panel); else home.prepend(panel);
    }
    const sum=summarize(); const phase=phaseInfo();
    const action = sum.due.length ? "review.html" : phase.action;
    const label = sum.due.length ? `🧠 複習今天到期的 ${sum.due.length} 題` : phase.label;
    const dueText = sum.due.length ? "這些題目現在最值得重新想一次。答對後會自動延長下次複習間隔。" : `目前沒有到期題目。下一批複習：${formatDate(sum.next)}。`;
    panel.innerHTML=`
      <div class="srs-head"><div><span class="eyebrow">間隔複習</span><h3 style="margin:4px 0 0">🧠 記憶狀態</h3></div><span class="srs-phase">${phase.name}</span></div>
      <div class="srs-grid">
        <div class="srs-due"><small>今日到期複習</small><strong>${sum.due.length}</strong><span> 題</span><p>${dueText}</p><a class="srs-button" href="${action}">${label}</a></div>
        <div class="srs-states">
          <div class="srs-state"><small>🟢 已掌握</small><b>${sum.green}</b></div>
          <div class="srs-state"><small>🟡 待複習</small><b>${sum.yellow}</b></div>
          <div class="srs-state"><small>🔴 容易忘記</small><b>${sum.red}</b></div>
          <div class="srs-state"><small>🆕 尚未練習</small><b>${sum.new}</b></div>
        </div>
      </div>
      <div class="srs-foot"><b>目前階段：${phase.name}</b>｜${phase.text}　下一個未到期複習日：${formatDate(sum.next)}</div>`;
  }

  function observeAnswers(){
    const feedback=document.getElementById("feedback"); if(!feedback) return;
    const observer=new MutationObserver(() => {
      if(feedback.classList.contains("hidden")) { feedback.dataset.srsRecorded=""; return; }
      const isCorrect=feedback.classList.contains("good");
      const isWrong=feedback.classList.contains("bad");
      if(!isCorrect && !isWrong) return;
      const text=document.getElementById("questionText")?.textContent || "";
      const q=qs().find(x => x.question === text); if(!q) return;
      const stats=loadJson(STATS_KEY,{}); const attempt=stats[q.id]?.attempts || 0;
      const key=`${q.id}:${attempt}`;
      if(feedback.dataset.srsRecorded===key) return;
      feedback.dataset.srsRecorded=key;
      const next=updateSchedule(q,isCorrect);
      let note=document.getElementById("srsNextReview");
      if(!note){ note=document.createElement("div"); note.id="srsNextReview"; note.style.cssText="margin:10px 0;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--soft) 70%,transparent);font-size:13px;font-weight:700"; const source=document.getElementById("sourceBox"); if(source) feedback.insertBefore(note,source); else feedback.appendChild(note); }
      if(isCorrect) note.textContent=`🧠 這題下一次安排：${formatDate(next)}。答對次數累積後，間隔會逐步拉長。`;
      else note.textContent=`🧠 這題先不要放掉：${formatDate(next)} 會再安排複習。`;
      renderPanel();
    });
    observer.observe(feedback,{attributes:true,attributeFilter:["class"],subtree:false});
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureStyles(); bootstrap();
    setTimeout(() => { renderPanel(); observeAnswers(); }, 20);
  });

  window.TaipowerSRS={summarize,updateSchedule,bootstrap,memoryState};
})();
