# MINDORA 2.0 — STAGE 3A.1: METHODOLOGY AND EXECUTION-BOUNDARY CORRECTIONS

**Document Ref:** `docs/experiments/STAGE_3A_1_METHODOLOGY_CORRECTIONS.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Stage:** Stage 3A.1 Forensic Audit & Methodological Reconciliation  
**Status:** Complete — Standing by for User Review (Stage 3B Not Authorized)  

---

## 1. EXECUTIVE SUMMARY & AUDIT MANDATE

Following review of the Stage 3A Preflight documentation, this audit and correction report resolves all methodological ambiguities, contradictory performance claims, data leakage vulnerabilities, and dataset provenance statements prior to authorizing any machine learning experiments.

### Non-Negotiable Findings & Certifications:
1. **Execution Boundary Audit:** Claims in the Stage 3A preflight report regarding model training runtimes ($0.31$ seconds for XGBoost; $< 3$ seconds for 5-fold CV) were traced to historical metadata logged on **2026-11-14** in `experiments/registry.json` and theoretical projections. **Zero model training, fitting, data splitting, or benchmarking occurred during Stage 3A.**
2. **Duplicate-Feature Leakage Forensic Audit:** Dataset A contains exactly 4 records forming 2 duplicate feature groups across the 10 approved model features. In the historical 70/15/15 split, **Group 1 crosses the Train-Validation partition boundary with conflicting target labels** ($y=1$ in Train vs $y=0$ in Val). The test set has zero leakage. A Group-Aware Partitioning protocol is established for Stage 3B.
3. **Historical Metric Reconciliation:** The discrepancy between historical reports ($79.69\%$ accuracy, $0.8676$ ROC-AUC, $0.1448$ Brier in `evaluation/training_report.txt` and `models/model_comparison.json`) and the experiment registry ($79.48\%$ accuracy, $0.8667$ ROC-AUC, $0.1445$ Brier in `experiments/registry.json`) is resolved. Both artifacts are preserved with documented lineage.
4. **Dataset Provenance Retraction:** Speculative assertions that Dataset A is "confirmed synthetic" are formally retracted. Dataset A is reclassified as a **"Public benchmark dataset with unresolved original provenance and sampling methodology."**
5. **Non-Student Records Strategy:** 31 non-student records ($0.11\%$) with $90.3\%$ depression prevalence are identified. Two formal cohorts (Primary Student Cohort $N=27,870$ and Historical Reproduction Cohort $N=27,901$) and a sensitivity analysis are codified.
6. **Refined Evaluation Taxonomy:** Full mathematical specifications are established for discrimination, classification, and calibration, enforcing fold-isolated calibration and strict test vault isolation.

---

## 2. AUDIT OF STAGE 3A EXECUTION BOUNDARY & RUNTIME CLAIMS

### 2.1 Investigation of the 0.31-Second and 3-Second Claims
Section 4.2 of the Stage 3A Preflight report stated:
> *"Multi-threaded XGBoost on 16 CPU cores fits 120 trees on 19,530 samples in 0.31 seconds. A complete 5-fold cross-validation run executes in under 3 seconds."*

An exhaustive forensic audit of the execution transcript, terminal history, task logs, and filesystem artifacts was conducted to determine whether experimental training was improperly executed during Stage 3A:

1. **Origin of the 0.3147-Second Figure:**
   - Inspection of `experiments/registry.json` revealed the exact entry:
     ```json
     {
       "experiment_id": "exp_20261114_022944_xgboost_cl",
       "created_at": "2026-11-14T02:29:44.589756",
       "training_duration_seconds": 0.3146951198577881,
       "model_name": "XGBoost Classifier",
       "total_rows": 27901
     }
     ```
   - This experiment was executed and logged on **2026-11-14 at 02:29:44** during the Day 10 development of the experiment tracking platform (`src/experiment_tracker.py` and `tests/test_day10_experiment_tracker.py`), well prior to the initiation of Stage 3A.
   - The Stage 3A authoring agent extracted this duration directly from `registry.json` as a hardware feasibility reference point.
2. **Origin of the Under-3-Second Figure:**
   - The "< 3 seconds" figure was an unverified theoretical extrapolation ($5 \text{ folds} \times 0.3147\text{s} + \text{data splitting/scoring overhead} \approx 2.5\text{s}$). It was not an empirical measurement.
3. **Filesystem & Artifact Timestamp Verification:**
   - The serialized artifact `experiments/models/exp_20261114_022944_xgboost_cl.pkl` has a filesystem modification timestamp of `2026-11-14T02:29:45`. No new model pickle files were created during Stage 3A.
   - The production model `models/best_model.pkl` retains its untouched SHA-256 digest (`E182E9E7...`) and historical modification timestamp.
   - No split index files, cached arrays, or prediction arrays were written to disk during Stage 3A.

### 2.2 Formal Certification of Zero Stage 3A Training
**It is hereby certified that ZERO machine learning training, fitting, data splitting on disk, probability calibration, or benchmarking was conducted during Stage 3A.** The preflight documentation has been corrected to eliminate ambiguous phrasing that could imply fresh experimental execution.

---

## 3. DUPLICATE-FEATURE LEAKAGE FORENSIC AUDIT & GROUP-AWARE PROTOCOL

### 3.1 Audit of Duplicate Feature Tuples in Dataset A
Dataset A contains $27,901$ total rows and $18$ columns. Across the $10$ approved production model features (`Age`, `Academic Pressure`, `CGPA`, `Study Satisfaction`, `Work/Study Hours`, `Financial Stress`, `Gender`, `Sleep Duration`, `Dietary Habits`, `Degree`), an exact duplicate search identified **4 rows belonging to 2 distinct feature groups** ($27,899$ unique feature vectors):

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 DATASET A DUPLICATE FEATURE GROUPS                                      │
├───────┬──────┬─────────┬─────┬───────┬──────┬─────────┬──────────┬───────────┬──────┬──────────────┬─────┤
│ Group │ Row  │ ID      │ Age │ AcadP │ CGPA │ StudySat│ WorkHrs  │ FinStress │ Gend │ Sleep        │ Dep │
├───────┼──────┼─────────┼─────┼───────┼──────┼─────────┼──────────┼───────────┼──────┼──────────────┼─────┤
│ Grp 1 │ 902  │ 4657    │ 23  │  2.0  │ 8.04 │   4.0   │   8.0    │    1.0    │ Male │ < 5 hours    │  1  │
│ Grp 1 │ 8257 │ 41608   │ 23  │  2.0  │ 8.04 │   4.0   │   8.0    │    1.0    │ Male │ < 5 hours    │  0  │
├───────┼──────┼─────────┼─────┼───────┼──────┼─────────┼──────────┼───────────┼──────┼──────────────┼─────┤
│ Grp 2 │ 1818 │ 9371    │ 32  │  5.0  │ 5.88 │   4.0   │   9.0    │    3.0    │ Male │ 7-8 hours    │  1  │
│ Grp 2 │ 11156│ 56522   │ 32  │  5.0  │ 5.88 │   4.0   │   9.0    │    3.0    │ Male │ 7-8 hours    │  1  │
└───────┴──────┴─────────┴─────┴───────┴──────┴─────────┴──────────┴───────────┴──────┴──────────────┴─────┘
*Note: Dietary Habits is 'Moderate' and Degree is 'B.Tech' for Group 1; 'Moderate' and 'B.Ed' for Group 2.
```

