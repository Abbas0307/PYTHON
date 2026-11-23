# MINDORA 2.0 — PHASE 8.5 INITIAL FULL APPLICATION BUG AUDIT
**Comprehensive Pre-Implementation Discovery & Quality Audit**

Date: 2026-11-18  
Scope: Entire Mindora 2.0 Application (`frontend/` and `backend/`)  
Author: Senior Application Security & Full-Stack QA Auditor

---

## 1. AUDIT OVERVIEW & METHODOLOGY

Prior to modifying existing application assets, an exhaustive source-level and runtime inspection was conducted across the frontend components, API service definitions, database schemas, and data pipelines. The objective was to identify all existing architectural defects, route failures, incomplete integrations, and user experience friction points.

---

## 2. COMPREHENSIVE BUG REGISTER

### BUG-P85-001: Ambient Music Direction Contains Unwanted Nature Recordings
- **Feature / Page:** `frontend/src/pages/AmbientMusicScreen.tsx` / `frontend/src/context/MusicPlayerContext.tsx`
- **Description:** Ambient music library contains rain, forest, and ocean recordings (`rain_ambience.wav`, `ocean_waves.wav`, `nature_sounds.wav`) which the user explicitly rejected in favor of soft, relaxing instrumental music.
- **Steps to Reproduce:**
  1. Open Ambient Music Screen (`#ambient_music`).
  2. Inspect tracks 3, 4, 5: they are rain/nature sound synthesis rather than musical instrumental compositions.
- **Root Cause:** Phase 8 synthesized generic nature noise loops instead of genuine melodic instrumental tracks.
- **Severity:** High
- **Proposed Fix:** Replace all tracks with 6 pure instrumental music categories:
  1. Soft Piano
  2. Ambient Instrumental
  3. Lo-fi Calm
  4. Meditation Instrumental
  5. Peaceful Guitar
  6. Focus Music
  Document all assets in `public/audio/LICENSE.md`.
- **Verification Test:** Test audio playback for all 6 tracks; verify each category features melodic/harmonic instrumental textures with zero rain, ocean, or bird sound effects.

---

### BUG-P85-002: Music Player UI Missing Standard Controls (Previous/Next/Stop/Repeat/Shuffle/Progress)
- **Feature / Page:** `frontend/src/components/music/CompactMusicPlayer.tsx` / `frontend/src/pages/AmbientMusicScreen.tsx`
- **Description:** The player UI lacks essential media controls: Previous Track, Next Track, Stop, Repeat, Shuffle, and a seekable Progress Bar displaying current elapsed time and total duration.
- **Steps to Reproduce:**
  1. Inspect `CompactMusicPlayer.tsx` and `AmbientMusicScreen.tsx`.
  2. Note only Play, Pause, Volume, and Track dropdown are present.
- **Root Cause:** Phase 8 implemented minimal playback controls without full audio player state machinery.
- **Severity:** Medium
- **Proposed Fix:** Re-engineer the music player interface with a clean white-and-violet aesthetic, full transport controls (Previous, Play/Pause, Next, Stop), playback mode toggles (Repeat, Shuffle), and an interactive seekable progress bar with accurate time formatting (`mm:ss`).
- **Verification Test:** Verify seeking, skipping tracks, stopping, looping, and shuffling across all 6 tracks.

---

### BUG-P85-003: Snake Game Rapid Input Direction Inversion and Multiple Interval Loops
- **Feature / Page:** `frontend/src/components/games/SnakeGame.tsx`
- **Description:** Rapid keyboard input (e.g., quickly tapping Right then Down before a tick) can cause the snake to reverse into its own body or register turns incorrectly. Additionally, `food` is in the `useEffect` dependency array, causing the main game interval loop to be torn down and recreated every time food is eaten. Side-effects were also placed inside the `setSnake` state updater.
- **Steps to Reproduce:**
  1. Start Snake game.
  2. While moving Up, quickly press Left then Down within 100ms.
  3. The snake turns directly into its neck and triggers game over.
- **Root Cause:** Direction updates were not buffered into a per-tick FIFO queue, and `useEffect` recreated the interval on state mutations.
- **Severity:** High
- **Proposed Fix:** Implement a strict input queue (`inputQueueRef`) that consumes only one valid 90-degree turn per tick. Remove `food` and score side-effects from the interval effect, and isolate board rendering from animation ticks.
- **Verification Test:** Test rapid keystroke sequences; verify 180-degree self-inversion is impossible and game loop runs smoothly without dropped ticks.

---

### BUG-P85-004: Block Puzzle Game Missing Game-Over Detection, Piece Rotation, and Hover Previews
- **Feature / Page:** `frontend/src/components/games/BlockGame.tsx`
- **Description:** When the 10x10 board fills up and none of the 3 available pieces can be placed, the game fails to detect game-over, leaving the player permanently stuck. The game also lacks piece rotation and placement hover previews.
- **Steps to Reproduce:**
  1. Fill the board until no 3-block piece can be placed.
  2. Observe that no game-over overlay appears and the player has no way to reset without clicking Reset.
