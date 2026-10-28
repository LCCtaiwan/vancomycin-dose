# Vancomycin 臨床藥師工作台

成人靜脈注射 vancomycin 的離線臨床藥師決策支援原型。

## 功能

- 共同欄位、首次劑量、校正體重與 Cockcroft–Gault CrCl。
- 依 trough → 實際給藥 → peak 的時序計算 AUC24／MIC。
- 由藥師手動試算後續 regimen，顯示預測 AUC、peak、trough、15-dose 表格與濃度圖。
- 貼上固定 Excel A–G 或明確欄名 TSV，核對預覽後整理 Pharmacy note 檢驗文字（不是所有 HIS2 格式皆已驗收）。
- 依主管審核通過的固定 S/O/A/P 句型產生 Pharmacy note／疑義處方建議。
- 複製與 UTF-8 TXT 匯出；資料不足或時序不合理時阻擋輸出。

## 使用方式

直接開啟 `index.html`，或使用 GitHub Pages。這是單一 HTML 檔，不需要安裝套件、建置或連線到後端。

## 資料與隱私

- 網頁不會上傳、長期儲存或寫入 `localStorage`。
- 公式來源的院內 Excel 與主管審核的 Word 範本只保存在本機，不放進公開 repository。
- Repository 只保留去識別化的測試資料。
- 這是臨床決策輔助，不是醫囑、處方或院內 protocol 的替代品。

## 專案文件

- `SPEC.md`：凍結需求、公式、固定文字與驗收條件。
- `PROGRESS.md`：目前停點與下一步。
- `CHANGELOG.md`：每次變更摘要。
- `docs/develog.md`：開發決策與驗證證據。
- `docs/his2-import-spec.md`：HIS2 固定檢驗項目的整理規格。
- `docs/pharmacy-note-template-analysis.md`：主管審核範本的去識別化結構分析。

## 草稿修復與驗證

C-022 修復尚未合併或部署。第一次開啟不會填入病人／療程 demo 值；請填實際已核對資料，或明確選擇假資料展示。

```sh
node tests/excel-formulas.cjs
node tests/his2-import.cjs
node tests/note-export.cjs
node tests/reference-1130-parity.cjs
```

上述測試無需額外套件。`tests/browser-e2e.cjs` 需要 Playwright 與 Chromium；使用 `CHROMIUM_PATH` 可指定已安裝的 Chromium。其執行在目前環境遭瀏覽器啟動權限限制，因此不能以 Node 測試通過代替桌機／手機或實際下載驗收。

詳細修復、來源版本、測試界線及未完成事項見 `docs/repair-2026-10-28.md`。
