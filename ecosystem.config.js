module.exports = {
  apps: [
    {
      name: 'customer-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/dev.davcreations.in/davcreations-rep/customer-frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'admin-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/dev.davcreations.in/davcreations-rep/admin-frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'superadmin-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/dev.davcreations.in/davcreations-rep/superadmin-frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
    },
  ],
}
