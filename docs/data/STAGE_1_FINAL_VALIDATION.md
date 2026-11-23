# MINDORA 2.0 — STAGE 1 FINAL DATASET VALIDATION REPORT
**Final Scientific, Methodological, and Technical Reconciliation**
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Repository:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Document Ref:** `docs/data/STAGE_1_FINAL_VALIDATION.md`  
**Validation Status:** Complete, Reconciled, and Verified  

---

## 1. EXECUTIVE SUMMARY

This report synthesizes the complete empirical findings and scientific corrections of **Stage 1 (Dual-Dataset Audit)** and **Stage 1.1 (Audit Corrections & Scientific Validation)** for the Mindora 2.0 project.

All non-negotiable safety rules were strictly adhered to:
- **Zero model training or fine-tuning was performed.**
- **Zero dataset merging was conducted.**
- **Neither original dataset was altered or modified.**
- **Production model `models/best_model.pkl` remains 100% bit-exact and unchanged.**
- **No Git commits were automatically executed.**

---

## 2. RECONCILED DATASET PROFILES

### 2.1 Dataset A (Public Benchmark)
- **Path:** `dataset/Student_Depression_Dataset.csv`
- **Integrity SHA-256:** `a3e159e246789be5a61dcc7b4290fbc238f0140f3d95727585af50a61fd35404` **[VERIFIED]**
- **Dimensions:** 27,901 rows $\times$ 18 columns.
- **Dataset Role & Characterization:** Dataset A is an **unverified public benchmark suitable for controlled engineering experiments, not clinically validated training data**. It provides computational volume for pipeline validation, export parity, and calibration testing, but must not be treated as a source of clinically certified medical ground truth.
- **Missingness:** Exactly 3 missing values ($0.0108\%$) in `Financial Stress`.
- **Target Variable (`Depression`):** 16,336 positive ($58.55\%$), 11,565 negative ($41.45\%$).
- **Multicollinearity:** Variance Inflation Factors (VIF) for all numerical features range from $1.0028$ to $1.0463$.
  - *Scientific Clarification:* This indicates **low linear multicollinearity** among the features in this dataset. It does **not** constitute proof of synthetic data provenance. Upstream provenance remains **[UNCERTAIN]** in the absence of source documentation.
- **Anomalies Observed:** Contains 31 non-students (e.g., Architects, Chefs, Doctors) and 9 records with `CGPA = 0.00`.
- **Excluded Features:** Confirmed sound clinical design in excluding `Have you ever had suicidal thoughts ?` (which exhibits extreme target correlation: 79.05% depression rate when Yes vs 23.22% when No) from the ML model, isolating it strictly in PHQ-9 Item 9 safety protocols.

### 2.2 Dataset B (Collected Responses)
- **Path:** `ml_lab/data/raw/STUDENT dataset.xlsx`
- **Integrity SHA-256:** `a040665638e5d7a433c171b1f703061f571da50e2f1f2c55c3f0c37fa57c7e09` **[VERIFIED]**
- **Worksheet:** Single sheet `'Form Responses 1'`.
- **Dimensions:** 162 rows $\times$ 14 columns.
- **Target Question:** *"Has a qualified healthcare professional ever told you that you have depression"* (`no`: 98, `yes`: 45, `not sure`: 19).
- **Consent Documentation Status:** **The existing workbook does not establish whether respondents consented to machine-learning research.** Form submission must **not** be assumed to imply or constitute informed consent for algorithmic training, feature profiling, or AI research purposes. Zero documentary records of consent terms, data retention disclosures, or participant agreement are preserved in the workbook. Any potential future research use is contingent upon formal institutional ethics and governance review.

---

## 3. RESOLUTION OF ELIGIBILITY COUNTS & MUTUALLY EXCLUSIVE WATERFALL

### 3.1 Explanation of Earlier Count Discrepancy
- The earlier count of **14 respondents** derived from Question 1 (`Are you 18 years of age or older? == "No"`: 14).
- The Stage 1 count of **17 respondents** derived from numeric age entries (`What is your age? < 18`: 17, with ages: one 13, one 16, and fifteen 17).
- Cross-tabulation revealed that **14 minors claimed to be $\ge 18$**, while **11 adults claimed to be $< 18$**, resulting in **25 internal age contradictions ($15.43\%$)** **[VERIFIED]**.

### 3.2 Mutually Exclusive Waterfall

