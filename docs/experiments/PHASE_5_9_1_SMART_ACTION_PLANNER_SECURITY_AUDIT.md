# Mindora 2.0 — Phase 5.9.1: Independent Security & Functional Audit
## Feature 2: Smart Action Planner

**Date:** 2026-11-16  
**Auditor:** Senior Application Security Engineer, Privacy Auditor & Software Architect  
**Audit Scope:** Independent, READ-ONLY audit of Phase 5.9 Smart Action Planner  
**Project Location:** `D:\Depression calculator`  
**Working Branch:** `mindora-2.0-rebuild`  

---

## 1. Executive Summary

An independent, read-only functional, architectural, cryptographic, and security audit of the **Smart Action Planner** (Feature 2) was conducted across the source code, tests, and runtime build of Mindora 2.0.

The implementation successfully fulfills its core architectural and privacy boundaries:
- **Zero Clinical Deprecation**: Complete segregation from PHQ-9 scoring, Item 9 safety triggers, crisis dispatch pathways, and depression severity tiers.
- **In-Memory Privacy Guarantee**: Active action plans, completed history, and student preferences reside 100% in volatile client memory with zero writes to `localStorage`, `sessionStorage`, or external cloud servers.
- **Encrypted Local Vault Protection**: The existing `mindora_vault_db` Weekly Trends encrypted vault was not mutated or overloaded, preserving its 600,000 PBKDF2 iteration architecture.
- **Offline Invariant**: Zero network egress to external APIs, analytics, or background LLM services.

However, the audit identified **one High-severity functional defect** and several Medium/Low UX and accessibility issues that require remediation before authorizing a public student-facing release:
1. **High Severity (Defect)**: `generateDailyRecommendations` clamps its `count` parameter to a minimum of 2 (`Math.max(2, ...)`). When helper routines in `plannerStorage.ts` (such as `dismissAction` or `setGoals`) request 1 replacement action or 0 actions (when all tasks are completed), the engine forces at least 2 recommendations, causing the active plan to overflow the student's target count (e.g., expanding from 3 to 4 or 5 items). This causes a repeatable test failure in `phase_5_9_action_planner.test.mjs`.
2. **Medium Severity (Timezone / Date Boundary)**: Use of `new Date().toISOString().split('T')[0]` produces UTC calendar dates rather than local calendar dates, causing premature or delayed day transitions for non-UTC student timezones.
3. **Low Severity (Suitability Advisory)**: The bedtime warm beverage action lacks an explicit advisory regarding herbal allergies and medication interactions.
4. **Low Severity (Accessibility)**: `GoalsModal.tsx` lacks an `Escape` key dismiss listener and body scroll-lock.
5. **Low Severity (UX)**: "Reset Today's Plan" executes immediately without a destructive confirmation dialog.

---

## 2. Files Inspected

The audit inspected all relevant frontend source files, contracts, tests, and configuration:

| Component / File Path | Responsibility | Lines | Status |
| :--- | :--- | :--- | :--- |
| `frontend/src/contracts/plannerContract.ts` | Data schema, category definitions, student goals, and clinical field rejection logic | 191 | Audited |
| `frontend/src/engines/actionLibrary.ts` | 30 curated collegiate actions across 6 balanced life dimensions | 562 | Audited |
| `frontend/src/engines/plannerEngine.ts` | Deterministic recommendation engine, progress math, weekly summary aggregator | 338 | Audited |
| `frontend/src/storage/vault/plannerStorage.ts` | In-memory storage manager, task completion, dismissal, goals, and JSON export | 387 | Audited |
| `frontend/src/components/planner/ActionCard.tsx` | Interactive action card with category/duration badges, rationale accordion, actions | 225 | Audited |
| `frontend/src/components/planner/ActionInstructionsModal.tsx` | Step-by-step guidance modal dialog with safety notes and keyboard accessibility | 145 | Audited |
| `frontend/src/components/planner/GoalsModal.tsx` | Focus goals checklist, daily action target selector, personalization toggle | 218 | Audited |
| `frontend/src/components/planner/SmartActionPlannerSection.tsx` | Master dashboard section container, daily progress cards, weekly reflection card | 423 | Audited |
| `frontend/src/pages/DashboardScreen.tsx` | Dashboard integration and prop isolation boundary | 507 | Audited |
| `frontend/test/phase_5_9_action_planner.test.mjs` | Automated test suite for Phase 5.9 | 450 | Audited |
| `frontend/package.json` | Dependency definitions and npm test script configuration | 27 | Audited |

