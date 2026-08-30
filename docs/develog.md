# Development Log

## Current Goal

完成 C-020：將本機最新版整合為正式單檔工作台，安全發布至既有 GitHub repository 與 GitHub Pages。

## Stack And Run Commands

- Stack: 單一 `index.html`（內嵌 CSS 與 classic JavaScript）；無 build step、後端或 runtime dependency。
- Run: `python3 -m http.server 8000`
- Verification: 去識別化 golden fixtures、瀏覽器互動測試、手機版面與敏感資料掃描。

## Important Project Rules

- 不儲存或傳輸病人資料。
- AUC 調整不自動反推劑量；新方案由藥師人工輸入並確認。
- AUC 輸入欄位依院內 Excel 使用單一給藥、trough、peak 日期時間；由三個時間自動換算相對時序。
- RRT、未成年、無效採血時序與非正數輸入不可進入標準計算。
- 所有臨床輸出均須顯示決策輔助免責聲明。

## SDD

- `index.html`: 共同欄位、首次劑量、TDM／AUC、HIS2 整理、15-dose 圖表與 Pharmacy note 的正式離線單檔。
- `tests/fixtures/`: 去識別化公式與主管審核文字 golden fixtures。
- `SPEC.md`: 凍結需求、來源優先順序、公式、固定文字與驗收條件。

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

- C-020 以本機最新版取代舊版公開頁面，正式版入口改為 repository 根目錄 `index.html`。
- HIS2 固定檢驗整理已依本機 Excel 邏輯納回；Pharmacy note 固定文字以主管審核 Word 範本為最高來源。
- 院內 Excel、Word、病人資料、工作檔與測試截圖均留在本機，未加入公開發布內容。
- 本次發布前需通過公式、SOAP golden text、阻擋條件、手機版面、console 與敏感資料掃描。

## Recommended Next Step

1. 完成 C-020 發布前測試並推送 `main`。
2. 確認 GitHub Pages 顯示本機最新版。
3. 由院內藥師使用去識別化病例做 clinical sign-off。

## Verification Status

- Documentation gate: pass。
- Calculation gate: pass（Node 9/9；golden case 通過）。
- UI and note gate: pass（desktop／mobile／file protocol／download smoke test；C-002 圖表 console errors 0）。
- C-014 note linkage gate: pass（產生後修改感染適應症會同步更新輸出；Node 9/9）。
- C-018 cleanup gate: pass；Node 9/9、AUC 頁面 smoke test、匯入控制不存在且 console errors 0。
- C-019 Pages gate: pass；遠端 `index.html` SHA 與發布版本一致，Pages URL HTTP 200。
- C-020 integration gate: pass；AUC 349.67／new AUC 466.22、三種 AUC 判讀、15-dose、SOAP 逐字、HIS2 帶入、必填阻擋、390 px 與敏感資料掃描均通過，console 0 errors／warnings。
- Clinical gate: pending（院內藥師 pass/revise/reject）。
