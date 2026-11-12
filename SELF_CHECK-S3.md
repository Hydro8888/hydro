# 자체 점검 — 슬라이스 S3 (unslop 재작업 라운드 · 1회차)

계약: `SPEC-S3.md` 항목 1~16, `UNSLOP-AUDIT.md` 3절·6절, **7절이 SPEC과 다르면 7절 우선**.
S1 의존 목록(SPEC "S1 의존 목록")은 수정 전에 확인했고 전부 있었다(`formatWireTime`·`formatCount`, `.dateline`·`.img-standin`·`:focus-visible`·`.scrollbar-none`, 토큰, `src/lib/ui.ts`, `src/components/icons.tsx`).

> **작업 중 관찰.** 같은 작업 트리에서 S2 파일이 다른 에이전트에 의해 동시에 바뀌고 있었다(`Header.tsx`, `Footer.tsx`, `layout.tsx`, `admin/layout.tsx`, `AdminNav.tsx`, `PageSkeleton.tsx`, `tests/chrome-unslop.test.ts` — 02:44 UTC 전후). 나는 그 파일들을 건드리지 않았다. 아래 `npm test` 376건에는 그쪽이 추가한 테스트가 포함돼 있다.

## SPEC 개선 항목 체크

- [x] 항목 1 (아이콘 한 벌): S3 파일의 인라인 `<svg>` 15개 → 0개. 기존 `icons.tsx`에 `BookmarkIcon({filled})`, `ChevronLeftIcon`, `ChevronRightIcon` 3개만 추가(7-21), 원문·닫기는 S2의 `ExternalIcon`·`CloseIcon` 재사용. 카드당 아이콘 5 → 2.
- [x] 항목 2 (NewsCard + NewsCardMeta): 사진 → 분야 글자 라벨 → 제목(카드 전체를 덮는 링크) → 요약 → `매체 · 통신 시각` + 원문·북마크. "자세히 보기"·"N분 읽기"·시계/책/화살표 아이콘·색 배지·사진 위 북마크·`transition-all`·hover 확대 삭제. 패딩 20, 사진 `h-40 sm:h-44`.
- [x] 항목 3 (NewsCardLarge 일반): 사진 위 그라데이션·블러 배지·북마크 삭제, 제목 `text-headline-md` 3줄, 사진 `h-52 sm:h-64`, 같은 메타 줄.
- [x] 항목 4 (lead): `lead?: boolean` → `data-lead`, 명조 제목(`font-serif`), 길이 단계(`src/lib/headline.ts`), 사진 `h-56 sm:h-80 lg:h-96`, `pb-1`(내림 획 잘림 방지), 요약 `max-w-xl`.
- [x] 항목 5 (NewsCardCompact): `rank` 없으면 왼쪽 48px 칸에 통신 시각, 있으면 순위(고정폭) + 메타 줄에 시각. 날짜 없으면 같은 폭 빈 칸. hover는 면 한 단계.
- [x] 항목 6 (BookmarkButton): 블러·원형·accent 틴트·pop 애니메이션·`animating` 상태 삭제. 32px 고스트 버튼, 저장됨 = 채운 글리프 + `text` 색 + `aria-pressed`.
- [x] 항목 7 (ArticleImage): `imageSourceKind`/`isStandInImage` 추가, 스톡 사진일 때만 `data-standin` + `img-standin`. 체인 로직은 그대로(테스트로 고정).
- [x] 항목 8 (ArticleHeroImage): 카테고리 색 선·대문자·자간 삭제. `categoryPrimary`는 `@deprecated`로 인터페이스에만 남김.
- [x] 항목 9 (BreakingTicker): 빨강 면 배지·펄스 점·붉은 틴트 삭제 → `live` 색 글자 "속보"만. 페이드 2개는 띠와 같은 `surface`의 투명도 변화. 구분자 `·`. 스크롤·정지 동작 그대로.
- [x] 항목 10 (Pagination): accent 면 버튼 → 현재 쪽만 면 한 단계 + 헤어라인 + accent 숫자. 숫자 고정폭, 상자 열 삭제, 화살괄호는 아이콘 세트.
- [x] 항목 11 (CountryTabs): 영문 병기 삭제, 탭 높이 40, 현재 탭만 accent.
- [x] 항목 12 (TrendingKeywords, 7-22): 제목 "카테고리별 기사 수", 한글 카테고리명, `/category/{slug}` 링크(카테고리가 아닌 값은 기존 검색 링크), 순위 색 3개·굵기 3단계·알약 삭제, `formatCount`.
- [x] 항목 13 (ShareButtons): 브랜드 로고·링크 아이콘 삭제, 글자 버튼 한 줄(32px), 상태 색 삭제, 마침표 삭제, "공유" 라벨 + `role="group"`.
- [x] 항목 14 (NewsletterBanner, 7-20): "매일 아침 / AI가 정리한 / 시장 동향 / 언제든 구독 해지 가능" 삭제, accent 테두리·그라데이션 선·accent 면 버튼·원형 닫기·`focus:` 재정의·`active:scale` 삭제. `transition-all` → `transition-colors`(`BTN_PRIMARY`에 들어 있음).
- [x] 항목 15 (AdSlot · AdminLoadError · AdminLoading): `min-h-32`, 광고 문구 한 줄, `rounded-lg` 삭제, 오류 선 `border-negative`, 스피너 중립색, 짧은 문장 마침표 삭제.
- [x] 항목 16 (테스트): `tests/headline.test.ts`(6), `tests/s3-components.test.ts`(45), `tests/unslop-s3.test.ts`(38), `tests/image-chain.test.ts`(+5).

