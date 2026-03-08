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
  - Grounding returns prose, so a second-pass JSON extraction converts it to structure.
  - The AI-analysis phase uses settings.gemini_model with a model-chain fallback.
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
# Use settings.gemini_grounding_model so it can be overridden via .env.
GROUNDING_MODEL = settings.gemini_grounding_model

# Fallback model for structured JSON extraction (no grounding needed)
EXTRACT_MODEL = "gemini-2.0-flash-lite"

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

    has_key = bool(settings.gemini_api_key)
    logger.info(
        "[Search] query=%r type=%s user=%s gemini_key_present=%s",
        query, detected_type, user_id, has_key,
    )

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

    logger.info(
        "[Search] local=%d external=%d",
        len(local_results), len(external_results),
    )

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
        logger.warning("[External] Gemini client not available — GEMINI_API_KEY missing")
        return []

    logger.info("[External] Starting grounded web search query=%r type=%s", query, search_type)
    try:
        results = await asyncio.to_thread(_external_search_sync, client, query, search_type)
        logger.info("[External] grounded search returned %d items", len(results))
        return results
    except Exception as e:
        logger.error("[External] failed: %s", e, exc_info=True)
        return []


def _external_search_sync(client, query: str, search_type: str) -> list[dict]:
    """
    Synchronous Gemini call with Google Search grounding.

    IMPORTANT: grounding requires GROUNDING_MODEL ("gemini-2.0-flash"), NOT the
    preview/lite model which silently ignores the google_search tool.

    Flow:
      1. Call Gemini with google_search tool → gets real web search results
      2. Extract grounding_chunks metadata → real URLs of pages Gemini retrieved
      3. Try structured block parsing (===JOB=== / ===END===)
      4. If block parsing yields nothing, run second-pass JSON extraction
      5. If second-pass fails, build minimal items from grounding chunk URLs
      6. If no chunks, try free-form text parsing as last resort
    """
    from google.genai import types

    # Use a natural-language prompt so Gemini with grounding can answer freely.
    # A rigid delimiter format is often ignored when grounding is active.
    if search_type == "구인":
        prompt = (
            f'사람인(saramin.co.kr), 잡코리아(jobkorea.co.kr), 원티드(wanted.co.kr) 등 '
            f'한국 채용 사이트에서 "{query}" 관련 채용공고를 실시간으로 검색해서 '
            f'실제로 찾은 채용공고 5건을 상세히 알려주세요. '
            f'각 공고에 대해 회사명, 직위, 근무지, 급여, 고용형태, 핵심 내용을 포함해서 설명해주세요. '
            f'실제로 검색된 공고만 포함하고, 가능하면 각 공고에 대해 번호를 붙여 설명해주세요.'
        )
    else:
        prompt = (
            f'"{query}" 분야 한국 채용 시장의 최신 정보를 실시간으로 검색해서 알려주세요. '
            f'평균 연봉, 인기 기술스택, 채용 트렌드 등 실제 최신 데이터를 포함해서 상세히 설명해주세요. '
            f'각 항목에 번호를 붙여 설명해주세요.'
        )

    logger.info("[External] calling grounding model=%s", GROUNDING_MODEL)
    try:
        response = client.models.generate_content(
            model=GROUNDING_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                max_output_tokens=2000,
                temperature=0.1,
            ),
        )
        logger.info("[External] grounding call succeeded")
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

    # ── Safely extract response text (response.text can raise ValueError) ──
    raw_text = ""
    try:
        raw_text = response.text or ""
    except Exception as e:
        logger.warning("[External] response.text failed: %s — trying parts", e)
        try:
            for cand in (response.candidates or []):
                if cand.content and cand.content.parts:
                    for part in cand.content.parts:
                        if hasattr(part, "text") and part.text:
                            raw_text += part.text
        except Exception as inner:
            logger.warning("[External] parts extraction also failed: %s", inner)

    logger.info("[External] raw_text_length=%d", len(raw_text))
    if raw_text:
        logger.debug("[External] raw_text[:500]=%s", raw_text[:500])

    # ── Pass 1: Try structured block parsing (===JOB=== / ===END===) ──
    items = _parse_grounded_text(raw_text, search_type, grounding_urls)
    logger.info("[External] pass1_block_items=%d", len(items))

    # ── Pass 2: Second-pass JSON extraction from grounded prose ──
    # This is the primary fallback when grounding returns prose (not blocks).
    if not items and raw_text and len(raw_text) > 50:
        logger.info("[External] pass1 yielded 0 — running second-pass JSON extraction")
        items = _second_pass_extraction(client, raw_text, query, search_type, grounding_urls)
        logger.info("[External] pass2_extraction_items=%d", len(items))

    # ── Pass 3: Build items from grounding chunk URLs ──
    if not items and grounding_urls:
        logger.info("[External] pass2 yielded 0 — building from grounding_chunks")
        items = _chunks_to_items(grounding_urls, search_type)
        logger.info("[External] pass3_chunk_items=%d", len(items))

    # ── Pass 4: Parse free-form text as last resort ──
    if not items and raw_text:
        logger.info("[External] pass3 yielded 0 — parsing free-form text")
        items = _parse_freeform_text(raw_text, search_type)
        logger.info("[External] pass4_freeform_items=%d", len(items))

    logger.info("[External] final_items=%d", len(items))
    return items[:5]


