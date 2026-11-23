# MINDORA 2.0 — PHASE 8.5 TEST COVERAGE MATRIX

**Date:** November 18, 2026  
**Status:** ALL TESTS PASSING (100% GREEN)  
**Total Automated Tests:** 428 Tests (271 Python Tests + 146 Node.js/Frontend Tests + 11 Frozen Research Asset Checks)

---

## 1. Test Suite Summary Table

| Suite Category | Test Runner | Files Covered | Tests | Pass | Fail | Duration |
|---|---|---|---|---|---|---|
| **Python Backend & Research** | `pytest 9.1.1` (Python 3.14.5) | `tests/`, `ml_lab/tests/`, `local_companion/` | 271 | 271 | 0 | 22.00s |
| **Frontend Unit & Acceptance** | `node:test` (Node.js 20+) | `frontend/test/*.test.mjs` | 146 | 146 | 0 | 1.00s |
| **Frozen Research Assets** | `verify_frozen_assets.py` | 11 frozen research models & manifests | 11 | 11 | 0 | 0.40s |
| **Total Automated** | | | **428** | **428** | **0** | **~23.4s** |

---

## 2. Python Backend Test Breakdown (271 Tests)

| Test Module | Coverage Focus | Test Count | Status |
|---|---|---|---|
| `tests/model_parity/test_feature_contract.py` | 10 feature schema invariants & clinical safety boundaries | 3 | PASS |
| `tests/test_architecture_reliability.py` | Service resilience, error handling & graceful degradation | 9 | PASS |
| `tests/test_auth_guardian_security.py` | Argon2id hashing, secure sessions, OTP verification | 2 | PASS |
| `tests/test_day11_student_journey.py` | End-to-end journey from onboarding to check-in | 12 | PASS |
| `tests/test_day12_privacy_architecture.py` | Zero-knowledge client crypto, PBKDF2/AES-GCM encryption | 8 | PASS |
| `tests/test_day8_ux_accessibility.py` | WCAG 2.1 AA color contrast & responsive layout invariants | 10 | PASS |
| `tests/test_end_to_end_validation.py` | Full platform integration pipeline | 25 | PASS |
| `tests/test_engine_independence.py` | Statistical engine separation from ML inference | 5 | PASS |
| `tests/test_guardian_cooldown_closure.py` | 24-hour guardian cooldown and consent toggling | 1 | PASS |
| `tests/test_guardian_email_notification.py` | SMTP integration, Level 1 & 2 stress alert dispatch | 17 | PASS |
| `tests/test_offline_reliability.py` | Offline PWA service worker isolation & cache boundaries | 9 | PASS |
| `tests/test_phase_5_20_features.py` | Profile details, avatars & student settings | 10 | PASS |
| `tests/test_phase_5_21_audit.py` | Audit logging, guardian consent & episode tracking | 14 | PASS |
| `tests/test_phase_6_onboarding.py` | Strict sequence: Login -> Parent -> Student -> Dashboard | 2 | PASS |
| `tests/test_phase_7_ai_personalization.py` | Chatbot safety boundaries, action planner rules | 10 | PASS |
| `tests/test_phase_8_5_profile_and_auth_fixes.py` | **NEW:** 163 profile compare, change password, auth/me dual keys, RBAC | 5 | PASS |
| `tests/test_phase_8_analyzer_music_games.py` | 163 dataset provenance, models, user preferences, game sessions | 8 | PASS |
| `tests/test_production_security_hardening.py` | Dependency security, TLS/HTTPS, rate limiting | 10 | PASS |
| `tests/test_recommendation_intelligence.py` | Non-clinical heuristic recommendation engine | 37 | PASS |
| `tests/test_security_privacy.py` | Role separation, unverified survey containment | 16 | PASS |
| `tests/test_student_experience.py` | Wellness studio, audio player, timer accuracy | 7 | PASS |
| `tests/test_training_platform.py` | Model calibration & out-of-distribution detector | 15 | PASS |
| `ml_lab/tests/test_pre_ingestion_isolation.py` | Data integrity preflight validation | 10 | PASS |
| `ml_lab/tests/test_stage_3b_2.py` | ML model validation & cross-validation metrics | 12 | PASS |
| `ml_lab/tests/test_stage_3b_4_preflight.py` | Deployment readiness gate | 5 | PASS |
| `local_companion/test_local_companion.py` | Local API server contract tests | 9 | PASS |
| **Subtotal** | | **271** | **271 PASS** |

