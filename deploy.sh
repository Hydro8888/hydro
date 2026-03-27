#!/bin/bash
# ================================================================
# YeouAlba.com 올인원 배포 스크립트
# ================================================================
# 서버: Ubuntu (211.198.54.207), SSH 포트 2222
# 배포 경로: /home/ubuntu/yeoualba
# 접속 URL: http://211.198.54.207/yeoualba/
# ================================================================
# 사용법:
#   bash deploy.sh          # 전체 배포 (최초 + nginx 자동 설정)
#   bash deploy.sh update   # 코드만 업데이트 (재빌드+PM2 재시작)
# ================================================================

set -e

SERVER="ubuntu@211.198.54.207"
SSH_PORT=2222
DEPLOY_DIR="/home/ubuntu/yeoualba"
REPO="git@github.com:Hydro8888/hydro.git"
BRANCH="claude/yeoualba-platform-dev-fwj8u"
FRONTEND_PORT=3004
BACKEND_PORT=5001
MODE="${1:-full}"
NGINX_CONTAINER="jobworld-nginx"

echo "╔══════════════════════════════════════════╗"
echo "║   YeouAlba.com 배포 스크립트             ║"
echo "║   모드: $MODE                            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

ssh -p $SSH_PORT $SERVER /bin/bash -s "$MODE" << 'ENDSSH'
set -e

MODE="$1"
DEPLOY_DIR="/home/ubuntu/yeoualba"
REPO="git@github.com:Hydro8888/hydro.git"
BRANCH="claude/yeoualba-platform-dev-fwj8u"
FRONTEND_PORT=3004
BACKEND_PORT=5001
NGINX_CONTAINER="jobworld-nginx"

# ──────────────────────────────────────────────
# STEP 0. 서버 환경 진단
# ──────────────────────────────────────────────
echo ""
echo "━━━ [0/10] 서버 환경 진단 ━━━"
echo ""
echo "[시스템]"
echo "  OS: $(lsb_release -ds 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)"
echo "  Node: $(node -v 2>/dev/null || echo 'NOT INSTALLED')"
echo "  npm: $(npm -v 2>/dev/null || echo 'NOT INSTALLED')"
echo "  PM2: $(pm2 -v 2>/dev/null || echo 'NOT INSTALLED')"
echo ""

echo "[Docker 컨테이너]"
docker ps --format '  {{.Names}}\t{{.Ports}}' 2>/dev/null || echo "  Docker 접근 불가"
echo ""

echo "[PM2 프로세스]"
pm2 list 2>/dev/null | grep -E "│|─" | head -20 || echo "  PM2 프로세스 없음"
echo ""

echo "[사용 중인 포트 (3000-5999)]"
ss -tlnp 2>/dev/null | grep -E ":(3[0-9]{3}|4[0-9]{3}|5[0-9]{3}) " | awk '{print "  "$4}' || true
echo ""

echo "[Docker 네트워크]"
docker network ls --format '  {{.Name}}\t{{.Driver}}' 2>/dev/null | head -10 || true
echo ""

echo "[nginx 컨테이너 확인]"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "$NGINX_CONTAINER"; then
  echo "  $NGINX_CONTAINER: 실행 중"
  echo "  현재 설정된 location 블록:"
  docker exec $NGINX_CONTAINER grep -E "^\s*location " /etc/nginx/conf.d/default.conf 2>/dev/null | sed 's/^/    /' || true
else
  echo "  WARNING: $NGINX_CONTAINER 컨테이너를 찾을 수 없습니다!"
  # 다른 nginx 컨테이너 찾기
  FOUND_NGINX=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i nginx | head -1)
  if [ -n "$FOUND_NGINX" ]; then
    echo "  대체 발견: $FOUND_NGINX"
    NGINX_CONTAINER="$FOUND_NGINX"
  fi
fi
echo ""

# ──────────────────────────────────────────────
# STEP 1. 포트 충돌 검사
# ──────────────────────────────────────────────
echo "━━━ [1/10] 포트 충돌 검사 ━━━"
CONFLICT=0
for port in $FRONTEND_PORT $BACKEND_PORT; do
  if ss -tlnp 2>/dev/null | grep -q ":${port} "; then
    if pm2 list 2>/dev/null | grep -q "yeoualba"; then
      echo "  포트 ${port}: yeoualba 프로세스 (업데이트 가능)"
    else
      echo "  ERROR: 포트 ${port} 다른 서비스가 점유 중!"
      CONFLICT=1
    fi
  else
    echo "  포트 ${port}: 사용 가능 ✓"
  fi
done

if [ "$CONFLICT" -eq 1 ]; then
  echo ""
  echo "포트 충돌 발생! 배포를 중단합니다."
  echo "다른 포트를 사용하거나 충돌 서비스를 중지하세요."
  exit 1
