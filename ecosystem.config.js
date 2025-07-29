module.exports = {
  apps: [
    {
      name: "stats_bot",
      script: "dist/bot/index.js",
      args: "--expose-gc --optimize_for_size",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      log_date_format: "MM-DD HH:mm:ss",
      kill_timeout: 60000,
      no_pmx: true,
    },
    {
      name: "stats_chart_service",
      script: "dist/chart_service/index.js",
      args: "--expose-gc --optimize_for_size",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      log_date_format: "MM-DD HH:mm:ss",
      kill_timeout: 60000,
      no_pmx: true,
    },
  ],
};

// cron_restart ?