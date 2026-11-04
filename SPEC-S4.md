# S4 페이지 & UX 개선 설계서 (Round 5 · 결함 수정 라운드)

> 사용자 요청: "전체적으로 뉴스 번역이 잘안되고 있고 화면이 깨지는게 있어 모두 점검 하고 수정 하고 테스트까지 완료 해줘"
> 근거: `QA_BASELINE-R5.md`(D6·D8·D9·D12·D13·D14·D15·D16·D25), SPEC-S1/S2/S3 "슬라이스 간 계약", QA_REPORT-S1 지시 3·4, QA_REPORT-S2 지시 4, QA_REPORT-S3 지시 1, 코디네이터 추가 지시(S3 피드백 커밋 `36e5fa6`).
> **결함 수정 라운드**: 모든 항목은 결함 ID 또는 `파일:라인` 근거에 연결된다. 근거 없는 신규 기능·AI 기능은 넣지 않는다(planner.md 원칙 2는 이번 라운드 규칙으로 대체). DB 스키마 변경 없음.

```
SP=/tmp/claude-0/-home-user-hydro/0832edd1-f39e-53fc-97a8-a3a334add43a/scratchpad
B=http://127.0.0.1:4000/livenews
```

---

## 현재 상태 분석

### 장점 (유지)
- 모든 공개 목록 페이지가 서버 컴포넌트 + `force-dynamic`, 카드/페이지네이션/히어로는 S3 공용 컴포넌트(이미지 체인·모바일 페이지네이션)를 이미 사용 → 깨진 이미지 0, 페이지네이션 넘침 0(S3 QA).
- S2가 루트 Suspense/루트 loading을 제거해 `/nope`·`/article/999999`·`/article/abc`는 이미 HTTP 404.
- S1 전역 줄바꿈(`overflow-wrap:anywhere`) 덕분에 `/article/392`(긴 URL 제목) 320~1440px에서 문서 넘침 없음(T7에서 391/392/401/402 통과 확인). `text-headline-xl`은 유동(28→40px).
- 관리자 대시보드/로그 화면은 이미 `loadError`/`error` 상태를 가짐(`admin/page.tsx:80-86`, `admin/logs/page.tsx:80-81`) — 패턴을 나머지에 통일.

### 결함 (Planner 실측 — 현재 빌드 :4000, `node $SP/planner-s4-verify.js` → **0/12 PASS**, 로그 `$SP/planner-s4-verify-baseline.log`)

| ID | 근거 (파일:라인) | 실측 |
|---|---|---|
| **D12 치명** | `middleware.ts:23-29` API 401에 `WWW-Authenticate` 없음 | 새 컨텍스트(북마크 진입)로 `/admin/sources` → `401 GET /api/admin/sources`, h1 "소스 관리 (0)", 표 0행. `/admin/articles` 동일("기사 관리 (0)"). 비인증 curl 401 응답 헤더 `WWW-Authenticate` 공란(14개 보호 엔드포인트 전부) |
| **D13 높음** | `middleware.ts:47-62` matcher에 `/api/admin/logs` 없음, `:10-15` `isPublicRead`가 `/api/admin/stats` 공개 | 비인증 `GET /api/admin/logs` 200(수집 로그·에러 메시지 노출), `GET /api/admin/stats` 200 |
| **D14 중간** | matcher `'/api/articles/:path*'`가 목록 포함 + 메서드 무관 차단 | 비인증 `GET /api/articles`·`/api/articles/1`·`HEAD /api/articles` 모두 401 |
| **D15 중간** | `admin/sources/page.tsx:32-43`, `admin/articles/page.tsx:27-43` — `res.ok` 미확인, catch에서 빈 배열 | API 401/500 강제 시 "소스 관리 (0)"/"기사 관리 (0)" 빈 표, 오류 안내 없음. 대시보드/로그는 오류 문구는 있으나 `role=alert` 없음·401과 500 구분 없음·재시도 없음 |
| 관리자 기사 목록(신규 근거) | `admin/articles/page.tsx:33`이 공개 `GET /api/articles`(`api/articles/route.ts:21` `isActive:true` 고정) 사용 | 비활성 기사(픽스처 407)는 목록에 영영 안 나타남 → **비활성으로 바꾼 기사를 되돌릴 방법이 없음**. "다음" 버튼은 `articles.length < 30`로만 판정(`:126`) |
| **D8 중간** | `breaking/page.tsx:19`, `[country]/page.tsx:47`, `category/[slug]/page.tsx:28` `parseInt`; `queries.ts:84-87,108-111,190-193` DB 에러를 `{articles:[],total:0}`로 삼킴; 빈 상태 문구 `breaking/page.tsx:50-57`, `[country]/page.tsx:107-120`, `page.tsx:216-243` | `/breaking?page=abc`·`/world?page=abc` → "0개 · 뉴스를 불러오는 중입니다 · 새로고침"(거짓). `/breaking?page=999` → "406개" + 빈 화면 + "불러오는 중"·"새로고침" 4회. API: `/api/search?q=a&page=abc` **500**, 인증 `/api/articles?page=abc` **500** (`api/search/route.ts:12`, `api/articles/route.ts:12`, `api/admin/logs/route.ts:9` `Math.max(1, NaN)` = NaN) |
| **D9 중간** | `category/[slug]/page.tsx` 검증 없음; `[country]/page.tsx:30`, `article/[id]/page.tsx:17` `'Not Found - LiveNews'` | `/category/zzz`·`/category/quantum-weird-category` 200 + 제목 "zzz 뉴스 - LiveNews \| LiveNews". `/nope`·`/article/999999`의 하이드레이션 후 탭 제목 "Not Found - LiveNews \| LiveNews"(SSR은 정상 — S2 QA 0-1). `/article/12abc` 200(= 기사 12, `parseInt` 관대), `/article/407`(비활성) 200 공개 노출 |
| 제목 이중 브랜드 | 루트 `layout.tsx:14-16` template `'%s \| LiveNews'` + 각 페이지 `' - LiveNews'` | `<title>속보 - LiveNews \| LiveNews</title>`, 세계·카테고리·랭킹·기사 전부 동일. `/search` 제목 없음(기본값) |
| **D16 높음** | `article/[id]/page.tsx:143-169` 본문 체인 `contentKo → contentOriginal → summaryKo` | `/article/360`(본문 미번역, `summaryKo` 32자 존재): 한국어 요약 숨김, "원문 (번역 준비 중)" 아래 영어만(증거 `$SP/peek/m-bodyuntr-0.jpg`, 현재 `peek/planner-s4-a360-1.jpg`). `/article/341~355`(echo 제목): 영어 h1에 아무 상태 표시 없음(`peek/m-echo-0.jpg`). `/article/301~340`(titleKo NULL)도 동일 |
| D6 잔여 / S1 지시 3 | `article/[id]/page.tsx:72,123-125,150-160,173-185` | `/article/393`(일본어)·`/394`(중국어) h1 `lang` 없음 → 상속 `lang=ko`, `word-break: keep-all` → "日本銀行、/ 金融政策の現状維持を決定 / …" 절 단위 들쭉날쭉(현재 `peek/planner-s4-a393-0.jpg`). 원문 블록 `lang` 없음. "원문 보기 (English)"가 일본어/중국어 기사에도 하드코딩(`:179`) |
| S1 계약 C-6 / S3 계약 A | `article/[id]/page.tsx:96-100,106` | 배지 `catStyle.border.replace('border-l-','border-')`(동적 클래스 조합), 히어로가 `getDefaultImage`/`proxyImageUrl`로 직접 조합, `alt={title}` |
| 날짜 메타 빈 항목 | `article/[id]/page.tsx:111-115,192` | `/article/395`(publishedAt NULL): `formatDate`가 `''` → 빈 span, 시계 아이콘만 덩그러니(4개 뷰포트 모두) |
| 미지 카테고리 링크 | `article/[id]/page.tsx:88-90,105-108` | `/article/399`(`quantum-weird-category`): 배지 "quantum-weird-category" 원문 slug, 빵부스러기가 404 될 경로로 링크 |
| 홈 중복 | `page.tsx:84-88`(최신 뉴스 compact = `articles[3..10]`) vs `:31,34,52`(`remaining = articles.slice(3)` → 카테고리·최신 그리드) | 같은 기사가 compact 목록과 카테고리/최신 그리드에 중복 노출: id 4~11 (홈 30건 중 8건 2회) |
| 홈 h1 없음 | `page.tsx:72` 최상위가 h2 | SSR h1 0개(S2 계약 E: 페이지당 h1 1개) |
| 홈/국가 빈 section | `page.tsx:209-213`, `[country]/page.tsx:127-131` | 뉴스레터 플래그 off에서 `<section class="mt-12">` 빈 요소(S3 계약 A) |
| 홈 티커 lang | `page.tsx:61-65` | 매핑에 `language` 없음 → 미번역 제목 티커 `lang` 미적용(S3 계약 A) |
| 검색 결과 잔존 | `search/page.tsx:46-47` `if (!q) return;`가 상태 미초기화 | `/search?q=Federal` → 헤더 "검색" 클릭(`/search`) → "검색어를 입력해주세요" **아래에 이전 결과 20건이 그대로**(`$SP/planner-s4-search.js` T1) |
| 검색 재시도 멈춤 | `search/page.tsx:161` `setLoading(true); router.refresh()` — effect 의존성 불변이라 재요청 없음 | API 500 → "다시 시도" 클릭 → **"검색 중..." 스피너 영구**(3초 후에도 0건) |
| 검색 page=abc | `search/page.tsx:36,44,51` | `?page=abc` → API 500 → "검색 중 오류가 발생했습니다"(검색어는 정상인데 오류) |
| 랭킹 country 미검증 | `ranking/page.tsx:17` | `/ranking?country=xyz` → "랭킹 데이터가 없습니다" + 임의 Redis 키 `ranking:xyz` 생성 |
| API 상세 | `api/articles/[id]/route.ts:10,15-22` | `/api/articles/99999999999` → 500(Int 범위 초과 Prisma 에러), 비활성 407 → 200 공개, `PATCH {"isActive":"nope"}` → 500 |
| API 정렬 NULL 선두 | `api/articles/route.ts:28`, `api/search/route.ts:37`, `article/[id]/page.tsx:53` `publishedAt desc` | PostgreSQL DESC는 NULL 먼저 → `/api/articles?limit=5` 첫 행이 날짜 없는 픽스처 395 |
| 관리자 날짜 | `admin/page.tsx:208`, `admin/logs/page.tsx:118-119` `toLocaleString('ko-KR')` | 브라우저 TZ 의존 "2026. 10. 5. 오후 6:59:00"(S1 계약 표: `formatDate` 대체 권장) |
| 관리자 통계 "오늘" | `api/admin/stats/route.ts:11` 서버 로컬 자정 | 서버 TZ=UTC → KST 09시 기준으로 "오늘" 집계(공개 `/api/stats`는 S2가 KST로 수정) |
| 하드코딩 basePath | `admin/*.tsx`, `search/page.tsx:55` `'/livenews/api/…'` | S2 계약 A(`withBasePath`) 미준수 |

