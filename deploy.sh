#!/bin/bash
# ================================================================
# YeouAlba.com 서버 설치 스크립트
# ================================================================
# 서버에 SSH 접속 후 직접 실행하는 스크립트
#
# 사용법:
#   ssh -p 2222 ubuntu@211.198.54.207
#   cd /home/ubuntu
#   git clone git@github.com:Hydro8888/hydro.git yeoualba
#   cd yeoualba
#   git checkout claude/yeoualba-platform-dev-fwj8u
#   sudo bash deploy.sh          # 전체 설치
#   sudo bash deploy.sh update   # 코드 업데이트만
#
# 배포 결과:
#   http://211.198.54.207/yeoualba/        (프론트엔드)
#   http://211.198.54.207/yeoualba/api/    (백엔드 API)
#
# 기존 서비스 보호:
#   jobworld(Docker), hacker(:5000), lovechat(:3001), agentmarket(:3003)
# ================================================================

set -e

# ── 설정 ──
DEPLOY_DIR="/home/ubuntu/yeoualba"
REPO="git@github.com:Hydro8888/hydro.git"
BRANCH="claude/yeoualba-platform-dev-fwj8u"
FRONTEND_PORT=3004
BACKEND_PORT=5001
NGINX_CONTAINER="jobworld-nginx"
SERVER_IP="211.198.54.207"
MODE="${1:-full}"

# 기존 서비스 (충돌 방지용)
EXISTING_PORTS=(3000 3001 3002 3003 5000)
EXISTING_PATHS=("/home/ubuntu/hacker" "/home/ubuntu/lovechat" "/home/ubuntu/agentmarket")
EXISTING_NGINX=("/hacker" "/jobworld" "/lovechat" "/agentmarket")

echo "╔══════════════════════════════════════════════════╗"
echo "║   YeouAlba.com 서버 설치 스크립트                ║"
echo "║   모드: $MODE                                    ║"
echo "║   경로: $DEPLOY_DIR                              ║"
echo "║   포트: Frontend=$FRONTEND_PORT Backend=$BACKEND_PORT  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ══════════════════════════════════════════════════════════
# [0/10] 서버 환경 진단
# ══════════════════════════════════════════════════════════
echo "━━━ [0/10] 서버 환경 진단 ━━━"
echo ""
echo "[시스템]"
echo "  OS      : $(lsb_release -ds 2>/dev/null || grep PRETTY_NAME /etc/os-release 2>/dev/null | cut -d= -f2 || echo 'unknown')"
echo "  Node    : $(node -v 2>/dev/null || echo 'NOT INSTALLED')"
echo "  npm     : $(npm -v 2>/dev/null || echo 'NOT INSTALLED')"
echo "  PM2     : $(pm2 -v 2>/dev/null || echo 'NOT INSTALLED')"
echo "  Python3 : $(python3 --version 2>/dev/null || echo 'NOT INSTALLED')"
echo ""

echo "[Docker 컨테이너]"
docker ps --format '  {{.Names}}  ({{.Status}})' 2>/dev/null || echo "  Docker 접근 불가"
echo ""

echo "[PM2 프로세스]"
pm2 list 2>/dev/null | head -15 || echo "  PM2 없음"
echo ""

echo "[사용 중인 포트 (3000~5999)]"
ss -tlnp 2>/dev/null | grep -oP ':\K(3\d{3}|4\d{3}|5\d{3})(?=\s)' | sort -un | while read p; do
  echo "  :$p"
done
echo ""

echo "[nginx 컨테이너]"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "$NGINX_CONTAINER"; then
  echo "  $NGINX_CONTAINER: 실행 중 ✓"
  echo "  현재 location:"
  docker exec "$NGINX_CONTAINER" grep -E '^\s*location\s' /etc/nginx/conf.d/default.conf 2>/dev/null | sed 's/^/    /'
else
  echo "  $NGINX_CONTAINER 미발견"
  FOUND=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i nginx | head -1)
  if [ -n "$FOUND" ]; then
    echo "  대체 발견: $FOUND"
    NGINX_CONTAINER="$FOUND"
  fi
fi
echo ""

