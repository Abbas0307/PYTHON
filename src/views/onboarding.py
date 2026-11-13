"""
src/views/onboarding.py
Mindora – Student Onboarding, Privacy Disclosure, and Platform Scope Guide.
Explains platform boundaries, the tri-engine architecture, privacy guarantees,
and non-clinical nature of all guidance.
"""

import streamlit as st
from src.ui_theme import PRIMARY_VIOLET, SECONDARY_VIOLET, LAVENDER, LIGHT_SURFACE, MAIN_TEXT

def render_onboarding_guide():
    """Render the full onboarding and privacy transparency guide."""
    st.markdown(
        f"""
        <div style="background: linear-gradient(135deg, {PRIMARY_VIOLET} 0%, {SECONDARY_VIOLET} 100%); border-radius: 20px; padding: 28px 24px; color: white; margin-bottom: 24px; box-shadow: 0 10px 28px rgba(109, 67, 198, 0.2);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <span style="font-size: 1.5rem;">💜</span>
                <span style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 12px;">
                    Welcome to Mindora
                </span>
            </div>
            <h2 style="color: white; margin: 0 0 10px 0; font-size: 1.85rem; font-weight: 800; letter-spacing: -0.02em;">
                Student Wellbeing Intelligence & Privacy Transparency
            </h2>
            <p style="font-size: 0.96rem; line-height: 1.6; color: rgba(255, 255, 255, 0.9); margin: 0; max-width: 780px;">
                Mindora is a privacy-first, non-clinical wellbeing platform created to help university and college students 
                understand lifestyle patterns, discover emerging pressures, build daily resilience habits, and track personal progress.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )

    col1, col2 = st.columns(2)

    with col1:
        st.markdown(
            f"""
            <div style="background: #FFFFFF; border-radius: 16px; padding: 20px; border: 1px solid rgba(139, 92, 246, 0.16); box-shadow: 0 6px 18px rgba(109, 67, 198, 0.04); margin-bottom: 20px; height: 100%;">
                <h4 style="color: {PRIMARY_VIOLET}; margin-top: 0; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <span>🧠</span> 1. What Mindora Does
                </h4>
                <ul style="font-size: 0.87rem; color: #475569; line-height: 1.6; padding-left: 20px; margin: 0;">
                    <li><strong>Engine 1 (Public ML Screening):</strong> Calibrated machine learning model trained on 27,901 student records across 10 academic and study factors to estimate statistical pattern association with historical student surveys.</li>
                    <li><strong>Engine 2 (Digital Lifestyle Analytics):</strong> Evaluates daily screen time, social comparison, sleep duration, and rest-study balance into actionable rhythm scores.</li>
                    <li><strong>Engine 3 (PHQ-9 Screener):</strong> Standardized 9-question psychometric instrument (0–27 score) with unconditional crisis hotline safety triggers.</li>
                    <li><strong>Wellness Planner:</strong> Generates tailored, non-clinical daily habits and self-care routines for focus, sleep, and connection.</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True
        )

    with col2:
        st.markdown(
            f"""
            <div style="background: #FFFFFF; border-radius: 16px; padding: 20px; border: 1px solid rgba(139, 92, 246, 0.16); box-shadow: 0 6px 18px rgba(109, 67, 198, 0.04); margin-bottom: 20px; height: 100%;">
                <h4 style="color: #EF4444; margin-top: 0; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <span>⚠️</span> 2. What Mindora Is NOT
                </h4>
                <ul style="font-size: 0.87rem; color: #475569; line-height: 1.6; padding-left: 20px; margin: 0;">
                    <li><strong>NOT a Depression Calculator:</strong> We never compute a simplistic or invented single "depression percentage". The three engines operate independently.</li>
                    <li><strong>NOT a Medical Diagnosis:</strong> Mindora outputs are statistical screening indicators and do not replace a qualified psychologist or physician.</li>
                    <li><strong>NOT a Surveillance Tool:</strong> We do not track keystrokes, browsing history, social media posts, private chats, or device location.</li>
                    <li><strong>NOT Clinical Treatment:</strong> Educational recommendations are non-clinical lifestyle micro-habits, not medical prescriptions.</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True
        )

    st.markdown(
        f"""
        <div style="background: {LAVENDER}; border-radius: 16px; padding: 20px 24px; border: 1px solid rgba(139, 92, 246, 0.22); margin-top: 10px; margin-bottom: 24px;">
            <h4 style="color: {PRIMARY_VIOLET}; margin-top: 0; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>🔒</span> 3. Privacy, Data Minimization & Zero Retention
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; font-size: 0.84rem; color: #334155; line-height: 1.55;">
                <div>
                    <strong>• Server Session In-Memory Processing</strong><br>
                    Your assessment responses, scores, and habit selections exist temporarily in the Streamlit application server process memory for your active session only. Nothing is written to permanent storage, databases, or client cookies.
                </div>
                <div>
                    <strong>• Zero Account Credentials</strong><br>
                    Mindora requires no sign-up, email, student ID, username, or passwords. You remain completely anonymous.
                </div>
                <div>
                    <strong>• Zero Cloud Synchronization</strong><br>
                    No personal responses are uploaded to external databases, analytics trackers, or third-party servers.
                </div>
                <div>
                    <strong>• Supportive Crisis Guidance</strong><br>
                    If suicidal ideation or self-harm thoughts are indicated on PHQ-9 Item 9, 24/7 national mental health helplines (Tele-MANAS 14416 / 1800-89-14416, KIRAN 1800-599-0019, or international lifelines) are surfaced immediately.
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )
