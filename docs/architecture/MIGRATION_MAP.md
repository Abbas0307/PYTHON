# MINDORA 2.0 — CODEBASE MIGRATION MAP
## Safe Phased Migration from Legacy Streamlit to Offline-First PWA

**Document Version:** 1.0.0  
**Date:** November 15, 2026  
**Status:** MIGRATION ROADMAP (STAGE 0 FOUNDATION)  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Repository Directory:** `D:\Depression calculator`  

---

## 1. Executive Migration Strategy

The migration from Mindora 1.0 (Streamlit monolithic server) to Mindora 2.0 (Browser-first TypeScript PWA + ONNX WebAssembly) follows a **non-destructive, dual-run coexistence model**:

```
Existing Project (Streamlit v1) ──[Stage 0: Scaffolding & Contracts]──► Both Coexist Side-by-Side
               │                                                                    │
               ▼                                                                    ▼
     Untouched & Fully Active                                              Verified Parity Passes
               │                                                                    │
               └──────────► [Stage 5: Formal Cutover & Backup] ◄────────────────────┘
                                         │
                                         ▼
                     Legacy Streamlit Moved to legacy_v1/
                     Mindora 2.0 PWA Becomes Primary Entry
```

### Absolute Safety Invariants
1. **Zero Deletion:** Never delete, overwrite, or truncate existing source files, test suites, or models.
2. **Dual-Run Coexistence:** The legacy Streamlit application (`app.py`, `src/`) remains 100% functional and testable throughout Stages 0, 1, 2, and 3.
3. **No Premature Deprecation:** The Streamlit implementation is **NOT** moved to `legacy_v1/` during Stage 0. It will only be moved after complete functional and statistical parity is verified.
4. **Model Checksum Preservation:** `models/best_model.pkl` must maintain its verified SHA-256 (`E182E9E7...`) indefinitely as the historical benchmark reference.

---

## 2. Module-to-Module Migration Mapping

| Legacy File / Module (v1) | Target Mindora 2.0 Module | Migration Language / Technology | Operational Responsibility in Mindora 2.0 | Migration Status |
|---|---|---|---|---|
| `app.py` | `frontend/src/App.tsx` & Router | React 18 / TypeScript | Top-level routing, 4-stage stepper navigation, layout chrome | **NOT IMPLEMENTED** (Mapped) |
| `src/ui_theme.py` | `frontend/src/styles/` & `components/` | Tailwind CSS / Lucide React | Color tokens, stage steppers, disclaimers, responsive cards | **NOT IMPLEMENTED** (Mapped) |
| `src/predict.py` (Inference) | `frontend/src/engines/inference/` | TypeScript / ONNX Runtime Web | Client-side model inference in Web Worker | **NOT IMPLEMENTED** (Mapped) |
| `src/predict.py` (SHAP) | `frontend/src/engines/inference/explain.ts` | TypeScript / Wasm | Client-side feature attribution visualization | **NOT IMPLEMENTED** (Mapped) |
| `src/recommendations.py` (PHQ-9) | `frontend/src/engines/safety/phq9.ts` | TypeScript (Pure functions) | Validated 9-question scoring (0–27), clinical severity tiers | **NOT IMPLEMENTED** (Mapped) |
| `src/recommendations.py` (Item 9) | `frontend/src/engines/safety/item9.ts` | TypeScript (Pure functions) | Unconditional self-harm safeguard and emergency routing | **NOT IMPLEMENTED** (Mapped) |
| `src/recommendations.py` (Lifestyle) | `frontend/src/engines/safety/lifestyle.ts` | TypeScript (Pure functions) | Lifestyle Rhythm (0–10) & Digital Friction (0–10) logic | **NOT IMPLEMENTED** (Mapped) |
| `src/recommendations.py` (Hotlines) | `resources/crisis_resources.json` | JSON + TypeScript client | Geo-localized crisis directory (India, UK, US/CA, AU) | **STAGED IN RESOURCES** |
| `src/recommendations.py` (Protocols)| `resources/protocols.json` | JSON + TypeScript client | Curated lifestyle recommendations and habit catalog | **STAGED IN RESOURCES** |
| `src/session_utils.py` | `frontend/src/storage/vault/` | TypeScript / Web Crypto API | In-memory session state + optional AES-256-GCM vault | **NOT IMPLEMENTED** (Mapped) |
| `src/views/student_dashboard.py` | `frontend/src/pages/Dashboard.tsx` | React 18 / TypeScript | Stage 1 (UNDERSTAND) student dashboard & onboarding | **NOT IMPLEMENTED** (Mapped) |
| `src/views/assessment.py` | `frontend/src/pages/Assessment.tsx` | React 18 / TypeScript | Stage 2 (DISCOVER) 5-tab student questionnaire | **NOT IMPLEMENTED** (Mapped) |
| `src/views/insights.py` | `frontend/src/pages/Insights.tsx` | React 18 / TypeScript | Stage 2 (DISCOVER) Tri-engine segregated results & SHAP | **NOT IMPLEMENTED** (Mapped) |
| `src/views/wellness_planner.py` | `frontend/src/pages/Planner.tsx` | React 18 / TypeScript | Stage 3 (ACT) interactive micro-habit action center | **NOT IMPLEMENTED** (Mapped) |
| `src/views/progress_view.py` | `frontend/src/pages/Progress.tsx` | React 18 / TypeScript | Stage 4 (IMPROVE) habit reflection & milestone tracker | **NOT IMPLEMENTED** (Mapped) |
| `src/views/training_lab_view.py` | `ml_lab/` tooling & reports | Python / DuckDB / Optuna | Local workstation researcher ML lab (disconnected from UI) | **NOT IMPLEMENTED** (Mapped) |
| `dataset/Student_Depression_Dataset.csv` | `ml_lab/data/raw/` (Ref via Manifest)| CSV / DuckDB Parquet | Immutable benchmark dataset (27,901 rows, 18 columns) | **REFERENCED VIA MANIFEST** |
| `models/best_model.pkl` | `models/best_model.pkl` (Immutable) | Python Pickle / ONNX export | Production baseline reference model (SHA-256 E182E9E7...) | **PRESERVED INTACT** |
| `src/training/` & `src/data_platform/`| `ml_lab/training/` & `audit/` | Python 3.12 / Scikit-learn | Multi-model benchmarking, Optuna tuning, calibration | **NOT IMPLEMENTED** (Mapped) |
| `tests/` (10 test suites) | `tests/unit/`, `tests/model_parity/` | Python unittest / Pytest | Regression test baseline (153 tests passing) | **PRESERVED & EXTENDED** |

