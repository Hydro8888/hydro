# 자체 점검 — 슬라이스 S1 (Round 5, 결함 수정 라운드)

## SPEC 개선 항목 체크
- [x] 항목 1 [D1]: `CATEGORY_PHOTOS`의 404 사진 6개를 **같은 슬롯**에서 교체(market[1], sports[0], semiconductor[2], automotive[2], culture[2], general[0]). 나머지 58슬롯은 그대로 두고 `export const … : Readonly<Record<string, readonly string[]>>`로 바꿈. `getDefaultImage`가 `null`/`undefined` 카테고리와 id를 받고, 카테고리는 trim+소문자, id는 `Math.abs(Math.trunc(n)) % 4`(NaN·무한대 → 0). 프로토타입 키(`constructor` 등)는 own-property 검사로 `general` 처리. 양의 정수 id 매핑은 기존과 같음.
- [x] 항목 2 [S1-A]: `content`에 `src/lib`·`src/hooks` 글롭 추가. `borderColor.DEFAULT`는 `borderTokens.DEFAULT`(#30363d)를 공유 상수로 참조(단일 출처). `CategoryStyle` 타입 추가, 16개 항목에 `borderAll` 리터럴(`border-l-`→`border-`) 추가, `getCategoryStyle(): CategoryStyle`이고 폴백에 `borderAll: 'border-gray-500'` 추가(기존 필드·값은 그대로).
- [x] 항목 3 [D6]: `@layer base`에 SPEC 규칙을 그대로 넣음. `body`는 `overflow-wrap:anywhere; word-break:keep-all`, `:lang(ja), :lang(zh)`는 `word-break:normal`, `table`은 `break-word`+`normal`. `break-all`은 쓰지 않음.
- [x] 항목 4 [D6]: `headline-xl` = `clamp(1.75rem, 1.2rem + 2vw, 2.5rem)`, lineHeight 1.15와 weight 800은 그대로. 실측 28 / 34.56 / 40px.
- [x] 항목 5 [D7]: `DateInput`, `KstParts`, `toKstParts`, `formatDate`('YYYY.MM.DD HH:mm'), `formatDateOnly`, `toIsoDateTime`, `timeAgo(input, now?)` 구현. 고정 +9h와 `getUTC*`만 쓰고 ICU 로캘 API는 쓰지 않음. 타임존 표기가 없는 ISO 문자열은 UTC로 해석. 무효 입력은 `''`/`null`/`undefined`, 60초 넘는 미래는 절대 시각, 7일 이상은 'YYYY.MM.DD'. JSDoc에 하이드레이션 계약(`<time … suppressHydrationWarning>`) 명시.
- [x] 항목 6 [D8]: `MAX_PAGE = 10_000`, `BREAKING_ITEMS_PER_PAGE = 30` 추가. `parseIntParam`(배열은 첫 요소, `/^\d+$/` 문자열 또는 정수만 인정, clamp)과 `parsePage` 구현.
- [x] 항목 7 [D25]: `package.json`에 `"test": "tsx --test tests/*.test.ts"` 한 줄 추가(의존성 변경 없음). `tests/utils.test.ts`, `tests/design-tokens.test.ts` 신규 작성. SPEC 표의 모든 행을 단언으로 포함했고, 그 밖에 TZ 전환 유효성 sanity check, 1,000건 결정적 fuzz, 실제 config로 `globals.css`를 Tailwind 컴파일해 생성 CSS를 검사하는 테스트(네트워크 없음, 약 0.4초)를 추가함.
- [x] 항목 8 [D2/D3 기반]: `IMAGE_PLACEHOLDER_SRC` 추가(인라인 SVG data URI, 800×500, #21262d 바탕에 #30363d 사진 아이콘, 텍스트·글꼴·외부 참조 없음). `getArticleImageSources()`는 `[프록시 원본?, Unsplash, 플레이스홀더]` 순서이고 중복 제거, 결정적, 마지막은 항상 플레이스홀더.
- [x] 항목 9 [S1-B]: `.scrollbar-none, .scrollbar-hide` 셀렉터 별칭 추가(`::-webkit-scrollbar` 포함). 페이지 파일은 수정하지 않음.
- [x] 항목 10 [S1-C]: `isValidArticleImage`가 `new URL().protocol`이 `http:`/`https:`가 아니면 false 반환. `proxyImageUrl`은 `//…`를 `https:`로 보정해 프록시하고, `data:`·`/`·`''`는 그대로 통과. 출력 형식은 그대로.
- [x] 항목 11 [D6 후속]: `toLangTag`(trim+소문자, `/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/`)와 `getDisplayTitle`(공백·echo 제목은 미번역 취급, `{text, lang, isTranslated}`) 구현.

## 수정 파일 목록
- `tailwind.config.ts`: content 글롭 2개, `borderTokens` 공유 상수, `borderColor.DEFAULT`, 유동 `headline-xl`
- `src/app/globals.css`: base 레이어 줄바꿈 규칙 3개, `.scrollbar-hide` 별칭
- `src/lib/constants.ts`: `BREAKING_ITEMS_PER_PAGE`, `MAX_PAGE`, `CategoryStyle`, `CATEGORY_COLORS.*.borderAll`, `IMAGE_PLACEHOLDER_SRC`
- `src/lib/utils.ts`: 항목 1·2·5·6·8·10·11 구현, `CategoryStyle` 타입 재export, `hasOwn` 내부 헬퍼
- `package.json`: `scripts.test` 한 줄
- `tests/utils.test.ts` (신규, 15 suite), `tests/design-tokens.test.ts` (신규, 5 suite)

## 디자인 자체 평가
- AI slop 패턴 사용 여부: **없음**. 새 색·그라데이션·장식·애니메이션이 없고, 토큰 값도 바꾸지 않음(팔레트 스냅샷 테스트로 고정). 플레이스홀더는 #21262d/#30363d 두 색만 사용(테스트로 검증).
- 독창적 요소: R1에서 설계했지만 6개월간 한 번도 렌더링되지 않던 **좌측 2px 컬러 틱의 터미널형 카테고리 라벨**이 이제 실제로 표시됨(16색, 기사 상세의 전체 테두리 배지 포함). 한국어 제목이 어절 단위로 줄바꿈되고, 대제목은 28→40px로 유동 조판됨.
- 다크 모던 테마 일관성: 라이트 테마 기본 테두리 `#e5e7eb`가 빌드 CSS에서 0건(preflight `border:0 solid #30363d`). T5 실측에서도 밝은 회색 테두리 0건, 배지 전부 유색.

## 회귀 위험 확인
- 기존 기능 영향: **의도된 변경만 있음**.
  - 날짜 표시 형식: `'2026. 10. 01. AM 08:03'` → `'2026.10.01 17:03'`, 7일 이상 `timeAgo`는 `'2026년 9월 28일'` → `'2026.09.28'`(SPEC 명시).
  - 대체 사진: 6개 슬롯 ID만 교체됨.
  - 비 http(s) 이미지 URL은 무효 처리됨(DB는 https/null/`//` 1건이라 영향 없음).
  - `//` URL은 이제 프록시를 경유함.
- 빌드 CSS 부작용: 셀렉터 79개 추가, 제거 0개.
  - 의도된 추가: 카테고리 색 63, `:lang`×2, `.scrollbar-hide`×2.
  - 부수적 추가: 사용처가 없는 `countryColor`/`PRIORITY_STYLES`/`AI_BADGE_STYLE`의 클래스 11개, 기존 `utils.ts` 문자열에서 나온 `.static`. 이 클래스들을 쓰는 요소가 없어서(UI 파일에서 정확한 토큰 매치 0건) 화면 변화는 없음.
- 기존 export: utils 16개와 constants 8개를 이름·종류 그대로 유지하고, 신규 API는 모두 추가형(`planner-s1-exports-check.ts` exit 0). 기존 호출부(`timeAgo(article.publishedAt)` 등)는 수정 없이 타입 통과. 워커 로드 정상: `OK [ 'normalizeArticle' ]`.
- TypeScript 오류: **없음** (`npx tsc --noEmit` exit 0, `next build` 타입 검사 통과. 테스트 파일도 포함).
- SPEC 해석 메모:
  - 미지 slug 폴백의 "같은 불변식"은 `borderAll === border.replace(…)`로 적용함. 폴백의 `text`/`bg`는 항목 2.4의 "기존 필드·값 불변"에 따라 `text-text-secondary`/`bg-surface-elevated`를 유지하고, 테스트도 정확한 값으로 단언.
  - 존재하지 않는 날짜(`2026-02-30`)는 V8처럼 다음 달로 넘기지 않고 무효(`''`)로 처리.

## 검증 실행 결과 (최종 빌드 기준)
| # | 검증 | 결과 |
|---|---|---|
| 1 | `npx tsc --noEmit` | **통과** (오류 0) |
| 2 | `npm test` | **61/61 통과**, 20 suite, 두 파일 모두 실행, 약 1.3초. `TZ=UTC / Asia/Seoul / America/Los_Angeles / Pacific/Kiritimati` 모두 61/61. 수정 전(HEAD) 소스에서 같은 테스트를 돌리면 53/61 실패(결함 검출력 확인) |
| 3 | `qa-env.sh restart` | **빌드 성공** ("Compiled successfully" + 타입 검사). CSS 32,665 → 38,802 B. :4000 기동(PID 15794), CSS 200 응답 |
| 4a | `planner-s1-exports-check.ts` | **exit 0** (pre-R5 export 전부 존재, 신규 계약 API 전부 존재) |
| 4b | `planner-s1-verify.js` | **7/7 통과**. T1 넘침 0(12 라우트×3), T2 computed 일치, T3 28/34.56/40px, T4 표 기하 동일(6), T5 배지 전부 유색·밝은 테두리 0, T6 `none`, T7 하이드레이션 오류 0 |
| 4c | `audit.js s1-gen` (기준선 대비) | 공통 147건에서 **신규 OVERFLOW·CONSOLE·PAGEERR·FAILED·STATUS 0**. `art-unbroken` 넘침은 3개 뷰포트 모두 해소(문서 넘침 3→0). 기준선의 `[tablet] art-chinese` React #425/#422 사라짐. 남은 넘침 1건은 모바일 `breaking?page=7` 페이지네이션(기존 D5, S3 담당) |
| 5 | 빌드 CSS 클래스 | V2-1 7개 전부 OK. 카테고리+폴백 68/68 존재(`border-blue-500` 등 포함), `#e5e7eb` 0건 |
| - | V1-2 Unsplash 실검증 | 고유 ID 60개 전부 **200** (비200 출력 없음) |
| - | V1-3 diff | `CATEGORY_PHOTOS`는 ID 치환 정확히 6건 + 선언줄(export/타입) |
| - | V5-2 `grep -nE "toLocale\|Intl\." utils.ts` | **0건** |
| - | V5-3 기사 페이지 | `2026.10.05 22:08` 형식, `AM/PM/Invalid Date/오전/오후` 0건(기사 1·391·392·395·396·397, 홈). 미래 기사는 절대 시각, 날짜 null은 빈칸 |
| - | V3-3 육안 | 모바일 `/article/392`: URL 제목이 화면 안에서 줄바꿈, h1 28px. `/article/391`: 어절 단위 줄바꿈. 배지 유색(에너지=amber, 자동차=sky). 스크린샷 `$SP/peek/s1gen-*.jpg` |

## 환경 이슈 (오케스트레이터 참고, 코드 무관)
- **`$SP/qa-env.sh restart`가 서버를 실제로 재시작하지 않는다.**
  - 원인: `pkill -f "next start -H 127.0.0.1 -p 4000"`이 매치되지 않는다. Next가 프로세스 제목을 `next-server (v14.2.18)`로 덮어쓰기 때문.
  - 증상: 새 서버는 `EADDRINUSE`로 실패하는데(`$SP/next.log`), 12:34에 기동한 옛 서버가 200을 응답해서 "APP UP"이 출력된다. 그 서버는 `rm -rf .next`로 지워진 CSS를 참조하므로 400이 나고, 화면이 무스타일로 렌더링되어 T1·T2·T3·T5·T6이 거짓 FAIL한다.
  - 조치: 포트 4000을 점유한 옛 PID 1358(cwd `/home/user/hydro`)을 직접 종료한 뒤 재실행해서 검증함. 도구 파일 자체는 수정하지 않음.
  - 권장 수정: 기동 전에 `fuser -k 4000/tcp` 추가.
- `qa-env.sh restart`의 출력을 파이프(`| tail`)로 받으면 끝나지 않는다. 백그라운드 서브셸이 파이프를 계속 잡고 있기 때문이므로, 출력은 파일로 리다이렉트할 것.

## 뒤 슬라이스 인계 (SPEC 계약 그대로)
- S3: 카드의 `timeAgo`를 `<time dateTime={toIsoDateTime(d)} suppressHydrationWarning>`로 감싸기, `getArticleImageSources` 체인 적용(D2/D3/D4), 모바일 페이지네이션 넘침(D5), 제목에 `getDisplayTitle`+`lang` 적용.
- S4: 기사 상세 배지의 `.replace('border-l-','border-')`를 `catStyle.borderAll`로 교체, 페이지와 API에서 `parsePage`/`parseIntParam` 사용, `BREAKING_ITEMS_PER_PAGE` 사용, 원문 블록에 `lang={toLangTag(article.language)}` 지정.
