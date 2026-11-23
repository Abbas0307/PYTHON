"""
local_companion/model_runtime/safety_guard.py
Deterministic Safety Guard for the Mindora 2.0 Local AI Companion.
Enforces multi-layer safety deterministically (< 5ms) before and after LLM invocation:
1. Strict Category A assessment privacy protection (rejects sensitive fields).
2. Direct personal crisis detection (English & transliterated Hindi/Hinglish).
3. Third-person peer crisis concern detection.
4. Ambiguous / sub-threshold risk detection.
5. Educational inquiry exception (prevents false positives on resource questions).
6. Deterministic non-diagnostic boundaries (blocks diagnostic/medication requests).
"""

import re
from typing import Dict, Any, Optional, Tuple

# 1. Direct Personal Intent Crisis Patterns (English + Hinglish/Hindi transliteration + Devanagari Hindi)
DIRECT_CRISIS_PATTERNS = [
    # English direct intent
    r"\b(want\s+to\s+kill\s+(my|one)?self|end\s+my\s+life|want\s+to\s+die|better\s+off\s+dead)\b",
    r"\b(feel\s+suicidal|am\s+suicidal|feeling\s+suicidal|suicidal\s+thoughts|thinking\s+(of|about)\s+suicide|thoughts\s+of\s+suicide|plan\s+to\s+commit\s+suicide|commit\s+suicide)\b",
    r"\b(hurt(ing)?\s+(my|one)?self|harm(ing)?\s+(my|one)?self|self[\s-]harm(ing)?|cutting\s+(my|one)?self|slitting\s+(my|one)?wrist|overdos\w*)\b",
    r"\b(hanging\s+(my|one)?self|jump(ing)?\s+off|shoot(ing)?\s+(my|one)?self)\b",
    r"\b(no\s+reason\s+to\s+live|give\s+up\s+on\s+life|can'?t\s+go\s+on\s+anymore|thoughts\s+of\s+(hurt|harm|dying))\b",
    
    # Hindi / Hinglish Transliterated Personal Intent
    r"\b(mujhe|mera|mujhko|humko)\s+.*?\b(marne\s+ka\s+(man|mann|dil)|suicide\s+karne\s+ka\s+(man|mann))\b",
    r"\b(mar\s+ja(na|ana|unga|ungi|un))\s*(chahta|chahti|hai|h)?\b",
    r"\b(jaan\s+de\s+(dunga|doongi|dena)|jaan\s+le\s+(lunga|loongi|leni))\b",
    r"\b(jeene\s+ka\s+(man|mann|dil)\s+nah?i|jeena\s+nah?i\s+(chahta|chahti))\b",
    r"\b(apne\s+aap\s+ko|khud\s+ko)\s+(mar|khatam|hurt|harm|nuksan|chot)\b",
    r"\b(khudkushi|khudkhushi|aatmhatya|atmahathya|aatmahatya|suicide)\s*(karna|karne|karu)\b",
    r"\b(koi\s+bacha\s+lo|bachao\s+mar\s+jaunga|mar\s+raha\s+hoon)\b",
    r"\b(zindagi\s+se\s+tang\s+aa\s+gaya|zindagi\s+khatam\s+karni)\b",

    # Devanagari Hindi Direct Intent (हिन्दी)
    r"(मरने\s*का\s*(मन|दिल|ख्याल)|आत्महत्या|आत्मघात)",
    r"(जान\s*(देने|दे\s*(दूंगा|दूँगी|देना)|लेने|ले\s*(लूंगा|लूँगी|लेनी)))",
    r"(जीने\s*का\s*(कोई\s*)?(मन|दिल|मतलब)\s*नहीं|जीना\s*नहीं\s*(चाहता|चाहती))",
    r"(खुद\s*को\s*(खत्म|नुकसान|मारने|मार|चोट))",
    r"(खुदकुशी|खुदकशी)\s*(करना|करने|करूँ)?",
    r"(मुझे\s*मरना\s*है|मर\s*जाऊंगा|मर\s*जाऊंगी|मरना\s*चाहता\s*हूँ|मरना\s*चाहती\s*हूँ)",
    r"(जिंदगी\s*खत्म\s*करनी\s*है|कोई\s*बचा\s*लो|बचाओ\s*मर\s*जाऊंगा)"
]

