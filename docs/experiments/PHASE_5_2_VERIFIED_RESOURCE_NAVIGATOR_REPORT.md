# MINDORA 2.0 — PHASE 5.2: VERIFIED RESOURCE NAVIGATOR REPORT

**Execution Date:** 2026-11-15  
**Project:** Mindora 2.0 (Offline-First Student Wellbeing Intelligence Platform)  
**Branch:** `mindora-2.0-rebuild`  
**Execution Phase:** Phase 5.2 — Verified Resource Navigator  
**Status:** COMPLETE & VERIFIED  

---

## 1. Executive Summary

Phase 5.2 successfully engineered and verified the **Student Support Resource Navigator** for Mindora 2.0. The navigator provides a robust, evidence-backed, offline-accessible directory connecting students with verified crisis helplines, emergency services, and academic resilience resources across six authorized jurisdictions.

### Key Milestones Achieved:
1. **Single Authoritative Source of Truth:** Implemented `frontend/src/data/resourceCatalogue.ts` containing 24 fully typed, verified resources across Categories A–F, eliminating directory fragmentation across the application.
2. **Strict Category Taxonomy & Emergency Isolation:** Formally segregated immediate emergency dispatch (Category A) from non-dispatch crisis counseling (Category B). Immediate emergency numbers (112, 911, 999, 000) are explicitly labeled with persistent safety warnings that they connect to physical first responders, whereas Category B helplines (988, Tele-MANAS, Lifeline) provide confidential emotional listening.
3. **Provable Offline Reliability:** Statically bundled into the client-side single-page application. All phone numbers, operating hours, and guidance execute 100% synchronously in local device memory without requiring an internet connection or external API fetch.
4. **Interactive Navigation & UI Polish:** Updated `SupportResourcesScreen.tsx` with dynamic real-time search (by name, keyword, phone, or verification authority), country filters, category filter pills (A–F), and emergency notice callouts.
5. **Unified Component Integration:** Refactored `CrisisBanner.tsx` and `App.tsx` to source directly from `getNationalCrisisSummary` in `resourceCatalogue.ts`.
6. **Automated Verification:** Added 9 unit and integration tests (`phase_5_2_resource_navigator.test.mjs`). All 23 frontend tests pass in 118ms; all 171 backend tests (183 pytest targets) pass 100%; production Vite build completes with zero errors.
7. **Strict Research Invariants Preserved:** All 11 frozen research assets verified bit-for-bit with SHA-256 hashes matching prior stages. Zero Git commits executed.

---

## 2. Resource Catalogue Architecture & Schema

The resource directory is codified in `frontend/src/data/resourceCatalogue.ts`. Each resource adheres to the `SupportResource` TypeScript interface:

```typescript
export interface SupportResource {
  id: string;
  name: string;
  countryOrRegion: SupportedCountry | 'Global';
  category: ResourceCategory;
  categoryLabel: string;
  telephoneNumber?: string;
  dialableNumber?: string;
  smsContact?: string;
  website: string;
  operatingHours: string;
  eligibilityRestrictions: string;
  isEmergencyDispatch: boolean;
  summary: string;
  description: string;
  officialVerificationSource: string;
  verificationSourceUrl: string;
  lastVerificationDate: string; // ISO 8601 YYYY-MM-DD
  verificationStatus: VerificationStatus; // 'VERIFIED' | 'UNVERIFIED'
}
```

### Category Taxonomy (Categories A–F)

| Category Code | Key | Domain & Description | Badge Variant |
| :---: | :--- | :--- | :---: |
| **A** | `emergency_dispatch` | **Immediate Emergency Dispatch:** Dial for immediate danger to life, medical emergencies, or physical safety threats. Dispatches first responders. | `amber` |
| **B** | `crisis_counselling` | **Crisis & Mental Health Counselling:** Free, confidential, 24/7 listening services and psychological support provided by qualified counselors. | `rose` |
| **C** | `student_wellbeing` | **Student Wellbeing & Educational Support:** Collegiate mental health initiatives, stress reduction programs, and peer community support. | `emerald` |
| **D** | `sleep_recovery` | **Sleep & Recovery Education:** Evidence-based circadian pacing, sleep architecture optimization, and restorative rest strategies. | `violet` |
| **E** | `academic_resilience` | **Academic Resilience Resources:** Ultradian study pacing (50/10 protocol), exam stress buffering, and cognitive fatigue ergonomics. | `slate` |
| **F** | `international_directory` | **International Directories:** Global search tools and crisis helpline networks operating across 130+ nations. | `violet` |

