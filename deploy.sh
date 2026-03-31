#!/bin/bash
set -e

# ====================================================
# LiveNews 배포 스크립트
# 서버에 SSH 접속한 상태에서 직접 실행
# 사용법: sudo bash deploy.sh
# ====================================================
#
# 서버 구조:
#   인터넷 → Docker nginx (jobworld-nginx, 포트 80) → 호스트 앱
#   Docker nginx는 172.17.0.1 (docker0 bridge)로 호스트 앱에 접근
#   앱은 반드시 0.0.0.0에 바인딩해야 Docker에서 접근 가능
#   iptables DOCKER-USER 체인에 포트 허용 필수
#
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
DOCKER_HOST_IP="172.17.0.1"  # Docker bridge에서 호스트로 접근하는 IP

# ---- 1. 포트 현황 확인 ----
echo -e "${YELLOW}[1/11] 현재 포트 사용 현황 확인...${NC}"
echo "---------------------------------------"
echo "현재 사용 중인 주요 포트:"
ss -tlnp 2>/dev/null | grep -E ':(3000|3001|3002|3003|4000|5000|8000|8080)' || echo "  (주요 포트 사용 없음)"
echo ""
echo "Docker 컨테이너 현황:"
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}" 2>/dev/null || echo "  Docker 미실행"
echo ""

# 포트 4000 사용 확인
if ss -tlnp 2>/dev/null | grep -q ":${APP_PORT} "; then
    echo -e "${YELLOW}경고: 포트 ${APP_PORT}이 이미 사용 중입니다. 기존 프로세스를 정리합니다.${NC}"
fi
echo -e "${GREEN}포트 ${APP_PORT} 사용 예정${NC}"
echo ""

# ---- 2. PM2 현황 확인 ----
echo -e "${YELLOW}[2/11] PM2 프로세스 현황...${NC}"
pm2 list 2>/dev/null || echo "PM2 미설치 또는 실행 없음"
echo ""

# ---- 3. 기존 앱 정리 ----
echo -e "${YELLOW}[3/11] 기존 ${APP_NAME} 프로세스 정리...${NC}"
pm2 stop ${APP_NAME} 2>/dev/null || true
pm2 stop ${APP_NAME}-collector 2>/dev/null || true
pm2 delete ${APP_NAME} 2>/dev/null || true
pm2 delete ${APP_NAME}-collector 2>/dev/null || true
echo -e "${GREEN}완료${NC}"
echo ""

# ---- 4. 소스코드 배포 ----
echo -e "${YELLOW}[4/11] 소스코드 배포...${NC}"
if [ -d "$DEPLOY_PATH" ]; then
    echo "기존 디렉토리 발견. 업데이트 중..."
    cd "$DEPLOY_PATH"
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
    git reset --hard "origin/$BRANCH"
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
echo -e "${YELLOW}[5/11] Node.js 의존성 설치...${NC}"

# NVM 설정 (있는 경우)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Node: $(node -v), npm: $(npm -v)"

npm install --production=false 2>&1 | tail -3
echo -e "${GREEN}의존성 설치 완료${NC}"
echo ""

# ---- 6. 환경변수 설정 ----
echo -e "${YELLOW}[6/11] 환경변수 설정...${NC}"
if [ ! -f "$DEPLOY_PATH/.env" ]; then
    # Docker PostgreSQL/Redis 연결 정보 자동 감지
    POSTGRES_HOST="${DOCKER_HOST_IP}"
    POSTGRES_PORT="5432"
    REDIS_HOST="${DOCKER_HOST_IP}"
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
    echo -e "${RED}중요: .env의 XAI_API_KEY를 실제 키로 교체하세요!${NC}"
else
    echo ".env 파일 이미 존재. 유지합니다."
fi
echo ""

# ---- 7. 데이터베이스 설정 ----
echo -e "${YELLOW}[7/11] 데이터베이스 설정...${NC}"

