# Mindora 2.0 — Phase 5.9: Smart Action Planner

**Date:** 2026-11-16  
**Role:** Senior React/TypeScript Engineer, Product Architect, Privacy Engineer & UX Designer  
**Status:** Feature 2 Fully Implemented, Verified & Audited

---

## 1. Architecture Overview

The **Smart Action Planner** is an educational productivity and daily routine self-reflection feature built directly into the Mindora 2.0 React + Vite frontend. It enables university students to build sustainable daily habits through manageable, achievable micro-actions without clinical diagnostic labeling, anxiety-inducing pressure, or cloud telemetry.

```
+----------------------------------------------------------------------------------------------------+
|                                    MINDORA 2.0 DASHBOARD                                           |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | [Feature 1] Weekly Wellbeing Trends (Optional Check-Ins, 1-5 Non-Diagnostic Scales)           |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                | (Optional in-memory check-in read)                 |
|                                                v                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | [Feature 2] Smart Action Planner Section (Daily Habits & Guided Micro-Steps)                 |  |
|  |                                                                                              |  |
|  |  [Active Focus Pills]: "🎯 Improve study consistency"  "🎯 Take regular breaks"  [Edit Goals] |  |
|  |                                                                                              |  |
|  |  [Daily Progress Bar & Metrics]:                                                            |  |
|  |    - Today's Progress: 1 of 3 completed (33%)                                                |  |
|  |    - Estimated Time: 40 mins total (25m invested)                                            |  |
|  |    - Remaining Balance: 2 pending actions                                                    |  |
|  |                                                                                              |  |
|  |  [Action Cards Grid]:                                                                        |  |
|  |    * Card 1: 25-Min Focused Study Sprint (Study & Focus | 25m | High Priority | Done)         |  |
|  |    * Card 2: 5-Min Box Breathing Reset (Relaxation | 5m | Medium Priority | Pending)          |  |
|  |    * Card 3: Top-3 Academic Priorities Triage (Study & Focus | 10m | Low Priority | Pending) |  |
|  |                                                                                              |  |
|  |  [Weekly Reflection Card]:                                                                   |  |
|  |    - Weekly Consistency Tier: "Building Momentum" (1-5 actions finished this week)            |  |
|  |    - Most Frequent Dimension: "Study & Focus"                                                |  |
|  |    - Friendly Reflection: "Small, consistent actions build sustainable study routines."      |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                |                                                    |
|                                                v                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Modular Engines & In-Memory Isolation:                                                       |  |
|  |   - plannerContract.ts: Strict input validation, zero clinical fields permitted              |  |
|  |   - actionLibrary.ts: 30 curated collegiate actions across 6 balanced dimensions             |  |
|  |   - plannerEngine.ts: 100% deterministic rules & explainable thresholds                      |  |
|  |   - plannerStorage.ts: In-memory session state, export to JSON, zero localStorage plaintext  |  |
|  +----------------------------------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Files Created and Modified

### Created Files
1. `frontend/src/contracts/plannerContract.ts`: Typed contracts for action categories, student goals, daily plan state, progress metrics, and strict security validation against prohibited clinical properties (`phq9Answers`, `item9`, `depression`, `severity`, `riskTier`).
2. `frontend/src/engines/actionLibrary.ts`: 30 curated, distinct collegiate habit actions across 6 categories (5 per category) with duration, difficulty, instructions, safety notes, and rationale templates.
3. `frontend/src/engines/plannerEngine.ts`: Deterministic recommendation rules, progress calculation functions, weekly summary aggregation, and ISO week boundary utilities.
4. `frontend/src/storage/vault/plannerStorage.ts`: In-memory privacy-first storage manager with task completion tracking, dismissals, goal updates, count preferences, and JSON export.
5. `frontend/src/components/planner/ActionCard.tsx`: Polished rounded card component with duration/category badges, priority indicator, "Why this was suggested" accordion, instructions trigger, and Done/Skip/Postpone/Dismiss buttons.
6. `frontend/src/components/planner/ActionInstructionsModal.tsx`: Accessible dialog (`role="dialog"`, `aria-modal="true"`) displaying step-by-step guidance, preparation micro-steps, duration badges, and practical tips.
7. `frontend/src/components/planner/GoalsModal.tsx`: Accessible modal for student goal selection, daily action count preference selector (2 to 5), and trends personalization toggle.
8. `frontend/src/components/planner/SmartActionPlannerSection.tsx`: Master dashboard container integrating header, active goal pills, daily progress cards, action cards grid, weekly summary reflection, and modals.
9. `frontend/test/phase_5_9_action_planner.test.mjs`: Comprehensive test suite containing 16 unit and integration tests.

### Modified Files
1. `frontend/src/pages/DashboardScreen.tsx`: Integrated `<SmartActionPlannerSection isPreviewMode={isPreviewMode} />` right below `<WeeklyTrendsSection />`.
2. `frontend/package.json`: Added `test/phase_5_9_action_planner.test.mjs` to `npm test` script.

---

## 3. Recommendation Rules and Thresholds

All recommendations are 100% deterministic, explainable, and non-diagnostic. Every card displays a transparent explanation answering *"Why this was suggested"*.

| Rule ID | Trigger Condition | Target Categories | Priority | Rationale Displayed to Student |
| :--- | :--- | :--- | :--- | :--- |
| **Rule 1: Low Sleep Quality** | `checkIn.sleepQuality <= 2` | `Sleep Routine`, `Relaxation` | `high` | *"Suggested because your latest sleep quality reflection was in the lower range ({val}/5)."* |
| **Rule 2: High Academic Pressure** | `checkIn.academicPressure >= 4` | `Time Management`, `Study & Focus` | `high` | *"Suggested because your latest academic pressure reflection indicated elevated deadlines ({val}/5)."* |
| **Rule 3: Low Study Satisfaction** | `checkIn.studySatisfaction <= 2` | `Study & Focus` | `medium` | *"Suggested because your study satisfaction reflection showed friction in learning momentum ({val}/5)."* |
| **Rule 4: Low Daily Energy** | `checkIn.dailyEnergy <= 2` | `Daily Movement`, `Relaxation` | `high` | *"Suggested because your daily energy reflection was low ({val}/5). Gentle movement or rest helps recharge."* |
| **Rule 5: Low Routine Balance** | `checkIn.routineBalance <= 2` | `Personal Routine`, `Time Management` | `medium` | *"Suggested because your routine balance reflection showed scheduling congestion ({val}/5)."* |
| **Goal-Driven Rules** | Student explicitly selects focus goals | Aligned target categories | `high` / `medium` | *"Suggested to advance your personal goal: '{goalLabel}'."* |
| **Balanced Fallback** | No check-in history or personalization disabled | Category rotation (`Study`, `Movement`, `Routine`, `Relaxation`, `Time`, `Sleep`) | `low` | *"Suggested as a foundational habit to support daily collegiate routine balance."* |

---

## 4. Action Library Details

The library contains **30 distinct, typed actions** across all 6 collegiate dimensions (5 actions per category):

1. **Study & Focus (5 actions)**:
   - `act-study-pomodoro-25`: 25-Minute Focused Study Sprint (25 min, easy)
   - `act-study-three-priorities`: Top-3 Academic Priorities Triage (10 min, easy)
   - `act-study-active-recall-15`: 15-Minute Concept Self-Quiz (15 min, moderate)
   - `act-study-desk-declutter`: Visual Study Space Reset (5 min, easy)
   - `act-study-chunk-milestone`: Deconstruct a Large Assignment (15 min, moderate)
2. **Sleep Routine (5 actions)**:
   - `act-sleep-digital-sundown`: 30-Minute Screen Wind-Down (30 min, moderate)
   - `act-sleep-brain-dump`: Bedtime Worry & Task Journal (5 min, easy)
   - `act-sleep-warm-beverage`: Calming Herbal Tea or Warm Water (10 min, easy)
   - `act-sleep-room-ventilation`: Sleep Sanctuary Cool & Dark Prep (5 min, easy)
   - `act-sleep-consistent-wake`: Consistent Morning Anchor Commitment (5 min, moderate)
3. **Relaxation (5 actions)**:
   - `act-relax-box-breathing`: 5-Minute Box Breathing Reset (5 min, easy)
   - `act-relax-body-scan`: 5-Minute Progressive Muscle Release (5 min, easy)
   - `act-relax-sensory-grounding`: 5-4-3-2-1 Sensory Grounding Break (5 min, easy)
   - `act-relax-music-immersion`: 10-Minute Lo-Fi or Ambient Pause (10 min, easy)
   - `act-relax-nature-gazing`: 20-20-20 Eye & Sky Rest Break (5 min, easy)
4. **Daily Movement (5 actions)**:
   - `act-move-campus-stroll`: 10-Minute Outdoor Fresh Air Walk (10 min, easy)
   - `act-move-spine-mobility`: Desk Spine Mobility & Hip Stretch (5 min, easy)
   - `act-move-stair-climb`: Quick 2-Flight Stair Exploration (5 min, easy)
   - `act-move-wrist-finger-stretch`: Typing & Mouse Wrist Decompression (5 min, easy)
   - `act-move-hydration-walk`: Stand-and-Refill Water Mission (5 min, easy)
5. **Personal Routine (5 actions)**:
   - `act-routine-morning-intention`: 3-Minute Morning Pace Check-In (5 min, easy)
   - `act-routine-screen-free-meal`: Screen-Free Nourishment Pause (20 min, moderate)
   - `act-routine-evening-shutdown`: Evening Academic Shutdown Ritual (10 min, moderate)
   - `act-routine-social-connection`: Brief Check-In With a Friend or Peer (10 min, easy)
   - `act-routine-room-air-sunlight`: Morning Natural Light Exposure (10 min, easy)
6. **Time Management (5 actions)**:
   - `act-time-block-tomorrow`: Calendar Time-Blocking for Hardest Task (10 min, moderate)
   - `act-time-two-minute-rule`: 2-Minute Admin Task Blitz (10 min, easy)
   - `act-time-buffer-allocation`: Add 15-Minute Buffers Between Study Blocks (5 min, easy)
   - `act-time-deadline-mapping`: Visual 7-Day Deadline Horizon Map (10 min, easy)
   - `act-time-say-no-triage`: Protect Your Study Boundaries (5 min, moderate)

---

## 5. Visual Verification & Screenshots

Verification was executed via browser subagent against the running Vite dev server (`http://127.0.0.1:5173`). Evidence files are stored in `feature_2_evidence/`:

