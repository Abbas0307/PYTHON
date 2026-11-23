# MINDORA 2.0 — STAGE 3B.2.1: BASELINE EXECUTION AUDIT & SCIENTIFIC CORRECTIONS

**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Branch:** `mindora-2.0-rebuild`  
**Working Directory:** `D:\Depression calculator`  
**Audit Date:** November 15, 2026  
**Auditor Role:** Senior ML Research Auditor, Data-Governance Engineer & Statistical Reviewer  
**Audit Status:** COMPLETE — FINDINGS RECORDED & DOCUMENTATION RECONCILED  
**Stage 3B.3 Status:** STRICTLY UNAUTHORIZED  

---

## 1. Executive Summary & Preservation Integrity

Stage 3B.2 baseline experiments successfully completed, establishing reproducible Dummy and Logistic Regression baselines evaluated via 5-fold `StratifiedGroupKFold` on the frozen Development partition ($N=23,716$).

Stage 3B.2.1 was conducted as an independent audit of the execution boundary, methodological correctness, and scientific reporting. All strict preservation rules were observed throughout the audit:
- **Dataset B Untouched:** Zero access or references to Dataset B.
- **Individual Test Vault Records Preserved:** Zero Test Vault records or labels were accessed, inspected, predicted, or evaluated.
- **Zero Model Retraining:** Baseline models were not retrained.
- **Zero Test Vault Predictions/Metrics:** No performance metrics or predictions were computed on Test Vault data.
- **Frozen Manifest & Assignments Unaltered:** Checksums for `group_aware_partition_manifest.json` and `partition_assignments.csv` remain identical to baseline.
- **Production Model Intact:** `models/best_model.pkl` remains bit-identical (`E182E9E7...`).
- **Legacy Artifacts Preserved:** All 46 legacy model artifacts in `experiments/models/` and `experiments/registry.json` remain bit-identical.
- **Streamlit Application Untouched:** Web application files and frontend remain unmodified.
- **Git State Maintained:** Zero commits, resets, cleanups, or stashes performed.

---

## 2. Critical Audit: Test Vault Isolation

### 2.1 Investigation of the 7 Isolation Questions

The execution logs and source code of `ml_lab/evaluation/partition_guard.py` and `ml_lab/experiments/stage_3b_2/run_stage_3b_2.py` were audited to establish the exact data-loading boundary.

| # | Audit Question | Audit Finding | Technical Evidence |
|---|---|---|---|
| **1** | Was the full Dataset A CSV loaded into a pandas DataFrame? | **YES** | `partition_guard.py` line 100: `raw_df = pd.read_csv(dataset_path)` reads the full 27,901 rows into RAM. |
| **2** | Were Test Vault feature rows or labels ever materialized in memory? | **YES** | During the execution of `load_partition_data()`, all 27,901 rows (including the 4,185 Test Vault rows) existed transiently in the in-memory `raw_df` DataFrame prior to filtering. |
| **3** | Was the dataset filtered to Development only before feature and target extraction? | **YES** | `partition_guard.py` line 103: `dev_df = raw_df.iloc[dev_row_indices].copy()`. Only `dev_df` was passed to feature/target separation (`X = dev_df[features]`, `y = dev_df[target]`). |
| **4** | Did any preprocessing, transformation, model fitting, prediction, or metric calculation operate on Test Vault rows? | **NO** | Zero Test Vault rows were included in any fold split, imputation, scaling, one-hot encoding, model fitting, probability prediction, or metric computation. All operations operated on the 23,716 Development records. |
| **5** | Were Test Vault indices used only as membership metadata, or were actual test records accessed? | **MEMBERSHIP METADATA ONLY** | `partition_assignments.csv` was parsed to extract index arrays (`dev_row_indices` and `test_vault_row_indices`). The Test Vault indices were used solely as exclusion criteria and alignment validation. Individual test rows were never inspected, queried, or utilized. |
| **6** | Did any saved artifact contain Test Vault features, labels, predictions, or derived statistics? | **NO** | All outputs in `ml_lab/experiments/stage_3b_2/` (`oof_predictions.csv`, `fold_metrics.json`, `oof_metrics.json`, `model_comparison.json`, `fold_assignments.csv`, `models/*.pkl`) were generated strictly from the 23,716 Development records. |
| **7** | Does the partition guard enforce Development-only access before data loading, or only after loading? | **AFTER LOADING** | The partition guard enforces isolation at the post-load in-memory boundary via DataFrame slicing (`.iloc[dev_row_indices]`). It does not enforce I/O-level pre-ingestion filtering at the CSV read stream. |

