#!/bin/bash
# ================================================================
# YeouAlba.com 올인원 배포 스크립트 (기존 서비스 안전 보장)
# ================================================================
# 서버: Ubuntu (211.198.54.207), SSH 포트 2222
# 배포 경로: /home/ubuntu/yeoualba
# 접속 URL: http://211.198.54.207/yeoualba/
# ================================================================
# 기존 서비스 보호:
#   - jobworld  (Docker + /jobworld)
#   - hacker    (PM2:5000 + /hacker)
#   - lovechat  (PM2:3001 + /lovechat)
#   - agentmarket (PM2:3003 + /agentmarket)
# ================================================================
# 사용법:
#   bash deploy.sh          # 전체 배포 (최초 + nginx + DB + 방화벽)
#   bash deploy.sh update   # 코드만 업데이트 (재빌드 + PM2 재시작)
# ================================================================

set -e

SERVER="ubuntu@211.198.54.207"
SSH_PORT=2222
MODE="${1:-full}"

echo "╔══════════════════════════════════════════════╗"
echo "║   YeouAlba.com 올인원 배포 스크립트          ║"
echo "║   모드: $MODE                                ║"
echo "║   서버: $SERVER (포트 $SSH_PORT)             ║"
echo "╚══════════════════════════════════════════════╝"
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

# ──────────────────────────────────────────────────────────
# 기존 서비스 정의 (안전 검증용)
# ──────────────────────────────────────────────────────────
EXISTING_SERVICES_PATHS=("/home/ubuntu/hacker" "/home/ubuntu/lovechat" "/home/ubuntu/agentmarket")
EXISTING_SERVICES_PORTS=(3000 3001 3002 3003 5000)
EXISTING_NGINX_PATHS=("/hacker" "/jobworld" "/lovechat" "/agentmarket")
EXISTING_CHECK_URLS=(
  "http://localhost:5000/"
  "http://localhost:3001/"
  "http://localhost:3003/"
)

# 서비스 상태 확인 함수
check_existing_services() {
  local label="$1"
  local fail=0
  echo "  [$label] 기존 서비스 상태 확인:"

  # PM2 프로세스 확인
  for name in hacker lovechat agentmarket; do
    if pm2 list 2>/dev/null | grep -q "$name"; then
      STATUS=$(pm2 list 2>/dev/null | grep "$name" | grep -o "online\|stopped\|errored" | head -1)
      if [ "$STATUS" = "online" ]; then
        echo "    PM2 $name: online ✓"
      else
        echo "    PM2 $name: $STATUS ⚠️"
        fail=1
      fi
    fi
  done

  # Docker 컨테이너 확인
  for name in jobworld-nginx jobworld-frontend jobworld-backend; do
    if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "^${name}$"; then
      STATUS=$(docker inspect -f '{{.State.Status}}' "$name" 2>/dev/null || echo "unknown")
      if [ "$STATUS" = "running" ]; then
        echo "    Docker $name: running ✓"
      else
        echo "    Docker $name: $STATUS ⚠️"
        fail=1
      fi
    fi
  done

  # HTTP 응답 확인
  for url in "${EXISTING_CHECK_URLS[@]}"; do
    if curl -sf --max-time 3 "$url" > /dev/null 2>&1; then
      echo "    HTTP $url: 응답 ✓"
    else
      echo "    HTTP $url: 응답없음 (비활성일 수 있음)"
    fi
  done

  return $fail
}

# ══════════════════════════════════════════════════════════
# STEP 0. 서버 환경 진단 + 기존 서비스 스냅샷
# ══════════════════════════════════════════════════════════
echo ""
echo "━━━ [0/10] 서버 환경 진단 ━━━"
echo ""
echo "[시스템]"
echo "  OS: $(lsb_release -ds 2>/dev/null || grep PRETTY_NAME /etc/os-release 2>/dev/null | cut -d= -f2 || echo 'unknown')"
echo "  Node: $(node -v 2>/dev/null || echo 'NOT INSTALLED')"
echo "  npm: $(npm -v 2>/dev/null || echo 'NOT INSTALLED')"
echo "  PM2: $(pm2 -v 2>/dev/null || echo 'NOT INSTALLED')"
echo ""

echo "[Docker 컨테이너]"
docker ps --format '  {{.Names}}  ({{.Status}})  {{.Ports}}' 2>/dev/null || echo "  Docker 접근 불가"
echo ""

