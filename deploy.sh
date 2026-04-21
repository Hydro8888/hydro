#!/usr/bin/env bash
# ============================================================
# 회의실 예약 시스템 배포 스크립트 (v2: SQLite + PM2 백엔드)
# 대상 서버 : 211.198.54.207 (Ubuntu, 호스트 systemd nginx)
# 외부 URL  : http://211.198.54.207/room/
# 백엔드   : Node.js + Express + better-sqlite3, PM2 'room', 포트 5110
# 실행 위치 : 서버의 레포 루트 (사용자가 SSH 접속한 상태)
# 사용법   : bash deploy.sh
# ============================================================
set -euo pipefail

APP_NAME="room"
APP_PORT="5110"  # 5100 은 paperclip 점유 중 → 5110 사용
APP_DIR="/home/ubuntu/${APP_NAME}"
DATA_DIR="${APP_DIR}/data"
LOGS_DIR="${APP_DIR}/logs"
BACKUP_DIR="/home/ubuntu/.${APP_NAME}-deploy-backup"
NGX_HYDRO="/etc/nginx/sites-enabled/hydro"
NGX_MULTI="/etc/nginx/sites-enabled/multi-service"
TS="$(date +%Y%m%d-%H%M%S)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

C_RESET="\033[0m"; C_BOLD="\033[1m"
C_GREEN="\033[32m"; C_YELLOW="\033[33m"; C_RED="\033[31m"; C_CYAN="\033[36m"
log()  { printf "${C_CYAN}[*]${C_RESET} %s\n" "$*"; }
ok()   { printf "${C_GREEN}[OK]${C_RESET} %s\n" "$*"; }
warn() { printf "${C_YELLOW}[!]${C_RESET} %s\n" "$*"; }
die()  { printf "${C_RED}[ERR]${C_RESET} %s\n" "$*" >&2; exit 1; }

# ---------- 0. 사전 점검 ----------
log "사전 점검"
for f in index.html server.js package.json ecosystem.config.cjs; do
  [ -f "$SCRIPT_DIR/$f" ] || die "$f 이 스크립트와 같은 폴더에 없습니다"
done
[ -f "$NGX_HYDRO" ] || die "nginx 설정 없음: $NGX_HYDRO"
[ -f "$NGX_MULTI" ] || die "nginx 설정 없음: $NGX_MULTI"
command -v nginx >/dev/null   || die "nginx 미설치"
command -v python3 >/dev/null || die "python3 미설치"
command -v curl >/dev/null    || die "curl 미설치"
command -v node >/dev/null    || die "node 미설치 (기존 PM2 앱용으로 이미 있을 것)"
command -v pm2 >/dev/null     || die "pm2 미설치"

NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
[ "${NODE_MAJOR:-0}" -ge 18 ] || warn "Node ${NODE_MAJOR} — better-sqlite3 빌드에 18+ 권장"

# :80 nginx 점유 확인
if ! sudo ss -ltnp 2>/dev/null | grep ':80 ' | grep -qi nginx; then
    warn ":80 포트를 nginx 가 점유하고 있지 않음 — 확인 필요"
    sudo ss -ltnp 2>/dev/null | grep ':80 ' || true
fi

# 5100 포트 상태는 여기선 정보만 수집 — 실제 확보는 step 4 에서 수행
PORT_LINE_PRE="$(sudo ss -ltnp 2>/dev/null | awk -v p=":${APP_PORT} " '$4 ~ p' || true)"
if [ -n "$PORT_LINE_PRE" ]; then
  warn "포트 ${APP_PORT} 가 이미 점유 중 (아래) — PM2 reset 후 재확보 시도"
  echo "$PORT_LINE_PRE"
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
collect_codes() {
  local outfile="$1"
  : > "$outfile"
  for p in "${ENDPOINTS[@]}"; do
    code="$(curl -s -o /dev/null -m 5 -w '%{http_code}' "http://127.0.0.1${p}" || echo "ERR")"
    printf "%-25s %s\n" "$p" "$code" | tee -a "$outfile"
  done
  for h in "free.ai.kr" "contact.ai.kr"; do
    code="$(curl -s -o /dev/null -m 5 -w '%{http_code}' -H "Host: $h" http://127.0.0.1/ || echo "ERR")"
    printf "%-25s %s\n" "Host:$h /" "$code" | tee -a "$outfile"
  done
}
collect_codes "$BASELINE_FILE"
ok "baseline 저장: $BASELINE_FILE"

# ---------- 2. 앱 소스 배치 ----------
log "앱 소스 배치 → $APP_DIR"
sudo mkdir -p "$APP_DIR" "$DATA_DIR" "$LOGS_DIR"
sudo cp "$SCRIPT_DIR/index.html"           "$APP_DIR/index.html"
sudo cp "$SCRIPT_DIR/server.js"            "$APP_DIR/server.js"
sudo cp "$SCRIPT_DIR/package.json"         "$APP_DIR/package.json"
sudo cp "$SCRIPT_DIR/ecosystem.config.cjs" "$APP_DIR/ecosystem.config.cjs"
sudo chown -R ubuntu:ubuntu "$APP_DIR"
sudo chmod 755 "$APP_DIR" "$DATA_DIR" "$LOGS_DIR"
sudo chmod 644 "$APP_DIR/index.html" "$APP_DIR/server.js" "$APP_DIR/package.json" "$APP_DIR/ecosystem.config.cjs"
# www-data 가 /home/ubuntu 를 traverse 할 수 있어야 static alias 가 동작
sudo chmod o+x /home/ubuntu 2>/dev/null || true
ok "소스 배치 완료"

# ---------- 3. npm install ----------
log "npm install (production, cwd=$APP_DIR)"
( cd "$APP_DIR" && npm install --omit=dev --no-audit --no-fund )
ok "의존성 설치 완료 ($(du -sh "$APP_DIR/node_modules" 2>/dev/null | awk '{print $1}'))"

# ---------- 4. PM2 clean restart (delete → start) ----------
# reload 는 fork 모드에서 race condition 으로 EADDRINUSE 크래시루프를 만들 수
# 있음. 확실한 방법은 delete → 포트 비었음 확인 → start.
log "PM2 '$APP_NAME' clean restart"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
  sleep 1
fi

# 포트 5100 최종 확인 — 여전히 점유되어 있으면 중단하고 정리 명령 안내
PORT_LINE_NOW="$(sudo ss -ltnp 2>/dev/null | awk -v p=":${APP_PORT} " '$4 ~ p' || true)"
if [ -n "$PORT_LINE_NOW" ]; then
  warn "포트 ${APP_PORT} 가 다른 프로세스에 점유 중:"
  echo "$PORT_LINE_NOW"
  warn "⚠️  fuser -k / kill 로 무작정 죽이지 마세요 — 다른 운영 서비스일 수 있습니다."
  warn "먼저 PID 확인 후 어떤 서비스인지 파악하세요:"
  warn "  pm2 list                                  # PM2 관리 프로세스인지 확인"
  warn "  sudo lsof -i :${APP_PORT}                  # 상세 정보"
  warn "  curl -s http://127.0.0.1:${APP_PORT}/ | head"
  warn "파악 후 정말 room 전용이면 그 때 정리하거나, APP_PORT 를 다른 값으로 바꿔서 재실행."
  die "포트 ${APP_PORT} 충돌 — 수동 확인 필요"
fi

log "PM2 start ecosystem.config.cjs"
( cd "$APP_DIR" && pm2 start ecosystem.config.cjs )
pm2 save >/dev/null
sleep 2

# 재시작 카운트(↺)가 3회 이상이면 크래시 루프로 판단
RESTART_COUNT="$(pm2 jlist 2>/dev/null | node -e '
  let d=""; process.stdin.on("data",c=>d+=c);
  process.stdin.on("end",()=>{
    try { const j=JSON.parse(d); const a=j.find(x=>x.name==="'"$APP_NAME"'");
      console.log(a ? a.pm2_env.restart_time : -1); } catch { console.log(-1); }
  });' 2>/dev/null || echo "-1")"

if ! pm2 describe "$APP_NAME" 2>/dev/null | grep -q "online"; then
  echo
  warn "=== PM2 상태 ==="
  pm2 describe "$APP_NAME" | sed -n '1,40p' || true
  echo
  warn "=== 최근 로그 ==="
  pm2 logs "$APP_NAME" --lines 30 --nostream --err || true
  die "PM2 '$APP_NAME' 가 online 이 아님 — 위 로그 확인"
fi

if [ "${RESTART_COUNT:-0}" -gt 2 ]; then
  warn "크래시 루프 의심 (restart=$RESTART_COUNT)"
  pm2 logs "$APP_NAME" --lines 30 --nostream --err || true
  die "기동 안정화 안 됨 — 로그 확인 후 대처"
fi
ok "PM2 '$APP_NAME' online (restart=$RESTART_COUNT)"

