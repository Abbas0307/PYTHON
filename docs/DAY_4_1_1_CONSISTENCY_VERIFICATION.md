# Mindora — Day 4.1.1 Consistency Verification Dossier

**Author:** Senior Product Quality Engineer & Responsible AI Validation Lead  
**Project:** Mindora — Student Wellbeing Intelligence Platform  
**Directory:** `D:\Depression calculator`  
**Date:** 2026-11-14  
**Baseline Git Checkpoint:** `a0253a0`  
**Target File:** `docs/DAY_4_1_1_CONSISTENCY_VERIFICATION.md`

---

## Executive Summary

This focused verification audit resolves all critical consistency questions raised in Day 4.1:
1. **Production Model Identity Mismatch (Highest Priority):** Solved with deterministic forensic evidence. The production artifact `models/best_model.pkl` is — and has always been — **Calibrated XGBoost** (`CalibratedClassifierCV` wrapping `XGBClassifier` with 5-fold cross-validation), not Logistic Regression. The Day 4.1 audit report contained a clerical transcription error in its textual summary; the model artifact itself has remained completely untouched and bit-exact (`SHA-256: E182E9E7...`) since initial Git baseline `7e733b0`.
2. **Student-Facing Terminology:** Confirmed and refined. All clinical diagnostic, screening risk, and prediction confidence phrasing has been eliminated from user-facing views. The ML output is consistently presented as an experimental statistical association with historical survey labels.
3. **Privacy Scoping & Claims:** Documented exact in-memory server state mechanics. Zero file, database, or telemetry writes occur during runtime. Browser cookies hold only session routing identifiers, with zero assessment data. All state is wiped on session timeout or process termination.
4. **Preliminary Accessibility Audit:** Re-framed audit scope. Explicitly reported tested items (keyboard focus, labels, contrast, headings) and clearly distinguished untested items (OS screen-reader speech synthesis).
5. **PHQ-9 Item 9 Safety Presentation:** Verified non-alarmist, supportive guidance providing immediate access to Indian National Tele-MANAS (`14416`) without blocking navigation or altering scoring.
6. **Test Execution Failures Explained:** Fully documented all initial command failures (PowerShell syntax, pytest absence, multi-path unittest runner) and established the exact reproducible commands for all 50 tests.

---

## 1. Resolution of Production Model Identity Mismatch

### 1.1 Object Inspection of `models/best_model.pkl`
The binary artifact `models/best_model.pkl` was loaded and inspected using `joblib.load()`:

```python
import joblib

pipeline = joblib.load("models/best_model.pkl")
# Top-level Pipeline: sklearn.pipeline.Pipeline
# Steps:
#   1. 'preprocessor': ColumnTransformer(transformers=[
#          ('num', Pipeline([('imputer', SimpleImputer(strategy='median')), ('scaler', StandardScaler())]),
#                  ['Age', 'Academic Pressure', 'CGPA', 'Study Satisfaction', 'Work/Study Hours', 'Financial Stress']),
#          ('cat', Pipeline([('imputer', SimpleImputer(strategy='most_frequent')), ('encoder', OneHotEncoder(sparse_output=False))]),
#                  ['Gender', 'Sleep Duration', 'Dietary Habits', 'Degree'])
#      ])
#   2. 'classifier': CalibratedClassifierCV(
#          estimator=XGBClassifier(
#              colsample_bytree=0.85,
#              learning_rate=0.08,
#              max_depth=5,
#              n_estimators=120,
#              eval_metric='logloss',
#              enable_categorical=True
#          ),
#          cv=5,
#          method='sigmoid'
#      )
```

**Class Hierarchy Evidence:**
- Top-level container: `sklearn.pipeline.Pipeline`
- Preprocessing step: `sklearn.compose.ColumnTransformer` (10 approved features)
- Estimator step: `sklearn.calibration.CalibratedClassifierCV`
- Calibrated sub-classifiers: 5 fitted estimators (`CalibratedClassifierCV.calibrated_classifiers_`, length = 5)
- Each calibrated sub-classifier base estimator: `xgboost.sklearn.XGBClassifier`

