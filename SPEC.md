# SPEC

## Goal

以純前端、可離線的單頁工具取代院內 Vancomycin AUC Excel 的主要工作流程，並將計算結果帶入既有 Pharmacy note。

## Inputs

- 病人與 note 表頭資料。
- 起始劑量：年齡、性別、身高、TBW、SCr、RRT、適應症。
- AUC：dose、interval、infusion duration、給藥時間、trough 時間／濃度、peak 時間／濃度、MIC、下一次輸注間隔；時間格式為 24 小時制 `YYYY/MM/DD HH:mm`。
- 人工新方案：dose、interval、infusion duration。
- 診斷、培養、實驗室、生命徵象及藥師資料。

## Outputs

- IBW、CrCl dosing weight、Cockcroft–Gault CrCl、起始劑量候選值與間隔提示。
- ke、半衰期、Cmax/Cmin、Vd、CL、AUC24、AUC/MIC、15-dose profile。
- 人工新方案的 New AUC、穩態 peak/trough 與 15-dose profile。
- 目前／新方案 15-dose peak/trough 折線圖與逐次比較表。
- Excel 對應的 trough 到 peak 時間、預計給藥前血中濃度、New AUC、Predicted Peak、Predicted Trough。
- 可編輯 Pharmacy note、剪貼簿內容與 UTF-8 BOM TXT。

## Clinical Rules

- 成人 ≥18 歲；RRT 首版不支援。
- Vancomycin mg/kg 用 TBW；肥胖時 Cockcroft–Gault 用 AdjBW。
- Loading 20 mg/kg，cap 3000 mg；maintenance 15 mg/kg/dose。
- 250 mg 候選值須顯示實際 mg/kg，最終方案由藥師確認。
- AUC24：<400 low、400–600 target、>600 high。
- MIC >1、腎功能不穩或未達穩態須顯示警示。

## Acceptance Criteria

- 院內 Excel golden case 核心輸出與 15-dose profile 誤差 ≤0.5%。
- 無效採血順序或不適用病人不可產出 PK 結果。
- Note 的 S/O/A/P 與選定方案一致；複製與 TXT 內容相同。
- 可直接以 `file://` 開啟，亦可由靜態伺服器部署。
- 無持久化、無網路資料傳輸。
