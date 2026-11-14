"""
src/recommendations.py
Mindora - Student Mental Wellness & Risk Insights
Contains:
  - ENGINE 2: Digital & Social Lifestyle Insights & Educational Wellness Guidance
  - ENGINE 3: Validated Standardized PHQ-9 Psychometric Scoring & Crisis Safeguards
Strictly segregated from Engine 1 (Machine Learning Prediction).
"""

from typing import Dict, Any, List, Optional, Set

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
    if not isinstance(scores, (list, tuple)):
        raise ValueError(f"PHQ-9 responses must be a list or tuple, received {type(scores).__name__}")
    if len(scores) != 9:
        raise ValueError(f"PHQ-9 assessment requires exactly 9 responses (received {len(scores)})")
    
    validated_scores = []
    for idx, s in enumerate(scores):
        try:
            val = int(s)
            if val not in (0, 1, 2, 3):
                raise ValueError()
            validated_scores.append(val)
        except (ValueError, TypeError):
            raise ValueError(f"PHQ-9 question {idx + 1} response must be an integer between 0 and 3 (received {s})")
            
    total_score = sum(validated_scores)
    item_9_score = validated_scores[8]
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
    Supportive mental health resources and 24/7 helplines.
    Triggered when thoughts of self-harm (PHQ-9 Item 9) are indicated,
    providing compassionate, confidential guidance independent of ML predictions.
    
    Official Reference for Indian Mental Health Helplines:
    https://www.dghs.mohfw.gov.in/national-mental-health-programme.php
    """
    support_text = (
        "On the questionnaire, you indicated experiencing thoughts of being better off dead or of hurting yourself. "
        "We care about your safety and emotional wellbeing. While experiencing these thoughts reflects distress, "
        "an educational screening questionnaire cannot assess your individual situation or clinical urgency. "
        "Supportive and compassionate resources are available to help you navigate how you are feeling. "
        "Whether you are coping with painful emotions or feel you may need support, connecting with a "
        "counselor, healthcare professional, trusted mentor, or helpline can provide a safe and helpful space. "
        "If you or someone you know is in immediate life-threatening danger or experiencing a medical emergency, "
        "please contact local emergency services immediately (such as 112 in India, 911 in US/Canada, 999 in UK) "
        "or proceed to the nearest emergency department."
    )
    india_helplines = [
        {
            "name": "Tele-MANAS (National Tele Mental Health Programme of India)",
            "service": "Tele-MANAS (National Tele Mental Health Programme of India)",
            "details": "Government of India (MoHFW) 24/7 National Mental Health Helpline, available across 20+ languages.",
            "primary_number": "14416",
            "number": "14416 / 1800-89-14416",
            "toll_free": "1800-89-14416",
            "link": "https://telemanas.mohfw.gov.in"
        },
        {
            "name": "KIRAN Mental Health Rehabilitation Helpline",
            "service": "KIRAN Mental Health Rehabilitation Helpline",
            "details": "Toll-free mental health rehabilitation helpline by Department of Empowerment of Persons with Disabilities, Ministry of Social Justice & Empowerment.",
            "primary_number": "1800-599-0019",
            "number": "1800-599-0019",
            "toll_free": "1800-599-0019",
            "link": "https://www.dghs.mohfw.gov.in/national-mental-health-programme.php"
        },
        {
            "name": "Vandrevala Foundation Mental Health Helpline",
            "service": "Vandrevala Foundation Mental Health Helpline",
            "details": "Free psychological counseling and supportive helpline across India (+91 9999 666 555).",
            "primary_number": "+91 9999 666 555",
            "number": "+91 9999 666 555",
            "toll_free": "+91 9999 666 555",
            "link": "https://www.vandrevalafoundation.com"
        }
    ]

    international_helplines = [
        {
            "name": "988 Suicide & Crisis Lifeline (United States)",
            "country": "United States",
            "service": "988 Suicide & Crisis Lifeline",
            "contact": "Call or Text 988 (Available 24/7 across the United States)",
            "number": "988",
            "link": "https://988lifeline.org"
        },
        {
            "name": "988 Suicide Crisis Helpline (Canada)",
            "country": "Canada",
            "service": "988 Suicide Crisis Helpline",
            "contact": "Call or Text 988 (Available 24/7 across Canada in English & French)",
            "number": "988",
            "link": "https://988.ca"
        },
        {
            "name": "NHS 111 Mental Health Option (England & United Kingdom)",
            "country": "England (United Kingdom)",
            "service": "NHS 111 Mental Health Services & Samaritans",
            "contact": "Call 111 and select the mental-health option (NHS 24/7 in England) or Call 116 123 (Samaritans)",
            "number": "111 / 116 123",
            "link": "https://www.nhs.uk/service-search/mental-health/find-an-urgent-mental-health-helpline"
        },
        {
            "name": "Lifeline Australia",
            "country": "Australia",
            "service": "Lifeline Australia",
            "contact": "Call 13 11 14 (Available 24/7 across Australia)",
            "number": "13 11 14",
            "link": "https://www.lifeline.org.au"
        },
        {
            "name": "Find A Helpline (Worldwide Directory)",
            "country": "International Directory",
            "service": "Find A Helpline (Country-Specific Directory)",
            "contact": "Directory of verified confidential crisis helplines in 130+ other countries",
            "number": "https://findahelpline.com",
            "link": "https://findahelpline.com"
        }
    ]

    return {
        "support_message": support_text,
        "emergency_alert": support_text,
        "india_helplines": india_helplines,
        "international_helplines": international_helplines,
        "helplines": india_helplines + international_helplines
    }

# ==============================================================================
# ENGINE 2: DIGITAL & SOCIAL LIFESTYLE INSIGHTS & WELLNESS GUIDANCE
# ==============================================================================

def analyze_lifestyle_patterns(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    ENGINE 2: Descriptive evaluation of digital screen habits, sleep architecture,
    and social connection. Does NOT predict depression; provides descriptive lifestyle insights.
    """
    if not isinstance(user_data, dict):
        raise ValueError(f"Expected dictionary for lifestyle analytics, received {type(user_data).__name__}")
    
    try:
        phone_hrs = float(user_data.get("daily_phone_hours", 5.0))
        if not (0.0 <= phone_hrs <= 24.0):
            raise ValueError(f"Daily phone screen time must be between 0 and 24 hours (got {phone_hrs})")
            
        social_hrs = float(user_data.get("daily_social_hours", 3.0))
        if not (0.0 <= social_hrs <= 24.0):
            raise ValueError(f"Daily social media usage must be between 0 and 24 hours (got {social_hrs})")
            
        sleep_qual = int(user_data.get("sleep_quality", 3))
        if not (1 <= sleep_qual <= 5):
            raise ValueError(f"Sleep quality rating must be between 1 and 5 (got {sleep_qual})")
            
        fatigue = int(user_data.get("daily_fatigue", 3))
        if not (1 <= fatigue <= 5):
            raise ValueError(f"Daily fatigue rating must be between 1 and 5 (got {fatigue})")
            
        notes = str(user_data.get("optional_notes", "") or "")
        if len(notes) > 5000:
            raise ValueError(f"Optional notes text exceeds maximum permitted length (5000 characters)")
    except (ValueError, TypeError) as e:
        if "must be between" in str(e):
            raise
        raise ValueError(f"Invalid numeric input in lifestyle analytics: {str(e)}")

    phone_bed = user_data.get("phone_before_bed", "Yes")
    social_comp = user_data.get("social_comparison", "Sometimes")
    loneliness = user_data.get("loneliness", "Sometimes")
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

