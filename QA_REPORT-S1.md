# QA 검수 보고서 — 슬라이스 S1 (디자인 시스템) · Round 5 (결함 수정 라운드)

**검수 라운드**: R5 — 1회차 (Generator 1차 산출물)
**검수 일시**: 2026-10-05
**검수 대상**: `tailwind.config.ts`, `src/app/globals.css`, `src/lib/constants.ts`, `src/lib/utils.ts`, `package.json`, `tests/utils.test.ts`(신규), `tests/design-tokens.test.ts`(신규)
**설계서**: `SPEC-S1.md` (개선 항목 1~11) · 근거: `QA_BASELINE-R5.md` · 검증 대상 주장: `SELF_CHECK-S1.md`
**검수 원칙**: Generator 자체 보고를 신뢰하지 않고 모든 수치를 직접 재실행으로 확인. 소스 파일 무수정.

> 참고: 검수 도중 오케스트레이터가 S1 변경분을 커밋했다(`b975f70` → `3c912ea`). `git diff HEAD`가 S1 파일에서 비어 있고 커밋 stat(8파일, +1116/−88)이 검수한 diff와 동일함을 확인 → **검수 대상 = 커밋 `3c912ea`의 내용**. "수정 전" 비교는 `b975f70` 기준.

---

## 0. 직접 실행한 검증과 결과 수치

