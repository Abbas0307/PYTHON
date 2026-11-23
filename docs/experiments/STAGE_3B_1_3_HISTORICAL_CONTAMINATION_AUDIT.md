# MINDORA 2.0 — STAGE 3B.1.3: HISTORICAL MODEL CONTAMINATION REVIEW & EXPERIMENT BOUNDARY FREEZE

**Document Ref:** `docs/experiments/STAGE_3B_1_3_HISTORICAL_CONTAMINATION_AUDIT.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Stage:** Stage 3B.1.3 Historical Contamination Review & Boundary Freeze  
**Status:** Complete & Authoritative — **Stage 3B.2 Not Started**  

---

## 1. EXECUTIVE SUMMARY & AUDIT OBJECTIVE

This audit resolves the methodological and scientific boundaries governing the existing production model artifact (`models/best_model.pkl`), addresses cross-split training data contamination risks, corrects the characterization of the classification decision threshold, codifies mandatory automated partition safeguards for future training code, and predeclares the formal evaluation metric protocol ahead of any Stage 3B model development.

---

## 2. HISTORICAL MODEL CONTAMINATION AUDIT & AUDIT BOUNDARY CORRECTION

### 2.1 Cross-Partition Contamination Analysis
The proposed activity in earlier drafts of Stage 3B.2 specified:
> "Retrospective `best_model.pkl` audit on historical split."

A rigorous mathematical analysis of data provenance reveals an inherent contamination conflict between the historical model and the new group-aware partitioning scheme:

1. **Historical Training Provenance:**
   - The production model `models/best_model.pkl` was fitted on a random row-level stratified $70\%$ training split ($N=19,530$) of Dataset A.
2. **New Group-Aware Test Vault Provenance:**
   - The new Test Vault was generated via 20-fold `StratifiedGroupKFold` ($3$ slices = $15.0\%$, $N=4,185$, $4,184$ groups).
3. **Cross-Partition Overlap Risk:**
   - Because the two partitioning strategies use independent allocation logic (one random row-level, one group-signature-constrained), their set memberships intersect.
   - Under an independent randomized $70\%$ row-allocation assumption, the expected overlap between the historical training set and the new Test Vault is approximately $70\%$.
   - **Important Clarification:** This $70\%$ figure is a theoretical statistical expectation under independent sampling, **NOT an empirically measured overlap**. No exact overlap count has been established, and the theoretical figure ($\sim 2,930$ rows) must **not** be described as confirmed historical training records.
   - Regardless of the exact empirical count, the existence of unquantified historical training overlap mandates a conservative boundary.

### 2.2 Critical Contamination Finding
Evaluating `best_model.pkl` on the new Test Vault would mean evaluating the estimator on rows on which it was previously trained. This would cause severe training-data leakage, artificially inflating accuracy and calibration metrics.

Furthermore, evaluating `best_model.pkl` on its historical $15\%$ test split ($N=4,186$) is also problematic because that historical holdout contains records that now reside in the new Test Vault, directly violating the Test Vault lock.

### 2.3 Conservative Rule & Corrected Stage 3B.2 Scope
To guarantee scientific integrity and absolute vault isolation, the following conservative boundaries are formally codified:
1. **Zero Retrospective Evaluation on Test Vault:** No retrospective evaluation of `models/best_model.pkl` may use any records belonging to the new Test Vault ($N=4,185$).
2. **Zero New Performance Metrics on Test Vault:** No new predictions, loss calculations, or performance metrics may be computed for `best_model.pkl` on the new Test Vault.
3. **Historical Metrics Quoted with Original Provenance:**
   - Authoritative production baseline: $79.69\%$ accuracy, $0.8676$ ROC-AUC, $0.1448$ Brier score (from `evaluation/training_report.txt` and `models/model_comparison.json`).
   - Historical experiment tracker: $79.48\%$ accuracy, $0.8667$ ROC-AUC, $0.1445$ Brier score (from `experiments/registry.json`).
   - These figures may be quoted strictly as historical baseline reference points.
4. **Historical Metrics Segregation:** Historical metrics must **NEVER** be presented as independent group-aware evaluation results.
5. **Permitted Introspection:** `models/best_model.pkl` may be inspected strictly for architecture (XGBClassifier), preprocessing pipeline transformers, categorical encodings, hyperparameters, and feature schema compliance.

---

## 3. DECISION THRESHOLD RATIONALE CORRECTION

All references across project documentation to the fixed $0.50$ classification decision threshold are hereby clarified and corrected:

1. **Engineering Operating Point:** The classification threshold of $0.50$ is a **predeclared engineering operating point**, chosen as the standard mathematical midpoint for binary logistic and tree probability outputs.
2. **Not Clinically Validated:** The $0.50$ threshold is **NOT** a clinically validated, clinically calibrated, or clinically optimal threshold. In student wellbeing and mental health screening, clinical operating points are determined through formal clinical utility studies, receiver operating characteristic cost-benefit analyses, and domain-specific false-negative tolerance thresholds.
3. **Strict Prohibition on Post-Hoc Tuning:** The decision threshold must **NOT** be tuned, swept, or optimized using the Test Vault. Any threshold exploration must be conducted strictly on Development partition cross-validation folds prior to final model freezing.

---

## 4. MANDATORY AUTOMATED SAFEGUARDS FOR FUTURE EXPERIMENTAL PIPELINES

Because Stage 3B.1.2 established that active training scripts do not yet contain standing runtime partition assertions, every future training, cross-validation, and calibration script developed in Stages 3B.2 through 3B.5 must implement the following non-negotiable automated safeguards:

### 4.1 Required Programmatic Safeguards
```python
import json
import hashlib
import pandas as pd

