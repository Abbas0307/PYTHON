# Mindora — Day 6.1: Security Verification & Audit Accuracy Dossier

**Author:** Senior Application Security Engineer  
**Project:** Mindora — Student Wellbeing Intelligence Platform  
**Directory:** `D:\Depression calculator`  
**Date:** 2026-11-14  
**Baseline Checkpoint:** `ce24bec`  
**Target Deliverable:** `docs/DAY_6_1_SECURITY_VERIFICATION.md`

---

## Executive Summary & Engineering Methodology

This Day 6.1 review verifies the defensive security controls implemented during Day 6, rectifies overbroad claims, tests boundary conditions, and hardens the CSV ingestion and HTML rendering pipelines.

In accordance with strict security engineering standards:
- **A passing test is evidence only for the exact property tested**, not proof of universal security.
- **Source-code absence of tracking code is distinguished from environment-level runtime guarantees.**
- **Package security is reported transparently without claiming automated CVE coverage when scanners are unavailable.**

---

## 1. Dependency Vulnerability Verification

### 1.1 Dependency Definition & Environment Inventory
Mindora specifies its direct dependencies in `requirements.txt`:
```
streamlit>=1.30.0
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
xgboost>=2.0.0
matplotlib>=3.7.0
plotly>=5.18.0
shap>=0.44.0
joblib>=1.3.0
requests>=2.31.0
```

The active virtual environment (`.venv`) contains the following exact installed package versions:
| Package | Installed Version | Role |
| :--- | :---: | :--- |
| `streamlit` | `1.67.0` | UI framework and web server runtime |
| `pandas` | `3.1.1` | Tabular data structures and profiling |
| `numpy` | `2.5.4` | Matrix computations and numerical operations |
| `scikit-learn` | `1.9.1` | Pipeline, imputation, scaling, calibration |
| `xgboost` | `3.4.1` | Gradient-boosted trees production model |
| `shap` | `0.54.1` | Local feature attribution (`TreeExplainer`) |
| `joblib` | `1.6.0` | Model artifact pipeline serialization |
| `plotly` | `7.1.0` | Interactive charts and reliability curves |
| `matplotlib` | `3.11.2` | Evaluation plotting |
| `requests` | `2.34.2` | HTTP client (unused by core assessment runtime) |
| `urllib3` | `2.8.0` | HTTP transport library |
| `jinja2` | `3.1.6` | Template rendering engine |

### 1.2 Vulnerability Scanner Availability
- Automated vulnerability scanning tools (`pip-audit`, `safety`, `bandit`) were queried in the local virtual environment:
  ```powershell
  .venv\Scripts\python.exe -m pip show pip-audit safety bandit
  # Output: WARNING: Package(s) not found: bandit, pip-audit, safety
  ```
- **Transparent Limitation:** Because no recognized automated CVE database scanner is currently installed in this environment, **a formal automated CVE audit was not performed**.
- **No Automatic Upgrades:** In accordance with instructions, zero packages were upgraded, ensuring zero breaking changes to XGBoost, Scikit-learn, or Streamlit runtime compatibility.

---

## 2. CSV Upload Safety & Resource Limits

### 2.1 Complete CSV Ingestion Flow
The ingestion pipeline was hardened in `src/data_platform/dataset_loader.py`:
```
Source Input (File Path / Uploaded Stream / Bytes)
   │
   ├─► 1. Extension Verification: safe_filename.lower().endswith(".csv")
   │
   ├─► 2. Stream Size Pre-Check: if hasattr(source, 'size') and source.size > max_size_bytes ──► Abort (0 bytes read into RAM)
   │
   ├─► 3. Chunked Streaming: Read in 64 KB buffers, abort immediately if cumulative bytes > max_size_bytes
   │
   ├─► 4. Header Pre-Parse Inspection: Count delimiters in line 1. If estimated columns > 500 ──► Abort (before pd.read_csv)
   │
   ├─► 5. Encoding Fallback Parsing: pd.read_csv(io.BytesIO, encoding in [utf-8, utf-8-sig, latin1])
   │
   ├─► 6. Post-Parse Dimension Caps: len(df.columns) <= 500, len(df) <= 1,000,000
   │
   └─► 7. Provenance SHA-256 Fingerprint computed from raw bytes
```

