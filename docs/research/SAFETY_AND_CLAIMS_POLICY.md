# MINDORA 2.0 — SAFETY, CLAIMS & EXPLAINABILITY POLICY
**Document Ref:** `docs/research/SAFETY_AND_CLAIMS_POLICY.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Status:** Approved Safety Policy  

---

## 1. PRIMARY OBJECTIVE

Mental health technologies operate in a high-stakes ethical and psychological domain. Careless UI copy, exaggerated algorithmic claims, or failure to properly escalate acute distress can cause real-world psychological harm.

This policy defines:
1. Permitted student-facing claims versus strictly prohibited medical assertions.
2. The deterministic, zero-tolerance PHQ-9 Item 9 crisis escalation protocol.
3. Safe operating boundaries for the Grounded Student Resource Navigator (Engine 3) and optional local small language models (Qwen).
4. Epistemological boundaries for SHAP feature explainability.

---

## 2. PERMITTED VS. PROHIBITED STUDENT-FACING CLAIMS

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STUDENT-FACING CLAIMS AUDIT                     │
├───────────────────────────────────┬────────────────────────────────────┤
│       ✔ PERMITTED CLAIMS          │        ✖ STRICTLY PROHIBITED       │
├───────────────────────────────────┼────────────────────────────────────┤
│ • "Reflect on your daily habits,  │ • "Find out your medical risk of   │
│   academic workload, and sleep."  │   depression."                     │
│ • "Standardized PHQ-9 symptom     │ • "Clinical depression diagnosis   │
│   screening score: 12 (Moderate)."│   or confirmation."                │
│ • "Exploratory lifestyle pattern  │ • "You have a 78% probability of   │
│   indicator."                     │   depression."                     │
│ • "Consider reaching out to a     │ • "Our AI proves you have mental   │
│   qualified counselor or doctor." │   illness."                        │
│ • "Actionable wellness micro-     │ • "Therapeutic treatment plan or   │
│   habits to support your routine."│   cure."                           │
└───────────────────────────────────┴────────────────────────────────────┘
```

### 2.1 Mandatory UI Safety Notice (Binding across all screens)
Every assessment and results screen in Mindora must display the following standardized safety banner:
> **Self-Reflection & Educational Tool Only:** Mindora is an educational self-reflection platform, not a medical or diagnostic tool. Mindora does not provide medical diagnoses, treatment, or psychiatric evaluations. If you are experiencing persistent distress, severe anxiety, depression, or suicidal thoughts, please consult a qualified healthcare professional or contact a crisis support service immediately.

---

## 3. PHQ-9 ITEM 9 SUPPORTIVE SAFETY PROTOCOL

### 3.1 Item 9 Response Architecture
PHQ-9 Item 9 evaluates thoughts of death, self-harm, or passive suicidal ideation:
*"Thoughts that you would be better off dead, or of hurting yourself in some way"*
- Options: $0$ (Not at all), $1$ (Several days), $2$ (More than half the days), $3$ (Nearly every day).

