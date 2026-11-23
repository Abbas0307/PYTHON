# MINDORA 2.0 — PHASE 5.19 ENVIRONMENT CONFIGURATION AUDIT
# DEV VS. PROD SEPARATION, SECRET MANAGEMENT & CONFIG VALIDATION

**Principal Auditor:** Senior DevSecOps Engineer & Application Security Architect  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  

---

## 1. Executive Summary

This audit evaluates the environment isolation, secret management, configuration loading, and runtime validation across Mindora 2.0. In Phase 5.18, settings were hardcoded to local loopback ports (`127.0.0.1:8000` and `127.0.0.1:5173`). Phase 5.19 establishes a hardened environment management architecture separating development, testing, and production modes.

---

## 2. Environment Configuration Architecture

### 2.1 Backend Runtime Configuration (`local_companion/config.py`)
- **Environment Modes:** `development` (default), `production`, and `testing`, governed by `MINDORA_ENV`.
- **Dynamic Port Binding:** Reads `PORT` (for Render/PaaS compatibility) falling back to `MINDORA_PORT` or `8000`.
- **Origin Validation:** In production mode, `MINDORA_ALLOWED_ORIGINS` is strictly validated. Wildcard origins (`*`) and empty origin lists trigger immediate configuration errors via `validate_production_configuration()`.
- **Secret Key Validation:** In production mode, `MINDORA_SECRET_KEY` must be at least 32 characters in length and cannot match default development placeholders.
- **API Documentation Control:** `/docs` (Swagger UI) and `/redoc` are automatically disabled in production unless `MINDORA_DOCS_ENABLED=true` is explicitly provided.

### 2.2 Frontend Runtime Configuration (`frontend/src/config/api.ts`)
- **Resolution Strategy:** `getApiBaseUrl()` inspects `import.meta.env.VITE_API_URL`.
- **Deployment Behavior:**
  - On Vercel: Configured via project build environment variable `VITE_API_URL=https://mindora-api.onrender.com`.
  - In local development: Falls back safely to `http://127.0.0.1:8000`.
  - In production without explicit URL: Resolves to relative origin `""` (for same-domain reverse proxy hosting).

---

## 3. Secret Management & Git Hygiene

- **`.env.example` Templates:** Comprehensive template created in repository root (`.env.example`) and `frontend/.env.example`.
- **Git Exclusions (`.gitignore`):** Updated `.gitignore` to strictly exclude:
  - `.env`, `.env.local`, `.env.*.local` (preserving `.env.example`).
  - `*.db`, `*.sqlite3`, `data/*.db`, `data/*.sqlite3`.
  - `data/backups/`, `data/test_restore_sandbox/`.
  - `node_modules/`, `frontend/node_modules/`, `dist/`, `frontend/dist/`.
- **Static Token Scan:** Confirmed zero hardcoded passwords, private API keys, or cloud credentials exist in frontend bundles or repository code.

---

## 4. Verification & Validation Evidence

| Test Scenario | Verification Method | Result |
| :--- | :--- | :---: |
| **Insecure Secret Rejection** | Tested `validate_production_configuration()` with default secret | **`PASS` (Error Raised)** |
| **Wildcard CORS Rejection** | Tested `validate_production_configuration()` with `allowed_origins=["*"]` | **`PASS` (Error Raised)** |
| **Valid Production Config** | Tested `validate_production_configuration()` with 64-char hex key & valid origin | **`PASS` (0 Errors)** |
| **Frontend Base URL Resolution**| Tested `getApiBaseUrl()` in Dev and Prod modes | **`PASS`** |
| **Git Ignore Verification** | Tested `git status --porcelain` with untracked `.db` and `.env` files | **`PASS` (Ignored)** |

---

## 5. Audit Verdict

**Status:** **`PASS`**  
Environment separation, secret exclusion, and configuration validation are verified production-ready.
