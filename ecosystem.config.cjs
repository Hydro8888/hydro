module.exports = {
  apps: [
    {
      name: 'room',
      script: './server.js',
      cwd: '/home/ubuntu/room',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: '5110',
        DB_PATH: '/home/ubuntu/room/data/reservations.db',
      },
      out_file: '/home/ubuntu/room/logs/out.log',
      error_file: '/home/ubuntu/room/logs/err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
