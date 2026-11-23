# MINDORA 2.0 — STAGE 1 COMPREHENSIVE DUAL-DATASET AUDIT REPORT
**Stage 1: Dual-Dataset Deep Quality Profiling, Label Validity & Research Validation**
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Audit Pipeline Status:** Completed & Empirically Validated  

---

## 1. EXECUTIVE SUMMARY & AUDIT TRAIL

Stage 1 conducted a forensic, dual-dataset comparative audit across the two datasets available to the Mindora project:
1. **Dataset A (Public Benchmark):** `dataset/Student_Depression_Dataset.csv`
   - Records: 27,901 | Columns: 18 | Size: 2.85 MB
   - SHA-256: `a3e159e246789be5a61dcc7b4290fbc238f0140f3d95727585af50a61fd35404`
2. **Dataset B (Collected Responses):** `ml_lab/data/raw/STUDENT dataset.xlsx`
   - Records: 162 | Columns: 14 | Size: 19.0 KB
   - SHA-256: `a040665638e5d7a433c171b1f703061f571da50e2f1f2c55c3f0c37fa57c7e09`

### Safety Protocol Compliance Confirmation
- **Production Files:** Preserved strictly. `models/best_model.pkl` verified unchanged (SHA-256: `e182e9e779a4f89e4883eb13c9bab3df19eebc7165d4b0a44319f737361342ec`).
- **Original Datasets:** Unmodified. Verified via cryptographic byte-level SHA-256 matching.
- **Dataset Merging:** Strictly prohibited and rejected. Zero datasets were merged or pooled.
- **Model Training:** Zero models trained, fine-tuned, or calibrated.
- **Data Fabrication:** Zero synthetic respondents or fabricated missing values generated.
- **Privacy & Anonymity:** Zero individual respondent records exposed in reports or logs.

---

## 2. SUMMARY OF AUDIT DELIVERABLES PRODUCED

All audit artifacts have been generated in `ml_lab/audit/` and cross-referenced below:
1. Structured JSON Audits:
   - `ml_lab/audit/public_dataset_audit.json`: Complete statistical profile of Dataset A.
   - `ml_lab/audit/collected_dataset_audit.json`: Complete statistical profile of Dataset B.
   - `ml_lab/audit/cross_dataset_comparison.json`: Feature mapping, KS/Chi2 divergence, and power analysis.
2. In-Depth Technical Reports:
   - `ml_lab/audit/data_quality_report.md`: Deep empirical data quality, missingness, and anomaly audit.
   - `ml_lab/audit/label_validity_assessment.md`: Epistemological, clinical, and ML evaluation of target constructs.
   - `ml_lab/audit/feature_compatibility_matrix.md`: Alignment matrix, KS tests ($p < 0.001$), and proof of Covariate Shift.
   - `ml_lab/audit/consent_and_eligibility_review.md`: Regulatory review (DPDP Act Sec 9, GDPR Art 8), filtering waterfall, and sample size viability.

---

## 3. CORE EMPIRICAL FINDINGS

### 3.1 Dataset A (Public Benchmark)
- **Role & Characterization:** Dataset A is an **unverified public benchmark suitable for controlled engineering experiments, not clinically validated training data**. It provides computational volume for pipeline validation, export parity, and calibration testing, but must not be treated as clinically certified ground truth.
- **High Computational Stability:** Zero duplicate rows. Exactly 3 missing values ($0.01\%$) in `Financial Stress`.
- **Target Distribution:** $58.55\%$ positive class ($16,336$ rows), $41.45\%$ negative class ($11,565$ rows). This prevalence is uncalibrated and approximately double the empirical baseline for student populations.
- **Multicollinearity:** Linear regression Variance Inflation Factors (VIF) across all numerical features are between 1.00 and 1.05 (`Age`: 1.0135, `Academic Pressure`: 1.0463, `CGPA`: 1.0028, `Study Satisfaction`: 1.0177, `Work/Study Hours`: 1.0142, `Financial Stress`: 1.0371). This demonstrates **low linear multicollinearity** among the features in this dataset, but does not prove synthetic provenance. Whether the dataset was generated synthetically or collected via independent survey items remains an **unverified hypothesis** requiring upstream author documentation.
- **Domain Contamination:** Contains 31 non-students (Architects, Doctors, Chefs, etc.), and 9 records with impossible $0.00$ CGPA.
- **Excluded Features:** Confirmed sound clinical design in excluding `Have you ever had suicidal thoughts ?` (which exhibits extreme target leakage: 79.05% depression rate when Yes vs 23.22% when No) to prevent unsafe clinical conflation.

