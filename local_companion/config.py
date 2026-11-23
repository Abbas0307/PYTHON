"""
local_companion/config.py
Production-hardened configuration parameters for the Mindora 2.0 Local AI Resource Companion and API Service.
Supports seamless switching between development, testing, and production modes via environment variables.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))

from pydantic import BaseModel, Field
from typing import List, Optional

def _get_default_db_path() -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, "..", "data", "mindora_auth.db")

def _get_allowed_origins() -> List[str]:
    env_origins = os.getenv("MINDORA_ALLOWED_ORIGINS")
    if env_origins:
        return [orig.strip() for orig in env_origins.split(",") if orig.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173"
    ]

class CompanionConfig(BaseModel):
    # Application Environment Mode: development | production | testing
    environment: str = Field(default_factory=lambda: os.getenv("MINDORA_ENV", "development").lower())

    # Service Network Settings
    host: str = Field(default_factory=lambda: os.getenv("MINDORA_HOST", "127.0.0.1"))
    port: int = Field(default_factory=lambda: int(os.getenv("PORT", os.getenv("MINDORA_PORT", "8000"))))
    allowed_origins: List[str] = Field(default_factory=_get_allowed_origins)

    # Database & Storage
    db_path: str = Field(default_factory=lambda: os.getenv("MINDORA_DB_PATH", _get_default_db_path()))

    # Secret Key for Security Token Signing
    secret_key: str = Field(
        default_factory=lambda: os.getenv(
            "MINDORA_SECRET_KEY",
            "dev_insecure_secret_key_replace_in_production_32bytes_minimum_length_required"
        )
    )

    # API Documentation Visibility
    docs_enabled: bool = Field(
        default_factory=lambda: (
            os.getenv(
                "MINDORA_DOCS_ENABLED",
                "false" if os.getenv("MINDORA_ENV", "").lower() == "production" else "true"
            ).lower() in ("true", "1", "yes")
        )
    )

    # Model Runtime Settings
    ollama_base_url: str = Field(default_factory=lambda: os.getenv("MINDORA_OLLAMA_BASE_URL", "http://127.0.0.1:11434"))
    model_name: str = Field(default_factory=lambda: os.getenv("MINDORA_OLLAMA_MODEL", "qwen3:4b"))
    model_size_gb: float = 2.5
    temperature: float = 0.1
    top_p: float = 0.9
    max_tokens: int = 1600
    request_timeout_seconds: float = 45.0

    # Hardware Limits (NVIDIA RTX 4050 6GB VRAM, 16GB System RAM)
    max_vram_allocation_mb: int = 4096
    target_vram_usage_mb: int = 3200

    # Privacy & Safety Policy
    enable_chat_logging: bool = False
    ephemeral_only: bool = True
    prohibit_assessment_data: bool = True

    def is_production(self) -> bool:
        return self.environment == "production"

    def is_development(self) -> bool:
        return self.environment == "development"

    def is_testing(self) -> bool:
        return self.environment == "testing"

    def validate_production_configuration(self) -> List[str]:
        """
        Validate production settings against security standards.
        Returns list of configuration violation errors.
        """
        errors = []
        if self.is_production():
            # Check secret key
            if not self.secret_key or "replace_in_production" in self.secret_key or len(self.secret_key) < 32:
                errors.append("MINDORA_SECRET_KEY must be a cryptographically random string of >= 32 characters in production.")
            # Check CORS
            if any(orig == "*" for orig in self.allowed_origins):
                errors.append("Wildcard CORS origins ('*') are strictly prohibited in production.")
            if not self.allowed_origins:
                errors.append("MINDORA_ALLOWED_ORIGINS cannot be empty in production.")
            # Check DB path exists or parent dir is writable
            db_dir = os.path.dirname(os.path.abspath(self.db_path))
            if not os.path.exists(db_dir):
                errors.append(f"Database directory {db_dir} does not exist.")
        return errors

CONFIG = CompanionConfig()