---

## 3. Recommendation Engine Findings

### 3.1 Indicator Threshold Verification
All five Weekly Trends indicators were independently tested across all boundary ratings $[1, 2, 3, 4, 5]$:

| Indicator | Defined Rule Threshold | Actual Trigger Condition in Code | Boundary Test $[1..5]$ Results |
| :--- | :--- | :--- | :--- |
| **Sleep Quality** | $\le 2$ (Low) | `checkIn.sleepQuality <= 2` | 1, 2 trigger Rule A; 3, 4, 5 do not trigger. **Verified.** |
| **Academic Pressure** | $\ge 4$ (Elevated) | `checkIn.academicPressure >= 4` | 4, 5 trigger Rule B; 1, 2, 3 do not trigger. **Verified.** |
| **Study Satisfaction** | $\le 2$ (Low) | `checkIn.studySatisfaction <= 2` | 1, 2 trigger Rule C; 3, 4, 5 do not trigger. **Verified.** |
| **Daily Energy** | $\le 2$ (Low) | `checkIn.dailyEnergy <= 2` | 1, 2 trigger Rule D; 3, 4, 5 do not trigger. **Verified.** |
| **Routine Balance** | $\le 2$ (Low) | `checkIn.routineBalance <= 2` | 1, 2 trigger Rule E; 3, 4, 5 do not trigger. **Verified.** |

### 3.2 Simultaneous Rule Triggering
When all five indicators trigger simultaneously (e.g., Sleep=1, Pressure=5, Satisfaction=1, Energy=1, Routine=1):
- The engine evaluates rules sequentially: Sleep $\to$ Pressure $\to$ Study $\to$ Energy $\to$ Routine.
- If the student's target count is 3, items are sliced deterministically: `matchedItems.slice(0, 3)`. Rules A, B, and C are included; D and E are deferred.
- If target count is 5, all 5 reflection-driven rules are included.
- **Finding**: While deterministic and explainable, when multiple rules trigger, Sleep and Academic Pressure always take precedence over Daily Energy and Routine Balance. This should be documented in student-facing guidance.

### 3.3 Personalization Toggle Behavior
When `personalizationEnabled` is toggled to `false`:
- Reflection-driven rules are bypassed completely (`if (personalizationEnabled && latestCheckIn)`).
- Recommendations are populated strictly from student-selected focus goals and balanced foundational habits.
- Every rationale displays *"Suggested to advance your personal goal"* or *"Suggested as a foundational habit"*. No reflection scores are referenced. **Verified.**

### 3.4 Missing Check-in History (Fresh User Experience)
When `latestCheckIn` is `null` (or student has never completed a weekly check-in):
- The engine falls back to rotating through balanced collegiate dimensions: `Study & Focus` $\to$ `Daily Movement` $\to$ `Personal Routine` $\to$ `Relaxation` $\to$ `Time Management` $\to$ `Sleep Routine`.
- Zero NaN or undefined errors occur. **Verified.**

---

## 4. Action Library Audit

