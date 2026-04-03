from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User, UserType
from app.models.job import JobPosting
from app.models.company import Company
from app.models.resume import Resume
from app.models.application import Application
from app.models.search_log import SearchLog
from app.models.worknet_job import WorknetJob
from app.api.deps import require_admin
from datetime import date

router = APIRouter(prefix="/admin", tags=["admin"])


# ── 대시보드 ──────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    total_users        = (await db.execute(select(func.count()).select_from(User))).scalar()
    total_employers    = (await db.execute(select(func.count()).select_from(User).where(User.user_type == UserType.employer))).scalar()
    total_jobs         = (await db.execute(select(func.count()).select_from(JobPosting).where(JobPosting.status == "active"))).scalar()
    total_jobs_all     = (await db.execute(select(func.count()).select_from(JobPosting))).scalar()
    total_resumes      = (await db.execute(select(func.count()).select_from(Resume))).scalar()
    total_applications = (await db.execute(select(func.count()).select_from(Application))).scalar()
    total_worknet      = (await db.execute(select(func.count()).select_from(WorknetJob))).scalar()

    today = date.today()
    searches_today = (await db.execute(
        select(func.count()).select_from(SearchLog)
        .where(func.date(SearchLog.created_at) == today)
    )).scalar()
    new_users_today = (await db.execute(
        select(func.count()).select_from(User)
        .where(func.date(User.created_at) == today)
    )).scalar()

    return {
        "total_users":        total_users,
        "total_employers":    total_employers,
        "total_jobs":         total_jobs,
        "total_jobs_all":     total_jobs_all,
        "total_resumes":      total_resumes,
        "total_applications": total_applications,
        "total_worknet":      total_worknet,
        "searches_today":     searches_today,
        "new_users_today":    new_users_today,
    }


# ── 회원 관리 ─────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    q: Optional[str] = Query(None),
    user_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = select(User)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(User.email.ilike(like), User.name.ilike(like)))
    if user_type:
        stmt = stmt.where(User.user_type == user_type)
    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar()
    stmt = stmt.order_by(desc(User.created_at)).offset((page - 1) * size).limit(size)
    users = (await db.execute(stmt)).scalars().all()

    return {
        "total": total, "page": page, "size": size,
        "users": [
            {
                "id": u.id, "email": u.email, "name": u.name,
                "user_type": u.user_type, "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
    }


class UpdateUserRequest(BaseModel):
    is_active: Optional[bool] = None
    user_type: Optional[str] = None
    name: Optional[str] = None


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    body: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(require_admin),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    if user_id == me.id:
        raise HTTPException(status_code=400, detail="자신의 계정은 수정할 수 없습니다.")
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.user_type is not None:
        try:
            user.user_type = UserType(body.user_type)
        except ValueError:
            raise HTTPException(status_code=400, detail="올바르지 않은 회원 유형입니다.")
    if body.name is not None:
        user.name = body.name
    await db.commit()
    await db.refresh(user)
    return {"id": user.id, "email": user.email, "name": user.name,
            "user_type": user.user_type, "is_active": user.is_active}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(require_admin),
):
    if user_id == me.id:
        raise HTTPException(status_code=400, detail="자신의 계정은 삭제할 수 없습니다.")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    await db.delete(user)
    await db.commit()
    return {"ok": True}


# ── 채용공고 관리 ──────────────────────────────────────────────────────────────

@router.get("/jobs")
async def list_jobs(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = select(JobPosting, Company.company_name).join(
        Company, JobPosting.company_id == Company.id, isouter=True
    )
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(JobPosting.title.ilike(like), Company.company_name.ilike(like)))
    if status:
        stmt = stmt.where(JobPosting.status == status)

    total = (await db.execute(select(func.count()).select_from(
        select(JobPosting).where(JobPosting.status == status if status else True).subquery()
    ))).scalar()

    stmt = stmt.order_by(desc(JobPosting.created_at)).offset((page - 1) * size).limit(size)
    rows = (await db.execute(stmt)).all()

    return {
        "total": total, "page": page, "size": size,
        "jobs": [
            {
                "id": j.id, "title": j.title,
                "company_name": cname or "기업명 미공개",
                "location": j.location, "job_type": j.job_type,
                "status": j.status, "deadline": j.deadline,
                "view_count": j.view_count,
                "created_at": j.created_at.isoformat() if j.created_at else None,
            }
            for j, cname in rows
        ],
    }


class UpdateJobRequest(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None
    deadline: Optional[str] = None


@router.patch("/jobs/{job_id}")
async def update_job(
    job_id: int,
    body: UpdateJobRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    job = await db.get(JobPosting, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다.")
    if body.status is not None:
        if body.status not in ("active", "closed", "draft"):
            raise HTTPException(status_code=400, detail="올바르지 않은 상태값입니다.")
        job.status = body.status
    if body.title is not None:
        job.title = body.title
    if body.deadline is not None:
        job.deadline = body.deadline
    await db.commit()
    return {"id": job.id, "status": job.status, "title": job.title}


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    job = await db.get(JobPosting, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다.")
    await db.delete(job)
    await db.commit()
    return {"ok": True}


# ── 지원 내역 ─────────────────────────────────────────────────────────────────

@router.get("/applications")
async def list_applications(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    total = (await db.execute(select(func.count()).select_from(Application))).scalar()

    stmt = (
        select(Application, User.name, User.email, JobPosting.title)
        .join(User, Application.user_id == User.id, isouter=True)
        .join(JobPosting, Application.job_posting_id == JobPosting.id, isouter=True)
        .order_by(desc(Application.applied_at))
        .offset((page - 1) * size).limit(size)
    )
    rows = (await db.execute(stmt)).all()

    return {
        "total": total, "page": page, "size": size,
        "applications": [
            {
                "id": a.id, "user_name": name or "-", "user_email": email or "-",
                "job_title": title or "-", "status": a.status,
                "applied_at": a.applied_at.isoformat() if a.applied_at else None,
            }
            for a, name, email, title in rows
        ],
    }


# ── 워크넷 공고 관리 ──────────────────────────────────────────────────────────

@router.get("/worknet")
async def list_worknet(
    q: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = select(WorknetJob)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(WorknetJob.title.ilike(like), WorknetJob.company_name.ilike(like)))
    if region:
        stmt = stmt.where(WorknetJob.location.ilike(f"%{region}%"))

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar()
    stmt = stmt.order_by(desc(WorknetJob.synced_at)).offset((page - 1) * size).limit(size)
    jobs = (await db.execute(stmt)).scalars().all()

    return {
        "total": total, "page": page, "size": size,
        "jobs": [
            {
                "id": j.wanted_auth_no, "company_name": j.company_name,
                "title": j.title, "location": j.location,
                "employment_type": j.employment_type, "deadline": j.deadline,
                "synced_at": j.synced_at.isoformat() if j.synced_at else None,
            }
            for j in jobs
        ],
    }


@router.delete("/worknet/{wanted_auth_no}")
async def delete_worknet_job(
    wanted_auth_no: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    job = await db.get(WorknetJob, wanted_auth_no)
    if not job:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다.")
    await db.delete(job)
    await db.commit()
    return {"ok": True}