### 3.2 Clinical Distinctions: Screening Response vs. Imminent Danger
In psychiatric clinical practice, self-reported thoughts of being "better off dead" indicate emotional distress requiring compassionate exploration, but **must not automatically be represented as proof of imminent danger.** Mindora formally establishes a three-way clinical distinction:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ITEM 9 SAFETY RESPONSE TIERS                         │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. POSITIVE ITEM 9 SCREENING      │ • Nature: Selecting 1, 2, or 3 on  │
│    RESPONSE                       │   Item 9 without active crisis.    │
│    (Distress & Ideation)          │ • System Action: Supportive, calm, │
│                                   │   non-alarmist safety guidance.    │
│                                   │   Renders confidential warm lines, │
│                                   │   crisis text lines, campus health,│
│                                   │   and advice to see a doctor.      │
├───────────────────────────────────┼────────────────────────────────────┤
│ 2. IMMINENT DANGER / ACUTE RISK   │ • Nature: Active emergency, acute  │
│    DISCLOSED BY STUDENT           │   intent to self-harm, or immediate│
│    (Emergency Situation)          │   danger to life.                  │
│                                   │ • System Action: High-priority     │
│                                   │   emergency contact card. Direct   │
│                                   │   dial to 999/112 (UK), 112/14416  │
│                                   │   (India), 911/988 (US/Canada).    │
├───────────────────────────────────┼────────────────────────────────────┤
│ 3. SUPPORTIVE GUIDANCE            │ • Normalizes help-seeking behavior.│
│    (Compassionate Framing)        │ • Avoids hostile or punitive locks.│
│                                   │ • Provides both non-emergency and  │
│                                   │   emergency support pathways.      │
└───────────────────────────────────┴────────────────────────────────────┘
```

### 3.3 Core Safety Protocol Rules:
1. **Supportive, Safety-Focused Response:** A positive Item 9 response triggers an immediate, supportive safety card providing clear follow-up guidance and confidential support pathways.
2. **Decoupled from ML:** Item 9 is **never** passed to Engine 2 or used as a feature in any machine-learning model. It is handled exclusively by Engine 1's deterministic safety pathway.
3. **Primacy of Human Professional Care:** The system always directs the student toward human clinical professionals (general practitioners, psychiatrists, campus counselors).
4. **Prohibition of LLM Crisis Determination:** Small language models (e.g., local Qwen) are **strictly forbidden from evaluating crisis severity, triaging suicidal intent, or replacing deterministic safety cards.** All crisis interactions are handled by pre-vetted, static deterministic templates.

### 3.4 Regional Emergency Resource Directory
The crisis pathway presents verified, geo-specific emergency contact information stored deterministically in `resources/crisis_resources.json` and cross-referenced with `docs/research/RESOURCE_VERIFICATION_AND_RETENTION.md`:

#### India (Default Regional Pathway):
- **National Emergency Services (Immediate Danger to Life):** Phone: **112** (24/7, police/fire/ambulance). Fallback: 100/108.
- **Tele-MANAS (MoHFW, Government of India):**
  - Toll-Free 24/7 Hotline: **14416** or **1800-89-14416**
  - Scope: General national tele-mental health support across 20+ languages. (Note: General counseling; do not claim dedicated youth counselors unless independently confirmed).
  - Source: `https://telemanas.mohfw.gov.in` (Verified: 2026-11-15).
  - Decommissioned Fallback Note: KIRAN Helpline (1800-599-0019), launched in 2020 by DEPwD, was integrated into Tele-MANAS in 2022. It is removed as an active standalone fallback.
  - Fallback: Dial National Emergency Number 112 (ERSS) or attend nearest Government District Hospital casualty / psychiatric OPD.
- **Child Helpline (Under 18):** Phone: **1098** (24/7 toll-free child protection & support, MWCD / Mission Vatsalya). Fallback: 112.

