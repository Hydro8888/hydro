# QA 검수 보고서 — 슬라이스 S1 (디자인 시스템) · Unslop 재작업 라운드

**검수 회차**: 1회차
**검수 일시**: 2026-11-12
**검수 대상**: 커밋 `55cce32` (비교 기준 `5ade9f9`) — `tailwind.config.ts`, `src/app/globals.css`, `src/lib/constants.ts`, `src/lib/utils.ts`, `src/lib/ui.ts`(신규), `src/components/Footer.tsx`(1줄), `tests/design-tokens.test.ts`, `tests/utils.test.ts`
**기준 문서**: `SPEC-S1.md`(항목 1~17), `UNSLOP-AUDIT.md` 3·6·7절(7절 우선), `.claude/skills/unslop`(SKILL.md Checklist, `references/tokens.md`, `references/signs.md`), `agents/evaluation_criteria.md`
**검수 방법**: `SELF_CHECK-S1.md`의 수치는 믿지 않고 전부 다시 쟀다. 격리 워크트리(`qa-out/eval-s1`, 커밋 `55cce32`)에서 `tsc`·`npm test`·`next build`를 돌리고 `:4101`에 띄워 확인했다. 작업 트리의 소스와 `:4000` 서버는 건드리지 않았다.

검수 스크립트·결과물(모두 `qa-out/`, git 무시): `eval-s1-contrast.cjs`(대비), `eval-s1-csscheck.cjs`(운영 CSS 검사), `eval-s1-compile.cjs`(계약 클래스 컴파일), `eval-s1-fn.cjs` + `eval-s1-fn-*.log`(함수 경계, TZ 4종), `eval-s1-pw.cjs` + `eval-s1-pw.json`(페이지별 계산된 스타일), `eval-s1-pw2.cjs`, `eval-s1-workers.cjs`, `eval-s1-fixprobe.cjs`(개선 지시 검증), 화면 `eval-s1-{d,m}-*.jpg`, `eval-s1-specimen.jpg`.

---

## 판정 요약

**전체 판정**: 합격
**가중 점수**: 8.1 / 10.0 (8×0.3 + 7×0.2 + 8×0.25 + 9×0.15 + 9×0.1 = 8.05)

**항목별 점수**:
- 디자인 품질: 8/10 — 계약의 램프·강조색·서체·모서리·모션이 값까지 정확하고 모든 글자색이 모든 면에서 4.58:1 이상. 다만 Tailwind preflight의 템플릿 기본값 세 가지(차가운 회색 placeholder, `b/strong/th` 700, 파란 기본 ring)가 시스템 밖에 남았다.
- 독창성: 7/10 — 통신 시각 3형식과 대체 사진 흑백 처리는 이 제품에만 맞는 장치이고 구현이 탄탄하다. 반면 중립 램프·의미색·easing은 스킬 `tokens.md`의 Warm 시작값 그대로다(계약이 정한 것이라 감점은 작게).
- 기술적 완성도: 8/10 — `tsc` 0, 테스트 241/241, 빌드 17/17, 닫힌 스케일과 단언이 촘촘하다. "시스템이 보장한다"던 두 가지(700 미만, `transition-all` 무효)에 구멍이 있고 SELF_CHECK가 이를 계산된 스타일로 확인하지 않았다.
- 기능성: 9/10 — `formatWireTime`·`formatCount`가 자정·연말·무효 입력·음수·큰 수에서 계약대로, TZ 4종에서 같은 출력. S1이 넘겨야 할 토큰·유틸은 빠짐없이 있다.
- 회귀 안전: 9/10 — 라우트 20개 상태코드 정상, 타 슬라이스 수정은 Footer 1줄, 워커 모듈 로드 정상, 기존 테스트 삭제 없음.

**방향 판단**: 현재 방향 유지. 아래 개선 지시 1~3은 재검수 조건이 아니라 통합 전까지 반영할 보강이다(S1 파일 2개, 약 10줄).

---

## 1. SPEC 개선 항목 검증

