#!/usr/bin/env bash
# ============================================================
# 회의실 예약 시스템 배포 스크립트
# 대상 서버 : 211.198.54.207 (Ubuntu, 호스트 systemd nginx)
# 외부 URL  : http://211.198.54.207/room/
# 실행 위치 : 서버의 레포 루트 (사용자가 SSH 접속한 상태)
# 사용법   : bash deploy.sh
# ============================================================
set -euo pipefail

APP_NAME="room"
APP_DIR="/home/ubuntu/${APP_NAME}"
BACKUP_DIR="/home/ubuntu/.${APP_NAME}-deploy-backup"
NGX_HYDRO="/etc/nginx/sites-enabled/hydro"
NGX_MULTI="/etc/nginx/sites-enabled/multi-service"
TS="$(date +%Y%m%d-%H%M%S)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_HTML="${SCRIPT_DIR}/index.html"

C_RESET="\033[0m"; C_BOLD="\033[1m"
C_GREEN="\033[32m"; C_YELLOW="\033[33m"; C_RED="\033[31m"; C_CYAN="\033[36m"

log()  { printf "${C_CYAN}[*]${C_RESET} %s\n" "$*"; }
ok()   { printf "${C_GREEN}[OK]${C_RESET} %s\n" "$*"; }
warn() { printf "${C_YELLOW}[!]${C_RESET} %s\n" "$*"; }
die()  { printf "${C_RED}[ERR]${C_RESET} %s\n" "$*" >&2; exit 1; }

# ---------- 0. 사전 점검 ----------
log "사전 점검"
[ -f "$SRC_HTML" ]    || die "index.html 이 스크립트와 같은 폴더에 없습니다: $SRC_HTML"
[ -f "$NGX_HYDRO" ]   || die "nginx 설정 없음: $NGX_HYDRO"
[ -f "$NGX_MULTI" ]   || die "nginx 설정 없음: $NGX_MULTI"
command -v nginx >/dev/null    || die "nginx 미설치"
command -v python3 >/dev/null  || die "python3 미설치"
command -v curl >/dev/null     || die "curl 미설치"

NGX_PID_LINE="$(sudo ss -ltnp 2>/dev/null | grep ':80 ' || true)"
if ! echo "$NGX_PID_LINE" | grep -qi nginx; then
    warn ":80 포트를 nginx 가 점유하고 있지 않음 — 확인 필요"
    echo "$NGX_PID_LINE"
fi
ok "점검 완료"

# ---------- 1. 회귀 baseline ----------
log "변경 전 응답 코드 수집 (baseline)"
BASELINE_FILE="/tmp/${APP_NAME}-deploy-before.txt"
AFTER_FILE="/tmp/${APP_NAME}-deploy-after.txt"
ENDPOINTS=(
  "/jobworld/" "/jobworld/health" "/hacker/" "/livenews/" "/agentbook/"
  "/agentmarket/" "/matching/" "/simburum/" "/aimarketer/" "/care/health"
  "/signal-test/" "/freeai/" "/halfplaza/" "/luxury/" "/yeoujob/" "/fundmanager/"
)
: > "$BASELINE_FILE"
for p in "${ENDPOINTS[@]}"; do
  code="$(curl -s -o /dev/null -m 5 -w '%{http_code}' "http://127.0.0.1${p}" || echo "ERR")"
  printf "%-25s %s\n" "$p" "$code" | tee -a "$BASELINE_FILE"
done
# Host 헤더 케이스
for h in "free.ai.kr" "contact.ai.kr"; do
  code="$(curl -s -o /dev/null -m 5 -w '%{http_code}' -H "Host: $h" http://127.0.0.1/ || echo "ERR")"
  printf "%-25s %s\n" "Host:$h /" "$code" | tee -a "$BASELINE_FILE"
done
ok "baseline 저장: $BASELINE_FILE"

