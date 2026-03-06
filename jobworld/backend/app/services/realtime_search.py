"""
Real-time AI Search Service for AI JobWorld.

Pipeline (order is mandatory):
  1. Detect intent (job / resume / auto)
  2. Search local platform DB → highest priority
  3. Fetch real-time external data via Gemini Google Search grounding
  4. AI enrichment via Gemini JSON mode (analysis, tips, filters)
  5. Return combined structured response

External data strategy: Gemini Google Search grounding (Option C).
  - Uses existing GEMINI_API_KEY, no additional keys required.
  - Gemini retrieves fresh external job/market data from the web.
  - Results are clearly labeled as 'external' source.
  - Local platform data always appears first.
"""
import asyncio
import logging
import time
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.services.gemini_client import get_client, parse_json_safe
from app.services.ai_search import (
    detect_search_type,
    search_jobs_db,
    search_resumes_db,
    log_search,
)

logger = logging.getLogger(__name__)

# ── Source labels (used in response and in frontend) ────────────────────────

SOURCE_LABELS = {
    "local": "플랫폼 등록 결과",
    "external": "실시간 외부 검색 결과",
}


# ── Main orchestration ───────────────────────────────────────────────────────

async def realtime_search(
    db: AsyncSession,
    query: str,
    search_type: str = "auto",
    user_id: Optional[int] = None,
) -> dict:
    """
    Full search pipeline: local DB → external (Gemini grounding) → AI analysis.
    Local results are always returned first regardless of AI availability.
    """
    start_ts = time.monotonic()
    detected_type = detect_search_type(query, search_type)
    logger.info("[Search] query=%r type=%s user=%s", query, detected_type, user_id)

    # Run local DB search and external Gemini search concurrently
    local_task = asyncio.create_task(_search_local(db, query, detected_type))
    external_task = asyncio.create_task(_fetch_external(query, detected_type))

    local_results, external_results = await asyncio.gather(
        local_task, external_task, return_exceptions=True
    )

    # Handle task exceptions gracefully
    if isinstance(local_results, Exception):
        logger.error("[Search] Local DB error: %s", local_results)
        local_results = []
    if isinstance(external_results, Exception):
        logger.error("[Search] External search error: %s", external_results)
        external_results = []

    logger.info(
        "[Search] local=%d external=%d",
        len(local_results), len(external_results)
    )

    # AI enrichment (runs after we have both result sets)
    ai_data = await _gemini_analyze(query, detected_type, local_results, external_results)

    elapsed = time.monotonic() - start_ts
    logger.info("[Search] total_latency=%.2fs ai_error=%s", elapsed, ai_data.get("error"))

    await log_search(db, query, len(local_results), user_id, detected_type)

    return {
        "query": query,
        "search_type": detected_type,
        # Local platform data — always first
        "local_results": local_results,
        "local_total": len(local_results),
        # External fresh data — supplemental
        "external_results": external_results,
        "external_total": len(external_results),
        # AI layer
        "ai_summary": ai_data.get("summary", ""),
        "ai_recommended_filters": ai_data.get("recommended_filters", []),
        "ai_match_reasons": ai_data.get("match_reasons", []),
        "ai_tips": ai_data.get("tips", []),
        "ai_reasoning": ai_data.get("reasoning", ""),
        "source_labels": SOURCE_LABELS,
        "ai_error": ai_data.get("error"),
    }


# ── Local DB search ──────────────────────────────────────────────────────────

async def _search_local(db: AsyncSession, query: str, search_type: str) -> list[dict]:
    if search_type == "구직":
        return await search_resumes_db(db, query)
    return await search_jobs_db(db, query)


# ── External real-time search via Gemini Google Search grounding ─────────────

async def _fetch_external(query: str, search_type: str) -> list[dict]:
    """
    Fetch real-time external results using Gemini's Google Search grounding.
    - For job mode: finds actual current job postings from external sites.
    - For resume mode: finds market data (salary trends, in-demand skills).
    Returns [] if Gemini is unavailable or search fails.
    """
    client = get_client()
    if not client:
        return []

    try:
        results = await asyncio.to_thread(
            _external_search_sync, client, query, search_type
        )
        logger.info("[External] fetched %d results for type=%s", len(results), search_type)
        return results
    except Exception as e:
        logger.error("[External] Gemini grounding failed: %s", e)
        return []


def _external_search_sync(client, query: str, search_type: str) -> list[dict]:
    """Synchronous Gemini call with Google Search grounding (runs in thread pool)."""
    from google.genai import types

    if search_type == "구인":
        prompt = (
            f'한국 채용사이트에서 "{query}" 조건에 맞는 현재 채용공고를 Google 검색으로 찾아서 '
            f'최대 5건을 아래 JSON 배열로만 응답하세요 (텍스트 설명 없이):\n'
            f'[{{"title":"공고제목","company":"회사명","location":"근무지",'
            f'"salary":"급여 또는 null","job_type":"고용형태",'
            f'"source":"출처사이트명","url":"공고URL","summary":"공고 핵심 요약 1-2문장"}}]\n'
            f'사람인, 잡코리아, 원티드, 링크드인 코리아 등을 우선 검색하세요. '
            f'실제 존재하는 공고만 포함. 없으면 [] 반환.'
        )
    else:
        prompt = (
            f'"{query}" 분야 인재를 찾는 고용주 관점에서 Google 검색으로 '
            f'최신 한국 취업 시장 정보를 찾아서 최대 5건을 아래 JSON 배열로만 응답하세요:\n'
            f'[{{"title":"정보제목","summary":"핵심 내용 1-2문장",'
            f'"source":"출처","url":"URL","category":"salary|trend|skill"}}]\n'
            f'평균 연봉, 인기 기술스택, 채용 트렌드 정보를 포함하세요. 없으면 [] 반환.'
        )

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                max_output_tokens=1200,
                temperature=0.2,
            ),
        )
        raw = response.text or ""
    except Exception as e:
        # google_search tool may not be supported by this model version
        logger.warning("[External] google_search tool error: %s — skipping external", e)
        return []

    parsed = parse_json_safe(raw)
    if not isinstance(parsed, list):
        logger.warning("[External] Unexpected response shape, expected list")
        return []

    # Normalize and tag all results as external source
    normalized = []
    for item in parsed[:5]:
        if not isinstance(item, dict):
            continue
        item["source_type"] = "external"
        item.setdefault("title", "")
        item.setdefault("summary", "")
        item.setdefault("source", "외부 검색")
        item.setdefault("url", "")
        if search_type == "구인":
            item.setdefault("company", "")
            item.setdefault("location", "")
            item.setdefault("salary", None)
            item.setdefault("job_type", "")
        normalized.append(item)

    return normalized


