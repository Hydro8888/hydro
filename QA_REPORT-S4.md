# QA 리포트 — 슬라이스 S4 페이지 & UX (Round 5 · 결함 수정 라운드, 1회차)

> 검수 대상: HEAD `68a8bf3` (`git diff HEAD~1`, 32개 파일). Evaluator가 독립적으로 직접 실행해 확인했다. SELF_CHECK-S4.md의 주장은 하나씩 재현해서 검증했다.
> 환경: `qa-env.sh restart` → 18:37 새로 빌드(`✓ Compiled successfully`, Middleware 28.1 kB), `APP UP (2s, css 200)`. 로그는 `$SP/eval-s4-*.log`.

---

## 0. 직접 실행 결과 (수치)

| 검증 | 결과 |
|---|---|
| `npx tsc --noEmit` | 0 오류 |
| `npm test` | **106 pass / 0 fail**. `TZ=America/Los_Angeles`에서도 106/106 |
| `planner-s4-verify.js` (원본) | **10/12**. FAIL은 T4·T11 두 건이며, 둘 다 오탐으로 확인했다(§3) |
| `planner-s4-verify.js` (스크래치패드에서 오탐 2곳만 수정, `EVAL-S4` 주석, 원본은 `planner-s4-verify.pre-eval.js`로 보존) | **12/12** (`eval-s4-verify-fixed.log`) |
| `planner-s3-verify.js` | **8/8**. T3에서 393/356/1은 모두 `band`(외부망 차단 환경) |
| `planner-s2-verify.js` | 13/14. T3은 하네스(:4001)를 실행하지 않아 SKIPPED. S2 QA 때와 같다 |
| `audit.js s4-eval` vs `s3-eval` (156 레코드) | NEW overflow 0, 문서 넘침 0, 깨진 이미지 0, spinner/빈 main 변화 0. **관리자 401 실패 요청 6 → 0**. 차이는 모두 의도된 변화다. `cat-unknown`·`art-inactive`가 200에서 404로 바뀌면서 기존 404 페이지들과 같은 S2 Pretendard `Event` 오류가 붙었다. `breaking-p999`는 p14로 이동해 p14에 원래 있던 `/api/img` 픽스처 500 콘솔 1건을 그대로 가진다(S5 범위) |
| curl 인증 | 무인증 상태에서 `GET /api/admin/health` **200**, `HEAD`·`OPTIONS`는 200/204, `POST`는 401. `/api/admin/stats`·`/logs`·`/sources`는 **401 + `WWW-Authenticate: Basic realm="Admin", charset="UTF-8"`**. `GET`/`HEAD /api/articles`는 200. `PATCH /api/articles/1`은 401 + WWW-Authenticate. `/admin`은 401, `/adminx`는 404, `POST /api/collect`는 401. 잘못된 비밀번호는 401, 소문자 `basic` 스킴은 200 |
| curl 파라미터 | `/api/search?page=abc&limit=abc` → 400(q 누락에 대한 기존 응답이며 500 아님), `?q=a&page=abc&limit=abc` → 200, `q=Federal&page=99999999999` → 200. `/api/articles?page=abc&limit=abc` → 200. `/api/articles/407` → 404, `/abc` → 400, `/99999999999` → 404. 인증 상태 `/api/admin/articles?page=99999999999` → 200 빈 목록, `status=bogus&country=xx` → 200 전체. `PATCH {"isActive":"nope"}` → 400, `PATCH /99999999999` → 404. `/api/articles?limit=5` 첫 행은 날짜가 있음(nulls last) |
| 관리자/공개 "오늘" | `articlesToday` admin 31 = public 31 |
| DB 장애 수동 절차 | 아래 §5 참조. PG 복구는 `qa-env.sh status`로 확인(`pg: 410 articles`). 끝에 `qa-env.sh reseed` 실행 |

---

## 1. SPEC 개선 항목 검증

- **[PASS] 항목 1 (D12/D13/D14)**: `src/lib/auth-policy.ts`의 `requiresAuth`는 SPEC 규칙 1~6을 그대로 따른다. 경로는 세그먼트 단위로 비교하고, 끝의 `/` 하나는 무시한다. `isValidBasicAuth`는 엄격한 base64와 `fatal` UTF-8 디코딩을 쓰고, 첫 `:`에서 나누며, 어떤 입력에도 throw하지 않는다. `middleware.ts:10-32`는 이 정책 하나만 따르고, API와 페이지의 모든 401에 challenge 헤더를 붙인다. `isPublicRead`는 삭제됐다. matcher에 `/api/stats`는 없다. T1·T2·T3 PASS. 새 컨텍스트에서 `/admin/sources`·`/admin/articles`를 열면 데이터가 표시된다(audit에서 401이 사라짐).
- **[PASS] 항목 2 (D15)**: `fetchAdminJson`은 auth/server/network/invalid를 구분하고, AbortError는 다시 throw하며, `withBasePath`를 쓴다. 관리자 4개 화면은 모두 loading/ready/error 상태를 쓰고, 오류일 때 h1에 `(N)`이 없다. 직접 실행 결과: 500을 강제하면 h1은 "기사 관리", `role=alert` 박스에 "데이터를 불러오지 못했습니다(서버 오류) … (HTTP 500)"과 "다시 시도"가 나온다(`peek/eval-s4-adm-err.png`). T9 PASS. 관리자 페이지에 `'/livenews/api'`는 0건, `toLocaleString('ko-KR')`는 0건이다(남은 것은 숫자 `toLocaleString()`뿐).
- **[PASS] 항목 3**: `GET /api/admin/articles`는 select로 목록 필드만 반환하고, 정렬은 `createdAt desc, id desc`, 캐시는 없으며, status/country를 정규화한다. 직접 브라우저로 수행: 상태=비활성 → 407 한 행("기사 관리 (1)") → 토글 → 공개 `/api/articles/407`이 200 → API로 원복 → 404. 페이지 표시는 "1 / 14"이고, 마지막 페이지에서 "다음"이 비활성화된다. PATCH는 타입 검증 후 400을 반환하고, 깨진 JSON도 400이며, `invalidateCache('*')`를 호출한다.
- **[PASS] 항목 4 (D8)**: `parsePage`/`resolvePageRequest`를 쓴다. `/breaking?page=999` → **307 `?page=14`**, `/category/economy?page=50` → **307 `?page=2`**, `/world?page=999` → 307 `?page=6`. `/category/international-politics?page=3` → 307로 페이지 번호 없는 URL. 주 목록 쿼리 5개는 throw하고, 보조 쿼리 3개는 `[]`를 반환한다. 빈 상태 문구는 정직하다(`international-politics`에서 "국제정치 분야 기사가 아직 없습니다", '새로고침' 0건). 범위 초과 처리 위치가 SPEC과 다르지만 §2(a)에서 승인했다.
- **[PASS] 항목 5**: API 4종 모두 `parsePage`/`parseIntParam`을 쓰고, 정렬은 nulls last + `id desc`다. 상세 API는 형식 불량 400, 범위 밖 404, 비활성 404를 반환한다. 응답 형식은 바뀌지 않았다(`articles,total,page,totalPages`).
- **[PASS] 항목 6 (D9)**: `/category/zzz`·`/quantum-weird-category`·`/article/{12abc,abc,0,407,999999}`·`/nope`·`/xyz`는 모두 **HTTP 404**이고, 하이드레이션 뒤 탭 제목은 "페이지를 찾을 수 없습니다 | LiveNews"다(직접 확인 7건, T5 4건). 이중 브랜드는 제거됐다(속보·세계 뉴스·경제 뉴스·랭킹·뉴스 검색 `| LiveNews`). 소분류 11개는 모두 200이다. generateMetadata에서 notFound를 호출하는 점은 SPEC과 다르지만 §2(b)에서 승인했다.
- **[PASS] 항목 7 (D16)**: `getArticleView`로 bodyMode 5종을 구분한다. `/article/356` 스크린샷(`peek/eval-s4-body-0.jpg`): 2px accent 띠 "본문 번역 준비 중 · 한국어 요약과 원문을 먼저 제공합니다" → accent 오버라인 "요약" → 원문 순서. `/article/341`(`eval-s4-echo-0.jpg`): 영어 h1 아래 "제목 번역 준비 중 · 원문 제목을 표시합니다". `/article/393`(`eval-s4-ja-0.jpg`): 일본어 h1이 자연스럽게 줄바꿈되고, 제목·본문 상태 표시가 있으며, "원문 · 日本語" 오버라인이 붙는다. T6 PASS.
- **[PASS] 항목 8**: 히어로는 `ArticleHeroImage`를 쓰고 alt가 없다(장식용). 이미지가 없으면 띠와 출처 워드마크가 나온다. 배지는 `borderAll`을 쓴다. 카테고리는 알려진 slug일 때만 링크하고, 날짜가 없으면 항목을 생략하며, `<time dateTime>`을 쓴다. 공유 제목은 `view.title.text`다. T7·T8 PASS, S3 T3 8/8.
- **[PASS] 항목 9**: 홈은 40건을 가져와 기사가 한 번씩만 배치되고, h1은 sr-only 1개, 티커에 `language`가 들어가며, 뉴스레터 섹션은 플래그로 제어된다. `as any`는 0건이다. T12 PASS.
- **[PASS·경미 결함] 항목 10**: 이전 검색어의 결과가 남아 있던 문제가 해결됐고, `retryKey`로 다시 시도하면 실제로 재요청한다. `page=abc`이면 1페이지 결과와 `Pagination`이 나온다("1 2 3"). label/htmlFor가 연결되어 있고 `role=alert`가 있다. T11 PASS. 단, **오류 화면에서도 `"Fed" 검색 결과: 0건`이 같이 표시된다**(DB 장애 실측: `검색 결과: 0건 검색 중 오류가 발생했습니다`). 이번 슬라이스의 "정직한 상태" 원칙에 어긋난다. 또 SPEC은 `language: string | null`을 요구했지만 구현은 `language?: string`이다(타입만 다르고 동작은 같다).
- **[PASS] 항목 11**: `/ranking?country=xyz`는 200이고 기사 링크 30개가 나온다. 관리자 통계 "오늘"은 KST 기준이다(31 = 31).
- **[PASS] 항목 12**: 테스트 4개 파일, 신규 25건. SPEC의 표 케이스(health GET/HEAD/OPTIONS/POST, `articlesfoo`, `__proto__`, `2147483648`, `resolvePageRequest` 경계 등)를 모두 포함한다. 대상 모듈은 순수 모듈이다.

**SPEC 항목: 12/12 PASS** (항목 10은 경미 결함 1건)

---

## 2. Generator가 SPEC과 다르게 구현한 2건 판정

### (a) 범위 초과 리다이렉트를 layout으로 옮기고 `x-livenews-query` 헤더로 쿼리 전달 → **승인**
- **보안(직접 실험)**: 클라이언트가 `x-livenews-query: ?page=999`를 보내도 `/breaking`, `/category/economy`, `/breaking?page=2`는 모두 **200(리다이렉트 없음)**이다. 미들웨어가 `headers.set(LIST_QUERY_HEADER, search)`로 항상 덮어쓰기 때문이다(`middleware.ts:15-17`). 이 헤더를 읽는 곳은 breaking·category layout뿐이고, 두 경로는 모두 `forwardsListQuery`가 true여서 반드시 덮어써진다. `/category`(slug 없음)는 덮어쓰지 않지만 읽는 layout이 없고 404다. 값은 URL에 이미 인코딩된 `search`라서 CRLF 주입이 불가능하다. 응답 헤더로도 새지 않는다(`curl -D -`로 확인). 최악의 경우를 가정해도 효과는 "다른 페이지 번호로 리다이렉트"뿐이라 위험하지 않다.
- **인증**: 공개 경로에서는 `requiresAuth`가 false이므로 인증 분기에 들어가지 않는다. `/breaking`, `/category/*`는 무인증 200이고, 401이나 WWW-Authenticate 헤더가 붙지 않는다.
- **성능**: Edge 미들웨어는 헤더 복사만 한다. `/breaking` 26–30 ms vs 미들웨어가 없는 `/ranking` 29–31 ms로 차이가 측정되지 않는다. layout의 추가 쿼리는 `page > 1`일 때만 실행되고, page와 같은 `getCached` 키를 쓰므로 DB 중복 조회는 없다.
- **효과**: SPEC이 받아들였던 "스트리밍 리다이렉트(200 + meta refresh + 하이드레이션 뒤 전체 페이지 재로드)" 대신 진짜 **307**이 나온다. `/world`와 같은 동작이고, 크롤러·캐시·브라우저 히스토리 모두에 더 낫다. 클라이언트 내비게이션용으로 page.tsx의 검사도 남겨 두어 두 경로를 모두 커버한다. `?page=999&page=2`는 첫 값 기준으로 일관되게 처리된다(307 → 14).
- **부작용**: DB 장애 + `page > 1`이면 layout에서 throw가 나서 **세그먼트가 아닌 루트 `error.tsx`**가 잡고 HTTP 500을 반환한다(`/breaking?page=3` 500). 오류 화면 자체는 정직하므로 감점하지 않는다.

### (b) 미존재 리소스는 generateMetadata에서 `notFound()` → **승인**
- `/article/{12abc,abc,0,407,999999}`, `/nope`, `/xyz`, `/category/zzz`는 모두 HTTP **404**이고, 하이드레이션 뒤 `document.title`이 "페이지를 찾을 수 없습니다 | LiveNews"다. `article/[id]`·`[country]`에는 loading이 없어서 404가 유지된다. category는 layout이 404를 결정하고, generateMetadata는 제목 처리만 맡는다. SPEC의 `return {}`는 Generator 실측대로 루트 기본 제목으로 돌아가므로 SPEC 쪽이 틀렸다. S2 계약 D-5와도 맞는다. `React.cache`로 조회를 1회로 묶어 DB 이중 조회도 없다.
- 부수 관찰: DB 장애 중 `/article/1`은 generateMetadata가 throw해서 탭 제목이 빈 문자열이 된다(오류 화면 자체는 정상). 경미하며, S2 error.tsx 쪽 개선 사항이다.

---

## 3. "스크립트 오탐" 주장 검증 → **둘 다 오탐 맞음**
- **T4**: raw HTML에서 매칭된 "불러오는 중"은 `src/components/PageSkeleton.tsx:13`의 sr-only `뉴스를 불러오는 중입니다`(S2 loading 폴백)뿐이다. 소스 전체에서 이 문구가 나오는 곳은 이 하나다. 수정하지 않은 `/breaking`·`/ranking`에서도 동일하게 나온다. 브라우저 하이드레이션 뒤 `main` innerText에는 "불러오는 중"이 없고, `[aria-busy=true]`는 0개, 기사 링크는 60–90개, '새로고침'은 0건이다(`eval-s4-fp.js`). 옛 거짓 빈 상태(`<p …text-headline-sm>뉴스를 불러오는 중입니다</p>`)는 sr-only span이 아니므로, 수정한 판정식으로도 계속 잡힌다.
- **T11**: `?q=Federal&page=abc`에서 body의 '오류'는 Footer 면책 문구 "번역 과정에서 오류가 발생할 수 있으므로…" 1건뿐이다. `main`에는 '오류'가 없고 `role=alert`도 0개, 카드 60개, NaN 0, 페이지네이션 "1 2 3"이다. 다른 페이지 Footer에도 같은 문구가 있다.
- 조치: 스크래치패드의 `planner-s4-verify.js`를 고쳤다. T4는 S2 스켈레톤 sr-only 문구(HTML과 RSC 두 형태)를 제거한 뒤 검사하고, T11은 `main` 범위로 검사한다. 원본은 `planner-s4-verify.pre-eval.js`로 보존했다. 결과 **12/12**. S5 이후에는 이 수정본을 기준으로 쓴다.

---

## 4. 채점

**전체 판정**: 합격
**가중 점수**: 8.3 / 10.0

**항목별 점수**:
- 디자인 품질: 8/10 — 정직한 상태 화면(오류, 없음, 번역 준비 중)이 기존 다크 토큰 안에서 한 가지 문법으로 통일됐다. 관리자 오류 카드와 번역 상태 띠가 같은 2px accent 선을 쓴다. 감점 요인은 두 가지다. 관리자 기사 표의 국가·카테고리 열이 원시 코드(`global`, `ai-tech`)로 남아 대시보드(라벨 표시)와 어긋난다. 검색 오류 화면에 "0건"이 같이 나온다.
- 독창성: 8/10 — "편집자 노트" 톤의 번역 상태 띠와 데이터에서 결정되는 `원문 · 日本語` 오버라인이 이 프로젝트만의 특징이다. 스트리밍 리다이렉트 문제를 미들웨어 헤더와 layout 307로 푼 것, 탭 제목 문제를 generateMetadata notFound로 푼 것은 SPEC보다 나은 해법이다.
- 기술적 완성도: 8.5/10 — tsc 0, 테스트 106/106(두 TZ), 정책·파서·뷰 로직을 순수 함수로 분리했고, 헤더 위조를 막으며, `React.cache` 단일 조회와 nulls last 정렬을 쓴다. 감점 요인: 관리자 기사 국가 select가 `COUNTRIES` 대신 하드코딩 옵션이다(`admin/articles/page.tsx:131-136`). 검색 `Article.language` 타입이 SPEC과 다르다. `api/admin/sources/route.ts:94`에 `parseInt`가 남아 있다(계약 C, S4 대상 밖이지만 같은 API 계층).
- 기능성: 8.5/10 — 북마크로 연 관리자 화면, 비활성 기사 복구, 307 정규화, 404, 검색 재시도가 모두 직접 실행에서 동작했다. 감점은 검색 오류 상태의 "0건" 표시 1건.
- 회귀 안전: 9/10 — audit에서 새 회귀 0건(차이는 모두 의도된 변화), S3 8/8, S2 13/14(하네스 SKIP만), 금지 파일 diff 없음(신규 `AdminLoadError.tsx`만 추가), 루트 loading/Suspense 없음. 공개 크롬은 `/api/stats`만 사용(S2 T7 PASS). DB 픽스처 410건 보존(reseed 완료).

가중: 8×0.3 + 8×0.2 + 8.5×0.25 + 8.5×0.15 + 9×0.1 = 2.4 + 1.6 + 2.125 + 1.275 + 0.9 = **8.3**

---

## 5. 회귀 검증 · DB 장애 절차

- `redis flushall` 후 PG를 `stop -m fast`로 정지하고 브라우저(375px)로 확인했다:
  - `/` 500, `/world` 500, `/article/1` 500, `/japan` 500. `/breaking`·`/category/economy`·`/ranking`은 200(loading 경계 때문)이다. **모두 h1 "문제가 발생했습니다" + "다시 시도"가 나온다.** 거짓 "없음"이나 "아직 없습니다"는 0건이고, 'loading' 텍스트는 error.tsx 문구 "페이지를 불러오는 중 오류가…"뿐이다. `/api/articles`, `/api/articles/1`은 500(정직)이다.
  - `/search?q=Fed`: `role=alert` 오류와 재시도가 있지만 **"검색 결과: 0건"이 같이 표시된다**(개선 지시 1).
- `bash $SP/qa-env.sh status` → `pg: 410 articles`. 복구 뒤 `/world`, `/breaking`, `/article/1`, `/api/articles`는 모두 200이다.
- TypeScript 호환: tsc 0. 임포트 경로는 빌드 성공으로 확인했다. API 응답 형식은 바뀌지 않았다.
- 금지 파일: `git diff --stat HEAD~1 HEAD -- utils/constants/site/newsletter/layout.tsx/workers/prisma`는 빈 출력이다. `src/components`에는 신규 `AdminLoadError.tsx`만 추가됐다(SPEC 신규 목록에 있음). `src/app/loading.tsx`는 없고, 루트 Suspense도 없다.
- 데이터: 407 토글 실험은 원복한 뒤 `qa-env.sh reseed`(RESEEDED)까지 했다.

---

## 6. 구체적 개선 지시 (합격이지만 S5 진입 전에 반영하면 좋음, 재검수 불필요)

1. **`src/app/search/page.tsx:189-193`**: `q && (… 검색 결과: {total}건)`이 오류 상태와 로딩 상태에서도 렌더된다. 오류일 때는 "0건"(사실이 아님)이 나오고, 새 검색어로 로딩하는 동안에는 이전 검색어의 개수가 남는다. 이는 "정직한 상태" 원칙(SPEC 디자인 방향)에 어긋난다. 조건을 `q && !error && !loading`으로 바꿔라.
2. **`src/app/admin/articles/page.tsx:186-189`**: 국가·카테고리 열이 원시 코드(`global`, `ai-tech`)다. 대시보드(`admin/page.tsx:159,172`)처럼 `countryLabel(article.country)`, `categoryLabel(slug)`을 써라(라벨이 없으면 원시 값, NULL이면 '-'). 같은 파일 `:131-136`의 하드코딩 국가 옵션은 `COUNTRIES.filter(c => c.code !== 'all')`로 생성해 중복을 없애라.
3. **`src/app/search/page.tsx:17`**: SPEC 항목 10대로 `language: string | null`로 맞춰라(공개 API는 NULL을 반환할 수 있다).
4. (S5 참고) **`src/app/api/admin/sources/route.ts:94`**: `parseInt(String(id), 10)`이 남아 있다. 계약 C에 따라 `parseArticleId`와 같은 엄격한 정수 파서를 쓰거나, S5에서 API를 정리할 때 함께 바꿔라.
5. (도구) 앞으로는 `$SP/planner-s4-verify.js` 수정본(T4: 스켈레톤 sr-only 제외, T11: `main` 범위)을 기준으로 써라. 원본은 `planner-s4-verify.pre-eval.js`다.

**방향 판단**: 현재 방향 유지