- [PASS] 항목 1 (색 램프·강조색 하나): `tailwind.config.ts:60-72`. `extend.colors` 키 7개, surface 4단계 `#12110f/#161513/#1c1a18/#262421`, text `#efe9de/#aaa398/#918b81`, accent `#f0883e` + ink `#161513`, live·negative `#ea5d61`, positive `#4cc38a`, 테두리 `rgba(239,233,222,0.10)`/`0.06`. 옛 hex 11종 grep 0줄(S1 파일 5개).
- [PASS] 항목 2 (삭제 토큰·죽은 상수): `primary/dark/light/accent.blue·red·green`, `PRIORITY_STYLES`, `AI_BADGE_STYLE`, `countryColor` 없음. 프로브 컴파일에서 `bg-primary`, `text-accent-red` 등 미생성.
- [PASS] 항목 3 (카테고리 중립화): 16개 slug + `''`, `__proto__`, `constructor`, `toString` 모두 같은 동결 객체. 운영 화면의 카테고리 라벨 색은 `rgb(170,163,152)` 한 가지.
- [PASS] 항목 4 (이모지 제거): `CATEGORIES` 키는 `slug`, `label`뿐. S1 파일에 이모지 0. `Footer.tsx` diff는 `{cat.icon}` 1줄 삭제.
- [PASS] 항목 5 (서체): `font-serif`, `font-mono` 생성 확인. 운영 CSS에 `@import` 0, 렌더 차단 리소스는 자체 CSS 1개뿐, 제3자 요청은 `images.unsplash.com`(사진)뿐.
- [PASS] 항목 6 (타입 스케일·굵기): 9개 토큰 값 일치(`headline-lg`는 7절-5대로 500). `font-bold/extrabold/black/thin/light` 미생성. 운영 CSS의 굵기 선언은 400·500·600과 preflight의 `bolder`뿐 → 지시 1 참고.
- [PASS] 항목 7 (모서리): 6/8/12/16px, 별칭 `badge`=6px·`pill`=8px. `9999` 없음.
- [PASS] 항목 8 (깊이): `shadow-float`만 생성(`0 8px 24px rgba(0,0,0,0.35)`), 기본 그림자 8종 미생성. 공개·관리자 11개 화면에서 그림자가 있는 요소 0개. `globals.css`에 gradient·glow·shimmer 0.
- [PASS] 항목 9 (모션): 운영 CSS의 timing function은 `cubic-bezier(.22,1,.36,1)` 하나, `@keyframes`는 `fade-in`·`spin`뿐, `duration-300/500`·`ease-in/out`·`animate-pulse/ping/bounce` 미생성. reduced-motion에서 티커·전환 0.01ms 확인. 단 "`transition-all`은 전환 없이 즉시 바뀐다"는 SPEC 문장은 2곳에서 사실이 아니다 → 지시 2.
- [PASS] 항목 10 (포커스 링): `:focus-visible{outline:2px solid #f0883e;outline-offset:2px}`. 홈에서 Tab 6회 중 5개가 이 링(나머지 1개는 Header 검색 버튼의 자체 클래스 — S2 몫).
- [PASS] 항목 11 (`globals.css` 정리): 죽은 클래스 7개 없음, 스크롤바 색은 `theme()` 토큰, `.nav-link` hover 실측 `rgb(239,233,222)`(중립), 현재 위치만 accent.
- [PASS] 항목 12 (`formatWireTime` + `.dateline`): 7절-4의 세 형식. 2절 표 참고. `.dateline` = Plex Mono 스택 / 12px·16px·400 / `tabular-nums` / `rgb(145 139 129)`.
- [PASS] 항목 13 (`formatCount`): 2절 표 참고.
- [PASS] 항목 14 (`.img-standin`): `filter: grayscale(1) contrast(1.05) brightness(0.9)`. hover·애니메이션 없음.
- [PASS] 항목 15 (플레이스홀더 SVG): `fill="#262421"`, `stroke="#efe9de" stroke-opacity="0.1"`.
- [PASS] 항목 16 (간격): `globals.css`·`ui.ts`에 반 단계·임의 값 0. `ui.ts` 높이는 24/32/40/44px.
- [PASS] 항목 17 (테스트): SPEC 표의 테스트 이름이 모두 있고 241개 통과(SPEC 기준 ≥230). 대비·`ui.ts`·연도 규칙 테스트가 추가됐다.

### UNSLOP-AUDIT 7절 결정