## 7절 반영

| # | 반영 |
|---|---|
| 7-1·2 | `group-hover:text-text-secondary` 우회 전부 뺌(muted가 모든 면에서 4.5:1 이상). 뉴스레터 오류 문구는 `text-negative`(푸터 폼과 같음), 히어로 워드마크는 `text-text-muted`. |
| 7-3 | S3 파일에 날것의 `font-mono` 0개. 숫자는 `NUM`(ui.ts) 또는 `.dateline`만, 그 안에는 숫자·라틴만(`(HTTP 502)`, 쪽 번호, 건수, 순위, 시각). |
| 7-4 | 세 형식 모두 처리. 목록 시각 칸은 `w-12` 고정: `HH:mm` 1줄, `MM.DD HH:mm`은 공백에서, `YYYY.MM.DD`는 `<wbr>`로 연도 뒤에서 접혀 5자 2줄. 모든 `<time>`에 `dateTime` + `suppressHydrationWarning`. |
| 7-5 | lead만 600. `headline-md`·`headline-lg` 토큰이 500이라 `LEAD_HEADLINE_CLASS`에 `font-semibold`/`sm:font-semibold`를 명시(생성 CSS 순서를 테스트로 고정). 일반 큰 카드는 500. |
| 7-7·15 | `BTN_PRIMARY`, `BTN_SECONDARY`, `BTN_SECONDARY_SM`, `BTN_GHOST_SM`, `FIELD`, `NUM`, `PANEL` 사용. S3가 따로 정의한 버튼·입력 클래스 없음. |
| 7-9·18 | 진입 애니메이션 0, 남은 애니메이션은 티커 스크롤과 관리자 스피너뿐. |
| 7-19 | `CountryTabs`, 티커 항목, 통신 목록 행, 카테고리 건수 행에 `focus-visible:-outline-offset-2`. |
| 7-21 | 새 아이콘 파일 없음. `icons.tsx`의 `<Icon>` 래퍼는 그대로 두고 export 3개만 추가. |
| 7-23 | 제목 링크의 `::after`가 카드 전체를 덮음. 원문·북마크는 `relative z-10`으로 그 위. |
| 7-24 | `/livenews/api/generated-image/…` → `'photo'`(원색). 테스트 2건 + 하네스에서 `filter: none` 확인. |

## 수정 파일 목록

수정 16
- `src/components/NewsCard.tsx`: 재작성(카드 해부 구조, 덮는 제목 링크)
- `src/components/NewsCardLarge.tsx`: 재작성 + `lead`
- `src/components/NewsCardCompact.tsx`: 시각 칸 / 순위, hover 면
- `src/components/ArticleImage.tsx`: `data-standin`·`img-standin` 2줄 + JSDoc
- `src/components/ArticleHeroImage.tsx`: 색 선·대문자 삭제
- `src/components/BreakingTicker.tsx`: 마크업·클래스(스타일 블록은 그대로)
- `src/components/CountryTabs.tsx`, `Pagination.tsx`, `NewsletterBanner.tsx`, `TrendingKeywords.tsx`, `ShareButtons.tsx`, `BookmarkButton.tsx`, `AdSlot.tsx`, `AdminLoadError.tsx`
- `src/components/icons.tsx`: 아이콘 3개 추가만
- `src/lib/image-chain.ts`: 함수 2개·타입 1개 추가만
- `tests/image-chain.test.ts`: 5건 추가