#### United Kingdom (UK Regional Pathway — Four-Nation Disaggregated):
- **Immediate Life-Threatening Emergency (All UK):** **999** or **112** (Immediate danger to life, including life-threatening mental health crises). Fallback: Emergency SMS (register at `emergencysms.net`) or attend nearest hospital A&E / Emergency Department.
- **England (Urgent Mental Health):** **NHS 111** (Call 111, select mental health option, or online at `https://111.nhs.uk`, 24/7). Source: `https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/` (Verified: 2026-11-15). Fallback: 999.
- **Wales (Urgent Mental Health):** **NHS 111 Wales** (Call 111 and press 2 for mental health services, 24/7). Source: `https://111.wales.nhs.uk/` (Verified: 2026-11-15). Fallback: 999.
- **Scotland (Urgent Mental Health):** **NHS 24 Mental Health Hub** (Call 111, available 24/7). Source: `https://www.nhs24.scot/our-services/nhsinform/mental-health-services/` (Verified: 2026-11-15). Fallback: 999.
- **Northern Ireland (Urgent Mental Health):** **Lifeline NI** (Freephone: **0808 808 8000**; textphone: **18001 0808 808 8000**, 24/7 confidential crisis line) and local HSC Trust Crisis Resolution & Home Treatment Teams. Source: `https://www.lifelinehelpline.info` and `https://www.nidirect.gov.uk/articles/mental-health-emergency-contacts` (Verified: 2026-11-15). Fallback: 999 or attend nearest hospital Emergency Department.
- **Childline UK (Under 19):** Freephone: **0800 1111** (24/7 phone; 1-to-1 counsellor web chat at `childline.org.uk` open 7:30 AM – 3:30 AM daily UK time). Source: `https://www.childline.org.uk` (Verified: 2026-11-15). Fallback: Text SHOUT to 85258 or call regional NHS mental health pathway.
- **SHOUT UK (All Ages / Students):** Free, confidential 24/7 SMS: Text **'SHOUT' to 85258** (EE, O2, Vodafone, Three, Virgin, BT, Tesco Mobile). Source: `https://giveusashout.org` (Verified: 2026-11-15). Fallback: Samaritans (116 123).
- **Samaritans UK:** Freephone: **116 123** (24/7 listening service). Source: `https://www.samaritans.org` (Verified: 2026-11-15).

#### United States (US Regional Pathway):
- **988 Suicide & Crisis Lifeline (National):** Call or Text: **988** (Toll-Free, 24/7, nationwide across all 50 states, DC, and territories). 988 is the US national Suicide & Crisis Lifeline, funded by SAMHSA. It provides crisis counselling by call, text and chat. When a counselor determines that an imminent safety emergency requires additional intervention, the 988 service may coordinate with 911 or other appropriate emergency services according to its safety policies. Source: `https://988lifeline.org` (SAMHSA, Verified: 2026-11-15). Terms of Service: `https://988lifeline.org/terms-of-service/` ; Safety Policy: `https://988lifeline.org/faq/about-us/faq-does-vibrant-use-police-intervention-for-callers-texters-and-chatters/`. 988 and 911 are NOT interchangeable. Fallback: Text HOME to 741741 (Crisis Text Line); for immediate physical danger, dial 911.
- **YouthLine (Nonprofit Youth Peer-Support & Crisis Service):**
  - Organization & Reach: Nonprofit youth peer-support and crisis intervention service operated by Lines for Life in Oregon, with service reach described by its official website as extending across all 50 US states. It is a charitable nonprofit program, NOT a federal government service.
  - Age Eligibility: Youth and young adults up to age 24 (official website supports "youth up to age 24" / "ages 10–24"; no unverified minimum age is invented where general materials specify "up to age 24").
  - Contact Channels & Hours:
    * Youth Peer Support: Daily 4:00 PM – 10:00 PM Pacific Time (7:00 PM – 1:00 AM Eastern Time) via Phone (**1-877-968-8491**), Text (Text **'teen2teen' to 839863**), and Web Chat (`https://www.theyouthline.org`).
    * Outside Peer-Support Hours: Outside youth peer-support hours, adult staff from Lines for Life answer the YouthLine phone line (**1-877-968-8491**) ensuring continuous 24/7 phone access. (Note: Official sources confirm adult staff answer phone calls outside peer hours; official sources do NOT confirm that adult staff answer texts or chats 24/7; do not describe adult staff as clinicians unless officially supported).
  - Official Sources: `https://www.theyouthline.org/` and `https://www.theyouthline.org/our-work/` (also `https://www.theyouthline.org/for-youth/`, Verified: 2026-11-15).
  - National Lifeline Distinction: Strictly distinct from the federal national 988 Suicide & Crisis Lifeline. Fallback: For crisis counseling, call/text national 988 or text HOME to 741741; for immediate physical danger, dial 911.