# 2. Third-person Crisis Concerns (e.g. friend/roommate in danger)
THIRD_PERSON_CRISIS_PATTERNS = [
    r"\b(my\s+friend|my\s+roommate|someone\s+i\s+know|mera\s+dost|meri\s+saheli)\s+.*?\b(wants\s+to\s+(die|kill|end)|is\s+suicidal|talking\s+about\s+(?:committing\s+)?(suicide|dying|ending\s+(his|her|their|one's)?\s*life)|marne\s+ki\s+baat|suicide\s*(karega|karegi|karna))\b",
    r"\b(help\s+my\s+friend\s+who\s+is\s+suicidal|friend\s+is\s+thinking\s+about\s+suicide)\b",
    # Devanagari Third Person
    r"(मेरा\s+दोस्त|मेरी\s+सहेली|मेरी\s+रूममेट|कोई\s+जानने\s+वाला)\s+.*?(मरने\s*की\s*बात|आत्महत्या|जान\s*देने|खुद\s*को\s*मारने|खुदकुशी)",
    r"(मदद\s*करो\s*मेरा\s*दोस्त\s*आत्महत्या|दोस्त\s*मरना\s*चाहता)"
]

# 3. Ambiguous Sub-threshold Personal Risk Expressions
AMBIGUOUS_RISK_PATTERNS = [
    r"\b(disappear\s+forever\s+and\s+never\s+wake\s+up)\b",
    r"\b(better\s+off\s+without\s+me)\b",
    r"\b(what\s+if\s+i\s+just\s+wasn'?t\s+here\s+anymore)\b",
    r"(हमेशा\s*के\s*लिए\s*गायब\s*हो\s*जाना|मेरे\s*बिना\s*सब\s*बेहतर\s*होंगे|अगर\s*मैं\s*यहाँ\s*न\s*रहूँ)"
]

# 4. Negation Patterns (User explicitly stating they are NOT in crisis)
NEGATION_PATTERNS = [
    r"\b(not|don'?t|do\s+not|never)\s+(want\s+to\s+(die|kill|harm|hurt)|suicidal|having\s+suicidal\s+thoughts|think\s+of\s+suicide)\b",
    r"\b(nah?i|nhi)\s+(marna|marne|khudkushi|suicide\s+karna)\b",
    r"(मरना\s*नहीं\s*(चाहता|चाहती|है)|आत्महत्या\s*नहीं\s*करना|खुदकुशी\s*नहीं)"
]

# 5. Informational / Educational Resource Questions mentioning crisis terms
INFORMATIONAL_RESOURCE_PATTERNS = [
    r"\b(what\s+is|how\s+does|explain|tell\s+me\s+about|information\s+about|who\s+operates|history\s+of|can\s+you\s+explain)\s+.*\b(988|lifeline|tele-manas|kiran|crisis\s+text\s+line|trevor|samaritans|shout|beyond\s+blue|suicide\s+prevention)\b",
    r"\b(what\s+is\s+(the\s+)?(988\s+)?suicide\s+(and\s+crisis\s+)?(lifeline|helpline))\b",
    r"\b(how\s+does\s+(the\s+)?(988\s+)?suicide\s+(and\s+crisis\s+)?(lifeline|helpline)\s+work)\b",
    r"\b(can\s+you\s+explain\s+what\s+lifeline\s+australia\s+does)\b",
    r"(टेली-मानस\s*(क्या\s*है|का\s*(हेल्पलाइन\s*)?नंबर|के\s*बारे\s*में)|किरण\s*(हेल्पलाइन|नंबर|क्या\s*है))",
    r"(टेलीमानस\s*(क्या\s*है|का\s*नंबर)|tele-manas\s*kya\s*hai|kiran\s*helpline\s*kya\s*hai)"
]

