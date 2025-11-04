const fs = require('fs');
const path = '/var/www/ieclub-backend-staging/.env.staging';

let env = fs.readFileSync(path, 'utf8');
env = env.replace(
  /DATABASE_URL=.*/,
  'DATABASE_URL="mysql://ieclub_user:kE7pCg$r@W9nZ!sV2@127.0.0.1:3306/ieclub_staging"'
);
fs.writeFileSync(path, env);

console.log('✓ Updated .env.staging');
console.log(env.match(/DATABASE_URL=.*/)[0]);

