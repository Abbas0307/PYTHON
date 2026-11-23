# MINDORA — DAY 12 DATA RETENTION MATRIX
## Field-Level Inventory, Sensitivity Classification & Retention Policy

**Document Version:** 1.1.0 (Post-Audit Refined Specification)  
**Date:** November 14, 2026  
**Status:** SPECIFICATION ONLY (NOT IMPLEMENTED IN PRODUCTION STORAGE)  
**Project:** Mindora — AI-Powered Student Wellbeing Intelligence Platform  
**Repository Directory:** `D:\Depression calculator`  

---

## 1. Overview & Core Architectural Policy

This document establishes the authoritative field-level data inventory, sensitivity classifications, and retention boundaries for Mindora. Each field handled across the application is assigned to one of three categories:

- **Category A (Highly Sensitive):** Mental health psychometrics (PHQ-9 items 1–9, total score, clinical severity band, self-harm risk flag), unconstrained qualitative text disclosures, and crisis resource access logs.  
  **Strict Architectural Policy:** **STRICTLY SESSION-ONLY.** Never eligible for persistent storage under any circumstances. Never profiled, never retrained, never backed up.
- **Category B (Personal Student Information):** Demographics, academic strain metrics (CGPA, study satisfaction, pressure, work hours, financial stress), digital screen time metrics, social lifestyle measurements, ML probabilities, and SHAP local feature attributions.  
  **Strict Architectural Policy:** **SESSION-ONLY BY DEFAULT.** Ineligible for persistent storage under ordinary personalization. Pseudonymization, tokenization, or client-side salting does NOT justify long-term storage of these intimate academic and behavioral indicators.
- **Category C (Optional Progress Information):** Non-clinical self-care habit keys, habit domain preferences, check-in completion dates, habit feedback ratings, and helpline regional selectors.  
  **Strict Architectural Policy:** **ELIGIBLE FOR STRICTLY OPTIONAL, OPT-IN RETENTION.** Requires separate, explicit, unbundled student consent. Subject to a minimal viable retention schema and automated expiration.

> [!IMPORTANT]
> **Implementation Status Notice:**  
> Mindora currently operates exclusively in **Session-Only Mode** via server-side in-memory `st.session_state`. Zero persistent databases, accounts, or client-side web storage (`localStorage` / `sessionStorage`) are implemented. This matrix governs the architectural boundaries for any future personalization feature.

---

## 2. Comprehensive Field-Level Retention Matrix

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
| `completed_habit_ids` | Set of checked habit keys (e.g. `{"sleep_anchor"}`) | `src/views/wellness_planner.py` | **Category C** (Optional Progress Info) | Daily self-care check-off & streak tracking | Optional engagement | **Eligible for Optional Retention (Recommended Initial Core)** | Separate, Granular Storage Consent | Instantly purged upon student deletion request |
| `selected_habit_domains` | Lifestyle domains selected by student (e.g. "Sleep") | `src/views/wellness_planner.py` | **Category C** (Optional Progress Info) | Filters recommendation feed to student focus areas | Optional preference | **Eligible for Optional Retention (Secondary Phase)** | Separate, Granular Storage Consent | Instantly purged upon student deletion request |
| `checkin_completion_dates` | Dates on which habits were checked (e.g. `2026-11-14`) | `src/views/progress_view.py` | **Category C** (Optional Progress Info) | Displays progress calendar (NO clinical scores) | Optional reflection | **Eligible for Optional Retention (Secondary Phase)** | Separate, Granular Storage Consent | Instantly purged upon student deletion request |
| `recommendation_feedback` | Binary rating of habits (`helpful` / `unhelpful`) | `src/views/wellness_planner.py` | **Category C** (Optional Progress Info) | Tailors future habit suggestions to student utility | Optional feedback | **Eligible for Optional Retention (Secondary Phase)** | Separate, Granular Storage Consent | Instantly purged upon student deletion request |
| `selected_country` | Student country preference for emergency routing | Sidebar Country Selector | **Category C** (Optional Progress Info) | Displays accurate local emergency hotlines | Optional preference | **Eligible for Optional Retention (Secondary Phase)** | Separate, Granular Storage Consent | Instantly purged upon student deletion request |
| `selected_uk_region` | Devolved UK nation (e.g., "Scotland") | Sidebar Region Selector | **Category C** (Optional Progress Info) | Displays accurate devolved mental health triage | Optional preference | **Eligible for Optional Retention (Secondary Phase)** | Separate, Granular Storage Consent | Instantly purged upon student deletion request |

