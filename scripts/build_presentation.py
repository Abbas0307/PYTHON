"""
scripts/build_presentation.py
Generates the comprehensive university-level PowerPoint presentation for Mindora.
Strictly adheres to docs/ACADEMIC_SUBMISSION_DOSSIER.md.
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ---------------------------------------------------------
# CONSTANTS & COLOR PALETTE
# ---------------------------------------------------------
COLOR_PRIMARY_VIOLET = RGBColor(109, 67, 198)   # #6D43C6 (Royal Violet)
COLOR_SECONDARY_PURPLE = RGBColor(139, 92, 246) # #8B5CF6 (Purple Accent)
COLOR_DARK_TEXT = RGBColor(36, 26, 53)          # #241A35 (Primary Dark)
COLOR_MUTED_TEXT = RGBColor(90, 80, 110)        # Slate Muted Text
COLOR_LAVENDER_BG = RGBColor(241, 235, 255)     # #F1EBFF (Soft Lavender Fill)
COLOR_LIGHT_BG = RGBColor(248, 247, 252)        # #F8F7FC (Card Fill)
COLOR_WHITE = RGBColor(255, 255, 255)           # Pure White
COLOR_BORDER = RGBColor(220, 212, 240)          # Card Outline
COLOR_EMERALD = RGBColor(5, 150, 105)           # High Recall / Positive Green
COLOR_CORAL = RGBColor(220, 38, 38)             # Crisis Alert Red

TOTAL_SLIDES = 18

def init_presentation() -> Presentation:
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    return prs

def create_base_slide(prs: Presentation, title: str, category: str, slide_num: int):
    blank_layout = prs.slide_layouts[6] # Blank
    slide = prs.slides.add_slide(blank_layout)
    
    # Background fill
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg.fill.solid()
    bg.fill.fore_color.rgb = COLOR_LIGHT_BG
    bg.line.fill.background()
    
    # Top Accent Header Bar
    top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, Inches(0.1))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = COLOR_PRIMARY_VIOLET
    top_bar.line.fill.background()
    
    # Category Pill
    pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.4), Inches(2.8), Inches(0.35))
    pill.fill.solid()
    pill.fill.fore_color.rgb = COLOR_LAVENDER_BG
    pill.line.color.rgb = COLOR_PRIMARY_VIOLET
    pill.line.width = Pt(1)
    tf_pill = pill.text_frame
    tf_pill.word_wrap = True
    tf_pill.vertical_anchor = MSO_ANCHOR.MIDDLE
    p_pill = tf_pill.paragraphs[0]
    p_pill.text = category.upper()
    p_pill.alignment = PP_ALIGN.CENTER
    p_pill.font.name = "Calibri"
    p_pill.font.size = Pt(9.5)
    p_pill.font.bold = True
    p_pill.font.color.rgb = COLOR_PRIMARY_VIOLET
    
    # Slide Title
    tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.5), Inches(0.65))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    tf_title.vertical_anchor = MSO_ANCHOR.TOP
    p_title = tf_title.paragraphs[0]
    p_title.text = title
    p_title.font.name = "Calibri"
    p_title.font.size = Pt(24)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_DARK_TEXT
    
    # Header underline rule
    rule = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.45), Inches(11.733), Inches(0.02))
    rule.fill.solid()
    rule.fill.fore_color.rgb = COLOR_BORDER
    rule.line.fill.background()
    
    # Footer
    tb_footer = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.35))
    tf_footer = tb_footer.text_frame
    tf_footer.vertical_anchor = MSO_ANCHOR.MIDDLE
    p_footer = tf_footer.paragraphs[0]
    p_footer.text = f"Mindora: Student Mental Wellness & Risk Insights Platform  |  Academic Submission & Defense  |  Slide {slide_num} of {TOTAL_SLIDES}"
    p_footer.font.name = "Calibri"
    p_footer.font.size = Pt(9)
    p_footer.font.color.rgb = COLOR_MUTED_TEXT
    
    return slide

def add_card(slide, left, top, width, height, bg_color=COLOR_WHITE, border_color=COLOR_BORDER):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    if border_color:
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
    else:
        card.line.fill.background()
    return card

def add_stat_box(slide, left, top, width, height, value_text, label_text, sublabel="", value_color=COLOR_PRIMARY_VIOLET):
    add_card(slide, left, top, width, height, bg_color=COLOR_WHITE, border_color=COLOR_BORDER)
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    
    p1 = tf.paragraphs[0]
    p1.text = value_text
    p1.alignment = PP_ALIGN.CENTER
    p1.font.name = "Calibri"
    p1.font.size = Pt(26)
    p1.font.bold = True
    p1.font.color.rgb = value_color
    
    p2 = tf.add_paragraph()
    p2.text = label_text
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = "Calibri"
    p2.font.size = Pt(11)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_DARK_TEXT
    
    if sublabel:
        p3 = tf.add_paragraph()
        p3.text = sublabel
        p3.alignment = PP_ALIGN.CENTER
        p3.font.name = "Calibri"
        p3.font.size = Pt(9)
        p3.font.color.rgb = COLOR_MUTED_TEXT

# =========================================================
# SLIDE BUILDERS (1 to 18)
# =========================================================

def build_slide_1(prs):
    """Slide 1: Title & Project Introduction"""
    blank_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(blank_layout)
    
    # Background
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg.fill.solid()
    bg.fill.fore_color.rgb = COLOR_LIGHT_BG
    bg.line.fill.background()
    
    # Center Hero Card
    card = add_card(slide, Inches(1.2), Inches(1.0), Inches(10.933), Inches(5.5), bg_color=COLOR_WHITE, border_color=COLOR_PRIMARY_VIOLET)
    
    # Title Box
    tb = slide.shapes.add_textbox(Inches(1.6), Inches(1.3), Inches(10.133), Inches(4.8))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p_badge = tf.paragraphs[0]
    p_badge.text = "ACADEMIC PROJECT DEFENSE  •  ARTIFICIAL INTELLIGENCE & HEALTHCARE"
    p_badge.font.name = "Calibri"
    p_badge.font.size = Pt(11)
    p_badge.font.bold = True
    p_badge.font.color.rgb = COLOR_SECONDARY_PURPLE
    p_badge.space_after = Pt(14)
    
    p_title = tf.add_paragraph()
    p_title.text = "MINDORA"
    p_title.font.name = "Calibri"
    p_title.font.size = Pt(44)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_PRIMARY_VIOLET
    
    p_sub = tf.add_paragraph()
    p_sub.text = "Student Mental Wellness & Depression Risk Screening Platform"
    p_sub.font.name = "Calibri"
    p_sub.font.size = Pt(20)
    p_sub.font.bold = True
    p_sub.font.color.rgb = COLOR_DARK_TEXT
    p_sub.space_after = Pt(18)
    
    p_desc = tf.add_paragraph()
    p_desc.text = (
        "An ethical, interpretable, tri-engine machine learning screening system combining "
        "calibrated gradient-boosted risk prediction, digital lifestyle habit analytics, "
        "and standardized psychometric screening (PHQ-9) with safety circuit breakers."
    )
    p_desc.font.name = "Calibri"
    p_desc.font.size = Pt(13)
    p_desc.font.color.rgb = COLOR_MUTED_TEXT
    p_desc.space_after = Pt(28)
    
    p_meta = tf.add_paragraph()
    p_meta.text = "Production Model: Calibrated XGBoost  |  Benchmark Dataset: N = 27,901  |  Explainability: SHAP TreeExplainer"
    p_meta.font.name = "Calibri"
    p_meta.font.size = Pt(11)
    p_meta.font.bold = True
    p_meta.font.color.rgb = COLOR_PRIMARY_VIOLET

def build_slide_2(prs):
    """Slide 2: Problem Statement"""
    slide = create_base_slide(prs, "Problem Statement: Collegiate Mental Health Crisis", "Context & Clinical Landscape", 2)
    
    # 3 Column Cards
    col_width = Inches(3.65)
    gap = Inches(0.39)
    top_pos = Inches(1.8)
    height = Inches(4.8)
    
    # Card 1: Escalating Prevalence
    c1 = add_card(slide, Inches(0.8), top_pos, col_width, height)
    tb1 = slide.shapes.add_textbox(Inches(0.95), top_pos + Inches(0.15), col_width - Inches(0.3), height - Inches(0.3))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "1. Escalating Distress"
    p1.font.bold = True
    p1.font.size = Pt(16)
    p1.font.color.rgb = COLOR_PRIMARY_VIOLET
    p1.space_after = Pt(10)
    
    bullets1 = [
        "Higher education students face severe academic pressures, examination distress, and career uncertainties.",
        "Compounded by circadian rhythm dysregulation, irregular sleep (< 5 hours), and financial strain.",
        "Over 50% of distressed collegiate students do not seek timely clinical counseling due to stigma and fear of academic repercussions."
    ]
    for b in bullets1:
        p = tf1.add_paragraph()
        p.text = f"•  {b}"
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_DARK_TEXT
        p.space_after = Pt(8)
        
    # Card 2: Failure of Traditional Screening
    c2 = add_card(slide, Inches(0.8) + col_width + gap, top_pos, col_width, height)
    tb2 = slide.shapes.add_textbox(Inches(0.95) + col_width + gap, top_pos + Inches(0.15), col_width - Inches(0.3), height - Inches(0.3))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = "2. Traditional Barriers"
    p2.font.bold = True
    p2.font.size = Pt(16)
    p2.font.color.rgb = COLOR_PRIMARY_VIOLET
    p2.space_after = Pt(10)
    
    bullets2 = [
        "Reactive clinical workflows: Interventions occur only after acute decompensation or examination failure.",
        "Campus counseling center bottlenecks: High student-to-counselor ratios lead to weeks of waiting.",
        "Absence of anonymous, self-directed early screening tools to help students recognize vulnerability indicators early."
    ]
    for b in bullets2:
        p = tf2.add_paragraph()
        p.text = f"•  {b}"
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_DARK_TEXT
        p.space_after = Pt(8)
        
    # Card 3: Deficiencies in Existing ML Tools
    c3 = add_card(slide, Inches(0.8) + (col_width + gap) * 2, top_pos, col_width, height)
    tb3 = slide.shapes.add_textbox(Inches(0.95) + (col_width + gap) * 2, top_pos + Inches(0.15), col_width - Inches(0.3), height - Inches(0.3))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    p3 = tf3.paragraphs[0]
    p3.text = "3. Literature Flaws"
    p3.font.bold = True
    p3.font.size = Pt(16)
    p3.font.color.rgb = COLOR_PRIMARY_VIOLET
    p3.space_after = Pt(10)
    
    bullets3 = [
        "Target Leakage: Many published models ingest acute symptoms (suicidal ideation) as input features, inflating offline accuracy.",
        "Privacy Violations: Intrusive demands for family psychiatric histories or social media keylogging repel students.",
        "Unscientific Metric Blending: Arbitrarily combining clinical scores and survey answers into single pseudo-medical percentages."
    ]
    for b in bullets3:
        p = tf3.add_paragraph()
        p.text = f"•  {b}"
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_DARK_TEXT
        p.space_after = Pt(8)

def build_slide_3(prs):
    """Slide 3: Motivation and Objectives"""
    slide = create_base_slide(prs, "Project Motivation & Core Engineering Objectives", "Vision & Scope", 3)
    
    # Top Motivation Banner
    banner = add_card(slide, Inches(0.8), Inches(1.8), Inches(11.733), Inches(1.3), bg_color=COLOR_LAVENDER_BG, border_color=COLOR_PRIMARY_VIOLET)
    tb_b = slide.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(11.333), Inches(1.1))
    tf_b = tb_b.text_frame
    tf_b.word_wrap = True
    p_b1 = tf_b.paragraphs[0]
    p_b1.text = "CORE MOTIVATION"
    p_b1.font.bold = True
    p_b1.font.size = Pt(11)
    p_b1.font.color.rgb = COLOR_PRIMARY_VIOLET
    p_b2 = tf_b.add_paragraph()
    p_b2.text = (
        "To engineer an ethical, transparent, and non-stigmatizing screening platform that empowers students "
        "to proactively assess wellness vulnerabilities and lifestyle habits before clinical crises develop, "
        "while respecting student privacy and scientific boundaries."
    )
    p_b2.font.size = Pt(13)
    p_b2.font.bold = True
    p_b2.font.color.rgb = COLOR_DARK_TEXT
    
    # 4 Objective Cards
    card_w = Inches(2.72)
    card_gap = Inches(0.28)
    card_top = Inches(3.35)
    card_h = Inches(3.3)
    
    objs = [
        ("Objective 1", "Ethical Data Sanitization", "Eliminate target-leaking tokens and intrusive personal identifiers from public benchmark datasets, retaining 10 clean study/lifestyle features."),
        ("Objective 2", "Methodological Rigor", "Benchmark Logistic Regression, Random Forest, and XGBoost using strict 70/15/15 stratified partitioning, selecting models solely on validation data."),
        ("Objective 3", "Segregated Tri-Engine", "Isolate Machine Learning risk prediction, Digital Lifestyle analytics, and Standardized PHQ-9 screening into three independent analytical modules."),
        ("Objective 4", "Transparent XAI & Safety", "Integrate local Tree SHAP feature attributions for personalized explanations and implement an unconditional emergency crisis override.")
    ]
    
    for i, (tag, title, desc) in enumerate(objs):
        pos_x = Inches(0.8) + i * (card_w + card_gap)
        c = add_card(slide, pos_x, card_top, card_w, card_h)
        tb = slide.shapes.add_textbox(pos_x + Inches(0.15), card_top + Inches(0.15), card_w - Inches(0.3), card_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        pt = tf.paragraphs[0]
        pt.text = tag.upper()
        pt.font.bold = True
        pt.font.size = Pt(10)
        pt.font.color.rgb = COLOR_SECONDARY_PURPLE
        pt.space_after = Pt(4)
        
        ph = tf.add_paragraph()
        ph.text = title
        ph.font.bold = True
        ph.font.size = Pt(14)
        ph.font.color.rgb = COLOR_DARK_TEXT
        ph.space_after = Pt(8)
        
        pd = tf.add_paragraph()
        pd.text = desc
        pd.font.size = Pt(11)
        pd.font.color.rgb = COLOR_MUTED_TEXT

def build_slide_4(prs):
    """Slide 4: Existing System and Limitations"""
    slide = create_base_slide(prs, "Existing Systems vs. Academic Pitfalls", "Comparative Gap Analysis", 4)
    
    # Left Card: Traditional Screening
    c_left = add_card(slide, Inches(0.8), Inches(1.8), Inches(5.7), Inches(4.8))
    tb_l = slide.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.3), Inches(4.4))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    
    pl1 = tf_l.paragraphs[0]
    pl1.text = "Limitations of Existing ML Screening Models"
    pl1.font.bold = True
    pl1.font.size = Pt(17)
    pl1.font.color.rgb = COLOR_CORAL
    pl1.space_after = Pt(12)
    
    points_l = [
        ("Target Leakage Artifacts", "Many published studies include 'Have you ever had suicidal thoughts?' as an ML input, causing ~60% of tree splits to overfit on acute depression symptoms rather than early lifestyle markers."),
        ("Data Snooping on Test Sets", "Frequent failure to maintain an untouched held-out test partition; models are tuned directly on test metrics, yielding over-optimistic accuracy claims."),
        ("Invasive Privacy Incursions", "Compulsory demands for sensitive family psychiatric histories, continuous GPS tracking, or private social media message scraping violate student confidentiality."),
        ("Spurious Score Blending", "Conflating psychometric questionnaires (e.g. PHQ-9) with lifestyle questionnaires and ML probabilities into single unscientific percentages.")
    ]
    for h, d in points_l:
        p = tf_l.add_paragraph()
        p.text = f"•  {h}: "
        p.font.bold = True
        p.font.size = Pt(11.5)
        p.font.color.rgb = COLOR_DARK_TEXT
        
        # append description
        run = p.add_run()
        run.text = d
        run.font.bold = False
        run.font.color.rgb = COLOR_MUTED_TEXT
        p.space_after = Pt(8)
        
    # Right Card: The Consequence
    c_right = add_card(slide, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.8), bg_color=COLOR_LAVENDER_BG)
    tb_r = slide.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.333), Inches(4.4))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    
    pr1 = tf_r.paragraphs[0]
    pr1.text = "The Real-World Consequences"
    pr1.font.bold = True
    pr1.font.size = Pt(17)
    pr1.font.color.rgb = COLOR_PRIMARY_VIOLET
    pr1.space_after = Pt(14)
    
    cons = [
        ("Complete Inefficacy in Early Stages", "A model relying on acute symptoms cannot flag a student who is developing academic burnout or sleep deprivation before severe depression sets in."),
        ("Student Reluctance & Platform Rejection", "Students refuse to use tools that collect permanent records, fear disciplinary consequences, or present opaque, unexplained 'high risk' labels."),
        ("Clinical Misinformation & Safety Risks", "Falsely labeling a healthy student as clinically depressed or generating automated responses during life-threatening crises without clinical routing puts lives at risk."),
        ("Unverified Causal Assertions", "Mistaking observational survey correlations for proven medical causality misguides student intervention strategies.")
    ]
    for h, d in cons:
        p = tf_r.add_paragraph()
        p.text = f"▶  {h}: "
        p.font.bold = True
        p.font.size = Pt(11.5)
        p.font.color.rgb = COLOR_DARK_TEXT
        
        run = p.add_run()
        run.text = d
        run.font.bold = False
        run.font.color.rgb = COLOR_MUTED_TEXT
        p.space_after = Pt(8)

def build_slide_5(prs):
    """Slide 5: Proposed Mindora Solution"""
    slide = create_base_slide(prs, "Proposed Solution: The Mindora Architecture", "Platform Innovation", 5)
    
    # Top Summary
    top_c = add_card(slide, Inches(0.8), Inches(1.75), Inches(11.733), Inches(1.0), bg_color=COLOR_WHITE)
    tb_t = slide.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(11.333), Inches(0.8))
    tf_t = tb_t.text_frame
    tf_t.word_wrap = True
    pt = tf_t.paragraphs[0]
    pt.text = "Mindora introduces a principled, tri-engine paradigm designed for student trust, ethical AI, and actionable wellness insights."
    pt.font.bold = True
    pt.font.size = Pt(13)
    pt.font.color.rgb = COLOR_PRIMARY_VIOLET
    
    # 3 Pillar Cards
    card_w = Inches(3.65)
    gap = Inches(0.39)
    top_pos = Inches(2.95)
    h = Inches(3.85)
    
    pillars = [
        ("ENGINE 1", "Calibrated Public ML", [
            "Trained strictly on 10 non-leaking demographic and study features ($N=27,901$).",
            "Preprocessed XGBoost model with 5-fold cross-validated sigmoid calibration.",
            "Outputs calibrated risk probability and tier.",
            "Local explainability powered by SHAP TreeExplainer."
        ], COLOR_PRIMARY_VIOLET),
        ("ENGINE 2", "Digital Lifestyle Analytics", [
            "Evaluates daily smartphone & social media hours.",
            "Assesses bedtime blue-light usage and compulsive notification checking habits.",
            "Computes Digital Friction Index (0-10) and Lifestyle Rhythm Score (0-10).",
            "Provides actionable non-clinical lifestyle hygiene guidance."
        ], COLOR_SECONDARY_PURPLE),
        ("ENGINE 3", "Psychometric PHQ-9 & Safety", [
            "Standardized 9-question Patient Health Questionnaire screening instrument ($0-27$).",
            "Validated clinical severity banding (Minimal, Mild, Moderate, Severe).",
            "Unconditional Crisis Circuit Breaker on Item 9 (thoughts of self-harm).",
            "Immediate routing to Tele-MANAS (14416) & national emergency lifelines."
        ], COLOR_CORAL)
    ]
    
    for i, (badge, title, items, b_color) in enumerate(pillars):
        px = Inches(0.8) + i * (card_w + gap)
        c = add_card(slide, px, top_pos, card_w, h)
        tb = slide.shapes.add_textbox(px + Inches(0.15), top_pos + Inches(0.15), card_w - Inches(0.3), h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        pb = tf.paragraphs[0]
        pb.text = badge
        pb.font.bold = True
        pb.font.size = Pt(10)
        pb.font.color.rgb = b_color
        pb.space_after = Pt(4)
        
        ptit = tf.add_paragraph()
        ptit.text = title
        ptit.font.bold = True
        ptit.font.size = Pt(15)
        ptit.font.color.rgb = COLOR_DARK_TEXT
        ptit.space_after = Pt(10)
        
        for it in items:
            p = tf.add_paragraph()
            p.text = f"•  {it}"
            p.font.size = Pt(11.5)
            p.font.color.rgb = COLOR_MUTED_TEXT
            p.space_after = Pt(6)

def build_slide_6(prs):
    """Slide 6: Dataset Description and Source"""
    slide = create_base_slide(prs, "Dataset Provenance, Characteristics & Target Definition", "Data Foundations", 6)
    
    # 4 Stat Callout Boxes
    add_stat_box(slide, Inches(0.8), Inches(1.8), Inches(2.7), Inches(1.2), "27,901", "Total Student Records", "Public Benchmark Dataset")
    add_stat_box(slide, Inches(3.8), Inches(1.8), Inches(2.7), Inches(1.2), "0 / 0", "Duplicates / Missing Values", "100% Complete Survey Cohort")
    add_stat_box(slide, Inches(6.8), Inches(1.8), Inches(2.7), Inches(1.2), "58.07%", "Positive Target Ratio", "16,202 Self-Reported Cases")
    add_stat_box(slide, Inches(9.8), Inches(1.8), Inches(2.733), Inches(1.2), "41.93%", "Negative Target Ratio", "11,699 Negative Cases")
    
    # Bottom 2 Cards
    c_left = add_card(slide, Inches(0.8), Inches(3.25), Inches(5.7), Inches(3.5))
    tb_l = slide.shapes.add_textbox(Inches(1.0), Inches(3.4), Inches(5.3), Inches(3.2))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    
    pl = tf_l.paragraphs[0]
    pl.text = "Dataset Provenance & Cohort Details"
    pl.font.bold = True
    pl.font.size = Pt(15)
    pl.font.color.rgb = COLOR_PRIMARY_VIOLET
    pl.space_after = Pt(8)
    
    d_points = [
        "Dataset Source: Curated public benchmark dataset (`urmah/student-depression-analysis`) hosted via Hugging Face.",
        "Zero Custom Student Harvesting: No private student data was extracted or collected; trained entirely on sanitized public benchmark data.",
        "Target Variable: Binary indicator `Depression` (0 = No, 1 = Yes).",
        "Scientific Clarification: The target represents self-reported survey indicators; it does NOT constitute a clinically confirmed diagnosis.",
        "Demographic Spread: Diverse educational disciplines (B.Tech, BSc, BA, MBBS, B.Pharm, MA, etc.) with ages spanning 16–35 years."
    ]
    for dp in d_points:
        p = tf_l.add_paragraph()
        p.text = f"•  {dp}"
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_DARK_TEXT
        p.space_after = Pt(5)
        
    c_right = add_card(slide, Inches(6.8), Inches(3.25), Inches(5.733), Inches(3.5), bg_color=COLOR_LAVENDER_BG)
    tb_r = slide.shapes.add_textbox(Inches(7.0), Inches(3.4), Inches(5.333), Inches(3.2))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    
    pr = tf_r.paragraphs[0]
    pr.text = "Critical Scientific Boundaries"
    pr.font.bold = True
    pr.font.size = Pt(15)
    pr.font.color.rgb = COLOR_PRIMARY_VIOLET
    pr.space_after = Pt(8)
    
    s_points = [
        "Cross-Sectional Limitation: Single point-in-time survey snapshot without multi-semester longitudinal tracking.",
        "Correlation != Causation: Features correlate statistically with self-reported depression indicators but do not prove biological etiology.",
        "Subjective Likert Metrics: Academic Pressure (1–5) and Financial Stress (1–5) reflect student perception.",
        "Zero-Persistence Session Architecture: All user inputs during app usage exist only in volatile RAM (`st.session_state`) and are deleted upon tab closure."
    ]
    for sp in s_points:
        p = tf_r.add_paragraph()
        p.text = f"▶  {sp}"
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_DARK_TEXT
        p.space_after = Pt(5)

def build_slide_7(prs):
    """Slide 7: Data Preprocessing and Feature Selection"""
    slide = create_base_slide(prs, "Feature Sanitization & Production Preprocessing Pipeline", "Feature Engineering", 7)
    
    # Left Card: Sanitization & Leakage Removal Table
    c_left = add_card(slide, Inches(0.8), Inches(1.8), Inches(5.7), Inches(4.9))
    tb_l = slide.shapes.add_textbox(Inches(0.95), Inches(1.95), Inches(5.4), Inches(4.6))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    
    pl = tf_l.paragraphs[0]
    pl.text = "Ethical Feature Sanitization Protocol"
    pl.font.bold = True
    pl.font.size = Pt(15)
    pl.font.color.rgb = COLOR_PRIMARY_VIOLET
    pl.space_after = Pt(8)
    
    removals = [
        ("Have you ever had suicidal thoughts?", "REMOVED (Exp 1 Leakage)", "Contributed ~60% of tree split decisions in naive baseline. Suicidal ideation is an acute symptom, not an early lifestyle risk factor."),
        ("Family History of Mental Illness", "REMOVED (Exp 2 Privacy)", "Eliminated to safeguard student privacy and avoid unverified familial genetic determinism."),
        ("ID, City, Profession, Work Pressure", "REMOVED (Irrelevant)", "Metadata and non-student vocational attributes purged from feature space.")
    ]
    for f, status, reason in removals:
        p = tf_l.add_paragraph()
        p.text = f"•  {f}"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_CORAL
        
        p_sub = tf_l.add_paragraph()
        p_sub.text = f"    [{status}] {reason}"
        p_sub.font.size = Pt(10)
        p_sub.font.color.rgb = COLOR_MUTED_TEXT
        p_sub.space_after = Pt(6)
        
    # Right Card: The 10 Approved Features & Preprocessing Pipeline
    c_right = add_card(slide, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.9))
    tb_r = slide.shapes.add_textbox(Inches(6.95), Inches(1.95), Inches(5.4), Inches(4.6))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    
    pr = tf_r.paragraphs[0]
    pr.text = "10 Approved Features & ColumnTransformer"
    pr.font.bold = True
    pr.font.size = Pt(15)
    pr.font.color.rgb = COLOR_PRIMARY_VIOLET
    pr.space_after = Pt(8)
    
    pr1 = tf_r.add_paragraph()
    pr1.text = "6 Numerical Features (StandardScaler - fitted on X_train only):"
    pr1.font.bold = True
    pr1.font.size = Pt(11)
    pr1.font.color.rgb = COLOR_DARK_TEXT
    
    pr1_sub = tf_r.add_paragraph()
    pr1_sub.text = "  1. Academic Pressure (1-5)  |  2. Financial Stress (1-5)\n  3. Study Satisfaction (1-5)  |  4. CGPA (0.0-10.0)\n  5. Work/Study Hours (0-16)  |  6. Age (16-35)"
    pr1_sub.font.size = Pt(10.5)
    pr1_sub.font.color.rgb = COLOR_MUTED_TEXT
    pr1_sub.space_after = Pt(8)
    
    pr2 = tf_r.add_paragraph()
    pr2.text = "4 Categorical Features (OneHotEncoder - handle_unknown='ignore'):"
    pr2.font.bold = True
    pr2.font.size = Pt(11)
    pr2.font.color.rgb = COLOR_DARK_TEXT
    
    pr2_sub = tf_r.add_paragraph()
    pr2_sub.text = "  7. Gender (Male, Female)  |  8. Sleep Duration (<5h, 5-6h, 7-8h, >8h)\n  9. Dietary Habits (Healthy, Moderate, Unhealthy)\n  10. Degree (B.Tech, BSc, BA, MBBS, B.Pharm, MA, etc.)"
    pr2_sub.font.size = Pt(10.5)
    pr2_sub.font.color.rgb = COLOR_MUTED_TEXT
    pr2_sub.space_after = Pt(8)
    
    pr3 = tf_r.add_paragraph()
    pr3.text = "Transformed Dimensionality: 45 numerical dimensions feeding ML."
    pr3.font.bold = True
    pr3.font.size = Pt(11)
    pr3.font.color.rgb = COLOR_EMERALD

def build_slide_8(prs):
    """Slide 8: ML Algorithms Compared"""
    slide = create_base_slide(prs, "Machine Learning Algorithms Benchmarked", "Candidate Models", 8)
    
    col_w = Inches(3.65)
    gap = Inches(0.39)
    top_pos = Inches(1.8)
    h = Inches(4.9)
    
    models = [
        ("1. Logistic Regression", "Linear Regularized Baseline", [
            "Implementation: `LogisticRegression(C=1.0, max_iter=1500, class_weight='balanced')`.",
            "Strengths: High interpretability, linear decision boundary, fast convergence.",
            "Weakness: Incapable of capturing non-linear interactions between sleep deprivation, academic pressure, and financial stress.",
            "Validation Accuracy: 79.16%",
            "Validation Recall: 79.51%",
            "Validation F1-Score: 0.8171"
        ], COLOR_DARK_TEXT),
        ("2. Random Forest", "Ensemble Bagging Architecture", [
            "Implementation: `RandomForestClassifier(n_estimators=150, max_depth=10, class_weight='balanced')`.",
            "Strengths: Reduces variance through bootstrap aggregation, robust to outliers.",
            "Weakness: Sub-optimal recall compared to boosting; slower inference latency with deep trees.",
            "Validation Accuracy: 79.38%",
            "Validation Recall: 80.65%",
            "Validation F1-Score: 0.8208"
        ], COLOR_SECONDARY_PURPLE),
        ("3. XGBoost Classifier", "Gradient Boosted Trees (Selected)", [
            "Implementation: `XGBClassifier(n_estimators=120, max_depth=5, learning_rate=0.08, subsample=0.85)`.",
            "Strengths: Iterative gradient boosting on pseudo-residuals; superior recall and handling of feature collinearity.",
            "Compatibility: Native integration with SHAP TreeExplainer for exact Shapley values.",
            "Validation Accuracy: 79.78%",
            "Validation Recall: 84.86% (Highest)",
            "Validation F1-Score: 0.8309 (Highest)"
        ], COLOR_PRIMARY_VIOLET)
    ]
    
    for i, (m_title, m_sub, points, b_color) in enumerate(models):
        px = Inches(0.8) + i * (col_w + gap)
        c = add_card(slide, px, top_pos, col_w, h)
        tb = slide.shapes.add_textbox(px + Inches(0.15), top_pos + Inches(0.15), col_w - Inches(0.3), h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        pt = tf.paragraphs[0]
        pt.text = m_title
        pt.font.bold = True
        pt.font.size = Pt(15)
        pt.font.color.rgb = b_color
        
        ps = tf.add_paragraph()
        ps.text = m_sub
        ps.font.bold = True
        ps.font.size = Pt(10.5)
        ps.font.color.rgb = COLOR_MUTED_TEXT
        ps.space_after = Pt(10)
        
        for pt_str in points:
            p = tf.add_paragraph()
            p.text = f"•  {pt_str}"
            p.font.size = Pt(11)
            p.font.color.rgb = COLOR_DARK_TEXT
            p.space_after = Pt(6)

def build_slide_9(prs):
    """Slide 9: Model Training and Validation Methodology"""
    slide = create_base_slide(prs, "Model Training & Validation-Only Selection Protocol", "Methodological Rigor", 9)
    
    # 3 Split Stat Boxes
    add_stat_box(slide, Inches(0.8), Inches(1.8), Inches(3.65), Inches(1.2), "70%  (19,530)", "Training Partition", "Preprocessor Fitting & Model Training", COLOR_PRIMARY_VIOLET)
    add_stat_box(slide, Inches(4.84), Inches(1.8), Inches(3.65), Inches(1.2), "15%  (4,185)", "Validation Partition", "Hyperparameter Tuning & Model Selection", COLOR_SECONDARY_PURPLE)
    add_stat_box(slide, Inches(8.88), Inches(1.8), Inches(3.65), Inches(1.2), "15%  (4,186)", "Held-Out Test Partition", "Locked & Evaluated Strictly Once", COLOR_EMERALD)
    
    # Bottom Card: Validation Benchmark Table & Rationale
    c_bot = add_card(slide, Inches(0.8), Inches(3.25), Inches(11.733), Inches(3.5))
    tb_b = slide.shapes.add_textbox(Inches(1.0), Inches(3.4), Inches(11.333), Inches(3.2))
    tf_b = tb_b.text_frame
    tf_b.word_wrap = True
    
    pb = tf_b.paragraphs[0]
    pb.text = "Validation Set Benchmark & Selection Rationale"
    pb.font.bold = True
    pb.font.size = Pt(15)
    pb.font.color.rgb = COLOR_PRIMARY_VIOLET
    pb.space_after = Pt(6)
    
    rows = [
        ("Logistic Regression", "0.7916", "0.8404", "0.7951", "0.8171", "0.8712", "0.1451", "Baseline"),
        ("Random Forest", "0.7938", "0.8355", "0.8065", "0.8208", "0.8697", "0.1527", "Discarded (Lower Recall)"),
        ("XGBoost Classifier", "0.7978", "0.8140", "0.8486", "0.8309", "0.8722", "0.1411", "SELECTED BEST MODEL")
    ]
    
    table_shape = slide.shapes.add_table(4, 8, Inches(1.0), Inches(3.8), Inches(11.333), Inches(1.6))
    table = table_shape.table
    table.columns[0].width = Inches(2.3)
    table.columns[1].width = Inches(1.1)
    table.columns[2].width = Inches(1.1)
    table.columns[3].width = Inches(1.1)
    table.columns[4].width = Inches(1.1)
    table.columns[5].width = Inches(1.1)
    table.columns[6].width = Inches(1.1)
    table.columns[7].width = Inches(2.433)
    
    headers = ["Model", "Accuracy", "Precision", "Recall", "F1-Score", "ROC-AUC", "Brier", "Selection Decision"]
    for j, h in enumerate(headers):
        cell = table.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = COLOR_PRIMARY_VIOLET
        cell.text = h
        p = cell.text_frame.paragraphs[0]
        p.font.name = "Calibri"
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_WHITE
        p.alignment = PP_ALIGN.CENTER
        
    for i, r_data in enumerate(rows):
        for j, val in enumerate(r_data):
            cell = table.cell(i + 1, j)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.name = "Calibri"
            p.font.size = Pt(10)
            if i == 2:
                p.font.bold = True
                p.font.color.rgb = COLOR_PRIMARY_VIOLET
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_LAVENDER_BG
            else:
                p.font.color.rgb = COLOR_DARK_TEXT
            p.alignment = PP_ALIGN.LEFT if j in [0, 7] else PP_ALIGN.CENTER
            
    # Subtext rationale
    tb_sub = slide.shapes.add_textbox(Inches(1.0), Inches(5.6), Inches(11.333), Inches(1.0))
    tf_sub = tb_sub.text_frame
    tf_sub.word_wrap = True
    ps = tf_sub.paragraphs[0]
    ps.text = (
        "Strict Isolation Protocol: Model selection was performed solely on the independent validation partition. "
        "XGBoost was chosen because student wellness screening prioritizes Recall (84.86%) and F1-Score (0.8309) "
        "to minimize false negatives without data snooping on the test set."
    )
    ps.font.size = Pt(10.5)
    ps.font.color.rgb = COLOR_MUTED_TEXT

def build_slide_10(prs):
    """Slide 10: Final Model Evaluation Metrics"""
    slide = create_base_slide(prs, "Final Test Set Metrics & Calibration Honesty", "Empirical Evaluation", 10)
    
    # 5 Big Stat Boxes for Calibrated XGBoost
    add_stat_box(slide, Inches(0.8), Inches(1.8), Inches(2.18), Inches(1.2), "79.69%", "Test Accuracy", "3,336 / 4,186 Correct", COLOR_PRIMARY_VIOLET)
    add_stat_box(slide, Inches(3.18), Inches(1.8), Inches(2.18), Inches(1.2), "81.45%", "Test Precision", "TP / (TP + FP)", COLOR_PRIMARY_VIOLET)
    add_stat_box(slide, Inches(5.56), Inches(1.8), Inches(2.18), Inches(1.2), "84.58%", "Test Recall", "TP / (TP + FN)", COLOR_EMERALD)
    add_stat_box(slide, Inches(7.94), Inches(1.8), Inches(2.18), Inches(1.2), "0.8299", "Test F1-Score", "Harmonic Mean", COLOR_PRIMARY_VIOLET)
    add_stat_box(slide, Inches(10.32), Inches(1.8), Inches(2.213), Inches(1.2), "0.8676", "Test ROC-AUC", "Discriminative Ability", COLOR_PRIMARY_VIOLET)
    
    # Left Card: Candidate Model Comparison on Untouched Test Set
    c_left = add_card(slide, Inches(0.8), Inches(3.25), Inches(5.7), Inches(3.5))
    tb_l = slide.shapes.add_textbox(Inches(0.95), Inches(3.35), Inches(5.4), Inches(3.3))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    
    pl = tf_l.paragraphs[0]
    pl.text = "Untouched Test Set Evaluation (N = 4,186)"
    pl.font.bold = True
    pl.font.size = Pt(14)
    pl.font.color.rgb = COLOR_PRIMARY_VIOLET
    pl.space_after = Pt(6)
    
    t_lines = [
        "Logistic Regression: Acc = 78.95%, Recall = 79.23%, F1 = 0.8151, ROC-AUC = 0.8664",
        "Random Forest:       Acc = 78.55%, Recall = 79.48%, F1 = 0.8127, ROC-AUC = 0.8627",
        "Base XGBoost:        Acc = 79.57%, Recall = 84.37%, F1 = 0.8287, ROC-AUC = 0.8672",
        "Calibrated XGBoost:  Acc = 79.69%, Recall = 84.58%, F1 = 0.8299, ROC-AUC = 0.8676",
        "Specificity:         72.80% (1,263 true negatives / 1,735 actual negatives)"
    ]
    for tl in t_lines:
        p = tf_l.add_paragraph()
        p.text = f"•  {tl}"
        p.font.size = Pt(10)
        p.font.color.rgb = COLOR_DARK_TEXT
        p.space_after = Pt(4)
        
    # Right Card: Scientific Honesty on Calibration & Brier Score
    c_right = add_card(slide, Inches(6.8), Inches(3.25), Inches(5.733), Inches(3.5), bg_color=COLOR_LAVENDER_BG)
    tb_r = slide.shapes.add_textbox(Inches(6.95), Inches(3.35), Inches(5.4), Inches(3.3))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    
    pr = tf_r.paragraphs[0]
    pr.text = "Scientific Honesty: Calibration & Brier Score"
    pr.font.bold = True
    pr.font.size = Pt(14)
    pr.font.color.rgb = COLOR_PRIMARY_VIOLET
    pr.space_after = Pt(6)
    
    cal_points = [
        "Uncalibrated Base XGBoost Brier Score: 0.1441",
        "Calibrated Production Model Brier Score: 0.1448",
        "Factual Finding: Applying CalibratedClassifierCV (method='sigmoid', cv=5 on training data) slightly worsened the Brier score on the test set (+0.0007).",
        "No False Claims: We explicitly do NOT claim that calibration improved accuracy or guarantees reliable probabilities.",
        "Engineering Value: Sigmoid calibration maps raw log-odds into smooth, continuous probabilities, preventing extreme confidence at risk tier thresholds (<40% Low, 40-70% Moderate, >70% High)."
    ]
    for cp in cal_points:
        p = tf_r.add_paragraph()
        p.text = f"▶  {cp}"
        p.font.size = Pt(10)
        p.font.color.rgb = COLOR_DARK_TEXT
        p.space_after = Pt(4)

def build_slide_11(prs):
    """Slide 11: Confusion Matrix and ROC-AUC"""
    slide = create_base_slide(prs, "Confusion Matrix & Discriminative Analysis", "Diagnostic Verification", 11)
    
    # Left Column: Image of Confusion Matrix if exists, else table
    cm_img_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "evaluation", "confusion_matrix.png")
    
    if os.path.exists(cm_img_path):
        c_img = add_card(slide, Inches(0.8), Inches(1.8), Inches(6.0), Inches(4.9))
        slide.shapes.add_picture(cm_img_path, Inches(0.95), Inches(1.95), width=Inches(5.7))
    else:
        c_img = add_card(slide, Inches(0.8), Inches(1.8), Inches(6.0), Inches(4.9))
        tb = slide.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.6), Inches(4.5))
        tb.text_frame.text = "Confusion Matrix Plot"
        
    # Right Column: Verified Numerical Matrix A Breakdown
    c_right = add_card(slide, Inches(7.1), Inches(1.8), Inches(5.433), Inches(4.9))
    tb_r = slide.shapes.add_textbox(Inches(7.25), Inches(1.95), Inches(5.1), Inches(4.6))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    
    pr = tf_r.paragraphs[0]
    pr.text = "Verified Matrix A: Production Calibrated Model"
    pr.font.bold = True
    pr.font.size = Pt(15)
    pr.font.color.rgb = COLOR_PRIMARY_VIOLET
    pr.space_after = Pt(8)
    
    m_breakdown = [
        ("True Negatives (TN)", "1,263", "Non-depressed students correctly classified as low/moderate risk."),
        ("False Positives (FP)", "472", "Type I Error: Healthy students flagged for wellness review."),
        ("False Negatives (FN)", "378", "Type II Error: Distressed students classified as low risk."),
        ("True Positives (TP)", "2,073", "Distressed students correctly identified for early support."),
        ("Total Held-Out Test Set", "4,186", "Strictly evaluated once without data snooping.")
    ]
    for tag, val, desc in m_breakdown:
        p = tf_r.add_paragraph()
        p.text = f"•  {tag}: {val}  —  "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_DARK_TEXT
        
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.size = Pt(10)
        run.font.color.rgb = COLOR_MUTED_TEXT
        p.space_after = Pt(5)
        
    p_disc = tf_r.add_paragraph()
    p_disc.text = (
        "Resolution of Prior Draft Discrepancy:\n"
        "Matrix B (`[[1280, 475], [375, 2056]]`) was an unverified drafting approximation that yielded "
        "precision of 81.23% (mismatching 81.45%). Matrix A (`[[1263, 472], [378, 2073]]`) is the verified, "
        "exact confusion matrix produced by `best_model.pkl` on the untouched test set."
    )
    p_disc.font.size = Pt(9.5)
    p_disc.font.color.rgb = COLOR_PRIMARY_VIOLET

def build_slide_12(prs):
    """Slide 12: Three-Engine Architecture"""
    slide = create_base_slide(prs, "The Tri-Engine Segregated Architecture", "System Architecture", 12)
    
    # 3 Large Stacked Cards or Columns
    col_w = Inches(3.65)
    gap = Inches(0.39)
    top_pos = Inches(1.8)
    h = Inches(4.9)
    
    engines = [
        ("ENGINE 1", "Public Dataset ML", [
            "Input: Strictly 10 academic and demographic survey features.",
            "Mechanism: ColumnTransformer + Calibrated XGBoost.",
            "Output: Academic depression vulnerability risk percentage and tier (Low, Moderate, High).",
            "Explainability: Local SHAP TreeExplainer factor attributions.",
            "Independence: Unit tests confirm zero change in output when PHQ-9 or digital telemetry vary."
        ], COLOR_PRIMARY_VIOLET),
        ("ENGINE 2", "Digital Lifestyle Analytics", [
            "Input: 5 digital telemetry responses (phone hours, social media hours, night browsing, social comparison).",
            "Mechanism: Deterministic behavioral scoring model.",
            "Output: Digital Friction Index (0-10) and Lifestyle Rhythm Score (0-10).",
            "Scope: Evaluates behavioral screen habits and sleep interference without generating pseudo-medical risk."
        ], COLOR_SECONDARY_PURPLE),
        ("ENGINE 3", "Psychometric PHQ-9 & Crisis", [
            "Input: Standardized 9-item Patient Health Questionnaire.",
            "Mechanism: Clinical psychometric summation scoring (0-27).",
            "Output: Severity classification (Minimal, Mild, Moderate, Severe).",
            "Safety Override: Immediate rule-based crisis banner when Item 9 > 0, linking directly to Tele-MANAS (14416)."
        ], COLOR_CORAL)
    ]
    
    for i, (b_tag, b_title, items, col) in enumerate(engines):
        px = Inches(0.8) + i * (col_w + gap)
        c = add_card(slide, px, top_pos, col_w, h)
        tb = slide.shapes.add_textbox(px + Inches(0.15), top_pos + Inches(0.15), col_w - Inches(0.3), h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        pt = tf.paragraphs[0]
        pt.text = b_tag
        pt.font.bold = True
        pt.font.size = Pt(11)
        pt.font.color.rgb = col
        pt.space_after = Pt(2)
        
        ph = tf.add_paragraph()
        ph.text = b_title
        ph.font.bold = True
        ph.font.size = Pt(15)
        ph.font.color.rgb = COLOR_DARK_TEXT
        ph.space_after = Pt(10)
        
        for it in items:
            p = tf.add_paragraph()
            p.text = f"•  {it}"
            p.font.size = Pt(11)
            p.font.color.rgb = COLOR_MUTED_TEXT
            p.space_after = Pt(6)

def build_slide_13(prs):
    """Slide 13: SHAP Explainability"""
    slide = create_base_slide(prs, "Local Explainability via Tree SHAP (Shapley Values)", "Explainable AI (XAI)", 13)
    
    # Left Card: Theoretical Foundations
    c_left = add_card(slide, Inches(0.8), Inches(1.8), Inches(5.7), Inches(4.9))
    tb_l = slide.shapes.add_textbox(Inches(0.95), Inches(1.95), Inches(5.4), Inches(4.6))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    
    pl = tf_l.paragraphs[0]
    pl.text = "Mathematical Foundation of Tree SHAP"
    pl.font.bold = True
    pl.font.size = Pt(15)
    pl.font.color.rgb = COLOR_PRIMARY_VIOLET
    pl.space_after = Pt(8)
    
    p_eq = tf_l.add_paragraph()
    p_eq.text = "Additive Feature Attribution:\n  f(x) = φ₀ + ∑ φᵢ(x)"
    p_eq.font.bold = True
    p_eq.font.size = Pt(13)
    p_eq.font.color.rgb = COLOR_DARK_TEXT
    p_eq.space_after = Pt(8)
    
    shap_pts = [
        "Grounded in cooperative game theory: Every feature acts as a player in a coalition.",
        "Local Personalization: Global feature importance only shows average dataset impact. SHAP reveals why a specific student received a particular risk score.",
        "Exact TreeExplainer: Computes exact Shapley values in polynomial time for tree ensembles rather than sampling approximations.",
        "Actionability: Identifies modifiable risk factors (e.g., sleep duration, study hours) versus fixed attributes."
    ]
    for sp in shap_pts:
        p = tf_l.add_paragraph()
        p.text = f"•  {sp}"
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_MUTED_TEXT
        p.space_after = Pt(6)
        
    # Right Card: Verified Illustrative Synthetic Profile
    c_right = add_card(slide, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.9), bg_color=COLOR_LAVENDER_BG)
    tb_r = slide.shapes.add_textbox(Inches(6.95), Inches(1.95), Inches(5.4), Inches(4.6))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    
    pr = tf_r.paragraphs[0]
    pr.text = "Verified Execution on Synthetic Profile"
    pr.font.bold = True
    pr.font.size = Pt(15)
    pr.font.color.rgb = COLOR_PRIMARY_VIOLET
    pr.space_after = Pt(6)
    
    pr_sub = tf_r.add_paragraph()
    pr_sub.text = "Input: 21yo B.Tech male, Academic Pressure 4/5, Study Hours 8h, Sleep <5h, Diet Unhealthy.\nResult: 91.4% Calibrated Probability (Elevated Risk)"
    pr_sub.font.bold = True
    pr_sub.font.size = Pt(11)
    pr_sub.font.color.rgb = COLOR_DARK_TEXT
    pr_sub.space_after = Pt(8)
    
    attributions = [
        ("Academic Pressure", "+0.8565", "Primary risk driver"),
        ("Age (21)", "+0.5014", "Demographic vulnerability"),
        ("Dietary Habit (Unhealthy)", "+0.2989", "Elevates risk factor"),
        ("Sleep Pattern (< 5 hours)", "+0.2143", "Circadian disruption factor"),
        ("Work/Study Hours (8.0)", "+0.0918", "Study burden factor")
    ]
    for feat, s_val, note in attributions:
        p = tf_r.add_paragraph()
        p.text = f"▲  {feat}: {s_val}  ({note})"
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_PRIMARY_VIOLET
        p.space_after = Pt(3)
        
    p_note = tf_r.add_paragraph()
    p_note.text = "\n*Note: Illustrative profile executed via `src/predict.py` on the verified production pipeline."
    p_note.font.size = Pt(9)
    p_note.font.color.rgb = COLOR_MUTED_TEXT

def build_slide_14(prs):
    """Slide 14: PHQ-9 Screening and Safety Mechanism"""
    slide = create_base_slide(prs, "Standardized PHQ-9 Screening & Crisis Safety Circuit", "Psychometrics & Safety", 14)
    
    # Left Card: Standardized PHQ-9 Screening
    c_left = add_card(slide, Inches(0.8), Inches(1.8), Inches(5.7), Inches(4.9))
    tb_l = slide.shapes.add_textbox(Inches(0.95), Inches(1.95), Inches(5.4), Inches(4.6))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    
    pl = tf_l.paragraphs[0]
    pl.text = "Standardized PHQ-9 Scoring (0-27)"
    pl.font.bold = True
    pl.font.size = Pt(15)
    pl.font.color.rgb = COLOR_PRIMARY_VIOLET
    pl.space_after = Pt(8)
    
    phq_tiers = [
        ("0 - 4: Minimal or None", "Healthy baseline / general supportive guidance."),
        ("5 - 9: Mild", "Sub-threshold affective distress; lifestyle optimization."),
        ("10 - 14: Moderate", "Noticeable depressive symptomatology; counseling recommended."),
        ("15 - 19: Moderately Severe", "Active functional impairment; medical consultation advised."),
        ("20 - 27: Severe", "High depressive severity; immediate clinical care required.")
    ]
    for tier, desc in phq_tiers:
        p = tf_l.add_paragraph()
        p.text = f"•  {tier}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_DARK_TEXT
        
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = COLOR_MUTED_TEXT
        p.space_after = Pt(4)
        
    p_note = tf_l.add_paragraph()
    p_note.text = (
        "\nClinical Boundary: The PHQ-9 is a standardized screening instrument, NOT a standalone clinical diagnosis. "
        "Mindora presents scores strictly within this validated educational context."
    )
    p_note.font.size = Pt(9.5)
    p_note.font.bold = True
    p_note.font.color.rgb = COLOR_PRIMARY_VIOLET
    
    # Right Card: Emergency Crisis Override (Item 9)
    c_right = add_card(slide, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.9), bg_color=COLOR_LAVENDER_BG, border_color=COLOR_CORAL)
    tb_r = slide.shapes.add_textbox(Inches(6.95), Inches(1.95), Inches(5.4), Inches(4.6))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    
    pr = tf_r.paragraphs[0]
    pr.text = "Emergency Crisis Circuit Breaker (Item 9)"
    pr.font.bold = True
    pr.font.size = Pt(15)
    pr.font.color.rgb = COLOR_CORAL
    pr.space_after = Pt(8)
    
    crit_pts = [
        ("Trigger Condition", "Item 9 > 0 ('Thoughts that you would be better off dead or of hurting yourself')."),
        ("Immediate Client Override", "Suppresses speculative wellness suggestions to immediately render high-visibility crisis intervention resources."),
        ("Primary Indian Lifeline", "Tele-MANAS (Govt. of India): 14416 / 1800-891-4416 (24/7 Toll-Free)."),
        ("Secondary Helplines", "KIRAN Mental Health Helpline: 1800-599-0019; Befrienders Worldwide Directory."),
        ("Zero Automated Counseling", "The system never attempts to 'treat' acute self-harm ideation algorithmically; it routes users directly to professional human care.")
    ]
    for tag, desc in crit_pts:
        p = tf_r.add_paragraph()
        p.text = f"🚨  {tag}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_DARK_TEXT
        
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = COLOR_MUTED_TEXT
        p.space_after = Pt(5)

def build_slide_15(prs):
    """Slide 15: Application Screenshots and User Journey"""
    slide = create_base_slide(prs, "User Journey & Live Application Interface", "Interactive Experience", 15)
    
    # Left Card: Home Screenshot
    home_img = os.path.join(os.path.dirname(os.path.dirname(__file__)), "screenshots", "mindora_home_preview.png")
    c1 = add_card(slide, Inches(0.8), Inches(1.8), Inches(5.7), Inches(4.9))
    if os.path.exists(home_img):
        slide.shapes.add_picture(home_img, Inches(0.95), Inches(1.95), width=Inches(5.4))
    
    tb1 = slide.shapes.add_textbox(Inches(0.95), Inches(5.8), Inches(5.4), Inches(0.8))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "Home & Assessment Interface: White & royal violet 3D design, guided multi-step assessment forms."
    p1.font.size = Pt(10)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_PRIMARY_VIOLET
    
    # Right Card: Crisis Override Screenshot
    crisis_img = os.path.join(os.path.dirname(os.path.dirname(__file__)), "screenshots", "mindora_crisis_override_preview.png")
    c2 = add_card(slide, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.9))
    if os.path.exists(crisis_img):
        slide.shapes.add_picture(crisis_img, Inches(6.95), Inches(1.95), width=Inches(5.4))
        
    tb2 = slide.shapes.add_textbox(Inches(6.95), Inches(5.8), Inches(5.4), Inches(0.8))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = "Results & Crisis Override: Verified segregated cards, local SHAP attributions, and direct Tele-MANAS helpline buttons."
    p2.font.size = Pt(10)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_CORAL

def build_slide_16(prs):
    """Slide 16: Technology Stack"""
    slide = create_base_slide(prs, "Implementation Technology Stack & Architecture", "Engineering & Software", 16)
    
    col_w = Inches(2.72)
    gap = Inches(0.28)
    top_pos = Inches(1.8)
    h = Inches(4.9)
    
    stacks = [
        ("CORE RUNTIME", "Language & Environment", [
            "Python 3.12 (CPython runtime)",
            "Scikit-Learn 1.4+ (Preprocessors, pipelines, CalibratedClassifierCV)",
            "NumPy & Pandas (Vectorized operations & data handling)",
            "Joblib (Thread-safe model persistence)"
        ], COLOR_DARK_TEXT),
        ("MACHINE LEARNING", "Modeling & XAI", [
            "XGBoost 2.0+ (Extreme Gradient Boosting trees)",
            "SHAP 0.44+ (TreeExplainer for local feature attributions)",
            "Platt Sigmoid Scaling (5-fold cross-validated calibration)",
            "Stratified K-Fold partitioning (Zero test data contamination)"
        ], COLOR_PRIMARY_VIOLET),
        ("FRONTEND & UI", "Web & Visuals", [
            "Streamlit 1.32+ (Reactive, zero-database in-memory state)",
            "Altair & Matplotlib (ROC curves, calibration plots, metrics)",
            "Custom CSS Injection (White & royal violet aesthetic, 3D cards)",
            "Responsive grid layouts (5 modular application pages)"
        ], COLOR_SECONDARY_PURPLE),
        ("TESTING & QA", "Verification Suite", [
            "Pytest & Custom Unit Suites (`tests/test_engine_independence.py`)",
            "Automated assertions on feature invariance (Engine 1 vs PHQ-9)",
            "Headless Browser Subagent (Multi-page end-to-end verification)",
            "Strict schema enforcement (10 clean features)"
        ], COLOR_EMERALD)
    ]
    
    for i, (b_tag, b_title, items, col) in enumerate(stacks):
        px = Inches(0.8) + i * (col_w + gap)
        c = add_card(slide, px, top_pos, col_w, h)
        tb = slide.shapes.add_textbox(px + Inches(0.15), top_pos + Inches(0.15), col_w - Inches(0.3), h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        pt = tf.paragraphs[0]
        pt.text = b_tag
        pt.font.bold = True
        pt.font.size = Pt(10)
        pt.font.color.rgb = col
        pt.space_after = Pt(2)
        
        ph = tf.add_paragraph()
        ph.text = b_title
        ph.font.bold = True
        ph.font.size = Pt(14)
        ph.font.color.rgb = COLOR_DARK_TEXT
        ph.space_after = Pt(10)
        
        for it in items:
            p = tf.add_paragraph()
            p.text = f"•  {it}"
            p.font.size = Pt(10.5)
            p.font.color.rgb = COLOR_MUTED_TEXT
            p.space_after = Pt(6)

def build_slide_17(prs):
    """Slide 17: Privacy, Limitations and Future Scope"""
    slide = create_base_slide(prs, "Privacy Architecture, Project Limitations & Future Roadmap", "Governance & Vision", 17)
    
    col_w = Inches(3.65)
    gap = Inches(0.39)
    top_pos = Inches(1.8)
    h = Inches(4.9)
    
    cards = [
        ("1. PRIVACY BOUNDARIES", "In-Memory Zero-Persistence", [
            "All responses are processed in volatile session state (`st.session_state`).",
            "Zero Database Retention: No inputs, IP addresses, or records written to disk.",
            "Complete Data Erasure upon tab closure.",
            "Honest Privacy Standard: We do not claim cryptographic zero-knowledge proofs; protection stems from zero data persistence."
        ], COLOR_PRIMARY_VIOLET),
        ("2. CURRENT LIMITATIONS", "Scientific Boundaries", [
            "Cross-Sectional Survey: Single snapshot without longitudinal semester tracking.",
            "Self-Reported Data: Target labels and Likert ratings reflect subjective perception, not clinical evaluations.",
            "Non-Causal Associations: Statistical feature importances do not imply medical etiology.",
            "Calibration Shift: Measured Brier score slightly worsened on test set (0.1441 to 0.1448)."
        ], COLOR_CORAL),
        ("3. FUTURE ROADMAP", "Enterprise University Vision", [
            "Federated Learning across university campuses without centralizing student records.",
            "Longitudinal Wellness Tracking with opt-in encrypted local storage.",
            "Authorized Referral APIs for confidential campus counseling bookings.",
            "Multi-language accessibility for regional student cohorts."
        ], COLOR_EMERALD)
    ]
    
    for i, (b_tag, b_title, items, col) in enumerate(cards):
        px = Inches(0.8) + i * (col_w + gap)
        c = add_card(slide, px, top_pos, col_w, h)
        tb = slide.shapes.add_textbox(px + Inches(0.15), top_pos + Inches(0.15), col_w - Inches(0.3), h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        pt = tf.paragraphs[0]
        pt.text = b_tag
        pt.font.bold = True
        pt.font.size = Pt(11)
        pt.font.color.rgb = col
        pt.space_after = Pt(2)
        
        ph = tf.add_paragraph()
        ph.text = b_title
        ph.font.bold = True
        ph.font.size = Pt(15)
        ph.font.color.rgb = COLOR_DARK_TEXT
        ph.space_after = Pt(10)
        
        for it in items:
            p = tf.add_paragraph()
            p.text = f"•  {it}"
            p.font.size = Pt(11)
            p.font.color.rgb = COLOR_MUTED_TEXT
            p.space_after = Pt(6)

def build_slide_18(prs):
    """Slide 18: Conclusion"""
    slide = create_base_slide(prs, "Conclusion & Project Summary", "Summary & Takeaways", 18)
    
    # Top Highlight Card
    top_c = add_card(slide, Inches(0.8), Inches(1.8), Inches(11.733), Inches(1.5), bg_color=COLOR_LAVENDER_BG, border_color=COLOR_PRIMARY_VIOLET)
    tb_t = slide.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(11.333), Inches(1.3))
    tf_t = tb_t.text_frame
    tf_t.word_wrap = True
    
    pt1 = tf_t.paragraphs[0]
    pt1.text = "MINDORA: KEY PROJECT TAKEAWAYS"
    pt1.font.bold = True
    pt1.font.size = Pt(12)
    pt1.font.color.rgb = COLOR_PRIMARY_VIOLET
    pt1.space_after = Pt(4)
    
    pt2 = tf_t.add_paragraph()
    pt2.text = (
        "Mindora establishes that machine learning in student mental wellness can be both accurate and ethical. "
        "By purging target-leaking symptoms and family history, maintaining a segregated tri-engine architecture, "
        "and coupling XGBoost with local SHAP attributions, Mindora provides actionable, transparent wellness screening "
        "without clinical diagnostic overreach."
    )
    pt2.font.size = Pt(12.5)
    pt2.font.bold = True
    pt2.font.color.rgb = COLOR_DARK_TEXT
    
    # 3 Summary Cards
    col_w = Inches(3.65)
    gap = Inches(0.39)
    top_pos = Inches(3.55)
    h = Inches(3.2)
    
    points = [
        ("Methodological Rigor", [
            "Strict 70/15/15 stratified partitioning.",
            "Validation-only model selection.",
            "Honest reporting of calibration metrics.",
            "Test Accuracy: 79.69%, Recall: 84.58%, ROC-AUC: 0.8676."
        ], COLOR_PRIMARY_VIOLET),
        ("Architectural Integrity", [
            "Strict decoupling of ML, Lifestyle, and PHQ-9.",
            "No unscientific blending of clinical metrics.",
            "Immediate rule-based crisis override (Item 9).",
            "Zero-persistence privacy protection in RAM."
        ], COLOR_SECONDARY_PURPLE),
        ("Academic Readiness", [
            "5/5 automated quality unit tests passing.",
            "Full end-to-end browser user journey verified.",
            "Comprehensive dossier & viva defense manual.",
            "Streamlit production app running at http://localhost:8501."
        ], COLOR_EMERALD)
    ]
    
    for i, (b_title, items, col) in enumerate(points):
        px = Inches(0.8) + i * (col_w + gap)
        c = add_card(slide, px, top_pos, col_w, h)
        tb = slide.shapes.add_textbox(px + Inches(0.15), top_pos + Inches(0.15), col_w - Inches(0.3), h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        ph = tf.paragraphs[0]
        ph.text = b_title
        ph.font.bold = True
        ph.font.size = Pt(14)
        ph.font.color.rgb = col
        ph.space_after = Pt(8)
        
        for it in items:
            p = tf.add_paragraph()
            p.text = f"•  {it}"
            p.font.size = Pt(11)
            p.font.color.rgb = COLOR_DARK_TEXT
            p.space_after = Pt(4)

# =========================================================
# MAIN EXECUTION
# =========================================================
def generate_presentation():
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "presentation")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "Mindora_Final_Academic_Presentation.pptx")
    
    prs = init_presentation()
    
    print("Generating Slide 1: Title & Project Introduction...")
    build_slide_1(prs)
    print("Generating Slide 2: Problem Statement...")
    build_slide_2(prs)
    print("Generating Slide 3: Motivation and Objectives...")
    build_slide_3(prs)
    print("Generating Slide 4: Existing System and Limitations...")
    build_slide_4(prs)
    print("Generating Slide 5: Proposed Mindora Solution...")
    build_slide_5(prs)
    print("Generating Slide 6: Dataset Description and Source...")
    build_slide_6(prs)
    print("Generating Slide 7: Data Preprocessing and Feature Selection...")
    build_slide_7(prs)
    print("Generating Slide 8: ML Algorithms Compared...")
    build_slide_8(prs)
    print("Generating Slide 9: Model Training and Validation Methodology...")
    build_slide_9(prs)
    print("Generating Slide 10: Final Model Evaluation Metrics...")
    build_slide_10(prs)
    print("Generating Slide 11: Confusion Matrix and ROC-AUC...")
    build_slide_11(prs)
    print("Generating Slide 12: Three-Engine Architecture...")
    build_slide_12(prs)
    print("Generating Slide 13: SHAP Explainability...")
    build_slide_13(prs)
    print("Generating Slide 14: PHQ-9 Screening and Safety Mechanism...")
    build_slide_14(prs)
    print("Generating Slide 15: Application Screenshots and User Journey...")
    build_slide_15(prs)
    print("Generating Slide 16: Technology Stack...")
    build_slide_16(prs)
    print("Generating Slide 17: Privacy, Limitations and Future Scope...")
    build_slide_17(prs)
    print("Generating Slide 18: Conclusion...")
    build_slide_18(prs)
    
    prs.save(output_path)
    print(f"\n[SUCCESS] Presentation saved successfully to: {output_path}")
    print(f"Total Slides: {len(prs.slides)}")

if __name__ == "__main__":
    generate_presentation()
