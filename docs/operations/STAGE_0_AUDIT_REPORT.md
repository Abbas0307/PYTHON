# MINDORA 2.0 — STAGE 0 AUDIT REPORT
## Existing Project Audit, Safe Scaffolding & Migration Foundation

**Document Version:** 1.0.0  
**Date:** November 15, 2026  
**Auditor / Architect:** Senior AI/ML Architect, Full-Stack Engineer, Data Engineer & Quality Lead  
**Active Git Branch:** `mindora-2.0-rebuild`  
**Base Commit:** `06ffb77` (`docs(privacy): Day 12 personalization and consent architecture`)  
**Project Directory:** `D:\Depression calculator`  

---

## Executive Summary

Stage 0 of the **Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform** restructuring is complete. 

In strict adherence to the Non-Negotiable Safety Rules:
- The entire existing repository was audited without modifying, overwriting, or deleting any legacy files.
- The production model checksum was independently verified.
- The dataset dimensions, SHA-256, and target distribution were verified.
- Preprocessing and feature encodings were extracted from the saved pipeline.
- All 153 existing tests were executed and confirmed 100% passing.
- The new development branch `mindora-2.0-rebuild` was initialized.
- Scaffolding directories, shared contracts, benchmark test fixtures, and architectural blueprints were created without touching the operational Streamlit app.

---

## 1. Original Project Architecture [VERIFIED]

The existing Mindora platform is a Python-based monolithic Streamlit web application operating under a **Tri-Engine Independence Architecture**:

```
[app.py (Streamlit Application Entry Point)]
  │
  ├── src/views/ (Modular View Controllers)
  │     ├── student_dashboard.py   (Stage 1: UNDERSTAND - Onboarding & Hub)
  │     ├── assessment.py          (Stage 2: DISCOVER - 5-Tab Questionnaire)
  │     ├── insights.py            (Stage 2: DISCOVER - Tri-Engine Results & SHAP)
  │     ├── wellness_planner.py    (Stage 3: ACT - Daily Micro-Habit Selection)
  │     ├── progress_view.py       (Stage 4: IMPROVE - Session Milestones)
  │     ├── methodology_view.py    (Scientific Methodology & Transparency)
  │     └── training_lab_view.py   (Local Model Training Lab & Registry)
  │
  ├── src/ (Core Processing Modules)
  │     ├── predict.py             (Engine 1: Calibrated ML Inference & SHAP)
  │     ├── recommendations.py     (Engine 2 Lifestyle & Engine 3 PHQ-9 Screener)
  │     ├── session_utils.py       (In-Memory st.session_state Sanitization & Reset)
  │     └── ui_theme.py            (CSS Styling, Stepper, Reusable Cards)
  │
  └── .streamlit/config.toml       (Headless, zero-telemetry, XSRF protection)
```

---

## 2. Current Working Functionality [VERIFIED]

The application executes cleanly with zero runtime errors:
- **Server Status:** Running on `http://localhost:8501` (`HTTP 200 OK` verified via `_stcore/health`).
- **Student Flow:** The 4-stage student journey (`UNDERSTAND → DISCOVER → ACT → IMPROVE`) is fully functional.
- **Engine Segregation:** Engine 1 (Survey ML), Engine 2 (Lifestyle Analytics), and Engine 3 (PHQ-9 Screener) operate with strict independence.
- **Crisis Hotlines:** Multi-jurisdiction crisis helplines (India, UK devolved nations, US/Canada) function reliably.
- **Session Ephemerality:** All student data is stored strictly in server-side `st.session_state` and purges completely upon session reset.

---

## 3. Exact Dataset Inventory & Provenance [VERIFIED]

