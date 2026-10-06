# 자체 점검 — Homepage Redesign (Bloomberg-style editorial layout)

## SPEC 개선 항목 체크
- [x] Task 1: `groupByCategory` 순수 함수를 `queries.ts`에 추가
- [x] Task 1: `getTrendingKeywords` 비동기 함수를 `queries.ts`에 추가 (캐시 300초, categoryPrimary 기준 groupBy)
- [x] Task 2: `NewsCardCompact` 컴포넌트 신규 생성 — 이미지 없는 수평 카드 (제목 + 출처 + timeAgo)
- [x] Task 3: `page.tsx` 전면 재작성 — CountryTabs, SearchBar, 하단 카테고리/국가 사이드바 제거
- [x] Task 3: BreakingTicker를 컨테이너 바깥 full-width로 배치
- [x] Task 3: Hero 섹션 — articles[0] 메인 (lg:col-span-2) + articles[1-2] 서브히어로
- [x] Task 3: 카테고리별 뉴스 섹션 — 상위 3개 카테고리 + TrendingKeywords 사이드바 (4열 그리드)
- [x] Task 3: 최신 뉴스 섹션 — 카테고리에 사용되지 않은 나머지 기사
- [x] Task 3: 빈 상태 유지
- [x] Task 3: `export const dynamic = 'force-dynamic'` 유지
- [x] Task 3: 섹션별 컬러 바 적용 (accent / accent-blue / accent-green)
- [x] Task 3: `animate-fade-in` 입장 애니메이션 적용

## 수정 파일 목록
- `src/lib/queries.ts`: `groupByCategory`, `getTrendingKeywords` 2개 함수 추가
- `src/components/NewsCardCompact.tsx`: 신규 생성 — 컴팩트 뉴스 카드 컴포넌트
- `src/app/page.tsx`: 전면 재작성 — Bloomberg 스타일 에디토리얼 레이아웃

## 디자인 자체 평가
- AI slop 패턴 사용 여부: 없음 (보라색 그라데이션, 뻔한 격자 레이아웃 등 미사용)
- 독창적 요소: 카테고리별 에디토리얼 그룹핑 (featured + compact sub-items), 비대칭 히어로 레이아웃
- 다크 모던 테마 일관성: 기존 디자인 토큰(surface-card, border-muted, text, accent 등) 일관 사용

## 회귀 위험 확인
- 기존 기능 영향: CountryTabs/SearchBar 제거됨 (의도적 — 홈에서 제거, 다른 페이지에서는 여전히 사용 가능)
- TypeScript 오류: 없음 (tsc --noEmit 통과)
- BreakingTicker props 호환: id를 String()으로 변환하여 TickerArticle 인터페이스에 맞춤
- TrendingKeywords props 호환: `keywords` prop에 `{ keyword, count }[]` 형태로 전달
