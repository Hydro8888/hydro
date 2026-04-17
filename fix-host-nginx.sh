#!/usr/bin/env bash
# =============================================================================
#  fix-host-nginx.sh — 호스트 systemd nginx 에 /paperclip location 안전 삽입
#
#  배경:
#   - 실제 :80 게이트웨이는 호스트 systemd nginx 임 (jobworld-nginx 컨테이너 아님)
#   - 외부 IP(Host=211.198.54.207) 요청은 sites-enabled/multi-service 가 받고
#   - 내부(Host=127.0.0.1) 요청은 sites-enabled/hydro 의 default_server 가 받음
#   - 따라서 두 파일 모두에 /paperclip 블록을 idempotent 하게 삽입해야 한다
#
#  사용:
#     sudo bash fix-host-nginx.sh
#
#  안전장치:
#   - 두 파일 각각 GOLDEN 백업
#   - Python brace-counter 로 정확한 server{} 식별 (오삽입 방지)
#   - diff 출력 → nginx -t (실패 시 두 파일 모두 자동 원복) → systemctl reload nginx
#   - 회귀 검증: 13개 기존 서비스 응답코드 before vs after 비교
# =============================================================================
set -euo pipefail

APP_PORT="${APP_PORT:-5100}"
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/.paperclip-deploy-backup}"
HYDRO_CONF="${HYDRO_CONF:-/etc/nginx/sites-enabled/hydro}"
MULTI_CONF_LINK="${MULTI_CONF_LINK:-/etc/nginx/sites-enabled/multi-service}"
TS="$(date +%Y%m%d-%H%M%S)"

C_R=$'\e[31m'; C_G=$'\e[32m'; C_Y=$'\e[33m'; C_B=$'\e[34m'; C_N=$'\e[0m'
log()  { echo "${C_B}[INFO]${C_N}  $*"; }
ok()   { echo "${C_G}[ OK ]${C_N}  $*"; }
warn() { echo "${C_Y}[WARN]${C_N}  $*"; }
err()  { echo "${C_R}[ERR ]${C_N}  $*" >&2; }
hr()   { printf '%0.s-' {1..72}; echo; }

if [[ $EUID -ne 0 ]]; then
  err "sudo 로 실행: sudo bash fix-host-nginx.sh"
  exit 1
fi
if ! systemctl is-active --quiet nginx; then
  err "systemd nginx 가 active 상태가 아닙니다. systemctl status nginx 확인하세요."
  exit 1
fi
if [[ ! -f "${HYDRO_CONF}" ]]; then
  err "필수 파일 없음: ${HYDRO_CONF}"
  exit 1
fi
# multi-service 는 symlink 일 수 있음 → 실제 경로 해석
if [[ -L "${MULTI_CONF_LINK}" ]]; then
  MULTI_CONF="$(readlink -f "${MULTI_CONF_LINK}")"
else
  MULTI_CONF="${MULTI_CONF_LINK}"
fi
if [[ ! -f "${MULTI_CONF}" ]]; then
  err "필수 파일 없음: ${MULTI_CONF} (${MULTI_CONF_LINK})"
  exit 1
fi

mkdir -p "${BACKUP_DIR}"
log "  HYDRO_CONF: ${HYDRO_CONF}"
log "  MULTI_CONF: ${MULTI_CONF} (link: ${MULTI_CONF_LINK})"

# ---------- 1) GOLDEN 백업 ----------
hr; log "[1/6] GOLDEN 백업"; hr
GOLD_HYDRO="${BACKUP_DIR}/GOLDEN-hydro.${TS}"
GOLD_MULTI="${BACKUP_DIR}/GOLDEN-multi-service.${TS}"
cp -a "${HYDRO_CONF}" "${GOLD_HYDRO}"
cp -a "${MULTI_CONF}" "${GOLD_MULTI}"
ok "  ${HYDRO_CONF} → ${GOLD_HYDRO}"
ok "  ${MULTI_CONF} → ${GOLD_MULTI}"

# ---------- 2) baseline 응답코드 ----------
hr; log "[2/6] 기존 서비스 baseline 응답코드 (변경 전)"; hr

# probe path 목록 (port 80 호스트 nginx 통해서 테스트)
PROBE_PATHS=(
  "/jobworld/"
  "/jobworld/health"
  "/hacker/"
  "/livenews/"
  "/agentbook/"
  "/agentmarket/"
  "/matching/"
  "/simburum/"
  "/aimarketer/"
  "/care/health"
  "/signal-test/"
  "/freeai/"
  "/halfplaza/"
  "/luxury/"
  "/yeoujob/"
)
PROBE_HOSTS=(
  "free.ai.kr,/"
  "contact.ai.kr,/"
)

probe_path() {
  local path="$1"
  printf "  %-30s" "${path}"
  curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1${path}"
}
probe_host() {
  local host="$1" path="$2"
  printf "  %-30s" "Host:${host}${path}"
  curl -s -o /dev/null -w "%{http_code}\n" -H "Host: ${host}" "http://127.0.0.1${path}"
}

BEFORE="$(mktemp)"
{
  for p in "${PROBE_PATHS[@]}"; do probe_path "${p}"; done
  for hp in "${PROBE_HOSTS[@]}"; do
    probe_host "${hp%%,*}" "${hp##*,}"
  done
  probe_path "/paperclip/"
} | tee "${BEFORE}"

# ---------- 3) 두 파일 각각 신규안 생성 ----------
hr; log "[3/6] paperclip 블록 삽입 (메모리상 신규안)"; hr

