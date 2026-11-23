# MINDORA 2.0 — LABEL VALIDITY & TARGET CONSTRUCT ASSESSMENT
**Stage 1: Epistemological, Clinical, and Machine-Learning Evaluation of Target Constructs**
**Date:** 2026-11-15  
**Document Ref:** `ml_lab/audit/label_validity_assessment.md`  

---

## 1. PRIMARY OBJECTIVE

In health-related machine learning, predictive accuracy is meaningless if the target variable does not represent a valid, clinically grounded, and scientifically reproducible construct.

This assessment investigates the construct validity, epidemiological reality, and machine-learning compatibility of the target variables in:
1. **Dataset A:** `Depression` (Binary $0$ or $1$)
2. **Dataset B:** `Has a qualified healthcare professional ever told you that you have depression` (Categorical: `'no'`, `'yes'`, `'not sure'`)

---

## 2. CONSTRUCT ANALYSIS: DATASET A (`Depression`)

### 2.1 Target Specification
- **Variable Name:** `Depression`
- **Data Type:** Integer / Binary ($0$ or $1$)
- **Distribution:**
  - Class $0$ (Negative): 11,565 ($41.45\%$)
  - Class $1$ (Positive): 16,336 ($58.55\%$)
- **Missingness:** $0$ null values.

### 2.2 Epistemological & Scientific Origin
Dataset A originates from a widely disseminated public Kaggle dataset titled *"Student Depression Dataset"*. A forensic inspection reveals:
1. **Absence of Clinical Protocol:** There is no documentation indicating whether this label was determined through a structured clinical interview (e.g., SCID-5, MINI), a validated psychometric screener (e.g., PHQ-9, BDI-II, CES-D), or self-identification.
2. **Synthetic / Augmented Nature:** The statistical independence of predictor features (all VIFs $\approx 1.01-1.04$) indicates that the dataset was synthetically generated or augmented using generative models (e.g., CTGAN or Copula synthesizers). Consequently, the `Depression` label represents a probability-weighted synthetic assignment rather than empirical human pathology.
3. **Plausibility of Prevalence ($58.55\%$):** In global psychiatric epidemiology, point-prevalence of major depressive disorder (MDD) among university students ranges from $15\%$ to $30\%$ during high-stress exam periods. A baseline depression rate of nearly $60\%$ across $27,901$ records indicates extreme positive-class oversampling or synthetic label assignment drift.

### 2.3 Methodological Utility
Despite its lack of clinical grounding, Dataset A provides a mathematically stable benchmark for evaluating computational architectures, pipeline transformations, ONNX export parity, and calibration engines. However, **its predictions cannot be interpreted as a genuine medical or psychiatric diagnosis.**

---

## 3. CONSTRUCT ANALYSIS: DATASET B (`Depression Diagnosis`)

### 3.1 Target Specification
- **Variable Name:** `Has a qualified healthcare professional ever told you that you have depression`
- **Data Type:** String / Categorical
- **Response Frequencies:**
  - `'no'`: 98 respondents ($60.49\%$)
  - `'yes'`: 45 respondents ($27.78\%$)
  - `'not sure'`: 19 respondents ($11.73\%$)
- **Missingness:** $0$ null values.

### 3.2 Epistemological & Clinical Reality
The question in Dataset B assesses **lifetime self-reported formal clinical diagnosis**. This is fundamentally different from both active depressive symptoms and synthetic labels.

#### Critical Clinical Implications:
1. **Healthcare Access & Underdiagnosis Bias:**
   In India (the geographic origin of the respondent cohort), the treatment gap for mental health disorders exceeds $75\%-85\%$ according to the National Mental Health Survey (NMHS). Many students suffering from moderate-to-severe depression have never consulted a psychiatrist or clinical psychologist due to:
   - Cultural stigma surrounding mental illness,
   - Financial constraints,
   - Scarcity of licensed campus mental health counselors,
   - Lack of mental health literacy.
   **Crucial consequence:** A student who answers "No" to this question may currently be experiencing severe, disabling depression symptoms. Treating "No" as ground-truth negative ($Y=0$) induces severe label noise and clinical false negatives.

