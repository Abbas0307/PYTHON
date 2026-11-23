# MINDORA 2.0 — PHASE 5.18 ML LABORATORY INTEGRATION AUDIT
## Verification of Model Artifacts, Pipeline Robustness, Feature Ordering, Probability Calibration & Explainability

**Auditors:** Principal ML Systems Auditor, Senior Data Scientist & QA Automation Lead  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  
**Inspected Subsystems:** `models/large_dataset/*.joblib`, `frontend/src/pages/ModelLabScreen.tsx`, `frontend/src/pages/ModelComparisonScreen.tsx`, `frontend/src/pages/ExplainabilityScreen.tsx`, `frontend/src/data/modelMetricsData.ts`

---

## 1. Executive Summary & Audit Mandate

This audit evaluates the end-to-end integration of the four machine learning architectures developed for Mindora 2.0. The audit verifies model artifact loading, preprocessing pipeline encapsulation, feature ordering invariants, missing-value tolerance, probability calibration, metric presentation fidelity, and explainability integration.

### Audited Architectures:
1. **Logistic Regression** ($L_2$-regularized linear classifier, L-BFGS solver, balanced weights).
2. **Random Forest Classifier** ($150$ bootstrap trees, maximum depth $8$, minimum split $5$).
3. **XGBoost Classifier** ($150$ gradient-boosted trees, depth $5$, shrinkage $\eta = 0.05$, subsample $0.85$).
4. **Support Vector Machine** (Radial Basis Function kernel, $C=1.0$, 3-fold Platt calibration).

---

## 2. Model Artifact Integrity & Serialization Verification

All four models were loaded from disk and inspected in Python:

| Model Architecture | Artifact Path | File Format | Binary SHA-256 Hash | Load Status |
| :--- | :--- | :---: | :---: | :---: |
| **Logistic Regression** | `models/large_dataset/logistic_regression.joblib` | Scikit-learn Pipeline | `C19A5EB12B601CAF6C0D4DF954CEEFE7EC21B90680D923C2C650B0108399CDAE` | **`PASS`** |
| **Random Forest** | `models/large_dataset/random_forest.joblib` | Scikit-learn Pipeline | `4C72ED75706645C92C3D3256A49524CF80E4BCDE547214777D16A192A4786A08` | **`PASS`** |
| **XGBoost Classifier** | `models/large_dataset/xgboost.joblib` | Scikit-learn Pipeline | `D5D3A2B5EFF66C922572BC81CE9E5BDACEECEEEAEF17670984DC468452D1CFE1` | **`PASS`** |
| **Support Vector Machine**| `models/large_dataset/support_vector_machine.joblib`| Scikit-learn Pipeline | `E6D914D57B3E977CDCAE09DEEB01DEBA301F5241C90D1A0413B397EB15668BC2` | **`PASS`** |

---

## 3. Preprocessing Consistency, Feature Ordering & Missing Value Robustness

### 3.1 Encapsulated Transformation Pipeline
All artifacts encapsulate both feature preprocessing and classification within an atomic scikit-learn `Pipeline`:
- **Continuous Features (6):** `Age`, `Academic Pressure`, `CGPA`, `Study Satisfaction`, `Work/Study Hours`, `Financial Stress`.
  - Imputer: `SimpleImputer(strategy='median')`
  - Scaler: `StandardScaler()`
- **Categorical Features (4):** `Gender`, `Sleep Duration`, `Dietary Habits`, `Degree`.
  - Imputer: `SimpleImputer(strategy='most_frequent')`
  - Encoder: `OneHotEncoder(handle_unknown='ignore')` &rarr; 39 one-hot indicator columns.
- **Total Processed Dimensions:** 45 numeric features.

### 3.2 Robustness Under Missing Values
The pipeline was evaluated with synthetic payloads containing missing continuous and categorical values (`CGPA = np.nan`, `Work/Study Hours = np.nan`, `Sleep Duration = None`):
- **Outcome:** The pipeline executed without throwing unhandled exceptions or NaN errors. Missing continuous features were cleanly imputed using training set medians, and missing categories were imputed using training set modes.
- **Inference Stability:** Discrete class predictions and well-formed probabilities $[p_0, p_1]$ where $p_0 + p_1 = 1.0$ were produced across all four architectures.

---

## 4. Canonical Reconciled Metrics Presentation Audit

The metrics presented in `ModelComparisonScreen.tsx` and `ModelLabScreen.tsx` were cross-checked against the canonical Phase 5.17 reconciled results:

| Evaluation Dimension | Logistic Regression | Random Forest | XGBoost (Primary) | Support Vector Machine | UI Parity Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Overall Accuracy** | 78.98% | 78.33% | **79.65%** | 77.45% | **`PASS` (Exact Match)** |
| **Precision** | **83.93%** | 83.08% | 81.49% | 82.55% | **`PASS` (Exact Match)** |
| **Recall (Sensitivity)** | 79.27% | 79.11% | **84.41%** | 77.97% | **`PASS` (Exact Match)** |
| **Specificity** | **78.56%** | 77.23% | 72.91% | 76.71% | **`PASS` (Exact Match)** |
| **Positive F1-Score** | 81.54% | 81.04% | **82.93%** | 80.19% | **`PASS` (Exact Match)** |
| **ROC-AUC** | 0.8663 | 0.8596 | **0.8677** | 0.8415 | **`PASS` (Exact Match)** |
| **PR-AUC** | 0.8936 | 0.8859 | **0.8959** | 0.8817 | **`PASS` (Exact Match)** |
| **Brier Score ($\downarrow$)** | 0.1475 | 0.1620 | **0.1437** | 0.1617 | **`PASS` (Exact Match)** |
| **True Positives (TP)** | 1,943 | 1,939 | **2,069** | 1,911 | **`PASS` (Exact Match)** |
| **False Positives (FP)** | 372 | 395 | **470** | 404 | **`PASS` (Exact Match)** |
| **False Negatives (FN)** | 508 | 512 | **382** | 540 | **`PASS` (Exact Match)** |
| **True Negatives (TN)** | 1,363 | 1,340 | **1,265** | 1,331 | **`PASS` (Exact Match)** |

All 9 evaluated metric dimensions match the canonical experiment records exactly to two decimal places (and confusion matrices match to the exact integer instance). Zero fabricated or mock metrics are presented on the comparison screens.

---

## 5. Explainability & Feature Importance Integration

`ExplainabilityScreen.tsx` integrates global feature importance rankings:
1. **XGBoost Feature Importance Ranking:**
   - Rank 1: `Financial Stress` ($26.4\%$)
   - Rank 2: `Academic Pressure` ($21.8\%$)
   - Rank 3: `Study Satisfaction` ($18.2\%$)
   - Rank 4: `Sleep Duration` ($12.5\%$)
   - Rank 5: `CGPA` ($9.1\%$)
2. **Clinical Safety Disclosure:** The explainability dashboard displays an explicit disclaimer:
   > *"Machine learning feature weights represent statistical associations within historical collegiate survey data. They do not constitute etiology, clinical diagnosis, or medical causation."*

---

## 6. Audit Verdict

- **FOUR-MODEL ML LABORATORY INTEGRATION:** **`PASS`**  
  All four model pipelines verified for serialization integrity, missing-value robustness, feature ordering, and 100% metric consistency with canonical Phase 5.17 reconciled results.