# ---------- 2. 정적 파일 배치 ----------
log "정적 파일 배치 → $APP_DIR"
sudo mkdir -p "$APP_DIR"
sudo cp "$SRC_HTML" "$APP_DIR/index.html"
sudo chown -R ubuntu:ubuntu "$APP_DIR"
sudo chmod 755 "$APP_DIR"
sudo chmod 644 "$APP_DIR/index.html"
# /home/ubuntu 가 www-data 에 의해 traverse 가능해야 함
sudo chmod o+x /home/ubuntu 2>/dev/null || true
ok "$(sudo ls -la "$APP_DIR/index.html")"

# ---------- 3. GOLDEN 백업 ----------
log "nginx 설정 GOLDEN 백업 → $BACKUP_DIR (ts=$TS)"
sudo mkdir -p "$BACKUP_DIR"
sudo cp "$NGX_HYDRO" "$BACKUP_DIR/GOLDEN-hydro.conf.$TS"
sudo cp "$NGX_MULTI" "$BACKUP_DIR/GOLDEN-multi-service.conf.$TS"
ok "백업 완료"

# ---------- 4. nginx conf 삽입 ----------
LOCATION_BLOCK=$(cat <<'BLK'

    # ── room (static, 회의실 예약 시스템) ──────────────────
    location /room/ {
        alias /home/ubuntu/room/;
        index index.html;
    }
    location = /room {
        return 301 /room/;
    }
BLK
)

inject_location() {
  local target_file="$1"
  local selector="$2"
  local tmp_out
  tmp_out="$(mktemp)"

  sudo python3 - "$target_file" "$selector" "$tmp_out" "$LOCATION_BLOCK" <<'PYEOF'
import sys, re

path, selector, out_path, block = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

with open(path, 'r', encoding='utf-8') as f:
    src = f.read()

def find_server_blocks(s):
    """Return list of (server_kw_start, open_brace_idx, close_brace_idx) for
    top-level `server { ... }` blocks. Skips `#` line comments when counting braces."""
    out = []
    i = 0
    while True:
        m = re.search(r'\bserver\s*\{', s[i:])
        if not m:
            break
        kw_start = i + m.start()
        open_br = i + m.end() - 1
        depth = 1
        j = open_br + 1
        while j < len(s) and depth > 0:
            c = s[j]
            if c == '#':
                while j < len(s) and s[j] != '\n':
                    j += 1
                continue
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    out.append((kw_start, open_br, j))
                    j += 1
                    break
            j += 1
        if depth != 0:
            sys.stderr.write(f"[ERROR] unbalanced braces starting at {kw_start}\n")
            sys.exit(3)
        i = j
    return out

blocks = find_server_blocks(src)
if not blocks:
    sys.stderr.write(f"[ERROR] {path}: server block not found\n")
    sys.exit(2)

target = None
for (_, ob, cb) in blocks:
    body = src[ob+1:cb]
    if selector in body:
        if re.search(r'location\s+(=\s+)?/room(\b|/)', body):
            sys.stderr.write(f"[SKIP] {path}: 'location /room' already present\n")
            # Write unchanged content so shell step can diff
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(src)
            sys.exit(10)  # sentinel for "no change"
        target = (ob, cb)
        break

if not target:
    sys.stderr.write(f"[ERROR] {path}: no server block matches selector {selector!r}\n")
    sys.exit(2)

ob, cb = target
new_src = src[:cb] + block + "\n" + src[cb:]
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(new_src)
sys.stderr.write(f"[OK] {path}: inserted {len(block)} bytes before closing brace at {cb}\n")
PYEOF
  local rc=$?

  if [ $rc -eq 10 ]; then
    warn "$target_file: 이미 /room 블록 존재 → 변경 없음"
    rm -f "$tmp_out"
    return 0
  elif [ $rc -ne 0 ]; then
    rm -f "$tmp_out"
    die "Python 삽입 실패 ($target_file, rc=$rc)"
  fi

  # Diff preview
  echo "--- diff: $target_file ---"
  sudo diff -u "$target_file" "$tmp_out" || true
  # Atomic replace
  sudo install -m 0644 -o root -g root "$tmp_out" "$target_file"
  rm -f "$tmp_out"
  ok "$target_file 삽입 완료"
}

