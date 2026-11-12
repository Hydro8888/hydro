# QA 보고서 — 슬라이스 S3 콘텐츠 컴포넌트 (unslop 재작업 라운드 · 1회차)

> Evaluator 독립 검수. SELF_CHECK-S3.md의 주장은 검증 대상으로만 썼고, 아래 수치는 모두 직접 실행해 얻었다.
> 대상: 커밋 `5582735` (`git diff 8735a9b 5582735` — 수정 16, 신규 5, 삭제 0. S3 목록 밖 파일 변경 0).
> 계약 우선순위: UNSLOP-AUDIT 7절 > 3·6절 > SPEC-S3.

## 0. 측정 환경 — 어느 포트·어느 빌드인가

| 항목 | 값 |
|---|---|
| 빌드 A (모든 측정의 기준) | worktree `qa-out/eval-s3` = `5582735` + 추적되지 않는 임시 라우트 `src/app/qa-s3/`만 추가. `next build` 성공 → **:4115** (PID 23176, cwd 확인) |
| 빌드 B (플래그 켠 상태) | worktree `qa-out/eval-s3-flags` = 같은 커밋, `NEXT_PUBLIC_NEWSLETTER_ENABLED=true` `NEXT_PUBLIC_ADS_ENABLED=true` → **:4116** |
| :4105 | **내 서버가 아니다.** 첫 기동이 EADDRINUSE로 실패했고 `/qa-s3`가 404여서 바로 알았다. 그 서버(PID 19519, `gen-s2b`, S3 변경 없는 8735a9b 기반)에서 얻은 측정값은 없다. 이미지 프록시 오류의 **기준선 비교 1건에만 읽기 전용으로** 썼다(아래 3절) |
| 표식 확인 | :4115·:4116 홈 HTML — `news-ticker` 1, "자세히 보기" 0, "분 읽기" 0, `class="dateline` 40. :4105 — `news-ticker` 0, "자세히 보기" 29 |
| 작업 트리 | 소스 수정·빌드·:4000 재시작 없음. 쓴 파일은 이 보고서 하나와 `qa-out/eval-s3-*` |

로컬 DB의 기사 사진은 전부 가짜 호스트라 프록시가 415를 돌려준다 → 화면의 사진은 모두 스톡 대체 사진(흑백)이다. 머리기사의 "원색 보도 사진"은 Playwright에서 `/api/img/**` 첫 요청에 수정 전 운영 화면에서 잘라 낸 실제 보도 사진을 응답시켜 확인했다(`eval-s3-shots/{d,m}-qa-colorlead-*.jpg`).

스크립트·기록: `qa-out/eval-s3-verify.js`(.log), `eval-s3-audit.js`(.log, .json), `eval-s3-func.js`(.log), `eval-s3-extra.js`(.log), `eval-s3-img.js`, 화면 `qa-out/eval-s3-shots/`.

## 1. 직접 실행 결과 요약

| 검증 | 결과 |
|---|---|
| `npx tsc --noEmit` | 오류 0 |
| `npm test` (커밋 상태) | **368 pass / 0 fail**. SELF_CHECK의 376은 작업 트리에 있던 다른 에이전트의 미커밋 테스트 포함 수치 — 커밋 기준으로는 368 |
| `next build` | 성공 (A·B 모두) |
| `eval-s3-verify.js` (Generator 사본의 포트만 4115로) | **S3 VERIFY CLEAN**, NOTE 4건(홈 `lead`·`rank` — S4 연동 대기) |
| 계산 스타일 감사 12 라우트 × 4 뷰포트(1440·768·390·320) | 가로 넘침 0/48, 상태 200 전부, 콘솔 오류는 리소스 415/404뿐(하이드레이션·페이지 오류 0) |
| 라우트 상태 코드 | 200: `/livenews` `/world` `/us` `/japan` `/china` `/breaking`(`?page=7`,`?page=abc`) `/ranking`(`?country=us`) `/category/economy` `/search?q=AI` `/article/1·393·406` `/api/articles` `/api/trending` · 307: `/breaking?page=9999` → `?page=14` · 404: `/category/quantum-weird` `/article/407` `/article/999999` `/nope` · 401: `/admin` |
| 변이 테스트 20건 | **19 검출 / 1 생존** (5절) |

## 2. SPEC 항목 검증

