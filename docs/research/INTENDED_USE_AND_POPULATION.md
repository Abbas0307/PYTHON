# MINDORA 2.0 — INTENDED USE, TARGET POPULATION & CLINICAL BOUNDARIES
**Document Ref:** `docs/research/INTENDED_USE_AND_POPULATION.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Status:** Approved Clinical Specification  

---

## 1. INTENDED USE STATEMENT

Mindora 2.0 is an **offline-first, client-side educational and self-reflection software system** intended to assist higher education students in:
1. Reflecting upon their academic workload, sleep patterns, study habits, and self-reported emotional well-being.
2. Completing standardized psychometric self-assessments (PHQ-9) to monitor personal symptom trajectories over time.
3. Discovering evidence-based lifestyle self-regulation micro-habits.
4. Locating verified institutional, campus, and regional crisis support resources.

### 1.1 Operating Constraints
- **Client-Side / Offline Execution:** All assessment processing, psychometric scoring, and statistical inference must occur locally on the student's personal computing device (browser WASM or local runtime) without network transmission of personal health answers.
- **Non-Diagnostic Nature:** Mindora is **not** a medical device, is **not** Software as a Medical Device (SaMD) under FDA/MDR classifications, and does **not** provide diagnostic, prognostic, or therapeutic clinical advice.

---

## 2. INTENDED USER POPULATION

The primary intended population comprises:
- **Higher Education Students:** Individuals actively enrolled in accredited undergraduate, postgraduate, or doctoral educational programmes (e.g., universities, institutes of technology, community colleges).
- **Age of Majority:** Individuals aged **18 years or older** ($\ge 18$).
- **Technological Environment:** Students accessing the platform via standard desktop or mobile web browsers with local storage capabilities.

---

## 3. STRICT CONTRAINDICATIONS & EXCLUDED POPULATIONS

Mindora is explicitly **contraindicated** and prohibited for use in the following populations and scenarios:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CONTRAINDICATIONS & EXCLUSIONS                    │
├────────────────────────────────────────────────────────────────────────┤
│ 1. MINORS (< 18 YEARS OF AGE)                                          │
│    • Status: STRICTLY EXCLUDED.                                        │
│    • Rationale: Minors require specialized pediatric/adolescent        │
│      mental health safeguards, legal guardian consent under DPDP       │
│      Act 2023 / GDPR, and child protection emergency routing.          │
│    • System Action: Immediate age-gate termination with redirection    │
│      to child/youth-specific helplines (e.g., Childline 1098).         │
├────────────────────────────────────────────────────────────────────────┤
│ 2. ACUTE PSYCHOLOGICAL CRISIS & SUICIDAL EMERGENCIES                   │
│    • Status: CONTRAINDICATED FOR SELF-MANAGEMENT / ML SCORING.         │
│    • Rationale: Individuals experiencing active suicidal ideation,     │
│      intent to self-harm, severe psychosis, or mania require immediate │
│      human professional intervention.                                  │
│    • System Action: Deterministic Item 9 escalation halts standard     │
│      interaction and presents high-contrast crisis contact cards       │
│      (Tele-MANAS, 999/112).                                            │
├────────────────────────────────────────────────────────────────────────┤
│ 3. FORMAL CLINICAL TRIAGE, DIAGNOSIS, OR THERAPY PRESCRIPTION          │
│    • Status: STRICTLY PROHIBITED.                                      │
│    • Rationale: Algorithmic predictions cannot substitute for formal   │
│      psychiatric evaluation, differential diagnosis, or medication     │
│      titration.                                                        │
│    • System Action: Permanent legal disclaimers and non-diagnostic     │
│      copy enforced across all views.                                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. HUMAN-IN-THE-LOOP & DECISION-SUPPORT BOUNDARIES

Mindora follows a strict **Student-in-the-Loop Human Agency Architecture**:
1. **Student as Primary Agent:** The student retains complete autonomy over their data, self-reflection disclosures, habit commitments, and decisions to seek external medical care. The software acts purely as an informative mirror, never as an authoritative decision-maker.
2. **No Automated Decisions:** The platform does not make automated decisions that produce legal, academic, or disciplinary effects. No reports are transmitted to university administrators, academic registrars, insurance providers, or parents.
3. **Escalation to Human Care:** Whenever screening responses indicate moderate-to-severe symptom burden (PHQ-9 $\ge 10$) or any affirmative response to Item 9 (suicidal ideation), the system explicitly recommends consulting a qualified healthcare professional and provides direct dial links to verified support helplines.

---

## 5. DOCUMENT RECONCILIATION

- [x] Intended use explicitly defined as non-diagnostic educational self-reflection.
- [x] Target population restricted to enrolled adult students ($\ge 18$).
- [x] Absolute contraindications established for minors, acute crisis, and clinical triage.
- [x] Human-in-the-loop and student agency boundaries codified.