- **Planner Header, Focus Pills & Daily Progress Cards**:  
  `feature_2_evidence/planner_header_and_progress.png`  
  *Shows section banner, "Educational Productivity" and "In-Memory Privacy" badges, active focus goal pills, and the 3 progress cards (0 of 3 completed, 40m estimated, 3 pending).*
- **Action Cards with Accordion & Buttons**:  
  `feature_2_evidence/action_cards_and_accordion.png`  
  *Shows the 3 cards with priority badges, duration badges, expanded "Why this was suggested" rationale, and action buttons.*
- **Action Instructions Modal**:  
  `feature_2_evidence/action_instructions_modal.png`  
  *Shows accessible modal with step-by-step guidance, duration, category, practical guidance box, and completion toggle.*
- **Goals & Pace Modal (Focus Goals)**:  
  `feature_2_evidence/goals_modal_focus_goals.png`  
  *Shows focus goals checklist with interactive checkboxes and student-first control.*
- **Goals & Pace Modal (Target Actions & Personalization Toggle)**:  
  `feature_2_evidence/goals_modal_pace_and_toggle.png`  
  *Shows Target Daily Actions selector [2, 3, 4, 5], personalization toggle switch, and privacy guarantee.*
- **Completed Action Card & Progress Bar Update**:  
  `feature_2_evidence/completed_action_card.png` & `feature_2_evidence/updated_progress_bar.png`  
  *Shows action transitioned into green completed state with "Completed today" badge, progress bar updating to 33%, and 25m invested.*
