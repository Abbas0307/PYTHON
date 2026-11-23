# MINDORA 2.0 — ETHICAL, CONSENT & ELIGIBILITY REVIEW
**Stage 1: Regulatory Compliance, Minor Protection & Sample Size Viability Assessment**
**Date:** 2026-11-15  
**Document Ref:** `ml_lab/audit/consent_and_eligibility_review.md`  

---

## 1. PRIMARY OBJECTIVE

This document evaluates the legal, ethical, and methodological eligibility of **Dataset B** (`ml_lab/data/raw/STUDENT dataset.xlsx`). 

It provides:
1. An ethical and regulatory assessment of consent documentation under the **Digital Personal Data Protection (DPDP) Act 2023** (India) and **General Data Protection Regulation (GDPR)** (EU/UK).
2. A forensic analysis of minor respondents ($< 18$ years old) and legal obligations regarding child data.
3. An empirical **Eligibility Waterfall** filtering the raw 162 responses down to scientifically and legally defensible cohorts.
4. A formal **Statistical Power and Sample Size Viability Analysis** for supervised machine learning.

---

## 2. CONSENT STATUS & REGULATORY COMPLIANCE

### 2.1 Consent Documentation in Dataset B
- **Observed Data Structure:** The worksheet `'Form Responses 1'` contains 14 columns starting with `Timestamp` and ending with the depression diagnosis question.
- **Absence of Dedicated Consent Column:** There is no column capturing an explicit consent checkbox, consent timestamp, or versioned consent agreement (e.g., *"I consent to my data being processed for research"*).
- **Google Forms Architectural Context:** In web-based surveys, introductory consent language is typically placed in the form's header description. However, because Google Forms does not export header acknowledgment as a tabular data column unless configured as a mandatory multiple-choice field, **there is no persistent documentary proof of informed consent within the dataset itself.**

### 2.2 Minor Protection & Legal Obligations

#### Empirical Minor Count:
- **Numeric Age $< 18$:** **17 respondents** ($10.49\%$ of the total sample).
  - Age 13: 1 respondent
  - Age 16: 1 respondent
  - Age 17: 15 respondents
- **Self-Reported $< 18$:** 14 respondents answered "No" to *"Are you 18 years of age or older?"*.

#### Legal Implications Under India's DPDP Act 2023:
1. **Definition of Child:** Under Section 2(f) of the Digital Personal Data Protection Act 2023, a *"child"* is defined as an individual who has not completed 18 years of age.
2. **Mandatory Parental Consent (Section 9(1)):** The Data Fiduciary, before processing any personal data of a child, must obtain **verifiable consent of the parent** or lawful guardian in the manner prescribed.
3. **Prohibition of Behavioral Monitoring & Profiling (Section 9(3)):** A Data Fiduciary shall not undertake tracking or behavioral monitoring of children or targeted advertising directed at children, nor undertake processing that can cause detrimental effects on the well-being of a child.
4. **Compliance Position:** Dataset B contains zero mechanisms for verifying parental consent for the 17 identified minors. Processing health-related, psychological, or predictive well-being attributes of minors without verifiable parental consent violates fundamental data protection principles.

#### Legal Implications Under GDPR (Article 8):
- Processing personal data of a child below the age of digital consent (ranging between 13 and 16 years across EU/UK jurisdictions) requires authorization by the holder of parental responsibility.
- Processing special category health data (Article 9) of minors without explicit, documented consent is strictly prohibited.

#### Mandated Action:
**All data belonging to individuals under 18 years of age must be permanently excluded and quarantined from model training, validation, and active deployment pipelines.**

---

## 3. STUDENT ELIGIBILITY FILTERING & WATERFALL ANALYSIS

To determine the true defensible sample size of Dataset B for any future empirical research, a rigorous multi-stage filtering pipeline was applied.

### 3.1 Eligibility Criteria Definitions
1. **Criterion 1 (Legal Age of Majority):** The respondent must be $\ge 18$ years of age.
   - *Strict consensus:* Numeric Age $\ge 18$ AND Question 1 (`Are you 18 or older?`) $==$ "Yes".
   - *Pragmatic filter:* Numeric Age $\ge 18$.
