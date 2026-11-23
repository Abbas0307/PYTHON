# MINDORA 2.0 — PHASE 5.19 INITIAL DEPLOYMENT ASSESSMENT
# PRODUCTION SECURITY HARDENING & DEPLOYMENT READINESS

**Principal Auditor:** Senior DevSecOps Engineer, Application Security Architect, Backend Engineer & Responsible AI Systems Auditor  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  
**Execution Environment:** Windows 11 (x64), Python 3.14.5, Node 24.20.0, Vite 5.4.21, React 18.3.1, FastAPI 0.115, SQLite 3  

---

## 1. Executive Summary

Phase 5.19 assesses and hardens the complete Mindora 2.0 platform for production deployment readiness. While Phase 5.18 proved end-to-end integration and functionality on local loopback (`http://127.0.0.1:5173` and `http://127.0.0.1:8000`), a production cloud release requires rigorous security hardening, strict environment separation, credential protection, persistent database guarantees, and reproducible hosting configurations.

This assessment identifies existing deployment blockers, security vulnerabilities, and operational gaps, establishing the remediation blueprint for production qualification.

---

## 2. Current Architecture & Runtime State

### 2.1 Component Topology
- **Frontend Layer:** React 18.3.1 SPA built with Vite 5.4.21 and TypeScript 5.8. Offline-first architecture with deterministic client-side engines (`wellbeingEngine.ts`, `adaptiveRecommendationEngine.ts`, `trendEngine.ts`, `wellnessEngine.ts`, `activityTimelineEngine.ts`). Web Crypto PBKDF2/AES-GCM encrypted vaults in IndexedDB.
- **Backend API Layer:** FastAPI 0.115 running under Uvicorn on Python 3.14.5. Provides Argon2id authentication, guardian consent management, mock SMS dispatch, and Model Laboratory metrics APIs. Optional integration with local Ollama (`qwen3:4b`).
- **Database Layer:** SQLite 3 file (`data/mindora_auth.db`). Contains student authentication credentials (Argon2id hashes) and guardian contact / consent records.
- **ML Research & Laboratory Tier:** Four trained scikit-learn/XGBoost model pipelines (`models/large_dataset` and `models/best_model.pkl`). Track A (27,901 benchmark records) and Track B (163-record quarantined laboratory dataset).

---

## 3. Current Development vs. Production Configuration Audit

| Architectural Layer | Development Configuration (Observed) | Target Production Standard | Gap / Blocker Severity |
| :--- | :--- | :--- | :---: |
| **Environment Variable Separation** | No `.env` or `.env.example`; configuration hardcoded in `config.py` | Strict `.env` loading via `pydantic-settings` or `os.getenv` with `.env.example` template | **HIGH** |
| **Authentication Fallback** | `validate_session()` accepts `"local_dev_session"` and resolves to UID-1 | `"local_dev_session"` must be strictly rejected when `MINDORA_ENV=production` | **CRITICAL** |
| **API Base URL (Frontend)** | `http://127.0.0.1:8000` hardcoded in `ProfileSettingsScreen.tsx` & `GuardianSupportScreen.tsx` | Centralized `VITE_API_URL` environment configuration with relative/configurable origin | **HIGH** |
| **CORS Origins** | Hardcoded to `localhost:5173`, `127.0.0.1:5173`, `localhost:4173`, `127.0.0.1:4173` | Configurable origin list parsed from `MINDORA_ALLOWED_ORIGINS`; zero wildcard `*` | **HIGH** |
| **Database Persistence** | Default file path `data/mindora_auth.db` relative to repository | Dedicated persistent storage mount point (e.g. `/var/data` or persistent Render disk) | **CRITICAL** |
| **API Documentation** | `/docs` (Swagger UI) and `/redoc` enabled globally without restriction | Restricted or disabled in production to prevent schema enumeration | **MEDIUM** |
| **Repository Ignore Rules** | `.gitignore` only ignores `.venv/`, `__pycache__/`, `*.pyc`, `*.pyo`, `.DS_Store`, `.streamlit/` | Must exclude `.env`, `*.db`, `data/*.db`, `frontend/dist/`, `frontend/node_modules/` | **HIGH** |
| **Hosting Blueprints** | No `render.yaml` or `vercel.json` | Explicit production deployment descriptors for Render (FastAPI) and Vercel (React) | **HIGH** |

