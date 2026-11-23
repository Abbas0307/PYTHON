# MINDORA 2.0 — FEATURE COMPATIBILITY MATRIX & DISTRIBUTION DIVERGENCE
**Stage 1: Cross-Dataset Alignment, Statistical Divergence & Covariate Shift Analysis**
**Date:** 2026-11-15  
**Document Ref:** `ml_lab/audit/feature_compatibility_matrix.md`  

---

## 1. PRIMARY OBJECTIVE

This document presents a column-by-column comparative mapping between **Dataset A** (`dataset/Student_Depression_Dataset.csv`) and **Dataset B** (`ml_lab/data/raw/STUDENT dataset.xlsx`). 

It evaluates:
1. Feature-level semantic and domain alignment,
2. Empirical statistical distribution divergence using formal two-sample tests,
3. Technical hurdles required for transformation,
4. Mathematical proof of Covariate Shift prohibiting dataset pooling.

---

## 2. FEATURE-BY-FEATURE MAPPING MATRIX

| # | Dataset A Feature | Dataset B Survey Question | Match Category | Domain / Value Differences | Transformation Difficulty |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | `Age` | `What is your age?` | **Semantic Match** | A: Range 18–59 (Mean 25.82).<br>B: Range 13–69 (Mean 20.09). Minors present in B. | Trivial (requires minor quarantine). |
| 2 | `Gender` | ` What is your gender?` *(Note leading space)* | **Partial Match** | A: `Male`, `Female` ($0$ missing).<br>B: `Female` (90), `Male` (63), `Prefer not to say` (9). | Moderate: `Prefer not to say` has no equivalent in A pipeline. |
| 3 | `Academic Pressure` | `How much academic pressure do you currently experience?` | **Type & Scale Mismatch** | A: Numeric float 0.0 to 5.0.<br>B: Ordinal text strings (`very low`, `low`, `moderate`, `high`, `very high`). | Moderate: Requires ordinal mapping ($1-5$). Scale anchoring unverified. |
| 4 | `CGPA` | `What is your current CGPA on a 10-point scale?` | **Dirty Format Mismatch** | A: Clean float 0.0 to 10.0.<br>B: Object dtype containing numbers and text (`🤷‍♂️`, `Nill`, `No`). | Moderate: Requires regex float extraction and dropping invalid records. |
| 5 | `Study Satisfaction` | `How satisfied are you with your current studies?` | **Semantic Match** | A: Float 0.0 to 5.0 (Mean 3.02).<br>B: Discrete integer 1 to 5 (Mean 3.20). | Low: Compatible 1–5 integer scale. |
| 6 | `Sleep Duration` | `On average, how many hours do you sleep per night?` | **Encoding & Vocabulary Mismatch** | A: ASCII hyphen: `'5-6 hours'`, `'7-8 hours'`, `'Less than 5 hours'`, `'More than 8 hours'`, `'Others'`.<br>B: Unicode en-dash: `'5–6 hours'`, `'7–8 hours'`, `'Less than 5 hours'`, `'More than 8 hours'`. No `'Others'`. | Moderate: Unicode normalization required (`\u2013` $\to$ `-`). Naive string matching produces $0\%$ match. |
| 7 | `Dietary Habits` | `How would you describe your usual dietary habits?` | **Partial Vocabulary Mismatch** | A: `Healthy`, `Moderate`, `Unhealthy`, `Others`.<br>B: `Moderate`, `Healthy`, `Unhealthy`, `Prefer not to say`. | Moderate: `Prefer not to say` (10 rows) has no direct mapping in A. |
| 8 | `Degree` | `What degree or educational programme are you currently pursuing?` | **Severe Categorical Fragmentation** | A: 28 fixed standardized degree codes.<br>B: 63 free-text strings with varied spelling, casing, punctuation (`B.E`, `Btech`, `B.Tech`, etc.). | High: Requires extensive fuzzy matching / regex normalization. Many degrees in B do not exist in A. |
| 9 | `Work/Study Hours` | `On an average day, how many total hours do you spend studying or working?( in numbers)` | **Dirty Format Mismatch** | A: Float 0.0 to 12.0.<br>B: Object dtype with numbers and ranges (`'3-4 '`, `'3 hrs'`, `'2-3'`). | Moderate: Requires text parsing and midpoint conversion. |
| 10 | `Financial Stress` | `How much financial stress do you currently experience?` | **Semantic Match** | A: Float 1.0 to 5.0 (3 nulls).<br>B: Discrete integer 1 to 5 ($0$ nulls). | Low: Compatible 1–5 integer scale. |
| 11 | `Depression` | `Has a qualified healthcare professional ever told you that you have depression` | **Incompatible Construct** | A: Binary indicator ($0/1$).<br>B: 3-class diagnosis report (`no`, `yes`, `not sure`). | Severe / Incompatible: Different clinical and epistemological constructs. |

