# MINDORA 2.0 — STAGE 3B.1: ENVIRONMENT & HARDWARE INTEGRITY REPORT

**Document Ref:** `docs/experiments/STAGE_3B_1_ENVIRONMENT_REPORT.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Stage:** Stage 3B.1 Controlled Experiment Initialization & Environment Baseline  
**Status:** Approved & Verified — **Final Test Vault Formally Governance-Locked**  

---

## 1. OBJECTIVE & EXECUTION BOUNDARY

This report documents the baseline computational environment, dependency versions, hardware capabilities, and cryptographic file digests verified prior to generating the Stage 3B group-aware partition manifest.

In accordance with the Stage 3B.1 mandate:
- **Authorized Scope:** Environment inspection, hardware audit, cryptographic hash verification, and partition manifest generation.
- **Strict Prohibitions Enforced:** Zero model training, zero estimator fitting, zero calibration, zero hyperparameter optimization, zero benchmarking, zero ONNX conversion, and zero evaluation on the governance-locked Test Vault.

---

## 2. PYTHON ENVIRONMENT & DEPENDENCY VERSIONS

The execution environment was audited using the dedicated project virtual environment (`D:\Depression calculator\.venv`):

```
┌───────────────────────────────────────┬─────────────────────────────────────────────────────────┐
│ Environment Component                 │ Audited Value / Specification                           │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ Python Version                        │ 3.12.10 (tags/v3.12.10:0cc8128, Apr  8 2025, 12:21:36)  │
│ Architecture                          │ AMD64 (64-bit Windows)                                  │
│ Operating System Platform             │ Windows 11 (10.0.26300-SP0)                             │
│ Python Executable Path                │ D:\Depression calculator\.venv\Scripts\python.exe       │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ scikit-learn                          │ 1.9.1                                                   │
│ xgboost                               │ 3.4.1                                                   │
│ numpy                                 │ 2.5.4                                                   │
│ pandas                                │ 3.1.1                                                   │
│ joblib                                │ 1.6.0                                                   │
│ torch                                 │ Not installed (tabular CPU execution only)              │
│ streamlit                             │ 1.42.0                                                  │
└───────────────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 3. HARDWARE & COMPUTE RESOURCES

### 3.1 CPU Architecture & Core Availability
- **Logical CPU Cores:** 16 logical cores visible to `os.cpu_count()`.
- **Memory Footprint:** 16 GB Total Physical RAM ($16,478,072 \text{ KB}$ visible, $\sim 2.8 \text{ GB}$ currently free).
- **Tabular Data Footprint in Memory:** Dataset A ($27,901 \text{ rows} \times 18 \text{ columns}$) requires $\sim 3.84 \text{ MB}$ raw, and $\sim 10.04 \text{ MB}$ one-hot encoded. The host memory provides over $200\times$ headroom.

### 3.2 NVIDIA GPU Hardware & CUDA Status
- **GPU Accelerator:** NVIDIA GeForce RTX 4050 Laptop GPU (Device 0).
- **Dedicated Video Memory (VRAM):** $6,141 \text{ MiB}$ total ($8 \text{ MiB}$ actively used, $> 6,100 \text{ MiB}$ free).
- **Display Driver Version:** 591.74.
- **CUDA API Version Supported:** CUDA 13.1.
- **Active Processes on GPU:** Windows Desktop Window Manager (`WDDM`) and Microsoft Edge Webview background tasks.
- **Execution Architecture Mandate:**
  * While CUDA 13.1 is available on the hardware, **all Stage 3B tabular model training and validation will be executed exclusively on the 16 CPU cores**.
  * Rationale: GPU training introduces CUDA context initialization latency ($\sim 1.5 - 2.0 \text{ seconds}$) that exceeds total CPU execution time on a 28k-row dataset, while risking VRAM contention with active Streamlit and webview UI sessions.

---

## 4. CRYPTOGRAPHIC FILE HASH VERIFICATION

Before generating any partition, cryptographic SHA-256 digests were computed on all foundational data and production model artifacts:

```
┌───────────────────────────────────────┬──────────────────────────────────────────────────────────────────┬──────────────┐
│ File Path                             │ Audited SHA-256 Cryptographic Digest                             │ Status       │
├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼──────────────┤
│ dataset/Student_Depression_Dataset.csv│ A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404│ Bit-Exact OK │
│ models/best_model.pkl                 │ E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC│ Bit-Exact OK │
│ ml_lab/data/raw/STUDENT dataset.xlsx  │ Strictly Quarantined (Dataset B)                                 │ UNTOUCHED    │
└───────────────────────────────────────┴──────────────────────────────────────────────────────────────────┴──────────────┘
```

- **Production Model Protection:** `models/best_model.pkl` is verified identical to its Day 3 baseline and remains strictly read-only.
- **Dataset B Quarantined:** `ml_lab/data/raw/STUDENT dataset.xlsx` was not opened, read, parsed, or processed.

---

## 5. TEST SUITE VERIFICATION BASELINE

The project test suite was executed to establish the pre-partition baseline:
- **Discovered Unit Tests (`tests/` + `tests/model_parity/`):** **129 tests** passing (`0` errors, `0` failures).
- **Standalone Functional Assertion Checks:** **27 checks** passing (`test_engine_independence.py` [5], `test_student_experience.py` [7], `test_training_platform.py` [15]).
- **Grand Total Verified Test Checks:** **156 checks passing (100% OK)**.

---

## 6. GIT WORKING-TREE STATUS & PRESERVATION

- **Active Branch:** `mindora-2.0-rebuild`.
- **Preserved Modified Files:**
  * `docs/DAY_12_DATA_RETENTION_MATRIX.md`
  * `experiments/registry.json`
  * `src/privacy_policy.py`
  * `tests/test_day12_privacy_architecture.py`
- **Preserved Untracked Directories:** `docs/architecture/`, `docs/data/`, `docs/experiments/`, `docs/operations/`, `docs/privacy/`, `docs/research/`, `ml_lab/`, `resources/`, `scripts/`, `shared/`, `tests/model_parity/`.
- **Zero Git Operations Executed:** No commit, reset, stash, clean, or checkout operations were performed.

---

**ENVIRONMENT SIGN-OFF:** The computational environment is certified deterministic, stable, and compliant with all Stage 3A protocols.
