# 자체 점검 — 슬라이스 S4

## SPEC 개선 항목 체크
- [x] 항목 1: 홈페이지에 NewsletterBanner 추가 — Hero 섹션과 카테고리 섹션 사이에 배치 완료
- [x] 항목 2: 홈페이지 카테고리 섹션에 AdSlot(sidebar) 추가 — TrendingKeywords 아래, 데스크톱에서만 표시 (hidden lg:block)
- [x] 항목 3: 홈페이지 최신 뉴스 그리드에 네이티브 AdSlot 삽입 — 매 4번째 기사 뒤에 full-width AdSlot(native) 삽입, React.Fragment 사용
- [x] 항목 4: 기사 상세에 ShareButtons 추가 — 제목 아래, divider 위에 배치. url=article.originalUrl, title=title
- [x] 항목 5: 기사 상세에 BookmarkButton 추가 — 카테고리+메타 행 우측(ml-auto)에 배치. articleId=article.id
- [x] 항목 6: 기사 상세에 배너 AdSlot 추가 — 기사 본문/태그 아래, 관련 기사 위에 AdSlot(banner) 배치
- [x] 항목 7: 국가 페이지에 NewsletterBanner + 네이티브 AdSlot 추가 — 기사 그리드에 매 4번째 뒤 AdSlot(native), Pagination 위에 NewsletterBanner
- [x] 항목 8: 카테고리 페이지에 네이티브 AdSlot 추가 — 기사 그리드에 매 4번째 뒤 AdSlot(native) 삽입
- [x] 항목 9: 속보/랭킹/검색 페이지 다크 테마 일관성 확인 — grep으로 하드코딩 색상 없음 확인, 모두 시맨틱 토큰 사용
- [x] 항목 10: 기사 상세 하단 공유 영역 정리 — 기존 Twitter intent 기반 "공유" 텍스트 링크 제거 (ShareButtons로 대체됨)

## 수정 파일 목록
- `src/app/page.tsx`: React import 추가, NewsletterBanner/AdSlot import 추가, Hero와 Category 사이에 NewsletterBanner 삽입, TrendingKeywords 아래에 AdSlot(sidebar) 추가, 최신 뉴스 그리드에 매 4번째 기사 뒤 AdSlot(native) 삽입
- `src/app/article/[id]/page.tsx`: ShareButtons/BookmarkButton/AdSlot import 추가, 메타 행에 BookmarkButton 배치, 제목 아래 ShareButtons 배치, 관련 기사 위에 AdSlot(banner) 배치, 하단 중복 공유 링크 제거
- `src/app/[country]/page.tsx`: React/NewsletterBanner/AdSlot import 추가, 기사 그리드에 AdSlot(native) 삽입, Pagination 위에 NewsletterBanner 배치
- `src/app/category/[slug]/page.tsx`: React/AdSlot import 추가, 기사 그리드에 AdSlot(native) 삽입
- `src/app/breaking/page.tsx`: 변경 없음 — 시맨틱 토큰 일관성 확인 완료
- `src/app/ranking/page.tsx`: 변경 없음 — 시맨틱 토큰 일관성 확인 완료
- `src/app/search/page.tsx`: 변경 없음 — 시맨틱 토큰 일관성 확인 완료

## 디자인 자체 평가
- AI slop 패턴 사용 여부: 없음 — 보라색 그라데이션, 뻔한 카드 격자 미사용
- 독창적 요소: 좌측 액센트 바(w-1 bg-accent rounded-full)를 섹션 헤더에 일관 적용, AdSlot을 그리드 full-width row로 삽입하여 콘텐츠 흐름 유지, BookmarkButton을 메타 행 우측에 자연스럽게 배치
- 다크 모던 테마 일관성: 모든 신규 컴포넌트가 S1 시맨틱 토큰(surface-card, border-muted, text-text 등)을 사용하며, 7개 페이지 모두 하드코딩 색상 없음

## 회귀 위험 확인
- 기존 기능 영향: 없음 — 모든 API 호출(getArticles, getBreakingNews, getCategoryCounts, getTrendingKeywords, prisma.article.findUnique 등) 변경 없음
- TypeScript 오류: 없음 — BookmarkButton(articleId: number), ShareButtons(url: string, title: string), AdSlot(size: 'banner'|'sidebar'|'native'), NewsletterBanner() 모두 정확한 props 전달
- 기존 페이지네이션, 검색, 필터 기능: 변경 없음
- basePath 관련: 내부 링크에 basePath 미포함 (Next.js가 자동 처리)
- 서버/클라이언트 컴포넌트 경계: article detail page는 서버 컴포넌트에서 클라이언트 컴포넌트(BookmarkButton, ShareButtons)를 import하는 정상 패턴
