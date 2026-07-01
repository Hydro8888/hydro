# S4 페이지 & UX 개선 설계서

## 현재 상태 분석

### 장점
- 홈페이지가 Breaking Ticker → Hero → Category → Latest 순으로 잘 구조화됨
- 기사 상세 페이지에 이미지, 메타, 본문, 관련 기사까지 완전한 구조
- 국가/카테고리 페이지에 헤드라인+그리드 이중 레이아웃 적용
- 모든 페이지에서 S1 시맨틱 토큰(text-text, bg-surface-card 등) 일관 사용
- 검색 페이지에 국가/카테고리 필터, 실시간 검색, 페이지네이션 완비
- 랭킹 페이지에 상위 3개 순위 뱃지 표시

### 단점
- 홈페이지에 사용자 참여 컴포넌트(뉴스레터, 광고 슬롯) 없음
- 기사 상세에 SNS 공유 버튼이 텍스트 링크로만 존재 (ShareButtons 미사용)
- 기사 상세에 북마크 기능 없음
- 광고 수익화 영역이 어디에도 없음
- 홈페이지 섹션 헤더의 액센트 바가 존재하나, 카테고리/국가 페이지에는 미적용

## 디자인 방향

- 다크 모던 (Bloomberg/Reuters) 유지
- S3에서 만든 NewsletterBanner, ShareButtons, AdSlot, BookmarkButton을 페이지에 자연스럽게 배치
- 광고 슬롯은 콘텐츠 흐름을 방해하지 않는 위치에 삽입
- 섹션 구분을 강화하되, 과도한 장식 없이 좌측 액센트 바 + 타이포로 해결
- AI slop 금지: 보라색 그라데이션, 뻔한 카드 격자 패턴 사용 안 함

## 대상 파일 목록

### 기존 수정
- `src/app/page.tsx` — 홈페이지 (가장 중요)
- `src/app/article/[id]/page.tsx` — 기사 상세
- `src/app/[country]/page.tsx` — 국가별 페이지
- `src/app/category/[slug]/page.tsx` — 카테고리별 페이지
- `src/app/breaking/page.tsx` — 속보 페이지 (다크 테마 확인)
- `src/app/ranking/page.tsx` — 랭킹 페이지 (다크 테마 확인)
- `src/app/search/page.tsx` — 검색 페이지 (다크 테마 확인)

## 개선 항목

### 항목 1: 홈페이지에 NewsletterBanner 추가
- 대상 파일: `src/app/page.tsx`
- 현재 문제: 사용자 참여형 콘텐츠 없음
- 개선 방법: Hero 섹션과 카테고리 뉴스 섹션 사이에 NewsletterBanner 배치
- 기대 효과: 뉴스레터 구독 전환율 향상

### 항목 2: 홈페이지 카테고리 섹션에 AdSlot 사이드바 추가
- 대상 파일: `src/app/page.tsx`
- 현재 문제: 수익화 영역 없음
- 개선 방법: 카테고리 섹션의 4열 그리드 마지막 열(데스크톱)에 TrendingKeywords 아래 AdSlot(sidebar, 300x250) 배치
- 기대 효과: 콘텐츠 흐름을 유지하면서 광고 영역 확보

### 항목 3: 홈페이지 최신 뉴스 그리드에 네이티브 AdSlot 삽입
- 대상 파일: `src/app/page.tsx`
- 현재 문제: 최신 뉴스 영역에 수익화 포인트 없음
- 개선 방법: 최신 뉴스 그리드에서 매 4번째 기사 뒤에 AdSlot(native) 삽입
- 기대 효과: 네이티브 광고로 자연스러운 수익화

### 항목 4: 기사 상세에 ShareButtons 추가
- 대상 파일: `src/app/article/[id]/page.tsx`
- 현재 문제: 공유 기능이 하단 텍스트 링크로만 존재
- 개선 방법: 기사 제목 아래, 본문 위에 ShareButtons 컴포넌트 배치. url은 기사 originalUrl, title은 기사 제목
- 기대 효과: SNS 공유율 향상

### 항목 5: 기사 상세에 BookmarkButton 추가
- 대상 파일: `src/app/article/[id]/page.tsx`
- 현재 문제: 북마크 기능 없음
- 개선 방법: 기사 헤더 메타 영역 우측에 BookmarkButton 배치. articleId = article.id
- 기대 효과: 사용자 재방문 유도

### 항목 6: 기사 상세에 배너 AdSlot 추가
- 대상 파일: `src/app/article/[id]/page.tsx`
- 현재 문제: 기사 콘텐츠와 관련 기사 사이에 광고 영역 없음
- 개선 방법: 기사 본문과 관련 기사 섹션 사이에 AdSlot(banner, 728x90) 삽입
- 기대 효과: 기사 읽기 완료 시점의 높은 CTR 활용

### 항목 7: 국가 페이지에 NewsletterBanner + 네이티브 AdSlot 추가
- 대상 파일: `src/app/[country]/page.tsx`
- 현재 문제: 참여형 컴포넌트 없음
- 개선 방법: 페이지 하단(Pagination 위)에 NewsletterBanner 배치. 기사 그리드에 매 4번째 기사 뒤 AdSlot(native) 삽입
- 기대 효과: 국가별 페이지에서도 뉴스레터 구독 전환 + 수익화

### 항목 8: 카테고리 페이지에 네이티브 AdSlot 추가
- 대상 파일: `src/app/category/[slug]/page.tsx`
- 현재 문제: 수익화 영역 없음
- 개선 방법: 기사 그리드에 매 4번째 기사 뒤 AdSlot(native) 삽입
- 기대 효과: 카테고리 탐색 중 자연스러운 수익화

### 항목 9: 속보/랭킹/검색 페이지 다크 테마 일관성 확인
- 대상 파일: `src/app/breaking/page.tsx`, `src/app/ranking/page.tsx`, `src/app/search/page.tsx`
- 현재 문제: S1 토큰 적용 확인 필요
- 개선 방법: 모든 색상 값이 시맨틱 토큰을 사용하는지 확인. 하드코딩 색상 제거
- 기대 효과: 전체 사이트 다크 테마 일관성

### 항목 10: 기사 상세 하단 공유 영역 정리
- 대상 파일: `src/app/article/[id]/page.tsx`
- 현재 문제: 기존 하단에 텍스트 기반 "공유" 링크가 별도로 존재하여 ShareButtons과 중복
- 개선 방법: ShareButtons 추가 후 하단 중복 공유 링크를 제거하여 UX 정리
- 기대 효과: 중복 제거로 깔끔한 인터페이스
