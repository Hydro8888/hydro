# S5 백엔드 & 프로세스 — 결함 수정 설계서 (Round 5, 핵심: 번역)

> 근거: `QA_BASELINE-R5.md`(D17~D24, D25), SPEC-S4 "슬라이스 간 계약" A~D, Planner 실측(아래 로그).
> **결함 수정 라운드**: 모든 항목은 결함 ID 또는 `파일:라인` 근거에 연결된다. 근거 없는 신규 기능·AI 기능 금지(planner.md 원칙 1·2는 이번 라운드 규칙으로 대체). **DB 스키마 변경 금지**, 의존성 추가 금지(`package.json` dependencies/devDependencies 불변).
> QA_REPORT-S4 개선 지시 4(`api/admin/sources/route.ts:94`)는 S4 Generator가 처리 중이므로 **S5 범위에서 제외**.

```
SP=/tmp/claude-0/-home-user-hydro/0832edd1-f39e-53fc-97a8-a3a334add43a/scratchpad
B=http://127.0.0.1:4000/livenews
export DATABASE_URL="postgresql://postgres@127.0.0.1:54329/livenews?schema=public" REDIS_URL="redis://127.0.0.1:6380"
PSQL="psql -h 127.0.0.1 -p 54329 -U postgres -d livenews -tA"
```

---

## 현재 상태 분석

### 장점 (유지)
- 제목 번역에 이미 echo 가드(`translator.ts:46-51,115`)와 idx 기반 매핑·부분 구제(`:100-131`)가 있다. 수집 시 새 echo는 저장되지 않는다.
- 한국어 소스 pass-through(`translator.ts:211-227`, `backfill.ts:58-73`, `content-translator.ts:282-295`)로 백로그가 줄지 않는 문제는 해결돼 있다.
- 서킷 브레이커(`lib/circuit-breaker.ts`)·지수 백오프(`lib/retry.ts`)·수집 후 자동 백필(`collector.ts:379-396`)·CLI 백필(`backfill-cli.ts`)이라는 뼈대는 맞다.
- `createMany({ skipDuplicates: true })`(`collector.ts:266-286`)는 기존 행을 덮어쓰지 않으므로 비활성 기사가 재활성되지 않는다(S4 계약 A `isActive` 충족 — 유지).
- 기존 단위 테스트 106개 전부 통과(`npm test`, tsx --test).

### Planner 실측 (현재 코드, 픽스처 reseed 직후)
| 실험 | 결과 | 결함 |
|---|---|---|
| `XAI_API_KEY=test XAI_BASE_URL=http://127.0.0.1:4010/v1 npm run backfill:translations -- --content` (로그 `$SP/planner-s5-baseline-backfill.log`) | **4분 21초, 0건 복구, exit 2**. 가짜 서버 요청 로그 **0줄** — base URL 하드코딩이라 api.x.ai로 나감. 400(키 오류)도 재시도, 이후 **`Circuit OPEN` 오류를 49회 백오프 재시도**. 실패한 청크에도 "Translated chunk" 로그 | D22, D20, 재시도 정책 |
| 같은 로그 "Untranslated titles at start: **45**" | 실제 미번역(echo 포함, 아래 SQL)은 **60** — echo 15건(341~355)이 집계·백필 대상에서 빠짐 | D17 |
| SQL: 비-ko 활성 기사 중 `contentKo` 없음/한글 없음 | 28건(356~380, 393, 394, 410) | 백필 대상 |
| SQL: 원문 > 6000자이고 번역 있음 | 381~390 — 원문 **60문단**, 번역 **12문단** | D18, D21 |
| SQL: 비-ko 활성 기사 `summaryKo` 없음/한글 없음 | 45건(301~340, 393, 394, **405**, 408, 409). 405(`emptybody`)는 제목은 번역됐지만 요약이 없음 — `backfill.ts:28-31`은 제목 NULL만 대상이라 **요약 결손은 영영 복구 안 됨**(fix-translations GET만 집계 `:117-120,135`) | 계약 A(summaryKo) |
| 가짜 서버 직접 호출: `1. TRUNCJSON …` 단독 요청 | 응답 `[{"idx":1,"titleKo":"한국어 제목: TRUNCJSON …","summaryKo":"요약: TRUNCJSON` (finish_reason=stop) — 현재 구제 로직(`translator.ts:84-95`)은 닫힌 `}`가 없으면 **titleKo가 온전한데도 버림** | JSON 복구 |
| `curl -G --data-urlencode url=http://127.0.0.1:4000/livenews/api/admin/health $B/api/img` | **200**, `content-type: application/json`(내부 서비스 응답을 그대로 중계) | D24 |
| `/api/img?url=http://localhost:4010/v1/models` | 502(= 내부 포트에 실제 접속함) / `?url=%25E0`, `?url=%` → **500** (`img/route.ts:206` 이중 `decodeURIComponent`) | D24, 계약 C |
| `curl $B/api/admin/health` (공개) | `pipeline.lastError`에 **피드 URL 포함 원시 에러 문자열** 노출, 번역 커버리지 없음 | D23, 계약 B |

### 결함 상세 (파일:라인)
| ID | 근거 | 내용 |
|---|---|---|
| **D17** | `backfill.ts:28-31`, `backfill-cli.ts:225-227`, `fix-translations/route.ts:112-115` | 미번역 = `titleKo NULL/''`만. echo(`titleKo`에 한글 없음 또는 원문과 동일)는 영구 미번역. 본문도 `contentKo NULL/''`만(`backfill.ts:33-39`) |
| **D18** | `content-translator.ts:307` `.slice(0, 6000)` vs `scraper.ts:60,188,207`·`normalizer.ts:449` 8000자 | 6000자 이후 소실 |
| **D19** | `content-translator.ts:331` `content` 만 읽고 `finish_reason` 무시, `:328` max_tokens 4000 | 잘린 번역이 완성본으로 저장 |
| **D20** | `translator.ts:28-34`, `content-translator.ts:255-261`, `image-generator.ts:115-121` — `timeout`/`maxRetries` 미지정(SDK 기본 600초·2회) × `retryWithBackoff` 2회(`translator.ts:163`, `content-translator.ts:333`) | 호출 1건이 최악 9회 × 10분 |
| 재시도 정책 | `retry.ts:20-40` 모든 오류 재시도(CircuitOpenError·401/400 포함). `translator.ts:157-164` 파싱/echo 실패(`:95,98,125` throw)가 `xaiTextBreaker.execute` **안에서** 발생 → 모델 출력 문제(ECHO 1건만 든 요청 3회)로 **서킷이 열려 5분간 전체 번역 중단**. `circuit-breaker.ts:344-347` HALF_OPEN에서 동시 프로브 무제한(수집 동시성 3) | |
| **D21** | 복구 경로 없음 | 381~390 원문 60문단 → 번역 12문단 |
| **D22** | 위 3개 `buildClient` `baseURL: 'https://api.x.ai/v1'` 하드코딩 | 모의 서버 검증 불가 |
| **D23** | `health/route.ts:47-76` 번역 지표 없음, `:61` `lastError` 원시 문자열, `:84` 503 본문 `error: message` | 공개 응답에 원시 에러 |
| **D24** | `img/route.ts:200-241` | 사설 IP·리다이렉트·Content-Type·크기 무검증, 이중 디코드 500 |
| 백필 CLI | `backfill.ts:49-56,110-115` 매 라운드 같은 `createdAt desc` 상위 N건 → 실패 행(ECHO 408)을 같은 실행에서 무한 재선택. `backfill-cli.ts:257-267` "0건 2라운드 = API 장애" → 모델 출력 거부만 남아도 exit 2 오진. `:264` 메시지 `https://api.x.ai` 고정 | |
| 카테고리 | `translator.ts:119` `primary`를 그대로 저장, `collector.ts:280` | 모델이 `Technology`·`tech` 등을 내면 알 수 없는 slug 저장(픽스처 399 `quantum-weird-category`가 그 결과 형태) → 카테고리 페이지 미노출 |
| summaryKo | `translator.ts:118` 한글 검사 없음, `backfill.ts:84` 기존 요약 있으면 영어 요약도 유지 | 계약 A "한국어만" |
| language | `normalizer.ts:459` `source.language` 그대로 | 계약 A "소문자 BCP-47"(`'EN'`, `'en-US'`, `'english'` 가능) |
| 수집 견고성 | `collector.ts:134-324` `collectSource`에 최상위 try/catch 없음 + `:59-67` `Promise.all` → 소스 하나의 예외(예: `rss-parser.ts:281` 비문자열 title `.trim()`)가 **전체 실행을 reject**(백필·캐시 무효화 생략, 나머지 워커는 떠돌며 계속). `:138-161,173-183` 조기 실패는 CollectionLog 미기록 | |
| 캐시 무효화 | `collector.ts:85-86` `home:${country}`·`home:all` vs 실제 키 `home:${country}:${take}`(`queries.ts:24`), `:94` `breaking:*` vs 키 `breaking`(`queries.ts:41`) | 홈·속보 티커 캐시가 패턴에 안 걸림(TTL로만 만료) |
| 수동 수집 | `api/collect/route.ts:259` fire-and-forget, 진행 중 가드 없음 | 버튼 연타 시 웹 프로세스에서 수집 N개 동시 실행(번역 비용 N배) |
| fix-translations | `:164-165` `parseInt` 직접 사용 | 계약 C(`parseIntParam`) |
| PM2 | `ecosystem.config.js:29` `cron_restart: '0 */12 * * *'` vs `scheduler.ts:84` `'0 */4 * * *'`(UTC) | 00:00·12:00 수집 시작 순간 PM2가 워커를 재시작 → 그 회차 수집·번역이 중간에 죽음 |
| 스크레이퍼 입력 | `scraper.ts:26-27` `&#x27;`만 16진 디코드, `String.fromCharCode`(BMP 밖 오류) | `&#x2019;` 등 엔티티가 원문에 남아 번역 입력 오염(낮음) |

