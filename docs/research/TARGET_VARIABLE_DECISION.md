# MINDORA 2.0 — TARGET VARIABLE DECISION & VALIDITY FRAMEWORK
**Document Ref:** `docs/research/TARGET_VARIABLE_DECISION.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Status:** Approved Target Definition  

---

## 1. PRIMARY OBJECTIVE

In statistical machine learning applied to mental wellbeing, **the definition of the target variable dictates the validity, ethics, and clinical safety of the entire system.** Predicting an ill-defined, proxy-riddled, or clinically ungrounded target produces models that optimize noise or reinforce healthcare inequities.

This document formally assesses the four candidate target variables considered for Mindora, analyzes their epistemological limitations, and establishes the binding decision for Mindora 2.0.

---

## 2. EVALUATION OF CANDIDATE TARGET CONSTRUCTS

### 2.1 Candidate 1: Dataset A Binary `Depression` Indicator ($0/1$)
- **Empirical Definition:** A single binary column named `Depression` ($0 = 11,565$, $1 = 16,336$, prevalence = $58.55\%$).
- **Scientific Source:** Unverified public Kaggle benchmark dataset of crowdsourced/augmented origin.
- **Critical Limitations:**
  1. **Absence of Clinical Specification:** No documentation exists defining whether the label reflects a clinical diagnostic interview (e.g., SCID-5), a screener cutoff (e.g., PHQ-9 $\ge 10$), or an unverified self-assessment.
  2. **Severe Prevalence Distortion:** An empirical prevalence of $58.55\%$ is approximately double the accepted epidemiological baseline for university students ($18\% - 32\%$). Uncalibrated models trained on this target will severely overestimate personal risk.
  3. **Low Linear Feature Multicollinearity:** All VIFs are $\approx 1.01 - 1.04$, indicating features vary almost independently, which is atypical of human psychological phenotypes.
- **Utility & Boundary:** **Retained strictly as an engineering benchmark target for computational pipeline verification, calibration experiments, and ONNX runtime parity testing.** It must never be presented to students as a clinical depression probability.

### 2.2 Candidate 2: Dataset B Lifetime Professional Diagnosis
- **Empirical Definition:** *"Has a qualified healthcare professional ever told you that you have depression"* (`no`: 98, `yes`: 45, `not sure`: 19).
- **Scientific Construct:** Self-reported retrospective history of clinical consultation.
- **Critical Limitations:**
  1. **Healthcare Access Confounding (Treatment Gap):** According to the National Mental Health Survey (NMHS) of India, the mental health treatment gap exceeds $75\% - 85\%$. In a student population, answering "no" to this question often indicates an absence of financial resources, campus psychiatric services, or mental health literacy, rather than an absence of depressive pathology.
  2. **State vs. Lifetime Trait Mismatch:** A student diagnosed 5 years ago who is now fully healthy and thriving will answer "yes", while an undiagnosed student actively experiencing acute depressive crisis will answer "no". A model predicting this target learns **healthcare-seeking privilege**, not active student distress.
  3. **Diagnostic Ambiguity:** $11.73\%$ ($N=19$) answered "not sure", introducing severe label noise if forced into binary classification.
- **Utility & Boundary:** **Rejected as a machine learning target.** It cannot be used for supervised training or independent model evaluation.

### 2.3 Candidate 3: Standardized Psychometric Screener Score (e.g., PHQ-9 Continuous $0-27$)
- **Empirical Definition:** Sum of scores from the 9-item Patient Health Questionnaire ($0-3$ per item, total $0-27$).
- **Scientific Construct:** Self-reported symptom burden across DSM-5 major depressive disorder criteria over the preceding 2 weeks.
- **Strengths:**
  1. **Temporal Alignment:** Measures active, current symptoms, aligning temporally with lifestyle and academic variables.
  2. **Access-Independent:** Evaluates the student's experienced symptoms directly, bypassing the healthcare access barrier.
  3. **Granular & Continuous:** Provides continuous severity scoring ($0-27$) with validated categorical tiers (Minimal, Mild, Moderate, Moderately Severe, Severe).
- **Critical Boundary Clarification:** The PHQ-9 is a **screening instrument, not an independent clinical diagnosis**, and must **never** be labeled as "clinical ground truth". A clinical diagnosis requires evaluation by a licensed physician or clinical psychologist to rule out somatic illnesses, substance-induced conditions, bereavement, and to verify functional impairment.

### 2.4 Candidate 4: Multidimensional Lifestyle Wellbeing & Friction Index
- **Empirical Definition:** A composite or multi-output indicator measuring observable student friction: Sleep Debt ($< 6$ hours/night), Academic Workload Overload ($> 10$ hours/day), High Self-Reported Academic Pressure ($\ge 4/5$), and Severe Financial Strain ($\ge 4/5$).
- **Scientific Construct:** Behavioral and environmental stress burden.
- **Strengths:**
  1. **Zero Pseudo-Medical Pretension:** Completely non-clinical; does not attempt to predict medical pathology from lifestyle survey questions.
  2. **Direct Actionability:** Friction indicators correspond directly to behavioral micro-habits (sleep hygiene, study pacing, financial counseling navigation).
  3. **Full Explanatory Transparency:** The student immediately understands why a friction area is highlighted.

---

## 3. FINAL TARGET DECISION FOR MINDORA 2.0

Mindora 2.0 establishes a strict separation between **Dataset A Legacy Engineering Benchmarks**, **Current Deterministic Wellbeing Insights**, and **Future Research Proposals**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MINDORA TARGET VARIABLE ARCHITECTURE                 │
├────────────────────────────────┬───────────────────────────────────────┤
│ TRACK 1: Computational Model   │ • Retains Dataset A binary indicator  │
│          Engineering Benchmark │   strictly for pipeline testing,      │
│          (Engine 2 - Research) │   calibration, and ONNX parity.       │
│                                │ • Model Role: Legacy engineering      │
│                                │   prediction of original survey label.│
│                                │ • PROHIBITION: Must NOT be relabeled  │
│                                │   as an "Academic Strain Model".      │
│                                │ • Output: Internal benchmark score;   │
│                                │   NEVER displayed to students as a    │
│                                │   clinical or strain probability.     │
├────────────────────────────────┼───────────────────────────────────────┤
│ TRACK 2: Student Wellbeing &   │ • Handled exclusively by Engine 1     │
│          Clinical Screening    │   (Deterministic & Rule-Based).       │
│          (Engine 1 - Screener) │ • PHQ-9 Standardized Score (0–27).    │
│                                │ • Item 9 Supportive Safety Protocol.  │
│                                │ • Transparent lifestyle heuristics    │
│                                │   (sleep debt, workload overload).    │
│                                │ • Medical Claims: Screening only;     │
│                                │   non-diagnostic disclaimer.          │
├────────────────────────────────┼───────────────────────────────────────┤
│ TRACK 3: Future Strain &       │ • Separate research proposal requiring│
│          Screener Research     │   an explicit construct definition,   │
│          (Long-Term Proposal)  │   validated measurement model, and    │
│                                │   independent multi-site validation.  │
│                                │ • Mandatory IRB & explicit ML consent.│
└────────────────────────────────┴───────────────────────────────────────┘
```

