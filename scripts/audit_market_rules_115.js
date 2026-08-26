const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const v2 = read('questions_advanced_v2_500.js');
const v3 = read('questions_advanced_v3_quality_patch.js');
const formalSources = [
  'questions_verified_core_v1.js',
  'questions_confusion_v3.js',
  'questions_verified_high_discrimination_v1.js',
  'questions_verified_high_discrimination_v2.js',
  'questions_verified_high_discrimination_v3.js',
  'questions_verified_high_discrimination_v4.js',
  'questions_verified_high_discrimination_v5.js',
  'questions_advanced_v2_500.js',
  'questions_advanced_v3_quality_patch.js'
].map(read).join('\n');

const checks = [
  ['V3參與費用公式=8847+400/MW+100/資源', /fee\s*=\s*\(mw,res\)\s*=>\s*8847\s*\+\s*mw\*400\s*\+\s*res\*100/.test(v3)],
  ['V3品質指標級距含95/94/93/92/91/70', /r\s*>=\s*95\s*\?\s*1\s*:\s*r\s*===\s*94\s*\?\s*\.8\s*:\s*r\s*===\s*93\s*\?\s*\.6\s*:\s*r\s*===\s*92\s*\?\s*\.4\s*:\s*r\s*===\s*91\s*\?\s*\.2\s*:\s*r\s*>=\s*70\s*\?\s*0\s*:\s*-1/.test(v3)],
  ['V2/V3仍使用dReg效能350', /pp\s*=\s*350/.test(v2) || /效能350/.test(v3)],
  ['V2仍含E-dReg充500/放2000邏輯', /price\s*=\s*typ===['"]放電['"]\?2000:500/.test(v2)],
  ['正式題源含109500保證金', /109500|109,500/.test(formalSources)],
  ['正式題源未出現舊sReg現行值59.88', !/59\.88/.test(formalSources)]
];

console.log('\n=== 115年市場規則常數自動稽核 ===');
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);

const failed = checks.filter(x => !x[1]);
if (failed.length) {
  console.error(`\n市場規則常數稽核失敗：${failed.length}項`);
  process.exit(1);
}
console.log('\n市場規則常數稽核通過。考前若台電公告新版規則，仍須更新 RULE_AUDIT_115.md 與本檢查。');