- **Weekly Reflection Card**:  
  `feature_2_evidence/weekly_reflection_card.png`  
  *Shows weekly reflection updating with consistency tier ("Getting Started"), top category ("Study & Focus"), and gentle reflection text.*

---

## 6. Privacy and Storage Implementation

In accordance with prompt instructions:
- **Default In-Memory Isolation**: All planner state (active plan, completed task history, dismissed action IDs, goal preferences) is kept strictly in volatile JavaScript heap memory (`plannerStorage.ts`).
- **Zero Plaintext Storage**: Plaintext action history is **never** written to `localStorage` or `sessionStorage`.
- **Zero External Telemetry**: Purely client-side execution with zero external network requests, zero analytics, and zero LLM API calls.
- **Weekly Trends Vault Preservation**: The existing encrypted IndexedDB vault (`mindora_vault_db`) is dedicated to Weekly Trends (`trends_vault_v1`) with 600,000 PBKDF2 iterations. It was **not** overloaded or altered, guaranteeing 100% backward compatibility and zero risk of schema corruption.
- **Portable JSON Export**: Students can download a full `.json` copy of their daily plan, progress, and completed history directly to their local disk via the "Export Plan" button.

---

## 7. Automated Test Execution & Results

### 7.1 Smart Action Planner Test Suite (`frontend/test/phase_5_9_action_planner.test.mjs`)

