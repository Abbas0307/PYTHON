# MINDORA 2.0 — REAL-WORLD 163-RECORD DATASET EXPERIMENT REPORT
## Track B: Provenance Audit, Small-Sample Methodology & Repeated Cross-Validation

**Author:** Principal Machine Learning Engineer & Data Scientist  
**Date:** November 16, 2026  
**File Location:** `ml_lab/data/raw/STUDENT dataset.xlsx`  
**Dataset Label:** **163-RECORD DATASET — PROVENANCE UNVERIFIED**  
**Pipeline Location:** `scripts/train_real_world_163.py`  
**Model Storage:** `models/real_world_163/`  
**Report Artifacts:** `reports/real_world_163/small_dataset_metrics.json`  

---

## 1. Provenance Verification & Governance Status

In accordance with Phase 5 instructions, a rigorous provenance audit of `ml_lab/data/raw/STUDENT dataset.xlsx` was conducted prior to model ingestion:

### 1.1 Provenance Findings:
- **File Structure:** 162 response rows + 1 header row = 163 rows total; 14 columns.
- **Origin:** Google Form entitled "Form Responses 1" collected on November 14, 2026.
- **Target Feature:** `Has a qualified healthcare professional ever told you that you have depression` (Self-reported diagnosis: `no`: 98 [60.5%], `yes`: 45 [27.8%], `not sure`: 19 [11.7%]).
- **Participant Demographics:** Respondent ages range from 13 to 69 years (median: 19.0, mean: 20.09). Seventeen respondents reported ages $< 18$, confirming the presence of minors.
- **Documentation Gaps:** No signed Institutional Review Board (IRB) approval protocol, ethics committee registry number, participant consent logs, or institutional affiliation certificates accompany the spreadsheet.
- **Mandatory Status Label:** **`"163-RECORD DATASET — PROVENANCE UNVERIFIED"`**.
- **Research Safeguard:** This dataset is **strictly quarantined** within the research laboratory. It is never merged with the 27,901 benchmark records, nor is it exposed to student-facing inference endpoints.

---

## 2. Data Quality & Preprocessing Waterfall

The raw spreadsheet contains unstandardized free-text responses requiring systematic data cleaning:

```
Step 0: Initial Raw Submissions                   N = 162 (100.0%)
Step 1: CGPA Parsing & Sanitation                  N = 162 (3 dirty strings imputed via median)
Step 2: Study Hours Range Resolution               N = 162 (3 text ranges converted to midpoints)
Step 3: Degree Free-Text Normalization             N = 162 (63 raw strings clustered into 6 groups)
Step 4: Academic Pressure Ordinal Mapping          N = 162 (Mapped to 1-5 integer scale)
Step 5: Target Label Harmonization                 N = 143 (Clean binary: 98 "no", 45 "yes")
        Quarantined "not sure" instances:          N =  19 (Excluded from primary binary training)
```

### Detailed Cleaning Actions:
1. **CGPA Cleaning:** Three non-numeric entries (`"Nill"`, `"No"`, and emoji `"🤷‍♂️"`) were coerced to `NaN` and imputed with the training fold median (8.00).
2. **Study Hours Cleaning:** Range formats like `"3-4"` were converted to midpoint `3.5`; `"3 hrs"` was normalized to `3.0`. Extreme outliers were retained with median imputation on folds.
3. **Degree Clustering:** Sixty-three idiosyncratic text strings were mapped to 6 collegiate disciplines: *Engineering/Tech* (55), *Business/Commerce* (30), *Computer Science/IT* (15), *Design/Architecture* (10), *Humanities/Arts* (8), and *Science/Other* (25).
4. **Target Binarization:** Primary ground truth requires definitive labels: `yes` &rarr; 1, `no` &rarr; 0 ($N = 143$). The 19 `not sure` instances were isolated to prevent label noise.

---

## 3. Small-Sample Evaluation Strategy

