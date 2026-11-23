# MODEL CARD: MINDORA 2.0 CLASSIFICATION ENSEMBLE
## Standardized Model Specification & Governance Card (Mitchell et al., 2019)

**Date of Release:** November 16, 2026  
**Model Version:** 2.0.0 (Four-Model Laboratory Release)  
**Developers:** Mindora Engineering & Machine Learning Team  
**License:** Open Research Governance / Non-Commercial Educational Platform  
**Repository Location:** `D:\Depression calculator`  

---

## 1. Model Details

- **Model Families Evaluated:**
  1. *Logistic Regression:* $L_2$-regularized linear model with balanced class weighting (`solver='lbfgs'`, $C=1.0$).
  2. *Random Forest Classifier:* Bootstrap aggregated ensemble with 150 estimators, bounded `max_depth=8`, and `class_weight='balanced'`.
  3. *XGBoost Classifier:* Gradient-boosted decision trees with 150 estimators, `max_depth=5`, `learning_rate=0.05`, and `colsample_bytree=0.85`.
  4. *Support Vector Machine (SVM):* RBF kernel ($C=1.0$, `gamma='scale'`) with 3-fold Platt calibration (`CalibratedClassifierCV`).
- **Primary Production Engine:** XGBoost Classifier (selected via validation set performance).
- **Secondary Baseline Engine:** Logistic Regression (fast, deterministic linear interpretability).

---

## 2. Intended Use & Boundaries

### 2.1 Permitted & Intended Uses:
- Self-guided educational exploration of collegiate lifestyle habits (sleep, study hours, financial strain, academic pressure).
- Personalized generation of structured, non-clinical routine recommendations (Pomodoro pacing, sleep hygiene, grounding).
- Comparative machine learning research evaluating tabular classification algorithms on university student surveys.

### 2.2 Prohibited Uses:
- **Zero Medical or Psychiatric Diagnosis:** Must NOT be used to diagnose Major Depressive Disorder (MDD), dysthymia, bipolar disorder, or any DSM-5 / ICD-11 psychiatric condition.
- **Zero Crisis or Self-Harm Detection:** Must NOT be used as a triage tool for immediate crisis, suicidal ideation, or acute danger. Mindora provides permanent, unmediated links to national crisis hotlines (Tele-MANAS, 988) independent of model outputs.
- **Zero High-Stakes Decisions:** Must NOT be used for university admissions, grading, academic disciplinary decisions, scholarship qualification, health insurance underwriting, or employment screening.

---

## 3. Training & Evaluation Data

- **Primary Training Corpus (Track A):**
  - Kaggle Student Depression Benchmark (`dataset/Student_Depression_Dataset.csv`).
  - Total instances: 27,901 rows.
  - Stratified partitions: Training: 19,530 (70.0%), Validation: 4,185 (15.0%), Holdout Test: 4,186 (15.0%).
- **Experimental Corpus (Track B):**
  - Unsupervised Google Form responses (`ml_lab/data/raw/STUDENT dataset.xlsx`).
  - Labeled: **"163-RECORD DATASET — PROVENANCE UNVERIFIED"**.
  - Evaluated via Repeated Stratified 5-Fold Cross-Validation ($N=143$ clean primary instances).

---

## 4. Quantitative Performance Summary (Holdout Test Split, $N = 4,186$)

| Performance Dimension | Logistic Regression | Random Forest | XGBoost (Primary) | Support Vector Machine |
| :--- | :---: | :---: | :---: | :---: |
| **Accuracy** | 78.98% | 78.33% | **79.65%** | 77.45% |
| **Precision** | 80.45% | 79.52% | **80.59%** | 78.14% |
| **Recall (Sensitivity)** | 82.65% | 82.61% | **85.40%** | 82.35% |
| **Specificity** | **73.81%** | 72.30% | 71.55% | 70.55% |
| **F1-Score (Positive)** | 81.54% | 81.04% | **82.93%** | 80.19% |
| **Macro F1-Score** | 78.50% | 77.81% | **79.08%** | 76.84% |
| **ROC-AUC** | 0.8663 | 0.8596 | **0.8677** | 0.8415 |
| **Brier Score ($\downarrow$)** | 0.1475 | 0.1620 | **0.1437** | 0.1617 |

---

## 5. Ethical Considerations & Limitations

1. **Self-Report Bias:** Input features reflect subjective self-reported perceptions of pressure, study satisfaction, and sleep, rather than objective clinical or physiological measurements.
2. **Geographic & Demographical Representativeness:** Survey responses are predominantly collegiate and regional; performance may vary when evaluated on non-student populations or diverse cultural contexts.
3. **Probability Calibration Limits:** While XGBoost and Logistic Regression achieve excellent Brier scores ($\le 0.1475$), predicted probabilities reflect statistical model confidence within the tabular dataset, not biological risk likelihoods.
