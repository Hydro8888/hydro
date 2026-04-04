#!/bin/bash
# ============================================================
# JobWorld 서버 초기 설치 및 배포 스크립트
# 실행: bash server_setup.sh
# ============================================================
set -e

# 스크립트 위치 기준으로 경로 결정 (어디서든 실행 가능)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

REPO_URL="https://github.com/Hydro8888/hydro.git"
BRANCH="claude/import-jobworld-project-zvwke"

echo "================================================"
echo "  JobWorld 서버 설치 및 배포"
echo "  프로젝트: ${PROJECT_DIR}"
echo "================================================"
echo ""

# ── 1. Docker 설치 ────────────────────────────────────────
echo "[1/6] Docker 확인..."
if ! command -v docker &>/dev/null; then
  echo "  Docker 설치 중..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  echo ""
  echo "  Docker 설치 완료. 재로그인 후 다시 실행하세요."
  exit 0
else
  echo "  $(docker --version)"
fi

# ── 2. Docker Compose 플러그인 확인 ──────────────────────
echo "[2/6] Docker Compose 확인..."
if ! docker compose version &>/dev/null 2>&1; then
  echo "  Docker Compose 설치 중..."
  sudo apt-get update -qq
  sudo apt-get install -y docker-compose-plugin
else
  echo "  $(docker compose version)"
fi

# ── 3. 코드 업데이트 (git 저장소인 경우만) ────────────────
echo "[3/6] 코드 확인..."
if [ -d "${REPO_DIR}/.git" ]; then
  cd "${REPO_DIR}"
  git fetch origin "${BRANCH}" 2>/dev/null || true
  git checkout "${BRANCH}" 2>/dev/null || true
  git pull origin "${BRANCH}" 2>/dev/null || true
  echo "  코드 업데이트 완료"
else
  echo "  git 저장소 아님 — 코드 업데이트 건너뜀"
fi

cd "${PROJECT_DIR}"

# ── 4. .env 파일 설정 ────────────────────────────────────
echo "[4/6] 환경 변수 설정..."
if [ ! -f .env ]; then
  POSTGRES_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
  SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 48)

  cat > .env << ENVEOF
# Database
POSTGRES_PASSWORD=${POSTGRES_PASS}

# JWT
SECRET_KEY=${SECRET}
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# AI (GEMINI_API_KEY 필수 — AI 검색 기능에 필요)
GEMINI_API_KEY=
# GEMINI_GROUNDING_MODEL=gemini-2.5-flash
# GEMINI_MODEL=gemini-2.5-flash-lite

# WorkNet OpenAPI (선택)
WORKNET_API_KEY=

# 기타 AI API (선택)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
ENVEOF

  echo ""
  echo "  .env 파일이 생성되었습니다."
  echo "  GEMINI_API_KEY를 반드시 설정하세요!"
  echo ""
  echo "  nano ${PROJECT_DIR}/.env"
  echo ""
  echo "  설정 후 다시 실행:"
  echo "  bash ${PROJECT_DIR}/server_setup.sh"
  exit 1
else
  echo "  .env 파일 확인 완료"
  if grep -q "^GEMINI_API_KEY=$" .env 2>/dev/null; then
    echo "  주의: GEMINI_API_KEY가 비어 있음 (AI 검색 제한됨)"
  fi
fi

# ── 5. Docker Compose 빌드 및 실행 ───────────────────────
echo "[5/6] Docker 컨테이너 빌드 및 실행..."
echo "  (프론트엔드 빌드에 수 분이 걸릴 수 있습니다)"
echo ""

mkdir -p nginx/ssl
sudo docker compose down --remove-orphans 2>/dev/null || true
sudo docker compose up -d --build

echo ""
echo "  컨테이너 시작 완료. 초기화 대기 중..."
sleep 15

# ── 6. 헬스체크 ──────────────────────────────────────────
echo "[6/6] 헬스체크..."
sudo docker compose ps

HEALTH_OK=false
for i in 1 2 3 4 5; do
  if curl -sf http://localhost:3100/jobworld/health >/dev/null 2>&1; then
    HEALTH_OK=true
    break
  fi
  echo "  대기 중... (${i}/5)"
  sleep 5
done

echo ""
if [ "$HEALTH_OK" = true ]; then
  echo "================================================"
  echo "  배포 성공!"
  echo "  접속: http://localhost:3100/jobworld"
  echo "  API:  http://localhost:3100/jobworld/api/v1"
  echo "================================================"
else
  echo "================================================"
  echo "  헬스체크 실패 — 로그 확인:"
  echo "  sudo docker compose logs --tail=30"
  echo "================================================"
  sudo docker compose logs --tail=20
fi