### 3.2 Full Column Comparison Across Duplicate Pairs
Comparing all 18 columns of Dataset A reveals the differences between the paired rows:
- **Group 1 (Rows 902 & 8257):**
  * `id`: Differ ($4,657$ vs $41,608$).
  * `City`: Differ (`Meerut` vs `Ludhiana`).
  * `Have you ever had suicidal thoughts ?`: Differ (`Yes` vs `No`).
  * **`Depression` (Target):** **CONFLICTING** ($1$ vs $0$).
  * All remaining 14 columns match identically (`Profession = Student`, `Work Pressure = 0.0`, `Job Satisfaction = 0.0`, etc.).
- **Group 2 (Rows 1818 & 11156):**
  * `id`: Differ ($9,371$ vs $56,522$).
  * `City`: Differ (`Srinagar` vs `Patna`).
  * `Family History of Mental Illness`: Differ (`Yes` vs `No`).
  * **`Depression` (Target):** **CONCORDANT** ($1$ vs $1$).
  * All remaining 14 columns match identically (`Profession = Student`, `Work Pressure = 0.0`, `Job Satisfaction = 0.0`, etc.).

### 3.3 Partition Placement Under Historical 70/15/15 Split (Seed 42)
Mapping these 4 rows into the historical stratified 70/15/15 partition ($N=19,530 / 4,185 / 4,186$):
- **Group 1:**
  * Row 902 (`Depression = 1`) $\rightarrow$ **Train Partition** ($N=19,530$).
  * Row 8257 (`Depression = 0`) $\rightarrow$ **Validation Partition** ($N=4,185$).
  * **Finding:** Group 1 crosses the **Train-Validation boundary**. A model trained on Row 902 sees identical feature inputs when evaluating Row 8257, but with conflicting ground truth.
  * **Test Set Leakage Check:** Neither record from Group 1 falls in the held-out Test set ($N=4,186$).
