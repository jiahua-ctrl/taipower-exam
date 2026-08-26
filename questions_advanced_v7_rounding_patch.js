(() => {
  const qs = Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : [];
  const byId = new Map(qs.map(q => [String(q.id || ''), q]));
  const fmt = n => `${Math.round(n).toLocaleString('en-US')}元`;

  // 114.10第5版第四章備用容量市場：參與容量須達10kW（含）以上；交易基本單位為1kW。
  const cases = [
    {id:'V2U9-003', kw:11, price:1200000},
    {id:'V2U9-007', kw:17, price:1400000},
    {id:'V2U9-011', kw:23, price:1600000},
    {id:'V2U9-015', kw:31, price:1800000},
    {id:'V2U9-019', kw:44, price:1300000},
    {id:'V2U9-023', kw:59, price:1500000}
  ];
  cases.forEach((c, idx) => {
    const q = byId.get(c.id); if (!q) return;
    const total = c.kw / 1000 * c.price;
    const wrongDown = Math.floor(c.kw / 10) * 10 / 1000 * c.price;
    const wrongUp = Math.ceil(c.kw / 10) * 10 / 1000 * c.price;
    q.topic = '第9單元｜備用容量最低門檻與1kW基本單位';
    q.level = '3情境計算';
    q.question = `情境BK-${idx+1}：依114.10第5版，備用容量交易資源參與容量須達10kW（含）以上，交易基本單位為1kW。某資源以${c.kw}kW、成交價格${c.price.toLocaleString('en-US')}元/MW·年交易，其年價金為何？`;
    q.option_a = `${fmt(total)}/年`; q.option_b = `${fmt(wrongDown)}/年`; q.option_c = `${fmt(wrongUp)}/年`; q.option_d = `${fmt(c.price)}/年`; q.answer = 'A';
    q.explanation = `${c.kw}kW已達10kW最低參與門檻，且基本單位為1kW，因此${c.kw}kW可直接作為交易容量，不須湊成10kW倍數。${c.kw}÷1,000＝${(c.kw/1000).toFixed(3)}MW；再乘${c.price.toLocaleString('en-US')}元/MW·年＝${fmt(total)}/年。`;
    q.source_locator = '114.10第5版第四章第24條：備用容量交易資源參與容量須達10kW（含）以上；基本單位為kW（1kW）';
    q.tags = '單元09;計算;備用容量;最低10kW;基本單位1kW;價格換算;115版本修正;已核對';
  });

  // V2保留題：媒合操作時程均以工作日計。
  const v2ScheduleIds = ['V2U9-004','V2U9-008','V2U9-012','V2U9-016','V2U9-020','V2U9-024'];
  v2ScheduleIds.forEach(id => {
    const q = byId.get(id); if (!q) return;
    q.topic = '第9單元｜備用容量媒合工作日時程';
    q.question = String(q.question).replace(/第(\d+)日/g, '第$1個工作日');
    q.explanation = String(q.explanation).replace(/第(\d+)日/g, '第$1個工作日');
    q.source_locator = '114.10第5版備用容量交易專區具體時間表：賣方設定第1～3個工作日；審查第4～5個工作日；買方競價第6～10個工作日';
    q.tags = '單元09;理解;備用容量;交易媒合;工作日;115工作日修正;已核對';
  });

  // V3U9-006保留底價上限基礎計算；007～010改為真正的競標排序／容量分配題。
  const bidRule = byId.get('V3U9-007');
  if (bidRule) {
    bidRule.topic = '第9單元｜買方出價須高於賣方底價';
    bidRule.level = '3情境';
    bidRule.question = '某備用容量賣方底價為1,400,000元/MW·年。依第5版競標規則，下列哪一筆買方出價具備「高於底價」的條件？';
    bidRule.option_a = '1,500,000元/MW·年';
    bidRule.option_b = '1,400,000元/MW·年';
    bidRule.option_c = '1,399,999元/MW·年';
    bidRule.option_d = '1,200,000元/MW·年';
    bidRule.answer = 'A';
    bidRule.explanation = '買方出價必須「高於」賣方底價，不是高於或等於。因此1,400,000元等於底價仍不符合，1,500,000元才符合。';
    bidRule.source_locator = '114.10第5版第四章第26條：買方出價應高於賣方底價';
    bidRule.tags = '單元09;易混淆;備用容量;競價;高於底價;115競標修正;已核對';
  }

  const bidTie = byId.get('V3U9-008');
  if (bidTie) {
    bidTie.topic = '第9單元｜同價出價時間優先';
    bidTie.level = '3情境';
    bidTie.question = '甲、乙買方對同一備用容量商品都出價1,800,000元/MW·年；甲09:10完成出價，乙09:05完成出價。若其他條件相同，誰的得標優先順序較前？';
    bidTie.option_a = '乙，因同價時按完成出價時間先後決定';
    bidTie.option_b = '甲，因較晚出價代表資訊較新';
    bidTie.option_c = '兩者同時得標，不需排序';
    bidTie.option_d = '由賣方自行指定';
    bidTie.answer = 'A';
    bidTie.explanation = '出價價格相同時，得標優先順序按完成出價時間決定；09:05早於09:10，因此乙優先。';
    bidTie.source_locator = '114.10第5版第四章第26條：複數買方出價相同時，按完成出價時間決定得標優先順序';
    bidTie.tags = '單元09;易混淆;備用容量;競價;同價;完成出價時間;115競標修正;已核對';
  }

  const bidAllocation = byId.get('V3U9-009');
  if (bidAllocation) {
    bidAllocation.topic = '第9單元｜競價排序與部分得標容量';
    bidAllocation.level = '3情境計算';
    bidAllocation.question = '某賣方可售80kW、底價1,400,000元/MW·年。買方乙出價1,800,000元要40kW（09:05完成）、甲也出價1,800,000元要30kW（09:10完成）、丙出價1,600,000元要30kW。依第5版排序與容量分配，丙最後可得標多少？';
    bidAllocation.option_a = '10kW';
    bidAllocation.option_b = '0kW';
    bidAllocation.option_c = '20kW';
    bidAllocation.option_d = '30kW';
    bidAllocation.answer = 'A';
    bidAllocation.explanation = '先按價格排序；乙、甲同價時乙09:05先於甲09:10，因此乙先得40kW、甲再得30kW，共70kW。賣方尚餘10kW，故次高價丙雖要30kW，實際僅能分配10kW。';
    bidAllocation.source_locator = '114.10第5版第四章第26條：高價優先；同價按完成出價時間；有剩餘數量則依序分配至無數量為止';
    bidAllocation.tags = '單元09;計算;備用容量;競價;價格排序;同價時間;部分得標;115競標修正;已核對';
  }

  const buyerLimit = byId.get('V3U9-010');
  if (buyerLimit) {
    buyerLimit.topic = '第9單元｜買方不得超額購買';
    buyerLimit.level = '3情境計算';
    buyerLimit.question = '某買方依法應備總供電容量為5.0MW，參與媒合前已籌措2.2MW。依第5版，該買方在備用容量交易專區最多還可購買多少？';
    buyerLimit.option_a = '2.8MW';
    buyerLimit.option_b = '2.2MW';
    buyerLimit.option_c = '5.0MW';
    buyerLimit.option_d = '7.2MW';
    buyerLimit.answer = 'A';
    buyerLimit.explanation = '買方購買量不得高於「應備總供電容量－已籌措備用供電容量」；5.0−2.2＝2.8MW。';
    buyerLimit.source_locator = '114.10第5版第四章第27條：買方購買量不得高於應備總供電容量減去已籌措備用供電容量';
    buyerLimit.tags = '單元09;計算;備用容量;買方;不得超額購買;115競標修正;已核對';
  }

  // V3U9-011～015 原本五題皆為重複比例題，改為第25條五個高鑑別期限。
  const deadlineCases = [
    {id:'V3U9-011',topic:'資訊閉鎖期間',question:'依114.10第5版，備用容量市場「資訊閉鎖期間」原則上自何時開始，至何時結束？',correct:'交易媒合期間開始日前10日至交易媒合期間結束',distractors:['交易媒合期間開始前3個工作日至開始日','交易媒合期間結束後10日至30日','只有買方競價的第6～10個工作日'],explanation:'資訊閉鎖期間自交易媒合期間開始日前10日起，持續至交易媒合期間結束；期間原則不得變更已刊登需求或供給資訊，但經電力交易單位個案審查許可者例外。',locator:'114.10第5版第四章第25條第2款：資訊閉鎖期間＝交易媒合期間開始日前10日至交易媒合期間結束'},
    {id:'V3U9-012',topic:'需求量及供給量公告',question:'依第5版，電力交易單位應於交易媒合期間開始前多久通知備用供電容量需求量及供給量？',correct:'3個工作日',distractors:['3個日曆日','10個工作日','30日'],explanation:'需求量及供給量公告時點為交易媒合期間開始前3個工作日。',locator:'114.10第5版第四章第25條第3款：交易媒合期間開始前3個工作日通知需求量及供給量'},
    {id:'V3U9-013',topic:'交易媒合結果通知',question:'依第5版，交易媒合期間結束後，電力交易單位最遲應於多久內通知交易媒合結果？',correct:'3個工作日內',distractors:['當日立即','10日內','30日內'],explanation:'交易媒合結果應於交易媒合期間結束後3個工作日內通知。',locator:'114.10第5版第四章第25條第4款：交易媒合期間結束後3個工作日內通知媒合結果'},
    {id:'V3U9-014',topic:'締約資訊回報',question:'買賣方依媒合結果完成締約後，最遲應於交易媒合期間終止日後多久內向電力交易單位回報締約相關資訊？',correct:'10日內',distractors:['3個工作日內','20日內','30日內'],explanation:'買賣方完成締約後，至遲應於交易媒合期間終止日後10日內回報締約相關資訊。',locator:'114.10第5版第四章第25條第5款：交易媒合期間終止日後10日內回報締約相關資訊'},
    {id:'V3U9-015',topic:'成交紀錄公布',question:'電力交易單位彙整成交紀錄後，依第5版最遲應於交易媒合期間終止日後多久內公布？',correct:'30日內',distractors:['3個工作日內','10日內','60日內'],explanation:'成交紀錄由電力交易單位於交易媒合期間終止日後30日內彙整公布；不要與買賣方10日內回報締約資訊混淆。',locator:'114.10第5版第四章第25條第5款：交易媒合期間終止日後30日內彙整公布成交紀錄'}
  ];
  deadlineCases.forEach(c => {
    const q = byId.get(c.id); if (!q) return;
    q.topic = `第9單元｜${c.topic}`; q.level = '3情境'; q.question = c.question;
    q.option_a = c.correct; q.option_b = c.distractors[0]; q.option_c = c.distractors[1]; q.option_d = c.distractors[2]; q.answer = 'A';
    q.explanation = c.explanation; q.source_locator = c.locator;
    q.tags = `單元09;易混淆;備用容量;期限;工作日;${c.topic};115期限修正;已核對`;
  });

  const coreRule = byId.get('V09-001');
  if (coreRule) {
    coreRule.topic = '第9單元｜備用容量參與門檻與基本單位';
    coreRule.question = '依114.10第5版，備用容量市場交易資源的參與容量門檻與交易基本單位，下列何者正確？';
    coreRule.option_a = '參與容量須達10kW（含）以上，交易基本單位為1kW'; coreRule.option_b = '參與容量須達10kW（含）以上，交易基本單位為10kW'; coreRule.option_c = '參與容量至少1MW，交易基本單位100kW'; coreRule.option_d = '沒有最低參與容量'; coreRule.answer = 'A';
    coreRule.explanation = '第5版第二十四條規定：交易資源參與容量須達10kW（含）以上，基本單位為kW（1kW）。因此10kW是最低參與門檻，不是交易粒度。'; coreRule.source_locator = '114.10第5版第四章第二十四條：參與容量須達10kW（含）以上；基本單位為kW'; coreRule.tags = '單元09;已核對;最低10kW;基本單位1kW;115版本修正';
  }

  const confusionCapacity = byId.get('C9-002');
  if (confusionCapacity) {
    confusionCapacity.topic = '第9單元｜最低10kW與1kW基本單位'; confusionCapacity.question = '某備用容量交易資源可提供17kW。依114.10第5版，下列判斷何者正確？';
    confusionCapacity.option_a = '不能參與，因為17kW不是10kW的整數倍'; confusionCapacity.option_b = '可以參與；已達10kW最低門檻，且交易基本單位為1kW'; confusionCapacity.option_c = '不能參與，因為最低門檻為100kW'; confusionCapacity.option_d = '可以參與，但必須先進位成20kW'; confusionCapacity.answer = 'B';
    confusionCapacity.explanation = '第5版規則同時規定最低參與容量為10kW、交易基本單位為1kW；17kW已達門檻，因此可直接以17kW參與，不必湊成10kW倍數。'; confusionCapacity.source_locator = '114.10第5版第四章第二十四條：交易資源參與容量須達10kW（含）以上；基本單位為kW（1kW）'; confusionCapacity.tags = '單元09;易混淆;最低10kW;基本單位1kW;115版本修正;已核對';
  }

  const confusionSchedule = byId.get('C9-003');
  if (confusionSchedule) {
    confusionSchedule.question = '備用容量市場當次媒合起始日後，賣方設定標售資訊、標售資訊審查、買方競價的工作日時段依序為何？'; confusionSchedule.option_a = '第1～3個工作日／第4～5個工作日／第6～10個工作日'; confusionSchedule.option_b = '第1個工作日／第2～8個工作日／第9～10個工作日'; confusionSchedule.option_c = '第1～5個工作日／第6個工作日／第7個工作日'; confusionSchedule.option_d = '沒有固定順序'; confusionSchedule.answer = 'A';
    confusionSchedule.explanation = '第5版第二十五條的當次媒合時間表以工作日計：第1～3個工作日設定、第4～5個工作日審查、第6～10個工作日競價。'; confusionSchedule.source_locator = '114.10第5版第四章第二十五條：當次交易媒合操作具體時間表（工作日）'; confusionSchedule.tags = '單元09;易混淆;媒合時程;工作日;115工作日修正;已核對';
  }

  const hvCapacity = byId.get('HV09-004');
  if (hvCapacity) {
    hvCapacity.topic = '第9單元｜備用容量參與門檻與基本單位'; hvCapacity.question = '某賣方想以25kW資源參與備用容量市場。依114.10第5版交易容量規則，何者正確？';
    hvCapacity.option_a = '可直接以25kW參與；已達10kW最低門檻，且交易基本單位為1kW'; hvCapacity.option_b = '只能以20kW參與，因為必須向下取10kW倍數'; hvCapacity.option_c = '必須進位成30kW才能參與'; hvCapacity.option_d = '至少要1MW才可參與'; hvCapacity.answer = 'A';
    hvCapacity.explanation = '第5版第二十四條規定參與容量須達10kW（含）以上，基本單位為1kW；25kW已達門檻，可直接以25kW參與。'; hvCapacity.source_locator = '114.10第5版第四章第二十四條：參與容量須達10kW（含）以上；基本單位為kW（1kW）'; hvCapacity.tags = '單元09;已核對;高鑑別;最低10kW;基本單位1kW;115版本修正';
  }
})();
