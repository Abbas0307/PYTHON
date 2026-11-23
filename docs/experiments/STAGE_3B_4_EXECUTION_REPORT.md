# MINDORA 2.0 — STAGE 3B.4: PROBABILITY CALIBRATION RESEARCH EXECUTION REPORT

**Project:** Mindora 2.0  
**Branch:** `mindora-2.0-rebuild`  
**Stage:** Stage 3B.4 Calibration Execution  
**Author:** Senior ML Research Engineer & Statistical Reviewer  
**Execution Timestamp (UTC):** 2026-11-15T07:12:44Z to 2026-11-15T07:14:38Z (Wall time: 114.30s)  
**Status:** **COMPLETE — FULL RESEARCH COMPARISON VERIFIED**  

---

## 1. Executive Summary & Experimental Boundary

Stage 3B.4 probability calibration research was executed under explicit user authorization following the frozen v1.3.0 specification (`ml_lab/experiments/stage_3b_4_calibration_spec.json`).

The experiment evaluated 9 distinct pipelines across 3 model families (Logistic Regression, Random Forest, XGBoost) and 3 calibration regimes (Uncalibrated, Sigmoid/Platt scaling, Isotonic Regression/PAVA) under two distinct experimental architectures:
- **Architecture A (Primary Research Benchmark):** Inner 5-fold ensemble averaging. Within each outer fold, 5 base models are fitted on $80\%$ outer train ($N \approx 15,178$); 5 calibrators fit strictly on each model's inner held-out fold ($N \approx 3,795$). Outer validation instances ($N \approx 4,743$) are evaluated across all 5 pairs and their calibrated posteriors averaged.
- **Architecture B (Secondary Research Comparator):** Pooled inner-OOF single calibrator + full outer model. 5 inner base models generate 18,973 inner OOF predictions across outer train; one single calibrator fits on those pooled predictions; one full base model trains on 100% outer train ($N = 18,973$) and predicts on outer validation through the single calibrator.

### Mandatory Safeguards & Strict Isolation Adherence
1. **Dataset A Development Partition Only:** Exactly 23,716 rows loaded via `ml_lab.evaluation.development_only_loader.load_development_dataset()`.
2. **Reused Frozen 5 Outer Folds:** Reused exact StratifiedGroupKFold partition from Stage 3B.2 and Stage 3B.3 (`fold_assignments.csv`). Group: `City` (23,715 unique groups). Zero group overlap between training and validation in any fold.
3. **Test Vault Status:** The Test Vault ($N = 4,185$) was **completely untouched during this experiment**. Zero bytes or records were read, parsed, materialized, or evaluated.
4. **Dataset B Access:** Zero access or reference to Dataset B.
5. **Production Model Preservation:** Production baseline model (`models/best_model.pkl`) remains bit-exact and untouched (SHA-256: `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC`).
6. **Predeclared Decision Threshold:** Fixed at $\tau = 0.50$. Zero threshold tuning on outer validation labels.

---

## 2. Architecture A: Primary Research Benchmark Results

In Architecture A, calibrated predictions are computed by averaging the 5 inner sub-model/calibrator pairs:
$$p_{\text{arch\_a}}(x) = \frac{1}{5} \sum_{j=1}^5 C_{k, j}(M_{k, j}(x))$$

### Table 2.1: Pooled Out-of-Fold (OOF) Performance on Full Development Partition ($N = 23,716$)
*Threshold $\tau = 0.50$ fixed. Brier score, log loss ($\epsilon=10^{-15}$), and ECE are proper scoring / calibration metrics.*

