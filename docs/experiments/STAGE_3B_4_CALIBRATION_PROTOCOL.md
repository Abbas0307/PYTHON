# MINDORA 2.0 — STAGE 3B.4: CALIBRATION RESEARCH PROTOCOL (STAGE 3B.4.3 REVISION)

**Project:** Mindora 2.0  
**Branch:** `mindora-2.0-rebuild`  
**Document Type:** Formal Research & Execution Protocol  
**Author:** Senior ML Research Engineer & Statistical Reviewer  
**Date:** 2026-11-15  
**Status:** **FINAL READINESS VERIFIED — EXECUTION PENDING SEPARATE AUTHORIZATION**

---

## 1. Scientific Background & Calibration Objectives

In probabilistic classification, a model outputs a continuous score $\hat{p} \in [0, 1]$ intended to represent the posterior probability $P(Y=1 \mid X=x)$. 

A model is defined as **well-calibrated** in the sense of Dawid (1982) if, among all instances assigned a predicted probability $\hat{p}$, the true proportion of positive instances is exactly $\hat{p}$:
$$P(Y=1 \mid \hat{P} = p) = p, \quad \forall p \in [0, 1]$$

### Empirical Context from Stage 3B.3
- **Logistic Regression (Linear):** Directly optimizes the Bernoulli negative log-likelihood (binary cross-entropy). Because its objective function matches the probabilistic definition of odds under linear assumptions, it naturally produced well-calibrated probabilities ($\text{ECE} = 0.0073$, $\text{Brier} = 0.1424$).
- **XGBoost (Hist Gradient Boosting):** Also optimizes the `binary:logistic` log-loss objective with regularized tree additions, producing highly calibrated probabilities ($\text{ECE} = 0.0036$, $\text{Brier} = 0.1415$).
- **Random Forest (Bagged Ensembles):** Averages the predictions of 100 deep decision trees. While individual trees push terminal leaf estimates towards pure 0 or 1, the averaging of high-variance, unpruned/depth-limited trees pushes the ensemble probabilities **inward toward the training prior** ($\approx 0.5855$). Extreme probabilities near 0.0 and 1.0 are virtually absent (only 112 samples in $[0, 0.1)$ vs 2,211 for LR). This resulted in severe systematic miscalibration ($\text{ECE} = 0.0743$, $\text{Brier} = 0.1514$).

### Stage 3B.4 Objective
Evaluate whether post-hoc calibration methods (Platt Sigmoid Scaling vs Non-Parametric Isotonic Regression) can:
1. Correct the systematic probability distortion of Random Forest.
2. Preserve or marginally improve the calibration of Logistic Regression and XGBoost.
3. Preserve rank discrimination (ROC-AUC) while reducing Brier score, log loss, and ECE under strict zero-leakage conditions.

---

## 2. Mathematical Formulations of Calibration Methods

### 2.1 Uncalibrated Baseline (Identity Mapping)
$$\hat{p}_{\text{uncal}} = M(x) = P(Y=1 \mid X=x; \theta)$$
- No scaling applied. Degrees of freedom: $0$. Preserves raw base model output directly.

---

### 2.2 Sigmoid (Platt) Scaling
Originally proposed by Platt (1999) for Support Vector Machines and extended to general binary classifiers by Niculescu-Mizil & Caruana (2005).

Platt scaling applies a 2-parameter logistic transformation to the uncalibrated probability score:
$$P(Y=1 \mid \hat{p}) = \sigma(A \cdot f(\hat{p}) + B) = \frac{1}{1 + \exp(A \cdot f(\hat{p}) + B)}$$
where $f(\hat{p}) = \ln\left(\frac{\hat{p}}{1 - \hat{p}}\right)$ is the logit transformation of the base probability.

#### Optimization Objective
Parameters $A, B \in \mathbb{R}$ are determined by minimizing the negative log-likelihood on an independent calibration dataset $D_{\text{cal}} = \{(\hat{p}_i, y_i)\}_{i=1}^{N_{\text{cal}}}$:
$$\min_{A, B} -\sum_{i=1}^{N_{\text{cal}}} \left[ t_i \ln(P(Y=1 \mid \hat{p}_i)) + (1 - t_i) \ln(1 - P(Y=1 \mid \hat{p}_i)) \right]$$
where $t_i = \frac{N_+ + 1}{N_+ + 2}$ if $y_i = 1$ and $t_i = \frac{1}{N_- + 2}$ if $y_i = 0$ provides regularizing Bayesian target smoothing.

