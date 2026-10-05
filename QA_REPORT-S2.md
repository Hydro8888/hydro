# QA 보고서 — 슬라이스 S2 (레이아웃 & 내비게이션), Round 5 결함 수정 라운드

- 검수 대상: 커밋 `30fc446` (S2 구현), 기준 SPEC: `SPEC-S2.md`, 비교 기준: `audit-s1-eval.json`
- Evaluator: Generator와 독립된 별도 서브에이전트. SELF_CHECK-S2.md의 주장은 아래처럼 모두 직접 실행해 확인했다.
- `$SP` = `/tmp/claude-0/-home-user-hydro/0832edd1-f39e-53fc-97a8-a3a334add43a/scratchpad`

---

## 0. 직접 실행한 검증 (수치)

| 검증 | 결과 |
|---|---|
| `npx tsc --noEmit` | 종료코드 0, 오류 0 |
| `npm test` | tests 70 / pass 70 / fail 0 (site 4 + newsletter 3 포함) |
| `TZ=America/Los_Angeles npm test` | 70 / 70 / fail 0 |
| `qa-env.sh restart` (rm -rf .next → `next build` → 재기동) | `APP UP (2s, css 200)`, 빌드 성공(BUILD_ID 16:40 신규), `/api/stats` ƒ 동적 라우트 생성 |
| `node planner-s2-verify.js` | **13/14** — T1, T2, T4~T14 PASS, T3만 "harness not running"(예상) (`$SP/eval-s2-verify.log`) |
| 하네스 T3 (`planner-s2-harness.sh` :4001) | **PASS** — `status 500, h1 "문제가 발생했습니다", homeHref …/livenews → 200, recovered: true` |
| 하네스 T2B (플래그 ON) | **PASS** — 배너 경로 푸터 폼 0, `/article/1` 폼 1·레이블·실제 POST·실패 문구, 가짜 성공 없음 |
| `node audit.js s2-eval` vs `s1-eval` (`eval-s1-compare.js`) | 156/156 레코드. **신규 OVERFLOW 0**, 문서 scrollWidth 변화 0, main 빈 화면 변화 0, 스피너 변화 0. 신규 콘솔/페이지오류/실패요청 각 6건은 **모두 art-404·country-404 × 3뷰포트**(상태 200→404 의도된 변경) |
| curl 상태 | `/nope`·`/article/999999`·`/article/abc`·`/article/99999999999`·`/admins`·`/a/b` = **404**, SSR `<title>페이지를 찾을 수 없습니다 \| LiveNews</title>`; `/livenews`·`/breaking`·`/article/1`·`/world`·`/ranking`·`/search`·`/category/economy`·`/breaking?page=abc` = 200; `/livenews/` = 308 → `/livenews`(Next trailing-slash 기본 동작, 정상); `/category/zzz` = 200(S4 범위, 계약 D-4) |
| `/api/stats` | `200 application/json` `{"totalArticles":409,"articlesToday":0,"activeSources":30}` — 정확히 3키, 정수 |
| SSR HTML 뉴스레터 | `''`, `/world`, `/us`, `/article/1`, `/breaking`, `/search`: `type="email"` 0, "구독" 0, `api/admin` 0 |
| 클라이언트 DOM(홈) | 푸터 `input[type=email]` 0, 그리드 1440px `400px 400px 400px`(빈 트랙 없음). **단, main 안에 S3 `NewsletterBanner`의 email 입력 1개 존재**(아래 범위 밖 인계) |
| 통계 요청 | 홈 → 속보 클라이언트 이동 2화면 동안 `/api/stats` 정확히 1회, `/api/admin/stats` 0회 |
| 스크린샷 육안 | `peek/eval-s2-admin-0.jpg`(1440), `eval-s2-admin-m-0.jpg`(375), `eval-s2-home-0/1.jpg`(375), `eval-s2-home-d-0.jpg`(1440), `eval-s2-404-0.jpg`(375) |

### 0-1. "Pretendard 차단 환경의 Event 페이지 오류" 원인 규명 (`$SP/eval-s2-event.js`)
`globals.css:4`의 `@import url('https://cdn.jsdelivr.net/…/pretendardvariable-dynamic-subset.min.css')`를 4가지 조건으로 재현:

| 조건 | `/nope` | `/article/999999` | `/a/b` (루트 not-found) | `/breaking` |
|---|---|---|---|---|
| 외부 전부 abort (audit.js와 동일) | 404, **pageerror `Event`** | 404, **`Event`** | 404, 오류 없음 | 200, 없음 |
| Pretendard CSS 빈 200 | 404, 없음 | 404, 없음 | 404, 없음 | 200, 없음 |
| Pretendard CSS 3초 지연 후 200 | 404, 없음 | 404, 없음 | 404, 없음 | 200, 없음 |
| 실제 네트워크 시도(샌드박스에서 실패) | 404, `Event` | 404, `Event` | 없음 | 없음 |

- 모든 조건에서 h1·헤더·푸터·버튼이 정상 렌더되고, 햄버거 클릭 시 `aria-expanded=true`로 **상호작용도 정상**(앱이 죽지 않음).
- 즉 **페이지 레벨 notFound()로 404가 된 응답에서, 외부 스타일시트 로드가 *실패*할 때만** React가 스타일시트 error 이벤트(`Event`)를 uncaught rejection으로 보고한다. 지연(느린 CDN)은 문제 없음.
- **운영(폰트 CDN 접속 가능)에서는 발생하지 않음** → S2 회귀 아님(SPEC 항목 2 참고 조항과 일치). 다만 CDN 차단 사용자(사내망·광고차단 등)에게는 404 페이지에서 콘솔 오류 1건이 남는다 — 근본 원인은 S1의 외부 `@import`이므로 아래 인계 항목으로 기록.

### 0-2. 관찰된 추가 사실 (S2 감점 아님, 인계)
- 브라우저에서 `/nope`·`/article/999999`의 **하이드레이션 후 `document.title`이 `Not Found - LiveNews | LiveNews`**로 바뀐다(SSR 제목은 정확). 원인: `src/app/[country]/page.tsx:30`, `src/app/article/[id]/page.tsx:17`의 generateMetadata가 미존재 시 `{ title: 'Not Found - LiveNews' }` 반환 → RSC 메타데이터가 덮어씀. SPEC 계약 D-5가 S4에 배정한 항목. verify T4는 SSR HTML만 검사하므로 이 차이를 잡지 못한다.
- 홈·국가 페이지의 `NewsletterBanner`는 플래그 off에서도 여전히 렌더되고 `setSubmitted(true)` 가짜 "구독 완료!"를 유지(`NewsletterBanner.tsx:30-34, 58`). SPEC 계약 C가 S3에 배정. 푸터 쪽(S2 책임)은 해결됨.
- `mobile|ranking` 깨진 이미지 13→14(+1, api/img) — 랭킹 데이터 변동에 따른 것으로 S2 파일과 무관(D2~D5, S3).

---

## 1. SPEC 개선 항목 검증

