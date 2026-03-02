// 测试数据库连接的脚本
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 正在测试数据库连接...\n');
  
  try {
    // 尝试连接数据库
    await prisma.$connect();
    console.log('✅ 数据库连接成功！\n');
    
    // 尝试查询项目数量
    const projectCount = await prisma.project.count();
    console.log(`📊 当前项目数量: ${projectCount}`);
    
    // 尝试查询图谱数量
    const graphCount = await prisma.graph.count();
    console.log(`📊 当前图谱数量: ${graphCount}`);
    
    // 尝试查询节点数量
    const nodeCount = await prisma.node.count();
    console.log(`📊 当前节点数量: ${nodeCount}`);
    
    // 尝试查询边数量
    const edgeCount = await prisma.edge.count();
    console.log(`📊 当前边数量: ${edgeCount}\n`);
    
    console.log('✅ 数据库工作正常！');
    
  } catch (error) {
    console.error('❌ 数据库连接失败！\n');
    console.error('错误信息:', error.message);
    console.error('\n可能的原因:');
    console.error('1. Neon 数据库已暂停（免费版会在不活动后自动暂停）');
    console.error('2. 网络连接问题');
    console.error('3. 数据库凭证过期\n');
    console.error('解决方案:');
    console.error('1. 访问 https://console.neon.tech/ 唤醒数据库');
    console.error('2. 查看 DATABASE-CONNECTION-FIX.md 文件获取详细指南');
    console.error('3. 或临时切换到本地 SQLite 数据库进行开发\n');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
