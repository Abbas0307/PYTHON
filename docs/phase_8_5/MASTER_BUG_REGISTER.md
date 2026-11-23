# MINDORA 2.0 — PHASE 8.5 MASTER BUG REGISTER

**Release:** Mindora 2.0 (Phase 8.5 Audit & Remediation)  
**Date:** November 18, 2026  
**Auditor:** Application Security, Full-Stack QA & Medical AI Governance Team  
**Verification Status:** 100% REMEDIATED (12/12 Defect Items Closed)

---

## Executive Summary

Phase 8.5 executed a comprehensive audit of the entire Mindora 2.0 platform across frontend components, local companion FastAPI service, ML research analyzer modules, and user state management. A total of 12 distinct functional, architectural, and security bugs were cataloged in the Initial Audit (`docs/phase_8_5/INITIAL_FULL_APPLICATION_BUG_AUDIT.md`). All 12 items have been resolved, verified with unit/integration tests (271 backend tests, 146 frontend tests), and validated through live browser end-to-end sessions.

---

## Master Defect Register Table

| Bug ID | Component | Severity | Description | Root Cause | Status | Verification Reference |
|---|---|---|---|---|---|---|
| **BUG-P85-001** | Music Experience | Medium | Nature/rain audio recordings present contrary to requirements | Audio collection previously contained non-musical nature sounds | **CLOSED** | 6 instrumental WAVs in `public/audio/`, `LICENSE.md`, `phase_8_5_full_audit.test.mjs` |
| **BUG-P85-002** | Compact Music Player | Medium | Missing transport controls (Previous, Next, Stop, Repeat, Shuffle, Progress Bar) | Player had minimal controls with only track title & play/pause | **CLOSED** | `CompactMusicPlayer.tsx`, `MusicPlayerContext.tsx`, `phase_8_5_full_audit.test.mjs` |
| **BUG-P85-003** | Snake Game | High | 180° self-inversion collision & multiple interval loops on food eat | Interval teardown inside food dependency & lack of FIFO direction buffer | **CLOSED** | `SnakeGame.tsx` `inputQueueRef` buffer, isolated tick loop |
| **BUG-P85-004** | Block Game | High | Game over not detected, no piece rotation, no hover placement preview | Missing placement lookahead, static piece orientations | **CLOSED** | `BlockGame.tsx` 10x10 board, 90° rotation, hover ghost, authoritative game over check |
| **BUG-P85-005** | Real-World Analyzer | High | 163-Record Depression Analyzer lacked interactive profile analysis form | Phase 8 analyzer only had static aggregate tables | **CLOSED** | `RealWorldDatasetScreen.tsx` Tab 6, `compare_student_profile`, `test_phase_8_5_profile_and_auth_fixes.py` |
| **BUG-P85-006** | ML Research Module | Medium | `ml_lab/real_world_analyzer.py` missing from directory structure | Module was located solely in `src/data_platform/` | **CLOSED** | Created `ml_lab/real_world_analyzer.py` re-exporting service |
| **BUG-P85-007** | Guardian Info | High | Guardian details remained blank on guardian management screens | Key mismatch: screens checked `data.user` while `/api/auth/me` returned `data.profile` | **CLOSED** | Server returns `profile` & `user`; screens check `data.profile \|\| data.user` |
| **BUG-P85-008** | Privacy & Security | High | Change Password form failed with 404/405 | Missing `change_password` method in AuthManager and route in FastAPI | **CLOSED** | Added `change_password()` to AuthManager and mounted `POST /api/auth/change-password` |
| **BUG-P85-009** | Guardian Info | Medium | Saving guardian details called unmounted `PUT /api/auth/profile` | Server only mounted `/api/guardian/update` | **CLOSED** | Mounted `PUT /api/auth/profile` delegating to AuthManager guardian & profile update |
| **BUG-P85-010** | ML Research Lab | Low | Orphaned `ExplainabilityScreen.tsx` not mounted in App router | `App.tsx` grouped `#explainability` into `RiskInsightsScreen` | **CLOSED** | Imported `ExplainabilityScreen` and routed to dedicated SHAP screen |
| **BUG-P85-011** | User Session | Medium | Audio continued playing and game session persisted across logout | `handleLogout` did not dispatch logout event or clear game session | **CLOSED** | Added `mindora:logout` custom event dispatch & `sessionStorage` clearance |
| **BUG-P85-012** | Personal Journal | Medium | Journal reflections lost on page reload | Entries stored solely in volatile React state | **CLOSED** | Added `localStorage` persistence with `mindora_personal_journal_entries` |

---

## Detailed Remediation Summaries

### BUG-P85-001: Instrumental Music Replacement
- **Changes:** Removed all nature recordings (rain, ocean, forest). Synthesized 6 pure relaxing instrumental tracks (`soft_piano.wav`, `ambient_instrumental.wav`, `lofi_calm.wav`, `meditation_instrumental.wav`, `peaceful_guitar.wav`, `focus_music.wav`) at 22,050 Hz 16-bit PCM with smooth 16-second loops. Documented open licensing in `frontend/public/audio/LICENSE.md`.
- **Verification:** Unit tests confirm all 6 tracks exist; zero nature tracks remain.

