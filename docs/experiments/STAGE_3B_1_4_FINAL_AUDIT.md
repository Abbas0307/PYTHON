# MINDORA 2.0 — STAGE 3B.1.4: FINAL HISTORICAL PROVENANCE, BOOTSTRAP & GIT AUDIT

**Document Ref:** `docs/experiments/STAGE_3B_1_4_FINAL_AUDIT.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Stage:** Stage 3B.1.4 Final Historical Provenance, Bootstrap & Git Audit  
**Status:** Audit Complete & Verified — **Stage 3B.2 Not Started**  

---

## 1. EXECUTIVE SUMMARY & AUDIT OBJECTIVE

This document records the final audit corrections for Stage 3B.1 prior to any authorized entry into Stage 3B.2.

Specifically, this audit:
1. Clarifies that historical model training overlap with the new Test Vault is a **theoretical statistical expectation under randomized allocation, not an empirically measured or confirmed count**.
2. Formally reconciles **group-bootstrap membership** between Development and the Test Vault based on the authoritative partition manifest.
3. Provides the **complete mathematical formulation of Expected Calibration Error (ECE)**, including empty-bin handling, boundary closure, and methodological limitations.
4. Records the **exact output of `git status --short --branch`** and verifies complete preservation of the working tree.
5. Re-verifies all foundational **cryptographic SHA-256 hashes** and confirms the quarantine of Dataset B.

---

## 2. HISTORICAL OVERLAP TERMINOLOGY & CONSERVATIVE RESTRICTIONS

### 2.1 Theoretical Expectation vs. Measured Overlap
Earlier draft reports noted that approximately $70\%$ ($\approx 2,930$ rows) of the new Test Vault were present in the historical training set of `models/best_model.pkl`.

This audit establishes the precise methodological status of that statement:
1. **Theoretical Expectation Only:** The $70\%$ overlap figure is derived strictly from a theoretical statistical assumption: when an initial partition assigns $70\%$ of rows at random to training, and an independent subsequent partition assigns $15\%$ of rows to a holdout vault, the expected intersection is $0.70 \times N_{\text{vault}}$.
2. **Not Empirically Measured:** This overlap has **NOT** been empirically counted or verified by cross-referencing individual row indices between the historical split and the new vault.
3. **No Confirmed Row Count:** The figure of $\approx 2,930$ rows must **NEVER** be described as an empirically confirmed count of historical training records.
4. **No Vault Inspection Permitted:** An empirical count cannot and must not be conducted during development because doing so would require inspecting the row identities and memberships of the locked Test Vault.

### 2.2 Preservation of the Conservative Rule
Regardless of the unmeasured exact count, the existence of theoretical training set overlap mandates a non-negotiable conservative boundary:
- **Zero Test Vault Evaluation:** The historical production model `models/best_model.pkl` must **NEVER** be evaluated on records belonging to the new Test Vault ($N=4,185$).
- **Zero New Test Metrics:** No new predictions, loss values, or performance metrics may be computed for `best_model.pkl` on the new Test Vault.
- **Original Provenance Mandate:** Historical performance metrics ($79.69\%$ accuracy / $0.8676$ ROC-AUC from `training_report.txt`; $79.48\%$ accuracy / $0.8667$ ROC-AUC from `registry.json`) may only be quoted with their original historical split provenance. They must **never** be presented as independent group-aware evaluation results.
- **Permitted Introspection:** Introspection of `best_model.pkl` is strictly limited to inspecting its architecture, preprocessing transformers, encodings, and hyperparameters.

---

## 3. GROUP-BOOTSTRAP MEMBERSHIP RECONCILIATION

The approved partition manifest (`ml_lab/splits/group_aware_partition_manifest.json` and `partition_assignments.csv`) establishes the exact distribution of multi-row feature groups across partitions:

```
┌───────────────────────────────────────┬─────────────────────────────┬────────────────────────────────────────────────────────┐
│ Group Identifier                      │ Assigned Partition          │ Composition & Target Label Properties                  │
├───────────────────────────────────────┼─────────────────────────────┼────────────────────────────────────────────────────────┤
│ Group 1 (Rows 902 & 8257)             │ Development Partition Only  │ Conflicting labels: Row 902 (y=1), Row 8257 (y=0)       │
│ Group 2 (Rows 1818 & 11156)           │ Test Vault Partition Only   │ Concordant labels: Row 1818 (y=1), Row 11156 (y=1)     │
└───────────────────────────────────────┴─────────────────────────────┴────────────────────────────────────────────────────────┘
```

### 3.1 Final Test Vault Group-Stratified Bootstrap Protocol (Stage 3B.6)
The bootstrap uncertainty procedure for the final single-shot Test Vault evaluation in Stage 3B.6 must strictly adhere to the following approved group-stratified specification:
1. **Resampling Population:** Resample **strictly from the $4,184$ unique groups assigned to the Test Vault** in `partition_assignments.csv` ($4,183$ singleton groups and $1$ two-row group [Group 2]).
2. **Stratification Unit:** **Stratify by the predeclared group-level label classification** across the Test Vault groups to maintain exact class-prevalence proportions across bootstrap iterations.
3. **Zero Development Inclusion:** Groups assigned to the Development partition (including Group 1 with its conflicting labels) are **strictly excluded** and never sampled.
4. **Cluster & Label Preservation:** When a unique feature group is sampled with replacement, all intact rows and observed labels belonging to that group are preserved together in the bootstrap replicate.
   - For Group 2 (Rows 1818 and 11156), both concordant positive rows ($y=1, y=1$) are always kept together.
5. **Iterations & Pinned Seed:** Exactly $1,000$ bootstrap iterations executed deterministically with master random seed $42$.
6. **Confidence Interval Estimation:** Computed via the empirical percentile method:
   $$\text{CI}_{95\%} = \left[ \hat{\theta}_{2.5\%}, \; \hat{\theta}_{97.5\%} \right]$$
7. **No Current Inspection:** Zero individual Test Vault records were inspected, and zero bootstrap metrics were computed during this audit.

---

## 4. MATHEMATICAL FORMULATION & METHODOLOGICAL DEFINITION OF ECE

To ensure rigorous calibration assessment during future experimental stages (Stages 3B.4, 3B.5, and 3B.6), Expected Calibration Error (ECE) is formally defined:

### 4.1 Bin Partitioning & Boundary Closure
The continuous probability space $[0.0, 1.0]$ is partitioned into $M = 10$ equal-width bins:
$$B_m = \left[\frac{m-1}{10}, \; \frac{m}{10}\right) \quad \text{for } m \in \{1, 2, \dots, 9\}$$
$$B_{10} = [0.9, \; 1.0] \quad (\text{closed on both ends to include predicted probabilities equal to } 1.0)$$

### 4.2 Mathematical Formulation
$$\text{ECE} = \sum_{m=1}^{10} \frac{n_m}{N} \left| \text{conf}(B_m) - \text{acc}(B_m) \right|$$

Where:
- $N$ is the total number of observations evaluated.
- $n_m$ is the number of observations in bin $m$ (that is, the count of samples with predicted probability $\hat{p}_i \in B_m$).
- $\text{conf}(B_m)$ is the average predicted confidence (probability) within bin $m$:
  $$\text{conf}(B_m) = \frac{1}{n_m} \sum_{i \in B_m} \hat{p}_i$$
- $\text{acc}(B_m)$ is the empirical positive-class frequency within bin $m$:
  $$\text{acc}(B_m) = \frac{1}{n_m} \sum_{i \in B_m} y_i$$
- **Positive Class:** $y=1$, representing self-reported affirmative depression from the survey response.

### 4.3 Empty-Bin Handling
If no predicted probabilities fall into a particular bin $B_m$ ($n_m = 0$):
- The bin contributes exactly $0$ to the overall summation ($\frac{0}{N} \times |\dots| = 0$).
- Evaluation code must guard against division by zero by verifying $n_m > 0$ before computing $\text{conf}(B_m)$ and $\text{acc}(B_m)$.

### 4.4 Methodological Limitations of ECE
1. **Binning Sensitivity:** ECE values vary significantly depending on the bin count $M$ and whether bins are equal-width or equal-frequency (quantile-based).
2. **Hidden Internal Mismatch:** Within any individual bin, opposing calibration errors can cancel out, concealing non-monotonic calibration behavior.
3. **Incomplete Assessment:** ECE is a scalar summary and does not fully describe probability calibration. It must always be evaluated alongside:
   - **Brier Score:** Proper scoring rule penalizing both miscalibration and lack of refinement.
   - **Calibration Slope & Intercept:** Assessing systemic under- or over-confidence via logistic regression on log-odds.
   - **Graphical Reliability Curves:** Visual curves depicting empirical accuracy across confidence intervals.
4. **Prohibition:** Zero ECE calculations were executed during this audit.

---

## 5. GIT WORKING TREE STATUS RECONCILIATION

The exact output of `git status --short --branch` was executed and recorded:

```
## mindora-2.0-rebuild
 M docs/DAY_12_DATA_RETENTION_MATRIX.md
 M experiments/registry.json
 M src/privacy_policy.py
 M tests/test_day12_privacy_architecture.py
