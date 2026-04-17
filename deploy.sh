#!/usr/bin/env bash
# =============================================================================
#  Paperclip (paperclipai/paperclip) 배포 스크립트
#  대상 서버: Ubuntu (211.198.54.207), jobworld-nginx(Docker) 게이트웨이 환경
#  외부 접속: http://211.198.54.207/paperclip/
#
#  사용법 (서버에 이미 SSH 로 접속한 상태에서):
#      sudo bash deploy.sh
#
#  설계 원칙:
#   - 기존 PM2 서비스 / nginx 설정 / iptables 규칙에 영향 금지
#   - 포트 충돌 방지: 자동 탐색
#   - idempotent: 재실행해도 안전
#   - 실패 시 자동 롤백
# =============================================================================
set -euo pipefail

# -------------------------- 설정 (상수) --------------------------------------
APP_NAME="paperclip"
APP_DIR="/home/ubuntu/paperclip"
REPO_URL="https://github.com/paperclipai/paperclip.git"
SERVER_PUBLIC_IP="211.198.54.207"
NGINX_CONTAINER="jobworld-nginx"
NGINX_CONF_IN_CONTAINER="/etc/nginx/conf.d/default.conf"
HOST_BACKUP_DIR="/home/ubuntu/.paperclip-deploy-backup"
DOCKER_HOST_IP="172.17.0.1"          # nginx 컨테이너 → 호스트 접근용 IP
DOCKER_NETS=("172.17.0.0/16" "172.18.0.0/16")
PORT_RANGE_START=5100
PORT_RANGE_END=5199
PG_PORT_RANGE_START=55432
PG_PORT_RANGE_END=55532

# xAI Grok 4.1 Fast Reasoning
#   키는 스크립트에 하드코딩하지 않습니다 (GitHub push protection / 유출 방지).
#   실행 시 다음 중 하나로 전달:
#     1) 환경변수:  sudo XAI_API_KEY=xai-... bash deploy.sh
#     2) 키 파일:   /home/ubuntu/.paperclip.xai-key  (한 줄에 키만, chmod 600)
#     3) 미제공 시: 대화형으로 입력받음
XAI_API_KEY="${XAI_API_KEY:-}"
XAI_MODEL="${XAI_MODEL:-grok-4-1-fast-reasoning}"
XAI_KEY_FILE="${XAI_KEY_FILE:-/home/ubuntu/.paperclip.xai-key}"

if [[ -z "${XAI_API_KEY}" && -r "${XAI_KEY_FILE}" ]]; then
  XAI_API_KEY="$(tr -d '[:space:]' < "${XAI_KEY_FILE}")"
fi
if [[ -z "${XAI_API_KEY}" ]]; then
  if [[ -t 0 ]]; then
    read -r -s -p "xAI API Key 입력 (xai-...): " XAI_API_KEY
    echo
  fi
fi
if [[ -z "${XAI_API_KEY}" ]]; then
  echo "ERROR: XAI_API_KEY 가 비어있습니다. 환경변수로 전달하거나 ${XAI_KEY_FILE} 에 저장하세요." >&2
  exit 1
fi

# -------------------------- 로그 / 컬러 --------------------------------------
C_RED=$'\e[31m'; C_GREEN=$'\e[32m'; C_YEL=$'\e[33m'; C_BLUE=$'\e[34m'; C_RST=$'\e[0m'
log()  { echo "${C_BLUE}[INFO]${C_RST}  $*"; }
ok()   { echo "${C_GREEN}[ OK ]${C_RST}  $*"; }
warn() { echo "${C_YEL}[WARN]${C_RST}  $*"; }
err()  { echo "${C_RED}[ERR ]${C_RST}  $*" >&2; }
hr()   { printf '%0.s-' {1..72}; echo; }

# -------------------------- 롤백 관리 ---------------------------------------
ROLLBACK_ACTIONS=()
register_rollback() { ROLLBACK_ACTIONS+=("$1"); }

