"""
src/views/student_dashboard.py
Mindora – Student Wellbeing Dashboard (Home).
The central entry point for the student experience:
UNDERSTAND -> DISCOVER -> ACT -> IMPROVE.
"""

import streamlit as st
from src.ui_theme import (
    PRIMARY_VIOLET,
    SECONDARY_VIOLET,
    LAVENDER,
    LIGHT_SURFACE,
    MAIN_TEXT,
    render_hero_header,
    render_journey_banner,
    render_privacy_card,
    render_safety_disclaimer_card,
    render_footer
)
from src.views.onboarding import render_onboarding_guide

def render_student_dashboard():
    """Render the main student wellbeing dashboard."""
    # 1. Hero Header
    st.markdown(render_hero_header(), unsafe_allow_html=True)
    
    # 2. Safety Disclaimer
    st.markdown(render_safety_disclaimer_card(), unsafe_allow_html=True)
    
    # 3. The 4-Step Wellbeing Journey (UNDERSTAND -> DISCOVER -> ACT -> IMPROVE)
    st.markdown(render_journey_banner(), unsafe_allow_html=True)
    
    # 4. Current Session Status & Quick Entry Points
    has_results = st.session_state.get("assessment_submitted", False) and st.session_state.get("latest_results") is not None
    
    st.markdown("### 📍 Your Wellbeing Hub")
    
    col_status, col_actions = st.columns([1, 1])
    
    with col_status:
        if not has_results:
            st.markdown(
                f"""
                <div style="background: #FFFFFF; border-radius: 16px; padding: 22px; border: 1px solid rgba(139, 92, 246, 0.16); box-shadow: 0 6px 20px rgba(109, 67, 198, 0.04); height: 100%;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="font-size: 1.25rem;">📝</span>
                        <strong style="color: {PRIMARY_VIOLET}; font-size: 1.05rem;">Assessment Status: Pending</strong>
                    </div>
                    <p style="font-size: 0.88rem; color: #64748B; line-height: 1.5; margin-bottom: 16px;">
                        You have not completed an assessment in this session yet. Complete our 3-minute questionnaire to uncover 
                        calibrated ML indicators, digital lifestyle rhythms, and psychometric screening insights.
                    </p>
                    <div style="background: {LIGHT_SURFACE}; border-radius: 10px; padding: 12px; font-size: 0.8rem; color: #475569; margin-bottom: 16px;">
                        ⏱️ Estimated time: 3–4 minutes<br>
                        🔒 Fully confidential • No persistent storage
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )
            if st.button("🚀 Start My Assessment Now", key="dash_start_assessment_btn", use_container_width=True, type="primary"):
                st.session_state.current_page = "📝 Student Assessment"
                st.rerun()
        else:
            res = st.session_state.latest_results
            ml_res = res.get("ml_prediction", {})
            phq_res = res.get("phq9", {})
            life_res = res.get("lifestyle", {})
            
            st.markdown(
                f"""
                <div style="background: #FFFFFF; border-radius: 16px; padding: 22px; border: 1px solid rgba(139, 92, 246, 0.2); box-shadow: 0 6px 20px rgba(109, 67, 198, 0.06); height: 100%;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <strong style="color: {PRIMARY_VIOLET}; font-size: 1.05rem;">Latest Session Assessment</strong>
                        <span style="background: #ECFDF5; color: #10B981; font-size: 0.76rem; font-weight: 700; padding: 3px 10px; border-radius: 12px;">
                            ✓ Completed
                        </span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                        <div style="background: {LIGHT_SURFACE}; padding: 10px 12px; border-radius: 10px;">
                            <span style="font-size: 0.74rem; color: #64748B; display: block;">ML Screening Risk</span>
                            <strong style="font-size: 1.05rem; color: {ml_res.get('badge_color', PRIMARY_VIOLET)};">
                                {ml_res.get('percentage', 0.0)}%
                            </strong>
                            <span style="font-size: 0.72rem; color: #64748B; display: block;">{ml_res.get('risk_tier', 'Analyzed')}</span>
                        </div>
                        <div style="background: {LIGHT_SURFACE}; padding: 10px 12px; border-radius: 10px;">
                            <span style="font-size: 0.74rem; color: #64748B; display: block;">PHQ-9 Screener</span>
                            <strong style="font-size: 1.05rem; color: {phq_res.get('badge_color', PRIMARY_VIOLET)};">
                                {phq_res.get('score', 0)} / 27
                            </strong>
                            <span style="font-size: 0.72rem; color: #64748B; display: block;">{phq_res.get('severity', 'Analyzed')}</span>
                        </div>
                    </div>
                    <div style="background: {LIGHT_SURFACE}; padding: 10px 12px; border-radius: 10px; margin-bottom: 16px;">
                        <span style="font-size: 0.74rem; color: #64748B; display: block;">Lifestyle Rhythm Balance</span>
                        <strong style="font-size: 0.95rem; color: {PRIMARY_VIOLET};">
                            {life_res.get('rhythm_score', 0)} / 10 • Friction: {life_res.get('digital_friction', 0)} / 10
                        </strong>
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )
            col_b1, col_b2 = st.columns(2)
            with col_b1:
                if st.button("📊 View Full Insights", key="dash_view_insights_btn", use_container_width=True, type="primary"):
                    st.session_state.current_page = "📊 Results & Wellness Insights"
                    st.rerun()
            with col_b2:
                if st.button("🎯 Open Wellness Planner", key="dash_open_planner_btn", use_container_width=True):
                    st.session_state.current_page = "🎯 Wellness Planner"
                    st.rerun()

    with col_actions:
        st.markdown(
            f"""
            <div style="background: #FFFFFF; border-radius: 16px; padding: 22px; border: 1px solid rgba(139, 92, 246, 0.16); box-shadow: 0 6px 20px rgba(109, 67, 198, 0.04); height: 100%;">
                <strong style="color: {PRIMARY_VIOLET}; font-size: 1.05rem; display: block; margin-bottom: 10px;">
                    Explore Mindora Sections
                </strong>
                <p style="font-size: 0.84rem; color: #64748B; line-height: 1.5; margin-bottom: 16px;">
                    Navigate directly to any section to explore habits, view insights, or review methodology:
                </p>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="font-size: 0.83rem; color: #475569; padding: 6px 0; border-bottom: 1px solid #F1F5F9;">
                        <strong>📝 My Assessment:</strong> 10-feature academic ML, lifestyle survey, and PHQ-9.
                    </div>
                    <div style="font-size: 0.83rem; color: #475569; padding: 6px 0; border-bottom: 1px solid #F1F5F9;">
                        <strong>📊 My Insights:</strong> Explainable SHAP feature waterfall & independent engine breakdown.
                    </div>
                    <div style="font-size: 0.83rem; color: #475569; padding: 6px 0; border-bottom: 1px solid #F1F5F9;">
                        <strong>🎯 Wellness Planner:</strong> Actionable daily micro-habits for sleep, focus, and study.
                    </div>
                    <div style="font-size: 0.83rem; color: #475569; padding: 6px 0;">
                        <strong>📈 My Progress:</strong> Check off daily wellbeing commitments during your session.
                    </div>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

    st.markdown("<br>", unsafe_allow_html=True)
    
    # 5. Expandable Onboarding Guide & Scope
    with st.expander("📖 New to Mindora? Explore the Complete Platform & Privacy Guide", expanded=False):
        render_onboarding_guide()
        
    # 6. Privacy & Consent Statement Card
    st.markdown(render_privacy_card(), unsafe_allow_html=True)
    
    # 7. Crisis Quick-Access Banner
    st.markdown(
        f"""
        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 14px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.3rem;">🆘</span>
                <div>
                    <strong style="color: #991B1B; font-size: 0.92rem; display: block;">Feeling overwhelmed or in distress?</strong>
                    <span style="font-size: 0.82rem; color: #7F1D1D;">Free, confidential professional help is available right now.</span>
                </div>
            </div>
            <div style="font-size: 0.84rem; font-weight: 700; color: #991B1B;">
                📞 USA/CA: 988 • India: 14416 (Tele-MANAS) • UK: 111 • AUS: 13 11 14
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )
