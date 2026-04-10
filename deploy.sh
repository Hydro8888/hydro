#!/bin/bash
#============================================
# Simburum 배포 스크립트
# 서버에 SSH 접속한 상태에서 직접 실행
# Usage: bash deploy.sh  (sudo 불필요)
#
# 사전 준비:
#   cd /home/ubuntu
#   git clone git@github.com:Hydro8888/hydro.git simburum
#   cd simburum
#   git checkout claude/simburum-platform-setup-z1r4o
#   bash deploy.sh
#============================================

set -e

APP_NAME="simburum"
APP_DIR="/home/ubuntu/simburum"
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

# 현재 위치 확인
if [ ! -f "$APP_DIR/package.json" ]; then
    echo "오류: $APP_DIR/package.json 이 없습니다."
    echo ""
    echo "먼저 아래 명령을 실행해주세요:"
    echo "  cd /home/ubuntu"
    echo "  git clone git@github.com:Hydro8888/hydro.git simburum"
    echo "  cd simburum"
    echo "  git checkout claude/simburum-platform-setup-z1r4o"
    echo "  bash deploy.sh"
    exit 1
fi

# 1. 포트 충돌 확인
echo "[1/8] 포트 $PORT 사용 여부 확인..."
if ss -tlnp 2>/dev/null | grep -q ":$PORT " || netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
    echo "  경고: 포트 $PORT이 이미 사용 중입니다."
    read -p "  계속 진행하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "배포를 중단합니다."
        exit 1
    fi
else
    echo "  포트 $PORT 사용 가능"
fi

# 2. 환경변수 설정
echo ""
echo "[2/8] 환경변수 설정..."
cd $APP_DIR
if [ ! -f "$APP_DIR/.env.local" ]; then
    echo "오류: .env.local 파일이 없습니다."
    echo ""
    echo "아래 명령으로 생성해주세요:"
    echo "cat > $APP_DIR/.env.local << 'EOF'"
    echo 'DATABASE_URL="file:./simburum.db"'
    echo 'NEXTAUTH_SECRET="simburum-secret-key-change-in-production-2024"'
    echo 'NEXTAUTH_URL="http://211.198.54.207/simburum"'
    echo 'XAI_API_KEY="여기에_API키_입력"'
    echo "EOF"
    exit 1
else
    echo "  .env.local 확인 완료"
fi

# 3. 의존성 설치
echo ""
echo "[3/8] 의존성 설치..."
npm install --production=false 2>&1 | tail -5

# 4. 데이터베이스 설정
echo ""
echo "[4/8] 데이터베이스 설정..."
npx prisma generate 2>&1 | tail -3
npx prisma db push 2>&1 | tail -3

# 시드 데이터 (DB가 비어있을 때만)
SEED_CHECK=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as cnt FROM User;" 2>/dev/null || echo "0")
if echo "$SEED_CHECK" | grep -q "^0$" || echo "$SEED_CHECK" | grep -q "cnt.*0" || [ $? -ne 0 ]; then
    echo "  시드 데이터 투입..."
    npx tsx prisma/seed.ts 2>&1 | tail -5
else
    echo "  시드 데이터 이미 존재"
fi

# 5. Next.js 빌드
echo ""
echo "[5/8] Next.js 빌드..."
echo "  빌드 중 CPU/메모리 사용량이 높아질 수 있습니다."
NODE_OPTIONS="--max-old-space-size=512" npm run build 2>&1 | tail -10

if [ $? -ne 0 ]; then
    echo "  빌드 실패! 로그를 확인해주세요."
    exit 1
fi

# 로그 디렉토리 생성
mkdir -p $APP_DIR/logs

# 6. iptables 방화벽 규칙 추가 (sudo 필요할 수 있음)
echo ""
echo "[6/8] 방화벽 규칙 설정..."
# sudo 없이 시도, 실패하면 sudo로 재시도
IPTABLES_CMD="iptables"
if ! $IPTABLES_CMD -C DOCKER-USER -p tcp --dport $PORT -s 172.17.0.0/16 -j ACCEPT 2>/dev/null; then
    $IPTABLES_CMD -I DOCKER-USER -p tcp --dport $PORT -s 172.17.0.0/16 -j ACCEPT 2>/dev/null || \
    sudo $IPTABLES_CMD -I DOCKER-USER -p tcp --dport $PORT -s 172.17.0.0/16 -j ACCEPT 2>/dev/null || \
    echo "  경고: iptables 규칙 추가 실패 (sudo 권한 필요할 수 있음)"
    echo "  172.17.0.0/16 → port $PORT 허용"