### BUG-P85-002: Music Player Transport Controls
- **Changes:** Updated `MusicPlayerContext.tsx` and `CompactMusicPlayer.tsx` to support previous/next track selection, stop button, repeat mode, shuffle mode, and continuous seek progress bar with timestamp labels (`formatTime(currentTime)` / `formatTime(duration)`). Styled with white-and-violet pill aesthetic, volume slider popover, and animated equalizer waves.
- **Verification:** `frontend/test/phase_8_5_full_audit.test.mjs` verifies all transport controls and UI states.

### BUG-P85-003: Snake Game Direction & Loop Fix
- **Changes:** Added `inputQueueRef` (FIFO direction buffer) in `SnakeGame.tsx`. Prevents rapid keystroke self-inversion (e.g. Right -> Up -> Left in a single tick). Removed `food` and `score` from the game interval dependencies to prevent tick restarts. Added on-screen touch D-pad for mobile and tablet responsiveness.
- **Verification:** Automated tests verify input queue buffer and boundary checks.

### BUG-P85-004: Block Puzzle Rebuild
- **Changes:** Built a complete 10x10 Block Puzzle game in `BlockGame.tsx`. Features:
  - 10x10 grid with valid cell placement validation.
  - 90-degree clockwise block rotation via button, click, or 'R' key.
  - Hover ghost placement preview (green for valid, red for obstructed).
  - Row and column clearing with chime sound effects and score increments.
  - Authoritative game-over validation checking all remaining pieces against every cell.
- **Verification:** Verified 10x10 board constants, rotation handlers, hover ghost coordinates, and game-over state.

### BUG-P85-005 & BUG-P85-006: 163-Record Real World Data Analyzer & Service
- **Changes:**
  - Created `ml_lab/real_world_analyzer.py` re-exporting `RealWorldDepressionAnalyzer` and `get_real_world_analyzer()`.
  - Added `compare_student_profile(profile_data)` method computing empirical cohort percentiles across Academic Pressure, Study Hours, CGPA, Study Satisfaction, Financial Stress, and Age.
  - Standardized exploratory logistic regression model on $N=143$ binary reduction ($P(\text{Historical Yes})$).
  - Added Tab 6 ("Interactive Profile Analysis") in `RealWorldDatasetScreen.tsx` with all 10 feature inputs.
  - Mounted `POST /api/research/163-dataset/profile-compare` in `local_companion/service.py` with RBAC gate.
  - Embedded mandatory high-visibility clinical disclaimer: `"EXPLORATORY RESEARCH ESTIMATE — NOT A DEPRESSION DIAGNOSIS OR CLINICAL SCREENING RESULT."`
- **Verification:** `tests/test_phase_8_5_profile_and_auth_fixes.py` (5 passed), `frontend/test/phase_8_5_full_audit.test.mjs`.

### BUG-P85-007, BUG-P85-008 & BUG-P85-009: Auth & Guardian Screen Integrations
- **Changes:**
  - Added `change_password()` method to `AuthManager` enforcing current password verification and minimum 8-character length.
  - Mounted `POST /api/auth/change-password` in `local_companion/service.py`.
  - Mounted `PUT /api/auth/profile` in `local_companion/service.py` updating both guardian details and student profile fields.
  - Updated `GET /api/auth/me` to return both `{"status": "success", "profile": profile, "user": profile}`.
  - Updated `GuardianInfoScreen.tsx`, `EmailNotificationsScreen.tsx`, and `GuardianSupportScreen.tsx` to handle `data.profile || data.user`.
- **Verification:** Tested endpoint response payloads via TestClient; verified password rejection on invalid inputs and guardian data population.

### BUG-P85-010: ExplainabilityScreen Integration
- **Changes:** Imported `ExplainabilityScreen` in `frontend/src/App.tsx`. Routed `effectiveScreen === 'explainability'` directly to `<ExplainabilityScreen />`, presenting model SHAP dynamics, feature importances, and interactive feature impact cards.
- **Verification:** `phase_8_5_full_audit.test.mjs` verifies routing and mounting.

### BUG-P85-011: Logout Event Cleanliness
- **Changes:** In `App.tsx` `handleLogout()`, added `window.dispatchEvent(new CustomEvent('mindora:logout'))` and `sessionStorage.removeItem('mindora_active_game_session_v1')`. The music player immediately halts playback and active game session state is cleared.
- **Verification:** Verified custom event dispatch and storage removal in test suite.

### BUG-P85-012: Personal Journal Persistence
- **Changes:** Updated `PersonalJournalScreen.tsx` to initialize entries from `localStorage.getItem('mindora_personal_journal_entries')` and write on every save or delete operation.
- **Verification:** Entries persist across navigation and browser refreshes.
