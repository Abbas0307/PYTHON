# MINDORA 2.0 — USABILITY TESTING PROTOCOL
## Structured Moderator Guide for Controlled Student Usability Sessions

**Document Version:** 1.0 (Phase 5.14 Research Preparation)  
**Target Audience:** Trained Human-Computer Interaction (HCI) Usability Moderators  
**Session Format:** In-Person, Supervised, Single-Participant Session  
**Estimated Duration:** 30–45 minutes  
**Ethics Clearance Status:** *AWAITING FORMAL INSTITUTIONAL ETHICS COMMITTEE APPROVAL*

---

### Protocol Overview & Moderator Philosophy
Mindora 2.0 is an offline-first educational student wellbeing platform. As a moderator:
1. **Test the software, not the participant:** Explicitly remind the student that there are no wrong answers; any confusion reflects an interface design opportunity.
2. **Think-Aloud Protocol:** Encourage the participant to verbalize their thoughts, expectations, and hesitations as they interact.
3. **Neutral Facilitation:** Do not prompt, correct, or lead the participant unless they are completely blocked for more than 60 seconds.
4. **Fictional Data Enforcement:** Remind participants that they are never required to enter real personal habits or clinical history. Provide the standardized fictional card.
5. **Support Readiness:** Ensure crisis contact pathways are immediately available if an emotional distress reaction occurs.

---

### Section A: Session Welcome & Introduction (3 minutes)

**Moderator Script:**
> *"Hello and welcome. Thank you very much for taking the time to participate today. My name is [Moderator Name], and I will be guiding our session.*
> 
> *Today, we are evaluating the design, navigation, and usability of an application called Mindora 2.0. We want to see how clear and intuitive the interface is for university students.*
> 
> *I want to emphasize three important points before we begin:*
> *First, we are evaluating the software, not you. You cannot make any mistakes today. If anything feels awkward, confusing, or hard to find, that is a valuable finding for us to fix.*
> *Second, Mindora is an educational routine-pacing platform, not a medical clinic or diagnostic tool. You will never be diagnosed with any condition.*
> *Third, you do not need to share your real personal habits or mental health information. Today, we will provide you with a fictional student profile card to use throughout the session.*
> 
> *Do you have any questions before we confirm your consent?"*

---

### Section B & C: Consent & Device Setup Verification (2 minutes)

1. **Verify Signed Consent:** Confirm that the participant has reviewed the Participant Information Sheet and signed the Informed Consent Document.
2. **Verify Optional Permissions:** Confirm whether the participant agreed to optional screen recording or audio recording. Enable recording tools only if explicitly marked "YES".
3. **Assign Participant Code:** Assign the next sequential anonymous code (e.g., `P-101`). Do **not** record student names on observation sheets.
4. **Device State Setup:**
   - Testing Device: Clean standard study laptop (1920x1080 display) or tablet.
   - Browser: Google Chrome / Mozilla Firefox in clean profile mode.
   - URL: `http://127.0.0.1:5173/` (Mindora 2.0 local build).
   - Local Cache: Clear `localStorage` and `IndexedDB` prior to session start.

---

### Standardized Fictional Student Profile Card
*(Hand this physical laminated index card to the participant for Tasks 3, 5, and 9)*

```
+-------------------------------------------------------------------------+
|                  FICTIONAL STUDENT SCENARIO CARD: "ALEX"                |
+-------------------------------------------------------------------------+
|  Academic Profile:                                                      |
|    - Age: 21                                                            |
|    - Degree Program: Engineering / Computer Science (B.Tech)            |
|    - Academic Pressure: 3 / 5 (Moderate semester workload)             |
|    - Work & Study Hours: 6.5 hours daily                                |
|    - Study Satisfaction: 3 / 5                                          |
|                                                                         |
|  Daily Habits:                                                          |
|    - Sleep Duration: 7–8 hours                                          |
|    - Dietary Pattern: Moderate / Mixed meals                            |
|    - Financial Stress: Level 3 / 5                                      |
|                                                                         |
|  PHQ-9 Screening Values (Fictional Non-Crisis Test Responses):           |
|    - Questions 1 to 9: All set to "0" (Not at all)                      |
|                                                                         |
|  Goal Intention: "Establish a consistent 25-minute study focus block"   |
+-------------------------------------------------------------------------+
```

