#!/bin/bash
# ================================================================
# YeouAlba.com 서버 설치 스크립트 (v3 - 리다이렉트 루프 해결)
# ================================================================
# 서버에 SSH 접속 후 실행:
#   ssh -p 2222 ubuntu@211.198.54.207
#   cd /home/ubuntu/yeoualba
#   git pull origin claude/yeoualba-platform-dev-fwj8u
#   bash deploy.sh          # 전체 설치
#   bash deploy.sh update   # 코드만 업데이트
# ================================================================

set -e

DEPLOY_DIR="/home/ubuntu/yeoualba"
FRONTEND_PORT=3004
BACKEND_PORT=5001
SERVER_IP="211.198.54.207"
MODE="${1:-full}"
NGINX_CONF="/etc/nginx/sites-enabled/hydro"

echo "╔══════════════════════════════════════════╗"
echo "║  YeouAlba.com 설치 (모드: $MODE)        ║"
echo "╚══════════════════════════════════════════╝"

# ── [1] 포트 정리 ──
echo ""
echo "━━━ [1/7] 포트 정리 ━━━"
pm2 delete yeoualba-frontend 2>/dev/null || true
pm2 delete yeoualba-backend 2>/dev/null || true
sleep 2

# 포트 3004, 5001 강제 해제
for PORT in $FRONTEND_PORT $BACKEND_PORT; do
  PIDS=$(lsof -t -i:$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "  포트 $PORT 점유 프로세스 kill: $PIDS"
    kill $PIDS 2>/dev/null || true
    sleep 1
    kill -9 $PIDS 2>/dev/null || true
  else
    echo "  포트 $PORT: 깨끗함 ✓"
  fi
done
sleep 2

# ── [2] Backend 빌드 ──
echo ""
echo "━━━ [2/7] Backend 빌드 ━━━"
cd "$DEPLOY_DIR/backend"
npm install 2>&1 | tail -3
npx prisma generate 2>&1 | tail -2
npm run build 2>&1 | tail -2
if [ -f dist/index.js ]; then
  echo "  Backend OK ✓"
else
  echo "  ✗ Backend 빌드 실패!"
  exit 1
fi

# ── [3] Frontend 빌드 ──
echo ""
echo "━━━ [3/7] Frontend 빌드 ━━━"
cd "$DEPLOY_DIR/frontend"
npm install 2>&1 | tail -3
echo "  next build..."
npx next build 2>&1 | tail -5
if [ -d .next ]; then
  echo "  Frontend OK ✓"
else
  echo "  ✗ Frontend 빌드 실패!"
  exit 1
fi

# ── [4] PostgreSQL (full 모드만) ──
if [ "$MODE" != "update" ]; then
  echo ""
  echo "━━━ [4/7] PostgreSQL ━━━"
  PG=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i postgres | head -1)
  if [ -n "$PG" ]; then
    docker exec "$PG" psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='yeoualba'" 2>/dev/null | grep -q 1 || \
    docker exec "$PG" psql -U postgres -c "CREATE DATABASE yeoualba;" 2>/dev/null
    docker exec "$PG" psql -U postgres -c "DO \$\$ BEGIN CREATE USER yeoualba WITH PASSWORD 'yeoualba_prod_2026'; EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;" 2>/dev/null || true
    docker exec "$PG" psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE yeoualba TO yeoualba;" 2>/dev/null || true
    docker exec "$PG" psql -U postgres -c "ALTER DATABASE yeoualba OWNER TO yeoualba;" 2>/dev/null || true
    echo "  DB 준비 완료 ✓"

    cd "$DEPLOY_DIR/backend"
    DATABASE_URL="postgresql://yeoualba:yeoualba_prod_2026@localhost:5432/yeoualba" \
      npx prisma db push --accept-data-loss 2>&1 | tail -3
    echo "  Prisma 스키마 적용 ✓"
  else
    echo "  PostgreSQL 컨테이너 미발견 ⚠️"
  fi
else
  echo ""
  echo "━━━ [4/7] 스킵 (update) ━━━"
fi

