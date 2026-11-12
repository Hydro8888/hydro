# QA 보고서 — 슬라이스 S2 (레이아웃 & 내비게이션), Unslop 재작업 라운드 1회차

- 검수 대상: 커밋 `bd5eedd` (S2 변경분 `55cce32..bd5eedd`), 설계서 `SPEC-S2.md`, 계약 `UNSLOP-AUDIT.md`(7절 우선), 규칙 `.claude/skills/unslop`(SKILL.md·signs.md·tokens.md)
- Evaluator: Generator와 독립된 서브에이전트. `SELF_CHECK-S2.md`의 주장은 믿지 않고 아래처럼 모두 다시 실행·측정했다.
- 격리: 작업 트리는 건드리지 않았다. `git worktree`로 `bd5eedd`를 두 벌 꺼내 ① 운영 빌드 `next start` :4102 ② `next dev` :4103(하이드레이션 경고·오류 화면·뉴스레터 폼 확인용, `NEXT_PUBLIC_NEWSLETTER_ENABLED=true`, 던지는 임시 라우트 1개 추가)로 띄웠다. DB·Redis는 읽기만.
- 산출물(모두 `qa-out/eval-s2-*`): `eval-s2-check.js`(+`.log`), `eval-s2-probe.cjs`(+`.json`), `eval-s2-probe2.cjs`(+`-prod.json`), `eval-s2-probe3.cjs`, `eval-s2-probe4.cjs`, 화면 `eval-s2-{d,m}-*.jpg`, `eval-s2-w*-header.jpg`.

---

## 0. 직접 실행한 검증 (수치)

| 검증 | 결과 |
|---|---|
| `npx tsc --noEmit` | 종료 코드 0 |
| `npm test` | **274 통과 / 실패 0** (`chrome-unslop.test.ts` 28개 포함) |
| `NODE_ENV=production next build` | `Compiled successfully`, 종료 코드 0. `.next/static/media` 없음, 빌드 CSS에 `@font-face`·`@import` 0건 → 빌드가 글꼴을 내려받지 않음 |
| 라우트 상태코드 (:4102) | `/livenews` 200, `/nope` 404, `/article/999999` 404, `/admin` 무인증 **401** / 인증 200, `/breaking` `/ranking` `/category/economy` `/search?q=AI` `/us` `/world` `/article/1` 200 |
| Generator 체커의 :4102 사본 (`eval-s2-check.js`) | **131 / 131** |
| Planner 원본 체커 (수정 없음) | 113 / 131 — 실패 18건은 워드마크·푸터 첫 줄·글꼴 링크 3종 × 6뿐 |
| 독립 측정 (`eval-s2-probe*.cjs`) | 아래 2~4절 |
| 정적 테스트 변이 13종 | 9종 잡힘, **4종 통과(구멍)** — 3절 T2 |

### Generator가 체커 사본에서 바꾼 기대값 3종 — 판정: 타당
`diff planner-s2-check.js gen-s2-check.js`로 확인. 감사 함수(`audit`)는 한 글자도 바뀌지 않았다.
1. 워드마크 `LiveNews.co.kr`, 색 2개 `[text, text-secondary]`, 굵기 600 → **7-16과 일치**.
2. 푸터 첫 줄 `LiveNews.co.kr` → **7-16과 일치**.
3. 글꼴 링크 2개(Pretendard·Google) 모두 non-blocking, preconnect 3개, jsDelivr도 모의·지연·차단 대상 → **7-8과 일치**(오히려 검사가 넓어졌다).
그 밖은 스크린샷 파일명과 `CHROME_PATH` 기본값뿐. 기대값을 낮춰 통과시킨 흔적 없음.

---

## 1. SPEC 항목 검증

