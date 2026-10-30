// Synthetic inputs only. Tests run the shipped single-file implementation.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id,{value:'',checked:false,disabled:false,hidden:true,textContent:'',innerHTML:'',listeners:{},addEventListener(type,fn){(this.listeners[type] ||= []).push(fn)},focus(){}});
  return elements.get(id);
};
const context = vm.createContext({document:{getElementById:element,querySelectorAll:()=>[]}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
const run = source => vm.runInContext(source,context);
const parse = (raw,format='table') => {context.raw=raw;context.format=format;return run('parseHis2Text(raw,format)')};
const table = '採血時間\t檢驗項目\t結果\t單位\n';
let value = parse(table+'115/10/27 23:40\tCreatinine\t1.7\tmg/dL\n115/10/27 23:50\tTrough\t9.3\tµg/mL\n115/10/28 03:20\tPeak\t25.4\tmg/L');
assert.equal(value.canApply,true);
assert.equal(value.records[0].value,1.7);
assert.equal(value.records[1].date.iso,'2026-10-27T23:50');
assert.equal(value.records[2].date.iso,'2026-10-28T03:20');
assert.match(value.labs,/1.7mg\/dL/);
assert.doesNotMatch(value.labs,/CRE: 0\.6|CrCl: 82\.9/);
for (const bad of [
 table+'2026/10/28 08:00\tCRE\t150\tµmol/L',
 table+'2026/10/28 08:00\tCRE\t1.7\t',
 table+'2026/02/30 08:00\tCRE\t1.7\tmg/dL',
 table+'2026/10/28 25:00\tCRE\t1.7\tmg/dL',
 table+'2026/10/28 08:00\tCRE\t<0.2\tmg/dL',
 table+'2026/10/28 08:00\tCRE\t0\tmg/dL',
 table+'2026/10/28 08:00\tCRE\t1.7\tmg/dL\n2026/10/28 09:00\tCRE\t2\tmg/dL',
 '報告時間\t檢驗項目\t結果\t單位\n2026/10/28 08:00\tCRE\t1.7\tmg/dL'
]) assert.equal(parse(bad).canApply,false,bad);
assert.equal(parse('not a supported report').canApply,false);
assert.equal(parse('').canApply,false);
assert.equal(parse('x'.repeat(100001)).canApply,false);
let fixed = parse('Peak\t30\t\t115/10/28\tCRE\t1.9\nTrough\t11\t\t\tCRP\t2.1\n\t\t\t115/10/28\tN.band\t','fixed');
assert.equal(fixed.canApply,true);
assert.match(fixed.labs,/CRE: 1.9mg\/dL/);
assert.doesNotMatch(fixed.labs,/N.band/);
assert.ok(fixed.warnings.some(warning => warning.includes('不補 0')));
assert.equal(parse('Peak\t30\t\tinvalid\tCRE\t1.9','fixed').canApply,false);
assert.equal(parse('日期\t\t體溫\t\t脈搏\t呼吸\t血壓mmHg\n1151028\t\t36.8\t\t80\t18\t120/70','fixed').canApply,true);
assert.equal(run("parseLabDate('1151028').iso"),'2026-10-28');
assert.equal(run("parseLabDate('20261028').iso"),'2026-10-28');
assert.equal(run("parseLabDate('1150229')"),null);
// Preview never writes clinical fields; confirmation and current source are required.
element('his2Format').value='table';
element('his2Paste').value=table+'2026/10/28 08:00\tCRE\t1.7\tmg/dL';
element('scr').value='0.8';
run('parseHis2()');
assert.equal(element('scr').value,'0.8');
assert.equal(run('applyHis2()'),false);
element('his2Reviewed').checked=true;
assert.equal(run('applyHis2({switchToTdm:false})'),true);
assert.equal(element('scr').value,'1.7');
element('his2Paste').value=table+'2026/10/28 08:00\tCRE\t2.4\tmg/dL';
element('his2Reviewed').checked=true;
assert.equal(run('applyHis2()'),false);
assert.equal(element('scr').value,'1.7');
// Partial levels must not pair a new result with an old result/date.
element('his2Paste').value=table+'2026/10/28 08:00\tPeak\t25\tmg/L';
element('tdmTrough').value='99';element('tdmTroughTime').value='2025-01-01T08:00';element('tdmDoseTime').value='2025-01-01T09:00';
run('parseHis2()');element('his2Reviewed').checked=true;run('applyHis2({switchToTdm:false})');
assert.equal(element('tdmPeak').value,'25');
assert.equal(element('tdmPeakTime').value,'2026-10-28T08:00');
assert.equal(element('tdmTrough').value,'');assert.equal(element('tdmTroughTime').value,'');assert.equal(element('tdmDoseTime').value,'');
// Fixed format may populate actual SCr but must not invent concentration timestamps.
element('his2Format').value='fixed';element('his2Paste').value='Peak\t30\t\t115/10/28\tCRE\t1.9\nTrough\t11';
run('parseHis2()');element('his2Reviewed').checked=true;run('applyHis2({switchToTdm:false})');
assert.equal(element('scr').value,'1.9');assert.equal(element('tdmPeak').value,'');assert.equal(element('tdmTrough').value,'');
// Loading demo remains an explicit action, not a parse fallback.
element('loadDemo').listeners.click[0]();
assert.ok(Math.abs(run('currentAucResult.auc24')-349.66627148529443)<1e-7);
// Import preview is owned only by parser, never by TDM calculation/reset.
element('his2Format').value='table';
element('his2Paste').value=table+'2026/10/28 08:00\tTrough\t13\tmg/L\n2026/10/28 12:00\tPeak\t29\tmg/L';
run('parseHis2()');
const preview = element('previewVanco').textContent;
element('his2Reviewed').checked=true;
run('calculateAuc()');
assert.equal(element('previewVanco').textContent,preview);
run('clearTdmDerived()');
assert.equal(element('previewVanco').textContent,preview);
// Blank but recognized level rows must clear the previous pair/time, not disappear.
element('loadDemo').listeners.click[0]();
element('his2Format').value='table';
element('his2Paste').value=table+'2026/10/28 08:00\tCRE\t1.7\tmg/dL\n2026/10/28 08:00\tTrough\t\tmg/L\n2026/10/28 12:00\tPeak\t\tmg/L';
run('parseHis2()');element('his2Reviewed').checked=true;assert.equal(run('applyHis2({switchToTdm:false})'),true);
for (const id of ['tdmPeak','tdmTrough','tdmPeakTime','tdmTroughTime','tdmDoseTime']) assert.equal(element(id).value,'',id);
assert.equal(run('calculateAuc()'),null);
console.log('PASS: supported TSV/fixed layouts, genuine values, units/dates/duplicates, preview confirmation, stale-source blocking, no invented TDM.');
// Explicitly blank creatinine is not allowed to silently reuse another result.
element('loadDemo').listeners.click[0]();element('his2Format').value='table';
element('his2Paste').value=table+'2026/10/28 08:00\tCRE\t\tmg/dL\n2026/10/28 08:00\tCRP\t2.4\tmg/dL';
run('parseHis2()');element('his2Reviewed').checked=true;run('applyHis2({switchToTdm:false})');assert.equal(element('scr').value,'');
// Invalid height clears already displayed renal/dose outputs.
element('loadDemo').listeners.click[0]();element('height').value='50';assert.equal(run('calculateDose()'),null);
for (const id of ['doseIbw','doseCrcl','doseWeight','loadingDose','maintenanceDose','firstMonitoring']) assert.equal(element(id).textContent,'—');
// Regimen display must match exact values used by the model and note.
element('loadDemo').listeners.click[0]();element('nextDose').value='1000.5';element('nextInterval').value='12.5';run('calculateTrial()');assert.equal(element('trialRegimen').textContent,'1000.5 mg q12.5h');

// Current 1090427 report-date and A:I vital layouts fail closed, not re-labelled as collection data.
const reportRows = [
 ['', '', '檢體名稱', '報告日期', '檢驗項目', '檢驗報告', '單位'],
 ['', '', 'SYN BLOOD', '2026/01/02', 'CRE', '1', 'mg/dL'],
 ['', '', '檢體名稱', '報告日期', '檢驗項目', '檢驗報告', '單位'],
 ['', '', '', '', 'WBC', '0', '*10^3/uL']
];
value=parse(reportRows.map(row=>row.join('\t')).join('\n'),'fixed');
assert.equal(value.canApply,false);assert.equal(value.records.length,0);assert.match(value.errors.join(' '),/報告日期不是採血日期/);
value=parse([['時間','體溫','部位','脈搏','呼吸','血壓','血壓位','疼痛','SpO2(%)'],['1234','36','SYN','80','16','120/80','SYN','0','99']].map(r=>r.join('\t')).join('\n'),'fixed');
assert.equal(value.canApply,false);assert.equal(value.vitals.length,0);assert.match(value.errors.join(' '),/A:I/);
value=parse([['','','','2026/01/02','BUN','20'],['','','','採血日期','檢驗項目','結果'],['','','','','CRE','1']].map(r=>r.join('\t')).join('\n'),'fixed');
assert.equal(value.canApply,false);assert.match(value.errors.join(' '),/缺少有效採血日期/);assert.ok(!value.records.some(r=>r.name==='CRE'));
console.log('PASS: 1090427 report-date/A:I layouts rejected and fixed-date carry reset at repeated headers.');

// Explicit current-workbook mode: source-aware preview, selected note-only import.
const h109=['','','檢體名稱','報告日期','檢驗項目','檢驗報告','單位','標準(低)','標準(高)','報告者'];
const current109=[h109,['','','SYN BLOOD','2026/01/02','CRE','1','mg/dl','0.5','1.5','SYN REPORTER'],['','','','','N.band','0','%','0','5',''],['時間','體溫','部位','脈搏','呼吸','血壓','血壓位','疼痛','SpO2(%)'],['1234','36','SYN SITE','80','16','120/80','SYN POS','0','99']].map(r=>r.join('\t')).join('\n');
value=parse(current109,'workbook1090427');assert.equal(value.canApply,true);assert.match(value.labs,/報告日期：2026\/01\/02；CRE: 1 mg\/dl/);assert.match(value.labs,/報告日期：未提供；N.band: 0 %/);assert.match(value.vitalText,/觀測日期未提供.*1234/);assert.doesNotMatch(value.labs,/SYN REPORTER/);
element('pharmacyAllowDateCarry').checked=true;value=parse(current109,'workbook1090427');assert.match(value.labs,/2026\/01\/02（同表區沿用）；N.band: 0 %/);element('pharmacyAllowDateCarry').checked=false;
element('his2Paste').value=current109;element('his2Format').value='workbook1090427';element('scr').value='9';element('tdmPeak').value='88';element('tdmPeakTime').value='2026-01-01T10:00';element('tdmTroughTime').value='2026-01-01T06:00';
assert.equal(run('parseHis2()'),true);element('his2Reviewed').checked=true;element('pharmacyLabSelection').selectedOptions=[];assert.equal(run('applyHis2()'),false);
element('pharmacyLabSelection').selectedOptions=[{value:'lab-2'},{value:'lab-3'},{value:'vital-5'}];assert.equal(run('applyHis2()'),true);
assert.equal(element('scr').value,'9');assert.equal(element('tdmPeak').value,'88');assert.equal(element('tdmPeakTime').value,'2026-01-01T10:00');assert.equal(element('tdmTroughTime').value,'2026-01-01T06:00');assert.match(element('labs').value,/N.band: 0 %/);assert.doesNotMatch(element('labs').value,/SYN REPORTER/);assert.match(element('vitals').value,/SpO2\(%\): 99/);
console.log('PASS: 1090427 explicit selected note-only integration, report-date semantics, blank dates, optional carry, raw vitals, no reporter and no SCr/TDM mutation.');
