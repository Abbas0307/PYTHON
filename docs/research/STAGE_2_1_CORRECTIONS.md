# MINDORA 2.0 — STAGE 2.1: TARGET VALIDITY & RESEARCH PROTOCOL CORRECTIONS
**Document Ref:** `docs/research/STAGE_2_1_CORRECTIONS.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Review Type:** Scientific, Methodological, and Clinical Protocol Refinement  
**Status:** Approved Scientific Specification  

---

## 1. ACADEMIC & LIFESTYLE STRAIN INDEX — CRITICAL CORRECTION

### 1.1 The Methodological Error in Initial Proposal
In the initial Stage 2 draft, it was suggested that a model trained on Dataset A's `Depression` label could be relabeled as an *"Academic & Lifestyle Strain Index"*. 

**This proposal is scientifically invalid and is formally retracted.** 

Renaming the output of a model trained on Dataset A does not validate a new construct. It merely reproduces the statistical patterns, unverified assumptions, and high base rate ($58.55\%$) of the original target under a euphemistic label. A machine learning model cannot predict "strain" unless "strain" was the measured, operationalized, and validated ground truth during data collection.

### 1.2 Binding Three-Way Architectural Separation
To ensure absolute scientific integrity, Mindora enforces three distinct concepts:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MINDORA THREE-TIER CONCEPT SEPARATION                │
├────────────────────────────────────────────────────────────────────────┤
│ 1. DATASET A LEGACY ENGINEERING BENCHMARK                              │
│    • Prediction Target: Original survey-derived binary `Depression`    │
│      label ($0/1$).                                                    │
│    • Scope & Utility: STRICTLY COMPUTATIONAL ENGINEERING BENCHMARK.    │
│      Used to evaluate pipeline transforms, inference speed, and ONNX   │
│      export parity.                                                    │
│    • Boundary: NEVER described as a validated measure of academic      │
│      strain, clinical risk, or personal depression.                    │
├────────────────────────────────────────────────────────────────────────┤
│ 2. LIFESTYLE & ACADEMIC WELLBEING INSIGHTS (ENGINE 1 - CURRENT)        │
│    • Operationalization: Purely TRANSPARENT, DETERMINISTIC RULES.      │
│    • Examples: Documented heuristics evaluating sleep debt (<6 hrs),   │
│      workload overload (>10 hrs), and study dissatisfaction.           │
│    • Boundary: Actionable self-reflection feedback; ZERO probabilistic │
│      claims; ZERO pseudo-medical diagnostic framing.                   │
├────────────────────────────────────────────────────────────────────────┤
│ 3. FUTURE STRAIN CONSTRUCT (PROPOSED RESEARCH ONLY)                    │
│    • Requirements: A separate future research proposal requiring:      │
│      a) An explicit theoretical construct definition (e.g., student    │
│         academic burnout or cognitive fatigue).                        │
│      b) A multi-item psychometrically validated measurement model.     │
│      c) Primary data collection with formal IRB and ethics review.     │
│    • Boundary: NOT trained on Dataset A; NO synthetic re-labeling.     │
└────────────────────────────────────────────────────────────────────────┘
```

**Binding Prohibitions:**
- Mindora will **never** claim that an ML model trained on Dataset A predicts validated academic strain.
- Mindora will **never** generate a "strain probability".

---

## 2. EVALUATION SPLIT ASSUMPTIONS, UNCERTAINTY & GENERALIZABILITY

### 2.1 Assumptions Behind the 60/20/20 Test Split & ROC-AUC Standard Error
The initial Stage 2 protocol derived an ROC-AUC standard error of $SE \le 0.0069$ on the $20\%$ test set ($N \approx 5,580$) using the Hanley-McNeil formulation:
$$SE(\text{AUC}) = \sqrt{\frac{\theta(1-\theta) + (N_A - 1)(Q_1 - \theta^2) + (N_N - 1)(Q_2 - \theta^2)}{N_A \cdot N_N}}$$