# ── [5] nginx 설정 (full 모드만) ──
if [ "$MODE" != "update" ]; then
  echo ""
  echo "━━━ [5/7] nginx 설정 ━━━"

  if [ ! -f "$NGINX_CONF" ]; then
    echo "  ✗ $NGINX_CONF 없음!"
    exit 1
  fi

  # 기존 yeoualba 블록 제거 (중복 방지)
  if grep -q "yeoualba" "$NGINX_CONF"; then
    echo "  기존 yeoualba 블록 제거..."
    sudo cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%s)"
    # Python으로 안전하게 yeoualba 블록 제거
    sudo python3 -c "
import re
with open('$NGINX_CONF') as f: c = f.read()
# Remove yeoualba location blocks (including comments)
c = re.sub(r'\n\s*#[^\n]*yeoualba[^\n]*\n(\s*location /yeoualba[^}]*\{[^}]*\}\n?)+', '\n', c, flags=re.IGNORECASE)
c = re.sub(r'\n\s*location /yeoualba[^}]*\{[^}]*\}\n?', '\n', c)
with open('$NGINX_CONF','w') as f: f.write(c)
"
  fi

  # yeoualba 블록 추가 (rewrite 방식 - 리다이렉트 루프 방지)
  echo "  yeoualba 블록 추가 (rewrite 방식)..."
  sudo python3 -c "
with open('$NGINX_CONF') as f: c = f.read()

block = '''
    # ── yeoualba (frontend:3004, backend:5001) ────────────
    location /yeoualba/api/ {
        proxy_pass http://127.0.0.1:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }

    location /yeoualba {
        rewrite ^/yeoualba\(/.*\)\?$ \\\$1 break;
        rewrite ^\$ / break;
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
    }
'''

# Insert before the last closing brace of the second server block
# Find '# 루트 접속' or last '}' in server block
import re
m = re.search(r'(    # 루트 접속)', c)
if m:
    pos = m.start()
    c = c[:pos] + block + '\n' + c[pos:]
else:
    # fallback: insert before last }
    i = c.rfind('}')
    if i != -1:
        c = c[:i] + block + '\n' + c[i:]

with open('$NGINX_CONF','w') as f: f.write(c)
print('  nginx 설정 추가 완료')
"

  # 테스트 & 리로드
  if sudo nginx -t 2>&1; then
    sudo systemctl reload nginx
    echo "  nginx reload ✓"
  else
    echo "  ✗ nginx 설정 오류! 백업에서 복원..."
    LATEST_BAK=$(ls -t ${NGINX_CONF}.bak.* 2>/dev/null | head -1)
    if [ -n "$LATEST_BAK" ]; then
      sudo cp "$LATEST_BAK" "$NGINX_CONF"
      sudo systemctl reload nginx
    fi
    echo "  복원 완료. 수동 확인 필요."
    exit 1
  fi
else
  echo ""
  echo "━━━ [5/7] 스킵 (update) ━━━"
fi

# ── [6] PM2 시작 ──
echo ""
echo "━━━ [6/7] PM2 시작 ━━━"
cd "$DEPLOY_DIR"
pm2 start ecosystem.config.js
pm2 save --force 2>/dev/null || true
echo "  대기 중 (10초)..."
sleep 10
pm2 list | grep yeoualba || true

# ── [7] 검증 ──
echo ""
echo "━━━ [7/7] 검증 ━━━"

echo -n "  Backend :$BACKEND_PORT ... "
for i in $(seq 1 10); do
  R=$(curl -sf http://localhost:$BACKEND_PORT/api/health 2>/dev/null)
  if [ -n "$R" ]; then echo "✓ $R"; break; fi
  [ "$i" -eq 10 ] && echo "✗"
  sleep 1
done

echo -n "  Frontend :$FRONTEND_PORT ... "
for i in $(seq 1 15); do
  if curl -sf http://localhost:$FRONTEND_PORT/ >/dev/null 2>&1; then echo "✓"; break; fi
  [ "$i" -eq 15 ] && echo "✗ (pm2 logs yeoualba-frontend)"
  sleep 1
done

echo -n "  nginx /yeoualba/ ... "
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/yeoualba/ 2>/dev/null)
echo "HTTP $CODE"

echo -n "  nginx /yeoualba/api/health ... "
R=$(curl -sf http://localhost/yeoualba/api/health 2>/dev/null)
[ -n "$R" ] && echo "✓ $R" || echo "✗"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  http://$SERVER_IP/yeoualba/                 ║"
echo "║  http://$SERVER_IP/yeoualba/api/health       ║"
echo "╚══════════════════════════════════════════════╝"
