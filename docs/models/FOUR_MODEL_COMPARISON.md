# MINDORA 2.0 — FOUR-MODEL COMPARATIVE BENCHMARK REPORT
## Multi-Model Tabular Classification Evaluation & Generalization Analysis

**Author:** Principal Machine Learning Engineer & Data Scientist  
**Date:** November 16, 2026  
**Status:** REPRODUCIBLE BENCHMARK VERIFIED  
**Repository Location:** `D:\Depression calculator`  
**Dataset:** Kaggle Collegiate Depression Benchmark ($N = 27,901$)  
**Target Feature:** `Depression` (Binary: 0 = Non-Depressed, 1 = Depressed)  
**Positive Class Prevalence:** 58.55% ($16,336$ positive / $11,565$ negative)  

---

## 1. Executive Summary

This report establishes the comparative empirical evaluation of four distinct classification algorithms developed for Mindora 2.0:
1. **Logistic Regression** (L2-regularized linear baseline with standardized continuous predictors).
2. **Random Forest Classifier** (Bootstrap-aggregated tree ensemble with controlled tree depth).
3. **XGBoost Classifier** (Gradient-boosted decision tree ensemble with shrinkage and feature subsampling).
4. **Support Vector Machine (SVM)** (Radial Basis Function [RBF] kernel with 3-fold Platt calibration).

All models were evaluated using a common, leakage-safe preprocessing pipeline (`ColumnTransformer`) fitted strictly on training data ($N = 19,530$). In strict adherence to sound machine learning methodology, **model selection and hyperparameter optimization were conducted exclusively on the validation partition ($N = 4,185$)**. The independent holdout test partition ($N = 4,186$) was reserved untouched for final unbiased evaluation.

---

## 2. 11-Metric Comparative Benchmark

The table below details all 11 performance dimensions evaluated on the independent holdout test partition ($N = 4,186$):

| Performance Dimension | Metric Definition | Logistic Regression | Random Forest | XGBoost Classifier | Support Vector Machine | Recommended Benchmark |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Overall Accuracy** | $(TP + TN) / Total$ | 78.98% | 78.33% | **79.65%** | 77.45% | **XGBoost** |
| **2. Precision** | $TP / (TP + FP)$ | **83.93%** | 83.08% | 81.49% | 82.55% | **Logistic Regression** |
| **3. Recall (Sensitivity)** | $TP / (TP + FN)$ | 79.27% | 79.11% | **84.41%** | 77.97% | **XGBoost** |
| **4. Specificity** | $TN / (TN + FP)$ | **78.56%** | 77.23% | 72.91% | 76.71% | **Logistic Regression** |
| **5. Positive F1-Score** | $2 \cdot (P \cdot R) / (P + R)$ | 81.54% | 81.04% | **82.93%** | 80.19% | **XGBoost** |
| **6. Macro-Averaged F1** | $(F1_0 + F1_1) / 2$ | 78.78% | 78.11% | **79.33%** | 77.30% | **XGBoost** |
| **7. ROC-AUC** | Area Under Receiver Operating Curve | 0.8663 | 0.8596 | **0.8677** | 0.8415 | **XGBoost** |
| **8. PR-AUC** | Area Under Precision-Recall Curve | 0.8936 | 0.8859 | **0.8959** | 0.8817 | **XGBoost** |
| **9. Brier Score** | Mean Squared Probability Error ($\downarrow$) | 0.1475 | 0.1620 | **0.1437** | 0.1617 | **XGBoost** |
| **10. Training Time** | Wall-clock fit time (seconds) | **0.031s** | 0.286s | 0.222s | 9.479s | **Logistic Regression** |
| **11. Inference Latency** | Milliseconds per record | **0.0007 ms** | 0.0076 ms | 0.0028 ms | 0.0461 ms | **Logistic Regression** |

---

## 3. Confusion Matrix Breakdown (Holdout Test Split, $N = 4,186$)

All confusion matrices adhere to explicit index ordering:
- `Index 0`: Negative Class (Non-Depressed, $N = 1,735$)
- `Index 1`: Positive Class (Depressed, $N = 2,451$)

```
Logistic Regression:
  [[TN: 1,363,  FP: 372],
   [FN:   508,  TP: 1,943]]

Random Forest:
  [[TN: 1,340,  FP: 395],
   [FN:   512,  TP: 1,939]]

XGBoost Classifier:
  [[TN: 1,265,  FP: 470],
   [FN:   382,  TP: 2,069]]

Support Vector Machine (Calibrated RBF):
  [[TN: 1,331,  FP: 404],
   [FN:   540,  TP: 1,911]]
```

---

## 4. Clinical Trade-Off Analysis: Precision vs. Recall vs. False Negatives

In student mental wellness systems, evaluation metrics cannot be treated as purely mathematical abstractions:
1. **The Cost of False Negatives (Type II Errors):**  
   A False Negative represents an enrolled student experiencing clinical or sub-clinical depression whose self-reported profile was classified as "non-depressed." In an automated system, a high False Negative rate means distressed students fail to receive tailored wellness actions, counselor recommendations, or supportive follow-ups. **XGBoost minimized False Negatives to 382** (compared to 508 for Logistic Regression, 512 for Random Forest, and 540 for SVM), achieving a superior Sensitivity of **84.41%**.
2. **The Cost of False Positives (Type I Errors):**  
   A False Positive represents a student experiencing situational stress who is flagged for proactive support. While less severe than a missed risk, high False Positive rates degrade trust and induce "alert fatigue." Because Mindora frames recommendations supportively without clinical diagnostic labels, moderate False Positives are ethically acceptable. All four models maintain strong Precision ($\ge 81.4\%$).
3. **The Harmonic Balance (F1-Score):**  
   XGBoost demonstrates the optimal trade-off, leading all models in positive class F1-Score (**82.93%**) and macro-averaged F1 (**79.33%**).

---

## 5. Model Calibration Comparison & Brier Score Analysis

Model probability calibration reflects the degree to which predicted probabilities match empirical observed risk:
- **XGBoost (Brier: 0.1437):** Produced the most reliable probabilistic confidence scores. Predicted probabilities closely follow the ideal 45-degree diagonal in reliability diagrams.
- **Logistic Regression (Brier: 0.1475):** Strong natural calibration due to maximum likelihood estimation with log-loss.
- **Support Vector Machine (Brier: 0.1617):** Native SVM does not yield class probabilities; Platt scaling via 3-fold cross-validation (`CalibratedClassifierCV`) provides reliable sigmoidal bounds, though slight probability compression occurs near the extremes.
- **Random Forest (Brier: 0.1620):** Exhibits typical bagging probability conservatism; ensemble averaging drives predictions away from 0.0 and 1.0 toward the base rate.

---

## 6. Selection Protocol & Conclusion

- **Validation-Governed Selection:** On the validation partition, XGBoost achieved an F1 of **83.19%** and ROC-AUC of **0.8722**, outperforming Logistic Regression (F1: 81.75%), Random Forest (F1: 81.72%), and SVM (F1: 79.97%).
- **Holdout Generalization:** On the unseen test partition, XGBoost maintained **82.93% F1** and **0.8677 ROC-AUC**, with a minimal overfitting drop of only 0.26% F1 from validation to test.
- **Operational Verdict:** **XGBoost Classifier** is designated as the primary production classification engine for collegiate risk screening, with Logistic Regression preserved as an ultra-fast, highly interpretable linear baseline.
