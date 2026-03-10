from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db
from app.api import auth, jobs, resumes, applications, search, admin, worknet
from app.services.worknet_sync import worknet_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Gemini 설정 상태 로깅
    import logging
    _log = logging.getLogger("app.startup")
    has_key = bool(settings.gemini_api_key)
    _log.info(
        "[Startup] Gemini config — key_present=%s model=%s grounding_model=%s",
        has_key, settings.gemini_model, settings.gemini_grounding_model,
    )
    if not has_key:
        _log.warning(
            "[Startup] GEMINI_API_KEY is NOT set! "
            "Add GEMINI_API_KEY=your-key to .env and restart the container."
        )
    # 워크넷 스케줄러 시작
    if settings.worknet_api_key:
        worknet_scheduler.start()
    else:
        _log.warning("[Startup] WORKNET_API_KEY 미설정 — 워크넷 자동 동기화 비활성화")
    yield
    worknet_scheduler.shutdown()


app = FastAPI(
    title="JobWorld API",
    description="AI 기반 구인구직 플랫폼 API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(resumes.router, prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(worknet.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "jobworld-api"}


@app.get("/")
async def root():
    return {"message": "JobWorld API v1.0"}
