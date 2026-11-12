# S2 레이아웃 & 내비게이션 개선 설계서 — Unslop 재작업 라운드

> 사용자 요청: "https://github.com/heydamir/unslop 이 기능을 모두 활용해서 재작업해줘 테스트까지 완료해줘"
> 계약: `UNSLOP-AUDIT.md`(감사·방향·토큰·슬라이스 인터페이스). 스킬: `.claude/skills/unslop/SKILL.md`, `references/signs.md`, `references/tokens.md`.
> 이 라운드의 규칙: **새 기능·새 장식 없음, 섹션·기능·순서 유지.** 모든 항목은 unslop 9개 패스 중 하나의 징후를 `파일:라인` 근거로 고친다.
> 라인 번호는 이 문서를 쓴 시점(커밋 `0e0c122`, S1 적용 전)의 것이다. S1이 빌드 유지를 위해 한 줄씩 고쳤을 수 있으니(예: `Footer.tsx:178`) 내용으로 찾아라.

Planner 실험물(모두 `qa-out/` 아래, 소스는 건드리지 않음):

| 경로 | 용도 |
|---|---|
| `qa-out/planner-s2-fonts/` | 글꼴 로딩 3가지 방식 + 대조군을 Next 14.2.18 App Router에서 dev·prod로 실측한 작은 앱(`test.js`가 측정 스크립트) |
| `qa-out/planner-s2-check.js` | 실행 중인 앱의 크롬(헤더·푸터·하단 탭·404)을 계산된 스타일로 검사하는 Evaluator용 스크립트. 현재 코드에서 25/131 통과(나머지가 이 설계서가 고칠 것) |
| `qa-out/planner-s2-tw/` | 이 설계서가 쓰는 유틸리티 클래스가 S1 초안 설정에서 실제 CSS로 생성되는지 확인 |

---

## 현재 상태 분석

### 유지할 것 (지난 라운드에서 만든 것 — 회귀 금지)
- 구조: 헤더 2단(로고·통계·시계·검색 / 내비), 모바일 펼침 메뉴, 모바일 하단 탭 4개 + 국가 플라이아웃, 푸터 3~4열 + 하단 바, 관리자 전용 바.
- 접근성·동작: 본문 바로가기(`layout.tsx:38-43`), `main#main tabIndex=-1`(`:47`), `/` 단축키와 ESC 포커스 복귀(`Header.tsx:132-161`), 닫힌 패널 `invisible`(`:304, :382, :529`), 키보드 포커스 중 헤더 접힘 방지(`:196-197, :209-212`), `aria-expanded/controls/current/haspopup`, 내비 자동 스크롤이 `scrollTo`인 이유(`:172-184`), 통계 요청 공유(`useSiteStats`), KST 시계(`formatKstClock`), 푸터 연도 `suppressHydrationWarning`(`Footer.tsx:282`), 오류 화면의 `router.refresh()+reset()`(`error.tsx:23-28`), 스켈레톤 `role="status"`(`PageSkeleton.tsx:8-10`), 루트 `loading.tsx`를 만들지 않는 규칙.

### 감사 — 이 슬라이스에서 찾은 징후 (패스 순서)

| 패스 | 징후 | 위치 |
|---|---|---|
| 1 간격 | 반 단계·임의 px | `Header.tsx:32,52(gap-1.5) 55(mx-0.5) 218(gap-0.5) 223(ml-1.5 h-1.5 w-1.5) 227(max-w-[320px]) 244(py-1.5) 250(h-3.5) 252(px-1.5 py-0.5 text-[10px]) 283-291(top-[5px]/[9px]/[13px]) 365(h-3.5) 399,418(py-2.5) 421(h-3.5) 439(py-1.5 gap-1.5) 465,480,495,514(gap-0.5 text-[10px]) 543(py-2.5)`, `Footer.tsx:59(py-2.5) 150(gap-0.5) 153(ml-1.5) 158(p-2.5) 171(gap-y-1.5) 214(space-y-2.5)`, `SearchBar.tsx:61(right-1.5 py-1.5)`, `error.tsx:31,59,66(min-h-[60vh] py-2.5)`, `not-found.tsx:9,12,31,40(min-h-[60vh] text-[7rem] py-2.5)` |
| 1 간격 | 같은 것이 다른 크기: 활성 내비 링크만 `border-b-2`가 붙어 2px 더 높음(실측 36px vs 38px, 글자 1px 어긋남) | `globals.css:104-106` ← `Header.tsx:332,362` |
| 1 간격 | 줄이 안 맞음: 내비 첫 글자(x=108)가 로고(x=96)보다 12px 안쪽, 통계가 가운데 떠 있음 | `Header.tsx:227, 320` |
| 1 간격 | `inline-flex gap-1.5`가 글자 조각마다 6px를 넣어 `344 건`, `164,917 건`처럼 숫자와 단위가 떨어짐 | `Header.tsx:52-57` |
| 2 색 | 4색 워드마크(빨강 Live + 파랑 News + 회색 .co.kr + 빨간 점), 푸터는 주황 워드마크 + 빨간 점 | `Header.tsx:219-223`, `Footer.tsx:150-154`, `admin/layout.tsx:21` |
| 2 색 | 초록 "Hacker News"(데스크톱·모바일), 초록 시계 점, 주황 통계 점·주황 숫자 | `Header.tsx:344, 418, 34, 53-54` |
| 2 색 | 강조색이 현재 위치가 아닌 곳에: 모든 hover(`hover:text-accent` 10곳), 열린 검색 토글, 열린 국가 버튼, 검색·구독·오류·404 버튼 면, 본문 바로가기 | `Header.tsx:246,265,278,515`, `globals.css:101`, `Footer.tsx:84,176,193,218,229,245,254,261`, `SearchBar.tsx:61`, `error.tsx:59`, `not-found.tsx:31`, `layout.tsx:40` |
| 2 색 | 반투명 면 + 블러, 색 틴트 면, 글로우 블롭, 색 테두리 | `Header.tsx:203,456(bg-surface/95 backdrop-blur-md) 314(/60) 401,441,545(bg-accent/10,/5)`, `Footer.tsx:59,158`, `error.tsx:34-35`, `not-found.tsx:13,16` |
| 2 색 | `themeColor`가 옛 GitHub 다크 값 | `layout.tsx:10` |
| 3 아이콘 | 이모지 아이콘 12개(푸터 카테고리) | `Footer.tsx:178` |
| 3 아이콘 | AI 표시용 sparkle | `Footer.tsx:159, 295-301` |
| 3 아이콘 | 크기 5종(12·14·16·20·40px), 선 굵기 2종(1.5·2) + 채움 — 아래 전수표 | Header·Footer·SearchBar·error·not-found |
| 3 아이콘 | 아이콘이 아닌 것으로 만든 아이콘: span 3개 햄버거 | `Header.tsx:280-293` |
| 4 문구 | AI 배지 "…시스템 운영 중", 같은 사실을 푸터에서 3번 말함 | `Footer.tsx:156, 161, 277` |
| 4 문구 | 확인할 수 없는 주장: "매일 아침 AI가 선별한", "실시간 AI … 글로벌 뉴스 허브" | `Footer.tsx:56`, `layout.tsx:18` |
| 4 문구 | 말줄임 플레이스홀더 "뉴스 검색...", 짧은 문구 끝 마침표 | `SearchBar.tsx:13`, `Header.tsx:307`, `Footer.tsx:63,156` |
| 4 문구 | 숫자 형식: `toLocaleString('ko-KR')`(서버·브라우저 차이 가능), 활성 소스만 쉼표 없음 | `Header.tsx:54,56`, `Footer.tsx:108,112,116` |
| 5 서체 | 굵기 700 이상: `font-extrabold` 3, `font-bold` 1, `<strong>` 3(브라우저 기본 700) | `Header.tsx:219`, `Footer.tsx:151,108,112,116`, `not-found.tsx:12`, `admin/layout.tsx:21` |
| 5 서체 | `font-semibold`를 버튼·링크·라벨에 남용 12줄 | `Header.tsx:38,54,56,344,418`, `Footer.tsx:84`, `SearchBar.tsx:61`, `error.tsx:59,66`, `not-found.tsx:31,40`, `layout.tsx:40` |
| 5 서체 | 대문자 + 넓은 자간 라벨 7곳, `KST` `tracking-wider` | `Header.tsx:386,425,38`, `Footer.tsx:52,168,185,211,237` |
| 5 서체 | 작은 글자 음수 자간, 12px 미만 글자 | `Header.tsx:219,222(tracking-tight) 38,252,465,480,495,514(10px)`, `not-found.tsx:12(tracking-tighter)` |
| 5 서체 | 숫자가 고정폭 글꼴이 아님 | `Header.tsx:32,52`, `Footer.tsx:106` |
| 6 레이아웃 | 같은 링크가 두 번(GitHub·이메일이 "연락처"와 "소셜"에 각각), 목록 모양이 둘(글자 행 / 사각 아이콘 타일) | `Footer.tsx:214-266` |
| 7 디테일 | 알약: 검색 토글, 검색 입력·버튼, 국가 칩, 오류·404 버튼, 오류 코드 배지 | `Header.tsx:244,439`, `SearchBar.tsx:55,61`, `error.tsx:49,59,66`, `not-found.tsx:31,40` |
| 7 디테일 | 포커스 링을 지우고 다른 링으로 대체 | `SearchBar.tsx:55-56`, `Footer.tsx:79` |
| 7 디테일 | 카운트가 굵은 글자, 구분자 `|`를 테두리색 글자로 | `Footer.tsx:108-116` |
| 8 비주얼 | 내용 뒤 블러 블롭 2개, 원형 경고 타일 | `error.tsx:33-40`, `not-found.tsx:15-17` |
| 9 모션 | 실시간이 아닌 것의 펄스 3곳 | `Header.tsx:34,53,223` |
| 9 모션 | `transition-all` 5곳, 높이·패딩을 애니메이션, `ease-in-out`·300ms 혼용, `scale-95` 메뉴 | `Header.tsx:244,282,286,290,303,379,526`, `SearchBar.tsx:56` |
| 9 모션 | 진입 애니메이션 3곳, 스켈레톤 그라데이션 shimmer 10곳 | `PageSkeleton.tsx:11,16-45`, `error.tsx:31`, `not-found.tsx:9` |

