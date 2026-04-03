"""
워크넷 채용공고 API 라우터.

GET  /api/v1/worknet/jobs         — 페이징 + 지역/직종 필터 목록
GET  /api/v1/worknet/jobs/{id}    — 단건 조회
POST /api/v1/worknet/sync         — 수동 동기화 (관리자 전용)
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.database import get_db
from app.models.worknet_job import WorknetJob
from app.services.worknet_sync import sync_worknet_jobs

router = APIRouter(prefix="/worknet", tags=["worknet"])


# ── 응답 직렬화 헬퍼 ─────────────────────────────────────────────────────────

def _job_to_dict(job: WorknetJob) -> dict:
    return {
        "id":              job.wanted_auth_no,
        "company_name":    job.company_name,
        "title":           job.title,
        "job_category":    job.job_category,
        "employment_type": job.employment_type,
        "location":        job.location,
        "salary":          job.salary,
        "education":       job.education,
        "career":          job.career,
        "deadline":        job.deadline,
        "reg_date":        job.reg_date,
        "source_url":      job.source_url,
        "synced_at":       job.synced_at.isoformat() if job.synced_at else None,
        "source":          "worknet",
    }


# ── 엔드포인트 ───────────────────────────────────────────────────────────────

@router.get("/jobs")
async def list_worknet_jobs(
    q: Optional[str] = Query(None, description="검색어 (제목·회사명·직종 포함 검색)"),
    region: Optional[str] = Query(None, description="지역 필터 (예: 서울, 경기)"),
    category: Optional[str] = Query(None, description="직종 필터"),
    employment_type: Optional[str] = Query(None, description="고용형태 (정규직, 계약직 …)"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    db: AsyncSession = Depends(get_db),
):
    """
    워크넷 채용공고 목록.
    검색어, 지역, 직종, 고용형태 필터 + 페이지네이션 지원.
    """
    stmt = select(WorknetJob)

    # 키워드 검색 (제목 OR 회사명 OR 직종)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                WorknetJob.title.ilike(like),
                WorknetJob.company_name.ilike(like),
                WorknetJob.job_category.ilike(like),
            )
        )

    if region:
        stmt = stmt.where(WorknetJob.location.ilike(f"%{region}%"))

    if category:
        stmt = stmt.where(WorknetJob.job_category.ilike(f"%{category}%"))

    if employment_type:
        stmt = stmt.where(WorknetJob.employment_type.ilike(f"%{employment_type}%"))

    # 전체 건수
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total: int = (await db.execute(count_stmt)).scalar_one()

    # 페이징 — 최신 등록순
    stmt = (
        stmt
        .order_by(WorknetJob.reg_date.desc(), WorknetJob.synced_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    jobs = (await db.execute(stmt)).scalars().all()

    return {
        "total": total,
        "page":  page,
        "size":  size,
        "items": [_job_to_dict(j) for j in jobs],
    }


@router.get("/jobs/{wanted_auth_no}")
async def get_worknet_job(
    wanted_auth_no: str,
    db: AsyncSession = Depends(get_db),
):
    """워크넷 채용공고 단건 조회."""
    job = await db.get(WorknetJob, wanted_auth_no)
    if not job:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다.")
    return _job_to_dict(job)


@router.post("/sync")
async def trigger_sync(
    region: Optional[str] = Query(None),
    occupation: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    max_pages: int = Query(10, ge=1, le=50),
    _: dict = Depends(require_admin),   # 관리자 전용
):
    """
    워크넷 데이터 수동 동기화 (관리자 전용).
    스케줄러를 기다리지 않고 즉시 실행.
    """
    result = await sync_worknet_jobs(
        region=region,
        occupation=occupation,
        keyword=keyword,
        max_pages=max_pages,
    )
    if result["error"]:
        raise HTTPException(status_code=502, detail=f"동기화 오류: {result['error']}")
    return result
