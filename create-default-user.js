// 创建默认用户并为现有项目分配
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDefaultUser() {
  try {
    console.log('检查是否已有用户...');
    
    // 检查是否已有用户
    const existingUser = await prisma.$queryRaw`
      SELECT id, username FROM \`user\` LIMIT 1
    `;
    
    let userId;
    
    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      console.log(`使用现有用户: ${existingUser[0].username} (${userId})`);
    } else {
      // 创建默认用户
      console.log('创建默认用户...');
      const newUser = await prisma.$queryRaw`
        INSERT INTO \`user\` (id, username, password, email, name, createdAt, updatedAt)
        VALUES (UUID(), 'admin', '$2a$10$defaultpasswordhash', 'admin@example.com', 'Administrator', NOW(), NOW())
      `;
      
      // 获取刚创建的用户ID
      const user = await prisma.$queryRaw`
        SELECT id, username FROM \`user\` WHERE username = 'admin'
      `;
      userId = user[0].id;
      console.log(`✓ 默认用户已创建: admin (${userId})`);
    }
    
    // 为所有没有userId的项目分配默认用户
    const nullProjects = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM \`project\` WHERE \`userId\` IS NULL
    `;
    const nullCount = Number(nullProjects[0].count);
    
    if (nullCount > 0) {
      console.log(`\n为 ${nullCount} 个项目分配用户...`);
      await prisma.$executeRaw`
        UPDATE \`project\` SET \`userId\` = ${userId} WHERE \`userId\` IS NULL
      `;
      console.log('✓ 已为所有项目分配用户');
    } else {
      console.log('\n所有项目都已有所有者');
    }
    
    // 验证结果
    const projects = await prisma.$queryRaw`
      SELECT id, name, userId FROM \`project\`
    `;
    console.log('\n当前项目状态:');
    projects.forEach(p => {
      console.log(`  - ${p.name}: userId = ${p.userId}`);
    });
    
    console.log('\n完成！');
    
  } catch (error) {
    console.error('错误:', error.message);
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultUser().catch(console.error);
