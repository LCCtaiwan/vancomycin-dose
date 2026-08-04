# Vancomycin 劑量與 Dose 調整

成人靜脈注射 vancomycin 的離線 HTML 教學／決策支援原型。

## 目的

- 用 AUC24/MIC 取代只看 trough 的思考框架。
- 顯示 Cockcroft–Gault CrCl 的估算與體重選擇提醒。
- 在判讀狀態顯示模型消除速率與半衰期。
- 以目前 AUC 與每日總劑量示範比例調整邏輯。
- 讓藥師輸入後續 dose／interval，查看預估 AUC24、peak、trough 與濃度曲線。
- 以最近一次 trough 為起點，逐次模擬調整後每次給藥的給藥前 trough、輸注結束 peak 與下一次 trough。
- 產生可複製與下載的疑義處方草稿；資料不足時不帶出具體新劑量。
- 在介面內固定呈現腎功能、抽血時機、腎毒性與人工覆核警示。

## 使用方式

直接以瀏覽器開啟 `outputs/vancomycin-dose.html`，不需要網路或安裝套件。

## 範圍

目前涵蓋成人 IV 的一般院內通用、嚴重 MRSA／重症，以及 HD／CRRT 首次劑量參考分支；HD／CRRT 不會進入自動 TDM 劑量調整。兒科、孕婦、燒燙傷、囊性纖維化、連續輸注與不穩定腎功能，暫不由工具自動產生劑量建議。

此工具不是醫囑、處方或院內 protocol 的替代品。
