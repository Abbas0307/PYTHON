# MINDORA 2.0 — STAGE 3B.4: CALIBRATION RISK REGISTER (STAGE 3B.4.3 FINAL READINESS REVISION)

**Project:** Mindora 2.0  
**Branch:** `mindora-2.0-rebuild`  
**Stage:** 3B.4 Preflight (Stage 3B.4.3 Final Execution Readiness Check)  
**Author:** Senior ML Research Engineer & Risk Governance Auditor  
**Date:** 2026-11-15  
**Status:** **ACTIVE — FINAL READINESS AUDIT COMPLETE (EXECUTION UNAUTHORIZED)**

---

## Risk Evaluation Matrix

| Risk ID | Risk Description | Severity | Likelihood | Pre-Mitigation Level | Post-Mitigation Level | Status |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| **RSK-CAL-01** | Calibration Resubstitution (Label Leakage) | Critical | High | **CRITICAL** | Negligible | **CONTROLLED** |
| **RSK-CAL-02** | Scikit-Learn Metadata Routing Defect (Group Leakage) | Critical | High | **CRITICAL** | Negligible | **RESOLVED** |
| **RSK-CAL-03** | Isotonic Boundary Divergence & Infinite Log-Loss | High | Medium | **HIGH** | Negligible | **CONTROLLED** |
| **RSK-CAL-04** | Probability Quantization & Rank Degradation (Ties) | Medium | Medium | **MEDIUM** | Low | **CONTROLLED** |
| **RSK-CAL-05** | Score-Distribution Shift in Architecture B Comparator | Medium | Medium | **MEDIUM** | Low | **CONTROLLED** |
| **RSK-CAL-06** | Finite-Sample ECE Discrepancy & Reporting Bias | Medium | High | **MEDIUM** | Negligible | **CONTROLLED** |
| **RSK-CAL-07** | Premature Production Deployment of Research Architectures | High | Low | **HIGH** | Negligible | **CONTROLLED** |
| **RSK-CAL-08** | Inadvertent Materialization of Test Vault Data | Critical | Low | **HIGH** | Negligible | **CONTROLLED** |
| **RSK-CAL-09** | Misinterpretation of Calibration as Clinical Validity | High | Medium | **HIGH** | Low | **CONTROLLED** |
| **RSK-CAL-10** | Post-Hoc Threshold Optimization & Data Snooping | High | Medium | **HIGH** | Negligible | **CONTROLLED** |
| **RSK-CAL-11** | Non-Integer / Averaged Confusion Matrix Obfuscation | Medium | High | **MEDIUM** | Negligible | **CONTROLLED** |

---

## Detailed Risk Profiles & Mitigation Strategies

### RSK-CAL-01: Calibration Resubstitution / Label Leakage
- **Description:** Fitting a calibrator directly on the same dataset split used for model training or model evaluation causes optimistic calibration bias. Training predictions are artificially overconfident, distorting calibration mappings; evaluating on the calibration fitting set produces artificially deflated ECE.
- **Mitigation Strategy:** Strict implementation of **Nested Group-Aware Cross-Fitting**. Base estimators and calibrators are fitted exclusively on inner folds within the outer training partition. The outer validation fold ($N \approx 4,743$) is strictly held out and never seen by either model or calibrator.
- **Fail-Closed Verification:** Automated test `test_nested_group_aware_split_generator` asserts that inner training, inner calibration, and outer validation index sets have zero pairwise intersections.

---

### RSK-CAL-02: Scikit-Learn Metadata Routing Defect (Group Leakage)
- **Description:** Scikit-learn's `CalibratedClassifierCV` does not route the `groups` parameter to `cv.split(X, y, groups)`. If a `StratifiedGroupKFold` object is passed directly, scikit-learn falls back to `groups=None`, treating all data as a single group and causing runtime failure or silently violating group boundaries.
- **Mitigation Strategy:** Precompute inner group-aware split indices as explicit lists of integer tuples `[(train_idx, cal_idx), ...]` using `StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42 + k)`. Pass this precomputed list directly into `CalibratedClassifierCV(cv=inner_splits)`.
- **Fail-Closed Verification:** Automated test verifies that `CalibratedClassifierCV` executes cleanly with precomputed split lists without triggering `ValueError` and with zero group intersection between folds.

