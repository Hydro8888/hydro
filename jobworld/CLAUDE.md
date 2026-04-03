# Claude Code - Project Agent Instructions

이 프로젝트는 **JOBWORLD.CO.KR** — 한국 채용 플랫폼입니다.
Claude는 이 프로젝트 전담 **시니어 코딩 에이전트**로 동작합니다.
# 하네스 엔지니어링 오케스트레이터

이 프로젝트는 3-Agent 하네스 구조로 동작합니다.
사용자의 한 줄 프롬프트를 받아, Planner → Generator → Evaluator 파이프라인을 자동 실행합니다.

---

## 실행 흐름

사용자가 프롬프트를 주면, 아래 순서대로 서브에이전트를 호출합니다.

```
[사용자 프롬프트]
       ↓
  ① Planner 서브에이전트
     → SPEC.md 생성
       ↓
  ② Generator 서브에이전트
     → output/index.html 생성 + SELF_CHECK.md 작성
       ↓
  ③ Evaluator 서브에이전트
     → QA_REPORT.md 작성
       ↓
  ④ 판정 확인
     → 합격: 완료 보고
     → 불합격/조건부: ②로 돌아가 피드백 반영 (최대 3회 반복)
```

---

## 서브에이전트 호출 방법

각 단계에서 Task 도구를 사용하여 서브에이전트를 호출합니다.
서브에이전트에게 전달할 프롬프트는 아래 "단계별 실행 지시"를 따릅니다.

중요: 각 서브에이전트는 독립된 컨텍스트에서 실행됩니다.
이것이 "만드는 AI와 평가하는 AI를 분리"하는 핵심입니다.

---

## 단계별 실행 지시

### 단계 1: Planner 호출

서브에이전트에게 아래 내용을 전달합니다:

```
agents/planner.md 파일을 읽고, 그 지시를 따라라.
agents/evaluation_criteria.md 파일도 읽고 참고하라.

사용자 요청: [사용자가 준 프롬프트]

결과를 SPEC.md 파일로 저장하라.
```

Planner 서브에이전트가 SPEC.md를 생성하면, 다음 단계로 진행합니다.


### 단계 2: Generator 호출

서브에이전트에게 아래 내용을 전달합니다:

최초 실행 시:
```
agents/generator.md 파일을 읽고, 그 지시를 따라라.
agents/evaluation_criteria.md 파일도 읽고 참고하라.
SPEC.md 파일을 읽고, 전체 기능을 한 번에 구현하라.

결과를 output/index.html 파일로 저장하라.
완료 후 SELF_CHECK.md를 작성하라.
```

피드백 반영 시 (2회차 이상):
```
agents/generator.md 파일을 읽고, 그 지시를 따라라.
agents/evaluation_criteria.md 파일도 읽고 참고하라.
SPEC.md 파일을 읽어라.
output/index.html 파일을 읽어라. 이것이 현재 코드다.
QA_REPORT.md 파일을 읽어라. 이것이 QA 피드백이다.

QA 피드백의 "구체적 개선 지시"를 모두 반영하여 output/index.html을 수정하라.
"방향 판단"이 "완전히 다른 접근 시도"이면 디자인 컨셉 자체를 바꿔라.
완료 후 SELF_CHECK.md를 업데이트하라.
```


### 단계 3: Evaluator 호출

서브에이전트에게 아래 내용을 전달합니다:

```
agents/evaluator.md 파일을 읽고, 그 지시를 따라라.
agents/evaluation_criteria.md 파일을 읽어라. 이것이 채점 기준이다.
SPEC.md 파일을 읽어라. 이것이 설계서다.
output/index.html 파일을 읽어라. 이것이 검수 대상이다.

검수 절차:
1. output/index.html을 분석하라
2. SPEC.md의 기능이 구현되었는지 확인하라
3. evaluation_criteria.md에 따라 4개 항목을 채점하라
4. 최종 판정(합격/조건부/불합격)을 내려라
5. 불합격 또는 조건부 시, 구체적 개선 지시를 작성하라

결과를 QA_REPORT.md 파일로 저장하라.
```


### 단계 4: 판정 확인

QA_REPORT.md를 읽고 판정을 확인합니다.

- "합격" → 사용자에게 완료 보고. output/index.html 안내.
- "조건부 합격" 또는 "불합격" → 단계 2로 돌아가 피드백 반영.
- 최대 반복 횟수: 3회. 3회 후에도 불합격이면 현재 상태로 전달하고 이슈를 보고.

---

## 완료 보고 형식

모든 단계가 끝나면 사용자에게 아래 형식으로 보고합니다:

```
## 하네스 실행 완료

**결과물**: output/index.html
**Planner 설계 기능 수**: X개
**QA 반복 횟수**: X회
**최종 점수**: 디자인 X/10, 독창성 X/10, 기술 X/10, 기능 X/10 (가중 X.X/10)

**실행 흐름**:
1. Planner: [무슨 기능을 설계했는지 한 줄]
2. Generator R1: [첫 구현 결과 한 줄]
3. Evaluator R1: [판정 결과 + 핵심 피드백 한 줄]
4. Generator R2: [수정 내용 한 줄] (있는 경우)
5. Evaluator R2: [판정 결과] (있는 경우)
...
```

---

## 주의사항

- 서브에이전트 호출 시, 반드시 필요한 파일을 읽도록 지시하세요
- Generator와 Evaluator는 반드시 다른 서브에이전트로 호출하세요 (분리가 핵심)
- 각 단계 완료 후, 생성된 파일이 존재하는지 확인하세요
- QA_REPORT.md를 사람도 읽을 수 있도록, 각 라운드마다 핵심 내용을 요약해주세요

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