- [PASS] **항목 1 아이콘**: S3 파일 15개의 `<svg` 0줄. `icons.tsx` diff는 추가 25줄·삭제 0줄(7-21). 화면의 S3 아이콘 전부 16×16, `stroke-width 1.5px`, 색은 글자 역할색(secondary 170,163,152 / muted). 카드당 svg 2개.
- [PASS] **항목 2 NewsCard + NewsCardMeta**: "자세히 보기"·"분 읽기" 0. 카드 안 `<a>` 2개(제목, 원문) + `<button>` 1개, 중첩 인터랙티브 없음. 패딩 20px, 반지름 12px, 그림자·블러·그라데이션 0. hover 배경 `rgb(38,36,33)`, 이미지 transform `none`, 제목 색 불변.
- [PASS] **항목 3 NewsCardLarge**: 사진 위 요소 0, 제목 Pretendard 500 20px 3줄, `/breaking` 390px 상위 카드 제목 잘림 없음.
- [PASS] **항목 4 lead** (임시 라우트에서 실제 하이드레이션 상태로 측정): `Noto Serif KR` 600, 자간 normal, `text-wrap: balance`. 크기 320/390/768/1440 = short 28/28/34.56/40, medium 20/20/34.56/40, long 20/20/28/28. 줄 수 short 4/3/2/2, medium 4/3/2/2, long 4/4/3/3(말줄임 — 99단위 제목이라 의도대로). 일반 큰 카드에는 serif 없음. 사진 224/224/320/384px, 1440에서 카드 614px(제목 2줄·요약 1줄). 영문 제목의 g·y·p 아랫부분 잘림 없음(`d-qa-lead-en.jpg`).
- [PASS] **항목 5 NewsCardCompact**: 시각 칸 폭 48px × 8행(4 뷰포트 모두), 제목 x좌표 한 값, 시각 첫 줄과 제목 첫 줄의 기준선 차 0px(기준선 탐침으로 측정), 행 65/85px(64·84 + 헤어라인 1), `MM.DD HH:mm`·`YYYY.MM.DD` 모두 48px 안 2줄(`scrollWidth` 48), 날짜 없으면 `aria-hidden` 빈 칸. `rank` 주면 24px 고정폭 숫자 + 메타 줄에 시각.
- [PASS] **항목 6 BookmarkButton**: `backdrop-filter none`, 배경 투명, 8px, 32×32. 저장됨(hover 아닌 상태) 색·채움 `rgb(239,233,222)`, 저장 안 됨 `rgb(170,163,152)`·`fill none`.
- [PASS] **항목 7 ArticleImage**: diff는 임포트 1줄·주석·`isStandIn`·`data-standin`·className 뿐. 스톡 ⇔ `data-standin` ⇔ `grayscale` 불일치 0(자연 29장, 프록시 실패 30장). 원본 사진·AI 이미지 경로 `filter: none`.
- [PASS] **항목 8 ArticleHeroImage**: 모든 이미지 차단 시 `[data-no-image]` 4:1(390은 3:1), `border-top 0`, 워드마크 `text-transform none`·자간 normal·muted. 히어로 `loading=eager` `fetchpriority=high` 유지.
- [PASS] **항목 9 BreakingTicker**: 라벨 글자 `rgb(234,93,97)`(7-2 값)·배경 투명, 띠 `rgb(22,21,19)` 40px, 페이드 2개 모두 `22,21,19`의 투명도 변화, ul 외 애니메이션 0.
- [PASS] **항목 10 Pagination**: 현재 쪽 = `rgb(38,36,33)` 면 + 헤어라인 + accent 글자, 나머지 투명, 40px, 8px, Plex Mono tabular.
- [PASS] **항목 11 CountryTabs**: 5개 한글 라벨, 영문 병기 0, 높이 40, 현재 탭 1개만 accent + 2px 밑줄.
- [PASS] **항목 12 TrendingKeywords**: 제목 "카테고리별 기사 수", `politics` → `정치` + `/category/politics` + `45,042`, 알 수 없는 값 → 원문 + `/search?q=`, 행 40px, 건수 열 오른쪽 끝 한 값.
- [PASS·결함 1] **항목 13 ShareButtons**: svg 0, 외부 링크 3 + live region, 32px·8px. **복사 버튼 폭이 흔들린다** — 4절 D-1.
- [PASS] **항목 14 NewsletterBanner**: 주장 문구 0, 중립 면, 입력·버튼 40px, 주 버튼 `rgb(239,233,222)` 면 + `rgb(22,21,19)` 글자, 닫기 32×32, 그라데이션 0. 플래그 꺼짐 → 렌더 없음(:4115 홈).
- [PASS] **항목 15 AdSlot·AdminLoadError·AdminLoading**: 728×90 / 300×250 / 높이 128, 오류 선 `2px rgb(234,93,97)`, 버튼 40px·8px, "다시 시도" 2회 클릭 → 콜백 2회, 스피너 중립색.
- [PASS·보완 1] **항목 16 테스트**: 새 테스트 4개 파일 실행 확인(이름으로). 변이 1건 생존 — 5절.

