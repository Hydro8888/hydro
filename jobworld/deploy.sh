#!/bin/bash
# ============================================================
# JobWorld 빠른 배포 스크립트
# 실행: bash deploy.sh [backend|frontend|nginx|all]
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "${SCRIPT_DIR}"

TARGET="${1:-all}"

echo "=== JobWorld 배포: ${TARGET} ==="

if [ ! -f .env ]; then
  echo "[!] .env 파일 없음. 먼저 bash server_setup.sh 실행"
  exit 1
fi

case "$TARGET" in
  backend)
    sudo docker compose build --no-cache backend
    sudo docker compose up -d backend
    ;;
  frontend)
    sudo docker compose build --no-cache frontend
    sudo docker compose up -d frontend
    ;;
  nginx)
    sudo docker compose restart nginx
    ;;
  all)
    sudo docker compose build --no-cache
    sudo docker compose up -d
    ;;
  *)
    echo "사용법: bash deploy.sh [backend|frontend|nginx|all]"
    exit 1
    ;;
esac

sleep 5
sudo docker compose ps

for i in 1 2 3; do
  if curl -sf http://localhost:3100/jobworld/health >/dev/null 2>&1; then
    echo "=== 배포 완료! ==="
    exit 0
  fi
  sleep 3
done
echo "헬스체크 실패 — sudo docker compose logs --tail=20"
