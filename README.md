# Vancomycin AUC 與 Pharmacy Note 產生器

院內成人 Vancomycin 臨床決策輔助工具。支援經驗起始劑量、雙點一室模型 AUC 計算、人工新方案試算，以及 Pharmacy note 複製與 TXT 匯出。

## 適用範圍

- 成人（18 歲以上）、間歇輸注、非腎替代療法。
- AUC/MIC 目標 400–600，MIC 預設 1 mg/L。
- Loading dose 20 mg/kg TBW（上限 3000 mg）；maintenance 15 mg/kg/dose TBW。
- 僅供臨床決策輔助，所有方案須由藥師或醫師覆核。

## 使用方式

直接開啟 `index.html`，或在專案目錄執行：

```bash
python3 -m http.server 8000
```

然後開啟 `http://localhost:8000/`。

## GitHub Pages

公開使用網址：<https://lcctaiwan.github.io/vancomycin-dose/>

## 測試

```bash
node --test js/pk.test.js js/note.test.js
```

## 重要路徑

- `js/pk.js`：劑量與 PK/AUC 純函式。
- `js/note.js`：Pharmacy note 純文字模板。
- `js/ui.js`：表單、狀態、AUC 濃度圖表、逐次比較、複製與 TXT 匯出。
- `docs/develog.md`：決策與驗證紀錄。

本工具不使用 localStorage、Cookie、資料庫或遠端 API，重新整理即清除輸入資料。

工具不要求輸入病人姓名、病歷號、病房、主治醫師、住院日期或轉入日期；請在院內既有系統或 note 表頭處理病人識別資訊。

## AUC 輸入方式

AUC 頁面依院內 Excel 保留單一的給藥時間、trough 時間與 peak 時間欄位；日期用日曆點選，小時使用 `00–23`、分鐘使用 `00–59` 選擇，不顯示上午／下午。輸入完整欄位後會自動計算目前／人工新方案的連續濃度曲線、15-dose peak/trough 與逐次比較表。

輸出欄位同步包含 trough 到 peak 時間、預計給藥前血中濃度、New AUC、Predicted Peak 與 Predicted Trough。
