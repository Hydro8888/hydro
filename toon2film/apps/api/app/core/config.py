from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Toon2Film"
    environment: str = "local"
    api_cors_origins: str = "http://localhost:3000"

    database_url: str = "postgresql+psycopg://toon2film:toon2film@localhost:5432/toon2film"
    redis_url: str = "redis://localhost:6379/0"

    s3_endpoint_url: str | None = None
    s3_region: str = "us-east-1"
    s3_bucket: str = "toon2film"
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None

    openai_api_key: str | None = None
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-5.5"
    openai_reasoning_effort: str = "high"
    openai_max_pages: int = 6
    openai_max_output_tokens: int = 5000
    openai_auto_analyze_on_upload: bool = True
    seedance_api_key: str | None = None
    seedance_base_url: str | None = None
    seedance_model: str = "seedance"

    encryption_key: str | None = None
    jwt_secret: str | None = None

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.api_cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
