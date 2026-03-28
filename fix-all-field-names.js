/**
 * 自动修复所有 API 路由中的字段名
 */

const fs = require('fs');
const path = require('path');

// 替换规则
const replacements = [
  // include/select 中的字段名
  { from: /(\s+)nodes:\s*\{/g, to: '$1node: {' },
  { from: /(\s+)nodes:\s*true/g, to: '$1node: true' },
  { from: /(\s+)edges:\s*\{/g, to: '$1edge: {' },
  { from: /(\s+)edges:\s*true/g, to: '$1edge: true' },
  { from: /(\s+)graphs:\s*\{/g, to: '$1graph: {' },
  { from: /(\s+)graphs:\s*true/g, to: '$1graph: true' },
  
  // 访问属性时的字段名（需要更精确的匹配）
  { from: /\.nodes\b(?!\w)/g, to: '.node' },
  { from: /\.edges\b(?!\w)/g, to: '.edge' },
  { from: /\.graphs\b(?!\w)/g, to: '.graph' },
];

// 扫描目录
function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        scanDirectory(filePath, results);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  }
  
  return results;
}

// 修复文件
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  let changeCount = 0;
  
  for (const { from, to } of replacements) {
    const before = content;
    content = content.replace(from, to);
    if (content !== before) {
      changed = true;
      const matches = before.match(from);
      if (matches) {
        changeCount += matches.length;
      }
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return { changed, changeCount };
}

// 主函数
function main() {
  console.log('🔧 开始自动修复字段名...\n');
  
  const apiDir = path.join(__dirname, 'app', 'api');
  const files = scanDirectory(apiDir);
  
  console.log(`📁 扫描 ${files.length} 个文件...\n`);
  
  let totalFixed = 0;
  let totalChanges = 0;
  const fixedFiles = [];
  
  for (const file of files) {
    const { changed, changeCount } = fixFile(file);
    if (changed) {
      totalFixed++;
      totalChanges += changeCount;
      const relativePath = path.relative(__dirname, file);
      fixedFiles.push({ file: relativePath, changeCount });
    }
  }
  
  if (totalFixed === 0) {
    console.log('✅ 所有文件已经是正确的！无需修复。\n');
    return;
  }
  
  console.log(`✅ 修复完成！\n`);
  console.log(`📊 统计信息:`);
  console.log(`   - 修复文件数: ${totalFixed}`);
  console.log(`   - 总修改次数: ${totalChanges}\n`);
  
  console.log(`📄 已修复的文件:\n`);
  for (const { file, changeCount } of fixedFiles) {
    console.log(`   ✓ ${file} (${changeCount} 处修改)`);
  }
  
  console.log('\n🎉 所有字段名已自动修复！');
  console.log('💡 建议：运行 node verify-field-names.js 验证修复结果\n');
}

main();