- **[PASS] 항목 1 (D10 관리자 크롬 분리)**: `Header`/`Footer` 기본 export가 `usePathname()` → `isAdminPath` 게이트 후 `SiteHeader`/`SiteFooter` 렌더(훅 순서 불변). T1 PASS(4개 관리자 경로 × 375/1440: SSR에 `<header|<footer|Hacker News|뉴스레터` 없음, visible nav 1, fixed 0, 통계 요청 0). `admin/layout.tsx:18` 바가 `max-w-7xl mx-auto px-4` 안으로 이동 → 1440 스크린샷에서 로고·"소스 관리 (0)" 제목 x=96 정렬 일치. 375에서 "LiveNews Admin"·"사이트로 돌아가기" 각 1줄, 현재 메뉴 오렌지(`aria-current`). `AdminNav`의 `/admin` 정확 일치 + 나머지 `href/` 접두 일치(`/admin/sourcesX` 오탐 없음 — SPEC의 단순 startsWith보다 엄밀).
- **[PASS] 항목 2 (D9 실제 404)**: `layout.tsx`에서 Suspense/Loading 제거, `src/app/loading.tsx` 삭제, `PageSkeleton`(`role=status aria-live aria-busy` + sr-only), `breaking/ranking/category/[slug]` 1줄 re-export만 존재. curl 6경로 404 + SSR 제목 정확. T4 PASS(목록 경로 클라이언트 이동 시 스켈레톤 관측 포함).
- **[PASS] 항목 3 (D26 오류 화면)**: `ErrorPage`, `h1`, `<a href={withBasePath('/')}>`, `startTransition(() => { router.refresh(); reset(); })` + 전환 중 버튼 비활성. 하네스 T3 PASS(recovered=true, 홈 200).
- **[PASS] 항목 4 (D11 뉴스레터 플래그)**: `newsletter.ts`가 SPEC 계약 C와 정확히 일치(리터럴 `process.env.NEXT_PUBLIC_NEWSLETTER_ENABLED`, 정확히 `'true'`, 2xx만 ok). Footer: 플래그 off → 열 미렌더 + 완전 리터럴 `lg:grid-cols-3`/`lg:grid-cols-4` 분기, 배너 경로 숨김, sr-only `<label htmlFor>`, 제출 중 disabled, 실패 문구 `role=status`, 타이머 언마운트 정리. `.env.example` 문구 SPEC과 동일. T2·T2B PASS.
- **[PASS] 항목 5 (공개 통계 API)**: `/api/stats` force-dynamic, `getCached('site:stats',60)`, 반환 시 3키만 재구성(캐시 오염 대비), 실패 500 `{error}`. `useSiteStats` 모듈 스코프 in-flight + lastValue + 공유 타이머(구독자 0 시 정리). 실측 요청 1회, admin 0회, T7 PASS(psql KST 자정 집계 일치). `grep livenews/api` Header/Footer 0건.
- **[PASS] 항목 6 (KST 시계·연도)**: `formatKstClock`/`kstYear` 순수 함수, LiveClock `<time dateTime=ISO-Z>` + `KST` 라벨, 마운트 전 null. Footer `kstYear()` + 연도 직접 부모 `<p suppressHydrationWarning>`, `getFullYear` 없음. T5·T6 PASS(Seoul/LA/UTC 동일 KST).
- **[PASS] 항목 7 (닫힌 패널 포커스 차단·ARIA)**: 3개 패널 `invisible` + visibility 포함 transition 리터럴, id 3개, 4개 토글 모두 `aria-expanded`+`aria-controls`(국가 `aria-haspopup`), nav 레이블 3종, 활성 링크 `aria-current`, ESC 시 연 토글로 포커스 복귀, HN `aria-label="Hacker News (새 창)"`, SearchBar `aria-label`. T8 PASS.
  - **SPEC 이탈 판단 — `scrollIntoView` → `ul.scrollTo`: 타당.** `planner-s2-scrollintoview.js`를 직접 재실행: `none → 본문 바로가기`, `scrollIntoView → Hacker News (새 창)`, `scrollTo → 본문 바로가기`. Chromium에서 scrollIntoView가 순차 포커스 시작점을 옮겨 첫 Tab이 바로가기 링크를 건너뛰는 것이 재현됨. scrollTo는 가로 스트립만 움직여 페이지 세로 스크롤 부작용도 없음(1024px `/category/sports`: 활성 항목 가시, `scrollY 0`, 첫 Tab "본문 바로가기"). 동일 시각 효과(중앙 정렬, smooth) 유지.
- **[PASS] 항목 8 (접힌 헤더 포커스 가림)**: `focusWithin` + onFocus/onBlur(relatedTarget 검사), `collapsed`에 `!focusWithin`. T14 PASS. 직접 실측: 접힘 후 Shift+Tab → 포커스 "중국" top 51px, header transform `none`(재확장).
  - **SPEC 이탈 판단 — `:focus-visible`일 때만 focusWithin: 타당.** 직접 실측(`$SP/eval-s2-ux.js`): 마우스로 데스크톱 내비 "경제" 클릭 → 클라이언트 이동 후에도 `document.activeElement`가 헤더 안 링크("경제")에 남음 → 스크롤 다운 시 header transform `matrix(…,-48)`로 **정상 접힘**. SPEC 원안대로였다면 이 상태에서 헤더가 영구히 펼쳐져 "마우스 사용자의 접힘 경험 불변" 요구를 위반했을 것. `matches(':focus-visible')` 미지원 시 true로 폴백(접근성 쪽으로 안전한 실패). 키보드 경로는 T14로 확인.
