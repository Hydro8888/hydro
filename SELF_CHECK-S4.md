# 자체 점검 — 슬라이스 S4 (Round 5 · 결함 수정 라운드)

## SPEC 개선 항목 체크
- [x] 항목 1 (D12/D13/D14): `src/lib/auth-policy.ts`의 `requiresAuth`/`isValidBasicAuth`/`WWW_AUTHENTICATE`. 미들웨어는 이 정책 하나만 따르고, 모든 401(API·페이지)에 `Basic realm="Admin", charset="UTF-8"`을 붙인다. matcher는 `/api/admin/:path*`·`/api/collect[/…]`·`/api/articles[/…]`(`/api/stats` 없음). `GET/HEAD/OPTIONS /api/admin/health`는 **공개 유지**. `isPublicRead` 삭제.
- [x] 항목 2 (D15): `fetchAdminJson`(auth/server/network/invalid로 구분, AbortError는 다시 throw, `withBasePath`) + `AdminLoadError`(`role="alert"` + "다시 시도") + `AdminLoading`(`role="status"` + sr-only). 관리자 4개 화면 모두 loading/ready/error 상태를 쓰고, 오류일 때는 h1에 개수 `(N)`을 붙이지 않는다. 날짜는 `formatDate`(KST)로 표시하고, 대시보드의 국가/카테고리는 라벨로 보인다. `'/livenews/api'` 하드코딩 0건.
- [x] 항목 3: 신규 `GET /api/admin/articles?status=all|active|inactive&country=&page=&limit=`(비활성 포함, select로 목록 필드만, `createdAt desc, id desc`, 캐시 없음). 화면에 상태 필터를 넣고, "다음" 버튼은 `page < totalPages`일 때만 활성. 제목은 `getDisplayTitle`+`lang`, 미번역이면 "(미번역)". 비활성 기사는 링크 대신 텍스트로 보인다(공개 상세가 404이므로). `PATCH /api/articles/[id]`는 `parseArticleId`와 필드 타입을 검증하고(400), 성공하면 `invalidateCache('*')`.
- [x] 항목 4 (D8): 목록 페이지는 `parsePage` → `resolvePageRequest` → `redirect`. `queries.ts`의 주 목록 함수 5개는 DB 오류를 throw하고(→ error.tsx), 보조 함수 3개는 `[]`. 페이지 크기는 `ITEMS_PER_PAGE`/`BREAKING_ITEMS_PER_PAGE`. 거짓 "불러오는 중/새로고침" 빈 상태는 정직한 "아직 없습니다" 문구로 바꿨다(국가/카테고리는 "전체 속보 보기" 링크 포함).
  - **SPEC과 다른 점(사유 있음)**: `/breaking`·`/category/*`는 범위 초과 검사를 **세그먼트 layout**에서 한다(신규 `src/app/breaking/layout.tsx`, `category/[slug]/layout.tsx`에 추가). layout은 searchParams를 받지 못하므로 미들웨어가 쿼리 문자열을 `x-livenews-query` 요청 헤더로 넘겨 준다(이 경로들은 인증 없이 헤더만 넘김, 클라이언트 값은 항상 덮어씀). matcher에 `/breaking`, `/category/:path*`를 추가했다.
  - 이유(실측): page에서 `redirect()`를 하면 loading 경계 때문에 스트리밍 리다이렉트가 된다. 이 경우 Next 14.2는 `<meta id="__next-page-redirect" http-equiv=refresh>`를 넣고, 클라이언트 라우터가 `navigate-reducer`에서 이를 보고 **하이드레이션 뒤에 전체 페이지를 다시 로드**한다. 그러면 Playwright `goto(networkidle)`가 45초 동안 멈췄고, planner-s4-verify.js 전체가 T4에서 중단됐다. layout에서 하면 `/breaking?page=999`가 **HTTP 307 → ?page=14**, `/category/economy?page=50`이 **307 → ?page=2**가 된다(`/world`와 같은 동작). 클라이언트 내비게이션에서는 layout이 다시 실행되지 않으므로 page.tsx의 검사도 그대로 남겨 두었다. S2 loading.tsx는 수정하지 않았다.
