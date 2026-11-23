# MINDORA 2.0 — LOCAL ENCRYPTED VAULT & THREAT MODEL SPECIFICATION
## Client-Side Cryptographic Vault Architecture & Threat Analysis

**Document Version:** 1.0.0  
**Date:** November 15, 2026  
**Status:** SPECIFICATION & THREAT MODEL (Stage 0 Foundation - NOT IMPLEMENTED)  
**Target Storage Engine:** Browser Web Crypto API + IndexedDB  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  

---

## 1. Vault Cryptographic Architecture

Mindora 2.0 designs an **optional client-side encrypted local vault** allowing students to retain non-sensitive habit commitments across browser sessions without creating an account or storing data on a remote server:

```
[Student Passphrase]
        │
        ▼
┌────────────────────────────────────────────────────────────────────────┐
│ KEY DERIVATION FUNCTION (KDF)                                          │
│   • Algorithm: PBKDF2 (HMAC-SHA-256, 600,000 iterations) or Argon2id   │
│   • Salt: Cryptographically secure 16-byte random salt per vault       │
│   • Output: 256-bit Key Material                                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BROWSER WEB CRYPTO API (SubtleCrypto)                                  │
│   • Key Object: Non-extractable CryptoKey (extractable=false)          │
│   • Cipher: AES-256-GCM (Galois/Counter Mode with 128-bit Auth Tag)    │
│   • Initialization Vector (IV): Fresh random 12-byte IV per write      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ CLIENT STORAGE (IndexedDB)                                             │
│   • Stored Fields: { id, ciphertext, iv, salt, auth_tag, version }     │
│   • Plaintext Data: NEVER stored in IndexedDB or localStorage          │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Cryptographic Invariants
1. **Authenticated Encryption:** AES-256-GCM guarantees both confidentiality and ciphertext integrity. Any tampering, corruption, or bit-flipping of the stored blob causes decryption to fail immediately.
2. **Non-Extractable Memory Keys:** The derived `CryptoKey` is marked `extractable = false` in the browser's SubtleCrypto subsystem, preventing third-party JavaScript inspection from dumping raw key bytes via console reflection.
3. **Unique Nonces (IVs):** A cryptographically fresh 12-byte random IV (`crypto.getRandomValues(new Uint8Array(12))`) is generated for every single write, strictly preventing AES-GCM nonce reuse vulnerabilities.
4. **Passphrase Ephemerality:** Raw passphrases and plaintext keys are never written to `localStorage`, `sessionStorage`, or persistent state.

---

## 2. Permitted vs. Strictly Prohibited Vault Data

To prevent sensitive clinical profiling, the vault schema strictly enforces data classification boundaries:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      VAULT DATA ADMISSION BOUNDARIES                   │
├───────────────────────────────────┬────────────────────────────────────┤
│ PERMITTED (Category C Only)       │ STRICTLY FORBIDDEN (Never Stored)  │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Completed habit IDs (e.g.       │ • PHQ-9 answers (Items 1–8)        │
│   'sleep_anchor', 'pomodoro')     │ • PHQ-9 Item 9 (Self-harm item)    │
│ • Habit domain interest tags      │ • PHQ-9 total score (0–27)         │
│ • Total habit check-in counter    │ • Clinical depression severity tier│
│ • Student helpline country choice │ • ML risk percentage (0–100%)      │
│ • Vault lock / unlock state       │ • SHAP feature attributions        │
│                                   │ • Free-form qualitative notes      │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 3. Threat Model & Realistic Cryptographic Limitations

> [!CAUTION]
> **HONEST SECURITY DISCLAIMER:**  
> Encryption does NOT guarantee total privacy or prevent device-level compromise. Client-side cryptography operates within the host operating system and browser sandbox; if the host machine is untrusted or compromised, cryptography cannot compensate for fundamental platform insecurities.

### Threat Vector Analysis

| Threat Vector | Severity | Attack Mechanism | Proposed Mitigation | Residual Risk & Unavoidable Limitations |
|---|---|---|---|---|
| **1. Forgotten Passphrase** | Critical | Student forgets passphrase; no central recovery server exists. | Clear UI warning before vault creation. | **Total Irreversible Data Loss:** By design, zero backdoor or password reset mechanism exists. |
| **2. Shared Library Terminals** | High | Student walks away without locking vault or leaves exported file in Downloads. | Inactivity auto-lock (15 mins); session-only default; single-click "Destroy Vault". | **Shoulder Surfing / Session Hijacking:** If the browser remains unlocked, physical bystanders can view decrypted habits. |
| **3. Exported Vault File Lingering** | High | Student exports `.enc` file, uploads it to shared drive, or downloads plaintext copy. | Force authenticated encryption on export (`.enc` format with embedded salt/IV). | **Plaintext Artifacts in OS Cache:** Operating system swap space, print spoolers, or browser download history may retain file metadata. |
| **4. Host Malware & Keyloggers** | Critical | Infostealer or keylogger active on student's personal computer. | None possible at browser application layer. | **Catastrophic Compromise:** Keylogger captures passphrase during typing; memory dump tools extract plaintext from browser process. |
| **5. Cross-Site Scripting (XSS)** | Critical | Malicious script injected via third-party dependency. | Strict Content Security Policy (CSP); zero external CDNs; non-extractable keys. | **Session-Time Exfiltration:** While non-extractable keys prevent dumping raw keys, XSS can invoke `decrypt()` while the vault is unlocked. |
| **6. JavaScript Memory Zeroisation** | Medium | Plaintext remains in garbage-collected JavaScript heap. | Manual buffer wiping (`Uint8Array.fill(0)`) where possible. | **V8 Engine Indeterminism:** JavaScript engines do not guarantee immediate zeroisation of strings or garbage-collected objects. |

---

## 4. Encrypted Export / Import Specification

For students who wish to transfer habit progress between their phone and laptop without a central server, Mindora 2.0 designs an **Explicit Encrypted File Interchange**:

1. **Format:** Standard JSON payload encrypted into an authenticated `.enc` container:
   ```json
   {
     "magic": "MINDORA_VAULT_V1",
     "kdf": "PBKDF2_SHA256",
     "iterations": 600000,
     "salt_hex": "e4f8...",
     "iv_hex": "a1b2...",
     "auth_tag_hex": "99cc...",
     "ciphertext_hex": "77dd..."
   }
   ```
2. **Schema Migration & Versioning:** The payload inside ciphertext includes a semantic version (`schema_version: "1.0"`). Future revisions must include migration transformers to upgrade legacy habit keys cleanly.
3. **Explicit Student Agency:** Export requires re-authenticating with the passphrase. Import requires entering the passphrase used during export. The server never sees the file.

---

## 5. Why Argon2id Does NOT Equal "Zero-Knowledge Sync"

In speculative product discussions, developers frequently confuse a memory-hard key derivation function (such as Argon2id) with a full zero-knowledge synchronization system. We explicitly clarify:

1. **Argon2id is a KDF, NOT a Cryptographic Protocol:** Argon2id is designed to resist GPU/ASIC brute-force dictionary attacks during password hashing. It does not solve transport blinding, authentication without knowledge, or concurrent write reconciliation.
2. **Metadata Leakage in Cloud Stores:** Even if habit payloads are encrypted with a client-derived Argon2id key, storing them on a remote server inevitably leaks:
   - Client IP addresses and geolocation.
   - Exact timestamps and frequency of student check-ins.
   - Payload byte sizes and change deltas (revealing behavioral activity periods).
3. **Key Recovery Dilemma:** A true zero-knowledge cloud store cannot assist a student who loses their passphrase. If account recovery via email or SMS is introduced, the system ceases to be zero-knowledge.

> [!IMPORTANT]
> **Implementation Status:** The encrypted local vault is **NOT IMPLEMENTED** in Stage 0. Mindora continues to execute exclusively in transient session memory.
