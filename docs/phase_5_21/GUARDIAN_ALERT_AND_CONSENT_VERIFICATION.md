# Mindora 2.0 — Phase 5.21: Guardian Alert & Consent Verification

**Document ID:** `DOC-P521-GUARD-004`  
**Date:** November 16, 2026  
**Status:** Verification Complete & Active  
**Auditor:** Student Wellbeing Safety Auditor & Full-Stack Engineer  

---

## 1. Ethical Governance & Prior Consent Invariants

The guardian support system in Mindora 2.0 is subject to strict ethical safeguards:

1. **Affirmative Opt-In:** All guardian alert checkboxes initialize strictly unchecked (`useState(false)`).
2. **Separation of Concerns:** General Terms of Service acceptance does NOT grant guardian notification permissions. They are stored as distinct rows in `consent_records`:
   - `terms_of_service`
   - `privacy_policy`
   - `guardian_stress_alerts`
3. **Revocability:** Clicking "Revoke All Permissions" immediately sets `guardian_consent = 0`, disables the notification policy, and removes pending tokens.
4. **Minor Safeguarding:** Minor accounts ($< 18$) cannot enable auto-alerts without verified phone authorization (`guardian_verified == 1`).

---

## 2. Threshold Engine & Deduplication Verification

The threshold evaluation engine was audited under live synthetic conditions:

$$\text{Trigger Condition} = (\text{is\_enabled}) \land (\text{score} \ge \text{threshold}) \land (\Delta t \ge 7\text{ days}) \land (\text{consent} == 1)$$

### Test Results from `tests/test_phase_5_21_audit.py`:
- **Scenario A (Score 80%, Threshold 70%, Consent Granted):** `DELIVERED_MOCK` returned. Audit receipt created.
- **Scenario B (Consent Revoked, Score 85%):** Suppressed: `"Automatic alert blocked: Student guardian consent is not active."`
- **Scenario C (Second Assessment within 7 Days, Score 90%):** Suppressed: `"Automatic alert suppressed: In cooldown period (max 1 alert every 7 days)."`
- **Scenario D (Duplicate Idempotency Key):** Suppressed: `"Duplicate event: Alert with this idempotency key was already processed."`
- **Scenario E (Minor Account without Verified Phone):** Blocked: `"Safeguarding rule: Minor student accounts require verified guardian phone authorization"`.

---

## 3. SMS Message Content Sanitization

Verified in `TestSmsProviderAbstraction::test_non_diagnostic_message_invariant`:
- The standard SMS message template:
  > *"Your student has requested support from their trusted contact through Mindora. Please check in with them when convenient."*
- Prohibited clinical terms checked:
  - `PHQ-9`: Absent
  - `depression`: Absent
  - `score`: Absent
  - `severe`: Absent
  - `diagnosis`: Absent
  - `psychiatric`: Absent
- Output format: Guaranteed non-clinical and diagnostic-free.

---

## 4. SMS Provider Safety & Status Honesty

- **Testing Isolation:** All automated tests execute strictly against `MockSmsProvider` with zero cellular broadcasts or external HTTP requests.
- **Honest Status Reporting:** When `SMS_PROVIDER=fast2sms` but `SMS_API_KEY` is empty, the provider returns `PROVIDER_NOT_CONFIGURED`, explicitly flagging that credentials are not configured.

---

## 5. Guardian Alert & Consent Verdict

- **Status:** **PASS**
- **Safety Guarantee:** Zero diagnostic disclosures; consent strictly verified; 7-day cooldown prevents spamming.
