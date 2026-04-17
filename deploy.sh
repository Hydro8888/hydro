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
cat > "${ENV_FILE}" <<EOF
# 자동 생성됨 - $(date -Iseconds)
NODE_ENV=production
HOST=0.0.0.0
PORT=${PAPERCLIP_PORT}
BASE_URL=/paperclip
PUBLIC_URL=/paperclip
BASE_PATH=/paperclip

# 내장 PostgreSQL
DATABASE_URL=postgresql://paperclip:paperclip@127.0.0.1:${PG_PORT}/paperclip
PGPORT=${PG_PORT}

# AI (xAI Grok 4.1 Fast Reasoning)
XAI_API_KEY=${XAI_API_KEY}
XAI_MODEL=${XAI_MODEL}
OPENAI_BASE_URL=https://api.x.ai/v1
OPENAI_API_KEY=${XAI_API_KEY}
OPENAI_MODEL=${XAI_MODEL}
EOF
chown "${APP_USER}:${APP_USER}" "${ENV_FILE}"
chmod 600 "${ENV_FILE}"
ok ".env 작성 완료 (${ENV_FILE})"

# -------------------------- [6/10] 의존성 / 빌드 -----------------------------
hr
log "[6/10] pnpm install & build"
hr
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

# package.json 의 start 스크립트 존재 여부 확인 → fallback 결정
# paperclip 은 monorepo 라 root 에 start 가 없을 수 있음 → server 워크스페이스 검사
START_CMD=""
START_ARGS=""

has_script() {
  # $1 = package.json 경로, $2 = 스크립트명
  [[ -f "$1" ]] || return 1
  node -e "try{const p=require('$1');process.exit(p.scripts&&p.scripts['$2']?0:1)}catch(e){process.exit(1)}" 2>/dev/null
}

if has_script "${APP_DIR}/package.json" "start"; then
  START_CMD="pnpm"; START_ARGS="start"
elif has_script "${APP_DIR}/server/package.json" "start"; then
  # @paperclipai/server 패턴 (paperclipai/paperclip)
  START_CMD="pnpm"; START_ARGS="--filter @paperclipai/server start"
  log "  server 워크스페이스의 start 스크립트 사용"
elif has_script "${APP_DIR}/server/package.json" "start:prod"; then
  START_CMD="pnpm"; START_ARGS="--filter @paperclipai/server start:prod"
elif has_script "${APP_DIR}/package.json" "start:prod"; then
  START_CMD="pnpm"; START_ARGS="run start:prod"
elif has_script "${APP_DIR}/package.json" "serve"; then
  START_CMD="pnpm"; START_ARGS="run serve"
elif [[ -f "${APP_DIR}/server/dist/index.js" ]]; then
  START_CMD="node"; START_ARGS="server/dist/index.js"
elif [[ -f "${APP_DIR}/server/dist/src/index.js" ]]; then
  START_CMD="node"; START_ARGS="server/dist/src/index.js"
elif [[ -f "${APP_DIR}/dist/index.js" ]]; then
  START_CMD="node"; START_ARGS="dist/index.js"
elif [[ -f "${APP_DIR}/packages/server/dist/index.js" ]]; then
  START_CMD="node"; START_ARGS="packages/server/dist/index.js"
elif has_script "${APP_DIR}/package.json" "paperclipai"; then
  # paperclipai CLI 를 통해 기동 (serve 서브커맨드 가정)
  START_CMD="pnpm"; START_ARGS="paperclipai serve"
  warn "  'paperclipai serve' fallback 사용 — 실행 실패 시 CLI 인자 조정 필요"
else
  err "기동 명령을 판별할 수 없습니다."
  err "  ${APP_DIR}/server/package.json 의 scripts 를 확인해 주세요."
  exit 1
fi

