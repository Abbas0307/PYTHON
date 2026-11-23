# MINDORA 2.0 — REGIONAL RESOURCE VERIFICATION & DATA RETENTION SPECIFICATION
**Document Ref:** `docs/research/RESOURCE_VERIFICATION_AND_RETENTION.md`  
**Project:** Mindora 2.0 — Offline-First Student Wellbeing Intelligence Platform  
**Location:** `D:\Depression calculator`  
**Git Branch:** `mindora-2.0-rebuild`  
**Date:** 2026-11-15  
**Stage:** 2.3 Final Research & Retention Specification  
**Status:** Approved & Verified  

---

## 1. PURPOSE & SCOPE

This specification provides:
1. An exhaustive, independently verified audit of all regional crisis helplines, mental health services, and adolescent support pathways across **India, the United Kingdom (England, Wales, Scotland, Northern Ireland), the United States, and Canada**.
2. Mandatory metadata standards for every resource: geographic eligibility, intended age group, contact method, operating hours, official source URL, verification timestamp, and emergency fallback instructions.
3. A documented **Data Minimisation & Governed Retention Policy** replacing unconstrained raw data storage and arbitrary retention periods with strict, purpose-specific, and ethics-governed research retention standards.
4. Accurate technical framing of ephemeral browser runtime memory processing versus client storage boundaries.

---

## 2. INDEPENDENT REGIONAL RESOURCE DIRECTORY

Every resource below has been independently audited and verified against official governmental, statutory health authority, and public health registries as of **15 November 2026**.

