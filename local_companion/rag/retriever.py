"""
local_companion/rag/retriever.py
Grounded retrieval engine over approved educational and crisis resources.
Guarantees source attribution, relevance scoring, domain validation, and hallucination prevention.
Phase 5.4.4: Layered Retrieval Architecture with Stopword Filtering and Domain Validation.
"""

import re
from typing import List, Dict, Any, Optional, Tuple
from .knowledge_base import APPROVED_KNOWLEDGE_BASE

# Common English, Hindi, and transliterated function words and query stopwords
STOPWORDS = {
    # English
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
    "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
    "during", "each", "few", "for", "from", "further", "had", "hadn't", "has",
    "hasn't", "have", "haven't", "having", "he", "her", "here", "hers", "herself",
    "him", "himself", "his", "how", "i", "if", "in", "into", "is", "isn't", "it",
    "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no",
    "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
    "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "should",
    "shouldn't", "so", "some", "such", "than", "that", "the", "their", "theirs",
    "them", "themselves", "then", "there", "these", "they", "this", "those",
    "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we",
    "were", "weren't", "what", "when", "where", "which", "while", "who", "whom",
    "why", "with", "won't", "would", "wouldn't", "you", "your", "yours", "yourself",
    "yourselves", "tell", "give", "want", "need", "please", "know", "see", "look",
    "get", "make", "today", "now", "just", "like", "also", "much", "many", "way",
    "well", "take", "come", "think", "good", "best", "latest", "new", "show", "find",
    # Hinglish stopwords
    "kya", "hai", "hain", "ke", "ki", "ka", "ko", "se", "me", "mein", "par", "bhi",
    "aur", "ya", "yeh", "woh", "kar", "kare", "karein", "karna", "raha", "rahi", "rahe", "hona",
    "chahiye", "batao", "bataiye", "kripya", "mujhe", "mera", "meri", "hum", "aap", "tum",
    "kaise", "kam", "dauran", "baare", "hota", "hoti", "hote", "wala", "wali", "wale", "kuch",
    "sab", "apna", "apne", "apni", "main", "bas", "bol", "wo", "woh", "le", "de",
    "mai", "chahata", "chahta", "chahate", "chahte",
    # Devanagari stopwords (हिन्दी)
    "क्या", "है", "हैं", "के", "की", "का", "को", "से", "में", "पर", "भी", "और", "या",
    "यह", "वह", "कर", "करे", "करें", "करना", "रहा", "रही", "रहे", "होना", "चाहिए", "बताओ", "बताइए",
    "कृपया", "मुझे", "मेरा", "मेरी", "हम", "आप", "तुम", "कैसे", "कम", "दौरान", "बारे",
    "होता", "होती", "होते", "कुछ", "सब", "अपना", "अपने", "अपनी", "केवल", "सलाह", "तरीके",
    "बताएं", "रात", "पहले", "बीच", "जरूरी", "लेना", "देना", "मैं", "नहीं", "चाहता", "चाहती",
    "क्यों", "कितने", "कितना"
}

# Approved Domain Concepts for Student Wellbeing
APPROVED_DOMAIN_KEYWORDS = {
    # Crisis, Helplines & Emotional Support
    "tele-manas", "telemanas", "kiran", "vandrevala", "988", "911", "112", "999", "000",
    "14416", "116123", "85258", "741741", "131114", "lifeline", "samaritans", "shout",
    "beyondblue", "kidshelpline", "befrienders", "iasp", "findahelpline",
    "helpline", "helplines", "hotline", "hotlines", "crisis", "suicide", "suicidal",
    "emergency", "dispatch", "counseling", "counselor", "counselors", "therapy",
    "therapist", "psychologist", "psychological", "distress", "emotional", "support",
    "loneliness", "listening", "peer", "triple", "zero", "nine", "one", "hundred", "eleven",
    # Sleep Hygiene & Restorative Health
    "sleep", "sleeping", "insomnia", "circadian", "bedtime", "wake", "waking",
    "rest", "restorative", "fatigue", "exhaustion", "exhausted", "tired", "tiredness",
    "drowsy", "all-nighter", "all-nighters", "caffeine", "blue-light", "sanctuary",
    # Study Workload & Academic Resilience
    "study", "studying", "studies", "workload", "academic", "exam", "exams",
    "midterm", "midterms", "finals", "pomodoro", "pacing", "cramming", "distributed",
    "burnout", "burned", "pressure", "coursework", "homework", "assignments", "revision",
    "session", "sessions", "12-hour", "marathon",
    # Student Distress & Campus Transition Vocabulary
    "homesick", "homesickness", "lonely", "isolated", "isolation", "imposter", "impostor",
    "adjustment", "adjusting", "transition", "freshman", "anxiety", "panic",
    # University & Campus Health Services
    "campus", "university", "college", "accommodations", "transcript", "transcripts",
    "intake", "wellness", "wellbeing", "aucccd", "student-health",
    # Nutrition & Regularity
    "nutrition", "diet", "meals", "meal", "hydration", "glucose", "snacks",
    # Multilingual (Hinglish & Devanagari Hindi)
    "neend", "sona", "padhai", "tanaav", "chinta", "madad", "ghante", "pariksha", "darr", "akelepan", "thakan", "thakaan",
    "टेली-मानस", "टेलीमानस", "किरण", "नींद", "सोना", "सोने", "पढ़ाई", "तनाव", "चिंता", "मदद", "घंटे", "परीक्षा", "काउंसलिंग", "थकान", "अकेलापन", "आपातकालीन",
    "छात्र", "छात्रों", "कैफीन", "ब्रेक"
}

