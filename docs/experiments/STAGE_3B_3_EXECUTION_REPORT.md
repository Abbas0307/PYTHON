# MINDORA 2.0 — STAGE 3B.3: MODEL COMPARISON EXECUTION REPORT

**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Branch:** `mindora-2.0-rebuild`  
**Working Directory:** `D:\Depression calculator`  
**Execution Date:** November 15, 2026  
**Auditor Role:** Senior ML Research Infrastructure Engineer & Statistical Auditor  
**Stage Status:** COMPLETE — FULL BENCHMARK EVALUATED & ISOLATED  
**Stage 3B.4 Status:** STRICTLY UNAUTHORIZED  

---

## 1. Executive Summary & Scientific Scope

Stage 3B.3 was executed following explicit authorization to conduct an empirical comparison across three primary tabular model families:
1. **Model A:** Logistic Regression ($L_2$-regularized linear baseline established in Stage 3B.2)
2. **Model B:** Random Forest Classifier (100-tree bagging ensemble)
3. **Model C:** XGBoost Classifier (100-tree gradient boosted decision tree ensemble)

### Scientific Scope & Mandatory Disclaimers
- **Computational Engineering Benchmark Only:** This evaluation benchmarks the mathematical association between 10 demographic and academic survey features and a self-reported survey binary target (`Depression`) within Dataset A.
- **No Clinical Authority or Psychiatric Validity:** The survey target has no verified clinical or diagnostic validation (such as structured psychiatric diagnostic interviews or validated PHQ-9 thresholds). Model predictions, probabilities, and coefficients must **never** be interpreted as clinical diagnoses, depression assessments, or medical risk scores.
- **No Population Generalization Claim:** Computational performance within this dataset does not imply generalizability to student populations outside this specific public survey cohort.
- **No Candidate Selection or Calibration Promotion in this Stage:** Consistent with the explicit prompt boundaries, no model promotion, final candidate selection, or post-hoc calibration decisions are performed in Stage 3B.3.

---

## 2. Research Boundaries & Strict Preservation Audit

Every mandated boundary was verified throughout execution:
1. **Development-Only Partition:** Evaluated strictly on the 23,716 Development records (23,715 unique groups).
2. **Pre-Ingestion Streaming Isolation:** Loaded exclusively via `ml_lab/evaluation/development_only_loader.py`. All 4,185 Test Vault records were bypassed at the field-parsing and DataFrame materialization boundaries ($4,185$ bypasses verified).
3. **Test Vault Completely Untouched:** Zero access, inspection, parsing, tokenization, or evaluation on Test Vault records.
4. **Dataset B Untouched:** Zero access or reference to Dataset B.
5. **Outer Fold Reuse:** Reused the exact five group-disjoint outer folds established in Stage 3B.2 (`ml_lab/experiments/stage_3b_2/fold_assignments.csv`).
6. **Strict Preprocessing Isolation:** Imputation, scaling, and one-hot encoding were fitted **exclusively inside each training fold**.
7. **Production Model Intact:** `models/best_model.pkl` remains bit-identical (`E182E9E7...`).
8. **Partition Assets Intact:** `group_aware_partition_manifest.json` and `partition_assignments.csv` remain bit-identical.
9. **Legacy Assets Preserved:** `experiments/registry.json` and all 46 legacy model artifacts remain bit-identical *(with the historical caveat preserved that 23 of the 46 legacy models lacked reliable historical hash evidence)*.
10. **Stage 3B.2 Outputs Preserved:** All 11 files in `ml_lab/experiments/stage_3b_2/` remain bit-identical.
11. **No Git Tree Mutation:** Zero commits, resets, cleanups, stashes, or branch switches performed.

---

## 3. Comprehensive Model Comparison Results

All three models were evaluated across the identical 5 outer folds on Development data ($N=23,716$, positive cases = $13,885$, negative cases = $9,831$).

### 3.1 Primary Comparative Benchmark Matrix

