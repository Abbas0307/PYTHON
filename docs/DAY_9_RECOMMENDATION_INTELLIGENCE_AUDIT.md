# MINDORA — DAY 9 AUDIT REPORT
## Recommendation Intelligence & Contextual Personalisation Audit

**Document Version:** 1.0.0  
**Date:** November 14, 2026  
**Auditor:** Senior AI/ML Engineer, Recommendation Systems Architect, Behavioural Product Designer & Python Backend Engineer  
**Project:** Mindora — AI-Powered Student Wellbeing Intelligence Platform  
**Repository Directory:** `D:\Depression calculator`  
**Production Model SHA-256:** `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` (`models/best_model.pkl`)

---

## 1. Existing Recommendation Engine Assessment

Before implementing Day 9 improvements, the existing recommendation system in `src/recommendations.py` was systematically evaluated.

### Previous Implementation Baseline
The pre-Day 9 recommendation generator (`generate_educational_recommendations(user_data, phq9_score)`) operated as a hardcoded rule list:
- **Limited Contextual Coverage:** Only examined basic sleep duration, phone hours, academic pressure, exercise, loneliness, and aggregate PHQ-9 score.
- **Unaddressed Context Inputs:** Ignored financial stress, daily study hours, dietary habits, notification interruptions, social comparison frequency, and sleep quality ratings.
- **Lack of Explanatory Transparency:** Recommendations contained only a generic title and action text. They did not inform the student *why* a particular habit was being suggested.
- **No Prioritisation Architecture:** Suggestions were appended linearly without ranking, urgency hierarchy, or effort estimates.
- **No Dismissal or Feedback Loop:** Students could not dismiss irrelevant habits, mark suggestions as helpful, or track actionable commitments without wading through static suggestions.
- **Planner Disconnect:** The Wellness Planner displayed static lists of generic domain habits completely disconnected from the student's actual assessment findings.

---

## 2. Problems Identified & Architectural Solutions

| Defect / Limitation | Architectural Resolution |
| :--- | :--- |
| **No "Why" Explanation** | Added transparent `reason` and `explanation` attributes to every suggestion, explicitly linking the action to the student's reported responses. |
| **Missing Categories** | Formalized the system into **8 clear wellbeing categories** (Academic, Sleep, Digital, Physical, Nutrition, Social, Financial/Academic Support, and Professional Support). |
| **Zero Prioritisation** | Implemented a deterministic 4-tier priority hierarchy (`priority_rank` 1 to 4: Urgent Professional/Crisis &gt; High Friction &gt; Moderate Habit &gt; Supportive Baseline). |
| **Cognitive Overload** | Partitioned suggestions into Top 3 Prioritised Cards, placing additional suggestions inside a progressive-disclosure expander (`View Additional Suggestions`). |
| **Disjointed Wellness Planner** | Integrated contextual suggestions directly into the top of the Wellness Planner, enabling one-click commitment, habit checking, and live progress synchronization. |
| **Absence of Student Feedback** | Added ephemeral, in-memory feedback controls: `👍 Helpful`, `✕ Dismiss`, and `✓ Completed` without persistent tracking or profile logging. |
| **Missing Safety Priority** | Ensured that severe PHQ-9 scores (&ge; 10) or Item 9 triggers always generate Priority 1 professional support recommendations that cannot be overridden by lifestyle micro-habits. |

---

## 3. Recommendation Engine Architecture