### 2.2 Enforced Upload Limits
- **Upload-Specific Limit (`MAX_UPLOAD_SIZE_BYTES`):** Explicitly set to **25 MB** (`25 * 1024 * 1024` bytes) for web browser uploads in `src/views/training_lab_view.py`.
- **Local File Limit (`MAX_DATASET_SIZE_BYTES`):** Set to **50 MB** (`50 * 1024 * 1024` bytes) for local file path references.
- **Maximum Column Count (`MAX_PERMITTED_COLUMNS`):** **500 columns**.
- **Maximum Row Count (`MAX_PERMITTED_ROWS`):** **1,000,000 rows**.

### 2.3 Automated Testing of Hostile Fixtures
Verified in `tests/test_security_privacy.py`:
1. **Oversized Stream (`test_14`):** An upload stream with `.size = 50 MB` is rejected immediately without calling `.read()`, consuming zero buffer memory.
2. **Unusually Wide CSV Dimension Bomb (`test_15`):** A CSV header with 550 columns is caught during line-1 delimiter inspection and rejected before pandas allocates column series.
3. **Empty File (`test_11`):** A 0-byte buffer is rejected with `DatasetIngestionError`.
4. **Hostile Binary File Extension (`test_10`):** Files with non-CSV extensions (`.exe`, `.txt`) are rejected before parsing.
5. **Execution Safety:** The CSV loader operates strictly through `pd.read_csv()`; uploaded contents are never evaluated via `eval()`, `exec()`, or `pickle.load()`.

---

## 3. Exhaustive XSS & Unsafe HTML Review

### 3.1 Codebase Survey of `unsafe_allow_html=True`
Every occurrence of `unsafe_allow_html=True` across the project was audited:

| File | Line(s) | HTML Purpose | Dynamic Interpolations | Escaping Status |
| :--- | :---: | :--- | :--- | :---: |
| `app.py` | 41, 79, 125, 136, 158 | Theme CSS, sidebar header, crisis card, footer | Color constants only | **Safe (Static constants)** |
| `src/views/assessment.py` | 43, 46, 64, 202 | Page header, safety disclaimer, step bar | Static UI text and colors | **Safe (Static constants)** |
| `src/views/student_dashboard.py` | 26, 29, 32, 60, 104, 150, 160, 179 | Hero header, journey banner, cards, helplines | Static UI copy and colors | **Safe (Static copy)** |
| `src/views/onboarding.py` | 31, 51, 69, 98 | Onboarding guide cards, privacy cards | Static guidance text | **Safe (Static text)** |
| `src/views/progress_view.py` | 71, 84, 97, 140, 174, 180 | Milestone cards, habit badges, energy check-in | `energy_checkin`, `risk_tier`, `severity`, `clean_name` | **Hardened via `html.escape()`** |
| `src/views/wellness_planner.py` | 142, 165, 181, 208, 236 | Energy status card, habit lists, progress bars | `st.session_state.daily_energy_checkin` | **Hardened via `html.escape()`** |
| `src/views/training_lab_view.py` | 58, 73, 153, 398 | Lab notice, provenance card, baseline info | `p.name` (dataset file name) | **Hardened via `html.escape()`** |
| `src/views/insights.py` | 40, 49, 77, 124, 142, 176, 211, 267, 290, 312, 333, 358, 386 | Screening results, recommendation cards | `risk_tier`, `summary`, `title`, `desc`, `severity` | **Hardened via `html.escape()`** |
| `src/views/methodology_view.py` | 39, 119, 166, 204, 227, 243, 260, 276 | Benchmark report, architecture cards | `selection_rationale` | **Hardened via `html.escape()`** |

### 3.2 Regression Verification for User-Controlled Inputs
Automated tests in `tests/test_security_privacy.py` (`test_12`) verify that inputs containing `<script>` or `<img onerror=...>` tags are converted into harmless HTML character entities (`&lt;script&gt;`, `&lt;img ...`) before rendering.

---

## 4. Privacy, Tracking and Logging Verification