NEW_HYDRO="${BACKUP_DIR}/hydro.new.${TS}"
NEW_MULTI="${BACKUP_DIR}/multi-service.new.${TS}"
cp -a "${GOLD_HYDRO}" "${NEW_HYDRO}"
cp -a "${GOLD_MULTI}" "${NEW_MULTI}"

export APP_PORT

# Python: 대상 server{} 블록(default_server 또는 211.198.54.207) 끝에 paperclip 삽입
process_file() {
  local target_file="$1" selector="$2"
  TARGET_FILE="${target_file}" SELECTOR="${selector}" python3 <<'PYEOF'
import os, re, sys
path = os.environ['TARGET_FILE']
selector = os.environ['SELECTOR']    # "default_server" or "211.198.54.207"
port = os.environ['APP_PORT']
START = "# === paperclip (auto) ==="
END   = "# === /paperclip end ==="

data = open(path).read()

# 기존 paperclip 블록 제거 (idempotent)
data = re.sub(
    r'\s*' + re.escape(START) + r'.*?' + re.escape(END) + r'\s*',
    '\n',
    data, flags=re.DOTALL,
)

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

# 모든 server{} 블록 추출
pos = 0
blocks = []
while True:
    m = re.search(r'\bserver\s*\{', data[pos:])
    if not m: break
    s = pos + m.start()
    i = pos + m.end()
    depth = 1
    while i < len(data) and depth > 0:
        c = data[i]
        if c == '{': depth += 1
        elif c == '}': depth -= 1
        i += 1
    if depth != 0:
        sys.exit(f"ERROR: unbalanced braces in {path}")
    blocks.append((s, i))
    pos = i

# selector 가 있는 블록 선택
target = None
for s, e in blocks:
    if selector in data[s:e]:
        target = (s, e); break
if target is None:
    sys.exit(f"ERROR: no server block with '{selector}' in {path}")

s, e = target
insert_at = e - 1
open(path, 'w').write(data[:insert_at] + snippet + data[insert_at:])
print(f"  {path}: inserted at byte {insert_at} (server {s}..{e})")
PYEOF
}

process_file "${NEW_HYDRO}" "default_server"
process_file "${NEW_MULTI}" "211.198.54.207"

# ---------- 4) diff 표시 ----------
hr; log "[4/6] 변경 내용 diff (변경은 오직 paperclip 블록 추가만이어야 함)"; hr
echo "=== sites-enabled/hydro ==="
diff -u "${GOLD_HYDRO}" "${NEW_HYDRO}" | head -60 || true
echo
echo "=== sites-available/multi-service ==="
diff -u "${GOLD_MULTI}" "${NEW_MULTI}" | head -60 || true

# ---------- 5) 적용 + nginx -t + reload (실패 시 두 파일 모두 원복) ----------
hr; log "[5/6] 적용 → nginx -t → systemctl reload nginx"; hr
cp -a "${NEW_HYDRO}" "${HYDRO_CONF}"
cp -a "${NEW_MULTI}" "${MULTI_CONF}"

if ! nginx -t 2>&1; then
  err "nginx -t 실패 — 두 파일 모두 원복"
  cp -a "${GOLD_HYDRO}" "${HYDRO_CONF}"
  cp -a "${GOLD_MULTI}" "${MULTI_CONF}"
  exit 1
fi

systemctl reload nginx
ok "systemctl reload nginx 완료"

# ---------- 6) 회귀 검증 ----------
hr; log "[6/6] 변경 후 응답코드 (기존 서비스 변동 없어야 함)"; hr
AFTER="$(mktemp)"
{
  for p in "${PROBE_PATHS[@]}"; do probe_path "${p}"; done
  for hp in "${PROBE_HOSTS[@]}"; do
    probe_host "${hp%%,*}" "${hp##*,}"
  done
  probe_path "/paperclip/"
} | tee "${AFTER}"

hr
echo "=========== 변경 전 vs 후 ==========="
paste <(cat "${BEFORE}") <(awk '{print $NF}' "${AFTER}") \
  | awk '{ path=$1; if (NF>=4) {path=$1" "$2; before=$3; after=$4} else {before=$2; after=$3}
           mark=(before==after)?"  OK":"CHG"; printf "  %s  %-32s  before=%s  after=%s\n", mark, path, before, after }'
hr

# paperclip 자체 체크 (외부 IP 와 로컬 둘 다)
PC_LOCAL="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/paperclip/)"
PC_IP="$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: 211.198.54.207' http://127.0.0.1/paperclip/)"
echo "  /paperclip/ (Host:127.0.0.1):       ${PC_LOCAL}"
echo "  /paperclip/ (Host:211.198.54.207):  ${PC_IP}"

if [[ "${PC_LOCAL}" =~ ^(200|301|302|304)$ && "${PC_IP}" =~ ^(200|301|302|304)$ ]]; then
  ok "✅ paperclip 게이트웨이 양 경로 모두 응답 정상"
  ok "브라우저에서 http://211.198.54.207/paperclip/ 접속 가능"
else
  warn "⚠️ /paperclip/ 응답 비정상 — 앱(:${APP_PORT}) 상태 확인:"
  warn "  curl -I http://127.0.0.1:${APP_PORT}/"
  warn "  sudo -u ubuntu pm2 logs paperclip --lines 30 --nostream"
fi

echo
ok "복구 완료. 문제 발생 시 원복:"
echo "   sudo cp '${GOLD_HYDRO}' '${HYDRO_CONF}' \\"
echo "     && sudo cp '${GOLD_MULTI}' '${MULTI_CONF}' \\"
echo "     && sudo systemctl reload nginx"
