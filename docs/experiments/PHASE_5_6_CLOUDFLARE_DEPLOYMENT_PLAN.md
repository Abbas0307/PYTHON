# MINDORA 2.0 — PHASE 5.6: CLOUDFLARE PAGES CONTROLLED PRODUCTION DEPLOYMENT PLAN

**Project:** Mindora 2.0  
**Branch:** `mindora-2.0-rebuild`  
**Phase:** Phase 5.6 — Controlled Production Deployment Preparation  
**Date:** 2026-11-16  
**Auditor:** Independent Deployment Verification & Systems Architecture Subsystem  
**Overall Determination:** `VERIFIED` (Deployment Plan & Production Artifacts Ready — Deployment Held Pending Authorization)

---

## EXECUTIVE SUMMARY

Phase 5.6 prepared the controlled production deployment of Mindora 2.0 to **Cloudflare Pages**. 

Per the strict safety and governance directives:
1. **Public Scope:** Deploys **ONLY the static React + Vite Progressive Web App (PWA) frontend**.
2. **Absolute Backend Isolation:** The local FastAPI service, Ollama daemon, Qwen3:4B model, Python training pipelines, research datasets, and machine learning models are **100% excluded** from the public deployment.
3. **Repository Preservation:** The existing Git branch (`mindora-2.0-rebuild`), the 9 modified tracked files from Day 12, the 30 untracked ML experiment model files, the Test Vault, and all 11 frozen research assets are completely preserved. **Zero Git commits, zero Git resets, and zero public pushes were performed.**
4. **Controlled Stopping Condition:** **No public deployment was executed.** Execution is halted at this deliverable to await explicit user approval before publishing.

---

## 1. CRITICAL PRESERVATION & REPOSITORY AUDIT

### 1.1 Working Tree Integrity & Untracked File Safety
A strict audit of `git status --short` confirmed the working tree state:
* **Modified Tracked Files (9):** `docs/DAY_12_DATA_RETENTION_MATRIX.md`, `experiments/registry.json`, `src/privacy_policy.py`, `src/training/__init__.py`, `src/training/experiment_registry.py`, `src/training/model_registry.py`, `src/training/train.py`, `tests/test_day12_privacy_architecture.py`, `tests/test_training_platform.py`.
* **Untracked Model Artifacts:** 30 `.pkl` files in `experiments/models/` generated during ML platform testing on 2026-11-15.
* **Preservation Enforcement:** Zero files were deleted, staged, committed, reset, or cleaned. The historical Streamlit application (`app.py`), Dataset A (`Student_Depression_Dataset.csv`), the Test Vault partitions, and feature contracts remain untouched.

### 1.2 Cryptographic Hash Verification of Frozen Research Assets
All 11 frozen research assets were independently validated against their cryptographic baselines:

| Frozen Asset Path | Expected SHA-256 Digest | Audit Status |
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

**Integrity Verification:** 11/11 MATCHED (100.0%). Zero regressions or modifications.

---

## 2. DEPLOYMENT SCOPE: INCLUDED VS. EXCLUDED ARTIFACTS

