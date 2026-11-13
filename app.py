"""
app.py
Mindora – Student Mental Wellness & Risk Insights Platform
High-Polish SaaS Interface featuring the Tri-Engine Architecture:
  - ENGINE 1: Public Dataset ML Screening (Calibrated XGBoost across 10 clean features)
  - ENGINE 2: Digital & Social Lifestyle Insights & Wellness Guidance
  - ENGINE 3: Validated Standardized PHQ-9 Psychometric Instrument & Crisis Safeguards
"""

import os
import json
import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import streamlit.components.v1 as components

from src.data_loader import load_raw_data
from src.predict import predict_wellness_risk
from src.recommendations import (
    PHQ9_QUESTIONS,
    PHQ9_RESPONSE_OPTIONS,
    calculate_phq9,
    get_crisis_resources,
    analyze_lifestyle_patterns,
    generate_educational_recommendations
)
from src.ui_theme import (
    CUSTOM_CSS,
    render_hero_header,
    render_safety_disclaimer_card,
    render_footer,
    get_voice_speech_component_html,
    PRIMARY_VIOLET,
    SECONDARY_VIOLET,
    LAVENDER,
    LIGHT_SURFACE,
    MAIN_TEXT
)

# Page configuration
st.set_page_config(
    page_title="Mindora – Student Mental Wellness & Risk Insights",
    page_icon="💜",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Inject Custom SaaS CSS styling
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# Initialize Session State
if "current_page" not in st.session_state:
    st.session_state.current_page = "🏠 Home"
if "assessment_submitted" not in st.session_state:
    st.session_state.assessment_submitted = False
if "latest_results" not in st.session_state:
    st.session_state.latest_results = None

# Sidebar Navigation & Branding
with st.sidebar:
    st.markdown(
        f"""
        <div style="text-align: center; padding: 14px 0 20px 0;">
            <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 20px; background: linear-gradient(135deg, {PRIMARY_VIOLET}, {SECONDARY_VIOLET}); color: white; font-size: 30px; box-shadow: 0 10px 24px rgba(109,67,198,0.28);">
                💜
            </div>
            <h2 style="margin: 10px 0 2px 0; font-size: 1.5rem; font-weight: 800; color: {PRIMARY_VIOLET}; letter-spacing: -0.03em;">Mindora</h2>
            <p style="margin: 0; font-size: 0.8rem; color: #64748B; font-weight: 600;">Student Wellness & Risk AI</p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    pages = [
        "🏠 Home",
        "📝 Student Assessment",
        "📊 Results & Wellness Insights",
        "📈 Analytics & Model Benchmark",
        "ℹ️ Methodology & About"
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
                <strong style="color: {PRIMARY_VIOLET}; font-size: 0.88rem;">Need Immediate Help?</strong>
            </div>
            <p style="font-size: 0.78rem; color: #475569; margin-bottom: 8px; line-height: 1.45;">
                Confidential crisis hotlines are free, anonymous, and available 24/7.
            </p>
            <div style="font-size: 0.82rem; font-weight: 700; color: {PRIMARY_VIOLET}; line-height: 1.6;">
                📞 USA/CA: 988<br>
                📞 India: 14416 / KIRAN<br>
                📞 UK: 111 / 116 123<br>
                📞 Australia: 13 11 14
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    st.markdown(
        """
        <div style="margin-top: 26px; font-size: 0.76rem; color: #94A3B8; text-align: center; line-height: 1.5;">
            Mindora v2.5 • Tri-Engine SaaS<br>
            Educational Screening Platform<br>
            Not for Clinical Diagnosis
        </div>
        """,
        unsafe_allow_html=True
    )

# ==============================================================================
# PAGE 1: HOME
# ==============================================================================
if st.session_state.current_page == "🏠 Home":
    st.markdown(render_hero_header(), unsafe_allow_html=True)
    st.markdown(render_safety_disclaimer_card(), unsafe_allow_html=True)
    
    # 3-Engine Architecture Overview Section
    st.markdown(
        f"""
        <div style="margin-bottom: 22px;">
            <div class="mindora-badge">Rigorous Engineering</div>
            <h3 style="margin-top: 4px; margin-bottom: 8px; color: {PRIMARY_VIOLET}; font-size: 1.65rem;">
                The Tri-Engine Scientific Architecture
            </h3>
            <p style="font-size: 0.94rem; color: #64748B; margin: 0; max-width: 820px; line-height: 1.55;">
                Mindora prevents algorithmic conflation by maintaining strict boundaries between public machine learning, 
                digital lifestyle analytics, and standardized psychometrics—delivering clarity without invented aggregate percentages.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    col_eng1, col_eng2, col_eng3 = st.columns(3)
    with col_eng1:
        st.markdown(
            f"""
            <div class="mindora-card" style="border-top: 4px solid {PRIMARY_VIOLET};">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 1.7rem;">🤖</span>
                    <h4 style="color: {PRIMARY_VIOLET}; margin: 0; font-size: 1.1rem;">Engine 1: Public ML</h4>
                </div>
                <div style="font-size: 0.74rem; background: {LAVENDER}; color: {PRIMARY_VIOLET}; padding: 3px 9px; border-radius: 8px; font-weight: 700; display: inline-block; margin-bottom: 12px;">
                    Calibrated XGBoost (ROC-AUC 0.868)
                </div>
                <p style="font-size: 0.87rem; color: #64748B; line-height: 1.55; margin: 0;">
                    Trained strictly on 10 verified demographic, academic, dietary, and sleep duration features from 27,901 student records. 
                    Excludes clinical crisis tokens to eliminate target leakage.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )
    with col_eng2:
        st.markdown(
            f"""
            <div class="mindora-card" style="border-top: 4px solid {SECONDARY_VIOLET};">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 1.7rem;">📱</span>
                    <h4 style="color: {PRIMARY_VIOLET}; margin: 0; font-size: 1.1rem;">Engine 2: Lifestyle</h4>
                </div>
                <div style="font-size: 0.74rem; background: {LAVENDER}; color: {PRIMARY_VIOLET}; padding: 3px 9px; border-radius: 8px; font-weight: 700; display: inline-block; margin-bottom: 12px;">
                    Digital & Social Habits
                </div>
                <p style="font-size: 0.87rem; color: #64748B; line-height: 1.55; margin: 0;">
                    Analyses daily phone screen time, pre-sleep browsing, social comparison, exercise, daylight, and loneliness 
                    for descriptive wellness recommendations. Never conflated with ML predictions.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )
    with col_eng3:
        st.markdown(
            f"""
            <div class="mindora-card" style="border-top: 4px solid #10B981;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 1.7rem;">📋</span>
                    <h4 style="color: #10B981; margin: 0; font-size: 1.1rem;">Engine 3: PHQ-9</h4>
                </div>
                <div style="font-size: 0.74rem; background: #ECFDF5; color: #10B981; padding: 3px 9px; border-radius: 8px; font-weight: 700; display: inline-block; margin-bottom: 12px;">
                    Validated Clinical Standard
                </div>
                <p style="font-size: 0.87rem; color: #64748B; line-height: 1.55; margin: 0;">
                    Standardized 9-item Patient Health Questionnaire evaluated independently (0–27 score). 
                    Item 9 (self-harm thoughts) triggers an unconditional, deterministic crisis safety protocol.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )

    # How It Works Workflow
    st.markdown(
        f"""
        <div class="mindora-card" style="margin-top: 10px;">
            <div class="mindora-badge">Step-by-Step Experience</div>
            <h3 style="margin-top: 4px; margin-bottom: 20px; font-size: 1.45rem;">How Mindora Works</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 18px;">
                <div style="padding: 18px; background: {LIGHT_SURFACE}; border-radius: 14px; border-left: 4px solid {PRIMARY_VIOLET};">
                    <strong style="color: {PRIMARY_VIOLET}; display: block; font-size: 0.96rem; margin-bottom: 6px;">
                        1. Voluntary Questionnaire
                    </strong>
                    <span style="font-size: 0.85rem; color: #475569; line-height: 1.5;">
                        Complete screening sections covering digital device hours, sleep patterns, study satisfaction, and emotional health.
                    </span>
                </div>
                <div style="padding: 18px; background: {LIGHT_SURFACE}; border-radius: 14px; border-left: 4px solid {SECONDARY_VIOLET};">
                    <strong style="color: {SECONDARY_VIOLET}; display: block; font-size: 0.96rem; margin-bottom: 6px;">
                        2. Machine Learning Inference
                    </strong>
                    <span style="font-size: 0.85rem; color: #475569; line-height: 1.5;">
                        Trained gradient-boosted trees evaluate lifestyle indicators against 27,900+ verified student benchmark records.
                    </span>
                </div>
                <div style="padding: 18px; background: {LIGHT_SURFACE}; border-radius: 14px; border-left: 4px solid {PRIMARY_VIOLET};">
                    <strong style="color: {PRIMARY_VIOLET}; display: block; font-size: 0.96rem; margin-bottom: 6px;">
                        3. SHAP Explainability
                    </strong>
                    <span style="font-size: 0.85rem; color: #475569; line-height: 1.5;">
                        Inspect individualized factor contributions to understand which habits protect or elevate your risk profile.
                    </span>
                </div>
                <div style="padding: 18px; background: {LIGHT_SURFACE}; border-radius: 14px; border-left: 4px solid #10B981;">
                    <strong style="color: #10B981; display: block; font-size: 0.96rem; margin-bottom: 6px;">
                        4. Wellness Roadmap & Support
                    </strong>
                    <span style="font-size: 0.85rem; color: #475569; line-height: 1.5;">
                        Gain actionable circadian, digital, and academic recommendations, with immediate 24/7 crisis safety support.
                    </span>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

    # CTA Section
    st.markdown(
        f"""
        <div class="mindora-card" style="margin-top: 14px; background: linear-gradient(135deg, #FFFFFF 0%, {LIGHT_SURFACE} 100%);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                <div style="max-width: 680px;">
                    <h4 style="margin: 0 0 6px 0; color: {PRIMARY_VIOLET}; font-size: 1.25rem;">Ready to begin your wellness check-in?</h4>
                    <p style="color: #64748B; font-size: 0.92rem; margin: 0; line-height: 1.55;">
                        Takes ~3 minutes. Your responses are processed entirely in memory and are discarded upon browser closure. 
                        Zero student data is stored on disk or shared.
                    </p>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )
    if st.button("🚀 Start Student Assessment", use_container_width=True):
        st.session_state.current_page = "📝 Student Assessment"
        st.rerun()

    st.markdown(render_footer(), unsafe_allow_html=True)

# ==============================================================================
# PAGE 2: STUDENT ASSESSMENT
# ==============================================================================
elif st.session_state.current_page == "📝 Student Assessment":
    st.markdown(
        f"""
        <div style="margin-bottom: 20px;">
            <div class="mindora-badge">Self-Screening Assessment</div>
            <h2 style="font-size: 2.1rem; margin: 4px 0 8px 0; color: {PRIMARY_VIOLET};">
                Student Wellness & Habit Questionnaire
            </h2>
            <p style="color: #64748B; font-size: 0.95rem; margin: 0;">
                Please respond honestly based on your typical habits and feelings over the past 2 weeks.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    st.markdown(render_safety_disclaimer_card(), unsafe_allow_html=True)
    
    # Progress Step Indicator Bar
    st.markdown(
        f"""
        <div style="background: {LIGHT_SURFACE}; border: 1px solid rgba(139, 92, 246, 0.16); border-radius: 14px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <span style="font-size: 0.85rem; font-weight: 700; color: {PRIMARY_VIOLET};">
                📋 Questionnaire Progress
            </span>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span style="font-size: 0.75rem; background: #FFFFFF; color: {PRIMARY_VIOLET}; padding: 3px 10px; border-radius: 12px; font-weight: 600; border: 1px solid rgba(139,92,246,0.2);">A. Digital</span>
                <span style="font-size: 0.75rem; background: #FFFFFF; color: {PRIMARY_VIOLET}; padding: 3px 10px; border-radius: 12px; font-weight: 600; border: 1px solid rgba(139,92,246,0.2);">B. Sleep & Lifestyle</span>
                <span style="font-size: 0.75rem; background: #FFFFFF; color: {PRIMARY_VIOLET}; padding: 3px 10px; border-radius: 12px; font-weight: 600; border: 1px solid rgba(139,92,246,0.2);">C. Academic</span>
                <span style="font-size: 0.75rem; background: #FFFFFF; color: {PRIMARY_VIOLET}; padding: 3px 10px; border-radius: 12px; font-weight: 600; border: 1px solid rgba(139,92,246,0.2);">D. PHQ-9</span>
                <span style="font-size: 0.75rem; background: #FFFFFF; color: {PRIMARY_VIOLET}; padding: 3px 10px; border-radius: 12px; font-weight: 600; border: 1px solid rgba(139,92,246,0.2);">E. Social</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    # Optional Speech-to-Text Widget
    with st.expander("🎙️ Optional Voice Input (Speech-to-Text)"):
        components.html(get_voice_speech_component_html(), height=260)
        st.caption("Note: Use the 'Copy Transcript' button in the tool above to paste your spoken notes into the personal reflection field below.")
    
    # Structured Questionnaire Form
    with st.form("student_assessment_form"):
        tab_a, tab_b, tab_c, tab_d, tab_e = st.tabs([
            "A. Digital Behaviour (Engine 2)",
            "B. Sleep & Lifestyle (Engines 1 & 2)",
            "C. Academic Pressure (Engine 1)",
            "D. Emotional Wellbeing (Engine 3: PHQ-9)",
            "E. Social Environment (Engine 2)"
        ])
        
        # TAB A: Digital Behaviour (Engine 2)
        with tab_a:
            st.markdown("#### 📱 Digital Device & Social Media Habits (Engine 2: Lifestyle Analysis)")
            st.caption("These responses power your Digital Lifestyle Insights and personalized self-care recommendations. They are NOT fed to the ML depression model.")
            col_a1, col_a2 = st.columns(2)
            with col_a1:
                daily_phone_hours = st.slider(
                    "Total Daily Phone Screen Time (Hours)",
                    min_value=1.0, max_value=16.0, value=5.5, step=0.5
                )
                daily_social_hours = st.slider(
                    "Daily Social Media Usage (Hours)",
                    min_value=0.5, max_value=12.0, value=3.0, step=0.5
                )
                primary_platform = st.selectbox(
                    "Primary Social Media Platform",
                    ["Instagram", "YouTube", "TikTok", "Reddit", "Twitter / X", "LinkedIn", "Snapchat", "Other"]
                )
            with col_a2:
                phone_before_bed = st.radio(
                    "Do you browse your phone in bed within 45 minutes of sleep?",
                    ["Yes", "No"], horizontal=True
                )
                social_comparison = st.select_slider(
                    "How often do you compare yourself to others on social media?",
                    options=["Never", "Rarely", "Sometimes", "Often", "Always"],
                    value="Sometimes"
                )
                notification_checking = st.selectbox(
                    "How frequently do you check notifications?",
                    ["Constantly (every few minutes)", "Hourly", "A few times a day", "Only when alerts arrive"]
                )
                phone_concentration_issue = st.select_slider(
                    "Does phone use interrupt or derail your study concentration?",
                    options=["Never", "Rarely", "Frequently", "Almost Constantly"],
                    value="Frequently"
                )

        # TAB B: Sleep & Lifestyle (Shared between Engine 1 & 2)
        with tab_b:
            st.markdown("#### 🌙 Sleep Architecture & Daily Rhythms")
            col_b1, col_b2 = st.columns(2)
            with col_b1:
                sleep_duration = st.selectbox(
                    "Average Nightly Sleep Duration (Evaluated by Engine 1 & 2)",
                    ["Less than 5 hours", "5-6 hours", "7-8 hours", "More than 8 hours"],
                    index=1,
                    help="Matches clinical benchmark categories in public dataset."
                )
                sleep_quality = st.slider(
                    "Subjective Sleep Quality (Engine 2: 1 = Very Poor, 5 = Deeply Restorative)",
                    min_value=1, max_value=5, value=3
                )
                daily_fatigue = st.slider(
                    "Daily Daytime Fatigue (Engine 2: 1 = High Energy, 5 = Severe Exhaustion)",
                    min_value=1, max_value=5, value=3
                )
            with col_b2:
                dietary_habits = st.selectbox(
                    "General Dietary Habits (Evaluated by Engine 1)",
                    ["Healthy", "Moderate", "Unhealthy"],
                    index=1
                )
                exercise_freq = st.selectbox(
                    "Physical Exercise Frequency (Engine 2)",
                    ["Never", "Rarely (1-2x/month)", "Moderate (1-2x/week)", "Active (3+x/week)"],
                    index=2
                )
                outdoor_time = st.slider(
                    "Daylight Exposure / Time Outdoors (Engine 2: 1 = None, 5 = High)",
                    min_value=1, max_value=5, value=3
                )

        # TAB C: Academic Pressure (Engine 1: Public ML Model)
        with tab_c:
            st.markdown("#### 📚 Academic Workload & Performance Pressure (Engine 1: Public ML Features)")
            st.caption("These 10 verified demographic and academic variables correspond strictly to the public dataset feature schema.")
            col_c1, col_c2 = st.columns(2)
            with col_c1:
                academic_pressure = st.slider(
                    "Academic Pressure (1 = Minimal, 5 = Extreme Stress)",
                    min_value=1.0, max_value=5.0, value=3.0, step=1.0
                )
                study_satisfaction = st.slider(
                    "Study Satisfaction (1 = Extremely Dissatisfied, 5 = Highly Satisfied)",
                    min_value=1.0, max_value=5.0, value=3.0, step=1.0
                )
                work_study_hours = st.slider(
                    "Daily Work/Study Commitment (Hours)",
                    min_value=1.0, max_value=14.0, value=6.5, step=0.5
                )
                cgpa = st.number_input(
                    "Current CGPA or Equivalent (0.0 - 10.0 scale)",
                    min_value=0.0, max_value=10.0, value=7.8, step=0.1
                )
            with col_c2:
                financial_stress = st.slider(
                    "Financial Stress (1 = None, 5 = Severe Financial Strain)",
                    min_value=1.0, max_value=5.0, value=3.0, step=1.0
                )
                degree = st.selectbox(
                    "Current Degree Program",
                    [
                        "B.Tech", "Class 12", "BCA", "BSc", "B.Com", "BA", "B.Ed", "B.Arch",
                        "B.Pharm", "MBBS", "BBA", "LLB", "BE", "MSc", "MCA", "M.Tech",
                        "MBA", "MA", "PhD", "Others"
                    ],
                    index=0
                )
                age = st.number_input("Age", min_value=16, max_value=55, value=21, step=1)
                gender = st.selectbox("Gender", ["Female", "Male"], index=0)

        # TAB D: Emotional Wellbeing (Engine 3: Validated PHQ-9)
        with tab_d:
            st.markdown(
                f"""
                <div style="background: {LIGHT_SURFACE}; padding: 14px; border-radius: 12px; margin-bottom: 16px;">
                    <strong style="color: {PRIMARY_VIOLET};">Engine 3: Standardized Patient Health Questionnaire (PHQ-9)</strong>
                    <p style="font-size: 0.85rem; color: #475569; margin: 4px 0 0 0;">
                        Over the <strong>last 2 weeks</strong>, how often have you been bothered by any of the following problems?
                        <em>(This psychometric evaluation is completely independent of the machine learning model).</em>
                    </p>
                </div>
                """,
                unsafe_allow_html=True
            )
            
            phq9_answers = []
            for idx, question in enumerate(PHQ9_QUESTIONS):
                if idx == 8:
                    st.markdown("⚠️ **Safety Screening Question (Item 9):**")
                
                ans = st.selectbox(
                    f"{idx + 1}. {question}",
                    options=[0, 1, 2, 3],
                    format_func=lambda x: PHQ9_RESPONSE_OPTIONS[x],
                    key=f"phq9_q_{idx}"
                )
                phq9_answers.append(ans)

        # TAB E: Social Environment (Engine 2)
        with tab_e:
            st.markdown("#### 🤝 Social Connection & Support System (Engine 2: Lifestyle Analysis)")
            col_e1, col_e2 = st.columns(2)
            with col_e1:
                loneliness = st.select_slider(
                    "How often do you feel lonely or isolated?",
                    options=["Never", "Rarely", "Sometimes", "Often", "Always"],
                    value="Sometimes"
                )
                social_support = st.slider(
                    "Perceived Social Support from Friends/Family (1 = Low, 5 = High)",
                    min_value=1, max_value=5, value=3
                )
            with col_e2:
                friends_interaction = st.selectbox(
                    "How often do you meaningfully interact with friends?",
                    ["Daily", "Several times a week", "Once a week", "Rarely"]
                )
                feeling_connected = st.slider(
                    "Feeling Connected to Campus/Community (1 = Disconnected, 5 = Highly Connected)",
                    min_value=1, max_value=5, value=3
                )
                
            optional_notes = st.text_area(
                "Optional Personal Reflections or Notes (Confidential)",
                placeholder="Share any contextual thoughts, study challenges, or feelings here..."
            )

        st.markdown("---")
        
        # Informed Consent & Confirmation
        consent = st.checkbox(
            "I confirm that my participation is voluntary. I understand that Mindora provides experimental screening indicators "
            "and educational wellness guidance across three segregated engines, and does NOT provide a medical diagnosis or clinical treatment.",
            value=True
        )
        
        submit_btn = st.form_submit_button("🔍 Analyze Responses & View Wellness Insights", use_container_width=True)
        
        if submit_btn:
            if not consent:
                st.error("Please acknowledge the informed consent notice before generating your results.")
            else:
                # 1. ENGINE 1 PAYLOAD: Strictly the 10 compatible public dataset features
                # NO suicidal thoughts, NO family history, NO PHQ-9 answers, NO digital habit variables.
                ml_payload = {
                    "Age": float(age),
                    "Academic Pressure": float(academic_pressure),
                    "CGPA": float(cgpa),
                    "Study Satisfaction": float(study_satisfaction),
                    "Work/Study Hours": float(work_study_hours),
                    "Financial Stress": float(financial_stress),
                    "Gender": str(gender),
                    "Sleep Duration": str(sleep_duration),
                    "Dietary Habits": str(dietary_habits),
                    "Degree": str(degree)
                }
                
                # 2. ENGINE 2 PAYLOAD: Digital & Social Lifestyle variables
                lifestyle_payload = {
                    "daily_phone_hours": float(daily_phone_hours),
                    "daily_social_hours": float(daily_social_hours),
                    "primary_platform": str(primary_platform),
                    "phone_before_bed": str(phone_before_bed),
                    "social_comparison": str(social_comparison),
                    "notification_checking": str(notification_checking),
                    "phone_concentration_issue": str(phone_concentration_issue),
                    "Sleep Duration": str(sleep_duration),
                    "sleep_quality": int(sleep_quality),
                    "daily_fatigue": int(daily_fatigue),
                    "dietary_habits": str(dietary_habits),
                    "exercise_frequency": str(exercise_freq),
                    "outdoor_time": int(outdoor_time),
                    "Academic Pressure": float(academic_pressure),
                    "Study Satisfaction": float(study_satisfaction),
                    "loneliness": str(loneliness),
                    "social_support": int(social_support),
                    "friends_interaction": str(friends_interaction),
                    "feeling_connected": int(feeling_connected),
                    "optional_notes": str(optional_notes)
                }
                
                # Run Engine 1: Calibrated ML Prediction + SHAP Attribution
                ml_result = predict_wellness_risk(ml_payload)
                
                # Run Engine 2: Digital & Social Lifestyle Analysis & Recommendations
                lifestyle_analysis = analyze_lifestyle_patterns(lifestyle_payload)
                
                # Run Engine 3: Independent Validated PHQ-9 Psychometric Scoring
                phq9_result = calculate_phq9(phq9_answers)
                
                # Educational wellness recommendations
                recommendations = generate_educational_recommendations(lifestyle_payload, phq9_result["score"])
                
                # Store all three engines separately in session state
                st.session_state.latest_results = {
                    "engine_1_ml": ml_result,
                    "engine_2_lifestyle": lifestyle_analysis,
                    "engine_3_phq9": phq9_result,
                    "recommendations": recommendations,
                    "ml_inputs": ml_payload,
                    "lifestyle_inputs": lifestyle_payload
                }
                st.session_state.assessment_submitted = True
                st.session_state.current_page = "📊 Results & Wellness Insights"
                st.rerun()

    st.markdown(render_footer(), unsafe_allow_html=True)

# ==============================================================================
# PAGE 3: RESULTS & WELLNESS INSIGHTS
# ==============================================================================
elif st.session_state.current_page == "📊 Results & Wellness Insights":
    if not st.session_state.assessment_submitted or st.session_state.latest_results is None:
        st.warning("No assessment results found yet. Please complete the questionnaire first.")
        if st.button("👉 Go to Student Assessment"):
            st.session_state.current_page = "📝 Student Assessment"
            st.rerun()
    else:
        results = st.session_state.latest_results
        ml_res = results["engine_1_ml"]
        life_res = results["engine_2_lifestyle"]
        phq9_res = results["engine_3_phq9"]
        recs = results["recommendations"]
        
        st.markdown(
            f"""
            <div style="margin-bottom: 24px;">
                <div class="mindora-badge">Tri-Engine Screening Report</div>
                <h2 style="font-size: 2.2rem; margin: 4px 0 8px 0; color: {PRIMARY_VIOLET};">
                    Screening Summary & Multi-Engine Insights
                </h2>
                <p style="color: #64748B; font-size: 0.95rem; margin: 0;">
                    Results from the three independent engines: Public ML Model, Digital Lifestyle Patterns, and Validated PHQ-9.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        # 1. IMMEDIATE CRISIS SUPPORT OVERRIDE (Item 9 check)
        if phq9_res["has_self_harm_risk"]:
            crisis = get_crisis_resources()
            st.markdown(
                f"""
                <div class="crisis-box">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <span style="font-size: 1.8rem;">🚨</span>
                        <h3 style="color: #DC2626; margin: 0; font-size: 1.35rem;">
                            Immediate Confidential Support is Available
                        </h3>
                    </div>
                    <p style="font-size: 0.95rem; color: #1E293B; line-height: 1.6; margin-bottom: 14px;">
                        {crisis['emergency_alert']}
                    </p>
                    <div style="background: white; border-radius: 14px; padding: 18px; border: 1px solid #FCA5A5;">
                        <strong style="color: #991B1B; font-size: 0.92rem; display: block; margin-bottom: 8px;">
                            Free, 24/7, Anonymous Lifelines:
                        </strong>
                        <ul style="margin: 0; padding-left: 20px; font-size: 0.88rem; color: #334155; line-height: 1.75;">
                            <li><strong>India:</strong> Call <strong>14416</strong> or <strong>1800-891-4416</strong> (Tele-MANAS, 24/7 Toll-Free) | <strong>1800-599-0019</strong> (KIRAN) | <strong>+91 9999 666 555</strong> (Vandrevala Foundation)</li>
                            <li><strong>USA & Canada:</strong> Call or Text <strong>988</strong> (Suicide & Crisis Lifeline)</li>
                            <li><strong>United Kingdom:</strong> Call <strong>111</strong> (NHS 24/7) or <strong>116 123</strong> (Samaritans)</li>
                            <li><strong>Australia:</strong> Call <strong>13 11 14</strong> (Lifeline)</li>
                            <li><strong>Global:</strong> Visit <a href="https://findahelpline.com" target="_blank" style="color: #DC2626; font-weight: bold;">findahelpline.com</a></li>
                        </ul>
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )

        # ----------------------------------------------------------------------
        # SECTION 1: ENGINE 1 – PUBLIC DATASET ML ESTIMATE
        # ----------------------------------------------------------------------
        st.markdown(
            f"""
            <div style="margin-top: 10px; margin-bottom: 14px;">
                <h3 style="color: {PRIMARY_VIOLET}; margin-bottom: 2px;">
                    1. Engine 1: Public Dataset ML Screening Estimate
                </h3>
                <p style="color: #64748B; font-size: 0.88rem; margin: 0;">
                    Experimental estimation evaluated strictly against 10 demographic, study, and sleep duration features from 27,901 student records. 
                    Uses a calibrated XGBoost pipeline ($Brier = 0.1448$).
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        col_ml1, col_ml2 = st.columns([1, 1.4])
        with col_ml1:
            st.markdown(
                f"""
                <div class="mindora-card" style="border-top: 5px solid {ml_res['badge_color']}; height: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div>
                            <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; font-weight: 700;">
                                ML Screening Status
                            </span>
                            <h3 style="margin: 2px 0 0 0; color: #241A35; font-size: 1.35rem;">
                                {ml_res['risk_tier']}
                            </h3>
                        </div>
                        <span style="background: {ml_res['badge_bg']}; color: {ml_res['badge_color']}; font-weight: 800; font-size: 1.15rem; padding: 6px 14px; border-radius: 20px;">
                            {ml_res['percentage']}%
                        </span>
                    </div>
                    <p style="font-size: 0.88rem; color: #475569; line-height: 1.5; margin-bottom: 16px;">
                        {ml_res['summary']}
                    </p>
                    <div style="font-size: 0.78rem; color: #64748B; background: {LIGHT_SURFACE}; padding: 10px 14px; border-radius: 10px; line-height: 1.5;">
                        <strong>Calibration Method:</strong> Sigmoid cross-validation on training split (5-fold).<br>
                        <strong>Note:</strong> Statistical indicator only; not an individual clinical prognosis.
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )
            
        with col_ml2:
            st.markdown(
                f"""
                <div class="mindora-card" style="height: 100%;">
                    <div class="mindora-badge">Local Explainability</div>
                    <h4 style="margin: 2px 0 6px 0; color: {PRIMARY_VIOLET}; font-size: 1.05rem;">
                        Primary Contributing Factors (SHAP Analysis)
                    </h4>
                    <p style="font-size: 0.82rem; color: #64748B; margin-bottom: 12px;">
                        Illustrates how your academic and sleep patterns shifted model log-odds relative to the student baseline.
                        <em>Notice: Statistical associations do not imply medical causation.</em>
                    </p>
                """,
                unsafe_allow_html=True
            )
            contribs = ml_res["feature_contributions"]
            if contribs:
                feat_labels = [c["feature"] for c in contribs]
                feat_shaps = [c["shap_value"] for c in contribs]
                bar_colors = ["#EF4444" if val > 0 else "#10B981" for val in feat_shaps]
                
                fig_shap = go.Figure(
                    data=[
                        go.Bar(
                            x=feat_shaps,
                            y=feat_labels,
                            orientation="h",
                            marker=dict(color=bar_colors, line=dict(color="rgba(0,0,0,0.1)", width=1)),
                            text=[f"{v:+.2f}" for v in feat_shaps],
                            textposition="outside"
                        )
                    ]
                )
                fig_shap.update_layout(
                    xaxis_title="SHAP Value (Impact on Log-Odds)",
                    yaxis=dict(autorange="reversed"),
                    plot_bgcolor="#FFFFFF",
                    paper_bgcolor="#FFFFFF",
                    height=240,
                    margin=dict(l=10, r=20, t=10, b=30),
                    font=dict(family="Plus Jakarta Sans", color="#241A35", size=11)
                )
                st.plotly_chart(fig_shap, use_container_width=True)
            st.markdown("</div>", unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)

        # ----------------------------------------------------------------------
        # SECTION 2: ENGINE 2 – DIGITAL & SOCIAL LIFESTYLE INSIGHTS
        # ----------------------------------------------------------------------
        st.markdown(
            f"""
            <div style="margin-top: 10px; margin-bottom: 14px;">
                <h3 style="color: {PRIMARY_VIOLET}; margin-bottom: 2px;">
                    2. Engine 2: Digital & Social Lifestyle Insights
                </h3>
                <p style="color: #64748B; font-size: 0.88rem; margin: 0;">
                    Descriptive analysis of screen engagement, circadian sleep hygiene, and social connection. 
                    These insights power personalized self-care and are <strong>not</strong> an ML depression probability.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        col_ls1, col_ls2 = st.columns(2)
        with col_ls1:
            st.markdown(
                f"""
                <div class="mindora-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; font-weight: 700;">
                                Digital Friction Index
                            </span>
                            <h4 style="margin: 2px 0 0 0; color: {PRIMARY_VIOLET}; font-size: 1.15rem;">
                                {life_res['digital_tier']}
                            </h4>
                        </div>
                        <span style="background: {LAVENDER}; color: {PRIMARY_VIOLET}; font-weight: 800; font-size: 1rem; padding: 4px 12px; border-radius: 14px;">
                            {life_res['digital_friction_score']} / 10
                        </span>
                    </div>
                    <ul style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: #475569; line-height: 1.6;">
                        <li>{life_res['key_lifestyle_observations'][0]}</li>
                        <li>{life_res['key_lifestyle_observations'][1]}</li>
                        <li>{life_res['key_lifestyle_observations'][2]}</li>
                    </ul>
                </div>
                """,
                unsafe_allow_html=True
            )
        with col_ls2:
            st.markdown(
                f"""
                <div class="mindora-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; font-weight: 700;">
                                Lifestyle Rhythm Balance
                            </span>
                            <h4 style="margin: 2px 0 0 0; color: #10B981; font-size: 1.15rem;">
                                {life_res['rhythm_tier']}
                            </h4>
                        </div>
                        <span style="background: #ECFDF5; color: #10B981; font-weight: 800; font-size: 1rem; padding: 4px 12px; border-radius: 14px;">
                            {life_res['rhythm_score']} / 10
                        </span>
                    </div>
                    <ul style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: #475569; line-height: 1.6;">
                        <li>{life_res['key_lifestyle_observations'][3]}</li>
                        <li>Evaluates physical activity buffers and circadian rest quality.</li>
                        <li>Highlights healthy balance between coursework and peer connection.</li>
                    </ul>
                </div>
                """,
                unsafe_allow_html=True
            )

        # Tailored Educational Wellness Suggestions
        st.markdown("##### 💡 Actionable Self-Care Recommendations:")
        for rec in recs:
            st.markdown(
                f"""
                <div class="mindora-card" style="margin-bottom: 12px; padding: 16px 20px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                        <span style="font-size: 1.25rem;">{rec['icon']}</span>
                        <strong style="color: {PRIMARY_VIOLET}; font-size: 0.95rem;">{rec['title']}</strong>
                        <span style="font-size: 0.72rem; background: {LAVENDER}; color: {PRIMARY_VIOLET}; padding: 2px 8px; border-radius: 10px; font-weight: 600;">
                            {rec['category']}
                        </span>
                    </div>
                    <p style="font-size: 0.86rem; color: #475569; margin: 0; line-height: 1.5;">
                        {rec['action']}
                    </p>
                </div>
                """,
                unsafe_allow_html=True
            )

        st.markdown("<br>", unsafe_allow_html=True)

        # ----------------------------------------------------------------------
        # SECTION 3: ENGINE 3 – INDEPENDENT VALIDATED PHQ-9 SCREENING
        # ----------------------------------------------------------------------
        st.markdown(
            f"""
            <div style="margin-top: 10px; margin-bottom: 14px;">
                <h3 style="color: {PRIMARY_VIOLET}; margin-bottom: 2px;">
                    3. Engine 3: Independent Standardized PHQ-9 Screening
                </h3>
                <p style="color: #64748B; font-size: 0.88rem; margin: 0;">
                    Standardized clinical 9-item psychometric assessment. Kept <strong>completely separate</strong> from the ML model.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        st.markdown(
            f"""
            <div class="mindora-card" style="border-top: 5px solid {phq9_res['badge_color']};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div>
                        <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; font-weight: 700;">
                            Clinical Standard
                        </span>
                        <h4 style="margin: 2px 0 0 0; color: #241A35; font-size: 1.3rem;">
                            PHQ-9 Severity: {phq9_res['severity']}
                        </h4>
                    </div>
                    <span style="background: {phq9_res['badge_bg']}; color: {phq9_res['badge_color']}; font-weight: 800; font-size: 1.15rem; padding: 6px 14px; border-radius: 20px;">
                        Score: {phq9_res['score']} / {phq9_res['max_score']}
                    </span>
                </div>
                <p style="font-size: 0.9rem; color: #475569; line-height: 1.55; margin-bottom: 12px;">
                    {phq9_res['description']}
                </p>
                <div style="font-size: 0.8rem; color: #64748B; background: {LIGHT_SURFACE}; padding: 10px 14px; border-radius: 10px; line-height: 1.5;">
                    <strong>Clinical Context:</strong> The Patient Health Questionnaire (PHQ-9) is a validated diagnostic aid used globally in primary and university care. 
                    Scores &ge; 10 represent a clinical threshold where speaking with a licensed campus therapist is strongly encouraged.
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

        # Action Buttons
        col_btn1, col_btn2 = st.columns(2)
        with col_btn1:
            if st.button("🔄 Retake Assessment", use_container_width=True):
                st.session_state.current_page = "📝 Student Assessment"
                st.rerun()
        with col_btn2:
            if st.button("📈 Explore Model Benchmark & Analytics", use_container_width=True):
                st.session_state.current_page = "📈 Analytics & Model Benchmark"
                st.rerun()

    st.markdown(render_footer(), unsafe_allow_html=True)

# ==============================================================================
# PAGE 4: ANALYTICS DASHBOARD
# ==============================================================================
elif st.session_state.current_page == "📈 Analytics & Model Benchmark":
    st.markdown(
        f"""
        <div style="margin-bottom: 24px;">
            <div class="mindora-badge">Scientific Rigor & ML Benchmark</div>
            <h2 style="font-size: 2.2rem; margin: 4px 0 8px 0; color: {PRIMARY_VIOLET};">
                Dataset Insights & Model Performance
            </h2>
            <p style="color: #64748B; font-size: 0.95rem; margin: 0;">
                Rigorous empirical evaluation on 27,901 student records across 10 clean non-leaking features. 
                Model selected strictly on validation data; probabilities calibrated via 5-fold cross-validation.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    # Load model comparison JSON
    comp_path = os.path.join(os.path.dirname(__file__), "models", "model_comparison.json")
    if os.path.exists(comp_path):
        with open(comp_path, "r", encoding="utf-8") as f:
            comp_data = json.load(f)
    else:
        comp_data = None
        
    cal_m = comp_data.get("calibrated_production_metrics", {}) if comp_data else {}
    
    # Top KPI Metrics Row
    kpi1, kpi2, kpi3, kpi4 = st.columns(4)
    with kpi1:
        st.metric("Total Students Analyzed", "27,901", delta="Hugging Face Benchmark")
    with kpi2:
        st.metric("Selected Production Model", comp_data.get("best_model", "XGBoost") if comp_data else "XGBoost", delta="Validation Selected")
    with kpi3:
        best_auc = cal_m.get("roc_auc", 0.8676)
        st.metric("Untouched Test ROC-AUC", f"{best_auc:.4f}", delta="Held-out Test (N=4,186)")
    with kpi4:
        brier = cal_m.get("brier_score", 0.1448)
        st.metric("Calibration Brier Score", f"{brier:.4f}", delta="CalibratedClassifierCV (5-Fold)")
        
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Visualizations Tabs
    viz_tab1, viz_tab2, viz_tab3, viz_tab4 = st.tabs([
        "1. Validation Selection & Test Benchmark",
        "2. Clean Feature Importance",
        "3. Calibration Curve & Evaluation Plots",
        "4. Historical Experiments & Leakage Analysis"
    ])
    
    # TAB 1: Validation Selection & Test Benchmark
    with viz_tab1:
        st.markdown("#### 🔬 Model Benchmark across Train, Validation, and Held-Out Test Splits")
        if comp_data:
            model_metrics = []
            for m_name, m_info in comp_data["models"].items():
                vm = m_info["val_metrics"]
                tm = m_info["test_metrics"]
                model_metrics.append({
                    "Model": m_name,
                    "Val F1": vm["f1_score"],
                    "Val ROC-AUC": vm["roc_auc"],
                    "Val Recall": vm["recall"],
                    "Test Accuracy": tm["accuracy"],
                    "Test Recall": tm["recall"],
                    "Test F1-Score": tm["f1_score"],
                    "Test ROC-AUC": tm["roc_auc"],
                    "Test Brier": tm["brier_score"]
                })
            df_comp = pd.DataFrame(model_metrics)
            
            st.dataframe(
                df_comp.style.format({
                    "Val F1": "{:.4f}",
                    "Val ROC-AUC": "{:.4f}",
                    "Val Recall": "{:.4f}",
                    "Test Accuracy": "{:.4f}",
                    "Test Recall": "{:.4f}",
                    "Test F1-Score": "{:.4f}",
                    "Test ROC-AUC": "{:.4f}",
                    "Test Brier": "{:.4f}"
                }).highlight_max(axis=0, color="#E9D5FF"),
                use_container_width=True
            )
            
            st.markdown(
                f"""
                <div style="background: {LIGHT_SURFACE}; padding: 14px; border-radius: 12px; border-left: 4px solid {PRIMARY_VIOLET}; margin-top: 14px;">
                    <strong style="color: {PRIMARY_VIOLET};">Validation Selection Integrity:</strong>
                    <p style="font-size: 0.88rem; color: #475569; margin: 4px 0 0 0;">
                        {comp_data.get('selection_rationale', '')}
                    </p>
                </div>
                """,
                unsafe_allow_html=True
            )

    # TAB 2: Clean Feature Importance
    with viz_tab2:
        st.markdown("#### 🌲 Clean Feature Importance (XGBoost Split/Gini Importance)")
        st.caption("Suicidal ideation and family history have been completely removed. Feature importances reflect statistical associations only.")
        fi_path = os.path.join(os.path.dirname(__file__), "models", "feature_importance.csv")
        if os.path.exists(fi_path):
            df_fi = pd.read_csv(fi_path).head(15)
            fig_fi = px.bar(
                df_fi,
                x="importance",
                y="feature",
                orientation="h",
                color="importance",
                color_continuous_scale=["#DDD6FE", "#8B5CF6", "#6D43C6"],
                title="Top 15 Most Influential Features (10 Clean Input Schema)"
            )
            fig_fi.update_layout(
                yaxis=dict(autorange="reversed"),
                plot_bgcolor="#FFFFFF",
                paper_bgcolor="#FFFFFF",
                font=dict(family="Plus Jakarta Sans")
            )
            st.plotly_chart(fig_fi, use_container_width=True)

    # TAB 3: Calibration Curve & Evaluation Plots
    with viz_tab3:
        st.markdown("#### 📈 Reliability Diagram & Evaluation Visual Artifacts")
        st.markdown(
            f"""
            <div style="background: {LIGHT_SURFACE}; padding: 14px 18px; border-radius: 12px; border-left: 4px solid {PRIMARY_VIOLET}; margin-bottom: 16px;">
                <strong style="color: {PRIMARY_VIOLET}; font-size: 0.92rem;">Calibration & Reliability Audit:</strong>
                <p style="font-size: 0.85rem; color: #475569; margin: 4px 0 0 0; line-height: 1.55;">
                    The uncalibrated base XGBoost achieved a Brier score of <strong>0.1441</strong>, while the calibrated pipeline 
                    achieved <strong>0.1448</strong> on the untouched held-out test set ($N=4,186$). 
                    This comparison honestly confirms that XGBoost's logloss objective was already well-scaled. 
                    The 5-fold cross-validation calibration step ensures bounded empirical probability deciles rather than claiming a performance breakthrough.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )
        mc_img_path = os.path.join(os.path.dirname(__file__), "evaluation", "model_comparison.png")
        cm_img_path = os.path.join(os.path.dirname(__file__), "evaluation", "confusion_matrix.png")
        
        if os.path.exists(mc_img_path):
            st.image(mc_img_path, caption="Comparative Performance, ROC Curves, and Calibration Reliability Diagram", use_container_width=True)
        if os.path.exists(cm_img_path):
            st.image(cm_img_path, caption="Held-Out Test Set Confusion Matrices across Models", use_container_width=True)

    # TAB 4: Historical Experiments & Leakage Analysis
    with viz_tab4:
        st.markdown("#### 🏛️ Preliminary Experiments & Technical Audit Documentation")
        st.markdown(
            f"""
            <div class="mindora-card">
                <h4 style="color: {PRIMARY_VIOLET}; margin-bottom: 8px;">Experimental Progression & Audit Findings</h4>
                <p style="font-size: 0.88rem; color: #475569; line-height: 1.6; margin-bottom: 12px;">
                    During initial development, two preliminary experiments were conducted and audited:
                </p>
                <div style="background: {LIGHT_SURFACE}; padding: 12px 16px; border-radius: 10px; margin-bottom: 12px;">
                    <strong>Preliminary Experiment 1 (84.11% Accuracy):</strong> Included <code>Have you ever had suicidal thoughts?</code>.<br>
                    <span style="font-size: 0.84rem; color: #64748B;">Audit Finding: Gini importance exceeded 59.9%. This was identified as clinical target leakage. 
                    Suicidal ideation is an acute emergency symptom, not an educational lifestyle habit. Completely removed from the ML pipeline.</span>
                </div>
                <div style="background: {LIGHT_SURFACE}; padding: 12px 16px; border-radius: 10px; margin-bottom: 12px;">
                    <strong>Preliminary Experiment 2 (80.12% Accuracy):</strong> Included <code>Family History of Mental Illness</code>.<br>
                    <span style="font-size: 0.84rem; color: #64748B;">Audit Finding: Excluded to respect student privacy and eliminate assumptions about unverified family health history.</span>
                </div>
                <div style="background: #F1EBFF; padding: 12px 16px; border-radius: 10px; border-left: 4px solid {PRIMARY_VIOLET};">
                    <strong>Final Production Pipeline (79.69% Accuracy, 0.8676 ROC-AUC, 0.1448 Brier):</strong><br>
                    <span style="font-size: 0.84rem; color: #334155;">Strictly trained on 10 non-leaking lifestyle, academic, and study features. Models selected purely on validation data; 
                    calibrated using 5-fold cross-validation.</span>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

    st.markdown(render_footer(), unsafe_allow_html=True)

# ==============================================================================
# PAGE 5: ABOUT & METHODOLOGY
# ==============================================================================
elif st.session_state.current_page == "ℹ️ Methodology & About":
    st.markdown(
        f"""
        <div style="margin-bottom: 24px;">
            <div class="mindora-badge">Ethical AI & Transparency</div>
            <h2 style="font-size: 2.2rem; margin: 4px 0 8px 0; color: {PRIMARY_VIOLET};">
                Methodology, Ethics & Disclaimers
            </h2>
            <p style="color: #64748B; font-size: 0.95rem; margin: 0;">
                Documenting data provenance, pipeline integrity, clinical segregation, and ethical boundaries.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    st.markdown(render_safety_disclaimer_card(), unsafe_allow_html=True)
    
    col_ab1, col_ab2 = st.columns(2)
    with col_ab1:
        st.markdown(
            f"""
            <div class="mindora-card">
                <h4 style="color: {PRIMARY_VIOLET}; margin-bottom: 8px;">1. Three-Engine Architecture</h4>
                <p style="font-size: 0.88rem; color: #475569; line-height: 1.6; margin-bottom: 10px;">
                    Mindora maintains strict scientific boundaries across three independent subsystems:
                </p>
                <ul style="font-size: 0.85rem; color: #475569; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li><strong>Engine 1 (Public ML):</strong> Calibrated XGBoost classifier trained on 10 verified demographic, study, and sleep duration features from 27,901 student records.</li>
                    <li><strong>Engine 2 (Lifestyle Analytics):</strong> Descriptive screen time, social media habits, and sleep quality analysis for personalized self-care advice.</li>
                    <li><strong>Engine 3 (PHQ-9):</strong> Standardized clinical psychometrics (0–27 score) with unconditional crisis escalation for self-harm thoughts.</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        st.markdown(
            f"""
            <div class="mindora-card">
                <h4 style="color: {PRIMARY_VIOLET}; margin-bottom: 8px;">3. Privacy Policy & Zero Retention</h4>
                <p style="font-size: 0.88rem; color: #475569; line-height: 1.6; margin-bottom: 10px;">
                    Student confidentiality is guaranteed by design:
                </p>
                <ul style="font-size: 0.85rem; color: #475569; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li>No names, emails, student IDs, or contact information are collected.</li>
                    <li>No responses are written to databases, log files, or persistent storage.</li>
                    <li>All computation runs in ephemeral session memory and is destroyed upon tab closure.</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True
        )
        
    with col_ab2:
        st.markdown(
            f"""
            <div class="mindora-card">
                <h4 style="color: {PRIMARY_VIOLET}; margin-bottom: 8px;">2. Machine Learning Methodology</h4>
                <p style="font-size: 0.88rem; color: #475569; line-height: 1.6; margin-bottom: 10px;">
                    Engineered according to rigorous ML best practices:
                </p>
                <ul style="font-size: 0.85rem; color: #475569; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li><strong>Stratified Split:</strong> 70% Train, 15% Validation, 15% Held-Out Test.</li>
                    <li><strong>Validation Selection:</strong> Model selection conducted strictly on validation metrics; held-out test set evaluated only once.</li>
                    <li><strong>Calibrated Probabilities:</strong> <code>CalibratedClassifierCV(method='sigmoid', cv=5)</code> ensures risk percentages reflect empirical probabilities ($Brier = 0.1448$).</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        st.markdown(
            f"""
            <div class="mindora-card">
                <h4 style="color: {PRIMARY_VIOLET}; margin-bottom: 8px;">4. Limitations & Medical Boundaries</h4>
                <p style="font-size: 0.88rem; color: #475569; line-height: 1.6; margin-bottom: 10px;">
                    Key technical and medical limitations:
                </p>
                <ul style="font-size: 0.85rem; color: #475569; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li><strong>Not a Diagnosis:</strong> Predictions represent statistical alignment with historical dataset labels, not a medical condition.</li>
                    <li><strong>Correlation $\neq$ Causation:</strong> High feature importance indicates correlation, not that a specific habit caused depression.</li>
                    <li><strong>Deterministic Safety:</strong> Crisis intervention never relies on model predictions; self-harm indicators trigger immediate emergency help.</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True
        )

    # Full Training Report Viewer
    with st.expander("📄 View Full Machine Learning Training & Evaluation Text Report"):
        rep_file = os.path.join(os.path.dirname(__file__), "evaluation", "training_report.txt")
        if os.path.exists(rep_file):
            with open(rep_file, "r", encoding="utf-8") as f:
                st.code(f.read(), language="text")
        else:
            st.info("Report file not generated yet.")

    st.markdown(render_footer(), unsafe_allow_html=True)
