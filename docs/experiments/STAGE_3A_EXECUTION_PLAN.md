# MINDORA 2.0 — STAGE 3A: PHASED EXECUTION PLAN & GATE ARCHITECTURE

**Document Ref:** `docs/experiments/STAGE_3A_EXECUTION_PLAN.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Stage:** Stage 3A Phased Engineering Execution Plan  
**Status:** Approved Architecture Plan — Standing by for Review (Stage 3B Not Started)  

---

## 1. PURPOSE & PRINCIPLES OF GATE GOVERNANCE

To ensure strict scientific reproducibility, prevent scope creep, and enforce non-negotiable data boundaries, Stage 3 is structured into **six independently reviewable and verifiable gates**.

### Core Governance Rules:
1. **No Leapfrogging:** Work on a subsequent gate cannot commence until the preceding gate has satisfied all exit criteria and received explicit user sign-off.
2. **Reversibility & Isolation:** All intermediate artifacts are written to `experiments/models/` and registered in `experiments/registry.json`. Production models and application files remain untouched.
3. **Automated Verification:** Every gate exit must be validated by automated assertions and reproducible Python commands.
4. **Zero-Overfitting Mandate:** The $15\%$ held-out group-aware test split ($N=4,185$, $4,184$ groups) is strictly governance-locked in a vault and accessed only in Gate 3B.6 for final benchmark verification.

---

## 2. THE 6-GATE EXECUTION ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 STAGE 3B GATE ARCHITECTURE                              │
├──────────┬─────────────────────────────────────┬────────────────────────────────────────┤
│ Gate ID  │ Gate Title                          │ Core Objective                         │
├──────────┼─────────────────────────────────────┼────────────────────────────────────────┤
│ GATE 3B.1│ Environment & Partition Generation  │ Verify environment; generate and lock  │
│          │                                     │ group-aware 85/15 partition manifest.  │
├──────────┼─────────────────────────────────────┼────────────────────────────────────────┤
│ GATE 3B.2│ Baseline Models & Historical Audit  │ Fit Dummy & Logistic Reg on Dev folds; │
│          │                                     │ inspect best_model.pkl architecture.   │
├──────────┼─────────────────────────────────────┼────────────────────────────────────────┤
│ GATE 3B.3│ Tree Model Comparison (5-Fold CV)   │ 5-fold CV comparison of Random Forest  │
│          │                                     │ and XGBoost on 85% dev partition.      │
├──────────┼─────────────────────────────────────┼────────────────────────────────────────┤
│ GATE 3B.4│ Probability Calibration Analysis    │ Platt vs. Isotonic vs. Raw; Brier score│
│          │                                     │ and ECE evaluation on inner dev folds. │
├──────────┼─────────────────────────────────────┼────────────────────────────────────────┤
│ GATE 3B.5│ Final Model & Protocol Freeze       │ Dev uncertainty & bootstrap analysis;  │
│          │                                     │ freeze architecture, params, calibrator│
├──────────┼─────────────────────────────────────┼────────────────────────────────────────┤
│ GATE 3B.6│ Single-Shot Final Test Evaluation   │ Single-shot Test Vault evaluation;     │
│          │ & Pre-ONNX Parity Audit             │ 1,000 group bootstrap; pre-ONNX checks │
└──────────┴─────────────────────────────────────┴────────────────────────────────────────┘
```

---

## 3. DETAILED GATE SPECIFICATIONS

### GATE 3B.1: Environment Baseline & Group-Aware Partition Manifest Generation

#### 1. Objectives & Scope:
- Document computational environment baseline, dependency versions, and compute resources.
- Generate reproducible group-aware partition manifest from Dataset A using master random seed $42$:
  * Group records by deterministic 10-feature signature ($27,899$ unique groups).
  * Generate Test Vault ($N=4,185$, $15.0\%$, Folds 0–2) and Development Partition ($N=23,716$, $85.0\%$, Folds 3–19) using a 20-fold `StratifiedGroupKFold`.
  * Confirm $0$ cross-partition group intersection. Assign Group 1 entirely to Development and Group 2 entirely to Test Vault.
  * Persist `ml_lab/splits/partition_assignments.csv` and `ml_lab/splits/group_aware_partition_manifest.json`.
- Bounded partition generation exception applies strictly during generation. Zero model fitting. Zero Test Vault access following manifest serialization.

#### 2. Input Artifacts:
- `dataset/Student_Depression_Dataset.csv` (SHA-256: `A3E159E2...`).
- `shared/contracts/feature_contract.json` (10 approved features).

#### 3. Strict Prohibitions:
- Do NOT touch, read, or parse `ml_lab/data/raw/STUDENT dataset.xlsx` (Dataset B).
- Do NOT fit any machine learning models, estimators, or preprocessors.
- Do NOT evaluate on or inspect individual records of the held-out Test Vault.

#### 4. Exit & Verification Criteria:
- [x] Group-aware partition ensures $0\%$ duplicate feature vector intersection across Dev and Test Vault ($4,185 / 23,716$).
- [x] Class distribution verified balanced across splits ($58.55\%$ vs $58.57\%$).
- [x] Group 1 allocated entirely to Dev; Group 2 allocated entirely to Test Vault.
- [x] SHA-256 checksums recorded and verified bit-exact.

---

### GATE 3B.2: Baseline Model Experiments & Historical Production Model Audit

#### 1. Objectives & Scope:
- Fit baseline models strictly within Development partition folds ($N=23,716$, 5-fold group-aware CV):
  * **Baseline 1:** Dummy Majority Class Classifier.
  * **Baseline 2:** Regularized Logistic Regression (StandardScaler + SimpleImputer + OneHotEncoder).
- Evaluate baselines on development validation folds to establish the linear and naive performance floors.
- Perform a read-only introspection of the production model artifact `models/best_model.pkl`:
  * Verify architecture, preprocessing pipeline steps, categorical encodings, and hyperparameters.
  * Reconcile historical test performance metrics ($79.69\%$ accuracy, $0.8676$ ROC-AUC in `training_report.txt` vs $79.48\%$ accuracy, $0.8667$ ROC-AUC in `registry.json`) strictly quoting their original historical provenance.
- Enforce the Historical Contamination Boundary:
  * Under an independent randomized 70% row-allocation assumption, the expected overlap between the historical training set and the new Test Vault is approximately 70% (theoretical expectation, not empirically measured or confirmed row count). Regardless of exact count, **evaluating `best_model.pkl` on the new Test Vault is strictly prohibited as it would risk evaluating on historical training data**.
  * No retrospective performance evaluation of `best_model.pkl` may use records belonging to the new Test Vault.
  * No new performance metrics may be calculated on the new Test Vault during Gate 3B.2.
  * Historical metrics must never be presented as independent group-aware evaluation results.
- Conduct non-student ($N=31$) and Group 1 sensitivity analysis strictly within Development partition data.

#### 2. Input Artifacts:
- `models/best_model.pkl` (SHA-256: `E182E9E7...`, read-only).
- Development partition ($N=23,716$) from `ml_lab/splits/partition_assignments.csv`.
- `shared/contracts/feature_contract.json`.

#### 3. Strict Prohibitions:
- **Do NOT evaluate `models/best_model.pkl` or any baseline on records belonging to the new Test Vault ($N=4,185$).**
- **Do NOT calculate any new performance metrics on the new Test Vault.**
- Do NOT overwrite, re-save, or modify `models/best_model.pkl`.
- Do NOT retrain or re-fit any parameter of the production pipeline.
- Do NOT use the test vault for model selection or decision threshold tuning.
- Do NOT touch Dataset B (`ml_lab/data/raw/STUDENT dataset.xlsx`).

#### 4. Exit & Verification Criteria:
- [ ] SHA-256 hash of `models/best_model.pkl` verified unchanged before and after introspection.
- [ ] Dummy Classifier yields expected development validation metrics ($\text{Accuracy} \approx 0.5855$, $\text{ROC-AUC} = 0.500$).
- [ ] Logistic Regression achieves development validation $\text{Accuracy} \ge 0.780$, $\text{ROC-AUC} \ge 0.850$.
- [ ] Discrepancy between historical test metrics ($79.69\%$ vs $79.48\%$) documented with original split provenance.
- [ ] Contamination boundary formally recorded: zero retrospective evaluation on new Test Vault rows.
- [ ] Non-student sensitivity report completed within Development partition.
- [ ] Group 1 conflicting-label sensitivity report completed within Development partition.
- [ ] All experiment runs logged to `experiments/registry.json` with `evaluated_partition: "development_cv"`.

---

### GATE 3B.3: Tree-Based Model Comparison (5-Fold Group-Aware CV)

