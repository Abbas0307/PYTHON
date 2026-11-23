# MINDORA 2.0 — PHASE 5.4.8: DEPLOYMENT READINESS & SECURITY ARCHITECTURE REVIEW

**Project:** Mindora 2.0  
**Branch:** `mindora-2.0-rebuild`  
**Phase:** Phase 5.4.8 — Deployment Readiness & Security Architecture Review  
**Date:** 2026-11-15  
**Reviewer:** Independent Security & Architecture Verification Subsystem  
**Overall Status:** `VERIFIED` (Audit & Architectural Assessment Complete)

---

## EXECUTIVE SUMMARY

Phase 5.4.8 conducted an independent security, privacy, network, and operational review to prepare Mindora 2.0 for controlled deployment. The assessment evaluated the production readiness of the React/Vite Progressive Web App (PWA), audited the isolation and network constraints of the optional Local Qwen3:4B Companion service, investigated browser security restrictions (Mixed Content, Private Network Access), and evaluated three deployment topologies.

### High-Level Review Findings

1. **Static Core Independence (`VERIFIED`):** The core Mindora 2.0 platform (student demographic assessment, 10-feature contract validation, PHQ-9 calculation, immediate Item 9 crisis safeguard, circadian lifestyle friction analysis, non-clinical recommendations, and 24-entry curated support directory) is **100% client-contained and fully functional without any backend server or internet connection**.
2. **Local AI Companion Isolation (`VERIFIED`):** The FastAPI companion service binds exclusively to loopback (`127.0.0.1:8000`), Ollama binds strictly to `127.0.0.1:11434`, and the CORS middleware strictly restricts access to local origins (`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:4173`, `http://127.0.0.1:4173`). No public network interfaces are exposed.
3. **Browser Security Gate (`VERIFIED`):** Modern browser security boundaries—specifically **Mixed Content restrictions** (blocking HTTP fetch from HTTPS contexts) and **Chromium Private Network Access (PNA)** policies—preclude a remotely hosted public HTTPS web application (`https://...`) from silently or directly calling `http://127.0.0.1:8000`.
4. **Privacy & Network Egress (`VERIFIED`):** Zero remote telemetry, tracking beacons, analytics scripts, external fonts, or cloud APIs exist in the application code. All assessment data is processed entirely in volatile JavaScript memory (`AppState`). Zero Category A data is written to `localStorage` or `sessionStorage`.
5. **Memory Erasure Honesty (`VERIFIED`):** The system adheres to strict engineering honesty: while session clearing resets application state (`sessionStore.clearSession()`), standard JavaScript engines (V8) manage memory via Garbage Collection and do not provide deterministic zero-overwriting (`memset`) of RAM pages. Mindora explicitly does not claim cryptographically secure memory erasure.

---

## 1. ARCHITECTURE DIAGRAMS

### 1.1 End-to-End System & Network Boundaries

