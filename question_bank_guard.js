(() => {
  function unitOf(q){
    const m = String(q.tags || "").match(/單元(\d{2})/);
    return m ? m[1] : "??";
  }

  window.auditVerifiedQuestionBank = function(input){
    const list = Array.isArray(input) ? input : [];
    const seen = new Set();
    const valid = [];
    const duplicates = [];
    const invalid = [];
    const byUnit = {};
    const byAnswer = {A:0,B:0,C:0,D:0};
    const byLevel = {};

    for(const q of list){
      const answer = String(q?.answer || "").toUpperCase();
      const requiredText = [q?.id,q?.subject,q?.topic,q?.level,q?.question,q?.option_a,q?.option_b,q?.option_c,q?.option_d,q?.explanation,q?.source_title,q?.source_locator];
      const ok = requiredText.every(v => String(v ?? "").trim().length > 0)
        && ["A","B","C","D"].includes(answer)
        && String(q?.tags || "").includes("已核對");

      if(!ok){ invalid.push(q?.id || "(無題號)"); continue; }
      if(seen.has(q.id)){ duplicates.push(q.id); continue; }
      seen.add(q.id);
      q.answer = answer;
      valid.push(q);
      const unit = unitOf(q);
      byUnit[unit] = (byUnit[unit] || 0) + 1;
      byAnswer[answer]++;
      const level = String(q.level).charAt(0) || "?";
      byLevel[level] = (byLevel[level] || 0) + 1;
    }

    const report = {total:valid.length, duplicates, invalid, byUnit, byAnswer, byLevel};
    window.QUESTION_BANK_AUDIT = report;
    if(duplicates.length || invalid.length){
      console.warn("題庫守門檢查排除異常題目", report);
    } else {
      console.info("題庫守門檢查通過", report);
    }
    return valid;
  };
})();
