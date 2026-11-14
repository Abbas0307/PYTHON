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
if "recommendation_feedback" not in st.session_state:
    st.session_state.recommendation_feedback = {}
if "dismissed_recommendations" not in st.session_state:
    st.session_state.dismissed_recommendations = set()
if "selected_country" not in st.session_state:
    st.session_state.selected_country = "India"

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
    
    # 24/7 Crisis Assistance Quick Widget in Sidebar (Country-Specific)
    from src.recommendations import NATIONAL_CRISIS_DIRECTORY
    country_options = ["India", "United States", "Canada", "United Kingdom", "Australia", "Other / International"]
    cur_country = st.session_state.get("selected_country", "India")
    if cur_country not in country_options:
        cur_country = "India"

    sel_country = st.selectbox(
        "🌐 Your Country / Region:",
        country_options,
        index=country_options.index(cur_country),
        key="sidebar_country_selector"
    )
    st.session_state["selected_country"] = sel_country
    c_info = NATIONAL_CRISIS_DIRECTORY.get(sel_country, NATIONAL_CRISIS_DIRECTORY["India"])
    
    sec_line = f"• {c_info['secondary_mental_health_service']}: <strong>{c_info['secondary_mental_health_number']}</strong><br>" if c_info.get('secondary_mental_health_service') else ""

    st.markdown(
        f"""
        <div style="background: {LAVENDER}; border-radius: 16px; padding: 14px 16px; border: 1px solid rgba(139, 92, 246, 0.22); box-shadow: 0 4px 14px rgba(109, 67, 198, 0.05);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 1.15rem;">🆘</span>
                <strong style="color: {PRIMARY_VIOLET}; font-size: 0.86rem;">Need Immediate Support? ({c_info['country']})</strong>
            </div>
            <div style="background: #FEE2E2; border: 1px solid #FECACA; padding: 5px 8px; border-radius: 6px; margin-bottom: 8px; font-size: 0.78rem; color: #991B1B; font-weight: 700;">
                🚨 Emergency Services: {c_info['emergency_services']}
            </div>
            <div style="font-size: 0.78rem; font-weight: 700; color: {PRIMARY_VIOLET}; line-height: 1.55;">
                💜 <strong>Mental Health Support:</strong><br>
                • {c_info['primary_mental_health_service']}: <strong>{c_info['primary_mental_health_number']}</strong><br>
                {sec_line}
            </div>
            <p style="font-size: 0.71rem; color: #64748B; margin: 8px 0 0 0; line-height: 1.35;">
                Note: 988 (US/CA) & NHS 111 (UK) are mental health or advice services, not general emergency dispatch. Helplines cannot be dialed across borders.
            </p>
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
