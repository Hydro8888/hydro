# QA 보고서 — 슬라이스 S3 콘텐츠 컴포넌트 (Round 5 · 결함 수정 · 1회차)

> Evaluator 독립 검수. SELF_CHECK-S3.md의 주장은 참고만 했고, 아래 수치는 모두 직접 실행해 얻었다.
> 대상: HEAD `345bbe1`(`git diff HEAD~1`), 16개 파일(+613/−264).
> SP=/tmp/claude-0/-home-user-hydro/0832edd1-f39e-53fc-97a8-a3a334add43a/scratchpad

---

## 0. 직접 실행 결과 요약

| 검증 | 결과 |
|---|---|
| `npx tsc --noEmit` | **0 오류** (현재 S4 호출부 `src`/`fallback`/`alt` 그대로 통과 → 하위 호환 확인) |
| `npm test` | **tests 81 / pass 81 / fail 0** (기존 4 + 신규 `pagination`·`image-chain` 2 파일) |
| `qa-env.sh restart` (`$SP/eval-s3-restart.log`) | `APP UP (2s, css 200)` — 프로덕션 빌드 성공 |
| `node planner-s3-verify.js` | **8/8 PASS** (T1~T8, 기준선 0/8) |
| `node audit.js s3-eval` (156 라우트×뷰포트) vs `audit-s2-eval.json` | BROKEN_IMG **1,257 → 0**, OVERFLOW **1 → 0**(mobile breaking-p7 소멸), CONSOLE 19 → 17, PAGEERR 6 → 6, FAILED 12 → 12. **라우트별 대조 결과 신규 콘솔/페이지 에러·실패 요청 0건** (남은 항목은 모두 기존 404/401/500 픽스처 라우트: art-404, country-404, admin-*, art-protorel, breaking-p14 tablet/desktop의 500 1건 — 기존 2건에서 1건으로 감소) |
| 범위 준수 `git diff --stat HEAD~1 -- src/app src/lib/{utils,constants,newsletter}.ts src/components/{CountryTabs,BookmarkButton,AdSlot}.tsx` | **빈 출력** |
| grep `next/image\|setImgSrc\|titleKo \|\|` (카드·티커·히어로) | 0건. `.replace(`는 URL 패턴 치환 2건(`Pagination [page]`, 기존 `CountryTabs [country]`)뿐, 클래스 생성 0 |
| `grep process.env NewsletterBanner.tsx` | 0건 |

### 독립 프로브 (`$SP/eval-s3-probe.js`, `eval-s3-ticker.js`, `eval-s3-nl.js`)

**A. 하이드레이션 전 실패 복구 직접 재현** — `/_next/static/chunks/*` 4초 지연 + `/api/img` **404 강제** + 외부망 차단:

| 뷰포트 · 라우트 | 하이드레이션 전 깨짐 | 최종 img | 최종 플레이스홀더 | 최종 깨짐 |
|---|---|---|---|---|
| 1440 `/` | 18 | 27 | 27 | **0** |
| 1440 `/breaking` | 27 | 30 | 30 | **0** |
| 1440 `/article/356` | 7 | 7 | 7 | **0** |
| 1440 `/article/1` | 7 | 7 | 7 | **0** |
| 375 `/` (스크롤 후 lazy 포함) | 6 | 27 | 27 | **0** |
| 375 `/article/356` | 7 | 7 | 7 | **0** |

→ 원본(404) → Unsplash(차단) → 인라인 SVG로 전 카드·히어로가 수렴. pageerror 0.
**A2.** `/api/img`를 3초 지연 후 404(하이드레이션 **후** 실패 = onError 경로) → 7/7 플레이스홀더, 히어로 864×432(2:1) 유지.

**B. 페이지네이션** `/breaking?page=1,7,14,999` (총 14쪽):

| 폭 | 문서 폭 | 행 폭 | 줄 수 | 화면 밖 | 링크 범위 | 표시 |
|---|---|---|---|---|---|---|
| 320 | 320 (4개 모두) | 296 | 1 | 0 | 1~14 | p7 `‹ 1 … 7 … 14 ›`, p14 `‹ 1 … 12 13 14 (×)` |
| 375 | 375 | 351 | 1 | 0 | 1~14 | 동일 |
| 768 | 768 | 736 | 1 | 0 | 1~14 | p7 `‹ 1 … 5 6 7 8 9 … 14 ›` |
| `?page=999` (전 폭) | — | — | 1 | 0 | 이전=14, 다음 비활성 | `aria-current` **없음**(14를 현재로 거짓 표시 안 함) |

**C. CJK 제목** (375): `/breaking?page=14` 일본어 `h3[lang=ja]`·중국어 `h3[lang=zh]` computed `word-break: normal`; `/search?q=日本`·`/search?q=中国` 동일; 한국어 제목 전부 `lang=ko`·`keep-all`; 영어 echo 제목 `lang=en`. 스크린샷 `peek/eval-s3-cjk-2.jpg`에서 중국어 제목이 줄 끝까지 채워짐 확인.

