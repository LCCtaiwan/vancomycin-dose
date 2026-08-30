# CHANGELOG

## C-020 — 2026-08-30

### Changed

- 將本機最新版整合為 repository 根目錄的正式 `index.html`。
- 恢復共同欄位、首次劑量、TDM／AUC、人工新方案、15-dose 圖表、HIS2 檢驗整理與 Pharmacy note 完整流程。
- Pharmacy note 固定採用主管審核範本的 S/O/A/P 用詞、標點與段落，只代入藥師確認的數值。
- 用單檔正式版本取代舊版分離式 JavaScript／CSS；舊內容仍保留在 Git 歷史。
- 新增去識別化 golden fixtures、整合規格與隱私排除規則；院內 Excel、Word 範本、工作檔與截圖不發布。

### Verification

- 公式、SOAP、阻擋條件、HIS2 帶入、390 px 手機版面、console 與敏感資料檢查均通過。
- GitHub Pages 部署狀態於 push 後確認。

## C-019 — 2026-08-08

### Changed

- 將目前 Vancomycin AUC／Pharmacy note 工具部署至 `LCCtaiwan/vancomycin-dose`。
- 新增 GitHub Pages workflow 與公開使用網址。
- 發布內容排除院內 Excel、Pharmacy note 原始資料與測試截圖。

### Verification

- Remote `index.html` SHA 與發布版本一致。
- Pages URL HTTP 200：<https://lcctaiwan.github.io/vancomycin-dose/>

## C-018 — 2026-08-08

### Changed

- 移除尚未與院內流程對齊的 HIS2／Excel 檢驗值匯入與工具箱原型。
- 保留原本 Vancomycin AUC、Pharmacy note 產生、重新讀取與匯出功能。

### Verification

- Node tests: 9/9 pass。
- Browser UI: pass；AUC24 與 15-dose profile 可顯示，匯入控制不存在，console errors 0。
- GitHub Pages: 已於 C-019 完成部署。

## C-017 — 2026-08-08

### Changed

- 將 HIS2／Excel 單次貼上區移到同一頁的「共用匯入工具箱」。
- 解析結果分成「共通資訊」、「一般檢驗／生命徵象」與「Vancomycin 濃度／給藥」三個區塊，避免檢驗數值與 Vancomycin 混在一起。
- AUC 與 Pharmacy note 仍讀取同一份已解析資料，不需要開第二個視窗或重複貼上。

### Verification

- Node tests: 11/11 pass。
- Browser UI: pending；待驗證三區分流與單次貼上後的 note 帶入。

## C-016 — 2026-08-08

### Changed

- 在同一網頁的 Pharmacy note 區新增 Excel 檢驗值貼上與解析功能。
- 支援同事整理後的 Q 欄文字及整段複製範圍，帶入病人資料、腎功能、檢驗、生命徵象與 Vancomycin level。
- 顯示解析預覽，並保留抽血日期／時間由藥師於 AUC 頁面確認。
- 修正 note 產生時不再覆蓋匯入的 peak／trough。

### Verification

- Node tests: 11/11 pass。
- Browser UI: pass；同頁貼上、解析預覽與 note 產出正常，Peak 36.7、Trough 19.7、T1/2 10.58 可帶入 O 段，console errors 0。

## C-015 — 2026-08-08

### Changed

- Pharmacy note 區增加「重新讀取資料並更新 note」按鈕，讓藥師可手動重新帶入最新欄位。

### Verification

- Node tests: 9/9 pass。
- Browser UI: pass；按鈕可重新產生最新 note。

## C-014 — 2026-08-08

### Changed

- Pharmacy note 產生後，臨床資料欄位會自動更新已產生的 note。
- 若藥師直接編輯 note 文字，後續欄位變更不會覆寫人工修改。
- 補強 note 測試，確認診斷、培養與檢驗內容會帶入 O 段。

### Verification

- Node tests: 9/9 pass。
- Browser UI: pass；確認輸入適應症等資料後產生，修改來源欄位可同步更新。

## C-013 — 2026-08-08

### Changed

- 將「目前 AUC 結果」移到目前方案與兩點濃度輸入後、人工新方案前。
- 新增明確標題「目前 AUC 結果（輸入完成後顯示）」。

### Verification

- Node tests: 9/9 pass。
- UI check: pass；AUC24 結果位置直接接在目前兩點資料之後。

## C-012 — 2026-08-08

### Changed

- 將給藥、trough、peak 時間改為日期日曆＋24 小時制小時／分鐘選單。
- 小時固定為 `00–23`、分鐘固定為 `00–59`，不再依瀏覽器顯示上午／下午。

### Verification

- Node tests: 9/9 pass。
- Browser UI: pass；無 AM／PM、時間選擇後 AUC24 349.7、console errors 0。

## C-011 — 2026-08-08

### Changed

- 在雙點 AUC 輸入區最上方新增固定提示：`AUC24 目標：400–600 mg·h/L`。
- 同步標示 MIC = 1 mg/L 時的 AUC/MIC 目標範圍。

### Verification

- UI check: pass；切換至雙點 AUC 後，未計算前即可看見目標值。

## C-010 — 2026-08-08

### Changed

- 起始劑量規則固定為 Loading 20 mg/kg（上限 3000 mg）。
- 維持劑量規則固定為 15 mg/kg/dose。
- 起始劑量頁面與結果區新增相同規則備註，提醒 TBW 計算及藥師確認 250 mg 候選值。

### Verification

- Node tests: 9/9 pass。
- Dose rule check: pass；固定值、loading cap 與 UI 備註一致。

## C-009 — 2026-08-08

### Changed

