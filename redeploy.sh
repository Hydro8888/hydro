#!/bin/bash
# =============================================================================
#  LiveNews 재배포 스크립트
# -----------------------------------------------------------------------------
#  어디서 실행해도 스크립트가 직접 프로젝트 폴더로 이동한 뒤 배포합니다.
#
#  사용법:
#    cd /home/ubuntu/livenews && bash redeploy.sh                # 웹 + 수집기 모두
#    bash /home/ubuntu/livenews/redeploy.sh --frontend           # 웹(livenews)만
#    bash /home/ubuntu/livenews/redeploy.sh --collector          # 수집기만
#    bash redeploy.sh --frontend --force                         # 변경 없어도 강제 재배포
#    bash redeploy.sh --frontend --backfill                      # 배포 후 미번역 제목 일괄 해소
#
#  ┌─────────────────────────────────────────────────────────────────────┐
#  │  ★ 다른 서비스 영향 없음 보장                                          │
#  │  - PM2 작업은 전부 `--only livenews[,livenews-collector]` 범위 한정    │
#  │  - `pm2 restart all` / `pm2 kill` / `pm2 delete all` / `pm2 resurrect`│
#  │     같은 전역 명령 절대 미사용 → freeai, idc-*, nn-* 등 그대로 유지     │
#  │  - `pm2 save` 는 목록 저장만 — 어떤 프로세스도 중단하지 않음            │
#  │  - 파일 작업(rm/build)은 프로젝트 폴더 내부로만 한정                    │
#  │  - 빌드 실패 시 이전 커밋 자동 롤백, 기존 프로세스는 계속 가동           │
#  └─────────────────────────────────────────────────────────────────────┘
# =============================================================================

set -euo pipefail

main() {

# ---- 색상 ----
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

# ---- 설정 ----
APP_NAME="livenews"
COLLECTOR_NAME="livenews-collector"
APP_PORT=4000
BRANCH="claude/global-news-platform-9p7Oo"
HEALTH_URL="http://localhost:${APP_PORT}/livenews/api/admin/health"
MAX_WAIT=40

# 스크립트가 있는 폴더 = 프로젝트 폴더 (어디서 실행해도 동작)
DEPLOY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---- 인자 파싱 ----
DEPLOY_WEB=0; DEPLOY_COLLECTOR=0; FORCE=0; BACKFILL=0
for arg in "$@"; do
    case "$arg" in
        --frontend|--web)      DEPLOY_WEB=1 ;;
        --collector|--worker)  DEPLOY_COLLECTOR=1 ;;
        --force)               FORCE=1 ;;
        --backfill)            BACKFILL=1 ;;
        -h|--help)
            grep -E '^#( |$)' "${BASH_SOURCE[0]}" | head -24
            exit 0 ;;
        *)
            echo -e "${RED}알 수 없는 옵션: $arg${NC}"
            echo "사용 가능: --frontend | --collector | --backfill | --force | --help"
            exit 1 ;;
    esac
done
# 대상 미지정 시 둘 다 배포
if [ "$DEPLOY_WEB" = "0" ] && [ "$DEPLOY_COLLECTOR" = "0" ]; then
    DEPLOY_WEB=1; DEPLOY_COLLECTOR=1
fi

ONLY_APPS=""
[ "$DEPLOY_WEB" = "1" ] && ONLY_APPS="$APP_NAME"
[ "$DEPLOY_COLLECTOR" = "1" ] && ONLY_APPS="${ONLY_APPS:+$ONLY_APPS,}$COLLECTOR_NAME"

# ---- NVM 로드 (node/pm2 경로 확보) ----
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   LiveNews 재배포  →  대상: ${ONLY_APPS}${NC}"
echo -e "${BLUE}==================================================${NC}"

# ---- 0. 폴더 이동 ----
cd "$DEPLOY_PATH" || { echo -e "${RED}디렉토리 없음: $DEPLOY_PATH${NC}"; exit 1; }
echo -e "작업 폴더: ${DEPLOY_PATH}"

# 안전장치: ecosystem.config.js 에 livenews 계열 외 앱이 섞여 있으면 중단
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

if [ "$PREV_COMMIT" = "$NEW_COMMIT" ] && [ "$FORCE" = "0" ]; then
    echo -e "${GREEN}      변경 없음 → 배포 생략 (강제: --force)${NC}"
    exit 0
fi

# ---- 2. 소유권 정리 (프로젝트 폴더 한정) ----
echo -e "${YELLOW}[2/6] 소유권 정리...${NC}"
if command -v sudo >/dev/null 2>&1; then
    sudo chown -R "$(id -un)":"$(id -gn)" "$DEPLOY_PATH" 2>/dev/null || true
fi

# ---- 3. 의존성 / Prisma ----
echo -e "${YELLOW}[3/6] 의존성 & Prisma...${NC}"
CHANGED=$(git diff "$PREV_COMMIT" "$NEW_COMMIT" --name-only 2>/dev/null || echo "")
if [ "$FORCE" = "1" ] || echo "$CHANGED" | grep -q "package.*json"; then
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

# ---- 4. 빌드 (웹 배포 시에만, 실패하면 롤백) ----
if [ "$DEPLOY_WEB" = "1" ]; then
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
else
    echo -e "${YELLOW}[4/6] 수집기만 배포 → Next.js 빌드 생략${NC}"
fi

# ---- 5. PM2 반영 (선택된 livenews 앱만!) ----
echo -e "${YELLOW}[5/6] PM2 반영 (--only ${ONLY_APPS})...${NC}"
# startOrReload: 실행 중이면 무중단 reload, 없으면 start. 다른 앱은 손대지 않음.
pm2 startOrReload ecosystem.config.js --only "$ONLY_APPS" --update-env
pm2 save   # 현재 목록 저장만 — 어떤 프로세스도 중단하지 않음

# ---- 6. 헬스체크 (웹 배포 시에만) ----
if [ "$DEPLOY_WEB" = "1" ]; then
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
else
    echo -e "${YELLOW}[6/6] 수집기 상태 확인...${NC}"
    sleep 2
    pm2 describe "$COLLECTOR_NAME" 2>/dev/null | grep -E "status|restarts" || true
fi

# ---- 7. (옵션) 한글 번역 백로그 일괄 해소 ----
if [ "$BACKFILL" = "1" ]; then
    echo -e "${YELLOW}[+] 번역 백필 실행 (미번역 제목 일괄 처리)...${NC}"
    # 제목만 우선 처리(빠름/저렴). 본문까지 하려면: npm run backfill:translations -- --content
    npm run backfill:translations 2>&1 | tail -30 || \
        echo -e "${RED}      백필 실패 — 수동 실행: npm run backfill:translations${NC}"
fi

echo ""
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}   재배포 완료 (${ONLY_APPS})${NC}"
echo -e "${BLUE}==================================================${NC}"
pm2 list | grep -E "id|${APP_NAME}" || true
echo ""
echo -e "변경 내역 : ${YELLOW}git log --oneline ${PREV_COMMIT:0:8}..${NEW_COMMIT:0:8}${NC}"
echo -e "롤백 방법 : ${YELLOW}git reset --hard ${PREV_COMMIT:0:8} && rm -rf .next && npm run build && pm2 reload ${APP_NAME}${NC}"

}

# git reset --hard 가 실행 중인 이 파일을 덮어써도 안전하도록,
# 전체를 main() 으로 감싸 파싱을 끝낸 뒤 실행한다.
main "$@"
exit $?
