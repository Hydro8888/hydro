module.exports = {
  apps: [
    {
      name: 'freeai',
      cwd: '/home/ubuntu/freeai/apps/web',
      script: '../../node_modules/.bin/next',
      args: 'start -p 3010 -H 0.0.0.0',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
        HOSTNAME: '0.0.0.0',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
  ],
};
