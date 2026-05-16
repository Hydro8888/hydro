#!/usr/bin/env bash
set -Eeuo pipefail

SERVICE_NAME="${SERVICE_NAME:-toon2film}"
BASE_PATH="${BASE_PATH:-/toon2film}"
WEB_PORT="${WEB_PORT:-3600}"
API_PORT="${API_PORT:-8600}"
WEB_PM2_NAME="${WEB_PM2_NAME:-toon2film-web}"
API_PM2_NAME="${API_PM2_NAME:-toon2film-api}"
INTERNAL_HOST="${INTERNAL_HOST:-172.30.1.99}"
BACKUP_ROOT="${BACKUP_ROOT:-/home/ubuntu/.toon2film-deploy-backup}"
APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TS="$(date +%Y%m%d-%H%M%S)"

INSTALL_DEPS=0
WITH_NGINX=0
WITH_PM2_STARTUP=0
SKIP_BUILD=0
SKIP_NGINX_RELOAD=0

WATCH_PATHS_DEFAULT="contact matching hacker agentmarket fundmanager gonak jobworld"
WATCH_PATHS="${WATCH_PATHS:-$WATCH_PATHS_DEFAULT}"

log() { printf '[*] %s\n' "$*"; }
ok() { printf '[OK] %s\n' "$*"; }
warn() { printf '[!] %s\n' "$*" >&2; }
die() { printf '[FAIL] %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<USAGE
Usage: ./deploy/install_server.sh [options]

Options:
  --install-deps       Install basic apt dependencies and PM2 when missing.
  --with-nginx         Add or update the Nginx location block for ${BASE_PATH}.
  --with-pm2-startup   Configure PM2 systemd startup for the ubuntu user.
  --skip-build         Skip npm build and Python dependency install.
  --skip-nginx-reload  Write/test Nginx config but do not reload it.
  -h, --help           Show this help.

Environment overrides:
  BASE_PATH=/toon2film
  WEB_PORT=3600
  API_PORT=8600
  NGINX_SITE=/etc/nginx/sites-enabled/hydro
  WATCH_PATHS="contact matching hacker agentmarket fundmanager gonak jobworld"
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --install-deps) INSTALL_DEPS=1 ;;
    --with-nginx) WITH_NGINX=1 ;;
    --with-pm2-startup) WITH_PM2_STARTUP=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    --skip-nginx-reload) SKIP_NGINX_RELOAD=1 ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1" ;;
  esac
  shift
done

if [[ "$(id -un)" != "ubuntu" ]]; then
  die "Run this script as ubuntu. Do not use sudo pm2 or root PM2."
fi