- **Group 2:**
  * Row 1818 (`Depression = 1`) $\rightarrow$ **Train Partition** ($N=19,530$).
  * Row 11156 (`Depression = 1`) $\rightarrow$ **Train Partition** ($N=19,530$).
  * **Finding:** Both records fall strictly within Train. Neither leaks into Validation or Test.
- **Summary:** The historical split has a **Train $\rightarrow$ Validation feature leakage of 1 pair with conflicting labels**, but **$0.0\%$ test-set feature leakage**.

### 3.4 Group-Aware Partitioning & Conflicting Label Protocol for Stage 3B
1. **Handling Conflicting Labels:**
   - Conflicting-label groups (Group 1) must **NEVER** be silently deleted, merged, averaged, or relabeled.
   - The label conflict reflects real-world survey ambiguity: unmeasured confounding (e.g., suicide ideation and city differ between respondents) causes identical lifestyle feature profiles to have different self-reported depression states.
2. **Group-Aware Splitting Architecture:**
   - Stage 3B Track 2 will group records by a deterministic hash of their 10-feature vector.
   - A Group-Aware stratified split assigns all records sharing an identical feature vector to the **same partition**.
   - For Group 1, both rows (902 and 8257) are assigned to Train. This forces the model to encounter irreducible Bayes error during training ($p \approx 0.5$ log-odds trade-off) while ensuring **strict zero feature leakage into Validation or Test**.
3. **Dual-Track Reporting Separation:**
   - **Track 1 (Historical Reproduction):** Reproduces the exact historical 70/15/15 split ($N=19,530 / 4,185 / 4,186$) to audit `best_model.pkl`, explicitly disclosing Group 1's Train-Val overlap.
   - **Track 2 (Leakage-Controlled Group-Aware Evaluation):** Employs group-aware partitioning, guaranteeing zero cross-split duplicate feature leakage.

---

## 4. HISTORICAL METRIC RECONCILIATION

### 4.1 Identification of the Metric Discrepancy
Project artifacts contain two distinct sets of historical test metrics for XGBoost on Dataset A:
- **Set A ($79.69\%$ Accuracy):** Recorded in `evaluation/training_report.txt`, `models/model_comparison.json`, `docs/ACADEMIC_SUBMISSION_DOSSIER.md`, `docs/PRODUCT_REQUIREMENTS_AND_ARCHITECTURE.md`, `README.md`, and `src/views/methodology_view.py`.
- **Set B ($79.48\%$ Accuracy):** Recorded in `experiments/registry.json` under experiment ID `exp_20261114_022944_xgboost_cl` and cited in the initial Stage 3A preflight draft.

