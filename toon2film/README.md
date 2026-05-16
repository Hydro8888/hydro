# Toon2Film

Toon2Film is an MVP scaffold for an AI film-production SaaS that turns comics, manga pages, and webtoon source images into structured cinematic production data.

```text
Source Upload -> AI Analysis -> Story Bible -> Character Bible -> Scene/Shot Builder -> Prompt Studio -> Video Generation -> Timeline Export
```

The goal is not to send comic images directly to a video model. Toon2Film first creates the intermediate production artifacts that keep story, character identity, shot design, and prompts consistent.

## Repository

```text
apps/web  - Next.js, TypeScript, Tailwind CSS
apps/api  - FastAPI, SQLAlchemy, Celery, provider adapters
```

## MVP Scope

- Project dashboard and new project flow
- Source upload contract with rights confirmation
- Source page, panel, character, story, scene, shot, prompt, video job, clip, timeline, export models
- Story Architect and Seedance prompt generator service skeletons
- Provider interface for Seedance and future video models
- Celery worker skeleton for analysis and generation queues
- Review, audio, timeline/export surface placeholders

## Local Development

Copy the environment template:

```bash
cp .env.example .env
```

Start local infrastructure:

```bash
docker compose up -d postgres redis minio
```

Run the API:

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Run the web app:

```bash
npm install
npm run dev:web
```

Open:

```text
http://localhost:3000
```

## Safety Notes

- API keys must stay in environment variables or encrypted user storage.
- Uploaded source material requires explicit rights confirmation before processing.
- Video providers are isolated behind an interface so Seedance, Runway, Kling, Veo, Sora, or future APIs can be swapped without rewriting production workflow data.

## Ubuntu Server Deployment

Use a separate folder and the safe deploy script so existing services keep running. After SSH login as `ubuntu`, paste and run this single installer:

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

Default production values:

```text
Path: /toon2film
Web port: 3610
API port: 8600
PM2: toon2film-web, toon2film-api
```

The script backs up the active Nginx site outside `sites-enabled`, checks port conflicts, restarts only Toon2Film PM2 processes, runs `nginx -t` before reload, and compares existing service health before and after deployment.