---

## 디자인 방향 (백엔드 원칙)

- **정직한 데이터**: S4 화면은 "값이 있으면 완성 번역"으로 믿는다. 따라서 S5는 **불완전한 번역을 절대 저장하지 않는다**(잘림·echo·영어 요약 → NULL 유지). 저장되는 한국어는 전부 완성본이어야 한다.
- **한 번에 하나씩, 끝까지**: 긴 본문은 문단 단위로 쪼개 전부 번역하고, 하나라도 실패하면 그 기사는 저장하지 않는다(부분 번역 금지).
- **모델 출력 문제 ≠ API 장애**: echo·JSON 깨짐·잘림은 데이터 문제로 다루고(쪼개서 재요청 또는 포기), 네트워크·5xx·429만 재시도·서킷 대상. 둘을 섞지 않는다.
- **한 경로**: 미번역 판정은 SQL 한 곳(`translation-coverage`)과 그 순수 미러(`translation-text`)에서만 정의하고 백필·CLI·fix-translations·health가 공유한다(숫자 불일치 금지).
- 화면 변경 없음(UI 파일 수정 금지). AI slop 해당 없음.

---

## 대상 파일 목록

수정:
- `src/workers/translator.ts`, `content-translator.ts`, `image-generator.ts`, `backfill.ts`, `backfill-cli.ts`, `collector.ts`, `normalizer.ts`, `scheduler.ts`(주석만), `scraper.ts`(엔티티 디코드만)
- `src/lib/retry.ts`, `src/lib/circuit-breaker.ts`
- `src/app/api/admin/health/route.ts`, `src/app/api/admin/fix-translations/route.ts`, `src/app/api/img/route.ts`, `src/app/api/collect/route.ts`
- `ecosystem.config.js`, `.env.example`, `redeploy.sh`(도움말·백필 안내만), `scripts/qa/README.md`(E2E 명령 갱신, 선택)

신규(이름은 권장, 역할은 필수):
- `src/lib/xai-client.ts` — 공통 클라이언트 생성(항목 1)
- `src/workers/translation-text.ts` — 순수 함수(항목 3; openai·prisma import 금지)
- `src/lib/translation-coverage.ts` — 미번역 판정 SQL·집계(항목 6; `@prisma/client`만 import, `@/` 별칭 금지 — 워커가 상대경로로 씀)
- `src/lib/safe-image-fetch.ts` — SSRF 방어 페처(항목 10; Node 내장만)
- `tests/translation-text.test.ts`, `tests/translator.test.ts`, `tests/content-translator.test.ts`, `tests/retry.test.ts`, `tests/xai-client.test.ts`, `tests/safe-image-fetch.test.ts`, (선택) `tests/backfill-criteria.test.ts`

수정 금지: `prisma/schema.prisma`, 모든 `page.tsx`/컴포넌트/`middleware.ts`/`lib/queries.ts`/`lib/utils.ts`/`lib/constants.ts`(S1~S4 소유), `package.json`의 의존성(스크립트 줄 추가는 불필요).

---

## 개선 항목

### 항목 1: 공통 xAI 클라이언트 — base URL·타임아웃·SDK 재시도 (D22, D20)
- 대상 파일: 신규 `src/lib/xai-client.ts`; `translator.ts:28-34`, `content-translator.ts:255-261`, `image-generator.ts:115-121`의 `buildClient` 삭제 후 사용
- 현재 문제: base URL 하드코딩 → 모의 서버 E2E 불가(실측 요청 0건). SDK 기본 `timeout` 600초·`maxRetries` 2가 `retryWithBackoff`와 중첩.
- 개선 방법:
  - `getXaiConfig(env = process.env, kind: 'text' | 'image')` 순수 함수 → `{ apiKey, baseURL, timeoutMs, maxRetries: 0 }`. `baseURL = env.XAI_BASE_URL?.trim().replace(/\/+$/, '') || 'https://api.x.ai/v1'`(http/https가 아니면 기본값). `timeoutMs = parse(env.XAI_TIMEOUT_MS)`(정수 1000~600000, 아니면 기본 text 60000 / image 120000). apiKey 없으면 null.
  - `createXaiClient(kind)` → `new OpenAI({ apiKey, baseURL, timeout, maxRetries: 0 })` 또는 null. 재시도는 오직 `retryWithBackoff`가 담당.
  - 로그·CLI 메시지에 표시할 `describeXaiEndpoint()` → base URL의 origin만(키 절대 출력 금지).
- 기대 효과: `XAI_BASE_URL=http://127.0.0.1:4010/v1`로 전 파이프라인 E2E. 응답 없는 호출 최악 시간 = `timeoutMs × 3 + 백오프` (60초 기준 약 3분 → 기존 90분).
- 검증: `tests/xai-client.test.ts`(기본값, 끝 슬래시 제거, 잘못된 URL/타임아웃 → 기본값, maxRetries 0). E2E-4(행 테스트) 요청 수 정확히 3.

