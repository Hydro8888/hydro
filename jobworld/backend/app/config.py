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
    # WorkNet OpenAPI
    worknet_api_key: str = ""
    # AI
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.5-flash-lite"
    # Google Search 그라운딩용 모델. gemini-2.5-flash 이상 권장.
    gemini_grounding_model: str = "gemini-2.5-flash"
    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "https://jobworld.co.kr",
        "http://211.198.54.207",
        "http://211.198.54.207:8080",
        "http://172.30.1.99",
        "http://172.30.1.99:3100",
        "http://172.30.1.99:8080",
    ]

    class Config:
        env_file = ".env"


settings = Settings()
