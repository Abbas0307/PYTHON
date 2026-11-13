"""
src/recommendations.py
Mindora - Student Mental Wellness & Risk Insights
Contains:
  - ENGINE 2: Digital & Social Lifestyle Insights & Educational Wellness Guidance
  - ENGINE 3: Validated Standardized PHQ-9 Psychometric Scoring & Crisis Safeguards
Strictly segregated from Engine 1 (Machine Learning Prediction).
"""

from typing import Dict, Any, List

# ==============================================================================
# ENGINE 3: VALIDATED PHQ-9 PSYCHOMETRIC INSTRUMENT
# ==============================================================================

PHQ9_QUESTIONS = [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
    "Trouble concentrating on things, such as reading or studying",
    "Moving or speaking so slowly that other people could have noticed, or being fidgety/restless",
    "Thoughts that you would be better off dead, or of hurting yourself in some way"
]

PHQ9_RESPONSE_OPTIONS = {
    0: "Not at all (0)",
    1: "Several days (1)",
    2: "More than half the days (2)",
    3: "Nearly every day (3)"
}

def calculate_phq9(scores: List[int]) -> Dict[str, Any]:
    """
    Calculate validated PHQ-9 aggregate score and clinical severity tier.
    ENGINE 3 is a standardized psychometric screening tool, kept strictly
    separate from the machine learning risk predictions.
    """
    total_score = sum(scores)
    item_9_score = scores[8] if len(scores) > 8 else 0
    has_self_harm_risk = item_9_score > 0
    
    if total_score <= 4:
        severity = "Minimal or None"
        description = "Your responses reflect minimal depressive symptoms over the past two weeks."
        badge_color = "#10B981"
        badge_bg = "#ECFDF5"
    elif total_score <= 9:
        severity = "Mild"
        description = "Mild depressive symptoms indicated. Recommended to practice active self-care and monitor changes."
        badge_color = "#3B82F6"
        badge_bg = "#EFF6FF"
    elif total_score <= 14:
        severity = "Moderate"
        description = "Moderate depressive symptoms indicated. Consider speaking with a university counselor or healthcare professional."
        badge_color = "#F59E0B"
        badge_bg = "#FEF3C7"
    elif total_score <= 19:
        severity = "Moderately Severe"
        description = "Moderately severe symptoms indicated. We strongly advise scheduling a clinical consultation."
        badge_color = "#F97316"
        badge_bg = "#FFEDD5"
    else:
        severity = "Severe"
        description = "Severe symptoms indicated. Please seek comprehensive evaluation from a mental health clinician."
        badge_color = "#EF4444"
        badge_bg = "#FEE2E2"
        
    return {
        "score": total_score,
        "max_score": 27,
        "severity": severity,
        "description": description,
        "badge_color": badge_color,
        "badge_bg": badge_bg,
        "item_9_score": item_9_score,
        "has_self_harm_risk": has_self_harm_risk
    }

def get_crisis_resources() -> Dict[str, Any]:
    """
    Immediate crisis support and emergency contacts.
    This information is highlighted unconditionally whenever self-harm (PHQ-9 Item 9) is flagged,
    completely independent of all machine learning predictions.
    """
    return {
        "emergency_alert": (
            "If you or someone you know is in immediate danger, feeling overwhelmed, or experiencing thoughts of suicide, "
            "please know that compassionate, free, and confidential support is available right now. You are not alone."
        ),
        "helplines": [
            {
                "country": "India (National & Regional)",
                "name": "Tele-MANAS & KIRAN National Mental Health Helplines",
                "contact": "Call 14416 or 1800-891-4416 (Tele-MANAS, 24/7, 20+ Languages) | 1800-599-0019 (KIRAN) | +91 9999 666 555 (Vandrevala Foundation)",
                "link": "https://telemanas.mohfw.gov.in"
            },
            {
                "country": "United States & Canada",
                "name": "988 Suicide & Crisis Lifeline",
                "contact": "Call or Text 988 (Available 24/7, Free & Confidential)",
                "link": "https://988lifeline.org"
            },
            {
                "country": "United Kingdom",
                "name": "Samaritans & NHS Mental Health",
                "contact": "Call 116 123 (Samaritans) or 111 (NHS 24/7)",
                "link": "https://www.samaritans.org"
            },
            {
                "country": "Australia",
                "name": "Lifeline Australia",
                "contact": "Call 13 11 14 or Text 0477 13 11 14 (24/7)",
                "link": "https://www.lifeline.org.au"
            },
            {
                "country": "International / Worldwide",
                "name": "Befrienders Worldwide & Find A Helpline",
                "contact": "Free global confidential emotional support directory",
                "link": "https://findahelpline.com"
            }
        ]
    }

