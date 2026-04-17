#!/usr/bin/env bash
# =============================================================================
#  paperclip-subpath-build.sh
#
#  paperclip 의 UI(Vite) 를 subpath `/paperclip/` 용으로 재빌드해서
#  http://211.198.54.207/paperclip/ 에서 UI 가 정상 로딩되도록 만든다.
#
#  배경:
#   - paperclip UI 는 Vite 기반이고 `base: '/'` 기본값으로 빌드됨
#   - 그 결과 HTML 안에 `<script src="/assets/index-XXX.js">` 같은 절대경로가 박힘
#   - subpath `/paperclip/` 로 서빙 시 asset 요청이 nginx 의 다른 location 으로
#     빠져 404 → 브라우저 검은 화면
#
#  이 스크립트가 하는 일:
#   1. ui/vite.config.* 에 `base: '/paperclip/'` 삽입/치환 (idempotent)
#   2. UI 재빌드
#   3. 빌드 산출물 검증 (dist HTML 의 asset 경로 확인)
#   4. pm2 restart paperclip (새 UI 반영)
#   5. nginx subpath 룰 복구 (fix-host-nginx.sh 재실행)
#   6. 8082 임시 server block 정리
#   7. 최종 curl 검증 + 기존 서비스 회귀 확인
#
#  사용법:
#     sudo bash paperclip-subpath-build.sh
# =============================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/paperclip}"
APP_USER="${APP_USER:-ubuntu}"
APP_NAME="${APP_NAME:-paperclip}"
BASE_PATH="${BASE_PATH:-/paperclip/}"
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/.paperclip-deploy-backup}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
FIX_NGINX_SCRIPT="${SCRIPT_DIR}/fix-host-nginx.sh"
TS="$(date +%Y%m%d-%H%M%S)"

C_R=$'\e[31m'; C_G=$'\e[32m'; C_Y=$'\e[33m'; C_B=$'\e[34m'; C_N=$'\e[0m'
log()  { echo "${C_B}[INFO]${C_N}  $*"; }
ok()   { echo "${C_G}[ OK ]${C_N}  $*"; }
warn() { echo "${C_Y}[WARN]${C_N}  $*"; }
err()  { echo "${C_R}[ERR ]${C_N}  $*" >&2; }
hr()   { printf '%0.s-' {1..72}; echo; }

if [[ $EUID -ne 0 ]]; then
  err "sudo 로 실행: sudo bash paperclip-subpath-build.sh"
  exit 1
fi
if [[ ! -d "${APP_DIR}" ]]; then
  err "paperclip 디렉토리 없음: ${APP_DIR}"
  exit 1
fi
mkdir -p "${BACKUP_DIR}"

# ---------- 1) Vite config 탐색 ----------
hr; log "[1/7] Vite config 탐색"; hr
VITE_CONFIG=""
for f in \
  "${APP_DIR}/ui/vite.config.ts" \
  "${APP_DIR}/ui/vite.config.js" \
  "${APP_DIR}/ui/vite.config.mjs"; do
  if [[ -f "$f" ]]; then VITE_CONFIG="$f"; break; fi
done
if [[ -z "${VITE_CONFIG}" ]]; then
  err "ui/vite.config.{ts,js,mjs} 를 찾을 수 없음"
  exit 1
fi
ok "  대상: ${VITE_CONFIG}"
VITE_BACKUP="${BACKUP_DIR}/vite.config.before-subpath.${TS}"
cp -a "${VITE_CONFIG}" "${VITE_BACKUP}"
ok "  백업: ${VITE_BACKUP}"

# ---------- 2) Vite config 에 base 설정 패치 ----------
hr; log "[2/7] vite config 에 base: '${BASE_PATH}' 설정 (idempotent)"; hr

VITE_NEW="${BACKUP_DIR}/vite.config.new.${TS}"
cp -a "${VITE_CONFIG}" "${VITE_NEW}"

export VITE_NEW BASE_PATH
python3 <<'PYEOF'
import os, re, sys
path = os.environ['VITE_NEW']
base = os.environ['BASE_PATH']
with open(path, 'r') as f:
    data = f.read()

