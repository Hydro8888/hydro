#!/bin/bash
# ============================================================
# YeouAlba.com 배포 스크립트
# 서버: Ubuntu (211.198.54.207), SSH 포트 2222
# 배포 경로: /home/ubuntu/yeoualba
# 접속 URL: http://211.198.54.207/yeoualba/
# ============================================================
# 사용법:
#   bash deploy.sh          # 전체 배포 (최초 설치 포함)
#   bash deploy.sh update   # 코드만 업데이트 (재빌드+재시작)
# ============================================================

set -e

SERVER="ubuntu@211.198.54.207"
SSH_PORT=2222
DEPLOY_DIR="/home/ubuntu/yeoualba"
REPO="git@github.com:Hydro8888/hydro.git"
BRANCH="claude/yeoualba-platform-dev-fwj8u"

MODE="${1:-full}"

echo "============================================"
echo "  YeouAlba.com 배포 시작 (모드: $MODE)"
echo "  서버: $SERVER:$SSH_PORT"
echo "  경로: $DEPLOY_DIR"
echo "============================================"

ssh -p $SSH_PORT $SERVER << ENDSSH
set -e

echo ""
echo "===== [1/9] 포트 충돌 검사 ====="
CONFLICT=0
for port in 3004 5001; do
  if ss -tlnp 2>/dev/null | grep -q ":\${port} "; then
    # PM2에서 이미 yeoualba 프로세스가 사용 중인지 확인
    if pm2 list 2>/dev/null | grep -q "yeoualba"; then
      echo "포트 \${port}: yeoualba 프로세스 사용 중 (업데이트 모드 가능)"
    else
      echo "ERROR: 포트 \${port} 이 다른 서비스에서 사용 중!"
      CONFLICT=1
    fi
  else
    echo "포트 \${port}: 사용 가능"
  fi
done
if [ "\$CONFLICT" -eq 1 ] && [ "$MODE" = "full" ]; then
  echo "포트 충돌! 배포를 중단합니다."
  exit 1
fi

echo ""
echo "===== [2/9] 저장소 클론/업데이트 ====="
if [ -d "$DEPLOY_DIR" ]; then
  echo "기존 디렉토리 발견, git pull 실행..."
  cd $DEPLOY_DIR
  git fetch origin
  git checkout $BRANCH
  git pull origin $BRANCH
else
  echo "최초 클론 실행..."
  cd /home/ubuntu
  git clone $REPO yeoualba
  cd $DEPLOY_DIR
  git checkout $BRANCH
fi
echo "현재 커밋: \$(git log --oneline -1)"

echo ""
echo "===== [3/9] Backend 의존성 설치 ====="
cd $DEPLOY_DIR/backend
npm ci --production=false
echo "Prisma client 생성..."
npx prisma generate

echo ""
echo "===== [4/9] Backend 빌드 (TypeScript) ====="
npm run build
echo "Backend 빌드 완료: dist/index.js"

echo ""
echo "===== [5/9] Frontend 의존성 설치 ====="
cd $DEPLOY_DIR/frontend
npm ci --production=false

echo ""
echo "===== [6/9] Frontend 빌드 (Next.js standalone) ====="
NEXT_PUBLIC_BASE_PATH=/yeoualba \\
NEXT_PUBLIC_API_URL=http://211.198.54.207/yeoualba/api \\
NEXT_PUBLIC_SITE_NAME=YeouAlba \\
npm run build

# standalone 디렉토리 준비
echo "standalone 빌드 구성 중..."
if [ -d "$DEPLOY_DIR/frontend/.next/standalone" ]; then
  # static 파일과 public 폴더를 standalone에 복사
  cp -r $DEPLOY_DIR/frontend/.next/static $DEPLOY_DIR/frontend/.next/standalone/.next/static
  cp -r $DEPLOY_DIR/frontend/public $DEPLOY_DIR/frontend/.next/standalone/public
  # PM2가 standalone/server.js를 실행하도록 심볼릭 링크
  ln -sf $DEPLOY_DIR/frontend/.next/standalone/server.js $DEPLOY_DIR/frontend/server.js
  echo "Frontend standalone 빌드 완료"
else
  echo "WARNING: standalone 디렉토리가 없습니다. next start로 대체합니다."
fi

