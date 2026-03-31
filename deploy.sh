#!/bin/bash
set -e

# ====================================================
# LiveNews 배포 스크립트
# 서버에 SSH 접속한 상태에서 직접 실행
# 사용법: sudo bash deploy.sh
#
# 서버 구조:
#   인터넷 :80 → Docker nginx (jobworld-nginx)
#                  → proxy_pass http://172.17.0.1:PORT
#                  → 호스트 PM2 앱 (0.0.0.0:PORT)
#
#   필수 조건:
#   1. 앱은 0.0.0.0 바인딩 (Docker에서 접근 가능)
#   2. iptables DOCKER-USER 체인에 포트 허용
#   3. Docker nginx default.conf에 location 블록 추가
# ====================================================

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
DOCKER_HOST_IP="172.17.0.1"

# ---- 1. 포트 현황 확인 ----
echo -e "${YELLOW}[1/11] 포트 현황 확인...${NC}"
ss -tlnp 2>/dev/null | grep -E ':(3000|3001|3002|3003|4000|5000|8000|8080)' || echo "  (주요 포트 사용 없음)"
echo ""

# ---- 2. PM2 현황 ----
echo -e "${YELLOW}[2/11] PM2 현황...${NC}"
pm2 list 2>/dev/null || true
echo ""

# ---- 3. 기존 앱 정리 ----
echo -e "${YELLOW}[3/11] 기존 ${APP_NAME} 정리...${NC}"
pm2 stop ${APP_NAME} 2>/dev/null || true
pm2 stop ${APP_NAME}-collector 2>/dev/null || true
pm2 delete ${APP_NAME} 2>/dev/null || true
pm2 delete ${APP_NAME}-collector 2>/dev/null || true
echo -e "${GREEN}완료${NC}"
echo ""

# ---- 4. 소스코드 ----
echo -e "${YELLOW}[4/11] 소스코드 배포...${NC}"
if [ -d "$DEPLOY_PATH" ]; then
    cd "$DEPLOY_PATH"
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
    git reset --hard "origin/$BRANCH"
else
    cd /home/ubuntu
    git clone "$REPO_URL" "$APP_NAME"
    cd "$DEPLOY_PATH"
    git checkout "$BRANCH"
fi
echo -e "${GREEN}완료${NC}"
echo ""

# ---- 5. Node.js 설치 ----
echo -e "${YELLOW}[5/11] Node.js 의존성 설치...${NC}"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
echo "Node: $(node -v), npm: $(npm -v)"
npm install --production=false 2>&1 | tail -3
echo -e "${GREEN}완료${NC}"
echo ""

# ---- 6. 환경변수 ----
echo -e "${YELLOW}[6/11] 환경변수 설정...${NC}"
if [ ! -f "$DEPLOY_PATH/.env" ]; then
    PG_HOST="${DOCKER_HOST_IP}"
    PG_PORT="5432"
    REDIS_HOST="${DOCKER_HOST_IP}"
    REDIS_PORT="6379"

    DOCKER_PG_PORT=$(docker ps --format '{{.Ports}}' 2>/dev/null | grep -oP '\d+(?=->5432)' | head -1)
    [ -n "$DOCKER_PG_PORT" ] && PG_PORT="$DOCKER_PG_PORT" && echo "PostgreSQL 포트: $PG_PORT"

    DOCKER_REDIS_PORT=$(docker ps --format '{{.Ports}}' 2>/dev/null | grep -oP '\d+(?=->6379)' | head -1)
    [ -n "$DOCKER_REDIS_PORT" ] && REDIS_PORT="$DOCKER_REDIS_PORT" && echo "Redis 포트: $REDIS_PORT"

    cat > "$DEPLOY_PATH/.env" << ENVEOF
DATABASE_URL="postgresql://postgres:postgres@${PG_HOST}:${PG_PORT}/livenews?schema=public"
REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"
XAI_API_KEY="YOUR_XAI_API_KEY_HERE"
XAI_MODEL="grok-4-1-fast"
NEXT_PUBLIC_BASE_URL="http://211.198.54.207/livenews"
NEXT_PUBLIC_APP_NAME="LiveNews"
APP_PORT=${APP_PORT}
NODE_ENV=production
ENVEOF
    echo -e "${GREEN}.env 생성 완료${NC}"
    echo -e "${RED}중요: .env의 XAI_API_KEY를 실제 키로 교체하세요!${NC}"
else
    echo ".env 이미 존재. 유지."
fi
echo ""

# ---- 7. 데이터베이스 ----
echo -e "${YELLOW}[7/11] 데이터베이스 설정...${NC}"
PG_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i postgres | head -1)
if [ -n "$PG_CONTAINER" ]; then
    echo "PostgreSQL 컨테이너: $PG_CONTAINER"
    docker exec -i "$PG_CONTAINER" psql -U postgres -c "CREATE DATABASE livenews;" 2>/dev/null || echo "DB 이미 존재"
