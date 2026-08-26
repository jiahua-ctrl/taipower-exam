(() => {
  const qs = Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : [];
  const byId = new Map(qs.map(q => [String(q.id || ''), q]));
  const fmt = n => `${Math.round(n).toLocaleString('en-US')}元`;

  // 114.10 第5版附件四／參與費用規則：
  // 備用容量市場系統使用費為1,000元/MW/年；備用供電容量以MW為最小計費單位，MW以下無條件進位。
  // 修正V2中5題把0.5MW直接乘1,000元而少計500元的錯誤。
  const cases = [
    {id:'V2U6-006', cap:12.5, apps:1},
    {id:'V2U6-018', cap:18.5, apps:3},
    {id:'V2U6-030', cap:24.5, apps:5},
    {id:'V2U6-042', cap:15.5, apps:2},
    {id:'V2U6-054', cap:21.5, apps:4}
  ];

  cases.forEach(c => {
    const q = byId.get(c.id);
    if (!q) return;
    const billedMw = Math.ceil(c.cap);
    const systemFee = billedMw * 1000;
    const applicationFee = c.apps * 1000;
    const total = systemFee + applicationFee;
    const oldWrong = c.cap * 1000 + applicationFee;

    q.topic = '第6單元｜備用供電容量系統使用費進位';
    q.level = '3情境計算';
    q.question = `某合格交易者提出備用供電容量${c.cap.toFixed(1)}MW。備用容量市場系統使用費為1,000元/MW/年，且備用供電容量以MW為計費單位、MW以下無條件進位；另有${c.apps}次申請手續費，每次1,000元。兩項合計為何？`;
    q.option_a = fmt(total);
    q.option_b = fmt(oldWrong);
    q.option_c = fmt(systemFee);
    q.option_d = fmt(applicationFee);
    q.answer = 'A';
    q.explanation = `${c.cap.toFixed(1)}MW須先無條件進位為${billedMw}MW；系統使用費＝${billedMw}×1,000＝${fmt(systemFee)}。申請手續費＝${c.apps}×1,000＝${fmt(applicationFee)}；合計${fmt(total)}。不能直接用${c.cap.toFixed(1)}×1,000計費。`;
    q.source_locator = '114.10第5版附件四／參與費用：備用容量市場系統使用費1,000元/MW/年；備用供電容量以MW計，MW以下無條件進位；申請手續費1,000元/次';
    q.tags = '單元06;計算;備用供電容量;系統使用費;申請手續費;無條件進位;115進位修正;已核對';
  });
})();