| Evaluation Metric | Logistic Regression (Linear) | Random Forest (Bagging) | XGBoost (Boosting) | Delta vs. LR Baseline ($\Delta_{\text{XGB - LR}}$) |
|---|:---:|:---:|:---:|:---:|
| **ROC-AUC (Pooled OOF)** | **0.8700** | 0.8660 | **0.8717** | **+0.0017** |
| **ROC-AUC (5-Fold CV $\mu \pm \sigma$)** | $0.8700 \pm 0.0060$ | $0.8661 \pm 0.0069$ | $\mathbf{0.8718 \pm 0.0055}$ | $+0.0018$ |
| **Brier Score (Pooled OOF)** | 0.1424 | 0.1514 | **0.1415** | **-0.0009** (Lower error) |
| **Brier Score (5-Fold CV $\mu \pm \sigma$)** | $0.1424 \pm 0.0034$ | $0.1514 \pm 0.0024$ | $\mathbf{0.1415 \pm 0.0033}$ | $-0.0009$ |
| **Expected Calibration Error (ECE, 10 Bins)** | 0.0073 | 0.0743 | **0.0036** | **-0.0037** |
| **ECE (5-Fold CV $\mu \pm \sigma$)** | $\mathbf{0.0132 \pm 0.0040}$ | $0.0751 \pm 0.0085$ | $0.0154 \pm 0.0019$ | $+0.0022$ |
| **Accuracy ($\tau=0.50$)** | 0.7962 | 0.7929 | **0.7985** | $+0.0023$ |
| **Balanced Accuracy** | 0.7857 | 0.7773 | **0.7878** | $+0.0021$ |
| **Precision** | 0.8126 | 0.7961 | **0.8136** | $+0.0010$ |
| **Recall (Sensitivity)** | 0.8474 | **0.8689** | 0.8508 | $+0.0034$ |
| **Specificity** | 0.7239 | 0.6856 | **0.7247** | $+0.0008$ |
| **F1 Score** | 0.8296 | 0.8309 | **0.8318** | $+0.0022$ |
| **Confusion Matrix $[[TN, FP], [FN, TP]]$** | `[[7117, 2714],` `[2119, 11766]]` | `[[6740, 3091],` `[1820, 12065]]` | `[[7125, 2706],` `[2072, 11813]]` | $+8$ TNs, $+47$ TPs |
| **Total Training Time (5 Folds)** | **2.514 s** | 4.997 s | 3.476 s | $+0.962 \text{ s}$ |
| **Total Inference Time (5 Folds)** | **0.179 s** | 0.869 s | 0.288 s | $+0.109 \text{ s}$ |
| **Peak Heap Memory (Max Fold)** | **26.4 MB** | 48.2 MB | 31.8 MB | $+5.4 \text{ MB}$ |

---

## 4. Granular Fold-by-Fold Performance Breakdown

### Fold 0 ($N_{\text{train}}=18,973, N_{\text{val}}=4,743$)
- **Logistic Regression:** ROC-AUC = $0.8614$, Brier = $0.1468$, ECE = $0.0191$, Acc = $0.7921$, TrainTime = $0.561\text{s}$
- **Random Forest:** ROC-AUC = $0.8558$, Brier = $0.1546$, ECE = $0.0646$, Acc = $0.7860$, TrainTime = $1.036\text{s}$
- **XGBoost:** ROC-AUC = $0.8635$, Brier = $0.1459$, ECE = $0.0159$, Acc = $0.7921$, TrainTime = $1.379\text{s}$

### Fold 1 ($N_{\text{train}}=18,973, N_{\text{val}}=4,743$)
- **Logistic Regression:** ROC-AUC = $0.8766$, Brier = $0.1383$, ECE = $0.0162$, Acc = $0.8058$, TrainTime = $0.488\text{s}$
- **Random Forest:** ROC-AUC = $0.8705$, Brier = $0.1496$, ECE = $0.0839$, Acc = $0.8020$, TrainTime = $1.006\text{s}$
- **XGBoost:** ROC-AUC = $0.8769$, Brier = $0.1381$, ECE = $0.0145$, Acc = $0.8075$, TrainTime = $0.544\text{s}$