fi
npx prisma generate 2>&1 | tail -2
npx prisma db push --accept-data-loss 2>&1 | tail -3 || echo "DB push 실패"
npx tsx prisma/seed.ts 2>&1 | tail -2 || echo "시딩 실패"
echo -e "${GREEN}완료${NC}"
echo ""

# ---- 8. 빌드 ----
echo -e "${YELLOW}[8/11] Next.js 빌드...${NC}"
npm run build 2>&1 | tail -10
echo -e "${GREEN}완료${NC}"
echo ""

# ---- 9. PM2 시작 ----
echo -e "${YELLOW}[9/11] PM2 시작...${NC}"
pm2 start ecosystem.config.js
pm2 save
echo -e "${GREEN}완료${NC}"
echo ""

# 앱 시작 대기
echo "앱 시작 대기..."
for i in $(seq 1 15); do
    sleep 2
    if ss -tlnp 2>/dev/null | grep -q ":${APP_PORT} "; then
        echo -e "${GREEN}포트 ${APP_PORT} 리스닝 확인!${NC}"
        break
    fi
    echo "  대기 중... ($i/15)"
done
echo ""

# ---- 10. iptables ----
echo -e "${YELLOW}[10/11] iptables 방화벽 설정...${NC}"
iptables -C DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true
iptables -C DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true
# UFW도 설정
ufw allow from 172.17.0.0/16 to any port ${APP_PORT} 2>/dev/null || true
ufw allow from 172.18.0.0/16 to any port ${APP_PORT} 2>/dev/null || true
echo -e "${GREEN}완료${NC}"
echo ""

# ---- 11. Docker nginx 설정 ----
echo -e "${YELLOW}[11/11] Docker nginx 프록시 설정...${NC}"

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${NGINX_CONTAINER}$"; then
    echo -e "${RED}오류: ${NGINX_CONTAINER} 컨테이너를 찾을 수 없습니다!${NC}"
    docker ps --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null
    echo ""
    echo "수동 설정이 필요합니다."