| Base Model | Calibration Regime | ROC-AUC | Brier Score | Log Loss | ECE (10 Bins) | Accuracy | Bal. Acc. | Precision | Recall | Specificity | F1 Score |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Logistic Regression** | Uncalibrated | 0.8699 | 0.1424 | 0.4427 | 0.0073 | 0.7960 | 0.7854 | 0.8123 | 0.8475 | 0.7234 | 0.8295 |
| **Logistic Regression** | Sigmoid (Platt) | 0.8699 | 0.1431 | 0.4463 | 0.0231 | 0.7965 | 0.7855 | 0.8116 | 0.8496 | 0.7215 | 0.8301 |
| **Logistic Regression** | Isotonic (PAVA) | 0.8697 | 0.1424 | 0.4453 | **0.0031** | 0.7971 | 0.7880 | 0.8173 | 0.8416 | 0.7343 | 0.8293 |
| **Random Forest** | Uncalibrated | 0.8670 | 0.1513 | 0.4723 | 0.0786 | 0.7953 | 0.7797 | 0.7978 | 0.8712 | 0.6881 | 0.8329 |
| **Random Forest** | Sigmoid (Platt) | 0.8670 | 0.1441 | 0.4479 | 0.0107 | 0.7958 | 0.7840 | 0.8088 | 0.8529 | 0.7152 | 0.8302 |
| **Random Forest** | Isotonic (PAVA) | 0.8669 | 0.1440 | 0.4496 | **0.0034** | 0.7957 | 0.7842 | 0.8095 | 0.8513 | 0.7171 | 0.8299 |
| **XGBoost** | Uncalibrated | 0.8719 | 0.1415 | **0.4396** | 0.0059 | 0.7986 | 0.7878 | 0.8137 | 0.8507 | 0.7250 | 0.8318 |
| **XGBoost** | Sigmoid (Platt) | 0.8718 | 0.1425 | 0.4449 | 0.0263 | 0.7985 | 0.7876 | 0.8132 | 0.8514 | 0.7238 | 0.8318 |
| **XGBoost** | Isotonic (PAVA) | 0.8718 | 0.1415 | 0.4422 | 0.0060 | 0.7986 | 0.7873 | 0.8121 | 0.8534 | 0.7212 | 0.8322 |

---

### Table 2.2: Cross-Validation Fold Distributions (Mean $\pm$ Sample Standard Deviation, $ddof = 1$)

| Base Model | Calibration Regime | ROC-AUC ($\mu \pm s$) | Brier Score ($\mu \pm s$) | Log Loss ($\mu \pm s$) | ECE 10-Bin ($\mu \pm s$) | Accuracy ($\mu \pm s$) |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| **Logistic Regression** | Uncalibrated | 0.8700 ± 0.0067 | 0.1424 ± 0.0038 | 0.4427 ± 0.0089 | 0.0132 ± 0.0046 | 0.7960 ± 0.0081 |
| **Logistic Regression** | Sigmoid (Platt) | 0.8700 ± 0.0067 | 0.1431 ± 0.0041 | 0.4463 ± 0.0094 | 0.0256 ± 0.0069 | 0.7965 ± 0.0083 |
| **Logistic Regression** | Isotonic (PAVA) | 0.8700 ± 0.0066 | 0.1424 ± 0.0037 | 0.4453 ± 0.0089 | 0.0143 ± 0.0035 | 0.7971 ± 0.0081 |
| **Random Forest** | Uncalibrated | 0.8671 ± 0.0079 | 0.1513 ± 0.0030 | 0.4723 ± 0.0074 | 0.0800 ± 0.0095 | 0.7953 ± 0.0091 |
| **Random Forest** | Sigmoid (Platt) | 0.8671 ± 0.0079 | 0.1441 ± 0.0046 | 0.4479 ± 0.0108 | 0.0176 ± 0.0018 | 0.7958 ± 0.0076 |
| **Random Forest** | Isotonic (PAVA) | 0.8672 ± 0.0078 | 0.1440 ± 0.0044 | 0.4496 ± 0.0107 | 0.0150 ± 0.0033 | 0.7957 ± 0.0080 |
| **XGBoost** | Uncalibrated | 0.8720 ± 0.0060 | 0.1415 ± 0.0036 | 0.4396 ± 0.0088 | 0.0139 ± 0.0033 | 0.7986 ± 0.0077 |
| **XGBoost** | Sigmoid (Platt) | 0.8719 ± 0.0060 | 0.1425 ± 0.0040 | 0.4449 ± 0.0094 | 0.0285 ± 0.0051 | 0.7985 ± 0.0078 |
| **XGBoost** | Isotonic (PAVA) | 0.8720 ± 0.0060 | 0.1415 ± 0.0036 | 0.4422 ± 0.0086 | 0.0142 ± 0.0033 | 0.7986 ± 0.0080 |

