#!/bin/bash

# ====================================================
# LiveNews 원클릭 배포 스크립트
# 서버에서 실행: sudo bash fix-and-deploy.sh
#
# 이 스크립트는 git 권한 수정, 앱 배포, nginx 설정을
# 모두 한번에 처리합니다.
# ====================================================

APP_NAME="livenews"
APP_PORT=4000
DEPLOY_PATH="/home/ubuntu/livenews"
REPO_URL="git@github.com:Hydro8888/hydro.git"
BRANCH="claude/global-news-platform-9p7Oo"
NGINX_CONTAINER="jobworld-nginx"

echo "=============================="
echo "  LiveNews 원클릭 배포"
echo "=============================="
echo ""

# ==============================
# PART 1: git 권한 수정 + 소스코드
# ==============================
echo "[PART 1] 소스코드 준비..."

if [ -d "$DEPLOY_PATH" ]; then
    # 이전 sudo 실행으로 root 소유가 된 파일 수정
    echo "  git 디렉토리 권한 수정..."
    chown -R ubuntu:ubuntu "$DEPLOY_PATH"
    cd "$DEPLOY_PATH"

    echo "  git pull..."
    sudo -u ubuntu git fetch origin "$BRANCH" 2>&1 || true
    sudo -u ubuntu git checkout "$BRANCH" 2>/dev/null || true
    sudo -u ubuntu git reset --hard "origin/$BRANCH" 2>&1 || {
        echo "  git reset 실패. 디렉토리 삭제 후 재클론..."
        cd /home/ubuntu
        rm -rf "$DEPLOY_PATH"
        sudo -u ubuntu git clone "$REPO_URL" "$APP_NAME"
        cd "$DEPLOY_PATH"
        sudo -u ubuntu git checkout "$BRANCH"
    }
else
    echo "  새로 클론..."
    cd /home/ubuntu
    sudo -u ubuntu git clone "$REPO_URL" "$APP_NAME"
    cd "$DEPLOY_PATH"
    sudo -u ubuntu git checkout "$BRANCH"
fi
echo "  OK: 소스코드 준비 완료"
echo ""

# ==============================
# PART 2: 앱 빌드 및 시작
# ==============================
echo "[PART 2] 앱 빌드..."

# NVM
export NVM_DIR="/home/ubuntu/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
echo "  Node $(node -v 2>/dev/null || echo 'not found')"

# 기존 PM2 정리
pm2 stop ${APP_NAME} 2>/dev/null || true
pm2 stop ${APP_NAME}-collector 2>/dev/null || true
pm2 delete ${APP_NAME} 2>/dev/null || true
pm2 delete ${APP_NAME}-collector 2>/dev/null || true

# npm install
echo "  npm install..."
cd "$DEPLOY_PATH"
npm install --production=false 2>&1 | tail -3

# .env
if [ ! -f "$DEPLOY_PATH/.env" ]; then
    echo "  .env 생성..."
    cat > "$DEPLOY_PATH/.env" << 'ENVEOF'
DATABASE_URL="postgresql://postgres:postgres@172.17.0.1:5432/livenews?schema=public"
REDIS_URL="redis://172.17.0.1:6379"
XAI_API_KEY="YOUR_XAI_API_KEY_HERE"
XAI_MODEL="grok-4-1-fast"
NEXT_PUBLIC_BASE_URL="http://211.198.54.207/livenews"
NEXT_PUBLIC_APP_NAME="LiveNews"
APP_PORT=4000
NODE_ENV=production
ENVEOF
    echo "  >>> .env의 XAI_API_KEY를 실제 키로 수정하세요! <<<"
fi

# DB
echo "  데이터베이스..."
PG_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i postgres | head -1)
if [ -n "$PG_CONTAINER" ]; then
    docker exec -i "$PG_CONTAINER" psql -U postgres -c "CREATE DATABASE livenews;" 2>/dev/null || true
fi
npx prisma generate 2>&1 | tail -1
npx prisma db push --accept-data-loss 2>&1 | tail -2 || true
npx tsx prisma/seed.ts 2>&1 | tail -1 || true

# 빌드
echo "  Next.js 빌드..."
npm run build 2>&1 | tail -5

# PM2 시작
echo "  PM2 시작..."
chown -R ubuntu:ubuntu "$DEPLOY_PATH"
sudo -u ubuntu pm2 start ecosystem.config.js
sudo -u ubuntu pm2 save 2>/dev/null || true

# 시작 대기
echo "  앱 시작 대기..."
for i in $(seq 1 15); do
    sleep 2
    if ss -tlnp 2>/dev/null | grep -q ":${APP_PORT} "; then
        echo "  OK: 포트 ${APP_PORT} 리스닝!"
        break
    fi
    echo "  ... ($i/15)"
done

echo ""

