/**
 * 验证所有 API 路由中的字段名是否正确
 */

const fs = require('fs');
const path = require('path');

// 需要检查的错误模式
const errorPatterns = [
  { pattern: /prisma\.Project/g, correct: 'prisma.project', description: 'Project 应该是小写' },
  { pattern: /prisma\.Graph/g, correct: 'prisma.graph', description: 'Graph 应该是小写' },
  { pattern: /prisma\.Node/g, correct: 'prisma.node', description: 'Node 应该是小写' },
  { pattern: /prisma\.Edge/g, correct: 'prisma.edge', description: 'Edge 应该是小写' },
  { pattern: /prisma\.User/g, correct: 'prisma.user', description: 'User 应该是小写' },
  { pattern: /prisma\.SearchHistory/g, correct: 'prisma.searchhistory', description: 'SearchHistory 应该是小写' },
  { pattern: /graphs:\s*{/g, correct: 'graph: {', description: 'graphs 应该是 graph（单数）' },
  { pattern: /graphs:\s*true/g, correct: 'graph: true', description: 'graphs 应该是 graph（单数）' },
  { pattern: /nodes:\s*{/g, correct: 'node: {', description: 'nodes 应该是 node（单数）' },
  { pattern: /nodes:\s*true/g, correct: 'node: true', description: 'nodes 应该是 node（单数）' },
  { pattern: /edges:\s*{/g, correct: 'edge: {', description: 'edges 应该是 edge（单数）' },
  { pattern: /edges:\s*true/g, correct: 'edge: true', description: 'edges 应该是 edge（单数）' },
  { pattern: /\.graphs\b/g, correct: '.graph', description: '访问 .graphs 应该是 .graph' },
  { pattern: /\.nodes\b/g, correct: '.node', description: '访问 .nodes 应该是 .node' },
  { pattern: /\.edges\b/g, correct: '.edge', description: '访问 .edges 应该是 .edge' },
];

// 扫描目录
function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        scanDirectory(filePath, results);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      results.push(filePath);
    }
  }
  
  return results;
}

// 检查文件
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const errors = [];
  
  for (const { pattern, correct, description } of errorPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      errors.push({
        pattern: pattern.source,
        correct,
        description,
        count: matches.length,
        matches: matches.slice(0, 3), // 只显示前3个匹配
      });
    }
  }
  
  return errors;
}

// 主函数
function main() {
  console.log('🔍 开始验证字段名...\n');
  
  const apiDir = path.join(__dirname, 'app', 'api');
  const files = scanDirectory(apiDir);
  
  console.log(`📁 扫描 ${files.length} 个文件...\n`);
  
  let totalErrors = 0;
  const filesWithErrors = [];
  
  for (const file of files) {
    const errors = checkFile(file);
    if (errors.length > 0) {
      totalErrors += errors.reduce((sum, e) => sum + e.count, 0);
      filesWithErrors.push({ file, errors });
    }
  }
  
  if (filesWithErrors.length === 0) {
    console.log('✅ 所有文件检查通过！没有发现错误的字段名。\n');
    console.log('🎉 数据库字段映射正确！');
    return;
  }
  
  console.log(`❌ 发现 ${totalErrors} 个潜在问题：\n`);
  
  for (const { file, errors } of filesWithErrors) {
    const relativePath = path.relative(__dirname, file);
    console.log(`📄 ${relativePath}`);
    
    for (const error of errors) {
      console.log(`   ⚠️  ${error.description}`);
      console.log(`      模式: ${error.pattern}`);
      console.log(`      应改为: ${error.correct}`);
      console.log(`      出现次数: ${error.count}`);
      if (error.matches.length > 0) {
        console.log(`      示例: ${error.matches.join(', ')}`);
      }
      console.log('');
    }
  }
  
  console.log('💡 提示：请手动检查这些文件，确保字段名正确。');
  console.log('📚 参考文档：MYSQL-FIELD-MAPPING.md\n');
}

main();
