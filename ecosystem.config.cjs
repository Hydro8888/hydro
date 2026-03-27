module.exports = {
  apps: [
    {
      name: 'freeai',
      cwd: '/home/ubuntu/freeai/apps/web',
      script: '.next/standalone/apps/web/server.js',
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
