#!/bin/bash
# ============================================================
# Hydro Marketing Platform - 서버 배포 스크립트
# 사용법: bash deploy.sh
#
# 사전 조건:
#   - Node.js 18+ 설치
#   - Docker 설치 (PostgreSQL용)
#   - PM2 설치 (npm install -g pm2)
#   - 서버에서 /home/ubuntu/hydro 경로에 코드 clone 완료
# ============================================================

set -e

# === 설정 ===
APP_NAME="hydro-marketing"
APP_PORT=3200
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_PATH="/hydro"
DB_USER="hydro"
DB_PASS="hydro_prod_2024"
DB_NAME="hydro_marketing"
DB_PORT=5432

echo "============================================"
echo "  Hydro Marketing Platform 배포"
echo "============================================"
echo ""
echo "앱 디렉토리: ${APP_DIR}"
echo "포트: ${APP_PORT}"
echo "basePath: ${BASE_PATH}"
echo ""

# ============================================================
# 1. 기존 서비스 상태 확인 (안전 검증)
# ============================================================
echo "[1/9] 기존 서비스 상태 확인..."
SERVICES_OK=true
for path in contact matching hacker agentmarket fundmanager gonak jobworld; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://172.30.1.99/$path/ 2>/dev/null || echo "000")
  if [ "$code" = "000" ]; then
    echo "  ⚠️  $path → 응답 없음 (서버 내부 접근 불가할 수 있음, 계속 진행)"
  else
    echo "  ✅ $path → $code"
  fi
done
echo ""

# ============================================================
# 2. 포트 충돌 확인
# ============================================================
echo "[2/9] 포트 ${APP_PORT} 사용 가능 여부 확인..."
if command -v lsof &> /dev/null && lsof -i:${APP_PORT} > /dev/null 2>&1; then
  echo "  ⚠️  포트 ${APP_PORT}이 사용 중입니다. 기존 프로세스를 중지합니다..."
  pm2 delete ${APP_NAME} 2>/dev/null || true
  sleep 2
fi
echo "  ✅ 포트 ${APP_PORT} 준비 완료"
echo ""

# ============================================================
# 3. PostgreSQL 확인/시작
# ============================================================
echo "[3/9] PostgreSQL 확인..."
if ! docker ps 2>/dev/null | grep -q hydro-postgres; then
  echo "  Docker PostgreSQL 시작 중..."
  cd ${APP_DIR}
  docker-compose up -d
  echo "  PostgreSQL 시작 대기 (5초)..."
  sleep 5
fi

# PostgreSQL 접속 테스트
if docker exec hydro-postgres pg_isready -U ${DB_USER} > /dev/null 2>&1; then
  echo "  ✅ PostgreSQL 실행 중 (포트 ${DB_PORT})"
else
  echo "  ❌ PostgreSQL 연결 실패!"
  echo "  수동으로 확인하세요: docker-compose up -d"
  exit 1
fi
echo ""

# ============================================================
# 4. 환경변수 설정
# ============================================================
echo "[4/9] 환경변수 설정..."
cd ${APP_DIR}

cat > .env << ENVEOF
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}?schema=public"
NODE_ENV=production
PORT=${APP_PORT}
BASE_PATH=${BASE_PATH}
ENVEOF

echo "  ✅ .env 파일 생성 완료"
echo ""

# ============================================================
# 5. 의존성 설치
# ============================================================
echo "[5/9] 의존성 설치..."
cd ${APP_DIR}
npm ci --production=false 2>&1 | tail -3
echo "  ✅ 의존성 설치 완료"
echo ""

# ============================================================
# 6. Prisma 클라이언트 생성 + DB 마이그레이션
# ============================================================
echo "[6/9] 데이터베이스 설정..."
cd ${APP_DIR}
npx prisma generate 2>&1 | tail -1
npx prisma db push 2>&1 | tail -1
echo "  ✅ 스키마 적용 완료"

# 시드 데이터 (첫 배포 시에만)
echo "  시드 데이터 확인..."
SEED_CHECK=$(docker exec hydro-postgres psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM \"Channel\";" 2>/dev/null || echo "0")
SEED_COUNT=$(echo ${SEED_CHECK} | tr -d ' ')
if [ "${SEED_COUNT}" = "0" ] || [ -z "${SEED_COUNT}" ]; then
  echo "  시드 데이터 로딩..."
  npx prisma db seed 2>&1 | tail -1
  echo "  ✅ 시드 데이터 완료"
else
  echo "  ✅ 시드 데이터 이미 존재 (${SEED_COUNT}개 채널)"
fi
echo ""

# ============================================================
# 7. Next.js 프로덕션 빌드
# ============================================================
echo "[7/9] Next.js 빌드..."
cd ${APP_DIR}
npm run build 2>&1 | tail -5
echo "  ✅ 빌드 완료"
echo ""

# ============================================================
# 8. PM2로 앱 실행
# ============================================================
echo "[8/9] PM2로 앱 시작..."
cd ${APP_DIR}

# 기존 프로세스 정리
pm2 delete ${APP_NAME} 2>/dev/null || true

# PM2 ecosystem 파일 생성
cat > ecosystem.config.js << PMEOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: 'node_modules/.bin/next',
    args: 'start -p ${APP_PORT}',
    cwd: '${APP_DIR}',
    env: {
      NODE_ENV: 'production',
      PORT: ${APP_PORT},
      BASE_PATH: '${BASE_PATH}',
      DATABASE_URL: 'postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}?schema=public',
    },
    max_memory_restart: '512M',
    instances: 1,
    autorestart: true,
  }],
}
PMEOF

pm2 start ecosystem.config.js
pm2 save

echo "  ✅ PM2 프로세스 시작 완료"
echo ""

# ============================================================
# 9. 헬스 체크
# ============================================================
echo "[9/9] 헬스 체크..."
sleep 3

RETRY=0
MAX_RETRY=5
while [ $RETRY -lt $MAX_RETRY ]; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:${APP_PORT}${BASE_PATH}/ 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    echo "  ✅ 앱 정상 작동 (HTTP ${HTTP_CODE})"
    break
  fi
  RETRY=$((RETRY + 1))
  if [ $RETRY -lt $MAX_RETRY ]; then
    echo "  ⏳ 대기 중... (${RETRY}/${MAX_RETRY})"
    sleep 3
  fi
done

if [ $RETRY -eq $MAX_RETRY ]; then
  echo "  ⚠️  앱 응답 대기 시간 초과 (HTTP ${HTTP_CODE})"
  echo "  PM2 로그 확인: pm2 logs ${APP_NAME}"
fi

echo ""
echo "============================================"
echo "  배포 완료!"
echo "============================================"
echo ""
echo "  직접 접속:  http://172.30.1.99:${APP_PORT}${BASE_PATH}/"
echo ""
echo "  PM2 상태:   pm2 status"
echo "  PM2 로그:   pm2 logs ${APP_NAME}"
echo "  PM2 재시작: pm2 restart ${APP_NAME}"
echo ""
echo "  ⚠️  Nginx 리버스 프록시 설정이 필요합니다:"
echo "     sudo bash setup-nginx.sh"
echo ""

# 기존 서비스 재확인
echo "=== 기존 서비스 상태 재확인 ==="
for path in contact matching hacker agentmarket fundmanager gonak jobworld; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://172.30.1.99/$path/ 2>/dev/null || echo "000")
  echo "  $path → $code"
done
echo ""
