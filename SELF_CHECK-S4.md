# 자체 점검 — 슬라이스 S4 (unslop 재작업 라운드)

계약: `UNSLOP-AUDIT.md`(7절이 SPEC-S4보다 우선) · `SPEC-S4.md` 항목 0~21 · `SPEC-S3.md` "S4 연동" · `QA_REPORT-S3.md` 8절(S4에 넘길 것).
방향: 밤의 편집국·통신 데스크. 크롬은 조용하게, 모먼트는 홈 머리기사 사진과 통신 목록 둘, 시그니처는 고정폭 통신 시각.

## SPEC 개선 항목 체크

- [x] **항목 0 공용 조각**: 버튼·입력·칩·표는 전부 `@/lib/ui`(S1 소유) 상수. S4 신규 `PageHeading`(제목 줄 1종), `EmptyState`(빈/오류 상태 1종), 그리고 SPEC에 없지만 같은 것을 한 번만 쓰려고 만든 `ChipNav`(칩 줄), `ArticleListing`(큰 카드 3장 + 카드 그리드), `AdminParts`(`AdminStat`·`LogStatus`·`ActiveToggle`·`AdminPager`).
- [x] **항목 1 여백·리듬**: 공개 페이지 7개 모두 `cn(CONTAINER, 'py-8')`. 헤더 = 본문 = 푸터 왼쪽 선 112 / 24 / 16px(1440 / 768 / 390). 섹션 사이 48, 제목↔내용 16, 카드 사이 20, 제목 줄 아래 24, 칩 줄 아래 32. 반 단계·임의 값 0.
- [x] **항목 2 머리기사 3장 그리드**: 속보·국가·카테고리가 `ArticleListing` 하나를 쓴다. 768px에서 첫 카드가 한 줄(720px), 2·3번째가 나란히(350px). 1440px에서 큰 카드 3장과 아래 3열의 `left`가 112 / 524 / 936으로 같다.
- [x] **항목 3 홈 섹션 머리**: 색 막대 3개·카테고리 색 글자 삭제, h2는 `mb-4 text-headline-md text-text`. 두 번째 "최신 뉴스" → "그 밖의 뉴스". 카테고리 묶음은 상자 대신 헤어라인 + 단 이름(카드 안 카드 해소). 화살표는 `icons.tsx`의 `ChevronRightIcon`.
- [x] **항목 4 lead·통신 목록**: `NewsCardLarge … priority lead`, `rank` 2곳 삭제(시각 칸), 목록 머리 오른쪽 `KST`, 두 목록 모두 `byWireTime`(발행 시각 내림차순, `queries.ts` 불변).
- [x] **항목 5 제목 줄**: 배지·알약·이모지 삭제 → `PageHeading`. `속보 409건`, `세계 뉴스 112건`, `경제 뉴스 26건`(숫자만 고정폭). 랭킹·검색은 건수 없음.
- [x] **항목 6 칩**: `CHIP` / `CHIP_CURRENT`, 높이 32·모서리 8. 현재 칩만 강조색 글자 + 면 한 단계.
- [x] **항목 7 랭킹**: `<ol>` 30개 전부에 순위(카드 위, 고정폭). 1~3위 `text`, 이하 `text-muted`. 사진 위 요소 0.
- [x] **항목 8 기사 머리**: 경로(`/` 구분) → 사진(그림자 없음) → 데이트라인 `매체 · 2026.11.12 10:09 · 기자` → 명조 h1(600) → 원제목(기울임 없음). 색 배지·시계 아이콘·상대 시각 삭제.
- [x] **항목 9 본문**: 읽기 폭 672px, 18/32(390px에서 16/28), 문단 사이 24. 오버라인 2곳에서 대문자·자간·강조색 삭제. 안내 레일은 중립 헤어라인. 발췌 안내·본문 없음 안내·접힌 원문 유지.
- [x] **항목 10 꼬리**: 같은 데이트라인 + `원문 보기`(ExternalIcon) + `목록으로`. 태그는 `TAG`(24px·6px·테두리 없음). 관련 기사 2열(카드 326px), 막대 삭제.
- [x] **항목 11 검색**: `aria-label`·placeholder "검색어", 입력 `FIELD` + 버튼 `BTN_PRIMARY`(둘 다 40px), select `FIELD_SM`, 결과 줄 `“AI” 검색 결과 52건`, 오류·없음·초기 상태는 `EmptyState`. `useEffect`·`retryKey`·`router.replace`·`pagePattern`은 그대로.
- [x] **항목 12 빈 상태**: 6곳 전부 `EmptyState`. 홈의 64px 신문 아이콘 삭제.
- [x] **항목 13 숫자**: `toLocaleString` 0, 전부 `formatCount`. ID는 쉼표 없이 muted. 관리자 쪽번호 `1 / 14` 고정폭.
- [x] **항목 14 아이콘**: 이모지 0, S4 파일의 인라인 `<svg>` 0. 남은 아이콘 3개(카테고리 화살표·원문 펼침·외부 링크)는 `icons.tsx`. `main svg` 실측 전부 16px / stroke 1.5.
- [x] **항목 15 관리자 머리**: 네 화면 h1 → `PageHeading`(로딩·오류 분기 포함). 주요 버튼(밝은 면)은 화면당 1개: 대시보드 "수동 수집 실행", 소스 "소스 추가"(폼이 열리면 폼의 제출 버튼으로 넘어감).
- [x] **항목 16 통계 카드**: 숫자 + 라벨 + 기준 한 줄. 색은 실패 수가 0보다 클 때의 `text-negative` 하나. 로그 화면 3장도 같은 `AdminStat`.
- [x] **항목 17 표**: `TABLE_WRAP`/`TH`/`TD…`. 머리글은 면 없이 헤어라인 + 12px muted, hover·키보드 포커스는 면 반 단계, 편집 중인 소스 행은 면 한 단계 + 첫 칸 2px 강조색 선. 상태는 점 + 한글(`성공/실패/부분`), 국가·언어는 한글, 숫자 열 오른쪽 정렬, 빈 오류 칸은 중립색.
- [x] **항목 18 폼·알림**: 레이블 6개 모두 `htmlFor`↔`id`, 입력 `FIELD`. alert 문구 7개 한국어·마침표 없음. 번역 보정 결과는 API의 영어 문장 대신 숫자 필드로 한국어 문장. `AdminLoadError` 문구 3줄.
- [x] **항목 19 모션**: 진입 애니메이션 0(7-9). `transition-colors`·`transition-transform`·검색 스피너 `animate-spin`만.
- [x] **항목 20 비주얼·첫 화면**: 이미지·아이콘 추가 없음. 1440×900 첫 화면에 티커 → 제목 → 머리기사 사진 → 명조 제목.
- [x] **항목 21 회귀 잠금**: `tests/unslop-pages.test.ts` 39개(금지 패턴 19종, 공용 조각, 시그니처, 404·307 구조). 백스톱은 고치지 않고 아래에 보고(이번 라운드 규칙: S1~S3 파일 읽기 전용).
- 항목 22: SPEC-S4에 22번 항목은 없다(0~21).

