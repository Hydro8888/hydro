"""AI Search Service - DB results first, Gemini AI augmentation second."""
import asyncio
import logging
import sys
from typing import Optional

logger = logging.getLogger(__name__)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.job import JobPosting
from app.models.company import Company
from app.models.resume import Resume
from app.models.user import User
from app.config import settings


# ─── Intent Detection ────────────────────────────────────────────────────────

def detect_search_type(query: str, requested_type: str) -> str:
    """구인/구직 의도 자동 감지. 명시적으로 지정된 경우 그대로 사용."""
    if requested_type in ("구인", "구직"):
        return requested_type

    jobseeker_kw = ["이력서", "구직", "취업", "일자리 찾", "채용해줘", "입사하고", "지원하고싶", "취준"]
    employer_kw  = ["채용", "구인", "모집", "직원", "사원을", "뽑습니다", "채용중", "팀원"]

    q = query.lower()
    for kw in jobseeker_kw:
        if kw in q:
            return "구직"
    for kw in employer_kw:
        if kw in q:
            return "구인"
    return "구인"  # 기본값


# ─── Main Entry ───────────────────────────────────────────────────────────────

async def ai_search(
    db: AsyncSession,
    query: str,
    search_type: str = "auto",
    user_id: Optional[int] = None,
):
    """
    검색 파이프라인:
    1. 의도 분석 (구인 / 구직)
    2. DB에서 등록된 정보 우선 검색
    3. Gemini AI로 추가 인사이트 생성
    4. 검색 로그 저장
    """
    detected_type = detect_search_type(query, search_type)

    # DB 검색
    if detected_type == "구직":
        db_results = await search_resumes_db(db, query)
    else:
        db_results = await search_jobs_db(db, query)

    # Gemini AI 인사이트
    ai_summary, ai_insights, ai_error = await gemini_augment(query, detected_type, db_results)

    await log_search(db, query, len(db_results), user_id, detected_type)

    return {
        "search_type": detected_type,
        "db_results": db_results,
        "db_total": len(db_results),
        "ai_summary": ai_summary,
        "ai_insights": ai_insights,
        "ai_error": ai_error,
        "query": query,
    }


# ─── DB Search ───────────────────────────────────────────────────────────────

async def search_jobs_db(db: AsyncSession, query: str) -> list[dict]:
    """구인: DB에서 활성 채용공고 키워드 검색."""
    keywords = [kw for kw in query.lower().split() if len(kw) > 1][:5]

    conditions = []
    for kw in keywords:
        conditions.append(JobPosting.title.ilike(f"%{kw}%"))
        conditions.append(JobPosting.description.ilike(f"%{kw}%"))
        conditions.append(JobPosting.location.ilike(f"%{kw}%"))
        conditions.append(JobPosting.job_type.ilike(f"%{kw}%"))
        conditions.append(JobPosting.requirements.ilike(f"%{kw}%"))

    stmt = (
        select(JobPosting, Company.company_name)
        .join(Company, JobPosting.company_id == Company.id, isouter=True)
        .where(JobPosting.status == "active")
        .where(or_(*conditions) if conditions else True)
        .order_by(JobPosting.created_at.desc())
        .limit(20)
    )
    rows = (await db.execute(stmt)).all()
    return [_format_job(job, company_name) for job, company_name in rows]


async def search_resumes_db(db: AsyncSession, query: str) -> list[dict]:
    """구직: DB에서 공개 이력서 키워드 검색."""
    keywords = [kw for kw in query.lower().split() if len(kw) > 1][:5]

    conditions = []
    for kw in keywords:
        conditions.append(Resume.title.ilike(f"%{kw}%"))
        conditions.append(Resume.skills.ilike(f"%{kw}%"))
        conditions.append(Resume.experience.ilike(f"%{kw}%"))
        conditions.append(Resume.introduction.ilike(f"%{kw}%"))
        conditions.append(Resume.education.ilike(f"%{kw}%"))

    stmt = (
        select(Resume, User.name)
        .join(User, Resume.user_id == User.id, isouter=True)
        .where(Resume.is_public == True)
        .where(or_(*conditions) if conditions else True)
        .order_by(Resume.created_at.desc())
        .limit(20)
    )
    rows = (await db.execute(stmt)).all()
    return [_format_resume(resume, user_name) for resume, user_name in rows]


# ─── Formatters ──────────────────────────────────────────────────────────────

