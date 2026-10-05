# 자체 점검 — 슬라이스 S2 (Round 5 결함 수정, Generator 1회차)

## SPEC 개선 항목 체크
- [x] 항목 1 (D10): `isAdminPath` 추가, Header/Footer 기본 export를 게이트(`SiteHeader`/`SiteFooter` 본문 분리, 훅 순서 불변)로 전환. `/admin/*`에서는 SSR 단계부터 사이트 크롬·하단 탭·통계 요청이 없음. `admin/layout.tsx`는 `max-w-7xl mx-auto px-4` 안으로 패딩 이동 + `flex-wrap`, 라벨 `whitespace-nowrap`, 바는 `div` 유지. 신규 `AdminNav`(`aria-label="관리자 메뉴"`, `aria-current` + `text-accent`, `/admin`은 정확 일치).
- [x] 항목 2 (D9): 루트 레이아웃의 `Suspense`·`Loading` 제거, `<main id="main" tabIndex={-1} className="flex-1 focus:outline-none">`. `src/app/loading.tsx` 삭제 → `src/components/PageSkeleton.tsx`(`role="status" aria-live="polite" aria-busy="true"` + sr-only 안내). `breaking/`, `ranking/`, `category/[slug]/`에만 1줄 re-export loading. `not-found.tsx`에 `metadata.title = '페이지를 찾을 수 없습니다'`.
- [x] 항목 3 (D26): `error.tsx` — `ErrorPage`로 이름 변경, `h1`, 홈 `<a href={withBasePath('/')}>`, 재시도 `startTransition(() => { router.refresh(); reset(); })`(전환 중 버튼 비활성), `console.error`·digest 유지.
- [x] 항목 4 (D11): `src/lib/newsletter.ts`(`isFlagOn`, `NEWSLETTER_ENABLED`(리터럴 `process.env.NEXT_PUBLIC_NEWSLETTER_ENABLED`), `NEWSLETTER_ENDPOINT`, `isNewsletterBannerPath`, `subscribeNewsletter`). Footer: 플래그 off면 뉴스레터 열 미렌더 + `lg:grid-cols-3`(두 그리드 클래스 완전 리터럴), 배너 경로에서는 폼 숨김, 폼은 sr-only `<label htmlFor>`, 제출 중 비활성, 결과는 `subscribeNewsletter` 결과로만(실패 문구 `role="status"`), 4초 리셋 타이머 언마운트 시 정리. `.env.example`에 플래그 블록 추가.
- [x] 항목 5 (S2-A): `GET /api/stats`(force-dynamic, `getCached('site:stats', 60)`, 정확히 3키, KST 자정 기준 `articlesToday`, 실패 시 500 `{error}`). `useSiteStats`: 모듈 스코프 in-flight Promise + 마지막 값 캐시로 Header·Footer 요청 1회 공유, 5분 공유 타이머(구독자 0이면 정리), `cache: 'no-store'`, `parseSiteStats` 검증. `livenews/api` 하드코딩·`{ next: { revalidate } }` 제거.
- [x] 항목 6 (S2-B): `formatKstClock`/`kstYear` 추가. LiveClock은 마운트 후 1초 간격 KST 라벨 + `<time dateTime=ISO-Z>` + 작은 `KST` 라벨(`text-text-muted`, 새 색 없음). Footer 연도 `kstYear()` + 직접 부모 `<p suppressHydrationWarning>`, `getFullYear` 제거.
- [x] 항목 7 (S2-C): 닫힌 검색창·모바일 메뉴·국가 플라이아웃에 `invisible`(transition 대상에 visibility 포함: `transition-[max-height,opacity,visibility,padding]` / `transition-[max-height,opacity,visibility]` / `transition-[opacity,transform,visibility]`). id `site-search`/`site-mobile-menu`/`site-country-menu`, 4개 토글 모두 `aria-expanded`+`aria-controls`(국가 `aria-haspopup="true"`), 햄버거 레이블 "메뉴" 유지. nav 레이블 "주요 메뉴"/"모바일 메뉴"/"하단 탭 메뉴". 모든 활성 링크 `aria-current="page"`, 하단 탭 홈 조건 단순화. ESC → 패널 닫고 연 토글로 포커스 복귀(국가/햄버거/검색 각 ref, 검색은 연 버튼 기억, `/` 단축키는 보이는 검색 토글). Hacker News `aria-label="Hacker News (새 창)"`, 아이콘 svg 전부 `aria-hidden`. SearchBar 입력 `aria-label="뉴스 검색"`.
  - 추가 수정(검증 T8 통과에 필요): 데스크톱 내비 띠의 활성 항목 자동 스크롤을 `Element.scrollIntoView` → `ul.scrollTo`(가로만)로 교체. Chromium에서 scrollIntoView가 순차 포커스 시작점을 활성 링크로 옮겨 첫 Tab이 "본문 바로가기"를 건너뛰었음(Planner `planner-s2-scrollintoview.js`로 확인된 현상). 시각 동작(활성 항목 중앙 정렬, smooth)은 동일.