### 아이콘 전수표 (이 슬라이스의 모든 인라인 SVG)

| 파일:라인 | 아이콘 | 현재 크기 | 현재 선 | 처리 |
|---|---|---|---|---|
| `Header.tsx:250` | 검색(데스크톱 토글) | 14px | 2 | 16px / 1.5 |
| `Header.tsx:267` | 검색(모바일 토글) | 20px | 2 | 16px / 1.5 |
| `Header.tsx:280-293` | 햄버거(span 3개, SVG 아님) | 16px, 2px 막대 | — | `MenuIcon`/`CloseIcon` 16px / 1.5 |
| `Header.tsx:347` | 새 창(Hacker News) | 12px | 2 | 16px / 1.5 |
| `Header.tsx:365` | 막대 차트(랭킹) | 14px | 2 | **삭제**(내비에서 혼자만 아이콘) |
| `Header.tsx:421` | 새 창(모바일 메뉴) | 14px | 2 | 16px / 1.5 |
| `Header.tsx:469` | 집 | 20px | 1.5 | 16px / 1.5 |
| `Header.tsx:484` | 번개 | 20px | 1.5 | 16px / 1.5 |
| `Header.tsx:499` | 검색(하단 탭) | 20px | 2 | 16px / 1.5 |
| `Header.tsx:518` | 지구본 | 20px | 1.5 | 16px / 1.5 |
| `SearchBar.tsx:30-44` | 검색 | 16px | 2 | 16px / 1.5 |
| `Footer.tsx:60` | 체크 | 16px | 2 | 16px / 1.5 |
| `Footer.tsx:159` | sparkle(AI) | 16px | 1.5 | **삭제** |
| `Footer.tsx:220, 264` | 메일 ×2 | 16px | 1.5 | 16px / 1.5, 1번만 |
| `Footer.tsx:231, 257` | GitHub ×2 | 16px | 채움 | 16px 채움(브랜드 글리프), 1번만 |
| `Footer.tsx:248` | X | 16px | 채움 | 16px 채움(브랜드 글리프) |
| `error.tsx:36` | 경고 삼각형 | 40px | 1.5 | **삭제**(글로우 타일과 함께) |
| `not-found.tsx:33` | 왼쪽 화살표 | 16px | 2 | **삭제**(오류 화면 버튼과 같게) |
| `not-found.tsx:42` | 검색 | 16px | 2 | **삭제** |

통일 방법: 모든 SVG를 `src/components/icons.tsx` 한 파일로 옮기고, 크기(16px)와 선 굵기(1.5)를 그 파일의 기본 컴포넌트 한 곳에만 적는다(항목 3). 18px는 Tailwind 정수 단계에 없어(임의 값 필요) 16px로 정한다.

---

## 디자인 방향

`UNSLOP-AUDIT.md` 2절 그대로다: **밤의 편집국·통신 데스크.** 차분한, 정확한, 종이 신문 같은.

- S2는 "조용한 크롬"을 맡는다. 색과 풍부함은 S3·S4의 두 모먼트(머리기사 사진, 통신 시각 목록)에 두고, 헤더·푸터·내비는 중립색 면과 헤어라인만 쓴다.
- 강조색(`accent`)은 S2에서 **현재 위치 표시에만** 쓴다: 활성 내비 항목, 활성 하단 탭, 활성 국가. 버튼 면·hover·열림 상태·로고·숫자에는 쓰지 않는다.
- 주요 버튼은 `text` 색 면 + `accent-ink` 글자. 화면마다 하나.
- 숫자(통계, 시계의 시각, 오류 코드, 404, 키캡)는 `font-mono tabular-nums`. 이 슬라이스의 시그니처 연결점은 헤더 시계의 `HH:mm:ss KST` 하나다.
- `live` 빨강은 S2에서 쓰지 않는다. 헤더·푸터의 빨간 점은 "실시간"을 뜻하지 않는 장식이라 지운다(속보 표시는 S3 티커의 몫).
- 금지(슬롭 패턴): 2색·그라데이션 워드마크, sparkle, 이모지 아이콘, 색 틴트 배지, 블러·글로우, 알약, 대문자 자간 라벨, 펄스, `transition-all`. 지운 장식 자리에 다른 장식을 넣지 않는다.
- 차별점은 새로 더하는 것이 아니라 정렬에서 나온다: 로고·내비 첫 글자·통계·본문이 한 세로선에 서고, 내비는 높이 40px 한 줄, 아이콘은 한 크기·한 굵기.

---

## 대상 파일 목록

수정:
- `src/components/Header.tsx`
- `src/components/Footer.tsx`
- `src/components/SearchBar.tsx`
- `src/components/AdminNav.tsx`
- `src/components/PageSkeleton.tsx`
- `src/app/layout.tsx`
- `src/app/error.tsx`
- `src/app/not-found.tsx`
- `src/app/admin/layout.tsx`

신규(3개):
- `src/components/icons.tsx` — 아이콘 한 벌(항목 3)
- `src/components/ui.ts` — 버튼 클래스 상수(항목 4)
- `tests/chrome-unslop.test.ts` — 정적 회귀 테스트(항목 21)

변경 없음(확인만): `src/app/breaking/loading.tsx`, `src/app/ranking/loading.tsx`, `src/app/category/[slug]/loading.tsx`(모두 `PageSkeleton` 재수출 한 줄), `src/lib/site.ts`, `src/lib/newsletter.ts`, `src/hooks/useSiteStats.ts`, `src/hooks/useScrollDirection.ts`.

### S1에 대한 가정 (Generator는 시작 전에 확인)
`tailwind.config.ts`·`globals.css`·`utils.ts`에 다음이 있어야 한다: 색 `surface-deep`, `accent-ink`, `negative`; 모서리 `rounded-tag`(6) `rounded-control`(8) `rounded-card`(12); `shadow-float`; `font-mono`; `text-meta`; `text-overline`의 자간 0; 전역 `:focus-visible { outline: 2px solid accent; outline-offset: 2px }`; `formatCount(n)`.
- 전역 `:focus-visible` 규칙이 **없으면** 항목 12·15의 입력 두 곳에 `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`를 붙이고 SELF_CHECK에 적어라.
- S2는 `.nav-link`, `.nav-link-active`, `.shimmer`, `animate-fade-in`, `animate-pulse-dot`, `shadow-dropdown`, `rounded-pill`, `rounded-badge`를 **쓰지 않는다**(S1이 지우든 남기든 무관하게 동작해야 한다).
- 지속 시간은 150·200·400만 쓴다(`duration-300` 금지 — S1 초안은 그 클래스를 만들지 않는다).

---

## 9개 패스 요약 (이 슬라이스 전체에 순서대로)

| 패스 | 이 슬라이스에서 하는 일 | 항목 |
|---|---|---|
| 1 간격 | 반 단계·임의 px 제거. 내비 줄 40px, 하단 탭 56px, 행 32/40px, 컨트롤 32/40px. 로고·내비·통계 왼쪽 정렬선 통일 | 6·7·9·10·11·12·13·14·17·18 |
| 2 색 | 워드마크 한 색, 초록·주황·빨강·파랑 제거, 강조색은 현재 위치만, 면은 불투명 토큰, 푸터·하단 탭 `surface-deep` | 2·5·6·8·9·10·11·13·15 |
| 3 아이콘 | 이모지·sparkle 제거, 한 파일·16px·선 1.5, 의미 없는 아이콘 3개 삭제 | 3·13·17·18 |
| 4 문구 | AI 배지 → 한 줄 문장, 확인 불가 주장 낮춤, 말줄임·끝 마침표 제거, 숫자 한 형식 | 2·6·12·13·15·16·18 |
| 5 서체 | 굵기 400/500, 워드마크만 600, 대문자·자간 제거, 숫자 mono, 12px 미만 없음, 웹폰트 로딩 | 1·5·6·10·13·16·17·18·19 |
| 6 레이아웃 | 섹션·순서 유지. 푸터 중복 링크 정리, 통계를 로고 옆으로 | 6·14 |
| 7 디테일 | 알약 → 모서리 8, 키캡, 카운트는 조용한 mono, 포커스 링 한 가지, 중첩 모서리 | 7·11·12·15·16·17 |
| 8 비주얼 | 블러 블롭·경고 타일·거대 404 제거(대체 장식 없음) | 17·18 |
| 9 모션 | 펄스·`transition-all`·높이 애니메이션·진입·shimmer 제거, 전환은 이름을 적고 200ms 이하 | 6·7·8·10·11·12·17·18·20 |

---

## 개선 항목