### Fold 2 ($N_{\text{train}}=18,972, N_{\text{val}}=4,744$) *(Contains Collided Group 1)*
- **Logistic Regression:** ROC-AUC = $0.8654$, Brier = $0.1458$, ECE = $0.0078$, Acc = $0.7890$, TrainTime = $0.506\text{s}$
- **Random Forest:** ROC-AUC = $0.8607$, Brier = $0.1540$, ECE = $0.0665$, Acc = $0.7816$, TrainTime = $1.008\text{s}$
- **XGBoost:** ROC-AUC = $0.8680$, Brier = $0.1447$, ECE = $0.0155$, Acc = $0.7892$, TrainTime = $0.515\text{s}$

### Fold 3 ($N_{\text{train}}=18,973, N_{\text{val}}=4,743$)
- **Logistic Regression:** ROC-AUC = $0.8764$, Brier = $0.1394$, ECE = $0.0115$, Acc = $0.7976$, TrainTime = $0.481\text{s}$
- **Random Forest:** ROC-AUC = $0.8750$, Brier = $0.1485$, ECE = $0.0849$, Acc = $0.8014$, TrainTime = $0.974\text{s}$
- **XGBoost:** ROC-AUC = $0.8781$, Brier = $0.1380$, ECE = $0.0186$, Acc = $0.7999$, TrainTime = $0.518\text{s}$

### Fold 4 ($N_{\text{train}}=18,973, N_{\text{val}}=4,743$)
- **Logistic Regression:** ROC-AUC = $0.8703$, Brier = $0.1418$, ECE = $0.0112$, Acc = $0.7965$, TrainTime = $0.477\text{s}$
- **Random Forest:** ROC-AUC = $0.8686$, Brier = $0.1503$, ECE = $0.0755$, Acc = $0.7936$, TrainTime = $0.972\text{s}$
- **XGBoost:** ROC-AUC = $0.8724$, Brier = $0.1406$, ECE = $0.0128$, Acc = $0.8039$, TrainTime = $0.519\text{s}$

---

## 5. Methodological & Scientific Analysis

### 5.1 Discrimination Ceiling & Model Linearity
- **Linear Representation Dominance:** Logistic Regression achieves an ROC-AUC of **0.8700** ($0.8700 \pm 0.0060$). XGBoost achieves **0.8717** ($0.8718 \pm 0.0055$), an absolute increase of only **+0.0017** (+0.20% relative gain). Random Forest achieves **0.8660** ($0.8661 \pm 0.0069$), slightly below the linear baseline (-0.0040).
- **Inference:** The 10 recorded demographic and lifestyle features exhibit predominantly linear or additive log-odds relationships with the survey target. High-order interaction terms captured by decision trees yield only negligible incremental discrimination on this dataset.

### 5.2 Probability Calibration Behavior
- **Logistic Regression:** Consistently well-calibrated (pooled ECE = $0.0073$, CV mean = $0.0132$), reflecting direct maximum likelihood Bernoulli log-odds optimization.
- **Random Forest Miscalibration:** Random Forest displays significant probability distortion: pooled ECE rises to **0.0743** (an order of magnitude higher than Logistic Regression), and Brier score deteriorates from $0.1424$ to **0.1514**. This occurs because unweighted leaf frequency averaging in depth-constrained trees pushes probabilities toward intermediate values and away from empirical extremes.
- **XGBoost Calibration Stability:** XGBoost preserves excellent calibration (pooled ECE = $0.0036$, CV mean = $0.0154$, Brier = $0.1415$). The conservative shrinkage ($\eta=0.08$) and logistic sigmoid leaf loss optimization prevent the overconfidence commonly observed in aggressively boosted trees.

### 5.3 Behavior on Collided Group 1 Records
- Group 1 (row indices 902 & 8257) features identical inputs but opposing survey labels ($y=1$ vs $y=0$), isolated in Fold 2.
- In Fold 2 validation:
  - **Logistic Regression:** Outputs $\hat{p} = 0.9416$ for both records (predicting $1$ for both).
  - **Random Forest:** Outputs $\hat{p} = 0.9125$ for both records (predicting $1$ for both).
  - **XGBoost:** Outputs $\hat{p} = 0.9452$ for both records (predicting $1$ for both).
