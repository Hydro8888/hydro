# 자체 점검 — 슬라이스 S2 (Unslop 재작업 라운드, Generator 1회차)

기준 문서: `SPEC-S2.md`(항목 1~21), `UNSLOP-AUDIT.md` 3절·6절·**7절(SPEC과 다르면 7절 우선)**, `.claude/skills/unslop`(unslop by Damir Sokolovsky [@heydamir](https://x.com/heydamir), CC BY 4.0).
이번 라운드 규칙에 따라 generator.md의 "대신 시도할 것"(비대칭·스크롤 효과·마이크로 애니메이션)은 적용하지 않았다. 새 장식·새 기능·새 주장 없음, 섹션·기능·순서 유지.
S1 파일(`tailwind.config.ts`, `globals.css`, `utils.ts`, `ui.ts`, `constants.ts`)은 읽기만 했다.

## SPEC 개선 항목 체크

- [x] 항목 1 (웹폰트 비차단): `layout.tsx` `<head>`에 preconnect 3개 + 인라인 스크립트(`<link data-webfonts>` 주입) + `<noscript>`. **7-8**에 따라 Pretendard(jsDelivr dynamic-subset)도 같은 방식으로 함께 불러온다(링크 2개). `next/font`·`media="print"`·CSS `@import` 없음. **추가**: 404 응답은 브라우저가 직접 그리는 빈 셸(`<html id="__next_error__">`)이라 인라인 스크립트가 실행되지 않는 것을 발견 → 마운트 후 빠진 링크만 채우는 `WebFontLinks`(아래 "SPEC과 다르게 한 점" 1).
- [x] 항목 2 (layout 크롬): `themeColor '#161513'`, 설명문 `전 세계 주요 뉴스를 한국어로 번역·요약해 전하는 뉴스 서비스`, 본문 바로가기 = `bg-text` + `text-accent-ink` + `rounded-control` + 500. `main`의 `focus:outline-none` 유지.
- [x] 항목 3 (아이콘 한 벌): `src/components/icons.tsx` — 기본 `<Icon>` 한 곳에만 16px(`h-4 w-4`)·선 1.5·`currentColor`. named export 9개(`SearchIcon, MenuIcon, CloseIcon, HomeIcon, BoltIcon, GlobeIcon, ExternalIcon, MailIcon, CheckIcon`). 다섯 파일의 인라인 `<svg>` 0개. sparkle·막대 차트·경고 삼각형·왼쪽 화살표 삭제.
- [x] 항목 4 (버튼 클래스): **7-7·15**에 따라 `src/components/ui.ts`를 만들지 않고 `@/lib/ui`의 `BTN_PRIMARY / BTN_SECONDARY / FIELD / CHIP / CHIP_CURRENT / NUM`을 import. 줄어들면 안 되는 두 곳(검색·구독 버튼)에만 `shrink-0`을 덧붙였다.
- [x] 항목 5 (워드마크): **7-16** — `LiveNews`(`text`) + `.co.kr`(`text-secondary`), 18px/600, 빨간 점·펄스 삭제. 헤더·푸터 같은 마크업, 관리자는 `LiveNews Admin`(`text`, 600).
- [x] 항목 6 (통계·시계): `오늘 88건 업데이트 · 전체 409건` 한 문장, 숫자만 `font-mono tabular-nums`(`NUM`), `formatCount`. 시계는 날짜(Pretendard) + `HH:mm:ss KST`(mono). 점·펄스·주황 숫자·10px·자간 삭제.
- [x] 항목 7 (검색 토글·키캡·모바일 버튼): 데스크톱 토글 32px(`CHIP`), 열림 = 면 한 단계(`aria-expanded:` 변형), 키캡 20×20/6px/mono 12px, 모바일 버튼 40×40, 햄버거 span 3개 → `MenuIcon`/`CloseIcon`.
- [x] 항목 8 (헤더 표면·검색 펼침): 불투명 `bg-surface`, `transition-transform duration-200`, 검색 펼침은 opacity만(열렸을 때 overflow 자르지 않음), `--nav-h` 인라인 스타일 삭제, 플레이스홀더 `뉴스 검색`.
- [x] 항목 9 (데스크톱 내비): `NAV_LINK/NAV_IDLE/NAV_ACTIVE`, 모든 링크 40px 한 줄, 주황은 현재 항목 하나, Hacker News 중립, 랭킹 아이콘 삭제, `-mx-3`으로 첫 글자 = 워드마크 왼쪽 선.
- [x] 항목 10 (모바일 메뉴): opacity만 전환, 라벨 `text-overline`(대문자·자간 없음), 행 40px·칩 32px·모서리 8, `COUNTRY_LINKS`로 중복 계산 제거.
- [x] 항목 11 (하단 탭·플라이아웃): `bg-surface-deep`, 탭 56px 전체가 터치 영역, 아이콘 16px, 라벨 12px, "국가"는 **현재 위치**일 때 주황, 플라이아웃 `shadow-float` + 4px rise, 모서리 12 − 여백 4 = 행 8.
- [x] 항목 12 (SearchBar): 입력(`FIELD`) + 옆 버튼(`BTN_PRIMARY`) 40px 두 개, 간격 8px, 포커스는 전역 링(로컬 링 삭제).
- [x] 항목 13 (푸터 소개·카테고리·바로가기): `bg-surface-deep`, AI 배지 → 평범한 문장 2줄, 이모지·sparkle 없음, 라벨 `text-overline`, 모든 링크 32px 행.
- [x] 항목 14 (연락처·소셜): **7-17** — `github.com/livenews`, `twitter.com/livenews_kr` 링크 삭제, `contact@livenews.co.kr` 한 행만. 남는 항목이 없어 "소셜" 제목도 뺐다(실제 주소를 받으면 같은 행 모양으로 복원).
- [x] 항목 15 (뉴스레터 폼): **7-20** 문구 `주요 뉴스를 이메일로 받아 보세요`, 성공은 중립 글자 + `CheckIcon`, 오류 `text-negative`, 입력 `FIELD`, 버튼 `BTN_PRIMARY`. `label`/`htmlFor`/`role="status"`/제출 로직 불변.
- [x] 항목 16 (하단 바·통계): `<strong>` 0개, `formatCount` 3곳, 구분자 `·`, 숫자 mono.
- [x] 항목 17 (error.tsx): 블러 블롭·원형 타일·경고 아이콘·진입 애니메이션 삭제. h1 + 문장 + 오류 코드(mono) + 버튼 2개. 재시도 로직·basePath 불변.
- [x] 항목 18 (not-found.tsx): 작은 mono `404` + h1 + 문장 + `홈으로`/`뉴스 검색`. 거대 숫자·블롭·아이콘 삭제. `metadata` 불변, 서버 컴포넌트 유지.
- [x] 항목 19 (관리자 바·내비): 워드마크 중립, 내비 링크 32px/500, 돌아가기 링크 `text-secondary` + 전환. 주황은 현재 메뉴 하나.
- [x] 항목 20 (스켈레톤): **7-18** — `animate-fade-in`·`shimmer` 10곳 삭제(정지 면), `rounded-tag`, 카드 `p-5`. `role="status" aria-live aria-busy` + sr-only 유지.
- [x] 항목 21 (정적 테스트): `tests/chrome-unslop.test.ts` 28개 — 금지 패턴 15종 × 크롬 파일 12개, 아이콘, 글꼴 로딩, 워드마크·컨테이너·푸터 사실, loading 경계.

### 7절 반영 요약
| 7절 | 반영 |
|---|---|
| 6 컨테이너 | `mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8` — Header(1단·내비·모바일 메뉴), Footer, 관리자 바·관리자 본문 래퍼, PageSkeleton. 테스트로 고정 |
| 7·15 `src/lib/ui.ts` | 6개 파일이 `@/lib/ui`에서 import. `src/components/ui.ts` 없음(테스트로 고정) |
| 8 글꼴 3종 비차단 | 위 항목 1 |
| 9 진입 애니메이션 0 | S2 파일에 `animate-*` 0건 |
| 16 워드마크 | 위 항목 5 |
| 17 확인 불가 링크 | 위 항목 14 |
| 18 스켈레톤 정지 | 위 항목 20 |
| 19 스크롤 줄 안 포커스 링 | 내비 링크·하단 탭에 `focus-visible:-outline-offset-2` (계산값 `-2px`) |
| 20 구독 문구 | 위 항목 15 (`NewsletterBanner`의 같은 문구는 S3) |
| 21 icons.tsx | S2가 생성. S3는 `<Icon>`으로 감싼 named export를 추가만 하면 된다 |

## 수정 파일 목록

- `src/components/Header.tsx`: 전면 정리(615 → 540줄). 로직(키 핸들러·포커스 복귀·접힘·자동 스크롤·`isAdminPath`)은 손대지 않음.
- `src/components/Footer.tsx`: 325 → 226줄. 로직 불변.
- `src/components/SearchBar.tsx`: 입력 + 옆 버튼 구조. props 시그니처 불변.
- `src/components/AdminNav.tsx`: 링크 높이·굵기.
- `src/components/PageSkeleton.tsx`: 정지 면, 공통 컨테이너.
- `src/app/layout.tsx`: 글꼴 `<head>`, 테마색, 설명문, 바로가기, `<WebFontLinks>`.
- `src/app/error.tsx`, `src/app/not-found.tsx`: 같은 구성의 조용한 화면.
- `src/app/admin/layout.tsx`: 워드마크, 공통 컨테이너, 돌아가기 링크.
- 신규 `src/components/icons.tsx`: 아이콘 한 벌.
- 신규 `src/components/WebFontLinks.tsx`: 404 셸용 글꼴 링크 보충(클라이언트, 26줄).
- 신규 `tests/chrome-unslop.test.ts`: 정적 회귀 테스트 28개.
- 변경 없음(확인만): `loading.tsx` 3개(한 줄 재수출 그대로), `src/app/loading.tsx` 없음.

검증 스크립트·로그(git 무시 폴더 `qa-out/`): `gen-s2-check.js`(체커 사본), `gen-s2-check.log`, `gen-s2-check-planner-original.log`, `gen-s2-shots.cjs` + `gen-s2-shots.log`, `gen-s2-widths.cjs`, `gen-s2-probe.cjs`, `gen-s2-fonts/`(dev·prod 글꼴 실험 앱 + `dev-result.log`, `prod-result.log`), `gen-s2-test.log`, `gen-s2-restart.log`, 화면 `gen-s2-{d,m}-*.jpg`, `gen-s2-w*-header.jpg`, `gen-s2-after-*.jpg`.

## 검증 결과

| 검사 | 결과 |
|---|---|
| `npx tsc --noEmit` | 종료 코드 0 |
| `npm test` | **274 통과 / 실패 0** (시작 시 241 + 이 슬라이스 28 + 같은 시간에 들어온 S1 후속 5) |
| `bash scripts/qa/local-env.sh restart` | `APP UP (2s, css 200)`, `Compiled successfully`, 정적 페이지 17/17 |
| `node qa-out/gen-s2-check.js` (7절 기대값 사본) | **131 / 131** |
| `node qa-out/planner-s2-check.js` (원본, 수정 없음) | 113 / 131 — 실패 18건은 아래 3가지 기대값 × 6(뷰포트 2 × 페이지 3)뿐 |
| 정적 테스트 변이 확인(임시 사본에서) | `font-bold` 삽입, 선 굵기 2, GitHub 링크 복원, 스크립트 → 정적 `<link>` 4종 모두 실패로 잡힘 |
| 라우트 상태코드 | `/livenews` 200, `/nope` 404, `/article/999999` 404, `/admin` 무인증 401 / 인증 200, `/breaking` `/ranking` `/category/economy` `/search?q=AI` `/us` `/world` `/article/1` 200 |

### 체커 사본에서 바꾼 기대값 (`qa-out/gen-s2-check.js`, 파일 머리 주석에도 기록)
1. **워드마크** (7-16): `logoText === 'LiveNews.co.kr'`, 색 2개 `[text, text-secondary]`, 굵기 600. 원본은 `LiveNews` + 색 1개.
2. **푸터 첫 줄** (7-16): `LiveNews.co.kr`. 원본은 `LiveNews`.
3. **글꼴 링크** (7-8): `link[data-webfonts]` 2개(Pretendard, Google), 두 스타일시트 모두 `non-blocking`, preconnect 3개. jsDelivr도 모의·4초 지연·차단 대상에 포함. 원본은 링크 1개·preconnect 2개.
4. 기타: 스크린샷 이름 `gen-s2-after-*`, `CHROME_PATH` 기본값 `/opt/pw-browsers/chromium`. 검사 로직(감사 함수)은 그대로.

### 화면 확인 (Playwright, 실제 글꼴을 프록시로 받아서 촬영 — 직접 열어 봄)
1440px: 홈·홈 푸터·기사·404·관리자(`/admin/sources`)·`/us`·검색 펼침·내비 포커스·본문 바로가기. 390px: 홈·메뉴 열림(`/`, `/us`)·국가 플라이아웃·푸터·기사·404·관리자. 320/640/820/1024/1280px 헤더.

| 확인한 것 | 측정값 |
|---|---|
| 왼쪽 정렬선(1440) | 워드마크 x=112, 내비 첫 글자 x=112, 푸터 x=112, 관리자 바·본문 x=112. "랭킹" 끝 x=1328 = 검색 토글 오른쪽 |
| 내비 | 링크 13개(Hacker News·랭킹 포함) 모두 40px·같은 top, 주황은 현재 항목 1개(`/us` → `미국`), `/nope` → 0개. 줄 스크롤 없음(1024px에서 984/984) |
| 통계·시계 | `오늘 88건 업데이트 · 전체 409건`, `11월 12일 (목) 11:16:04 KST`, 숫자·시각 글꼴 `IBM Plex Mono` |
| 검색 | `/` → 입력 포커스, 링 `solid 2px rgb(240,136,62)` offset 2px, `box-shadow: none`, 입력·버튼 40px·모서리 8px·간격 8px, Enter → `/livenews/search?q=AI`, ESC → 토글로 포커스 복귀 |
| 포커스 | 첫 Tab = 본문 바로가기(`rgb(239,233,222)` 면 / `rgb(22,21,19)` 글자), 내비 링크 링은 안쪽(`-2px`)이라 잘리지 않음 |
| 닫힌 패널 | Tab 순회에서 닫힌 검색·메뉴·플라이아웃 안으로 포커스 0회(데스크톱·모바일 폭) |
| 모바일 | 버튼 40×40, 아이콘 오른쪽 끝 = 374px(가장자리 16px 선), 탭 4개 97.5×56·12px, 가로 스크롤 없음(320~1280 모두) |
| 메뉴·플라이아웃 | 메뉴 열림 `aria-expanded=true` + 아이콘 ✕ 경로, ESC → 메뉴 버튼 포커스·`visibility: hidden`. 플라이아웃 그림자 `rgba(0,0,0,0.35) 0 8px 24px`, 오른쪽 16px, 행 40px/8px, ESC → 국가 버튼 |
| 푸터 | 외부 링크는 `mailto:` 1개뿐, 링크·행 높이 모두 32px, `<strong>` 0, SVG 1(메일), `/api/stats` 요청 1회 |
| 404 | 제목 `페이지를 찾을 수 없습니다 \| LiveNews`, `404` mono 12px, h1 500/28px, 버튼 40px/8px(`홈으로` → `/livenews`), 글꼴 링크 2개 |
| 관리자 | 사이트 헤더·푸터·하단 탭 없음, 워드마크 `rgb(239,233,222)` 600, 주황 = `소스 관리` 하나, 내비·돌아가기 32px |
| 콘솔 | 하이드레이션·React 경고/오류 **0건**(전 시나리오). 남은 로그는 ① 픽스처의 가짜 이미지 주소 415(S1에서 보고된 것) ② `/nope` 문서의 404 ③ 스크립트가 다음 페이지로 넘어가며 끊은 프리페치("Failed to fetch RSC payload") — 가만히 5초 둔 상태에서는 콘솔 0건임을 `gen-s2-probe.cjs`로 확인 |

### 글꼴 로딩
| 조건 | 결과 |
|---|---|
| 실제 네트워크(프록시) | 스타일시트 2개 모두 `renderBlockingStatus: non-blocking`, 로드된 글꼴 `Pretendard Variable`, `IBM Plex Mono`(Noto Serif KR은 S3·S4가 쓰기 전이라 아직 요청되지 않음). 렌더 차단 리소스는 자체 CSS 1개뿐 |
| 글꼴 호스트 3곳 4초 지연 | FCP가 기다리지 않음(체커 PASS, FCP < 2.5s) |
| 글꼴 호스트 3곳 차단 | 정상 표시(본문 4,777자, FCP 168ms), 콘솔 경고 0(네트워크 실패 줄만) |
| dev 모드 하이드레이션 (`qa-out/gen-s2-fonts`, :4107, 서빙된 인라인 스크립트가 :4000과 md5 동일) | `/`, `notFound()` 페이지, 없는 경로 × 정상·지연·차단 = 9회 모두 React 경고 0, `router.refresh()`·소프트 내비 뒤에도 링크 2개 그대로 |
| prod 모드 (같은 앱) | 9회 모두 경고 0, 링크 2개 유지, FCP 48~116ms(FCP가 기록된 7회) |

## SPEC과 다르게 한 점

7절 때문에 바뀐 것(워드마크 `.co.kr`, 링크 삭제, `ui.ts` 위치, Pretendard, 컨테이너)은 위 표에 있다. 그 밖:

1. **`WebFontLinks.tsx` 신규(SPEC 목록에 없는 파일).** 이 앱의 404(`/nope`, `/article/999999` — 페이지가 `notFound()`를 던지는 경우)는 `<html id="__next_error__">` 빈 셸로 오고 브라우저가 화면을 그린다. React가 브라우저에서 만든 `<script>`는 실행되지 않아, SPEC 방식만으로는 404 화면에 글꼴 링크가 0개였다(첫 실행에서 체커 129/131, 실패 2건이 `[d/notfound]`·`[m/notfound]` 글꼴). 마운트 후 `link[data-webfonts]` 중 빠진 것만 붙이는 26줄짜리 클라이언트 컴포넌트를 더했다. 일반 페이지에서는 인라인 스크립트가 이미 넣었으므로 아무 일도 하지 않는다.
2. **워드마크 링크 높이 `h-8`**(SPEC `h-12`). 48px 전체 높이면 포커스 링(2px + offset 2px)이 뷰포트 위로 잘린다.
3. **내비 `<nav>`에 `h-10` 없음, `<li className="flex">`.** `border-t` 1px + 40px 줄이라 `h-10`이면 줄이 1px 넘친다. `li`를 flex로 해 링크가 정확히 40px.
4. **통계 구분점 앞뒤에 실제 공백**(`{' '}` + `mx-1`, SPEC은 공백 없이 `mx-2`). 구분점이 `aria-hidden`이라 공백이 없으면 스크린 리더가 `업데이트전체`로 붙여 읽는다. 통계 상자는 `mx-4`(잘릴 때 오른쪽 묶음과 16px 유지).
5. **검색 토글·국가 칩은 `ui.ts`의 `CHIP` / `CHIP_CURRENT`.** 토글의 열림 표시는 `aria-expanded:bg-surface-elevated aria-expanded:text-text`(상태를 aria 속성 한 곳에서 읽음). 현재 국가 칩은 SPEC의 주황 테두리가 아니라 `ui.ts` 정의(면 한 단계 + 헤어라인 + 주황 글자).
6. **플라이아웃의 현재 행에 `bg-surface-elevated`**(SPEC은 주황 글자만) — 모바일 메뉴의 현재 항목과 같은 표시.
7. **버튼 값은 `ui.ts` 그대로**(`px-4`, `text-body-md`, 보조 버튼 hover = 테두리). `disabled:cursor-wait`는 `ui.ts`의 `disabled:cursor-not-allowed`와 같은 변형끼리 겹쳐 덧붙이지 않았다.
8. **"소셜" 섹션 제거, `GithubIcon`·`XIcon`·`Glyph` 미작성.** 7-17로 두 링크가 빠져 쓸 곳이 없다(쓰지 않는 export를 만들지 않음).
9. **푸터 행은 `<li className="flex">` + `inline-flex h-8`**(SPEC `flex`) — 포커스 링과 클릭 영역이 글자 폭에 맞고 행 높이가 정확히 32px.
10. **관리자 바·본문 래퍼를 공통 컨테이너로**(SPEC은 `max-w-7xl px-4` 유지). 폭은 같고(1280px) 가장자리 여백만 16/24/32.
11. **정적 테스트**: 파일 목록에 `icons.tsx`·`WebFontLinks.tsx`·`src/lib/ui.ts` 추가. 예외 2개 — `icons.tsx`는 반 단계 규칙(패스 데이터 `l-7.5`)과 svg 규칙, `ui.ts`는 원 규칙(관리자 표의 8px 상태 점 `rounded-full`). lookbehind·`u` 플래그 정규식은 `new RegExp()`(tsconfig target 때문). 아이콘 단언은 S3가 아이콘을 추가해도 통과하도록 "모든 기본 svg가 같은 크기·굵기", "export된 아이콘은 src 어딘가에서 쓰인다"로 썼다.
12. **preconnect 3개**(`cdn.jsdelivr.net` 추가, 글꼴 파일이 CORS 요청이라 `crossOrigin`).

## S1 파일에서 본 것 (고치지 않음 — 보고만)

- `globals.css`의 `.nav-link`, `.nav-link-active`: S2가 더 쓰지 않아 죽은 클래스가 됐다. 통합 단계에서 삭제 대상.
- `ui.ts`에 페이지 컨테이너 상수가 없다. 7-6의 문자열이 S2 파일 4곳에 리터럴로 있고(테스트로 고정), S4도 모든 페이지에 같은 문자열이 필요하다 → `ui.ts`에 `CONTAINER` export를 두면 한 곳이 된다.
- `tailwind.config.ts`에 `future.hoverOnlyWhenSupported`가 없어 터치 기기에서 탭한 뒤 `hover:` 스타일이 남는다(모바일 스크린샷에서 방금 누른 탭·메뉴 버튼이 hover 색). 결함이라기보다 선택 사항.
- 그 밖의 결함은 발견하지 못했다. 작업 중 S1 후속 수정(커밋 `c3374ea`, `b63cf89` — `b/strong/th` 굵기, placeholder 색, 기본 transition 속성·easing, ring 색)이 들어왔고, 위 최종 수치는 모두 그 뒤에 다시 빌드해 잰 것이다.

## 뒤 슬라이스에 넘기는 것

- **S4**: 페이지들이 아직 `max-w-screen-xl px-4`라 1440px에서 본문 왼쪽 선(x=96)이 헤더·푸터(x=112)와 16px 어긋난다. 7-6대로 페이지 컨테이너를 바꾸면 맞는다.
- **S3**: 아이콘은 `icons.tsx`에 `<Icon>`으로 감싼 named export로 추가. `NewsletterBanner`의 "매일 아침 AI가 선별한 …" 문구(7-20). `NewsCardSkeleton`은 `PageSkeleton`처럼 정지 면(7-18).
- **사용자 확인 필요**: `github.com/livenews`, `twitter.com/livenews_kr`의 실제 주소(받으면 푸터에 복원), `contact@livenews.co.kr`이 실제 수신 주소인지.

## 디자인 자체 평가

- AI slop 패턴 사용 여부: S2 파일에는 없음 — 다색 워드마크, 그라데이션, 블러, 글로우, 색 그림자, 이모지, sparkle, 알약, 대문자·자간 라벨, 700 이상 굵기, 펄스·shimmer·진입 애니메이션, `transition-all`, 반 단계·임의 px, 강조색 면 버튼 모두 0건(정적 테스트 + 계산된 스타일 체커 131건으로 확인).
- 독창적 요소: 새로 더한 장식은 없다. 이 제품에만 맞는 것은 SPEC이 지목한 두 가지 — 헤더의 KST 고정폭 시계와 `오늘 N건 업데이트 · 전체 N건` 통신 데스크 문장 — 그리고 정렬(워드마크·내비 첫 글자·푸터·관리자 바가 한 세로선, 내비 40px 한 줄, 아이콘 한 크기·한 굵기)이다.
- 다크 모던 테마 일관성: 크롬은 따뜻한 중립색 면 단계(`surface-deep`·`surface`·`surface-card`, hover·현재 행의 `surface-elevated`)와 헤어라인뿐이고, 주황은 "지금 있는 곳"(내비·하단 탭·국가·관리자 메뉴)에만 쓴다. 주요 버튼은 화면마다 하나, `text` 면 + `accent-ink` 글자.

## 회귀 위험 확인

- 기존 기능 영향: 없음. 상태코드 12종 동일, 키보드 동작(`/`, ESC 포커스 복귀 3종, 본문 바로가기, 닫힌 패널 Tab 제외), aria 속성, `/admin`의 사이트 크롬 숨김, 통계 요청 1회 공유, 404의 HTTP 404, 루트 `loading.tsx` 없음을 다시 확인했다. Header·Footer의 훅·효과·핸들러 코드는 수정하지 않았다(클래스와 JSX만).
- TypeScript 오류: 없음.
- 알려진 중간 상태: 위 "S4에 넘기는 것"의 16px 어긋남. 카드·페이지 안의 남은 징후(주황 "자세히 보기", 섹션 색 막대, 이모지 국기, 관리자 주황 버튼 등)는 S3·S4 파일이다.

## QA 피드백 반영 (2회차)

대상: `QA_REPORT-S2.md`(합격 7.8)의 "구체적 개선 지시" 1~9. 10번(640px 미만 시계 표시)은 사용자 확인이 필요한 선택 항목이라 하지 않았다. 방향 판단은 "현재 방향 유지" — 새 요소·새 장식 없음.

검증은 작업 트리가 아니라 격리된 `git worktree`(`qa-out/gen-s2b`, 커밋 `8735a9b` + 이번 S2 파일 7개)에서 운영 빌드를 `next start`로 띄워서 했다(끝난 뒤 worktree 삭제). 산출물은 `qa-out/gen-s2b-*`.

### 항목별 수정

| # | 지시 | 수정 | 검증 수치 |
|---|---|---|---|
| 1 (F1) | 고정 크롬이 키보드 포커스를 가림 | `src/app/layout.tsx` `<html className="dark scroll-pt-24 scroll-pb-16 lg:scroll-pb-0">` | 계산값 `scroll-padding` 1440px `96px / 0px`, 390px `96px / 64px`. Tab 90회 + 푸터에서 Shift+Tab 70회 × (`/`, `/article/1`) × (1440·390) = 8회 순회, 본문·푸터 요소 543개: 헤더·탭 바와 **겹친 요소 0, 포커스 링(4px)까지 닿은 것 0**. 헤더까지 최소 간격 6.2px(1440 Shift+Tab), 탭 바까지 최소 6.7px(390 Tab) |
| 2 (T1) | 컨테이너 문자열 5중 복사 | `Header.tsx`·`Footer.tsx`의 로컬 `CONTAINER` 삭제, `PageSkeleton.tsx`·`admin/layout.tsx`의 리터럴 3곳을 `cn(CONTAINER, …)`로. 네 파일 모두 `import { CONTAINER } from '@/lib/ui'`. 테스트는 리터럴 고정 → "import + 사용 + 파일 안에 `max-w-screen-`·로컬 상수 없음"(+ `ui.ts`의 값 한 곳 고정) | 1440px 왼쪽 선: 헤더·내비 첫 글자·푸터·관리자 바·관리자 본문·스켈레톤 모두 x=112, 390px 16 |
| 3 (T2) | 정적 테스트 구멍 | `BANNED`에 4개 추가: ① 기본 팔레트 색(보고서 정규식 그대로, `white`·`black` 포함) ② `(bg\|text\|border)-live` ③ 계약 밖 모서리 ④ `text-(xs\|sm\|base)`. 새 `describe` 1개(스크롤 여백·접힘 클래스·플라이아웃 blur) + 푸터 중복·가운뎃점 테스트 1개 | `chrome-unslop.test.ts` 28 → **36개 통과**. 변이 16종 **16/16 잡힘**(아래) |
| 4 (D1) | 모바일 메뉴 왼쪽 선 3개 | 카테고리 `<ul>`에 `-mx-3`, 칸 `justify-center` 삭제(왼쪽 정렬), Hacker News 행에 `-mx-3` | 390·320px: 라벨 2개·1열 칸 5개·Hacker News 글자·국가 칩 상자 **모두 x=16**(= 워드마크 16). 768px: 모두 x=24(= 워드마크 24). 행 높이 40px 한 가지, 메뉴·문서 가로 넘침 0 |
| 5 (D2·D3) | 푸터 `경제` 중복, 가운뎃점 표기 | `QUICK_LINKS` 필터에 `!m.href.startsWith('/category/')`(남는 5개라 죽은 `.slice(0, 6)` 삭제), `번역 · 요약되었으며` → `번역·요약되었으며` | 푸터 링크 19 → 18개, **같은 href 0쌍**, 바로가기 = `속보 세계 미국 일본 중국`, 행 높이 32px 한 가지 |
| 6 (D4) | 스켈레톤 4px 모서리 | `PageSkeleton.tsx` `rounded` 7곳 → `rounded-tag` | `/breaking` 응답을 2.5초 붙잡아 측정: 모서리 `0 / 6px / 12px`뿐, 애니메이션 0, `role=status`·`aria-live=polite`·sr-only 문구 유지 |
| 7 (D5) | 14px 줄 높이 둘 | `text-sm` → `text-body-md`: Header 4곳(내비 링크, 모바일 메뉴 칸, Hacker News 행, 플라이아웃 행), `AdminNav`, `admin/layout`(사이트로 돌아가기), `layout`(본문 바로가기) | 헤더·푸터·하단 탭의 글자 있는 요소 91개: 14px는 **모두 `22.4px`**(56개). 관리자 내비·돌아가기 `14px/22.4px`, 높이 32px 그대로. 내비 링크 40px 한 줄(체커 PASS) |
| 8 (F3) | 모바일에서 접힌 헤더 1px 잔여 | `collapsed && '-translate-y-full lg:-translate-y-12'`, 주석을 사실대로 고침 | 접힘 시 헤더 `bottom`: 390px **0**(전 1), 820px 0, 1440px 42(내비 줄 41 + 아래 테두리 1 — 의도). 위로 스크롤하면 0~49 / 0~90으로 복귀 |
| 9 (F2) | Tab으로 빠져나가도 플라이아웃이 남음 | `<li ref={countryRef}>`에 `onBlur`: 다음 포커스 대상이 `li` 밖이면 `setCountryOpen(false)` | Enter로 열고 Tab: 행 4개를 도는 동안 `aria-expanded=true`, 본문으로 나가면 **`false` + `visibility: hidden`**. Shift+Tab으로 나가도 닫힘. ESC → 국가 버튼 포커스(유지). Enter 두 번 = 열림/닫힘. 바깥 탭 → 닫힘. 행 탭 → `/japan` 이동. 키보드로 연 뒤 행을 마우스로 눌러도 `/us` 이동 |

### 지시와 다르게 한 곳 (4가지)

1. **본문 바로가기는 `focus:py-2` 대신 `focus:inline-flex focus:h-10 focus:items-center`.** `text-sm` → `text-body-md`만 하면 줄 높이가 20 → 22.4px가 되어 높이가 36 → 38.4px(4px 격자 밖)이 된다. 보고서의 "고정 높이 컨트롤이라 배치는 그대로"가 이 한 곳에는 맞지 않아 높이를 컨트롤 높이 40px로 고정했다. 측정: 40px / 14px·22.4px·500 / 8px 모서리 / 면 `rgb(239,233,222)` / 글자 `rgb(22,21,19)`, Enter → `main#main`.
2. **모바일 메뉴 칸·Hacker News 행에 `focus-visible:-outline-offset-2`.** `-mx-3`로 행이 패널 가장자리 4px까지 가서, 바깥 링(2px + offset 2px)이 뷰포트 x=0에 딱 붙는다(잘리지는 않지만 여유 0). 패널이 스크롤 컨테이너이므로 7-19대로 같은 링을 안쪽에 그렸다(데스크톱 내비 줄과 같은 처리). 측정: `solid 2px rgb(240,136,62)`, offset −2px, 링 왼쪽 끝 x=4(390px)·12(768px).
3. **플라이아웃 `onBlur`는 다음 포커스 대상이 있을 때만 닫는다**(`relatedTarget`이 `null`이면 그대로). Safari는 링크·버튼을 눌러도 포커스를 주지 않아, `null`에서도 닫으면 "키보드로 열고 행을 클릭"할 때 mousedown에서 플라이아웃이 숨어 클릭이 사라진다. 빈 곳 클릭·탭은 기존 바깥 클릭 핸들러가 닫는다(측정: 바깥 탭 → 닫힘).
4. **`BANNED`의 범위.** ② `-live`는 `src/lib/ui.ts`를 예외로 뒀다 — 금지의 맥락은 "S2 크롬(헤더·푸터·내비)은 live 빨강을 쓰지 않는다"이고, `ui.ts`는 S3·S4와 함께 쓰는 클래스 파일이라 크롬 마크업이 아니다(현재 `ui.ts`에 `-live`는 0건). ③ 모서리는 보고서의 `rounded-(sm|md|lg|xl|2xl|3xl)`에 더해 **맨 `rounded`(4px — D4 그 자체)** 와 방향형(`rounded-t-lg` 등)도 잡는다. ④ `text-(xs|sm|base)`는 보고서에 없던 추가(D5 회귀 방지).

### 변이 검사 (`qa-out/gen-s2b-mutate.py`, 로그 `gen-s2b-mutate.log`)

작업 트리 파일은 건드리지 않고 격리 worktree 안에서 한 줄씩 바꿔 `tests/chrome-unslop.test.ts`를 돌린 뒤 되돌렸다(끝에 기준선 통과 재확인). **16/16 실패(=잡힘)**:
Hacker News에 `text-green-400` / `bg-white` / 워드마크 옆 `bg-live` 점 / 푸터 라벨 `text-live` / 버튼 `rounded-3xl` / `rounded-lg` / 스켈레톤 맨 `rounded` / `rounded-t-xl` / `text-sm` / 컨테이너 리터럴 복사 / 로컬 `CONTAINER` 상수 / `scroll-pt-*` 삭제 / `-translate-y-12`로 되돌림 / 플라이아웃 blur 처리 삭제 / 바로가기 카테고리 필터 삭제 / `번역 · 요약`.

### 전체 검증 수치

| 검증 | 결과 |
|---|---|
| `npx tsc --noEmit` | 격리 worktree 0, 작업 트리 0 |
| `npm test` | 격리 worktree(S2만) **282 통과 / 실패 0**. 작업 트리(S3 커밋 `5582735` 포함) **376 통과 / 실패 0** |
| `NODE_ENV=production next build` (격리) | `Compiled successfully`, 종료 코드 0 (2회) |
| 상태코드 | `/livenews` 200, `/nope` 404, `/article/999999` 404, `/us` `/breaking` `/search?q=AI` `/article/1` 200, `/admin` 무인증 401 / 인증 200 |
| 체커 사본 `qa-out/gen-s2b-check.js` | **131 / 131**. `eval-s2-check.js`와의 차이는 주소와 스크린샷 파일명뿐 — **기대값은 하나도 바꾸지 않았다** |
| 가로 넘침 | 320·360·390·480·640·768·820·1024·1100·1280·1440px × (`/`, `/nope`, `/us`, `/search?q=AI`) + 1024px 미만 7폭의 메뉴 열림 = **51회 모두 0**, 뷰포트 밖 크롬 요소 0 |
| 콘솔 | React·하이드레이션 경고/오류 **0**, pageerror 0. 남은 로그는 모두 네트워크 줄: `/api/img` 415(픽스처의 가짜 이미지), `/nope` 문서 404, `/api/img` 502 6건(이미지 프록시의 원본 요청 실패 — S2 파일과 무관) |

참고: 지시에는 포트 4104였으나, 메뉴 행 포커스 링(위 2)을 고친 뒤 다시 빌드한 판은 **4105**에 띄웠다(`kill` 금지라 4104의 첫 판을 내릴 수 없었다). 위 수치는 모두 4105(최종 판) 기준이고, 4104·4105 서버는 `timeout`으로 스스로 끝난다.

### 반영하지 않은 것

- **지시 10** (640px 미만에서 시계의 시각만 표시, D6): 사용자 확인 후 진행할 선택 항목.
- **T2-4** (통계 숫자에 `text-accent`): 개선 지시에 없고 정적으로 잡기 어렵다. 런타임 체커도 내비·탭만 본다 — 그대로 남은 구멍.
- **D2의 뒷부분** (3열 구성에서 연락처 열이 메일 한 줄뿐이라 균형이 약함): 지시가 없고, 고치려면 열 구성을 바꿔야 한다. 그대로 뒀다.
- **`scroll-pb-16`은 `env(safe-area-inset-bottom)`을 더하지 않는다.** 홈 인디케이터가 있는 iPhone에서는 탭 바가 57 + 34px라 외장 키보드 포커스가 아래쪽에서 일부 가려질 수 있다. 지시된 클래스를 그대로 썼다(같은 가정이 푸터의 `pb-16`에도 있다).

### 회귀 위험 확인 (2회차)

- 기존 기능 영향: 없음. ESC 포커스 복귀 3종, `/` 단축키, 본문 바로가기, 닫힌 패널의 `invisible`, 관리자의 사이트 크롬 숨김, 404의 HTTP 404, 글꼴 링크 2개 비차단(체커 131건에 포함)을 다시 확인했다. Header에서 바뀐 것은 클래스 문자열과 `li`의 `onBlur` 하나다.
- TypeScript 오류: 없음.
- 수정 파일(7): `src/app/layout.tsx`, `src/app/admin/layout.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/PageSkeleton.tsx`, `src/components/AdminNav.tsx`, `tests/chrome-unslop.test.ts`. `icons.tsx`·`ui.ts`·`globals.css`·S3 파일은 건드리지 않았다.