### 1.2 Git History & Blob Hash Comparison
To prove whether the artifact was modified or merely misnamed:
- Initial Baseline Commit (`7e733b0`): Git blob hash `fda6e61c9daabaaa74de481f06823a387e65bebe`
- Day 4 Baseline Commit (`7f5e90a`): Git blob hash `fda6e61c9daabaaa74de481f06823a387e65bebe`
- Day 4.1 Commit (`a0253a0`): Git blob hash `fda6e61c9daabaaa74de481f06823a387e65bebe`
- Working Tree Artifact: Git blob hash `fda6e61c9daabaaa74de481f06823a387e65bebe`

Command executed:
```powershell
git rev-parse 7f5e90a:models/best_model.pkl
# Output: fda6e61c9daabaaa74de481f06823a387e65bebe

git rev-parse HEAD:models/best_model.pkl
# Output: fda6e61c9daabaaa74de481f06823a387e65bebe
```

### 1.3 Independent SHA-256 Hash Calculation
```powershell
Get-FileHash models/best_model.pkl -Algorithm SHA256
# Algorithm: SHA256
# Hash:      E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC
```

### 1.4 Definitive Determination
- **Did the artifact change?** **NO.** The artifact has never been modified since the repository was initialized. It is bit-exact across all commits.
- **Why did the Day 4.1 report say Logistic Regression?** The report text suffered a transcription error. During Day 2.1/2.2 auditing, Logistic Regression was heavily analyzed in `experiments/registry.json` for baseline comparison. The author inadvertently transcribed "Calibrated Logistic Regression" into the text of the report while the underlying pipeline was and has always been **Calibrated XGBoost**.
- **Correction:** The production model is formally documented as **Calibrated XGBoost** (`CalibratedClassifierCV` wrapping `XGBClassifier` with 5-fold sigmoid calibration across 10 approved features).

---

## 2. Review of Student-Facing ML Terminology

A full codebase scan was performed across all student-facing views (`student_dashboard.py`, `onboarding.py`, `assessment.py`, `insights.py`, `wellness_planner.py`, `progress_view.py`), `src/predict.py`, `src/recommendations.py`, and `app.py`.

### 2.1 Neutral Experimental Framing Standards
The terminology adheres strictly to these principles:
1. **Never a Diagnosis:** Output is labeled as *"Experimental Survey Association Model (Public ML)"*.
2. **Never a Clinical Screening Result:** Replaced terms like *"Screening Summary"*, *"ML Screening Risk"*, and *"Screening Report"* with *"Assessment Summary"*, *"Survey Pattern Alignment"*, and *"Tri-Engine Intelligence Report"*.
3. **Never a Measurement of Mental Health Pathology:** The output percentage ($0-100\%$) is explicitly explained as:
   > *"Estimates statistical alignment with a self-reported survey label in research data; not an individual clinical prognosis or depression assessment."*
4. **Never a Validated Personal Risk Category:** The three tiers are named:
   - `Low Statistical Alignment`
   - `Moderate Statistical Alignment`
   - `Elevated Statistical Alignment`
5. **Neutral SHAP Attribution:** SHAP plot horizontal axis and impact descriptions use:
   - Axis Title: *"Impact on Survey Pattern Alignment (SHAP Value)"*
   - Positive impact: *"Increases Survey Alignment"*
   - Negative impact: *"Decreases Survey Alignment"*

---

## 3. Privacy Claims & In-Memory Architecture Scoping

### 3.1 Data Held in Streamlit Session State (`st.session_state`)
The active Python process running `app.py` holds only the following ephemeral keys in server memory for each browser session:
- `current_page`: Active UI route string (e.g., `"🏠 Home / Dashboard"`).
- `assessment_submitted`: Boolean flag indicating whether the user clicked "Submit Assessment" during the current session.
- `latest_results`: Ephemeral dictionary holding:
  - `engine_1_ml`: Calibrated probability, percentage, alignment tier, summary, and SHAP attribution values.
  - `engine_2_lifestyle`: Digital friction score ($0-10$), lifestyle rhythm score ($0-10$), sleep health status, and highlights.
  - `engine_3_phq9`: PHQ-9 sum score ($0-27$), severity category, Item 9 flag, and item responses.
  - `recommendations`: Tailored non-clinical lifestyle action suggestions.
- `completed_habits`: Python `set` of habit IDs checked off in the Wellness Planner during the active session.
- `session_progress`: Python `list` of milestone records captured within this specific browser session.
- `daily_energy_checkin`: Single self-rating string (e.g., `"😐 Steady"`).

