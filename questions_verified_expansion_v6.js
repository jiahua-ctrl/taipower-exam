(() => {
  const out = [];
  const L = ['A','B','C','D'];
  const titles = {
    4:'04. 電力交易平台參考資料 輔助服務概論',
    6:'06. 電力交易平台參考資料 日前輔助服務市場之參與作法',
    7:'07. 電力交易平台參考資料 日前輔助服務市場之交易商品項目規格',
    8:'08. 電力交易平台參考資料 日前輔助服務市場之運作',
    9:'09. 電力交易平台參考資料 備用容量交易機制'
  };
  function fmt(n){ return Math.round(n).toLocaleString('en-US'); }
  function pack(correct, distractors, n){
    const uniq = [correct];
    for(const x of distractors){ if(!uniq.includes(x)) uniq.push(x); }
    while(uniq.length < 4) uniq.push(`其他值${uniq.length}`);
    const base = uniq.slice(0,4);
    const r = n % 4;
    const arr = base.slice(r).concat(base.slice(0,r));
    return {arr, answer:L[arr.indexOf(correct)]};
  }
  function add(id, unit, topic, level, question, correct, distractors, explanation, locator, tags){
    const n = Number(id.split('-')[1]);
    const p = pack(correct,distractors,n);
    out.push({
      id,
      subject: unit===4 ? '科目一｜電力系統與電力市場' : '科目二｜電力交易平台市場規則',
      topic:`第${unit}單元｜${topic}`,
      level,
      question,
      option_a:p.arr[0], option_b:p.arr[1], option_c:p.arr[2], option_d:p.arr[3], answer:p.answer,
      explanation,
      source_title:titles[unit], source_url:'', source_locator:locator,
      is_active:true,
      tags:`單元${String(unit).padStart(2,'0')};${tags};已核對`
    });
  }

  let n=1;
  const svc=[['dReg',1],['E-dReg',1],['sReg',10],['即時備轉',600],['補充備轉',1800]];
  for(let i=0;i<svc.length;i++) for(let j=i+1;j<svc.length;j++){
    const [a,x]=svc[i], [b,y]=svc[j], hi=Math.max(x,y), lo=Math.min(x,y), ratio=hi/lo, diff=Math.abs(x-y);
    add(`N4-${String(n).padStart(3,'0')}`,4,'反應時間比較','3情境計算',`${a}反應時間上限${x}秒、${b}${y}秒。較慢者上限是較快者幾倍？`,`${ratio}倍`,[`${ratio*2}倍`,`${Math.max(1,ratio/2)}倍`,`${diff}倍`],`${hi}÷${lo}＝${ratio}倍。`,'我國輔助服務項目分類：反應時間','計算;反應時間'); n++;
    add(`N4-${String(n).padStart(3,'0')}`,4,'反應時間差','3情境計算',`${a}與${b}都取教材反應時間上限，兩者相差多少秒？`,`${diff}秒`,[`${hi}秒`,`${lo}秒`,`${hi+lo}秒`],`|${y}−${x}|＝${diff}秒。`,'我國輔助服務項目分類：反應時間','計算;反應時間'); n++;
  }
  for(let k=1;k<=10;k++){
    const total=k*1+(k-1)*2;
    add(`N4-${String(n).padStart(3,'0')}`,4,'持續時間','3情境計算',`某日安排即時備轉${k}次、補充備轉${k-1}次；每次分別持續1小時與2小時，合計服務時間？`,`${total}小時`,[`${total+1}小時`,`${Math.max(0,total-1)}小時`,`${total*2}小時`],`${k}×1＋${k-1}×2＝${total}小時。`,'我國輔助服務項目分類：持續時間','計算;持續時間'); n++;
  }
  while(n<=60){
    const k=n-30;
    if(n%3===0){ const sec=(n%2===0?600:1800), reps=Math.ceil(k/3), mins=sec*reps/60;
      add(`N4-${String(n).padStart(3,'0')}`,4,'時間換算','3情境計算',`反應時間上限${sec}秒的情境連續計算${reps}個等長時段，合計等於多少分鐘？`,`${mins}分鐘`,[`${mins*2}分鐘`,`${mins/2}分鐘`,`${sec*reps}分鐘`],`${sec}×${reps}÷60＝${mins}分鐘。`,'我國輔助服務項目分類：反應時間','計算;反應時間');
    }else if(n%3===1){ const measured=Number((8.4+k*0.08).toFixed(2)), ok=measured<=10;
      add(`N4-${String(n).padStart(3,'0')}`,4,'門檻判斷','3情境計算',`sReg反應時間上限10秒，某次實測${measured}秒。是否符合？`,ok?'符合':'不符合',[ok?'不符合':'符合','必須剛好10秒','資料不足'],`${measured}${ok?'≤':'>'}10秒，因此${ok?'符合':'不符合'}。`,'我國輔助服務項目分類：反應時間','計算;反應時間;門檻');
    }else{ const min=11+Math.floor(k/3)*2;
      add(`N4-${String(n).padStart(3,'0')}`,4,'情境判斷','3情境計算',`某資源實測反應時間${min}分鐘。依即時備轉≤10分鐘、補充備轉≤30分鐘，較可能符合哪一項上限？`,'補充備轉',['即時備轉','sReg','dReg'],`${min}分鐘高於10分鐘且不超過30分鐘，因此符合補充備轉上限。`,'我國輔助服務項目分類：反應時間','計算;反應時間;門檻');
    } n++;
  }

  n=1; const base=8847;
  const caps=[5,8,10,12,15,18,20,22,25,30,35,40,45,50,55,60,70,80,90,100];
  for(const cap of caps) for(const res of [1,2]){
    const total=base+cap*400+res*100;
    add(`N6-${String(n).padStart(3,'0')}`,6,'參與費用','3情境計算',`參與容量${cap}MW、交易資源${res}個，每月參與費用？`,`${fmt(total)}元`,[`${fmt(total+400)}元`,`${fmt(total-400)}元`,`${fmt(base+cap*400)}元`],`8,847＋${cap}×400＋${res}×100＝${fmt(total)}元。`,'參與費用：8,847元/家＋400元/MW＋100元/個','計算;參與費用'); n++;
  }
  for(const cap of [10,15,20,25,30,35,40,45,50,60]){
    const total=base+cap*400+300;
    add(`N6-${String(n).padStart(3,'0')}`,6,'參與費用反推','3情境計算',`每月參與費用${fmt(total)}元、交易資源3個。反推參與容量？`,`${cap}MW`,[`${cap+5}MW`,`${Math.max(0,cap-5)}MW`,`${cap+10}MW`],`扣除固定費8,847元與資源費300元後，再÷400＝${cap}MW。`,'參與費用：8,847元/家＋400元/MW＋100元/個','計算;參與費用;反推'); n++;
  }
  for(let months=2;months<=16;months++){
    const oldFee=base+10*400+2*100, newFee=base+20*400+3*100, total=oldFee+(months-1)*newFee;
    add(`N6-${String(n).padStart(3,'0')}`,6,'費用生效月份','3情境計算',`本月中由10MW、2資源變更為20MW、3資源；本月按原額、次月起按新額。連續${months}個月總費用？`,`${fmt(total)}元`,[`${fmt(months*newFee)}元`,`${fmt(months*oldFee)}元`,`${fmt(total+4100)}元`],`首月${fmt(oldFee)}元＋後${months-1}月各${fmt(newFee)}元＝${fmt(total)}元。`,'增減容量或報價代碼當月仍按原總額計收，次月生效','計算;參與費用;生效月份'); n++;
  }
  for(const cap of [2.5,3.2,5,7.5,10,12.5,18.5,20,25,30]){
    const fee=cap*1000;
    add(`N6-${String(n).padStart(3,'0')}`,6,'備用容量費用','3情境計算',`備用容量市場交易${cap}MW，系統使用費1,000元/MW/年，全年費用？`,`${fmt(fee)}元`,[`${fmt(fee*10)}元`,`${fmt(fee/10)}元`,`${fmt(fee+1000)}元`],`${cap}×1,000＝${fmt(fee)}元/年。`,'備用容量市場：1,000元/MW每年','計算;備用容量'); n++;
  }
  const tests=[['dReg步階測試',1080,60,'分鐘','dReg步階測試：總程序1,080秒'],['sReg步階測試',600,60,'分鐘','sReg步階測試：總程序600秒'],['dReg持續能力測試',900,60,'分鐘','dReg持續能力測試'],['E-dReg持續能力測試',9000,3600,'小時','E-dReg持續能力測試']];
  while(n<=110){ const t=tests[(n-1)%4], reps=n-74, val=t[1]*reps/t[2];
    add(`N6-${String(n).padStart(3,'0')}`,6,'能力測試','2理解計算',`${t[0]}單次${fmt(t[1])}秒；連續${reps}次且不計間隔，合計多少${t[3]}？`,`${val}${t[3]}`,[`${val*2}${t[3]}`,`${val/2}${t[3]}`,`${val+1}${t[3]}`],`${fmt(t[1])}×${reps}÷${fmt(t[2])}＝${val}${t[3]}。`,t[4],'計算;能力測試'); n++;
  }

  n=1;
  const reqs=[-100,-80,-60,-40,-20,0,20,40,60,80,100], acts=[-100,-75,-50,-25,0,25,50,75,100];
  outer: for(const req of reqs) for(const act of acts){ if(Math.abs(req-act)>40) continue; const v=Math.max(0,100-Math.abs(act-req));
    add(`N7-${String(n).padStart(3,'0')}`,7,'SBSPM','3情境計算',`操作曲線要求${req}%，實際輸出/輸入${act}%。依SBSPM＝100−|實際−要求|，結果？`,`${v}%`,[`${Math.max(0,v-5)}%`,`${Math.min(100,v+5)}%`,`${Math.abs(act-req)}%`],`100−|${act}−(${req})|＝${v}%。`,'dReg服務品質：SBSPM公式','計算;SBSPM'); if(++n>40) break outer;
  }
  for(let i=0;i<30;i++){ const a=72+(i*7)%29,b=73+(i*11)%28,c=74+(i*13)%27,d=75+(i*17)%26,m=Math.max(a,b,c,d),avg=Math.round((a+b+c+d)/4);
    add(`N7-${String(n).padStart(3,'0')}`,7,'4秒滾動執行率','3情境計算',`4秒SBSPM依序${a}%、${b}%、${c}%、${d}%，滾動執行率？`,`${m}%`,[`${Math.min(a,b,c,d)}%`,`${avg}%`,`${Math.max(a,b,c)}%`],`4秒取最大值＝${m}%。`,'每秒滾動執行率=max(前4秒SBSPM)','計算;4秒滾動執行率'); n++;
  }
  for(let i=0;i<25;i++){ const mn=70+(i%25), second=Math.min(100,mn+2+(i%4)), high=Math.min(100,second+5);
    add(`N7-${String(n).padStart(3,'0')}`,7,'每小時執行率','3情境計算',`某小時3,600個滾動執行率中，最低${mn}%、次低${second}%、另有${high}%，其餘更高。每小時執行率？`,`${mn}%`,[`${second}%`,`${high}%`,`${Math.round((mn+second+high)/3)}%`],`每小時取3,600秒滾動執行率最小值，因此為${mn}%。`,'每小時執行率=min(3,600秒滾動執行率)','計算;每小時執行率'); n++;
  }
  while(n<=120){ if(n%2===0){ const a=80+(n*3)%20,b=81+(n*5)%19,c=82+(n*7)%18,d=83+(n*11)%17,m=Math.max(a,b,c,d),ok=m>=95;
      add(`N7-${String(n).padStart(3,'0')}`,7,'門檻判斷','3情境計算',`4秒SBSPM為${a}%、${b}%、${c}%、${d}%。若要求滾動執行率至少95%，是否達標？`,ok?'達標':'未達標',[ok?'未達標':'達標','應取平均','只看最後1秒'],`4秒取最大值${m}%，所以${ok?'達到':'未達'}95%。`,'每秒滾動執行率=max(前4秒SBSPM)','計算;滾動執行率;門檻');
    }else{ const req=-55+(n%6)*15,target=91+(n%7),delta=100-target,c1=req+delta,c2=req-delta;
      add(`N7-${String(n).padStart(3,'0')}`,7,'SBSPM反推','3情境計算',`操作曲線要求${req}%，若SBSPM恰為${target}%，實際輸出/輸入可能為何？`,`${c1}%或${c2}%`,[`${req+target}%`,`${req-delta*2}%`,`${target}%`],`|實際−${req}|＝${delta}，所以實際可為${c1}%或${c2}%。`,'dReg服務品質：SBSPM公式','計算;SBSPM;反推');
    } n++;
  }

  n=1;
  const prices=[400,420,440,455,470,490,510,530,550,575], mws=[2,5,8,10,12], qis=[1,0.8,0.6,0.4,0.2];
  for(const price of prices) for(const mw of mws){ const qi=qis[(n-1)%qis.length], cap=price*mw, perf=350*mw,total=(cap+perf)*qi;
    add(`N8-${String(n).padStart(3,'0')}`,8,'dReg結算','3情境計算',`容量價格${price}元/MW·h、效能價格350元/MW·h、得標${mw}MW、品質指標${qi}。小時結算價金？`,`${fmt(total)}元`,[`${fmt(cap)}元`,`${fmt(perf)}元`,`${fmt(cap+perf)}元`],`(${price}×${mw}＋350×${mw})×${qi}＝${fmt(total)}元。`,'調頻備轉月結算公式','計算;dReg;結算'); n++;
  }
  const quality=[[95,1],[94,0.8],[93,0.6],[92,0.4],[91,0.2],[90,0],[85,0],[70,0],[69,-1],[60,-1]];
  for(const [rate,qi] of quality){ add(`N8-${String(n).padStart(3,'0')}`,8,'服務品質指標','3情境計算',`每小時執行率${rate}%，依教材新計算方式，服務品質指標？`,`${qi}`,[`${qi===1?0.8:1}`,`${qi===-1?0:0.2}`,`${qi===0.6?0.4:0.6}`],`95%以上為1；94/93/92/91%依序0.8/0.6/0.4/0.2；70%至90%為0；低於70%為-1。`,'服務品質指標圖（新計算方式）','計算;服務品質'); n++; }
  const inverse=[[1,'95%以上'],[0.8,'94%'],[0.6,'93%'],[0.4,'92%'],[0.2,'91%'],[0,'90%'],[0,'85%'],[0,'70%'],[-1,'69%'],[-1,'60%']];
  for(const [qi,rate] of inverse){ add(`N8-${String(n).padStart(3,'0')}`,8,'服務品質反向判讀','3情境計算',`若觀察到每小時執行率${rate}，反向核對教材對照表，其服務品質指標應為多少？`,`${qi}`,[`${qi===1?0.8:1}`,`${qi===-1?0:0.2}`,`${qi===0.6?0.4:0.6}`],`${rate}對應服務品質指標${qi}。`,'服務品質指標圖（新計算方式）','計算;服務品質;反推'); n++; }
  for(let i=0;i<20;i++){ const power=1+(i%5),quarters=1+(i%4),mwh=power*.25*quarters,fee=2000*mwh;
    add(`N8-${String(n).padStart(3,'0')}`,8,'E-dReg放電服務費','3情境計算',`連續${quarters}個15分鐘區間皆放電，平均功率${power}MW，價格2,000元/MWh。合計服務費？`,`${fmt(fee)}元`,[`${fmt(fee*2)}元`,`${fmt(fee/2)}元`,`${fmt(power*2000)}元`],`${power}×0.25×${quarters}×2,000＝${fmt(fee)}元。`,'E-dReg電能服務費：放電2,000元/MWh','計算;E-dReg;電能服務費'); n++;
  }
  while(n<=110){ const power=1+((n*7)%40)/10,quarters=(n%4)+1,mwh=power*.25*quarters,fee=500*mwh;
    add(`N8-${String(n).padStart(3,'0')}`,8,'E-dReg充電服務費','3情境計算',`連續${quarters}個15分鐘區間皆充電，平均充電功率絕對值${power}MW，價格500元/MWh。合計服務費？`,`${fmt(fee)}元`,[`${fmt(fee*2)}元`,`${fmt(fee/2)}元`,`${fmt(power*500)}元`],`${power}×0.25×${quarters}×500＝${fmt(fee)}元。`,'E-dReg電能服務費：充電500元/MWh','計算;E-dReg;充電;電能服務費'); n++;
  }
  for(const charge of [500,800,1000,1200,1500,2000,2500,3000,4000,5000]){ const allowance=charge*.2;
    add(`N8-${String(n).padStart(3,'0')}`,8,'效率額度','3情境計算',`月總充電量${fmt(charge)}kWh，效率額度為20%，效率額度？`,`${fmt(allowance)}kWh`,[`${fmt(charge*.1)}kWh`,`${fmt(charge*.8)}kWh`,`${fmt(charge)}kWh`],`${fmt(charge)}×20%＝${fmt(allowance)}kWh。`,'效率額度=總充電電度量×20%','計算;效率額度'); n++; }
  const losses=[[1000,800],[1200,900],[1500,1100],[2000,1500],[2500,1900],[3000,2300],[3500,2600],[4000,3000],[4500,3500],[5000,3900]];
  for(const [charge,dis] of losses){ const net=charge/.98-dis*.98,ans=net.toFixed(2)+'kWh';
    add(`N8-${String(n).padStart(3,'0')}`,8,'電能損失費','3情境計算',`月總充電${fmt(charge)}kWh、總放電${fmt(dis)}kWh、線損率2%。依淨計量公式，淨計量約？`,ans,[`${(charge-dis).toFixed(2)}kWh`,`${(net*1.02).toFixed(2)}kWh`,`${((charge-dis)*.2).toFixed(2)}kWh`],`${fmt(charge)}/0.98−${fmt(dis)}×0.98＝${net.toFixed(2)}kWh。`,'電能損失費：淨計量公式','計算;電能損失費'); n++; }
  while(n<=160){ const rates=[95,94,93,92,91,90,69],rate=rates[n%7],map={95:1,94:.8,93:.6,92:.4,91:.2,90:0,69:-1},qi=map[rate],price=400+(n%17)*5,mw=2+(n%9),total=(price+350)*mw*qi;
    add(`N8-${String(n).padStart(3,'0')}`,8,'品質指標＋結算','3情境計算',`dReg執行率${rate}%，容量價格${price}元/MW·h、效能350元/MW·h、得標${mw}MW。先換算品質指標後，結算價金？`,`${fmt(total)}元`,[`${fmt(price*mw)}元`,`${fmt(350*mw)}元`,`${fmt((price+350)*mw)}元`],`執行率${rate}%→品質指標${qi}；(${price}＋350)×${mw}×${qi}＝${fmt(total)}元。`,'服務品質指標圖（新計算方式）＋調頻備轉月結算公式','計算;服務品質;結算;複合題'); n++;
  }

  n=1;
  for(const cap of [.1,.9,1,1.1,2,2.1,2.9,3.2,4,4.1,5.5,6,6.2,7.8,8,8.4,9.9,10,10.1,12.6]){ const r=Math.ceil(cap),fee=r*109500;
    add(`N9-${String(n).padStart(3,'0')}`,9,'保證金計算','3情境計算',`每MW保證金109,500元，MW以下無條件進位。交易${cap}MW應繳？`,`${fmt(fee)}元`,[`${fmt(cap*109500)}元`,`${fmt(Math.max(1,r-1)*109500)}元`,`${fmt((r+1)*109500)}元`],`${cap}MW進位為${r}MW；${r}×109,500＝${fmt(fee)}元。`,'保證金收取方式','計算;保證金'); n++; }
  for(const price of [50,80,100,120,150,180,190,200,210,250]){ const ok=price<=200;
    add(`N9-${String(n).padStart(3,'0')}`,9,'標售底價上限','2理解計算',`賣方擬設定標售底價${price}萬元/MW-年，教材上限200萬元/MW。是否符合？`,ok?'符合上限':'超過上限',[ok?'超過上限':'符合上限','必須剛好200萬元','教材無上限'],`${price}${ok?'≤':'>'}200，因此${ok?'符合':'超過'}上限。`,'賣方標售資訊內容項目','計算;標售底價;門檻'); n++; }
  for(let day=1;day<=10;day++){ const phase=day<=3?'賣方設定標售資訊':day<=5?'審查期間':'買方競價期間';
    add(`N9-${String(n).padStart(3,'0')}`,9,'交易媒合時間','2理解',`媒合起始日起第${day}日，主要處於哪一階段？`,phase,['賣方設定標售資訊','審查期間','買方競價期間'].filter(x=>x!==phase).concat(['資訊閉鎖後公告']),`前3日賣方設定；第4～5日審查；第6～10日買方競價。`,'交易媒合期間相關具體時間表','交易媒合;時程'); n++; }
  while(n<=50){ const cap=10+(n-40)*7.5,units=cap*100;
    add(`N9-${String(n).padStart(3,'0')}`,9,'交易容量單位','3情境計算',`基本交易單位10kW。交易容量${cap}MW相當於多少個10kW單位？`,`${units}個`,[`${units/10}個`,`${units*10}個`,`${cap}個`],`${cap}MW＝${cap*1000}kW；÷10＝${units}個。`,'備用容量市場供給者之參與方式','計算;交易容量;10kW'); n++;
  }

  if(out.length !== 500) console.error('擴充題庫題數異常', out.length);
  window.LOCAL_QUESTIONS=(window.LOCAL_QUESTIONS||[]).concat(out);
})();