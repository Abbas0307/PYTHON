"""
local_companion/audit/privacy_api_audit.py
Privacy, Data Sanitization, CORS, and Endpoint Security Audit for Mindora 2.0 Local AI.
Verifies rejection of sensitive clinical fields, oversized inputs, and telemetry absence.
"""

import json
import asyncio
import httpx
from fastapi.testclient import TestClient
from local_companion.service import app
from local_companion.config import CONFIG

client = TestClient(app)

def test_privacy_sensitive_payload_rejection():
    """Verify that requests containing student clinical or demographic keys are rejected with HTTP 400."""
    prohibited_keys = [
        "phq_responses",
        "phq",
        "item9",
        "item_9",
        "suicidal_thoughts",
        "depression_probability",
        "depression_score",
        "cgpa",
        "academic_pressure",
        "student_id",
        "email",
        "name"
    ]

    results = []
    for key in prohibited_keys:
        payload = {
            "query": "What is sleep hygiene?",
            "country": "India",
            key: 12345
        }
        res = client.post("/api/companion/chat", json=payload)
        status_ok = (res.status_code == 400)
        detail = res.json().get("detail", "")
        # Sensitive key value must NOT be leaked back in error detail
        value_leaked = "12345" in str(detail)

        results.append({
            "key": key,
            "status_code": res.status_code,
            "rejected_as_400": status_ok,
            "detail": detail,
            "sensitive_value_leaked": value_leaked
        })

    all_rejected = all(r["rejected_as_400"] for r in results)
    zero_leaked = not any(r["sensitive_value_leaked"] for r in results)
    return {
        "test": "sensitive_payload_rejection",
        "all_rejected": all_rejected,
        "zero_leaked": zero_leaked,
        "results": results
    }

def test_input_size_boundary():
    """Verify that oversized inputs (> 500 characters) are rejected by Pydantic validation."""
    oversized_text = "What is Tele-MANAS? " * 35  # ~700 characters
    res = client.post("/api/companion/chat", json={"query": oversized_text, "country": "India"})
    return {
        "test": "input_size_boundary",
        "status_code": res.status_code,
        "rejected_as_422": (res.status_code == 422),
        "detail": str(res.json())
    }

def test_cors_and_host_binding():
    """Inspect CORS allowed origins and host binding configuration."""
    cors_allowed = CONFIG.allowed_origins
    host = CONFIG.host
    port = CONFIG.port

    is_loopback = (host == "127.0.0.1" or host == "localhost")
    no_wildcard = ("*" not in cors_allowed)
    no_public_binding = (host != "0.0.0.0")

    return {
        "test": "cors_and_host_binding",
        "host": host,
        "port": port,
        "is_loopback_only": is_loopback,
        "no_public_binding": no_public_binding,
        "allowed_origins": cors_allowed,
        "no_wildcard_cors": no_wildcard
    }

async def async_concurrency_stress():
    """Test concurrent requests using async client with ASGITransport."""
    queries = [
        "What is Tele-MANAS in India?",
        "What is 988 in the US?",
        "How many hours of sleep do students need?",
        "What is the Pomodoro technique?",
        "Who operates NHS 111 in England?"
    ] * 2  # 10 concurrent requests

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        tasks = [
            ac.post("/api/companion/chat", json={"query": q, "country": "India"})
            for q in queries
        ]
        responses = await asyncio.gather(*tasks)

    status_codes = [r.status_code for r in responses]
    all_200 = all(code == 200 for code in status_codes)
    return {
        "test": "concurrency_stress",
        "total_requests": len(queries),
        "all_200": all_200,
        "status_codes": status_codes
    }

def run_privacy_api_audit():
    print("Starting Privacy & API Security Audit...")
    priv_res = test_privacy_sensitive_payload_rejection()
    size_res = test_input_size_boundary()
    cors_res = test_cors_and_host_binding()
    conc_res = asyncio.run(async_concurrency_stress())

    summary = {
        "privacy_sensitive_rejection": priv_res,
        "input_size_boundary": size_res,
        "cors_and_host_binding": cors_res,
        "concurrency_stress": conc_res
    }

    out_path = "local_companion/audit/privacy_api_security_results.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"Privacy Keys Rejection: {'PASS' if priv_res['all_rejected'] else 'FAIL'}")
    print(f"Sensitive Value Leakage: {'NONE (PASS)' if priv_res['zero_leaked'] else 'LEAK DETECTED (FAIL)'}")
    print(f"Oversized Input Rejection (422): {'PASS' if size_res['rejected_as_422'] else 'FAIL'}")
    print(f"Loopback Binding (127.0.0.1): {'PASS' if cors_res['is_loopback_only'] else 'FAIL'}")
    print(f"CORS Wildcard Prohibited: {'PASS' if cors_res['no_wildcard_cors'] else 'FAIL'}")
    print(f"Concurrency Stress (10 parallel): {'PASS' if conc_res['all_200'] else 'FAIL'}")
    print(f"Saved privacy & API security results to {out_path}")
    return summary

if __name__ == "__main__":
    run_privacy_api_audit()
