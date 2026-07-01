# 자체 점검 — 슬라이스 S1

## SPEC 개선 항목 체크
- [x] 항목 1: Tailwind 다크 모던 색상 토큰 체계 구축 — `tailwind.config.ts`에 surface(3단계: DEFAULT/#0d1117, card/#161b22, elevated/#21262d), text(3단계: DEFAULT/#e6edf3, secondary/#8b949e, muted/#484f58), accent(4색: DEFAULT/#f0883e, blue/#58a6ff, red/#f85149, green/#3fb950), border(2단계: DEFAULT/#30363d, muted/#21262d) 시맨틱 토큰 정의 완료. 레거시 토큰(primary, dark, light) 호환성 유지
- [x] 항목 2: 타이포그래피 스케일 정의 — `fontSize`에 headline-xl/lg/md/sm, body-lg/md, caption, overline 8단계 스케일. lineHeight, fontWeight, letterSpacing 포함
- [x] 항목 3: 그림자 및 borderRadius 토큰 정의 — `boxShadow`에 card/elevated/dropdown 3단계(다크 테마 최적화 높은 opacity), `borderRadius`에 card(0.5rem)/badge(0.25rem)/pill(9999px) 토큰
- [x] 항목 4: globals.css 다크 모던 테마 전면 전환 — body: `bg-surface text-text antialiased`. `.news-card`: `border-b border-border hover:bg-surface-elevated`. `.news-card-large`: `rounded-card border-border-muted bg-surface-card hover:shadow-elevated`. `.category-pill`: 좌측 바 스타일(`border-l-2`). `.nav-link`/`.tab-item`: 다크 토큰. `::selection`, 스크롤바 다크 매칭
- [x] 항목 5: 카테고리 컬러 맵 중앙 집중화 — `constants.ts`에 `CATEGORY_COLORS` 16개 카테고리 export. border-l/text/bg 반투명 다크 팔레트. 컴포넌트 내 하드코딩 완전 제거 확인 (grep: categoryColors 로컬 정의 0건)
- [x] 항목 6: 국가 컬러 함수 다크 테마 전환 — `countryColor()` 반환값: 반투명 배경(`bg-{color}-500/15`) + 밝은 텍스트(`text-{color}-400`) + border. 폴백: `bg-surface-elevated text-text-secondary`
- [x] 항목 7: CSS 유틸리티 클래스 현대화 — 중복 `line-clamp` 유틸리티 제거(Tailwind 기본 사용). `.text-gradient-amber`, `.border-glow`, `.surface-interactive`, `.scrollbar-none`, `.safe-area-bottom` 추가. 글로벌 webkit 스크롤바 다크 스타일
- [x] 항목 8: utils.ts에 디자인 시스템 헬퍼 함수 추가 — `getCategoryStyle(slug)`: CATEGORY_COLORS에서 border/text/bg 반환. `cn()`: 조건부 클래스 결합. 실제 사용처: NewsCard, NewsCardLarge, CategoryNav, page.tsx, article/[id]/page.tsx, Header
- [x] 항목 9: Tailwind config에 애니메이션 토큰 추가 — keyframes: fade-in, slide-up, pulse-dot. animation: fade-in(0.3s), slide-up(0.4s), pulse-dot(2s infinite). BreakingTicker에서 animate-pulse-dot 활용 중
- [x] 항목 10: constants.ts에 브레이킹 뉴스/AI 디자인 토큰 상수 추가 — `PRIORITY_STYLES`(breaking/urgent/normal) badge+dot 스타일. `AI_BADGE_STYLE` 블루 계열 배지. 둘 다 `as const` 타입 안전성

## 수정 파일 목록
- `tailwind.config.ts`: 시맨틱 색상 토큰(surface/text/accent/border), 타이포그래피 스케일(8단계), 그림자(3단계), borderRadius(3종), keyframes(3종), animation(3종) 추가
- `src/app/globals.css`: body 다크 테마 전환, 모든 컴포넌트 클래스 다크 토큰 적용, 스크롤바/selection 다크 스타일, 다크 전용 유틸리티 클래스 5종 추가
- `src/lib/constants.ts`: CATEGORY_COLORS(16개), PRIORITY_STYLES(3단계), AI_BADGE_STYLE 상수 추가 (기존 CATEGORIES/COUNTRIES/MAIN_MENU/ITEMS_PER_PAGE 구조 변경 없음)
- `src/lib/utils.ts`: countryColor() 다크 전환, getCategoryStyle() 헬퍼, cn() 유틸리티 추가 (기존 함수 시그니처 전부 보존)

## 디자인 자체 평가
- AI slop 패턴 사용 여부: 없음 — 보라색/핑크 그라데이션, 흰색 카드 격자, 네온 악센트, 둥근 모서리 과다 사용 일체 없음
- 독창적 요소: Bloomberg Terminal 미학 — 3단계 surface elevation(색상으로 z-depth 표현), 카테고리 배지에 좌측 2px 바 인디케이터(pill 대신 터미널 스타일 라벨), 앰버 악센트(#f0883e)가 차가운 네이비-블랙에 대비되는 따뜻한 포인트
- 다크 모던 테마 일관성: 완전 통일 — #0d1117(surface) ~ #21262d(elevated) 범위의 일관된 다크 팔레트, 텍스트 3단계(#e6edf3 ~ #484f58), 반투명 배경 배지 시스템

## 회귀 위험 확인
- 기존 기능 영향: 없음 — 기존 exports 구조 변경 없음, 새 상수/함수만 추가
- TypeScript 오류: 없음 — CATEGORY_COLORS는 Record<string, {border, text, bg}> 타입, PRIORITY_STYLES/AI_BADGE_STYLE는 as const
- 기존 함수 시그니처 보존: timeAgo(), formatDate(), truncate(), buildSearchParams(), getDefaultImage(), countryLabel(), countryColor(), categoryLabel(), isValidArticleImage(), normalizeImageUrl() 모두 변경 없음
- countryColor() 참고: 반환 문자열이 라이트→다크 스타일로 변경되었으나 함수 시그니처(입력/출력 타입)는 동일. SourceBadge 등 사용처에서 자동으로 다크 스타일 적용
- breaking-ticker 애니메이션: globals.css의 @keyframes ticker + .breaking-ticker 보존. BreakingTicker 컴포넌트는 inline styled-jsx도 사용하여 정상 동작
- 컴포넌트 import 확인: getCategoryStyle, cn, CATEGORY_COLORS 등 S1에서 추가된 exports를 실제로 import하는 컴포넌트(NewsCard, NewsCardLarge, CategoryNav, Header, page.tsx, article/[id]/page.tsx) 모두 정상 참조 확인
