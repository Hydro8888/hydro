module.exports = {
  apps: [{
    name: 'simburum',
    script: 'node_modules/.bin/next',
    args: 'start -p 4200 -H 0.0.0.0',
    cwd: '/home/ubuntu/simburum',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 4200
    },
    error_file: '/home/ubuntu/simburum/logs/error.log',
    out_file: '/home/ubuntu/simburum/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '500M',
    restart_delay: 3000,
    max_restarts: 10,
  }]
};