### 6절 인터페이스 · 7절 결정

| # | 판정 | 근거 |
|---|---|---|
| 6절 API | PASS | `NewsCardCompact{article, rank?}`, `NewsCardLarge{article, priority?, lead?}`, `data-standin`+`img-standin`, props 변경 없음(page.tsx 무수정으로 빌드 통과) |
| 7-1 | PASS | muted `rgb(145,139,129)` on elevated = 4.58:1(계산). 감사에서 4.5 미만 글자 0건 |
| 7-2 | PASS | live on surface 5.42:1, negative 글자 on card 5.16:1 |
| 7-3 | PASS | Plex Mono가 걸린 글자에 비ASCII 0건(`(HTTP 502)`, 쪽 번호, 건수, 순위, 시각뿐) |
| 7-4 | PASS | 세 형식 모두 렌더. `<time dateTime suppressHydrationWarning>` |
| 7-5 | PASS | 600은 lead h2와 S4의 기사 h1뿐. 그 밖 400/500 |
| 7-7·15 | PASS | `BTN_PRIMARY` `BTN_SECONDARY(_SM)` `BTN_GHOST_SM` `FIELD` `NUM` `PANEL` 사용, S3 자체 버튼 클래스 0 |
| 7-9·18 | PASS | 애니메이션은 `ticker`·`spin` 둘뿐, 진입 0 |
| 7-19 | PASS | 탭·티커 항목·목록 행·건수 행 포커스 링 `offset -2px`(스크린샷 확인) |
| 7-20 | PASS | 배너 문구가 `Footer.tsx:63-64`와 글자까지 같음 |
| 7-21 | PASS | 새 아이콘 파일 없음, export 3개 추가만 |
| 7-22 | PASS | 항목 12 |
| 7-23 | PASS | 사진·요약·빈 여백 클릭 모두 `/article/4`로 이동, 원문·북마크는 따로 눌림 |
| 7-24 | PASS | `/api/generated-image/…` → `photo`, `filter none`(테스트 2건 + 화면) |

### SELF_CHECK "SPEC과 다르게 한 점" 판정 (12건 전부)

| # | 내용 | 판정 |
|---|---|---|
| 1 | 아이콘 버튼을 `BTN_GHOST_SM`으로 | 타당(7-7·15). 부작용은 4절 D-3 |
| 2 | 아이콘 이름(`ExternalIcon` 재사용, Chevron 2개) | 타당(7-21, 파일 규칙) |
| 3 | lead 굵기를 `headline.ts`에 | 타당. 7-5 때문에 필요하고 테스트가 고정(변이 `weight-lead-medium` 검출) |
| 4 | `YYYY.MM.DD`를 `<wbr>`로 48px 칸에 | 타당. 실측 2줄·넘침 0·행 높이 불변. 80px 칸보다 낫다(320px에서 제목 폭이 이미 194px) |
| 5 | CountryTabs `border-b-2` | 타당. 헤더 내비와 같은 문법, 40px·2px 실측 |
| 6 | 티커 항목 `h-8` | 타당(30.4px → 32px, 격자) |
| 7 | 비활성 화살표 `opacity-50` | 타당(ui.ts와 같은 값) |
| 8 | ShareButtons `BTN_SECONDARY_SM` | 방향은 타당하나 **`min-w-20`이 더는 맞지 않는다** — D-1 |
| 9 | 뉴스레터 문구를 푸터와 같게 | 타당(7-20 "동일 문구"). 해지 문구 삭제도 맞다(해지 수단 없음) |
| 10 | 메타 줄 `-my-2` | 타당. 글리프가 카드 오른쪽·아래에서 각각 21px(패딩 20 + 테두리 1) |
| 11 | 원문 링크 `stopPropagation` 삭제 | 타당. 클릭 시 새 창 열리고 본 창 주소 불변 |
| 12 | hover 시 메타 색 올리기 삭제 | 타당(4.58:1). 다만 `group` 클래스가 죽은 채 남음 — D-4 |

