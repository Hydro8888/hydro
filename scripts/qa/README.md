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
XAI_API_KEY=test XAI_BASE_URL=http://127.0.0.1:4010/v1 npm run backfill:translations -- --content --repair-truncated
# 재실행(멱등성): 요청 거의 0건, "Truncated bodies to repair: 0"
XAI_API_KEY=test XAI_BASE_URL=http://127.0.0.1:4010/v1 npm run backfill:translations -- --content --repair-truncated
curl -s http://127.0.0.1:4000/livenews/api/admin/health   # translation{untranslatedTitles,…}
```
종료 코드: 0 = 완료, 2 = 한 라운드의 요청이 전부 HTTP 단계에서 실패(API 장애 — 진단 메시지에 엔드포인트 표시),
1 = 설정 오류. 모델이 거부한 행(echo 등)은 장애로 보지 않고 미번역(NULL)으로 남깁니다.
가짜 서버는 제목 echo(`ECHO`), JSON 잘림(`TRUNCJSON`), 토큰 한도 잘림(`LENGTHCUT`)을 재현합니다.
요청 로그: `qa-out/mock-llm-requests.jsonl`.
