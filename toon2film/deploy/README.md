# Toon2Film Server Deploy

Recommended first install on the Ubuntu multi-service server:

```bash
git clone -b codex/toon2film-platform-full \
  git@github.com:Hydro8888/hydro.git /home/ubuntu/toon2film-deploy

cd /home/ubuntu/toon2film-deploy/toon2film
chmod +x deploy/install_server.sh
./deploy/install_server.sh --install-deps --with-nginx --with-pm2-startup
```

Safe defaults:

- App folder: `/home/ubuntu/toon2film-deploy/toon2film`
- Web PM2 name: `toon2film-web`
- API PM2 name: `toon2film-api`
- Web port: `3600`
- API port: `8600`
- Public path: `/toon2film`

The script checks existing services before and after deploy:

```bash
contact matching hacker agentmarket fundmanager gonak jobworld
```

It backs up the active Nginx site file outside `sites-enabled`, runs `sudo nginx -t`,
and reloads Nginx only after the syntax test passes.

Do not commit real API keys. Put provider keys in the server-only `.env` file after deploy.
