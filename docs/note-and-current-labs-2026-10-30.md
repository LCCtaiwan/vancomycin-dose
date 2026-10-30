# Full Pharmacy note and current-workbook integration

## Scope
- Institutional form structure around S/O/A/P, references and pharmacist/contact/fill date.
- Existing project fixed English wording retained, with explicit keep/adjust selection, eligible inputs and pharmacist review checkbox. Manual A/P mode remains available. Historical project statements of supervisor approval are not newly verified approval; exact source distinctions in `wording-contract-source-audit.md`.
- Existing no-name/privacy design retained: newly shown patient name/ward/admission/transfer/attending inputs are disabled and their output remains blank; no original case identifiers are copied. Existing optional MRN appears only in the form header, not repeated in SOAP.
- 1090427 A:J/C:J laboratory and A:I vital TSV adapter. Report date remains report date; blank dates unknown unless the pharmacist explicitly enables within-block carry and reparses. Repeated headers reset carry. Vitals time remains raw with unknown observation date. No TODAY assumption.
- Preview all records, explicitly select rows, then confirm. Missing values are not zero; original units/text/qualifiers preserved. Duplicate analytes remain separate. Reporter columns excluded from note. Unsupported rows are counted and disclosed. New mode only changes note observation text, never SCr/TDM/sample-time calculator inputs.
- Legacy A–G rejects report-date/new-vital signatures rather than silently guessing.
- Demo clears prior case metadata; edits invalidate stale exports. Fixed-mode review checkbox is reset by user input changes.

## Tests
```
node tests/excel-formulas.cjs
node tests/his2-import.cjs
node tests/note-export.cjs
node tests/reference-1130-parity.cjs
node --test tests/1090427-adapter.cjs
```
The 13 adapter tests execute the module embedded in shipped index.html, not an unshipped parallel copy. Existing synthetic fixed-wording fixture tests only exact A/P/reference clauses; full form structure has separate assertions. All inputs are synthetic, never copied original patient cases.

Numeric core remains unchanged; six synthetic scenarios ×77 cells =462 checks retain max absolute difference 2.8040858524036594e-9. This is source formula parity, not independent clinical validation of the source or existing CrCl/initial-dose rules.

## Verification boundaries
Independent managed-browser copy/paste/TXT checks are recorded separately against exact candidate hashes. Desktop results do not imply actual HIS integration, mobile-device acceptance, clinical sign-off or Word/PDF layout equivalence. The original filled DOCX and workbooks are never committed. This change adds neither network uploads nor persistent patient storage.

## Independent desktop checkpoint
Frozen index SHA256 `5cfb403ecdf32a3d6a38cfe226ffd3aabb612890ef73be3f0995407d6aa52924` passed supported local-browser checks: all three fixed sentence branches; exact synthetic full-note golden; actual 1,430-byte UTF-8 BOM TXT; actual clipboard and local Ctrl+V; required review/plan/dilution gates; selected current-workbook rows without calculator mutation; date carry explicitly enabled/reparsed; selection changes requiring reconfirmation; exact manual fallback and stale-export denial. These are synthetic desktop acceptance checks, not actual HIS or clinical sign-off.