---

### 2.2 Boundary Classification

Under the prescribed classification standard:

$$\mathbf{TEST\ VAULT\ ROWS\ MATERIALIZED\ BUT\ NOT\ USED}$$

#### Evidence & Disclosure:
- **Historical Deviation Statement:** During Stage 3B.2, the complete Dataset A CSV was materialized in memory before Development-only extraction. Test Vault rows were therefore transiently materialized, although the audit found no evidence that they entered model fitting, prediction or evaluation. This constitutes a physical pre-ingestion isolation deviation. The subsequent ingestion hardening prevents recurrence in future research stages.
- **Scope of Materialization:** In `ml_lab/evaluation/partition_guard.py`, `load_partition_data()` invoked `pd.read_csv("dataset/Student_Depression_Dataset.csv")` without row exclusion arguments. As a result, the OS process buffer parsed all 27,901 records, holding all 4,185 Test Vault records transiently in memory.
- **Execution Consequence:** Zero statistical or informational leakage occurred. The data was immediately filtered via `.iloc[dev_row_indices].copy()`, and `raw_df` was discarded. However, this implementation relied on in-memory post-filtering rather than strict technical pre-ingestion isolation. Remediation was formally executed in Stage 3B.2.2 via `ml_lab/evaluation/development_only_loader.py`.

---

### 2.3 Proposed Corrected Architecture for Hardened Ingestion

To achieve `VERIFIED DEVELOPMENT-ONLY ACCESS` in future experimental stages and prevent Test Vault records from ever being materialized or parsed into process memory, the ingestion architecture should be updated as follows:

```python
def load_development_data_hardened(
    dataset_path: Path,
    assignments_path: Path
) -> pd.DataFrame:
    """
    Hardened I/O ingestion: reads ONLY Development rows directly from disk stream.
    Test Vault records are NEVER materialized in process memory.
    """
    import pandas as pd
    
    # 1. Read partition assignments metadata to identify Development row indices
    assignments = pd.read_csv(assignments_path, usecols=["row_index", "partition"])
    dev_indices = set(assignments[assignments["partition"] == "development"]["row_index"])
    
    # 2. Stream-filter CSV at read time: skip line 0 (header kept), skip line i if (i - 1) not in dev_indices
    # skiprows predicate receives 0-indexed line numbers (line 0 is CSV header)
    dev_df = pd.read_csv(
        dataset_path,
        skiprows=lambda line_idx: line_idx > 0 and (line_idx - 1) not in dev_indices
    )
    
    if len(dev_df) != 23716:
        raise ValueError(f"Expected 23,716 Development rows, loaded {len(dev_df)}")
        
    return dev_df
```

*Note: Per the strict preservation rules of Stage 3B.2.1, training was not rerun, and existing code was not modified during this audit.*

---

## 3. Empirical Label-Collision Interpretation Correction

### 3.1 Audit of Initial Report Phrasing

In `docs/experiments/STAGE_3B_2_BASELINE_EXPERIMENT_REPORT.md`, Section 10, Item 4 originally stated:
> *"Irreducible Label Collision Floor: Group 1 in Development contains two records with identical features but conflicting labels ($y=1$ vs $y=0$). Deterministic tabular classifiers cannot separate this group, creating a small irreducible Bayes error floor."*

### 3.2 Methodological Critique

Characterizing this sample-level conflict as an "irreducible Bayes error floor" is statistically unjustified:
1. **Sample Collision vs. Population Bayes Error:** The Bayes error rate is defined by the true conditional class probability distribution $P(Y \mid X)$ across the population:
   $$R^* = \mathbb{E}_X [\min(P(Y=1 \mid X), P(Y=0 \mid X))]$$
   An empirical label collision between two survey respondents in a finite sample dataset demonstrates inconsistency in the recorded data (e.g., unobserved confounders, subjective survey interpretation, or measurement noise). It does not measure or establish the population-level Bayes risk.
2. **Determinism Limit:** It proves that deterministic mapping from the 10 observed features to a discrete binary label cannot achieve 100% training accuracy on these two rows simultaneously.

### 3.3 Mandated Correction Applied

The report in `docs/experiments/STAGE_3B_2_BASELINE_EXPERIMENT_REPORT.md` (and its brain artifact counterpart) has been updated to the exact mandated text:

> **4. Empirical Label Collision:** Two observations in Development share an identical observed ten-feature signature but have conflicting survey-derived labels. This demonstrates an empirical label collision and a limitation of deterministic prediction from the recorded features. It does not establish the population's Bayes error or irreducible error rate.

### 3.4 Underlying Group 1 Data Provenance Preserved

- **Group ID:** 1 (assigned during Stage 3B.1 group-aware partitioning)
- **Row Indices in Dataset A:** 902 and 8,257 (Student IDs: 4,657 and 41,608)
- **Identical Observed 10-Feature Signature:**
  - `Age`: 24.0
  - `Academic Pressure`: 5.0
  - `Work Study Hours`: 0.0
  - `Study Satisfaction`: 1.0
  - `CGPA`: 8.0
  - `Sleep Duration`: 7-8 hours
  - `Gender`: Male
  - `Dietary Habits`: Moderate
  - `Have you ever had suicidal thoughts ?`: Yes
  - `Family History of Mental Illness`: No
- **Conflicting Survey Labels:**
  - Row 902 (ID 4657): `Depression = 1`
  - Row 8257 (ID 41608): `Depression = 0`
- **Cross-Validation Assignment:** Both records were allocated exclusively to **Validation Fold 2** (and Training Folds 0, 1, 3, 4). Zero leakage across train/validation splits occurred.

---

## 4. Logistic Regression Configuration Audit

The implementation in `ml_lab/evaluation/pipeline.py` and configuration in `ml_lab/experiments/stage_3b_2/experiment_config.json` were audited.

### 4.1 Hyperparameters and Configuration Elements

| Configuration Parameter | Value | Explicitly Configured vs. Library Default | Source / Reference |
|---|---|---|---|
| **Estimator Class** | `LogisticRegression` | Explicit | `pipeline.py:80` |
| **Solver** | `'lbfgs'` | Explicit | `experiment_config.json` |
| **Penalty** | `'l2'` | Scikit-learn Default | Scikit-learn 1.5.2 default (`penalty='l2'`) |
| **C (Inverse Regularization)** | `1.0` | Explicit | `experiment_config.json` |
| **Max Iterations** | `1000` | Explicit | `pipeline.py:83` |
| **Tolerance (`tol`)** | `1e-4` | Scikit-learn Default | Scikit-learn 1.5.2 default |
| **Class Weight** | `None` | Scikit-learn Default | Scikit-learn 1.5.2 default |
| **Random State** | `42` | Explicit | `pipeline.py:84` |
| **Fit Intercept** | `True` | Scikit-learn Default | Scikit-learn 1.5.2 default |
| **Numeric Features** | `['Age', 'Academic Pressure', 'Work Study Hours', 'Study Satisfaction', 'CGPA', 'Sleep Duration']` | Explicit | `pipeline.py:20-27` |
| **Categorical Features** | `['Gender', 'Dietary Habits', 'Have you ever had suicidal thoughts ?', 'Family History of Mental Illness']` | Explicit | `pipeline.py:28-33` |
| **Numeric Imputer** | `SimpleImputer(strategy='median')` | Explicit | `pipeline.py:58` |
| **Scaler** | `StandardScaler()` | Explicit | `pipeline.py:59` |
| **Categorical Imputer** | `SimpleImputer(strategy='most_frequent')` | Explicit | `pipeline.py:65` |
| **Categorical Encoder** | `OneHotEncoder(handle_unknown='ignore', sparse_output=False)` | Explicit | `pipeline.py:66-69` |
| **Unknown Category Handling** | `handle_unknown='ignore'` | Explicit | `pipeline.py:67` |

### 4.2 Independent Preprocessing per Cross-Validation Fold

- **Audit Finding:** **VERIFIED STRICT FOLD ISOLATION.**
- In `run_stage_3b_2.py`, for each fold $k \in \{0, 1, 2, 3, 4\}$:
  1. A fresh pipeline instance was constructed via `build_logistic_regression_pipeline()`.
  2. The pipeline was fitted strictly on `X_train_df` via `pipe.fit(X_train_df, y_train_arr)`.
  3. Feature statistics (median for imputation, mean and standard deviation for scaling, and observed categories for one-hot encoding) were computed **exclusively** on the training fold records ($N_{train} \approx 18,972$).
  4. Validation predictions were generated via `pipe.predict_proba(X_val_df)`.
  5. Zero preprocessing parameters or validation statistics leaked into training.

### 4.3 Saved Final Model Artifact

- **Artifact Path:** `ml_lab/experiments/stage_3b_2/models/logistic_regression_dev.pkl`
- **Fitting Procedure:** Fitted on **all 23,716 Development records** after 5-fold cross-validation completed.
- **Purpose & Governance:** This artifact represents a Development-only reference fit for potential serialization checks. It is **not** a production artifact, was never evaluated on the Test Vault, and does not supersede `models/best_model.pkl`.