### 검증 스크립트 사본의 기대값 변경 판정

`diff planner-s3-verify.js gen-s3-verify.js`로 직접 대조. ① live 색 → 7-2 값: 타당. ② `YYYY.MM.DD` 추가: 타당(7-4). ③ 요약 hover·클릭을 좌표로: 타당 — 덮는 링크가 히트 대상인 것이 7-23의 구조이고, 내 스크립트의 `elementFromPoint`도 요약 중앙이 제목 `<a>`임을 확인. ④ `data-lead` 없음을 NOTE로: 타당(page.tsx는 S4). ⑤ 브라우저 경로: 무관.

## 3. unslop 9개 패스 실측 (S3 컴포넌트 범위)

| 패스 | 실측 | 판정 |
|---|---|---|
| 1 간격 | 패딩·마진·gap에서 4px 격자 밖 값: S3 컴포넌트 0(감사에 잡힌 6px·10px는 기사 상세 page.tsx의 태그·details — S4). 카드 패딩 20 통일, 컨트롤 32/40, 행 64/84(+헤어라인). 시각 칸 48 고정 | PASS |
| 2 색 | 글자색 6가지(text·secondary·muted·accent·live·accent-ink), 면 4가지(surface·card·elevated·text), 테두리는 헤어라인 2단계 + accent 밑줄 + negative 선. Tailwind 팔레트 색 0. accent는 현재 탭·현재 쪽 2곳뿐 | PASS |
| 3 아이콘 | 한 벌, 16px/1.5, 인라인 svg 0, 이모지 0 | PASS |
| 4 문구 | CTA·읽기 시간·느낌표·확인 불가 주장 0. 마침표는 두 문장짜리 2곳만 | PASS |
| 5 서체 | 굵기 400/500, 600은 lead만. uppercase·italic·음수 자간 0(S3 범위). 숫자는 Plex Mono tabular, 건수 쉼표·쪽 번호 무쉼표(식별자) | PASS |
| 6 레이아웃 | 사진 위 요소 0, 카드 안 카드는 S3 컴포넌트 안에는 없음(홈 카테고리 패널은 S4) | PASS |
| 7 디테일 | 반지름 집합 {12, 8, 9999(스피너)} — 6px는 S4의 기사 태그. 포커스 링 `2px solid accent` 한 가지(안쪽/바깥쪽 offset만 다름). hover 존재: 카드·행·쪽 번호·티커 항목 → elevated, 아이콘 → 글자색. pressed 상태는 어디에도 없음(ui.ts 몫) | PASS, 약점 D-3 |
| 8 비주얼 | 스톡만 흑백, 원본·AI 원색, 플레이스홀더 필터 없음. **밝은 스톡 사진이 화면에서 가장 밝다** — D-2 | 조건부 |
| 9 모션 | `transition-property`에 `all` 0, 지속 150ms·easing 한 가지. 티커 `40s linear infinite`, hover·포커스 시 `paused`, 포인터가 떠나면 재개. reduced-motion에서 x=0 정지, 전환 1e-05s | PASS |

### 방향이 보이는가 (스크린샷을 직접 봄)

- 수정 전(`before/prod/d-home-0.jpg`, `m-breaking-1.jpg`): 빨간 속보 배지, 색 배지, 사진 위 그라데이션·블러 북마크, 주황 "자세히 보기", 28px 굵은 제목이 "…"로 잘림.
- 수정 후 임시 라우트(`d-qa-colorlead-firstscreen.jpg`): 원색 보도 사진 + 40px 명조 2줄 + 그 아래 `12:07 / 11.11 10:08 / 2025. 12.30`이 찍힌 목록. 이 화면은 제품 이름을 바꾸면 어색하다 — 방향이 보인다.
- 그러나 `/breaking`·`/category`·`/ranking`의 카드 격자(`c-d-breaking-0.jpg`)는 "조용한 뉴스 카드 격자"에 12px 고정폭 시각 한 줄이 붙은 정도다. 시그니처가 작고, 그 화면만 보면 다른 뉴스 제품에도 통한다. 모먼트 두 개가 홈에만 있는 설계의 한계이며 S3 범위 안에서 더 밀 여지는 크지 않다.