### 항목 2: 재시도·서킷 정책 — 장애만 재시도, 모델 출력 문제는 서킷 밖 (D20 연관, 실측)
- 대상 파일: `src/lib/retry.ts`, `src/lib/circuit-breaker.ts`, `translator.ts:157-164`, `content-translator.ts:309-334`
- 현재 문제: CircuitOpenError·401까지 백오프 재시도(실측 49회). 파싱/echo 실패가 브레이커 안에서 throw → ECHO 기사 1건으로 서킷 OPEN → 이후 5분간 모든 번역 실패. HALF_OPEN 동시 프로브.
- 개선 방법:
  - `RetryOptions.shouldRetry?: (err) => boolean`. 기본 `isRetryableError`: `CircuitOpenError` → false; HTTP status 있는 오류는 408/409/429/5xx만 true(400/401/403/404/422 false); 상태 없는 네트워크/타임아웃 오류(`APIConnectionError`, `APIConnectionTimeoutError`, `ECONNRESET`, `fetch failed`, AbortError) → true. 재시도 로그는 `Attempt n/max` 정확히(현재 `1/2`가 3회 시도 의미와 불일치 — 표기만 정리).
  - 브레이커는 **HTTP 호출(`client.chat.completions.create`)만** 감싼다. JSON 파싱·echo 판정·finish_reason 처리는 브레이커·retry 밖(항목 4·5에서 분할 재요청으로 처리).
  - HALF_OPEN 중 프로브가 진행 중이면 다른 호출은 즉시 `CircuitOpenError`(프로브 1개만).
  - 실패한 청크에 "Translated chunk" 로그 금지(`translator.ts:172` 성공 시에만).
- 기대 효과: 키 오류·서킷 OPEN 시 즉시 포기(수 초), ECHO가 섞여도 서킷이 열리지 않음.
- 검증: `tests/retry.test.ts` — CircuitOpenError·401 1회만 호출, 503·429·네트워크 오류는 maxRetries+1회, shouldRetry 주입 동작, HALF_OPEN 동시 2호출 중 1개만 fn 실행. E2E-1 로그에 `circuit OPEN` 0회.

### 항목 3: 번역 텍스트 순수 유틸 (D17·D18·D19 공용, D25)
- 대상 파일: 신규 `src/workers/translation-text.ts` (순수; `../lib/constants`만 import 허용)
- 현재 문제: 판정 로직이 파일마다 흩어져 있고(`translator.ts:38-51`, `content-translator.ts:282-285,338`) 테스트 불가.
- 개선 방법(시그니처 권장):
  - `hasHangul(s)`; `isKoreanLanguage(lang)` = `normalizeLanguageTag(lang) === 'ko'`.
  - `isUntranslatedTitle(titleKo, titleOriginal, language)`: 비-ko에서 NULL/공백/한글 없음/원문과 trim 동일 → true. ko는 NULL/공백만 true. **항목 6 SQL과 같은 의미**(테스트로 고정).
  - `isUntranslatedContent(contentKo, contentOriginal, language)`: 원문 30자 이하 → false(대상 아님); 비-ko에서 NULL/공백/한글 없음 → true.
  - `countParagraphs(s)` = `s.split('\n')`→trim→비어있지 않은 개수(S4 `splitParagraphs`와 동일 규칙).
  - `isTruncatedTranslation(contentKo, contentOriginal)`: 원문 > 6000자 && `countParagraphs(contentKo) < countParagraphs(contentOriginal)` (D21 대상 판정; 이미 복구된 행은 false → 재실행해도 재번역 안 함).
  - `splitForTranslation(text, maxChars = 3000)`: 반환 `Array<{ text: string; joinWith: '\n' | ' ' }>` 또는 동등 구조. 규칙: (a) 문단(`\n+`) 단위로 ≤ maxChars가 되도록 묶는다(청크 내부 문단은 `\n`). (b) 한 문단이 maxChars 초과면 그 문단만 따로 문장 경계(`. ! ? 。 ！ ？` 뒤)로 쪼개 ≤ maxChars로 묶고, 문장 하나도 넘으면 maxChars 이전 마지막 공백, 없으면 강제 절단. 이 조각들은 번역 후 **공백으로 다시 이어 한 문단 유지**. (c) 모든 청크 길이 ≤ maxChars, 빈 청크 없음, 공백 제외 문자 순서 보존.
  - `salvageTitleItems(raw)`: 코드펜스 제거 → 완전 JSON 배열 파싱 시도 → 실패 시 **객체별 구제**: 각 `{"idx":N, "titleKo":"…"` 에서 문자열이 닫힌 필드만 채택(JSON 문자열 이스케이프 존중), 잘린 마지막 객체도 `idx`와 닫힌 `titleKo`가 있으면 채택, 닫히지 않은 `summaryKo`는 버림. 반환 `Array<{idx?, titleKo?, summaryKo?, primary?, secondary?}>`. 예외를 던지지 않는다.
  - `normalizeCategorySlug(raw)`: trim·소문자·공백/`_`→`-` 후 `CATEGORIES` slug 16개(`general` 포함) 중 하나면 그 값, 아니면 `'general'`. secondary는 알 수 없으면 `''`.
  - `normalizeLanguageTag(raw)`: trim·소문자, `_`→`-`, 첫 서브태그(`en-US`→`en`), 이름 매핑(`english`→`en`, `japanese`→`ja`, `chinese`→`zh`, `korean`→`ko`), 빈 값→`'en'`.
- 기대 효과: 모든 판정이 한 곳, 단위 테스트로 고정.
- 검증: `tests/translation-text.test.ts`(아래 "단위 테스트 필수 케이스").

### 항목 4: 제목 번역 — JSON 복구·누락 분할 재요청·카테고리/요약 검증 (D17, 계약 A)
- 대상 파일: `src/workers/translator.ts`
- 현재 문제: 닫히지 않은 마지막 객체 버림(`:84-95`), 누락·echo 항목은 그 실행에서 다시 요청 안 함, `finish_reason` 무시, `primary` 무검증(`:119`), `summaryKo` 한글 검사 없음(`:118`), 파싱 실패가 브레이커 안(`:160`).
- 개선 방법:
  - `translateChunk`는 HTTP 호출만 retry+breaker로 감싸고, 응답 해석은 `salvageTitleItems`로. `finish_reason === 'length'`면 응답을 잘린 것으로 간주하되 구제 가능한 항목은 채택.
  - 채택 조건: `idx` 범위 내 + `looksTranslated(titleKo, 원제목)`(한글 있음·원문과 다름). `summaryKo`는 `hasHangul`일 때만, 아니면 `''`. `primary = normalizeCategorySlug`, `secondary`도 검증.
  - **누락 항목 분할 재요청**: 청크 결과에서 채택되지 못한 항목이 있고 청크 크기 > 1이면, 누락 항목만 모아 반으로 나눠 재요청(재귀 깊이 ≤ 3 → 최종 단건). 단건 실패(echo·파싱 불가)는 포기하고 빈 결과. HTTP 오류(재시도 소진)로 실패한 청크는 분할하지 않는다(장애 시 호출 폭증 방지).
  - **제목 프롬프트의 idx 계약 유지**: system 메시지에 `"idx"` 문자열 유지, user는 `N. 제목` 줄 형식 유지(가짜 서버 판별 기준). 원문 언어가 섞여 있어도(영·일·중) "각 제목을 한국어로 번역"하도록 문구에서 언어 가정 제거 금지(현행 유지 가능).
  - `translateTitleBatch(titles, opts?: { client?, model?, stats? })` — 테스트용 가짜 클라이언트 주입, `stats`에 `{ apiCalls, apiFailures }` 누적(항목 8 진단용). 반환 형태(`TranslationResult[]`, 실패는 빈 값)는 유지 → `translateArticles` 호출부 호환.
