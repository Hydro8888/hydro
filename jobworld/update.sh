#!/bin/bash
# ============================================================
# JobWorld 서버 업데이트 스크립트
# 실행: bash update.sh
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BRANCH="claude/import-jobworld-project-zvwke"

echo "================================================"
echo "  JobWorld 업데이트"
echo "  프로젝트: ${PROJECT_DIR}"
echo "================================================"
echo ""

# ── 1. 최신 코드 ────────────────────────────────────────
echo "[1/3] 코드 업데이트..."
if [ -d "${REPO_DIR}/.git" ]; then
  cd "${REPO_DIR}"
  git fetch origin "${BRANCH}"
  git checkout "${BRANCH}"
  git pull origin "${BRANCH}"
  echo "  완료"
else
  echo "  git 저장소 아님 — 건너뜀"
fi

cd "${PROJECT_DIR}"

# ── 2. Docker 빌드 및 재시작 ─────────────────────────────
echo ""
echo "[2/3] Docker 이미지 빌드 및 재시작..."
sudo docker compose build --no-cache frontend backend
sudo docker compose up -d
echo "  완료"

# ── 3. 헬스체크 ──────────────────────────────────────────
echo ""
echo "[3/3] 헬스체크..."
sleep 10
sudo docker compose ps

for i in 1 2 3; do
  if curl -sf http://localhost:3100/jobworld/health >/dev/null 2>&1; then
    echo ""
    echo "================================================"
    echo "  업데이트 완료!"
    echo "  접속: http://localhost:3100/jobworld"
    echo "================================================"
    exit 0
  fi
  echo "  대기 중... (${i}/3)"
  sleep 5
done

echo ""
echo "헬스체크 실패 — 로그: sudo docker compose logs --tail=20"
exit 1