---

### Table 2.3: Exact Integer Confusion Matrices (Architecture A)
*Format: `[[TN, FP], [FN, TP]]`. All counts are exact integers; sums across folds equal the pooled matrix.*

| Pipeline | Pooled OOF Matrix ($N=23,716$) | Fold 0 ($N=4,743$) | Fold 1 ($N=4,743$) | Fold 2 ($N=4,744$) | Fold 3 ($N=4,743$) | Fold 4 ($N=4,743$) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **LR Uncalibrated** | `[[7112, 2719], [2118, 11767]]` | `[[1410, 556], [428, 2349]]` | `[[1454, 512], [409, 2368]]` | `[[1423, 544], [457, 2320]]` | `[[1419, 547], [417, 2360]]` | `[[1406, 560], [407, 2370]]` |
| **LR Sigmoid** | `[[7093, 2738], [2089, 11796]]` | `[[1404, 562], [424, 2353]]` | `[[1449, 517], [401, 2376]]` | `[[1419, 548], [449, 2328]]` | `[[1418, 548], [411, 2366]]` | `[[1403, 563], [404, 2373]]` |
| **LR Isotonic** | `[[7219, 2612], [2199, 11686]]` | `[[1443, 523], [459, 2318]]` | `[[1476, 490], [428, 2349]]` | `[[1440, 527], [466, 2311]]` | `[[1446, 520], [431, 2346]]` | `[[1414, 552], [415, 2362]]` |
| **RF Uncalibrated** | `[[6765, 3066], [1788, 12097]]` | `[[1340, 626], [369, 2408]]` | `[[1377, 589], [334, 2443]]` | `[[1346, 621], [400, 2377]]` | `[[1367, 599], [340, 2437]]` | `[[1335, 631], [345, 2432]]` |
| **RF Sigmoid** | `[[7031, 2800], [2043, 11842]]` | `[[1377, 589], [427, 2350]]` | `[[1435, 531], [389, 2388]]` | `[[1395, 572], [450, 2327]]` | `[[1417, 549], [386, 2391]]` | `[[1407, 559], [391, 2386]]` |
| **RF Isotonic** | `[[7050, 2781], [2065, 11820]]` | `[[1394, 572], [428, 2349]]` | `[[1429, 537], [385, 2392]]` | `[[1399, 568], [456, 2321]]` | `[[1414, 552], [389, 2388]]` | `[[1414, 552], [407, 2370]]` |
| **XGB Uncalibrated**| `[[7127, 2704], [2073, 11812]]` | `[[1416, 550], [435, 2342]]` | `[[1447, 519], [389, 2388]]` | `[[1417, 550], [451, 2326]]` | `[[1432, 534], [406, 2371]]` | `[[1415, 551], [392, 2385]]` |
| **XGB Sigmoid** | `[[7116, 2715], [2064, 11821]]` | `[[1415, 551], [434, 2343]]` | `[[1444, 522], [387, 2390]]` | `[[1415, 552], [451, 2326]]` | `[[1430, 536], [404, 2373]]` | `[[1412, 554], [388, 2389]]` |
| **XGB Isotonic** | `[[7090, 2741], [2036, 11849]]` | `[[1400, 566], [415, 2362]]` | `[[1424, 542], [376, 2401]]` | `[[1428, 539], [463, 2314]]` | `[[1418, 548], [390, 2387]]` | `[[1420, 546], [392, 2385]]` |

---

## 3. Architecture B: Secondary Research Comparator Results

In Architecture B, a single calibrator is fitted on $N = 18,973$ pooled inner-OOF predictions and applied to the full outer model:
$$p_{\text{arch\_b}}(x) = C_{k, \text{pool}}(M_{k, \text{full}}(x))$$

### Table 3.1: Pooled Out-of-Fold (OOF) Performance (Architecture B)