# 1) `base: '...'` 또는 `base: "..."` 가 이미 존재? → 값 치환
m = re.search(r'(^[ \t]*base\s*:\s*)(["\'])[^"\']*\2', data, re.MULTILINE)
if m:
    data = data[:m.start()] + m.group(1) + "'" + base + "'" + data[m.end():]
    with open(path, 'w') as f: f.write(data)
    print(f"  기존 'base' 필드 값 치환: {base}")
    sys.exit(0)

# 2) 다음 패턴들을 순서대로 시도 — 전부 object literal 의 여는 '{' 을 찾음
#    가장 먼저 매치되는 걸 삽입 지점으로 사용
candidates = [
    # arrow function 반환형: `=> ({`  ← paperclip 이 이 패턴 (defineConfig(({mode}) => ({...})))
    (re.compile(r'=>\s*\(\s*\{'), "arrow returning object (=> ({)"),
    # 직접 객체: `defineConfig({`
    (re.compile(r'defineConfig\s*\(\s*\{'), "defineConfig({"),
    # 비동기 함수: `async\s+\(...\)\s*=>\s*\(\{` 은 위 1번이 이미 커버
    # export default { ... }
    (re.compile(r'export\s+default\s*\{'), "export default {"),
]

for pat, label in candidates:
    m = pat.search(data)
    if m:
        ins = m.end()
        snippet = f"\n  base: '{base}',"
        data = data[:ins] + snippet + data[ins:]
        with open(path, 'w') as f: f.write(data)
        print(f"  패턴 '{label}' 뒤에 'base: \"{base}\"' 삽입")
        sys.exit(0)

sys.exit("ERROR: 지원되는 Vite config 패턴을 찾지 못함 — 수동 검토 필요")
PYEOF

cp -f "${VITE_NEW}" "${VITE_CONFIG}"
chown "${APP_USER}:${APP_USER}" "${VITE_CONFIG}"

echo
echo "=== vite.config 변경 diff ==="
diff -u "${VITE_BACKUP}" "${VITE_CONFIG}" || true

# ---------- 3) UI 재빌드 ----------
hr; log "[3/7] UI 재빌드 (pnpm --filter @paperclipai/ui build)"; hr

