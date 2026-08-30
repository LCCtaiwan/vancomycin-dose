# SPEC：Vancomycin 臨床藥師工作台

## 規格狀態

- 基準版本：`v2.1-frozen`
- 凍結日期：`2026-08-30`
- 狀態：`FROZEN / 使用者已確認目前需求`
- 適用範圍：正式 `index.html` 與後續功能更新。
- 目前實作狀態：本機最新版已整合為正式 `index.html`；C-020 GitHub Pages 發布與部署驗證進行中。

## 變更規則

1. 本文件是專案唯一的總需求基準。
2. 版面可以重排、分頁或收合，但不得因此刪除「必須保留」功能。
3. 要刪除功能、修改臨床公式或改變輸出語意時，必須先修改 SPEC，經使用者確認後才可改正式 HTML。
4. 每次改版都要逐項核對本文件的需求編號與驗收條件。
5. 使用者明確指示優先；若與 Excel 不同，SPEC 必須記錄差異，不可靜默改寫。

## 來源優先順序

1. 使用者已確認的臨床與工作流程需求。
2. 主管已審核通過、僅保存在本機的 Vancomycin Pharmacy note Word 範本；它是 SOAP 格式、固定句型、用詞、標點、大小寫、段落與參考資料的最高來源。網頁只能代入數值，不得潤稿或換同義詞，也不得複製病人資料。
3. 僅保存在本機的院內 Vancomycin AUC Excel，其 TDM、AUC 與逐次濃度公式為計算來源。
4. 僅保存在本機的院內 PharmacyNote 檢驗數值 Excel，其 HIS2 固定檢驗項目與檢驗文字邏輯為整理來源。
5. 已驗證的正式 HTML 功能與測試紀錄。
6. 新版面預覽只能重新組織以上內容，不可自行刪減。

## 目標與使用者

建立一個離線、單檔、手機可用的成人 IV vancomycin 臨床藥師工作台，讓藥師：

1. 共同資料只輸入一次。
2. 計算首次劑量與 Cockcroft–Gault CrCl。
3. 由實際 trough、給藥與 peak 時間計算 AUC。
4. 手動輸入想比較的後續 regimen，查看調整後 AUC 與逐次濃度。
5. 貼上 HIS2 資料，自動整理 Pharmacy note 必填檢驗文字。
6. 將藥師確認過的計算結果產生為 Pharmacy note／疑義處方確認建議。

本工具是決策輔助，不是自動醫囑。

## 凍結的頁面流程

1. 頂端：臨床安全提醒與完整假資料載入。
2. 共同欄位：病歷號、診斷、病人資料、腎功能與 RRT。
3. 工作分頁：
   - 起始劑量
   - TDM／AUC
   - Pharmacy note 檢驗數值整理
4. 最後區塊：Pharmacy note／疑義處方確認建議。

一次只顯示一個工作分頁；較長的 AUC 調整、逐次濃度與資料檢查區可收合，不能用刪功能的方式縮短頁面。

## 輸入

### 共同欄位

- 病歷號（選填，不輸入姓名）。
- 診斷 Diagnosis（自由文字）。
- 年齡、性別、身高、實際體重、血清肌酸酐 SCr。
- 腎功能狀態：相對穩定／不穩定。
- RRT 狀態：無 RRT／HD／CRRT。
- RRT／透析狀態近期是否改變。

### 首次劑量

- 感染／治療情境。
- CRRT 時的 effluent rate。

### 本次 TDM

- 目前每次劑量、給藥間隔、輸注時間與 MIC；MIC 欄位預設帶入 `1 mg/L`，藥師仍可手動修改。
- 給藥前 trough 濃度與抽血時間。
- 實際給藥開始時間。
- 給藥後 peak 濃度與抽血時間。

### AUC 調整試算

- 藥師手動輸入後續每次劑量、interval、輸注時間。
- 本次 peak 後至下一次給藥的實際間隔。
- 模擬給藥次數：1–15 次。
- 「後續每次劑量」使用原生數字欄位；按上下箭頭每格增減 `250 mg`，但仍可直接手動輸入其他正數。
- 不新增額外的 `+250 mg` 或 `−250 mg` 按鈕。

### HIS2

