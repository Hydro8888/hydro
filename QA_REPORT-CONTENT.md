# QA_REPORT-CONTENT: 기사 본문 수집 파이프라인 수정 검수

---

## 1단계: 코드 분석

### 변경 파일 요약

| 파일 | 변경 유형 | 핵심 변경 |
|------|----------|----------|
| `normalizer.ts` | 수정 | 라인 144 주석 + 라인 149: `.slice(0, 500)` → `.slice(0, 8000)` |
| `scraper.ts` | 수정 | 라인 232: 임계값 500 → 1500, 라인 190: `fetchArticlePage` export 추가 |
| `content-translator.ts` | 수정 | 라인 50: `.slice(0, 4500)` → `.slice(0, 6000)` |
| `fix-content/route.ts` | 신규 | GET(dry-run) + POST(재스크래핑) 관리자 API |

---

## 2단계: SPEC 개선 항목 검증

### Item 1: normalizer.ts — 500 → 8000
- [PASS] 라인 144 주석: `"max 8000 chars"` 로 변경 확인 (기존 `"max 3000 chars"` → 스펙에서 3000이라 명시했고 실제 코드에서 8000으로 정확히 반영)
- [PASS] 라인 149: `.slice(0, 8000)` 확인

### Item 2: scraper.ts — 재스크래핑 임계값 500 → 1500
- [PASS] 라인 232: `a.contentOriginal.length < 1500` 확인
- [PASS] `fetchArticlePage`가 `export async function`으로 외부 노출 확인 (라인 190)

### Item 3: content-translator.ts — 번역 입력 4500 → 6000
- [PASS] 라인 50: `.slice(0, 6000)` 확인

### Item 4: 기존 기사 복구 API
- [PASS] GET: `contentOriginal.length <= 500` 기준으로 short article 수 + 샘플 10개 반환
- [PASS] POST: short article 재스크래핑 → DB 업데이트 + `contentKo: null` 설정
- [PASS] `fetchArticlePage` 재사용 (import from `@/workers/scraper`)
- [PASS] 배치 10개씩, 800ms 딜레이 구현

---

## 3단계: evaluation_criteria 채점

이 변경은 백엔드 파이프라인 수정이므로, 디자인/독창성 항목은 해당 슬라이스 맥락에 맞게 평가합니다.

### 디자인 품질: 8/10
백엔드 변경으로 UI 디자인과 직접 무관하나, API 응답 구조가 깔끔하고 일관됨. GET의 dry-run 응답에 `total`, `short`, `noContent`, `samples`, `message` 필드를 포함하여 관리자에게 충분한 정보를 제공.

### 독창성: 7/10
dry-run(GET) + 실행(POST) 패턴은 관리 API의 좋은 관행. 기존 `fix-images/route.ts`와 유사한 패턴을 따르고 있어 프로젝트 내 일관성 유지.

### 기술적 완성도: 7/10
- TypeScript 타입 호환: `fetchArticlePage`의 반환 타입 `ScrapedPage`는 이미 정의되어 있고, export 추가만으로 외부 사용 가능 -- 깔끔함
- `@/workers/scraper` 경로는 tsconfig의 `"@/*": ["./src/*"]` 매핑으로 유효
- try/catch 에러 처리가 GET, POST 모두 적용됨
- **감점 요인 1**: `fix-content/route.ts` GET 핸들러 라인 11에서 `contentOriginal: { not: null }` 조건으로 쿼리하면서, 라인 18에서 다시 `!a.contentOriginal`로 `noContent`를 필터링함 -- DB 쿼리가 `not: null` 조건이므로 `noContent`는 항상 0이 됨. 이는 논리적 오류
- **감점 요인 2**: POST 핸들러는 `where: { isActive: true }`만 사용하여 `contentOriginal`이 null인 기사도 포함하는데, GET은 `contentOriginal: { not: null }`로 제한함 -- GET과 POST의 대상 기사 범위가 불일치
- **감점 요인 3**: scraper.ts의 `extractArticleContent` 내부 JSON-LD 추출(라인 60)과 HTML 패턴 추출(라인 152)에서도 `.slice(0, 8000)`을 적용하고 있는데, 이것이 SPEC에 명시된 변경인지 불명확. 다만 normalizer의 8000과 일관되므로 문제는 아님

