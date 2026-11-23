# MINDORA 2.0 — MODEL EVALUATION & SCIENTIFIC BENCHMARKING PROTOCOL
**Document Ref:** `docs/research/MODEL_EVALUATION_PROTOCOL.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Status:** Approved Evaluation Specification  

---

## 1. PRIMARY OBJECTIVE

This document establishes the binding scientific protocol for evaluating machine-learning models developed within Mindora's `ml_lab/`. 

It specifies:
1. Data partitioning and strict leakage-prevention boundaries.
2. Mandatory hierarchy of baseline models.
3. Multi-dimensional evaluation metrics emphasizing calibration, discriminative ability, and clinical sensitivity.
4. Statistical uncertainty estimation via confidence intervals.
5. Algorithmic fairness and subgroup evaluation.
6. Robustness testing and strict rules governing claims of external validation.

---

## 2. DATA PARTITIONING & LEAKAGE PREVENTION

### 2.1 Justified Data Split Architecture (60 / 20 / 20 Split)
For controlled engineering experiments on Dataset A ($N = 27,901$), the dataset shall be partitioned into three non-overlapping subsets:
- **Training Set ($60\%$, $\sim 16,740$ records):** Used exclusively for parameter optimization and model fitting.
- **Validation Set ($20\%$, $\sim 5,580$ records):** Used for hyperparameter tuning, tree-depth pruning, early stopping, and probability calibration fitting.
- **Held-Out Test Set ($20\%$, $\sim 5,581$ records):** Locked during development; evaluated exactly once to report final performance metrics.

#### Statistical Assumptions & Limitations of the 60/20/20 Split:
With $N = 27,901$, a $20\%$ test set provides over **$5,500$ evaluation instances** ($\sim 3,260$ positive and $\sim 2,310$ negative cases). The Hanley-McNeil formulation estimates an asymptotic standard error of ROC-AUC below $\mathbf{0.0069}$, yielding a theoretical $95\%$ Confidence Interval narrower than $\mathbf{\pm 1.3\%}$. 

However, **this estimate relies on strong statistical assumptions that must be explicitly qualified in survey data:**
1. **Assumption of Independent and Identically Distributed (IID) Records:** The asymptotic formula assumes all 27,901 observations are mutually independent. In educational survey data, hidden institutional or geographic clustering violates independence, artificially deflating standard errors.
2. **Duplicate & Near-Duplicate Risk:** In crowdsourced or synthetically augmented benchmarks, identical or near-identical respondent profiles may span splits. If present, a random split leaks training representations into the test set, inflating accuracy and underestimating variance.
3. **Source & Collection Effects:** The unverified provenance of Dataset A means the data may capture artifacts of a specific web forum or recruitment campaign rather than a general student population.
4. **Test Set Size vs. External Generalizability:** A large test set ($N=5,580$) provides high statistical precision **regarding this specific test set only**. It proves internal mathematical interpolation within Dataset A's distribution, **NOT external generalizability to real-world university campuses.**
5. **Random Split Limitations:** A simple random split assumes full exchangeability. If institutional or temporal structure exists in the data, a random split produces overly optimistic performance estimates.

### 2.2 Strict Preprocessing & Leakage Prevention Protocol
To guarantee that the test split serves as an untainted evaluation:
1. **Fit Strictly on Train:** All imputation parameters (e.g., median `Financial Stress`), feature scalers, one-hot encoders, and feature selection steps must be fitted **exclusively on the 60% Training Split** (or within inner cross-validation folds).
2. **Zero Test-Set Peeking:** Hyperparameter tuning, tree-depth pruning, threshold tuning, and calibration curve fitting are strictly confined to the Training and Validation sets. The final test set must never be used to guide any modeling choice.
3. **Transform Only on Val/Test:** The fitted transformers are applied downstream to Validation and Test splits without re-computation.
4. **Artifact Isolation:** Fitted preprocessors are serialized as separate, versioned pipeline objects alongside model weights.

---

## 3. MANDATORY HIERARCHY OF BASELINE COMPARISONS

No complex model (e.g., XGBoost, LightGBM, Random Forest) may be reported without direct benchmarking against standardized statistical baselines:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      BASELINE COMPARISON HIERARCHY                     │
├────────────────────────────────────────────────────────────────────────┤
│ LEVEL 0: Trivial Baselines                                             │
│ • Stratified Random Dummy: Predicts labels matching training class     │
│   frequencies.                                                         │
│ • Majority Class Dummy: Predicts the majority class (Class 1, 58.55%)   │
│   for 100% of inputs. Establishes the floor accuracy (58.55%).         │
├────────────────────────────────────────────────────────────────────────┤
│ LEVEL 1: Linear & Interpretable Baselines                              │
│ • Unpenalized Logistic Regression: Baseline linear decision boundary.  │
│ • Regularized Logistic Regression (L1 Lasso / L2 Ridge): Evaluates     │
│   linear performance under sparsity constraints.                       │
├────────────────────────────────────────────────────────────────────────┤
│ LEVEL 2: Tree-Based Ensembles                                          │
│ • Random Forest: Evaluates bagged non-linear decision boundaries.      │
│ • Gradient Boosted Trees (XGBoost / LightGBM): Evaluates optimized    │
│   boosted ensembles.                                                   │
└────────────────────────────────────────────────────────────────────────┘
```

