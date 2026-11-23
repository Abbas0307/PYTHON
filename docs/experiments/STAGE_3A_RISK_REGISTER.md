# MINDORA 2.0 — STAGE 3A: SCIENTIFIC & ENGINEERING RISK REGISTER

**Document Ref:** `docs/experiments/STAGE_3A_RISK_REGISTER.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Stage:** Stage 3A Risk Governance & Quality Engineering  
**Status:** Approved Risk Register  

---

## 1. PURPOSE & METHODOLOGY

Machine learning in mental health and student wellbeing presents severe methodological, statistical, and clinical risks. Overconfident evaluation metrics, hidden data leakage, or construct re-branding can create false scientific consensus and lead to real-world harm.

This Risk Register catalogues all scientific, technical, and operational failure modes identified for the Stage 3 controlled engineering experiments, defining quantitative risk scoring, concrete mitigation strategies, and verifiable acceptance gates.

### Risk Scoring Framework:
- **Probability ($P$):** 1 (Rare) to 5 (Almost Certain).
- **Impact ($I$):** 1 (Insignificant) to 5 (Catastrophic).
- **Risk Score ($R$):** $P \times I$ (Low: 1–6, Medium: 8–12, High: 15–20, Critical: 25).

---

## 2. SCIENTIFIC & METHODOLOGICAL RISK MATRIX

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              STAGE 3 RISK GOVERNANCE MATRIX                            │
├────────┬─────────────────────────────┬───────┬───────┬──────┬───────┬──────────────────┤
│ Risk ID│ Risk Description            │ Inh P │ Inh I │ Score│ Resid │ Criticality      │
├────────┼─────────────────────────────┼───────┼───────┼──────┼───────┼──────────────────┤
│ RSK-01 │ Target Leakage (Item 9)     │   5   │   5   │  25  │   1   │ CRITICAL         │
│ RSK-02 │ Construct Re-Branding       │   4   │   5   │  20  │   2   │ HIGH             │
│ RSK-03 │ Preprocessing Test Leakage  │   4   │   4   │  16  │   1   │ HIGH             │
│ RSK-04 │ Unresolved Provenance Bias  │   4   │   4   │  16  │   3   │ MEDIUM           │
│ RSK-05 │ Overconfident Calibration   │   3   │   4   │  12  │   2   │ MEDIUM           │
│ RSK-06 │ Accidental Overwrite of Prod│   3   │   5   │  15  │   1   │ HIGH             │
│ RSK-07 │ Quarantined Dataset B Breach│   2   │   5   │  10  │   1   │ MEDIUM           │
│ RSK-08 │ Feature Order / Parity Drift│   3   │   4   │  12  │   1   │ MEDIUM           │
│ RSK-09 │ Metric Optimization Illusion│   4   │   3   │  12  │   2   │ MEDIUM           │
│ RSK-10 │ GPU Resource Contention     │   2   │   3   │   6  │   1   │ LOW              │
│ RSK-11 │ Duplicate Cross-Split Leak  │   4   │   4   │  16  │   1   │ HIGH             │
│ RSK-12 │ Non-Student Contamination   │   3   │   3   │   9  │   1   │ MEDIUM           │
│ RSK-13 │ Provenance Over-Claiming    │   3   │   3   │   9  │   1   │ MEDIUM           │
│ RSK-14 │ Historical Metric Ambiguity │   3   │   3   │   9  │   1   │ MEDIUM           │
│ RSK-15 │ CalibratedClassifierCV Leak │   4   │   4   │  16  │   1   │ HIGH             │
│ RSK-16 │ Forced Row-Count Fracture   │   3   │   4   │  12  │   1   │ MEDIUM           │
└────────┴─────────────────────────────┴───────┴───────┴──────┴───────┴──────────────────┘
```

---

## 3. DETAILED RISK PROFILES & MITIGATION STRATEGIES