- [x] 항목 5: API의 page/limit은 `parsePage`/`parseIntParam`으로 받는다(목록·검색·로그·관리자 기사). 정렬은 `publishedAt desc nulls last, id desc`(목록·검색·관련 기사). 상세 GET은 `parseArticleId`를 쓰고 형식 불량은 400, 범위 밖 숫자는 404, 비활성은 404(`findFirst isActive:true`).
- [x] 항목 6 (D9): `parseArticleId`, `isKnownCategorySlug`(CATEGORIES ∪ 모든 COUNTRY_SUBCATEGORIES, Set이라 `__proto__`는 false). `category/[slug]/layout.tsx`에서 slug를 검증해 404를 낸다. 기사 조회는 `React.cache` + `findFirst({isActive:true})`이고 DB 오류는 throw한다. 조회수는 page에서만 올린다. 제목 접미사를 지워 이중 브랜드를 없앴다. `search/layout.tsx`의 metadata는 '뉴스 검색'.
  - **SPEC과 다른 점(사유 있음)**: generateMetadata에서 기사·국가·카테고리가 없을 때 `return {}` 대신 **`notFound()`**를 호출한다(S2 계약 D-5가 허용한 방식). 실측 결과 `return {}`이면 RSC head가 루트 기본 제목을 쓰기 때문에 하이드레이션 뒤 탭 제목이 "LiveNews - 글로벌 라이브 뉴스"가 됐다(`/nope`는 `[country]`에 매칭되므로 동일). generateMetadata에서 notFound를 던지면 Next `MetadataTree`가 not-found.tsx의 metadata를 resolve하므로 탭 제목이 "페이지를 찾을 수 없습니다 | LiveNews"로 유지된다(T5 PASS). article/[id]와 [country]에는 loading이 없어 응답은 계속 HTTP 404이다. category의 404는 layout이 담당한다.
- [x] 항목 7 (D16): `getArticleView`(bodyMode 5종, titlePending/bodyPending, summary, original lang/label, 문단 분할)와 `languageLabel`. 마크업 계약은 다음과 같다: h1 `lang`, `data-translation-status="title-pending"`/`"body-pending"`(각자 별도 요소), 번역 상태 띠(`border-l-2 border-accent/60`), `<section aria-label="한국어 요약">`를 원문보다 먼저 배치, `<div data-original-body lang>` 머리의 "원문 · English/日本語/中文", translated 모드에서는 `<details>` 안에 넣고 summary는 "원문 보기 (언어)". 빈 본문 문구도 바꿨다.
- [x] 항목 8: 히어로를 `getArticleImageSources` + `categoryPrimary` + `sourceName`으로 바꿨다(alt 없음 = 장식). 배지는 `cn(bg,text,'border',borderAll)`. 카테고리는 알려진 slug만 링크하고, 라벨만 있는 slug(opinion)는 링크 없는 텍스트로, 원시 slug는 숨긴다. 날짜가 없으면 날짜·상대시간 항목을 그리지 않는다(`<time dateTime>`, 하단 출처 줄도 동일). 공유 제목은 `view.title.text`.
- [x] 항목 9: 홈 분배를 hero/sub/compact(8)/remaining으로 한 번에 나누고 `HOME_ARTICLE_COUNT=40`(캐시 키에 take 포함). sr-only h1을 넣고, 티커에 `language`를 넘긴다. 뉴스레터 section은 `NEWSLETTER_ENABLED`일 때만 렌더한다(홈·국가). `groupByCategory`를 제네릭으로 바꿔 `as any` 0건.
- [x] 항목 10: 검색은 `parsePage`, `withBasePath`. q가 비면 상태를 초기화하고, `retryKey`로 다시 시도한다. 범위 초과면 마지막 페이지로 `router.replace`. S3 `Pagination`에 `[page]` 패턴을 넘긴다. `language` 필드를 추가하고 label/htmlFor를 연결했다. 오류에는 `role="alert"`, 스피너에는 `role="status"`.
- [x] 항목 11: `normalizeRankingCountry`를 랭킹 조회와 탭 활성화에 쓴다. 관리자 통계 "오늘"은 `startOfKstDay(Date.now())` 기준.
- [x] 항목 12: `tests/auth-policy|routing|article-view|admin-fetch.test.ts`(node:test, 순수 모듈만 import). `npm test` **106 pass / 0 fail**(기존 81 + 신규 25), `TZ=America/Los_Angeles npm test`도 동일하게 pass.