### 실측 메모 (Generator 참고)
- `/breaking`·`/category/[slug]`·`/ranking`에는 S2의 `loading.tsx`가 있다 → 그 아래 page에서 `redirect()`/throw하면 **응답은 이미 스트리밍 중이라 HTTP 200**(redirect는 클라이언트 리다이렉트로 처리, 에러는 error.tsx UI). 기능상 문제없고 S2 계약 D 때문에 loading을 지우지 말 것. `/[country]`는 loading이 없어 진짜 307/500.
- `/category/<slug>` 404는 **반드시 `category/[slug]/layout.tsx`에서** 검증(S2 실험 E: 같은 세그먼트 layout의 notFound는 그 아래 loading보다 먼저 → 404). page나 generateMetadata에서 notFound하면 200.
- 국가 페이지 소분류 필(`COUNTRY_SUBCATEGORIES`)은 `international-politics` 등 `CATEGORIES`에 없는 slug로 링크한다 → 검증 집합에 **반드시 포함**(빠뜨리면 `/world`의 필 5개가 전부 404).
- DB 실제 카테고리: 16개 표준 slug + `opinion` 1, NULL 1, `quantum-weird-category` 1(픽스처).

---

## 디자인 방향

- **기존 다크 모던 토큰만 사용**(surface/border/text/accent, `rounded-card`, `text-headline-*`, `text-caption`). 새 색·그라데이션·보라색 금지, AI slop(흰 카드·보라 그라데이션·이모지 남발) 금지.
- **정직한 상태 표시가 이번 슬라이스의 디자인 원칙**: "불러오는 중"은 실제로 로딩 중일 때만, "없음"은 정말 없을 때만, "오류"는 오류일 때만. 각 상태는 한 줄 제목 + 한 줄 설명 + (필요할 때만) 하나의 행동 버튼.
- **차별화 1 — 번역 상태 띠(translation status rail)**: 기사 상세에서 번역이 빠진 부분을 Reuters식 편집자 노트처럼 표시한다. 본문 위 얇은 좌측 2px `border-l` 강조선(카테고리 색이 아닌 `border-accent/60`) + `text-caption` 한 줄("본문 번역 준비 중 · 아래는 한국어 요약과 원문입니다"). 경고색(빨강)·배너 박스를 쓰지 않는다 — 결함이 아니라 편집 상태라는 톤.
- **차별화 2 — 원문 블록의 언어 라벨**: 원문 영역 머리에 `원문 · English`/`원문 · 日本語`/`원문 · 中文` 오버라인(`text-overline` 대문자 간격) — 언어를 하드코딩하지 않고 기사 `language`에서 결정.
- 관리자: 오류 상태는 표 자리에 같은 카드 박스(`bg-surface-card border border-border rounded-lg`) 안에 `role="alert"` 문구 + "다시 시도" 버튼. 표가 사라지고 "(0)"이 뜨는 일이 없게.

---

## 대상 파일 목록

수정:
- `src/middleware.ts`
- `src/lib/queries.ts`
- `src/app/page.tsx`, `src/app/[country]/page.tsx`, `src/app/article/[id]/page.tsx`, `src/app/breaking/page.tsx`, `src/app/category/[slug]/page.tsx`, `src/app/ranking/page.tsx`, `src/app/search/page.tsx`
- `src/app/admin/page.tsx`, `src/app/admin/sources/page.tsx`, `src/app/admin/articles/page.tsx`, `src/app/admin/logs/page.tsx`
- `src/app/api/articles/route.ts`, `src/app/api/articles/[id]/route.ts`, `src/app/api/search/route.ts`, `src/app/api/admin/logs/route.ts`, `src/app/api/admin/stats/route.ts`

