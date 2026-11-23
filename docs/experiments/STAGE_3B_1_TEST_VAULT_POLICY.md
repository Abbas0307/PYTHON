# MINDORA 2.0 — STAGE 3B.1: TEST VAULT PROTECTION & ACCESS POLICY

**Document Ref:** `docs/experiments/STAGE_3B_1_TEST_VAULT_POLICY.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Stage:** Stage 3B.1 Test Vault Locking & Governance  
**Status:** In Effect — **Test Vault Formally Governance-Locked**  

---

## 1. PURPOSE & PRINCIPLE OF VAULT ISOLATION

In machine learning research, test set contamination (data leakage, post-hoc threshold tuning, or model selection against holdout metrics) produces artificially inflated performance claims that fail to generalize.

To guarantee that Mindora 2.0's engineering benchmarks remain scientifically valid and reproducible, the **$15\%$ holdout partition ($N=4,185$ rows, $4,184$ groups) is designated as the Final Test Vault**.

This policy codifies strict, non-negotiable operational boundaries governing the Test Vault throughout all subsequent model development stages.

---

## 2. NON-NEGOTIABLE TEST VAULT ACCESS RULES & EXCEPTION SCOPE

### 2.1 The Stage 3B.1 Partition-Generation Exception
During Stage 3B.1 (and Stage 3B.1 only), the partition generation script was granted a strictly bounded operational exception:
- **Permitted during Stage 3B.1:**
  1. Processing full Dataset A records ($N=27,901$) strictly to extract normalized 10-feature signatures, compute 64-character SHA-256 group identifiers, and enumerate distinct groups ($27,899$).
  2. Executing 20-fold `StratifiedGroupKFold` partitioning to map group IDs to Development ($85\%$, Folds 3–19) and Test Vault ($15\%$, Folds 0–2).
  3. Generating and persisting the partition assignments file `ml_lab/splits/partition_assignments.csv` and manifest `ml_lab/splits/group_aware_partition_manifest.json`.
  4. Verifying aggregate partition counts ($N_{\text{dev}}=23,716$, $N_{\text{test}}=4,185$), positive class prevalence ($58.55\%$ vs $58.57\%$), and zero cross-partition group intersection.

### 2.2 Strict Prohibitions Following Partition Generation
Immediately following the completion of Stage 3B.1 partition generation, the Test Vault became strictly **governance-locked**. Across all subsequent development stages (Stages 3B.1.1, 3B.1.2, 3B.2, 3B.3, 3B.4, 3B.5), the following activities are strictly prohibited:
1. **Zero Individual Record Inspection:** Researchers and automated agents are strictly prohibited from inspecting individual row features, IDs, target labels, or error cases belonging to the Test Vault.
2. **Zero Training Ingestion:** No algorithm, estimator, pipeline, or calibrator may fit, train, or update weights using Test Vault observations.
3. **Zero Preprocessing Leakage:** Preprocessing transformations (imputation medians, standard scaling parameters, one-hot encoding vocabularies) must be fitted **strictly on training fold partitions**. Zero preprocessing statistics may be learned from the Test Vault.
4. **Zero Feature Selection:** Feature importance rankings and feature pruning decisions must be determined exclusively within the Development partition.
5. **Zero Model Architecture Selection:** Candidate architecture comparisons (e.g. Logistic Regression vs. Random Forest vs. XGBoost) must be decided strictly on Development cross-validation performance.
6. **Zero Hyperparameter Tuning:** Tree depth, learning rates, subsampling ratios, and regularization penalties must not be tuned or selected against Test Vault metrics.
7. **Zero Decision Threshold Optimization:** Classification thresholds must never be tuned or adjusted against Test Vault predictions.
8. **Zero Probability Calibration:** Platt scaling (sigmoid) and Isotonic regression calibrators must be fitted strictly inside inner development cross-validation folds.
9. **Zero Prediction or Metric Calculation:** Generating test predictions or calculating test evaluation metrics (accuracy, ROC-AUC, Brier score, ECE) prior to authorized Stage 3B.6 execution is forbidden.

The final evaluation stage (**Stage 3B.6**) remains the **only stage permitted to inspect test outcomes and compute test performance metrics**.

---

## 3. DEVELOPMENT PARTITION BOUNDARIES

All model exploration, training, validation, probability calibration, and sensitivity analyses must occur **exclusively within the Development Partition ($N=23,716$ rows, $23,715$ groups)**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              DEVELOPMENT PARTITION BOUNDARY                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Total Rows Available for Development: 23,716 rows (85.001%)                            │
│ Total Feature Groups: 23,715 unique groups                                             │
│ Target Distribution: 13,885 Depressed (58.55%) / 9,831 Non-Depressed (41.45%)         │
│ Cross-Validation Harness: 5-Fold StratifiedGroupKFold (random_state=42)                │
│ Inner Calibration Harness: Precomputed inner StratifiedGroupKFold generators (cv=5)    │
│ Conflicting Labels Handled: Group 1 (both Rows 902 and 8257) contained in Dev          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Operational Rules for Stage 3B Execution:
- **Stage 3B.1 (Environment & Partition Generation):**
  * Environment and dependency audit completed. Group-aware partition manifest generated and verified under bounded exception. Zero model training. Zero Test Vault access.
- **Stage 3B.1.1 & 3B.1.2 (Governance, Reconciliation & Documentation Audits):**
  * Audit verification of partition governance, gate synchronization, and execution boundaries. Zero code execution against test data.
- **Stage 3B.2 (Baseline Model Experiments & Historical Model Audit):**
  * Train and baseline evaluations (Dummy and Logistic Regression) operate strictly within Development folds ($N=23,716$).
  * The production model artifact `models/best_model.pkl` is inspected strictly for architecture, preprocessing transformers, and historical provenance.
  * Under an independent randomized 70% row-allocation assumption, the expected overlap between the historical training set and the new Test Vault is approximately 70% (theoretical expectation, not empirically measured or confirmed row count). Regardless of exact count, **evaluating `best_model.pkl` on the new Test Vault is strictly prohibited as it would risk evaluating on historical training data**.
  * No retrospective performance evaluation may use records belonging to the new Test Vault.
  * No new performance metrics may be calculated on the new Test Vault.
  * Historical metrics ($79.69\%$ and $79.48\%$) must never be presented as independent group-aware evaluation results.
  * Zero Test Vault access.
- **Stage 3B.3 (Controlled Model Comparisons):**
  * 5-fold outer `StratifiedGroupKFold` cross-validation operates strictly on the $23,716$ development rows.
  * Compare tree architectures (Random Forest vs XGBoost) purely on development cross-validation metrics.
  * Zero Test Vault access.
- **Stage 3B.4 (Group-Aware Probability Calibration):**
  * Platt scaling vs. Isotonic regression calibration is evaluated strictly on outer development validation folds via nested inner cross-validation.
  * Zero Test Vault access.
- **Stage 3B.5 (Final Model & Evaluation Protocol Freeze):**
  * Uncertainty quantification and group-level bootstrap confidence intervals computed strictly on development validation folds.
  * Selection of single best model candidate.
  * Formal freezing of model architecture, hyperparameters, preprocessing pipeline, calibrator, and decision threshold (predeclared engineering operating point $0.50$).
  * **Strictly PROHIBITED from accessing the Test Vault.**
- **Stage 3B.6 (Single-Shot Final Test Evaluation & Pre-ONNX Parity):**
  * The single final frozen candidate model selected from Stage 3B.5 is evaluated on the Test Vault **exactly once**.
  * Pre-ONNX numerical parity checks conducted.

### 3.2 Mandatory Prerequisites for Stage 3B.6 Test Vault Access
Stage 3B.6 execution cannot begin until all eight of the following conditions are satisfied and documented:
1. **Candidate Architecture Selected:** A single candidate architecture is chosen exclusively based on Development partition cross-validation performance.
2. **Hyperparameters Frozen:** All hyperparameters (tree count, learning rate, tree depth, subsample ratio, regularization) are permanently frozen.
3. **Preprocessing Frozen:** Preprocessing pipeline (imputation strategy, categorical encoding, scaling) is fully defined and frozen on training folds.
4. **Calibration Method & Mapping Frozen:** Chosen calibration method (Platt vs Isotonic vs Raw) and calibration mapping parameters are fitted and frozen using inner development folds.
5. **Decision Threshold Predeclared with Rationale:** The operational classification threshold ($0.50$) is fixed in advance as a predeclared engineering operating point, not a clinically validated or clinically optimal threshold. Threshold optimization or tuning against the Test Vault is strictly prohibited.
6. **Primary & Secondary Metrics Predeclared:** Primary metric (ROC-AUC) and secondary metrics (Brier score, ECE, Accuracy, Balanced Accuracy, Precision, Recall, Specificity, F1) are formally fixed.
7. **Group-Stratified Bootstrap Procedure Specified:** Resampling protocol ($1,000$ iterations, resampling strictly from the $4,184$ unique groups assigned to the Test Vault with replacement, stratified by the predeclared group-level label classification, intact rows and observed labels kept together, zero Development groups included, fixed random seed 42) is codified.
8. **Explicit Authorization:** Written authorization from the user is provided specifically authorizing entry into Stage 3B.6.

---

## 4. PROTECTION CLASSIFICATION & ENFORCEMENT MECHANISM

### 4.1 Protection Classification Distinction
It is critical to distinguish between three levels of data protection:
1. **Technical Access Controls: NONE**
   - The host operating system (Windows 11 NTFS) does not enforce file access control lists (ACLs), process permissions, or filesystem sandboxing that prevent read access to test rows.
2. **Physical / Cryptographic Separation: NONE**
   - `dataset/Student_Depression_Dataset.csv` and `ml_lab/splits/partition_assignments.csv` reside on the standard filesystem as unencrypted, plaintext CSV files. Test records are not stored on separate physical media, an air-gapped machine, or an encrypted HSM vault.
3. **Governance-Level Restrictions: FULLY ENFORCED (Governance-Locked)**
   - The Test Vault isolation is **governance-locked** (policy-locked). Researchers, scripts, and autonomous agents are contractually, procedurally, and ethically bound by the approved protocol (`STAGE_3A_EXECUTION_PLAN.md`, `STAGE_3B_1_TEST_VAULT_POLICY.md`) to never read, preprocess, train, predict, or evaluate on test partition rows until authorized single-shot evaluation in Stage 3B.6.

### 4.2 Status of Automated Assertion Gates:
1. **Current State:** The assertion gate is currently a **mandated software design specification**, not a pre-existing standing background hook or filesystem driver. At this stage, no active training code exists in `ml_lab/` that accesses the partition file.
2. **Mandatory Implementation Requirement for Stage 3B.2+:** Every future training, cross-validation, and calibration script created in Stages 3B.2 through 3B.5 must explicitly load `ml_lab/splits/partition_assignments.csv` and assert:
   ```python
   assert (partition_df.loc[train_indices, 'partition'] == 'development').all()
   assert (partition_df.loc[val_indices, 'partition'] == 'development').all()
   assert 'test_vault' not in partition_df.loc[active_indices, 'partition'].values
   ```
   Any script violating this assertion will immediately terminate with an `AssertionError`.
3. **Registry Enforcement:** All intermediate experiment runs logged to `experiments/registry.json` must record `evaluated_partition: "development_cv"`. Any run logging test metrics during Stages 3B.1–3B.5 will be rejected.

---

**VAULT LOCK SIGN-OFF:** The Final Test Vault is certified **governance-locked**. Development activities (Stages 3B.1 through 3B.5) are strictly confined to the Development Partition. Test Vault evaluation is deferred exclusively to Stage 3B.6 under explicit authorization.
