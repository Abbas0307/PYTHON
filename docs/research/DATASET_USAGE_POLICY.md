# MINDORA 2.0 — DATASET USAGE & GOVERNANCE POLICY
**Document Ref:** `docs/research/DATASET_USAGE_POLICY.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Status:** Approved Data Governance Policy  

---

## 1. PURPOSE & REGULATORY MANDATE

In accordance with ethical machine learning standards, data protection principles (including India's Digital Personal Data Protection Act 2023 and the UK/EU General Data Protection Regulation), and scientific reproducibility requirements, this policy governs the handling, access, and utilization of all data assets within the Mindora 2.0 repository.

---

## 2. POLICY ON DATASET A (`Student_Depression_Dataset.csv`)

### 2.1 Asset Profile
- **Path:** `dataset/Student_Depression_Dataset.csv`
- **Volume:** 27,901 records $\times$ 18 columns.
- **SHA-256 Checksum:** `a3e159e246789be5a61dcc7b4290fbc238f0140f3d95727585af50a61fd35404` **[VERIFIED]**
- **Provenance:** Public Kaggle dataset of unverified clinical origin.

### 2.2 Authorized Uses
Dataset A is authorized **strictly and exclusively** for the following computational engineering tasks:
1. **Model Architecture Benchmarking:** Comparing the training stability, inference speed, and convergence of candidate algorithms (Logistic Regression, Random Forest, XGBoost, LightGBM).
2. **Preprocessing Pipeline Verification:** Testing imputation algorithms, one-hot encoders, and standard scalers.
3. **Probability Calibration Experiments:** Comparing Platt scaling and Isotonic regression on controlled validation splits.
4. **ONNX Export Parity Testing:** Validating that exported ONNX Runtime graphs reproduce Python scikit-learn probability outputs within a numerical tolerance of $\le 1 \times 10^{-5}$.

### 2.3 Prohibited Uses
1. **No Clinical Validity Claims:** Dataset A must **never** be cited or described as "clinically validated training data" or "diagnostic ground truth".
2. **No Uncalibrated Deployment:** Models trained on Dataset A must never be deployed with raw output probabilities presented to users as true medical depression risk.
3. **No Direct Modification:** The original CSV file must remain in read-only status and never be overwritten or modified.

---

## 3. POLICY ON DATASET B (`STUDENT dataset.xlsx`)

### 3.1 Asset Profile
- **Path:** `ml_lab/data/raw/STUDENT dataset.xlsx`
- **Volume:** 162 records $\times$ 14 columns.
- **SHA-256 Checksum:** `a040665638e5d7a433c171b1f703061f571da50e2f1f2c55c3f0c37fa57c7e09` **[VERIFIED]**
- **Characteristics:** Primary student survey data containing 17 minors ($<18$), 24 non-students, 25 internal contradictions, corrupted free-text inputs, and zero documentary proof of machine-learning research consent.

### 3.2 Strict Quarantine Mandate
**Dataset B is formally quarantined from supervised model training, hyperparameter tuning, probability calibration, and independent validation benchmarking.**

#### Rationale for Quarantine:
1. **Lack of Documented Research Consent:** The workbook contains no record establishing that respondents consented to algorithmic machine-learning modeling. Consent cannot be inferred from mere Google Forms submission.
2. **Minor Protection Obligations:** The workbook contains 17 minor records without verifiable parental consent. Processing these records in an algorithmic profiling workflow presents regulatory and ethical non-compliance.
3. **Extreme Sample Size Depletion:** After necessary eligibility filtering, only 103 potentially eligible records remain, with only 29 positive outcomes. Training a 45-feature model on this cohort is statistically indefensible.

### 3.3 Permitted Non-Training Uses
Dataset B may be accessed **strictly as an unlabeled, qualitative reference cohort** for the following software engineering purposes:
1. **Vocabulary Mapping:** Inspecting the 63 free-text degree entries to design comprehensive dropdown menus and fuzzy-matching regex patterns.
2. **UI Form Validation Rules:** Analyzing the corrupted CGPA inputs (`🤷‍♂️`, `'Nill'`) and study hour ranges (`'3-4 '`) to design strict client-side numeric steppers and input masking.
3. **Synthetic Edge-Case Test Fixtures:** Informing the creation of anonymized, synthetic edge cases in `tests/fixtures/` to test input error-handling.

---

## 4. STRICT SEPARATION POLICY (NO POOLING / NO MERGING)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   STRICT DATASET SEPARATION POLICY                     │
├────────────────────────────────────────────────────────────────────────┤
│  DATASET A (Public Benchmark)            DATASET B (Collected Survey)  │
│  • N = 27,901 records                    • N = 162 records             │
│  • Synthetic/Crowdsourced origin         • Local convenience survey    │
│  • Binary survey indicator (58.5% pos)   • Clinical diagnosis history  │
│  • Median Age: 25                        • Median Age: 19              │
├────────────────────────────────────────────────────────────────────────┤
│                           ✖ STRICTLY FORBIDDEN ✖                       │
│                           DATASET POOLING / MERGING                    │
│  RATIONALE:                                                            │
│  1. Covariate Shift: Empirical KS & Chi2 tests reject common           │
│     distribution across all overlapping features (p < 0.001).          │
│  2. Concept Drift: Survey distress indicator != Clinical diagnosis.    │
│  3. Sample Imbalance: Dataset B would represent 0.58% of data,         │
│     completely swamped as statistical noise by ML optimizers.          │
│  4. Evaluation Poisoning: Produces invalid, uninterpretable metrics.   │
└────────────────────────────────────────────────────────────────────────┘
```

**Policy Enforcement:** Any script, pull request, or pipeline that attempts to concatenate, merge, or train across a combined Dataset A + Dataset B corpus shall be automatically rejected with build failure.

---

## 5. MINIMUM STANDARDS FOR FUTURE PRIMARY DATA COLLECTION

Any future human student data collection designed to create training or validation datasets for Mindora must comply with the following non-negotiable protocol:

1. **Formal Ethics Review:** The study protocol, participant information sheet, and consent instrument must be formally approved by an **Institutional Review Board (IRB) or university ethics committee**.
2. **Explicit, Timestamped ML Research Consent:** The survey instrument must contain a dedicated, non-pre-checked consent column:
   - *"I consent to my anonymized responses being used to train and evaluate offline student wellbeing algorithms. I understand I may withdraw at any time."*
3. **Hard Age-Gating:** The collection software must enforce a conditional skip-logic gate: any respondent indicating an age $< 18$ is immediately terminated and prevented from submitting.
4. **Standardized Clinical Screener Ground Truth:** The survey must incorporate the complete, validated 9-item PHQ-9 psychometric instrument, providing true continuous symptom scores ($0-27$).
5. **Strict Input Sanitization:** All demographic, academic, and lifestyle inputs must use constrained select menus and bounded numeric inputs, preventing free-text corruption.

---

## 6. POLICY RECONCILIATION

- [x] Dataset A restricted to controlled engineering experiments and calibration benchmarks.
- [x] Dataset B quarantined from model training, benchmarking, and evaluation.
- [x] Dataset merging and pooling explicitly prohibited.
- [x] 5-point standard for future primary data collection codified.
- [x] All original files preserved in read-only status.
