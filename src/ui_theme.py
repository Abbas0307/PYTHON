"""
src/ui_theme.py
Mindora - Student Mental Wellness & Risk Insights
Ultra-Premium White and Violet Design System, Custom CSS, 3D Decorative visuals,
Interactive Widgets, and UI Components.
"""

# Palette Constants
BG_MAIN = "#FFFFFF"
PRIMARY_VIOLET = "#6D43C6"
SECONDARY_VIOLET = "#8B5CF6"
LAVENDER = "#F1EBFF"
LIGHT_SURFACE = "#F8F7FC"
MAIN_TEXT = "#241A35"
BORDER_COLOR = "rgba(139, 92, 246, 0.16)"

CUSTOM_CSS = f"""
<style>
/* Offline-First Native System Typography: Zero external network requests */

:root {{
    --bg-main: #FFFFFF;
    --primary: #6D43C6;
    --secondary: #8B5CF6;
    --lavender: #F1EBFF;
    --surface: #F8F7FC;
    --text-main: #241A35;
    --text-muted: #475569;
    --border: rgba(139, 92, 246, 0.16);
    --shadow-soft: 0 12px 32px rgba(109, 67, 198, 0.06);
    --shadow-hover: 0 20px 48px rgba(109, 67, 198, 0.14);
}}

/* Base Streamlit App Overrides */
html, body, [class*="css"], .stApp {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    background-color: #FFFFFF !important;
    color: #241A35 !important;
    letter-spacing: -0.01em;
}}

/* Clean Header & Navigation Bar */
header[data-testid="stHeader"] {{
    background: rgba(255, 255, 255, 0.9) !important;
    backdrop-filter: blur(14px) !important;
    border-bottom: 1px solid rgba(139, 92, 246, 0.12) !important;
}}

#MainMenu {{visibility: hidden;}}
footer {{visibility: hidden;}}

/* Block Container Spacing */
.block-container {{
    padding-top: 1.8rem !important;
    padding-bottom: 4rem !important;
    max-width: 1220px !important;
}}

/* Modern Typography */
h1, h2, h3, h4, h5, h6 {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    color: #241A35 !important;
    font-weight: 700 !important;
    letter-spacing: -0.025em !important;
}}

/* Premium Glassmorphic Card */
.mindora-card {{
    background: #FFFFFF;
    border: 1px solid rgba(139, 92, 246, 0.14);
    border-radius: 20px;
    padding: 26px 30px;
    box-shadow: 0 12px 32px rgba(109, 67, 198, 0.05);
    margin-bottom: 24px;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
}}

.mindora-card:hover {{
    transform: translateY(-3px);
    box-shadow: 0 22px 48px rgba(109, 67, 198, 0.11);
    border-color: rgba(139, 92, 246, 0.32);
}}

/* Hero Card with 3D Abstract Accents */
.mindora-hero-card {{
    background: linear-gradient(135deg, #FFFFFF 0%, #FAF8FF 45%, #F1EBFF 100%);
    border: 1px solid rgba(139, 92, 246, 0.22);
    border-radius: 26px;
    padding: 44px 48px;
    box-shadow: 0 20px 50px rgba(109, 67, 198, 0.09);
    position: relative;
    overflow: hidden;
    margin-bottom: 32px;
}}

/* 3D Floating Geometry Animations */
@keyframes floatSphere1 {{
    0% {{ transform: translate(0px, 0px) rotate(0deg); }}
    50% {{ transform: translate(-8px, -18px) rotate(8deg); }}
    100% {{ transform: translate(0px, 0px) rotate(0deg); }}
}}

@keyframes floatSphere2 {{
    0% {{ transform: translate(0px, 0px) rotate(0deg); }}
    50% {{ transform: translate(12px, -14px) rotate(-10deg); }}
    100% {{ transform: translate(0px, 0px) rotate(0deg); }}
}}

@keyframes floatSphere3 {{
    0% {{ transform: translateY(0px) scale(1); }}
    50% {{ transform: translateY(-10px) scale(1.05); }}
    100% {{ transform: translateY(0px) scale(1); }}
}}

.floating-3d-sphere {{
    position: absolute;
    border-radius: 50%;
    filter: blur(1.5px);
    pointer-events: none;
}}

.sphere-1 {{
    width: 170px;
    height: 170px;
    top: -40px;
    right: -25px;
    background: radial-gradient(circle at 35% 35%, #DDD6FE, #8B5CF6 65%, #6D43C6);
    opacity: 0.88;
    box-shadow: 0 24px 50px rgba(109, 67, 198, 0.28);
    animation: floatSphere1 7s ease-in-out infinite;
}}

.sphere-2 {{
    width: 95px;
    height: 95px;
    bottom: -25px;
    left: 25px;
    background: radial-gradient(circle at 30% 30%, #EDE9FE, #A78BFA 70%, #7C3AED);
    opacity: 0.8;
    animation: floatSphere2 6s ease-in-out infinite;
}}

.sphere-mini {{
    width: 44px;
    height: 44px;
    top: 55%;
    right: 28%;
    background: radial-gradient(circle at 30% 30%, #F5F3FF, #C4B5FD);
    opacity: 0.95;
    animation: floatSphere3 4.5s ease-in-out infinite;
}}

/* Modern Pill Badge */
.mindora-badge {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    background: #F1EBFF;
    border: 1px solid rgba(139, 92, 246, 0.28);
    border-radius: 30px;
    font-size: 0.8rem;
    font-weight: 700;
    color: #6D43C6;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 12px;
}}

/* Gradient Buttons */
.stButton > button {{
    background: linear-gradient(135deg, #6D43C6 0%, #8B5CF6 100%) !important;
    color: #FFFFFF !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-weight: 600 !important;
    border: none !important;
    border-radius: 14px !important;
    padding: 13px 30px !important;
    font-size: 0.98rem !important;
    min-height: 44px !important;
    box-shadow: 0 8px 24px rgba(109, 67, 198, 0.22) !important;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}}

.stButton > button:hover {{
    transform: translateY(-2px) !important;
    box-shadow: 0 14px 34px rgba(109, 67, 198, 0.34) !important;
    color: #FFFFFF !important;
}}

/* WCAG 2.2 AA Keyboard Focus Indicators */
.stButton > button:focus-visible,
[role="button"]:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[tabindex="0"]:focus-visible {{
    outline: 3px solid #6D43C6 !important;
    outline-offset: 2px !important;
}}

/* Clean Form Controls */
.stTextInput > div > div > input,
.stNumberInput > div > div > input,
.stSelectbox > div > div > div {{
    background-color: #F8F7FC !important;
    border: 1px solid rgba(139, 92, 246, 0.2) !important;
    border-radius: 12px !important;
    color: #241A35 !important;
    font-size: 0.95rem !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    transition: all 0.2s ease !important;
}}

.stTextInput > div > div > input:focus,
.stNumberInput > div > div > input:focus {{
    border-color: #6D43C6 !important;
    box-shadow: 0 0 0 3px rgba(109, 67, 198, 0.16) !important;
    background-color: #FFFFFF !important;
}}

/* Slider Accent */
.stSlider > div > div > div > div {{
    background-color: #6D43C6 !important;
}}

/* Metrics Component Custom styling */
[data-testid="stMetricValue"] {{
    color: #6D43C6 !important;
    font-weight: 800 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
}}

[data-testid="stMetricLabel"] {{
    color: #475569 !important;
    font-weight: 600 !important;
    font-size: 0.88rem !important;
}}

/* Progress Bar */
.stProgress > div > div > div > div {{
    background: linear-gradient(90deg, #6D43C6, #8B5CF6) !important;
    border-radius: 10px !important;
}}

/* Tab Styling */
.stTabs [data-baseweb="tab-list"] {{
    gap: 8px;
    background-color: #F8F7FC;
    padding: 7px;
    border-radius: 16px;
    border: 1px solid rgba(139, 92, 246, 0.15);
}}

.stTabs [data-baseweb="tab"] {{
    border-radius: 11px;
    padding: 9px 20px;
    font-weight: 600;
    color: #475569;
    transition: all 0.2s ease;
}}

.stTabs [aria-selected="true"] {{
    background-color: #FFFFFF !important;
    color: #6D43C6 !important;
    box-shadow: 0 4px 14px rgba(109, 67, 198, 0.13) !important;
}}

/* Crisis Banner Override */
.crisis-box {{
    background: linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%);
    border: 2px solid #F43F5E;
    border-radius: 20px;
    padding: 26px 28px;
    margin-bottom: 26px;
    box-shadow: 0 12px 36px rgba(244, 63, 94, 0.14);
}}

/* Sidebar navigation styling */
[data-testid="stSidebar"] {{
    background-color: #F8F7FC !important;
    border-right: 1px solid rgba(139, 92, 246, 0.15) !important;
}}

/* Footer */
.mindora-footer {{
    margin-top: 50px;
    padding-top: 28px;
    border-top: 1px solid rgba(139, 92, 246, 0.15);
    text-align: center;
    color: #475569;
    font-size: 0.85rem;
    line-height: 1.6;
}}

/* Responsive Layout & Accessibility Enhancements */
@media (max-width: 768px) {{
    .block-container {{
        padding-top: 1rem !important;
        padding-left: 0.8rem !important;
        padding-right: 0.8rem !important;
    }}
    .mindora-hero-card {{
        padding: 24px 20px !important;
        margin-bottom: 20px !important;
    }}
    .mindora-card {{
        padding: 18px 16px !important;
        margin-bottom: 16px !important;
    }}
    .stTabs [data-baseweb="tab"] {{
        padding: 6px 12px !important;
        font-size: 0.8rem !important;
    }}
}}

@media (max-width: 480px) {{
    .mindora-hero-card h1 {{
        font-size: 2.0rem !important;
    }}
    .mindora-badge {{
        font-size: 0.72rem !important;
        padding: 4px 10px !important;
    }}
    .stTabs [data-baseweb="tab-list"] {{
        overflow-x: auto !important;
        white-space: nowrap !important;
    }}
    .floating-3d-sphere {{
        display: none !important;
    }}
}}

@media (max-width: 360px) {{
    .block-container {{
        padding-left: 0.5rem !important;
        padding-right: 0.5rem !important;
    }}
    .mindora-hero-card h1 {{
        font-size: 1.7rem !important;
    }}
    .mindora-card {{
        padding: 14px 12px !important;
    }}
    .stTabs [data-baseweb="tab"] {{
        padding: 5px 8px !important;
        font-size: 0.74rem !important;
    }}
}}
</style>
"""

