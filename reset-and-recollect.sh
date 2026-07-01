#!/bin/bash

# ====================================================
# LiveNews - 기존 기사 삭제 + 재수집 스크립트
# 모든 기사를 삭제하고 새로 수집합니다 (본문+이미지 포함)
# 사용법: bash reset-and-recollect.sh
# ====================================================

DEPLOY_PATH="/home/ubuntu/livenews"
cd "$DEPLOY_PATH" || { echo "디렉토리 없음"; exit 1; }

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "=============================="
echo "  기사 전체 삭제 + 재수집"
echo "=============================="
echo ""

# 1. 현재 기사 수 확인
echo "[1/4] 현재 상태..."
npx tsx -e "
const{PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
Promise.all([p.article.count(),p.source.count(),p.collectionLog.count()])
.then(([a,s,l])=>{console.log('기사:',a,'건 / 소스:',s,'개 / 로그:',l,'건');process.exit(0)})
.catch(e=>{console.log('DB 에러:',e.message);process.exit(1)})
" 2>&1
echo ""

# 2. 기사 + 수집로그 삭제
echo "[2/4] 기사 및 수집 로그 삭제..."
npx tsx -e "
const{PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
  const del1=await p.collectionLog.deleteMany({});
  console.log('수집 로그 삭제:',del1.count,'건');
  const del2=await p.article.deleteMany({});
  console.log('기사 삭제:',del2.count,'건');
  process.exit(0);
})().catch(e=>{console.log('삭제 에러:',e.message);process.exit(1)})
" 2>&1
echo ""

# 3. PM2 재시작 (새 환경변수 적용)
echo "[3/4] PM2 재시작..."
pm2 restart livenews --update-env 2>/dev/null || true
echo ""

# 4. 즉시 재수집 (본문 스크래핑 + AI 번역 포함)
echo "[4/4] 새로 수집 시작 (본문 스크래핑 + 번역 포함)..."
echo "  RSS 수집 → 원문 스크래핑 → AI 번역 → DB 저장"
echo "  소요 시간: 약 10-30분"
echo ""

nohup npx tsx src/workers/collector.ts > /tmp/collector.log 2>&1 &
COLLECTOR_PID=$!
echo "  수집 프로세스 PID: $COLLECTOR_PID"
echo ""

# 진행 상황 모니터링 (60초)
echo "  진행 상황 (60초 대기)..."
for i in $(seq 1 6); do
    sleep 10
    ARTICLE_COUNT=$(npx tsx -e "const{PrismaClient}=require('@prisma/client');new PrismaClient().article.count().then(c=>{console.log(c);process.exit(0)}).catch(()=>{console.log(0);process.exit(0)})" 2>/dev/null)
    LAST_LOG=$(tail -1 /tmp/collector.log 2>/dev/null || echo "")
    echo "  [${i}0초] 기사: ${ARTICLE_COUNT}건 | ${LAST_LOG}"
done
echo ""

# 최종 상태
echo "=============================="
echo "  결과"
echo "=============================="
FINAL_COUNT=$(npx tsx -e "const{PrismaClient}=require('@prisma/client');new PrismaClient().article.count().then(c=>{console.log(c);process.exit(0)}).catch(()=>{console.log(0);process.exit(0)})" 2>/dev/null)
echo "  수집된 기사: ${FINAL_COUNT}건"
echo ""
echo "  수집 로그: tail -f /tmp/collector.log"
echo "  수집 완료 후 브라우저에서 확인: http://211.198.54.207/livenews/"
echo ""
echo "  수집이 계속 진행 중입니다."
echo "  전체 완료까지 약 10-30분 소요됩니다."
