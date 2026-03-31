#!/bin/bash

# ====================================================
# LiveNews - Docker nginx 프록시 + iptables 설정
# 사용법: sudo bash setup-nginx.sh
# ====================================================

NGINX_CONTAINER="jobworld-nginx"
APP_PORT=4000
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=============================="
echo "  LiveNews nginx 설정"
echo "=============================="
echo ""

# ---- 1. Docker nginx 확인 ----
echo "[1/5] Docker nginx 확인..."
if ! docker ps --format '{{.Names}}' | grep -q "^${NGINX_CONTAINER}$"; then
    echo "오류: ${NGINX_CONTAINER} 없음!"
    docker ps --format '  {{.Names}}'
    exit 1
fi
echo "OK: ${NGINX_CONTAINER} 실행 중"

# ---- 2. default.conf 가져오기 ----
echo "[2/5] default.conf 가져오기..."
docker cp ${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf /tmp/nginx-default.conf
cp /tmp/nginx-default.conf /tmp/nginx-default.conf.bak
echo "OK: /tmp/nginx-default.conf"

# ---- 3. 이미 설정됐는지 확인 ----
echo "[3/5] 기존 설정 확인..."
if grep -q "livenews" /tmp/nginx-default.conf; then
    echo "이미 /livenews 설정 존재!"
    grep -n "livenews" /tmp/nginx-default.conf
    echo ""
    echo "nginx 리로드..."
    docker exec ${NGINX_CONTAINER} nginx -s reload 2>/dev/null
    echo ""
    # iptables만 확인
    goto_iptables=1
else
    echo "설정 없음 - 추가합니다."
    goto_iptables=0
fi

# ---- 4. location 블록 삽입 ----
if [ "$goto_iptables" = "0" ]; then
    echo "[4/5] location 블록 삽입..."

    # nginx-livenews.conf 파일 위치 확인
    BLOCK_FILE="${SCRIPT_DIR}/nginx-livenews.conf"
    if [ ! -f "$BLOCK_FILE" ]; then
        echo "오류: ${BLOCK_FILE} 파일이 없습니다!"
        exit 1
    fi

    # inject-nginx.py 위치 확인
    INJECT_PY="${SCRIPT_DIR}/inject-nginx.py"
    if [ ! -f "$INJECT_PY" ]; then
        echo "오류: ${INJECT_PY} 파일이 없습니다!"
        exit 1
    fi

    # Python 스크립트로 삽입 (bash 변수 해석 문제 없음!)
    echo "Python으로 location 블록 삽입..."
    python3 "$INJECT_PY" /tmp/nginx-default.conf "$BLOCK_FILE"

    if [ $? -ne 0 ]; then
        echo "삽입 실패!"
        echo ""
        echo "=== 수동 설정 ==="
        echo "1) docker exec -it ${NGINX_CONTAINER} sh"
        echo "2) vi /etc/nginx/conf.d/default.conf"
        echo "3) 마지막 } 앞에 아래 내용 추가:"
        cat "$BLOCK_FILE"
        echo "4) nginx -t && nginx -s reload"
        echo "5) exit"
        exit 1
    fi

    # 설정 확인
    echo ""
    echo "삽입된 내용 확인:"
    grep -c "livenews" /tmp/nginx-default.conf
    echo ""

    # Docker로 복사
    echo "Docker에 복사..."
    docker cp /tmp/nginx-default.conf ${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf

    # 테스트
    echo "nginx 테스트..."
    if docker exec ${NGINX_CONTAINER} nginx -t 2>&1; then
        docker exec ${NGINX_CONTAINER} nginx -s reload
        echo "OK: nginx 설정 완료!"
    else
        echo "설정 오류! 복원 중..."
        docker cp /tmp/nginx-default.conf.bak ${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf
        docker exec ${NGINX_CONTAINER} nginx -s reload
        echo "복원 완료. 수동 설정 필요."
        exit 1
    fi
fi

# ---- 5. iptables ----
echo "[5/5] iptables..."
iptables -C DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true
iptables -C DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
    iptables -I DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true
# UFW
ufw allow from 172.17.0.0/16 to any port ${APP_PORT} 2>/dev/null || true
ufw allow from 172.18.0.0/16 to any port ${APP_PORT} 2>/dev/null || true
echo "OK: iptables 완료"

# ---- 정리 ----
rm -f /tmp/nginx-default.conf /tmp/nginx-default.conf.bak

# ---- 테스트 ----
echo ""
echo "=============================="
echo "  접속 테스트"
echo "=============================="
sleep 2

echo -n "  로컬:        "
curl -s -o /dev/null -w "HTTP %{http_code}" "http://0.0.0.0:${APP_PORT}/livenews/" 2>/dev/null || echo "실패"
echo ""

echo -n "  Docker bridge: "
curl -s -o /dev/null -w "HTTP %{http_code}" "http://172.17.0.1:${APP_PORT}/livenews/" 2>/dev/null || echo "실패"
echo ""

echo -n "  외부:        "
curl -s -o /dev/null -w "HTTP %{http_code}" "http://211.198.54.207/livenews/" 2>/dev/null || echo "실패"
echo ""

echo ""
echo "완료! http://211.198.54.207/livenews/"
