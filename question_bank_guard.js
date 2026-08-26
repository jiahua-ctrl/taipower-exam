(() => {
  function unitOf(q){
    const m = String(q.tags || "").match(/單元(\d{2})/);
    return m ? m[1] : "??";
  }

  function apply115Corrections(list){
    const fixes = {
      'V3U6-026': {
        question:'E-dReg頻率掃描速率每秒0.02Hz。若由60.00Hz向上掃描30秒，理論終點頻率為何？',
        correct:'60.60Hz', distractors:['60.30Hz','60.40Hz','61.20Hz'],
        explanation:'0.02×30＝0.60Hz；60.00＋0.60＝60.60Hz，仍在E-dReg教材掃描範圍59.40～60.60Hz內。',
        locator:'E-dReg頻率掃描測試：59.40～60.60Hz、每秒0.02Hz'
      },
      'V3U6-027': {
        question:'dReg頻率掃描速率每秒0.01Hz。若由60.00Hz向下掃描30秒，理論終點頻率為何？',
        correct:'59.70Hz', distractors:['59.40Hz','59.60Hz','60.30Hz'],
        explanation:'0.01×30＝0.30Hz；60.00−0.30＝59.70Hz，為dReg教材掃描範圍下限。',
        locator:'dReg頻率掃描測試：59.70～60.30Hz、每秒0.01Hz'
      },
      'V3U6-028': {
        question:'E-dReg由60.60Hz以每秒0.02Hz向下掃描60秒，理論終點頻率為何？',
        correct:'59.40Hz', distractors:['59.60Hz','60.00Hz','58.80Hz'],
        explanation:'0.02×60＝1.20Hz；60.60−1.20＝59.40Hz，正好涵蓋E-dReg教材完整掃描範圍。',
        locator:'E-dReg頻率掃描測試：59.40～60.60Hz、每秒0.02Hz'
      },
      'V3U6-029': {
        question:'dReg由59.70Hz以每秒0.01Hz向上掃描60秒，理論終點頻率為何？',
        correct:'60.30Hz', distractors:['60.00Hz','60.60Hz','59.10Hz'],
        explanation:'0.01×60＝0.60Hz；59.70＋0.60＝60.30Hz，正好涵蓋dReg教材完整掃描範圍。',
        locator:'dReg頻率掃描測試：59.70～60.30Hz、每秒0.01Hz'
      },
      'V3U6-030': {
        question:'E-dReg掃描範圍59.40～60.60Hz，dReg為59.70～60.30Hz。E-dReg完整掃描頻率跨度是dReg的幾倍？',
        correct:'2倍', distractors:['0.5倍','1倍','4倍'],
        explanation:'E-dReg跨度＝60.60−59.40＝1.20Hz；dReg跨度＝60.30−59.70＝0.60Hz；1.20÷0.60＝2倍。',
        locator:'dReg與E-dReg頻率掃描測試範圍'
      }
    };

    for(let i=0;i<10;i++){
      const id = `V3U8-${String(71+i).padStart(3,'0')}`;
      const charge = 1000 + i*200;
      const dis = 700 + i*120;
      const loss = 0.02;
      const net = charge/(1-loss) - dis*(1-loss);
      const allow = charge/(1-loss)*0.20;
      const excess = net - allow;
      fixes[id] = {
        topic:'第8單元｜電能損失費新版公式',
        question:`情境${i+71}：月充電${charge}kWh、放電${dis}kWh、線損率2%。依115年現行月結算公式，先求淨計量，再扣除效率額度；超過效率額度的差額約多少kWh？`,
        correct:`${excess.toFixed(2)}kWh`,
        distractors:[`${net.toFixed(2)}kWh`,`${allow.toFixed(2)}kWh`,`${(charge-dis).toFixed(2)}kWh`],
        explanation:`新版淨計量＝${charge}÷0.98−${dis}×0.98＝${net.toFixed(2)}kWh；效率額度＝${charge}÷0.98×20%＝${allow.toFixed(2)}kWh；差額＝${net.toFixed(2)}−${allow.toFixed(2)}＝${excess.toFixed(2)}kWh。`,
        locator:'公告事項4-4 v07-1：淨計量=總充電÷(1−線損率)−總放電×(1−線損率)；效率額度=總充電÷(1−線損率)×20%',
        tags:'單元08;計算;電能損失費;效率額度;線損率;重整V3;115修正;已核對'
      };
    }

    list.forEach(q => {
      const f = fixes[String(q?.id || '')];
      if(!f) return;
      q.topic = f.topic || '第6單元｜頻率掃描範圍';
      q.level = '3情境計算';
      q.question = f.question;
      q.option_a = f.correct;
      q.option_b = f.distractors[0];
      q.option_c = f.distractors[1];
      q.option_d = f.distractors[2];
      q.answer = 'A';
      q.explanation = f.explanation;
      q.source_locator = f.locator;
      q.tags = f.tags || '單元06;計算;頻率掃描;範圍;重整V3;115修正;已核對';
    });
  }

  function balanceAnswerPositions(list){
    const letters = ["A","B","C","D"];
    list.forEach((q, index) => {
      const currentAnswer = String(q.answer || "").toUpperCase();
      const currentIndex = letters.indexOf(currentAnswer);
      if(currentIndex < 0) return;

      const options = [q.option_a,q.option_b,q.option_c,q.option_d].map(v => String(v));
      const correct = options[currentIndex];
      const distractors = options.filter((_, i) => i !== currentIndex);
      const targetIndex = index % 4;
      const arranged = distractors.slice();
      arranged.splice(targetIndex, 0, correct);

      q.option_a = arranged[0];
      q.option_b = arranged[1];
      q.option_c = arranged[2];
      q.option_d = arranged[3];
      q.answer = letters[targetIndex];
    });
  }

  window.auditVerifiedQuestionBank = function(input){
    const list = Array.isArray(input) ? input : [];
    apply115Corrections(list);

    const seen = new Set();
    const seenQuestion = new Set();
    const valid = [];
    const duplicates = [];
    const duplicateQuestions = [];
    const invalid = [];
    const invalidOptions = [];
    const byUnit = {};
    const byAnswer = {A:0,B:0,C:0,D:0};
    const byLevel = {};

    for(const q of list){
      const answer = String(q?.answer || "").toUpperCase();
      const tags = String(q?.tags || "");
      const questionText = String(q?.question || "").trim();
      const options = [q?.option_a,q?.option_b,q?.option_c,q?.option_d].map(v => String(v ?? "").trim());
      const requiredText = [q?.id,q?.subject,q?.topic,q?.level,q?.question,...options,q?.explanation,q?.source_title,q?.source_locator];
      const legacyConfusionVerified = /^C\d+-\d+$/.test(String(q?.id || ""))
        && tags.includes("易混淆")
        && String(q?.source_title || "").trim().length > 0
        && String(q?.source_locator || "").trim().length > 0;
      const verified = tags.includes("已核對") || legacyConfusionVerified;
      const optionsOk = options.every(Boolean)
        && new Set(options).size === 4
        && !options.some(v => /其他值|placeholder/i.test(v));
      const ok = requiredText.every(v => String(v ?? "").trim().length > 0)
        && ["A","B","C","D"].includes(answer)
        && verified
        && optionsOk;

      if(!optionsOk){ invalidOptions.push(q?.id || "(無題號)"); }
      if(!ok){ invalid.push(q?.id || "(無題號)"); continue; }
      if(seen.has(q.id)){ duplicates.push(q.id); continue; }
      if(seenQuestion.has(questionText)){ duplicateQuestions.push(q.id); continue; }
      seen.add(q.id);
      seenQuestion.add(questionText);
      q.answer = answer;
      if(legacyConfusionVerified && !tags.includes("已核對")){
        q.tags = `${tags}${tags ? ";" : ""}已核對`;
      }
      valid.push(q);
      const unit = unitOf(q);
      byUnit[unit] = (byUnit[unit] || 0) + 1;
      const level = String(q.level).charAt(0) || "?";
      byLevel[level] = (byLevel[level] || 0) + 1;
    }

    balanceAnswerPositions(valid);
    valid.forEach(q => { byAnswer[String(q.answer).toUpperCase()]++; });

    const report = {total:valid.length, duplicates, duplicateQuestions, invalid, invalidOptions, byUnit, byAnswer, byLevel};
    window.QUESTION_BANK_AUDIT = report;
    if(duplicates.length || duplicateQuestions.length || invalid.length || invalidOptions.length){
      console.warn("題庫守門檢查排除異常題目", report);
    } else {
      console.info("題庫守門檢查通過", report);
    }
    return valid;
  };
})();
