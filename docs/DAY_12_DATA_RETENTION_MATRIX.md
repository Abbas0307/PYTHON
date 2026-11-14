# MINDORA — DAY 12 DATA RETENTION MATRIX
## Field-Level Inventory, Sensitivity Classification & Retention Policy

**Document Version:** 1.0.0 (Architecture Specification)  
**Date:** November 14, 2026  
**Status:** SPECIFICATION ONLY (NOT IMPLEMENTED IN PRODUCTION STORAGE)  
**Project:** Mindora — AI-Powered Student Wellbeing Intelligence Platform  
**Repository Directory:** `D:\Depression calculator`  

---

## 1. Overview & Policy Principles

This document provides a field-level inventory of every data element handled by Mindora. Each field is assigned to one of three data classifications:
- **Category A (Highly Sensitive):** Mental health screener responses, suicidal ideation flags, clinical scores, and free-form personal disclosures. **Strictly Session-Only.** Never eligible for persistent retention.
- **Category B (Personal Student Information):** Demographics, academic strain metrics, lifestyle measurements, ML probabilities, and SHAP feature attributions. **Session-Only by default.** Ineligible for persistent storage under ordinary personalization.
- **Category C (Optional Progress Information):** Non-clinical self-care micro-habits, general check-in dates, habit domain preferences, and regional emergency helpline settings. **Eligible for optional, opt-in persistent retention** with separate, explicit student consent.

> [!IMPORTANT]
> **Implementation Status Notice:**  
> Mindora currently operates exclusively in **Session-Only Mode** via server-side in-memory `st.session_state`. Zero persistent databases, accounts, or client-side web storage (`localStorage` / `sessionStorage`) are implemented. This matrix governs the architectural boundaries for any future personalization feature.

---

## 2. Field-Level Data Retention Matrix

