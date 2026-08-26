(() => {
  const qs = Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : [];
  const byId = new Map(qs.map(q => [String(q.id || ''), q]));

  const fixes = {
    'V2U7-007': {
      question:'依公告事項4-4 v06-1之精度修正，dReg「輸出入功率百分比對應操作曲線範圍上下界」的相關中間計算，應四捨五入計算至何種精度？',
      correct:'小數點後第4位',
      distractors:['整數位','小數點後第1位','小數點後第2位'],
      explanation:'新版結算文件將彈性調整區間斜率相關百分比及輸出功率百分比等操作曲線範圍上下界計算精度，統一提高至小數點後第4位。這是操作曲線範圍的精度規則，不等同於最後SBSPM每秒執行率的取位規則。',
      locator:'公告事項4-4 v06-1：dReg輸出入功率百分比對應操作曲線範圍上下界精度調整至小數點後第4位'
    },
    'V2U7-014': {
      question:'新版dReg操作曲線範圍計算中，若某一下界未取位前為31.66666%，依小數點後第4位四捨五入，應採何值？',
      correct:'31.6667%',
      distractors:['31.6666%','32%','31.67%'],
      explanation:'保留小數點後4位時，看第5位數字；31.66666%的第5位為6，因此第4位進位，得到31.6667%。不可沿用舊式整數化直接寫成32%。',
      locator:'公告事項4-4 v06-1：操作曲線範圍上下界相關百分比計算精度採小數點後第4位'
    },
    'V2U7-021': {
      question:'關於新版dReg服務品質計算的「操作曲線精度」與「SBSPM每秒執行率取位」，下列何者正確？',
      correct:'操作曲線範圍相關中間值採小數點後4位；SBSPM每秒執行率最後仍四捨五入至整數位',
      distractors:[
        '操作曲線範圍與SBSPM每秒執行率都只計到整數位',
        '操作曲線範圍與SBSPM每秒執行率都固定保留小數點後4位',
        '操作曲線範圍只保留小數點後2位；SBSPM每秒執行率無須取位'
      ],
      explanation:'兩個取位層次不同。公告事項4-4 v06-1提高操作曲線範圍相關計算至小數點後4位；商品技術規格對每秒執行率則仍說明依SBSPM計算並四捨五入至整數位。',
      locator:'公告事項4-4 v06-1（操作曲線精度）＋管理規範附件六（SBSPM每秒執行率四捨五入至整數位）'
    }
  };

  Object.entries(fixes).forEach(([id,f]) => {
    const q = byId.get(id);
    if (!q) return;
    q.topic = '第7單元｜dReg計算精度辨識';
    q.level = id === 'V2U7-021' ? '2理解辨識' : '3情境計算';
    q.question = f.question;
    q.option_a = f.correct;
    q.option_b = f.distractors[0];
    q.option_c = f.distractors[1];
    q.option_d = f.distractors[2];
    q.answer = 'A';
    q.explanation = f.explanation;
    q.source_locator = f.locator;
    q.tags = '單元07;dReg;SBSPM;操作曲線;精度;小數點後4位;整數位;115精度修正;易混淆;已核對';
  });
})();