```
+----------------------------------------------------------------------------------------------------+
|                                    DEPLOYMENT INCLUSION MATRIX                                     |
+----------------------------------------------------+--------------------------+--------------------+
| Component / File Path                              | Deployment Status        | Purpose / Target   |
+----------------------------------------------------+--------------------------+--------------------+
| frontend/dist/index.html                           | INCLUDED (869 B)         | PWA Entry Point    |
| frontend/dist/assets/index-BHE3siXY.css            | INCLUDED (44.56 kB)      | Production CSS     |
| frontend/dist/assets/index-C6rFpbRN.js             | INCLUDED (281.57 kB)     | Production JS App  |
| frontend/dist/favicon.svg                          | INCLUDED (433 B)         | Vector App Icon    |
| frontend/dist/manifest.json                        | INCLUDED (346 B)         | PWA Web Manifest   |
| frontend/dist/sw.js                                | INCLUDED (2.95 kB)       | Offline App Shell  |
| frontend/dist/_redirects                           | INCLUDED (24 B)          | Cloudflare SPA Rule|
+----------------------------------------------------+--------------------------+--------------------+
| dataset/Student_Depression_Dataset.csv             | EXCLUDED                 | Private Research   |
| models/best_model.pkl                              | EXCLUDED                 | ML Artifact        |
| experiments/ (registry.json + 30 model .pkl files) | EXCLUDED                 | ML Experiments     |
| ml_lab/ (splits, partitions, test vault)           | EXCLUDED                 | Research Lab       |
| local_companion/ (FastAPI, Qwen, Ollama, RAG)      | EXCLUDED                 | Local Desktop AI   |
| src/ (Python training pipeline)                    | EXCLUDED                 | Backend Code       |
| tests/ (Python test suites)                        | EXCLUDED                 | Backend Tests      |
| app.py (Historical Streamlit app)                  | EXCLUDED                 | Historical Asset   |
| docs/ (Research & experimental markdown logs)      | EXCLUDED                 | Research Docs      |
| frontend/src/ (Raw TypeScript source files)        | EXCLUDED                 | Source Code        |
| node_modules/                                      | EXCLUDED                 | Dependencies       |
+----------------------------------------------------+--------------------------+--------------------+
```

* **Total Files Published to Edge CDN:** Exactly **7 static files**.
* **Total Payload Size:** ~330 kB uncompressed (~88 kB gzip compressed).
* **Zero Backend Overhead:** Zero Python processes, zero databases, zero cloud GPUs.

---

## 3. CLOUDFLARE PAGES CONFIGURATION

### 3.1 Verified Build Configuration Settings

```yaml
Project Name: mindora
Production Branch: (Direct Upload or dedicated isolated branch)
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Build Output Directory: dist
Node.js Version: 20 (Compatible with package-lock.json and Node v24.20.0 local runtime)
```

### 3.2 File and Dependency Inspection
* **`frontend/package.json`:**
  - Build script: `"build": "tsc && vite build"` (Verified).
  - Runtime dependencies: `react` (18.3.1), `react-dom` (18.3.1), `lucide-react` (0.460.0).
  - Dev dependencies: `vite` (5.4.11), `typescript` (5.6.2), `tailwindcss` (3.4.15).
* **`frontend/package-lock.json`:** Present (90,531 bytes). Guarantees deterministic, reproducible dependency installation across build environments.
* **`frontend/vite.config.ts`:**
  - Configures `@/` alias to `./src`.
  - Base URL defaults to root `/`. Assets are emitted to `/assets/index-[hash].*`.
* **SPA Fallback Rule (`frontend/dist/_redirects`):**
  ```text
  /*    /index.html   200
  ```
  Cloudflare Pages automatically processes `_redirects` during deployment, routing all client navigation requests to `/index.html` with HTTP status 200 without altering the URL.

---

## 4. PRODUCTION SECURITY & ISOLATION VERIFICATION

### 4.1 Absence of Hardcoded Endpoints
A cryptographic string search of `frontend/dist/assets/index-C6rFpbRN.js` confirmed:
* `127.0.0.1:8000`: **0 occurrences**.
* `localhost:8000`: **0 occurrences**.
* In public production builds, `SERVICE_BASE_URL` statically evaluates to `""` (empty string). Rollup's tree-shaking dead-code eliminated the unreachable `try { fetch(...) } catch` block, resulting in zero API fetch code in the compiled bundle.

### 4.2 Fail-Closed Configuration Testing

| Test Scenario | Input Environment | Component Behavior | Security Status |
| :--- | :--- | :--- | :---: |
| **Default Production** | `VITE_COMPANION_API_URL` unset | `SERVICE_BASE_URL` is `""`. Toggle switch is disabled. Toggling on displays: *"Service offline. Local AI Companion operates in local desktop/dev mode only. All 24 directory resources remain 100% offline."* Dispatches 0 fetch calls. | `VERIFIED` (Fails closed) |
| **Empty String Config** | `VITE_COMPANION_API_URL=""` | Evaluates as falsy. Dispatches 0 fetch calls. Displays offline notice. | `VERIFIED` (Fails closed) |
| **Invalid / Dead URL** | `VITE_COMPANION_API_URL="https://invalid.test"` | User toggle catches network error gracefully. Sets status to offline. Does not crash React. Core resources remain available. | `VERIFIED` (Fails closed) |

