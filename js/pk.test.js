const test = require('node:test');
const assert = require('node:assert/strict');
const PK = require('./pk.js');

function near(actual, expected, tolerance = 0.005) {
  assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * tolerance,
    `expected ${expected}, got ${actual}`);
}

const base = {
  dose: 750,
  tau: 12,
  tInf: 1,
  doseTime: '2023-12-11T08:41',
  troughTime: '2023-12-11T08:19',
  peakTime: '2023-12-11T11:53',
  trough: 10.2,
  peak: 17.6,
  mic: 1,
  nextInfusionDelay: 8,
};

test('院內 Excel golden case：雙點 AUC', () => {
  const result = PK.twoLevelAuc({
    ...base,
    newDose: 1000,
    newTau: 12,
    newTInf: 1,
  });
  assert.equal(result.ok, true);
  near(result.ke, 0.0646851204);
  near(result.halfLife, 10.7134376);
  near(result.cMaxTrue, 20.2915829);
  near(result.cMinTrue, 9.9609240);
  near(result.vd, 66.2971454);
  near(result.cl, 4.2884388);
  near(result.aucInfusion, 15.1262535);
  near(result.aucElim, 159.7068822);
  near(result.auc24, 349.6662715);
  near(result.auc24Check, 349.7408715);
  near(result.predictedPreDoseConc, 10.48995297);
  assert.equal(result.status, 'below');
  near(result.newRegimen.auc24, 466.2216953);
  near(result.newRegimen.steadyPeak, 27.0554439);
  near(result.newRegimen.steadyTrough, 13.2812321);
  near(result.currentProfile[0].peak, 20.5156838);
  near(result.currentProfile[0].trough, 10.0709328);
  near(result.currentProfile[14].peak, 20.2915872);
  near(result.currentProfile[14].trough, 9.9609261);
  near(result.newRegimen.profile[0].peak, 24.4390034);
  near(result.newRegimen.profile[0].trough, 11.9968490);
});

test('Excel 操作介面：使用三個日期時間欄位得到相同 AUC', () => {
  const result = PK.twoLevelAuc({
    dose: 750,
    tau: 12,
    tInf: 1,
    doseTime: '2023-12-11T08:41',
    troughTime: '2023-12-11T08:19',
    peakTime: '2023-12-11T11:53',
    trough: 10.2,
    peak: 17.6,
    mic: 1,
  });
  assert.equal(result.ok, true);
  near(result.auc24, 349.6662715);
  assert.ok(result.currentContinuousProfile.length > 15);
  assert.ok(Math.max(...result.currentContinuousProfile.map((point) => point.concentration)) - Math.min(...result.currentContinuousProfile.map((point) => point.concentration)) > 5);
});

test('起始劑量：TBW 給藥、肥胖 AdjBW 算 CrCl', () => {
  const result = PK.empiricDosing({
    age: 60,
    sexMale: true,
    heightCm: 170,
    tbw: 180,
    scr: 1,
    rrtType: 'none',
  });
  assert.equal(result.ok, true);
  assert.match(result.crclWeight.label, /AdjBW/);
  assert.equal(result.loadingCapped, true);
  assert.deepEqual(result.loadingCandidates, [3000]);
  assert.equal(result.interval.manual, false);
});

test('起始劑量：CrCl <20 停止自動間隔', () => {
  const result = PK.empiricDosing({
    age: 80,
    sexMale: false,
    heightCm: 155,
    tbw: 50,
    scr: 4,
    rrtType: 'none',
  });
  assert.equal(result.ok, true);
  assert.equal(result.interval.manual, true);
});

test('輸入驗證：peak 不可低於 trough，且 trough 必須在給藥前', () => {
  const result = PK.twoLevelAuc({
    ...base,
    peak: 7,
    trough: 10,
    troughTime: '2023-12-11T09:00',
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.includes('peak')));
});

test('RRT 首版不進入標準自動計算', () => {
  const result = PK.empiricDosing({
    age: 60,
    sexMale: true,
    heightCm: 175,
    tbw: 80,
    scr: 1,
    rrtType: 'ihd',
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.includes('RRT')));
});

test('AUC 邊界分類', () => {
  assert.equal(PK.classifyAuc(399.9), 'below');
  assert.equal(PK.classifyAuc(400), 'target');
  assert.equal(PK.classifyAuc(600), 'target');
  assert.equal(PK.classifyAuc(600.1), 'above');
});
