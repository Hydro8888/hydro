#!/usr/bin/env bash
# =============================================================================
#  paperclip-nginx-api-rewrite.sh — root 절대경로 API 를 paperclip 으로 forward
#
#  배경:
#   - paperclip UI 는 /paperclip/ subpath 로 빌드됐지만, JS 안의 fetch 호출이
#     "/health", "/api/...", "/auth/..." 같이 root 절대경로로 하드코딩됨
#   - Vite base 설정은 HTML/asset URL 에만 적용되고 런타임 fetch 에는 적용 안 됨
#   - 사용자 결정(방안 B): paperclip 소스는 건드리지 않고 nginx 에서 이들 root
#     경로를 :5100 으로 forward
#
#  현재 nginx 설정 분석 결과 이들 root 경로를 쓰는 기존 서비스가 없으므로 안전:
#   - /health, /api/, /auth/, /socket.io/, /ws, /trpc/ 전부 root 에 미등록
#   - 기존 서비스들은 전부 /<name>/api 같이 subpath prefix 로 API 호출
#
#  장기 위험: 향후 다른 서비스가 root /api 등을 쓰면 paperclip 으로 새는 문제
#   → 마커(# === paperclip-api (auto) ===) 로 격리해 언제든 제거 쉽게 만듦
#
#  사용:
#     sudo bash paperclip-nginx-api-rewrite.sh
#
#  안전장치:
#   - 두 파일(hydro, multi-service) GOLDEN 백업
#   - brace-counter 로 server{} 정확히 식별
#   - diff → nginx -t (실패 시 두 파일 모두 자동 원복) → systemctl reload
#   - 회귀 검증: 15개 기존 서비스 응답코드 before vs after 비교
# =============================================================================
set -euo pipefail

APP_PORT="${APP_PORT:-5100}"
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/.paperclip-deploy-backup}"
HYDRO_CONF="${HYDRO_CONF:-/etc/nginx/sites-enabled/hydro}"
MULTI_CONF_LINK="${MULTI_CONF_LINK:-/etc/nginx/sites-enabled/multi-service}"
UI_DIST_DIR="${UI_DIST_DIR:-/home/ubuntu/paperclip/ui/dist/assets}"
TS="$(date +%Y%m%d-%H%M%S)"

C_R=$'\e[31m'; C_G=$'\e[32m'; C_Y=$'\e[33m'; C_B=$'\e[34m'; C_N=$'\e[0m'
log()  { echo "${C_B}[INFO]${C_N}  $*"; }
ok()   { echo "${C_G}[ OK ]${C_N}  $*"; }
warn() { echo "${C_Y}[WARN]${C_N}  $*"; }
err()  { echo "${C_R}[ERR ]${C_N}  $*" >&2; }
hr()   { printf '%0.s-' {1..72}; echo; }

if [[ $EUID -ne 0 ]]; then
  err "sudo 로 실행: sudo bash paperclip-nginx-api-rewrite.sh"
  exit 1
fi
if ! systemctl is-active --quiet nginx; then
  err "systemd nginx 가 active 상태가 아닙니다"
  exit 1
fi
if [[ ! -f "${HYDRO_CONF}" ]]; then
  err "필수 파일 없음: ${HYDRO_CONF}"; exit 1
fi
if [[ -L "${MULTI_CONF_LINK}" ]]; then
  MULTI_CONF="$(readlink -f "${MULTI_CONF_LINK}")"
else
  MULTI_CONF="${MULTI_CONF_LINK}"
fi
if [[ ! -f "${MULTI_CONF}" ]]; then
  err "필수 파일 없음: ${MULTI_CONF} (${MULTI_CONF_LINK})"; exit 1
fi

mkdir -p "${BACKUP_DIR}"
log "  HYDRO_CONF: ${HYDRO_CONF}"
log "  MULTI_CONF: ${MULTI_CONF} (link: ${MULTI_CONF_LINK})"
log "  APP_PORT:   ${APP_PORT}"

# ---------- 0) 진단: 빌드된 JS 번들의 절대경로 문자열 ----------
hr; log "[0/7] 진단 — paperclip UI 번들이 호출하는 root 절대경로"; hr
if [[ -d "${UI_DIST_DIR}" ]]; then
  # 모든 index-*.js 에서 루트 절대경로 문자열 추출
  # JS 번들 크기에 따라 시간이 걸릴 수 있어 head 로 제한
  BUNDLE_PATHS="$(
    for f in "${UI_DIST_DIR}"/index-*.js; do
      [[ -f "$f" ]] && grep -oE '"/[a-zA-Z][a-zA-Z0-9_./-]*"' "$f" 2>/dev/null
    done \
      | sort -u \
      | grep -vE '^"/paperclip/' \
      | head -80
  )" || true
  echo "${BUNDLE_PATHS}" | sed 's/^/  /'
  echo
  log "  위 목록에서 /paperclip/ prefix 없는 root API 경로가 rewrite 대상"
else
  warn "  ${UI_DIST_DIR} 가 없어 번들 진단 생략 (paperclip-subpath-build.sh 먼저 실행 필요)"
fi

# ---------- 1) GOLDEN 백업 ----------
hr; log "[1/7] GOLDEN 백업"; hr
GOLD_HYDRO="${BACKUP_DIR}/GOLDEN-hydro-api.${TS}"
GOLD_MULTI="${BACKUP_DIR}/GOLDEN-multi-service-api.${TS}"
cp -a "${HYDRO_CONF}" "${GOLD_HYDRO}"
cp -a "${MULTI_CONF}" "${GOLD_MULTI}"
ok "  ${HYDRO_CONF} → ${GOLD_HYDRO}"
ok "  ${MULTI_CONF} → ${GOLD_MULTI}"

