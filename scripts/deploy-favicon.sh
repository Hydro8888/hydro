#!/bin/bash
# LiveNews Favicon 서버 업로드 스크립트
# Usage: bash scripts/deploy-favicon.sh

set -e

SERVER="ubuntu@211.198.54.207"
REMOTE_DIR="~/livenews"

echo "=== LiveNews Favicon 배포 ==="

# 1. favicon 파일 생성 (아직 없는 경우)
if [ ! -f "public/favicon.ico" ]; then
    echo "[1/4] Favicon 파일 생성 중..."
    python3 scripts/generate-favicon.py
else
    echo "[1/4] Favicon 파일 이미 존재"
fi

# 2. 서버에 public 디렉토리 확인/생성
echo "[2/4] 서버 public 디렉토리 확인..."
ssh $SERVER "mkdir -p $REMOTE_DIR/public"

# 3. 파일 업로드
echo "[3/4] Favicon 파일 업로드 중..."
scp public/favicon.ico $SERVER:$REMOTE_DIR/public/
scp public/apple-touch-icon.png $SERVER:$REMOTE_DIR/public/
scp public/icon-192.png $SERVER:$REMOTE_DIR/public/
scp public/icon-512.png $SERVER:$REMOTE_DIR/public/

# 4. layout.tsx도 업로드 (icon metadata 추가됨)
echo "[4/4] layout.tsx 업로드 및 빌드..."
scp src/app/layout.tsx $SERVER:$REMOTE_DIR/src/app/layout.tsx

# 5. 서버에서 빌드 & 재시작
ssh $SERVER "cd $REMOTE_DIR && npm run build && pm2 restart livenews"

echo ""
echo "=== 배포 완료! ==="
echo "https://livenews.co.kr 에서 favicon 확인하세요."
echo "브라우저 캐시를 지우거나 Ctrl+Shift+R로 새로고침하세요."
