from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.job import JobPosting
from app.models.company import Company
from app.api.deps import get_current_user, require_employer
from app.models.user import User

router = APIRouter(prefix="/jobs", tags=["jobs"])


class CreateJobRequest(BaseModel):
    title: str
    description: str
    location: str
    salary_range: Optional[str] = None
    job_type: str = "정규직"
    deadline: Optional[str] = None
    requirements: Optional[str] = None
    preferred: Optional[str] = None


def job_to_dict(job: JobPosting, company_name: str = "") -> dict:
    return {
        "id": job.id,
        "title": job.title,
        "company_name": company_name or "기업명 미공개",
        "location": job.location,
        "salary_range": job.salary_range,
        "job_type": job.job_type,
        "deadline": job.deadline,
        "description": job.description,
        "requirements": job.requirements,
        "preferred": job.preferred,
        "status": job.status,
        "view_count": job.view_count,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }


@router.get("")
async def list_jobs(
    q: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(JobPosting, Company.company_name)
        .join(Company, JobPosting.company_id == Company.id, isouter=True)
        .where(JobPosting.status == "active")
    )
    if q:
        stmt = stmt.where(JobPosting.title.ilike(f"%{q}%") | JobPosting.description.ilike(f"%{q}%"))
    if location:
        stmt = stmt.where(JobPosting.location.ilike(f"%{location}%"))
    if job_type:
        stmt = stmt.where(JobPosting.job_type == job_type)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar()

    stmt = stmt.order_by(JobPosting.created_at.desc()).offset((page - 1) * limit).limit(limit)
    rows = (await db.execute(stmt)).all()

    return {
        "jobs": [job_to_dict(job, company_name) for job, company_name in rows],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/{job_id}")
async def get_job(job_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(JobPosting, Company.company_name)
        .join(Company, JobPosting.company_id == Company.id, isouter=True)
        .where(JobPosting.id == job_id)
    )
    row = (await db.execute(stmt)).first()
    if not row:
        raise HTTPException(status_code=404, detail="채용공고를 찾을 수 없습니다.")

    job, company_name = row
    job.view_count += 1
    await db.commit()
    return job_to_dict(job, company_name)


@router.post("")
async def create_job(
    body: CreateJobRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_employer),
):
    # Get or create company
    result = await db.execute(select(Company).where(Company.user_id == user.id))
    company = result.scalar_one_or_none()
    if not company:
        company = Company(user_id=user.id, company_name=user.name)
        db.add(company)
        await db.flush()

    job = JobPosting(
        company_id=company.id,
        title=body.title,
        description=body.description,
        location=body.location,
        salary_range=body.salary_range,
        job_type=body.job_type,
        deadline=body.deadline,
        requirements=body.requirements,
        preferred=body.preferred,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job_to_dict(job, company.company_name)


@router.put("/{job_id}")
async def update_job(
    job_id: int,
    body: CreateJobRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_employer),
):
    result = await db.execute(
        select(JobPosting, Company.user_id, Company.company_name)
        .join(Company, JobPosting.company_id == Company.id)
        .where(JobPosting.id == job_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="채용공고를 찾을 수 없습니다.")
    job, company_user_id, company_name = row
    if company_user_id != user.id and user.user_type != "admin":
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    await db.commit()
    await db.refresh(job)
    return job_to_dict(job, company_name)


@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_employer),
):
    result = await db.execute(
        select(JobPosting, Company.user_id)
        .join(Company, JobPosting.company_id == Company.id)
        .where(JobPosting.id == job_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="채용공고를 찾을 수 없습니다.")
    job, company_user_id = row
    if company_user_id != user.id and user.user_type != "admin":
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    await db.delete(job)
    await db.commit()
    return {"message": "삭제되었습니다."}
