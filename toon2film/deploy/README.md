# Toon2Film Server Deploy

Recommended one-script install after SSH login:

```bash
cat > /home/ubuntu/install_toon2film.sh <<'BASH'
#!/usr/bin/env bash
set -Eeuo pipefail
REPO_SSH="${REPO_SSH:-git@github.com:Hydro8888/hydro.git}"
BRANCH="${BRANCH:-codex/toon2film-platform-full}"
TARGET_DIR="${TARGET_DIR:-/home/ubuntu/toon2film-deploy}"
if [[ "$(id -un)" != "ubuntu" ]]; then
  echo "[FAIL] Run as ubuntu, not root." >&2
  exit 1
fi
set +e
SSH_OUTPUT="$(ssh -o BatchMode=yes -T git@github.com 2>&1)"
set -e
echo "$SSH_OUTPUT"
if ! echo "$SSH_OUTPUT" | grep -qi "successfully authenticated"; then
  echo "[FAIL] GitHub SSH authentication failed." >&2
  exit 1
fi
if [[ -e "$TARGET_DIR" && ! -d "$TARGET_DIR/.git" ]]; then
  echo "[FAIL] $TARGET_DIR exists but is not a git repository." >&2
  exit 1
fi
if [[ -d "$TARGET_DIR/.git" ]]; then
  cd "$TARGET_DIR"
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "[FAIL] Local changes exist in $TARGET_DIR." >&2
    exit 1
  fi
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
else
  git clone -b "$BRANCH" "$REPO_SSH" "$TARGET_DIR"
fi
cd "$TARGET_DIR/toon2film"
chmod +x deploy/install_server.sh
./deploy/install_server.sh --install-deps --with-nginx --with-pm2-startup
BASH

chmod +x /home/ubuntu/install_toon2film.sh
/home/ubuntu/install_toon2film.sh
```

After the repository exists, this shorter repo script is also available:

```bash
cd /home/ubuntu/toon2film-deploy/toon2film
deploy/install_from_ssh.sh
```

Safe defaults:

- App folder: `/home/ubuntu/toon2film-deploy/toon2film`
- Web PM2 name: `toon2film-web`
- API PM2 name: `toon2film-api`
- Web port: `3610`
- API port: `8600`
- Public path: `/toon2film`

The script checks existing services before and after deploy:

```bash
contact matching hacker agentmarket fundmanager gonak jobworld
```

It backs up the active Nginx site file outside `sites-enabled`, runs `sudo nginx -t`,
and reloads Nginx only after the syntax test passes.

Do not commit real API keys. Put provider keys in the server-only `.env` file after deploy.
