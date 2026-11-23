# MINDORA 2.0 — STAGE 2 COMPREHENSIVE RESEARCH DESIGN REPORT
**Final Research Methodology, Evaluation Protocol & System Governance**
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Stage 2 Status:** Complete & Fully Validated  

---

## 1. EXECUTIVE SYNTHESIS & STAGE 2 OBJECTIVES

Stage 2 establishes a scientifically rigorous, clinically grounded, and legally sound research and evaluation methodology for **Mindora 2.0**.

### 1.1 Non-Negotiable Restraints Strictly Preserved:
- **Zero Model Training or Benchmarking:** No models were trained, fine-tuned, or evaluated.
- **Zero Dataset Modifications:** Original CSV and XLSX files remain untouched.
- **Zero Dataset Merging:** Datasets A and B remain strictly segregated.
- **Production Model Integrity:** `models/best_model.pkl` verified bit-exact (SHA-256: `E182E9E7...`).
- **Feature Contract Preservation:** `shared/contracts/feature_contract.json` remains unmodified.
- **Safety Protocol Intact:** PHQ-9 Item 9 emergency escalation remains deterministic and decoupled.
- **Zero Automatic Commits:** Git working tree preserved without unapproved staging.

---

## 2. SYNTHESIS OF STAGE 2 RESEARCH DOCUMENTS

The complete research design is codified across seven foundational specifications in `docs/research/`:

1. [MINDORA_RESEARCH_OBJECTIVES.md](file:///D:/Depression%20calculator/docs/research/MINDORA_RESEARCH_OBJECTIVES.md):
   - Redefines product identity: **Offline-First Student Wellbeing Intelligence Platform**.
   - Codifies the 4-stage student journey: **UNDERSTAND $\to$ DISCOVER $\to$ ACT $\to$ IMPROVE**.
   - Decouples intelligence into three strictly independent layers (Deterministic Safety Engine, Statistical ML Engine, Grounded Resource Navigator).
   - Adopts a defensible **Dual-Track Research Strategy**: Track 1 for controlled computational engineering benchmarks; Track 2 for grounded student wellbeing intelligence.

2. [TARGET_VARIABLE_DECISION.md](file:///D:/Depression%20calculator/docs/research/TARGET_VARIABLE_DECISION.md):
   - Evaluates candidate targets and rejects pseudo-medical "depression probability" claims.
   - Retains Dataset A's binary indicator strictly as an engineering benchmark for pipeline, calibration, and ONNX export testing.
   - Formalizes PHQ-9 as a continuous symptom screening instrument ($0-27$), not a clinical diagnosis.
   - Mandates strict replacements for forbidden medical vocabulary.

3. [INTENDED_USE_AND_POPULATION.md](file:///D:/Depression%20calculator/docs/research/INTENDED_USE_AND_POPULATION.md):
   - Defines intended use as client-side, offline educational self-reflection for adult university students ($\ge 18$).
   - Establishes absolute contraindications for minors ($<18$), acute suicidal crises, and formal clinical triage.
   - Establishes a student-in-the-loop agency architecture with zero automated administrative reporting.

4. [FEATURE_ELIGIBILITY_POLICY.md](file:///D:/Depression%20calculator/docs/research/FEATURE_ELIGIBILITY_POLICY.md):
   - Audits all 10 features in the production contract across construct validity, measurement quality, and bias.
   - Flags `CGPA` for deprecation/redesign due to zero correlation ($r = 0.022$) and international scale incompatibility.
   - Proposes restructuring `Degree` (collapsing 63 sparse variations into 5 broad academic faculties).
   - Codifies the strict exclusion of suicidal thoughts, non-student profession, work pressure, and city.

5. [MODEL_EVALUATION_PROTOCOL.md](file:///D:/Depression%20calculator/docs/research/MODEL_EVALUATION_PROTOCOL.md):
   - Specifies a justified **60/20/20 train/validation/test split** with target and demographic stratification.
   - Mandates strict preprocessing leakage prevention (transformers fit exclusively on 60% train).
   - Establishes a 3-level baseline hierarchy (Trivial, Linear/Regularized, Tree Ensembles).
   - Requires comprehensive metric reporting: **Brier score, PR-AUC, ROC-AUC, Sensitivity, Specificity, F1**.
   - Requires Platt/Isotonic probability calibration, 95% bootstrap confidence intervals, and subgroup fairness evaluations.
   - Forbids claiming external validation without an independent multi-site dataset.

6. [DATASET_USAGE_POLICY.md](file:///D:/Depression%20calculator/docs/research/DATASET_USAGE_POLICY.md):
   - Limits Dataset A strictly to controlled engineering experiments.
   - Formally quarantines Dataset B from supervised model training, calibration, and evaluation due to minor records ($10.5\%$) and lack of documented ML research consent.
   - Strictly prohibits pooling, merging, or augmenting Dataset A with Dataset B.
   - Codifies minimum standards for future primary human data collection.

7. [SAFETY_AND_CLAIMS_POLICY.md](file:///D:/Depression%20calculator/docs/research/SAFETY_AND_CLAIMS_POLICY.md):
   - Codifies permitted student-facing copy and prohibits diagnostic assertions.
   - Defines the deterministic, zero-tolerance PHQ-9 Item 9 safety protocol routing to Tele-MANAS (14416 / 1800-891-4416), 999/112 (UK), and 988 (US/Canada).
   - Defines non-generative, extractive boundaries for Engine 3 and local SLMs (Qwen).
   - Establishes non-causal boundaries for SHAP feature attribution.

---

## 3. HARDWARE & COMPUTE ALLOCATION POLICY

The development environment consists of:
- **Processor & RAM:** Modern multi-core x86_64 CPU with **16 GB System RAM**.
- **Dedicated GPU:** **NVIDIA GeForce RTX 4050 Laptop GPU (6 GB VRAM)**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      COMPUTE ALLOCATION GUIDELINES                     │
├────────────────────────────────┬───────────────────────────────────────┤
│ TASK CATEGORY                  │ RECOMMENDED HARDWARE & JUSTIFICATION  │
├────────────────────────────────┼───────────────────────────────────────┤
│ 1. Tabular Model Training      │ • HARDWARE: CPU (Multi-threaded).     │
│    (XGBoost, LightGBM, RF, LR) │ • JUSTIFICATION: N = 27,901 rows with │
│                                │   10 features (45 encoded cols) is a  │
│                                │   small tabular dataset (~2.8 MB).    │
│                                │ • PCIe memory transfer overhead to GPU│
│                                │   exceeds training compute time. CPU  │
│                                │   execution finishes in seconds.      │
├────────────────────────────────┼───────────────────────────────────────┤
│ 2. Statistical Profiling &     │ • HARDWARE: CPU (Vectorized pandas /  │
│    Calibration Tests           │   scipy / DuckDB).                    │
│                                │ • Zero benefit from GPU acceleration. │
├────────────────────────────────┼───────────────────────────────────────┤
│ 3. Future Local SLM Inference  │ • HARDWARE: GPU (RTX 4050, 6 GB VRAM).│
│    (Qwen 1.5B/0.5B via llama.  │ • JUSTIFICATION: 4-bit quantized SLMs │
│    cpp / ONNX DirectML)        │   (Q4_K_M) require ~1.2-1.8 GB VRAM,  │
│                                │   fitting comfortably in 6 GB VRAM    │
│                                │   for low-latency token streaming.    │
└────────────────────────────────┴───────────────────────────────────────┘
```

**Policy Rule:** For Stage 3 tabular model benchmarking, **CPU execution is mandated**. GPU utilization shall be reserved strictly for future quantized language model execution where tensor parallelism provides genuine latency benefits.

---

## 4. THE 7 FINAL DECISION GATE QUESTIONS & BINDING ANSWERS

### Question 1: What exactly should Mindora's ML engine predict?
**Answer:** **A strictly bounded computational prediction of Dataset A's legacy survey-derived label for engineering benchmarks, completely separated from current deterministic wellbeing insights and future research constructs.**
- **Dataset A Legacy Model:** Predicts the original survey-derived `Depression` label strictly for controlled computational engineering experiments (pipeline parity, ONNX export verification, calibration testing). It must **never** be relabeled or claimed to predict validated academic strain, and will **never** generate a "strain probability".
- **Current Lifestyle & Academic Insights:** Generated exclusively through **transparent, deterministic rules** with documented rationale (e.g., sleep debt heuristics, academic workload overload ratios).
- **Future Strain Construct:** Treated as a **separate future research proposal** requiring an explicit theoretical construct definition, validated measurement model, and independent clinical/psychometric validation.

### Question 2: Which dataset can support that objective?
**Answer:** **Dataset A (`dataset/Student_Depression_Dataset.csv`), strictly for controlled computational engineering and calibration benchmarks.**
- **Scientific Role:** Dataset A has sufficient statistical volume ($N = 27,901$) and high numerical stability to support model architecture comparisons, preprocessing verification, probability calibration experiments, and ONNX export numerical parity.
- **Mandatory Caveat:** It cannot be cited as clinically validated ground truth or as a measure of validated academic strain.

### Question 3: What should Dataset B be used for, if anything, before consent is clarified?
**Answer:** **Strictly as an unlabeled, qualitative reference cohort for UI/UX form design, degree vocabulary mapping, and boundary constraint testing.**
- **Prohibited Uses:** It must **never** be used for model training, benchmarking, hyperparameter tuning, calibration, or evaluation.
- **Permitted Uses:** Inspecting real-world degree naming variations to build dropdown catalogs, analyzing non-numeric CGPA entries (`🤷‍♂️`, `'Nill'`) to design strict client-side input masking, and creating synthetic test fixtures in `tests/`.

### Question 4: Which features should be retained or excluded?
- **Retained Features (Current Contract Preserved):** `Academic Pressure`, `Study Satisfaction`, `Financial Stress`, `Sleep Duration`, `Work/Study Hours`, `Age` (bounded $\ge 18$), `Dietary Habits`.
- **Features Recommended for Future Restructuring:**
  - `CGPA`: Shows near-zero linear correlation ($r = 0.022$) with depression and suffers from global scale incompatibility; recommended for deprecation or replacement with perceived academic satisfaction.
  - `Degree`: 63 free-text variations create severe categorical sparsity; recommended for consolidation into a documented **6-Cluster Academic Faculty Taxonomy** (Engineering & Tech; Business & Commerce; Humanities & Social Sciences; Medical & Health Sciences; Pure & Applied Sciences; and a mandatory **Other & Unclassified** catch-all, with no guessed mappings).
  - `Gender`: Expand schema to include `Non-binary` and `Prefer not to say`.
- **Strictly Excluded Features (Safety & Clinical Grounds):** `Have you ever had suicidal thoughts ?` (severe target leakage; clinical hazard; strictly isolated in Item 9); `Profession`, `Work Pressure`, `Job Satisfaction` (zero-variance for students); and `City` (high cardinality/regional bias).

### Question 5: What would constitute meaningful independent validation?
**Answer:** **Evaluation on an independent, multi-institutional student dataset with documented clinical provenance, validated psychometric instruments (e.g., PHQ-9), explicit ML research consent, and formal IRB/ethics committee approval.**
- **Evaluation Split Assumptions:** The Hanley-McNeil standard error on Dataset A's 20% test split ($SE \le 0.0069$) assumes mutual independence, binormal continuous rankings, and lack of clustering. In survey data, hidden clustering, near-duplicates, or synthetic interpolation artifacts can artificially deflate standard errors.
- **No External Generalizability:** Partitioning Dataset A proves internal interpolation only within that specific benchmark distribution. A large test set ($N=5,580$) provides statistical precision regarding this test set, **NOT proof of external generalizability to real-world campuses.**
- **Leakage Prevention:** All preprocessing, feature selection, and hyperparameter tuning must be fitted strictly without using the final test set.

### Question 6: What claims can the application safely make?
**Answer:**
1. **Permitted Claims:** Educational self-reflection feedback; standardized PHQ-9 symptom screening scores ($0-27$) with severity tiers; explainable lifestyle friction indicators; non-clinical wellness micro-habits; and direct links to verified institutional and regional crisis support helplines.
2. **PHQ-9 Item 9 Supportive Safety Protocol:** Positive Item 9 screening responses trigger a calm, supportive, non-alarmist safety card with follow-up guidance and confidential support pathways, clearly distinguished from emergency crisis escalation for imminent danger disclosed by the student. Human professional care is always prioritized, and LLMs are strictly prohibited from evaluating crisis severity.
3. **Minor Access Safeguards:** If a user indicates an age under 18, the system compassionately redirects them to dedicated adolescent support services (India: Childline 1098, Tele-MANAS 14416; UK: Childline 0800 1111, SHOUT 85258, NHS 111 England, NHS 111 Wales opt 2, NHS 24 Scotland, NI Lifeline 0808 808 8000; US: YouthLine nonprofit peer support up to age 24 [peer 4-10pm PT, adult phone outside], 988 Lifeline [crisis counselling; coordinates with 911 for imminent safety emergencies]; Canada: Kids Help Phone 1-800-668-6868, 988 Helpline). Age-gating the UI or excluding minors from research does not make the application automatically safe or compliant for minors without qualified legal review.
4. **Prohibited Claims:** No claims of medical depression diagnosis, clinical risk calculation, therapeutic cure, automated disability determination, psychiatric classification, or validated "strain probability".

### Question 7: What must be completed before model development begins?
**Answer:**
1. **Stage 2 Approval:** User review and explicit sign-off on the research design, feature policy, resource audit, and evaluation protocols documented herein.
2. **Train/Val/Test Split Protocol Implementation:** Creating reproducible, stratified 60/20/20 data partition scripts in `ml_lab/` without data leakage.
3. **Baseline Suite Setup:** Establishing baseline evaluation harnesses (Dummy Classifiers and Regularized Logistic Regression) before benchmarking gradient-boosted trees.
4. **Calibration & Parity Test Harness:** Preparing validation-based Platt/Isotonic calibration pipelines and ONNX export comparison scripts.

---

## 5. FORMAL CLAIM CLASSIFICATION TABLE

| Claim / Specification | Category | Status | Empirical Basis / Justification |
| :--- | :--- | :---: | :--- |
| Mindora is an educational self-reflection tool, not a diagnostic medical device | Product Definition | **[VERIFIED]** | Codified in system architecture and safety disclaimers. |
| Production model SHA-256 is `E182E9E7...` and intact | System Integrity | **[VERIFIED]** | Cryptographic hash match. |
| All 156 existing test cases pass (153 original + 3 contract tests) | Software Quality | **[VERIFIED]** | Complete test execution with zero regressions. |
| Dataset A is an unverified public benchmark for engineering experiments | Data Role | **[VERIFIED]** | Suitable for computational pipelines; not clinically validated training data. |
| Dataset A model predicts original label and must not be relabeled as strain | Target Policy | **[VERIFIED]** | Relabeling would reproduce unverified target patterns; strain requires explicit construct validation. |
| Dataset B is quarantined from model training and evaluation | Data Governance | **[VERIFIED]** | Quarantined due to minor records ($10.5\%$) and lack of documented ML research consent. |
| Dataset pooling/merging is strictly prohibited | Methodology | **[VERIFIED]** | Prevents covariate shift contamination, label corruption, and evaluation swamping. |
| Regional helplines audited with full metadata and fallbacks | Resource Verification | **[VERIFIED]** | Independently verified: India 14416/1098, UK 4-nation pathways (England 111, Wales 111 opt 2, Scotland 111, NI Lifeline 0808 808 8000; Childline 0800 1111; SHOUT 85258), US 988 Lifeline (SAMHSA crisis counselling; coordinates with 911 for emergencies) / YouthLine (nonprofit youth peer support up to age 24, all 50 states reach, peer 4-10pm PT, Lines for Life adult staff answer phone outside), Canada 988/Kids Help Phone. |
| Raw free-text survey data subject to data minimisation and governed retention | Data Retention | **[VERIFIED]** | Permanent raw retention and arbitrary 12-month blanket rules retracted; ephemeral volatile client processing + purpose-specific governed research retention. |
| 60/20/20 split provides internal precision but does not prove external generalizability | ML Protocol | **[PROPOSED]** | Hanley-McNeil bounds asymptotic SE, but random split cannot prove multi-site generalization. |
| CGPA is a candidate for deprecation due to poor correlation and scale mismatch | Feature Policy | **[PROPOSED]** | Benchmark linear correlation is $r = +0.0222$; global grading scales incompatible. |
| Degree should be consolidated into 6 faculties (incl. Other/Unclassified) | Feature Policy | **[PROPOSED]** | Eliminates extreme categorical sparsity; no guessed mappings permitted. |
| SHAP feature attributions represent causal mechanisms | ML Theory | **[NOT IMPLEMENTED]** | Strictly rejected: SHAP calculates mathematical attribution within the function, not causal etiology. |
| Current models possess verified external generalizability | Validation Status | **[NOT IMPLEMENTED]** | Strictly disclaimed: no independent multi-site external dataset evaluated. |
| Software age-gating guarantees DPDP Act / GDPR compliance | Legal Governance | **[NOT IMPLEMENTED]** | Technical controls cannot substitute for qualified legal review or institutional data governance. |

---

## 6. FINAL RECONCILIATION & STRICT STOP CONDITION

- [x] All 8 mandated research specifications authored in `docs/research/`.
- [x] Stage 2.1 critical corrections authored (`docs/research/STAGE_2_1_CORRECTIONS.md`).
- [x] Three independent engines formalized and decoupled.
- [x] 10-feature contract audited without modifying production files.
- [x] 6-faculty taxonomy codified with mandatory "Other & Unclassified".
- [x] 60/20/20 evaluation protocol with calibration and uncertainty estimation defined.
- [x] Strict compute allocation policy (CPU for tabular, GPU reserved for SLM) established.
- [x] 7 Final Decision Gate Questions answered in full.
- [x] Zero models trained, benchmarked, split, or exported.
- [x] Zero datasets modified or merged.
- [x] Zero automatic Git commits executed.
- [x] Execution strictly stopped for user review and explicit approval.