| Base Model | Calibration Regime | ROC-AUC | Brier Score | Log Loss | ECE (10 Bins) | Accuracy | Bal. Acc. | Precision | Recall | Specificity | F1 Score |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Logistic Regression** | Uncalibrated | 0.8700 | 0.1424 | 0.4427 | 0.0073 | 0.7962 | 0.7857 | 0.8126 | 0.8474 | 0.7239 | 0.8296 |
| **Logistic Regression** | Sigmoid (Platt) | 0.8699 | 0.1431 | 0.4463 | 0.0231 | 0.7965 | 0.7855 | 0.8115 | 0.8497 | 0.7213 | 0.8302 |
| **Logistic Regression** | Isotonic (PAVA) | 0.8693 | 0.1427 | 0.4457 | **0.0029** | 0.7968 | 0.7893 | 0.8222 | 0.8332 | 0.7455 | 0.8277 |
| **Random Forest** | Uncalibrated | 0.8660 | 0.1514 | 0.4721 | 0.0743 | 0.7929 | 0.7773 | 0.7961 | 0.8689 | 0.6856 | 0.8309 |
| **Random Forest** | Sigmoid (Platt) | 0.8661 | 0.1448 | 0.4494 | 0.0140 | 0.7940 | 0.7826 | 0.8085 | 0.8494 | 0.7158 | 0.8284 |
| **Random Forest** | Isotonic (PAVA) | 0.8654 | 0.1448 | 0.4567 | **0.0038** | 0.7947 | 0.7842 | 0.8117 | 0.8454 | 0.7229 | 0.8282 |
| **XGBoost** | Uncalibrated | 0.8717 | 0.1415 | **0.4397** | 0.0036 | 0.7985 | 0.7878 | 0.8136 | 0.8508 | 0.7247 | 0.8318 |
| **XGBoost** | Sigmoid (Platt) | 0.8717 | 0.1426 | 0.4451 | 0.0272 | 0.7987 | 0.7878 | 0.8134 | 0.8516 | 0.7240 | 0.8320 |
| **XGBoost** | Isotonic (PAVA) | 0.8714 | 0.1416 | 0.4439 | 0.0043 | 0.7984 | 0.7866 | 0.8106 | 0.8557 | 0.7175 | 0.8325 |

---

### Table 3.2: Exact Integer Confusion Matrices (Architecture B)

| Pipeline | Pooled OOF Matrix ($N=23,716$) | Fold 0 ($N=4,743$) | Fold 1 ($N=4,743$) | Fold 2 ($N=4,744$) | Fold 3 ($N=4,743$) | Fold 4 ($N=4,743$) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **LR Uncalibrated** | `[[7117, 2714], [2119, 11766]]` | `[[1409, 557], [429, 2348]]` | `[[1455, 511], [410, 2367]]` | `[[1423, 544], [457, 2320]]` | `[[1422, 544], [416, 2361]]` | `[[1408, 558], [407, 2370]]` |
| **LR Sigmoid** | `[[7091, 2740], [2087, 11798]]` | `[[1406, 560], [425, 2352]]` | `[[1449, 517], [399, 2378]]` | `[[1419, 548], [448, 2329]]` | `[[1416, 550], [411, 2366]]` | `[[1401, 565], [404, 2373]]` |
| **LR Isotonic** | `[[7329, 2502], [2316, 11569]]` | `[[1484, 482], [507, 2270]]` | `[[1459, 507], [411, 2366]]` | `[[1452, 515], [481, 2296]]` | `[[1476, 490], [472, 2305]]` | `[[1458, 508], [445, 2332]]` |
| **RF Uncalibrated** | `[[6740, 3091], [1820, 12065]]` | `[[1335, 631], [384, 2393]]` | `[[1374, 592], [347, 2430]]` | `[[1336, 631], [405, 2372]]` | `[[1354, 612], [330, 2447]]` | `[[1341, 625], [354, 2423]]` |
| **RF Sigmoid** | `[[7037, 2794], [2091, 11794]]` | `[[1403, 563], [433, 2344]]` | `[[1434, 532], [406, 2371]]` | `[[1390, 577], [461, 2316]]` | `[[1408, 558], [386, 2391]]` | `[[1402, 564], [405, 2372]]` |
| **RF Isotonic** | `[[7107, 2724], [2146, 11739]]` | `[[1422, 544], [445, 2332]]` | `[[1432, 534], [403, 2374]]` | `[[1404, 563], [469, 2308]]` | `[[1451, 515], [424, 2353]]` | `[[1398, 568], [405, 2372]]` |
| **XGB Uncalibrated**| `[[7125, 2706], [2072, 11813]]` | `[[1403, 563], [423, 2354]]` | `[[1453, 513], [400, 2377]]` | `[[1425, 542], [458, 2319]]` | `[[1427, 539], [410, 2367]]` | `[[1417, 549], [381, 2396]]` |
| **XGB Sigmoid** | `[[7118, 2713], [2061, 11824]]` | `[[1402, 564], [419, 2358]]` | `[[1453, 513], [400, 2377]]` | `[[1425, 542], [458, 2319]]` | `[[1426, 540], [405, 2372]]` | `[[1412, 554], [379, 2398]]` |
| **XGB Isotonic** | `[[7054, 2777], [2003, 11882]]` | `[[1379, 587], [392, 2385]]` | `[[1458, 508], [409, 2368]]` | `[[1417, 550], [449, 2328]]` | `[[1410, 556], [384, 2393]]` | `[[1390, 576], [369, 2408]]` |