---

### Section E: Usability Task Execution (25–30 minutes)

#### TASK 1 — First-Time Purpose & Landing Screen Comprehension
- **Participant Prompt:** *"Please open Mindora to the home screen. Take a moment to look at this page, and in your own words, explain what you think this application does."*
- **Success Criteria:** Participant identifies that Mindora is an educational student wellbeing and study-habit tool, and recognizes that it operates offline without remote tracking.
- **Moderator Observation Focus:** Does the participant notice the non-clinical disclaimer? Does the student understand the offline privacy banner?

#### TASK 2 — Privacy & Local Storage Understanding
- **Participant Prompt:** *"Before beginning, please locate the privacy information on this screen. Where is your data stored, and who has access to it?"*
- **Success Criteria:** Participant states that data is stored locally on the device (browser storage) and that no personal data is transmitted to external cloud servers.
- **Moderator Observation Focus:** Does the student easily identify the "Acknowledge Offline Privacy & Non-Clinical Scope" consent checkpoint?

#### TASK 3 — Deterministic Wellbeing Assessment
- **Participant Prompt:** *"Please start the assessment and enter the values from the fictional Alex scenario card provided. Complete the survey and proceed to the dashboard."*
- **Success Criteria:** Participant successfully navigates the multi-step survey (Demographics, Academic Pacing, PHQ-9), inputs the fictional values, and clicks "Submit Assessment".
- **Moderator Observation Focus:** Are any form inputs confusing? Is the transition between survey steps smooth? How long does completion take?

#### TASK 4 — Results Comprehension & Non-Diagnostic Framing
- **Participant Prompt:** *"Now that you are on the dashboard, please look at the 'Lifestyle Balance' indicator. What does this score tell you, and what does it NOT tell you?"*
- **Success Criteria:** Participant understands that the score is a composite reflection of sleep, study hours, and lifestyle friction, and explicitly notes that it is **not** a medical or depression diagnosis.
- **Moderator Observation Focus:** Does the participant read the subtitle ("Not a diagnostic tool")? Do they understand the composite percentage breakdown?

#### TASK 5 — Personal Wellbeing Goals
- **Participant Prompt:** *"Scroll to the 'Personal Wellbeing Goals' section. Please add a new goal to 'Improve study routine' or select one of the suggested goals."*
- **Success Criteria:** Participant successfully adds or edits a goal, observing it appear in their active goals list.
- **Moderator Observation Focus:** Does the participant understand the weekly target counter (e.g., 4 times per week)?

#### TASK 6 — Adaptive Recommendations & Transparency
- **Participant Prompt:** *"Look at the 'Adaptive Recommendations' section. Select any recommended activity and find out why the system suggested it to you."*
- **Success Criteria:** Participant clicks the "Why am I seeing this?" button/link and articulates the rule-based rationale (e.g., linked to active goal or survey sleep habits).
- **Moderator Observation Focus:** Does the participant understand the transparency modal? Do they recognize the deterministic connection?

#### TASK 7 — Interactive Wellness Studio
- **Participant Prompt:** *"Navigate to the 'Interactive Wellness Studio'. Choose either the Guided Breathing or 5-4-3-2-1 Sensory Grounding activity, start it, try it for 30 seconds, and pause or complete it."*
- **Success Criteria:** Participant launches the interactive module, engages with the visual cues/prompts, and successfully returns to the dashboard.
- **Moderator Observation Focus:** Does the visual timer/animation provide intuitive pacing? Does the participant find pause and exit controls easily?

