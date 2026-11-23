# MINDORA 2.0 — PHASE 5.17 AUDIT PLAN
## Independent ML Reproducibility, Metric Reconciliation & Dataset Governance Audit

**Auditor Roles:** Principal Machine Learning Auditor, Senior Data Scientist, Statistical Validation Specialist, Dataset Governance Researcher, Cybersecurity Engineer & Software Quality Assurance Lead  
**Audit Date:** November 16, 2026  
**Project Location:** `D:\Depression calculator`  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Phase Objective:** Independent mathematical reconciliation, script reproducibility, small-sample cross-validation verification, dataset provenance investigation, and security/privacy audit.  

---

## 1. Audit Scope & Mandate

Phase 5.17 is strictly an **AUDIT AND CORRECTION** phase.
- **Strict Invariants:**
  - Zero new ML algorithms or model additions.
  - Zero product feature expansion.
  - Zero public deployment.
  - Zero Git commits, resets, cleans, or stashes.
  - Zero modifications to the 11 frozen research assets.
  - Complete preservation of all 9 Day 12 tracked modified files and historical artifacts.

---

## 2. Documentation and Source Code Inventory for Inspection

### 2.1 Reports & Documentation Inspected:
1. `docs/experiments/PHASE_5_16_FOUR_MODEL_AND_REAL_WORLD_DATASET_REPORT.md` (Implementation and evaluation baseline)
2. `docs/models/FOUR_MODEL_COMPARISON.md` (Comparative metrics and trade-off analysis)
3. `docs/models/LARGE_DATASET_TRAINING_REPORT.md` (Track A pipeline and partition report)
4. `docs/models/REAL_WORLD_163_DATASET_REPORT.md` (Track B 163-record evaluation report)
5. `docs/models/MODEL_CARD.md` (Standardized model card)
6. `docs/models/DATASET_CARD.md` (Standardized dataset card)
7. `docs/security/AUTHENTICATION_SECURITY_REPORT.md` (Argon2id and credential security report)
8. `docs/security/GUARDIAN_NOTIFICATION_PRIVACY_REPORT.md` (Guardian privacy and consent report)

### 2.2 Implementation Files & Artifacts Inspected:
1. `scripts/train_large_dataset.py` (Track A execution pipeline)
2. `scripts/train_real_world_163.py` (Track B execution pipeline)
3. `src/preprocessing.py`, `src/training/preprocessing.py` (Tabular preprocessors)
4. `src/training/train.py`, `src/train.py` (Historical and core training routines)
5. `src/training/evaluate.py`, `src/evaluate.py` (Evaluation routines)
6. `src/training/model_factory.py` (Algorithm instantiation)
7. `src/training/pipeline.py` (Scikit-learn pipeline assembly)
8. `shared/contracts/feature_contract.json` (Frozen feature contract)
9. `local_companion/auth_manager.py` (Authentication & SQLite database manager)
10. `local_companion/service.py` (FastAPI backend endpoints)
11. `reports/large_dataset/large_dataset_metrics.json` (Track A evaluation metrics)
12. `reports/real_world_163/small_dataset_metrics.json` (Track B cross-validation metrics)
13. `frontend/src/data/modelMetricsData.ts` (Frontend compiled metrics store)
14. `frontend/src/pages/ModelLabScreen.tsx` (Model Laboratory UI)
15. `frontend/src/pages/ModelComparisonScreen.tsx` (Comparison UI)
16. `frontend/src/pages/RealWorldDatasetScreen.tsx` (Track B Lab UI)
17. `frontend/src/pages/LargeDatasetScreen.tsx` (Track A Lab UI)
18. `frontend/src/pages/GuardianSupportScreen.tsx` (Guardian UI)
19. `frontend/src/pages/ProfileSettingsScreen.tsx` (Auth UI)

---

## 3. Core Audit Procedures

### Domain 1: Metric Reconciliation & Discrepancy Investigation
- Perform an end-to-end mathematical audit of the discrepancy identified in the Phase 5.16 reports regarding XGBoost precision vs confusion matrix values.
- Verify test labels and test predictions array-by-array.
- Recompute confusion matrices ($TN, FP, FN, TP$), accuracy, precision, recall, specificity, positive F1, macro-F1, ROC-AUC, PR-AUC, and Brier scores directly from identical prediction vectors.
- Reconcile all 4 models (Logistic Regression, Random Forest, XGBoost, Support Vector Machine).

### Domain 2: Large Dataset Reproducibility & Leakage Control
- Verify row counts on `dataset/Student_Depression_Dataset.csv` ($N = 27,901$).
- Verify exact split indices (Train: 19,530, Val: 4,185, Test: 4,186).
- Audit data leakage: verify preprocessor parameters (means, variances, medians, one-hot categories) are fitted strictly on the training partition.
- Save ground truth test labels and model prediction arrays to `reports/large_dataset/` for permanent auditability.

### Domain 3: Probability Calibration & Threshold Audit
- Inspect calibration curves, Brier scores, and Platt scaling configurations.
- Explicitly evaluate whether calibration was fitted strictly in-fold or on training splits.
- Reiterate non-clinical boundaries: model probabilities reflect tabular frequency distributions, not biological risk likelihoods.

### Domain 4: 163-Record Dataset Governance & Small-Sample Statistical Validation
- Inspect `ml_lab/data/raw/STUDENT dataset.xlsx` for provenance, consent, IRB status, minor respondents, and data types.
- Maintain the mandatory label: **"163-RECORD DATASET — PROVENANCE UNVERIFIED"**.
- Audit Repeated Stratified 5-Fold Cross-Validation (25 runs).
- Audit confidence intervals and sampling variance.
- Reiterate that **NO INDEPENDENT HOLDOUT TEST SET FORMED** for the 163-record cohort.

### Domain 5: Frontend Dashboard Consistency
- Cross-check `modelMetricsData.ts` and UI screens against reconciled metrics.
- Ensure that the frontend accurately labels validation selection vs holdout test performance and never misrepresents cross-validation as an independent test set.

### Domain 6: Authentication & Guardian Privacy Audit
- Review Argon2id parameters, session token entropy, sliding-window rate limiting, and SQL parameterization.
- Review guardian consent, mock SMS isolation, and minor safeguarding boundaries.

### Domain 7: Frozen Asset Verification & Test Suite Execution
- Re-verify SHA-256 hashes of all 11 frozen research assets.
- Execute full test suites (Python unit tests, frontend unit tests, TypeScript compilation, and Vite production build).
