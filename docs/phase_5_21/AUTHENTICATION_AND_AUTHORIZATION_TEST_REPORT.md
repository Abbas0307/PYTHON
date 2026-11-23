# Mindora 2.0 — Phase 5.21: Authentication & Authorization Test Report

**Document ID:** `DOC-P521-AUTH-003`  
**Date:** November 16, 2026  
**Status:** Verification Complete & Active  
**Auditor:** Application Security Lead & Penetration Tester  

---

## 1. Authentication Lifecycle Test Matrix

The complete student account lifecycle was tested using automated test suite `tests/test_phase_5_21_audit.py`:

| Test Category | Test Case | Expected Behavior | Observed Result | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Registration** | Valid Student Registration | Account created, Argon2id hash saved, session token issued | Account created, 256-bit token issued | **PASS** |
| **Registration** | Invalid Email Format | Rejects malformed strings (`notanemail`, `test@`, etc.) | HTTP 400 "Invalid email address format." | **PASS** |
| **Registration** | Short Password ($< 8$ chars) | Rejects password | HTTP 400 "Password must be at least 8 characters" | **PASS** |
| **Registration** | Password Mismatch | Rejects mismatch | HTTP 400 "Passwords do not match." | **PASS** |
| **Registration** | Duplicate Email | Rejects duplicate | HTTP 400 "An account with this email already exists." | **PASS** |
| **Registration** | Future Date of Birth | Rejects future date | HTTP 400 "Date of birth cannot be in the future." | **PASS** |
| **Registration** | Underage Registration ($< 13$) | Rejects COPPA age | HTTP 400 "Students must be at least 13 years old" | **PASS** |
| **Registration** | Unchecked Mandatory Terms | Rejects without consent | HTTP 400 "You must accept the Terms of Service" | **PASS** |
| **Login** | Valid Credentials | Authenticates and returns profile | HTTP 200 with session token and decrypted profile | **PASS** |
| **Login** | Invalid Password | Rejects with generic error | HTTP 401 "Invalid email or password." | **PASS** |
| **Login** | Non-Existent Account | Rejects with generic error | HTTP 401 "Invalid email or password." (No enumeration) | **PASS** |
| **Login** | Brute-Force Rate Limiting | Blocks after 5 failures in 15 min | HTTP 401 on 6th attempt: "Too many failed attempts" | **PASS** |
| **Session** | Invalidation on Logout | Session removed from RAM | Validating logged-out token returns `None` | **PASS** |
| **Session** | Development Fallback Token | Blocked in production | `validate_session("local_dev_session") == None` in prod | **PASS** |

---

## 2. Authorization & Tenant Isolation (IDOR Defense)

### 2.1 Absence of Insecure Direct Object References
Every authenticated endpoint in `local_companion/service.py`:
- `GET /api/auth/me`
- `PUT /api/profile/update`
- `POST /api/profile/avatar`
- `DELETE /api/profile/avatar`
- `GET /api/guardian/policy`
- `PUT /api/guardian/policy`
- `POST /api/guardian/trigger-auto-alert`
- `GET /api/guardian/audit-log`

Derives `user_id` strictly from the server-validated session token:
```python
token = _extract_token(request)
user_id = AUTH_MANAGER.validate_session(token)
```
**No endpoint accepts a `user_id` query parameter or body attribute.** As a result, User A cannot tamper with requests to view or alter User B's profile, contact details, or guardian notifications.

### 2.2 Unauthenticated Access Defense
Calling any private student endpoint without an `Authorization: Bearer <token>` header returns `HTTP 401 Unauthorized: Authentication token required.`

---

## 3. Authentication & Authorization Verdict

- **Status:** **PASS**
- **Findings:** Rate limiting enforced; IDOR vectors absent; dev bypass tokens blocked in production mode.
