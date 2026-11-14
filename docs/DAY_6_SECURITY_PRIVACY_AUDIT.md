# Mindora — Day 6: Security, Privacy Engineering & Data Protection Audit

**Author:** Senior Application Security Engineer, Privacy Architect & Python Security Specialist  
**Project:** Mindora — Student Wellbeing Intelligence Platform  
**Directory:** `D:\Depression calculator`  
**Date:** 2026-11-14  
**Baseline Git Checkpoint:** `c71f7c4`  
**Target Deliverable:** `docs/DAY_6_SECURITY_PRIVACY_AUDIT.md`

---

## Executive Summary

Mindora is a student-first wellbeing intelligence platform. Because its assessment responses, PHQ-9 answers, and digital lifestyle habits are deeply sensitive personal health indicators, the platform's security and privacy posture must be engineered with defense-in-depth principles.

This Day 6 audit conducted a comprehensive threat analysis, session isolation review, input/file handling assessment, and dependency inspection. Low-risk, high-value defensive mitigations were implemented without modifying the production model, the 10-feature schema, or the three-engine independence.

All 61 baseline tests plus 13 newly implemented security and privacy regression tests (**74 tests total**) passed with a 100% success rate. The production model hash remains bit-exact (`E182E9E7...`).

---

## 1. Threat Model

The threat model evaluates Mindora's assets, threats, attack vectors, likelihood, impact, and mitigations across ten core operational domains.

| Asset / Component | Threat Description | Attack Scenario | Likelihood | Impact | Existing Mitigation | Hardened / Recommended Mitigation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Student Assessment Data** | Exposure of mental health responses (PHQ-9, habits) | Unauthenticated external observer intercepts data in transit or on disk | Low (Localhost) | High | Ephemeral memory storage; zero cloud database writes | Retain zero-disk persistence; enforce explicit session-scoped state |
| **2. Streamlit Session State** | Cross-session data leakage | Student B opens the browser app on a shared machine and views Student A's results | Moderate | High | Streamlit allocates distinct `st.session_state` per WebSocket connection | Provided visible, one-click manual session reset; automated test verifies isolation |
| **3. Session-State Lifecycle** | Unsafe session-state mutations | Reset button clears only UI flags while leaving assessment payloads in RAM | Low | Moderate | `session_utils.py` centralized reset helper | Hardened `reset_user_session_state` to wipe all user keys to safe empty defaults |
| **4. Assessment Inputs** | Malicious, out-of-range, or NaN/Inf inputs | User or script sends extreme floats, NaN, or 100k-character strings to crash inference | Moderate | Moderate | Numeric range checks in `validate_ml_inputs` | Added strict string length limits (max 100 chars for categorical, 5000 chars for notes) |
| **5. Model Artifact (`.pkl`)** | Local file tampering & Arbitrary Code Execution (CWE-502) | Attacker replaces `models/best_model.pkl` with a malicious pickle payload to execute shell commands | Low | Critical | File stored locally with read-only expectation | Implemented pre-deserialization SHA-256 cryptographic integrity verification |
| **6. Python Dependencies** | Known dependency vulnerabilities | Outdated third-party packages contain unpatched security CVEs | Low | Moderate | Dependencies pinned with lower bounds in `requirements.txt` | Audited installed 2025/2026 packages; disabled default Streamlit telemetry ping |
| **7. Error Handling** | Information disclosure via stack traces (CWE-209) | Exception during inference leaks internal server file paths and code lines to UI | Moderate | Low | Generic error messages in `assessment.py` | Sanitized error handling across all views to display clean notices without raw tracebacks |
| **8. System Logs** | Accidental logging of student responses | Application prints assessment inputs or PHQ-9 items to stdout / server log files | Low | High | No `logging` or `print()` calls in assessment execution path | Verified zero student data is written to log files; automated tests enforce zero disk writes |
| **9. Dataset Ingestion (Lab)** | Unsafe CSV upload, dimension bomb, or path traversal | Attacker uploads non-CSV binary (`.exe`), 100k-column CSV bomb, or traversals (`../../`) | Low (Internal) | Moderate | File size check (100 MB) in `load_local_csv` | Enforced strict `.csv` extension, basename path sanitization, and 500-column / 1M-row caps |
| **10. View Rendering** | Cross-Site Scripting (XSS / CWE-79) via HTML injection | Hostile habit name, dataset name, or check-in string injected into `unsafe_allow_html=True` | Moderate | Moderate | Markdown styling mostly static CSS | Wrapped all dynamic user-influenced strings in `html.escape()` across all view modules |

---

## 2. Session Isolation & Privacy Review

### 2.1 Streamlit Multi-Session Architecture
Streamlit allocates an independent session context (`ScriptRunContext`) and an isolated `st.session_state` dictionary for each connected browser client. 

