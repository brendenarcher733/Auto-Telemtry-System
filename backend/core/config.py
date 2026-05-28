# core/config.py — Central configuration, all env vars

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Automotive Telemetry Platform"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    version: str = "1.0.0"

    # Database — swap sqlite:/// for postgresql:// in production
    database_url: str = Field(
        default="sqlite:///./telemetry.db", alias="DATABASE_URL"
    )

    # AI provider — "mock" | "openai" | "anthropic"
    ai_provider: str = Field(default="mock", alias="AI_PROVIDER")
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o", alias="OPENAI_MODEL")

    # Telemetry simulation
    telemetry_interval_seconds: float = Field(default=2.0, alias="TELEMETRY_INTERVAL")
    anomaly_probability: float = Field(default=0.05, alias="ANOMALY_PROBABILITY")

    # CORS
    allowed_origins: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:4173"],
        alias="ALLOWED_ORIGINS"
    )

    # JWT-style mock auth secret
    secret_key: str = Field(default="dev-secret-change-in-production", alias="SECRET_KEY")

    class Config:
        env_file = ".env"
        populate_by_name = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
