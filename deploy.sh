#!/bin/bash
set -e

# ====================================================
# LiveNews 배포 스크립트
# 서버에 SSH 접속한 상태에서 직접 실행
# 사용법: sudo bash deploy.sh
# ====================================================

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  LiveNews 배포 스크립트${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ---- 설정값 ----
APP_NAME="livenews"
APP_PORT=4000
DEPLOY_PATH="/home/ubuntu/livenews"
REPO_URL="git@github.com:Hydro8888/hydro.git"
BRANCH="claude/global-news-platform-9p7Oo"
NGINX_CONTAINER="jobworld-nginx"

# ---- 1. 포트 현황 확인 ----
echo -e "${YELLOW}[1/10] 현재 포트 사용 현황 확인...${NC}"
echo "---------------------------------------"
echo "현재 사용 중인 주요 포트:"
ss -tlnp 2>/dev/null | grep -E ':(3000|3001|3002|3003|4000|5000|8000|8080)' || echo "  (주요 포트 사용 없음)"
echo ""

# 포트 4000 사용 확인
if ss -tlnp 2>/dev/null | grep -q ":${APP_PORT} "; then
    echo -e "${RED}경고: 포트 ${APP_PORT}이 이미 사용 중입니다!${NC}"
    echo "다른 포트를 사용하거나, 기존 프로세스를 중지하세요."
    read -p "계속 진행하시겠습니까? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "배포 중단."
        exit 1
    fi
fi
echo -e "${GREEN}포트 ${APP_PORT} 사용 예정${NC}"
echo ""

# ---- 2. PM2 현황 확인 ----
echo -e "${YELLOW}[2/10] PM2 프로세스 현황...${NC}"
pm2 list 2>/dev/null || echo "PM2 미설치 또는 실행 없음"
echo ""

# ---- 3. 기존 앱 정리 ----
echo -e "${YELLOW}[3/10] 기존 ${APP_NAME} 프로세스 정리...${NC}"
pm2 stop ${APP_NAME} 2>/dev/null || true
pm2 stop ${APP_NAME}-collector 2>/dev/null || true
pm2 delete ${APP_NAME} 2>/dev/null || true
pm2 delete ${APP_NAME}-collector 2>/dev/null || true
echo -e "${GREEN}완료${NC}"
echo ""

# ---- 4. 소스코드 배포 ----
echo -e "${YELLOW}[4/10] 소스코드 배포...${NC}"
if [ -d "$DEPLOY_PATH" ]; then
    echo "기존 디렉토리 발견. 업데이트 중..."
    cd "$DEPLOY_PATH"
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    echo "새로 클론..."
    cd /home/ubuntu
    git clone "$REPO_URL" "$APP_NAME"
    cd "$DEPLOY_PATH"
    git checkout "$BRANCH"
fi
echo -e "${GREEN}소스코드 배포 완료${NC}"
echo ""

# ---- 5. Node.js 의존성 설치 ----
echo -e "${YELLOW}[5/10] Node.js 의존성 설치...${NC}"

# NVM 설정 (있는 경우)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

node -v
npm -v

npm install --production=false 2>&1 | tail -3
echo -e "${GREEN}의존성 설치 완료${NC}"
echo ""

# ---- 6. 환경변수 설정 ----
echo -e "${YELLOW}[6/10] 환경변수 설정...${NC}"
if [ ! -f "$DEPLOY_PATH/.env" ]; then
    # Docker PostgreSQL/Redis 연결 정보 자동 감지
    POSTGRES_HOST="172.17.0.1"
    POSTGRES_PORT="5432"
    REDIS_HOST="172.17.0.1"
    REDIS_PORT="6379"

    # Docker에서 실행 중인 PostgreSQL 포트 확인
    DOCKER_PG_PORT=$(docker ps --format '{{.Ports}}' 2>/dev/null | grep -oP '\d+(?=->5432)' | head -1)
    if [ -n "$DOCKER_PG_PORT" ]; then
        POSTGRES_PORT="$DOCKER_PG_PORT"
        echo "Docker PostgreSQL 포트 감지: $POSTGRES_PORT"
    fi

    # Docker에서 실행 중인 Redis 포트 확인
    DOCKER_REDIS_PORT=$(docker ps --format '{{.Ports}}' 2>/dev/null | grep -oP '\d+(?=->6379)' | head -1)
    if [ -n "$DOCKER_REDIS_PORT" ]; then
        REDIS_PORT="$DOCKER_REDIS_PORT"
        echo "Docker Redis 포트 감지: $REDIS_PORT"
    fi

    cat > "$DEPLOY_PATH/.env" << ENVEOF
# Database (Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@${POSTGRES_HOST}:${POSTGRES_PORT}/livenews?schema=public"

# Redis (Docker)
REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"

# xAI Grok API
XAI_API_KEY="YOUR_XAI_API_KEY_HERE"
XAI_MODEL="grok-4-1-fast"

# App
NEXT_PUBLIC_BASE_URL="http://211.198.54.207/livenews"
NEXT_PUBLIC_APP_NAME="LiveNews"
APP_PORT=${APP_PORT}
NODE_ENV=production
ENVEOF
    echo -e "${GREEN}.env 파일 생성 완료${NC}"
else
    echo ".env 파일 이미 존재. 유지합니다."
fi
echo ""

# ---- 7. 데이터베이스 설정 ----
echo -e "${YELLOW}[7/10] 데이터베이스 설정...${NC}"

# PostgreSQL에 livenews DB 생성 시도
echo "livenews 데이터베이스 생성 시도..."
docker exec -i $(docker ps -q --filter "ancestor=postgres" 2>/dev/null | head -1) \
    psql -U postgres -c "CREATE DATABASE livenews;" 2>/dev/null || echo "DB가 이미 존재하거나 Docker PostgreSQL을 찾을 수 없습니다."

# Prisma 마이그레이션
npx prisma generate
npx prisma db push --accept-data-loss 2>&1 || echo "DB push 실패 - 수동 확인 필요"

# 시드 데이터
echo "소스 데이터 시딩..."
npx tsx prisma/seed.ts 2>&1 || echo "시딩 실패 - 수동 확인 필요"
echo -e "${GREEN}데이터베이스 설정 완료${NC}"
echo ""

# ---- 8. Next.js 빌드 ----
echo -e "${YELLOW}[8/10] Next.js 빌드...${NC}"
npm run build 2>&1 | tail -10
echo -e "${GREEN}빌드 완료${NC}"
echo ""

# ---- 9. PM2 시작 ----
echo -e "${YELLOW}[9/10] PM2 프로세스 시작...${NC}"
pm2 start ecosystem.config.js
pm2 save
echo -e "${GREEN}PM2 시작 완료${NC}"
echo ""

# ---- 10. Nginx 설정 ----
echo -e "${YELLOW}[10/10] Nginx 프록시 설정...${NC}"

# Nginx 타입 자동 감지 (Docker vs systemd)
NGINX_TYPE="none"

# 1순위: Docker nginx 컨테이너 확인
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "${NGINX_CONTAINER}"; then
    NGINX_TYPE="docker"
    echo "Docker nginx 컨테이너 감지: ${NGINX_CONTAINER}"
# 2순위: systemd nginx 확인
elif [ -d "/etc/nginx" ] && command -v nginx &>/dev/null; then
    NGINX_TYPE="systemd"
    echo "systemd nginx 감지: $(nginx -v 2>&1)"
else
    echo -e "${RED}nginx를 찾을 수 없습니다. 수동으로 설정하세요.${NC}"
fi

if [ "$NGINX_TYPE" = "systemd" ]; then
    # ===== systemd nginx 설정 =====
    # 기존 서버 블록의 nginx 설정 파일 찾기
    NGINX_MAIN_CONF=""

    # sites-enabled 에서 default 또는 기존 설정 파일 찾기
    if [ -f "/etc/nginx/sites-enabled/default" ]; then
        NGINX_MAIN_CONF="/etc/nginx/sites-enabled/default"
    elif [ -f "/etc/nginx/sites-available/default" ]; then
        NGINX_MAIN_CONF="/etc/nginx/sites-available/default"
    elif ls /etc/nginx/sites-enabled/*.conf 2>/dev/null | head -1 > /dev/null; then
        NGINX_MAIN_CONF=$(ls /etc/nginx/sites-enabled/*.conf 2>/dev/null | head -1)
    elif ls /etc/nginx/conf.d/*.conf 2>/dev/null | head -1 > /dev/null; then
        NGINX_MAIN_CONF=$(ls /etc/nginx/conf.d/*.conf 2>/dev/null | head -1)
    fi

    echo "기존 nginx 설정 파일: ${NGINX_MAIN_CONF:-미발견}"

    # 이미 livenews 설정이 있는지 확인
    if grep -rq "livenews" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null; then
        echo "nginx에 이미 /livenews 설정이 있습니다."
    else
        echo "nginx에 /livenews 프록시 설정 추가..."

        # conf.d에 별도 설정 파일 생성 (include되는 방식)
        # 주의: 별도 server 블록이 아닌, 기존 server 블록에 포함되는 snippet 사용
        # nginx의 include 구조에 따라 conf.d 또는 기존 설정에 location 추가

        # 방법 1: 기존 default 설정에 location 블록 직접 삽입
        if [ -n "$NGINX_MAIN_CONF" ] && [ -f "$NGINX_MAIN_CONF" ]; then
            # 백업
            cp "$NGINX_MAIN_CONF" "${NGINX_MAIN_CONF}.bak.$(date +%Y%m%d%H%M%S)"

            # 기존 server 블록의 마지막 } 앞에 location 블록 삽입
            # 다른 서비스들 (/hacker, /jobworld 등)도 이 방식으로 추가됨
            sed -i '/^[[:space:]]*#.*livenews/d' "$NGINX_MAIN_CONF"

            # 마지막 닫는 중괄호 } 앞에 livenews location 추가
            # tac으로 뒤집어서 첫 번째 }를 찾아 그 앞에 삽입
            LIVENEWS_BLOCK=$(cat << 'LOCATIONEOF'

    # === LiveNews Proxy ===
    location /livenews {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    location /livenews/_next/static {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
LOCATIONEOF
)
            # Python으로 안전하게 마지막 } 앞에 삽입
            python3 -c "
import sys
conf = open('$NGINX_MAIN_CONF').read()
# 마지막 } 앞에 삽입
last_brace = conf.rfind('}')
if last_brace >= 0:
    block = '''
    # === LiveNews Proxy ===
    location /livenews {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    location /livenews/_next/static {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \\\$host;
        expires 30d;
        add_header Cache-Control \"public, immutable\";
    }
'''
    new_conf = conf[:last_brace] + block + '\n' + conf[last_brace:]
    open('$NGINX_MAIN_CONF', 'w').write(new_conf)
    print('location 블록 삽입 완료')
else:
    print('ERROR: 닫는 중괄호를 찾을 수 없습니다')
    sys.exit(1)
"
        else
            # 방법 2: conf.d에 독립 설정 파일 생성 (기존 설정이 없는 경우)
            echo "기존 설정 파일 없음. /etc/nginx/conf.d/livenews.conf 생성..."
            cat > /etc/nginx/conf.d/livenews.conf << NGINXEOF
# LiveNews Proxy - 기존 server 블록에 포함되어야 합니다
# 만약 이 파일이 동작하지 않으면, 기본 서버 설정에 아래 location 블록을 직접 추가하세요
server {
    listen 80;
    server_name 211.198.54.207;

    location /livenews {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    location /livenews/_next/static {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF
        fi

        # nginx 설정 테스트 및 리로드
        echo "nginx 설정 테스트..."
        if nginx -t 2>&1; then
            echo "nginx 리로드..."
            systemctl reload nginx
            echo -e "${GREEN}systemd nginx 설정 완료${NC}"
        else
            echo -e "${RED}nginx 설정 오류! 백업에서 복원합니다.${NC}"
            if [ -n "$NGINX_MAIN_CONF" ] && ls "${NGINX_MAIN_CONF}.bak."* 2>/dev/null | tail -1 > /dev/null; then
                LATEST_BAK=$(ls "${NGINX_MAIN_CONF}.bak."* 2>/dev/null | tail -1)
                cp "$LATEST_BAK" "$NGINX_MAIN_CONF"
                nginx -t && systemctl reload nginx
                echo "백업에서 복원 완료"
            fi
            echo -e "${RED}수동으로 nginx 설정을 확인하세요.${NC}"
        fi
    fi

elif [ "$NGINX_TYPE" = "docker" ]; then
    # ===== Docker nginx 설정 =====
    NGINX_CONF_CHECK=$(docker exec ${NGINX_CONTAINER} grep -c "livenews" /etc/nginx/conf.d/default.conf 2>/dev/null || echo "0")

    if [ "$NGINX_CONF_CHECK" = "0" ]; then
        echo "Docker nginx에 /livenews 프록시 설정 추가..."
        docker exec ${NGINX_CONTAINER} cp /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak

        # Docker 환경에서는 172.17.0.1 (Docker bridge) 사용
        docker exec ${NGINX_CONTAINER} sh -c "sed -i '/^}/i \\
    location /livenews { \\
        proxy_pass http://172.17.0.1:${APP_PORT}; \\
        proxy_http_version 1.1; \\
        proxy_set_header Upgrade \\\$http_upgrade; \\
        proxy_set_header Connection \"upgrade\"; \\
        proxy_set_header Host \\\$host; \\
        proxy_set_header X-Real-IP \\\$remote_addr; \\
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for; \\
        proxy_set_header X-Forwarded-Proto \\\$scheme; \\
        proxy_cache_bypass \\\$http_upgrade; \\
        proxy_read_timeout 60s; \\
    } \\
    \\
    location /livenews/_next/static { \\
        proxy_pass http://172.17.0.1:${APP_PORT}; \\
        proxy_http_version 1.1; \\
        proxy_set_header Host \\\$host; \\
        expires 30d; \\
        add_header Cache-Control \"public, immutable\"; \\
    }' /etc/nginx/conf.d/default.conf"

        if docker exec ${NGINX_CONTAINER} nginx -t 2>&1; then
            docker exec ${NGINX_CONTAINER} nginx -s reload
            echo -e "${GREEN}Docker nginx 설정 완료${NC}"
        else
            echo -e "${RED}Docker nginx 설정 오류! 백업에서 복원합니다.${NC}"
            docker exec ${NGINX_CONTAINER} cp /etc/nginx/conf.d/default.conf.bak /etc/nginx/conf.d/default.conf
            docker exec ${NGINX_CONTAINER} nginx -s reload
        fi
    else
        echo "Docker nginx에 이미 /livenews 설정이 있습니다."
    fi
fi
echo ""

# ---- iptables 규칙 추가 (Docker nginx인 경우만) ----
if [ "$NGINX_TYPE" = "docker" ]; then
    echo -e "${YELLOW}iptables 방화벽 규칙 추가 (Docker 환경)...${NC}"

    iptables -C DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
        iptables -I DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true

    iptables -C DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
        iptables -I DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true

    echo -e "${GREEN}iptables 규칙 추가 완료${NC}"
else
    echo -e "${YELLOW}systemd nginx 환경 - iptables Docker 규칙 불필요 (localhost 통신)${NC}"
fi
echo ""

# ---- 배포 완료 ----
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  배포 완료!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "  앱 이름:    ${APP_NAME}"
echo "  포트:       ${APP_PORT}"
echo "  경로:       ${DEPLOY_PATH}"
echo "  접속 URL:   http://211.198.54.207/livenews/"
echo "  관리자:     http://211.198.54.207/livenews/admin"
echo ""
echo "  PM2 상태 확인: pm2 status"
echo "  로그 확인:     pm2 logs ${APP_NAME}"
echo "  재시작:        pm2 restart ${APP_NAME}"
echo ""

# 상태 확인
echo -e "${YELLOW}PM2 프로세스 상태:${NC}"
pm2 list | grep -E "${APP_NAME}|Name"

echo ""
echo -e "${YELLOW}서비스 접속 테스트:${NC}"
sleep 3
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://127.0.0.1:${APP_PORT}/livenews/" 2>/dev/null || echo "로컬 접속 테스트 실패 (앱 시작 대기 중일 수 있음)"

echo ""
echo -e "${GREEN}배포가 완료되었습니다!${NC}"
