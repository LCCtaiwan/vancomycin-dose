// Local-only browser regression. Synthetic demo/test data; no patient inputs.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.join(__dirname,'..');
const artifacts = process.env.VANCO_TEST_ARTIFACTS || '/tmp/vancomycin-browser-qa';
fs.mkdirSync(artifacts,{recursive:true});
const server = http.createServer((req,res) => {
  const file = req.url === '/favicon.svg' ? 'favicon.svg' : 'index.html';
  res.setHeader('Content-Type',file.endsWith('svg')?'image/svg+xml':'text/html;charset=utf-8');
  res.end(fs.readFileSync(path.join(root,file)));
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const errors = [], externalRequests = [];
  try {
    for (const width of [1440,390]) {
      const context = await browser.newContext({viewport:{width,height:900},acceptDownloads:true,permissions:['clipboard-read','clipboard-write']});
      const page = await context.newPage();
      page.on('pageerror',error => errors.push(error.message));
      page.on('console',message => {if(message.type()==='error') errors.push(message.text())});
      await page.route('**/*',route => {
        const url = route.request().url();
        if (!url.startsWith(origin) && !url.startsWith('blob:')) { externalRequests.push(url); return route.abort(); }
        return route.continue();
      });
      await page.goto(origin);
      await page.locator('#downloadNote').click();
      assert.match(await page.locator('#noteGate').innerText(),/請先完成/);
      await page.locator('#loadDemo').click();
      let note = await page.locator('#noteOutput').inputValue();
      assert.match(note,/349\.67/);assert.match(note,/CrCl: 82\.9/);assert.match(note,/Trough sample: 2026-08-03 08:19/);
      await page.locator('#copyNote').click();
      assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),note);
      const [download] = await Promise.all([page.waitForEvent('download'),page.locator('#downloadNote').click()]);
      assert.equal(download.suggestedFilename(),'vancomycin-pharmacy-note.txt');
      const bytes = fs.readFileSync(await download.path());
      assert.deepEqual([...bytes.subarray(0,3)],[239,187,191]);
      assert.equal(bytes.subarray(3).toString('utf8'),note);
      await page.locator('#weight').fill('95');
      assert.equal(await page.locator('#noteOutput').inputValue(),'');
      await page.locator('#generateNote').click();
      assert.match(await page.locator('#noteOutput').inputValue(),/Wt 95kg/);
      // Paste real-shaped synthetic table spanning midnight. Never silently insert a dose time.
      await page.locator('#tab-his2').click();
      await page.locator('#his2Format').selectOption('table');
      const table = '採血時間\t檢驗項目\t結果\t單位\n115/10/27 23:40\tCRE\t1.7\tmg/dL\n115/10/27 23:50\tTrough\t9.3\tµg/mL\n115/10/28 03:20\tPeak\t25.4\tmg/L';
      await page.locator('#his2Paste').fill(table);
      await page.locator('#parseHis2').click();
      assert.equal(await page.locator('#scr').inputValue(),'0.6');
      assert.equal(await page.locator('#applyHis2').isDisabled(),true);
      await page.locator('#his2Reviewed').check();
      await page.locator('#applyHis2').click();
      assert.equal(await page.locator('#scr').inputValue(),'1.7');
      assert.equal(await page.locator('#tdmTrough').inputValue(),'9.3');
      assert.equal(await page.locator('#tdmPeak').inputValue(),'25.4');
      assert.equal(await page.locator('#tdmTroughTime').inputValue(),'2026-10-27T23:50');
      assert.equal(await page.locator('#tdmPeakTime').inputValue(),'2026-10-28T03:20');
      assert.equal(await page.locator('#tdmDoseTime').inputValue(),'');
      await page.locator('#calculateAuc').click();
      assert.equal(await page.locator('#aucResults').isVisible(),false);
      await page.locator('#tdmDoseTime').fill('2026-10-28T00:00');
      await page.locator('#calculateAuc').click();
      assert.equal(await page.locator('#aucResults').isVisible(),true);
      await page.locator('#noteTroughTime').fill('2026-10-29T11:30');
      await page.locator('#notePeakTime').fill('2026-10-29T14:00');
      await page.locator('#generateNote').click();
      note = await page.locator('#noteOutput').inputValue();
      assert.match(note,/CRE: 1\.7mg\/dL/);assert.match(note,/2026-10-27 23:50/);assert.doesNotMatch(note,/CRE: 0\.6/);
      assert.ok(note.includes((await page.locator('#aucValue').innerText()).split(' ')[0]));
      await page.locator('#tdmMic').fill('2');
      await page.locator('#generateNote').click();
      assert.equal(await page.locator('#noteOutput').inputValue(),'');
      assert.match(await page.locator('#noteGate').innerText(),/MIC/);
      assert.equal(await page.locator('#aucStatus').innerText(),'需人工判讀（MIC≠1）');
      await page.locator('#tab-his2').click();
      await page.locator('#his2Paste').fill(table+'\n115/10/28 04:00\tCRE\t2.2\tmg/dL');
      await page.locator('#parseHis2').click();
      assert.match(await page.locator('#his2Messages').innerText(),/CRE 有 2 筆/);
      await page.locator('#his2Reviewed').check();
      assert.equal(await page.locator('#applyHis2').isDisabled(),true);
      // A new paste hides/invalidates the old preview; unknown units fail closed.
      await page.locator('#his2Paste').fill('採血時間\t檢驗項目\t結果\t單位\n115/10/28 08:00\tCRE\t150\tµmol/L');
      assert.equal(await page.locator('#preview').isVisible(),false);
      await page.locator('#parseHis2').click();
      assert.match(await page.locator('#his2Messages').innerText(),/單位需為 mg\/dL/);
      await page.screenshot({path:path.join(artifacts,`parser-${width}.png`),fullPage:true});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
      await page.locator('#loadDemo').click();
      await page.screenshot({path:path.join(artifacts,`demo-${width}.png`),fullPage:true});
      await page.locator('#clearPage').click();
      await page.waitForLoadState();
      assert.equal(await page.locator('#noteOutput').inputValue(),'');
      assert.equal(await page.locator('#his2Paste').inputValue(),'');
      await context.close();
    }
    const offline = await browser.newContext({acceptDownloads:true});
    const page = await offline.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('file://' + path.join(root,'index.html'));
    await page.locator('#loadDemo').click();
    const note = await page.locator('#noteOutput').inputValue();
    const [download] = await Promise.all([page.waitForEvent('download'),page.locator('#downloadNote').click()]);
    assert.equal(fs.readFileSync(await download.path()).subarray(3).toString('utf8'),note);
    await offline.close();
    assert.deepEqual(errors,[]);assert.deepEqual(externalRequests,[]);
    console.log('PASS: Chromium desktop/mobile, supported paste and review, midnight TDM, missing dose-time gate, input invalidation/recalculation, MIC gate, duplicate/unit errors, clipboard, exact TXT+BOM, reset, offline file://, no external requests or console errors.');
    console.log('Screenshots: '+artifacts);
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
