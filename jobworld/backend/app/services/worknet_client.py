"""
워크넷 채용정보 OpenAPI 클라이언트.

공식 문서: https://www.work.go.kr/opi/opi/opi/empInfo/empInfoSrch/getList
응답 형식: XML → 파싱 후 dict 반환.
"""

import logging
from typing import Optional
import httpx
import defusedxml.ElementTree as ET  # XXE 안전 파서

from app.config import settings

log = logging.getLogger("worknet.client")

# ── 상수 ────────────────────────────────────────────────────────────────────
WORKNET_BASE_URL = "https://www.work.go.kr/opi/opi/opi/empInfo/empInfoSrch/getList"
DEFAULT_TIMEOUT = 30.0          # 초
MAX_DISPLAY = 100               # 1회 최대 건수 (워크넷 정책)
MAX_PAGES_PER_SYNC = 10         # 1회 동기화 최대 페이지 (= 최대 1,000건)


# ── 유틸 ────────────────────────────────────────────────────────────────────

def _text(element, tag: str, default: str = "") -> str:
    """XML 요소에서 태그 텍스트를 안전하게 추출."""
    node = element.find(tag)
    if node is None or node.text is None:
        return default
    return node.text.strip()


def _parse_job_element(elem) -> dict:
    """<wanted> 요소 하나를 dict로 변환."""
    return {
        "wanted_auth_no": _text(elem, "wantedAuthNo"),
        "company_name":   _text(elem, "company", "기업명 미공개"),
        "title":          _text(elem, "wantedTitle"),
        "job_category":   _text(elem, "jobsNm"),
        "employment_type": _text(elem, "empTpNm"),
        "location":       _text(elem, "region"),
        "salary":         _text(elem, "salTxt"),
        "education":      _text(elem, "eduNm"),
        "career":         _text(elem, "career"),
        "deadline":       _text(elem, "closeDt"),
        "reg_date":       _text(elem, "regDt"),
        "source_url":     _text(elem, "wantedInfoUrl"),
    }


def _parse_xml(xml_bytes: bytes) -> tuple[int, list[dict]]:
    """
    워크넷 XML 응답을 파싱.

    Returns:
        (total, jobs_list)
        total — 전체 결과 건수
        jobs_list — 파싱된 공고 dict 목록
    """
    root = ET.fromstring(xml_bytes)

    # 전체 건수
    total_node = root.find("total")
    total = int(total_node.text.strip()) if total_node is not None and total_node.text else 0

    jobs = [_parse_job_element(elem) for elem in root.findall("wanted")]
    return total, jobs


# ── 클라이언트 ───────────────────────────────────────────────────────────────

class WorknetClient:
    """워크넷 채용정보 API 비동기 클라이언트."""

    def __init__(self) -> None:
        self._auth_key = settings.worknet_api_key

    def _base_params(self) -> dict:
        return {
            "authKey":    self._auth_key,
            "callTp":     "L",       # L=목록, D=상세
            "returnType": "xml",
            "display":    str(MAX_DISPLAY),
        }

    async def fetch_job_list(
        self,
        page: int = 1,
        region: Optional[str] = None,
        occupation: Optional[str] = None,
        keyword: Optional[str] = None,
    ) -> tuple[int, list[dict]]:
        """
        채용정보 목록 1페이지 조회.

        Args:
            page: 시작 페이지 (1-based)
            region: 지역코드 (예: '서울', '경기' 등 워크넷 코드)
            occupation: 직종코드
            keyword: 검색 키워드

        Returns:
            (total_count, jobs)

        Raises:
            httpx.TimeoutException: 타임아웃
            httpx.HTTPStatusError: 4xx/5xx 응답
            ValueError: XML 파싱 실패
        """
        params = self._base_params()
        params["startPage"] = str(page)

        if region:
            params["region"] = region
        if occupation:
            params["occupation"] = occupation
        if keyword:
            params["keyword"] = keyword

        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            resp = client.get(WORKNET_BASE_URL, params=params)
            resp = await resp  # type: ignore[assignment]
            resp.raise_for_status()

        # 일일 호출 한도 초과 응답 처리 (HTTP 200 + 에러 메시지 반환하는 경우)
        if b"AuthenticationFail" in resp.content or b"limitOver" in resp.content:
            raise RuntimeError("워크넷 API 호출 한도 초과 또는 인증 실패")

        try:
            return _parse_xml(resp.content)
        except Exception as exc:
            raise ValueError(f"워크넷 XML 파싱 실패: {exc}") from exc

    async def fetch_all_jobs(
        self,
        region: Optional[str] = None,
        occupation: Optional[str] = None,
        keyword: Optional[str] = None,
        max_pages: int = MAX_PAGES_PER_SYNC,
    ) -> list[dict]:
        """
        여러 페이지를 순회하며 공고를 모두 수집.
        max_pages 제한으로 일일 한도 초과 방지.
        """
        all_jobs: list[dict] = []

        for page in range(1, max_pages + 1):
            try:
                total, jobs = await self.fetch_job_list(
                    page=page,
                    region=region,
                    occupation=occupation,
                    keyword=keyword,
                )
            except RuntimeError:
                # 한도 초과 — 지금까지 수집한 것만 반환
                log.warning("[WorknetClient] API 한도 초과로 p%d에서 중단 (수집 %d건)", page, len(all_jobs))
                break
            except httpx.TimeoutException:
                log.error("[WorknetClient] 타임아웃 p%d — 재시도 없이 중단", page)
                break
            except Exception as exc:
                log.error("[WorknetClient] 오류 p%d: %s", page, exc)
                break

            if not jobs:
                break

            # wanted_auth_no 누락된 항목 필터링
            valid = [j for j in jobs if j.get("wanted_auth_no")]
            all_jobs.extend(valid)

            fetched = (page - 1) * MAX_DISPLAY + len(jobs)
            log.info("[WorknetClient] p%d 수집 %d건 (누적 %d / 전체 %d)", page, len(valid), len(all_jobs), total)

            if fetched >= total:
                break  # 마지막 페이지 도달

        return all_jobs


# 싱글턴
worknet_client = WorknetClient()