def render_hero_header() -> str:
    """Render high-polish 3D Mindora SaaS hero header."""
    return f"""
    <div class="mindora-hero-card">
        <div class="floating-3d-sphere sphere-1"></div>
        <div class="floating-3d-sphere sphere-2"></div>
        <div class="floating-3d-sphere sphere-mini"></div>
        <div style="position: relative; z-index: 2; max-width: 750px;">
            <div class="mindora-badge">
                <span>✨</span> Student Wellbeing Reflection Platform
            </div>
            <h1 style="font-size: 2.85rem; font-weight: 800; line-height: 1.15; margin-bottom: 12px; background: linear-gradient(135deg, #241A35 0%, #6D43C6 60%, #8B5CF6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                Mindora
            </h1>
            <h3 style="font-size: 1.35rem; font-weight: 600; color: #6D43C6; margin-top: 0; margin-bottom: 16px;">
                Student Mental Wellness & Risk Insights Platform
            </h3>
            <p style="font-size: 1.05rem; line-height: 1.65; color: #475569; margin-bottom: 24px;">
                An intelligent, compassionate screening system uniting calibrated machine learning, 
                digital lifestyle analytics, and standardized psychometrics to deliver proactive wellbeing reflection.
            </p>
            <div style="display: flex; gap: 14px; flex-wrap: wrap;">
                <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.88rem; font-weight: 600; color: #6D43C6; background: #FFFFFF; padding: 7px 16px; border-radius: 20px; box-shadow: 0 4px 14px rgba(109, 67, 198, 0.08);">
                    🔒 Ephemeral Server-Session Processing
                </span>
                <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.88rem; font-weight: 600; color: #6D43C6; background: #FFFFFF; padding: 7px 16px; border-radius: 20px; box-shadow: 0 4px 14px rgba(109, 67, 198, 0.08);">
                    🤖 Calibrated XGBoost & SHAP Explainability
                </span>
                <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.88rem; font-weight: 600; color: #6D43C6; background: #FFFFFF; padding: 7px 16px; border-radius: 20px; box-shadow: 0 4px 14px rgba(109, 67, 198, 0.08);">
                    📋 Standardized PHQ-9 Screener
                </span>
            </div>
        </div>
    </div>
    """

def render_safety_disclaimer_card() -> str:
    """Render medical safety notice card."""
    return f"""
    <div style="background: {LAVENDER}; border-left: 5px solid {PRIMARY_VIOLET}; border-radius: 14px; padding: 18px 22px; margin-bottom: 24px; box-shadow: 0 6px 18px rgba(109, 67, 198, 0.04);">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <span style="font-size: 1.45rem;">⚕️</span>
            <div>
                <strong style="color: {PRIMARY_VIOLET}; font-size: 0.98rem; display: block; margin-bottom: 4px;">
                    Important Safety & Educational Screening Disclaimer
                </strong>
                <p style="font-size: 0.87rem; color: #334155; margin: 0; line-height: 1.55;">
                    Mindora is an educational machine learning screening prototype. 
                    <strong>Outputs are experimental statistical indicators correlating with survey responses and do not constitute a clinical diagnosis, medical evaluation, or treatment plan.</strong>
                    If you are experiencing emotional distress or thoughts of self-harm, compassionate 24/7 help is available (Tele-MANAS: <strong>14416</strong> or <strong>1800-89-14416</strong> in India).
                </p>
            </div>
        </div>
    </div>
    """

def render_footer() -> str:
    """Render professional SaaS footer."""
    return f"""
    <div class="mindora-footer">
        <div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 10px;">
            <span style="font-weight: 800; color: {PRIMARY_VIOLET}; font-size: 1.05rem;">Mindora</span>
            <span>•</span>
            <span style="color: #64748B;">Student Mental Wellness & Risk Insights</span>
        </div>
        <p style="margin: 0 0 6px 0; max-width: 600px; margin-left: auto; margin-right: auto; font-size: 0.8rem; color: #94A3B8;">
            Trained and benchmarked on the public Student Depression Dataset (27,901 records). 
            Preserves student privacy with zero data persistence. Not for clinical diagnostic use.
        </p>
        <p style="margin: 0; font-size: 0.78rem; color: #CBD5E1;">
            © 2026 Mindora Systems • MIT Licensed Academic Prototype
        </p>
    </div>
    """