- [PASS] 항목 1 웹폰트 비차단: 서버 HTML `<head>`에 preconnect 3 + 인라인 스크립트 + `<noscript>`(링크 2). 실제 네트워크(프록시)에서 스타일시트 2개 모두 `renderBlockingStatus: non-blocking`, 로드된 글꼴 `Pretendard Variable`·`IBM Plex Mono`, 렌더 차단 리소스는 자체 CSS 1개. 4절 참고.
- [PASS] 항목 2 layout 크롬: `theme-color` `#161513`, 설명문 교체, 첫 Tab = 본문 바로가기(면 `rgb(239,233,222)` / 글자 `rgb(22,21,19)` / 모서리 8px / 500 / 36px), Enter → `main#main` 포커스.
- [PASS] 항목 3 아이콘 한 벌: 다섯 파일 `<svg` 0건, `icons.tsx`의 `strokeWidth` 값 1종. 화면의 모든 svg가 16×16 / stroke 1.5 / `fill:none` / 부모 글자색(전 뷰포트·전 상태), 이모지 0.
- [PASS] 항목 4 버튼 클래스: 7-7·15대로 `@/lib/ui`. `src/components/ui.ts` 없음. `bg-accent` 0건. 주요 버튼 40px / 8px / 500 / `text` 면 + `accent-ink`.
- [PASS] 항목 5 워드마크(7-16): 헤더·푸터 `LiveNews`(`text`) + `.co.kr`(`text-secondary`) 18px/600, 빨간 점·펄스 없음. 관리자 `LiveNews Admin` `rgb(239,233,222)` 600.
- [PASS] 항목 6 통계·시계: `오늘 88건 업데이트 · 전체 409건`(워드마크 오른쪽 16px), 숫자 `IBM Plex Mono` + `tabular-nums`. 시계 `11월 12일 (목) 11:27:17 KST`, 날짜는 Pretendard·시각은 mono. `toLocaleString` 0건. 워드마크·통계·시계·토글의 세로 중심이 모두 y=24.
- [PASS] 항목 7 검색 토글·키캡·모바일 버튼: 토글 32px/8px, 열림 = `surface-elevated` 면(강조색 없음). 키캡 20×20 / 6px / Plex Mono 12px. 모바일 버튼 40×40, 아이콘 오른쪽 끝 x=374(가장자리 16px 선). 메뉴 아이콘 `M4 6h16…` ↔ `M6 6l12 12…`, `aria-expanded` 따라 바뀜.
- [PASS] 항목 8 헤더 표면·검색 펼침: 헤더 `rgb(22,21,19)` 불투명, blur·gradient 0. 검색 영역 `transition: opacity 0.2s`, 열렸을 때 `overflow: visible`, 입력 포커스 링 네 변 모두 보임(`eval-s2-d-search-open.jpg`).
- [PASS] 항목 9 데스크톱 내비: 링크 13개 모두 높이 40px·top 49. 첫 글자 x=112 = 워드마크 x=112, "랭킹" 끝 x=1328 = 검색 토글 오른쪽 x=1328. 주황은 현재 항목 1개(`/us`→`미국`, `/ranking`→`랭킹`, `/nope`·`/article/1`→0개). Hacker News `rgb(170,163,152)`. hover는 `text` 색만.
- [PASS] 항목 10 모바일 메뉴: `transition: opacity 0.2s`, 라벨 12px/500/대문자·자간 없음(위 24 / 아래 8), 행 40px/8px, 칩 32px/8px, ESC → 메뉴 버튼 포커스 + `visibility: hidden`. (정렬 문제는 3절 D1)
- [PASS] 항목 11 하단 탭·플라이아웃: 바 `rgb(18,17,15)`, 탭 97.5×56, 아이콘 16px가 칸 중앙, 라벨 12px. 주황 = `/`→홈, `/us`→국가, `/nope`→없음. 홈에서 플라이아웃을 열면 "국가"는 `text` 색(주황 아님). 플라이아웃 그림자 `rgba(0,0,0,0.35) 0 8px 24px`, 오른쪽 16px, 버튼 위 8px, 모서리 12 − 여백 4 = 행 8. ESC → 국가 버튼, 바깥 탭 → 닫힘.
- [PASS] 항목 12 SearchBar: 입력 40px/8px + 버튼 40px/8px, 간격 8px. 포커스 `solid 2px rgb(240,136,62)` offset 2px, `box-shadow: none`. `/` → `AI` → Enter → `/livenews/search?q=AI`.
- [PASS] 항목 13 푸터: `rgb(18,17,15)`, 평범한 문장 2줄(테두리·면·아이콘 없음), 이모지 0, `운영 중` 0, 라벨 대문자·자간 없음, 링크 19개 모두 32px, hover `text`.
- [PASS] 항목 14 연락처(7-17): `github.com`·`twitter.com` 링크 0, `mailto:` 1. 남는 항목이 없어진 "소셜" 제목 제거는 타당.
- [PASS] 항목 15 뉴스레터 폼: dev 빌드에서 플래그를 켜고 측정. 4열, 문구 `주요 뉴스를 이메일로 받아 보세요`, 입력 40px/8px + 버튼 40px/8px 간격 8px, 포커스 = 공통 링, 오류 문구 `rgb(234,93,97)` 12px(빈 상태 `display:none`), `label[for]` 있음.
- [PASS] 항목 16 하단 바·통계: `<strong>` 0, 숫자 3개 모두 Plex Mono + tabular, 구분자 `·`, 형식 `전체 기사 409건 · 오늘 88건 · 활성 소스 30개`.
- [PASS] 항목 17 error.tsx: dev에서 던지는 라우트로 실제 렌더. h1 28px/500, 문장 14px, 오류 코드 mono, 버튼 2개 40px/8px(간격 12px), svg·애니메이션·blur 0, "홈으로" href `/livenews`, 재시도 동작.
- [PASS] 항목 18 not-found.tsx: HTTP 404, 제목 `페이지를 찾을 수 없습니다 | LiveNews`, `404` Plex Mono 12px muted, h1 28px/500, 버튼 40px/8px, 위반 0.
- [PASS] 항목 19 관리자 바: 사이트 헤더·푸터·하단 탭 DOM에 없음(데스크톱·모바일), 주황 = `소스 관리` 하나, 내비·돌아가기 32px, 왼쪽 선 x=112, 가로 넘침 0.
- [PASS] 항목 20 스켈레톤(7-18): `/breaking` 응답을 2.5초 붙잡아 실제로 띄워 측정. 애니메이션 0, `background-image` 0, 왼쪽 선 x=112, `role=status`·`aria-live=polite`·sr-only 문구 유지. (모서리 값은 3절 D4)
- [PASS, 구멍 있음] 항목 21 정적 테스트: 28개 통과. 변이 `font-bold`·선 굵기 2·정적 `<link>`·GitHub 링크·이모지·`transition-all`·`py-2.5`·임의 hex·`hover:text-accent`는 잡는다. 못 잡는 4종은 3절 T2.

