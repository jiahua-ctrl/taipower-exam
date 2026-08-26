const fs = require('fs');
const vm = require('vm');
const path = require('path');

global.window = global;
window.LOCAL_QUESTIONS = [];

const root = path.resolve(__dirname, '..');
const files = [
  'questions_verified_core_v1.js',
  'questions_confusion_v3.js',
  'questions_verified_high_discrimination_v1.js',
  'questions_verified_high_discrimination_v2.js',
  'questions_verified_high_discrimination_v3.js',
  'questions_verified_high_discrimination_v4.js',
  'questions_verified_high_discrimination_v5.js',
  'questions_advanced_v2_500.js',
  'questions_advanced_v3_quality_patch.js',
  'question_bank_guard.js'
];

for (const file of files) {
  const code = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInThisContext(code, { filename: file });
}

if (typeof window.auditVerifiedQuestionBank !== 'function') {
  throw new Error('auditVerifiedQuestionBank 未載入');
}

const audited = window.auditVerifiedQuestionBank(window.LOCAL_QUESTIONS);
const report = window.QUESTION_BANK_AUDIT || {};
const advanced = audited.filter(q => /^V[23]U[46789]-\d{3}$/.test(String(q.id || '')));
const v3 = advanced.filter(q => /^V3U/.test(q.id));
const v2 = advanced.filter(q => /^V2U/.test(q.id));
const calc = advanced.filter(q => String(q.tags || '').includes('計算'));
const byAdvancedUnit = advanced.reduce((m,q) => {
  const x = String(q.tags || '').match(/單元(\d{2})/);
  const u = x ? x[1] : '??';
  m[u] = (m[u] || 0) + 1;
  return m;
}, {});
const placeholders = audited.filter(q => [q.option_a,q.option_b,q.option_c,q.option_d].some(x => /其他值|placeholder/i.test(String(x))));
const duplicateOptionQuestions = audited.filter(q => new Set([q.option_a,q.option_b,q.option_c,q.option_d].map(String)).size !== 4);
const badAnswers = audited.filter(q => !['A','B','C','D'].includes(String(q.answer || '').toUpperCase()));
const expectedAnswerDistribution = {A:200,B:200,C:200,D:200};

const checks = [
  ['正式題庫總數=800', audited.length === 800, audited.length],
  ['進階題=500', advanced.length === 500, advanced.length],
  ['V2保留=300', v2.length === 300, v2.length],
  ['V3新題=200', v3.length === 200, v3.length],
  ['無placeholder選項', placeholders.length === 0, placeholders.map(q=>q.id)],
  ['每題四選項唯一', duplicateOptionQuestions.length === 0, duplicateOptionQuestions.map(q=>q.id)],
  ['答案格式合法', badAnswers.length === 0, badAnswers.map(q=>q.id)],
  ['800題答案A/B/C/D各200', JSON.stringify(report.byAnswer) === JSON.stringify(expectedAnswerDistribution), report.byAnswer],
  ['守門無重複ID', (report.duplicates || []).length === 0, report.duplicates || []],
  ['守門無重複題幹', (report.duplicateQuestions || []).length === 0, report.duplicateQuestions || []],
  ['守門無無效選項', (report.invalidOptions || []).length === 0, report.invalidOptions || []],
  ['進階單元分布符合V3', JSON.stringify(byAdvancedUnit) === JSON.stringify({'04':40,'06':90,'07':160,'08':170,'09':40}), byAdvancedUnit]
];

console.log('\n=== 台電爸爸版題庫 V3 自動稽核 ===');
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`, ok ? '' : detail);
}
console.log('進階題計算標籤：', `${calc.length}/500`);
console.log('全題答案分布：', report.byAnswer);
console.log('全題單元分布：', report.byUnit);

const failed = checks.filter(x => !x[1]);
if (failed.length) {
  console.error(`\n稽核失敗：${failed.length}項`);
  process.exit(1);
}
console.log('\n稽核通過。');