- 給藥、抽 trough、抽 peak 時間改為原生 `datetime-local` 選擇器。
- 設定 `en-GB` 與 60 分鐘步進，優先提供 24 小時制的點選／滾輪操作，避免手動輸入時間。

### Verification

- Node tests: 9/9 pass。
- Browser UI: pass；三個時間欄位類型、語系、步進設定正確，AUC24 349.7、console errors 0。

## C-008 — 2026-08-08

### Changed

- AUC 主結果改為 Excel 版面：1–15 Dose 橫向欄位，列出目前／New Peak、Trough。
- 更改 dose 可單獨輸入；未填新 interval／輸注時間時沿用目前方案。
- 連續濃度曲線降為收合的輔助資訊，保留以便查看輸注上升與排除期下降。

### Verification

- Browser UI: pass；目前與新方案各 15 個 dose 欄位、New AUC、console errors 0。

## C-007 — 2026-08-08

### Changed

- 給藥、trough、peak 時間輸入改為 `YYYY/MM/DD HH:mm` 24 小時制文字格式，並支援民國年格式。
- 濃度圖改為連續時間曲線，呈現輸注期間上升及停藥後的指數下降。
- 保留 peak／trough 逐次比較表，圖表不再只連接 15 次離散點。

### Verification

- Node tests: 9/9 pass，新增連續曲線非平坦驗證。
- Browser UI: pass；24 小時制輸入、735 個曲線點、AUC24 349.7、console errors 0。

## C-006 — 2026-08-08

### Changed

- AUC 輸入重整為院內 Excel 的 13 個欄位：目前方案 10 欄、更改方案 3 欄。
- 給藥、trough、peak 改為單一日期時間欄位，由計算核心自動換算採血時序。
- 移除相對時間拆欄、輸注液量、新方案日期、預計採血日期及 AUC 頁面 note 勾選。

### Verification

- Node tests: 9/9 pass。
- Browser UI: pass；Excel 日期時間 golden case AUC24 349.7、15-dose profile 15 列、console errors 0。

## C-005 — 2026-08-08

### Changed

- Excel 對應的 AUC 基本欄位填齊後，自動更新目前方案 AUC 與 15-dose 濃度模擬。
- Pharmacy note 臨床資料與人工新方案改為選填展開區，不再干擾 AUC 計算。
- 移除非 Excel 的腎功能穩定／穩態勾選欄位，改以結果區人工確認提醒呈現。
- Pharmacy note 改用院內 Vancomycin 範例的精簡 S/O/A/P 句型與單位。

### Verification

- Node tests: 9/9 pass。
- Browser UI: pass；自動 AUC、15-dose profile、選填區與 console errors 0。

## C-004 — 2026-08-08

### Changed

- 依院內 Excel 逐欄補齊 AUC 結果：trough 到 peak 時間、預計給藥前血中濃度、New AUC、Predicted Peak、Predicted Trough。
- 保留目前／新方案 15-dose peak/trough 圖表與逐列比較表，並使用 Excel 對應中文／英文標籤。

### Verification

- Node tests: 9/9 pass，包含 Excel golden 預計給藥前濃度。
- Browser UI: pass；所有對應輸出欄位、15-dose profile、console errors 0。

## C-003 — 2026-08-08

### Changed

- 移除病人姓名、病歷號、病房、主治醫師、住院日期、轉入日期輸入欄位。
- Pharmacy note 同步移除上述空白識別標籤，工具只保留計算與臨床評估需要的資料。

### Verification

- Node tests: 9/9 pass；note snapshot 確認不輸出已移除欄位。

## C-002 — 2026-08-08

### Changed

- AUC 日期輸入改為 `MM/DD`，不再要求完整日期時間。
- 以 trough 到給藥、給藥到 peak 的相對小時維持 Excel 雙點計算精確性。
- 新增目前／新方案 15-dose peak/trough 折線圖與 15 列比較表，改善濃度變化的即時可讀性。
- 修正未填下一次輸注間隔時新方案 profile 的初始 Cmin fallback。

### Verification

- Node tests: 9/9 pass。
- Browser UI: pass；desktop／mobile、AUC 新輸入、圖表、15-dose table、console errors 0。

## C-001 — 2026-08-08

### Planned

- 建立無框架、可離線的 Vancomycin AUC 計算器。
- 重現院內 Excel 雙點 AUC 與人工新方案試算。
- 新增結構化 Pharmacy note、複製與 TXT 匯出。

### Why

將現行分散於 Excel 與 Word 的流程整合為可驗證、可追溯且不傳輸病人資料的單頁工具。

### Implemented

- 新增 `index.html`、`css/style.css` 與 classic-script 模組，支援離線直接開啟。
- `js/pk.js` 重現 Excel 時序的雙點 AUC、15-dose profile、起始劑量與 RRT／輸入阻擋。
- `js/note.js` 與 `js/ui.js` 將病人資料、AUC 結果及藥師確認方案帶入英文 S/O/A/P note。
- 複製使用 Clipboard API 並保留 fallback；TXT 使用 UTF-8 BOM，檔名不含 PHI。
- AUC 達標時可選擇維持目前方案或採用人工新方案；AUC 低／高時強制選擇並確認新方案。
- 保留 `THIRD_PARTY_NOTICES.md`，說明參考 repo 的 MIT 授權與本專案未直接複製其程式碼。

### Verification

- Node tests: 8/8 pass（Excel golden、起始劑量／AdjBW、RRT、時序、AUC 邊界、note snapshot）。
- Browser acceptance: pass（desktop／mobile、`file://`、AUC golden、新方案、note 產生與 TXT BOM）。
- Remaining: 院內藥師 clinical sign-off。
