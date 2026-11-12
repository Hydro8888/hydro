# 자체 점검 — 슬라이스 S1 (Unslop 재작업 라운드)

기준 문서: `SPEC-S1.md`, `UNSLOP-AUDIT.md` 3절·6절·7절(7절 우선), `.claude/skills/unslop`(unslop by Damir Sokolovsky [@heydamir](https://x.com/heydamir), CC BY 4.0).
이번 라운드 규칙에 따라 generator.md의 "대신 시도할 것"(비대칭·스크롤 효과·새 서체 등)은 적용하지 않았다. 새 장식·새 기능 없음.

## SPEC 개선 항목 체크

- [x] 항목 1 (색 램프·강조색 하나): `extend.colors` 키 7개(`accent, border, live, negative, positive, surface, text`). `surface` deep/DEFAULT/card/elevated = `#12110f/#161513/#1c1a18/#262421`, `text` = `#efe9de/#aaa398/`**`#918b81`**(7절-1), `accent` = `#f0883e` + `ink #161513`, `live`·`negative` = **`#ea5d61`**(7절-2), `positive #4cc38a`, 테두리 `rgba(239,233,222,0.10)` / `0.06`. 기본 팔레트·간격 스케일은 닫지 않음.
- [x] 항목 2 (삭제 토큰·죽은 상수): `primary`, `dark`, `light`, `accent.blue/red/green`, `PRIORITY_STYLES`, `AI_BADGE_STYLE`, `countryColor` 삭제.
- [x] 항목 3 (카테고리 중립화): `CATEGORY_COLORS` 16개 slug가 모두 같은 동결 객체(`border-l-border / text-text-secondary / bg-surface-elevated / border-border`). `getCategoryStyle(_slug)`는 이름·시그니처 유지, 항상 같은 값.
- [x] 항목 4 (이모지 제거): `CATEGORIES`는 `{ slug, label }`만. `Footer.tsx`의 `{cat.icon}` 한 줄 삭제(1 deletion).
- [x] 항목 5 (서체 패밀리): `font-serif`(Noto Serif KR …), `font-mono` = `IBM Plex Mono, Pretendard Variable, Pretendard, ui-monospace, SFMono-Regular, Menlo, monospace`(7절-3: 한글 단위는 Pretendard로). `globals.css`의 Pretendard `@import` 삭제(7절-8). `@font-face` 추가 없음.
- [x] 항목 6 (타입 스케일·굵기): 크기 토큰 9개, `headline-xl`만 600, **`headline-lg` 500**(7절-5), `caption` 400, `overline` 12px/500/자간 0, `meta` 신규. `theme.fontWeight`를 400/500/600으로 닫음.
- [x] 항목 7 (모서리): `tag 6 / control 8 / card 12 / panel 16`, 별칭 `badge = tag`, `pill = control`(7절-14, 주석에 사용 중단 표시).
- [x] 항목 8 (깊이): `theme.boxShadow` = `none`, `float`뿐. `.text-gradient-amber`, `.border-glow`, `.shimmer`(+`::after`, `@keyframes shimmer-slide`) 삭제(7절-18).
- [x] 항목 9 (모션): easing 하나(`cubic-bezier(0.22, 1, 0.36, 1)`) + `linear`, 지속 150/200/400ms, 이름 있는 `transitionProperty` 5개, keyframes `spin`·`fade-in`뿐. `animate-fade-in`은 정의만 남김(fade + 8px, 400ms, `backwards`) — 7절-9에 따라 S1 파일에서는 쓰지 않음. `@keyframes slogan`, `.breaking-ticker`(+`@keyframes ticker`) 삭제. reduced-motion 블록 유지.
- [x] 항목 10 (포커스 링): base 레이어 `:focus-visible { outline: 2px solid accent; outline-offset: 2px }`.
- [x] 항목 11 (`globals.css` 정리): 죽은 클래스 7개 삭제, 스크롤바 hex → `theme()` 토큰, `.nav-link` hover는 `text`(중립), `.nav-link-active`만 accent. 170줄 → 109줄(설명 주석 포함).
- [x] 항목 12 (시그니처): `formatWireTime(input, now?)` + `.dateline`. 7절-4대로 세 가지 형식 — 같은 KST 날짜 `HH:mm` / 같은 해 `MM.DD HH:mm` / 다른 해 `YYYY.MM.DD`. ICU 미사용, JSDoc에 `<time dateTime suppressHydrationWarning>` 규칙 명시.
- [x] 항목 13 (`formatCount`): 천 단위 쉼표, 소수 버림, 부호 유지, 무효 입력 `'0'`.
- [x] 항목 14 (`.img-standin`): `filter: grayscale(1) contrast(1.05) brightness(0.9)`. hover·애니메이션·레이어 없음.
- [x] 항목 15 (플레이스홀더 SVG): `fill="#262421"`, `stroke="#efe9de" stroke-opacity="0.1"`.
- [x] 항목 16 (간격 규칙): S1 파일에 반 단계·임의 값 0건. 간격 스케일은 닫지 않음.
- [x] 항목 17 (테스트): `design-tokens.test.ts` 갱신 7 + 신규, `utils.test.ts` 신규 2 describe. `npm test` 241/241.
- [x] 7절-7·15 (`src/lib/ui.ts`, SPEC에는 없고 7절이 S1에 배정): SPEC-S4 항목 0의 정의 그대로 22개 export. `PageHeading`/`EmptyState`/`icons.tsx`는 만들지 않음.

## 수정 파일 목록

- `tailwind.config.ts`: 전면 갱신(색, 닫힌 스케일 6종, 서체, 크기, 모서리).
- `src/app/globals.css`: `@import`·죽은 클래스·그라데이션·글로우·shimmer·keyframes 삭제, 포커스 링, 스크롤바 토큰화, `.dateline`, `.img-standin`.
- `src/lib/constants.ts`: `CATEGORIES` 이모지 필드 삭제, `CATEGORY_COLORS` 중립화, 플레이스홀더 색, 죽은 상수 2개 삭제.
- `src/lib/utils.ts`: `formatWireTime`, `formatCount` 추가, `getCategoryStyle` 중립화, `countryColor` 삭제.
- `src/lib/ui.ts` (신규): 컨트롤·칩·태그·표 클래스 상수.
- `src/components/Footer.tsx`: `{cat.icon}` 한 줄 삭제(빌드 유지용, 그 밖은 손대지 않음).
- `tests/design-tokens.test.ts`: 갱신 + 신규(팔레트, 타입 스케일, 서체, 모서리, 모션, 깊이, 대비, `ui.ts`, 생성 CSS).
- `tests/utils.test.ts`: `formatWireTime` 6개, `formatCount` 4개, TZ 스냅샷에 `formatWireTime` 추가.

검증용 스크립트(git 무시 폴더): `qa-out/gen-s1-contrast.mts`, `qa-out/gen-s1-shots.cjs`, `qa-out/gen-s1-probe2.cjs`. 로그: `qa-out/gen-s1-test.log`, `qa-out/gen-s1-restart.log`. 화면: `qa-out/gen-s1-home-0.jpg`, `qa-out/gen-s1-home-footer.jpg`.

## 검증 결과

| 검사 | 결과 |
|---|---|
| `npx tsc --noEmit` | 종료 코드 0 |
| `npm test` | 241 통과 / 실패 0 (24 suites). 이전 209 + 32 |
| `tests/utils.test.ts` 전체, TZ=UTC / Asia/Seoul / America/Los_Angeles | 각각 56/56 통과 |
| `formatWireTime`·`formatCount`·TZ 독립성만 골라, 세 TZ | 각각 12/12 통과 |
| `bash scripts/qa/local-env.sh restart` | `APP UP (2s, css 200)`, `✓ Compiled successfully`, 정적 페이지 17/17 |
| SPEC "Evaluator 일괄 검증" 2번의 grep 4줄 | 모두 0 |
| 옛 hex 11종 grep(S1 파일 + `ui.ts`) | 0줄 |
| `git diff --stat -- src/components/Footer.tsx` | 1 deletion |

라우트 상태코드(재빌드 전 → 후, `http://127.0.0.1:4000/livenews` 기준): `/` 308 → 308(끝 슬래시 리다이렉트, `/livenews`는 200 → 200), `/breaking` 200 → 200, `/article/1` 200 → 200, `/category/economy` 200 → 200, `/search?q=AI` 200 → 200, `/ranking` 200 → 200, `/admin`(admin/livenews2026) 200 → 200, `/admin`(인증 없음) 401 → 401, `/nope` 404 → 404.

빌드된 CSS(`.next/static/css/a0795ad5b6cf732e.css`, 31,634바이트):
- 있음: `22 21 19`(surface) 6, `145 139 129`(text-muted) 6, `234 93 97`(live/negative) 1, 헤어라인 `hsla(39,35%,90%,.1)`(= `rgba(239,233,222,0.10)`의 압축 표기) 5, `cubic-bezier(.22,1,.36,1)` 8, `IBM Plex Mono,Pretendard Variable` 3, `:focus-visible{outline:2px solid #f0883e;outline-offset:2px}` 1, `ui.ts` 클래스(`.h-10`, `.rounded-control`, `.bg-text`, `.text-accent-ink`, `.bg-positive`, `.bg-negative`, `.rounded-tag`).
- 없음(0건): `@import`, `#0d1117`, `#58a6ff`, 옛 muted `138 132 122`, 옛 live `229 72 77`, `accent-blue/red/green`, `bg-clip-text`(그라데이션 글자), `glow`, `shimmer`, `pulse`, `font-weight:700/800/900`, `transition-property:all`, `.shadow-card/elevated/dropdown`, `.duration-300/500`, `.ease-in-out`.
- `@keyframes`는 `fade-in`, `spin` 둘뿐. `box-shadow`는 `none`과 Tailwind ring 변수 줄뿐.
- `.dateline`·`.img-standin`·`shadow-float` 등 아직 쓰이지 않는 계약 클래스는 raw content 테스트(`the neutral category classes and every contract class exist`)로 확인.

실행 중인 앱의 계산된 스타일(홈, 1440px): body 배경 `rgb(22, 21, 19)`, 글자 `rgb(239, 233, 222)`, 그림자 있는 요소 0개, 키보드 포커스 `solid 2px rgb(240, 136, 62)` / offset 2px, 렌더 차단 리소스는 자체 CSS 1개뿐, 제3자 요청은 `images.unsplash.com`(사진)뿐.

### 대비표 (실제 구현값으로 재계산 — `npx tsx qa-out/gen-s1-contrast.mts`, `tailwind.config.ts`에서 값을 읽음)

| 글자색 \ 면 | `surface-deep` #12110f | `surface` #161513 | `surface-card` #1c1a18 | `surface-elevated` #262421 |
|---|---|---|---|---|
| `text` #efe9de | 15.62 | 15.10 | 14.36 | 12.81 |
| `text-secondary` #aaa398 | 7.55 | 7.30 | 6.94 | 6.19 |
| `text-muted` #918b81 | 5.58 | 5.40 | 5.13 | 4.58 |
| `accent` #f0883e | 7.46 | 7.21 | 6.85 | 6.11 |
| `live` / `negative` #ea5d61 | 5.60 | 5.42 | 5.15 | 4.60 |
| `positive` #4cc38a | 8.52 | 8.24 | 7.83 | 6.99 |

모든 글자색이 모든 면에서 4.5:1 이상(최저 4.58). SPEC 실측 2의 "미달" 3칸이 없어져 SPEC의 사용 규칙 1·2는 더 필요하지 않다. 규칙 3(강조색·live 면 위 글자는 `accent-ink`)은 그대로다.

| 조합 | 대비 |
|---|---|
| `accent-ink` on `text` (주요 버튼 `BTN_PRIMARY`) | 15.10 |
| `accent-ink` on `text/90` over `surface` (버튼 hover) | 12.36 |
| `accent-ink` on `accent` | 7.21 |
| `accent-ink` on `live` | 5.42 |
| `accent-ink` on `positive` | 8.24 |
| 흰색 on `accent` / `text` on `accent` (금지 조합) | 2.53 / 2.09 |
| 흰색 on `live` / `text` on `live` (금지 조합) | 3.37 / 2.79 |
| `::selection`(`accent` 20% 위 `text`), 면 4단계 | 9.06 ~ 11.32 |
| 포커스 링 `accent` vs 면 4단계 (비글자 3:1) | 6.11 ~ 7.46 |
| 표 hover 행(`surface-elevated/50` over card = #211f1d) 위 `text-secondary` / `text` | 6.57 / 13.60 |

이 표의 4.5:1 조건(글자색 6종 × 면 4단계, `accent-ink` × 면 4종, 포커스 링 3:1)은 단위 테스트 `contrast (WCAG 2.x): …`로 고정했다.

## SPEC과 다르게 한 점

1. **색 값 2개** — `text-muted #918b81`, `live`/`negative` `#ea5d61` (7절-1·2). 테스트의 `.dateline` 색 단언도 `rgb(145 139 129`.
2. **`font-mono` 스택** — `IBM Plex Mono` 다음에 `Pretendard Variable`, `Pretendard` (7절-3). SPEC 인계 5번("mono에는 숫자·구두점만")은 더 필요하지 않다.
3. **`formatWireTime` 연도 규칙** — 다른 해는 `YYYY.MM.DD` (7절-4). SPEC 테스트 표의 "연도만 다른 경우 `10.05 14:02`"는 `2025.10.05`가 됐고, 테스트가 5개 → 6개라서 `--test-name-pattern="formatWireTime|process time zone"`은 8이 아니라 9 pass.
4. **`headline-lg` 500** (7절-5). 600은 `headline-xl`뿐이고 테스트로 고정.
5. **`src/lib/ui.ts` 신규** (7절-7·15) → `git status`는 SPEC이 적은 7개가 아니라 8개 파일. SPEC-S4 항목 0의 정의를 값까지 그대로 썼다. SPEC-S2 항목 4의 이름(`BTN_PRIMARY`, `BTN_SECONDARY`)은 S4와 같은 이름이라 별칭이 필요 없었다. **S2에 전할 것**: 값은 S4 쪽이다(`px-4`, `text-body-md`, `gap-2`, `disabled:cursor-not-allowed disabled:opacity-50`). S2 초안에 있던 `px-5`, `shrink-0`, `disabled:cursor-wait`는 들어 있지 않으므로 `SearchBar`처럼 줄어들면 안 되는 곳은 사용처에서 `shrink-0`을 덧붙이고, import 경로는 `@/lib/ui`, S2 정적 테스트의 파일 목록도 `src/lib/ui.ts`로 바꿔야 한다.
6. **테스트 수** — 프로토타입 232가 아니라 241. 추가분: 대비 1, `ui.ts` 5 + 생성 CSS 1, `.text-headline-lg` 1, `formatWireTime` 연도 1.
7. **주석** — 프로토타입은 `globals.css`·`tailwind.config.ts`의 설명 주석을 지웠지만, 줄바꿈 규칙 등 이유를 적은 주석은 남겼다(코드 동작 차이 없음).

## 디자인 자체 평가

- AI slop 패턴 사용 여부: S1 파일(`tailwind.config.ts`, `globals.css`, `constants.ts`, `utils.ts`, `ui.ts`)에는 없음 — 그라데이션, 그라데이션 글자, 글로우, 색 그림자, `backdrop-blur`, 카테고리별 색, 이모지, 700 이상 굵기, `uppercase`, `tracking-*`, `italic`, `transition-all`, 반복·튀는 애니메이션, 토큰 정의 밖 hex, 반 단계 간격 모두 0건(테스트로 고정).
- 독창적 요소: 새 장식은 넣지 않았다. 이 제품에만 맞는 것은 계약의 시그니처 두 가지 — 통신 시각(`formatWireTime` + `.dateline`, 고정폭 숫자)과 대체 사진 흑백 인쇄(`.img-standin`, 실제 보도 사진만 원색).
- 다크 모던 테마 일관성: 중립색은 따뜻한 한 램프(면 4단계 + 글자 3역할 + 글자색 10%/6% 헤어라인), 강조색은 주황 하나, 의미색 3개. 깊이는 면 단계와 헤어라인, 그림자는 `shadow-float` 하나.

## 회귀 위험 확인

- 기존 기능 영향: 없음. 라우트 9개 상태코드 동일, 기존 테스트 209개 중 갱신 대상 7개를 뺀 202개는 수정 없이 통과. `getCategoryStyle`·`CATEGORY_COLORS`·`CATEGORIES` 사용처는 수정 없이 빌드된다. `.scrollbar-hide`, `.safe-area-bottom`, `.nav-link`, reduced-motion 블록은 생성 CSS에 남아 있다.
- TypeScript 오류: 없음.
- S1 직후의 중간 상태(정상, 각 슬라이스가 정리):
  - 글꼴은 시스템 대체 글꼴 — S2가 `layout.tsx`에 Pretendard·Noto Serif KR·IBM Plex Mono `<link>`를 넣기 전까지.
  - 죽은 클래스가 소스에 남아 있다(`*-accent-blue/red/green` 62, `shadow-*` 20, `font-bold/extrabold` 29, `transition-all` 8, `shimmer` 10 등 — `bash qa-out/planner-s1-handoff.sh`). CSS는 생성되지 않는다.
  - 홈에서 본 남은 징후는 모두 타 슬라이스 파일: `Footer.tsx`의 `<strong>` 3개(브라우저 기본 700, SPEC-S2 항목 16이 삭제), 홈 섹션 2곳의 `animate-fade-in`(S4가 삭제, 7절-9), `NewsCardLarge`·`BreakingTicker`·`NewsletterBanner`의 그라데이션과 `TrendingKeywords`의 `text-amber-400`(S3).
  - `/api/img` 415 응답은 픽스처의 가짜 이미지 주소(`images.example-cdn.com`) 때문이며 이번 변경과 무관하다(대체 사진으로 넘어감).
- 참고: `.dateline`은 아직 쓰는 곳이 없는데도 운영 CSS에 들어간다(`utils.ts` 주석의 단어 "dateline"을 Tailwind가 읽음, 약 0.4KB). S3가 곧 쓰는 클래스라 그대로 뒀다.
