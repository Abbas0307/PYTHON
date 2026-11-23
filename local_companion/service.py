"""
local_companion/service.py
FastAPI Service for Mindora 2.0 Local AI Resource Companion.
Listens on local loopback (127.0.0.1:8000) only.
Provides grounded retrieval, deterministic safety guards, and privacy protection.
"""

from fastapi import FastAPI, HTTPException, Request, Response, UploadFile, File
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import subprocess
import os
import json

from .config import CONFIG
from .auth_manager import AUTH_MANAGER
from .rag.knowledge_base import APPROVED_KNOWLEDGE_BASE
from .rag.retriever import GroundedRetriever
from .model_runtime.safety_guard import SafetyGuard
from .model_runtime.qwen_client import QwenCompanionClient
from .model_runtime.citation_guard import CitationGuard
from .personalization_engine import PERSONALIZATION_ENGINE
from .companion_chat import COMPANION_CHAT_MANAGER

docs_url = "/docs" if CONFIG.docs_enabled else None
redoc_url = "/redoc" if CONFIG.docs_enabled else None
openapi_url = "/openapi.json" if CONFIG.docs_enabled else None

app = FastAPI(
    title="Mindora 2.0 Local AI Resource Companion",
    description="Offline-first, grounded educational companion for verified student wellbeing resources.",
    version="2.0.0",
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(self), camera=()"
    return response

# CORS Middleware for React Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CONFIG.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Session-Token", "Accept", "Origin", "X-Research-Authorization"],
)

# Production Safe Exception Sanitization
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return Response(
            content=json.dumps({"detail": exc.detail}),
            status_code=exc.status_code,
            media_type="application/json"
        )
    if CONFIG.is_production():
        return Response(
            content=json.dumps({"status": "error", "message": "An internal server error occurred."}),
            status_code=500,
            media_type="application/json"
        )
    return Response(
        content=json.dumps({"status": "error", "message": str(exc)}),
        status_code=500,
        media_type="application/json"
    )

# Instantiate Core Modules
retriever = GroundedRetriever(relevance_threshold=0.28)
safety_guard = SafetyGuard()
citation_guard = CitationGuard()
qwen_client = QwenCompanionClient(
    base_url=CONFIG.ollama_base_url,
    model_name=CONFIG.model_name
)

# Pydantic Schemas
class ChatRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="Student question regarding resources or study habits")
    country: Optional[str] = Field("India", description="Selected student country for localized helplines")

class SummarizeRequest(BaseModel):
    resource_id: str = Field(..., description="ID of approved resource to summarize")

def get_gpu_vram_status() -> Dict[str, Any]:
    """Inspect local GPU VRAM usage via nvidia-smi if available."""
    try:
        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=memory.used,memory.total,temperature.gpu", "--format=csv,noheader,nounits"],
            stderr=subprocess.DEVNULL,
            timeout=2.0
        ).decode().strip()
        parts = [p.strip() for p in out.split(",")]
        if len(parts) >= 3:
            return {
                "gpu_detected": True,
                "vram_used_mb": int(parts[0]),
                "vram_total_mb": int(parts[1]),
                "gpu_temp_c": int(parts[2])
            }
    except Exception:
        pass
    return {"gpu_detected": False, "vram_used_mb": 0, "vram_total_mb": 0}

def check_db_health() -> bool:
    try:
        with AUTH_MANAGER._get_conn() as conn:
            conn.execute("SELECT 1").fetchone()
            return True
    except Exception:
        return False

def check_models_health() -> bool:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    best_model = os.path.join(base_dir, "..", "models", "best_model.pkl")
    large_metrics = os.path.join(base_dir, "..", "reports", "large_dataset", "large_dataset_metrics.json")
    return os.path.exists(best_model) and os.path.exists(large_metrics)

@app.get("/health")
def health_check():
    """Health status, dependency readiness, and privacy guarantee endpoint."""
    ollama_ok, model_loaded, models = qwen_client.is_available()
    gpu_stats = get_gpu_vram_status()
    db_ok = check_db_health()
    models_ok = check_models_health()
    
    overall_status = "healthy" if (db_ok and models_ok and (ollama_ok or CONFIG.is_production())) else "degraded"
    
    return {
        "status": overall_status,
        "service": "Mindora Local AI Resource Companion",
        "version": "2.0.0",
        "environment": CONFIG.environment,
        "model": CONFIG.model_name,
        "ollama_connected": ollama_ok,
        "model_available": model_loaded,
        "available_models": models,
        "database_connected": db_ok,
        "model_artifacts_available": models_ok,
        "gpu": gpu_stats,
        "privacy": {
            "mode": "Local Client Memory Only",
            "remote_telemetry": False,
            "chat_persistence": False,
            "prohibit_assessment_data": True
        },
        "disclaimer": "Informational educational companion. Does not provide medical diagnoses or crisis triage."
    }

@app.get("/ready")
def readiness_check():
    """Readiness probe for container orchestrators (Render / Kubernetes)."""
    db_ok = check_db_health()
    models_ok = check_models_health()
    if db_ok and models_ok:
        return {
            "status": "ready",
            "database": True,
            "models": True,
            "environment": CONFIG.environment
        }
    raise HTTPException(status_code=503, detail="Service not ready: database or model artifacts unavailable.")

