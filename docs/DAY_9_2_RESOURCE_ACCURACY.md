# MINDORA — DAY 9.2 AUDIT REPORT
## Emergency Resource Accuracy, International Distinctions & Priority Documentation

**Document Version:** 1.0.0  
**Date:** November 14, 2026  
**Auditor:** Senior Mental Health Safety Engineer & Python Application Testing Specialist  
**Project:** Mindora — AI-Powered Student Wellbeing Intelligence Platform  
**Repository Directory:** `D:\Depression calculator`  
**Production Model SHA-256:** `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` (`models/best_model.pkl`)

---

## 1. Executive Summary & Audit Scope

Mindora Day 9.2 is a narrowly scoped correction addressing:
1. **International Resource Distinctions:** Rigorous separation between general emergency dispatch numbers and dedicated mental-health or non-emergency health lines across all supported jurisdictions.
2. **Prohibition of Emergency Conflation:** Strict elimination of any phrasing that describes 988 or NHS 111 as general emergency dispatch numbers.
3. **Country-Specific Localization:** Displaying emergency and mental health resources dynamically based on the student's selected country, without assuming international helplines are reachable from India or other foreign territories.
4. **Recommendation Priority Documentation:** Clarifying the meaning of priority ranks, ensuring routine professional consultation (`prof_counseling`) at Rank 1 is never described as an emergency, and preserving all existing recommendation algorithms.
5. **Preservation of System Boundaries:** Maintaining zero modifications to PHQ-9 scoring, Item 9 handling, tri-engine separation, the production model artifact, and in-memory session storage.

---

## 2. Correct International Resource Distinctions

All emergency and crisis-resource copy across the codebase, UI components, and documentation was audited and aligned with authoritative national standards:

| Country / Jurisdiction | General Emergency Dispatch | Mental-Health Crisis & Support | Non-Emergency Health Advice | Critical Distinction & Audit Rule |
| :--- | :---: | :---: | :---: | :--- |
| **India** | **112** | **Tele-MANAS (14416 / 1800-89-14416)**<br>KIRAN (1800-599-0019) | Campus Clinic / Counselor | **112** is general emergency services (Police, Fire, Ambulance). **14416** is dedicated 24/7 mental health support. |
| **United States** | **911** | **988 Suicide & Crisis Lifeline**<br>Crisis Text Line (HOME to 741741) | **211** (Community Referrals) | **911** is general emergency services. **988 is strictly mental-health crisis support; NEVER describe 988 as general emergency dispatch.** |
| **Canada** | **911** | **988 Suicide Crisis Helpline**<br>Kids Help Phone (1-800-668-6868) | **811** (Health Information) | **911** is general emergency services. **988 is strictly mental-health crisis support; NEVER describe 988 as general emergency dispatch.** |
| **United Kingdom** | **999** (or 112) | **Samaritans (116 123)**<br>Shout (SHOUT to 85258) | **NHS 111** (Mental Health Option) | **999** is UK general emergency services. **NHS 111 is for non-emergency health advice and urgent mental health triage; NEVER describe 111 as general emergency dispatch.** |
| **Australia** | **000** (Triple Zero) | **Lifeline Australia (13 11 14)**<br>Beyond Blue (1300 22 4636) | healthdirect (1800 022 222) | **000** is general emergency services. **13 11 14** is mental health crisis support. |
| **International** | Local Emergency | **findahelpline.com**<br>Befrienders Worldwide | Local University Health Center | Search local directory for verified national crisis lines in 130+ nations. |

> [!CAUTION]
> **Prohibition of General Emergency Conflation:**
> - In previous revisions, phrasing such as `"(112 in India, 988 or 911 in US/Canada, 111 or 999 in UK)"` inadvertently grouped 988 and 111 with general emergency services.
> - In Day 9.2, this has been corrected to:  
>   `"(112 in India, 911 in US/Canada, 999 in UK) or visit the nearest hospital emergency department. Note that 988 (in US/Canada) and NHS 111 (in UK) are dedicated mental-health crisis or non-emergency health services, not general emergency dispatch numbers."`

