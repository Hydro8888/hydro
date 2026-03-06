"""
Real-time AI Search Service for AI JobWorld.

Pipeline (order is mandatory):
  1. Detect intent (job / resume / auto)
  2. Search local platform DB  → highest priority, always first
  3. Fetch real-time external data via Gemini Google Search grounding
  4. AI enrichment via Gemini (analysis, tips, filters)
  5. Return combined structured response

External data strategy:
  - Gemini Google Search grounding REQUIRES gemini-2.0-flash (or later).
    gemini-3.1-flash-lite-preview does NOT support the google_search tool.
  - We hardcode GROUNDING_MODEL = "gemini-2.0-flash" for the external phase.
  - The AI-analysis phase uses settings.gemini_model with a JSON-mode fallback.
"""
import asyncio
import logging
import re
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

# gemini-2.0-flash is the minimum model with confirmed google_search grounding support.
# Preview / lite models (gemini-3.1-flash-lite-preview) silently drop the tool.
GROUNDING_MODEL = "gemini-2.0-flash"

SOURCE_LABELS = {
    "local": "플랫폼 등록 결과",
    "external": "실시간 외부 검색 결과",
}


# ── Main orchestration ────────────────────────────────────────────────────────

async def realtime_search(
    db: AsyncSession,
    query: str,
    search_type: str = "auto",
    user_id: Optional[int] = None,
) -> dict:
    """
    Full 3-layer search: local DB → Gemini grounding → AI analysis.
    Local results are always returned first regardless of AI availability.
    """
    start_ts = time.monotonic()
    detected_type = detect_search_type(query, search_type)
    logger.info("[Search] query=%r type=%s user=%s", query, detected_type, user_id)

    # Local DB + external grounding run concurrently
    local_results, external_results = await asyncio.gather(
        _search_local(db, query, detected_type),
        _fetch_external(query, detected_type),
        return_exceptions=True,
    )

    if isinstance(local_results, Exception):
        logger.error("[Search] Local DB error: %s", local_results)
        local_results = []
    if isinstance(external_results, Exception):
        logger.error("[Search] External error: %s", external_results)
        external_results = []

    logger.info("[Search] local=%d external=%d", len(local_results), len(external_results))

    # AI enrichment (after both result sets are ready)
    ai_data = await _gemini_analyze(query, detected_type, local_results, external_results)

    elapsed = time.monotonic() - start_ts
    logger.info("[Search] latency=%.2fs ai_error=%s", elapsed, ai_data.get("error"))

    await log_search(db, query, len(local_results), user_id, detected_type)

    return {
        "query": query,
        "search_type": detected_type,
        "local_results": local_results,
        "local_total": len(local_results),
        "external_results": external_results,
        "external_total": len(external_results),
        "ai_summary": ai_data.get("summary", ""),
        "ai_recommended_filters": ai_data.get("recommended_filters", []),
        "ai_match_reasons": ai_data.get("match_reasons", []),
        "ai_tips": ai_data.get("tips", []),
        "ai_reasoning": ai_data.get("reasoning", ""),
        "source_labels": SOURCE_LABELS,
        "ai_error": ai_data.get("error"),
    }


# ── Local DB ──────────────────────────────────────────────────────────────────

async def _search_local(db: AsyncSession, query: str, search_type: str) -> list[dict]:
    if search_type == "구직":
        return await search_resumes_db(db, query)
    return await search_jobs_db(db, query)


# ── External: Gemini Google Search grounding ──────────────────────────────────

async def _fetch_external(query: str, search_type: str) -> list[dict]:
    """Fetch real-time external data using Gemini with Google Search grounding."""
    client = get_client()
    if not client:
        return []
    try:
        results = await asyncio.to_thread(_external_search_sync, client, query, search_type)
        logger.info("[External] returned %d items", len(results))
        return results
    except Exception as e:
        logger.error("[External] failed: %s", e)
        return []


