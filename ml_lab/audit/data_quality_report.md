# MINDORA 2.0 — DATA QUALITY AUDIT REPORT
**Stage 1: Dual-Dataset Deep Quality Profiling & Synthetic Artifact Audit**
**Date:** 2026-11-15  
**Audit Pipeline Version:** 1.0.0  
**Environment:** Python 3.12 / pandas / scipy / scikit-learn  

---

## 1. EXECUTIVE SUMMARY

Stage 1 conducted an exhaustive, independent empirical data quality audit of the two datasets available to the Mindora project:
1. **Dataset A (Public Benchmark Dataset):** `dataset/Student_Depression_Dataset.csv` (27,901 rows, 18 columns, SHA-256: `a3e159e246789be5a61dcc7b4290fbc238f0140f3d95727585af50a61fd35404`).
2. **Dataset B (Collected Responses):** `ml_lab/data/raw/STUDENT dataset.xlsx` (162 rows, 14 columns, SHA-256: `a040665638e5d7a433c171b1f703061f571da50e2f1f2c55c3f0c37fa57c7e09`).

Neither original dataset was modified, combined, or processed into a model during this audit. Individual respondent records have been aggregated and anonymized in strict accordance with the non-negotiable Stage 1 safety protocols.

### Key Audit Findings
- **Dataset A:** Possesses high volume (N = 27,901) and low missingness (only 3 missing values in `Financial Stress`), but displays pronounced statistical characteristics typical of synthetically generated or CTGAN-augmented datasets: near-zero feature collinearity (VIF $\approx 1.01 - 1.04$), 9 records with exact $0.0$ CGPA, 31 non-students (e.g. Architects, Chefs, Doctors) inside a student dataset, and an artificially elevated depression prevalence ($58.55\%$).
- **Dataset B:** Represents genuine, organic primary data collection from students (N = 162), but suffers from critical data quality issues:
  - 17 minors ($10.49\%$ aged $< 18$, minimum age 13),
  - 24 non-students ($14.81\%$ not currently enrolled),
  - Severe internal contradiction (14 respondents aged $< 18$ answered "Yes" to being $\ge 18$; 11 respondents aged $\ge 18$ answered "No"),
  - Free-text input corruption in CGPA (`🤷‍♂️`, `Nill`, `No`) and study hours (`3 hrs`, `3-4 `, `2-3`),
  - 63 unstandardized degree variations across 162 rows,
  - An ordinal scale mismatch for Academic Pressure (text rather than numeric),
  - A character encoding divergence for Sleep Duration (Unicode en-dash vs ASCII hyphen).

---

## 2. DATASET A (PUBLIC BENCHMARK) QUALITY AUDIT

### 2.1 File Characteristics & Integrity
- **Filepath:** `dataset/Student_Depression_Dataset.csv`
- **File Size:** 2,987,175 bytes (~2.85 MB)
- **SHA-256 Checksum:** `a3e159e246789be5a61dcc7b4290fbc238f0140f3d95727585af50a61fd35404`
- **Dimensions:** 27,901 rows $\times$ 18 columns
- **Duplicate Rows:**
  - With `id` column included: **0** duplicate rows ($0.0\%$).
  - With `id` column excluded: **0** duplicate rows ($0.0\%$).

### 2.2 Missing Value Profile
| Column Name | Data Type | Null Count | Null % | Status |
| :--- | :--- | :--- | :--- | :--- |
| `id` | int64 | 0 | 0.00% | Complete |
| `Gender` | object | 0 | 0.00% | Complete |
| `Age` | float64 | 0 | 0.00% | Complete |
| `City` | object | 0 | 0.00% | Complete |
| `Profession` | object | 0 | 0.00% | Complete |
| `Academic Pressure` | float64 | 0 | 0.00% | Complete |
| `Work Pressure` | float64 | 0 | 0.00% | Complete |
| `CGPA` | float64 | 0 | 0.00% | Complete |
| `Study Satisfaction` | float64 | 0 | 0.00% | Complete |
| `Job Satisfaction` | float64 | 0 | 0.00% | Complete |
| `Sleep Duration` | object | 0 | 0.00% | Complete |
| `Dietary Habits` | object | 0 | 0.00% | Complete |
| `Degree` | object | 0 | 0.00% | Complete |
| `Have you ever had suicidal thoughts ?` | object | 0 | 0.00% | Complete |
| `Work/Study Hours` | float64 | 0 | 0.00% | Complete |
| `Financial Stress` | float64 | 3 | 0.0108% | 3 Missing Values |
| `Family History of Mental Illness` | object | 0 | 0.00% | Complete |
| `Depression` | int64 | 0 | 0.00% | Complete (Target) |