**D. 기타**
- 티커: Tab 16회로 첫 링크 포커스 → `animation-play-state: paused`, 1초 후 x 동일(102.34→102.34), 다음 링크로 Tab해도 정지 유지, 포커스 해제 후 재개. 루트 `aria-live` 없음.
- 1440 `/breaking` 이미지 박스 높이 {260, 180} 유지, 카드 img `alt!==""` 0개, 북마크 클릭 → `aria-pressed=true`.
- 클라이언트 이동 `/breaking` → 2쪽 링크 클릭 → 깨짐 0 (키 리셋 정상).
- 배지 border-left-color: `/category/economy` rgb(59,130,246), `/category/politics` rgb(239,68,68) (회색 아님). `/category/international-politics`는 기사 0건이라 확인 불가.
- 공유 복사: clipboard reject + `execCommand → false` → 버튼 "복사 실패", status "링크를 복사하지 못했습니다."; 권한 부여 시 "복사됨".
- 뉴스레터: 플래그 off → 홈 main email 입력 0. **플래그 on 빌드**(`NEXT_PUBLIC_NEWSLETTER_ENABLED=true` restart)에서 `a@b.co` 제출 → 엔드포인트 404 → "구독 요청을 처리하지 못했습니다…", "접수되었습니다"/"구독 완료" 미표시, sr-only label "이메일 주소" 존재 (`peek/eval-s3-nl.jpg`). 확인 후 플래그 없이 재시작 → 입력 0 복귀.

### 육안 확인
- `peek/eval-s3-home-0/1.jpg` (375 홈): 헤드라인 Large 카드가 어두운 프레임 + 사진 아이콘 플레이스홀더, alt 문장·깨진 아이콘 없음. 배지 "정치"가 좌하단에 유지. 티커·컴팩트 목록 정상.
- `peek/eval-s3-p7-14.jpg` (375 `/breaking?page=7`): `‹ 1 … 7 … 14 ›` 한 줄 중앙 정렬, 등폭 숫자, 활성 7은 accent. 터미널식 간결함이 의도대로 구현.
- `peek/eval-s3-hero-0.jpg` (1440 `/article/356`): 864×432 2:1 프레임, 본문 위치 고정. 다만 **이미지가 전혀 없을 때 화면 상단 절반을 거의 빈 회색 박스가 차지** — 정갈하지만 정보 없는 큰 면적이라 "프리미엄" 인상은 다소 약함(아래 비차단 지시 1).

---

## 1. SPEC 개선 항목 검증

- [PASS] 항목 1 `ArticleImage`/`image-chain`: `resolveImageSources`(빈값·중복 제거, 플레이스홀더 항상 마지막 1회), `nextImageIndex`(마지막에서 정지), `onError` 전진, 마운트 시 `complete && naturalWidth===0` 검사(`ArticleImage.tsx:45-50`), `key={list.join('\n')}` 리셋(`:26`), `text-transparent` 항상 병합(`:62`), `next/image`·`fetchPriority` 미사용. 프로브 A/A2 + T1/T2로 실증.
- [PASS] 항목 2 카드 전환: `getArticleImageSources` + `ArticleImage`, 이미지 링크 `tabIndex=-1`·`aria-hidden`, `alt=""`, 박스 높이 180/260 유지, Large 배지를 링크 밖 형제(`pointer-events-none absolute bottom-3 left-3`)로 이동(`NewsCardLarge.tsx:37-44`).
- [PASS] 항목 3 히어로: `{sources?, src?, fallback?, alt?}`, `aspect-[16/10] sm:aspect-[2/1]`, `loading="eager"`. 레거시 호출부로도 플레이스홀더·비율 적용(T3, 프로브 A2 864×432).
- [PASS] 항목 4 페이지네이션: 고정 슬롯 알고리즘이 SPEC 표 9+3 케이스와 일치, 퍼즈 3,000×2. 320/375/768 × 1/7/14/999 넘침 0·한 줄·링크 1~14, `?page=999`에서 `aria-current` 없음. `buildHref` 불변.
- [PASS] 항목 5 제목 `getDisplayTitle` + `lang`(제목 요소 자체), `TickerArticle.language?`, Compact props `language?`. `titleKo ||` 폴백 0건.
- [PASS] 항목 6 `<time dateTime suppressHydrationWarning>`이 텍스트 직접 부모, 날짜 무효 시 시계 아이콘 포함 미렌더(카드 3종). T6 PASS, hydration 오류 0.
- [PASS] 항목 7 뉴스레터: `NEWSLETTER_ENABLED` 게이트, 4상태, 2xx만 성공, invalid/기타 문구, `role=status`, sr-only label. 플래그 on 실측으로 정직한 실패 확인.
- [PASS] 항목 8 배지: `catStyle.border` 리터럴(왼쪽 강조선), 템플릿/치환 클래스 0, 카테고리 색 실측.
- [PASS] 항목 9 티커: `:hover, :focus-within` 정지(키보드 실측), `aria-live` 제거, 복제본 `aria-hidden`/`tabIndex=-1` 유지.
- [PASS] 항목 10 테스트: SPEC 표의 모든 케이스 + 퍼즈 + `getPrevNext` 전수 범위 검사, node:test·상대 import·신규 의존성 없음.
- [PASS] 항목 11 ShareButtons `idle/copied/failed`, `execCommand === true`만 성공, sr-only status, 타이머 언마운트 정리, 중복 토스트 제거; TrendingKeywords 문구 교체.