def _external_search_sync(client, query: str, search_type: str) -> list[dict]:
    """
    Synchronous Gemini call with Google Search grounding.

    IMPORTANT: grounding requires GROUNDING_MODEL ("gemini-2.0-flash"), NOT the
    preview/lite model which silently ignores the google_search tool.

    Flow:
      1. Call Gemini with google_search tool → gets real web search results
      2. Extract grounding_chunks metadata → real URLs of pages Gemini retrieved
      3. Parse delimited text blocks for structured fields
      4. Merge real URLs from grounding_chunks into parsed items
      5. If text parsing yields nothing, build items directly from grounding_chunks
    """
    from google.genai import types

    if search_type == "구인":
        prompt = (
            f'사람인(saramin.co.kr), 잡코리아(jobkorea.co.kr), 원티드(wanted.co.kr)에서 '
            f'"{query}" 채용공고를 검색하세요. '
            f'실제로 찾은 채용공고 최대 5건을 아래 형식으로 나열하세요:\n\n'
            f'===JOB===\n'
            f'제목: [공고 제목]\n'
            f'회사: [회사명]\n'
            f'지역: [근무지]\n'
            f'급여: [급여 또는 미기재]\n'
            f'유형: [정규직/계약직/인턴 등]\n'
            f'출처: [사이트명]\n'
            f'요약: [공고 핵심 내용 1-2문장]\n'
            f'===END===\n\n'
            f'각 공고를 ===JOB=== / ===END=== 블록 안에 작성하세요. '
            f'실제로 검색된 공고만 포함하세요.'
        )
    else:
        prompt = (
            f'"{query}" 분야 한국 채용 시장 최신 정보를 검색하세요. '
            f'평균 연봉, 인기 기술스택, 채용 트렌드를 최대 5건 아래 형식으로 나열하세요:\n\n'
            f'===MARKET===\n'
            f'제목: [정보 제목]\n'
            f'요약: [핵심 내용 1-2문장]\n'
            f'출처: [사이트명]\n'
            f'유형: [salary 또는 trend 또는 skill]\n'
            f'===END===\n\n'
            f'각 항목을 ===MARKET=== / ===END=== 블록 안에 작성하세요.'
        )

    logger.info("[External] calling grounding model=%s", GROUNDING_MODEL)
    try:
        response = client.models.generate_content(
            model=GROUNDING_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                max_output_tokens=1800,
                temperature=0.1,
            ),
        )
    except Exception as e:
        logger.warning("[External] grounding call failed: %s", e)
        return []

    # ── Extract real grounding chunks (actual pages Gemini retrieved) ──
    grounding_urls: list[dict] = []
    try:
        candidate = response.candidates[0] if response.candidates else None
        if candidate and candidate.grounding_metadata:
            chunks = candidate.grounding_metadata.grounding_chunks or []
            for chunk in chunks:
                if hasattr(chunk, "web") and chunk.web:
                    uri = (chunk.web.uri or "").strip()
                    title = (chunk.web.title or "").strip()
                    if uri:
                        grounding_urls.append({"title": title, "url": uri})
        logger.info("[External] grounding_chunks=%d", len(grounding_urls))
    except Exception as e:
        logger.warning("[External] grounding_chunks extraction failed: %s", e)

    raw_text = response.text or ""
    logger.debug("[External] raw_text[:300]=%s", raw_text[:300])

    # ── Try structured text parsing first ──
    items = _parse_grounded_text(raw_text, search_type, grounding_urls)

    # ── Fallback: build items directly from grounding chunks ──
    if not items and grounding_urls:
        logger.info("[External] text parse yielded 0 — building from grounding_chunks")
        items = _chunks_to_items(grounding_urls, search_type)

    return items[:5]


def _parse_grounded_text(text: str, search_type: str, grounding_urls: list[dict]) -> list[dict]:
    """Parse ===JOB=== / ===MARKET=== delimited blocks."""
    marker = "JOB" if search_type == "구인" else "MARKET"
    pattern = rf"===\s*{marker}\s*===(.*?)===\s*END\s*==="
    blocks = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
    logger.info("[External] parsed_blocks=%d", len(blocks))

    results = []
    for i, block in enumerate(blocks[:5]):
        def _field(name: str) -> str:
            m = re.search(rf"^{name}:\s*(.+)$", block, re.MULTILINE)
            return m.group(1).strip() if m else ""

        title = _field("제목")
        if not title:
            continue

        url = grounding_urls[i]["url"] if i < len(grounding_urls) else ""
        item: dict = {
            "title": title,
            "summary": _field("요약"),
            "source": _field("출처") or "외부 검색",
            "url": url,
            "source_type": "external",
        }
        if search_type == "구인":
            item["company"] = _field("회사")
            item["location"] = _field("지역")
            raw_salary = _field("급여")
            item["salary"] = raw_salary if raw_salary and raw_salary not in ("미기재", "") else None
            item["job_type"] = _field("유형")
        else:
            cat = _field("유형").lower()
            item["category"] = cat if cat in ("salary", "trend", "skill") else "trend"

        results.append(item)
    return results