RECOMMENDATION_CATEGORIES = [
    "Academic Wellbeing",
    "Sleep and Daily Routine",
    "Digital Wellbeing",
    "Physical Wellbeing",
    "Nutrition and Daily Habits",
    "Social Connection",
    "Financial and Academic Support",
    "Professional Support Resources"
]

def generate_educational_recommendations(
    user_data: Dict[str, Any],
    phq9_score: int,
    feedback_dict: Optional[Dict[str, str]] = None,
    dismissed_set: Optional[Set[str]] = None
) -> List[Dict[str, Any]]:
    """
    Generate transparent, rule-based, prioritized educational wellness suggestions based on
    available student survey responses, digital lifestyle rhythms, and psychometric screening.
    
    Educational and lifestyle guidance only; does not diagnose depression, prescribe medical treatment,
    or calculate clinical probabilities.
    
    Parameters:
        user_data: Dictionary of student survey & lifestyle responses.
        phq9_score: Standardized PHQ-9 aggregate screening score (0 to 27).
        feedback_dict: Optional active-session feedback mapping (e.g. {rec_id: "helpful" | "completed"}).
        dismissed_set: Optional active-session dismissed IDs to exclude.
        
    Returns:
        Deterministic, prioritized list of recommendation dictionaries.
    """
    if not isinstance(user_data, dict):
        user_data = {}
    if feedback_dict is None:
        feedback_dict = {}
    if dismissed_set is None:
        dismissed_set = set()

    recs: List[Dict[str, Any]] = []

    # --------------------------------------------------------------------------
    # CATEGORY 8: PROFESSIONAL SUPPORT RESOURCES (Highest Priority 1 & 2)
    # --------------------------------------------------------------------------
    has_self_harm_risk = bool(user_data.get("has_self_harm_risk", False))
    if has_self_harm_risk:
        # PATH B & C: Item 9 positive safety follow-up with clear immediate-danger guidance
        recs.append({
            "id": "prof_crisis_telemanas",
            "category": "Professional Support Resources",
            "icon": "💜",
            "title": "Access Supportive Helplines & Mental Health Guidance",
            "priority": "High",
            "priority_rank": 1,
            "reason": "Suggested because your questionnaire responses acknowledged thoughts of being better off dead or of hurting yourself.",
            "explanation": (
                "While experiencing these thoughts indicates emotional distress, an educational questionnaire cannot determine clinical urgency. "
                "Compassionate, trained counselors provide a supportive space to talk through painful emotions without judgment. "
                "If you or someone you know is in immediate life-threatening danger, please contact local emergency services immediately "
                "(112 in India, 988 or 911 in US/Canada, 111 or 999 in UK) or visit the nearest hospital emergency department."
            ),
            "action": (
                "Connect with Tele-MANAS at 14416 or 1800-89-14416 (India 24/7 Toll-Free), KIRAN at 1800-599-0019, or your national helpline. "
                "For immediate, life-threatening emergency danger, call 112 or local emergency services."
            ),
            "estimated_effort": "Available immediately",
            "is_contextual": True
        })

    if phq9_score >= 10:
        # PATH A: Standard clinical threshold consultation (non-crisis)
        recs.append({
            "id": "prof_counseling",
            "category": "Professional Support Resources",
            "icon": "🩺",
            "title": "Consult a Licensed Campus or Community Counselor for Assessment",
            "priority": "High",
            "priority_rank": 2 if has_self_harm_risk else 1,
            "reason": f"Suggested because your PHQ-9 screening score ({phq9_score}/27) reflects notable emotional strain crossing the recognized clinical assessment threshold (score >= 10).",
            "explanation": (
                "A score of 10 or higher on the PHQ-9 is a recognized clinical indicator that benefits from a professional assessment. "
                "This is not an emergency crisis alert, but an invitation to receive individualized guidance, academic accommodations, "
                "and evidence-based coping tools from a qualified counselor or healthcare provider."
            ),
            "action": "Contact your university counseling center or a local healthcare provider to schedule a routine, non-emergency appointment to discuss how you have been feeling.",
            "estimated_effort": "10–15 mins to schedule",
            "is_contextual": True
        })

    # --------------------------------------------------------------------------
    # CATEGORY 1: ACADEMIC WELLBEING (Priority 2 or 3)
    # --------------------------------------------------------------------------
    try:
        acad_pressure = float(user_data.get("Academic Pressure", 3.0))
    except (ValueError, TypeError):
        acad_pressure = 3.0
        
    try:
        study_sat = float(user_data.get("Study Satisfaction", 3.0))
    except (ValueError, TypeError):
        study_sat = 3.0

    try:
        work_study_hours = float(user_data.get("Work/Study Hours", 6.0))
    except (ValueError, TypeError):
        work_study_hours = 6.0

    if acad_pressure >= 3.5 or study_sat <= 2.5:
        recs.append({
            "id": "acad_chunking",
            "category": "Academic Wellbeing",
            "icon": "📚",
            "title": "Chunk Coursework into 25-Minute Focused Micro-Tasks",
            "priority": "High" if acad_pressure >= 4.0 else "Medium",
            "priority_rank": 3 if acad_pressure >= 4.0 else 4,
            "reason": f"Suggested because you reported elevated academic pressure ({acad_pressure:.1f}/5) or low study satisfaction ({study_sat:.1f}/5).",
            "explanation": "Large, unstructured academic workloads often trigger cognitive fatigue and task avoidance. Breaking study sessions into discrete, time-boxed milestones restores focus and relieves anxiety.",
            "action": "Select one assignment today. Set a timer for 25 focused minutes with phone notifications silenced, followed by a mandatory 5-minute cognitive rest away from screens.",
            "estimated_effort": "25–30 mins",
            "is_contextual": True
        })

    if work_study_hours >= 8.0:
        recs.append({
            "id": "acad_mentorship",
            "category": "Academic Wellbeing",
            "icon": "🎓",
            "title": "Utilize Faculty Office Hours & Peer Study Mentorship",
            "priority": "Medium",
            "priority_rank": 4,
            "reason": f"Suggested because your daily study commitment ({work_study_hours:.1f} hours) is high and may benefit from collaborative guidance.",
            "explanation": "Grappling with difficult course concepts in solitary isolation extends study hours unnecessarily. Clarifying doubts early with instructors or peers saves time and reduces burnout.",
            "action": "Prepare two specific questions on your most demanding course topic and attend your professor's next office hours or a peer tutoring session.",
            "estimated_effort": "15–20 mins",
            "is_contextual": True
        })

    # --------------------------------------------------------------------------
    # CATEGORY 2: SLEEP AND DAILY ROUTINE (Priority 3, 4 or 5)
    # --------------------------------------------------------------------------
    sleep_dur = user_data.get("Sleep Duration", "7-8 hours")
    phone_before_bed = user_data.get("phone_before_bed", "Yes")
    try:
        sleep_qual = int(user_data.get("sleep_quality", 3))
    except (ValueError, TypeError):
        sleep_qual = 3

    if sleep_dur in ["Less than 5 hours", "5-6 hours"] or phone_before_bed == "Yes" or sleep_qual <= 2:
        recs.append({
            "id": "sleep_winddown",
            "category": "Sleep and Daily Routine",
            "icon": "🌙",
            "title": "Establish a 45-Minute Screen-Free Wind-Down Buffer",
            "priority": "High" if sleep_dur in ["Less than 5 hours", "5-6 hours"] else "Medium",
            "priority_rank": 3 if sleep_dur in ["Less than 5 hours", "5-6 hours"] else 4,
            "reason": f"Suggested because you reported shorter sleep ({sleep_dur}) or browsing screens within 45 minutes of bedtime.",
            "explanation": "Short-wavelength blue light from device displays suppresses natural melatonin release, delaying restorative slow-wave sleep and compounding daytime exhaustion.",
            "action": "Put mobile devices across the room 45 minutes before sleep. Transition to a relaxing offline wind-down: read a physical book, listen to ambient audio, or do gentle stretches.",
            "estimated_effort": "Nightly habit (45 mins)",
            "is_contextual": True
        })
    else:
        recs.append({
            "id": "sleep_anchor",
            "category": "Sleep and Daily Routine",
            "icon": "✨",
            "title": "Anchor a Consistent Daily Wake-Up Time",
            "priority": "Low",
            "priority_rank": 5,
            "reason": f"Suggested as positive circadian reinforcement because your sleep duration ({sleep_dur}) meets healthy benchmarks.",
            "explanation": "Waking up at approximately the same time each morning (within 30 minutes) strengthens circadian rhythm stability, daytime alertness, and emotional resilience.",
            "action": "Set a consistent wake-up target for the upcoming 5 days to reinforce your natural circadian rhythm.",
            "estimated_effort": "Daily routine habit",
            "is_contextual": True
        })

    # --------------------------------------------------------------------------
    # CATEGORY 3: DIGITAL WELLBEING (Priority 3 or 4)
    # --------------------------------------------------------------------------
    try:
        phone_hours = float(user_data.get("daily_phone_hours", 5.0))
    except (ValueError, TypeError):
        phone_hours = 5.0

    try:
        social_hours = float(user_data.get("daily_social_hours", 3.0))
    except (ValueError, TypeError):
        social_hours = 3.0

    social_comp = user_data.get("social_comparison", "Sometimes")
    phone_interruption = user_data.get("phone_concentration_issue", "Frequently")

    if phone_hours >= 6.0 or social_hours >= 3.5 or phone_interruption in ["Frequently", "Almost Constantly"]:
        recs.append({
            "id": "digital_focus",
            "category": "Digital Wellbeing",
            "icon": "📱",
            "title": "Implement Phone-Free Focus Zones During Core Study",
            "priority": "High" if phone_hours >= 7.0 else "Medium",
            "priority_rank": 3 if phone_hours >= 7.0 else 4,
            "reason": f"Suggested because your daily phone engagement ({phone_hours:.1f} hrs) or study interruption frequency is elevated.",
            "explanation": "Frequent digital interruptions fragment working memory, causing attention residue that makes study tasks feel significantly harder and more exhausting.",
            "action": "Place your phone in 'Do Not Disturb' mode inside your bag or another room during your primary 60-minute study window today.",
            "estimated_effort": "1 hour study session",
            "is_contextual": True
        })

    if social_comp in ["Often", "Always"]:
        recs.append({
            "id": "digital_curate",
            "category": "Digital Wellbeing",
            "icon": "🛡️",
            "title": "Curate Feeds & Mute Comparison-Triggering Accounts",
            "priority": "Medium",
            "priority_rank": 4,
            "reason": f"Suggested because you noted that you {social_comp.lower()} compare yourself to others on social media.",
            "explanation": "Social feeds present curated, idealized snapshots of peer lives, fostering upward social comparison that quietly undermines self-worth and satisfaction.",
            "action": "Take 5 minutes today to mute or unfollow 3 accounts or topics that consistently leave you feeling inadequate or stressed.",
            "estimated_effort": "5 mins",
            "is_contextual": True
        })

    # --------------------------------------------------------------------------
    # CATEGORY 4: PHYSICAL WELLBEING (Priority 4)
    # --------------------------------------------------------------------------
    exercise_freq = user_data.get("exercise_frequency", "Moderate (1-2x/week)")
    try:
        outdoor_time = int(user_data.get("outdoor_time", 3))
    except (ValueError, TypeError):
        outdoor_time = 3

    try:
        fatigue = int(user_data.get("daily_fatigue", 3))
    except (ValueError, TypeError):
        fatigue = 3

    if exercise_freq in ["Never", "Rarely (1-2x/month)"] or outdoor_time <= 2 or fatigue >= 4:
        recs.append({
            "id": "phys_sunlight_walk",
            "category": "Physical Wellbeing",
            "icon": "🏃",
            "title": "Incorporate a 20-Minute Morning Sunlight Walk",
            "priority": "Medium",
            "priority_rank": 4,
            "reason": f"Suggested because you reported infrequent physical exercise ({exercise_freq}) or high daytime fatigue.",
            "explanation": "Moderate physical movement triggers neurotransmitter release that improves mood and mental clarity. Natural morning sunlight exposure synchronizes circadian rhythms.",
            "action": "Take a brisk 20-minute walk outdoors before noon without looking at your phone, letting your eyes take in natural ambient daylight.",
            "estimated_effort": "20 mins",
            "is_contextual": True
        })

    # --------------------------------------------------------------------------
    # CATEGORY 5: NUTRITION AND DAILY HABITS (Priority 4)
    # --------------------------------------------------------------------------
    diet_habits = user_data.get("Dietary Habits", "Moderate")
    if diet_habits in ["Moderate", "Unhealthy"] or fatigue >= 3:
        recs.append({
            "id": "nutri_steady_fuel",
            "category": "Nutrition and Daily Habits",
            "icon": "🥗",
            "title": "Fuel Study Blocks with Hydration and Steady-Energy Meals",
            "priority": "Medium",
            "priority_rank": 4,
            "reason": f"Suggested because you noted '{diet_habits}' dietary habits alongside afternoon fatigue.",
            "explanation": "Blood sugar volatility and mild dehydration impair working memory, concentration, and emotional stability during long study sessions.",
            "action": "Keep a water bottle at your workspace and pair studying with nutrient-dense snacks (such as nuts, whole fruit, or yogurt) rather than high-sugar energy drinks.",
            "estimated_effort": "5 mins prep",
            "is_contextual": True
        })

    # --------------------------------------------------------------------------
    # CATEGORY 6: SOCIAL CONNECTION (Priority 3 or 4)
    # --------------------------------------------------------------------------
    loneliness = user_data.get("loneliness", "Sometimes")
    try:
        social_support = int(user_data.get("social_support", 3))
    except (ValueError, TypeError):
        social_support = 3
    friends_interaction = user_data.get("friends_interaction", "2-3 times a week")

    if loneliness in ["Often", "Always"] or social_support <= 2 or friends_interaction in ["A few times a month", "Rarely / Never"]:
        recs.append({
            "id": "soc_peer_connection",
            "category": "Social Connection",
            "icon": "🤝",
            "title": "Schedule a 15-Minute Peer Connection or Campus Walk",
            "priority": "High" if loneliness in ["Often", "Always"] else "Medium",
            "priority_rank": 3 if loneliness in ["Often", "Always"] else 4,
            "reason": f"Suggested because you noted feeling lonely ({loneliness.lower()}) or having limited peer interactions.",
            "explanation": "Academic pressure often leads students to socially isolate, which inadvertently amplifies stress. Low-pressure, brief peer interactions provide grounding and perspective.",
            "action": "Reach out to a classmate or friend to share a quick 15-minute coffee or walk between study sessions this week.",
            "estimated_effort": "15 mins",
            "is_contextual": True
        })

    # --------------------------------------------------------------------------
    # CATEGORY 7: FINANCIAL AND ACADEMIC SUPPORT (Priority 3 or 4)
    # --------------------------------------------------------------------------
    try:
        fin_stress = float(user_data.get("Financial Stress", 3.0))
    except (ValueError, TypeError):
        fin_stress = 3.0

    if fin_stress >= 3.5:
        recs.append({
            "id": "fin_support_resources",
            "category": "Financial and Academic Support",
            "icon": "💡",
            "title": "Explore Campus Financial Aid & Student Concessions",
            "priority": "High" if fin_stress >= 4.5 else "Medium",
            "priority_rank": 3 if fin_stress >= 4.5 else 4,
            "reason": f"Suggested because your reported financial stress ({fin_stress:.1f}/5) is notably elevated.",
            "explanation": "Financial worry is a major driver of cognitive overload and academic strain. Many colleges maintain emergency aid funds, book-lending libraries, and work-study openings.",
            "action": "Check your university student portal or financial aid office for emergency relief grants, textbook assistance programs, or on-campus employment listings.",
            "estimated_effort": "15–20 mins",
            "is_contextual": True
        })

    # --------------------------------------------------------------------------
    # FOUNDATIONAL FALLBACK IF RECS LIST IS SPARSE (< 2)
    # --------------------------------------------------------------------------
    if len(recs) < 2:
        recs.append({
            "id": "acad_hourly_break",
            "category": "Academic Wellbeing",
            "icon": "☕",
            "title": "Incorporate Intentional 5-Minute Decompression Breaks",
            "priority": "Low",
            "priority_rank": 5,
            "reason": "Suggested as a foundational study hygiene practice for sustained focus.",
            "explanation": "Continuous studying without mental rest degrades information retention. Short, intentional cognitive pauses sustain memory consolidation.",
            "action": "After each 50 minutes of coursework, stand up, stretch, and step away from study materials for 5 minutes.",
            "estimated_effort": "5 mins",
            "is_contextual": False
        })
        recs.append({
            "id": "phys_hydration",
            "category": "Physical Wellbeing",
            "icon": "💧",
            "title": "Maintain Consistent Study-Session Hydration",
            "priority": "Low",
            "priority_rank": 5,
            "reason": "Suggested as a supportive daily physical wellness baseline.",
            "explanation": "Mild dehydration can elevate subjective fatigue and impair working memory speed during exam prep.",
            "action": "Keep fresh water at your study desk and aim to drink a glass before starting each new study session.",
            "estimated_effort": "2 mins",
            "is_contextual": False
        })

    # --------------------------------------------------------------------------
    # PERSONALIZATION & ACTIVE-SESSION FEEDBACK HANDLING
    # --------------------------------------------------------------------------
    seen_ids = set()
    deduped_recs: List[Dict[str, Any]] = []
    for r in recs:
        rid = r["id"]
        if rid not in seen_ids:
            seen_ids.add(rid)
            r["status"] = feedback_dict.get(rid, "active")
            if rid not in dismissed_set:
                deduped_recs.append(r)

    # Sort deterministically by priority rank then id
    deduped_recs.sort(key=lambda r: (r.get("priority_rank", 99), r.get("id", "")))

    return deduped_recs
