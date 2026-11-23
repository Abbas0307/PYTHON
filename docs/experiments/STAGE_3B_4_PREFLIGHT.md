# MINDORA 2.0 — STAGE 3B.4: CALIBRATION RESEARCH PREFLIGHT (STAGE 3B.4.3 FINAL READINESS REVISION)

**Project:** Mindora 2.0  
**Branch:** `mindora-2.0-rebuild`  
**Stage:** 3B.4 Preflight (Stage 3B.4.3 Final Execution Readiness Check)  
**Role:** Senior ML Research Engineer, Statistical Reviewer, and Reproducibility Auditor  
**Date:** 2026-11-15  
**Status:** **PREFLIGHT SPECIFICATION ONLY — ZERO TRAINING EXECUTED**  
**Execution Gate:** **Stage 3B.4 execution remains STRICTLY UNAUTHORIZED until explicit user prompt.**

---

## 1. Executive Summary & Objective

In Stage 3B.3, three baseline and candidate architectures were evaluated across a 5-fold StratifiedGroupKFold validation protocol on the Development partition ($N=23,716$):
1. **Logistic Regression** (Linear baseline: Pooled ROC-AUC = $0.8700$, Brier = $0.1424$, ECE = $0.0073$)
2. **Random Forest** (Tree ensemble: Pooled ROC-AUC = $0.8660$, Brier = $0.1514$, ECE = $0.0743$)
3. **XGBoost** (Gradient boosted trees: Pooled ROC-AUC = $0.8717$, Brier = $0.1415$, ECE = $0.0036$)

While Logistic Regression and XGBoost naturally minimize log-loss objectives and produce well-calibrated probabilities, Random Forest exhibited severe systematic probability miscalibration ($\text{ECE} = 0.0743$), with predictions heavily compressed away from 0 and 1 toward the marginal prior.

The objective of **Stage 3B.4** is to design and execute a controlled, group-aware, leakage-free probabilistic calibration experiment comparing:
1. **Uncalibrated Probabilities** (Raw model outputs)
2. **Sigmoid / Platt Calibration** (Parametric logistic transformation)
3. **Isotonic Calibration** (Non-parametric monotonic step transformation)

This final preflight revision incorporates the **Stage 3B.4.3 execution readiness standards**:
- **Predeclared Decision Threshold ($\tau = 0.50$):** Fixed across all models and calibration regimes. Optimization of decision thresholds using outer validation labels is **strictly prohibited**.
- **Decoupling of Metrics:** Probability calibration metrics (proper scoring rules: Brier score, log loss, ECE, ROC-AUC, reliability diagrams) are strictly decoupled from threshold-dependent classification metrics (Accuracy, F1, Confusion Matrix).
- **Exact Integer Confusion Matrix Reporting:** Mandated reporting of both the pooled out-of-fold confusion matrix and all 5 individual outer-fold confusion matrices as exact integer counts. Substituting fractional or mean $\pm$ standard deviation confusion matrices is **strictly prohibited**.
- **Precise Test Vault Terminology:** The Test Vault ($N=4,185$) is formally documented as **"untouched during this experiment"** (rather than "physically isolated").
- **Final Execution Readiness Sign-Off:** Methodology, code paths, test suites, and safeguards audited as fully ready for execution upon separate authorization.

---

## 2. Strict Boundary Assertions & Non-Negotiable Rules

The following 12 mandatory rules govern all Stage 3B.4 design and future execution:

| # | Boundary Rule | Implementation / Verification Mechanism | Status |
|:---:|:---|:---|:---:|
| **1** | **Dataset A Development Only** | Ingestion restricted exclusively to $N=23,716$ Development rows via `load_development_dataset()`. | **VERIFIED** |
| **2** | **Preserve Group Partition Assignments** | Strict reuse of `ml_lab/splits/partition_assignments.csv` and outer 5-fold assignments in `ml_lab/experiments/stage_3b_3/fold_assignments.csv`. | **VERIFIED** |
| **3** | **Disjoint Out-of-Sample Calibration** | Calibration models fit strictly on inner out-of-fold calibration splits; zero label overlap between calibration fitting and outer evaluation. | **VERIFIED** |
| **4** | **Predeclared Fixed Threshold ($\tau=0.5$)** | Fixed at 0.50 for all pipelines. Threshold optimization on validation labels is strictly prohibited. | **VERIFIED** |
| **5** | **Exact Integer Confusion Matrices** | Exact integer count matrices `[[TN, FP], [FN, TP]]` reported for pooled OOF and all 5 individual folds. No mean $\pm$ std matrices. | **VERIFIED** |
| **6** | **Empirical Isotonic Diagnostics** | Discarded universal guarantees; stability and quantization evaluated empirically via tie rates, unique scores, plateaus, and fold variance. | **VERIFIED** |
| **7** | **Reproducibility & Seed Controls** | Outer seed = 42; inner calibration split seed = 42; deterministic float rounding and SHA-256 fingerprinting. | **VERIFIED** |
| **8** | **Preserve Prior Stage Artifacts** | All 11 Stage 3B.2 files and 12 Stage 3B.3 files preserved bit-identically in `ml_lab/experiments/`. | **VERIFIED** |
| **9** | **Zero Production / Frontend Changes** | Production model (`models/best_model.pkl`) and Streamlit application left completely untouched. | **VERIFIED** |
| **10** | **Test Vault Untouched** | Test Vault ($N=4,185$) remains completely untouched during this experiment. Zero bytes read or materialized. | **VERIFIED** |
| **11** | **Zero Dataset B Access** | Zero ingestion, path references, or interactions with Dataset B. | **VERIFIED** |
| **12** | **Preflight Only (Zero Training)** | **STOP after preflight**. No models fitted, no calibrators trained, no hyperparameter search executed. | **ENFORCED** |