- **Root Cause:** No post-placement `checkGameOver` method was implemented to evaluate whether `canPlacePiece` is false for all remaining pieces at all board coordinates.
- **Severity:** High
- **Proposed Fix:** Add an authoritative `checkGameOver()` evaluator that runs after every piece placement. Add block rotation controls, hover ghost preview showing where a selected piece will land, and responsive touch controls.
- **Verification Test:** Fill board until no moves remain; verify game over modal automatically appears with score summary and restart action.

---

### BUG-P85-005: 163-Record Depression Data Analyzer Missing Interactive Student Profile Analysis Form
- **Feature / Page:** `frontend/src/pages/RealWorldDatasetScreen.tsx` / `local_companion/service.py`
- **Description:** The research analyzer lacks the dedicated Interactive Student Profile Analysis form allowing users to input the 10 survey features (Age, Gender, Dietary Habits, Degree, CGPA, Academic Pressure, Study Satisfaction, Sleep Duration, Daily Study Hours, Financial Stress), validate entries, compare against aggregate cohort distributions, and view research-only exploratory probability estimates with the mandatory notice: *"EXPLORATORY RESEARCH ESTIMATE — NOT A DEPRESSION DIAGNOSIS OR CLINICAL SCREENING RESULT."*
- **Steps to Reproduce:**
  1. Open `#real_world_163`.
  2. Observe only passive tabs (Overview, Associations, Target, Models, Exports) exist; no interactive student profile comparison form is present.
- **Root Cause:** Profile comparison functionality was omitted from the initial Phase 8 implementation.
- **Severity:** Critical
- **Proposed Fix:** Implement a dedicated interactive profile analysis tab in `RealWorldDatasetScreen.tsx` and add backend endpoint `POST /api/research/163-dataset/profile-compare` with complete input validation and cohort percentile comparisons.
- **Verification Test:** Enter sample student feature profile, submit form, and verify aggregate distribution percentiles and non-diagnostic research disclosures.

---

### BUG-P85-006: Missing `ml_lab/real_world_analyzer.py` Module
- **Feature / Page:** `ml_lab/real_world_analyzer.py`
- **Description:** The user specification explicitly requested a research data loading and analysis service module at `ml_lab/real_world_analyzer.py`. The file was placed only in `src/data_platform/real_world_analyzer.py`.
- **Steps to Reproduce:**
  1. Check for `ml_lab/real_world_analyzer.py`. File does not exist.
- **Root Cause:** Module was placed in `src/data_platform/` instead of `ml_lab/`.
- **Severity:** Medium
- **Proposed Fix:** Create `ml_lab/real_world_analyzer.py` providing the authoritative dataset loader, exploratory association engine, 4-model cross-validation runner, and interactive profile comparator.
- **Verification Test:** Import `ml_lab.real_world_analyzer` in test suites and verify all methods execute without errors.

---

### BUG-P85-007: Guardian Contact Information Not Loaded from `/api/auth/me`
- **Feature / Page:** `frontend/src/pages/GuardianInfoScreen.tsx`, `EmailNotificationsScreen.tsx`, `GuardianSupportScreen.tsx`
- **Description:** Guardian details (name, email, phone, verification status) fail to display on these screens upon page load.
- **Steps to Reproduce:**
  1. Log in as an onboarded student.
  2. Navigate to Guardian Information (`#guardian_info`) or Email Notifications (`#email_notifications`).
  3. Notice input fields are blank even though guardian data exists in the database.
- **Root Cause:** Frontend code checks `if (data.status === 'success' && data.user)` but `/api/auth/me` returns `data.profile`.
- **Severity:** High
- **Proposed Fix:** Update code to check `const user = data.profile || data.user;` across all three screens.
- **Verification Test:** Log in and open `#guardian_info`; verify verified email, phone, and relationship populate correctly.

---

### BUG-P85-008: Missing `/api/auth/change-password` Endpoint
- **Feature / Page:** `frontend/src/pages/PrivacySecurityScreen.tsx` / `local_companion/service.py`
- **Description:** Submitting the change password form in Privacy & Security sends `POST /api/auth/change-password`, returning 404 Not Found.
- **Steps to Reproduce:**
  1. Open `#privacy_security`.
  2. Enter current password and new password; submit form.
  3. Observe error: "Network connection error while changing password" / 404 in console.
- **Root Cause:** Endpoint `/api/auth/change-password` was never implemented in `service.py`, and `AuthManager` lacks a `change_password` method.
- **Severity:** High
- **Proposed Fix:** Add `change_password(user_id, current_pwd, new_pwd)` to `AuthManager` verifying the current password using Argon2id and updating to the new hashed password. Mount `POST /api/auth/change-password` in `service.py`.
- **Verification Test:** Submit password change with correct and incorrect current passwords; verify proper success and rejection responses.

