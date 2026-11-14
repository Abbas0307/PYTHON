# MINDORA — DAY 10 AUDIT REPORT
## Recommendation Intelligence Quality, Explainability & Reliability Audit

**Document Version:** 1.0.0  
**Date:** November 14, 2026  
**Auditor:** Senior Recommendation Systems Architect & Behavioral Product Designer  
**Project:** Mindora — AI-Powered Student Wellbeing Intelligence Platform  
**Repository Directory:** `D:\Depression calculator`  
**Production Model SHA-256:** `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` (`models/best_model.pkl`)

---

## 1. Existing Recommendation Architecture

Mindora's recommendation engine resides primarily in [`src/recommendations.py`](file:///d:/Depression%20calculator/src/recommendations.py) and is consumed across [`src/views/insights.py`](file:///d:/Depression%20calculator/src/views/insights.py), [`src/views/wellness_planner.py`](file:///d:/Depression%20calculator/src/views/wellness_planner.py), and [`src/session_utils.py`](file:///d:/Depression%20calculator/src/session_utils.py).

The recommendation system is structured around an educational rule-based intelligence framework across 8 recognized wellbeing domains:
1. **Academic Wellbeing** (`acad_chunking`, `acad_mentorship`, `acad_hourly_break`)
2. **Sleep and Daily Routine** (`sleep_winddown`, `sleep_anchor`)
3. **Digital Wellbeing** (`digital_focus`, `digital_curate`)
4. **Physical Wellbeing** (`phys_sunlight_walk`, `phys_hydration`)
5. **Nutrition and Daily Habits** (`nutri_steady_fuel`)
6. **Social Connection** (`soc_peer_connection`)
7. **Financial and Academic Support** (`fin_support_resources`)
8. **Professional Support Resources** (`prof_crisis_telemanas`, `prof_counseling`)

### Execution Pipeline
```
[User Assessment Inputs (Survey + Lifestyle)] + [PHQ-9 Aggregate Score & Item 9]
                                  │
                                  ▼
           [Domain Rule Evaluation (Zero-Fabrication Checks)]
                                  │
                                  ▼
                 [Foundational Fallback if Count < 2]
                                  │
                                  ▼
    [Deduplication via seen_ids & Active Feedback Status Attachment]
                                  │
                                  ▼
     [Safety Critical Filter (Crisis Safeguards Non-Dismissible)]
                                  │
                                  ▼
  [Deterministic Sorting by Priority Rank (1 to 5) then Lexicographical ID]
                                  │
                                  ▼
                 [Final Ordered Recommendations List]
```

---

## 2. Identified Weaknesses & Audit Findings

Prior to Day 10, a systematic audit of `src/recommendations.py` and `src/views/insights.py` revealed several critical reliability, explainability, and safety weaknesses:

1. **Synthetic Value Fabrication on Missing/Incomplete Inputs:**
   - *Weakness:* Optional survey inputs defaulted to synthetic non-null values (e.g. `phone_before_bed = user_data.get("phone_before_bed", "Yes")`, `phone_interruption = "Frequently"`, `Dietary Habits = "Moderate"`).
   - *Impact:* When an empty dictionary `{}` was evaluated, the engine generated three contextual recommendations (`digital_focus`, `nutri_steady_fuel`, `sleep_winddown`) claiming the student had reported high phone hours, moderate diet, and bedtime screen use when the student had provided zero responses.
2. **Causal Claims & Conflation in Explanations:**
   - *Weakness:* Reasons joined disparate triggers with "or" clauses without specifying which factor was actually reported (e.g., *"because you reported elevated academic pressure (3.0/5) or low study satisfaction (3.0/5)"* even when neither was elevated).
3. **Vulnerability to Accidental Dismissal of Essential Safety Guidance:**
   - *Weakness:* In `src/views/insights.py`, the `"✕ Dismiss"` button was rendered indiscriminately across all recommendation cards, allowing a student to dismiss `prof_crisis_telemanas` (Item 9 crisis resources).