| # | 검증 | 결과 |
|---|---|---|
| 1 | `npx tsc --noEmit` (+ `--incremental false` 재확인) | **exit 0**, 오류 0. `--listFilesOnly`로 `tests/*.test.ts` 2개가 타입 검사 대상임을 확인 |
| 2 | `npm test` | **61 tests / 20 suites / pass 61 / fail 0** (≈1.1s), 두 파일 모두 실행 |
| 3 | `TZ=UTC / Asia/Seoul / America/Los_Angeles / Pacific/Kiritimati npm test` | 4개 TZ 모두 **61/61** |
| 4 | 같은 테스트를 **수정 전 소스(`b975f70`)** 에 적용 (스크래치패드 사본) | **53/61 실패** → 테스트가 기준선 결함을 실제로 검출함 (Generator 주장 재현) |
| 5 | 변이 테스트 18종 (스크래치패드 사본에 1개씩 주입) | **17/18 검출**. 생존 1건 = `parseIntParam`이 부호 붙은 숫자 허용(아래 개선 지시 2) |
| 6 | `bash $SP/qa-env.sh restart` (파일 리다이렉트) | **`APP UP (2s, css 200)`**. 빌드 "Compiled successfully" + 타입 검사 통과, 새 서버 PID 20018(14:33 기동, 새 CSS `094407451c12813b.css` 38,802B) — 낡은 서버 아님 확인 |
| 7 | `npx tsx $SP/planner-s1-exports-check.ts` | **exit 0** — 기존 export(utils 16 / constants 8) 전부 유지, 신규 계약 API 전부 존재 |
| 8 | `node $SP/planner-s1-verify.js` | **7/7 PASS** — T1 넘침 0(12 라우트×3), T2 computed 일치, T3 28 / 34.56 / 40px, T4 관리자 표 기하 6건 동일, T5 배지 유색·밝은 테두리 0, T6 `none`/`none`, T7 하이드레이션 오류 0 |
| 9 | `node $SP/audit.js s1-eval` → 기준선 비교(`eval-s1-compare.js`) | 공통 147건: **신규 OVERFLOW 0 · 신규 CONSOLE 0 · 신규 PAGEERR 0 · 신규 FAILED 0 · 상태코드 변화 0**. 상세는 §3 |
| 10 | Unsplash ID 전수 `curl -I` (V1-2) | 고유 ID **60개 전부 200** (비200 출력 없음). 교체 6개는 실제 URL(`w=800&h=500…`) GET → 200 `image/jpeg` 48~160KB, 제거된 6개는 여전히 404 |
| 11 | 빌드 CSS 클래스 (V2-1) | 7/7 OK. 추가로 `constants.ts`의 카테고리 클래스 **64/64** + 폴백 4종 존재, `#e5e7eb` **0건**, preflight `border:0 solid #30363d` |
| 12 | 생성 CSS 선택자 diff (수정 전 config+CSS vs 현재) | 555 → 634: **+79 / −0**, 변경 6건(`*`·`::before`·`::after` 테두리색, `body` 줄바꿈, `table` 리셋, `.text-headline-xl`) — 전부 의도된 변경 |
| 13 | V5-2 `grep -nE "toLocale\|Intl\." src/lib/utils.ts` | **0건** |
| 14 | V5-3 `/article/1` | `2026.10.05 22:08` 형식, `AM/PM/Invalid Date` **0건**. 395(날짜 null) 빈칸, 396(미래) 절대 시각, 397(과거) `2026.08.26`/`2026.08.26 22:08` |
| 15 | 독립 프로브(`eval-s1-probe.js`, 25 공개 + 4 관리자 라우트 × 2 뷰포트) | 카드 배지 **724/724 유색**, 상세 배지(전체 테두리) **46/46 유색**, 기본 테두리색에 의존하는 요소 **0개**, `YYYY.MM.DD` 날짜 116건. 오전/오후는 관리자 화면 2곳뿐(아래 회귀 §4 참고, S1 범위 밖) |
| 16 | 미측정 폭(320 / 360px) 넘침·크롬 변화 (`eval-s1-narrow.js`, 수정 전 줄바꿈 규칙 에뮬레이션과 비교) | 신규 넘침 0. 넘침 2건(`/world`, `/breaking?page=7`)은 수정 전 규칙에서도 동일 = D5 페이지네이션. 크롬 변화는 한국어 어절 줄바꿈 효과뿐(예: 관리자 버튼 "수동 수/집 실행" → "수동/수집/실행") |
| 17 | 워커 경로(tsx) | `normalizer` → `OK [ 'normalizeArticle' ]`, `scraper` OK, `collector` import OK(실행 안 함) |
| 18 | API 스모크 | `/api/articles`, `/api/articles/1`, `/api/search`, `/api/trending`, `/api/categories` 200·응답 형태 불변 |
| 19 | DB | 기사 410건, imageUrl https 273 / null 136 / `//` 1 — 불변. S1 커밋에 prisma·API·워커·컴포넌트·페이지 파일 변경 0 |
| 20 | 카테고리 배지 대비 | 16색 × 3 표면(#0d1117/#161b22/#21262d) 최소 **4.61:1** (전부 WCAG AA 4.5 이상) |

스크린샷 육안 확인: `$SP/peek/eval-s1-unbroken-{0,1}.jpg`, `eval-s1-home-{0,1}.jpg`, `eval-s1-long-0.jpg`, `eval-s1-art2-0.jpg`, `eval-s1-ja-0.jpg`, `eval-s1-zh-0.jpg`, `eval-s1-admin360-{now,preS1}.png`, `eval-s1-photos.png`.

---

## 1단계: 코드 분석 요약

- `tailwind.config.ts`: `content`에 `src/lib`·`src/hooks` 추가(`src/workers` 미포함), `borderTokens` 공유 상수로 `colors.border`와 `borderColor.DEFAULT` 단일 출처, `headline-xl` = `clamp(1.75rem, 1.2rem + 2vw, 2.5rem)`.
- `globals.css`: SPEC 규칙을 그대로 base 레이어에 추가(+근거 주석), `.scrollbar-hide` 별칭.
- `constants.ts`: `CategoryStyle` 타입, 16개 `borderAll` 완전 리터럴, `MAX_PAGE`, `BREAKING_ITEMS_PER_PAGE`, `IMAGE_PLACEHOLDER_SRC`(SPEC SVG 그대로).
- `utils.ts`: 엄격 ISO 파서 + 고정 +9h KST 날짜 유틸, `parseIntParam`/`parsePage`, D1 사진 교체 + 견고한 `getDefaultImage`, `getArticleImageSources`, URL 유틸 견고화, `getDisplayTitle`/`toLangTag`, 프로토타입 키(`constructor`·`__proto__`) 방어용 `hasOwn`.
- 모든 변경이 추가형. 기존 export 이름·종류 유지, 시그니처는 확장만.

---

## 2단계: SPEC 개선 항목 검증

- [PASS] **항목 1 [D1] 죽은 사진 6개 교체 + `getDefaultImage` 견고화** — `utils.ts:392-409`. diff상 `CATEGORY_PHOTOS` 변경은 지정 6슬롯(market[1], sports[0], semiconductor[2], automotive[2], culture[2], general[0]) ID 치환 + 선언줄(`export`, `Readonly<Record<string, readonly string[]>>`)뿐. `getDefaultImage`(`utils.ts:418-427`): `(category ?? '').trim().toLowerCase()` + own-property 검사 → 미지·프로토타입 키는 `general`; id는 number 그대로/그 외 `parseInt(…,10)`, 유한수면 `Math.abs(Math.trunc(n)) % len`, 아니면 0. URL 형식 불변. 양의 정수 id 매핑 불변(테스트가 16 slug × id 0~11 검증). 고유 ID 60개 실측 200, 감사에서 죽은 ID로 인한 깨진 이미지 **230 → 0**. 교체 사진 육안 확인(캔들차트·야구장·CPU·자동차·붓·신문 — 카테고리에 적합).
- [PASS] **항목 2 [S1-A] 카테고리 색 체계 복구** — `tailwind.config.ts:4-18,48-52`, `constants.ts:101-126`, `utils.ts:456-459`. 빌드 CSS에 카테고리 클래스 64/64 + 폴백, `border-blue-500` 등 전체 테두리 클래스 생성(기사 상세의 기존 `.replace()` 코드도 즉시 색 획득 — 46/46 확인). 기본 테두리색 #30363d, `#e5e7eb` 0건. 렌더링 배지 724/724 유색, 섹션 헤더(AI·테크=cyan, 사회=orange, 문화=rose) 유색 육안 확인.
- [PASS] **항목 3 [D6] 전역 타이포 안전장치** — `globals.css:13-32`. 규칙이 SPEC과 문자 단위 동일, `break-all` 없음. T1/T2/T4 PASS, 감사에서 `art-unbroken` 넘침 3뷰포트 모두 소멸(문서 폭 2029/2033/2305 → 375/768/1440), 신규 넘침 0. 모바일 `/article/392`: URL 제목·본문 URL·"AAAA…" 단어가 375px 안에서 줄바꿈. `/article/391`: 어절 단위 줄바꿈("수출입", "배터리" 미분리).
- [PASS] **항목 4 [D6] 유동 `headline-xl`** — `tailwind.config.ts:63`. 빌드 CSS `font-size:clamp(1.75rem,1.2rem + 2vw,2.5rem)`, lineHeight 1.15/weight 800 불변. T3 실측 28 / 34.56 / 40px.
- [PASS] **항목 5 [D7] 결정적 KST 날짜 유틸** — `utils.ts:163-299`. `Intl`/`toLocale*` 0건, `getUTC*` + 고정 +9h. SPEC 예시·`timeAgo` 경계표 전부 테스트로 확인, 4개 TZ 동일 출력. 무효 입력 `''`/`null`/`undefined`, 60초 넘는 미래 → 절대 시각, 7일 이상 `YYYY.MM.DD`. JSDoc에 하이드레이션 계약 명시. 기준선의 `[tablet] art-chinese` React #425/#422 소멸. *(경미한 잔여 갭: 비-ISO·존 미표기 문자열 → 개선 지시 1)*
- [PASS] **항목 6 [D8 기반] `parseIntParam`/`parsePage` + `MAX_PAGE`** — `utils.ts:362-385`, `constants.ts:82-89`. 배열 첫 요소, trim 후 `/^\d+$/`만 인정, `Number.isInteger` 숫자만, [min,max] clamp, 400자리 숫자 → Infinity → MAX_PAGE. 직접 확인: `parseIntParam('-3',{1,100,20})`=20, `parsePage('+7')`=1, `parsePage(' 7 ')`=7(전각 공백 포함 trim).
- [PASS] **항목 7 [D25] `npm test` + 단위 테스트** — `package.json` `scripts.test` 한 줄만 추가, 의존성 변경 없음(`postcss`·`tailwindcss`는 기존 devDependency). `node:test` + `node:assert/strict`, 상대 import, 네트워크 없음, TZ 변경은 `finally` 원복. SPEC 표의 모든 행을 테스트 파일과 대조 — 누락 행 없음. 추가 가치: TZ 전환 유효성 sanity check(공허한 TZ 테스트 방지), 결정적 PRNG fuzz 1,000건, **실제 config로 globals.css를 Tailwind 컴파일해 생성 CSS를 검사**(S1-A 같은 퍼지 회귀를 원천 검출).
- [PASS] **항목 8 [D2/D3 기반] 이미지 체인 + 오프라인 플레이스홀더** — `utils.ts:435-446`, `constants.ts:128-144`. 체인 `[프록시 원본?, Unsplash, 플레이스홀더]`, 중복 제거, 결정적. 플레이스홀더는 SPEC SVG 그대로(800×500, #21262d/#30363d만, 텍스트·글꼴·외부 참조 없음), 렌더링 육안 확인 — 조용한 사진 아이콘, 팔레트 내. `isValidArticleImage(IMAGE_PLACEHOLDER_SRC)` = false.
- [PASS] **항목 9 [S1-B] `.scrollbar-hide` 별칭** — `globals.css:130-139`. 빌드 CSS `.scrollbar-hide,.scrollbar-none{scrollbar-width:none;…}`, T6 `/category/market`·`/japan` computed `none`.
- [PASS] **항목 10 [S1-C] URL 유틸 견고화** — `utils.ts:79-87`(http/https 외 false: `javascript:`, `ftp:`, `blob:` 확인), `utils.ts:126-131`(`//` → https 프록시, `data:`·`/`·`''` 통과, 출력 형식 불변). 기존 호출부는 모두 normalize→validate→proxy 순서라 동작 일관.
- [PASS] **항목 11 [D6 후속] `toLangTag`/`getDisplayTitle`** — `utils.ts:487-511`. SPEC 표 6행 + toLangTag 행 전부 테스트로 확인. echo·공백 `titleKo`는 미번역 취급.

**SPEC 항목 결과: 11/11 PASS**

---

## 3단계: 기준선 대비 감사 결과 (`audit-baseline.json` vs `audit-s1-eval.json`)

| 지표 (공통 147 레코드) | 기준선 | S1 후 | 판정 |
|---|---|---|---|
| 넘침 요소 | 8 | 3 | 남은 3개 = 모바일 `breaking?page=7` 페이지네이션(D5, S3 담당) |
| 문서 폭 넘침 페이지 | 3 | **0** | `art-unbroken` ×3 해소 |
| 페이지 에러 | 2 | **0** | `[tablet] art-chinese` React #425/#422 소멸 |
| 콘솔 에러 | 13 | 13 | 신규 0 (남은 것: 관리자 401 = D12, `/api/img` 500 = 외부망 차단·D24, 모두 기준선과 동일) |
| 실패 요청 | 6 | 6 | 신규 0 |
| 상태코드 변화 | — | 0 | |
| 죽은 D1 ID로 깨진 이미지 | **230** | **0** | D1 해소 |
| 깨진 이미지 총계 | 1193 | 1199 | 감사는 외부망을 고의 차단(최악 조건) → Unsplash 전부 실패가 정상. +6은 교체 ID의 슬롯 1:1 대응 + 지연 로딩 타이밍 차(`breaking-p14` 16↔19 등). D2/D3는 S3 몫 |

S1이 뒤 슬라이스에 제공해야 할 헬퍼·토큰(`parsePage`, `parseIntParam`, `MAX_PAGE`, `BREAKING_ITEMS_PER_PAGE`, `getArticleImageSources`, `IMAGE_PLACEHOLDER_SRC`, `toIsoDateTime`, `getDisplayTitle`, `toLangTag`, `borderAll`, `.scrollbar-hide`)은 **전부 존재**(exports-check exit 0) → 누락 감점 없음.

---

## 4단계: 회귀 검증

- **기존 export·타입**: utils 16 / constants 8개 이름·종류 유지, 기존 호출부(`timeAgo(article.publishedAt)`, `getDefaultImage(cat, id)`, `getCategoryStyle(slug)` 등) 무수정으로 `tsc` 통과. 컴포넌트에서 스타일 객체를 spread/`Object.values`로 쓰는 곳 없음 → `borderAll` 추가 영향 없음.
- **워커(tsx)**: `normalizer`/`scraper`/`collector` 모듈 로드 정상. 워커가 쓰는 `isValidArticleImage`의 의미 변화(비 http(s) 거부)는 DB 데이터(https/null/`//`)에 영향 없음.
- **레이아웃**: 신규 넘침 0(375/768/1440 + 추가 320/360). 관리자 표 기하 6건 동일(T4). 데스크톱 h1 40px 불변. 기본 테두리색 변경에 의존하는 요소 0개(센티널 색 주입 프로브) → 순수 안전망.
- **CSS 부수 효과**: `src/lib` 스캔으로 사용처 없는 클래스 13개(`countryColor`/`PRIORITY_STYLES`/`AI_BADGE_STYLE` 문자열, `'static.chinadaily…'`에서 나온 `.static`)가 생성됨. 적용 요소 0개(호출부 없음 확인; `SourceBadge.tsx`는 R4에서 삭제) → 화면 영향 없음, CSS +약 0.5KB.
- **의도된 출력 변경(SPEC 명시)**: `formatDate` `'2026. 10. 01. AM 08:03'` → `'2026.10.01 17:03'`, 7일 이상 `timeAgo` `'2026년 9월 28일'` → `'2026.09.28'`.
- **DB·API**: 스키마·데이터 무변경, API 응답 형태 불변.
- **이월 위험(감점 반영, S3/S4가 닫아야 함)**: 전역 `word-break: keep-all` 때문에 `lang` 속성이 없는 **일본어·중국어 원문**(미번역 제목·"원문(번역 준비 중)" 본문)이 구두점·공백에서만 줄바꿈되어 "한 절씩 한 줄" 형태로 들쭉날쭉해짐(`/article/393`, `/article/394` 실측: `lang=ko`, `word-break: keep-all` 상속). 넘침은 없고 SPEC이 예견·승인한 과도기 상태("D6 후속")이며 S1은 컴포넌트 수정이 금지돼 있어 S1 범위에서 해결 불가. **S3/S4에서 `lang` 적용이 누락되면 그대로 출시되는 회귀**이므로 S3/S4 QA의 필수 확인 항목으로 지정한다.
- **범위 밖으로 확인만 한 것**: 관리자 화면 `오전/오후` 표기(`admin/page.tsx:208`, `admin/logs/page.tsx:118-119`의 `toLocaleString`, S4 계약), `/api/search?page=abc` 500(D8 API, S4/S5), 320px `/world` 페이지네이션 넘침(D5, S3).

---

## 5단계: 채점

- **디자인 품질 8/10** — 6개월간 한 번도 렌더링되지 않던 카테고리 색 체계(2px 컬러 틱 라벨, 섹션 헤더, 상세 배지 전체 테두리)와 다크 테두리가 실제로 보이게 됐고, 어절 단위 한국어 조판 + 유동 대제목으로 가독성이 확실히 개선됨. 새 색·장식 없음, AI slop 없음, 배지 대비 ≥4.61:1. 감점: 중·일 원문의 과도기 들쭉날쭉 줄바꿈(가시적 품질 저하), 교체 사진 일부가 특정 브랜드 제품(AMD Ryzen, Ford Mustang)을 크게 노출해 범용 대체 이미지로서 편집 중립성이 약함(SPEC 지정 ID라 지시하지 않음).
- **독창성 8/10** — 해결 방식이 적절하고 차별적: 네트워크 0·팔레트 2색·16:10 일치·테스트로 제약을 강제한 플레이스홀더, min-content까지 고려한 `anywhere`+`keep-all`+표/`:lang` 리셋 설계, **생성 CSS를 직접 컴파일해 퍼지 회귀를 잡는 테스트**, 공허한 TZ 테스트를 막는 sanity check, 프로토타입 키 방어. 다만 핵심 설계 상당 부분이 SPEC에서 처방된 것이라 Generator 고유 기여는 실행 품질 쪽.
- **기술적 완성도 8/10** — tsc 0, 빌드 통과, 61/61 × 4 TZ, 수정 전 코드에서 53/61 실패(검출력), 변이 17/18 검출, 의존성 추가 없음, 단일 출처 토큰, 완전 리터럴 클래스, JSDoc 계약. 감점: (1) `utils.ts:200` 비-ISO 문자열의 `Date.parse` 폴백이 존 미표기 시 **서버 TZ에 의존**(`'2026/10/01 08:03'` → UTC "17:03" / Seoul "08:03" / LA "2026.10.02 00:03")해 D7의 "TZ 무관" 보장과 주석("carry their own zone")이 사실과 다름, (2) 부호 숫자 문자열에 대한 테스트 공백(변이 생존).
- **기능성 8/10** — 기사 상세·목록·검색·필터 정상, 카테고리 색이 탐색 단서로 작동, 날짜 일관 표시, 필 행 스크롤바 숨김 동작, D1 깨진 이미지 제거. 감점: 중·일 원문 가독성 저하(과도기), 제공 헬퍼 다수의 사용자 효과는 S3/S4 적용 후에야 발생.
- **회귀 안전 8/10** — 신규 넘침·콘솔·페이지 에러·실패 요청·상태 변화 0, export·워커·DB·API·관리자 표 기하·팔레트 불변. 감점: 중·일 원문 줄바꿈 품질이 기준선보다 나빠진 상태로 이월(S3/S4 의존).

**가중 점수** = 8×0.3 + 8×0.2 + 8×0.25 + 8×0.15 + 8×0.1 = **8.0 / 10.0**

---

## 피드백

**전체 판정**: 합격
**가중 점수**: 8.0 / 10.0

**항목별 점수**:
- 디자인 품질: 8/10 — 잠복했던 카테고리 색·다크 테두리 복구와 어절 조판으로 의도한 디자인이 처음으로 실제 화면에 구현됨. 중·일 원문 과도기 줄바꿈이 흠
- 독창성: 8/10 — 무네트워크 플레이스홀더와 생성 CSS 컴파일 테스트 등 해결 방식이 정교하고 차별적. 핵심 설계는 상당 부분 SPEC 처방
- 기술적 완성도: 8/10 — 타입·빌드·테스트(4 TZ, 검출력 53/61, 변이 17/18) 견고. 비-ISO `Date.parse` 폴백의 TZ 의존과 작은 테스트 공백
- 기능성: 8/10 — S1 범위 기능 전부 동작, D1 깨진 이미지 230→0. 헬퍼의 사용자 효과는 뒤 슬라이스 적용에 의존
- 회귀 안전: 8/10 — 기준선 대비 신규 결함 0. 중·일 원문 줄바꿈 저하가 S3/S4 `lang` 적용 전까지 이월

**구체적 개선 지시** (모두 **비차단** — 합격 판정에 영향 없음. 다음 S1 손질 기회나 S3 착수 전에 반영 권장):
1. `src/lib/utils.ts:200` — `if (!m) return Date.parse(s);`가 존 표기 없는 비-ISO 문자열(`'2026/10/01 08:03'`, `'Oct 1, 2026 08:03'`)을 프로세스 로컬 TZ로 해석해 D7 보장을 깬다. 비-ISO 분기에서는 문자열 끝에 명시적 존(`/(?:\bZ|\b(?:GMT|UTC)|[+-]\d{2}:?\d{2})\s*$/i` 등)이 있을 때만 `Date.parse`를 쓰고 그 외는 `NaN`(→ `''`)을 반환하라. 주석 "other formats (RFC 2822 …) carry their own zone"도 사실에 맞게 고칠 것. `tests/utils.test.ts`의 TZ 독립성 스냅샷(`INPUTS`, 157행)에 `'2026/10/01 08:03'`을 추가해 4개 TZ에서 동일 출력(또는 `''`)을 단언하라.
2. `tests/utils.test.ts:229-238`(`parseIntParam`) — 부호 허용 변이가 생존했다(`parsePage`는 min=1 clamp 때문에 `'-3'`이 우연히 1이 됨). `assert.equal(parseIntParam('-3', LIMIT), 20)`, `assert.equal(parseIntParam('+7', LIMIT), 20)`, 그리고 183행 `parsePage` 무효 목록에 `'+7'`을 추가하라(현재 구현은 이미 올바름 — 테스트만 보강).
3. **S3/S4 인계(필수 확인 항목으로 승격)** — 전역 `keep-all`의 중·일 예외가 작동하도록 제목은 `const t = getDisplayTitle(article)` → `<h1|h3 lang={t.lang}>{t.text}</h1|h3>`로 교체(`NewsCard.tsx:11`, `NewsCardLarge.tsx:11`, `NewsCardCompact.tsx:16`, `BreakingTicker.tsx:46`, `article/[id]/page.tsx:19,72`, `admin/articles/page.tsx:101`), 원문 본문 컨테이너(`article/[id]/page.tsx:150-160` "원문(번역 준비 중)", `:173-185` "원문 보기")에 `lang={toLangTag(article.language)}` 부여. S3/S4 Evaluator는 `/article/393`·`/article/394` 모바일에서 제목·원문 단락의 computed `word-break`가 `normal`인지 확인할 것.
4. (참고, 지시 아님) S3/S4가 배지를 손볼 때 `article/[id]/page.tsx:106`의 `catStyle.border.replace('border-l-','border-')`를 `catStyle.borderAll`로 교체(계약 C-6). 현재는 S1 덕분에 동작하지만 동적 클래스 조합 금지 규칙 위반 상태.

**방향 판단**: [현재 방향 유지]

---

## 재실행용 도구 (스크래치패드 `$SP`)
- 비교: `node $SP/eval-s1-compare.js baseline s1-eval`
- 독립 프로브(배지·기본 테두리·날짜): `node $SP/eval-s1-probe.js`
- 좁은 폭(320/360) 비교: `node $SP/eval-s1-narrow.js`
- 변이 테스트: `bash $SP/eval-s1-mutate.sh` (HEAD 사본에서 실행, 작업 트리 무변경)
- 생성 CSS 선택자 diff: `cd $SP/headcheck && npx tsx ./eval-s1-cssdiff.ts $SP/headcheck /home/user/hydro`
- 로그: `eval-s1-restart.log`, `eval-s1-verify.log`, `audit-s1-eval.log/.json`, `eval-s1-probe.log`, `eval-s1-narrow.log`, `eval-s1-unsplash.txt`, `eval-s1-headcheck.log`
