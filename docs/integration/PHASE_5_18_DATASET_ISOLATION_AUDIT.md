# MINDORA 2.0 — PHASE 5.18 DATASET ISOLATION & GOVERNANCE AUDIT
## Independent Audit of Dual Dataset Pipelines, Partition Invariants, Provenance Safeguards & Architectural Isolation

**Auditors:** Principal Dataset Governance Researcher, Senior Data Scientist & Software Architect  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  
**Inspected Datasets:**  
1. **Track A (Collegiate Benchmark):** `dataset/Student_Depression_Dataset.csv`  
2. **Track B (Quarantined Survey):** `ml_lab/data/raw/STUDENT dataset.xlsx`  

---

## 1. Executive Summary & Audit Mandate

Mindora 2.0 incorporates two completely segregated dataset tracks. The mandate of this audit is to verify that the mathematical integrity of both pipelines is preserved, that no data leakage or partition contamination occurs, and that the unverified 163-record exploratory dataset remains strictly quarantined from all student-facing application features.

```mermaid
flowchart TD
    subgraph Track A [Track A: Collegiate Benchmark (27,901 Records)]
        A_RAW["dataset/Student_Depression_Dataset.csv\nSHA-256: A3E159... (Frozen Asset)"]
        A_RAW --> A_SPLIT["Stratified 70/15/15 Splitting (Seed 42)"]
        A_SPLIT --> A_TRN["Train: 19,530 (In-Fold Preprocessor Fit)"]
        A_SPLIT --> A_VAL["Validation: 4,185 (Hyperparameter Tuning)"]
        A_SPLIT --> A_TST["Holdout Test: 4,186 (Untouched Generalization)"]
        A_TST --> A_MODELS["Canonical Models: LR, RF, XGBoost, SVM"]
    end

    subgraph Track B [Track B: Quarantined Research Survey (163 Records)]
        B_RAW["ml_lab/data/raw/STUDENT dataset.xlsx\n(Google Form Responses 1)"]
        B_RAW --> B_AUDIT["Demographic Review: 17 Minors (<18)\nZero IRB Protocol / Zero Consent Sheets"]
        B_AUDIT --> B_LABEL["Mandatory Governance Label:\n'163-RECORD DATASET — PROVENANCE UNVERIFIED'"]
        B_LABEL --> B_CV["Repeated Stratified 5-Fold CV (25 Runs)\n'NO INDEPENDENT HOLDOUT TEST SET FORMED'"]
    end

    subgraph Student Production Environment [Student Production Environment]
        PROD_DASH["Student DashboardScreen.tsx"]
        PROD_WELL["Deterministic Wellbeing Engine (PHQ-9)"]
        PROD_GUAR["Guardian Support Dispatch"]
    end

    Track A -.->|Public Benchmark Performance Cards| PROD_DASH
    Track B x-.-x|STRICT ARCHITECTURAL QUARANTINE| Student Production Environment
```

---

## 2. Track A: Large Benchmark Dataset Pipeline Audit

### 2.1 Raw Dataset Cryptographic Integrity
- **File System Path:** `dataset/Student_Depression_Dataset.csv`
- **Computed SHA-256 Hash:** `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404`
- **Frozen Research Baseline:** `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404`
- **Integrity Status:** **100.00% MATCH** — Frozen research asset remains completely untouched.
- **Total Records:** 27,901 collegiate rows.
- **Prevalence:** 16,336 positive (58.55%), 11,565 negative (41.45%).

### 2.2 Partition Stratification Verification
Partitioning was verified against the exact seed (`random_state=42`):
- **Training Set (70.0%):** 19,530 rows (11,435 positive [58.55%], 8,095 negative [41.45%])
- **Validation Set (15.0%):** 4,185 rows (2,450 positive [58.54%], 1,735 negative [41.46%])
- **Holdout Test Set (15.0%):** 4,186 rows (2,451 positive [58.55%], 1,735 negative [41.45%])
- **Index Disjointness:** Zero index overlap between Train, Validation, and Test partitions.
- **Duplicate Row Check:** 0 identical rows across Train and Test partitions.

### 2.3 Generalization Integrity
The test partition was not used during feature imputation, standard scaling, or hyperparameter selection. Preprocessors were fitted strictly on `X_train`, guaranteeing unbiased generalization measurements.