### 4.1 Structural & Content Verification
- **Total Actions**: Exactly **30 actions** (exceeds the minimum requirement of 25).
- **Categories**: All 6 categories contain exactly 5 distinct actions each.
- **Uniqueness**: All 30 actions possess unique string IDs (e.g., `act-study-pomodoro-25`, `act-sleep-digital-sundown`).
- **Durations**: Range from 5 to 30 minutes, representing manageable collegiate micro-habits.
- **Difficulty**: All actions are classified as either `easy` (23 actions) or `moderate` (7 actions).
- **Safety / Clinical Neutrality**: All 30 actions were scanned for clinical claims, medication references, or sleep deprivation advice:
  - Zero mentions of antidepressants, SSRIs, or medical treatments.
  - Zero recommendations suggesting sleeping less or sacrificing sleep for coursework.
  - Every action includes practical, step-by-step numbered instructions.

### 4.2 Herbal Beverage Action Review (`act-sleep-warm-beverage`)
- **Title**: *"Calming Herbal Tea or Warm Water"*
- **Current Guidance**: Suggests caffeine-free options (chamomile, peppermint, rooibos) or warm water.
- **Audit Observation**: The current `safetyOrSuitabilityNote` states: *"Avoid caffeinated beverages (coffee, energy drinks, black tea) within 6 hours of bed."*
- **Deficiency**: While it avoids medical claims, it does not explicitly advise students with botanical allergies or medical interactions to choose plain warm water.
- **Recommendation**: Add a clear note: *"Herbal teas are non-medical comfort rituals. Plain warm water is equally effective if you have herb sensitivities, allergies, or dietary restrictions."*

---

## 5. Progress, Storage & Date Logic Findings

### 5.1 Plan Item Overflow on Dismissal (High Severity Bug)
In `frontend/src/engines/plannerEngine.ts`:
```typescript
export function generateDailyRecommendations(params: RecommendationEngineParams): DailyPlanItem[] {
  const { ... preferredDailyCount = 3 ... } = params;
  const count = Math.max(2, Math.min(5, preferredDailyCount)); // <-- FORCES MINIMUM OF 2
```
In `frontend/src/storage/vault/plannerStorage.ts`:
```typescript
dismissAction(actionId: string): void {
  const remainingItems = plan.items.filter((i) => i.actionId !== actionId);
  const needed = plan.preferredDailyCount - remainingItems.length; // When 1 dismissed, needed = 1
  if (needed > 0) {
    const replacements = generateDailyRecommendations({
      ...
      preferredDailyCount: needed, // Passes 1
    });
    remainingItems.push(...replacements); // Pushes 2 items because Math.max(2, 1) = 2!
  }
}
```
**Evidence of Failure**:
Running `node --test test/phase_5_9_action_planner.test.mjs`:
```
✖ Dismissal: Dismissed actions are excluded and replaced to maintain preferred count (8.5ms)
  AssertionError [ERR_ASSERTION]: Must maintain preferred count of 3
  4 !== 3
```
When dismissing 1 action from a 3-action plan:
1. `remainingItems.length` becomes 2.
2. `needed` is calculated as $3 - 2 = 1$.
3. `generateDailyRecommendations` is called with `preferredDailyCount: 1`.
4. `Math.max(2, Math.min(5, 1))` evaluates to **2**.
5. The engine returns 2 items instead of 1.
6. `remainingItems.push(...replacements)` adds 2 items to the 2 remaining, creating **4 active items**.

**Additional Impact on Completed Plans**:
If all 3 items are completed and `setGoals` is subsequently invoked, `neededCount = Math.max(0, 3 - 3) = 0`. Calling `generateDailyRecommendations({ preferredDailyCount: 0 })` returns 2 items, expanding the plan to 5 items.

**Recommended Remediation**:
1. In `plannerEngine.ts`, update `count`:
   ```typescript
   const count = Math.max(0, Math.min(5, preferredDailyCount));
   if (count === 0) return [];
   ```
2. In `plannerStorage.ts`, ensure `remainingItems` is sliced to `plan.preferredDailyCount`:
   ```typescript
   activePlanState = {
     ...plan,
     items: remainingItems.slice(0, plan.preferredDailyCount),
     dismissedActionIds: dismissed
   };
   ```

