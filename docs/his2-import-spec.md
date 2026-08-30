# HIS2 貼上整理功能規格

## 目的

讓藥師從院內 HIS2 複製檢驗與生命徵象資料，一次貼上後自動整理成 Pharmacy note 可用的句子。

參考檔：僅保存在本機、未發布的 `PharmacyNote檢驗數值(1090424版).xls`

- 原始檔案 SHA-256：`710f0f4bfc91acd51789cacfa12f0dc34edd903245de4d832e2e5b92a7e59f23`
- 工作表：`工作表1`、`ICU`、`工作表2`、`工作表3`
- `工作表2`、`工作表3` 為空白；有效邏輯在前兩張。
- 原檔的 HIS2 貼上區是空白的，沒有真實剪貼範例；目前已由公式反推出可重複驗證的 TSV fixture。

## 使用者流程

1. 從 HIS2 複製資料。
2. 貼到 Excel 左側 A–G 欄，保留 HIS2 的欄位順序。
3. 手動填寫性別、年齡、身高、體重。
4. Excel 用檢驗名稱找數值，計算 IBW、AdjBW、BMI 與 Cockcroft–Gault CrCl。
5. 複製右側已整理文字，貼入 Pharmacy note。

## HIS2 貼上區的欄位用法

Excel 公式對左側欄位有固定期待：

| 原始欄位 | Excel 怎麼用 | 重要關鍵字 |
| --- | --- | --- |
| A:B | Vancomycin 濃度與半衰期 | `Peak`、`Trough`、`T1/2` |
| A、C、E、F、G | 生命徵象日期、體溫、脈搏、呼吸、血壓 | `日期`、`體溫`、`脈搏`、`呼吸`、`血壓mmHg` |
| D:E:F | 檢驗日期、檢驗名稱、檢驗數值 | `PCT`、`CRP`、`ESR`、`BUN`、`CRE`、`WBC`、`N.band`、`N.seg.`、`Hb`、`PL` |

目前公式使用「完全相同」的文字找尋。例如 HIS2 若變成 `Cr`、`CREAT`、`Platelet` 或多了空白，舊 Excel 就可能找不到。

## 手動輸入與計算

### 手動輸入

- 性別：`male` 或 `female`
- 年齡：歲
- 身高：cm
- 實際體重：kg

### 體重與腎功能

- IBW：
  - 男性：`50 + 2.3 × (身高英吋 - 60)`
  - 女性：`45.5 + 2.3 × (身高英吋 - 60)`
- 體重達 IBW 的 120% 時，CrCl 使用 `AdjBW = IBW + 0.4 × (TBW - IBW)`。
- 未達 120% 時，CrCl 使用 TBW。
- Excel 公式在年齡 `>= 65` 且 CRE `< 1` 時，把 CrCl 計算使用的 SCr 設為 1 mg/dL。
- CrCl：Cockcroft–Gault，女性再乘 0.85。
- 同時顯示未使用 AdjBW 的「校正前 CrCl」與 BMI。

## 自動整理的輸出

### 1. 基本資料

`{Age} year-old {sex}, Wt {TBW}kg`

如果使用校正體重，舊 Excel 會再顯示 `(ABW {AdjBW}kg)`。這裡實際計算的是 AdjBW，`ABW` 是舊檔用詞。

### 2. 發炎指標與腎功能

依有找到的項目依序組合：

`PCT → CRP → ESR → BUN → CRE → CrCl`

沒找到的項目直接略過，不顯示空標籤。

### 3. CBC

依序組合：

`WBC → N.band → N.seg. → Hb → PL`

WBC 所在列的 D 欄當日期。`N.band` 有該列但空白時輸出 0%。

### 4. 生命徵象

- `工作表1`：`Vital signs: BT ... C, PR ... BPM, RR ... BPM, BP ... mmHg.`
- `ICU`：`Vital signs: T: ...C, HR: ..., RR: ..., BP: ... mmHg.`
- 民國七碼日期以前三碼加 1911，組成西元 `YYYY/MM/DD`。

### 5. Vancomycin 濃度

`{TODAY} Vanco(peak)：{Peak} ug/ml、Vanco(trough)：{Trough} ug/ml, T1/2 : {T1/2} hr.`

日期使用 Excel 開啟當天，不是 HIS2 檢驗日期。

## 已確認的網頁差異與待驗證邊界

1. 來源 Excel 使用年齡 `>= 65` 套用 SCr 最低 1.0；依使用者確認，網頁採「大於 65 歲」，65 歲本身不套用。
2. 來源 Excel 在 TBW 「等於」IBW 120% 時就使用 AdjBW；依凍結 SPEC，網頁採「大於 120%」。
3. Excel 沒有保留真實 HIS2 剪貼範例。這不會阻擋依公式 fixture 開發解析邏輯；但上線前仍需用一份去識別化的真實剪貼原文，確認 tab、換行與空欄的實際樣子。
4. 網頁應保留「原始貼上文字」和「解析後結果」兩區，不應靜默改寫臨床數值。
5. 找不到、同名多筆、單位改變、日期格式無法辨識時，應標示「需人工確認」，不可自行猜測。

## 已實作的網頁介面

為了不讓網頁變得很長，HIS2 整理應放在「Pharmacy note 資料」裡的收合區：

1. 一個「貼上 HIS2 資料」的大文字框。
2. 一個「解析」按鈕。
3. 一張簡短預覽：找到的數值、找不到的數值、需人工確認的項目。
4. 使用者按「帶入 Pharmacy note」後才寫入現有欄位。
5. 整個過程只在瀏覽器記憶體處理，不上傳、不存檔、不用 localStorage。

## 公式反推驗證

驗證狀態：`pass`。

- 測試輸入：`tests/fixtures/his2-formula-derived.tsv`
- 預期數值與句子：`tests/fixtures/his2-formula-derived.expected.json`
- 測試情境：66 歲男性、172.1 cm、100 kg、CRE 0.6 mg/dL，包含發炎指標、CBC、生命徵象、Peak、Trough 與 T1/2。
- 驗證結果：SCr 最低 1.0、AdjBW 80.70 kg、CrCl 82.9 mL/min，五段輸出文字均可由原 Excel 公式產生。
- `N.band` 列存在但數值空白時，LibreOffice 重算結果為 `N.band: 0%`，與原公式設計一致。
- 測試 fixture 是依公式反推，不代表 HIS2 實際剪貼格式已通過驗收。

## 驗收準則（待 HIS2 範例補齊）

- 去識別化 HIS2 範例可正確識別檢驗、CBC、生命徵象與 Vancomycin 濃度。
- 整理句子與 Excel 在相同輸入下逐字比對。
- 缺值、異常單位、重複名稱與錯誤日期會顯示警示。
- 不自動將不確定的數值寫入 Pharmacy note。
- 桌機與手機不產生水平溢出。
- 瀏覽器 console 無錯誤。