### 2.2 Cross-Session Leakage Verification
We programmatically verified multi-session isolation in `tests/test_security_privacy.py`:
- **Session A:** Assessment submitted with risk probability 79%, habits committed (`sleep_winddown`, `wake_time`), milestone recorded, energy check-in set to `😊 Good Energy`.
- **Session B:** Fresh connection initialized with default session state.
- **Verification:** Session B exhibited `assessment_submitted == False`, `latest_results == None`, `completed_habits == set()`, and `session_progress == []`. Zero state leaked from Session A to Session B.

### 2.3 Reset Scoping
When Session A triggers `reset_user_session_state(preserve_navigation=True)`:
- All user-specific keys in Session A revert to safe defaults (`False`, `None`, `set()`, `[]`).
- Framework navigation (`current_page`) is preserved for seamless student experience.
- Session B's state remains 100% intact, demonstrating zero cross-session interference.

### 2.4 Data Persistence Audit
An inspection of file system operations during assessment execution confirmed that:
- Zero records are written to SQLite, flat files, browser localStorage, or server disk logs.
- Student responses and PHQ-9 answers exist exclusively within server process heap memory for the duration of the active WebSocket connection.

---

## 3. Security Findings & Defect Remediation

### Finding H-1: Pickle Deserialization Integrity Check (CWE-502)
- **Severity:** High
- **Vulnerability:** `src/predict.py` utilized `joblib.load(MODEL_PATH)` without verifying file integrity. In Python, unpickling an untrusted or tampered file allows arbitrary code execution.
- **Remediation:** Added `verify_model_integrity()` in `src/predict.py`. Before deserialization, the SHA-256 hash of `models/best_model.pkl` is computed and compared against the trusted baseline (`e182e9e7...`). If the file is modified or tampered with, execution immediately halts with a `ValueError`, refusing to deserialize untrusted bytecode.

### Finding M-1: HTML / XSS Injection via Dynamic View Interpolations (CWE-79)
- **Severity:** Medium
- **Vulnerability:** Views utilizing `st.markdown(..., unsafe_allow_html=True)` interpolated strings directly:
  - `src/views/training_lab_view.py`: Dataset name `{p.name}` inside `<h4>`.
  - `src/views/progress_view.py`: `{energy_checkin}`, `{entry['risk_tier']}`, `{entry['phq9_severity']}`, `{clean_name}`.
  - `src/views/wellness_planner.py`: `{st.session_state.daily_energy_checkin}`.
  A hostile string containing HTML tags (e.g. `<script>` or `<img onerror=...>`) could trigger DOM injection.
- **Remediation:** Imported Python's standard `html` library across all views and wrapped all dynamic interpolations with `html.escape()`.

### Finding M-2: Missing Extension & Dimension Safeguards on CSV Ingestion (CWE-20, CWE-400)
- **Severity:** Medium
- **Vulnerability:** `load_local_csv()` in `src/data_platform/dataset_loader.py` accepted any file path without validating the file extension, potentially attempting to parse arbitrary system binaries. Furthermore, an uploaded CSV with hundreds of thousands of columns could cause memory exhaustion (CSV dimension bomb).
- **Remediation:**
  1. Enforced strict `.csv` file extension check on both paths and uploaded file names.
  2. Applied `os.path.basename()` to sanitize file names against path traversal tokens.
  3. Enforced explicit structural bounds: maximum 500 columns (`MAX_PERMITTED_COLUMNS`) and maximum 1,000,000 rows (`MAX_PERMITTED_ROWS`).

### Finding L-1: Unbounded String Inputs in Assessment & Lifestyle Analytics (CWE-400)
- **Severity:** Low
- **Vulnerability:** Categorical strings (`Gender`, `Degree`, `Sleep Duration`, `Dietary Habits`) and `optional_notes` had no maximum length constraints, allowing potential memory exhaustion if megabyte-sized strings were submitted.
- **Remediation:** Enforced a 100-character upper bound on all categorical strings in `validate_ml_inputs()`, and a 5,000-character upper bound on `optional_notes` in `analyze_lifestyle_patterns()`.

### Finding L-2: Default Streamlit Telemetry Ping
- **Severity:** Low (Privacy)
- **Vulnerability:** Default Streamlit installations can attempt to send anonymous usage telemetry to remote analytics endpoints.
- **Remediation:** Created `.streamlit/config.toml` explicitly setting `gatherUsageStats = false`, `enableXsrfProtection = true`, and `enableCORS = false`.

---

## 4. Tests Performed (Phase 6)

A dedicated security test suite was authored in `tests/test_security_privacy.py` comprising 13 automated tests:

1. `test_01_two_independent_sessions_remain_isolated`: Confirms zero cross-session data leakage between two concurrent session states.
2. `test_02_session_reset_affects_only_target_session`: Confirms resetting Session A leaves Session B completely unaffected.
3. `test_03_zero_persistent_student_data_writes`: Confirms executing an assessment writes zero files to disk.
4. `test_04_ml_input_numeric_bounds_enforced`: Rejects out-of-range floats, negative hours, NaNs, and Infinities.
5. `test_05_ml_input_string_length_limits_enforced`: Rejects oversized categorical strings (> 100 chars).
6. `test_06_phq9_input_validation`: Rejects invalid question counts (!= 9), out-of-range scores (< 0 or > 3), and non-numeric inputs.
7. `test_07_lifestyle_input_validation`: Rejects out-of-bounds screen time, fatigue, sleep quality, and oversized notes (> 5000 chars).
8. `test_08_model_artifact_integrity_verification_success`: Confirms genuine production baseline passes cryptographic verification.
9. `test_09_tampered_model_artifact_rejected_before_deserialization`: Confirms tampered pickle files are rejected with `ValueError` before unpickling.
10. `test_10_csv_loader_enforces_csv_extension_and_blocks_traversal`: Confirms non-CSV files and hostile extensions are rejected.
11. `test_11_csv_loader_rejects_empty_and_oversized_files`: Confirms empty buffers (0 bytes) and dimension bombs (> 500 cols) are rejected.
12. `test_12_xss_characters_are_escaped_in_view_components`: Confirms `<script>` and `<img onerror=...>` strings are sanitized via `html.escape()`.
13. `test_13_error_messages_suppress_stack_traces`: Confirms student assessment exceptions display clean notices without leaking stack traces.

---

## 5. Dependency & Configuration Security Audit

### 5.1 Installed Dependency Review
Inspected package versions in the local environment:
- `streamlit`: 1.67.0 (Recent 2026 stable release)
- `scikit-learn`: 1.9.1
- `xgboost`: 3.4.1
- `shap`: 0.54.1
- `pandas`: 3.1.1
- `numpy`: 2.5.4
- `joblib`: 1.6.0
- `requests`: 2.34.2
- `urllib3`: 2.8.0
- `jinja2`: 3.1.6
- `plotly`: 7.1.0

No legacy, deprecated, or insecure package versions were detected.

### 5.2 Server Configuration Hardening
Created `.streamlit/config.toml`:
```toml
[browser]
gatherUsageStats = false

[server]
headless = true
enableXsrfProtection = true
enableCORS = false

[client]
toolbarMode = "minimal"
```

---

## 6. Regression Test Results

All six test suites were executed sequentially:

| Test Suite File | Domain Covered | Tests Run | Result |
| :--- | :--- | :---: | :---: |
| `tests/test_end_to_end_validation.py` | Full Student Journey & Views | 25 | **PASS (100%)** |
| `tests/test_student_experience.py` | UI Theme, Fonts, Helplines | 7 | **PASS (100%)** |
| `tests/test_engine_independence.py` | Tri-Engine Statistical Independence | 5 | **PASS (100%)** |
| `tests/test_offline_reliability.py` | In-Process Socket Interception Guard | 9 | **PASS (100%)** |
| `tests/test_security_privacy.py` | Session Isolation, XSS, Integrity, Bounds | 13 | **PASS (100%)** |
| `tests/test_training_platform.py` | MLOps Platform & Registry Governance | 15 | **PASS (100%)** |
| **GRAND TOTAL** | **Comprehensive Regression Quality Gate** | **74** | **74 / 74 PASSED (100%)** |

---

## 7. Remaining Risks & Architectural Boundaries

1. **Host-Level Process Memory Inspection:** Assessment data resides in the Streamlit server process RAM during an active student session. An operator with local root/administrator or memory debugger access to the host machine could inspect heap memory.
2. **Local Machine Multi-User Browser Access:** If two students share the exact same physical computer and browser profile without closing the tab or clicking "Clear All Session Data Now", the second student could see the previous session state. Mindora mitigates this by providing visible session reset controls and clear privacy notices.
3. **Browser Web Speech API Routing:** The optional voice reflection input relies on the browser's native `webkitSpeechRecognition`. On some operating systems, Chromium routes audio through cloud speech services. Mindora treats this as strictly optional, providing immediate text input fallbacks.
4. **Scope Disclaimer:** While all automated unit, integration, and security tests pass with 100% success, the application has not undergone third-party penetration testing or external formal compliance certification.

---

## 8. Production Model Hash Verification

```powershell
Get-FileHash models/best_model.pkl -Algorithm SHA256
# Algorithm: SHA256
# Hash:      E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC
```
- **Integrity Status:** **100% Bit-Exact Match** with original production baseline.
- **Feature Schema:** Strictly 10 approved features.
- **Model Pipeline:** Calibrated XGBoost with 5-fold cross-validation sigmoid calibration.

---

## 9. Git Working-Tree & Commit Status

- **Status:** All Day 6 security hardenings, test suites, and audit dossier completed.
- **Streamlit Health Check:** `http://localhost:8501/_stcore/health` returns `HTTP 200 OK`.