### S3·오케스트레이터가 넘긴 것
- [x] `lead` 추가, 홈 목록 `rank` 삭제(랭킹은 `PageHeading` 아래 `<ol>`로 순위 표시, `NewsCardCompact`의 `rank`는 어디서도 쓰지 않음).
- [x] **오른쪽 칼럼 높이**: `lg:grid-rows-2`(카드를 늘려 빈 띠가 생김) 대신 **두 열 모두 내용 높이**(`items-start`). 높이는 통신 목록을 lg부터 2단(4행 + 4행)으로 놓아 맞췄다. 실측: 1440·1280px 왼쪽 1204 / 오른쪽 1193(차 11px), 1024px 1283 / 1193(차 90px, 오른쪽 열 끝의 빈 자리). 카드 안 요약↔메타 사이 빈 띠 0px(머리기사·큰 카드 2장 모두).
- [x] 티커 래퍼 `rounded-lg overflow-hidden` 삭제(래퍼 `mb-8`만, 반지름 0).
- [x] 통신 목록 패널 `p-5`(행이 `-mx-2`). 카테고리 열은 패널이 없고 목록 래퍼에 `px-2`(행 헤어라인이 열·카드 가장자리에서 끝남).
- [x] `NewsCardCompact`는 `src/app/page.tsx`(서버)에서만 임포트 — 테스트로 잠금.
- [x] 랭킹: 사진 위 순위 배지 삭제.
- [x] `ArticleHeroImage`의 `categoryPrimary` 전달 삭제. 페이지에 "공유" 라벨 없음(화면에 1개).
- [x] `TrendingKeywords`("카테고리별 기사 수")는 "카테고리별 뉴스" 섹션의 네 번째 칸. 1440px에서 카테고리 3단 + 패널 1칸이 한 줄, 768~1279px에서 2×2.
- [x] `timeAgo`·`getCategoryStyle`·`estimateReadingTime` 호출 0(S4 파일). 관리자 표는 `text-body-md` + `TABLE_WRAP/TH/TD`.
- [x] 발행 시각 내림차순: 통신 목록 8행의 `<time datetime>` 내림차순 확인(390~1440px).