---

## 3. Frontend Test Breakdown (146 Tests)

| Test File | Description | Count | Status |
|---|---|---|---|
| `test/frontend_unit.test.mjs` | Feature contract, PHQ-9 scoring, lifestyle engine | 8 | PASS |
| `test/phase_5_1_product_integration.test.mjs` | Wellness studio breathing, grounding, timer | 11 | PASS |
| `test/phase_5_2_resource_navigator.test.mjs` | Crisis directory & campus resource routing | 8 | PASS |
| `test/phase_5_3_end_to_end_acceptance.test.mjs` | Dashboard customization, section reordering | 12 | PASS |
| `test/phase_5_3_1_defect_remediation.test.mjs` | Timer drift fixes, allergy warnings | 6 | PASS |
| `test/phase_5_4_local_companion.test.mjs` | Local companion API contracts | 8 | PASS |
| `test/phase_5_4_2_sw_isolation.test.mjs` | Service worker offline cache boundaries | 5 | PASS |
| `test/phase_5_8_weekly_trends.test.mjs` | Trends encryption, 600,000 PBKDF2 iterations | 10 | PASS |
| `test/phase_5_9_action_planner.test.mjs` | Smart action planner rule engine | 16 | PASS |
| `test/phase_5_10_wellness_studio.test.mjs` | Sensory grounding & muscle relaxation | 8 | PASS |
| `test/phase_5_11_personalization.test.mjs` | Adaptive recommendation & privacy inventory | 10 | PASS |
| `test/phase_5_12_unified_experience.test.mjs` | Timeline sorting & activity history clearing | 10 | PASS |
| `test/phase_5_16_four_models_auth.test.mjs` | Candidate model metrics & dataset partitions | 6 | PASS |
| `test/phase_5_18_end_to_end_integration.test.mjs` | Navigation and screen mounting checks | 8 | PASS |
| `test/phase_6_onboarding.test.mjs` | Onboarding state machine progression rules | 4 | PASS |
| `test/phase_7_ai_personalization_ui.test.mjs` | AI companion disclosures & floating widget | 5 | PASS |
| `test/phase_8_music_games_ui.test.mjs` | Music context, 5-min game limit, mini games | 9 | PASS |
| `test/phase_8_5_full_audit.test.mjs` | **NEW:** 6 instrumental tracks, Snake buffer, Block rotation, 163 profile form | 6 | PASS |
| **Subtotal** | | **146** | **146 PASS** |

---

## 4. Frozen Research Assets Verification (11/11 Exact Matches)

All 11 baseline SHA-256 fingerprints computed and verified via `scripts/verify_frozen_assets.py`:
1. `app.py`: `5F15ADD9F3A5F5809D80154931E98A5B79D06BBC9BB69323028BFA3898E46BBE` (MATCH)
2. `dataset/Student_Depression_Dataset.csv`: `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` (MATCH)
3. `shared/contracts/feature_contract.json`: `BED161ED06A50F528BBFE9316FF9A979771A1CFA8EE8C9CD48CF9466E442FFB0` (MATCH)
4. `ml_lab/splits/group_aware_partition_manifest.json`: `A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070` (MATCH)
5. `ml_lab/splits/partition_assignments.csv`: `91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1` (MATCH)
6. `models/best_model.pkl`: `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` (MATCH)
7. `ml_lab/experiments/stage_3b_2/oof_metrics.json`: `361BC700A7731678402BCE89B7A85051181DC877430A3FE30AA114EC2C0A6FEF` (MATCH)
8. `ml_lab/experiments/stage_3b_3/oof_metrics.json`: `555D3B159A31A5C6F6964143F040A97F8BECC938FCB9690986A9B856F9DC2A03` (MATCH)
9. `ml_lab/experiments/stage_3b_3/model_comparison.json`: `FC8E31D45DEE28D3925A80627268299D185AE68D6C1DE092167EE23A7F6286E7` (MATCH)
10. `ml_lab/experiments/stage_3b_4/stage_3b_4_metrics.json`: `FBB9AAEB5D0A12E46FE74BF9EDA71AA3140C130E384DCF47A35AABCED25CC7C6` (MATCH)
11. `ml_lab/experiments/stage_3b_4/artifact_manifest.json`: `B1385C3A03015A470911CC432012E418BD3AD0E505A52C0CF92C22D8290FB072` (MATCH)
