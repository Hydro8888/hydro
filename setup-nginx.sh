#!/bin/bash

# ====================================================
# LiveNews - Docker nginx 프록시 설정 스크립트
# 사용법: sudo bash setup-nginx.sh
#
# Docker nginx (jobworld-nginx) default.conf에
# /livenews location 블록을 추가합니다.
# ====================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

NGINX_CONTAINER="jobworld-nginx"
APP_PORT=4000
HOST_IP="172.17.0.1"

echo "=============================="
echo "  LiveNews nginx 프록시 설정"
echo "=============================="
echo ""

# ---- 1. Docker nginx 컨테이너 확인 ----
echo "[1/5] Docker nginx 컨테이너 확인..."
if ! docker ps --format '{{.Names}}' | grep -q "^${NGINX_CONTAINER}$"; then
    echo -e "${RED}오류: ${NGINX_CONTAINER} 컨테이너가 없습니다!${NC}"
    echo "실행 중인 컨테이너:"
    docker ps --format '  {{.Names}} ({{.Status}})'
    exit 1
fi
echo -e "${GREEN}${NGINX_CONTAINER} 확인됨${NC}"
echo ""

# ---- 2. 현재 default.conf 가져오기 ----
echo "[2/5] default.conf 가져오기..."
docker cp ${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf /tmp/nginx-default.conf
if [ ! -f /tmp/nginx-default.conf ]; then
    echo -e "${RED}오류: default.conf를 가져올 수 없습니다!${NC}"
    exit 1
fi
# 백업
cp /tmp/nginx-default.conf /tmp/nginx-default.conf.bak
echo -e "${GREEN}완료 (백업: /tmp/nginx-default.conf.bak)${NC}"
echo ""

# ---- 3. 이미 설정되어 있는지 확인 ----
echo "[3/5] 기존 설정 확인..."
if grep -q "livenews" /tmp/nginx-default.conf; then
    echo -e "${GREEN}이미 /livenews 설정이 있습니다!${NC}"
    echo ""
    echo "기존 설정:"
    grep -A3 "livenews" /tmp/nginx-default.conf
    echo ""
    echo "nginx 리로드만 수행합니다..."
    docker exec ${NGINX_CONTAINER} nginx -t 2>&1
    docker exec ${NGINX_CONTAINER} nginx -s reload 2>&1
    echo -e "${GREEN}완료${NC}"
    rm -f /tmp/nginx-default.conf /tmp/nginx-default.conf.bak

    # iptables도 확인
    echo ""
    echo "iptables 규칙 확인..."
    iptables -C DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
        iptables -I DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT
    iptables -C DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
        iptables -I DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT
    echo -e "${GREEN}iptables 완료${NC}"
    exit 0
fi
echo "설정 없음 - 새로 추가합니다."
echo ""

# ---- 4. location 블록 삽입 ----
echo "[4/5] /livenews location 블록 삽입..."

# 삽입할 location 블록 (줄바꿈 주의)
LOCATION_BLOCK='\\n    # === LiveNews Proxy ===\\n    location /livenews {\\n        proxy_pass http://172.17.0.1:4000;\\n        proxy_http_version 1.1;\\n        proxy_set_header Upgrade $http_upgrade;\\n        proxy_set_header Connection "upgrade";\\n        proxy_set_header Host $host;\\n        proxy_set_header X-Real-IP $remote_addr;\\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\\n        proxy_set_header X-Forwarded-Proto $scheme;\\n        proxy_cache_bypass $http_upgrade;\\n        proxy_read_timeout 60s;\\n        proxy_send_timeout 60s;\\n    }\\n\\n    location /livenews/_next/static {\\n        proxy_pass http://172.17.0.1:4000;\\n        proxy_http_version 1.1;\\n        proxy_set_header Host $host;\\n        expires 30d;\\n        add_header Cache-Control "public, immutable";\\n    }\\n'

# 호스트의 sed로 마지막 } 앞에 삽입
# 방법: Python이 가장 안전 (sed의 멀티라인 처리가 OS마다 다름)
python3 -c "
conf = open('/tmp/nginx-default.conf').read()
block = '''
    # === LiveNews Proxy ===
    location /livenews {
        proxy_pass http://172.17.0.1:4000;
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
        proxy_pass http://172.17.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host \\\$host;
        expires 30d;
        add_header Cache-Control \"public, immutable\";
    }
'''
idx = conf.rfind('}')
if idx < 0:
    print('ERROR: } not found')
    exit(1)
new_conf = conf[:idx] + block + '\\n' + conf[idx:]
open('/tmp/nginx-default.conf', 'w').write(new_conf)
print('OK')
"

if [ $? -ne 0 ]; then
    echo -e "${RED}Python 삽입 실패! 수동으로 설정하세요.${NC}"
    echo ""
    echo "=== 수동 설정 방법 ==="
    echo "1) docker exec -it ${NGINX_CONTAINER} sh"
    echo "2) vi /etc/nginx/conf.d/default.conf  (또는 설치된 에디터)"
    echo "3) server { } 블록의 마지막 } 앞에 아래 추가:"
    echo ""
    echo '    location /livenews {'
    echo '        proxy_pass http://172.17.0.1:4000;'
    echo '        proxy_http_version 1.1;'
    echo '        proxy_set_header Host $host;'
    echo '        proxy_set_header X-Real-IP $remote_addr;'
    echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;'
    echo '        proxy_cache_bypass $http_upgrade;'
    echo '        proxy_read_timeout 60s;'
    echo '    }'
    echo ""
    echo "4) nginx -t && nginx -s reload"
    echo "5) exit"
    rm -f /tmp/nginx-default.conf /tmp/nginx-default.conf.bak
    exit 1
fi

echo "삽입 성공. 설정 확인:"
grep -A2 "livenews" /tmp/nginx-default.conf | head -6
echo ""

# Docker로 복사
echo "Docker nginx에 복사..."
docker cp /tmp/nginx-default.conf ${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf

# 설정 테스트
echo "nginx 설정 테스트..."
if docker exec ${NGINX_CONTAINER} nginx -t 2>&1; then
    docker exec ${NGINX_CONTAINER} nginx -s reload
    echo -e "${GREEN}nginx 설정 완료!${NC}"
else
    echo -e "${RED}설정 오류! 백업 복원...${NC}"
    docker cp /tmp/nginx-default.conf.bak ${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf
    docker exec ${NGINX_CONTAINER} nginx -s reload
    echo "복원 완료. 수동 설정이 필요합니다."
    rm -f /tmp/nginx-default.conf /tmp/nginx-default.conf.bak
    exit 1
fi
echo ""

# ---- 5. iptables ----
echo "[5/5] iptables 방화벽 규칙..."
iptables -C DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT
iptables -C DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT

# UFW (재부팅 후 유지)
if command -v ufw &>/dev/null; then
    ufw allow from 172.17.0.0/16 to any port ${APP_PORT} 2>/dev/null || true
    ufw allow from 172.18.0.0/16 to any port ${APP_PORT} 2>/dev/null || true
fi
echo -e "${GREEN}iptables 완료${NC}"
echo ""

# ---- 정리 ----
rm -f /tmp/nginx-default.conf /tmp/nginx-default.conf.bak

# ---- 테스트 ----
echo "=============================="
echo "  접속 테스트"
echo "=============================="
echo ""

sleep 2

echo -n "로컬 (0.0.0.0:${APP_PORT}): "
curl -s -o /dev/null -w "HTTP %{http_code}" "http://0.0.0.0:${APP_PORT}/livenews/" 2>/dev/null || echo "연결 불가"
echo ""

echo -n "Docker bridge (${HOST_IP}:${APP_PORT}): "
curl -s -o /dev/null -w "HTTP %{http_code}" "http://${HOST_IP}:${APP_PORT}/livenews/" 2>/dev/null || echo "연결 불가"
echo ""

echo -n "외부 (211.198.54.207): "
curl -s -o /dev/null -w "HTTP %{http_code}" "http://211.198.54.207/livenews/" 2>/dev/null || echo "연결 불가"
echo ""

echo ""
echo -e "${GREEN}설정 완료!${NC}"
echo "접속: http://211.198.54.207/livenews/"
