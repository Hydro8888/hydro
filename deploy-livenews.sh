#!/bin/bash
# =============================================================================
#  LiveNews 원샷 배포 스크립트
# -----------------------------------------------------------------------------
#  용도 : 코드 pull → 빌드 → PM2 반영을 한 번에 수행
#  사용 : bash deploy-livenews.sh            (변경 있을 때만 빌드)
#         bash deploy-livenews.sh --force    (변경 없어도 강제 재빌드)
#
#  ┌─────────────────────────────────────────────────────────────────────┐
#  │  ★ 다른 서비스 영향 없음 보장 (Safety Review)                          │
#  │  - PM2 작업은 전부 `--only livenews,livenews-collector` 로 범위 한정    │
#  │  - `pm2 restart all` / `pm2 kill` / `pm2 delete all` / `pm2 resurrect`│
#  │     같은 전역 명령을 절대 사용하지 않음                                  │
#  │  - `pm2 save` 는 현재 프로세스 목록을 "저장"만 하며 어떤 프로세스도      │
#  │     중단/재시작하지 않음 → freeai, idc-*, nn-* 등 그대로 유지            │
#  │  - 모든 파일 작업(chown, rm, build)은 /home/ubuntu/livenews 한정        │
#  │  - 빌드 실패 시 이전 커밋으로 자동 롤백, 기존 프로세스는 계속 가동       │
#  └─────────────────────────────────────────────────────────────────────┘
# =============================================================================

set -euo pipefail

# ---- 색상 ----
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

# ---- 설정 ----
APP_NAME="livenews"
COLLECTOR_NAME="livenews-collector"
APP_PORT=4000
DEPLOY_PATH="/home/ubuntu/livenews"
BRANCH="claude/global-news-platform-9p7Oo"
HEALTH_URL="http://localhost:${APP_PORT}/livenews/api/admin/health"
MAX_WAIT=40
FORCE="${1:-}"

# 이 두 앱만 건드린다. (안전 범위)
ONLY_APPS="${APP_NAME},${COLLECTOR_NAME}"

# ---- NVM 로드 (pm2/node 경로 확보) ----
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   LiveNews 배포 (다른 서비스 영향 없음)${NC}"
echo -e "${BLUE}==================================================${NC}"

# ---- 0. 디렉토리 진입 ----
cd "$DEPLOY_PATH" || { echo -e "${RED}디렉토리 없음: $DEPLOY_PATH${NC}"; exit 1; }

# 안전장치: ecosystem.config.js 에 livenews 계열 외 다른 앱 이름이 들어있으면 중단.
# (--only 로 범위를 한정하지만, 설정 파일 자체에 다른 서비스가 섞이는 것을 이중 차단)
OTHER_APPS=$(grep -oE "name:\s*'[^']+'" ecosystem.config.js | grep -v "livenews" || true)
if [ -n "$OTHER_APPS" ]; then
    echo -e "${RED}중단: ecosystem.config.js 에 livenews 외 앱이 포함되어 있습니다:${NC}"
    echo "$OTHER_APPS"
    exit 1
fi

# ---- 1. 코드 업데이트 (롤백용 커밋 기록) ----
PREV_COMMIT=$(git rev-parse HEAD)
echo -e "${YELLOW}[1/6] 코드 업데이트  (현재 ${PREV_COMMIT:0:8})${NC}"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
NEW_COMMIT=$(git rev-parse HEAD)
echo -e "${GREEN}      ${PREV_COMMIT:0:8} → ${NEW_COMMIT:0:8}${NC}"

if [ "$PREV_COMMIT" = "$NEW_COMMIT" ] && [ "$FORCE" != "--force" ]; then
    echo -e "${GREEN}      변경 없음 → 배포 생략 (강제: --force)${NC}"
    exit 0
fi

