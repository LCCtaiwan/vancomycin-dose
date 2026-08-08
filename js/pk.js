(function (root, factory) {
  const constants = typeof require !== 'undefined'
    ? require('./constants.js')
    : root.VancoConstants;
  const api = factory(constants);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VancoPK = api;
})(typeof self !== 'undefined' ? self : this, function (constants) {
  'use strict';

  const { VANCO, CG, RRT_TYPES } = constants;

  function finite(value) {
    return Number.isFinite(Number(value));
  }

  function number(value) {
    return Number(value);
  }

  function idealBodyWeight(sexMale, heightCm) {
    const inchesOverFiveFeet = heightCm / 2.54 - 60;
    return (sexMale ? 50 : 45.5) + 2.3 * inchesOverFiveFeet;
  }

  function adjustedBodyWeight(tbw, ibw) {
    return ibw + CG.ADJ_FACTOR * (tbw - ibw);
  }

  function crclDosingWeight(tbw, ibw) {
    if (tbw < ibw) return { weight: tbw, label: 'TBW（消瘦）' };
    if (tbw > CG.OBESE_TBW_OVER_IBW * ibw) {
      return { weight: adjustedBodyWeight(tbw, ibw), label: 'AdjBW（肥胖）' };
    }
    return { weight: tbw, label: 'TBW' };
  }

  function cockcroftGault(age, weightKg, scr, sexMale) {
    const result = ((140 - age) * weightKg) / (72 * scr);
    return sexMale ? result : result * 0.85;
  }

  function doseCandidates(minRaw, maxRaw, cap = Infinity, step = VANCO.DOSE_STEP_MG) {
    const low = Math.ceil(minRaw / step - 1e-9);
    const high = Math.floor(Math.min(maxRaw, cap) / step + 1e-9);
    const values = [];
    for (let i = low; i <= high; i += 1) values.push(i * step);
    if (values.length) return values;
    const fallback = Math.round(Math.min(maxRaw, cap) / step) * step;
    return [Math.max(step, fallback)];
  }

  function intervalSuggestion(crcl) {
    if (crcl < 20) {
      return { intervalH: null, label: '人工判斷（CrCl <20 mL/min）', manual: true };
    }
    const found = VANCO.EMPIRIC_INTERVALS.find((rule) => crcl >= rule.min);
    return found
      ? { intervalH: found.intervalH, label: found.label, manual: false }
      : { intervalH: null, label: '人工判斷', manual: true };
  }

  function empiricDosing(input) {
    const errors = [];
    const warnings = [];
    const age = number(input.age);
    const tbw = number(input.tbw);
    const heightCm = number(input.heightCm);
    const scr = number(input.scr);
    const sexMale = Boolean(input.sexMale);
    const rrtType = input.rrtType || RRT_TYPES.NONE;

    if (!finite(age) || age < 18) errors.push('年齡須為 18 歲以上。');
    if (!finite(tbw) || tbw <= 0) errors.push('實際體重須大於 0。');
    if (!finite(heightCm) || heightCm <= 0) errors.push('身高須大於 0。');
    if (!finite(scr) || scr <= 0) errors.push('SCr 須大於 0。');
    if (rrtType !== RRT_TYPES.NONE) {
      errors.push('首版不支援 HD、CRRT、SLED 或 PD 的自動計算。');
    }
    if (errors.length) return { ok: false, errors, warnings };

    const ibw = idealBodyWeight(sexMale, heightCm);
    const crclWeight = crclDosingWeight(tbw, ibw);
    const crcl = cockcroftGault(age, crclWeight.weight, scr, sexMale);
    const loadingRaw = {
      min: VANCO.LOADING_MIN_MGKG * tbw,
      max: VANCO.LOADING_MAX_MGKG * tbw,
    };
    const maintenanceRaw = {
      min: VANCO.MAINT_MIN_MGKG * tbw,
      max: VANCO.MAINT_MAX_MGKG * tbw,
    };
    const loadingCapped = loadingRaw.max > VANCO.LOADING_CAP_MG;
    const interval = intervalSuggestion(crcl);

    if (loadingCapped) warnings.push(`Loading dose 上限為 ${VANCO.LOADING_CAP_MG} mg。`);
    if (crcl < 20) warnings.push('CrCl <20 mL/min：間隔需依濃度與臨床狀態人工決定。');
    if (tbw > CG.OBESE_TBW_OVER_IBW * ibw) {
      warnings.push('肥胖：Vancomycin 劑量使用 TBW，CrCl 使用 AdjBW。');
    }
    if (crcl > 130) warnings.push('CrCl >130 mL/min，請評估 augmented renal clearance。');
    if (crcl < 30) warnings.push('CrCl <30 mL/min，需密切監測腎功能與濃度。');

    return {
      ok: true,
      age,
      tbw,
      heightCm,
      scr,
      sexMale,
      ibw,
      crclWeight,
      crcl,
      loadingRaw,
      loadingCandidates: doseCandidates(loadingRaw.min, loadingRaw.max, VANCO.LOADING_CAP_MG),
      loadingCapped,
      maintenanceRaw,
      maintenanceCandidates: doseCandidates(maintenanceRaw.min, maintenanceRaw.max),
      interval,
      warnings,
    };
  }

  function parseDate(value, label) {
    if (value instanceof Date) return value;
    const raw = String(value ?? '').trim();
    const match = raw.match(/^(\d{3,4})[\/-](\d{1,2})[\/-](\d{1,2})[ T](\d{1,2}):(\d{2})$/);
    let date;
    if (match) {
      const year = Number(match[1]) < 1911 ? Number(match[1]) + 1911 : Number(match[1]);
      date = new Date(year, Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
      if (date.getFullYear() !== year || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3]) || date.getHours() !== Number(match[4]) || date.getMinutes() !== Number(match[5])) date = new Date(NaN);
    } else {
      date = new Date(raw);
    }
    if (Number.isNaN(date.getTime())) throw new Error(`${label} 時間格式無效。`);
    return date;
  }

  function suppliedNumber(value) {
    return value !== undefined && value !== null && String(value).trim() !== '' && finite(value);
  }

  function hoursBetween(later, earlier) {
    return (later.getTime() - earlier.getTime()) / 3600000;
  }

  function validateAucInput(input) {
    const errors = [];
    const dose = number(input.dose);
    const tau = number(input.tau);
    const tInf = number(input.tInf);
    const trough = number(input.trough);
    const peak = number(input.peak);
    const mic = number(input.mic || VANCO.MIC_DEFAULT);
    if (!finite(dose) || dose <= 0) errors.push('目前劑量須大於 0 mg。');
    if (!finite(tau) || tau <= 0) errors.push('給藥間隔須大於 0 小時。');
    if (!finite(tInf) || tInf <= 0) errors.push('輸注時間須大於 0 小時。');
    if (finite(tau) && finite(tInf) && tInf >= tau) errors.push('輸注時間須小於給藥間隔。');
    if (!finite(trough) || trough <= 0) errors.push('trough 濃度須大於 0。');
    if (!finite(peak) || peak <= 0) errors.push('peak 濃度須大於 0。');
    if (finite(peak) && finite(trough) && peak <= trough) errors.push('peak 濃度須高於 trough 濃度。');
    if (!finite(mic) || mic <= 0) errors.push('MIC 須大於 0。');
    if (input.rrtType && input.rrtType !== RRT_TYPES.NONE) errors.push('首版 AUC 不支援 RRT。');
    return errors;
  }

  function steadyStatePeakTrough(dose, tau, tInf, ke, vd) {
    const peak = (dose / tInf) * (1 - Math.exp(-ke * tInf)) /
      (vd * ke * (1 - Math.exp(-ke * tau)));
    const trough = peak * Math.exp(-ke * (tau - tInf));
    return { peak, trough };
  }

  function profileFromInitial({ initial, dose, tau, tInf, ke, vd, count = 15 }) {
    const profile = [];
    let preDose = initial;
    for (let doseNumber = 1; doseNumber <= count; doseNumber += 1) {
      const peak = preDose * Math.exp(-ke * tInf) +
        (dose / tInf) * (1 - Math.exp(-ke * tInf)) / (vd * ke);
      const trough = peak * Math.exp(-ke * (tau - tInf));
      profile.push({ doseNumber, peak, trough });
      preDose = trough;
    }
    return profile;
  }

  function continuousProfileFromInitial({ initial, dose, tau, tInf, ke, vd, count = 15, stepH = 0.25 }) {
    const profile = [];
    let preDose = initial;
    const rate = dose / tInf;
    for (let doseNumber = 1; doseNumber <= count; doseNumber += 1) {
      const cycleStart = (doseNumber - 1) * tau;
      const times = [0, tInf, tau];
      for (let elapsed = stepH; elapsed < tau; elapsed += stepH) times.push(elapsed);
      [...new Set(times.map((time) => Number(time.toFixed(8))))].sort((a, b) => a - b).forEach((elapsedH) => {
        let concentration;
        if (elapsedH <= tInf) {
          concentration = preDose * Math.exp(-ke * elapsedH) +
            (rate / (vd * ke)) * (1 - Math.exp(-ke * elapsedH));
        } else {
          const peak = preDose * Math.exp(-ke * tInf) +
            (rate / (vd * ke)) * (1 - Math.exp(-ke * tInf));
          concentration = peak * Math.exp(-ke * (elapsedH - tInf));
        }
        profile.push({ doseNumber, timeH: cycleStart + elapsedH, concentration });
      });
      const peak = preDose * Math.exp(-ke * tInf) +
        (rate / (vd * ke)) * (1 - Math.exp(-ke * tInf));
      preDose = peak * Math.exp(-ke * (tau - tInf));
    }
    return profile;
  }

  function classifyAuc(auc24) {
    if (auc24 < VANCO.AUC_MIN) return 'below';
    if (auc24 > VANCO.AUC_MAX) return 'above';
    return 'target';
  }

  function twoLevelAuc(input) {
    const errors = validateAucInput(input);
    if (errors.length) return { ok: false, errors };

    const dose = number(input.dose);
    const tau = number(input.tau);
    const tInf = number(input.tInf);
    const trough = number(input.trough);
    const peak = number(input.peak);
    const mic = number(input.mic || VANCO.MIC_DEFAULT);
    const hasDirectTiming = suppliedNumber(input.troughToDoseH) || suppliedNumber(input.peakFromDoseH);
    let doseTime;
    let troughTime;
    let peakTime;
    let troughToDose;
    let peakFromDose;
    if (hasDirectTiming) {
      if (!suppliedNumber(input.troughToDoseH) || !suppliedNumber(input.peakFromDoseH)) {
        return { ok: false, errors: ['trough 到給藥、給藥到 peak 的相對時間須完整填寫。'] };
      }
      troughToDose = number(input.troughToDoseH);
      peakFromDose = number(input.peakFromDoseH);
    } else {
      try {
        doseTime = parseDate(input.doseTime, '給藥');
        troughTime = parseDate(input.troughTime, 'trough');
        peakTime = parseDate(input.peakTime, 'peak');
      } catch (error) {
        return { ok: false, errors: [error.message] };
      }
      troughToDose = hoursBetween(doseTime, troughTime);
      peakFromDose = hoursBetween(peakTime, doseTime);
    }
    const eliminationWindow = tau - troughToDose - peakFromDose;
    const errorsByTime = [];
    if (!(troughToDose > 0)) errorsByTime.push('trough 必須在給藥前。');
    if (!(peakFromDose >= tInf)) errorsByTime.push('peak 必須在輸注完成後。');
    if (!(eliminationWindow > 0)) errorsByTime.push('由 Excel 時序換算的消除期時間須大於 0。');
    if (errorsByTime.length) return { ok: false, errors: errorsByTime };

    const ke = Math.log(peak / trough) / eliminationWindow;
    if (!(ke > 0) || !Number.isFinite(ke)) return { ok: false, errors: ['無法由兩點濃度得到有效 ke。'] };
    const halfLife = Math.log(2) / ke;
    const cMaxTrue = peak * Math.exp(ke * (peakFromDose - tInf));
    const cMinTrue = trough * Math.exp(-ke * troughToDose);
    const vd = (dose / tInf) * (1 - Math.exp(-ke * tInf)) /
      (ke * (cMaxTrue - cMinTrue * Math.exp(-ke * tInf)));
    const cl = ke * vd;
    const aucInfusion = ((cMaxTrue + cMinTrue) / 2) * tInf;
    const aucElim = (cMaxTrue - cMinTrue) / ke;
    const aucTau = aucInfusion + aucElim;
    const auc24 = aucTau * (24 / tau);
    const aucOverMic = auc24 / mic;
    const auc24Check = (dose * (24 / tau)) / cl;
    const predictedPreDoseConc = number(input.nextInfusionDelay || 0) > 0
      ? peak * Math.exp(-ke * number(input.nextInfusionDelay))
      : cMinTrue;
    const currentProfile = profileFromInitial({
      initial: trough,
      dose,
      tau,
      tInf,
      ke,
      vd,
    });
    const currentContinuousProfile = continuousProfileFromInitial({
      initial: trough,
      dose,
      tau,
      tInf,
      ke,
      vd,
    });
    const newRegimen = input.newDose && input.newTau && input.newTInf
      ? simulateNewRegimen({
        ...input,
        dose,
        tau,
        tInf,
        peak,
        ke,
        vd,
        cMinTrue,
        cl,
        auc24,
      })
      : null;

    return {
      ok: true,
      dose,
      tau,
      tInf,
      mic,
      doseTime,
      troughTime,
      peakTime,
      doseDate: input.doseDate || '',
      troughDate: input.troughDate || '',
      peakDate: input.peakDate || '',
      trough,
      peak,
      troughToDose,
      peakFromDose,
      eliminationWindow,
      ke,
      halfLife,
      cMaxTrue,
      cMinTrue,
      vd,
      cl,
      aucInfusion,
      aucElim,
      aucTau,
      auc24,
      aucOverMic,
      auc24Check,
      predictedPreDoseConc,
      nextInfusionDelay: number(input.nextInfusionDelay || 0),
      status: classifyAuc(auc24),
      currentProfile,
      currentContinuousProfile,
      newRegimen,
      warnings: mic > 1 ? ['MIC >1 mg/L：不應單純增加 Vancomycin 暴露追求 AUC/MIC，請評估替代治療。'] : [],
    };
  }

  function simulateNewRegimen(input) {
    const newDose = number(input.newDose);
    const newTau = number(input.newTau);
    const newTInf = number(input.newTInf);
    const errors = [];
    if (!(newDose > 0)) errors.push('新方案劑量須大於 0 mg。');
    if (!(newTau > 0)) errors.push('新方案間隔須大於 0 小時。');
    if (!(newTInf > 0 && newTInf < newTau)) errors.push('新方案輸注時間須大於 0 且小於間隔。');
    if (errors.length) return { ok: false, errors };
    const newAuc24 = input.auc24 * (newDose / input.dose) * (input.tau / newTau);
    const nextDelay = number(input.nextInfusionDelay || 0);
    const initial = nextDelay > 0 ? input.peak * Math.exp(-input.ke * nextDelay) : input.cMinTrue;
    const profile = profileFromInitial({
      initial,
      dose: newDose,
      tau: newTau,
      tInf: newTInf,
      ke: input.ke,
      vd: input.vd,
    });
    const continuousProfile = continuousProfileFromInitial({
      initial,
      dose: newDose,
      tau: newTau,
      tInf: newTInf,
      ke: input.ke,
      vd: input.vd,
    });
    const steady = steadyStatePeakTrough(newDose, newTau, newTInf, input.ke, input.vd);
    return {
      ok: true,
      dose: newDose,
      tau: newTau,
      tInf: newTInf,
      auc24: newAuc24,
      aucOverMic: newAuc24 / input.mic,
      initial,
      profile,
      continuousProfile,
      steadyPeak: steady.peak,
      steadyTrough: steady.trough,
      inTarget: newAuc24 >= VANCO.AUC_MIN && newAuc24 <= VANCO.AUC_MAX,
    };
  }

  return {
    idealBodyWeight,
    adjustedBodyWeight,
    crclDosingWeight,
    cockcroftGault,
    doseCandidates,
    intervalSuggestion,
    empiricDosing,
    validateAucInput,
    classifyAuc,
    steadyStatePeakTrough,
    profileFromInitial,
    continuousProfileFromInitial,
    simulateNewRegimen,
    twoLevelAuc,
  };
});
