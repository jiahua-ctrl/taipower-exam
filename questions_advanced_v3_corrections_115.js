(() => {
  const qs = Array.isArray(window.LOCAL_QUESTIONS) ? window.LOCAL_QUESTIONS : [];
  const fixes = {
    'V3U6-026': {
      question:'E-dReg頻率掃描速率每秒0.02Hz。若由60.00Hz向上掃描30秒，理論終點頻率為何？',
      correct:'60.60Hz',
      distractors:['60.30Hz','60.40Hz','61.20Hz'],
      explanation:'0.02×30＝0.60Hz；60.00＋0.60＝60.60Hz，仍在E-dReg教材掃描範圍59.40～60.60Hz內。',
      locator:'E-dReg頻率掃描測試：59.40～60.60Hz、每秒0.02Hz'
    },
    'V3U6-027': {
      question:'dReg頻率掃描速率每秒0.01Hz。若由60.00Hz向下掃描30秒，理論終點頻率為何？',
      correct:'59.70Hz',
      distractors:['59.40Hz','59.60Hz','60.30Hz'],
      explanation:'0.01×30＝0.30Hz；60.00−0.30＝59.70Hz，為dReg教材掃描範圍下限。',
      locator:'dReg頻率掃描測試：59.70～60.30Hz、每秒0.01Hz'
    },
    'V3U6-028': {
      question:'E-dReg由60.60Hz以每秒0.02Hz向下掃描60秒，理論終點頻率為何？',
      correct:'59.40Hz',
      distractors:['59.60Hz','60.00Hz','58.80Hz'],
      explanation:'0.02×60＝1.20Hz；60.60−1.20＝59.40Hz，正好涵蓋E-dReg教材完整掃描範圍。',
      locator:'E-dReg頻率掃描測試：59.40～60.60Hz、每秒0.02Hz'
    },
    'V3U6-029': {
      question:'dReg由59.70Hz以每秒0.01Hz向上掃描60秒，理論終點頻率為何？',
      correct:'60.30Hz',
      distractors:['60.00Hz','60.60Hz','59.10Hz'],
      explanation:'0.01×60＝0.60Hz；59.70＋0.60＝60.30Hz，正好涵蓋dReg教材完整掃描範圍。',
      locator:'dReg頻率掃描測試：59.70～60.30Hz、每秒0.01Hz'
    },
    'V3U6-030': {
      question:'E-dReg掃描範圍59.40～60.60Hz，dReg為59.70～60.30Hz。E-dReg完整掃描頻率跨度是dReg的幾倍？',
      correct:'2倍',
      distractors:['0.5倍','1倍','4倍'],
      explanation:'E-dReg跨度＝60.60−59.40＝1.20Hz；dReg跨度＝60.30−59.70＝0.60Hz；1.20÷0.60＝2倍。',
      locator:'dReg與E-dReg頻率掃描測試範圍'
    }
  };
  const letters = ['A','B','C','D'];
  qs.forEach(q => {
    const f = fixes[String(q.id || '')];
    if(!f) return;
    q.topic = '第6單元｜頻率掃描範圍';
    q.level = '3情境計算';
    q.question = f.question;
    q.option_a = f.correct;
    q.option_b = f.distractors[0];
    q.option_c = f.distractors[1];
    q.option_d = f.distractors[2];
    q.answer = letters[0];
    q.explanation = f.explanation;
    q.source_locator = f.locator;
    q.tags = '單元06;計算;頻率掃描;範圍;重整V3;115修正;已核對';
  });
})();
