# QA 리포트 — 슬라이스 S5 (백엔드 & 프로세스, Round 5: 번역 파이프라인 결함 수정)

> 검수 대상: HEAD `23f5f71` (S5 구현) vs `HEAD~1` (SPEC-S5). 30파일, +3099/−543.
> Evaluator가 SELF_CHECK-S5.md 주장과 무관하게 모든 E2E를 **직접 재실행**했다. Generator helper 스크립트(gen-s5-*)는 쓰지 않았고 검증 스크립트를 따로 작성했다
> (`$SP/eval-s5-hang.ts`, `eval-s5-e2e7.ts`, `eval-s5-align.ts`, psql 해시 스냅샷 `eval-s5-pre.tsv`/`eval-s5-post.tsv`).
> 마지막에 `qa-env.sh reseed && qa-env.sh mock`으로 원상 복구를 마쳤다. 소스 파일은 수정하지 않았다(`git status` 출력 없음).

---

## 0. 정적·빌드

| 확인 | 결과 |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npm test` | **158/158 pass**, fail 0 (기존 106 + 신규 52, 20 suites) |
| `bash -n redeploy.sh` / `require('./ecosystem.config.js')` | OK / OK |
| 금지 경로 diff (`prisma package.json src/components page.tsx middleware queries utils constants`) | 빈 출력 |
| `grep api.x.ai src` (xai-client 외) | 0 |
| `slice(0, 6000)` in content-translator | 0 |
| `qa-env.sh restart` | `APP UP`, `✓ Compiled successfully` (BUILD_ID 새로 생성) |

## 1. E2E 실측 (Evaluator 재실행)

### E2E-1 — `--content --repair-truncated` (가짜 LLM)
- **exit=0, 30.3초** (기준 < 180초). `circuit OPEN` 0회, 장애 진단 문구 0회, `Done:` 줄 1개.
- 로그: 시작 시 `titles 60 / summaries 45 / bodies 28 / Truncated bodies to repair: 10` → Round 1 `api 70/70 ok`, Round 2 `8/8 ok` → `remaining titles=1 bodies=0 summaries=1 truncated=0`.

| 기준 | 결과 | 판정 |
|---|---|---|
| T1 미번역 제목 | `408` 하나 | PASS |
| T2 408 titleKo | NULL | PASS |
| T3 | 341~355 15/15 `^한국어 제목`; 301~340·393·394·409·410 44/44 한글 | PASS |
| T4 요약 결손 | `{408}`. 405·409 요약 채워짐(409 = JSON 복구) | PASS |
| T5 미번역 본문 | 0 | PASS |
| T6 381~390 문단 수 | 10건 모두 60/60. 직접 작성한 정렬 검사로 **문단 i ↔ 원문 i 불일치 0건**(순서까지 보존) | PASS |
| T7 410 | 24문단, `번역된 문단:`으로 시작하지 않는 문단 0. LENGTHCUT이 든 >1200자 요청 3건(2949·1359·1464) → length 감지 후 분할 확인 | PASS |
| T8 요청 크기 | content 최대 **2949자**(≤3000), title `max_tokens` 최대 3200 = 10건×320 → ≤10줄 | PASS |
| T9 재시도 한도 | 총 78요청(title 10, content 68). `1. ECHO` 시작 2건(≤3). 393(280자)·394(232자) 본문 각 1회 | PASS |
| T10 | language 분포 변화 0 (en 408·ja 1·zh 1). 카테고리 변경 4건(`general→world`, 304·320·336·352) 모두 표준 slug. 비표준은 대상 밖 398(NULL)·399·400뿐 | PASS |
| T11 | 407 해시 동일, `isActive=f` | PASS |
| 범위 | 변경된 행 = 정확히 301~390·393·394·405·409·410 (95행). 1~300 해시 불변 | PASS |

### E2E-2 — 재실행 멱등성
- exit=0, 요청 로그 **1줄**(408 ECHO 단건), `Truncated bodies to repair: 0`, 본문·repair 요청 0. PASS

### E2E-3 — API 장애 (가짜 서버 중단)
- SPEC 명령(제목만): **exit=2, 7.6초**, `All 7 translation request(s) in this round failed`.
- `--content` 포함 + 키 `xai-SECRETKEY123`: exit=2, 17.0초. 진단 3줄에 `http://127.0.0.1:4010` 표시. 로그 안 키 문자열 **0회**. `Attempt` 재시도 로그 2회뿐(서킷 OPEN 뒤 즉시 포기).
- DB 해시가 reseed 직후 스냅샷과 **완전히 같음**(`diff` 출력 없음). PASS