---

### BUG-P85-009: Missing `/api/auth/profile` Route for Guardian Detail Updates
- **Feature / Page:** `frontend/src/pages/GuardianInfoScreen.tsx` / `local_companion/service.py`
- **Description:** Submitting updated guardian details in `GuardianInfoScreen.tsx` sends `PUT /api/auth/profile`, which does not exist in `service.py`.
- **Steps to Reproduce:**
  1. Open `#guardian_info`, click Edit, change relationship or phone, click Save.
  2. Observe 404 Not Found error in console.
- **Root Cause:** The endpoint in `service.py` is named `/api/guardian/update` rather than `/api/auth/profile`.
- **Severity:** High
- **Proposed Fix:** Support both routes: add `PUT /api/auth/profile` in `service.py` delegating to `AUTH_MANAGER.update_guardian()`, and update `GuardianInfoScreen.tsx` to target `/api/guardian/update`.
- **Verification Test:** Edit guardian details on `#guardian_info` and verify persistence in database.

---

### BUG-P85-010: Orphaned `ExplainabilityScreen.tsx` Component
- **Feature / Page:** `frontend/src/App.tsx`
- **Description:** Clicking "Explainability & SHAP" (`#explainability`) in the sidebar renders `RiskInsightsScreen` instead of `ExplainabilityScreen`, leaving `ExplainabilityScreen.tsx` orphaned and unmounted.
- **Steps to Reproduce:**
  1. Click on "Explainability & SHAP" under ML RESEARCH LAB in the sidebar.
  2. Observe that the title and content are from `RiskInsightsScreen` instead of the dedicated SHAP explainability page.
- **Root Cause:** `App.tsx` maps `#explainability` to `RiskInsightsScreen` and does not import `ExplainabilityScreen`.
- **Severity:** Medium
- **Proposed Fix:** Import `ExplainabilityScreen` in `App.tsx` and render it when `effectiveScreen === 'explainability'`.
- **Verification Test:** Navigate to `#explainability`; verify dedicated Model Explainability & Feature Dynamics screen renders.

---

### BUG-P85-011: Logout Does Not Stop Background Audio or Clear Active Game Sessions
- **Feature / Page:** `frontend/src/App.tsx` (`handleLogout`)
- **Description:** Clicking Logout in the header clears auth tokens but fails to stop the background audio player and leaves active game sessions in `sessionStorage`.
- **Steps to Reproduce:**
  1. Start playing ambient music and start a 5-minute game session.
  2. Click user avatar -> Logout in the top-right header.
  3. Audio continues playing in background on the Login screen, and `mindora_active_game_session_v1` remains in `sessionStorage`.
- **Root Cause:** `handleLogout` does not dispatch `mindora:logout` and does not remove the game session storage key.
- **Severity:** Medium
- **Proposed Fix:** Add `window.dispatchEvent(new CustomEvent('mindora:logout'))` and `sessionStorage.removeItem('mindora_active_game_session_v1')` to `handleLogout`.
- **Verification Test:** Log out while music is playing; verify audio stops immediately and game session is cleared.

---

### BUG-P85-012: Personal Journal Reflections Lost on Page Navigation or Refresh
- **Feature / Page:** `frontend/src/pages/PersonalJournalScreen.tsx`
- **Description:** Student journal reflections are stored purely in component memory state. Navigating to another page and returning resets the entries to default sample data.
- **Steps to Reproduce:**
  1. Open `#personal_journal`.
  2. Write a reflection and click "Save Private Entry".
  3. Navigate to `#dashboard` and back to `#personal_journal`.
  4. The saved entry is gone.
- **Root Cause:** `PersonalJournalScreen.tsx` lacks `localStorage` persistence.
- **Severity:** Medium
- **Proposed Fix:** Implement persistent read/write to `localStorage` (`mindora_personal_journal_entries`) so students retain their reflection history.
- **Verification Test:** Save a journal entry, refresh page, and verify the entry remains listed.

---

## 3. AUDIT CONCLUSION & IMPLEMENTATION ROADMAP

With all 12 initial defects documented, implementation proceeds in sequence:
1. **Part 2:** Redesign Ambient Music with 6 pure instrumental tracks and full transport controls.
2. **Part 3:** Rebuild Snake Game (input queue, no self-inversion) and Block Puzzle (game-over evaluator, rotation, hover preview) with strict 5-minute timer.
3. **Part 4:** Build the complete 163-Record Depression Data Analyzer with `ml_lab/real_world_analyzer.py`, full bivariate charts, and interactive student profile comparison form.
4. **Part 5:** Fix all identified routing, endpoint, and component bugs across all website sections.
5. **Part 6 & 7:** Execute automated test suites, browser E2E verification, and iterative regression cycles.