#### TASK 8 — Smart Action Planner
- **Participant Prompt:** *"Find the 'Smart Action Planner' section. Mark one of your recommended daily actions as completed."*
- **Success Criteria:** Participant toggles completion checkbox on an action; item visual state updates to completed with progress counter advancement.
- **Moderator Observation Focus:** Does the student notice the daily target progress bar?

#### TASK 9 — Weekly Wellbeing Trends
- **Participant Prompt:** *"Scroll to the 'Weekly Wellbeing Trends' section. Explain what kind of information is tracked here, and open the Weekly Check-In form."*
- **Success Criteria:** Participant identifies the 5 independent ratings (Sleep, Study, Satisfaction, Energy, Routine) and opens the check-in modal.
- **Moderator Observation Focus:** Does the participant understand that this tracks multi-week patterns rather than clinical depression?

#### TASK 10 — My Activity Timeline
- **Participant Prompt:** *"Find the 'My Activity Timeline' section. Can you locate the activity you just completed in Task 8?"*
- **Success Criteria:** Participant identifies the completed action logged in chronological order with its category badge.
- **Moderator Observation Focus:** Does the participant notice the filter options (e.g., All, Planner, Wellness, Goals)?

#### TASK 11 — Support & Resource Navigator
- **Participant Prompt:** *"Suppose a fellow student was experiencing severe academic stress or distress. Where in this application would you find emergency services and student helplines?"*
- **Success Criteria:** Participant navigates to the Support & Resource Navigator screen (via header or dashboard card) and distinguishes immediate emergency dispatch (Category A) from 24/7 counseling hotlines (Category B).
- **Moderator Observation Focus:** How quickly does the participant locate the support screen? Do they identify Tele-MANAS (14416) or national emergency dispatch (112)?

#### TASK 12 — Privacy Center & Data Erasure Controls
- **Participant Prompt:** *"Locate the Privacy & My Data Control Center. How would you permanently delete all your data from this device? (Test the safeguard by cancelling)."*
- **Success Criteria:** Participant opens the deletion modal, explains the "Type DELETE to confirm" safety requirement, and clicks "Cancel" to verify data preservation.
- **Moderator Observation Focus:** Does the participant feel confident that they have total ownership over their data? Is the deletion confirmation clearly understood?

---

### Section F: Post-Task Debriefing Questions (5 minutes)

1. *"Overall, what was the easiest feature to understand and use today?"*
2. *"Was there any point where you felt confused, stuck, or unsure of what the system was doing?"*
3. *"How clearly did Mindora communicate that it is an educational tool rather than a doctor or mental health counselor?"*
4. *"How did you feel about the fact that all data stayed locally on your device without an account or cloud storage?"*

---

### Section G: Usability Questionnaire Administration (5 minutes)

1. Provide the participant with the **Phase 5.14 Usability Questionnaire** (System Usability Scale [SUS] and feedback form).
2. Allow the participant to complete the questionnaire independently in private without moderator interference.
3. Collect the completed questionnaire and verify that the anonymous participant code matches.

---

### Section H: Closing & Support Reassurance (2 minutes)

**Moderator Closing Script:**
> *"That completes our usability session for today. Thank you so much for your time, insight, and candid feedback. Your observations will directly help us make Mindora simpler, clearer, and more accessible for university students.*
> 
> *As a reminder, all data from today's test will remain strictly anonymous and will be purged from this device now.*
> 
> *Here is a printed copy of the Participant Information Sheet containing verified student support resources, counseling services, and research team contact details should you have any questions later.*
> 
> *Thank you again, and have a wonderful day."*

---

### Post-Session Technical Clean-Up Protocol
*(Executed immediately by the moderator after the participant departs)*
1. Open Mindora 2.0 `Privacy & My Data Control Center`.
2. Click "Clear All Eligible Data", type `DELETE`, and execute complete purge.
3. Open browser Developer Tools -> Application -> Clear Storage -> "Clear site data".
4. Close and relaunch the browser window to guarantee zero residual data for the next participant.