### 5.2 Local vs UTC Calendar Date Discrepancy (Medium Severity)
In `plannerStorage.ts` and `plannerEngine.ts`:
```typescript
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
```
`new Date().toISOString()` returns the current date in UTC. For students in timezones ahead of UTC (e.g. IST UTC+5:30, AEST UTC+10) or behind UTC (e.g. EST UTC-5, PST UTC-8):
- In India (UTC+5:30) at 3:00 AM on November 16, UTC is 9:30 PM on November 15. The planner registers the plan date as `2026-11-15`.
- In California (UTC-8) at 6:00 PM on November 15, UTC is 2:00 AM on November 16. The planner registers `2026-11-16`.

**Recommended Remediation**:
Use a timezone-aware local date formatter:
```typescript
function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### 5.3 ISO Week Calculation & Year Boundaries
`getISOWeekIdentifier` was tested across edge-case calendar dates:
- `2026-01-01` (Thursday) $\to$ `2026-W01` (Correct)
- `2026-12-31` (Thursday) $\to$ `2026-W53` (Correct)
- `2027-01-01` (Friday) $\to$ `2026-W53` (Correct)
- `2027-01-04` (Monday) $\to$ `2027-W01` (Correct)
- `2026-11-16` (Monday) $\to$ `2026-W47` (Correct)

The ISO-8601 calculation matches `trendsContract.ts` exactly.

### 5.4 Progress Mathematical Boundaries
`computeDailyProgress` was evaluated with edge cases:
- Empty plan ($0$ items): `completionPercentage = 0` (no divide-by-zero or `NaN`).
- Completed count exceeds total (defensive): Clamped to $100\%$.
- Negative values: Impossible by schema.

---

## 6. Privacy and Storage Audit — High Priority

### 6.1 In-Memory Storage Verification
A comprehensive grep was executed across all planner files (`plannerContract.ts`, `actionLibrary.ts`, `plannerEngine.ts`, `plannerStorage.ts`, `ActionCard.tsx`, `ActionInstructionsModal.tsx`, `GoalsModal.tsx`, `SmartActionPlannerSection.tsx`):
- `localStorage` references: **0**
- `sessionStorage` references: **0**
- `indexedDB` references: **0**
- `document.cookie` references: **0**

Planner state (`activePlanState` and `completedHistory`) exists exclusively in private JavaScript heap memory. Refreshing or closing the tab clears all transient planner state unless exported.

### 6.2 Weekly Trends Encrypted Vault Boundary
- `plannerStorage.ts` imports `trendStorage.ts` strictly to call `trendStorage.getCheckIns()`.
- `trendStorage.getCheckIns()` returns a shallow copy of volatile check-ins in memory.
- `plannerStorage` does **not** call `persistToVault`, `saveCheckIn`, or `deleteEncryptedVault`.
- The encrypted database (`mindora_vault_db`, `RECORD_ID = 'trends_vault_v1'`) and its 600,000 PBKDF2 iterations remain completely untouched and isolated.

### 6.3 Clinical Data Segregation & Component Props
In `frontend/src/pages/DashboardScreen.tsx`:
```tsx
{/* Feature 2: Smart Action Planner */}
<SmartActionPlannerSection isPreviewMode={isPreviewMode} />
```
The ONLY prop received by `SmartActionPlannerSection` is `isPreviewMode: boolean`.
- `features` (student survey responses): **Not passed**
- `phq9Result` (PHQ-9 score, Item 9, severity, risk tier): **Not passed**
- `onOpenCrisis`: **Not passed**
- `habitChecklist`: **Not passed**

The planner cannot access, inspect, or receive clinical mental health data or crisis triggers.

### 6.4 Export Security
- `exportData()` produces a `.json` file containing only public routine titles, completion dates, and progress stats.
- It contains zero passwords, encryption keys, or clinical scores.
- **Finding**: The UI button reads "Export Plan" and triggers immediate download. Adding an inline disclaimer clarifying that the exported file is unencrypted plain text JSON is recommended.

---

## 7. Network and Offline Audit

Network traffic was recorded and analyzed during the browser subagent test session (43 navigation and interaction steps on `http://127.0.0.1:5173`):
- Visited Origins: `http://127.0.0.1:5173` (Local Vite Dev Server).
- Blocked Origins: **None**.
- External Network Requests: **0** (Zero calls to external domains, CDNs, or telemetry endpoints).
- Local Backend Requests: **0** (Zero calls to FastAPI daemon on `127.0.0.1:8000` or Ollama on `127.0.0.1:11434`).
- Codebase Search: Zero instances of `fetch`, `XMLHttpRequest`, `navigator.sendBeacon`, or `WebSocket` in planner source.