| Field Identifier | Data Element Description | Collection View / Source | Sensitivity Category | Primary Purpose | Necessity for Core Use | Proposed Future Retention | Consent Requirement | Deletion / Purge Rule |
|---|---|---|---|---|---|---|---|---|
| `phq9_answers` | Raw ordinal responses (0–3) to PHQ-9 items 1–8 | `src/views/assessment.py` (Tab D) | **Category A** (Highly Sensitive) | Standard psychometric screener calculation | Mandatory for Engine 3 | **Session-Only Only (NEVER Retained)** | Explicit Assessment Consent | Immediate purge on session reset or server session timeout |
| `phq9_item_9` | Response to Item 9 (thoughts of death or self-harm) | `src/views/assessment.py` (Tab D) | **Category A** (Highly Sensitive) | Immediate crisis safeguard & helpline prioritization | Mandatory for safety triage | **Session-Only Only (NEVER Retained)** | Explicit Assessment Consent | Immediate purge on session reset or server session timeout |
| `phq9_total_score` | Sum of 9 PHQ-9 items (0–27) | `src/recommendations.py` (`calculate_phq9`) | **Category A** (Highly Sensitive) | Displays educational symptom severity tier | Mandatory for Engine 3 | **Session-Only Only (NEVER Retained)** | Explicit Assessment Consent | Immediate purge on session reset or server session timeout |
| `phq9_severity` | Clinical severity tier label ("Minimal", "Moderate", etc.) | `src/recommendations.py` (`calculate_phq9`) | **Category A** (Highly Sensitive) | Educational feedback for student self-reflection | Mandatory for Engine 3 | **Session-Only Only (NEVER Retained)** | Explicit Assessment Consent | Immediate purge on session reset or server session timeout |
| `has_self_harm_risk` | Boolean flag indicating Item 9 > 0 | `src/recommendations.py` (`calculate_phq9`) | **Category A** (Highly Sensitive) | Triggers unprompted crisis guidance banner | Mandatory for crisis routing | **Session-Only Only (NEVER Retained)** | Explicit Assessment Consent | Immediate purge on session reset or server session timeout |
| `optional_notes` | Free-form student personal reflection text area | `src/views/assessment.py` (Tab E) | **Category A** (Highly Sensitive) | Qualitative context for student during session | Completely Optional | **Session-Only Only (NEVER Retained)** | Voluntary input | Immediate purge on session reset or server session timeout |
| `crisis_helpline_access` | Click or interaction with emergency hotline cards | `src/recommendations.py` / Sidebar | **Category A** (Highly Sensitive) | Emergency crisis routing | Critical safety utility | **Zero Logging (NEVER Retained)** | Not applicable | No interaction logs or telemetry recorded |
| `age` | Student chronological age (integer 16–55) | `src/views/assessment.py` (Tab C) | **Category B** (Personal Student Info) | Engine 1 ML feature matching training schema | Mandatory for Engine 1 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `gender` | Student gender ("Female", "Male") | `src/views/assessment.py` (Tab C) | **Category B** (Personal Student Info) | Engine 1 ML feature matching training schema | Mandatory for Engine 1 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `degree` | Degree program (e.g., "B.Tech", "BSc") | `src/views/assessment.py` (Tab C) | **Category B** (Personal Student Info) | Engine 1 ML feature matching training schema | Mandatory for Engine 1 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `cgpa` | Cumulative Grade Point Average (0.0–10.0) | `src/views/assessment.py` (Tab C) | **Category B** (Personal Student Info) | Engine 1 ML feature matching training schema | Mandatory for Engine 1 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `academic_pressure` | Rating of academic stress (1.0–5.0) | `src/views/assessment.py` (Tab C) | **Category B** (Personal Student Info) | Engine 1 ML feature & Engine 2 lifestyle context | Mandatory for Engine 1 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `study_satisfaction` | Rating of study satisfaction (1.0–5.0) | `src/views/assessment.py` (Tab C) | **Category B** (Personal Student Info) | Engine 1 ML feature & Engine 2 lifestyle context | Mandatory for Engine 1 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `work_study_hours` | Daily study/work hours (1.0–14.0) | `src/views/assessment.py` (Tab C) | **Category B** (Personal Student Info) | Engine 1 ML feature matching training schema | Mandatory for Engine 1 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `financial_stress` | Rating of financial strain (1.0–5.0) | `src/views/assessment.py` (Tab C) | **Category B** (Personal Student Info) | Engine 1 ML feature matching training schema | Mandatory for Engine 1 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `sleep_duration` | Categorical sleep duration ("7-8 hours", etc.) | `src/views/assessment.py` (Tab B) | **Category B** (Personal Student Info) | Evaluated by Engine 1 ML & Engine 2 Lifestyle | Mandatory for Engine 1 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `dietary_habits` | Categorical diet ("Healthy", "Moderate", "Unhealthy") | `src/views/assessment.py` (Tab B) | **Category B** (Personal Student Info) | Evaluated by Engine 1 ML & Engine 2 Lifestyle | Mandatory for Engine 1 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `daily_phone_hours` | Total daily smartphone screen time (hours) | `src/views/assessment.py` (Tab A) | **Category B** (Personal Student Info) | Engine 2 Digital Friction Index calculation | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `daily_social_hours` | Daily social media hours | `src/views/assessment.py` (Tab A) | **Category B** (Personal Student Info) | Engine 2 Digital Friction Index calculation | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `primary_platform` | Preferred social app (e.g., "Instagram", "YouTube") | `src/views/assessment.py` (Tab A) | **Category B** (Personal Student Info) | Contextual rule-based digital micro-habits | Optional context | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `phone_before_bed` | Bedside screen browsing within 45m of sleep (Yes/No) | `src/views/assessment.py` (Tab A) | **Category B** (Personal Student Info) | Engine 2 sleep hygiene friction trigger | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `social_comparison` | Frequency of upward social comparison on feeds | `src/views/assessment.py` (Tab A) | **Category B** (Personal Student Info) | Engine 2 cognitive friction trigger | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `notification_checking` | Alert checking frequency | `src/views/assessment.py` (Tab A) | **Category B** (Personal Student Info) | Engine 2 attention fragmentation indicator | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `phone_concentration_issue` | Perceived study derailment from smartphone | `src/views/assessment.py` (Tab A) | **Category B** (Personal Student Info) | Engine 2 study friction trigger | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `sleep_quality` | Subjective rating (1–5) | `src/views/assessment.py` (Tab B) | **Category B** (Personal Student Info) | Engine 2 Lifestyle Rhythm score calculation | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `daily_fatigue` | Subjective daytime exhaustion rating (1–5) | `src/views/assessment.py` (Tab B) | **Category B** (Personal Student Info) | Engine 2 recovery imbalance trigger | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `exercise_frequency` | Weekly physical activity tier | `src/views/assessment.py` (Tab B) | **Category B** (Personal Student Info) | Engine 2 physical wellbeing recommendation | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `outdoor_time` | Daily daylight exposure rating (1–5) | `src/views/assessment.py` (Tab B) | **Category B** (Personal Student Info) | Engine 2 circadian sunlight recommendation | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `loneliness` | Frequency of isolation on campus | `src/views/assessment.py` (Tab E) | **Category B** (Personal Student Info) | Engine 2 social connection guidance | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `social_support` | Satisfaction with family/peer support (1–5) | `src/views/assessment.py` (Tab E) | **Category B** (Personal Student Info) | Engine 2 support network context | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `friends_interaction` | Frequency of in-person social interactions | `src/views/assessment.py` (Tab E) | **Category B** (Personal Student Info) | Engine 2 peer engagement context | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `feeling_connected` | Sense of campus community belonging (1–5) | `src/views/assessment.py` (Tab E) | **Category B** (Personal Student Info) | Engine 2 community integration context | Mandatory for Engine 2 | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `ml_risk_percentage` | Statistical survey pattern match probability (0–100%) | `src/predict.py` (`predict_wellness_risk`) | **Category B** (Personal Student Info) | Educational survey pattern indication | Computed output | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `ml_risk_tier` | Categorical risk band ("Elevated", "Moderate", "Low") | `src/predict.py` (`predict_wellness_risk`) | **Category B** (Personal Student Info) | Educational survey pattern indication | Computed output | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `shap_contributions` | Local SHAP waterfall values per feature | `src/predict.py` (`predict_wellness_risk`) | **Category B** (Personal Student Info) | Algorithmic explainability and model transparency | Computed output | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `lifestyle_rhythm_score` | Composite rhythm index (0–10) | `src/recommendations.py` (`analyze_lifestyle_patterns`) | **Category B** (Personal Student Info) | Educational lifestyle balance indication | Computed output | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `digital_friction_score` | Composite screen friction index (0–10) | `src/recommendations.py` (`analyze_lifestyle_patterns`) | **Category B** (Personal Student Info) | Educational digital distraction indication | Computed output | **Session-Only by default (No Persistence)** | Explicit Assessment Consent | Purged upon session reset or server session timeout |
| `completed_habit_ids` | Set of checked habit keys (e.g. `{"sleep_anchor"}`) | `src/views/wellness_planner.py` | **Category C** (Optional Progress Info) | Daily self-care check-off & streak tracking | Optional engagement | **Eligible for Optional Retention (Max 90 Days)** | Separate, Granular Storage Consent | Instantly purged upon student deletion request |
| `selected_habit_domains` | Lifestyle domains selected by student (e.g. "Sleep") | `src/views/wellness_planner.py` | **Category C** (Optional Progress Info) | Filters recommendation feed to student focus areas | Optional preference | **Eligible for Optional Retention (Max 90 Days)** | Separate, Granular Storage Consent | Instantly purged upon student deletion request |
| `checkin_completion_dates` | Dates on which habits were checked (e.g. `2026-11-14`) | `src/views/progress_view.py` | **Category C** (Optional Progress Info) | Displays progress calendar (NO clinical scores) | Optional reflection | **Eligible for Optional Retention (Max 90 Days)** | Separate, Granular Storage Consent | Instantly purged upon student deletion request |
| `recommendation_feedback` | Binary rating of habits (`helpful` / `unhelpful`) | `src/views/wellness_planner.py` | **Category C** (Optional Progress Info) | Tailors future habit suggestions to student utility | Optional feedback | **Eligible for Optional Retention (Max 90 Days)** | Separate, Granular Storage Consent | Instantly purged upon student deletion request |
| `selected_country` | Student country preference for emergency routing | Sidebar Country Selector | **Category C** (Optional Progress Info) | Displays accurate local emergency hotlines | Optional preference | **Eligible for Optional Retention (Max 90 Days)** | Separate, Granular Storage Consent | Instantly purged upon student deletion request |
| `selected_uk_region` | Devolved UK nation (e.g., "Scotland") | Sidebar Region Selector | **Category C** (Optional Progress Info) | Displays accurate devolved mental health triage | Optional preference | **Eligible for Optional Retention (Max 90 Days)** | Separate, Granular Storage Consent | Instantly purged upon student deletion request |