---

## 4. Identified Deployment Blockers

1. **Development Fallback Session Token Exposure:**
   - In `local_companion/auth_manager.py`, `validate_session("local_dev_session")` returns student UID-1 without credential verification. If deployed to production without environment gating, any HTTP client sending `Authorization: Bearer local_dev_session` would immediately seize administrative control of UID-1.
2. **Ephemeral Disk Loss on Serverless/Container Platforms:**
   - SQLite stores user credentials and guardian consent in `data/mindora_auth.db`. Deploying to standard stateless containers (e.g., standard Render free instances without persistent disk mounts, Heroku, or serverless functions) will wipe user accounts and guardian records on container restart or spin-down.
3. **Hardcoded Loopback URLs in Frontend:**
   - `ProfileSettingsScreen.tsx` and `GuardianSupportScreen.tsx` make fetch calls directly to `http://127.0.0.1:8000`. In a deployed cloud environment (e.g., `https://mindora.vercel.app`), browser clients will attempt to contact their own local loopback instead of the deployed backend API (`https://api-mindora.onrender.com`), causing network failures.
4. **Untracked Sensitive Artifacts in Repository:**
   - `auth.db` exists in the repository root as an untracked file, and `.gitignore` lacks exclusions for `.env` and SQLite database files.

---

## 5. Security & Privacy Risks

- **Information Leakage via Unhandled Exceptions:** Uvicorn/FastAPI default exception handlers can expose stack traces and local server paths (`D:\Depression calculator\...`) in HTTP 500 error responses if debug mode is active.
- **Brute-Force & Credential Stuffing:** While `auth_manager.py` implements in-memory IP/email rate limiting, a container restart flushes this table. Production deployments should enforce robust limits and strict header validation (`X-Forwarded-For`).
- **Data Minimization & Logging:** Ensure that request logging does not record passwords, session tokens, or sensitive student inputs.

---

## 6. Required Environment Variables Matrix

| Variable Name | Required In | Default (Dev) | Description |
| :--- | :---: | :--- | :--- |
| `MINDORA_ENV` | Backend | `development` | Runtime mode: `development`, `production`, or `testing` |
| `MINDORA_HOST` | Backend | `127.0.0.1` | Network interface binding (`0.0.0.0` for container/cloud) |
| `MINDORA_PORT` | Backend | `8000` | Port for the backend service (provided by Render via `$PORT`) |
| `MINDORA_ALLOWED_ORIGINS` | Backend | Localhost origins | Comma-delimited list of permitted CORS frontend origins |
| `MINDORA_DB_PATH` | Backend | `data/mindora_auth.db` | Absolute or persistent filesystem path for SQLite database |
| `MINDORA_SECRET_KEY` | Backend | Auto-generated dev key | Secret key for cryptographic signing and session validation |
| `MINDORA_DOCS_ENABLED` | Backend | `true` | Boolean flag controlling availability of `/docs` and `/redoc` |
| `VITE_API_URL` | Frontend | `""` (relies on dev proxy or `http://127.0.0.1:8000`) | Base URL of the deployed FastAPI backend API |

---

## 7. Next Steps for Production Hardening

1. Implement robust environment configuration loading and validation in `local_companion/config.py`.
2. Update `.gitignore` and author `.env.example`.
3. Harden `local_companion/auth_manager.py` to strictly reject `"local_dev_session"` in production mode.
4. Implement centralized API URL resolution in the frontend.
5. Create production deployment manifests (`render.yaml`, `vercel.json`).
6. Execute automated backup and recovery verification drills.
7. Perform dependency supply-chain audits and deployment smoke tests.
