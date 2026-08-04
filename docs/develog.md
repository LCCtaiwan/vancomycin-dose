# Development Log

## Current Goal

建立成人 IV vancomycin 劑量與 dose adjustment 的離線 HTML 教學／決策支援原型，讓使用者看懂 AUC 導向調整與必要的人工覆核點。

## Stack And Run Commands

- 單檔 HTML、CSS、原生 JavaScript；不依賴外部資源。
- 使用方式：瀏覽器開啟 `outputs/vancomycin-dose.html`。
- 瀏覽器驗證：使用 Playwright CLI 檢查 file://、互動與 responsive layout。

## Completed Work

- C-001：完成內容邊界、規格、進度紀錄與第一版 HTML 原型。
- 來源邊界：2020 ASHP/PIDS/SIDP/IDSA vancomycin consensus guideline 與 FDA/DailyMed vancomycin label。
- C-002：建立 `outputs/vancomycin-dose.html`，加入劑量調整、濃度預估、疑義處方複製／TXT 匯出與安全閘門。
- C-003：重排 UI 流程為病人資料、首次劑量、TDM、調整、匯出，讓首次施打情境先於治療後監測。
- C-004：將首次劑量改為情境分流，不再把一般成人、嚴重感染與 RRT 條件放在同一個控制群組。
- C-005：依使用者提供的院內通用規則，將一般成人首次 regimen 顯示為 15–20 mg/kg q8–12h；一次性 loading dose、嚴重感染與 HD／CRRT 維持獨立呈現。
- C-006：在 TDM 區加入藥師後續 dose／interval 試算，顯示預估 AUC24、peak、trough 與濃度曲線；不合理 interval 不產生具體濃度。
- C-007：依使用者澄清，將一般成人 loading dose 改為單次 15–20 mg/kg，後續院內首次 regimen 顯示 15–20 mg/kg q8–12h；其他專用分支同步使用單次／後續的標籤分流。
- C-008：將後續 regimen 由單一穩態曲線擴充為逐次給藥模擬，從最近 trough 起算每次給藥前後的濃度，並以時間序列圖呈現。
- C-009：移除候選 regimen 比較表格，只保留藥師輸入後續 regimen 的逐次給藥濃度表與時間序列曲線；匯出優先使用藥師試算值。
- C-010：移除使用者標記的兩個重複標題，避免 TDM 與逐次濃度區塊視覺層級重複。
- C-011：在判讀狀態加入半衰期 t½，使用模型消除速率 k 以 ln(2)／k 計算。
- C-012：依使用者要求準備建立公開 GitHub repository 並透過既有 Pages workflow 發布。
- C-013：根據首次部署錯誤，將 Pages workflow 的 repository enablement 設為 true。
- C-014：確認修正後 workflow 成功，GitHub Pages URL 可正常回應。

## Current Checkpoint

- 原型採「判讀工作台」視覺方向：輸入、結果、警示三區並列。
- 目前排除兒科、孕婦、連續輸注與不穩定腎功能自動調整；HD／CRRT 僅提供首次劑量參考並阻擋 TDM 自動調整。

## Verification Status

- Source gate：pass（來源已明確）。
- Content gate：pass for one-pass prototype。
- Style gate：pass for one-pass prototype；未建立三套獨立視覺範本。
- Browser gate：pass；穩定、CRRT、不穩定腎功能、TXT 下載與 forbidden export metadata 均已驗證。
- C-005 Browser gate：pass；一般成人院內首次 regimen、嚴重感染 loading、CRRT effluent 條件式顯示、超出範圍人工覆核、390px 無水平溢出與 console 0 errors／0 warnings 均已驗證。此次重新驗證使用 HTTP 預覽；兩個瀏覽器工具均拒絕直接讀取 file://，未繞過其安全政策。
- C-006 Browser gate：pass；空白試算、750 mg q12h 試算、interval 短於輸注時間的阻擋、390px 無水平溢出與 console 0 errors／0 warnings 均已驗證。此次驗證使用 HTTP 預覽。
- C-007 Browser gate：pass；一般成人顯示單次 loading dose 15–20 mg/kg 與後續院內首次 regimen 15–20 mg/kg q8–12h，嚴重感染顯示獨立 loading／maintenance，console 0 errors／0 warnings。
- C-008 Browser gate：pass；750 mg q12h 四次逐次模擬、無效 interval 阻擋、390px 無水平溢出與 console 0 errors／0 warnings 均已驗證。此次驗證使用 HTTP 預覽。
- C-009 Browser gate：pass；候選 regimen 區塊已移除，750 mg q12h 逐次模擬、AUC／peak／trough 顯示、匯出優先使用試算值與 console 0 errors／0 warnings 均已驗證。此次驗證使用 HTTP 預覽。
- C-010 Browser gate：pass；兩個指定標題已移除，TDM 欄位與逐次給藥區塊仍正常載入，console 0 errors／0 warnings。此次驗證使用 HTTP 預覽。
- C-011 Browser gate：pass；有效模型顯示半衰期 7.6 h，腎功能不穩定時顯示 `—`，四項判讀指標與 390px 手機版均正常，console 0 errors／0 warnings。此次驗證使用 HTTP 預覽。
- C-012 Publish gate：pass；GitHub Pages workflow 成功，網站 URL 回應 HTTP 200。
- C-014 Publish verification：pass；run `30879736944` success，URL 回應 HTTP 200。