### 4.1 Source-Code Inspection Findings
A full recursive search across `src/` and `app.py` for logging and persistent storage showed:
- **Zero Database Connections:** No imports or calls to `sqlite3`, `sqlalchemy`, `psycopg2`, or any ORM.
- **Zero File Writes for Student Data:** The only file write operations in `src/` are confined to developer tools:
  - `src/training/experiment_registry.py`: updates `experiments/registry.json` during model retraining experiments.
  - `src/training/experiment.py`: writes candidate models to `experiments/models/`.
  - Student assessment flow has zero `open(..., 'w')`, `to_csv()`, or `pickle.dump()`.
- **Zero Application Telemetry:** No tracking libraries, analytics scripts, or remote beaconing exist in the code.

### 4.2 Runtime Verification vs Source Code Distinction
- **What is Verified:**
  - Automated tests (`test_03_zero_persistent_student_data_writes`) verify that executing an end-to-end assessment produces zero new files or logs in the workspace directory.
  - In-process socket interception (`test_offline_reliability.py`) verifies that Python attempts zero non-localhost outbound network connections during assessment runs.
- **What is NOT Verified / Limitations:**
  - **Streamlit Framework Server Logs:** The underlying Streamlit Tornado web server logs HTTP connection events (e.g. `GET /_stcore/health 200 OK`) to the console stdout/stderr. These contain network connection metadata (client IP, HTTP headers), though not assessment payload data.
  - **Browser Web Speech API:** Voice reflection uses `webkitSpeechRecognition`. On some platforms, Chromium routes voice audio to speech recognition servers. The feature is voluntary and falls back to text input.
  - **Local Memory Inspection:** Assessment data is held in server RAM during an active session; an attacker with physical or root access to the machine can inspect process memory.

---

## 5. Model Integrity & Anti-Tampering (CWE-502)

### 5.1 Verification Sequence
In `src/predict.py`:
```python
def get_pipeline(verify_integrity: bool = True):
    global _CACHED_PIPELINE
    if _CACHED_PIPELINE is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}.")
        if verify_integrity:
            verify_model_integrity(MODEL_PATH)
        _CACHED_PIPELINE = joblib.load(MODEL_PATH)
    return _CACHED_PIPELINE
```
Cryptographic SHA-256 verification occurs **strictly before** `joblib.load()` is reached.

### 5.2 Tampered Model Rejection Test
Verified via `test_16_tampered_model_never_unpickled` in `tests/test_security_privacy.py`:
- A tampered model file was provided to `get_pipeline()`.
- `verify_model_integrity()` raised `ValueError("Model artifact integrity check failed... Refusing to deserialize untrusted or tampered pickle file.")`.
- A mock on `joblib.load()` verified that **`joblib.load()` was never called**.

### 5.3 Production Model Hash Preservation
```powershell
Get-FileHash models/best_model.pkl -Algorithm SHA256
# SHA256: E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC
```
The production model artifact remains completely untouched and bit-exact with the original baseline.

---

## 6. Regression Test Results (77 Tests Total)

All 6 test suites were executed sequentially:

| Test Suite | Domain Covered | Tests | Result |
| :--- | :--- | :---: | :---: |
| `tests/test_end_to_end_validation.py` | Full Student Journey & Views | 25 | **PASS (100%)** |
| `tests/test_student_experience.py` | UI Theme, Fonts, Helplines | 7 | **PASS (100%)** |
| `tests/test_engine_independence.py` | Tri-Engine Statistical Independence | 5 | **PASS (100%)** |
| `tests/test_offline_reliability.py` | In-Process Socket Interception Guard | 9 | **PASS (100%)** |
| `tests/test_security_privacy.py` | Multi-Session Isolation, CWE-502, CWE-79, Upload Caps | 16 | **PASS (100%)** |
| `tests/test_training_platform.py` | MLOps Platform & Registry Governance | 15 | **PASS (100%)** |
| **GRAND TOTAL** | **Comprehensive Regression Gate** | **77** | **77 / 77 PASSED (100%)** |

---

## 7. Git Working-Tree & Commit Status

- **Status:** All Day 6.1 verifications, defensive enhancements, and regression tests completed.
- **Production Baseline Model:** Bit-exact SHA-256 (`E182E9E7...`).
- **Streamlit Health Check:** `http://localhost:8501/_stcore/health` returns `HTTP 200 OK`.