def get_voice_speech_component_html() -> str:
    """
    Browser-native Web Speech API speech-to-text interactive widget.
    Zero-dependency, runs purely in client browser with fallback.
    Does NOT infer tone or emotion.
    """
    return """
    <div style="background: #FFFFFF; border: 1.5px dashed #8B5CF6; border-radius: 18px; padding: 20px; margin: 16px 0; text-align: center; box-shadow: 0 6px 20px rgba(109,67,198,0.06);">
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 8px;">
            <span style="font-size: 1.35rem;">🎙️</span>
            <span style="font-weight: 700; color: #6D43C6; font-size: 0.98rem;">Browser Speech-to-Text Input</span>
        </div>
        <p style="font-size: 0.84rem; color: #64748B; margin-bottom: 14px; max-width: 540px; margin-left: auto; margin-right: auto; line-height: 1.45;">
            Speak your answers or study reflection aloud. Transcription occurs locally in your browser. 
            (Mindora does not record voice tone, emotion, or acoustic properties).
        </p>
        <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 12px;">
            <button id="start-record-btn" onclick="toggleRecording()" style="
                background: linear-gradient(135deg, #6D43C6, #8B5CF6);
                color: white;
                border: none;
                border-radius: 20px;
                padding: 9px 22px;
                font-weight: 600;
                font-size: 0.88rem;
                cursor: pointer;
                box-shadow: 0 4px 14px rgba(109, 67, 198, 0.25);
                transition: all 0.2s ease;
            ">
                🎤 Click to Speak
            </button>
            <button onclick="copyVoiceText()" style="
                background: #F1EBFF;
                color: #6D43C6;
                border: 1px solid rgba(139, 92, 246, 0.35);
                border-radius: 20px;
                padding: 9px 20px;
                font-weight: 600;
                font-size: 0.88rem;
                cursor: pointer;
                transition: all 0.2s ease;
            ">
                📋 Copy Transcript
            </button>
        </div>
        <div id="recording-status" style="font-size: 0.82rem; color: #8B5CF6; font-weight: 600; min-height: 22px; margin-bottom: 8px;">
            Ready to listen
        </div>
        <textarea id="voice-transcript" rows="3" placeholder="Voice transcription will appear here. Click 'Copy Transcript' to paste it into the notes field below..." style="
            width: 95%;
            padding: 12px 14px;
            border-radius: 12px;
            border: 1px solid rgba(139, 92, 246, 0.25);
            background: #F8F7FC;
            font-size: 0.9rem;
            color: #241A35;
            resize: vertical;
            font-family: inherit;
        "></textarea>
    </div>

    <script>
        let recognition = null;
        let isRecording = false;

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = function() {
                isRecording = true;
                document.getElementById('recording-status').innerText = '🔴 Listening... Speak clearly into your microphone.';
                document.getElementById('start-record-btn').innerText = '⏹️ Stop Listening';
                document.getElementById('start-record-btn').style.background = '#EF4444';
            };

            recognition.onresult = function(event) {
                let interimTranscript = '';
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript + ' ';
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                const currentText = document.getElementById('voice-transcript').value;
                if (finalTranscript) {
                    document.getElementById('voice-transcript').value = currentText + finalTranscript;
                }
            };

            recognition.onerror = function(event) {
                document.getElementById('recording-status').innerText = 'Notice: Speech recognition error (' + event.error + '). Please type manually.';
                stopRecording();
            };

            recognition.onend = function() {
                stopRecording();
            };
        } else {
            document.getElementById('recording-status').innerText = 'Web Speech API is not supported in this browser. Please use manual text input.';
            document.getElementById('start-record-btn').disabled = true;
            document.getElementById('start-record-btn').style.opacity = '0.5';
        }

        function toggleRecording() {
            if (!recognition) return;
            if (isRecording) {
                recognition.stop();
                stopRecording();
            } else {
                try {
                    recognition.start();
                } catch(e) {
                    recognition.stop();
                }
            }
        }

        function stopRecording() {
            isRecording = false;
            document.getElementById('recording-status').innerText = 'Transcript captured. Click "Copy Transcript" to paste into notes below.';
            document.getElementById('start-record-btn').innerText = '🎤 Click to Speak';
            document.getElementById('start-record-btn').style.background = 'linear-gradient(135deg, #6D43C6, #8B5CF6)';
        }

        function copyVoiceText() {
            const text = document.getElementById('voice-transcript').value;
            navigator.clipboard.writeText(text).then(() => {
                document.getElementById('recording-status').innerText = '✅ Transcript copied to clipboard!';
            });
        }
    </script>
    """

