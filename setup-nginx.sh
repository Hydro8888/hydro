#!/bin/bash
# ============================================================
# Hydro Marketing Platform - Nginx 리버스 프록시 설정
# 사용법: sudo bash setup-nginx.sh
#
# ⚠️ 주의: 이 스크립트는 sudo 권한이 필요합니다.
# 기존 서비스에 영향을 주지 않도록 안전 장치가 포함되어 있습니다.
# ============================================================

set -e

NGINX_CONF="/etc/nginx/sites-available/multi-service"
APP_PORT=3400
BASE_PATH="/hydro"
TIMESTAMP=$(date +%Y%m%d%H%M%S)

echo "============================================"
echo "  Hydro Marketing - Nginx 설정"
echo "============================================"
echo ""

# ============================================================
# 1. 권한 확인
# ============================================================
if [ "$EUID" -ne 0 ]; then
  echo "❌ root 권한이 필요합니다. sudo를 사용하세요:"
  echo "   sudo bash setup-nginx.sh"
  exit 1
fi

# ============================================================
# 2. Nginx 설정 파일 존재 확인
# ============================================================
echo "[1/5] Nginx 설정 파일 확인..."
if [ ! -f "${NGINX_CONF}" ]; then
  echo "  ❌ ${NGINX_CONF} 파일을 찾을 수 없습니다."
  echo "  Nginx 설정 파일 경로를 확인하세요."
  exit 1
fi
echo "  ✅ 설정 파일 확인: ${NGINX_CONF}"
echo ""

# ============================================================
# 3. 기존 설정 백업
# ============================================================
echo "[2/5] 기존 설정 백업..."
cp ${NGINX_CONF} ${NGINX_CONF}.bak.${TIMESTAMP}
echo "  ✅ 백업 완료: ${NGINX_CONF}.bak.${TIMESTAMP}"
echo ""

# ============================================================
# 4. 중복 확인
# ============================================================
echo "[3/5] 기존 hydro 설정 확인..."
if grep -q "location ${BASE_PATH}/" ${NGINX_CONF}; then
  echo "  ⚠️  ${BASE_PATH}/ location 블록이 이미 존재합니다."
  echo "  수동으로 확인하세요: sudo nano ${NGINX_CONF}"
  echo "  백업 파일: ${NGINX_CONF}.bak.${TIMESTAMP}"
  exit 1
fi
echo "  ✅ 중복 없음, 새로 추가합니다."
echo ""

# ============================================================
# 5. Location 블록 추가
# ============================================================
echo "[4/5] Nginx location 블록 추가..."

# 임시 파일에 새 location 블록 작성
TEMP_FILE=$(mktemp)
cat > ${TEMP_FILE} << 'NGINXEOF'

    # ====================================
    # Hydro Marketing Platform (port 3400)
    # ====================================
    location /hydro/ {
        proxy_pass http://127.0.0.1:3400/hydro/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    location /hydro/_next/ {
        proxy_pass http://127.0.0.1:3400/hydro/_next/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        # 정적 자산 캐싱
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

NGINXEOF

# server 블록의 마지막 닫는 중괄호 } 앞에 삽입
# 마지막 } 를 찾아서 그 앞에 삽입
sed -i "/^}$/r ${TEMP_FILE}" ${NGINX_CONF}

# 임시 파일 삭제
rm -f ${TEMP_FILE}

# 삽입 확인
if grep -q "Hydro Marketing Platform" ${NGINX_CONF}; then
  echo "  ✅ location 블록 추가 완료"
else
  echo "  ❌ 블록 추가 실패. 수동으로 추가하세요."
  echo "  백업에서 복원: cp ${NGINX_CONF}.bak.${TIMESTAMP} ${NGINX_CONF}"
  exit 1
fi
echo ""

# ============================================================
# 6. 문법 검사 + 리로드
# ============================================================
echo "[5/5] Nginx 문법 검사 및 리로드..."

if nginx -t 2>&1; then
  echo ""
  echo "  Nginx 리로드 중..."
  systemctl reload nginx
  echo "  ✅ Nginx 리로드 완료"
else
  echo ""
  echo "  ❌ Nginx 문법 오류! 백업에서 복원합니다..."
  cp ${NGINX_CONF}.bak.${TIMESTAMP} ${NGINX_CONF}
  nginx -t 2>&1
  systemctl reload nginx
  echo "  ✅ 백업에서 복원 완료"
  exit 1
fi
echo ""

# ============================================================
# 전체 서비스 상태 확인
# ============================================================
echo "============================================"
echo "  전체 서비스 상태 확인"
echo "============================================"
echo ""

sleep 2

ALL_OK=true
for path in contact matching hacker agentmarket fundmanager gonak jobworld hydro; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://172.30.1.99/$path/ 2>/dev/null || echo "000")
  if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ] || [ "$code" = "304" ]; then
    echo "  ✅ $path → $code"
  elif [ "$code" = "000" ]; then
    echo "  ⚠️  $path → 응답 없음"
  else
    echo "  ⚠️  $path → $code"
    ALL_OK=false
  fi
done

echo ""
if [ "$ALL_OK" = true ]; then
  echo "  ✅ 모든 서비스 정상!"
else
  echo "  ⚠️  일부 서비스 확인이 필요합니다."
fi

echo ""
echo "============================================"
echo "  Nginx 설정 완료!"
echo "============================================"
echo ""
echo "  내부 접속: http://172.30.1.99${BASE_PATH}/"
echo "  외부 접속: http://211.198.54.207${BASE_PATH}/"
echo ""
echo "  롤백 방법:"
echo "    sudo cp ${NGINX_CONF}.bak.${TIMESTAMP} ${NGINX_CONF}"
echo "    sudo nginx -t && sudo systemctl reload nginx"
echo ""