def _second_pass_extraction(
    client,
    grounded_text: str,
    query: str,
    search_type: str,
    grounding_urls: list[dict],
) -> list[dict]:
    """
    Second-pass: take Gemini's grounded prose and extract structured items via JSON mode.
    Uses EXTRACT_MODEL (no grounding needed) to convert prose → structured list.
    """
    from google.genai import types

    if search_type == "구인":
        schema_example = (
            '[{"title": "직위명", "company": "회사명", "location": "근무지", '
            '"salary": "급여(없으면 null)", "job_type": "고용형태", '
            '"summary": "핵심 내용 1-2문장", "source": "출처 사이트명"}]'
        )
        item_type = "채용공고"
    else:
        schema_example = (
            '[{"title": "정보 제목", "summary": "핵심 내용 1-2문장", '
            '"source": "출처 사이트명", "category": "salary 또는 trend 또는 skill"}]'
        )
        item_type = "채용시장 정보"

    prompt = (
        f'다음 텍스트에서 {item_type}를 최대 5건 추출해서 JSON 배열만 출력하세요.\n\n'
        f'텍스트:\n{grounded_text[:3000]}\n\n'
        f'출력 형식 (JSON 배열만, 다른 설명 없이):\n{schema_example}'
    )

    for model in [EXTRACT_MODEL, "gemini-2.0-flash"]:
        try:
            resp = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    max_output_tokens=1500,
                    temperature=0.1,
                ),
            )
            text = ""
            try:
                text = resp.text or ""
            except Exception:
                pass

            parsed = parse_json_safe(text)
            if not isinstance(parsed, list):
                logger.warning("[External/2ndPass] model=%s result not list: %s", model, type(parsed))
                continue

            items = []
            for i, item in enumerate(parsed[:5]):
                if not isinstance(item, dict):
                    continue
                title = item.get("title") or item.get("제목") or ""
                if not title:
                    continue
                url = grounding_urls[i]["url"] if i < len(grounding_urls) else ""
                base: dict = {
                    "title": str(title),
                    "summary": str(item.get("summary") or item.get("요약") or ""),
                    "source": str(item.get("source") or item.get("출처") or "외부 검색"),
                    "url": url,
                    "source_type": "external",
                }
                if search_type == "구인":
                    base["company"] = str(item.get("company") or item.get("회사") or "")
                    base["location"] = str(item.get("location") or item.get("근무지") or "")
                    salary = item.get("salary") or item.get("급여")
                    base["salary"] = str(salary) if salary and salary not in ("null", "없음", "미기재") else None
                    base["job_type"] = str(item.get("job_type") or item.get("고용형태") or "")
                else:
                    cat = str(item.get("category") or "trend").lower()
                    base["category"] = cat if cat in ("salary", "trend", "skill") else "trend"
                items.append(base)

            logger.info("[External/2ndPass] model=%s extracted %d items", model, len(items))
            if items:
                return items

        except Exception as e:
            logger.warning("[External/2ndPass] model=%s failed: %s", model, e)
            continue

    return []


def _parse_grounded_text(text: str, search_type: str, grounding_urls: list[dict]) -> list[dict]:
    """Parse ===JOB=== / ===MARKET=== delimited blocks (used when Gemini follows the format)."""
    marker = "JOB" if search_type == "구인" else "MARKET"
    pattern = rf"===\s*{marker}\s*===(.*?)===\s*END\s*==="
    blocks = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
    logger.info("[External] structured_blocks_found=%d", len(blocks))

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


