# QA 도구 (로컬 전용)

운영 DB가 아닌 **로컬 복제 환경**에서 화면 깨짐과 번역 파이프라인을 재현·검증하는 도구입니다.
`seed-fixtures.ts`는 기사 테이블을 비우므로 `localhost` DB + `QA_ALLOW_RESET=1`일 때만 실행됩니다.

## 1. 로컬 환경 준비
```bash
# Postgres / Redis (예: docker)
docker run -d --name qa-pg -p 54329:5432 -e POSTGRES_HOST_AUTH_METHOD=trust postgres:16
docker run -d --name qa-redis -p 6380:6379 redis:7
export DATABASE_URL="postgresql://postgres@127.0.0.1:54329/postgres?schema=public"
export REDIS_URL="redis://127.0.0.1:6380"

npx prisma db push --skip-generate
npx tsx prisma/seed.ts                                # 30개 소스
QA_ALLOW_RESET=1 npx tsx scripts/qa/seed-fixtures.ts  # 엣지 케이스 기사 410건 → qa-out/fixture-ids.json
npm run build && npm start                            # :4000/livenews
```

## 2. 단위 테스트
```bash
npm test
```

## 3. 화면 전수 감사 (49개 라우트 × 모바일/태블릿/PC)
```bash
npm i --no-save playwright
node scripts/qa/ui-audit.js after-fix   # 문제 0건이면 "ALL CLEAN", 아니면 exit 1
```
뷰포트 넘침(박스·텍스트), 깨진 이미지, 콘솔/하이드레이션 에러, 실패 요청, 404 상태코드,
관리자 페이지 직접 진입(자격증명 캐시 없는 상태)을 검사합니다. 외부 이미지는 일부러 차단해
"이미지 서버 장애" 최악 조건에서 대체 이미지가 동작하는지 봅니다.

## 4. 번역 파이프라인 E2E (API 키 없이)
```bash
node scripts/qa/mock-llm.js 4010 &
OPENAI_API_KEY=test OPENAI_BASE_URL=http://127.0.0.1:4010/v1 npm run backfill:translations -- --content --repair-truncated
# 재실행(멱등성): 요청 거의 0건, "Truncated bodies to repair: 0"
OPENAI_API_KEY=test OPENAI_BASE_URL=http://127.0.0.1:4010/v1 npm run backfill:translations -- --content --repair-truncated
curl -s http://127.0.0.1:4000/livenews/api/admin/health   # translation{untranslatedTitles,…}
```
종료 코드: 0 = 완료, 1 = 설정 오류(키 없음 등), 2 = 한 라운드의 요청이 전부 HTTP 단계에서 실패(API 장애·잘못된 키 —
진단 메시지에 엔드포인트와 마지막 오류 표시), 3 = OpenAI 크레딧 부족(`insufficient_quota`). 모델이 거부한 행(echo 등)은
장애로 보지 않고 미번역(NULL)으로 남깁니다.
가짜 서버는 실제 OpenAI처럼 `max_tokens`를 거부하고 OpenAI 오류 형식으로 답합니다. 제목 echo(`ECHO`),
JSON 잘림(`TRUNCJSON`), 토큰 한도 잘림(`LENGTHCUT`)을 재현하고, 환경변수로 장애를 흉내 냅니다:
`MOCK_BILLING=1`(크레딧 부족 429), `MOCK_VALID_KEY=sk-…`(다른 키는 401), `MOCK_REJECT_PARAMS=temperature`(파라미터 거부).
요청 로그: `qa-out/mock-llm-requests.jsonl` (`MOCK_LOG_DIR`로 변경).

## 5. API 키 입력 창 테스트
```bash
MOCK_VALID_KEY=sk-proj-test1234567890abcdefgh node scripts/qa/mock-llm.js 4010 &
echo 'OPENAI_BASE_URL="http://127.0.0.1:4010/v1"' >> .env   # 로컬 복제 환경의 .env 에서만
bash set-ai-key.sh --no-reload      # 입력 창 → 확인 → .env 저장
bash set-ai-key.sh --check
```

## 6. 최근 기사만 AI 처리 (`npm run ai:recent`)
```bash
npm run ai:recent -- --dry-run     # 할 일과 예상 요청 수만 표시 (요청 0건)
npm run ai:recent                  # 최근 30건: 제목·요약·본문 번역 + 사진 없는 기사 AI 이미지
npm run ai:recent -- --limit=50 --no-images
```
이미 처리된 항목은 다시 요청하지 않으므로 재실행 비용은 0입니다. 종료 코드: 0 완료, 1 키 없음,
2 모든 요청 실패(키 확인), 3 크레딧 부족. 로컬 검증은 가짜 서버에 `MOCK_IMAGE_FILE=<jpg>`를 주면 실제 이미지가 저장됩니다.
