# MINDORA 2.0 — PHASE 5.19 API SECURITY AUDIT
# FASTAPI ENDPOINT HARDENING, CORS, SECURITY HEADERS & ERROR SANITIZATION

**Principal Auditor:** Senior Application Security Architect & DevSecOps Lead  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  

---

## 1. Executive Summary

This audit evaluates the HTTP API surface of Mindora 2.0 (`local_companion/service.py`). All 12 REST endpoints were audited for Cross-Origin Resource Sharing (CORS), security headers, input validation, SQL injection resistance, payload boundaries, information leakage, and API documentation exposure.

---

## 2. API Security Architecture & Controls

### 2.1 Security HTTP Headers Middleware
Every incoming HTTP request passes through the security headers middleware in `local_companion/service.py`:
- `X-Content-Type-Options: nosniff` (Prevents MIME-sniffing exploits).
- `X-Frame-Options: DENY` (Mitigates clickjacking attacks).
- `X-XSS-Protection: 1; mode=block` (Enforces legacy browser XSS filtering).
- `Referrer-Policy: strict-origin-when-cross-origin` (Protects referrer data on cross-origin transitions).
- `Permissions-Policy: geolocation=(), microphone=(), camera=()` (Disables unnecessary device capabilities).

### 2.2 CORS Origin Restriction
- **Allowed Methods:** Explicitly restricted to `["GET", "POST", "PUT", "DELETE", "OPTIONS"]`.
- **Allowed Headers:** Explicitly limited to `["Content-Type", "Authorization", "X-Session-Token", "Accept", "Origin"]`.
- **Allowed Origins:** Populated dynamically from `MINDORA_ALLOWED_ORIGINS`.
- **Wildcard Prohibition:** Wildcard (`*`) origins are rejected by configuration validation in production.

### 2.3 Exception Sanitization & Error Handling
- **Global Exception Handler:** Intercepts unhandled HTTP 500 exceptions.
- **Production Mode:** Returns sanitized JSON: `{"status": "error", "message": "An internal server error occurred."}`.
- **Information Leakage Defense:** Prevents server stack traces, local filesystem paths (`D:\Depression calculator\...`), and database error messages from reaching the client.

### 2.4 API Documentation Gating
- `/docs` (Swagger UI), `/redoc`, and `/openapi.json` are conditionally registered based on `CONFIG.docs_enabled`.
- In production mode, documentation endpoints return HTTP 404 by default, preventing endpoint and schema reconnaissance.

### 2.5 Input Validation & SQL Injection Defenses
- All SQLite queries use parameterized placeholders (`?`).
- Tested with SQL injection payloads (`' OR '1'='1' --`, `'; DROP TABLE users; --`); all were handled safely as string literals without SQL syntax errors or database modification.
- Chat input bounded between 2 and 500 characters via Pydantic schema validation.

---

## 3. Comprehensive Endpoint Audit Matrix

| HTTP Method | Route | Auth Required | Input Schema Validation | Security Controls |
| :---: | :--- | :---: | :---: | :--- |
| `GET` | `/health` | No | None | Privacy guarantee, DB/Model availability, no secret leakage |
| `GET` | `/ready` | No | None | Orchestrator readiness probe (DB & Models verified) |
| `GET` | `/api/companion/resources` | No | None | Read-only approved catalogue retrieval |
| `POST` | `/api/companion/chat` | No | Pydantic (2-500 chars) | Privacy guard, crisis interceptor, diagnostic interceptor |
| `POST` | `/api/companion/summarize` | No | Pydantic (`resource_id`) | ID check against approved knowledge base |
| `POST` | `/api/auth/register` | No | JSON Body | Email regex, password length $\ge 8$, name length $\ge 2$, Argon2id |
| `POST` | `/api/auth/login` | No | JSON Body | Rate limiting (max 5/15m), Argon2id verification, session generation |
| `POST` | `/api/auth/logout` | Optional | Bearer Token | In-memory session registry revocation |
| `GET` | `/api/auth/me` | **Yes** | Bearer Token | Active session validation, returns student profile |
| `PUT` | `/api/guardian/update` | **Yes** | Bearer Token + JSON | Session validation, parameterized DB update, generates mock code |
| `POST` | `/api/guardian/verify` | **Yes** | Bearer Token + JSON | Code matching against database verification code |
| `POST` | `/api/guardian/revoke` | **Yes** | Bearer Token | Resets consent and verified status in DB |
| `POST` | `/api/guardian/notify-stress` | **Yes** | Bearer Token + JSON | Student confirmation gate, mock SMS delivery, audit log record |
| `GET` | `/api/guardian/audit-log` | **Yes** | Bearer Token | User-specific audit log isolation |
| `GET` | `/api/models/large-dataset` | No | None | Static JSON metrics retrieval from reports |
| `GET` | `/api/models/real-world-163` | No | None | Static JSON metrics retrieval from reports |

---

## 4. Audit Verdict

**Status:** **`PASS`**  
FastAPI API tier enforces secure CORS, security headers, exception sanitization, and parameterized SQL protections.