신규:
- `src/lib/auth-policy.ts` — `requiresAuth`, `isValidBasicAuth`, `AUTH_REALM` (순수, `next/server` 의존 없음)
- `src/lib/routing.ts` — `parseArticleId`, `isKnownCategorySlug`, `resolvePageRequest`, `normalizeRankingCountry` (순수)
- `src/lib/article-view.ts` — `getArticleView`, `languageLabel` (순수)
- `src/lib/admin-fetch.ts` — `fetchAdminJson` (클라이언트, `fetch` 주입 가능)
- `src/components/AdminLoadError.tsx` — 관리자 공용 오류 박스 (client)
- `src/app/category/[slug]/layout.tsx` — slug 검증 후 `notFound()`
- `src/app/search/layout.tsx` — `metadata = { title: '뉴스 검색' }` (client page라 metadata를 여기서)
- `src/app/api/admin/articles/route.ts` — 관리자 기사 목록(비활성 포함, 인증)
- `tests/auth-policy.test.ts`, `tests/routing.test.ts`, `tests/article-view.test.ts`, `tests/admin-fetch.test.ts`

변경 금지: S1/S2/S3 파일(`utils.ts`, `constants.ts`, `globals.css`, `tailwind.config.ts`, `site.ts`, `newsletter.ts`, `layout.tsx`, `Header/Footer`, 컴포넌트 전부), `src/app/loading.tsx`(재생성 금지), 기존 `*/loading.tsx`, `not-found.tsx`, `error.tsx`, 워커(S5), `prisma/schema.prisma`.

---

## 개선 항목

### 항목 1 [P0 · D12/D13/D14]: 인증 정책을 순수 함수 `requiresAuth`로 분리 + 401에 `WWW-Authenticate`
- **대상 파일**: `src/lib/auth-policy.ts`(신규), `src/middleware.ts`, `tests/auth-policy.test.ts`(신규)
- **현재 문제**: API 401에 `WWW-Authenticate`가 없어 브라우저가 캐시된 관리자 자격증명을 `/api/admin/*`에 재전송하지 않음(경로가 `/livenews/admin/` 보호 공간 밖) → 북마크로 연 관리자 목록이 빈 표(D12). matcher가 경로를 나열식으로 관리해 `/api/admin/logs` 누락(D13), `/api/articles/:path*`는 GET까지 막음(D14). `isPublicRead`가 관리자 통계를 공개(S2 계약 B상 이제 불필요).
- **개선 방법**:
  ```ts
  // src/lib/auth-policy.ts  (next/server import 금지 — tsx 테스트에서 직접 import)
  export const AUTH_REALM = 'Admin';
  export const WWW_AUTHENTICATE = `Basic realm="${AUTH_REALM}", charset="UTF-8"`;
  /** pathname = basePath 제외 경로(request.nextUrl.pathname), method = 대문자 HTTP 메서드 */
  export function requiresAuth(pathname: string, method: string): boolean;
  /** 'Basic base64(user:pass)' 검증. 비밀번호의 ':' 허용(첫 ':' 기준 분리), 스킴 대소문자 무시 */
  export function isValidBasicAuth(header: string | null, user: string, pass: string): boolean;
  ```
  규칙(위에서부터 첫 일치):
  1. `/admin` 또는 `/admin/…` → `true`(모든 메서드)
  2. `/api/admin/health` → GET/HEAD/OPTIONS면 `false`(운영 배포 스크립트 무인증 헬스체크 — **공개 유지**), 그 외 `true`
  3. `/api/admin` 또는 `/api/admin/…` → `true`(모든 메서드 — logs·stats·clear-cache GET 포함, 신규 `/api/admin/articles`도 자동 보호)
  4. `/api/collect`(및 하위) → `true`
  5. `/api/articles` 또는 `/api/articles/…` → GET/HEAD/OPTIONS면 `false`, 그 외(PATCH/POST/PUT/DELETE) `true`
  6. 그 외 → `false` (`/api/stats`, `/api/search`, `/api/img` 등 공개)
  - 경로 비교는 세그먼트 단위: `/adminx`, `/api/adminx`, `/api/articlesfoo`는 일치하지 않음. 끝 `/` 하나는 무시.
  - `middleware.ts`: `if (!requiresAuth(pathname, method)) return NextResponse.next();` → 실패 시 **API와 페이지 모두** `WWW-Authenticate: WWW_AUTHENTICATE` 헤더. API는 `{ error: 'Authentication required' }` JSON 401, 페이지는 텍스트 401(현행 유지). `isPublicRead` 삭제. 자격증명은 `process.env.ADMIN_USER || 'admin'`, `ADMIN_PASS || 'livenews2026'`(현행 기본값 유지).
  - matcher: `['/admin', '/admin/:path*', '/api/admin/:path*', '/api/collect', '/api/collect/:path*', '/api/articles', '/api/articles/:path*']`. **`/api/stats`는 넣지 말 것**(S2 계약 B).
- **기대 효과**: 북마크 진입 관리자 화면이 브라우저 인증 캐시로 자동 재시도되어 데이터 표시. 관리자 로그·통계 비공개. 공개 조회 API 복구. 정책이 한 함수에 있어 단위 테스트로 고정.
- **검증 방법**:
  - `npm test` — `tests/auth-policy.test.ts` 표 케이스 최소: `('/admin','GET')→true`, `('/admin/sources','GET')→true`, `('/adminx','GET')→false`, `('/api/admin/logs','GET')→true`, `('/api/admin/stats','GET')→true`, `('/api/admin/health','GET')→false`, `('/api/admin/health','HEAD')→false`, `('/api/admin/health','POST')→true`, `('/api/admin/articles','GET')→true`, `('/api/articles','GET')→false`, `('/api/articles/1','HEAD')→false`, `('/api/articles/1','PATCH')→true`, `('/api/articles','POST')→true`, `('/api/collect','POST')→true`, `('/api/stats','GET')→false`, `('/api/search','GET')→false`, `('/api/articlesfoo','PATCH')→false`; `isValidBasicAuth`: 정상/잘못된 비번/`Bearer`/빈 값/`':'` 포함 비번/base64 깨짐 → false(throw 없음).
  - `node $SP/planner-s4-verify.js` **T1**(4개 관리자 페이지 새 컨텍스트 진입 → API 4xx 0건, 표 행 ≥ 기준), **T2**(14개 보호 엔드포인트 비인증 → 401 + `Basic realm="Admin"`; 인증 시 logs/stats 200), **T3**(공개 GET/HEAD 200, health/stats 200).
  - `curl -sI $B/api/admin/sources | grep -i www-authenticate` → `Basic realm="Admin"…`.
  - `node $SP/audit.js s4-eval` → `admin-*` 레코드의 `failed` 0건(현재 `401 GET …` 6건).