# 1. Dataset A Hash Verification
with open("dataset/Student_Depression_Dataset.csv", "rb") as f:
    dataset_hash = hashlib.sha256(f.read()).hexdigest().upper()
assert dataset_hash == "A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404", \
    "FATAL: Dataset A SHA-256 hash mismatch! Pipeline aborted."

# 2. Partition Manifest Hash Verification
with open("ml_lab/splits/group_aware_partition_manifest.json", "rb") as f:
    manifest_hash = hashlib.sha256(f.read()).hexdigest().upper()
assert manifest_hash == "A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070", \
    "FATAL: Partition manifest SHA-256 mismatch! Pipeline aborted."

# 3. Partition Membership Assertion
partition_df = pd.read_csv("ml_lab/splits/partition_assignments.csv")
assert (partition_df.loc[train_indices, 'partition'] == 'development').all(), \
    "FATAL: Training indices contain non-development records!"
assert (partition_df.loc[val_indices, 'partition'] == 'development').all(), \
    "FATAL: Validation indices contain non-development records!"

# 4. Explicit Test Vault Rejection
assert 'test_vault' not in partition_df.loc[active_indices, 'partition'].values, \
    "FATAL: Test Vault row leakage detected in development pipeline!"

# 5. Group Disjointness Verification
train_groups = set(partition_df.loc[train_indices, 'group_id'])
val_groups = set(partition_df.loc[val_indices, 'group_id'])
assert len(train_groups.intersection(val_groups)) == 0, \
    "FATAL: Group leakage detected between training and validation folds!"
