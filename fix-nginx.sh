#!/usr/bin/env bash
# =============================================================================
#  fix-nginx.sh — jobworld-nginx 게이트웨이에 /paperclip location 안전 삽입
#
#  배경:
#   - /etc/nginx/nginx.conf 가 실제로 외부 트래픽을 받는 default_server 를
#     포함. 기존 deploy.sh 는 엉뚱하게 /etc/nginx/conf.d/default.conf 에만
#     설정을 넣어 왔음 (nginx.conf 에 `include conf.d/*.conf` 가 없어서
#     default.conf 는 실제 로드되지 않는 "죽은 파일").
#   - 본 스크립트는 nginx.conf 의 default_server 블록 '} 직전' 에만
#     paperclip 블록을 삽입. 기존 location (jobworld, livenews 등) 는
#     순서·내용 전부 보존.
#   - default.conf 에 남아있는 paperclip 흔적은 위생 차원에서만 제거
#     (운영 영향 없음).
#
#  사용:
#     sudo bash fix-nginx.sh
#
#  안전장치:
#   - 변경 전 GOLDEN 백업
#   - Python brace-counter 로 정확한 삽입 위치 계산
#   - diff 출력 → 사용자 눈 검증
#   - nginx -t 실패 시 자동 원복
#   - 완료 후 기존 서비스 회귀 테스트 (jobworld, livenews, freeai)
# =============================================================================
set -euo pipefail

NGINX_CONTAINER="${NGINX_CONTAINER:-jobworld-nginx}"
APP_PORT="${APP_PORT:-5100}"
DOCKER_HOST_IP="${DOCKER_HOST_IP:-172.17.0.1}"
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/.paperclip-deploy-backup}"
TS="$(date +%Y%m%d-%H%M%S)"

C_R=$'\e[31m'; C_G=$'\e[32m'; C_Y=$'\e[33m'; C_B=$'\e[34m'; C_N=$'\e[0m'
log()  { echo "${C_B}[INFO]${C_N}  $*"; }
ok()   { echo "${C_G}[ OK ]${C_N}  $*"; }
warn() { echo "${C_Y}[WARN]${C_N}  $*"; }
err()  { echo "${C_R}[ERR ]${C_N}  $*" >&2; }
hr()   { printf '%0.s-' {1..72}; echo; }

if [[ $EUID -ne 0 ]]; then
  err "sudo 로 실행: sudo bash fix-nginx.sh"
  exit 1
fi
if ! docker ps --format '{{.Names}}' | grep -qx "${NGINX_CONTAINER}"; then
  err "컨테이너 ${NGINX_CONTAINER} 가 실행 중이 아닙니다."
  exit 1
fi
mkdir -p "${BACKUP_DIR}"

# ---------- 1) 골든 백업 ----------
hr; log "[1/7] GOLDEN 백업"; hr
GOLD_NGINX="${BACKUP_DIR}/GOLDEN-nginx.conf.${TS}"
GOLD_DEFAULT="${BACKUP_DIR}/GOLDEN-default.conf.${TS}"
docker exec "${NGINX_CONTAINER}" cat /etc/nginx/nginx.conf         > "${GOLD_NGINX}"
docker exec "${NGINX_CONTAINER}" cat /etc/nginx/conf.d/default.conf > "${GOLD_DEFAULT}" 2>/dev/null || true
ok "  nginx.conf   → ${GOLD_NGINX}"
ok "  default.conf → ${GOLD_DEFAULT}"

# ---------- 2) 기존 서비스 baseline ----------
hr; log "[2/7] 기존 서비스 baseline 응답코드 (변경 전)"; hr
probe() {
  local path="$1" host_header="${2:-}"
  local hdr=""
  [[ -n "${host_header}" ]] && hdr="-H Host:${host_header}"
  printf "  %-30s" "${path}${host_header:+ (Host:${host_header})}"
  curl -s -o /dev/null -w "%{http_code}\n" ${hdr} "http://127.0.0.1${path}"
}
BEFORE="$(mktemp)"
{
  probe /jobworld/
  probe /jobworld/health
  probe /livenews/
  probe /paperclip/
  probe / free.ai.kr
} | tee "${BEFORE}"

# ---------- 3) nginx.conf 수정본 생성 ----------
hr; log "[3/7] nginx.conf 에 paperclip location 삽입 (메모리상 신규안)"; hr
NEW_NGINX="${BACKUP_DIR}/nginx.conf.new.${TS}"
cp "${GOLD_NGINX}" "${NEW_NGINX}"

export APP_PORT DOCKER_HOST_IP
python3 - "${NEW_NGINX}" <<'PYEOF'
import os, re, sys
path = sys.argv[1]
data = open(path).read()

port    = os.environ['APP_PORT']
host_ip = os.environ['DOCKER_HOST_IP']

START = "# === paperclip (auto) ==="
END   = "# === /paperclip end ==="

# 기존 paperclip 블록 전부 제거 (idempotent)
data = re.sub(
    r'\s*' + re.escape(START) + r'.*?' + re.escape(END) + r'\s*',
    '\n',
    data,
    flags=re.DOTALL,
)

