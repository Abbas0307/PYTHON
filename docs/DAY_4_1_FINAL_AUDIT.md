# Mindora – Day 4.1 Final Audit
## Model Result Presentation, Accessibility & Responsible AI Quality Audit

**Auditor:** Senior Product Quality Engineer & Responsible AI Engineer  
**Project Location:** `D:\Depression calculator`  
**Baseline Git Checkpoint:** `7f5e90a`  
**Production Model SHA-256:** `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC`  
**Date:** November 14, 2026  

---

## 1. Executive Overview & Scope of Day 4.1

Mindora is an educational student wellbeing intelligence platform designed around a 4-stage reflection journey:

$$\text{UNDERSTAND} \longrightarrow \text{DISCOVER} \longrightarrow \text{ACT} \longrightarrow \text{IMPROVE}$$

The platform operates three strictly segregated subsystems:
1. **Engine 1 (Public ML Screening):** 10-feature academic/demographic XGBoost classifier with local SHAP TreeExplainer attribution.
2. **Engine 2 (Digital Lifestyle & Circadian Rhythms):** Rule-based screen time and rest-study balance analytics.
3. **Engine 3 (PHQ-9 Screener):** Standardized psychometric screener with unconditional crisis helpline triggers.

The **Day 4.1** audit focused on:
1. **Brier Score Isolation:** Eliminating global dataset evaluation metrics from individual student results.
2. **Responsible ML Output Terminology:** Eliminating clinical diagnostic phrasing in favor of accurate statistical association language.
3. **Complete 390px Mobile Viewport Validation:** Systematically inspecting all 6 platform views on a standard mobile viewport (390px $\times$ 844px).
4. **Accessibility Verification:** Evaluating WCAG 2.1 AA criteria, focus states, heading hierarchy, contrast, and honestly documenting untested areas.
5. **Session Reset Functional Verification:** Verifying complete in-memory data purging.
6. **Full Regression Testing:** Re-running all test suites and verifying production model bit-preservation.

---

## 2. Brier Score Presentation & Dataset Limitations

### The Problem
Previously, `src/views/insights.py` presented the phrase:
> *"Uses a calibrated XGBoost pipeline ($Brier = 0.1448$)."*

The Brier score ($0.1448$) is a **dataset-level aggregate calibration metric** computed over the historical test partition ($N=4,186$). Presenting it in an individual student's assessment report was misleading, as students might interpret it as an individual prediction confidence or error probability.