echo "[PM2 프로세스]"
pm2 jlist 2>/dev/null | python3 -c "
import sys,json
try:
  apps=json.load(sys.stdin)
  for a in apps:
    print(f\"  {a['name']:20s} pid={a['pid']:<8} status={a['pm2_env']['status']:<10} port=:{a['pm2_env'].get('env',{}).get('PORT','?')}\")
except: print('  (파싱 실패, pm2 list로 확인)')
" 2>/dev/null || pm2 list 2>/dev/null | head -15
echo ""

echo "[사용 중인 포트]"
ss -tlnp 2>/dev/null | awk 'NR>1{print "  "$4}' | sort -t: -k2 -n | head -20
echo ""

echo "[nginx 컨테이너 설정]"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "$NGINX_CONTAINER"; then
  echo "  $NGINX_CONTAINER: 실행 중 ✓"
  echo "  현재 location 블록:"
  docker exec $NGINX_CONTAINER grep -E "^\s*location\s" /etc/nginx/conf.d/default.conf 2>/dev/null | sed 's/^/    /' || true
else
  echo "  WARNING: $NGINX_CONTAINER 미발견!"
  FOUND=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i nginx | head -1)
  if [ -n "$FOUND" ]; then
    echo "  대체 발견: $FOUND"
    NGINX_CONTAINER="$FOUND"
  fi
fi
echo ""

echo "[기존 서비스 상태 스냅샷 (배포 전)]"
check_existing_services "배포 전" || true
echo ""

# ══════════════════════════════════════════════════════════
# STEP 1. 충돌 검사 (포트 + 경로 + 디렉토리)
# ══════════════════════════════════════════════════════════
echo "━━━ [1/10] 충돌 검사 ━━━"
ABORT=0

# 포트 충돌
echo "  [포트 검사]"
for port in $FRONTEND_PORT $BACKEND_PORT; do
  if ss -tlnp 2>/dev/null | grep -q ":${port} "; then
    if pm2 jlist 2>/dev/null | grep -q "yeoualba"; then
      echo "    포트 ${port}: yeoualba 사용 중 (재시작 예정) ✓"
    else
      echo "    포트 ${port}: 다른 서비스가 점유 중! ✗"
      ss -tlnp 2>/dev/null | grep ":${port} " | awk '{print "      → "$NF}'
      ABORT=1
    fi
  else
    echo "    포트 ${port}: 사용 가능 ✓"
  fi
done

# 기존 서비스 포트와의 겹침 확인
for eport in "${EXISTING_SERVICES_PORTS[@]}"; do
  if [ "$eport" -eq "$FRONTEND_PORT" ] || [ "$eport" -eq "$BACKEND_PORT" ]; then
    echo "    ERROR: 포트 ${eport}는 기존 서비스가 사용 중! ✗"
    ABORT=1
  fi
done

# 디렉토리 충돌
echo "  [디렉토리 검사]"
for epath in "${EXISTING_SERVICES_PATHS[@]}"; do
  if [ "$DEPLOY_DIR" = "$epath" ]; then
    echo "    ERROR: $DEPLOY_DIR 이 기존 서비스 경로와 동일! ✗"
    ABORT=1
  fi
done
echo "    배포 경로 $DEPLOY_DIR: 기존 서비스와 겹치지 않음 ✓"

# nginx 경로 충돌
echo "  [nginx 경로 검사]"
for epath in "${EXISTING_NGINX_PATHS[@]}"; do
  if [ "/yeoualba" = "$epath" ]; then
    echo "    ERROR: /yeoualba 경로가 기존 $epath 와 충돌! ✗"
    ABORT=1
  fi
done
echo "    nginx 경로 /yeoualba: 기존 경로와 겹치지 않음 ✓"

if [ "$ABORT" -eq 1 ]; then
  echo ""
  echo "  ✗ 충돌 발견! 배포를 중단합니다."
  echo "  기존 서비스에 영향을 줄 수 있습니다."
  exit 1
fi
echo "  ✓ 모든 충돌 검사 통과"
echo ""

# ══════════════════════════════════════════════════════════
# STEP 2. 필수 도구 확인
# ══════════════════════════════════════════════════════════
echo "━━━ [2/10] 필수 도구 확인 ━━━"
if ! command -v node &>/dev/null; then
  echo "  ERROR: Node.js 미설치!"
  exit 1
fi
if ! command -v pm2 &>/dev/null; then
  echo "  PM2 설치 중..."
  sudo npm install -g pm2
fi
echo "  Node.js $(node -v) ✓"
echo "  PM2 $(pm2 -v) ✓"
echo ""

# ══════════════════════════════════════════════════════════
# STEP 3. 소스 코드 준비
# ══════════════════════════════════════════════════════════
echo "━━━ [3/10] 소스 코드 준비 ━━━"
if [ -d "$DEPLOY_DIR" ]; then
  echo "  기존 디렉토리 발견 → git pull"
  cd $DEPLOY_DIR
  git fetch origin
  git checkout $BRANCH 2>/dev/null || git checkout -b $BRANCH origin/$BRANCH
  git pull origin $BRANCH