echo "[기존 서비스 상태 (배포 전)]"
for name in hacker lovechat agentmarket; do
  if pm2 list 2>/dev/null | grep "$name" | grep -q "online"; then
    echo "  PM2 $name: online ✓"
  elif pm2 list 2>/dev/null | grep -q "$name"; then
    echo "  PM2 $name: stopped ⚠️"
  fi
done
for name in jobworld-nginx jobworld-frontend jobworld-backend; do
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${name}$"; then
    echo "  Docker $name: running ✓"
  fi
done
echo ""

# ══════════════════════════════════════════════════════════
# [1/10] 충돌 검사
# ══════════════════════════════════════════════════════════
echo "━━━ [1/10] 충돌 검사 ━━━"
ABORT=0

echo "  [포트]"
for port in $FRONTEND_PORT $BACKEND_PORT; do
  if ss -tlnp 2>/dev/null | grep -q ":${port} "; then
    if pm2 list 2>/dev/null | grep -q "yeoualba"; then
      echo "    :${port} → yeoualba 사용 중 (재시작 예정) ✓"
    else
      echo "    :${port} → 다른 서비스 점유! ✗"
      ABORT=1
    fi
  else
    echo "    :${port} → 사용 가능 ✓"
  fi
done

for ep in "${EXISTING_PORTS[@]}"; do
  if [ "$ep" -eq "$FRONTEND_PORT" ] || [ "$ep" -eq "$BACKEND_PORT" ]; then
    echo "    :${ep} → 기존 서비스와 충돌! ✗"
    ABORT=1
  fi
done

echo "  [디렉토리]"
for ep in "${EXISTING_PATHS[@]}"; do
  if [ "$DEPLOY_DIR" = "$ep" ]; then
    echo "    $DEPLOY_DIR → 기존 서비스와 충돌! ✗"
    ABORT=1
  fi
done
echo "    $DEPLOY_DIR → OK ✓"

echo "  [nginx 경로]"
for ep in "${EXISTING_NGINX[@]}"; do
  if [ "/yeoualba" = "$ep" ]; then
    echo "    /yeoualba → 기존 $ep 와 충돌! ✗"
    ABORT=1
  fi
done
echo "    /yeoualba → OK ✓"

if [ "$ABORT" -eq 1 ]; then
  echo ""
  echo "  ✗ 충돌 발견! 중단합니다."
  exit 1
fi
echo ""

# ══════════════════════════════════════════════════════════
# [2/10] 필수 도구
# ══════════════════════════════════════════════════════════
echo "━━━ [2/10] 필수 도구 확인 ━━━"
if ! command -v node &>/dev/null; then
  echo "  Node.js 미설치! 설치 후 다시 실행하세요."
  echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
  exit 1
fi
if ! command -v pm2 &>/dev/null; then
  echo "  PM2 설치 중..."
  npm install -g pm2
fi
if ! command -v python3 &>/dev/null; then
  echo "  python3 미설치! (nginx 패치에 필요)"
  echo "  sudo apt-get install -y python3"
  exit 1
fi
echo "  Node $(node -v), PM2 $(pm2 -v), python3 ✓"
echo ""

# ══════════════════════════════════════════════════════════
# [3/10] 소스 코드
# ══════════════════════════════════════════════════════════
echo "━━━ [3/10] 소스 코드 준비 ━━━"
if [ -d "$DEPLOY_DIR/.git" ]; then
  echo "  기존 디렉토리 → git pull"
  cd "$DEPLOY_DIR"
  git fetch origin
  git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" "origin/$BRANCH"
  git pull origin "$BRANCH"
else
  if [ -d "$DEPLOY_DIR" ]; then
    echo "  디렉토리 존재하나 git 아님 → 삭제 후 클론"
    rm -rf "$DEPLOY_DIR"
  fi
  echo "  최초 클론..."
  cd /home/ubuntu
  git clone "$REPO" yeoualba
  cd "$DEPLOY_DIR"
  git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" "origin/$BRANCH"
fi
echo "  커밋: $(git log --oneline -1)"
echo ""

