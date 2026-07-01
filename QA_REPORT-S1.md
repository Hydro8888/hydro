# QA 검수 보고서 — 슬라이스 S1 (디자인 시스템)

**검수 라운드**: R2
**검수 일시**: 2026-04-09
**검수 대상**: tailwind.config.ts, globals.css, constants.ts, utils.ts
**설계서**: SPEC-S1.md (10개 개선 항목)

---

## R1 피드백 반영 확인

R1(2026-04-03)에서 지적된 2가지 이슈의 반영 상태를 먼저 확인한다.

- [PASS] **R1 이슈 1: 레거시 색상 토큰 복원** — `tailwind.config.ts` line 13-15에 `primary`, `dark`, `light` 레거시 토큰이 모두 보존되어 있음. `src/app/admin/layout.tsx`는 `bg-dark` 대신 `bg-surface-card`로 전환 완료되어, 레거시 토큰 사용처 자체가 제거된 상태. 즉 레거시 토큰 보존 + 사용처 다크 토큰 전환 양쪽 모두 해결.
- [PASS] **R1 이슈 2: accent 색상 의미 변경 대응** — `src` 전체에서 `bg-accent`(뒤에 `-`가 붙지 않는 단독 사용) 검색 결과 0건. 속보 관련 파일들이 `bg-accent-red`로 전환된 것으로 확인. R1 피드백이 정확히 반영됨.

**R1 피드백 반영 시 기존 합격 항목 퇴보 여부**: 없음 — 10개 SPEC 항목 모두 여전히 정상.

---

## 1단계: SPEC 개선 항목 검증