### 2.3 Target Variable Distribution (`Depression`)
- **Negative Class (`0`):** 11,565 respondents ($41.45\%$)
- **Positive Class (`1`):** 16,336 respondents ($58.55\%$)
- **Imbalance Ratio:** 1 : 1.41
- **Epidemiological Assessment:** A depression prevalence of $58.55\%$ is roughly double the typical baseline for university student populations in validated clinical screening studies (typically $18\% - 32\%$). This indicates that Dataset A cannot be treated as representative of the general university population without calibration.

### 2.4 Numerical Feature Statistics (Production Pipeline Features)
All statistics calculated on complete records ($N=27,901$, except `Financial Stress` $N=27,898$):

| Feature | Mean | Std | Median | IQR | Min | Max | Skew | Kurtosis | IQR Outliers | Z > 3 Outliers |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Age` | 25.8223 | 4.9057 | 25.00 | 9.00 | 18.0 | 59.0 | 0.9575 | 0.7719 | 179 | 179 |
| `Academic Pressure` | 3.1417 | 1.4011 | 3.00 | 2.00 | 0.0 | 5.0 | -0.2289 | -1.0268 | 9 | 0 |
| `CGPA` | 7.6561 | 1.4707 | 7.77 | 2.63 | 0.0 | 10.0 | -0.4907 | 0.1607 | 9 | 9 |
| `Study Satisfaction` | 3.0232 | 1.3444 | 3.00 | 2.00 | 0.0 | 5.0 | -0.1039 | -0.9996 | 10 | 0 |
| `Work/Study Hours` | 7.1570 | 3.7076 | 8.00 | 6.00 | 0.0 | 12.0 | -0.2859 | -1.1610 | 0 | 0 |
| `Financial Stress` | 3.3248 | 1.4285 | 3.00 | 2.00 | 1.0 | 5.0 | -0.3204 | -1.1571 | 0 | 0 |

### 2.5 Multicollinearity & Variance Inflation Factor (VIF)
A linear regression VIF test was executed on all numerical features in the production pipeline:
- `Age`: $\text{VIF} = 1.0135$
- `Academic Pressure`: $\text{VIF} = 1.0463$
- `CGPA`: $\text{VIF} = 1.0028$
- `Study Satisfaction`: $\text{VIF} = 1.0177$
- `Work/Study Hours`: $\text{VIF} = 1.0142$
- `Financial Stress`: $\text{VIF} = 1.0371$

**Interpretation:** In real-world educational and psychological data, academic pressure, study satisfaction, and financial stress typically exhibit moderate inter-correlation ($r \approx 0.3 - 0.5$). In Dataset A, the VIF values are all nearly exactly $1.00 - 1.04$, indicating that features vary almost completely independently of one another. This statistical orthogonalization is a classic signature of synthetic data generators (e.g., CTGAN or Gaussian Copulas) that model univariate marginal distributions effectively while attenuating real-world latent covariance.

### 2.6 Correlation with Target Variable
| Feature | Pearson $r$ | Spearman $\rho$ | Statistical Association Description |
| :--- | :--- | :--- | :--- |
| `Academic Pressure` | +0.4748 | +0.4724 | Strong positive predictor of Depression = 1 |
| `Financial Stress` | +0.3636 | +0.3628 | Moderate positive predictor of Depression = 1 |
| `Age` | -0.2264 | -0.2253 | Moderate negative predictor (younger respondents higher) |
| `Work/Study Hours` | +0.2086 | +0.2007 | Moderate positive predictor |
| `Study Satisfaction` | -0.1680 | -0.1682 | Weak-to-moderate negative predictor |
| `CGPA` | +0.0222 | +0.0218 | Near-zero linear or monotonic relationship |

### 2.7 Excluded Columns Quality & Safety Audit
Seven columns from Dataset A were deliberately excluded from Mindora's production machine-learning model:
1. `id`: Sequential unique integer identifier (1 to 27,901). No predictive validity; purely administrative.
2. `City`: 440 unique cities. High cardinality, strong geographic sample concentration in specific Indian Tier-1 and Tier-2 cities (e.g., Kalyan, Hyderabad, Bangalore). Using City would introduce geographic bias.
3. `Profession`: 27,870 rows are `Student`. However, **31 rows** correspond to non-students (e.g., Architect: 8, Teacher: 6, Digital Marketer: 3, Chef: 2, Doctor: 2). This demonstrates data cleaning contamination in the benchmark dataset.
4. `Work Pressure` & `Job Satisfaction`: For students ($N=27,870$), `Work Pressure` is $0.0$ in $99.99\%$ of rows (27,867 rows), and `Job Satisfaction` is $0.0$ in $99.98\%$ of rows (27,862 rows). These are degenerate zero-variance fields for students.
5. `Have you ever had suicidal thoughts ?`:
   - Distribution: Yes = 17,656 ($63.28\%$), No = 10,245 ($36.72\%$).
   - Leakage / Association: When Yes, $79.05\%$ have Depression = 1. When No, $76.78\%$ have Depression = 0.
   - **Clinical Safety Rationale for Exclusion:** Including suicidal ideation as a feature in a depression prediction score causes severe clinical hazard. It risks leaking the target, producing false negatives for non-suicidal depressed students, and inappropriately conflating wellness screening with crisis response. Mindora handles suicidal ideation exclusively through the deterministic, zero-tolerance PHQ-9 Item 9 protocol.
6. `Family History of Mental Illness`: Yes = 13,503 ($48.40\%$), No = 14,398 ($51.60\%$). Depression rate is $61.27\%$ for Yes vs $56.00\%$ for No. Excluded to prevent biological fatalism in lifestyle recommendations.

### 2.8 Synthetic Artifact & Anomaly Analysis
- **Benford's Law Analysis:** First-digit distributions for `Age` ($\chi^2 = 50,657.27$), `CGPA` ($\chi^2 = 72,877.02$), and `Work/Study Hours` ($\chi^2 = 7,093.09$) deviate massively from Benford's distribution ($p < 0.0001$). While bounded variables naturally deviate from Benford's Law, `CGPA` and `Age` show unnatural clustering at uniform intervals.
- **Impossible Zeroes:**
  - 9 respondents have `CGPA = 0.00` despite active degree enrollment and non-zero study satisfaction.
  - 9 respondents have `Academic Pressure = 0.0` and 10 respondents have `Study Satisfaction = 0.0` (on what is otherwise a 1-to-5 scale).

---

## 3. DATASET B (COLLECTED RESPONSES) QUALITY AUDIT

### 3.1 File Characteristics & Integrity
- **Filepath:** `ml_lab/data/raw/STUDENT dataset.xlsx`
- **File Size:** 19,502 bytes (~19.0 KB)
- **SHA-256 Checksum:** `a040665638e5d7a433c171b1f703061f571da50e2f1f2c55c3f0c37fa57c7e09`
- **Workbook Structure:** Single worksheet named `'Form Responses 1'`
- **Dimensions:** 162 rows $\times$ 14 columns
- **Timestamp Coverage:** Single day capture (`2026-11-14 19:47:43` to `2026-11-14 20:49:15`)
- **Missing Values:** **0** null cells across all 14 columns (form fields were mandatory).
- **Duplicate Rows:** **0** duplicate rows across all features.

### 3.2 Exact Question Text and Data Types
| Index | Exact Column Header in Sheet | Data Type | Non-Null Count | Domain / Values |
| :---: | :--- | :--- | :--- | :--- |
| 0 | `Timestamp` | datetime64[us] | 162 | Survey submission time |
| 1 | `Are you 18 years of age or older?` | object (str) | 162 | `'Yes'` (148), `'No'` (14) |
| 2 | `Are you currently enrolled in an educational institution or formal educational programme?` | object (str) | 162 | `'yes'` (138), `'no'` (24) |
| 3 | `What is your age?` | int64 | 162 | Range: 13 to 69 |
| 4 | ` What is your gender?` *(leading space)* | object (str) | 162 | Female (90), Male (63), Prefer not to say (9) |
| 5 | `How would you describe your usual dietary habits?` | object (str) | 162 | Moderate (86), Healthy (37), Unhealthy (29), Prefer not to say (10) |
| 6 | `What degree or educational programme are you currently pursuing?` | object (str) | 162 | 63 free-text strings |
| 7 | `What is your current CGPA on a 10-point scale?` | object | 162 | 159 numeric floats, 3 non-numeric strings |
| 8 | `How much academic pressure do you currently experience?` | object (str) | 162 | moderate (80), low (26), very high (21), very low (20), high (15) |
| 9 | `How satisfied are you with your current studies?` | int64 | 162 | Discrete scale 1 to 5 |
| 10 | `On average, how many hours do you sleep per night?` | object (str) | 162 | 5–6 hours (76), 7–8 hours (42), >8 hours (23), <5 hours (21) |
| 11 | `On an average day, how many total hours do you spend studying or working?( in numbers)` | object | 162 | 159 numeric, 3 non-numeric strings |
| 12 | `How much financial stress do you currently experience?` | int64 | 162 | Discrete scale 1 to 5 |
| 13 | `Has a qualified healthcare professional ever told you that you have depression` | object (str) | 162 | `'no'` (98), `'yes'` (45), `'not sure'` (19) |

### 3.3 Target Variable Distribution
- **Exact Question:** *"Has a qualified healthcare professional ever told you that you have depression"*
- **`no`:** 98 respondents ($60.49\%$)
- **`yes`:** 45 respondents ($27.78\%$)
- **`not sure`:** 19 respondents ($11.73\%$)
- **Critical Evaluation:** This question measures **lifetime clinical diagnosis history**, not current depressive symptoms. The presence of $11.73\%$ "not sure" respondents highlights the ambiguity of self-reported medical history in student populations without clinical record verification.

### 3.4 Deep Audit of Known Anomalies in Dataset B

#### Anomaly 1: Minor Respondents ($< 18$ Years) & Severe Contradictions
- By numeric entry (`What is your age?`): **17 respondents** ($10.49\%$) are minors ($< 18$ years old).
  - Breakdown: Age 13 = 1, Age 16 = 1, Age 17 = 15.
- By question 1 (`Are you 18 years of age or older?`): **14 respondents** answered "No".
- **Internal Cross-Tabulation Discrepancy:**
  - Among respondents with numeric Age $< 18$ ($N=17$), **14 answered "Yes"** to being 18 or older, and only 3 answered "No".
  - Among respondents with numeric Age $\ge 18$ ($N=145$), **11 answered "No"** to being 18 or older, and 134 answered "Yes".
  - **Audit Verdict:** Total of **25 respondents** ($15.43\%$) have direct internal contradictions between their entered age and their self-reported adult status. This indicates survey fatigue, rapid clicking, lack of comprehension, or deliberate misinformation.

#### Anomaly 2: Non-Student Respondents
- **Question:** *"Are you currently enrolled in an educational institution or formal educational programme?"*
- **`no`:** **24 respondents** ($14.81\%$).
- **`yes`:** **138 respondents** ($85.19\%$).
- **Audit Verdict:** 24 respondents are not students. Training a student depression prediction model on non-students invalidates the target domain.

#### Anomaly 3: Age Distribution Extremes
- Min: 13, Max: 69, Mean: 20.09, Median: 19.0, Std: 4.63.
- Older Outliers: 4 respondents aged $> 25$:
  - Age 26 (1 respondent)
  - Age 27 (1 respondent)
  - Age 39 (1 respondent)
  - Age 69 (1 respondent — likely invalid test submission or senior citizen)

#### Anomaly 4: Free-Text Dirty Formats in CGPA
3 respondents ($1.85\%$) submitted non-numeric text strings:
- Value 1: `'Nill'`
- Value 2: `'🤷‍♂️'` (shrug emoji Unicode sequence `\U0001F937\U0000200D\U00002642\U0000FE0F`)
- Value 3: `'No'`
The remaining 159 respondents submitted valid decimal floats (Mean: 7.64, Median: 7.77, Min: 3.0, Max: 9.8).

#### Anomaly 5: Free-Text Dirty Formats in Study/Work Hours
3 respondents ($1.85\%$) submitted non-numeric text strings:
- Value 1: `'3 hrs'`
- Value 2: `'3-4 '`
- Value 3: `'2-3'`
The remaining 159 respondents submitted numeric values (Mean: 5.86, Median: 5.5, Min: 1.0, Max: 15.0).

#### Anomaly 6: Degree Column Fragmentation
- **Total Unique Strings:** 63 unique entries across 162 respondents.
- **Normalized Unique Strings (trimmed):** 58 unique entries.
- Examples of fragmented casing and spelling:
  - B.E / B.E. / B.E EC / BE (total 29)
  - Btech / B.tech / B.Tech / BTech / BTECH / B tech / BTech CSE Aiml (total 46)
  - BBA / Bba (total 15)
  - B.com / Bcom / BCOM (total 15)
  - BCA / Bca (total 9)
  - B.Des (4), Llb (3), BA Psychology (2), MBBS (1), Architecture (1), Bsc (1), etc.

---

## 4. COMPARATIVE DATASET SUMMARY MATRIX

| Dimension | Dataset A (Public Benchmark) | Dataset B (Collected Responses) | Quality Impact / Risk |
| :--- | :--- | :--- | :--- |
| **Row Count ($N$)** | 27,901 | 162 | Severe sample size disparity (172 : 1) |
| **Integrity Hash** | `a3e159e2...` | `a0406656...` | Verified distinct byte-streams |
| **Missing Values** | 3 values in `Financial Stress` | 0 values | Both high completeness |
| **Minors ($< 18$)** | 0 minors (range 18–59) | 17 minors ($10.49\%$, min 13) | Legal risk under DPDP Act Sec 9 |
| **Non-Students** | 31 rows ($0.11\%$) | 24 respondents ($14.81\%$) | Domain contamination in Dataset B |
| **Target Variable** | Binary `Depression` (0/1) | Clinical diagnosis (`no`/`yes`/`not sure`) | Incompatible construct definitions |
| **Target Prevalence** | $58.55\%$ positive | $27.78\%$ positive ($31.87\%$ if binary) | Extreme label distribution shift |
| **CGPA Format** | Clean float 0.0–10.0 | Dirty object (emoji, text) | Requires sanitization pipeline |
| **Academic Pressure** | Numeric float 0.0–5.0 | Ordinal strings (low to very high) | Requires re-mapping |
| **Sleep Duration** | ASCII hyphen (`5-6 hours`) | Unicode en-dash (`5–6 hours`) | String match failure without unicode normalization |
| **Dietary Habits** | 4 classes (incl. `Others`) | 4 classes (incl. `Prefer not to say`) | Category vocabulary mismatch |
| **Gender** | Male / Female | Male / Female / Prefer not to say | Category vocabulary mismatch |
| **Internal Validity** | High consistency, low VIF | 25 internal contradictions | Reliability concern in Dataset B |

---

## 5. DATASET AUDIT CONCLUSION

1. **Dataset A** is a large, synthetic/augmented benchmark dataset. It provides high statistical stability and smooth gradients for testing machine learning pipelines, but suffers from artificial orthogonality (near-zero VIF) and an uncalibrated depression base rate ($58.55\%$).
2. **Dataset B** provides real-world human student signals, but is currently **unusable for supervised machine learning training** due to its small size ($N=162$), high minor ratio ($10.49\%$), non-student presence ($14.81\%$), data entry contradictions ($15.43\%$), and divergent target construct.
3. Both datasets must be kept separate. Merging them is methodologically and clinically invalid.