if [[ "$BASE_PATH" != /* ]]; then
  die "BASE_PATH must start with '/'. Current: $BASE_PATH"
fi

mkdir -p "$BACKUP_ROOT/$TS"

run_sudo() {
  sudo "$@"
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

install_deps() {
  [[ "$INSTALL_DEPS" -eq 1 ]] || return 0
  log "Install basic dependencies"
  run_sudo apt-get update
  run_sudo apt-get install -y git curl nginx python3 python3-venv python3-pip build-essential
  if ! command_exists pm2; then
    command_exists npm || die "npm is missing. Install Node.js first, then rerun."
    npm install -g pm2
  fi
}

detect_nginx_site() {
  if [[ -n "${NGINX_SITE:-}" ]]; then
    echo "$NGINX_SITE"
    return
  fi

  local candidates=(
    "/etc/nginx/sites-enabled/hydro"
    "/etc/nginx/sites-enabled/multi-service"
    "/etc/nginx/sites-available/multi-service"
  )
  local file
  for file in "${candidates[@]}"; do
    if [[ -f "$file" ]]; then
      echo "$file"
      return
    fi
  done
  die "No Nginx site file found. Set NGINX_SITE=/path/to/active/site."
}

curl_code() {
  local url="$1"
  curl -sS -o /dev/null -w "%{http_code}" --max-time 8 "$url" 2>/dev/null || printf "000"
}

snapshot_services() {
  local output="$1"
  : > "$output"
  local path code
  for path in $WATCH_PATHS; do
    code="$(curl_code "http://${INTERNAL_HOST}/${path}/")"
    printf '%s %s\n' "$path" "$code" | tee -a "$output"
  done
}

is_5xx() {
  [[ "$1" =~ ^5[0-9][0-9]$ ]]
}

compare_service_snapshots() {
  local before="$1"
  local after="$2"
  local regressions=0
  local path before_code after_code
  while read -r path before_code; do
    after_code="$(awk -v p="$path" '$1 == p { print $2 }' "$after")"
    [[ -n "$after_code" ]] || after_code="000"
    if [[ "$before_code" != "000" && "$after_code" == "000" ]]; then
      warn "$path regressed: $before_code -> $after_code"
      regressions=$((regressions + 1))
    elif ! is_5xx "$before_code" && is_5xx "$after_code"; then
      warn "$path regressed: $before_code -> $after_code"
      regressions=$((regressions + 1))
    fi
  done < "$before"

  [[ "$regressions" -eq 0 ]] || die "Existing service regression detected. Check $before and $after."
  ok "Existing service before/after check passed"
}

ensure_port_free_or_owned() {
  local port="$1"
  local pm2_name="$2"
  if ss -tlnp 2>/dev/null | grep -Eq "[:.]${port}[[:space:]]"; then
    if pm2 describe "$pm2_name" >/dev/null 2>&1; then
      warn "Port $port is in use by existing $pm2_name; it will be restarted."
    else
      ss -tlnp | grep -E "[:.]${port}[[:space:]]" || true
      die "Port $port is already in use by another process."
    fi
  fi
}

write_api_env() {
  local env_file="$APP_ROOT/apps/api/.env"
  if [[ ! -f "$env_file" ]]; then
    log "Create apps/api/.env from safe defaults"
    cat > "$env_file" <<EOF
APP_NAME=Toon2Film
ENVIRONMENT=production
API_CORS_ORIGINS=http://127.0.0.1:${WEB_PORT},http://localhost:${WEB_PORT},http://${INTERNAL_HOST}
DATABASE_URL=postgresql+psycopg://toon2film:toon2film@localhost:5432/toon2film
REDIS_URL=redis://localhost:6379/0
S3_ENDPOINT_URL=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=toon2film
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
OPENAI_API_KEY=
SEEDANCE_API_KEY=
SEEDANCE_BASE_URL=
SEEDANCE_MODEL=seedance
ENCRYPTION_KEY=
JWT_SECRET=
EOF
    chmod 600 "$env_file"
  else
    ok "apps/api/.env exists; leaving it untouched"
  fi
}

build_app() {
  [[ "$SKIP_BUILD" -eq 0 ]] || { warn "Skipping build by request"; return 0; }

  log "Set ownership to ubuntu for app directory"
  run_sudo chown -R ubuntu:ubuntu "$APP_ROOT"

  log "Install web dependencies"
  cd "$APP_ROOT"
  npm ci

  log "Clean Next.js and turbo caches"
  rm -rf apps/web/.next apps/web/.turbo .turbo node_modules/.cache

  log "Build web app with BASE_PATH=$BASE_PATH"
  NEXT_PUBLIC_BASE_PATH="$BASE_PATH" NEXT_PUBLIC_API_BASE_URL="${BASE_PATH}/api" npm run build:web

  log "Prepare Python virtualenv"
  python3 -m venv "$APP_ROOT/.venv"
  "$APP_ROOT/.venv/bin/python" -m pip install --upgrade pip wheel
  "$APP_ROOT/.venv/bin/pip" install -e "$APP_ROOT/apps/api"
}

start_pm2() {
  log "Start only Toon2Film PM2 apps"
  export TOON2FILM_WEB_PORT="$WEB_PORT"
  export TOON2FILM_API_PORT="$API_PORT"
  export TOON2FILM_BASE_PATH="$BASE_PATH"
  export TOON2FILM_WEB_PM2_NAME="$WEB_PM2_NAME"
  export TOON2FILM_API_PM2_NAME="$API_PM2_NAME"

  pm2 delete "$WEB_PM2_NAME" >/dev/null 2>&1 || true
  pm2 delete "$API_PM2_NAME" >/dev/null 2>&1 || true
  pm2 start "$APP_ROOT/ecosystem.config.cjs" --only "$API_PM2_NAME" --update-env
  pm2 start "$APP_ROOT/ecosystem.config.cjs" --only "$WEB_PM2_NAME" --update-env
  pm2 save
}

wait_for_url() {
  local label="$1"
  local url="$2"
  local expected_regex="${3:-^(2|3)[0-9][0-9]$}"
  local code
  local i
  for i in $(seq 1 30); do
    code="$(curl_code "$url")"
    if [[ "$code" =~ $expected_regex ]]; then
      ok "$label => $code"
      return 0
    fi
    sleep 1
  done
  die "$label did not become healthy. Last code: $code ($url)"
}

nginx_block() {
  cat <<EOF
    # BEGIN ${SERVICE_NAME} managed block
    location ${BASE_PATH}/api/ {
        rewrite ^${BASE_PATH}/api/(.*)$ /api/\$1 break;
        proxy_pass http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }

    location ${BASE_PATH} {
        proxy_pass http://127.0.0.1:${WEB_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }
    # END ${SERVICE_NAME} managed block
EOF
}

configure_nginx() {
  [[ "$WITH_NGINX" -eq 1 ]] || { warn "Skipping Nginx config. Pass --with-nginx to enable."; return 0; }

  local site
  site="$(detect_nginx_site)"
  [[ -f "$site" ]] || die "Nginx site file does not exist: $site"

  log "Active Nginx files"
  ls -la /etc/nginx/sites-enabled/ || true

  if find /etc/nginx/sites-enabled -maxdepth 1 -type f \( -name "*.bak" -o -name "*.backup" \) | grep -q .; then
    die "Backup-like files exist inside sites-enabled. Move them out before continuing."
  fi

  local backup="$BACKUP_ROOT/$TS/$(basename "$site").bak"
  local work_file="$BACKUP_ROOT/$TS/$(basename "$site").new"
  log "Backup Nginx site to $backup"
  run_sudo cp "$site" "$backup"
  run_sudo chown ubuntu:ubuntu "$backup"
  cp "$backup" "$work_file"

  local block_file="$BACKUP_ROOT/$TS/${SERVICE_NAME}-nginx-block.conf"
  nginx_block > "$block_file"

  log "Insert or replace managed Nginx block in temporary copy"
  SITE="$work_file" BLOCK_FILE="$block_file" SERVICE_NAME="$SERVICE_NAME" python3 <<'PY'
from pathlib import Path
import os
import re

site = Path(os.environ["SITE"])
block = Path(os.environ["BLOCK_FILE"]).read_text()
service = os.environ["SERVICE_NAME"]
text = site.read_text()
start = f"    # BEGIN {service} managed block"
end = f"    # END {service} managed block"
pattern = re.compile(rf"\n?\s*# BEGIN {re.escape(service)} managed block.*?\s*# END {re.escape(service)} managed block\n?", re.S)

if pattern.search(text):
    text = pattern.sub("\n" + block + "\n", text)
else:
    idx = text.rfind("}")
    if idx == -1:
        raise SystemExit("No closing brace found in Nginx site file")
    text = text[:idx].rstrip() + "\n\n" + block + "\n" + text[idx:]

site.write_text(text)
PY

  run_sudo cp "$work_file" "$site"

  log "nginx -t"
  if ! run_sudo nginx -t; then
    warn "Nginx test failed. Restoring backup."
    run_sudo cp "$backup" "$site"
    run_sudo nginx -t || true
    die "Nginx configuration was restored after failed test."
  fi

  if [[ "$SKIP_NGINX_RELOAD" -eq 1 ]]; then
    warn "Skipping Nginx reload by request"
  else
    log "Reload Nginx"
    run_sudo systemctl reload nginx
  fi
}

configure_pm2_startup() {
  [[ "$WITH_PM2_STARTUP" -eq 1 ]] || return 0
  log "Configure PM2 startup for ubuntu"
  sudo env PATH="$PATH" pm2 startup systemd -u ubuntu --hp /home/ubuntu
  pm2 save
}

main() {
  log "Deploy $SERVICE_NAME from $APP_ROOT"
  log "Ports: web=$WEB_PORT api=$API_PORT basePath=$BASE_PATH"

  install_deps

  command_exists npm || die "npm is missing"
  command_exists python3 || die "python3 is missing"
  command_exists pm2 || die "pm2 is missing"
  command_exists curl || die "curl is missing"

  log "Preflight existing service snapshot"
  snapshot_services "$BACKUP_ROOT/$TS/services.before"

  log "Check port conflicts"
  ensure_port_free_or_owned "$WEB_PORT" "$WEB_PM2_NAME"
  ensure_port_free_or_owned "$API_PORT" "$API_PM2_NAME"

  write_api_env
  build_app
  start_pm2

  wait_for_url "API direct health" "http://127.0.0.1:${API_PORT}/health" "^200$"
  wait_for_url "Web direct base path" "http://127.0.0.1:${WEB_PORT}${BASE_PATH}" "^(2|3)[0-9][0-9]$"

  configure_nginx

  if [[ "$WITH_NGINX" -eq 1 && "$SKIP_NGINX_RELOAD" -eq 0 ]]; then
    wait_for_url "Nginx internal web" "http://127.0.0.1${BASE_PATH}" "^(2|3)[0-9][0-9]$"
    wait_for_url "Nginx internal API" "http://127.0.0.1${BASE_PATH}/api/health" "^200$"
  fi

  log "Postflight existing service snapshot"
  snapshot_services "$BACKUP_ROOT/$TS/services.after"
  compare_service_snapshots "$BACKUP_ROOT/$TS/services.before" "$BACKUP_ROOT/$TS/services.after"

  configure_pm2_startup

  ok "Deploy completed"
  printf '\nService URLs:\n'
  printf '  internal: http://%s%s\n' "$INTERNAL_HOST" "$BASE_PATH"
  printf '  local web: http://127.0.0.1:%s%s\n' "$WEB_PORT" "$BASE_PATH"
  printf '  local api: http://127.0.0.1:%s/health\n' "$API_PORT"
}

main "$@"