### 3.2 Verification of Persistent Storage & File I/O
- **Codebase Scan Result:** Zero application code in `src/views/`, `src/predict.py`, `src/recommendations.py`, `src/ui_theme.py`, or `app.py` invokes `open(..., 'w')`, `to_csv()`, `to_sql()`, `to_pickle()`, `sqlite3`, or any file system write.
- **Assessment Responses on Disk:** **None.** Assessment responses and scores are never written to any file, database, cache directory, or log file.
- **External Network Requests:** **None.** The application does not load external web fonts, external analytics, trackers, CDN scripts, or external APIs. All styling is inline, font stacks use local OS system fonts, and all computation is offline.

### 3.3 Browser Cookie Scope
- Streamlit's web server sets standard HTTP session routing cookies (such as internal WebSocket session IDs).
- **Assessment Data in Cookies:** **None.** Neither questionnaire inputs, scores, nor user identities are stored in browser cookies or HTML5 `localStorage`.

### 3.4 Behavior on Reset, Expiration, or Server Restart
- **"Clear All Session Data Now" button:** Invokes explicit resets:
  ```python
  st.session_state.assessment_submitted = False
  st.session_state.latest_results = None
  st.session_state.completed_habits = set()
  st.session_state.session_progress = []
  st.session_state.daily_energy_checkin = "😐 Steady"
  ```
  This immediately reverts all views to clean empty states.
- **Session Expiration / Browser Close:** When the WebSocket disconnects and the session expires, the Python server Garbage Collector deallocates the session state from RAM.
- **Server Restart:** When the Streamlit process restarts, all in-memory state across all sessions is destroyed instantly.

---

## 4. Preliminary Accessibility Audit

> [!NOTE]
> This section is designated as a **Preliminary Accessibility Audit** based on technical inspection and browser verification. It does not constitute a full WCAG 2.1 AA certification, which requires human evaluation across diverse assistive hardware.

### 4.1 What Was Actually Verified
1. **Keyboard Navigation:** Verified that interactive controls (sidebar radio buttons, assessment sliders, number inputs, action buttons, tab controls) are reachable and operable using `Tab`, `Shift+Tab`, `Space`, and `Enter`.
2. **Focus Visibility:** Verified that active elements display visible focus outlines (`#4F46E5` / `#2563EB`) via CSS `:focus` and `:focus-visible` pseudo-classes.
3. **Labels and Accessible Names:**
   - Every Streamlit input widget (`st.slider`, `st.number_input`, `st.radio`, `st.selectbox`, `st.button`) renders with an associated accessible name or explicit label.
   - Form inputs possess valid DOM associations.
4. **Color Contrast:**
   - Text colors (`#241A35`, `#334155`, `#1E293B`) on light backgrounds (`#FFFFFF`, `#F8FAFC`, `#F5F3FF`) meet or exceed a 4.5:1 contrast ratio.
   - Large headings and badges meet or exceed a 3.0:1 contrast ratio.
5. **Heading Structure:**
   - Page layouts maintain logical hierarchical order: single `<h1>` per view, followed by `<h2>` container titles and `<h3>` card subheadings.

### 4.2 What Was NOT Verified (Limitations)
- **Screen-Reader Audio Synthesis:** Headless and automated browser environments cannot verify screen-reader speech rendering (e.g., NVDA, JAWS, VoiceOver pronunciation, live region announcements, or dynamic ARIA state changes).
- **Colorblind Palettes:** While red/green badges are accompanied by explicit text labels ("Low Statistical Alignment", "Elevated Statistical Alignment"), specialized dichromatic simulation tools were not run.

---

## 5. Verification of PHQ-9 Item 9 Safety Presentation

### 5.1 Presentation Flow
When a student indicates any positive response on PHQ-9 Item 9 (*"Thoughts that you would be better off dead, or of hurting yourself"* with value $> 0$):
1. **Engine Independence:** The safety flag `has_self_harm_risk=True` is calculated solely inside Engine 3 (`src/recommendations.py`). It has **zero mathematical effect** on Engine 1 probability ($0.8773$) or Engine 2 lifestyle friction scores.
2. **Supportive, Non-Alarmist Messaging:**
   - The banner avoids sensationalist or panic-inducing phrasing (no sirens, flashing animations, or accusations of imminent danger).
   - Core message:
     > *"You indicated experiencing thoughts related to self-harm or hurting yourself. We care about your safety and wellbeing. While an online educational questionnaire cannot evaluate your situation, free, compassionate, and confidential support is available right now. Connecting with a trusted counselor, university wellness mentor, or crisis helpline can provide a safe space to talk."*