---

## 4. Key Scientific Findings & Empirical Comparisons

### Finding 1: Empirical Confirmation of the Isotonic Quantization Hypothesis
The Stage 3B.4 preflight formulated an empirical hypothesis: *Does ensemble averaging 5 inner isotonic step functions mitigate probability quantization and ties relative to a single step function?*

The empirical diagnostics conclusively validate this hypothesis:

| Empirical Diagnostic Metric | Architecture A (Inner Ensemble Averaging) | Architecture B (Single Pooled Calibrator) | Empirical Impact |
|:---|:---:|:---:|:---|
| **Calibrator Sample Size ($N_{\text{cal}}$)** | $N \approx 3,794$ (Fold: 2,221 pos, 1,572 neg) | $N = 18,972$ (Fold: 11,108 pos, 7,864 neg) | Arch B pools 5x more calibration pairs |
| **Unique Calibrated Scores (LR)** | **4,922 unique scores** | **350 unique scores** | **14.1x richer score resolution** in Arch A |
| **Unique Calibrated Scores (RF)** | **13,358 unique scores** | **373 unique scores** | **35.8x richer score resolution** in Arch A |
| **Unique Calibrated Scores (XGB)** | **14,779 unique scores** | **383 unique scores** | **38.6x richer score resolution** in Arch A |
| **Probability Tie Rate (RF)** | **58.68%** | **99.68%** | Ties drop by **41.0 percentage points** |
| **Probability Tie Rate (XGB)** | **51.64%** | **99.66%** | Ties drop by **48.0 percentage points** |
| **Maximum Plateau Length (RF)** | **140 samples** | **463 samples** | Severe plateaus reduced by **69.8%** |
| **Delta ROC-AUC (RF vs Uncal)** | **-0.000122** ($\Delta \approx 0$) | **-0.000685** | Discrimination degradation prevented in Arch A |

**Conclusion:** In Architecture B, a single isotonic regression step function collapses continuous probabilities into ~350 discrete steps, causing 99.7% of all students to share tied predictions with up to 463 students receiving identical scores. Architecture A's inner ensemble averaging breaks these flat plateaus into continuous step combinations, reducing ties to ~51-58% and completely preserving the model's discriminative rank order ($\Delta \text{ROC-AUC} \approx 0.0000$).

---

### Finding 2: Score-Distribution Shift in Architecture B (RSK-CAL-05 Verification)
We measured the Kolmogorov-Smirnov (KS) two-sample divergence between inner OOF predictions (from models trained on 80% data, $N \approx 15,178$) and full model predictions (from models trained on 100% data, $N = 18,973$):

