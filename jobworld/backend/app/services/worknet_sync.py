"""
워크넷 데이터 동기화 서비스.

- sync_worknet_jobs(): 전체 수집 + DB upsert
- WorknetScheduler: APScheduler 기반 매일 새벽 3시 자동 실행
"""

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.worknet_job import WorknetJob
from app.services.worknet_client import worknet_client

log = logging.getLogger("worknet.sync")


# ── Upsert 로직 ──────────────────────────────────────────────────────────────

async def _upsert_jobs(session: AsyncSession, jobs: list[dict]) -> tuple[int, int]:
    """
    jobs 목록을 worknet_jobs 테이블에 upsert.
    PostgreSQL의 ON CONFLICT DO UPDATE 사용.

    Returns:
        (inserted, updated) — 삽입/갱신 건수 (근사치)
    """
    if not jobs:
        return 0, 0

    now = datetime.now(timezone.utc)

    # synced_at 필드 추가
    rows = [{**job, "synced_at": now} for job in jobs]

    # 기존 공고 ID 조회 (inserted vs updated 카운트용)
    existing_ids = set(
        row[0]
        for row in (
            await session.execute(
                select(WorknetJob.wanted_auth_no).where(
                    WorknetJob.wanted_auth_no.in_([r["wanted_auth_no"] for r in rows])
                )
            )
        ).fetchall()
    )

    stmt = (
        pg_insert(WorknetJob)
        .values(rows)
        .on_conflict_do_update(
            index_elements=["wanted_auth_no"],
            set_={
                "company_name":    pg_insert(WorknetJob).excluded.company_name,
                "title":           pg_insert(WorknetJob).excluded.title,
                "job_category":    pg_insert(WorknetJob).excluded.job_category,
                "employment_type": pg_insert(WorknetJob).excluded.employment_type,
                "location":        pg_insert(WorknetJob).excluded.location,
                "salary":          pg_insert(WorknetJob).excluded.salary,
                "education":       pg_insert(WorknetJob).excluded.education,
                "career":          pg_insert(WorknetJob).excluded.career,
                "deadline":        pg_insert(WorknetJob).excluded.deadline,
                "reg_date":        pg_insert(WorknetJob).excluded.reg_date,
                "source_url":      pg_insert(WorknetJob).excluded.source_url,
                "synced_at":       pg_insert(WorknetJob).excluded.synced_at,
            },
        )
    )

    await session.execute(stmt)
    await session.commit()

    updated = len([r for r in rows if r["wanted_auth_no"] in existing_ids])
    inserted = len(rows) - updated
    return inserted, updated


# ── 메인 동기화 함수 ─────────────────────────────────────────────────────────

async def sync_worknet_jobs(
    region: str | None = None,
    occupation: str | None = None,
    keyword: str | None = None,
    max_pages: int = 10,
) -> dict:
    """
    워크넷 API에서 공고를 수집하고 DB에 upsert.

    Returns:
        {"fetched": int, "inserted": int, "updated": int, "error": str|None}
    """
    log.info("[WorknetSync] 시작 — region=%s occupation=%s keyword=%s", region, occupation, keyword)
    result = {"fetched": 0, "inserted": 0, "updated": 0, "error": None}

    try:
        jobs = await worknet_client.fetch_all_jobs(
            region=region,
            occupation=occupation,
            keyword=keyword,
            max_pages=max_pages,
        )
        result["fetched"] = len(jobs)

        if jobs:
            async with AsyncSessionLocal() as session:
                inserted, updated = await _upsert_jobs(session, jobs)
                result["inserted"] = inserted
                result["updated"] = updated

        log.info(
            "[WorknetSync] 완료 — 수집 %d건 / 신규 %d건 / 갱신 %d건",
            result["fetched"], result["inserted"], result["updated"],
        )

    except Exception as exc:
        log.error("[WorknetSync] 오류: %s", exc, exc_info=True)
        result["error"] = str(exc)

    return result


# ── APScheduler ──────────────────────────────────────────────────────────────

class WorknetScheduler:
    """FastAPI lifespan 내에서 관리되는 워크넷 동기화 스케줄러."""

    def __init__(self) -> None:
        self._scheduler = AsyncIOScheduler(timezone="Asia/Seoul")

    def start(self) -> None:
        """매일 새벽 3시 자동 실행 등록 + 스케줄러 시작."""
        self._scheduler.add_job(
            sync_worknet_jobs,
            trigger=CronTrigger(hour=3, minute=0),
            id="worknet_daily_sync",
            name="워크넷 일일 동기화",
            replace_existing=True,
            misfire_grace_time=3600,   # 1시간 내 지연 허용
        )
        self._scheduler.start()
        log.info("[WorknetScheduler] 스케줄러 시작 — 매일 03:00 실행")

    def shutdown(self) -> None:
        if self._scheduler.running:
            self._scheduler.shutdown(wait=False)
            log.info("[WorknetScheduler] 스케줄러 종료")


worknet_scheduler = WorknetScheduler()
