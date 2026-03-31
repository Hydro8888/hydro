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
# (볼륨 마운트 방식 - 호스트 파일 직접 편집)
# ==============================
echo "[PART 4] Docker nginx 프록시..."

# nginx 설정 파일을 호스트에서 찾기
# (jobworld-nginx는 호스트 파일을 볼륨 마운트하므로 docker cp 불가)
NGINX_CONF=""
for p in \
    "/home/ubuntu/hydro/jobworld/nginx/nginx.conf" \
    "/home/ubuntu/hydro/jobworld/nginx/default.conf" \
    "/home/ubuntu/hydro/jobworld/nginx/conf.d/default.conf" \
    "/home/ubuntu/jobworld/nginx/nginx.conf" \
    "/home/ubuntu/jobworld/nginx/default.conf"; do
    if [ -f "$p" ]; then
        NGINX_CONF="$p"
        break
    fi
done

# Docker inspect로도 확인
if [ -z "$NGINX_CONF" ]; then
    NGINX_HOST=$(docker inspect ${NGINX_CONTAINER} --format='{{range .Mounts}}{{if eq .Type "bind"}}{{.Source}}{{"\n"}}{{end}}{{end}}' 2>/dev/null | grep -i nginx | head -1)
    [ -f "$NGINX_HOST" ] && NGINX_CONF="$NGINX_HOST"
fi

# find로 최종 검색
if [ -z "$NGINX_CONF" ]; then
    NGINX_CONF=$(find /home/ubuntu -path "*jobworld*nginx*" -name "*.conf" -type f 2>/dev/null | head -1)
fi

if [ -z "$NGINX_CONF" ] || [ ! -f "$NGINX_CONF" ]; then
    echo "  nginx 설정 파일을 찾을 수 없습니다!"
    echo "  수동 검색: find /home/ubuntu -name 'nginx.conf' | grep jobworld"
else
    echo "  설정 파일: $NGINX_CONF"

    if grep -q "livenews" "$NGINX_CONF"; then
        echo "  이미 /livenews 설정 있음. 리로드만."
        docker exec ${NGINX_CONTAINER} nginx -s reload 2>/dev/null
    else
        echo "  /livenews 설정 추가..."
        cp "$NGINX_CONF" "${NGINX_CONF}.bak"

        # inject-nginx.py 사용 ($ 변수 문제 없음)
        if [ -f "${DEPLOY_PATH}/inject-nginx.py" ] && [ -f "${DEPLOY_PATH}/nginx-livenews.conf" ]; then
            python3 "${DEPLOY_PATH}/inject-nginx.py" "$NGINX_CONF" "${DEPLOY_PATH}/nginx-livenews.conf"
        fi

        if [ $? -eq 0 ] && grep -q "livenews" "$NGINX_CONF"; then
            echo "  삽입 성공!"
            if docker exec ${NGINX_CONTAINER} nginx -t 2>&1; then
                docker exec ${NGINX_CONTAINER} nginx -s reload
                echo "  OK: nginx 리로드 완료!"
            else
                echo "  nginx 오류! 백업 복원..."
                cp "${NGINX_CONF}.bak" "$NGINX_CONF"
                docker exec ${NGINX_CONTAINER} nginx -s reload
            fi
        else
            echo "  삽입 실패. 수동 설정:"
            echo "    vi $NGINX_CONF"
            echo "    마지막 } 앞에 아래 추가:"
            cat "${DEPLOY_PATH}/nginx-livenews.conf" 2>/dev/null || echo "    location /livenews { proxy_pass http://172.17.0.1:4000; }"
            echo "    docker exec ${NGINX_CONTAINER} nginx -t && docker exec ${NGINX_CONTAINER} nginx -s reload"
        fi
    fi
fi
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