# ══════════════════════════════════════════════════════════
# [4/10] Backend 빌드
# ══════════════════════════════════════════════════════════
echo "━━━ [4/10] Backend 빌드 ━━━"
cd "$DEPLOY_DIR/backend"
echo "  npm ci..."
npm ci --production=false 2>&1 | tail -3
echo "  prisma generate..."
npx prisma generate 2>&1 | tail -2
echo "  tsc 빌드..."
npm run build 2>&1 | tail -2
echo "  Backend 완료 ✓"
echo ""

# ══════════════════════════════════════════════════════════
# [5/10] Frontend 빌드
# ══════════════════════════════════════════════════════════
echo "━━━ [5/10] Frontend 빌드 ━━━"
cd "$DEPLOY_DIR/frontend"
echo "  npm ci..."
npm ci --production=false 2>&1 | tail -3
echo "  next build (basePath=/yeoualba)..."
NEXT_PUBLIC_BASE_PATH=/yeoualba \
NEXT_PUBLIC_API_URL="http://${SERVER_IP}/yeoualba/api" \
NEXT_PUBLIC_SITE_NAME=YeouAlba \
npm run build 2>&1 | tail -5

if [ -d "$DEPLOY_DIR/frontend/.next/standalone" ]; then
  echo "  standalone 구성..."
  cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
  cp -r public .next/standalone/public 2>/dev/null || true
  ln -sf "$DEPLOY_DIR/frontend/.next/standalone/server.js" "$DEPLOY_DIR/frontend/server.js"
  echo "  Frontend standalone 완료 ✓"
else
  echo "  standalone 없음 → wrapper 생성"
  cat > "$DEPLOY_DIR/frontend/server.js" << 'SEOF'
const { execSync } = require('child_process');
execSync('npx next start -p ' + (process.env.PORT || 3004), { stdio: 'inherit' });
SEOF
fi
echo ""

# ══════════════════════════════════════════════════════════
# [6/10] PostgreSQL (full 모드만)
# ══════════════════════════════════════════════════════════
if [ "$MODE" != "update" ]; then
  echo "━━━ [6/10] PostgreSQL 데이터베이스 ━━━"
  PG_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i postgres | head -1)
  if [ -z "$PG_CONTAINER" ]; then
    echo "  ⚠️  PostgreSQL 컨테이너 미발견 → 수동 생성 필요"
    echo "    CREATE DATABASE yeoualba;"
    echo "    CREATE USER yeoualba WITH PASSWORD 'yeoualba_prod_2026';"
  else
    echo "  컨테이너: $PG_CONTAINER"
    echo "  기존 DB:"
    docker exec "$PG_CONTAINER" psql -U postgres -tAc \
      "SELECT datname FROM pg_database WHERE datistemplate=false" 2>/dev/null | sed 's/^/    /'

    DB_EXISTS=$(docker exec "$PG_CONTAINER" psql -U postgres -tAc \
      "SELECT 1 FROM pg_database WHERE datname='yeoualba'" 2>/dev/null || echo "0")

    if echo "$DB_EXISTS" | grep -q "1"; then
      echo "  DB 'yeoualba': 이미 존재 ✓"
    else
      echo "  DB 'yeoualba' 생성..."
      docker exec "$PG_CONTAINER" psql -U postgres -c "CREATE DATABASE yeoualba;"
      echo "  생성 완료 ✓"
    fi

    docker exec "$PG_CONTAINER" psql -U postgres -c \
      "DO \$\$ BEGIN CREATE USER yeoualba WITH PASSWORD 'yeoualba_prod_2026'; EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;" 2>/dev/null || true
    docker exec "$PG_CONTAINER" psql -U postgres -c \
      "GRANT ALL PRIVILEGES ON DATABASE yeoualba TO yeoualba;" 2>/dev/null || true
    docker exec "$PG_CONTAINER" psql -U postgres -c \
      "ALTER DATABASE yeoualba OWNER TO yeoualba;" 2>/dev/null || true
    echo "  유저/권한 완료 ✓"
  fi
  echo ""

  echo "  Prisma 스키마 적용..."
  cd "$DEPLOY_DIR/backend"
  DATABASE_URL="postgresql://yeoualba:yeoualba_prod_2026@localhost:5432/yeoualba" \
    npx prisma db push --accept-data-loss 2>&1 | tail -5
  echo "  Prisma 완료 ✓"
  echo ""
else
  echo "━━━ [6/10] 스킵 (update 모드) ━━━"
  echo ""
