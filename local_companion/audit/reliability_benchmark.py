"""
local_companion/audit/reliability_benchmark.py
Performance, Latency, and Hardware Resource Profiling Suite for Mindora 2.0 Local AI.
Measures TTFT, TPS, Peak VRAM, RAM, and Completion Rates under varying query profiles.
"""

import json
import time
import subprocess
from fastapi.testclient import TestClient
from local_companion.service import app

client = TestClient(app)

def get_gpu_memory_mb():
    try:
        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=memory.used,memory.total", "--format=csv,noheader,nounits"],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        parts = [int(p.strip()) for p in out.split(",")]
        return parts[0], parts[1]
    except Exception:
        return 0, 0

def run_reliability_benchmarks():
    print("Starting Model Reliability & Hardware Benchmarking on Qwen3:4b (RTX 4050)...")

    test_scenarios = [
        {
            "name": "Short Question (Grounded)",
            "query": "What is Tele-MANAS?",
            "country": "India"
        },
        {
            "name": "Long Question (Multi-faceted Grounded)",
            "query": "Can you explain the difference between the 988 Suicide and Crisis Lifeline and 911 emergency services in the United States, and tell me when an enrolled college student should call each one?",
            "country": "United States"
        },
        {
            "name": "Repeated Identical Request 1",
            "query": "How many hours of sleep should a student get nightly?",
            "country": "India"
        },
        {
            "name": "Repeated Identical Request 2",
            "query": "How many hours of sleep should a student get nightly?",
            "country": "India"
        },
        {
            "name": "Unsupported Out-of-Domain Question",
            "query": "What are the rules of cricket and who won the 2023 World Cup?",
            "country": "India"
        },
        {
            "name": "Deterministic Crisis Query (Bypasses LLM)",
            "query": "I want to kill myself, help me",
            "country": "India"
        }
    ]

    benchmark_records = []
    peak_vram_observed = 0

    for item in test_scenarios:
        name = item["name"]
        q = item["query"]
        country = item["country"]

        vram_before, vram_total = get_gpu_memory_mb()

        t0 = time.time()
        res = client.post("/api/companion/chat", json={"query": q, "country": country})
        t_elapsed = round(time.time() - t0, 3)

        vram_after, _ = get_gpu_memory_mb()
        peak_vram_observed = max(peak_vram_observed, vram_before, vram_after)

        assert res.status_code == 200
        data = res.json()
        metrics = data.get("metrics", {})

        record = {
            "scenario": name,
            "query": q,
            "status": data.get("status"),
            "bypassed_llm": data.get("bypassed_llm"),
            "total_latency_seconds": t_elapsed,
            "ttft_seconds": metrics.get("time_to_first_token_seconds", 0.0),
            "tokens_per_second": metrics.get("tokens_per_second", 0.0),
            "eval_tokens": metrics.get("eval_tokens", 0),
            "vram_used_mb": vram_after,
            "vram_total_mb": vram_total,
            "answer_length_chars": len(data.get("answer", ""))
        }
        benchmark_records.append(record)
        print(f"[{name}] Latency: {t_elapsed}s | TTFT: {record['ttft_seconds']}s | TPS: {record['tokens_per_second']} | VRAM: {vram_after}MB")

    summary = {
        "model": "qwen3:4b",
        "gpu_hardware": "NVIDIA GeForce RTX 4050 Laptop GPU (6141 MiB)",
        "peak_vram_mb": peak_vram_observed,
        "vram_capacity_mb": 6141,
        "vram_utilization_pct": round((peak_vram_observed / 6141) * 100, 1),
        "records": benchmark_records
    }

    out_path = "local_companion/audit/reliability_benchmark_results.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"\nSaved reliability benchmark results to {out_path}")
    return summary

if __name__ == "__main__":
    run_reliability_benchmarks()
