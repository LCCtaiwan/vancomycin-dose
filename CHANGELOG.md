# Changelog

## C-001

- 建立單檔離線 HTML 原型與內容規格。
- 核心採 AUC24/MIC 400–600 mg·h/L；不以 trough 15–20 mg/L 作為唯一目標。
- 加入 Cockcroft–Gault 教學估算、loading dose 範圍、AUC 比例調整參考與安全警示。
- 驗證：待瀏覽器檢查。

## C-002

- 建立 `outputs/vancomycin-dose.html`，提供患者／腎功能、給藥 regimen、peak／trough、兩點濃度模型、候選劑量與濃度曲線。
- 加入疑義處方文字的複製與 UTF-8 TXT 下載；正常資料帶出目前／建議 regimen、peak／trough、抽血時間、AUC、腎功能與 RRT 狀態。
- 匯出不包含 protocol、模型版本或版本日期；腎功能不穩定、RRT 或資料品質不合格時只輸出「資料不足，需人工覆核」。
- 驗證：離線頁面載入、穩定情境候選方案、CRRT／不穩定腎功能安全閘門、TXT 下載、禁止欄位掃描均通過；console 0 errors／0 warnings。

## C-003

- 調整頁面流程順序：病人資料 → 首次建議劑量 → TDM → 劑量調整與濃度預估 → 疑義處方匯出。
- 驗證：桌機／手機 DOM 順序正確，首次劑量與 TDM 原有互動仍正常；console 0 errors／0 warnings。

## C-004

- 重構首次劑量呈現：先選感染／治療情境；HD／CRRT 改走 RRT 專用分支，CRRT effluent rate 僅在 CRRT 路徑顯示。
- 一般成人、嚴重感染、HD、CRRT 的 loading／maintenance／監測資訊分開顯示，避免不同情境混用。
- 驗證：一般成人、嚴重感染 loading、CRRT 條件式欄位與 RRT 自動調整阻擋均通過；console 0 errors／0 warnings。

## C-005

- 依使用者提供的院內通用規則，將一般成人首次 regimen 設為 15–20 mg/kg q8–12h。
- 介面標示為「院內首次 regimen」，避免把帶有 q8–12h 頻率的 regimen 誤讀為一次性 loading dose；嚴重感染與 HD／CRRT 仍使用獨立路徑。
- 驗證：一般成人、嚴重感染、CRRT、CRRT 超出範圍與 390px 手機寬度均通過；console 0 errors／0 warnings。

## C-006

- 在 TDM 區新增「藥師輸入後續 regimen」欄位，輸入 dose／interval 後即時顯示預估 AUC24、peak、trough。
- 濃度圖的虛線優先代表藥師輸入的後續 regimen；原有同 interval 候選比較表保留。
- TDM 資料不足或後續 interval 短於輸注時間時，不顯示具體後續濃度；試算不會自動改寫疑義處方。
- 驗證：750 mg q12h 試算結果、無效 interval 安全閘門、390px 無水平溢出與 console 0 errors／0 warnings 均通過。

## C-007

- 一般成人分支改為分開顯示：loading dose 為單次 15–20 mg/kg；院內首次 regimen 為後續 15–20 mg/kg q8–12h。
- 嚴重感染、HD、CRRT 分支同步將第一張卡標為 loading dose，第二張卡標為後續 maintenance，避免把單次劑量與給藥頻率混在一起。
- 驗證：一般成人與嚴重感染分支的標籤／數值、TDM 試算功能與 console 0 errors／0 warnings 均通過。

## C-008

- 新增調整後固定 dose／interval 的逐次給藥模擬，預設可模擬 6 次，最多 12 次。
- 逐列顯示給藥次序、給藥時間、給藥前 trough、輸注結束 peak、下一次給藥前 trough；濃度圖同步改為時間序列比較。
- 以最近一次 trough 作為第 1 次調整後給藥前起點；interval 短於輸注時間或資料不足時不產生具體逐次濃度。
- 驗證：750 mg q12h 四次模擬、無效 interval 安全閘門、390px 無水平溢出與 console 0 errors／0 warnings 均通過。

## C-009

- 移除「候選 regimen 比較」表格區塊，避免與藥師輸入的後續 regimen 試算混淆。
- 保留逐次給藥濃度表、調整後時間序列曲線與疑義處方匯出；若已輸入後續 regimen，匯出優先使用該試算值。
- 驗證：候選區塊移除、有效逐次模擬、疑義處方匯出與 console 0 errors／0 warnings 均通過。

## C-010

- 移除「本次 TDM 與後續 regimen 試算」與「逐次給藥濃度預估」兩個重複標題。
- 保留 TDM 欄位、後續 regimen 輸入、狀態提示、逐次濃度表與時間序列曲線。

## C-011

- 在「判讀狀態」加入半衰期 t½，依模型 `ln(2)／k` 計算並以小時顯示。
- 有效模型示範值約為 7.5 h；資料不足時維持顯示 `—`。

## C-012

- 準備公開 GitHub repository `LCCtaiwan/vancomycin-dose` 與 GitHub Pages workflow。
- 發布目標：`main` 分支 push 後由 GitHub Actions 部署根目錄內容。