### 7절 결정
| 7절 | 판정 | 근거 |
|---|---|---|
| 6 컨테이너 | PASS | 1440px에서 헤더·내비·푸터·관리자 바·관리자 본문·스켈레톤 왼쪽 선이 모두 x=112 |
| 7·15 `src/lib/ui.ts` | PASS | 6개 파일이 `@/lib/ui` import. 단 `CONTAINER`만은 쓰지 않음(3절 T1) |
| 8 글꼴 3종 비차단 | PASS | 4절 |
| 9 진입 애니메이션 0 | PASS | 크롬 전 요소 `animation-name: none` |
| 16 워드마크 | PASS | 항목 5 |
| 17 확인 불가 링크 삭제 | PASS | 항목 14 |
| 18 스켈레톤 정지 | PASS | 항목 20 |
| 19 스크롤 줄 안 포커스 링 | PASS | 내비 링크 13개·하단 탭 4개 `outline-offset: -2px`, 잘림 0 |
| 20 구독 문구 | PASS | 푸터 폼. `NewsletterBanner`의 같은 문구는 S3 |
| 21 icons.tsx | PASS | S2가 생성, `'use client'` 없음 |

---

## 2. unslop 9개 패스 — 독립 측정 (계산된 스타일)

대상: 헤더(기본·검색 열림), 데스크톱 내비, 모바일 메뉴 열림, 하단 탭, 플라이아웃 열림, 푸터, 404, 오류 화면, 관리자 바, 스켈레톤. 1440px·390px.