### E2E-4 — 무응답·오류 서버 (직접 작성한 `eval-s5-hang.ts`, `XAI_TIMEOUT_MS=2000`)
| 모드 | hits | ms | 결과 |
|---|---|---|---|
| hang (응답 안 함) | **3** | 10562 | `titleKo:''`, `failure:'http'` — PASS (SDK 내부 재시도 0) |
| 401 | **1** | 20 | 재시도 없음 — PASS |
| 503 | 3 | 4816 | 백오프 재시도 — PASS |

### E2E-5 — health
- reseed 직후: `{60, 28, 45, 10, activeForeign 409}`. E2E-1 뒤(60초 캐시 경과): `{1, 0, 1, 0}`.
- `lastErrorPresent: true`(불리언), `lastError` 키 없음, 본문에 `http…` 문자열 0, GET 200 / HEAD 200(무인증).
- (선택 항목) Postgres 중단 시 **503** `{"status":"error","error":"database_unavailable",…}`, 원시 메시지 없음. PASS

### E2E-6 — `/api/img`
- SPEC 표의 내부 13개 URL 전부 **403**. 추가로 `0x7f.0.0.1`, `017700000001`, `LOCALHOST.`, `foo.localhost`, `[::ffff:7f00:1]`, `[0:0:0:0:0:ffff:127.0.0.1]`, `localtest.me`·`127.0.0.1.nip.io`(DNS가 127.0.0.1을 반환), `127.0.0.1:6380`도 모두 403.
- `:6379`·`u:p@`·`ftp:`·`javascript:`·`data:` → 400. `?url=%25E0`·`%`·빈 값·파라미터 없음 → 400. **500 0건**. 오류 본문은 `{error:code}`뿐이고 `nosniff`·`no-store`가 붙는다.
- **정상 경로 실측**: 이번 세션에서는 외부 egress가 열려 있어 직접 확인했다.
  - Unsplash JPEG 200, `http://images.unsplash.com`(http) 200, picsum(302 → fastly) 200 `image/jpeg`, Wikimedia PNG 224KB 200, httpbin SVG 200(CSP `sandbox` + nosniff + 기존 Cache-Control/ACAO 유지).
  - `redirect-to → 127.0.0.1` → 403, 리다이렉트 3회 → 따라감(최종 JSON이라 415), 4회 → 502, `delay/15` → 504(10초), `google.com`(HTML) → 415, `octet-stream` → 415.

### E2E-7 — 수집 경로 스니펫 (`eval-s5-e2e7.ts`)
- `language`: `EN-us→en`, `english→en`, `ja_JP→ja`, `ZH-Hant→zh`, `''→en`, `KO→ko`.
- `translateArticles`: `ECHO Foo` → `titleKo:''`. `Fed holds rates` → 한글 제목·요약, `economy`. ko 기사는 pass-through.
- `translateContent`(410 원문) → **24/24문단**. PASS

### 화면 회귀
- `planner-s4-verify.js` **12/12**, `planner-s3-verify.js` **8/8**.
- `audit.js s5-eval` vs `audit-s4-eval`(156 라우트×뷰포트)

| 항목 | S4 | S5 |
|---|---|---|
| 깨진 이미지 | 0 | 0 |
| 넘침 차이 | — | 0 |
| pageErrors | 12 | 12 |
| failed | 12 | 12 |
| 상태 코드 변화 | — | 0 |
| 콘솔 에러가 있는 라우트 | 19 | **135** |

- 콘솔 에러 증가분은 **전부** `/api/img`의 415/502 응답이다(이미지 외 콘솔 에러 0건). 원인은 이번 세션에서 외부 egress가 열려 있다는 점이다. 픽스처 이미지 `images.example-cdn.com`은 실존 도메인이라 HTML로 301을 주고, 이를 415로 거부하는 것이 SPEC의 의도된 동작이다. S3 대체 이미지 체인이 처리하므로 깨진 이미지는 0이다. 이번 슬라이스가 만든 새 시각 회귀는 **0**으로 판정한다.

### 운영 안전성
- `redeploy.sh`
  - 전역 pm2 명령 0건(주석의 금지 목록만 매칭). `pm2 startOrReload … --only "$ONLY_APPS"` 유지.
  - ecosystem 가드(`grep -v livenews`) 유지. `main()` 래핑과 `main "$@"` 유지. `set -euo pipefail` 덕분에 백필 exit 2가 `||` 실패 안내로 이어진다.
  - `--help`가 헤더 박스까지 정확히 출력한다.