### 3.1 RSK-01: Target Leakage via Clinical Crisis Variables
- **Category:** Methodological / Clinical Safety
- **Description:** Including `Have you ever had suicidal thoughts ?` in machine learning model inputs causes massive artificial performance inflation (79.05% of positive responses have `Depression = 1`). In reality, this is a post-outcome clinical crisis indicator, not an academic predictor.
- **Inherent Risk:** $5 \times 5 = 25$ (CRITICAL)
- **Concrete Mitigation Strategy:**
  1. The variable is permanently quarantined from all feature lists and codified in `shared/contracts/feature_contract.json` under `excluded_raw_features`.
  2. The input validation schema in `src/preprocessing.py` and `src/predict.py` drops this column before any array transformation.
  3. The column is isolated exclusively in the deterministic PHQ-9 Item 9 safety protocol (Engine 1).
- **Residual Risk:** $1 \times 5 = 5$ (Low)
- **Verification Mechanism:** Automated test `test_06_model_does_not_ingest_suicidal_ideation` in `tests/model_parity/test_feature_contract.py`.

---

### 3.2 RSK-02: Target Construct Re-Branding (Pseudo-Validation)
- **Category:** Scientific Validity & Epistemology
- **Description:** Training a model on Dataset A's survey-derived binary target `Depression` and renaming the output "Academic Strain Index" or "Wellbeing Score". This falsely attributes construct validity to a model that merely reproduces an unverified survey label.
- **Inherent Risk:** $4 \times 5 = 20$ (HIGH)
- **Concrete Mitigation Strategy:**
  1. Explicitly mandate that the target variable is documented strictly as `Depression` (Survey-derived binary benchmark label).
  2. The future Academic & Lifestyle Strain Index is defined as a separate research proposal requiring independent psychometric construct validation.
  3. All experiment registry records must log the target column name as `Depression`.
- **Residual Risk:** $1 \times 2 = 2$ (Low)
- **Verification Mechanism:** Code review and schema verification against `shared/contracts/feature_contract.json` (`target.name == "Depression"`).

---

### 3.3 RSK-03: Preprocessing Data Leakage into Held-Out Test Set
- **Category:** Statistical Engineering
- **Description:** Computing imputation statistics (medians/modes) or scaling parameters (means/standard deviations) across the entire dataset prior to splitting, leaking test distribution information into training data.
- **Inherent Risk:** $4 \times 4 = 16$ (HIGH)
- **Concrete Mitigation Strategy:**
  1. All transformations must be packaged inside a Scikit-learn `Pipeline` or `ColumnTransformer`.
  2. The pipeline must be fitted strictly on `X_train` (`preprocessor.fit(X_train)`), with `X_val` and `X_test` transformed via `.transform()` only.
  3. During cross-validation, pipeline fitting must occur strictly within each training fold.
- **Residual Risk:** $1 \times 1 = 1$ (Negligible)
- **Verification Mechanism:** Code assertion verifying that `ColumnTransformer.fit()` is never invoked on raw unsplit DataFrames.

---

### 3.4 RSK-04: Unresolved Provenance & Observational Bias
- **Category:** Epistemic / Data Provenance
- **Description:** Dataset A is classified as a *public benchmark dataset with unresolved original provenance and sampling methodology*. Observations such as monotonic ID sequences ($2$ to $140,699$, step $5.04 \pm 4.48$) and smooth CGPA distributions suggest downsampling from a larger external pool, but synthetic generation remains an unconfirmed hypothesis. Assuming i.i.d. observations may underestimate generalization error.
- **Inherent Risk:** $4 \times 4 = 16$ (HIGH)
- **Concrete Mitigation Strategy:**
  1. Classify Dataset A strictly as an unverified public benchmark for controlled engineering experiments, not clinical training data.
  2. Document observed numeric patterns as empirical findings, avoiding speculative or unproven provenance declarations.
  3. Perform 1,000-iteration non-parametric stratified bootstrap to estimate empirical confidence intervals for all metrics.
- **Residual Risk:** $1 \times 3 = 3$ (Low / Controlled)
- **Verification Mechanism:** Mandatory inclusion of the "Public Benchmark Provenance Disclaimer" in all experimental reports.

---

### 3.5 RSK-05: Miscalibrated Probabilities Leading to Overconfident Outputs
- **Category:** Probabilistic Quality
- **Description:** Standard XGBoost logloss outputs or uncalibrated sigmoid transformations can produce clustered probabilities near 0 or 1, distorting risk stratification and generating overconfident estimations.
- **Inherent Risk:** $3 \times 4 = 12$ (MEDIUM)
- **Concrete Mitigation Strategy:**
  1. Mandate dual evaluation of Brier Score and Expected Calibration Error (ECE) across 10 probability bins.
  2. Compare raw XGBoost probabilities against 5-fold cross-validated Platt scaling (sigmoid) and Isotonic regression.
  3. Generate empirical reliability curves (calibration plots) for all candidate models.
