# Mindora — Historical Test-Set Restrictions & External Validation Governance

## 1. Context & Scope
This document formally records the governance policy and scientific status regarding model evaluation datasets in Mindora.

## 2. Characterization of the Seed-42 Test Partition
The canonical test partition generated from `dataset/Student_Depression_Dataset.csv` using `random_seed=42` ($N_{\text{test}} = 4,186$ rows, representing 15% of the total 27,901 rows) has been evaluated and inspected repeatedly during exploratory model analysis, calibration verification, and baseline audits.

Consequently:
- **Historical Internal Partition**: It is classified strictly as a **historical internal evaluation partition**.
- **Not Untouched**: It must **never** be represented or described as an "untouched", "quarantined", or "blind" test partition in scientific or product documentation.
- **Not Independent External Validation**: It cannot be claimed as independent external validation, because it is drawn from the identical cross-sectional survey sample and collection distribution as the training data.
- **Strict Separation from Selection**: In accordance with Day 2.1 governance rules, results from this test set must **never** be used for model selection, hyperparameter tuning, feature engineering decisions, or candidate gating. Candidate qualification is strictly evaluated on the validation partition ($N_{\text{val}} = 4,185$).

## 3. Invalidity of In-Sample Reshuffling (e.g., Seed 101)
Reshuffling or re-splitting the same underlying dataset with a different random seed (e.g., `seed=101`) does **not** create an independent evaluation set:
- Overlap calculation demonstrates that **84.30%** (3,529 of 4,186 records) in a `seed=101` test split overlap directly with the `seed=42` development (training + validation) records.
- Models trained on `seed=42` have already learned representations or had hyperparameters tuned on those identical records.
- Re-splitting the same dataset is an internal cross-validation variation, not independent external validation.

## 4. Requirement for Future Independent External Validation
Genuine independent external validation requires:
1. An independently collected dataset gathered from an external institution, university, or healthcare registry.
2. A temporally or geographically distinct student population.
3. Completely separate data ingestion, collection instrument, and consent pipeline.

Such an external dataset is **currently unavailable** in this repository. All reported test metrics reflect internal out-of-sample holdout performance on the existing survey distribution.