## 수정 파일 목록

수정 12
- `src/app/page.tsx`: 컨테이너, 섹션 머리, `lead`, 통신 목록(시각 순·2단), 카테고리 단, 빈 상태
- `src/app/[country]/page.tsx`: 이모지·알약 삭제, `PageHeading`·`ChipNav`·`ArticleListing`·`EmptyState`, 메타 설명 문구
- `src/app/breaking/page.tsx`: 배지·알약 삭제, h1 "속보", 메타 설명 문구
- `src/app/category/[slug]/page.tsx`: 칩, 제목 줄, 목록
- `src/app/ranking/page.tsx`: `<ol>` 순위
- `src/app/search/page.tsx`: 렌더 부분만(로직 불변)
- `src/app/article/[id]/page.tsx`: 읽기 단, 데이트라인, 명조 h1, 안내·태그·관련 기사
- `src/app/admin/page.tsx`, `admin/sources/page.tsx`, `admin/articles/page.tsx`, `admin/logs/page.tsx`: 제목 줄, 통계, 표, 폼, 문구
- `src/components/AdminLoadError.tsx`: `MESSAGES` 3줄만(SPEC-S4 항목 18. S3 테스트 2종 그대로 통과)

신규 6
- `src/components/PageHeading.tsx`, `EmptyState.tsx`, `ChipNav.tsx`, `ArticleListing.tsx`, `AdminParts.tsx`
- `tests/unslop-pages.test.ts`

삭제 0. `middleware.ts`·`queries.ts`·`routing.ts`·`article-view.ts`·모든 `layout.tsx`·`loading.tsx`·API 라우트·S1/S2/S3 파일은 손대지 않았다(`icons.tsx`에 추가도 필요 없었다).

## 검증 결과 (마지막 빌드 기준)

