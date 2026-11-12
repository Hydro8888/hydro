#!/bin/bash

# ====================================================
# LiveNews DB 설정 + 뉴스 수집 시작 스크립트
# 서버에서 실행: bash setup-db-and-collect.sh
# ====================================================

echo "=============================="
echo "  LiveNews DB + 뉴스 수집 설정"
echo "=============================="
echo ""

DEPLOY_PATH="/home/ubuntu/livenews"
cd "$DEPLOY_PATH" || { echo "디렉토리 없음: $DEPLOY_PATH"; exit 1; }

# NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# ---- 1. PostgreSQL 연결 확인 ----
echo "[1/6] PostgreSQL 연결 확인..."

# Docker에서 실행 중인 PostgreSQL 찾기
echo "  Docker PostgreSQL 컨테이너:"
docker ps --format '  {{.Names}}: {{.Ports}}' 2>/dev/null | grep -i postgres || echo "  (없음)"
echo ""

# 가능한 PostgreSQL 연결 테스트
PG_FOUND=0
for HOST_PORT in "172.17.0.1:5432" "127.0.0.1:5432" "172.17.0.1:5433" "127.0.0.1:5433" "172.18.0.1:5432"; do
    HOST=$(echo $HOST_PORT | cut -d: -f1)
    PORT=$(echo $HOST_PORT | cut -d: -f2)
    if pg_isready -h "$HOST" -p "$PORT" -U postgres 2>/dev/null | grep -q "accepting"; then
        echo "  OK: PostgreSQL 접속 가능 - $HOST_PORT"
        PG_HOST="$HOST"
        PG_PORT="$PORT"
        PG_FOUND=1
        break
    fi
done

# Docker 내부 PostgreSQL 포트 매핑 확인
if [ "$PG_FOUND" = "0" ]; then
    MAPPED_PORT=$(docker ps --format '{{.Ports}}' 2>/dev/null | grep -oP '\d+(?=->5432)' | head -1)
    if [ -n "$MAPPED_PORT" ]; then
        echo "  Docker PostgreSQL 매핑 포트: $MAPPED_PORT"
        if pg_isready -h 127.0.0.1 -p "$MAPPED_PORT" -U postgres 2>/dev/null | grep -q "accepting"; then
            PG_HOST="127.0.0.1"
            PG_PORT="$MAPPED_PORT"
            PG_FOUND=1
            echo "  OK: PostgreSQL 접속 가능 - 127.0.0.1:$MAPPED_PORT"
        fi
    fi
fi

# Docker 네트워크에서 직접 접속 시도
if [ "$PG_FOUND" = "0" ]; then
    PG_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i postgres | head -1)
    if [ -n "$PG_CONTAINER" ]; then
        PG_IP=$(docker inspect "$PG_CONTAINER" --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)
        if [ -n "$PG_IP" ]; then
            echo "  Docker PostgreSQL IP: $PG_IP"
            if pg_isready -h "$PG_IP" -p 5432 -U postgres 2>/dev/null | grep -q "accepting"; then
                PG_HOST="$PG_IP"
                PG_PORT="5432"
                PG_FOUND=1
                echo "  OK: PostgreSQL 접속 가능 - $PG_IP:5432"
            fi
        fi
    fi
fi

if [ "$PG_FOUND" = "0" ]; then
    echo ""
    echo "  PostgreSQL을 찾을 수 없습니다!"
    echo "  Docker에 PostgreSQL이 있는지 확인:"
    echo "    docker ps | grep postgres"
    echo "  또는 직접 설치:"
    echo "    sudo apt install -y postgresql"
    echo "    sudo -u postgres createdb livenews"
    echo ""
    echo "  .env 파일을 수동으로 수정한 후 이 스크립트를 다시 실행하세요."
    echo "  vi $DEPLOY_PATH/.env"
    exit 1
fi

# ---- 2. .env 업데이트 ----
echo ""
echo "[2/6] .env 업데이트..."
DB_URL="postgresql://postgres:postgres@${PG_HOST}:${PG_PORT}/livenews?schema=public"

# Redis 포트 확인
REDIS_PORT="6379"
REDIS_MAPPED=$(docker ps --format '{{.Ports}}' 2>/dev/null | grep -oP '\d+(?=->6379)' | head -1)
[ -n "$REDIS_MAPPED" ] && REDIS_PORT="$REDIS_MAPPED"
REDIS_URL="redis://127.0.0.1:${REDIS_PORT}"