- 기대 효과: TRUNCJSON 기사(409)도 제목이 복구되고, 같은 청크의 나머지도 이번 실행에서 번역된다. ECHO(408)만 정직하게 미번역으로 남는다.
- 검증: `tests/translator.test.ts`(가짜 클라이언트): ① 10건 중 1건 echo → 9건 채택 + echo 단건 재요청 1회 후 빈 값 ② 60% 지점 잘린 JSON → 누락분 재요청으로 전부 채택 ③ 단건 잘림(`…"titleKo":"한국어 제목: X","summaryKo":"요약`) → titleKo 채택·summaryKo `''` ④ `primary: 'Technology'` → `'general'`, `'AI_Tech'`→`'ai-tech'` ⑤ 영어 summaryKo → `''` ⑥ HTTP 503 연속 → 분할 재요청 없음(호출 수 = 3). E2E-1 SQL T1~T4.

### 항목 5: 본문 청크 번역 + finish_reason 처리 (D18, D19)
- 대상 파일: `src/workers/content-translator.ts`
- 현재 문제: `:307` 6000자 절단, `:331` finish_reason 무시, 부분 번역 저장.
- 개선 방법:
  - `translateLongText(text, { client, model, language, maxChars = 3000 }) → { ok: true, text } | { ok: false, reason }` 내보내기(테스트 주입용). `splitForTranslation`으로 나눈 청크를 순서대로 번역.
  - 청크 응답 처리: `finish_reason === 'length'` → 그 청크를 `maxChars = floor(len/2)`(하한 200자)로 다시 쪼개 각각 번역(재귀 깊이 ≤ 4). 더 못 쪼개는데 또 `length` → **기사 전체 실패**(ok:false). 빈 응답·한글 없는 응답 → 실패. HTTP 오류(재시도 소진) → 실패.
  - 결과 조립: 청크 출력의 문단을 `\n`으로 정규화(연속 빈 줄 제거), 긴 문단 조각 출력은 내부 줄바꿈을 공백으로 바꿔 `' '`로 이어 한 문단. 청크 사이는 `\n`.
  - `translateContent(articles)`는 `ok`일 때만 `contentKo` 설정, 실패 시 `''`(→ 저장 시 NULL). 6000자 상한 삭제(원문 전체 커버, 원문은 이미 8000자 상한).
  - 프롬프트: 원문 언어를 `article.language`로 명시(`en`→영어, `ja`→일본어, `zh`→중국어, 그 외 "외국어"). "문단 구분은 줄바꿈 하나로 유지, 문단 수를 바꾸지 말 것, 번역문만" 지시. **본문 system 프롬프트에 `idx`·`제목` 단어 금지**(가짜 서버가 제목 요청으로 오판). `max_tokens`는 4000 유지(청크 3000자 기준 충분).
  - 청크 사이 300ms, 기사 사이 500ms 유지 정도.
- 기대 효과: 8000자 기사도 끝까지 번역, 잘린 번역은 저장되지 않음 → S4가 "요약 + 원문"으로 정직하게 표시.
- 검증: `tests/content-translator.test.ts`(가짜 클라이언트): ① 8000자/60문단 → 청크 ≥3, 모든 요청 ≤3000자, 결과 60문단 ② 1200자 초과 요청에 `length`를 주는 가짜 → 분할 후 성공, 결과 문단 수 = 원문 ③ 항상 `length` → ok:false ④ 한글 없는 응답 → ok:false ⑤ 4000자 단일 문단(줄바꿈 없음) → 요청 각각 ≤3000자, 결과 1문단. E2E-1 T6~T8.

### 항목 6: 미번역 판정 단일화 + 백필 대상 확장 + id 커서 (D17, summaryKo, 백필)
- 대상 파일: 신규 `src/lib/translation-coverage.ts`, `src/workers/backfill.ts`
- 현재 문제: NULL/'' 만 대상(D17), 요약 결손 미복구, 매 라운드 같은 상위 N건 재선택(실패 행 무한 반복).
- 개선 방법:
  - `translation-coverage.ts`에 Prisma `$queryRaw`(Prisma.sql, 파라미터 바인딩) 술어를 한 번만 정의:
    - 비-ko 판정: `lower(coalesce(language,'')) NOT IN ('ko')` — (정규화 전 데이터 호환을 위해 `split_part(lower(language),'-',1)` 사용 권장)
    - **미번역 제목**: `"isActive" AND ( "titleKo" IS NULL OR btrim("titleKo")='' OR (비-ko AND ("titleKo" !~ '[가-힣]' OR btrim("titleKo")=btrim("titleOriginal"))) )`
    - **미번역 본문**: `"isActive" AND char_length(coalesce("contentOriginal",''))>30 AND ( "contentKo" IS NULL OR btrim("contentKo")='' OR (비-ko AND "contentKo" !~ '[가-힣]') )`
    - **요약 결손**: `"isActive" AND 비-ko AND ("summaryKo" IS NULL OR btrim("summaryKo")='' OR "summaryKo" !~ '[가-힣]')`
    - **잘린 본문(D21)**: `"isActive" AND 비-ko AND char_length("contentOriginal")>6000 AND "contentKo" ~ '[가-힣]'` + JS에서 `isTruncatedTranslation` 재확인(또는 SQL에서 문단 수 비교 `array_length(array_remove(regexp_split_to_array(btrim(x), E'\\s*\\n\\s*'), ''),1)`).
    - `selectIds(kind, { beforeId?, take })` → `id DESC`(최신 우선) + `id < beforeId` 커서. `countTranslationBacklog(prisma)` → `{ untranslatedTitles, untranslatedBodies, missingSummaries, truncatedBodies }`.
  - `backfill.ts`:
    - 제목 단계 대상 = 미번역 제목 ∪ 요약 결손(중복 제거). ko 행은 API 없이 pass-through(현행). 비-ko는 `translateTitleBatch`. 갱신 규칙: titleKo가 미번역이었으면 결과로 교체; **이미 번역된 titleKo는 덮어쓰지 않음**(요약만 채움). summaryKo는 결과가 한국어이고 기존이 결손일 때만. 카테고리는 기존이 NULL/`general`/알 수 없는 slug일 때만 `normalizeCategorySlug` 결과로(현행 `:85-90` 규칙 + 알 수 없는 slug).
    - **echo 정리**: 기존 titleKo가 echo였고(비어있지 않음) 재번역에 실패하면 `titleKo = NULL`로 정리(S4 계약 A "재번역 또는 NULL로 정리").
    - 본문 단계 대상 = 미번역 본문. `translateContent`(청크) 결과 `ok`만 저장. 한글 없는 기존 contentKo(echo)는 실패 시 NULL로 정리.
    - 시그니처: `backfillTranslations(prisma, { titleLimit, contentLimit, repairLimit?, cursor? })` → 기존 `BackfillStats` 필드 유지 + `titlesFailed`, `contentFailed`, `repaired`, `repairReset`, `apiCalls`, `apiFailures`, `nextCursor: { titleBeforeId, contentBeforeId, repairBeforeId } | null(소진)`. `remainingTitles/remainingContent`는 `countTranslationBacklog` 값(echo 포함).
    - 커서 미지정(수집기·fix-translations)은 최신 우선 1배치(현행 의미 유지).
- 기대 효과: echo·요약 결손이 처음으로 복구 대상이 되고, 한 실행에서 같은 행을 두 번 시도하지 않는다. 숫자가 health·CLI·fix-translations에서 일치.
- 검증: (선택) `tests/backfill-criteria.test.ts`로 `isUntranslatedTitle`/`isUntranslatedContent` 진리표가 SQL과 같은 케이스(NULL, '', '  ', 영어, 원문 동일, 한글, ko+영어 제목 → false). E2E-1 T1~T9, E2E-2(재실행).

