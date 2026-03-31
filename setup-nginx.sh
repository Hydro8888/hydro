#!/bin/bash

# ====================================================
# LiveNews - nginx 프록시 설정 (Docker 볼륨 마운트 방식)
#
# jobworld-nginx는 호스트의 nginx.conf를 볼륨 마운트함:
#   /home/ubuntu/hydro/jobworld/nginx/nginx.conf
# → 호스트에서 직접 편집 후 docker exec nginx -s reload
#
# 사용법: sudo bash setup-nginx.sh
# ====================================================

NGINX_CONTAINER="jobworld-nginx"
APP_PORT=4000

echo "=============================="
echo "  LiveNews nginx 설정"
echo "=============================="
echo ""

# ---- 1. nginx 설정 파일 찾기 ----
echo "[1/4] nginx 설정 파일 찾기..."

# 볼륨 마운트된 호스트 경로 확인
NGINX_CONF=""
POSSIBLE_PATHS=(
    "/home/ubuntu/hydro/jobworld/nginx/nginx.conf"
    "/home/ubuntu/hydro/jobworld/nginx/default.conf"
    "/home/ubuntu/hydro/jobworld/nginx/conf.d/default.conf"
    "/home/ubuntu/jobworld/nginx/nginx.conf"
    "/home/ubuntu/jobworld/nginx/default.conf"
)

for p in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$p" ]; then
        NGINX_CONF="$p"
        break
    fi
done

# 못 찾으면 Docker inspect로 마운트 경로 확인
if [ -z "$NGINX_CONF" ]; then
    echo "  기본 경로에서 못 찾음. Docker inspect로 확인..."
    MOUNT_INFO=$(docker inspect ${NGINX_CONTAINER} --format='{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}' 2>/dev/null)
    echo "  마운트 정보:"
    echo "$MOUNT_INFO"

    # nginx.conf 또는 conf.d가 포함된 마운트 찾기
    NGINX_MOUNT=$(echo "$MOUNT_INFO" | grep -i "nginx" | head -1)
    if [ -n "$NGINX_MOUNT" ]; then
        NGINX_HOST_PATH=$(echo "$NGINX_MOUNT" | awk '{print $1}')
        if [ -f "$NGINX_HOST_PATH" ]; then
            NGINX_CONF="$NGINX_HOST_PATH"
        elif [ -d "$NGINX_HOST_PATH" ]; then
            # 디렉토리면 안의 conf 파일 찾기
            NGINX_CONF=$(find "$NGINX_HOST_PATH" -name "*.conf" -type f | head -1)
        fi
    fi
fi

# 그래도 못 찾으면 find로 검색
if [ -z "$NGINX_CONF" ]; then
    echo "  전체 검색..."
    NGINX_CONF=$(find /home/ubuntu -path "*/jobworld*/nginx*" -name "*.conf" -type f 2>/dev/null | head -1)
fi

if [ -z "$NGINX_CONF" ] || [ ! -f "$NGINX_CONF" ]; then
    echo "  nginx 설정 파일을 찾을 수 없습니다!"
    echo ""
    echo "  수동으로 찾아주세요:"
    echo "    find /home/ubuntu -name 'nginx.conf' -o -name 'default.conf' | grep -i jobworld"
    echo "    docker inspect ${NGINX_CONTAINER} --format='{{range .Mounts}}{{.Source}}{{end}}'"
    exit 1
fi

echo "  OK: $NGINX_CONF"
echo ""

# ---- 2. 이미 설정됐는지 확인 ----
echo "[2/4] 기존 설정 확인..."
if grep -q "livenews" "$NGINX_CONF"; then
    echo "  이미 /livenews 설정 있음!"
    grep -n "livenews" "$NGINX_CONF"
    echo ""
    echo "  nginx 리로드..."
    docker exec ${NGINX_CONTAINER} nginx -s reload 2>/dev/null
    echo "  OK"
    echo ""
    # iptables만 처리하고 끝
    echo "[4/4] iptables..."
    iptables -C DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
        iptables -I DOCKER-USER -s 172.17.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true
    iptables -C DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || \
        iptables -I DOCKER-USER -s 172.18.0.0/16 -p tcp --dport ${APP_PORT} -j ACCEPT 2>/dev/null || true
    echo "  OK"
    echo ""
    echo "완료! http://211.198.54.207/livenews/"
    exit 0
fi
echo "  설정 없음 - 추가합니다."
echo ""

# ---- 3. location 블록 삽입 ----
echo "[3/4] /livenews location 블록 삽입..."

# 백업
cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%Y%m%d%H%M%S)"
echo "  백업: ${NGINX_CONF}.bak.*"

# inject-nginx.py 사용 (bash $ 변수 문제 없음)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BLOCK_FILE="${SCRIPT_DIR}/nginx-livenews.conf"
INJECT_PY="${SCRIPT_DIR}/inject-nginx.py"

if [ -f "$INJECT_PY" ] && [ -f "$BLOCK_FILE" ]; then
    echo "  inject-nginx.py로 삽입..."
    python3 "$INJECT_PY" "$NGINX_CONF" "$BLOCK_FILE"
else
    echo "  inject-nginx.py 또는 nginx-livenews.conf 없음. 직접 삽입..."
    # 호스트에서 직접 Python으로 삽입 (PYEOF는 싱글쿼트로 $ 해석 차단)
    python3 << 'PYEOF'
import sys
conf_path = sys.argv[1] if len(sys.argv) > 1 else None
if not conf_path:
    # 환경에서 가져오기
    import os
    conf_path = os.environ.get('NGINX_CONF', '')
if not conf_path:
    print("ERROR: no config path")
    sys.exit(1)

with open(conf_path, 'r') as f:
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
    print('ERROR: no closing brace')
    sys.exit(1)

with open(conf_path, 'w') as f:
    f.write(conf[:idx] + block + '\n' + conf[idx:])
print('OK: injected')
PYEOF
fi

RESULT=$?
if [ $RESULT -ne 0 ]; then
    echo "  삽입 실패!"
    echo ""
    echo "=== 수동 설정 방법 ==="
    echo "  vi $NGINX_CONF"
    echo "  마지막 } 앞에 아래 추가:"
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
    echo "  docker exec ${NGINX_CONTAINER} nginx -t"
    echo "  docker exec ${NGINX_CONTAINER} nginx -s reload"
    exit 1
fi

# 삽입 확인
echo "  삽입 확인:"
grep "livenews" "$NGINX_CONF" | head -3
echo ""

# nginx 테스트 및 리로드
echo "  nginx 테스트..."
if docker exec ${NGINX_CONTAINER} nginx -t 2>&1; then
    docker exec ${NGINX_CONTAINER} nginx -s reload
    echo "  OK: nginx 설정 완료!"
else
    echo "  설정 오류! 백업 복원..."
    LATEST_BAK=$(ls -t "${NGINX_CONF}.bak."* 2>/dev/null | head -1)
    if [ -n "$LATEST_BAK" ]; then
        cp "$LATEST_BAK" "$NGINX_CONF"
        docker exec ${NGINX_CONTAINER} nginx -s reload
    fi
    echo "  복원 완료. 수동 설정 필요."
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
echo "  OK"
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