The recommendation engine functions as an educational rule-based contextual translation layer:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           STUDENT CONTEXT INPUTS                                │
├───────────────────────────────┬─────────────────────────┬───────────────────────┤
│ Academic: Pressure, Hours,    │ Digital: Screen Hours,  │ Psychometric: PHQ-9   │
│ Study Satisfaction            │ Comparison, Focus       │ Score (0-27) & Item 9 │
├───────────────────────────────┼─────────────────────────┼───────────────────────┤
│ Lifestyle: Sleep Duration,    │ Physical: Exercise,     │ Social: Loneliness,   │
│ Sleep Quality, Pre-Bed Phone  │ Fatigue, Daylight Walk  │ Peer Contacts, Support│
└───────────────────────────────┴─────────────────────────┴───────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     RULE-BASED CONTEXTUAL REASONING ENGINE                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ • Evaluates acute friction triggers across 8 standardized categories            │
│ • Assigns deterministic priority rank (1 = Professional, 2 = High, 3 = Med, 4) │
│ • Attaches transparent reason ("Why this was suggested") & estimated effort     │
│ • Applies active session feedback (excludes dismissed items, marks helpful)     │
│ • Deduplicates rules and sorts deterministically                                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION & ACTIONABLE INTEGRATION                      │
├─────────────────────────────────────┬───────────────────────────────────────────┤
│ INSIGHTS VIEW (src/views/insights)  │ WELLNESS PLANNER (src/views/planner)      │
│ • Top 3 Prioritised Cards           │ • Direct Habit Check-in & Commitment      │
│ • Priority & Effort Badges          │ • Session Progress Synchronisation        │
│ • Feedback Buttons (Helpful/Dismiss)│ • Dismissal Recovery Expander             │
└─────────────────────────────────────┴───────────────────────────────────────────┘
```

---

## 4. Context Inputs Used

Recommendations strictly leverage validated student survey and lifestyle variables already collected in the assessment:
1. `Academic Pressure` (1.0 to 5.0)
2. `Study Satisfaction` (1.0 to 5.0)
3. `Work/Study Hours` (1.0 to 14.0)
4. `Financial Stress` (1.0 to 5.0)
5. `Sleep Duration` (`Less than 5 hours`, `5-6 hours`, `7-8 hours`, `More than 8 hours`)
6. `sleep_quality` (1 to 5)
7. `phone_before_bed` (`Yes`, `No`)
8. `daily_phone_hours` (1.0 to 16.0)
9. `daily_social_hours` (0.5 to 12.0)
10. `social_comparison` (`Never`, `Rarely`, `Sometimes`, `Often`, `Always`)
11. `phone_concentration_issue` (`Never`, `Rarely`, `Frequently`, `Almost Constantly`)
12. `exercise_frequency` (`Never`, `Rarely`, `Moderate`, `Active`)
13. `outdoor_time` (1 to 5)
14. `daily_fatigue` (1 to 5)
15. `Dietary Habits` (`Healthy`, `Moderate`, `Unhealthy`)
16. `loneliness` (`Never`, `Rarely`, `Sometimes`, `Often`, `Always`)
17. `social_support` (1 to 5)
18. `friends_interaction` (`Almost daily`, `2-3x/week`, `Weekly`, `Rarely/Never`)
19. `phq9_score` (0 to 27)
20. `has_self_harm_risk` (bool from PHQ-9 Item 9)

*Missing inputs are handled gracefully with safe fallbacks and are never penalized as negative indicators.*

---

## 5. Prioritisation Logic

Each generated recommendation receives a deterministic `priority_rank` that governs presentation order:

| Rank | Priority Tier | Trigger Condition | Example Recommendation |
| :---: | :---: | :--- | :--- |
| **1** | **High (Urgent Guidance)** | PHQ-9 score &ge; 10 or Item 9 positive | `Consult a Licensed Campus or Community Counselor` / `Tele-MANAS (14416)` |
| **2** | **High (Acute Friction)** | Academic Pressure &ge; 4.0, Sleep &lt; 5 hrs, Screen time &ge; 7 hrs, Financial Stress &ge; 4.5, Severe Loneliness | `Establish a 45-Minute Screen-Free Wind-Down Buffer` |
| **3** | **Medium (Habit Adjustment)** | Moderate Academic Pressure (3.5), Sleep 5–6 hrs, Social Comparison, Fatigue &ge; 3, Low Exercise | `Incorporate a 20-Minute Morning Sunlight Walk` |
| **4** | **Low (Supportive Reinforcement)** | Healthy Sleep (7–8 hrs), Foundational Study breaks, Daily hydration | `Anchor a Consistent Daily Wake-Up Time` |

---

## 6. Recommendation Categories (8 Formal Domains)

1. **Academic Wellbeing (`📚`):** Coursework chunking, Pomodoro intervals, peer study groups, faculty office hours.
2. **Sleep and Daily Routine (`🌙`):** 45-minute screen-free wind-down buffer, consistent circadian wake anchor, cool dark sleep sanctuary.
3. **Digital Wellbeing (`📱`):** Phone-free focus zones, social comparison feed curation, batching notification alerts.
4. **Physical Wellbeing (`🏃`):** Morning outdoor sunlight walks, study desk stretches, fatigue reduction movement.
5. **Nutrition and Daily Habits (`🥗`):** Steady glucose fueling, hydration pacing, minimizing late-night caffeine.
6. **Social Connection (`🤝`):** 15-minute informal coffee/walk with peers, campus student societies, study buddy partnerships.
7. **Financial and Academic Support (`💡`):** University emergency relief grants, textbook lending libraries, student travel concessions.
8. **Professional Support Resources (`🩺`):** Campus psychological services, community clinics, Tele-MANAS (14416 / 1800-89-14416), KIRAN (1800-599-0019).

---

## 7. Personalisation Without Reinforcement Learning

Mindora achieves contextual personalisation through transparent rule-based matching rather than opaque reinforcement learning or black-box reward models:
- **Zero Profile Tracking:** No persistent profile or cross-session tracking database is created.
- **Active-Session Feedback:**
  - `👍 Helpful`: Records positive utility for the active session, visually confirming student acknowledgement.
  - `✕ Dismiss`: Removes the suggestion immediately from both the Insights view and the Wellness Planner for the active session.
  - `✓ Completed`: Checkmark commitment directly increments the session's habit tracker and updates the progress bar.
- **Restoration Option:** A dedicated expander in the Wellness Planner allows restoring all dismissed recommendations at any time during the session.

---

## 8. Safety & Ethical Safeguards

1. **Strict Engine Independence:** Recommendations are driven solely by survey responses. Engine 1 ML probability and Engine 3 PHQ-9 scoring remain mathematically untouched.
2. **Zero Diagnostic Claims:** Recommendations never claim to "treat", "cure", or "diagnose" depression or mental illnesses. All copy emphasizes non-clinical self-care micro-habits.
3. **Non-Overridable Safety Gate:** Ordinary lifestyle habits can never replace professional support guidance. When a student reports PHQ-9 &ge; 10 or Item 9 positive, clinical guidance is surfaced unconditionally at Priority 1.
4. **Non-Judgmental Demographics:** Demographic attributes (`Age`, `Gender`, `Degree`) are never used to generate restrictive or stereotypical suggestions.

---

## 9. Synthetic Evaluation Scenarios

| Scenario | Input Profile | Generated Top Recommendations | Rationale & Behavioral Impact |
| :--- | :--- | :--- | :--- |
| **A: Overwhelmed Final-Year Student** | Academic Pressure: 5, Sleep: &lt;5 hrs, Financial Stress: 4.5, PHQ-9: 14 | 1. Professional Counselor Consultation<br>2. 45-Min Wind-Down Buffer<br>3. Campus Financial Aid & Grants<br>4. Coursework Micro-Chunking | Immediate priority on clinical support, sleep protection, and financial relief over routine study advice. |
| **B: Distracted Digital Student** | Screen Time: 8.5 hrs, Social Comparison: Always, Academic: 3, PHQ-9: 4 | 1. Phone-Free Study Zones<br>2. Curate Social Media Feeds<br>3. 20-Minute Sunlight Walk | Targets attention residue and upward comparison anxiety without pathologizing non-clinical distress. |
| **C: Balanced Baseline Student** | Sleep: 7–8 hrs, Academic Pressure: 2, Exercise: Active, PHQ-9: 1 | 1. Anchor Consistent Wake Time<br>2. Intentional 5-Min Decompression Breaks<br>3. Consistent Study Hydration | Reinforces existing resilience anchors without fabricating false problems. |

---

## 10. Comprehensive Regression Test Results

All 9 test suites were executed sequentially:

```text
Suite 1: tests/test_end_to_end_validation.py          ... 25 / 25 PASSED
Suite 2: tests/test_student_experience.py             ...  7 /  7 PASSED
Suite 3: tests/test_engine_independence.py            ...  5 /  5 PASSED
Suite 4: tests/test_offline_reliability.py            ...  9 /  9 PASSED
Suite 5: tests/test_security_privacy.py               ... 16 / 16 PASSED
Suite 6: tests/test_architecture_reliability.py       ...  9 /  9 PASSED
Suite 7: tests/test_day8_ux_accessibility.py          ... 10 / 10 PASSED
Suite 8: tests/test_recommendation_intelligence.py    ... 12 / 12 PASSED (New)
Suite 9: tests/test_training_platform.py              ... 15 / 15 PASSED
---------------------------------------------------------------------------
TOTAL PASS RATE: 100% (108 / 108 tests passed with zero defects)
```

---

## 11. Final Model Hash & Verification

- **Production Model SHA-256 Hash:**  
  `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` (`models/best_model.pkl`)  
  *(Bit-exact match against baseline commit `7f5e90a`. Model artifact preserved without retraining.)*
- **Streamlit Local Server Status:** Endpoint `http://localhost:8501/_stcore/health` returns `HTTP 200 OK`.
- **Working Tree State:** Staged and clean.