```

### 4.2 Fail-Closed Mandate & Architectural Segregation
- **Fail-Closed:** If any checksum mismatch occurs, or if partition membership cannot be deterministically verified, the pipeline must immediately exit with code 1 and log the failure.
- **Architectural Segregation:** Development training modules (`ml_lab/training/`, `ml_lab/calibration/`) must be structurally isolated from final evaluation modules (`ml_lab/evaluation/`). Development code must have zero read pathways to Test Vault assignments.

---

## 5. FORMAL EVALUATION METRIC PROTOCOL DEFINITIONS

Ahead of any model fitting or comparisons, the experimental evaluation protocol is predeclared and frozen.

### 5.1 Positive-Class Definition
- **Positive Class ($y=1$):** Self-reported affirmative response to `Depression` survey item in Dataset A.
- **Negative Class ($y=0$):** Non-affirmative response (`Depression = 0`).

### 5.2 Primary Metric
- **ROC-AUC (Receiver Operating Characteristic Area Under the Curve):**
  - Evaluates threshold-independent discrimination between positive and negative classes.
  - Chosen as the primary benchmark metric because it evaluates probability rank ordering without depending on a specific classification decision threshold.

### 5.3 Secondary Metrics
1. **Brier Score:** Mean squared error between predicted probabilities and binary ground truth:
   $$\text{Brier} = \frac{1}{N} \sum_{i=1}^N (p_i - y_i)^2$$
2. **Expected Calibration Error (ECE):**
   - **Binning Strategy:** Exactly 10 equal-width bins partitioning the probability range $[0.0, 1.0]$:
     $$B_m = \left[\frac{m-1}{10}, \frac{m}{10}\right) \quad \text{for } m=1,\dots,9; \qquad B_{10} = [0.9, 1.0]$$
   - **Inclusion of Probability 1.0:** The final bin $B_{10}$ is closed on both ends ($[0.9, 1.0]$) so that predictions equal to $1.0$ are included.
   - **Mathematical Formulation:**
     $$\text{ECE} = \sum_{m=1}^{10} \frac{n_m}{N} \left| \text{conf}(B_m) - \text{acc}(B_m) \right|$$
     where $N$ is total sample size, $n_m$ is the number of observations in bin $m$ ($\hat{p}_i \in B_m$), $\text{conf}(B_m) = \frac{1}{n_m} \sum_{i \in B_m} \hat{p}_i$ is the mean predicted confidence, and $\text{acc}(B_m) = \frac{1}{n_m} \sum_{i \in B_m} y_i$ is the empirical positive-class frequency ($y=1$).
   - **Empty-Bin Handling:** If no observations fall into bin $m$ ($n_m = 0$), bin $m$ contributes $0$ to the summation ($\frac{0}{N} \times |\dots| = 0$), preventing division-by-zero errors.
   - **Methodological Limitations:** ECE depends directly on binning choices (e.g., number of bins, equal-width vs equal-frequency) and can mask internal calibration errors within individual bins. Therefore, ECE is not a complete calibration assessment and must be interpreted alongside the Brier Score, calibration slope/intercept, and graphical reliability curves. No ECE calculation is performed during this audit.
3. **Threshold-Dependent Metrics (Evaluated at Predeclared Engineering Operating Point $0.50$):**
   - **Accuracy:** $\frac{\text{TP} + \text{TN}}{\text{TP} + \text{TN} + \text{FP} + \text{FN}}$
   - **Balanced Accuracy:** $\frac{1}{2} \left( \frac{\text{TP}}{\text{TP} + \text{FN}} + \frac{\text{TN}}{\text{TN} + \text{FP}} \right)$
   - **Precision (Positive Predictive Value):** $\frac{\text{TP}}{\text{TP} + \text{FP}}$
   - **Recall (Sensitivity):** $\frac{\text{TP}}{\text{TP} + \text{FN}}$
   - **Specificity (True Negative Rate):** $\frac{\text{TN}}{\text{TN} + \text{FP}}$
   - **Macro F1-Score:** Unweighted harmonic mean of Precision and Recall across classes.

### 5.4 Group-Bootstrap Resampling Protocol
The group-aware bootstrap protocols for development uncertainty analysis (Stage 3B.5) and final Test Vault evaluation (Stage 3B.6) are strictly distinguished:

#### 1. Development Validation Bootstrap (Stage 3B.5):
- Resamples strictly from the $23,715$ unique groups assigned to Development.
- Includes Group 1 (Rows 902 and 8257 with conflicting labels $1$ and $0$). Whenever Group 1 is drawn, both rows and their original observed labels are kept intact without label smoothing.

#### 2. Final Test Vault Bootstrap (Stage 3B.6):
- **Resampling Population:** Strictly the $4,184$ unique groups assigned to the Test Vault in `partition_assignments.csv` ($4,183$ singletons and $1$ two-row group [Group 2]).
- **Stratification:** Stratify by the predeclared group-level label classification across the Test Vault groups.
- **Zero Development Leakage:** Groups assigned to Development (including Group 1) are **NEVER** included in the Test Vault bootstrap.
- **Cluster & Label Preservation:** When a unique group is sampled with replacement, all rows and labels belonging to that group are drawn together intact. For Group 2 (Rows 1818 and 11156, both concordant positive labels $y=1$), both rows are preserved together in the bootstrap replicate.
- **Iterations & Seed:** Deterministic execution across $1,000$ bootstrap iterations using master random seed $42$.
- **Confidence Interval Estimation:** Empirical percentile method:
  $$\text{CI}_{95\%} = \left[ \hat{\theta}_{2.5\%}, \; \hat{\theta}_{97.5\%} \right]$$
- No individual Test Vault records are inspected, and no metrics are calculated during this audit.

---

## 6. CRYPTOGRAPHIC VERIFICATION & ENVIRONMENT INTEGRITY

All core file hashes were verified bit-identical using `Get-FileHash`:

```
┌───────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────┬──────────────┐
│ File Path                                         │ SHA-256 Cryptographic Checksum                                   │ Verification │
├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼──────────────┤
│ dataset/Student_Depression_Dataset.csv            │ A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404│ Bit-Exact OK │
│ models/best_model.pkl                             │ E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC│ Bit-Exact OK │
│ ml_lab/splits/group_aware_partition_manifest.json │ A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070│ Bit-Exact OK │
│ ml_lab/splits/partition_assignments.csv           │ 91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1│ Bit-Exact OK │
├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼──────────────┤
│ ml_lab/data/raw/STUDENT dataset.xlsx (Dataset B)  │ Strictly Quarantined — Unread, Unmodified (19,502 bytes)         │ UNTOUCHED    │
└───────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────┴──────────────┘
```

- **Test Suite Status:** **156 checks passing (100% OK, 0 failures, 0 errors)**.
- **Git Working Tree:** Preserved without uncommitted changes or destructive actions.

---

## 7. STOP PROTOCOL & HANDOFF

- [x] Historical model contamination boundary defined: zero retrospective evaluation on new Test Vault rows.
- [x] Threshold $0.50$ explicitly defined as a predeclared engineering operating point, not a clinically validated threshold.
- [x] Automated partition assertion safeguards codified for future pipelines.
- [x] Full evaluation metric protocol (primary, secondary, ECE binning, group bootstrap) predeclared without computing metrics.
- [x] Cryptographic hashes and test suite verified passing.
- [x] **STOP Protocol Enforced:** Stage 3B.2 remains strictly unauthorized pending explicit user instructions.

**SIGN-OFF:** Stage 3B.1.3 is complete. Standing by for review.
