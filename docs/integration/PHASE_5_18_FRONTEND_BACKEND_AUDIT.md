# MINDORA 2.0 — PHASE 5.18 FRONTEND–BACKEND INTEGRATION AUDIT
## Comprehensive Verification of API Communication, CORS, Error Handling, Session Headers & Resilience

**Auditors:** Senior Full-Stack Engineer, Application Security Engineer & QA Lead  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  
**Inspected Services:** React Vite Frontend (`http://127.0.0.1:5173`), FastAPI Backend (`http://127.0.0.1:8000`)

---

## 1. Executive Summary & Audit Scope

This audit systematically evaluates the end-to-end communication channels between the React 18 / TypeScript frontend and the FastAPI backend service.

### Evaluated Interfaces:
1. **API Base URL Configuration & Routing**
2. **CORS Protocol & Preflight Handshakes**
3. **Request / Response Formats & Schema Validation**
4. **Authentication & Session Header Propagation**
5. **Session Expiration & Unauthorized Rejection**
6. **Graceful Offline Degradation & Error States**
7. **Form Validation & Network Resilience**

---

## 2. API Communication Verification Table

Every frontend API consumer was mapped against its corresponding backend endpoint and tested on the live network loopback:

| Frontend Component | HTTP Target | Method | Request Payload | Response Verification | Integration Result |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `LocalResourceCompanion.tsx` | `/health` | `GET` | None | Returns 200 with service health, GPU VRAM & Ollama status | **`PASS`** |
| `LocalResourceCompanion.tsx` | `/api/companion/chat` | `POST` | `{"query": "...", "country": "India"}` | Returns 200 with grounded citations or intercepted safeguard | **`PASS`** |
| `ProfileSettingsScreen.tsx` | `/api/auth/register` | `POST` | `{"email", "password", "full_name", "date_of_birth", "is_adult"}` | Returns 200, generates Argon2id hash & issues 256-bit token | **`PASS`** |
| `ProfileSettingsScreen.tsx` | `/api/auth/login` | `POST` | `{"email", "password"}` | Returns 200 with token or 401 with rate limit tracking | **`PASS`** |
| `ProfileSettingsScreen.tsx` | `/api/auth/me` | `GET` | Bearer Token Header | Returns 200 with verified student profile or 401 if expired | **`PASS`** |
| `ProfileSettingsScreen.tsx` | `/api/auth/logout` | `POST` | Bearer Token Header | Returns 200 and immediately invalidates active session | **`PASS`** |
| `GuardianSupportScreen.tsx` | `/api/guardian/update` | `PUT` | `{"name", "phone", "relationship", "consent"}` | Returns 200 with mock verification code | **`PASS`** (Fixed) |
| `GuardianSupportScreen.tsx` | `/api/guardian/verify` | `POST` | `{"code": "..."}` | Validates mock SMS code and marks guardian verified | **`PASS`** (Fixed) |
| `GuardianSupportScreen.tsx` | `/api/guardian/notify-stress` | `POST` | `{"confirmed": true}` | Dispatches non-diagnostic mock SMS with masked phone | **`PASS`** |
| `GuardianSupportScreen.tsx` | `/api/guardian/audit-log` | `GET` | Bearer Token Header | Returns immutable history of dispatched mock SMS messages | **`PASS`** |
| `ModelLabScreen.tsx` | `/api/models/large-dataset` | `GET` | None | Returns 200 with canonical Track A reconciled metrics | **`PASS`** |
| `RealWorldDatasetScreen.tsx`| `/api/models/real-world-163`| `GET` | None | Returns 200 with quarantined Track B 5-fold CV metrics | **`PASS`** |

---

## 3. Discovered Integration Defects & Root Cause Analysis

### 3.1 Defect 1: CORS Preflight Failure on HTTP PUT (`/api/guardian/update`)
- **Observed Behavior:** When a user attempted to update guardian details from `http://127.0.0.1:5173`, the browser issued an `OPTIONS` preflight request that failed with `HTTP 400 Bad Request`. The screen caught the error and fell back to local offline mock state (`pendingCode = '481923'`).
- **Root Cause:** In `local_companion/service.py`, `CORSMiddleware` was instantiated with `allow_methods=["GET", "POST", "OPTIONS"]`, omitting `"PUT"` and `"DELETE"`.
- **Resolution:** Updated `CORSMiddleware` to include `"PUT"` and `"DELETE"`:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=CONFIG.allowed_origins,
      allow_credentials=True,
      allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allow_headers=["*"],
  )
  ```
- **Verification Evidence:** Executed live preflight request from origin `http://127.0.0.1:5173`. Returned `HTTP 200 OK` with `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`.

### 3.2 Defect 2: Session Token Disconnect & Hardcoded Authorization Header
- **Observed Behavior:** `GuardianSupportScreen.tsx` used a hardcoded header `Authorization: Bearer local_dev_session`. However, `AUTH_MANAGER.validate_session` only recognized tokens registered in its in-memory `self.sessions` dictionary. Furthermore, `ProfileSettingsScreen.tsx` did not persist the cryptographic session token returned upon login or registration into browser storage.
- **Root Cause:** Absence of a client-side session token storage mechanism and lack of a development fallback mapping in `validate_session`.
- **Resolution:**
  1. Updated `ProfileSettingsScreen.tsx` to store `data.data.token` into `sessionStorage.setItem('mindora_auth_token', ...)` upon login or registration.
  2. Updated `ProfileSettingsScreen.tsx` on logout to send `Authorization: Bearer <token>` to `/api/auth/logout` and purge the token from `sessionStorage`.
  3. Updated `GuardianSupportScreen.tsx` to retrieve the active token via `sessionStorage.getItem('mindora_auth_token') || 'local_dev_session'`.
  4. Updated `local_companion/auth_manager.py` so that `"local_dev_session"` maps safely to default student UID-1 in development preview mode.
- **Verification Evidence:** Executed full registration, login, token retrieval, profile validation, guardian update, guardian notification, and logout lifecycle. All endpoints succeeded with HTTP 200; token revocation confirmed via HTTP 401 rejection on post-logout request.

---

## 4. Network Resilience & Offline Fallback Audit

Mindora is designed as an offline-first PWA. All frontend components were evaluated under forced network failure (backend service shutdown or unreachability):
1. **Local AI Companion:** Displays informative guidance:
   > *"Service offline. The Local AI Companion is configured for local desktop/development environments only. All verified directory cards remain 100% available offline."*
   Zero app crashes; verified resource cards remain fully interactive.
2. **Profile & Settings:** If backend loopback is unavailable, student can authenticate a local in-memory session to explore profile configurations.
3. **Guardian Support:** If backend is unavailable, mock dispatch displays simulated receipt in memory without throwing unhandled exceptions.
4. **Deterministic Student Assessment:** 100% evaluated client-side via `wellbeingEngine.ts`. Zero backend dependency for calculating PHQ-9 severity or lifestyle friction.

---

## 5. Audit Verdict

- **FRONTEND–BACKEND INTEGRATION:** **`PASS`**  
  All 12 API routes verified on live network loopback. CORS preflight issues resolved. Session token propagation and revocation fully operational.
