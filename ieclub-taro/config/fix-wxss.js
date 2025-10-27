/**
 * WXSS 修复脚本 (CommonJS)
 *
 * 微信小程序不支持 @layer 语法，需要移除
 * 该脚本在构建后自动运行，移除所有 WXSS 文件中的 @layer 声明
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');

console.log('\n开始修复WXSS文件...\n');

function findWxssFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...findWxssFiles(fullPath));
    } else if (item.endsWith('.wxss')) {
      files.push(fullPath);
    }
  });
  return files;
}

// 更稳健地移除 @layer <name> { ... } 包装，保留内部内容
function removeLayerWrappers(content) {
  let out = '';
  let i = 0;
  while (i < content.length) {
    const idx = content.indexOf('@layer', i);
    if (idx === -1) {
      out += content.slice(i);
      break;
    }
    // append up to @layer
    out += content.slice(i, idx);
    // find opening brace
    const braceOpen = content.indexOf('{', idx);
    if (braceOpen === -1) {
      // malformed, stop
      out += content.slice(idx);
      break;
    }
    // copy any whitespace or identifier between @layer and '{' is ignored
    // now find matching closing brace by counting
    let depth = 0;
    let j = braceOpen;
    let found = false;
    for (; j < content.length; j++) {
      if (content[j] === '{') depth++;
      else if (content[j] === '}') {
        depth--;
        if (depth === 0) {
          found = true;
          break;
        }
      }
    }
    if (!found) {
      // unbalanced braces: append rest and break
      out += content.slice(idx);
      break;
    }
    // extract inner content between braceOpen+1 and j
    const inner = content.slice(braceOpen + 1, j);
    // append inner content (effectively removing @layer wrapper)
    out += inner;
    // continue after closing brace
    i = j + 1;
  }
  return out;
}

 // 通用方法：移除指定 at-rule 的包装（例如 @supports），保留内部内容
 function removeAtRuleWrappers(content, atRuleName) {
   const needle = '@' + atRuleName;
   let result = content;
   let changed = true;
   
   // 重复处理直到没有更多的 at-rule 需要移除
   while (changed) {
     changed = false;
     let out = '';
     let i = 0;
     
     while (i < result.length) {
       const idx = result.indexOf(needle, i);
       if (idx === -1) {
         out += result.slice(i);
         break;
       }
       out += result.slice(i, idx);
       const braceOpen = result.indexOf('{', idx);
       if (braceOpen === -1) {
         out += result.slice(idx);
         break;
       }
       let depth = 0;
       let j = braceOpen;
       let found = false;
       for (; j < result.length; j++) {
         if (result[j] === '{') depth++;
         else if (result[j] === '}') {
           depth--;
           if (depth === 0) {
             found = true;
             break;
           }
         }
       }
       if (!found) {
         out += result.slice(idx);
         break;
       }
       const inner = result.slice(braceOpen + 1, j);
       out += inner;
       i = j + 1;
       changed = true;
     }
     result = out;
   }
   return result;
 }

 // 移除类名中的反斜杠转义（小程序不支持）
 function removeEscapedSelectors(content) {
   // 将 .class-name\.suffix 替换为 .class-name-suffix
   // 例如: .top-0\.5 -> .top-0-5
   return content.replace(/\.([\w-]+)\\([\w.-]+)/g, '.$1-$2');
 }

 // 清理重复的空行和多余的空白
 function cleanupCSS(content) {
   return content
     // 移除多余的空行（超过2个连续换行）
     .replace(/\n\s*\n\s*\n+/g, '\n\n')
     // 移除行首行尾空白
     .replace(/^\s+|\s+$/gm, '')
     // 移除空的CSS规则块
     .replace(/[^{}]*\{\s*\}/g, '')
     // 确保文件末尾只有一个换行
     .replace(/\s*$/, '\n');
 }

 let fixedCount = 0;
 if (fs.existsSync(distPath)) {
   const wxssFiles = findWxssFiles(distPath);
   wxssFiles.forEach(filePath => {
     let content = fs.readFileSync(filePath, 'utf-8');
     let fixed = content;
     
    // 移除各种不被小程序支持的 at-rule 包装
    // 注意：@keyframes 是支持的，不要移除
    fixed = removeLayerWrappers(fixed);
    fixed = removeAtRuleWrappers(fixed, 'supports');
    fixed = removeAtRuleWrappers(fixed, 'media');
    fixed = removeAtRuleWrappers(fixed, 'property');
    fixed = removeAtRuleWrappers(fixed, 'container');
    fixed = removeAtRuleWrappers(fixed, 'import');
    fixed = removeAtRuleWrappers(fixed, 'charset');
    
    // 移除类名中的反斜杠转义
    fixed = removeEscapedSelectors(fixed);
    
    // 清理CSS格式
    fixed = cleanupCSS(fixed);
     
     if (fixed !== content) {
       fs.writeFileSync(filePath, fixed, 'utf-8');
       const relativePath = path.relative(distPath, filePath);
       console.log(`✓ 已修复: ${relativePath}`);
       fixedCount++;
     }
   });
 } else {
   console.warn(`dist 目录不存在: ${distPath}`);
 }

console.log(`\n✅ 完成！共修复 ${fixedCount} 个文件\n`);