log "sites-enabled/hydro 에 /room 블록 삽입 (selector: default_server)"
inject_location "$NGX_HYDRO" "default_server"

log "sites-enabled/multi-service 에 /room 블록 삽입 (selector: 211.198.54.207)"
inject_location "$NGX_MULTI" "211.198.54.207"

# ---------- 5. nginx 검증 + 리로드 ----------
rollback() {
  warn "롤백 수행"
  sudo cp "$BACKUP_DIR/GOLDEN-hydro.conf.$TS" "$NGX_HYDRO"
  sudo cp "$BACKUP_DIR/GOLDEN-multi-service.conf.$TS" "$NGX_MULTI"
  sudo nginx -t && sudo systemctl reload nginx || warn "롤백 후 reload 실패 — 수동 확인 필요"
}

log "nginx -t 검증"
if ! sudo nginx -t; then
  rollback
  die "nginx -t 실패 → 롤백 완료"
fi
ok "nginx -t 통과"

log "nginx reload"
sudo systemctl reload nginx
ok "reload 완료"

# ---------- 6. 회귀 검증 ----------
log "변경 후 응답 코드 수집"
: > "$AFTER_FILE"
for p in "${ENDPOINTS[@]}"; do
  code="$(curl -s -o /dev/null -m 5 -w '%{http_code}' "http://127.0.0.1${p}" || echo "ERR")"
  printf "%-25s %s\n" "$p" "$code" | tee -a "$AFTER_FILE"
done
for h in "free.ai.kr" "contact.ai.kr"; do
  code="$(curl -s -o /dev/null -m 5 -w '%{http_code}' -H "Host: $h" http://127.0.0.1/ || echo "ERR")"
  printf "%-25s %s\n" "Host:$h /" "$code" | tee -a "$AFTER_FILE"
done

echo
log "before/after diff"
if diff -u "$BASELINE_FILE" "$AFTER_FILE"; then
  ok "회귀 없음 ✨"
else
  warn "기존 서비스 응답 코드가 바뀐 항목이 있음 → 위 diff 확인 후 필요 시 롤백"
  warn "롤백: sudo cp $BACKUP_DIR/GOLDEN-*.conf.$TS /etc/nginx/sites-enabled/ && sudo nginx -s reload"
fi

# ---------- 7. 새 엔드포인트 확인 ----------
log "새 엔드포인트 확인"
INT_CODE="$(curl -s -o /dev/null -m 5 -w '%{http_code}' http://127.0.0.1/room/ || echo ERR)"
EXT_CODE="$(curl -s -o /dev/null -m 5 -w '%{http_code}' http://211.198.54.207/room/ || echo ERR)"
printf "내부 (127.0.0.1/room/)        => %s\n" "$INT_CODE"
printf "외부 (211.198.54.207/room/)   => %s\n" "$EXT_CODE"

if curl -s -m 5 http://127.0.0.1/room/ | grep -q "회의실 예약 시스템"; then
  ok "페이지 타이틀 확인됨 (회의실 예약 시스템)"
else
  warn "페이지 본문에서 '회의실 예약 시스템' 문자열을 찾지 못함"
fi

# ---------- 8. 완료 요약 ----------
cat <<EOF

============================================
  ${C_BOLD}배포 완료${C_RESET}

  내부 접속: http://127.0.0.1/room/
  외부 접속: http://211.198.54.207/room/

  파일 위치:   $APP_DIR/index.html
  백업 경로:   $BACKUP_DIR/GOLDEN-{hydro,multi-service}.conf.$TS
  베이스라인: $BASELINE_FILE
  변경 후 :   $AFTER_FILE

  롤백 방법:
    sudo cp $BACKUP_DIR/GOLDEN-hydro.conf.$TS         $NGX_HYDRO
    sudo cp $BACKUP_DIR/GOLDEN-multi-service.conf.$TS $NGX_MULTI
    sudo nginx -t && sudo systemctl reload nginx
============================================
EOF