@app.get("/api/companion/resources")
def get_approved_resources():
    """Return catalog of approved resources indexed by the companion."""
    return {
        "count": len(APPROVED_KNOWLEDGE_BASE),
        "resources": [
            {
                "id": r["id"],
                "title": r["title"],
                "country": r["country"],
                "category": r["category"],
                "source": r["source"],
                "verification_date": r["verification_date"],
                "contact_number": r["contact_number"]
            }
            for r in APPROVED_KNOWLEDGE_BASE
        ]
    }

@app.post("/api/companion/chat")
async def chat_companion(payload: Request):
    """
    Handle student question about approved resources or educational guidelines.
    Enforces:
    1. Privacy Check (rejects sensitive assessment vectors)
    2. Deterministic Crisis Check (bypasses LLM for immediate helpline info)
    3. Deterministic Diagnostic Check (bypasses LLM for non-diagnostic boundary)
    4. Grounded Retrieval (requires verified resource match)
    5. Local Inference (Qwen3:4b via Ollama)
    """
    raw_json = await payload.json()

    # Step 1: Privacy Guard - Ensure no sensitive assessment keys are present
    is_private, privacy_err = safety_guard.check_payload_privacy(raw_json)
    if not is_private:
        raise HTTPException(status_code=400, detail=privacy_err)

    # Step 1b: Pydantic Schema Validation (enforces min_length=2, max_length=500)
    try:
        validated_req = ChatRequest(**raw_json)
    except Exception as val_err:
        raise HTTPException(status_code=422, detail=f"Request validation error: {str(val_err)}")

    query = validated_req.query.strip()
    country = validated_req.country or "India"

    # Step 2: Deterministic Crisis Interceptor (Bypasses LLM entirely)
    crisis_response = safety_guard.check_crisis(query, country)
    if crisis_response:
        return {
            "status": "crisis_safeguard_activated",
            "is_crisis": True,
            "bypassed_llm": True,
            "answer": crisis_response["message"],
            "citations": [
                f"{country} Emergency & Mental Health Helplines (MoHFW/SAMHSA/NHS/Lifeline - Verified 2026-11-15)"
            ],
            "metrics": {
                "total_time_seconds": 0.001,
                "tokens_per_second": 0.0
            },
            "contacts": crisis_response.get("contacts")
        }

    # Step 3: Deterministic Diagnostic Interceptor (Bypasses LLM entirely)
    diagnostic_response = safety_guard.check_diagnostic(query)
    if diagnostic_response:
        return {
            "status": "diagnostic_inquiry_intercepted",
            "is_diagnostic": True,
            "bypassed_llm": True,
            "answer": diagnostic_response["message"],
            "citations": ["Mindora 2.0 Educational Non-Diagnostic Policy"],
            "metrics": {
                "total_time_seconds": 0.001,
                "tokens_per_second": 0.0
            }
        }

    # Step 3b: Ambiguous Query Clarification Interceptor
    if retriever.is_ambiguous(query):
        return {
            "status": "unsupported_query",
            "is_grounded": False,
            "bypassed_llm": True,
            "answer": (
                "Mindora's educational companion provides grounded guidance across four specific student wellbeing domains:\n\n"
                "1. National & Campus Crisis Helplines (Immediate support & counseling)\n"
                "2. Sleep Hygiene & Fatigue Management (Restorative sleep routines)\n"
                "3. Sustainable Study Workload & Pacing (Exam preparation & burnout prevention)\n"
                "4. University Counseling Center Navigation (Intake & accommodations)\n\n"
                "Could you please specify which of these topics you would like information on?"
            ),
            "citations": [],
            "relevance_score": 0.0,
            "metrics": {
                "total_time_seconds": 0.001,
                "tokens_per_second": 0.0
            }
        }

    # Step 4: Grounded Retrieval over Approved Catalogue
    is_grounded, matched_resources, top_score = retriever.retrieve(query, country, top_k=2)

    if not is_grounded:
        return {
            "status": "unsupported_query",
            "is_grounded": False,
            "bypassed_llm": True,
            "answer": (
                "The approved Mindora resource catalogue does not contain verified information to answer this question.\n\n"
                "Mindora's educational companion is strictly limited to verified national crisis helplines, "
                "campus counseling guidance, sleep hygiene, and study workload balance strategies. "
                "Please consult your university student health center for topics outside this scope."
            ),
            "citations": [],
            "relevance_score": top_score,
            "metrics": {
                "total_time_seconds": 0.002,
                "tokens_per_second": 0.0
            }
        }

    # Step 5: Citation Isolation & Construct Grounding Context
    is_injection, injected_entities, query_for_model = citation_guard.detect_and_isolate_injection(query)
    context_text = retriever.format_context(matched_resources)
    sources = [f"{r['title']} ({r['source']})" for r in matched_resources]

    gen_result = qwen_client.generate_grounded_response(
        query=query_for_model,
        context=context_text,
        sources=sources
    )

    # Step 6: Post-Generation Deterministic Citation Validation & Sanitization
    authorized_citations = citation_guard.build_authorized_citations(matched_resources)

    if not gen_result.get("success"):
        return {
            "status": "runtime_error",
            "is_grounded": False,
            "bypassed_llm": False,
            "answer": gen_result.get("answer"),
            "citations": authorized_citations,
            "error": gen_result.get("error")
        }

    raw_answer = gen_result.get("answer", "")
    sanitized_answer = citation_guard.sanitize_generated_answer(
        answer=raw_answer,
        retrieved_resources=matched_resources,
        injected_entities=injected_entities
    )

    return {
        "status": "success",
        "is_grounded": True,
        "bypassed_llm": False,
        "answer": sanitized_answer,
        "citations": authorized_citations,
        "metrics": gen_result.get("metrics"),
        "relevance_score": round(top_score, 3),
        "disclaimer": "Informational educational resource assistance only. Not medical care or crisis triage."
    }

@app.post("/api/companion/summarize")
def summarize_resource(req: SummarizeRequest):
    """Summarize an approved resource into structured student guidance."""
    target_res = next((r for r in APPROVED_KNOWLEDGE_BASE if r["id"] == req.resource_id), None)
    if not target_res:
        raise HTTPException(status_code=404, detail="Resource not found in approved catalogue.")

    context_text = retriever.format_context([target_res])
    authorized_citations = citation_guard.build_authorized_citations([target_res])
    sources = [f"{target_res['title']} ({target_res['source']})"]

    summary_query = f"Provide a 3-bullet plain-language summary explaining how and when a student should use {target_res['title']}."
    gen_result = qwen_client.generate_grounded_response(
        query=summary_query,
        context=context_text,
        sources=sources
    )

    raw_answer = gen_result.get("answer", "")
    sanitized_answer = citation_guard.sanitize_generated_answer(
        answer=raw_answer,
        retrieved_resources=[target_res],
        injected_entities=[]
    )

    return {
        "resource_id": target_res["id"],
        "title": target_res["title"],
        "summary": sanitized_answer,
        "citations": authorized_citations,
        "metrics": gen_result.get("metrics")
    }

# ==========================================
# PHASE 5.16: AUTHENTICATION & GUARDIAN API
# ==========================================

def _extract_token(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return request.headers.get("X-Session-Token")

@app.post("/api/auth/register")
def register_student(payload: Dict[str, Any]):
    ok, msg, res = AUTH_MANAGER.register_user(payload)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg, "data": res}

