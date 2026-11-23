# Mindora 2.0 — Phase 5.21: ML & Research Regression Report

**Document ID:** `DOC-P521-ML-007`  
**Date:** November 16, 2026  
**Status:** Verification Complete & Active  
**Auditor:** Machine Learning Systems Reviewer & Research Governance Specialist  

---

## 1. Frozen Research Assets Verification

Every frozen research asset was checked to ensure zero modification occurred:

| Asset | Path | SHA-256 Digest | Status |
| :--- | :--- | :--- | :--- |
| Core Streamlit Prototype | `app.py` | `5F15ADD9F3A5F5809D80154931E98A5B79D06BBC9BB69323028BFA3898E46BBE` | **UNMODIFIED** |
| Production Baseline Model | `models/best_model.pkl` | `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` | **UNMODIFIED** |
| Student Survey Dataset | `dataset/Student_Depression_Dataset.csv` | `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` | **UNMODIFIED** |
| Feature Importance Weights | `models/feature_importance.csv` | `5CF9D06A6D14F77DC670BE034D976BE26698F567F9ACD62323BF6B301BFF045C` | **UNMODIFIED** |
| Model Comparison Benchmark | `models/model_comparison.json` | `7D519B3EBDDF1401EF8FE9B0FEBC9E2D2398CBE911DFF8C16B78EB83E4CBE0EB` | **UNMODIFIED** |

---

## 2. ML Inference Engine Health & Boundary Invariants

Tested via `tests/test_end_to_end_validation.py` (25 tests) and `tests/test_offline_reliability.py` (9 tests):
- Model loading from disk succeeds synchronously.
- 10-feature contract validation correctly checks ranges (e.g. Age $[15, 100]$, CGPA $[0, 10]$).
- Empty or partial feature dictionaries raise descriptive `ValueError` exceptions with zero score fabrication.
- Zero outbound network requests during inference (verified via socket interception guard).

---

## 3. Dataset Quarantine & Non-Diagnostic Guarantee

- **Track B (163-Record Real-World Dataset):** Quarantined as research-only due to unverified provenance. It is never used for live student-facing predictions or guardian alert triggering.
- **Non-Diagnostic Policy:** Mindora is strictly an educational wellness reflection tool. Outputs are framed as "Lifestyle & Academic Friction Indicators" and explicitly state that Mindora does not diagnose major depressive disorder or clinical conditions.

---

## 4. ML & Research Verdict

- **Status:** **PASS**
- **Findings:** Models unchanged; frozen hashes match baseline; inference remains 100% offline and deterministic.
