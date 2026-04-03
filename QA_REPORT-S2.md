# QA Report — Slice S2: Layout & Navigation

**검수 일시**: 2026-04-03
**검수 대상**: Header.tsx, Footer.tsx, layout.tsx, loading.tsx, error.tsx, not-found.tsx, useScrollDirection.ts, globals.css

---

## 1단계: SPEC 개선 항목 검증

- [PASS] **2-tier header**: Tier 1 = 로고 + LiveClock + 검색 토글 (h-12), Tier 2 = nav bar (hidden lg:block, h-10). 명확히 분리됨.
- [PASS] **Dark tokens 사용**: bg-surface/95, text-text, border-border 등 semantic 토큰 일관 사용. 하드코딩 색상값 없음.
- [PASS] **Mobile slide-down menu**: max-h transition (300ms ease-in-out), 카테고리 grid + 국가별 pill 섹션 포함. mobileOpen 토글 정상.
- [PASS] **Mobile bottom nav bar**: fixed bottom-0, 4개 아이콘 (홈/속보/검색/국가), 국가 flyout with scale transition. safe-area-bottom 적용.
- [PASS] **Hamburger animation**: 3-line to X morphing, rotate-45/-rotate-45 + opacity transition. 깔끔한 구현.
- [PASS] **SearchBar integration**: expandable search bar with max-h transition, 키보드 힌트 (/ key badge), desktop/mobile 별도 토글 버튼.
- [PASS] **Footer dark theme**: bg-surface-card, border-t border-border. 2-column layout (로고+설명 / 바로가기). AI 면책조항 포함.
- [PASS] **Footer uses MAIN_MENU**: QUICK_LINKS가 MAIN_MENU에서 파생됨. 데이터 중복 제거 완료.
- [PASS] **layout.tsx dark mode**: `<html lang="ko" className="dark">`, body에 bg-surface text-text. Suspense boundary with Loading fallback.
- [PASS] **loading.tsx**: dark skeleton loader — hero skeleton + section header skeleton + 4-column grid skeleton. animate-pulse 사용. 실제 홈 레이아웃과 매칭.
- [PASS] **error.tsx**: 'use client', dark theme, accent-red 아이콘, error.digest 표시, reset 버튼, animate-fade-in.
- [PASS] **not-found.tsx**: 대형 404 타이포그래피 (6rem), dark text-surface-elevated, 홈 링크 with arrow icon, animate-fade-in.
- [PASS] **useScrollDirection**: threshold 기반, requestAnimationFrame 최적화, passive scroll listener, 'up'|'down' 반환. Header에서 nav collapse에 사용.
- [PASS] **globals.css utilities**: scrollbar-none (WebKit + Firefox + IE), safe-area-bottom (env() 사용) 추가 완료.

**결과: 14/14 항목 PASS**

---

## 2단계: 세부 항목 검증 (엄격 모드)

### Header.tsx 세부 검토

**양호한 점:**
- useScrollDirection과 연동하여 스크롤 다운 시 nav bar가 -translate-y로 숨겨짐 (collapsed 변수). mobileOpen/searchOpen 상태에서는 숨기지 않음 — 올바른 UX 판단.
- countryRef로 외부 클릭 감지 후 country picker 닫기 구현됨.
- pathname 변경 시 모든 메뉴/검색/국가 상태 초기화됨.
- navScrollRef로 활성 nav item을 scrollIntoView하는 세부 터치 있음.
- NAV_ITEMS에서 search/ranking을 필터링하여 nav에서 제외. ranking은 ml-auto로 우측 배치, 세퍼레이터 포함.

**지적 사항:**

1. **[MINOR] Country flyout 접근성**: 모바일 bottom nav의 국가 버튼에 `aria-expanded` 속성이 없음. 스크린 리더 사용자가 flyout 상태를 알 수 없음.
   - 파일: `src/components/Header.tsx` line 339
   - 수정: `aria-expanded={countryOpen}` 추가