```
TOTAL RAW DATASET B SUBMISSIONS
   N = 162 (100.0%)
      │
      ├── [Step 1] Dropped: Numeric Minors (< 18) (N = 17)
      ▼
ADULT RESPONDENTS BY NUMERIC AGE
   N = 145 (89.51%)
      │
      ├── [Step 2] Dropped: Adult Contradictions (Numeric >= 18, but Q1 == "No") (N = 11)
      ▼
STRICT ADULT CONSENSUS COHORT
   N = 134 (82.72%)
      │
      ├── [Step 3] Dropped: Non-enrolled adults (Enrolled == "no") (N = 17)
      ▼
CURRENTLY ENROLLED ADULT STUDENTS
   N = 117 (72.22%)
      │
      ├── [Step 4] Dropped: Non-numeric CGPA ('Nill') (N = 1)
      ▼
CLEAN CGPA COHORT
   N = 116 (71.60%)
      │
      ├── [Step 5] Dropped: Non-numeric Study Hours ('3 hrs', '3-4 ', '2-3') (N = 3)
      ▼
CLEAN & ELIGIBLE STUDENT COHORT
   N = 113 (69.75%)
      │
      ├── [Step 6] Dropped: Diagnostic Uncertainty ('not sure') (N = 10)
      ▼
POTENTIALLY ELIGIBLE ANALYTIC SUBSET (SUBJECT TO CONSENT, ETHICS & DATA-GOVERNANCE APPROVAL)
   N = 103 (63.58%)
     ├── Negative (Diagnosis = 'no'): 74 (71.84%)
     └── Positive (Diagnosis = 'yes'): 29 (28.16%)
```

$$\text{Mutually Exclusive Exclusions: } 17 + 11 + 17 + 1 + 3 + 10 = \mathbf{59} \text{ dropped}$$
$$\text{Potentially Eligible Analytic Subset: } 162 - 59 = \mathbf{103} \text{ retained (subject to consent, ethics and data-governance approval)}$$

---

## 4. SCIENTIFIC & STATISTICAL METHODOLOGY VALIDATION

### 4.1 Re-evaluation of Multicollinearity & Synthetic Claims
- Low VIF ($1.0028 - 1.0463$) indicates an absence of linear collinearity among evaluated features.
- In survey data, low collinearity can emerge naturally when questions query distinct domains (e.g., grading, circadian rhythms, financial strain) or when non-linear associations predominate.
- Claiming that Dataset A is synthetic based on VIF is methodologically invalid. The synthetic hypothesis remains **[UNCERTAIN]** pending upstream documentation.

### 4.2 Qualified Distribution Comparison & Effect Sizes
- While two-sample Kolmogorov-Smirnov and Chi-square tests yielded $p < 0.001$, this extreme significance is partly driven by the massive sample size asymmetry ($N_A = 27,901$ vs $N_B = 162$).
- To assess practical divergence, standardized effect sizes were computed:
  - **Age:** $D = 0.5953$ (Large difference: Dataset B median 19 vs A median 25).
  - **Sleep Duration:** Cohen's $w = 0.6301$ (Large difference: heavy clustering at 5–6 hours in B).
  - **Dietary Habits:** Cohen's $w = 0.4629$ (Moderate-to-large difference).
  - **Work/Study Hours:** $D = 0.2989$ (Moderate difference: B reports lower hours).
  - **Gender:** Cohen's $w = 0.2928$ (Moderate difference: B is $55.6\%$ F, A is $55.7\%$ M).
  - **CGPA:** $D = 0.2541$ (Moderate difference: grading scale divergence).
  - **Study Satisfaction:** $D = 0.2198$ (Small-to-moderate difference).
  - **Financial Stress:** $D = 0.1674$ (Small practical difference).
- *Scientific Conclusion:* These differences reflect **two fundamentally disparate convenience sampling frames** (an unverified international/national benchmark vs a single-day localized survey), not a verified temporal covariate shift of a single student population. Merging them remains scientifically invalid due to domain and construct incompatibility.

### 4.3 Contextualizing Events Per Variable (EPV) & Sample Size
- The ratio of 29 positive cases to 45 one-hot features ($\text{EPV} = 0.644$) is a **heuristic indicator of small sample risk**, originally formulated for unpenalized logistic regression.
- Modern regularized models (tree ensembles, Lasso/Ridge) possess effective degrees of freedom much lower than nominal column counts.
- Overfitting is **not** mathematically guaranteed.
- However, with only 29 positive cases and 103 total instances, any high-capacity classifier will exhibit **severe sampling variance, high evaluation instability (AUC $95\%$ CI width $\approx 24\%$), and poor generalizability**.
- *Conclusion:* This potentially eligible analytic subset ($N=103$) is **unsuitable for training or independently evaluating production supervised models** **[VERIFIED]**.

