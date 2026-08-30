# Vancomycin Pharmacy note 範本分析

## 來源與保存方式

- 來源：使用者提供、主管已審核通過的 `Pharmacy note` Word 範本資料夾。
- Vancomycin 主文件：僅保存在本機、未發布的 `Vancomycin_劑量調整.docx`。
- SHA-256：`49fc25c0103bc1fa7c4b3c9cf2dcbaa5db9a197daf424a1f734520507030aac5`。
- 文件內共有 30 份 Vancomycin Pharmacy note 表格範例；渲染為 31 頁。
- 原始文件含病人識別資料，因此相關本機範本資料夾已由 `.gitignore` 排除，不可 commit、push 或發布。
- 本分析不抄錄姓名、病歷號、病房、醫師姓名或可識別日期組合。

## 固定結構

院內範本不是一般摘要，而是固定的 SOAP：

1. `S:` 目前 Vancomycin 處方、IVD、適應症，部分案例包含開始日期。
2. `O:` 年齡、性別、體重、診斷、培養、檢驗、CrCl、生命徵象、peak、trough、t1/2 與 AUC。
3. `A:` AUC 低於、位於或高於 400–600 的目標範圍；HD 或只有 trough 的案例另有專用判讀。
4. `P:` 維持或調整 regimen、後續濃度／腎功能監測、48–72 小時再評估，以及聯絡語句。

## 網頁必須逐字採用的句型

主管審核會檢查語句、用詞與段落。下列文字不是「意思相同即可」，而是固定字串；網頁只能替換大括號中的數值或臨床內容。

### S

`Vancomycin {dose} mg Q{interval}H IVD for {diagnosis}.`

### A

- `Vancomycin AUC is below the target range. (400-600 mcg·h/mL)`
- `Vancomycin AUC is within the target range. (400-600 mcg·h/mL)`
- `Vancomycin AUC is above the target range. (400-600 mcg·h/mL)`

### P

- 維持劑量：`Keep current dosage and monitor vancomycin levels and renal function weekly.`
- AUC 低且增加每日總劑量：`Suggested increasing the Vancomycin dose to {dose} mg IVD Q{interval}H (diluted in {volume} ml of 0.9% N/S, infused over {hours} hours) based on the patient’s AUC ({AUC} mcg·h/mL) .`
- 其他調整：`Suggest adjusting Vancomycin to {dose} mg Q{interval}H based on the patient’s AUC ({AUC} mcg·h/mL).`
- 調整後監測：`Suggested ordering Vancomycin trough level ({time}) and peak level ({time}).`
- 固定追蹤：`I will reassess for adequate infection response after 48-72 hrs.`
- 固定聯絡語句：`If you have any questions, please contact me.`

### 參考資料

- `Up To Date`
- `The sanford guide to antimicrobial therapy`

## 和原預覽的主要差異

| 項目 | 原預覽 | 依院內範本調整後 |
| --- | --- | --- |
| 主結構 | 病人摘要＋Assessment＋suggestion | `S → O → A → P` |
| S | 沒有獨立段落 | 現行 regimen、IVD、diagnosis |
| O | 多行散列 | 病人、診斷、檢驗、生命徵象、腎功能、Vancomycin level 集中於 O |
| A | 使用 AUC24/MIC 合併句 | 使用範本的 AUC 低／目標內／高原句 |
| P | 自訂敘述 | 使用編號與範本核心英文語句 |
| 預測 AUC | 自訂句型寫入 note | 核准範本無此句；保留在 TDM 畫面，不自行造句 |
| 安全邊界 | 免責文字混入 note | 安全提醒移到介面；不得改變主管核准的複製文字 |

## 範圍限制

- 目前網頁只自動組合一般成人雙點 AUC 的 SOAP 文字。
- HD、只有 trough、ARC、藥物交互作用、替代抗生素等範本情境可當作後續人工規則來源，但在另行確認輸入與計算前，不可自動產生具體建議。
- 原始範本的單位寫法不一致；網頁統一顯示 `mcg·h/mL`，不改變數值意義。
- 原始 DOCX 是文字權威；任何新句子都必須先取得主管核准版本，不能由開發者自行補寫。
- 去識別化逐字驗收檔：`tests/fixtures/approved-pharmacy-note-demo.expected.txt`。