def render_journey_banner() -> str:
    """Render the 4-step student wellbeing journey: UNDERSTAND -> DISCOVER -> ACT -> IMPROVE."""
    return f"""
    <div style="background: linear-gradient(135deg, #FAF7FF 0%, #F5EFFF 100%); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 20px; padding: 22px; margin-bottom: 24px; box-shadow: 0 8px 24px rgba(109, 67, 198, 0.05);">
        <div style="text-align: center; margin-bottom: 16px;">
            <span style="font-size: 0.8rem; font-weight: 700; color: {PRIMARY_VIOLET}; text-transform: uppercase; letter-spacing: 0.08em;">
                The Mindora Student Experience
            </span>
            <h3 style="font-size: 1.4rem; font-weight: 800; color: {MAIN_TEXT}; margin: 4px 0 6px 0;">
                Your Personal Wellbeing Journey
            </h3>
            <p style="font-size: 0.88rem; color: #64748B; max-width: 620px; margin: 0 auto;">
                A continuous, non-clinical cycle designed to empower self-awareness and sustainable everyday habits.
            </p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
            <div style="background: #FFFFFF; border-radius: 14px; padding: 16px; border: 1px solid rgba(139, 92, 246, 0.12); box-shadow: 0 4px 12px rgba(109, 67, 198, 0.03);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="background: {LAVENDER}; color: {PRIMARY_VIOLET}; font-weight: 800; font-size: 0.8rem; width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">1</span>
                    <strong style="color: {PRIMARY_VIOLET}; font-size: 0.95rem;">UNDERSTAND</strong>
                </div>
                <p style="font-size: 0.8rem; color: #475569; margin: 0; line-height: 1.45;">
                    Learn how academic pressures, sleep rhythms, and study habits shape your emotional baseline.
                </p>
            </div>
            <div style="background: #FFFFFF; border-radius: 14px; padding: 16px; border: 1px solid rgba(139, 92, 246, 0.12); box-shadow: 0 4px 12px rgba(109, 67, 198, 0.03);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="background: {LAVENDER}; color: {PRIMARY_VIOLET}; font-weight: 800; font-size: 0.8rem; width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">2</span>
                    <strong style="color: {PRIMARY_VIOLET}; font-size: 0.95rem;">DISCOVER</strong>
                </div>
                <p style="font-size: 0.8rem; color: #475569; margin: 0; line-height: 1.45;">
                    Complete the 3 to 5 minute questionnaire to reveal explainable ML risk indicators and lifestyle frictions.
                </p>
            </div>
            <div style="background: #FFFFFF; border-radius: 14px; padding: 16px; border: 1px solid rgba(139, 92, 246, 0.12); box-shadow: 0 4px 12px rgba(109, 67, 198, 0.03);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="background: {LAVENDER}; color: {PRIMARY_VIOLET}; font-weight: 800; font-size: 0.8rem; width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">3</span>
                    <strong style="color: {PRIMARY_VIOLET}; font-size: 0.95rem;">ACT</strong>
                </div>
                <p style="font-size: 0.8rem; color: #475569; margin: 0; line-height: 1.45;">
                    Choose small, science-backed lifestyle micro-habits in the interactive Wellness Planner.
                </p>
            </div>
            <div style="background: #FFFFFF; border-radius: 14px; padding: 16px; border: 1px solid rgba(139, 92, 246, 0.12); box-shadow: 0 4px 12px rgba(109, 67, 198, 0.03);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="background: {LAVENDER}; color: {PRIMARY_VIOLET}; font-weight: 800; font-size: 0.8rem; width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">4</span>
                    <strong style="color: {PRIMARY_VIOLET}; font-size: 0.95rem;">IMPROVE</strong>
                </div>
                <p style="font-size: 0.8rem; color: #475569; margin: 0; line-height: 1.45;">
                    Check off daily commitments and track session wellbeing progress privately and securely.
                </p>
            </div>
        </div>
    </div>
    """

