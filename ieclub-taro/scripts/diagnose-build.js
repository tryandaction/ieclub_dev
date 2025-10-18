// scripts/diagnose-build.js
// 用于诊断 Taro 构建过程的脚本

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 开始诊断 Taro H5 构建过程...\n');

// 1. 检查环境
console.log('📋 环境信息：');
console.log('- Node 版本:', process.version);
console.log('- npm 版本:', execSync('npm -v').toString().trim());

// 2. 检查 Taro 版本
try {
  const taroCliVersion = execSync('npx taro -V').toString().trim();
  console.log('- Taro CLI 版本:', taroCliVersion);
} catch (e) {
  console.error('❌ Taro CLI 未安装！');
}

// 3. 检查 package.json
console.log('\n📦 依赖检查：');
const packageJson = require('../package.json');
const taroDeps = Object.keys(packageJson.dependencies || {})
  .filter(dep => dep.includes('taro'))
  .concat(Object.keys(packageJson.devDependencies || {}).filter(dep => dep.includes('taro')));

taroDeps.forEach(dep => {
  const version = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
  console.log(`- ${dep}: ${version}`);
});

// 4. 检查配置文件
console.log('\n⚙️ 配置文件检查：');
const configPath = path.join(__dirname, '../config/index.js');
if (fs.existsSync(configPath)) {
  console.log('✅ config/index.js 存在');
  try {
    const config = require(configPath);
    console.log('- H5 配置存在:', !!config().h5);
    console.log('- htmlPluginOption:', JSON.stringify(config().h5?.htmlPluginOption, null, 2));
  } catch (e) {
    console.error('❌ 配置文件解析失败:', e.message);
  }
} else {
  console.error('❌ config/index.js 不存在');
}

// 5. 检查模板文件
console.log('\n📄 模板文件检查：');
const possibleTemplates = [
  'src/index.html',
  'public/index.html',
  'config/index.html'
];

possibleTemplates.forEach(templatePath => {
  const fullPath = path.join(__dirname, '..', templatePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${templatePath} 存在`);
  } else {
    console.log(`❌ ${templatePath} 不存在`);
  }
});

// 6. 清理并重新构建
console.log('\n🧹 清理旧文件...');
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
  console.log('✅ 已删除 dist 目录');
}

const nodModulesCache = path.join(__dirname, '../node_modules/.cache');
if (fs.existsSync(nodModulesCache)) {
  fs.rmSync(nodModulesCache, { recursive: true, force: true });
  console.log('✅ 已清理 node_modules/.cache');
}

// 7. 执行构建
console.log('\n🔨 开始构建 H5...');
try {
  execSync('npm run build:h5', {
    stdio: 'inherit',
    env: { ...process.env, DEBUG: 'taro:*' } // 启用调试输出
  });

  // 8. 检查构建结果
  console.log('\n📊 构建结果检查：');
  const distH5Path = path.join(__dirname, '../dist/h5');

  if (!fs.existsSync(distH5Path)) {
    console.error('❌ dist/h5 目录不存在！');
    process.exit(1);
  }

  const files = fs.readdirSync(distH5Path);
  console.log('- dist/h5 包含文件：', files);

  const indexHtmlPath = path.join(distH5Path, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    console.log('✅ index.html 生成成功！');
    const stats = fs.statSync(indexHtmlPath);
    console.log(`- 文件大小: ${stats.size} 字节`);

    // 读取前 500 字符
    const content = fs.readFileSync(indexHtmlPath, 'utf-8');
    console.log('- HTML 内容预览：');
    console.log(content.substring(0, 500));
  } else {
    console.error('❌ index.html 仍然不存在！');
    console.log('\n🔍 尝试查找其他 HTML 文件：');
    files.forEach(file => {
      if (file.endsWith('.html')) {
        console.log(`- 找到: ${file}`);
      }
    });
    process.exit(1);
  }

} catch (e) {
  console.error('❌ 构建失败:', e.message);
  process.exit(1);
}

console.log('\n✅ 诊断完成！');