- **Residual Risk:** $1 \times 2 = 2$ (Low)
- **Verification Mechanism:** Gate check requiring Brier Score $< 0.15$ and calibration curve visual inspection before candidate approval.

---

### 3.6 RSK-06: Accidental Corruption or Overwriting of Production Artifacts
- **Category:** Operational Safety
- **Description:** An experimental training script accidentally overwrites `models/best_model.pkl` or modifies existing production files in `src/` or `app.py`.
- **Inherent Risk:** $3 \times 5 = 15$ (HIGH)
- **Concrete Mitigation Strategy:**
  1. `models/best_model.pkl` is declared read-only.
  2. All experimental model outputs must be saved to `experiments/models/exp_<timestamp>_<name>.pkl`.
  3. Preflight and postflight SHA-256 hash checks are enforced on `models/best_model.pkl` (`E182E9E7...`).
- **Residual Risk:** $1 \times 1 = 1$ (Negligible)
- **Verification Mechanism:** Automated cryptographic SHA-256 hash assertion executed in test harness and preflight reports.

---

### 3.7 RSK-07: Quarantined Dataset B Ingestion Breach
- **Category:** Governance / Compliance
- **Description:** An engineer or automated script inadvertently includes `ml_lab/data/raw/STUDENT dataset.xlsx` in training or evaluation runs, violating minor data protection and consent boundaries.
- **Inherent Risk:** $2 \times 5 = 10$ (MEDIUM)
- **Concrete Mitigation Strategy:**
  1. Hardcode dataset paths in training harnesses strictly to `dataset/Student_Depression_Dataset.csv`.
  2. Implement an automated guard in data loading scripts that throws an immediate `PermissionError` if any `.xlsx` file in `ml_lab/data/raw/` is targeted.
  3. Re-affirm Dataset B quarantine at every gate exit.
- **Residual Risk:** $1 \times 1 = 1$ (Negligible)
- **Verification Mechanism:** Automated audit assertion verifying zero file open handles on `ml_lab/data/raw/STUDENT dataset.xlsx`.

---

### 3.8 RSK-08: Feature Ordering & Preprocessing Parity Drift
- **Category:** Software Reliability
- **Description:** Discrepancies between the 10-feature training sequence and the runtime inference sequence in `src/predict.py` or future ONNX graphs, causing silent column permutation bugs.
- **Inherent Risk:** $3 \times 4 = 12$ (MEDIUM)
- **Concrete Mitigation Strategy:**
  1. Bind all data loading, training, and inference to the canonical `feature_order` array in `shared/contracts/feature_contract.json`.
  2. Transformed feature names must be validated against `preprocessor.get_feature_names_out()` before model fitting.
- **Residual Risk:** $1 \times 1 = 1$ (Negligible)
- **Verification Mechanism:** Full execution of `tests/model_parity/test_feature_contract.py`.

---

### 3.9 RSK-09: Metric Optimization Illusion (Headline Accuracy Bias)
- **Category:** Statistical Integrity
- **Description:** Selecting models solely based on raw overall accuracy ($58.55\%$ baseline), masking poor minority-class sensitivity or severe false-negative rates in distress prediction.
- **Inherent Risk:** $4 \times 3 = 12$ (MEDIUM)
- **Concrete Mitigation Strategy:**
  1. Mandate balanced evaluation reporting: Balanced Accuracy, Macro F1, Precision-Recall AUC, and Class 0/Class 1 specific recall.
  2. Candidate models must demonstrate balanced sensitivity across both classes.
- **Residual Risk:** $1 \times 2 = 2$ (Low)
- **Verification Mechanism:** Gate exit criteria rejecting any candidate model with Class 0 Recall $< 0.65$ or Macro F1 $< 0.75$.

---