# ==============================================================================
# ENGINE 2: DIGITAL & SOCIAL LIFESTYLE INSIGHTS & WELLNESS GUIDANCE
# ==============================================================================

def analyze_lifestyle_patterns(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    ENGINE 2: Descriptive evaluation of digital screen habits, sleep architecture,
    and social connection. Does NOT predict depression; provides descriptive lifestyle insights.
    """
    phone_hrs = float(user_data.get("daily_phone_hours", 5.0))
    social_hrs = float(user_data.get("daily_social_hours", 3.0))
    phone_bed = user_data.get("phone_before_bed", "Yes")
    social_comp = user_data.get("social_comparison", "Sometimes")
    loneliness = user_data.get("loneliness", "Sometimes")
    sleep_qual = int(user_data.get("sleep_quality", 3))
    fatigue = int(user_data.get("daily_fatigue", 3))
    exercise = user_data.get("exercise_frequency", "Moderate (1-2x/week)")

    # 1. Digital Friction Score (0 to 10)
    digital_friction = 0
    if phone_hrs >= 7.0:
        digital_friction += 3
    elif phone_hrs >= 5.0:
        digital_friction += 2
    if social_hrs >= 4.0:
        digital_friction += 3
    elif social_hrs >= 2.5:
        digital_friction += 2
    if phone_bed == "Yes":
        digital_friction += 2
    if social_comp in ["Often", "Always"]:
        digital_friction += 2

    # 2. Lifestyle Rhythm Balance (0 to 10)
    rhythm_score = 0
    if sleep_qual >= 4:
        rhythm_score += 3
    elif sleep_qual == 3:
        rhythm_score += 2
    if fatigue <= 2:
        rhythm_score += 3
    elif fatigue == 3:
        rhythm_score += 2
    if exercise in ["Moderate (1-2x/week)", "Active (3+x/week)"]:
        rhythm_score += 2
    if loneliness in ["Never", "Rarely"]:
        rhythm_score += 2

    return {
        "digital_friction_score": min(digital_friction, 10),
        "digital_friction": min(digital_friction, 10),
        "digital_tier": "High Screen Friction" if digital_friction >= 6 else ("Moderate Screen Use" if digital_friction >= 4 else "Balanced Digital Habits"),
        "rhythm_score": min(rhythm_score, 10),
        "rhythm_tier": "Supportive Lifestyle Rhythms" if rhythm_score >= 6 else "Strained Lifestyle Rhythms",
        "key_lifestyle_observations": [
            f"Daily screen engagement: {phone_hrs:.1f} hrs total (approx {social_hrs:.1f} hrs on social media).",
            f"Pre-sleep screen buffer: {'Needs attention (active phone use in bed)' if phone_bed == 'Yes' else 'Protective (no late-night screen browsing)'}.",
            f"Social comparison frequency: {social_comp}.",
            f"Physical movement: {exercise}."
        ]
    }

def generate_educational_recommendations(user_data: Dict[str, Any], phq9_score: int) -> List[Dict[str, str]]:
    """
    Generate tailored educational wellness suggestions based on questionnaire responses.
    Educational and lifestyle guidance only; does not prescribe medication or clinical treatments.
    """
    recs = []
    
    # 1. Sleep Habits
    sleep_dur = user_data.get("Sleep Duration", "7-8 hours")
    phone_before_bed = user_data.get("phone_before_bed", "Yes")
    sleep_qual = int(user_data.get("sleep_quality", 3))
    
    if sleep_dur in ["Less than 5 hours", "5-6 hours"] or phone_before_bed == "Yes" or sleep_qual <= 2:
        recs.append({
            "category": "Sleep Hygiene & Circadian Health",
            "icon": "🌙",
            "title": "Establish a 45-Minute Digital Wind-Down Buffer",
            "action": (
                "Blue-spectrum light from phone screens suppresses melatonin release and delays deep sleep architecture. "
                "Set a firm screen cut-off 45 minutes before sleep. Replace late scrolling with audio relaxation, journaling, or reading."
            )
        })
    else:
        recs.append({
            "category": "Sleep Architecture",
            "icon": "✨",
            "title": "Maintain Consistent Sleep and Wake Windows",
            "action": (
                "Your reported sleep duration is supportive. Anchoring consistent sleep and wake times reinforces cognitive resilience."
            )
        })
        
    # 2. Digital Habits & Phone Use
    screen_hours = float(user_data.get("daily_phone_hours", 5.0))
    social_comparison = user_data.get("social_comparison", "Often")
    if screen_hours >= 6.0 or social_comparison in ["Often", "Always"]:
        recs.append({
            "category": "Digital Wellness & Cognitive Focus",
            "icon": "📱",
            "title": "Implement Focused Study Blocks & Social Media Boundaries",
            "action": (
                "High passive social media consumption frequently amplifies upward social comparison and attention fragmentation. "
                "Use 25-minute Pomodoro study intervals with phone kept out of reach, and curate feeds to mute triggering accounts."
            )
        })

    # 3. Academic Pressure & Workload
    acad_pressure = float(user_data.get("Academic Pressure", 3.0))
    study_sat = float(user_data.get("Study Satisfaction", 3.0))
    if acad_pressure >= 4.0 or study_sat <= 2.0:
        recs.append({
            "category": "Academic Decompression",
            "icon": "📚",
            "title": "Chunk Coursework & Leverage Campus Academic Mentorship",
            "action": (
                "Elevated academic load often triggers cognitive exhaustion. Break large assignments into micro-tasks and "
                "attend faculty office hours or peer study groups rather than tackling difficult coursework in isolation."
            )
        })

    # 4. Physical Activity & Outdoor Exposure
    exercise = user_data.get("exercise_frequency", "Rarely (1-2x/month)")
    if exercise in ["Never", "Rarely (1-2x/month)"]:
        recs.append({
            "category": "Physical Movement & Neurochemistry",
            "icon": "🏃",
            "title": "Incorporate 20-Minute Daily Sunlight & Brisk Walking",
            "action": (
                "Physical movement stimulates endorphin and BDNF synthesis. Even a brisk 20-minute morning walk in natural sunlight "
                "substantially enhances daytime alertness and nighttime melatonin timing."
            )
        })

    # 5. Social Connectedness & Peer Support
    loneliness = user_data.get("loneliness", "Often")
    if loneliness in ["Often", "Always"]:
        recs.append({
            "category": "Social Connection",
            "icon": "🤝",
            "title": "Re-engage with Meaningful Peer Contact",
            "action": (
                "Academic stress frequently prompts students to withdraw, reinforcing feelings of isolation. "
                "Schedule a weekly walk or study session with a friend, or explore university student clubs aligned with your hobbies."
            )
        })
        
    # 6. Professional Care Guidance
    if phq9_score >= 10:
        recs.append({
            "category": "Professional Consultation",
            "icon": "🩺",
            "title": "Consult a Licensed Campus or Community Counselor",
            "action": (
                "Because your self-reported questionnaire indicates noticeable emotional strain, we recommend "
                "reaching out to your university counseling center or a licensed therapist for a personalized evaluation."
            )
        })
        
    return recs