def _parse_freeform_text(text: str, search_type: str) -> list[dict]:
    """
    Last-resort parser: split Gemini's free-form prose into result items.
    Looks for numbered entries (1., 2., …) or double-newline separated blocks.
    """
    items: list[dict] = []

    # Try numbered list: "1. 회사명 - 포지션 ..." or "1) ..."
    numbered = re.split(r"\n\s*\d+[.)]\s+", "\n" + text)
    blocks = [b.strip() for b in numbered if len(b.strip()) > 20]

    if not blocks:
        blocks = [b.strip() for b in re.split(r"\n{2,}", text) if len(b.strip()) > 20]

    for block in blocks[:5]:
        first_line = block.split("\n")[0].strip()
        if not first_line:
            continue

        company = ""
        m = re.search(r"(?:회사|기업|company)[:\s]+(.+?)(?:\n|$)", block, re.IGNORECASE)
        if m:
            company = m.group(1).strip()

        title_m = re.search(r"(?:제목|포지션|직무|title)[:\s]+(.+?)(?:\n|$)", block, re.IGNORECASE)
        title = title_m.group(1).strip() if title_m else first_line[:80]

        item: dict = {
            "title": title,
            "summary": block[:200].replace("\n", " "),
            "source": "Gemini 검색",
            "url": "",
            "source_type": "external",
        }
        if search_type == "구인":
            item.update({"company": company, "location": "", "salary": None, "job_type": ""})
        else:
            item["category"] = "trend"
        items.append(item)
    return items


def _chunks_to_items(grounding_urls: list[dict], search_type: str) -> list[dict]:
    """Build minimal result items directly from grounding chunk metadata (URL + title only)."""
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
        return {
            **_rich_fallback(query, search_type, local_results, external_results),
            "error": "GEMINI_API_KEY 미설정",
        }
    try:
        data = await asyncio.to_thread(
            _analyze_sync, client, query, search_type, local_results, external_results
        )
        return data
    except Exception as e:
        err_msg = f"{type(e).__name__}: {e}"
        logger.error("[Analyze] %s", err_msg)
        return {
            **_rich_fallback(query, search_type, local_results, external_results),
            "error": err_msg,
        }


def _analyze_sync(
    client,
    query: str,
    search_type: str,
    local_results: list[dict],
    external_results: list[dict],
) -> dict:
    """
    Gemini AI analysis in JSON mode.
    Tries models in order: settings.gemini_model → gemini-2.0-flash → EXTRACT_MODEL.
    Context-aware prompt that distinguishes local vs external result counts.
    """
    from google.genai import types

    local_preview = _fmt_local(local_results, search_type)
    external_preview = _fmt_external(external_results)
    local_count = len(local_results)
    external_count = len(external_results)

    # Context-aware summary instruction
    if local_count == 0 and external_count > 0:
        summary_ctx = (
            f"플랫폼에 아직 등록된 이력서/공고가 없지만, 실시간 웹 검색에서 '{query}' 관련 "
            f"시장 정보 {external_count}건을 찾았습니다. "
            "외부 검색 결과를 바탕으로 시장 동향과 구직자/구인 팁을 안내하세요. "
            "절대 '0개를 찾았습니다' 같은 표현은 사용하지 마세요."
        )
    elif local_count > 0 and external_count > 0:
        summary_ctx = (
            f"플랫폼 {local_count}건 + 실시간 외부 {external_count}건을 통합해서 요약하세요. "
            "절대 '0개를 찾았습니다' 같은 표현은 사용하지 마세요."
        )
    elif local_count > 0:
        summary_ctx = (
            f"플랫폼 등록 결과 {local_count}건을 중심으로 요약하세요. "
            "절대 '0개를 찾았습니다' 같은 표현은 사용하지 마세요."
        )
    else:
        summary_ctx = (
            f"현재 플랫폼과 외부 검색 모두에서 '{query}' 관련 결과를 찾지 못했습니다. "
            "'X개를 찾았습니다' 같은 단순 카운트 표현은 절대 사용하지 마세요. "
            "대신 다음 내용으로 2-3문장 안내: "
            "1) 검색어를 더 넓게 바꿔볼 것을 제안 (예: 관련 직무명, 기술 스택), "
            "2) 플랫폼에 이력서 등록을 유도하거나 다른 키워드로 재검색 권유, "
            "3) 해당 직무의 시장 수요나 관련 트렌드 한 마디."
        )

    prompt = (
        f'당신은 "AI JobWorld" 한국 채용 플랫폼의 AI 어시스턴트입니다.\n'
        f'검색어: "{query}" | 유형: {search_type}\n\n'
        f'[플랫폼 등록 데이터] ({local_count}건)\n{local_preview}\n\n'
        f'[실시간 외부 검색 데이터] ({external_count}건)\n{external_preview}\n\n'
        f'지시: {summary_ctx}\n\n'
        f'중요: summary 필드에 절대로 "N개를 찾았습니다" 형태의 표현을 쓰지 마세요.\n\n'
        f'아래 JSON 스키마로 한국어 응답하세요:\n'
        f'{{"summary":"검색 결과 요약 및 유용한 안내 2-3문장",'
        f'"match_reasons":["검색어와 관련된 이유 1","이유 2"],'
        f'"recommended_filters":["추천 검색 키워드 1","키워드 2","키워드 3"],'
        f'"tips":["팁 1","팁 2"],'
        f'"reasoning":"로컬/외부 데이터 차이 및 활용법 1문장"}}'
    )

    # Try models in order until one succeeds
    for model in [settings.gemini_model, "gemini-2.0-flash", EXTRACT_MODEL]:
        for use_json_mime in [True, False]:
            try:
                cfg_kwargs: dict = {"max_output_tokens": 700, "temperature": 0.3}
                if use_json_mime:
                    cfg_kwargs["response_mime_type"] = "application/json"

                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(**cfg_kwargs),
                )
                text = ""
                try:
                    text = response.text or ""
                except Exception:
                    pass

                parsed = parse_json_safe(text)
                if isinstance(parsed, dict) and parsed.get("summary"):
                    logger.info("[Analyze] succeeded model=%s json_mode=%s", model, use_json_mime)
                    return _extract_ai_fields(parsed)

                logger.warning(
                    "[Analyze] model=%s json_mode=%s — invalid/empty JSON, trying next",
                    model, use_json_mime,
                )
                break  # don't retry plain mode if JSON mode already yielded a parseable but empty result
            except Exception as e:
                logger.warning("[Analyze] model=%s json_mode=%s failed: %s", model, use_json_mime, e)
                break  # move to next model on any exception

    # All models failed
    logger.error("[Analyze] all models failed — using rich fallback")
    return _rich_fallback(query, search_type, local_results, external_results)


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


