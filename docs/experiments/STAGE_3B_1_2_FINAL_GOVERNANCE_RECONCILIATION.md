# MINDORA 2.0 — STAGE 3B.1.2: FINAL PARTITION GOVERNANCE & EVALUATION PROTOCOL CONSISTENCY

**Document Ref:** `docs/experiments/STAGE_3B_1_2_FINAL_GOVERNANCE_RECONCILIATION.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Stage:** Stage 3B.1.2 Final Partition Governance & Evaluation Protocol Consistency  
**Status:** Complete & Authoritative — **Stage 3B.2 Not Started**  

---

## 1. EXECUTIVE SUMMARY & RECONCILIATION OBJECTIVE

This document provides the final, authoritative reconciliation of data protection terminology, assertion gate enforcement mechanisms, partition-generation operational boundaries, Stage 3B gate numbering, and the non-negotiable prerequisites required prior to evaluating the held-out Test Vault.

All discrepancies identified across earlier preflight, planning, and policy documents have been audited and corrected.

---

## 2. GOVERNANCE VERSUS TECHNICAL ENFORCEMENT AUDIT

A codebase inspection was conducted across all Python modules in `src/`, `ml_lab/`, `scripts/`, and `tests/` to evaluate the actual implementation of partition-access assertion gates.

### 2.1 Inspection Findings
1. **Search Results:** A recursive scan of all Python files revealed zero existing imports or references to `ml_lab/splits/partition_assignments.csv` or `test_vault`.
2. **Current Implementation Status:**
   - There are currently **no pre-existing, background, or operating-system-level assertion hooks** enforcing partition access.
   - The assertion gate described in earlier policy documentation is a **software design contract** to be implemented in future training scripts (Stage 3B.2+), rather than an existing runtime module.
   - The only automated checks that have been executed to date were the one-off programmatic assertions in the Stage 3B.1 manifest generator (confirming completeness, row disjointness, group disjointness, and exact duplicate allocations).

### 2.2 Accurate Protection Classification
To eliminate ambiguity, the protection mechanisms are classified as follows:

```
┌───────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────┐
│ Protection Dimension                  │ Actual Technical Status & Classification                                               │
├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Technical Access Controls             │ NONE. Standard Windows NTFS filesystem permissions apply. No OS-level ACLs or sandbox │
│                                       │ process boundaries restrict reading test rows.                                         │
├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Physical / Cryptographic Isolation    │ NONE. `dataset/Student_Depression_Dataset.csv` and `partition_assignments.csv` are     │
│                                       │ unencrypted plaintext files residing on the same local storage volume.                 │
├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Automated Validation Checks           │ NOT YET IMPLEMENTED IN TRAINING CODE. Automated validation exists only in the one-off  │
│                                       │ partition generator script. Future Stage 3B.2+ pipelines are required to embed runtime │
│                                       │ assertions before ingesting data.                                                      │
├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Governance-Level Restrictions         │ FULLY ENFORCED (Governance-Locked). Bound by strict research protocols and engineering │
│                                       │ gate governance. No script, researcher, or agent may access test data during dev.      │
└───────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────┘
```

**Conclusion:** The Test Vault is accurately described as **governance-locked** (policy-locked). Claims of "technical inaccessibility," "cryptographic sealing," or "permanent locking" have been completely retracted across all project documentation.

---

## 3. THE PARTITION-GENERATION EXCEPTION SCOPE

To resolve apparent contradictions between vault locking and initial partition creation, the Test Vault Policy formally codifies the partition-generation exception:

### 3.1 Permitted During Stage 3B.1 (Bounded Exception)
During Stage 3B.1 only, the partition generation process was authorized to:
1. Parse full Dataset A ($N=27,901$) to extract the 10 approved features.
2. Generate deterministic 64-character SHA-256 group identifiers across all rows ($27,899$ unique groups).
3. Execute 20-fold `StratifiedGroupKFold` partitioning to map group IDs to Development ($85\%$) and Test Vault ($15\%$).
4. Persist `ml_lab/splits/partition_assignments.csv` and `ml_lab/splits/group_aware_partition_manifest.json`.
5. Verify aggregate counts ($N_{\text{dev}}=23,716$, $N_{\text{test}}=4,185$), positive prevalence ($58.55\%$ vs $58.57\%$), and zero group intersection ($0$ shared groups).

### 3.2 Strictly Prohibited Post-Partition Generation (Stages 3B.1.1 through 3B.5)
Immediately upon generation of the manifest artifacts, the Test Vault became strictly governance-locked. Across Stages 3B.1.1, 3B.1.2, 3B.2, 3B.3, 3B.4, and 3B.5:
- **Prohibited:** Inspecting individual test records (features, IDs, or labels).
- **Prohibited:** Fitting or training any estimator, model, pipeline, or calibrator on test records.
- **Prohibited:** Generating test predictions.
- **Prohibited:** Selecting features, architectures, or hyperparameters using test outcomes.
- **Prohibited:** Calculating evaluation metrics (accuracy, F1, ROC-AUC, Brier score, ECE) on test records.

The final evaluation stage (**Stage 3B.6**) remains the **single stage permitted to inspect test outcomes and compute test performance metrics**.

---

## 4. SYNCHRONIZED STAGE 3B EXECUTION SCHEDULE

The Stage 3B gate schedule has been synchronized across `docs/experiments/STAGE_3A_EXECUTION_PLAN.md`, `docs/experiments/STAGE_3B_1_TEST_VAULT_POLICY.md`, `docs/experiments/STAGE_3B_1_PARTITION_MANIFEST.md`, and `docs/experiments/STAGE_3B_1_1_GOVERNANCE_AUDIT.md`.

All references assigning final test vault evaluation to Stage 3B.5 have been corrected.

```
┌──────────┬─────────────────────────────────────┬──────────────────┬──────────────────┬──────────────────────────────────────────┐
│ Stage ID │ Stage Title                         │ Development Set  │ Test Vault Set   │ Status & Operational Scope               │
│          │                                     │ (N=23,716 Rows)  │ (N=4,185 Rows)   │                                          │
├──────────┼─────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────────┤
│ 3B.1     │ Environment & Partition Generation  │ Generated        │ Generated        │ COMPLETE. Environment verified; group-   │
│          │                                     │ (Splits only)    │ (Locked)         │ aware manifest and assignments exported. │
├──────────┼─────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────────┤
│ 3B.1.1–  │ Governance Audits & Reconciliation  │ Read-only        │ LOCKED           │ COMPLETE. Reclassified protection;       │
│ 3B.1.2   │                                     │ (Manifest audit) │ (No access)      │ resolved numbering; codified prerequisites│
├──────────┼─────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────────┤
│ 3B.2     │ Baseline Model Experiments          │ FIT / EVALUATE   │ LOCKED           │ UNAUTHORIZED (Pending user instruction). │
│          │                                     │ (Dev folds)      │ (Strictly locked)│ Dummy & Logistic Regression; best_model  │
│          │                                     │                  │                  │ historical split audit track.            │
├──────────┼─────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────────┤
│ 3B.3     │ Controlled Model Comparisons        │ FIT / EVALUATE   │ LOCKED           │ UNAUTHORIZED. 5-Fold outer CV on Dev;    │
│          │                                     │ (5-Fold Outer CV)│ (Strictly locked)│ Random Forest vs XGBoost comparison.     │
├──────────┼─────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────────┤
│ 3B.4     │ Group-Aware Probability Calibration │ FIT / EVALUATE   │ LOCKED           │ UNAUTHORIZED. Platt vs Isotonic via      │
│          │                                     │ (Nested Inner CV)│ (Strictly locked)│ precomputed inner StratifiedGroupKFold.  │
├──────────┼─────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────────┤
│ 3B.5     │ Final Model & Protocol Freeze       │ FIT / EVALUATE   │ LOCKED           │ UNAUTHORIZED. Development uncertainty &  │
│          │                                     │ (Dev folds only) │ (STRICTLY LOCKED)│ bootstrap CIs; freeze candidate & params.│
├──────────┼─────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────────┤
│ 3B.6     │ Single-Shot Final Test Evaluation   │ READ ONLY        │ AUTHORIZED ACCESS│ UNAUTHORIZED. Evaluates frozen model on  │
│          │ & Pre-ONNX Parity Audit             │ (Baseline ref)   │ (EXACTLY ONCE)   │ Test Vault once; 1,000 group bootstrap.  │
└──────────┴─────────────────────────────────────┴──────────────────┴──────────────────┴──────────────────────────────────────────┘
```

---

## 5. MANDATORY PREREQUISITES FOR STAGE 3B.6 ENTRY

Stage 3B.6 execution cannot commence until all eight of the following prerequisites are documented, verified, and signed off in Stage 3B.5:

1. **Candidate Architecture Selected:** A single candidate model architecture is selected exclusively using Development partition cross-validation performance.
2. **Hyperparameters Frozen:** All candidate hyperparameters (estimator count, tree depth, learning rate, subsample ratios, regularization) are permanently frozen.
3. **Preprocessing Frozen:** Preprocessing transformations (imputer medians, encoders, scalers) are fixed and fitted strictly on development folds.
4. **Calibration Method & Mapping Frozen:** The calibration method (Platt vs Isotonic vs Raw) and fitted calibrator mapping are frozen using inner development cross-validation.
5. **Decision Threshold Predeclared with Rationale:** The operational classification threshold is fixed at $0.50$ in advance as a predeclared engineering operating point, not a clinically validated or clinically optimal threshold. **Threshold tuning or searching against the Test Vault is strictly prohibited.**
6. **Primary & Secondary Metrics Predeclared:**
   - *Primary Metric:* ROC-AUC.
   - *Secondary Metrics:* Brier Score, Expected Calibration Error (ECE), Accuracy, Balanced Accuracy, Macro F1-Score, Precision, Recall, Specificity.
7. **Group-Level Bootstrap Procedure Specified:** The exact test bootstrap protocol is codified: $1,000$ iterations, resampling strictly from the $4,184$ unique groups assigned to the Test Vault with replacement, intact rows and observed labels kept together, zero Development groups included, master random seed $42$.
8. **Explicit User Authorization:** Written authorization is provided by the user specifically authorizing the single-shot unlocking and evaluation of Stage 3B.6.

---

## 6. CRYPTOGRAPHIC INTEGRITY VERIFICATION

Cryptographic SHA-256 digests of all foundational data files, production models, and partition artifacts were computed and verified:

```
┌───────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────┬──────────────┐
│ File Path                                         │ SHA-256 Cryptographic Digest                                     │ Verification │
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
- **Git Working Tree Status:** Zero commits made. Zero destructive operations performed. Working directory preserved.

---

## 7. STOP PROTOCOL & HANDOFF

- [x] Governance versus technical enforcement verified and documented.
- [x] Partition-generation exception explicitly defined and bounded.
- [x] Stage 3B numbering and Test Vault access schedule fully synchronized across all documents.
- [x] Eight mandatory prerequisites for Stage 3B.6 evaluation codified.
- [x] Hash integrity re-verified bit-exact.
- [x] **STOP Protocol Enforced:** Stage 3B.2 remains strictly unauthorized pending explicit user instructions.

**SIGN-OFF:** Stage 3B.1.2 is complete. Standing by for review.