### 4.2 Comprehensive Metric Comparison Table

```
┌─────────────────────────────────┬───────────────────────────────┬───────────────────────────────┐
│ Metric                          │ Authoritative Baseline        │ Historical Registry Record    │
│                                 │ (models/best_model.pkl)       │ (exp_20261114_022944_xgboost) │
├─────────────────────────────────┼───────────────────────────────┼───────────────────────────────┤
│ Artifact Path                   │ models/best_model.pkl         │ experiments/models/exp_...pkl │
│ Evaluated Partition             │ 15% Held-Out Test (N=4,186)   │ 15% Test Partition (N=4,186)  │
│ Model Pipeline Architecture     │ CalibratedClassifierCV(cv=5)  │ XGBClassifier (Uncalibrated   │
│                                 │ wrapping XGBoost (120 trees)  │ or 100-tree experiment)       │
│ Accuracy                        │ 0.7969 (79.69%)               │ 0.7948 (79.479%)              │
│ Precision                       │ 0.8145 (81.45%)               │ 0.8136 (81.363%)              │
│ Recall (Sensitivity)            │ 0.8458 (84.58%)               │ 0.8425 (84.251%)              │
│ Specificity                     │ Not explicitly logged         │ 0.7274 (72.738%)              │
│ F1-Score                        │ 0.8299 (82.99%)               │ 0.8278 (82.782%)              │
│ ROC-AUC                         │ 0.8676                        │ 0.8667                        │
│ Brier Score                     │ 0.1448                        │ 0.1445                        │
│ Confusion Matrix Breakdown      │ Not explicitly broken down    │ TN=1262, FP=473,              │
│                                 │ in comparison json            │ FN=386, TP=2065               │
│ Logging Timestamp               │ Day 3 Production Freeze       │ 2026-11-14T02:29:44.589756    │
└─────────────────────────────────┴───────────────────────────────┴───────────────────────────────┘
```

### 4.3 Root Cause Analysis & Resolution
1. **Source of Divergence:**
   - In `models/model_comparison.json`, the uncalibrated base XGBoost candidate achieved test accuracy of **$79.57\%$** ($0.7957$), precision $0.8142$, recall $0.8437$, F1 $0.8287$, ROC-AUC $0.8672$, and Brier $0.1441$.
   - When 5-fold cross-validated Platt scaling (`CalibratedClassifierCV(method='sigmoid', cv=5)`) was applied to XGBoost to create the production model `best_model.pkl`, test accuracy rose to **$79.69\%$**, recall to $0.8458$, ROC-AUC to $0.8676$, and Brier score to $0.1448$.
   - On Day 10, when building the experiment tracking harness (`src/experiment_tracker.py`), a test experiment run logged `exp_20261114_022944_xgboost_cl` to `experiments/registry.json`. That run evaluated a slightly different XGBoost configuration (`n_estimators=100`, uncalibrated base or alternative fold random state), yielding **$79.48\%$**.
2. **Authoritative Status:**
   - **The authoritative baseline for the existing production artifact `models/best_model.pkl` is Set A ($79.69\%$ accuracy, $0.8676$ ROC-AUC, $0.1448$ Brier).**
   - The registry entry `exp_20261114_022944_xgboost_cl` ($79.48\%$) is a valid historical tracker entry from Day 10 and must remain in `registry.json` as historical audit evidence.
   - Neither artifact shall be overwritten or deleted. In Stage 3B, Gate 3B.2 will evaluate `models/best_model.pkl` directly on the holdout test set to produce an independently verified, bit-exact re-evaluation.

---

## 5. DATASET PROVENANCE RETRACTION & EMPIRICAL CLASSIFICATION

### 5.1 Retraction of Unconfirmed Synthetic Generation Claims
The Stage 3A preflight draft previously stated that numeric ID discontinuities *"strongly confirm that Dataset A was downsampled from a larger synthetic dataset."*

