# 자체 점검 — 슬라이스 S3 (Round 5 · 결함 수정)

## SPEC 개선 항목 체크
- [x] 항목 1: `src/lib/image-chain.ts`(`nextImageIndex`·`resolveImageSources`, 순수) + `src/components/ArticleImage.tsx`(plain `<img>`, onError 단계 전진, 마운트 시 `complete && naturalWidth===0` 검사로 하이드레이션 전 실패 복구, `key=list.join('\n')`로 소스 변경 시 리셋, 항상 `text-transparent`, 플레이스홀더 종착).
- [x] 항목 2: `NewsCard`/`NewsCardLarge` → `getArticleImageSources` + `ArticleImage`; `next/image`·`useState`·`getDefaultImage`·`setImgSrc` 제거. 이미지 링크 `tabIndex=-1`·`aria-hidden`, `alt=""`. 박스 높이(160/180, 200/260) 유지. Large 배지를 링크 밖 형제(`pointer-events-none absolute bottom-3 left-3`)로 이동.
- [x] 항목 3: `ArticleHeroImage` — `{sources?, src?, fallback?, alt?}`, `aspect-[16/10] sm:aspect-[2/1]` 프레임, `ArticleImage loading="eager"`. 현재 page의 `src/fallback/alt` 호출 그대로 빌드·동작(하위 호환 경로로도 플레이스홀더 종착).
- [x] 항목 4: `src/lib/pagination.ts`(`getPageItems` 고정 슬롯, `getPrevNext` 범위 안전) + `Pagination` 모바일 5칸(`h-10 min-w-9 px-1.5 tabular-nums`, gap `w-5`, `gap-1`)/sm+ 9칸(기존 치수), `flex-wrap` 안전망, `aria-current`는 원래 `currentPage` 일치 시만. `buildHref` 규칙 불변.
- [x] 항목 5: 카드·Large·Compact·티커 제목 `getDisplayTitle` + 제목 요소 자체에 `lang`. `TickerArticle.language?`, Compact props `language?` 추가.
- [x] 항목 6: 카드·Large·Compact 상대시간 `<time dateTime suppressHydrationWarning>`; 날짜 무효면 시계 아이콘 포함 시간 span 미렌더.
- [x] 항목 7: `NewsletterBanner` — `NEWSLETTER_ENABLED` 게이트(process.env 직접 읽기 0), `idle/submitting/success/error`, `subscribeNewsletter` 결과 2xx만 성공("구독 신청이 접수되었습니다."), invalid/기타 오류 문구, `role=status aria-live=polite`, sr-only label + id.
- [x] 항목 8: 배지 클래스는 `catStyle.border`(왼쪽 강조선) 리터럴 사용 유지, `.replace(`/템플릿 클래스 조합 0건(컴포넌트 내 `.replace(`는 URL 패턴 치환 2건뿐 — Pagination `[page]`, CountryTabs `[country]`(기존)).
- [x] 항목 9: 티커 `:hover, :focus-within` 일시정지, 루트 `aria-live` 제거 → `role="marquee" aria-label="속보"`. 복제본 aria-hidden/tabIndex·애니메이션 길이 유지.
- [x] 항목 10: `tests/pagination.test.ts`, `tests/image-chain.test.ts` — SPEC 표 케이스 전부 + 퍼즈(3,000회×siblings{0,2}).
- [x] 항목 11: ShareButtons `'idle'|'copied'|'failed'`(클립보드 성공 또는 `execCommand('copy')===true`만 성공), "복사 실패" 라벨, sr-only `role=status` 알림, 중복 토스트 제거(버튼 라벨 하나), 타이머 언마운트 정리. TrendingKeywords 빈 상태 "아직 집계된 인기 검색어가 없습니다."

## 수정 파일 목록
- 신규 `src/components/ArticleImage.tsx`, `src/lib/image-chain.ts`, `src/lib/pagination.ts`, `tests/pagination.test.ts`, `tests/image-chain.test.ts`
- 수정 `src/components/NewsCard.tsx`, `NewsCardLarge.tsx`, `NewsCardCompact.tsx`, `ArticleHeroImage.tsx`, `Pagination.tsx`, `BreakingTicker.tsx`, `NewsletterBanner.tsx`, `ShareButtons.tsx`, `TrendingKeywords.tsx`, `src/lib/types.ts`
- 변경 금지 대상(page.tsx 전부, S1/S2 파일, CountryTabs/BookmarkButton/AdSlot): `git diff --stat` 빈 출력.

## 검증 결과
- `npx tsc --noEmit`: 0 오류. `npm test`: tests 81 / pass 81 / fail 0 (기존 4 + 신규 2 파일).
- `qa-env.sh restart`: `APP UP (2s, css 200)` (rm -rf .next 후 프로덕션 빌드 성공).
- `node planner-s3-verify.js`: **8/8 passed** (T1 깨짐 0·alt 가시 0 / T2 하이드레이션 전 실패 4라우트 복구 / T3 16:10·2:1 / T4 320·375 8라우트 + page=999 / T5 CJK 4 normal·KO 14 keep-all / T6 / T7 / T8 30카드). page.tsx 미변경이지만 S4 몫 항목 없이 전부 통과(히어로는 하위 호환 경로로 통과).
- `audit.js s3-gen` vs `audit-s2-eval`: BROKEN_IMG **1,257 → 0**, OVERFLOW 1(mobile breaking-p7) → **0**, CONSOLE 19 → 17, PAGEERR 6 → 6, FAILED 12 → 12; 라우트별 신규 회귀 0 (남은 항목은 기존 404/401/500 픽스처 라우트).
- 육안: `peek/s3gen-home-0`(히어로 카드 플레이스홀더 프레임, alt 문장 없음), `peek/s3gen-p7-14`(`‹ 1 … 7 … 14 ›` 한 줄), `peek/s3gen-ja-0`(16:10 히어로 프레임, 일본어 제목).

## 디자인 자체 평가
- AI slop 패턴 사용 여부: 없음 (새 색·그라데이션·애니메이션 추가 없음).
- 독창적 요소: 실패 시에도 동일 크기 다크 프레임 유지, 원문 언어 `lang` 기반 줄바꿈, 터미널식 고정 5칸 등폭 페이지네이션.
- 다크 모던 테마 일관성: 기존 S1 토큰만 사용.

## 회귀 위험 확인
- 기존 기능 영향: 없음. 카드 이미지 박스 높이·북마크 위치·Large 배지 위치 동일, 페이지 링크 형식(`?page=N`, `[page]`) 불변. 의도된 변경: 공유 "복사됨" 토스트 제거(라벨로 일원화), 뉴스레터 배너는 플래그 off에서 미렌더(홈·[country]의 감싸는 `<section className="mt-12">` 빈 여백 정리는 S4 계약).
- TypeScript 오류: 없음.
- S4 인계: 상세 `ArticleHeroImage sources={getArticleImageSources(article)}` 전환, 홈 티커 매핑 `language: a.language` 추가, 배너 섹션 `NEWSLETTER_ENABLED &&` 감싸기.