else
    # 이미 설정되어 있는지 확인
    HAS_LIVENEWS=$(docker exec ${NGINX_CONTAINER} grep -c "livenews" /etc/nginx/conf.d/default.conf 2>/dev/null || echo "0")

    if [ "$HAS_LIVENEWS" != "0" ]; then
        echo "이미 /livenews 설정이 있습니다. nginx 리로드만 수행."
        docker exec ${NGINX_CONTAINER} nginx -t 2>&1 && docker exec ${NGINX_CONTAINER} nginx -s reload 2>&1
        echo -e "${GREEN}완료${NC}"
    else
        echo "Docker nginx에 /livenews 프록시 추가..."

        # ===== 핵심: 호스트에서 파일을 만들어 docker cp로 복사 =====

        # 1) 현재 default.conf를 호스트로 복사
        docker cp ${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf /tmp/nginx-default.conf.bak
        cp /tmp/nginx-default.conf.bak /tmp/nginx-default.conf

        echo "현재 default.conf (첫 5줄):"
        head -5 /tmp/nginx-default.conf

        # 2) 호스트에서 Python으로 location 블록 삽입
        python3 << 'PYEOF'
import sys

conf_path = "/tmp/nginx-default.conf"
with open(conf_path, "r") as f:
    conf = f.read()

# 이미 livenews가 있으면 스킵
if "livenews" in conf:
    print("이미 livenews 설정이 있습니다.")
    sys.exit(0)

location_block = """
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

# 마지막 } (server 블록 닫기) 앞에 삽입
last_brace = conf.rfind("}")
if last_brace < 0:
    print("ERROR: 닫는 중괄호를 찾을 수 없습니다!")
    sys.exit(1)

new_conf = conf[:last_brace] + location_block + "\n" + conf[last_brace:]

with open(conf_path, "w") as f:
    f.write(new_conf)

print("OK: location 블록 삽입 완료")
PYEOF

        if [ $? -ne 0 ]; then
            echo -e "${RED}Python 삽입 실패!${NC}"
        else
            # 3) 수정된 파일을 Docker로 복사
            echo "수정된 default.conf를 Docker nginx로 복사..."
            docker cp /tmp/nginx-default.conf ${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf

            # 4) nginx 설정 테스트
            echo "nginx 설정 테스트..."
            if docker exec ${NGINX_CONTAINER} nginx -t 2>&1; then
                docker exec ${NGINX_CONTAINER} nginx -s reload
                echo -e "${GREEN}Docker nginx 설정 완료!${NC}"
            else
                echo -e "${RED}nginx 설정 오류! 백업에서 복원합니다.${NC}"
                docker cp /tmp/nginx-default.conf.bak ${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf
                docker exec ${NGINX_CONTAINER} nginx -s reload
                echo ""
                echo "===== 수동 설정 필요 ====="
                echo "아래 명령어로 직접 설정하세요:"
                echo ""
                echo "  docker exec -it ${NGINX_CONTAINER} sh"
                echo "  vi /etc/nginx/conf.d/default.conf"
                echo ""
                echo "server { } 블록의 마지막 } 바로 앞에 아래 추가:"
                echo ""
                echo '    location /livenews {'
                echo "        proxy_pass http://${DOCKER_HOST_IP}:${APP_PORT};"
                echo '        proxy_http_version 1.1;'
                echo '        proxy_set_header Host $host;'
                echo '        proxy_set_header X-Real-IP $remote_addr;'
                echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;'
                echo '        proxy_cache_bypass $http_upgrade;'
                echo '        proxy_read_timeout 60s;'
                echo '    }'
                echo ""
                echo "  nginx -t && nginx -s reload"
                echo "  exit"
            fi
        fi

        # 임시 파일 정리
        rm -f /tmp/nginx-default.conf /tmp/nginx-default.conf.bak
    fi
fi
echo ""

# ---- 최종 상태 확인 ----
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  최종 상태 확인${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo "1) PM2 프로세스:"
pm2 list | grep -E "${APP_NAME}|Name" || true
echo ""

echo "2) 포트 ${APP_PORT} 리스닝:"
ss -tlnp 2>/dev/null | grep ":${APP_PORT}" || echo "  리스닝 없음!"
echo ""

echo "3) iptables DOCKER-USER 규칙 (포트 ${APP_PORT}):"
iptables -L DOCKER-USER -n 2>/dev/null | grep "${APP_PORT}" || echo "  규칙 없음!"
echo ""

echo "4) Docker nginx에 /livenews 설정:"
docker exec ${NGINX_CONTAINER} grep -A2 "livenews" /etc/nginx/conf.d/default.conf 2>/dev/null || echo "  설정 없음!"
echo ""

echo "5) 로컬 접속 테스트:"
HTTP_LOCAL=$(curl -s -o /dev/null -w "%{http_code}" "http://0.0.0.0:${APP_PORT}/livenews/" 2>/dev/null || echo "000")
echo "  http://0.0.0.0:${APP_PORT}/livenews/ → HTTP ${HTTP_LOCAL}"

HTTP_DOCKER=$(curl -s -o /dev/null -w "%{http_code}" "http://${DOCKER_HOST_IP}:${APP_PORT}/livenews/" 2>/dev/null || echo "000")
echo "  http://${DOCKER_HOST_IP}:${APP_PORT}/livenews/ → HTTP ${HTTP_DOCKER}"

HTTP_EXT=$(curl -s -o /dev/null -w "%{http_code}" "http://211.198.54.207/livenews/" 2>/dev/null || echo "000")
echo "  http://211.198.54.207/livenews/ → HTTP ${HTTP_EXT}"
echo ""

if [ "$HTTP_EXT" = "200" ] || [ "$HTTP_EXT" = "304" ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  배포 성공!${NC}"
    echo -e "${GREEN}========================================${NC}"
else
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  배포 완료 (nginx 확인 필요)${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    if [ "$HTTP_LOCAL" != "200" ] && [ "$HTTP_LOCAL" != "304" ]; then
        echo -e "${RED}문제: Next.js 앱이 응답하지 않습니다.${NC}"
        echo "  → pm2 logs ${APP_NAME} --lines 20"
    elif [ "$HTTP_DOCKER" != "200" ] && [ "$HTTP_DOCKER" != "304" ]; then
        echo -e "${RED}문제: Docker bridge(${DOCKER_HOST_IP})에서 앱 접근 불가.${NC}"
        echo "  → iptables 규칙 확인: iptables -L DOCKER-USER -n"
        echo "  → 앱이 0.0.0.0에 바인딩되었는지 확인: ss -tlnp | grep ${APP_PORT}"
    else
        echo -e "${RED}문제: Docker nginx 프록시 설정을 확인하세요.${NC}"
        echo "  → docker exec ${NGINX_CONTAINER} cat /etc/nginx/conf.d/default.conf"
        echo "  → docker exec ${NGINX_CONTAINER} nginx -t"
    fi
fi
echo ""
echo "접속 URL:  http://211.198.54.207/livenews/"
echo "관리자:    http://211.198.54.207/livenews/admin"
echo "PM2 로그:  pm2 logs ${APP_NAME}"
