# S2 레이아웃 & 내비게이션 개선 설계서 — Round 5 (결함 수정 라운드)

> 사용자 요청: "전체적으로 뉴스 번역이 잘안되고 있고 화면이 깨지는게 있어 모두 점검 하고 수정 하고 테스트까지 완료 해줘"
> 이번 라운드는 **결함 수정 라운드**다. 근거 없는 신규 기능·AI 기능은 넣지 않는다. 모든 항목은 결함 ID(QA_BASELINE-R5.md) 또는 이번 실측(S2-A~G)에 연결된다.
> 디자인 방향: 다크 모던(Bloomberg/Reuters) — **기존 토큰·레이아웃 유지**, 시각 변경은 결함 수정에 필요한 최소한만.

`$SP` = `/tmp/claude-0/-home-user-hydro/0832edd1-f39e-53fc-97a8-a3a334add43a/scratchpad`

---

## 현재 상태 분석

### 장점 (유지)
- Header: 2단 구조(로고·통계·시계 / 데스크톱 내비 띠), 스크롤 다운 시 1단만 접힘(-translate-y-12), `/` 단축키·ESC, 모바일 슬라이드 메뉴 + 하단 탭 + 국가 플라이아웃. 다크 토큰 일관.
- Footer: 4열 그리드(소개·카테고리·뉴스레터·연락처), AI 번역 고지, 통계 줄.
- layout: 본문 바로가기 링크, `lang="ko"`, viewport/themeColor/메타데이터 템플릿.
- not-found / error: 토큰을 쓰는 일관된 빈 상태 화면.

