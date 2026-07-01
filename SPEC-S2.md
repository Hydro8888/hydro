# S2 레이아웃 & 네비게이션 개선 설계서

## 현재 상태 분석

### 장점
- Header: 2-tier 구조(로고+시계/네비게이션)로 잘 정리되어 있음. 스크롤 방향 감지로 네비 숨김 구현. 모바일 하단 고정 네비 존재.
- Footer: 기본적인 2-column 레이아웃. AI 면책 문구 포함.
- layout.tsx: 깔끔한 RootLayout, metadata/icons 설정 완비.
- loading.tsx: 스켈레톤 UI 있으나 shimmer 효과 없음.
- error.tsx: 기본 에러 UI 존재, 다크 테마 토큰 부분 사용.
- not-found.tsx: 기본 404 존재.

### 단점
- Footer가 정보량이 적고 Bloomberg/Reuters 스타일과 거리가 있음. 뉴스레터 구독 폼 없음, 소셜 링크 없음, 통계 없음.
- Header 슬로건 영역이 단순 반복 텍스트로 되어 있어 실시간 데이터 활용 안 됨.
- loading.tsx에 shimmer 효과(그라데이션 이동) 없이 단순 pulse만 사용.
- error.tsx/not-found.tsx가 기능적이나 시각적 밀도가 낮음.

## 디자인 방향
- **톤**: Bloomberg Terminal 느낌의 고밀도 정보 디자인. 어두운 배경(#0d1117) 위에 미세한 경계선과 accent-orange(#f0883e) 포인트.
- **금지**: 보라색 그라데이션, 흰색 카드 격자, 둥근 아바타 패턴
- **차별화**: Footer를 "정보 대시보드" 스타일로 — 뉴스레터 입력, 실시간 통계, 카테고리 인덱스가 한눈에 보이는 밀집 레이아웃. Header에 실시간 기사 수 카운터.

## 대상 파일 목록
1. `/home/user/hydro/src/components/Header.tsx`
2. `/home/user/hydro/src/components/Footer.tsx`
3. `/home/user/hydro/src/app/layout.tsx`
4. `/home/user/hydro/src/app/loading.tsx`
5. `/home/user/hydro/src/app/error.tsx`
6. `/home/user/hydro/src/app/not-found.tsx`
7. `/home/user/hydro/src/app/globals.css` (shimmer keyframe 추가)

## 개선 항목

### 항목 1: Header 실시간 통계 표시
- 대상 파일: `Header.tsx`
- 현재 문제: 슬로건 위치에 "전세계 뉴스를 한눈에" 무한 반복만 있음. 정보 가치 없음.
- 개선 방법: /api/admin/stats에서 articlesToday, totalArticles를 가져와 "오늘 {N}건 업데이트 · 전체 {N}건" 형태로 표시. fetch 실패 시 하드코딩 fallback.
- 기대 효과: 실시간 활동 지표로 사이트의 생동감 전달.

### 항목 2: Footer 4-column 레이아웃 전면 개편
- 대상 파일: `Footer.tsx`
- 현재 문제: 2-column으로 정보가 부족하고 Bloomberg 스타일과 거리가 있음.
- 개선 방법: 4-column: (1) 사이트 소개 + AI 설명, (2) 카테고리 링크 (CATEGORIES에서 가져옴), (3) 뉴스레터 구독 폼, (4) 소셜 + 연락처.
- 기대 효과: 정보 밀도 높은 프로페셔널 푸터.

### 항목 3: Footer 하단 바 — 저작권 + AI 면책 + 통계
- 대상 파일: `Footer.tsx`
- 현재 문제: 저작권과 AI 면책이 있으나 사이트 통계가 없음.
- 개선 방법: 하단 바에 "전체 기사 12,847건" 같은 통계 표시 (하드코딩 fallback 포함).
- 기대 효과: Bloomberg 터미널 하단 상태바 느낌.

### 항목 4: Footer 뉴스레터 구독 폼 (UI only)
- 대상 파일: `Footer.tsx`
- 현재 문제: 뉴스레터 기능 없음.
- 개선 방법: 이메일 입력 + "구독" 버튼. 클릭 시 "구독 완료" 인라인 메시지 표시 (백엔드 없이 UI만).
- 기대 효과: 사용자 참여 유도 UI.

### 항목 5: Footer 소셜 링크 + 연락처
- 대상 파일: `Footer.tsx`
- 현재 문제: 소셜 링크/연락처 없음.
- 개선 방법: 이메일, GitHub 등 아이콘 링크 + 연락처 정보.
- 기대 효과: 사이트 신뢰도 향상.

### 항목 6: loading.tsx shimmer 효과 적용
- 대상 파일: `loading.tsx`, `globals.css`
- 현재 문제: animate-pulse만 사용. 시각적으로 단조로움.
- 개선 방법: CSS shimmer 키프레임 (좌->우 그라데이션 이동) 추가. 스켈레톤 블록에 적용.
- 기대 효과: 프리미엄 로딩 경험.

### 항목 7: error.tsx 다크 테마 강화
- 대상 파일: `error.tsx`
- 현재 문제: 기능적이나 시각적 임팩트 부족.
- 개선 방법: 에러 코드 대형 텍스트, 보더 글로우 효과, 보다 명확한 다크 테마 적용.
- 기대 효과: 에러 상태에서도 브랜드 일관성 유지.

### 항목 8: not-found.tsx 다크 테마 강화
- 대상 파일: `not-found.tsx`
- 현재 문제: 기본적인 404 페이지.
- 개선 방법: "404" 대형 텍스트에 accent 포인트 색상. 홈 돌아가기 + 검색 링크 추가. 최근 기사 안내 텍스트.
- 기대 효과: 404에서도 사용자를 사이트 내에 유지.

### 항목 9: layout.tsx max-width 통일 확인
- 대상 파일: `layout.tsx`
- 현재 문제: 구조는 양호하나 확인 필요.
- 개선 방법: 기존 metadata/icons 완전 보존. max-w-screen-xl이 Header/Footer/main에서 동일하게 적용되는지 확인.
- 기대 효과: 레이아웃 일관성.

### 항목 10: Footer 'use client' 지시어 및 인터랙티브 요소
- 대상 파일: `Footer.tsx`
- 현재 문제: 현재 서버 컴포넌트. 뉴스레터 폼과 통계 fetch를 위해 클라이언트 컴포넌트로 전환 필요.
- 개선 방법: 'use client' 추가. useState로 뉴스레터 폼 상태 관리. useEffect로 stats fetch.
- 기대 효과: 인터랙티브 Footer 구현.