- **[PASS] 항목 9 (바로가기 대비)**: `focus:text-surface`, ratio 7.48 (T10). `main tabIndex={-1}`.
- **[PASS] 항목 10 (가로 모드 메뉴)**: 열림 `max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain`. T9: overflowY auto, clientH 254 < scrollH 339, 18링크 모두 도달.
- **[PASS] 항목 11 (404 좁은 화면·푸터 시맨틱)**: 버튼 행 `flex-wrap`, `whitespace-nowrap`, `px-5 sm:px-6`, 404 숫자 `aria-hidden`. 320px: docW 320, 버튼 높이 40/42. 푸터 h3 0, h2 4, 노출 이모지 0 (T11·T12).
- **[PASS] 항목 12 (단위 테스트)**: SPEC 표의 모든 행이 단언으로 존재함을 대조(BASE_PATH↔next.config.js 정규식, withBasePath 4케이스+SITE_STATS_PATH, isAdminPath 4 true/8 false, formatKstClock·kstYear·startOfKstDay를 4개 TZ 루프, NaN RangeError, parseSiteStats 1 ok + 추가키 제거 + 10 bad, isFlagOn 1 true/9 false + NEWSLETTER_ENABLED, ENDPOINT, banner 5/7, subscribeNewsletter 200/201/404/500/throw/''/not-an-email + fetch 미호출 + Content-Type 추가 단언). 기본·LA TZ 모두 통과.