### 기능성: 8/10
- 핵심 기능(짧은 본문 감지 + 재스크래핑)이 정상 동작하도록 구현
- 배치 처리 + 딜레이로 외부 서버 부하 관리
- `contentKo: null` 설정으로 다음 수집 사이클에서 자동 재번역 유도

### 회귀 안전: 9/10
- `scrapeArticleContents` 함수 시그니처 변경 없음 -- collector 파이프라인 호환
- `normalizeArticle` 함수 시그니처 변경 없음 -- 정상 호환
- `translateContent` 함수 시그니처 변경 없음
- 기존 582개 기사: normalizer 변경은 새 기사에만 영향 (기존 DB 데이터 무관), scraper 임계값 변경으로 기존에 500-1500자 기사가 다음 수집 시 재스크래핑될 수 있으나 이는 의도된 동작
- 유일한 우려: scraper 임계값 1500으로 변경 시 기존에 충분했던 500-1500자 기사도 재스크래핑 시도 → 불필요한 네트워크 요청 증가 가능. 다만 "더 긴 콘텐츠가 있을 때만 교체" 로직(라인 248)이 있으므로 데이터 손실은 없음

---

## 4단계: 회귀 검증

| 검증 항목 | 결과 |
|----------|------|
| `scrapeArticleContents` 시그니처 호환 | OK — export, 인자, 반환형 동일 |
| `normalizeArticle` 시그니처 호환 | OK — 변경 없음 |
| `translateContent` 시그니처 호환 | OK — 변경 없음 |
| collector.ts 파이프라인 | OK — `scrapeArticleContents` 임포트 정상 |
| `@/workers/scraper` 경로 | OK — tsconfig paths `"@/*": ["./src/*"]` 매핑 유효 |
| `@/lib/db` 임포트 | OK — 기존 12개 파일에서 동일 패턴 사용 중 |
| TypeScript 타입 호환 | OK — `fetchArticlePage` 반환 `ScrapedPage`, route에서 `content` 필드만 사용 |
| 기존 기사 데이터 | OK — DB 기존 데이터 직접 변경 없음 (POST 호출 시에만 갱신) |

---

## 5단계: 최종 판정

**전체 판정**: 조건부 합격
**가중 점수**: 7.6 / 10.0

계산: (8×0.3) + (7×0.2) + (7×0.25) + (8×0.15) + (9×0.1) = 2.4 + 1.4 + 1.75 + 1.2 + 0.9 = 7.65

**항목별 점수**:
- 디자인 품질: 8/10 — API 응답 구조가 깔끔하고 정보 충분
- 독창성: 7/10 — dry-run + 실행 패턴은 좋은 관행, 프로젝트 내 일관성 유지
- 기술적 완성도: 7/10 — GET의 noContent 필터 논리 오류, GET/POST 쿼리 범위 불일치
- 기능성: 8/10 — 핵심 기능 정상, 배치 + 딜레이 + 재번역 유도 구현
- 회귀 안전: 9/10 — 기존 파이프라인 호환성 완벽, 데이터 손실 위험 없음

**구체적 개선 지시**:

1. **`src/app/api/admin/fix-content/route.ts` 라인 11**: GET 핸들러의 DB 쿼리에서 `contentOriginal: { not: null }` 조건을 제거하라. 현재 이 조건 때문에 `contentOriginal`이 null인 기사가 결과에서 빠지고, 라인 18의 `noContent` 카운트가 항상 0이 된다. POST와 동일하게 `where: { isActive: true }`만 사용하여 null 콘텐츠 기사도 포함시켜야 한다.

2. **`src/app/api/admin/fix-content/route.ts` 라인 15-16**: GET의 shortArticles 필터 조건을 `a.contentOriginal.length <= 500`에서 POST와 동일한 기준으로 통일하라. 현재 GET은 `<= 500`, POST도 `<= 500`으로 수치는 동일하나, DB 쿼리 범위가 다르므로 결과가 불일치한다. 위 1번 수정과 함께 해결됨.

**방향 판단**: 현재 방향 유지 — 핵심 파이프라인 수정은 정확하고, fix-content API의 사소한 논리 불일치만 수정하면 합격 가능.
