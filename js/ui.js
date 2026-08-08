(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  let mode = 'empiric';
  let empiricResult = null;
  let aucResult = null;
  let noteGenerated = false;
  let noteOutputEdited = false;

  function value(id) { return $(id).value.trim(); }
  function number(id) { return Number(value(id)); }
  function checked(id) { return $(id).checked; }
  function esc(input) { return String(input ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])); }
  function fmt(input, digits = 2) { return Number.isFinite(Number(input)) ? Number(input).toFixed(digits) : '—'; }
  function lines(input) { return value(input).split(/\n+/).map((item) => item.trim()).filter(Boolean); }
  function setStatus(message, type = '') { const node = $('statusMessage'); node.textContent = message; node.className = `status-message ${type}`; }
  function show(id, visible) { $(id).hidden = !visible; }

  function setupDateTimePicker(baseId) {
    const date = $(`${baseId}Date`);
    const hour = $(`${baseId}Hour`);
    const minute = $(`${baseId}Minute`);
    hour.innerHTML = '<option value="">時</option>' + Array.from({ length: 24 }, (_, value) => `<option value="${String(value).padStart(2, '0')}">${String(value).padStart(2, '0')}</option>`).join('');
    minute.innerHTML = '<option value="">分</option>' + Array.from({ length: 60 }, (_, value) => `<option value="${String(value).padStart(2, '0')}">${String(value).padStart(2, '0')}</option>`).join('');
    const sync = () => {
      $(baseId).value = date.value && hour.value !== '' && minute.value !== '' ? `${date.value}T${hour.value}:${minute.value}` : '';
      $(baseId).dispatchEvent(new Event('input', { bubbles: true }));
    };
    date.addEventListener('change', sync);
    hour.addEventListener('change', sync);
    minute.addEventListener('change', sync);
  }

  function setToday() {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (!$('noteDate').value) $('noteDate').value = date;
  }

  function setMode(next) {
    mode = next;
    $('mode-empiric').classList.toggle('active', mode === 'empiric');
    $('mode-auc').classList.toggle('active', mode === 'auc');
    show('empiricInputFields', mode === 'empiric');
    show('empiricSection', mode === 'empiric');
    show('aucSection', mode === 'auc');
    setStatus('');
  }

  function patientData() {
    return {
      age: value('age'),
      sexLabel: $('sex').selectedOptions[0].textContent, tbw: value('tbw'), pharmacist: value('pharmacist'),
      phone: value('phone'), noteDate: value('noteDate'),
    };
  }

  function clinicalData() {
    return { indication: value('indication'), startDate: value('startDate'), diagnosis: lines('diagnosis'), cultures: lines('cultures'), labs: value('labs'), vitals: value('vitals'), assessment: value('assessment') };
  }

  function renderErrors(container, errors) {
    container.innerHTML = `<div class="result-banner below"><strong>無法計算</strong><ul class="error-list">${errors.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>`;
    show(container.id, true);
  }

  function candidateOptions(items, selected) {
    return items.map((dose) => `<option value="${dose}" ${Number(dose) === Number(selected) ? 'selected' : ''}>${dose} mg（${fmt(dose / Number(value('tbw')), 1)} mg/kg）</option>`).join('');
  }

  function renderEmpiric(result) {
    const container = $('empiricResult');
    if (!result.ok) return renderErrors(container, result.errors);
    const loadDefault = result.loadingCandidates[Math.min(1, result.loadingCandidates.length - 1)];
    const maintDefault = result.maintenanceCandidates[Math.floor(result.maintenanceCandidates.length / 2)];
    container.innerHTML = `<div class="result-banner target"><strong>起始劑量候選已產生，尚未確認</strong><span>Loading 20 mg/kg；maintenance 15 mg/kg/dose。請由藥師確認最終劑量與 interval。</span></div>
      <div class="metric-grid"><div class="metric"><small>IBW</small><strong>${fmt(result.ibw)} kg</strong></div><div class="metric"><small>CrCl dosing weight</small><strong>${fmt(result.crclWeight.weight)} kg</strong><small>${esc(result.crclWeight.label)}</small></div><div class="metric"><small>CrCl</small><strong>${fmt(result.crcl, 1)} mL/min</strong></div><div class="metric"><small>間隔提示</small><strong>${result.interval.intervalH ? `q${result.interval.intervalH}h` : '人工判斷'}</strong></div></div>
      <div class="form-grid"><label>Loading dose 候選<select id="loadingChoice">${candidateOptions(result.loadingCandidates, loadDefault)}</select></label><label>Maintenance dose 候選<select id="maintenanceChoice">${candidateOptions(result.maintenanceCandidates, maintDefault)}</select></label><label>Maintenance interval<select id="maintenanceTau">${[8,12,24,48].map((h) => `<option value="${h}" ${h === result.interval.intervalH ? 'selected' : ''}>q${h}h</option>`).join('')}</select></label></div>
      <ul class="warning-list">${(result.warnings.length ? result.warnings : ['候選值僅供藥師確認，未自動定案。']).map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
    show(container.id, true);
  }

  function calculateEmpiric() {
    empiricResult = VancoPK.empiricDosing({ age: number('age'), tbw: number('tbw'), heightCm: number('heightCm'), scr: number('scr'), sexMale: $('sex').value === 'male', rrtType: value('rrtType') });
    renderEmpiric(empiricResult);
    if (empiricResult.ok) { setStatus('起始劑量候選已完成，請確認最終方案。', 'success'); $('confirmPlan').checked = false; $('noteGate').textContent = '尚未完成確認'; }
    else setStatus('請修正輸入後重新計算。', 'error');
  }

  function chartPoints(profile, key, max, width, height, padding, maxTime) {
    return profile.map((row, index) => {
      const x = padding.left + (row.timeH / maxTime) * (width - padding.left - padding.right);
      const y = height - padding.bottom - (row[key] / max) * (height - padding.top - padding.bottom);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  function renderConcentrationChart(current, next, tau) {
    if (!current?.length) return '';
    const allValues = [...current, ...(next || [])].map((row) => row.concentration);
    const max = Math.max(20, ...allValues) * 1.12;
    const maxTime = Math.max(current.at(-1).timeH, next?.at(-1)?.timeH || 0);
    const width = 760;
    const height = 280;
    const padding = { left: 52, right: 18, top: 24, bottom: 40 };
    const plotHeight = height - padding.top - padding.bottom;
    const y = (value) => height - padding.bottom - (value / max) * plotHeight;
    const grid = [0, max / 2, max].map((tick) => `<line x1="${padding.left}" y1="${y(tick).toFixed(1)}" x2="${width - padding.right}" y2="${y(tick).toFixed(1)}" class="chart-grid-line"/><text x="${padding.left - 8}" y="${(y(tick) + 4).toFixed(1)}" text-anchor="end" class="chart-axis-label">${fmt(tick, 0)}</text>`).join('');
    const xLabels = [0, 4, 9, 14].map((doseIndex) => {
      const timeH = Math.min(doseIndex * tau, maxTime);
      const x = padding.left + (timeH / maxTime) * (width - padding.left - padding.right);
      return `<text x="${x.toFixed(1)}" y="${height - 14}" text-anchor="middle" class="chart-axis-label">${timeH.toFixed(0)}h</text>`;
    }).join('');
    const series = [
      { profile: current, key: 'concentration', color: '#176b9d', label: '目前方案' },
      ...(next ? [{ profile: next, key: 'concentration', color: '#c27628', label: '人工新方案' }] : []),
    ];
    return `<div class="chart-wrap"><div class="chart-legend">${series.map((item) => `<span><i style="background:${item.color}"></i>${item.label}</span>`).join('')}</div><svg class="concentration-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="15 次給藥期間連續血中濃度變化圖"><line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" class="chart-axis-line"/>${grid}<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" class="chart-axis-line"/>${series.map((item) => `<polyline points="${chartPoints(item.profile, item.key, max, width, height, padding, maxTime)}" fill="none" stroke="${item.color}" class="chart-series"/>`).join('')}${xLabels}<text x="${width / 2}" y="${height - 1}" text-anchor="middle" class="chart-axis-label">time (hr)</text><text x="14" y="${height / 2}" text-anchor="middle" transform="rotate(-90 14 ${height / 2})" class="chart-axis-label">mg/L</text></svg></div>`;
  }

  function renderExcelProfileTable(current, next) {
    if (!current?.length) return '';
    const columns = current.map((row) => `<th>${row.doseNumber} Dose</th>`).join('');
    const row = (label, key, profile, className = '') => `<tr class="${className}"><th scope="row">${label}</th>${current.map((_, index) => `<td>${profile?.[index] ? fmt(profile[index][key], 2) : '—'}</td>`).join('')}</tr>`;
    return `<div class="table-scroll excel-profile-scroll"><table class="result-table excel-profile-table"><thead><tr><th scope="col">濃度（mg/L）</th>${columns}</tr></thead><tbody>${row('目前 Peak', 'peak', current, 'current-peak')}${row('目前 Trough', 'trough', current, 'current-trough')}${next ? `${row('New Peak', 'peak', next, 'new-peak')}${row('New Trough', 'trough', next, 'new-trough')}` : `<tr class="profile-empty"><th scope="row">New Peak／Trough</th><td colspan="15">輸入更改 dose 後顯示</td></tr>`}</tbody></table></div>`;
  }

  function renderAuc(result) {
    const container = $('aucResult');
    if (!result.ok) return renderErrors(container, result.errors);
    const warningItems = [...(result.warnings || [])];
    warningItems.push('請人工確認腎功能近期穩定，且兩點濃度適用於穩態或可合理套用一室模型。');
    const newBlock = result.newRegimen ? `<h3>新方案人工試算</h3><div class="metric-grid"><div class="metric"><small>New AUC24</small><strong>${fmt(result.newRegimen.auc24, 1)}</strong></div><div class="metric"><small>New AUC/MIC</small><strong>${fmt(result.newRegimen.aucOverMic, 1)}</strong></div><div class="metric"><small>Predicted Peak</small><strong>${fmt(result.newRegimen.steadyPeak)} mg/L</strong></div><div class="metric"><small>Predicted Trough</small><strong>${fmt(result.newRegimen.steadyTrough)} mg/L</strong></div></div>` : '<p class="helper">輸入更改 dose 後，會自動沿用目前 interval／輸注時間試算；也可另外填寫新 interval 或輸注時間。</p>';
    container.innerHTML = `<div class="result-banner ${result.status}"><strong>AUC24 ${fmt(result.auc24, 1)} mg·h/L · ${result.status === 'target' ? '達到目標' : result.status === 'below' ? '低於目標' : '高於目標／安全性警示'}</strong><span>AUC/MIC ${fmt(result.aucOverMic, 1)} · 目標 400–600 mg·h/L</span></div>
      <div class="metric-grid"><div class="metric"><small>ke</small><strong>${fmt(result.ke, 5)} h⁻¹</strong></div><div class="metric"><small>半衰期 t½</small><strong>${fmt(result.halfLife)} hr</strong></div><div class="metric"><small>真實 Cmax / Cmin</small><strong>${fmt(result.cMaxTrue)} / ${fmt(result.cMinTrue)}</strong></div><div class="metric"><small>Vd / CL</small><strong>${fmt(result.vd)} / ${fmt(result.cl)}</strong><small>L／L/hr</small></div><div class="metric"><small>預計給藥前血中濃度</small><strong>${fmt(result.predictedPreDoseConc)} mg/L</strong></div></div>
      <p class="helper">trough 到給藥時間 ${fmt(result.troughToDose, 2)} hr · peak 到給藥時間 ${fmt(result.peakFromDose, 2)} hr · trough 到 peak 時間 ${fmt(result.eliminationWindow, 2)} hr · 輸注期間 AUC ${fmt(result.aucInfusion)} · 排除期間 AUC ${fmt(result.aucElim)}</p>
      ${newBlock}<h3 class="result-section-title">Excel 15-dose Peak／Trough 比較</h3>${renderExcelProfileTable(result.currentProfile, result.newRegimen?.profile)}<details class="optional-block chart-details"><summary>查看連續濃度曲線（輔助）</summary>${renderConcentrationChart(result.currentContinuousProfile, result.newRegimen?.continuousProfile, result.tau)}<p class="helper">曲線呈現輸注期間上升、停藥後指數下降。</p></details>${warningItems.length ? `<ul class="warning-list">${warningItems.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}`;
    show(container.id, true);
  }

  function aucInputsReady() {
    return ['currentDose', 'currentTau', 'currentTInf', 'doseDate', 'troughDate', 'troughConc', 'peakDate', 'peakConc'].every((id) => value(id) !== '');
  }

  function calculateAuc(silent = false) {
    const hasNew = value('newDose');
    aucResult = VancoPK.twoLevelAuc({
      dose: number('currentDose'), tau: number('currentTau'), tInf: number('currentTInf'), doseTime: value('doseDate'), troughTime: value('troughDate'), peakTime: value('peakDate'), doseDate: value('doseDate'), troughDate: value('troughDate'), peakDate: value('peakDate'), trough: number('troughConc'), peak: number('peakConc'), mic: number('mic') || 1, nextInfusionDelay: number('nextDelay') || 0, rrtType: value('rrtType'),
      ...(hasNew ? { newDose: number('newDose'), newTau: number('newTau') || number('currentTau'), newTInf: number('newTInf') || number('currentTInf') } : {}),
    });
    renderAuc(aucResult);
    if (aucResult.ok) { if (!silent) setStatus('AUC 計算完成；請確認是否採用人工試算的新方案。', 'success'); $('confirmPlan').checked = false; $('noteGate').textContent = '尚未完成確認'; }
    else if (!silent) setStatus('請檢查濃度與採血時序。', 'error');
  }

  function selectedRegimen() {
    if (mode === 'empiric' && empiricResult?.ok) return { loading: number('loadingChoice'), dose: number('maintenanceChoice'), tau: number('maintenanceTau'), tInf: 1 };
    if (mode === 'auc' && aucResult?.ok) {
      if (aucResult.newRegimen && checked('useNewPlan')) return { dose: aucResult.newRegimen.dose, tau: aucResult.newRegimen.tau, tInf: aucResult.newRegimen.tInf };
      return { dose: aucResult.dose, tau: aucResult.tau, tInf: aucResult.tInf };
    }
    return null;
  }

  function effectiveAucResult() {
    if (!aucResult?.ok) return aucResult;
    if (aucResult.newRegimen && (aucResult.status === 'below' || aucResult.status === 'above')) {
      return { ...aucResult, auc24: aucResult.newRegimen.auc24, aucOverMic: aucResult.newRegimen.aucOverMic, status: VancoPK.classifyAuc(aucResult.newRegimen.auc24) };
    }
    return aucResult;
  }

  function generateNote(silent = false) {
    const regimen = selectedRegimen();
    const fail = (message) => { if (!silent) setStatus(message, 'error'); return false; };
    if (!regimen) return fail('請先完成起始劑量或 AUC 計算。');
    if (!checked('confirmPlan')) return fail('請先勾選藥師確認，才能產生完成版 note。');
    if (mode === 'auc' && (aucResult.status === 'below' || aucResult.status === 'above') && (!aucResult.newRegimen || !checked('useNewPlan'))) return fail('AUC 低於或高於目標時，請先輸入、試算並勾選採用新方案。');
    const result = mode === 'auc' && checked('useNewPlan') ? effectiveAucResult() : mode === 'auc' ? aucResult : { status: 'empiric', mic: 1 };
    const note = VancoNote.makeNote({ patient: patientData(), clinical: clinicalData(), result: { ...result, trough: mode === 'auc' ? aucResult.trough : '', peak: mode === 'auc' ? aucResult.peak : '', troughTime: mode === 'auc' ? aucResult.troughTime : '', peakTime: mode === 'auc' ? aucResult.peakTime : '', troughDate: mode === 'auc' ? aucResult.troughDate : '', peakDate: mode === 'auc' ? aucResult.peakDate : '' }, regimen, monitoring: { followUp: value('followUp') } });
    $('noteOutput').value = note;
    $('noteActions').hidden = false;
    $('noteGate').textContent = '已確認，可編輯與匯出';
    noteGenerated = true;
    noteOutputEdited = false;
    if (!silent) setStatus('完成版 note 已產生；請再人工核對內容。', 'success');
    return true;
  }

  function refreshGeneratedNote() {
    if (noteGenerated && !noteOutputEdited && checked('confirmPlan')) generateNote(true);
  }

  async function copyNote() {
    const note = $('noteOutput').value;
    if (!note) return setStatus('目前沒有可複製的 note。', 'error');
    try { await navigator.clipboard.writeText(note); setStatus('完整 note 已複製。', 'success'); }
    catch (error) { $('noteOutput').focus(); $('noteOutput').select(); document.execCommand('copy'); setStatus('已使用備援方式複製 note。', 'success'); }
  }

  function downloadNote() {
    const note = $('noteOutput').value;
    if (!note) return setStatus('目前沒有可匯出的 note。', 'error');
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, note], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `vancomycin_pharmacy_note_${stamp}.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0); setStatus('TXT 已匯出（UTF-8 BOM）。', 'success');
  }

  $('mode-empiric').addEventListener('click', () => setMode('empiric'));
  $('mode-auc').addEventListener('click', () => setMode('auc'));
  $('calculateEmpiric').addEventListener('click', calculateEmpiric);
  $('calculateAuc').addEventListener('click', calculateAuc);
  ['currentDose', 'currentTau', 'currentTInf', 'doseDate', 'troughDate', 'troughConc', 'peakDate', 'peakConc', 'mic', 'nextDelay', 'newDose', 'newTau', 'newTInf'].forEach((id) => {
    $(id).addEventListener('input', () => { if (mode === 'auc' && aucInputsReady()) calculateAuc(true); });
    $(id).addEventListener('change', () => { if (mode === 'auc' && aucInputsReady()) calculateAuc(true); });
  });
  $('generateNote').addEventListener('click', generateNote);
  $('refreshNote').addEventListener('click', () => {
    if (generateNote()) setStatus('已重新讀取 Pharmacy note 資料並更新。', 'success');
  });
  $('copyNote').addEventListener('click', copyNote);
  $('downloadNote').addEventListener('click', downloadNote);
  $('resetForm').addEventListener('click', () => { if (window.confirm('清除本頁所有病人資料與計算結果？')) window.location.reload(); });
  $('confirmPlan').addEventListener('change', () => { $('noteGate').textContent = checked('confirmPlan') ? '已勾選確認' : '尚未完成確認'; });
  $('noteOutput').addEventListener('input', () => { noteOutputEdited = true; });
  ['indication', 'startDate', 'pharmacist', 'phone', 'noteDate', 'diagnosis', 'cultures', 'labs', 'vitals', 'assessment', 'followUp', 'useNewPlan'].forEach((id) => {
    $(id).addEventListener('input', refreshGeneratedNote);
    $(id).addEventListener('change', refreshGeneratedNote);
  });
  ['doseDate', 'troughDate', 'peakDate'].forEach(setupDateTimePicker);
  setToday();
})();