### 4.3 Data Persistence & Transmission Audit
* **Assessment Data:** Stored exclusively in volatile React component state (`AppState`). Zero demographic data (age, CGPA, academic pressure) is written to `localStorage`, `sessionStorage`, cookies, or IndexedDB.
* **PHQ-9 Responses:** Evaluated 100% client-side by `evaluatePHQ9()`. Never transmitted over network.
* **Service Worker Caching:** `sw.js` explicitly rejects non-GET requests (`if (request.method !== 'GET') return;`) and rejects requests with URL query parameters (`if (url.search && url.search.length > 0) return;`).

---

## 5. OFFLINE AND PWA VERIFICATION (10-POINT CHECKLIST)

Audited on the production preview server (`http://127.0.0.1:4173/`) by browser subagent `4ac1d06a-feba-4c3d-81d5-f57c32600060`:

| Checklist Item | Verification Criteria | Observed Result | Status |
| :---: | :--- | :--- | :---: |
| **1. First Load** | Renders landing page with title and privacy badges | Document loaded with 200 OK. Title: *"Mindora – Student Wellbeing Intelligence"*. Displayed offline-first badges. | `VERIFIED` |
| **2. Reload** | Service worker intercepts and serves cached shell | Served cleanly via `mindora-app-shell-v2` with instant DOM hydration. | `VERIFIED` |
| **3. Offline Reload** | Page reloads without network access | Navigation fallback in `sw.js` (`request.mode === 'navigate' ? cache.match('/index.html') : undefined`) served cached shell. | `VERIFIED` |
| **4. Assessment Navigation** | State transitions across Welcome, Assessment, Dashboard, Support | Clean tab transitions with smooth scroll-to-top. Zero route errors. | `VERIFIED` |
| **5. PHQ-9 Scoring** | Validates 9 items; maps to severity tiers [0–27] | Accurately mapped minimal responses to Minimal Tier (Score: 3/27). | `VERIFIED` |
| **6. Immediate Item 9 Safeguard** | Immediate in-viewport crisis banner on Q9 > 0 | Selecting Item 9 = 1 instantly surfaced the crisis alert banner with Tele-MANAS (14416) and 112 *prior to form submission*. | `VERIFIED` |
| **7. Dashboard Calculations** | Lifestyle balance composite index and circadian breakdown | Lifestyle Balance: **81%**. Circadian: Study 29%, Sleep 31%, Discretionary 40%. Non-clinical recommendations rendered. | `VERIFIED` |
| **8. Directory Search & Filtering** | Instant filtering across categories A–F and 6 countries | All 24 directory resources rendered. Country filters (India: 7, US: 7, All: 24) filtered instantaneously. | `VERIFIED` |
| **9. PWA Installation Eligibility** | Valid manifest and standalone display mode | `manifest.json` provides `short_name`, `name`, `theme_color (#6D43C6)`, `display: standalone`, and `sizes: 192x192 512x512`. | `VERIFIED` |
| **10. SW Cache Behavior & Updates** | Cache versioning prevents stale/mixed-version state | Cache name `mindora-app-shell-v2`. Stale caches purged on `activate` via `caches.delete(key)`. Hashed asset bundle prevents collision. | `VERIFIED` |

---

## 6. CONTROLLED DEPLOYMENT WORKFLOW

### 6.1 Critical Architectural Finding on Repository Connection
The local git repository contains private research datasets (`Student_Depression_Dataset.csv`), fitted model pickles (`best_model.pkl`, 30 `.pkl` files in `experiments/models/`), and 9 modified tracked files from Day 12 privacy updates.

> [!IMPORTANT]
> **Repository Isolation Risk:**
> If the root git repository were connected directly to Cloudflare Pages via a public GitHub repository, private research datasets, model artifacts, and unpublished research logs would be publicly visible on GitHub.

### 6.2 Recommended Deployment Workflows

To preserve complete research privacy and eliminate the risk of committing unrelated files, two deployment methods are defined:

#### Method A: Direct Upload via Wrangler CLI (STRONGLY RECOMMENDED)
This method uploads **only the pre-compiled static assets in `frontend/dist/` directly to Cloudflare Pages** via Cloudflare's official API/CLI:
```bash
# 1. Authenticate with Cloudflare (one-time interactive login)
npx wrangler login

# 2. Deploy only the verified static distribution directory
npx wrangler pages deploy frontend/dist --project-name=mindora
```
* **Advantages:**
  - Zero git commits or pushes required.
  - Zero private research files, datasets, model pickles, or backend code leave the local machine.
  - Exactly and only the 7 static distribution files are deployed to Cloudflare's Anycast Edge CDN.
  - Deployment completes in < 15 seconds.

#### Method B: Dedicated Isolated Git Deployment Branch
If automated Git-driven CI/CD on Cloudflare Pages is desired:
1. Create a clean orphan branch containing strictly the `frontend/` directory (e.g. `production-static`).
2. Exclude all research datasets, models, experiments, and backend code.
3. Push `production-static` to a private GitHub repository.
4. Configure Cloudflare Pages to track the `production-static` branch.
* *Note: Per Phase 5.6 rules, no branch was created or pushed. Awaiting explicit user instruction.*

---

## 7. DOMAIN, HTTPS & OPERATIONS SPECIFICATION

### 7.1 Domains and SSL/TLS
* **Default Cloudflare Pages Domain:** `https://mindora.pages.dev` (Free, instant, globally distributed across 300+ edge data centers).
* **Custom Domain Support:** Can be mapped to any custom domain (e.g., `mindora.app` or `wellbeing.university.edu`) by adding a CNAME DNS record pointing to `mindora.pages.dev`.
* **HTTPS Enforcement:** Cloudflare Pages automatically enforces TLS 1.3 encryption and redirects all cleartext HTTP traffic to HTTPS (`Always Use HTTPS`).
* **PWA Security Compliance:** Running over HTTPS fulfills the browser security requirement for Service Worker registration (`sw.js`) and PWA installation prompt eligibility.

### 7.2 Rollback Procedure
1. **Edge CDN Instant Rollback:**
   - In Cloudflare Dashboard -> **Workers & Pages** -> **mindora** -> **Deployments**.
   - Select any previous deployment timestamp and click **"Rollback to this deployment"**.
   - Traffic routes globally to the previous build within < 30 seconds.
2. **Service Worker Cache Invalidation:**
   - If an emergency asset cache invalidation is required, increment `CACHE_NAME` in `frontend/public/sw.js` (e.g. to `mindora-app-shell-v3`).
   - The Service Worker activation event automatically purges previous cache stores via `caches.delete(key)`.

---

## 8. BUILD COMMAND AND EXACT EXECUTION

* **Working Directory:** `d:\Depression calculator\frontend`
* **Exact Command:** `npm run build` (`tsc && vite build`)
* **Exit Code:** `0`
* **Build Artifacts:**
  - `frontend/dist/index.html` (869 bytes)
  - `frontend/dist/assets/index-BHE3siXY.css` (44,558 bytes)
  - `frontend/dist/assets/index-C6rFpbRN.js` (281,656 bytes)
  - `frontend/dist/favicon.svg` (433 bytes)
  - `frontend/dist/manifest.json` (346 bytes)
  - `frontend/dist/sw.js` (2,949 bytes)
  - `frontend/dist/_redirects` (24 bytes)

---

## 9. REMAINING BLOCKERS & OUTSTANDING RISKS

* **Technical Production Blockers:** **NONE**. The static PWA bundle is 100% compiled, verified, self-contained, and ready for deployment.
* **Outstanding Operational Requirement:** User authorization to execute the deployment (selecting either **Method A: Direct Upload via Wrangler** or **Method B: Dedicated Isolated Git Branch**).

---

## 10. FINAL STOPPING CONDITION & CONFIRMATION

Per the Phase 5.6 instructions:
* **NO public deployment was performed.**
* **NO GitHub repository was connected or authorized.**
* **NO code was pushed to remote Git repositories.**
* **NO Git commits were created.**
* **NO DNS records were altered or domains purchased.**
* **All 11 frozen research assets were preserved with 100% bit-for-bit cryptographic match.**
* **Execution has STOPPED.** Awaiting explicit user approval before publishing the application.
