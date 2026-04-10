#!/bin/bash
#============================================
# Simburum nginx 설정 수정 스크립트
# server 블록 안에 location을 정확히 넣기
#
# Usage: bash fix-nginx.sh
#============================================

NGINX_CONTAINER="jobworld-nginx"

echo "=== Simburum nginx 설정 수정 ==="
echo ""

# 1. 현재 설정 백업
echo "[1/4] default.conf 백업..."
docker exec $NGINX_CONTAINER cp /etc/nginx/conf.d/default.conf "/etc/nginx/conf.d/default.conf.bak.$(date +%Y%m%d%H%M%S)"

# 2. 현재 설정에서 simburum 블록 제거 (잘못된 위치에 있으므로)
echo "[2/4] 기존 simburum 설정 제거 (잘못된 위치)..."
docker exec $NGINX_CONTAINER sh -c "
sed -i '/# Simburum/,/^$/d' /etc/nginx/conf.d/default.conf
sed -i '/location \/simburum/,/}/d' /etc/nginx/conf.d/default.conf
"

# 3. server 블록의 닫는 } 바로 앞에 simburum location 삽입
echo "[3/4] server 블록 안에 simburum location 삽입..."

# Python으로 정확한 위치에 삽입
# server 블록의 첫 번째 닫는 }를 찾아서 그 앞에 넣기
docker exec $NGINX_CONTAINER sh -c 'python3 -c "
conf = open(\"/etc/nginx/conf.d/default.conf\").read()
lines = conf.split(chr(10))

# server 블록의 닫는 }를 찾기 (들여쓰기 없는 첫 번째 })
insert_idx = -1
for i, line in enumerate(lines):
    if line.strip() == \"}\" and i > 0:
        insert_idx = i
        break

if insert_idx == -1:
    print(\"ERROR: server 블록 닫는 } 를 찾을 수 없습니다\")
    exit(1)

simburum_block = \"\"\"
    # Simburum - AI 기반 생활대행 매칭 플랫폼
    location /simburum {
        proxy_pass http://172.17.0.1:4200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection \\\"upgrade\\\";
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location /simburum/_next/static {
        proxy_pass http://172.17.0.1:4200/simburum/_next/static;
        proxy_cache_bypass \\\$http_upgrade;
        expires 365d;
        add_header Cache-Control \\\"public, immutable\\\";
    }
\"\"\"

lines.insert(insert_idx, simburum_block)
new_conf = chr(10).join(lines)
open(\"/etc/nginx/conf.d/default.conf\", \"w\").write(new_conf)
print(\"simburum location 블록 삽입 완료 (line \" + str(insert_idx) + \")\")
"' 2>&1

# Python 실패 시 대안: sed 사용
if [ $? -ne 0 ]; then
    echo "  Python 실패. sed로 시도..."
    # server 블록 닫는 } 앞에 삽입 (첫 번째 ^}만 대상)
    docker exec $NGINX_CONTAINER sh -c '
    sed -i "0,/^}/s/^}/\n    # Simburum - AI 기반 생활대행 매칭 플랫폼\n    location \/simburum {\n        proxy_pass http:\/\/172.17.0.1:4200;\n        proxy_http_version 1.1;\n        proxy_set_header Host \$host;\n        proxy_set_header X-Real-IP \$remote_addr;\n        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto \$scheme;\n        proxy_cache_bypass \$http_upgrade;\n        proxy_read_timeout 300s;\n    }\n\n    location \/simburum\/_next\/static {\n        proxy_pass http:\/\/172.17.0.1:4200\/simburum\/_next\/static;\n        expires 365d;\n        add_header Cache-Control \"public, immutable\";\n    }\n\n}/" /etc/nginx/conf.d/default.conf
    '
fi

# 4. nginx 테스트 및 reload
echo "[4/4] Nginx 설정 테스트 및 reload..."
if docker exec $NGINX_CONTAINER nginx -t 2>&1; then
    docker exec $NGINX_CONTAINER nginx -s reload
    echo ""
    echo "=== 성공! Nginx 설정 완료 ==="
    echo ""
    echo "설정 확인:"
    docker exec $NGINX_CONTAINER grep -B2 -A10 "simburum" /etc/nginx/conf.d/default.conf
else
    echo ""
    echo "=== 오류! Nginx 설정 테스트 실패 ==="
    echo "백업에서 복원합니다..."
    LATEST_BAK=$(docker exec $NGINX_CONTAINER sh -c "ls -t /etc/nginx/conf.d/default.conf.bak.* 2>/dev/null | head -1")
    if [ -n "$LATEST_BAK" ]; then
        docker exec $NGINX_CONTAINER cp "$LATEST_BAK" /etc/nginx/conf.d/default.conf
        docker exec $NGINX_CONTAINER nginx -s reload
        echo "복원 완료."
    fi
    echo ""
    echo "수동으로 설정해주세요:"
    echo "  docker exec -it $NGINX_CONTAINER sh"
    echo "  vi /etc/nginx/conf.d/default.conf"
    echo ""
    echo "server { 블록 안, 마지막 } 앞에 아래 추가:"
    echo '    location /simburum {'
    echo '        proxy_pass http://172.17.0.1:4200;'
    echo '        proxy_http_version 1.1;'
    echo '        proxy_set_header Host $host;'
    echo '        proxy_set_header X-Real-IP $remote_addr;'
    echo '        proxy_cache_bypass $http_upgrade;'
    echo '        proxy_read_timeout 300s;'
    echo '    }'
fi