- [PASS] **항목 1: Tailwind 다크 모던 색상 토큰 체계 구축**
  `tailwind.config.ts` lines 18-37. surface(3단계: #0d1117/#161b22/#21262d), text(3단계: #e6edf3/#8b949e/#484f58), accent(4색: #f0883e/#58a6ff/#f85149/#3fb950), border(2단계: #30363d/#21262d). SPEC과 정확히 일치. 레거시 토큰(primary/#1a73e8, dark/#1a1a2e, light/#f8f9fa) 하위 호환 유지.

- [PASS] **항목 2: 타이포그래피 스케일 정의**
  `tailwind.config.ts` lines 46-55. 8단계 스케일: headline-xl(2.5rem/800) ~ overline(0.6875rem/600/0.05em). 값이 SPEC과 동일. BreakingTicker.tsx에서 `text-overline`, `text-body-md` 실사용 확인.

- [PASS] **항목 3: 그림자 및 borderRadius 토큰 정의**
  `tailwind.config.ts` lines 56-65. boxShadow: card/elevated/dropdown (다크 최적화 높은 opacity). borderRadius: card(0.5rem)/badge(0.25rem)/pill(9999px). SPEC과 동일. NewsCard/NewsCardLarge에서 `rounded-card`, `hover:shadow-elevated` 실사용.

- [PASS] **항목 4: globals.css 다크 모던 테마 전면 전환**
  body: `bg-surface text-text antialiased` (line 7). `.news-card`: `border-b border-border hover:bg-surface-elevated transition-colors` (line 49). `.news-card-large`: `rounded-card border-border-muted bg-surface-card hover:shadow-elevated transition-all` (line 53). `.category-pill`: 좌측 바 스타일 `border-l-2 text-overline font-semibold tracking-wide uppercase` (line 57). `.nav-link`/`.tab-item`: 다크 토큰. `::selection` (line 11), 스크롤바 다크 스타일 (lines 19-31). 라이트 색상 잔재 확인: `bg-white`/`text-gray-900`/`border-gray-100`/`hover:bg-gray-50`/`text-gray-700` — globals.css 내 0건 확인.

- [PASS] **항목 5: 카테고리 컬러 맵 중앙 집중화**
  `constants.ts` lines 87-104. `CATEGORY_COLORS` 16개 카테고리 전부 정의 (politics~general). border-l/text/bg 반투명 다크 팔레트. src 전체에서 로컬 `categoryColors` 맵 검색 결과 0건 — 중복 완전 제거. NewsCard/NewsCardLarge에서 `getCategoryStyle()` 임포트 사용.

- [PASS] **항목 6: 국가 컬러 함수 다크 테마 전환**
  `utils.ts` lines 160-168. 반투명 배경(`bg-{color}-500/15`) + 밝은 텍스트(`text-{color}-400`) + border. 폴백: `bg-surface-elevated text-text-secondary`. SPEC과 동일. SourceBadge.tsx에서 `countryColor()` 호출 확인.

- [PASS] **항목 7: CSS 유틸리티 클래스 현대화**
  중복 `line-clamp` 제거 확인 (globals.css 내 0건). 추가된 유틸리티: `.text-gradient-amber` (line 83), `.border-glow` (line 87), `.surface-interactive` (line 91), `.scrollbar-none` (lines 94-99), `.safe-area-bottom` (lines 101-104). 글로벌 webkit 스크롤바 다크 스타일 base 레이어 정의 (lines 19-31).

- [PASS] **항목 8: utils.ts에 디자인 시스템 헬퍼 함수 추가**
  `getCategoryStyle()` (lines 207-209): CATEGORY_COLORS 기반 + 폴백. `cn()` (lines 212-214): falsy 필터링 후 join. `CATEGORY_COLORS` import (line 1). 실사용 7개+ 파일: NewsCard, NewsCardLarge, CategoryNav, page.tsx, article/[id]/page.tsx, category/[slug]/page.tsx, Header.

- [PASS] **항목 9: Tailwind config에 애니메이션 토큰 추가**
  keyframes: fade-in/slide-up/pulse-dot (lines 67-78). animation: fade-in(0.3s)/slide-up(0.4s)/pulse-dot(2s infinite) (lines 80-84). SPEC과 동일. BreakingTicker.tsx line 26에서 `animate-pulse-dot` 실사용.

- [PASS] **항목 10: constants.ts에 브레이킹 뉴스/AI 디자인 토큰 상수 추가**
  `PRIORITY_STYLES` (lines 107-111): breaking/urgent/normal의 badge+dot 스타일. `AI_BADGE_STYLE` (line 114): 블루 계열 배지. 둘 다 `as const` 타입 안전성.

**SPEC 구현율: 10/10 (100%)**

---

## 2단계: 회귀 검증

### 기존 exports 보존
- [PASS] `CATEGORIES` — 16개 항목, 구조 변경 없음
- [PASS] `COUNTRIES` — 5개 항목, 구조 변경 없음
- [PASS] `COUNTRY_SUBCATEGORIES` — 4개국 서브카테고리, 구조 변경 없음
- [PASS] `MAIN_MENU` — 13개 메뉴, 구조 변경 없음
- [PASS] `ITEMS_PER_PAGE` — 20 유지

### 기존 함수 시그니처 보존
- [PASS] `timeAgo(date: Date | string | null): string` — 변경 없음
- [PASS] `formatDate(date: Date | string | null): string` — 변경 없음
- [PASS] `truncate(text: string, maxLength: number): string` — 변경 없음
- [PASS] `countryLabel(code: string): string` — 변경 없음
- [PASS] `countryColor(code: string): string` — 시그니처 보존, 반환값 다크 전환(의도적)
- [PASS] `categoryLabel(slug: string): string` — 변경 없음
- [PASS] `buildSearchParams(...)` — 변경 없음
- [PASS] `getDefaultImage(...)` — 변경 없음
- [PASS] `isValidArticleImage(...)` — 변경 없음
- [PASS] `normalizeImageUrl(...)` — 변경 없음

### TypeScript 컴파일
- [PASS] `npx tsc --noEmit` — 오류 0건

### Breaking ticker 애니메이션
- [PASS] globals.css: `.breaking-ticker` + `@keyframes ticker` + hover pause 보존
- [PASS] BreakingTicker.tsx: styled-jsx로 동적 duration ticker + `animate-pulse-dot` 정상

### 임포트 경로 유효성
- [PASS] `utils.ts` → `constants.ts`: `import { CATEGORY_COLORS } from './constants'` 정상
- [PASS] 컴포넌트 → utils: `getCategoryStyle`, `cn`, `countryColor` 등 정상 참조 (7개+ 파일)
- [PASS] 컴포넌트 → constants: `CATEGORY_COLORS`, `CATEGORIES`, `COUNTRIES`, `MAIN_MENU` 정상 참조

### 기존 데이터 영향
- [PASS] DB/API 레이어 미변경 — 582개 기사 표시에 영향 없음

### R1 이슈 회귀 확인
- [PASS] `bg-dark` 사용처 없음 (admin layout 다크 토큰 전환 완료)
- [PASS] `bg-accent` 단독 사용 없음 (속보 관련 `bg-accent-red` 전환 완료)

---

## 3단계: 채점

### 디자인 품질: 8/10
일관된 다크 모던 팔레트가 체계적으로 구축됨. surface 3단계(#0d1117 → #161b22 → #21262d)로 z-depth를 색상으로 표현하는 elevation 시스템이 매끄러움. 앰버 악센트(#f0883e)가 차가운 네이비-블랙에 온기를 주는 선택이 적절. 카테고리 배지의 반투명 배경(`bg-{color}-500/10`) + border-left 방식이 다크 배경에서 잘 어우러짐. 텍스트 3단계(primary #e6edf3 → secondary #8b949e → muted #484f58)의 명도 차이가 정보 위계를 명확히 함. 감점: BreakingTicker.tsx line 27의 `bg-white`(속보 점 중앙 원)가 다크 팔레트와 어울리지 않으나, 빨간 원 위의 흰색 점이라는 의도적 대비로 볼 수 있어 경미한 이슈. 이는 S3 슬라이스 영역.

### 독창성: 8/10
Bloomberg Terminal 미학을 표방하면서 차별화 요소가 명확함. (1) 카테고리 배지 좌측 2px 바 인디케이터 — pill 대신 터미널 스타일 라벨로 독특함. (2) Surface elevation 시스템 — 단순 다크 모드가 아닌 3단계 깊이감. (3) `text-gradient-amber`, `border-glow` 유틸리티로 앰버 악센트의 활용 폭 확장. (4) `pulse-dot` 애니메이션으로 "라이브" 데이터 터미널 감각 연출. AI slop 패턴(보라-핑크 그라데이션, 네온, 흰색 카드+밝은 그림자) 완전 배제 확인. 기억에 남는 개성이 있음.

### 기술적 완성도: 9/10
(1) TypeScript 컴파일 오류 0건. (2) 모든 색상이 시맨틱 토큰으로 통일, 하드코딩 잔재 없음. (3) CATEGORY_COLORS 중앙 집중화로 중복 코드 완전 제거. (4) getCategoryStyle(), cn() 헬퍼가 7개+ 파일에서 실사용. (5) 레거시 토큰 하위 호환 유지. (6) `as const` 타입 안전성. (7) R1 피드백 완전 반영 — admin layout, 속보 페이지 모두 다크 토큰 전환. (8) Tailwind config 구조가 논리적으로 정리됨(색상 → 폰트 → 그림자 → 모서리 → 애니메이션).

### 기능성: 8/10
디자인 시스템 인프라(S1)이므로 직접적 기능 영향은 제한적이나: (1) `.nav-link` + `.nav-link-active`, `.tab-item` + `.tab-item-active` 클래스 쌍이 인터랙션 상태를 올바르게 지원. (2) `.news-card`의 hover:bg-surface-elevated transition-colors, `.news-card-large`의 hover:shadow-elevated transition-all로 마이크로 인터랙션 정의. (3) breaking-ticker hover pause 보존. (4) 스크롤바 커스텀 다크 스타일로 UX 디테일. (5) countryColor() 폴백 처리 정상. (6) cn() 유틸리티로 조건부 클래스 결합 간편화. 감점: `.surface-interactive`, `PRIORITY_STYLES`, `AI_BADGE_STYLE` 등 정의된 토큰 중 아직 실사용되지 않는 것이 있으나, S3-S4에서 활용 예정이므로 경미.

### 회귀 안전: 9/10
(1) 기존 10개 함수 시그니처 전부 보존. (2) 기존 5개 상수 구조 변경 없음(추가만). (3) TypeScript 컴파일 통과. (4) 레거시 색상 토큰 3개 보존. (5) breaking-ticker 애니메이션 정상. (6) 임포트 경로 전부 유효. (7) R1 이슈 2건 완전 해결 — admin layout bg-dark → bg-surface-card, 속보 bg-accent → bg-accent-red. (8) 582개 기사 데이터 미영향. 감점: countryColor() 반환값이 라이트→다크로 변경되었으나, 이는 프로젝트 목적(다크 테마 전환)에 부합하는 의도적 변경이고 함수 시그니처는 동일.

---

## 4단계: 가중 점수

| 항목 | 점수 | 비중 | 가중 |
|------|------|------|------|
| 디자인 품질 | 8/10 | 30% | 2.40 |
| 독창성 | 8/10 | 20% | 1.60 |
| 기술적 완성도 | 9/10 | 25% | 2.25 |
| 기능성 | 8/10 | 15% | 1.20 |
| 회귀 안전 | 9/10 | 10% | 0.90 |
| **합계** | | | **8.35** |

---

## 5단계: 최종 판정

**전체 판정**: 합격
**가중 점수**: 8.35 / 10.0

**항목별 점수**:
- 디자인 품질: 8/10 — 일관된 다크 모던 팔레트, 3단계 surface elevation, 앰버 악센트가 프리미엄 뉴스 플랫폼 느낌을 잘 살림
- 독창성: 8/10 — Bloomberg Terminal 미학 + 좌측 바 인디케이터/surface elevation/pulse-dot 등 차별화 요소 명확
- 기술적 완성도: 9/10 — TS 오류 0건, 중복 코드 완전 제거, 시맨틱 토큰 일관 적용, R1 피드백 완전 반영
- 기능성: 8/10 — 인터랙션 클래스 정의 완비, 헬퍼 함수 실사용 검증, ticker hover pause 유지
- 회귀 안전: 9/10 — 기존 exports/시그니처 전부 보존, 레거시 토큰 호환, TS 컴파일 통과, R1 이슈 해결

**방향 판단**: 현재 방향 유지

---

## 다음 슬라이스 참고 사항

1. **S3**: BreakingTicker.tsx line 27의 `bg-white`를 다크 호환 색상으로 교체 검토 (시각적 대비 의도라면 유지 가능)
2. **S2**: Header/Footer에서 surface elevation(bg-surface → bg-surface-card → bg-surface-elevated) 적극 활용 권장
3. **S2**: `.nav-link`, `.nav-link-active`, `.tab-item`, `.tab-item-active` 클래스를 레이아웃에 적용
4. **S3**: `PRIORITY_STYLES`, `AI_BADGE_STYLE` 상수를 콘텐츠 컴포넌트에서 실제 적용
5. **S3-S4**: `animate-fade-in`, `animate-slide-up` 등 애니메이션 토큰을 카드/페이지 진입에 활용