#### Properties:
- **Degrees of freedom:** Exactly 2 parameters ($A, B$).
- **Monotonicity:** Strictly monotonic when $A < 0$ (on logit scale). Preserves exact rank ordering; ROC-AUC is mathematically invariant.
- **Sample size requirement:** Modest ($N_{\text{cal}} \ge 100$).
- **Overfitting risk:** Negligible. Incapable of fitting non-monotonic noise.

---

### 2.3 Isotonic Regression
Proposed by Robertson et al. (1988) and introduced to machine learning by Zadrozny & Elkan (2001, 2002).

Isotonic regression fits a non-parametric, piece-wise constant non-decreasing mapping $m: [0, 1] \to [0, 1]$:
$$\min_{m} \sum_{i=1}^{N_{\text{cal}}} (y_i - m(\hat{p}_i))^2 \quad \text{subject to } m(\hat{p}_i) \le m(\hat{p}_j) \text{ whenever } \hat{p}_i \le \hat{p}_j$$

#### Optimization Algorithm: Pool Adjacent Violators Algorithm (PAVA)
PAVA finds the global optimum in $\mathcal{O}(N_{\text{cal}})$ operations by pooling adjacent non-monotonic blocks into their weighted empirical mean until monotonicity is satisfied everywhere.

#### Methodological Properties & Diagnostic Policy:
- **Degrees of freedom:** Variable. Bounded only by the number of unique probability scores.
- **Monotonicity:** Non-decreasing step function. Flat horizontal steps create probability **ties** (quantization).
- **Sample Size Policy (No Universal Guarantee):** Universal sample size thresholds do not guarantee stability across arbitrary score distributions. Sizing adequacy must be established empirically using the diagnostic metrics defined in Section 5.
- **Log-Loss Sensitivity:** Extreme boundary predictions of $0.0$ or $1.0$ yield infinite cross-entropy penalties if an out-of-sample point is misclassified.
- **Mandatory Safeguard:** Predictions must be clipped to $[\epsilon, 1 - \epsilon]$ with $\epsilon = 10^{-15}$.

---

## 3. Comparison of Calibration Architectures

Two experimental calibration structures are specified for investigation:

### 3.1 Architecture A: Inner Ensemble Averaging (Primary Research Benchmark)
```
Outer Fold k Training Set (N ~ 18,973)
  |-- Inner Fold 1: Fit M_{k,1} on N ~ 15,178  --> Predict Val 1 (N ~ 3,795)  --> Fit Calibrator C_{k,1}
  |-- Inner Fold 2: Fit M_{k,2} on N ~ 15,178  --> Predict Val 2 (N ~ 3,795)  --> Fit Calibrator C_{k,2}
  |-- Inner Fold 3: Fit M_{k,3} on N ~ 15,178  --> Predict Val 3 (N ~ 3,795)  --> Fit Calibrator C_{k,3}
  |-- Inner Fold 4: Fit M_{k,4} on N ~ 15,178  --> Predict Val 4 (N ~ 3,795)  --> Fit Calibrator C_{k,4}
  |-- Inner Fold 5: Fit M_{k,5} on N ~ 15,178  --> Predict Val 5 (N ~ 3,795)  --> Fit Calibrator C_{k,5}

Held-Out Outer Fold k Validation Set (N ~ 4,743):
  For each x in Val_k:
      p_cal(x) = (1 / 5) * sum_{j=1}^5 C_{k,j}(M_{k,j}(x))
```