# 내부 API health 확인 (최대 5회 재시도)
for i in 1 2 3 4 5; do
  if curl -sf -m 3 "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null; then
    ok "백엔드 /api/health 200"
    break
  fi
  if [ "$i" -eq 5 ]; then
    pm2 logs "$APP_NAME" --lines 30 --nostream --err || true
    die "백엔드 /api/health 응답 없음 (127.0.0.1:${APP_PORT})"
  fi
  sleep 1
done

# ---------- 5. nginx GOLDEN 백업 ----------
log "nginx 설정 GOLDEN 백업 → $BACKUP_DIR (ts=$TS)"
sudo mkdir -p "$BACKUP_DIR"
sudo cp "$NGX_HYDRO" "$BACKUP_DIR/GOLDEN-hydro.conf.$TS"
sudo cp "$NGX_MULTI" "$BACKUP_DIR/GOLDEN-multi-service.conf.$TS"
ok "백업 완료"

# ---------- 6. nginx conf 삽입 ----------
# /room/api/ 프록시를 /room/ alias 앞에 두려면 블록을 한 번에 삽입해야 한다.
# nginx 의 location 매칭은 prefix longest-match → 순서는 덜 중요하지만 명확성 위해 함께.
LOCATION_BLOCK=$(cat <<BLK

    # ── room API (Node, PM2 'room' :${APP_PORT}) ───────────
    location /room/api/ {
        proxy_pass http://127.0.0.1:${APP_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 30s;
        client_max_body_size 64k;
    }
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
  local tmp_out rc=0
  tmp_out="$(sudo mktemp /tmp/room-deploy.XXXXXX)"
  sudo chmod 644 "$tmp_out"

  sudo python3 - "$target_file" "$selector" "$tmp_out" "$LOCATION_BLOCK" <<'PYEOF' || rc=$?
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

def strip_room_blocks(body_text):
    """Remove any previously-inserted /room, /room/api/, and '= /room' blocks
    along with their preceding '# ── room' comment lines."""
    body_text = re.sub(
        r'\n\s*#[^\n]*room[^\n]*\n\s*location\s+/room/api/\s*\{[^{}]*\}\s*',
        '\n', body_text)
    body_text = re.sub(
        r'\n\s*#[^\n]*room[^\n]*\n\s*location\s+/room/\s*\{[^{}]*\}\s*',
        '\n', body_text)
    body_text = re.sub(
        r'\n\s*location\s+/room/api/\s*\{[^{}]*\}\s*',
        '\n', body_text)
    body_text = re.sub(
        r'\n\s*location\s+/room/\s*\{[^{}]*\}\s*',
        '\n', body_text)
    body_text = re.sub(
        r'\n\s*location\s*=\s*/room\s*\{[^{}]*\}\s*',
        '\n', body_text)
    return body_text

target = None
for (_, ob, cb) in blocks:
    if selector in src[ob+1:cb]:
        target = (ob, cb)
        break

if not target:
    sys.stderr.write(f"[ERROR] {path}: no server block matches selector {selector!r}\n")
    sys.exit(2)

ob, cb = target
body = src[ob+1:cb]
body_stripped = strip_room_blocks(body)
# Always reinsert fresh block — ensures port / path changes are picked up
new_body = body_stripped.rstrip() + "\n" + block + "\n"
new_src = src[:ob+1] + new_body + src[cb:]

if new_src == src:
    sys.stderr.write(f"[SKIP] {path}: no change (already up-to-date)\n")
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(src)
    sys.exit(10)

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(new_src)
sys.stderr.write(f"[OK] {path}: re-inserted /room blocks\n")
PYEOF

  if [ "$rc" -eq 10 ]; then
    warn "$target_file: 이미 /room + /room/api 블록 존재 → 변경 없음"
    sudo rm -f "$tmp_out"
    return 0
  elif [ "$rc" -ne 0 ]; then
    sudo rm -f "$tmp_out"
    die "Python 삽입 실패 ($target_file, rc=$rc)"
  fi

  echo "--- diff: $target_file ---"
  sudo diff -u "$target_file" "$tmp_out" || true
  sudo install -m 0644 -o root -g root "$tmp_out" "$target_file"
  sudo rm -f "$tmp_out"
  ok "$target_file 삽입 완료"
}

log "sites-enabled/hydro 에 /room + /room/api 블록 삽입 (selector: default_server)"
inject_location "$NGX_HYDRO" "default_server"

log "sites-enabled/multi-service 에 /room + /room/api 블록 삽입 (selector: 211.198.54.207)"
inject_location "$NGX_MULTI" "211.198.54.207"