#### 1. Objectives & Scope:
- Implement a 5-fold outer cross-validation harness on the Development Partition ($N=23,716$) using `StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)`.
- Benchmark two transparent tree-based architectures:
  * **Candidate 1:** Random Forest Classifier (100 trees, balanced sub-sampling).
  * **Candidate 2:** XGBoost Classifier (production hyperparameter architecture: 120 trees, depth 5, lr 0.08).
- Compare mean cross-validation accuracy, macro F1, and ROC-AUC.

#### 2. Input Artifacts:
- Development partition ($85\%$, $N=23,716$) from Gate 3B.1.
- `shared/contracts/feature_contract.json`.

#### 3. Strict Prohibitions:
- Do NOT evaluate candidates on the $15\%$ held-out Test Vault during cross-validation.
- Do NOT run unconstrained hyperparameter grids ($>10$ combinations).
- Do NOT utilize GPU acceleration (execute strictly on CPU multi-threading).

#### 4. Exit & Verification Criteria:
- [ ] 5-fold CV executes with zero group leakage across folds (`StratifiedGroupKFold`, preprocessor fitted strictly per fold).
- [ ] Cross-validation summary table generated reporting mean $\pm$ standard deviation for Accuracy, F1, and ROC-AUC.
- [ ] Training execution time on 16 CPU cores verified $< 15 \text{ seconds}$ total.
- [ ] Best-performing tree architecture selected based on balanced validation metrics.

---

### GATE 3B.4: Probability Calibration Analysis & Reliability Diagrams (Nested Group-Aware)

#### 1. Objectives & Scope:
- Compare probability calibration across three configurations on the development validation folds:
  * **Config A:** Raw tree probabilities (`predict_proba` direct output).
  * **Config B:** Platt Scaling (Sigmoid calibration via `CalibratedClassifierCV(method="sigmoid", cv=inner_cv_splits)`).
  * **Config C:** Isotonic Regression (`CalibratedClassifierCV(method="isotonic", cv=inner_cv_splits)`).
- Enforce fold-isolated calibration by passing precomputed inner split index generators to `CalibratedClassifierCV`, guaranteeing zero inner group leakage.
- Compute Brier Score and Expected Calibration Error (ECE) across 10 probability bins.
- Generate visual reliability diagrams (calibration curves).

#### 2. Input Artifacts:
- Candidate models trained in Gate 3B.3.
- Validation partition folds ($N=4,185$).

#### 3. Strict Prohibitions:
- Do NOT calibrate using the final test set.
- Do NOT adopt Isotonic regression if it demonstrates severe step-function quantization or overfitting on tail probabilities.

#### 4. Exit & Verification Criteria:
- [ ] Brier Score computed for Raw, Sigmoid, and Isotonic outputs.
- [ ] Reliability diagram generated showing predicted vs. empirical positive fraction.
- [ ] Optimal calibration method chosen based on minimum Brier score and visual curve linearity.

---

### GATE 3B.5: Final Model & Evaluation Protocol Freeze (Development Only)

#### 1. Objectives & Scope:
- Select the single best-performing candidate model architecture exclusively using Development partition cross-validation results ($N=23,716$).
- Execute a $1,000$-iteration **Group-Level Bootstrap** strictly on development validation fold predictions to quantify baseline developmental uncertainty.
- Formally freeze all experimental configuration components:
  * Model architecture and algorithm choice.
  * Hyperparameters (frozen permanently).
  * Preprocessing transformations (fitted strictly per training fold).
  * Calibration method and fitted inner mapping.
  * Operational decision threshold predeclared at $0.50$ as an engineering operating point, not a clinically validated or clinically optimal threshold (it must not be tuned using the Test Vault).
  * Primary evaluation metric (ROC-AUC) and secondary metrics (Brier, ECE, Accuracy, F1, Precision, Recall, Specificity) predeclared.
  * Test evaluation bootstrap procedure ($1,000$ group iterations, seed 42) formally specified.

#### 2. Input Artifacts:
- Validated models and calibration results from Gates 3B.3 and 3B.4.
- Development partition ($85\%$, $N=23,716$, $23,715$ groups).

#### 3. Strict Prohibitions:
- **Strictly PROHIBITED from accessing, reading, or evaluating the Test Vault ($N=4,185$).**
- Do NOT select hyperparameters, architectures, or decision thresholds using test records.

#### 4. Exit & Verification Criteria:
- [ ] Single candidate model selected and locked based on development CV metrics.
- [ ] Architecture, hyperparameters, preprocessing, calibrator, and decision threshold (predeclared engineering operating point $0.50$) frozen.
- [ ] Development uncertainty report completed with 95% CIs on development validation folds.
- [ ] Eight mandatory prerequisites for Gate 3B.6 access satisfied and documented.
- [ ] Formal STOP condition enforced awaiting explicit user authorization for Gate 3B.6.

