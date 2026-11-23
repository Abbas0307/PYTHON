# MINDORA 2.0 — RESEARCH OBJECTIVES & PRODUCT ARCHITECTURE
**Document Ref:** `docs/research/MINDORA_RESEARCH_OBJECTIVES.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Status:** Approved Research Specification  

---

## 1. CORE PRODUCT IDENTITY & PHILOSOPHY

Mindora 2.0 is an **Offline-First Student Wellbeing Intelligence Platform** designed specifically for university and higher education students. Its mission is to support personal self-reflection, lifestyle self-regulation, and grounded access to institutional and crisis resources.

### 1.1 What Mindora IS NOT:
1. **NOT a diagnostic application:** Mindora does not diagnose Major Depressive Disorder (MDD), anxiety disorders, or any other clinical psychiatric condition.
2. **NOT a clinician replacement:** Mindora cannot replace a licensed psychiatrist, clinical psychologist, university counselor, or medical professional.
3. **NOT a psychiatric classifier:** Mindora does not claim to determine whether a student has a mental illness or pathological brain disorder.
4. **NOT a pseudo-medical probability generator:** Mindora does not conflate unrelated survey variables (such as study hours or academic grades) into a medically meaningful "depression probability".

### 1.2 The Product Journey Framework
Mindora organizes all user interactions around a structured, non-judgmental student journey:

$$\mathbf{UNDERSTAND} \longrightarrow \mathbf{DISCOVER} \longrightarrow \mathbf{ACT} \longrightarrow \mathbf{IMPROVE}$$

- **UNDERSTAND:** The student reflects on their daily lifestyle patterns, academic workload, sleep duration, and self-reported emotional state in a secure, local-only environment.
- **DISCOVER:** Mindora provides transparent, explainable insights highlighting friction areas (e.g., severe sleep deficit coupled with extreme academic pressure) and presents validated screening tools.
- **ACT:** The student receives concrete, non-clinical wellness micro-habits and direct, vetted links to campus and regional crisis support pathways.
- **IMPROVE:** The student tracks their personal habit adherence and wellbeing trajectory over time without cloud surveillance, persistent tracking cookies, or external data exposure.

---

## 2. THE THREE INDEPENDENT INTELLIGENCE LAYERS

Mindora decouples its intelligence into three strictly isolated, independent engines. These layers run in parallel, communicate only through well-defined data schemas, and **must never be combined into a single composite "depression score".**

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MINDORA PRODUCT ARCHITECTURE                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ ENGINE 1: Deterministic Wellbeing & Safety Engine              │   │
│   │ • PHQ-9 Standardized Psychometric Screener (Score 0-27)        │   │
│   │ • Item 9 Unconditional Zero-Tolerance Crisis Escalation        │   │
│   │ • Deterministic Sleep & Academic Friction Heuristics           │   │
│   │ • Rule-Based Habit & Wellness Micro-Interventions              │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                    │ (Completely Decoupled)            │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ ENGINE 2: Statistical Machine Learning Research Engine         │   │
│   │ • Bounded Multivariate Academic & Lifestyle Pattern Analysis   │   │
│   │ • Evaluates Lifestyle-Strain Indicators (Research Benchmark)   │   │
│   │ • Platt / Isotonic Probability Calibration                     │   │
│   │ • Local Feature Attribution (SHAP) - Mathematical Explanations │   │
│   │ • Out-of-Distribution (OOD) Input Detection                    │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                    │ (Completely Decoupled)            │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ ENGINE 3: Grounded Student Resource Navigator                  │   │
│   │ • Deterministic Vetted Crisis Hotline Catalog (Geo-Specific)   │   │
│   │ • Tele-MANAS (India), NHS 111 / 999 (UK), 988 (US/Canada)     │   │
│   │ • Campus Support & Verified Student Services Registry          │   │
│   │ • Optional Extractive Local LLM Summarization (Qwen 1.5B)      │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Engine 1 — Deterministic Wellbeing and Safety Engine
- **Role:** Primary student-facing clinical screening and immediate crisis safeguard.
- **Technology:** 100% deterministic rules, standardized scoring tables, and zero-tolerance safety escalation logic.
- **Independence:** Operates without any machine learning dependencies. If all ML models fail or are disabled, Engine 1 functions with 100% reliability.

### 2.2 Engine 2 — Statistical Machine Learning Research Engine
- **Role:** Exploratory pattern analysis identifying how clusters of lifestyle factors (sleep, study hours, dietary habits) correlate with survey-reported strain.
- **Technology:** Offline-first regularized gradient boosting (e.g., XGBoost, LightGBM) exported to ONNX Runtime for client-side or local edge evaluation.
- **Independence:** Strictly exploratory. Its predictions are explicitly framed as academic statistical patterns and are **never** presented as clinical diagnoses or medical risk assessments.

### 2.3 Engine 3 — Grounded Student Resource Navigator
- **Role:** Contextual matching of verified institutional, national, and campus support resources.
- **Technology:** Static, pre-vetted JSON resource registries with strict deterministic schema validation; optional local small language model (e.g., Qwen 1.5B/0.5B via ONNX/llama.cpp) strictly constrained to extractive summarization.
- **Independence:** Does not assess risk or compute scores; acts solely as a navigation aid to connect students to human care.

---

## 3. EVALUATION OF CANDIDATE RESEARCH OBJECTIVES

To establish a defensible scientific foundation for Engine 2, four candidate research objectives were rigorously evaluated:

| Dimension | Objective A: Predict Public Survey `Depression` Label | Objective B: Estimate Academic & Lifestyle Wellbeing Strain | Objective C: Exploratory Lifestyle Insights (No Depression Prediction) | Objective D: Future Clinical Screener Support Model (PHQ-9 Ground Truth) |
| :--- | :--- | :--- | :--- | :--- |
| **Scientific Description** | Binary classification predicting the Kaggle `Depression` flag ($0/1$). | Supervised regression/classification predicting an index of student lifestyle strain. | Unsupervised clustering and deterministic rule-based lifestyle feedback. | Supervised model predicting validated PHQ-9 severity categories ($\ge 10$). |
| **Scientific Validity** | **Low to Moderate:** Target is an unverified survey indicator with uncalibrated base rate ($58.55\%$). | **Moderate to High:** Directly models observable lifestyle friction without psychiatric claims. | **High:** Fully transparent, zero pseudo-medical claims, highly explainable. | **High:** Clinically grounded, validated international psychometric instrument. |
| **Intended Population** | General student ML benchmark testing. | University students seeking academic-life balance. | University students reflecting on habits. | Students undergoing structured campus health screening. |
| **Data Requirements** | Dataset A ($N=27,901$). | Multi-dimensional lifestyle survey data ($N > 2,000$). | Deterministic expert rules; no ML training corpus required. | Multi-institution primary dataset with complete PHQ-9 screeners ($N > 1,500$). |
| **Key Risks & Pitfalls** | Risk of user deception if presented as a clinical depression diagnosis. | Defining a non-arbitrary composite "strain" index without clinical validation. | Provides less novel algorithmic personalization. | High barrier to entry: requires IRB approval, formal consent, and clinical oversight. |
| **Clinical Liability** | High if miscommunicated; low if strictly labeled as engineering benchmark. | Low; clearly educational and lifestyle-oriented. | Zero clinical liability; purely informational. | Moderate; requires strict clinical decision support disclaimers. |

---

## 4. RECOMMENDED RESEARCH DIRECTION: DUAL-TRACK METHODOLOGY

Mindora adopts a principled, scientifically honest **Dual-Track Research Strategy**:

### Track 1: Controlled Engineering Benchmark Track (Immediate Stage 2 & 3)
- **Objective:** Utilize Dataset A strictly as an **unverified computational benchmark** (Objective A / Objective B).
- **Purpose:** Test offline feature transformations, ONNX export parity, cross-platform runtime execution (browser WASM vs desktop), inference latency, and probability calibration techniques (Platt scaling vs Isotonic regression).
- **Boundary:** Predictions generated by Track 1 are strictly designated as an **"Exploratory Academic Benchmark Score"** in all documentation and UI mockups. They are never described as medical diagnoses.

### Track 2: Grounded Student Wellbeing Intelligence Track (Long-Term Product Goal)
- **Objective:** Combine deterministic lifestyle heuristics (Objective C) with future psychometrically grounded screener support models (Objective D).
- **Purpose:** Deliver genuinely actionable, ethically defensible student wellbeing intelligence without psychiatric labeling.
- **Prerequisite:** Model development on human student responses will only proceed after formal primary data collection protocols with verified parental consent (where applicable), adult participant consent, and IRB/ethics committee approval are executed.

---

## 5. DOCUMENT RECONCILIATION & GOVERNANCE

- [x] Product identity and non-diagnostic boundaries formally defined.
- [x] Independence of Engine 1, Engine 2, and Engine 3 established.
- [x] All 4 candidate research objectives evaluated across 6 scientific dimensions.
- [x] Dual-track research strategy adopted and justified.
- [x] No clinical diagnostic claims permitted anywhere in the system.