# ---------- 7. nginx 검증 + 리로드 ----------
rollback_nginx() {
  warn "nginx 설정 롤백"
  sudo cp "$BACKUP_DIR/GOLDEN-hydro.conf.$TS" "$NGX_HYDRO"
  sudo cp "$BACKUP_DIR/GOLDEN-multi-service.conf.$TS" "$NGX_MULTI"
  sudo nginx -t && sudo systemctl reload nginx || warn "롤백 후 reload 실패 — 수동 확인 필요"
}

log "nginx -t 검증"
if ! sudo nginx -t; then
  rollback_nginx
  die "nginx -t 실패 → 롤백 완료"
fi
ok "nginx -t 통과"

log "nginx reload"
sudo systemctl reload nginx
ok "reload 완료"

# ---------- 8. UFW 처리 (활성일 때만) ----------
if sudo ufw status 2>/dev/null | grep -q "Status: active"; then
  log "UFW 활성 → 포트 ${APP_PORT}/tcp 허용"
  sudo ufw allow "${APP_PORT}/tcp" >/dev/null 2>&1 || warn "ufw allow 실패"
  ok "ufw 규칙 반영"
else
  log "UFW 비활성 → 스킵"
fi

# ---------- 9. 회귀 검증 ----------
log "변경 후 응답 코드 수집"
collect_codes "$AFTER_FILE"

echo
log "before/after diff"
if diff -u "$BASELINE_FILE" "$AFTER_FILE"; then
  ok "회귀 없음 ✨"
else
  warn "기존 서비스 응답 코드가 바뀐 항목이 있음 → 위 diff 확인 후 필요 시 롤백"
  warn "롤백: sudo cp $BACKUP_DIR/GOLDEN-*.conf.$TS /etc/nginx/sites-enabled/ && sudo nginx -s reload"
fi

# ---------- 10. 새 엔드포인트 확인 ----------
log "새 엔드포인트 확인"
INT_CODE="$(curl -s -o /dev/null -m 5 -w '%{http_code}' http://127.0.0.1/room/ || echo ERR)"
EXT_CODE="$(curl -s -o /dev/null -m 5 -w '%{http_code}' http://211.198.54.207/room/ || echo ERR)"
API_CODE="$(curl -s -o /dev/null -m 5 -w '%{http_code}' http://127.0.0.1/room/api/health || echo ERR)"
API_LIST="$(curl -s -o /dev/null -m 5 -w '%{http_code}' http://127.0.0.1/room/api/reservations || echo ERR)"
printf "내부 정적 (127.0.0.1/room/)              => %s\n" "$INT_CODE"
printf "외부 정적 (211.198.54.207/room/)         => %s\n" "$EXT_CODE"
printf "내부 API  (127.0.0.1/room/api/health)    => %s\n" "$API_CODE"
printf "내부 API  (127.0.0.1/room/api/reservations) => %s\n" "$API_LIST"

if curl -s -m 5 http://127.0.0.1/room/ | grep -q "회의실 예약 시스템"; then
  ok "정적 페이지 타이틀 확인됨"
else
  warn "정적 페이지 본문에서 '회의실 예약 시스템' 찾지 못함"
fi

if curl -s -m 5 http://127.0.0.1/room/api/health | grep -q '"ok":true'; then
  ok "API health 응답 확인됨"
else
  warn "/room/api/health 응답이 기대와 다름"
fi

# ---------- 11. 완료 요약 ----------
cat <<EOF

============================================
  ${C_BOLD}배포 완료${C_RESET} (v2: SQLite + PM2)

  내부 접속: http://127.0.0.1/room/
  외부 접속: http://211.198.54.207/room/
  API:      http://211.198.54.207/room/api/{health,reservations}

  앱 경로:      $APP_DIR
  DB 파일:      $DATA_DIR/reservations.db
  PM2 프로세스: $APP_NAME (pm2 status / pm2 logs $APP_NAME)
  로그:         $LOGS_DIR/out.log, err.log

  백업 경로:   $BACKUP_DIR/GOLDEN-{hydro,multi-service}.conf.$TS
  베이스라인: $BASELINE_FILE
  변경 후 :   $AFTER_FILE

  롤백 (nginx):
    sudo cp $BACKUP_DIR/GOLDEN-hydro.conf.$TS         $NGX_HYDRO
    sudo cp $BACKUP_DIR/GOLDEN-multi-service.conf.$TS $NGX_MULTI
    sudo nginx -t && sudo systemctl reload nginx
  롤백 (앱 중지):
    pm2 stop $APP_NAME && pm2 delete $APP_NAME && pm2 save
============================================
EOF
