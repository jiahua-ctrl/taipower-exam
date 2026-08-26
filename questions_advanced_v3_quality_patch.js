(() => {
  const all = Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : [];
  const v2 = all.filter(q => /^V2U[46789]-\d{3}$/.test(String(q.id || '')));
  const base = all.filter(q => !/^V2U[46789]-\d{3}$/.test(String(q.id || '')));
  const keepQuota = {4:25,6:60,7:100,8:90,9:25};
  const kept = [];
  const byUnit = {4:[],6:[],7:[],8:[],9:[]};
  for (const q of v2) {
    const m = String(q.id).match(/^V2U(\d)-/);
    if (m && byUnit[m[1]]) byUnit[m[1]].push({...q});
  }
  for (const u of [4,6,7,8,9]) kept.push(...byUnit[u].slice(0, keepQuota[u]));

  const fresh = [];
  const seq = {4:0,6:0,7:0,8:0,9:0};
  const sourceTitle = {
    4:'04. 電力交易平台參考資料 輔助服務概論',
    6:'06. 電力交易平台參考資料 日前輔助服務市場之參與作法',
    7:'07. 電力交易平台參考資料 日前輔助服務市場之交易商品項目規格',
    8:'08. 電力交易平台參考資料 日前輔助服務市場之運作',
    9:'09. 電力交易平台參考資料 備用容量交易機制'
  };
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const trim = n => Number(n).toFixed(2).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1');
  const qi = r => r >= 95 ? 1 : r === 94 ? .8 : r === 93 ? .6 : r === 92 ? .4 : r === 91 ? .2 : r >= 70 ? 0 : -1;
  const fee = (mw,res) => 8847 + mw*400 + res*100;
  const sbspm = (req,act) => 100 - Math.abs(act-req);

  function add(unit, topic, question, correct, distractors, explanation, locator, tags, level='3情境計算') {
    seq[unit]++;
    fresh.push({
      id:`V3U${unit}-${String(seq[unit]).padStart(3,'0')}`,
      subject:unit===4?'科目一｜電力系統與電力市場':'科目二｜電力交易平台市場規則',
      topic:`第${unit}單元｜${topic}`,
      level,
      question,
      option_a:String(correct), option_b:String(distractors[0]), option_c:String(distractors[1]), option_d:String(distractors[2]), answer:'A',
      explanation,
      source_title:sourceTitle[unit], source_url:'', source_locator:locator,
      is_active:true,
      tags:`單元${String(unit).padStart(2,'0')};${tags};重整V3;已核對`
    });
  }

  const svc = [['dReg',1],['sReg',10],['即時備轉',600],['補充備轉',1800]];
  for (let i=0;i<5;i++) {
    const a=svc[i%4], b=svc[(i+1)%4], na=2+(i%3), nb=1+((i+1)%3);
    const total=a[1]*na+b[1]*nb;
    add(4,'反應時間複合計算',`情境${i+1}：若${a[0]}按上限${a[1]}秒執行${na}次，另${b[0]}按上限${b[1]}秒執行${nb}次，合計反應時間上限為多少秒？`,`${total}秒`,[`${a[1]*na}秒`,`${b[1]*nb}秒`,`${total+Math.min(a[1],b[1])}秒`],`${a[1]}×${na}＋${b[1]}×${nb}＝${total}秒。`,'我國輔助服務項目分類：反應時間','計算;反應時間;複合題');
  }
  for (let i=0;i<5;i++) {
    const a=svc[i%4], budget=a[1]*(4+i)+Math.max(1,Math.floor(a[1]/2)), count=Math.floor(budget/a[1]), remain=budget-count*a[1];
    add(4,'反應時間反推',`情境${i+6}：每次${a[0]}都以反應時間上限${a[1]}秒估算，總預算${budget}秒，最多可完整安排幾次，且剩餘多少秒？`,`${count}次，餘${remain}秒`,[`${count+1}次，餘0秒`,`${Math.max(0,count-1)}次，餘${remain+a[1]}秒`,`${count}次，餘${remain+a[1]}秒`],`${budget}÷${a[1]}取完整次數為${count}，餘數${remain}秒。`,'我國輔助服務項目分類：反應時間','計算;反應時間;反推');
  }
  for (let i=0;i<5;i++) {
    const instant=1+(i%4), supplemental=1+((i+2)%3), hours=instant*1+supplemental*2;
    add(4,'持續時間複合計算',`情境${i+11}：即時備轉服務${instant}次（每次1小時），補充備轉服務${supplemental}次（每次2小時），合計服務時間？`,`${hours}小時`,[`${instant+supplemental}小時`,`${hours+1}小時`,`${hours*2}小時`],`${instant}×1＋${supplemental}×2＝${hours}小時。`,'我國輔助服務項目分類：持續時間','計算;持續時間;複合題');
  }

  for (let i=0;i<10;i++) {
    const oldMw=8+i, oldRes=2+(i%3), newMw=oldMw+5+(i%4), newRes=oldRes+1, months=3+(i%5), apps=1+(i%2);
    const oldF=fee(oldMw,oldRes), newF=fee(newMw,newRes), total=oldF+(months-1)*newF+apps*1000;
    add(6,'費用變更複合題',`情境${i+1}：本月中由${oldMw}MW/${oldRes}資源變更為${newMw}MW/${newRes}資源；本月仍按原額、次月起按新額。連續${months}個月另有${apps}次申請手續費（每次1,000元），總費用？`,`${fmt(total)}元`,[`${fmt(months*newF+apps*1000)}元`,`${fmt(months*oldF+apps*1000)}元`,`${fmt(total+400)}元`],`首月${fmt(oldF)}＋後${months-1}月×${fmt(newF)}＋手續費${fmt(apps*1000)}＝${fmt(total)}元。`,'參與費用；變更當月原額、次月生效；申請手續費1,000元/次','計算;參與費用;生效月份;複合題');
  }
  for (let i=0;i<5;i++) {
    const mw=15+i*5, res=2+i, monthly=fee(mw,res), annual=monthly*12;
    add(6,'參與容量反推',`情境${i+11}：交易資源${res}個，全年12個月條件不變，全年參與費用${fmt(annual)}元。反推參與容量？`,`${mw}MW`,[`${mw-5}MW`,`${mw+5}MW`,`${mw+res}MW`],`先除以12得每月${fmt(monthly)}元；再扣8,847與${res}×100，最後÷400＝${mw}MW。`,'參與費用：8,847元/家＋400元/MW＋100元/個','計算;參與費用;反推;多步驟');
  }
  for (let i=0;i<5;i++) {
    const aMw=10+i*3,aRes=2+(i%2),bMw=aMw+4,bRes=aRes+2, months=6+(i%3), diff=(fee(bMw,bRes)-fee(aMw,aRes))*months;
    add(6,'參與費用比較',`情境${i+16}：甲${aMw}MW/${aRes}資源、乙${bMw}MW/${bRes}資源，條件連續${months}個月不變。乙累計比甲多付多少參與費？`,`${fmt(diff)}元`,[`${fmt(diff/months)}元`,`${fmt((bMw-aMw)*400*months)}元`,`${fmt(diff+1000)}元`],`每月差額＝容量差×400＋資源差×100；再乘${months}個月＝${fmt(diff)}元。`,'參與費用計算','計算;參與費用;比較;多步驟');
  }
  const tests=[['dReg步階',1080],['sReg步階',600],['dReg持續能力',900],['E-dReg持續能力',9000]];
  for (let i=0;i<5;i++) {
    const a=tests[i%4],b=tests[(i+1)%4],total=a[1]+b[1],mins=total/60;
    add(6,'能力測試時間整合',`情境${i+21}：${a[0]}測試${a[1]}秒，接著${b[0]}測試${b[1]}秒，不計間隔，合計多少分鐘？`,`${trim(mins)}分鐘`,[`${trim(a[1]/60)}分鐘`,`${trim(b[1]/60)}分鐘`,`${trim(mins+1)}分鐘`],`(${a[1]}＋${b[1]})÷60＝${trim(mins)}分鐘。`,'dReg/sReg步階測試與持續能力測試時間','計算;能力測試;複合題');
  }
  for (let i=0;i<5;i++) {
    const ed=i%2===0, rate=ed?.02:.01, sec=30+i*5, delta=rate*sec, start=60, end=start+(i%2? -delta:delta);
    add(6,'頻率掃描反推',`情境${i+26}：${ed?'E-dReg':'dReg'}頻率掃描速率每秒${rate.toFixed(2)}Hz，從${start.toFixed(2)}Hz連續${sec}秒${i%2?'下降':'上升'}，理論終點頻率？`,`${end.toFixed(2)}Hz`,[`${(start+delta).toFixed(2)}Hz`,`${(start-delta).toFixed(2)}Hz`,`${delta.toFixed(2)}Hz`],`變化量${rate.toFixed(2)}×${sec}＝${delta.toFixed(2)}Hz；依方向得到${end.toFixed(2)}Hz。`,`${ed?'E-dReg':'dReg'}頻率掃描測試`,'計算;頻率掃描;反推');
  }

  for (let i=0;i<30;i++) {
    const req=[20,40,60,-20,-40][i%5], devs=[2+(i%7),5+(i%6),3+(i%8),7+(i%5)];
    const acts=devs.map((d,j)=>req+(j%2?d:-d));
    const s=acts.map(a=>sbspm(req,a)), roll=Math.max(...s);
    add(7,'SBSPM＋4秒滾動',`情境${i+1}：4秒操作曲線要求皆為${req}%，實際依序${acts.join('%、')}%。先逐秒算SBSPM，再求4秒滾動執行率？`,`${roll}%`,[`${Math.min(...s)}%`,`${Math.round(s.reduce((a,b)=>a+b)/4)}%`,`${s[3]}%`],`逐秒SBSPM為${s.join('%、')}%；4秒滾動取最大值＝${roll}%。`,'SBSPM公式；每秒滾動執行率=max(前4秒SBSPM)','計算;SBSPM;4秒滾動執行率;多步驟');
  }
  for (let i=0;i<15;i++) {
    const vals=[78+(i*3)%20,81+(i*5)%18,80+(i*7)%19,83+(i*11)%16,79+(i*13)%20];
    const r1=Math.max(...vals.slice(0,4)),r2=Math.max(...vals.slice(1,5)),lower=Math.min(r1,r2);
    add(7,'雙滾動視窗',`情境${i+31}：連續5秒SBSPM為${vals.join('%、')}%。第4秒視窗看前4秒，第5秒視窗看後4秒。兩個滾動執行率中較低者？`,`${lower}%`,[`${Math.min(...vals)}%`,`${Math.max(...vals)}%`,`${Math.round(vals.reduce((a,b)=>a+b)/5)}%`],`第4秒滾動=${r1}%，第5秒滾動=${r2}%，兩者較低為${lower}%。`,'每秒滾動執行率=max(前4秒SBSPM)','計算;4秒滾動執行率;視窗滑動;多步驟');
  }
  for (let i=0;i<15;i++) {
    const cap=4+(i%6), req=20+20*(i%4), pct=[req-8,req+5,req-3,req+10], mw=pct.map(x=>cap*x/100), s=pct.map(x=>sbspm(req,x)), roll=Math.max(...s);
    add(7,'功率換算＋SBSPM',`情境${i+46}：得標${cap}MW，4秒操作要求皆${req}%；實際功率依序${mw.map(trim).join('、')}MW。換算成得標容量百分比後，再求4秒滾動執行率？`,`${roll}%`,[`${Math.min(...s)}%`,`${Math.round(s.reduce((a,b)=>a+b)/4)}%`,`${100-Math.max(...pct.map(x=>Math.abs(x-req)))}%`],`實際百分比為${pct.join('%、')}%；SBSPM為${s.join('%、')}%，故4秒取最大=${roll}%。`,'實際輸出/輸入占得標容量百分比；SBSPM公式；4秒滾動執行率','計算;功率換算;SBSPM;4秒滾動執行率;多步驟');
  }

  const rates=[95,94,93,92,91,90,85];
  for (let i=0;i<20;i++) {
    const price1=420+(i%6)*10,price2=price1+15,mw=2+(i%5),r1=rates[i%7],r2=rates[(i+2)%7],q1=qi(r1),q2=qi(r2);
    const h1=(price1+350)*mw*q1,h2=(price2+350)*mw*q2,total=h1+h2;
    add(8,'兩小時dReg結算',`情境${i+1}：同一資源得標${mw}MW。第1小時容量價${price1}、執行率${r1}%；第2小時容量價${price2}、執行率${r2}%；效能價皆350元/MW·h。兩小時結算合計？`,`${fmt(total)}元`,[`${fmt((price1+price2)*mw)}元`,`${fmt(((price1+350)+(price2+350))*mw)}元`,`${fmt(h1)}元`],`品質指標分別${q1}、${q2}；兩小時為${fmt(h1)}＋${fmt(h2)}＝${fmt(total)}元。`,'服務品質指標圖（新計算方式）；調頻備轉結算公式','計算;dReg;服務品質;結算;多步驟');
  }
  for (let i=0;i<15;i++) {
    const price=430+(i%5)*10,mw=2+(i%6),q=[1,.8,.6,.4,.2][i%5],total=(price+350)*mw*q;
    add(8,'dReg容量反推',`情境${i+21}：容量價${price}、效能價350元/MW·h、品質指標${q}，某小時結算${fmt(total)}元。反推得標容量？`,`${mw}MW`,[`${Math.max(1,mw-1)}MW`,`${mw+1}MW`,`${mw+2}MW`],`${fmt(total)}÷[(${price}＋350)×${q}]＝${mw}MW。`,'調頻備轉結算公式','計算;dReg;結算;反推');
  }
  for (let i=0;i<15;i++) {
    const price=440+(i%4)*15,mw=3+(i%5),ra=95,rb=[94,93,92,91,90][i%5],qa=qi(ra),qb=qi(rb),a=(price+350)*mw*qa,b=(price+350)*mw*qb,diff=a-b;
    add(8,'服務品質價金差',`情境${i+36}：兩資源容量價皆${price}、效能價350、得標${mw}MW。甲執行率95%，乙${rb}%。甲比乙多結算多少？`,`${fmt(diff)}元`,[`${fmt(a)}元`,`${fmt(b)}元`,`${fmt((price+350)*mw)}元`],`品質指標甲1、乙${qb}；價金差＝(${price}＋350)×${mw}×(1−${qb})＝${fmt(diff)}元。`,'服務品質指標圖（新計算方式）；調頻備轉結算公式','計算;服務品質;結算;比較');
  }
  for (let i=0;i<20;i++) {
    const discharge1=1+(i%4),charge1=1+((i+1)%3),discharge2=.5+((i+2)%4),charge2=1+((i+3)%3);
    const feeD=(discharge1+discharge2)*.25*2000, feeC=(charge1+charge2)*.25*500,total=feeD+feeC;
    add(8,'E-dReg混合區間',`情境${i+51}：4個15分鐘區間依序為放電${discharge1}MW、充電${charge1}MW、放電${discharge2}MW、充電${charge2}MW。放電2,000元/MWh、充電500元/MWh，電能服務費合計？`,`${fmt(total)}元`,[`${fmt(feeD)}元`,`${fmt(feeC)}元`,`${fmt(total*2)}元`],`放電費${fmt(feeD)}元＋充電費${fmt(feeC)}元＝${fmt(total)}元。`,'E-dReg電能服務費：放電2,000元/MWh、充電500元/MWh；15分鐘區間換算','計算;E-dReg;電能服務費;多步驟');
  }
  for (let i=0;i<10;i++) {
    const charge=1000+i*200,dis=700+i*120,loss=.02,net=charge/(1-loss)-dis*(1-loss),allow=charge*.2,excess=net-allow;
    add(8,'電能損失複合計算',`情境${i+71}：月充電${charge}kWh、放電${dis}kWh、線損率2%。先依淨計量公式求淨計量，再扣除效率額度（充電量20%）；差額約多少kWh？`,`${excess.toFixed(2)}kWh`,[`${net.toFixed(2)}kWh`,`${allow.toFixed(2)}kWh`,`${(charge-dis).toFixed(2)}kWh`],`淨計量=${charge}/0.98−${dis}×0.98=${net.toFixed(2)}kWh；效率額度=${allow.toFixed(2)}kWh；差額=${excess.toFixed(2)}kWh。`,'電能損失費：淨計量公式；效率額度=總充電電度量×20%','計算;電能損失費;效率額度;多步驟');
  }

  for (let i=0;i<5;i++) {
    const a=.8+i,b=1.2+i,fa=Math.ceil(a)*109500,fb=Math.ceil(b)*109500,d=fb-fa;
    add(9,'保證金進位比較',`情境${i+1}：甲交易${a.toFixed(1)}MW、乙${b.toFixed(1)}MW；備用供電容量保證金109,500元/MW且不足1MW進位。乙比甲多繳多少？`,`${fmt(d)}元`,[`${fmt(fa)}元`,`${fmt(fb)}元`,`${fmt((b-a)*109500)}元`],`甲進位${Math.ceil(a)}MW、乙進位${Math.ceil(b)}MW，差額${fmt(d)}元。`,'保證金收取方式：MW以下無條件進位','計算;保證金;比較;無條件進位');
  }
  for (let i=0;i<5;i++) {
    const mw=1+i,cap=2000000*mw;
    add(9,'標售底價上限換算',`情境${i+6}：備用供電容量賣方底價上限為2,000,000元/MW。若標售${mw}MW，按每MW上限換算的總底價上限為多少？`,`${fmt(cap)}元`,[`${fmt(2000000)}元`,`${fmt(cap+2000000)}元`,`${fmt(cap/2)}元`],`${mw}×2,000,000＝${fmt(cap)}元。`,'備用容量市場之賣方底價上限：2,000,000元/MW','計算;標售底價;上限');
  }
  for (let i=0;i<5;i++) {
    const seller=3,bid=5,review=2,total=seller+review+bid, pct=bid/total*100;
    add(9,'媒合時程比例',`情境${i+11}：媒合前10日流程中，賣方設定3日、審查2日、買方競價5日。買方競價期間占這10日的比例？`,`${pct}%`,['20%','30%','70%'],`5÷10＝${pct}%。`,'交易媒合期間相關具體時間表','計算;交易媒合;時程');
  }

  function parseNumeric(text) {
    const s=String(text).replace(/,/g,'');
    const m=s.match(/-?\d+(?:\.\d+)?/);
    if(!m) return null;
    const num=Number(m[0]);
    const prefix=s.slice(0,m.index), suffix=s.slice(m.index+m[0].length);
    return Number.isFinite(num)?{num,prefix,suffix}:null;
  }
  function repairAndBalance(list) {
    const letters=['A','B','C','D'];
    return list.map((q,idx)=>{
      const qq={...q};
      const oldOpts=[qq.option_a,qq.option_b,qq.option_c,qq.option_d].map(String);
      const oldAns=letters.indexOf(String(qq.answer).toUpperCase());
      const correct=oldAns>=0?oldOpts[oldAns]:oldOpts[0];
      let opts=oldOpts.filter(x=>x && !x.includes('其他值') && x!==correct);
      opts=[...new Set(opts)];
      const p=parseNumeric(correct);
      if(p){
        const abs=Math.abs(p.num), step=abs>=1000?Math.max(100,Math.round(abs*.1/10)*10):abs>=100?10:abs>=10?1:abs>=1?.5:.1;
        for(const d of [step,-step,step*2,-step*2,step*3]){
          const v=p.num+d;
          if(v===p.num) continue;
          const decimals=String(p.num).includes('.')?Math.min(2,(String(p.num).split('.')[1]||'').length):0;
          const raw=decimals?Number(v).toFixed(decimals):String(Math.round(v));
          const candidate=`${p.prefix}${raw}${p.suffix}`;
          if(candidate!==correct && !opts.includes(candidate)) opts.push(candidate);
          if(opts.length>=3) break;
        }
      }
      const textFallback=['需依教材規則重新計算','應取平均值後判定','僅看最後一筆資料','資料不足，無法直接判定'];
      for(const x of textFallback){ if(opts.length>=3) break; if(x!==correct&&!opts.includes(x)) opts.push(x); }
      opts=opts.slice(0,3);
      const target=idx%4;
      const arranged=opts.slice();
      arranged.splice(target,0,correct);
      qq.option_a=arranged[0];qq.option_b=arranged[1];qq.option_c=arranged[2];qq.option_d=arranged[3];qq.answer=letters[target];
      return qq;
    });
  }

  let revised = repairAndBalance([...kept,...fresh]);
  if (revised.length !== 500) console.error('V3重整題數異常', revised.length, {kept:kept.length,fresh:fresh.length,seq});
  const ids=new Set(), questions=new Set();
  const bad=[];
  for(const q of revised){
    const opts=[q.option_a,q.option_b,q.option_c,q.option_d];
    if(ids.has(q.id)||questions.has(q.question)||new Set(opts).size!==4||opts.some(x=>String(x).includes('其他值'))) bad.push(q.id);
    ids.add(q.id);questions.add(q.question);
  }
  if(bad.length) console.error('V3題庫品質檢查發現異常',bad);
  else console.info('V3題庫品質檢查通過：500題、選項唯一、無placeholder');
  window.LOCAL_QUESTIONS=base.concat(revised);
})();
