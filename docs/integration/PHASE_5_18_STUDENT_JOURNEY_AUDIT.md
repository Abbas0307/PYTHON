# MINDORA 2.0 — PHASE 5.18 STUDENT JOURNEY AUDIT
## Verification of Complete End-to-End User Experience Across All 14 Student Workflows

**Auditors:** Senior UX Architect, Full-Stack QA Engineer & Student Wellbeing Specialist  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  
**Execution Environment:** React Vite Frontend (`http://127.0.0.1:5173`) + FastAPI Backend (`http://127.0.0.1:8000`)

---

## 1. Executive Summary & Audit Mandate

This audit evaluates the end-to-end student experience across all 14 mandatory user journeys. Each journey was inspected for navigation integrity, interactive element responsiveness, empty-state clarity, defensive fallbacks, state persistence, and clinical safeguarding.

---

## 2. 14-Journey Detailed Verification Results

### Journey 1: Register a New Student Account
- **Screen:** `ProfileSettingsScreen.tsx` &rarr; `Create Account` tab.
- **Actions Tested:** Student enters full name, university email, password ($\ge 8$ chars), date of birth, and checks adult confirmation.
- **Backend API:** `POST /api/auth/register`
- **Observed Behavior:** Password hashed server-side with Argon2id ($m=65536, t=3, p=4$). API returns HTTP 200, creates session token, and automatically updates frontend profile badge. Duplicate email cleanly displays: *"An account with this email already exists."*
- **Verdict:** **`PASS`**

### Journey 2: Student Login & Session Initialization
- **Screen:** `ProfileSettingsScreen.tsx` &rarr; `Sign In` tab.
- **Actions Tested:** Student logs in with registered credentials; invalid passwords tested.
- **Backend API:** `POST /api/auth/login`
- **Observed Behavior:** Valid login sets `mindora_auth_token` in `sessionStorage` and restores profile state. Invalid passwords return HTTP 401. Sliding-window rate limiter locks out account on 6th failed attempt within 15 minutes.
- **Verdict:** **`PASS`**

### Journey 3: Open the Dashboard (Initial vs. Locked vs. Unlocked)
- **Screen:** `DashboardScreen.tsx` via Sidebar navigation.
- **Actions Tested:** Navigating to dashboard prior to completing assessment or activating sample preview.
- **Observed Behavior:** Dashboard button in Sidebar is labeled *"Locked"* and disabled until consent and assessment are completed or *"Explore Sample Preview"* is clicked. Prevents unassessed students from viewing blank or misleading risk indicators.
- **Verdict:** **`PASS`**

### Journey 4: Complete a Student Wellness Assessment
- **Screen:** `AssessmentScreen.tsx`.
- **Actions Tested:** Inputting 10 tabular survey features (Age, Gender, Sleep Duration, Dietary Habits, Degree, Academic Pressure, Study Satisfaction, Work Hours, Financial Stress, CGPA) + 9-item PHQ-9.
- **Observed Behavior:** Form validation enforces numeric constraints ($CGPA \in [0.0, 10.0]$, $Age \in [16, 60]$, hours $\in [0, 16]$). Radio buttons for PHQ-9 calculate running total. Cancel button safely returns to welcome screen without unexpected page reloads.
- **Verdict:** **`PASS`**

### Journey 5: View Assessment Result & Transparent Explanation
- **Screen:** `DashboardScreen.tsx` (Top Overview Card).
- **Actions Tested:** Submitting assessment and viewing deterministic results.
- **Observed Behavior:** PHQ-9 severity brackets map strictly to clinical standards (Minimal 0–4, Mild 5–9, Moderate 10–14, Moderately Severe 15–19, Severe 20–27). If Item 9 is positive ($> 0$), prominent Crisis Banner activates immediately with localized helplines regardless of total score.
- **Verdict:** **`PASS`**

### Journey 6: Open the Model Laboratory
- **Screen:** `ModelLabScreen.tsx` (`3. Model Laboratory`).
- **Actions Tested:** Switching between Logistic Regression, Random Forest, XGBoost, and SVM architectures.
- **Observed Behavior:** Displays architecture parameters, training times (LR: 31ms, SVM: 9.48s), confusion matrices, and split distributions across 27,901 records.
- **Verdict:** **`PASS`**

### Journey 7: Explore the Four-Model Comparison Dashboard
- **Screen:** `ModelComparisonScreen.tsx` (`4. Four-Model Comparison`).
- **Actions Tested:** Benchmarking all 11 evaluation dimensions; filtering models by F1-Score, Recall, Accuracy, ROC-AUC, and Brier Score.
- **Observed Behavior:** Reconciled canonical metrics displayed with 100% mathematical fidelity ($TP=2069, FP=470, FN=382, TN=1265$ for XGBoost). Interactive ROC and Calibration curves render smoothly.
- **Verdict:** **`PASS`**

### Journey 8: Open Explainability & Global SHAP Insights
- **Screen:** `ExplainabilityScreen.tsx` (`7. Explainability`).
- **Actions Tested:** Reviewing feature importance rankings and clinical safety disclosures.
- **Observed Behavior:** Highlights Financial Stress ($26.4\%$) and Academic Pressure ($21.8\%$) as top statistical risk drivers, accompanied by prominent non-diagnostic causation disclaimer.
- **Verdict:** **`PASS`**