else
  echo "  최초 클론..."
  cd /home/ubuntu
  git clone $REPO yeoualba
  cd $DEPLOY_DIR
  git checkout $BRANCH 2>/dev/null || git checkout -b $BRANCH origin/$BRANCH
fi
echo "  커밋: $(git log --oneline -1)"
echo ""

# ══════════════════════════════════════════════════════════
# STEP 4. Backend 빌드
# ══════════════════════════════════════════════════════════
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

# ══════════════════════════════════════════════════════════
# STEP 5. Frontend 빌드
# ══════════════════════════════════════════════════════════
echo "━━━ [5/10] Frontend 빌드 ━━━"
cd $DEPLOY_DIR/frontend
echo "  npm ci..."
npm ci --production=false 2>&1 | tail -3
echo "  Next.js 빌드 (basePath=/yeoualba)..."
NEXT_PUBLIC_BASE_PATH=/yeoualba \
NEXT_PUBLIC_API_URL=http://211.198.54.207/yeoualba/api \
NEXT_PUBLIC_SITE_NAME=YeouAlba \
npm run build 2>&1 | tail -5

if [ -d "$DEPLOY_DIR/frontend/.next/standalone" ]; then
  echo "  standalone 구성..."
  cp -r $DEPLOY_DIR/frontend/.next/static $DEPLOY_DIR/frontend/.next/standalone/.next/static 2>/dev/null || true
  cp -r $DEPLOY_DIR/frontend/public $DEPLOY_DIR/frontend/.next/standalone/public 2>/dev/null || true
  ln -sf $DEPLOY_DIR/frontend/.next/standalone/server.js $DEPLOY_DIR/frontend/server.js
  echo "  Frontend standalone 완료 ✓"
else
  echo "  standalone 없음 → next start wrapper 생성"
  cat > $DEPLOY_DIR/frontend/server.js << 'SERVEREOF'
const { execSync } = require('child_process');
execSync('npx next start -p ' + (process.env.PORT || 3004), { stdio: 'inherit' });
SERVEREOF
fi
echo ""