신규 5
- `src/components/NewsCardMeta.tsx`, `src/lib/headline.ts`
- `tests/headline.test.ts`, `tests/s3-components.test.ts`, `tests/unslop-s3.test.ts`

삭제 0. `src/lib/types.ts`·`src/lib/pagination.ts`·모든 `page.tsx`·S1·S2 파일은 손대지 않았다(props가 모두 선택 사항이라 호출부 수정이 필요 없었다).

## 검증 결과

| 검증 | 결과 |
|---|---|
| `npx tsc --noEmit` | 오류 0 |
| `npm test` | **376 pass / 0 fail** (`qa-out/gen-s3-test.log`). S3 몫: headline 6, s3-components 45, unslop-s3 38, image-chain 10(기존 5 + 5). `pagination` 7 · `image-pipeline` 7은 무수정 통과 |
| `local-env.sh restart` (= `next build`) | `APP UP (2s, css 200)` |
| `node qa-out/gen-s3-verify.js` | **S3 VERIFY CLEAN**, NOTE 4건(전부 S4 연동 대기 — 아래) |
| `ui-audit.js gen-s3` (외부 이미지 차단, 53 라우트 × 3 뷰포트) | 가로 넘침 0, 깨진 이미지 0, 페이지 오류 0, 스피너 고착 0. 종료 코드 1은 콘솔의 리소스 오류 때문: 이미지 프록시 415 556건 · 502 5건(픽스처의 가짜 이미지 호스트 — S1·S2 로그에도 같은 오류), 의도된 404 15건 |
| 상태 코드 | 200: `/world` `/us` `/japan` `/china` `/breaking`(`?page=7`, `?page=abc`) `/ranking`(`?country=us`) `/category/economy` `/search?q=AI` `/article/1·393·406`. 404: `/category/quantum-weird-category` `/article/407` `/article/999999` `/nope`. 401: `/admin`. 308: `/` (기존과 같음) |
| 가로 넘침 320 / 390 / 768 / 1440 × 9 라우트 | 전부 0 (`qa-out/gen-s3-shots2.cjs`) |
| 페이지네이션 `/breaking?page=7` | 1440 `‹ 1 … 5 6 7 8 9 … 14 ›`, 390 `‹ 1 … 7 … 14 ›`. 링크 1..14, `aria-current` = 7, 다음 → `?page=8`. `?page=9999` → 링크 1..13, 현재 쪽 1개, 다음 비활성. 320px에서 5497쪽 마지막 283px(가용 288), 10000쪽만 두 줄 |
| 키보드 | 카드 Tab 순서 제목 → 원문 → 북마크, 셋 다 `2px solid accent, offset 2px`. Enter(제목) → `/article/1`. Space(북마크) → `aria-pressed="true"`, 이동 없음, 새로고침 후 유지 |
| 카드 화면 6종 × 2 뷰포트 | "자세히 보기"·"N분 읽기" 0, 그라데이션 0, 블러 0, 그림자 0, 색 라벨 0, 사진 위 요소 0, 시각 전부 Plex Mono + tabular |
| 대체 사진 | 스톡 ⇔ `data-standin` ⇔ `grayscale` 불일치 0. 기사 사진·AI 이미지 `filter: none`. 모든 이미지 차단 시 플레이스홀더, 깨진 이미지 0, 플레이스홀더에 필터 0 |
| 티커 | `ticker 40s linear infinite`, hover·포커스 시 `paused`, 포커스 가능한 항목 10 · 숨긴 복제 10, reduced-motion에서 `1e-05s × 1` |
| 공유 | 복사 → 라벨 `복사됨`, live region `링크를 복사했습니다`, 폭 80 → 80, 2초 뒤 `링크 복사` |
| 사진 없는 기사 | `[data-no-image]` 비율 4:1(390은 3:1), `border-top` 0, 워드마크 `text-transform: none` |
| 콘솔·하이드레이션 | 하이드레이션 오류 0, 페이지 오류 0. e2e 로그의 "Failed to fetch RSC payload"(뷰포트당 6건)는 검사 스크립트가 프리페치 도중 다음 라우트로 넘어가며 생긴 중단 |