### 항목 2 [P0 · D15]: 관리자 화면의 정직한 로딩/오류 상태 (`fetchAdminJson` + `AdminLoadError`)
- **대상 파일**: `src/lib/admin-fetch.ts`(신규), `src/components/AdminLoadError.tsx`(신규), `src/app/admin/page.tsx`, `admin/sources/page.tsx`, `admin/articles/page.tsx`, `admin/logs/page.tsx`, `tests/admin-fetch.test.ts`
- **현재 문제**: `sources/page.tsx:35-39`, `articles/page.tsx:33-40`이 `res.ok`를 보지 않고 실패 시 빈 배열 → "소스 관리 (0)"(D15). 대시보드/로그는 문구만 있고 401과 500을 구분하지 않으며 재시도 불가, `role` 없음. 경로 하드코딩 `'/livenews/api/…'`.
- **개선 방법**:
  ```ts
  export type AdminFetchResult<T> =
    | { ok: true; data: T }
    | { ok: false; kind: 'auth' | 'server' | 'network' | 'invalid'; status?: number };
  export async function fetchAdminJson<T>(path: string, validate: (j: unknown) => j is T,
    init?: RequestInit, fetchImpl: typeof fetch = fetch): Promise<AdminFetchResult<T>>;
  // path는 '/api/...' (basePath 없이) → 내부에서 withBasePath(path)
  // 401/403 → 'auth', 그 외 !ok → 'server', fetch throw → 'network', JSON 파싱 실패/validate 실패 → 'invalid'
  // AbortError는 그대로 throw(호출부가 무시)
  ```
  - `AdminLoadError({ kind, onRetry })`: `<div role="alert">` + 문구 — auth: "관리자 인증이 필요합니다. 페이지를 새로고침해 다시 로그인하세요." / server·invalid: "데이터를 불러오지 못했습니다(서버 오류). 잠시 후 다시 시도하세요." / network: "네트워크 연결을 확인하세요." + "다시 시도" 버튼(`onRetry`).
  - 네 페이지 모두 상태를 `'loading' | 'ready' | 'error'`로 관리. **오류 시 h1에 개수 `(0)`을 붙이지 않는다**(예 "소스 관리"), 표 대신 `AdminLoadError`. 로딩 스피너는 `role="status"` + sr-only "불러오는 중".
  - 변경 요청(토글·저장·수집·번역 보정)은 현행 낙관적 갱신·롤백·alert 유지, 경로만 `withBasePath`.
  - 날짜: `admin/page.tsx:208`, `admin/logs/page.tsx:118-119`의 `toLocaleString('ko-KR')` → S1 `formatDate`(KST `YYYY.MM.DD HH:mm`). 대시보드 국가/카테고리 이름은 `countryLabel`/`categoryLabel`(현재 원시 코드 `global`, `ai-tech` 표시).
  - 요청 검증 함수(`isSourcesPayload` 등)는 배열/필수 숫자 필드만 확인하는 최소 가드.
- **기대 효과**: 인증 만료·서버 장애가 "데이터 0건"으로 위장되지 않음. 운영자가 원인(인증/서버/네트워크)을 바로 앎.
- **검증 방법**:
  - **T9**: 인증 컨텍스트에서 각 API를 401/500으로 강제 → 4개 화면 모두 `[role=alert]` 존재, h1에 `(0)` 없음, 스피너 0, 401 문구에 "인증" 포함.
  - `tests/admin-fetch.test.ts`: 가짜 fetch로 200+유효/200+무효 JSON/401/403/500/throw → 각 `kind` 단언, 요청 URL이 `/livenews/api/...`.
  - T8: 관리자 4파일에 `'/livenews/api` 문자열 0건, `toLocaleString('ko-KR')` 0건.

### 항목 3 [P0 · D15 연장 / 신규 근거]: 관리자 기사 목록 전용 API(비활성 포함) + 정확한 페이지 이동
- **대상 파일**: `src/app/api/admin/articles/route.ts`(신규), `src/app/admin/articles/page.tsx`, `src/app/api/articles/[id]/route.ts`
- **현재 문제**: 관리자 화면이 공개 API를 써 `isActive:true`만 받음 → 비활성 전환한 기사가 목록에서 사라져 되돌릴 수 없음(407). "다음" 판정이 `length < 30`. `PATCH`는 타입 검증이 없어 `{"isActive":"nope"}` → 500.
- **개선 방법**:
  - `GET /api/admin/articles?status=all|active|inactive&country=&page=&limit=` (matcher `/api/admin/:path*`로 자동 인증). `page = parsePage(...)`, `limit = parseIntParam(raw, {min:1,max:100,fallback:30})`, `status` 기본 `all`, `country`는 `COUNTRIES` 코드만 인정(그 외 무시). `orderBy: { createdAt: 'desc' }`(수집 순, NULL 없음) + `id desc` 보조. `select`로 목록 필드만(id, titleKo, titleOriginal, language, country, categoryPrimary, publishedAt, isActive, viewCount, source.sourceName) — 본문 제외. 응답 `{ articles, total, page, totalPages }`. 캐시 없음(관리자 화면은 즉시성).
  - 화면: 상태 필터 select(전체/활성/비활성) 추가 — 근거: 비활성 기사 복구 경로. "다음"은 `page < totalPages`. 제목은 `getDisplayTitle(article)` → `lang={t.lang}`(S3 계약 C-1), 미번역이면 제목 뒤 `text-caption text-text-muted` "(미번역)".
  - `PATCH /api/articles/[id]`: `parseArticleId`(항목 6)로 id 검증(형식 불량 400). 화이트리스트 각 필드 타입 검증 — `isActive` boolean, `tags` string[], 문자열 필드는 string|null; 위반 시 400 `{error}`. 성공 후 `invalidateCache('*')`(fix-translations와 동일 — 비활성화가 공개 목록 캐시 60s에 남지 않게).
- **기대 효과**: 비활성 기사도 찾아 복구 가능. 잘못된 요청은 400으로 명확.
- **검증 방법**: **T10**(`/api/admin/articles?status=inactive` 인증 200 + 407 포함 + 활성 행 없음, PATCH 잘못된 타입 400). 수동: `/admin/articles`에서 상태=비활성 선택 → 407 행 표시 → "비활성" 클릭 → 활성 전환 확인 → 다시 클릭해 원복(픽스처 보존).

### 항목 4 [P0 · D8]: 목록 페이지 `parsePage` + 범위 초과 처리 + "오류"와 "없음" 구분
- **대상 파일**: `src/lib/routing.ts`(신규 `resolvePageRequest`), `src/lib/queries.ts`, `src/app/breaking/page.tsx`, `src/app/[country]/page.tsx`, `src/app/category/[slug]/page.tsx`, `src/app/page.tsx`, `src/app/ranking/page.tsx`
- **현재 문제**: `parseInt('abc')` → NaN → Prisma skip NaN → `queries.ts` catch가 `{articles:[],total:0}` → "뉴스를 불러오는 중입니다 · 새로고침"(거짓). `?page=999`는 total>0인데 빈 화면 + 같은 거짓 문구. DB 장애와 "데이터 없음"이 같은 화면.
- **개선 방법**:
  ```ts
  // routing.ts
  export function resolvePageRequest(page: number, totalPages: number):
    { kind: 'ok' } | { kind: 'redirect'; page: number };
  // totalPages ≥ 1 && page > totalPages → redirect(totalPages). totalPages 0(데이터 없음)이면 page 1 외는 redirect(1). 그 외 ok.
  ```
  - 각 페이지: `const page = parsePage(searchParams.page)` (S1). 쿼리 후 `resolvePageRequest` → `redirect(`/breaking?page=${n}`)` (n=1이면 쿼리 없이 `/breaking`). `redirect`는 try/catch 밖에서 호출, basePath 수동 추가 금지(Next가 붙임 — S2 계약 A).
  - `queries.ts`: 하드코딩 20/30 → `ITEMS_PER_PAGE`/`BREAKING_ITEMS_PER_PAGE`(S1). **주 목록 함수**(`getArticles`, `getCountryArticles`, `getBreakingArticles`, `getCategoryArticles`, `getRankingArticles`)는 DB 에러를 삼키지 말고 로그 후 **throw** → 세그먼트 `error.tsx`(S2: h1 "문제가 발생했습니다" + 다시 시도). **보조 함수**(`getBreakingNews` 티커, `getCategoryCounts`, `getTrendingKeywords`)는 현행대로 `[]`(장식 요소라 홈 전체를 막지 않음). `getCached`는 빈 결과를 캐시하지 않으므로 그대로 사용.
  - 빈 상태(진짜 0건) 문구 교체 — "불러오는 중"·"새로고침" 버튼 **제거**: 홈 "아직 표시할 뉴스가 없습니다 / 새 기사가 수집되면 이곳에 표시됩니다", 속보 동일, 국가 "{label} 뉴스가 아직 없습니다" + "전체 속보 보기" 링크(`/breaking`), 카테고리 "{label} 분야 기사가 아직 없습니다" + 같은 링크, 랭킹 "아직 랭킹 데이터가 없습니다".
  - 홈 메인 쿼리 순서: `getArticles`가 throw하면 `error.tsx`. `Promise.all`은 보조 함수가 throw하지 않으므로 그대로 둬도 됨.
