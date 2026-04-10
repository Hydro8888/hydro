#!/bin/bash
#============================================
# Simburum 배포 스크립트
# 서버에 SSH 접속한 상태에서 직접 실행
# Usage: sudo bash deploy.sh
#============================================

set -e

APP_NAME="simburum"
APP_DIR="/home/ubuntu/simburum"
REPO_URL="git@github.com:Hydro8888/hydro.git"
BRANCH="claude/simburum-platform-setup-z1r4o"
PORT=4200
NGINX_CONTAINER="jobworld-nginx"

echo ""
echo "============================================"
echo "  Simburum 배포 시작"
echo "  도메인: simburum.com"
echo "  포트: $PORT"
echo "============================================"
echo ""

# 1. 포트 충돌 확인
echo "[1/8] 포트 $PORT 사용 여부 확인..."
if ss -tlnp | grep -q ":$PORT "; then
    echo "  경고: 포트 $PORT이 이미 사용 중입니다."
    echo "  현재 사용 프로세스:"
    ss -tlnp | grep ":$PORT "
    read -p "  계속 진행하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "배포를 중단합니다."
        exit 1
    fi
fi
echo "  포트 $PORT 사용 가능"

# 2. Git clone 또는 pull
echo ""
echo "[2/8] 소스코드 다운로드..."
if [ -d "$APP_DIR" ]; then
    echo "  기존 디렉토리 존재. git pull 실행..."
    cd $APP_DIR
    git fetch origin $BRANCH
    git checkout $BRANCH
    git pull origin $BRANCH
else
    echo "  새로 clone..."
    cd /home/ubuntu
    git clone $REPO_URL $APP_NAME
    cd $APP_DIR
    git checkout $BRANCH
fi

# 3. 환경변수 설정
echo ""
echo "[3/8] 환경변수 설정..."
if [ ! -f "$APP_DIR/.env.local" ]; then
    cat > "$APP_DIR/.env.local" << ENVEOF
DATABASE_URL="file:./simburum.db"
NEXTAUTH_SECRET="simburum-secret-key-change-in-production-2024"
NEXTAUTH_URL="http://211.198.54.207/simburum"
XAI_API_KEY="${XAI_API_KEY:-YOUR_XAI_API_KEY_HERE}"
ENVEOF
    echo "  .env.local 생성 완료"
    echo "  주의: XAI_API_KEY를 .env.local에 직접 설정해주세요"
else
    echo "  .env.local 이미 존재"
fi

# 4. 의존성 설치 및 빌드
echo ""
echo "[4/8] 의존성 설치..."
cd $APP_DIR
npm install --production=false 2>&1 | tail -3

echo ""
echo "[5/8] 데이터베이스 설정..."
npx prisma generate
npx prisma db push --accept-data-loss 2>&1 | tail -3

# 시드 데이터 (최초 1회만)
if [ ! -f "$APP_DIR/prisma/simburum.db" ] || [ ! -s "$APP_DIR/prisma/simburum.db" ]; then
    echo "  시드 데이터 투입..."
    npx tsx prisma/seed.ts 2>&1 | tail -3
fi

echo ""
echo "[6/8] Next.js 빌드..."
npm run build 2>&1 | tail -5

# 5. 로그 디렉토리 생성
mkdir -p $APP_DIR/logs

# 6. iptables 방화벽 규칙 추가
echo ""
echo "[7/8] 방화벽 규칙 설정..."
# DOCKER-USER 체인에 포트 허용 (Docker nginx에서 호스트 접근용)
if ! iptables -C DOCKER-USER -p tcp --dport $PORT -s 172.17.0.0/16 -j ACCEPT 2>/dev/null; then
    iptables -I DOCKER-USER -p tcp --dport $PORT -s 172.17.0.0/16 -j ACCEPT
    echo "  172.17.0.0/16 → port $PORT 허용 추가"
fi
if ! iptables -C DOCKER-USER -p tcp --dport $PORT -s 172.18.0.0/16 -j ACCEPT 2>/dev/null; then
    iptables -I DOCKER-USER -p tcp --dport $PORT -s 172.18.0.0/16 -j ACCEPT
    echo "  172.18.0.0/16 → port $PORT 허용 추가"
fi
echo "  방화벽 규칙 완료"

# 7. Docker nginx 설정 업데이트
echo ""
echo "[8/8] Nginx 설정 업데이트..."
# Docker nginx 컨테이너의 default.conf에 simburum location 블록 추가
NGINX_CONF=$(docker exec $NGINX_CONTAINER cat /etc/nginx/conf.d/default.conf 2>/dev/null)

if echo "$NGINX_CONF" | grep -q "location /simburum"; then
    echo "  Nginx simburum 설정 이미 존재"
else
    echo "  Nginx에 simburum location 블록 추가..."
    # default.conf의 마지막 } 앞에 location 블록 삽입
    docker exec $NGINX_CONTAINER sh -c "
    sed -i '/^}/i \\
    \\
    location /simburum {\\
        proxy_pass http://172.17.0.1:$PORT;\\
        proxy_http_version 1.1;\\
        proxy_set_header Upgrade \\\$http_upgrade;\\
        proxy_set_header Connection '\"'\"'upgrade'\"'\"';\\
        proxy_set_header Host \\\$host;\\
        proxy_set_header X-Real-IP \\\$remote_addr;\\
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;\\
        proxy_set_header X-Forwarded-Proto \\\$scheme;\\
        proxy_cache_bypass \\\$http_upgrade;\\
        proxy_read_timeout 86400;\\
    }\\
    \\
    location /simburum/_next/static {\\
        proxy_pass http://172.17.0.1:$PORT/simburum/_next/static;\\
        proxy_cache_bypass \\\$http_upgrade;\\
        expires 365d;\\
        add_header Cache-Control \"public, immutable\";\\
    }' /etc/nginx/conf.d/default.conf
    "

    # nginx 설정 테스트 및 리로드
    docker exec $NGINX_CONTAINER nginx -t 2>&1
    docker exec $NGINX_CONTAINER nginx -s reload 2>&1
    echo "  Nginx 리로드 완료"
fi

# 8. PM2 시작/재시작
echo ""
echo "PM2 프로세스 관리..."
cd $APP_DIR
if pm2 describe $APP_NAME > /dev/null 2>&1; then
    echo "  기존 프로세스 재시작..."
    pm2 restart $APP_NAME
else
    echo "  새 프로세스 시작..."
    pm2 start ecosystem.config.js
fi
pm2 save

echo ""
echo "============================================"
echo "  배포 완료!"
echo ""
echo "  내부 접속: http://172.30.1.99/simburum/"
echo "  외부 접속: http://211.198.54.207/simburum/"
echo "  도메인:    http://simburum.com (DNS 설정 후)"
echo ""
echo "  PM2 상태:  pm2 status"
echo "  PM2 로그:  pm2 logs simburum"
echo "  PM2 재시작: pm2 restart simburum"
echo "  DB 위치:   $APP_DIR/prisma/simburum.db"
echo "============================================"
echo ""

pm2 status
