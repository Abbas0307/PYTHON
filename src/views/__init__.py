"""
src/views/__init__.py
Mindora – Modular Views Package.
Exports all view controllers for student dashboard, assessment, insights,
wellness planning, progress tracking, methodology benchmarks, and ML training lab.
"""

from src.views.student_dashboard import render_student_dashboard
from src.views.onboarding import render_onboarding_guide
from src.views.assessment import render_assessment
from src.views.insights import render_insights
from src.views.wellness_planner import render_wellness_planner
from src.views.progress_view import render_progress_view
from src.views.methodology_view import render_methodology
from src.views.training_lab_view import render_training_lab

__all__ = [
    "render_student_dashboard",
    "render_onboarding_guide",
    "render_assessment",
    "render_insights",
    "render_wellness_planner",
    "render_progress_view",
    "render_methodology",
    "render_training_lab"
]