# ── Rich fallback (used when Gemini analysis is fully unavailable) ─────────────

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


def _rich_fallback(
    query: str,
    search_type: str,
    local_results: list[dict],
    external_results: list[dict] = None,
) -> dict:
    """
    When Gemini analysis is unavailable, return keyword-matched static insights.
    Now properly accounts for external_results to avoid false '0 results' messages.
    """
    external_results = external_results or []
    local_count = len(local_results)
    external_count = len(external_results)

    q_lower = query.lower()
    matched_key = next(
        (k for k in _JOB_TIPS if k != "default" and k in q_lower), "default"
    )
    tips = _JOB_TIPS[matched_key]
    filters = _JOB_FILTERS[matched_key]

    if search_type == "구직":
        if local_count > 0 and external_count > 0:
            summary = (
                f"'{query}' 관련 이력서 {local_count}건이 플랫폼에 등록되어 있으며, "
                f"실시간 웹 검색에서 {external_count}건의 시장 정보를 찾았습니다."
            )
        elif local_count > 0:
            summary = (
                f"'{query}' 관련 이력서 {local_count}건이 플랫폼에 등록되어 있습니다. "
                f"외부 검색 결과도 함께 확인해 적합한 인재를 찾아보세요."
            )
        elif external_count > 0:
            summary = (
                f"플랫폼 등록 결과는 없지만 실시간 웹 검색에서 '{query}' 관련 "
                f"시장 정보 {external_count}건을 찾았습니다."
            )
        else:
            summary = (
                f"아직 플랫폼에 등록된 '{query}' 이력서가 없습니다. "
                f"외부 시장 정보를 참고하거나 직접 구직자를 초대해 보세요."
            )
        tips = ["기술스택 필터를 활용해 원하는 인재를 찾아보세요", "면접 전 포트폴리오를 미리 검토하세요"]
    else:
        if local_count > 0 and external_count > 0:
            summary = (
                f"'{query}' 채용공고 {local_count}건이 플랫폼에 등록되어 있으며, "
                f"실시간 웹 검색에서 {external_count}건의 채용 정보를 찾았습니다."
            )
        elif local_count > 0:
            summary = (
                f"'{query}' 채용공고 {local_count}건이 플랫폼에 등록되어 있습니다. "
                f"외부 검색 결과도 함께 참고해 취업 시장을 파악하세요."
            )
        elif external_count > 0:
            summary = (
                f"플랫폼 등록 결과는 없지만 실시간 웹 검색에서 '{query}' 관련 "
                f"채용 정보 {external_count}건을 찾았습니다."
            )
        else:
            summary = (
                f"아직 플랫폼에 등록된 '{query}' 채용공고가 없습니다. "
                f"다른 검색어를 시도하거나 플랫폼에 채용공고를 등록해 보세요."
            )

    return {
        "summary": summary,
        "match_reasons": [],
        "recommended_filters": filters[:3],
        "tips": tips,
        "reasoning": "",
    }
