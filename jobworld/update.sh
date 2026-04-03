#!/bin/bash
# AI JobWorld 서버 업데이트 스크립트

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH="claude/ai-job-platform-GXCLo"

echo "======================================"
echo "  AI JobWorld 업데이트 시작"
echo "======================================"

# 1. 최신 코드 가져오기
echo ""
echo "[1/3] Git pull 중..."
cd "$PROJECT_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"
echo "✓ 코드 업데이트 완료"

# 2. 변경된 이미지 빌드 (frontend, backend만 재빌드)
echo ""
echo "[2/3] Docker 이미지 빌드 중... (시간이 걸릴 수 있습니다)"
sudo docker compose build --no-cache frontend backend
echo "✓ 빌드 완료"

# 3. 컨테이너 재시작
echo ""
echo "[3/3] 컨테이너 재시작 중..."
sudo docker compose up -d
echo "✓ 재시작 완료"

# 상태 확인
echo ""
echo "======================================"
echo "  컨테이너 상태"
echo "======================================"
sudo docker compose ps

echo ""
echo "✓ 업데이트 완료!"
echo "  접속 주소: http://172.30.1.99"