- [PASS] 7-1 `text-muted #918b81` / 7-2 `live`·`negative` `#ea5d61` — 값 일치, 대비는 2절.
- [PASS] 7-3 `font-mono` 스택에 `Pretendard Variable, Pretendard`가 Plex Mono 다음.
- [PASS] 7-4 `formatWireTime` 세 형식, JSDoc에 `<time dateTime suppressHydrationWarning>` 규칙(`utils.ts:346-357`). `toIsoDateTime`은 실제로 있는 export.
- [PASS] 7-5 `headline-lg` 500, 600은 `headline-xl`뿐.
- [PASS] 7-7 · 7-15 `src/lib/ui.ts` — SPEC-S4 항목 0의 문자열 리터럴 25개와 전부 일치(누락·추가 0). export 22개. S2가 쓰는 이름 `BTN_PRIMARY`·`BTN_SECONDARY` 포함. 주요 버튼 실측: 높이 40px, 모서리 8px, 면 `rgb(239,233,222)`, 글자 `rgb(22,21,19)`, 굵기 500.
- [PASS] 7-8 Pretendard `@import` 삭제. 7-9 `animate-fade-in`은 정의만 있고 S1 파일에서 쓰지 않음. 7-10 닫힌 스케일 6종. 7-14 별칭 유지 + 주석. 7-18 `.shimmer` 삭제.

---

## 2. 직접 측정

### 대비 (WCAG 2.x, 커밋된 `tailwind.config.ts` 값으로 독립 계산)

| 글자색 \ 면 | `surface-deep` | `surface` | `surface-card` | `surface-elevated` |
|---|---|---|---|---|
| `text` #efe9de | 15.62 | 15.10 | 14.36 | 12.81 |
| `text-secondary` #aaa398 | 7.55 | 7.30 | 6.94 | 6.19 |
| `text-muted` #918b81 | 5.58 | 5.40 | 5.13 | 4.58 |
| `accent` #f0883e | 7.46 | 7.21 | 6.85 | 6.11 |
| `live` / `negative` #ea5d61 | 5.60 | 5.42 | 5.15 | 4.60 |
| `positive` #4cc38a | 8.52 | 8.24 | 7.83 | 6.99 |

전부 4.5:1 이상(최저 4.58). SELF_CHECK의 표와 같다.

| 조합 | 대비 |
|---|---|
| `accent-ink` on `text` / `accent` / `live` / `positive` | 15.10 / 7.21 / 5.42 / 8.24 |
| `BTN_PRIMARY` hover (`text/90`, 면 4단계 위) | 12.30 ~ 12.53 |
| 표 hover 행(`elevated/50` over card) 위 `text-muted` / `text-secondary` | 4.86 / 6.57 |
| `::selection` (`accent/20` 위 `text`) | 9.04 ~ 11.32 |
| 흰색 on `accent` / `live` (금지 조합, 참고) | 2.53 / 3.37 |

- `accent`와 `live`는 색 차이 ΔE76 36.5(값을 바꾸기 전 37.3)로 여전히 구분된다.
- 면의 채도는 7~9%로 낮아 배경이 "색"으로 읽히지 않는다(스킬 2. Color).

### 운영 CSS (`.next/static/css/a0795ad5b6cf732e.css`, 31,634바이트)

| 검사 | 결과 |
|---|---|
| `@import`, `background-clip:text`(그라데이션 글자), `glow`, `shimmer`, `pulse`, `ping`, `bounce` | 0 |
| `font-weight` 700·800·900 | 0 (preflight의 `b,strong{font-weight:bolder}` 1건은 지시 1) |
| `transition-property: all`, `ease-in/out`, `.shadow-card/elevated/dropdown`, `.duration-300/500` | 0 |
| 옛 팔레트(hex 11종 + 같은 값의 `rgb` 표기), 옛 muted `138 132 122`, 옛 live `229 72 77` | 0 |
| `accent-blue/red/green`, 카테고리 hue 클래스 | 0 (기본 팔레트 클래스는 `.text-amber-400` 1개 — `TrendingKeywords`, S3 몫) |
| 새 토큰 | `rgb(22 21 19)`, `rgb(145 139 129)`, `rgb(234 93 97)`, `rgb(76 195 138)`, 헤어라인, 포커스 링, mono 스택, `ui.ts` 클래스 전부 있음 |

