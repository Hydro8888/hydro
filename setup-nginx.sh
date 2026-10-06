#!/bin/bash

# ====================================================
# LiveNews - Docker nginx 프록시 설정
#
# jobworld-nginx는 호스트 파일을 볼륨 마운트:
#   /home/ubuntu/hydro/jobworld/nginx/nginx.conf → /etc/nginx/nginx.conf
#
# nginx.conf의 server {} 블록에 /livenews location 추가
#
# 사용법: sudo bash setup-nginx.sh
# ====================================================

NGINX_CONTAINER="jobworld-nginx"
APP_PORT=4000
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 정확한 파일 경로 (볼륨 마운트된 호스트 파일)
NGINX_CONF="/home/ubuntu/hydro/jobworld/nginx/nginx.conf"

echo "=============================="
echo "  LiveNews nginx 설정"
echo "=============================="
echo ""

# ---- 1. 파일 확인 ----
echo "[1/4] nginx 설정 파일 확인..."
if [ ! -f "$NGINX_CONF" ]; then
    echo "오류: $NGINX_CONF 없음!"
    echo "검색 중..."
    NGINX_CONF=$(find /home/ubuntu -path "*jobworld*nginx*" -name "nginx.conf" -type f 2>/dev/null | head -1)
    if [ -z "$NGINX_CONF" ]; then
        echo "nginx.conf를 찾을 수 없습니다!"
        exit 1
    fi
fi
echo "OK: $NGINX_CONF"
echo ""

# ---- 2. 이미 설정됐는지 확인 ----
echo "[2/4] 기존 설정 확인..."
if grep -q "livenews" "$NGINX_CONF"; then
    echo "이미 /livenews 설정 있음!"
    grep -n "livenews" "$NGINX_CONF"
    echo ""
    echo "nginx 리로드..."
    docker exec ${NGINX_CONTAINER} nginx -t 2>&1 && docker exec ${NGINX_CONTAINER} nginx -s reload 2>&1
    echo ""
    # iptables 확인 후 종료
    echo "[4/4] iptables..."
    iptables -C DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
        iptables -I DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true
    iptables -C DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
        iptables -I DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true
    echo "완료! http://211.198.54.207/livenews/"
    exit 0
fi
echo "설정 없음 - 추가합니다."
echo ""

# ---- 이전에 잘못된 파일에 삽입된 설정 정리 ----
WRONG_FILE="/home/ubuntu/hydro/jobworld/nginx/nginx-http.conf"
if [ -f "$WRONG_FILE" ] && grep -q "livenews" "$WRONG_FILE"; then
    echo "잘못된 파일(nginx-http.conf)에서 livenews 설정 제거..."
    # 이 파일은 nginx에서 include하지 않으므로 삭제해도 무방
    rm -f "$WRONG_FILE"
    echo "제거 완료"
fi

# ---- 3. location 블록 삽입 ----
echo "[3/4] /livenews location 블록 삽입..."

# 백업
cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%Y%m%d%H%M%S)"
echo "백업 완료"

# inject-nginx.py로 삽입
BLOCK_FILE="${SCRIPT_DIR}/nginx-livenews.conf"
INJECT_PY="${SCRIPT_DIR}/inject-nginx.py"

if [ -f "$INJECT_PY" ] && [ -f "$BLOCK_FILE" ]; then
    echo "inject-nginx.py 실행..."
    python3 "$INJECT_PY" "$NGINX_CONF" "$BLOCK_FILE"
    RESULT=$?
else
    echo "inject-nginx.py 또는 nginx-livenews.conf 없음!"
    echo "  INJECT_PY: $INJECT_PY ($([ -f "$INJECT_PY" ] && echo '있음' || echo '없음'))"
    echo "  BLOCK_FILE: $BLOCK_FILE ($([ -f "$BLOCK_FILE" ] && echo '있음' || echo '없음'))"
    RESULT=1
fi

if [ $RESULT -ne 0 ] || ! grep -q "livenews" "$NGINX_CONF"; then
    echo "자동 삽입 실패!"
    echo ""
    echo "=== 수동 설정 ==="
    echo "vi $NGINX_CONF"
    echo ""
    echo "server { } 블록의 마지막 location 뒤에 아래 추가:"
    echo ""
    cat "$BLOCK_FILE" 2>/dev/null || echo '    location /livenews { proxy_pass http://172.17.0.1:4000; ... }'
    echo ""
    echo "저장 후: docker exec ${NGINX_CONTAINER} nginx -t && docker exec ${NGINX_CONTAINER} nginx -s reload"
    exit 1
fi

echo ""
echo "삽입 확인:"
grep -n "livenews" "$NGINX_CONF"
echo ""

# nginx 테스트 및 리로드
echo "nginx 테스트..."
if docker exec ${NGINX_CONTAINER} nginx -t 2>&1; then
    docker exec ${NGINX_CONTAINER} nginx -s reload
    echo "OK: nginx 리로드 완료!"
else
    echo "nginx 오류! 백업 복원..."
    LATEST_BAK=$(ls -t "${NGINX_CONF}.bak."* 2>/dev/null | head -1)
    if [ -n "$LATEST_BAK" ]; then
        cp "$LATEST_BAK" "$NGINX_CONF"
        docker exec ${NGINX_CONTAINER} nginx -s reload
    fi
    echo "복원 완료. 수동 설정 필요."
    exit 1
fi
echo ""

# ---- 4. iptables ----
echo "[4/4] iptables..."
iptables -C DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true
iptables -C DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true
ufw allow from 172.17.0.0/16 to any port ${APP_PORT} 2>/dev/null || true
ufw allow from 172.18.0.0/16 to any port ${APP_PORT} 2>/dev/null || true
echo "OK"
echo ""

# ---- 테스트 ----
echo "=============================="
echo "  접속 테스트"
echo "=============================="
sleep 2

echo -n "  로컬:          "
curl -sL -o /dev/null -w "HTTP %{http_code}" "http://0.0.0.0:${APP_PORT}/livenews/" 2>/dev/null || echo "실패"
echo ""

echo -n "  Docker bridge: "
curl -sL -o /dev/null -w "HTTP %{http_code}" "http://172.17.0.1:${APP_PORT}/livenews/" 2>/dev/null || echo "실패"
echo ""

echo -n "  외부:          "
curl -sL -o /dev/null -w "HTTP %{http_code}" "http://211.198.54.207/livenews/" 2>/dev/null || echo "실패"
echo ""

echo ""
echo "완료! http://211.198.54.207/livenews/"