- **Crisis Text Line (US):** Free SMS: Text **'HOME' to 741741** (24/7). Source: `https://www.crisistextline.org` (Verified: 2026-11-15).
- **General Emergency (US):** Phone: **911** (Immediate danger to life). Source: `https://www.911.gov` (Verified: 2026-11-15).

#### Canada (Canada Regional Pathway):
- **988 Suicide Crisis Helpline (National Canadian Service):** Call or Text: **988** (Toll-Free, 24/7, nationwide across all 10 provinces and 3 territories; bilingual English and French). Source: `https://988.ca` (PHAC / CAMH, Verified: 2026-11-15). Fallback: Dial 911 or attend nearest hospital emergency room.
- **Kids Help Phone / Jeunes, j'écoute (Dedicated Canadian Youth Service):**
  - Phone: **1-800-668-6868** (Toll-Free 24/7).
  - Text (English): Text **'CONNECT' to 686868** (24/7).
  - Text (French): Text **'PARLER' to 686868** (24/7).
  - Age Group: Children, youth, and young adults up to age 25.
  - Source: `https://kidshelpphone.ca` (Verified: 2026-11-15).
  - Important Distinction: Dedicated Canadian youth resource; distinct from US regional services. Fallback: Call/text national 988 or call 911.
- **General Emergency (Canada):** Phone: **911** (Immediate danger to life).

---

## 4. BOUNDARIES FOR GROUNDED RESOURCE NAVIGATOR (ENGINE 3)

### 4.1 Provenance Requirements
- All resources presented by Engine 3 must originate from verified static JSON catalogs (`resources/crisis_resources.json`, `resources/protocols.json`, `resources/source_manifest.json`).
- Catalogs must document source authority, contact telephone numbers, operating hours, language availability, and verification timestamps.

### 4.2 Safe Boundaries for Optional Local SLM (Qwen 1.5B/0.5B)
If an offline small language model is deployed for natural language assistance:
1. **Strictly Extractive Summarization:** The model is constrained via system prompts and grammar-guided decoding to summarize pre-retrieved text snippets from verified resource files.
2. **Strictly Prohibited Actions:**
   - The model must **never** diagnose or label student symptoms.
   - The model must **never** invent therapy exercises, CBT restructuring, or pharmacological advice.
   - The model must **never** respond to suicidal expressions with conversational text; it must output the deterministic crisis card immediately.
3. **Fallback Guarantee:** If the local SLM fails to load or runs out of memory, Engine 3 falls back seamlessly to deterministic JSON card rendering.

---

## 5. EPISTEMOLOGICAL BOUNDARIES OF SHAP FEATURE EXPLAINABILITY

Engine 2 incorporates SHAP (SHapley Additive exPlanations) to provide local feature attributions for its lifestyle pattern predictions.

### 5.1 What SHAP Actually Measures
SHAP calculates the game-theoretic Shapley value of each feature, representing **its marginal additive contribution to the model's mathematical output function** for a given input relative to the expected base value:
$$f(x) = \phi_0 + \sum_{j=1}^{M} \phi_j(x)$$

### 5.2 What SHAP DOES NOT Measure (Prohibited Causal Claims)
- **SHAP is NOT causal proof:** A positive SHAP value for `Academic Pressure` does **not** mean that academic pressure caused the student's distress. It means that within the trained mathematical function, that input value pushed the output score higher.
- **SHAP does not prove biological etiology:** Correlational tree splits cannot establish neurobiological or psychological causality.
- **Required UI Framing:** In all student-facing displays, SHAP contributions must be labeled as:
  > *"How your answers contributed to this statistical lifestyle pattern estimate"* (NOT *"What is causing your depression"*).

---

## 6. MINOR ACCESS SAFEGUARDS & ADOLESCENT REDIRECTION PROTOCOL