def _chunks_to_items(grounding_urls: list[dict], search_type: str) -> list[dict]:
    """Build result items directly from grounding chunk metadata."""
    items = []
    for chunk in grounding_urls[:5]:
        title = chunk["title"]
        url = chunk["url"]
        if not title and not url:
            continue

        source = "외부 검색"
        try:
            from urllib.parse import urlparse
            domain = urlparse(url).netloc.lstrip("www.")
            if domain:
                source = domain
        except Exception:
            pass

        item: dict = {
            "title": title or url,
            "summary": "",
            "source": source,
            "url": url,
            "source_type": "external",
        }
        if search_type == "구인":
            item.update({"company": "", "location": "", "salary": None, "job_type": ""})
        else:
            item["category"] = "trend"
        items.append(item)
    return items


# ── Gemini AI enrichment (JSON mode) ─────────────────────────────────────────

async def _gemini_analyze(
    query: str,
    search_type: str,
    local_results: list[dict],
    external_results: list[dict],
) -> dict:
    client = get_client()
    if not client:
        return {**_rich_fallback(query, search_type, local_results), "error": "GEMINI_API_KEY 미설정"}
    try:
        data = await asyncio.to_thread(
            _analyze_sync, client, query, search_type, local_results, external_results
        )
        return data
    except Exception as e:
        err_msg = f"{type(e).__name__}: {e}"
        logger.error("[Analyze] %s", err_msg)
        return {**_rich_fallback(query, search_type, local_results), "error": err_msg}


def _analyze_sync(
    client,
    query: str,
    search_type: str,
    local_results: list[dict],
    external_results: list[dict],
) -> dict:
    """
    Gemini AI analysis in JSON mode.
    Tries settings.gemini_model first; if JSON parsing fails retries without
    the MIME type constraint to get plain-text then parses manually.
    """
    from google.genai import types

    local_preview = _fmt_local(local_results, search_type)
    external_preview = _fmt_external(external_results)

    prompt = (
        f'당신은 "AI JobWorld" 한국 채용 플랫폼의 AI 어시스턴트입니다.\n'
        f'검색어: "{query}" | 유형: {search_type}\n\n'
        f'[플랫폼 등록 데이터]\n{local_preview}\n\n'
        f'[실시간 외부 검색 데이터]\n{external_preview}\n\n'
        f'위 데이터를 분석해서 아래 JSON 스키마로 한국어 응답하세요:\n'
        f'{{"summary":"전체 검색 결과 요약 2-3문장",'
        f'"match_reasons":["검색어와 잘 맞는 이유 1","이유 2"],'
        f'"recommended_filters":["추천 검색 키워드 1","키워드 2","키워드 3"],'
        f'"tips":["팁 1","팁 2"],'
        f'"reasoning":"로컬/외부 데이터 차이 및 활용법 1문장"}}'
    )

    # Attempt 1: JSON mode
    try:
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
        if isinstance(parsed, dict) and parsed.get("summary"):
            return _extract_ai_fields(parsed)
        logger.warning("[Analyze] JSON mode parse failed, retrying without MIME constraint")
    except Exception as e:
        logger.warning("[Analyze] JSON mode attempt failed: %s", e)

    # Attempt 2: plain text mode (no response_mime_type)
    try:
        response2 = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=700,
                temperature=0.3,
            ),
        )
        parsed2 = parse_json_safe(response2.text or "")
        if isinstance(parsed2, dict) and parsed2.get("summary"):
            return _extract_ai_fields(parsed2)
    except Exception as e:
        logger.warning("[Analyze] plain mode attempt failed: %s", e)

    # Attempt 3: try gemini-2.0-flash-lite as fallback model
    try:
        response3 = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=700,
                temperature=0.3,
            ),
        )
        parsed3 = parse_json_safe(response3.text or "")
        if isinstance(parsed3, dict) and parsed3.get("summary"):
            return _extract_ai_fields(parsed3)
    except Exception as e:
        logger.warning("[Analyze] gemini-2.0-flash-lite fallback failed: %s", e)

    return _rich_fallback(query, search_type, local_results)


