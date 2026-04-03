#!/bin/bash
# ============================================================
# JobWorld 빠른 배포 스크립트 (이미 설치된 환경용)
# 실행: bash deploy.sh [backend|frontend|all]
# ============================================================
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "${PROJECT_DIR}"

TARGET="${1:-all}"

echo "=== JobWorld 배포: ${TARGET} ==="
echo ""

# .env 확인
if [ ! -f .env ]; then
  echo "[!] .env 파일이 없습니다."
  echo "    초기 설치: bash server_setup.sh"
  exit 1
fi

case "$TARGET" in
  backend)
    echo "[1/2] 백엔드 빌드..."
    sudo docker compose build --no-cache backend
    echo "[2/2] 백엔드 재시작..."
    sudo docker compose up -d backend
    ;;
  frontend)
    echo "[1/2] 프론트엔드 빌드..."
    sudo docker compose build --no-cache frontend
    echo "[2/2] 프론트엔드 재시작..."
    sudo docker compose up -d frontend
    ;;
  nginx)
    echo "nginx 재시작..."
    sudo docker compose restart nginx
    ;;
  all)
    echo "[1/2] 전체 빌드..."
    sudo docker compose build --no-cache
    echo "[2/2] 전체 재시작..."
    sudo docker compose up -d
    ;;
  *)
    echo "사용법: bash deploy.sh [backend|frontend|nginx|all]"
    exit 1
    ;;
esac

echo ""
sleep 5
sudo docker compose ps

# 헬스체크
echo ""
for i in 1 2 3; do
  if curl -sf http://localhost:3100/jobworld/health >/dev/null 2>&1; then
    echo "=== 배포 완료! ==="
    exit 0
  fi
  sleep 3
done

echo "헬스체크 실패 — 로그: sudo docker compose logs --tail=20"