| 패스 | 측정 | 결과 |
|---|---|---|
| 1 간격 | padding·margin(4변)·gap, 컨트롤 높이 | 4px 배수가 아닌 값 **0건**(`ml-auto`의 자동 여백 제외). 높이 집합: 키캡 20 / 칩·행·토글 32 / 버튼·입력·내비 링크·메뉴 행 40 / 탭 56 |
| 2 색 | 글자·면·테두리·그림자 색 고유값 | 글자 `#efe9de` `#aaa398` `#918b81` `#161513`(주요 버튼) `#f0883e`. 면 `#161513` `#12110f` `#1c1a18` `#262421` `#efe9de`. 테두리 헤어라인 10%·6% + 현재 내비 밑줄 `#f0883e`. 그림자 1종(플라이아웃). `negative`는 구독 오류 문구에만. **램프 밖 색 0** |
| 2 색 | 강조색의 쓰임 | 현재 내비 항목(글자+밑줄), 현재 하단 탭, 모바일 메뉴의 현재 칸·현재 국가 칩, 플라이아웃 현재 행, 관리자 현재 메뉴, 포커스 링. hover·버튼 면·열림 상태·숫자·로고에는 **0건** |
| 3 아이콘 | 모든 svg | 16×16 / 1.5 / 글자색 한 벌, 이모지 0 |
| 4 문구 | 보이는 문자열 80개 + placeholder·aria-label | 느낌표 0, 말줄임 0, 과장어 0. 짧은 문자열 끝 마침표는 저작권 줄 1건(관용 표기) |
| 5 서체 | 굵기·변환·자간·기울임 | 굵기 `400/500/600`(600은 워드마크뿐), uppercase 0, 0이 아닌 자간 0, italic 0, 12px 미만 0, 숫자만으로 된 조각은 모두 `tabular-nums` |
| 7 디테일 | 모서리 | 크롬 `6/8/12px`. 스켈레톤에만 `4px`(D4) |
| 7 디테일 | 포커스 링 | Tab 순회 데스크톱 140개·모바일 120개 + 메뉴 열림 18개 + 플라이아웃 4개: 크롬 요소는 모두 `2px accent`(offset 2 또는 −2), `box-shadow` 대체 링 0, **크롬 안에서 잘린 링 0** |
| 9 모션 | transition·animation | `transition-property: all` **0**, 반복·진입 애니메이션 **0**, 지속 `0.15s`·`0.2s` 두 가지, easing `cubic-bezier(0.22,1,0.36,1)` 하나, 높이·패딩 전환 0 |

가로 넘침: 320·360·390·480·640·768·820·1024·1100·1280·1440px × (`/`, `/nope`, `/us`) 33회 모두 `scrollWidth − clientWidth = 0`, 뷰포트 밖으로 나간 크롬 요소 0, 통계 잘림 0, 내비 줄 스크롤 없음(1024px 984/984).

---

## 3. 발견한 문제

### 기능·접근성
- **F1 (중요, 기존 결함·회귀 아님) 고정 크롬이 키보드 포커스를 완전히 가린다.** `html`의 `scroll-padding`이 `auto`다.
  - 데스크톱 1440px, 푸터에서 Shift+Tab 70회: 본문 요소 **6개가 sticky 헤더(90px) 밑에 완전히 숨음**(예: `북마크 추가` top 48.8~80.8, 헤더 bottom 90 — `eval-s2-d-focus-under-header.jpg`).
  - 모바일 390px, Tab 90회: 본문 요소 **5개가 하단 탭 바(57px) 밑에 완전히 숨음**(예: 카테고리 링크 top 790~832, 탭 바 top 787).
  - WCAG 2.2 SC 2.4.11(AA). 지난 라운드에 "포커스가 헤더 안에 있을 때 접힘 방지"는 넣었지만 본문 쪽은 빠져 있다. S2 레이아웃의 몫이다.
- **F2 (경미, 기존)** 국가 플라이아웃을 키보드로 연 뒤 Tab으로 빠져나가면 포커스는 본문으로 가는데 플라이아웃은 열린 채 남는다(`aria-expanded="true"`).
- **F3 (경미)** 모바일에서 접힌 헤더가 1px 남는다: 헤더 49px(48 + 테두리 1), `-translate-y-12` = 48px → `bottom: 1`. `Header.tsx:234-235` 주석("no clipped sliver remains")과 실제가 다르다.