log "  기동 명령: ${START_CMD} ${START_ARGS}"

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
    cwd: "${APP_DIR}",
    env: {
      NODE_ENV: "production",
      HOST: "0.0.0.0",
      PORT: "${PAPERCLIP_PORT}",
      BASE_URL: "/paperclip",
      PUBLIC_URL: "/paperclip",
      BASE_PATH: "/paperclip"
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
log "[9/10] jobworld-nginx 컨테이너에 /paperclip location 추가"
hr

# 컨테이너가 실제로 로딩한 server 블록이 들어있는 conf 파일 찾기
#  (default.conf 가 아닐 수 있으므로 nginx -T 출력으로 탐색)
NGINX_CONF_CANDIDATE="${NGINX_CONF_IN_CONTAINER}"
if ! docker exec "${NGINX_CONTAINER}" test -f "${NGINX_CONF_CANDIDATE}" 2>/dev/null; then
  NGINX_CONF_CANDIDATE="$(docker exec "${NGINX_CONTAINER}" sh -c '
    nginx -T 2>/dev/null \
      | awk "/^# configuration file/ {sub(/:$/, \"\", \$4); print \$4}" \
      | while read f; do
          if grep -qE "^[[:space:]]*server[[:space:]]*\{" "\$f"; then
            echo "\$f"; break
          fi
        done
  ')"
fi
if [[ -z "${NGINX_CONF_CANDIDATE}" ]]; then
  err "nginx server 블록을 가진 설정 파일을 찾지 못했습니다"
  exit 1
fi
log "  사용할 nginx 설정 파일 (컨테이너 내부): ${NGINX_CONF_CANDIDATE}"

NGINX_BACKUP="${HOST_BACKUP_DIR}/nginx.conf.before-paperclip-$(date +%Y%m%d-%H%M%S)"
docker exec "${NGINX_CONTAINER}" cat "${NGINX_CONF_CANDIDATE}" > "${NGINX_BACKUP}"
ok "nginx 설정 백업: ${NGINX_BACKUP}"

NEW_CONF="${HOST_BACKUP_DIR}/nginx.conf.new-$(date +%s)"
cp "${NGINX_BACKUP}" "${NEW_CONF}"

# Python 으로 안전하게: 기존 paperclip 블록 제거 후 첫 server { } 내부 말미에 삽입
PAPERCLIP_MARK_START="# === paperclip (auto) ==="
PAPERCLIP_MARK_END="# === /paperclip end ==="

export PAPERCLIP_PORT DOCKER_HOST_IP PAPERCLIP_MARK_START PAPERCLIP_MARK_END
python3 - "${NEW_CONF}" <<'PYEOF'
import os, re, sys
path = sys.argv[1]
with open(path, 'r') as f:
    data = f.read()

start_mark = os.environ['PAPERCLIP_MARK_START']
end_mark   = os.environ['PAPERCLIP_MARK_END']
port       = os.environ['PAPERCLIP_PORT']
host_ip    = os.environ['DOCKER_HOST_IP']

# 1) 기존 paperclip 블록 전부 제거 (재실행 시 갱신)
pat = re.compile(
    re.escape(start_mark) + r'.*?' + re.escape(end_mark) + r'\s*',
    re.DOTALL)
data = pat.sub('', data)

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

# 2) 첫 번째 "server {" 블록의 매칭 '}' 찾기 (중괄호 카운트)
m = re.search(r'\bserver\s*\{', data)
if not m:
    sys.stderr.write("no server { block found\n"); sys.exit(1)
i = m.end()
depth = 1
while i < len(data) and depth > 0:
    c = data[i]
    if c == '{': depth += 1
    elif c == '}': depth -= 1
    i += 1
if depth != 0:
    sys.stderr.write("unbalanced braces in server block\n"); sys.exit(1)
close = i - 1   # 위치: 매칭되는 닫는 '}' 인덱스

new = data[:close] + snippet + data[close:]
with open(path, 'w') as f:
    f.write(new)
PYEOF

# 컨테이너로 복사
docker cp "${NEW_CONF}" "${NGINX_CONTAINER}:${NGINX_CONF_CANDIDATE}"

# 문법 검사 → 실패 시 원복
if ! docker exec "${NGINX_CONTAINER}" nginx -t 2>&1; then
  err "nginx 문법 오류 — 백업으로 복원"
  docker cp "${NGINX_BACKUP}" "${NGINX_CONTAINER}:${NGINX_CONF_CANDIDATE}"
  exit 1
fi

register_rollback "docker cp '${NGINX_BACKUP}' '${NGINX_CONTAINER}:${NGINX_CONF_CANDIDATE}' && docker exec '${NGINX_CONTAINER}' nginx -s reload"

docker exec "${NGINX_CONTAINER}" nginx -s reload
ok "nginx reload 완료"

# 실제 적용된 블록 확인
log "  적용 결과 확인:"
docker exec "${NGINX_CONTAINER}" sh -c "nginx -T 2>/dev/null | grep -E 'location.*paperclip|proxy_pass.*${PAPERCLIP_PORT}' || true" | sed 's/^/    /'

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