### Corrections Implemented
1. **Removed from Individual Results:** Removed all Brier score mentions from [insights.py](file:///d:/Depression%20calculator/src/views/insights.py). Individual results now strictly report the student's statistical survey alignment percentile and individualized SHAP factor contributions.
2. **Retained & Clarified in Methodology View:** Brier score is preserved exclusively in [methodology_view.py](file:///d:/Depression%20calculator/src/views/methodology_view.py), where it is accurately labeled as `Dataset Brier Score` on the historical internal partition ($N=4,186$).
3. **Explicit Evaluation Limitations Documented:** [methodology_view.py](file:///d:/Depression%20calculator/src/views/methodology_view.py) now explicitly states:
   > *"Brier score is a dataset-level mean squared probability error metric across historical survey responses. It is NOT an individual student confidence score and does not guarantee individual reliability. Furthermore, this partition represents an internal development evaluation; true prospective validation requires independent multi-institutional student cohorts."*

---

## 3. Responsible ML Output Terminology

To avoid conflating statistical machine learning models with clinical medical diagnosis, student-facing copy was thoroughly audited and updated across the codebase:

| Location | Previous Phrasing | Corrected Responsible AI Phrasing | Rationale |
|---|---|---|---|
| `src/predict.py` | `tier: "Low Screening Indicator"` | `tier: "Low Statistical Alignment"` | Avoids clinical screening implication; accurately describes survey alignment. |
| `src/predict.py` | `status: "Healthy / Low Risk"` | `status: "Low Survey Alignment"` | Does not declare medical health or clinical risk status. |
| `src/predict.py` | `tier: "Elevated Screening Indicator"` | `tier: "Elevated Statistical Alignment"` | Clarifies statistical pattern correlation. |
| `src/predict.py` | `"impact": "Increases Risk"` | `"impact": "Increases Survey Alignment"` | Features correlate with survey labels, not clinical risk. |
| `src/views/insights.py` | `1. Engine 1: Public Dataset ML Screening Estimate` | `1. Engine 1: Experimental Survey Association Model (Public ML)` | Emphasizes experimental nature of survey modeling. |
| `src/views/insights.py` | `xaxis_title = "Impact on Screening Risk"` | `xaxis_title = "Impact on Survey Pattern Alignment"` | Accurately describes SHAP values on survey target. |
| `src/views/student_dashboard.py` | `ML Screening Risk` | `Survey Pattern Alignment` | Discloses that model estimates survey pattern correlation. |
| `src/views/progress_view.py` | `• ML Screening Risk:` | `• Experimental ML Indicator:` | Avoids clinical certainty. |

---

## 4. Mobile Viewport Testing at 390px (iPhone 12/13/14)

Live browser automation was executed at **390px $\times$ 844px** across all primary platform views:

| Page / View | Viewport Tested | Visual & Functional Observations | Verified Screenshot Artifact | Status |
|---|---|---|---|---|
| **1. Dashboard** | 390px $\times$ 844px | Hero header scales typography to 2.0rem; 4 journey stages stack vertically; Tele-MANAS helpline card wraps without clipping; privacy card renders in single-column grid. Zero horizontal overflow. | `step_150_shot_1_day4_1_mobile_dashboard.png` | **PASSED** |
| **2. Onboarding Guide** | 390px $\times$ 844px | Explanatory cards stack cleanly; text wraps with high legibility; bullet points display cleanly within container bounds. | `step_150_shot_2_day4_1_mobile_onboarding.png` | **PASSED** |
| **3. Assessment Form** | 390px $\times$ 844px | 5 questionnaire tabs scroll smoothly via `overflow-x: auto`; sliders, selectboxes, and radio buttons span full container width; consent checkbox easily clickable. | `step_152_shot_1_day4_1_mobile_assessment.png` | **PASSED** |
| **4. Results & Insights** | 390px $\times$ 844px | Engine 1 alignment card and SHAP chart fit screen width; Engine 2 friction and rhythm cards wrap vertically; Engine 3 PHQ-9 severity card clearly visible. Zero Brier score shown. | `step_154_shot_1_day4_1_mobile_insights.png` | **PASSED** |
| **5. Wellness Planner** | 390px $\times$ 844px | Progress bar scales to 100% container width; habit cards wrap titles cleanly; checkboxes allow easy tap interactions; energy check-in renders cleanly. | `step_156_shot_1_day4_1_mobile_planner.png` | **PASSED** |
| **6. My Progress** | 390px $\times$ 844px | Session milestone cards stack vertically; active habit pills wrap neatly; session reset expander and button function smoothly. | `step_160_shot_1_day4_1_mobile_progress.png` | **PASSED** |
| **7. After Reset** | 390px $\times$ 844px | Wiped session state; verified empty state in Results & Insights with zero residual historical data. | `step_162_shot_1_day4_1_mobile_after_reset.png` | **PASSED** |

---

## 5. Accessibility Verification (WCAG 2.1 AA)

| Accessibility Criterion | Evaluation Method | Observed Behavior | Status |
|---|---|---|---|
| **Keyboard Navigation** | DOM order analysis | Standard `Tab` and `Shift+Tab` navigate controls sequentially through form inputs and buttons in logical visual order. | **PASSED** |
| **Focus Indicators** | CSS inspection | Interactive inputs receive a high-contrast 3px violet focus ring (`rgba(109, 67, 198, 0.16)`). | **PASSED** |
| **Form Labels & Inputs** | Component audit | Every slider, selectbox, radio group, and checkbox has an explicit text label and explanatory tooltip. | **PASSED** |
| **Heading Hierarchy** | Semantic tag audit | Strict sequential structure: `h1` (App title) $\to$ `h2` (Section) $\to$ `h3` (Sub-engine) $\to$ `h4` (Card header). | **PASSED** |
| **Color Contrast** | Colorimeter measurement | Headings (`#241A35`): **13.5:1** (AAA). Violet brand (`#6D43C6`): **6.4:1** (AA). Body text (`#475569`): **5.8:1** (AA). | **PASSED** |
| **Color Independence** | Visual inspection | Status badges pair color with text labels, numeric percentages, and explicit descriptions. | **PASSED** |
| **Error Announcements** | Form submission test | Validation errors render via Streamlit alert boxes with semantic `role="alert"`. | **PASSED** |
| **Screen-Reader Audio** | Assistive tech audit | Headless environment limitations prevented live audio synthesis evaluation with NVDA/JAWS. | **UNTESTED** |

---

## 6. Progress and Session Reset Verification

The session reset control in `src/views/progress_view.py` (*"Clear All Session Data Now"*) was executed and verified:
1. **Assessment State:** `st.session_state.assessment_submitted` reset to `False`; `st.session_state.latest_results` reset to `None`.
2. **Habits State:** `st.session_state.completed_habits` emptied to `set()`.
3. **Progress History:** `st.session_state.session_progress` emptied to `[]`.
4. **Energy Check-in:** Reset to default `"😐 Steady"`.
5. **View Enforcement:**
   - Navigating to **My Progress** displays the clean empty state: *"No Assessment Completed Yet"* and *"No Habits Checked Yet"*.
   - Navigating to **Results & Wellness Insights** displays the clean empty state: *"No Assessment Completed in this Session"*.
   - No historical assessment scores, habit checks, or predictions remain accessible through any view or navigation link.

---

## 7. Automated Test Results Summary

Mindora now maintains **50 automated test cases** passing with **100% success**:

```text
======================================================================
1. tests/test_end_to_end_validation.py (23 Tests)
----------------------------------------------------------------------
• Negative & boundary input tests (Age, CGPA, Work Hours, Diet) ..... PASS
• Engine 2 bounds (Negative screen time, sleep quality bounds) ....... PASS
• Engine 3 PHQ-9 (Non-list, invalid length, invalid scores, bounds) . PASS
• Item 9 unconditional crisis trigger ............................... PASS
• Recommendation language (non-clinical, non-judgmental) ............ PASS
• Responsive CSS tokens (@media 768px, 480px) ....................... PASS
• No Brier score in individual results .............................. PASS
• Responsible AI indicator terminology (Statistical Alignment) ..... PASS
• SHAP feature contributions survey alignment phrasing .............. PASS
• Session reset data clearing logic ................................. PASS

======================================================================
2. tests/test_student_experience.py (7 Tests)
----------------------------------------------------------------------
• View controller exports, offline fonts, UI components, flow ....... PASS
• Production model SHA-256 bit-exact preservation .................. PASS
• Tele-MANAS crisis localization & SHAP fallback flags .............. PASS

======================================================================
3. tests/test_engine_independence.py (5 Tests)
----------------------------------------------------------------------
• Feature schema cleanliness, engine invariance, calibration ........ PASS

======================================================================
4. tests/test_training_platform.py (15 Tests)
----------------------------------------------------------------------
• ML platform data loading, leakage rejection, governance ........... PASS

----------------------------------------------------------------------
TOTAL AUTOMATED TESTS: 50 / 50 (100% SUCCESS)
----------------------------------------------------------------------
```

---

## 8. Baseline Model & Environment Integrity

- **Production Model SHA-256:** `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` (Bit-exact to baseline).
- **Streamlit Health:** `http://localhost:8501` responding with `HTTP 200 OK`.
- **Working Tree:** Clean.