2. **[MINOR] Keyboard shortcut 미구현**: 검색 버튼에 `/` 키보드 단축키 힌트를 표시하지만, 실제 `/` 키 이벤트 리스너는 없음. 시각적으로 약속한 기능이 동작하지 않음.
   - 파일: `src/components/Header.tsx` line 138
   - 수정: useEffect로 `/` keydown 리스너 추가하여 searchOpen 토글

3. **[MINOR] CSS variable typing**: `style={{ '--nav-h': '40px' } as React.CSSProperties}` — CSSProperties 타입 단언은 작동하지만, CSS custom property를 별도 인터페이스로 확장하는 것이 더 깔끔함. 기능에는 문제없으므로 경미한 사항.

### Footer.tsx 세부 검토

**양호한 점:**
- MAIN_MENU에서 홈/랭킹 제외 후 9개 링크만 추출. 3-column grid 배치.
- pb-16 lg:pb-0 — 모바일 bottom nav 높이만큼 하단 패딩. 좋은 세부 처리.

**지적 사항:**

4. **[MINOR] Footer 2-column이 sm 이하에서 단일 컬럼**: sm 미만에서 flex-col이므로 모바일에서는 1-column. 이것은 의도적일 수 있으나, SPEC에서 "2-column layout"을 요구했으므로 모바일 대응이 적절한지 확인 필요. 반응형 fallback으로 판단하여 허용.

### layout.tsx 세부 검토

**양호한 점:**
- Viewport export 분리 (Next.js 14+ 패턴 준수).
- themeColor '#0d1117' = surface DEFAULT와 일치.
- metadata template 패턴 적용.
- Suspense boundary로 Loading 컴포넌트 연결.

**지적 사항 없음.**

### loading.tsx / error.tsx / not-found.tsx 세부 검토

**양호한 점:**
- 세 파일 모두 dark token 일관 사용.
- loading.tsx가 실제 홈 레이아웃을 반영한 skeleton (hero + sidebar + grid).
- error.tsx가 error.digest를 조건부 표시하고, reset() 호출 정상.
- not-found.tsx의 404 대형 타이포가 text-surface-elevated로 은은하게 표시됨 — 다크 테마에서 시각적 깊이감 제공.

**지적 사항:**

5. **[MINOR] error.tsx의 retry 버튼 text 색상**: `text-surface` 사용 — 이것은 #0d1117 (매우 어두운 색). accent 배경(#f0883e) 위에 짙은 텍스트는 가독성이 좋으나, 다른 곳에서는 보통 `text-white`나 전용 토큰을 사용함. 일관성 면에서 경미한 이슈이나, 시각적 대비(contrast ratio)는 충분함.

### useScrollDirection.ts 세부 검토

**양호한 점:**
- requestAnimationFrame + ticking 패턴으로 scroll jank 방지.
- passive: true listener.
- threshold로 미세한 스크롤 무시.
- 타입 export (ScrollDirection) 제공.
- cleanup 함수에서 removeEventListener 호출.

**지적 사항 없음.** 깔끔한 구현.

### globals.css 세부 검토

**양호한 점:**
- nav-link, nav-link-active 클래스가 컴포넌트 레이어에 정의됨.
- scrollbar-none이 3개 브라우저 엔진 모두 지원.
- safe-area-bottom이 env() fallback 포함.

**지적 사항 없음.**

---

## 3단계: 회귀 검증

- [PASS] **MAIN_MENU 링크 보존**: Header에서 NAV_ITEMS(search/ranking 제외) + mobile menu(전체 MAIN_MENU) + ranking 별도 배치. 13개 메뉴 항목 모두 접근 가능.
- [PASS] **SearchBar 통합**: SearchBar 컴포넌트 임포트 및 렌더링 정상. expandable 패턴으로 변경되었으나 기능은 유지.
- [PASS] **TypeScript 컴파일**: `tsc --noEmit` 오류 없음.
- [PASS] **임포트 경로**: @/lib/constants, @/lib/utils, @/hooks/useScrollDirection, ./SearchBar 모두 유효한 파일 존재 확인.
- [PASS] **기존 데이터 영향**: Layout/Navigation 변경만이므로 582개 기사 데이터에 영향 없음.
- [PASS] **COUNTRIES 사용**: Header mobile menu와 bottom nav에서 COUNTRIES 상수 활용. code === 'all' 필터링 후 국가별 링크 생성.

