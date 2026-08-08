const test = require('node:test');
const assert = require('node:assert/strict');
const { makeNote } = require('./note.js');

const base = {
  patient: { name: 'Test', mrn: '000', ward: 'A1', age: 50, sexLabel: '男', tbw: 70, noteDate: '2026-08-08', pharmacist: 'Pharmacist', phone: '1234' },
  clinical: { indication: 'MRSA bacteremia', startDate: '2026-08-01', diagnosis: ['Sepsis'], cultures: ['Blood culture: MRSA'], labs: 'SCr 1.0 mg/dL, CrCl 80 mL/min', vitals: 'T 37.0°C' },
  regimen: { dose: 1000, tau: 12, tInf: 2 },
  result: { status: 'target', auc24: 500, aucOverMic: 500, mic: 1, trough: 12, peak: 28, troughDate: '08/08', peakDate: '08/08', troughTime: '2026-08-08T07:00', peakTime: '2026-08-08T11:00', ke: 0.06, halfLife: 11.55, cMaxTrue: 29, cMinTrue: 11, vd: 60, cl: 3.6 },
  monitoring: { volume: '250 mL NS', peakDate: '08/10', troughDate: '08/10', peakTime: '2026-08-10T11:00', troughTime: '2026-08-10T07:00' },
};

test('note includes structured S/O/A/P and regimen', () => {
  const note = makeNote(base);
  assert.match(note, /S:/);
  assert.match(note, /O:/);
  assert.match(note, /A:/);
  assert.match(note, /P:/);
  assert.match(note, /S: Vancomycin 1000 mg Q12H IVD for MRSA bacteremia since 2026\/08\/01\./);
  assert.match(note, /Dx: Sepsis/);
  assert.match(note, /Blood culture: MRSA/);
  assert.match(note, /SCr 1\.0 mg\/dL, CrCl 80 mL\/min/);
  assert.match(note, /AUC: 500\.00 ug·hr\/ml/);
  assert.match(note, /within the target range/);
  assert.match(note, /Vanco\(trough\): 12μg\/ml/);
  assert.match(note, /Keep current dosage/);
  assert.match(note, /Suggest trough level \(08\/10\) and peak level \(08\/10\) will be ordered/);
  assert.doesNotMatch(note, /病人姓名|病歷號|病房|主治醫師|住院／轉入日期/);
});

test('note changes AUC assessment wording', () => {
  assert.match(makeNote({ ...base, result: { ...base.result, status: 'below', auc24: 399.9 } }), /below the target range/);
  assert.match(makeNote({ ...base, result: { ...base.result, status: 'above', auc24: 600.1 } }), /above the target range/);
});