if [ "$MODE" = "full" ]; then
  echo ""
  echo "===== [7/9] PostgreSQL 데이터베이스 설정 ====="
  # Docker PostgreSQL 컨테이너 찾기
  PG_CONTAINER=\$(docker ps --format '{{.Names}}' | grep -i postgres | head -1)
  if [ -z "\$PG_CONTAINER" ]; then
    echo "WARNING: PostgreSQL Docker 컨테이너를 찾을 수 없습니다."
    echo "수동으로 데이터베이스를 생성해주세요."
  else
    echo "PostgreSQL 컨테이너: \$PG_CONTAINER"
    # 데이터베이스 존재 여부 확인 및 생성
    docker exec \$PG_CONTAINER psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='yeoualba'" | grep -q 1 || \
    docker exec \$PG_CONTAINER psql -U postgres -c "CREATE DATABASE yeoualba;"
    # 사용자 생성 (이미 존재하면 무시)
    docker exec \$PG_CONTAINER psql -U postgres -c "CREATE USER yeoualba WITH PASSWORD 'yeoualba_prod_2026';" 2>/dev/null || echo "유저 이미 존재"
    docker exec \$PG_CONTAINER psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE yeoualba TO yeoualba;"
    docker exec \$PG_CONTAINER psql -U postgres -c "ALTER DATABASE yeoualba OWNER TO yeoualba;" 2>/dev/null || true
    echo "데이터베이스 'yeoualba' 준비 완료"
  fi

  echo ""
  echo "===== [7.5/9] Prisma 스키마 적용 ====="
  cd $DEPLOY_DIR/backend
  DATABASE_URL="postgresql://yeoualba:yeoualba_prod_2026@localhost:5432/yeoualba" npx prisma db push --accept-data-loss
  echo "Prisma 스키마 적용 완료"

  echo ""
  echo "===== [8/9] iptables 방화벽 규칙 ====="
  # Docker 네트워크 → 호스트 포트 허용 (DOCKER-USER 체인)
  for PORT in 3004 5001; do
    for SUBNET in 172.17.0.0/16 172.18.0.0/16; do
      sudo iptables -C DOCKER-USER -s \$SUBNET -p tcp --dport \$PORT -j ACCEPT 2>/dev/null || \
      sudo iptables -I DOCKER-USER -s \$SUBNET -p tcp --dport \$PORT -j ACCEPT
    done
  done
  echo "iptables 규칙 추가 완료 (3004, 5001 for Docker subnets)"
  echo ""
  echo "⚠️  iptables는 재부팅 시 초기화됩니다. UFW로 영구 설정하세요:"
  echo "  sudo ufw allow from 172.17.0.0/16 to any port 3004"
  echo "  sudo ufw allow from 172.18.0.0/16 to any port 3004"
  echo "  sudo ufw allow from 172.17.0.0/16 to any port 5001"
  echo "  sudo ufw allow from 172.18.0.0/16 to any port 5001"
else
  echo ""
  echo "===== [7-8/9] 스킵 (update 모드) ====="
fi

echo ""
echo "===== [9/9] PM2 프로세스 시작/재시작 ====="
cd $DEPLOY_DIR
# 기존 프로세스 정리
pm2 delete yeoualba-frontend 2>/dev/null || true
pm2 delete yeoualba-backend 2>/dev/null || true
# ecosystem.config.js로 시작
pm2 start ecosystem.config.js
pm2 save
echo ""
pm2 list | grep yeoualba

echo ""
echo "============================================"
echo "  배포 완료!"
echo "============================================"
echo ""
echo "  Frontend (PM2): http://localhost:3004/yeoualba/"
echo "  Backend  (PM2): http://localhost:5001/api/health"
echo ""
echo "  ⚠️  Docker nginx 설정이 필요합니다!"
echo "  아래 명령으로 nginx 설정을 추가하세요:"
echo ""
echo "  1. 현재 nginx 설정 확인:"
echo "     docker exec jobworld-nginx cat /etc/nginx/conf.d/default.conf"
echo ""
echo "  2. nginx-yeoualba.conf 내용을 default.conf에 추가 후:"
echo "     docker cp /tmp/updated-default.conf jobworld-nginx:/etc/nginx/conf.d/default.conf"
echo "     docker exec jobworld-nginx nginx -t"
echo "     docker exec jobworld-nginx nginx -s reload"
echo ""
echo "  3. 최종 확인:"
echo "     curl http://211.198.54.207/yeoualba/"
echo "     curl http://211.198.54.207/yeoualba/api/health"
echo "============================================"
ENDSSH
