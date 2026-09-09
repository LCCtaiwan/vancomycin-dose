// Run: node tests/excel-formulas.cjs. Only synthetic/public demo data is used.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    value:'', checked:false, hidden:true, innerHTML:'', textContent:'', listeners:{},
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }, focus() {}
  });
  return elements.get(id);
}
const context = vm.createContext({ document:{ getElementById:element, querySelectorAll:() => [] } });
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const run = (code) => vm.runInContext(code, context);
function near(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 1e-7, `${label}: ${actual} != ${expected}`);
}
element('loadDemo').listeners.click[0]();
near(run('currentAucResult.auc24'), 349.66627148529443, 'public demo AUC');
near(run('currentTrialResult.auc24'), 466.22169531372595, 'public demo new AUC');
near(run('currentTrialResult.peak'), 27.055443927670197, 'public demo steady peak');
near(run('currentTrialResult.trough'), 13.281232059032313, 'public demo steady trough');
assert.equal((element('currentSimulationRows').innerHTML.match(/<tr>/g) || []).length, 15);
assert.equal((element('simulationRows').innerHTML.match(/<tr>/g) || []).length, 15);

// Independent closed form of Excel B30:P31 / B39:P40 recurrence.
// Choose k and infusion time so infusion decay = 1/2, full interval decay = 1/4.
const k = Math.log(2);
context.syntheticModel = { k, vd:50, dose:1000, interval:2, infusionHours:1, trough:10 };
context.syntheticRegimen = { dose:1000, interval:2, infusionHours:1 };
for (const initial of [10, 4]) {
  context.initial = initial;
  const rows = run('predictSerialConcentrations(syntheticModel, syntheticRegimen, initial, 15)');
  const inputPeak = 10 / k;
  const fixedTrough = inputPeak * 2 / 3;
  rows.forEach((row, i) => {
    const expectedPre = fixedTrough + (initial - fixedTrough) * 0.25 ** i;
    near(row.preDose, expectedPre, `dose ${i + 1} pre`);
    near(row.peak, expectedPre / 2 + inputPeak, `dose ${i + 1} peak`);
    near(row.nextTrough, expectedPre / 4 + inputPeak / 2, `dose ${i + 1} trough`);
  });
  context.syntheticRows = rows;
  const points = run('serialChartPoints(syntheticModel, syntheticRegimen, syntheticRows)');
  for (const row of rows) {
    near(points.find(p => p.time === row.doseTime + 1).concentration, row.peak, 'chart exact peak');
    near(points.find(p => p.time === row.doseTime + 2).concentration, row.nextTrough, 'chart trough');
  }
}

// The current chart must start at observed trough, not steady-state minimum.
const model = run('currentAucResult');
const currentRows = run('predictSerialConcentrations(currentAucResult, currentAucResult, currentAucResult.trough, 15)');
near(currentRows[0].preDose, model.trough, 'Excel B7 start');
assert.ok(Math.abs(currentRows[0].peak - currentRows[14].peak) > 0.001);
context.currentRowsForTest = currentRows;
const currentPoints = run('serialChartPoints(currentAucResult, currentAucResult, currentRowsForTest)');
near(currentPoints[0].concentration, model.trough, 'current chart start');
for (const row of currentRows) near(currentPoints.find(p => p.time === row.doseTime + model.infusionHours).concentration, row.peak, 'demo chart peak');

// Edits and failed evaluation must not leave a previously valid dose in the note.
for (const id of ['nextDose', 'nextInterval', 'nextInfusion', 'nextInfusionGap', 'simulationDoses']) {
  element('loadDemo').listeners.click[0]();
  element(id).listeners.input.forEach(fn => fn());
  assert.equal(run('currentTrialResult'), null);
  assert.equal(element('noteOutput').value, '');
  assert.equal(element('serialPrediction').hidden, true);
}
for (const [id, value] of [['nextDose','0'], ['nextInterval','1'], ['nextInfusion','0'], ['nextInfusionGap','-1'], ['simulationDoses','16'], ['nextDose','']]) {
  element('loadDemo').listeners.click[0]();
  element(id).value = value;
  assert.equal(run('calculateTrial()'), null);
  run('generateNote()');
  assert.equal(run('currentTrialResult'), null);
  assert.equal(element('noteOutput').value, '');
}
element('loadDemo').listeners.click[0]();
element('nextDose').value = '1250';
run('generateNote()');
assert.equal(run('currentTrialResult.dose'), 1250);
assert.ok(element('noteOutput').value.includes('1250 mg'));
console.log('PASS: demo, 15-dose current/new recurrence, chart endpoints, invalidation and note recalculation.');