4. **Lack of Transparent Survey Attribution:**
   - *Weakness:* Recommendations did not formally report which specific survey variables influenced the suggestion.
5. **Helpful Feedback Clinical Misinterpretation Risk:**
   - *Weakness:* The "Helpful" button lacked disclaimer copy clarifying that session feedback is a self-care planning action, not clinical efficacy validation.

---

## 3. Synthetic Scenario Definitions & Evaluation

Ten controlled synthetic student scenarios were established to audit and verify recommendation quality:

| # | Scenario Description | Key Input Variables | Expected Recommendation Behavior |
| :---: | :--- | :--- | :--- |
| **1** | **High Academic Pressure & Low Satisfaction** | `Academic Pressure: 4.5`, `Study Satisfaction: 1.5` | Triggers `acad_chunking` (High, Rank 3). Specifically cites reported academic pressure and low satisfaction. Does NOT fabricate sleep or digital issues. |
| **2** | **Poor Sleep & Irregular Routine** | `Sleep Duration: <5 hrs`, `phone_before_bed: Yes`, `sleep_qual: 1` | Triggers `sleep_winddown` (High, Rank 3). Cites exact sleep metrics. |
| **3** | **High Financial Stress** | `Financial Stress: 4.8` | Triggers `fin_support_resources` (High, Rank 3). Does NOT trigger unrelated academic or lifestyle rules. |
| **4** | **Excessive Work/Study Hours** | `Work/Study Hours: 10.5` | Triggers `acad_mentorship` (Medium, Rank 4). Cites daily study commitment. |
| **5** | **Multiple Simultaneous Challenges** | High stress, poor sleep, high phone hours, high loneliness, high financial stress | Multi-category coverage, strictly deduplicated, deterministically sorted by priority rank. |
| **6** | **Relatively Balanced Profile** | Moderate study, 7-8 hrs sleep, active exercise, healthy diet, low screen friction | Triggers supportive maintenance (`sleep_anchor`) and foundational habits. Zero crisis alarms, zero high-stress alerts. |
| **7** | **Incomplete Optional Information** | `Academic Pressure: 4.5`, all other lifestyle fields omitted | Triggers `acad_chunking`. Evaluates ONLY provided key without fabricating missing inputs. |
| **8** | **Elevated PHQ-9 without Item 9** | `PHQ-9: 15/27`, `has_self_harm_risk: False` | Triggers `prof_counseling` (Priority Rank 1). Does NOT trigger `prof_crisis_telemanas`. Strictly non-emergency counseling. |
| **9** | **Positive Item 9 Response** | `has_self_harm_risk: True`, `PHQ-9: 3/27` | Triggers `prof_crisis_telemanas` (Priority Rank 1, `is_safety_critical: True`). Non-dismissible even if present in `dismissed_set`. |
| **10** | **Limited/Empty Assessment Info** | `{}`, `PHQ-9: 0/27` | Zero fabrication. Falls back to safe foundational habits (`acad_hourly_break`, `phys_hydration`). Transparent non-contextual reasons. |

---

## 4. Before-and-After Recommendation Examples

### Example A: Completely Empty Assessment Input (`{}`)
- **Before Day 10:**
  - *Generated:* `digital_focus`, `nutri_steady_fuel`, `sleep_winddown`
  - *Reason Given:* *"Suggested because your daily phone engagement (5.0 hrs) or study interruption frequency is elevated."*
  - *Audit Finding:* **CRITICAL DEFECT.** Fabricated values for a user who provided zero answers.
- **After Day 10:**
  - *Generated:* `acad_hourly_break`, `phys_hydration`
  - *Priority & Rank:* Low (Rank 5)
  - *Is Contextual:* `False`
  - *Reason Given:* *"Suggested as a foundational study hygiene practice for sustained focus since specific survey inputs were not provided."*
  - *Audit Finding:* **RESOLVED.** Honest, non-fabricated, transparent foundational habits.