### 2.1 India Directory

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INDIA CRISIS & SUPPORT DIRECTORY                │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Tele-MANAS (National Tele Mental Health Programme)                  │
│    • Authority: Ministry of Health and Family Welfare (MoHFW),         │
│      Government of India / NIMHANS Apex Coordinating Centre.           │
│    • Geographic Eligibility: India nationwide (all 36 States & UTs).   │
│    • Intended Age Group: All age groups (General population).          │
│    • Contact Method: Toll-Free Phone: 14416 or 1800-89-14416           │
│    • Operating Hours: 24 hours a day, 7 days a week (24/7).            │
│    • Languages Supported: 20+ scheduled Indian languages and English.  │
│    • Official Source URL: https://telemanas.mohfw.gov.in               │
│    • Verification Date: 2026-11-15.                                    │
│    • Operational Note: General mental health counseling; do not claim  │
│      dedicated youth counselors unless independently confirmed.        │
│    • Decommissioned Fallback Note: KIRAN Helpline (1800-599-0019),     │
│      launched in 2020 by DEPwD, was integrated into Tele-MANAS in      │
│      2022. It is removed as an independent active fallback.           │
│    • Fallback Instruction: If lines are busy, dial National Emergency  │
│      Number 112 (ERSS), or attend the nearest Government District      │
│      Hospital casualty / psychiatric OPD department.                   │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Child Helpline (Childline India / Mission Vatsalya)                 │
│    • Authority: Ministry of Women and Child Development (MWCD),        │
│      Government of India (Integrated with ERSS 112).                   │
│    • Geographic Eligibility: India nationwide.                         │
│    • Intended Age Group: Children and adolescents under 18 (< 18).     │
│    • Contact Method: Toll-Free Emergency Phone: 1098                   │
│    • Operating Hours: 24/7, 365 days a year.                           │
│    • Official Source URL: https://wcd.nic.in                           │
│    • Verification Date: 2026-11-15.                                    │
│    • Fallback Instruction: Dial National Emergency Number 112 or local │
│      police station if 1098 is unavailable.                            │
├────────────────────────────────────────────────────────────────────────┤
│ 3. National Emergency Services (ERSS)                                  │
│    • Authority: Ministry of Home Affairs, Government of India.         │
│    • Geographic Eligibility: India nationwide.                         │
│    • Intended Age Group: All age groups.                               │
│    • Contact Method: Phone: 112 (Unified Police, Fire, Medical).       │
│    • Operating Hours: 24/7, 365 days a year.                           │
│    • Official Source URL: https://112.gov.in                           │
│    • Verification Date: 2026-11-15.                                    │
│    • Fallback Instruction: Dial 100 (Police) or 108/102 (Ambulance).   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 United Kingdom Directory (Four-Nation Disaggregated Pathways)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   UNITED KINGDOM CRISIS & SUPPORT DIRECTORY            │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Emergency Services (Immediate Life-Threatening Danger - All UK)     │
│    • Authority: UK Home Office / Association of Ambulance Chief Execs. │
│    • Geographic Eligibility: United Kingdom (England, Scotland, Wales, │
│      Northern Ireland).                                                │
│    • Intended Age Group: All age groups.                               │
│    • Contact Method: Phone: 999 or 112 (Free from all networks).       │
│    • Operating Hours: 24/7, 365 days a year.                           │
│    • Official Source URL: https://www.nhs.uk/nhs-services/urgent-and-  │
│      emergency-care-services/when-to-call-999/                         │
│    • Verification Date: 2026-11-15.                                    │
│    • Scope: Immediate danger to life, acute self-harm, or critical     │
│      physical/mental health emergency.                                 │
│    • Fallback Instruction: If unable to speak, call 999 and press 55   │
│      when prompted (Silent Solution). Emergency SMS via registration.  │
├────────────────────────────────────────────────────────────────────────┤
│ 2a. England: NHS 111 Mental Health Services                            │
│    • Authority: NHS England.                                           │
│    • Geographic Eligibility: England.                                  │
│    • Intended Age Group: All age groups (children, young people, adults)│
│    • Contact Method: Phone: 111 (Select mental health option) or       │
│      Online: https://111.nhs.uk                                        │
│    • Operating Hours: 24/7, 365 days a year.                           │
│    • Official Source URL: https://www.nhs.uk/nhs-services/mental-      │
│      health-services/where-to-get-urgent-help-for-mental-health/       │
│    • Verification Date: 2026-11-15.                                    │
│    • Operational Scope: Connects caller directly to local NHS urgent   │
│      mental health teams for telephone assessment and triage.          │
│    • Fallback Instruction: Call 999 or attend nearest hospital A&E.    │
├────────────────────────────────────────────────────────────────────────┤
│ 2b. Wales: NHS 111 Wales (Mental Health Option 2)                      │
│    • Authority: NHS Wales / Welsh Ambulance Services NHS Trust.        │
│    • Geographic Eligibility: Wales.                                    │
│    • Intended Age Group: All age groups.                               │
│    • Contact Method: Phone: 111 (Press option 2 for mental health).    │
│    • Operating Hours: 24/7, 365 days a year (Free from landlines/mob). │
│    • Official Source URL: https://111.wales.nhs.uk/                    │
│    • Verification Date: 2026-11-15.                                    │
│    • Operational Scope: Direct access to local mental health workers   │
│      without GP referral across all Welsh health boards.               │
│    • Fallback Instruction: In immediate danger call 999 or attend A&E. │
├────────────────────────────────────────────────────────────────────────┤
│ 2c. Scotland: NHS 24 Mental Health Hub                                 │
│    • Authority: NHS Scotland / NHS 24 Special Health Board.            │
│    • Geographic Eligibility: Scotland.                                 │
│    • Intended Age Group: All age groups.                               │
│    • Contact Method: Phone: 111 (Mental Health Hub).                   │
│    • Operating Hours: 24/7, 365 days a year.                           │
│    • Official Source URL: https://www.nhs24.scot/our-services/         │
│      nhsinform/mental-health-services/ (and https://www.nhsinform.scot)│
│    • Verification Date: 2026-11-15.                                    │
│    • Operational Scope: Telephone triage and support staffed by Mental │
│      Health Advisors and Psychological Wellbeing Practitioners.        │
│    • Fallback Instruction: In immediate danger call 999 or attend A&E. │
├────────────────────────────────────────────────────────────────────────┤
│ 2d. Northern Ireland: Lifeline NI & HSC Crisis Pathways                │
│    • Authority: Public Health Agency (PHA) NI / Health and Social Care │
│      (HSC) Trusts Northern Ireland.                                    │
│    • Geographic Eligibility: Northern Ireland.                         │
│    • Intended Age Group: All age groups (residents of Northern Ireland)│
│    • Contact Method: Freephone: 0808 808 8000;                         │
│      Textphone (Deaf/Hard of Hearing): 18001 0808 808 8000;            │
│      Local HSC Trust Crisis Resolution and Home Treatment Teams.       │
│    • Operating Hours: 24/7, 365 days a year (Free from all NI phones). │
│    • Official Source URL: https://www.lifelinehelpline.info and        │
│      https://www.nidirect.gov.uk/articles/mental-health-emergency-contacts│
│    • Verification Date: 2026-11-15.                                    │
│    • Operational Scope: Confidential crisis line providing immediate   │
│      counseling, de-escalation, and referral into HSC Trust services.  │
│    • Fallback Instruction: Call 999 or attend the nearest Emergency    │
│      Department (e.g., Royal Victoria, Ulster, Altnagelvin, Craigavon).│
├────────────────────────────────────────────────────────────────────────┤
│ 3. Childline UK (NSPCC)                                                │
│    • Authority: National Society for the Prevention of Cruelty to      │
│      Children (NSPCC). Registered Charity Numbers 216401 & SC037717.   │
│    • Geographic Eligibility: United Kingdom nationwide.                │
│    • Intended Age Group: Children and young people up to age 19.       │
│    • Contact Method:                                                   │
│      - Telephone: Freephone 0800 1111 (Free, confidential, unlisted).  │
│      - Online Chat: 1-to-1 Counsellor Web Chat at childline.org.uk.    │
│    • Operating Hours:                                                  │
│      - Telephone Helpline: 24/7, 365 days a year.                      │
│      - 1-to-1 Counsellor Web Chat: Daily 7:30 AM – 3:30 AM (UK time).  │
│    • Official Source URL: https://www.childline.org.uk                 │
│    • Verification Date: 2026-11-15.                                    │
│    • Fallback Instruction: Text SHOUT to 85258 or call regional NHS    │
│      mental health pathway. If in immediate danger, call 999.          │
├────────────────────────────────────────────────────────────────────────┤
│ 4. SHOUT Crisis Text Line                                              │
│    • Authority: Mental Health Innovations (UK Charity 1175173).        │
│    • Geographic Eligibility: United Kingdom (Free on all major UK      │
│      mobile networks: EE, O2, Vodafone, Three, Virgin, BT, Tesco Mob). │
│    • Intended Age Group: All age groups (extensively used by students).│
│    • Contact Method: Free, confidential SMS: Text 'SHOUT' to 85258     │
│    • Operating Hours: 24/7, 365 days a year.                           │
│    • Official Source URL: https://giveusashout.org                     │
│    • Verification Date: 2026-11-15.                                    │
│    • Fallback Instruction: If mobile network SMS fails, call           │
│      Samaritans (116 123) or call regional NHS mental health service.  │
├────────────────────────────────────────────────────────────────────────┤
│ 5. Samaritans UK                                                       │
│    • Authority: Samaritans (Registered Charity 219432 / SC040604).     │
│    • Geographic Eligibility: UK & Republic of Ireland.                 │
│    • Intended Age Group: All age groups.                               │
│    • Contact Method: Freephone: 116 123; Email: jo@samaritans.org      │
│    • Operating Hours: 24/7, 365 days a year.                           │
│    • Official Source URL: https://www.samaritans.org                   │
│    • Verification Date: 2026-11-15.                                    │
│    • Fallback Instruction: Call 111 or 999.                            │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2.3 United States Directory

```
┌────────────────────────────────────────────────────────────────────────┐
│                    UNITED STATES CRISIS & SUPPORT DIRECTORY            │
├────────────────────────────────────────────────────────────────────────┤
│ 1. 988 Suicide & Crisis Lifeline (National Crisis Service)             │
│    • Authority: Substance Abuse and Mental Health Services             │
│      Administration (SAMHSA), U.S. Dept. of Health & Human Services.   │
│    • Geographic Eligibility: United States nationwide (50 States,      │
│      District of Columbia, Puerto Rico, and all U.S. Territories).     │
│    • Intended Age Group: All age groups (Dedicated sub-networks for    │
│      Veterans [press 1], Spanish speakers [press 2], and LGBTQ+ youth).│
│    • Contact Method: Call or Text: 988 (Toll-Free, Confidential).      │
│      Online Chat: https://988lifeline.org/chat/                        │
│    • Operating Hours: 24/7, 365 days a year.                           │
│    • Operational Description: 988 is the US national Suicide & Crisis  │
│      Lifeline, funded by SAMHSA. It provides crisis counselling by     │
│      call, text and chat. When a counselor determines that an imminent │
│      safety emergency requires additional intervention, the 988        │
│      service may coordinate with 911 or other appropriate emergency    │
│      services according to its safety policies.                        │
│    • Emergency Distinction: 988 and 911 are NOT interchangeable. 988   │
│      is a crisis counseling service, not a direct emergency dispatch   │
│      service or PSAP network. Dial 911 for immediate physical danger.  │
│    • Official Source URLs: https://988lifeline.org /                   │
│      https://www.samhsa.gov/find-help/988                              │
│    • Terms of Service: https://988lifeline.org/terms-of-service/       │
│    • Safety Policy: https://988lifeline.org/faq/about-us/faq-does-     │
│      vibrant-use-police-intervention-for-callers-texters-and-chatters/ │
│    • Verification Date: 2026-11-15.                                    │
│    • Fallback Instruction: Text HOME to 741741 (Crisis Text Line); for │
│      immediate physical danger, dial 911.                              │
├────────────────────────────────────────────────────────────────────────┤
│ 2. YouthLine (Nonprofit Youth Peer-Support & Crisis Service)            │
│    • Authority & Governance: Operated by Lines for Life (a 501(c)(3)   │
│      nonprofit organization based in Oregon). It is a nonprofit        │
│      charitable program, NOT a federal government service.             │
│    • Service Reach & Geographic Scope: YouthLine's official website    │
│      describes its service reach as extending across all 50 US states, │
│      receiving calls, texts, and chats from youth nationwide.          │
│      (Local in-person community referrals remain centered in Oregon /  │
│      Pacific NW partner channels; 988 is the separate national         │
│      crisis counseling lifeline funded by SAMHSA).                     │
│    • Intended Age Group: Youth and young adults up to age 24 (official │
│      source phrasing specifies "youth up to age 24" / "ages 10–24";    │
│      no unverified minimum age is invented where sources state         │
│      "up to age 24").                                                  │
│    • Contact Channels & Methods:                                       │
│      - Telephone: 1-877-968-8491 (Toll-Free, 24/7).                    │
│      - Text Messaging: Text 'teen2teen' to 839863 (4 PM – 10 PM PT).   │
│      - Online Web Chat: https://www.theyouthline.org (4 PM – 10 PM PT).│
│      - Email: teen2teen@linesforlife.org.                              │
│    • Operating Hours:                                                  │
│      - Youth Peer Support: Daily 4:00 PM – 10:00 PM Pacific Time       │
│        (7:00 PM – 1:00 AM Eastern Time), answered by trained youth     │
│        peer volunteers and young adult interns.                        │
│      - Outside Peer-Support Hours: Outside youth peer-support hours,   │
│        adult staff from Lines for Life answer the YouthLine phone line │
│        (1-877-968-8491), ensuring continuous 24/7 phone access.        │
│        (Note: Official sources confirm adult staff answer phone calls  │
│        outside peer hours; official sources do NOT confirm that adult  │
│        staff answer texts or chats 24/7; do not describe adult staff   │
│        as clinicians unless supported by official sources).            │
│    • Official Source URLs: https://www.theyouthline.org/ and           │
│      https://www.theyouthline.org/our-work/ (also for-youth portal at  │
│      https://www.theyouthline.org/for-youth/).                         │
│    • Verification Date: 2026-11-15.                                    │
│    • National Service Separation: National 988 Suicide & Crisis        │
│      Lifeline is kept strictly separate as the federal nationwide      │
│      crisis counseling lifeline.                                       │
│    • Fallback Instruction: For crisis counseling, call/text 988        │
│      Lifeline or text HOME to 741741 (Crisis Text Line); for immediate │
│      physical danger, dial 911.                                        │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Crisis Text Line (US)                                               │
│    • Authority: Crisis Text Line (501(c)(3) non-profit).               │
│    • Geographic Eligibility: United States nationwide.                 │
│    • Intended Age Group: All age groups (heavily utilized by youth).   │
│    • Contact Method: Free SMS: Text 'HOME' to 741741                   │
│    • Operating Hours: 24/7, 365 days a year.                           │
│    • Official Source URL: https://www.crisistextline.org               │
│    • Verification Date: 2026-11-15.                                    │
│    • Fallback Instruction: Call 988 or dial 911.                       │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Emergency Services (US)                                             │
│    • Authority: Local Public Safety Answering Points (PSAPs).          │
│    • Geographic Eligibility: United States nationwide.                 │
│    • Intended Age Group: All age groups.                               │
│    • Contact Method: Phone: 911 (Voice and text-to-911 where enabled). │
│    • Operating Hours: 24/7, 365 days a year.                           │
│    • Official Source URL: https://www.911.gov                          │
│    • Verification Date: 2026-11-15.                                    │
│    • Fallback Instruction: Attend the nearest hospital Emergency Room. │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2.4 Canada Directory

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CANADA CRISIS & SUPPORT DIRECTORY                 │
├────────────────────────────────────────────────────────────────────────┤
│ 1. 988 Suicide Crisis Helpline (National Canadian Service)             │
│    • Authority: Public Health Agency of Canada (PHAC) / Centre for     │
│      Addiction and Mental Health (CAMH).                               │
│    • Geographic Eligibility: Canada nationwide (10 Provinces & 3       │
│      Territories).                                                     │
│    • Intended Age Group: All age groups.                               │
│    • Contact Method: Call or Text: 988 (Toll-Free across Canada).      │
│    • Operating Hours: 24/7, 365 days a year.                           │
│    • Languages Supported: English and French (Bilingual 24/7).         │
│    • Official Source URL: https://988.ca                               │
│    • Verification Date: 2026-11-15.                                    │
│    • Fallback Instruction: If unable to connect, call local emergency  │
│      services at 911 or visit the nearest hospital emergency room.     │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Kids Help Phone / Jeunes, j'écoute (Dedicated Youth Support)        │
│    • Authority: Kids Help Phone (Canadian National Registered Charity).│
│    • Geographic Eligibility: Canada nationwide.                        │
│    • Intended Age Group: Children, youth, and young adults (aged up    │
│      to 25).                                                           │
│    • Contact Method:                                                   │
│      - Phone: 1-800-668-6868 (Toll-Free, 24/7).                        │
│      - Text (English): Text 'CONNECT' to 686868 (24/7).                │
│      - Text (French): Text 'PARLER' to 686868 (24/7).                  │
│      - Online Chat: https://kidshelpphone.ca (Live Chat).              │
│    • Operating Hours: 24/7, 365 days a year (Bilingual English/French).│
│    • Official Source URL: https://kidshelpphone.ca                     │
│    • Verification Date: 2026-11-15.                                    │
│    • Important Distinction: Canadian youth resource; NOT associated    │
│      with regional U.S. YouthLine.                                     │
│    • Fallback Instruction: Dial national 988 Helpline or call 911.     │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Canadian Emergency Services                                         │
│    • Authority: Municipal and Provincial Emergency Services.           │
│    • Geographic Eligibility: Canada nationwide.                        │
│    • Intended Age Group: All age groups.                               │
│    • Contact Method: Phone: 911.                                       │
│    • Operating Hours: 24/7, 365 days a year.                           │
│    • Official Source URL: https://www.canada.ca                        │
│    • Verification Date: 2026-11-15.                                    │
│    • Fallback Instruction: Proceed to nearest hospital emergency ward. │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. DATA MINIMISATION, EPHEMERAL PROCESSING & RETENTION POLICY

### 3.1 Retraction of "Permanent Raw-Degree Retention"
Previous drafts stated that *"the original verbatim degree string submitted by the respondent must be permanently preserved in raw form"*. 

**This policy is formally retracted and replaced with a strict Data Minimisation and Storage Limitation standard** compliant with the principles of Section 6 of India's DPDP Act 2023, Article 5(1)(c) (Data Minimisation) and Article 5(1)(e) (Storage Limitation) of the GDPR.

### 3.2 Ephemeral Client Runtime Processing & Realistic Technical Boundaries

1. **Ephemeral Processing Standard:**
   - In the live student-facing client, student inputs (such as free-text degree or field of study entries) are processed **ephemerally in volatile application execution memory** purely to assign the student's entry into the standardized 6-Cluster Academic Faculty Taxonomy.
   - Once cluster mapping is evaluated, the reference in application state is released.

2. **Enforceable Application Controls (What Mindora Enforces):**
   - The application does not intentionally write, serialize, or persist raw free text to browser client storage (`localStorage`, `sessionStorage`, `IndexedDB`).
   - The application does not write raw free text to HTTP cookies, query parameters, web server logs, telemetry streams, crash trackers, or client export files.
   - Application-level session state is cleared upon user reset or session teardown.

3. **Technical Realities Outside Application Software Control (Realistic Boundaries):**
   - The application **cannot and does not make claims of guaranteed or instantaneous erasure from hardware RAM or underlying runtime layers.**
   - Software cannot control:
     * Non-deterministic garbage collection cycles in JavaScript engines (e.g., V8, SpiderMonkey, JavaScriptCore) where unreferenced object strings linger in memory pools until garbage collection triggers;
     * Host browser process heap allocation, thread caching, and renderer crash dump retention;
     * Third-party browser extensions, accessibility hooks, form autofill managers, or screen recorders with DOM inspection privileges;
     * Operating system virtual memory pagination, memory compression, swap files on disk, and hardware memory bus remanence.
   - System specifications must accurately document these boundaries rather than making impossible "instant memory scrub" claims.

---

### 3.3 Purpose-Specific, Governed Research Retention (Retraction of Blanket 12-Month Rule)

The previously proposed arbitrary blanket "maximum 12 months" retention rule is **formally retracted**. A blanket 12-month period must not be cited as a legal mandate or universal safe harbour without an explicit empirical and legal basis.

Instead, any retention of research data must satisfy the following five binding governance conditions:

1. **Purpose-Specific Justification:**
   - Retention duration must be calibrated strictly to the documented analytical objective (e.g., taxonomy calibration, longitudinal linguistic drift analysis, NLP disambiguation error verification).
   - Once the specific research objective is fulfilled, the retention basis lapses.

2. **Demonstrated Research Necessity:**
   - The research protocol must demonstrate why the analytical objective cannot be accomplished using aggregated statistics, irreversible tokenization, or synthetic test fixtures.

3. **Participant Consent and Ethics Governance:**
   - Retaining verbatim survey entries or identifiable responses is strictly prohibited unless explicitly authorized in the informed consent agreement provided to participants and approved by an Institutional Review Board (IRB) or recognized Research Ethics Committee (REC).
   - Form submission in general web surveys does not constitute research consent.

4. **Documented Deletion & Irreversible Anonymisation Procedures:**
   - The research data management protocol must define explicit cryptographic sanitization and secure deletion procedures (e.g., NIST SP 800-88 cryptographic wipe) or irreversible k-anonymity hashing upon completion of the research milestone.

5. **Mandatory Pre-Archival Review:**
   - Prior to creating any research archive containing verbatim or potentially re-identifiable data, a Data Protection Impact Assessment (DPIA) and ethics review must be formally executed and signed off.

6. **Default Zero-Retention Standard:**
   - **Do not retain identifiable raw responses by default.** In production environments, client distributions, and open repositories, identifiable raw responses are never stored.

---

## 4. DOCUMENT RECONCILIATION & INTEGRITY CHECKLIST

- [x] Regional helplines across India, UK (England, Wales, Scotland, Northern Ireland), USA, and Canada audited and verified.
- [x] India Tele-MANAS verified: `14416 / 1800-89-14416`; Child Helpline: `1098`.
- [x] KIRAN helpline (1800-599-0019) formally documented as integrated into Tele-MANAS in 2022 and removed as an active fallback.
- [x] UK crisis pathways disaggregated across four nations: England NHS 111, Wales NHS 111 option 2, Scotland NHS 24 (111 Mental Health Hub), Northern Ireland Lifeline (`0808 808 8000`) and HSC crisis teams.
- [x] UK Childline verified: `0800 1111` (phone 24/7; 1-to-1 web chat 7:30 AM – 3:30 AM daily; age up to 19); SHOUT verified: `Text SHOUT to 85258` (24/7 text support across UK networks).
- [x] US 988 Lifeline verified: US national Suicide & Crisis Lifeline funded by SAMHSA, providing crisis counselling by call, text and chat (may coordinate with 911 or other emergency services when an imminent safety emergency requires additional intervention; distinct from direct emergency dispatch 911).
- [x] US YouthLine verified: Nonprofit youth peer-support service operated by Lines for Life in Oregon, reach across all 50 US states; age eligibility up to age 24 (sources state "youth up to age 24" / "ages 10–24"); official URLs `https://www.theyouthline.org/` and `https://www.theyouthline.org/our-work/`; phone `1-877-968-8491`, text `teen2teen to 839863`, web chat; youth peer support daily 4-10pm Pacific; outside youth peer-support hours, adult staff from Lines for Life answer the YouthLine phone line (unverified text/chat outside 4-10pm PT disclaimed); strictly distinct from 988 Lifeline.
- [x] Canada 988 national service verified; Kids Help Phone verified as dedicated Canadian youth service (`1-800-668-6868` / text `CONNECT to 686868`).
- [x] Every single resource includes: country, age group, contact method, hours, official URL, verification date, and fallback instruction.
- [x] "Immediately scrubbed from memory" replaced with technically accurate ephemeral processing and browser runtime boundary definitions.
- [x] Blanket 12-month retention rule retracted and replaced with purpose-specific, governed retention standards.
- [x] Zero production code modified; zero models trained; all original datasets preserved.