- 아직 쓰는 곳이 없어 운영 CSS에 없는 계약 클래스(`.img-standin`, `.font-serif`, `.text-meta`, `.rounded-panel`, `.shadow-float`, `.bg-surface-deep`, `.bg-live`, `.text-live`, `.text-positive`, `.text-negative`, `.duration-400`)는 프로브 컴파일로 생성과 값을 확인했다(`eval-s1-compile.cjs`).
- 운영 CSS에 남은 `gradient` 50건, `backdrop-filter`, `uppercase`, `letter-spacing`, `italic`, `hover:scale`, `.bg-white`, `.text-white`는 모두 뒤 슬라이스 파일의 클래스가 만든 것이다(중간 상태, 감점 없음).
- 헤어라인은 압축 과정에서 `hsla(39,35%,90%,.1)`이 되어 계산값이 `rgba(238,232,221,0.1)`이다. 채널당 1/255 차이, 10% 투명도에서 눈에 보이지 않으므로 조치 불필요.

### `formatWireTime` (NOW = 2026-10-05 12:00 KST, `eval-s1-fn.cjs`)

| 입력 | 결과 |
|---|---|
| 같은 날 14:02 | `14:02` |
| KST 자정 정각 / 그 1ms 전 | `00:00` / `10.04 23:59` |
| 같은 날 23:59:59.999 / 다음 날 00:00 | `23:59` / `10.06 00:00` |
| 작년 같은 월·일 / 내년 1월 1일 | `2025.10.05` / `2027.01.01` |
| 연말: 12.31 23:59 KST를 새해 00:00:30에 봄 | `2026.12.31` |
| 연말: UTC 연도는 다르고 KST 연도는 같음 | `01:00` |
| 윤일(다른 날) | `02.29 12:04` |
| ISO(zone 없음 = UTC) / `+09:00` / RFC 2822 / `Date` | 모두 `14:02` |
| `null`, `undefined`, `''`, 공백, `'garbage'`, `NaN`, `±Infinity`, Invalid Date, `{}`, `[]`, `true`, `2026-02-30`, zone 없는 비 ISO, 숫자 문자열 | 모두 `''` |
| `now`가 `NaN` / Invalid Date / `Infinity` / `null` | 현재 시각 기준으로 계산(문서대로) |

### `formatCount`

| 입력 | 결과 |
|---|---|
| 0, -0, 7, 999, 1000, 164917, 1234567, `MAX_SAFE_INTEGER` | `0`, `0`, `7`, `999`, `1,000`, `164,917`, `1,234,567`, `9,007,199,254,740,991` |
| -1, -1000, -1234567 | `-1`, `-1,000`, `-1,234,567` |
| 1234.9, -1234.9, 0.9, -0.9 | `1,234`, `-1,234`, `0`, `0` |
| `MAX_SAFE_INTEGER + 2`, `1e21`, `NaN`, `±Infinity`, `null`, `undefined`, `'164917'`, `''`, `{}`, `[]`, `true`, `10n`, `new Number(5)` | 모두 `0` |

두 함수의 출력 전체를 TZ=UTC / Asia/Seoul / America/Los_Angeles / Pacific/Kiritimati(+14)에서 `LANG=de_DE.UTF-8`로 돌려 md5가 같음을 확인했다.

### 계산된 스타일 (`:4101`, 1440px·390px, 공개 7 + 관리자 4 화면)

- body 배경 `rgb(22,21,19)`, 글자 `rgb(239,233,222)`. 가로 스크롤 0. 콘솔 오류는 픽스처의 가짜 이미지 주소에서 오는 `/api/img` 415뿐(S1과 무관).
- 굵기 700 이상인 글자: 공개 화면마다 3개, 전부 `Footer.tsx:108,112,116`의 `<strong>`. 관리자 화면 0.
- `transition-property: all`이 실제로 걸린 요소: 공개 화면마다 1개(`Header.tsx:244`).

---

## 3. unslop Checklist — S1 범위

| 항목 | 판정 | 근거 |
|---|---|---|
| 중립 램프 하나 · 글자 3역할 · 강조색 하나와 대비 | PASS | 위 대비 표. 강조색 면 위 글자는 `accent-ink` 7.21. 예외 1건: placeholder 기본색 `#9ca3af`(지시 1) |
| hue 그라데이션·그라데이션 글자·글로우·색 그림자 없음 | PASS | S1 파일 5개에 0건. 유일한 그림자는 중립 `shadow-float` |
| 인터페이스에 이모지 없음 (S1 몫) | PASS | `CATEGORIES`에서 제거 |
| 굵기 400~600, 대문자·자간 라벨 없음 | PASS (보강 필요) | 스케일은 닫혔으나 `b/strong/th`의 브라우저 기본 700은 막지 못함(지시 1) |
| 숫자 한 형식 + tabular | PASS | `formatCount`, `NUM`, `.dateline`, `TD_NUM`, `TD_TIME` |
| 모서리 체계 · 버튼은 컨트롤 반경 | PASS | 6/8/12/16, `ui.ts`의 버튼·입력·칩 전부 `rounded-control` |
| 반복·튀는 모션 없음, easing 하나 | PASS (보강 필요) | 설정은 한 곡선. 전환 클래스 없이 `duration-*`만 쓰면 브라우저 기본 `ease` + `all`이 된다(지시 2) |
| 4px 스케일 유틸 | PASS | S1 파일에 반 단계·임의 값 0 |
| 템플릿 점검 | 해당 일부 | 시그니처 유틸 2개는 이 제품 것. 램프는 스킬 Warm 시작값 그대로 — 화면에서의 차별화는 S2~S4가 시그니처를 일관되게 쓰는지에 달렸다 |