### 3.2 Dataset B (Collected Responses)
- **Sample Size:** Total raw cohort $N = 162$ across 14 columns.
- **Minor Presence:** 17 respondents ($10.49\%$) have numeric age $< 18$ (ages: 13, 16, and 15 respondents aged 17). On Question 1 (`Are you 18 or older?`), 14 respondents answered "No". Cross-tabulation reveals 25 internal age contradictions ($15.43\%$), including 14 minors claiming to be adults.
- **Non-Student Contamination:** 24 respondents ($14.81\%$) self-reported that they are not enrolled in an educational institution or formal educational programme.
- **Free-Text Corruption:** CGPA contains invalid non-numeric inputs (`🤷‍♂️`, `Nill`, `No`); Study Hours contains range strings (`3 hrs`, `3-4 `, `2-3`); Degree column contains 63 fragmented, unstandardized variations across 162 rows.
- **Target Construct:** Measures lifetime clinical diagnosis history (`no`: 98, `yes`: 45, `not sure`: 19), reflecting healthcare-seeking behavior rather than active depressive symptoms.

### 3.3 Cross-Dataset Divergence & Distribution Comparisons
- **Hypothesis Testing & Effect Sizes:** Two-sample Kolmogorov-Smirnov tests on numerical features and Chi-Square tests on categorical features yielded $p < 0.001$, partly driven by the extreme sample size asymmetry ($N_A = 27,901$ vs $N_B = 162$). Standardized effect sizes clarify practical divergence:
  - Age: $D = 0.5953$ (Large difference: Dataset B median 19 vs A median 25)
  - Sleep Duration: Cohen's $w = 0.6301$ (Large difference: heavy clustering at 5–6 hours in B)
  - Dietary Habits: Cohen's $w = 0.4629$ (Moderate-to-large difference)
  - Work/Study Hours: $D = 0.2989$ (Moderate difference)
  - Gender: Cohen's $w = 0.2928$ (Moderate difference: B is $55.6\%$ F, A is $55.7\%$ M)
  - CGPA: $D = 0.2541$ (Moderate difference)
  - Study Satisfaction: $D = 0.2198$ (Small-to-moderate difference)
  - Financial Stress: $D = 0.1674$ (Small practical difference)
- **Sampling Frame Comparability:** These differences reflect **two fundamentally disparate convenience sampling frames** (an unverified international/national benchmark vs a single-day localized survey), not a verified temporal covariate shift of a single student population. Merging them remains scientifically invalid due to domain and construct incompatibility.

---

## 4. THE 7 COMPLETION GATE QUESTIONS & EVIDENCE-BASED ANSWERS

### Question 1: Can Dataset A responsibly support further exploratory model research?
**Answer:** **YES, with strict scientific caveats.**
- **Scientific Utility:** Dataset A has sufficient statistical volume ($N = 27,901$), low missingness, and high numerical stability. It is appropriate for:
  1. Evaluating computational model pipelines, gradient boosting architectures, and offline ONNX runtime exports.
  2. Benchmarking feature transformation consistency, numerical precision parity, and inference latency.
  3. Researching probability calibration methods (e.g., Platt scaling, isotonic regression) to demonstrate how uncalibrated model outputs can be mapped to realistic target distributions.
- **Mandatory Caveats:**
  1. Outputs must be explicitly labeled as an **exploratory academic benchmark score**, never as a clinical diagnosis.
  2. Model predictions cannot be claimed to represent real-world clinical depression prevalence without empirical recalibration.
  3. Upstream provenance remains unverified in documentation; it should not be definitively asserted as synthetic without proof.

---

### Question 2: Can Dataset B responsibly support supervised model training?
**Answer:** **NO. Supervised model training on Dataset B is methodologically and statistically prohibited.**
- **Empirical Evidence:**
  1. **Mutually Exclusive Eligibility Filtering:** After applying necessary eligibility filters (excluding 17 numeric minors, 11 adult age contradictions, 17 non-enrolled adults, 1 corrupted CGPA, 3 corrupted study hours, and 10 "not sure" responses), only a **potentially eligible analytic subset of 103 records** remains (74 negative, 29 positive), strictly subject to consent, ethics and data-governance approval. Furthermore, the existing workbook does not establish whether respondents consented to machine-learning research; consent cannot be assumed from form submission.
  2. **Sample Size Constraints & Heuristics:** Mindora's feature pipeline generates 45 one-hot encoded features. While modern regularized machine learning and tree-based models have effective degrees of freedom lower than the raw nominal feature count (meaning overfitting is not "mathematically guaranteed"), an effective sample size of 29 positive events across 103 instances produces severe statistical power limitations and high sampling variance.
  3. **Extreme Evaluation Uncertainty:** By the Hanley-McNeil formulation, an estimated AUC of $0.70$ on this cohort carries a standard error of $0.0606$, producing a $95\%$ Confidence Interval spanning **$[0.5812, \; 0.8188]$** (a margin of error of $\pm 11.88\%$). An evaluation on this sample size cannot reliably distinguish between a near-random model and an accurate one.