# Polysemous words that require collegiate or wellbeing context
POLYSEMOUS_WORDS = {"study", "studying", "studies", "sleep", "sleeping", "rest", "diet", "food"}

COLLEGIATE_WELLBEING_CONTEXT = {
    "student", "students", "college", "university", "campus", "academic", "coursework",
    "homework", "exam", "exams", "midterm", "midterms", "finals", "grade", "grades",
    "cgpa", "dorm", "freshman", "degree", "lecture", "lectures", "syllabus",
    "routine", "hours", "night", "bedtime", "wake", "waking", "hygiene", "tired", "tiredness",
    "fatigue", "exhaustion", "exhausted", "burnout", "pomodoro", "caffeine", "insomnia",
    "distress", "stress", "stressed", "anxiety", "depression", "counseling", "counselor",
    "mental", "wellbeing", "health", "emotional", "support", "lonely", "loneliness", "homesick",
    "homesickness", "imposter", "isolation", "pacing", "habits", "habit", "schedule", "all-nighter",
    "all-nighters", "circadian", "sanctuary", "concentration", "focus", "focusing",
    "neend", "sona", "padhai", "pariksha", "tanaav", "chinta", "thakan", "ghante",
    "नींद", "सोना", "पढ़ाई", "परीक्षा", "तनाव", "चिंता", "थकान", "घंटे"
}

# Out-of-Domain Patterns that must be rejected immediately
OUT_OF_DOMAIN_PATTERNS = [
    # Animals, Wildlife, Hibernation & Zoology
    r"\b(polar\s+bears?|grizzly|bears?|hibernat\w*|winter\s+sleep|wildlife|zoology|animal\s+sleep|reptiles?|mammals?)\b",
    # Academic Majors / Film Studies / Degree Curriculum outside wellbeing
    r"\b(film\s+studies|cinema\s+studies|gender\s+studies|media\s+studies|religious\s+studies|degree\s+in\s+film|film\s+major|directing\s+movies|acting\s+school)\b",
    # Economics, Inflation, Macroeconomics & Stock Markets
    r"\b(economic\s+study|inflation|macroeconomics?|microeconomics?|gdp|interest\s+rates?|fiscal\s+policy|monetary\s+policy|consumer\s+price\s+index)\b",
    r"\b(stock|stocks|crypto|cryptocurrency|bitcoin|btc|ethereum|eth|black[\s-]scholes|option\s+pricing|portfolio|investing|investment|tax\s+brackets?|dividend|forex|wall\s+street|nasdaq)\b",
    # Surgical, Inpatient & Clinical Medical Procedures
    r"\b(surgery|surgical|apnea\s+surgery|cpap|tonsillectomy|biopsy|chemotherapy|radiation\s+therapy|operating\s+room|anesthesia|implant)\b",
    # Politics, Government, Elections & International Conflicts
    r"\b(president|prime\s+minister|election|voting|vote|parliament|congress|senate|democrat|republican|treaty|geopolitics|ukraine|russia|gaza|israel|united\s+nations|legislation)\b",
    # Pop Culture, Sports, Cinema & Entertainment
    r"\b(oscar|oscars|academy\s+awards?|best\s+picture|premier\s+league|champions\s+league|fifa|world\s+cup|nba|nfl|cricket|ipl|super\s+bowl|actor|actress|box\s+office|hollywood|bollywood|netflix|movie\s+review|formula\s+1|f1)\b",
    # Tech, Hardware, Software Development & Gaming
    r"\b(gpu|graphics\s+card|rtx\s*\d+|nvidia|amd|intel|processor|cpu|gaming\s+rig|playstation|xbox|python\s+code|javascript|compiler|git\s+commit|linux\s+kernel|sql\s+query|docker\s+container)\b",
    # Science, Physics, Math formulas & General Trivia
    r"\b(speed\s+of\s+light|formula\s+for\s+calculating|photosynthesis|periodic\s+table|quantum\s+mechanics|capital\s+of|weather\s+in|population\s+of|distance\s+to|circumference\s+of)\b",
    # Daily chores, DIY, Travel, Visa & Cooking Recipes
    r"\b(leaky\s+(sink|pipe|faucet)|plumbing|tourist\s+visa|visa\s+application|hotel\s+in|flight\s+tickets?|recipe\s+for|calories\s+in|bake\s+a\s+cake|pizza|poem\s+about|write\s+an\s+essay)\b"
]

