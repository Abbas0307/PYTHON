# MINDORA 2.0 — PHASE 5.19 PRIVACY & DATA PROTECTION AUDIT
# DATA MINIMIZATION, SENSITIVE RESPONSE HYGIENE & LOGGING PRACTICES

**Principal Auditor:** Senior Privacy Engineer & Responsible AI Systems Auditor  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  

---

## 1. Executive Summary

This audit assesses the data protection controls, student privacy invariants, logging hygiene, and client-side encryption across Mindora 2.0. The audit confirms that student psychological assessments, PHQ-9 Item 9 responses, and private reflections are strictly isolated and never transmitted to or logged by the backend server.

---

## 2. Privacy & Data Minimization Architecture

### 2.1 Complete Client-Side Isolation of Sensitive Assessments
- **Deterministic Evaluation:** All 10-feature survey questions, PHQ-9 scoring, and lifestyle friction calculations execute 100% locally in the student's browser via `wellbeingEngine.ts`.
- **Zero Server Telemetry:** No assessment answers, depression scores, or PHQ-9 responses are transmitted over HTTP to `local_companion/service.py` or any remote server.
- **Item 9 Safeguard:** Thoughts of self-harm trigger an immediate, non-blocking crisis safeguard banner entirely in browser memory; Item 9 answers are never persisted or logged.

### 2.2 Client-Side Cryptographic Vaults (`encryptedVault.ts`)
- **Encryption Standard:** Web Crypto API **AES-256-GCM** with authenticated 96-bit Initialization Vectors (IV).
- **Key Derivation:** **PBKDF2** with **600,000 iterations** of SHA-256 and unique 128-bit cryptographic salts.
- **Scope:** Weekly wellbeing check-ins and Smart Action Planner tasks are stored encrypted in browser IndexedDB.
- **Passphrase Sovereignty:** The student holds the master passphrase in volatile memory; the backend server never possesses the key or ciphertext.

### 2.3 Logging Hygiene & Sanitization
- **Backend Request Logs:** Uvicorn access logs record only HTTP method, endpoint path, status code, and sanitized client IP.
- **Payload Exclusion:** Passwords, authentication tokens, student names, phone numbers, and guardian details are strictly excluded from console logs and files.
- **Structured Error Handling:** Unhandled exceptions in production return generic error messages without logging payload data.

### 2.4 User Data Deletion & Export Rights
- **Privacy Data Center (`PrivacyDataCenter.tsx`):**
  - **Category Inventory:** Catalogs all 6 data categories with exact storage mechanisms.
  - **Granular Erasure:** Students can selectively wipe assessment records, weekly trends, planner goals, or complete account state.
  - **JSON Export:** Provides machine-readable, schema-validated export of student data directly in the browser.

---

## 3. Privacy Invariant Verification Table

| Invariant Requirement | Implementation Mechanism | Observed Status |
| :--- | :--- | :---: |
| **Zero Assessment Transmission** | Client-side `wellbeingEngine.ts` | **`PASS` (Zero network requests)** |
| **No PHQ-9 Data in Backend** | Inspected `local_companion/service.py` payloads | **`PASS` (Zero clinical endpoints)** |
| **No Passwords in Server Logs** | Inspected `auth_manager.py` logging | **`PASS` (Zero credential logs)** |
| **No Item 9 Storage** | Ephemeral safety interceptor in browser memory | **`PASS` (Not persisted anywhere)** |
| **Client-Side Encryption** | AES-256-GCM (600,000 PBKDF2 iterations) | **`PASS` (Verified in IndexedDB)** |
| **Complete Account Erasure** | `DELETE` / purge functions in privacy center | **`PASS` (Permanent removal)** |

---

## 4. Audit Verdict

**Status:** **`PASS`**  
Mindora 2.0 adheres strictly to data minimization, client-side encryption, and privacy-preserving architectural boundaries.
