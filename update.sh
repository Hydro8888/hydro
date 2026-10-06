#!/bin/bash

# ====================================================
# LiveNews 빠른 업데이트 스크립트
# 용도: 코드 변경 후 서버에 빠르게 반영
# 사용: bash update.sh
# ====================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="livenews"
APP_PORT=4000
DEPLOY_PATH="/home/ubuntu/livenews"
BRANCH="claude/global-news-platform-9p7Oo"
HEALTH_URL="http://localhost:${APP_PORT}/livenews"
MAX_WAIT=30

# NVM 로드
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd "$DEPLOY_PATH" || { echo -e "${RED}디렉토리 없음: $DEPLOY_PATH${NC}"; exit 1; }

echo -e "${BLUE}==============================${NC}"
echo -e "${BLUE}  LiveNews 빠른 업데이트${NC}"
echo -e "${BLUE}==============================${NC}"
echo ""

# ---- 현재 커밋 기록 (롤백용) ----
PREV_COMMIT=$(git rev-parse HEAD)
echo -e "${YELLOW}현재 커밋: ${PREV_COMMIT:0:8}${NC}"

# ---- 1. 코드 업데이트 ----
echo -e "${YELLOW}[1/5] 코드 업데이트...${NC}"
git fetch origin "$BRANCH" || { echo -e "${RED}git fetch 실패${NC}"; exit 1; }
git reset --hard "origin/$BRANCH"
NEW_COMMIT=$(git rev-parse HEAD)
echo -e "${GREEN}업데이트: ${PREV_COMMIT:0:8} → ${NEW_COMMIT:0:8}${NC}"

if [ "$PREV_COMMIT" = "$NEW_COMMIT" ]; then
    echo -e "${GREEN}변경 없음. 업데이트 불필요.${NC}"
    echo ""
    echo -e "강제 재빌드: ${YELLOW}bash update.sh --force${NC}"
    [ "$1" != "--force" ] && exit 0
fi

# ---- 2. 의존성 확인 ----
echo -e "${YELLOW}[2/5] 의존성 확인...${NC}"
if git diff "$PREV_COMMIT" "$NEW_COMMIT" --name-only | grep -q "package.json\|package-lock.json"; then
    echo "package.json 변경 감지 → npm install"
    npm install --production=false 2>&1 | tail -3
else
    echo "의존성 변경 없음 → 스킵"
fi

# ---- 3. Prisma 확인 ----
if git diff "$PREV_COMMIT" "$NEW_COMMIT" --name-only | grep -q "prisma/schema.prisma"; then
    echo -e "${YELLOW}[3/5] 스키마 변경 감지 → Prisma generate + db push...${NC}"
    npx prisma generate 2>&1 | tail -2
    npx prisma db push --accept-data-loss 2>&1 | tail -3
else
    echo -e "${YELLOW}[3/5] 스키마 변경 없음 → 스킵${NC}"
fi

# ---- 4. 빌드 ----
echo -e "${YELLOW}[4/5] Next.js 빌드...${NC}"
export NODE_OPTIONS="--max-old-space-size=512"
if npm run build 2>&1 | tail -15; then
    echo -e "${GREEN}빌드 성공${NC}"
else
    echo -e "${RED}빌드 실패! 이전 커밋으로 롤백...${NC}"
    git reset --hard "$PREV_COMMIT"
    echo -e "${YELLOW}롤백 완료: ${PREV_COMMIT:0:8}${NC}"
    echo -e "${RED}PM2 프로세스는 이전 빌드로 계속 실행 중${NC}"
    exit 1
fi

# ---- 5. PM2 재시작 ----
echo -e "${YELLOW}[5/5] PM2 재시작...${NC}"
pm2 restart "$APP_NAME" 2>/dev/null || pm2 start ecosystem.config.js --only "$APP_NAME"
pm2 restart "${APP_NAME}-collector" 2>/dev/null || pm2 start ecosystem.config.js --only "${APP_NAME}-collector"

# ---- 헬스체크 ----
echo ""
echo "앱 시작 대기..."
for i in $(seq 1 $MAX_WAIT); do
    sleep 1
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        echo -e "${GREEN}헬스체크 통과! (HTTP $HTTP_CODE, ${i}초)${NC}"
        break
    fi
    if [ "$i" = "$MAX_WAIT" ]; then
        echo -e "${RED}헬스체크 타임아웃 (${MAX_WAIT}초)${NC}"
        echo -e "${YELLOW}로그 확인: pm2 logs $APP_NAME --lines 30${NC}"
        echo -e "${YELLOW}롤백 방법: git reset --hard $PREV_COMMIT && npm run build && pm2 restart $APP_NAME${NC}"
    fi
done

# ---- 완료 ----
echo ""
echo -e "${BLUE}==============================${NC}"
echo -e "${GREEN}  업데이트 완료${NC}"
echo -e "${BLUE}==============================${NC}"
echo ""
pm2 list | grep -E "${APP_NAME}|Name" || true
echo ""
echo -e "변경 내역: ${YELLOW}git log --oneline ${PREV_COMMIT:0:8}..HEAD${NC}"
echo -e "롤백 방법: ${YELLOW}git reset --hard ${PREV_COMMIT:0:8} && npm run build && pm2 restart ${APP_NAME}${NC}"