- **기대 효과**: 쓰레기 page → 1페이지, 범위 초과 → 마지막 페이지, DB 장애 → 정직한 오류 화면(+재시도), 진짜 0건 → "없음" 안내. 거짓 "불러오는 중" 0건.
- **검증 방법**:
  - **T4**: `?page=abc`/`-2`/`1.5` → 200 + 기사 링크 존재 + "불러오는 중" 없음. `/breaking?page=999` 최종 URL `page=14`, `/category/economy?page=50` → `page=2`, `/world?page=999` → **HTTP 307** `Location: /livenews/world?page=N`(loading 없음). 브레이킹/카테고리는 loading 경계 때문에 스트리밍 리다이렉트(최종 URL로 판정 — "실측 메모" 참조).
  - `tests/routing.test.ts`: `resolvePageRequest(1,0)` ok, `(2,0)` → 1, `(14,14)` ok, `(15,14)` → 14, `(999,14)` → 14.
  - **DB 오류 수동 검증**(Evaluator만, 끝나면 반드시 복구):
    ```
    redis-cli -p 6380 flushall
    runuser -u postgres -- /usr/lib/postgresql/16/bin/pg_ctl -D /var/lib/postgresql/livenews-qa/data stop -m fast
    curl -s -o /tmp/x.html -w '%{http_code}\n' $B/world      # 500, '문제가 발생했습니다' 포함, '불러오는 중' 없음
    curl -s $B/breaking | grep -c '불러오는 중'                # 0 (200이어도 error UI)
    bash $SP/qa-env.sh status                                  # ensure_pg가 PG 재기동
    curl -s -o /dev/null -w '%{http_code}\n' $B/world          # 200 복구
    ```
  - 진짜 0건: `curl -s $B/category/international-politics | grep -c '아직'` ≥1, `grep -c '새로고침'` 0.

### 항목 5 [P0 · D8 API]: API `page`/`limit` 파서 + NULL 날짜 정렬 + 상세 API id/비활성
- **대상 파일**: `src/app/api/articles/route.ts`, `src/app/api/search/route.ts`, `src/app/api/admin/logs/route.ts`, `src/app/api/articles/[id]/route.ts`, `src/app/article/[id]/page.tsx`(관련 기사 정렬)
- **현재 문제**: `Math.max(1, parseInt('abc'))` = NaN → 500(`/api/search?q=a&page=abc`). `publishedAt desc`가 NULL을 먼저 둠. `/api/articles/99999999999` 500, 비활성 기사 공개 API로 열람 가능.
- **개선 방법**: `page = parsePage(searchParams.get('page'))`, `limit = parseIntParam(searchParams.get('limit'), {min:1, max:100, fallback:20})`(logs는 fallback 50). 정렬 `orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }]`(Prisma 5 지원). 상세 GET: `parseArticleId` → null이면 형식 오류 400(`'abc'`), 범위 밖 숫자(`99999999999`)는 404; `where: { id, isActive: true }`(`findFirst`) → 없으면 404. 응답 형식·필드 불변(API 호환).
- **기대 효과**: 어떤 쿼리 문자열로도 500이 나지 않음, 목록 첫 행이 날짜 없는 기사가 되지 않음.
- **검증 방법**: **T3**(407 → 404, abc → 400, 99999999999 → 404), **T4** API 5종 200, **T10** `/api/articles?limit=5`에 `publishedAt:null` 없음. `curl -s "$B/api/search?q=Federal&page=99999999999"` → 200 `{articles:[]}`.

### 항목 6 [P0 · D9]: 남은 soft-404 제거 + 404 탭 제목 + 제목 이중 브랜드 제거
- **대상 파일**: `src/lib/routing.ts`(`parseArticleId`, `isKnownCategorySlug`), `src/app/category/[slug]/layout.tsx`(신규), `src/app/category/[slug]/page.tsx`, `src/app/[country]/page.tsx`, `src/app/article/[id]/page.tsx`, `src/app/breaking/page.tsx`, `src/app/ranking/page.tsx`, `src/app/search/layout.tsx`(신규)
- **현재 문제**: `/category/zzz` 200. `/article/12abc`=기사 12, `/article/407`(비활성) 공개. generateMetadata의 `'Not Found - LiveNews'`가 하이드레이션 후 탭 제목을 덮음(S2 QA 지시 4). 모든 제목이 "… - LiveNews | LiveNews".
- **개선 방법**:
  ```ts
  export function parseArticleId(raw: unknown): number | null; // /^\d{1,10}$/ && 1 ≤ n ≤ 2_147_483_647, 그 외 null ('0','12abc','-1',' 1','1.0' → null)
  export function isKnownCategorySlug(slug: unknown): boolean;  // CATEGORIES ∪ 모든 COUNTRY_SUBCATEGORIES slug (자체 소유 체크, '__proto__' false)
  ```
  - `category/[slug]/layout.tsx`: `if (!isKnownCategorySlug(params.slug)) notFound(); return children;` (DB 불필요, S2 계약 D-4). **loading.tsx는 그대로**.
  - `article/[id]/page.tsx`: `parseArticleId(params.id)` null → `notFound()`. 조회 `findFirst({ where: { id, isActive: true }, include: { source: true } })`를 `React.cache`로 감싸 metadata와 page가 1회만 조회. 조회수 증가는 page에서만(활성 기사만). DB 에러는 삼키지 말고 throw(→ error.tsx; 지금은 DB 장애가 404로 위장됨 `:36-38`).
  - generateMetadata: 미존재/비활성/형식 불량 → **`return {}`**(제목 미지정 → not-found.tsx 제목 유지). `'Not Found - LiveNews'` 문자열 삭제(`[country]`도). 기사 제목은 `getDisplayTitle(article).text`, description은 `summaryKo` 우선(공백이면 원제목).
  - 제목 접미사 삭제(템플릿이 붙임): `'속보'`, `'${label} 뉴스'`, `'랭킹'`, 기사 `t.text`. `search/layout.tsx`: `export const metadata = { title: '뉴스 검색' }; export default function L({children}) { return children; }` (notFound 없음 → S2 계약 D 무관).
- **기대 효과**: 모든 미존재 경로가 HTTP 404 + 탭 제목 "페이지를 찾을 수 없습니다 | LiveNews" 유지. 탭 제목 "속보 | LiveNews".
- **검증 방법**: **T5**(10개 경로 상태 코드, 하이드레이션 후 `document.title` 4건, 페이지 제목 5건 정확 일치, 기사 제목 'LiveNews' 1회). `tests/routing.test.ts`: `parseArticleId` 경계(`'1'`,`'2147483647'`→값, `'2147483648'`,`'0'`,`'12abc'`,`'abc'`,`''`,`['5']`(배열은 첫 요소 허용 여부 명시: 허용) 등), `isKnownCategorySlug('international-politics')`→true, `('zzz')`/`('__proto__')`/`(undefined)`→false. 회귀: `/world`의 소분류 필 5개 링크 각각 200(`curl` 루프).