**Conclusion**: The Smart Action Planner is 100% offline-capable and leak-free.

---

## 8. Frontend Security and Accessibility

### 8.1 XSS and HTML Rendering
- Zero occurrences of `dangerouslySetInnerHTML`, `innerHTML`, or `eval()`.
- All text strings and rationales are safely escaped through standard React JSX expressions.

### 8.2 Modal Dialog Accessibility
- `ActionInstructionsModal.tsx`:
  - Contains `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-action-title"`.
  - Implements `Escape` key listener.
  - Locks background scroll (`document.body.style.overflow = 'hidden'`).
- `GoalsModal.tsx`:
  - Contains `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-goals-title"`.
  - **Deficiency**: Does **not** implement an `Escape` key listener or body scroll lock.
  - **Recommendation**: Add standard `Escape` listener and overflow lock to `GoalsModal.tsx`.

### 8.3 Screen Reader & Contrast
- Progress bar includes full ARIA attributes: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Daily Actions Completion Rate"`.
- Buttons possess explicit `aria-label` attributes (e.g. `aria-label="Mark 25-Minute Focused Study Sprint as completed"`).
- Color contrast meets WCAG 2.1 AA standards (high-contrast text: `text-mindora-darkText`, `text-emerald-950`, `text-slate-700`).

---

## 9. Test Execution & Build Verification

### 9.1 Phase 5.9 Feature Test Suite (`node --test test/phase_5_9_action_planner.test.mjs`)
- **Total Tests**: 16
- **Passed**: 15
- **Failed**: 1 (`Dismissal: Dismissed actions are excluded and replaced to maintain preferred count`)
- **Skipped / Cancelled**: 0
- **Duration**: 265ms
- **Failure Cause**: `AssertionError: Must maintain preferred count of 3 (4 !== 3)` due to the `Math.max(2, ...)` clamping defect identified in Section 5.1.

### 9.2 Full Frontend Unit Test Suite (`npm test`)
- **Command**: `node --test test/frontend_unit.test.mjs test/phase_5_1_product_integration.test.mjs test/phase_5_2_resource_navigator.test.mjs test/phase_5_3_end_to_end_acceptance.test.mjs test/phase_5_3_1_defect_remediation.test.mjs test/phase_5_4_local_companion.test.mjs test/phase_5_4_2_sw_isolation.test.mjs test/phase_5_8_weekly_trends.test.mjs test/phase_5_9_action_planner.test.mjs`
- **Total Tests**: 77
- **Passed**: 76
- **Failed**: 1 (the dismissal count defect in Phase 5.9 test)
- **Exit Code**: 1

All pre-existing test suites (Phases 5.1, 5.2, 5.3, 5.3.1, 5.4, 5.4.2, 5.8) passed with 100% pass rates. Zero regression occurred in pre-existing features.

