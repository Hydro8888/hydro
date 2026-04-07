#!/bin/bash
#=============================================================================
# AI Portal Pro — favicon 생성 + 서버 업로드 스크립트
#
# 사용법:
#   bash scripts/upload-favicon.sh              # 로컬에서 실행 (서버 업로드 포함)
#   bash scripts/upload-favicon.sh --local-only # 생성만 (업로드 안 함)
#   bash scripts/upload-favicon.sh --server     # 서버에서 직접 실행
#=============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PUBLIC_DIR="${PROJECT_DIR}/apps/web/public"
SERVER_USER="ubuntu"
SERVER_HOST="172.30.1.99"
SERVER_PORT="2222"
REMOTE_DIR="/home/ubuntu/freeai/apps/web/public"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=== AI Portal Pro — favicon 생성 ===${NC}"

# 1. Python으로 favicon 생성
echo ""
echo "[1/3] favicon 파일 생성..."
python3 "${SCRIPT_DIR}/generate-favicon.py"

# 생성된 파일 확인
echo ""
echo "[2/3] 생성된 파일:"
for f in favicon.ico favicon.svg apple-touch-icon.png icon-192.png icon-512.png; do
  if [ -f "${PUBLIC_DIR}/${f}" ]; then
    SIZE=$(du -h "${PUBLIC_DIR}/${f}" | cut -f1)
    echo -e "  ${GREEN}✓${NC} ${f} (${SIZE})"
  else
    echo "  ✗ ${f} — 생성 실패"
  fi
done

# 3. 서버 업로드 또는 로컬 완료
if [ "$1" = "--local-only" ]; then
  echo ""
  echo -e "${GREEN}✓ 로컬 생성 완료 (업로드 생략)${NC}"
  exit 0
fi

if [ "$1" = "--server" ]; then
  # 서버에서 직접 실행된 경우 — PM2 재시작만
  echo ""
  echo "[3/3] PM2 재시작..."
  pm2 restart freeai 2>/dev/null || echo "PM2 재시작 실패 — pm2 start ecosystem.config.cjs 실행 필요"
  echo ""
  echo -e "${GREEN}✓ 서버 favicon 업데이트 완료!${NC}"
  echo "  브라우저에서 Ctrl+Shift+R (강력 새로고침)으로 확인하세요."
  exit 0
fi

# SSH를 통한 서버 업로드
echo ""
echo "[3/3] 서버에 업로드..."

# 서버 접속 가능 여부 확인
if ! ssh -p ${SERVER_PORT} -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "echo ok" 2>/dev/null; then
  echo "⚠ 서버 접속 불가 (${SERVER_HOST}:${SERVER_PORT})"
  echo ""
  echo "수동 업로드 방법:"
  echo "  1. 서버에서: cd /home/ubuntu/freeai && git pull"
  echo "  2. 서버에서: pm2 restart freeai"
  echo ""
  echo "또는 서버에서 직접:"
  echo "  cd /home/ubuntu/freeai"
  echo "  git pull origin claude/ai-portal-dev-plan-yI3Gd"
  echo "  bash scripts/upload-favicon.sh --server"
  exit 0
fi

# 파일 업로드
for f in favicon.ico favicon.svg apple-touch-icon.png icon-192.png icon-512.png; do
  scp -P ${SERVER_PORT} "${PUBLIC_DIR}/${f}" ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/${f}
done

echo -e "${GREEN}✓ 파일 업로드 완료${NC}"

# 서버에서 PM2 재시작
echo "PM2 재시작 중..."
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "pm2 restart freeai"
echo -e "${GREEN}✓ 완료!${NC}"

echo ""
echo "확인 방법:"
echo "  http://172.30.1.99/freeai — 브라우저 탭에서 아이콘 확인 (Ctrl+Shift+R)"
echo "  http://free.ai.kr — 외부 접속 (Cloudflare 캐시 퍼지 필요할 수 있음)"
