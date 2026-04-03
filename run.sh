#!/bin/bash
#=============================================================================
# AI Portal Pro - 서버 실행 스크립트
# 사용법: sudo bash run.sh
#
# 이미 배포된 상태에서 빠르게 재시작/상태확인/로그보기 등을 수행합니다.
# 최초 배포는 deploy.sh를 사용하세요.
#=============================================================================

DEPLOY_DIR="/home/ubuntu/freeai"
APP_PORT="3010"
APP_NAME="freeai"
NGINX_CONTAINER="jobworld-nginx"

# 색상
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

show_menu() {
  echo ""
  echo -e "${CYAN}============================================${NC}"
  echo -e "${CYAN}  AI Portal Pro — 서버 관리${NC}"
  echo -e "${CYAN}  http://free.ai.kr/${NC}"
  echo -e "${CYAN}============================================${NC}"
  echo ""
  echo "  1) 상태 확인"
  echo "  2) 앱 재시작"
  echo "  3) 앱 중지"
  echo "  4) 앱 시작"
  echo "  5) 로그 보기 (실시간)"
  echo "  6) 에러 로그 보기"
  echo "  7) 빠른 업데이트 (git pull + build + restart)"
  echo "  8) 전체 재배포 (deploy.sh 실행)"
  echo "  9) nginx 상태 확인"
  echo "  0) 종료"
  echo ""
  read -p "  선택: " choice
}

status_check() {
  echo ""
  echo -e "${CYAN}=== PM2 프로세스 상태 ===${NC}"
  pm2 status

  echo ""
  echo -e "${CYAN}=== 앱 HTTP 응답 ===${NC}"
  APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${APP_PORT}/ 2>/dev/null || echo "연결실패")
  if [ "${APP_STATUS}" = "200" ] || [ "${APP_STATUS}" = "304" ]; then
    echo -e "  http://localhost:${APP_PORT}/ → ${GREEN}${APP_STATUS} ✓${NC}"
  else
    echo -e "  http://localhost:${APP_PORT}/ → ${RED}${APP_STATUS} ✗${NC}"
  fi

  echo ""
  echo -e "${CYAN}=== CSS 서빙 확인 ===${NC}"
  CSS_FILE=$(find ${DEPLOY_DIR}/apps/web/.next/static/css -name '*.css' 2>/dev/null | head -1)
  if [ -n "${CSS_FILE}" ]; then
    CSS_NAME=$(basename "${CSS_FILE}")
    CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${APP_PORT}/_next/static/css/${CSS_NAME}" 2>/dev/null || echo "연결실패")
    if [ "${CSS_STATUS}" = "200" ]; then
      echo -e "  CSS: ${GREEN}${CSS_STATUS} ✓ (${CSS_NAME})${NC}"
    else
      echo -e "  CSS: ${RED}${CSS_STATUS} ✗ (${CSS_NAME})${NC}"
    fi
  else
    echo -e "  CSS: ${RED}빌드된 CSS 파일 없음${NC}"
  fi

  echo ""
  echo -e "${CYAN}=== nginx 서버 블록 ===${NC}"
  if docker exec ${NGINX_CONTAINER} test -f /etc/nginx/conf.d/freeai.conf 2>/dev/null; then
    echo -e "  freeai.conf: ${GREEN}존재 ✓${NC}"
    docker exec ${NGINX_CONTAINER} grep "server_name" /etc/nginx/conf.d/freeai.conf 2>/dev/null | sed 's/^/  /'
  else
    echo -e "  freeai.conf: ${RED}없음 ✗${NC}"
  fi

  echo ""
  echo -e "${CYAN}=== 디스크 사용량 ===${NC}"
  echo "  .next/: $(du -sh ${DEPLOY_DIR}/apps/web/.next 2>/dev/null | cut -f1)"
  echo "  node_modules/: $(du -sh ${DEPLOY_DIR}/node_modules 2>/dev/null | cut -f1)"
}

app_restart() {
  echo ""
  echo "앱 재시작 중..."
  if pm2 describe ${APP_NAME} > /dev/null 2>&1; then
    pm2 restart ${APP_NAME}
    echo -e "${GREEN}✓ 재시작 완료${NC}"
  else
    echo -e "${YELLOW}프로세스가 없습니다. 시작합니다...${NC}"
    cd ${DEPLOY_DIR}
    pm2 start ecosystem.config.cjs
  fi
  pm2 save
  sleep 3
  status_check
}

app_stop() {
  echo ""
  echo "앱 중지 중..."
  pm2 stop ${APP_NAME} 2>/dev/null && echo -e "${GREEN}✓ 중지 완료${NC}" || echo -e "${RED}프로세스를 찾을 수 없습니다${NC}"
}

app_start() {
  echo ""
  echo "앱 시작 중..."
  if pm2 describe ${APP_NAME} > /dev/null 2>&1; then
    pm2 restart ${APP_NAME}
  else
    cd ${DEPLOY_DIR}
    pm2 start ecosystem.config.cjs
  fi
  pm2 save
  echo -e "${GREEN}✓ 시작 완료${NC}"
  sleep 3
  status_check
}