**Evaluation Rule:** A complex non-linear model is only defensible if it achieves a statistically significant improvement in **Brier score** and **PR-AUC** over the L2 Regularized Logistic Regression baseline.

---

## 4. COMPREHENSIVE PERFORMANCE METRICS

Accuracy alone is an inadequate metric in health-related and wellbeing modeling. The evaluation protocol requires reporting all seven of the following metrics on the held-out test split:

| Evaluation Metric | Mathematical Definition | Clinical / Practical Purpose |
| :--- | :--- | :--- |
| **Brier Score** | $\frac{1}{N} \sum_{i=1}^{N} (p_i - y_i)^2$ | **Primary Calibration Metric:** Evaluates probability accuracy (lower is better; $0 = \text{perfect}$, $0.25 = \text{uninformative}$). |
| **PR-AUC** | Area under the Precision-Recall curve | **Primary Imbalance Metric:** Focuses on positive predictive performance without being inflated by true negatives. |
| **ROC-AUC** | Area under Receiver Operating Characteristic | Measures overall ranking and discrimination capacity across all classification thresholds. |
| **Sensitivity (Recall)** | $\frac{TP}{TP + FN}$ | Measures the proportion of distressed students correctly identified (minimizes dangerous false negatives). |
| **Specificity** | $\frac{TN}{TN + FP}$ | Measures the proportion of non-distressed students correctly identified (minimizes alarm fatigue). |
| **Precision (PPV)** | $\frac{TP}{TP + FP}$ | Measures the reliability of a positive flag (probability that an identified student is genuinely distressed). |
| **F1-Score** | $2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$ | Harmonic mean balancing precision and recall. |

---

## 5. PROBABILITY CALIBRATION PROTOCOL & CLINICAL BOUNDARIES

Raw output scores from tree-based ensembles (such as XGBoost margin outputs after sigmoid transformation) are frequently uncalibrated, clustering near extremes or distorting true empirical probabilities.

### 5.1 Three Tiers of Probability Calibration
Mindora formally distinguishes between three distinct calibration scopes:
1. **Calibration against Dataset A's Original Label (Computational Benchmark):** Fitting Platt scaling or Isotonic regression to align model scores with the empirical distribution of Dataset A's binary label ($58.55\%$ base rate). **This is strictly an engineering benchmark** testing whether an algorithm can optimize calibration curves on a fixed split.
2. **Calibration against a Validated Real-World Outcome:** Mapping model scores to an independently verified epidemiological baseline from a target student population (e.g., an actual $20\%$ campus point-prevalence). *Not possible with current unverified datasets.*
3. **Clinical Probability Calibration:** Rigorous clinical validation where predicted probabilities correspond to true calibrated risk of physician-diagnosed Major Depressive Disorder. *Strictly out of scope for Mindora.*