### Example B: Academic Pressure Only (`{"Academic Pressure": 4.5}`)
- **Before Day 10:**
  - *Reason Given:* *"Suggested because you reported elevated academic pressure (4.5/5) or low study satisfaction (3.0/5)."* (Study satisfaction was defaulted to 3.0).
- **After Day 10:**
  - *Reason Given:* *"Suggested because your responses indicated elevated academic pressure (4.5/5)."*
  - *Influencing Responses:* `["Academic Pressure: 4.5/5"]`
  - *Audit Finding:* **RESOLVED.** Attributed strictly to the reported variable.

### Example C: Positive Item 9 Safety Guidance Dismissal
- **Before Day 10:**
  - Clicking "✕ Dismiss" on `prof_crisis_telemanas` removed the crisis resource from view.
- **After Day 10:**
  - `is_safety_critical: True` is enforced.
  - In `src/recommendations.py`: `dismissed_set` cannot filter out safety-critical recommendations.
  - In `src/views/insights.py`: The dismiss button is replaced with a locked badge: `🔒 Essential Safety`.

---

## 5. Relevance, Deduplication & Explainability Standards

1. **Deterministic Ordering:**
   - Order key: `(r.get("priority_rank", 99), r.get("id", ""))`.
   - Tested across multiple identical executions (`test_37_deterministic_ranking_stability`); produces identical list order.
2. **Deduplication:**
   - Enforced by tracking `seen_ids` before appending to output list.
3. **Structured Explainability Fields:**
   Each recommendation now includes:
   - `id`: Unique identifier string.
   - `category`: Formal category from `RECOMMENDATION_CATEGORIES`.
   - `icon`: Domain emoji icon.
   - `title`: Action-oriented header.
   - `priority`: High, Medium, or Low.
   - `priority_rank`: 1 (Emergency safety / Routine clinical), 2 (Routine clinical if crisis present), 3 (High lifestyle), 4 (Standard lifestyle), 5 (Foundational baseline).
   - `reason`: Honest, non-causal explanation citing specific inputs.
   - `influencing_factors`: List of survey features that directly triggered the rule.
   - `explanation`: Contextual mechanism explanation avoiding medical/diagnostic claims.
   - `action`: Concrete, practical next step.
   - `estimated_effort`: Realistic time estimate.
   - `is_contextual`: Boolean (`True` if survey-driven, `False` if foundational fallback).
   - `is_safety_critical`: Boolean (`True` for `prof_crisis_telemanas`).

---

## 6. Priority & Safety Boundaries

- **Separation of Crisis from Routine:**
  - PHQ-9 score $\ge 10$ with Item 9 $= 0$ triggers `prof_counseling` (Rank 1, High priority) without crisis or emergency wording.
  - Item 9 $> 0$ triggers `prof_crisis_telemanas` (Rank 1, High priority).
  - When both occur, `prof_crisis_telemanas` occupies Rank 1 and `prof_counseling` occupies Rank 2.
- **Non-Suppression by Ordinary Recommendations:**
  - Lifestyle recommendations cannot have priority ranks higher than Rank 3. Emergency and routine clinical guidance remain at Ranks 1 and 2.
- **Independence from ML Probability:**
  - Recommendation generation is invariant to the ML model output and does not alter the calibrated probability.

---

## 7. Active Session Feedback Quality

- **Data Minimization:**
  - Feedback (`"helpful"`, `"completed"`) and dismissals are stored exclusively in Streamlit session memory (`st.session_state`).
  - No database, cookies, local storage, or persistent tracking exist.
- **Session Reset:**
  - Invoking `reset_user_session_state()` clears `recommendation_feedback` and `dismissed_recommendations`.
- **Efficacy Disclaimer:**
  - Marking a recommendation as helpful displays: *"Marked as helpful for your daily planning session (non-clinical indicator)."*

---

## 8. Test Suite Verification (133 Tests)