While mathematically correct under asymptotic assumptions, **this formula relies on idealized assumptions that must be critically qualified in survey data:**
1. **Independent and Identically Distributed (IID) Observations:** The formula assumes each record is sampled independently from an infinite population. In educational survey data, hidden clustering (e.g., students from the same university, classroom, or demographic group) induces positive intra-cluster correlation, which violates independence and artificially narrows the standard error.
2. **Absence of Duplicate / Near-Duplicate Records:** If a dataset contains duplicate responses, near-duplicates, or synthetic interpolation artifacts, instances in the test set may closely mirror instances in the training set. A simple random split will leak information across partitions, artificially inflating test set AUC and underestimating true variance.
3. **Source & Collection Effects:** Dataset A was gathered from an unverified public online source. Unknown sampling biases (e.g., specific student forum recruitment) mean that a random split evaluates **within-distribution interpolation**, not true demographic or institutional generalizability.
4. **Class Distribution:** The uncalibrated $58.55\%$ positive class rate alters the relative sample sizes ($N_A = 3,260$, $N_N = 2,320$), which shifts the precision-recall balance.

### 2.2 Why a Random Split Does NOT Prove External Generalizability
- A random 60/20/20 split partitions a single dataset. It measures whether an algorithm can interpolate within that specific dataset's collection artifact space.
- **A large test set ($N=5,580$) provides statistical precision regarding the test set itself, NOT proof of external generalizability.** High performance on this split does not guarantee the model will perform accurately on students from a different university, cultural background, or academic year.

### 2.3 Strict Preprocessing & Tuning Isolation Protocol
To prevent any form of optimistic evaluation bias:
1. **Zero Test-Set Peeking:** Preprocessing parameters (median imputation values, one-hot encoders, standard scalers), feature selection algorithms, and hyperparameter tuning must be fitted **strictly on the 60% Training Split** (or within cross-validation folds on the train+val split).
2. **Final Evaluation Lock:** The 20% Held-Out Test Set is evaluated **exactly once** after all modeling decisions are frozen.
3. **Bootstrapped Confidence Intervals:** In addition to asymptotic formulas, all test set metrics must report non-parametric **$95\%$ Bootstrap Confidence Intervals** ($B = 1,000$ resamples) to provide empirical empirical uncertainty bounds.

---

## 3. CALIBRATION BOUNDARIES & SEMANTIC SCOPE

Probability calibration is a mathematical adjustment; it does not confer clinical truth. Mindora explicitly distinguishes between three distinct calibration concepts:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CALIBRATION BOUNDARY TIERS                      │
├────────────────────────────────────────────────────────────────────────┤
│ LEVEL 1: BENCHMARK CALIBRATION (DATASET A COMPUTATIONAL ONLY)          │
│ • Definition: Post-processing (Platt scaling / Isotonic regression) to │
│   align model output distribution with Dataset A's binary flag         │
│   (58.55% empirical base rate).                                        │
│ • Scope: A STRICT COMPUTATIONAL BENCHMARK. Tests whether an algorithm  │
│   can minimize Brier score on a fixed test split.                      │
│ • BOUNDARY: NEVER presented to students as a true clinical or personal │
│   depression probability.                                              │
├────────────────────────────────────────────────────────────────────────┤
│ LEVEL 2: REAL-WORLD OUTCOME CALIBRATION (REPRESENTATIVE POPULATION)    │
│ • Definition: Calibrating predictions against an independently         │
│   verified epidemiological baseline from a target student population   │
│   (e.g., adjusting for an actual 20% campus point-prevalence).         │
│ • Status: NOT POSSIBLE WITH CURRENT DATASETS. Requires verified        │
│   representative multi-campus epidemiological survey data.             │
├────────────────────────────────────────────────────────────────────────┤
│ LEVEL 3: CLINICAL PROBABILITY CALIBRATION (MEDICAL SETTING)            │
│ • Definition: Calibrating against physician-diagnosed Major Depressive │
│   Disorder in a clinical healthcare environment.                       │
│ • Status: STRICTLY OUT OF SCOPE. Mindora is an educational tool, not a │
│   clinical diagnostic device.                                          │
└────────────────────────────────────────────────────────────────────────┘
```

**Binding Directive:** Calibrated Dataset A benchmark probabilities must **never** be displayed to students as personal depression probabilities.

---

## 4. PHQ-9 ITEM 9 SAFETY PROTOCOL: SUPPORTIVE ESCALATION

### 4.1 Retraction of "Zero-Tolerance Crisis Escalation" Wording
The phrase *"zero-tolerance crisis escalation"* is formally retracted. In psychiatric practice, treating any passive self-harm expression as an automatic emergency can induce alarm fatigue, stigmatize the student, and cause harmful over-escalation (such as calling police on someone who simply feels overwhelmed).

### 4.2 Clinical Distinction: Screening Response vs. Imminent Danger

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ITEM 9 SAFETY RESPONSE ARCHITECTURE                  │
├───────────────────────────────────┬────────────────────────────────────┤
│ POSITIVE ITEM 9 SCREENING         │ IMMINENT RISK / IMMEDIATE DANGER   │
│ RESPONSE (SCORE 1, 2, OR 3)       │ DISCLOSED                          │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Nature: Self-reported thought   │ • Nature: Active suicidal intent,  │
│   of self-harm or being better    │   immediate plan, or active        │
│   off dead over past 2 weeks.     │   emergency danger to life.        │
│ • System Action:                  │ • System Action:                   │
│   - Calm, supportive response.    │   - High-priority emergency        │
│   - Normalizes seeking support.   │     contact banner.                │
│   - Prioritizes confidential warm │   - Direct dial to emergency       │
│     lines & crisis text lines     │     services (999/112 in UK;       │
│     (Tele-MANAS, SHOUT, 988).     │     112/Tele-MANAS in India; 911). │
│   - Provides campus counseling.   │   - Clear guidance for immediate   │
│   - Encourages consulting a       │     safety.                        │
│     doctor or trusted adult.      │                                    │
└───────────────────────────────────┴────────────────────────────────────┘
```