## 수정 파일 목록
- `src/middleware.ts`: 정책 함수에 위임, 401에 WWW-Authenticate, matcher 정리, 목록 쿼리 헤더 전달.
- `src/lib/queries.ts`: 주 목록 함수는 throw, 페이지 크기는 상수, `getArticles(country, take)`, 제네릭 `groupByCategory`, 랭킹 정렬에 id 보조 키.
- `src/app/page.tsx`: 중복 제거, h1, 티커 lang, 뉴스레터 플래그, 빈 상태 문구, `as any` 제거.
- `src/app/[country]/page.tsx`, `src/app/breaking/page.tsx`, `src/app/category/[slug]/page.tsx`, `src/app/ranking/page.tsx`: parsePage/redirect, 정직한 빈 상태, 제목 접미사 제거, metadata notFound.
- `src/app/article/[id]/page.tsx`: 항목 5·6·7·8 전체.
- `src/app/search/page.tsx`: 항목 10.
- `src/app/admin/{page,sources/page,articles/page,logs/page}.tsx`: 항목 2·3.
- `src/app/api/articles/route.ts`, `api/search/route.ts`, `api/admin/logs/route.ts`: 파서와 nulls-last 정렬.
- `src/app/api/articles/[id]/route.ts`: id 검증, 비활성 404, PATCH 타입 검증과 캐시 무효화.
- `src/app/api/admin/stats/route.ts`: KST 기준 "오늘".
- 신규: `src/lib/{auth-policy,routing,article-view,admin-fetch}.ts`, `src/components/AdminLoadError.tsx`, `src/app/category/[slug]/layout.tsx`, `src/app/breaking/layout.tsx`(SPEC 외 — 항목 4 사유 참조), `src/app/search/layout.tsx`, `src/app/api/admin/articles/route.ts`, `tests/*.test.ts` 4개.
- 변경 없음(확인): utils/constants/site/newsletter/layout.tsx/components(기존)/workers/prisma — `git diff --stat` 빈 출력. 루트 loading.tsx 없음, 루트 Suspense 없음.

## 디자인 자체 평가
- AI slop 패턴 사용 여부: 없음. 새 색·그라데이션·이모지를 쓰지 않았고 기존 토큰만 사용했다.
- 독창적 요소: 번역 상태 띠(accent/60 2px 좌측선 + caption 한 줄)를 경고 박스가 아니라 편집자 노트 톤으로 표현했다. 원문 블록에는 `원문 · 日本語` 오버라인(언어는 데이터에서 결정)을 달고, 요약 블록에는 accent 오버라인 "요약"을 붙였다. 관리자 오류 박스도 같은 좌측선 언어를 쓴다.
- 다크 모던 테마 일관성: 유지. 관리자 오류/로딩은 `bg-surface-card border-border rounded-lg` 카드를 그대로 쓴다.

## 검증 결과 (현재 빌드 :4000)
- `npx tsc --noEmit` 통과, `npm test` 106/106 통과.
- `qa-env.sh restart` → `APP UP` (로그 `$SP/gen-s4-restart.log`).
- `node planner-s4-verify.js` → **10/12** (`$SP/gen-s4-verify.log`). 남은 FAIL 2건은 검증 스크립트의 오탐이다:
  - **T4**: `/breaking?page=abc`, `/category/economy?page=-2`, `/breaking?page=1.5`가 200을 반환하고 기사 링크가 31/21개 있다. 그런데 raw HTML에 S2 `PageSkeleton`의 sr-only 문구 `뉴스를 불러오는 중입니다`(loading.tsx 폴백, 스트리밍 HTML에 항상 포함)가 들어 있어 `/불러오는 중/`에 걸린다. 수정하지 않은 `/breaking`·`/ranking`에서도 똑같이 1회 나온다. S2 loading 유지 계약상 제거할 수 없다.
  - **T11**: `page=abc`에서도 결과 카드는 정상 표시된다. `document.body.innerText.includes('오류')`가 S2 Footer 면책 문구("번역 과정에서 **오류**가 발생할 수 있으므로…")에 매칭될 뿐이며, 모든 페이지에서 재현된다.
  - 위 두 판정만 바꾼 사본 `$SP/gen-s4-verify-adjusted.js`(원본은 수정하지 않음, `ADJUSTED` 주석 4곳) → **12/12** (`$SP/gen-s4-verify-adjusted.log`). Planner/Evaluator가 원본 스크립트를 고칠 것을 권장한다: T4는 `role="status"` 스켈레톤을 제외하고 검사하고, T11은 `main` 범위로 검사.