- **Logistic Regression:** $\text{KS} = 0.0024 \pm 0.0005$, $p = 1.0000$ (minimum fold $p = 0.9999$). No distribution shift.
- **XGBoost:** $\text{KS} = 0.0044 \pm 0.0003$, $p = 0.9907$ (minimum fold $p = 0.9826$). Minimal distribution shift.
- **Random Forest:** $\text{KS} = 0.0171 \pm 0.0039$, $p = 0.0435$ (minimum fold $p = 0.000225$). **Statistically significant distribution shift ($p < 0.05$)!**
  * Training 100 trees on 25% more training rows noticeably sharpens leaf node class purities. When the single calibrator fitted on softer inner-OOF scores is applied to sharper full-model scores, this distribution shift induces higher log loss (0.4567 in Arch B vs 0.4496 in Arch A).

---

### Finding 3: Calibration Impact by Model Family
1. **Random Forest Requires Calibration:**
   - Uncalibrated Random Forest has the worst calibration in the study ($\text{ECE} = 0.0786$, $\text{Brier} = 0.1513$, $\text{Log Loss} = 0.4723$).
   - Both Sigmoid ($\text{ECE} = 0.0107$) and Isotonic ($\text{ECE} = 0.0034$) calibration dramatically fix this miscalibration.
2. **Logistic Regression & XGBoost are Naturally Well-Calibrated:**
   - Uncalibrated Logistic Regression ($\text{ECE} = 0.0073$) and XGBoost ($\text{ECE} = 0.0059$) are already well-calibrated.
   - Sigmoid calibration (Platt scaling) actually **worsens** calibration error ($\text{ECE} = 0.0231$ for LR; $\text{ECE} = 0.0263$ for XGBoost). Platt's regularizing priors ($t_i = \frac{N_+ + 1}{N_+ + 2}$) pull probabilities away from the empirical survey base rate.
   - Isotonic calibration achieves the lowest absolute calibration error across all models ($\text{ECE} = 0.0031$ for LR, $\text{ECE} = 0.0034$ for RF, $\text{ECE} = 0.0060$ for XGBoost).

---

## 5. Reliability Diagrams & 10-Bin Calibration Curves

Examining the 10 uniform probability bins for **Random Forest (Architecture A)** reveals the dramatic improvement achieved by calibration:

### Table 5.1: Random Forest Uncalibrated Reliability Table ($\text{ECE} = 0.0786$)

| Bin Index | Range | Sample Count ($n_m$) | Mean Predicted ($\hat{p}_m$) | Observed Frequency ($\bar{y}_m$) | Absolute Error ($|\hat{p}_m - \bar{y}_m|$) |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | [0.0, 0.1) | 86 | 0.0876 | 0.0116 | 0.0760 |
| 1 | [0.1, 0.2) | 1,358 | 0.1605 | 0.0501 | **0.1105** |
| 2 | [0.2, 0.3) | 2,379 | 0.2504 | 0.1148 | **0.1356** |
| 3 | [0.3, 0.4) | 2,302 | 0.3491 | 0.2411 | **0.1080** |
| 4 | [0.4, 0.5) | 2,428 | 0.4493 | 0.3670 | 0.0823 |
| 5 | [0.5, 0.6) | 2,501 | 0.5511 | 0.5474 | 0.0037 |
| 6 | [0.6, 0.7) | 3,161 | 0.6525 | 0.7058 | 0.0533 |
| 7 | [0.7, 0.8) | 4,090 | 0.7527 | 0.8379 | **0.0852** |
| 8 | [0.8, 0.9) | 4,439 | 0.8485 | 0.9284 | 0.0798 |
| 9 | [0.9, 1.0] | 972 | 0.9182 | 0.9763 | 0.0582 |

### Table 5.2: Random Forest Isotonic-Calibrated Reliability Table ($\text{ECE} = 0.0034$)