---

## 4. 회귀 검증

| 검사 | 결과 |
|---|---|
| `npx tsc --noEmit` | 종료 코드 0 |
| `npm test` | 241 통과 / 실패 0 (24 suites) |
| `next build` (격리 워크트리) | `Compiled successfully`, 정적 페이지 17/17, lint 경고 없음 |
| 라우트 | `/livenews` 200, `/breaking` 200, `/article/1` 200, `/category/economy` 200, `/search?q=AI` 200, `/ranking` 200, `/world`·`/us`·`/japan`·`/china` 200, `/nope` 404, `/category/nope` 404, `/article/999999999` 404, `/admin` 무인증 401, 인증 200 |
| API | `/api/stats`, `/api/articles`, `/api/categories`, `/api/trending`, `/api/search` 200 |
| 워커 로드(tsx, 실행하지 않고 모듈만) | `translation-text`, `normalizer`, `scraper`, `lib/routing`, `lib/utils`, `lib/constants`, `lib/ui` 모두 로드 |
| 변경 export 사용처 | `CATEGORIES`·`getCategoryStyle` 사용 파일 10개가 수정 없이 컴파일 |
| 타 슬라이스 수정 | `src/components/Footer.tsx` 1줄 삭제뿐 |
| 기존 테스트 | `tests/utils.test.ts`는 +88/−1(스냅샷에 `formatWireTime`을 이어 붙인 1줄), 다른 테스트 파일 무변경 |
| 데이터 | 읽기만 했다. 로컬 DB는 픽스처 409건(`/api/stats`) |

S1 직후의 중간 상태(죽은 클래스, 시스템 글꼴, 색이 빠진 상태 배지, 주황 면 버튼 등)는 정상으로 보고 감점하지 않았다.

---

## 5. 발견한 문제

1. **preflight 기본값 세 가지가 토큰 밖에 남았다** (낮음~중간)
   - `input::placeholder`의 기본색이 Tailwind gray-400 `#9ca3af`(차가운 회색). `FIELD`는 `placeholder:text-text-muted`가 있어 `rgb(145,139,129)`이지만 `FIELD_SM`과 클래스 없는 입력은 `rgb(156,163,175)`로 나온다(`eval-s1-specimen.jpg`에서 두 placeholder의 색이 다르게 보인다). "중립 램프 하나"의 예외.
   - `b, strong`은 preflight의 `bolder` → 700, `th`는 브라우저 기본 700(preflight가 되돌리지 않음). SPEC 항목 6이 "700 이상 금지를 시스템이 보장"한다고 적었지만 요소 기본값은 닫힌 `fontWeight` 스케일 밖이다. 지금 공개 화면마다 `<strong>` 3개가 700으로 나온다(S2가 지울 예정이지만 시스템 차원의 구멍은 남는다).
   - `--tw-ring-color` 기본값이 `rgb(59 130 246/.5)`(파랑). 색 없는 `ring` 클래스를 쓰면 팔레트 밖 색이 나온다. 현재 색 없이 쓰는 곳은 0곳이라 실제 화면 영향은 없다.
2. **`transition-all`이 무효가 된다는 인계 내용이 2곳에서 틀리다** (낮음)
   - `transition-all` 클래스는 생성되지 않지만, 같은 요소에 S1이 생성하는 `duration-150/200`이 있으면 `transition-duration`만 걸리고 CSS 초기값(`transition-property: all`, `ease`)이 적용된다. 실측: `Header.tsx:244` 검색 버튼이 `all 0.2s ease`. 같은 조합이 `NewsletterBanner.tsx:117`에도 있다.
   - SPEC 항목 9·인계 3번과 SELF_CHECK("없음(0건): `transition-property:all`")는 CSS 문자열만 보고 계산된 스타일을 확인하지 않았다.