### 항목 1: 웹폰트를 렌더를 막지 않게 불러오기
- **[패스 5 서체 · 계약 3절 글꼴 로딩]**
- 대상 파일: `src/app/layout.tsx:34-37`
- 현재 문제: `font-serif`(Noto Serif KR)·`font-mono`(IBM Plex Mono)를 불러오는 곳이 없다. 흔한 `<link rel="stylesheet">`는 렌더를 막는다 — 실측(대조군 `c`): Google 응답이 4초 늦으면 첫 페인트 4,044ms, 하이드레이션 4,073ms. 실제 스타일시트는 `@font-face` 260개, 194KB(gzip 47KB)다.
- 개선 방법: 인라인 스크립트가 `<link>`를 만들어 `<head>`에 붙인다(스크립트가 넣은 스타일시트는 렌더를 막지 않는다). 서버 HTML에는 React가 하이드레이션 때 비교할 속성이 없어 불일치가 생길 수 없다.

  ```tsx
  // 파일 위쪽 (import 아래)
  const WEB_FONTS_URL =
    'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600&family=IBM+Plex+Mono:wght@400;500&display=swap';

  // A script-inserted <link> never blocks rendering, and the server HTML carries no attribute for
  // React to compare at hydration. If the request fails, font-serif / font-mono fall back to system fonts.
  const WEB_FONTS_SCRIPT = `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href=${JSON.stringify(
    WEB_FONTS_URL,
  )};l.setAttribute('data-webfonts','');document.head.appendChild(l)})()`;
  ```

  ```tsx
  <html lang="ko" className="dark">
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <script dangerouslySetInnerHTML={{ __html: WEB_FONTS_SCRIPT }} />
      <noscript>
        <link rel="stylesheet" href={WEB_FONTS_URL} />
      </noscript>
    </head>
    <body …>
  ```
  - `next/font/google` 금지(빌드 때 내려받는다). `media="print"` + `onload` 방식 금지 — 실측(`a1n`)에서 스타일시트가 하이드레이션보다 먼저 도착하면 `Warning: Prop media did not match. Server: "all" Client: "print"`가 났다.
  - `metadata`·`viewport` export와 `<head>` 블록은 함께 쓸 수 있다(Next가 합친다 — 실험에서 `<title>` 확인).
- 기대 효과: 글꼴 서버가 느리거나 죽어도 화면은 대체 글꼴로 바로 뜨고, 도착하면 `display=swap`으로 바뀐다. 운영 빌드는 네트워크 없이 된다.
- Planner 실측 (`qa-out/planner-s2-fonts`, 방식 `a2`가 위 코드):

  | 모드 | Google 응답 | 첫 페인트 | 하이드레이션 | `renderBlockingStatus` | 콘솔 경고 |
  |---|---|---|---|---|---|
  | dev | 정상 | 456ms | 817ms | non-blocking | 0 |
  | dev | 4초 지연 | 76ms | 464ms | non-blocking | 0 |
  | dev | 차단 | 88ms | 464ms | non-blocking | 0 (네트워크 실패 로그 1줄뿐) |
  | prod | 4초 지연 | 84ms | 126ms | non-blocking | 0 |
  | prod | 차단 | 68ms | 118ms | non-blocking | 0 |

  `unshare -n next build`(네트워크 없는 빌드)도 성공. `router.refresh()` 뒤에도 `link[data-webfonts]`는 1개.
- Evaluator 검증:
  1. `grep -n "next/font" -r src` → 0줄. `layout.tsx`의 `<head>` 블록이 `qa-out/planner-s2-fonts/app/(a2)/layout.jsx`와 같은 구조인지 대조.
  2. `node qa-out/planner-s2-check.js http://localhost:4000 qa-out` 의 `web fonts: one script-inserted non-blocking link + 2 preconnects`, `[fonts stalled 4s] first contentful paint does not wait`, `[fonts blocked] page still renders with fallback fonts`, `console has no React hydration errors or warnings` 가 PASS.
  3. dev 모드 하이드레이션 경고는 실험 앱으로 다시 본다(레포 루트에서 `next dev`를 돌리면 :4000이 쓰는 `.next`를 덮어쓰므로 금지): `cd qa-out/planner-s2-fonts && npx next dev -p 4107` 후 `VARIANTS=a2 CHROME_PATH=/usr/bin/google-chrome node test.js http://localhost:4107 dev` → 세 줄 모두 `"logs":[]` 또는 네트워크 실패 로그만.
  4. 참고: 이 샌드박스의 Chrome은 Google Fonts에 닿지 못한다. 스크린샷은 대체 글꼴 경로를 보여 준다. `document.fonts.check()`는 해당 글꼴 선언이 없어도 `true`를 돌려주므로 판정에 쓰지 마라.

### 항목 2: `layout.tsx` 크롬 — 테마색·본문 바로가기·설명문
- **[패스 2 색 · 템플릿 기본 중립색] [패스 4 문구 · 확인 불가 주장] [패스 5 서체 · 굵기]**
- 대상 파일: `src/app/layout.tsx:10, 18, 40`
- 현재 문제: `themeColor: '#0d1117'`(옛 GitHub 다크). 본문 바로가기가 강조색 면 + `font-semibold`. 설명문의 "실시간 AI 번역·요약", "글로벌 뉴스 허브"는 사실과 다르거나(수집은 몇 시간마다) 과장이다.
- 개선 방법:
  - `:10` → `themeColor: '#161513'`.
  - `:40` className → `sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-control focus:bg-text focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-ink`.
  - `:18` → `description: '전 세계 주요 뉴스를 한국어로 번역·요약해 전하는 뉴스 서비스'`. `title`·`openGraph`는 그대로.
  - `main`의 `focus:outline-none`(`:47`)은 그대로 둔다(프로그램 포커스 대상).
- 기대 효과: 모바일 브라우저 상단 색이 새 페이지 배경과 맞고, 강조색이 버튼 면에서 빠진다.
- Evaluator 검증: `curl -s localhost:4000/livenews/ | grep -o 'theme-color" content="[^"]*"'` → `#161513`. 체커의 `theme-color follows the surface token`, `first Tab lands on the skip link` PASS. 첫 Tab 뒤 바로가기의 배경이 `rgb(239, 233, 222)`, 글자가 `rgb(22, 21, 19)`.

### 항목 3: 아이콘 한 벌 — `src/components/icons.tsx`
- **[패스 3 아이콘 · 크기·굵기 혼재, AI sparkle, 의미 없는 아이콘]**
- 대상 파일: 신규 `src/components/icons.tsx`; 사용처 `Header.tsx:565-615`, `Footer.tsx:291-325`, `SearchBar.tsx:30-44`, `error.tsx:36-38`, `not-found.tsx:33-35, 42-44`
- 현재 문제: 위 전수표. 5개 파일에 SVG가 흩어져 크기 5종·굵기 2종.
- 개선 방법: `'use client'` 없이(서버·클라이언트 양쪽에서 import) 아래 모양으로 만든다. 크기·굵기는 기본 컴포넌트에만 있고 props로 바꿀 수 없다. 색은 `currentColor`(부모 글자색).

  ```tsx
  import type { ReactNode } from 'react';

  // One set (Heroicons outline paths), one box (16px), one stroke (1.5). Color comes from the parent text role.
  function Icon({ children }: { children: ReactNode }) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
        {children}
      </svg>
    );
  }
  // Brand glyphs are filled shapes; same 16px box.
  function Glyph({ children }: { children: ReactNode }) {
    return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">{children}</svg>;
  }
  export function SearchIcon() { return <Icon><path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></Icon>; }
  ```
  - 내보낼 것(기존 path 그대로 옮김): `SearchIcon`, `HomeIcon`, `BoltIcon`, `GlobeIcon`, `ExternalIcon`, `MailIcon`, `CheckIcon`(`Footer.tsx:61`의 path), `GithubIcon`·`XIcon`(`Glyph`).
  - 새로 추가: `MenuIcon` `<path d="M4 6h16M4 12h16M4 18h16" />`, `CloseIcon` `<path d="M6 6l12 12M18 6L6 18" />`.
  - 삭제: `AiIcon`(sparkle), `ChartIcon`, 경고 삼각형, 왼쪽 화살표.
  - 다섯 파일의 인라인 `<svg>`와 로컬 아이콘 함수는 모두 지우고 여기서 import한다. 아이콘과 라벨 사이는 항상 `gap-2`(8px).
- 기대 효과: 아이콘이 한 크기·한 굵기·글자색으로 보이고, 다음에 추가되는 아이콘도 같은 규칙을 따른다.
- Evaluator 검증: `grep -c "<svg" src/components/{Header,Footer,SearchBar}.tsx src/app/{error,not-found}.tsx` → 모두 0. `grep -o "strokeWidth={[^}]*}" src/components/icons.tsx | sort -u` → `strokeWidth={1.5}` 하나. 체커의 `chrome has no icon violations`(모든 뷰포트·페이지) PASS — 보이는 모든 SVG가 16×16, 선 1.5.

### 항목 4: 버튼 클래스 한 벌 — `src/components/ui.ts`
- **[패스 2 색 · 강조색 면 버튼] [패스 7 디테일 · 알약, 컨트롤 모서리]**
- 대상 파일: 신규 `src/components/ui.ts`; 사용처 `SearchBar.tsx:61`, `Footer.tsx:84`, `error.tsx:59, 66`, `not-found.tsx:31, 40`
- 현재 문제: 주요 버튼 4개가 모두 주황 면(`bg-accent text-surface`), 알약 또는 제각각의 모서리·패딩·굵기(`px-4 py-1.5`, `px-4 py-2`, `px-6 py-2.5`, `px-5 sm:px-6 py-2.5`).
- 개선 방법:

  ```ts
  // Shared control classes (UNSLOP-AUDIT §3: primary = text-colored surface + accent-ink label).
  // Complete literals — Tailwind scans this file.
  const BTN =
    'inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-control px-5 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-60';
  export const BTN_PRIMARY = `${BTN} bg-text text-accent-ink hover:bg-text/90`;
  export const BTN_SECONDARY = `${BTN} border border-border bg-surface-elevated text-text hover:bg-surface-card`;
  ```
