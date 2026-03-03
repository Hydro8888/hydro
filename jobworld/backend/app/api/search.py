from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.services.ai_search import ai_search
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/search", tags=["search"])


class AISearchRequest(BaseModel):
    query: str


@router.post("/ai")
async def ai_search_endpoint(
    body: AISearchRequest,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    """AI-powered natural language job search."""
    results = await ai_search(db, body.query, user_id=user.id if user else None)
    return results


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
    """Standard filtered search."""
    from app.api.jobs import list_jobs
    return await list_jobs(q=q, location=location, job_type=job_type, page=page, limit=limit, db=db)
