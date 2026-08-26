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
const correctText = q => q?.[`option_${String(q?.answer || '').toLowerCase()}`];

const scanFixIds = ['V3U6-026','V3U6-027','V3U6-028','V3U6-029','V3U6-030'];
const scanFixes = audited.filter(q => scanFixIds.includes(String(q.id)));
const scanFixesOk = scanFixes.length === 5
  && scanFixes.every(q => String(q.tags || '').includes('115修正'))
  && scanFixes.every(q => /59\.40|59\.70|60\.30|60\.60/.test(`${q.question} ${q.explanation} ${q.source_locator}`));

const lossFixIds = Array.from({length:10}, (_,i) => `V3U8-${String(71+i).padStart(3,'0')}`);
const lossFixes = audited.filter(q => lossFixIds.includes(String(q.id)));
const lossFixesOk = lossFixes.length === 10
  && lossFixes.every(q => String(q.tags || '').includes('115修正'))
  && lossFixes.every(q => /效率額度/.test(`${q.question} ${q.explanation}`))
  && lossFixes.every(q => /÷0\.98×20%/.test(String(q.explanation || '')))
  && lossFixes.every(q => /總充電÷\(1−線損率\)×20%/.test(String(q.source_locator || '')));

const edregIntervalFixes = audited.filter(q => /^V2U8-\d{3}$/.test(String(q.id || '')) && String(q.tags || '').includes('115語意修正'));
const edregIntervalFixesOk = edregIntervalFixes.length === 26
  && edregIntervalFixes.every(q => /15分鐘區間/.test(`${q.question} ${q.source_locator} ${q.tags}`));

const edregFullIds = ['V2U8-057','V2U8-064','V2U8-071','V2U8-078','V2U8-085'];
const edregFull = audited.filter(q => edregFullIds.includes(String(q.id || '')));
const edregFullOk = edregFull.length === 5
  && edregFull.every(q => String(q.tags || '').includes('完整結算'))
  && edregFull.every(q => /效能價475/.test(String(q.question || '')))
  && edregFull.every(q => /4個15分鐘區間/.test(`${q.question} ${q.source_locator}`))
  && edregFull.every(q => /電能損失費/.test(`${q.question} ${q.explanation} ${q.source_locator}`));

const precisionIds = ['V2U7-007','V2U7-014','V2U7-021'];
const precisionFixes = audited.filter(q => precisionIds.includes(String(q.id || '')));
const precisionFixesOk = precisionFixes.length === 3
  && precisionFixes.every(q => String(q.tags || '').includes('115精度修正'))
  && precisionFixes.every(q => /小數點後4位|小數點後第4位/.test(`${q.question} ${q.explanation} ${q.source_locator}`))
  && precisionFixes.some(q => /整數位/.test(`${q.question} ${q.explanation} ${q.source_locator}`))
  && precisionFixes.some(q => /31\.6667%/.test(`${q.question} ${q.explanation} ${q.option_a} ${q.option_b} ${q.option_c} ${q.option_d}`));

const sbspmSemanticIds = [
  ...Array.from({length:30}, (_,i) => `V3U7-${String(i+1).padStart(3,'0')}`),
  ...Array.from({length:15}, (_,i) => `V3U7-${String(46+i).padStart(3,'0')}`)
];
const sbspmSemanticFixes = audited.filter(q => sbspmSemanticIds.includes(String(q.id || '')));
const sbspmMixedIds = Array.from({length:5}, (_,i) => `V3U7-${String(26+i).padStart(3,'0')}`);
const sbspmPowerIds = Array.from({length:15}, (_,i) => `V3U7-${String(46+i).padStart(3,'0')}`);
const sbspmSemanticOk = sbspmSemanticFixes.length === 45
  && sbspmSemanticFixes.every(q => String(q.tags || '').includes('115語意修正'))
  && sbspmSemanticFixes.every(q => /操作曲線允許範圍/.test(`${q.question} ${q.explanation} ${q.source_locator} ${q.tags}`))
  && sbspmSemanticFixes.every(q => /最近.*邊界|最近上界/.test(`${q.question} ${q.explanation} ${q.source_locator}`))
  && audited.filter(q => sbspmMixedIds.includes(String(q.id || ''))).every(q => /範圍內/.test(`${q.question} ${q.explanation} ${q.tags}`) && /SBSPM＝100%|SBSPM=100%/.test(`${q.explanation} ${q.source_locator}`))
  && audited.filter(q => sbspmPowerIds.includes(String(q.id || ''))).every(q => /MW/.test(q.question) && /得標容量百分比/.test(`${q.question} ${q.explanation} ${q.source_locator}`));

