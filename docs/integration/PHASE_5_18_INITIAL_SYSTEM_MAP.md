# MINDORA 2.0 — PHASE 5.18 INITIAL SYSTEM MAP
## Architecture, Components, API Routes, Data Flow & Integration Dependencies

**Auditors:** Senior Full-Stack Engineer, ML Systems Auditor, Application Security Engineer & QA Lead  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  
**Phase:** 5.18 End-to-End Product Integration & Student Experience Audit  

---

## 1. System Topology Overview

Mindora 2.0 operates as an offline-first, privacy-preserving student mental wellness intelligence platform with an optional local backend service and ML research laboratory:

```mermaid
flowchart TD
    subgraph Frontend Tier [Frontend Tier: React 18 + Vite + TypeScript PWA (Port 5173)]
        A["App.tsx\n(State & Router Container)"]
        A --> S["Sidebar.tsx\n(12 Core Navigation Sections)"]
        A --> H["Header.tsx & CrisisBanner.tsx\n(Item 9 Safety Safeguard)"]
        A --> P1["Student Wellbeing Screens\n(Dashboard, Assessment, Goals, Studio, Privacy)"]
        A --> P2["ML Research Lab Screens\n(ModelLab, Comparison, RealWorld, LargeData, XAI)"]
        A --> P3["Security & Contact Screens\n(ProfileSettings, GuardianSupport, SupportResources)"]
        
        subgraph Client-Side Engines [Deterministic Client-Side Engines]
            E1["wellbeingEngine.ts (PHQ-9 & Lifestyle)"]
            E2["trendEngine.ts & Vault (PBKDF2/AES-GCM)"]
            E3["plannerEngine.ts (Smart Action Planner)"]
            E4["wellnessEngine.ts (Interactive Studio)"]
            E5["adaptiveRecommendationEngine.ts"]
            E6["privacyInventoryEngine.ts & Deletion"]
        end
        P1 --> Client-Side Engines
    end

    subgraph Backend Tier [Backend Tier: FastAPI + Uvicorn (Port 8000)]
        API["FastAPI local_companion/service.py"]
        API --> AUTH["auth_manager.py\n(Argon2id + 256-bit Tokens)"]
        API --> DB[(SQLite auth.db)]
        API --> SMS["MockSmsProvider\n(Offline Simulated Dispatch)"]
        API --> OLLAMA["Local Ollama Daemon\n(qwen3:4b / gemma4:12b)"]
        API --> METRICS["Model Metrics Store\n(large_dataset & real_world_163 JSON)"]
    end

    subgraph ML Model Storage [Serialized Model Storage & Pipelines]
        M_TRK_A["Track A: models/large_dataset/*.joblib\n(LR, RF, XGB, SVM on 27,901 rows)"]
        M_TRK_B["Track B: models/real_world_163/*.joblib\n(LR, RF, XGB, SVM on 163 records)"]
    end

    P3 -.->|HTTP REST (Port 8000)| API
    P2 -.->|Pre-compiled Metrics| M_TRK_A
    P2 -.->|Quarantined Metrics| M_TRK_B
```

---

## 2. Component Inventory & Directory Hierarchy

### 2.1 Frontend Page Components (`frontend/src/pages/`)
1. **`WelcomePrivacyScreen.tsx`**: Initial entry screen presenting the dual-layered privacy notice, data segregation disclosure, and informed consent toggle.
2. **`AssessmentScreen.tsx`**: 10-feature tabular student survey input combined with the standard 9-item Patient Health Questionnaire (PHQ-9).
3. **`DashboardScreen.tsx`**: Central student wellbeing command center containing 10 customizable sections (PHQ-9 severity, lifestyle indices, weekly trends, smart action planner, wellness studio, personal goals, adaptive recommendations, daily check-in, weekly summary, and crisis navigator).
4. **`SupportResourcesScreen.tsx`**: Geo-sensitive multi-country crisis directory (India, US, Canada, UK) and optional local AI companion interface.
5. **`ModelLabScreen.tsx`**: Interactive inference sandbox enabling evaluation of student profiles across all four ML architectures.
6. **`ModelComparisonScreen.tsx`**: 11-dimension comparative evaluation dashboard benchmarking Logistic Regression, Random Forest, XGBoost, and SVM.
7. **`LargeDatasetScreen.tsx`**: Comprehensive training, validation, and holdout test experiment reports for the 27,901-record benchmark.
8. **`RealWorldDatasetScreen.tsx`**: Quarantined research laboratory for the 163-record exploratory dataset bearing the mandatory `"163-RECORD DATASET — PROVENANCE UNVERIFIED"` banner.
9. **`ExplainabilityScreen.tsx`**: Feature importance, global SHAP rankings, partial dependence plots, and local explainability breakdowns.
10. **`GuardianSupportScreen.tsx`**: Student-controlled parent/guardian contact management, consent revocation, message preview, and stress check-in dispatch.
11. **`ProfileSettingsScreen.tsx`**: Student identity management, Argon2id registration/login, session termination, and security invariants audit overview.

### 2.2 Client-Side Deterministic Engines (`frontend/src/engines/`)
- **`wellbeingEngine.ts`**: Pure deterministic calculation of PHQ-9 severity scores (0–27), Item 9 self-harm detection, and continuous lifestyle friction indices. Zero network calls.
- **`trendEngine.ts`**: PBKDF2 (600,000 iterations) + AES-256-GCM authenticated encrypted vault for longitudinal weekly check-in tracking.
- **`plannerEngine.ts`**: Rule-based action recommendations across 25 curated collegiate wellness micro-interventions.
- **`wellnessEngine.ts`**: In-memory interactive wellness exercises (guided breathing, sensory grounding, muscle relaxation, focus timer).
- **`adaptiveRecommendationEngine.ts`**: Transparent mapping connecting student focus goals to recommended routines.
- **`personalSummaryEngine.ts`**: Factual weekly progress summarization with honest empty states.
- **`activityTimelineEngine.ts`**: Chronological event aggregation across goals, habits, and studio sessions (clinical data strictly excluded).
- **`privacyInventoryEngine.ts`**: Real-time auditing of stored data categories and selective data deletion handlers.