### 3.10 RSK-10: Hardware Memory & GPU Resource Contention
- **Category:** Infrastructure & Hardware
- **Description:** Attempting GPU-accelerated training on a 6 GB VRAM laptop GPU while running Edge webviews and Streamlit daemons, causing CUDA out-of-memory errors or system lag.
- **Inherent Risk:** $2 \times 3 = 6$ (LOW)
- **Concrete Mitigation Strategy:**
  1. Conduct all Stage 3B tabular benchmarks on the 16-core CPU.
  2. Dataset A consumes $< 10 \text{ MB}$ in RAM; CPU multi-threading trains XGBoost in $< 0.5 \text{ seconds}$ with zero VRAM risk.
- **Residual Risk:** $1 \times 1 = 1$ (Negligible)
- **Verification Mechanism:** Configuration flag `device="cpu"` enforced in all Scikit-learn and XGBoost model initializers.

---

### 3.11 RSK-11: Duplicate Feature Vector Leakage & Label Inconsistency Across Boundaries
- **Category:** Statistical Engineering / Data Leakage
- **Description:** Dataset A contains 4 rows forming 2 duplicate feature groups across the 10 approved features. In the historical 70/15/15 split, Group 1 crosses the Train-Validation boundary (Row 902 in Train, Row 8257 in Val), with conflicting target labels ($y=1$ vs $y=0$). This demonstrates label inconsistency in the dataset but does not establish the population-level conditional probability or Bayes error. Standard random splitting leaks identical feature vectors across splits.
- **Inherent Risk:** $4 \times 4 = 16$ (HIGH)
- **Concrete Mitigation Strategy:**
  1. Implement a Group-Aware Partitioning protocol that assigns identical 10-feature tuples to the same split.
  2. For Group 1 (conflicting labels), retain both records within the training partition; do not silently delete, relabel, or merge them.
  3. Clearly separate Historical Reproduction (which documents the cross-split leak) from Leakage-Controlled Evaluation (which guarantees zero duplicate leakage across Train, Val, and Test).
  4. Perform Group-Level Bootstrap resampling for confidence intervals to preserve cluster exchangeability.
- **Residual Risk:** $1 \times 1 = 1$ (Negligible)
- **Verification Mechanism:** Group-aware split assertions verifying zero feature vector intersection between Train, Val, and Test partitions.

---

### 3.12 RSK-12: Non-Student Cohort Distortion & Sampling Contamination
- **Category:** Construct Validity / Population Drift
- **Description:** Dataset A includes 31 non-student records (Architect, Doctor, Teacher, etc.) with a 90.3% depression prevalence ($28/31$). When `Profession` is dropped, these records are trained and evaluated as students, potentially skewing calibration.
- **Inherent Risk:** $3 \times 3 = 9$ (MEDIUM)
- **Concrete Mitigation Strategy:**
  1. Define two clear cohorts: Primary Student Cohort ($N=27,870$) and Full Historical Cohort ($N=27,901$).
  2. Conduct a formal sensitivity analysis in Stage 3B comparing metric shifts (accuracy, recall, Brier score) between cohorts.
- **Residual Risk:** $1 \times 1 = 1$ (Negligible)
- **Verification Mechanism:** Tabulated sensitivity report in Gate 3B.2 comparing model performance across both cohorts.

---

### 3.13 RSK-13: Over-Claiming Dataset Provenance & Synthetic Origin
- **Category:** Epistemic Integrity
- **Description:** Uncritically declaring that Dataset A is "confirmed synthetic" or "proven downsampled from Kaggle" without primary source confirmation.
- **Inherent Risk:** $3 \times 3 = 9$ (MEDIUM)
- **Concrete Mitigation Strategy:**
  1. Strictly classify Dataset A as a "Public benchmark dataset with unresolved original provenance and sampling methodology."
  2. Restrict claims regarding ID gaps and CGPA distributions to documented empirical observations, explicitly labeling synthetic origins as unverified hypotheses.
- **Residual Risk:** $1 \times 1 = 1$ (Negligible)
- **Verification Mechanism:** Documentation review ensuring no unverified provenance claims exist in project reports.

---

