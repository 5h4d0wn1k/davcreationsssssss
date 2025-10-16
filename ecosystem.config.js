module.exports = {
  apps: [
    {
      name: 'customer-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/dev.davcreations.in/davcreationsssssss/customer-frontend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/customer-frontend-error.log',
      out_file: '/var/log/pm2/customer-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'admin-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/dev.davcreations.in/davcreationsssssss/admin-frontend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/admin-frontend-error.log',
      out_file: '/var/log/pm2/admin-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'superadmin-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/dev.davcreations.in/davcreationsssssss/superadmin-frontend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/var/log/pm2/superadmin-frontend-error.log',
      out_file: '/var/log/pm2/superadmin-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};