### 항목 7: 잘린 본문 1회 복구 모드 `--repair-truncated` (D21)
- 대상 파일: `src/workers/backfill.ts`, `src/workers/backfill-cli.ts`
- 현재 문제: 6000자에서 잘려 저장된 contentKo는 "값 있음"이라 어떤 경로로도 재번역되지 않음.
- 개선 방법:
  - 운영자가 한 번 실행하는 CLI 옵션 `--repair-truncated`(수집기·fix-translations 자동 경로에는 넣지 않음 — 비용 통제). 대상 = 항목 6 "잘린 본문". id 커서로 **한 번 순회**.
  - 행마다 원문 전체를 항목 5로 재번역 → 성공 시 contentKo 교체(`repaired`), 실패 시 **contentKo = NULL**(`repairReset`; S4가 "요약 + 원문"으로 정직 표시, 이후 일반 본문 백필 대상이 됨). 한 실행에서 같은 행 재시도 없음.
  - 재실행 안전: 복구된 행은 문단 수가 원문과 같아 `isTruncatedTranslation=false` → 다시 선택되지 않음(무한 재번역 없음).
  - 시작 시 대상 건수를 출력(`Truncated bodies to repair: N`)해 운영자가 비용을 가늠.
- 기대 효과: 381~390 같은 기존 결손 데이터 복구.
- 검증: E2E-1 T6, E2E-2(재실행 시 repair 대상 0, 요청 0).

### 항목 8: 백필 CLI — 커서 순회·정확한 장애 진단·종료 코드 (백필 CLI 결함)
- 대상 파일: `src/workers/backfill-cli.ts`
- 현재 문제: `:225-227` NULL만 집계(45 vs 실제 60), `:257-267` "0건 2라운드 = API 장애" 오진, `:264` 고정 호스트, `parseInt` 인자 파싱.
- 개선 방법:
  - 시작 시 `countTranslationBacklog` 4개 숫자 출력. 라운드마다 `nextCursor`를 다음 라운드에 전달, 해당 단계 커서가 소진되면 그 단계 종료. 모든 단계 소진 → 종료(같은 실행에서 실패 행 재시도 없음).
  - 장애 진단: **라운드의 `apiCalls > 0 && apiFailures === apiCalls`(배치 전체 HTTP 실패)** 일 때만 즉시 중단 + 진단 메시지(키/모델/`describeXaiEndpoint()` 도달성) + exit 2. 모델 출력 거부(echo 등)로 0건인 라운드는 정상 진행.
  - 종료 요약 한 줄(파싱 가능): `[backfill-cli] Done: titles healed=X failed=Y; bodies healed=X failed=Y; repaired=X reset=Y; remaining titles=A bodies=B summaries=C truncated=D` + exit 0.
  - 인자: `--content`, `--repair-truncated`, `--round-size=`, `--content-per-round=`, `--max-rounds=` — `parseIntParam`과 같은 엄격 파싱(잘못된 값은 기본값). 알 수 없는 인자는 경고.
  - 캐시 비우기(`:281-291`)는 현행 유지(S4 계약 A: 백필 후 전체 무효화).
- 기대 효과: 픽스처에서 1회 실행으로 끝까지 처리하고 exit 0, 진짜 장애에서만 exit 2.
- 검증: E2E-1(exit 0, 진단 문구 없음), E2E-3(가짜 서버 정지 상태 → 첫 라운드 후 exit 2, 30초 이내).

### 항목 9: health 번역 커버리지 + 공개 응답 정리 (D23, 계약 B)
- 대상 파일: `src/app/api/admin/health/route.ts`
- 현재 문제: 번역 지표 없음, `lastError` 원시 문자열(피드 URL) 공개, 503 본문 원시 메시지.
- 개선 방법:
  - 응답에 `translation: { untranslatedTitles, untranslatedBodies, missingSummaries, truncatedBodies, activeForeign }`(정수만, `countTranslationBacklog` 재사용). 계산 실패 시 `translation: null`이고 **전체 status는 DB 연결 기준 유지**(커버리지 쿼리 실패로 503 금지). 공개·무인증이므로 60초 메모리 캐시(모듈 변수)로 부하 제한.
  - `pipeline.lastError`(문자열) 제거 → `pipeline.lastErrorPresent: boolean`. 503 본문은 `{ status:'error', error:'database_unavailable', … }`(원시 메시지 금지, 서버 로그에는 기록).
  - 기존 키(`status`, `database`, `pipeline.*`(lastError 제외), `circuitBreakers`)는 유지. GET/HEAD 공개(미들웨어 정책 불변).
- 기대 효과: 번역 장애가 `curl …/api/admin/health` 한 번에 숫자로 보임, 정보 노출 제거. `redeploy.sh` 헬스체크(200) 호환.
- 검증: E2E-5.

### 항목 10: `/api/img` SSRF 방어 (D24)
- 대상 파일: 신규 `src/lib/safe-image-fetch.ts`, `src/app/api/img/route.ts`
- 현재 문제: 임의 URL(루프백·사설·메타데이터)을 서버가 가져와 Content-Type 그대로 중계, 리다이렉트 자동 추종, 크기 무제한, 이중 디코드 500, 원시 에러 메시지 반환.
- 개선 방법:
  - URL은 `searchParams.get('url')` 값 그대로 사용(**추가 `decodeURIComponent` 금지** — `proxyImageUrl`은 1회 인코딩). `new URL` 실패/빈 값 → 400.
  - 허용: `http:`/`https:`만, 포트는 기본(빈 값)·80·443만, URL 내 자격증명(`user:pass@`) 금지 → 400.
  - 호스트 검사: `localhost`·`*.localhost`·IP 리터럴 포함 모든 호스트를 `dns.promises.lookup(host, { all: true })`로 해석, **하나라도** 차단 대역이면 403: IPv4 `0.0.0.0/8, 10/8, 100.64/10, 127/8, 169.254/16, 172.16/12, 192.0.0/24, 192.168/16, 198.18/15, 224/4, 240/4, 255.255.255.255`; IPv6 `::, ::1, fc00::/7, fe80::/10, ff00::/8`, IPv4-mapped/compat(`::ffff:a.b.c.d`)은 내부 IPv4로 재판정. `isBlockedAddress(ip)` 순수 함수로 분리.
  - **연결 고정(DNS rebinding 방지)**: 검증한 주소로만 연결 — `node:http`/`node:https`의 `request({ lookup })`에 검증된 주소를 돌려주는 lookup을 넘기는 방식 권장(`servername`/Host 헤더는 원래 호스트). (불가 시 최소한 해석-검증 후 fetch, 잔여 위험을 주석으로 명시.)
  - 리다이렉트: 수동 처리, 최대 3회, `Location`을 기준 URL로 해석해 위 검사를 **매 홉 재실행**.
  - 응답: 2xx만, `Content-Type`이 `image/*`인 경우만(아니면 415로 거부 — 원본을 중계하지 않음). `Content-Length` > 10MB → 413, 스트리밍 누적 10MB 초과 시 중단 413. 전체 타임아웃 10초 → 504. 업스트림 오류 → 502.
  - 응답 헤더: 기존 `Cache-Control`·`Access-Control-Allow-Origin` 유지 + `X-Content-Type-Options: nosniff` + `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`(SVG 직접 열람 시 스크립트 차단).
  - 오류 본문은 `{ error: '<짧은 코드>' }`만(원시 메시지·스택 금지). **어떤 입력도 500 금지**(최종 catch도 502).
  - 테스트 주입: `fetchImageSafely(url, { lookup?, request?, maxBytes?, timeoutMs? })`.