- 기대 효과: 버튼 높이 40px·모서리 8px·굵기 500 한 가지. 강조색은 현재 위치 표시에만 남는다.
- Evaluator 검증: `grep -rn "bg-accent" src/components/{Header,Footer,SearchBar,AdminNav,PageSkeleton,ui}.ts* src/app/{layout,error,not-found}.tsx src/app/admin/layout.tsx` → 0줄. 체커의 `primary button = text surface + accent-ink label` PASS.

### 항목 5: 워드마크 — 한 색 `LiveNews`
- **[패스 2 색 · 그라데이션/다색 로고] [패스 5 서체 · 800, 음수 자간] [패스 7 디테일 · 로고는 주 글꼴의 제품 이름] [패스 9 모션 · 펄스]**
- 대상 파일: `src/components/Header.tsx:218-224`, `src/components/Footer.tsx:150-154`, `src/app/admin/layout.tsx:21-23`
- 현재 문제: 헤더는 빨강 `Live` + 파랑 `News` + 회색 `.co.kr` + 깜박이는 빨간 점, 푸터는 주황 `LiveNews` + 회색 `.co.kr` + 빨간 점, 관리자는 주황 굵은 글자. 세 곳이 서로 다르고 모두 생성된 장식이다(계약 2절).
- 개선 방법:
  - 헤더: `<Link href="/" className="flex h-12 items-center select-none text-lg font-semibold text-text">LiveNews</Link>` — 안쪽 span 4개와 점 삭제. 글자는 링크의 직접 자식(체커가 색 1개를 확인한다).
  - 푸터: `<p className="mb-3 text-lg font-semibold text-text">LiveNews</p>` — `.co.kr` span과 점 삭제.
  - 관리자: `<Link href="/admin" className="whitespace-nowrap text-lg font-semibold text-text">LiveNews Admin</Link>`.
  - `.co.kr`은 제품 이름이 아니라 도메인이다(문서 제목·OG `siteName`·저작권 줄 모두 `LiveNews`). 워드마크에서 뺀다.
  - 빨간 점은 헤더·푸터 어디에도 두지 않는다.
- 기대 효과: 세 곳의 로고가 같은 글자·같은 색·같은 굵기(18px/600)로 읽힌다.
- Evaluator 검증: 체커의 `logo is the one-color wordmark "LiveNews"`(색 1개 `rgb(239, 233, 222)`, 굵기 600), `chrome has no anim violations` PASS. `grep -n "co\.kr" src/components/Header.tsx` → 0줄. 푸터 `innerText` 첫 줄이 `LiveNews`.

### 항목 6: 헤더 1단 — 통계와 시계
- **[패스 1 간격 · 반 단계, 숫자와 단위가 떨어짐, 정렬] [패스 2 색 · 주황 숫자·색 점] [패스 4 문구 · 숫자 형식] [패스 5 서체 · mono, 10px, 자간] [패스 9 모션 · 펄스]**
- 대상 파일: `src/components/Header.tsx:17-59, 226-229`
- 현재 문제: `inline-flex gap-1.5`가 글자 조각 사이마다 6px를 넣어 `344 건`으로 보인다. 오늘 건수만 주황 굵은 글자. 초록·주황 점이 깜박인다. `KST`는 10px 굵은 넓은 자간. 통계 상자가 `max-w-[320px]`로 가운데 떠 있다. `toLocaleString`.
- 개선 방법:
  - `LiveStats`(`:51-58`):
    ```tsx
    <p className="truncate text-caption text-text-secondary select-none">
      오늘 <span className="font-mono tabular-nums text-text">{formatCount(stats.articlesToday)}</span>건 업데이트
      <span aria-hidden="true" className="mx-2 text-text-muted">·</span>
      전체 <span className="font-mono tabular-nums text-text">{formatCount(stats.totalArticles)}</span>건
    </p>
    ```
    `formatCount`는 `@/lib/utils`(S1)에서 import. 점 span과 `font-semibold text-accent` 삭제.
  - 감싸는 div(`:227`) → `className="ml-4 hidden min-w-0 flex-1 sm:block"`.
  - `LiveClock`(`:29-41`): 라벨을 마지막 공백에서 날짜와 시각으로 나눈다(형식은 `tests/site.test.ts`가 고정한다).
    ```tsx
    const cut = clock.label.lastIndexOf(' ');
    return (
      <time dateTime={clock.dateTime} className="hidden whitespace-nowrap text-caption text-text-muted tabular-nums select-none md:block">
        {clock.label.slice(0, cut)}{' '}
        <span className="font-mono">{clock.label.slice(cut + 1)} KST</span>
      </time>
    );
    ```
    점 span 삭제. 접근 가능한 이름은 전과 같은 `11월 12일 (목) 10:13:08 KST`.
  - **`font-mono`는 숫자·라틴 문자 조각에만 건다.** 스택에 한글 글꼴이 없어서 한글이 섞이면 Windows에서 굴림체 계열로 떨어진다. 날짜의 한글(`11월 12일 (목)`)은 Pretendard + `tabular-nums`로 둔다.
- 기대 효과: `오늘 344건 업데이트 · 전체 164,917건`이 한 줄 문장으로 붙어 읽히고, 숫자는 고정폭이라 갱신돼도 흔들리지 않는다. 통계가 로고 옆에 붙어 왼쪽 정렬선을 따른다.
- Evaluator 검증: 체커의 `header stats: one number format`, `header digits are mono + tabular`, `chrome has no tracking violations`, `chrome has no tiny violations` PASS. `grep -n "toLocaleString" src/components/Header.tsx src/components/Footer.tsx` → 0줄. 1440px 스크린샷에서 통계가 로고 바로 오른쪽(간격 16px)에 있고 숫자와 `건` 사이에 틈이 없다.

### 항목 7: 헤더 1단 — 검색 토글·키캡·모바일 버튼
- **[패스 1 간격 · 반 단계·임의 px] [패스 2 색 · 열림 상태에 강조색] [패스 3 아이콘 · span 햄버거] [패스 7 디테일 · 알약, 키캡] [패스 9 모션 · transition-all]**
- 대상 파일: `src/components/Header.tsx:232-295`
- 현재 문제: 검색 토글이 알약 + 열리면 주황 테두리·글자·틴트, `transition-all`. 키캡이 10px 글자에 `px-1.5 py-0.5`. 모바일 버튼 hover가 주황. 햄버거는 span 3개에 `top-[5px]/[9px]/[13px]`와 `transition-all duration-300`.
- 개선 방법:
  - 오른쪽 묶음(`:232`) → `className="-mr-3 flex items-center gap-2 lg:mr-0"`(모바일에서 40px 버튼 안의 16px 아이콘이 페이지 가장자리 16px 선에 맞는다).
  - 데스크톱 검색 토글(`:243-248`) →
    `cn('hidden h-8 items-center gap-2 rounded-control border border-border px-3 text-sm transition-colors sm:inline-flex', searchOpen ? 'bg-surface-elevated text-text' : 'text-text-secondary hover:bg-surface-elevated hover:text-text')`, 안에 `<SearchIcon />`.
  - 키캡(`:252-254`) — 유지하되 →
    `<kbd aria-hidden="true" className="ml-1 hidden h-5 min-w-5 items-center justify-center rounded-tag border border-border bg-surface px-1 font-mono text-meta text-text-muted lg:inline-flex">/</kbd>`
  - 모바일 검색 버튼(`:265`) → `className="inline-flex h-10 w-10 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text sm:hidden"`, 안에 `<SearchIcon />`.
  - 메뉴 버튼(`:278-293`) → 같은 클래스에서 `sm:hidden` 대신 `lg:hidden`. 안쪽 div와 span 3개를 지우고 `{mobileOpen ? <CloseIcon /> : <MenuIcon />}`. `aria-label="메뉴"`, `aria-expanded`, `aria-controls`, `ref`는 그대로.
- 기대 효과: 컨트롤 높이 32px(데스크톱)·40px(터치) 두 가지, 모서리 8px, 열림은 면 한 단계로만 표시.
- Evaluator 검증: 체커의 `chrome has no grid violations`, `chrome has no pill violations` PASS, `"/" opens search and focuses the input`, `Escape closes search and returns focus to its toggle` PASS. 390px에서 메뉴 버튼을 눌러 아이콘이 ≡ ↔ ✕로 바뀌고 `aria-expanded`가 따라 바뀌는지 확인. 키캡 계산값: 높이 20px, `border-radius: 6px`, 글꼴 IBM Plex Mono 12px.

### 항목 8: 헤더 표면·접힘·검색 펼침
- **[패스 2 색 · 반투명 면 + backdrop-blur] [패스 9 모션 · 높이·패딩 애니메이션, ease-in-out, 300ms]**
- 대상 파일: `src/components/Header.tsx:201-213, 298-308`
- 현재 문제: 헤더가 `bg-surface/95 backdrop-blur-md`. 검색 펼침이 `max-height`와 `padding`을 300ms `ease-in-out`으로 애니메이션한다(레이아웃 속성).
- 개선 방법:
  - 헤더(`:203`) → `'sticky top-0 z-50 w-full border-b border-border bg-surface transition-transform duration-200'`. 접힘 `-translate-y-12`와 조건식(`:197`)은 그대로. `style={{ '--nav-h': … }}`(`:208`) 삭제(항목 9에서 클래스로 대체).
  - 검색 영역(`:302-305`) →
    `cn('transition-opacity duration-200', searchOpen ? 'visible pb-3 opacity-100' : 'invisible h-0 overflow-hidden opacity-0')`
    열렸을 때는 `overflow-hidden`이 없어야 한다(입력의 포커스 링이 잘리지 않게). 80ms 뒤 입력 포커스(`:164-170`)는 그대로.
  - `<SearchBar placeholder="뉴스 검색..." />`(`:307`) → `<SearchBar />`.
