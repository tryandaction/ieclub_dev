/**
 * 修复小程序WXSS文件
 * 移除 @layer 指令和其他小程序不支持的CSS特性
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');

function fixWxssFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 移除 @layer 指令
  content = content.replace(/@layer\s+[\w-]+\s*;?/g, '');
  content = content.replace(/@layer\s+[\w-]+\s*\{([^}]*)\}/g, '$1');
  
  // 简化嵌套的 @layer
  let changed = true;
  while (changed) {
    const before = content;
    content = content.replace(/@layer\s+[\w-]+\s*\{/g, '');
    // 移除对应的闭合括号
    let depth = 0;
    let result = '';
    let inLayer = false;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (content.substr(i, 6) === '@layer') {
        inLayer = true;
      }
      if (char === '{') {
        if (inLayer) {
          inLayer = false;
          continue;
        }
        depth++;
      } else if (char === '}') {
        if (depth === 0 && inLayer) {
          inLayer = false;
          continue;
        }
        depth--;
      }
      result += char;
    }
    
    content = result;
    changed = (before !== content);
  }
  
  // 移除 @supports 查询（如果太复杂）
  content = content.replace(/@supports\s*\([^)]+\)\s*\{[^}]*\}/g, '');
  
  // 移除 @property 定义（CSS Houdini，小程序不支持）
  content = content.replace(/@property\s+--[\w-]+\s*\{[^}]*\}/g, '');
  
  // 清理多余的空行和空格
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  content = content.replace(/\{\s+/g, '{');
  content = content.replace(/\s+\}/g, '}');
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ 已修复: ${path.relative(distDir, filePath)}`);
}

function fixAllWxss(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      fixAllWxss(fullPath);
    } else if (file.endsWith('.wxss')) {
      fixWxssFile(fullPath);
    }
  }
}

console.log('开始修复WXSS文件...\n');
fixAllWxss(distDir);
console.log('\n✅ 所有WXSS文件已修复！');