| Property | Value | Verification Method |
|---|---|---|
| **File Path** | `dataset/Student_Depression_Dataset.csv` | File system inspection |
| **SHA-256 Fingerprint** | `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` | Cryptographic SHA-256 |
| **File Size on Disk** | 2,807,716 bytes (~2.68 MB) | Windows NTFS byte count |
| **Dimensions** | **27,901 rows × 18 columns** | `pandas.read_csv().shape` |
| **Missing Values** | Exactly 3 null values in `Financial Stress` (0 across all other 17 columns) | Full column null check |
| **Target Variable** | `Depression` (Binary: 0 = No, 1 = Yes) | Target distribution check |
| **Target Distribution** | Class 1: 16,336 (58.55%) • Class 0: 11,565 (41.45%) | Value count verification |
| **Provenance** | Kaggle Student Depression Dataset (Self-reported survey responses). | Dataset documentation |

> [!CAUTION]
> **Clinical Validity:** The target represents self-reported survey indicators, NOT clinically diagnosed psychiatric depression. Models trained on this dataset predict survey pattern alignment, not medical pathology.

---

## 4. Production Model Verification [VERIFIED]

| Property | Value | Verification Method |
|---|---|---|
| **File Path** | `models/best_model.pkl` | File system inspection |
| **SHA-256 Fingerprint** | `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` | Cryptographic SHA-256 |
| **File Size on Disk** | 1,957,018 bytes (~1.87 MB) | Windows NTFS byte count |
| **Pipeline Class** | `sklearn.pipeline.Pipeline` | `type(joblib.load())` |
| **Pipeline Steps** | `['preprocessor', 'classifier']` | `pipeline.named_steps.keys()` |
| **Preprocessor** | `sklearn.compose.ColumnTransformer` | Internal step inspection |
| **Classifier** | `sklearn.calibration.CalibratedClassifierCV` | Internal step inspection |
| **Calibration Method** | Platt Sigmoid (`method='sigmoid'`, `cv=5`) | Classifier attribute check |
| **Base Estimator** | `xgboost.sklearn.XGBClassifier` (`learning_rate=0.08`, `max_depth=5`, `n_estimators=120`, `colsample_bytree=0.85`) | Ensemble inspection |
| **Calibrated Folds** | 5 calibrated estimators wrapping `_SigmoidCalibration` | Internal fold inspection |

---

## 5. Exact Feature Order & Preprocessing Pipeline [VERIFIED]

The model preprocessor ingests exactly 10 approved features in the following deterministic sequence:

```
[Input Features]
  │
  ├── Numerical Pipeline (6 features): SimpleImputer(median) + StandardScaler()
  │     0: Age (float64)
  │     1: Academic Pressure (float64)
  │     2: CGPA (float64)
  │     3: Study Satisfaction (float64)
  │     4: Work/Study Hours (float64)
  │     5: Financial Stress (float64)
  │
  └── Categorical Pipeline (4 features): SimpleImputer(most_frequent) + OneHotEncoder(handle_unknown='ignore')
        6: Gender (2 categories: ['Female', 'Male'])
        7: Sleep Duration (5 categories: ['5-6 hours', '7-8 hours', 'Less than 5 hours', 'More than 8 hours', 'Others'])
        8: Dietary Habits (4 categories: ['Healthy', 'Moderate', 'Others', 'Unhealthy'])
        9: Degree (28 categories: ['B.Arch', 'B.Com', 'B.Ed', 'B.Pharm', 'B.Tech', 'BA', 'BBA', 'BCA', 'BE', 'BHM', 'BSc', 'Class 12', 'LLB', 'LLM', 'M.Com', 'M.Ed', 'M.Pharm', 'M.Tech', 'MA', 'MBA', 'MBBS', 'MCA', 'MD', 'ME', 'MHM', 'MSc', 'Others', 'PhD'])
```
**Total Encoded Feature Width:** 6 (numeric) + 2 + 5 + 4 + 28 = **45 float32 columns**.

---

## 6. Existing Test Counts & Execution Status [VERIFIED]

All 153 existing automated tests pass with 100% success (0 failed, 0 skipped):

