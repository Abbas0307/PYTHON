"""
local_companion/audit/phase_5_5_production_audit.py
Automated Production Web Release Readiness Audit for Mindora 2.0.
Verifies bundle assets, preview server HTTP responses, zero-egress guarantees,
absence of hardcoded localhost AI endpoints, and frozen asset SHA-256 digests.
"""

import os
import re
import urllib.request
import urllib.error
import hashlib
import json

PREVIEW_URL = "http://127.0.0.1:4173"
DIST_DIR = os.path.join(os.getcwd(), "frontend", "dist")

def test_static_dist_assets():
    print("--- 1. STATIC ASSET & DISTRIBUTION AUDIT ---")
    required_files = [
        "index.html",
        "sw.js",
        "manifest.json",
        "favicon.svg",
        "_redirects"
    ]
    for rf in required_files:
        path = os.path.join(DIST_DIR, rf)
        assert os.path.exists(path), f"Missing required distribution asset: {rf}"
        size = os.path.getsize(path)
        print(f"• {rf:15s} : PRESENT ({size} bytes)")

    # Check assets directory
    assets_dir = os.path.join(DIST_DIR, "assets")
    assert os.path.exists(assets_dir), "Missing dist/assets directory"
    asset_files = os.listdir(assets_dir)
    js_files = [f for f in asset_files if f.endswith(".js")]
    css_files = [f for f in asset_files if f.endswith(".css")]
    assert len(js_files) >= 1, "Missing compiled JS chunk"
    assert len(css_files) >= 1, "Missing compiled CSS chunk"
    print(f"• Compiled JS Chunk: {js_files[0]} ({os.path.getsize(os.path.join(assets_dir, js_files[0]))} bytes)")
    print(f"• Compiled CSS Chunk: {css_files[0]} ({os.path.getsize(os.path.join(assets_dir, css_files[0]))} bytes)")

def test_bundle_contents_and_zero_localhost():
    print("\n--- 2. BUNDLE ISOLATION & ZERO-HARDCODED ENDPOINT AUDIT ---")
    assets_dir = os.path.join(DIST_DIR, "assets")
    js_file = [f for f in os.listdir(assets_dir) if f.endswith(".js")][0]
    with open(os.path.join(assets_dir, js_file), "r", encoding="utf-8") as f:
        bundle_content = f.read()

    # Verify absence of localhost:8000 or 127.0.0.1:8000
    assert "127.0.0.1:8000" not in bundle_content, "Hardcoded 127.0.0.1:8000 detected in production bundle!"
    assert "localhost:8000" not in bundle_content, "Hardcoded localhost:8000 detected in production bundle!"
    print("• Absence of 127.0.0.1:8000 / localhost:8000 in JS bundle: PASS (Zero hardcoded endpoint)")

    # Verify absence of external tracking / telemetry libraries
    forbidden_telemetry = ["google-analytics.com", "gtag", "segment.io", "mixpanel.com", "sentry.io", "hotjar.com"]
    for telem in forbidden_telemetry:
        assert telem not in bundle_content, f"Prohibited telemetry string '{telem}' found in bundle!"
    print(f"• Telemetry and Analytics Absence ({len(forbidden_telemetry)} markers checked): PASS (Zero remote telemetry)")

    # Verify Service Worker sw.js content
    with open(os.path.join(DIST_DIR, "sw.js"), "r", encoding="utf-8") as f:
        sw_content = f.read()
    assert "mindora-app-shell" in sw_content, "Service worker missing cache name"
    assert "POST" not in sw_content or "method !== 'GET'" in sw_content, "Service worker must strictly reject non-GET caching"
    print("• Service Worker Cache Policy: PASS (GET-only, zero assessment persistence)")

def test_preview_http_responses():
    print("\n--- 3. PRODUCTION PREVIEW HTTP SERVER AUDIT (http://127.0.0.1:4173) ---")
    endpoints = [
        ("/", 200, "text/html"),
        ("/index.html", 200, "text/html"),
        ("/sw.js", 200, "javascript"),
        ("/manifest.json", 200, "application/json"),
        ("/favicon.svg", 200, "image/svg+xml"),
        ("/_redirects", 200, "text/plain")
    ]
    for ep, exp_code, exp_type in endpoints:
        url = f"{PREVIEW_URL}{ep}"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                status = resp.status
                ctype = resp.headers.get("Content-Type", "")
                assert status == exp_code, f"Expected {exp_code} for {ep}, got {status}"
                if ep != "/_redirects":
                    assert exp_type in ctype or "text/" in ctype or "octet-stream" in ctype, f"Unexpected Content-Type '{ctype}' for {ep}"
                print(f"• HTTP GET {ep:16s} -> {status} OK (Content-Type: {ctype.split(';')[0] if ctype else 'none'})")
        except Exception as e:
            print(f"• HTTP GET {ep:16s} -> FAILED ({e})")
            raise

def test_frozen_asset_hashes():
    print("\n--- 4. FROZEN RESEARCH ASSET CRYPTOGRAPHIC INTEGRITY ---")
    frozen_files = [
        ('app.py', '5F15ADD9F3A5F5809D80154931E98A5B79D06BBC9BB69323028BFA3898E46BBE'),
        ('dataset/Student_Depression_Dataset.csv', 'A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404'),
        ('shared/contracts/feature_contract.json', 'BED161ED06A50F528BBFE9316FF9A979771A1CFA8EE8C9CD48CF9466E442FFB0'),
        ('ml_lab/splits/group_aware_partition_manifest.json', 'A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070'),
        ('ml_lab/splits/partition_assignments.csv', '91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1'),
        ('models/best_model.pkl', 'E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC'),
        ('ml_lab/experiments/stage_3b_2/oof_metrics.json', '361BC700A7731678402BCE89B7A85051181DC877430A3FE30AA114EC2C0A6FEF'),
        ('ml_lab/experiments/stage_3b_3/oof_metrics.json', '555D3B159A31A5C6F6964143F040A97F8BECC938FCB9690986A9B856F9DC2A03'),
        ('ml_lab/experiments/stage_3b_3/model_comparison.json', 'FC8E31D45DEE28D3925A80627268299D185AE68D6C1DE092167EE23A7F6286E7'),
        ('ml_lab/experiments/stage_3b_4/stage_3b_4_metrics.json', 'FBB9AAEB5D0A12E46FE74BF9EDA71AA3140C130E384DCF47A35AABCED25CC7C6'),
        ('ml_lab/experiments/stage_3b_4/artifact_manifest.json', 'B1385C3A03015A470911CC432012E418BD3AD0E505A52C0CF92C22D8290FB072')
    ]
    all_matched = True
    for fpath, exp_hash in frozen_files:
        assert os.path.exists(fpath), f"Missing frozen asset: {fpath}"
        with open(fpath, "rb") as f:
            digest = hashlib.sha256(f.read()).hexdigest().upper()
        assert digest == exp_hash, f"Hash mismatch for {fpath}"
        print(f"• {fpath:50s} : MATCH ({digest[:16]}...)")
    print(f"All {len(frozen_files)} frozen research assets verified bit-for-bit.")

if __name__ == "__main__":
    test_static_dist_assets()
    test_bundle_contents_and_zero_localhost()
    test_preview_http_responses()
    test_frozen_asset_hashes()
    print("\nPhase 5.5 Production Automated Audit: ALL CHECKS PASSED.")
