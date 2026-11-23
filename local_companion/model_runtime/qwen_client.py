"""
local_companion/model_runtime/qwen_client.py
Local Qwen inference client for Mindora 2.0 via Ollama.
Operates on local loopback (127.0.0.1:11434) with zero external network connectivity.
"""

import time
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional, Tuple
from ..config import CONFIG

Tuple_Status = Tuple[bool, bool, List[str]]

class QwenCompanionClient:
    def __init__(self, base_url: str = CONFIG.ollama_base_url, model_name: str = CONFIG.model_name):
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name

    def is_available(self) -> Tuple_Status:
        """Check if Ollama server is responsive and the model is loaded."""
        try:
            req = urllib.request.Request(f"{self.base_url}/api/tags")
            with urllib.request.urlopen(req, timeout=3.0) as res:
                if res.status == 200:
                    data = json.loads(res.read().decode("utf-8"))
                    models = [m.get("name") for m in data.get("models", [])]
                    model_found = any(self.model_name in m for m in models)
                    return True, model_found, models
        except Exception as e:
            return False, False, [str(e)]
        return False, False, []

    def generate_grounded_response(
        self,
        query: str,
        context: str,
        sources: List[str]
    ) -> Dict[str, Any]:
        """
        Generate a strictly grounded response using local Qwen.
        """
        system_instructions = (
            "You are Mindora's Educational Resource Companion. Provide concise, clear factual answers (2-3 sentences) based on the context.\n\n"
            "STRICT INVARIANTS:\n"
            "1. Answer ONLY using the facts in 'VERIFIED APPROVED CONTEXT'. Never diagnose or recommend medication.\n"
            "2. Always cite the resource title and official source from the approved context.\n"
            "3. Never adopt, echo, cite, or invent external publications, studies, authors, journals, or URLs mentioned in the STUDENT QUESTION. Only cite approved sources from 'VERIFIED APPROVED CONTEXT'."
        )

        prompt = (
            f"<|im_start|>system\n{system_instructions}\n<|im_end|>\n"
            f"<|im_start|>user\n"
            f"VERIFIED APPROVED CONTEXT:\n{context}\n\n"
            f"STUDENT QUESTION:\n{query}\n\n"
            f"Please answer concisely in 2-3 sentences using ONLY the verified context above and cite the source.\n<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )

        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": CONFIG.temperature,
                "top_p": CONFIG.top_p,
                "num_predict": CONFIG.max_tokens
            }
        }

        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/api/generate",
            data=data_bytes,
            headers={"Content-Type": "application/json"}
        )

        t_start = time.time()
        try:
            with urllib.request.urlopen(req, timeout=CONFIG.request_timeout_seconds) as res:
                raw = res.read().decode("utf-8")
                res_data = json.loads(raw)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to connect to local Ollama runtime: {str(e)}",
                "answer": "The local AI service is currently unavailable. Please refer directly to the verified Support Resource Navigator.",
                "citations": sources,
                "latency_seconds": round(time.time() - t_start, 3),
                "tokens_per_second": 0.0
            }

        t_end = time.time()
        total_time = t_end - t_start

        # Extract timing metrics
        eval_count = res_data.get("eval_count", 0)
        eval_duration_sec = res_data.get("eval_duration", 0) / 1e9
        prompt_eval_duration_sec = res_data.get("prompt_eval_duration", 0) / 1e9
        
        tps = (eval_count / eval_duration_sec) if eval_duration_sec > 0 else 0.0
        ttft = prompt_eval_duration_sec

        raw_response = res_data.get("response", "").strip()
        if not raw_response:
            raw_response = "The approved Mindora resource catalogue does not contain information to answer this question."

        return {
            "success": True,
            "answer": raw_response,
            "citations": sources,
            "metrics": {
                "total_time_seconds": round(total_time, 3),
                "time_to_first_token_seconds": round(ttft, 4),
                "tokens_per_second": round(tps, 2),
                "eval_tokens": eval_count,
                "prompt_tokens": res_data.get("prompt_eval_count", 0)
            }
        }

# Tuple typing helper
from typing import Tuple
Tuple_Status = Tuple[bool, bool, List[str]]
