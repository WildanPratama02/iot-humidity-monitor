/**
 * PM2 Ecosystem Configuration
 * IoT Humidity Monitor - Production
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'iot-frontend',
      script: 'server.js',
      cwd: '/var/www/iot-humidity',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      error_file: '/var/log/pm2/iot-frontend-error.log',
      out_file: '/var/log/pm2/iot-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    },
    {
      name: 'iot-backend',
      script: 'src/index.js',
      cwd: '/var/www/iot-humidity/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 8091
      },
      error_file: '/var/log/pm2/iot-backend-error.log',
      out_file: '/var/log/pm2/iot-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: '192.168.40.193',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/iot-humidity-monitor.git',
      path: '/var/www/iot-humidity-monitor',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && cd backend && npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
