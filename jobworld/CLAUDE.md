# Claude Code - Project Agent Instructions

이 프로젝트는 **JOBWORLD.CO.KR** — 한국 채용 플랫폼입니다.
Claude는 이 프로젝트 전담 **시니어 코딩 에이전트**로 동작합니다.

---

## 프로젝트 구조

```
jobworld/
├── backend/          # FastAPI (Python 3.12)
│   └── app/
│       ├── api/      # 라우터 (search.py, jobs.py, auth.py …)
│       ├── models/   # SQLAlchemy ORM 모델
│       └── services/ # 비즈니스 로직 (realtime_search.py, ai_search.py …)
├── frontend/         # Next.js 14 App Router (TypeScript + Tailwind)
│   └── src/
│       ├── app/      # 페이지 (search/, jobs/, …)
│       ├── components/
│       └── lib/      # api.ts (Axios), store.ts (Zustand)
├── nginx/            # nginx.conf — /api/ → backend:8000
├── docker-compose.yml
└── .env.example
```

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | Next.js 14, App Router, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy (async), PostgreSQL, Redis |
| AI | Google GenAI SDK (`from google import genai`), Gemini |
| 배포 | Docker Compose + Nginx |

---

## 핵심 원칙

### 작업 순서 (항상 준수)
1. 요구사항 파악
2. 관련 파일 확인 (`Read`, `Glob`, `Grep`)
3. 기존 패턴 파악
4. **최소 수정 범위** 결정
5. 계획 제시 → 구현 → 자체 검토

**절대 파일 확인 없이 추측으로 구현하지 않습니다.**

### 코드 품질
- 즉시 적용 가능한 완성형 코드만 작성
- 기존 프로젝트 패턴 최우선 재사용
- 불필요한 라이브러리 추가 금지
- 타입 안정성 보장 (TypeScript strict)
- 비동기 예외 처리 포함
- null/undefined/empty 상태 처리

### UI 원칙
- 심플하고 미니멀 — 과한 장식 금지
- Tailwind 유틸리티 클래스 기존 패턴 유지
- 반응형 기본
- Semantic HTML + 접근성

---

## AI 검색 파이프라인 (핵심 기능)

```
1. detect_search_type(query)  →  구인 / 구직
2. DB 검색 (local_results)    ←  최우선 표시
3. Gemini grounding 검색      ←  gemini-2.5-flash + google_search tool
   └─ 4-pass 파싱 전략
      1) ===JOB=== 블록 파싱
      2) 2nd-pass JSON 추출 (gemini-2.5-flash-lite)
      3) grounding_chunks URL 활용
      4) 자유형식 텍스트 파싱
4. Gemini 분석               ←  gemini-2.5-flash-lite 우선
5. 통합 응답 반환
```

**중요**: `GEMINI_API_KEY`는 절대 하드코딩 금지, 환경변수에서만 읽기.

---

## 환경 변수 규칙

- 실제 `.env` → git 무시 (절대 커밋 금지)
- `.env.example` → placeholder만 (값 없이)
- `GEMINI_API_KEY` 필수 — AI 검색 기능 필요
- `GEMINI_GROUNDING_MODEL` 기본값: `gemini-2.5-flash`
- `GEMINI_MODEL` 기본값: `gemini-2.5-flash-lite`

---

## API 응답 형식 (search/ai)

```json
{
  "query": "string",
  "search_type": "구인|구직",
  "local_results": [],
  "local_total": 0,
  "external_results": [],
  "external_total": 0,
  "ai_summary": "string",
  "ai_match_reasons": [],
  "ai_recommended_filters": [],
  "ai_tips": [],
  "ai_error": null
}
```

---

## 배포 명령

```bash
# 백엔드 변경 시
docker compose build backend && docker compose up -d backend

# 프론트엔드 변경 시
docker compose build frontend && docker compose up -d frontend

# 전체 재시작
docker compose up -d

# 로그 확인
docker compose logs -f backend | grep -E "\[External\]|\[Analyze\]|\[Search\]"
```

---

## 금지 사항

- 파일 확인 없이 대규모 구현
- `GEMINI_API_KEY` 코드에 하드코딩
- `.env` 커밋
- 필요 없는 새 라이브러리 추가
- pseudo-code / 데모 코드 / 반쪽짜리 구현
- 기존 코드 스타일 무시
