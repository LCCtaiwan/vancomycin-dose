# Development Log

## Current Goal

完成 C-018：移除尚未與院內流程對齊的 Pharmacy note 檢驗值匯入原型，保留原本 Vancomycin AUC、note 同步與重新讀取功能。

## Stack And Run Commands

- Stack: HTML, CSS, classic JavaScript; no build step and no runtime dependency.
- Run: `python3 -m http.server 8000`
- Unit tests: `node --test js/pk.test.js js/note.test.js`

## Important Project Rules

- 不儲存或傳輸病人資料。
- AUC 調整不自動反推劑量；新方案由藥師人工輸入並確認。
- AUC 輸入欄位依院內 Excel 使用單一給藥、trough、peak 日期時間；由三個時間自動換算相對時序。
- RRT、未成年、無效採血時序與非正數輸入不可進入標準計算。
- 所有臨床輸出均須顯示決策輔助免責聲明。

## SDD

- `constants.js`: 集中管理臨床常數、單位與 RRT 列舉。
- `pk.js`: 無 DOM 的純函式；支援瀏覽器與 CommonJS。
- `note.js`: 將結構化資料轉成可編輯純文字 note。
- `ui.js`: 表單讀寫、AUC 濃度圖表與 15-dose 比較、確認 gate、clipboard 與下載。
- `ui.js`: Pharmacy note 產生後的來源欄位同步；若 note 已被直接編輯則保留人工文字。
- `pk.test.js` / `note.test.js`: golden、邊界與 snapshot 驗證。

## Completed Work

