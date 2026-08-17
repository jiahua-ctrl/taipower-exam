(() => {
  const REVIEW_KEY="taipower_exam_spaced_review_v1";
  const STATS_KEY="taipower_exam_stats_v1";
  const WRONG_KEY="taipower_exam_wrong_ids_v1";
  const MAX_SESSION=20;
  let pool=[], index=0, correctCount=0, answered=false;

  const $=id=>document.getElementById(id);
  function loadJson(k,f){try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}}
  function saveJson(k,v){localStorage.setItem(k,JSON.stringify(v))}
  function questions(){const seen=new Set();return (Array.isArray(window.LOCAL_QUESTIONS)?window.LOCAL_QUESTIONS:[]).filter(q=>{if(!q||!q.id||q.is_active===false||seen.has(q.id))return false;seen.add(q.id);return true})}
  const addHours=(d,h)=>new Date(d.getTime()+h*3600000);
  const addDays=(d,n)=>addHours(d,n*24);
  const fmtDate=d=>`${d.getMonth()+1}/${d.getDate()}`;
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function sameDay(iso,now=new Date()){
    if(!iso)return false;const d=new Date(iso);return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate();
  }

  function bootstrap(){
    const review=loadJson(REVIEW_KEY,{}), stats=loadJson(STATS_KEY,{});let changed=false;
    questions().forEach(q=>{
      if(review[q.id]||!stats[q.id]?.attempts)return;
      const s=stats[q.id], last=s.last?new Date(s.last):new Date();
      const accuracy=(s.correct||0)/Math.max(1,s.attempts||1), hadWrong=(s.wrong||0)>0;
      let cs=!hadWrong&&accuracy===1?Math.min(3,s.correct||1):(accuracy>=.8&&s.correct?1:0);
      let due=hadWrong&&accuracy<.6?last:cs>=3?addDays(last,14):cs>=2?addDays(last,7):addDays(last,3);
      review[q.id]={due:due.toISOString(),correctStreak:cs,hadWrong,lastResult:hadWrong&&accuracy<.6?"wrong":"correct",lastReviewed:s.last||null,intervalDays:Math.max(0,Math.round((due-last)/86400000))};changed=true;
    });
    if(changed)saveJson(REVIEW_KEY,review);return review;
  }

  function stateOf(q,review,stats,now=new Date()){
    const s=stats[q.id];if(!s||!s.attempts)return"new";const r=review[q.id];const acc=(s.correct||0)/Math.max(1,s.attempts||1);
    if(!r)return acc<.6?"red":"yellow";
    if(r.lastResult==="wrong"||acc<.6)return"red";
    if((r.correctStreak||0)>=3&&new Date(r.due)>now)return"green";
    return"yellow";
  }

  function summary(){
    const review=bootstrap(),stats=loadJson(STATS_KEY,{}),now=new Date();const out={green:0,yellow:0,red:0,new:0,due:[],next:null};
    questions().forEach(q=>{const state=stateOf(q,review,stats,now);out[state]++;const r=review[q.id];if(r?.due){const due=new Date(r.due);if(due<=now)out.due.push({q,state,due});else if(!out.next||due<out.next)out.next=due}});
    const p={red:0,yellow:1,green:2,new:3};out.due.sort((a,b)=>p[a.state]-p[b.state]||a.due-b.due);return out;
  }

  function updateSchedule(q,isCorrect){
    const review=bootstrap(),stats=loadJson(STATS_KEY,{}),prev=review[q.id]||{correctStreak:0,hadWrong:false,lastResult:null};const now=new Date();let next;
    if(!isCorrect){const repeat=prev.lastResult==="wrong";next=repeat?addDays(now,1):addHours(now,4);review[q.id]={...prev,due:next.toISOString(),correctStreak:0,hadWrong:true,lastResult:"wrong",lastReviewed:now.toISOString(),intervalDays:repeat?1:0}}
    else{const cs=(prev.correctStreak||0)+1,hadWrong=prev.hadWrong||((stats[q.id]?.wrong||0)>0);const interval=cs===1?3:cs===2?7:cs===3?14:21;next=addDays(now,interval);review[q.id]={...prev,due:next.toISOString(),correctStreak:cs,hadWrong,lastResult:"correct",lastReviewed:now.toISOString(),intervalDays:interval}}
    saveJson(REVIEW_KEY,review);return next;
  }

  function recordStats(q,isCorrect){
    const stats=loadJson(STATS_KEY,{}),s=stats[q.id]||{attempts:0,correct:0,wrong:0};const prior=sameDay(s.last)?(s.attemptsToday||1):0;s.attempts++;isCorrect?s.correct++:s.wrong++;s.attemptsToday=prior+1;s.last=new Date().toISOString();stats[q.id]=s;saveJson(STATS_KEY,stats);
    let wrong=loadJson(WRONG_KEY,[]);if(isCorrect)wrong=wrong.filter(id=>id!==q.id);else if(!wrong.includes(q.id))wrong.push(q.id);saveJson(WRONG_KEY,[...new Set(wrong)]);
  }

  function renderSummary(sum){
    $("mGreen").textContent=sum.green;$("mYellow").textContent=sum.yellow;$("mRed").textContent=sum.red;$("mNew").textContent=sum.new;
    $("reviewIntro").textContent=sum.due.length?`今天共有 ${sum.due.length} 題到期。本輪最多安排 ${Math.min(MAX_SESSION,sum.due.length)} 題，優先放入容易忘記的題目。`:`目前沒有題目到期。下一批會依前次作答結果自動出現。`;
    if(!sum.due.length){$("reviewEmpty").classList.remove("hidden");$("nextDueText").textContent=sum.next?`下一個安排的複習日期：約 ${fmtDate(sum.next)}。`:`先回首頁做新題，系統就會開始建立複習排程。`;return}
    pool=sum.due.slice(0,MAX_SESSION).map(x=>x.q);$("reviewHome").classList.add("hidden");$("reviewQuiz").classList.add("active");renderQuestion();
  }

  function memoryLabel(q){const r=bootstrap()[q.id];const s=loadJson(STATS_KEY,{})[q.id];const state=stateOf(q,bootstrap(),loadJson(STATS_KEY,{}));return state==="red"?"🔴 容易忘":state==="green"?"🟢 已掌握":"🟡 待複習"}

  function renderQuestion(){
    answered=false;const q=pool[index];$("reviewProgress").textContent=`${index+1} / ${pool.length}`;$("reviewScore").textContent=`答對 ${correctCount}`;$("reviewProgressBar").style.width=`${Math.round(index/pool.length*100)}%`;$("reviewSubject").textContent=q.subject||"題目";$("reviewTopic").textContent=q.topic||"未分類";$("reviewMemory").textContent=memoryLabel(q);$("reviewQuestion").textContent=q.question;$("reviewFeedback").className="feedback hidden";$("reviewNextBtn").classList.add("hidden");
    $("reviewOptions").innerHTML=["A","B","C","D"].map(letter=>`<button class="option" data-answer="${letter}"><span class="option-letter">${letter}</span><span>${esc(q["option_"+letter.toLowerCase()]||"")}</span></button>`).join("");
    $("reviewOptions").querySelectorAll(".option").forEach(btn=>btn.addEventListener("click",()=>answer(btn.dataset.answer)));
  }

  function answer(choice){
    if(answered)return;answered=true;const q=pool[index],correct=String(q.answer).toUpperCase(),ok=choice===correct;if(ok)correctCount++;
    $("reviewOptions").querySelectorAll(".option").forEach(btn=>{btn.disabled=true;if(btn.dataset.answer===correct)btn.classList.add("correct");if(btn.dataset.answer===choice&&!ok)btn.classList.add("wrong")});
    recordStats(q,ok);const next=updateSchedule(q,ok);
    $("reviewFeedback").classList.remove("hidden");$("reviewFeedback").classList.add(ok?"good":"bad");$("reviewFeedbackTitle").textContent=ok?"✅ 想得起來，這題可以拉長間隔":`❌ 這題還需要再提取｜正確答案：${correct}`;$("reviewExplanation").textContent=q.explanation||"目前尚未提供解析。";
    $("reviewNext").textContent=ok?`🧠 下次複習安排：約 ${fmtDate(next)}。連續答對後會從 3 天 → 7 天 → 14 天逐步拉長。`:`🧠 這題會在 ${fmtDate(next)} 再安排一次；先找出錯在觀念、公式、單位還是代入。`;
    const parts=[];if(q.source_title)parts.push(`<b>來源：</b>${esc(q.source_title)}`);if(q.source_locator)parts.push(`<b>位置：</b>${esc(q.source_locator)}`);$("reviewSource").innerHTML=parts.join("　");$("reviewNextBtn").textContent=index===pool.length-1?"查看複習結果 →":"下一題 →";$("reviewNextBtn").classList.remove("hidden");$("reviewScore").textContent=`答對 ${correctCount}`;
  }

  function next(){if(!answered)return;if(index<pool.length-1){index++;renderQuestion()}else showResult()}
  function showResult(){const rate=Math.round(correctCount/pool.length*100);$("reviewProgressBar").style.width="100%";$("reviewQuiz").classList.remove("active");$("reviewResult").classList.add("active");$("reviewResultScore").textContent=rate;$("reviewResultTitle").textContent=rate>=80?"這批記憶維持得很好！":rate>=60?"有記住一部分，錯題會再回來":"今天抓到真正容易忘的地方了";const left=summary().due.length;$("reviewResultText").textContent=`本輪 ${pool.length} 題答對 ${correctCount} 題。${left?`目前仍有 ${left} 題到期／再次排程。`:`目前到期題已清完。`}`}

  function init(){const saved=localStorage.getItem("taipower_exam_theme_v1");if(saved)document.documentElement.dataset.theme=saved;$("reviewNextBtn").addEventListener("click",next);renderSummary(summary())}
  document.addEventListener("DOMContentLoaded",init);
})();