### 6.1 Intended Adult Population Scope vs. Legal Guarantees
- Mindora's software and research designs are intended specifically for **adult students ($\ge 18$ years of age)** enrolled in tertiary education.
- **Legal Compliance Disclaimer:** Age-gating the user interface does **not** automatically establish compliance with India's DPDP Act 2023, the UK DPA, or GDPR. Similarly, excluding minors from research datasets does not automatically make the application safe or compliant for minors. Full legal compliance requires organizational data protection measures and qualified legal review.

### 6.2 Minor Redirection Workflow
If a student indicates an age under 18 ($< 18$) during interface onboarding:
1. **Compassionate Non-Hostile Messaging:** The student is not met with an abrupt error or lockout. The system renders a calm, supportive transition card:
   > *"Mindora is designed specifically for adult university students (18+). Because you are under 18, we want to ensure you have access to support services and resources dedicated specifically to young people and adolescents."*
2. **Immediate Rendering of Adolescent Support Resources:**
   - **India:** Childline **1098** (24/7 toll-free emergency phone for children in need of care/protection, MWCD / Mission Vatsalya). General crisis support via Tele-MANAS (**14416 / 1800-89-14416**, 24/7). Fallback: ERSS 112. (KIRAN 1800-599-0019 was integrated into Tele-MANAS in 2022 and is removed as an active fallback).
   - **United Kingdom:** Childline UK **0800 1111** (Freephone 24/7; 1-to-1 counsellor web chat at `childline.org.uk` 7:30 AM – 3:30 AM daily; for children and youth up to age 19, NSPCC). Free crisis text via SHOUT (Text **'SHOUT' to 85258**, 24/7 across UK networks). Regional urgent NHS pathways: England NHS 111, Wales NHS 111 (opt 2), Scotland NHS 24 (111), NI Lifeline (**0808 808 8000**). Fallback: 999.
   - **United States:** National 988 Suicide & Crisis Lifeline (Call/Text **988**, 24/7 crisis counselling funded by SAMHSA; coordinates with 911 for imminent safety emergencies; not interchangeable with 911). Youth peer support via YouthLine (Nonprofit service operated by Lines for Life in Oregon, reach across all 50 states; serving youth up to age 24; Call **1-877-968-8491**, Text **teen2teen to 839863**, or chat at `https://www.theyouthline.org`; youth peer support daily 4:00 PM – 10:00 PM Pacific; outside youth peer-support hours, adult staff from Lines for Life answer the YouthLine phone line; not a federal service). Fallback: Text HOME to 741741; for immediate physical danger, dial 911.
   - **Canada:** 988 Suicide Crisis Helpline (Call/Text **988**, 24/7 bilingual national service). Dedicated youth support via Kids Help Phone (Call **1-800-668-6868** or Text **CONNECT to 686868**; French: Text **PARLER to 686868**; 24/7 bilingual support for ages up to 25). Fallback: Call 911.

---

## 7. POLICY RECONCILIATION

- [x] Clear permitted vs. prohibited student-facing claims established.
- [x] Mandatory UI non-diagnostic disclaimer codified.
- [x] PHQ-9 Item 9 supportive safety protocol formalized, clearly distinguishing screening ideation from imminent danger.
- [x] Human professional primacy established; LLMs prohibited from crisis severity determinations.
- [x] Regional crisis hotlines (India Tele-MANAS 14416 / 1800-89-14416; UK England NHS 111, Wales NHS 111 opt 2, Scotland NHS 24, NI Lifeline 0808 808 8000; US 988; Canada 988) updated and verified.
- [x] Minor access adolescent redirection protocol codified with dedicated youth helplines (India 1098; UK Childline 0800 1111 & SHOUT 85258; US YouthLine youth up to age 24, all 50 states reach, peer hours 4-10pm PT, adult phone outside; Canada Kids Help Phone 1-800-668-6868).
- [x] Non-causal framing for SHAP feature attributions mandated.