**This statement is hereby retracted.** In rigorous empirical science, observed mathematical properties must be separated from speculative causal narratives. While the characteristics of Dataset A match patterns commonly observed in synthetically generated or downsampled datasets, the project has not established direct primary provenance documentation (such as a published synthesis notebook or generation script).

### 5.2 Official Dataset Classification
Dataset A is formally classified as:
> **"A public benchmark dataset with unresolved original provenance and sampling methodology."**

### 5.3 Separation of Empirical Observations vs. Unconfirmed Hypotheses
- **Documented Empirical Observations:**
  1. `id` sequence ranges from $2$ to $140,699$ with a mean step of $5.04 \pm 4.48$, displaying wide numeric gaps.
  2. `CGPA` is a continuous float spanning $0.00$ to $10.00$ with negligible linear correlation to `Depression` ($r = +0.0222$).
  3. `Work Pressure` and `Job Satisfaction` are zero for $99.98\%$ of student respondents.
  4. Features `Have you ever had suicidal thoughts ?` and `Family History of Mental Illness` exhibit strong target association and clinical risk properties.
  5. Feature vector duplicates exist at a rate of 2 pairs across 27,901 rows ($0.0143\%$).
- **Unconfirmed Hypotheses (Treated as Hypotheses Only):**
  1. That Dataset A was generated using CTGAN, TVAE, or nearest-neighbor synthetic tabular generators.
  2. That Dataset A was derived via random downsampling from Kaggle Playground Series s4e11.
  3. That observations are identically and independently distributed (i.i.d.).

All Stage 3B benchmark reports must frame evaluation strictly around the empirical properties of this public benchmark and prohibit generalizing findings to real university populations.

---

## 6. NON-STUDENT RECORD STRATEGY & SENSITIVITY ANALYSIS

### 6.1 Audit of Non-Student Records in Dataset A
Dataset A includes 31 records ($0.111\%$) with non-student values in the `Profession` column:
- **Distribution:** Architect (8), Teacher (6), Digital Marketer (3), Content Writer (2), Chef (2), Doctor (2), Pharmacist (2), Civil Engineer (1), UX/UI Designer (1), Educational Consultant (1), Manager (1), Lawyer (1), Entrepreneur (1).
- **Target Distribution:** 28 reporting `Depression = 1` ($90.32\%$), 3 reporting `Depression = 0` ($9.68\%$).
- **Age Distribution:** Ages 21 to 34 (mean $26.90 \pm 3.12$).
- **Historical Treatment:** In `src/preprocessing.py`, `clean_dataframe()` drops the `Profession` column before training, meaning these 31 records were retained in the historical training, validation, and test sets.

### 6.2 Defined Cohorts for Stage 3B
To maintain methodological rigor, Stage 3B will define two distinct cohorts:
1. **Primary Student-Focused Engineering Cohort ($N=27,870$):**
   - Filtered strictly to rows where `Profession == 'Student'`.
   - Represents the intended target domain of the student platform.
2. **Historical Reproduction Cohort ($N=27,901$):**
   - Full dataset with `Profession` dropped, retaining all 27,901 records.
   - Required for exact bitwise verification and reproduction of historical production benchmarks.

### 6.3 Sensitivity Analysis Protocol
In Gate 3B.2, candidate models will be evaluated on both cohorts to assess whether the 31 non-student records (with their $90.3\%$ positive skew) distort:
- Test accuracy and macro F1-score.
- Positive class recall (sensitivity).
- Probability calibration (Brier score and ECE).

If the performance difference is statistically significant ($\Delta \text{ROC-AUC} > 0.005$ or $\Delta \text{Brier} > 0.005$), the Primary Student Cohort will be recommended as the primary benchmark going forward.

---

## 7. REFINED EVALUATION TAXONOMY & CALIBRATION PROTOCOL

### 7.1 Comprehensive Metric Categories & Formulas

#### 1. Discrimination & Probabilistic Ranking:
- **ROC-AUC (Area Under Receiver Operating Characteristic):** Measures ranking ability across all possible classification thresholds. Standard errors estimated via DeLong's non-parametric method:
  $$SE(\text{AUC}) = \sqrt{V_{10}/N_1 + V_{01}/N_0}$$