def render_privacy_card() -> str:
    """Render standardized student privacy, data minimization & server-session statement."""
    return f"""
    <div style="background: #FFFFFF; border-radius: 16px; padding: 20px 24px; border: 1px solid rgba(139, 92, 246, 0.16); box-shadow: 0 6px 20px rgba(109, 67, 198, 0.04); margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <span style="font-size: 1.3rem;">🛡️</span>
            <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: {PRIMARY_VIOLET};">
                Student Privacy, Data Minimization & Session Scope Statement
            </h4>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; font-size: 0.83rem; color: #475569; line-height: 1.5;">
            <div>
                <strong style="color: {MAIN_TEXT}; display: block; margin-bottom: 2px;">🔒 Server Session-Only Memory</strong>
                Assessment responses, habit progress, and results are held in Streamlit session-associated server memory during your active interaction. Inspection of application code confirmed no persistent writes to disk or databases in the core modules.
            </div>
            <div>
                <strong style="color: {MAIN_TEXT}; display: block; margin-bottom: 2px;">🚫 Zero Account Credentials</strong>
                No student names, student IDs, emails, phone numbers, or passwords are requested, verified, or stored by the application.
            </div>
            <div>
                <strong style="color: {MAIN_TEXT}; display: block; margin-bottom: 2px;">☁️ Zero Cloud Synchronization</strong>
                Inference and habit scoring run on the active application server. Inspection of application code confirmed no personal responses are uploaded to external cloud endpoints.
            </div>
            <div>
                <strong style="color: {MAIN_TEXT}; display: block; margin-bottom: 2px;">🗑️ Explicit Reset & Server Restarts</strong>
                Clicking 'Clear Session Data' resets all user-specific assessment and progress records immediately. If the server process restarts, all active in-memory session states are cleared. (Browser closures disconnect the session, which expires per server timeout).
            </div>
            <div>
                <strong style="color: {MAIN_TEXT}; display: block; margin-bottom: 2px;">🩺 Educational & Non-Clinical Scope</strong>
                Mindora produces experimental model outputs associated with survey datasets and self-care micro-habits. It does not provide clinical diagnosis, medical evaluation, or treatment.
            </div>
        </div>
    </div>
    """

def render_empty_state(icon: str, title: str, description: str, hint: str = "") -> str:
    """Render a clean, encouraging empty-state card."""
    hint_html = f'<p style="font-size: 0.8rem; color: {PRIMARY_VIOLET}; font-weight: 600; margin-top: 8px;">{hint}</p>' if hint else ''
    return f"""
    <div style="background: #FFFFFF; border: 2px dashed rgba(139, 92, 246, 0.25); border-radius: 18px; padding: 36px 24px; text-align: center; margin: 20px 0;">
        <div style="font-size: 2.6rem; margin-bottom: 12px;">{icon}</div>
        <h4 style="font-size: 1.15rem; font-weight: 700; color: {MAIN_TEXT}; margin-bottom: 6px;">{title}</h4>
        <p style="font-size: 0.88rem; color: #64748B; max-width: 500px; margin: 0 auto; line-height: 1.5;">{description}</p>
        {hint_html}
    </div>
    """

