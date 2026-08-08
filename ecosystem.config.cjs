module.exports = {
  apps: [{
    name: "homeowner-report",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 3100",
    cwd: __dirname,
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    max_memory_restart: "600M",
    env: {
      NODE_ENV: "production",
    },
  }],
};