---

### RSK-CAL-03: Isotonic Boundary Divergence & Infinite Log-Loss
- **Description:** Isotonic regression (PAVA) produces unconstrained step functions. If the lowest or highest empirical block is pure (e.g. 100% negative or 100% positive), PAVA can assign calibrated probabilities of exactly $0.0000$ or $1.0000$. If a held-out validation sample in that bin has the opposite true label, log-loss evaluates to $-\ln(0) = \infty$.
- **Mitigation Strategy:** Mandatory clipping of all predicted probabilities to the numerical interval $[\epsilon, 1 - \epsilon]$ where $\epsilon = 10^{-15}$ prior to computing log loss or Brier score.
- **Fail-Closed Verification:** Automated test `test_3_log_loss_and_metric_suite_compatibility` verifies that extreme probability vectors evaluate to finite, stable loss values without overflow or `NaN`.

---

### RSK-CAL-04: Probability Quantization & Rank Degradation (Ties)
- **Description:** Isotonic regression pools adjacent violators into flat horizontal plateaus. Multiple distinct student survey feature vectors receive identical calibrated scores, creating tied ranks.
- **Empirical Reframing:** While averaging 5 isotonic step functions in Architecture A is hypothesized to reduce quantization relative to a single step function, **this is an empirical hypothesis, NOT a guarantee**. Averaging does not strictly guarantee smooth curves or rank preservation.
- **Mitigation Strategy:**
  1. Mandate explicit measurement of empirical diagnostics: unique calibrated probability count, tie rate (% of samples tied), and maximum plateau length.
  2. Measure pairwise $\Delta \text{ROC-AUC} = \text{ROC-AUC}_{\text{calibrated}} - \text{ROC-AUC}_{\text{uncalibrated}}$ for every model across all folds.
  3. If $\Delta \text{ROC-AUC} < -0.005$, flag as excessive discrimination degradation.
- **Fail-Closed Verification:** Automated test `test_4_isotonic_empirical_diagnostics` verifies diagnostic extraction code.

---

### RSK-CAL-05: Score-Distribution Shift in Architecture B Comparator
- **Description:** In Architecture B, inner OOF predictions are generated by models trained on $80\%$ of outer train ($N \approx 15,178$). The single calibrator is fitted on these predictions, but at test time is applied to a full model trained on $100\%$ of outer train ($N = 18,973$). A model trained on more data may have sharper leaf probabilities or different confidence distributions.
- **Impact:** Potential mismatch between the calibration fitting distribution and the evaluation score distribution.
- **Mitigation Strategy:** Architecture B is explicitly designated as a **Secondary Research Comparator**, not a production pipeline. The empirical score-distribution shift and its effect on calibration metrics will be documented and compared against Architecture A (Primary Research Benchmark).
- **Fail-Closed Verification:** Formal comparison between Architecture A and Architecture B logged in Stage 3B.4 outputs.

---

### RSK-CAL-06: Finite-Sample ECE Discrepancy & Reporting Bias
- **Description:** Expected Calibration Error (ECE) uses an $L_1$ absolute error norm $\sum w_m |\text{acc}_m - \text{conf}_m|$. In finite samples ($n \approx 4,743$), binomial variance in empirical bin accuracy introduces a positive upward bias ($\mathbb{E}[|X|] > |\mathbb{E}[X]|$), causing fold-level ECE to appear systematically worse than pooled ECE ($N = 23,716$).
- **Mitigation Strategy:** All reporting must document **both** pooled out-of-fold metrics and fold-level distributions ($\mu \pm s, ddof=1$). Explicitly report cross-fold variance and uncertainty rather than relying on single point estimates.
- **Fail-Closed Verification:** Enforced in Stage 3B.4 specification and metrics reporting engine.

---

### RSK-CAL-07: Premature Production Deployment of Research Architectures
- **Description:** Experimental calibration architectures (such as Architecture A with 5 sub-models or Architecture B with distribution shifts) could be mistakenly assumed to be production-ready and deployed to user-facing services.
- **Mitigation Strategy:** Formal specification explicitly establishes that **neither Architecture A nor Architecture B is production-ready**. Both are strictly research structures. Production candidate selection is deferred to subsequent governed stages.
- **Fail-Closed Verification:** Spec metadata asserts `production_status: "NOT_PRODUCTION_READY"`.

