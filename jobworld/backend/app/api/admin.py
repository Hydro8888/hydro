from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.job import JobPosting
from app.models.resume import Resume
from app.models.application import Application
from app.models.search_log import SearchLog
from app.api.deps import require_admin
from datetime import datetime, date

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar()
    total_jobs = (await db.execute(select(func.count()).select_from(JobPosting).where(JobPosting.status == "active"))).scalar()
    total_resumes = (await db.execute(select(func.count()).select_from(Resume))).scalar()
    total_applications = (await db.execute(select(func.count()).select_from(Application))).scalar()

    today = date.today()
    searches_today = (await db.execute(
        select(func.count()).select_from(SearchLog)
        .where(func.date(SearchLog.created_at) == today)
    )).scalar()

    return {
        "total_users": total_users,
        "total_jobs": total_jobs,
        "total_resumes": total_resumes,
        "total_applications": total_applications,
        "searches_today": searches_today,
    }


@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    result = await db.execute(select(User).order_by(User.created_at.desc()).limit(100))
    users = result.scalars().all()
    return {"users": [
        {"id": u.id, "email": u.email, "name": u.name, "user_type": u.user_type, "is_active": u.is_active}
        for u in users
    ]}