fi

# ══════════════════════════════════════════════════════════
# [7/10] iptables (full 모드만)
# ══════════════════════════════════════════════════════════
if [ "$MODE" != "update" ]; then
  echo "━━━ [7/10] iptables 방화벽 ━━━"
  for PORT in $FRONTEND_PORT $BACKEND_PORT; do
    for SUBNET in 172.17.0.0/16 172.18.0.0/16; do
      iptables -C DOCKER-USER -s "$SUBNET" -p tcp --dport "$PORT" -j ACCEPT 2>/dev/null || \
      iptables -I DOCKER-USER -s "$SUBNET" -p tcp --dport "$PORT" -j ACCEPT 2>/dev/null || true
    done
    echo "  :$PORT → Docker 허용 ✓"
  done
  echo ""
else
  echo "━━━ [7/10] 스킵 (update 모드) ━━━"
  echo ""
fi

# ══════════════════════════════════════════════════════════
# [8/10] Docker nginx 자동 패치 (full 모드만)
# ══════════════════════════════════════════════════════════
if [ "$MODE" != "update" ]; then
  echo "━━━ [8/10] Docker nginx 설정 ━━━"

  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "$NGINX_CONTAINER"; then
    echo "  ⚠️  $NGINX_CONTAINER 미발견 → 스킵"
  elif docker exec "$NGINX_CONTAINER" grep -q "yeoualba" /etc/nginx/conf.d/default.conf 2>/dev/null; then
    echo "  yeoualba 설정 이미 존재 ✓"
  else
    echo "  백업..."
    BACKUP_TAG=$(date +%Y%m%d%H%M%S)
    docker exec "$NGINX_CONTAINER" cp /etc/nginx/conf.d/default.conf "/etc/nginx/conf.d/default.conf.bak.${BACKUP_TAG}"

    echo "  기존 설정 추출..."
    docker exec "$NGINX_CONTAINER" cat /etc/nginx/conf.d/default.conf > /tmp/nginx-orig.conf

    echo "  기존 location 블록 (보존됨):"
    grep -E '^\s*location\s' /tmp/nginx-orig.conf | sed 's/^/    /'

    # yeoualba location 블록
    cat > /tmp/nginx-yeoualba.conf << 'NEOF'

    # ===== YeouAlba (자동 추가 by deploy.sh) =====
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
NEOF

    echo "  패치 중 (server{} 마지막 } 앞에 삽입)..."
    python3 -c "
import sys
with open('/tmp/nginx-orig.conf') as f: c = f.read()
with open('/tmp/nginx-yeoualba.conf') as f: b = f.read()
i = c.rfind('}')
out = c[:i] + b + '\n' + c[i:] if i != -1 else c + '\n' + b
with open('/tmp/nginx-patched.conf','w') as f: f.write(out)
"

    docker cp /tmp/nginx-patched.conf "$NGINX_CONTAINER":/etc/nginx/conf.d/default.conf

    echo "  nginx -t..."
    if docker exec "$NGINX_CONTAINER" nginx -t 2>&1; then
      docker exec "$NGINX_CONTAINER" nginx -s reload
      echo "  reload 완료 ✓"

      # 기존 서비스 검증
      echo ""
      echo "  ★ 기존 서비스 검증 (nginx 패치 후) ★"
      for path in /jobworld /hacker /lovechat /agentmarket; do
        CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost${path}/" 2>/dev/null || echo "000")
        if [ "$CODE" = "000" ] || [ "$CODE" = "502" ] || [ "$CODE" = "503" ]; then
          echo "    ${path}: HTTP ${CODE} (비활성일 수 있음)"
        else
          echo "    ${path}: HTTP ${CODE} ✓"
        fi
      done
    else
      echo "  ✗ nginx -t 실패! 원본 복원..."
      docker cp /tmp/nginx-orig.conf "$NGINX_CONTAINER":/etc/nginx/conf.d/default.conf
      docker exec "$NGINX_CONTAINER" nginx -s reload
      echo "  복원 완료"
    fi

    rm -f /tmp/nginx-orig.conf /tmp/nginx-yeoualba.conf /tmp/nginx-patched.conf
  fi
  echo ""