- 기대 효과: 헤더가 한 장의 불투명한 면이 되고, 펼침은 opacity만 움직인다.
- Evaluator 검증: 체커의 `header surface is solid`(`rgb(22, 21, 19)`), `chrome has no blur violations` PASS. `grep -nE "max-height|padding\]|ease-in-out|duration-300|backdrop" src/components/Header.tsx` → 0줄. 검색을 연 상태에서 입력에 포커스 → 2px 주황 링 네 변이 모두 보인다(스크린샷).

### 항목 9: 데스크톱 내비
- **[패스 1 간격 · 같은 것이 다른 높이, 정렬] [패스 2 색 · 초록 링크, hover 강조색, 반투명 면] [패스 3 아이콘 · 한 항목만 아이콘] [패스 6 레이아웃 · 내비는 조용하게] [패스 7 디테일 · 활성 상태]**
- 대상 파일: `src/components/Header.tsx:311-371` (`globals.css`의 `.nav-link*`는 더 이상 쓰지 않는다)
- 현재 문제: 활성 링크만 `border-b-2`가 붙어 38px, 나머지 36px. "Hacker News"는 초록 굵은 글자. 모든 링크 hover가 주황. "랭킹"만 아이콘이 있다. 내비 면이 `bg-surface-card/60`. 첫 글자가 로고보다 12px 안쪽.
- 개선 방법:
  - 파일 위쪽에 상수:
    ```ts
    const NAV_LINK = 'inline-flex h-10 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors focus-visible:-outline-offset-2';
    const NAV_IDLE = 'border-transparent text-text-secondary hover:text-text';
    const NAV_ACTIVE = 'border-accent text-accent';
    ```
    (`focus-visible:-outline-offset-2`: `overflow-x-auto`인 줄 안에서는 바깥 링이 위아래로 잘리므로 같은 2px 링을 안쪽에 그린다.)
  - `<nav>`(`:312-316`) → `className="hidden h-10 border-t border-border-muted lg:block"`, `style` 삭제.
  - `<ul>`(`:320`) → `className="-mx-3 flex h-10 items-center overflow-x-auto scrollbar-none"`(첫 글자와 "랭킹" 끝이 로고·검색 버튼의 가장자리와 맞는다).
  - 메뉴 링크(`:330-333`) → `className={cn(NAV_LINK, active ? NAV_ACTIVE : NAV_IDLE)}`. `data-active`, `aria-current` 그대로.
  - Hacker News(`:344`) → `className={cn(NAV_LINK, NAV_IDLE)}`, 안에 `Hacker News <ExternalIcon />`. `ml-1`, `text-accent-green`, `font-semibold` 삭제. `aria-label="Hacker News (새 창)"`, `target`, `rel` 그대로.
  - 랭킹(`:355-368`) → `<li className="ml-auto flex items-center gap-2">` 유지, 구분선 `h-4 w-px bg-border-muted` 유지, 링크 `className={cn(NAV_LINK, isActive('/ranking') ? NAV_ACTIVE : NAV_IDLE)}`, `<ChartIcon>` 삭제.
- 기대 효과: 12개 링크가 높이 40px 한 줄에 같은 기준선으로 서고, 주황은 지금 보고 있는 항목 하나뿐이다.
- Evaluator 검증: 체커의 `nav links share one 40px row`, `accent only on the current nav item`, `Hacker News link is neutral` PASS(`/`, `/us`, `/nope`). `grep -n "nav-link" src/components/Header.tsx` → 0줄. 1440px에서 `홈` 글자 왼쪽 x == 로고 왼쪽 x(±1px), 내비 링크에 Tab → 링이 잘리지 않고 안쪽에 보인다.

### 항목 10: 모바일 펼침 메뉴
- **[패스 1 간격 · 반 단계, 라벨 간격] [패스 2 색 · 초록 행, 강조색 틴트] [패스 5 서체 · 대문자·자간] [패스 7 디테일 · 알약 칩, 활성 상태] [패스 9 모션 · max-height 애니메이션]**
- 대상 파일: `src/components/Header.tsx:373-452`
- 현재 문제: `max-height`를 300ms로 애니메이션. 라벨 `uppercase tracking-widest`. 항목 `py-2.5`. Hacker News 행이 초록 글자 + 초록 틴트 면. 국가 칩이 알약 + 활성 시 주황 테두리·틴트. 국가 href 계산이 두 번 중복(`:429-430`, `:533-534`).
- 개선 방법:
  - 파일 위쪽에 `const COUNTRY_LINKS = COUNTRIES.filter((c) => c.code !== 'all').map((c) => ({ ...c, href: c.code === 'global' ? '/world' : `/${c.code}` }));` — 모바일 메뉴와 플라이아웃이 함께 쓴다.
  - 컨테이너(`:378-383`) →
    `cn('bg-surface-card transition-opacity duration-200 lg:hidden', mobileOpen ? 'visible max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain border-t border-border-muted opacity-100' : 'invisible max-h-0 overflow-hidden opacity-0')`
    (`max-h-[calc(…)]`는 뷰포트 안에 가두는 기능 값이라 남긴다. 애니메이션은 하지 않는다.)
  - `<nav>`(`:385`) → `className="mx-auto max-w-screen-xl px-4 py-4"`.
  - 라벨 2개(`:386, :425`) → `"mb-2 text-overline text-text-muted"` / `"mb-2 mt-6 text-overline text-text-muted"`(위 24, 아래 8).
  - 메뉴 항목(`:398-403`) → `cn('flex h-10 items-center justify-center rounded-control px-3 text-sm font-medium transition-colors', active ? 'bg-surface-elevated text-accent' : 'text-text-secondary hover:bg-surface-elevated hover:text-text')`.
  - Hacker News(`:418`) → `className="mt-2 flex h-10 items-center gap-2 rounded-control px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text"`, `<ExternalIcon />`.
  - 국가 목록(`:428`) → `className="flex flex-wrap gap-2"`, 링크(`:438-443`) → `cn('inline-flex h-8 items-center rounded-control border px-3 text-sm transition-colors', active ? 'border-accent text-accent' : 'border-border text-text-secondary hover:bg-surface-elevated hover:text-text')`.
- 기대 효과: 행 40px·칩 32px, 모서리 8px, 주황은 현재 위치에만.
- Evaluator 검증: 390px에서 메뉴를 열고 체커를 다시 돌릴 필요 없이 — 닫힌 상태의 요소도 체커 감사에 포함된다(`chrome has no upper/tracking/grid/pill violations` PASS). 수동: `/us`에서 메뉴 열기 → 주황 글자는 `미국`(메뉴 칸과 국가 칩)뿐, Hacker News는 회색. ESC → 닫히고 포커스가 메뉴 버튼으로.

### 항목 11: 모바일 하단 탭과 국가 플라이아웃
- **[패스 1 간격 · 반 단계, 터치 영역] [패스 2 색 · 블러 면, 열림에 강조색] [패스 3 아이콘 · 20px] [패스 5 서체 · 10px] [패스 7 디테일 · 중첩 모서리, 그림자] [패스 9 모션 · scale 메뉴]**
- 대상 파일: `src/components/Header.tsx:455-560`
- 현재 문제: 탭 바가 `bg-surface/95 backdrop-blur-md`. 라벨 10px, 아이콘 20px(선 1.5와 2 혼재). "국가" 버튼은 현재 위치가 아니라 **열렸을 때** 주황이 된다(국가 페이지에 있어도 닫혀 있으면 회색). 플라이아웃은 `shadow-dropdown` + `scale-95`, 행 `py-2.5`, 활성 행 주황 틴트.
- 개선 방법:
  - 바(`:456`) → `className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-deep safe-area-bottom lg:hidden"`.
  - `<ul>`(`:458`) → `className="grid h-14 grid-cols-4"`.
  - 상수 `const TAB = 'flex h-14 w-full flex-col items-center justify-center gap-1 text-caption font-medium transition-colors focus-visible:-outline-offset-2';`
  - 홈·속보·검색 링크 → `className={cn(TAB, isActive(href) ? 'text-accent' : 'text-text-secondary hover:text-text')}`, 아이콘은 `icons.tsx`의 16px.
  - 국가 버튼(`:513-516`): `const countryActive = COUNTRY_LINKS.some((c) => isActive(c.href));` →
    `className={cn(TAB, countryActive ? 'text-accent' : countryOpen ? 'text-text' : 'text-text-secondary hover:text-text')}`. `aria-expanded/controls/haspopup`, `ref` 그대로.
  - 플라이아웃(`:525-530`) →
    `cn('absolute bottom-full right-4 mb-2 w-40 rounded-card border border-border bg-surface-card p-1 shadow-float transition-[transform,opacity] duration-200', countryOpen ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible translate-y-1 opacity-0')`
    `<ul className="py-1">` → `<ul>`. (모서리 12 − 안쪽 여백 4 = 행 모서리 8.)
  - 행(`:542-547`) → `cn('flex h-10 items-center justify-between rounded-control px-3 text-sm transition-colors', active ? 'text-accent' : 'text-text-secondary hover:bg-surface-elevated hover:text-text')`, 영문 라벨(`:550`) → `className="text-caption text-text-muted"`.
- 기대 효과: 탭 하나가 56px 전체 높이의 터치 영역이 되고, 주황은 "지금 있는 곳" 하나만 가리킨다. 메뉴는 4px 올라오며 나타난다.
- Evaluator 검증: 체커의 `bottom tab: surface-deep, accent only on current location` PASS — `/` → `홈`, `/us` → `국가`, `/nope` → 없음. 390px에서 국가 버튼 탭 → 플라이아웃이 화면 오른쪽에서 16px 떨어져 열리고 `box-shadow`가 `rgba(0, 0, 0, 0.35) 0px 8px 24px 0px`, ESC → 포커스가 국가 버튼으로.

