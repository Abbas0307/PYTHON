# MINDORA 2.0 — FEATURE ELIGIBILITY & RESEARCH AUDIT POLICY
**Document Ref:** `docs/research/FEATURE_ELIGIBILITY_POLICY.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Status:** Approved Feature Specification  

---

## 1. PRIMARY OBJECTIVE

Mindora's production machine-learning pipeline currently operates under a 10-feature contract codified in `shared/contracts/feature_contract.json` (6 numerical and 4 categorical features, expanding to 45 one-hot encoded columns).

This policy conducts a comprehensive scientific audit of each feature's validity, measurement quality, cross-dataset availability, and susceptibility to demographic or institutional bias. It establishes concrete recommendations for future model iterations while **strictly preserving the existing feature contract during Stage 2.**

---

## 2. SCIENTIFIC AUDIT OF THE 10 PRODUCTION FEATURES

### 2.1 Numerical Features

#### 1. `Age`
- **Scientific Rationale:** Age is an established demographic covariate in psychological epidemiology; transition periods (e.g., ages 18–21) correlate with unique identity and academic stressors.
- **Measurement Quality:** High (discrete integer years).
- **Cross-Dataset Availability:** Present in both Dataset A (range 18–59) and Dataset B (range 13–69).
- **Data Quality & Bias:** High quality, but requires strict bounding ($18-35$). Minors ($<18$) must be quarantined to prevent legal and developmental non-compliance.
- **Verdict for Future Research:** **RETAIN (with adult age filter $\ge 18$).**

#### 2. `Academic Pressure`
- **Scientific Rationale:** Chronic perceived academic pressure is among the strongest predictors of tertiary student anxiety and depressive distress.
- **Measurement Quality:** Moderate in Dataset A (numeric float $0.0-5.0$, Pearson $r = +0.4748$ with target). In Dataset B, measured as ordinal strings (`very low`, `low`, `moderate`, `high`, `very high`).
- **Data Quality & Bias:** Strong predictor, but suffers from subjective self-reporting variance.
- **Verdict for Future Research:** **RETAIN (standardize to 5-point Likert scale with behavioral anchors).**

#### 3. `CGPA` (Cumulative Grade Point Average)
- **Scientific Rationale:** Often assumed to proxy student distress or failure.
- **Measurement Quality:** **Extremely Poor across multiple dimensions:**
  1. *Zero Correlation in Benchmark Data:* In Dataset A, the linear correlation between CGPA and Depression is virtually non-existent: Pearson $r = \mathbf{+0.0222}$, Spearman $\rho = \mathbf{+0.0218}$.
  2. *Grading Scale Incompatibility:* Educational institutions globally use fundamentally incompatible scales (e.g., 10-point Indian CGPA, 4.0 US GPA, UK Honors classifications [1st, 2:1, 2:2], and percentage systems [0–100%]).
  3. *Survey Input Corruption:* In Dataset B, free-text entry yielded non-numeric emoji entries (`🤷‍♂️`), text refusals (`'Nill'`, `'No'`), and unanchored scales.
- **Verdict for Future Research:** **CANDIDATE FOR DEPRECATION / REDESIGN.** In future research, CGPA should either be removed or replaced with a validated subjective construct: *"Perceived satisfaction with academic performance"* (1–5 scale).

#### 4. `Study Satisfaction`
- **Scientific Rationale:** Directly measures subjective academic contentment and burnout resilience.
- **Measurement Quality:** High. Both datasets use a compatible 1–5 scale (Dataset A Pearson $r = -0.1680$).
- **Data Quality & Bias:** Low missingness ($0$ nulls across both datasets). Clean monotonic relationship with distress.
- **Verdict for Future Research:** **RETAIN.**

#### 5. `Work/Study Hours`
- **Scientific Rationale:** Excessive combined working and study hours indicate chronic overload, sleep deprivation, and lack of restorative leisure.
- **Measurement Quality:** Moderate. Bounded in Dataset A ($0.0-12.0$, Pearson $r = +0.2086$). In Dataset B, free-text inputs contained range strings (`'3-4 '`, `'3 hrs'`).
- **Data Quality & Bias:** Requires strict numeric UI steppers ($0-16$ hours/day) to prevent string corruption.
- **Verdict for Future Research:** **RETAIN (with constrained numeric validation).**

#### 6. `Financial Stress`
- **Scientific Rationale:** Socio-economic strain and food/housing insecurity are major structural risk factors for university student distress.
- **Measurement Quality:** High (discrete 1–5 integer scale). Strong association in Dataset A: Pearson $r = \mathbf{+0.3636}$.
- **Data Quality & Bias:** Dataset A contained exactly 3 null values ($0.0108\%$), cleanly handled via median imputation. Dataset B is 100% complete.
- **Verdict for Future Research:** **RETAIN.**

---

### 2.2 Categorical Features

#### 7. `Gender`
- **Scientific Rationale:** Well-established epidemiological differences in mental health symptom reporting, seeking help, and societal pressures.
- **Measurement Quality & Inclusivity Limitation:**
  - *Dataset A:* Binary only (`Male`: 15,547, `Female`: 12,354). Lacks non-binary representation.
  - *Dataset B:* Includes `Female` (90), `Male` (63), and `Prefer not to say` (9).
- **Bias & Fairness:** Modern student populations require non-binary and diverse gender options. The production one-hot schema (`Gender_Female`, `Gender_Male`) currently drops diverse students or forces arbitrary mapping.
- **Verdict for Future Research:** **REVISE.** Expand to 4 categories (`Female`, `Male`, `Non-binary / Gender Diverse`, `Prefer not to say`) with neutral zero-imputation in legacy pipelines.

#### 8. `Sleep Duration`
- **Scientific Rationale:** Sleep disruption, circadian misalignment, and chronic insomnia are primary biological drivers of depressive episodes.
- **Measurement Quality:** High predictive importance in Dataset A.
- **Technical Incompatibility Observed in Stage 1:**
  - Dataset A uses ASCII hyphens: `'5-6 hours'`, `'7-8 hours'`, `'Less than 5 hours'`, `'More than 8 hours'`, `'Others'`.
  - Dataset B uses Unicode en-dashes: `'5–6 hours'`, `'7–8 hours'`, `'Less than 5 hours'`, `'More than 8 hours'`.
  - Naive string matching produces $0\%$ overlap without unicode normalization.
- **Verdict for Future Research:** **RETAIN (enforce ISO standardized text codes).**

#### 9. `Dietary Habits`
- **Scientific Rationale:** Nutritional regularity, gut-brain axis stability, and balanced meals correlate with student resilience and energy regulation.
- **Measurement Quality:** 3 primary categories (`Healthy`, `Moderate`, `Unhealthy`). Dataset A includes `Others` (12 rows); Dataset B includes `Prefer not to say` (10 rows).
- **Verdict for Future Research:** **RETAIN (standardize to 3 core nutritional categories).**

#### 10. `Degree`
- **Scientific Rationale:** Academic discipline workload and professional culture vary widely (e.g., Medicine vs Arts vs Engineering).
- **Measurement Quality & Categorical Sparsity Problem:**
  - *Dataset A:* Fixed into 28 standardized categorical degrees, creating 28 sparse one-hot columns.
  - *Dataset B:* 63 free-text string variations across only 162 students (`B.E`, `Btech`, `B.tech`, `B.Tech`, `BTech`, `BTECH`, `B tech`, etc.).
  - *Methodological Flaw:* Granular degrees induce extreme feature sparsity, high degrees of freedom, and poor generalization across universities with different degree naming conventions.
- **Verdict for Future Research:** **CANDIDATE FOR RESTRUCTURING.** Future models must consolidate granular degrees into a documented **6-Cluster Academic Faculty Taxonomy**:

| Faculty Cluster | Description & Scope | Exemplar Degree Mappings | Handling of Ambiguity |
| :--- | :--- | :--- | :--- |
| **1. Engineering & Technology** | Computing, engineering disciplines, hardware, AI/ML, data science. | `B.Tech`, `B.E.`, `B.E EC`, `M.Tech`, `BCA`, `MCA`, `BSc CS`, `BTech CSE Aiml`. | Clear STEM engineering/computing titles. |
| **2. Business, Commerce & Management** | Administration, financial accounting, commerce, marketing, analytics. | `BBA`, `B.Com`, `MBA`, `M.Com`, `BCom Finance`, `BMS`. | Core business/commerce degrees. |
| **3. Humanities & Social Sciences** | Arts, psychology, legal studies, humanities, journalism, sociology. | `BA`, `MA`, `BA Psychology`, `LLB`, `LLM`, `BJMC`, `B.Ed`. | Law and arts/social sciences. |
| **4. Medical, Nursing & Health Sciences** | Clinical medicine, dentistry, nursing, pharmacy, allied health. | `MBBS`, `BDS`, `B.Pharm`, `M.Pharm`, `B.Sc Nursing`, `BPT`. | Certified healthcare disciplines. |
| **5. Pure & Applied Sciences** | Natural sciences, chemistry, physics, mathematics, biological sciences. | `B.Sc`, `M.Sc`, `BSc Physics`, `BSc Chemistry`, `BSc Biotech`. | Basic science curricula. |
| **6. Other & Unclassified (MANDATORY)** | Creative design, architecture, vocational studies, and ambiguous entries. | `B.Des`, `B.Arch`, `Hotel Management`, `Culinary Arts`, unlisted strings. | **Default catch-all. No guessed mappings permitted.** |

#### Mapping & Governance Rules:
1. **No Invented Mappings:** If a degree entry is ambiguous, abbreviated indistinctly, or cannot be verified from the institutional context, it is mapped strictly to **"Other & Unclassified"**.
2. **Data Minimisation & Governed Retention:** Free-text degree responses must **NOT** be permanently stored by default. In the client-side application, raw strings are mapped ephemerally in volatile working memory to faculty clusters and references are immediately released (never written to web storage, cookies, server logs, or exports). In research audits, identifiable raw text may only be retained in specialized, access-controlled archives when explicitly justified by research necessity, authorized under participant consent, governed by ethics approval, and bound to a purpose-specific retention schedule with documented deletion/irreversible anonymisation procedures. Blanket retention periods are prohibited.
3. **Dataset B Quarantine Re-affirmed:** Dataset B remains **strictly quarantined from model training and evaluation**. This taxonomy is established for future primary research instruments and UI dropdown standardization.

---

## 3. STRICTLY EXCLUDED FEATURES & SAFETY RATIONALE

The following seven features from Dataset A remain **strictly excluded** from Mindora's ML model:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   EXCLUDED VARIABLES & SAFETY RATIONALE                │
├──────────────────────────────────────┬─────────────────────────────────┤
│ 1. Have you ever had suicidal        │ • Target Leakage: 79.05% of Yes │
│    thoughts ?                        │   have Depression = 1.          │
│                                      │ • CLINICAL HAZARD: Must never be│
│                                      │   used as an ML input feature.  │
│                                      │ • Strict isolation in PHQ-9     │
│                                      │   Item 9 deterministic safety.  │
├──────────────────────────────────────┼─────────────────────────────────┤
│ 2. Profession                        │ • 99.9% redundant (Student).    │
│                                      │ • 31 non-students are artifacts.│
├──────────────────────────────────────┼─────────────────────────────────┤
│ 3. Work Pressure                     │ • Degenerate for students       │
│                                      │   (99.99% zero-variance).       │
├──────────────────────────────────────┼─────────────────────────────────┤
│ 4. Job Satisfaction                  │ • Degenerate for students       │
│                                      │   (99.98% zero-variance).       │
├──────────────────────────────────────┼─────────────────────────────────┤
│ 5. City                              │ • 440 unique cities; induces    │
│                                      │   severe regional sample bias.  │
├──────────────────────────────────────┼─────────────────────────────────┤
│ 6. Family History of Mental Illness  │ • Excluded to avoid biological  │
│                                      │   fatalism in lifestyle advice. │
├──────────────────────────────────────┼─────────────────────────────────┤
│ 7. id                                │ • Purely administrative integer.│
└──────────────────────────────────────┴─────────────────────────────────┘
```

---

## 4. PRESERVATION MANDATE

**The production feature contract codified in `shared/contracts/feature_contract.json` and tested in `tests/model_parity/test_feature_contract.py` remains 100% untouched and preserved during Stage 2.** 

The restructuring recommendations detailed above represent future research specifications that will only be integrated during scheduled, version-controlled contract transitions.