?? docs/architecture/
?? docs/data/
?? docs/experiments/
?? docs/operations/
?? docs/privacy/
?? docs/research/
?? experiments/models/exp_20261115_002550_logistic_r.pkl
?? experiments/models/exp_20261115_002551_baseline_m.pkl
?? experiments/models/exp_20261115_003039_baseline_m.pkl
?? experiments/models/exp_20261115_003039_logistic_r.pkl
?? experiments/models/exp_20261115_004441_baseline_m.pkl
?? experiments/models/exp_20261115_004441_logistic_r.pkl
?? experiments/models/exp_20261115_005144_baseline_m.pkl
?? experiments/models/exp_20261115_005144_logistic_r.pkl
?? experiments/models/exp_20261115_005725_baseline_m.pkl
?? experiments/models/exp_20261115_005725_logistic_r.pkl
?? experiments/models/exp_20261115_010231_baseline_m.pkl
?? experiments/models/exp_20261115_010231_logistic_r.pkl
?? experiments/models/exp_20261115_010809_baseline_m.pkl
?? experiments/models/exp_20261115_010809_logistic_r.pkl
?? experiments/models/exp_20261115_011353_baseline_m.pkl
?? experiments/models/exp_20261115_011353_logistic_r.pkl
?? experiments/models/exp_20261115_012029_baseline_m.pkl
?? experiments/models/exp_20261115_012029_logistic_r.pkl
?? experiments/models/exp_20261115_012633_logistic_r.pkl
?? experiments/models/exp_20261115_012634_baseline_m.pkl
?? experiments/models/exp_20261115_013446_baseline_m.pkl
?? experiments/models/exp_20261115_013446_logistic_r.pkl
?? experiments/models/exp_20261115_015711_baseline_m.pkl
?? experiments/models/exp_20261115_015711_logistic_r.pkl
?? experiments/models/exp_20261115_015949_baseline_m.pkl
?? experiments/models/exp_20261115_015949_logistic_r.pkl
?? experiments/models/exp_20261115_020336_baseline_m.pkl
?? experiments/models/exp_20261115_020336_logistic_r.pkl
?? experiments/models/exp_20261115_021549_logistic_r.pkl
?? experiments/models/exp_20261115_021550_baseline_m.pkl
?? experiments/models/exp_20261115_021550_logistic_r.pkl
?? experiments/models/exp_20261115_022046_baseline_m.pkl
?? experiments/models/exp_20261115_022046_logistic_r.pkl
?? ml_lab/
?? resources/
?? scripts/generate_fixtures.py
?? shared/
?? tests/model_parity/
```

### Reconciliation Findings:
1. **Tracked Uncommitted Modifications (4 files):**
   - `docs/DAY_12_DATA_RETENTION_MATRIX.md`
   - `experiments/registry.json`
   - `src/privacy_policy.py`
   - `tests/test_day12_privacy_architecture.py`
   - These 4 files remain in their modified state from Day 12 / Stage 3A preflight and have not been altered or staged.
2. **Untracked Directories:**
   - All newly generated experiment documentation (`docs/experiments/`), architectures, split manifests (`ml_lab/splits/`), and experiment pickle artifacts remain untracked.
3. **No Operations Performed:**
   - Zero Git commits were executed.
   - Zero destructive Git operations (reset, checkout, clean, stash) were executed.

---

## 6. CRYPTOGRAPHIC INTEGRITY VERIFICATION

Cryptographic SHA-256 digests were re-verified across all core data and model files using `Get-FileHash`:

```
┌───────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────┬──────────────┐
│ File Path                                         │ Audited SHA-256 Cryptographic Checksum                           │ Verification │
├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼──────────────┤
│ dataset/Student_Depression_Dataset.csv            │ A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404│ Bit-Exact OK │
│ models/best_model.pkl                             │ E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC│ Bit-Exact OK │
│ ml_lab/splits/group_aware_partition_manifest.json │ A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070│ Bit-Exact OK │
│ ml_lab/splits/partition_assignments.csv           │ 91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1│ Bit-Exact OK │
├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼──────────────┤
│ ml_lab/data/raw/STUDENT dataset.xlsx (Dataset B)  │ Strictly Quarantined — Unread, Unmodified (19,502 bytes)         │ UNTOUCHED    │
└───────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────┴──────────────┘
```

- **Project Test Suite Status:** **156 checks passing (100% OK, 0 errors, 0 failures)**.
- **Quarantine Confirmation:** Dataset B (`ml_lab/data/raw/STUDENT dataset.xlsx`) remains completely unread, unparsed, and quarantined.

---

## 7. STOP PROTOCOL & HANDOFF

- [x] Historical overlap terminology corrected: theoretical randomized expectation, not empirically measured or confirmed count.
- [x] Group-bootstrap membership reconciled: Group 1 in Development only; Test Vault bootstrap resamples strictly from the 4,184 vault groups (including Group 2).
- [x] Complete ECE mathematical definition codified with empty-bin handling and limitations.
- [x] Exact `git status --short --branch` output recorded and reconciled.
- [x] All file checksums and Dataset B quarantine verified.
- [x] **STOP Protocol Enforced:** Stage 3B.2 remains strictly unauthorized pending explicit user instructions.

**SIGN-OFF:** Stage 3B.1.4 is complete. Standing by for review.
