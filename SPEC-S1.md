# S1 디자인 시스템 개선 설계서 — Unslop 재작업 라운드

> **사용자 요청**: "https://github.com/heydamir/unslop 이 기능을 모두 활용해서 재작업해줘 테스트까지 완료해줘"
> **계약 문서**: `UNSLOP-AUDIT.md` (감사 · 방향 · 3절 토큰 계약 · 6절 슬라이스 간 인터페이스). 이 설계서는 계약의 값·이름을 바꾸지 않는다.
> **스킬**: `.claude/skills/unslop` (unslop by Damir Sokolovsky [@heydamir](https://x.com/heydamir), CC BY 4.0).
> **라운드 규칙**: 새 기능·새 장식 금지. 모든 항목은 unslop 9개 패스(1 간격 · 2 색 · 3 아이콘 · 4 문구 · 5 서체 · 6 레이아웃 · 7 디테일 · 8 비주얼 · 9 모션) 중 어느 패스의 어떤 징후를 고치는지 `파일:라인` 근거와 함께 적는다. planner.md의 "야심차게", "AI 기능"은 이번 라운드에 적용하지 않는다.
> S1에 해당 없는 패스: 4 문구, 6 레이아웃 (계약 4절 표에서 S1 칸이 "—").

실험 산출물은 모두 `qa-out/planner-s1-*` (git 무시 폴더). 소스는 수정하지 않았다.

| 파일 | 내용 |
|---|---|
| `qa-out/planner-s1-proto.diff` | 이 설계서 전체를 적용한 **참고용 프로토타입** (S1 4개 파일 + Footer 1줄 + 테스트 2개). `git apply --check` 통과. 격리 복사본에서 `tsc` 0 오류 · `npm test` 232/232 · `next build` 성공을 확인했다. 설계서와 다르면 설계서가 우선 |
| `qa-out/planner-s1-tailwind.config.mts`, `planner-s1-globals.css` | 제안하는 두 파일의 전체 내용 |
| `qa-out/planner-s1-contrast.mjs` | 대비 계산 (`node qa-out/planner-s1-contrast.mjs`) |
| `qa-out/planner-s1-fontblock.cjs`, `.log` | Pretendard `@import` 렌더 차단 실측 |
| `qa-out/planner-s1-handoff.sh`, `.txt` | S1 적용 후 CSS가 생성되지 않는 클래스의 S2~S4 파일별 개수 |
| `qa-out/planner-s1-preview.cjs`, `planner-s1-preview-*.jpg` | 실행 중인 앱(:4000, 읽기 전용)에 S1 CSS만 바꿔 끼운 화면 |
| `qa-out/planner-s1-build.log` | 격리 복사본 `next build` 로그 |

---

## 현재 상태 분석

### 유지할 것
- KST 고정 오프셋 날짜 헬퍼(`utils.ts:195-344`): ICU를 쓰지 않아 서버·브라우저 출력이 같다. `formatWireTime`은 이 헬퍼(`toKstParts`, `toEpochMs`, `pad2`) 위에 얹는다.
- 줄바꿈 규칙(`globals.css:11-32`), `prefers-reduced-motion` 블록(`globals.css:57-67`), `.scrollbar-none/.scrollbar-hide`, `.safe-area-bottom`.
- Tailwind `content`에 `src/lib`, `src/hooks` 포함(`tailwind.config.ts:10-18`) — 클래스 문자열을 가진 상수가 스캔된다.
- `headline-xl`의 `clamp(1.75rem, 1.2rem + 2vw, 2.5rem)` 식(`tailwind.config.ts:63`).
- 토큰 이름 체계(`surface*`, `text*`, `border*`, `accent`, `headline-*`, `body-*`, `caption`, `overline`, `rounded-card`).

### 징후 (S1 파일에 있는 것)

| # | 패스 · 징후 (signs.md) | 근거 |
|---|---|---|
| a | 2 색 · "Every element highlighted" | `constants.ts:109-126` 카테고리 16개 × 서로 다른 색 4클래스(64개), `utils.ts:358-366` `countryColor` 4색, `tailwind.config.ts:40-45` 강조색 4개 |
| b | 2 색 · 템플릿 기본 중립색 | `tailwind.config.ts:4-7, 28-39` GitHub 다크 팔레트(`#0d1117/#161b22/#21262d/#30363d`), `globals.css:47,50,54` 같은 값 하드코딩, `constants.ts:136-137` 플레이스홀더 SVG도 같은 값 |
| c | 2 색 · 그라데이션 글자, 글로우, 그라데이션 | `globals.css:118-120` `.text-gradient-amber`, `:122-124` `.border-glow`, `:154-161` `.shimmer::after` `linear-gradient` |
| d | 2 색 · 그림자로 깊이 표현 | `tailwind.config.ts:72-76` 그림자 3종(2겹씩), `globals.css:89` `hover:shadow-elevated` |
| e | 3 아이콘 · 이모지를 아이콘으로 | `constants.ts:46-61` `icon: '🏛'` … 16개 → `Footer.tsx:178`에 노출 |
| f | 5 서체 · 제목 700~800 | `tailwind.config.ts:63-65` `fontWeight: '800'`, `'700'`, `'700'` |
| g | 5 서체 · 대문자 + 넓은 자간 라벨 | `tailwind.config.ts:70` `overline` `letterSpacing: '0.05em'` 11px, `globals.css:93` `tracking-wide uppercase` |
| h | 5 서체 · 숫자 형식 불일치 | 숫자 포맷 유틸이 없음(`utils.ts` 전체). 화면마다 `toLocaleString`·날것 숫자 혼용(감사 1절) |
| i | 5 서체 · 글꼴 로딩이 첫 화면을 막음 | `globals.css:1-4` 원격 `@import` (아래 실측) |
| j | 7 디테일 · 모서리 체계 없음 / 전부 알약 | `tailwind.config.ts:77-81` `card 8px`, `badge 4px`, `pill 9999px` 세 가지뿐 |
| k | 7 디테일 · 포커스 링 불통일 | `globals.css`에 전역 포커스 규칙 없음. 다른 파일 28곳이 `outline-none`/`focus:ring-*`를 제각각 사용 |
| l | 9 모션 · `transition-all`, 반복 애니메이션, 튀는 애니메이션, easing 여러 개 | `globals.css:89` `transition-all`, `:162` `shimmer-slide … infinite`, `tailwind.config.ts:91-99, 106-110` `pulse-dot`(무한 반복), `bookmark-pop`(1.3배 튐), `ease-out`/`ease-in-out`/`linear` 혼용 |
| m | 죽은 코드(슬롭이 숨어 있는 곳) | `globals.css`의 `.breaking-ticker`(+`@keyframes ticker`), `@keyframes slogan`, `.news-card`, `.news-card-large`, `.category-pill`, `.country-badge`, `.tab-item`, `.tab-item-active`, `.text-gradient-amber`, `.border-glow`, `.surface-interactive` — 모두 사용처 0곳. `constants.ts:147-154` `PRIORITY_STYLES`, `AI_BADGE_STYLE`, `utils.ts:358` `countryColor` — 사용처 0곳. `tailwind.config.ts` `slide-up`, `toast-in` 애니메이션 — 사용처 0곳 |

### 실측 1 — Pretendard `@import`는 렌더를 막는다 (`qa-out/planner-s1-fontblock.log`)
빌드된 CSS(`/.next/static/css/*.css`)의 첫 줄이 `@import url("https://cdn.jsdelivr.net/…/pretendardvariable-dynamic-subset.min.css")`이고, 이 CSS는 `<link rel="stylesheet" data-precedence="next">`로 걸린다. 브라우저는 `@import`된 시트까지 받아야 첫 화면을 그린다.

| jsDelivr 응답 | `renderBlockingStatus` | 첫 화면(FCP) |
|---|---|---|
| 정상 | `blocking` | 580ms |
| 4초 지연 | `blocking` | **4,516ms** |
| 즉시 실패 | `blocking` | 248ms |

→ 제3자 CDN이 느려지면 그만큼 화면 전체가 늦게 뜬다. 계약 3절의 글꼴 조건("렌더를 막지 않는 방식", "실패해도 대체 글꼴로 정상 표시")을 Pretendard도 지키려면 `@import`를 지우고 `<link>`로 옮겨야 한다(항목 5).

### 실측 2 — 대비 (WCAG 2.x, 기준 4.5:1)

| 글자색 \ 면 | `surface-deep` #12110f | `surface` #161513 | `surface-card` #1c1a18 | `surface-elevated` #262421 |
|---|---|---|---|---|
| `text` #efe9de | 15.62 | 15.10 | 14.36 | 12.81 |
| `text-secondary` #aaa398 | 7.55 | 7.30 | 6.94 | 6.19 |
| `text-muted` #8a847a | 5.09 | 4.92 | 4.68 | **4.17 (미달)** |
| `accent` #f0883e | 7.46 | 7.21 | 6.85 | 6.11 |
| `live` / `negative` #e5484d | 4.82 | 4.66 | **4.43 (미달)** | **3.95 (미달)** |
| `positive` #4cc38a | 8.52 | 8.24 | 7.83 | 6.99 |

| 조합 | 대비 | 판정 |
|---|---|---|
| `accent-ink` #161513 on `accent` #f0883e | 7.21 | 통과 |
| `accent-ink` #161513 on `text` #efe9de (주요 버튼) | 15.10 | 통과 |
| `accent-ink` #161513 on `live` #e5484d | 4.66 | 통과 |
| 흰색 on `accent` (현재 코드 `bg-accent text-white` 9곳) | 2.53 | 미달 |
| `text` on `accent` | 2.09 | 미달 |
| 흰색 on `live` | 3.91 | 미달 |
| `text` on `live` | 3.24 | 미달 |
| `::selection` (`accent` 20% 위 `text`) | 9.06 ~ 11.32 | 통과 |
| 포커스 링 `accent` vs 각 면 (비글자 3:1 기준) | 6.11 ~ 7.46 | 통과 |

참고: 수정 전 `text-muted` #6e7681은 4.12 / 3.77 / 3.31(surface / card / elevated)로 세 면 모두 미달이었다.

사용 규칙(값은 계약 그대로 두고 쓰는 곳으로 해결 — "S2~S4 인계" 절에 다시 적음):
1. `text-muted`는 `surface-deep`·`surface`·`surface-card` 위에서만. `surface-elevated` 위(hover 행, 입력창, 칩)의 메타는 `text-secondary`.
2. `live`·`negative`를 **글자색**으로 쓸 때는 `surface`·`surface-deep` 위에서만. 카드·elevated 위에서는 점(비글자, 3:1 통과) + 중립 글자.
3. `accent`·`live` 면 위 글자는 반드시 `accent-ink`. 흰색·`text`는 미달.

---

## 디자인 방향 (UNSLOP-AUDIT.md 2절 그대로)

- **Product.** 해외 주요 언론 30곳의 기사를 몇 시간마다 모아 한국어로 번역해 보여 주는, 한국 독자를 위한 해외 뉴스 통신 데스크.
- **Character.** 차분한, 정확한, 종이 신문 같은.
- **World.** 밤의 편집국과 통신사 데스크 — 신문지와 잉크, 시각이 찍혀 나오는 통신 전문. 중립색은 종이·잉크 쪽으로 아주 약하게 따뜻하게, 강조색은 기존 주황 하나.
- **Moments.** ① 홈 머리기사의 실제 보도 사진(화면에서 유일하게 색이 풍부한 곳) ② "최신 뉴스" 통신 목록.
- **Signature.** 통신 시각표 — KST 시각을 고정폭 숫자로(`14:02`, 날짜가 다르면 `11.05 14:02`).

**금지 (S1 파일에서 0건이어야 함)**: 색상 그라데이션 · 그라데이션 글자 · 글로우 · 색 그림자 · `backdrop-blur` · 카테고리별 색 · 이모지 · 굵기 700 이상 · `uppercase` · `tracking-*` · `italic` · `transition-all` · 반복/튀는 애니메이션 · 하드코딩 hex(토큰 정의 제외) · 4px 격자를 벗어난 간격.

**S1이 담당하는 차별화 요소 2개** (새 장식이 아니라 계약의 Signature·Moments를 받치는 유틸)
1. `formatWireTime` + `.dateline` — 통신 시각표.
2. `.img-standin` — 대체 사진만 흑백 인쇄 처리해서 실제 보도 사진이 유일한 색으로 남게 한다.

---

## 대상 파일 목록

| 파일 | 작업 |
|---|---|
| `tailwind.config.ts` | 전면 갱신 (항목 1, 2, 5~9) |
| `src/app/globals.css` | 전면 갱신 (항목 5, 8~12, 14) |
| `src/lib/constants.ts` | `CATEGORIES`, `CATEGORY_COLORS`, 플레이스홀더, 죽은 상수 (항목 2~4, 15) |
| `src/lib/utils.ts` | `getCategoryStyle`, `countryColor` 삭제, `formatWireTime`, `formatCount` (항목 2, 3, 12, 13) |
| `tests/design-tokens.test.ts` | 7개 테스트 갱신 + 신규 (항목 16) |
| `tests/utils.test.ts` | 신규 2개 describe (항목 16) |
| `src/components/Footer.tsx` **178행 한 줄** | 빌드 유지용 최소 수정 (항목 4). 그 밖의 타 슬라이스 파일은 손대지 않는다 |

---

## 개선 항목

각 항목의 "검증"은 저장소 루트에서 실행한다. 테스트 이름은 항목 16에서 정한 이름이다.

### 항목 1: 중립 램프와 강조색 하나 — `colors`
- **[패스 2 색 · 템플릿 기본 중립색 / 강조색 4개]**
- **대상**: `tailwind.config.ts:4-7`(borderTokens), `:21-46`(colors), `:50-52`(borderColor)
- **현재 문제**: GitHub 다크 팔레트 그대로. 강조색이 주황·파랑·빨강·초록 4개. 테두리가 불투명 회청색.
- **변경값** (`theme.extend.colors` — 계약 3절 표 그대로)
  ```ts
  const borderTokens = { DEFAULT: 'rgba(239,233,222,0.10)', muted: 'rgba(239,233,222,0.06)' };
  colors: {
    surface: { deep: '#12110f', DEFAULT: '#161513', card: '#1c1a18', elevated: '#262421' },
    text:    { DEFAULT: '#efe9de', secondary: '#aaa398', muted: '#8a847a' },
    accent:  { DEFAULT: '#f0883e', ink: '#161513' },
    live: '#e5484d',
    positive: '#4cc38a',
    negative: '#e5484d',
    border: borderTokens,
  },
  borderColor: { DEFAULT: borderTokens.DEFAULT },
  ```
  - `extend.colors`의 키는 정확히 `accent, border, live, negative, positive, surface, text` 7개.
  - 문자열은 계약 표기 그대로(`rgba(239,233,222,0.10)` — 공백 없음, `0.10`).
  - Tailwind 기본 팔레트(`white`, `amber-400` …)는 **닫지 않는다**. 이유: 병렬로 계획 중인 S2~S4가 `text-white` 등을 계획에 넣었을 때 조용히 사라지면 사진 위 글자처럼 읽을 수 없는 결함이 된다(현재 12곳 사용, `qa-out/planner-s1-handoff.txt`).
- **기대 효과**: 한 개의 따뜻한 중립 램프 + 강조색 하나. 테두리는 글자색의 10%/6% 헤어라인이라 어느 면 위에서도 같은 세기로 보인다.
- **검증**
  ```bash
  npx tsx --test --test-name-pattern="palette = UNSLOP-AUDIT|default border color|preflight paints" tests/design-tokens.test.ts   # 3 pass
  node qa-out/planner-s1-contrast.mjs                                                                                              # 위 대비 표와 같은 값
  grep -nE "#(0d1117|161b22|21262d|30363d|484f58|6e7681|8b949e|e6edf3|58a6ff|f85149|3fb950)" tailwind.config.ts src/app/globals.css src/lib/constants.ts src/lib/utils.ts   # 0줄
  ```

### 항목 2: 삭제할 토큰과 죽은 색 상수
- **[패스 2 색 · "Every element highlighted"]**
- **대상**: `tailwind.config.ts:22-25, 42-44` / `constants.ts:146-154` / `utils.ts:358-366`
- **현재 문제**: 계약이 삭제를 정한 토큰이 남아 있고, 색 클래스를 가진 죽은 상수가 Tailwind 스캔에 걸려 CSS에 색 클래스를 만들어 낸다.
- **변경값**
  - 삭제: `primary`, `dark`, `light`, `accent.blue`, `accent.red`, `accent.green` (`tailwind.config.ts`). `primary/dark/light`는 사용처 0곳.
  - 삭제: `PRIORITY_STYLES`, `AI_BADGE_STYLE` (`constants.ts:146-154`) — 사용처 0곳(`grep -rn "PRIORITY_STYLES\|AI_BADGE_STYLE" src tests scripts` → 정의만).
  - 삭제: `countryColor` (`utils.ts:358-366`) — 사용처 0곳.
  - `accent-blue/red/green`은 S2~S4 파일 62곳에서 아직 쓰인다. Tailwind는 모르는 클래스를 무시하므로 **빌드는 깨지지 않고**, 그 요소의 색만 빠진다(이번 방향이 원하는 중간 상태). 클래스 이름 정리는 각 슬라이스 몫.
- **기대 효과**: 강조색은 `accent` 하나, 의미색은 `live`/`positive`/`negative`만.
- **검증**
  ```bash
  grep -nE "primary|accent-(blue|red|green)|PRIORITY_STYLES|AI_BADGE_STYLE|countryColor" tailwind.config.ts src/lib/constants.ts src/lib/utils.ts   # 0줄
  npx tsx --test --test-name-pattern="deleted tokens" tests/design-tokens.test.ts                                                                    # 1 pass
  ```

### 항목 3: 카테고리 색 중립화 — `CATEGORY_COLORS` / `getCategoryStyle`
- **[패스 2 색 · "Every element highlighted" (색 16가지가 크롬에 퍼짐)]**
- **대상**: `constants.ts:91-126`, `utils.ts:1, 493-504`
- **현재 문제**: 카테고리마다 다른 색의 글자·왼쪽 테두리·배경. 알 수 없는 slug의 대체값도 램프 밖 색(`border-l-gray-500`, `border-gray-500`).
- **변경값**
  ```ts
  // constants.ts — 타입은 그대로
  export type CategoryStyle = { border: string; text: string; bg: string; borderAll: string };

  const NEUTRAL_CATEGORY_STYLE: CategoryStyle = Object.freeze({   // export 하지 않는다
    border: 'border-l-border',
    text: 'text-text-secondary',
    bg: 'bg-surface-elevated',
    borderAll: 'border-border',
  });

  export const CATEGORY_COLORS: Record<string, CategoryStyle> = Object.freeze(
    Object.fromEntries(CATEGORIES.map((c) => [c.slug, NEUTRAL_CATEGORY_STYLE])),
  );

  // utils.ts — 이름·시그니처 유지
  export function getCategoryStyle(_slug: string): CategoryStyle {
    return CATEGORY_COLORS.general;
  }
  ```
  - 네 클래스는 `constants.ts`에 **완전한 문자열 리터럴**로 둔다(Tailwind 스캔 규칙, 기존 S1-A 교훈).
  - `CATEGORY_COLORS`의 키는 16개 카테고리 slug 그대로. 값은 전부 같은 객체.
  - `utils.ts:1`의 import에서 `CATEGORY_COLORS`는 계속 쓰인다. `hasOwn`은 `getDefaultImage`가 쓰므로 남긴다.
  - 필드별 뜻: `text` = 라벨 글자색(계약: 색 없는 글자 라벨), `bg` = 면이 꼭 필요할 때(사진 위 등)의 중립 면, `border`/`borderAll` = 헤어라인. 글자만 쓰려면 `text`만 적용하면 된다.
  - 대비: `text-secondary` on `surface-elevated` 6.19:1.
  - `constants.ts:91-93` 구획 주석의 "Dark modern palette" 문구도 고친다.
- **기대 효과**: 색 클래스 문자열 0개. 기존 사용처 5곳(`NewsCard.tsx:12`, `NewsCardLarge.tsx:12`, `ArticleHeroImage.tsx:31`, `app/page.tsx:128`, `app/article/[id]/page.tsx:112`)은 수정 없이 빌드되고 중립 라벨로 보인다.
- **검증**
  ```bash
  npx tsx --test --test-name-pattern="category styles" tests/design-tokens.test.ts    # 5 pass
  npx tsx -e "import {getCategoryStyle as g} from './src/lib/utils'; console.log(JSON.stringify(g('politics'))===JSON.stringify(g('__proto__')), g('x'))"
  # → true { border: 'border-l-border', text: 'text-text-secondary', bg: 'bg-surface-elevated', borderAll: 'border-border' }
  ```

### 항목 4: `CATEGORIES` 이모지 제거 (+ 빌드 유지용 Footer 한 줄)
- **[패스 3 아이콘 · "Emoji as nav icons, label decoration"]**
- **대상**: `constants.ts:45-62`, `src/components/Footer.tsx:178`
- **현재 문제**: 16개 카테고리에 이모지 `icon` 필드. 푸터 카테고리 목록에 그대로 찍힌다(`qa-out/unslop/before/prod/d-home-footer.jpg`).
- **변경값**
  - `CATEGORIES`의 각 원소를 `{ slug, label }`만 남긴다(순서·slug·label·`as const` 그대로, 16개).
  - `Footer.tsx:178` — 다음 **한 줄만 삭제**한다(다른 줄은 S2 몫).
    ```tsx
                        <span aria-hidden="true" className="text-xs opacity-60">{cat.icon}</span>
    ```
- **기대 효과**: 인터페이스에 이모지 0개(S1 범위). 이 한 줄을 지우지 않으면 `tsc`가 `Property 'icon' does not exist`로 실패한다.
- **검증**
  ```bash
  grep -n "icon" src/lib/constants.ts              # 0줄
  grep -rn "cat\.icon\|\.icon}" src/components/Footer.tsx   # 0줄
  node -e "const s=require('fs').readFileSync('src/lib/constants.ts','utf8');console.log(/\p{Extended_Pictographic}/u.test(s))"   # false
  git diff --stat -- src/components/Footer.tsx     # 1 file changed, 1 deletion(-)
  ```

### 항목 5: 서체 패밀리 — serif · mono 스택, Pretendard `@import` 제거
- **[패스 5 서체 · 글꼴 선택과 짝 / 글꼴 로딩이 첫 화면을 막음]**
- **대상**: `tailwind.config.ts:53-59`, `globals.css:1-4`
- **현재 문제**: 큰 헤드라인용·숫자용 짝 글꼴이 없다. Pretendard는 CSS `@import`로 걸려 첫 화면을 막는다(실측 1).
- **변경값**
  ```ts
  fontFamily: {
    sans:  [/* 기존 10개 항목 그대로 — 'Pretendard Variable', 'Pretendard', …, 'sans-serif' */],
    serif: ['Noto Serif KR', 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', 'serif'],
    mono:  ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  },
  ```
  - `globals.css:1-4` (`@import url('https://cdn.jsdelivr.net/…')`와 그 주석) **삭제**. 판단 근거: 실측 1(`renderBlockingStatus: blocking`, CDN 4초 지연 → FCP 4.5초). Pretendard 자체는 유지하며, 로딩은 S2가 `layout.tsx`에서 다른 두 글꼴과 같은 비차단 `<link>`로 한다(인계 1번 — **필수**).
  - 대체 글꼴은 스택이 전부다. `@font-face`를 새로 만들지 않는다(빌드 시점 다운로드 금지).
  - S1~S2 사이 중간 상태에서는 Pretendard가 로드되지 않아 OS 기본 글꼴로 보인다. 빌드에는 영향 없다.
- **기대 효과**: 글꼴 CDN이 느리거나 죽어도 첫 화면이 바로 뜬다. `font-serif`(큰 헤드라인 2곳), `font-mono`(시각·숫자) 사용 가능.
- **검증**
  ```bash
  grep -c "@import" src/app/globals.css                                                    # 0
  npx tsx --test --test-name-pattern="font families" tests/design-tokens.test.ts          # 1 pass
  npx tailwindcss -i src/app/globals.css -o qa-out/eval-s1.css --minify && head -c 60 qa-out/eval-s1.css   # '@import'로 시작하지 않음
  ```

### 항목 6: 타입 스케일과 굵기 — 400 / 500 / 600
- **[패스 5 서체 · "Headings at weight 800 or 900", "Uppercase labels with wide tracking"]**
- **대상**: `tailwind.config.ts:60-71`, 신규 `theme.fontWeight`
- **현재 문제**: `headline-xl` 800, `headline-lg`·`headline-md` 700, `overline` 11px + 자간 0.05em, `caption` 500.
- **변경값** (`theme.extend.fontSize` — 계약 3절 그대로, 키 9개)
  ```ts
  'headline-xl': ['clamp(1.75rem, 1.2rem + 2vw, 2.5rem)', { lineHeight: '1.2',  fontWeight: '600' }],
  'headline-lg': ['1.75rem',   { lineHeight: '1.25', fontWeight: '600' }],
  'headline-md': ['1.25rem',   { lineHeight: '1.35', fontWeight: '500' }],
  'headline-sm': ['1rem',      { lineHeight: '1.45', fontWeight: '500' }],
  'body-lg':     ['0.9375rem', { lineHeight: '1.6',  fontWeight: '400' }],
  'body-md':     ['0.875rem',  { lineHeight: '1.6',  fontWeight: '400' }],
  caption:       ['0.75rem',   { lineHeight: '1rem', fontWeight: '400' }],
  overline:      ['0.75rem',   { lineHeight: '1rem', fontWeight: '500', letterSpacing: '0' }],
  meta:          ['0.75rem',   { lineHeight: '1rem', fontWeight: '400' }],   // 신규
  ```
  굵기 스케일을 닫는다(`theme.fontWeight` — `extend` 아님).
  ```ts
  fontWeight: { normal: '400', medium: '500', semibold: '600' },
  ```
  - 효과: `font-bold`/`font-extrabold`/`font-black`은 CSS가 생성되지 않는다. S2~S4에 남은 29곳은 크기 토큰의 굵기(500/600)나 상속값(400)으로 내려간다. 빌드는 깨지지 않는다.
  - 닫는 이유: ① 계약의 "700 이상 금지"를 시스템이 보장 ② Noto Serif KR은 500·600만, IBM Plex Mono는 400·500만 로드하므로 700을 요청하면 브라우저가 가짜 굵은 글씨를 합성한다.
  - `uppercase`·`italic`·`tracking-*`는 Tailwind 설정으로 막지 않는다(`not-italic` 등이 함께 사라짐). S1 파일에서 쓰지 않는 것으로 지킨다.
- **기대 효과**: 위계는 크기와 색으로. 굵기 3단계.
- **검증**
  ```bash
  npx tsx --test --test-name-pattern="type scale|text-headline-xl|text-overline" tests/design-tokens.test.ts   # 3 pass
  grep -nE "fontWeight: '(7|8|9)00'|letterSpacing: '0\.0" tailwind.config.ts                                    # 0줄
  ```

### 항목 7: 모서리 — tag 6 / control 8 / card 12 / panel 16
- **[패스 7 디테일 · "Every element a full pill", 중첩 반경]**
- **대상**: `tailwind.config.ts:77-81`
- **현재 문제**: `card 8px`, `badge 4px`, `pill 9999px`. 컨트롤·패널 단계가 없어 버튼·입력·칩이 전부 알약(`rounded-pill` 12곳).
- **변경값** (`theme.extend.borderRadius`)
  ```ts
  tag: '0.375rem',      // 6px  신규
  control: '0.5rem',    // 8px  신규
  card: '0.75rem',      // 12px (8 → 12)
  panel: '1rem',        // 16px 신규
  // 사용 중단 별칭 — S2~S4 파일 27곳이 아직 참조. 지우면 버튼·입력이 각진 모서리가 된다.
  badge: '0.375rem',    // = tag
  pill: '0.5rem',       // = control
  ```
  - 별칭을 남기는 근거: 계약 3절 첫 줄 "기존 토큰 이름은 유지하고 값만 바꾼다". `rounded-pill` 12곳은 전부 버튼·입력·칩·카운트이고 실제 원은 없다(전수 확인) → 8px가 맞다. 실제 원은 `rounded-full`(Tailwind 기본) 그대로.
  - 주석에 "사용 중단, 새 코드는 `rounded-tag`/`rounded-control`"을 적는다.
- **기대 효과**: 크기에 따른 반경. 중첩 계산 가능(패널 16 − 패딩 → 카드 12 → 컨트롤 8 → 태그 6).
- **검증**
  ```bash
  npx tsx --test --test-name-pattern="radius" tests/design-tokens.test.ts   # 1 pass
  grep -n "9999" tailwind.config.ts                                         # 0줄
  ```

### 항목 8: 깊이 — 그림자는 `shadow-float` 하나, 글로우·그라데이션 제거
- **[패스 2 색 · "Colored glows", "Gradient text", 어두운 테마의 깊이는 면 단계 + 헤어라인]**
- **대상**: `tailwind.config.ts:72-76`, `globals.css:118-124, 145-168`
- **현재 문제**: 그림자 3종, `.border-glow`(주황 글로우), `.text-gradient-amber`(그라데이션 글자), `.shimmer`(흰색 그라데이션이 무한히 지나감).
- **변경값**
  - 그림자 스케일을 닫는다(`theme.boxShadow` — `extend` 아님).
    ```ts
    boxShadow: { none: 'none', float: '0 8px 24px rgba(0,0,0,0.35)' },
    ```
    `shadow-card`(14곳), `shadow-elevated`(5곳), `shadow-dropdown`(1곳: `Header.tsx:526`)은 CSS가 생성되지 않는다 → 그림자 없음 = 계약이 정한 상태. `Header.tsx:526`의 떠 있는 메뉴는 S2가 `shadow-float`로 바꾼다(그 전까지는 테두리 + 면으로 구분됨).
  - `globals.css`에서 삭제: `.text-gradient-amber`, `.border-glow`, `.shimmer`, `.shimmer::after`, `@keyframes shimmer-slide`.
  - `.shimmer` 삭제 근거: 계약 3절 "그라데이션 … 없음. 이미지 위 스크림만 허용" + "`animate-pulse/ping` 금지". 그라데이션 없이 로딩을 알리는 대안(투명도 맥박)도 금지 대상이라 스켈레톤은 **정지한 면**으로 둔다. `PageSkeleton.tsx`의 10곳은 모두 자체 배경(`bg-surface-card`/`bg-surface-elevated`)이 있어 클래스가 사라져도 블록은 그대로 보인다.
- **기대 효과**: 깊이는 면 4단계 + 헤어라인. `globals.css`에 `gradient`·`box-shadow` 0건.
- **검증**
  ```bash
  grep -cE "gradient|box-shadow|shimmer|glow" src/app/globals.css          # 0
  npx tsx --test --test-name-pattern="depth|no @import|dead and decorative" tests/design-tokens.test.ts   # 3 pass
  ```

### 항목 9: 모션 — easing 하나, 지속 150 / 200 / 400ms, 진입 하나
- **[패스 9 모션 · `transition-all`, 반복 애니메이션, "Bouncy springs", "one easing curve"]**
- **대상**: `tailwind.config.ts:82-111`, 신규 `theme.transition*`, `globals.css:38-41, 71-82`
- **현재 문제**: easing 3종 혼용, `pulse-dot` 무한 반복, `bookmark-pop` 1.3배 튐, 진입 애니메이션 2종(`fade-in` 0.3s, `slide-up` 0.4s), `transition-all`.
- **변경값** (모두 `theme` 최상위 — 닫힌 스케일)
  ```ts
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  transitionTimingFunction: { DEFAULT: EASE, linear: 'linear' },
  transitionDuration: { DEFAULT: '150ms', 0: '0ms', 150: '150ms', 200: '200ms', 400: '400ms' },
  transitionProperty: {
    none: 'none',
    DEFAULT: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, transform',
    colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
    opacity: 'opacity',
    transform: 'transform',
  },
  keyframes: {
    spin: { to: { transform: 'rotate(360deg)' } },
    'fade-in': {
      from: { opacity: '0', transform: 'translateY(8px)' },
      to: { opacity: '1', transform: 'none' },
    },
  },
  animation: {
    none: 'none',
    spin: 'spin 1s linear infinite',
    'fade-in': `fade-in 400ms ${EASE} backwards`,
  },
  ```
  - `linear`는 연속 운동(로딩 스피너, 티커)에만. 상태 전환은 전부 `EASE`.
  - `duration-400`은 Tailwind 기본 스케일에 없어서 여기서 추가한다(계약의 400ms 진입).
  - `animate-fade-in`은 이름을 유지하고 내용만 "fade + 8px 오름, 400ms"로 바꾼다(사용 7곳). `to`가 `transform: none`이고 fill이 `backwards`라서 끝난 뒤 transform이 남지 않는다 → 쌓임 맥락·`position: fixed` 기준이 바뀌지 않는다.
  - 삭제: `slide-up`, `toast-in`(사용 0곳), `pulse-dot`(4곳), `bookmark-pop`(1곳). Tailwind 기본 `animate-pulse/ping/bounce`도 생성되지 않는다(스케일을 닫았으므로).
  - `transition-all`(8곳)은 CSS가 생성되지 않는다 → 전환 없이 즉시 바뀜. `duration-300/500`(10곳)·`ease-in-out`(2곳)도 생성되지 않는다 → 기본 150ms·`EASE`가 적용된다. `Header.tsx:303, 379`의 `transition-[max-height,…]`(임의 값)은 그대로 생성되고 150ms로 동작한다. `transitionend`/`animationend`에 기대는 JS는 0곳.
  - `globals.css`에서 삭제: `@keyframes slogan`(`:38-41`), `.breaking-ticker` + `@keyframes ticker` + `.breaking-ticker:hover`(`:71-82`). 티커는 `BreakingTicker.tsx:74-89`의 styled-jsx가 자체 `@keyframes ticker`와 hover·focus 정지를 갖고 있어 영향 없다.
  - `prefers-reduced-motion` 블록(`globals.css:57-67`)은 그대로 둔다.
- **기대 효과**: 전환은 한 곡선·세 지속 시간. 반복 모션은 티커(제품 기능)와 로딩 스피너뿐.
- **검증**
  ```bash
  npx tsx --test --test-name-pattern="motion|transitions use the one easing|deleted tokens|reduced-motion" tests/design-tokens.test.ts   # 4 pass
  grep -cE "@keyframes|animation:|transition-all|ease-(in|out)" src/app/globals.css     # 0
  grep -cE "pulse|pop|slide-up|toast|ease-(in|out)" tailwind.config.ts                   # 0
  ```

### 항목 10: 포커스 링 하나
- **[패스 7 디테일 · "A visible focus ring for keyboard users"]**
- **대상**: `globals.css` `@layer base` (`::selection` 규칙 뒤)
- **현재 문제**: 전역 포커스 규칙이 없어 브라우저 기본(파란 링)이 뜨거나, 파일마다 `outline-none` + `focus:ring-*`를 따로 쓴다.
- **변경값**
  ```css
  :focus-visible {
    outline: 2px solid theme('colors.accent.DEFAULT');
    outline-offset: 2px;
  }
  ```
  - base 레이어라서 유틸리티(`outline-none`, `focus:outline-none`)가 이긴다 → 기존 28곳은 지금 모습 그대로이고 깨지지 않는다. 그 클래스를 지워 이 링 하나로 맞추는 것은 S2~S4 몫. `layout.tsx:47`의 `<main tabIndex={-1} className="… focus:outline-none">`은 그대로 두는 것이 맞다(건너뛰기 링크의 도착점).
  - `overflow-hidden` 안에서 링이 잘리는 요소는 Tailwind 기본 유틸 `-outline-offset-2`를 쓴다(새 이름 추가 없음).
- **기대 효과**: 키보드 포커스가 어디서나 같은 모양. 대비 6.11~7.46:1.
- **검증**
  ```bash
  npx tsx --test --test-name-pattern="one focus ring" tests/design-tokens.test.ts   # 1 pass
  ```

### 항목 11: `globals.css` 정리 — 죽은 클래스, 하드코딩 색, 내비 hover
- **[패스 2 색 · 강조색 반복 / 패스 5 서체 · 대문자 라벨 / 패스 1 간격 · 격자 밖 값]**
- **대상**: `globals.css:43-55, 84-114, 126-128`
- **현재 문제**: 사용처 0곳인 컴포넌트 클래스 7개(그중 `.category-pill`은 `tracking-wide uppercase`, `.news-card-large`는 `transition-all` + 그림자, `.country-badge`는 `py-0.5`). 스크롤바 색이 hex 하드코딩. `.nav-link` hover가 모든 메뉴에 강조색을 쓴다.
- **변경값**
  - 삭제: `.news-card`, `.news-card-large`, `.category-pill`, `.country-badge`, `.tab-item`, `.tab-item-active`, `.surface-interactive`.
  - 유지(S2 `Header.tsx:331, 332, 344, 361, 362`가 사용): `.nav-link`, `.nav-link-active`. 한 곳만 바꾼다.
    ```css
    .nav-link        { @apply px-3 py-2 text-sm font-medium text-text-secondary hover:text-text transition-colors; }   /* hover:text-accent → hover:text-text */
    .nav-link-active { @apply text-accent border-b-2 border-accent; }                                                  /* 그대로: 현재 위치만 accent */
    ```
  - 스크롤바: hex → 토큰.
    ```css
    ::-webkit-scrollbar-track       { background: theme('colors.surface.DEFAULT'); }
    ::-webkit-scrollbar-thumb       { background: theme('colors.surface.elevated'); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: theme('colors.text.muted'); }
    ```
  - 유지: `body`·`:lang()`·`table` 줄바꿈 규칙, `::selection`(`bg-accent/20 text-text`), reduced-motion 블록, `.scrollbar-none/.scrollbar-hide`, `.safe-area-bottom`.
  - 정리 후 `globals.css`의 전체 구성: `@tailwind` 3줄 → base(body, lang, table, selection, focus-visible, scrollbar, reduced-motion) → components(`.nav-link`, `.nav-link-active`, `.dateline`, `.img-standin`) → utilities(`.scrollbar-none/.scrollbar-hide`, `.safe-area-bottom`). 전체 내용은 `qa-out/planner-s1-globals.css`.
- **기대 효과**: 약 170줄 → 약 85줄. hex 0건, 강조색은 현재 위치에만.
- **검증**
  ```bash
  grep -cE "#[0-9a-fA-F]{3,8}\b|uppercase|tracking-|italic|-[0-9]+\.5\b" src/app/globals.css      # 0
  grep -cE "\.(news-card|category-pill|country-badge|tab-item|surface-interactive|breaking-ticker)" src/app/globals.css   # 0
  npx tsx --test --test-name-pattern="globals.css source|global wrapping|scrollbar-hide" tests/design-tokens.test.ts    # 4 pass
  ```

### 항목 12: 시그니처 — `formatWireTime` + `.dateline`
- **[패스 7 디테일 · "The signature detail" / 패스 5 서체 · 숫자는 `tabular-nums` 한 가지 형식]**
- **대상**: `utils.ts` (`timeAgo` 뒤, `:344` 다음), `globals.css` `@layer components`
- **현재 문제**: 통신 시각을 찍는 유틸이 없다. 카드 메타는 "3시간 전" 상대 시각뿐이고 숫자 폭이 글자마다 다르다.
- **변경값**
  ```ts
  /**
   * Wire time (KST): 'HH:mm' when the instant falls on the same KST calendar date as `now`,
   * otherwise 'MM.DD HH:mm'. '' for invalid input.
   * HYDRATION: depends on `now` (only around KST midnight). In client components put
   * suppressHydrationWarning on the direct parent of the text, as with timeAgo().
   */
  export function formatWireTime(input: DateInput, now?: Date | number): string {
    const p = toKstParts(input);
    if (!p) return '';
    const n = toKstParts(toEpochMs(now) ?? Date.now());
    const time = `${pad2(p.hour)}:${pad2(p.minute)}`;
    const sameDay = n !== null && n.year === p.year && n.month === p.month && n.day === p.day;
    return sameDay ? time : `${pad2(p.month)}.${pad2(p.day)} ${time}`;
  }
  ```
  - "같은 날"은 KST 달력 기준으로 **연·월·일이 모두 같을 때**만. 미래 시각도 같은 규칙.
  - `now`가 없거나 무효면 현재 시각. ICU·`toLocale*` 사용 금지(`utils.ts:3-5` 규칙).
  ```css
  .dateline {
    @apply font-mono text-meta tabular-nums text-text-muted;
  }
  ```
  - components 레이어 → 유틸리티로 덮어쓸 수 있다(예: elevated 면 위에서 `dateline text-text-secondary`).
- **기대 효과**: `14:02` / `11.05 14:02`가 목록·카드 메타·기사 머리에서 같은 폭·같은 모양으로 찍힌다. 서버(TZ=UTC)와 브라우저(TZ=Asia/Seoul) 출력이 같다.
- **검증**
  ```bash
  npx tsx --test --test-name-pattern="formatWireTime|process time zone" tests/utils.test.ts          # 7 pass (formatWireTime 5 + TZ 2)
  npx tsx --test --test-name-pattern="dateline" tests/design-tokens.test.ts                           # 1 pass
  TZ=America/Los_Angeles npx tsx -e "import {formatWireTime as f} from './src/lib/utils'; const N=Date.UTC(2026,9,5,3); console.log(f('2026-10-05T05:02:00Z',N), '|', f('2026-10-04T14:59:59Z',N), '|', JSON.stringify(f('garbage',N)))"
  # → 14:02 | 10.04 23:59 | ""
  ```

### 항목 13: `formatCount` — 숫자 한 가지 형식
- **[패스 5 서체 · "Numbers in mixed formats"]**
- **대상**: `utils.ts` (`formatWireTime` 뒤)
- **현재 문제**: 헤더 `164,917 건` vs 속보 페이지 `164917개`. `toLocaleString`은 서버·브라우저 ICU에 따라 달라질 수 있다.
- **변경값**
  ```ts
  /** Count with thousands separators ('164,917'). No ICU. '0' for invalid input. */
  export function formatCount(n: number): string {
    if (typeof n !== 'number' || !Number.isFinite(n) || Math.abs(n) > Number.MAX_SAFE_INTEGER) return '0';
    const i = Math.trunc(n);
    const digits = String(Math.abs(i)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return i < 0 ? '-' + digits : digits;
  }
  ```
  - 소수는 버림. 음수는 부호 유지. 숫자가 아닌 값(문자열 `'164917'` 포함)·NaN·±Infinity·안전 정수 범위 밖은 `'0'`.
  - 단위(`건`)는 붙이지 않는다 — 호출하는 쪽에서 붙인다.
- **기대 효과**: S2·S4가 모든 카운트를 `164,917` 한 형식으로 찍는다.
- **검증**
  ```bash
  npx tsx --test --test-name-pattern="formatCount" tests/utils.test.ts    # 4 pass
  npx tsx -e "import {formatCount as f} from './src/lib/utils'; console.log(f(164917), f(0), f(NaN), f(1234.9), f(-1234))"   # 164,917 0 0 1,234 -1,234
  ```

### 항목 14: `.img-standin` — 대체 사진 인쇄 처리
- **[패스 8 비주얼 · 모먼트는 실제 콘텐츠에서 / effects.md Duotone을 CSS만으로]**
- **대상**: `globals.css` `@layer components`
- **현재 문제**: 기사 사진이 없을 때 쓰는 카테고리 스톡 사진(Unsplash)이 실제 보도 사진과 똑같이 원색이라, 화면에서 무엇이 진짜 보도 사진인지 구분되지 않는다(`qa-out/unslop/before/prod/d-home-footer.jpg`의 국회의사당 스톡 사진).
- **변경값**
  ```css
  .img-standin {
    filter: grayscale(1) contrast(1.05) brightness(0.9);
  }
  ```
  - 캔버스·애니메이션·블렌드 레이어 없음. hover 변화 없음.
  - 클래스를 붙이는 것은 S3 `ArticleImage`(계약 6절: 대체 사진일 때만 `img-standin` + `data-standin`).
- **기대 효과**: 원색은 실제 보도 사진에만 남는다(Moments ①).
- **검증**
  ```bash
  npx tsx --test --test-name-pattern="img-standin" tests/design-tokens.test.ts    # 1 pass
  ```

### 항목 15: 이미지 플레이스홀더 SVG를 새 램프로
- **[패스 2 색 · 한 개의 중립 램프]**
- **대상**: `constants.ts:128-141`
- **현재 문제**: 인라인 SVG가 옛 팔레트(`fill="#21262d"`, `stroke="#30363d"`)를 하드코딩. 새 면 위에 푸른 회색 사각형으로 남는다.
- **변경값**
  - `:136` `fill="#21262d"` → `fill="#262421"` (`surface-elevated`)
  - `:137` `stroke="#30363d" stroke-width="8"` → `stroke="#efe9de" stroke-opacity="0.1" stroke-width="8"` (헤어라인과 같은 식: 글자색 10%. 합성 결과 #3a3834)
  - `:130-131` 주석의 hex도 맞춘다. 800×500 viewBox, 도형, 외부 참조 없음은 그대로.
- **기대 효과**: 플레이스홀더가 램프 안에 들어온다. 기존 테스트 `uses only dark-palette colors`가 새 값으로 통과한다.
- **검증**
  ```bash
  npx tsx --test --test-name-pattern="IMAGE_PLACEHOLDER_SRC" tests/design-tokens.test.ts    # 3 pass
  ```

### 항목 16: 간격 규칙 — S1 파일은 4px 격자만
- **[패스 1 간격 · "Arbitrary values"]**
- **대상**: `globals.css` 전체, `tailwind.config.ts`
- **현재 문제**: `.country-badge`의 `py-0.5`(삭제 대상). 그 밖의 S1 파일 값은 격자 위(`.nav-link` `px-3 py-2` = 12/8, 스크롤바 8px, 반경 4px).
- **변경값**
  - 정리 후 `globals.css`에 반 단계(`-N.5`)·임의 값(`-[…]`) 0건.
  - Tailwind 간격 스케일은 **닫지 않는다**. 이유: 반 단계 클래스가 S2~S4에 69곳 있고, 생성이 멈추면 패딩이 0이 되어 화면이 깨진다(색·굵기와 달리 사라졌을 때의 모습이 결함). 간격 패스는 각 슬라이스가 수행한다.
- **기대 효과**: S1이 내보내는 클래스는 전부 격자 위.
- **검증**: 항목 11의 첫 번째 `grep` (0).

### 항목 17: 단위 테스트 갱신과 신규 테스트
- **[검증 기반 — 위 16개 항목 전부]**
- **대상**: `tests/design-tokens.test.ts`, `tests/utils.test.ts`
- **현재 상태**: `npm test` 209개 통과. 항목 1~15를 적용하면 **정확히 7개가 실패**한다(격리 복사본에서 확인). 모두 `design-tokens.test.ts`.

  | 실패하는 테스트 (`design-tokens.test.ts`) | 원인 | 갱신 |
  |---|---|---|
  | `:45` every category: … consistent colors | 색 클래스 정규식(`/^border-l-[a-z]+-\d{3}$/` 등) | "모든 slug(알려진 16개 + 모르는 slug + `constructor`/`__proto__`/`''`) → 같은 중립 4클래스"로 교체 |
  | `:56` unknown slug → unchanged neutral fallback | `FALLBACK_STYLE`(`:33`)이 `gray-500` | 위 테스트에 합침. `FALLBACK_STYLE` → `NEUTRAL` 상수 |
  | `:80` default border color | `'#30363d'` | `'rgba(239,233,222,0.10)'` |
  | `:85` headline-xl … weight unchanged | `{ lineHeight: '1.15', fontWeight: '800' }` | 타입 스케일 9개 토큰 전체를 `deepEqual` + `theme.fontWeight` 3단계 |
  | `:94` dark palette snapshot is unchanged | 옛 hex | 계약 3절 팔레트 + `extend.colors` 키 7개 |
  | `:171` every category class … exist | `classes.length === 68` | 중립 4클래스 + 계약 클래스가 생성되는지 |
  | `:183` preflight paints uncolored borders | `'#30363d'` | `'rgba(239,233,222,0.10)'` |

  그대로 통과하는 것: `CATEGORY_COLORS covers exactly the 16 categories`, `every class is a complete string literal`, `content scans`, `IMAGE_PLACEHOLDER_SRC` 3개, `paging constants`, `global wrapping`, `.scrollbar-hide`, `.text-headline-xl compiles to the fluid clamp()`, 그리고 `utils.test.ts` 등 나머지 21개 파일 전부.

- **신규 테스트** (이름은 아래대로 — 각 항목의 검증 명령이 이 이름으로 고른다)

  `tests/design-tokens.test.ts`
  | describe | test | 단언 |
  |---|---|---|
  | category styles — neutral | CATEGORIES carry slug + label only: no icon field, no emoji | 각 원소 키 = `['label','slug']`, `constants.ts` 소스에 이모지 0 |
  | 〃 | every slug … gets the same neutral style | 21개 slug `deepEqual(NEUTRAL)`, `CATEGORY_COLORS` 값의 서로 다른 클래스 수 = 4 |
  | 〃 | constants.ts and utils.ts hold no hue classes, deleted tokens or animation classes | 두 소스에 Tailwind 색 이름 클래스(`(bg\|text\|border…)-(red\|…\|gray\|white\|black)(-NNN)?`), `accent-(blue\|red\|green)`, `animate-` 0건 |
  | tailwind.config.ts | palette = UNSLOP-AUDIT §3 … | 항목 1의 값 전부 |
  | 〃 | type scale: … nothing at 700+ | 항목 6 |
  | 〃 | font families: … | 항목 5 |
  | 〃 | radius: tag 6 / control 8 / card 12 / panel 16 | 항목 7 (별칭 `badge === tag`, `pill === control`, 키 6개) |
  | 〃 | motion: one easing, three durations, named properties, one entrance | 항목 9의 다섯 스케일 `deepEqual` |
  | 〃 | depth: the only shadow is shadow-float | 항목 8 |
  | globals.css source | no @import, gradient, glow, keyframes, catch-all transition or hard-coded hex | 소스에 `@import`, `gradient`, `box-shadow`, `@keyframes`, `animation:`, `transition-all`, hex, `uppercase\|tracking-\|italic`, 반 단계·임의 값 0건 |
  | 〃 | dead and decorative classes are gone | 항목 8·11의 삭제 클래스 9개 |
  | generated CSS | the neutral category classes and every contract class exist | 아래 `CONTRACT_CLASSES` 전부 생성 |
  | 〃 | deleted tokens, 700+ weights, catch-all transitions, shadows and looping animations generate nothing | 아래 `REMOVED_CLASSES` 전부 미생성, `@keyframes`는 `fade-in`·`spin`뿐 |
  | 〃 | .text-overline: 12px/16px, weight 500, letter-spacing 0 | |
  | 〃 | .dateline = mono + tabular figures + meta size + muted color | `font-family`가 `IBM Plex Mono`로 시작, 0.75rem/1rem/400, `--tw-numeric-spacing: tabular-nums`, 색 `rgb(138 132 122 …` |
  | 〃 | .img-standin prints stand-in photos in greyscale | `filter` 값 일치 |
  | 〃 | one focus ring: 2px accent outline, 2px offset | |
  | 〃 | transitions use the one easing at 150ms; nav hover stays neutral | `.transition-colors`, `.duration-400`, `.nav-link:hover` 색 = `text`, `.nav-link-active` 색 = `accent`, `.animate-fade-in` |
  | 〃 | prefers-reduced-motion still stops animations and transitions | |

  ```ts
  const CONTRACT_CLASSES =
    'dateline img-standin nav-link nav-link-active font-serif font-mono text-meta text-overline rounded-tag rounded-control rounded-card rounded-panel ' +
    'shadow-float animate-fade-in bg-surface-deep text-accent-ink bg-live text-live text-positive text-negative transition-colors duration-200 duration-400';
  const REMOVED_CLASSES =
    'text-accent-red bg-accent-blue text-accent-green bg-primary bg-dark bg-light font-bold font-extrabold font-black transition-all duration-300 duration-500 ' +
    'ease-in ease-out ease-in-out shadow-card shadow-elevated shadow-dropdown shadow-lg animate-pulse animate-ping animate-bounce animate-pulse-dot ' +
    'animate-bookmark-pop animate-slide-up animate-toast-in shimmer text-gradient-amber border-glow';
  ```

  `tests/utils.test.ts`
  | describe | test |
  |---|---|
  | formatWireTime(t, NOW) — wire time, KST | same KST date → HH:mm (`14:02`, `12:00`, UTC 날짜는 다르고 KST 날짜는 같은 `00:00`, `23:59`) |
  | 〃 | another KST date → MM.DD HH:mm (`10.04 23:59`, 내일 `10.06 00:00`, `01.09 09:05`, **월·일은 같고 연도만 다른 경우 `10.05 14:02`**) |
  | 〃 | zero-padded, 24-hour, fixed shape (`/^(\d{2}\.\d{2} )?\d{2}:\d{2}$/`) |
  | 〃 | invalid input → empty string (기존 `INVALID_DATES` 9개) |
  | 〃 | now accepts a Date or a number; invalid or missing now → current time |
  | formatCount | thousands separators (0, 7, 999, 1000, 164917, 1234567, MAX_SAFE_INTEGER) |
  | 〃 | fractions are truncated; negatives keep the sign |
  | 〃 | invalid input → "0" (NaN, ±Infinity, null, undefined, `'164917'`, `''`, `{}`, `[]`, `true`, `1e21`) |
  | 〃 | same output in every process time zone / locale |
  | date output does not depend on the process time zone (기존) | 기존 `snapshot()`에 `formatWireTime(d, NOW)` 결과를 이어 붙인다 → 4개 TZ에서 동일 |

- **테스트를 쓸 때 반드시 지킬 것** (프로토타입에서 실제로 걸린 것)
  1. **`@layer components`의 클래스는 쓰이지 않으면 CSS에서 빠진다.** `.dateline`, `.img-standin`, `rounded-tag` 등은 S3·S4가 쓰기 전까지 `src`에 없다. `compileGlobals()`의 `content`에 raw 항목을 더한다: `{ raw: '<i class="…CONTRACT_CLASSES… …REMOVED_CLASSES…"></i>', extension: 'html' }`.
  2. **`tsconfig.json`은 `**/*.ts`를 포함하고 `target`이 없다(ES5).** 테스트도 `tsc`에 걸린다. 정규식 리터럴의 `u` 플래그(`/\p{…}/u`)는 TS1501, `[...new Set()]`은 TS2802로 실패한다 → `new RegExp('\\p{Extended_Pictographic}', 'u')`, `Array.from(new Set(…))`을 쓴다.
  3. 같은 이유로 **`qa-out/` 아래에 `.ts` 파일을 남기지 않는다**(실험 파일은 `.mts`/`.mjs`/`.cjs`). 남기면 `npx tsc --noEmit`과 `next build`의 타입 검사가 그 파일까지 본다.
  4. `theme.fontWeight` 등 닫힌 스케일은 `config.theme`에서, 나머지는 `config.theme.extend`에서 읽는다.
- **기대 결과**: `npm test` — 실패 0. 프로토타입 기준 **232개**(209 + 23), 23 suites. 구성이 조금 달라도 되지만 위 표의 단언은 모두 있어야 한다.
- **검증**
  ```bash
  npm test 2>&1 | tail -8          # fail 0, tests ≥ 230
  npx tsc --noEmit; echo $?        # 0
  ```

---

## 빌드 유지 — S1이 수정해야 하는 타 슬라이스 줄

삭제·변경하는 export와 필드를 `src`, `tests`, `scripts` 전체에서 조사했다.

| 삭제·변경 | 참조하는 타 슬라이스 파일 | S1의 조치 |
|---|---|---|
| `CATEGORIES[].icon` | **`src/components/Footer.tsx:178`** `{cat.icon}` | **그 한 줄 삭제** (항목 4) |
| `CATEGORIES` (slug, label) | `Footer.tsx:6,14,172`, `category/[slug]/page.tsx:5,55`, `search/page.tsx:7,183`, `routing.ts:24`, `translation-text.ts:11,52` | 없음 (`slug`·`label`만 사용) |
| `getCategoryStyle` (모양 유지) | `ArticleHeroImage.tsx:31`, `NewsCard.tsx:12`, `NewsCardLarge.tsx:12`, `app/page.tsx:128`, `article/[id]/page.tsx:112` | 없음 |
| `CATEGORY_COLORS` (키 유지) | 테스트만 | 테스트 갱신 |
| `PRIORITY_STYLES`, `AI_BADGE_STYLE`, `countryColor` | 없음 | 삭제만 |
| `estimateReadingTime` | `NewsCard.tsx:4,14`, `NewsCardLarge.tsx:4,14` | **삭제하지 않는다** (S3가 사용을 지운 뒤 죽은 export로 남음 → "계약에서 발견한 문제" 5번) |
| Tailwind 토큰·클래스(색, 그림자, 굵기, 모션, `.shimmer` 등) | S2~S4 다수 | 없음 — JSX의 모르는 클래스는 Tailwind가 무시한다. `@apply`는 `globals.css`에서만 쓰이고 그 파일은 S1이 고친다 |

**결론: S1이 타 슬라이스 파일에서 고칠 줄은 `src/components/Footer.tsx:178` 한 줄뿐이다.**
확인: 격리 복사본에 프로토타입을 적용해 `npx tsc --noEmit` 0 오류, `next build` 성공(17개 정적 페이지 생성, `qa-out/planner-s1-build.log`), `npm test` 232/232.

---

## S2~S4 인계 (S1 적용 뒤 달라지는 것)

1. **[S2 필수] Pretendard `<link>`.** S1이 `globals.css`의 `@import`를 지운다. `layout.tsx`가 Google Fonts 두 개와 **같은 비차단 방식으로** 아래 스타일시트도 걸어야 한다. 빠지면 Pretendard가 영영 로드되지 않는다.
   `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css` (전송 12.8KB, `@font-face` 92개, 전부 `font-display: swap`, 굵기 45~920)
2. **[S2] `layout.tsx:10` `themeColor: '#0d1117'`** → `#161513`. (`scripts/generate-favicon.py`의 빨강·파랑 파비콘은 로고 재작업과 함께 판단.)
3. **CSS가 더는 생성되지 않는 클래스** — 빌드는 통과하지만 클래스 이름이 죽은 채 남는다. 각 슬라이스가 지우거나 바꾼다. 파일별 개수는 `bash qa-out/planner-s1-handoff.sh`.

   | 클래스 | 남은 곳 | S1 뒤의 모습 | 바꿀 것 |
   |---|---|---|---|
   | `*-accent-blue/red/green` | 62 | 색 없음(상속) | `live`·`positive`·`negative`·중립 |
   | `shadow-card/elevated/dropdown` | 20 | 그림자 없음 | 삭제. `Header.tsx:526`만 `shadow-float` |
   | `font-bold/extrabold` | 29 | 크기 토큰 굵기 또는 400 | 삭제 또는 `font-medium`/`font-semibold` |
   | `transition-all` | 8 | 전환 없음 | `transition-colors` 등 이름 있는 전환 |
   | `duration-300/500`, `ease-in-out` | 12 | 150ms · 단일 easing | 삭제 또는 `duration-200`/`duration-400` |
   | `animate-pulse-dot`, `animate-bookmark-pop` | 5 | 정지 | 삭제 |
   | `shimmer` | 10 (`PageSkeleton.tsx`) | 정지한 면 | 삭제 |
   | `rounded-badge` / `rounded-pill` | 27 | 6px / 8px (별칭) | `rounded-tag` / `rounded-control` |
   | `animate-fade-in` | 7 | fade + 8px 오름 400ms | 페이지당 하나만 남긴다 (`app/page.tsx`에 4개) |
   | `text-border` | 2 (`Footer.tsx:110,114`) | 글자색 10% — 거의 안 보임 | `text-text-muted` 또는 테두리로 |
4. **대비 사용 규칙 3개** (실측 2 아래).
5. **`font-mono`에는 숫자·구두점만.** IBM Plex Mono에는 한글이 없어 `건` 같은 단위가 섞이면 시스템 글꼴로 떨어진다. 단위는 mono 밖(sans)에 둔다.
6. **`formatWireTime`을 클라이언트 컴포넌트**(`NewsCard.tsx`, `NewsCardLarge.tsx`는 `'use client'`)에서 쓸 때는 `timeAgo`와 같이 글자의 바로 위 요소에 `suppressHydrationWarning`. KST 자정을 사이에 두고 서버 렌더와 하이드레이션이 갈리면 `23:40` ↔ `10.04 23:40`으로 달라질 수 있다.
7. **포커스.** 전역 링이 생겼다. `outline-none` + `focus:ring-*`(28곳)를 지우면 그 링 하나로 통일된다.
8. `.dateline`, `.img-standin`, `rounded-tag/control/panel`, `shadow-float`, `bg-surface-deep`, `text-accent-ink`, `text-live`, `text-positive/negative`, `text-meta`, `font-serif`, `font-mono`, `duration-400`은 S1 직후부터 쓸 수 있다.

---

## 계약(UNSLOP-AUDIT.md)에서 발견한 문제

값·이름은 바꾸지 않았다. 판단이 필요한 것만 적는다.

1. **`text-muted` #8a847a가 `surface-elevated` 위에서 4.17:1** (4.5 미달). 사용 규칙 1로 피할 수 있다. 값을 고친다면 #918b81이 4.58 / 5.13 / 5.40(elevated / card / surface).
2. **`live`·`negative` #e5484d가 `surface-card` 위에서 4.43:1, `surface-elevated` 위에서 3.95:1.** 관리자 표(카드 위 실패 글자)와 카드 안 "속보" 글자 라벨이 해당된다. 사용 규칙 2로 피할 수 있다. 값을 고친다면 #ea5d61이 4.60 / 5.15 / 5.42. 또 `live` 면 위의 흰 글자는 3.91:1이라 쓸 수 없다(`accent-ink`는 4.66).
3. **Pretendard 로딩이 계약에 없다.** 3절은 Google Fonts 두 개만 "렌더를 막지 않는 방식"으로 정했고 6절 S2에도 Pretendard가 없다. 지금의 `@import`는 렌더를 막는다(실측 1). S1은 `@import`를 지우도록 설계했으므로 **S2 설계서에 인계 1번이 들어가야 한다.** 들어가지 않으면 S1에서 `@import`를 유지하는 쪽으로 되돌려야 한다(항목 5의 삭제 한 줄만 빼면 된다. 테스트의 `/@import/` 단언도 함께).
4. **계약이 운명을 정하지 않은 기존 이름들.** S1의 결정: `rounded-badge`/`rounded-pill`은 별칭으로 유지(6px/8px), `shadow-card/elevated/dropdown`·`pulse-dot`·`bookmark-pop`·`slide-up`·`toast-in`·`.shimmer`는 삭제, `.nav-link`/`.nav-link-active`는 유지. 별칭 2개와 `.nav-link*`는 S2~S4가 쓰지 않게 되면 통합 단계에서 지울 수 있다.
5. **`estimateReadingTime`(`utils.ts:516`)** 은 S3가 "N분 읽기"를 지우면 죽은 export가 된다. S1에서 지우려면 S3 파일 4줄 이상을 고쳐야 해서(계약 6절 "한 줄만") 남겼다. 통합 단계에서 삭제 대상.
6. **닫힌 스케일은 계약 문구보다 한 걸음 더 나간 것이다.** `fontWeight`, `boxShadow`, `transitionTimingFunction`, `transitionDuration`, `transitionProperty`, `animation`, `keyframes`를 닫아서 금지 항목(700+, 그림자, `transition-all`, 여러 easing, 반복 애니메이션)이 클래스를 써도 생성되지 않게 했다. 사라졌을 때의 모습이 계약이 원하는 상태인 것만 닫았고, 사라지면 화면이 깨지는 것(기본 색 팔레트, 간격 반 단계, 모서리 별칭)은 닫지 않았다. 원하지 않으면 해당 키를 `extend` 안으로 옮기면 된다.
7. **`formatWireTime`은 연도를 표시하지 않는다.** 계약대로 두 형식뿐이라, 1년 이상 지난 기사(검색·카테고리 깊은 페이지)에서는 `10.05 14:02`가 어느 해인지 알 수 없다. 기사 상세 머리처럼 연도가 필요한 곳은 기존 `formatDate`(`2026.10.05 14:02`)를 쓰는 것이 안전하다.
8. **검증 환경.** `next build`를 저장소 루트에서 돌리면 :4000 서버가 쓰는 `.next`를 덮어쓴다. 빌드 검증은 오케스트레이터의 지침을 따르거나 격리 복사본에서 한다(아래 일괄 검증 4번).

---

## 하지 않는 것

- 타 슬라이스 파일의 디자인 변경(`Footer.tsx:178` 한 줄 삭제 외).
- 새 토큰 이름·새 유틸 클래스·새 export(계약에 적힌 것 외). `NEUTRAL_CATEGORY_STYLE`은 모듈 내부 상수.
- 새 `@font-face`, 글꼴 파일 번들, 빌드 시점 다운로드.
- 그레인·글래스·네온 등 대체 장식. `.img-standin`에 색 레이어·애니메이션 추가.
- 날짜 헬퍼(`toKstParts` 등), 이미지 유틸, 페이지네이션 유틸의 동작 변경.
- DB·API·워커(S5) 변경.

---

## Evaluator 일괄 검증

```bash
cd /home/user/hydro

# 1. 단위 테스트 · 타입
npm test 2>&1 | tail -8                    # fail 0, tests ≥ 230 (프로토타입 232)
npx tsc --noEmit; echo "tsc=$?"            # tsc=0

# 2. S1 파일에 남으면 안 되는 것 (모두 0)
grep -cE "@import|gradient|box-shadow|@keyframes|animation:|transition-all|uppercase|tracking-|italic|#[0-9a-fA-F]{3,8}\b" src/app/globals.css
grep -cE "icon|PRIORITY_STYLES|AI_BADGE_STYLE|animate-|accent-(blue|red|green)" src/lib/constants.ts
grep -cE "countryColor|gray-500|toLocale" src/lib/utils.ts
grep -cE "primary|9999|'(7|8|9)00'|pulse|pop|ease-(in|out)|0\.05em" tailwind.config.ts

# 3. 수정 범위: S1 4개 파일 + 테스트 2개 + Footer 1줄
git status --short                          # tailwind.config.ts, src/app/globals.css, src/lib/constants.ts, src/lib/utils.ts,
                                            # src/components/Footer.tsx, tests/design-tokens.test.ts, tests/utils.test.ts (+ SELF_CHECK-S1.md)
git diff --stat -- src/components/Footer.tsx   # 1 deletion(-)

# 4. 빌드 (실행 중인 :4000의 .next를 건드리지 않게 격리 복사본에서)
SB=$(mktemp -d) && cp -r src tests prisma public package.json tsconfig.json next.config.js postcss.config.js next-env.d.ts tailwind.config.ts "$SB"/ \
  && ln -s "$PWD/node_modules" "$SB/node_modules" && (cd "$SB" && NEXT_TELEMETRY_DISABLED=1 npx next build 2>&1 | grep -E "Compiled|Generating static pages \(17|error|Error"); rm -rf "$SB"
# → "✓ Compiled successfully", "✓ Generating static pages (17/17)", error 없음

# 5. 생성 CSS와 화면 (실행 중인 앱의 마크업 + S1 CSS. 마크업은 수정 전 것이라 이모지·옛 클래스가 보이는 것은 정상)
npx tailwindcss -i src/app/globals.css -o qa-out/eval-s1.css --minify
head -c 40 qa-out/eval-s1.css               # '@import'로 시작하지 않음
CSS=qa-out/eval-s1.css OUT=eval-s1 node qa-out/planner-s1-preview.cjs    # qa-out/eval-s1-home-0.jpg 등
# 볼 것: 배경이 푸른 기 없는 따뜻한 검정, 색은 사진과 주황 활성 탭뿐, 카테고리 라벨 무채색, 제목 굵기 600 이하.
# 비교: qa-out/unslop/before/prod/d-home-0.jpg (수정 전), qa-out/planner-s1-preview-home-0.jpg (프로토타입)

# 6. 대비 표 재계산
node qa-out/planner-s1-contrast.mjs
```

회귀 확인 포인트: `getCategoryStyle`·`CATEGORY_COLORS`·`CATEGORIES` 사용처가 수정 없이 빌드되는가 / 날짜·이미지·페이지네이션 테스트 186개가 그대로 통과하는가 / `.scrollbar-hide`·`.safe-area-bottom`·`.nav-link`가 생성 CSS에 남아 있는가 / reduced-motion 블록이 남아 있는가.
