// 恢复 PostgreSQL 字段名的脚本
// 将 MySQL 的单数字段名改回 PostgreSQL 的复数字段名

const fs = require('fs');
const path = require('path');

const replacements = [
  // _count 字段
  { from: /_count\.graph\b/g, to: '_count.graphs' },
  { from: /_count\.node\b/g, to: '_count.nodes' },
  { from: /_count\.edge\b/g, to: '_count.edges' },
  
  // 关系字段（需要小心，只替换特定上下文）
  { from: /project\.graph\b/g, to: 'project.graphs' },
  { from: /project\.node\b/g, to: 'project.nodes' },
  { from: /project\.edge\b/g, to: 'project.edges' },
  
  // include 语句
  { from: /include:\s*{\s*graph:/g, to: 'include: {\n    graphs:' },
  { from: /include:\s*{\s*node:/g, to: 'include: {\n    nodes:' },
  { from: /include:\s*{\s*edge:/g, to: 'include: {\n    edges:' },
];

const filesToFix = [
  'app/api/projects/[id]/route.ts',
  'app/api/projects/with-graphs/route.ts',
  'app/api/projects/batch-delete/route.ts',
  'app/api/projects/[id]/graphs/route.ts',
  'app/api/ai/save-graph/route.ts',
  'app/api/graphs/[id]/route.ts',
  'app/api/gallery/graphs/route.ts',
  'app/api/import/route.ts',
  'app/api/convert/route.ts',
];

let totalChanges = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let fileChanges = 0;
  
  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      fileChanges += matches.length;
    }
  });
  
  if (fileChanges > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath}: ${fileChanges} 处修改`);
    totalChanges += fileChanges;
  } else {
    console.log(`✓  ${filePath}: 无需修改`);
  }
});

console.log(`\n总计: ${totalChanges} 处修改`);
console.log('\n✅ PostgreSQL 字段名恢复完成！');
