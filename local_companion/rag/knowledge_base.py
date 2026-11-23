"""
local_companion/rag/knowledge_base.py
Approved educational and wellbeing resource repository for Mindora 2.0.
Strictly grounded in verified public health sources and evidence-backed educational guidance.
Verification Date: 2026-11-15.
"""

from typing import List, Dict, Any

APPROVED_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    # India Resources
    {
        "id": "res_in_telemanas",
        "title": "Tele-MANAS (National Tele Mental Health Programme)",
        "country": "India",
        "category": "National Crisis Helplines",
        "source": "Ministry of Health and Family Welfare (MoHFW), Govt. of India / NIMHANS",
        "verification_date": "2026-11-15",
        "contact_number": "14416 / 1800-89-14416",
        "operational_hours": "24/7/365",
        "languages": "20+ regional Indian languages and English",
        "summary": "Free, confidential 24/7 national tele-mental health helpline established by the Government of India. Responders provide immediate psychological first aid, supportive counseling, and referrals to regional medical colleges or district mental health centres. It is completely free of cost and operates round-the-clock.",
        "keywords": ["india", "tele-manas", "telemanas", "mental health", "counseling", "mohfw", "nimhans", "14416", "1800-89-14416", "crisis", "free", "toll-free", "confidential", "psychological", "nodal", "center", "टेली-मानस", "टेलीमानस", "हेल्पलाइन", "मदद", "sahayata", "madad"]
    },
    {
        "id": "res_in_emergency",
        "title": "India National Emergency Services",
        "country": "India",
        "category": "Immediate Emergency Dispatch",
        "source": "Ministry of Home Affairs, Government of India (Emergency Response Support System)",
        "verification_date": "2026-11-15",
        "contact_number": "112",
        "operational_hours": "24/7/365",
        "languages": "All national & regional languages",
        "summary": "Unified national emergency dispatch number across India for police, fire, and medical/ambulance services. Dialing 112 is 100% free of charge from any Indian mobile phone or landline with zero balance. Use 112 for acute physical injuries, accidents, medical shock, or physical emergency medical treatment rather than mental counseling.",
        "keywords": ["india", "emergency", "dispatch", "police", "ambulance", "112", "danger", "life-threatening", "physical emergency", "medical treatment", "free", "cost", "mobile phone", "medical shock", "आपातकालीन"]
    },
    {
        "id": "res_in_kiran",
        "title": "KIRAN Mental Health Helpline",
        "country": "India",
        "category": "National Crisis Helplines",
        "source": "Department of Empowerment of Persons with Disabilities (DEPwD), Ministry of Social Justice and Empowerment",
        "verification_date": "2026-11-15",
        "contact_number": "1800-599-0019",
        "operational_hours": "24/7/365",
        "languages": "13 languages including Hindi, English, Tamil, Telugu, Marathi, Bengali",
        "summary": "Dedicated 24/7 toll-free helpline providing psychological support, stress management, anxiety relief, and mental health rehabilitation counseling.",
        "keywords": ["india", "kiran", "rehabilitation", "toll-free", "social justice", "1800-599-0019", "stress", "anxiety", "counseling", "किरण", "हेल्पलाइन", "मदद"]
    },
    {
        "id": "res_in_vandrevala",
        "title": "Vandrevala Foundation Mental Health Helpline",
        "country": "India",
        "category": "Specialized Support",
        "source": "Vandrevala Foundation for Mental Health",
        "verification_date": "2026-11-15",
        "contact_number": "+91 9999 666 555",
        "operational_hours": "24/7/365",
        "languages": "English, Hindi, and regional languages",
        "summary": "Non-profit mental health foundation offering round-the-clock free counseling by clinical psychologists and trained mental health counselors.",
        "keywords": ["india", "vandrevala", "counseling", "psychologist", "9999 666 555", "9999666555", "free", "non-profit", "foundation"]
    },

    # United States Resources
    {
        "id": "res_us_988",
        "title": "988 Suicide & Crisis Lifeline",
        "country": "United States",
        "category": "National Crisis Helplines",
        "source": "SAMHSA (Substance Abuse and Mental Health Services Administration) / Vibrant Emotional Health",
        "verification_date": "2026-11-15",
        "contact_number": "Call or Text 988",
        "operational_hours": "24/7/365",
        "languages": "English, Spanish, and 240+ languages via translation services",
        "summary": "Nationwide 24/7 confidential lifeline connecting individuals experiencing suicidal crisis, mental health distress, or emotional pain with trained crisis counselors. Free and accessible by call or text across the United States.",
        "keywords": ["united states", "usa", "us", "988", "suicide", "crisis", "lifeline", "samhsa", "call", "text", "emotional support"]
    },
    {
        "id": "res_us_911",
        "title": "United States Emergency Dispatch",
        "country": "United States",
        "category": "Immediate Emergency Dispatch",
        "source": "National 911 Program / Federal Communications Commission (FCC)",
        "verification_date": "2026-11-15",
        "contact_number": "911",
        "operational_hours": "24/7/365",
        "languages": "English, Spanish, and multi-lingual operator dispatch",
        "summary": "Unified national emergency dispatch across the US for fire, police, and emergency medical technicians (EMTs). Call 911 when there is immediate physical danger, acute physical danger, medical shock, severe trauma, or life-threatening situations rather than using a text line.",
        "keywords": ["united states", "usa", "us", "emergency", "dispatch", "police", "ambulance", "911", "danger", "acute physical danger", "medical shock", "paramedics"]
    },
    {
        "id": "res_us_text_line",
        "title": "Crisis Text Line",
        "country": "United States",
        "category": "Text & Digital Support",
        "source": "Crisis Text Line Organization",
        "verification_date": "2026-11-15",
        "contact_number": "Text HOME to 741741",
        "operational_hours": "24/7/365",
        "languages": "English and Spanish",
        "summary": "Free, confidential 24/7 text-messaging service for emotional support and crisis counseling. Trained volunteer crisis counselors support students facing anxiety, overwhelm, depression, or distress via SMS. Text HOME to 741741 to connect instantly.",
        "keywords": ["united states", "usa", "us", "crisis text line", "text", "sms", "741741", "home", "anxiety", "youth", "text line"]
    },
    {
        "id": "res_us_trevor",
        "title": "The Trevor Project",
        "country": "United States",
        "category": "Specialized Support",
        "source": "The Trevor Project",
        "verification_date": "2026-11-15",
        "contact_number": "Call 1-866-488-7386 or Text START to 678-678",
        "operational_hours": "24/7/365",
        "languages": "English and Spanish",
        "summary": "Leading national non-profit organization providing 24/7 crisis intervention and suicide prevention services to LGBTQ+ young people, students, and youth up to age 25 via phone and text.",
        "keywords": ["united states", "usa", "us", "trevor project", "lgbtq", "youth", "1-866-488-7386", "678-678", "678678", "identity", "queer"]
    },

    # Canada Resources
    {
        "id": "res_ca_988",
        "title": "988 Suicide Crisis Helpline Canada",
        "country": "Canada",
        "category": "National Crisis Helplines",
        "source": "Public Health Agency of Canada (PHAC) / Centre for Addiction and Mental Health (CAMH)",
        "verification_date": "2026-11-15",
        "contact_number": "Call or Text 988",
        "operational_hours": "24/7/365",
        "languages": "English and French nationwide",
        "summary": "Bilingual national 24/7 suicide prevention helpline for anyone in Canada considering suicide or worried about someone. Free, confidential phone and text support.",
        "keywords": ["canada", "canadian", "988", "camh", "phac", "suicide", "bilingual", "french", "english", "call", "text"]
    },
    {
        "id": "res_ca_911",
        "title": "Canada Emergency Services",
        "country": "Canada",
        "category": "Immediate Emergency Dispatch",
        "source": "Public Safety Canada",
        "verification_date": "2026-11-15",
        "contact_number": "911",
        "operational_hours": "24/7/365",
        "languages": "English and French",
        "summary": "General emergency dispatch across all Canadian provinces and territories for ambulance, paramedic, police, and fire rescue.",
        "keywords": ["canada", "emergency", "dispatch", "paramedic", "911", "ambulance", "danger"]
    },
    {
        "id": "res_ca_kidshelp",
        "title": "Kids Help Phone (Youth & Students)",
        "country": "Canada",
        "category": "Campus & Student Support",
        "source": "Kids Help Phone",
        "verification_date": "2026-11-15",
        "contact_number": "Call 1-800-668-6868 or Text 686868",
        "operational_hours": "24/7/365",
        "languages": "English and French",
        "summary": "Canada's only 24/7 national e-mental health service offering free, confidential support for young people, high schoolers, and post-secondary college students.",
        "keywords": ["canada", "kids help phone", "youth", "students", "college", "university", "1-800-668-6868", "686868"]
    },
    {
        "id": "res_ca_indigenous",
        "title": "Hope for Wellness Help Line",
        "country": "Canada",
        "category": "Specialized Support",
        "source": "Indigenous Services Canada",
        "verification_date": "2026-11-15",
        "contact_number": "1-855-242-3310 / Online chat at hopeforwellness.ca",
        "operational_hours": "24/7/365",
        "languages": "English, French, Cree, Ojibway, Inuktitut (upon request)",
        "summary": "24/7 culturally grounded mental health counseling and crisis intervention available to all Indigenous people across Canada. Call toll-free 1-855-242-3310 or access chat online.",
        "keywords": ["canada", "indigenous", "first nations", "inuit", "metis", "hope for wellness", "1-855-242-3310", "culturally grounded"]
    },

    # United Kingdom Resources
    {
        "id": "res_uk_111",
        "title": "NHS 111 Mental Health Services",
        "country": "United Kingdom",
        "category": "National Crisis Helplines",
        "source": "National Health Service (NHS England, NHS 24 Scotland, NHS 111 Wales)",
        "verification_date": "2026-11-15",
        "contact_number": "111",
        "operational_hours": "24/7/365",
        "languages": "English, Welsh, and telephone interpreting services",
        "summary": "Non-emergency medical and mental health service. In England, Scotland, and Wales, dialing 111 and selecting the mental health option connects callers to local NHS crisis resolution teams and specialized psychiatric nurses.",
        "keywords": ["united kingdom", "uk", "nhs", "111", "england", "scotland", "wales", "nurse", "mental health", "non-emergency"]
    },
    {
        "id": "res_uk_999",
        "title": "United Kingdom Emergency Services",
        "country": "United Kingdom",
        "category": "Immediate Emergency Dispatch",
        "source": "UK Home Office & NHS Ambulance Services",
        "verification_date": "2026-11-15",
        "contact_number": "999 or 112",
        "operational_hours": "24/7/365",
        "languages": "English and operator translation",
        "summary": "Primary emergency dispatch number across the UK for immediate life-threatening medical emergencies, police, fire, or acute crisis situations. 112 is also recognized in the UK alongside 999.",
        "keywords": ["united kingdom", "uk", "emergency", "dispatch", "police", "ambulance", "999", "112", "danger"]
    },
    {
        "id": "res_uk_samaritans",
        "title": "Samaritans UK & ROI",
        "country": "United Kingdom",
        "category": "National Crisis Helplines",
        "source": "Samaritans Charity (Registered in England, Wales, Scotland)",
        "verification_date": "2026-11-15",
        "contact_number": "116 123",
        "operational_hours": "24/7/365",
        "languages": "English and Welsh",
        "summary": "Free, confidential listening service available 24 hours a day, 365 days a year for anyone struggling to cope, lonely, or feeling overwhelmed. Call 116 123 free from any phone.",
        "keywords": ["united kingdom", "uk", "samaritans", "116 123", "116123", "listening", "loneliness", "emotional support"]
    },
    {
        "id": "res_uk_lifeline_ni",
        "title": "Lifeline Northern Ireland",
        "country": "United Kingdom",
        "category": "National Crisis Helplines",
        "source": "Public Health Agency Northern Ireland (HSC Trust)",
        "verification_date": "2026-11-15",
        "contact_number": "0808 808 8000",
        "operational_hours": "24/7/365",
        "languages": "English and regional services",
        "summary": "Northern Ireland's regional crisis response service. Call 0808 808 8000 free 24/7. Note: NHS 111 mental health pathway does not operate in Northern Ireland; students in NI should contact Lifeline NI directly or visit their local HSC Emergency Department.",
        "keywords": ["united kingdom", "uk", "northern ireland", "ni", "lifeline", "belfast", "0808 808 8000", "08088088000", "hsc", "crisis", "regional"]
    },
    {
        "id": "res_uk_shout",
        "title": "Shout 85258 Crisis Text Service",
        "country": "United Kingdom",
        "category": "Text & Digital Support",
        "source": "Mental Health Innovations Charity",
        "verification_date": "2026-11-15",
        "contact_number": "Text SHOUT to 85258",
        "operational_hours": "24/7/365",
        "languages": "English",
        "summary": "Free, confidential 24/7 text messaging support service in the UK for anyone in distress, experiencing anxiety, grief, depression, or suicidal feelings. Text SHOUT to 85258 to connect with trained volunteers.",
        "keywords": ["united kingdom", "uk", "shout", "85258", "text", "sms", "anxiety", "distress", "text service"]
    },

    # Australia Resources
    {
        "id": "res_au_lifeline",
        "title": "Lifeline Australia",
        "country": "Australia",
        "category": "National Crisis Helplines",
        "source": "Lifeline Australia Organization / Australian Department of Health",
        "verification_date": "2026-11-15",
        "contact_number": "13 11 14 / Text 0477 13 11 14",
        "operational_hours": "24/7/365",
        "languages": "English and translating service (TIS 131 450)",
        "summary": "National 24/7 crisis support and suicide prevention service providing all Australians experiencing emotional distress with immediate access to compassionate crisis support. Call 13 11 14 or text 0477 13 11 14.",
        "keywords": ["australia", "lifeline", "13 11 14", "131114", "suicide prevention", "crisis", "text", "0477131114"]
    },
    {
        "id": "res_au_000",
        "title": "Australia Triple Zero Emergency Dispatch",
        "country": "Australia",
        "category": "Immediate Emergency Dispatch",
        "source": "Australian Government / Telstra Emergency Call Service",
        "verification_date": "2026-11-15",
        "contact_number": "000",
        "operational_hours": "24/7/365",
        "languages": "English and Emergency translation services",
        "summary": "Australia's primary national emergency number for police, ambulance, and fire services. Call 000 (Triple Zero) when life or safety is in acute immediate danger.",
        "keywords": ["australia", "emergency", "dispatch", "triple zero", "triple", "zero", "000", "police", "ambulance", "danger"]
    },
    {
        "id": "res_au_beyondblue",
        "title": "Beyond Blue Support Service",
        "country": "Australia",
        "category": "National Crisis Helplines",
        "source": "Beyond Blue Ltd / Australian Government Mental Health Initiatives",
        "verification_date": "2026-11-15",
        "contact_number": "1300 22 4636 / Online webchat",
        "operational_hours": "24/7/365",
        "languages": "English",
        "summary": "Provides free 24/7 telephone counseling, web chat, and moderated peer community forums for anxiety, depression, and collegiate mental health challenges. Call 1300 22 4636.",
        "keywords": ["australia", "beyond blue", "beyondblue", "1300 22 4636", "1300224636", "depression", "anxiety", "wellbeing", "counseling"]
    },
    {
        "id": "res_au_kidshelpline",
        "title": "Kids Helpline Australia (Ages 5-25)",
        "country": "Australia",
        "category": "Campus & Student Support",
        "source": "yourtown Charity Organization",
        "verification_date": "2026-11-15",
        "contact_number": "1800 55 1800 / WebChat",
        "operational_hours": "24/7/365",
        "languages": "English",
        "summary": "Free, private, and confidential 24/7 phone and online counseling service specifically tailored for children, teens, and young adults up to age 25.",
        "keywords": ["australia", "kids helpline", "youth", "students", "young adult", "1800 55 1800", "webchat"]
    },

    # International Resources
    {
        "id": "res_intl_befrienders",
        "title": "Befrienders Worldwide",
        "country": "International",
        "category": "International & Global Directories",
        "source": "Befrienders Worldwide International Charity (UK Charity No. 1092827)",
        "verification_date": "2026-11-15",
        "contact_number": "Directory at befrienders.org",
        "operational_hours": "24/7 directory of volunteer centers",
        "languages": "Multi-lingual network across 32 countries",
        "summary": "Global network of crisis centers providing free, non-judgmental listening support to anyone in psychological distress or considering suicide worldwide.",
        "keywords": ["international", "global", "befrienders", "worldwide", "volunteer", "listening", "directory"]
    },
    {
        "id": "res_intl_iasp",
        "title": "IASP Global Crisis Centres Directory",
        "country": "International",
        "category": "International & Global Directories",
        "source": "International Association for Suicide Prevention (IASP) / Official WHO Partner",
        "verification_date": "2026-11-15",
        "contact_number": "Directory at iasp.info/resources/Crisis_Centres",
        "operational_hours": "Online international database",
        "languages": "International coverage across Europe, Asia, Americas, Africa, Oceania",
        "summary": "Comprehensive, verified global directory of suicide prevention helplines and crisis intervention services in official partnership with the World Health Organization.",
        "keywords": ["international", "global", "iasp", "who", "suicide prevention", "directory", "crisis centres"]
    },
    {
        "id": "res_intl_findahelpline",
        "title": "Find A Helpline (Global Verified Search)",
        "country": "International",
        "category": "International & Global Directories",
        "source": "ThroughLine Organization (Free & Confidential Crisis Support Index)",
        "verification_date": "2026-11-15",
        "contact_number": "Directory at findahelpline.com",
        "operational_hours": "Online search engine covering 140+ countries",
        "languages": "Local languages in 140+ jurisdictions",
        "summary": "Free, open-access international directory enabling students worldwide to find verified free, confidential helplines, hotlines, and web chats in their exact location.",
        "keywords": ["international", "global", "find a helpline", "hotlines", "directory", "search"]
    },

    # Approved Educational Guidance (Sleep, Study, Nutrition, Campus Navigation)
    {
        "id": "edu_sleep_hygiene",
        "title": "Evidence-Based Sleep Hygiene for College Students",
        "country": "Global",
        "category": "Educational Guidelines",
        "source": "American Academy of Sleep Medicine (AASM) & Collegiate Restorative Health Guidelines",
        "verification_date": "2026-11-15",
        "contact_number": "N/A (Self-Care Guidance)",
        "operational_hours": "Informational",
        "languages": "English and Hindi",
        "summary": "Students require 7 to 8 hours of restorative sleep nightly for memory consolidation and emotional regulation. Key practices include: maintaining consistent sleep and wake times even on weekends; limiting high caffeine intake within 6 hours of bedtime; reducing blue-light exposure 45 minutes before sleep; and maintaining a cool, dark, quiet sleep sanctuary. Chronic sleep debt under 5 hours elevates cognitive friction and impairs stress tolerance. Pulling an all-nighter before a final exam degrades memory retrieval and reaction time rather than improving performance.",
        "keywords": ["sleep", "hygiene", "rest", "circadian", "bedtime", "caffeine", "hours", "sleep debt", "insomnia", "tired", "all-nighter", "all nighter", "cognitive performance", "sleep deprivation", "exam", "sanctuary", "wake", "weekends", "aasm", "memory", "neend", "sona", "ghante", "thakan", "नींद", "सोना", "सोने", "कैफीन", "छात्र", "छात्रों", "घंटे", "आराम", "सलाह"]
    },
    {
        "id": "edu_study_workload",
        "title": "Sustainable Academic Workload & Pacing Strategies",
        "country": "Global",
        "category": "Educational Guidelines",
        "source": "Cognitive Science of Learning & University Academic Counseling Protocols",
        "verification_date": "2026-11-15",
        "contact_number": "N/A (Study Guidance)",
        "operational_hours": "Informational",
        "languages": "English and Hindi",
        "summary": "Balancing study load between 6.0 and 8.0 hours daily prevents cognitive exhaustion. Recommended methods include: distributed practice (spacing study sessions over multiple days instead of marathon all-night cramming); the Pomodoro technique (25 minutes focused study, 5 minutes physical break); scheduling non-negotiable recovery blocks; creating daily micro-steps for routine consistency; setting clear boundaries between study spaces and relaxation areas; and avoiding skipping meals or sleep for midterms. Exam anxiety and academic burnout are common responses to overwork, alleviated through structured pacing rather than extreme study marathons. Uninterrupted 6-hour marathon blocks cause severe cognitive fatigue and diminish study satisfaction.",
        "keywords": ["study", "workload", "hours", "academic pressure", "pomodoro", "cramming", "exam", "burnout", "burned", "burned out", "burned-out", "schedule", "session", "sessions", "12-hour", "study breaks", "exam preparation", "marathon study", "study satisfaction", "heavy coursework", "micro-steps", "routine consistency", "skip meals", "midterms", "pacing", "exam anxiety", "test anxiety", "study anxiety", "academic burnout", "padhai", "pariksha", "tanaav", "पढ़ाई", "परीक्षा", "तनाव", "छात्र", "छात्रों", "ब्रेक"]
    },
    {
        "id": "edu_dietary_regularity",
        "title": "Nutritional Regularity & Mood Stability in Higher Education",
        "country": "Global",
        "category": "Educational Guidelines",
        "source": "Student Health & Wellness Nutritional Guidelines",
        "verification_date": "2026-11-15",
        "contact_number": "N/A (Nutritional Guidance)",
        "operational_hours": "Informational",
        "languages": "English",
        "summary": "Consistent meal timing and regular hydration stabilize blood glucose levels, preventing executive fatigue, irritability, and energy crashes. Swapping ultra-processed high-sugar snacks for complex carbohydrates, protein, nuts, and fresh fruit helps maintain sustained mental stamina during intensive study blocks.",
        "keywords": ["nutrition", "diet", "meals", "food", "hydration", "glucose", "energy", "snacks", "brain food", "blood sugar", "stamina"]
    },
    {
        "id": "edu_campus_navigation",
        "title": "Navigating University Counseling & Health Centers",
        "country": "Global",
        "category": "Educational Guidelines",
        "source": "Association for University and College Counseling Center Directors (AUCCCD)",
        "verification_date": "2026-11-15",
        "contact_number": "Visit your local campus student health portal",
        "operational_hours": "Typical academic business hours",
        "languages": "English, Hindi, and university regional services",
        "summary": "Most universities provide free, confidential short-term counseling, group therapy workshops, and academic accommodations for enrolled students. Common student experiences include homesickness, loneliness, social isolation, imposter syndrome, and difficulty adjusting to university life. Intake appointments provide supportive guidance on adjusting to college, managing transitions, and finding peer support communities. Visits do not appear on academic transcripts. Students do not need to be in acute crisis to benefit from university counseling center services.",
        "keywords": ["campus", "university", "college", "counseling center", "therapist", "intake", "student health", "peer support", "transcripts", "academic accommodations", "emotional support", "homesick", "homesickness", "lonely", "loneliness", "isolated", "isolation", "alone", "no friends", "imposter", "impostor", "imposter syndrome", "adjusting", "adjustment", "transition", "freshman", "university life", "fitting in", "akelepan", "अकेलापन", "काउंसलिंग", "विश्वविद्यालय"]
    }
]
