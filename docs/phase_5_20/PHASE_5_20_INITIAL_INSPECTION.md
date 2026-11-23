# MINDORA 2.0 — PHASE 5.20 INITIAL INSPECTION
# BASELINE EVALUATION & ROADMAP FOR SECURE PRODUCT REDESIGN

**Auditor/Architect:** Principal Software Architect, Application Security Engineer & DevSecOps Lead  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  
**Execution Environment:** Windows 11 (x64), Python 3.14.5, Node 24.20.0, Vite 5.4.21, React 18.3.1, FastAPI 0.115, SQLite 3  

---

## 1. Executive Summary

Phase 5.20 transitions Mindora 2.0 from a hardened technical prototype into a complete, student-ready, secure product. The user request mandates:
1. Complete, dedicated Signup and Login page workflows.
2. Comprehensive student profile management with profile image upload, validation, and header dropdown.
3. Configurable automatic guardian alerts based on approved wellness thresholds, subject to explicit prior consent.
4. Production SMS provider abstraction (MockSmsProvider + Real SMS gateway adapter with honest delivery states).
5. Comprehensive encryption architecture (AES-256-GCM encryption at rest, secure key management, honest E2EE boundaries).
6. Comprehensive UI/UX redesign across all existing screens in the white-and-violet aesthetic.
7. Database migration with verified backup.
8. Two independent inspection passes before implementation (Pass 1 and Pass 2) and two independent review passes after implementation (Pass 3 and Pass 4).

---

## 2. Baseline Architecture State (Post Phase 5.19)

### 2.1 Backend (`local_companion/`)
- **FastAPI Service:** Provides 12 endpoints. Security headers middleware, CORS configuration, sanitized HTTP 500 error handling, and `/health` + `/ready` probes are active.
- **Authentication:** `auth_manager.py` implements Argon2id password hashing, 256-bit URL-safe tokens with 8-hour expiration, and sliding-window rate limiting. `local_dev_session` is strictly rejected when `MINDORA_ENV=production`.
- **Database:** SQLite 3 (`data/mindora_auth.db`). Contains single `users` table. Lacks separate tables for consent versioning, notification policies, notification history, or OTP hashing.
- **SMS System:** In-memory mock list in `auth_manager.py`. Lacks formal provider abstraction, webhook reconciliation, and delivery state tracking.

### 2.2 Frontend (`frontend/`)
- **Routing:** Controlled via volatile React state `currentScreen` in `App.tsx`.
- **Screen Inventory:**
  - `WelcomePrivacyScreen.tsx`
  - `AssessmentScreen.tsx`
  - `DashboardScreen.tsx`
  - `SupportResourcesScreen.tsx`
  - `ModelLabScreen.tsx`, `ModelComparisonScreen.tsx`, `RealWorldDatasetScreen.tsx`, `LargeDatasetScreen.tsx`, `ExplainabilityScreen.tsx`
  - `GuardianSupportScreen.tsx`
  - `ProfileSettingsScreen.tsx` (serves both login, register, and profile in a single mixed card layout)
- **Top Header:** Displays logo, offline-first badge, country selector, and crisis button. **Lacks profile avatar and dropdown**.

### 2.3 Cryptography & Vaults
- **Client Vaults:** Web Crypto API AES-256-GCM with 600,000 PBKDF2 iterations for weekly trends and action planner. True client-side zero-knowledge encryption.
- **Server Database:** Storing guardian names and phone numbers in plaintext in SQLite. Requires encryption at rest using AES-256-GCM with server-managed key.

---

## 3. Scope of Work & Implementation Plan

```
[Phase 1] Pass 1 & Pass 2 Inspections
     |
[Phase 2] Dedicated Signup & Login Redesign (/signup, /login, Separate Unchecked Consents)
     |
[Phase 3] Student Profile Management & Top-Right Header Avatar Dropdown (Image Upload & Validation)
     |
[Phase 4] Server Encryption at Rest (AES-256-GCM) & Honest E2EE Documentation
     |
[Phase 5 & 6] Guardian Verification & Real SMS Provider Abstraction (Fast2SMS / Twilio + Mock)
     |
[Phase 7] Configurable Automatic Guardian Alerts (Threshold Engine & Neutral Messaging)
     |
[Phase 8] SQLite Database Schema Migration (Separate Consent, Policy, Logs, OTP Tables)
     |
[Phase 9] Complete UI/UX Polish (White-and-Violet Identity across 14 Screens)
     |
[Phase 10 & 11] API Integration & Security Regression Testing
     |
[Phase 12] Pass 3 Implementation Review & Pass 4 Independent Regression Review
     |
[Phase 13 & 14] End-to-End User Journey & Comprehensive Regression Test Suite
     |
[Phase 15] Final Documentation & Deployment Qualification
```