## 4. 기능 회귀 + 발견한 결함

| 검사 | 결과 |
|---|---|
| 북마크 | 클릭 → `aria-pressed=true`·라벨 "북마크 해제"·주소 불변·`localStorage livenews_bookmarks=[4]`, 새로고침 후 유지, 재클릭 해제. Space 키 동작. SSR은 항상 `false`(하이드레이션 안전) |
| 공유 | 복사 → 클립보드 내용 = 원문 주소, 라벨 `복사됨`, live region `링크를 복사했습니다`, 2초 뒤 복귀. 실패 경로 → `복사 실패` / `링크를 복사하지 못했습니다`, 색 불변. 링크 3개 주소·`target=_blank`·`rel=noopener noreferrer`, X 클릭 시 새 창 |
| 원문 링크 | 새 창 + rel, 본 창 주소 불변 |
| 카드 클릭 영역 | 사진·요약·카드 아래 여백 → 기사. 원문·북마크 중앙의 히트 대상은 각자 자신. Tab 순서 제목 → 원문 → 북마크, 셋 다 `2px solid rgb(240,136,62) offset 2px` |
| 이미지 체인 | 자연: 깨진 이미지 0. 프록시 502: 30장 전부 스톡(흑백). 외부 전부 차단: 30장 플레이스홀더, 깨짐 0, 필터 0. **하이드레이션 전 실패**(JS 청크 2.5초 지연 + 프록시 404): 30장 전부 스톡으로 복구. lead: `eager`·`fetchpriority=high`·srcset 6단계·sizes 유지 |
| 프록시 415 | `/`, `/breaking`, `/category/economy` 합계 — `5582735@4115` **415 × 55**, `8735a9b 기반@4105` **415 × 55**. 같은 수. `src/app/api/**` diff 없음. → **기존 동작(픽스처의 가짜 이미지 호스트), 이번 변경의 회귀 아님.** 502는 재현되지 않음 |
| 페이지네이션 | `?page=1/7/14`: 링크 1..14 범위, `aria-current` 한 줄에 1개, 첫·끝에서 이전·다음 비활성. `?page=9999` → 307 → 14. `abc/0/-3` → 1쪽. "다음" 클릭 → `?page=8`. 320px: 5497쪽 마지막 283px(가용 288) 한 줄, 10000쪽만 두 줄 |
| 티커 | 스크롤 진행, hover 정지, Tab 포커스 정지·링 보임, 복제 10개 `aria-hidden`+`tabindex=-1` |
| 국가 탭 | `aria-current` 1개(미국), 320px에서도 5개가 한 줄에 들어가 스크롤 불필요 |
| 하이드레이션 | 브라우저 시간대 `America/Los_Angeles`·`Pacific/Kiritimati`에서 SSR 시각 = CSR 시각, 오류 0 |
| 뉴스레터(:4116) | 잘못된 주소 → "올바른 이메일 주소를 입력해 주세요"(negative, `aria-invalid`), 올바른 주소 → 백엔드 라우트가 없어 오류 문구(성공 표시 안 함 — 맞다), 닫기 → 새로고침 후에도 숨김 |
| JS 없음 | 카드 링크 2개·시각·버튼 정상 렌더 |

### 결함·약점