**12/12 PASS.** 수정 금지 파일(page.tsx 전부, middleware.ts, api/admin/*, NewsletterBanner.tsx, utils.ts, constants.ts, S5 백엔드) `git diff HEAD~1` 변경 0.

---

## 2. 채점

### 디자인 품질: 8/10
- 기존 다크 토큰(surface/card/elevated, accent #f0883e, text-muted)만 사용, 새 색·그라데이션 0. 관리자 화면은 사이트 크롬이 사라져 단일 관리자 바만 남고 1440에서 로고·본문 정렬이 맞음. 404는 320에서도 버튼이 한 줄 라벨로 안정적. 푸터 3열은 빈 트랙 없이 균등(400×3).
- 감점: ① 375px 관리자 바가 3줄(브랜드 / 메뉴 / "사이트로 돌아가기")로, 복귀 링크가 좌측 단독 행에 떠 있어 바 높이가 커짐(깨짐은 아니나 정돈감 부족). ② `KST` 라벨이 부모와 같은 `text-text-muted` — 크기·굵기만 다르고 색 위계가 없어 Bloomberg식 "단위 표기"로서의 존재감이 약함. ③ 홈 화면은 여전히 이미지 대체 텍스트가 노출(S3 범위, 감점 제외).

### 독창성: 7/10
- 해결 방식이 근거 기반이고 차별적: D9를 "루트 경계 제거 + notFound 없는 세그먼트에만 loading" 구조 규칙으로 해결하고 계약 D로 후속 슬라이스까지 묶음, 뉴스레터를 "숨김 + 정직한 실패" 플래그로 처리, 공개/관리자 통계 분리. 두 SPEC 이탈(scrollTo, focus-visible)도 실측으로 정당화된 개선.
- 감점: 시각적 독창 요소는 KST 라벨 1개뿐(결함 수정 라운드이므로 큰 감점은 아님).

### 기술적 완성도: 9/10
- tsc 0, 테스트 70/70(두 TZ), 클린 빌드 성공, verify 14/14 + T2B. 순수 로직을 `site.ts`/`newsletter.ts`로 분리해 테스트 가능, 하드코딩 basePath 제거, 통계 요청 공유, 응답 키 화이트리스트, 타이머 정리, 리터럴 Tailwind 클래스.
- 감점: ① `LiveClock`의 `{clock.label}<span>KST</span>`는 텍스트 노드 사이 공백이 없어 접근성 이름이 `01:41:48KST`로 붙어 읽힘(verify T6 출력에서 확인). ② 404 페이지의 `Event` 오류는 S1 외부 `@import`가 근본 원인이지만 S2가 404를 활성화하면서 표면화됨 — 기록은 했으나 완화책(예: 인계 문서화 외 조치)은 없음.

### 기능성: 8/10
- 관리자 3중 내비 제거, 실제 404, 오류 화면 복귀·재시도 동작, 푸터 가짜 성공 제거, KST 일관, 키보드 사용성(보이지 않는 Tab 정지 0, ESC 복귀, 접힘 헤더 재확장) 모두 실측 확인.
- 감점(인계 성격): 사용자가 보는 결과로는 ① 홈/국가 페이지 `NewsletterBanner`의 가짜 구독 폼이 플래그 off에서도 그대로 남음(S3), ② 404 브라우저 탭 제목이 하이드레이션 후 `Not Found - LiveNews | LiveNews`(S4). 둘 다 SPEC상 타 슬라이스 몫이라 S2 감점은 최소화.

### 회귀 안전: 9/10
- audit 156레코드: 신규 OVERFLOW 0, scrollWidth/빈 화면/스피너 변화 0. 신규 콘솔·실패요청은 의도된 200→404 6건과 그에 수반된 차단 환경 `Event`뿐. S1 성과(죽은 이미지 ID 0, overflow 3건 동일) 유지. 기존 공개 라우트 200, 관리자 대시보드는 여전히 `/api/admin/stats` 사용(변경 없음). 백엔드/워커 파일 무수정, 데이터 영향 없음.
- 감점: 홈·기사·국가·검색 경로의 클라이언트 이동 스켈레톤이 사라짐(SPEC 의도된 트레이드오프, 로컬 15~70ms).

---

## 3. 판정

**전체 판정**: 합격
**가중 점수**: 8.2 / 10.0  ( 8×0.3 + 7×0.2 + 9×0.25 + 8×0.15 + 9×0.1 = 2.40 + 1.40 + 2.25 + 1.20 + 0.90 = 8.15 )

**항목별 점수**:
- 디자인 품질: 8/10 — 기존 토큰만으로 관리자/404/푸터 정돈, 모바일 관리자 바 3줄·KST 라벨 위계 약함
- 독창성: 7/10 — 실험 근거의 구조 규칙(D9 계약)·정직한 플래그·공개/관리자 통계 분리, 시각 요소는 KST 라벨뿐
- 기술적 완성도: 9/10 — tsc 0, 70/70(2 TZ), 빌드 성공, verify 14/14+T2B; 시계 접근성 이름 공백 누락
- 기능성: 8/10 — S2 결함 전부 해소 실측; 홈 배너 가짜 폼(S3)·404 클라이언트 제목(S4) 잔존
- 회귀 안전: 9/10 — 신규 overflow 0, 신규 오류는 의도된 404 6건뿐, 금지 파일 무수정

**구체적 개선 지시** (합격 — 필수 아님, 후속 라운드/인계용):
1. `src/components/Header.tsx:35-36` (S2 경미): `{clock.label}` 뒤 `KST` span 앞에 공백을 넣거나(`{clock.label}{' '}<span…>KST</span>`) span에 `aria-label`이 아닌 실제 공백 텍스트를 두어 스크린리더가 "01:41:48 KST"로 읽게 할 것. 시각 간격은 기존 `gap-1.5`가 유지.
2. `src/app/admin/layout.tsx:18-28` (S2 경미, 선택): 375px에서 "사이트로 돌아가기"가 단독 3번째 행으로 떨어짐. 바깥 flex를 `items-start`로 두고 복귀 링크를 브랜드와 같은 1행 우측에 두는 구조(브랜드+복귀 1행 `justify-between`, AdminNav 2행)로 바꾸면 2행으로 정돈됨.
3. **S3 인계** `src/components/NewsletterBanner.tsx:30-34, 58`: 계약 C대로 `if (!NEWSLETTER_ENABLED) return null;`(훅 이후) + `subscribeNewsletter` 결과로만 성공 표시 — 현재 플래그 off에서도 홈 main에 email 입력 1개와 가짜 "구독 완료!"가 남아 있음(실측).
4. **S4 인계** `src/app/[country]/page.tsx:30`, `src/app/article/[id]/page.tsx:17`: 미존재 시 `{ title: 'Not Found - LiveNews' }` 반환을 제거하고 `notFound()` 호출(또는 title 미지정)로 바꿔 하이드레이션 후 탭 제목이 `페이지를 찾을 수 없습니다 | LiveNews`로 유지되게 할 것(계약 D-5). verify T4에 `document.title`(하이드레이션 후) 검사 추가 권장.
5. **S1/S4 인계(선택)** `src/app/globals.css:4`: 외부 `@import` 대신 Pretendard를 `next/font/local`로 자체 호스팅하거나 `<link rel="stylesheet">`로 분리하면, 폰트 CDN 차단 사용자에게 404 페이지에서 나는 uncaught `Event` 오류(본 보고서 0-1)가 사라짐. 운영(CDN 접속 가능)에서는 재현되지 않으므로 우선순위 낮음.

**방향 판단**: 현재 방향 유지