# ==============================
# PART 3: iptables 방화벽
# ==============================
echo "[PART 3] iptables..."
iptables -C DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true
iptables -C DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true
ufw allow from 172.17.0.0/16 to any port ${APP_PORT} 2>/dev/null || true
ufw allow from 172.18.0.0/16 to any port ${APP_PORT} 2>/dev/null || true
echo "  OK"
echo ""

# ==============================
# PART 4: Docker nginx 프록시
# ==============================
echo "[PART 4] Docker nginx 프록시..."

if ! docker ps --format '{{.Names}}' | grep -q "^${NGINX_CONTAINER}$"; then
    echo "  오류: ${NGINX_CONTAINER} 없음!"
    exit 1
fi

# default.conf 가져오기
docker cp ${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf /tmp/nginx-default.conf
cp /tmp/nginx-default.conf /tmp/nginx-default.conf.bak

if grep -q "livenews" /tmp/nginx-default.conf; then
    echo "  이미 /livenews 설정 있음. 리로드만."
    docker exec ${NGINX_CONTAINER} nginx -s reload 2>/dev/null
else
    echo "  /livenews 설정 추가..."

    # inject-nginx.py와 nginx-livenews.conf 사용
    if [ -f "${DEPLOY_PATH}/inject-nginx.py" ] && [ -f "${DEPLOY_PATH}/nginx-livenews.conf" ]; then
        python3 "${DEPLOY_PATH}/inject-nginx.py" /tmp/nginx-default.conf "${DEPLOY_PATH}/nginx-livenews.conf"
    else
        # 파일이 없으면 직접 Python으로 삽입
        python3 << 'PYEOF'
import sys
with open('/tmp/nginx-default.conf', 'r') as f:
    conf = f.read()
if 'livenews' in conf:
    print('SKIP: already configured')
    sys.exit(0)
block = """
    # === LiveNews Proxy ===
    location /livenews {
        proxy_pass http://172.17.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    location /livenews/_next/static {
        proxy_pass http://172.17.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
"""
idx = conf.rfind('}')
if idx < 0:
    print('ERROR')
    sys.exit(1)
with open('/tmp/nginx-default.conf', 'w') as f:
    f.write(conf[:idx] + block + '\n' + conf[idx:])
print('OK')
PYEOF
    fi

    if [ $? -eq 0 ]; then
        docker cp /tmp/nginx-default.conf ${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf
        if docker exec ${NGINX_CONTAINER} nginx -t 2>&1; then
            docker exec ${NGINX_CONTAINER} nginx -s reload
            echo "  OK: nginx 설정 완료!"
        else
            echo "  설정 오류! 복원..."
            docker cp /tmp/nginx-default.conf.bak ${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf
            docker exec ${NGINX_CONTAINER} nginx -s reload
        fi
    else
        echo "  삽입 실패. 수동 설정 필요:"
        echo "    docker exec -it ${NGINX_CONTAINER} sh"
        echo "    vi /etc/nginx/conf.d/default.conf"
        echo "    (마지막 } 앞에 location /livenews 블록 추가)"
        echo "    nginx -t && nginx -s reload && exit"
    fi
fi
rm -f /tmp/nginx-default.conf /tmp/nginx-default.conf.bak
echo ""

# ==============================
# PART 5: 최종 테스트
# ==============================
echo "=============================="
echo "  최종 테스트"
echo "=============================="
sleep 3

echo ""
echo "PM2:"
pm2 list 2>/dev/null | grep -E "livenews|Name" || echo "  livenews 없음"
echo ""

echo "포트 ${APP_PORT}:"
ss -tlnp 2>/dev/null | grep ":${APP_PORT}" || echo "  리스닝 없음!"
echo ""

echo "iptables:"
iptables -L DOCKER-USER -n 2>/dev/null | grep "${APP_PORT}" || echo "  규칙 없음"
echo ""

echo "nginx 설정:"
docker exec ${NGINX_CONTAINER} grep "livenews" /etc/nginx/conf.d/default.conf 2>/dev/null || echo "  설정 없음!"
echo ""

echo -n "테스트 - 로컬: "
curl -s -o /dev/null -w "HTTP %{http_code}" "http://0.0.0.0:${APP_PORT}/livenews/" 2>/dev/null || echo "실패"
echo ""

echo -n "테스트 - Docker: "
curl -s -o /dev/null -w "HTTP %{http_code}" "http://172.17.0.1:${APP_PORT}/livenews/" 2>/dev/null || echo "실패"
echo ""

echo -n "테스트 - 외부: "
curl -s -o /dev/null -w "HTTP %{http_code}" "http://211.198.54.207/livenews/" 2>/dev/null || echo "실패"
echo ""

echo ""
echo "=============================="
echo "  완료!"
echo "=============================="
echo "  http://211.198.54.207/livenews/"
echo "  http://211.198.54.207/livenews/admin"
echo ""