### S4가 `lead`·`rank` 호출을 바꾸기 전이라 페이지에서 볼 수 없는 것 — 하네스로 측정
`npx tsx qa-out/gen-s3-harness.cjs`: 컴포넌트를 정적 HTML로 그려 **실행 중인 빌드의 CSS**로 320 / 390 / 768 / 1440에서 잰다(`qa-out/gen-s3-harness.log`, 화면 `qa-out/gen-s3-shots/harness-*.jpg`).
- lead 제목: 네 폭 모두 `Noto Serif KR` 600. short 28 → 34.56 → 40px, medium 20 → 34.56 → 40px, long 20 → 28px. 줄 수 320: 4/4/4, 390: 3/3/4, 768·1440: 2/2/3. 1440에서 카드 646px(사진 384).
- 통신 목록: 시각 칸 폭 48 × 6행, 제목 왼쪽 좌표 한 값, `2025.12.31`도 48px 안 2줄(scrollWidth 48), 행 65/85px(제목 1줄/2줄), 시각 첫 줄과 제목 첫 줄의 세로 위치 차 0px(글줄 높이로 계산한 근사값).
- 뉴스레터 배너(플래그 켠 상태): 입력 40 · 버튼 40(`rgb(239,233,222)` 면 + `rgb(22,21,19)` 글자) · 닫기 32×32, 그라데이션 0.
- 광고 칸 728×90 / 300×250 / 높이 128, 관리자 오류 선 `rgb(234, 93, 97)` 2px.

### 검증 스크립트 사본에서 바꾼 기대값 (`qa-out/gen-s3-verify.js`)
1. `live` 색 `rgb(229, 72, 77)` → `rgb(234, 93, 97)` — 7-2로 토큰 값이 바뀜.
2. 통신 시각 정규식에 `YYYY.MM.DD` 추가 — 7-4.
3. 카드 요약 hover·클릭을 `page.mouse`로 좌표에 직접 — Playwright의 `locator.hover()/click()`은 다른 요소가 클릭을 받으면 실행을 거부하는데, 덮는 제목 링크(7-23)가 바로 그 구조다. 검사 내용(hover 배경, `/article/`로 이동)은 그대로.
4. `no article[data-lead]`를 FAIL → NOTE — 홈에서 `lead`를 넘기는 것은 `page.tsx`(S4) 수정이라 S3가 할 수 없다. lead 카드 자체는 하네스로 측정.
5. 브라우저 경로 기본값 `/opt/pw-browsers/chromium`.

원본 `planner-s3-verify.js`는 3번 때문에 hover 단계에서 시간 초과로 끝난다(구현 결함이 아니라 스크립트의 클릭 방식).

## SPEC과 다르게 한 점

1. **아이콘 버튼 클래스의 위치.** SPEC은 `icons.tsx`에 `ICON_BUTTON`/`ICON_BUTTON_QUIET`을 두라고 했지만, 7-7·15에 따라 `@/lib/ui`의 `BTN_GHOST_SM`을 썼다(16px 아이콘 + `px-2` = 32×32). 저장됨 상태는 `aria-pressed:text-text`.
2. **아이콘 이름.** `ExternalLinkIcon`·`ChevronIcon({dir})` 대신 S2의 `ExternalIcon` 재사용 + `ChevronLeftIcon`/`ChevronRightIcon`(파일 규칙 "아이콘 하나에 export 하나"). `<Icon>` 래퍼에 `filled`를 더하지 않고 `<path fill>`로 채움.
3. **lead 굵기를 `headline.ts`에 둠.** h2에 `font-semibold` 하나만 두면 640px 이상에서 `sm:text-headline-lg`(500)가 이긴다.
4. **통신 목록의 연도 형식.** SPEC에는 없던 `YYYY.MM.DD`(7-4)를 `<wbr>`로 `2025.` / `12.31` 두 줄에. 칸 폭은 SPEC대로 48px(S1 QA는 가장 긴 형식에 맞춘 폭을 권했으나, 80px 칸이면 390px 화면에서 제목 폭이 계산상 32px 줄어 — 패널 패딩 16 기준 266 → 234px — 중간 길이 제목이 2줄에 들어가지 않는다).
5. **CountryTabs.** `::after` 밑줄 대신 헤더 내비(S2)와 같은 문법(`border-b-2` + `border-accent`), 탭이 줄의 헤어라인 위에 겹침(`-mb-px`), 포커스 링 안쪽(7-19).
6. **티커 항목.** `py-1`(30.4px) 대신 `inline-flex h-8`(32px), 포커스 링 안쪽.
7. **Pagination.** 비활성 화살표 `opacity-50`(ui.ts의 `disabled:opacity-50`과 같은 값; SPEC은 40).
8. **ShareButtons.** 자체 클래스 대신 `BTN_SECONDARY_SM` — 글자가 SPEC(12px secondary)보다 크고 밝다(14px medium `text`).
9. **NewsletterBanner 문구.** SPEC의 "해외 뉴스 요약을 이메일로 받아보세요 / 언제든 구독을 해지할 수 있습니다" 대신 푸터 폼과 같은 "뉴스레터 구독 / 주요 뉴스를 이메일로 받아 보세요"(7-20 "동일 문구"). 해지 문구는 해지 수단이 코드에 없어 뺐다.
10. **메타 줄 여백.** `-my-1` → `-my-2`: 32px 버튼이 16px 글줄 밖으로 8px씩 나가 글자·글리프 모두 카드 아래 가장자리에서 정확히 20px.
11. **원문 링크의 `onClick stopPropagation` 삭제.** 조상에 클릭 핸들러가 없다.
12. **hover 시 메타 색 올리기 삭제**(7-1).