---

## 3. Phased Implementation Roadmap

```
Stage 0 (Current) ──► Stage 1 (Research) ──► Stage 2 (ONNX Parity) ──► Stage 3 (PWA Core) ──► Stage 4 (Parity Sign-off) ──► Stage 5 (Cutover)
```

### Stage 0: Audit & Foundation (CURRENT STAGE)
- [x] Check Git status, active branch, and uncommitted modifications.
- [x] Create dedicated development branch `mindora-2.0-rebuild`.
- [x] Verify production model SHA-256 (`E182E9E7...`) and dataset shape (27,901 × 18).
- [x] Audit feature schema and preprocessing (6 numeric, 4 categorical, 45 encoded features).
- [x] Scaffold non-destructive directory structure (`frontend/`, `ml_lab/`, `shared/`, etc.).
- [x] Author single feature contract (`shared/contracts/feature_contract.json`).
- [x] Generate gold-standard reference benchmark fixtures (`shared/fixtures/benchmark_cases.json`).
- [x] Add automated contract test (`tests/model_parity/test_feature_contract.py`).
- [x] Deliver Stage 0 architectural and operational documentation.
- [ ] **STOP AND WAIT FOR USER REVIEW.**

### Stage 1: ML Lab Research & Benchmarking (FUTURE)
- Establish DuckDB profiling over `dataset/Student_Depression_Dataset.csv`.
- Implement rigorous 5-fold stratified cross-validation on train split (70%) with strict test set (15%) isolation.
- Train and benchmark:
  1. Logistic Regression (L2 penalty, calibrated)
  2. Baseline Calibrated XGBoost
  3. CatBoost Classifier
  4. LightGBM Classifier
- Evaluate calibration curves, Brier scores, ROC-AUC, and F1.
- Perform Gower-distance K-medoids research for out-of-distribution (OOD) detection.
- Select winning candidate strictly based on validation performance, compact size, and exportability.

### Stage 2: ONNX Export & Parity Testing (FUTURE)
- Implement ONNX export pipeline for the selected calibrated model.
- Execute automated parity test against `shared/fixtures/benchmark_cases.json` ensuring absolute error $\le 10^{-5}$.
- Verify missing-value handling, class ordering (0=negative, 1=positive), and categorical unknown handling.
- Verify client-side execution via ONNX Runtime Web on WebAssembly CPU.

### Stage 3: Browser-First PWA Frontend (FUTURE)
- Initialize React 18 + Vite + TypeScript PWA in `frontend/`.
- Implement Layer 1 deterministic safety engines in TypeScript (`phq9.ts`, `item9.ts`, `lifestyle.ts`).
- Integrate ONNX Runtime Web inside a dedicated Web Worker.
- Implement responsive Tailwind UI covering the 4-stage journey (`UNDERSTAND → DISCOVER → ACT → IMPROVE`).
- Configure Service Worker for 100% offline asset and model caching.

### Stage 4: End-to-End Parity Verification & Security Audit (FUTURE)
- Run automated end-to-end browser tests comparing Streamlit outputs vs PWA outputs on identical inputs.
- Audit responsive design across mobile (`360x800`, `390x844`), tablet (`768x1024`), and desktop (`1366x768`).
- Execute security audit on optional Web Crypto AES-256-GCM vault.

### Stage 5: Formal Cutover & Archival (FUTURE)
- Move legacy Streamlit files into `legacy_v1/`.
- Promote `frontend/` as the root production application.
- Update CI/CD and deployment documentation.

---

## 4. Preservation & Rollback Plan

If any critical defect or parity discrepancy is detected during development:
1. **Immediate Fallback:** Because the legacy Streamlit application remains untouched in root and `src/`, running `.venv\Scripts\python.exe -m streamlit run app.py` remains 100% operational at any time.
2. **Git Reversibility:** All Mindora 2.0 work is isolated on the `mindora-2.0-rebuild` branch, ensuring zero disruption to `master`.