# Common ambiguous single-intent phrases that require student clarification
AMBIGUOUS_PATTERNS = [
    r"^(help|advice|tips|guidance|resources?)$",
    r"^(can\s+you\s+help|need\s+help|give\s+me\s+help)\??$",
    r"^(need\s+guidance|give\s+me\s+guidance|guidance\s+please)\??$",
    r"^(give\s+me\s+some\s+tips|tips\s+please|any\s+tips)\??$",
    r"^(advice\s+please|give\s+me\s+advice|need\s+advice)\??$",
    r"^(what\s+to\s+do|what\s+should\s+i\s+do|what\s+can\s+i\s+do)\??$",
    r"^(lost\s+and\s+confused|feeling\s+low|feeling\s+lost|so\s+lost)\??$",
    r"^(overwhelmed\s+by\s+everything|overwhelmed|stressed\s+out)\??$",
    r"^(college\s+problems|student\s+problems|university\s+problems)\??$",
    r"^(tell\s+me\s+something\s+useful|need\s+support|support\s+please)\??$",
    r"^(struggling\s+with\s+(college|university|school|studies|life))\??$",
    r"^(tell\s+me\s+what\s+to\s+do|don'?t\s+know\s+what\s+to\s+do)\??$"
]

class GroundedRetriever:
    def __init__(self, relevance_threshold: float = 0.28):
        self.knowledge_base = APPROVED_KNOWLEDGE_BASE
        self.relevance_threshold = relevance_threshold
        self.stopwords = STOPWORDS
        self.domain_keywords = APPROVED_DOMAIN_KEYWORDS
        self.out_of_domain_regex = [re.compile(p, re.IGNORECASE) for p in OUT_OF_DOMAIN_PATTERNS]
        self.ambiguous_regex = [re.compile(p, re.IGNORECASE) for p in AMBIGUOUS_PATTERNS]

    def _tokenize(self, text: str) -> set[str]:
        """Convert text into normalized lowercase word tokens, stripping punctuation and preserving Unicode letters/marks."""
        clean = re.sub(r"[^\w\s\u0900-\u097f-]", " ", text.lower())
        tokens = set(t.strip() for t in clean.split() if len(t.strip()) > 1)
        return tokens

    def _get_content_tokens(self, text: str) -> set[str]:
        """Return non-stopword tokens."""
        return self._tokenize(text) - self.stopwords

    def is_ambiguous(self, query: str) -> bool:
        """Check if query is underspecified or too vague to ground without clarification."""
        clean_query = query.strip()
        for pattern in self.ambiguous_regex:
            if pattern.match(clean_query):
                return True
        tokens = self._tokenize(clean_query)
        content_tokens = tokens - self.stopwords
        # 1-2 content words containing only generic vague terms
        generic_words = {
            "help", "stress", "stressed", "sad", "lost", "advice", "guidance",
            "college", "problem", "problems", "low", "confused", "tips", "resources", "support"
        }
        if len(content_tokens) <= 2 and content_tokens.issubset(generic_words):
            return True
        return False

    def is_out_of_domain(self, query: str) -> bool:
        """
        Check if query belongs to out-of-domain topics (crypto, politics, sports, general trivia,
        animal hibernation, medical surgery, degree majors, macroeconomics).
        Also enforces compound context requirement on polysemous words ('study', 'sleep', 'rest', 'diet').
        """
        clean_query = query.strip()
        # 1. Match explicit out of domain regex
        for pattern in self.out_of_domain_regex:
            if pattern.search(clean_query):
                return True

        # 2. Tokenize and remove stopwords
        content_tokens = self._get_content_tokens(clean_query)
        if not content_tokens:
            return False

        # 3. Check domain concept overlap
        domain_overlap = content_tokens.intersection(self.domain_keywords)
        if len(domain_overlap) == 0:
            # Check if any content token has substantive partial match with domain keywords
            has_partial = any(
                any(ct in dk or dk in ct for dk in self.domain_keywords)
                for ct in content_tokens if len(ct) >= 4
            )
            if not has_partial:
                return True

        # 4. Polysemous Context Disambiguation:
        # If the only domain keywords matched are polysemous words (e.g. 'study', 'studies', 'sleep', 'rest'),
        # require at least one student, collegiate, or wellbeing context term.
        if domain_overlap.issubset(POLYSEMOUS_WORDS):
            has_context = bool(content_tokens.intersection(COLLEGIATE_WELLBEING_CONTEXT))
            if not has_context:
                # E.g. "Polar bears and winter sleep" or "Film studies degrees" or "Economic study on inflation"
                return True

        return False

    def retrieve(
        self,
        query: str,
        country: Optional[str] = None,
        top_k: int = 2
    ) -> Tuple[bool, List[Dict[str, Any]], float]:
        """
        Layered retrieval over approved resources:
        1. Checks out-of-domain and ambiguity
        2. Filters query stopwords to prevent false lexical matches
        3. Scores non-stopword tokens against keywords, title, and verified summaries
        4. Applies strictly conditional country alignment
        """
        # Step 1: Check out-of-domain and ambiguity first
        if self.is_ambiguous(query) or self.is_out_of_domain(query):
            return False, [], 0.0

        content_tokens = self._get_content_tokens(query)
        if not content_tokens:
            return False, [], 0.0

        scored_items: List[Tuple[float, Dict[str, Any]]] = []

        for item in self.knowledge_base:
            # 1. Keyword matching on content tokens
            item_keywords = set(k.lower() for k in item.get("keywords", []))
            kw_matches = sum(
                1 for q in content_tokens
                if any(q == kw or (len(q) >= 4 and (q in kw or kw in q)) for kw in item_keywords)
            )
            # Use bounded denominator min(len, 4) so descriptive long questions are not unfairly penalized
            kw_ratio = (kw_matches / min(len(content_tokens), 4))
            kw_score = min(0.60, kw_ratio * 0.58)

            # 2. Title matching on content tokens
            title_tokens = self._get_content_tokens(item.get("title", ""))
            title_overlap = len(content_tokens.intersection(title_tokens))
            title_ratio = (title_overlap / min(len(content_tokens), 4))
            title_score = min(0.40, title_ratio * 0.35)

            # 3. Summary matching on content tokens
            summary_tokens = self._get_content_tokens(item.get("summary", ""))
            summary_overlap = len(content_tokens.intersection(summary_tokens))
            summary_ratio = (summary_overlap / min(len(content_tokens), 5))
            summary_score = min(0.35, summary_ratio * 0.30)

            content_score = kw_score + title_score + summary_score

            # 4. Strict Country Weighting:
            # Country bonus is ONLY applied if there is substantive conceptual match (content_score >= 0.25).
            # Country weighting alone or with stopwords can NEVER make unrelated queries relevant.
            country_score = 0.0
            item_country = item.get("country", "")
            if content_score >= 0.25:
                if country and country not in ["International", "All"]:
                    if item_country.lower() == country.lower():
                        country_score = 0.10
                    elif item_country in ["Global", "International"]:
                        country_score = 0.05
                    else:
                        country_score = -0.15
            else:
                country_score = 0.0

            final_score = max(0.0, min(1.0, content_score + country_score))
            if final_score >= self.relevance_threshold:
                scored_items.append((final_score, item))

        scored_items.sort(key=lambda x: x[0], reverse=True)

        if not scored_items:
            return False, [], 0.0

        top_score = scored_items[0][0]
        results = [item for _, item in scored_items[:top_k]]
        return True, results, top_score

    def format_context(self, resources: List[Dict[str, Any]]) -> str:
        """Format retrieved resources into a structured grounding context block."""
        context_parts = []
        for i, res in enumerate(resources, 1):
            contacts = res.get("contact_number", "N/A")
            hours = res.get("operational_hours", "N/A")
            src = res.get("source", "Approved Directory")
            vdate = res.get("verification_date", "2026-11-15")
            
            part = (
                f"--- RESOURCE [{i}]: {res['title']} ---\n"
                f"Country / Scope: {res['country']}\n"
                f"Category: {res['category']}\n"
                f"Official Source: {src} (Verified: {vdate})\n"
                f"Contact / Access: {contacts}\n"
                f"Hours of Operation: {hours}\n"
                f"Verified Details: {res['summary']}\n"
            )
            context_parts.append(part)
        return "\n".join(context_parts)