### 항목 7 [P0 · D16]: 번역 상태를 숨기지 않는 기사 본문 (`getArticleView`)
- **대상 파일**: `src/lib/article-view.ts`(신규), `src/app/article/[id]/page.tsx`, `tests/article-view.test.ts`
- **현재 문제**: `page.tsx:143-169` — `contentKo`가 없고 `contentOriginal`이 있으면 영어 원문만, DB의 `summaryKo`는 표시 안 됨. 제목 미번역(NULL/echo)이어도 상태 안내 없음(`:72`가 `titleKo || titleOriginal` → echo는 그대로 영어). 원문 라벨 "English" 하드코딩.
- **개선 방법**:
  ```ts
  export type BodyMode = 'translated' | 'summary+original' | 'original' | 'summary' | 'empty';
  export function languageLabel(lang: string | null | undefined): string; // en→English, ja→日本語, zh→中文, ko→한국어, 그 외/없음→'원문'
  export function getArticleView(a: { titleKo; titleOriginal; language; summaryKo; contentKo; contentOriginal }): {
    title: { text: string; lang: string | undefined; isTranslated: boolean };   // = getDisplayTitle(a)
    titlePending: boolean;      // !title.isTranslated && toLangTag(language) !== 'ko'
    bodyMode: BodyMode;         // contentKo(공백 아님) → translated; 없고 summaryKo+contentOriginal → summary+original;
                                // contentOriginal만 → original; summaryKo만 → summary; 아무것도 없음 → empty
    bodyPending: boolean;       // bodyMode ∈ {summary+original, original, summary}이고 language가 ko가 아님
    summary: string | null;     // trim된 summaryKo (빈 문자열 → null)
    originalLang: string | undefined;   // toLangTag(language)
    originalLabel: string;      // languageLabel(language)
    paragraphs(text): string[]  // 또는 별도 export splitParagraphs: '\n' 분할, trim, 빈 줄 제거
  };
  ```
  렌더링(마크업 계약 — 검증 스크립트가 사용):
  - h1: `<h1 lang={view.title.lang} className="text-headline-xl leading-tight text-text mb-3">{view.title.text}</h1>`.
  - `titlePending`이면 h1 바로 아래 `<p data-translation-status="title-pending" className="text-caption text-text-muted …">제목 번역 준비 중 · 원문 제목을 표시합니다</p>`. 번역된 경우만 원제목 보조줄(`:128-132`)을 `lang={view.originalLang}`로.
  - `bodyPending`이면 본문 위 번역 상태 띠: `<div data-translation-status="body-pending" className="border-l-2 border-accent/60 pl-3 text-caption text-text-secondary">`. 제목도 미번역이면 같은 요소에 `data-translation-status="title-pending body-pending"`을 쓰지 말고 각자 하나씩(토큰 검사 `~=` 사용).
    - 문구: summary+original → "본문 번역 준비 중 · 한국어 요약과 원문을 먼저 제공합니다", original → "본문 번역 준비 중 · 원문을 표시합니다", summary → "본문 번역 준비 중 · 한국어 요약만 제공됩니다".
  - summary+original / summary: 먼저 `<section aria-label="한국어 요약">` 오버라인 "요약" + 요약 문단(본문 크기). 그 다음 원문.
  - 원문 블록(모든 모드 공통): `<div data-original-body lang={view.originalLang}>` 머리 오버라인 `원문 · {originalLabel}`, 문단들. **translated 모드에서는 `<details>` 안에** 두고 summary 텍스트 "원문 보기 ({originalLabel})"(하드코딩 English 제거). summary+original / original 모드에서는 펼친 상태.
  - empty: "기사 본문을 준비 중입니다." 대신 "본문이 제공되지 않는 기사입니다 · 아래 '원문 보기'로 원문 사이트에서 확인하세요".
  - 잘린 번역(381~390)은 S4에서 판정하지 않음 — S5가 `contentKo`를 NULL로 되돌리면 자동으로 body-pending 경로(계약 참조).
- **기대 효과**: 본문 미번역 25건(356~380)에서 한국어 요약이 맨 먼저 보임, 제목 미번역 55건(301~355)과 중·일 기사에 상태가 표시됨, 원문 언어가 정확히 표시·`lang` 적용.
- **검증 방법**: **T6**(`/article/360`: 요약 텍스트 위치 < 원문 위치, 원문 `lang=en`, body-pending 존재; `/393`·`/394`: h1·원문 `lang` ja/zh + computed `word-break: normal`(S1 지시 3) + 두 상태 표시; `/301`·`/345`: title-pending + h1 `lang=en`; `/article/1`: 상태 표시 없음, `<details>` 안 원문 `lang=en`, h1 `lang=ko`). `tests/article-view.test.ts`: 5개 bodyMode, echo 제목 → titlePending, `language:'ko'` 기사는 pending false, 공백만 있는 contentKo → 미번역, languageLabel 표. 스크린샷: `node $SP/peek.js mobile /article/360 peek/s4-eval-360 2`, `/article/393`, `/article/345`.

### 항목 8 [P1 · D6 잔여 / S1 C-6 / S3 계약 A·C / 코디네이터 지시]: 기사 상세 머리 정리
- **대상 파일**: `src/app/article/[id]/page.tsx`
- **현재 문제**: 히어로 소스 직접 조합 + `alt={title}`(`:96-100`), 배지 동적 클래스(`:106`), 날짜 NULL이면 빈 span·아이콘만(`:111-115,192`), 미지 카테고리 원시 slug·404 링크(`:88-90,105`), 공유 제목이 echo 영어(`:136`).
- **개선 방법**:
  - 히어로: `<ArticleHeroImage sources={getArticleImageSources(article)} categoryPrimary={article.categoryPrimary} sourceName={article.source.sourceName} />` (alt 생략 = 장식, S3 `36e5fa6`: 실패 시 `data-no-image` 3:1/4:1 띠 + 카테고리 색 라인 + 출처 워드마크). 감싸는 div의 `rounded-card overflow-hidden shadow-elevated bg-surface-elevated` 유지 가능. `getDefaultImage`/`proxyImageUrl`/`isValidArticleImage`/`normalizeImageUrl` import 제거.
  - 배지: `cn(catStyle.bg, catStyle.text, 'border', catStyle.borderAll, …)`.
  - 카테고리: `isKnownCategorySlug(slug)`일 때만 빵부스러기 링크·배지 라벨 `categoryLabel`. 그 외(`opinion`, 미지 slug)는 `categoryLabel(slug) !== slug`이면 링크 없는 라벨만, 원시 slug면 표시하지 않음.
  - 날짜: `formatDate(article.publishedAt)`가 `''`면 날짜·상대시간 항목 자체를 렌더하지 않음. 렌더할 때는 `<time dateTime={toIsoDateTime(d)}>`(서버 컴포넌트, S3 계약 C-2). 하단 출처 줄도 동일.
  - 공유: `<ShareButtons url={article.originalUrl} title={view.title.text} />`(URL은 현행 유지 — S3 계약 A "S4 결정": 이번 라운드는 결함 근거 없음).
  - 태그·저자: 데이터 텍스트에 `whitespace-nowrap`/`break-all` 금지(S1 규칙) — 현행 유지 확인.
- **기대 효과**: S1/S3 계약 이행, 이미지 없는 기사 상단 대형 빈 박스 제거, 빈 메타 아이콘 제거.
- **검증 방법**: **T7**(320/375/768/1440 × 391·392·401·402·395: 문서 넘침 0, h1 오른쪽 ≤ 뷰포트, 375 이하 h1 ≤ 30px, 아이콘만 있는 빈 메타 0, `/article/1` 날짜 `YYYY.MM.DD HH:mm`·AM/PM 없음), **T8**(소스 계약 grep). **S3 회귀 도구**: `node $SP/planner-s3-verify.js` **8/8 유지** — T3 기대값은 코디네이터 지시대로 갱신됨(실사진 16:10·2:1, `[data-no-image]`면 3:1·4:1; Planner가 스크래치패드에서 수정, 원본 `planner-s3-verify.orig.js`). 재빌드 후 `/article/393`(이미지 없음, 외부망 차단)이 `band`로 판정되는지 출력 괄호 안에서 확인. 육안: `node $SP/peek.js mobile /article/393 peek/s4-eval-393 1`에서 띠 + 출처 워드마크.