### 항목 12: 검색창 `SearchBar`
- **[패스 1 간격 · 반 단계] [패스 2 색 · 강조색 버튼] [패스 4 문구 · 말줄임 플레이스홀더] [패스 7 디테일 · 알약, 중첩 모서리, 포커스 링] [패스 9 모션 · transition-all]**
- 대상 파일: `src/components/SearchBar.tsx:13, 26-66`
- 현재 문제: 알약 입력 안에 알약 주황 버튼을 `right-1.5`로 겹쳐 놓았다(바깥 모서리와 안쪽 모서리가 맞지 않음). `outline-none` + `ring-accent/30`으로 포커스 링을 바꿨다. `transition-all`. 플레이스홀더 `뉴스 검색...`.
- 개선 방법: 푸터 구독 폼과 같은 모양(입력 + 옆 버튼)으로.
  ```tsx
  <form onSubmit={handleSubmit} role="search" className="flex w-full gap-2">
    <div className="relative min-w-0 flex-1">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted"><SearchIcon /></span>
      <input … className="h-10 w-full rounded-control border border-border bg-surface-elevated pl-10 pr-3 text-sm text-text transition-colors placeholder:text-text-muted" />
    </div>
    <button type="submit" className={BTN_PRIMARY}>검색</button>
  </form>
  ```
  기본 `placeholder = '뉴스 검색'`. `ref`, `type="search"`, `name="q"`, `aria-label="뉴스 검색"`, `autoComplete="off"`, props 시그니처는 그대로.
- 기대 효과: 높이 40px 컨트롤 두 개가 8px 간격으로 서고, 포커스는 사이트 공통 링으로 보인다.
- Evaluator 검증: 체커의 `search placeholder has no ellipsis` PASS. 입력에 포커스 → `outline: 2px solid rgb(240, 136, 62)`, `outline-offset: 2px`, `box-shadow: none`. `/` → 검색어 입력 → Enter → `/livenews/search?q=…`로 이동(기능 회귀).

### 항목 13: 푸터 — 소개, AI 문장, 카테고리, 바로가기
- **[패스 2 색 · 파란 틴트 배지, hover 강조색] [패스 3 아이콘 · 이모지, sparkle] [패스 4 문구 · AI 배지, 끝 마침표] [패스 5 서체 · 대문자·자간] [패스 1 간격 · 반 단계, 행 높이]**
- 대상 파일: `src/components/Footer.tsx:138-200`
- 현재 문제: 파란 테두리·파란 면·sparkle의 "OpenAI GPT 기반 자동 번역 · 카테고리 분류 · 요약 시스템 운영 중" 배지. 카테고리 12개 앞에 이모지. 섹션 라벨 `uppercase tracking-widest`. 푸터 면이 카드색(`bg-surface-card`). 모든 링크 hover가 주황.
- 개선 방법:
  - `<footer>`(`:138`) → `className="mt-12 w-full border-t border-border bg-surface-deep pb-16 lg:pb-0"`.
  - 1열(`:149-164`) 전체를 다음으로:
    ```tsx
    <div>
      <p className="mb-3 text-lg font-semibold text-text">LiveNews</p>
      <p className="text-body-md text-text-secondary">전 세계 주요 뉴스를 한국어로 번역·요약해 전합니다</p>
      <p className="mt-2 text-caption text-text-muted">번역·카테고리 분류·요약은 OpenAI GPT 모델로 자동 처리합니다</p>
    </div>
    ```
    테두리·배경·아이콘 없음. 사실은 그대로(OpenAI GPT, 번역·분류·요약, 자동).
  - 모든 섹션 라벨(`:168, 185, 211, 237`과 `:52`) → `text-overline text-text-muted mb-3`, 열 안의 두 번째 라벨은 `mt-6`을 더한다(`:185`의 `mt-5 mb-2` → `mt-6 mb-3`). `<h2>` 태그는 그대로.
  - 카테고리 `<ul>`(`:171`) → `className="grid grid-cols-2 gap-x-4"`, 링크(`:174-180`) → `className="inline-flex h-8 items-center text-body-md text-text-secondary transition-colors hover:text-text"`, 내용은 `{cat.label}`만(아이콘 span 없음).
  - 바로가기 `<ul>`(`:188`) → `className="flex flex-wrap gap-x-4"`, 링크(`:193`) → 카테고리 링크와 같은 클래스.
- 기대 효과: 푸터가 가장 깊은 면 위의 글자 목록이 된다. AI 처리 사실은 꾸밈 없이 한 줄로 남는다.
- Evaluator 검증: 체커의 `footer: surface-deep, plain AI sentence, wordmark`, `chrome has no emoji violations`, `chrome has no upper violations` PASS. `curl -s localhost:4000/livenews/ | grep -c "운영 중"` → 0. 푸터 카테고리 링크 12개의 높이가 모두 32px.

### 항목 14: 푸터 — 연락처와 소셜을 한 가지 행 모양으로
- **[패스 6 레이아웃 · 같은 링크 중복, 목록 모양 2종] [패스 1 간격 · 반 단계, 아이콘 열] [패스 2 색 · hover 강조색]**
- 대상 파일: `src/components/Footer.tsx:209-267`
- 현재 문제: GitHub와 이메일이 "연락처"(글자 행)와 "소셜"(사각 아이콘 타일)에 각각 한 번씩, 모두 같은 주소로 들어 있다. 행 간격 `space-y-2.5`.
- 개선 방법: 두 섹션과 순서는 유지하고 링크는 한 번씩만, 모두 같은 행 모양으로.
  - 행 클래스: `flex h-8 items-center gap-2 text-body-md text-text-secondary transition-colors hover:text-text`(아이콘 16px은 글자색을 따른다 — `text-text-muted` 지정 삭제).
  - 연락처 `<ul>`: `<MailIcon /> contact@livenews.co.kr` 한 행.
  - 소셜: 라벨 `mt-6 mb-3`, `<ul>`에 `<XIcon /> X` (`https://twitter.com/livenews_kr`), `<GithubIcon /> GitHub` (`https://github.com/livenews`) 두 행. 글자 라벨이 보이므로 `aria-label`은 뺀다. `target="_blank" rel="noopener noreferrer"` 유지.
  - 사각 타일 3개(`:240-266`) 삭제.
- 기대 효과: 세 목적지는 모두 남고, 아이콘은 한 열·라벨은 한 줄에 선다.
- Evaluator 검증: 푸터의 `a[href]` 중 `mailto:`·`github.com/livenews`·`twitter.com/livenews_kr`가 각각 정확히 1개. 세 행의 아이콘 왼쪽 x가 같고 높이 32px.

### 항목 15: 푸터 — 뉴스레터 폼 (플래그가 켜졌을 때만 보임)
- **[패스 2 색 · 초록 틴트 상자, 강조색 버튼] [패스 4 문구 · 확인 불가 주장, 끝 마침표] [패스 7 디테일 · 포커스 링] [패스 1 간격 · 반 단계]**
- 대상 파일: `src/components/Footer.tsx:50-95`
- 현재 문제: "매일 아침 AI가 선별한 핵심 뉴스"(발송 주기·선별 방식은 코드에 근거가 없다). 성공 상태가 초록 틴트 상자. 입력이 `focus:outline-none` + 다른 링. 버튼이 주황 면.
- 개선 방법:
  - 설명(`:55-57`) → `<p className="mb-3 text-caption text-text-secondary">주요 뉴스를 이메일로 받아 보세요</p>`.
  - 성공(`:59-64`) → `<p role="status" className="flex h-10 items-center gap-2 text-body-md text-text"><CheckIcon />구독 신청이 접수되었습니다</p>`.
  - 입력(`:79`) → `className="h-10 min-w-0 flex-1 rounded-control border border-border bg-surface-elevated px-3 text-body-md text-text transition-colors placeholder:text-text-muted"`.
  - 버튼(`:84`) → `className={BTN_PRIMARY}`.
  - 오류 문구(`:89`) → `className="mt-2 text-caption text-negative empty:hidden"`(문장 두 개라 마침표 유지).
  - `label`·`htmlFor`·`role="status"`·제출 로직은 그대로.
- 기대 효과: 폼이 검색창과 같은 컨트롤로 보이고, 지킬 수 없는 약속을 하지 않는다.
- Evaluator 검증: `NEXT_PUBLIC_NEWSLETTER_ENABLED=true` 빌드가 없으면 소스로 확인 — `grep -nE "accent-green|accent-red|focus:ring|매일 아침" src/components/Footer.tsx` → 0줄. `npm test`의 `newsletter.test.ts` 통과(로직 불변).

### 항목 16: 푸터 — 하단 바와 통계
- **[패스 4 문구 · 숫자 한 가지 형식] [패스 5 서체 · `<strong>` 700, mono] [패스 7 디테일 · 카운트는 조용한 글자]**
- 대상 파일: `src/components/Footer.tsx:101-120, 273-285`
- 현재 문제: 숫자가 `<strong>`(700). `toLocaleString`. 활성 소스 수는 형식 함수 없이 출력. 구분자 `|`를 테두리색(`text-border`) 글자로 그렸다.
- 개선 방법:
  - `FooterStats`:
    ```tsx
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text-muted">
      <span>전체 기사 <span className="font-mono tabular-nums text-text-secondary">{formatCount(stats.totalArticles)}</span>건</span>
      <span aria-hidden="true" className="hidden sm:inline">·</span>
      <span className="hidden sm:inline">오늘 <span className="font-mono tabular-nums text-text-secondary">{formatCount(stats.articlesToday)}</span>건</span>
      <span aria-hidden="true" className="hidden sm:inline">·</span>
      <span className="hidden sm:inline">활성 소스 <span className="font-mono tabular-nums text-text-secondary">{formatCount(stats.activeSources)}</span>개</span>
    </p>
    ```
  - 면책 문단(`:276`) → `className="mb-3 max-w-2xl text-caption leading-5 text-text-muted"`(문구 그대로).
  - 저작권(`:282`) → `className="shrink-0 whitespace-nowrap text-caption text-text-muted"`, `suppressHydrationWarning` 유지.
