# MINDORA 2.0 — STAGE 3B.3: EXPERIMENTAL RISK REGISTER & METHODOLOGICAL MITIGATIONS

**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Branch:** `mindora-2.0-rebuild`  
**Working Directory:** `D:\Depression calculator`  
**Document Type:** Preflight Risk Governance & Mitigation Register  
**Preflight Date:** November 15, 2026  
**Auditor Role:** Senior Data-Governance Engineer & Statistical Reviewer  
**Stage Status:** PREFLIGHT ONLY — STRICTLY UNAUTHORIZED TO TRAIN  

---

## 1. Executive Summary

This Risk Register establishes formal threat modeling, methodological risks, and security mitigations for the upcoming Stage 3B.3 model comparison. Every identified risk is paired with pre-configured, automated mitigation controls to guarantee research integrity, boundary isolation, and scientific validity.

---

## 2. Risk Assessment Matrix

| Risk ID | Risk Description | Category | Inherent Severity | Likelihood | Preflight Mitigation Control | Residual Risk |
|:---:|---|:---:|:---:|:---:|---|:---:|
| **RSK-01** | Tree Ensemble Tabular Overfitting | Statistical | HIGH | MEDIUM | Regularized hyperparameters: `max_depth=10` (RF), `max_depth=5` (XGB), conservative shrinkage $\eta=0.08$, subsampling $0.85$, $L_2$ leaf penalty $\lambda=1.0$. | LOW |
| **RSK-02** | Calibration Degradation in Tree Models | Statistical | MEDIUM | HIGH | Brier score and 10-bin decile ECE pre-specified as primary metrics; trees evaluated for probability distortion relative to Logistic Regression. | LOW |
| **RSK-03** | Group 1 Empirical Label Collision | Statistical | MEDIUM | CERTAIN | Group 1 records (IDs 4657 & 41608) reside in the same validation fold (Fold 2); documented as deterministic prediction limit, not Bayes error. | NEGLIGIBLE |
| **RSK-04** | Class Imbalance Bias ($58.55\%$ Positive) | Statistical | MEDIUM | MEDIUM | Metric suite includes Balanced Accuracy, Precision, Recall, Specificity, and full confusion matrices alongside ROC-AUC. | LOW |
| **RSK-05** | Accidental Test Vault Data Leakage | Governance | CRITICAL | LOW | Hardened `development_only_loader.py` bypasses field parsing and DataFrame materialization for all 4,185 Test Vault records. | NEGLIGIBLE |
| **RSK-06** | Preprocessing Information Leakage | Methodological | HIGH | LOW | `ColumnTransformer` encapsulated in `Pipeline` and fitted strictly within each training fold; zero cross-fold statistics computed. | NEGLIGIBLE |
| **RSK-07** | Misinterpretation as Clinical Diagnosis | Clinical | CRITICAL | HIGH | Prominent clinical disclaimers in all documentation; target explicitly defined as public survey label, not clinical diagnostic assessment. | LOW |
| **RSK-08** | Legacy Directory & Model Mutation | Operational | HIGH | LOW | Stage 3B.3 output isolated strictly to new directory `ml_lab/experiments/stage_3b_3/`; legacy directories write-protected. | NEGLIGIBLE |
| **RSK-09** | Non-Deterministic Multi-Threading Drift | Infrastructure | LOW | MEDIUM | Explicit `random_state=42` pinned across all estimators, tree splits, subsampling, and CV splitters. | NEGLIGIBLE |

---

## 3. Detailed Threat & Methodological Analysis

### 3.1 RSK-01: Tree Ensemble Tabular Overfitting
- **Mechanisms:**
  - Non-linear decision tree ensembles (especially gradient boosted trees) have sufficient VC-dimension to memorize subtle noise and idiosyncrasies in small-to-medium survey datasets.
  - While Logistic Regression is constrained by linearity, deep trees can split on rare multi-attribute intersections that fail to generalize.
- **Enforced Mitigations:**
  - **Random Forest:** `max_depth = 10`, `min_samples_split = 5`, `min_samples_leaf = 2`, `max_features = "sqrt"`.
  - **XGBoost:** `max_depth = 5`, `learning_rate = 0.08`, `subsample = 0.85`, `colsample_bytree = 0.85`, `reg_lambda = 1.0`.
  - **Fixed Budget:** 100 trees for both ensembles. No outer-fold early stopping (which leaks validation fold progression into model capacity).

---

### 3.2 RSK-02: Calibration Degradation in Tree Models
- **Mechanisms:**
  - Random Forest probabilities represent empirical fractions of training samples reaching terminal leaves. In shallow or constrained leaves, probabilities tend to cluster away from 0.0 and 1.0, frequently inflating Brier scores.
  - XGBoost probabilities are sigmoid transforms of sum-of-leaf outputs, which can push predicted probabilities toward extreme values (overconfidence).
  - Logistic Regression, which directly maximizes the Bernoulli log-likelihood, typically produces well-calibrated probabilities ($\text{ECE} = 0.0073$ in Stage 3B.2).
- **Enforced Mitigations:**
  - Both Brier score and 10-bin decile ECE are pre-specified as primary evaluation metrics.
  - High ROC-AUC will **not** be accepted as justification to select a model if its calibration error is severely degraded.

---

### 3.3 RSK-03: Group 1 Empirical Label Collision
- **Mechanisms:**
  - As audited in Stage 3B.2.1, two observations in Development (row indices 902 & 8257) possess an identical 10-feature signature but conflicting survey labels ($y=1$ vs $y=0$).
  - Tree-based models partition feature space orthogonally; because the feature coordinates of these two observations are identical, they will inevitably fall into the identical terminal leaf in every tree.
- **Enforced Mitigations:**
  - Group-aware cross-validation keeps Group 1 intact within Validation Fold 2.
  - The model outputs for Group 1 will produce an identical probability for both rows; reporting documents this limitation transparently without attributing it to population Bayes risk.

---

### 3.4 RSK-07: Clinical & Real-World Generalization Disclaimers
- **Mandatory Reporting Contract:**
  1. The target `Depression` is self-reported survey metadata collected from an unverified public online cohort.
  2. It has **no verified clinical psychometric validation** (such as structured clinical interviews or verified PHQ-9 diagnostic thresholds).
  3. Feature importances (e.g. SHAP values, Gini gains, split counts) reflect mathematical correlations within this dataset, **not causal medical etiologies**.
  4. Model outputs must never be used as diagnostic tools, psychiatric triaging devices, or clinical intervention triggers without independent, prospective, clinically governed trials.

---

## 4. Risk Sign-Off

The Senior ML Research Infrastructure Engineer and Data-Governance Auditor have reviewed this register. All preflight mitigations are integrated into the execution protocol and model configurations.

**Status:** APPROVED FOR STAGE 3B.3 PREFLIGHT. EXECUTION REMAINS STRICTLY UNAUTHORIZED.