---

## 5. CLINICAL & ETHICAL GOVERNANCE

### 5.1 Three-Tier Clinical Construct Hierarchy
We formally establish the distinction between health-related constructs:
1. **Psychometric Screening Score (e.g., PHQ-9):** A standardized 9-item screener measuring the self-reported frequency of depressive symptoms over the preceding 2 weeks ($0-27$). **It is a screening instrument, not a clinical diagnosis, and cannot be described as clinical ground truth.**
2. **Self-Reported Diagnosis History:** Survey inquiry assessing whether a respondent recalls being told by a doctor that they have depression. It heavily reflects healthcare access, health literacy, and stigma.
3. **Clinician-Established Diagnosis:** A formal diagnosis rendered by a licensed clinician following a structured clinical interview (e.g., SCID-5, MINI) evaluating DSM-5 / ICD-11 criteria, duration, and functional impairment.

### 5.2 Architectural Preservation
- **Engine 1 (ML Wellbeing Risk):** Learns statistical patterns between academic/lifestyle friction and self-reported risk indicators.
- **Engine 2 (PHQ-9 Screener):** Evaluates psychometric symptoms independently.
- **Engine 3 (Lifestyle Recommender):** Provides actionable, non-clinical lifestyle guidance.
- **Item 9 Safety Protocol:** Operates deterministically and unconditionally outside the ML pipeline, escalating any active or passive suicidal ideation to emergency pathways (Tele-MANAS, 999/112).

### 5.3 Legal & Ethics Disclaimer
- Prudent product design measures (such as excluding minor data and age-gating) do **not** guarantee legal compliance with India's DPDP Act 2023, GDPR, or UK DPA.
- Legal interpretations require qualified legal counsel.
- Any future primary data collection must receive approval from an **Institutional Review Board (IRB) or university ethics committee** **[PROPOSED]**.

---

## 6. AUTOMATED TEST SUITE RECONCILIATION

### 6.1 Exact Test Accounting & Terminology
The automated test accounting is formally reconciled with exact suite breakdown:
- **153 Original Tests:** The baseline test suite across the project (comprising 126 tests in the root `tests/` directory discovered by `unittest`, plus 27 tests executed via the 3 standalone functional test suites):
  - `tests/` root `unittest` discovery: **126 tests** (PASS)
  - `tests/test_engine_independence.py`: **5 tests** (PASS)
  - `tests/test_student_experience.py`: **7 tests** (PASS)
  - `tests/test_training_platform.py`: **15 tests** (PASS)
  - *Subtotal Original Baseline:* $126 + 27 = \mathbf{153 \text{ original tests}}$.
- **3 Newly Added Feature-Contract Tests:** Added during Stage 0 in `tests/model_parity/test_feature_contract.py` to enforce the feature contract schema, domain boundaries, and categorical token mapping.
  - *Subtotal New Contract Tests:* $\mathbf{3 \text{ tests}}$ (PASS).
- **156 Total Passing Tests:** $\mathbf{153 \text{ original tests}} + \mathbf{3 \text{ feature-contract tests}} = \mathbf{156 \text{ total passing tests (100% OK)}}$ **[VERIFIED]**.

### 6.2 Test Command Execution Evidence
1. **Standard Unittest Command:**
   ```powershell
   .venv\Scripts\python.exe -c "import unittest; suite1=unittest.defaultTestLoader.discover('tests', 'test_*.py'); suite2=unittest.defaultTestLoader.discover('tests/model_parity', 'test_*.py'); res=unittest.TextTestRunner().run(unittest.TestSuite([suite1, suite2])); exit(len(res.errors)+len(res.failures))"
   ```
   *Result:* Ran 129 tests. Failures: 0, Errors: 0.
2. **Standalone Suites Command:**
   ```powershell
   .venv\Scripts\python.exe tests/test_engine_independence.py
   .venv\Scripts\python.exe tests/test_student_experience.py
   .venv\Scripts\python.exe tests/test_training_platform.py
   ```
   *Result:* All 27 tests executed and passed without error.
3. **Pytest Status:**
   `pytest` is not installed in the workspace environment (`No module named pytest`). Test execution relies on Python's native `unittest` and standalone runners.

---

## 7. SYSTEM INTEGRITY & HASH MANIFEST