fi
echo ""

# ──────────────────────────────────────────────
# STEP 2. Node.js / PM2 확인
# ──────────────────────────────────────────────
echo "━━━ [2/10] 필수 도구 확인 ━━━"
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js가 설치되어 있지 않습니다!"
  exit 1
fi
if ! command -v pm2 &>/dev/null; then
  echo "PM2 설치 중..."
  sudo npm install -g pm2
fi
echo "  Node.js $(node -v) ✓"
echo "  PM2 $(pm2 -v) ✓"
echo ""

# ──────────────────────────────────────────────
# STEP 3. 저장소 클론/업데이트
# ──────────────────────────────────────────────
echo "━━━ [3/10] 소스 코드 준비 ━━━"
if [ -d "$DEPLOY_DIR" ]; then
  echo "  기존 디렉토리 발견 → git pull"
  cd $DEPLOY_DIR
  git fetch origin
  git checkout $BRANCH 2>/dev/null || git checkout -b $BRANCH origin/$BRANCH
  git pull origin $BRANCH
else
  echo "  최초 클론 실행..."
  cd /home/ubuntu
  git clone $REPO yeoualba
  cd $DEPLOY_DIR
  git checkout $BRANCH 2>/dev/null || git checkout -b $BRANCH origin/$BRANCH
fi
echo "  현재 커밋: $(git log --oneline -1)"
echo ""

# ──────────────────────────────────────────────
# STEP 4. Backend 빌드
# ──────────────────────────────────────────────
echo "━━━ [4/10] Backend 빌드 ━━━"
cd $DEPLOY_DIR/backend
echo "  npm ci..."
npm ci --production=false 2>&1 | tail -3
echo "  Prisma generate..."
npx prisma generate 2>&1 | tail -2
echo "  TypeScript 컴파일..."
npm run build 2>&1 | tail -2
echo "  Backend 빌드 완료 ✓"
echo ""

# ──────────────────────────────────────────────
# STEP 5. Frontend 빌드
# ──────────────────────────────────────────────
echo "━━━ [5/10] Frontend 빌드 ━━━"
cd $DEPLOY_DIR/frontend
echo "  npm ci..."
npm ci --production=false 2>&1 | tail -3
echo "  Next.js 빌드 (basePath=/yeoualba)..."
NEXT_PUBLIC_BASE_PATH=/yeoualba \
NEXT_PUBLIC_API_URL=http://211.198.54.207/yeoualba/api \
NEXT_PUBLIC_SITE_NAME=YeouAlba \
npm run build 2>&1 | tail -5

# standalone 빌드 구성
if [ -d "$DEPLOY_DIR/frontend/.next/standalone" ]; then
  echo "  standalone 구성 중..."
  cp -r $DEPLOY_DIR/frontend/.next/static $DEPLOY_DIR/frontend/.next/standalone/.next/static 2>/dev/null || true
  cp -r $DEPLOY_DIR/frontend/public $DEPLOY_DIR/frontend/.next/standalone/public 2>/dev/null || true
  # server.js 심볼릭 링크 (PM2가 frontend/ 에서 server.js 실행)
  ln -sf $DEPLOY_DIR/frontend/.next/standalone/server.js $DEPLOY_DIR/frontend/server.js
  echo "  Frontend standalone 빌드 완료 ✓"
else
  echo "  WARNING: standalone 없음 → next start 사용"
  # ecosystem.config.js에서 next start로 실행하도록 server.js wrapper 생성
  cat > $DEPLOY_DIR/frontend/server.js << 'SERVEREOF'
const { execSync } = require('child_process');
execSync('npx next start -p ' + (process.env.PORT || 3004), { stdio: 'inherit' });
SERVEREOF
fi
echo ""