### 9.3 Production Build (`npm run build`)
- **Command**: `tsc && vite build`
- **Result**: Success (Exit code: 0)
- **Output**:
  - `dist/index.html` (0.87 kB)
  - `dist/assets/index-BhCBxFj_.css` (52.44 kB, gzip: 9.01 kB)
  - `dist/assets/index-DL3WF17b.js` (404.92 kB, gzip: 111.38 kB)
  - Build Duration: 2.48s
  - Zero TypeScript compilation errors.

---

## 10. Research Asset and Git Preservation

### 10.1 Frozen Research Asset SHA-256 Verification

| Asset Path | Expected SHA-256 Hash | Actual Computed Hash | Match |
| :--- | :--- | :--- | :--- |
| `app.py` | `5F15ADD9F3A5F5809D80154931E98A5B79D06BBC9BB69323028BFA3898E46BBE` | `5F15ADD9F3A5F5809D80154931E98A5B79D06BBC9BB69323028BFA3898E46BBE` | **YES** |
| `dataset/Student_Depression_Dataset.csv` | `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` | `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` | **YES** |
| `shared/contracts/feature_contract.json` | `BED161ED06A50F528BBFE9316FF9A979771A1CFA8EE8C9CD48CF9466E442FFB0` | `BED161ED06A50F528BBFE9316FF9A979771A1CFA8EE8C9CD48CF9466E442FFB0` | **YES** |
| `ml_lab/splits/group_aware_partition_manifest.json` | `A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070` | `A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070` | **YES** |
| `ml_lab/splits/partition_assignments.csv` | `91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1` | `91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1` | **YES** |
| `models/best_model.pkl` | `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` | `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` | **YES** |
| `ml_lab/experiments/stage_3b_2/oof_metrics.json` | `361BC700A7731678402BCE89B7A85051181DC877430A3FE30AA114EC2C0A6FEF` | `361BC700A7731678402BCE89B7A85051181DC877430A3FE30AA114EC2C0A6FEF` | **YES** |
| `ml_lab/experiments/stage_3b_3/oof_metrics.json` | `555D3B159A31A5C6F6964143F040A97F8BECC938FCB9690986A9B856F9DC2A03` | `555D3B159A31A5C6F6964143F040A97F8BECC938FCB9690986A9B856F9DC2A03` | **YES** |
| `ml_lab/experiments/stage_3b_3/model_comparison.json` | `FC8E31D45DEE28D3925A80627268299D185AE68D6C1DE092167EE23A7F6286E7` | `FC8E31D45DEE28D3925A80627268299D185AE68D6C1DE092167EE23A7F6286E7` | **YES** |
| `ml_lab/experiments/stage_3b_4/stage_3b_4_metrics.json` | `FBB9AAEB5D0A12E46FE74BF9EDA71AA3140C130E384DCF47A35AABCED25CC7C6` | `FBB9AAEB5D0A12E46FE74BF9EDA71AA3140C130E384DCF47A35AABCED25CC7C6` | **YES** |
| `ml_lab/experiments/stage_3b_4/artifact_manifest.json` | `B1385C3A03015A470911CC432012E418BD3AD0E505A52C0CF92C22D8290FB072` | `B1385C3A03015A470911CC432012E418BD3AD0E505A52C0CF92C22D8290FB072` | **YES** |

All 11 assets are 100% matched and preserved.

### 10.2 Git Status Verification
`git status --short` confirmed before and after:
- The 9 Day 12 pre-existing tracked modified files remain untouched.
- All untracked research models and directories remain intact.
- Zero commits, resets, cleans, stashes, or restores occurred during this audit.

---

## 11. Findings Classification Matrix

