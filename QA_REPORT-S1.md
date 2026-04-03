# QA Report — Slice S1 (Design System Tokens)

**검수 라운드**: R1
**검수 일시**: 2026-04-03

---

## 1단계: SPEC 개선 항목 검증

- [PASS] **항목 1**: `tailwind.config.ts`에 시맨틱 색상 토큰이 정확히 SPEC대로 추가됨. `surface` (DEFAULT/card/elevated), `text` (DEFAULT/secondary/muted), `accent` (DEFAULT/blue/red/green), `border` (DEFAULT/muted) — hex 값 모두 SPEC과 일치.
- [PASS] **항목 2**: `fontSize` 확장에 8단계 타이포그래피 스케일 추가됨. headline-xl(2.5rem/800) ~ overline(0.6875rem/600) 모두 SPEC과 일치. letterSpacing도 overline에 0.05em으로 정확.
- [PASS] **항목 3**: `boxShadow` 3단계(card/elevated/dropdown), `borderRadius` 3종(card/badge/pill) 모두 SPEC 값과 일치.
- [PASS] **항목 4**: `globals.css` 다크 테마 전환 완료. body `bg-surface text-text antialiased`, `::selection` 색상 추가, 스크롤바 다크 스타일 추가, `.news-card`/`.news-card-large`/`.category-pill`/`.nav-link`/`.tab-item` 등 모든 컴포넌트 클래스가 시맨틱 토큰으로 갱신됨. `.category-pill`은 SPEC대로 좌측 바 스타일(border-l-2 + text-overline)로 변경.
- [PASS] **항목 5**: `constants.ts`에 `CATEGORY_COLORS` 16개 카테고리 모두 추가됨. 각 항목에 border/text/bg 3속성. 반투명 배경(bg-xxx-500/10) 사용.
- [PASS] **항목 6**: `countryColor()` 함수가 반투명 배경 + 밝은 텍스트 + border로 전환됨. fallback도 `bg-surface-elevated text-text-secondary`로 다크 테마 호환.
- [PASS] **항목 7**: 중복 `line-clamp-1/2/3` 유틸리티 제거, `text-gradient-amber`/`border-glow`/`surface-interactive` 추가, 스크롤바 다크 스타일 base 레이어에 추가.
- [PASS] **항목 8**: `getCategoryStyle()` 헬퍼가 `CATEGORY_COLORS` 임포트 기반으로 구현됨. `cn()` 유틸리티도 추가됨. 시그니처 SPEC과 일치.
- [PASS] **항목 9**: `keyframes` (fade-in/slide-up/pulse-dot) + `animation` 토큰 모두 추가됨. 값은 SPEC과 일치.
- [PASS] **항목 10**: `PRIORITY_STYLES` (breaking/urgent/normal)과 `AI_BADGE_STYLE` 추가됨. `as const` 단언 적용.

**SPEC 항목 합격률: 10/10**

---

## 2단계: 회귀 검증

### 기존 exports 보존 확인
- [PASS] `CATEGORIES` — 구조 변경 없음, 16개 항목 그대로
- [PASS] `COUNTRIES` — 구조 변경 없음
- [PASS] `COUNTRY_SUBCATEGORIES` — 구조 변경 없음
- [PASS] `MAIN_MENU` — 구조 변경 없음
- [PASS] `ITEMS_PER_PAGE` — 20 유지

### 기존 함수 시그니처 보존 확인
- [PASS] `timeAgo(date: Date | string | null): string` — 변경 없음
- [PASS] `formatDate(date: Date | string | null): string` — 변경 없음
- [PASS] `truncate(text: string, maxLength: number): string` — 변경 없음
- [PASS] `countryLabel(code: string): string` — 변경 없음
- [PASS] `countryColor(code: string): string` — 시그니처 보존 (반환값 내용 변경은 의도적)
- [PASS] `categoryLabel(slug: string): string` — 변경 없음
- [PASS] `buildSearchParams(params: Record<string, string | number | undefined>): string` — 변경 없음
- [PASS] `getDefaultImage(category: string | null, articleId: number | string): string` — 변경 없음

### Breaking ticker 애니메이션
- [PASS] `.breaking-ticker` CSS 클래스와 `@keyframes ticker` 보존됨. hover 시 pause 동작도 유지.

### TypeScript 컴파일
- [PASS] `tsc --noEmit` 오류 없음

### 레거시 토큰 제거로 인한 회귀 문제
- [FAIL] **`dark` 색상 토큰 제거 → `bg-dark` 참조 깨짐**: `src/app/admin/layout.tsx:14`에서 `bg-dark`를 사용 중. 기존 `dark: '#1a1a2e'`가 제거되어 이 클래스가 더 이상 유효하지 않음. admin 레이아웃 헤더의 배경색이 사라짐.
- [WARN] **`accent` 색상 의미 변경**: 기존 `accent: '#e53935'`(빨강) → `accent.DEFAULT: '#f0883e'`(앰버). `src/app/breaking/page.tsx:50`, `src/app/page.tsx:81,137`에서 `bg-accent`를 속보 표시용(빨강 의도)으로 사용 중인데, 이제 앰버색으로 렌더링됨. 기능적으로 깨지지는 않지만 속보의 빨간 긴급감이 사라짐. 이 파일들은 S1 대상이 아니므로 당장 수정할 필요는 없으나, 후속 슬라이스에서 반드시 `accent-red`로 전환해야 함.
- [WARN] **`light`, `border` 기존 토큰 제거**: `light: '#f8f9fa'`와 `border: '#e5e7eb'` 토큰이 삭제됨. 현재 컴포넌트 검색상 직접 참조하는 곳은 없으나, `border` 토큰은 새 시맨틱 토큰(`border.DEFAULT: '#30363d'`)으로 대체되었으므로 `border-border` 클래스는 정상 작동. 다만 이전에 `border-border`가 `#e5e7eb`를 가리켰다면 색상이 변경된 것.

