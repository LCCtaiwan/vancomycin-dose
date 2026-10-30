# Existing project Pharmacy note wording contract

This change preserves the frozen wording already documented in `SPEC.md` and `docs/pharmacy-note-template-analysis.md` (introduced in C-020). These project documents describe supervisor approval, but this repair did not independently recover the original approving utterance. Do not treat software fidelity as clinical approval. Original filled documents contain sensitive data and are not included.

Exact template strings from that project specification:

### S

`Vancomycin {dose} mg Q{interval}H IVD for {diagnosis}.`

### A

- `Vancomycin AUC is below the target range. (400-600 mcg·h/mL)`
- `Vancomycin AUC is within the target range. (400-600 mcg·h/mL)`
- `Vancomycin AUC is above the target range. (400-600 mcg·h/mL)`

### P

- 維持劑量：`Keep current dosage and monitor vancomycin levels and renal function weekly.`
- AUC 低且增加每日總劑量：`Suggested increasing the Vancomycin dose to {dose} mg IVD Q{interval}H (diluted in {volume} ml of 0.9% N/S, infused over {hours} hours) based on the patient’s AUC ({AUC} mcg·h/mL) .`
- 其他調整：`Suggest adjusting Vancomycin to {dose} mg Q{interval}H based on the patient’s AUC ({AUC} mcg·h/mL).`
- 調整後監測：`Suggested ordering Vancomycin trough level ({time}) and peak level ({time}).`
- 固定追蹤：`I will reassess for adequate infection response after 48-72 hrs.`
- 固定聯絡語句：`If you have any questions, please contact me.`

### 參考資料

- `Up To Date`
- `The sanford guide to antimicrobial therapy`


### Scope and implementation acceptance

- Preserve fixed words, spelling, case, punctuation and paragraphs; replace only defined numeric/clinical placeholders. Do not rewrite `Suggested increasing` to a stylistic synonym or turn a suggestion into an order.
- Branch selection in the existing spec: maintain current regimen; below-target AUC plus increased daily dose uses increasing sentence; other adjustments use adjusting sentence. Source examples alone do not independently establish clinical eligibility.
- Existing supported scope is general adult two-level AUC. Do not generate HD, trough-only, ARC, interactions or alternative antibiotics from unrelated filled examples.
- Adjusted-note inputs require explicit dilution and next trough/peak timing. Missing clinical input is not permission to invent it.
- Do not insert predicted post-change AUC/peak/trough sentences or safety disclaimers into fixed copied note; safety warnings remain visible separately. Invalid/safety-gated inputs must clear stale export.
- Existing spec standardizes AUC units to `mcg·h/mL`; source DOCX has variation. This is an existing project normalization, not independently verified user wording approval.
- Golden acceptance must compare rendered note, clipboard and TXT byte-for-byte after dynamic values are filled; manual A/P only is an interim fallback, not completion of the existing automated language contract.