Twelve new comprehensive tests (Tests 26–37) were added to [`tests/test_recommendation_intelligence.py`](file:///d:/Depression%20calculator/tests/test_recommendation_intelligence.py):

| Test Identifier | Verified Capability | Outcome |
| :--- | :--- | :---: |
| `test_26_scenario_1_high_academic_pressure_and_low_satisfaction` | Contextual academic chunking without fabricating unrelated issues | **PASS** |
| `test_27_scenario_2_poor_sleep_and_irregular_routine` | Sleep buffer triggered by sleep duration and screen time | **PASS** |
| `test_28_scenario_3_high_financial_stress` | Campus concessions and financial aid guidance | **PASS** |
| `test_29_scenario_4_excessive_work_study_hours` | Faculty office hours and mentorship triggered | **PASS** |
| `test_30_scenario_5_multiple_lifestyle_challenges_simultaneously` | Multi-category coverage, deduplication, deterministic ranking | **PASS** |
| `test_31_scenario_6_relatively_balanced_student_profile` | Maintenance sleep anchor and foundational habits; no alarms | **PASS** |
| `test_32_scenario_7_missing_or_incomplete_optional_information` | Only provided keys evaluated; zero fabrication of missing keys | **PASS** |
| `test_33_scenario_8_phq9_elevated_without_item9_positivity` | Non-crisis routine consultation at Rank 1 | **PASS** |
| `test_34_scenario_9_positive_item9_response_non_dismissible` | Item 9 safety guidance cannot be dismissed via `dismissed_set` | **PASS** |
| `test_35_scenario_10_limited_available_assessment_information` | Empty inputs yield foundational habits (`is_contextual: False`) | **PASS** |
| `test_36_explainability_and_non_causal_language` | Verification of `influencing_factors` and absence of causal claims | **PASS** |
| `test_37_deterministic_ranking_stability` | Bit-identical ordering across repeated runs | **PASS** |

### Regression Test Results Across All 9 Suites
```text
Suite 1: tests/test_end_to_end_validation.py          ... 25 / 25 PASSED
Suite 2: tests/test_student_experience.py             ...  7 /  7 PASSED
Suite 3: tests/test_engine_independence.py            ...  5 /  5 PASSED
Suite 4: tests/test_offline_reliability.py            ...  9 /  9 PASSED
Suite 5: tests/test_security_privacy.py               ... 16 / 16 PASSED
Suite 6: tests/test_architecture_reliability.py       ...  9 /  9 PASSED
Suite 7: tests/test_day8_ux_accessibility.py          ... 10 / 10 PASSED
Suite 8: tests/test_recommendation_intelligence.py    ... 37 / 37 PASSED (12 New Day 10 Tests)
Suite 9: tests/test_training_platform.py              ... 15 / 15 PASSED
---------------------------------------------------------------------------
TOTAL PASS RATE: 100% (133 / 133 tests passed with zero defects)
```

---

## 9. Known Limitations

1. **Rule-Based Specificity:**
   Recommendations are generated through deterministic heuristics rather than collaborative filtering or individualized causal models. While this ensures safety, transparency, and offline reliability, it lacks dynamic text generation.
2. **Session Transience:**
   Because Mindora adheres strictly to privacy-first, zero-persistence principles, helpful habits and planner commitments do not persist across browser restarts. Students must re-select habits in each active session.
3. **Threshold Boundary Effects:**
   Fixed numerical thresholds (e.g., academic pressure $\ge 3.5$, sleep $< 5$ hours) create discrete cutoffs. A student reporting 3.4 academic pressure does not receive the academic chunking suggestion.

---

## 10. Remaining Improvement Opportunities

1. **Interactive Habit Scheduling:**
   Allow students in the Wellness Planner to export selected daily micro-habits to an offline calendar file (`.ics`) without storing data on the server.
2. **Continuous Severity Sliders in Explanations:**
   Refine the explanation copy to provide nuanced feedback for borderline values (e.g., 3.4/5 academic pressure) without triggering full high-priority alerts.
3. **Localized Campus Support Directories:**
   Provide university-specific counseling contact placeholders that institutional deployments can configure via offline configuration files.