### 4.3 Key Safety Architecture Rules:
1. **Decoupled from ML:** Item 9 is **never** used as an input feature for any machine learning model.
2. **Human Professional Primacy:** Mindora always directs the student toward human professional support.
3. **LLM Prohibitions:** Small Language Models (e.g., local Qwen) are strictly **prohibited from evaluating suicidal intent, conducting crisis counseling, or generating unconstrained empathetic responses to crisis disclosures.** When Item 9 is positive, the system serves pre-vetted, deterministic safety cards exclusively.

---

## 5. ACADEMIC FACULTY TAXONOMY & DEGREE MAPPING

To resolve the categorical sparsity of granular degrees (e.g., 63 free-text variations in Dataset B) in future research pipelines, Mindora defines a documented **6-Cluster Academic Taxonomy**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MINDORA ACADEMIC FACULTY TAXONOMY                    │
├────────────────────────────┬───────────────────────────────────────────┤
│ 1. Engineering &           │ B.Tech, B.E., B.E. EC, M.Tech, BCA, MCA,  │
│    Technology              │ Computer Science, AI/ML, Data Science     │
├────────────────────────────┼───────────────────────────────────────────┤
│ 2. Business, Commerce &    │ BBA, B.Com, MBA, M.Com, Finance,          │
│    Management              │ Economics, Accounting, Marketing          │
├────────────────────────────┼───────────────────────────────────────────┤
│ 3. Humanities &            │ BA, MA, BA Psychology, Journalism, Law,   │
│    Social Sciences         │ LLB, Political Science, Sociology, Arts   │
├────────────────────────────┼───────────────────────────────────────────┤
│ 4. Medical, Nursing &      │ MBBS, BDS, B.Pharm, M.Pharm, Nursing,     │
│    Health Sciences         │ Physiotherapy, Allied Health Sciences     │
├────────────────────────────┼───────────────────────────────────────────┤
│ 5. Pure & Applied          │ B.Sc, M.Sc, Physics, Chemistry,           │
│    Sciences                │ Mathematics, Biotechnology, Life Sciences │
├────────────────────────────┼───────────────────────────────────────────┤
│ 6. Other & Unclassified    │ Architecture, B.Des, Hotel Management,    │
│    (MANDATORY CATEGORY)    │ Ambiguous abbreviations, Unlisted degrees │
└────────────────────────────┴───────────────────────────────────────────┘
```

### 5.1 Mapping Guidelines:
- **No Guessed Mappings:** If a degree abbreviation or title is ambiguous, it is assigned strictly to **"Other & Unclassified"**.
- **Data Minimisation & Governed Retention:** Raw free-text survey responses must **NOT** be permanently retained by default. In client-side runtime, raw text is processed ephemerally in volatile application memory to map to faculty clusters and references are immediately released without persistence to web storage, cookies, server logs, or exports. In research audit archives, identifiable raw text may only be stored when explicitly justified by research necessity, authorized under participant consent, governed by ethics approval, and bound to a purpose-specific retention schedule with documented deletion/irreversible anonymisation procedures. Arbitrary blanket retention periods (e.g. 12 months) are prohibited.
- **Dataset B Quarantine Preserved:** Dataset B remains strictly quarantined from model training and evaluation; this taxonomy is formulated for future research protocols and UI dropdown menus.

---

## 6. INTENDED POPULATION & MINOR ACCESS SAFEGUARDS

### 6.1 Intended Product Population vs. Legal Compliance
- **Intended Population Definition:** Mindora is designed for **adult students ($\ge 18$ years of age)** in tertiary higher education.
- **Legal Compliance Clarification:** Age-gating the product interface does **not** automatically establish full legal compliance with the DPDP Act 2023, GDPR, or UK Data Protection Act. Compliance requires holistic institutional governance, operational data handling policies, and qualified legal oversight.
- **Minor Exclusion Clarification:** Quarantining the 17 minor records from Dataset B prevents unconsented profiling in research; it does **not** make the overall product automatically safe or compliant for minors.

### 6.2 Minor Access Handling (Adolescent Redirection Protocol)
If a user indicates an age $< 18$ during interface interaction:
1. **No Hostile Lockout:** The system does not present an abrupt or punitive error message.
2. **Supportive Redirection:** The interface displays a clear, supportive notice:
   > *"Mindora is designed specifically for adult university students (18+). If you are under 18, we want to make sure you have access to services designed specifically for young people and adolescents."*
3. **Youth-Specific Helplines Rendered:**
   - **India:** Child Helpline **1098** (24/7 toll-free emergency phone, MWCD / Mission Vatsalya). General crisis triage via Tele-MANAS (**14416 / 1800-89-14416**, 24/7; note: do not claim dedicated youth counselors unless independently confirmed). Fallback: ERSS 112. (KIRAN 1800-599-0019 was integrated into Tele-MANAS in 2022 and is removed as an active fallback).
   - **United Kingdom:** Childline UK **0800 1111** (Freephone 24/7; 1-to-1 counsellor web chat at `childline.org.uk` 7:30 AM – 3:30 AM daily; for young people under 19, NSPCC). Free crisis text via SHOUT (Text **'SHOUT' to 85258**, 24/7 across UK networks). Regional urgent NHS pathways: England NHS 111, Wales NHS 111 (opt 2), Scotland NHS 24 (111), NI Lifeline (**0808 808 8000**). Fallback: 999.
   - **United States:** National 988 Suicide & Crisis Lifeline (Call/Text **988**, 24/7 crisis counselling funded by SAMHSA; coordinates with 911 for imminent safety emergencies; distinct from emergency services 911). Youth peer support via YouthLine (Nonprofit service operated by Lines for Life in Oregon, reach across all 50 states; serving youth up to age 24; Call **1-877-968-8491**, Text **teen2teen to 839863**, or chat at `https://www.theyouthline.org`; youth peer support daily 4:00 PM – 10:00 PM Pacific; outside youth peer-support hours, adult staff from Lines for Life answer the YouthLine phone line; not a federal service). Fallback: Text HOME to 741741; for immediate physical danger, dial 911.
   - **Canada:** 988 Suicide Crisis Helpline (Call/Text **988**, 24/7 bilingual national service). Dedicated youth support via Kids Help Phone (Call **1-800-668-6868** or Text **CONNECT to 686868**; French: Text **PARLER to 686868**; 24/7 bilingual support for ages up to 25). Fallback: Call 911.

---

## 7. DOCUMENT RECONCILIATION SUMMARY

All six correction areas have been codified and cross-referenced:
- [x] Academic & Lifestyle Strain Index separated from Dataset A legacy model.
- [x] Evaluation split assumptions, clustering risks, and lack of external generalizability detailed.
- [x] Three tiers of calibration defined; benchmark calibration restricted to computational experiments.
- [x] PHQ-9 Item 9 safety protocol updated to supportive escalation, distinguishing screening from imminent danger.
- [x] 6-faculty taxonomy codified, including mandatory "Other & Unclassified" category.
- [x] Intended adult population clarified; adolescent redirection protocol defined for minor access.
- [x] Zero models trained, benchmarked, or split; production files intact.