| 검사 | 결과 |
|---|---|
| `npx tsc --noEmit` | 오류 0 |
| `npm test` | 416 / 416 통과(신규 39) |
| `local-env.sh restart`(= `next build`) | `APP UP (2s, css 200)` |
| `bash qa-out/planner-s4-audit.sh` | 징후 29행 전부 0. 백스톱 14개 중 `src/app/admin/layout.tsx` 1(S2의 워드마크 `font-semibold` — S2 테스트가 잠근 값) |
| `node qa-out/gen-s4-verify.js`(사본) | **ALL PASS**, NOTE 0 |
| `node qa-out/planner-s4-verify.js`(원본) | 4 FAIL, 전부 같은 원인: 오류 글자 `rgb(234, 93, 97)`가 허용 목록에 없음(7-2로 `negative` 값이 바뀜) |
| `node qa-out/gen-s4-s3-verify.js`(사본) | **S3 VERIFY CLEAN**, NOTE 0(lead·통신 시각 NOTE 4건이 사라짐) |
| `node qa-out/gen-s3-verify.js`(원본) | 2 FAIL, 둘 다 "wire list titles do not start on one line"(아래 설명) |
| `ui-audit.js gen-s4`(외부 이미지 차단, 53 라우트 × 3 뷰포트 = 159) | 가로 넘침 0, 깨진 이미지 0, 페이지 오류 0, 스피너 고착 0, 상태 불일치 0. 종료 코드 1은 콘솔의 리소스 오류: 이미지 프록시 415 541건·502 5건(픽스처의 가짜 이미지 호스트, S1~S3 로그와 같음), 의도된 404 15건 |
| `node qa-out/gen-s4-e2e.cjs` | 50 / 50 통과(검색 재시도·필터·범위 초과 쪽, 칩, 페이지네이션, 기사 표식 7종, 관리자 오류·재시도·선택 행·롤백·필터·쪽 이동) |
| 스크린샷 `qa-out/gen-s4-shots/`(20 화면 × 1440·1024·768·390 = 80) | 콘솔·하이드레이션 오류 0, 가로 넘침 0. 직접 본 화면: 홈(4폭), 속보·세계·카테고리·랭킹·검색 3상태·기사 1/393/401/402/405/395·404·관리자 4화면(1440·390) |
| 상태 코드·리다이렉트 | 수정 전과 동일(`diff` 0줄): 404 6종, `/admin` 401, 307 3종(`?page=14` / `2` / `6`), `/ranking?country=zz` 200 |
| 메타데이터 | 홈·카테고리·랭킹·검색·기사 3종 동일. **`/breaking`과 국가 페이지의 `description`만 바뀜**(SPEC 항목 5, 아래). JSON-LD·sitemap은 수정 전에도 없다(0건) |

### 사본에서 바꾼 기대값
- `qa-out/gen-s4-verify.js`: ① 관리자 자격을 리터럴 대신 `qa-out/gen-s4-creds.cjs`에서 읽음(`.env.local` → 환경 변수 → 미들웨어의 기본값. 이 저장소에는 `.env.local`이 없어 세 번째가 쓰였다) ② 브라우저 경로 `/opt/pw-browsers/chromium` ③ `negative` 색 `229, 72, 77` → `234, 93, 97`(7-2) ④ 통신 시각에 `YYYY.MM.DD` 허용(7-4).
- `qa-out/gen-s4-s3-verify.js`: "통신 목록 제목이 한 줄에서 시작"을 `<main>` 전체가 아니라 목록(같은 부모)마다 검사. `rank`를 지우면서 카테고리 단의 행에도 시각 칸이 생겼고 통신 목록이 lg부터 2단이라, 서로 다른 열에 있는 목록의 x가 같을 수 없다. 목록 안에서의 규칙(시각 칸 48px, 제목 한 줄 시작)은 그대로 통과.

### 실측 값
- 홈 섹션 `margin-top` 48 / 48, h2 `margin-bottom` 16 × 3, 티커 래퍼 반지름 0.
- 제목 줄 h1 28px / 500. 주요 버튼 40px·8px·`rgb(239, 233, 222)`. 칩 32px·8px, 현재 칩 `rgb(240, 136, 62)` 글자 + `rgb(38, 36, 33)` 면.
- 기사 h1 Noto Serif KR 600 40px, 본문 18/32(390px 16/28), 줄 길이 672px, 관련 기사 카드 326px × 6.
- 관리자: 통계 카드 4장 높이 동일, 숫자 28px / 500 / IBM Plex Mono. 표 행 44px, `thead` 배경 투명, hover·포커스 `rgba(38, 36, 33, 0.5)`, 선택 `rgb(38, 36, 33)` + 2px 강조색 선.
- 포커스 링: 검색 입력 `2px solid accent, offset 2px`. 칩은 스크롤 줄 안이라 `offset -2px`(7-19).

