(() => {
  const qs = Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : [];
  const byId = new Map(qs.map(q => [String(q.id || ''), q]));

  function uniquePercentOptions(correct, candidates) {
    const correctText = `${correct}%`;
    const out = [];
    for (const v of candidates) {
      const text = `${Math.max(0,Math.min(100,Math.round(v)))}%`;
      if (text !== correctText && !out.includes(text)) out.push(text);
      if (out.length === 3) break;
    }
    let d = 1;
    while (out.length < 3) {
      const v = Math.max(0, Math.min(100, correct + (d % 2 ? d : -d)));
      const text = `${v}%`;
      if (text !== correctText && !out.includes(text)) out.push(text);
      d++;
    }
    return out;
  }

  function applyQuestion(q, question, correct, distractors, explanation, locator, extraTags='') {
    if (!q) return;
    q.topic = '第7單元｜SBSPM操作曲線範圍判定';
    q.level = '3情境計算';
    q.question = question;
    q.option_a = `${correct}%`;
    q.option_b = distractors[0];
    q.option_c = distractors[1];
    q.option_d = distractors[2];
    q.answer = 'A';
    q.explanation = explanation;
    q.source_locator = locator;
    q.tags = `單元07;計算;dReg;SBSPM;操作曲線允許範圍;最近邊界;4秒滾動;115語意修正;${extraTags};已核對`;
  }

  // V3U7-001～025：明確指出各秒皆在允許範圍外，SBSPM依「實際值與最近操作曲線邊界之差」計算。
  for (let i=0;i<25;i++) {
    const devs = [2+(i%7), 5+(i%6), 3+(i%8), 7+(i%5)];
    const s = devs.map(d => 100-d);
    const roll = Math.max(...s);
    const avg = s.reduce((a,b)=>a+b,0)/4;
    const ds = uniquePercentOptions(roll, [Math.min(...s), Math.round(avg), s[3], s[0], roll-1, roll+1]);
    const q = byId.get(`V3U7-${String(i+1).padStart(3,'0')}`);
    applyQuestion(
      q,
      `情境SB-${i+1}：某dReg連續4秒均已確認落在操作曲線允許範圍之外；實際輸出／輸入百分比與「各秒最近操作曲線邊界」的絕對差依序為${devs.join('%、')}%。先求各秒SBSPM，再求第4秒的4秒滾動執行率。`,
      roll,
      ds,
      `各秒均在允許範圍外，故SBSPM＝100%−與最近邊界之絕對差，依序為${s.join('%、')}%；4秒滾動執行率取這4個SBSPM最大值＝${roll}%。`,
      '管理規範附件六：落在操作曲線允許範圍外時，SBSPM=100%−|實際輸出/輸入百分比−該頻率下最近操作曲線邊界百分比|；每秒滾動執行率取前4秒SBSPM最大值',
      '範圍外'
    );
  }

  // V3U7-026～030：加入「落在允許範圍內即SBSPM=100%」的混合判斷。
  for (let j=0;j<5;j++) {
    const devA = 3+j;
    const devC = 6+(j%3);
    const devD = 2+(j%4);
    const s = [100-devA, 100, 100-devC, 100-devD];
    const roll = 100;
    const ds = uniquePercentOptions(roll, [Math.max(s[0],s[2],s[3]), Math.min(...s), Math.round((s[0]+s[2]+s[3])/3), 99, 98]);
    const q = byId.get(`V3U7-${String(26+j).padStart(3,'0')}`);
    applyQuestion(
      q,
      `情境SB-${26+j}：某dReg連續4秒中，第1、3、4秒皆在操作曲線允許範圍外，與最近邊界之差分別為${devA}%、${devC}%、${devD}%；第2秒則落在操作曲線允許範圍內。第4秒的4秒滾動執行率為何？`,
      roll,
      ds,
      `範圍外三秒的SBSPM分別為${s[0]}%、${s[2]}%、${s[3]}%；第2秒位於允許範圍內，SBSPM＝100%。4秒滾動取最大值，因此為100%。`,
      '管理規範附件六：符合操作曲線允許範圍時SBSPM=100%；落在範圍外時才計算與最近邊界之差；4秒滾動取最大值',
      '範圍內;範圍外'
    );
  }

  // V3U7-046～060：保留「MW→得標容量百分比→SBSPM→4秒滾動」的多步驟能力，
  // 但明確指定四秒頻率相同、實際值皆超出同一最近上界，避免把SBSPM誤解成永遠減單一目標點。
  for (let j=0;j<15;j++) {
    const cap = 4+(j%6);
    const boundary = 20+20*(j%4);
    const devs = [2+(j%5), 4+((j+1)%4), 3+((j+2)%6), 6+((j+3)%5)];
    const pct = devs.map(d => boundary+d);
    const mw = pct.map(x => cap*x/100);
    const s = devs.map(d => 100-d);
    const roll = Math.max(...s);
    const ds = uniquePercentOptions(roll, [Math.min(...s), Math.round(s.reduce((a,b)=>a+b,0)/4), s[3], s[0], roll-1]);
    const q = byId.get(`V3U7-${String(46+j).padStart(3,'0')}`);
    applyQuestion(
      q,
      `情境MW-${j+1}：某dReg得標${cap}MW，連續4秒系統頻率相同；該頻率下操作曲線允許範圍的最近上界為${boundary}%得標容量，且4秒實際值均高於此上界。實際功率依序為${mw.map(x=>Number(x).toFixed(2).replace(/\.00$/,'')).join('、')}MW。換算成得標容量百分比後，求第4秒的4秒滾動執行率。`,
      roll,
      ds,
      `實際功率÷${cap}MW後，百分比分別為${pct.join('%、')}%；與最近上界${boundary}%之差為${devs.join('%、')}%，所以SBSPM為${s.join('%、')}%。4秒滾動取最大值＝${roll}%。`,
      '管理規範附件六：先以實際功率/得標容量換算百分比；若落在操作曲線範圍外，與該頻率下最近操作曲線邊界比較計算SBSPM；4秒滾動取最大值',
      '功率換算;範圍外;多步驟'
    );
  }

  // V2U6保留下來的5題備用容量市場系統使用費：
  // 備用供電容量以MW為最小計費單位，MW以下無條件進位，再乘1,000元/MW/年。
  // 原題將0.5MW直接乘1,000，均少計500元，於此修正。
  const reserveFeeCases = [
    {id:'V2U6-006', cap:12.5, apps:1},
    {id:'V2U6-018', cap:18.5, apps:3},
    {id:'V2U6-030', cap:24.5, apps:5},
    {id:'V2U6-042', cap:15.5, apps:2},
    {id:'V2U6-054', cap:21.5, apps:4}
  ];
  reserveFeeCases.forEach(c => {
    const q = byId.get(c.id);
    if (!q) return;
    const billedMw = Math.ceil(c.cap);
    const systemFee = billedMw * 1000;
    const applicationFee = c.apps * 1000;
    const total = systemFee + applicationFee;
    const oldWrong = c.cap * 1000 + applicationFee;
    const money = n => `${Math.round(n).toLocaleString('en-US')}元`;

    q.topic = '第6單元｜備用供電容量系統使用費進位';
    q.level = '3情境計算';
    q.question = `某合格交易者提出備用供電容量${c.cap.toFixed(1)}MW。備用容量市場系統使用費為1,000元/MW/年，且備用供電容量以MW為計費單位、MW以下無條件進位；另有${c.apps}次申請手續費，每次1,000元。兩項合計為何？`;
    q.option_a = money(total);
    q.option_b = money(oldWrong);
    q.option_c = money(systemFee);
    q.option_d = money(applicationFee);
    q.answer = 'A';
    q.explanation = `${c.cap.toFixed(1)}MW須先無條件進位為${billedMw}MW；系統使用費＝${billedMw}×1,000＝${money(systemFee)}。申請手續費＝${c.apps}×1,000＝${money(applicationFee)}；合計${money(total)}。不能直接用${c.cap.toFixed(1)}×1,000計費。`;
    q.source_locator = '114.10第5版附件四／參與費用：備用容量市場系統使用費1,000元/MW/年；備用供電容量以MW計，MW以下無條件進位；申請手續費1,000元/次';
    q.tags = '單元06;計算;備用供電容量;系統使用費;申請手續費;無條件進位;115進位修正;已核對';
  });
})();
