// Run: node tests/note-export.cjs. Only repository synthetic demo data is used.
// This tests DOM/controller behavior, not clinical validation or a real browser permission UI.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(process.env.NOTE_TEST_HTML || path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const approvedDemo = fs.readFileSync(path.join(__dirname, 'fixtures/approved-pharmacy-note-demo.expected.txt'), 'utf8').trim();
function harness(options = {}) {
  const elements = new Map();
  const artifacts = { clipboard:[], blobs:[], downloads:[], removed:[], revoked:[], timers:[], fallbacks:0 };
  const document = { activeElement:null };
  function node(id = '') {
    return {
      id, value:'', checked:false, hidden:true, innerHTML:'', textContent:'', listeners:{}, style:{}, attributes:{},
      addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
      setAttribute(key, value) { this.attributes[key] = value; },
      getAttribute(key) { return this.attributes[key]; },
      focus() { document.activeElement = this; }, select() { this.selected = true; },
      setSelectionRange(start, end) { this.selection = [start, end]; },
      remove() { artifacts.removed.push(this); },
      click() { if (options.downloadThrows) throw new Error('Synthetic download failure'); artifacts.downloads.push({ href:this.href, filename:this.download }); }
    };
  }
  function element(id) { if (!elements.has(id)) elements.set(id, node(id)); return elements.get(id); }
  Object.assign(document, {
    getElementById:element,
    querySelectorAll:() => [],
    createElement:tag => { const result = node(); result.tagName = tag; return result; },
    body:{ appendChild(child) { child.attached = true; } },
    execCommand() { artifacts.fallbacks++; if (options.fallbackThrows) throw new Error('Synthetic copy failure'); return options.fallbackResult ?? true; }
  });
  const navigator = options.noClipboard ? {} : { clipboard:{ async writeText(value) {
    if (options.clipboardPending) return new Promise((resolve, reject) => { artifacts.resolveCopy = resolve; artifacts.rejectCopy = reject; });
    if (options.clipboardThrows) throw new Error('Synthetic permission denial');
    artifacts.clipboard.push(value);
  } } };
  const context = vm.createContext({
    document, navigator, Blob,
    URL:{ createObjectURL(blob) { artifacts.blobs.push(blob); return 'blob:synthetic-note'; }, revokeObjectURL(url) { artifacts.revoked.push(url); } },
    setTimeout(fn) { artifacts.timers.push(fn); },
    location:{ reload() {} }
  });
  vm.runInContext(script, context);
  const run = code => vm.runInContext(code, context);
  const demo = () => { element('loadDemo').listeners.click[0](); assert.ok(element('noteOutput').value.startsWith('S: Vancomycin'), element('noteGate').textContent); };
  return { element, run, demo, artifacts };
}
async function main() {
  // S/A/P remain the approved fixed sentences; parser-normalized O values may change.
  let app = harness();
  app.demo();
  const validNote = app.element('noteOutput').value;
  assert.equal(validNote.split('\n')[0], approvedDemo.split('\n')[0]);
  assert.equal(validNote.split('\nA:')[1], approvedDemo.split('\nA:')[1]);
  assert.match(validNote, /AUC: 349\.67 mcg·h\/mL/);
  assert.doesNotMatch(validNote, /NaN|undefined|Infinity/);
  assert.ok(validNote.includes(`CrCl: ${app.run('calculateDose().crcl.toFixed(1)')} mL/min`));
  assert.match(validNote, /SCr used: 1 mg\/dL/);
  assert.equal(await app.run('copyNote()'), true);
  assert.equal(app.artifacts.clipboard[0], validNote);
  assert.equal(app.artifacts.fallbacks, 0);
  assert.equal(app.run('downloadNote()'), true);
  assert.equal(app.artifacts.blobs[0].type, 'text/plain;charset=utf-8');
  const bytes = Buffer.from(await app.artifacts.blobs[0].arrayBuffer());
  assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.equal(bytes.subarray(3).toString('utf8'), validNote);
  assert.equal(app.artifacts.downloads[0].filename, 'vancomycin-pharmacy-note.txt');
  assert.equal(app.artifacts.removed.filter(n => n.tagName === 'a').length, 1);
  app.artifacts.timers.forEach(fn => fn());
  assert.deepEqual(app.artifacts.revoked, ['blob:synthetic-note']);

  // Same-input clinician edits are retained, but manually typed unapproved notes cannot export.
  app.element('noteOutput').value += '\nSynthetic manual review';
  assert.equal(await app.run('copyNote()'), true);
  assert.ok(app.artifacts.clipboard.at(-1).endsWith('Synthetic manual review'));
  app = harness();
  app.element('noteOutput').value = 'Synthetic but not generated';
  assert.equal(await app.run('copyNote()'), false);
  assert.equal(app.run('downloadNote()'), false);
  assert.equal(app.artifacts.blobs.length, 0);
  assert.match(app.element('noteGate').textContent, /請先/);

  // Programmatic changes without input events are caught at export, not just by UI listeners.
  const snapshotFields = ['patientId','age','sex','height','weight','scr','renalStable','rrt','rrtChanged',
    'dosingContext','crrtEffluent','diagnosis','tdmDose','tdmInterval','tdmInfusion','tdmMic',
    'tdmTrough','tdmTroughTime','tdmDoseTime','tdmPeak','tdmPeakTime','nextDose','nextInterval',
    'nextInfusion','nextInfusionGap','simulationDoses','his2Paste','his2Format','his2Reviewed',
    'labs','vitals','vanco','clinicalSupplement','noteDilution','noteTroughTime','notePeakTime'];
  for (const id of snapshotFields) {
    app = harness(); app.demo();
    if (['rrtChanged','his2Reviewed'].includes(id)) app.element(id).checked = !app.element(id).checked;
    else app.element(id).value += ' changed';
    assert.equal(app.run('downloadNote()'), false, `${id} must invalidate export`);
    assert.equal(app.element('noteOutput').value, '', `${id} clears the stale note`);
    assert.equal(app.artifacts.blobs.length, 0);
  }
  for (const model of ['currentAucResult','currentTrialResult']) {
    app = harness(); app.demo(); app.run(`${model}.auc24 = 999`);
    assert.equal(await app.run('copyNote()'), false, `${model} change is stale`);
    assert.equal(app.artifacts.clipboard.length, 0);
  }

  // Shared patient-data edits invalidate immediately, and regeneration uses current renal values.
  for (const id of ['patientId','age','sex','height','weight','scr','dosingContext','crrtEffluent']) {
    for (const event of ['input','change']) {
      app = harness(); app.demo();
      app.element(id).listeners[event].forEach(fn => fn());
      assert.equal(app.element('noteOutput').value, '', `${id}/${event} clears the note immediately`);
    }
  }
  app = harness(); app.demo();
  const priorCrcl = app.run('calculateDose().crcl.toFixed(1)');
  app.element('weight').value = '90';
  assert.equal(app.run('generateNote()'), true);
  const currentCrcl = app.run('calculateDose().crcl.toFixed(1)');
  assert.notEqual(currentCrcl, priorCrcl);
  assert.ok(app.element('noteOutput').value.includes(`CrCl: ${currentCrcl} mL/min`));
  assert.ok(!app.element('noteOutput').value.includes(`CrCl: ${priorCrcl} mL/min`));

  // Required inputs produce actionable blockers, never partial stale output.
  for (const [id, value, expected] of [
    ['diagnosis','', /Diagnosis/], ['labs','', /檢驗/], ['vitals','', /生命徵象/],
    ['noteDilution','0', /稀釋液量/], ['noteTroughTime','', /Trough／Peak/],
    ['notePeakTime','2026-08-05T08:00', /早於 Peak/], ['nextDose','', /regimen/],
    ['noteTroughTime','2026-08-02T08:00', /晚於本次 Peak/],
    ['tdmMic','2', /MIC 不等於 1/], ['tdmPeak','0', /TDM／AUC/], ['age','', /共同資料/]
  ]) {
    app = harness(); app.demo(); app.element(id).value = value;
    assert.equal(app.run('generateNote()'), false, id);
    assert.equal(app.element('noteOutput').value, '', id);
    assert.match(app.element('noteGate').textContent, expected, id);
  }
  app = harness(); app.demo();
  assert.equal(app.run("approvedNoteDate('2026-02-30T12:00')"), '');
  assert.equal(app.run("approvedNoteDate('2026-08-05T12:00')"), '2026/08/05, 12:00 PM');
  assert.equal(app.run("approvedNoteDate('2026-08-05T00:05')"), '2026/08/05, 12:05 AM');
  for (const [fn, model, field, value] of [
    ['calculateAuc','currentAucResult','auc24','NaN'],
    ['calculateTrial','currentTrialResult','peak','Infinity']
  ]) {
    app = harness(); app.demo();
    app.run(`${fn} = () => ({ ...${model}, ${field}:${value} })`);
    assert.equal(app.run('generateNote()'), false);
    assert.equal(app.element('noteOutput').value, '');
  }

  // Numeric values must not silently turn a fractional regimen into a different regimen.
  app = harness(); app.demo(); app.element('nextDose').value = '1000.5';
  app.element('nextInterval').value = '12.5'; app.element('nextInfusion').value = '75';
  assert.equal(app.run('generateNote()'), true);
  assert.match(app.element('noteOutput').value, /1000\.5 mg IVD Q12\.5H/);
  assert.match(app.element('noteOutput').value, /infused over 1\.25 hours/);
  assert.equal(app.run('currentTrialResult.dose'), 1000.5);
  // Within-target notes do not require an irrelevant adjustment regimen.
  app = harness(); app.demo(); app.element('tdmPeak').value = '22.88'; app.element('tdmTrough').value = '13.26';
  for (const id of ['nextDose','noteDilution','noteTroughTime','notePeakTime']) app.element(id).value = '';
  assert.equal(app.run('generateNote()'), true);
  assert.match(app.element('noteOutput').value, /Keep current dosage/);

  // Clipboard API denial, absence, false legacy copy and throwing legacy copy are distinct.
  for (const options of [{ clipboardThrows:true }, { noClipboard:true }]) {
    app = harness(options); app.demo();
    assert.equal(await app.run('copyNote()'), true);
    assert.equal(app.artifacts.fallbacks, 1);
    assert.equal(app.artifacts.removed.filter(n => n.tagName === 'textarea').length, 1);
  }
  for (const options of [
    { clipboardThrows:true, fallbackResult:false },
    { noClipboard:true, fallbackThrows:true }
  ]) {
    app = harness(options); app.demo();
    assert.equal(await app.run('copyNote()'), false);
    assert.match(app.element('noteGate').textContent, /手動複製/);
    assert.equal(app.element('noteOutput').selected, true);
    assert.equal(app.artifacts.removed.filter(n => n.tagName === 'textarea').length, 1);
  }
  // Do not report successful current copy if the clinician changes inputs during permission wait.
  app = harness({ clipboardPending:true }); app.demo();
  const copying = app.run('copyNote()'); app.element('weight').value = '101';
  app.artifacts.resolveCopy();
  assert.equal(await copying, false);
  assert.match(app.element('noteGate').textContent, /資料已變更/);

  // If permission is rejected after an edit, do not copy stale text via the legacy fallback.
  app = harness({ clipboardPending:true }); app.demo();
  const rejectedCopy = app.run('copyNote()'); app.element('weight').value = '101';
  app.artifacts.rejectCopy(new Error('Synthetic delayed permission denial'));
  assert.equal(await rejectedCopy, false);
  assert.equal(app.artifacts.fallbacks, 0);
  assert.match(app.element('noteGate').textContent, /資料已變更/);

  app = harness({ downloadThrows:true }); app.demo();
  assert.equal(app.run('downloadNote()'), false);
  assert.match(app.element('noteGate').textContent, /無法啟動/);
  assert.equal(app.artifacts.removed.filter(n => n.tagName === 'a').length, 1);
  app.artifacts.timers.forEach(fn => fn());
  assert.deepEqual(app.artifacts.revoked, ['blob:synthetic-note']);
  console.log('PASS: note template, current-value/snapshot validation, required inputs, MIC gate, UTF-8 bytes, clipboard success/fallback/failure/race, and download cleanup.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
