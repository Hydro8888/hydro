#!/usr/bin/env bash
set -Eeuo pipefail

REPO_SSH="${REPO_SSH:-git@github.com:Hydro8888/hydro.git}"
BRANCH="${BRANCH:-codex/toon2film-platform-full}"
RELEASE_ROOT="${RELEASE_ROOT:-/home/ubuntu/toon2film-clean}"
CURRENT_LINK="${CURRENT_LINK:-${RELEASE_ROOT}/current}"
INSTALL_FLAGS="${INSTALL_FLAGS:---install-deps --with-nginx --with-pm2-startup}"
TS="$(date +%Y%m%d-%H%M%S)"
RELEASE_DIR="${RELEASE_ROOT}/releases/${TS}"

log() { printf '[*] %s\n' "$*"; }
ok() { printf '[OK] %s\n' "$*"; }
warn() { printf '[!] %s\n' "$*" >&2; }
die() { printf '[FAIL] %s\n' "$*" >&2; exit 1; }

if [[ "$(id -un)" != "ubuntu" ]]; then
  die "Run this script as ubuntu after SSH login. Do not use sudo or root PM2."
fi

if [[ $# -gt 0 ]]; then
  INSTALL_FLAGS="$*"
fi

log "Check GitHub SSH authentication"
set +e
SSH_OUTPUT="$(ssh -o BatchMode=yes -T git@github.com 2>&1)"
SSH_STATUS=$?
set -e
printf '%s\n' "$SSH_OUTPUT"
if ! printf '%s\n' "$SSH_OUTPUT" | grep -qi "successfully authenticated"; then
  die "GitHub SSH authentication failed. Check the server's SSH key before deploy."
fi
if [[ "$SSH_STATUS" -ne 0 ]]; then
  warn "GitHub SSH returned status ${SSH_STATUS}; this is normal when authentication succeeded."
fi

mkdir -p "$(dirname "$RELEASE_DIR")"

log "Clone fresh Toon2Film release"
git clone -b "$BRANCH" "$REPO_SSH" "$RELEASE_DIR"

APP_DIR="${RELEASE_DIR}/toon2film"
[[ -d "$APP_DIR" ]] || die "App directory not found: $APP_DIR"

log "Run safe deploy from clean release: $APP_DIR"
cd "$APP_DIR"
chmod +x deploy/install_server.sh deploy/install_from_ssh.sh
./deploy/install_server.sh $INSTALL_FLAGS

ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
ok "Current clean release => $CURRENT_LINK"

log "Keep only the 5 newest clean releases"
find "${RELEASE_ROOT}/releases" -mindepth 1 -maxdepth 1 -type d | sort -r | tail -n +6 | xargs -r rm -rf

ok "Toon2Film clean install completed"