---

## 3. Rigorous Reassessment of Proposed Category C Fields

Behavioral and preference information must not be naively assumed harmless. A rigorous privacy impact evaluation was conducted for each proposed Category C candidate:

### 1. `completed_habit_ids` (e.g., `sleep_anchor`, `digital_pomodoro`)
- **Why It Is Needed:** Enables returning students to see which self-care routines they have chosen to build, avoiding the friction of re-selecting habits on every visit.
- **Sensitivity & Inferential Risk:** **Low to Moderate.** While individual habit names (e.g. "Pomodoro Focus Block") appear innocuous, prolonged commitment to specific habits (e.g., "Mute Upward-Comparison Accounts", "Deconstruct Large Coursework", "Seek Counseling Support") can allow a secondary observer to infer academic distress, anxiety, or sleep disturbances.
- **Genuine Necessity:** **Moderate.** Central to long-term habit reinforcement, but not required for single-session use.
- **Less Intrusive Alternative:** Store a simple anonymized aggregate count of completed habits (e.g., `completed_habit_count: 5`) rather than specific behavioral IDs.
- **Proposed Retention:** Rolling 60–90 days from last active check-in.
- **Consent Justification:** **Yes.** Explicit, unbundled consent is required because specific habit keys reflect behavioral vulnerabilities.

### 2. `selected_habit_domains` (e.g., "Sleep Architecture", "Digital Focus")
- **Why It Is Needed:** Filters the Wellness Planner UI to the student's chosen self-care domains.
- **Sensitivity & Inferential Risk:** **Low to Moderate.** Persistently tagging a student as interested exclusively in "Mental Resilience" or "Sleep Architecture" establishes a categorical behavioral interest profile.
- **Genuine Necessity:** **Low.** The student can click a domain filter chip in one second upon visiting the page.
- **Less Intrusive Alternative:** Retain domain filtering purely in transient session memory; default to "All Domains" on each visit.
- **Proposed Retention:** Recommended for **exclusion** from initial persistence.
- **Consent Justification:** Yes, if retained.

### 3. `checkin_completion_dates` (e.g., `2026-11-12`, `2026-11-14`)
- **Why It Is Needed:** Powers a visual calendar heatmap or streak counter.
- **Sensitivity & Inferential Risk:** **Moderate.** Exact calendar timestamps constitute temporal metadata that reveals daily schedules, late-night activity patterns, and periods of disengagement (e.g., exam periods or illness).
- **Genuine Necessity:** **Low.** A numeric counter (`current_streak_days: 3`) satisfies behavioral reinforcement without logging discrete historical calendar dates.
- **Less Intrusive Alternative:** Store a simple numeric streak integer incremented on check-in, with zero calendar date strings.
- **Proposed Retention:** In initial minimal schema: **Excluded**. If retained later: Rolling 30 days.
- **Consent Justification:** Yes.

### 4. `recommendation_feedback_types` (`helpful` / `unhelpful` ratings)
- **Why It Is Needed:** Suppresses habits marked unhelpful and prioritizes habits marked helpful.
- **Sensitivity & Inferential Risk:** **Moderate.** Subjective feedback correlates student preferences to specific lifestyle challenges.
- **Genuine Necessity:** **Low.** Rule-based recommendations generate high-quality suggestions dynamically from assessment inputs.
- **Less Intrusive Alternative:** Keep feedback in ephemeral session memory only.
- **Proposed Retention:** Recommended for **exclusion** from initial persistence.
- **Consent Justification:** Yes.