2. **Criterion 2 (Target Domain Enrollment):** The respondent must be actively enrolled in formal education (Question 2 $==$ "yes"). Non-students must be excluded.
3. **Criterion 3 (Data Completeness & Integrity):**
   - CGPA must be a valid numeric decimal (excluding non-numeric entries `'🤷‍♂️'`, `'Nill'`, `'No'`).
   - Study/Work Hours must be a valid numeric decimal (excluding text entries `'3 hrs'`, `'3-4 '`, `'2-3'`).
4. **Criterion 4 (Diagnostic Certainty):** For binary supervised classification benchmarking, the respondent must have an unambiguous response (`'yes'` or `'no'`), excluding `'not sure'`.

### 3.2 Empirical Filtering Waterfall

```
RAW DATASET B
   N = 162 (100.0%)
      │
      ├── Exclude: Age < 18 by numeric entry (N = 17)
      ▼
ADULT RESPONDENTS (Numeric Age >= 18)
   N = 145 (89.51%)
      │
      ├── Exclude: Internal age contradictions (Numeric >= 18 but answered "No" to 18+) (N = 11)
      ▼
STRICT ADULT CONSENSUS COHORT
   N = 134 (82.72%)
      │
      ├── Exclude: Non-students (Enrolled == "no") (N = 20)
      ▼
CURRENTLY ENROLLED ADULT STUDENTS
   N = 114 (70.37%)
      │
      ├── Exclude: Dirty/Emoji CGPA entries (N = 1: shrug emoji)
      ▼
VALID CGPA COHORT
   N = 113 (69.75%)
      │
      ├── Exclude: Dirty/Range study hours (N = 0 in this remaining slice)
      ▼
CLEAN & ELIGIBLE STUDENT COHORT
   N = 113 (69.75%)
      │
      ├── Exclude: Ambiguous diagnostic status ("not sure") (N = 10)
      ▼
SUPERVISED BINARY BENCHMARK COHORT
   N = 103 (63.58%)
     ├── Negative (Diagnosis = 'no'): 74 (71.84%)
     └── Positive (Diagnosis = 'yes'): 29 (28.16%)
```

### 3.3 Waterfall Summary Table

| Stage | Filter Applied | Subtotal ($N$) | Retained % | Dropped Count | Reason for Exclusion |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **0** | Raw Submissions | **162** | 100.00% | 0 | Baseline |
| **1** | Numeric Age $\ge 18$ | **145** | 89.51% | 17 | Minors ($<18$, min 13) |
| **2** | Consensus on Adult Status | **134** | 82.72% | 11 | Internal contradiction (claims $<18$) |
| **3** | Active Educational Enrollment | **114** | 70.37% | 20 | Non-students |
| **4** | Clean Numeric CGPA | **113** | 69.75% | 1 | Non-numeric emoji entry (`🤷‍♂️`) |
| **5** | Clean Numeric Hours | **113** | 69.75% | 0 | All remaining entries numeric |
| **6** | Binary Diagnostic Certainty | **103** | 63.58% | 10 | Unverified diagnosis status ("not sure") |

---

## 4. STATISTICAL POWER & SAMPLE SIZE VIABILITY ANALYSIS

A central scientific question of Stage 1 is whether Dataset B can responsibly support supervised machine-learning model training.

### 4.1 Sample Size Constraints
- **Total Usable Cohort for Supervised Learning:** $N = 103$
- **Positive Events ($Y=1$, Prior Diagnosis):** $N_{\text{pos}} = 29$
- **Negative Events ($Y=0$, No Diagnosis):** $N_{\text{neg}} = 74$

### 4.2 Events Per Variable (EPV) Violation
In epidemiological and biostatistical machine learning (Harrell et al., Peduzzi et al., Steyerberg et al.), the gold-standard rule of thumb requires **10 to 20 Events Per Variable (EPV)** to prevent catastrophic overfitting in multivariable binary prediction models.
- **Mindora Production Feature Vector:**
  The production feature pipeline (consisting of 6 numerical features and 4 one-hot encoded categorical features across Gender, Sleep Duration, Dietary Habits, and Degree) yields **45 encoded feature columns**.
