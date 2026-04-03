#!/bin/bash
# ============================================================
# JobWorld 서버 업데이트 스크립트
# 실행: bash update.sh
# ============================================================
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "${PROJECT_DIR}/.." && pwd)"
BRANCH="claude/import-jobworld-project-zvwke"

echo "================================================"
echo "  JobWorld 업데이트"
echo "================================================"
echo ""

cd "${REPO_DIR}"

# ── 1. 최신 코드 ────────────────────────────────────────
echo "[1/4] 코드 업데이트..."
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull origin "${BRANCH}"
echo "  완료"

cd "${PROJECT_DIR}"

# ── 2. 변경 감지 및 선택적 빌드 ──────────────────────────
echo ""
echo "[2/4] Docker 이미지 빌드..."

# 변경된 파일 기반으로 빌드 대상 결정
CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "all")
BUILD_TARGETS=""

if echo "$CHANGED" | grep -q "jobworld/frontend/" || [ "$CHANGED" = "all" ]; then
  BUILD_TARGETS="${BUILD_TARGETS} frontend"
fi
if echo "$CHANGED" | grep -q "jobworld/backend/" || [ "$CHANGED" = "all" ]; then
  BUILD_TARGETS="${BUILD_TARGETS} backend"
fi

if [ -z "$BUILD_TARGETS" ]; then
  echo "  프론트엔드/백엔드 변경 없음 — 설정 파일만 업데이트"
  sudo docker compose up -d
else
  echo "  빌드 대상:${BUILD_TARGETS}"
  sudo docker compose build --no-cache ${BUILD_TARGETS}
  echo ""
  echo "[3/4] 컨테이너 재시작..."
  sudo docker compose up -d
fi

# ── 3. 헬스체크 ──────────────────────────────────────────
echo ""
echo "[4/4] 헬스체크..."
sleep 10

sudo docker compose ps
echo ""

for i in 1 2 3; do
  if curl -sf http://localhost:3100/jobworld/health >/dev/null 2>&1; then
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
echo "헬스체크 실패 — 로그 확인:"
sudo docker compose logs --tail=20
exit 1