- **D-1 (기능·작음) 복사 버튼 폭이 6px 줄었다 늘어난다.** `ShareButtons.tsx:85`의 `min-w-20`(80px)은 SPEC의 12px 글자 기준이었다. `BTN_SECONDARY_SM`(14px medium)으로 바꾸면서 "링크 복사"가 **85.73px**, "복사됨"이 **80px**이 됐다(1440px 실측). SELF_CHECK의 "폭 80 → 80"은 사실이 아니다.
- **D-2 (디자인·중간) 밝은 스톡 사진이 화면에서 가장 밝은 요소다.** `.img-standin`의 `brightness(0.9)`. 카드 사진 영역 평균 밝기(0–255) — 스톡: 달러 154, 실험실 유리 172, 복도 165, RYZEN 119(200 초과 화소 20–32%) / 실제 보도 사진: 46–83(200 초과 2–5%) / 카드 본문 36. "원색은 실제 사진만, 대체 사진은 조용히"라는 방향인데 대체 사진이 밝기로 튄다(`c-d-home-2.jpg`, `c-d-breaking-0.jpg`). 값은 S1 파일(`globals.css:113`)에 있다.
- **D-3 (디테일·작음, Generator가 보고한 것) hover된 카드 위에서 아이콘 버튼의 hover 면이 안 보인다.** 실측: 카드 hover 배경 `rgb(38,36,33)` = 버튼 hover 배경 `rgb(38,36,33)`. 다만 아이콘 색은 `170,163,152 → 239,233,222`로 바뀌므로 hover 피드백은 있다. SPEC 규칙 2("아이콘뿐인 조용한 링크는 글자색만")와도 맞는다. **실제 문제는 아니다.** 남는 것은 같은 클래스가 기사 상세(surface 위)에서는 면이 보이고 카드에서는 안 보이는 불일치뿐 — ui.ts에 아이콘 전용 클래스가 생기면 정리된다(S1).
- **D-4 (코드·사소) 죽은 `group` 클래스.** `NewsCard.tsx:17`, `NewsCardLarge.tsx:27` — `group-hover:` 사용처가 0이 됐다.
- **D-5 (접근성·기존 동작) reduced-motion에서 티커가 x=0에 멈추면 띠 밖 항목은 마우스 사용자가 볼 방법이 없다.** 이번 변경 전과 같다. 회귀 아님.
- 그 밖: 아이콘 버튼 32×32 두 개가 간격 0으로 붙어 있다(WCAG 2.2 최소 24px은 충족, 빗나가면 기사로 이동). pressed(`active:`) 상태가 버튼 전반에 없다(ui.ts).

## 5. 테스트 품질 — 변이 20건

`tests/unslop-s3.test.ts` `s3-components.test.ts` `headline.test.ts` `image-chain.test.ts`만 돌려 확인(worktree에서, 매번 원복).

검출 19: 사진 위 `bg-gradient-to-t`, 큰 카드 `font-bold`, 티커 `uppercase`, 시각 칸 `w-12` 제거, `rel` 축소, 모든 이미지에 `img-standin`, 현재 쪽 accent 면, 단계 경계 30→35, 덮는 링크 제거, 제목 이모지, `transition-all`, `group-hover:scale-105`, 일반 카드에 `font-serif`, rank 없는데 순위 표시, AI 이미지 흑백, "자세히 보기" 복귀, 복제 항목 포커스 가능, `h-[160px]`, lead medium 굵기 누락.

**생존 1**: `NewsCardMeta.tsx:32`에서 `relative z-10` 제거. 이 두 클래스가 원문·북마크를 덮는 링크 위로 올리는 유일한 장치다. 빠지면 두 버튼을 눌러도 기사로 이동하는데 테스트 368건이 전부 통과한다.

## 6. 채점

**전체 판정**: 합격
**가중 점수**: 7.6 / 10.0  (7×0.3 + 7×0.2 + 8×0.25 + 8×0.15 + 9×0.1)

**항목별 점수**:
- 디자인 품질: 7/10 — 색·간격·서체·모서리·모션이 토큰대로 한 가지 규칙이고 대비 미달 0. 밝은 스톡 사진이 조용해야 할 자리에서 가장 밝고(D-2), pressed 상태가 없으며, 홈 밖 카드 격자는 평범하다.
- 독창성: 7/10 — 명조 머리기사 + 원색 사진 + 48px 통신 시각 칸은 이 제품의 것으로 읽힌다. 카드의 시그니처는 12px 한 줄로 작고, 홈 밖 화면은 이름을 바꿔도 통한다.
- 기술적 완성도: 8/10 — tsc·테스트·빌드 통과, 토큰과 ui.ts만 사용, 변이 19/20. `z-10` 미검증(생존 변이), 죽은 `group`, SELF_CHECK의 공유 폭 수치 오류, `<wbr>` 서버 전용 제약이 주석으로만 지켜짐.
- 기능성: 8/10 — 북마크·공유·원문·카드 전체 클릭·키보드·페이지네이션·티커·탭 모두 동작. 복사 버튼 폭 흔들림(D-1), 붙어 있는 32px 터치 대상.
- 회귀 안전: 9/10 — 회귀 0건. 프록시 415는 기준선과 같은 55건. 의도된 변경 2가지(상대 시각 → 통신 시각, 카테고리 건수 링크)는 계약대로.

