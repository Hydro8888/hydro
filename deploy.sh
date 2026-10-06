#!/bin/bash

# ====================================================
# LiveNews 배포 스크립트 (앱 전용)
# nginx 설정은 별도: sudo bash setup-nginx.sh
# ====================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="livenews"
APP_PORT=4000
DEPLOY_PATH="/home/ubuntu/livenews"
REPO_URL="git@github.com:Hydro8888/hydro.git"
BRANCH="claude/global-news-platform-9p7Oo"

echo -e "${BLUE}==============================${NC}"
echo -e "${BLUE}  LiveNews 앱 배포${NC}"
echo -e "${BLUE}==============================${NC}"
echo ""

# ---- 1. 기존 PM2 정리 ----
echo -e "${YELLOW}[1/7] 기존 프로세스 정리...${NC}"
pm2 stop ${APP_NAME} 2>/dev/null || true
pm2 stop ${APP_NAME}-collector 2>/dev/null || true
pm2 delete ${APP_NAME} 2>/dev/null || true
pm2 delete ${APP_NAME}-collector 2>/dev/null || true
echo -e "${GREEN}완료${NC}"

# ---- 2. 소스코드 ----
echo -e "${YELLOW}[2/7] 소스코드...${NC}"
if [ -d "$DEPLOY_PATH" ]; then
    cd "$DEPLOY_PATH"
    git fetch origin "$BRANCH" || echo "git fetch 실패"
    git checkout "$BRANCH" 2>/dev/null || true
    git reset --hard "origin/$BRANCH" || echo "git reset 실패"
else
    cd /home/ubuntu
    git clone "$REPO_URL" "$APP_NAME" || { echo "git clone 실패"; exit 1; }
    cd "$DEPLOY_PATH"
    git checkout "$BRANCH" || { echo "git checkout 실패"; exit 1; }
fi
echo -e "${GREEN}완료${NC}"

# ---- 3. 의존성 ----
echo -e "${YELLOW}[3/7] npm install...${NC}"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
echo "Node $(node -v)"
npm install --production=false 2>&1 | tail -3
echo -e "${GREEN}완료${NC}"

# ---- 4. 환경변수 ----
echo -e "${YELLOW}[4/7] 환경변수...${NC}"
if [ ! -f "$DEPLOY_PATH/.env" ]; then
    cat > "$DEPLOY_PATH/.env" << 'ENVEOF'
DATABASE_URL="postgresql://postgres:postgres@172.17.0.1:5432/livenews?schema=public"
REDIS_URL="redis://172.17.0.1:6379"
XAI_API_KEY="YOUR_XAI_API_KEY_HERE"
XAI_MODEL="grok-4-1-fast"
NEXT_PUBLIC_BASE_URL="http://211.198.54.207/livenews"
NEXT_PUBLIC_APP_NAME="LiveNews"
APP_PORT=4000
NODE_ENV=production
ENVEOF
    echo -e "${GREEN}.env 생성${NC}"
    echo -e "${RED}>>> .env의 XAI_API_KEY를 실제 키로 수정하세요! <<<${NC}"
else
    echo ".env 유지"
fi

# ---- 5. DB ----
echo -e "${YELLOW}[5/7] 데이터베이스...${NC}"
PG_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i postgres | head -1)
if [ -n "$PG_CONTAINER" ]; then
    docker exec -i "$PG_CONTAINER" psql -U postgres -c "CREATE DATABASE livenews;" 2>/dev/null || echo "DB 이미 존재"
else
    echo "PostgreSQL 컨테이너 미발견 - 수동 확인"
fi
npx prisma generate 2>&1 | tail -2
npx prisma db push --accept-data-loss 2>&1 | tail -3 || echo "DB push 실패"
npx tsx prisma/seed.ts 2>&1 | tail -2 || echo "시딩 실패"
echo -e "${GREEN}완료${NC}"

# ---- 6. 빌드 ----
echo -e "${YELLOW}[6/7] Next.js 빌드...${NC}"
npm run build 2>&1 | tail -10
echo -e "${GREEN}완료${NC}"

# ---- 7. PM2 시작 ----
echo -e "${YELLOW}[7/7] PM2 시작...${NC}"
pm2 start ecosystem.config.js
pm2 save 2>/dev/null || true
echo -e "${GREEN}완료${NC}"

# 시작 대기
echo ""
echo "앱 시작 대기..."
for i in $(seq 1 10); do
    sleep 2
    if ss -tlnp 2>/dev/null | grep -q ":${APP_PORT} "; then
        echo -e "${GREEN}포트 ${APP_PORT} 리스닝 확인!${NC}"
        break
    fi
    [ "$i" = "10" ] && echo -e "${RED}타임아웃 - pm2 logs ${APP_NAME} 확인${NC}"
done

echo ""
echo -e "${BLUE}==============================${NC}"
echo -e "${GREEN}  앱 배포 완료${NC}"
echo -e "${BLUE}==============================${NC}"
echo ""
echo "PM2 상태:"
pm2 list | grep -E "${APP_NAME}|Name" || true
echo ""
echo -e "${YELLOW}다음 단계: nginx 프록시 설정${NC}"
echo "  sudo bash setup-nginx.sh"
echo ""