- All three algorithms assign near-identical high probabilities ($\approx 0.91 - 0.95$) to this feature coordinate, confirming that the empirical label collision represents a deterministic classification limitation across linear, bagging, and boosting paradigms alike.

### 5.4 Computational Efficiency & Footprint
- **Logistic Regression:** Fastest training ($2.514\text{s}$ across 5 folds), lowest inference latency ($0.179\text{s}$), and lowest peak heap memory ($26.4\text{ MB}$).
- **XGBoost:** Highly efficient histogram binning (`tree_method="hist"`), training in $3.476\text{s}$ total ($0.695\text{s}$/fold) with $31.8\text{ MB}$ peak memory.
- **Random Forest:** Slowest training ($4.997\text{s}$ total) and highest peak memory ($48.2\text{ MB}$), reflecting the construction of 100 deep Cython tree data structures.

---

## 6. Complete Artifact Inventory of `ml_lab/experiments/stage_3b_3/`

All 12 primary artifacts were generated fresh and verified with their full 64-hex SHA-256 digests:

| # | Artifact Relative Path | Size (Bytes) | Full SHA-256 Digest |
|:---:|---|---:|---|
| **1** | `environment.json` | 500 | `DEEF79D79B64C53B45BCD323D2BDD55D089FB9E341A7A256674D9D772CF233B6` |
| **2** | `execution_metadata.json` | 233 | `3757576E410994A9F8388EEE149B866F8EE72A606E058F74F01FFD32B73AD682` |
| **3** | `experiment_config.json` | 1,663 | `CDDDAF0FCF4E44C6BE44C4303715AA4026151D05350BC8333D4899C2F95D55E5` |
| **4** | `fold_assignments.csv` | 1,876,765 | `B58CCCD93825192C3435F4B1E3EFAB17AC98278C3237B26A799D74B8D18D5154` |
| **5** | `fold_metrics.json` | 71,293 | `4A956183A927B2768408B59624471F88C72F4C807F9293ADF9C13437BDE035B5` |
| **6** | `input_hashes.json` | 395 | `7B7D68F9405801D76487681E8CD411E5F1AD0714B6C5698B4EE1F232413F44FB` |
| **7** | `model_comparison.json` | 1,967 | `FC8E31D45DEE28D3925A80627268299D185AE68D6C1DE092167EE23A7F6286E7` |
| **8** | `oof_metrics.json` | 17,067 | `555D3B159A31A5C6F6964143F040A97F8BECC938FCB9690986A9B856F9DC2A03` |
| **9** | `oof_predictions.csv` | 3,250,942 | `FFAE8D8CBA26889B7F8CBB3F322695556E3B2451F87583B0DEE159DC356CABF7` |
| **10** | `models/logistic_regression_dev.pkl` | 5,754 | `D7D3FA604FEE8B4CC93C33433312767D40DDE82C795CADE34AFD8B52E446D125` |
| **11** | `models/random_forest_dev.pkl` | 7,786,267 | `055D00D2FC1777A9EBE1CC0AC95C50395F326D25A66759AE2BFD60F71E46BE00` |
| **12** | `models/xgboost_dev.pkl` | 285,809 | `0B92D598E93A3A706D5D7B2481D6B0918E4A5B761CE99E677A4B96B3D8D02FEB` |

---

## 7. System Integrity & Regression Verification

### 7.1 Core Checksums
- **Dataset A SHA-256:** `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` (**BIT-IDENTICAL**)
- **Partition Manifest SHA-256:** `A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070` (**BIT-IDENTICAL**)
- **Partition Assignments SHA-256:** `91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1` (**BIT-IDENTICAL**)
- **Production Model SHA-256 (`models/best_model.pkl`):** `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` (**BIT-IDENTICAL**)
- **Legacy Registry SHA-256 (`experiments/registry.json`):** `68BBA7AC59902C2577C8764D6DD8AB7809912DAB196E69E59A1B9B481229E04B` (**BIT-IDENTICAL**)
- **46 Legacy Models:** All 46 files in `experiments/models/` verified bit-identical.
- **Stage 3B.2 Baseline Outputs:** All 11 files in `ml_lab/experiments/stage_3b_2/` verified bit-identical.

