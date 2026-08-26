const fs = require('fs');
const vm = require('vm');
const path = require('path');

global.window = global;
window.LOCAL_QUESTIONS = [];
const root = path.resolve(__dirname, '..');
const files = [
  'questions_verified_core_v1.js','questions_confusion_v3.js',
  'questions_verified_high_discrimination_v1.js','questions_verified_high_discrimination_v2.js',
  'questions_verified_high_discrimination_v3.js','questions_verified_high_discrimination_v4.js','questions_verified_high_discrimination_v5.js',
  'questions_advanced_v2_500.js','questions_advanced_v3_quality_patch.js','questions_advanced_v4_edreg_patch.js',
  'questions_advanced_v5_precision_patch.js','questions_advanced_v6_sbspm_semantics_patch.js','questions_advanced_v7_rounding_patch.js',
  'question_bank_guard.js'
];
for (const file of files) vm.runInThisContext(fs.readFileSync(path.join(root,file),'utf8'), {filename:file});
const audited = window.auditVerifiedQuestionBank(window.LOCAL_QUESTIONS);
const byId = new Map(audited.map(q => [q.id,q]));
const correct = q => q && q[`option_${String(q.answer).toLowerCase()}`];
const expected = {
  'V3U9-011':'交易媒合期間開始日前10日至交易媒合期間結束',
  'V3U9-012':'3個工作日',
  'V3U9-013':'3個工作日內',
  'V3U9-014':'10日內',
  'V3U9-015':'30日內'
};
let failed = 0;
console.log('\n=== 第9單元五項期限驗收 ===');
for (const [id,answer] of Object.entries(expected)) {
  const q = byId.get(id);
  const ok = !!q && String(q.tags||'').includes('115期限修正') && correct(q) === answer;
  console.log(`${ok?'PASS':'FAIL'}  ${id}  ${q ? correct(q) : '題目不存在'}`);
  if (!ok) failed++;
}
const info = byId.get('V3U9-011');
const semanticsOk = info && /不得變更/.test(info.explanation) && /個案審查許可/.test(info.explanation);
console.log(`${semanticsOk?'PASS':'FAIL'}  資訊閉鎖期間原則不得變更，個案許可例外`);
if (!semanticsOk) failed++;
if (failed) process.exit(1);
console.log('第9單元期限驗收通過。');