---

## 3. Country-Specific Localization & Cross-Border Inaccessibility

### 1. In-Session Country Selection
- A new session key `"selected_country"` was added to `USER_SESSION_STATE_DEFAULTS` in [`src/session_utils.py`](file:///d:/Depression%20calculator/src/session_utils.py) (defaulting safely to `"India"`).
- The student can select their active country/region in:
  1. The **Sidebar** (`app.py`), applying across all views.
  2. The **Assessment View** (`src/views/assessment.py`), where it is captured with assessment responses.
  3. The **Insights View** (`src/views/insights.py`), enabling immediate on-the-fly toggling of emergency numbers for international students.

### 2. Cross-Border Accessibility Warning
Mindora explicitly informs students that telephone helplines operate within national boundaries and cannot be connected internationally:
- Tele-MANAS (`14416`) is only dialable from within India.
- US/Canadian `988` cannot be dialed from Indian mobile or landline networks.
- UK `111` or `999` cannot be dialed from outside the United Kingdom.
- If an international student is located outside the primary covered jurisdictions, Mindora directs them to [findahelpline.com](https://findahelpline.com) to locate verified, free crisis resources in their active physical location.

---

## 4. Recommendation Priority Documentation & Meaning of Priority Ranks

In Mindora's recommendation engine, `priority_rank` (1 to 5) governs the **presentation sorting order** (which cards appear first).

### Detailed Breakdown of Priority Tiers

| Priority Rank | Functional Category | Trigger Condition | Recommendation ID | Clinical Nature & Wording Rule |
| :---: | :--- | :--- | :--- | :--- |
| **Rank 1** *(Scenario A)* | **Immediate Safety Guidance** | **PHQ-9 Item 9 > 0** (Thoughts of self-harm) | `prof_crisis_telemanas` | **Immediate Supportive Care:** Connects with compassionate national helplines (Tele-MANAS, 988, Samaritans) and provides explicit directives to contact 112/911/999 for immediate physical danger. |
| **Rank 1** *(Scenario B)* | **Routine Professional Consultation** | **PHQ-9 $\ge$ 10** without Item 9 risk | `prof_counseling` | **Routine, Scheduled Assessment:** Encourages making a non-emergency appointment with a campus counselor. **STRICTLY NON-EMERGENCY:** Must never be described as a crisis or emergency alert. It takes Rank 1 solely so that professional care resources precede self-directed lifestyle micro-habits. |
| **Rank 2** | **Coexisting Professional Consultation** | **PHQ-9 $\ge$ 10** AND **Item 9 > 0** | `prof_counseling` | **Follow-up Clinical Care:** Placed immediately following the crisis safety guidance card (`prof_crisis_telemanas`) and ahead of all lifestyle recommendations. |
| **Rank 3** | **Acute Lifestyle Friction** | Academic Pressure $\ge$ 4.0, Sleep $<$ 5h, Screen $\ge$ 7h, Financial Stress $\ge$ 4.5, Severe Loneliness | `acad_chunking`<br>`sleep_winddown`<br>`digital_focus`<br>`soc_peer_connection`<br>`fin_support_resources` | **Behavioral Micro-Habits:** Small, actionable friction-reduction habits addressing acute survey friction. Lifestyle habits cannot displace Rank 1 or Rank 2 safety guidance. |
| **Rank 4** | **Moderate Lifestyle Friction** | Moderate pressure (3.5), Sleep 5–6h, Social Comparison, Fatigue $\ge$ 3, Low Exercise | `acad_mentorship`<br>`digital_curate`<br>`phys_sunlight_walk`<br>`nutri_steady_fuel` | **Supplemental Adjustments:** Medium-priority routine adjustments. |
| **Rank 5** | **Foundational Baseline Habits** | Healthy sleep duration, study breaks, desk hydration | `sleep_anchor`<br>`acad_hourly_break`<br>`phys_hydration` | **Positive Reinforcement:** Healthy circadian and daily study hygiene habits. |

---

## 5. System Invariance & Boundary Preservations

The Day 9.2 corrections strictly adhered to all project scope constraints:
1. **Production Model Bit-Exact Preservation:**  
   `Get-FileHash models/best_model.pkl -Algorithm SHA256`  
   `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` *(Unmodified since commit `7f5e90a`)*
2. **PHQ-9 Scoring & Item 9 Logic:** Scoring remains strictly 0–27. Item 9 remains a binary flag for safety intervention.
3. **Tri-Engine Independence:** ML probability, digital lifestyle friction, and PHQ-9 psychometrics remain mathematically decoupled with zero score combinations.
4. **Session Storage Only:** No database, external logging, persistent cookies, or disk tracking introduced.
5. **No Day 10 Code:** Day 10 has not been initiated.

---

## 6. Comprehensive Verification Test Results

Four new focused unit tests (Tests 18, 19, 20, 21) were added to `tests/test_recommendation_intelligence.py`. All 9 test suites were executed sequentially.

### Recommendation Intelligence Suite (`tests/test_recommendation_intelligence.py`)
```text
test_01_educational_recommendations_schema_and_keys            ... PASSED
test_02_recommendations_cover_all_eight_domains                ... PASSED
test_03_prioritised_filtering_and_top_limit                    ... PASSED
test_04_fallback_baseline_recommendations                      ... PASSED
test_05_explanation_and_reason_transparency                    ... PASSED
test_06_deterministic_priority_ordering                        ... PASSED
test_07_deduplication_guarantee                                ... PASSED
test_08_active_session_feedback_and_dismissal                  ... PASSED
test_09_session_reset_purges_recommendation_state              ... PASSED
test_10_three_engine_independence_preserved                    ... PASSED
test_11_unconditional_item9_crisis_priority                    ... PASSED
test_12_malformed_and_unexpected_inputs_resilience             ... PASSED
test_13_phq9_ge_10_without_item9_positivity (Path A)           ... PASSED
test_14_item9_positive_with_low_overall_phq9 (Path B)          ... PASSED
test_15_both_phq9_ge_10_and_item9_positive_coexist             ... PASSED
test_16_ordinary_lifestyle_recs_never_override_safety_guidance ... PASSED
test_17_helpline_distinction_and_availability_claims (Path C)  ... PASSED
test_18_international_emergency_and_crisis_distinctions (New)  ... PASSED
test_19_country_specific_resource_localization (New)           ... PASSED
test_20_routine_consultation_rank_1_not_emergency (New)        ... PASSED
test_21_recommendations_action_tailored_to_country (New)       ... PASSED
---------------------------------------------------------------------------
Ran 21 tests in 0.001s (OK)
```

### Full Project Regression Results (9 Suites, 117 Total Tests)
```text
Suite 1: tests/test_end_to_end_validation.py          ... 25 / 25 PASSED
Suite 2: tests/test_student_experience.py             ...  7 /  7 PASSED
Suite 3: tests/test_engine_independence.py            ...  5 /  5 PASSED
Suite 4: tests/test_offline_reliability.py            ...  9 /  9 PASSED
Suite 5: tests/test_security_privacy.py               ... 16 / 16 PASSED
Suite 6: tests/test_architecture_reliability.py       ...  9 /  9 PASSED
Suite 7: tests/test_day8_ux_accessibility.py          ... 10 / 10 PASSED
Suite 8: tests/test_recommendation_intelligence.py    ... 21 / 21 PASSED (4 New Day 9.2 Tests)
Suite 9: tests/test_training_platform.py              ... 15 / 15 PASSED
---------------------------------------------------------------------------
TOTAL PASS RATE: 100% (117 / 117 tests passed with zero defects)
```

### Health & Server Verification
- **Streamlit Local Health Check:** Endpoint `http://localhost:8501/_stcore/health` returns `HTTP 200 OK`.
- **Working Tree:** Clean on master branch.