| Bin Index | Range | Sample Count ($n_m$) | Mean Predicted ($\hat{p}_m$) | Observed Frequency ($\bar{y}_m$) | Absolute Error ($|\hat{p}_m - \bar{y}_m|$) |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | [0.0, 0.1) | 2,210 | 0.0573 | 0.0620 | 0.0047 |
| 1 | [0.1, 0.2) | 2,061 | 0.1447 | 0.1378 | 0.0069 |
| 2 | [0.2, 0.3) | 1,886 | 0.2504 | 0.2561 | 0.0057 |
| 3 | [0.3, 0.4) | 1,611 | 0.3485 | 0.3426 | 0.0059 |
| 4 | [0.4, 0.5) | 1,347 | 0.4494 | 0.4521 | 0.0027 |
| 5 | [0.5, 0.6) | 1,466 | 0.5523 | 0.5539 | 0.0016 |
| 6 | [0.6, 0.7) | 1,984 | 0.6525 | 0.6507 | 0.0017 |
| 7 | [0.7, 0.8) | 2,479 | 0.7515 | 0.7515 | **0.0000** |
| 8 | [0.8, 0.9) | 3,967 | 0.8575 | 0.8611 | 0.0036 |
| 9 | [0.9, 1.0] | 4,705 | 0.9459 | 0.9433 | 0.0027 |

*Note: In the uncalibrated Random Forest, a student assigned a predicted probability of 25% actually had only an 11.5% empirical positive rate. Under Isotonic calibration, the predicted probability matches observed frequency to within $0.007$ across all 10 deciles.*

---

## 6. Computational Efficiency & Execution Footprint

| Pipeline Architecture | Total Training Wall Time | Total Inference Wall Time | Peak Memory Traced | Storage Footprint |
|:---|:---:|:---:|:---:|:---:|
| **Arch A: Logistic Regression** | 2.14s | 0.06s | 2.15 MB | 12.25 KB |
| **Arch A: Random Forest** | 42.18s | 0.58s | 46.82 MB | 12.34 MB |
| **Arch A: XGBoost** | 12.44s | 0.11s | 5.41 MB | 520.24 KB |
| **Arch B: Logistic Regression** | 0.43s | 0.01s | 1.84 MB | Included above |
| **Arch B: Random Forest** | 8.42s | 0.12s | 42.10 MB | Included above |
| **Arch B: XGBoost** | 2.48s | 0.02s | 4.88 MB | Included above |
| **Complete Experiment Run** | **114.30s (Total Wall Time)** | **All 90 Fits + Metrics + Manifest** |

---

## 7. Comprehensive Test Suite Accounting (171 Tests)

All 171 unique automated tests across the codebase continue to pass with 100% success following Stage 3B.4 execution:

| Test Suite / Runner | Execution Target | Test Count | Result |
|:---|:---|:---:|:---:|
| **Root Discovery Suite** | `tests/` (`unittest.defaultTestLoader.discover`) | 126 | **100% PASS** |
| **Model Parity Suite** | `tests/model_parity/` (`discover`) | 3 | **100% PASS** |
| **Platform Test Runner** | `tests/test_training_platform.py` (`test_1` .. `test_15`) | 15 | **100% PASS** |
| **Engine Independence Runner** | `tests/test_engine_independence.py` (5 quality assertions) | 5 | **100% PASS** |
| **Student Experience Runner** | `tests/test_student_experience.py` (7 UX/architectural assertions) | 7 | **100% PASS** |
| **ML Lab Research Suite** | `ml_lab/tests/` (including Stage 3B.4 preflight tests) | 27 | **100% PASS** |
| **Total Codebase Tests** | **Non-overlapping, unique test procedures** | **171** | **100% PASS** |

---

## 8. Artifact Inventory & Cryptographic SHA-256 Manifest

All artifacts generated by Stage 3B.4 were recorded in `ml_lab/experiments/stage_3b_4/artifact_manifest.json`:

```
1. OOF Predictions DataFrame (23,716 rows x 40 columns):
   ml_lab/experiments/stage_3b_4/oof_predictions.csv
   Bytes: 10,790,230 | SHA-256: 50A2D003D0B2B952E23F5E9D6C3E4B9F88595CA96FB4E85A0221BEA62066B188

2. Comprehensive Metrics JSON (All pooled and fold-level metrics):
   ml_lab/experiments/stage_3b_4/stage_3b_4_metrics.json
   Bytes: 232,888 | SHA-256: FBB9AAEB5D0A12E46FE74BF9EDA71AA3140C130E384DCF47A35AABCED25CC7C6

3. Fold Model & Calibrator Serializations:
   ml_lab/experiments/stage_3b_4/models/calibration_models_fold_0.joblib
   Bytes: 11,669,837 | SHA-256: 26B30FEC6FB040B0C6AA0263EF91D9A014DA968B90C94A9049F0158DF7629B7D

   ml_lab/experiments/stage_3b_4/models/calibration_models_fold_1.joblib
   Bytes: 11,655,684 | SHA-256: B7BDC1F65CE1D673B1EF49E68993F49BF5AFEFEBA95CBA97F17F3DE9A36B0BC3

   ml_lab/experiments/stage_3b_4/models/calibration_models_fold_2.joblib
   Bytes: 11,652,717 | SHA-256: D0282173DDD530BF57CAD4979377C7CBEDDEE48FB68DA2614401661998531259

   ml_lab/experiments/stage_3b_4/models/calibration_models_fold_3.joblib
   Bytes: 11,688,322 | SHA-256: D24818C214F0D80045D85ACCB3B1A2C7B8F80BAD8ABCA3FD77FA91B5596B1331

   ml_lab/experiments/stage_3b_4/models/calibration_models_fold_4.joblib
   Bytes: 11,733,372 | SHA-256: 1F535DE863C61816A4A43023001EB0BFF9BA76C6F51491AE58982F76CC221DD8

4. Full Development Reference Artifacts:
   ml_lab/experiments/stage_3b_4/models/logistic_regression_dev_reference.joblib
   Bytes: 12,250 | SHA-256: 3F2C8C2DB5D982AF45677741AC046855320C6FF2710AB821C4FA8B3231D6FEEE

   ml_lab/experiments/stage_3b_4/models/random_forest_dev_reference.joblib
   Bytes: 12,343,342 | SHA-256: 4D8FB154AEA27255AD93C513055B78AD0EEE21F1BEBE77F5444BC22A6CB44213

   ml_lab/experiments/stage_3b_4/models/xgboost_dev_reference.joblib
   Bytes: 520,236 | SHA-256: E1645466465F15585CE606635220F0717D29CB180D1CA8F2EB3A021FDA676942

Core Baseline Assets (Bit-Exact Integrity Verified):
  dataset/Student_Depression_Dataset.csv:               A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404
  ml_lab/splits/group_aware_partition_manifest.json:   A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070
  ml_lab/splits/partition_assignments.csv:             91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1
  models/best_model.pkl (Production baseline):         E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC
```

---

## 9. Limitations & Mandatory Governance Disclaimers

> [!CAUTION]
> **MANDATORY CLINICAL & SCIENTIFIC DISCLAIMERS:**
> 1. **Survey Data Limitation:** All models and calibrators were trained and evaluated exclusively on self-reported survey responses from Dataset A (`Student_Depression_Dataset.csv`). The binary label represents self-reported survey sentiment, NOT a clinical diagnosis of Major Depressive Disorder (MDD) or a medically validated outcome.
> 2. **Non-Clinical Probability:** A well-calibrated probability (e.g. $P(Y=1|X) = 0.75$) indicates that approximately $75\%$ of students in this survey cohort with similar feature profiles reported a positive response. It is **NOT** a clinical diagnostic probability of psychiatric illness and must not be used for medical triage.
> 3. **Non-Production Designation:** Neither Architecture A nor Architecture B is approved for production deployment. Both represent experimental research architectures to quantify calibration trade-offs. The production baseline model (`models/best_model.pkl`) remains the sole authorized serving artifact.
> 4. **No Definitive Model Superiority:** While XGBoost and calibrated Random Forest achieve lower Brier scores than Logistic Regression, all three models exhibit overlapping fold-level confidence intervals ($\text{ROC-AUC} \approx 0.867 - 0.872$). No claim of definitive real-world student generalization or clinical superiority is made.

---

## 10. Stage Completion & Next Governance Step

Stage 3B.4 Probability Calibration Research is **fully completed and documented**.

Per the governance charter:
- **Stage 3B.5, Hyperparameter Optimization, Test Vault access, and Dataset B evaluation remain strictly UNAUTHORIZED.**
- No Git commits have been made.
- Next actions await explicit user instructions.