- `ecosystem.config.js`
  - 이름·cwd·args 불변, `cron_restart '30 2,14 * * *'`.
  - 수집 정각과 겹치는 문제는 해소했다. 다만 개선 지시 4의 부작용이 남는다.
- xAI 기본값
  - `XAI_BASE_URL`이 없으면 `https://api.x.ai/v1`(단위 테스트로 확인).
  - 타임아웃은 텍스트 60초, 이미지 120초. SDK 재시도 0.
  - 응답 없는 호출의 최악 시간은 약 3분이고, 그 뒤 서킷 OPEN으로 즉시 포기한다. 합리적인 값이다.

---

## 2. SPEC 개선 항목 검증

- [PASS] 항목 1 공통 xAI 클라이언트
  - `src/lib/xai-client.ts`: `getXaiConfig`/`createXaiClient`/`describeXaiEndpoint`(origin만 노출)/`chatCompletion`. 3개 워커의 `buildClient` 삭제.
  - E2E-4에서 hits=3을 확인.
- [PASS] 항목 2 재시도·서킷
  - `isRetryableError`: 401은 1회, 503/429/네트워크는 3회. 브레이커는 `create()`만 감싼다(`xai-client.ts:130`).
  - HALF_OPEN 동시 프로브는 `probeInFlight`로 1개만 허용(`circuit-breaker.ts:59-64,94-96`).
  - 실패 청크에는 "Translated chunk"를 찍지 않는다(`translator.ts:210-214`).
- [PASS] 항목 3 순수 유틸 `translation-text.ts`
  - constants만 import. 분할은 무손실이고 서로게이트 쌍을 보호한다. salvage는 예외를 던지지 않는다. 진리표 테스트 있음.
- [PASS] 항목 4 제목 번역
  - salvage, 누락분 반분할 재요청(깊이 3), HTTP 실패 시 분할 없음(테스트 ⑥: 호출 3회), 카테고리·요약 검증, idx 계약 유지.
- [PASS] 항목 5 본문 청크
  - 3000자 청크, `length` 시 floor(len/2)·하한 200·깊이 4로 재분할. 부분 번역은 저장하지 않는다. 프롬프트에 원문 언어를 명시하고 `idx`·`제목` 단어가 없다.
- [PASS] 항목 6 단일 판정
  - `translation-coverage.ts`의 SQL 술어가 health·CLI·fix-translations·backfill 네 곳에서 같은 숫자를 낸다(60/28/45/10).
  - id 커서, echo는 NULL 정리, 이미 번역된 titleKo는 보존.
- [PASS] 항목 7 `--repair-truncated`
  - 10/10 복구, 재실행 대상 0, HTTP 장애 시 원본 보존.
  - 판정식의 오탐 위험이 있다 → 개선 지시 1.
- [PASS] 항목 8 CLI
  - 시작 시 4개 수치, 커서 순회, `apiCalls>0 && apiFailures===apiCalls`일 때만 exit 2, 파싱 가능한 `Done:` 줄.
  - `parseIntParam`으로 엄격 파싱하고 미지 인자는 경고.
- [PASS] 항목 9 health
  - `translation{…}`, 60초 캐시, 계산 실패 시 null(503 아님), `lastErrorPresent`, 503 `database_unavailable`.
