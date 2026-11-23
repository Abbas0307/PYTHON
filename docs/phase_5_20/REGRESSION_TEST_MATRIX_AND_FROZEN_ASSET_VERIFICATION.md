# Mindora 2.0 — Phase 5.20: Regression Test Matrix & Frozen Asset Verification

**Document ID:** `DOC-P520-MATRIX-015`  
**Date:** November 16, 2026  
**Status:** Verified & Active  
**Author:** Principal QA Architect & Systems Reliability Engineer  

---

## 1. Frozen Research Assets Verification Table

All 11 baseline research assets remain byte-identical to their initial reference states.

| Asset File Path | Expected SHA-256 Digest | Observed SHA-256 Digest | Status |
| :--- | :--- | :--- | :--- |
| `app.py` | `5F15ADD9F3A5F5809D80154931E98A5B79D06BBC9BB69323028BFA3898E46BBE` | `5F15ADD9F3A5F5809D80154931E98A5B79D06BBC9BB69323028BFA3898E46BBE` | **MATCH** |
| `src/best_model.pkl` | `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` | `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` | **MATCH** |
| `src/scaler.pkl` | `740FD5A0CF2208E8B3D9EB44DAF8E3C0F5943A5F89FD93BE5CD15D53974534FB` | `740FD5A0CF2208E8B3D9EB44DAF8E3C0F5943A5F89FD93BE5CD15D53974534FB` | **MATCH** |
| `src/label_encoders.pkl`| `754705001C312CD2387C171F08E77610FBE9BA6DBE30C8FD83C309CD525A1FE3` | `754705001C312CD2387C171F08E77610FBE9BA6DBE30C8FD83C309CD525A1FE3` | **MATCH** |
| `src/model_metadata.json`| `F23BC43867BC4AC7EB9B935824C833CF4FBE5E5FD7A2215A429AC00A0ED16B78` | `F23BC43867BC4AC7EB9B935824C833CF4FBE5E5FD7A2215A429AC00A0ED16B78` | **MATCH** |
| `data/sample_input.json`| `8CF76ACAE93F94F3C886D615828D2B9F0466BE5CD4EF1A02E39178E892EAA8DC` | `8CF76ACAE93F94F3C886D615828D2B9F0466BE5CD4EF1A02E39178E892EAA8DC` | **MATCH** |
| `data/student_depression_dataset.csv` | `1BC204CE92B60EECC02FF4923F959CA6203D45300B0224BE9DCBD7F09E8FEAE2` | `1BC204CE92B60EECC02FF4923F959CA6203D45300B0224BE9DCBD7F09E8FEAE2` | **MATCH** |
| `src/preprocessing.py`| Unmodified | Unmodified | **MATCH** |
| `src/predict.py` | Unmodified | Unmodified | **MATCH** |
| `src/recommendations.py`| Unmodified | Unmodified | **MATCH** |
| `src/ui_theme.py` | Unmodified | Unmodified | **MATCH** |

---

## 2. Comprehensive Test Verification Summary

| Category | Suite Name | Tests | Result | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Python Backend** | `tests/test_phase_5_20_features.py` | 10 | **PASS** | AES-GCM, avatars, hashed OTP, alerts |
| **Python Backend** | `tests/test_production_security_hardening.py` | 10 | **PASS** | Session tokens, rate limits, CORS |
| **Python Backend** | `tests/test_auth_guardian_security.py` | 2 | **PASS** | Registration, login, guardian update |
| **Python Backend** | `tests/test_end_to_end_validation.py` | 25 | **PASS** | Bounds, edge cases, error handling |
| **Python Backend** | `tests/test_offline_reliability.py` | 9 | **PASS** | Socket interception, zero outbound |
| **Python Backend** | Full Suite (`pytest tests ml_lab/tests ...`) | 214 | **PASS** | 100% pass across repository |
| **React Frontend** | `frontend/test/frontend_unit.test.mjs` | 123 | **PASS** | Contracts, engines, vaults, planner |
| **Type Check** | `tsc --noEmit` | — | **PASS** | 0 TypeScript compilation errors |
| **Production Build** | `npm run build` | — | **PASS** | 1,651 modules transformed in 2.91s |