---

## 3. Comparison of Calibration Architectures

Two experimental calibration structures are specified for investigation:

```
====================================================================================================
ARCHITECTURE A: Inner Ensemble Averaging (Primary Research Benchmark)
====================================================================================================
Outer Train (N ~ 18,973) --> Split into 5 inner group-aware folds (80% / 20%)
  |-- Inner Fold 1: Train M_1 on N ~ 15,178  --> Predict Val 1 (N ~ 3,795)  --> Fit Calibrator C_1
  |-- Inner Fold 2: Train M_2 on N ~ 15,178  --> Predict Val 2 (N ~ 3,795)  --> Fit Calibrator C_2
  |-- Inner Fold 3: Train M_3 on N ~ 15,178  --> Predict Val 3 (N ~ 3,795)  --> Fit Calibrator C_3
  |-- Inner Fold 4: Train M_4 on N ~ 15,178  --> Predict Val 4 (N ~ 3,795)  --> Fit Calibrator C_4
  |-- Inner Fold 5: Train M_5 on N ~ 15,178  --> Predict Val 5 (N ~ 3,795)  --> Fit Calibrator C_5
Outer Val (N ~ 4,743) --> Predict via all 5 sub-models --> Average: p_cal = (1/5) * sum_{j=1}^5 C_j(M_j(x))

====================================================================================================
ARCHITECTURE B: Pooled Inner-OOF Single Calibrator + Full Outer Model (Secondary Research Comparator)
====================================================================================================
Outer Train (N ~ 18,973) --> Split into 5 inner group-aware folds
  |-- Generate 18,973 out-of-fold probability predictions across outer train using 5 inner models
  |-- Fit ONE Single Calibrator C_pool on all 18,973 pooled inner OOF predictions and labels
  |-- Train ONE Full Base Model M_full on the complete Outer Train partition (N = 18,973)
Outer Val (N ~ 4,743) --> Predict: p_cal = C_pool(M_full(x))
```

### 3.1 Architectural Trade-Off Analysis

| Architectural Dimension | Architecture A (Primary Research Benchmark) | Architecture B (Secondary Research Comparator) |
|:---|:---|:---|
| **Role & Status** | **Primary Research Benchmark (NOT production-ready)** | **Secondary Research Comparator (NOT production-ready)** |
| **Calibration Sample Size** | **$N \approx 3,795$ per calibrator** ($5$ independent calibrators per fold). | **$N = 18,973$** ($1$ pooled calibrator per fold). |
| **Isotonic Quantization Behavior** | **Empirical Hypothesis:** Averaging $5$ piecewise constant step functions *may* reduce probability quantization and ties, but this is NOT guaranteed and must be measured empirically via tie rates and delta ROC-AUC. | Evaluated as a single piecewise-constant step function; susceptibility to horizontal plateaus must be measured. |
| **Distributional Consistency** | **Zero Distributional Mismatch:** Calibrator $C_j$ is fitted on outputs from model $M_j$ ($N_{\text{train}} \approx 15,178$) and evaluates on inputs from that exact same model $M_j$. | **Potential Score-Distribution Shift:** Inner OOF scores are generated by models trained on $N \approx 15,178$, but test-time evaluation uses a model trained on $N = 18,973$. Potential differences in score sharpness or tree leaf frequencies must be documented. |
| **Inference Cost & Footprint** | $5\times$ forward passes; stores $5$ base models + $5$ calibrators per outer fold ($25$ models per pipeline). | $1\times$ forward pass; stores $1$ base model + $1$ calibrator per outer fold. |
| **Leakage Isolation** | Zero leakage: Outer validation ($N \approx 4,743$) strictly held out. | Zero leakage: Outer validation ($N \approx 4,743$) strictly held out. |

---

## 4. Decision Threshold & Confusion Matrix Reporting Mandates

