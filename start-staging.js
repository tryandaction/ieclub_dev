// 测试环境启动脚本 - 简单直接
require('dotenv').config({ path: '.env.staging' });

// 设置必要的环境变量
process.env.NODE_ENV = 'staging';
process.env.PORT = process.env.PORT || '3001';

console.log('✅ 启动测试环境服务');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT}`);

// 启动应用
require('./src/server.js');
