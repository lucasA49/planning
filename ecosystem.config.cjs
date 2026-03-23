module.exports = {
  apps: [
    {
      name: 'planning-app',
      script: './backend/server.js',
      cwd: '/var/www/planning-app',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Redémarre automatiquement si le process plante
      restart_delay: 3000,
      max_restarts: 10,
      // Logs
      out_file: '/var/log/planning-app/out.log',
      error_file: '/var/log/planning-app/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