**11/11 PASS.**

---

## 2. 채점

**전체 판정**: 합격
**가중 점수**: 8.3 / 10.0  (8×0.3 + 7×0.2 + 9×0.25 + 9×0.15 + 9×0.1 = 2.4 + 1.4 + 2.25 + 1.35 + 0.9)

**항목별 점수**:
- 디자인 품질: 8/10 — 최악 조건에서도 카드·히어로가 같은 크기의 어두운 프레임으로 정돈, 페이지네이션 한 줄·등폭, 새 색/장식 없음. 단 히어로 전면 실패 시 864×432 빈 회색 박스는 정갈하나 밋밋하고, 플레이스홀더가 범용 사진 아이콘이라 브랜드감이 없다.
- 독창성: 7/10 — 원문 언어 `lang` 기반 줄바꿈, 터미널식 고정 5칸 페이지네이션, 하이드레이션 전 실패까지 복구하는 체인은 문제에 정확히 맞는 해법. 플레이스홀더 자체는 일반적인 패턴.
- 기술적 완성도: 9/10 — tsc 0, 81/81, 순수 함수 분리 + 퍼즈, 키 기반 리셋, 범위 안전. 소소한 견고성 결함(비정수 totalPages, 신규 마운트 live region) 존재.
- 기능성: 9/10 — 이미지 실패·모바일 페이지네이션·CJK 줄바꿈·키보드 티커·정직한 복사/구독 결과 모두 실측 동작.
- 회귀 안전: 9/10 — 라우트별 신규 오류 0, 카드 박스 기하·북마크·페이지 URL 형식 불변, 금지 파일 미변경. 콘솔 오류는 오히려 감소.

---

## 3. 회귀 검증
- TypeScript: 0 오류, 임포트 경로 모두 유효(`@/lib/image-chain`, `@/lib/pagination`, `./ArticleImage`).
- 기존 호출부 하위 호환: `article/[id]/page.tsx`의 `ArticleHeroImage src/fallback/alt`, 홈 티커 매핑(language 없음), `NewsCardCompact article as any` 모두 수정 없이 빌드·동작.
- 페이지 링크 형식 `?page=N` 불변(클라이언트 이동 `/breaking?page=2` 확인), 북마크 동작, 제목 링크 이동 정상.
- DB/API 무변경(src/app, 워커 diff 없음).

---

## 4. 구체적 개선 지시 (비차단 — 합격 판정과 무관, 후속 라운드/S4에서 처리 권장)

1. `src/components/ArticleHeroImage.tsx:22-30` — 체인이 플레이스홀더에 도달하면 2:1 전면 빈 박스가 기사 상단을 차지한다. `ArticleImage`에 `onSettled?(isPlaceholder)` 콜백(또는 `data-placeholder` 속성)을 추가하고, 히어로는 플레이스홀더 상태에서 `sm:aspect-[4/1]`처럼 낮은 비율로 줄이거나 카테고리 색 1px 상단 라인 + 출처명 워드마크를 넣어 "이미지 없음"을 단정하게 표현하라(레이아웃 이동은 첫 로드에서 플레이스홀더 확정 시 1회로 제한).
2. `src/lib/pagination.ts:5-7` — `normTotal`이 비정수 `total`(예 14.5)을 1로 취급해 `Pagination`이 `[1]`만 렌더하고 이전 링크가 1로 간다. `Math.floor(total)`(유한값이면)으로 정규화하고 `tests/pagination.test.ts`에 `(7, 14.5, 0)` = `(7, 14, 0)` 케이스를 추가하라. `Pagination.tsx:117`의 `totalPages > 1` 판정도 같은 정규화 값을 쓰도록.
3. `src/components/NewsletterBanner.tsx:83-86` — 성공 시 `role="status"` 요소가 **새로 마운트**되며 동시에 내용을 가져 일부 스크린리더가 알리지 않는다. 결과 영역 `<p role="status">`(현재 `:125`)를 폼/성공 분기 **밖** 항상 존재하는 하나로 두고 텍스트만 바꿔라.
4. `src/components/NewsCard.tsx:56`, `NewsCardLarge.tsx:64` — "N분 읽기" 아이콘 svg에 `aria-hidden="true"`가 없다(시계 아이콘에는 추가됨). 일관성 있게 추가하라.
5. `src/components/ArticleImage.tsx:26` — `key={list.join('\n')}`에 ~700자 데이터 URI가 매 카드 포함된다. 기능상 문제는 없으나 `list.slice(0, -1).join('\n')`(플레이스홀더는 항상 동일하므로 제외)로 키를 줄여라.

**방향 판단**: 현재 방향 유지
