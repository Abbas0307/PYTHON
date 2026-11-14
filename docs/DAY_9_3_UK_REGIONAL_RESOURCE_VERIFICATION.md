# MINDORA — DAY 9.3 AUDIT REPORT
## UK Regional Helpline Accuracy & Devolved Nations Verification

**Document Version:** 1.0.0  
**Date:** November 14, 2026  
**Auditor:** Senior Safety Resource Verification Engineer  
**Project:** Mindora — AI-Powered Student Wellbeing Intelligence Platform  
**Repository Directory:** `D:\Depression calculator`  
**Production Model SHA-256:** `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` (`models/best_model.pkl`)

---

## 1. Executive Summary & Objective

In healthcare safety engineering, healthcare delivery in the United Kingdom is a devolved matter governed independently across its four nations: **England**, **Scotland**, **Wales**, and **Northern Ireland**.

Previous revisions of Mindora cited the generic phrase `"NHS 111 Mental Health Option"` as representative of the entire United Kingdom. While NHS 111 operates widely across England, Wales, and Scotland via distinct national services, **the England NHS 111 telephone mental-health pathway does not operate in Northern Ireland**. Furthermore, Scotland operates through **NHS 24 on 111**, Wales operates through **NHS 111 Wales (Option 2)**, and Northern Ireland relies on **Lifeline NI (0808 808 8000)** and local Health and Social Care (HSC) Trust crisis services.

The Day 9.3 objective is to audit, correct, and verify all UK regional helpline classifications, ensuring students across all four nations receive truthful, geographically accurate, and non-misleading emergency and mental-health guidance.

---

## 2. Four-Nation UK Regional Helpline Architecture

