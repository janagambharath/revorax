"""
Revorax Backend — Application Configuration

All settings loaded from environment variables with sensible defaults
for local development. In production (Railway), set these via the
dashboard or railway.toml.
"""

from functools import lru_cache

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings


def normalize_database_url(url: str) -> str:
    """Make Railway's standard Postgres URL usable by async SQLAlchemy."""
    if url.startswith("postgres://"):
        return f"postgresql+asyncpg://{url.removeprefix('postgres://')}"
    if url.startswith("postgresql://"):
        return f"postgresql+asyncpg://{url.removeprefix('postgresql://')}"
    return url


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "Revorax"
    APP_ENV: str = "development"  # development | staging | production
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # ── Database ─────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/revorax"
    DATABASE_ECHO: bool = False

    # ── Redis ────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Auth / JWT ───────────────────────────────────────
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # â”€â”€ Workflow safety â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # Buying a phone number is a chargeable, externally-visible action. Keep
    # self-service provisioning off until billing/KYC approval exists.
    ENABLE_SELF_SERVICE_PROVISIONING: bool = False
    # Launch as an approved-pilot product. Public account creation stays off
    # until email verification, billing, and support operations are ready.
    ENABLE_SELF_SERVICE_SIGNUP: bool = False
    PILOT_SIGNUP_CODES: list[str] = []
    # SMS automation is consent-gated in code and intentionally needs an
    # explicit production opt-in after A2P registration and policy review.
    ENABLE_SMS_AUTOMATION: bool = False
    # Used only by the operator-only existing-number attachment endpoint.
    ADMIN_PROVISIONING_TOKEN: str = ""
    CRM_WEBHOOK_SIGNING_SECRET: str = ""
    # Exact public hostnames approved by the operator, e.g.
    # ["hooks.zapier.com", "webhooks.example-crm.com"]. Empty disables
    # custom CRM delivery rather than exposing the worker to tenant SSRF.
    CRM_WEBHOOK_ALLOWED_HOSTS: list[str] = []
    AUTOMATION_WORKER_POLL_SECONDS: float = 2.0
    AUTOMATION_WORKER_BATCH_SIZE: int = 20
    AUTOMATION_STALE_MINUTES: int = 15

    # ── Twilio ───────────────────────────────────────────
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""  # Fallback / default number

    # ── AI / LLM (OpenRouter) ────────────────────────────
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "deepseek/deepseek-chat-v3-0324:free"

    # ── Speech-to-Text (Groq Whisper) ────────────────────
    GROQ_API_KEY: str = ""
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

    # ── Email (Resend) ───────────────────────────────────
    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "Revorax <noreply@revorax.com>"

    # ── Payments (Stripe) ────────────────────────────────
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_STARTER_PRICE_ID: str = ""
    STRIPE_PRO_PRICE_ID: str = ""
    STRIPE_SETUP_FEE_PRICE_ID: str = ""

    # ── Storage (Cloudflare R2) ──────────────────────────
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "revorax-recordings"
    R2_ENDPOINT_URL: str = ""

    # ── Monitoring ───────────────────────────────────────
    SENTRY_DSN: str = ""

    # ── CORS ─────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }

    @field_validator("DEBUG", mode="before")
    @classmethod
    def normalize_debug_value(cls, value: object) -> object:
        """Accept common Railway/environment labels without starting in debug."""
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "production", "prod", "false", "0", "no", "off"}:
                return False
            if normalized in {"development", "dev", "debug", "true", "1", "yes", "on"}:
                return True
        return value

    @field_validator("APP_ENV", mode="before")
    @classmethod
    def normalize_app_env(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            return {
                "prod": "production",
                "release": "production",
                "dev": "development",
            }.get(normalized, normalized)
        return value

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        """Fail closed if a Railway production deploy still has dev secrets."""
        if self.APP_ENV.lower() != "production":
            return self

        problems: list[str] = []
        if self.DEBUG:
            problems.append("DEBUG must be false")
        if self.JWT_SECRET_KEY in {"", "change-me-in-production"} or len(self.JWT_SECRET_KEY) < 32:
            problems.append("JWT_SECRET_KEY must be a unique secret of at least 32 characters")
        if not self.FRONTEND_URL.startswith("https://"):
            problems.append("FRONTEND_URL must use HTTPS")
        if not self.BACKEND_URL.startswith("https://"):
            problems.append("BACKEND_URL must use HTTPS")
        if "localhost" in self.DATABASE_URL or "127.0.0.1" in self.DATABASE_URL:
            problems.append("DATABASE_URL must point to a managed production database")
        if "*" in self.CORS_ORIGINS:
            problems.append("CORS_ORIGINS cannot contain *")
        if not self.ENABLE_SELF_SERVICE_SIGNUP:
            weak_invites = [
                code for code in self.PILOT_SIGNUP_CODES
                if not isinstance(code, str) or len(code.strip()) < 16
            ]
            if weak_invites:
                problems.append("PILOT_SIGNUP_CODES entries must be at least 16 characters")
        if (self.ENABLE_SELF_SERVICE_PROVISIONING or self.ENABLE_SMS_AUTOMATION) and (
            not self.TWILIO_ACCOUNT_SID or not self.TWILIO_AUTH_TOKEN
        ):
            problems.append("Twilio credentials are required when telephony automation is enabled")
        if self.AUTOMATION_WORKER_BATCH_SIZE < 1 or self.AUTOMATION_WORKER_BATCH_SIZE > 100:
            problems.append("AUTOMATION_WORKER_BATCH_SIZE must be between 1 and 100")
        if self.AUTOMATION_WORKER_POLL_SECONDS <= 0:
            problems.append("AUTOMATION_WORKER_POLL_SECONDS must be greater than zero")
        if problems:
            raise ValueError("Unsafe production configuration: " + "; ".join(problems))
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
