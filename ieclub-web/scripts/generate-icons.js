/**
 * PWA图标生成脚本
 * 运行: node scripts/generate-icons.js
 * 需要先安装: npm install sharp
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.log('⚠️ 需要先安装 sharp 库:');
  console.log('   npm install sharp');
  process.exit(1);
}

const sizes = [192, 512];
const svgPath = path.join(__dirname, '../public/icon-512.svg');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('🎨 生成PWA图标...');
  
  const svgBuffer = fs.readFileSync(svgPath);
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}.png`);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ 生成 icon-${size}.png`);
  }
  
  console.log('🎉 图标生成完成！');
}

generateIcons().catch(err => {
  console.error('❌ 生成失败:', err.message);
  process.exit(1);
});
