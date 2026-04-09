# 자체 점검 — 슬라이스 S2

## SPEC 개선 항목 체크
- [x] 항목 1: Header 실시간 통계 — /api/admin/stats에서 articlesToday/totalArticles를 fetch하여 슬로건 위치에 "오늘 N건 업데이트 · 전체 N건" 표시. 5분 간격 자동 갱신. fetch 실패 시 컴포넌트 비표시(graceful fallback).
- [x] 항목 2: Footer 4-column 레이아웃 — (1) 사이트 소개+AI 설명, (2) 카테고리 링크+바로가기, (3) 뉴스레터 구독 폼, (4) 소셜+연락처. sm:2col, lg:4col 반응형.
- [x] 항목 3: Footer 하단 바 — 저작권 + AI 면책 + FooterStats 컴포넌트(전체 기사 N건, 오늘 N건, 활성 소스 N개).
- [x] 항목 4: 뉴스레터 구독 폼 — email 입력 + 구독 버튼. submit 시 "구독 완료" 인라인 메시지 4초간 표시. 백엔드 없음 (UI only).
- [x] 항목 5: 소셜 링크 + 연락처 — email, GitHub 링크 목록 + Twitter/GitHub/Email 아이콘 버튼. 모두 외부 링크는 target="_blank" rel="noopener noreferrer".
- [x] 항목 6: loading.tsx shimmer 효과 — globals.css에 shimmer 유틸리티 클래스 추가 (::after pseudo-element + shimmer-slide keyframe). 모든 스켈레톤 블록에 shimmer 클래스 적용, animate-pulse 제거.
- [x] 항목 7: error.tsx 다크 테마 강화 — 에러 아이콘을 더 큰 원형 컨테이너+글로우 배경으로 교체. 에러 코드를 pill 뱃지 스타일로 표시. "홈으로" 보조 버튼 추가.
- [x] 항목 8: not-found.tsx 다크 테마 강화 — "404"의 "0"에 accent/30 색상 포인트. "뉴스 검색" 보조 링크 버튼 추가. 안내 문구 보강.
- [x] 항목 9: layout.tsx 확인 — metadata, icons(/livenews/ prefix), viewport 설정 모두 기존 그대로 보존. max-w-screen-xl이 Header/Footer 내부에서 일관 적용됨을 확인.
- [x] 항목 10: Footer 'use client' + 인터랙티브 — 'use client' 추가. useState(email, submitted), useEffect(stats fetch) 사용.

## 수정 파일 목록
- `/home/user/hydro/src/components/Header.tsx`: LiveStats 컴포넌트 추가 (실시간 통계 fetch+표시), 스크롤 슬로건을 LiveStats로 교체
- `/home/user/hydro/src/components/Footer.tsx`: 전면 개편 — 4-column 레이아웃, NewsletterForm, FooterStats, 소셜 아이콘, AI 설명 카드
- `/home/user/hydro/src/app/loading.tsx`: animate-pulse를 shimmer 클래스로 교체
- `/home/user/hydro/src/app/error.tsx`: 에러 아이콘 강화, 글로우 배경, pill 에러코드, 홈 보조 버튼
- `/home/user/hydro/src/app/not-found.tsx`: 404 텍스트 accent 포인트, 검색 보조 버튼, 안내 문구 보강
- `/home/user/hydro/src/app/globals.css`: shimmer 유틸리티 클래스 + shimmer-slide keyframe 추가

## 디자인 자체 평가
- AI slop 패턴 사용 여부: 없음. 보라색 그라데이션 없음. 흰색 카드 격자 없음. 모든 색상이 S1 다크 모던 팔레트(surface/#0d1117, accent/#f0883e 등) 기반.
- 독창적 요소: Footer를 Bloomberg 터미널 하단 상태바 느낌으로 구성 (실시간 통계 + 카테고리 인덱스 + AI 기술 설명 카드). Header에 실시간 기사 카운터로 사이트 활동성 표현. 404 "0" 글자에 accent 포인트.
- 다크 모던 테마 일관성: 모든 파일에서 bg-surface, bg-surface-card, bg-surface-elevated, text-text, text-text-secondary, text-text-muted, border-border, border-border-muted, accent 계열 토큰만 사용. 하드코딩 색상 없음.

## 회귀 위험 확인
- 기존 기능 영향: 없음. Header의 모든 네비게이션, 모바일 메뉴, 검색, 국가 선택이 그대로 유지됨. Footer의 기존 MAIN_MENU 링크 유지. layout.tsx 변경 없음 (metadata, icons 보존).
- TypeScript 오류: 없음 (npx tsc --noEmit 통과)