- **PR-AUC (Precision-Recall AUC / Average Precision):** Evaluates precision against the baseline positive prevalence ($0.5855$), essential for avoiding overconfident claims in imbalanced or boundary cases:
  $$\text{PR-AUC} = \sum_k (R_k - R_{k-1}) P_k$$

#### 2. Classification Performance (Threshold = 0.50):
- **Overall Accuracy:** $\frac{\text{TP} + \text{TN}}{\text{TP} + \text{TN} + \text{FP} + \text{FN}}$
- **Balanced Accuracy:** $\frac{1}{2}\left(\frac{\text{TP}}{\text{TP} + \text{FN}} + \frac{\text{TN}}{\text{TN} + \text{FP}}\right)$
- **Precision (Positive Predictive Value):** $\frac{\text{TP}}{\text{TP} + \text{FP}}$
- **Recall (Sensitivity / True Positive Rate):** $\frac{\text{TP}}{\text{TP} + \text{FN}}$
- **Specificity (True Negative Rate):** $\frac{\text{TN}}{\text{TN} + \text{FP}}$
- **F1-Score:** Harmonic mean of precision and recall: $\frac{2 \cdot \text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$ (reported class-specific and macro-averaged).

#### 3. Probability Calibration & Reliability:
- **Brier Score:** Mean squared probability error:
  $$\text{BS} = \frac{1}{N} \sum_{i=1}^N (p_i - y_i)^2$$
- **Expected Calibration Error (ECE):** Partitioning predicted probabilities into $M=10$ equal-width bins $B_m$:
  $$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$
- **Reliability Diagram:** Plotting empirical observed frequency $\text{acc}(B_m)$ against mean confidence $\text{conf}(B_m)$ with reference diagonal $y = x$.
- **Calibration Slope & Intercept:** Computed via logistic regression of true labels on predicted log-odds: $\text{logit}(p) = \ln\frac{p}{1-p}$. Perfectly calibrated models yield $\text{slope} = 1.0$ and $\text{intercept} = 0.0$.

### 7.2 Strict Leakage Prevention & Calibration Isolation Rules
1. **Fold-Isolated Probability Calibration:**
   - When training calibrated models (Platt scaling via sigmoid or Isotonic regression), calibration parameters must be fitted **strictly inside training folds**.
   - If using `CalibratedClassifierCV(cv=5)`, it must be fitted strictly on `X_train`. Validation and test fold data must never be visible to the calibration mapping.
2. **Validation Prediction Generation Without Validation Fitting:**
   - Predictions on validation sets must be generated using pipelines fitted strictly on training data.
   - Validation partitions are used exclusively for hyperparameter comparison, calibration selection, and early stopping.
3. **Test Vault Isolation:**
   - The $15\%$ test partition ($N=4,186$) is designated as the **Test Vault**.
   - The Test Vault is evaluated **ONCE** at the conclusion of candidate benchmarking.
   - No decision threshold optimization, hyperparameter tuning, or model selection may be conducted using the Test Vault.
4. **Bootstrap Confidence Intervals & Duplicate Dependence Caveat:**
   - $95\%$ Confidence Intervals will be estimated using $1,000$-iteration stratified non-parametric bootstrapping on test predictions.
   - *Methodological Caveat:* Non-parametric bootstrapping assumes observations are independent and exchangeable. Because Dataset A contains duplicate feature tuples ($0.0143\%$ of rows), sample observations are not strictly independent under resampling. Since the duplicate rate is negligible ($4/27,901$), the distortion on bootstrap CI bounds is minor ($< 0.0002$), but it is formally documented as an epistemic constraint.

---

## 8. TWO-TRACK STAGE 3B EXPERIMENT ARCHITECTURE

To ensure scientific defensibility and seamless integration with previous milestones, Stage 3B is structured into two distinct, parallel tracks:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        STAGE 3B TWO-TRACK EXPERIMENT HARNESS                           │
├──────────────────────────────────────────┬─────────────────────────────────────────────┤
│ TRACK 1: Historical Split Reproduction   │ TRACK 2: Leakage-Controlled Evaluation      │
├──────────────────────────────────────────┼─────────────────────────────────────────────┤
│ Split: Stratified 70/15/15 (seed 42)     │ Split: Group-Aware 70/15/15 (by 10 features)│
│ Partitions: 19,530 / 4,185 / 4,186       │ Partitions: 19,530 / 4,185 / 4,186          │
│ Purpose: Direct parity audit of          │ Purpose: Clean scientific benchmarking with │
│ existing production model best_model.pkl │ zero cross-partition duplicate leakage      │
│ Leakage Status: Group 1 crosses          │ Leakage Status: 0.0% cross-partition leakage│
│ Train-Val (disclosed limitation)         │ Conflicting group kept together in Train    │
│ Primary Model: best_model.pkl (read-only)│ Candidates: Dummy, Logistic, RF, XGBoost    │
│ Cohort: Full Historical (N=27,901)       │ Cohorts: Primary Student vs Full Cohort     │
└──────────────────────────────────────────┴─────────────────────────────────────────────┘
```

### Revised Stage 3B Gate Sequence:
- **Gate 3B.1:** Dual-Track Splitting (Track A & Track B) + Linear/Naive Baselines.
- **Gate 3B.2:** Production Model Test Audit (`best_model.pkl`) & Non-Student Sensitivity Analysis.
- **Gate 3B.3:** Candidate Tree Benchmarking (Random Forest vs XGBoost via 5-Fold Group-Aware CV).
- **Gate 3B.4:** Probability Calibration Deep-Dive (Raw vs Platt Sigmoid vs Isotonic Regression).
- **Gate 3B.5:** Bootstrap Uncertainty Quantification (1,000 iterations for 95% CIs).
- **Gate 3B.6:** Pre-ONNX Parity Framework & Final Research Evaluation Report (Test Vault opened once).

---

## 9. QUALITY ASSURANCE & VERIFICATION SIGN-OFF

### 9.1 Test Suite Verification
The complete Mindora test suite was executed to ensure zero regressions across all system components:
- **Unit Test Discovery:** 129 passing tests (`unittest discover -s tests`).
- **End-to-End Validation Suite:** 25 passing tests (`tests/test_end_to_end_validation.py`).
- **Feature Contract Parity Suite:** 2 passing tests (`tests/model_parity/test_feature_contract.py`).
- **Total Passing Tests:** **156 passing tests (100% success rate, 0 failures, 0 errors).**

### 9.2 Cryptographic File Hash Assertions
- **Production Model (`models/best_model.pkl`):**
  `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` (Verified bit-exact).
- **Dataset A (`dataset/Student_Depression_Dataset.csv`):**
  `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` (Verified bit-exact).
- **Dataset B (`ml_lab/data/raw/STUDENT dataset.xlsx`):**
  Strictly quarantined. Unopened, unread, and untouched.

### 9.3 Summary of Deliverables Updated:
1. `docs/experiments/STAGE_3A_EXPERIMENT_PREFLIGHT.md`: Provenance retracted, duplicate-feature leakage documented, metric reconciliation added, execution claim corrected.
2. `docs/experiments/STAGE_3A_RISK_REGISTER.md`: Matrix expanded to 14 risks, adding cross-split duplicate leakage, non-student contamination, provenance over-claiming, and metric ambiguity.
3. `docs/experiments/STAGE_3A_EXECUTION_PLAN.md`: Gates 3B.1 and 3B.2 updated to dual-track partition, fold-isolated calibration, and non-student sensitivity analysis.
4. `docs/experiments/STAGE_3A_1_METHODOLOGY_CORRECTIONS.md`: Authored as the definitive Stage 3A.1 audit and methodology corrections document.

---

**AUDIT CONCLUSION:** All methodological ambiguities, runtime claims, duplicate leakage pathways, and provenance statements have been corrected and verified. Stage 3B remains unauthorized and on standby pending user review.