| # | Test Suite | Runner Type | Test Count | Status |
|---|---|---|---|---|
| 1 | `tests/test_architecture_reliability.py` | `unittest discover` | 9 | **PASSED** |
| 2 | `tests/test_day11_student_journey.py` | `unittest discover` | 12 | **PASSED** |
| 3 | `tests/test_day8_ux_accessibility.py` | `unittest discover` | 10 | **PASSED** |
| 4 | `tests/test_end_to_end_validation.py` | `unittest discover` | 25 | **PASSED** |
| 5 | `tests/test_offline_reliability.py` | `unittest discover` | 9 | **PASSED** |
| 6 | `tests/test_recommendation_intelligence.py` | `unittest discover` | 37 | **PASSED** |
| 7 | `tests/test_security_privacy.py` | `unittest discover` | 16 | **PASSED** |
| 8 | `tests/test_day12_privacy_architecture.py` | `unittest discover` | 8 | **PASSED** |
| **Subtotal** | **Standard Discovery Suites** | **Automated** | **126** | **100% PASS** |
| 9 | `tests/test_student_experience.py` | Standalone runner | 7 | **PASSED** |
| 10 | `tests/test_engine_independence.py` | Standalone runner | 5 | **PASSED** |
| 11 | `tests/test_training_platform.py` | Standalone runner | 15 | **PASSED** |
| **Total** | **All Regression Suites** | **Combined** | **153** | **100% PASS** |

Additionally, the newly authored contract validator `tests/model_parity/test_feature_contract.py` passed all 3 tests.

---

## 7. Git Branch & Status [VERIFIED]

- **Active Development Branch:** `mindora-2.0-rebuild` (created from `master` at commit `06ffb77`).
- **Uncommitted Modifications:**
  - `docs/DAY_12_DATA_RETENTION_MATRIX.md` (reassessed Category C fields and retention boundaries).
  - `src/privacy_policy.py` (added `MINIMAL_INITIAL_RETENTION_SCHEMA`).
  - `tests/test_day12_privacy_architecture.py` (added test for minimal initial schema).
- **Commit Discipline:** In strict accordance with the safety rules, **zero automatic commits were made**.

---

## 8. New Directories & Scaffolding Created [VERIFIED]

The following directory tree was scaffolded non-destructively:
- `frontend/`: `public/models/`, `public/resources/`, `src/pages/`, `src/components/`, `src/engines/safety/`, `src/engines/inference/`, `src/engines/navigator/`, `src/runtime/`, `src/storage/vault/`, `src/contracts/`, `src/hooks/`, `src/styles/`
- `ml_lab/`: `data/raw/`, `data/processed/`, `data/external/`, `data/manifests/`, `audit/`, `preprocessing/`, `experiments/`, `training/`, `calibration/`, `uncertainty/`, `explainability/`, `ood/`, `export/`, `reports/`
- `shared/`: `contracts/`, `fixtures/`, `schemas/`
- `local_companion/`: `rag/`, `model_runtime/`
- `resources/`
- `tests/`: `unit/`, `integration/`, `browser/`, `model_parity/`, `security/`, `offline/`
- `docs/`: `architecture/`, `data/`, `privacy/`, `model_cards/`, `operations/`
- `legacy_v1/`

---

## 9. Documentation Created [VERIFIED]

The following architectural specifications were authored and committed/saved:
1. `docs/architecture/MINDORA_2_ARCHITECTURE.md` (Product vision, 3 intelligence layers, PWA + ONNX Web stack).
2. `docs/architecture/MIGRATION_MAP.md` (Module-to-module migration mapping, phased roadmap, rollback plan).
3. `docs/data/DATA_AUDIT_PLAN.md` (Dataset verification, clinical disclaimers, DuckDB profiling plan).
4. `docs/data/FEATURE_CONTRACT_SPECIFICATION.md` (Machine-readable contract design, 10-feature schema).
5. `docs/operations/ONNX_EXPORT_AND_PARITY_PLAN.md` (ONNX export pathways, Platt sigmoid calibration, parity tests).
6. `docs/privacy/LOCAL_VAULT_THREAT_MODEL.md` (Web Crypto AES-256-GCM vault, threat analysis, realistic limits).
7. `docs/operations/STAGE_0_AUDIT_REPORT.md` (This comprehensive Stage 0 report).