### 디자인 (unslop 방향)
- **D1 모바일 메뉴의 왼쪽 선이 세 개다**(`eval-s2-m-us-menu-open.jpg`): 라벨 x=16, Hacker News 글자 x=28(`px-3`), 카테고리 칸은 3열 가운데 정렬 + `랭킹` 혼자 남는 줄. 스킬 패스 1 "Things line up — labels start on one line" 위반. (SPEC이 준 클래스 그대로이긴 하나 결과가 어긋난다.)
- **D2 푸터 같은 열에 `경제` 링크가 두 번**(카테고리 `/category/economy`와 바로가기 `/category/economy`). SPEC이 패스 6에서 GitHub·이메일 중복은 고치고 이것은 남겼다. 3열 구성에서 3열은 메일 한 줄(높이 304px 중 32px 사용)이라 균형도 약하다.
- **D3 같은 푸터 안에서 가운뎃점 표기가 다르다**: `번역·요약해`(`Footer.tsx:155`) vs `번역 · 요약되었으며`(`:214`).
- **D4 스켈레톤 막대 7곳이 `rounded`(4px)** — 계약 모서리 집합(6/8/12/16) 밖(`PageSkeleton.tsx:23,24,33,43-46`).
- **D5 14px 글자에 줄 높이가 둘**: `text-sm`(14/20 — 내비 링크, 모바일 메뉴 행, Hacker News 행, 플라이아웃 행, 관리자 내비, 사이트로 돌아가기, 본문 바로가기 7곳)과 `text-body-md`(14/22.4 — 칩·버튼·입력·푸터 행). `text-sm`은 계약 3절의 크기 토큰이 아니다.
- **D6 템플릿 점검**: 이 슬라이스의 답(헤더 KST 고정폭 시계 + 통계 문장)이 **640px 미만에서는 둘 다 숨는다**(`statsVisible:false`, `clockVisible:false`). 390px 크롬은 워드마크 + 아이콘 2개 + 탭 4개라 제품 이름을 바꿔도 그대로 통한다.

### 기술
- **T1 페이지 컨테이너 문자열이 5곳에 복사돼 있다.** 같은 커밋 구간에서 `src/lib/ui.ts:54`에 `CONTAINER`가 export됐는데 `Header.tsx:76`, `Footer.tsx:24`는 같은 이름의 로컬 상수를 다시 정의하고 `PageSkeleton.tsx:12`, `admin/layout.tsx:20,35`는 리터럴이다. 테스트(`chrome-unslop.test.ts:167,178-184`)도 import가 아니라 리터럴을 고정한다. 7-15("`src/lib/ui.ts` 하나")와 "코드 중복 제거" 기준 위반.
- **T2 정적 테스트의 구멍(변이로 확인, 모두 28/28 통과).**
  1. Hacker News 링크에 `text-green-400` — 이번에 고친 바로 그 징후가 되돌아와도 통과한다(Tailwind 기본 팔레트는 `extend`라 CSS가 생성됨).
  2. 워드마크 옆에 `bg-live` 점 — SPEC 방향 "live 빨강은 S2에서 쓰지 않는다"를 지키는 검사가 없다.
  3. 버튼에 `rounded-3xl` — `rounded-(pill|badge|full)`만 본다.
  4. 통계 숫자에 `text-accent` — 정적으로는 잡기 어렵고, 런타임 체커도 내비·탭만 본다.

### S2 밖 (감점하지 않음 — 기록만)
- 본문 컨테이너가 아직 `px-4`라 1440px에서 본문 왼쪽 선 x=96, 크롬 x=112(S4).
- dev 콘솔의 `Invalid DOM property fetchpriority`는 `ArticleImage.tsx:47`(S3). 415는 픽스처의 가짜 이미지.
- 404 응답은 `<html id="__next_error__">` 빈 셸이라 JS 없이 열면 빈 화면(Next 14의 `notFound()` 동작, 기존).
- `ui.ts`의 `FIELD` 글자 14px → iOS에서 입력 포커스 시 화면 확대(S1 토큰).
- `globals.css`의 `.nav-link*`는 죽은 클래스(통합 단계 삭제 대상).

---

## 4. 글꼴 로딩 독립 재현

| 조건 | `/` | `/nope` | `/article/999999` | `/search` |
|---|---|---|---|---|
| 글꼴 호스트 3곳 **4초 지연** (prod) — FCP | 228ms | 216ms | 260ms | 144ms |
| 〃 — 스타일시트 | 2개 모두 `non-blocking`, 4.08s에 도착 후 적용 | 동일 | 동일 | 동일 |
| 글꼴 호스트 **차단** (prod) | 정상 표시(본문 4,777자), FCP 360ms | h1 표시 | h1 표시 | h1 표시 |
| `link[data-webfonts]` 수 | 2 | 2 | 2 | 2 |

