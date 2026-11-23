# DATASET CARD: MINDORA 2.0 RESEARCH DATASETS
## Standardized Datasheet for Datasets (Gebru et al., 2021)

**Release Date:** November 16, 2026  
**Curators:** Mindora Machine Learning & Data Governance Team  
**Repository Location:** `D:\Depression calculator`  

---

## 1. Dataset Overview & Dual-Track Separation

Mindora 2.0 maintains two entirely distinct, strictly quarantined dataset tracks:

| Specification | Track A: Benchmark Dataset | Track B: Small Survey Cohort |
| :--- | :--- | :--- |
| **Filename** | `dataset/Student_Depression_Dataset.csv` | `ml_lab/data/raw/STUDENT dataset.xlsx` |
| **Cryptographic Hash** | `A3E159E246789BE5A61DCC7B...` (Frozen) | `a040665638e5d7a433c171b1f70...` |
| **Total Rows** | 27,901 rows | 162 response rows + 1 header = 163 total rows |
| **Total Columns** | 18 columns | 14 columns |
| **Governance Status** | Public Synthetic/Survey Benchmark | **163-RECORD DATASET — PROVENANCE UNVERIFIED** |
| **Target Column** | `Depression` (Binary: 0, 1) | `Has a qualified healthcare professional told you...` |
| **Positive Prevalence** | 58.55% (16,336 positive / 11,565 negative) | 27.78% yes (45), 60.49% no (98), 11.73% not sure (19) |

---

## 2. Dataset Track A: Large Benchmark Corpus

### 2.1 Composition & Features:
Track A utilizes 10 approved features defined in `shared/contracts/feature_contract.json`:
- **Continuous/Ordinal (6 features):** `Age` (18–59), `Academic Pressure` (1–5), `CGPA` (0–10), `Study Satisfaction` (1–5), `Work/Study Hours` (1–12), `Financial Stress` (1–5).
- **Categorical (4 features):** `Gender` (Male, Female), `Sleep Duration` (4 categories), `Dietary Habits` (3 categories), `Degree` (28 categories).

### 2.2 Split Architecture:
- Training: 19,530 rows (70.0%)
- Validation: 4,185 rows (15.0%)
- Holdout Test: 4,186 rows (15.0%)

---

## 3. Dataset Track B: 163-Record Survey Cohort

### 3.1 Provenance Audit & Governance Label:
- **Mandatory Label:** **`"163-RECORD DATASET — PROVENANCE UNVERIFIED"`**.
- **Collection Mechanism:** Google Form entitled "Form Responses 1" collected on November 14, 2026.
- **Ethics Review:** No institutional ethics review (IRB/IEC) approval number, formal participant information sheet, or investigator log accompanies the spreadsheet file.
- **Participant Composition:** Respondent ages range from 13 to 69 years. Seventeen respondents were under 18 years of age.
- **Isolation Policy:** Track B is isolated in `ml_lab/` and `reports/real_world_163/`. It is never merged with Track A and never utilized for student-facing recommendations.

### 3.2 Cleaning & Normalization:
- **CGPA Sanitization:** Non-numeric strings (`"Nill"`, `"No"`, and emoji `"🤷‍♂️"`) were imputed using training fold medians.
- **Study Hours Resolution:** Text ranges (`"3-4"`) were parsed into numeric midpoints (`3.5`).
- **Degree Normalization:** Sixty-three free-text strings were clustered into 6 broad collegiate groups.
- **Target Categorization:** Primary cohort excludes 19 `"not sure"` entries to establish unambiguous binary evaluation ($N=143$, 45 positive, 98 negative).

---

## 4. Ethical & Pre-Processing Invariants

1. **Zero Data Leakage:** All data preprocessing (imputation, scaling, one-hot encoding) was fitted strictly inside training splits or cross-validation folds.
2. **No Premature Resampling:** Synthetic oversampling (e.g., SMOTE) was strictly prohibited on the global dataset to avoid synthetic leakage into evaluation folds.
3. **Transparent Reporting:** The lack of an independent holdout test set for the 163-record cohort is explicitly declared, with 95% Confidence Intervals reported across 25 repeated cross-validation folds.