- **Actual Calibration Sample Size:** Each calibrator $C_{k, j}$ fits strictly on its respective inner validation fold of **$N \approx 3,795$ instances**.
- **Quantization Behavior (Hypothesis to Evaluate):**
  - *Theoretical Premise:* Averaging 5 distinct piecewise constant step functions creates a combination of up to 5 step transitions, which *may* reduce probability quantization and ties relative to a single step function.
  - *Empirical Evaluation Mandate:* This is treated as a **hypothesis to be tested empirically**, not an assumed guarantee. Averaging does not strictly guarantee smooth curves or rank preservation. The actual impact on ties, unique calibrated score counts, and $\Delta \text{ROC-AUC}$ must be explicitly measured.
- **Distributional Consistency:** Each calibrator $C_{k, j}$ is trained on probabilities generated by model $M_{k, j}$ ($N_{\text{train}} \approx 15,178$) and at inference time evaluates probabilities generated by that exact same model $M_{k, j}$.

---

### 3.2 Architecture B: Pooled Inner-OOF Single Calibrator + Full Outer Model (Secondary Research Comparator)
```
Outer Fold k Training Set (N ~ 18,973)
  |-- 5 Inner Models generate 18,973 out-of-fold probability predictions across outer train
  |-- Fit ONE Single Calibrator C_{k,pool} on all 18,973 pooled inner OOF pairs (p_oof, y_train)
  |-- Train ONE Full Base Model M_{k,full} on the complete Outer Train partition (N = 18,973)

Held-Out Outer Fold k Validation Set (N ~ 4,743):
  For each x in Val_k:
      p_cal(x) = C_{k,pool}(M_{k,full}(x))
```

- **Actual Calibration Sample Size:** The single calibrator fits on the entire pooled set of **$N = 18,973$ inner OOF predictions**.
- **Potential Score-Distribution Shift:**
  - Inner OOF probabilities are generated by models trained on $80\%$ of outer train ($N \approx 15,178$).
  - However, at test time, the calibrator is applied to predictions from $M_{k, \text{full}}$, which was trained on $100\%$ of outer train ($N = 18,973$).
  - A model trained on 25% more data may produce sharper posterior distributions, different leaf-node sample distributions, or altered probability tails.
  - The potential shift between the calibration fitting distribution and the evaluation score distribution must be documented and measured.
- **Inference Profile:** Evaluates as a single un-smoothed step function under isotonic calibration, but executes in $1\times$ inference time.

---

### 3.3 Architectural Status & Non-Production Policy

| Evaluation Dimension | Architecture A (Primary Research Benchmark) | Architecture B (Secondary Research Comparator) |
|:---|:---|:---|
| **Architectural Role** | **Primary Research Benchmark** | **Secondary Research Comparator** |
| **Production Readiness** | **NOT PRODUCTION READY** | **NOT PRODUCTION READY** |
| **Calibration Sample Size** | $N \approx 3,795$ per calibrator | $N = 18,973$ (pooled) |
| **Quantization & Smoothing** | Hypothesis to test: may reduce ties via ensemble averaging | Single step function: susceptible to horizontal plateaus |
| **Model Distribution Match** | Exact match ($M_{k,j}$ on $N \approx 15,178$) | Potential score-distribution shift ($15,178$ vs $18,973$) |
| **Computational Footprint** | $5\times$ forward passes; stores $25$ sub-models per pipeline | $1\times$ forward pass; stores $5$ outer models per pipeline |
| **Outer Validation Disjointness**| 100% strictly held out | 100% strictly held out |

**Formal Architectural Policy:** Neither Architecture A nor Architecture B is designated as production-ready. Both are experimental research configurations designed to quantify calibration quality, variance, and computational trade-offs.

---

## 4. Formal Disjointness Guarantee & Test Vault Untouched Status

> **Formal Guarantee:** Strict partition disjointness guarantees out-of-sample calibration evaluation: the outer validation fold is strictly held out and disjoint from both base model training and calibrator fitting, preventing resubstitution bias, target leakage, and overoptimistic probability assessments.
> 
> Let $D_{\text{dev}} = D_{\text{train}, k} \cup D_{\text{val}, k}$ with $D_{\text{train}, k} \cap D_{\text{val}, k} = \emptyset$ and $\text{Groups}(D_{\text{train}, k}) \cap \text{Groups}(D_{\text{val}, k}) = \emptyset$.  
> All base models and calibrators are fitted strictly on subsets of $D_{\text{train}, k}$.  
> No instance $x_i \in D_{\text{val}, k}$ or label $y_i \in D_{\text{val}, k}$ is accessible during parameter estimation.
> 
> **Test Vault Status:** The Test Vault ($N=4,185$) remains **completely untouched during this experiment**. It is not read, parsed, materialized, or evaluated.