- 소프트 내비(`/`→`/us`)·뒤로 가기·404→홈 뒤에도 링크 2개(중복 없음), 모두 `<head>` 안.
- **하이드레이션 경고**: dev 서버에서 6개 라우트 × (정상·4초 지연·차단) = 18회, React 경고 중 S2 원인 **0건**. prod 8회 `Minified React error` 0건.
- **404 셸**: 서버 응답이 `<html id="__next_error__">`이고 `<head>`에 인라인 스크립트가 없다(직접 확인). React가 브라우저에서 만든 `<script>`는 실행되지 않으므로 `WebFontLinks`가 없으면 링크 0개가 맞다. 마운트 후 2개가 붙고 non-blocking.
- JS 비활성: `<noscript>` 링크 2개 적용, 헤더·본문 표시(통계·시계는 클라이언트 전용이라 없음 — 정상).
- 빌드: `next/font` 0건, `globals.css` `@import` 0건, 빌드 산출물에 글꼴 파일 0 → 네트워크 없이 빌드 가능.

---

## 5. "SPEC과 다르게 한 점" 판정

| # | 내용 | 판정 |
|---|---|---|
| 1 | `WebFontLinks.tsx` 신규 | **타당** — 404 셸 구조를 직접 확인(4절). 26줄, 일반 페이지에서는 아무 일도 하지 않음 |
| 2 | 워드마크 링크 `h-8` | **타당** — 링 상단 y=4, 뷰포트에 잘리지 않음 |
| 3 | `<nav>`에 `h-10` 없음, `li.flex` | **타당** — nav 41px(테두리 1 + 40), 링크 40px |
| 4 | 통계 구분점 앞뒤 실제 공백 + `mx-1` | **타당** — 구분점이 `aria-hidden`이라 필요 |
| 5 | `CHIP`/`CHIP_CURRENT`, `aria-expanded:` 변형 | **타당** — 7-7. 스킬의 "활성 = 면 한 단계 + 헤어라인"과도 일치 |
| 6 | 플라이아웃 현재 행에 `surface-elevated` | **타당** — 모바일 메뉴 현재 칸과 같은 표현 |
| 7 | 버튼 값은 `ui.ts` 그대로 | **타당** — 7-7 |
| 8 | "소셜" 섹션 제거, 브랜드 글리프 미작성 | **타당** — 7-17의 결과 |
| 9 | 푸터 행 `li.flex` + `inline-flex h-8` | **타당** — 19개 모두 32px |
| 10 | 관리자 바·본문 공통 컨테이너 | **타당** — 7-6, x=112 정렬 |
| 11 | 정적 테스트 변경 | **타당하나 불완전** — T2 |
| 12 | preconnect 3개 | **타당** — 7-8 |

---

## 6. 화면 비교 (수정 전 `qa-out/unslop/before/prod` ↔ `eval-s2-*.jpg`)

- **홈 상단 1440**: 4색 워드마크 + 깜박이는 점 3개 + 주황 숫자 + 초록 Hacker News + 랭킹 아이콘 → 한 색 워드마크, 회색 문장, 주황은 `홈` 밑줄 하나. 조용한 크롬이 됐다.
- **홈 푸터 1440**: 주황 워드마크·파란 AI 상자·이모지 12개·사각 아이콘 타일 → 글자 목록과 헤어라인. 3열이 비어 보이는 점(D2)만 남는다.
- **404**: 거대 404 + 주황 알약 → 작은 고정폭 `404` + h1 + 버튼 2개. 오류 화면과 같은 구성.
- **관리자**: 주황 굵은 로고 → 중립 워드마크, 주황은 현재 메뉴 하나.
- **390px**: 탭 아이콘 한 크기·한 굵기, 블러 없음. 다만 크롬에 이 제품만의 것이 없다(D6).
- 템플릿 느낌: 데스크톱·태블릿은 통계 문장과 KST 시계가 답이 된다. 모바일은 아직 아니다.

---

## 7. 채점

**전체 판정**: 합격
**가중 점수**: 7.8 / 10.0 (8×0.3 + 7×0.2 + 8×0.25 + 7×0.15 + 9×0.1 = 7.75)