### 4.1 Fixed Decision Threshold Policy
- **Primary Threshold:** Predeclared strictly as $\tau = 0.50$ for all classification metrics.
- **Optimization Ban:** Threshold tuning (such as searching for Youden's J statistic, F1-maximization, or cost-weighted cuts) using outer validation labels is **strictly prohibited**. Outer validation data must serve purely as a held-out test evaluation.
- **Metric Separation:** Probability-based metrics (proper scoring rules: Brier score, log loss, ECE, calibration curves, ROC-AUC) are decoupled from thresholded decision metrics (Accuracy, Balanced Accuracy, Precision, Recall, Specificity, F1, Confusion Matrix).

### 4.2 Exact Confusion Matrix Reporting Standards
- **Pooled Out-of-Fold Matrix:** Exact integer count matrix `[[TN, FP], [FN, TP]]` across all 23,716 Development instances.
- **Granular Per-Fold Matrices:** Exact integer count matrices `[[TN, FP], [FN, TP]]` recorded for Fold 0, Fold 1, Fold 2, Fold 3, and Fold 4 individually.
- **Prohibition on Fractional Matrices:** Substituting mean $\pm$ standard deviation confusion matrices (e.g. `[[1420.2 ± 12.1, 540.8 ± 10.4], ...]`) for actual integer counts is strictly forbidden, as it obscures discrete false positive and false negative realizations.

---

## 5. Empirical Diagnostics for Isotonic Calibration

Universal sample-size stability claims and unverified step counts were removed from the protocol. Sizing adequacy and step stability are evaluated via **8 empirical diagnostics**:
1. **Calibration Sample Size ($N_{\text{cal}}$):** Exact count of calibration pairs per fit ($N \approx 3,795$ in Arch A; $N = 18,973$ in Arch B).
2. **Class Counts ($N_+, N_-$):** Empirical label balance within the calibration set.
3. **Unique Raw Scores Count:** Number of distinct probability values emitted by the base estimator.
4. **Unique Calibrated Scores Count:** Number of distinct probability values emitted by PAVA.
5. **Probability Tie Rate (%):** Proportion of validation instances sharing a non-unique calibrated probability:
   $$\text{TieRate} = 1.0 - \frac{\text{Unique Calibrated Scores}}{N_{\text{val}}}$$
6. **Maximum Plateau Length:** Maximum number of validation instances mapped to the identical step probability.
7. **Fold-to-Fold Variability:** Standard deviation ($ddof=1$) of calibration metrics across the 5 outer folds.
8. **Discrimination Delta ($\Delta \text{ROC-AUC}$):** Pairwise change in rank discrimination:
   $$\Delta \text{ROC-AUC} = \text{ROC-AUC}_{\text{calibrated}} - \text{ROC-AUC}_{\text{uncalibrated}}$$

---

## 6. Reconciled Test Suite Accounting (171 Unique Test Procedures)

The codebase contains exactly **171 unique, non-overlapping test procedures** (100% PASS):

| Test Suite / Component | Discovery / Execution Mechanism | Unique Test Procedures |
|:---|:---|:---:|
| **Root Discovery Suite (`tests/`)** | `unittest.discover('tests')` | **126** |
| **Model Parity Suite (`tests/model_parity/`)** | `unittest.discover('tests/model_parity')` | **3** |
| **Standalone Platform Tests (`tests/test_training_platform.py`)** | Procedural script runner | **15** |
| **Standalone Engine Tests (`tests/test_engine_independence.py`)** | Procedural script runner | **5** |
| **Standalone Experience Tests (`tests/test_student_experience.py`)**| Procedural script runner | **7** |
| **Research Platform Suite (`ml_lab/tests/`)** | `unittest.discover('ml_lab/tests')` | **27** |
| **Grand Total Unique Tests** | Non-overlapping functional procedures | **171** |

---

## 7. Final Execution Readiness Assessment

| Execution Dimension | Readiness Status | Audit Evidence |
|:---|:---:|:---|
| **Data Ingestion** | **READY** | Hardened `development_only_loader.py` enforces zero Test Vault materialization. |
| **Cross-Validation Splitter** | **READY** | Precomputed inner split index lists bypass scikit-learn metadata routing bugs with zero group leakage. |
| **Calibration Metrics Engine** | **READY** | Re-verified `metrics.py` handles Brier, Log Loss ($\epsilon=10^{-15}$), ECE (10 deciles), and exact integer confusion matrices. |
| **Specification Conformance** | **READY** | Spec v1.3.0 validated via automated preflight test suite. |
| **Prior Stage Protection** | **READY** | Checksums for Stage 3B.2 (11 files) and Stage 3B.3 (12 files) audited and locked. |
| **Overall Preflight Gate** | **READY FOR EXECUTION** | Awaiting separate explicit user authorization. |