- [x] 항목 8 (S2-D): `focusWithin` 상태 + header `onFocus`/`onBlur`(relatedTarget 포함 검사), `collapsed`에 `!focusWithin`. SPEC 대비 한 가지 정밀화: `onFocus`에서 `:focus-visible`(키보드 포커스)일 때만 true로 설정 — 마우스로 내비 링크를 클릭한 뒤 포커스가 남아 헤더가 접히지 않는 부작용을 막아 "마우스 사용자의 접힘 경험 불변"을 지킴. T14 PASS.
- [x] 항목 9 (S2-F): 바로가기 `focus:text-surface`(7.48:1), main `tabIndex={-1}`.
- [x] 항목 10 (S2-E): 열린 모바일 메뉴 `max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain`, 닫힘 `max-h-0 overflow-hidden invisible`.
- [x] 항목 11 (S2-G): 404 버튼 행 `flex flex-wrap items-center justify-center gap-3`, 라벨 `whitespace-nowrap`, `px-5 sm:px-6`, 장식 "404" 블록 `aria-hidden`. 푸터 `h3`→`h2`(클래스 동일), 카테고리 이모지 `aria-hidden`.
- [x] 항목 12 (D25): `tests/site.test.ts`(4 test), `tests/newsletter.test.ts`(3 test) — SPEC 표의 모든 행을 프로토타입 기대값 그대로 단언(+ Content-Type 헤더 단언 추가). node:test, 상대 import, 네트워크 없음, TZ 원복.

## 수정 파일 목록
- `src/components/Header.tsx`: 관리자 게이트, KST LiveClock, `useSiteStats` LiveStats, 접근성(항목 7), focusWithin(항목 8), 가로 모드 메뉴(항목 10), ul.scrollTo
- `src/components/Footer.tsx`: 관리자 게이트, 뉴스레터 플래그/정직한 폼, 3/4열 리터럴 분기, `useSiteStats`, KST 연도 + suppressHydrationWarning, h2·이모지 aria-hidden
- `src/components/SearchBar.tsx`: 입력 `aria-label`, 아이콘 `aria-hidden`
- `src/app/layout.tsx`: Suspense/Loading 제거, main tabIndex, 바로가기 대비
- `src/app/error.tsx`: ErrorPage, h1, basePath 홈, refresh+reset 재시도
- `src/app/not-found.tsx`: metadata 제목, 버튼 행 wrap/nowrap, 장식 aria-hidden
- `src/app/admin/layout.tsx`: 정렬·줄바꿈 수정, AdminNav 사용
- `.env.example`: `NEXT_PUBLIC_NEWSLETTER_ENABLED=false` 블록
- 삭제: `src/app/loading.tsx`
- 신규: `src/lib/site.ts`, `src/lib/newsletter.ts`, `src/hooks/useSiteStats.ts`, `src/app/api/stats/route.ts`, `src/components/PageSkeleton.tsx`, `src/components/AdminNav.tsx`, `src/app/breaking/loading.tsx`, `src/app/ranking/loading.tsx`, `src/app/category/[slug]/loading.tsx`, `tests/site.test.ts`, `tests/newsletter.test.ts`
- 수정 금지 파일(page.tsx, middleware.ts, api/admin/stats, NewsletterBanner.tsx, utils.ts, constants.ts) 변경 없음.

## 검증 결과 (실행 로그: `$SP/gen-s2-restart.log`, `$SP/audit-s2-gen.log`)
- `npx tsc --noEmit`: 0 오류
- `npm test`: tests 70 / pass 70 / fail 0 (신규 site 4 + newsletter 3 포함), `TZ=America/Los_Angeles npm test`: 70/70
- `qa-env.sh restart`: `APP UP (2s, css 200)` (next build 성공)
- `node planner-s2-verify.js`: T1, T2, T4~T14 PASS (13/14; T3는 하네스 필요)
- 하네스: T3 PASS(`status 500, h1 "문제가 발생했습니다", homeHref …/livenews → 200, recovered: true`), 플래그 ON T2B PASS
- 404: `/nope`, `/article/999999`, `/article/abc`, `/a/b` → 404; `/article/1`, `/breaking` → 200
- audit `s2-gen` vs `audit-s1-eval.json` (`eval-s1-compare.js s1-eval s2-gen`): 신규 OVERFLOW 0, 문서 scrollWidth 변화 0, main 텍스트 빈 화면 변화 0. 신규 항목은 art-404·country-404(3 뷰포트) 6건뿐 — 상태 200→404(의도된 D9 수정), 그에 따른 "Failed to load resource 404" 콘솔/실패 요청, Pretendard 차단 환경의 `Event` pageerror(SPEC 항목 2 참고에 따라 S2 회귀 아님).
- 관리자 스크린샷(`peek/s2gen-admin-0.jpg` 1440, `peek/s2gen-admin-m-0.jpg` 375): 사이트 헤더·푸터·하단 탭 없음, 관리자 바 로고/본문 좌측 정렬 일치, 375px에서 "LiveNews Admin"·"사이트로 돌아가기" 한 줄, 메뉴는 줄 단위로 wrap, 현재 메뉴 오렌지 강조.

## 디자인 자체 평가
- AI slop 패턴 사용 여부: 없음 (새 색·그라데이션·장식 없음)
- 독창적 요소: 시계에 Bloomberg 터미널식 `KST` 라벨(유일한 시각 추가, 기존 muted 토큰)
- 다크 모던 테마 일관성: 기존 토큰(surface/card/elevated, accent #f0883e, text-muted)만 사용, 푸터 h2는 같은 `text-overline` 클래스로 시각 불변

## 회귀 위험 확인
- 기존 기능 영향: 루트 로딩 스켈레톤이 홈·국가·기사·검색 경로에서는 더 이상 표시되지 않음(SPEC 의도 — 404 정상화의 대가, 로컬 응답 15~70ms). 관리자 대시보드는 여전히 `/api/admin/stats` 사용(변경 없음). 플래그 off 기본값으로 푸터 뉴스레터 열이 사라지고 3열 그리드.
- 알려진 기존 이슈(S2 범위 밖): 관리자 클라이언트 fetch 401(`/api/admin/sources` 등, D12 — S4).
- TypeScript 오류: 없음
