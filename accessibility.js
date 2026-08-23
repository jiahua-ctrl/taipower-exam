(()=>{
  const KEY='taipower_exam_font_size_v1';
  const LEVELS=['normal','large','xlarge'];
  const labels={normal:'標準字',large:'大字',xlarge:'特大字'};
  const root=document.documentElement;
  const saved=localStorage.getItem(KEY);
  let level=LEVELS.includes(saved)?saved:'large';

  function apply(next){
    level=LEVELS.includes(next)?next:'large';
    root.dataset.fontSize=level;
    localStorage.setItem(KEY,level);
    document.querySelectorAll('[data-font-size]').forEach(btn=>{
      const active=btn.dataset.fontSize===level;
      btn.setAttribute('aria-pressed',active?'true':'false');
      btn.classList.toggle('active',active);
    });
    const status=document.getElementById('fontSizeStatus');
    if(status) status.textContent=`目前：${labels[level]}`;
  }

  function mount(){
    const host=document.querySelector('[data-accessibility-controls]');
    if(!host) return apply(level);
    host.innerHTML=`<span class="font-control-label">字體</span><button type="button" class="font-size-btn" data-font-size="normal" aria-label="標準字">A</button><button type="button" class="font-size-btn" data-font-size="large" aria-label="大字">A＋</button><button type="button" class="font-size-btn" data-font-size="xlarge" aria-label="特大字">特大</button><span id="fontSizeStatus" class="sr-only"></span>`;
    host.addEventListener('click',e=>{
      const btn=e.target.closest('[data-font-size]');
      if(btn) apply(btn.dataset.fontSize);
    });
    apply(level);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount);
  else mount();
})();