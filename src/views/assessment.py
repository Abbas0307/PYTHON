"""
src/views/assessment.py
Mindora – Student Wellness & Habit Assessment View.
Coordinates the three strictly independent subsystems:
  - ENGINE 1: 10-Feature Calibrated ML Prediction + SHAP Explainability
  - ENGINE 2: Digital & Social Lifestyle Rhythm Analytics
  - ENGINE 3: Validated Standardized PHQ-9 Screener & Crisis Escalation
"""

import datetime
import streamlit as st
from src.predict import predict_wellness_risk
from src.recommendations import (
    PHQ9_QUESTIONS,
    PHQ9_RESPONSE_OPTIONS,
    calculate_phq9,
    analyze_lifestyle_patterns,
    generate_educational_recommendations
)
from src.ui_theme import (
    PRIMARY_VIOLET,
    SECONDARY_VIOLET,
    LAVENDER,
    LIGHT_SURFACE,
    MAIN_TEXT,
    render_safety_disclaimer_card
)

def render_assessment():
    """Render the student assessment questionnaire and coordinate engine inference."""
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
                    <strong style="color: {PRIMARY_VIOLET}; display: block; margin-bottom: 4px;">
                        Standardized Patient Health Questionnaire (PHQ-9)
                    </strong>
                    <span style="font-size: 0.85rem; color: #64748B;">
                        Over the last 2 weeks, how often have you been bothered by any of the following problems?
                    </span>
                </div>
                """,
                unsafe_allow_html=True
            )
            
            phq9_answers = []
            for i, question in enumerate(PHQ9_QUESTIONS):
                ans = st.radio(
                    f"{i+1}. {question}",
                    options=list(PHQ9_RESPONSE_OPTIONS.keys()),
                    format_func=lambda x: PHQ9_RESPONSE_OPTIONS[x],
                    index=0,
                    key=f"phq9_q_{i}",
                    horizontal=True
                )
                phq9_answers.append(ans)
                
            st.caption("Note: Question 9 asks about thoughts of being better off dead or of self-harm. A positive response surfaces supportive mental health guidance and helpline contacts.")

        # TAB E: Social Environment (Engine 2)
        with tab_e:
            st.markdown("#### 🤝 Social Connection & Support Systems (Engine 2: Lifestyle Context)")
            col_e1, col_e2 = st.columns(2)
            with col_e1:
                loneliness = st.select_slider(
                    "How often do you feel isolated or lonely on campus?",
                    options=["Never", "Rarely", "Sometimes", "Often", "Always"],
                    value="Sometimes"
                )
                social_support = st.slider(
                    "Satisfaction with Emotional Support from Family/Friends (1 = Very Low, 5 = Very High)",
                    min_value=1, max_value=5, value=3
                )
            with col_e2:
                friends_interaction = st.selectbox(
                    "How often do you spend quality in-person time with friends?",
                    ["Almost daily", "2-3 times a week", "Once a week", "A few times a month", "Rarely / Never"],
                    index=1
                )
                feeling_connected = st.slider(
                    "Feeling Connected to Campus/Community (1 = Disconnected, 5 = Highly Connected)",
                    min_value=1, max_value=5, value=3
                )
                
            optional_notes = st.text_area(
                "Optional Personal Reflections or Notes (Active Session Only)",
                placeholder="Share any contextual thoughts, study challenges, or feelings here..."
            )

        st.markdown("---")
        
        # Informed Consent & Confirmation
        consent = st.checkbox(
            "I confirm that my participation is voluntary. I understand that Mindora provides experimental screening indicators "
            "and educational wellness guidance across three segregated engines, and does NOT provide a medical diagnosis or clinical treatment.",
            value=True
        )
        
        submit_btn = st.form_submit_button("🔍 Analyze Responses & View Wellness Insights", use_container_width=True, type="primary")
        
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
                
                try:
                    # Run Engine 1: Calibrated ML Prediction + SHAP Attribution
                    ml_result = predict_wellness_risk(ml_payload)
                    
                    # Run Engine 2: Digital & Social Lifestyle Analysis & Recommendations
                    lifestyle_analysis = analyze_lifestyle_patterns(lifestyle_payload)
                    
                    # Run Engine 3: Independent Validated PHQ-9 Psychometric Scoring
                    phq9_result = calculate_phq9(phq9_answers)
                    
                    # Contextual educational wellness recommendations
                    lifestyle_payload["has_self_harm_risk"] = phq9_result.get("has_self_harm_risk", False)
                    recommendations = generate_educational_recommendations(
                        lifestyle_payload,
                        phq9_result["score"],
                        feedback_dict=st.session_state.get("recommendation_feedback", {}),
                        dismissed_set=st.session_state.get("dismissed_recommendations", set())
                    )
                    
                    # Store all three engines separately in session state
                    st.session_state.latest_results = {
                        "engine_1_ml": ml_result,
                        "engine_2_lifestyle": lifestyle_analysis,
                        "engine_3_phq9": phq9_result,
                        "recommendations": recommendations,
                        "ml_inputs": ml_payload,
                        "lifestyle_inputs": lifestyle_payload
                    }
                    
                    # Record session milestone in session_progress
                    if "session_progress" not in st.session_state:
                        st.session_state.session_progress = []
                    st.session_state.session_progress.append({
                        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "risk_tier": ml_result["risk_tier"],
                        "risk_percentage": ml_result["percentage"],
                        "phq9_score": phq9_result["score"],
                        "phq9_severity": phq9_result["severity"],
                        "rhythm_score": lifestyle_analysis["rhythm_score"],
                        "digital_friction": lifestyle_analysis["digital_friction"]
                    })
                    
                    st.session_state.assessment_submitted = True
                    st.session_state.current_page = "📊 My Insights"
                    st.rerun()
                except ValueError as ve:
                    st.error(f"⚠️ Input Validation Notice: {str(ve)}")
                except FileNotFoundError as fnf:
                    st.error("⚠️ Model Artifact Notice: The production ML model artifact was not found. Please verify local environment initialization.")
                except Exception as ex:
                    st.error(f"⚠️ Assessment Processing Notice: An unexpected error occurred while analyzing responses ({type(ex).__name__}). Please review your inputs and try again.")
