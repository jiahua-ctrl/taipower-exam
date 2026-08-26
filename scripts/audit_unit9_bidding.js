const fs = require('fs');
const vm = require('vm');
const path = require('path');

global.window = global;
window.LOCAL_QUESTIONS = [];
const root = path.resolve(__dirname, '..');
const files = [
  'questions_verified_core_v1.js','questions_confusion_v3.js',
  'questions_verified_high_discrimination_v1.js','questions_verified_high_discrimination_v2.js','questions_verified_high_discrimination_v3.js','questions_verified_high_discrimination_v4.js','questions_verified_high_discrimination_v5.js',
  'questions_advanced_v2_500.js','questions_advanced_v3_quality_patch.js','questions_advanced_v4_edreg_patch.js','questions_advanced_v5_precision_patch.js','questions_advanced_v6_sbspm_semantics_patch.js','questions_advanced_v7_rounding_patch.js','question_bank_guard.js'
];
for (const file of files) vm.runInThisContext(fs.readFileSync(path.join(root,file),'utf8'), {filename:file});
const audited = window.auditVerifiedQuestionBank(window.LOCAL_QUESTIONS);
const byId = new Map(audited.map(q => [q.id,q]));
const correct = q => q && q[`option_${String(q.answer).toLowerCase()}`];
const checks = [
  ['V3U9-007 出價必須高於底價', q => correct(q)==='1,500,000元/MW·年' && /高於/.test(q.explanation)],
  ['V3U9-008 同價依完成出價時間', q => /乙/.test(correct(q)||'') && /09:05/.test(q.explanation) && /09:10/.test(q.explanation)],
  ['V3U9-009 高價優先＋同價時間＋部分得標', q => correct(q)==='10kW' && /40kW/.test(q.explanation) && /30kW/.test(q.explanation) && /10kW/.test(q.explanation)],
  ['V3U9-010 買方不得超額購買', q => correct(q)==='2.8MW' && /5\.0−2\.2＝2\.8MW/.test(q.explanation)],
  ['C9-004 現有競價順序題仍正確', q => /高價者優先/.test(correct(q)||'') && /完成出價時間/.test(correct(q)||'')]
];
console.log('\n=== 第9單元競價／容量分配驗收 ===');
let failed=0;
for (const [name,fn] of checks) {
  const id = name.split(' ')[0];
  const q = byId.get(id);
  const ok = !!q && fn(q);
  console.log(`${ok?'PASS':'FAIL'}  ${name}${q ? `｜正解：${correct(q)}` : '｜題目不存在'}`);
  if(!ok) failed++;
}
if(failed) process.exit(1);
console.log('第9單元競價／容量分配驗收通過。');
