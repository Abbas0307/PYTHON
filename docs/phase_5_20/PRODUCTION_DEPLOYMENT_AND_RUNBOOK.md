# Mindora 2.0 — Phase 5.20: Production Deployment & Runbook

**Document ID:** `DOC-P520-OPS-016`  
**Date:** November 16, 2026  
**Status:** Verified & Active  
**Author:** DevSecOps Engineer & Cloud Infrastructure Lead  

---

## 1. Production Architecture & Orchestration

Mindora 2.0 deploys as a dual-tier containerized or managed PaaS service:
1. **Frontend Service:** Static SPA served via Nginx or Cloudflare CDN with strict Content Security Policy (CSP), TLS 1.3 termination, and zero caching for dynamic routes.
2. **Backend Companion API:** Python 3.14 Uvicorn/FastAPI process running behind a reverse proxy bound to loopback or secure internal network.

---

## 2. Environment Configuration Matrix

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `MINDORA_ENV` | `production` | Enforces production security invariants. |
| `MINDORA_SECRET_KEY` | 64+ char random hex string | Key derivation root for PBKDF2 and AES-256-GCM. |
| `MINDORA_DB_PATH` | `/var/lib/mindora/data/mindora_auth.db` | Persistent volume path for SQLite database. |
| `SMS_PROVIDER` | `fast2sms` (or `mock` for staging) | Active SMS delivery adapter. |
| `SMS_API_KEY` | DLT authorized API key | Carrier gateway authentication token. |
| `SMS_SENDER_ID` | Approved DLT header (e.g. `MINDOR`) | Registered enterprise sender header. |
| `CORS_ORIGINS` | `https://mindora.edu,https://app.mindora.edu` | Restricts allowed origins (rejects wildcards). |

---

## 3. Operational Runbook Procedures

### Procedure A: Routine Pre-Deployment Database Backup
```bash
# Execute pre-migration automated backup with integrity check
py -3.14 scripts/db_backup.py
```

### Procedure B: Database Schema Migration
```bash
# Apply Phase 5.20 schema alterations and contact re-encryption
py -3.14 scripts/migrate_phase_5_20_db.py
```

### Procedure C: Health Check Verification
```bash
# Verify API companion liveness and status
curl -s http://127.0.0.1:8000/api/health
# Response: {"status":"healthy","version":"2.0.0","environment":"production"}
```

### Procedure D: Emergency Guardian Permission Revocation
If a student reports compromised phone numbers or requests instant data wiping:
1. Student accesses Privacy Center or Guardian Support and clicks "Revoke All Permissions".
2. System immediately nullifies notification policies, deletes verification tokens, and sets `guardian_consent = 0`.