# Docker PostgreSQL 컨테이너 찾기
PG_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i postgres | head -1)
if [ -n "$PG_CONTAINER" ]; then
    echo "PostgreSQL 컨테이너: $PG_CONTAINER"
    docker exec -i "$PG_CONTAINER" psql -U postgres -c "CREATE DATABASE livenews;" 2>/dev/null || echo "DB가 이미 존재합니다."
else
    echo -e "${YELLOW}Docker PostgreSQL 컨테이너를 찾을 수 없습니다. 수동 확인 필요.${NC}"
fi

# Prisma 마이그레이션
npx prisma generate
npx prisma db push --accept-data-loss 2>&1 || echo "DB push 실패 - 수동 확인 필요"

# 시드 데이터
echo "소스 데이터 시딩..."
npx tsx prisma/seed.ts 2>&1 || echo "시딩 실패 - 수동 확인 필요"
echo -e "${GREEN}데이터베이스 설정 완료${NC}"
echo ""

# ---- 8. Next.js 빌드 ----
echo -e "${YELLOW}[8/11] Next.js 빌드...${NC}"
npm run build 2>&1 | tail -10
echo -e "${GREEN}빌드 완료${NC}"
echo ""

# ---- 9. PM2 시작 ----
echo -e "${YELLOW}[9/11] PM2 프로세스 시작...${NC}"
# 주의: Next.js는 0.0.0.0에 바인딩해야 Docker nginx에서 접근 가능
pm2 start ecosystem.config.js
pm2 save
echo -e "${GREEN}PM2 시작 완료${NC}"
echo ""

# 앱이 시작될 때까지 대기
echo "앱 시작 대기 중..."
for i in $(seq 1 10); do
    if curl -s -o /dev/null -w "%{http_code}" "http://0.0.0.0:${APP_PORT}/livenews/" 2>/dev/null | grep -q "200\|304"; then
        echo -e "${GREEN}앱 시작 확인!${NC}"
        break
    fi
    echo "  대기 중... ($i/10)"
    sleep 2
done
echo ""

# ---- 10. iptables 방화벽 설정 ----
echo -e "${YELLOW}[10/11] iptables 방화벽 규칙 추가...${NC}"
echo "Docker nginx → 호스트 포트 ${APP_PORT} 접근 허용"

# DOCKER-USER 체인에 규칙 추가 (Docker 네트워크에서 앱 포트 접근 허용)
# 이것이 없으면 Docker nginx가 호스트의 포트 4000에 접근 불가!
iptables -C DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true

iptables -C DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true

echo -e "${GREEN}iptables 규칙 추가 완료${NC}"

# UFW도 설정 (재부팅 후에도 유지)
if command -v ufw &>/dev/null; then
    ufw allow from 172.17.0.0/16 to any port ${APP_PORT} 2>/dev/null || true
    ufw allow from 172.18.0.0/16 to any port ${APP_PORT} 2>/dev/null || true
    echo "UFW 규칙도 추가 완료"
fi
echo ""

# ---- 11. Docker nginx 프록시 설정 ----
echo -e "${YELLOW}[11/11] Docker nginx (${NGINX_CONTAINER}) 프록시 설정...${NC}"

# Docker nginx 컨테이너 확인
if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${NGINX_CONTAINER}$"; then
    echo -e "${RED}오류: Docker nginx 컨테이너 '${NGINX_CONTAINER}'를 찾을 수 없습니다!${NC}"
    echo "실행 중인 컨테이너:"
    docker ps --format '{{.Names}}' 2>/dev/null
    echo ""
    echo -e "${RED}수동으로 nginx 설정을 추가하세요.${NC}"
