# Toon2Film Server Deploy

SSH 접속 후 아래 블록을 그대로 붙여 넣으면 저장소를 클론/업데이트하고 바로 서버에 반영합니다.
GitHub는 서버의 SSH 인증을 사용하므로 아이디/비밀번호 입력이 필요 없습니다.

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

이미 저장소가 있는 서버에서는 아래만 실행해도 됩니다.

```bash
cd /home/ubuntu/toon2film-deploy/toon2film
./deploy/install_from_ssh.sh
```

Safe defaults:

- App folder: `/home/ubuntu/toon2film-deploy/toon2film`
- Web PM2 name: `toon2film-web`
- API PM2 name: `toon2film-api`
- Web port: `3610`
- API port: `8600`
- Public path: `/toon2film`

안전장치:

- `toon2film-web`, `toon2film-api`만 삭제/재시작합니다. `sudo pm2`는 사용하지 않습니다.
- 예전 배포에서 남은 `toon2film-worker-*` PM2 프로세스는 Toon2Film 이름만 대상으로 정리합니다.
- `/etc/nginx/sites-enabled/hydro`, `/etc/nginx/sites-enabled/multi-service`를 함께 검사해 `127.0.0.1`과 `172.30.1.99`가 다른 server 블록을 타는 문제를 방지합니다.
- 기존 `/toon2film`, `/toon2film/`, `/toon2film/api`, `/toon2film/api/` location을 모두 제거한 뒤 관리 블록을 하나만 다시 삽입합니다.
- 백업은 `/home/ubuntu/.toon2film-deploy-backup/<timestamp>`에 저장하며 `sites-enabled` 안에는 `.bak` 파일을 만들지 않습니다.
- `sudo nginx -t`가 실패하면 즉시 백업을 복원하고 reload하지 않습니다.
- Nginx는 `restart`가 아니라 `reload`만 사용합니다.
- 기존 서비스 응답을 배포 전/후 비교해 새 5xx 또는 000 회귀가 생기면 실패 처리합니다.

기존 서비스 체크 대상:

```bash
contact matching hacker agentmarket fundmanager gonak jobworld
```

배포 완료 후 확인 URL:

```bash
curl -sI http://127.0.0.1:3610/toon2film | head -3
curl -sI http://127.0.0.1:8600/health | head -3
curl -sI http://127.0.0.1/toon2film | head -3
curl -sI http://172.30.1.99/toon2film | head -3
curl -sI http://172.30.1.99/toon2film/api/health | head -3
```

Do not commit real API keys. Put provider keys in the server-only `.env` file after deploy.
`OPENAI_API_KEY` is required for every AI analysis step: comic upload analysis, story bible, character bible, storyboard, and video prompt generation.