### 항목 9 [P1 · S3 계약 A / S2 계약 E / 신규 근거]: 홈·국가 페이지 정리
- **대상 파일**: `src/app/page.tsx`, `src/app/[country]/page.tsx`, `src/lib/queries.ts`
- **현재 문제**: 홈 compact "최신 뉴스"(`page.tsx:84-88`)와 카테고리/최신 그리드(`:31,34,52`)가 `articles[3..10]`을 중복 노출. h1 없음. 티커 매핑에 `language` 없음(`:61-65`). 뉴스레터 빈 section(`:209-213`, `[country]:127-131`). `as any` 캐스트(`:47,159,167-168`).
- **개선 방법**:
  - 홈 분배를 한 번에: `hero = a[0]`, `subHeroes = a[1..2]`, `listItems = a[3..10]`, `remaining = a.slice(3 + listItems.length)` → 카테고리 섹션·최신 그리드는 `remaining`에서만. 섹션 수 유지를 위해 `getArticles` take 30 → 40(`HOME_ARTICLE_COUNT` 지역 상수, 근거: 중복 제거로 줄어드는 8건 보충).
  - 최상단에 `<h1 className="sr-only">LiveNews 주요 뉴스</h1>`(시각 변화 없음).
  - 티커: `{ id: String(a.id), titleKo: a.titleKo, titleOriginal: a.titleOriginal, language: a.language }`.
  - `{NEWSLETTER_ENABLED && articles.length > 0 && (<section className="mt-12"><NewsletterBanner /></section>)}` — 홈·국가 둘 다(`@/lib/newsletter`). 배너 경로 목록 변경 없음(S2 계약 C).
  - `as any` 제거: `groupByCategory`를 제네릭으로(`<T extends { categoryPrimary: string | null }>(articles: T[]) => Record<string, T[]>`) 바꿔 타입 유지.
  - 국가: 항목 4·6 적용(parsePage, redirect, 빈 상태, metadata), `COUNTRY_CONFIG` 미존재 → `notFound()` 유지(loading 추가 금지).
- **기대 효과**: 홈에서 기사 1건은 한 번만, 스크린리더 문서 구조 정상, 티커 원문 제목 줄바꿈 정상, 빈 여백 제거.
- **검증 방법**: **T12**(홈 h1=1, 최상위 section 간 기사 id 중복 0, 빈 section 0), **T8**(`language: a.language`, `NEWSLETTER_ENABLED`, `as any` 0). `node $SP/planner-s3-verify.js` T5(티커 포함 CJK lang) 유지.

### 항목 10 [P1 · 신규 근거]: 검색 페이지 상태 버그 3건 + 파라미터
- **대상 파일**: `src/app/search/page.tsx`, `src/app/search/layout.tsx`(항목 6)
- **현재 문제**(실측 `$SP/planner-s4-search.js`): ① `q`가 비면 effect가 return만 해 이전 결과 20건이 "검색어를 입력해주세요" 아래 남음, ② "다시 시도"가 `router.refresh()`라 재요청이 없어 스피너 영구, ③ `?page=abc` → API 500 → 오류 화면. 경로 하드코딩, 자체 페이지네이션(이전/다음만)·NaN 위험, 필터 select에 연결된 label 없음.
- **개선 방법**:
  - `const page = parsePage(searchParams.get('page'))`; API 호출에 정규화된 `String(page)` 사용. `fetch(withBasePath('/api/search?…'))`.
  - `if (!q) { setArticles([]); setTotal(0); setTotalPages(0); setError(false); setLoading(false); return; }`.
  - `const [retryKey, setRetryKey] = useState(0)`를 effect 의존성에 추가, "다시 시도"는 `setRetryKey(k => k + 1)`.
  - 결과 후 `total > 0 && page > totalPages`면 `router.replace(마지막 페이지 URL)`.
  - 페이지네이션은 S3 `Pagination`(`basePath`에 `[page]` 자리 포함: `/search?q=…&country=…&category=…&page=[page]`, 쿼리 값은 `URLSearchParams`로 인코딩) — 모바일 넘침 안전 보장 재사용.
  - `interface Article`에 `language: string | null` 추가(카드 `lang` 정확성). 필터: `<label htmlFor="search-country">국가</label>` 등.
  - 오류 화면 문구는 유지하되 `role="alert"`.
- **기대 효과**: 검색 화면이 상태와 일치. 재시도 실제 동작.
- **검증 방법**: **T11**(이전 결과 잔존 0, 실패 후 재시도 → 스피너 없음·결과 표시, `page=abc` → 오류 없음·결과 표시·NaN 없음). `node $SP/planner-s3-verify.js` T4는 검색 페이지 미포함 → 수동 `node $SP/peek.js mobile "/search?q=a&page=2" peek/s4-eval-search 1`로 페이지네이션 한 줄 확인.

### 항목 11 [P2 · 신규 근거]: 랭킹 country 검증 + 관리자 통계 "오늘" KST
- **대상 파일**: `src/lib/routing.ts`(`normalizeRankingCountry`), `src/app/ranking/page.tsx`, `src/app/api/admin/stats/route.ts`
- **현재 문제**: `/ranking?country=xyz` → 빈 화면 + 임의 캐시 키. 관리자 "오늘 수집"이 서버 로컬(UTC) 자정 기준(`api/admin/stats/route.ts:11`).
- **개선 방법**: `normalizeRankingCountry(raw): 'all'|'global'|'us'|'japan'|'china'` — `COUNTRIES` 코드만, 그 외(배열은 첫 요소) `'all'`. 랭킹 페이지는 정규화 값으로 조회·탭 활성화. 관리자 통계 `startOfToday` → S2 `startOfKstDay(Date.now())`(`@/lib/site`).
- **기대 효과**: 잘못된 링크에도 랭킹 표시, 공개/관리자 "오늘" 기준 일치(KST).
- **검증 방법**: **T12**(`/ranking?country=xyz` 200 + 기사 링크). `tests/routing.test.ts` 표. `curl -s -u admin:livenews2026 $B/api/admin/stats | jq .articlesToday` == `curl -s $B/api/stats | jq .articlesToday`(같은 60초 창에서, 캐시 flush 후).

### 항목 12 [P1 · D25]: 순수 로직 단위 테스트
- **대상 파일**: `tests/auth-policy.test.ts`, `tests/routing.test.ts`, `tests/article-view.test.ts`, `tests/admin-fetch.test.ts`
- **개선 방법**: `node:test` + `node:assert/strict`(기존 테스트와 동일 스타일, `npm test` = `tsx --test tests/*.test.ts`). 각 파일은 위 항목의 표 케이스를 포함. 테스트 대상 모듈은 `next/*`·Prisma·React import 금지(그래서 정책/파서/뷰 로직을 `src/lib/*`로 분리).
- **검증 방법**: `npm test` 전부 pass(기존 81+ 유지 + 신규), `TZ=America/Los_Angeles npm test` 동일. 변이 확인(선택): `requiresAuth`의 health 예외를 지우면 테스트 실패해야 함.

---