## 디자인 자체 평가

- AI slop 패턴 사용 여부: 없음. 정적 금지 목록 20종(`tests/unslop-s3.test.ts`) 통과, 화면 실측에서 그라데이션·블러·그림자·색 배지 0.
- 독창적 요소(새 장식이 아니라 방향의 모먼트·시그니처를 컴포넌트로 옮긴 것): 머리기사만 명조 600 + 가장 큰 사진, 대체 사진은 흑백이라 원색이 "이 기사의 사진"을 뜻함, 통신 목록 왼쪽 48px 칸의 고정폭 시각.
- 다크 모던 테마 일관성: 색은 토큰만(S3 파일에 Tailwind 팔레트 색 0). accent는 현재 탭·현재 쪽 2곳, `live`는 "속보" 글자 1곳, `negative`는 오류 표시 2곳.
- 남는 약점: ① 밝은 스톡 사진(달러 지폐 등)은 흑백이어도 화면에서 가장 밝다 — `.img-standin`의 `brightness(0.9)`는 S1 값. ② 카드가 hover로 `surface-elevated`가 되면 그 안 아이콘 버튼의 hover 면(`BTN_GHOST_SM`의 `hover:bg-surface-elevated`)은 보이지 않고 글자색 변화만 남는다. ③ 덮는 링크 때문에 카드의 요약 글자는 마우스로 선택할 수 없다(7-23의 대가).

## 회귀 금지 체크리스트

- [x] `ArticleImage`의 props·상태 전이·`srcSet`/`sizes`/`fetchpriority`/`data-placeholder`/`onSettled` 불변(추가는 `data-standin`, `img-standin`뿐 — 테스트가 해당 줄을 고정)
- [x] `Pagination` 링크 1..total, `aria-current="page"`·`aria-label` 문구 불변, `total <= 1`이면 null
- [x] 티커: 복제 항목 `aria-hidden` + `tabIndex=-1`, hover·focus-within 정지, `role="marquee"`
- [x] 카드: 제목 → 원문 → 북마크 순, 원문은 새 창 + `rel="noopener noreferrer"`, 북마크 클릭이 기사로 이동시키지 않음
- [x] `<time dateTime>` + `suppressHydrationWarning`, 하이드레이션 오류 0
- [x] `getDisplayTitle`의 `lang`이 h2/h3/h4와 티커 링크에 유지(일본어 제목 `/article/393`, 하네스 ja 행)
- [x] 컴포넌트 props: `NewsCard{article}`, `NewsCardLarge{article, priority?, lead?}`, `NewsCardCompact{article, rank?}`, `ArticleHeroImage{sources?, src?, fallback?, alt?, categoryPrimary?, sourceName?}`, 나머지 불변
- [x] `npx tsc --noEmit`, `npm test`, `next build` 통과. 320 / 390 / 768 / 1440 가로 넘침 0
- 기존 기능 영향: 없음(북마크, 공유, 원문 링크, 이미지 체인, 페이지네이션, 티커 스크롤 실측). 의도된 변경 2가지 — 카드의 상대 시각("3시간 전")이 통신 시각으로, `TrendingKeywords`의 카테고리 항목 링크가 `/search?q=` → `/category/{slug}`(7-22).
- TypeScript 오류: 없음

