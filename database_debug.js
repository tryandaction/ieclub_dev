// 调试：检查环境变量加载
const path = require('path');
console.log('=== Database.js Debug ===');
console.log('Current __dirname:', __dirname);
console.log('Resolved .env path (../…):', path.resolve(__dirname, '../../.env.staging'));

// 加载环境变量
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.staging') });

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('=== End Debug ===');