> [!IMPORTANT]
> **Emergency Dispatch Segregation Rule:**  
> The property `isEmergencyDispatch` is set to `true` **strictly and exclusively** for Category A resources. Under no circumstance may a Category B helpline or educational guide possess `isEmergencyDispatch: true`. This invariant is verified by automated test `phase_5_2_resource_navigator.test.mjs`.

---

## 3. Jurisdiction Coverage & Provenance Matrix

In strict adherence to project constraints, coverage is constrained to the **6 authorized jurisdictions**: India, United States, Canada, United Kingdom, Australia, and International / Global. No unauthorized countries have been added.

All 24 catalogue entries possess a verified provenance source, source URL, and verification date of `2026-11-15`:

| Resource ID | Name | Country | Cat | Contact Number | Official Verification Source | Status |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| `in-emergency-112` | National Emergency Services | India | A | `112` | Ministry of Home Affairs (MHA), Govt. of India — ERSS | VERIFIED |
| `in-tele-manas` | Tele-MANAS Mental Health Helpline | India | B | `14416 / 1800-89-14416` | Ministry of Health and Family Welfare (MoHFW) / NIMHANS | VERIFIED |
| `in-kiran-helpline` | KIRAN Mental Health Rehabilitation | India | B | `1800-599-0019` | Department of Empowerment of Persons with Disabilities, MSJE | VERIFIED |
| `in-vandrevala-foundation` | Vandrevala Foundation Helpline | India | B | `+91 9999 666 555` | Vandrevala Foundation for Mental Health (Section 8 Charity) | VERIFIED |
| `us-emergency-911` | Emergency Dispatch Services | US | A | `911` | National 911 Program, NHTSA, US Dept. of Transportation | VERIFIED |
| `us-988-lifeline` | 988 Suicide & Crisis Lifeline | US | B | `988 (Call or Text)` | SAMHSA, US Dept. of Health and Human Services (HHS) | VERIFIED |
| `us-crisis-text-line` | Crisis Text Line | US | B | `Text HOME to 741741` | Crisis Text Line (501(c)(3) Public Charity) | VERIFIED |
| `us-trevor-project` | The Trevor Project (LGBTQ+ Youth) | US | B | `1-866-488-7386` | The Trevor Project Inc. (National LGBTQ Youth Charity) | VERIFIED |
| `ca-emergency-911` | Emergency Dispatch Services | Canada | A | `911` | Public Safety Canada / Sécurité publique Canada | VERIFIED |
| `ca-988-helpline` | 988 Suicide Crisis Helpline | Canada | B | `988 (Call or Text)` | Public Health Agency of Canada (PHAC) / CAMH | VERIFIED |
| `ca-kids-help-phone` | Kids Help Phone (Jeunesse, J'écoute) | Canada | B | `1-800-668-6868` | Kids Help Phone Canada (Federally Registered Charity) | VERIFIED |
| `uk-emergency-999` | Emergency Services | UK | A | `999 (or 112)` | Home Office, UK Govt / National Health Service (NHS England) | VERIFIED |
| `uk-nhs-111` | NHS 111 Mental Health Services | UK | B | `111` | National Health Service (NHS England, Scotland, Wales) | VERIFIED |
| `uk-lifeline-ni` | Lifeline Northern Ireland | UK | B | `0808 808 8000` | Public Health Agency (PHA) Northern Ireland / HSC | VERIFIED |
| `uk-samaritans` | Samaritans (Pan-UK & Ireland) | UK | B | `116 123` | Samaritans (UK Registered Charity 219432) | VERIFIED |
| `uk-shout-text` | Shout Crisis Text Line | UK | B | `Text SHOUT to 85258` | Mental Health Innovations (Registered UK Charity 1175670) | VERIFIED |
| `au-emergency-000` | Triple Zero (000) Emergency Services | Australia | A | `000` | Department of Home Affairs, Australian Government | VERIFIED |
| `au-lifeline` | Lifeline Australia | Australia | B | `13 11 14` | Lifeline Australia (Supported by Dept. of Health and Aged Care) | VERIFIED |
| `au-beyond-blue` | Beyond Blue Support Service | Australia | B | `1300 22 4636` | Beyond Blue Limited (National Mental Health Initiative) | VERIFIED |
| `intl-find-a-helpline` | Find A Helpline Global Directory | Intl | F | `findahelpline.com` | Live For Tomorrow & Tech Matters / Lifeline International | VERIFIED |
| `intl-befrienders` | Befrienders Worldwide | Intl | F | `befrienders.org` | Befrienders Worldwide (UK Registered Charity 1184318) | VERIFIED |
| `edu-active-minds` | Active Minds Student Hub | Global | C | `activeminds.org` | Active Minds Inc. (National 501(c)(3) Nonprofit) | VERIFIED |
| `edu-sleep-architecture` | Circadian Pacing & Rest Architecture | Global | D | `sleepeducation.org` | American Academy of Sleep Medicine (AASM) | VERIFIED |
| `edu-ultradian-pacing` | Ultradian Academic Pacing (50/10) | Global | E | `learningcenter.unc.edu`| Learning Center, University of North Carolina at Chapel Hill | VERIFIED |

### Regional Nuance Safeguards:
- **Northern Ireland NHS Exemption:** The directory explicitly notes that the England NHS 111 mental health pathway does not operate in Northern Ireland, providing **Lifeline NI (0808 808 8000)** as the dedicated regional 24/7 crisis service.
- **Cross-Border Dialing Warnings:** All national crisis cards and header summaries warn students that domestic crisis lines cannot be dialed across international borders.

---

## 4. Component Integration & User Experience

### 1. `SupportResourcesScreen.tsx` Enhancements
- **Dynamic Live Search:** Instant filtering across title, description, phone number, and official source authority.
- **Country Filter Bar:** Quick pills for All Countries, India, United States, Canada, United Kingdom, Australia, and International. Synchronizes two-way with global header country state via `onCountryChange`.
- **Category Filter Tabs:** Dedicated filter pills for Categories A through F.
- **Emergency Safeguard Banner:** Displayed when Category A resources are visible, clearly warning students:
  > *"Category A (Emergency Dispatch) connects directly to emergency first responders (police, fire, ambulance) for immediate threats to life, severe physical harm, or acute medical emergencies. Category B (Crisis Helplines) provides free, confidential listening and emotional counseling, but responders cannot dispatch physical emergency units."*
- **Resource Cards:** Include category badges, verified status chips (`Verified 2026-11-15`), operating hours, eligibility constraints, official source citations, and direct `tel:` dialing and external website actions.
- **Empty State with Recovery Action:** Friendly zero-results prompt with a one-click "Reset All Filters" button.

### 2. `CrisisBanner.tsx` Integration
`CrisisBanner.tsx` now calls `getNationalCrisisSummary(country)` directly from `resourceCatalogue.ts`, ensuring that all emergency phone numbers, primary counseling hotlines, and secondary contacts update atomically across the application shell.

---

## 5. Verification & Test Accounting

### 1. Frontend Test Suite Execution
Executed `npm --prefix frontend test`:
```
> mindora-frontend@2.0.0 test
> node --test test/frontend_unit.test.mjs test/phase_5_1_product_integration.test.mjs test/phase_5_2_resource_navigator.test.mjs

✔ Feature contract contains strictly 10 approved features (23.9085ms)
✔ Privacy Policy correctly segregates Category A sensitive data (1.2929ms)
✔ PHQ-9 evaluation calculates exact severity and triggers Item 9 safeguard (5.527ms)
✔ Lifestyle engine analyzes sleep, study hours and nourishment friction (1.3341ms)
✔ Crisis directory maintains exact national and regional pathways (1.3565ms)
✔ Service worker strictly caches only static assets and excludes dynamic data (0.3776ms)
✔ Preview mode state is cleanly separated from unassessed default state (2.2753ms)
✔ Deterministic calculations enforce exact mathematical bounds [0, 100] (0.346ms)
✔ validateStudentFeatures gracefully sanitizes missing, out-of-bounds, or NaN inputs (32.0506ms)
✔ Assessment completion calculates exact deterministic scores without clinical diagnostic claims (0.5844ms)
✔ PHQ-9 Item 9 triggers independent safety safeguard immediately (0.1991ms)
✔ Recommendations connect to approved deterministic rules with factor links and disclaimers (0.2487ms)
✔ Session reset restores initial state and purges derived assessment results (4.1888ms)
✔ Engine executes 100% synchronously in local client memory with zero fetch calls (0.236ms)
✔ Resource catalogue schema strictly adheres to type specifications with zero missing fields (29.5381ms)
✔ All catalogue entries possess verified provenance, authoritative sources, and valid verification dates (0.8013ms)
✔ Country scope is strictly constrained to the 6 authorized jurisdictions and Global assets (0.2042ms)
✔ Category system A-F defines distinct domains and maintains absolute segregation of Category A Emergency Dispatch (0.5989ms)
✔ queryResourceCatalogue correctly filters by country, category, search query, and verification status (0.3934ms)
✔ getNationalCrisisSummary resolves accurate emergency dispatch and primary mental health pathways for all 6 jurisdictions (0.3413ms)
✔ Regional nuances (Northern Ireland Lifeline NI) are explicitly preserved (0.1731ms)
✔ Offline execution guarantee: query and summary functions operate 100% synchronously without network dependencies (0.9344ms)
✔ Privacy assurance: resource catalog contains zero personal data, telemetry, or user state (0.2047ms)

ℹ tests 23
ℹ suites 0
ℹ pass 23
ℹ fail 0
ℹ duration_ms 118.4681
```

### 2. Frontend Production Build
Executed `npm --prefix frontend run build`:
```
> mindora-frontend@2.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1592 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.87 kB │ gzip:  0.49 kB
dist/assets/index-D8Db6PXR.css   37.42 kB │ gzip:  6.86 kB
dist/assets/index-Cme0BTOI.js   268.41 kB │ gzip: 75.76 kB
✓ built in 2.04s (Exit Code: 0)
```

### 3. Backend Regression Suite
Executed `python -m pytest tests/ ml_lab/tests/`:
```
======================= 183 passed, 7 warnings in 3.76s =======================
Exit Code: 0
```
- **171 unique backend tests** (183 pytest execution targets) pass 100%.
- Combined platform total: **194 unique automated tests** (206 test targets) pass.

---

## 6. SHA-256 Hash Ledger & Research Integrity

All 11 frozen research assets were re-hashed using SHA-256. Every digest strictly matches the baseline established in prior stages:

| Artifact Path | Expected SHA-256 Digest | Status |
| :--- | :--- | :---: |
| `app.py` | `5F15ADD9F3A5F5809D80154931E98A5B79D06BBC9BB69323028BFA3898E46BBE` | MATCH |
| `dataset/Student_Depression_Dataset.csv` | `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` | MATCH |
| `shared/contracts/feature_contract.json` | `BED161ED06A50F528BBFE9316FF9A979771A1CFA8EE8C9CD48CF9466E442FFB0` | MATCH |
| `ml_lab/splits/group_aware_partition_manifest.json` | `A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070` | MATCH |
| `ml_lab/splits/partition_assignments.csv` | `91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1` | MATCH |
| `models/best_model.pkl` | `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` | MATCH |
| `ml_lab/experiments/stage_3b_2/oof_metrics.json` | `361BC700A7731678402BCE89B7A85051181DC877430A3FE30AA114EC2C0A6FEF` | MATCH |
| `ml_lab/experiments/stage_3b_3/oof_metrics.json` | `555D3B159A31A5C6F6964143F040A97F8BECC938FCB9690986A9B856F9DC2A03` | MATCH |
| `ml_lab/experiments/stage_3b_3/model_comparison.json` | `FC8E31D45DEE28D3925A80627268299D185AE68D6C1DE092167EE23A7F6286E7` | MATCH |
| `ml_lab/experiments/stage_3b_4/stage_3b_4_metrics.json` | `FBB9AAEB5D0A12E46FE74BF9EDA71AA3140C130E384DCF47A35AABCED25CC7C6` | MATCH |
| `ml_lab/experiments/stage_3b_4/artifact_manifest.json` | `B1385C3A03015A470911CC432012E418BD3AD0E505A52C0CF92C22D8290FB072` | MATCH |

### Boundary Safeguards Maintained:
- **Zero Git Commits:** No commits created; working directory cleanly modified on branch `mindora-2.0-rebuild`.
- **Zero Model Training / Evaluation:** ML models remain untouched.
- **Zero Test Vault / Dataset B Access:** Ingestion isolation intact.

---

## 7. Conclusion & Stop Directive

Phase 5.2 is fully complete. The Verified Resource Navigator operates as an authoritative, evidence-backed, offline-capable directory with strict segregation between emergency dispatch and mental health counseling.

**STATUS: STOPPED.** Awaiting explicit review and authorization before proceeding to any subsequent product phase.