### 3.1 Critical Construction Rules:
1. **No Relabeling of Dataset A:** A model trained on Dataset A's `Depression` label will **never** be renamed or presented as a validated measure of academic strain. That would merely reproduce the original unverified target's patterns under a euphemistic label.
2. **No Strain Probability:** Mindora does not generate a "strain probability".
3. **Deterministic Insights Primacy:** Current student lifestyle and academic insights are generated exclusively through transparent, documented deterministic rules in Engine 1.

### 3.2 Strict Vocabulary & Naming Mandates
To prevent user deception, regulatory non-compliance, and clinical hazards, the following terminology rules are binding across all code, tests, documentation, and user interfaces:

| Forbidden Terminology | Mandated Replacement Terminology |
| :--- | :--- |
| "Depression Probability" | **"Dataset A Benchmark Model Output"** (Internal Only) |
| "Academic Strain Probability" | **"Deterministic Lifestyle & Academic Insights"** (Rule-Based) |
| "Clinical Risk Score" | **"Self-Reported Lifestyle Friction Indicator"** |
| "Depression Diagnosis" | **"PHQ-9 Symptom Screening Tier"** (Screening Only) |
| "Predicted Mental Illness" | **"Multivariate Survey Pattern Analysis"** |
| "Clinical Ground Truth" | **"Standardized Psychometric Screener Benchmark"** |

---

## 4. SCIENTIFIC RECONCILIATION

- [x] Dataset A target isolated strictly to engineering and calibration benchmarks.
- [x] Dataset B diagnosis question prohibited from supervised model training.
- [x] PHQ-9 formalized as a screening screener, not clinical ground truth.
- [x] Forbidden terminology codified and replaced with defensible wellbeing semantics.
- [x] No modifications to existing code or model contracts executed.
