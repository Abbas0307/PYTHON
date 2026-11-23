# MINDORA 2.0 — STAGE 3B.1.1: PARTITION GOVERNANCE & EXECUTION AUDIT

**Document Ref:** `docs/experiments/STAGE_3B_1_1_GOVERNANCE_AUDIT.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Stage:** Stage 3B.1.1 Partition Governance and Execution Audit  
**Status:** Audit Complete — Governance Formally Enforced (**Stage 3B.2 Not Started**)  

---

## 1. EXECUTIVE SUMMARY & AUDIT PURPOSE

Following the completion of Stage 3B.1 (Controlled Experiment Initialization & Test Vault Locking), this audit was conducted to resolve methodological ambiguities, overstatements regarding Test Vault isolation, contradictory stage numbering references, and to record a forensic post-mortem of failed script executions during partition generation.

### Core Audit Outcomes:
1. **Protection Classification Reclassified:** The Test Vault status is formally reclassified from "cryptographically sealed" or "technically inaccessible" to **"governance-locked" (policy-locked)**. The underlying files are unencrypted plaintext CSV/JSON files on an NTFS filesystem; protection is enforced strictly through methodological protocol and programmatic assertion gates.
2. **Stage Numbering Contradiction Resolved:** The operational schedule across Stage 3B gates is reconciled. Development partition ($N=23,716$) access is permitted across Stages 3B.1 through 3B.5. Test Vault ($N=4,185$) access is strictly prohibited across Stages 3B.1 through 3B.5 and authorized exclusively for a single-shot evaluation in **Stage 3B.6**.
3. **Forensic Audit of Failed Executions:** Two failed execution attempts during Stage 3B.1 (both exiting with code 1 due to PowerShell double-quote stripping inside Python f-strings) were forensically audited and documented with exact root causes and verified remedies.
4. **Cryptographic Integrity Confirmed:** All SHA-256 digests for Dataset A, production model `best_model.pkl`, partition assignments CSV, and manifest JSON match expected checksums bit-for-bit. Dataset B remains strictly quarantined and unread.
5. **No Data Exposure:** Zero individual test records were inspected, and zero test-partition performance metrics were computed.

---

## 2. TEST VAULT PROTECTION CLASSIFICATION & ARTIFACT ACCESSIBILITY

An inspection of the generated artifacts in `ml_lab/splits/` was conducted to establish exactly what data is accessible and under what protection model.

### 2.1 Artifact Inspection & Information Accessibility

```
┌───────────────────────────────────────────────────┬──────────────┬──────────────────────────────────────────────────────────┐
│ Artifact Path                                     │ File Size    │ Information Accessible from Artifact                     │
├───────────────────────────────────────────────────┼──────────────┼──────────────────────────────────────────────────────────┤
│ ml_lab/splits/partition_assignments.csv           │ ~2.46 MB     │ row_index (0–27900), original id, group_id (64-char hex  │
│                                                   │              │ SHA-256), partition ('development' or 'test_vault'),     │
│                                                   │              │ fold_20 (0–19). Contains no feature values or labels.    │
├───────────────────────────────────────────────────┼──────────────┼──────────────────────────────────────────────────────────┤
│ ml_lab/splits/group_aware_partition_manifest.json │ ~3.82 KB     │ Aggregate counts, fold mapping, group counts, target     │
│                                                   │              │ distribution (prevalence), integrity verification flags, │
│                                                   │              │ and file checksums. Contains no individual records.      │
└───────────────────────────────────────────────────┴──────────────┴──────────────────────────────────────────────────────────┘
```

Because `dataset/Student_Depression_Dataset.csv` resides in the same repository, any process with filesystem read privileges could technically join `partition_assignments.csv` on `row_index` to view test feature values and labels.

### 2.2 Protection Model Classification

To ensure complete scientific and engineering accuracy, the three tiers of data isolation are distinguished:

1. **Technical Access Controls: NONE**
   - No operating system access control lists (ACLs), read-only file system permissions, or sandbox process restrictions prevent a local process or script from reading test row indices.
2. **Physical / Cryptographic Separation: NONE**
   - The test data is not stored on separate physical media, an air-gapped machine, a secure enclave, or a Hardware Security Module (HSM).
   - Neither the dataset nor the partition assignments file is encrypted at rest. Both are standard plaintext CSV files.
3. **Governance-Level Restrictions: FULLY ENFORCED (Governance-Locked)**
   - The isolation is **governance-locked** (policy-locked). Researchers, autonomous agents, and scripts are strictly bound by contractual research boundaries codified in `docs/experiments/STAGE_3B_1_TEST_VAULT_POLICY.md`.
   - Programmatic barrier: Test harnesses and training pipelines are required to assert `partition == 'development'`. Any attempt to fit, transform, or evaluate estimators on `partition == 'test_vault'` before Stage 3B.6 triggers an assertion failure.
   - Overstatements describing the vault as "cryptographically sealed" or "permanently locked" have been corrected across all project documentation.

---

## 3. RESOLUTION OF STAGE 3B GATE SCHEDULE & TEST VAULT ACCESS

A contradiction in `docs/experiments/STAGE_3B_1_TEST_VAULT_POLICY.md` (which simultaneously stated the vault was locked from 3B.2–3B.5 and accessed in 3B.5) has been reconciled with the approved gate architecture in `docs/experiments/STAGE_3A_EXECUTION_PLAN.md`.

### 3.1 Partition Access Schedule Across Gates

```
┌──────────┬─────────────────────────────────────┬──────────────────┬──────────────────┬──────────────────────────────────────────┐
│ Gate ID  │ Gate Title                          │ Development Set  │ Test Vault Set   │ Permitted Scope & Boundaries             │
│          │                                     │ (N=23,716 Rows)  │ (N=4,185 Rows)   │                                          │
├──────────┼─────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────────┤
│ GATE 3B.1│ Partition Manifest & Environment    │ READ / WRITE     │ LOCKED           │ Partition generation & env audit.        │
│          │                                     │ (Splits only)    │ (No reading)     │ Zero model training.                     │
├──────────┼─────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────────┤
│ GATE 3B.2│ Production Model Test Audit         │ READ ONLY        │ LOCKED           │ Retrospective audit of best_model.pkl    │
│          │ (Historical Split Track)            │ (Dev baseline)   │ (No reading)     │ on historical 15% split. Group 1 audit.  │
├──────────┼─────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────────┤
│ GATE 3B.3│ Tree Model Comparison (5-Fold CV)   │ FIT / EVALUATE   │ LOCKED           │ 5-fold StratifiedGroupKFold CV on dev.   │
│          │                                     │ (Outer CV Folds) │ (No reading)     │ Compare Random Forest vs XGBoost.        │
├──────────┼─────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────────┤
│ GATE 3B.4│ Probability Calibration Analysis    │ FIT / EVALUATE   │ LOCKED           │ Platt vs Isotonic calibration using      │
│          │                                     │ (Nested CV Folds)│ (No reading)     │ inner StratifiedGroupKFold generators.   │
├──────────┼─────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────────┤
│ GATE 3B.5│ Uncertainty & Candidate Freezing    │ FIT / EVALUATE   │ LOCKED           │ Group-level bootstrap on dev folds;      │
│          │                                     │ (Dev CIs only)   │ (Strictly no access) Freeze candidate architecture & params.│
├──────────┼─────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────────┤
│ GATE 3B.6│ Pre-ONNX Parity & Final Benchmark   │ READ ONLY        │ AUTHORIZED ACCESS│ Single-shot final benchmark evaluation;  │
│          │ (Final Single-Shot Vault Access)    │ (Reference)      │ (EXACTLY ONCE)   │ Pre-ONNX numerical parity checks.        │
└──────────┴─────────────────────────────────────┴──────────────────┴──────────────────┴──────────────────────────────────────────┘
```

### 3.2 Non-Negotiable Prerequisites for Stage 3B.6 Test Vault Access
Before any script or agent may access the Test Vault in Stage 3B.6, all of the following conditions must be documented and satisfied:
1. **Candidate Model Selected:** A single candidate model architecture must be finalized exclusively based on Development partition cross-validation performance.
2. **Hyperparameters Frozen:** All model hyperparameters (tree count, learning rate, max depth, subsample ratios, regularization) must be permanently frozen.
3. **Calibrator Frozen:** The probability calibration method (Platt vs Isotonic vs Raw) and calibration mapping must be completely fitted and frozen on development folds.
4. **Decision Threshold Fixed:** The operational classification threshold must be fixed at the approved $0.50$ baseline (no post-hoc threshold searching).
5. **Explicit Authorization:** Written authorization from the user must be received explicitly designating entry into Stage 3B.6.

---

## 4. FORENSIC AUDIT OF FAILED PARTITION-GENERATION EXECUTIONS

During Stage 3B.1, partition generation was executed via command line. Two initial attempts failed with exit code 1 before a subsequent clean execution succeeded. This section documents the root cause, output, and corrective action for each execution.

### 4.1 Incident 1 (Turn 4694 — Dry-Run Attempt 1)
- **Invocation Context:** Initial execution of the 20-fold `StratifiedGroupKFold` script using `.venv\Scripts\python.exe -c "..."` under Windows PowerShell.
- **Exit Code:** `1`
- **Error Output:**
  ```
  File "<string>", line 39
    f'Expected 27899 unique groups, got {df["group_id"].nunique()}'
                                            ^
  SyntaxError: unterminated string literal (detected at line 39)
  ```
- **Root Cause Analysis:** When PowerShell processes an inline Python string enclosed in double quotes (`python -c "..."`), nested double quotes inside an f-string expression (e.g. `df["group_id"]`) are unescaped by PowerShell's parser before passing the string to the Python executable. Python receives an unclosed string fragment, triggering a `SyntaxError`.
- **Corrective Action:** Replaced nested dataframe bracket indexing inside f-strings with pre-assigned local variables (e.g. `n_uniq = df['group_id'].nunique()`).

### 4.2 Incident 2 (Turn 4698 — Dry-Run Attempt 2)
- **Invocation Context:** Second dry-run execution after partial string escaping.
- **Exit Code:** `1`
- **Error Output:**
  ```
  File "<string>", line 82
    f'Development pos%: {dev_pos:.4f} ({dev_df["Depression"].sum()}/{n_dev})'
                                               ^
  SyntaxError: unterminated string literal (detected at line 82)
  ```
- **Root Cause Analysis:** A remaining nested double-quote expression `dev_df["Depression"].sum()` inside an f-string on line 82 was unescaped by PowerShell during command interpolation, resulting in a second `SyntaxError`.
- **Corrective Action:** Completely refactored all print statements in the inline script to compute scalar values into explicit variables beforehand:
  ```python
  dev_pos_sum = int(dev_df['Depression'].sum())
  test_pos_sum = int(test_df['Depression'].sum())
  ```
  All f-strings were formatted using only simple scalar variable names, completely eliminating quote nesting inside f-strings.

### 4.3 Incident 3 (Turn 4700 / Task 4700 — Dry-Run Attempt 3)
- **Invocation Context:** Execution of the fully refactored dry-run script.
- **Exit Code:** `0` (Success)
- **Verified Output:**
  - `Dataset rows: 27901`
  - `Unique groups: 27899`
  - `Development rows: 23716 (85.00%), pos%: 0.5855`
  - `Test Vault rows: 4185 (15.00%), pos%: 0.5857`
  - `Group intersection: 0`
  - `Group 1 in Development: True, in Test: False`
  - `Group 2 in Development: False, in Test: True`

### 4.4 Incident 4 (Turn 4705 / Task 4705 — Artifact Generation)
- **Invocation Context:** Execution with CSV and JSON serialization enabled.
- **Exit Code:** `0` (Success)
- **Outputs Created:** `ml_lab/splits/partition_assignments.csv` and `ml_lab/splits/group_aware_partition_manifest.json`.

---

## 5. CRYPTOGRAPHIC VERIFICATION & DATASET B QUARANTINE

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

### Git Working Tree Status:
- Branch: `mindora-2.0-rebuild`
- Unstaged tracked modifications preserved:
  * `docs/DAY_12_DATA_RETENTION_MATRIX.md`
  * `experiments/registry.json`
  * `src/privacy_policy.py`
  * `tests/test_day12_privacy_architecture.py`
- Zero Git commits executed.
- Zero Git destructive operations (reset, checkout, clean, stash) performed.

---

## 6. TEST SUITE PASS CONFIRMATION

The complete test suite was executed to ensure zero regression across the project:
- **Discovered Unit Tests (`tests/`):** 126 tests passing.
- **Model Parity Tests (`tests/model_parity/`):** 3 tests passing.
- **Engine Independence Audit (`tests/test_engine_independence.py`):** 5 checks passing.
- **Student Experience & Architecture (`tests/test_student_experience.py`):** 7 checks passing.
- **Local AI/ML Training Platform (`tests/test_training_platform.py`):** 15 checks passing.
- **Grand Total:** **156 checks passing (100% OK, 0 errors, 0 failures)**.

---

## 7. AUDIT SIGN-OFF & STOP PROTOCOL

- [x] Test Vault protection classified accurately as **governance-locked** (policy-locked).
- [x] Information accessibility from manifest CSV and JSON formally audited; no individual test records exposed.
- [x] Stage 3B gate schedule reconciled: Stages 3B.1–3B.5 development only; Stage 3B.6 single-shot test vault access.
- [x] Failed partition-generation attempts forensically documented with root causes and fixes.
- [x] Cryptographic SHA-256 digests re-verified bit-exact.
- [x] Dataset B quarantine confirmed intact.
- [x] Full test suite (156 checks) verified passing.
- [x] Git working tree preserved; zero commits made.
- [x] **STOP Protocol Enforced:** Stage 3B.2 remains strictly unauthorized pending explicit user instructions.

**AUDIT APPROVAL:** Stage 3B.1.1 is complete. Standing by for user review and subsequent instructions.