---

## 3. API Route Map & Service Integration

The FastAPI backend (`local_companion/service.py`) exposes the following endpoints:

| Endpoint Path | HTTP Method | Authentication Requirement | Payload / Purpose | Frontend Consumer |
| :--- | :---: | :---: | :--- | :--- |
| `/health` | `GET` | Public | System status, Ollama daemon, GPU VRAM status | `LocalResourceCompanion.tsx` |
| `/api/companion/resources` | `GET` | Public | Approved multi-country mental health directory | Optional external clients |
| `/api/companion/chat` | `POST` | Public (Zero Personal Data) | Privacy-safe RAG queries regarding resources | `LocalResourceCompanion.tsx` |
| `/api/companion/summarize` | `POST` | Public | Resource document educational summarization | Local companion tool |
| `/api/auth/register` | `POST` | Public | Full name, email, password, DOB, adult flag | `ProfileSettingsScreen.tsx` |
| `/api/auth/login` | `POST` | Public (Rate-Limited) | Email, password (max 5 fails/15 min) | `ProfileSettingsScreen.tsx` |
| `/api/auth/logout` | `POST` | Bearer Token | Revokes and deletes active session token | `ProfileSettingsScreen.tsx` |
| `/api/auth/me` | `GET` | Bearer Token | Retrieves current student profile & settings | Session re-validation |
| `/api/auth/forgot-password` | `POST` | Public | Initiates password reset flow | Profile Settings |
| `/api/auth/reset-password` | `POST` | Public | Resets password with valid reset token | Profile Settings |
| `/api/guardian/update` | `PUT` | Bearer Token | Saves guardian name, phone, relationship, consent | `GuardianSupportScreen.tsx` |
| `/api/guardian/verify` | `POST` | Bearer Token | Validates 6-digit verification code | `GuardianSupportScreen.tsx` |
| `/api/guardian/revoke` | `POST` | Bearer Token | Immediately revokes guardian notification consent | `GuardianSupportScreen.tsx` |
| `/api/guardian/notify-stress` | `POST` | Bearer Token (Consent Gate) | Dispatches non-diagnostic check-in via mock SMS | `GuardianSupportScreen.tsx` |
| `/api/guardian/audit-log` | `GET` | Bearer Token | Retrieves immutable dispatch history for student | `GuardianSupportScreen.tsx` |
| `/api/models/large-dataset` | `GET` | Public | Returns canonical reconciled Track A metrics | Model Lab & Comparison |
| `/api/models/real-world-163` | `GET` | Public | Returns quarantined Track B cross-validation metrics| Real-World Dataset Lab |

---

## 4. Data Flow & Boundary Isolation Architecture

### 4.1 Boundary 1: Clinical Data vs. Local AI Companion
- **Invariant:** Personal survey features, CGPA, academic pressure, and PHQ-9 depression questions are **NEVER** transmitted to the `/api/companion/chat` endpoint.
- **Enforcement:** `LocalResourceCompanion.tsx` builds its payload strictly from the user's typed search query and selected country string. Personal assessment state is inaccessible to the component.

### 4.2 Boundary 2: Clinical Data vs. Guardian Support
- **Invariant:** Guardian notifications contain **ZERO** clinical diagnostic labels, **ZERO** depression scores, and **ZERO** survey metrics.
- **Enforcement:** Dispatched message text is fixed and non-diagnostic:
  > *"Your student has requested support from their trusted contact through Mindora. Please check in with them when possible."*
- Requires explicit student checkbox confirmation and can only dispatch through an offline simulated `MockSmsProvider`.

### 4.3 Boundary 3: Track A Benchmark vs. Track B Exploratory Dataset
- **Track A (Kaggle Benchmark):** 27,901 rows. Preprocessors fitted strictly on training data ($N=19,530$). Evaluated on frozen holdout test partition ($N=4,186$).
- **Track B (163 Records):** Unverified Google Form survey. Quarantined in researcher lab. Evaluated via Repeated Stratified 5-Fold Cross-Validation (25 runs).
- **Enforcement:** Zero imports from Track B models or data into `DashboardScreen.tsx` or student assessment engines.

---

## 5. Audit Identified Incomplete, Disconnected, or Mock Features

1. **SMS Gateway:** External SMS dispatch is intentionally mocked (`MockSmsProvider`) to prevent non-consensual cellular transmissions and avoid third-party cloud data leakage during development and testing.
2. **Local AI Companion:** Defaults to disabled (opt-in only). Operates strictly if local Ollama daemon is active; gracefully degrades with an informative offline notice if unavailable.
3. **Session Persistence in Frontend:** While the backend maintains state in SQLite (`auth.db`), the frontend `ProfileSettingsScreen` maintains an in-memory session with an offline fallback. True session token storage in browser `localStorage` or `sessionStorage` with automatic Bearer header attachment across all API calls will be audited and hardened in Section 2 & 3.
4. **Hardcoded Base URL in Certain Screens:** `ProfileSettingsScreen.tsx` and `GuardianSupportScreen.tsx` utilize direct `'http://127.0.0.1:8000'` strings instead of a centralized, environment-aware API client configuration.

This completes the initial system map. The audit now proceeds to Section 2: Frontend–Backend Integration.
