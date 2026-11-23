# MINDORA 2.0 — PHASE 6.1: SMTP PRODUCTION CONFIGURATION GUIDE

## 1. Executive Summary
Phase 6.1 replaces legacy SMS notification transport with an authenticated, encrypted Python SMTP email notification infrastructure for automated student wellness alerts and guardian verification.

This document outlines environment variables, provider credentials, security protocols, and network requirements for deploying Mindora 2.0 with production email delivery.

---

## 2. Environment Variables Specification

The backend reads configuration directly from environment variables or the `.env` file:

| Variable | Type | Default | Description |
|---|---|---|---|
| `SMTP_HOST` | String | `smtp.gmail.com` | Hostname of the target SMTP relay server. |
| `SMTP_PORT` | Integer | `465` | SMTP port (465 for SSL, 587 for STARTTLS). |
| `SMTP_USERNAME` | String | *Required in Prod* | Authenticated SMTP username or mailbox address. |
| `SMTP_PASSWORD` | String | *Required in Prod* | App-specific password or API token. Never use raw account passwords. |
| `EMAIL_FROM` | String | `Mindora Student Wellbeing Platform <notifications@mindora-wellness.org>` | RFC 5322 From header formatted address. |
| `SMTP_USE_SSL` | Boolean | `true` | `true` for direct SSL/TLS (port 465); `false` for STARTTLS (port 587). |
| `SMTP_TIMEOUT` | Integer | `15` | Socket connect and communication timeout in seconds. |

---

## 3. Supported Production SMTP Providers

### A. Google Workspace / Gmail App Password
When using Google Workspace or Gmail:
1. Enable 2-Step Verification on the sender account.
2. Navigate to **Google Account Settings &rarr; Security &rarr; 2-Step Verification &rarr; App passwords**.
3. Generate a new App password named `Mindora Production Emailer`.
4. Configure:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USE_SSL=true
   SMTP_USERNAME=notifications@yourdomain.edu
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx (16-character app password)
   EMAIL_FROM="Mindora Student Wellbeing <notifications@yourdomain.edu>"
   ```

### B. Amazon Simple Email Service (SES)
1. Verify sender domain and identity in AWS SES Console.
2. Generate SES SMTP credentials under **SMTP settings**.
3. Configure:
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USE_SSL=false
   SMTP_USERNAME=AKIAIOSFODNN7EXAMPLE
   SMTP_PASSWORD=BK7+w...example...password
   EMAIL_FROM="Mindora Wellbeing <notifications@wellness.university.edu>"
   ```

### C. SendGrid
1. Create an API key with Mail Send permissions.
2. Configure:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USE_SSL=false
   SMTP_USERNAME=apikey
   SMTP_PASSWORD=SG.your_actual_api_key_here
   EMAIL_FROM="Mindora <notifications@university.edu>"
   ```

---

## 4. Network & Egress Firewall Requirements
Most hosting providers (e.g. Render, AWS EC2, GCP, DigitalOcean) restrict default outbound port 25 to prevent spam abuse.
- Mindora 2.0 **strictly uses Port 465 (SSL)** or **Port 587 (STARTTLS)**.
- Ensure your hosting firewall rules allow outbound TCP traffic on ports **465** and **587**.

---

## 5. Privacy & Cryptographic Guarantees
- **No Health Disclosures:** Notification emails strictly follow frozen, non-diagnostic templates. Numerical stress metrics, PHQ-9 items, and clinical inferences are strictly forbidden by code assertions.
- **Hashed OTPs at Rest:** Verification tokens are hashed with SHA-256 and salted per student before storage in `guardian_verification_tokens`.
- **Recipient Encryption at Rest:** Guardian email addresses are encrypted using AES-256-GCM authenticated encryption bound to the student user ID (`user:{id}:guardian_email`).
- **Credential Hygiene:** SMTP credentials are never logged or exposed in HTTP responses or diagnostic receipts.
