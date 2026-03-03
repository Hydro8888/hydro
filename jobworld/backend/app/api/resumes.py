from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.resume import Resume
from app.api.deps import require_user
from app.models.user import User

router = APIRouter(prefix="/resumes", tags=["resumes"])


class CreateResumeRequest(BaseModel):
    title: str
    education: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    introduction: Optional[str] = None
    is_public: bool = True


def resume_to_dict(r: Resume) -> dict:
    return {
        "id": r.id,
        "title": r.title,
        "education": r.education,
        "experience": r.experience,
        "skills": r.skills,
        "introduction": r.introduction,
        "is_public": r.is_public,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.get("")
async def list_resumes(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    result = await db.execute(select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc()))
    resumes = result.scalars().all()
    return {"resumes": [resume_to_dict(r) for r in resumes]}


@router.get("/{resume_id}")
async def get_resume(
    resume_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="이력서를 찾을 수 없습니다.")
    if resume.user_id != user.id and not resume.is_public:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    return resume_to_dict(resume)


@router.post("")
async def create_resume(
    body: CreateResumeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    resume = Resume(user_id=user.id, **body.model_dump())
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return resume_to_dict(resume)


@router.put("/{resume_id}")
async def update_resume(
    resume_id: int,
    body: CreateResumeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="이력서를 찾을 수 없습니다.")
    for field, value in body.model_dump().items():
        setattr(resume, field, value)
    await db.commit()
    await db.refresh(resume)
    return resume_to_dict(resume)