def _extract_ai_fields(parsed: dict) -> dict:
    return {
        "summary": str(parsed.get("summary", "")),
        "match_reasons": [str(r) for r in parsed.get("match_reasons", []) if r],
        "recommended_filters": [str(f) for f in parsed.get("recommended_filters", []) if f],
        "tips": [str(t) for t in parsed.get("tips", []) if t],
        "reasoning": str(parsed.get("reasoning", "")),
        "error": None,
    }


# ── Preview formatters ────────────────────────────────────────────────────────

def _fmt_local(results: list[dict], search_type: str) -> str:
    if not results:
        return "플랫폼에 아직 등록된 데이터 없음 (외부 검색 결과 참고)"
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


def _fmt_external(results: list[dict]) -> str:
    if not results:
        return "외부 검색 결과 없음"
    lines = [
        f"- [{r.get('source','?')}] {r.get('title','?')} — {r.get('summary','')[:80]}"
        for r in results[:5]
    ]
    return "\n".join(lines)


# ── Rich fallback (used when Gemini is fully unavailable) ─────────────────────

_JOB_TIPS: dict[str, list] = {
    "개발자": ["포트폴리오 GitHub 링크를 이력서에 반드시 첨부하세요", "기술 스택은 JD와 일치하는 것을 강조하세요"],
    "디자이너": ["포트폴리오 URL이나 Behance 링크를 준비하세요", "사용한 툴(Figma, XD 등)을 구체적으로 기재하세요"],
    "마케터": ["성과 지표(전환율, ROAS 등)를 수치로 표현하세요", "운영 채널과 캠페인 경험을 구체적으로 작성하세요"],
    "default": ["지원 직무와 관련된 경험을 수치로 표현하세요", "자기소개서에 회사에 대한 구체적인 이해를 담으세요"],
}

_JOB_FILTERS: dict[str, list] = {
    "개발자": ["백엔드", "프론트엔드", "풀스택", "Python", "React", "신입"],
    "디자이너": ["UI/UX", "그래픽", "브랜드", "Figma", "포트폴리오"],
    "마케터": ["퍼포먼스", "콘텐츠", "SNS", "SEO", "데이터 분석"],
    "default": ["신입", "경력", "정규직", "재택근무", "서울"],
}


def _rich_fallback(query: str, search_type: str, local_results: list[dict]) -> dict:
    """
    When Gemini is unavailable, return keyword-matched static insights
    so the AI section still provides value.
    """
    q_lower = query.lower()
    matched_key = next(
        (k for k in _JOB_TIPS if k != "default" and k in q_lower), "default"
    )
    tips = _JOB_TIPS[matched_key]
    filters = _JOB_FILTERS[matched_key]
    local_count = len(local_results)

    if search_type == "구직":
        summary = (
            f"'{query}' 관련 이력서 {local_count}건이 플랫폼에 등록되어 있습니다. "
            f"외부 검색 결과도 함께 확인해 적합한 인재를 찾아보세요."
        ) if local_count > 0 else (
            f"아직 플랫폼에 등록된 '{query}' 이력서가 없습니다. "
            f"외부 시장 정보를 참고하거나 직접 구직자를 초대해 보세요."
        )
        tips = ["기술스택 필터를 활용해 원하는 인재를 찾아보세요", "면접 전 포트폴리오를 미리 검토하세요"]
    else:
        summary = (
            f"'{query}' 채용공고 {local_count}건이 플랫폼에 등록되어 있습니다. "
            f"외부 검색 결과도 함께 참고해 취업 시장을 파악하세요."
        ) if local_count > 0 else (
            f"아직 플랫폼에 등록된 '{query}' 채용공고가 없습니다. "
            f"외부 검색 결과를 통해 현재 채용 시장 현황을 확인하세요."
        )

    return {
        "summary": summary,
        "match_reasons": [],
        "recommended_filters": filters[:3],
        "tips": tips,
        "reasoning": "",
    }