else
  echo "━━━ [8/10] 스킵 (update 모드) ━━━"
  echo ""
fi

# ══════════════════════════════════════════════════════════
# [9/10] PM2 시작
# ══════════════════════════════════════════════════════════
echo "━━━ [9/10] PM2 시작 ━━━"
cd "$DEPLOY_DIR"

# yeoualba만 정리 (다른 프로세스 안 건드림)
pm2 delete yeoualba-frontend 2>/dev/null || true
pm2 delete yeoualba-backend 2>/dev/null || true

pm2 start ecosystem.config.js
pm2 save --force
echo ""
pm2 list | head -20
echo ""

# ══════════════════════════════════════════════════════════
# [10/10] 전체 검증
# ══════════════════════════════════════════════════════════
echo "━━━ [10/10] 전체 검증 ━━━"
echo ""
echo "  [YeouAlba]"

echo -n "    Backend  :${BACKEND_PORT}/api/health ... "
for i in $(seq 1 15); do
  if curl -sf --max-time 3 "http://localhost:${BACKEND_PORT}/api/health" >/dev/null 2>&1; then
    echo "✓"
    break
  fi
  [ "$i" -eq 15 ] && echo "✗ → pm2 logs yeoualba-backend"
  sleep 1
done

echo -n "    Frontend :${FRONTEND_PORT}/yeoualba/ ... "
for i in $(seq 1 15); do
  if curl -sf --max-time 3 "http://localhost:${FRONTEND_PORT}/yeoualba/" >/dev/null 2>&1; then
    echo "✓"
    break
  fi
  [ "$i" -eq 15 ] && echo "✗ → pm2 logs yeoualba-frontend"
  sleep 1
done

echo -n "    nginx → /yeoualba/ ... "
curl -sf --max-time 5 http://localhost/yeoualba/ >/dev/null 2>&1 && echo "✓" || echo "✗"

echo -n "    nginx → /yeoualba/api/health ... "
R=$(curl -sf --max-time 5 http://localhost/yeoualba/api/health 2>/dev/null)
[ -n "$R" ] && echo "✓ $R" || echo "✗"

echo ""
echo "  [기존 서비스]"
for svc in "hacker:5000" "lovechat:3001" "agentmarket:3003"; do
  NAME="${svc%%:*}"
  PORT="${svc##*:}"
  echo -n "    $NAME (:$PORT) ... "
  if pm2 list 2>/dev/null | grep "$NAME" | grep -q "online"; then
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "http://localhost:${PORT}/" 2>/dev/null || echo "000")
    echo "online, HTTP $CODE"
  else
    echo "미실행 (원래 비활성)"
  fi
done

echo -n "    Docker nginx ... "
docker ps --format '{{.Names}} {{.Status}}' 2>/dev/null | grep "$NGINX_CONTAINER" || echo "미발견"

for path in /jobworld /hacker /lovechat /agentmarket; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost${path}/" 2>/dev/null || echo "000")
  [ "$CODE" != "000" ] && echo "    nginx${path}: HTTP ${CODE}"
done

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                  배포 완료!                          ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  http://${SERVER_IP}/yeoualba/            ║"
echo "║  http://${SERVER_IP}/yeoualba/api/health  ║"
echo "║                                                      ║"
echo "║  관리:                                               ║"
echo "║    pm2 logs yeoualba-backend --lines 50              ║"
echo "║    pm2 logs yeoualba-frontend --lines 50             ║"
echo "║    pm2 restart yeoualba-backend                      ║"
echo "║    pm2 restart yeoualba-frontend                     ║"
echo "║                                                      ║"
echo "║  롤백:                                               ║"
echo "║    pm2 delete yeoualba-frontend yeoualba-backend     ║"
echo "║    pm2 save --force                                  ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"

if [ "$MODE" != "update" ]; then
  echo ""
  echo "⚠️  iptables 영구화 (재부팅 대비, 1회 실행):"
  echo "  sudo ufw allow from 172.17.0.0/16 to any port 3004"
  echo "  sudo ufw allow from 172.18.0.0/16 to any port 3004"
  echo "  sudo ufw allow from 172.17.0.0/16 to any port 5001"
  echo "  sudo ufw allow from 172.18.0.0/16 to any port 5001"
fi
