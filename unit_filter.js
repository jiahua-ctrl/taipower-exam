(() => {
  const PARAM = "unit";
  const params = new URLSearchParams(window.location.search);
  const selectedUnit = params.get(PARAM);
  const validUnits = new Set(["01","02","03","04","05","06","07","08","09","10"]);
  const isUnitRun = validUnits.has(selectedUnit);

  function cleanUrl(){ return window.location.pathname; }
  function restoreFullHome(){ window.location.replace(cleanUrl()); }

  function filterQuestions(){
    if(!isUnitRun || !Array.isArray(window.LOCAL_QUESTIONS)) return;
    const tag = `單元${selectedUnit}`;
    window.LOCAL_QUESTIONS = window.LOCAL_QUESTIONS.filter(q => String(q.tags || "").includes(tag));
  }

  function startUnitWhenReady(attempt = 0){
    const btn = document.querySelector('[data-mode="all"]');
    const status = document.getElementById("dataStatus");
    const ready = btn && status && !status.textContent.includes("正在讀取");
    if(ready){
      btn.click();
      return;
    }
    if(attempt < 60) setTimeout(() => startUnitWhenReady(attempt + 1), 60);
  }

  filterQuestions();

  // 單元按鈕不是 app.js 原生模式，因此在 capture 階段攔截，避免 app.js 把 undefined 當作模式處理。
  document.querySelectorAll("[data-unit]").forEach(btn => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const unit = btn.dataset.unit;
      if(!validUnits.has(unit)) return;
      window.location.href = `${cleanUrl()}?${PARAM}=${unit}`;
    }, true);
  });

  if(isUnitRun){
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        const status = document.getElementById("dataStatus");
        if(status) status.textContent = `第 ${Number(selectedUnit)} 單元專項練習`;
        startUnitWhenReady();

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
    });
  }
})();