---

### GATE 3B.6: Single-Shot Final Test Evaluation & Pre-Export Parity Audit

#### 1. Objectives & Scope:
- With all prerequisites satisfied and explicit user authorization granted, access the untouched $15\%$ held-out Test Vault ($N=4,185$, $4,184$ groups) **exactly once**.
- Evaluate the finalized, frozen candidate model on the Test Vault to record definitive benchmark metrics:
  * Discrimination: ROC-AUC, PR-AUC.
  * Calibration: Brier Score, Expected Calibration Error (ECE), reliability diagram.
  * Classification: Accuracy, Balanced Accuracy, Precision, Recall, Specificity, F1-Score at the predeclared engineering operating point threshold of $0.50$ (not clinically validated or optimal).
- Execute a $1,000$-iteration **Group-Stratified Bootstrap** on test set predictions (resampling strictly from the $4,184$ unique groups assigned to the Test Vault with replacement, stratified by the predeclared group-level label classification, keeping intact rows and observed labels together, with zero Development groups included, using random seed 42) to produce empirical $95\%$ Confidence Intervals.
- Compute Hanley-McNeil and DeLong asymptotic standard error bounds for ROC-AUC.
- Verify feature ordering contracts and categorical handling rules for future ONNX conversion.
- Define numerical parity tolerance thresholds ($\Delta < 10^{-5}$) for future deployment.

#### 2. Input Artifacts:
- Finalized, frozen calibrated candidate model from Gate 3B.5.
- Held-out Test Vault partition ($N=4,185$, $4,184$ groups) from `ml_lab/splits/partition_assignments.csv`.
- `shared/contracts/feature_contract.json`.

#### 3. Strict Prohibitions:
- Do NOT retrain, re-calibrate, or adjust any hyperparameter or threshold after viewing test set results.
- Do NOT conduct multiple test evaluations (single-shot evaluation only).
- **Do NOT export ONNX models.** (ONNX conversion requires explicit subsequent authorization).
- Do NOT modify production models, UI views, or application routes.
- Do NOT commit automatically.

#### 4. Exit & Verification Criteria:
- [ ] Single-shot test evaluation completed without post-hoc tuning.
- [ ] $1,000$ group-level bootstrap iterations completed deterministically with random seed $42$.
- [ ] $95\%$ Confidence Interval table generated for all core test metrics.
- [ ] Asymptotic standard error bounds cross-validated against bootstrap standard deviation.
- [ ] Synthetic benchmark limitation disclaimer explicitly appended to results.
- [ ] Final benchmark report authored in `docs/experiments/STAGE_3B_BENCHMARK_REPORT.md`.
- [ ] Complete experiment records logged in `experiments/registry.json`.
- [ ] Cryptographic hashes of `models/best_model.pkl` and both datasets re-verified bit-identical.
- [ ] Full existing test suite ($156$ tests) executed and confirmed passing.
- [ ] Formal STOP condition enforced pending user review.

---

## 4. GATE EXECUTION CONTROLS & STOP PROTOCOL

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              GATE GOVERNANCE PROTOCOL                                  │
├───────────────────┬────────────────────────────────────────────────────────────────────┤
│ Trigger Condition │ Explicit user authorization to begin Stage 3B.                     │
├───────────────────┼────────────────────────────────────────────────────────────────────┤
│ Execution Pace    │ Execute Gate 3B.1 first; STOP for review before Gate 3B.2.         │
├───────────────────┼────────────────────────────────────────────────────────────────────┤
│ Failure Handling  │ If any gate assertion fails, halt immediately, log error in        │
│                   │ experiment registry, and await engineer instructions.              │
├───────────────────┼────────────────────────────────────────────────────────────────────┤
│ Final State       │ All experimental artifacts isolated in `experiments/models/`.      │
│                   │ Production code and models 100% untouched.                         │
└───────────────────┴────────────────────────────────────────────────────────────────────┘
```

- [x] Phased gate architecture established across 6 independently reviewable gates.
- [x] Clear inputs, actions, prohibitions, and exit criteria codified for each gate.
- [x] Test set isolation strictly guaranteed until Gate 3B.6.
- [x] CPU-only execution mandated for all cross-validation and training steps.
- [x] ONNX export strictly prohibited until post-Gate 3B review.
- [x] Production preservation verified.
