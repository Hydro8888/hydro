#!/usr/bin/env bash
set -Eeuo pipefail

REPO_SSH="${REPO_SSH:-git@github.com:Hydro8888/hydro.git}"
BRANCH="${BRANCH:-codex/toon2film-platform-full}"
TARGET_DIR="${TARGET_DIR:-/home/ubuntu/toon2film-deploy}"
APP_DIR="${TARGET_DIR}/toon2film"
INSTALL_FLAGS="${INSTALL_FLAGS:---install-deps --with-nginx --with-pm2-startup}"

log() { printf '[*] %s\n' "$*"; }
ok() { printf '[OK] %s\n' "$*"; }
warn() { printf '[!] %s\n' "$*" >&2; }
die() { printf '[FAIL] %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<USAGE
Usage: bash install_from_ssh.sh [install_server.sh options]

This bootstrap script is intended to be run on the Ubuntu server after SSH login.
It clones or updates Toon2Film, then runs deploy/install_server.sh.

Defaults:
  REPO_SSH=${REPO_SSH}
  BRANCH=${BRANCH}
  TARGET_DIR=${TARGET_DIR}
  INSTALL_FLAGS=${INSTALL_FLAGS}

Examples:
  bash install_from_ssh.sh
  bash install_from_ssh.sh --install-deps --with-nginx

Environment overrides:
  BRANCH=codex/toon2film-platform-full
  TARGET_DIR=/home/ubuntu/toon2film-deploy
  BASE_PATH=/toon2film
  WEB_PORT=3610
  API_PORT=8600
  NGINX_SITE=/etc/nginx/sites-enabled/hydro
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

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

if [[ -e "$TARGET_DIR" && ! -d "$TARGET_DIR/.git" ]]; then
  die "$TARGET_DIR exists but is not a git repository. Move it aside or choose TARGET_DIR=..."
fi

if [[ -d "$TARGET_DIR/.git" ]]; then
  log "Update existing repository: $TARGET_DIR"
  cd "$TARGET_DIR"
  if ! git diff --quiet || ! git diff --cached --quiet; then
    die "Local changes exist in $TARGET_DIR. Commit, stash, or remove them before deploy."
  fi
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
else
  log "Clone repository into $TARGET_DIR"
  git clone -b "$BRANCH" "$REPO_SSH" "$TARGET_DIR"
fi

[[ -d "$APP_DIR" ]] || die "App directory not found: $APP_DIR"

log "Run Toon2Film safe deploy script"
cd "$APP_DIR"
chmod +x deploy/install_server.sh deploy/install_from_ssh.sh deploy/rewrite_nginx_site.py
./deploy/install_server.sh $INSTALL_FLAGS

ok "Toon2Film bootstrap install completed"
