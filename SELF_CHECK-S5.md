# 자체 점검 — 슬라이스 S5 (Round 5, 번역 파이프라인 결함 수정)

## SPEC 개선 항목 체크
- [x] 항목 1 (D22·D20): 신규 `src/lib/xai-client.ts`(`getXaiConfig`/`createXaiClient`/`describeXaiEndpoint`/`chatCompletion`). `XAI_BASE_URL`(끝 슬래시 제거, http(s) 아니면 기본값), `XAI_TIMEOUT_MS`(1000~600000, 기본 text 60s/image 120s), SDK `maxRetries: 0`. translator·content-translator·image-generator의 `buildClient` 삭제.
- [x] 항목 2: `retry.ts` `shouldRetry` + 기본 `isRetryableError`(CircuitOpenError·400/401/403/404/422 재시도 안 함, 408/409/429/5xx·네트워크/타임아웃만), 로그 `Attempt n/max`(max=총 시도 수). 브레이커는 `client.chat.completions.create`만 감쌈(파싱·echo·finish_reason은 밖). HALF_OPEN 중 프로브 1개만(나머지 즉시 CircuitOpenError). 실패 청크엔 "Translated chunk" 로그 없음.
- [x] 항목 3: 신규 `src/workers/translation-text.ts`(constants만 import) — `hasHangul`, `isKoreanLanguage`, `isUntranslatedTitle/Content`, `isMissingSummary`, `countParagraphs`, `isTruncatedTranslation`, `splitForTranslation`(문단 묶음 / 긴 문단은 문장→공백→강제 절단, 조각은 `' '`로 재결합, 무손실), `salvageTitleItems`(객체별 구제, 닫힌 필드만, 예외 없음), `normalizeCategorySlug`, `normalizeLanguageTag`.
- [x] 항목 4: `translator.ts` — 응답은 `salvageTitleItems`로 해석, 채택 = 한글 있음·원문과 다름, summaryKo 한글만, 카테고리 정규화. 누락 항목만 반으로(마지막 단계는 단건) 재요청, 깊이 ≤ 3. HTTP 실패 청크는 분할 안 함. `translateTitleBatch(titles, {client, model, stats, pauseMs})`, 결과에 `failure: 'http'|'rejected'` 추가(호환 유지). idx 프롬프트 계약 유지.
- [x] 항목 5: `content-translator.ts` — 6000자 절단 삭제, `translateLongText`(≤3000자 청크, `finish_reason:'length'` → floor(len/2)·하한 200·깊이 ≤4로 재분할, 못 하면 기사 전체 실패), 빈/한글 없는 응답 실패, 부분 번역 저장 금지. 프롬프트에 원문 언어 명시·"문단 수 유지", `idx`·`제목` 단어 없음.
- [x] 항목 6: 신규 `src/lib/translation-coverage.ts`(Prisma.sql 술어 1곳: 미번역 제목/본문/요약 결손/잘린 본문, `selectBacklogIds` id DESC 커서, `countTranslationBacklog`). `backfill.ts` 재작성 — 제목 단계 = 미번역 제목 ∪ 요약 결손, 이미 번역된 titleKo 덮어쓰기 금지, 모델이 다시 거부한 echo는 NULL 정리, 본문은 완성본만 저장, 신규 통계(`titlesFailed`, `titlesCleared`, `contentFailed`, `repaired`, `repairReset`, `apiCalls`, `apiFailures`, `nextCursor`, `remainingSummaries`, `remainingTruncated`).
- [x] 항목 7: `--repair-truncated`(CLI 전용) — 잘린 본문 1회 순회, 성공 시 교체, 모델 실패 시 NULL, HTTP 장애 시 보존(다음 실행에 재시도). 시작 시 `Truncated bodies to repair: N` 출력. 복구된 행은 문단 수 일치로 재선택 안 됨.
- [x] 항목 8: `backfill-cli.ts` — 시작 시 4개 수치, 단계별 커서 순회(같은 실행 재시도 없음), 장애 판정 = 라운드 `apiCalls>0 && apiFailures===apiCalls`일 때만 exit 2(진단에 `describeXaiEndpoint()`, 키 미출력), 파싱 가능한 `Done:` 한 줄, `parseIntParam` 엄격 파싱, 미지 인자 경고. 캐시 전체 비우기 유지.
- [x] 항목 9: health — `translation{untranslatedTitles, untranslatedBodies, missingSummaries, truncatedBodies, activeForeign}`(60초 메모리 캐시, 실패 시 null·503 아님), `pipeline.lastError` → `lastErrorPresent`, 503 본문 `error:'database_unavailable'`. 공개(무인증) 유지.
- [x] 항목 10: 신규 `src/lib/safe-image-fetch.ts`(Node 내장만) + `/api/img` — 이중 디코드 제거, http(s)·자격증명 금지, 내부 호스트(이름·IP 리터럴·DNS 응답 중 하나라도 차단 대역) 403(포트보다 우선), 비표준 포트 400, 검증한 주소로 연결 고정(`lookup` 주입), 리다이렉트 수동 3회·매 홉 재검증, image/*만(415), 10MB(413), 10초(504), 오류는 `{error:code}`, 최종 catch 502. 성공 헤더에 nosniff + CSP sandbox.
- [x] 항목 11: collector — `collectSource` 최상위 try/catch(예외·조기 실패/partial도 CollectionLog 기록), 저장 시 `normalizeCategorySlug`/보조 카테고리 검증/summaryKo 한글 검사, 캐시 패턴 `home:${c}:*`·`home:all:*`·`breaking` 수정. normalizer `normalizeLanguageTag`. `/api/collect` in-flight 409. fix-translations `parseIntParam` + 집계를 `countTranslationBacklog`로(기존 키·samples·message 유지, `truncatedBodies` 추가). image-generator 공통 클라이언트 + status 400/401/403/404·CircuitOpenError로 중단 판정. scraper `&#x..;`/`&#..;` → `String.fromCodePoint`(범위 밖은 원문 유지).
- [x] 항목 12: ecosystem 수집기 `cron_restart` `'0 */12 * * *'` → `'30 2,14 * * *'`(수집 정각과 비충돌, 앱 이름·cwd·args 불변). `.env.example`에 `XAI_BASE_URL`/`XAI_TIMEOUT_MS`/`XAI_IMAGE_MODEL` 주석 예시. `redeploy.sh` 도움말·백필 안내 문구만(배포 로직·`--only`·가드·main() 래핑 불변, help `head -23`로 헤더 정확히 출력). scheduler 주석 4시간. `scripts/qa/README.md` E2E 명령 갱신.
- [x] 항목 13: 신규 테스트 6개 — `translation-text`(15), `translator`(7), `content-translator`(7), `retry`(7), `xai-client`(6), `safe-image-fetch`(10). 네트워크·DB 없음.