show_logs() {
  echo ""
  echo -e "${CYAN}실시간 로그 (Ctrl+C로 종료)${NC}"
  echo ""
  pm2 logs ${APP_NAME} --lines 50
}

show_error_logs() {
  echo ""
  echo -e "${CYAN}=== 최근 에러 로그 (30줄) ===${NC}"
  echo ""
  pm2 logs ${APP_NAME} --err --lines 30
}

quick_update() {
  echo ""
  echo -e "${CYAN}=== 빠른 업데이트 시작 ===${NC}"

  REAL_USER="${SUDO_USER:-$(whoami)}"
  REAL_HOME=$(eval echo "~${REAL_USER}")

  # SSH 키 탐색
  if [ -f "${REAL_HOME}/.ssh/id_ed25519" ]; then
    SSH_KEY="${REAL_HOME}/.ssh/id_ed25519"
  elif [ -f "${REAL_HOME}/.ssh/id_rsa" ]; then
    SSH_KEY="${REAL_HOME}/.ssh/id_rsa"
  else
    echo -e "${RED}SSH 키를 찾을 수 없습니다${NC}"
    return 1
  fi
  GIT_SSH_CMD="ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no"

  echo ""
  echo "[1/4] git pull..."
  cd ${DEPLOY_DIR}
  GIT_SSH_COMMAND="${GIT_SSH_CMD}" git pull origin claude/ai-portal-dev-plan-yI3Gd

  echo ""
  echo "[2/4] 오래된 빌드 캐시 삭제..."
  rm -rf ${DEPLOY_DIR}/apps/web/.next

  echo ""
  echo "[3/4] 빌드..."
  pnpm build

  echo ""
  echo "[4/4] PM2 재시작..."
  if pm2 describe ${APP_NAME} > /dev/null 2>&1; then
    pm2 delete ${APP_NAME}
  fi
  pm2 start ecosystem.config.cjs
  pm2 save

  sleep 5
  echo ""
  echo -e "${GREEN}=== 업데이트 완료 ===${NC}"
  status_check
}

full_deploy() {
  echo ""
  echo -e "${YELLOW}전체 재배포를 시작합니다 (deploy.sh 실행)${NC}"
  read -p "계속하시겠습니까? (y/N): " confirm
  if [ "${confirm}" = "y" ] || [ "${confirm}" = "Y" ]; then
    cd ${DEPLOY_DIR}
    bash deploy.sh
  else
    echo "취소되었습니다."
  fi
}

nginx_status() {
  echo ""
  echo -e "${CYAN}=== nginx 설정 파일 ===${NC}"
  docker exec ${NGINX_CONTAINER} ls -la /etc/nginx/conf.d/ 2>/dev/null || echo -e "${RED}nginx 컨테이너에 접근할 수 없습니다${NC}"

  echo ""
  echo -e "${CYAN}=== freeai.conf 내용 ===${NC}"
  docker exec ${NGINX_CONTAINER} cat /etc/nginx/conf.d/freeai.conf 2>/dev/null || echo -e "${RED}freeai.conf가 없습니다${NC}"

  echo ""
  echo -e "${CYAN}=== nginx 설정 테스트 ===${NC}"
  docker exec ${NGINX_CONTAINER} nginx -t 2>&1
}

# 인자가 있으면 바로 실행
case "${1}" in
  status)   status_check; exit 0 ;;
  restart)  app_restart; exit 0 ;;
  stop)     app_stop; exit 0 ;;
  start)    app_start; exit 0 ;;
  logs)     show_logs; exit 0 ;;
  errors)   show_error_logs; exit 0 ;;
  update)   quick_update; exit 0 ;;
  deploy)   full_deploy; exit 0 ;;
  nginx)    nginx_status; exit 0 ;;
  help)
    echo "사용법: sudo bash run.sh [명령어]"
    echo ""
    echo "  status   - 상태 확인"
    echo "  restart  - 앱 재시작"
    echo "  stop     - 앱 중지"
    echo "  start    - 앱 시작"
    echo "  logs     - 실시간 로그"
    echo "  errors   - 에러 로그"
    echo "  update   - 빠른 업데이트 (git pull + build + restart)"
    echo "  deploy   - 전체 재배포"
    echo "  nginx    - nginx 설정 확인"
    echo ""
    echo "인자 없이 실행하면 대화형 메뉴가 표시됩니다."
    exit 0
    ;;
esac

# 인자 없으면 대화형 메뉴
while true; do
  show_menu
  case "${choice}" in
    1) status_check ;;
    2) app_restart ;;
    3) app_stop ;;
    4) app_start ;;
    5) show_logs ;;
    6) show_error_logs ;;
    7) quick_update ;;
    8) full_deploy ;;
    9) nginx_status ;;
    0) echo "종료합니다."; exit 0 ;;
    *) echo -e "${RED}잘못된 선택입니다.${NC}" ;;
  esac
done