---

## 5. Classification Threshold & Confusion Matrix Mandates

### 5.1 Predeclared Threshold Policy ($\tau = 0.50$)
- **Fixed Decision Threshold:** Predeclared strictly as $\tau = 0.50$ for all classification metrics across all models and calibration regimes.
- **Optimization Prohibition:** Threshold tuning using outer validation labels is **strictly prohibited**. Outer validation data must serve purely as a held-out test evaluation.
- **Metric Decoupling:** Probability-based metrics (proper scoring rules: Brier score, log loss, ECE, calibration curves, ROC-AUC) evaluate confidence calibration independently of the classification decision threshold.

### 5.2 Exact Integer Confusion Matrix Reporting
- **Pooled Out-of-Fold Matrix:** Exact integer count matrix `[[TN, FP], [FN, TP]]` across all 23,716 Development instances.
- **Granular Per-Fold Matrices:** Exact integer count matrices `[[TN, FP], [FN, TP]]` recorded for Fold 0, Fold 1, Fold 2, Fold 3, and Fold 4 individually.
- **Prohibition on Fractional Matrices:** Substituting mean $\pm$ standard deviation confusion matrices (e.g. `[[1420.2 ± 12.1, 540.8 ± 10.4], ...]`) for actual integer counts is strictly forbidden.

---

## 6. Empirical Diagnostics for Isotonic Calibration

Stage 3B.4 rejects universal stability assertions. Sizing adequacy and step stability must be verified via the following **8 empirical diagnostics**:

1. **Calibration Sample Size ($N_{\text{cal}}$):** Exact count of calibration instances per fit ($N \approx 3,795$ in Arch A; $N = 18,973$ in Arch B).
2. **Class Counts ($N_+, N_-$):** Verification of class prevalence within the calibration fold.
3. **Unique Raw Scores Count:** Number of distinct probabilities produced by the uncalibrated estimator.
4. **Unique Calibrated Scores Count:** Number of distinct probabilities produced by PAVA.
5. **Probability Tie Rate (%):**
   $$\text{TieRate} = 1.0 - \frac{\text{Unique Calibrated Scores}}{N_{\text{val}}}$$
6. **Maximum Plateau Length:** Maximum count of validation samples assigned an identical step probability.
7. **Fold-to-Fold Variability:** Standard deviation ($ddof=1$) of calibration metrics across the 5 outer folds.
8. **Discrimination Delta ($\Delta \text{ROC-AUC}$):**
   $$\Delta \text{ROC-AUC} = \text{ROC-AUC}_{\text{calibrated}} - \text{ROC-AUC}_{\text{uncalibrated}}$$

---

## 7. Comprehensive Evaluation & Uncertainty Reporting

Stage 3B.4 requires reporting **both pooled out-of-fold metrics and fold-level dispersion**:
1. **Pooled Out-of-Fold Metrics ($N = 23,716$):**
   - ROC-AUC, Brier score, Log loss ($\epsilon=10^{-15}$), ECE (10 uniform deciles), Accuracy, Balanced Accuracy, Precision, Recall, Specificity, F1 Score, Confusion Matrix.
2. **Fold-Level Uncertainty & Dispersion:**
   - Fold mean ($\mu$) and sample standard deviation ($s, ddof=1$) reported for all metrics.
   - Cross-fold variance must be explicitly reported to prevent over-indexing on single point estimates.
3. **Reliability Diagram Coordinates:**
   - $(\text{conf}_m, \text{acc}_m, N_m)$ logged for bins $1 \dots 10$.

---

## 8. Execution Gate

**Stage 3B.4 execution remains STRICTLY UNAUTHORIZED.**
No training, calibration fitting, or prediction generation shall take place until a separate, explicit user authorization prompt is issued.