- 기대 효과: 헤더와 푸터의 숫자가 같은 형식(`164,917건`)·같은 글꼴로 보인다.
- Evaluator 검증: 체커의 `footer stats format`, `chrome has no weight violations` PASS. `grep -n "<strong" src/components/Footer.tsx` → 0줄.

### 항목 17: 오류 화면 `error.tsx`
- **[패스 8 비주얼 · 블러 블롭·글로우 타일] [패스 2 색 · 빨강 테두리·강조색 버튼] [패스 5 서체 · 굵기] [패스 7 디테일 · 알약 버튼, 배지] [패스 9 모션 · 진입 애니메이션] [패스 1 간격 · 임의 값]**
- 대상 파일: `src/app/error.tsx:30-72`
- 현재 문제: 빨간 블러 블롭 위의 원형 타일 + 40px 경고 아이콘, `animate-fade-in`, `min-h-[60vh]`, 오류 코드가 테두리 있는 배지, 알약 버튼 2개(주황 면 / 테두리), `font-semibold`.
- 개선 방법: 반환 JSX를 다음으로(로직 `:14-28`은 그대로).
  ```tsx
  <div className="flex flex-col items-center px-4 py-24 text-center sm:py-32">
    <h1 className="text-headline-lg text-text">문제가 발생했습니다</h1>
    <p className="mt-3 max-w-md text-body-md text-text-secondary">
      페이지를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
    </p>
    {error.digest && (
      <p className="mt-2 text-caption text-text-muted">오류 코드 <span className="font-mono">{error.digest}</span></p>
    )}
    <div className="mt-8 flex items-center gap-3">
      <button type="button" onClick={retry} disabled={retrying} className={BTN_PRIMARY}>다시 시도</button>
      {/* Full reload on purpose (drops broken client state); plain <a> needs the basePath */}
      <a href={withBasePath('/')} className={BTN_SECONDARY}>홈으로</a>
    </div>
  </div>
  ```
- 기대 효과: 무슨 일이 났고 무엇을 할 수 있는지만 남는다. 주요 동작 하나, 보조 하나.
- Evaluator 검증: `grep -nE "blur|rounded-full|animate-|accent-red|rounded-pill|<svg|min-h-\[" src/app/error.tsx` → 0줄. 오류를 일으킬 수 있는 환경이면(지난 라운드의 `planner-s2-harness.sh` 방식) h1 `문제가 발생했습니다`, "다시 시도" 배경 `rgb(239, 233, 222)`, "홈으로" href가 `/livenews`인지 확인. 아니면 소스 대조 + `tsc`.

### 항목 18: 404 화면 `not-found.tsx`
- **[패스 8 비주얼 · 블러 블롭] [패스 5 서체 · 800, tracking-tighter, 임의 크기] [패스 2 색 · 강조색 숫자·버튼] [패스 3 아이콘 · 버튼 아이콘] [패스 4 문구 · 긴 버튼 라벨] [패스 7 디테일 · 알약] [패스 9 모션 · 진입]**
- 대상 파일: `src/app/not-found.tsx:7-50`
- 현재 문제: 112~144px `font-extrabold tracking-tighter`의 `404`(가운데 0만 주황 30%) + 블러 블롭, `animate-fade-in`, 알약 버튼 2개에 아이콘, 오류 화면과 다른 라벨("홈으로 돌아가기" vs "홈으로").
- 개선 방법:
  ```tsx
  <div className="flex flex-col items-center px-4 py-24 text-center sm:py-32">
    <p aria-hidden="true" className="font-mono tabular-nums text-meta text-text-muted">404</p>
    <h1 className="mt-3 text-headline-lg text-text">페이지를 찾을 수 없습니다</h1>
    <p className="mt-3 max-w-md text-body-md text-text-secondary">
      요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      최신 뉴스는 홈 페이지에서 확인하실 수 있습니다.
    </p>
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <Link href="/" className={BTN_PRIMARY}>홈으로</Link>
      <Link href="/search" className={BTN_SECONDARY}>뉴스 검색</Link>
    </div>
  </div>
  ```
  `metadata`(`:5`)는 그대로. 서버 컴포넌트로 남는다(`ui.ts`는 순수 상수).
- 기대 효과: 상태 코드는 통신 전문의 번호처럼 작은 고정폭 숫자로, 화면은 오류 화면과 같은 구성으로.
- Evaluator 검증: `curl -s -o /dev/null -w "%{http_code}" localhost:4000/livenews/nope` → 404(회귀). 체커 `[d/notfound]`·`[m/notfound]`의 모든 `chrome has no … violations`(main 포함), `primary button = text surface + accent-ink label` PASS. `<title>`이 `페이지를 찾을 수 없습니다 | LiveNews`.

### 항목 19: 관리자 바와 관리자 내비
- **[패스 2 색 · 강조색 로고] [패스 5 서체 · font-bold] [패스 1 간격 · 행 높이] [패스 9 모션 · 전환 누락]**
- 대상 파일: `src/app/admin/layout.tsx:17-30`, `src/components/AdminNav.tsx:17-31`
- 현재 문제: "LiveNews Admin"이 주황 `font-bold`. 내비 링크에 높이가 없어 줄 높이(20px)가 곧 클릭 영역. "사이트로 돌아가기"가 캡션용 색(`text-text-muted`)이고 hover 전환이 없다.
- 개선 방법:
  - 로고 → 항목 5.
  - `AdminNav` 링크(`:28-31`) → `cn('inline-flex h-8 items-center whitespace-nowrap text-sm font-medium transition-colors', active ? 'text-accent' : 'text-text-secondary hover:text-text')`. `<nav>`(`:17`) → `className="flex flex-wrap gap-x-4"`.
  - 돌아가기 링크(`layout.tsx:27`) → `className="order-2 ml-auto inline-flex h-8 items-center whitespace-nowrap text-sm text-text-secondary transition-colors hover:text-text sm:order-none"`.
  - 바의 구조·`order`·`max-w-7xl px-4`·주석은 그대로.
- 기대 효과: 관리자 화면도 같은 토큰의 조용한 크롬. 주황은 현재 메뉴 하나.
- Evaluator 검증: 관리자 인증으로 `/livenews/admin/sources` 접속 → 주황 글자는 `소스 관리`뿐, 로고 색 `rgb(239, 233, 222)` 굵기 600, 내비 링크 높이 32px. 인증 없이 401(회귀).

### 항목 20: 페이지 스켈레톤
- **[패스 9 모션 · 진입 애니메이션, 반복 shimmer] [패스 2 색 · 그라데이션] [패스 1 간격 · 카드 패딩]**
- 대상 파일: `src/components/PageSkeleton.tsx:11-49`
- 현재 문제: `animate-fade-in` 뒤에 실제 페이지가 다시 진입한다(진입 2번). 모든 자리 표시 블록(클래스 10곳)에 흰색 그라데이션이 1.8초마다 지나간다(`.shimmer`). 카드 안쪽 `p-4`(계약은 `p-5`).
- 개선 방법: `animate-fade-in`과 모든 `shimmer` 클래스 삭제(면 단계만으로 자리 표시). `rounded-badge`(`:20`) → `rounded-tag`. 카드 안쪽(`:41`) `p-4` → `p-5`. `role="status" aria-live="polite" aria-busy="true"`와 `sr-only` 문구, 파일 머리 주석은 그대로.
- 기대 효과: 불러오는 동안 화면이 움직이지 않고, 진입은 실제 페이지에서 한 번만 일어난다.
- Evaluator 검증: `grep -nE "shimmer|animate-" src/components/PageSkeleton.tsx` → 0줄. `src/app/**/loading.tsx` 3개가 여전히 한 줄 재수출이고 `src/app/loading.tsx`가 없다.

