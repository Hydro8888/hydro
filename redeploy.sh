#!/bin/bash
#=============================================================================
# AI Portal Pro (freeai) - routine 재배포 스크립트
#
# 용도: 코드 변경 후 빌드 → PM2 재시작 (nginx/iptables/docker 건드리지 않음)
# 실행:  bash redeploy.sh              (sudo 불필요. ubuntu 사용자로 실행)
#
# 안전성: freeai 프로세스와 freeai 디렉토리만 다룹니다.
#   - 다른 PM2 서비스(gonak, livenews, nn-web 등)에 영향 없음
#   - nginx / iptables / docker 설정 변경 없음 (이미 구성 완료된 상태 유지)
#   - .env.local 건드리지 않음 (git에 없으므로 pull로도 안 지워짐)
#=============================================================================
set -euo pipefail

DEPLOY_DIR="/home/ubuntu/freeai"
APP_NAME="freeai"
APP_PORT="3010"
BRANCH="claude/ai-portal-dev-plan-yI3Gd"

# sudo로 실행되면 안 됨 (PM2는 ubuntu 사용자 소유여야 함)
if [ "$(id -u)" = "0" ]; then
  echo "✗ sudo로 실행하지 마세요. 'bash redeploy.sh' 로 ubuntu 사용자로 실행하세요."
  echo "  (sudo pm2 와 ubuntu pm2 가 분리되어 포트 충돌이 발생합니다)"
  exit 1
fi

cd "${DEPLOY_DIR}"

echo "============================================"
echo "  freeai 재배포 시작 (port ${APP_PORT})"
echo "============================================"

echo ""
echo "=== [1/6] pnpm 확인 (corepack 우회) ==="
# packageManager 필드 때문에 corepack이 매번 pnpm을 다운로드하려다 DNS 실패로
# 크래시하는 문제 방지. 전역 설치된 pnpm을 우선 사용.
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
if ! command -v pnpm >/dev/null 2>&1; then
  echo "전역 pnpm이 없습니다. 설치 중..."
  sudo npm install -g pnpm@9.15.0
fi
echo "pnpm: $(pnpm -v)  ($(command -v pnpm))"

echo ""
echo "=== [2/6] 최신 코드 받기 ==="
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull origin "${BRANCH}"
echo "현재 커밋: $(git rev-parse --short HEAD) - $(git log -1 --pretty=%s)"

echo ""
echo "=== [3/6] 권한 복구 (이전 sudo 빌드 잔여물 대비) ==="
# 일부 파일이 root 소유로 남아 빌드 실패하는 경우 방지
if [ -n "$(find "${DEPLOY_DIR}/apps/web/.next" -maxdepth 0 2>/dev/null)" ]; then
  sudo chown -R ubuntu:ubuntu "${DEPLOY_DIR}" 2>/dev/null || true
fi

echo ""
echo "=== [4/6] 빌드 캐시 완전 삭제 (turbo 복원 방지) ==="
# .next 만 지우면 turbo 캐시가 이전 빌드를 복원하므로 .turbo 들도 반드시 삭제
rm -rf "${DEPLOY_DIR}/apps/web/.next" \
       "${DEPLOY_DIR}/.turbo" \
       "${DEPLOY_DIR}/apps/web/.turbo" \
       "${DEPLOY_DIR}/node_modules/.cache"

echo ""
echo "=== [5/6] 의존성 + 프로덕션 빌드 ==="
pnpm install --no-frozen-lockfile
pnpm build

# 빌드 산출물 검증 (빌드가 캐시로 스킵되지 않았는지)
CSS_COUNT=$(find "${DEPLOY_DIR}/apps/web/.next/static" -name '*.css' 2>/dev/null | wc -l)
JS_COUNT=$(find "${DEPLOY_DIR}/apps/web/.next/static" -name '*.js' 2>/dev/null | wc -l)
if [ ! -f "${DEPLOY_DIR}/apps/web/.next/BUILD_ID" ]; then
  echo "✗ 빌드 실패: BUILD_ID 없음. 위 로그를 확인하세요."
  exit 1
fi
echo "✓ 빌드 완료 (CSS ${CSS_COUNT}개, JS ${JS_COUNT}개, BUILD_ID=$(cat "${DEPLOY_DIR}/apps/web/.next/BUILD_ID"))"

echo ""
echo "=== [6/6] PM2 재시작 (freeai 만) ==="
pm2 delete "${APP_NAME}" 2>/dev/null || true
pm2 start "${DEPLOY_DIR}/ecosystem.config.cjs"
pm2 reset "${APP_NAME}"   # 재시작 카운터 초기화
pm2 save

echo ""
echo "=== 헬스 체크 (5초 대기) ==="
sleep 5
LOCAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${APP_PORT}/freeai" 2>/dev/null || echo "FAIL")
echo "  http://localhost:${APP_PORT}/freeai → ${LOCAL_STATUS}"

RESTARTS=$(pm2 jlist 2>/dev/null | grep -o "\"name\":\"${APP_NAME}\"[^}]*\"restart_time\":[0-9]*" | grep -o '[0-9]*$' || echo "?")
if [ "${LOCAL_STATUS}" = "200" ]; then
  echo "✓ 배포 성공! (재시작 횟수: ${RESTARTS})"
else
  echo "✗ 앱이 응답하지 않습니다. 로그 확인: pm2 logs ${APP_NAME} --err --lines 40"
  exit 1
fi

echo ""
echo "============================================"
echo "  배포 완료"
echo "  로컬:  http://localhost:${APP_PORT}/freeai"
echo "  외부:  https://free.ai.kr/"
echo "============================================"
echo ""
echo "※ nginx는 이미 구성되어 있으므로 이 스크립트가 건드리지 않습니다."
echo "  nginx 관련 문제 시: sudo nginx -t && sudo systemctl reload nginx"