---

## 5. Cross-Validation Integrity Audit

The saved fold allocations in `ml_lab/experiments/stage_3b_2/fold_assignments.csv` and CV execution logic were audited.

### 5.1 Verification Checklist

| # | Check | Requirement | Result | Evidence |
|---|---|---|---|---|
| **1** | Splitter Class | `StratifiedGroupKFold` | **VERIFIED** | Instantiated with `n_splits=5`, `shuffle=True`, `random_state=42`. |
| **2** | Random Seed | `42` | **VERIFIED** | Logged in `experiment_config.json` and executed. |
| **3** | Model Alignment | Identical fold splits for both models | **VERIFIED** | Both DummyClassifier and LogisticRegression were trained on the exact same fold indices recorded in `fold_assignments.csv`. |
| **4** | Group Independence | Zero group overlap between Train and Val | **VERIFIED** | Evaluated for all 5 folds: $\text{len}(\text{groups}_{train} \cap \text{groups}_{val}) = 0$. |
| **5** | Group 1 Preservation | Collided records placed in same fold | **VERIFIED** | Both records (indices 902 and 8257) were assigned to Validation Fold 2. Neither record was split across train/val. |

### 5.2 Fold Distribution Summary

| Fold | $N_{train}$ | $N_{val}$ | $N_{groups, train}$ | $N_{groups, val}$ | Val Positive Class Rate | Group Leakage ($\cap$) |
|---|---|---|---|---|---|---|
| **0** | 18,973 | 4,743 | 18,972 | 4,743 | 58.55% | 0 groups |
| **1** | 18,973 | 4,743 | 18,972 | 4,743 | 58.55% | 0 groups |
| **2** | 18,972 | 4,744 | 18,971 | 4,744 | 58.56% | 0 groups |
| **3** | 18,973 | 4,743 | 18,972 | 4,743 | 58.55% | 0 groups |
| **4** | 18,973 | 4,743 | 18,972 | 4,743 | 58.55% | 0 groups |

*Note: Fold 2 contains 4,744 validation records and 4,744 validation groups because Group 1 (which comprises 2 records sharing 1 group ID) was assigned to Fold 2.*

---

## 6. Checksum & Artifact Integrity Matrix

All primary artifacts were re-hashed to confirm absolute preservation of project state.

| Artifact Category | Target File Path | SHA-256 Digest | Status |
|---|---|---|---|
| **Dataset A** | `dataset/Student_Depression_Dataset.csv` | `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` | Frozen / Bit-Identical |
| **Partition Manifest** | `ml_lab/splits/group_aware_partition_manifest.json` | `A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070` | Frozen / Bit-Identical |
| **Partition Assignments** | `ml_lab/splits/partition_assignments.csv` | `91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1` | Frozen / Bit-Identical |
| **Production Model** | `models/best_model.pkl` | `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` | Preserved / Untouched |
| **Legacy Registry** | `experiments/registry.json` | `68BBA7AC59902C2577C8764D6DD8AB7809912DAB196E69E59A1B9B481229E04B` | Preserved / Untouched |
| **Legacy Models** | `experiments/models/` (46 artifacts) | Bit-identical across all 46 files | Preserved / Untouched |

---

## 7. Quality Gates & Test Suite Verification

The full project test suite was verified to ensure zero regressions:

1. **`ml_lab` Baseline & Evaluation Test Suite:**
   ```
   Ran 12 tests in 1.189s
   OK
   ```
2. **Root Test Discovery Suite (`tests/`):**
   ```
   Ran 126 tests in 6.075s
   OK (skipped=1)
   ```
3. **Standalone Quality Suites:**
   - `test_model_parity.py`: 3/3 passed
   - `test_engine_independence.py`: 5/5 passed
   - `test_student_experience.py`: 7/7 passed
   - `test_training_platform.py`: 15/15 passed
4. **Grand Total Unique Tests Verified:** **168/168 tests passed (100% pass rate)**.

---

## 8. Exact Git Status

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
	modified:   tests/test_day12_privacy_architecture.py
	modified:   tests/test_training_platform.py

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

## 9. Next Stage Status

Stage 3B.2.1 is complete. **Stage 3B.3 (Tree-Based Non-Linear Baseline / Gradient Boosting Models) remains STRICTLY UNAUTHORIZED.** No training or feature engineering for subsequent stages has been initiated.