- 기대 효과: 내부 서비스 접근 차단, 정상 외부 이미지(https, 80/443, image/*)는 동일 동작.
- 검증: `tests/safe-image-fetch.test.ts` + E2E-6.

### 항목 11: 수집기 견고성·데이터 정규화 (수집 결함, 계약 A·C)
- 대상 파일: `collector.ts`, `normalizer.ts`, `api/collect/route.ts`, `api/admin/fix-translations/route.ts`, `image-generator.ts`, `scraper.ts`(엔티티만)
- 개선 방법:
  - `collector.ts`: `collectSource` 본문 전체를 try/catch → 예외 시 `{status:'failed', errorMessage}` 반환 + CollectionLog 기록(조기 실패 `:138-161,173-183`도 기록). `runWithConcurrency`가 한 소스 예외로 reject되지 않게.
  - `collector.ts:280` `categoryPrimary: normalizeCategorySlug(a.categoryPrimary)`, `categorySecondary`도 검증. `titleKo`/`summaryKo`/`contentKo`는 계약 A대로 미번역·비한국어면 NULL(이미 `|| null`이지만 summaryKo 한글 검사 추가).
  - 캐시 패턴 수정: `home:${country}` → `home:${country}:*`, `home:all` → `home:all:*`, `breaking` 키 추가(`breaking:*`와 함께). 나머지 패턴 유지.
  - `normalizer.ts:459` `language: normalizeLanguageTag(source.language)`.
  - `api/collect/route.ts`: 모듈 수준 in-flight 플래그 — 진행 중이면 `409 {status:'already_running'}`, 끝나면(성공/실패) 해제. 응답 형식 `202 {status:'started'}` 유지.
  - `fix-translations/route.ts`: `titles = parseIntParam(raw, {min:0,max:1000,fallback:300})`, `content = parseIntParam(raw,{min:0,max:200,fallback:30})`. GET의 `missingTitles/missingSummaries/missingContent`는 `countTranslationBacklog` 값으로(echo 포함), 기존 키·`samples`·`message` 유지(관리자 대시보드 `admin/page.tsx:80-86` 호환), `truncatedBodies` 추가. POST 응답은 `BackfillStats` 기존 키 + 신규 키(추가만).
  - `image-generator.ts`: `createXaiClient('image')` 사용, 생성 실패 판정 `msg.includes('model')` 같은 광범위 문자열 매칭 대신 HTTP status 404/400·`CircuitOpenError`로 중단 판정.
  - `scraper.ts:26-27`: `&#(\d+);`·`&#x([0-9a-f]+);`를 `String.fromCodePoint`로(범위 밖 값은 그대로) — 번역 입력 정리(낮음).
- 기대 효과: 소스 하나가 전체 수집을 죽이지 않음, 알 수 없는 카테고리·대문자 language 저장 차단, 홈·속보 캐시 즉시 갱신.
- 검증: 코드 리뷰 + `tests/translation-text.test.ts`(normalizeCategorySlug/normalizeLanguageTag) + E2E-7(tsx 스니펫).

### 항목 12: 운영 설정 — PM2 재시작 충돌·환경변수 문서 (운영 결함, D22)
- 대상 파일: `ecosystem.config.js`, `.env.example`, `redeploy.sh`, `scheduler.ts`
- 개선 방법:
  - `ecosystem.config.js` 수집기 `cron_restart`를 수집 정각과 겹치지 않게(`'30 2,14 * * *'` 등) 바꾸거나 제거(메모리 상한 `max_memory_restart` 유지). 앱 이름·cwd·args 불변(`redeploy.sh` 안전장치 `grep "livenews"` 통과 유지).
  - `.env.example`: `# XAI_BASE_URL="https://api.x.ai/v1"`, `# XAI_TIMEOUT_MS=60000`, `# XAI_IMAGE_MODEL="grok-2-image"` 주석 예시 추가(값 비우면 기본).
  - `redeploy.sh`: 도움말에 `--backfill`이 이제 echo 제목·요약 결손도 처리함을 반영, 본문/잘림 복구 수동 명령(`npm run backfill:translations -- --content --repair-truncated`) 안내 문구 추가. 배포 로직(`--only`, 롤백, 헬스체크) 불변. `bash -n redeploy.sh` 통과.
  - `scheduler.ts:7` 주석 "every 3 hours" → 4시간(코드와 일치).
- 검증: `node -e "require('./ecosystem.config.js')"`, `bash -n redeploy.sh`, diff 리뷰.

### 항목 13: 단위 테스트 (D25)
- 대상 파일: `tests/*.test.ts` 신규 6~7개(node:test + `node:assert/strict`, tsx 러너, **네트워크·DB 없이**, 의존성 추가 금지)
- 필수 케이스:
  - **청크 분할**: 8000자/60문단 → 모든 청크 ≤ 3000, 문단 수 보존, 공백 제외 문자열 동일; 단일 긴 문단(줄바꿈 없음 4000자) → 문장 경계 분할; 문장 하나 3500자 → 강제 절단 ≤ maxChars; 빈 문자열 → [].
  - **finish_reason**(가짜 클라이언트 `{ chat: { completions: { create } } }`): length → 분할 재요청 성공 / 끝까지 length → ok:false / stop+한글 → ok / 한글 없음 → ok:false; 호출된 요청 길이 기록 검증.
  - **echo 판정**: `isUntranslatedTitle` 진리표(NULL, '', '  ', 영어, 원문과 동일, 한글, 일본어(한글 없음) → 미번역, ko+영어 제목 → 번역됨), `isUntranslatedContent`, `isTruncatedTranslation`.
  - **JSON 복구**: 완전 배열, 코드펜스, 60% 절단 배열, 단건 객체 내 절단(titleKo 닫힘/안 닫힘), 이스케이프된 따옴표 `\"`, 쓰레기 문자열 → [] (throw 없음).
  - **사설 IP 판정**: 127.0.0.1, 127.1(URL 정규화 후), 10.x, 172.16.0.1/172.31.255.255(차단)·172.32.0.1(허용), 192.168.x, 169.254.169.254, 100.64.0.1, 0.0.0.0, ::1, fd00::1, fe80::1, ::ffff:127.0.0.1, ::ffff:7f00:1(차단), 8.8.8.8·2606:4700::1111(허용).
  - **safe fetch**(lookup·request 주입): 공개 IP+image/jpeg → ok; text/html → 415; 302 → `http://127.0.0.1/` → 403; 302 → 공개 → 따라감, 4회째 → 거부; Content-Length 20MB → 413; 스트림 초과 → 413; 포트 6379 → 400.
  - **재시도**: 항목 2 케이스. **xai-client**: 항목 1 케이스. **카테고리/언어 정규화**.
- 검증: `npm test` 전부 통과(기존 106 + 신규), `npx tsc --noEmit` 0 에러.

---

## 검증 절차 (Evaluator가 그대로 실행)

### 0. 정적·빌드
```bash
cd /home/user/hydro
npx tsc --noEmit                         # 0 errors
npm test                                 # all pass (기존 106 + 신규), fail 0
bash -n redeploy.sh && node -e "require('./ecosystem.config.js')"
git diff --stat HEAD -- prisma package.json src/components src/app/**/page.tsx src/middleware.ts src/lib/queries.ts src/lib/utils.ts src/lib/constants.ts   # 빈 출력(스키마·의존성·UI 불변)
grep -rn "api.x.ai" src | grep -v xai-client   # 하드코딩 0 (xai-client 기본값만)
grep -n "slice(0, 6000)" src/workers/content-translator.ts   # 0
```

### E2E-1. 백필 전체 경로 (가짜 LLM)
```bash
bash $SP/qa-env.sh reseed && bash $SP/qa-env.sh mock
time XAI_API_KEY=test XAI_BASE_URL=http://127.0.0.1:4010/v1 \
  npm run backfill:translations -- --content --repair-truncated > $SP/eval-s5-e2e1.log 2>&1; echo exit=$?
```
합격 기준:
- exit=0, 실행 시간 < 180초, 로그에 `circuit OPEN` 0회·"translation API is likely failing" 류 진단 0회, 종료 요약 한 줄 존재.
- **T1** 미번역 제목은 정확히 `408`만:
  `$PSQL -c "select string_agg(id::text,',') from \"Article\" where \"isActive\" and lower(coalesce(language,''))<>'ko' and (\"titleKo\" is null or btrim(\"titleKo\")='' or \"titleKo\" !~ '[가-힣]' or btrim(\"titleKo\")=btrim(\"titleOriginal\"))"` → `408`
- **T2** `408`의 `titleKo IS NULL`(echo를 저장하지 않음).
- **T3** 341~355 15건 모두 `titleKo ~ '^한국어 제목'`; 301~340, 393, 394, 409, 410도 `titleKo ~ '[가-힣]'`(409 = JSON 복구 확인).
- **T4** 요약 결손(비-ko, NULL/공백/한글 없음) 집합 ⊆ `{408, 409}`이고 408은 반드시 포함(409는 분할 순서에 따라 요약이 구제될 수 있음). 405 요약 채워짐, 영어 요약 0.
- **T5** 미번역 본문(비-ko, 원문>30자, contentKo NULL/공백/한글 없음) **0건**.
- **T6** 381~390 각각 contentKo 문단 수 = 원문 문단 수 = **60**:
  `$PSQL -c "select id, array_length(array_remove(regexp_split_to_array(btrim(\"contentKo\"), E'\\\\s*\\\\n\\\\s*'),''),1) from \"Article\" where id between 381 and 390"` → 전부 60
- **T7** 410 contentKo 24문단, 모두 `번역된 문단:`으로 시작(잘린 출력 저장 없음). 요청 로그에 `LENGTHCUT`이 든 content 요청 중 `chars>1200`인 것이 1건 이상 있고(= length 감지·분할이 실제로 일어남), 성공한 저장본은 완전.
- **T8** 요청 크기: `node -e` 로 `$SP/mock-llm-requests.jsonl`의 `kind=content` 최대 `chars` ≤ **3000**(상한 4000 절대 초과 금지), title 요청 user 줄 수 ≤ 10.
- **T9** 같은 실행에서 재시도 제한: `head`가 `1. ECHO`로 시작하는 title 요청 ≤ 3건(분할 재요청 깊이 한도), 전체 title 요청 ≤ 20건(대상 61건 = 7청크 + 분할분), 393/394 본문 요청 각 1회.
- **T10** 카테고리: 갱신된 행의 `categoryPrimary`가 모두 16개 표준 slug 중 하나(399 `quantum-weird-category`는 이번 대상이 아니므로 불변이어도 됨). `language` 값 변화 없음.
- **T11** 비활성 407 불변(`isActive=false`, 값 동일).

### E2E-2. 재실행 멱등성
```bash
: > $SP/mock-llm-requests.jsonl
XAI_API_KEY=test XAI_BASE_URL=http://127.0.0.1:4010/v1 npm run backfill:translations -- --content --repair-truncated > $SP/eval-s5-e2e2.log 2>&1; echo exit=$?
```
- exit=0, 요청 로그 **≤ 3줄**(408/409 요약·제목 재시도뿐, 본문·repair 요청 0), 로그상 `Truncated bodies to repair: 0`.

### E2E-3. API 장애 진단
```bash
bash $SP/qa-env.sh reseed; pkill -f mock-llm.js
time XAI_API_KEY=test XAI_BASE_URL=http://127.0.0.1:4010/v1 timeout 120 npm run backfill:translations > $SP/eval-s5-e2e3.log 2>&1; echo exit=$?
bash $SP/qa-env.sh mock
```
- exit=2, 30초 이내 종료(재시도 백오프 포함), 진단 메시지에 `127.0.0.1:4010` 표시(키 문자열 미노출), DB 변경 0(T1 결과가 reseed 직후와 동일한 60건).

### E2E-4. 타임아웃·SDK 재시도 (D20)
`$SP/eval-s5-hang.ts` 작성 후 `npx tsx $SP/eval-s5-hang.ts`:
```ts
import http from 'node:http';
let hits = 0;
const srv = http.createServer(() => { hits++; /* never respond */ }).listen(4011);
process.env.XAI_API_KEY = 'test';
process.env.XAI_BASE_URL = 'http://127.0.0.1:4011/v1';
process.env.XAI_TIMEOUT_MS = '2000';
(async () => {
  const { translateTitleBatch } = await import('/home/user/hydro/src/workers/translator');
  const t = Date.now();
  const r = await translateTitleBatch(['Hello world']);
  console.log(JSON.stringify({ ms: Date.now() - t, hits, r }));
  srv.close(); process.exit(0);
})();
```
- `hits === 3`(1회 + retryWithBackoff 2회, SDK 내부 재시도 0), `ms < 20000`, `r[0].titleKo === ''`.

### E2E-5. health (D23) — `bash $SP/qa-env.sh restart` 후
- reseed 직후: `curl -s $B/api/admin/health` → 200, `translation = {untranslatedTitles:60, untranslatedBodies:28, missingSummaries:45, truncatedBodies:10, activeForeign:409}`(activeForeign은 비-ko 활성 수, 값만 확인).
- E2E-1 실행 후(캐시 60초 경과 또는 재기동 후): `untranslatedTitles:1, untranslatedBodies:0, missingSummaries:1~2, truncatedBodies:0`.
- 응답 본문에 `feeds.example.com`·`http`로 시작하는 에러 문자열 0, `lastErrorPresent` 불리언 존재, `curl -I` 200, 비인증 GET 200(공개 유지).
- (선택) DB 중단 시 503 본문에 원시 메시지 없음(`error: 'database_unavailable'`).

### E2E-6. `/api/img` (D24) — restart 후
다음 각각 `curl -s -o /dev/null -w '%{http_code}' -G --data-urlencode "url=<U>" $B/api/img`:
| U | 기대 |
|---|---|
| `http://127.0.0.1:4000/livenews/api/admin/health` | 403 (현재 200) |
| `http://localhost:4010/v1/models` | 403 (현재 502) |
| `http://[::1]/` · `http://[::ffff:127.0.0.1]/` · `http://0.0.0.0/` · `http://2130706433/` · `http://127.1/` | 403 |
| `http://169.254.169.254/latest/meta-data/` · `http://10.0.0.1/` · `http://172.17.0.1/` · `http://192.168.0.1/` · `http://100.64.0.1/` · `http://[fd00::1]/` | 403 |
| `http://example.com:6379/a.jpg` · `http://u:p@example.com/a.jpg` · `ftp://example.com/a.jpg` · `javascript:alert(1)` | 400 |
- 원시 쿼리: `$B/api/img?url=%25E0`, `$B/api/img?url=%`, `$B/api/img?url=`, `$B/api/img` → 400(현재 500).
- 모든 오류 응답 본문에 스택/원시 예외 메시지 없음, **500 0건**. 차단 요청이 내부 포트에 도달하지 않음(가짜 서버 로그 `$SP/mock-llm-requests.jsonl`에 `/v1/models` 접근 흔적 없음 — 404 경로는 로그 안 남으므로 `ss`/서버 로그 대신 403 코드로 판정).
- 정상 이미지 경로는 이 환경에서 외부 egress가 막혀 있으므로 `tests/safe-image-fetch.test.ts`의 공개 IP+image/jpeg 케이스로 확인하고, 운영 배포 후 실제 기사 이미지 1건 `200 image/*` 확인(운영 절차 4).
- 회귀: `node $SP/planner-s4-verify.js` 12/12, `node $SP/planner-s3-verify.js` 8/8 유지(이미지 체인이 `/api/img` 실패를 대체 이미지로 처리).

### E2E-7. 수집 경로 스니펫 (네트워크 없이)
`npx tsx` 스니펫으로(가짜 LLM 켠 상태, `XAI_API_KEY=test XAI_BASE_URL=http://127.0.0.1:4010/v1`):
- `normalizeArticle({title:'T',link:'https://x/1',pubDate:null,content:null,creator:null,enclosure:null},{id:1,language:'EN-us',country:'us'}).language === 'en'`
- `translateArticles([{…, titleOriginal:'ECHO Foo', language:'en'}, {…, titleOriginal:'Fed holds rates', language:'en'}])` → 첫 항목 `titleKo===''`, 둘째 `titleKo` 한글, `categoryPrimary`는 표준 slug.
- `translateContent([{…, language:'en', contentOriginal: <410의 원문>}])` → contentKo 24문단.

### 실험 정리
- Evaluator가 DB를 바꿨다면 마지막에 `bash $SP/qa-env.sh reseed`, 가짜 서버는 `bash $SP/qa-env.sh mock`으로 재기동.

---

## 슬라이스 간 계약

### A. 번역 데이터 계약 (S4 계약 A 이행 상태 — S5 이후 불변식)
| 필드 | S5 보장 |
|---|---|
| `titleKo` | 비-ko: 한글 포함·원문과 다름일 때만 저장, 그 외 NULL. 기존 echo는 재번역 또는 NULL. ko: `titleOriginal` pass-through |
| `contentKo` | 원문 전체(≤8000자)를 청크 번역한 **완성본만**. 잘림(`finish_reason:'length'` 미해결)·echo·부분 실패 → NULL. 문단 구분 `\n` |
| `summaryKo` | 한국어(한글 포함)만. 본문 실패와 독립적으로 제목 단계에서 채움 |
| `categoryPrimary` | 16개 표준 slug 중 하나(신규 저장분). 기존 알 수 없는 값은 백필 시 교체 가능 |
| `language` | 신규 저장분은 소문자 기본 태그(`en`,`ja`,`zh`,`ko`) |
| `isActive` | 수집기·백필이 변경하지 않음(백필은 `isActive=true`만 대상) |

### B. 미번역 판정 단일 소스
- SQL: `src/lib/translation-coverage.ts`(`countTranslationBacklog`, `select…Ids`), 순수 미러: `src/workers/translation-text.ts`(`isUntranslatedTitle`, `isUntranslatedContent`, `isTruncatedTranslation`). S4 `getDisplayTitle`/`getArticleView`의 "미번역" 표시와 같은 의미를 유지(echo 판정 포함). 새 소비자는 이 둘만 사용.

### C. API
- `GET/HEAD /api/admin/health`(공개): 기존 키 유지, `pipeline.lastError` → `pipeline.lastErrorPresent`(불리언), `translation{…}` 정수 추가. 비밀·URL·원시 에러 금지(S4 계약 B).
- `/api/admin/fix-translations`: 응답 키 추가만(기존 키·`message` 유지). 파라미터는 `parseIntParam`.
- `/api/img`: 성공 응답 동일(이미지 바이트 + 캐시 헤더), 실패는 400/403/413/415/502/504 + `{error:code}`. 500 없음. 클라이언트(S3 이미지 체인)는 비-200을 기존처럼 대체 이미지로 처리.
- `/api/collect`(인증): 진행 중이면 409 추가.

### D. 환경변수
- `XAI_API_KEY`(필수), `XAI_MODEL`(기본 `grok-4-1-fast`), `XAI_IMAGE_MODEL`(기본 `grok-2-image`), **신규 `XAI_BASE_URL`**(기본 `https://api.x.ai/v1`), **신규 `XAI_TIMEOUT_MS`**(기본 텍스트 60000/이미지 120000). 운영 `.env`는 바꿀 필요 없음(기본값 동작).

### E. 운영 배포·운영자 실행 절차
1. 배포: `cd /home/ubuntu/livenews && bash redeploy.sh` (웹+수집기; 수집기는 `pm2 startOrReload --only livenews-collector`로 새 코드 적용. 스키마 변경 없음 → 마이그레이션 불필요). `ecosystem.config.js`의 `cron_restart` 변경은 startOrReload로 반영되지 않을 수 있으니 반영 확인: `pm2 describe livenews-collector | grep -i cron` — 다르면 `pm2 delete livenews-collector && pm2 start ecosystem.config.js --only livenews-collector && pm2 save`(livenews 계열만, 전역 명령 금지).
2. 상태 확인: `curl -s http://localhost:4000/livenews/api/admin/health` → `translation` 숫자 기록(특히 `truncatedBodies` = 1회 복구 비용 가늠).
3. 제목·요약·echo 일괄 복구(저렴): `npm run backfill:translations` (또는 `bash redeploy.sh --frontend --backfill`). exit 2면 진단 메시지대로 키/모델/egress 확인.
4. 본문 미번역 + 잘린 본문 1회 복구(비용 큼, 운영자가 시간대 선택): `npm run backfill:translations -- --content --repair-truncated`. 재실행해도 복구된 행은 다시 번역되지 않음.
5. 확인: health `untranslatedTitles`가 echo 거부분 소수만 남고 `untranslatedBodies`·`truncatedBodies`가 0에 수렴, 기사 이미지 1건 `/livenews/api/img?url=<실제 이미지>` → `200 image/*`.
6. 이후에는 수집기(4시간)가 매 회차 끝에 최신 우선 1배치(제목 300·본문 30)를 자동 복구. repair는 자동 실행하지 않음.
- 롤백: `git reset --hard <이전 커밋> && rm -rf .next && npm run build && pm2 reload livenews && pm2 reload livenews-collector` (DB 데이터는 덮어쓴 번역만 바뀌므로 롤백 불필요; 백업 브랜치 `backup/pre-redesign-20260403`).

### F. 검증 도구 계약
- 가짜 서버 판별: 제목 요청 = system에 `idx` 포함(유지 필수), 본문 요청 system에 `idx`·`제목` 금지. 본문 청크 ≤ 3000자.
- `$SP/planner-s4-verify.js`(12), `$SP/planner-s3-verify.js`(8) 계속 통과.

---

## 우선순위·비범위
- 필수: 항목 1~10, 13. 항목 11은 수집 견고성·카테고리/언어 정규화·fix-translations 파라미터까지 필수, 이미지 생성 중단 판정·스크레이퍼 엔티티는 권장. 항목 12 필수(작음).
- 비범위: DB 스키마, UI, 새 AI 기능, Redis 전체 삭제 정책(S4 계약 A가 `invalidateCache('*')` 유지를 요구), 스크레이퍼 요청의 사설 IP 방어(피드 URL은 관리자 통제 — 별도 과제), QA_REPORT-S4 지시 4.