| Finding ID | Classification | Component | Description | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-5.9.1-01** | **High** | `plannerEngine.ts` / `plannerStorage.ts` | Recommendation engine clamps `count` to `Math.max(2, ...)`. Dismissals and goal updates requesting 1 or 0 items return 2 items, causing plan items to exceed student preference. | Test failure; student daily plan exceeds preferred action limit (e.g. 4 or 5 actions instead of 3). |
| **SEC-5.9.1-02** | **Medium** | `plannerStorage.ts` / `plannerEngine.ts` | Uses `new Date().toISOString().split('T')[0]` (UTC date) rather than user's local calendar date. | Students in non-UTC timezones experience calendar date mismatch or early day rollovers during late evening or early morning. |
| **SEC-5.9.1-03** | **Low** | `actionLibrary.ts` | `act-sleep-warm-beverage` lacks explicit advisory regarding botanical allergies and dietary/medication interactions. | Potential confusion if a student assumes herbal infusions are universally safe or clinically therapeutic. |
| **SEC-5.9.1-04** | **Low** | `GoalsModal.tsx` | Missing `Escape` key event listener and background scroll lock (`overflow: hidden`). | Minor accessibility inconsistency compared to `ActionInstructionsModal.tsx`. |
| **SEC-5.9.1-05** | **Low** | `GoalsModal.tsx` | "Reset Today's Plan" executes immediately without confirmation prompt. | Accidental click wipes completed daily actions without recovery option. |
| **SEC-5.9.1-06** | **Informational** | `SmartActionPlannerSection.tsx` | "Export Plan" downloads unencrypted plain text JSON without an inline disclosure banner. | Student may assume exported file is encrypted like the `.enc` vault backup. |

---

## 12. Precise Remediation Recommendations

### Remediation for SEC-5.9.1-01 (High):
In `frontend/src/engines/plannerEngine.ts`:
Change line 61:
```typescript
// Allow count to reach 0 or 1 when fulfilling partial delta requests
const count = Math.max(0, Math.min(5, preferredDailyCount));
if (count === 0) return [];
```
In `frontend/src/storage/vault/plannerStorage.ts`:
In `dismissAction`, `setGoals`, `setPreferredDailyCount`, and `regeneratePendingItems`, clamp the final plan array:
```typescript
activePlanState = {
  ...plan,
  items: remainingItems.slice(0, plan.preferredDailyCount),
  dismissedActionIds: dismissed
};
```

### Remediation for SEC-5.9.1-02 (Medium):
Replace `getTodayDateString()` with a local calendar date formatter:
```typescript
function getLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

### Remediation for SEC-5.9.1-03 (Low):
In `frontend/src/engines/actionLibrary.ts` (`act-sleep-warm-beverage`):
Update `safetyOrSuitabilityNote`:
```typescript
safetyOrSuitabilityNote: 'Herbal infusions are non-medical comfort rituals. Avoid caffeine within 6 hours of sleep. If you have herb sensitivities, allergies, or take medications, plain warm water is equally effective.'
```

### Remediation for SEC-5.9.1-04 (Low):
In `frontend/src/components/planner/GoalsModal.tsx`:
Add standard `useEffect` listener for `Escape` key and scroll lock.

### Remediation for SEC-5.9.1-05 (Low):
In `frontend/src/components/planner/GoalsModal.tsx`:
Add a simple confirmation check before executing `onResetPlan()`.

---

## 13. Readiness Decision

| Deployment Target | Approval Status | Rationale |
| :--- | :--- | :--- |
| **Local Prototype / Engineering Dev** | **APPROVED** | In-memory privacy, zero cloud egress, and complete separation from PHQ-9 verified. Safe for local development and demonstration. |
| **Personal Use** | **CONDITIONAL** | Approved provided the user accepts that task dismissal can temporarily show 4 actions instead of 3. |
| **Public Student-Facing Production Release** | **NOT AUTHORIZED (GATE HOLD)** | **Blocked by SEC-5.9.1-01 (unit test failure in `npm test`)**. Per release gate criteria, no production deployment may proceed with failing tests or plan overflow defects. Remediation must be implemented and independently re-verified. |

---

## 14. Stopping Condition Confirmation

This audit was conducted strictly in **READ-ONLY** mode. Zero source files, tests, datasets, or Git references were modified. All findings, evidence, and remediation specifications are documented above for user authorization.