**항목별 점수**:
- 디자인 품질: 8/10 — 측정상 격자·색·서체·아이콘·모션 위반 0. 모바일 메뉴 정렬(D1), 푸터 중복·균형(D2), 표기 불일치(D3), 4px 모서리(D4), 줄 높이 둘(D5)로 감점.
- 독창성: 7/10 — 새 장식 없이 정렬과 통신 데스크 문장·KST 시계로 방향을 지켰다. 그 답이 640px 미만에서는 사라진다(D6).
- 기술적 완성도: 8/10 — tsc·테스트·빌드 통과, 글꼴 로딩 견고. 컨테이너 문자열 5중 복사(T1), 정적 테스트 구멍(T2), 사실과 다른 주석(F3).
- 기능성: 7/10 — 검색·메뉴·플라이아웃·ESC 복귀 모두 정상. 고정 크롬이 포커스를 완전히 가리는 문제(F1)와 플라이아웃 잔류(F2).
- 회귀 안전: 9/10 — 상태코드·키보드 동작·aria·관리자 크롬 숨김·통계 요청 1회 모두 유지. Header 훅·핸들러 diff 없음.

**구체적 개선 지시** (합격이므로 재검수 조건은 아님. 1~3은 통합 단계 전에 반영 권장):
1. `src/app/layout.tsx:55` — `<html>`에 `scroll-pt-24 scroll-pb-16 lg:scroll-pb-0`을 더해 포커스로 스크롤될 때 sticky 헤더(90px)와 하단 탭 바(57px)만큼 비운다. 확인: 푸터에서 Shift+Tab, 모바일에서 Tab 순회 시 본문 요소가 헤더·탭 바와 겹치지 않을 것(F1).
2. `src/components/Header.tsx:76`, `Footer.tsx:24` 로컬 `CONTAINER` 삭제 후 `@/lib/ui`에서 import. `PageSkeleton.tsx:12`, `admin/layout.tsx:20,35`도 `cn(CONTAINER, …)`. `tests/chrome-unslop.test.ts:178-184`는 "네 파일이 `CONTAINER`를 `@/lib/ui`에서 import하고 `max-w-screen-xl` 리터럴이 없다"로 바꾼다(T1).
3. `tests/chrome-unslop.test.ts:42-65` `BANNED`에 추가: ① 기본 팔레트 색 `/\b(text|bg|border|fill|stroke|decoration|outline)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|white|black)\b/` ② `/\b(bg|text|border)-live\b/` ③ 계약 밖 모서리 `/\brounded-(sm|md|lg|xl|2xl|3xl)\b/`(T2).
4. `src/components/Header.tsx:410-419` Hacker News 행에 `-mx-3`를 더해 글자가 라벨과 같은 x=16에서 시작하게 하고, `:386-407` 카테고리 칸은 `justify-center` → `justify-start` + `-mx-3` 보정(또는 칸 전체를 왼쪽 정렬 목록으로)으로 왼쪽 선을 하나로 맞춘다(D1).
5. `src/components/Footer.tsx:19-21` `QUICK_LINKS` 필터에 `!m.href.startsWith('/category/')`를 더해 같은 열의 `경제` 중복을 없앤다(D2). `:214`의 `번역 · 요약되었으며` → `번역·요약되었으며`(D3).
6. `src/components/PageSkeleton.tsx:23,24,33,43-46` `rounded` → `rounded-tag`(D4).
7. `src/components/Header.tsx:82,396,415,520`, `AdminNav.tsx:29`, `admin/layout.tsx:29`, `layout.tsx:70` `text-sm` → `text-body-md`(고정 높이 컨트롤이라 배치는 그대로, 14px 줄 높이가 한 가지가 된다)(D5).
8. `src/components/Header.tsx:236` `collapsed && '-translate-y-full lg:-translate-y-12'`로 모바일의 1px 잔여 선을 없애고 `:234-235` 주석을 사실에 맞춘다(F3).
9. `src/components/Header.tsx:501` 플라이아웃 래퍼에 `onBlur`로 포커스가 `countryRef` 밖으로 나가면 `setCountryOpen(false)`(F2).
10. (선택, 사용자 확인 후) `src/components/Header.tsx:37` 시계를 640px 미만에서는 시각만(`HH:mm:ss KST`) 보이게 해 모바일 크롬에도 이 제품의 표식을 남긴다(D6). 새 요소가 아니라 이미 있는 요소의 표시 범위 변경이다.

**방향 판단**: 현재 방향 유지