```
✔ Action Library: Curated collection contains >= 25 distinct, typed collegiate actions (26.0ms)
✔ Recommendation Engine: Rule 1 triggers Sleep Routine for low sleep quality (<= 2) (7.1ms)
✔ Recommendation Engine: Rule 2 triggers Time Management or Study Chunking for high pressure (>= 4) (0.3ms)
✔ Recommendation Engine: Rule 3 triggers Study & Focus for low study satisfaction (<= 2) (0.2ms)
✔ Recommendation Engine: Rule 4 triggers Movement or Rest for low daily energy (<= 2) (0.2ms)
✔ Recommendation Engine: Rule 5 triggers Routine or Buffer action for low routine balance (<= 2) (0.2ms)
✔ Fresh Student Baseline: Gracefully generates balanced recommendations without check-in history (0.3ms)
✔ Student Goals: Prioritizes actions aligned with student-selected focus goals (0.2ms)
✔ Deduplication & Count: Never duplicates actions and adheres to preferred daily count [2, 5] (0.4ms)
✔ Dismissal: Dismissed actions are excluded and replaced to maintain preferred count (9.1ms)
✔ Task Tracking: Mark complete, skip, postpone, and undo behave deterministically (0.6ms)
✔ Weekly Summary: Calculates accurate completion counts, top category, and consistency tier (0.3ms)
✔ Privacy Boundary: Prohibits clinical depression fields in planner contracts (0.8ms)
✔ Storage & Export: Supports JSON export while maintaining in-memory isolation (0.4ms)
✔ Vault Compatibility: Weekly Trends 600,000 PBKDF2 vault remains functional and untampered (154.2ms)
✔ Component Integration: SmartActionPlannerSection is properly integrated in DashboardScreen (0.6ms)

Total tests: 16 | Passed: 16 | Failed: 0 | Duration: 275ms
```

### 7.2 Full Frontend Unit Test Suite (`npm test`)

