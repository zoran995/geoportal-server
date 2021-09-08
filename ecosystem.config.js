/*global __dirname*/
const path = require('path');

// Pass through additional arguments that might ultimately have come from
// something like `npm run start -- --port 3009`
const argpos = process.argv.indexOf('--');
const args = argpos > -1 ? process.argv.slice(argpos + 1) : [];

module.exports = {
  apps: [
    {
      name: path.basename(__dirname),
      script: 'dist/main.js',

      // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
      args: args.join(' '),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      // If the script is called with `--env production`, this environment variable gets set.
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ] /* ,

  deploy: {
    production: {
      user: 'node',
      host: '212.83.163.1',
      ref: 'origin/master',
      repo: 'git@github.com:repo.git',
      path: '/var/www/production',
      'post-deploy':
        'npm install && pm2 reload ecosystem.config.js --env production',
    },
  }, */,
};
