// 部署诊断脚本 - 检查依赖和配置问题
const fs = require('fs');
const path = require('path');

console.log('🔍 IEClub 部署诊断工具');
console.log('================================');

// 检查关键文件是否存在
const criticalFiles = [
    'src/app.js',
    'src/server.js',
    'scripts/seed.js',
    'package.json',
    'prisma/schema.prisma'
];

console.log('\n📁 检查关键文件:');
criticalFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file} ${exists ? '' : '(缺失)'}`);
});

// 检查 package.json 中的关键依赖
console.log('\n📦 检查关键依赖:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const criticalDeps = ['hpp', 'helmet', 'express', 'cors', '@prisma/client'];

    criticalDeps.forEach(dep => {
        const version = packageJson.dependencies?.[dep];
        console.log(`${version ? '✅' : '❌'} ${dep}: ${version || '未定义'}`);
    });
} catch (error) {
    console.log('❌ package.json 读取失败:', error.message);
}

// 检查 node_modules 中的 hpp 模块
console.log('\n🔍 检查 hpp 模块安装情况:');
const hppPath = path.join(process.cwd(), 'node_modules', 'hpp');
const hppExists = fs.existsSync(hppPath);
console.log(`${hppExists ? '✅' : '❌'} hpp 模块已安装`);

if (!hppExists) {
    console.log('\n💡 修复建议:');
    console.log('1. 删除 node_modules 和 package-lock.json');
    console.log('2. 运行: npm cache clean --force');
    console.log('3. 运行: npm install --omit=dev');
    console.log('4. 验证 hpp 模块: ls node_modules | grep hpp');
}

// 检查环境变量文件
console.log('\n🌍 检查环境配置:');
const envFile = '.env';
const envExampleFile = '.env.example';

if (fs.existsSync(envFile)) {
    console.log('✅ .env 文件存在');
} else {
    console.log('❌ .env 文件不存在');
    if (fs.existsSync(envExampleFile)) {
        console.log('✅ .env.example 文件存在，可复制为 .env');
    }
}

// 检查 Prisma 配置
console.log('\n🗄️ 检查 Prisma 配置:');
try {
    if (fs.existsSync('prisma/schema.prisma')) {
        const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
        if (schema.includes('DATABASE_URL')) {
            console.log('✅ Prisma schema 配置正确');
        } else {
            console.log('❌ Prisma schema 缺少数据库配置');
        }
    }
} catch (error) {
    console.log('❌ Prisma schema 检查失败:', error.message);
}

console.log('\n📋 诊断完成！');
console.log('如果仍有问题，请检查上述各项配置。');