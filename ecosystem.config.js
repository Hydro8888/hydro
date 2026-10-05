module.exports = {
  apps: [
    {
      name: 'livenews',
      script: 'node_modules/.bin/next',
      args: 'start -H 0.0.0.0 -p 4000',
      cwd: '/home/ubuntu/livenews',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOSTNAME: '0.0.0.0',
      },
    },
    {
      name: 'livenews-collector',
      script: 'node_modules/.bin/tsx',
      args: 'src/workers/scheduler.ts',
      cwd: '/home/ubuntu/livenews',
      instances: 1,
      autorestart: true,
      restart_delay: 60000,
      max_restarts: 10,
      watch: false,
      max_memory_restart: '300M',
      // Hygiene restart at 02:30 / 14:30 — between the 4-hourly collection
      // runs (scheduler.ts '0 */4 * * *'), so a restart never kills a run
      // mid-translation. (Was '0 */12 * * *' = exactly on a collection start.)
      cron_restart: '30 2,14 * * *',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
