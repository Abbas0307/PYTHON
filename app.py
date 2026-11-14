"""
app.py
Mindora – Student Wellbeing Intelligence Platform
High-Polish SaaS Interface featuring the Tri-Engine Architecture:
  - ENGINE 1: Public Dataset ML Model (Calibrated XGBoost across 10 clean features)
  - ENGINE 2: Digital & Social Lifestyle Insights & Wellness Guidance
  - ENGINE 3: Validated Standardized PHQ-9 Psychometric Instrument & Crisis Safeguards

Modular architecture delegating to decoupled view controllers in src/views/.
"""

import streamlit as st

from src.ui_theme import (
    CUSTOM_CSS,
    render_footer,
    PRIMARY_VIOLET,
    SECONDARY_VIOLET,
    LAVENDER,
    LIGHT_SURFACE
)
from src.session_utils import validate_and_sanitize_session_state
from src.views import (
    render_student_dashboard,
    render_assessment,
    render_insights,
    render_wellness_planner,
    render_progress_view,
    render_methodology,
    render_training_lab
)

# Page configuration
st.set_page_config(
    page_title="Mindora – Student Wellbeing Intelligence Platform",
    page_icon="💜",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Inject Custom SaaS CSS styling with local offline font fallbacks
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# Initialize Session State
if "current_page" not in st.session_state:
    st.session_state.current_page = "🏠 Home / Dashboard"
if "assessment_submitted" not in st.session_state:
    st.session_state.assessment_submitted = False
if "latest_results" not in st.session_state:
    st.session_state.latest_results = None
if "completed_habits" not in st.session_state:
    st.session_state.completed_habits = set()
if "session_progress" not in st.session_state:
    st.session_state.session_progress = []
if "daily_energy_checkin" not in st.session_state:
    st.session_state.daily_energy_checkin = "😐 Steady"

# Normalization mapping for backward compatibility with previous button clicks
PAGE_NORMALIZATION = {
    "🏠 Home": "🏠 Home / Dashboard",
    "📝 Student Assessment": "📝 My Assessment",
    "📊 Results & Wellness Insights": "📊 My Insights",
    "📈 Analytics & Model Benchmark": "ℹ️ Methodology & About"
}
if st.session_state.current_page in PAGE_NORMALIZATION:
    st.session_state.current_page = PAGE_NORMALIZATION[st.session_state.current_page]

# Defensively sanitize and recover session state against corrupted types
validate_and_sanitize_session_state()

# Sidebar Navigation & Branding
with st.sidebar:
    st.markdown(
        f"""
        <div style="text-align: center; padding: 14px 0 20px 0;">
            <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 20px; background: linear-gradient(135deg, {PRIMARY_VIOLET}, {SECONDARY_VIOLET}); color: white; font-size: 30px; box-shadow: 0 10px 24px rgba(109,67,198,0.28);">
                💜
            </div>
            <h2 style="margin: 10px 0 2px 0; font-size: 1.5rem; font-weight: 800; color: {PRIMARY_VIOLET}; letter-spacing: -0.03em;">Mindora</h2>
            <p style="margin: 0; font-size: 0.8rem; color: #64748B; font-weight: 600;">Student Wellbeing Intelligence</p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    pages = [
        "🏠 Home / Dashboard",
        "📝 My Assessment",
        "📊 My Insights",
        "🎯 Wellness Planner",
        "📈 My Progress",
        "ℹ️ Methodology & About",
        "🔬 ML Training Lab"
    ]
    
    selected_page = st.radio(
        "Navigation",
        pages,
        index=pages.index(st.session_state.current_page) if st.session_state.current_page in pages else 0,
        label_visibility="collapsed"
    )
    st.session_state.current_page = selected_page
    
    st.markdown("---")
    
    # 24/7 Crisis Assistance Quick Widget in Sidebar
    st.markdown(
        f"""
        <div style="background: {LAVENDER}; border-radius: 16px; padding: 16px; border: 1px solid rgba(139, 92, 246, 0.22); box-shadow: 0 4px 14px rgba(109, 67, 198, 0.05);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 1.15rem;">🆘</span>
                <strong style="color: {PRIMARY_VIOLET}; font-size: 0.88rem;">Need Immediate Support?</strong>
            </div>
            <p style="font-size: 0.78rem; color: #475569; margin-bottom: 8px; line-height: 1.45;">
                Free, confidential mental health helplines are available 24/7.
            </p>
            <div style="font-size: 0.80rem; font-weight: 700; color: {PRIMARY_VIOLET}; line-height: 1.55;">
                🇮🇳 <strong>India (National):</strong><br>
                • Tele-MANAS: <strong>14416</strong><br>
                • Toll-Free: <strong>1800-89-14416</strong><br>
                • KIRAN: <strong>1800-599-0019</strong><br>
                🌐 <strong>International:</strong><br>
                • USA / Canada: 988<br>
                • United Kingdom: 111<br>
                • Australia: 13 11 14
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    st.markdown(
        """
        <div style="margin-top: 26px; font-size: 0.76rem; color: #94A3B8; text-align: center; line-height: 1.5;">
            Mindora v3.1 • Tri-Engine Platform<br>
            Student Wellbeing Intelligence<br>
            Educational Screening • Not for Clinical Diagnosis
        </div>
        """,
        unsafe_allow_html=True
    )

# Page View Dispatcher
current = st.session_state.current_page

if current == "🏠 Home / Dashboard":
    render_student_dashboard()
elif current == "📝 My Assessment":
    render_assessment()
elif current == "📊 My Insights":
    render_insights()
elif current == "🎯 Wellness Planner":
    render_wellness_planner()
elif current == "📈 My Progress":
    render_progress_view()
elif current == "ℹ️ Methodology & About":
    render_methodology()
elif current == "🔬 ML Training Lab":
    render_training_lab()

# Global Footer
st.markdown(render_footer(), unsafe_allow_html=True)