- `node planner-s3-verify.js` → **8/8** (T3: 393/356/1 모두 `band` — 외부망 차단으로 사진 없음).
- `node planner-s2-verify.js` → 13/14 (T3 하네스 미실행 SKIPPED만 FAIL, 제외 대상).
- `node audit.js s4-gen` vs `audit-s3-eval.json`: 관리자 화면 API 실패 요청 **6 → 0**, 깨진 이미지 0, 넘침 0. 차이는 모두 의도된 것이다: `cat-unknown`, `art-inactive`가 200에서 404로 바뀌었고(다른 404 페이지와 같은 S2 0-1 Pretendard `Event` 오류), `breaking-p999`는 p14로 이동해 p14에 원래 있던 픽스처 `/api/img`(cdn.example.com) 500 콘솔 1건을 그대로 가진다(S5 범위).
- curl: `/breaking?page=999` 307 → `?page=14`, `/category/economy?page=50` 307 → `?page=2`, `/world?page=999` 307 → `?page=6`. `/category/zzz`·`/nope`·`/article/{999999,407,12abc}`은 404이고 하이드레이션 뒤 탭 제목은 "페이지를 찾을 수 없습니다 | LiveNews". 소분류 11개는 전부 200. `/category/international-politics`는 "아직" 안내. 보호 API 401에 `WWW-Authenticate: Basic realm="Admin", charset="UTF-8"`. 무인증 `GET /api/admin/health`는 200. 관리자/공개 `articlesToday`는 일치.
- 수동: 407을 PATCH로 활성화하면 공개 GET이 200, 다시 비활성화하면 404가 되는 것을 확인했다. 잘못된 타입 PATCH는 400, 깨진 JSON도 400. 끝에 `qa-env.sh reseed`로 픽스처를 복원했다.
- 스크린샷(육안 확인): `peek/s4gen-src-0.jpg`(직접 진입, 소스 30개), `peek/s4gen-art-0.jpg`(기사 관리 (410), 필터 2개), `peek/s4gen-bodyuntr-0.jpg`(/article/356: 상태 띠 → 요약 → 원문), `peek/s4gen-echo-0.jpg`(/article/341: 영어 h1 + "제목 번역 준비 중").
- DB 장애 수동 절차(항목 4)는 Evaluator 전용이라 수행하지 않았다(PG는 건드리지 않음).

## 회귀 위험 확인
- 기존 기능 영향: 의도된 변경은 다음과 같다. ① `/api/admin/stats`·`/api/admin/logs` 비공개(공개 크롬은 S2 `/api/stats`만 사용, S2 T7 PASS). ② 비활성 기사 공개 상세·API 404. ③ 미지 카테고리 404. ④ 홈이 40건을 조회한다. 미들웨어가 `/breaking`·`/category/*`에서도 실행된다(헤더 전달만 하며 인증은 없음).
- TypeScript 오류: 없음.

## QA 피드백 반영 (QA_REPORT-S4 지시 1~4, 서버 재시작·커밋 없음)
- [x] 지시 1: `src/app/search/page.tsx`의 "검색 결과: N건"을 `q && !error && !loading`일 때만 표시하도록 바꿨다. 이제 로딩 중이나 오류 상태에서 "0건"이 보이지 않는다.
- [x] 지시 2: `src/app/admin/articles/page.tsx`의 국가·카테고리 열에 `countryLabel`/`categoryLabel`을 적용했다. 국가 필터 옵션은 `COUNTRIES`(all 제외)에서 생성한다.
- [x] 지시 3: `src/app/search/page.tsx`의 `language: string | null`로 바꿨다. `NewsCard`에는 `language ?? undefined`로 변환해 넘긴다. 이유는 S3 `types.ts`의 `language?: string`을 수정하지 않기 위해서다.
- [x] 지시 4: `src/app/api/admin/sources/route.ts`의 PUT에서 `parseInt`를 `parseArticleId`(양의 int32만 허용)로 바꿨다. `'12abc'`·`'1.5'`·`-1`·`0` 같은 잘못된 id는 400을 반환한다.
- 검증: `npx tsc --noEmit` 통과, `npm test` 106/106 통과. :4000 서버는 S5 Planner가 사용 중이라 재빌드하지 않았다. 따라서 런타임 확인은 다음 재시작 때 해야 한다.