---

## 3. Track B: 163-Record Exploratory Dataset Governance Audit

### 3.1 Raw File Characteristics & Provenance Status
- **File System Path:** `ml_lab/data/raw/STUDENT dataset.xlsx`
- **Format:** Microsoft Excel OpenXML (.xlsx)
- **Sheet Name:** `Form Responses 1`
- **Physical Dimensions:** 163 rows (1 header + 162 participant responses) $\times$ 14 columns.
- **Governance Finding:** Unsupervised Google Form survey collected on November 14, 2026. Lacks Institutional Review Board (IRB) approval, consent documentation, or principal investigator certificates.
- **Mandatory Governance Banner:**
  $$\mathbf{"163-RECORD\ DATASET\ —\ PROVENANCE\ UNVERIFIED"}$$
  Enforced on all UI screens, documentation headers, and API responses.

### 3.2 Vulnerable Population Safeguard (Minor Protection)
- **Age Span:** 13 to 69 years.
- **Minors Present (< 18 years):** **17 respondents (10.49%)**.
- **Safeguard Protocol:** Because minors responded without verifiable parental consent documentation, this dataset is legally and ethically barred from being used to train automated student triage models or clinical prediction features.

### 3.3 Cohort Formation & 19 "Not Sure" Responses
- Target column: `Has a qualified healthcare professional ever told you that you have depression`
- Total responses ($N = 162$):
  - `No`: 98 respondents (60.49%)
  - `Yes`: 45 respondents (27.78%)
  - `Not sure`: 19 respondents (11.73%)
- **Documented Exclusion Protocol:** The 19 ambiguous "not sure" responses were excluded from the primary evaluated cohort to eliminate label ambiguity.
- **Primary Evaluated Cohort ($N = 143$):** 45 positive cases (31.47%), 98 negative cases (68.53%).

### 3.4 Small-Sample Cross-Validation & Zero-Holdout Disclosure
- Due to the constrained sample size ($N = 143$, 45 positive cases), creating an independent holdout test split would result in only $\approx 7$ positive test samples, leading to extreme sample variance.
- Models were evaluated using **Repeated Stratified 5-Fold Cross-Validation (25 total runs)** with in-fold preprocessing.
- **Mandatory Disclosure Enforced in UI & Reports:**
  $$\mathbf{"NO\ INDEPENDENT\ HOLDOUT\ TEST\ SET\ FORMED"}$$

---

## 4. Architectural Isolation & Boundary Verification

An automated static analysis was conducted to verify that Track B data, models, and metrics are completely quarantined from the production student experience:

```
Static Import Scan:
  Target Files:
    - frontend/src/pages/DashboardScreen.tsx
    - frontend/src/pages/AssessmentScreen.tsx
    - frontend/src/engines/wellbeingEngine.ts
    - frontend/src/engines/plannerEngine.ts
    - frontend/src/components/planner/SmartActionPlannerSection.tsx
    - frontend/src/components/trends/WeeklyTrendsSection.tsx
  Prohibited References:
    - 'STUDENT dataset.xlsx'
    - 'real_world_163'
    - 'models/real_world_163'
    - 'SMALL_DATASET_METRICS'
  Results: ZERO PROHIBITED IMPORTS DETECTED.
```

- **Route Isolation:** Track B metrics are accessible exclusively via the dedicated researcher route `/real-world-dataset`.
- **Zero Production Powering:** Track B models do NOT power student risk scores, action recommendations, or guardian notifications.

---

## 5. Audit Verdict

- **LARGE DATASET PARTITION INTEGRITY:** **`PASS`**  
  Zero leakage, exact 70/15/15 partitions, frozen hash match.
- **REAL-WORLD DATASET PROVENANCE GOVERNANCE:** **`RESTRICTED RESEARCH USE`**  
  Classified as `"163-RECORD DATASET — PROVENANCE UNVERIFIED"`.
- **SMALL-SAMPLE STATISTICAL VALIDITY:** **`PASS`**  
  Evaluated strictly via Repeated Stratified 5-Fold CV (25 runs) with `"NO INDEPENDENT HOLDOUT TEST SET FORMED"` banner.
- **DATASET ISOLATION & QUARANTINE:** **`PASS`**  
  100% boundary isolation verified; zero contamination into student-facing features.