- **Legitimate Role for Dataset B:** Dataset B's clean adult subset ($N=113$) should be preserved strictly as an **unlabeled qualitative reference cohort** to inspect real-world student vocabulary (e.g., degree naming patterns), inform form validation rules, and establish stress-testing boundary cases.

---

### Question 3: Can the datasets be combined? (Explain why NOT).
**Answer:** **NO. Combining or pooling the datasets is strictly rejected as scientifically invalid and harmful.**
- **Methodological Reasons for Rejection:**
  1. **Disparate Sampling Frames & Effect Sizes:** All overlapping variables exhibit statistically significant distribution differences ($p < 0.001$), with large practical effect sizes in Age ($D=0.5953$) and Sleep Duration ($w=0.6301$), reflecting two fundamentally different sampling frames.
  2. **Fundamentally Incompatible Target Constructs:** Dataset A models an unanchored survey indicator ($58.55\%$ positive), whereas Dataset B models lifetime self-reported healthcare professional diagnosis ($27.78\%$ positive). Merging them introduces massive label contamination and destroys ground-truth interpretability.
  3. **Signal Erasure via Sample Imbalance:** Dataset B ($N=162$) would constitute only $0.58\%$ of a combined dataset ($N = 28,063$). Gradient-based machine learning algorithms would treat the entire collected sample as statistical noise, completely drowning out any localized human signal.
  4. **Evaluation Poisoning:** Validation loss on a pooled dataset would be $99.4\%$ dominated by Dataset A, giving an entirely false impression of generalizability while masking failure on real students.

---

### Question 4: What target definition should future research investigate?
**Answer:** **Standardized Psychometric Screening Instruments (e.g., PHQ-9 and GAD-7) clearly distinguished from clinical diagnoses.**
- **Deficiencies of Past Targets:**
  - Synthetic or unverified binary indicators (Dataset A) lack clinical reality.
  - Lifetime professional diagnosis (Dataset B) is heavily confounded by the $75\%-85\%$ mental health treatment gap in India, penalizing undiagnosed students suffering from acute symptoms.
- **Recommended Construct:**
  1. **PHQ-9 Continuous Score ($0 - 27$):** Assesses active depressive symptom frequency over the preceding 2-week window.
  2. **Important Scientific Distinction:** The PHQ-9 is a **psychometric screening instrument, not a clinical diagnosis**, and must not be described as "clinical ground truth". A score $\ge 10$ identifies elevated symptom burden warranting assessment, not confirmed Major Depressive Disorder (MDD).
  3. **Decoupled Architecture:** Preserves the independent Tri-Engine architecture while keeping Item 9 completely isolated in a deterministic safety pathway.

---

### Question 5: What features are scientifically and methodologically defensible?
**Answer:** **A refined 8-to-10 feature set combining validated lifestyle, academic, and biological indicators, while strictly excluding sensitive, redundant, or leaking variables.**
- **Defensible Features:**
  1. `Academic Pressure`: Bounded ordinal scale ($1 - 5$), standardized with clear behavioural anchors.
  2. `Study Satisfaction`: Bounded scale ($1 - 5$), highly relevant to student burnout.
  3. `Financial Stress`: Bounded scale ($1 - 5$), critical socio-economic stressor.
  4. `Sleep Duration`: Categorical sleep windows (normalized to standard ISO representations, e.g., $<5$, $5-6$, $7-8$, $>8$ hours).
  5. `Work/Study Hours`: Continuous daily hours ($0 - 16$), bounded with numeric validation.
  6. `Dietary Habits`: Categorical nutritional stability (`Healthy`, `Moderate`, `Unhealthy`).
  7. `Age`: Continuous integer ($18 - 35$), strictly restricted to adults.
  8. `Gender`: Categorical (`Male`, `Female`, `Non-binary / Diverse`, `Prefer not to say`).