## S1·S2 파일에서 발견한 것 (고치지 않음)

1. `src/lib/ui.ts`에 아이콘 버튼 클래스가 없다. `Header.tsx`는 40px `ICON_BTN`을 파일 안에 따로 정의하고, S3는 `BTN_GHOST_SM`으로 32px를 만든다 — 이름 붙은 한 쌍(40 / 32)이 ui.ts에 있으면 두 곳이 같은 정의를 쓴다.
2. `utils.ts`의 `estimateReadingTime`은 이제 호출하는 곳이 없다(7-13: 통합 단계에서 삭제). `timeAgo`·`getCategoryStyle`은 `page.tsx` 2곳(S4)이 아직 쓴다.
3. `.img-standin`의 `brightness(0.9)`: 위 "남는 약점 ①". 값을 낮출지는 S1 판단.
4. `formatWireTime`의 `YYYY.MM.DD`에는 줄바꿈 지점이 없어, 좁은 칸에서는 호출하는 쪽이 `<wbr>`를 넣어야 한다(함수 결함은 아님, JSDoc에 한 줄 있으면 좋다).
5. `scripts/qa/ui-audit.js`는 `chromium.launch()`에 경로가 없어 이 환경에서는 그대로 실행되지 않는다 → `node -r ./qa-out/gen-s3-pw-preload.cjs scripts/qa/ui-audit.js gen-s3`.

## S4에 넘길 것

1. 홈 `page.tsx:88` → `lead` 추가, `:99`·`:166`의 `rank` 삭제(검증 NOTE 4건이 이것). 그 뒤 `planner-s3-verify.js`의 lead·통신 목록 검사가 실제 페이지에서 돈다.
2. lead 카드가 1440px에서 646px이 된다 → 오른쪽 칼럼 래퍼를 `grid gap-5 lg:grid-rows-2`로(카드는 `flex flex-col` + 메타 `mt-auto`라 늘어나도 메타가 바닥에 붙는다 — 하네스에서 확인).
3. 티커 래퍼(`page.tsx:66`)의 `rounded-lg overflow-hidden`이 위아래 헤어라인 끝을 깎는다. 티커 루트에는 `news-ticker` 클래스가 있다.
4. 통신 목록 패널 패딩은 16 이상(행이 `-mx-2`). 카테고리 패널 안의 `NewsCard`는 카드 안 카드가 된다.
5. `NewsCardCompact`는 서버 컴포넌트에서만 임포트할 것(`<wbr>` 때문 — 파일 주석 참고).
6. 랭킹 페이지의 순위 배지가 카드 사진 위에 얹혀 있다(S3 규칙 "사진 위에는 아무것도 올리지 않는다").
7. `ArticleHeroImage`의 `categoryPrimary`는 더 쓰이지 않는다(넘겨도 무해). `ShareButtons`는 자체 "공유" 라벨을 갖는다.
8. `TrendingKeywords`는 이제 "카테고리별 기사 수" — 홈에서의 위치·섹션 이름은 S4 판단.
9. 범위 밖 사실: "카카오톡" 공유 주소가 `story.kakao.com/share`(카카오스토리)다. `/api/newsletter` 라우트가 없다(플래그가 꺼져 있어 노출되지 않음). 삭제한 뉴스레터 주장(매일 아침 / AI가 정리 / 시장 동향 / 언제든 해지)은 실제 발송 기능이 생기면 사실대로 다시 적을 것.

## 실험 파일 (`qa-out/`, 소스 아님)
`gen-s3-verify.js`(+`.log`), `gen-s3-harness.cjs`(+`.html` `.json` `.log`), `gen-s3-e2e.cjs`(+`.log`), `gen-s3-shots.cjs`·`gen-s3-shots2.cjs` → `gen-s3-shots/*.jpg`(natural = 있는 그대로, photos = 기사 사진·스톡 사진을 시험용 원색 이미지로 응답), `gen-s3-ui-audit.log` + `audit-gen-s3.json`, `gen-s3-pw-preload.cjs`, `gen-s3-render.cjs`, `gen-s3-units.cjs`, `gen-s3-test.log`, `gen-s3-restart.log`.