- **EPV Calculation:**
  $$\text{EPV} = \frac{N_{\text{pos}}}{\text{Features}} = \frac{29}{45} = \mathbf{0.644} \text{ Events Per Variable}$$
- **Severity Assessment:**
  An EPV of $0.64$ is **more than 15 times below the absolute minimum threshold** ($10.0$) required for statistical stability.
  To responsibly train a 45-feature model at 10 EPV, a dataset must contain at least **450 positive events** (and with a $28\%$ prevalence, an overall sample size of $N \ge 1,600$ clean student records).

### 4.3 Validation Uncertainty & Confidence Interval Width (Hanley-McNeil Formula)
When evaluating a binary classifier on a finite test set, the standard error of the Area Under the Receiver Operating Characteristic Curve (ROC-AUC) is governed by the Hanley-McNeil (1982) formulation:
$$SE(\text{AUC}) = \sqrt{\frac{\theta(1-\theta) + (N_{\text{pos}}-1)(Q_1 - \theta^2) + (N_{\text{neg}}-1)(Q_2 - \theta^2)}{N_{\text{pos}} \cdot N_{\text{neg}}}}$$
where $Q_1 = \frac{\theta}{2-\theta}$ and $Q_2 = \frac{2\theta^2}{1+\theta}$.

For an anticipated true AUC of $\theta = 0.70$:
- **Dataset B ($N_{\text{pos}}=29, N_{\text{neg}}=74$):**
  $$SE(\text{AUC}) = \mathbf{0.0606}$$
  $$\mathbf{95\% \text{ Confidence Interval}} = 0.70 \pm 1.96(0.0606) = \mathbf{[0.5812, \; 0.8188]}$$
  **Margin of Error:** $\pm 11.88\%$ (Total CI width: **$23.76\%$**).
  An evaluation on this sample size cannot distinguish between an essentially random model ($\text{AUC} \approx 0.58$) and a state-of-the-art classifier ($\text{AUC} \approx 0.82$).
- **Dataset A ($N_{\text{pos}}=16,336, N_{\text{neg}}=11,565$):**
  $$SE(\text{AUC}) = \mathbf{0.0031}$$
  $$\mathbf{95\% \text{ Confidence Interval}} = \mathbf{[0.6940, \; 0.7060]}$$
  **Margin of Error:** $\pm 0.60\%$ (Total CI width: **$1.20\%$**).

### 4.4 Cross-Validation Instability
In a standard 5-fold cross-validation scheme on $N=103$:
- Each test fold contains approximately **$20-21$ samples**, with only **$5-6$ positive cases**.
- Flipping a single prediction from correct to incorrect alters the fold accuracy by $\sim 5\%$ and shifts sensitivity by $\sim 17\%-20\%$.
- Model selection based on such folds optimizes pure random noise (hyperparameter p-hacking).

---

## 5. FINAL REGULATORY & METHODOLOGICAL VERDICT

1. **Regulatory Non-Compliance:** Unfiltered Dataset B contains 17 minor records without verifiable parental consent. Processing these records in an algorithmic profiling system violates Section 9 of India's DPDP Act 2023. All 17 minor records must be quarantined immediately.
2. **Methodological Infeasibility:** After filtering for legal age, student enrollment, data cleanliness, and diagnostic certainty, only **103 usable records** remain (with only 29 positive cases).
3. **Training Prohibition:** Supervised model training on Dataset B is **statistically and methodologically prohibited**. Any classifier trained on this dataset will suffer from extreme overfitting, parameter memorization, and arbitrary evaluation variance.
4. **Appropriate Role for Dataset B:** Dataset B cannot serve as a training corpus, but its clean adult subset ($N=113$) provides valuable qualitative insight into real-world student response patterns, local degree naming conventions, and lifestyle distributions to inform UX design and feature contract boundary constraints.