- **Features Requiring Redesign or Removal:**
  - `CGPA`: Shows near-zero correlation ($r = 0.022$) with depression in Dataset A, and suffers from grading scale incompatibility across institutions (percentage vs 10-point GPA vs 4-point GPA). Should be converted to self-perceived academic performance or dropped.
  - `Degree`: 63 free-text variations in Dataset B demonstrate that granular degrees cause severe categorical sparsity. Should be collapsed into broad disciplines (e.g., Engineering, Humanities, Commerce, Sciences, Medical).
- **Features Strictly Excluded on Safety & Clinical Grounds:**
  - `Have you ever had suicidal thoughts ?`: Leaks target and conflates preventative wellness with emergency crisis management. Must remain isolated in the PHQ-9 Item 9 safety protocol.
  - `Profession`, `Work Pressure`, `Job Satisfaction`: Degenerate zero-variance fields for enrolled students.
  - `City`: High cardinality, introduces regional bias.

---

### Question 6: What additional consent, data collection or validation is required?
**Answer:** **A formalized, IRB/ethics-approved data collection protocol with explicit consent mechanisms.**
- **Mandatory Collection Enhancements:**
  1. **Explicit, Timestamped Consent Field:** The survey instrument must record a mandatory, non-pre-checked consent acknowledgment column in the output data store (e.g., *"I confirm I am $\ge 18$ years of age and consent to my anonymized responses being used for wellbeing research"*).
  2. **Hard Age Gate & Minor Prevention:** Google Forms or web interfaces must implement conditional skip-logic that immediately terminates the survey and prevents submission if the respondent indicates an age $< 18$.
  3. **Strict Input Sanitization & UI Constraints:** Replace free-text fields with constrained dropdowns or numeric steppers (eliminating non-numeric CGPA, text hours, and degree fragmentation).
  4. **Ground-Truth Screener Integration:** Pair lifestyle questions with an embedded, complete PHQ-9 psychometric assessment so that each record possesses true clinical symptom scores.
  5. **Ethics Review:** Formal Institutional Review Board (IRB) or university ethics committee review confirming adherence to India's DPDP Act 2023 and research ethics standards.

---

### Question 7: What should be the next research stage?
**Answer:** **Stage 2 — Controlled Model Benchmarking, Calibration & Offline Runtime Export.**
- **Objectives for Stage 2:**
  1. **Benchmark Model Architectures on Dataset A:** Evaluate XGBoost, LightGBM, Random Forest, and calibrated Logistic Regression on Dataset A using rigorous 5-fold cross-validation and PR-AUC/Brier score metrics.
  2. **Probability Calibration:** Compare Platt scaling (sigmoid) and Isotonic regression to ensure predicted probabilities reflect true empirical risk.
  3. **ONNX Export & Numerical Parity:** Export the calibrated champion model to the cross-platform ONNX format, verifying that inference predictions match Python scikit-learn outputs within a strict numerical tolerance ($\le 1 \times 10^{-5}$).
  4. **Zero-Touch Preservation:** Maintain the untouched legacy production model (`models/best_model.pkl`) and ensure all new research remains isolated in `ml_lab/` and `shared/contracts/`.

---

## 5. RECONCILIATION & INTEGRITY CHECKLIST

- [x] Dataset A audited and profiled (`ml_lab/audit/public_dataset_audit.json`)
- [x] Dataset B audited and profiled (`ml_lab/audit/collected_dataset_audit.json`)
- [x] Cross-dataset comparative audit generated (`ml_lab/audit/cross_dataset_comparison.json`)
- [x] Data quality report authored (`ml_lab/audit/data_quality_report.md`)
- [x] Label validity assessment authored (`ml_lab/audit/label_validity_assessment.md`)
- [x] Feature compatibility matrix authored (`ml_lab/audit/feature_compatibility_matrix.md`)
- [x] Consent and eligibility review authored (`ml_lab/audit/consent_and_eligibility_review.md`)
- [x] Stage 1.1 scientific corrections document authored (`ml_lab/audit/STAGE_1_1_CORRECTIONS.md`)
- [x] Stage 1 final validation report authored (`docs/data/STAGE_1_FINAL_VALIDATION.md`)
- [x] Comprehensive synthesis and 7 gate questions updated (`docs/data/STAGE_1_AUDIT_REPORT.md`)
- [x] Production model SHA-256 verified unchanged (`e182e9e7...`)
- [x] Original datasets preserved and untouched
- [x] Datasets kept completely separate (no merging)
- [x] No models trained or fine-tuned in this stage
- [x] No individual student records exposed
- [x] 153 original tests + 3 newly added feature-contract tests = 156 total passing tests (100% OK)
- [x] Git working tree preserved without unapproved commits
- [x] Execution stopped for user review