---

## 10. Files Intentionally Left Unchanged [VERIFIED]

To protect existing project integrity, the following assets were preserved without modification:
- `app.py` (Existing Streamlit application entry point).
- `models/best_model.pkl` (Production calibrated XGBoost model, SHA-256 intact).
- `models/feature_importance.csv` & `models/model_comparison.json`.
- `dataset/Student_Depression_Dataset.csv` (Original dataset file, SHA-256 intact).
- `src/` (All existing production modules: `predict.py`, `recommendations.py`, `ui_theme.py`, `views/`, `data_platform/`, `training/`).
- `tests/` (All 10 legacy test suite files preserved in place).
- `evaluation/` & `experiments/registry.json`.

---

## 11. Existing Problems & Migration Risks [VERIFIED & ANALYZED]

1. **Composite Model ONNX Export Complexity:**  
   `models/best_model.pkl` is not a raw XGBoost model; it is a `CalibratedClassifierCV` meta-estimator containing 5 internal XGBoost estimators calibrated with Platt sigmoids (`_SigmoidCalibration`). Standard `skl2onnx` does not support this structure out-of-the-box.  
   *Mitigation:* Adopt **Pathway C (Hybrid Contract Architecture)**: encode the 45 features in TypeScript adhering to `feature_contract.json`, export the 5 base XGBoost models to ONNX, and evaluate the Platt sigmoid calibrator in the Web Worker.
2. **Dataset Clinical Validity Hazard:**  
   The dataset target `Depression` reflects self-reported survey indicators. If students misinterpret predictions as medical diagnoses, harm could occur.  
   *Mitigation:* Prominent non-diagnostic disclaimers and complete segregation of Layer 1 psychometrics from Layer 2 ML.
3. **WebAssembly Memory & Threading:**  
   Running ML models on the main browser thread causes UI stuttering and unresponsiveness during form interaction.  
   *Mitigation:* Isolate all ONNX Runtime Web execution inside a dedicated background Web Worker.
4. **Client-Side Passphrase Recovery Limitation:**  
   The optional local vault uses client-side encryption. If a student forgets their passphrase, their saved habit data is permanently unrecoverable.  
   *Mitigation:* Transparent UI warnings and prominent guidance before vault initialization.

---

## 12. Next Recommended Task [PROPOSED]

**Stage 1: ML Lab Research & Benchmarking:**
1. Initialize DuckDB profiling over `dataset/Student_Depression_Dataset.csv` in `ml_lab/audit/`.
2. Generate the immutable stratified split manifest (`ml_lab/data/manifests/split_manifest.json`) using 70/15/15 splits.
3. Benchmark all 4 candidate model families (Calibrated Logistic Regression, Baseline XGBoost, CatBoost, LightGBM) on the independent validation set.
4. Execute Gower-distance K-medoids research for out-of-distribution (OOD) monitoring.

---

## Status Classification Summary

- **VERIFIED:** Production model SHA-256, dataset shape and hash, preprocessor pipeline, 153 tests passing, Streamlit health (200 OK), feature contract conformance.
- **REPORTED BUT NOT VERIFIED:** Upstream Kaggle survey data collection methodologies.
- **PROPOSED:** Phased migration roadmap, DuckDB profiling protocols, OOD prototype research.
- **NOT IMPLEMENTED:** React PWA frontend, ONNX WebAssembly model export, Web Crypto encrypted vault, FastAPI companion.

**STAGE 0 COMPLETED SAFELY. STOPPED AND AWAITING USER REVIEW.**