**구체적 개선 지시** (합격이므로 재검수 조건은 아니다. S3 파일은 다음 손댈 때 반영):
1. `src/components/ShareButtons.tsx:85` — `min-w-20` → `min-w-24`(96px ≥ 85.73px). 주석의 "keeps the row still"이 다시 사실이 된다. SELF_CHECK의 "폭 80 → 80"도 고칠 것.
2. `tests/s3-components.test.ts`(NewsCard 묶음) — 원문 링크와 북마크 버튼을 감싼 요소의 class에 `relative`와 `z-10`이 함께 있는지 단언 추가. 변이 `drop-z10-actions`가 살아남았다.
3. `src/components/NewsCard.tsx:17`, `src/components/NewsCardLarge.tsx:27` — `group` 삭제(`group-hover:` 0곳).
4. (선택) `src/components/BreakingTicker.tsx:30` 트랙 래퍼 — reduced-motion에서 멈춘 띠를 가로 스크롤할 수 있게 `motion-reduce:overflow-x-auto scrollbar-none`. 기존 동작이라 감점 사유는 아님.

**방향 판단**: 현재 방향 유지

## 7. S1에 넘길 것 (S3가 고칠 수 없는 파일)

1. `src/app/globals.css:113` `.img-standin` — `brightness(0.9)` → `0.65` 안팎. 근거 D-2(스톡 평균 밝기 154–172 vs 보도 사진 46–83). 0.65면 최대 밝기가 약 166으로 본문 글자(233) 아래로 내려간다. `tests/design-tokens.test.ts`가 값을 고정하고 있으면 함께 수정.
2. `src/lib/ui.ts` — 아이콘 전용 버튼 쌍(40 / 32, hover는 글자색만)과 `active:` 눌림 상태. 지금은 `Header.tsx`의 `ICON_BTN`과 S3의 `BTN_GHOST_SM`이 따로다(D-3).

## 8. S4에 넘길 것

1. 홈 `page.tsx:88`에 `lead`, `:99`·`:166`의 `rank` 삭제 — 검증 NOTE 4건이 이것. 그 뒤 `planner-s3-verify.js`의 lead·통신 목록 검사가 실제 페이지에서 돈다.
2. **오른쪽 칼럼을 `lg:grid-rows-2`로 늘리는 방법은 다시 볼 것.** 임시 라우트에서 그대로 해 보니 큰 카드 2장이 각 600px로 늘어나 요약과 메타 줄 사이에 150px가량 빈 띠가 생긴다(`c-d-qa-0.jpg`). 높이는 맞지만 죽은 여백이 된다 — 늘리지 않고 위로 정렬하거나, 오른쪽에 카드 한 장을 더 두는 쪽을 비교.
3. 통신 목록은 발행 시각 내림차순으로(7-11). 지금 데이터 순서로는 `11.07 → 11.06 → 11.11 → 11.09`로 시각이 뒤섞여 "전문 목록"으로 읽히지 않는다. 패널 패딩 16 이상(행이 `-mx-2`). `NewsCardCompact`는 서버 컴포넌트에서만 임포트.
4. 티커 래퍼 `page.tsx:66`의 `rounded-lg overflow-hidden`(실측 반지름 8px)이 위아래 헤어라인 끝을 깎는다.
5. 홈 카테고리 패널 안의 `NewsCard` = 카드 안 카드. 섹션 제목 옆 주황 막대, `animate-fade-in`.
6. 기사 상세 `article/[id]/page.tsx`에 남은 것(감사에 잡힘): `uppercase tracking-widest` 오버라인 2곳(자간 1.2px), 원제목 `italic`, 14px·12px `stroke 1` 아이콘, `border-accent/60`, 6px 태그의 좌우 패딩 10px, gap 6px, 통신 시각 옆 상대 시각 "4일 전" + 시계 아이콘.
7. `/ranking`의 주황 원형 순위 배지가 카드 모서리에 얹혀 있다. `/breaking` 머리의 "속보" 태그와 `409개` 배지.
8. `getCategoryStyle`·`timeAgo`는 이제 page.tsx 2곳만 쓴다. `estimateReadingTime`은 사용처 0(7-13).
9. 범위 밖 사실: "카카오톡" 공유 주소가 `story.kakao.com/share`(카카오스토리)다. `/api/newsletter` 라우트가 없다(플래그 꺼짐이라 노출 안 됨).
