"""
src/views/onboarding.py
Mindora – Student Onboarding, Privacy Disclosure, and Platform Scope Guide.
Covers the 7 core pillars of the Mindora student experience:
  1. What Mindora is
  2. What Mindora can and cannot do
  3. What information the student may provide
  4. How the three intelligence engines differ
  5. How recommendations are generated
  6. How session-only information is handled
  7. How to access supportive resources
"""

import streamlit as st
from src.ui_theme import PRIMARY_VIOLET, SECONDARY_VIOLET, LAVENDER, LIGHT_SURFACE, MAIN_TEXT

def render_onboarding_guide() -> str:
    """Render the full onboarding, methodology, and privacy transparency guide."""
    cards_html = f"""
    <div style="background: linear-gradient(135deg, {PRIMARY_VIOLET} 0%, {SECONDARY_VIOLET} 100%); border-radius: 20px; padding: 26px 24px; color: white; margin-bottom: 22px; box-shadow: 0 10px 28px rgba(109, 67, 198, 0.2);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="font-size: 1.4rem;">💜</span>
            <span style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 12px;">
                Student Onboarding & Journey Guide
            </span>
        </div>
        <h2 style="color: white; margin: 0 0 8px 0; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.02em;">
            Welcome to Mindora • Student Wellbeing Intelligence
        </h2>
        <p style="font-size: 0.94rem; line-height: 1.6; color: rgba(255, 255, 255, 0.92); margin: 0; max-width: 820px;">
            Mindora is a privacy-first, non-clinical wellbeing reflection platform designed for university and college students. 
            Follow our four-step journey — <strong>UNDERSTAND → DISCOVER → ACT → IMPROVE</strong> — to build sustainable daily routines and explore science-backed self-care habits.
        </p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 18px;">
        <div style="background: #FFFFFF; border-radius: 16px; padding: 20px; border: 1px solid rgba(139, 92, 246, 0.16); box-shadow: 0 6px 18px rgba(109, 67, 198, 0.04);">
            <h4 style="color: {PRIMARY_VIOLET}; margin-top: 0; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>🧠</span> 1. What Mindora Is & Does
            </h4>
            <p style="font-size: 0.85rem; color: #475569; line-height: 1.55; margin-bottom: 10px;">
                Mindora is an educational self-reflection hub that combines three independent intelligence engines to help you explore your academic workload, digital lifestyle rhythms, and emotional baseline:
            </p>
            <ul style="font-size: 0.83rem; color: #475569; line-height: 1.55; padding-left: 20px; margin: 0;">
                <li><strong>Engine 1 (Survey Pattern ML):</strong> Calibrated XGBoost model (10 non-leaking academic & sleep features) estimating statistical association with historical student research surveys.</li>
                <li><strong>Engine 2 (Lifestyle Analytics):</strong> Descriptive friction and rhythm scoring evaluating screen hours, pre-sleep device habits, and rest-study boundaries.</li>
                <li><strong>Engine 3 (PHQ-9 Screener):</strong> Validated 9-question clinical screener (0–27 score) with unconditional crisis hotline escalation.</li>
            </ul>
        </div>

        <div style="background: #FFFFFF; border-radius: 16px; padding: 20px; border: 1px solid rgba(139, 92, 246, 0.16); box-shadow: 0 6px 18px rgba(109, 67, 198, 0.04);">
            <h4 style="color: #EF4444; margin-top: 0; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>⚠️</span> 2. What Mindora Is NOT
            </h4>
            <p style="font-size: 0.85rem; color: #475569; line-height: 1.55; margin-bottom: 10px;">
                To protect student safety, we maintain strict non-clinical boundaries:
            </p>
            <ul style="font-size: 0.83rem; color: #475569; line-height: 1.55; padding-left: 20px; margin: 0;">
                <li><strong>NOT a Medical Diagnosis:</strong> Mindora outputs are statistical screening indicators and do not replace a qualified psychologist, psychiatrist, or physician.</li>
                <li><strong>NOT an Overall Depression Score:</strong> We never compute a single "depression percentage". The three engines operate independently.</li>
                <li><strong>NOT a Clinical Treatment Plan:</strong> Our recommendations are educational lifestyle micro-habits, not medical prescriptions.</li>
                <li><strong>NOT a Surveillance Tool:</strong> Mindora has no background trackers, keyloggers, location permissions, or social media scrapers.</li>
            </ul>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 18px;">
        <div style="background: #FFFFFF; border-radius: 16px; padding: 20px; border: 1px solid rgba(139, 92, 246, 0.16); box-shadow: 0 6px 18px rgba(109, 67, 198, 0.04);">
            <h4 style="color: {PRIMARY_VIOLET}; margin-top: 0; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>📝</span> 3. What Information You May Provide
            </h4>
            <p style="font-size: 0.85rem; color: #475569; line-height: 1.55; margin-bottom: 10px;">
                You are never required to provide sensitive data just to explore Mindora. When you choose to complete an assessment, you may share:
            </p>
            <ul style="font-size: 0.83rem; color: #475569; line-height: 1.55; padding-left: 20px; margin: 0;">
                <li><strong>Academic Workload:</strong> Study hours, academic pressure, study satisfaction, and CGPA range.</li>
                <li><strong>Sleep & Digital Habits:</strong> Sleep duration, bedtime screen use, daily phone/social hours, and physical exercise.</li>
                <li><strong>PHQ-9 Screener:</strong> Responses to the standardized 9 depressive symptom frequency questions.</li>
                <li><strong>Optional Reflection Notes:</strong> Free-text study thoughts (speech-to-text operates locally in your browser).</li>
            </ul>
        </div>

        <div style="background: #FFFFFF; border-radius: 16px; padding: 20px; border: 1px solid rgba(139, 92, 246, 0.16); box-shadow: 0 6px 18px rgba(109, 67, 198, 0.04);">
            <h4 style="color: {PRIMARY_VIOLET}; margin-top: 0; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>💡</span> 4. How Recommendations Are Generated
            </h4>
            <p style="font-size: 0.85rem; color: #475569; line-height: 1.55; margin-bottom: 10px;">
                Mindora uses a transparent, deterministic rule-based intelligence framework across 8 recognized wellbeing domains:
            </p>
            <ul style="font-size: 0.83rem; color: #475569; line-height: 1.55; padding-left: 20px; margin: 0;">
                <li><strong>Attributed to Actual Responses:</strong> Recommendations only cite factors you actually supplied. Unsubmitted fields are never fabricated.</li>
                <li><strong>Non-Causal Language:</strong> Suggestions use supportive wording (e.g. <em>"your reported study hours suggest a short break may help"</em>), never diagnostic assertions.</li>
                <li><strong>Prioritized & Deduplicated:</strong> Emergency safety guidance (Rank 1) cannot be suppressed. Lifestyle habits occupy Ranks 3 to 5.</li>
            </ul>
        </div>
    </div>

    <div style="background: {LAVENDER}; border-radius: 16px; padding: 20px 24px; border: 1px solid rgba(139, 92, 246, 0.22); margin-bottom: 20px;">
        <h4 style="color: {PRIMARY_VIOLET}; margin-top: 0; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
            <span>🔒</span> 5. Privacy, Data Minimization & Session Lifecycle
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; font-size: 0.83rem; color: #334155; line-height: 1.55;">
            <div>
                <strong>• In-Memory Server Processing</strong><br>
                Student assessment inputs, PHQ-9 answers, and habit milestones reside strictly in volatile server process memory (`st.session_state`). The core codebase contains no database or persistent disk writes.
            </div>
            <div>
                <strong>• Zero Account Credentials</strong><br>
                No account registration, email, student ID, or password is ever required. You remain anonymous.
            </div>
            <div>
                <strong>• Session Lifecycle & Disconnection</strong><br>
                Closing a browser tab disconnects the WebSocket session, which expires per server timeout. Server restarts clear in-memory state.
            </div>
            <div>
                <strong>• Explicit User Reset</strong><br>
                Clicking 'Clear Session Data' immediately purges all user-specific answers, results, and habit records from active server memory.
            </div>
        </div>
    </div>

    <div style="background: #FFF1F2; border: 1px solid #FECDD3; border-radius: 16px; padding: 18px 22px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="font-size: 1.3rem;">🆘</span>
            <strong style="color: #9F1239; font-size: 0.95rem;">
                6. How to Access Immediate Support & Crisis Helplines
            </strong>
        </div>
        <p style="font-size: 0.84rem; color: #881337; line-height: 1.5; margin: 0 0 10px 0;">
            If you are experiencing overwhelming distress or thoughts of self-harm, compassionate and confidential support is accessible 24/7 across multiple countries:
        </p>
        <div style="font-size: 0.82rem; color: #881337; line-height: 1.6;">
            • <strong>India:</strong> Emergency <strong>112</strong> | Tele-MANAS <strong>14416</strong> / <strong>1800-89-14416</strong> (24/7 Toll-Free) | KIRAN <strong>1800-599-0019</strong><br>
            • <strong>United States & Canada:</strong> Emergency <strong>911</strong> | 988 Suicide & Crisis Lifeline: Call or Text <strong>988</strong><br>
            • <strong>United Kingdom:</strong> Emergency <strong>999</strong> (or 112) | England (NHS 111 mental-health option) | Scotland (NHS 24 on 111) | Wales (NHS 111 Wales Opt 2) | Northern Ireland (Lifeline NI 0808 808 8000) | Pan-UK: Samaritans <strong>116 123</strong><br>
            • <strong>Australia:</strong> Emergency <strong>000</strong> | Lifeline <strong>13 11 14</strong><br>
            <em>Note: 999, 911, and 112 are emergency dispatch numbers for immediate danger to life. 988, NHS 111, and Lifeline NI are dedicated mental health support or advice services.</em>
        </div>
    </div>
    """
    st.markdown(cards_html, unsafe_allow_html=True)
    return cards_html