- C-001: 已讀取院內 Excel、17 份正式 Pharmacy note 與參考 repo。
- C-001: 已確認 Excel golden case 與 Sawchuk–Zaske 完整兩段式 AUC 相容。
- C-001: 已完成首版適用範圍與輸出介面的決策。
- C-001: 已完成 `constants.js`、`pk.js`、`note.js`、`ui.js`、`index.html` 與 responsive CSS。
- C-001: 已加入藥師確認 gate；AUC 低／高於目標時，未輸入並勾選採用人工新方案不可產生完成版 note；AUC 達標可確認維持目前方案。
- C-001: 已加入複製 fallback、UTF-8 BOM TXT 匯出、無 PHI 檔名與清除本頁資料流程。
- C-001: 已通過 Node 8/8 單元測試；Excel golden case 的 AUC24 349.6663、new AUC24 466.2217 與參考值一致。
- C-001: 已通過 headless Chromium 桌面／手機 smoke test、起始劑量與 RRT gate、`file://` 載入；最後一次 browser console errors 為 0。
- C-002: 已將 AUC 表單改為 MM/DD 與相對小時，新增 SVG peak/trough 折線圖與 15-dose 逐次比較表。
- C-002: 已修正新方案未填 next infusion delay 時的初始 Cmin fallback，避免圖表出現 NaN。
- C-002: 已通過 Node 9/9 與 desktop/mobile headless browser 驗證；圖表、15-dose table 存在且 console errors 為 0。
- C-003: 已移除姓名、病歷號、病房、主治醫師、住院日期、轉入日期欄位，並同步移除 note 輸出標籤。
- C-003: 已補 note 測試，確認移除欄位不會出現在產出文字中。
- C-004: 已依 Excel 工作表第 1 頁補齊 trough→peak 時間、預計給藥前濃度、New AUC、Predicted Peak/Trough 欄位。
- C-004: 已通過 Excel golden case 的預計給藥前濃度 10.48995 mg/L 與 15-dose profile browser 驗證。
- C-005: 已將 Pharmacy note 臨床資料與人工新方案改為選填展開區，AUC 基本欄位填齊即自動計算。
- C-005: 已依院內 Vancomycin 範例調整 note 表頭、S/O/A/P 句型、AUC 單位與監測句型。
- C-005: 已移除非 Excel 的腎功能穩定／穩態勾選欄位，結果區保留人工確認提醒。
- C-005: 已通過 Node 9/9 與瀏覽器驗證；AUC golden 349.7、15-dose 15 列、console errors 0。
- C-006: 已將 AUC 輸入重整為 Excel 的 13 個欄位：目前 10 欄與更改方案 3 欄。
- C-006: 已移除相對時間拆欄、輸注液量、新方案日期、預計採血日期及 AUC 頁面 note 勾選。
- C-006: 已用 Excel 日期時間範例重新驗證 AUC24 349.7、15-dose 15 列、console errors 0。
- C-007: 已將給藥、trough、peak 時間改為 `YYYY/MM/DD HH:mm` 24 小時制輸入，並支援民國年。
- C-007: 已新增每 0.25 小時的連續濃度曲線，包含輸注上升與排除期下降；Browser 735 個點、console errors 0。
- C-008: 已將 15-dose 主表改為 Excel 橫向欄位，並讓更改 dose 可沿用目前 interval／輸注時間快速試算。
- C-008: 已將連續曲線收合為輔助資訊；Browser 驗證目前／New 各 15 個 dose 欄位、New AUC 與 console errors 0。
- C-009: 已將三個時間欄位改為 `datetime-local`、`lang=en-GB`、60 分鐘步進；Browser AUC golden 349.7、console errors 0。
- C-010: 已將 `constants.js`、起始劑量說明與結果備註統一為 Loading 20 mg/kg、maintenance 15 mg/kg/dose，並通過 Node 9/9。
- C-011: 已在 AUC 表單結果前加入 AUC24 400–600 mg·h/L 與 MIC = 1 的 AUC/MIC 固定提示。
- C-012: 已完成 24 小時時間選單，Browser 驗證無 AM／PM、時間值正確組合並得到 AUC24 349.7。
- C-013: 已將 AUC24 結果位置移到人工新方案前，並通過 Node 9/9。
- C-014: 已加入 Pharmacy note 來源欄位同步；產生後修改適應症等欄位會更新 note，直接編輯 note 後不自動覆寫。
- C-015: 已加入「重新讀取資料並更新 note」按鈕，按下後依最新來源欄位重新產生 note。
- C-016／C-017: 曾建立 Excel／HIS2 單次貼上與分流原型，後依使用者要求移除，待檢驗值功能規格重新對齊後再規劃。
- C-018: 已移除匯入卡、解析程式、匯入 CSS 與事件監聽；原本 AUC 與 Pharmacy note 流程恢復為唯一有效流程。

## Current Checkpoint

- Implementation artifact is ready for local clinical review；目前不包含尚未確認的 HIS2／Excel 檢驗值匯入原型。資料夾目前沒有 `.git` 或 GitHub remote，因此 Pages 發布尚待指定 repository。
- Screenshots saved under `output/playwright/desktop.png` and `output/playwright/mobile.png`.
- Handover database search was attempted but unavailable because its SQLite database could not be opened; local project records are the source of truth.

## Recommended Next Step

1. 由院內藥師使用去識別化病例逐欄驗證 Excel 對應的 AUC 輸入、輸出、濃度圖表與 note 欄位。
2. 指定可推送的 GitHub repository，建立 Pages workflow／發布分支。
3. 驗證精簡 note 的英文句型、監測日期與院內工作流程；臨床 sign-off 後再標記 v0.1.0。

## Verification Status

- Documentation gate: pass。
- Calculation gate: pass（Node 9/9；golden case 通過）。
- UI and note gate: pass（desktop／mobile／file protocol／download smoke test；C-002 圖表 console errors 0）。
- C-014 note linkage gate: pass（產生後修改感染適應症會同步更新輸出；Node 9/9）。
- C-018 cleanup gate: pass；Node 9/9、AUC 頁面 smoke test、匯入控制不存在且 console errors 0。
- Clinical gate: pending（院內藥師 pass/revise/reject）。
