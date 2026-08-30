# 過去對話與開發摘要

## 這份檔案是什麼

這不是原始對話逐字稿。舊任務的完整聊天內容目前無法直接讀取。

以下內容是根據舊工作目錄中的 `README.md`、`SPEC.md`、`content.md`、
`CHANGELOG.md`、`PROGRESS.md`、`docs/develog.md`、Git commit 紀錄與最後成品交叉整理。
只寫能被這些檔案證明的事情，不補猜測。

## 專案原本要解決什麼問題

做一個成人靜脈注射 vancomycin 的離線單檔 HTML 工具，幫藥師或醫師：

1. 看懂 AUC24/MIC 導向的 TDM 思路。
2. 估算 Cockcroft–Gault CrCl，但同時看見公式的限制。
3. 分開判讀首次 loading dose 與後續 maintenance regimen。
4. 輸入 TDM 結果與想試算的新 dose／interval。
5. 查看預估 AUC、peak、trough、半衰期和逐次給藥濃度變化。
6. 產生可複製的疑義處方草稿，但不把工具結果當成自動醫囑。

## 對話中逐步確定的主要決策

### 1. 先把安全邊界講清楚

- 工具定位是教學與臨床決策輔助，不是自動開藥。
- 核心目標採 AUC24/MIC 400–600 mg·h/L，假設 MIC = 1 mg/L。
- 不再只用 trough 15–20 mg/L 當唯一目標。
- 腎功能不穩定、資料品質不夠或 RRT 狀態改變時，不輸出具體新劑量。

### 2. 劑量文字需要分清楚

- 一般成人 loading dose：單次 15–20 mg/kg。
- 使用者提供的院內首次 regimen：15–20 mg/kg q8–12h。
- 兩者要分開顯示，避免把「單次 loading」和「後續頻率」混在一起。
- 嚴重 MRSA／重症、HD、CRRT 各走自己的分支，不和一般成人混用。

### 3. TDM 從單一結果變成藥師試算工作台

- 使用者可輸入目前 dose、interval、peak、trough 與抽血時間。
- 藥師另外輸入想嘗試的後續 dose／interval。
- 工具即時計算預估 AUC24、peak、trough、消除速率與半衰期。
- 後來加入逐次給藥模擬：從最近一次 trough 開始，顯示每次給藥前濃度、輸注結束 peak 與下一次 trough。

### 4. 介面持續做減法

- 流程重排為：病人資料 → 首次劑量 → TDM → 調整與濃度預估 → 匯出。
- 移除候選 regimen 比較表，只保留藥師自己輸入的試算值。
- 移除兩個重複標題，避免畫面一直說同一件事。
- 判讀狀態補上半衰期 `t½ = ln(2) / k`。

### 5. 匯出內容必須有安全閘門

- 可複製文字，也可下載 UTF-8 TXT。
- 資料足夠時，匯出目前與試算 regimen、peak／trough、抽血時間、AUC、腎功能與 RRT 狀態。
- 資料不足時，只寫「資料不足，需人工覆核」，不能給具體新劑量。
- 草稿固定提醒：「本內容為決策輔助草稿，不是自動醫囑」。

### 6. 最後發布成 GitHub Pages

- C-012 建立公開 repository 與 Pages workflow。
- C-013 修正新 repository 尚未啟用 Pages 的問題。
- C-014 記錄部署成功；當時 `https://lcctaiwan.github.io/vancomycin-dose/` 回應 HTTP 200。

## C-001 到 C-014 的開發地圖

| 編號 | 做了什麼 |
|---|---|
| C-001 | 定義內容、安全邊界與第一版單檔 HTML 原型 |
| C-002 | 完成 TDM 計算、濃度圖、匯出與安全閘門 |
| C-003 | 重排操作流程 |
| C-004 | 一般、重症、HD、CRRT 分流 |
| C-005 | 加入院內一般成人 15–20 mg/kg q8–12h 規則 |
| C-006 | 加入藥師後續 dose／interval 試算 |
| C-007 | 明確拆開 loading dose 與後續 regimen |
| C-008 | 加入逐次給藥濃度模擬 |
| C-009 | 移除候選 regimen 比較表 |
| C-010 | 移除重複標題 |
| C-011 | 加入半衰期 |
| C-012 | 準備 GitHub repository 與 Pages workflow |
| C-013 | 修正 Pages 啟用設定 |
| C-014 | 部署成功並記錄驗證結果 |

## 已有驗證證據

- 舊紀錄寫明：桌機與 390 px 手機版沒有水平溢出。
- 一般成人、重症、CRRT、腎功能不穩定、無效 interval、逐次給藥與 TXT 匯出都曾做過瀏覽器檢查。
- 多輪檢查記錄為 console 0 errors／0 warnings。
- C-014 記錄 GitHub Pages workflow 成功與網址 HTTP 200。

這些是歷史紀錄，不等於 2026-08-30 已重新執行全部測試。

## 現在還不能當成已完成的事情

- 尚未完成院內臨床審核。
- rounding、HD／CRRT 細節與正式部署規則仍需藥師／醫師確認。
- 兒科、孕婦、燒燙傷、囊性纖維化、連續輸注與不穩定腎功能，不在自動建議範圍。
- 2026-08-30 已重新接回既有 Git 歷史與遠端 repository；C-020 正在整合發布。

## 本次整理的來源

- 舊版工作目錄與目前專案目錄的規格、內容稿、Git 紀錄及成品。
- 舊 Git 最後 commit：`3de85e6`，訊息為 `C-014 chore: record Pages deployment`
- 舊成品 SHA-256：`214ce9fe4def87c83c3ac2e74f6724fa7a02cf6180fae109da84fd6b1f802d96`
