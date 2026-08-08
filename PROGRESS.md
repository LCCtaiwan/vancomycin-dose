# PROGRESS

## Current Status

- Change ID: C-019
- Date: 2026-08-08
- Scope: 移除尚未與院內流程對齊的 Pharmacy note 檢驗值匯入原型，保留原本 Vancomycin AUC 與 Pharmacy note 功能。
- Status: 已部署 GitHub Pages；awaiting院內藥師確認下一版檢驗值功能規格與 clinical sign-off

## Completed

- 起始劑量、AdjBW／CrCl、雙點 AUC、15-dose profile 與人工新方案試算。
- 結構化 S/O/A/P note、藥師確認 gate、複製與 UTF-8 BOM TXT 匯出。
- `file://`／靜態伺服器、桌面／手機版瀏覽器驗收。
- AUC 目前依院內 Excel 使用給藥、trough、peak 三個日期時間欄位。
- 新增 15-dose peak/trough 濃度折線圖與目前／新方案逐次比較表。
- 移除姓名、病歷號、病房、主治醫師、住院日期、轉入日期欄位與 note 輸出標籤。
- 補齊 Excel 對應輸出：trough→peak 時間、預計給藥前血中濃度、New AUC、Predicted Peak/Trough。
- AUC 基本欄位填齊後自動更新目前方案模擬與 15-dose 濃度變化。
- Pharmacy note 臨床資料與人工新方案改為選填展開區。
- 移除非 Excel 的腎功能穩定／穩態勾選欄位，改於結果區顯示人工確認提醒。
- Note 句型依院內 Vancomycin 範例調整為精簡 S/O/A/P。
- AUC 輸入重整為 Excel 的 13 個欄位：目前 10 欄與更改方案 3 欄。
- 移除相對時間拆欄、輸注液量、新方案日期、預計採血日期及 AUC 頁面 note 勾選。
- 時間輸入改為 `YYYY/MM/DD HH:mm` 24 小時制文字格式，支援民國年輸入換算。
- 濃度圖改為每 0.25 小時的輸注上升與排除期指數下降曲線。
- 15-dose 主結果改為 Excel 橫向表格，顯示目前／New Peak、Trough。
- 更改 dose 可單獨輸入，空白 interval／輸注時間會沿用目前方案。
- 連續濃度曲線改為收合的輔助資訊。
- 給藥、trough、peak 時間改用原生日期／時間選擇器，分鐘步進，避免手動 key。
- 起始劑量介面與規則備註改為 Loading 20 mg/kg、maintenance 15 mg/kg/dose；loading cap 3000 mg。
- 雙點 AUC 區塊新增固定醒目提示：AUC24 目標 400–600 mg·h/L。
- 日期使用日曆點選；小時使用 00–23、分鐘使用 00–59 選單，不顯示 AM／PM。
- 在目前方案輸入區後新增「目前 AUC 結果（輸入完成後顯示）」標題與結果位置。
- Pharmacy note 已產生後，修改適應症、日期、診斷、培養、檢驗、生命徵象、評估或追蹤計畫會自動同步更新；直接編輯 note 後不覆寫人工文字。
- Pharmacy note 增加「重新讀取資料並更新 note」按鈕，可手動重新帶入最新欄位。
- 移除 C-016／C-017 的暫存 HIS2／Excel 匯入卡、解析程式與事件監聽，避免在規格未確認前影響原本頁面。
- 已將安全發布檔案推送至 `LCCtaiwan/vancomycin-dose`，排除院內 Excel、Pharmacy note 原始資料與截圖。

## Next Steps

1. 由院內藥師以去識別化案例標記 pass/revise/reject。
2. 驗證精簡 note 句型、監測日期與院內工作流程。
3. 臨床驗證通過後再建立 v0.1.0 milestone。

## Verification

- Node unit tests: pass（9/9）。
- Excel golden case: pass；AUC24 349.6663、new AUC24 466.2217，核心誤差在 acceptance gate 內。
- Browser smoke test: pass；起始劑量、RRT gate、AUC、note、下載、mobile、`file://`。
- Clinical sign-off: pending（需院內藥師確認）。
- C-002 browser UI: pass；desktop/mobile 圖表與 15-dose 表格無 console errors。
- C-003 unit coverage: pass；note 不再輸出已移除的識別欄位。
- C-004 browser UI: pass；Excel 對應輸出欄位與 15-dose profile 均存在，console errors 0。
- C-005 unit tests: pass（9/9）。
- C-005 browser UI: pass；Excel 欄位填齊後自動顯示 AUC 349.7 與 15 列 profile，note 選填，console errors 0。
- C-006 unit tests: pass（9/9）。
- C-006 browser UI: pass；Excel 日期時間輸入得到 AUC 349.7 與 15 列 profile，console errors 0。
- C-013 UI check: pass；完成目前兩點資料後，AUC24 結果位於人工新方案前方。
- C-012 browser UI: pass；時間選單無 AM／PM、24 小時選項正確，Excel golden AUC 349.7、console errors 0。
- C-007 unit tests: pass（9/9）。
- C-007 browser UI: pass；24 小時制輸入、連續曲線 735 個點、AUC 349.7、console errors 0。
- C-008 browser UI: pass；1–15 Dose 橫向表格、New dose 單欄快速試算、連續曲線收合、console errors 0。
- C-009 unit tests: pass（9/9）。
- C-009 browser UI: pass；三個欄位為 datetime-local、en-GB、60 分鐘步進，Excel golden AUC 349.7、console errors 0。
- C-010 unit tests: pass（9/9）。
- C-010 fixed-dose rule: pass；Loading／maintenance 常數與介面備註一致。
- C-011 UI check: pass；未計算前即可看見 AUC24 400–600 mg·h/L 目標提示。
- C-014 unit tests: pass（9/9）；note 測試補上適應症、診斷、培養與檢驗欄位帶入。
- C-014 browser UI: pass；產生 note 後修改感染適應症，輸出同步更新且無 console error。
- C-015 unit tests: pass（9/9）。
- C-015 browser UI: pass；重新讀取按鈕可更新 note，無 console error。
- C-018 unit tests: pass（9/9）；移除匯入原型後，原本 PK 與 note 測試維持通過。
- C-018 browser smoke: pass；AUC24 目標、15-dose profile 可正常顯示，無匯入控制殘留，console errors 0。
- C-019 GitHub Pages: pass；`https://lcctaiwan.github.io/vancomycin-dose/` HTTP 200，遠端 `index.html` 與本地發布版本一致。