### Journey 9: Create and Update Personal Focus Goals
- **Screen:** `DashboardScreen.tsx` &rarr; `PersonalGoalsSection.tsx`.
- **Actions Tested:** Adding custom goals (e.g., *"Sleep 8 hours nightly"*), selecting focus tags (Sleep, Focus, Stress), marking goals paused, active, or complete.
- **Observed Behavior:** Saved in browser `localStorage` (`mindora_personalization_prefs`). Real-time alignment triggers adaptive action planner recommendations.
- **Verdict:** **`PASS`**

### Journey 10: Use the Interactive Wellness Studio
- **Screen:** `DashboardScreen.tsx` &rarr; `WellnessStudioSection.tsx`.
- **Actions Tested:** Executing 4-7-8 Guided Breathing, 5-4-3-2-1 Sensory Grounding, Focus Timer (25/5 min), and progressive muscle relaxation.
- **Observed Behavior:** All timers use wall-clock deltas to prevent background tab drift. Muscle relaxation includes mandatory zero-movement alternatives for students with physical restrictions. Sessions logged to in-memory store.
- **Verdict:** **`PASS`**

### Journey 11: Review Personal Insights & Activity Timeline
- **Screen:** `DashboardScreen.tsx` &rarr; `WeeklyPersonalSummarySection.tsx` & `ActivityTimeline.tsx`.
- **Actions Tested:** Filtering activity history by category (Goals, Planner, Studio, Trends) and date range.
- **Observed Behavior:** Factual aggregation of completed actions. Sensitive clinical fields (PHQ-9 responses, diagnostic scores) are strictly excluded from the activity timeline.
- **Verdict:** **`PASS`**

### Journey 12: Open Privacy Data Center & Controlled Deletion
- **Screen:** `DashboardScreen.tsx` &rarr; `PrivacyDataCenter.tsx`.
- **Actions Tested:** Inspecting 6 data categories, reviewing encryption status (AES-256-GCM vault), and testing selective data deletion.
- **Observed Behavior:** Accurate representation of storage locations (LocalStorage, IndexedDB, In-Memory). Deleting planner data wipes only planner memory without collateral damage to encrypted trends vault.
- **Verdict:** **`PASS`**

### Journey 13: Update Profile, Guardian & Accessibility Settings
- **Screen:** `GuardianSupportScreen.tsx` & `AccessibilityPreferencesModal.tsx`.
- **Actions Tested:** Updating guardian contact details, verifying mock code, testing non-diagnostic notification preview, adjusting text scale (90%–125%), and motion preference.
- **Observed Behavior:** Token properly propagated from `sessionStorage`; mock SMS verification code generated and validated; text scaling applies instantly across all components.
- **Verdict:** **`PASS`**

### Journey 14: Student Logout & Session Termination
- **Screen:** `ProfileSettingsScreen.tsx` &rarr; `Log Out of Mindora`.
- **Actions Tested:** Student clicks logout button.
- **Observed Behavior:** Dispatches `POST /api/auth/logout` with Bearer header; server revokes session token; client purges `mindora_auth_token` from `sessionStorage`; user profile state cleanly reset.
- **Verdict:** **`PASS`**

---

## 3. Summary of User Journey Verification

| Journey # | Student Journey Workflow | Primary Component | Result | Notes |
| :---: | :--- | :--- | :---: | :--- |
| **1** | Student Account Registration | `ProfileSettingsScreen.tsx` | **`PASS`** | Argon2id hashing, unique email enforcement |
| **2** | Secure Student Login | `ProfileSettingsScreen.tsx` | **`PASS`** | 256-bit token issued, rate limiter active |
| **3** | Dashboard Access Guard | `Sidebar.tsx` / `DashboardScreen.tsx` | **`PASS`** | Locked until assessment or preview |
| **4** | Wellness Assessment Completion | `AssessmentScreen.tsx` | **`PASS`** | 10 tabular survey inputs + 9 PHQ-9 items |
| **5** | Assessment Result & Safeguard | `DashboardScreen.tsx` | **`PASS`** | Severity brackets + independent Item 9 alert |
| **6** | Model Laboratory Exploration | `ModelLabScreen.tsx` | **`PASS`** | 4 models, parameters, split counts |
| **7** | Four-Model Metric Comparison | `ModelComparisonScreen.tsx` | **`PASS`** | Reconciled canonical metrics (XGB F1 82.93%) |
| **8** | Explainability & Feature Weights | `ExplainabilityScreen.tsx` | **`PASS`** | Global importance + non-diagnostic notice |
| **9** | Personal Goal Management | `PersonalGoalsSection.tsx` | **`PASS`** | Add, edit, pause, complete goals |
| **10** | Interactive Wellness Studio | `WellnessStudioSection.tsx` | **`PASS`** | Breathing, Grounding, Focus Timer, PMR |
| **11** | Personal Summary & Timeline | `ActivityTimeline.tsx` | **`PASS`** | Activity aggregation without clinical data |
| **12** | Privacy Center & Data Erasure | `PrivacyDataCenter.tsx` | **`PASS`** | 6 categories, selective deletion |
| **13** | Profile, Guardian & Accessibility | `GuardianSupportScreen.tsx` | **`PASS`** | Non-diagnostic preview, masked phone display |
| **14** | Secure Student Logout | `ProfileSettingsScreen.tsx` | **`PASS`** | Token revoked server-side & client-side |

**Overall Student Journey Status:** **`PASS` (14/14 Journeys Verified)**
