(() => {
  const qs = Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : [];
  const byId = new Map(qs.map(q => [String(q.id || ''), q]));

  const fmt = n => `${Math.round(n).toLocaleString('en-US')}元`;
  const trim = n => Number(n).toFixed(2).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1');

  function moneyDistractors(correct, candidates) {
    const correctText = fmt(correct);
    const out = [];
    for (const value of candidates) {
      const text = fmt(value);
      if (text !== correctText && !out.includes(text)) out.push(text);
      if (out.length === 3) break;
    }
    let k = 1;
    while (out.length < 3) {
      const text = fmt(correct + 137 * k++);
      if (text !== correctText && !out.includes(text)) out.push(text);
    }
    return out;
  }

  function powerDistractors(correct, candidates) {
    const correctText = `${trim(correct)}MW`;
    const out = [];
    for (const value of candidates) {
      if (!(value > 0)) continue;
      const text = `${trim(value)}MW`;
      if (text !== correctText && !out.includes(text)) out.push(text);
      if (out.length === 3) break;
    }
    let k = 1;
    while (out.length < 3) {
      const text = `${trim(correct + 0.5 * k++)}MW`;
      if (text !== correctText && !out.includes(text)) out.push(text);
    }
    return out;
  }

  // V2保留下來的E-dReg電能服務費／功率反推題：
  // 將「持續30/60分鐘」改寫為官方結算語意：每得標小時切成4個15分鐘區間，
  // 各區間依排程狀態與區間內每秒平均功率計算。
  for (let idNum = 1; idNum <= 90; idNum++) {
    const i = idNum - 1;
    const m = i % 7;
    if (m !== 3 && m !== 4) continue;
    const q = byId.get(`V2U8-${String(idNum).padStart(3,'0')}`);
    if (!q) continue;

    const typ = i % 2 ? '充電' : '放電';
    const price = typ === '放電' ? 2000 : 500;
    const minutes = [15,30,60][i % 3];
    const intervalCount = minutes / 15;

    if (m === 3) {
      const p = 1 + (i % 9) / 2;
      const fee = price * p * intervalCount * 0.25;
      const ds = moneyDistractors(fee, [price*p, fee*2, fee/2, price*p*0.25, price*p*0.5, fee+price*0.25, fee+500]);
      q.topic = '第8單元｜E-dReg 15分鐘區間電能服務費';
      q.question = `情境V4-${idNum}：某E-dReg得標小時內，連續${intervalCount}個15分鐘區間均為${typ}排程，各區間平均每秒功率皆為${trim(p)}MW；${typ}電能服務價格為${price}元/MWh。這${intervalCount}個區間的電能服務費合計為何？`;
      q.option_a = fmt(fee);
      q.option_b = ds[0];
      q.option_c = ds[1];
      q.option_d = ds[2];
      q.answer = 'A';
      q.explanation = `每個15分鐘區間為0.25小時；${price}×${trim(p)}×0.25×${intervalCount}＝${fmt(fee)}。官方結算以各15分鐘區間的排程狀態與區間內平均每秒功率計算。`;
      q.source_locator = 'E-dReg電能服務費：每得標小時分4個15分鐘區間；放電2,000元/MWh、充電500元/MWh；依區間內每秒平均功率計算';
      q.tags = '單元08;計算;E-dReg;電能服務費;15分鐘區間;115語意修正;已核對';
    } else {
      const p = 1 + (i % 7) / 2;
      const fee = price * p * intervalCount * 0.25;
      const ds = powerDistractors(p, [p*2,p/2,p+1,p-1,p+1.5,p*3]);
      q.topic = '第8單元｜E-dReg 15分鐘區間功率反推';
      q.question = `情境V4-${idNum}：某E-dReg得標小時內，連續${intervalCount}個15分鐘區間均為${typ}排程，且各區間平均功率相同；${typ}電能服務價格為${price}元/MWh，這些區間合計電能服務費為${fmt(fee)}。反推每區間平均每秒功率為何？`;
      q.option_a = `${trim(p)}MW`;
      q.option_b = ds[0];
      q.option_c = ds[1];
      q.option_d = ds[2];
      q.answer = 'A';
      q.explanation = `${fee}÷${price}÷0.25÷${intervalCount}＝${trim(p)}MW。官方公式以15分鐘區間為基本結算單位。`;
      q.source_locator = 'E-dReg電能服務費：每得標小時分4個15分鐘區間；依區間內每秒平均功率反推';
      q.tags = '單元08;計算;E-dReg;電能服務費;15分鐘區間;功率反推;115語意修正;已核對';
    }
  }

  // 以5題較重複的dReg直接結算題，改成真正的E-dReg完整小時結算。
  // 當小時價金 = (容量費 + 效能費) × 服務品質指標 + 電能服務費；
  // 併網型儲能的電能損失費於月結算另行扣除。
  const fullCases = [
    {id:'V2U8-057', cp:0,   mw:5, q:1.0, intervals:[['充電',2],['放電',3],['無移轉',0],['無移轉',0]]},
    {id:'V2U8-064', cp:120, mw:4, q:0.8, intervals:[['充電',4],['充電',4],['放電',2],['無移轉',0]]},
    {id:'V2U8-071', cp:300, mw:3, q:0.6, intervals:[['放電',1],['放電',2],['充電',3],['無移轉',0]]},
    {id:'V2U8-078', cp:500, mw:6, q:0.4, intervals:[['放電',4],['充電',2],['充電',2],['充電',2]]},
    {id:'V2U8-085', cp:0,   mw:2, q:0.0, intervals:[['放電',2],['充電',2],['無移轉',0],['無移轉',0]]}
  ];

  fullCases.forEach((c,caseIndex) => {
    const q = byId.get(c.id);
    if (!q) return;
    let energy = 0;
    c.intervals.forEach(([state,p]) => {
      if (state === '放電') energy += 2000 * p * 0.25;
      if (state === '充電') energy += 500 * p * 0.25;
    });
    const preQuality = (c.cp + 475) * c.mw;
    const qualityPart = preQuality * c.q;
    const total = qualityPart + energy;
    const schedule = c.intervals.map(([s,p],idx) => `第${idx+1}區間${s}${p ? `${p}MW` : ''}`).join('、');

    q.topic = '第8單元｜E-dReg完整結算';
    q.question = `情境E-${caseIndex+1}：某E-dReg得標小時，容量結清價${c.cp}元/MW·h、效能價475元/MW·h、得標${c.mw}MW、服務品質指標${c.q}；4個15分鐘區間為${schedule}。暫不扣月結算電能損失費，該小時結算價金為何？`;
    const ds = moneyDistractors(total, [preQuality+energy, qualityPart, energy, preQuality, total+475, Math.max(0,total-475)]);
    q.option_a = fmt(total);
    q.option_b = ds[0];
    q.option_c = ds[1];
    q.option_d = ds[2];
    q.answer = 'A';
    q.explanation = `容量費＋效能費未乘品質前＝(${c.cp}＋475)×${c.mw}＝${fmt(preQuality)}；乘服務品質指標${c.q}後為${fmt(qualityPart)}。4個15分鐘區間電能服務費合計${fmt(energy)}，因此當小時價金＝${fmt(qualityPart)}＋${fmt(energy)}＝${fmt(total)}。併網型儲能設備之電能損失費在月結算另計。`;
    q.source_locator = 'E-dReg結算：[(容量費＋效能費)×服務品質指標]＋電能服務費；電能服務費按4個15分鐘區間計；併網型儲能另扣月結算電能損失費';
    q.tags = '單元08;計算;E-dReg;完整結算;容量費;效能費475;服務品質指標;15分鐘區間;電能服務費;115修正;已核對';
  });
})();
