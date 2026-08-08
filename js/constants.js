(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VancoConstants = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const VANCO = Object.freeze({
    AUC_MIN: 400,
    AUC_MAX: 600,
    MIC_DEFAULT: 1,
    LOADING_MIN_MGKG: 20,
    LOADING_MAX_MGKG: 20,
    LOADING_CAP_MG: 3000,
    MAINT_MIN_MGKG: 15,
    MAINT_MAX_MGKG: 15,
    DOSE_STEP_MG: 250,
    INTERVALS_H: [8, 12, 24, 48],
    EMPIRIC_INTERVALS: Object.freeze([
      { min: 90, intervalH: 8, label: 'q8h' },
      { min: 50, intervalH: 12, label: 'q12h' },
      { min: 20, intervalH: 24, label: 'q24h' },
    ]),
  });

  const CG = Object.freeze({
    OBESE_TBW_OVER_IBW: 1.2,
    ADJ_FACTOR: 0.4,
  });

  const RRT_TYPES = Object.freeze({
    NONE: 'none',
    IHD: 'ihd',
    CRRT: 'crrt',
    SLED: 'sled',
    PD: 'pd',
  });

  return Object.freeze({ VANCO, CG, RRT_TYPES });
});