const reserveRoundingExpected = {
  'V2U6-006':'14,000元',
  'V2U6-018':'22,000元',
  'V2U6-030':'30,000元',
  'V2U6-042':'18,000元',
  'V2U6-054':'26,000元'
};
const reserveRounding = audited.filter(q => Object.hasOwn(reserveRoundingExpected, String(q.id || '')));
const reserveRoundingOk = reserveRounding.length === 5
  && reserveRounding.every(q => String(q.tags || '').includes('115進位修正'))
  && reserveRounding.every(q => /MW以下無條件進位/.test(`${q.question} ${q.explanation} ${q.source_locator}`))
  && reserveRounding.every(q => correctText(q) === reserveRoundingExpected[q.id]);

const backupUnitExpected = {
  'V2U9-003':'13,200元/年',
  'V2U9-007':'23,800元/年',
  'V2U9-011':'36,800元/年',
  'V2U9-015':'55,800元/年',
  'V2U9-019':'57,200元/年',
  'V2U9-023':'88,500元/年'
};
const backupUnitFixes = audited.filter(q => Object.hasOwn(backupUnitExpected, String(q.id || '')));
const backupUnitFixesOk = backupUnitFixes.length === 6
  && backupUnitFixes.every(q => String(q.tags || '').includes('115版本修正'))
  && backupUnitFixes.every(q => /10kW（含）以上/.test(q.question) && /基本單位為1kW/.test(q.question))
  && backupUnitFixes.every(q => /不須湊成10kW倍數/.test(q.explanation))
  && backupUnitFixes.every(q => correctText(q) === backupUnitExpected[q.id]);

const checks = [
  ['正式題庫總數=800', audited.length === 800, audited.length],
  ['進階題=500', advanced.length === 500, advanced.length],
  ['V2保留=300', v2.length === 300, v2.length],
  ['V3新題=200', v3.length === 200, v3.length],
  ['無placeholder選項', placeholders.length === 0, placeholders.map(q=>q.id)],
  ['每題四選項唯一', duplicateOptionQuestions.length === 0, duplicateOptionQuestions.map(q=>q.id)],
  ['答案格式合法', badAnswers.length === 0, badAnswers.map(q=>q.id)],
  ['800題答案A/B/C/D各200', JSON.stringify(report.byAnswer) === JSON.stringify(expectedAnswerDistribution), report.byAnswer],
  ['115年頻率掃描5題已套用範圍修正', scanFixesOk, scanFixes.map(q=>({id:q.id,tags:q.tags,question:q.question}))],
  ['115年電能損失10題已套用線損率效率額度公式', lossFixesOk, lossFixes.map(q=>({id:q.id,tags:q.tags,explanation:q.explanation}))],
  ['E-dReg 26題已改為15分鐘區間語意', edregIntervalFixesOk, edregIntervalFixes.map(q=>q.id)],
  ['E-dReg 5題完整結算已納入容量/475效能/品質/電能服務費', edregFullOk, edregFull.map(q=>({id:q.id,question:q.question}))],
  ['dReg 3題已區分操作曲線4位小數與SBSPM整數取位', precisionFixesOk, precisionFixes.map(q=>({id:q.id,question:q.question,tags:q.tags}))],
  ['SBSPM 45題已改為允許範圍/最近邊界語意', sbspmSemanticOk, sbspmSemanticFixes.map(q=>({id:q.id,question:q.question,tags:q.tags}))],
  ['備用供電容量系統費5題已先整數MW進位再計費', reserveRoundingOk, reserveRounding.map(q=>({id:q.id,answer:q.answer,correct:correctText(q),question:q.question}))],
  ['備用容量6題已區分最低10kW與基本單位1kW', backupUnitFixesOk, backupUnitFixes.map(q=>({id:q.id,answer:q.answer,correct:correctText(q),question:q.question}))],
  ['守門無重複ID', (report.duplicates || []).length === 0, report.duplicates || []],
  ['守門無重複題幹', (report.duplicateQuestions || []).length === 0, report.duplicateQuestions || []],
  ['守門無無效選項', (report.invalidOptions || []).length === 0, report.invalidOptions || []],
  ['進階單元分布符合V3', JSON.stringify(byAdvancedUnit) === JSON.stringify({'04':40,'06':90,'07':160,'08':170,'09':40}), byAdvancedUnit]
];

console.log('\n=== 台電爸爸版題庫 V3/V4/V5/V6/V7 自動稽核 ===');
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