---

## 3. Justification Summary for Retained Fields (Category C Only)

For each field eligible for optional retention under a future architecture, the following parameters are strictly enforced:

1. **`completed_habit_ids`:**
   - *Purpose:* Allows returning students to view their ongoing self-care commitments without having to re-select habits every visit.
   - *Necessity:* Optional quality-of-life feature for habit reinforcement.
   - *Sensitivity:* Low; contains non-clinical micro-actions (e.g., "Hydrate during study", "Anchor wake time").
   - *Retention Period:* Rolling 90 days from last student activity.
   - *Deletion Behavior:* Immediately deleted upon clicking "Delete My Progress Data".
   - *Disability:* Default is OFF (session-only). Can be disabled at any time.

2. **`checkin_completion_dates`:**
   - *Purpose:* Renders a visual calendar streak of active self-care days.
   - *Necessity:* Encourages positive behavioral consistency.
   - *Sensitivity:* Low; contains dates only, with zero clinical, demographic, or score associations.
   - *Retention Period:* Rolling 90 days from last student activity.
   - *Deletion Behavior:* Immediately purged upon consent withdrawal.
   - *Disability:* Default is OFF (session-only).

3. **`selected_country` & `selected_uk_region`:**
   - *Purpose:* Remembers geographical preference so that local crisis helplines (e.g., Tele-MANAS, Lifeline NI) remain immediately visible upon return.
   - *Necessity:* Enhances safety response time by eliminating redundant menu selections.
   - *Sensitivity:* Low (country/region name only; no IP geolocations, GPS, or street addresses).
   - *Retention Period:* Persists until student resets preference or deletes progress data.
   - *Deletion Behavior:* Reverts to default ("India" / "General UK") upon purge.
   - *Disability:* Student can alter selection at any time.
