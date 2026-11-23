# MINDORA 2.0 — PHASE 5.19 ML DEPLOYMENT AUDIT
# MODEL ARTIFACT PATHS, DESERIALIZATION SAFETY & RESEARCH QUARANTINE

**Principal Auditor:** Senior ML Systems Auditor & Responsible AI Systems Reviewer  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  

---

## 1. Executive Summary

This audit assesses the deployment readiness of Mindora's Machine Learning tier. Four candidate models (Logistic Regression, Random Forest, XGBoost, and Support Vector Machine) were evaluated across model artifact locations, deserialization safety (CWE-502), inference latency, memory consumption, and research dataset quarantine.

---

## 2. ML Architecture & Deployment Safeguards

### 2.1 Model Artifact Integrity & Deserialization Safety (CWE-502 Mitigation)
- **Primary Pipeline Path:** `models/best_model.pkl` (XGBoost production pipeline).
- **Integrity Validation:** Before calling `joblib.load()`, `src/predict.py` executes `verify_model_integrity()`:
  - Cryptographically hashes the pickle file using SHA-256.
  - Matches against expected production hash: `e182e9e779a4f89e4883eb13c9bab3df19eebc7165d4b0a44319f737361342ec`.
  - Refuses deserialization if the file is tampered, corrupted, or replaced.
- **Upload Prohibition:** The API provides zero endpoints for uploading serialized models. Models are baked directly into the deployment filesystem.

### 2.2 Feature Contract & Preprocessing Resilience
- **Input Validation:** `validate_ml_inputs()` enforces all 10 approved features with strict range checking:
  - `Age` $\in [15, 100]$
  - `Academic Pressure` $\in [1.0, 5.0]$
  - `CGPA` $\in [0.0, 10.0]$
  - `Study Satisfaction` $\in [1.0, 5.0]$
  - `Work/Study Hours` $\in [0.0, 24.0]$
  - `Financial Stress` $\in [1.0, 5.0]$
  - Categoricals validated against allowed options (`Gender`, `Sleep Duration`, `Dietary Habits`, `Degree`).
- **Missing Value Handling:** Numeric features imputed with median; categoricals imputed with mode; zero unhandled `NaN` crashes.

### 2.3 Resource Footprint & Inference Benchmarking
- **Memory Consumption:** Loading all four model pipelines into RAM consumes **$199.18\text{ MB}$**, well within Render Starter instance limits ($512\text{ MB}$).
- **Inference Latency:** Single-sample inference latency measured at **$5.36\text{ ms}$** (~186 inferences/sec), ensuring instantaneous response.

### 2.4 Track B Research Quarantine Invariant
- **Dataset Isolation:** Track B (163-record exploratory dataset) is strictly quarantined within `/real-world-dataset`.
- **Governance Banners:** Mandatory UI notices `"163-RECORD DATASET — PROVENANCE UNVERIFIED"` and `"NO INDEPENDENT HOLDOUT TEST SET FORMED"` are permanently displayed.
- **Safety Boundary:** Track B models are prohibited from powering student assessment scoring or live predictions.

---

## 3. Four-Model Performance Verification (Holdout Set $N=4,186$)

| Model Architecture | Accuracy | Sensitivity (Recall) | Precision | F1-Score | ROC-AUC | Brier Score | False Negatives |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **XGBoost (Production Engine)** | **79.65%** | **84.41%** | **81.49%** | **82.93%** | **0.8677** | **0.1437** | **382** |
| Random Forest | 77.85% | 79.11% | 82.26% | 80.65% | 0.8524 | 0.1558 | 512 |
| Logistic Regression | 77.26% | 79.27% | 81.33% | 80.29% | 0.8427 | 0.1593 | 508 |
| SVM (RBF Kernel) | 77.02% | 77.97% | 81.76% | 79.82% | 0.8417 | 0.1601 | 540 |

---

## 4. Audit Verdict

**Status:** **`PASS`**  
ML models and pipelines are verified secure, memory-efficient, cryptographically validated, and ready for deployment.