# ---------- 2) baseline 응답코드 ----------
hr; log "[2/7] 기존 서비스 baseline 응답코드 (변경 전)"; hr

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
  "/paperclip/"
)
PROBE_HOSTS=(
  "free.ai.kr,/"
  "contact.ai.kr,/"
)
# 이번 스크립트가 새로 추가할 대상 경로 — before/after 비교시 CHG 로 뜨는 게 정상
NEW_PATHS=(
  "/health"
  "/api/"
  "/auth/"
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
  for p in "${NEW_PATHS[@]}"; do probe_path "${p}"; done
} | tee "${BEFORE}"

# ---------- 3) 신규안 생성 (paperclip-api 블록 삽입) ----------
hr; log "[3/7] paperclip-api 블록 삽입 (메모리상 신규안)"; hr

NEW_HYDRO="${BACKUP_DIR}/hydro-api.new.${TS}"
NEW_MULTI="${BACKUP_DIR}/multi-service-api.new.${TS}"
cp -a "${GOLD_HYDRO}" "${NEW_HYDRO}"
cp -a "${GOLD_MULTI}" "${NEW_MULTI}"

export APP_PORT

process_file() {
  local target_file="$1" selector="$2"
  TARGET_FILE="${target_file}" SELECTOR="${selector}" python3 <<'PYEOF'
import os, re, sys
path = os.environ['TARGET_FILE']
selector = os.environ['SELECTOR']
port = os.environ['APP_PORT']
START = "# === paperclip-api (auto) ==="
END   = "# === /paperclip-api end ==="

data = open(path).read()

# 기존 블록 제거 (idempotent)
data = re.sub(
    r'\s*' + re.escape(START) + r'.*?' + re.escape(END) + r'\s*',
    '\n',
    data, flags=re.DOTALL,
)

snippet = f"""
    {START}
    # paperclip UI 가 런타임에 호출하는 root 절대경로를 :{port} 으로 forward
    # 경로 충돌 없을 때만 안전 — 다른 서비스가 root /api 등을 쓰면 제거 필요
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

# server{} 블록 추출 (brace counter)
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
hr; log "[4/7] 변경 내용 diff"; hr
echo "=== sites-enabled/hydro ==="
diff -u "${GOLD_HYDRO}" "${NEW_HYDRO}" | head -90 || true
echo
echo "=== sites-available/multi-service ==="
diff -u "${GOLD_MULTI}" "${NEW_MULTI}" | head -90 || true

# ---------- 5) 적용 + nginx -t + reload ----------
hr; log "[5/7] 적용 → nginx -t → systemctl reload nginx"; hr
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
hr; log "[6/7] 변경 후 응답코드 (기존 서비스 변동 없어야 함)"; hr
AFTER="$(mktemp)"
{
  for p in "${PROBE_PATHS[@]}"; do probe_path "${p}"; done
  for hp in "${PROBE_HOSTS[@]}"; do
    probe_host "${hp%%,*}" "${hp##*,}"
  done
  for p in "${NEW_PATHS[@]}"; do probe_path "${p}"; done
} | tee "${AFTER}"

hr
echo "=========== 변경 전 vs 후 ==========="
paste <(cat "${BEFORE}") <(awk '{print $NF}' "${AFTER}") \
  | awk '{ path=$1; if (NF>=4) {path=$1" "$2; before=$3; after=$4} else {before=$2; after=$3}
           mark=(before==after)?"  OK":"CHG"; printf "  %s  %-32s  before=%s  after=%s\n", mark, path, before, after }'
hr
echo "  → 기존 17개 (jobworld ~ contact.ai.kr) 가 OK 여야 함"
echo "  → /health, /api/, /auth/ 는 CHG (404 → 2xx/3xx/405) 로 변하는 게 정상"

# ---------- 7) paperclip 자체 검증 ----------
hr; log "[7/7] paperclip 접근 검증"; hr
PC="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/paperclip/)"
HEALTH="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/health)"
echo "  /paperclip/ (Host:127.0.0.1):  ${PC}"
echo "  /health     (Host:127.0.0.1):  ${HEALTH}"

# paperclip 직접 응답 비교
PC_DIRECT="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${APP_PORT}/health 2>/dev/null || echo '000')"
echo "  direct :${APP_PORT}/health:     ${PC_DIRECT}  (paperclip 본체)"

if [[ "${HEALTH}" == "${PC_DIRECT}" ]] && [[ "${HEALTH}" =~ ^(200|204)$ ]]; then
  ok "✅ /health → paperclip 정상 forward"
else
  warn "⚠️ /health 응답(${HEALTH}) 이 paperclip 직접응답(${PC_DIRECT}) 과 다름"
  warn "   paperclip 이 /health 엔드포인트를 제공하는지 확인"
  warn "   sudo -u ubuntu pm2 logs paperclip --lines 30 --nostream"
fi

echo
ok "복구 완료. 문제 발생 시 원복:"
echo "   sudo cp '${GOLD_HYDRO}' '${HYDRO_CONF}' \\"
echo "     && sudo cp '${GOLD_MULTI}' '${MULTI_CONF}' \\"
echo "     && sudo systemctl reload nginx"
echo
echo "브라우저에서 http://211.198.54.207/paperclip/ 하드 리프레시(Ctrl+Shift+R)"
echo "후 F12 Network 탭에서 /health, /api/... 요청이 200/2xx 인지 확인하세요."