# ── Gemini AI enrichment (JSON mode, no grounding) ───────────────────────────

async def _gemini_analyze(
    query: str,
    search_type: str,
    local_results: list[dict],
    external_results: list[dict],
) -> dict:
    """
    Send compact structured context to Gemini and get JSON analysis.
    Does NOT use Google Search grounding (incompatible with JSON output mode).
    Returns fallback dict if Gemini is unavailable or fails.
    """
    client = get_client()
    if not client:
        return {**_fallback_ai(query, search_type, len(local_results)), "error": "GEMINI_API_KEY 미설정"}

    try:
        data = await asyncio.to_thread(
            _analyze_sync, client, query, search_type, local_results, external_results
        )
        return data
    except Exception as e:
        err_msg = f"{type(e).__name__}: {e}"
        logger.error("[Gemini Analyze] %s", err_msg)
        return {**_fallback_ai(query, search_type, len(local_results)), "error": err_msg}


def _analyze_sync(
    client,
    query: str,
    search_type: str,
    local_results: list[dict],
    external_results: list[dict],
) -> dict:
    """Synchronous Gemini JSON analysis call (runs in thread pool)."""
    from google.genai import types

    local_preview = _format_local_preview(local_results, search_type)
    external_preview = _format_external_preview(external_results, search_type)

    prompt = (
        f'당신은 "AI JobWorld" 한국 채용 플랫폼의 AI 어시스턴트입니다.\n'
        f'검색어: "{query}" | 검색 유형: {search_type}\n\n'
        f'[플랫폼 등록 데이터 — 최우선 / 출처: 플랫폼 직접 등록]\n{local_preview}\n\n'
        f'[실시간 외부 검색 데이터 — 보조 / 출처: 외부 웹]\n{external_preview}\n\n'
        f'위 두 소스를 분석하여 아래 JSON 스키마로 한국어 응답하세요:\n'
        f'{{"summary":"로컬+외부 결과를 구분하여 2-3문장 요약",'
        f'"match_reasons":["플랫폼 결과 중 검색어와 가장 잘 맞는 이유 1","이유 2"],'
        f'"recommended_filters":["추천 검색 필터 키워드 1","키워드 2","키워드 3"],'
        f'"tips":["구직자 또는 채용담당자에게 유용한 팁 1","팁 2"],'
        f'"reasoning":"플랫폼 데이터와 외부 데이터의 차이점 및 활용 방법 1문장"}}'
    )

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            max_output_tokens=700,
            temperature=0.3,
        ),
    )

    parsed = parse_json_safe(response.text or "")
    if not isinstance(parsed, dict):
        return _fallback_ai(query, search_type, len(local_results))

    return {
        "summary": str(parsed.get("summary", "")),
        "match_reasons": [str(r) for r in parsed.get("match_reasons", []) if r],
        "recommended_filters": [str(f) for f in parsed.get("recommended_filters", []) if f],
        "tips": [str(t) for t in parsed.get("tips", []) if t],
        "reasoning": str(parsed.get("reasoning", "")),
        "error": None,
    }


# ── Preview formatters (compact — avoid sending huge payloads to Gemini) ─────

def _format_local_preview(results: list[dict], search_type: str) -> str:
    if not results:
        return "플랫폼에 등록된 결과 없음"
    if search_type == "구인":
        lines = [
            f"- [{r.get('company_name','?')}] {r.get('title','?')} | "
            f"{r.get('location','?')} | {r.get('salary_range') or '급여미정'} | {r.get('job_type','?')}"
            for r in results[:6]
        ]
    else:
        lines = [
            f"- {r.get('user_name','?')} | {r.get('title','?')} | "
            f"기술: {r.get('skills') or '미기재'} | 학력: {r.get('education') or '미기재'}"
            for r in results[:6]
        ]
    return "\n".join(lines)


def _format_external_preview(results: list[dict], search_type: str) -> str:
    if not results:
        return "외부 검색 결과 없음"
    lines = [
        f"- [{r.get('source','?')}] {r.get('title','?')} — {r.get('summary','')[:80]}"
        for r in results[:5]
    ]
    return "\n".join(lines)


def _fallback_ai(query: str, search_type: str, local_count: int) -> dict:
    if search_type == "구직":
        summary = f"'{query}' 조건에 맞는 플랫폼 등록 이력서 {local_count}건을 찾았습니다."
    else:
        summary = f"'{query}' 관련 플랫폼 등록 채용공고 {local_count}건을 찾았습니다."
    return {
        "summary": summary,
        "match_reasons": [],
        "recommended_filters": [],
        "tips": [],
        "reasoning": "",
    }
