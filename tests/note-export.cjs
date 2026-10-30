// Run: node tests/note-export.cjs. Only repository synthetic demo data is used.
// This tests DOM/controller behavior, not clinical validation or a real browser permission UI.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(process.env.NOTE_TEST_HTML || path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
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
  const demo = () => { element('loadDemo').listeners.click[0](); element('noteMode').value = 'manual'; run('generateNote()'); assert.ok(element('noteOutput').value.startsWith('佛教大林慈濟綜合醫院'), element('noteGate').textContent); };
  return { element, run, demo, artifacts };
}
async function main() {
  let app = harness(); app.demo();
  for(const id of ['notePatientName','noteWard','noteAdmissionDate','noteTransferDate','noteAttending','notePharmacist','notePhone','noteFillDate','noteReferences']) app.element(id).value='SYNTHETIC PREVIOUS CASE';
  app.demo();
  assert.doesNotMatch(app.element('noteOutput').value,/SYNTHETIC PREVIOUS CASE/);
  for(const id of ['notePatientName','noteWard','noteAdmissionDate','noteTransferDate','noteAttending','notePharmacist','notePhone','noteFillDate','noteReferences']) assert.equal(app.element(id).value,'',id+' must reset for demo');
  const fields = {notePatientName:'SYNTHETIC PERSON',patientId:'TEST-001',noteWard:'TEST-WARD',noteAdmissionDate:'2026-01-02',noteTransferDate:'2026-01-03',noteAttending:'TEST DOCTOR',notePharmacist:'TEST PHARMACIST',notePhone:'TEST-EXT',noteFillDate:'2026-01-04',noteAssessment:'Synthetic manual assessment only.',notePlan:'Synthetic manual plan only.',noteReferences:'Synthetic verified source.'};
  for (const [id,value] of Object.entries(fields)) app.element(id).value=value;
  assert.equal(app.run('generateNote()'),true);
  const valid = app.element('noteOutput').value;
  const expected=['佛教大林慈濟綜合醫院','藥師評估記錄 (Pharmacy note)','病人姓名：　病歷號：TEST-001　病房號：','住院日期：　轉入日期：　主治醫師：','S: Vancomycin','O:','Dx:','A:\nSynthetic manual assessment only.','P:\nSynthetic manual plan only.','參考資料\nSynthetic verified source.','藥師：TEST PHARMACIST　連絡電話：TEST-EXT　填寫日期：2026-01-04'];
  let previous=-1; for(const text of expected){const at=valid.indexOf(text);assert.ok(at>previous,text);previous=at;}
  assert.doesNotMatch(valid,/NaN|undefined|Infinity|Suggested increasing|Keep current dosage|weekly|reassess|SYNTHETIC PERSON|TEST DOCTOR|TEST-WARD/);
  assert.equal(await app.run('copyNote()'),true);assert.equal(app.artifacts.clipboard[0],valid);
  assert.equal(app.run('downloadNote()'),true);const bytes=Buffer.from(await app.artifacts.blobs[0].arrayBuffer());assert.deepEqual([...bytes.subarray(0,3)],[239,187,191]);assert.equal(bytes.subarray(3).toString('utf8'),valid);
  for(const id of Object.keys(fields)){app=harness();app.demo();app.element(id).value='changed';assert.equal(app.run('downloadNote()'),false,id);assert.equal(app.artifacts.blobs.length,0);}
  for(const id of Object.keys(fields).filter(id=>id!=='patientId')){app=harness();app.demo();app.element(id).listeners.input.forEach(fn=>fn());assert.equal(app.element('noteOutput').value,'',id);}
  app=harness();app.demo();const blank=app.element('noteOutput').value;
  assert.ok(blank.includes('住院日期：　轉入日期：　主治醫師：'));assert.ok(blank.endsWith('藥師：　連絡電話：　填寫日期：'));
  assert.ok(blank.includes('參考資料\n\n'));assert.doesNotMatch(blank,/Up To Date|sanford/);
  for(const [id,value,pattern] of [['noteAssessment','',/A：評估/],['notePlan','',/P：計畫/],['noteAdmissionDate','2026-02-30',/有效日期/],['tdmMic','2',/MIC/],['tdmPeak','0',/TDM/]]){app=harness();app.demo();app.element(id).value=value;assert.equal(app.run('generateNote()'),false,id);assert.equal(app.element('noteOutput').value,'');assert.match(app.element('noteGate').textContent,pattern);}
  for(const options of [{clipboardThrows:true},{noClipboard:true}]){app=harness(options);app.demo();assert.equal(await app.run('copyNote()'),true);assert.equal(app.artifacts.fallbacks,1);}
  app=harness({noClipboard:true,fallbackResult:false});app.demo();assert.equal(await app.run('copyNote()'),false);
  app=harness({clipboardPending:true});app.demo();const pending=app.run('copyNote()');app.element('notePlan').value='changed';app.artifacts.resolveCopy();assert.equal(await pending,false);
  app=harness({downloadThrows:true});app.demo();assert.equal(app.run('downloadNote()'),false);

  // Frozen project wording: mode and applicability explicitly confirmed, not inferred approval.
  app=harness();app.demo();app.element('noteMode').value='fixed';
  assert.equal(app.run('generateNote()'),true);
  const fixed=app.element('noteOutput').value;
  const legacy=fs.readFileSync(path.join(__dirname,'fixtures/legacy-soap-fragment-demo.expected.txt'),'utf8').trim();
  assert.equal(fixed.split('\nA:')[1].split('\n藥師：')[0].trim(),legacy.split('\nA:')[1].trim());
  assert.match(fixed,/Suggested increasing the Vancomycin dose to 1000 mg IVD Q12H/);
  app.element('noteTemplateReviewed').checked=false;assert.equal(app.run('generateNote()'),false);assert.match(app.element('noteGate').textContent,/核對固定句型/);
  app.element('noteTemplateReviewed').checked=true;app.element('notePlanChoice').value='';assert.equal(app.run('generateNote()'),false);
  app.element('notePlanChoice').value='adjust';app.element('noteTroughTime').value='';assert.equal(app.run('generateNote()'),false);
  app=harness();app.demo();app.element('noteMode').value='fixed';app.element('notePlanChoice').value='keep';assert.equal(app.run('generateNote()'),false);
  app=harness();app.demo();app.element('noteMode').value='fixed';app.element('tdmPeak').value='22.88';app.element('tdmTrough').value='13.26';app.element('notePlanChoice').value='keep';
  assert.equal(app.run('generateNote()'),false,'conflicting trial must not yield keep plan');
  for(const id of ['nextDose','nextInterval','nextInfusion','nextInfusionGap'])app.element(id).value='';
  assert.equal(app.run('generateNote()'),true);assert.match(app.element('noteOutput').value,/Keep current dosage and monitor vancomycin levels and renal function weekly\./);

  app=harness();app.demo();app.element('noteMode').value='fixed';app.element('nextDose').value='500';
  assert.equal(app.run('generateNote()'),true);
  assert.match(app.element('noteOutput').value,/1\. Suggest adjusting Vancomycin to 500 mg Q12H based on the patient’s AUC \(349\.67 mcg·h\/mL\)\./);
  assert.match(app.element('noteOutput').value,/2\. Suggested ordering Vancomycin trough level \(2026\/08\/05, 08:30 AM\) and peak level \(2026\/08\/05, 12:00 PM\)\./);
  assert.doesNotMatch(app.element('noteOutput').value,/will be ordered/);
  app.element('noteTemplateReviewed').checked=true;app.run('parseHis2()');assert.equal(app.element('noteTemplateReviewed').checked,false);
  app.element('noteTemplateReviewed').checked=true;app.element('selectAllPharmacyLabs').listeners.click[0]();assert.equal(app.element('noteTemplateReviewed').checked,false);
  console.log('PASS: full structure, privacy blanks, manual A/P, explicitly reviewed fixed project wording and plan gates, invalidation, UTF-8 copy/TXT bytes, fallback/failure/race. Not browser/HIS or clinical approval.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