---

## 3. EMPIRICAL DISTRIBUTION DIVERGENCE TESTS

To scientifically determine whether Dataset A and Dataset B sample the same underlying student population, two-sample hypothesis tests were conducted on all overlapping features.

### 3.1 Numerical Features: Two-Sample Kolmogorov-Smirnov (KS) Tests
- **Null Hypothesis ($H_0$):** Dataset A and Dataset B samples are drawn from the same continuous distribution.
- **Significance Threshold:** $\alpha = 0.001$

| Feature | Two-Sample KS Statistic ($D$) | $p$-value | Decision at $\alpha=0.001$ | Interpretation |
| :--- | :---: | :---: | :---: | :--- |
| `Age` | **0.5953** | **$5.59 \times 10^{-55}$** | **Reject $H_0$** | Massive population divergence. Dataset B is significantly younger (median 19 vs 25). |
| `Work/Study Hours` | **0.2989** | **$5.15 \times 10^{-13}$** | **Reject $H_0$** | Overwhelming divergence. Dataset B studies fewer hours (mean 5.86 vs 7.16). |
| `CGPA` | **0.2541** | **$1.75 \times 10^{-9}$** | **Reject $H_0$** | Highly significant divergence in grading distributions. |
| `Study Satisfaction` | **0.2198** | **$2.61 \times 10^{-7}$** | **Reject $H_0$** | Highly significant divergence. |
| `Financial Stress` | **0.1674** | **$2.05 \times 10^{-4}$** | **Reject $H_0$** | Significant divergence ($p < 0.001$). |

### 3.2 Categorical Features: Chi-Square ($\chi^2$) Goodness-of-Fit Tests
- **Null Hypothesis ($H_0$):** The proportion of categories in Dataset B matches the expected distribution of Dataset A.
- **Significance Threshold:** $\alpha = 0.001$

| Feature | $\chi^2$ Test Statistic | Degrees of Freedom | $p$-value | Decision at $\alpha=0.001$ | Interpretation |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `Gender` | **13.1201** | 1 | **$2.92 \times 10^{-4}$** | **Reject $H_0$** | Dataset B has a majority female cohort ($55.56\%$), whereas Dataset A is majority male ($55.72\%$). |
| `Sleep Duration` | **64.3167** | 3 | **$7.02 \times 10^{-14}$** | **Reject $H_0$** | Massive distribution divergence. B clusters heavily at $5–6$ hours ($46.9\%$). |
| `Dietary Habits` | **32.5694** | 2 | **$8.47 \times 10^{-8}$** | **Reject $H_0$** | Highly significant divergence in nutritional reporting. |

**Summary of Empirical Testing:**
Every single overlapping feature—without exception—rejects the null hypothesis of common distribution at $p < 0.001$.

---

## 4. MATHEMATICAL PROOF OF COVARIATE SHIFT & RISKS OF POOLING

### 4.1 Formal Definition of Covariate Shift
In statistical machine learning, Covariate Shift occurs when the feature distribution differs across domains while the conditional probability distribution of the target given the features is assumed constant:
$$P_A(X) \neq P_B(X) \quad \text{while} \quad P(Y|X) \text{ is invariant}$$

Our empirical tests prove unequivocally that $P_A(X) \neq P_B(X)$ across all dimensions. Furthermore, as demonstrated in the Label Validity Assessment, the target constructs are fundamentally distinct:
$$P_A(Y|X) \neq P_B(Y|X)$$
This dual failure represents both **Covariate Shift** and **Concept Drift (Label Shift)**.

### 4.2 Why Merging the Datasets is Methodologically Catastrophic
1. **Severe Imbalance Swamping:**
   Dataset A has $N_A = 27,901$. Dataset B has $N_B = 162$ (or $N_{B,\text{eligible}} = 113$).
   If pooled:
   $$\text{Weight of Dataset B} = \frac{162}{27,901 + 162} = 0.00577 \quad (0.58\%)$$
   The real-world student responses would constitute less than $0.6\%$ of the training data. Any machine-learning optimization algorithm (gradient boosting, neural networks, or logistic regression) would treat Dataset B's samples as statistical noise or outliers, completely erasing their localized signal.
2. **Evaluation Poisoning:**
   If a model trained on a pooled dataset is evaluated, the validation loss will be dominated by Dataset A ($99.4\%$). The benchmark would provide a false illusion of high predictive accuracy while failing catastrophically on the actual student population.
3. **Encoding & Categorical Contamination:**
   Forcing Dataset B's 63 free-text degrees and text-based academic pressure into Dataset A's one-hot encoding space induces severe measurement error and feature distortion.

### 4.3 Conclusion
**Merging Dataset A and Dataset B is strictly prohibited.** It violates core principles of scientific machine learning, introduces negative transfer, and produces uninterpretable models.
