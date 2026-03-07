// 使用Prisma执行原始SQL迁移
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('开始迁移...');
    
    // Step 1: 检查userId字段是否已存在
    const columns = await prisma.$queryRaw`
      SHOW COLUMNS FROM \`project\` LIKE 'userId'
    `;
    
    if (columns.length > 0) {
      console.log('userId字段已存在，跳过添加');
    } else {
      // Step 2: 添加userId字段（允许NULL）
      console.log('添加userId字段...');
      await prisma.$executeRaw`
        ALTER TABLE \`project\` ADD COLUMN \`userId\` VARCHAR(191) NULL
      `;
      console.log('✓ userId字段已添加');
    }
    
    // Step 3: 检查索引是否已存在
    const indexes = await prisma.$queryRaw`
      SHOW INDEX FROM \`project\` WHERE Key_name = 'Project_userId_idx'
    `;
    
    if (indexes.length > 0) {
      console.log('userId索引已存在，跳过创建');
    } else {
      // Step 4: 创建userId索引
      console.log('创建userId索引...');
      await prisma.$executeRaw`
        CREATE INDEX \`Project_userId_idx\` ON \`project\`(\`userId\`)
      `;
      console.log('✓ userId索引已创建');
    }
    
    // Step 5: 检查现有数据
    const projectCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM \`project\`
    `;
    const count = Number(projectCount[0].count);
    console.log(`\n当前项目数量: ${count}`);
    
    if (count > 0) {
      const nullProjects = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM \`project\` WHERE \`userId\` IS NULL
      `;
      const nullCount = Number(nullProjects[0].count);
      console.log(`需要分配userId的项目: ${nullCount}`);
      
      if (nullCount > 0) {
        // 检查是否有用户
        const users = await prisma.$queryRaw`
          SELECT id, username FROM \`user\` LIMIT 1
        `;
        
        if (users.length > 0) {
          const defaultUserId = users[0].id;
          console.log(`\n将使用默认用户: ${users[0].username} (${defaultUserId})`);
          console.log('为现有项目分配默认用户...');
          
          await prisma.$executeRaw`
            UPDATE \`project\` SET \`userId\` = ${defaultUserId} WHERE \`userId\` IS NULL
          `;
          console.log('✓ 已为所有现有项目分配默认用户');
        } else {
          console.log('\n警告: 没有找到用户，无法为现有项目分配userId');
          console.log('请先创建用户，然后手动为项目分配userId');
        }
      }
    }
    
    console.log('\n迁移完成！');
    
  } catch (error) {
    console.error('迁移失败:', error.message);
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrate().catch(console.error);