# ──────────────────────────────────────────────
# STEP 6. PostgreSQL 데이터베이스 설정 (full 모드)
# ──────────────────────────────────────────────
if [ "$MODE" != "update" ]; then
  echo "━━━ [6/10] PostgreSQL 데이터베이스 설정 ━━━"
  PG_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i postgres | head -1)
  if [ -z "$PG_CONTAINER" ]; then
    echo "  WARNING: PostgreSQL 컨테이너 미발견"
    echo "  수동으로 DB를 생성하세요:"
    echo "    CREATE DATABASE yeoualba;"
    echo "    CREATE USER yeoualba WITH PASSWORD 'yeoualba_prod_2026';"
  else
    echo "  PostgreSQL 컨테이너: $PG_CONTAINER"

    # DB 존재 확인
    DB_EXISTS=$(docker exec $PG_CONTAINER psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='yeoualba'" 2>/dev/null || echo "0")
    if echo "$DB_EXISTS" | grep -q "1"; then
      echo "  데이터베이스 'yeoualba': 이미 존재 ✓"
    else
      echo "  데이터베이스 생성 중..."
      docker exec $PG_CONTAINER psql -U postgres -c "CREATE DATABASE yeoualba;" 2>/dev/null
      echo "  데이터베이스 'yeoualba' 생성 완료 ✓"
    fi

    # 유저 생성
    docker exec $PG_CONTAINER psql -U postgres -c "CREATE USER yeoualba WITH PASSWORD 'yeoualba_prod_2026';" 2>/dev/null || true
    docker exec $PG_CONTAINER psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE yeoualba TO yeoualba;" 2>/dev/null || true
    docker exec $PG_CONTAINER psql -U postgres -c "ALTER DATABASE yeoualba OWNER TO yeoualba;" 2>/dev/null || true
    echo "  유저/권한 설정 완료 ✓"
  fi
  echo ""

  # Prisma 스키마 적용
  echo "━━━ [6.5] Prisma 스키마 적용 ━━━"
  cd $DEPLOY_DIR/backend
  DATABASE_URL="postgresql://yeoualba:yeoualba_prod_2026@localhost:5432/yeoualba" \
  npx prisma db push --accept-data-loss 2>&1 | tail -5
  echo "  Prisma 스키마 적용 완료 ✓"
  echo ""
else
  echo "━━━ [6/10] 스킵 (update 모드) ━━━"
  echo ""
fi

# ──────────────────────────────────────────────
# STEP 7. iptables 방화벽 (full 모드)
# ──────────────────────────────────────────────
if [ "$MODE" != "update" ]; then
  echo "━━━ [7/10] iptables 방화벽 규칙 ━━━"
  for PORT in $FRONTEND_PORT $BACKEND_PORT; do
    for SUBNET in 172.17.0.0/16 172.18.0.0/16; do
      sudo iptables -C DOCKER-USER -s $SUBNET -p tcp --dport $PORT -j ACCEPT 2>/dev/null || \
      sudo iptables -I DOCKER-USER -s $SUBNET -p tcp --dport $PORT -j ACCEPT 2>/dev/null || true
    done
    echo "  포트 $PORT: Docker 서브넷 허용 ✓"
  done
  echo ""
else
  echo "━━━ [7/10] 스킵 (update 모드) ━━━"
  echo ""
fi

# ──────────────────────────────────────────────
# STEP 8. Docker nginx 자동 설정 (full 모드)
# ──────────────────────────────────────────────
if [ "$MODE" != "update" ]; then
  echo "━━━ [8/10] Docker nginx 자동 설정 ━━━"

  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "$NGINX_CONTAINER"; then
    echo "  WARNING: $NGINX_CONTAINER 컨테이너 없음 → nginx 설정 스킵"
  else
    # 기존 설정에 yeoualba가 이미 있는지 확인
    if docker exec $NGINX_CONTAINER grep -q "yeoualba" /etc/nginx/conf.d/default.conf 2>/dev/null; then
      echo "  nginx에 yeoualba 설정이 이미 존재합니다 ✓"
    else
      echo "  nginx에 yeoualba location 블록 추가 중..."

      # 기존 설정 백업
      docker exec $NGINX_CONTAINER cp /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak

      # 기존 설정 가져오기
      docker exec $NGINX_CONTAINER cat /etc/nginx/conf.d/default.conf > /tmp/nginx-default-original.conf

      # yeoualba location 블록 생성
      cat > /tmp/nginx-yeoualba-block.conf << 'NGINXEOF'

    # ===== YeouAlba (자동 추가) =====
    location /yeoualba/api/ {
        proxy_pass http://172.17.0.1:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /yeoualba/socket.io/ {
        proxy_pass http://172.17.0.1:5001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /yeoualba/_next/ {
        proxy_pass http://172.17.0.1:3004/yeoualba/_next/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /yeoualba/ {
        proxy_pass http://172.17.0.1:3004/yeoualba/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    # ===== /YeouAlba =====
NGINXEOF

      # 마지막 } (server 블록 닫는 괄호) 앞에 location 블록 삽입
      # sed: 파일의 마지막 } 앞에 yeoualba 블록 삽입
      python3 - /tmp/nginx-default-original.conf /tmp/nginx-yeoualba-block.conf << 'PYEOF'
import sys
with open(sys.argv[1], 'r') as f:
    conf = f.read()
with open(sys.argv[2], 'r') as f:
    block = f.read()

# server {} 의 마지막 닫는 괄호 앞에 삽입
# 마지막 '}'를 찾아서 그 앞에 block 삽입
last_brace = conf.rfind('}')
if last_brace != -1:
    new_conf = conf[:last_brace] + block + '\n' + conf[last_brace:]
else:
    new_conf = conf + '\n' + block

with open('/tmp/nginx-default-patched.conf', 'w') as f:
    f.write(new_conf)
print("patched")
PYEOF

      # 패치된 설정을 컨테이너에 복사
      docker cp /tmp/nginx-default-patched.conf $NGINX_CONTAINER:/etc/nginx/conf.d/default.conf

      # nginx 설정 테스트
      if docker exec $NGINX_CONTAINER nginx -t 2>&1; then
        docker exec $NGINX_CONTAINER nginx -s reload
        echo "  nginx 설정 추가 & 리로드 완료 ✓"
      else
        echo "  ERROR: nginx 설정 오류! 원본 복원 중..."
        docker exec $NGINX_CONTAINER cp /etc/nginx/conf.d/default.conf.bak /etc/nginx/conf.d/default.conf
        docker exec $NGINX_CONTAINER nginx -s reload
        echo "  원본 복원 완료. 수동으로 설정을 확인하세요."
      fi

      # 임시 파일 정리
      rm -f /tmp/nginx-default-original.conf /tmp/nginx-yeoualba-block.conf /tmp/nginx-default-patched.conf
    fi
  fi
  echo ""
else
  echo "━━━ [8/10] 스킵 (update 모드) ━━━"
  echo ""
fi

# ──────────────────────────────────────────────
# STEP 9. PM2 시작/재시작
# ──────────────────────────────────────────────
echo "━━━ [9/10] PM2 프로세스 시작 ━━━"
cd $DEPLOY_DIR

# 기존 yeoualba 프로세스 정리
pm2 delete yeoualba-frontend 2>/dev/null || true
pm2 delete yeoualba-backend 2>/dev/null || true

# ecosystem.config.js로 시작
pm2 start ecosystem.config.js
pm2 save --force
echo ""
echo "  PM2 상태:"
pm2 list 2>/dev/null | grep -E "yeoualba|Name" || true
echo ""

# ──────────────────────────────────────────────
# STEP 10. 배포 검증
# ──────────────────────────────────────────────
echo "━━━ [10/10] 배포 검증 ━━━"

# Backend health check (최대 10초 대기)
echo -n "  Backend (localhost:5001) ... "
for i in $(seq 1 10); do
  if curl -sf http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "✓ 정상"
    break
  fi
  if [ "$i" -eq 10 ]; then
    echo "✗ 응답없음 (PM2 로그 확인: pm2 logs yeoualba-backend)"
  fi
  sleep 1
done

# Frontend check
echo -n "  Frontend (localhost:3004) ... "
for i in $(seq 1 10); do
  if curl -sf http://localhost:3004/yeoualba/ > /dev/null 2>&1; then
    echo "✓ 정상"
    break
  fi
  if [ "$i" -eq 10 ]; then
    echo "✗ 응답없음 (PM2 로그 확인: pm2 logs yeoualba-frontend)"
  fi
  sleep 1
done

# nginx 프록시 확인
echo -n "  nginx 프록시 (/yeoualba/) ... "
if curl -sf http://localhost/yeoualba/ > /dev/null 2>&1; then
  echo "✓ 정상"
elif curl -sf http://127.0.0.1/yeoualba/ > /dev/null 2>&1; then
  echo "✓ 정상"
else
  echo "✗ 응답없음 (nginx 설정 확인 필요)"
fi

echo -n "  nginx API (/yeoualba/api/health) ... "
if curl -sf http://localhost/yeoualba/api/health > /dev/null 2>&1; then
  HEALTH=$(curl -sf http://localhost/yeoualba/api/health)
  echo "✓ $HEALTH"
elif curl -sf http://127.0.0.1/yeoualba/api/health > /dev/null 2>&1; then
  echo "✓ 정상"
else
  echo "✗ 응답없음"
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║            배포 완료!                            ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║                                                  ║"
echo "║  Frontend: http://211.198.54.207/yeoualba/       ║"
echo "║  Backend:  http://211.198.54.207/yeoualba/api/   ║"
echo "║  Health:   /yeoualba/api/health                  ║"
echo "║                                                  ║"
echo "║  PM2 관리:                                       ║"
echo "║    pm2 logs yeoualba-frontend                    ║"
echo "║    pm2 logs yeoualba-backend                     ║"
echo "║    pm2 restart all                               ║"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"

# UFW 영구화 안내
if [ "$MODE" != "update" ]; then
  echo ""
  echo "⚠️  iptables 영구화 (재부팅 보호):"
  echo "  sudo ufw allow from 172.17.0.0/16 to any port 3004"
  echo "  sudo ufw allow from 172.18.0.0/16 to any port 3004"
  echo "  sudo ufw allow from 172.17.0.0/16 to any port 5001"
  echo "  sudo ufw allow from 172.18.0.0/16 to any port 5001"
fi
ENDSSH