### 항목 21: 정적 회귀 테스트 `tests/chrome-unslop.test.ts`
- **[전 패스 · 다시 들어오지 못하게]**
- 대상 파일: 신규 `tests/chrome-unslop.test.ts`
- 현재 문제: 금지 패턴이 다음 수정에서 되살아나도 잡을 테스트가 없다.
- 개선 방법: `node:test`로 S2 파일을 글자로 읽어 확인한다(네트워크·DOM 없음).
  ```ts
  const CHROME = ['src/components/Header.tsx', 'src/components/Footer.tsx', 'src/components/SearchBar.tsx',
    'src/components/AdminNav.tsx', 'src/components/PageSkeleton.tsx', 'src/components/ui.ts',
    'src/app/layout.tsx', 'src/app/error.tsx', 'src/app/not-found.tsx', 'src/app/admin/layout.tsx'];
  const BANNED: [string, RegExp][] = [
    ['uppercase / tracking / italic', /\buppercase\b|\btracking-|\bitalic\b/],
    ['weight 700+', /\bfont-(bold|extrabold|black)\b|<strong\b/],
    ['looping or entrance animation', /\banimate-|\bshimmer\b/],
    ['catch-all or layout transitions', /transition-all|hover:scale|ease-in-out|duration-300|transition-\[[^\]]*(height|padding|width|margin)/],
    ['half-step spacing', /[a-z]-[1-9]\d*\.5\b/],
    ['arbitrary values', /(?<!z)-\[(?!calc\(|transform,opacity\])/],
    ['removed colors', /accent-(blue|red|green)/],
    ['accent outside "current location"', /bg-accent|hover:text-accent|text-accent\//],
    ['blur / gradient / old shadows', /backdrop-blur|\bblur-|bg-gradient|shadow-(card|elevated|dropdown)/],
    ['pills and circles', /rounded-(pill|badge|full)/],
    ['local focus rings', /focus:ring|\bring-|(?<!focus:)outline-none/],
    ['locale-dependent numbers', /toLocaleString/],
    ['old nav classes', /nav-link/],
    ['emoji', /\p{Extended_Pictographic}/u],
    ['inline svg', /<svg\b/],
  ];
  ```
  추가 단언: ① `icons.tsx`의 모든 `strokeWidth={…}` 값이 `1.5`, 크기 클래스는 `h-4 w-4`뿐. ② `layout.tsx`에 `WEB_FONTS_URL`이 정확히 `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600&family=IBM+Plex+Mono:wght@400;500&display=swap`, `rel="preconnect"` 2개(`fonts.googleapis.com`, `fonts.gstatic.com` + `crossOrigin`), `<noscript>` 1개, `rel="stylesheet"` 1개(노스크립트 안), `next/font` 없음. ③ `Header.tsx`·`Footer.tsx`에 `LiveNews` 워드마크가 있고 `.co.kr`은 `Footer.tsx`의 메일 주소에만 있다.
  (주석에도 금지 단어를 쓰지 마라 — 테스트는 파일 전체를 본다. `©` 글자는 이모지 정규식에 걸리므로 푸터의 `&copy;` 엔티티를 그대로 둔다. 위 정규식들은 현재 파일에서 기대한 곳만 잡고 `focus:z-[100]`, `max-h-[calc(100dvh-7.5rem)]`, `transition-[transform,opacity]`, `focus:outline-none`, `text-accent-ink`, `border-accent`, `hover:bg-text/90`은 통과시키는 것을 Planner가 확인했다.)
- 기대 효과: `npm test`만으로 이 슬라이스의 unslop 규칙이 지켜지는지 0.1초 안에 확인된다.
- Evaluator 검증: `npm test` 전체 통과(기존 테스트 + 이 파일). 한 파일에 `font-bold`를 넣어 보면 실패하는지 한 번 확인하고 되돌린다.

---

## 접근성·기능 회귀 금지 목록 (Generator가 건드리지 말 것, Evaluator가 확인할 것)

| 무엇 | 어디 | 확인 방법 |
|---|---|---|
| 본문 바로가기가 첫 Tab, `main#main` 포커스 | `layout.tsx` | 체커 `[d/kbd] first Tab lands on the skip link` |
| `/` 검색 열기, ESC 닫기 + 포커스 복귀(검색·메뉴·국가) | `Header.tsx` 키 핸들러 | 체커 `[d/kbd]` 2건 + 390px 수동(메뉴·국가) |
| 닫힌 검색·메뉴·플라이아웃이 Tab 순서에 없음(`invisible`) | `Header.tsx` | 닫힌 상태로 Tab 순회 — 숨은 링크에 포커스가 가지 않음 |
| `aria-expanded`·`aria-controls`·`aria-haspopup`·`aria-current="page"` | `Header.tsx`, `AdminNav.tsx` | DOM 확인 |
| `nav` 라벨 `주요 메뉴`·`모바일 메뉴`·`하단 탭 메뉴`·`관리자 메뉴` | 〃 | 체커가 이 라벨로 요소를 찾는다 |
| 키보드 포커스가 헤더 안에 있으면 스크롤해도 접히지 않음 | `Header.tsx` `focusWithin` | Tab으로 내비 포커스 후 스크롤 |
| 경로 변경 시 패널 닫힘, 바깥 클릭 시 플라이아웃 닫힘, 활성 내비 자동 스크롤(`scrollTo`) | `Header.tsx` 효과들 | 코드 불변 확인 |
| `/admin/*`에서 사이트 헤더·푸터·하단 탭 없음 | `isAdminPath` | 관리자 페이지 DOM |
| 통계 요청 1회 공유, 실패 시 통계 숨김 | `useSiteStats` | 네트워크 탭에서 `/api/stats` 1회 |
| 푸터 연도 `suppressHydrationWarning`, 폼 `label`/`role="status"` | `Footer.tsx` | 소스 |
| 오류 화면 재시도(`router.refresh()` + `reset()`), 홈 링크 basePath | `error.tsx` | 소스 불변 |
| 404가 HTTP 404, 루트 `loading.tsx` 없음 | 라우팅 | `curl -w "%{http_code}"` |

---

## 공통 검증 절차 (Evaluator)

```bash
cd /home/user/hydro
npx tsc --noEmit                      # 0 오류
npm test                              # 기존 + chrome-unslop.test.ts 통과
# 앱 재빌드·재기동은 오케스트레이터의 QA 환경 스크립트로 (레포 루트에서 next dev 금지)
CHROME_PATH=/usr/bin/google-chrome node qa-out/planner-s2-check.js http://localhost:4000 qa-out
#  → 131건 모두 PASS, 스크린샷 qa-out/planner-s2-after-{d,m}-{home,notfound,us,footer}.jpg 생성
```
- 체커는 헤더·푸터·하단 탭(404에서는 `main`도) 안의 모든 요소를 계산된 스타일로 본다: 애니메이션, 블러, 대문자, 자간, 굵기 700+, 그라데이션, 4px 격자를 벗어난 패딩·마진·간격·컨트롤 높이, 16px/1.5가 아닌 아이콘, 이모지, 알약, 12px 미만 글자. `focus ring` 검사는 S1의 전역 규칙에 달려 있으니 실패하면 원인이 S1인지 S2인지 구분해서 적어라.
- 스크린샷은 수정 전(`qa-out/unslop/before/prod/{d,m}-home-0.jpg`, `-home-footer.jpg`, `-notfound-0.jpg`)과 나란히 본다. 봐야 할 것: ① 헤더에 색이 주황 한 군데(현재 내비 항목)뿐인가 ② 로고·내비 첫 글자·통계·본문 왼쪽 선이 맞는가 ③ 푸터에 이모지·파란 상자가 없는가 ④ 하단 탭 아이콘이 한 크기인가.
- 템플릿 점검(스킬 체크리스트 마지막 줄): 제품 이름을 바꿔도 그대로 쓸 수 있는 크롬이면 안 된다 — 이 슬라이스에서 그 답은 헤더의 KST 고정폭 시계와 `오늘 N건 업데이트 · 전체 N건` 통신 데스크 문장이다. 둘이 보이는지 확인.

---

## 계약(UNSLOP-AUDIT.md)에서 발견한 문제

1. **`font-mono` 스택에 한글 글꼴이 없다.** `'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace` — 한글이 섞인 문자열에 걸면 한글은 브라우저의 기본 고정폭 글꼴(Windows: 굴림체 계열)로 떨어진다. S2는 숫자·라틴 조각에만 건다. S3·S4도 `.dateline`·카운트에서 같은 규칙이 필요하다(`164,917건`의 `건`은 mono 밖). 토큰 값은 바꾸지 않았다.
2. **진입 애니메이션의 클래스 이름이 계약에 없다.** S2는 진입 애니메이션을 쓰지 않아 영향이 없지만 S4가 쓸 이름을 S1이 정해 줘야 한다(S1 초안은 `animate-fade-in`을 fade+rise로 재정의).
3. **스켈레톤의 움직임이 정해져 있지 않다.** `.shimmer`는 그라데이션 반복 애니메이션이다. S2 `PageSkeleton`은 정지 상태로 정했다 — S3 `NewsCardSkeleton`도 같게 해야 두 스켈레톤이 맞는다.
4. **`positive`/`negative`가 "관리자 화면 전용"이라 공개 폼의 오류색이 비어 있다.** S2는 푸터 구독 폼의 오류 문구에만 `text-negative`를 썼다(성공은 중립색). S3 `NewsletterBanner`도 같은 결정이 필요하다.
5. **전역 포커스 링(offset 2px)은 가로 스크롤 줄 안에서 잘린다**(`overflow-x: auto`는 세로도 자른다). S2는 내비 줄과 하단 탭에서 같은 링을 안쪽(`-outline-offset-2`)에 그린다. S3의 `CountryTabs`·`CategoryNav`도 같은 문제가 있다.
6. **워드마크의 `.co.kr`.** 계약은 "이름 `LiveNews` 유지, 한 색"만 정했다. S2는 도메인 접미사를 워드마크에서 뺐다. 남기려면 같은 색으로 `LiveNews.co.kr`(항목 5와 체커·테스트의 기대 문자열만 바꾸면 된다).
7. **확인할 수 없는 내용(사용자 확인 필요, 스킬 4번 패스 규칙).** 푸터의 `github.com/livenews`, `twitter.com/livenews_kr`, `contact@livenews.co.kr`이 실제 계정인지 코드로는 알 수 없다 — 그대로 두었다. "매일 아침 AI가 선별한" 구독 문구는 근거가 없어 낮췄다(S3 `NewsletterBanner.tsx:87`에도 같은 문구가 있다).
8. **S1 초안의 닫힌 스케일.** `duration-300`, `font-bold`, `shadow-dropdown` 등은 S1 뒤에 CSS가 생성되지 않는다. S2는 모두 계약 값으로 바꿨지만, S1 직후 S2 전까지의 중간 빌드에서 헤더 전환이 150ms 기본값으로 보이는 것은 정상이다.