### 5. `selected_country` & 6. `selected_uk_region`
- **Why It Is Needed:** Remembers the student's geographic helpline preference so emergency resources (e.g., Tele-MANAS, NHS 24 on 111, Lifeline NI) appear immediately without menu friction.
- **Sensitivity & Inferential Risk:** **Low to Moderate.** Stores broad jurisdictional location (e.g., "Northern Ireland", "Scotland", "India"). Does not store GPS, IP coordinates, or physical addresses, but establishes geographic origin.
- **Genuine Necessity:** **Moderate for safety.** Eliminates menu navigation during critical moments.
- **Less Intrusive Alternative:** Read a non-identifying client URL query parameter (e.g. `?region=scotland`) bookmarked by the student, or default to general national directories with an instant 1-click switch.
- **Proposed Retention:** Retain only as an optional browser-side preference; excluded from central databases.
- **Consent Justification:** Yes.

---

## 4. Smallest Viable Initial Retention Schema

To adhere strictly to the principle of **Data Minimization (Article 5(1)(c) GDPR and Section 4 DPDP Act 2023)**, Mindora rejects broad behavioral logging. 

For any future implementation of optional personalization, the platform recommends the **Smallest Viable Initial Retention Schema**:

```json
{
  "schema_version": "1.0",
  "storage_tier": "MINIMAL_INITIAL_CATEGORY_C",
  "data": {
    "completed_habit_ids": [
      "sleep_anchor",
      "digital_pomodoro"
    ]
  }
}
```

### Why This Schema is Minimally Viable:
1. **Zero Clinical Association:** Contains zero PHQ-9 answers, zero depression scores, and zero ML prediction risk tiers.
2. **Zero Temporal Tracking:** Excludes calendar dates and timestamps, preventing time-of-day profiling or study rhythm surveillance.
3. **Zero Geographic Tracking:** Excludes country and region tags from persistent records (helpline routing remains a transient session toggle).
4. **Zero Feedback Profiling:** Excludes subjective preference feedback mappings.
5. **Pure Self-Care State:** Stores strictly the identifier strings of active self-care micro-habits the student committed to, fulfilling 100% of the habit-retention value proposition with minimal privacy surface.

---

## 5. Retention Period & Lifecycle Architecture

### Justification of Retention Duration
- **Why 90 Days?** An automatic 90-day expiration window corresponds roughly to one standard university academic term or semester. Inactive students who complete exams or graduate have their records automatically purged before the next term commences.
- **Not a Statutory Legal Mandate:** A 90-day retention duration is an **engineering policy heuristic**, NOT an explicit statutory requirement under the DPDP Act 2023 or GDPR. Both laws require that personal data be retained *only for as long as necessary to satisfy the declared purpose*.
- **Alternative Viable Windows:**
  - *Academic Term Policy (90 Days):* Appropriate for students maintaining semester-long self-care routines.
  - *Short-Cycle Focus Policy (30 Days):* Substantially lower risk; automatically purges habits after 30 days of inactivity.

### Clear Distinction Across Deletion Types

| Deletion Type | Scope & Operational Mechanism | Immediate Effect | Impact on Backups & Exports |
|---|---|---|---|
| **Clearing Active Session** | Purges `st.session_state` in running server memory | Immediate (active tab reverts to defaults) | Zero impact on external storage (none exists) |
| **Withdrawing Consent** | Revokes authorization for future persistent writes | Future visits operate in Session-Only Mode | Does not automatically purge existing historical records unless erasure is requested |
| **Active Record Erasure** | Cryptographically deletes primary persistent record | Immediate in primary storage tier | Does NOT immediately purge secondary disaster-recovery backups |
| **Backup Expiration** | Scheduled rotation of system disaster-recovery snapshots | Gradual purge over automated 30-day snapshot lifecycle | Backup snapshots are unrecoverable once rotation completes or DEK is shredded |
| **Student-Owned File Deletion** | Deletion of client-downloaded `.enc` vault files | Controlled entirely by student on their local device | Server has zero technical ability to delete files on student hardware |

> [!CAUTION]
> **No Absolute Immediate Purge Guarantee for Backups:**  
> Systems that maintain disaster-recovery snapshots cannot promise instantaneous purging from immutable backup media. Production policies must honestly inform students that while primary records are destroyed immediately, backup images expire across an automated 30-day rotation schedule.