### 3.1 Why No Independent Holdout Test Set Was Formed:
With a total primary cohort of $N = 143$ and only **45 positive instances**, splitting a standard 20% holdout test set would leave only ~28 test samples (containing merely ~9 positive cases). Such a minuscule test set produces extreme sampling variance (a single misclassified sample alters accuracy by 3.6%), while simultaneously depriving the training partition of critical minority-class instances.

**Methodological Invariant:** Rather than reporting a high-variance single test split, Mindora executed **Repeated Stratified 5-Fold Cross-Validation (5 folds $\times$ 5 repeats = 25 distinct evaluations)**. Preprocessing transformers were fitted strictly inside each training fold to ensure zero data leakage.

---

## 4. Four-Model Cross-Validation Results

The table below presents the mean, standard deviation, and 95% Confidence Intervals calculated across all 25 cross-validation iterations:

| Model Algorithm | Metric | Mean Score | Std Dev ($\pm$) | 95% Confidence Interval | Stability Assessment |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Logistic Regression** | Accuracy | 63.84% | $\pm$ 0.0887 | [60.18%, 67.50%] | Moderate linear stability |
| | Recall (Sensitivity) | 54.44% | $\pm$ 0.1654 | [47.61%, 61.27%] | High fold-to-fold recall variance |
| | Positive F1-Score | 47.76% | $\pm$ 0.1264 | [42.54%, 52.98%] | Constrained by minority prevalence |
| | ROC-AUC | 0.6252 | $\pm$ 0.0969 | [0.5852, 0.6653] | Modest linear discrimination |
| **Random Forest** | Accuracy | 69.81% | $\pm$ 0.0922 | [66.01%, 73.62%] | Strong non-linear bagging |
| | Recall (Sensitivity) | 49.33% | $\pm$ 0.1584 | [42.79%, 55.87%] | Conservative tree voting |
| | Positive F1-Score | **52.41%** | $\pm$ 0.1331 | [46.92%, 57.91%] | **Highest F1 on 163 Cohort** |
| | ROC-AUC | **0.7268** | $\pm$ 0.0817 | [0.6930, 0.7605] | **Highest AUC on 163 Cohort** |
| **XGBoost Classifier** | Accuracy | **72.15%** | $\pm$ 0.0574 | [69.78%, 74.52%] | **Highest Overall Accuracy** |
| | Recall (Sensitivity) | 34.67% | $\pm$ 0.1248 | [29.52%, 39.82%] | Shrinkage suppresses minority predictions |
| | Positive F1-Score | 42.90% | $\pm$ 0.1224 | [37.85%, 47.95%] | Conservative positive classification |
| | ROC-AUC | 0.7266 | $\pm$ 0.0821 | [0.6927, 0.7605] | Strong ranking discrimination |
| **Support Vector Machine** | Accuracy | 71.43% | $\pm$ 0.0521 | [69.28%, 73.58%] | High specificity bias |
| | Recall (Sensitivity) | 20.44% | $\pm$ 0.1645 | [13.65%, 27.24%] | Severe minority class suppression |
| | Positive F1-Score | 29.60% | $\pm$ 0.2022 | [21.26%, 37.95%] | Extreme variance on small positive cases |
| | ROC-AUC | 0.7238 | $\pm$ 0.0864 | [0.6881, 0.7594] | Moderate kernel discrimination |

---

## 5. Small-Sample Limitations & Scientific Conclusions

1. **High Minority Variance:** Across all models, standard deviations for Recall and F1 range from $\pm 0.12$ to $\pm 0.20$, demonstrating the unavoidable sampling fragility of cohorts with fewer than 50 positive instances.
2. **Tree Ensembles Outperform Linear Baselines:** Random Forest achieved the most reliable balance on this small cohort, leading with **52.41% mean F1** and **0.7268 mean ROC-AUC**.
3. **No Clinical Generalization:** Because provenance is unverified and minor respondents are present, these results reflect purely experimental algorithmic benchmarks. They must not be cited as evidence of real-world clinical screening accuracy.
