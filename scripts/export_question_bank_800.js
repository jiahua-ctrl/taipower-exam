const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
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

global.window = global;
window.LOCAL_QUESTIONS = [];

for (const file of files) {
  const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
  vm.runInThisContext(code, { filename: file });
}

if (typeof window.auditVerifiedQuestionBank !== 'function') {
  throw new Error('找不到題庫守門函式 auditVerifiedQuestionBank');
}

window.LOCAL_QUESTIONS = window.auditVerifiedQuestionBank(window.LOCAL_QUESTIONS);
const questions = window.LOCAL_QUESTIONS;
if (!Array.isArray(questions)) throw new Error('題庫不是陣列');
if (questions.length !== 800) {
  const audit = window.QUESTION_BANK_AUDIT || {};
  throw new Error(`正式題庫應為800題，實際${questions.length}題；audit=${JSON.stringify(audit)}`);
}

const byUnit = {};
const byLevel = {};
const byAnswer = { A: 0, B: 0, C: 0, D: 0 };
for (const q of questions) {
  const m = String(q.tags || '').match(/單元(\d{2})/);
  const unit = m ? m[1] : '??';
  byUnit[unit] = (byUnit[unit] || 0) + 1;
  const level = String(q.level || '').charAt(0) || '?';
  byLevel[level] = (byLevel[level] || 0) + 1;
  const a = String(q.answer || '').toUpperCase();
  if (byAnswer[a] !== undefined) byAnswer[a]++;
}

const dist = path.join(ROOT, 'dist');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'question_bank_800.json'), JSON.stringify(questions, null, 2), 'utf8');
fs.writeFileSync(path.join(dist, 'question_bank_800_audit.json'), JSON.stringify({ total: questions.length, byUnit, byLevel, byAnswer, audit: window.QUESTION_BANK_AUDIT }, null, 2), 'utf8');

console.log('Exported verified question bank:', questions.length);
console.log('By unit:', byUnit);
console.log('By level:', byLevel);
console.log('By answer:', byAnswer);
