const path = require("path");

const appRoot = __dirname;
const webPort = process.env.TOON2FILM_WEB_PORT || "3610";
const apiPort = process.env.TOON2FILM_API_PORT || "8600";
const basePath = process.env.TOON2FILM_BASE_PATH || "/toon2film";
const webName = process.env.TOON2FILM_WEB_PM2_NAME || "toon2film-web";
const apiName = process.env.TOON2FILM_API_PM2_NAME || "toon2film-api";
const pythonBin = path.join(appRoot, ".venv/bin/python");
const nextBin = path.join(appRoot, "node_modules/next/dist/bin/next");

module.exports = {
  apps: [
    {
      name: apiName,
      cwd: path.join(appRoot, "apps/api"),
      script: pythonBin,
      args: `-m uvicorn app.main:app --host 127.0.0.1 --port ${apiPort}`,
      interpreter: "none",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        ENVIRONMENT: "production",
        API_CORS_ORIGINS: `http://127.0.0.1:${webPort},http://localhost:${webPort},http://172.30.1.99`,
      },
    },
    {
      name: webName,
      cwd: path.join(appRoot, "apps/web"),
      script: process.execPath,
      args: `${nextBin} start -H 0.0.0.0 -p ${webPort}`,
      interpreter: "none",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "768M",
      env: {
        NODE_ENV: "production",
        PORT: webPort,
        NEXT_PUBLIC_BASE_PATH: basePath,
        NEXT_PUBLIC_API_BASE_URL: `${basePath}/api`,
      },
    },
  ],
};