**Binding Rule:** Only Level 1 can be studied with Dataset A. **Calibrated Dataset A probabilities must NEVER be displayed to students as clinical or personal depression probabilities.**

### 5.2 Calibration Methodology
1. **Calibration Fitting:** Calibration mappings must be fitted on the **20% Validation Split**, completely independent of the training data used to build the trees.
2. **Techniques Compared:**
   - **Platt Scaling (Sigmoid Logistic Calibration):** Parametric calibration mapping raw scores via a univariate logistic function. Preferred for smaller samples or monotonic distortions.
   - **Isotonic Regression:** Non-parametric monotonic step function. Preferred for large validation samples with non-sigmoid distortions.
3. **Evaluation of Calibration Quality:**
   - **Expected Calibration Error (ECE):** Evaluates the weighted average difference between predicted confidence and observed accuracy across 10 probability bins.
   - **Reliability Diagrams:** Visual plotting of predicted probability vs. observed empirical frequency.

---

## 6. STATISTICAL UNCERTAINTY & CONFIDENCE INTERVALS

Point estimates of metrics are unscientific without quantifying sampling uncertainty:
1. **Bootstrapped Confidence Intervals:** For all test set metrics (Brier score, PR-AUC, F1), the evaluation script must compute **$95\%$ Confidence Intervals via non-parametric bootstrapping** ($B = 1,000$ resamples with replacement).
2. **Reporting Requirement:** All reported metrics must be formatted as:
   $$\text{Metric} = \text{Estimate} \; [95\% \text{ CI: Lower}, \; \text{Upper}]$$
3. **No Overlapping CI Claims:** Model A cannot be claimed superior to Model B unless their confidence intervals demonstrate statistically significant separation.

---

## 7. FAIRNESS & SUBGROUP DISAGGREGATION

Mindora mandates subgroup disaggregation on the held-out test set to ensure algorithmic fairness:
1. **Gender Subgroups:** Evaluate Brier score, ROC-AUC, and False Positive Rates separately across `Male` and `Female` cohorts. Disparities in Error Rates $> 10\%$ must be flagged as potential bias.
2. **Academic Disciplines:** Evaluate performance across broad degree clusters (e.g., Engineering vs Commerce vs Humanities).
3. **Age Bands:** Evaluate performance across age tiers ($18-21$, $22-25$, $26-30$).

---

## 8. ROBUSTNESS & PERTURBATION TESTING

Before candidate promotion, models must undergo synthetic perturbation testing:
1. **Missingness Robustness:** Evaluate model performance when non-critical features (e.g., `Financial Stress`) are masked with median values.
2. **Input Noise Jitter:** Add Gaussian noise ($\pm 5\%$) to continuous variables (`Work/Study Hours`, `Age`) to verify that predicted probabilities do not oscillate wildly.
3. **Out-of-Distribution (OOD) Guardrails:** Verify that inputs outside bounded physiological/academic ranges (e.g., `Age > 40`, `Work/Study Hours > 18`) trigger an OOD uncertainty warning.

---

## 9. STRICT EXTERNAL VALIDATION POLICY

### What Current Evaluations Establish:
Internal 60/20/20 test split evaluation establishes **internal validity within Dataset A's sampling distribution**.

### What Current Evaluations CANNOT Establish:
Internal testing does **not** prove generalizability to real-world university campuses, other countries, or future semesters.

### Mandatory Prohibition:
**Mindora documentation, reports, and code must NEVER claim "External Validation" until an independent, ethically approved, multi-institutional student dataset with documented provenance is evaluated.**

---

## 10. PROTOCOL RECONCILIATION

- [x] Justified 60/20/20 data partitioning specified.
- [x] Strict preprocessing leakage prevention rules codified.
- [x] 3-level baseline comparison hierarchy established.
- [x] Multi-metric reporting (Brier, PR-AUC, ROC-AUC, Sensitivity, Specificity) mandated.
- [x] Probability calibration and reliability diagrams formalized.
- [x] 95% bootstrap confidence intervals required for all estimates.
- [x] Subgroup fairness and robustness testing integrated.
- [x] False external validation claims strictly prohibited.