fi
if ! $IPTABLES_CMD -C DOCKER-USER -p tcp --dport $PORT -s 172.18.0.0/16 -j ACCEPT 2>/dev/null; then
    $IPTABLES_CMD -I DOCKER-USER -p tcp --dport $PORT -s 172.18.0.0/16 -j ACCEPT 2>/dev/null || \
    sudo $IPTABLES_CMD -I DOCKER-USER -p tcp --dport $PORT -s 172.18.0.0/16 -j ACCEPT 2>/dev/null || \
    echo "  경고: iptables 규칙 추가 실패 (sudo 권한 필요할 수 있음)"
    echo "  172.18.0.0/16 → port $PORT 허용"
fi
echo "  방화벽 규칙 완료"

# 7. Docker nginx 설정 업데이트
echo ""
echo "[7/8] Nginx 설정 업데이트..."

NGINX_CONF=$(docker exec $NGINX_CONTAINER cat /etc/nginx/conf.d/default.conf 2>/dev/null || echo "")

if [ -z "$NGINX_CONF" ]; then
    echo "  경고: Docker nginx 컨테이너($NGINX_CONTAINER)에 접근할 수 없습니다."
    echo "  nginx 설정을 수동으로 추가해주세요."
elif echo "$NGINX_CONF" | grep -q "location /simburum"; then
    echo "  Nginx simburum 설정 이미 존재"
else
    echo "  Nginx에 simburum location 블록 추가..."

    # 백업 생성
    echo "  [안전장치] default.conf 백업 생성..."
    docker exec $NGINX_CONTAINER cp /etc/nginx/conf.d/default.conf "/etc/nginx/conf.d/default.conf.bak.$(date +%Y%m%d%H%M%S)"

    # freeai와 동일한 패턴으로 default.conf 끝에 append
    docker exec $NGINX_CONTAINER sh -c 'cat >> /etc/nginx/conf.d/default.conf << '"'"'SIMEOF'"'"'

    # Simburum - AI 기반 생활대행 매칭 플랫폼
    location /simburum {
        proxy_pass http://172.17.0.1:4200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location /simburum/_next/static {
        proxy_pass http://172.17.0.1:4200/simburum/_next/static;
        proxy_cache_bypass $http_upgrade;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
SIMEOF'

    # nginx 설정 테스트
    echo "  Nginx 설정 테스트 중..."
    if docker exec $NGINX_CONTAINER nginx -t 2>&1; then
        docker exec $NGINX_CONTAINER nginx -s reload 2>&1
        echo "  Nginx 리로드 완료"
    else
        # 실패 시 복원
        echo "  !! Nginx 설정 테스트 실패! 백업에서 복원..."
        LATEST_BAK=$(docker exec $NGINX_CONTAINER sh -c "ls -t /etc/nginx/conf.d/default.conf.bak.* 2>/dev/null | head -1")
        if [ -n "$LATEST_BAK" ]; then
            docker exec $NGINX_CONTAINER cp "$LATEST_BAK" /etc/nginx/conf.d/default.conf
            echo "  복원 완료. 기존 서비스 영향 없음."
        fi
        echo "  수동으로 nginx 설정을 추가해주세요."
    fi
fi

# 8. PM2 시작/재시작
echo ""
echo "[8/8] PM2 프로세스 관리..."
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
echo "  외부 접속: http://211.198.54.207/simburum/"
echo "  도메인:    http://simburum.com (DNS 설정 후)"
echo ""
echo "  PM2 상태:  pm2 status"
echo "  PM2 로그:  pm2 logs simburum"
echo "  PM2 재시작: pm2 restart simburum"
echo "  DB 위치:   $APP_DIR/prisma/simburum.db"
echo ""
echo "  관리자: admin@simburum.com / admin1234"
echo "============================================"
echo ""

pm2 status