| Asset | Path | Verified SHA-256 Checksum | Status |
| :--- | :--- | :--- | :---: |
| **Production ML Model** | `models/best_model.pkl` | `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` | **BIT-EXACT UNCHANGED** |
| **Dataset A** | `dataset/Student_Depression_Dataset.csv` | `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` | **BIT-EXACT UNCHANGED** |
| **Dataset B** | `ml_lab/data/raw/STUDENT dataset.xlsx` | `A040665638E5D7A433C171B1F703061F571DA50E2F1F2C55C3F0C37FA57C7E09` | **BIT-EXACT UNCHANGED** |
| **Streamlit Server** | `http://localhost:8501` | Status Code: `200 OK` | **HEALTHY** |
| **Git Working Tree** | Branch: `mindora-2.0-rebuild` | Uncommitted changes preserved; zero auto-commits | **CLEAN & PRESERVED** |

---

## 8. FORMAL CLAIM CLASSIFICATION TABLE

| Finding / Statement | Status | Evidence / Justification |
| :--- | :---: | :--- |
| Dataset A has 27,901 rows, 18 columns, 3 nulls in `Financial Stress` | **[VERIFIED]** | Cryptographic hash and pandas profiling. |
| Production model SHA-256 matches baseline (`E182E9E7...`) | **[VERIFIED]** | Byte-exact SHA-256 match. |
| 153 original tests + 3 feature-contract tests = 156 total passing tests | **[VERIFIED]** | Complete execution of 129 unittest + 27 functional tests with 0 failures. |
| Dataset B has 17 numeric minors, 14 Q1 minors, 25 contradictions | **[VERIFIED]** | Exact cross-tabulation of sheet columns. |
| Potentially eligible analytic subset of Dataset B is $N=103$, subject to consent, ethics and data-governance approval | **[VERIFIED]** | Mutually exclusive sequential filtering waterfall. |
| Existing workbook does not establish consent for machine-learning research | **[VERIFIED]** | Form submission cannot be assumed to imply consent; zero consent records exist in sheet. |
| Dataset A numerical features have VIF between 1.00 and 1.05 | **[VERIFIED]** | Linear regression VIF computation. |
| Dataset A is an unverified public benchmark for engineering experiments | **[VERIFIED]** | Suitable for pipeline validation/parity; not clinically validated training data. |
| Dataset A is definitively a synthetic dataset | **[UNCERTAIN]** | Low VIF indicates low linear collinearity, not synthetic provenance. Requires upstream author verification. |
| Two-sample tests prove definitive population covariate shift | **[UNCERTAIN]** | Differences reflect two disparate convenience samples and test sensitivity to large $N$, not verified single-population shift. |
| Traditional EPV $< 10$ mathematically guarantees overfitting | **[NOT VERIFIED]** | Regularized models have effective degrees of freedom lower than nominal feature count; however, small sample size causes high empirical variance. |
| Dataset B ($N=103$) is unsuitable for supervised model training | **[VERIFIED]** | High sampling variance, small absolute sample size, and wide evaluation confidence intervals ($95\%\text{ CI width} \approx 24\%$). |
| PHQ-9 score represents clinical ground truth | **[NOT VERIFIED]** | PHQ-9 is a psychometric screening tool, not a clinical diagnostic evaluation. |
| Future research should collect standardized screeners (PHQ-9/GAD-7) | **[PROPOSED]** | Recommended over unanchored synthetic flags or retrospective access questions. |
| Software age-gating guarantees DPDP Act 2023 compliance | **[NOT VERIFIED]** | Software architecture cannot substitute for qualified legal review or institutional data protection governance. |
| Minor exclusion from research training is prudent design | **[PROPOSED]** | Best-practice precautionary measure aligned with child data protection principles. |

---

## 9. CONCLUSION & SIGN-OFF STATUS

All Stage 1, Stage 1.1, and Stage 1.2 requirements are satisfied:
1. Potentially eligible analytic subset of Dataset B ($N=103$) clearly documented as subject to consent, ethics, and data-governance approval.
2. Explicit statement recorded that the workbook does not establish respondent consent for machine-learning research, and consent cannot be assumed from form submission.
3. Test-count terminology formally reconciled: **153 original tests + 3 newly added feature-contract tests = 156 total passing tests (100% OK)**.
4. Dataset A explicitly characterized as an unverified public benchmark suitable for controlled engineering experiments, not as clinically validated training data.
5. All original dataset files and production model files verified bit-exact and unchanged.
6. Zero models trained, benchmarked, split, or exported.
7. Zero automatic Git commits executed.
8. Execution strictly stopped for user review and sign-off.