Mindora now formally structures UK mental health and emergency resources across its four devolved administrations via `UK_REGIONAL_DIRECTORY` in [`src/recommendations.py`](file:///d:/Depression%20calculator/src/recommendations.py):

| Devolved Nation | Primary Mental-Health Pathway | Contact Number | Operating Body & Details | Regional Distinction & Audit Rule |
| :--- | :--- | :---: | :--- | :--- |
| **England** | **NHS 111 mental-health option** | **111** (Mental Health Option) | NHS England / Local Mental Health Trusts (24/7) | England-specific: routes directly to local English NHS trust mental health crisis teams. |
| **Scotland** | **NHS 24 on 111** | **111** (Mental Health Hub) | NHS 24 / Scottish Government (24/7)<br>Breathing Space (0800 83 85 87) | Scotland-specific: operated by NHS 24. Breathing Space available on evenings and weekends. |
| **Wales** | **NHS 111 Wales** | **111** (Select Option 2) | NHS 111 Wales / Welsh Local Health Boards (24/7) | Wales-specific: Press 2 to speak directly with an NHS mental health practitioner. |
| **Northern Ireland** | **Lifeline NI & Local HSC Trust Services** | **0808 808 8000** (Lifeline NI) | Public Health Agency Northern Ireland / HSC Trusts (24/7) | **Northern Ireland-specific:** The England NHS 111 pathway does **NOT** operate in Northern Ireland. Directs to Lifeline NI or HSC Trust Crisis Teams. |

### Preserved Pan-UK & Emergency Infrastructure
Across all four nations of the United Kingdom:
- **Emergency Dispatch:** **999** (or 112) for **immediate danger to life, including life-threatening mental-health emergencies or imminent self-harm** (as well as physical emergencies).
- **Clinical Safety Scope:** Describing emergency numbers as "physical emergencies only" was identified as an audit defect; acute suicidal crises, active self-harm, or immediate danger to life warrant urgent 999 dispatch.
- **Pan-UK Confidential Emotional Support:** **Samaritans** on **116 123** (Free, 24/7 across all four nations).
- **Pan-UK Crisis Text Support:** **Shout** (Text **SHOUT** to **85258**, Free, 24/7 across all four nations).
- **Strict Distinction:** 999 is UK emergency services dispatch; NHS 111 (England), NHS 24 on 111 (Scotland), NHS 111 Wales (Wales), and Lifeline NI (Northern Ireland) are non-emergency health advice or mental-health triage lines, **never general emergency dispatch**.

---

## 3. UI Implementation: Safe Defaults & Regional Notice

To prevent assuming a student's UK nation when only `"United Kingdom"` is selected:
1. **Pan-UK Consolidated Directory (Safe Default):**
   - When `"United Kingdom"` is selected without a region, Mindora displays the complete four-nation breakdown:
     - England: NHS 111 mental-health option.
     - Scotland: NHS 24 on 111.
     - Wales: NHS 111 Wales (Option 2).
     - Northern Ireland: Lifeline NI (0808 808 8000) or local HSC Trust services.
   - An explicit notice clarifies: *"The NHS 111 mental-health pathway is specific to England/Scotland/Wales and does NOT operate in Northern Ireland."*
2. **Optional UK Nation / Region Selector:**
   - In the **Sidebar** ([`app.py`](file:///d:/Depression%20calculator/app.py#L125-L145)) and **Insights View** ([`src/views/insights.py`](file:///d:/Depression%20calculator/src/views/insights.py#L95-L115)), selecting `"United Kingdom"` surfaces an optional nation selector:
     `["All UK / General", "England", "Scotland", "Wales", "Northern Ireland"]`.
   - Selecting a specific nation tailors the primary card directly to that nation's verified service (e.g. selecting Northern Ireland immediately surfaces Lifeline NI at 0808 808 8000, without any reference to England NHS 111).
3. **Session State Invariance:**
   - Key `"selected_uk_region"` is managed safely in `USER_SESSION_STATE_DEFAULTS` in [`src/session_utils.py`](file:///d:/Depression%20calculator/src/session_utils.py) and purged upon session reset.

---

## 4. Technical System & Algorithmic Preservations

1. **Production Model Bit-Exact Preservation:**  
   `Get-FileHash models/best_model.pkl -Algorithm SHA256`  
   `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` *(Zero changes)*
2. **PHQ-9 Scoring & Item 9 Safeguard:** Preserved strictly at 0–27. Item 9 remains an independent trigger for supportive guidance.
3. **Tri-Engine Independence:** Public ML risk, lifestyle friction, and PHQ-9 psychometrics operate in complete architectural isolation.
4. **Session-Only Minimization:** Zero persistent disk writes, cookies, or user tracking.
5. **No Day 10 Code:** Day 10 has not been started.

---

## 5. Comprehensive Verification Test Results (121 Tests)

Four dedicated unit tests (Tests 22, 23, 24, 25) verify UK regional helplines and safety-copy distinctions in [`tests/test_recommendation_intelligence.py`](file:///d:/Depression%20calculator/tests/test_recommendation_intelligence.py):
- `test_22_uk_regional_directory_classification`: Verifies England (NHS 111), Scotland (NHS 24 on 111), Wales (NHS 111 Wales), and Northern Ireland (Lifeline NI 0808 808 8000), emergency 999, and Samaritans 116 123.
- `test_23_uk_northern_ireland_does_not_display_england_nhs_111`: Verifies that Northern Ireland queries return Lifeline NI and explicitly warn that England NHS 111 does not operate in NI.
- `test_24_recommendations_action_tailored_to_uk_regions`: Verifies that Item 9 recommendation action copy adapts dynamically to Northern Ireland, Scotland, Wales, and England.
- `test_25_emergency_services_cover_mental_health_danger_to_life`: Verifies that emergency dispatch (999/112 in UK, 112 in India, 911 in US/Canada) is explicitly described as covering immediate danger to life, including life-threatening mental-health emergencies, while distinguishing emergency dispatch from non-emergency triage lines (NHS 111, Lifeline NI, 988).

### Regression Test Results Across All 9 Suites
```text
Suite 1: tests/test_end_to_end_validation.py          ... 25 / 25 PASSED
Suite 2: tests/test_student_experience.py             ...  7 /  7 PASSED
Suite 3: tests/test_engine_independence.py            ...  5 /  5 PASSED
Suite 4: tests/test_offline_reliability.py            ...  9 /  9 PASSED
Suite 5: tests/test_security_privacy.py               ... 16 / 16 PASSED
Suite 6: tests/test_architecture_reliability.py       ...  9 /  9 PASSED
Suite 7: tests/test_day8_ux_accessibility.py          ... 10 / 10 PASSED
Suite 8: tests/test_recommendation_intelligence.py    ... 25 / 25 PASSED (4 Day 9.3 Tests)
Suite 9: tests/test_training_platform.py              ... 15 / 15 PASSED
---------------------------------------------------------------------------
TOTAL PASS RATE: 100% (121 / 121 tests passed with zero defects)
```

### Health & Server Verification
- **Streamlit Local Server Status:** Endpoint `http://localhost:8501/_stcore/health` returns `HTTP 200 OK`.
- **Working Tree:** Clean on master branch.