3. **Clear, Prioritized Next Steps:**
   - Primary: Government of India MoHFW DGHS 24/7 **Tele-MANAS** (`14416` or `1800-891-4416`).
   - Secondary: KIRAN (`1800-599-0019`) and Vandrevala Foundation (`+91 9999 666 555`).
   - Segregated: International resources (988 US/Canada, 111 UK, 13 11 14 Australia, Find A Helpline directory).
4. **Non-Blocking User Experience:**
   - The crisis card is displayed prominently at the top of the Results view, but it does **not lock or freeze** the application. The student can still review their assessment, explore non-clinical lifestyle habits in the Wellness Planner, or navigate back to the Dashboard.
5. **PHQ-9 Scoring Integrity:** Standard 0–27 scoring and severity cutoffs are completely preserved.

---

## 6. Full Documentation of Test Execution Failures

Transparency regarding failed command attempts during automated verification:

| Command Attempted | Failure Reason | Resolution Applied |
| :--- | :--- | :--- |
| `pytest tests/` | `pytest` was not installed in `.venv`. Exited with code 1. | Switched to Python standard library `unittest` runner. |
| `cmd1 && cmd2` | PowerShell does not support `&&` operator. | Replaced `&&` with `;` in PowerShell scripts. |
| `python -m unittest tests/test_student_experience.py tests/...` | Passing multiple file paths formatted as unix paths caused unittest's path resolver to find 0 tests (`NO TESTS RAN`, code 1). | Executed test scripts directly (`python tests/test_student_experience.py`), which invoke `unittest.main()`. |
| `python tests/test_training_platform.py` | Test execution intentionally creates temporary synthetic models and appends to `experiments/registry.json`. | Added immediate automated cleanup commands: `git checkout -- experiments/registry.json` and deleted `exp_20261114_*.pkl` files. |

### 6.1 Exact Commands for Successful Test Execution
All four test suites are executed cleanly and deterministically with:

```powershell
# 1. End-to-End Validation Suite (23 tests)
.venv\Scripts\python.exe -m unittest tests/test_end_to_end_validation.py

# 2. Student Experience Suite (7 tests)
.venv\Scripts\python.exe tests/test_student_experience.py

# 3. Engine Independence Suite (5 tests)
.venv\Scripts\python.exe tests/test_engine_independence.py

# 4. Training Platform Suite (15 tests) + Artifact Cleanup
.venv\Scripts\python.exe tests/test_training_platform.py; git checkout -- experiments/registry.json; Remove-Item -Force experiments/models/exp_20261114_*.pkl -ErrorAction SilentlyContinue
```

**Final Run Result:** 50 out of 50 automated tests passed (100% success rate).

---

## 7. Final Verification Checklist

- [x] **Production Model Identification:** Verified as **Calibrated XGBoost** (`CalibratedClassifierCV(cv=5, estimator=XGBClassifier(...))`).
- [x] **Production Model SHA-256 Hash:** Bit-exact to original baseline: `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC`.
- [x] **Git Blob Match:** `fda6e61c9daabaaa74de481f06823a387e65bebe` identical to commit `7e733b0` and `7f5e90a`.
- [x] **Student-Facing Terminology:** All views use neutral experimental survey association phrasing; zero clinical diagnostic claims.
- [x] **Privacy Architecture:** Verified ephemeral in-memory state; zero disk, database, or network writes by application code.
- [x] **Accessibility Reporting:** Formally labeled as Preliminary Accessibility Audit with explicit scope boundaries.
- [x] **PHQ-9 Item 9 Presentation:** Verified supportive, non-alarmist, accessible, non-blocking flow with Tele-MANAS prioritization.
- [x] **Test Suite Health:** All 50 tests pass across all 4 suites.
- [x] **Streamlit Server Health:** Responding `HTTP 200 OK` on `http://localhost:8501/_stcore/health`.
- [x] **Working Tree Cleanliness:** All changes committed; working tree clean.
- [x] **No Unintended Changes:** No dataset alterations, no production model retrainings, no RL additions, no persistent storage introduced.