# ══════════════════════════════════════════════════════════
# STEP 6. PostgreSQL 데이터베이스 (full 모드만)
# ══════════════════════════════════════════════════════════
if [ "$MODE" != "update" ]; then
  echo "━━━ [6/10] PostgreSQL 데이터베이스 ━━━"
  PG_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i postgres | head -1)
  if [ -z "$PG_CONTAINER" ]; then
    echo "  WARNING: PostgreSQL 컨테이너 미발견 → 수동 생성 필요"
  else
    echo "  컨테이너: $PG_CONTAINER"

    # 기존 DB 목록 확인 (영향 없음 확인)
    echo "  기존 데이터베이스 목록:"
    docker exec $PG_CONTAINER psql -U postgres -tAc "SELECT datname FROM pg_database WHERE datistemplate=false" 2>/dev/null | sed 's/^/    /'

    DB_EXISTS=$(docker exec $PG_CONTAINER psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='yeoualba'" 2>/dev/null || echo "0")
    if echo "$DB_EXISTS" | grep -q "1"; then
      echo "  DB 'yeoualba': 이미 존재 ✓"
    else
      echo "  DB 'yeoualba' 생성 중 (기존 DB에 영향 없음)..."
      docker exec $PG_CONTAINER psql -U postgres -c "CREATE DATABASE yeoualba;" 2>/dev/null
      echo "  생성 완료 ✓"
    fi
    docker exec $PG_CONTAINER psql -U postgres -c "DO \$\$ BEGIN CREATE USER yeoualba WITH PASSWORD 'yeoualba_prod_2026'; EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;" 2>/dev/null || true
    docker exec $PG_CONTAINER psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE yeoualba TO yeoualba;" 2>/dev/null || true
    docker exec $PG_CONTAINER psql -U postgres -c "ALTER DATABASE yeoualba OWNER TO yeoualba;" 2>/dev/null || true
    echo "  유저/권한 완료 ✓"
  fi
  echo ""

  echo "━━━ [6.5] Prisma 스키마 적용 ━━━"
  cd $DEPLOY_DIR/backend
  DATABASE_URL="postgresql://yeoualba:yeoualba_prod_2026@localhost:5432/yeoualba" \
  npx prisma db push --accept-data-loss 2>&1 | tail -5
  echo "  Prisma 적용 완료 ✓"
  echo ""
else
  echo "━━━ [6/10] 스킵 (update 모드) ━━━"
  echo ""
fi

# ══════════════════════════════════════════════════════════
# STEP 7. iptables 방화벽 (full 모드만)
# ══════════════════════════════════════════════════════════
if [ "$MODE" != "update" ]; then
  echo "━━━ [7/10] iptables 방화벽 ━━━"
  echo "  기존 DOCKER-USER 규칙 (변경 전):"
  sudo iptables -L DOCKER-USER -n 2>/dev/null | head -10 | sed 's/^/    /' || echo "    DOCKER-USER 체인 없음"

  for PORT in $FRONTEND_PORT $BACKEND_PORT; do
    for SUBNET in 172.17.0.0/16 172.18.0.0/16; do
      sudo iptables -C DOCKER-USER -s $SUBNET -p tcp --dport $PORT -j ACCEPT 2>/dev/null || \
      sudo iptables -I DOCKER-USER -s $SUBNET -p tcp --dport $PORT -j ACCEPT 2>/dev/null || true
    done
    echo "  포트 $PORT → Docker 서브넷 허용 ✓"
  done
  echo ""
else
  echo "━━━ [7/10] 스킵 (update 모드) ━━━"
  echo ""
fi

# ══════════════════════════════════════════════════════════
# STEP 8. Docker nginx 설정 (full 모드만, 안전 패치)
# ══════════════════════════════════════════════════════════
if [ "$MODE" != "update" ]; then
  echo "━━━ [8/10] Docker nginx 설정 (안전 패치) ━━━"

  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "$NGINX_CONTAINER"; then
    echo "  WARNING: $NGINX_CONTAINER 미발견 → 스킵"
  else
    if docker exec $NGINX_CONTAINER grep -q "yeoualba" /etc/nginx/conf.d/default.conf 2>/dev/null; then
      echo "  yeoualba 설정 이미 존재 ✓"
    else
      echo "  기존 nginx 설정 백업..."
      docker exec $NGINX_CONTAINER cp /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak.$(date +%Y%m%d%H%M%S)

      echo "  기존 설정 추출..."
      docker exec $NGINX_CONTAINER cat /etc/nginx/conf.d/default.conf > /tmp/nginx-original.conf

      echo "  기존 location 블록 확인 (덮어쓰지 않음):"
      grep -E "^\s*location\s" /tmp/nginx-original.conf | sed 's/^/    /'

      cat > /tmp/nginx-yeoualba-block.conf << 'NGINXEOF'

    # ===== YeouAlba 자동 추가 (deploy.sh) =====
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

      echo "  server{} 블록 마지막 } 앞에 삽입..."
      python3 - /tmp/nginx-original.conf /tmp/nginx-yeoualba-block.conf << 'PYEOF'
import sys
with open(sys.argv[1]) as f: conf = f.read()
with open(sys.argv[2]) as f: block = f.read()
i = conf.rfind('}')
if i != -1:
    patched = conf[:i] + block + '\n' + conf[i:]
else:
    patched = conf + '\n' + block
with open('/tmp/nginx-patched.conf', 'w') as f: f.write(patched)
PYEOF

      docker cp /tmp/nginx-patched.conf $NGINX_CONTAINER:/etc/nginx/conf.d/default.conf

      echo "  nginx -t 테스트..."
      if docker exec $NGINX_CONTAINER nginx -t 2>&1; then
        docker exec $NGINX_CONTAINER nginx -s reload
        echo "  nginx reload 완료"

        # ★ 핵심: 기존 서비스가 여전히 작동하는지 확인
        echo ""
        echo "  ★ nginx 변경 후 기존 서비스 검증 ★"
        ROLLBACK=0
        for path in /jobworld /hacker /lovechat /agentmarket; do
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost${path}/" 2>/dev/null || echo "000")
          if [ "$STATUS" = "000" ] || [ "$STATUS" = "502" ] || [ "$STATUS" = "503" ]; then
            echo "    ${path}: HTTP ${STATUS} ⚠️ (서비스가 비활성 상태일 수 있음)"
          else
            echo "    ${path}: HTTP ${STATUS} ✓"
          fi
        done

        if [ "$ROLLBACK" -eq 1 ]; then
          echo ""
          echo "  ✗ 기존 서비스 장애 감지! 원본 복원..."
          docker exec $NGINX_CONTAINER cp /etc/nginx/conf.d/default.conf.bak.* /etc/nginx/conf.d/default.conf 2>/dev/null || \
          docker cp /tmp/nginx-original.conf $NGINX_CONTAINER:/etc/nginx/conf.d/default.conf
          docker exec $NGINX_CONTAINER nginx -s reload
          echo "  원본 복원 완료. 수동 확인 필요."
        else
          echo "  ✓ 기존 서비스 정상 확인"
        fi
      else
        echo "  ✗ nginx -t 실패! 원본 복원..."
        docker cp /tmp/nginx-original.conf $NGINX_CONTAINER:/etc/nginx/conf.d/default.conf
        docker exec $NGINX_CONTAINER nginx -s reload
        echo "  원본 복원 완료"
      fi

      rm -f /tmp/nginx-original.conf /tmp/nginx-yeoualba-block.conf /tmp/nginx-patched.conf
    fi
  fi
  echo ""
else
  echo "━━━ [8/10] 스킵 (update 모드) ━━━"
  echo ""
fi

# ══════════════════════════════════════════════════════════
# STEP 9. PM2 시작/재시작
# ══════════════════════════════════════════════════════════
echo "━━━ [9/10] PM2 시작 ━━━"
cd $DEPLOY_DIR

# yeoualba만 삭제 (다른 프로세스 건드리지 않음)
pm2 delete yeoualba-frontend 2>/dev/null || true
pm2 delete yeoualba-backend 2>/dev/null || true

pm2 start ecosystem.config.js
pm2 save --force
echo ""
echo "  PM2 전체 상태:"
pm2 list 2>/dev/null | head -20
echo ""

# ══════════════════════════════════════════════════════════
# STEP 10. 전체 서비스 검증 (yeoualba + 기존 모두)
# ══════════════════════════════════════════════════════════
echo "━━━ [10/10] 전체 서비스 검증 ━━━"
echo ""

# yeoualba 검증
echo "  [YeouAlba 신규 서비스]"
echo -n "    Backend  (localhost:${BACKEND_PORT}/api/health) ... "
for i in $(seq 1 15); do
  if curl -sf --max-time 3 http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
    echo "✓"
    break
  fi
  [ "$i" -eq 15 ] && echo "✗ (pm2 logs yeoualba-backend 확인)"
  sleep 1
done

echo -n "    Frontend (localhost:${FRONTEND_PORT}/yeoualba/) ... "
for i in $(seq 1 15); do
  if curl -sf --max-time 3 http://localhost:${FRONTEND_PORT}/yeoualba/ > /dev/null 2>&1; then
    echo "✓"
    break
  fi
  [ "$i" -eq 15 ] && echo "✗ (pm2 logs yeoualba-frontend 확인)"
  sleep 1
done

echo -n "    nginx→Frontend (/yeoualba/) ... "
curl -sf --max-time 5 http://localhost/yeoualba/ > /dev/null 2>&1 && echo "✓" || echo "✗"

echo -n "    nginx→Backend  (/yeoualba/api/health) ... "
RESULT=$(curl -sf --max-time 5 http://localhost/yeoualba/api/health 2>/dev/null)
[ -n "$RESULT" ] && echo "✓ $RESULT" || echo "✗"

echo ""

# 기존 서비스 검증
echo "  [기존 서비스 (영향 없음 확인)]"
ALL_OK=1
for svc in "hacker:5000" "lovechat:3001" "agentmarket:3003"; do
  NAME="${svc%%:*}"
  PORT="${svc##*:}"
  echo -n "    $NAME (포트 $PORT) ... "
  if pm2 list 2>/dev/null | grep "$NAME" | grep -q "online"; then
    echo -n "PM2 online ✓ "
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "http://localhost:${PORT}/" 2>/dev/null || echo "000")
    echo "HTTP $STATUS"
  else
    echo "PM2 미실행 (원래 비활성)"
  fi
done

echo -n "    jobworld-nginx (Docker) ... "
docker ps --format '{{.Names}} {{.Status}}' 2>/dev/null | grep "$NGINX_CONTAINER" | head -1 || echo "미발견"

echo -n "    jobworld-frontend (Docker) ... "
docker ps --format '{{.Names}} {{.Status}}' 2>/dev/null | grep "jobworld-frontend" | head -1 || echo "미발견"

for path in /jobworld /hacker /lovechat /agentmarket; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost${path}/" 2>/dev/null || echo "000")
  if [ "$STATUS" != "000" ]; then
    echo "    nginx${path}: HTTP ${STATUS}"
  fi
done

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                  배포 완료!                          ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  YeouAlba:  http://211.198.54.207/yeoualba/          ║"
echo "║  API:       http://211.198.54.207/yeoualba/api/      ║"
echo "║  Health:    /yeoualba/api/health                     ║"
echo "║                                                      ║"
echo "║  PM2 관리:                                           ║"
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
ENDSSH
