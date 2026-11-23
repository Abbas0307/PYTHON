# Mindora 2.0 — Phase 5.20: Automatic Alert Policy and Threshold Engine

**Document ID:** `DOC-P520-AUTO-006`  
**Date:** November 16, 2026  
**Status:** Verified & Active  
**Author:** Principal Software Architect & Responsible AI Engineer  

---

## 1. Executive Summary

Phase 5.20 introduces a student-governed, configurable automatic guardian notification engine. Recognizing that students in severe burnout or distress may struggle to voluntarily ask for help, Mindora allows students to pre-authorize automatic check-in prompts if their deterministic lifestyle and stress scores exceed a student-approved safety threshold.

---

## 2. Policy Governance Invariants

1. **Default Disabled:** Every user account initializes with `policy_enabled = 0`. No automatic messages are ever triggered without affirmative prior setup.
2. **Explicit Consent Dependency:** The policy cannot be enabled unless `guardian_consent` is granted and verified.
3. **Threshold Configurable:** Students choose their sensitivity threshold:
   - $50\% - 65\%$: Lower friction (early proactive check-in).
   - $70\%$ (Default): Balanced collegiate standard.
   - $80\% - 95\%$: High friction (severe distress only).
4. **Mandatory Cooldown Period:** A strict minimum cooldown of **7 days (168 hours)** is enforced between notifications to prevent spamming, alert fatigue, or family friction.
5. **Idempotency Deduplication:** The engine records an `idempotency_key` (e.g. `assessment_uuid`) to prevent network retries from double-triggering messages.
6. **Minor Student Shield:** Minor students cannot enable auto-alerts without verified guardian phone confirmation.

---

## 3. Mathematical Evaluation Logic

When an assessment completes:

$$\text{Trigger Condition} = (\text{is\_enabled} == 1) \land (\text{score} \ge \text{threshold}) \land (\Delta t_{\text{last}} \ge 7\text{ days}) \land (\text{consent} == 1)$$

If any condition evaluates to false, the notification is suppressed and logged with an audit reason:
- `"Automatic alert skipped: Policy is not enabled."`
- `"Score {score}% did not meet policy threshold {threshold}%."`
- `"Automatic alert suppressed: In cooldown period (max 1 alert every 7 days)."`
- `"Duplicate event: Alert with this idempotency key was already processed."`

---

## 4. Test Verification Summary

From `tests/test_phase_5_20_features.py::TestAuthManagerFeatures::test_automatic_alert_policy_engine`:
- **Scenario A (Policy Disabled, Score 85%):** Suppressed (`is_enabled == 0`).
- **Scenario B (Policy Enabled, Score 65%, Threshold 70%):** Suppressed (score below threshold).
- **Scenario C (Policy Enabled, Score 75%, Threshold 70%):** Triggered successfully (`DELIVERED_MOCK`).
- **Scenario D (Policy Enabled, Score 90%, within 7 days):** Suppressed (cooldown active).
- **Audit Outcome:** 100% Pass.
