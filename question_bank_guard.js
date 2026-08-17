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
      const tags = String(q?.tags || "");
      const requiredText = [q?.id,q?.subject,q?.topic,q?.level,q?.question,q?.option_a,q?.option_b,q?.option_c,q?.option_d,q?.explanation,q?.source_title,q?.source_locator];
      const legacyConfusionVerified = /^C\d+-\d+$/.test(String(q?.id || ""))
        && tags.includes("易混淆")
        && String(q?.source_title || "").trim().length > 0
        && String(q?.source_locator || "").trim().length > 0;
      const verified = tags.includes("已核對") || legacyConfusionVerified;
      const ok = requiredText.every(v => String(v ?? "").trim().length > 0)
        && ["A","B","C","D"].includes(answer)
        && verified;

      if(!ok){ invalid.push(q?.id || "(無題號)"); continue; }
      if(seen.has(q.id)){ duplicates.push(q.id); continue; }
      seen.add(q.id);
      q.answer = answer;
      if(legacyConfusionVerified && !tags.includes("已核對")){
        q.tags = `${tags}${tags ? ";" : ""}已核對`;
      }
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