---

## 4단계: 채점

### 1. 디자인 품질: 8/10
Bloomberg/Reuters 스타일의 다크 모던 헤더. 2-tier 구조가 시각적 계층을 제공. LiveClock의 green pulse dot, 로고의 red pulse dot 등 미세한 디테일이 프리미엄 느낌을 줌. Footer는 깔끔하지만 특별히 눈에 띄는 요소는 없음. 전반적으로 색상/여백/타이포 일관성 우수. keyboard hint badge는 디자인 품질을 높이는 터치.

### 2. 독창성: 7/10
animated hamburger morphing, keyboard shortcut hint, auto-scroll active nav, country flyout with scale transition 등 세부 인터랙션이 차별화 요소. 그러나 전체 레이아웃 구조 자체는 전형적인 뉴스 사이트 패턴에서 크게 벗어나지 않음. 404 페이지의 대형 타이포그래피는 기억에 남는 요소.

### 3. 기술적 완성도: 9/10
TypeScript 오류 없음. semantic 토큰 100% 사용 (하드코딩 0건). useScrollDirection이 RAF + passive listener로 최적화됨. 반응형 3단계 (mobile/tablet/desktop) 대응. cn() 유틸리티 일관 사용. 키보드 단축키 미구현(힌트만 표시)과 aria-expanded 누락이 감점 요인이나 전체적으로 높은 수준.

### 4. 기능성: 8/10
네비게이션 명확, 모바일 메뉴 전환 정상, bottom nav로 모바일 UX 개선, 검색 확장/축소 정상. country picker flyout 동작. 키보드 단축키(/)가 시각적으로 약속되었으나 미구현인 점이 감점.

### 5. 회귀 안전: 10/10
기존 기능 깨짐 없음. 모든 MAIN_MENU 링크 접근 가능. TypeScript 컴파일 정상. 임포트 경로 모두 유효. 데이터 레이어 무영향.

---

## 5단계: 최종 판정

**전체 판정**: 합격

**가중 점수**: 8.35 / 10.0
- (8 x 0.30) + (7 x 0.20) + (9 x 0.25) + (8 x 0.15) + (10 x 0.10)
- = 2.4 + 1.4 + 2.25 + 1.2 + 1.0 = 8.35

**항목별 점수**:
- 디자인 품질: 8/10 — 다크 모던 2-tier 헤더, 일관된 토큰, 미세 디테일 우수. Footer는 무난.
- 독창성: 7/10 — 인터랙션 디테일에서 차별화. 레이아웃 구조 자체는 표준적.
- 기술적 완성도: 9/10 — TS 오류 0건, RAF 최적화, semantic 토큰 100%. 접근성 소폭 부족.
- 기능성: 8/10 — 모든 네비게이션 동작. 키보드 단축키 힌트 vs 실제 동작 불일치.
- 회귀 안전: 10/10 — 기존 기능 완전 보존.

**구체적 개선 지시** (다음 슬라이스에서 반영 권장):
1. `src/components/Header.tsx` line 339: 국가 버튼에 `aria-expanded={countryOpen}` 추가하여 접근성 개선
2. `src/components/Header.tsx`: `/` 키 이벤트 리스너를 useEffect로 추가하여, 표시된 키보드 힌트가 실제 동작하도록 구현 (input focus 상태에서는 무시하는 가드 포함)
3. `src/components/Header.tsx` line 152: 모바일 햄버거 버튼에 `aria-expanded={mobileOpen}` 추가

**방향 판단**: 현재 방향 유지
