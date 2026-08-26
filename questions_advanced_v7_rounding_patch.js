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

  // 備用容量媒合的「第1～10日」均為工作日，不是日曆日。
  // V2保留題6題：把「第X日」明確改成「第X個工作日」。
  const v2ScheduleIds = ['V2U9-004','V2U9-008','V2U9-012','V2U9-016','V2U9-020','V2U9-024'];
  v2ScheduleIds.forEach(id => {
    const q = byId.get(id);
    if (!q) return;
    q.topic = '第9單元｜備用容量媒合工作日時程';
    q.question = String(q.question).replace(/第(\d+)日/g, '第$1個工作日');
    q.explanation = String(q.explanation).replace(/第(\d+)日/g, '第$1個工作日');
    q.source_locator = '114.10第5版備用容量交易專區具體時間表：賣方設定第1～3個工作日；審查第4～5個工作日；買方競價第6～10個工作日';
    q.tags = '單元09;理解;備用容量;交易媒合;工作日;115工作日修正;已核對';
  });

  // V3新題5題：比例計算仍是3+2+5=10，但單位明確為工作日。
  const v3ScheduleIds = ['V3U9-011','V3U9-012','V3U9-013','V3U9-014','V3U9-015'];
  v3ScheduleIds.forEach(id => {
    const q = byId.get(id);
    if (!q) return;
    q.topic = '第9單元｜備用容量媒合工作日時程比例';
    q.question = String(q.question)
      .replace('媒合前10日流程', '當次媒合10個工作日流程')
      .replace('賣方設定3日', '賣方設定3個工作日')
      .replace('審查2日', '審查2個工作日')
      .replace('買方競價5日', '買方競價5個工作日')
      .replace('這10日', '這10個工作日');
    q.explanation = `${q.explanation} 時程單位為工作日：第1～3個工作日設定、第4～5個工作日審查、第6～10個工作日競價。`;
    q.source_locator = '114.10第5版備用容量交易專區具體時間表：3個工作日設定＋2個工作日審查＋5個工作日競價';
    q.tags = '單元09;計算;備用容量;交易媒合;時程;工作日;比例;115工作日修正;已核對';
  });

  // 原300題核心／易混淆題仍殘留第4版或更早的「基本單位10kW」與日曆日語意，於正式載入時覆寫為第5版。
  const coreRule = byId.get('V09-001');
  if (coreRule) {
    coreRule.topic = '第9單元｜備用容量參與門檻與基本單位';
    coreRule.question = '依114.10第5版，備用容量市場交易資源的參與容量門檻與交易基本單位，下列何者正確？';
    coreRule.option_a = '參與容量須達10kW（含）以上，交易基本單位為1kW';
    coreRule.option_b = '參與容量須達10kW（含）以上，交易基本單位為10kW';
    coreRule.option_c = '參與容量至少1MW，交易基本單位100kW';
    coreRule.option_d = '沒有最低參與容量';
    coreRule.answer = 'A';
    coreRule.explanation = '第5版第二十四條規定：交易資源參與容量須達10kW（含）以上，基本單位為kW（1kW）。因此10kW是最低參與門檻，不是交易粒度。';
    coreRule.source_locator = '114.10第5版第四章第二十四條：參與容量須達10kW（含）以上；基本單位為kW';
    coreRule.tags = '單元09;已核對;最低10kW;基本單位1kW;115版本修正';
  }

  const confusionCapacity = byId.get('C9-002');
  if (confusionCapacity) {
    confusionCapacity.topic = '第9單元｜最低10kW與1kW基本單位';
    confusionCapacity.question = '某備用容量交易資源可提供17kW。依114.10第5版，下列判斷何者正確？';
    confusionCapacity.option_a = '不能參與，因為17kW不是10kW的整數倍';
    confusionCapacity.option_b = '可以參與；已達10kW最低門檻，且交易基本單位為1kW';
    confusionCapacity.option_c = '不能參與，因為最低門檻為100kW';
    confusionCapacity.option_d = '可以參與，但必須先進位成20kW';
    confusionCapacity.answer = 'B';
    confusionCapacity.explanation = '第5版規則是「最低參與容量10kW」與「交易基本單位1kW」並存；17kW已達門檻，可直接以17kW參與，不必湊成10kW倍數。原題的「基本單位10kW」屬舊版敘述；現行條文亦不應再無依據地附加「不得聚合」作為本題結論。';
    confusionCapacity.source_locator = '114.10第5版第四章第二十四條：交易資源參與容量須達10kW（含）以上；基本單位為kW（1kW）';
    confusionCapacity.tags = '單元09;易混淆;最低10kW;基本單位1kW;115版本修正;已核對';
  }

  const confusionSchedule = byId.get('C9-003');
  if (confusionSchedule) {
    confusionSchedule.question = '備用容量市場當次媒合起始日後，賣方設定標售資訊、標售資訊審查、買方競價的工作日時段依序為何？';
    confusionSchedule.option_a = '第1～3個工作日／第4～5個工作日／第6～10個工作日';
    confusionSchedule.option_b = '第1個工作日／第2～8個工作日／第9～10個工作日';
    confusionSchedule.option_c = '第1～5個工作日／第6個工作日／第7個工作日';
    confusionSchedule.option_d = '沒有固定順序';
    confusionSchedule.answer = 'A';
    confusionSchedule.explanation = '第5版第二十五條的當次媒合時間表以工作日計：第1～3個工作日設定、第4～5個工作日審查、第6～10個工作日競價。';
    confusionSchedule.source_locator = '114.10第5版第四章第二十五條：當次交易媒合操作具體時間表（工作日）';
    confusionSchedule.tags = '單元09;易混淆;媒合時程;工作日;115工作日修正;已核對';
  }
})();
