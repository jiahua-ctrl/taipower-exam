// 嚴格核對模式：舊題檔即使仍存在 repo，也不進入爸爸正式刷題池。
// 只載入已能對到台電官方教材依據的核心題、易混淆題與高鑑別題。
window.LOCAL_QUESTIONS = [];
document.write('<script src="questions_verified_core_v1.js"><\/script>');
document.write('<script src="questions_confusion_v3.js"><\/script>');
document.write('<script src="questions_verified_high_discrimination_v1.js"><\/script>');

(() => {
  const params = new URLSearchParams(window.location.search);
  const selectedUnit = params.get("unit");
  const selectedFilter = params.get("filter");
  const validUnits = new Set(["01","02","03","04","05","06","07","08","09","10"]);
  const validFilters = new Set(["level1","level2","level3","confusion"]);
  const isUnitRun = validUnits.has(selectedUnit);
  const isFilterRun = validFilters.has(selectedFilter);
  const isSpecialRun = isUnitRun || isFilterRun;

  function cleanUrl(){ return window.location.pathname; }
  function restoreFullHome(){ window.location.replace(cleanUrl()); }

  function applyFilters(){
    if(!Array.isArray(window.LOCAL_QUESTIONS)) return;
    let qs = window.LOCAL_QUESTIONS.filter(q => String(q.tags || "").includes("已核對"));
    if(isUnitRun){
      const tag = `單元${selectedUnit}`;
      qs = qs.filter(q => String(q.tags || "").includes(tag));
    }
    if(isFilterRun){
      if(selectedFilter === "level1") qs = qs.filter(q => String(q.level || "").startsWith("1"));
      if(selectedFilter === "level2") qs = qs.filter(q => String(q.level || "").startsWith("2"));
      if(selectedFilter === "level3") qs = qs.filter(q => String(q.level || "").startsWith("3"));
      if(selectedFilter === "confusion") qs = qs.filter(q => String(q.tags || "").includes("易混淆"));
    }
    window.LOCAL_QUESTIONS = qs;
  }

  function startAllWhenReady(attempt = 0){
    const btn = document.querySelector('[data-mode="all"]');
    const status = document.getElementById("dataStatus");
    const ready = btn && status && !status.textContent.includes("正在讀取");
    if(ready){ btn.click(); return; }
    if(attempt < 60) setTimeout(() => startAllWhenReady(attempt + 1), 60);
  }

  function filterLabel(){
    if(isUnitRun) return `第 ${Number(selectedUnit)} 單元專項練習｜僅已核對題`;
    return ({
      level1:"Level 1｜基礎記憶題｜僅已核對題",
      level2:"Level 2｜理解辨識題｜僅已核對題",
      level3:"Level 3｜情境／進階題｜僅已核對題",
      confusion:"🔥 易混淆規則專項｜僅已核對題"
    })[selectedFilter] || "專項練習｜僅已核對題";
  }

  applyFilters();

  document.querySelectorAll("[data-unit]").forEach(btn => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const unit = btn.dataset.unit;
      if(!validUnits.has(unit)) return;
      window.location.href = `${cleanUrl()}?unit=${unit}`;
    }, true);
  });

  document.addEventListener("DOMContentLoaded", () => {
    const allBtn = document.querySelector('[data-mode="all"]');
    if(allBtn){
      const b = allBtn.querySelector("b");
      const s = allBtn.querySelector("small");
      if(b) b.textContent = "全題練習";
      if(s) s.textContent = "僅已核對題｜不限時看解析";

      const mock = document.createElement("a");
      mock.className = "mode-card featured-mode";
      mock.href = "mock.html";
      mock.innerHTML = '<span class="mode-icon">⏱️</span><b>正式模擬考</b><small>僅已核對題｜兩科限時</small>';
      allBtn.parentElement?.appendChild(mock);
    }

    const calcBtn = document.querySelector('[data-mode="calc"]');
    const grid = calcBtn?.parentElement;
    if(grid && !document.getElementById("difficultyModes")){
      const frag = document.createDocumentFragment();
      const defs = [
        ["level1","🟢","Level 1｜基礎題","名詞、數字、基本規則"],
        ["level2","🟡","Level 2｜理解題","換句話說、比較與辨識"],
        ["level3","🔴","Level 3｜情境題","跨概念、程序與應用"],
        ["confusion","🔥","易混淆規則","專攻最容易選錯的對照題"]
      ];
      defs.forEach(([key,icon,title,sub], i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.filter = key;
        btn.className = `mode-card${key === "confusion" ? " featured-mode" : ""}`;
        btn.id = i === 0 ? "difficultyModes" : "";
        btn.innerHTML = `<span class="mode-icon">${icon}</span><b>${title}</b><small>${sub}</small>`;
        btn.addEventListener("click", () => { window.location.href = `${cleanUrl()}?filter=${key}`; });
        frag.appendChild(btn);
      });
      grid.insertBefore(frag, calcBtn);
    }

    if(isSpecialRun){
      setTimeout(() => {
        const status = document.getElementById("dataStatus");
        if(status) status.textContent = filterLabel();
        startAllWhenReady();

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
      }, 0);
    } else {
      setTimeout(() => {
        const status = document.getElementById("dataStatus");
        if(status && !status.textContent.includes("Google")) status.textContent = `嚴格核對模式｜目前只使用 ${window.LOCAL_QUESTIONS.length} 題已核對題庫`;
      }, 80);
    }

    const scoreBox = document.getElementById("subjectScores");
    if(scoreBox){
      new MutationObserver(() => {
        scoreBox.querySelectorAll(".score-row span").forEach(span => {
          if(span.textContent.includes("40%／60%")) span.textContent = "兩科平均參考";
        });
      }).observe(scoreBox, {childList:true, subtree:true});
    }
  });
})();