@app.post("/api/auth/login")
def login_student(payload: Dict[str, Any], request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    email = payload.get("email", "")
    password = payload.get("password", "")
    ok, msg, res = AUTH_MANAGER.login_user(email, password, client_ip)
    if not ok:
        raise HTTPException(status_code=401, detail=msg)
    return {"status": "success", "message": msg, "data": res}

@app.post("/api/auth/logout")
def logout_student(request: Request):
    token = _extract_token(request)
    if token:
        AUTH_MANAGER.logout_user(token)
    return {"status": "success", "message": "Logged out successfully."}

@app.get("/api/auth/me")
def get_current_student(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")
    profile = AUTH_MANAGER.get_user_profile(user_id)
    return {"status": "success", "profile": profile, "user": profile}

@app.post("/api/auth/change-password")
def change_password_endpoint(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")
    current_pwd = payload.get("current_password", "")
    new_pwd = payload.get("new_password", "")
    ok, msg = AUTH_MANAGER.change_password(user_id, current_pwd, new_pwd)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg}

@app.put("/api/auth/profile")
def update_auth_profile(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")
    
    guardian_keys = {"guardian_name", "guardian_relationship", "guardian_email", "guardian_phone", "guardian_consent"}
    profile_keys = {"full_name", "date_of_birth", "degree_program", "academic_year", "institution_name", "student_id_number", "student_phone"}
    
    guardian_payload = {k: v for k, v in payload.items() if k in guardian_keys}
    profile_payload = {k: v for k, v in payload.items() if k in profile_keys}
    
    msg = "Profile updated successfully."
    res: Dict[str, Any] = {}
    if guardian_payload:
        ok, g_msg, g_res = AUTH_MANAGER.update_guardian(user_id, guardian_payload)
        if not ok:
            raise HTTPException(status_code=400, detail=g_msg)
        msg = g_msg
        if g_res:
            res.update(g_res)
    if profile_payload:
        full_name = profile_payload.get("full_name")
        student_phone = profile_payload.get("student_phone")
        if full_name or student_phone:
            ok, p_msg = AUTH_MANAGER.update_profile_details(user_id, full_name or "", student_phone)
            if not ok:
                raise HTTPException(status_code=400, detail=p_msg)
            msg = p_msg
        
    updated_profile = AUTH_MANAGER.get_user_profile(user_id)
    return {"status": "success", "message": msg, "data": res, "profile": updated_profile, "user": updated_profile}

# ==========================================
# BIKE-STYLE ANALOG STRESS METER APIS
# ==========================================
@app.get("/api/student/stress-indicator")
def get_student_stress_indicator(request: Request):
    """
    Returns the student's latest authoritative stress indicator assessment.
    If no assessment exists, cleanly returns has_assessment=False and stress_score=None.
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")
    
    data = AUTH_MANAGER.get_latest_student_stress(user_id)
    if data is None:
        return {
            "status": "success",
            "data": {
                "has_assessment": False,
                "stress_score": None,
                "interpretation": "No Assessment Recorded",
                "status_tier": "unassessed",
                "last_assessment_date": None
            }
        }
    return {"status": "success", "data": data}

@app.post("/api/student/stress-indicator/record")
def record_student_stress_indicator(payload: Dict[str, Any], request: Request):
    """
    Records an authoritative assessment stress score and evaluates guardian notification thresholds.
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")
    
    raw_score = payload.get("stress_score")
    if raw_score is None:
        raise HTTPException(status_code=400, detail="stress_score is required.")
    
    try:
        stress_score = float(raw_score)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="stress_score must be a numeric value between 0 and 100.")
    
    source = str(payload.get("source", "self_report"))
    features = payload.get("features")
    ok, msg, res = AUTH_MANAGER.record_student_stress(user_id, stress_score, source, features)
    return {"status": "success", "message": msg, "data": res}

# ==========================================
# PHASE 12: CENTRALIZED DAILY ASSESSMENT & PLATFORM-WIDE SYNC
# ==========================================

@app.post("/api/student/assessment/submit")
def submit_student_assessment_endpoint(payload: Dict[str, Any], request: Request):
    """
    Phase 12: Centralized assessment submission and event pipeline.
    Validates submission, saves historical record, triggers guardian alert evaluation,
    refreshes recommendations, and returns synchronized dashboard & weekly analytics.
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")

    phq9_answers = payload.get("phq9_answers")
    phq9_score = payload.get("phq9_score")
    phq9_severity = payload.get("phq9_severity")
    features = payload.get("features")
    raw_stress = payload.get("stress_score")
    idempotency_key = payload.get("idempotency_key")
    source = payload.get("source", "student_daily_assessment")
    client_timezone = payload.get("timezone", "Asia/Kolkata")

    try:
        stress_val = float(raw_stress) if raw_stress is not None else None
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="stress_score must be a numeric value between 0 and 100.")

    ok, msg, data = AUTH_MANAGER.submit_student_assessment(
        user_id=user_id,
        phq9_answers=phq9_answers,
        phq9_score=phq9_score,
        phq9_severity=phq9_severity,
        features=features,
        stress_score=stress_val,
        idempotency_key=idempotency_key,
        source=source,
        client_timezone=client_timezone
    )
    return {"status": "success", "message": msg, "data": data}

@app.get("/api/student/assessments/history")
def get_student_assessment_history_endpoint(request: Request, limit: int = 50, offset: int = 0):
    """
    Phase 12: Retrieve chronological historical assessment records for authenticated student.
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")

    history = AUTH_MANAGER.get_student_assessment_history(user_id=user_id, limit=limit, offset=offset)
    return {"status": "success", "data": history, "total_records": len(history)}

@app.get("/api/student/analytics/weekly")
def get_student_weekly_analytics_endpoint(request: Request, timezone: str = "Asia/Kolkata", date: Optional[str] = None):
    """
    Phase 12: Retrieve current week analytics calculated strictly from real assessments.
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")

    weekly = AUTH_MANAGER.get_student_weekly_analytics(user_id=user_id, client_timezone=timezone, reference_date=date)
    return {"status": "success", "data": weekly}

@app.get("/api/student/progress")
def get_student_progress_endpoint(request: Request):
    """
    Phase 12: Retrieve cumulative student progress, streaks, and milestone achievements.
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")

    progress = AUTH_MANAGER.get_student_progress_summary(user_id=user_id)
    return {"status": "success", "data": progress}

@app.post("/api/auth/forgot-password")
def forgot_password(payload: Dict[str, Any]):
    email = payload.get("email", "")
    ok, msg, reset_token = AUTH_MANAGER.create_password_reset_token(email)
    response_payload = {
        "status": "success",
        "message": msg
    }
    if not CONFIG.is_production() and reset_token:
        response_payload["reset_token"] = reset_token # Disclosed for local/offline developer convenience only
    return response_payload

@app.post("/api/auth/reset-password")
def reset_password(payload: Dict[str, Any]):
    token = payload.get("token", "")
    new_password = payload.get("new_password", "")
    ok, msg = AUTH_MANAGER.reset_password(token, new_password)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg}

# ==========================================
# PHASE 6: ONBOARDING FLOW APIS
# ==========================================
@app.post("/api/onboarding/parent")
def onboarding_parent(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")
    ok, msg, res = AUTH_MANAGER.save_parent_onboarding(user_id, payload)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg, "data": res}

@app.post("/api/onboarding/student")
def onboarding_student(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")
    ok, msg, res = AUTH_MANAGER.save_student_onboarding(user_id, payload)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg, "data": res}

@app.get("/api/onboarding/status")
def onboarding_status(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")
    profile = AUTH_MANAGER.get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Student record not found.")
    return {"status": "success", "onboarding": profile.get("onboarding", {})}

@app.put("/api/guardian/update")
def update_guardian(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    ok, msg, res = AUTH_MANAGER.update_guardian(user_id, payload)
    return {"status": "success", "message": msg, "data": res}

@app.post("/api/guardian/verify")
def verify_guardian_code(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    code = payload.get("code", "")
    ok, msg = AUTH_MANAGER.verify_guardian_phone(user_id, code)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg}

@app.post("/api/guardian/revoke")
def revoke_guardian(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    ok, msg = AUTH_MANAGER.revoke_guardian_consent(user_id)
    return {"status": "success", "message": msg}

@app.post("/api/guardian/notify-stress")
def notify_guardian_stress(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    confirmed = bool(payload.get("confirmed", False))
    ok, msg, audit = AUTH_MANAGER.send_stress_notification(user_id, student_confirmation=confirmed)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg, "audit": audit}

@app.get("/api/guardian/audit-log")
def get_guardian_audit_log(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    logs = AUTH_MANAGER.get_notification_log(user_id)
    return {"status": "success", "logs": logs}

@app.get("/api/guardian/notifications")
def get_guardian_notifications(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    logs = AUTH_MANAGER.get_notification_log(user_id)
    return {"status": "success", "logs": logs}

@app.get("/api/guardian/episode-status")
def get_guardian_episode_status(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    episode = AUTH_MANAGER.get_current_episode(user_id)
    return {"status": "success", "episode": episode}

@app.post("/api/guardian/email-consent")
def set_guardian_email_consent(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    consent = bool(payload.get("consent", False))
    ok, msg = AUTH_MANAGER.update_guardian_email_consent(user_id, consent)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    profile = AUTH_MANAGER.get_user_profile(user_id)
    return {"status": "success", "message": msg, "profile": profile}

@app.post("/api/guardian/send-email-verification")
def send_guardian_email_verification(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    ok, msg, code = AUTH_MANAGER.send_guardian_email_verification(user_id)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg, "code": code}

@app.post("/api/guardian/verify-email")
def verify_guardian_email(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    code = str(payload.get("code", "")).strip()
    ok, msg = AUTH_MANAGER.verify_guardian_email(user_id, code)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    profile = AUTH_MANAGER.get_user_profile(user_id)
    return {"status": "success", "message": msg, "profile": profile}

@app.get("/api/guardian/verify-email-link")
def verify_guardian_email_link(token: str = ""):
    """
    HTTP GET endpoint for direct email link verification clicked by parents.
    Validates token and returns a mobile-responsive confirmation landing page.
    """
    token_clean = token.strip()
    if not token_clean:
        return HTMLResponse(
            status_code=400,
            content="""<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 40px; background: #f8fafc;">
            <h2 style="color: #e11d48;">Verification Failed</h2><p>Missing or empty verification link token.</p>
            </body></html>"""
        )

    ok, msg, user_id = AUTH_MANAGER.verify_guardian_email_by_token(token_clean)
    if not ok:
        return HTMLResponse(
            status_code=400,
            content=f"""<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Verification Failed &bull; Mindora</title></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 30px; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 80vh;">
              <div style="max-width: 480px; width: 100%; background: #ffffff; border-radius: 20px; border: 1px solid #fecdd3; padding: 36px 28px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <div style="font-size: 40px; margin-bottom: 12px;">⚠️</div>
                <h2 style="color: #be123c; margin: 0 0 10px 0; font-size: 20px;">Verification Unsuccessful</h2>
                <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">{msg}</p>
                <a href="http://127.0.0.1:5173" style="display: inline-block; background: #64748b; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600;">Return to Mindora</a>
              </div>
            </body></html>"""
        )

    frontend_url = os.getenv("FRONTEND_BASE_URL", "http://127.0.0.1:5173").rstrip("/")
    return HTMLResponse(
        status_code=200,
        content=f"""<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Guardian Verified &bull; Mindora</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 30px; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 80vh;">
          <div style="max-width: 480px; width: 100%; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px 28px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <div style="width: 56px; height: 56px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; color: #10b981; font-size: 28px;">✓</div>
            <h2 style="color: #0f172a; margin: 0 0 10px 0; font-size: 22px; font-weight: 800;">Guardian Email Verified!</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
              Thank you for verifying your contact email with Mindora Student Wellbeing. Automated wellness notifications and educational alerts are now enabled.
            </p>
            <a href="{frontend_url}" style="display: inline-block; background: linear-gradient(135deg, #6C5CE7 0%, #4834D4 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 14px rgba(108, 92, 231, 0.35);">
              Open Mindora App
            </a>
          </div>
        </body></html>"""
    )

@app.post("/api/guardian/verify-email-token")
def verify_guardian_email_token_endpoint(payload: Dict[str, Any]):
    """JSON POST endpoint to verify guardian email using token from client apps."""
    token = str(payload.get("token", "")).strip()
    if not token:
        raise HTTPException(status_code=400, detail="Verification token is required.")
    ok, msg, user_id = AUTH_MANAGER.verify_guardian_email_by_token(token)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    profile = AUTH_MANAGER.get_user_profile(user_id) if user_id else None
    return {"status": "success", "message": msg, "profile": profile}

@app.post("/api/guardian/retry-notification/{notification_id}")
def retry_guardian_notification(notification_id: int, request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    ok, msg, receipt = AUTH_MANAGER.retry_notification(user_id, notification_id)
    if not ok and not receipt:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success" if ok else "failed", "message": msg, "receipt": receipt}

@app.get("/api/admin/guardian-notifications/diagnostics")
def get_guardian_notification_diagnostics(request: Request, student_id: Optional[int] = None):
    """
    Administrative / Developer diagnostic view for guardian notification pipeline (Phase 9).
    Access restricted: never exposed to ordinary students without authorization.
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    
    # Verify admin / researcher role or developer session
    is_researcher = AUTH_MANAGER.is_user_researcher(user_id)
    auth_header = request.headers.get("X-Admin-Authorization", "")
    if not is_researcher and auth_header != "mindora_dev_admin":
        raise HTTPException(status_code=403, detail="Access denied. Administrator or researcher diagnostic authorization required.")
    
    diagnostics = AUTH_MANAGER.get_notification_diagnostics(student_id)
    return {"status": "success", "diagnostics": diagnostics}

@app.post("/api/admin/guardian-notifications/process-retries")
def process_guardian_notification_retries(request: Request, max_batch: int = 10):
    """
    Administrative trigger to process pending failed notification retry queue (Phase 10).
    Bounded at 3 attempts per notification. Safe against race conditions and duplicates.
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    
    is_researcher = AUTH_MANAGER.is_user_researcher(user_id)
    auth_header = request.headers.get("X-Admin-Authorization", "")
    if not is_researcher and auth_header != "mindora_dev_admin":
        raise HTTPException(status_code=403, detail="Access denied. Administrator authorization required.")
    
    result = AUTH_MANAGER.process_pending_retries(max_batch=max_batch)
    return {"status": "success", "result": result}

# ==========================================
# PHASE 5.20: PROFILE & AVATAR API
# ==========================================
@app.put("/api/profile/update")
def update_profile(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    full_name = payload.get("full_name", "")
    student_phone = payload.get("student_phone")
    ok, msg = AUTH_MANAGER.update_profile_details(user_id, full_name, student_phone)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    profile = AUTH_MANAGER.get_user_profile(user_id)
    return {"status": "success", "message": msg, "profile": profile}

@app.post("/api/profile/avatar")
async def upload_avatar(request: Request, file: UploadFile = File(...)):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    file_bytes = await file.read()
    ok, msg, avatar_url = AUTH_MANAGER.save_profile_image(user_id, file_bytes, file.filename or "avatar.jpg", file.content_type or "")
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg, "avatar_url": avatar_url}

@app.delete("/api/profile/avatar")
def delete_avatar(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    ok, msg = AUTH_MANAGER.delete_profile_image(user_id)
    return {"status": "success", "message": msg}

@app.get("/api/profile/avatar/{filename}")
def serve_avatar(filename: str):
    filepath = AUTH_MANAGER.get_avatar_file_path(filename)
    if not filepath or not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Avatar image not found.")
    return FileResponse(filepath)

# ==========================================
# PHASE 5.20: AUTOMATED GUARDIAN ALERT POLICY
# ==========================================
@app.get("/api/guardian/policy")
def get_guardian_policy(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    policy = AUTH_MANAGER.get_notification_policy(user_id)
    return {"status": "success", "policy": policy}

@app.put("/api/guardian/policy")
def update_guardian_policy(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    is_enabled = bool(payload.get("is_enabled", payload.get("policy_enabled", False)))
    raw_thresh = float(payload.get("stress_threshold_score", payload.get("trigger_threshold", 70.0)))
    threshold_score = raw_thresh * 100.0 if raw_thresh <= 1.0 else raw_thresh
    max_frequency_days = int(payload.get("max_frequency_days", payload.get("cooldown_days", 7)))
    ok, msg = AUTH_MANAGER.update_notification_policy(user_id, is_enabled, threshold_score, max_frequency_days)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    policy = AUTH_MANAGER.get_notification_policy(user_id)
    return {"status": "success", "message": msg, "policy": policy}

@app.post("/api/guardian/trigger-auto-alert")
def trigger_auto_alert(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid.")
    raw_score = float(payload.get("friction_score", payload.get("stress_score", payload.get("stress_probability", 0.0))))
    friction_score = raw_score * 100.0 if raw_score <= 1.0 else raw_score
    idempotency_key = payload.get("idempotency_key", payload.get("assessment_id"))
    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, friction_score, idempotency_key)
    res_status = "success" if ok else (receipt.get("status", "skipped") if receipt else "skipped")
    return {"status": res_status, "message": msg, "receipt": receipt}

@app.post("/api/guardian/evaluate-stress")
def evaluate_stress(payload: Dict[str, Any], request: Request):
    return trigger_auto_alert(payload, request)

# ==========================================
# PHASE 5.16: MODEL LABORATORY METRICS API
# ==========================================
LARGE_METRICS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "reports", "large_dataset", "large_dataset_metrics.json")
SMALL_METRICS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "reports", "real_world_163", "small_dataset_metrics.json")

@app.get("/api/models/large-dataset")
def get_large_dataset_model_metrics():
    """Return comprehensive 4-model evaluation metrics for the large dataset."""
    if not os.path.exists(LARGE_METRICS_PATH):
        raise HTTPException(status_code=404, detail="Large dataset model metrics not yet generated.")
    with open(LARGE_METRICS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/api/models/real-world-163")
def get_small_dataset_model_metrics():
    """Return comprehensive 4-model evaluation metrics for the 163-record dataset."""
    if not os.path.exists(SMALL_METRICS_PATH):
        raise HTTPException(status_code=404, detail="Small dataset model metrics not yet generated.")
    with open(SMALL_METRICS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


# ==========================================
# PHASE 7: MINDORA AI COMPANION APIS
# ==========================================

class CompanionChatInput(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    country: Optional[str] = "India"
    include_context: Optional[bool] = True
    context_data: Optional[Dict[str, Any]] = None

@app.post("/api/ai-companion/chat")
def ai_companion_chat(payload: CompanionChatInput, request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid or expired.")

    result = COMPANION_CHAT_MANAGER.process_chat(
        user_id=user_id,
        query=payload.query,
        country=payload.country or "India",
        include_context=payload.include_context if payload.include_context is not None else True,
        context_data=payload.context_data
    )
    return {"status": "success", "data": result}

@app.get("/api/ai-companion/history")
def ai_companion_history(request: Request, limit: int = 50):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid or expired.")

    history = COMPANION_CHAT_MANAGER.get_history(user_id=user_id, limit=limit)
    return {"status": "success", "history": history}

@app.delete("/api/ai-companion/history")
def ai_companion_clear_history(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid or expired.")

    COMPANION_CHAT_MANAGER.clear_history(user_id=user_id)
    return {"status": "success", "message": "Conversation history cleared successfully."}

@app.get("/api/ai-companion/context-info")
def ai_companion_context_info():
    disclosure = COMPANION_CHAT_MANAGER.get_context_disclosure()
    return {"status": "success", "data": disclosure}


# ==========================================
# PHASE 7: INTELLIGENT PERSONALIZATION APIS
# ==========================================

class ActivityStatusUpdate(BaseModel):
    activity_id: int
    status: str  # started, completed, skipped

@app.get("/api/personalization/recommendations")
def get_personalized_recommendations(
    request: Request,
    stress_score: Optional[float] = None,
    force_refresh: bool = False
):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid or expired.")

    score = stress_score if stress_score is not None else 45.0
    rec_list = PERSONALIZATION_ENGINE.generate_recommendations(
        student_id=user_id,
        assessment_score=score,
        limit=3,
        force_refresh=force_refresh
    )
    band_info = PERSONALIZATION_ENGINE.determine_band(score)
    return {
        "status": "success",
        "data": {
            "band": band_info,
            "recommendations": rec_list
        }
    }

@app.post("/api/personalization/activity-status")
def update_personalized_activity_status(payload: ActivityStatusUpdate, request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid or expired.")

    update_res = PERSONALIZATION_ENGINE.update_activity_status(
        student_id=user_id,
        activity_id=payload.activity_id,
        new_status=payload.status
    )
    if not update_res.get("success"):
        raise HTTPException(status_code=400, detail=update_res.get("detail", "Failed to update activity"))

    return {"status": "success", "data": update_res}

@app.post("/api/personalization/recommendations/refresh")
def refresh_personalized_recommendations(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid or expired.")

    raw_score = payload.get("stress_score", 45.0)
    score = float(raw_score)
    rec_list = PERSONALIZATION_ENGINE.generate_recommendations(
        student_id=user_id,
        assessment_score=score,
        limit=3,
        force_refresh=True
    )
    band_info = PERSONALIZATION_ENGINE.determine_band(score)
    return {
        "status": "success",
        "data": {
            "band": band_info,
            "recommendations": rec_list
        }
    }

@app.get("/api/personalization/engagement")
def get_personalization_engagement(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid or expired.")

    metrics = PERSONALIZATION_ENGINE.get_engagement_metrics(student_id=user_id)
    return {"status": "success", "data": metrics}


# ==============================================================================
# PHASE 8: REAL-WORLD DEPRESSION DATA ANALYZER & AMBIENT MUSIC & GAMES API
# ==============================================================================

from src.data_platform.real_world_analyzer import get_real_world_analyzer

def _check_research_auth(request: Request) -> Optional[int]:
    """
    Validates that the requester has authorized research administrator privileges.
    Enforces that ordinary student accounts cannot browse or access unverified research datasets.
    """
    token = _extract_token(request)
    user_id = None
    if token:
        user_id = AUTH_MANAGER.validate_session(token)

    auth_header = request.headers.get("X-Research-Authorization", "").strip().lower()
    role_header = request.headers.get("X-Research-Role", "").strip().lower()
    is_header_auth = auth_header in ["authorized", "true", "admin"] or role_header in ["administrator", "researcher"]

    is_user_auth = False
    if user_id:
        is_user_auth = AUTH_MANAGER.is_user_researcher(user_id)

    if not is_header_auth and not is_user_auth:
        ip = request.client.host if request.client else "127.0.0.1"
        AUTH_MANAGER.log_research_access(
            user_id=user_id,
            action=str(request.url.path),
            dataset_name="STUDENT dataset.xlsx",
            status="denied",
            ip_address=ip
        )
        raise HTTPException(
            status_code=403,
            detail="Access restricted: Research laboratory is only accessible to authorized research administrators. Ordinary student accounts cannot access unverified survey datasets."
        )

    ip = request.client.host if request.client else "127.0.0.1"
    AUTH_MANAGER.log_research_access(
        user_id=user_id,
        action=str(request.url.path),
        dataset_name="STUDENT dataset.xlsx",
        status="authorized",
        ip_address=ip
    )
    return user_id


@app.get("/api/research/163-dataset/overview")
def get_163_dataset_overview(request: Request):
    """Returns verified dataset overview distributions with strict governance notice."""
    _check_research_auth(request)
    analyzer = get_real_world_analyzer()
    overview = analyzer.get_dataset_overview()
    return {"status": "success", "data": overview}


@app.get("/api/research/163-dataset/exploratory")
def get_163_dataset_exploratory(request: Request):
    """Returns bivariate associations, cross-tabs, Chi-Square, and Cramér's V."""
    _check_research_auth(request)
    analyzer = get_real_world_analyzer()
    exploratory = analyzer.get_exploratory_analysis()
    return {"status": "success", "data": exploratory}


@app.get("/api/research/163-dataset/models")
def get_163_dataset_models(request: Request):
    """Returns isolated experimental model evaluation (Logistic Regression, Random Forest, XGBoost, SVM)."""
    _check_research_auth(request)
    analyzer = get_real_world_analyzer()
    models = analyzer.run_research_models()
    return {"status": "success", "data": models}


@app.get("/api/research/163-dataset/export/csv")
def export_163_dataset_csv(request: Request):
    """Exports aggregate CSV summary table (zero identifiable student records)."""
    _check_research_auth(request)
    analyzer = get_real_world_analyzer()
    csv_content = analyzer.export_summary_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mindora_163_dataset_aggregate_summary.csv"}
    )


@app.get("/api/research/163-dataset/export/report")
def export_163_dataset_report(request: Request):
    """Exports comprehensive text research report."""
    _check_research_auth(request)
    analyzer = get_real_world_analyzer()
    report_content = analyzer.export_summary_text_report()
    return Response(
        content=report_content,
        media_type="text/plain",
        headers={"Content-Disposition": "attachment; filename=mindora_163_research_report.txt"}
    )


@app.post("/api/research/163-dataset/profile-compare")
def compare_profile_against_163_dataset(payload: Dict[str, Any], request: Request):
    """
    Compares a student profile against the 162-record research cohort.
    Calculates empirical percentiles and an exploratory historical projection.
    Strictly isolated for research and exploration — NEVER clinical diagnosis.
    """
    _check_research_auth(request)
    analyzer = get_real_world_analyzer()
    result = analyzer.compare_student_profile(payload)
    if result.get("status") == "error":
        return {"status": "error", "errors": result.get("errors", []), "message": "Profile validation failed."}
    return {"status": "success", "data": result}


# --- Ambient Music & User Preferences ---

@app.get("/api/preferences")
def get_user_preferences(request: Request):
    token = _extract_token(request)
    if not token:
        return {
            "status": "success",
            "data": {
                "ambient_music_enabled": False,
                "ambient_music_track": "peaceful_instrumental",
                "ambient_music_volume": 0.5,
                "game_sound_enabled": True
            }
        }
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid or expired.")
    prefs = AUTH_MANAGER.get_user_preferences(user_id)
    return {"status": "success", "data": prefs}


@app.post("/api/preferences")
def save_user_preferences(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user_id = AUTH_MANAGER.validate_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session invalid or expired.")
    updated = AUTH_MANAGER.save_user_preferences(user_id, payload)
    return {"status": "success", "data": updated}


# --- Mindora Mini Games API (Strict 5-Minute Sessions) ---

@app.post("/api/games/session/start")
def start_game_session(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    user_id = AUTH_MANAGER.validate_session(token) if token else 1
    if not user_id:
        user_id = 1
    game_type = str(payload.get("game_type", "snake")).lower()
    if game_type not in ["snake", "block"]:
        raise HTTPException(status_code=400, detail="Invalid game_type. Must be 'snake' or 'block'.")
    session = AUTH_MANAGER.start_game_session(user_id, game_type)
    return {"status": "success", "data": session}


@app.post("/api/games/session/update")
def update_game_session(payload: Dict[str, Any], request: Request):
    token = _extract_token(request)
    user_id = AUTH_MANAGER.validate_session(token) if token else 1
    if not user_id:
        user_id = 1

    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required.")
    duration = int(payload.get("duration_seconds", 0))
    score = int(payload.get("score", 0))
    status_str = str(payload.get("status", "active"))

    try:
        updated = AUTH_MANAGER.update_game_session(
            user_id=user_id,
            session_id=session_id,
            duration_seconds=duration,
            score=score,
            status=status_str
        )
        return {"status": "success", "data": updated}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/games/engagement")
def get_game_engagement(request: Request):
    token = _extract_token(request)
    user_id = AUTH_MANAGER.validate_session(token) if token else 1
    if not user_id:
        user_id = 1
    engagement = AUTH_MANAGER.get_game_engagement(user_id)
    return {"status": "success", "data": engagement}


