(() => {
  const qs = Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : [];
  const byId = new Map(qs.map(q => [String(q.id || ''), q]));
  const fmt = n => `${Math.round(n).toLocaleString('en-US')}元`;

  // 114.10第5版第四章備用容量市場：
  // 交易資源參與容量須達10kW（含）以上；交易基本單位為1kW。
  // 舊版曾使用「基本單位10kW」，因此將正式題庫中仍殘留舊敘述的6題改寫，
  // 並刻意採11、17、23、31、44、59kW等非10倍數容量，以驗證版本觀念。
  const cases = [
    {id:'V2U9-003', kw:11, price:1200000},
    {id:'V2U9-007', kw:17, price:1400000},
    {id:'V2U9-011', kw:23, price:1600000},
    {id:'V2U9-015', kw:31, price:1800000},
    {id:'V2U9-019', kw:44, price:1300000},
    {id:'V2U9-023', kw:59, price:1500000}
  ];

  cases.forEach((c, idx) => {
    const q = byId.get(c.id);
    if (!q) return;
    const total = c.kw / 1000 * c.price;
    const wrongDown = Math.floor(c.kw / 10) * 10 / 1000 * c.price;
    const wrongUp = Math.ceil(c.kw / 10) * 10 / 1000 * c.price;

    q.topic = '第9單元｜備用容量最低門檻與1kW基本單位';
    q.level = '3情境計算';
    q.question = `情境BK-${idx+1}：依114.10第5版，備用容量交易資源參與容量須達10kW（含）以上，交易基本單位為1kW。某資源以${c.kw}kW、成交價格${c.price.toLocaleString('en-US')}元/MW·年交易，其年價金為何？`;
    q.option_a = `${fmt(total)}/年`;
    q.option_b = `${fmt(wrongDown)}/年`;
    q.option_c = `${fmt(wrongUp)}/年`;
    q.option_d = `${fmt(c.price)}/年`;
    q.answer = 'A';
    q.explanation = `${c.kw}kW已達10kW最低參與門檻，且基本單位為1kW，因此${c.kw}kW可直接作為交易容量，不須湊成10kW倍數。${c.kw}÷1,000＝${(c.kw/1000).toFixed(3)}MW；再乘${c.price.toLocaleString('en-US')}元/MW·年＝${fmt(total)}/年。`;
    q.source_locator = '114.10第5版第四章第24條：備用容量交易資源參與容量須達10kW（含）以上；基本單位為kW（1kW）';
    q.tags = '單元09;計算;備用容量;最低10kW;基本單位1kW;價格換算;115版本修正;已核對';
  });
})();