## 수정 파일 목록
- `src/lib/xai-client.ts` (신규): 공통 xAI 클라이언트·설정·chatCompletion(retry+breaker는 HTTP만)
- `src/lib/translation-coverage.ts` (신규): 미번역 판정 SQL 단일 소스 + 커서 선택 + 집계
- `src/lib/safe-image-fetch.ts` (신규): SSRF 방어 이미지 페처
- `src/workers/translation-text.ts` (신규): 순수 판정·분할·JSON 구제·정규화
- `src/lib/retry.ts`, `src/lib/circuit-breaker.ts`: 재시도 정책, HALF_OPEN 단일 프로브
- `src/workers/translator.ts`, `content-translator.ts`, `backfill.ts`, `backfill-cli.ts`: 위 항목 4~8
- `src/workers/collector.ts`, `normalizer.ts`, `image-generator.ts`, `scraper.ts`, `scheduler.ts`(주석): 항목 11·12
- `src/app/api/admin/health/route.ts`, `fix-translations/route.ts`, `src/app/api/img/route.ts`, `src/app/api/collect/route.ts`: 항목 9·10·11
- `ecosystem.config.js`, `.env.example`, `redeploy.sh`, `scripts/qa/README.md`: 항목 12
- `tests/{translation-text,translator,content-translator,retry,xai-client,safe-image-fetch}.test.ts` (신규)
- 수정 금지 파일(스키마·package.json·UI·middleware·queries/utils/constants): `git diff --stat` 빈 출력 확인

## 검증 결과 (실측)
| 기준 | 결과 |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npm test` | **158/158 pass** (기존 106 + 신규 52) |
| `bash -n redeploy.sh`, ecosystem require, 금지 경로 diff, `api.x.ai` 하드코딩(xai-client 외), `slice(0, 6000)` | 통과 / 빈 출력 / 0 / 0 |
| E2E-1 백필(`--content --repair-truncated`) | **exit 0, 30초**, circuit OPEN 0, 장애 진단 0, Done 줄 1 |
| T1 미번역 제목 | `408`만 |
| T2 408 titleKo | NULL |
| T3 | 341~355 15/15 `^한국어 제목`, 301~340·393·394·409·410 44/44 한글 |
| T4 요약 결손 | `{408}`, 405 요약 채워짐 |
| T5 미번역 본문 | 0 |
| T6 381~390 문단 수 | 전부 60/60 |
| T7 410 | 24문단, 전부 `번역된 문단:` 시작; LENGTHCUT 요청 중 >1200자 3건(length 감지·분할 발생) |
| T8 요청 크기 | content 최대 2949자(≤3000), title 요청 최대 10줄 |
| T9 | title 요청 10건(≤20), `1. ECHO` 시작 2건(≤3), 393/394 본문 각 1회; 총 78요청 |
| T10 | 대상 행 카테고리 모두 표준(비대상 398 NULL·399·400만 비표준, 불변), language 분포 불변(en 408·ja 1·zh 1) |
| T11 | 407 비활성·값 해시 동일 |
| E2E-2 재실행 | exit 0, 요청 **1건**(408 ECHO 단건), `Truncated bodies to repair: 0` |
| E2E-3 가짜 서버 중단 | **exit 2, 7.6초**, 진단에 `http://127.0.0.1:4010`, 키 미노출, DB 해시 reseed 직후와 동일(T1 60 유지) |
| E2E-4 무응답 서버(타임아웃 2s) | `hits=3`, `ms=10791`(<20000), `titleKo=''` |
| E2E-5 health | reseed 직후 `{60, 28, 45, 10, activeForeign 409}`; E2E-1 후 `{1, 0, 1, 0}`; `lastErrorPresent: true`(불리언), `lastError` 키 없음, `feeds.example.com`·`http…` 에러 문자열 0, GET 200 / HEAD 200(무인증) |
| E2E-6 `/api/img` | 내부 13개 URL 전부 **403**(127.0.0.1:4000, localhost:4010 포함), `:6379`·`u:p@`·`ftp:`·`javascript:` **400**, `?url=%25E0`·`%`·빈 값·없음 **400**, **500 0건**, 오류 본문 `{error:code}`만, `nosniff` 헤더 |
| E2E-7 스니펫 | `language 'EN-us'→'en'`, ECHO→`''`·Fed→한글+`economy`, 410 원문 → 24문단 — 모두 PASS |
| 회귀 | `planner-s4-verify.js` **12/12**, `planner-s3-verify.js` **8/8**, `qa-env.sh restart` 빌드 성공(`APP UP`) |
| 정리 | 마지막 `qa-env.sh reseed` 완료, 가짜 서버 재기동 |

로그: `$SP/gen-s5-e2e.log`, `gen-s5-e2e2.log`, `gen-s5-e2e3.log`, `gen-s5-restart.log`, `gen-s5-img.txt`, `gen-s5-s4verify.log`, `gen-s5-s3verify.log`; 검증 스크립트 `gen-s5-verify.sh`, `gen-s5-hang.ts`, `gen-s5-e2e7.ts`.

## 디자인 자체 평가
- AI slop 패턴 사용 여부: 해당 없음 (백엔드 전용, UI 파일 수정 0)
- 독창적 요소: "정직한 데이터" — 불완전 번역은 저장하지 않고 NULL로 두어 S4의 번역 상태 띠가 사실만 표시하도록 함. 모델 출력 문제와 API 장애를 분리(서킷·재시도·CLI 종료 코드).
- 다크 모던 테마 일관성: 해당 없음