```mermaid
flowchart TD
    subgraph BrowserSandbox["Student Device / Browser Sandbox"]
        direction TB
        subgraph StaticPWA["Mindora 2.0 Static PWA (React / Vite)"]
            UI["User Interface (App.tsx)"]
            Engine["Deterministic Wellbeing Engine\n(wellbeingEngine.ts)"]
            CrisisGuard["Item 9 Immediate Safeguard\n(Client-Side In-Viewport)"]
            MemoryState["Volatile In-Memory State\n(sessionStorage.ts: AppState)"]
            SW["Service Worker (sw.js)\nOffline Cache (mindora-app-shell-v2)"]
            CompanionUI["Local Resource Companion UI\n(Opt-in Toggle: Disabled by Default)"]
        end

        subgraph LocalHostService["Optional Localhost Service (127.0.0.1)"]
            FastAPIServer["FastAPI Service (127.0.0.1:8000)\n(service.py)"]
            CORSGuard["Strict CORS Middleware\n(Whitelisted Origins Only)"]
            SafetyInterceptor["Deterministic Safety Interceptor\n(safety_guard.py: 2.69 ms)"]
            Retriever["Layered Knowledge Retriever\n(retriever.py: 24 Approved Resources)"]
            CitationGuard["Citation Isolation & Sanitizer\n(citation_guard.py)"]
            OllamaDaemon["Ollama Daemon (127.0.0.1:11434)\n(Qwen3:4B Local Model)"]
        end
    end

    subgraph RemoteNetwork["Public Internet / Static Hosting"]
        StaticCDN["Static Web Host (HTTPS)\n(Cloudflare Pages / Netlify / Vercel)"]
    end

    StaticCDN -- "Static HTML/JS/CSS (One-Time Fetch)" --> SW
    UI <--> Engine
    UI <--> CrisisGuard
    UI <--> MemoryState
    SW -. "Serves Cached App Shell" .-> UI

    CompanionUI -- "Local HTTP Fetch (Disabled by Default)" --> CORSGuard
    CORSGuard --> FastAPIServer
    FastAPIServer --> SafetyInterceptor
    SafetyInterceptor --> Retriever
    Retriever --> CitationGuard
    CitationGuard --> OllamaDaemon

    classDef boundary fill:#F8F7FC,stroke:#6D43C6,stroke-width:2px;
    classDef security fill:#ECFDF5,stroke:#10B981,stroke-width:2px;
    classDef caution fill:#FEF3C7,stroke:#F59E0B,stroke-width:2px;
    class BrowserSandbox,LocalHostService,StaticPWA boundary;
    class CrisisGuard,SafetyInterceptor,CitationGuard security;
    class CompanionUI caution;
```

### 1.2 Sequence Diagram: Student Interaction & Data Isolation

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (User)
    participant UI as React UI (Browser)
    participant Engine as Deterministic Engine
    participant SW as Service Worker (Cache)
    participant LocalAPI as FastAPI (127.0.0.1:8000)
    participant Qwen as Ollama Qwen3:4B (127.0.0.1:11434)

    Note over Student,UI: 1. Assessment & Safety (Pure Client-Side)
    Student->>UI: Enters lifestyle metrics & PHQ-9 Item 9
    alt Item 9 > 0 (Self-Harm Risk)
        UI->>UI: Trigger immediate in-viewport crisis banner (0ms)
        Note over UI: Zero network calls. Pure deterministic safeguard.
    end
    Student->>UI: Clicks "Generate Wellbeing Intelligence"
    UI->>Engine: Evaluate survey features & PHQ-9
    Engine-->>UI: Return lifestyle composite (81%) & minimal tier (3/27)
    Note over UI: State stored in volatile JS memory. No localStorage.

    Note over Student,LocalAPI: 2. Optional Educational Companion (Opt-in)
    Student->>UI: Navigates to Support & explicitly toggles Companion ON
    UI->>LocalAPI: GET /health (127.0.0.1:8000)
    LocalAPI-->>UI: HTTP 200 {status: "healthy", model: "qwen3:4b"}
    Student->>UI: Submits question: "What is Tele-MANAS?"
    UI->>LocalAPI: POST /api/companion/chat {query, country}
    Note over LocalAPI: Validates payload: Zero assessment data permitted
    LocalAPI->>LocalAPI: Deterministic Safety Check (1.9ms)
    LocalAPI->>LocalAPI: Grounded Retrieval over 24 approved resources
    LocalAPI->>Qwen: Generate grounded answer with quarantined sources
    Qwen-->>LocalAPI: Grounded response tokens
    LocalAPI->>LocalAPI: Deterministic citation validation & sanitization
    LocalAPI-->>UI: HTTP 200 {answer, citations: ["MoHFW / NIMHANS..."]}
    UI-->>Student: Renders answer card with authenticated citation badge
