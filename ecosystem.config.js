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
      cron_restart: '0 */8 * * *',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
