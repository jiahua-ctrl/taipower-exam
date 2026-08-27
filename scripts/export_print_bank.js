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
  'questions_advanced_v4_edreg_patch.js',
  'questions_advanced_v5_precision_patch.js',
  'questions_advanced_v6_sbspm_semantics_patch.js',
  'questions_advanced_v7_rounding_patch.js',
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
if (audited.length !== 800) throw new Error(`正式題庫應為800題，實際${audited.length}題`);

function unitOf(q) {
  const tag = String(q.tags || '').match(/單元(\d{2})/);
  if (tag) return Number(tag[1]);
  const topic = String(q.topic || '').match(/第\s*(\d+)\s*單元/);
  if (topic) return Number(topic[1]);
  return 99;
}

const ordered = [];
let n = 0;
for (let u = 1; u <= 10; u++) {
  for (const q of audited.filter(x => unitOf(x) === u)) {
    ordered.push({ ...q, print_no: ++n, print_unit: u });
  }
}
if (ordered.length !== 800) throw new Error(`分單元後應為800題，實際${ordered.length}題`);

const byUnit = ordered.reduce((m, q) => {
  m[q.print_unit] = (m[q.print_unit] || 0) + 1;
  return m;
}, {});

const payload = {
  title: '台電電力交易平台資格測驗｜爸爸版800題',
  generated_from: '正式網站題庫（通過 question_bank_guard）',
  total: ordered.length,
  by_unit: byUnit,
  questions: ordered
};

const out = path.join(root, 'print_question_bank_800.json');
fs.writeFileSync(out, JSON.stringify(payload, null, 2), 'utf8');
console.log(`已匯出 ${ordered.length} 題 -> ${out}`);
console.log('單元分布', byUnit);
