# 자체 점검 -- 슬라이스 S3

## SPEC 개선 항목 체크
- [x] 항목 1: useBookmarks 커스텀 훅 -- localStorage 기반 북마크 관리 훅 구현 완료. SSR 안전(useEffect 초기화), bookmarks/isBookmarked/toggleBookmark/hydrated 제공.
- [x] 항목 2: BookmarkButton 컴포넌트 -- SVG 북마크 아이콘 토글 버튼. useBookmarks 훅 사용. 토글 시 animate-bookmark-pop 스케일 애니메이션. 활성 상태는 accent 컬러 fill.
- [x] 항목 3: ShareButtons 컴포넌트 -- 카카오톡(story.kakao.com URL), 페이스북(sharer.php), X/Twitter(intent/tweet), 링크 복사(navigator.clipboard + fallback + "복사됨" 토스트) 4개 버튼. 수평 배치, SVG 아이콘 + 라벨.
- [x] 항목 4: NewsletterBanner 컴포넌트 -- "매일 아침 AI가 정리한 글로벌 뉴스를 받아보세요" 카피. 이메일 입력 + 구독 버튼. UI only(submit 시 "구독 완료!" 표시). 다크 카드 배경 + accent 보더. 닫기 버튼(localStorage dismissed 상태 저장). SSR 안전(기본 hidden, useEffect로 dismissed 확인).
- [x] 항목 5: AdSlot 플레이스홀더 -- size prop('banner'/'sidebar'/'native') 지원. 점선 보더 + "광고 영역" 텍스트. data-ad-slot 어트리뷰트로 추후 교체 용이.
- [x] 항목 6: NewsCard에 북마크 + 읽기 시간 추가 -- 이미지 영역 우측 상단에 BookmarkButton 오버레이. 메타 영역에 "N분 읽기" 표시(책 아이콘 + estimateReadingTime).
- [x] 항목 7: NewsCardLarge에 북마크 + 읽기 시간 추가 -- NewsCard와 동일 패턴. 이미지 오버레이 우측 상단에 BookmarkButton, 메타에 읽기 시간.
- [x] 항목 8: estimateReadingTime 유틸리티 -- utils.ts에 추가. contentOriginal 또는 summaryKo 문자 수 / 500(한국어 분당). 최소 1분.
- [x] 항목 9: tailwind.config.ts 키프레임 -- bookmark-pop(scale 1->1.3->1), toast-in(opacity+translateY) 키프레임 및 animation 추가.

## 수정 파일 목록
- `src/hooks/useBookmarks.ts`: 신규 생성 -- localStorage 기반 북마크 관리 훅
- `src/components/BookmarkButton.tsx`: 신규 생성 -- 북마크 토글 버튼 (스케일 애니메이션)
- `src/components/ShareButtons.tsx`: 신규 생성 -- 소셜 공유 버튼 세트 (카카오/페이스북/X/링크복사)
- `src/components/NewsletterBanner.tsx`: 신규 생성 -- 뉴스레터 구독 배너 (UI only)
- `src/components/AdSlot.tsx`: 신규 생성 -- 광고 영역 플레이스홀더 (3 사이즈)
- `src/components/NewsCard.tsx`: BookmarkButton 오버레이 + 읽기 시간("N분 읽기") 추가
- `src/components/NewsCardLarge.tsx`: BookmarkButton 오버레이 + 읽기 시간("N분 읽기") 추가
- `src/lib/utils.ts`: estimateReadingTime 함수 추가
- `tailwind.config.ts`: bookmark-pop, toast-in 키프레임 및 animation 추가

## 디자인 자체 평가
- AI slop 패턴 사용 여부: 없음. 보라색 그라데이션, 뻔한 카드 격자 미사용.
- 독창적 요소: BookmarkButton의 backdrop-blur + 반투명 배경으로 이미지 위 오버레이 시 가독성 확보. ShareButtons의 통일된 badge 스타일. NewsletterBanner의 gradient accent bar.
- 다크 모던 테마 일관성: 모든 컴포넌트에서 S1 시맨틱 토큰(bg-surface-card, bg-surface-elevated, text-text, text-text-secondary, text-text-muted, border-border-muted, accent) 사용. 하드코딩된 색상값 없음.

## 회귀 위험 확인
- 기존 기능 영향: 없음. NewsCard/NewsCardLarge의 기존 props/인터페이스 변경 없음. 추가된 요소만 존재. 기존 Link, Image, 카테고리 배지, 메타 정보, 푸터 구조 그대로 유지.
- TypeScript 오류: 없음 (npx tsc --noEmit 통과)
- types.ts 변경: 없음 (contentOriginal 필드가 이미 optional로 존재)
- 기존 유틸 함수(normalizeImageUrl, isValidArticleImage, getCategoryStyle 등): 변경 없음, 그대로 사용
