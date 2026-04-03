from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.application import Application
from app.models.resume import Resume
from app.models.job import JobPosting
from app.api.deps import require_user
from app.models.user import User

router = APIRouter(prefix="/applications", tags=["applications"])


class CreateApplicationRequest(BaseModel):
    job_posting_id: int
    resume_id: int


@router.post("")
async def apply(
    body: CreateApplicationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    # Verify job exists
    job = (await db.execute(select(JobPosting).where(JobPosting.id == body.job_posting_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="채용공고를 찾을 수 없습니다.")

    # Verify resume belongs to user
    resume = (await db.execute(select(Resume).where(Resume.id == body.resume_id, Resume.user_id == user.id))).scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="이력서를 찾을 수 없습니다.")

    # Check duplicate
    existing = (await db.execute(
        select(Application).where(
            Application.job_posting_id == body.job_posting_id,
            Application.user_id == user.id,
        )
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="이미 지원한 공고입니다.")

    app = Application(job_posting_id=body.job_posting_id, resume_id=body.resume_id, user_id=user.id)
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return {"id": app.id, "status": app.status, "applied_at": app.applied_at.isoformat()}


@router.get("")
async def my_applications(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    result = await db.execute(
        select(Application).where(Application.user_id == user.id).order_by(Application.applied_at.desc())
    )
    apps = result.scalars().all()
    return {"applications": [
        {"id": a.id, "job_posting_id": a.job_posting_id, "status": a.status, "applied_at": a.applied_at.isoformat()}
        for a in apps
    ]}
