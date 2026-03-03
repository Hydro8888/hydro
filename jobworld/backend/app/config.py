from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://jobworld:password@db:5432/jobworld"
    # JWT
    secret_key: str = "change-this-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    # Redis
    redis_url: str = "redis://redis:6379"
    # Elasticsearch
    elasticsearch_url: str = "http://elasticsearch:9200"
    # AI
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "https://jobworld.co.kr"]

    class Config:
        env_file = ".env"


settings = Settings()
