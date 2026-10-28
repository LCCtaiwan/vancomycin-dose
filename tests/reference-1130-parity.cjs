// Run: node tests/reference-1130-parity.cjs
// Fresh synthetic fixtures, independently recalculated from the approved 11.30
// Excel formula map by LibreOffice. No patient data or workbook images are used.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fixtures = require('./reference-1130-synthetic.json');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const testedIndexSha256 = crypto.createHash('sha256').update(html).digest('hex');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
// Observe intermediate local values only inside this test's in-memory script.
// The executable formulas and repository index.html are not modified.
const marker = '      currentAucResult = { auc24, aucMic, halfLife, vd, clearance, status, dose, interval, infusionMinutes, infusionHours:infusion, mic, k, peak, trough };';
assert.equal(script.split(marker).length, 2, 'AUC instrumentation marker must be unique');
const instrumented = script.replace(marker,
  '      globalThis.testIntermediates = { B11:troughToDoseHours, B12:doseToPeakHours, B13:eliminationHours, B14:k, B15:halfLife, B16:endConcentration, B17:minimumConcentration, B18:vd, B19:clearance, B20:infusionAuc, B21:eliminationAuc, B22:auc24, B23:aucMic };\n' + marker);
let comparisons = 0;
let maxAbsoluteError = 0;
let maxRelativeError = 0;
const summaries = [];
function iso(roc) {
  const m = roc.match(/^(\d{3})\/(\d\d)\/(\d\d)\s+(\d\d):(\d\d)$/);
  assert.ok(m, 'Synthetic ROC timestamp must match the source workbook format');
  return `${Number(m[1]) + 1911}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
}
for (const fixture of fixtures.cases) {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value:'', checked:false, hidden:true, innerHTML:'', textContent:'', listeners:{},
      addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }, focus() {}
    });
    return elements.get(id);
  }
  const context = vm.createContext({ document:{ getElementById:element, querySelectorAll:() => [] } });
  vm.runInContext(instrumented, context);
  const run = (code) => vm.runInContext(code, context);
  const input = fixture.input;
  const values = {
    tdmDose:input.dose, tdmInterval:input.tau, tdmInfusion:input.tinf * 60,
    tdmMic:input.mic, tdmPeak:input.peak, tdmTrough:input.trough,
    tdmDoseTime:iso(input.admin), tdmPeakTime:iso(input.peakTime), tdmTroughTime:iso(input.troughTime),
    nextDose:input.newDose, nextInterval:input.newTau, nextInfusion:input.newTinf * 60,
    nextInfusionGap:input.gapAfterPeak, simulationDoses:15,
    renalStable:'stable', rrt:'none', age:40, height:170, weight:70, scr:1, sex:'male', dosingContext:'standard'
  };
  for (const [id, value] of Object.entries(values)) element(id).value = String(value);
  const model = run('calculateAuc()');
  if (!fixture.uiSupported) {
    assert.equal(model, null, `${fixture.id}: UI intentionally rejects peak-before-trough timing`);
    assert.match(element('tdmWarningList').innerHTML, /時間順序/);
    summaries.push({case:fixture.id, status:'EXPECTED_BLOCK', reason:'UI supports trough → infusion → peak; workbook also contains a separate peak-before-trough branch.'});
    continue;
  }
  assert.ok(model, `${fixture.id}: valid synthetic inputs must calculate`);
  const trial = run('calculateTrial()');
  assert.ok(trial, `${fixture.id}: valid synthetic new regimen must calculate`);
  const actual = {...context.testIntermediates, B33:trial.startPreDose, B37:trial.auc24, B41:trial.peak, B42:trial.trough};
  const current = run('predictSerialConcentrations(currentAucResult,currentAucResult,currentAucResult.trough,15)');
  const next = run('predictSerialConcentrations(currentAucResult,currentTrialResult,currentTrialResult.startPreDose,15)');
  current.forEach((row, i) => { const col = String.fromCharCode(66 + i); actual[`${col}30`] = row.peak; actual[`${col}31`] = row.nextTrough; });
  next.forEach((row, i) => { const col = String.fromCharCode(66 + i); actual[`${col}39`] = row.peak; actual[`${col}40`] = row.nextTrough; });
  assert.equal(Object.keys(actual).length, 77);
  for (const [cell, expected] of Object.entries(fixture.expected)) {
    const error = Math.abs(actual[cell] - expected);
    const relative = error / Math.max(1, Math.abs(expected));
    assert.ok(Number.isFinite(actual[cell]), `${fixture.id} ${cell} must be finite`);
    assert.ok(error <= 1e-7 + 1e-8 * Math.abs(expected), `${fixture.id} ${cell}: ${actual[cell]} != ${expected}`);
    maxAbsoluteError = Math.max(maxAbsoluteError, error);
    maxRelativeError = Math.max(maxRelativeError, relative);
    comparisons += 1;
  }
  if (input.mic !== 1) assert.match(model.status, /人工判讀/, 'MIC ≠ 1 does not get automatic target classification');
  summaries.push({case:fixture.id,status:'PASS',numericFormulaChecks:77});
}
assert.equal(comparisons, 462);
console.log(JSON.stringify({status:'PASS',testedIndexSha256,comparisons,maxAbsoluteError,maxRelativeError,cases:summaries}, null, 2));