def _format_job(job: JobPosting, company_name: Optional[str]) -> dict:
    return {
        "id": job.id,
        "type": "구인",
        "title": job.title,
        "company_name": company_name or "기업명 미공개",
        "location": job.location,
        "salary_range": job.salary_range,
        "job_type": job.job_type,
        "deadline": str(job.deadline) if job.deadline else None,
        "requirements": (job.requirements or "")[:120] or None,
        "view_count": job.view_count,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }


def _format_resume(resume: Resume, user_name: Optional[str] = None) -> dict:
    return {
        "id": resume.id,
        "type": "구직",
        "title": resume.title,
        "user_name": user_name or "이름 미공개",
        "skills": resume.skills,
        "experience": (resume.experience or "")[:120] or None,
        "education": resume.education,
        "introduction": (resume.introduction or "")[:100] or None,
        "created_at": resume.created_at.isoformat() if resume.created_at else None,
    }


# ─── Gemini AI ───────────────────────────────────────────────────────────────

GEMINI_MODEL = "gemini-2.0-flash-lite"


async def gemini_augment(
    query: str, search_type: str, db_results: list[dict]
) -> tuple[str, list[str], Optional[str]]:
    """Gemini AI로 검색 요약 + 인사이트 생성. (summary, insights, error)"""
    if not settings.gemini_api_key:
        return _fallback_summary(query, search_type, len(db_results)), [], "GEMINI_API_KEY 미설정"

    try:
        summary, insights = await asyncio.to_thread(
            _gemini_call_sync, query, search_type, db_results
        )
        return summary, insights, None
    except Exception as e:
        err_msg = f"{type(e).__name__}: {e}"
        logger.error(f"[Gemini] 오류: {err_msg}", exc_info=True)
        print(f"[Gemini ERROR] {err_msg}", file=sys.stderr)
        return _fallback_summary(query, search_type, len(db_results)), [], err_msg


def _build_prompt(query: str, search_type: str, db_results: list[dict]) -> str:
    if search_type == "구인":
        db_preview = "\n".join([
            f"- [{r['company_name']}] {r['title']} | {r['location']} | "
            f"{r['salary_range'] or '급여미정'} | {r['job_type']}"
            for r in db_results[:5]
        ]) if db_results else "등록된 공고 없음"

        return (
            f'당신은 구직 플랫폼의 AI 어시스턴트입니다.\n'
            f'검색어: "{query}"\n검색 유형: 구인 (채용공고 검색)\n\n'
            f'현재 플랫폼에 등록된 관련 공고:\n{db_preview}\n\n'
            f'반드시 아래 형식의 순수 JSON으로만 응답하세요:\n'
            f'{{"summary":"2-3문장 한국어 요약","insights":["인사이트1","인사이트2","인사이트3"]}}'
        )
    else:
        db_preview = "\n".join([
            f"- {r['title']} | 기술: {r['skills'] or '미기재'} | 학력: {r['education'] or '미기재'}"
            for r in db_results[:5]
        ]) if db_results else "등록된 이력서 없음"

        return (
            f'당신은 구직 플랫폼의 AI 어시스턴트입니다.\n'
            f'검색어: "{query}"\n검색 유형: 구직 (구직자/이력서 검색)\n\n'
            f'현재 플랫폼에 등록된 관련 이력서:\n{db_preview}\n\n'
            f'반드시 아래 형식의 순수 JSON으로만 응답하세요:\n'
            f'{{"summary":"2-3문장 한국어 요약","insights":["인사이트1","인사이트2","인사이트3"]}}'
        )


def _gemini_call_sync(
    query: str, search_type: str, db_results: list[dict]
) -> tuple[str, list[str]]:
    import json as _json
    import re
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = _build_prompt(query, search_type, db_results)

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=512,
            temperature=0.4,
        ),
    )
    text = response.text.strip()

    # ```json ... ``` 또는 ``` ... ``` 블록 제거
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    data = _json.loads(text)
    summary = str(data.get("summary", ""))
    insights = [str(i) for i in data.get("insights", []) if i]
    return summary, insights


def _fallback_summary(query: str, search_type: str, count: int) -> str:
    if search_type == "구직":
        return f"'{query}' 조건에 맞는 구직자 이력서 {count}개를 찾았습니다."
    return f"'{query}' 관련 채용공고 {count}개를 찾았습니다."


# ─── Search Log ──────────────────────────────────────────────────────────────

async def log_search(
    db: AsyncSession,
    query: str,
    count: int,
    user_id: Optional[int],
    ai_intent: str = "",
):
    from app.models.search_log import SearchLog
    log = SearchLog(query=query, results_count=count, user_id=user_id, ai_intent=ai_intent)
    db.add(log)
    await db.commit()