---

### RSK-CAL-08: Inadvertent Materialization of Test Vault Data
- **Description:** Scripts might inadvertently load the full CSV or read rows assigned to the Test Vault ($N=4,185$).
- **Mitigation Strategy:** All data loading must strictly use `ml_lab.evaluation.development_only_loader.load_development_dataset()`. `partition_guard.py` enforces fail-closed assertion checks. The Test Vault is designated as **"untouched during this experiment"**, as zero bytes from the Test Vault rows are read, parsed, materialized, or evaluated.
- **Fail-Closed Verification:** Automated test suite `ml_lab/tests/test_pre_ingestion_isolation.py` (10 tests) asserts pre-ingestion isolation.

---

### RSK-CAL-09: Misinterpretation of Calibration as Clinical Validity
- **Description:** Non-technical stakeholders might interpret well-calibrated probabilities as clinically verified diagnostic probabilities of major depressive disorder.
- **Mitigation Strategy:** Mandatory disclaimers in all specifications, protocols, and reports stating that calibration applies strictly to self-reported survey labels in Dataset A and does NOT represent clinical depression diagnosis or medical risk.
- **Fail-Closed Verification:** Mandatory disclaimer section in all Stage 3B.4 artifacts and specifications.

---

### RSK-CAL-10: Post-Hoc Threshold Optimization & Data Snooping
- **Description:** Tuning or optimizing the decision threshold $\tau$ on outer validation fold labels introduces post-hoc selection bias, artificially inflating threshold-dependent discrete classification metrics (Accuracy, Balanced Accuracy, Precision, Recall, F1).
- **Mitigation Strategy:** Predeclare the primary classification threshold as strictly fixed at $\tau = 0.50$. Strictly prohibit threshold search or optimization using outer validation labels. Probability-based metrics (ROC-AUC, Brier score, log loss, ECE, calibration curves) evaluate posterior probability quality independently of threshold-dependent classification metrics.
- **Fail-Closed Verification:** Enforced via `stage_3b_4_calibration_spec.json` (`threshold_policy.primary_threshold = 0.50`, `threshold_optimization_allowed = false`) and verified by `test_stage_3b_4_preflight.py`.

---

### RSK-CAL-11: Non-Integer / Averaged Confusion Matrix Obfuscation
- **Description:** Reporting confusion matrices as mean $\pm$ standard deviation across folds (e.g., `[[1420.2, 540.8], [320.4, 2461.6]]`) produces unphysical fractional counts that obscure discrete classification ground truth and introduce rounding ambiguities.
- **Mitigation Strategy:** Mandate that confusion matrices are recorded strictly as integer counts `[[TN, FP], [FN, TP]]`. Report both:
  1. The pooled out-of-fold confusion matrix across all $N=23,716$ Development records.
  2. All 5 individual outer-fold confusion matrices ($k=0, 1, 2, 3, 4$).
  Strictly forbid substituting mean/standard deviation matrices for fold confusion matrices.
- **Fail-Closed Verification:** Enforced via `stage_3b_4_calibration_spec.json` (`confusion_matrix_reporting.mean_confusion_matrix_forbidden = true`) and verified by `test_stage_3b_4_preflight.py`.

---

## Operational Decision Points for Execution Phase

1. **Architecture Hierarchy:**
   - **Architecture A:** Primary Research Benchmark (zero model-capacity distribution shift; empirical evaluation of quantization hypothesis).
   - **Architecture B:** Secondary Research Comparator (quantifies impact of score-distribution shift and single-step evaluation).
   - **Production Policy:** Neither architecture is production-ready.
2. **Threshold Governance:** Fixed at $\tau = 0.50$; zero threshold optimization on validation data; probability and threshold-dependent metrics are decoupled.
3. **Confusion Matrix Reporting:** Pooled OOF integer matrix + 5 individual fold integer matrices; fractional/averaged confusion matrices strictly forbidden.
4. **Test Vault Safeguard:** Untouched during this experiment. Zero bytes or records read or materialized.
5. **Execution Gate:** Stage 3B.4 execution remains blocked until explicit user authorization is provided.