## 범위 밖 (S4에서 하지 말 것)
- 번역 품질·백필·잘린 번역 복구·echo 제목 재번역(D17~D21) → **S5**. S4는 현재 데이터 상태를 정직하게 표시만.
- `/api/admin/health` 응답 내용 변경(D23), `/api/img` SSRF(D24) → S5.
- 국가 소분류 slug(`international-politics` 등)에 기사가 0건인 문제 — 분류기 slug 체계(S5) 문제. S4는 404로 만들지 않고 "아직 없습니다" 안내만.
- 공유 URL을 우리 기사 URL로 바꾸기, Pretendard 자체 호스팅(S2 지시 5) — 결함 근거 부족/우선순위 낮음.
- `loading.tsx` 추가·삭제, 루트 레이아웃 변경.

---

## Evaluator 검증 절차 (요약)
```
bash $SP/qa-env.sh restart > $SP/s4-eval-restart.log 2>&1; tail -2 $SP/s4-eval-restart.log   # APP UP
cd /home/user/hydro && npx tsc --noEmit && npm test
cd $SP && node planner-s4-verify.js        # 기준선 0/12 → 목표 12/12
cd $SP && node planner-s3-verify.js        # 8/8 유지 (T3 기대값 갱신본: photo 16:10·2:1 / [data-no-image] 3:1·4:1)
cd $SP && node audit.js s4-eval && node eval-s1-compare.js s3-eval s4-eval
  # 기대: admin-sources/admin-articles의 401 실패 요청 소멸, 신규 OVERFLOW 0, 신규 콘솔/페이지 오류 0
  # 의도된 변화: cat-unknown·art-inactive 200→404, breaking-p999 → p14, breaking-p-garbage → p1 목록
for s in international-politics war-diplomacy global-economy climate international-society bigtech industry policy technology trade international; do printf "%s " $s; curl -s -o /dev/null -w '%{http_code}\n' $B/category/$s; done   # 전부 200
# DB 오류 vs 데이터 없음: 항목 4의 수동 절차 (반드시 PG 복구)
# 관리자 수동: /admin/articles 상태=비활성 → 407 표시 → 토글 2회(원복)
git diff --stat HEAD -- src/lib/utils.ts src/lib/constants.ts src/lib/site.ts src/lib/newsletter.ts src/app/layout.tsx src/components src/workers prisma   # 빈 출력
ls src/app/loading.tsx 2>/dev/null; grep -n Suspense src/app/layout.tsx   # 둘 다 없음
```
스크린샷(육안): `peek.js mobile /article/360`, `/article/393`, `/article/345`, `/article/395`, `/`(홈 중복 제거 후), `peek.js desktop /admin/articles … admin`.

---

## 슬라이스 간 계약

S4가 제공하고 S5(백엔드 & 프로세스)가 알아야 하는 것. S1·S2·S3 계약은 그대로 유효.

### A. 번역 상태 표시가 기대하는 데이터 (S5 필수 준수)
| 필드 | S4 판정 | S5가 지킬 것 |
|---|---|---|
| `titleKo` | NULL·공백·`titleOriginal`과 동일(trim) → **제목 미번역**(`title-pending`, 원제목 + `lang`) — S1 `getDisplayTitle` | 번역 실패 시 영어 원문을 `titleKo`에 넣지 말 것(NULL 유지). echo로 저장된 기존 행(341~355)은 백필 대상에 포함해 재번역 또는 NULL로 정리(D17) |
| `contentKo` | NULL·공백 → **본문 미번역**(`body-pending`). 값이 있으면 **완성 번역으로 간주해 그대로 본문 표시**(길이 비교 안 함) | 잘린 번역(D19 `finish_reason:'length'`, D21 픽스처 381~390)은 **저장하지 않거나 NULL로 되돌릴 것** — 그래야 S4가 "요약 + 원문"으로 정직하게 표시. 부분 번역을 완성본처럼 저장하면 S4는 구분 불가 |
| `summaryKo` | trim 후 비어 있지 않으면 본문 미번역 시 **맨 먼저 표시** | 한국어로만 저장(영어 echo 금지). 본문 번역이 실패해도 요약은 독립적으로 채울 것 |
| `contentOriginal` | 원문 블록(`data-original-body`, `lang=toLangTag(language)`) | 단락 구분은 `\n`(S4가 `\n` 분할·빈 줄 제거) |
| `language` | `toLangTag` → `lang` 속성, `languageLabel` → "English/日本語/中文" | 소문자 BCP-47 기본 태그(`en`,`ja`,`zh`,`ko`)로 저장. `'english'` 같은 값은 `lang` 미적용 |
| `isActive` | false → 공개 상세·공개 API 404, 공개 목록 제외. 관리자 `/api/admin/articles`에는 표시 | 수집기가 비활성 기사를 덮어써 재활성하지 않을 것 |
| `publishedAt` | NULL 허용(날짜 항목 생략, 정렬 시 마지막) | 파싱 실패 시 NULL(가짜 현재 시각 금지) |
- 캐시: 공개 목록은 `getCached` 30~120초. 번역 백필 후 `invalidateCache('*')`(현행 `fix-translations`) 유지. 기사 상세는 캐시 없음(즉시 반영).

### B. 인증 정책 (`@/lib/auth-policy`)
- `requiresAuth(pathname, method)`가 단일 기준. **`/api/admin/**`는 전부 인증**(신규 라우트 자동 보호) — 예외는 `GET/HEAD /api/admin/health`뿐(공개, 운영 무인증 헬스체크). S5가 health에 번역 커버리지(D23)를 추가할 때 **공개 응답이므로 비밀·피드 URL·원시 에러 스택을 넣지 말 것**(숫자 집계만 권장).
- 공개: `/api/stats`, `/api/search`, `/api/img`, `GET/HEAD /api/articles[/id]`, `/api/categories`, `/api/sources`, `/api/trending`. 변경 메서드는 인증.
- 401은 항상 `WWW-Authenticate: Basic realm="Admin", charset="UTF-8"`.

### C. 파라미터·정렬 규칙 (S5 API 추가 시)
- `page = parsePage(raw)`, `limit = parseIntParam(raw, {min:1, max:100, fallback:N})` — `parseInt` 직접 사용 금지. 어떤 쿼리 문자열도 500이 되면 안 됨.
- `publishedAt` 정렬은 `{ sort: 'desc', nulls: 'last' }` + `id desc` 보조.
- 기사 id 경로 파라미터는 `parseArticleId`(`@/lib/routing`).

### D. 신규 순수 API (React·Prisma·next 의존 없음, 테스트 공용)
| API | 위치 | 시그니처 |
|---|---|---|
| `requiresAuth` / `isValidBasicAuth` / `WWW_AUTHENTICATE` | `@/lib/auth-policy` | 항목 1 |
| `parseArticleId` / `isKnownCategorySlug` / `resolvePageRequest` / `normalizeRankingCountry` | `@/lib/routing` | 항목 4·6·11 |
| `getArticleView` / `languageLabel` | `@/lib/article-view` | 항목 7 |
| `fetchAdminJson` | `@/lib/admin-fetch` (client) | 항목 2 |
| `GET /api/admin/articles` | API | `{ articles, total, page, totalPages }`, `status=all\|active\|inactive` |

### E. 구조 규칙 재확인 (S2 계약 D)
- 루트 Suspense/루트 `loading.tsx` 복원 금지. notFound 호출 세그먼트(page·generateMetadata) 위 loading 금지 — `/category/[slug]`는 layout 검증으로 해결했으므로 그 loading은 유지 가능.
- 검증 도구: `$SP/planner-s4-verify.js`(12항목), `$SP/planner-s3-verify.js`(8항목, T3 갱신본)는 S5 이후에도 통과 유지.
