# 하네스 엔지니어링 오케스트레이터 (멀티파일 Next.js 프로젝트용)

이 프로젝트는 5-슬라이스 하네스 구조로 동작합니다.
각 도메인 슬라이스별로 Planner → Generator → Evaluator 파이프라인을 실행합니다.

---

## 도메인 슬라이스

| 슬라이스 | 영역 | 대상 파일 |
|----------|------|----------|
| S1 | 디자인 시스템 | `tailwind.config.ts`, `globals.css`, `constants.ts`, `utils.ts` |
| S2 | 레이아웃 & 네비게이션 | `Header.tsx`, `Footer.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` |
| S3 | 콘텐츠 컴포넌트 | `NewsCard.tsx`, `NewsCardLarge.tsx`, `BreakingTicker.tsx`, `CountryTabs.tsx`, `CategoryNav.tsx`, `Pagination.tsx`, `types.ts`, `NewsCardSkeleton.tsx` |
| S4 | 페이지 & UX | 모든 `page.tsx`, `middleware.ts`, `queries.ts`, `[country]/page.tsx` |
| S5 | 백엔드 & 프로세스 | `collector.ts`, `translator.ts`, `scheduler.ts`, `scraper.ts`, `circuit-breaker.ts`, `retry.ts` |

---

## 실행 흐름

```
[사용자 프롬프트]
       ↓
  각 슬라이스(S1→S2→S3→S4→S5)에 대해:
       ↓
  ① Planner 서브에이전트
     → SPEC-S{n}.md 생성
       ↓
  ② Generator 서브에이전트
     → 소스 파일 수정 + SELF_CHECK-S{n}.md 작성
       ↓
  ③ Evaluator 서브에이전트
     → QA_REPORT-S{n}.md 작성
       ↓
  ④ 판정 확인
     → 합격: 다음 슬라이스로
     → 불합격/조건부: ②로 돌아가 피드백 반영 (최대 3회 반복)
       ↓
  [모든 슬라이스 완료]
       ↓
  ⑤ 통합 테스트
     → npm run build 확인
     → 전 페이지 동작 확인
```

---

## 서브에이전트 호출 방법

각 단계에서 Task 도구를 사용하여 서브에이전트를 호출합니다.
중요: 각 서브에이전트는 독립된 컨텍스트에서 실행됩니다.
이것이 "만드는 AI와 평가하는 AI를 분리"하는 핵심입니다.

---

## 단계별 실행 지시

### 단계 1: Planner 호출

```
agents/planner.md 파일을 읽고, 그 지시를 따라라.
agents/evaluation_criteria.md 파일도 읽고 참고하라.

슬라이스 S{n}의 대상 파일들을 모두 읽어라:
[대상 파일 경로 목록]

사용자 요청: [사용자가 준 프롬프트]
디자인 방향: 다크 모던 (Bloomberg/Reuters 스타일)

결과를 SPEC-S{n}.md 파일로 저장하라.
```

### 단계 2: Generator 호출

최초 실행 시:
```
agents/generator.md 파일을 읽고, 그 지시를 따라라.
agents/evaluation_criteria.md 파일도 읽고 참고하라.
SPEC-S{n}.md 파일을 읽고, 모든 개선 항목을 구현하라.

대상 파일들을 모두 읽은 뒤 수정하라.
완료 후 SELF_CHECK-S{n}.md를 작성하라.
```

피드백 반영 시 (2회차 이상):
```
agents/generator.md 파일을 읽고, 그 지시를 따라라.
agents/evaluation_criteria.md 파일도 읽고 참고하라.
SPEC-S{n}.md 파일을 읽어라.
QA_REPORT-S{n}.md 파일을 읽어라. 이것이 QA 피드백이다.

QA 피드백의 "구체적 개선 지시"를 모두 반영하여 소스 파일을 수정하라.
완료 후 SELF_CHECK-S{n}.md를 업데이트하라.
```

### 단계 3: Evaluator 호출

```
agents/evaluator.md 파일을 읽고, 그 지시를 따라라.
agents/evaluation_criteria.md 파일을 읽어라. 이것이 채점 기준이다.
SPEC-S{n}.md 파일을 읽어라. 이것이 설계서다.

수정된 파일들을 모두 읽어라:
[수정된 파일 경로 목록]

검수 절차:
1. 수정된 파일들을 분석하라
2. SPEC-S{n}.md의 개선 항목이 구현되었는지 확인하라
3. evaluation_criteria.md에 따라 5개 항목을 채점하라
4. 회귀 검증: 기존 기능이 깨지지 않았는지 확인하라
5. 최종 판정(합격/조건부/불합격)을 내려라
6. 불합격 또는 조건부 시, 구체적 개선 지시를 작성하라

결과를 QA_REPORT-S{n}.md 파일로 저장하라.
```

### 단계 4: 판정 확인

QA_REPORT-S{n}.md를 읽고 판정을 확인한다.

- "합격" → 다음 슬라이스로 진행
- "조건부 합격" 또는 "불합격" → 단계 2로 돌아가 피드백 반영
- 최대 반복 횟수: 3회

---

## 완료 보고 형식

모든 슬라이스가 끝나면:

```
## 하네스 실행 완료

**슬라이스별 ��과**:
| 슬라이스 | QA 반복 | 최종 점수 | 상태 |
|----------|---------|----------|------|
| S1 디자인 | X회 | X.X/10 | 합격 |
| S2 레이아웃 | X회 | X.X/10 | 합격 |
| S3 컴포넌트 | X회 | X.X/10 | 합격 |
| S4 페이지 | X회 | X.X/10 | 합격 |
| S5 백엔드 | X회 | X.X/10 | 합격 |

**수정 파일 총 수**: X개
**신규 파일 수**: X개
**삭제 파일 수**: X개

**빌드 상태**: npm run build 성공/실패
```

---

## 주의사항

- 서브에이전트 호출 시, 반드시 필요한 파일을 읽도록 지시하세요
- Generator와 Evaluator는 반드시 다른 서브에이전트로 호출하세요 (분리가 핵심)
- 각 단계 완료 후, 생성된 파일이 존재하는지 확인하세요
- S1→S2→S3→S4→S5 순서를 지키세요 (앞 슬라이스의 디자인 토큰을 뒤 슬라이스가 사용)
- 백업 브랜치: `backup/pre-redesign-20260403`으로 롤백 가능