do_rollback() {
  warn "오류 발생 → 롤백 시작"
  # 역순 실행
  for ((i=${#ROLLBACK_ACTIONS[@]}-1; i>=0; i--)); do
    local act="${ROLLBACK_ACTIONS[$i]}"
    warn "  rollback: ${act}"
    bash -c "${act}" || true
  done
  err "롤백 완료. 배포 중단."
}
trap 'do_rollback' ERR

# -------------------------- 사전 점검 ---------------------------------------
if [[ $EUID -ne 0 ]]; then
  err "sudo 로 실행해야 합니다: sudo bash deploy.sh"
  exit 1
fi

# Ubuntu 기본 유저 (pm2 등 기존 프로세스 실행 유저) — 보통 ubuntu
APP_USER="ubuntu"
if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  APP_USER="$(logname 2>/dev/null || echo ubuntu)"
fi
APP_HOME="$(getent passwd "${APP_USER}" | cut -d: -f6)"
log "실행 유저(루트), 앱 소유 유저: ${APP_USER} (홈: ${APP_HOME})"

mkdir -p "${HOST_BACKUP_DIR}"
chown "${APP_USER}:${APP_USER}" "${HOST_BACKUP_DIR}" || true

hr
log "[1/10] 사전 점검"
hr

# Docker 설치 여부
if ! command -v docker >/dev/null 2>&1; then
  err "docker 가 설치되어 있지 않습니다. 기존 게이트웨이(jobworld-nginx)가 없습니다."
  exit 1
fi

# nginx 컨테이너 확인
if ! docker ps --format '{{.Names}}' | grep -qx "${NGINX_CONTAINER}"; then
  err "Docker 컨테이너 '${NGINX_CONTAINER}' 가 실행 중이 아닙니다."
  docker ps --format 'table {{.Names}}\t{{.Status}}' || true
  exit 1
fi
ok "nginx 게이트웨이 컨테이너 확인: ${NGINX_CONTAINER}"

# PM2 존재 여부 (ubuntu 유저 기준)
if ! sudo -u "${APP_USER}" -H bash -lc 'command -v pm2 >/dev/null 2>&1'; then
  warn "PM2 가 ${APP_USER} 유저 PATH 에 없습니다. 설치를 시도합니다."
  sudo -u "${APP_USER}" -H bash -lc 'npm install -g pm2' \
    || { err "pm2 설치 실패"; exit 1; }
fi

# 기존 PM2 프로세스 스냅샷 (백업)
PM2_SNAPSHOT="${HOST_BACKUP_DIR}/pm2-before-$(date +%Y%m%d-%H%M%S).json"
sudo -u "${APP_USER}" -H bash -lc 'pm2 jlist 2>/dev/null' > "${PM2_SNAPSHOT}" || true
ok "기존 PM2 상태 스냅샷: ${PM2_SNAPSHOT}"

# -------------------------- [2/10] 포트 탐색 --------------------------------
hr
log "[2/10] 사용 가능한 포트 탐색"
hr

port_in_use() {
  local p="$1"
  # LISTEN 중?
  if ss -ltn "sport = :${p}" 2>/dev/null | awk 'NR>1{exit 0} END{exit 1}'; then
    return 0
  fi
  return 1
}

find_free_port() {
  local start="$1" end="$2" p
  for ((p=start; p<=end; p++)); do
    if ! port_in_use "${p}"; then
      echo "${p}"; return 0
    fi
  done
  return 1
}

# 기존 paperclip 이 이미 배포되어 있으면 동일 포트 재사용 (idempotent)
PAPERCLIP_PORT=""
if [[ -f "${APP_DIR}/.env" ]] && grep -q '^PORT=' "${APP_DIR}/.env" 2>/dev/null; then
  EXISTING_PORT="$(grep '^PORT=' "${APP_DIR}/.env" | head -1 | cut -d= -f2)"
  if [[ -n "${EXISTING_PORT}" ]]; then
    PAPERCLIP_PORT="${EXISTING_PORT}"
    log "기존 .env 의 PORT 재사용: ${PAPERCLIP_PORT}"
  fi
fi
if [[ -z "${PAPERCLIP_PORT}" ]]; then
  PAPERCLIP_PORT="$(find_free_port "${PORT_RANGE_START}" "${PORT_RANGE_END}")" \
    || { err "사용 가능한 포트가 ${PORT_RANGE_START}-${PORT_RANGE_END} 에 없습니다"; exit 1; }
fi
ok "paperclip 앱 포트: ${PAPERCLIP_PORT}"

PG_PORT=""
if [[ -f "${APP_DIR}/.env" ]] && grep -q '^DATABASE_URL=' "${APP_DIR}/.env" 2>/dev/null; then
  EXISTING_PG="$(grep '^DATABASE_URL=' "${APP_DIR}/.env" | head -1 | sed -E 's|.*:([0-9]+)/.*|\1|')"
  if [[ "${EXISTING_PG}" =~ ^[0-9]+$ ]]; then
    PG_PORT="${EXISTING_PG}"
    log "기존 .env 의 PG PORT 재사용: ${PG_PORT}"
  fi
fi
if [[ -z "${PG_PORT}" ]]; then
  PG_PORT="$(find_free_port "${PG_PORT_RANGE_START}" "${PG_PORT_RANGE_END}")" \
    || { err "사용 가능한 PG 포트가 없습니다"; exit 1; }
fi
ok "paperclip 내장 PG 포트: ${PG_PORT}"

# -------------------------- [3/10] 런타임 설치 -------------------------------
hr
log "[3/10] 런타임 설치 (Node.js 20 / pnpm / git 등)"
hr

# 필수 패키지 (apt)
APT_NEEDED=()
for pkg in git curl ca-certificates build-essential python3 iptables-persistent ufw; do
  if ! dpkg -s "${pkg}" >/dev/null 2>&1; then
    APT_NEEDED+=("${pkg}")
  fi
done
if [[ ${#APT_NEEDED[@]} -gt 0 ]]; then
  log "apt 설치: ${APT_NEEDED[*]}"
  DEBIAN_FRONTEND=noninteractive apt-get update -y
  DEBIAN_FRONTEND=noninteractive apt-get install -y "${APT_NEEDED[@]}"
fi

# Node.js 20 — 기존 node 가 20+ 면 건드리지 않는다 (다른 서비스 보호)
NODE_OK="no"
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
  if [[ "${NODE_MAJOR}" -ge 20 ]]; then
    NODE_OK="yes"
    log "기존 Node.js $(node -v) 재사용 (전역 버전 유지)"
  fi
fi

if [[ "${NODE_OK}" != "yes" ]]; then
  warn "Node.js 20+ 미설치. ${APP_USER} 유저 nvm 으로 로컬 설치 시도 (전역 영향 없음)"
  sudo -u "${APP_USER}" -H bash -lc '
    export NVM_DIR="$HOME/.nvm"
    if [ ! -s "$NVM_DIR/nvm.sh" ]; then
      curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    fi
    . "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm alias default 20
  '
fi

# pnpm (corepack)
if command -v node >/dev/null 2>&1 && [[ "$(node -v | sed -E 's/^v([0-9]+).*/\1/')" -ge 20 ]]; then
  corepack enable >/dev/null 2>&1 || true
  corepack prepare pnpm@latest --activate >/dev/null 2>&1 || true
fi
sudo -u "${APP_USER}" -H bash -lc '
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  if ! command -v pnpm >/dev/null 2>&1; then
    corepack enable 2>/dev/null || true
    corepack prepare pnpm@latest --activate 2>/dev/null || npm install -g pnpm
  fi
  pnpm --version || true
'

# -------------------------- [4/10] 소스 배포 --------------------------------
hr
log "[4/10] 소스 코드 가져오기: ${REPO_URL}"
hr

if [[ -d "${APP_DIR}/.git" ]]; then
  log "기존 디렉터리 존재 → git pull"
  sudo -u "${APP_USER}" -H bash -lc "cd '${APP_DIR}' && git fetch --all && git reset --hard origin/HEAD || git pull --ff-only"
elif [[ -d "${APP_DIR}" ]]; then
  local_backup="${APP_DIR}.bak.$(date +%s)"
  warn "기존 ${APP_DIR} 가 git 저장소가 아님 → ${local_backup} 로 백업"
  mv "${APP_DIR}" "${local_backup}"
  sudo -u "${APP_USER}" -H bash -lc "git clone '${REPO_URL}' '${APP_DIR}'"
else
  sudo -u "${APP_USER}" -H bash -lc "git clone '${REPO_URL}' '${APP_DIR}'"
fi
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
ok "소스 준비 완료: ${APP_DIR}"

# -------------------------- [5/10] .env 생성 --------------------------------
hr
log "[5/10] .env 생성"
hr
ENV_FILE="${APP_DIR}/.env"
# PAPERCLIP_HOME: paperclip 의 런타임 데이터(인스턴스/DB) 저장 위치
PAPERCLIP_HOME_DIR="${APP_HOME}/.paperclip-data"
install -d -o "${APP_USER}" -g "${APP_USER}" -m 755 "${PAPERCLIP_HOME_DIR}"
install -d -o "${APP_USER}" -g "${APP_USER}" -m 755 "${PAPERCLIP_HOME_DIR}/instances/default"

# BETTER_AUTH_SECRET 은 세션/토큰 서명용 — 한번 생성하면 재사용해야 세션 유지
SECRET_FILE="${PAPERCLIP_HOME_DIR}/.better-auth-secret"
if [[ -s "${SECRET_FILE}" ]]; then
  BETTER_AUTH_SECRET="$(tr -d '[:space:]' < "${SECRET_FILE}")"
  log "  기존 BETTER_AUTH_SECRET 재사용 (${SECRET_FILE})"
else
  # 기존 .env 에 이미 있으면 거기서 복구
  if [[ -f "${ENV_FILE}" ]] && grep -q '^BETTER_AUTH_SECRET=' "${ENV_FILE}" 2>/dev/null; then
    BETTER_AUTH_SECRET="$(grep '^BETTER_AUTH_SECRET=' "${ENV_FILE}" | head -1 | cut -d= -f2-)"
    log "  이전 .env 의 BETTER_AUTH_SECRET 복구"
  else
    BETTER_AUTH_SECRET="$(openssl rand -hex 32 2>/dev/null \
                          || head -c 48 /dev/urandom | base64 | tr -d '/+=\n')"
    log "  새 BETTER_AUTH_SECRET 생성 (영속화: ${SECRET_FILE})"
  fi
  umask 077
  printf '%s\n' "${BETTER_AUTH_SECRET}" > "${SECRET_FILE}"
  chown "${APP_USER}:${APP_USER}" "${SECRET_FILE}"
  chmod 600 "${SECRET_FILE}"
fi

cat > "${ENV_FILE}" <<EOF
# 자동 생성됨 - $(date -Iseconds)
NODE_ENV=production
HOST=0.0.0.0
PORT=${PAPERCLIP_PORT}
SERVE_UI=true

# paperclip 런타임 설정 (Dockerfile ENV 에서 차용)
PAPERCLIP_HOME=${PAPERCLIP_HOME_DIR}
PAPERCLIP_INSTANCE_ID=default
PAPERCLIP_CONFIG=${PAPERCLIP_HOME_DIR}/instances/default/config.json
PAPERCLIP_DEPLOYMENT_MODE=authenticated
PAPERCLIP_DEPLOYMENT_EXPOSURE=private
OPENCODE_ALLOW_ALL_MODELS=true

# 인증 시크릿 (better-auth 서명키, 한번 생성 후 고정)
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
PAPERCLIP_AGENT_JWT_SECRET=${BETTER_AUTH_SECRET}
# better-auth 는 full URL(protocol+host) 을 요구 — 상대경로 "/paperclip" 이면 ERR_INVALID_URL
BETTER_AUTH_URL=http://${SERVER_PUBLIC_IP}/paperclip
PAPERCLIP_PUBLIC_URL=http://${SERVER_PUBLIC_IP}/paperclip
AUTH_TRUSTED_ORIGINS=http://${SERVER_PUBLIC_IP},http://127.0.0.1,http://localhost

# 서브경로 배포 힌트 (앱이 지원할 경우) — 주의: BASE_URL 은 better-auth 가 상대경로로 오해하므로 제외
PUBLIC_URL=/paperclip
BASE_PATH=/paperclip

# AI (xAI Grok 4.1 Fast Reasoning, OpenAI 호환 엔드포인트)
XAI_API_KEY=${XAI_API_KEY}
XAI_MODEL=${XAI_MODEL}
OPENAI_BASE_URL=https://api.x.ai/v1
OPENAI_API_KEY=${XAI_API_KEY}
OPENAI_MODEL=${XAI_MODEL}
EOF
chown "${APP_USER}:${APP_USER}" "${ENV_FILE}"
chmod 600 "${ENV_FILE}"
ok ".env 작성 완료 (${ENV_FILE})"
ok "PAPERCLIP_HOME: ${PAPERCLIP_HOME_DIR}"

# -------------------------- [6/10] 의존성 / 빌드 -----------------------------
hr
log "[6/10] pnpm install & build (subpath 대응)"
hr

# paperclip UI 는 Vite 기본 `base: '/'` 라서 subpath 서빙 시 asset 이 깨진다.
# 빌드 전에 ui/vite.config 에 `base: '/paperclip/'` 를 idempotent 하게 주입.
PAPERCLIP_SUBPATH="${PAPERCLIP_SUBPATH:-/paperclip/}"
VITE_CONFIG=""
for f in "${APP_DIR}/ui/vite.config.ts" "${APP_DIR}/ui/vite.config.js" "${APP_DIR}/ui/vite.config.mjs"; do
  if [[ -f "$f" ]]; then VITE_CONFIG="$f"; break; fi
done
if [[ -n "${VITE_CONFIG}" ]]; then
  log "  Vite config 패치: ${VITE_CONFIG} → base='${PAPERCLIP_SUBPATH}'"
  cp -a "${VITE_CONFIG}" "${VITE_CONFIG}.bak.$(date +%s)"
  SUBPATH="${PAPERCLIP_SUBPATH}" TARGET="${VITE_CONFIG}" python3 <<'PYEOF'
import os, re, sys
path = os.environ['TARGET']
base = os.environ['SUBPATH']
data = open(path).read()
# 1) 이미 있는 base 값 치환
m = re.search(r'(^[ \t]*base\s*:\s*)(["\'])[^"\']*\2', data, re.MULTILINE)
if m:
    data = data[:m.start()] + m.group(1) + "'" + base + "'" + data[m.end():]
else:
    # 2) 여러 Vite config 패턴 지원 — 가장 먼저 매치되는 object literal 여는 { 뒤에 삽입
    patterns = [
        r'=>\s*\(\s*\{',         # arrow returning object: `=> ({`  (paperclip 패턴)
        r'defineConfig\s*\(\s*\{',# 직접 객체: defineConfig({
        r'export\s+default\s*\{',# export default {
    ]
    m = None
    for p in patterns:
        m = re.search(p, data)
        if m: break
    if not m:
        sys.exit("지원되는 Vite config 패턴을 찾지 못함 (vite.config 수동 검토 필요)")
    data = data[:m.end()] + f"\n  base: '{base}'," + data[m.end():]
open(path, 'w').write(data)
PYEOF
  chown "${APP_USER}:${APP_USER}" "${VITE_CONFIG}"
else
  warn "  ui/vite.config.* 없음 — subpath base 패치 skip"
fi

sudo -u "${APP_USER}" -H bash -lc "
  export NVM_DIR=\"\$HOME/.nvm\"
  [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
  cd '${APP_DIR}'
  if [ -f pnpm-lock.yaml ]; then
    pnpm install --frozen-lockfile || pnpm install
  else
    pnpm install
  fi
  if pnpm run | grep -qE '^[[:space:]]+build'; then
    pnpm build || { echo 'build 실패 (계속 진행)'; exit 0; }
  fi
" || warn "install/build 중 일부 경고 — 로그 확인 필요"

# 빌드 결과 검증: UI HTML 에 subpath prefix 가 들어갔는지
UI_DIST_HTML=""
for cand in "${APP_DIR}/ui/dist/index.html" "${APP_DIR}/server/ui-dist/index.html"; do
  [[ -f "$cand" ]] && { UI_DIST_HTML="$cand"; break; }
done
if [[ -n "${UI_DIST_HTML}" ]]; then
  if grep -qE "src=\"${PAPERCLIP_SUBPATH%/}/assets/" "${UI_DIST_HTML}"; then
    ok "  UI 빌드 결과가 '${PAPERCLIP_SUBPATH}' subpath 로 빌드됨 (${UI_DIST_HTML})"
  else
    warn "  UI HTML 의 asset 이 subpath prefix 를 포함하지 않음 — 렌더가 깨질 수 있음"
    warn "  수동 확인: grep 'src=' ${UI_DIST_HTML} | head"
  fi
fi

# DB 마이그레이션 (있을 때만)
sudo -u "${APP_USER}" -H bash -lc "
  export NVM_DIR=\"\$HOME/.nvm\"
  [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
  cd '${APP_DIR}'
  if pnpm run 2>/dev/null | grep -qE '^[[:space:]]+db:migrate'; then
    pnpm db:migrate || echo 'db:migrate 경고 (수동 확인 필요)'
  fi
" || true

# -------------------------- [7/10] PM2 기동 ---------------------------------
hr
log "[7/10] PM2 로 ${APP_NAME} 기동"
hr

# paperclip 기동 명령은 Dockerfile CMD 를 그대로 따름:
#   node --import ./server/node_modules/tsx/dist/loader.mjs server/dist/index.js
# 이유: workspace 패키지들이 exports 를 "./src/index.ts" 로 노출하므로
# runtime 에 tsx loader 로 .ts 파일 transpile 이 필요.
START_CMD="node"
TSX_LOADER_REL="./server/node_modules/tsx/dist/loader.mjs"
TSX_LOADER_ABS="${APP_DIR}/server/node_modules/tsx/dist/loader.mjs"
SERVER_ENTRY_REL="server/dist/index.js"
SERVER_ENTRY_ABS="${APP_DIR}/${SERVER_ENTRY_REL}"

if [[ ! -f "${SERVER_ENTRY_ABS}" ]]; then
  err "server 빌드 산출물이 없습니다: ${SERVER_ENTRY_ABS}"
  err "  pnpm build 재실행이 필요합니다."
  exit 1
fi
if [[ ! -f "${TSX_LOADER_ABS}" ]]; then
  err "tsx loader 가 없습니다: ${TSX_LOADER_ABS}"
  err "  pnpm install 재실행이 필요합니다."
  exit 1
fi

START_ARGS="--import ${TSX_LOADER_REL} ${SERVER_ENTRY_REL}"
log "  기동 명령 (cwd=${APP_DIR}):"
log "    ${START_CMD} ${START_ARGS}"

# PM2 ecosystem 파일: paperclip root 가 "type":"module" 이면 .js 는 ESM 으로 파싱됨
# → CommonJS(module.exports) 를 유지하기 위해 확장자를 .cjs 로 강제
ECO_FILE="${APP_DIR}/ecosystem.paperclip.config.cjs"
# 이전 실행이 남긴 .js 버전 제거 (혼선 방지)
rm -f "${APP_DIR}/ecosystem.paperclip.config.js"
cat > "${ECO_FILE}" <<EOF
module.exports = {
  apps: [{
    name: "${APP_NAME}",
    script: "${START_CMD}",
    args: "${START_ARGS}",
    interpreter: "none",
    cwd: "${APP_DIR}",
    env: {
      NODE_ENV: "production",
      HOST: "0.0.0.0",
      PORT: "${PAPERCLIP_PORT}",
      SERVE_UI: "true",
      PAPERCLIP_HOME: "${PAPERCLIP_HOME_DIR}",
      PAPERCLIP_INSTANCE_ID: "default",
      PAPERCLIP_CONFIG: "${PAPERCLIP_HOME_DIR}/instances/default/config.json",
      PAPERCLIP_DEPLOYMENT_MODE: "authenticated",
      PAPERCLIP_DEPLOYMENT_EXPOSURE: "private",
      OPENCODE_ALLOW_ALL_MODELS: "true",
      BETTER_AUTH_SECRET: "${BETTER_AUTH_SECRET}",
      PAPERCLIP_AGENT_JWT_SECRET: "${BETTER_AUTH_SECRET}",
      BETTER_AUTH_URL: "http://${SERVER_PUBLIC_IP}/paperclip",
      PAPERCLIP_PUBLIC_URL: "http://${SERVER_PUBLIC_IP}/paperclip",
      AUTH_TRUSTED_ORIGINS: "http://${SERVER_PUBLIC_IP},http://127.0.0.1,http://localhost",
      PUBLIC_URL: "/paperclip",
      BASE_PATH: "/paperclip",
      XAI_API_KEY: "${XAI_API_KEY}",
      XAI_MODEL: "${XAI_MODEL}",
      OPENAI_BASE_URL: "https://api.x.ai/v1",
      OPENAI_API_KEY: "${XAI_API_KEY}",
      OPENAI_MODEL: "${XAI_MODEL}"
    },
    max_memory_restart: "1G",
    out_file: "${APP_HOME}/.pm2/logs/${APP_NAME}-out.log",
    error_file: "${APP_HOME}/.pm2/logs/${APP_NAME}-error.log",
    time: true
  }]
};
EOF
chown "${APP_USER}:${APP_USER}" "${ECO_FILE}"

if ! sudo -u "${APP_USER}" -H bash -lc "
  export NVM_DIR=\"\$HOME/.nvm\"
  [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
  cd '${APP_DIR}'
  pm2 delete '${APP_NAME}' 2>/dev/null || true
  pm2 start '${ECO_FILE}' --update-env
  pm2 save
"; then
  err "pm2 start 실패 — 위 에러 메시지 확인"
  exit 1
fi
register_rollback "sudo -u ${APP_USER} -H bash -lc 'pm2 delete ${APP_NAME} 2>/dev/null; pm2 save'"
ok "PM2 ${APP_NAME} 기동 요청 완료"

# -------------------------- [8/10] 방화벽 ------------------------------------
hr
log "[8/10] iptables DOCKER-USER + UFW 규칙 추가"
hr

ensure_iptables_rule() {
  local src="$1" port="$2"
  if iptables -C DOCKER-USER -s "${src}" -p tcp --dport "${port}" -j ACCEPT 2>/dev/null; then
    log "  iptables 규칙 이미 존재: ${src} -> :${port}"
  else
    iptables -I DOCKER-USER -s "${src}" -p tcp --dport "${port}" -j ACCEPT
    ok "  iptables 추가: ${src} -> :${port}"
    register_rollback "iptables -D DOCKER-USER -s ${src} -p tcp --dport ${port} -j ACCEPT 2>/dev/null || true"
  fi
}

# DOCKER-USER 체인 없으면 생성 (docker 재시작 후 없을 수 있음)
iptables -N DOCKER-USER 2>/dev/null || true

for net in "${DOCKER_NETS[@]}"; do
  ensure_iptables_rule "${net}" "${PAPERCLIP_PORT}"
done

# 영속화 (iptables-persistent)
if command -v netfilter-persistent >/dev/null 2>&1; then
  netfilter-persistent save >/dev/null 2>&1 || true
elif [[ -d /etc/iptables ]]; then
  iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
fi

# UFW
if command -v ufw >/dev/null 2>&1; then
  for net in "${DOCKER_NETS[@]}"; do
    if ! ufw status | grep -q "${net}.*${PAPERCLIP_PORT}"; then
      ufw allow from "${net}" to any port "${PAPERCLIP_PORT}" proto tcp >/dev/null 2>&1 || true
      ok "  ufw 추가: ${net} -> :${PAPERCLIP_PORT}"
    fi
  done
fi

# -------------------------- [9/10] nginx 설정 -------------------------------
hr
log "[9/10] nginx 게이트웨이에 /paperclip location 추가"
hr

# 우선순위:
#   1) 호스트 systemd nginx 가 active 면 → /etc/nginx/sites-enabled/{hydro,multi-service}
#      에 직접 삽입 (proxy_pass http://127.0.0.1:PORT/)
#   2) 호스트 nginx 가 없으면 → 기존 Docker 컨테이너 로직으로 fallback

NGINX_MODE="docker"
if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet nginx; then
  NGINX_MODE="host"
  log "  호스트 systemd nginx 가 active → 호스트 설정 모드"
else
  log "  호스트 systemd nginx 비활성 → Docker 컨테이너 모드"
fi

if [[ "${NGINX_MODE}" == "host" ]]; then
  # ===== 호스트 nginx 모드 =====
  HYDRO_CONF="/etc/nginx/sites-enabled/hydro"
  MULTI_LINK="/etc/nginx/sites-enabled/multi-service"
  if [[ -L "${MULTI_LINK}" ]]; then
    MULTI_CONF="$(readlink -f "${MULTI_LINK}")"
  else
    MULTI_CONF="${MULTI_LINK}"
  fi

  # 두 파일 중 어느 한쪽이라도 없으면 fallback
  if [[ ! -f "${HYDRO_CONF}" || ! -f "${MULTI_CONF}" ]]; then
    warn "  hydro 또는 multi-service 설정 파일을 찾지 못함 → Docker 모드로 fallback"
    NGINX_MODE="docker"
  fi
fi

if [[ "${NGINX_MODE}" == "host" ]]; then
  log "  대상 파일: ${HYDRO_CONF}"
  log "  대상 파일: ${MULTI_CONF}"

  HYDRO_BACKUP="${HOST_BACKUP_DIR}/hydro.before-paperclip-$(date +%Y%m%d-%H%M%S)"
  MULTI_BACKUP="${HOST_BACKUP_DIR}/multi-service.before-paperclip-$(date +%Y%m%d-%H%M%S)"
  cp -a "${HYDRO_CONF}" "${HYDRO_BACKUP}"
  cp -a "${MULTI_CONF}" "${MULTI_BACKUP}"

  # 헬퍼: 한 파일에 paperclip 블록 삽입 (selector 가 있는 server{} 의 끝에)
  insert_paperclip_block() {
    local target="$1" selector="$2"
    TARGET_FILE="${target}" SELECTOR="${selector}" PORT="${PAPERCLIP_PORT}" \
      python3 <<'PYEOF'
import os, re, sys
path = os.environ['TARGET_FILE']
selector = os.environ['SELECTOR']
port = os.environ['PORT']
START = "# === paperclip (auto) ==="
END   = "# === /paperclip end ==="

data = open(path).read()
data = re.sub(r'\s*' + re.escape(START) + r'.*?' + re.escape(END) + r'\s*',
              '\n', data, flags=re.DOTALL)

snippet = f"""
    {START}
    location = /paperclip {{
        return 301 /paperclip/;
    }}
    location /paperclip/ {{
        proxy_pass http://127.0.0.1:{port}/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /paperclip;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        client_max_body_size 50m;
    }}
    {END}
"""

pos = 0; blocks = []
while True:
    m = re.search(r'\bserver\s*\{', data[pos:])
    if not m: break
    s = pos + m.start(); i = pos + m.end(); depth = 1
    while i < len(data) and depth > 0:
        if data[i] == '{': depth += 1
        elif data[i] == '}': depth -= 1
        i += 1
    if depth != 0: sys.exit(f"unbalanced in {path}")
    blocks.append((s, i)); pos = i

target = None
for s, e in blocks:
    if selector in data[s:e]:
        target = (s, e); break
if target is None:
    sys.exit(f"no server block with '{selector}' in {path}")

s, e = target
open(path, 'w').write(data[:s] + data[s:e-1] + snippet + data[e-1:])
PYEOF
  }

  insert_paperclip_block "${HYDRO_CONF}" "default_server"
  insert_paperclip_block "${MULTI_CONF}" "211.198.54.207"

  # paperclip-api: UI JS 가 런타임에 /health, /api/..., /auth/... 같은
  # root 절대경로를 호출함. Vite base 는 이들까지 자동 rewrite 해주지 않아
  # nginx 에서 :${PAPERCLIP_PORT} 으로 직접 forward 한다.
  # 현재 이 root 경로들을 쓰는 다른 서비스가 없어 안전하지만 마커로 격리해
  # 향후 제거하기 쉽게 유지한다.
  insert_paperclip_api_block() {
    local target="$1" selector="$2"
    TARGET_FILE="${target}" SELECTOR="${selector}" PORT="${PAPERCLIP_PORT}" \
      python3 <<'PYEOF'
import os, re, sys
path = os.environ['TARGET_FILE']
selector = os.environ['SELECTOR']
port = os.environ['PORT']
START = "# === paperclip-api (auto) ==="
END   = "# === /paperclip-api end ==="

data = open(path).read()
data = re.sub(r'\s*' + re.escape(START) + r'.*?' + re.escape(END) + r'\s*',
              '\n', data, flags=re.DOTALL)

snippet = f"""
    {START}
    # paperclip UI 의 런타임 절대경로 API 호출을 :{port} 으로 forward
    location = /health {{
        proxy_pass http://127.0.0.1:{port}/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /paperclip;
    }}
    location /api/ {{
        proxy_pass http://127.0.0.1:{port}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /paperclip;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        client_max_body_size 50m;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }}
    location /auth/ {{
        proxy_pass http://127.0.0.1:{port}/auth/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /paperclip;
    }}
    location /socket.io/ {{
        proxy_pass http://127.0.0.1:{port}/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }}
    location = /ws {{
        proxy_pass http://127.0.0.1:{port}/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }}
    location /trpc/ {{
        proxy_pass http://127.0.0.1:{port}/trpc/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /paperclip;
    }}
    {END}
"""

pos = 0; blocks = []
while True:
    m = re.search(r'\bserver\s*\{', data[pos:])
    if not m: break
    s = pos + m.start(); i = pos + m.end(); depth = 1
    while i < len(data) and depth > 0:
        if data[i] == '{': depth += 1
        elif data[i] == '}': depth -= 1
        i += 1
    if depth != 0: sys.exit(f"unbalanced in {path}")
    blocks.append((s, i)); pos = i

target = None
for s, e in blocks:
    if selector in data[s:e]:
        target = (s, e); break
if target is None:
    sys.exit(f"no server block with '{selector}' in {path}")

s, e = target
open(path, 'w').write(data[:s] + data[s:e-1] + snippet + data[e-1:])
PYEOF
  }

  insert_paperclip_api_block "${HYDRO_CONF}" "default_server"
  insert_paperclip_api_block "${MULTI_CONF}" "211.198.54.207"

  # nginx -t 실패 시 두 파일 모두 원복
  if ! nginx -t 2>&1; then
    err "nginx 문법 오류 — 두 파일 모두 백업으로 복원"
    cp -a "${HYDRO_BACKUP}" "${HYDRO_CONF}"
    cp -a "${MULTI_BACKUP}" "${MULTI_CONF}"
    exit 1
  fi
  register_rollback "cp -a '${HYDRO_BACKUP}' '${HYDRO_CONF}' && cp -a '${MULTI_BACKUP}' '${MULTI_CONF}' && systemctl reload nginx"

  systemctl reload nginx
  ok "systemctl reload nginx 완료"
  log "  적용 결과 확인 (paperclip 라인):"
  grep -n "paperclip\|:${PAPERCLIP_PORT}" "${HYDRO_CONF}" "${MULTI_CONF}" 2>/dev/null \
    | head -20 | sed 's/^/    /' || true
fi

if [[ "${NGINX_MODE}" == "docker" ]]; then
  # ===== Docker 컨테이너 fallback 모드 =====

# 컨테이너 경로 → 호스트 bind-mount 경로 해석
# (bind-mount 된 파일은 컨테이너 내부 Read-only 또는 docker cp unlink 실패
#  가능성이 있으므로, 호스트 원본에 직접 쓴다)
resolve_host_path() {
  local cpath="$1" cparent cbase hpath hparent
  hpath="$(docker inspect "${NGINX_CONTAINER}" \
    --format "{{range .Mounts}}{{if eq .Destination \"${cpath}\"}}{{.Source}}{{end}}{{end}}")"
  if [[ -n "${hpath}" ]]; then echo "${hpath}"; return 0; fi
  cparent="$(dirname "${cpath}")"; cbase="$(basename "${cpath}")"
  hparent="$(docker inspect "${NGINX_CONTAINER}" \
    --format "{{range .Mounts}}{{if eq .Destination \"${cparent}\"}}{{.Source}}{{end}}{{end}}")"
  if [[ -n "${hparent}" ]]; then echo "${hparent}/${cbase}"; return 0; fi
  echo ""
}

write_container_file() {
  local cpath="$1" src="$2" hpath
  hpath="$(resolve_host_path "${cpath}")"
  if [[ -n "${hpath}" ]]; then
    cp -f "${src}" "${hpath}"
  else
    docker exec -i "${NGINX_CONTAINER}" sh -c "cat > '${cpath}'" < "${src}"
  fi
}

# 실제 외부 트래픽을 받는 설정 파일 탐색:
#   nginx -T 의 "# configuration file <path>:" 중에서
#   'default_server' 가 포함된 server{} 를 가진 파일을 선택한다.
#   (많은 환경이 conf.d/default.conf 에 include 가 안 걸려 있어
#    그 파일에 넣어도 적용되지 않는 함정이 존재)
NGINX_CONF_CANDIDATE="$(docker exec "${NGINX_CONTAINER}" sh -lc '
  set -e
  nginx -T 2>/dev/null | awk "
    /^# configuration file/ { f=\$4; sub(/:$/, \"\", f); next }
    /default_server/ { if (f) { print f; exit } }
  "
')"

# fallback: default_server 가 없는 환경 → server{} 가 있는 첫 파일
if [[ -z "${NGINX_CONF_CANDIDATE}" ]]; then
  warn "default_server 블록을 찾지 못함 — server{} 첫 파일로 fallback"
  NGINX_CONF_CANDIDATE="$(docker exec "${NGINX_CONTAINER}" sh -lc '
    nginx -T 2>/dev/null | awk "
      /^# configuration file/ { f=\$4; sub(/:$/, \"\", f); next }
      /^[[:space:]]*server[[:space:]]*\{/ { if (f) { print f; exit } }
    "
  ')"
fi
if [[ -z "${NGINX_CONF_CANDIDATE}" ]]; then
  err "nginx 설정 파일을 찾지 못했습니다 (nginx -T 출력 확인 필요)"
  exit 1
fi
log "  사용할 nginx 설정 파일 (컨테이너 내부): ${NGINX_CONF_CANDIDATE}"

NGINX_BACKUP="${HOST_BACKUP_DIR}/nginx.conf.before-paperclip-$(date +%Y%m%d-%H%M%S)"
docker exec "${NGINX_CONTAINER}" cat "${NGINX_CONF_CANDIDATE}" > "${NGINX_BACKUP}"
ok "nginx 설정 백업: ${NGINX_BACKUP}"

NEW_CONF="${HOST_BACKUP_DIR}/nginx.conf.new-$(date +%s)"
cp "${NGINX_BACKUP}" "${NEW_CONF}"

# Python: 기존 paperclip 블록 제거 후 default_server 를 가진 server{} 말미에 삽입
PAPERCLIP_MARK_START="# === paperclip (auto) ==="
PAPERCLIP_MARK_END="# === /paperclip end ==="

export PAPERCLIP_PORT DOCKER_HOST_IP PAPERCLIP_MARK_START PAPERCLIP_MARK_END
python3 - "${NEW_CONF}" <<'PYEOF'
import os, re, sys
path = sys.argv[1]
data = open(path, 'r').read()

start_mark = os.environ['PAPERCLIP_MARK_START']
end_mark   = os.environ['PAPERCLIP_MARK_END']
port       = os.environ['PAPERCLIP_PORT']
host_ip    = os.environ['DOCKER_HOST_IP']

# 1) 기존 paperclip 블록 전부 제거 (재실행 시 갱신)
data = re.sub(
    r'\s*' + re.escape(start_mark) + r'.*?' + re.escape(end_mark) + r'\s*',
    '\n',
    data,
    flags=re.DOTALL,
)
# 옛 버전이 남긴 "자동추가 ..." 마커도 청소 (호환성)
data = re.sub(
    r'\s*# === paperclip \(자동추가[^=]*?=== /paperclip end ===\s*',
    '\n',
    data,
    flags=re.DOTALL,
)

snippet = f"""
        {start_mark}
        location = /paperclip {{
            return 301 /paperclip/;
        }}
        location /paperclip/ {{
            proxy_pass http://{host_ip}:{port}/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Prefix /paperclip;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout 300s;
            proxy_send_timeout 300s;
            client_max_body_size 50m;
        }}
        {end_mark}
"""

# 2) 모든 server{...} 블록 추출
pos = 0
blocks = []
while True:
    m = re.search(r'\bserver\s*\{', data[pos:])
    if not m:
        break
    s = pos + m.start()
    i = pos + m.end()
    depth = 1
    while i < len(data) and depth > 0:
        c = data[i]
        if c == '{': depth += 1
        elif c == '}': depth -= 1
        i += 1
    if depth != 0:
        sys.exit("ERROR: unbalanced braces in server block")
    blocks.append((s, i))
    pos = i

# 3) default_server 를 가진 블록 우선 선택 (없으면 첫 블록)
target = None
for s, e in blocks:
    if 'default_server' in data[s:e]:
        target = (s, e)
        break
if target is None and blocks:
    target = blocks[0]
if target is None:
    sys.exit("ERROR: no server{} block found")

s, e = target
insert_at = e - 1   # 닫는 '}' 바로 앞
open(path, 'w').write(data[:insert_at] + snippet + data[insert_at:])
PYEOF

# 컨테이너로 복사 — bind-mount 된 파일이면 호스트 원본에 직접 쓰기
write_container_file "${NGINX_CONF_CANDIDATE}" "${NEW_CONF}"

# 문법 검사 → 실패 시 즉시 원복
if ! docker exec "${NGINX_CONTAINER}" nginx -t 2>&1; then
  err "nginx 문법 오류 — 백업으로 복원"
  write_container_file "${NGINX_CONF_CANDIDATE}" "${NGINX_BACKUP}"
  exit 1
fi

HOST_NGINX_PATH="$(resolve_host_path "${NGINX_CONF_CANDIDATE}")"
if [[ -n "${HOST_NGINX_PATH}" ]]; then
  register_rollback "cp -f '${NGINX_BACKUP}' '${HOST_NGINX_PATH}' && docker exec '${NGINX_CONTAINER}' nginx -s reload"
else
  register_rollback "docker exec -i '${NGINX_CONTAINER}' sh -c 'cat > ${NGINX_CONF_CANDIDATE}' < '${NGINX_BACKUP}' && docker exec '${NGINX_CONTAINER}' nginx -s reload"
fi

docker exec "${NGINX_CONTAINER}" nginx -s reload
ok "nginx reload 완료"

# 실제 적용된 블록 확인
log "  적용 결과 확인:"
docker exec "${NGINX_CONTAINER}" sh -c "nginx -T 2>/dev/null | grep -E 'location.*paperclip|proxy_pass.*${PAPERCLIP_PORT}' || true" | sed 's/^/    /'
fi  # end of NGINX_MODE == "docker" block

# 기존 서비스 회귀 확인 — 게이트웨이 응답코드가 변경되지 않았는지
log "  기존 서비스 응답코드 (paperclip 외에는 이전과 동일해야 함):"
for probe_path in /jobworld/ /jobworld/health /livenews/ /hacker/ /agentbook/; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1${probe_path}" || echo 000)"
  printf '    %-30s %s\n' "${probe_path}" "${code}"
done
code="$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: free.ai.kr' 'http://127.0.0.1/' || echo 000)"
printf '    %-30s %s\n' '/ (Host:free.ai.kr)' "${code}"

# -------------------------- [10/10] 검증 ------------------------------------
hr
log "[10/10] 검증"
hr

# 앱이 뜨기까지 잠깐 대기
for i in 1 2 3 4 5 6 7 8 9 10; do
  if ss -ltn "sport = :${PAPERCLIP_PORT}" | awk 'NR>1{exit 0} END{exit 1}'; then
    ok "앱이 :${PAPERCLIP_PORT} 에서 LISTEN"
    break
  fi
  log "  앱 기동 대기 ${i}/10 ..."
  sleep 3
done

LOCAL_STATUS="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PAPERCLIP_PORT}/" || echo 000)"
GATE_STATUS_SLASH="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1/paperclip/" || echo 000)"
GATE_STATUS_BARE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1/paperclip"  || echo 000)"

log "  로컬 앱 응답:              ${LOCAL_STATUS}     (http://127.0.0.1:${PAPERCLIP_PORT}/)"
log "  게이트웨이 응답 (/ 포함): ${GATE_STATUS_SLASH}  (http://127.0.0.1/paperclip/)"
log "  게이트웨이 응답 (/ 없음): ${GATE_STATUS_BARE}   (http://127.0.0.1/paperclip)"
GATE_STATUS="${GATE_STATUS_SLASH}"

# -------------------------- 최종 요약 ---------------------------------------
trap - ERR
hr
echo "${C_GREEN}============================================${C_RST}"
echo "${C_GREEN}  배포 완료${C_RST}"
echo ""
echo "  내부 접속: http://127.0.0.1/paperclip/"
echo "  외부 접속: http://${SERVER_PUBLIC_IP}/paperclip/"
echo ""
echo "  사용 포트: ${PAPERCLIP_PORT}  (PG: ${PG_PORT})"
echo "  소스 위치: ${APP_DIR}"
echo "  환경변수:  ${APP_DIR}/.env  (chmod 600)"
echo "  PM2 설정:  ${ECO_FILE}"
echo ""
echo "  PM2 상태:    pm2 status"
echo "  PM2 로그:    pm2 logs ${APP_NAME}"
echo "  PM2 재시작:  pm2 restart ${APP_NAME}"
echo ""
echo "  nginx 백업:  ${NGINX_BACKUP}"
echo "  PM2 스냅샷:  ${PM2_SNAPSHOT}"
echo "${C_GREEN}============================================${C_RST}"

sudo -u "${APP_USER}" -H bash -lc 'pm2 status || true'

if [[ "${GATE_STATUS}" =~ ^(200|301|302|304)$ ]]; then
  ok "외부 경로 응답 정상 (HTTP ${GATE_STATUS})"
else
  warn "게이트웨이 응답 ${GATE_STATUS} — 앱이 아직 준비 중이거나 subpath 설정이 필요할 수 있습니다."
  warn "  1) pm2 logs ${APP_NAME} 확인"
  warn "  2) ${APP_DIR}/.env 의 BASE_URL/PUBLIC_URL/BASE_PATH 중 프로젝트가 요구하는 키 확인"
  warn "  3) 필요시 pnpm rebuild 후 pm2 restart ${APP_NAME}"
fi