- [PASS] 항목 10 `/api/img`
  - pinned lookup(`all:true` 콜백 형태까지 처리), 매 홉 재검증, image/*만 허용, 10MB, 10초, 500 없음.
  - Content-Type 누락·octet-stream 이미지 처리 → 개선 지시 2.
- [PASS] 항목 11 수집기
  - `collectSource` 래핑과 조기 실패 CollectionLog 기록, 카테고리·요약·언어 정규화.
  - 캐시 패턴은 `home:x:*`·`breaking`. `/api/collect`가 진행 중이면 409.
  - fix-translations는 `parseIntParam` + `countTranslationBacklog`(기존 키 유지, `truncatedBodies` 추가).
  - image-generator는 status로 중단 판정, scraper는 `fromCodePoint`.
- [PASS] 항목 12 운영 설정
  - cron 변경, `.env.example` 주석 3줄, redeploy 도움말·안내 문구만 수정, scheduler 주석, QA README.
- [PASS] 항목 13 테스트
  - 신규 6파일·52케이스. SPEC 필수 케이스를 모두 덮는다(사설 IP 진리표, safe fetch 7종, finish_reason 4종, JSON 복구 6종 등). 네트워크·DB 사용 없음.

---

## 3. 코드 리뷰에서 찾은 문제 (차단 아님, 다음 라운드 권장)

### R1. [중간] 잘림 판정의 오탐 → 정상 번역이 반복 재번역되거나 NULL로 리셋될 수 있음
- 위치: `translation-text.ts:133-140`, `translation-coverage.ts:45-50`
- 현재 판정은 "원문 > 6000자이고 번역 문단 수 < 원문 문단 수"다. 실제 LLM은 프롬프트로 지시해도 가끔 문단을 합친다. 그러면:
  - (a) 새로 완역된 6000자 초과 기사도 `truncatedBodies`로 집계돼 health가 영영 0이 되지 않는다.
  - (b) 운영자가 `--repair-truncated`를 돌릴 때마다 같은 행을 다시 번역한다(비용 발생, SPEC의 "재실행 안전"이 실모델에서는 보장되지 않음).
  - (c) 그 재번역이 모델 출력 문제로 실패하면 `backfill.ts:421`이 **멀쩡한 완역본을 NULL로 지운다**.
- 모의 서버는 문단을 절대 합치지 않으므로 E2E-2로는 드러나지 않는다.

### R2. [중간] `/api/img`가 Content-Type 누락·`application/octet-stream` 이미지를 415로 거부
- 위치: `safe-image-fetch.ts:340-344`
- 기존 코드는 누락 시 `image/jpeg`를 기본값으로 썼다. S3·일부 뉴스 CDN이 `binary/octet-stream`으로 내보내는 정상 사진도 이제 대체 이미지로 바뀐다(실측: octet-stream → 415).
- SPEC 문구를 따른 결과지만, 정상 이미지가 막히는 회귀다.

### R3. [낮음] 검증한 주소 중 첫 번째에만 연결, 나머지 주소로 재시도 없음
- 위치: `safe-image-fetch.ts:227`, `:249`
- 기존 undici fetch(Node 22 autoSelectFamily)는 다른 주소로 넘어갔다. 지금은 첫 IP가 죽어 있거나, 첫 주소가 IPv6인데 egress가 없으면 바로 502다.
- 이 호스트에서는 glibc가 IPv4를 먼저 반환해 실측 영향이 없었다.

### R4. [낮음] PM2 위생 재시작이 수집을 추가로 일으킴
- 위치: `ecosystem.config.js:32`, `scheduler.ts:89`(시작 즉시 `collectAll`)
- 02:30·14:30 재시작마다 기동 시 수집이 돌아 하루 수집이 6회에서 **8회**로 늘고, 그때마다 자동 백필(제목 300·본문 30)도 함께 돈다.
- 계속 거부되는 echo 행은 회차마다 재요청되어 API 비용이 늘어난다.

### R5. [낮음] `idx` 없는 항목을 배열 위치로 매핑
- 위치: `translator.ts:130`
- 모델이 일부 항목에서 `idx`를 빠뜨리면 위치 기반으로 다른 제목에 붙을 수 있다. `looksTranslated`는 "한글 있음·원문과 다름"만 보므로 엉뚱한 제목의 번역이 채택될 수 있다.

---

## 최종 판정

**전체 판정**: 합격
**가중 점수**: 8.3 / 10.0

**항목별 점수**:
- 디자인 품질: 8/10 — 운영자 경험이 크게 좋아졌다. 진단 3줄(키/모델/엔드포인트, 키 미노출), 파싱 가능한 `Done:` 줄, health 정수 지표, 단계별 Round 로그를 갖췄다. 사용자에게 보이는 번역도 완성본만 저장한다(60/60문단, 순서 보존). 문단 병합 오탐(R1)이 health 숫자를 왜곡할 여지가 있어 감점.
- 독창성: 8/10 — 해결 방식이 적절하다. 서킷 범위를 HTTP로 한정했고, id 커서로 한 번만 순회하며, DNS 고정(pinned lookup)으로 rebinding을 차단하고, "정직한 데이터"를 위해 NULL로 리셋한다. 잘림 판정은 문단 수 하나에만 기대는 단순한 휴리스틱이다.
- 기술적 완성도: 8/10 — tsc 0, 158/158, 의존성·스키마 변경 0, 판정 SQL 단일화. R1(정상 번역 NULL 리셋 경로)과 R5(idx 위치 폴백)가 남았다.
- 기능성: 9/10 — SPEC의 E2E-1~7과 T1~T11을 모두 독립 재현했다(30초 exit 0, 멱등 1요청, 장애 7.6초 exit 2, hang 3hits/10.6초, 401 1hit, health 수치 일치, SSRF 13+9 URL 403, 500 0건). 실제 외부 이미지(JPEG/PNG/SVG, 302 체인)가 200으로 오는 것도 확인했다.
- 회귀 안전: 9/10 — S4 12/12, S3 8/8, 깨진 이미지·넘침·pageErrors·상태 코드 변화 0, 1~300 해시와 407 불변, API 키는 추가만 했다. 감점 요인은 octet-stream 이미지 거부(R2)다.

계산: 8×0.3 + 8×0.2 + 8×0.25 + 9×0.15 + 9×0.1 = 2.4 + 1.6 + 2.0 + 1.35 + 0.9 = **8.25 → 8.3**

**구체적 개선 지시** (합격이므로 차단 아님 — 다음 라운드나 후속 작업으로 권장):
1. `src/workers/translation-text.ts:133-140` + `src/lib/translation-coverage.ts:45-50`
   - 잘림 판정을 옛 6000자 절단의 흔적으로 좁힐 것: `countParagraphs(contentKo) <= countParagraphs(contentOriginal.slice(0, 6000))`. SQL은 `left("contentOriginal", 6000)`의 문단 수와 비교한다.
   - 그러면 문단 몇 개를 합친 완역본은 잘림 대상이 아니다. 또 `backfill.ts:418-423`은 repair가 모델 출력 문제로 실패해도 기존 contentKo가 "원문 앞 6000자 이상 커버"이면 NULL로 지우지 말고 보존할 것.
   - 진리표 테스트에 "61문단 원문 + 58문단 완역 → false" 케이스를 추가한다.
2. `src/lib/safe-image-fetch.ts:340-344`
   - Content-Type이 없거나 `application/octet-stream`/`binary/octet-stream`이면 본문 앞 16바이트 매직넘버로 판별할 것: JPEG `FF D8 FF`, PNG `89 50 4E 47`, GIF `GIF8`, WebP `RIFF....WEBP`, AVIF `ftypavif`.
   - 판별되면 그 `image/*`로 200, 아니면 415(SVG는 스니핑 대상에서 제외). `tests/safe-image-fetch.test.ts`에 octet-stream+JPEG → 200 `image/jpeg`, octet-stream+HTML → 415 케이스를 추가한다.
3. `src/lib/safe-image-fetch.ts:210-228, 311-320`
   - `resolveSafe`가 검증된 주소 목록 전체를 돌려주게 하고, 연결 오류(요청 단계 reject)가 나면 다음 주소로 1회씩 재시도할 것(IPv4 우선 정렬, 전체 10초 타임아웃 안에서).
4. `ecosystem.config.js:32` / `src/workers/scheduler.ts:89`
   - 위생 재시작으로 생기는 추가 수집(하루 8회)을 막을 것. 예: `cron_restart`를 제거하고 `max_memory_restart`만 남기거나, scheduler가 기동 시 직전 CollectionLog가 3시간 이내면 즉시 수집을 생략하게 한다.
   - 선택한 방식을 `SPEC/redeploy` 운영 절차에 한 줄 적는다.
5. `src/workers/translator.ts:129-131`
   - 응답 항목 중 하나라도 `idx`가 있으면 `idx` 없는 항목은 버릴 것(위치 폴백은 응답 전체에 `idx`가 없을 때만). `tests/translator.test.ts`에 "idx 섞임·누락" 케이스를 추가한다.

**방향 판단**: [현재 방향 유지]

---
로그·산출물(`$SP` = `/tmp/claude-0/-home-user-hydro/0832edd1-f39e-53fc-97a8-a3a334add43a/scratchpad`):
- E2E 로그: `eval-s5-e2e.log`, `eval-s5-e2e2.log`, `eval-s5-e2e3.log`, `eval-s5-e2e3b.log`
- 재시작·health: `eval-s5-restart.log`, `eval-s5-health-pre.json`
- DB 스냅샷: `eval-s5-pre.tsv`, `eval-s5-post.tsv`
- 검증 스크립트: `eval-s5-hang.ts`, `eval-s5-e2e7.ts`, `eval-s5-align.ts`
- 화면 감사: `audit-s5-eval.json`, `audit-s5-eval.log`
- 종료 상태: reseed 완료(410건), 가짜 서버 :4010 재기동, 앱 :4000 = HEAD 빌드