# Clinical / Diagnostic / Medication inquiry patterns
DIAGNOSTIC_PATTERNS = [
    r"\b(diagnos(e|is|ing)|do\s+i\s+have\s+(depression|bipolar|anxiety|adhd|ptsd|ocd|schizophrenia|clinical\s+depression))\b",
    r"\b(prescrib(e|tion|ing)|what\s+antidepressant|prozac|zoloft|lexapro|sertraline|adderall|ritalin|xanax|ssri|ssris)\b",
    r"\b(medication\s+(dosage|dose|recommendation)|medicine\s+(dosage|dose)|what\s+dose\s+of|sleeping\s+pills?|sleeping\s+tablets?)\b",
    r"\b(should\s+i\s+take\s+(pills|medicine|medication|antidepressants)|side\s+effects\s+of\s+(antidepressants|medication|pills))\b",
    r"\b(score\s+my\s+phq|interpret\s+my\s+phq|what\s+is\s+my\s+risk\s+percentage|clinical\s+diagnosis|psychiatric\s+evaluation)\b",
    r"\b(can\s+you\s+diagnose\s+why\s+i\s+have|diagnose\s+my\s+symptoms|medical\s+diagnosis)\b"
]

# Sensitive assessment field keys that must NEVER be accepted
PROHIBITED_PAYLOAD_KEYS = {
    "phq", "phq9", "phq_responses", "item9", "item_9", "suicidal_thoughts",
    "depression_probability", "depression_score", "cgpa", "academic_pressure",
    "student_id", "email", "name"
}