else
    # 현재 default.conf에 livenews 설정이 있는지 확인
    HAS_LIVENEWS=$(docker exec ${NGINX_CONTAINER} grep -c "livenews" /etc/nginx/conf.d/default.conf 2>/dev/null || echo "0")

    if [ "$HAS_LIVENEWS" != "0" ]; then
        echo "Docker nginx에 이미 /livenews 설정이 있습니다. 스킵."
    else
        echo "Docker nginx default.conf에 /livenews location 블록 추가..."

        # 현재 설정 백업
        docker exec ${NGINX_CONTAINER} cp /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak

        # 현재 default.conf 내용 확인 (디버그용)
        echo "현재 default.conf 구조:"
        docker exec ${NGINX_CONTAINER} head -5 /etc/nginx/conf.d/default.conf

        # default.conf의 server 블록 마지막 } 앞에 location 블록 삽입
        # 방법: 임시 파일에 새 설정 작성 후 교체
        docker exec ${NGINX_CONTAINER} sh -c '
CONF="/etc/nginx/conf.d/default.conf"
TEMP="/tmp/default.conf.new"

# Python이 있으면 Python 사용, 없으면 awk 사용
if command -v python3 >/dev/null 2>&1; then
    python3 -c "
conf = open(\"$CONF\").read()
block = \"\"\"
    # === LiveNews Proxy ===
    location /livenews {
        proxy_pass http://'"${DOCKER_HOST_IP}"':'"${APP_PORT}"';
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\\\\$http_upgrade;
        proxy_set_header Connection \\\"upgrade\\\";
        proxy_set_header Host \\\\\\$host;
        proxy_set_header X-Real-IP \\\\\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\\\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\\\\$scheme;
        proxy_cache_bypass \\\\\\$http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    location /livenews/_next/static {
        proxy_pass http://'"${DOCKER_HOST_IP}"':'"${APP_PORT}"';
        proxy_http_version 1.1;
        proxy_set_header Host \\\\\\$host;
        expires 30d;
        add_header Cache-Control \\\"public, immutable\\\";
    }
\"\"\"
idx = conf.rfind(\"}\")
if idx >= 0:
    new_conf = conf[:idx] + block + \"\\n\" + conf[idx:]
    open(\"$CONF\", \"w\").write(new_conf)
    print(\"OK: location block injected via python3\")
else:
    print(\"ERROR: no closing brace found\")
    exit(1)
"
else
    # awk 방법: 마지막 } 앞에 삽입
    awk -v block="\\n    # === LiveNews Proxy ===\\n    location /livenews {\\n        proxy_pass http://'"${DOCKER_HOST_IP}"':'"${APP_PORT}"';\\n        proxy_http_version 1.1;\\n        proxy_set_header Host \\$host;\\n        proxy_set_header X-Real-IP \\$remote_addr;\\n        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;\\n        proxy_cache_bypass \\$http_upgrade;\\n        proxy_read_timeout 60s;\\n    }\\n\\n    location /livenews/_next/static {\\n        proxy_pass http://'"${DOCKER_HOST_IP}"':'"${APP_PORT}"';\\n        proxy_http_version 1.1;\\n        proxy_set_header Host \\$host;\\n        expires 30d;\\n    }\\n" \
    "BEGIN{found=0} {lines[NR]=\$0} END{for(i=NR;i>=1;i--){if(lines[i]~/^}/ && !found){found=1;print block;} print lines[i];}}" "$CONF" | tac > "$TEMP"
    if [ -s "$TEMP" ]; then
        cp "$TEMP" "$CONF"
        echo "OK: location block injected via awk"
    else
        echo "ERROR: awk injection failed"
        exit 1
    fi
fi
'
        # 결과 확인
        if [ $? -eq 0 ]; then
            echo "location 블록 삽입 완료. nginx 설정 테스트..."
            if docker exec ${NGINX_CONTAINER} nginx -t 2>&1; then
                docker exec ${NGINX_CONTAINER} nginx -s reload
                echo -e "${GREEN}Docker nginx 설정 완료 및 리로드!${NC}"
            else
                echo -e "${RED}nginx 설정 오류! 백업에서 복원합니다.${NC}"
                docker exec ${NGINX_CONTAINER} cp /etc/nginx/conf.d/default.conf.bak /etc/nginx/conf.d/default.conf
                docker exec ${NGINX_CONTAINER} nginx -s reload
                echo -e "${RED}수동으로 설정을 확인하세요.${NC}"
                echo ""
                echo "수동 설정 방법:"
                echo "  docker exec -it ${NGINX_CONTAINER} vi /etc/nginx/conf.d/default.conf"
                echo "  server 블록의 마지막 } 앞에 아래 내용 추가:"
                echo ""
                echo "    location /livenews {"
                echo "        proxy_pass http://${DOCKER_HOST_IP}:${APP_PORT};"
                echo "        proxy_http_version 1.1;"
                echo "        proxy_set_header Host \$host;"
                echo "        proxy_set_header X-Real-IP \$remote_addr;"
                echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
                echo "        proxy_cache_bypass \$http_upgrade;"
                echo "        proxy_read_timeout 60s;"
                echo "    }"
            fi
        else
            echo -e "${RED}location 블록 삽입 실패. 수동 설정이 필요합니다.${NC}"
            echo ""
            echo "===== 수동 설정 방법 ====="
            echo "1. docker exec -it ${NGINX_CONTAINER} sh"
            echo "2. vi /etc/nginx/conf.d/default.conf"
            echo "3. server { } 블록의 마지막 } 바로 앞에 아래 추가:"
            echo ""
            cat << 'MANUALEOF'
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
MANUALEOF
            echo ""
            echo "4. nginx -t && nginx -s reload"
            echo "5. exit"
        fi
    fi
fi
echo ""

# ---- 배포 완료 ----
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  배포 완료!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "  앱 이름:    ${APP_NAME}"
echo "  포트:       ${APP_PORT} (0.0.0.0 바인딩)"
echo "  경로:       ${DEPLOY_PATH}"
echo "  접속 URL:   http://211.198.54.207/livenews/"
echo "  관리자:     http://211.198.54.207/livenews/admin"
echo ""
echo "  PM2 상태 확인:    pm2 status"
echo "  로그 확인:        pm2 logs ${APP_NAME}"
echo "  재시작:           pm2 restart ${APP_NAME}"
echo "  nginx 설정 확인:  docker exec ${NGINX_CONTAINER} cat /etc/nginx/conf.d/default.conf"
echo ""

# ---- 상태 확인 ----
echo -e "${YELLOW}=== 최종 상태 확인 ===${NC}"
echo ""

echo "1. PM2 프로세스:"
pm2 list | grep -E "${APP_NAME}|Name" || true
echo ""

echo "2. 포트 리스닝 확인:"
ss -tlnp 2>/dev/null | grep ":${APP_PORT}" || echo "  포트 ${APP_PORT} 리스닝 없음!"
echo ""

echo "3. 로컬 접속 테스트 (0.0.0.0:${APP_PORT}):"
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://0.0.0.0:${APP_PORT}/livenews/" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    echo -e "  ${GREEN}성공! HTTP ${HTTP_CODE}${NC}"
else
    echo -e "  ${RED}실패: HTTP ${HTTP_CODE}${NC}"
    echo "  pm2 logs ${APP_NAME} --lines 20 으로 로그를 확인하세요."
fi
echo ""

echo "4. Docker nginx 프록시 테스트:"
PROXY_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://211.198.54.207/livenews/" 2>/dev/null || echo "000")
if [ "$PROXY_CODE" = "200" ] || [ "$PROXY_CODE" = "304" ]; then
    echo -e "  ${GREEN}성공! HTTP ${PROXY_CODE}${NC}"
else
    echo -e "  ${RED}실패: HTTP ${PROXY_CODE}${NC}"
    echo "  nginx 설정과 iptables를 확인하세요."
fi
echo ""

echo -e "${GREEN}배포가 완료되었습니다!${NC}"
