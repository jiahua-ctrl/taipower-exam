const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const v2 = read('questions_advanced_v2_500.js');
const v3 = read('questions_advanced_v3_quality_patch.js');
const v4 = read('questions_advanced_v4_edreg_patch.js');
const v5 = read('questions_advanced_v5_precision_patch.js');
const guard = read('question_bank_guard.js');
const formalSources = [
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
  'question_bank_guard.js'
].map(read).join('\n');

const checks = [
  ['V3參與費用公式=8847+400/MW+100/資源', /fee\s*=\s*\(mw,res\)\s*=>\s*8847\s*\+\s*mw\*400\s*\+\s*res\*100/.test(v3)],
  ['V3品質指標級距含95/94/93/92/91/70', /r\s*>=\s*95\s*\?\s*1\s*:\s*r\s*===\s*94\s*\?\s*\.8\s*:\s*r\s*===\s*93\s*\?\s*\.6\s*:\s*r\s*===\s*92\s*\?\s*\.4\s*:\s*r\s*===\s*91\s*\?\s*\.2\s*:\s*r\s*>=\s*70\s*\?\s*0\s*:\s*-1/.test(v3)],
  ['V2/V3仍使用dReg效能350', /pp\s*=\s*350/.test(v2) || /效能350/.test(v3)],
  ['V2/V4含E-dReg充500/放2000邏輯', (/price\s*=\s*typ===['"]放電['"]\?2000:500/.test(v2)) && /2000 \* p \* 0\.25/.test(v4) && /500 \* p \* 0\.25/.test(v4)],
  ['V4 E-dReg效能價格固定使用475', /\+ 475\) \* c\.mw/.test(v4) && /效能價475/.test(v4)],
  ['V4 E-dReg電能服務費以15分鐘=0.25小時計', /15分鐘區間/.test(v4) && /0\.25/.test(v4)],
  ['V4 E-dReg完整結算含品質指標後再加電能服務費', /const qualityPart = preQuality \* c\.q/.test(v4) && /const total = qualityPart \+ energy/.test(v4)],
  ['V4明確把併網型儲能電能損失費留到月結算另扣', /電能損失費在月結算另計/.test(v4)],
  ['V4含容量結清價0元情境，避免誤認E-dReg容量費固定', /cp:0/.test(v4)],
  ['V5操作曲線相關中間計算精度=小數點後4位', /小數點後第4位|小數點後4位/.test(v5) && /操作曲線/.test(v5)],
  ['V5明確區分SBSPM每秒執行率最後四捨五入至整數位', /SBSPM每秒執行率最後仍四捨五入至整數位/.test(v5)],
  ['V5含新版31.6667%精度案例', /31\.6667%/.test(v5)],
  ['正式題源含109500保證金', /109500|109,500/.test(formalSources)],
  ['正式題源未出現舊sReg現行值59.88', !/59\.88/.test(formalSources)],
  ['115年修正層含新版淨計量公式', /charge\/\(1-loss\)\s*-\s*dis\*\(1-loss\)/.test(guard)],
  ['115年修正層含新版效率額度=充電÷(1-線損率)×20%', /charge\/\(1-loss\)\*0\.20/.test(guard)],
  ['115年修正層鎖定V3U8-071至080電能損失題', /V3U8-/.test(guard) && /71\+i/.test(guard) && /i<10/.test(guard)]
];

console.log('\n=== 115年市場規則常數自動稽核 ===');
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);

const failed = checks.filter(x => !x[1]);
if (failed.length) {
  console.error(`\n市場規則常數稽核失敗：${failed.length}項`);
  process.exit(1);
}
console.log('\n市場規則常數稽核通過。考前若台電公告新版規則，仍須更新 RULE_AUDIT_115.md 與本檢查。');