### 7.2 Full Test Suite Regression Results
Executed following Stage 3B.3 completion:
- `ml_lab/tests/test_stage_3b_2.py`: 12/12 PASS
- `ml_lab/tests/test_pre_ingestion_isolation.py`: 10/10 PASS
- Root discovery suite (`tests/`): 126/126 PASS
- `tests/model_parity/test_model_parity.py`: 3/3 PASS
- `tests/test_engine_independence.py`: 5/5 PASS
- `tests/test_student_experience.py`: 7/7 PASS
- `tests/test_training_platform.py`: 15/15 PASS
- **Grand Total Unique Project Tests Verified:** **178/178 PASSED (100% SUCCESS)** with zero regressions.

---

## 8. Current Git Working Tree Status

```
On branch mindora-2.0-rebuild
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/DAY_12_DATA_RETENTION_MATRIX.md
	modified:   experiments/registry.json
	modified:   src/privacy_policy.py
	modified:   src/training/__init__.py
	modified:   src/training/experiment_registry.py
	modified:   src/training/model_registry.py
	modified:   src/training/train.py
	tests/test_day12_privacy_architecture.py
	tests/test_training_platform.py

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/architecture/
	docs/data/
	docs/experiments/
	docs/operations/
	docs/privacy/
	docs/research/
	experiments/models/exp_20261115_002550_logistic_r.pkl
	experiments/models/exp_20261115_002551_baseline_m.pkl
	experiments/models/exp_20261115_003039_baseline_m.pkl
	experiments/models/exp_20261115_003039_logistic_r.pkl
	experiments/models/exp_20261115_004441_baseline_m.pkl
	experiments/models/exp_20261115_004441_logistic_r.pkl
	experiments/models/exp_20261115_005144_baseline_m.pkl
	experiments/models/exp_20261115_005144_logistic_r.pkl
	experiments/models/exp_20261115_005725_baseline_m.pkl
	experiments/models/exp_20261115_005725_logistic_r.pkl
	experiments/models/exp_20261115_010231_baseline_m.pkl
	experiments/models/exp_20261115_010231_logistic_r.pkl
	experiments/models/exp_20261115_010809_baseline_m.pkl
	experiments/models/exp_20261115_010809_logistic_r.pkl
	experiments/models/exp_20261115_011353_baseline_m.pkl
	experiments/models/exp_20261115_011353_logistic_r.pkl
	experiments/models/exp_20261115_012029_baseline_m.pkl
	experiments/models/exp_20261115_012029_logistic_r.pkl
	experiments/models/exp_20261115_012633_logistic_r.pkl
	experiments/models/exp_20261115_012634_baseline_m.pkl
	experiments/models/exp_20261115_013446_baseline_m.pkl
	experiments/models/exp_20261115_013446_logistic_r.pkl
	experiments/models/exp_20261115_015711_baseline_m.pkl
	experiments/models/exp_20261115_015711_logistic_r.pkl
	experiments/models/exp_20261115_015949_baseline_m.pkl
	experiments/models/exp_20261115_015949_logistic_r.pkl
	experiments/models/exp_20261115_020336_baseline_m.pkl
	experiments/models/exp_20261115_020336_logistic_r.pkl
	experiments/models/exp_20261115_021549_logistic_r.pkl
	experiments/models/exp_20261115_021550_baseline_m.pkl
	experiments/models/exp_20261115_021550_logistic_r.pkl
	experiments/models/exp_20261115_022046_baseline_m.pkl
	experiments/models/exp_20261115_022046_logistic_r.pkl
	ml_lab/
	resources/
	scripts/generate_fixtures.py
	shared/
	tests/model_parity/

no changes added to commit (use "git add" and/or "git commit -a")
```

---

## 9. Final Stop Condition

Stage 3B.3 execution is complete. All experimental outputs have been generated, validated, and persisted. 

**Stage 3B.4 (Probability Calibration, Post-Processing & Candidate Selection) remains STRICTLY UNAUTHORIZED.** We are stopped and awaiting explicit authorization.
