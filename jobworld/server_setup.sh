#!/bin/bash
# ============================================================
# JobWorld 서버 초기 ��치 및 배포 스크립트
# 실행: bash server_setup.sh
# ============================================================
set -e

REPO_URL="https://github.com/Hydro8888/hydro.git"
BRANCH="claude/import-jobworld-project-zvwke"
INSTALL_DIR="/home/ubuntu/hydro"
PROJECT_DIR="${INSTALL_DIR}/jobworld"

echo "================================================"
echo "  JobWorld 서버 설치 및 배포"
echo "================================================"
echo ""

# ── 1. Docker 설치 ────────────────────────────────────────
echo "[1/7] Docker 확인..."
if ! command -v docker &>/dev/null; then
  echo "  Docker 설치 중..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  echo ""
  echo "  Docker 설치 완료. 재로그인 후 다시 실행하세요:"
  echo "    exit && ssh ubuntu@서버IP"
  echo "    bash ${PROJECT_DIR}/server_setup.sh"
  exit 0
else
  echo "  $(docker --version)"
fi

# ── 2. Docker Compose ��러그인 확인 ���──────────────────────
echo "[2/7] Docker Compose 확인..."
if ! docker compose version &>/dev/null 2>&1; then
  echo "  Docker Compose 설치 중..."
  sudo apt-get update -qq
  sudo apt-get install -y docker-compose-plugin
else
  echo "  $(docker compose version)"
fi

# ── 3. 레포지토리 클론/업데이트 ───────────────────────────
echo "[3/7] 코드 준비..."
if [ ! -d "${INSTALL_DIR}/.git" ]; then
  git clone --branch "${BRANCH}" "${REPO_URL}" "${INSTALL_DIR}"
  echo "  클론 완료"
else
  cd "${INSTALL_DIR}"
  git fetch origin "${BRANCH}"
  git checkout "${BRANCH}"
  git pull origin "${BRANCH}"
  echo "  업데이트 완료"
fi

cd "${PROJECT_DIR}"

# ── 4. .env 파일 설정 ────────────────────────────────────
echo "[4/7] 환경 변수 설정..."
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
  echo "  ┌─────────────────────────────────────────────┐"
  echo "  │  .env 파일이 생성되었습니다.                │"
  echo "  │  GEMINI_API_KEY를 반드시 설정하세요!        │"
  echo "  │                                             │"
  echo "  │  nano ${PROJECT_DIR}/.env                   │"
  echo "  │                                             │"
  echo "  │  설정 후 다시 실행:                          │"
  echo "  │  bash ${PROJECT_DIR}/server_setup.sh        │"
  echo "  └─────────────────────────────────────────────┘"
  exit 1
else
  echo "  .env 파일 확인 완료"
  # GEMINI_API_KEY 설정 여부 경고
  if grep -q "^GEMINI_API_KEY=$" .env 2>/dev/null; then
    echo ""
    echo "  ⚠  GEMINI_API_KEY가 비어 있습니다."
    echo "     AI 검색 기능이 제한됩니다."
    echo "     설정: nano ${PROJECT_DIR}/.env"
    echo ""
  fi
fi

# ── 5. SSL 디렉토리 준비 ─────────────────────────────────
echo "[5/7] 디렉토리 준비..."
mkdir -p nginx/ssl

# ── 6. Docker Compose 빌�� 및 실행 ───────────────────────
echo "[6/7] Docker 컨테이너 빌드 및 실행..."
echo "  (프론트엔드 빌드에 수 분이 걸릴 수 있습니다)"
echo ""

sudo docker compose down --remove-orphans 2>/dev/null || true
sudo docker compose up -d --build

echo ""
echo "  컨테이너 시작 완료. 초기화 대기 중..."
sleep 15

# ── 7. 헬스체크 ──────────────────────────────────────────
echo "[7/7] 헬스체크..."
echo ""

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
  echo "================================================"
  echo ""
  echo "  내부 접속: http://localhost:3100/jobworld"
  echo "  API:       http://localhost:3100/jobworld/api/v1"
  echo "  관리자:    http://localhost:3100/jobworld/admin.html"
  echo ""
  echo "  호스트 nginx 설정 (외부 접속 필요 시):"
  echo "    sudo bash ${INSTALL_DIR}/host_nginx_setup.sh"
  echo ""
  echo "  업데이트:"
  echo "    bash ${PROJECT_DIR}/update.sh"
else
  echo "================================================"
  echo "  헬스체크 실패!"
  echo "================================================"
  echo ""
  echo "  로그 확인:"
  echo "    sudo docker compose logs backend --tail=50"
  echo "    sudo docker compose logs frontend --tail=50"
  echo ""
  sudo docker compose logs --tail=20
fi