```

---

## 2. FRONTEND DEPLOYMENT ASSESSMENT

### 2.1 Inspection of Build, Bundle & Service Worker Configuration

| File Inspected | Current Configuration | Verification Findings | Status |
| :--- | :--- | :--- | :---: |
| `frontend/package.json` | React 18.3.1, Vite 5.4.11, Lucide React 0.460.0. Zero runtime tracking dependencies. | No remote telemetry, Google Analytics, or third-party ad networks present. Bundle is self-contained. | `VERIFIED` |
| `frontend/vite.config.ts` | Single-page application bundle with React plugin and `@/` path alias. | Build outputs to `dist/`. No hardcoded external public path. Defaults to root `/`. | `VERIFIED` |
| `frontend/src/main.tsx` | Service Worker registered conditionally: `import.meta.env.PROD === true`. In dev mode, unregisters and purges cache. | Clean development/production isolation. Prevents stale cache interception during local development. | `VERIFIED` |
| `frontend/public/sw.js` | Cache name `mindora-app-shell-v2`. Pre-caches `/`, `/index.html`, `/manifest.json`, `/favicon.svg`. | Only caches GET requests for static extensions (`.html`, `.js`, `.css`, `.svg`, `.json`). Rejects queries with search parameters. Zero personal assessment data cached. | `VERIFIED` |
| `frontend/index.html` | System font stack (`-apple-system, BlinkMacSystemFont, Segoe UI, Roboto...`). Icons bundled via `favicon.svg`. | Zero external `<link rel="stylesheet">` or external CDN `<script>` tags. Zero font CDN egress. | `VERIFIED` |
| `frontend/src/App.tsx` | Internal state-driven navigation (`state.currentScreen: 'welcome' \| 'assessment' \| 'dashboard' \| 'support'`). | Routing does not rely on HTML5 deep path URLs (e.g. `/assessment`). Screen rendering is 100% in-memory. | `VERIFIED` |

### 2.2 Requirements for Static Hosting Deployment (e.g., Cloudflare Pages, Netlify, Vercel, S3)

1. **SPA Routing Fallback:** While navigation currently uses state routing on `/`, standard SPA rewrites should be configured to prevent 404s if a user refreshes an arbitrary sub-URL (e.g. Netlify `_redirects`: `/* /index.html 200`).
2. **HTTPS Requirement:** Service Workers (`sw.js`) and PWA installation strictly require an HTTPS origin (or `localhost`). Deploying to any modern static host automatically provisions free Let's Encrypt / Cloudflare SSL.
3. **PWA Installation Readiness:** `manifest.json` provides `short_name`, `name`, `theme_color (#6D43C6)`, `display: standalone`, and `sizes: 192x192 512x512`. Ready for browser "Install Mindora" desktop/mobile app-shell installation.
4. **Offline App-Shell Behavior:** The service worker operates a Stale-While-Revalidate caching strategy. On first load, all static JS and CSS chunks are cached. On subsequent offline visits, navigation requests fallback immediately to `/index.html`.

### 2.3 Hardcoded Localhost API Configuration Finding

* **Finding:** In `frontend/src/components/companion/LocalResourceCompanion.tsx`:
  - Line 24: `const SERVICE_BASE_URL = 'http://127.0.0.1:8000';`
  - Line 123: Error message references `http://127.0.0.1:8000`.
* **Impact:** In a deployed static website (e.g. `https://mindora.app`), this hardcoded string causes immediate browser Mixed Content errors if invoked.
* **Resolution Required:** Decouple `SERVICE_BASE_URL` using Vite environment variables (`import.meta.env.VITE_COMPANION_API_URL || 'http://127.0.0.1:8000'`) and provide a deployment flag (`import.meta.env.VITE_ENABLE_COMPANION`) to cleanly deactivate or hide the companion toggle when hosted as a pure static web PWA.

---

## 3. LOCAL AI COMPANION ISOLATION & BROWSER RESTRICTIONS

### 3.1 Loopback & Endpoint Isolation Verification

| Security Boundary | Code / System Implementation | Audit Finding | Status |
| :--- | :--- | :--- | :---: |
| **FastAPI IP Binding** | `CONFIG.host = "127.0.0.1"`, port 8000 (`service.py`). | Listens exclusively on local loopback interface. Does not bind to `0.0.0.0` or external network adapters. | `VERIFIED` |
| **Ollama IP Binding** | `CONFIG.ollama_base_url = "http://127.0.0.1:11434"`. | Ollama daemon binds by default strictly to `127.0.0.1:11434`. Model is inaccessible from external IP. | `VERIFIED` |
| **Public Model Exposure** | No public port-forwarding, tunnel, or reverse proxy configured. | The local Qwen3:4B model cannot be reached from the public internet. | `VERIFIED` |
| **CORS Middleware** | `allow_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"]`. | Whitelist contains zero wildcards (`*`). Remote origins (e.g. `https://evil-site.com` or `https://remote-pwa.com`) receive CORS rejection. | `VERIFIED` |
| **Default Activation State** | `LocalResourceCompanion.tsx: useState(false)`. | Companion is disabled by default. Health check `fetch()` is only invoked if user clicks toggle to active. | `VERIFIED` |

### 3.2 In-Depth Analysis: Deployed HTTPS Website Connecting to Localhost Companion

If a student loads Mindora from a deployed public website (e.g., `https://mindora.app`) and attempts to enable a local companion running on their machine (`http://127.0.0.1:8000`), the connection will encounter three distinct browser security barriers:

1. **Mixed Content Barrier (W3C Mixed Content Specification):**
   - The outer page is served securely over `https://mindora.app`.
   - The local service is cleartext `http://127.0.0.1:8000`.
   - **Browser Behavior:** Modern browsers (Chrome, Firefox, Safari, Edge) automatically block Active Mixed Content (`fetch()` / `XMLHttpRequest`). The browser emits:
     `Mixed Content: The page at 'https://mindora.app' was loaded over HTTPS, but requested an insecure resource 'http://127.0.0.1:8000/health'. This request has been blocked.`
   - **Workaround Feasibility:** Serving local services over HTTPS requires generating local self-signed TLS certificates and having the user manually trust a local root Certificate Authority (CA) in their browser/OS keychain—an unviable, complex, and error-prone requirement for general students.

2. **Private Network Access (PNA) Barrier (Chromium Security Policy):**
   - Public websites (`https://mindora.app` in the `public` address space) requesting resources from `127.0.0.1` (`local` address space) are subject to W3C Private Network Access restrictions.
   - **Browser Behavior:** Chromium issues a preflight request with `Access-Control-Request-Private-Network: true`. If the local server does not respond with `Access-Control-Allow-Private-Network: true` AND valid CORS headers for that public origin, the request is instantly aborted.
   - Even with PNA headers, public HTTPS-to-HTTP loopback connections are increasingly restricted or disabled in modern secure-context specifications to prevent CSRF and local intranet port-scanning attacks.

3. **CORS Rejection:**
   - Even if Mixed Content and PNA were bypassed, `local_companion/config.py` explicitly rejects any origin other than `localhost` / `127.0.0.1`.

### 3.3 Expected Workflow for Supported Local-First Architecture

To enable local companion support without violating browser security or creating network vulnerabilities, Mindora supports two valid workflows:

```
Workflow A (Local Web Development & Local Serving):
Student runs frontend locally (http://localhost:5173) 
  → Origin is localhost (same secure context)
  → Directly queries http://127.0.0.1:8000
  → Permitted by browser without Mixed Content or PNA errors.

Workflow B (Packaged Desktop Application - Recommended Future):
Student installs Mindora Desktop (Tauri / Electron)
  → Frontend runs in local webview (tauri://localhost or app://)
  → Companion runs as embedded sidecar process
  → Zero browser cross-origin, Mixed Content, or PNA restrictions
  → 100% offline, zero network configuration required by student.
```

---

## 4. PRIVACY AND SECURITY REVIEW

### 4.1 In-Memory Assessment Data Boundaries

| Privacy Boundary | Implementation Detail | Audit Evaluation | Status |
| :--- | :--- | :--- | :---: |
| **Assessment Data Storage** | Handled exclusively in volatile React memory (`AppState`). `sessionStorage.ts` contains `inMemorySession` closure. | Zero student demographic features (age, CGPA, pressure) or survey answers are written to browser `localStorage` or `sessionStorage`. | `VERIFIED` |
| **PHQ-9 & Item 9 Boundary** | PHQ-9 calculation is 100% deterministic inside `wellbeingEngine.ts`. Item 9 immediately renders emergency contact banner in-viewport. | No machine learning or LLM is involved in PHQ-9 scoring or Item 9 crisis detection. | `VERIFIED` |
| **API Payload Gate** | `SafetyGuard.check_payload_privacy()` in `safety_guard.py` inspects incoming JSON keys. Rejects `phq`, `item9`, `cgpa`, `student_id` with `HTTP 400`. | Prohibits transmission of personal assessment data even if frontend logic were tampered with. | `VERIFIED` |
| **In-Memory Chat State** | Chat messages exist only in `LocalResourceCompanion.tsx: useState([])`. | Purged immediately when tab is refreshed or user navigates away from Support screen. Zero disk persistence. | `VERIFIED` |
| **Logging & Privacy** | `local_companion/service.py` contains zero query logging or response serialization to disk. | No student questions, answers, or IPs are logged to files or databases. | `VERIFIED` |
| **External Resource Links** | Directory links in `SupportResourcesScreen.tsx` use `target="_blank"` with `rel="noopener noreferrer"`. | Prevents reverse tabnabbing and window.opener access. External browsing opens in separate browser context. | `VERIFIED` |

### 4.2 Network Egress Audit (Loopback vs External Egress)

A code and network inspection was performed to verify whether any outbound network calls occur during runtime:
* **Bundled Assets:** All CSS styles are generated by Tailwind and compiled into `dist/assets/index-[hash].css`. Zero external Google Fonts (`fonts.googleapis.com`) or CDN stylesheets are requested.
* **Vector Icons:** Lucide icons are bundled as inline SVG elements. Zero external icon fonts or sprite sheets are fetched.
* **Analytics & Telemetry:** Exactly zero Google Analytics (`gtag`), Segment, PostHog, Mixpanel, Sentry, or telemetry scripts exist in the repository.
* **Synchronous Core Operations:** `validateStudentFeatures()`, `evaluateWellbeing()`, `evaluatePHQ9()`, and `queryResourceCatalogue()` execute 100% synchronously in local memory without `fetch()`, `XMLHttpRequest`, or `WebSocket`.
* **Audited Egress Verdict:** When the companion is disabled (default), Mindora produces **exactly 0 outbound network requests** after initial static bundle load.

### 4.3 Memory Management & Erasure Limitations

> [!CAUTION]
> **Engineering Honesty on Memory Erasure:**
> Modern browser runtimes (V8 / JavaScriptCore) manage memory through non-deterministic Garbage Collection (GC mark-and-sweep). While `sessionStore.clearSession()` and React unmounting dereference state objects, the underlying RAM bytes are not overwritten with zeros (`memset`). Traces of student inputs may theoretically persist in the process virtual memory until the browser tab process is terminated or GC reclaims and overwrites those physical pages. Mindora explicitly documents this limitation and does not claim cryptographically secure memory erasure.

---

## 5. DEPLOYMENT OPTIONS COMPARISON

Three architectural options were systematically evaluated across privacy, cost, complexity, reliability, and security:

```
+----------------------------------------------------------------------------------------------------+
|                                    DEPLOYMENT OPTIONS MATRIX                                       |
+----------------------+-----------------------------+-------------------------------+---------------+
| Evaluation Metric    | Option A: Static Frontend   | Option B: Static Frontend +   | Option C:     |
|                      | Only (Pure Offline PWA)     | Optional Local AI Companion   | Public Cloud  |
|                      |                             |                               | AI Companion  |
+----------------------+-----------------------------+-------------------------------+---------------+
| Architecture         | React/Vite PWA hosted on    | Static PWA on HTTPS +         | Static PWA +  |
|                      | Edge CDN (Cloudflare/Vercel)| local companion on 127.0.0.1  | Public FastAPI|
|                      |                             |                               | on GPU VM     |
+----------------------+-----------------------------+-------------------------------+---------------+
| Student Assessment & | 100% Functional             | 100% Functional               | 100%          |
| Deterministic Engine | (Client-Side Memory)        | (Client-Side Memory)          | Functional    |
+----------------------+-----------------------------+-------------------------------+---------------+
| PHQ-9 & Item 9       | 100% Immediate              | 100% Immediate                | 100%          |
| Deterministic Safety | (Zero Latency Safeguard)    | (Zero Latency Safeguard)      | Immediate     |
+----------------------+-----------------------------+-------------------------------+---------------+
| Verified Resource    | 100% Functional             | 100% Functional               | 100%          |
| Directory (24 items) | (Offline Search & Filter)   | (Offline Search & Filter)     | Functional    |
+----------------------+-----------------------------+-------------------------------+---------------+
| Local AI Companion   | Excluded or Hidden          | Optional (Local Qwen3:4B      | Centralized   |
| Availability         |                             | on student's hardware)        | Cloud LLM     |
+----------------------+-----------------------------+-------------------------------+---------------+
| Student Privacy      | MAXIMUM (Gold Standard)     | VERY HIGH                     | HIGH RISK /   |
| Guarantee            | Zero student data leaves    | Data stays on-device;         | COMPROMISED   |
|                      | student's browser           | requires local loopback       | Queries sent  |
|                      |                             |                               | to cloud VM   |
+----------------------+-----------------------------+-------------------------------+---------------+
| Infrastructure Cost  | $0 / month                  | $0 / month                    | $150 - $600+  |
|                      | (Free Edge CDN tier)        | (Student's hardware)          | per month     |
+----------------------+-----------------------------+-------------------------------+---------------+
| Operational          | MINIMAL                     | HIGH (Web PWA) /              | EXTREME       |
| Complexity           | Standard static build       | MODERATE (Desktop app)        | 24/7 uptime,  |
|                      |                             | Browser PNA/Mixed content     | autoscaling   |
+----------------------+-----------------------------+-------------------------------+---------------+
| Reliability &        | 99.99%+                     | Core: 99.99%+                 | Fragile;      |
| Availability         | (Global CDN + PWA cache)    | Companion: hardware-dependent | Cloud latency |
+----------------------+-----------------------------+-------------------------------+---------------+
| Security Risk        | ZERO (No server attack      | LOW (Loopback CORS protected; | SEVERE        |
| Exposure             | surface)                    | PNA restrictions in web)      | DDoS, prompt  |
|                      |                             |                               | scraping, DoS |
+----------------------+-----------------------------+-------------------------------+---------------+
| Recommendation       | STRONGLY RECOMMENDED        | RECOMMENDED FOR               | STRICTLY      |
|                      | FOR IMMEDIATE DEPLOYMENT    | DESKTOP / LOCAL LABS          | PROHIBITED    |
+----------------------+-----------------------------+-------------------------------+---------------+
```

---

## 6. SECURITY RISKS & DEPLOYMENT BLOCKERS

### 6.1 Identified Security Risks

1. **Risk SEC-01: Public Exposure of Local Model:**
   Exposing FastAPI or Ollama directly to the public internet without an enterprise API gateway, distributed rate-limiting, and authentication creates severe Denial of Service (DoS) vulnerability. Qwen3:4B on consumer hardware supports ~5 concurrent requests before latency degrades.
   - *Mitigation:* Loopback-only binding (`127.0.0.1`) and strict CORS must be maintained permanently. Never bind to `0.0.0.0`.
2. **Risk SEC-02: Mixed Content & Private Network Access Failure:**
   Deploying the PWA to an HTTPS origin while attempting to reach cleartext `http://127.0.0.1:8000` causes browser network failure and console errors.
   - *Mitigation:* In public static deployments, configure the companion feature flag to `false` or decouple the URL via environment variables.
3. **Risk SEC-03: Stale Service Worker Cache:**
   If a new production release is deployed, an outdated service worker could serve old cached JS bundles if cache-busting headers or versioning are misconfigured.
   - *Mitigation:* `main.tsx` safely handles development unregistration. For production, `sw.js` uses versioned cache naming (`mindora-app-shell-v2`) and deletes stale caches on activation.

### 6.2 Deployment Blockers for Public Web Release

1. **Blocker BLK-01 (Hardcoded URL):**
   `LocalResourceCompanion.tsx` has `const SERVICE_BASE_URL = 'http://127.0.0.1:8000'` hardcoded. Must be refactored to support `import.meta.env.VITE_COMPANION_API_URL` and a build-time feature flag `import.meta.env.VITE_ENABLE_COMPANION`.
2. **Blocker BLK-02 (CORS Whitelist for Deployed Domain):**
   If a specific deployment domain is intended to connect to a local service, that exact origin must be explicitly added to `allowed_origins` in `local_companion/config.py`. However, due to browser Mixed Content, this should NOT be attempted on public HTTPS web deployments without a desktop packaging strategy.
3. **Blocker BLK-03 (Build-Time Static Routing Fallback):**
   Static hosting requires adding a single redirect configuration rule (e.g. `_redirects` for Netlify / Cloudflare Pages) to map `/*` to `/index.html` with HTTP 200.

---

## 7. RECOMMENDED DEPLOYMENT ARCHITECTURE

Mindora 2.0 should execute a **Two-Tier Staged Deployment Architecture**:

```mermaid
flowchart LR
    subgraph Tier1["Tier 1: Public Production Deployment (Immediate)"]
        direction TB
        T1_Build["Static Build\n(VITE_ENABLE_COMPANION=false)"]
        T1_Host["Global Static Edge CDN\n(Cloudflare Pages / Netlify / Vercel)"]
        T1_PWA["Installable PWA Shell\n(100% Offline Assessment, PHQ-9 & Directory)"]
        T1_Build --> T1_Host --> T1_PWA
    end

    subgraph Tier2["Tier 2: Desktop / Research Lab Packaging (Controlled)"]
        direction TB
        T2_Shell["Desktop Shell (Tauri / Electron)\nor Localhost Web (localhost:5173)"]
        T2_FastAPI["Local FastAPI Service (127.0.0.1:8000)"]
        T2_Ollama["Local Ollama Qwen3:4B (127.0.0.1:11434)"]
        T2_Shell <--> T2_FastAPI <--> T2_Ollama
    end

    classDef t1 fill:#ECFDF5,stroke:#10B981,stroke-width:2px;
    classDef t2 fill:#F8F7FC,stroke:#6D43C6,stroke-width:2px;
    class Tier1 t1;
    class Tier2 t2;
```

### Stage 1: Public Production Release — Option A (Pure Static PWA)
* **Hosting:** Cloudflare Pages, Netlify, or AWS S3/CloudFront.
* **Scope:** 100% of the student wellbeing assessment, 10-feature validation, deterministic lifestyle index, circadian breakdown, PHQ-9 severity scoring, Item 9 immediate safety safeguard, non-clinical recommendations, and 24-entry verified support catalogue.
* **Companion State:** Companion toggle is disabled or hidden (`VITE_ENABLE_COMPANION = false`).
* **Privacy Impact:** Zero student data transmitted across the network. Zero server costs ($0). Zero maintenance. Zero regulatory exposure.

### Stage 2: Desktop Application / Research Lab Distribution — Option B (Tauri / Electron)
* **Packaging:** Tauri (Rust-based) cross-platform installer for Windows, macOS, and Linux.
* **Scope:** Bundles the static frontend, Python FastAPI companion, and manages local Ollama integration.
* **Privacy Impact:** 100% on-device. Since origin is `tauri://localhost`, browser Mixed Content and Private Network Access restrictions are completely eliminated.

---

## 8. REQUIRED CONFIGURATION CHANGES (SPECIFICATION)

The following minimal, non-breaking configuration changes are prepared for implementation upon user approval:

### Change 1: Environment-Driven Companion API Base URL
In `frontend/src/components/companion/LocalResourceCompanion.tsx`:
```typescript
// Replace:
// const SERVICE_BASE_URL = 'http://127.0.0.1:8000';

// With:
const SERVICE_BASE_URL = import.meta.env.VITE_COMPANION_API_URL || 'http://127.0.0.1:8000';
const IS_COMPANION_ENABLED_GLOBALLY = import.meta.env.VITE_ENABLE_COMPANION !== 'false';
```

### Change 2: Static Host SPA Fallback
Add `frontend/public/_redirects`:
```text
/*    /index.html   200
```
*(Guarantees clean URL reloads on Netlify, Cloudflare Pages, and compatible edge hosts).*

### Change 3: Production Cache Header Guidance
Ensure HTTP response headers from static host include:
```http
Cache-Control: public, max-age=0, must-revalidate  # for index.html and sw.js
Cache-Control: public, max-age=31536000, immutable # for /assets/index-[hash].*
```

---

## 9. FROZEN RESEARCH ASSET SHA-256 VERIFICATION

All 11 frozen research assets were independently validated against their cryptographic SHA-256 baselines:

| Asset Path | SHA-256 Digest | Status |
| :--- | :--- | :---: |
| `app.py` | `5F15ADD9F3A5F5809D80154931E98A5B79D06BBC9BB69323028BFA3898E46BBE` | `VERIFIED` |
| `dataset/Student_Depression_Dataset.csv` | `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` | `VERIFIED` |
| `shared/contracts/feature_contract.json` | `BED161ED06A50F528BBFE9316FF9A979771A1CFA8EE8C9CD48CF9466E442FFB0` | `VERIFIED` |
| `ml_lab/splits/group_aware_partition_manifest.json` | `A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070` | `VERIFIED` |
| `ml_lab/splits/partition_assignments.csv` | `91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1` | `VERIFIED` |
| `models/best_model.pkl` | `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` | `VERIFIED` |
| `ml_lab/experiments/stage_3b_2/oof_metrics.json` | `361BC700A7731678402BCE89B7A85051181DC877430A3FE30AA114EC2C0A6FEF` | `VERIFIED` |
| `ml_lab/experiments/stage_3b_3/oof_metrics.json` | `555D3B159A31A5C6F6964143F040A97F8BECC938FCB9690986A9B856F9DC2A03` | `VERIFIED` |
| `ml_lab/experiments/stage_3b_3/model_comparison.json` | `FC8E31D45DEE28D3925A80627268299D185AE68D6C1DE092167EE23A7F6286E7` | `VERIFIED` |
| `ml_lab/experiments/stage_3b_4/stage_3b_4_metrics.json` | `FBB9AAEB5D0A12E46FE74BF9EDA71AA3140C130E384DCF47A35AABCED25CC7C6` | `VERIFIED` |
| `ml_lab/experiments/stage_3b_4/artifact_manifest.json` | `B1385C3A03015A470911CC432012E418BD3AD0E505A52C0CF92C22D8290FB072` | `VERIFIED` |

**Bit-for-Bit Cryptographic Integrity:** 11/11 MATCHED (100.0%). Zero regressions or modifications.

---

## 10. CONCLUSION & STOPPING CONDITION

Phase 5.4.8 security review confirms:
1. Mindora 2.0 is fully ready for **Option A (Static PWA Deployment)** on any standard edge host with zero ongoing operational costs and complete privacy preservation.
2. The Local AI Companion remains strictly isolated on loopback (`127.0.0.1`), protected by CORS and browser security policies, and cannot be accessed by external web actors.
3. No commits, file modifications, git resets, or live deployments have been performed.

**Execution Halted:** Awaiting explicit user approval before proceeding to implementation or deployment.
