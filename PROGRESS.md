# PROGRESS

## Current Status

- Change ID: C-020
- Date: 2026-08-30
- Scope: 將本機最新版整合成正式 `index.html`，恢復完整臨床藥師工作流程並安全發布。
- Status: 整合與發布前驗證通過，準備推送 GitHub Pages。

## Completed

- 共同欄位、首次劑量、AdjBW／CrCl 與大於 65 歲腎功能規則。
- 院內 Excel 對應的雙點 AUC 計算、人工新方案試算、預測濃度、15-dose 表格與濃度圖。
- AUC 低於、介於或高於目標範圍的判讀分支。
- HIS2 固定檢驗資料貼上、欄位整理、單位組合與 Pharmacy note 帶入。
- 主管審核範本一致的 S/O/A/P 句型、段落、標點與參考資料。
- 藥師確認 gate、複製、UTF-8 TXT 匯出、手機版面與離線操作。
- 將院內 Excel、Word 範本、工作檔與截圖排除於公開 repository。
- 舊版分離式 `js/`、`css/` 實作已由本機最新版單檔取代；舊內容仍可從 Git 歷史找回。

## Next Steps

1. 以 C-020 commit 推送 `main`，確認 GitHub Pages 成功更新。
2. 由院內藥師使用去識別化案例做 clinical sign-off。

## Verification

- 文件與隱私 gate：pass；無院內 Excel、Word、圖片、絕對本機路徑或已知病人識別資料。
- 公式 golden case：pass；AUC24 349.67、試算 AUC24 466.22、15-dose 15 列。
- AUC 判讀分支：pass；低於、目標範圍內（501.96）及高於目標（813.40）皆正確。
- Pharmacy note golden text：pass；與主管核准去識別化 fixture 逐字一致（1083 字元）。
- 必填 gate：pass；缺稀釋液量時清空舊文字並阻擋產生建議。
- HIS2 整理：pass；預覽三區可完整帶入 Pharmacy note 欄位。
- 桌機／手機 UI 與 console：pass；390 px 無水平溢出，console 0 errors／warnings。
- GitHub Pages：待 push 後確認。
- Clinical sign-off：pending。