3. **`TD*` 상수에 글자 크기가 없다** (참고, 수정 불필요)
   - `TD`·`TD_MAIN`·`TD_NUM`·`TD_TIME`은 크기를 상속한다. 표에 `text-body-md`가 없으면 셀이 16px, 머리글은 12px로 나온다(`eval-s1-specimen.jpg`). SPEC-S4 547행이 `<table className="w-full text-body-md">`로 정해 두었으므로 S4가 이를 지키면 된다. 7절-7이 "SPEC-S4 정의 그대로"를 요구하므로 S1 값은 맞다.

---

## 6. 구체적 개선 지시

재검수 조건은 아니다. S1 파일만 고치며, 아래 내용은 `eval-s1-fixprobe.cjs`로 컴파일·동작을 확인했다(`strong`·`b`·`th` 500, 유틸 `font-semibold`가 덮으면 600, placeholder `rgb(145,139,129)`, `duration-200`만 있는 요소가 이름 있는 속성 + 한 easing, 클래스 없는 요소는 전환 0s).

1. **`src/app/globals.css` — `@layer base`, `:focus-visible` 규칙(39~42행) 바로 뒤에 추가**
   ```css
   /* Element defaults that the closed weight scale cannot reach: 700 is outside the contract. */
   b, strong, th { font-weight: theme('fontWeight.medium'); }

   /* Preflight paints placeholders with gray-400; keep them on the ramp. */
   input::placeholder, textarea::placeholder { color: theme('colors.text.muted'); }
   ```
   - 선택자는 반드시 `input::placeholder, textarea::placeholder`로 쓴다. `::placeholder`만 쓰면 preflight보다 명시도가 낮아 적용되지 않는다.
   - 근거: 계약 3절 "700 이상 금지", "중립 램프 하나".
2. **`src/app/globals.css` — 같은 위치에 추가(지시 1 다음)**
   ```css
   /* A lone duration-* (no transition-* class) would fall back to the browser's `all` + `ease`. */
   *, ::before, ::after {
     transition-property: theme('transitionProperty.DEFAULT');
     transition-timing-function: theme('transitionTimingFunction.DEFAULT');
   }
   ```
   - 기본 `transition-duration`이 0s라서 전환 클래스가 없는 요소는 그대로 움직이지 않는다. `transition-colors`, `transition-[…]` 유틸은 그대로 덮는다.
   - 이와 별개로 S2는 `src/components/Header.tsx:244`, S3는 `src/components/NewsletterBanner.tsx:117`의 `transition-all`을 `transition-colors`로 **바꿔야** 한다(지우기만 하면 `duration-*`이 남아 같은 문제가 생긴다).
3. **`tests/design-tokens.test.ts` — `describe('generated CSS …')`에 단언 3개 추가**
   - `b, strong, th`의 `font-weight`가 500, `input::placeholder`의 색이 `text-muted` 값, `*` 규칙의 `transition-timing-function`이 `cubic-bezier(0.22, 1, 0.36, 1)`.
4. **(선택) `tailwind.config.ts` — `extend`에 `ringColor: { DEFAULT: '#f0883e' }`** 를 넣어 색 없는 `ring`이 파랑이 되지 않게 한다. 뒤 슬라이스가 `focus:ring-*`를 모두 지우면 필요 없다.
5. **`SELF_CHECK-S1.md` — "S1 직후의 중간 상태" 절 정정**: "`transition-all` 8 … CSS는 생성되지 않는다"에 "`duration-150/200`과 함께 쓰인 2곳(`Header.tsx:244`, `NewsletterBanner.tsx:117`)은 `all` + `ease`로 전환된다"를 덧붙인다.

### 뒤 슬라이스에 전할 것 (S1 수정 아님)

- S4: 관리자 표는 `<table className="w-full text-body-md">`로 크기를 준다(`TD*`에 크기 없음).
- S2: `Footer.tsx:108,112,116`의 `<strong>`은 지시 1을 반영하기 전까지 700이다.
- S3: `formatWireTime`의 세 형식은 글자 수가 5 / 11 / 10으로 다르다. 목록의 시각 칸은 가장 긴 형식(`11.05 14:02`)에 맞춘 고정 폭이 필요하다.