2. **Temporal Mismatch (State vs. Trait vs. Lifetime History):**
   - The question asks: *"Has a doctor ... **ever** told you"*.
   - A respondent diagnosed 6 years ago who is now fully recovered and symptom-free will answer **"Yes"**.
   - Their current lifestyle features (e.g., healthy diet, 8 hours sleep, low study pressure) will reflect wellness, but the model would be forced to associate those healthy lifestyle indicators with $Y=1$.
   - Conversely, a student whose current semester is overwhelming and who is actively experiencing acute burnout and depression will answer **"No"** if undiagnosed. The model will associate high stress and poor sleep with $Y=0$.

3. **Diagnostic Ambiguity ("Not Sure"):**
   - $11.73\%$ ($N=19$) of respondents answered **"Not sure"**.
   - In survey methodology, "not sure" in healthcare questions reflects:
     - Informal consultations (e.g., visiting a general physician who mentioned "stress" or prescribed mild anxiolytics without formal diagnostic disclosure),
     - Campus counseling visits where a formal ICD/DSM code was not communicated,
     - Ambivalence, shame, or diagnostic confusion.
   - Forcing this three-class response into a binary schema introduces arbitrary bias:
     - *Dropping "not sure":* Excludes the most psychologically ambiguous cases, shrinking the dataset from $162$ to $143$ (and further shrinking the eligible adult cohort).
     - *Grouping "not sure" with "no":* Artificially suppresses positive prevalence and introduces false negatives.
     - *Grouping "not sure" with "yes":* Dilutes diagnostic specificity.

---

## 4. CROSS-DATASET CONSTRUCT INCOMPATIBILITY

| Dimension | Dataset A (`Depression`) | Dataset B (`Healthcare Professional Diagnosis`) |
| :--- | :--- | :--- |
| **Construct Type** | Unverified / Synthetic Survey Flag | Lifetime Self-Reported Formal Diagnosis |
| **Time Horizon** | Unspecified / Cross-sectional | Lifetime ("Ever told") |
| **Ground Truth Source** | Kaggle public benchmark (synthetic) | Human memory of clinical encounter |
| **Prevalence** | $58.55\%$ Positive | $27.78\%$ Positive ($31.47\%$ among certain answers) |
| **Confounding Factors** | Algorithmic generation artifacts | Stigma, healthcare access, cost, insurance |
| **Symptom Sensitivity** | Unknown | Low sensitivity for undiagnosed active depression |
| **Clinical Meaning** | Synthetic risk score proxy | Healthcare utilization + diagnostic history |

### 4.1 Why the Targets Cannot Be Equated
Attempting to map Dataset B's diagnosis question directly to Dataset A's `Depression` flag assumes the following proposition:
$$\text{Synthetic Survey Depressive Indicator} \equiv \text{Lifetime Professional Clinical Diagnosis}$$
This proposition is scientifically untenable:
1. **Sensitivity Failure:** Because of the $75\%-85\%$ mental health treatment gap in India, formal diagnosis exhibits high specificity but extremely low sensitivity for active depressive episodes.
2. **Label Shift:** If Dataset B is evaluated using a model trained on Dataset A, the model will output predictions based on synthetic survey correlations, while the validation metric will measure agreement with clinical access history. The resulting confusion matrix measures **healthcare access disparity**, not algorithmic screening accuracy.

---

## 5. RECOMMENDATION FOR FUTURE MINDORA TARGET DEFINITION

Future phases of Mindora must discard both unverified synthetic labels and retrospective diagnosis questions as primary model targets.

### The Clinically Grounded Path: Validated Psychometric Instruments
1. **Primary Ground Truth:** Use standardized psychometric scores:
   - **PHQ-9 (Patient Health Questionnaire-9):** Continuous score ($0-27$), with validated severity cutoffs:
     - Minimal ($0-4$)
     - Mild ($5-9$)
     - Moderate ($10-14$)
     - Moderately Severe ($15-19$)
     - Severe ($20-27$)
   - **GAD-7 (Generalized Anxiety Disorder-7):** For concurrent anxiety screening.
2. **Advantages of Psychometric Ground Truth:**
   - Evaluates **active, current symptoms** over the preceding 2 weeks, matching current academic and lifestyle features.
   - Eliminates healthcare-access bias (students complete the screener regardless of prior medical visits).
   - Validated internationally across millions of university students.
   - Provides continuous granular scoring rather than crude unanchored binary labels.
