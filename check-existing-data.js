// 检查数据库中的现有数据
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    // 检查用户数量
    const userCount = await prisma.user.count();
    console.log(`用户数量: ${userCount}`);
    
    // 检查项目数量
    const projectCount = await prisma.project.count();
    console.log(`项目数量: ${projectCount}`);
    
    // 如果有用户，显示第一个用户ID
    if (userCount > 0) {
      const firstUser = await prisma.user.findFirst();
      console.log(`第一个用户ID: ${firstUser.id}`);
      console.log(`用户名: ${firstUser.username}`);
    }
    
    // 如果有项目，显示项目列表
    if (projectCount > 0) {
      const projects = await prisma.project.findMany({
        select: { id: true, name: true }
      });
      console.log('\n现有项目:');
      projects.forEach(p => console.log(`  - ${p.name} (${p.id})`));
    }
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
