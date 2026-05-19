from pydantic_settings import BaseSettings
from pydantic import AnyUrl, EmailStr, validator, field_validator
from typing import List, Optional
import secrets

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Fitness Tracker API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: AnyUrl

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Email (for Celery tasks)
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[EmailStr] = None
    EMAILS_FROM_NAME: Optional[str] = None

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "https://your-vercel-app.vercel.app"]

    # Admin emails for exercise management
    ADMIN_EMAILS: List[str] = ["admin@example.com"]

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def normalize_debug(cls, v):
        if isinstance(v, str):
            lowered = v.strip().lower()
            if lowered in {"release", "prod", "production"}:
                return False
            if lowered in {"dev", "development"}:
                return True
        return v

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v):
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