- 從 HIS2 複製後的原始文字／tabular data。
- 原始貼上內容只在瀏覽器記憶體處理，不上傳、不使用 localStorage。

## 計算規則

### IBW、AdjBW 與 CrCl

- 男性 IBW：`50 + 2.3 × (身高英吋 − 60)`。
- 女性 IBW：`45.5 + 2.3 × (身高英吋 − 60)`。
- 實際體重 `> IBW × 120%` 時，CrCl 使用 `AdjBW = IBW + 0.4 × (TBW − IBW)`。
- 其他情況使用實際體重。
- 年齡 `> 65 歲` 且 SCr `< 1 mg/dL` 時，CrCl 計算使用 SCr `1 mg/dL`。
- CrCl 使用 Cockcroft–Gault；女性乘以 `0.85`。
- 畫面需顯示 IBW、計算體重種類、使用的 SCr 與 CrCl。

### 首次劑量

- Loading dose：`25–35 mg/kg STAT`，以實際體重計算，最高 `3000 mg`。
- Maintenance dose：`15–20 mg/kg q8–12h`。
- 首次劑量輸出不因 AUC 調整欄的 `250 mg` step 而強制進位。
- HD／CRRT 保留獨立首次劑量參考分支。
- 腎功能不穩定或 RRT 狀態近期改變時，不輸出可直接採用的具體自動建議。

### AUC24

- 公式來源：院內 Vancomycin AUC Excel。
- 時間順序必須是：給藥前 trough → 實際給藥 → 輸注結束後 peak。
- 計算並顯示：消除速率 `k`、半衰期 `t½ = 0.693 / k`、Vd、CL、AUC24 與 AUC24/MIC。
- AUC24、MIC、AUC24/MIC 必須分開顯示，不使用容易誤解的合併字串。
- `AUC24/MIC = AUC24 ÷ MIC`。MIC 預設為 `1 mg/L`；MIC＝1 時兩個數字相同，畫面需說明這不是重複計算。
- 判讀：
  - `< 400`：低於目標。
  - `400–600`：目標範圍內。
  - `> 600`：高於目標。

### AUC 調整與濃度預測

- 後續 regimen 只能由藥師手動輸入，系統不可自動選擇新劑量。
- 顯示藥師輸入的新 dose／interval／輸注時間。
- 顯示預估 AUC24、AUC24/MIC、peak 與 trough。
- 依本次 peak 與 peak 後至下一次給藥時間，計算第 1 次新 regimen 給藥前濃度。
- 逐次顯示 1–15 次給藥的：
  - 給藥前 trough
  - 輸注結束 peak
  - 下一次給藥前 trough
- 濃度圖必須保留：
  - 目前 regimen 曲線
  - 藥師輸入的新 regimen 曲線
  - 實際 TDM 濃度標記
- 資料不足、時間錯誤、腎功能不穩定或有 RRT 時，不輸出具體調整結果。

## Pharmacy note 檢驗數值整理

### 巨集與公式分工

- 原 Excel 的 VBA 巨集只清除 A:J 並選取 A1。
- 真正的 HIS2 擷取、單位、CrCl 與文字組合由 Excel 公式完成。

### 固定抓取項目

- Vancomycin：Peak、Trough、T1/2。
- 發炎／腎功能：PCT、CRP、ESR、BUN、CRE。
- CBC：WBC、N.band、N.seg.、Hb、PL。
- 生命徵象：日期、體溫、脈搏、呼吸、血壓。

### 解析規則

- 依 Excel 預設的固定項目與欄位順序整理，不做自由猜測。
- 找不到的項目可以省略，但必須讓藥師知道。
- 同名多筆、異常單位、日期無法辨識或不確定數值必須標示「需人工確認」。
- 不確定資料不可靜默寫入 Pharmacy note。
- N.band 列存在但數值空白時，依來源 Excel 輸出 `0%`。

## Pharmacy note／疑義處方

