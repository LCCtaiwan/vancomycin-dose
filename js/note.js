(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VancoNote = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function text(value, fallback = '') {
    return value === undefined || value === null || String(value).trim() === '' ? fallback : String(value).trim();
  }

  function dateText(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return text(value);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  }

  function dateTimeText(value) {
    if (!value) return '';
    const raw = text(value);
    const match = raw.match(/^(\d{3,4})[\/-](\d{1,2})[\/-](\d{1,2})[ T](\d{1,2}):(\d{2})$/);
    if (match) {
      const year = Number(match[1]) < 1911 ? Number(match[1]) + 1911 : Number(match[1]);
      return `${year}/${String(Number(match[2])).padStart(2, '0')}/${String(Number(match[3])).padStart(2, '0')} ${String(Number(match[4])).padStart(2, '0')}:${match[5]}`;
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return text(value);
    return `${dateText(value)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  function levelDate(result, dateKey, timeKey) {
    const value = text(result[dateKey]);
    return value.includes('T') ? dateTimeText(value) : value || dateTimeText(result[timeKey]);
  }

  function listText(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join('; ');
    return text(value);
  }

  function hasNumber(value) {
    return value !== undefined && value !== null && String(value).trim() !== '' && Number.isFinite(Number(value));
  }

  function numberText(value, digits = 2) {
    return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '';
  }

  function regimenText(regimen) {
    if (!regimen || !regimen.dose || !regimen.tau) return '';
    const maintenance = `${regimen.dose} mg Q${regimen.tau}H IVD`;
    return regimen.loading ? `Loading ${regimen.loading} mg IV, then ${maintenance}` : maintenance;
  }

  function aucAssessment(status) {
    if (status === 'below') return 'Vancomycin AUC is below the target range. (400-600 ug·hr/ml)';
    if (status === 'above') return 'Vancomycin AUC is above the target range. (400-600 ug·hr/ml)';
    if (status === 'target') return 'Vancomycin AUC is within the target range. (400-600 ug·hr/ml)';
    return 'Initial Vancomycin dosing was evaluated based on body weight and renal function.';
  }

  function sexText(value) {
    if (value === '男' || value === 'male') return 'male';
    if (value === '女' || value === 'female') return 'female';
    return text(value);
  }

  function datedLine(date, content) {
    return date ? `${date} ${content}` : content;
  }

  function monitoringText(next) {
    const trough = text(next.troughDate) || dateTimeText(next.troughTime);
    const peak = text(next.peakDate) || dateTimeText(next.peakTime);
    if (!trough && !peak) return '';
    if (trough && peak) return `Suggest trough level (${trough}) and peak level (${peak}) will be ordered.`;
    if (trough) return `Suggest trough level (${trough}) will be ordered.`;
    return `Suggest peak level (${peak}) will be ordered.`;
  }

  function infusionText(regimen, next) {
    const duration = regimen.tInf ? `infused over ${regimen.tInf} hours` : '';
    const volume = text(next.volume);
    if (volume && duration) return `diluted in ${volume} 0.9% N/S, ${duration}.`;
    if (volume) return `diluted in ${volume} 0.9% N/S.`;
    if (duration) return `${duration}.`;
    return '';
  }

  function makeNote(data) {
    const patient = data.patient || {};
    const clinical = data.clinical || {};
    const result = data.result || {};
    const regimen = data.regimen || {};
    const next = data.monitoring || {};
    const auc = result.auc24;
    const aucLine = Number.isFinite(Number(auc)) ? `AUC: ${numberText(auc, 2)} ug·hr/ml.` : '';
    const pkParts = [
      hasNumber(result.peak) ? `Vanco(peak): ${text(result.peak)}μg/ml` : '',
      hasNumber(result.trough) ? `Vanco(trough): ${text(result.trough)}μg/ml` : '',
      hasNumber(result.halfLife) ? `t1/2: ${numberText(result.halfLife, 2)}hr` : '',
      aucLine ? aucLine.slice(0, -1) : '',
    ].filter(Boolean);
    const levelLine = pkParts.length
      ? datedLine(levelDate(result, 'troughDate', 'troughTime') || levelDate(result, 'peakDate', 'peakTime'), `${pkParts.join('、')}.`)
      : '';
    const diagnosis = listText(clinical.diagnosis);
    const cultures = listText(clinical.cultures);
    const labs = listText(clinical.labs);
    const vitals = listText(clinical.vitals);
    const regimenLine = regimenText(regimen) || 'Pharmacist confirmation pending.';
    const startDate = dateText(clinical.startDate);
    const noteDate = dateText(patient.noteDate || data.noteDate);
    const followUp = text(next.followUp, 'I will reassess for adequate infection response after 48-72 hrs.');
    const indication = text(clinical.indication);
    const startText = startDate ? ` since ${startDate}` : '';
    const sLine = `S: Vancomycin ${regimenLine}${indication ? ` for ${indication}` : ''}${startText}.`;
    const oParts = [
      `${text(patient.age, '未填')} year-old ${sexText(patient.sexLabel)}, Wt ${text(patient.tbw, '未填')}kg`,
      diagnosis ? `Dx: ${diagnosis.replace(/\n/g, '; ')}` : '',
      cultures ? cultures.replace(/\n/g, ' ') : '',
      labs,
      vitals,
      levelLine,
    ].filter(Boolean);
    const aucAssessmentLine = aucAssessment(result.status);
    let planLine;
    if (result.status === 'target') {
      planLine = 'Keep current dosage and monitor vancomycin levels and renal function weekly.';
    } else if (result.status === 'below' || result.status === 'above') {
      const aucValue = Number.isFinite(Number(auc)) ? ` (based on the patient’s AUC ${numberText(auc, 2)} ug·hr/ml)` : '';
      planLine = `Suggest adjusting Vancomycin to ${regimenLine}${aucValue}.`;
    } else {
      planLine = `Suggest Vancomycin ${regimenLine} based on body weight and renal function.`;
    }
    const monitorLine = monitoringText(next);
    const infusionLine = infusionText(regimen, next);
    const lines = [
      '佛教大林慈濟綜合醫院 藥師評估記錄 (Pharmacy note)',
      '',
      '處方評估建議',
      sLine,
      '',
      `O: ${oParts.join(' ')}`,
      '',
      `A: ${aucAssessmentLine}`,
      clinical.assessment ? `Clinical interpretation: ${clinical.assessment}` : '',
      '',
      'P:',
      planLine,
      infusionLine,
      monitorLine,
      followUp,
      'If you have any question, please contact me.',
      '',
      '參考資料',
      'Up To Date',
      'The guide to antimicrobial therapy',
      `藥師：${text(patient.pharmacist)}；連絡電話：${text(patient.phone)}；填寫日期：${noteDate}`,
    ].filter((line, index, all) => line !== '' || all[index - 1] !== '');
    return lines.join('\n');
  }

  return { makeNote, dateText, dateTimeText, regimenText, aucAssessment };
});
