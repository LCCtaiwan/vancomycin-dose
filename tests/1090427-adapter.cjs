const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const inlineAdapter=html.slice(html.indexOf('/* Source-aware PharmacyNote'),html.indexOf('    const tabs'));
const adapterModule={exports:{}};new Function('module',inlineAdapter)(adapterModule);
const {parsePharmacyLabPaste:parse,confirmNoteSelection:confirm,strictDate,valueInfo}=adapterModule.exports;
// Hand-authored synthetic data only. No patient data or real source observations.
const H=['檢體名稱','報告日期','檢驗項目','檢驗報告','單位','標準(低)','標準(高)','報告者'];
const V=['時間','體溫','部位','脈搏','呼吸','血壓','血壓位','疼痛','SpO2(%)'];
const lab=(name='CRE',value='0',date='2024/02/29',unit='mg/dl',specimen='Blood')=>[specimen,date,name,value,unit,'0.1','2','Synthetic reporter'];
const tsv=rows=>rows.map(r=>r.join('\t')).join('\n');
test('C:J and A:J preserve positioning and raw cells',()=>{
 for(const prefix of [[],['','']]){
  const p=parse(tsv([[...prefix,...H],[...prefix,...lab()]]));
  assert.equal(p.recognizesLayout,true);assert.equal(p.canApply,true);
  assert.equal(p.records.length,1);assert.equal(p.records[0].numericValue,0);
  assert.equal(p.records[0].dateKind,'report');assert.equal(p.records[0].reportDateISO,'2024-02-29');
  assert.deepEqual(p.records[0].provenance.rawCells,[...prefix,...lab()]);
 }
});
test('missing, zero, comparator, scientific, and malformed values distinct',()=>{
 for(const [raw,kind,n] of [['','missing',null],['  ','missing',null],['0','number',0],['-0','number',-0],['1.2e2','number',120],['<0.2','qualified',null],['1,234','text',null],['NaN','text',null],['Infinity','text',null],['1e999','text',null],['1 mg','text',null]]){
  assert.deepEqual(valueInfo(raw),{numericValue:n,valueKind:kind});
 }
});
test('strict calendar recognition never guesses ROC, serials, compact, dates with time',()=>{
 for(const d of ['109/04/27','1090427','44123','04/27/2020','2023/02/29','2024/13/01','2024/01/00','2024-02/29','2024/2/29','2024/02/29 10:00','0000/01/01'])assert.equal(strictDate(d).iso,null,d);
 assert.equal(strictDate('2024-02-29').iso,'2024-02-29');
});
test('date carry scoped to proven header block and new dates override',()=>{
 const p=parse(tsv([H,lab(),lab('Na','1','','mmol/L',''),lab('K','2','2025/01/01','mmol/L',''),lab('Mg','3','','mg/dl',''),H,lab('BUN','4','','mg/dl','')]),{allowBlockDateCarry:true});
 assert.deepEqual(p.records.map(r=>r.reportDateISO),['2024-02-29','2024-02-29','2025-01-01','2025-01-01',null]);
 assert.equal(p.records[1].reportDateRaw,'');assert.equal(p.records[1].provenance.reportDateSourceRow,2);assert.equal(p.records[1].provenance.dateInherited,true);
});
test('invalid date and specimen change terminate previous date carry',()=>{
 const p=parse(tsv([H,lab(),lab('K','1','not-a-date','',''),lab('Na','2','','',''),lab('Mg','1','2025/01/01','','Blood'),lab('K','2','','','Urine')]));
 assert.deepEqual(p.records.map(r=>r.reportDateISO),['2024-02-29',null,null,'2025-01-01',null]);
});
test('blank/unrecognized/PK boundaries cannot leak carry into subsequent rows',()=>{
 for(const boundary of [[],['Peak','22'],['different table']]){
  const p=parse(tsv([H,lab(),boundary,lab('Na','1','','mmol/L','')]));
  assert.equal(p.records.length,1);assert.ok(p.rejectedRows.length);
 }
});
test('headerless pasted values rejected and nonlab leading identifiers not shifted',()=>{
 assert.equal(parse(tsv([lab()])).canApply,false);
 assert.equal(parse(tsv([lab()])).recognizesLayout,false);
 assert.equal(parse(tsv([['','',...H],['nonempty','',...lab()]])).records.length,0);
});
test('vitals independent date/time raw; never inherits report or today',()=>{
 const p=parse(tsv([H,lab(),V,['1234','0','site','80','16','120/80','arm','0','98']]));
 assert.equal(p.vitals.length,1);assert.equal(p.vitals[0].timeRaw,'1234');
 assert.equal(p.vitals[0].measurementDateISO,null);assert.equal(p.vitals[0].measurementTime,null);
 assert.equal(p.vitals[0].valuesRaw['體溫'],'0');assert.equal(p.vitals[0].valuesRaw['血壓'],'120/80');
});
test('all analytes and duplicates retained; units/reference raw without normality judgments',()=>{
 const p=parse(tsv([H,lab('Unknown','1','2024/02/29',' Odd Unit '),lab('CRE','','','',''),lab('CRE','0','','','')]));
 assert.equal(p.records.length,3);assert.equal(p.records[0].unitRaw,' Odd Unit ');
 assert.equal(p.records[1].unitRaw,'');assert.equal(p.records[1].valueKind,'missing');assert.equal(p.records[2].numericValue,0);
 assert.equal('normal' in p.records[0],false);
});
test('explicit ID confirmation note-only, privacy projection, no sample/calculator promotion',()=>{
 const p=parse(tsv([H,lab('Vancomycin','22'),lab('CRE','0')]));
 assert.throws(()=>confirm(p),/confirmation/);
 assert.throws(()=>confirm(p,{confirmed:true,recordIds:['missing']}),/Unknown/);
 assert.throws(()=>confirm(p,{confirmed:true,recordIds:['lab-2','lab-2']}),/Unique/);
 const c=confirm(p,{confirmed:true,recordIds:['lab-2']});
 assert.equal(c.labs.length,1);assert.equal(c.destination,'note-only');assert.equal(c.calculatorInputsAllowed,false);assert.deepEqual(c.samplingTimes,[]);
 assert.equal(c.labs[0].dateKind,'report');assert.equal('reporterRaw' in c.labs[0],false);assert.equal('rawCells' in c.labs[0].provenance,false);
 assert.equal(JSON.stringify(c).includes('Synthetic reporter'),false);
});
test('CRLF, BOM, trailing blank lines supported; malformed short rows excluded',()=>{
 const p=parse('\ufeff'+tsv([H,lab()]).replace(/\n/g,'\r\n')+'\r\n');assert.equal(p.records.length,1);
 assert.equal(parse(tsv([H,['Blood','2024/02/29','CRE','1']])).records.length,0);
});
test('browser global loads without dependencies',()=>{
 const vm=require('node:vm'),fs=require('node:fs');const ctx={};vm.createContext(ctx);vm.runInContext(inlineAdapter,ctx);
 assert.equal(typeof ctx.PharmacyLabAdapter.parsePharmacyLabPaste,'function');
});

test('blank date is unknown by default; optional carry must be explicitly enabled',()=>{
 const input=tsv([H,lab(),lab('K','1','','mmol/L','')]);
 const p=parse(input);assert.equal(p.records[1].reportDateISO,null);assert.equal(p.records[1].provenance.dateInherited,false);assert.equal(p.records[1].provenance.suggestedReportDateISO,'2024-02-29');
 assert.equal(parse(input,{allowBlockDateCarry:true}).records[1].reportDateISO,'2024-02-29');
 assert.equal(parse(input,{allowBlockDateCarry:'true'}).records[1].reportDateISO,null);
});