## 회귀 위험 확인
- 기존 기능 영향: 
  - `/api/admin/health` 응답에서 `pipeline.lastError`(문자열)가 `lastErrorPresent`(불리언)로 바뀜 — SPEC 계약 C. 저장소 내 소비자 없음(grep 확인), redeploy.sh는 HTTP 200만 봄.
  - `/api/collect`가 진행 중이면 409 — 관리자 버튼은 기존 실패 alert로 처리(UI 변경 금지라 문구 그대로).
  - 수집기 CollectionLog가 조기 failed/partial 종료도 기록(이전엔 누락) → 관리자 로그 행이 약간 늘어날 수 있음.
  - `/api/img`는 이제 image/* 외 응답·비표준 포트·내부 호스트를 거부 — 외부 egress가 막힌 이 환경에서 정상 이미지 200은 단위 테스트(공개 IP+image/jpeg)로만 확인; 운영 배포 후 실제 이미지 1건 `200 image/*` 확인 필요(SPEC 운영 절차 5).
  - `ecosystem.config.js` cron 변경은 `pm2 startOrReload`로 반영되지 않을 수 있음 — SPEC 운영 절차 1의 `pm2 describe livenews-collector | grep -i cron` 확인 필요.
- TypeScript 오류: 없음
- DB 스키마·의존성 변경: 없음

## QA 피드백 반영 (QA_REPORT-S5 개선 지시 1~5)
- [x] 지시 1 (잘림 오판·repair 데이터 손실): `isTruncatedTranslation` = 원문 > 6000자 && 번역 문단 수 < 원문 문단 수 && 번역 문단 수 ≤ **원문 앞 6000자의 문단 수**(`legacyPrefixParagraphs`). SQL `TRUNCATED_BODY_SQL`도 `left("contentOriginal", 6000)`의 문단 수와 비교(동일 의미). 문단 몇 개를 합친 완역본(61→58)은 잘림이 아님. `backfill.ts` repair: 모델 출력 문제로 실패해도 기존 번역이 앞 6000자 문단을 모두 덮으면(`coversLegacyPrefix`) **보존**(`repairKept`), 그보다 짧은 경우만 NULL. CLI 라운드/Done 줄에 `kept=` 표시. 테스트: 61문단 원문+58문단 완역 → false, 앞 6000자 경계, `coversLegacyPrefix` 진리표, `tests/backfill-repair.test.ts`(가짜 Prisma+항상 length 클라이언트 → 1건 보존·1건 NULL, update는 NULL 1건뿐).
- [x] 지시 2 (CDN 이미지 차단): Content-Type 없음/`application/octet-stream`/`binary/octet-stream`이면 본문 앞 16바이트 매직넘버(`sniffImageType`: JPEG·PNG·GIF·WebP·AVIF)로 판별해 해당 `image/*`로 200. HTML·SVG는 스니핑하지 않음 → 415. 선언된 `image/*`는 기존대로. 테스트: octet-stream+JPEG → 200 `image/jpeg`, binary/octet-stream·무헤더+PNG → 200, octet-stream+HTML/SVG → 415, 매직넘버 표.
- [x] 지시 3 (다중 주소): `resolveSafe`가 검증된 주소 전체를 중복 제거 후 **IPv4 우선**으로 반환. 요청 단계 reject(연결 오류) 시 다음 주소로 1회씩 시도(전체 10초 타임아웃 내), 모두 실패 → 502. 하나라도 사설 주소면 여전히 403. 테스트: v6+v4×2 중 첫 v4 거부 → 두 번째 v4 성공, 전부 실패 시 시도 순서 v4,v4,v6 후 502, 혼합(공개+10.0.0.1) → 403.
- [x] 지시 4 (재시작 추가 수집): `scheduler.ts` 기동 시 CollectionLog 최신 `completedAt`이 3시간 이내면 즉시 수집 생략 + 이유 로그(`Startup collection skipped: last run completed N min ago …`). 조회 실패 시엔 기존처럼 수집. `cron_restart '30 2,14 * * *'` 유지. ecosystem 주석·`redeploy.sh` 수집기 단계 주석에 운영 방식 한 줄. 실측: reseed 후 `timeout 8 tsx scheduler.ts` → 생략 로그 출력, CollectionLog 80 → 80(수집 없음). 한계: 신규 기사 0건인 성공 소스는 CollectionLog를 남기지 않으므로 직전 실행 전체가 "새 기사 0"이면 생략되지 않음(기존 동작과 동일한 1회 수집).
- [x] 지시 5 (idx 혼재): 응답에 `idx`가 하나라도 있으면 `idx` 없는 항목은 버림(위치 매핑은 응답 전체에 idx가 없을 때만). 버린 항목은 누락 재요청 경로로 다시 번역. 테스트: idx 빠진 항목을 맨 앞에 둔 혼합 응답 → 엉뚱한 번역 미채택, 해당 제목만 단건 재요청으로 정확히 채움 / idx 전무 → 위치 폴백 유지.

### 재검증 (반영 후)
| 기준 | 결과 |
|---|---|
| `npx tsc --noEmit` / `npm test` | 0 errors / **166/166 pass** (신규 8 추가) |
| E2E-1 | exit 0, 30초, circuit OPEN 0, 진단 0; T1 `408`, T2 NULL, T3 15/15·44/44, T4 `{408}`(405 채움), T5 0, T6 381~390 전부 60/60, T7 410 24문단·LENGTHCUT>1200 3건, T8 최대 2949자·title ≤10줄, T9 title 10건·`1. ECHO` 2건·393/394 각 1회, T10 표준 slug·language 불변, T11 407 불변; `Truncated bodies to repair: 10` → `repaired=10 reset=0 kept=0` |
| E2E-2 재실행 | exit 0, 요청 1건, `Truncated bodies to repair: 0` |
| health(reseed 직후, 재빌드 후) | `{60, 28, 45, 10, 409}` — 새 잘림 기준에서도 픽스처 381~390 10건 그대로 대상 |
| `/api/img` | 내부 13건 403, 형식 오류 8건 400, 500 0건 |
| 회귀 | `qa-env.sh restart` 빌드 성공, `planner-s4-verify` 12/12, `planner-s3-verify` 8/8 |
| 정리 | `qa-env.sh reseed && qa-env.sh mock` 완료 |