---

## 3단계: 채점

### 디자인 품질: 7/10
일관된 다크 모던 팔레트 구축. surface 3단계 elevation 체계, 시맨틱 색상 토큰, 다크 최적화 그림자 — Bloomberg/Reuters 감각의 기반이 잘 잡혔음. 다만 이번 슬라이스는 토큰/CSS 인프라 변경이므로 실제 렌더링된 페이지의 디자인 품질은 후속 슬라이스(컴포넌트 적용)에서 결정됨. 토큰 자체의 색상 선택은 적절.

### 독창성: 7/10
3단계 surface elevation, 카테고리 좌측 바 인디케이터(pill → border-l-2), 반투명 배경 배지 등 Bloomberg Terminal 미학을 잘 반영. `text-gradient-amber`, `border-glow` 등 차별화된 유틸리티도 준비됨. 일반적인 다크 테마를 넘어서는 개성이 있음.

### 기술적 완성도: 6/10
TypeScript 컴파일 성공, 토큰 구조 체계적, 기존 함수 시그니처 보존. 그러나 **레거시 토큰(`dark`, `accent`, `light`) 제거가 기존 컴포넌트와의 호환성을 깨뜨림**. 특히 `bg-dark`는 즉시 깨지는 문제. SPEC의 회귀 안전 체크리스트에 "Tailwind 기존 클래스가 쓰이는 다른 파일에서 깨지지 않도록" 명시되어 있으나, `dark` 토큰을 제거하면서 사용처를 확인하지 않음. `primary`는 유지했으면서 `dark`, `light`는 유지하지 않은 것은 비일관적.

### 기능성: 7/10
디자인 시스템 인프라 변경이므로 직접적인 기능 영향은 제한적. 카테고리 색상 중앙화, 국가 배지 다크 전환, cn()/getCategoryStyle() 헬퍼 등 후속 컴포넌트 작업의 효율을 높이는 준비가 잘 되어 있음.

### 회귀 안전: 5/10
대부분의 기존 exports/함수가 보존되었으나, **`dark` 색상 토큰 제거로 admin 레이아웃이 깨짐**. `accent` 색상 의미 변경(빨강→앰버)은 속보 페이지의 시각적 의도를 훼손. SPEC에서 "기존 Tailwind 클래스가 쓰이는 다른 파일에서 깨지지 않도록" 명시적으로 요구했으나 이를 위반.

---

## 4단계: 최종 판정

**항목별 점수**:
- 디자인 품질: 7/10 — 시맨틱 토큰 체계가 Bloomberg 미학 기반을 잘 구축
- 독창성: 7/10 — surface elevation + 좌측 바 인디케이터 등 차별화된 디자인 언어
- 기술적 완성도: 6/10 — 레거시 토큰 제거가 기존 컴포넌트 호환성을 깨뜨림
- 기능성: 7/10 — 디자인 시스템 헬퍼/상수가 후속 작업에 잘 활용될 구조
- 회귀 안전: 5/10 — `bg-dark` 참조 깨짐, `accent` 색상 의미 변경으로 속보 페이지 시각적 퇴보

**가중 점수**: (7×0.3) + (7×0.2) + (6×0.25) + (7×0.15) + (5×0.1) = 2.1 + 1.4 + 1.5 + 1.05 + 0.5 = **6.55 / 10.0**

**전체 판정**: 조건부 합격

---

## 구체적 개선 지시

1. **`tailwind.config.ts`: 레거시 색상 토큰 복원**
   - `primary`만 유지하고 `dark`, `light`를 제거한 것은 비일관적. SPEC의 회귀 안전 요구사항을 충족하려면, 삭제된 레거시 토큰을 `primary` 옆에 복원해야 함:
   ```
   // Legacy tokens (kept for backward compatibility)
   primary: '#1a73e8',
   dark: '#1a1a2e',
   light: '#f8f9fa',
   ```
   - `accent`과 `border`는 새 시맨틱 토큰으로 대체되었으므로 복원 불필요 (DEFAULT가 기존 용법을 커버).

2. **`tailwind.config.ts`: `accent.DEFAULT` 색상 재검토 또는 `accent.red` 활용 안내**
   - 기존 `accent: '#e53935'`(빨강)가 `accent.DEFAULT: '#f0883e'`(앰버)로 변경됨. `src/app/breaking/page.tsx`와 `src/app/page.tsx`에서 `bg-accent`를 속보 표시용(빨강 의도)으로 사용 중. 후속 슬라이스에서 이 파일들을 수정할 때 `bg-accent-red`로 전환해야 함을 SPEC 또는 주석으로 명시할 것.

**방향 판단**: 현재 방향 유지 — 토큰 체계의 설계 자체는 우수. 레거시 호환성 한 가지만 수정하면 합격 가능.