## 디자인 자체 평가
- AI slop 패턴: 없음. 그라데이션·그림자·색 배지·알약·uppercase·기울임·이모지·진입 애니메이션 0(S4 파일과 실측 모두).
- 강조색: S4 파일에서는 편집 중인 소스 행의 2px 선 한 곳. 나머지 강조색은 S2·S3의 "현재 위치"(내비·탭·쪽번호·칩).
- 이 제품에만 있는 것: 머리기사 아래 시각이 찍힌 통신 목록(`KST` 단위 표기, 2단 전문 목록), 기사 머리·꼬리의 데이트라인, 신문 단 머리 같은 카테고리 열, 번역 상태 안내.
- 남는 약점
  1. 로컬 픽스처의 사진은 전부 스톡 대체 사진이라 흑백으로 나온다. "머리기사만 원색"은 실제 기사 사진이 있는 운영 데이터에서만 볼 수 있다.
  2. 1024px에서 홈 오른쪽 열이 왼쪽보다 90px 짧다(카드를 늘리지 않은 대가).
  3. 홈 카테고리 열의 카드는 열 높이에 맞춰 한두 줄(24~48px) 늘어날 수 있다(제목 줄 수 차이). 다른 카드 그리드의 행 맞춤과 같은 수준.
  4. 기사 읽기 단은 컨테이너 안에서 가운데 정렬이라 1440px에서 왼쪽 선이 384px이다(헤더 112px과 다름). 좁은 단을 왼쪽에 붙이면 오른쪽 544px이 빈다.

## SPEC과 다르게 한 점
1. **컨테이너**: SPEC의 `max-w-7xl px-4 sm:px-6 lg:px-8` 대신 `CONTAINER`(7-6). 기사는 `max-w-3xl`(본문 720) 대신 `CONTAINER` 안 `max-w-2xl`(672) — 임의 값 없이 720 이하.
2. **오른쪽 칼럼**: S3 메모의 `lg:grid-rows-2`를 쓰지 않았다(QA_REPORT-S3 8-2). 통신 목록 lg 2단은 SPEC에 없는 정렬 변경.
3. **칩 포커스**: SPEC의 `px-1 py-1 -mx-1` 여유 대신 `focus-visible:-outline-offset-2`(7-19).
4. **검색 입력·버튼**: SPEC의 48px 리터럴 대신 `FIELD` / `BTN_PRIMARY`(40px, 7-7). 모바일에서도 한 줄.
5. **`ui.ts`**: S1이 이미 만들었으므로 새로 만들지 않고 사용만.
6. **`AdminLoading`·오류 상자 치수**: S3가 다시 쓴 값(`py-20`, `border-border border-t-text-secondary`, `px-6 py-10`)을 그대로 뒀다(S3 테스트가 잠금). 문구만 SPEC-S4대로.
7. **원제목 색**: `text-text-muted` 대신 `text-text-secondary`(문장 길이의 글에는 muted를 쓰지 않는다는 스킬 규칙).
8. **색이 겹치는 칸**: `TD`/`TD_NUM`에 색 클래스를 덧붙이는 대신 안쪽 `<span>`에 색(ID muted, 오류 negative). 같은 요소에 글자색 유틸 두 개를 두지 않기 위해서.
9. **선택된 소스 행**: `cn(TR, TR_SELECTED)` 대신 `TR_SELECTED`만. hover·focus-within이 선택 면을 반 단계로 덮어 선택과 포커스가 구분되지 않았다(e2e로 확인).
10. **로그 통계의 기준 문구**: "이 페이지 기준" 대신 `50건 중`(390px에서 두 줄로 꺾이지 않고, 무엇 중인지가 숫자로 나온다).
11. **데이트라인 구분점**: 가운뎃점을 항목의 왼쪽 여백에 두고 줄 전체를 16px 당겨 잘랐다. 긴 기자명이 줄을 바꿔도 줄 끝·줄 머리에 점이 남지 않는다(`/article/402`, 390px).
12. **관리자 표**: `whitespace-nowrap`(390px에서 "미/국"처럼 세로로 꺾이던 칸), 기사 제목 칸 `min-w-56`. 좁은 화면에서는 표가 가로로 스크롤된다(`TABLE_WRAP`).
13. **대시보드 표 머리 "시간" → "시작"**: 값이 `startedAt`이고 로그 화면과 같은 말.
14. **소스 폼**: 언어 열·선택지를 한 목록(`영어/일본어/중국어/한국어`)으로, 레이블 `Base URL`/`Feed URL` → `기본 URL`/`피드 URL`.
15. **`TrendingKeywords` 배치**: SPEC의 `mt-8 max-w-md` 래퍼 대신 카테고리 그리드의 한 칸(오른쪽 2/3이 비는 것을 피함).