- 最後輸出是「藥師計算後，建議供醫師確認」的內容，不是系統自動醫囑。
- 只有藥師確認後按下產生按鈕，才組成最終文字。
- 文字主體依院內 Vancomycin 範本固定使用 SOAP 順序，不改成自訂摘要格式：
  - `S:` 目前 Vancomycin dose、interval、IVD 與 diagnosis。
  - `O:` 年齡、性別、體重、診斷、培養／臨床補充、檢驗、生命徵象、腎功能及 Vancomycin level／AUC。
  - `A:` 依 AUC 使用 `Vancomycin AUC is below / within / above the target range. (400-600 mcg·h/mL)`。
  - `P:` 使用編號句子；維持目前劑量或寫入藥師手動試算的新 regimen、監測、48–72 小時再評估及聯絡語句。
- AUC 低於目標且藥師輸入較高每日總劑量時，P 段第一句固定使用 `Suggested increasing the Vancomycin dose to ... based on the patient’s AUC (...) .`。
- 其他需要調整的情境固定使用範本既有的 `Suggest adjusting Vancomycin to ... based on the patient’s AUC (...).`，不得自行改成新的句型。
- AUC 位於目標內且沒有試算新 regimen 時，使用 `Keep current dosage and monitor vancomycin levels and renal function weekly.`。
- 固定保留 `I will reassess for adequate infection response after 48-72 hrs.` 與 `If you have any questions, please contact me.`。
- 固定保留參考資料段：`Up To Date` 與 `The sanford guide to antimicrobial therapy`。
- 調整劑量時，藥師必須手動確認稀釋液量及下次 trough／peak 時間；未填妥時不產生不完整的 Pharmacy note。
- 範本中若出現 HD 排程、藥物交互作用或替代抗生素，但網頁沒有相對應的確認輸入，就不得自行補寫或猜測。
- 必須帶入：
  - 診斷；病歷號保留在共同欄位供畫面辨識，但不重複插入 SOAP 文字主體
  - 年齡、性別、體重與使用的計算體重
  - SCr、CrCl；RRT 情境由安全閘門阻擋，不套用一般 AUC SOAP 範本
  - HIS2 整理後的檢驗、CBC 與生命徵象
  - 實際 peak／trough／T1/2
  - 目前 regimen、AUC24 與目標判讀
  - 藥師手動輸入的新 regimen
- 試算後 AUC、AUC24/MIC、peak 與 trough 保留在 TDM 試算畫面；核准範本沒有對應語句，因此不得自行造句插入 Pharmacy note。
- 「Vancomycin level 整理」依核准範本只帶入實際 peak、trough、t1/2 與目前 AUC。
- 沒有藥師手動輸入新 regimen 時，不帶入新劑量。
- 資料不足或安全閘門啟動時，不產生未經核准的替代句子，並清除之前的舊 Pharmacy note。
- 決策輔助與非自動醫囑提醒保留在網頁介面，不插入主管核准的 Pharmacy note 複製文字。
- 支援複製與下載 UTF-8 TXT。

## 必須保留的功能對照表

