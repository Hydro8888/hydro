import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel, field_validator

from app.database import get_db
from app.services.realtime_search import realtime_search
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/search", tags=["search"])
logger = logging.getLogger(__name__)

VALID_SEARCH_TYPES = {"auto", "구인", "구직", "job", "resume"}
TYPE_MAP = {"job": "구인", "resume": "구직"}


class AISearchRequest(BaseModel):
    query: str
    search_type: str = "auto"

    @field_validator("query")
    @classmethod
    def query_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("검색어를 입력해주세요.")
        if len(v) > 200:
            raise ValueError("검색어는 200자 이내로 입력해주세요.")
        return v

    @field_validator("search_type")
    @classmethod
    def normalize_type(cls, v: str) -> str:
        v = v.strip()
        return TYPE_MAP.get(v, v if v in VALID_SEARCH_TYPES else "auto")


@router.post("/ai")
async def ai_search_endpoint(
    body: AISearchRequest,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    """
    Real-time AI search endpoint.
    Pipeline: local DB first → external Gemini grounding → AI analysis.
    Never fails completely — always returns local results even if AI is down.
    """
    logger.info("[API /search/ai] query=%r type=%s user=%s",
                body.query, body.search_type, user.id if user else None)

    return await realtime_search(
        db,
        body.query,
        search_type=body.search_type,
        user_id=user.id if user else None,
    )


@router.get("")
async def search(
    q: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    salary_min: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Standard filter-based search (non-AI, local DB only)."""
    from app.api.jobs import list_jobs
    return await list_jobs(
        q=q, location=location, job_type=job_type,
        page=page, limit=limit, db=db
    )