sudo -u "${APP_USER}" -H bash -lc "
  export NVM_DIR=\"\$HOME/.nvm\"
  [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
  cd '${APP_DIR}'
  pnpm --filter @paperclipai/ui build
"

# ---------- 4) 빌드 산출물 검증 ----------
hr; log "[4/7] 빌드 결과 검증 — HTML 의 asset 경로가 prefix 를 포함하는가"; hr

UI_DIST_HTML=""
for candidate in \
  "${APP_DIR}/ui/dist/index.html" \
  "${APP_DIR}/server/ui-dist/index.html"; do
  if [[ -f "$candidate" ]]; then UI_DIST_HTML="$candidate"; break; fi
done
if [[ -z "${UI_DIST_HTML}" ]]; then
  warn "빌드된 index.html 을 찾지 못함 (ui/dist 또는 server/ui-dist)"
else
  log "  검증 대상: ${UI_DIST_HTML}"
  EXPECT="${BASE_PATH%/}/assets/"
  if grep -qE "src=\"${EXPECT}" "${UI_DIST_HTML}"; then
    ok "  asset 경로가 '${EXPECT}' prefix 포함 — 정상"
  else
    err "  asset 경로에 '${EXPECT}' prefix 가 없음 — vite.config 수정이 안 먹었거나 빌드 실패"
    log "  HTML 안 src/href 샘플:"
    grep -oE '(src|href)="[^"]+"' "${UI_DIST_HTML}" | head -10 | sed 's/^/    /'
    err "  vite.config 원복 후 수동 검토 필요. 원복:"
    echo "    sudo cp '${VITE_BACKUP}' '${VITE_CONFIG}'"
    exit 1
  fi
fi

# ---------- 5) pm2 restart (UI 변경 반영) ----------
hr; log "[5/7] pm2 restart ${APP_NAME}"; hr
sudo -u "${APP_USER}" -H bash -lc "
  export NVM_DIR=\"\$HOME/.nvm\"
  [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
  pm2 restart '${APP_NAME}' --update-env
  pm2 save
"

# 앱이 LISTEN 할 때까지 잠깐 대기
for i in 1 2 3 4 5 6 7 8 9 10; do
  if ss -ltn 'sport = :5100' | awk 'NR>1{exit 0} END{exit 1}'; then
    ok "  :5100 LISTEN 확인 (대기 ${i}/10)"
    break
  fi
  sleep 2
done

LOCAL_HTML_SRC="$(curl -sL http://127.0.0.1:5100/ | grep -oE 'src="[^"]+"' | head -3 || true)"
log "  paperclip 직접 응답 HTML 의 src 샘플:"
echo "${LOCAL_HTML_SRC}" | sed 's/^/    /'

# ---------- 6) nginx subpath 룰 복구 + 8082 정리 ----------
hr; log "[6/7] nginx subpath 룰 복구 + 8082 임시 파일 정리"; hr

# 8082 임시 파일 삭제
if [[ -e /etc/nginx/sites-enabled/paperclip ]]; then
  rm -f /etc/nginx/sites-enabled/paperclip
  ok "  /etc/nginx/sites-enabled/paperclip 삭제 (8082 server block 제거)"
fi
if [[ -e /etc/nginx/sites-available/paperclip ]]; then
  rm -f /etc/nginx/sites-available/paperclip
  ok "  /etc/nginx/sites-available/paperclip 삭제"
fi

# fix-host-nginx.sh 가 있으면 재실행하여 /paperclip 룰 재삽입
if [[ -x "${FIX_NGINX_SCRIPT}" ]]; then
  log "  fix-host-nginx.sh 재실행 → 두 파일에 subpath 룰 재삽입"
  bash "${FIX_NGINX_SCRIPT}"
else
  warn "fix-host-nginx.sh 가 ${SCRIPT_DIR} 에 없음 — 수동으로 subpath 룰 재삽입 필요"
fi

# ---------- 7) 최종 검증 ----------
hr; log "[7/7] 최종 검증"; hr

echo
echo "=== HTML 의 asset 경로 (게이트웨이 경유) ==="
curl -sL http://127.0.0.1/paperclip/ | grep -oE '(src|href)="[^"]+"' | head -10 | sed 's/^/  /'

echo
echo "=== 핵심 경로 응답코드 ==="
probe() {
  local label="$1" url="$2" host="${3:-}"
  local extra=""
  [[ -n "${host}" ]] && extra="-H Host:${host}"
  printf "  %-36s %s\n" "${label}" "$(curl -s -o /dev/null -w '%{http_code}' ${extra} "${url}")"
}
probe "/paperclip/ (Host:127.0.0.1)"       "http://127.0.0.1/paperclip/"
probe "/paperclip/ (Host:211.198.54.207)"   "http://127.0.0.1/paperclip/" "211.198.54.207"
# 첫 JS asset 하나 뽑아서 직접 호출해본다
FIRST_ASSET="$(curl -sL http://127.0.0.1/paperclip/ | grep -oE '/paperclip/assets/[^"]+\.js' | head -1 || true)"
if [[ -n "${FIRST_ASSET}" ]]; then
  probe "${FIRST_ASSET}" "http://127.0.0.1${FIRST_ASSET}"
fi

echo
echo "=== 기존 서비스 회귀 (변동 없어야 함) ==="
for p in /jobworld/ /jobworld/health /hacker/ /livenews/ /agentbook/ \
         /agentmarket/ /matching/ /simburum/ /aimarketer/ /care/health \
         /signal-test/ /freeai/ /halfplaza/ /luxury/ /yeoujob/; do
  probe "${p}" "http://127.0.0.1${p}"
done
probe "/ (Host:free.ai.kr)"    "http://127.0.0.1/" "free.ai.kr"
probe "/ (Host:contact.ai.kr)" "http://127.0.0.1/" "contact.ai.kr"

hr
echo "${C_G}==========================================${C_N}"
echo "  paperclip subpath 배포 완료"
echo ""
echo "  외부 접속: http://211.198.54.207/paperclip/"
echo "  PM2 상태:  sudo -u ${APP_USER} pm2 status"
echo "  PM2 로그:  sudo -u ${APP_USER} pm2 logs ${APP_NAME} --lines 30 --nostream"
echo ""
echo "  vite.config 백업: ${VITE_BACKUP}"
echo "  원복:"
echo "    sudo cp '${VITE_BACKUP}' '${VITE_CONFIG}'"
echo "    sudo -u ${APP_USER} -H bash -lc 'cd ${APP_DIR} && pnpm --filter @paperclipai/ui build'"
echo "    sudo -u ${APP_USER} pm2 restart ${APP_NAME}"
echo "${C_G}==========================================${C_N}"