snippet = f"""
        {START}
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
        {END}
"""

# 모든 server{...} 블록 추출
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

# default_server 가 있는 블록 우선
target = None
for s, e in blocks:
    if 'default_server' in data[s:e]:
        target = (s, e); break
if target is None:
    if not blocks:
        sys.exit("ERROR: no server{} block found")
    target = blocks[0]

s, e = target
insert_at = e - 1   # 닫는 '}' 바로 앞
open(path, 'w').write(data[:insert_at] + snippet + data[insert_at:])
print(f"  inserted at byte {insert_at} (server block {s}..{e})")
PYEOF

# ---------- 4) diff 표시 ----------
hr; log "[4/7] 변경 내용 diff (변경은 오직 paperclip 블록 추가여야 함)"; hr
if diff -u "${GOLD_NGINX}" "${NEW_NGINX}" | head -80; then
  warn "  (diff 없음 — 이미 설정돼 있었을 수도)"
fi

# ---------- 5) 컨테이너 반영 + 문법 검사 + reload ----------
hr; log "[5/7] 적용 → nginx -t → reload"; hr
docker cp "${NEW_NGINX}" "${NGINX_CONTAINER}:/etc/nginx/nginx.conf"

if ! docker exec "${NGINX_CONTAINER}" nginx -t 2>&1; then
  err "nginx -t 실패 — 원복합니다"
  docker cp "${GOLD_NGINX}" "${NGINX_CONTAINER}:/etc/nginx/nginx.conf"
  exit 1
fi
docker exec "${NGINX_CONTAINER}" nginx -s reload
ok "nginx reload 완료"

# ---------- 6) default.conf 위생 정리 (운영 무해, simburum 등 유지) ----------
hr; log "[6/7] default.conf 에서 paperclip 잔재만 제거 (simburum 등은 유지)"; hr
if docker exec "${NGINX_CONTAINER}" test -f /etc/nginx/conf.d/default.conf; then
  CUR_DEFAULT="${BACKUP_DIR}/default.conf.current.${TS}"
  NEW_DEFAULT="${BACKUP_DIR}/default.conf.cleaned.${TS}"
  docker exec "${NGINX_CONTAINER}" cat /etc/nginx/conf.d/default.conf > "${CUR_DEFAULT}"
  cp "${CUR_DEFAULT}" "${NEW_DEFAULT}"

  python3 - "${NEW_DEFAULT}" <<'PYEOF'
import re, sys
p = sys.argv[1]
s = open(p).read()
s = re.sub(r'\s*# === paperclip \(auto\) ===.*?# === /paperclip end ===\s*', '\n', s, flags=re.DOTALL)
s = re.sub(r'\s*# === paperclip \(자동추가[^=]*?=== /paperclip end ===\s*', '\n', s, flags=re.DOTALL)
open(p, 'w').write(s)
PYEOF

  if diff -q "${CUR_DEFAULT}" "${NEW_DEFAULT}" >/dev/null; then
    log "  default.conf 에 제거할 paperclip 블록 없음 (skip)"
  else
    docker cp "${NEW_DEFAULT}" "${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf"
    if ! docker exec "${NGINX_CONTAINER}" nginx -t 2>&1; then
      warn "default.conf 정리 후 -t 실패 → 원본 복원"
      docker cp "${CUR_DEFAULT}" "${NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf"
    else
      docker exec "${NGINX_CONTAINER}" nginx -s reload
      ok "default.conf 위생 정리 + reload 완료"
    fi
  fi
else
  log "  default.conf 없음 (skip)"
fi

# ---------- 7) 회귀 검증 ----------
hr; log "[7/7] 변경 후 응답코드 (기존 서비스 변동 없어야 함)"; hr
AFTER="$(mktemp)"
{
  probe /jobworld/
  probe /jobworld/health
  probe /livenews/
  probe /paperclip/
  probe / free.ai.kr
} | tee "${AFTER}"

hr
echo "=========== 변경 전 vs 후 응답코드 ==========="
paste <(cat "${BEFORE}") <(awk '{print $NF}' "${AFTER}") \
  | awk '{ path=$1; before=$(NF-1); after=$NF; mark=(before==after)?"  OK":"CHG"; printf "  %s  %-30s  before=%s  after=%s\n", mark, path, before, after }'
hr

# paperclip 단독 체크
PC_CODE="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/paperclip/)"
if [[ "${PC_CODE}" =~ ^(200|301|302|304)$ ]]; then
  ok "✅ /paperclip/ 게이트웨이 응답: ${PC_CODE}"
  ok "브라우저에서 http://211.198.54.207/paperclip/ 접속 가능"
else
  warn "⚠️ /paperclip/ 응답이 ${PC_CODE} — 앱(:${APP_PORT}) 상태 확인 필요"
  warn "  sudo -u ubuntu pm2 logs paperclip --lines 30 --nostream"
fi

echo
ok "복구 완료. 문제 발생 시 원복:"
echo "   sudo docker cp '${GOLD_NGINX}' '${NGINX_CONTAINER}:/etc/nginx/nginx.conf' \\"
echo "     && sudo docker exec '${NGINX_CONTAINER}' nginx -s reload"