class SafetyGuard:
    def __init__(self):
        self.direct_crisis_regex = re.compile("|".join(DIRECT_CRISIS_PATTERNS), re.IGNORECASE)
        self.third_person_regex = re.compile("|".join(THIRD_PERSON_CRISIS_PATTERNS), re.IGNORECASE)
        self.ambiguous_risk_regex = re.compile("|".join(AMBIGUOUS_RISK_PATTERNS), re.IGNORECASE)
        self.negation_regex = re.compile("|".join(NEGATION_PATTERNS), re.IGNORECASE)
        self.informational_regex = re.compile("|".join(INFORMATIONAL_RESOURCE_PATTERNS), re.IGNORECASE)
        self.diagnostic_regex = re.compile("|".join(DIAGNOSTIC_PATTERNS), re.IGNORECASE)

    def check_payload_privacy(self, payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Verify that the request contains zero personal assessment state."""
        for key in payload.keys():
            normalized = key.lower().replace("-", "_")
            if normalized in PROHIBITED_PAYLOAD_KEYS:
                return False, f"Prohibited assessment or sensitive key '{key}' detected. Mindora strictly protects assessment privacy."
        return True, None

    def _resolve_contacts(self, country: str) -> Tuple[str, str]:
        """Resolve localized helpline and emergency contacts."""
        selected_country = country or "India"
        if selected_country == "United States":
            return "988 (Suicide & Crisis Lifeline)", "911 (Emergency Dispatch)"
        elif selected_country == "Canada":
            return "988 (Suicide Crisis Helpline)", "911 (Emergency Dispatch)"
        elif selected_country == "United Kingdom":
            return "111 (NHS Mental Health) / 116 123 (Samaritans)", "999 (Emergency Dispatch)"
        elif selected_country == "Australia":
            return "13 11 14 (Lifeline Australia)", "000 (Emergency Dispatch)"
        elif selected_country == "International":
            return "befrienders.org / iasp.info/resources/Crisis_Centres", "Local Emergency Services"
        return "14416 / 1800-89-14416 (Tele-MANAS)", "112 (National Emergency Services)"

    def check_crisis(self, text: str, country: Optional[str] = "India") -> Optional[Dict[str, Any]]:
        """
        Deterministic Crisis Interceptor.
        Evaluates text across direct personal intent, third-person concerns, and ambiguous risk.
        Filters out explicit negations and informational educational queries.
        Returns immediate verified crisis emergency contacts.
        """
        clean_text = text.strip()
        selected_country = country or "India"
        helpline, emergency = self._resolve_contacts(selected_country)

        # Step A: Check if query is an informational/educational question about a resource
        if self.informational_regex.search(clean_text):
            # This is an educational question seeking knowledge about a verified service.
            # Do NOT intercept; allow grounded retrieval to explain the service.
            return None

        # Step B: Check for explicit negation
        if self.negation_regex.search(clean_text):
            # User explicitly stating they are not suicidal or do not want to die.
            return None

        # Step C: Direct Personal Intent (English & Transliterated Hindi/Hinglish)
        if self.direct_crisis_regex.search(clean_text):
            return {
                "is_crisis": True,
                "crisis_type": "direct_personal_intent",
                "bypassed_llm": True,
                "country": selected_country,
                "message": (
                    "⚠️ IMMEDIATE SAFETY SAFEGUARD ACTIVATED:\n"
                    "If you are feeling overwhelmed, having thoughts of harming yourself, or need immediate support, "
                    "please know that you are not alone and compassionate help is available 24/7.\n\n"
                    f"• Primary Crisis Helpline ({selected_country}): {helpline}\n"
                    f"• Immediate Emergency Dispatch: {emergency}\n\n"
                    "These services are free, confidential, and available right now. "
                    "Mindora's AI does not make safety assessments. Please connect directly with human responders."
                ),
                "contacts": {
                    "primary_helpline": helpline,
                    "emergency_dispatch": emergency
                }
            }

        # Step D: Third-Person Concern (Friend / Roommate)
        if self.third_person_regex.search(clean_text):
            return {
                "is_crisis": True,
                "crisis_type": "third_person_concern",
                "bypassed_llm": True,
                "country": selected_country,
                "message": (
                    "⚠️ SUPPORTIVE PEER CRISIS SAFEGUARD:\n"
                    "If a friend, roommate, or peer is in distress or expressing thoughts of self-harm, "
                    "immediate compassionate support and guidance are available 24/7:\n\n"
                    f"• Primary Crisis Helpline ({selected_country}): {helpline}\n"
                    f"• Immediate Emergency Dispatch: {emergency}\n\n"
                    "Please encourage them to speak with a crisis counselor, or contact campus emergency services if they are in immediate danger."
                ),
                "contacts": {
                    "primary_helpline": helpline,
                    "emergency_dispatch": emergency
                }
            }

        # Step E: Ambiguous / Sub-threshold Personal Risk
        if self.ambiguous_risk_regex.search(clean_text):
            return {
                "is_crisis": True,
                "crisis_type": "ambiguous_personal_risk",
                "bypassed_llm": True,
                "country": selected_country,
                "message": (
                    "💙 WE ARE HERE FOR YOU:\n"
                    "It sounds like you may be going through an exceptionally difficult time. "
                    "Even when things feel heavy, you do not have to carry this alone:\n\n"
                    f"• Free & Confidential Support ({selected_country}): {helpline}\n"
                    f"• Emergency Services: {emergency}\n\n"
                    "Consider reaching out to a campus counselor, trusted faculty mentor, or the helplines above for free, confidential guidance."
                ),
                "contacts": {
                    "primary_helpline": helpline,
                    "emergency_dispatch": emergency
                }
            }

        return None

    def check_diagnostic(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Deterministic Non-Diagnostic Interceptor.
        Blocks requests for clinical diagnosis, psychometric interpretations, or medication advice.
        """
        if self.diagnostic_regex.search(text):
            return {
                "is_diagnostic": True,
                "bypassed_llm": True,
                "message": (
                    "Mindora 2.0 is an educational student wellbeing intelligence platform and CANNOT provide "
                    "clinical psychiatric diagnoses, calculate medical depression risk, interpret individual PHQ-9 "
                    "scores, or recommend prescription medications.\n\n"
                    "For a clinical evaluation, personalized diagnosis, or medical treatment plan, please consult "
                    "a licensed healthcare professional or visit your university's student health and counseling center."
                )
            }
        return None
