"""AI Search Service - RAG-based search using platform data first."""
import json
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.job import JobPosting
from app.models.company import Company
from app.config import settings


async def ai_search(db: AsyncSession, query: str, user_id: Optional[int] = None):
    """
    AI search pipeline:
    1. Search platform-registered jobs first (priority)
    2. Generate AI summary if API key is available
    3. Return structured results
    """
    # Step 1: Search registered jobs using simple text matching
    # In production, this would use Elasticsearch + KoSBERT vectors
    jobs = await search_jobs_db(db, query)

    # Step 2: Generate AI summary
    ai_summary = await generate_ai_summary(query, jobs)

    # Step 3: Log search
    await log_search(db, query, len(jobs), user_id)

    return {
        "jobs": [format_job(job) for job in jobs],
        "total": len(jobs),
        "ai_summary": ai_summary,
        "query": query,
    }


async def search_jobs_db(db: AsyncSession, query: str) -> list:
    """Search jobs in database with keyword matching."""
    keywords = query.lower().split()

    # Build search conditions
    conditions = []
    for kw in keywords[:5]:  # Limit to 5 keywords
        conditions.append(JobPosting.title.ilike(f"%{kw}%"))
        conditions.append(JobPosting.description.ilike(f"%{kw}%"))
        conditions.append(JobPosting.location.ilike(f"%{kw}%"))
        conditions.append(JobPosting.job_type.ilike(f"%{kw}%"))

    stmt = (
        select(JobPosting, Company.company_name)
        .join(Company, JobPosting.company_id == Company.id, isouter=True)
        .where(JobPosting.status == "active")
        .where(or_(*conditions) if conditions else True)
        .order_by(JobPosting.created_at.desc())
        .limit(20)
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [(job, company_name) for job, company_name in rows]


async def generate_ai_summary(query: str, jobs: list) -> Optional[str]:
    """Generate AI summary using Claude or OpenAI if API key available."""
    if not jobs:
        return f"'{query}' 검색 결과가 없습니다. 검색어를 변경해보시거나 전체 채용공고를 확인해보세요."

    if not (settings.anthropic_api_key or settings.openai_api_key):
        count = len(jobs)
        return f"'{query}'에 대한 검색 결과 {count}개를 찾았습니다. 아래에서 상세 내용을 확인해보세요."

    # Use Claude API if available
    if settings.anthropic_api_key:
        return await _claude_summary(query, jobs)

    # Fallback to OpenAI
    if settings.openai_api_key:
        return await _openai_summary(query, jobs)

    return None


async def _claude_summary(query: str, jobs: list) -> str:
    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

        job_list = "\n".join([
            f"- {job.title} ({company}) - {job.location}"
            for job, company in jobs[:5]
        ])

        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": f"구직자가 '{query}'를 검색했습니다. 아래 채용공고들을 2-3문장으로 요약해주세요:\n{job_list}"
            }]
        )
        return message.content[0].text
    except Exception:
        return f"'{query}' 관련 채용공고 {len(jobs)}개를 찾았습니다."


async def _openai_summary(query: str, jobs: list) -> str:
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        job_list = "\n".join([
            f"- {job.title} ({company}) - {job.location}"
            for job, company in jobs[:5]
        ])

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": f"구직자가 '{query}'를 검색했습니다. 아래 채용공고들을 2-3문장으로 요약해주세요:\n{job_list}"
            }]
        )
        return response.choices[0].message.content
    except Exception:
        return f"'{query}' 관련 채용공고 {len(jobs)}개를 찾았습니다."


def format_job(row: tuple) -> dict:
    job, company_name = row
    return {
        "id": job.id,
        "title": job.title,
        "company_name": company_name or "기업명 미공개",
        "location": job.location,
        "salary_range": job.salary_range,
        "job_type": job.job_type,
        "deadline": job.deadline,
        "view_count": job.view_count,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }


async def log_search(db: AsyncSession, query: str, count: int, user_id: Optional[int]):
    from app.models.search_log import SearchLog
    log = SearchLog(query=query, results_count=count, user_id=user_id)
    db.add(log)
    await db.commit()