# .env 파일 생성/업데이트
cat > "$DEPLOY_PATH/.env" << ENVEOF
DATABASE_URL="${DB_URL}"
REDIS_URL="${REDIS_URL}"
XAI_API_KEY="YOUR_XAI_API_KEY_HERE"
XAI_MODEL="grok-4-1-fast"
NEXT_PUBLIC_BASE_URL="http://211.198.54.207/livenews"
NEXT_PUBLIC_APP_NAME="LiveNews"
APP_PORT=4000
NODE_ENV=production
ENVEOF

echo "  DATABASE_URL=$DB_URL"
echo "  REDIS_URL=$REDIS_URL"
echo "  OK"
echo ""

# ---- 3. DB 생성 ----
echo "[3/6] livenews 데이터베이스 생성..."
PG_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i postgres | head -1)
if [ -n "$PG_CONTAINER" ]; then
    docker exec -i "$PG_CONTAINER" psql -U postgres -c "CREATE DATABASE livenews;" 2>/dev/null && echo "  DB 생성 완료" || echo "  DB 이미 존재"
else
    createdb -h "$PG_HOST" -p "$PG_PORT" -U postgres livenews 2>/dev/null && echo "  DB 생성 완료" || echo "  DB 이미 존재"
fi
echo ""

# ---- 4. Prisma 마이그레이션 + 시드 ----
echo "[4/6] Prisma 마이그레이션 + 시드..."
npx prisma generate 2>&1 | tail -2
npx prisma db push --accept-data-loss 2>&1 | tail -3
echo ""

echo "  소스 데이터 시딩 (30개 뉴스 소스)..."
npx tsx prisma/seed.ts 2>&1 | tail -3
echo ""

# ---- 5. 연결 테스트 ----
echo "[5/6] DB 연결 테스트..."
npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.source.count().then(c => {
  console.log('  소스 수: ' + c);
  return p.article.count();
}).then(c => {
  console.log('  기사 수: ' + c);
  process.exit(0);
}).catch(e => {
  console.error('  DB 연결 실패:', e.message);
  process.exit(1);
});
" 2>&1
echo ""

# ---- 6. 즉시 뉴스 수집 실행 ----
echo "[6/6] 뉴스 수집 즉시 실행..."
echo "  (RSS 수집 + AI 번역/분류 - 몇 분 걸릴 수 있습니다)"
echo ""

# collector를 직접 실행 (백그라운드로)
npx tsx src/workers/collector.ts 2>&1 &
COLLECTOR_PID=$!

echo "  수집 프로세스 시작 (PID: $COLLECTOR_PID)"
echo "  진행 상황은 다음으로 확인:"
echo "    tail -f /home/ubuntu/.pm2/logs/livenews-collector-out*.log"
echo ""

# 30초 대기 후 중간 결과 확인
echo "  30초 대기 후 결과 확인..."
sleep 30

ARTICLE_COUNT=$(npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.article.count().then(c => { console.log(c); process.exit(0); }).catch(() => { console.log(0); process.exit(0); });
" 2>/dev/null)

echo ""
echo "=============================="
echo "  결과"
echo "=============================="
echo "  현재 수집된 기사 수: $ARTICLE_COUNT"
echo ""

if [ "$ARTICLE_COUNT" -gt "0" ] 2>/dev/null; then
    echo "  뉴스 수집 성공!"
    echo "  PM2 재시작으로 새 기사 표시..."
    pm2 restart livenews 2>/dev/null
    echo ""
    echo "  http://211.198.54.207/livenews/ 에서 확인하세요!"
else
    echo "  아직 수집 중... (RSS 피드 파싱에 시간이 걸립니다)"
    echo "  수집 완료 후 PM2를 재시작하세요:"
    echo "    pm2 restart livenews"
    echo ""
    echo "  수집 로그 확인:"
    echo "    pm2 logs livenews-collector --lines 30"
fi

echo ""
echo "  4시간마다 자동 수집이 실행됩니다."
echo "  수동 수집: npx tsx src/workers/collector.ts"
echo "  PM2 상태: pm2 status"