### 결함 (근거)
| ID | 위치 | 실측 근거 |
|---|---|---|
| **D10** | `layout.tsx:46-50`, `Header.tsx`, `Footer.tsx`, `admin/layout.tsx` | `/admin/*`에 사이트 Header(LiveStats·내비)·Footer·모바일 하단 탭이 함께 렌더링(증거 `$SP/peek/d-adminsrc-0.jpg`). 375px에서 visible `<nav>` 3개, fixed 요소 1개, SSR HTML에 `<header`/`<footer`/`Hacker News`/`뉴스레터` 포함. 관리자 바의 "LiveNews Admin"·"사이트로 돌아가기"가 375px에서 2줄로 깨짐(T1 baseline: brandLines=2, backLines=2). 관리자 바 로고(x=80)와 본문(x=96) 정렬 불일치(`admin/layout.tsx:14-15`의 px-4가 max-w 바깥). |
| **D11** | `Footer.tsx:19-67` | `NewsletterForm`은 저장 없이 `setSubmitted(true)` → "구독 완료! 감사합니다."(가짜 성공). 홈·국가 페이지에서는 `NewsletterBanner`(S3)와 연달아 2개 노출. 모든 페이지 푸터에 `input[type=email]` 1개(T2 baseline). |
| **D26** | `error.tsx:47-48` | `<a href="/">` → basePath 미적용으로 서버 루트(다른 앱) 이동. 격리 하네스 실측: homeHref `http://127.0.0.1:4001/` → 404. 추가로 "다시 시도"(`onClick={reset}`)는 서버 컴포넌트 오류에서 **복구되지 않음**(recovered=false; reset은 클라이언트 경계만 재렌더, 서버 페이로드 재요청 없음 — `$SP/planner-s2-x-A.json` "retry": flaky=false, `router.refresh()`+`reset()` 변형 flaky2=true). 오류 화면 제목이 `h2`라 페이지에 `h1` 없음. |
| **D9 (S2 구조 측면)** | `layout.tsx:47-49`, `loading.tsx` | 현재 `/article/999999`, `/article/abc`, `/nope`, `/xx` 모두 HTTP 200. **Planner 실험(Next 14.2.18, basePath 동일)**: 루트 Suspense든 루트/세그먼트 `loading.tsx`든 **notFound() 지점 위에 Suspense 경계가 하나라도 있으면** 셸이 먼저 flush되어 200이 된다. **`generateMetadata`에서 notFound()를 호출해도 동일하게 200**(S4가 예정한 방식만으로는 해결 불가). 아래 "D9 실험 결과" 참조. |
| **S2-A (신규)** | `Header.tsx:47-84`, `Footer.tsx:72-114`, `api/admin/stats/route.ts` | ① Header·Footer가 같은 `/api/admin/stats`를 **각각** 요청(페이지당 2회, T7 baseline admin=2). ② 이 공개 GET 응답에 `recentLogs` 20건(소스 ID, `errorMessage`, 내부 피드 URL), `failedCollections`, `byCountry` 등 관리자 데이터가 **무인증 노출**(`curl $BASE/api/admin/stats` → 키 7개). ③ "오늘 N건"이 서버 TZ 자정 기준(`new Date(y,m,d)`, 서버 UTC) → 01:12 KST에 "오늘 113건"(KST 자정 이후 실제 0건, psql 실측). ④ basePath `/livenews` 하드코딩(`Header.tsx:54`, `Footer.tsx:79`). ⑤ 클라이언트 fetch에 의미 없는 `{ next: { revalidate } }`. |
| **D7 연계 (S2-B)** | `Header.tsx:14-42`, `Footer.tsx:120` | LiveClock은 브라우저 TZ·ICU(`toLocaleString`) 의존 → 같은 순간 Seoul "10월 6일 (화) 01:13:57", LA "10월 5일 (월) 09:13:59", UTC "16:14:01"(T6 baseline). 사이트의 모든 기사 시각은 S1 이후 KST인데 시계만 뷰어 TZ라 불일치, `dateTime` 속성 없음. Footer 연도는 `new Date().getFullYear()`(서버 TZ) — `/search`·404는 빌드 시 정적 생성되므로 해가 바뀌면(또는 KST 1/1 00:00~09:00) 서버 HTML과 클라이언트 연도가 달라 **React #418/#425 하이드레이션 오류**(T5 baseline: 2027-01-01 00:30 KST로 시계 고정 시 /search, /a/b, /article/999999 모두 오류). |
| **S2-C (접근성)** | `Header.tsx:252-260, 324-392, 455-485`, `SearchBar.tsx:46` | 닫힌 모바일 메뉴(max-h-0 opacity-0)·국가 플라이아웃(opacity-0)·접힌 검색창(max-h-0)의 링크·입력이 Tab 순서에 남음: 모바일 `/article/1`에서 본문까지 **보이지 않는 Tab 정지 24개**(T8 baseline). 햄버거·검색·국가 토글에 `aria-expanded`/`aria-controls` 없음, 활성 링크에 `aria-current` 없음, `<nav>` 4개에 레이블 없음, ESC 후 포커스 복귀 없음. 헤더 검색 입력은 placeholder만 있고 레이블 없음. |
| **S2-D** | `Header.tsx:166-176` | 스크롤 다운으로 헤더가 접힌 상태에서 키보드 포커스가 1단(검색 버튼·검색 입력)으로 이동하면 화면 밖(top −14px)에 포커스(WCAG 2.4.11). `$SP/planner-s2-collapse-focus.js` 실측, T14 baseline FAIL. |
| **S2-E** | `Header.tsx:326-327` | 모바일 메뉴 `max-h-[70vh]` + `overflow-hidden` → 가로 모드(812×375)에서 패널 높이 262px < 내용 339px, 스크롤 불가 → 국가 링크 등 접근 불가(T9 baseline). |
| **S2-F** | `layout.tsx:42` | 본문 바로가기 링크 포커스 시 흰 글자 on `#f0883e` = 대비 **2.53:1**(WCAG AA 4.5:1 미달, T10 baseline). `text-surface`(#0d1117)면 7.48:1. |
| **S2-G** | `not-found.tsx:24-43`, `Footer.tsx:34,147,164,188,214,157` | 320px에서 404 버튼 라벨이 2줄로 깨짐(높이 60/62px, T11). 푸터 섹션 제목이 `h3`(문서에 h2 없이 건너뜀), 카테고리 이모지 12개가 스크린리더에 노출(T12). |

### D9 실험 결과 (재실행 가능, 이 설계의 근거)
- 최소 앱(`$SP/planner-s2-d9/`, `run.sh <WRAP> <LOADING> 4101`, 로그 `$SP/planner-s2-d9.log`): 루트 레이아웃 Suspense(WRAP)·루트 loading.tsx(LOADING) 4조합 × {본문 notFound, generateMetadata notFound} → **WRAP=0 & LOADING=0일 때만 404**, 나머지 3조합은 둘 다 200.
- 세그먼트 실험(`$SP/planner-s2-d9/run2.sh`, `$SP/planner-s2-d9-v.log`): 루트 경계 없이 `[id]/loading.tsx`만 있어도 같은 세그먼트 page/generateMetadata의 notFound는 200. 반면 **세그먼트 `layout.tsx`에서 notFound → 그 세그먼트의 loading.tsx는 layout 아래이므로 404**.
- 실앱 복사본 실험(`$SP/planner-s2-x-setup.sh` A~F, 결과 `$SP/planner-s2-x-*.json`): C/F(루트 Suspense·루트 loading 제거)에서 `/article/999999`·`/article/abc`·`/article/99999999999`·`/nope`·`/admins`·`/a/b` → 404, F(원본 페이지 그대로 + S2 변경만)에서도 404 + 제목 "페이지를 찾을 수 없습니다 | LiveNews". E에서 `[country]/loading.tsx`를 두면 `/nope`이 다시 200(함정 확인).
- 결론: **레이아웃의 중복 Suspense는 불필요하고 해롭다**(`/search`는 자체 Suspense 보유, 그 외 `useSearchParams` 사용처 없음 — `grep -rl useSearchParams src` → search/page.tsx 1건). 루트 loading.tsx도 루트에 있으면 모든 하위 경로의 404를 막으므로 **루트에서 제거하고 notFound를 쓰지 않는 목록 경로에만 세그먼트 loading을 둔다.** 로컬 실측 페이지 응답 15~70ms라 스켈레톤 없는 경로의 체감 손실은 작다.

### Planner 실측 요약 (모두 재실행 가능)
- `cd $SP && node planner-s2-verify.js` → 현재 **1/14 통과**(T13만 PASS; T3는 하네스 필요). 로그 `$SP/planner-s2-verify-baseline2.log`.
- T3 하네스 baseline: `{"status":200,"errorUi":true,"h1":null,"homeHref":"http://127.0.0.1:4001/","recovered":false,"homeStatus":404}`.
- 이전 Planner 프로토타입(동일 설계를 격리 복사본에 적용)으로 T1~T13 중 12/13 PASS 확인(`$SP/planner-s2-verify-proto.log`, 남은 1건은 데스크톱 검색 토글 `aria-expanded` 누락 → 항목 7에 명시).

---

## 디자인 방향
- **유지**: 다크 서피스(#0d1117/#161b22/#21262d), 오렌지 액센트 #f0883e, Live(빨강)News(파랑) 로고, 1단 접힘 헤더, 하단 탭. 새로운 색·그라데이션·장식 추가 금지(보라 그라데이션·흰 카드 등 AI slop 금지).
- **원칙**: "보이지 않는 것은 존재하지도 않는다" — 닫힌 패널은 포커스·스크린리더에서도 사라지고, 가짜 성공 메시지는 없으며, 관리자 화면은 관리자 크롬만 갖는다. 시간 표기는 사이트 전체가 KST 하나로 말한다(시계에 `KST` 라벨: Bloomberg 터미널식 표기 — 유일한 시각적 추가).
- 짧은 UI 라벨에만 `whitespace-nowrap`(S1 계약 B). 데이터 텍스트에는 금지.

## 대상 파일 목록
수정:
- `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/SearchBar.tsx`(입력 레이블 1줄)
- `src/app/layout.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/admin/layout.tsx`
- `.env.example`(플래그 문서화)
삭제:
- `src/app/loading.tsx` (내용은 `PageSkeleton`으로 이동)
신규:
- `src/lib/site.ts` (basePath·관리자 경로·KST 시계/연도/자정·통계 파서 — 순수 함수, React/Prisma 의존 없음)
- `src/lib/newsletter.ts` (뉴스레터 플래그·구독 호출 — S3 공용)
- `src/hooks/useSiteStats.ts` (Header·Footer 공용 통계 훅, 요청 1회 공유)
- `src/app/api/stats/route.ts` (공개 최소 통계 API)
- `src/components/PageSkeleton.tsx`, `src/components/AdminNav.tsx`
- `src/app/breaking/loading.tsx`, `src/app/ranking/loading.tsx`, `src/app/category/[slug]/loading.tsx` (각 1줄 re-export)
- `tests/site.test.ts`, `tests/newsletter.test.ts`

수정 금지(다른 슬라이스): 모든 `page.tsx`, `middleware.ts`, `api/admin/stats/route.ts`, `NewsletterBanner.tsx`, `src/lib/utils.ts`·`constants.ts`(S1 합격본 — import만).

---

## 개선 항목

### 항목 1 [P0 · D10]: 관리자 경로에서 사이트 크롬 제거 + 관리자 레이아웃 단독 동작
- **대상 파일**: `src/lib/site.ts`(신규 `isAdminPath`), `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/app/admin/layout.tsx`, `src/components/AdminNav.tsx`(신규)
- **현재 문제**: D10 — 관리자 화면 위에 사이트 Header·Footer·하단 탭이 렌더링되어 내비가 3중 노출, 모바일에서 관리자 바 줄바꿈 깨짐.
- **개선 방법**:
  - `isAdminPath(pathname: string | null | undefined): boolean` — 세그먼트 정확 일치: `'/admin'`, `'/admin/'`, `'/admin/…'`만 true. `'/administrator'`, `'/admins'`, `'/livenews/admin'`(basePath 포함 문자열은 usePathname이 주지 않음), `''`, `null`, `undefined` → false.
  - Header/Footer 기본 export를 얇은 게이트로: `export default function Header() { const pathname = usePathname(); if (isAdminPath(pathname)) return null; return <SiteHeader />; }` (기존 본문은 `SiteHeader`/`SiteFooter`로 이름만 변경 → **훅 호출 순서 불변**, LiveStats·통계 요청도 관리자 화면에서 마운트되지 않음). 클라이언트 컴포넌트의 `usePathname`은 SSR·정적 프리렌더에서도 값이 있으므로 **서버 HTML 단계에서** 크롬이 빠진다(깜빡임 없음).
  - 루트 레이아웃은 그대로 `<Header/> <main id="main"> <Footer/>` 구조 유지(라우트 그룹 이동·다중 루트 레이아웃은 전체 새로고침·대규모 파일 이동을 유발하므로 채택하지 않음).
  - `admin/layout.tsx`: 바깥 래퍼 `px-4`를 `max-w-7xl mx-auto px-4` 안으로 옮겨 로고·본문 좌측 정렬 일치. 바는 `flex flex-wrap items-center justify-between gap-x-6 gap-y-2`, 브랜드·"사이트로 돌아가기"는 `whitespace-nowrap`(짧은 UI 라벨). 관리자 바 태그는 `div` 유지(검증 T1이 관리자 HTML의 `<header`/`<footer>`를 사이트 크롬 잔존으로 판정하므로 사용 금지).
  - `AdminNav.tsx`('use client'): `adminMenu`를 받아 `<nav aria-label="관리자 메뉴">`로 렌더, 현재 경로 링크에 `aria-current="page"` + `text-accent`(정확 일치: `/admin`은 `/admin`에서만, 나머지는 `startsWith`). 메뉴 `flex flex-wrap gap-x-4 gap-y-1`.
  - "사이트로 돌아가기"는 `<Link href="/">` 유지(basePath 자동 적용).
  - 모바일 하단 여백: 하단 탭·Footer(`pb-16`)가 관리자 화면에서 사라지므로 관리자 레이아웃에는 추가 하단 패딩을 두지 않는다(기존 `py-6` 유지). 화면에 fixed 요소 0개.
- **기대 효과**: 관리자 화면에 관리자 내비 1개만, 375px에서도 한 줄 라벨, 관리자 화면에서 공개 통계 요청 0건.
- **검증 방법**: `cd $SP && node planner-s2-verify.js --only T1` → PASS. (4개 관리자 경로 × 375/1440: SSR HTML에 `<header|<footer|Hacker News|뉴스레터` 없음, DOM에 header/footer 없음, visible fixed 요소 0, visible nav 정확히 1, 가로 넘침 없음, 브랜드·복귀 링크 1줄, `/admin` 외 경로에서 통계 요청 0, 페이지 오류 0; 공개 경로 `/`, `/article/1`(모바일), `/breaking`(PC)은 header·footer·하단 탭 유지). 육안: `node peek.js mobile /admin/sources peek/s2-admin 1 admin`, `node peek.js desktop /admin/sources peek/s2-admin-d 1 admin`.

### 항목 2 [P0 · D9]: 루트 Suspense·루트 loading 제거 → 실제 404 + 목록 경로 세그먼트 로딩
- **대상 파일**: `src/app/layout.tsx`, `src/app/loading.tsx`(삭제), `src/components/PageSkeleton.tsx`(신규), `src/app/breaking/loading.tsx`·`src/app/ranking/loading.tsx`·`src/app/category/[slug]/loading.tsx`(신규), `src/app/not-found.tsx`
- **현재 문제**: D9 — 루트 `<Suspense fallback={<Loading/>}>`와 루트 `loading.tsx`가 모든 경로를 스트리밍 경계로 감싸 notFound()가 항상 200(soft-404). generateMetadata 방식으로도 우회 불가(실험).
- **개선 방법**:
  - `layout.tsx`: `Suspense`·`Loading` import 제거, `<main id="main" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>`(tabIndex는 항목 9의 바로가기 포커스 이동용).
  - `src/app/loading.tsx` 삭제. 그 마크업을 `src/components/PageSkeleton.tsx`(서버 컴포넌트, default export)로 이동하고 루트 요소에 `role="status" aria-live="polite" aria-busy="true"` + `<span className="sr-only">뉴스를 불러오는 중입니다</span>`. 스켈레톤 시각(토큰·shimmer)은 그대로.
  - notFound()를 **쓰지 않는** 목록 경로에만 세그먼트 로딩: `breaking/loading.tsx`, `ranking/loading.tsx`, `category/[slug]/loading.tsx` — 내용은 각 1줄 `export { default } from '@/components/PageSkeleton';`. **`[country]`, `article/[id]`, 루트(홈), `search`에는 loading.tsx를 두지 않는다**(앞 둘은 notFound 사용, search는 자체 Suspense).
  - `not-found.tsx`: `export const metadata: Metadata = { title: '페이지를 찾을 수 없습니다' };` → 템플릿으로 "페이지를 찾을 수 없습니다 | LiveNews"(현재 "Not Found - LiveNews | LiveNews" 이중 브랜드·"LiveNews | LiveNews" 해소). 제목 `h1` 유지.
- **기대 효과**: S2 변경만으로 `/article/999999`, `/article/abc`, `/article/99999999999`, `/nope`, `/admins`, `/a/b`가 HTTP 404 + not-found 제목(실험 F 실측). 목록 경로 클라이언트 이동 시 스켈레톤 유지(스크린리더에 "불러오는 중" 안내). `/category/zzz`는 여전히 200 — S4 몫(계약 D 참조).
- **검증 방법**: `node planner-s2-verify.js --only T4,T13` → PASS. T4: 위 6개 경로 404 + 제목 정확 일치; `''`, `/article/1`, `/world`, `/breaking`, `/breaking?page=abc`, `/category/economy`, `/ranking`, `/search` 200; `''`·`/article/1`·`/world`·`/search` 초기 HTML에 `shimmer` 0건; layout에 `Suspense` 문자열 없음, `src/app/loading.tsx` 없음; `/search`에서 `/breaking`·`/category/economy`·`/ranking`으로 클라이언트 이동 시 `main [role=status] .shimmer` 관측 후 도착. T13: 404·검색 경로 페이지 오류 0. 추가로 `curl -s -o /dev/null -w '%{http_code}' $BASE/nope` → 404.
  - 참고: 외부 Pretendard CSS가 **차단**된 환경에서는 notFound 페이지에서 React가 무관한 `Event` rejection을 로그한다(실험 F hydration). verify 스크립트는 해당 CSS만 빈 200으로 응답해 이를 배제한다. audit.js(전부 차단)에서 404 경로의 이 `Event` 1건은 S2 회귀로 보지 않는다.

### 항목 3 [P0 · D26]: 오류 화면 — basePath 홈 링크, 실제로 동작하는 "다시 시도", h1
- **대상 파일**: `src/app/error.tsx`, `src/lib/site.ts`(신규 `BASE_PATH`, `withBasePath`)
- **현재 문제**: D26(홈 링크가 basePath 밖), 재시도가 서버 오류에서 복구 불가, 페이지 h1 없음, 컴포넌트명 `Error`가 전역 `Error`를 가림.
- **개선 방법**:
  - `site.ts`: `export const BASE_PATH = '/livenews'`(next.config.js `basePath`와 동일 — 단위 테스트가 설정 파일을 읽어 일치 단언), `withBasePath(path)`: `'/'`·`''` → `'/livenews'`, `'/api/stats'`·`'api/stats'` → `'/livenews/api/stats'`.
  - 홈 링크: **전체 새로고침 의도 유지** — `<a href={withBasePath('/')}>홈으로</a>`(손상된 클라이언트 상태를 버리기 위해 `Link`가 아닌 `a`).
  - 재시도: `const router = useRouter();` → `onClick={() => startTransition(() => { router.refresh(); reset(); })}` (서버 페이로드 재요청 + 경계 리셋; 실험 flaky2에서 복구 확인).
  - 제목 `h2` → `h1`(오류 화면이 main의 유일한 제목). 함수명 `Error` → `ErrorPage`(타입은 전역 `Error` 그대로).
  - `console.error` 유지(digest 표시 유지).
- **기대 효과**: 오류 화면에서 사이트 홈으로 정상 복귀, 일시 오류는 "다시 시도"로 회복.
- **검증 방법**: 격리 하네스(:4001, 실서버 :4000 무관) — `cd $SP && bash planner-s2-harness.sh > $SP/s2-h.log 2>&1 && node planner-s2-verify.js --only T3; bash planner-s2-harness.sh stop` → PASS(오류 UI 표시, `main h1` 존재, 홈 링크 pathname `/livenews` + 200, 마커 제거 후 "다시 시도"로 `#flaky-ok` 렌더). 루트 Suspense 제거 후 서버 오류 상태코드는 500이 정상(프로토타입 실측).

### 항목 4 [P0 · D11]: 뉴스레터 기능 플래그(기본 off) — 가짜 성공 제거·중복 CTA 제거
- **대상 파일**: `src/lib/newsletter.ts`(신규), `src/components/Footer.tsx`, `.env.example`
- **현재 문제**: D11 — 저장 없이 "구독 완료!" 표시, 홈/국가 페이지에서 배너와 이중 노출.
- **개선 방법**:
  - `newsletter.ts`(계약 C 참조):
    - `isFlagOn(v: string | null | undefined): boolean` → **정확히 `'true'`일 때만** true(AdSlot과 동일 판정; `'TRUE'`, `' true'`, `'1'`, `'yes'` 등은 false).
    - `export const NEWSLETTER_ENABLED = isFlagOn(process.env.NEXT_PUBLIC_NEWSLETTER_ENABLED);` — **반드시 이 리터럴 속성 접근**(Next가 빌드 시 인라인; 구조분해·동적 키 금지). 값 변경은 재빌드 필요.
    - `NEWSLETTER_ENDPOINT = withBasePath('/api/newsletter')`(= `'/livenews/api/newsletter'`).
    - `isNewsletterBannerPath(pathname)`: 배너가 있는 경로 `'/'`, `'/world'`, `'/us'`, `'/japan'`, `'/china'`만 true(`'/global'`, `'/breaking'`, `'/article/1'`, `'/admin'`, `'/world/x'`, `''`, `null` → false).
    - `subscribeNewsletter(email: string, fetchImpl: typeof fetch = fetch): Promise<{ ok: true } | { ok: false; reason: 'invalid' | 'http' | 'network' }>` — trim 후 간단한 이메일 형식 검사 실패 시 요청 없이 `invalid`; `POST NEWSLETTER_ENDPOINT`, `Content-Type: application/json`, body `JSON.stringify({ email })`; 2xx만 ok, 그 외 `http`, 예외 `network`. **2xx 없이 성공을 보고하지 않는다.**
  - Footer: `NEWSLETTER_ENABLED`가 false면 뉴스레터 열 자체를 렌더하지 않고 그리드를 `lg:grid-cols-3`으로(빈 열 없음 — 두 클래스 모두 완전한 리터럴로 조건 분기). true여도 `isNewsletterBannerPath(pathname)`이면 푸터 폼을 숨겨 배너와 중복 방지. 폼을 보일 때: `<label htmlFor>`(sr-only 가능) 또는 `aria-label`, 제출 중 버튼 비활성, 결과는 `subscribeNewsletter` 결과로만 표시 — 실패 시 "구독 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."(`role="status"`), 성공 문구는 ok일 때만. 4초 자동 리셋 `setTimeout`은 언마운트 시 정리.
  - 소개 문구 "매일 아침 AI가 선별한 핵심 뉴스를…"는 폼과 함께만 노출.
  - 이번 라운드에 `/api/newsletter` 라우트는 만들지 않는다(DB 스키마 변경 금지). 따라서 플래그를 켜면 정직하게 실패가 보인다 — 백엔드 연결 전에는 켜지 말 것을 `.env.example`에 명시.
  - `.env.example`: AdSlot 블록 아래에
    ```
    # Newsletter: signup forms (footer + home banner) are hidden until a real
    # subscription backend exists at /api/newsletter. Build-time flag (rebuild to change).
    NEXT_PUBLIC_NEWSLETTER_ENABLED=false
    ```
- **기대 효과**: 기본 상태에서 가짜 성공·중복 CTA 0, 푸터 3열 정렬. 향후 백엔드 연결 시 플래그만 켜면 정직한 흐름.
- **검증 방법**: `node planner-s2-verify.js --only T2` → PASS(`''`, `/world`, `/article/1`, `/breaking`, `/search` 푸터에 email 입력 0·"뉴스레터|구독" 문구 없음, grid 트랙 수 = 보이는 열 수, `.env.example`에 `NEXT_PUBLIC_NEWSLETTER_ENABLED=false` 줄). 플래그 ON 경로(선택): `cd $SP && NEXT_PUBLIC_NEWSLETTER_ENABLED=true bash planner-s2-harness.sh > $SP/s2-h.log 2>&1 && node planner-s2-verify.js --only T2B; bash planner-s2-harness.sh stop` → PASS(배너 경로 푸터 폼 0, `/article/1` 폼 1·레이블 있음·POST 발생·실패 문구 표시·"완료/감사합니다" 없음). 단위: `npm test`의 newsletter 케이스(항목 12).

### 항목 5 [P1 · S2-A]: 공개 최소 통계 API + 요청 1회 공유 + KST "오늘"
- **대상 파일**: `src/app/api/stats/route.ts`(신규), `src/lib/site.ts`(`startOfKstDay`, `parseSiteStats`, `SITE_STATS_PATH`, `type SiteStats`), `src/hooks/useSiteStats.ts`(신규), `src/components/Header.tsx`(LiveStats), `src/components/Footer.tsx`(FooterStats)
- **현재 문제**: S2-A ①~⑤.
- **개선 방법**:
  - `site.ts`: `type SiteStats = { totalArticles: number; articlesToday: number; activeSources: number }`; `SITE_STATS_PATH = '/api/stats'`; `startOfKstDay(input: DateInput): Date` — 해당 순간의 KST 날짜 00:00(= UTC 전날 15:00), 무효 입력은 `RangeError`(S1 `toKstParts` 재사용); `parseSiteStats(json: unknown): SiteStats | null` — 세 필드가 모두 0 이상 정수일 때만 그 3개 필드만 담아 반환(추가 키 버림), 아니면 null.
  - `/api/stats`(GET, `dynamic = 'force-dynamic'`): `getCached('site:stats', 60, …)`로 `prisma.article.count({ where: { isActive: true } })`, `prisma.article.count({ where: { isActive: true, createdAt: { gte: startOfKstDay(Date.now()) } } })`, `prisma.source.count({ where: { isEnabled: true } })` → **정확히 3개 키** JSON. 실패 시 500 `{ error }`. 미들웨어 matcher에 없으므로 공개(미들웨어 수정 불필요).
  - `useSiteStats()`: 모듈 스코프의 in-flight Promise + 마지막 값 캐시로 **Header·Footer가 한 번의 요청을 공유**, `fetch(withBasePath(SITE_STATS_PATH), { cache: 'no-store' })` → `parseSiteStats`; 실패·형식 오류는 null(슬롯 숨김, 기존 동작). 5분 주기 갱신은 공유 타이머 1개(구독자 0이 되면 정리). `{ next: { revalidate } }` 제거.
  - LiveStats/FooterStats는 훅 결과만 사용. 표시 문구·스타일 불변.
- **기대 효과**: 공개 크롬이 관리자 데이터(수집 로그·오류 메시지·피드 URL)를 요청하지 않음 → S4가 `/api/admin/stats`를 인증 뒤로 옮길 수 있음. 페이지당 통계 요청 2→1, "오늘"이 사이트 표기(KST)와 일치.
- **검증 방법**: `node planner-s2-verify.js --only T7` → PASS(`''`(PC·모바일), `/article/1`, `/breaking`에서 `/api/admin/stats` 요청 0·`/api/stats` 정확히 1; 응답 200, 키 `activeSources,articlesToday,totalArticles`만, 정수 ≥0; `articlesToday`·`totalArticles`가 psql의 KST 자정 기준 집계와 일치). `grep -n "livenews/api" src/components/Header.tsx src/components/Footer.tsx` → 0건.

### 항목 6 [P1 · D7 연계 / S2-B]: LiveClock KST 고정 + Footer 연도 하이드레이션 안전
- **대상 파일**: `src/lib/site.ts`(`formatKstClock`, `kstYear`), `src/components/Header.tsx`(LiveClock), `src/components/Footer.tsx`
- **현재 문제**: S2-B — 시계가 뷰어 TZ·ICU 의존, 연도가 서버 TZ 의존으로 하이드레이션 오류.
- **개선 방법**:
  - `formatKstClock(input: DateInput): { label: string; dateTime: string } | null` — S1 `toKstParts` 기반, `label` = `` `${month}월 ${day}일 (${'일월화수목금토'[weekday]}) ${HH}:${mm}:${ss}` ``(월·일은 0 패딩 없음, 시분초 2자리), `dateTime` = `toIsoDateTime(input)`; 무효 → null. `kstYear(input: DateInput = Date.now()): number`.
  - LiveClock: 마운트 전 null 유지(하이드레이션 안전, 기존 방식), 마운트 후 1초 간격으로 `formatKstClock(Date.now())` → `<time dateTime={dateTime} …>{label}<span className="…">KST</span></time>`(라벨은 `text-text-muted` 계열 작은 글씨, 새 색 금지). `toLocaleString` 제거.
  - Footer: `const year = kstYear();` + 연도 텍스트의 **직접 부모** `<p>`에 `suppressHydrationWarning`(정적 프리렌더된 `/search`·404는 빌드 연도를 담고 있으므로 해가 바뀌면 서버/클라이언트가 다를 수 있음 — S1 계약 C-1과 같은 패턴). `getFullYear` 제거.
- **기대 효과**: 어느 나라에서 보든 시계가 기사 시각과 같은 KST, 연말·연초 하이드레이션 오류 0.
- **검증 방법**: `node planner-s2-verify.js --only T5,T6` → PASS. T5: 브라우저 시계를 2026-12-31T15:30Z(=2027-01-01 00:30 KST)로 고정하고 `/search`, `/a/b`, `/article/999999` 열어 페이지 오류 0 + 연도 표시 존재, Footer.tsx에 `getFullYear(` 없음. T6: Asia/Seoul·America/Los_Angeles·UTC 세 컨텍스트에서 `header time` 텍스트에 `KST` 포함, `datetime`이 ISO-Z, 텍스트가 그 datetime의 KST 변환과 일치. 단위: 항목 12.

### 항목 7 [P1 · S2-C]: 닫힌 패널 포커스 차단 + ARIA 상태 + 내비 레이블 + ESC 포커스 복귀
- **대상 파일**: `src/components/Header.tsx`, `src/components/SearchBar.tsx`
- **현재 문제**: S2-C — 보이지 않는 Tab 정지 24개, 토글 상태 미노출, aria-current 없음, nav 무레이블.
- **개선 방법**:
  - 닫힌 상태에서 **`invisible`(visibility:hidden)** 추가: 접힌 검색창 래퍼, 닫힌 모바일 메뉴 패널, 닫힌 국가 플라이아웃. 열림/닫힘 전환 애니메이션 유지를 위해 transition 대상에 visibility 포함(`transition-[max-height,opacity,visibility]` 등, 완전한 리터럴 클래스).
  - id 부여: 검색창 `site-search`, 모바일 메뉴 `site-mobile-menu`, 국가 플라이아웃 `site-country-menu`. **모든 토글 버튼**(데스크톱 검색, 모바일 검색, 햄버거, 국가)에 `aria-expanded={bool}` + `aria-controls`(위 id), 국가 버튼 `aria-haspopup="true"`. 햄버거 `aria-label`은 "메뉴" 유지(검증이 이 이름을 사용), 상태는 aria-expanded로 전달.
  - `<nav>` 레이블(중복 없이): 데스크톱 "주요 메뉴", 모바일 패널 "모바일 메뉴", 하단 탭 "하단 탭 메뉴". 국가 플라이아웃은 nav가 아니면 레이블 불필요.
  - 활성 링크(데스크톱 띠·모바일 패널·하단 탭·국가 목록)에 `aria-current={active ? 'page' : undefined}`. 하단 탭 홈의 중복 조건 `isActive('/') && pathname === '/'`는 `isActive('/')`로 단순화.
  - ESC: 열린 패널을 닫고 **그 패널을 연 토글 버튼으로 포커스 복귀**(햄버거/국가/검색 각각 ref).
  - Hacker News 외부 링크 2곳: 새 창 안내 `aria-label="Hacker News (새 창)"`, 아이콘 svg `aria-hidden="true"`. 아이콘 전용 svg 모두 `aria-hidden`.
  - SearchBar 입력에 `aria-label={placeholder 기반 또는 '뉴스 검색'}` 추가(placeholder는 레이블이 아님). 다른 동작 불변.
- **기대 효과**: 키보드·스크린리더 사용자가 보이는 것만 탐색, 메뉴 상태를 인지.
- **검증 방법**: `node planner-s2-verify.js --only T8` → PASS(모바일·PC `/article/1`에서 본문 도달 전 Tab 정지 중 숨김·클리핑 요소 0; `''`, `/breaking` 첫 Tab = "본문 바로가기"; 모바일 `/breaking`에서 visible nav 모두 고유 레이블, header·하단 탭의 visible 비제출 버튼 모두 `aria-expanded` true/false + 존재하는 `aria-controls`; `aria-current="page"`에 "속보" 포함; 햄버거 클릭 → `aria-expanded="true"`, ESC → `"false"` + 포커스가 "메뉴" 버튼). 프로토타입에서 데스크톱 검색 토글 누락으로 실패했으므로 **두 검색 토글 모두** 적용 필수.

### 항목 8 [P1 · S2-D]: 접힌 헤더가 키보드 포커스를 가리지 않게
- **대상 파일**: `src/components/Header.tsx`
- **현재 문제**: S2-D — 접힘(-48px) 상태에서 Shift+Tab 포커스가 화면 밖(top −14px)에 위치.
- **개선 방법**: `const [focusWithin, setFocusWithin] = useState(false)`; `<header onFocus={() => setFocusWithin(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusWithin(false); }}>`; `collapsed = scrollDir === 'down' && !mobileOpen && !searchOpen && !focusWithin`. 접힘 동작 자체(스크롤 다운 시 -translate-y-12)는 유지.
- **기대 효과**: 키보드 포커스가 항상 보임(WCAG 2.4.11), 마우스 사용자의 접힘 경험 불변.
- **검증 방법**: `node planner-s2-verify.js --only T14` → PASS(PC `/article/1` 휠 스크롤로 접힘 확인 후 내비 첫 링크에서 Shift+Tab 2회, header 안 포커스 요소의 top ≥ 0·bottom > 0; 접힘이 일어나지 않으면 FAIL).

### 항목 9 [P2 · S2-F]: 본문 바로가기 링크 대비 + 포커스 이동
- **대상 파일**: `src/app/layout.tsx`
- **현재 문제**: S2-F — 2.53:1 대비.
- **개선 방법**: `focus:text-white` → `focus:text-surface`(#0d1117 on #f0883e = 7.48:1). `main`에 `tabIndex={-1}`(항목 2)로 링크 활성화 시 포커스가 본문으로 이동.
- **검증 방법**: `node planner-s2-verify.js --only T10` → PASS(ratio ≥ 4.5, 텍스트 "본문 바로가기").

### 항목 10 [P2 · S2-E]: 가로 모드 모바일 메뉴 스크롤
- **대상 파일**: `src/components/Header.tsx`
- **현재 문제**: S2-E — 812×375에서 메뉴 아래쪽 링크 접근 불가.
- **개선 방법**: 열린 패널을 `overflow-y-auto overscroll-contain` + 높이 상한 `max-h-[calc(100dvh-7.5rem)]`(1단 헤더 3rem + 하단 탭 3.5rem + 여유; 완전한 리터럴). 닫힘은 기존 `max-h-0` + 항목 7의 `invisible`.
- **검증 방법**: `node planner-s2-verify.js --only T9` → PASS(패널 overflowY auto/scroll, 18개 링크 모두 패널 스크롤로 하단 탭 위에 노출 가능).

### 항목 11 [P2 · S2-G]: 404 좁은 화면 + 푸터 시맨틱
- **대상 파일**: `src/app/not-found.tsx`, `src/components/Footer.tsx`
- **현재 문제**: S2-G.
- **개선 방법**:
  - 404 버튼 행: `flex flex-wrap items-center justify-center gap-3`, 버튼 라벨 `whitespace-nowrap`(짧은 UI 라벨), 좁은 화면 패딩 `px-5 sm:px-6`. 장식 "404" 숫자 블록 `aria-hidden="true"`(제목 h1이 의미 전달).
  - 푸터 섹션 제목 `h3` → `h2`(같은 `text-overline` 클래스 → 시각 불변). 카테고리 이모지 `<span aria-hidden="true">`.
  - 푸터 `<footer>`에 별도 레이블 불필요. 소셜 아이콘 링크의 `aria-label`은 유지.
- **검증 방법**: `node planner-s2-verify.js --only T11,T12` → PASS(320px `/a/b`: 문서 폭 ≤ 320, 버튼 2개 높이 ≤ 44px; 푸터 h3 0개·h2 존재·노출 이모지 0).

### 항목 12 [P1 · D25]: S2 순수 로직 단위 테스트
- **대상 파일**: `tests/site.test.ts`, `tests/newsletter.test.ts`(신규). 규칙은 S1 계약 C-7(node:test, 상대 import, 네트워크 금지, TZ 원복, 신규 의존성 금지, `next build` 타입 검사 통과).
- **필수 케이스** (기준 프로토타입: `$SP/planner-s2-proto-unit-cases.ts.txt` — 기대값 그대로 사용):

  | 대상 | 입력 → 기대값 |
  |---|---|
  | BASE_PATH | `next.config.js`의 `basePath` 문자열과 동일 |
  | withBasePath | `'/'`·`''` → `'/livenews'`; `'/api/stats'`·`'api/stats'` → `'/livenews/api/stats'`; `SITE_STATS_PATH === '/api/stats'` |
  | isAdminPath | true: `'/admin'`, `'/admin/'`, `'/admin/sources'`, `'/admin/logs/x'`; false: `'/'`, `'/administrator'`, `'/admins'`, `'/article/1'`, `'/livenews/admin'`, `''`, `null`, `undefined` |
  | formatKstClock (TZ = UTC·Asia/Seoul·America/Los_Angeles·Pacific/Kiritimati 모두 동일) | `Date.UTC(2026,9,5,15,14,5)` → `{label:'10월 6일 (화) 00:14:05', dateTime:'2026-10-05T15:14:05.000Z'}`; `new Date(Date.UTC(2026,11,31,15,0,0))` → `{label:'1월 1일 (금) 00:00:00', dateTime:'2026-12-31T15:00:00.000Z'}`; `NaN`·`new Date('garbage')` → `null` |
  | kstYear | `Date.UTC(2026,11,31,14,59,59)` → 2026; `Date.UTC(2026,11,31,15,0,0)` → 2027 |
  | startOfKstDay | `Date.UTC(2026,9,5,15,14,21)` → `'2026-10-05T15:00:00.000Z'`; `Date.UTC(2026,9,5,15,0,0)` → 같은 값; `Date.UTC(2026,9,5,14,59,59)` → `'2026-10-04T15:00:00.000Z'`; `new Date(Date.UTC(2028,1,28,15,30))` → `'2028-02-28T15:00:00.000Z'`; `NaN` → `RangeError` |
  | parseSiteStats | `{totalArticles:409, articlesToday:0, activeSources:30}` → 동일 객체; 추가 키(`recentLogs`, `byCountry`)는 제거; null·undefined·`'x'`·`[]`·`{}`·문자열 숫자·음수·1.5·NaN·필드 누락 → `null` |
  | isFlagOn / NEWSLETTER_ENABLED | `'true'` → true; `'TRUE'`, `' true'`, `'true '`, `'1'`, `'yes'`, `'false'`, `''`, `undefined`, `null` → false; `NEWSLETTER_ENABLED === isFlagOn(process.env.NEXT_PUBLIC_NEWSLETTER_ENABLED)` |
  | NEWSLETTER_ENDPOINT | `'/livenews/api/newsletter'` |
  | isNewsletterBannerPath | true: `'/'`, `'/world'`, `'/us'`, `'/japan'`, `'/china'`; false: `'/global'`, `'/breaking'`, `'/article/1'`, `'/admin'`, `'/world/x'`, `''`, `null` |
  | subscribeNewsletter (가짜 fetch 주입) | `'  reader@example.com '` + 200 → `{ok:true}`, 요청 URL `'/livenews/api/newsletter'`, method `POST`, body `'{"email":"reader@example.com"}'`; 201 → ok; 404·500 → `{ok:false, reason:'http'}`; throw → `{ok:false, reason:'network'}`; `''`·`'not-an-email'` → `{ok:false, reason:'invalid'}` 이고 fetch 호출 없음 |
- **검증 방법**: `npm test` 종료코드 0, 출력에 `site.test.ts`·`newsletter.test.ts` 포함·`# fail 0`; `TZ=America/Los_Angeles npm test`도 통과; Evaluator가 표의 각 행이 단언으로 존재하는지 대조. `npx tsc --noEmit` 0 오류.

---

## Generator 구현 순서 (빌드가 중간에 깨지지 않게)
1. `src/lib/site.ts`, `src/lib/newsletter.ts`, 테스트 → `npm test`.
2. `api/stats/route.ts`, `hooks/useSiteStats.ts` → Header/Footer 전환(항목 5·6).
3. Header/Footer 게이트(항목 1), AdminNav·admin layout.
4. layout/loading/PageSkeleton/세그먼트 loading/not-found(항목 2·9·11).
5. error.tsx(항목 3), Header 접근성(항목 7·8·10), Footer 뉴스레터(항목 4), `.env.example`.
6. `bash $SP/qa-env.sh restart > $SP/s2-gen.log 2>&1`(빌드+재기동; 출력은 파일로) → `cd $SP && node planner-s2-verify.js` → 하네스로 T3(·T2B) → `node audit.js s2-gen`.

## 범위 밖 (S2에서 하지 말 것)
- `/category/zzz` 등 notFound를 아직 호출하지 않는 경로의 404화, `page > totalPages` 처리 → **S4**(계약 D).
- 미들웨어 수정(`/api/admin/stats` 인증화, D12~D14) → **S4**. S2는 공개 크롬이 그 엔드포인트를 더 이상 쓰지 않게만 한다.
- `/api/admin/stats`의 "오늘" 기준(관리자 대시보드) → S4/S5 판단(공개 표시는 `/api/stats`로 해결).
- `NewsletterBanner.tsx` 수정 → **S3**(계약 C 사용).
- `/api/newsletter` 백엔드·구독자 저장(DB 스키마 변경 금지), `global-error.tsx`(루트 레이아웃 자체 오류 — Header/Footer는 렌더 중 throw 경로 없음), 푸터 소셜 계정 실존 여부.
- 디자인 토큰·팔레트 변경, 신규 AI 기능.

## Evaluator 검증 절차 (요약)
```bash
SP=/tmp/claude-0/-home-user-hydro/0832edd1-f39e-53fc-97a8-a3a334add43a/scratchpad
cd /home/user/hydro && npm test && TZ=America/Los_Angeles npm test && npx tsc --noEmit          # 항목 12
bash $SP/qa-env.sh restart > $SP/s2-eval.log 2>&1; tail -3 $SP/s2-eval.log                         # 빌드 + :4000 재기동 (Evaluator만)
cd $SP && node planner-s2-verify.js                                                                # T1,T2,T4~T14 (T3는 하네스 없으면 SKIPPED=FAIL로 표시)
bash planner-s2-harness.sh > $SP/s2-h.log 2>&1 && node planner-s2-verify.js --only T3; bash planner-s2-harness.sh stop   # 항목 3
# (선택) NEXT_PUBLIC_NEWSLETTER_ENABLED=true bash planner-s2-harness.sh > $SP/s2-h.log 2>&1 && node planner-s2-verify.js --only T2B; bash planner-s2-harness.sh stop
node audit.js s2-eval                                                                              # 회귀: audit-s1-eval.json 대비 신규 OVERFLOW 0, 신규 CONSOLE 0(404 경로의 Pretendard 차단 'Event' 제외)
for p in /nope /article/999999 /article/abc /a/b; do curl -s -o /dev/null -w "$p %{http_code}\n" http://127.0.0.1:4000/livenews$p; done   # 전부 404
node peek.js mobile /admin/sources peek/s2-admin 1 admin; node peek.js mobile / peek/s2-home 2; node peek.js desktop /article/1 peek/s2-art 1
```
합격 기준: verify T1~T14 전부 PASS(T2B 선택), `npm test`·tsc·build 성공, audit 신규 회귀 0.

---

## 슬라이스 간 계약

S2가 제공하고 S3~S5가 사용(또는 준수)하는 것. 모두 additive. S1 계약(utils/constants API, CSS 규칙)은 그대로 유효.

### A. 함수·상수 (`@/lib/site` — React·Prisma 의존 없음, 서버·클라이언트·테스트 공용)
| API | 시그니처 | 동작 | 사용 |
|---|---|---|---|
| `BASE_PATH` | `'/livenews'` | next.config.js와 동일(테스트로 고정) | 전 슬라이스 |
| `withBasePath` | `(path: string) => string` | `<a href>`·`fetch` 등 **Next가 basePath를 붙여주지 않는 곳** 전용. `Link`/`router`/`redirect`에는 쓰지 말 것(이중 접두) | S3/S4 클라이언트 fetch(`'/livenews/api/…'` 하드코딩 대체 권장, 예 `admin/page.tsx`) |
| `isAdminPath` | `(pathname?: string \| null) => boolean` | `/admin` 세그먼트 정확 일치 | S3/S4(관리자에서 숨길 위젯) |
| `formatKstClock` / `kstYear` / `startOfKstDay` | 위 항목 6·5 | KST 결정적 | S4/S5("오늘" 집계가 필요하면 `startOfKstDay(Date.now())`) |
| `SITE_STATS_PATH`, `type SiteStats`, `parseSiteStats` | 위 항목 5 | 공개 통계 스키마 | S4/S5 |

### B. 공개 통계 API
- `GET /api/stats` → `200 { totalArticles, articlesToday, activeSources }`(정수, `articlesToday`는 KST 자정 이후 `createdAt`), Redis 키 `site:stats` 60초. **공개 유지 — S4는 middleware matcher에 추가하지 말 것.**
- S2 이후 사이트 크롬은 `/api/admin/stats`를 호출하지 않는다. **S4는 `middleware.ts`의 `isPublicRead`(GET `/api/admin/stats` 예외)를 제거해 관리자 통계를 인증 뒤로 옮겨도 된다**(관리자 대시보드는 인증 상태에서 계속 사용 — D12 WWW-Authenticate 수정과 함께 확인).

### C. 뉴스레터 플래그 (`@/lib/newsletter`) — S3 `NewsletterBanner` 필수 준수
- 환경 변수 이름: **`NEXT_PUBLIC_NEWSLETTER_ENABLED`**. 판정: **값이 정확히 문자열 `'true'`일 때만 켜짐**(AdSlot의 `NEXT_PUBLIC_ADS_ENABLED === 'true'`와 동일). 기본(미설정·`false`) = 꺼짐. 빌드 시 인라인 → 변경 시 재빌드.
- 판정은 **`NEWSLETTER_ENABLED`(이 모듈) 한 곳만** 사용 — 컴포넌트에서 `process.env`를 직접 읽지 말 것.
- S3 `NewsletterBanner`: `if (!NEWSLETTER_ENABLED) return null;`(훅 호출 순서 유지 위해 훅 다음 또는 얇은 래퍼), 제출은 `subscribeNewsletter(email)` 결과로만 성공/실패 표시(가짜 "구독 완료!" 금지), 입력에 접근 가능한 레이블.
- 중복 방지 규칙: 배너가 있는 경로는 `isNewsletterBannerPath` = `'/'`, `'/world'`, `'/us'`, `'/japan'`, `'/china'`. 푸터는 이 경로에서 폼을 숨긴다. **S4가 배너를 다른 페이지에 추가/제거하면 이 목록과 단위 테스트를 함께 갱신**.
- `NEWSLETTER_ENDPOINT = '/livenews/api/newsletter'` — 이번 라운드엔 라우트 없음(플래그 ON 시 정직한 실패 표시). `.env.example`에 `NEXT_PUBLIC_NEWSLETTER_ENABLED=false` 문서화(S2).

### D. 404·로딩 구조 규칙 (S4 필수 준수 — D9)
1. 루트 레이아웃에 `Suspense`를 다시 넣지 말 것, `src/app/loading.tsx`를 다시 만들지 말 것(모든 하위 경로가 soft-404가 됨).
2. **notFound()를 호출하는 세그먼트의 page와 같은 세그먼트(또는 그 위)에 loading.tsx를 두지 말 것.** `generateMetadata`에서의 notFound도 loading 경계 아래면 200이다(실험 확인).
3. 스켈레톤이 필요한 경로에서 notFound가 필요하면: **세그먼트 `layout.tsx`에서 검증 후 notFound** → 그 아래 `loading.tsx`는 허용(실험 E: `article/[id]/layout.tsx` 검증 + `article/[id]/loading.tsx` → 404 확인). 검증 쿼리는 `React.cache`로 page와 중복 제거 권장.
4. S2가 둔 `category/[slug]/loading.tsx`: S4가 `/category/<미지 slug>`를 404로 만들려면 `category/[slug]/layout.tsx`에서 `CATEGORIES` slug 검증 후 notFound(DB 불필요). `breaking/`, `ranking/` loading은 notFound가 없으므로 그대로.
5. `[country]`·`article/[id]`는 현재 page 본문 notFound만으로 S2 이후 404가 된다 — S4가 generateMetadata로 옮기더라도 loading을 추가하지 않는 한 유지됨. not-found 제목은 `not-found.tsx`의 metadata가 제공하므로 S4의 generateMetadata는 미존재 시 별도 "Not Found" 제목을 반환하지 말고 notFound()를 호출하거나 기본값을 두면 된다.
6. 스켈레톤 재사용: `export { default } from '@/components/PageSkeleton';`(role=status 포함).

### E. 크롬 공존 규칙 (S3/S4)
- 사이트 Header/Footer/하단 탭은 `/admin/*`에서 렌더되지 않는다. 관리자 페이지는 자체 레이아웃만 가정하고, 하단 탭 회피용 패딩(`pb-16` 등)을 넣지 말 것.
- 공개 페이지에서 화면 하단 고정 요소를 추가할 경우 모바일 하단 탭(h-14, z-50) 위에 두거나 겹침을 피할 것. 푸터가 `pb-16 lg:pb-0`으로 하단 탭 높이를 확보한다.
- `main#main`은 `tabIndex={-1}`(바로가기 대상) — 페이지는 자체 `<main>`을 중첩하지 말 것.
- 페이지별 제목은 `h1` 1개(오류·404 화면도 h1) — 푸터 섹션 제목은 h2.