| ID | 必須保留功能 | 主要來源 | 驗收證據 |
| --- | --- | --- | --- |
| FR-001 | 病歷號、診斷與共同病人欄位 | 使用者確認／既有 HTML | 完整假資料可帶入；診斷進入 S／O，病歷號不重複寫入 SOAP 主體 |
| FR-002 | IBW、AdjBW、SCr floor、CrCl | 兩份院內 Excel／使用者確認 | 66歲男性範例 CrCl 82.9 mL/min |
| FR-003 | Loading 25–35 mg/kg STAT，上限3000 mg | 使用者確認 | 100 kg 顯示2500–3000 mg；高體重不超過3000 mg |
| FR-004 | Maintenance 15–20 mg/kg q8–12h | 使用者確認 | 100 kg 顯示1500–2000 mg q8–12h |
| FR-005 | 腎功能不穩定、RRT 與近期改變安全閘門 | 既有 HTML／使用者確認 | 不輸出具體 TDM 調整 |
| FR-006 | trough → 給藥 → peak 時間順序 | Vancomycin AUC Excel | 錯誤時間顯示阻擋理由 |
| FR-007 | AUC24、MIC、AUC24/MIC 分開顯示 | 使用者確認 | MIC=1 顯示相同數值與說明 |
| FR-008 | AUC低／正常／高三段判讀 | Excel／使用者回饋 | 400與600邊界測試 |
| FR-009 | 藥師手動輸入後續 regimen | 使用者確認／既有 HTML | 空白時不產生新劑量 |
| FR-010 | 後續劑量原生箭頭 step=250，保留手動輸入 | 使用者確認 | step屬性250；可輸入非250倍數正數 |
| FR-011 | 調整後 AUC、peak、trough | Vancomycin AUC Excel | 1000 mg q12h 範例與 Excel 相符 |
| FR-012 | 1–15 次逐次濃度表 | Vancomycin AUC Excel | 第1與第15次數值可核對 |
| FR-013 | 目前／調整後濃度圖與實際點 | Excel數列／既有 HTML | 圖中兩條曲線與實際標記存在 |
| FR-014 | HIS2 固定檢驗項目整理 | PharmacyNote Excel | 公式反推 fixture 逐字比對 |
| FR-015 | 實際 AUC 寫入 Vancomycin level 與 Pharmacy note；試算 AUC 留在試算畫面 | 主管核准範本／使用者確認 | note 有實際 AUC；無範本外的預測 AUC 新句型 |
| FR-016 | 逐字遵循院內 SOAP 與參考資料；安全提醒留在介面 | 主管核准 Vancomycin Pharmacy note 範本／使用者確認 | 與 `tests/fixtures/approved-pharmacy-note-demo.expected.txt` 逐字比對 |
| FR-017 | 複製與 UTF-8 TXT 下載 | 既有 HTML | 可取得完整 note |
| FR-018 | 分頁／收合但不可刪功能 | 使用者確認 | 一次一分頁，所有 FR 仍可操作 |

## 凍結驗收案例

### 完整假資料

- 病人：66歲男性、172.1 cm、100 kg、SCr 0.6 mg/dL、腎功能穩定、無 RRT。
- 預期：IBW 67.84 kg、AdjBW 80.70 kg、CrCl 82.9 mL/min。
- Loading：2500–3000 mg STAT。
- Maintenance：1500–2000 mg q8–12h。
- 目前 regimen：750 mg q12h、輸注60分鐘、MIC 1。
- Trough：10.2 mg/L，2026-08-03 08:19。
- 實際給藥：2026-08-03 08:41。
- Peak：17.6 mg/L，2026-08-03 11:53。
- 預期 AUC24：349.6662715 mg·h/L，AUC24/MIC 相同並判讀低於目標。
- 藥師試算：1000 mg q12h、輸注60分鐘。
- 預期新 AUC24：466.2216953 mg·h/L。
- 預期穩態 peak／trough：27.0554439／13.2812321 mg/L。
- 第1次新 regimen peak／trough：24.4390034／11.9968490 mg/L。
- 顯示15次逐次濃度與兩條濃度曲線。
- 診斷、檢驗與目前 AUC 進入 Pharmacy note；試算 AUC 留在 TDM 畫面，不產生核准範本以外的新句子。

### 安全案例

- 腎功能不穩定、RRT、RRT近期改變、Peak≤trough、時間順序錯誤、interval≤輸注時間時：
  - 不顯示具體新劑量。
  - 清除舊的 AUC 調整與逐次濃度結果。
  - 清除舊 Pharmacy note，畫面顯示人工覆核提醒；不產生核准範本以外的替代句子。

### 介面案例

- `file://` 可離線開啟。
- 390 px 手機寬度無整頁水平溢出；寬表格只在自己的容器內橫向捲動。
- 一次只顯示一個工作分頁。
- 所有欄位可用鍵盤操作。
- 瀏覽器 console 無 error／warning。

## 排除範圍

- 兒科、孕婦、燒燙傷、囊性纖維化、連續輸注、非 IV 口服 C. difficile protocol。
- Bayesian 軟體整合。
- 直接產生醫囑或自動替藥師選擇新 regimen。
- 將病人資料上傳、寫入雲端或保存在 localStorage。

## 臨床正式使用前仍須完成

1. 仍需一份去識別化的真實 HIS2 複製原文，確認 tab、換行與空欄格式。
2. 需由藥師／醫師用院內案例人工覆核欄位語意與 Pharmacy note 文字。
3. 每次正式更新都必須重新執行 Excel 公式比對、功能對照、桌機／手機與匯出測試。
4. GitHub Pages 是公開原型展示；部署成功不等於已通過院內臨床核准。
