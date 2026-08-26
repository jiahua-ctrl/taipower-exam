(() => {
  function unitOf(q){
    const m = String(q.tags || "").match(/單元(\d{2})/);
    return m ? m[1] : "??";
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

    // 通過品質檢查後才重新排列選項。800題時可精確平衡為A/B/C/D各200題，
    // 避免長期刷題產生「猜某一位置」的作答偏誤；正確內容本身不變。
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
