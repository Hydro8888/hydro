# S3 콘텐츠 컴포넌트 개선 설계서

## 현재 상태 분석

### 장점
- S1에서 정의한 시맨틱 토큰(bg-surface-card, text-text, border-border-muted 등)을 일관되게 사용 중
- NewsCard/NewsCardLarge 모두 이미지 검증(isValidArticleImage, normalizeImageUrl) 정상 적용
- BreakingTicker의 CSS 마키 애니메이션 구현이 견실함 (hover 시 일시정지, 복제 리스트)
- CategoryNav에서 CATEGORY_COLORS 토큰 기반 스타일링이 잘 연계됨
- Pagination의 getPageRange 로직이 견고하고 접근성(aria-label, aria-current) 적용됨
- types.ts에 contentOriginal 필드가 이미 optional로 존재

### 단점
- 사용자 인터랙션 기능 부재: 북마크, 공유, 뉴스레터 구독 등 참여형 기능이 없음
- 읽기 시간 표시 없음: 기사 길이에 대한 시각적 힌트가 부재
- 수익화 영역 없음: 광고 슬롯 플레이스홀더가 없어 추후 수익화 확장이 어려움
- NewsCard 내 액션 버튼이 "자세히 보기"와 "원문 보기" 두 개뿐

## 디자인 방향

- 다크 모던 (Bloomberg Terminal / Reuters 스타일) 유지
- 신규 컴포넌트도 동일한 시맨틱 토큰 적용: surface-card, surface-elevated, border-muted, accent 등
- 마이크로 인터랙션: 북마크 토글 시 스케일 애니메이션, 토스트 페이드인
- AI slop 금지: 보라색 그라데이션, 뻔한 카드 격자 사용 안 함
- 신규 컴포넌트는 기존 컴포넌트와 시각적 무게감이 동일하도록 설계

## 대상 파일 목록

### 신규 생성
- `src/hooks/useBookmarks.ts` — localStorage 기반 북마크 관리 훅
- `src/components/BookmarkButton.tsx` — 북마크 토글 버튼
- `src/components/ShareButtons.tsx` — 공유 버튼 세트
- `src/components/NewsletterBanner.tsx` — 뉴스레터 구독 배너
- `src/components/AdSlot.tsx` — 광고 영역 플레이스홀더

### 기존 수정
- `src/components/NewsCard.tsx` — 북마크 버튼 + 읽기 시간 추가
- `src/components/NewsCardLarge.tsx` — 북마크 버튼 + 읽기 시간 추가
- `src/lib/types.ts` — contentOriginal 필드 확인 (이미 존재)

## 개선 항목

### 항목 1: useBookmarks 커스텀 훅
- 대상 파일: `src/hooks/useBookmarks.ts`
- 현재 문제: 북마크 기능이 없음
- 개선 방법: localStorage 기반 북마크 관리 훅 구현. bookmarks 배열, isBookmarked, toggleBookmark 제공. SSR 안전하게 useEffect로 초기화. useSyncExternalStore 대신 useState + useEffect 패턴으로 hydration mismatch 방지.
- 기대 효과: 여러 컴포넌트에서 재사용 가능한 북마크 상태 관리

### 항목 2: BookmarkButton 컴포넌트
- 대상 파일: `src/components/BookmarkButton.tsx`
- 현재 문제: 사용자 참여 기능 부재
- 개선 방법: SVG 북마크 아이콘 토글 버튼. useBookmarks 훅 사용. 토글 시 scale 애니메이션 (CSS transition). 북마크된 상태는 accent 컬러로 fill.
- 기대 효과: 기사 저장 기능으로 사용자 재방문 유도

### 항목 3: ShareButtons 컴포넌트
- 대상 파일: `src/components/ShareButtons.tsx`
- 현재 문제: 기사 공유 기능 없음
- 개선 방법: 카카오톡(URL scheme), 페이스북(sharer.php), X/Twitter(intent/tweet), 링크 복사(navigator.clipboard + 토스트) 4개 버튼. 수평 배치, 각 버튼에 SVG 아이콘 + 라벨. 다크 테마 일관.
- 기대 효과: 소셜 공유를 통한 유입 확대

### 항목 4: NewsletterBanner 컴포넌트
- 대상 파일: `src/components/NewsletterBanner.tsx`
- 현재 문제: 뉴스레터 구독 기능 없음
- 개선 방법: "매일 아침 AI가 정리한 글로벌 뉴스를 받아보세요" 카피. 이메일 입력 + 구독 버튼. UI only — submit 시 "구독 완료!" 표시. 다크 카드 배경 + accent 보더. 닫기 버튼으로 localStorage에 dismissed 상태 저장.
- 기대 효과: 뉴스레터 구독자 확보를 위한 CTA 영역

### 항목 5: AdSlot 플레이스홀더 컴포넌트
- 대상 파일: `src/components/AdSlot.tsx`
- 현재 문제: 광고 영역이 없어 수익화 확장 어려움
- 개선 방법: size prop으로 'banner'(728x90), 'sidebar'(300x250), 'native'(기사 카드 형태) 지원. 점선 보더 + "광고 영역" 플레이스홀더 텍스트. 추후 실제 광고 코드로 교체 가능한 구조.
- 기대 효과: 광고 수익화를 위한 인프라 마련

### 항목 6: NewsCard에 북마크 + 읽기 시간 추가
- 대상 파일: `src/components/NewsCard.tsx`
- 현재 문제: 인터랙션 부재, 읽기 시간 정보 없음
- 개선 방법: 이미지 영역 우측 상단에 BookmarkButton 오버레이. 메타 영역에 "N분 읽기" 표시. 읽기 시간 계산: contentOriginal 또는 summaryKo 문자 수 / 500자(한국어 분당).
- 기대 효과: 사용자에게 기사 길이 힌트 제공 + 북마크 기능

### 항목 7: NewsCardLarge에 북마크 + 읽기 시간 추가
- 대상 파일: `src/components/NewsCardLarge.tsx`
- 현재 문제: 대형 카드에도 동일 기능 부재
- 개선 방법: NewsCard와 동일하게 BookmarkButton + 읽기 시간 추가. 이미지 오버레이 우측 상단에 배치.
- 기대 효과: 대형 카드에서도 일관된 사용자 경험

### 항목 8: 읽기 시간 계산 유틸리티
- 대상 파일: `src/lib/utils.ts`
- 현재 문제: 읽기 시간 계산 함수가 없음
- 개선 방법: estimateReadingTime 함수 추가. contentOriginal 또는 summaryKo 문자 수 기반, 한국어 분당 500자 기준. 최소 1분.
- 기대 효과: 여러 컴포넌트에서 재사용 가능한 유틸리티

### 항목 9: 북마크 스케일 애니메이션 키프레임
- 대상 파일: `tailwind.config.ts`
- 현재 문제: 북마크 토글용 애니메이션이 없음
- 개선 방법: bookmark-pop 키프레임 추가 (scale 1 -> 1.3 -> 1). toast-in 키프레임 추가 (opacity 0->1, translateY).
- 기대 효과: 마이크로 인터랙션으로 UX 향상