# ---- 2. 소유권 정리 (livenews 디렉토리 한정) ----
echo -e "${YELLOW}[2/6] 소유권 정리...${NC}"
if command -v sudo >/dev/null 2>&1; then
    sudo chown -R "$(id -un)":"$(id -gn)" "$DEPLOY_PATH" 2>/dev/null || true
fi

# ---- 3. 의존성 / Prisma (변경 시에만) ----
echo -e "${YELLOW}[3/6] 의존성 & Prisma...${NC}"
CHANGED=$(git diff "$PREV_COMMIT" "$NEW_COMMIT" --name-only 2>/dev/null || echo "")
if [ "$FORCE" = "--force" ] || echo "$CHANGED" | grep -q "package.*json"; then
    echo "      package 변경 → npm ci (postinstall 로 prisma generate 수행)"
    npm ci --no-audit --no-fund 2>&1 | tail -3
else
    echo "      의존성 변경 없음 → prisma generate 만 수행"
    npx prisma generate 2>&1 | tail -2
fi

if echo "$CHANGED" | grep -q "prisma/schema.prisma"; then
    echo -e "${RED}      ⚠ schema.prisma 변경 감지 — 데이터 안전을 위해 자동 마이그레이션은 수행하지 않습니다.${NC}"
    echo -e "${RED}        필요 시 수동 실행: npx prisma migrate deploy  (또는  npx prisma db push)${NC}"
fi

# ---- 4. 클린 빌드 (실패 시 롤백) ----
echo -e "${YELLOW}[4/6] Next.js 빌드...${NC}"
rm -rf .next
export NODE_OPTIONS="--max-old-space-size=768"
if npm run build 2>&1 | tail -15; then
    echo -e "${GREEN}      빌드 성공${NC}"
else
    echo -e "${RED}      빌드 실패! 이전 커밋으로 롤백...${NC}"
    git reset --hard "$PREV_COMMIT"
    npm run build 2>&1 | tail -5 || true
    echo -e "${YELLOW}      롤백 완료 (${PREV_COMMIT:0:8}). 기존 PM2 프로세스는 그대로 가동 중.${NC}"
    exit 1
fi

# ---- 5. PM2 반영 (livenews 2개 앱만!) ----
echo -e "${YELLOW}[5/6] PM2 반영 (--only ${ONLY_APPS})...${NC}"
# startOrReload: 실행 중이면 무중단 reload, 없으면 start. 다른 앱은 손대지 않음.
pm2 startOrReload ecosystem.config.js --only "$ONLY_APPS" --update-env
pm2 save   # 현재 목록 저장만 — 어떤 프로세스도 중단하지 않음

# ---- 6. 헬스체크 ----
echo -e "${YELLOW}[6/6] 헬스체크...${NC}"
OK=0
for i in $(seq 1 $MAX_WAIT); do
    sleep 1
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    if [ "$CODE" = "200" ]; then
        echo -e "${GREEN}      헬스체크 통과 (HTTP 200, ${i}초)${NC}"
        OK=1; break
    fi
done
if [ "$OK" != "1" ]; then
    echo -e "${RED}      헬스체크 실패 (${MAX_WAIT}초). 로그: pm2 logs ${APP_NAME} --lines 40${NC}"
    echo -e "${YELLOW}      롤백: git reset --hard ${PREV_COMMIT:0:8} && rm -rf .next && npm run build && pm2 reload ${APP_NAME}${NC}"
fi

echo ""
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}   배포 완료${NC}"
echo -e "${BLUE}==================================================${NC}"
pm2 list | grep -E "id|${APP_NAME}|${COLLECTOR_NAME}" || true
echo ""
echo -e "변경 내역 : ${YELLOW}git log --oneline ${PREV_COMMIT:0:8}..${NEW_COMMIT:0:8}${NC}"
echo -e "롤백 방법 : ${YELLOW}git reset --hard ${PREV_COMMIT:0:8} && rm -rf .next && npm run build && pm2 reload ${APP_NAME}${NC}"