```
Total tests: 77 | Passed: 77 | Failed: 0 | Duration: 878ms
All 9 test modules executed cleanly with 0 failures:
- test/frontend_unit.test.mjs (14 tests)
- test/phase_5_1_product_integration.test.mjs (9 tests)
- test/phase_5_2_resource_navigator.test.mjs (5 tests)
- test/phase_5_3_end_to_end_acceptance.test.mjs (7 tests)
- test/phase_5_3_1_defect_remediation.test.mjs (5 tests)
- test/phase_5_4_local_companion.test.mjs (4 tests)
- test/phase_5_4_2_sw_isolation.test.mjs (3 tests)
- test/phase_5_8_weekly_trends.test.mjs (13 tests)
- test/phase_5_9_action_planner.test.mjs (16 tests)
```

---

## 8. Production Build Result

Executed: `npm run build` in `frontend/`:
```
> mindora-frontend@2.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1609 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.87 kB │ gzip:   0.49 kB
dist/assets/index-BhCBxFj_.css   52.44 kB │ gzip:   9.01 kB
dist/assets/index-DL3WF17b.js   404.92 kB │ gzip: 111.38 kB
✓ built in 2.32s
```
Zero TypeScript errors, zero bundler warnings.

---

## 9. Frozen Research Asset Hash Verification

All 11 frozen research asset SHA-256 hashes were re-verified against the immutable reference manifest:

| Asset Path | Expected SHA-256 Hash | Status |
| :--- | :--- | :--- |
| `app.py` | `5F15ADD9F3A5F5809D80154931E98A5B79D06BBC9BB69323028BFA3898E46BBE` | **Verified Match** |
| `dataset/Student_Depression_Dataset.csv` | `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` | **Verified Match** |
| `shared/contracts/feature_contract.json` | `BED161ED06A50F528BBFE9316FF9A979771A1CFA8EE8C9CD48CF9466E442FFB0` | **Verified Match** |
| `ml_lab/splits/group_aware_partition_manifest.json` | `A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070` | **Verified Match** |
| `ml_lab/splits/partition_assignments.csv` | `91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1` | **Verified Match** |
| `models/best_model.pkl` | `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` | **Verified Match** |
| `ml_lab/experiments/stage_3b_2/oof_metrics.json` | `361BC700A7731678402BCE89B7A85051181DC877430A3FE30AA114EC2C0A6FEF` | **Verified Match** |
| `ml_lab/experiments/stage_3b_3/oof_metrics.json` | `555D3B159A31A5C6F6964143F040A97F8BECC938FCB9690986A9B856F9DC2A03` | **Verified Match** |
| `ml_lab/experiments/stage_3b_3/model_comparison.json` | `FC8E31D45DEE28D3925A80627268299D185AE68D6C1DE092167EE23A7F6286E7` | **Verified Match** |
| `ml_lab/experiments/stage_3b_4/stage_3b_4_metrics.json` | `FBB9AAEB5D0A12E46FE74BF9EDA71AA3140C130E384DCF47A35AABCED25CC7C6` | **Verified Match** |
| `ml_lab/experiments/stage_3b_4/artifact_manifest.json` | `B1385C3A03015A470911CC432012E418BD3AD0E505A52C0CF92C22D8290FB072` | **Verified Match** |

All 11 assets are 100% untampered and preserved.

---

## 10. Outstanding Limitations

1. **Session Scope for Action Tracking**: Because planner history is kept strictly in volatile client memory by default (to avoid modifying the existing Weekly Trends vault schema or writing plaintext to localStorage), daily plan progress resets on hard page refresh unless the student exports their plan via JSON.
2. **Offline-Only Execution**: The planner does not synchronize actions across devices, which protects student privacy but requires manual export if moving between laptop and desktop.
3. **Non-Clinical Boundary**: The planner provides habit scaffolding only; it explicitly does not replace professional guidance or mental health crisis pathways.