### 3.14 RSK-14: Ambiguity Between Historical Registry Metrics and Production Baseline
- **Category:** Audit Provenance & Traceability
- **Description:** Discrepancy between production model metrics ($79.69\%$ accuracy, $0.8676$ ROC-AUC, $0.1448$ Brier in `evaluation/training_report.txt`) and historical experiment registry metrics ($79.48\%$ accuracy, $0.8667$ ROC-AUC, $0.1445$ Brier in `experiments/registry.json`), creating confusion regarding baseline targets.
- **Inherent Risk:** $3 \times 3 = 9$ (MEDIUM)
- **Concrete Mitigation Strategy:**
  1. Document both artifacts with complete lineage: `best_model.pkl` reflects the 5-fold calibrated sigmoid wrapper (120 trees), while `exp_20261114_022944_xgboost_cl` reflects an earlier tracker test run (100 trees).
  2. Maintain both records without silent overwriting or conflation.
- **Residual Risk:** $1 \times 1 = 1$ (Negligible)
- **Verification Mechanism:** Dual-baseline reconciliation table in preflight and execution documents.

---

### 3.15 RSK-15: Scikit-Learn CalibratedClassifierCV Group Leakage / API Exception
- **Category:** Software Architecture & Statistical Engineering
- **Description:** Scikit-Learn's `CalibratedClassifierCV.fit()` does not accept a `groups` parameter. Passing an integer `cv=5` defaults to `StratifiedKFold`, silently leaking duplicate groups across inner calibration folds. Passing a group splitter object (e.g. `StratifiedGroupKFold(5)`) causes `check_cv` to pass `groups=None`, triggering a fatal `ValueError`.
- **Inherent Risk:** $4 \times 4 = 16$ (HIGH)
- **Concrete Mitigation Strategy:**
  1. Precompute an explicit iterable of inner group-aware split indices using `StratifiedGroupKFold(5).split(X, y, groups=groups)`.
  2. Pass the precomputed split list as the `cv` argument (`cv=inner_cv_splits`) to `CalibratedClassifierCV`.
- **Residual Risk:** $1 \times 1 = 1$ (Negligible)
- **Verification Mechanism:** Pre-flight unit assertion ensuring `CalibratedClassifierCV` receives explicit generator index tuples.

---

### 3.16 RSK-16: Forced Row-Count Partition Fracture
- **Category:** Data Partitioning Integrity
- **Description:** Attempting to force the final test partition to contain an exact arbitrary row count (e.g., exactly 4,186 rows) can force a multi-row feature group to be fractured across partition boundaries, creating test-set data leakage.
- **Inherent Risk:** $3 \times 4 = 12$ (MEDIUM)
- **Concrete Mitigation Strategy:**
  1. Prioritize group integrity over exact row count targets.
  2. Utilize a 20-fold 3-slice group-aware holdout yielding 4,185 test rows ($14.999\%$) with 0 group intersection guaranteed.
- **Residual Risk:** $1 \times 1 = 1$ (Negligible)
- **Verification Mechanism:** Set intersection assertion verifying that `set(dev_groups).intersection(set(test_vault_groups)) == set()`.

---

## 4. RISK AUDIT SIGN-OFF CHECKLIST

- [x] All 16 critical failure modes identified, categorized, and scored.
- [x] Target leakage (Item 9) permanently mitigated via feature exclusion and deterministic isolation.
- [x] Pseudo-validation construct re-branding formally prohibited.
- [x] Preprocessing test leakage prevented via Scikit-learn Pipeline architecture.
- [x] Unresolved provenance and observational properties documented with bootstrap CI bounds.
- [x] Accidental production overwrite prevented by read-only policy and cryptographic hash assertions.
- [x] Quarantined Dataset B protected from accidental ingestion.
- [x] Feature contract parity enforced across training and inference pipelines.
- [x] Metric optimization illusion countered by mandatory balanced metric reporting.
- [x] CPU-only execution mandated for tabular benchmarks to eliminate GPU contention.
- [x] Duplicate feature leakage across split boundaries mitigated via Group-Aware protocol.
- [x] Non-student cohort contamination addressed via Primary Cohort definition and sensitivity analysis.
- [x] Speculative provenance claims retracted and standardized to empirical classification.
- [x] Historical metric variance between registry and production baseline reconciled and traced.
- [x] Scikit-Learn `CalibratedClassifierCV` group-handling failure mode audited and mitigated via precomputed split generators.
- [x] Group integrity prioritized over exact row-count targets to prevent partition fractures.