## 결정이 필요한 것
- **메타 설명 2곳이 바뀌었다**(SPEC 항목 5, 확인할 수 없는 "실시간" 삭제): `/breaking` "최신 속보 뉴스를 실시간으로 확인하세요" → "해외 주요 언론의 최신 기사를 수집 순서대로 전합니다", 국가 페이지 "{나라} 주요 뉴스를 실시간으로 확인하세요" → "{나라} 주요 뉴스를 한국어로 번역해 전합니다". "메타데이터 유지"를 문자 그대로 적용하려면 `breaking/page.tsx:15`, `[country]/page.tsx:43` 두 줄만 되돌리면 된다. `<title>`·OG·나머지 설명은 그대로다.

## S1~S3 파일에서 발견한 결함 (고치지 않음)
1. `src/app/admin/layout.tsx:23` 워드마크 `text-lg font-semibold` — 토큰 밖 크기 + 600(계약상 600은 큰 헤드라인만). `tests/chrome-unslop.test.ts`가 이 문자열을 잠그고 있다.
2. `src/lib/ui.ts`의 `FIELD`·`FIELD_SM` 글자 14px — iOS Safari는 16px 미만 입력에 포커스할 때 화면을 확대한다(검색·푸터·배너·관리자 입력 전부).
3. `src/components/ArticleHeroImage.tsx:41` `sizes="(min-width: 920px) 896px, 100vw"` — 기사 단이 672px이 됐으므로 `(min-width: 720px) 672px, 100vw`가 맞다(지금은 필요 이상 큰 후보를 고를 수 있음). `categoryPrimary` prop은 이제 호출하는 곳이 없다.
4. `src/components/NewsCardCompact.tsx`의 `rank` prop은 호출하는 곳이 없다(랭킹은 카드 그리드).
5. `scripts/qa/ui-audit.js`와 `qa-out/planner-s4-verify.js`에 관리자 기본 자격이 리터럴로 들어 있다(미들웨어 기본값과 같은 값).
6. `utils.ts`의 `timeAgo`·`getCategoryStyle`·`estimateReadingTime`은 `src/app`·`src/components`에서 호출 0(통합 단계 삭제 후보, 7-13). `rounded-badge`·`rounded-pill` 별칭도 S4 파일에서는 사용 0.

## 회귀 위험 확인
- 기존 기능 영향: 없음. 검색(제출·필터·재시도·범위 초과 쪽), 목록 페이지네이션·307, 404 6종, 관리자 4화면(로드 오류·재시도·낙관적 토글 롤백·필터·쪽 이동), 기사 번역 상태 표식 7종, 발췌 안내, 문단 나누기, 머리기사 `fetchpriority="high"` 확인.
- 바뀐 동작: 홈 통신 목록 2곳의 행 순서(발행 시각 순, 7-11), 메타 설명 2곳(위), 관리자 alert 문구.
- TypeScript 오류: 없음.

## 통합 단계에 넘길 것
1. `npm run build`는 `local-env.sh restart` 안에서 통과. 다른 에이전트의 S2/S3 후속 수정이 끝난 뒤 한 번 더 돌릴 것.
2. 죽은 export 정리(위 6번)와 S2/S3 결함 1~4.
3. 운영 데이터(실제 기사 사진, 긴 제목)로 홈 1440·1024px을 한 번 볼 것: 통신 목록 제목이 두 줄이면 왼쪽 열이 약 80px 길어진다.

## 실험 파일 (`qa-out/`, 소스 아님)
`gen-s4-verify.js`·`gen-s4-s3-verify.js`(사본), `gen-s4-creds.cjs`, `gen-s4-e2e.cjs`, `gen-s4-measure.cjs`, `gen-s4-shots.cjs` → `gen-s4-shots/*.jpg`, `gen-s4-before/`·`gen-s4-after/`(메타·상태 비교), `audit-gen-s4.json`·`shots-gen-s4/`, 각 `.log`.
