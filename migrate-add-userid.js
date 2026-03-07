// 手动执行数据库迁移 - 添加userId字段
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'dhlab431',
    database: 'neondb'
  });

  try {
    console.log('开始迁移...');
    
    // Step 1: 检查userId字段是否已存在
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM `project` LIKE 'userId'"
    );
    
    if (columns.length > 0) {
      console.log('userId字段已存在，跳过添加');
    } else {
      // Step 2: 添加userId字段（允许NULL）
      console.log('添加userId字段...');
      await connection.query(
        'ALTER TABLE `project` ADD COLUMN `userId` VARCHAR(191) NULL'
      );
      console.log('✓ userId字段已添加');
    }
    
    // Step 3: 检查索引是否已存在
    const [indexes] = await connection.query(
      "SHOW INDEX FROM `project` WHERE Key_name = 'Project_userId_idx'"
    );
    
    if (indexes.length > 0) {
      console.log('userId索引已存在，跳过创建');
    } else {
      // Step 4: 创建userId索引
      console.log('创建userId索引...');
      await connection.query(
        'CREATE INDEX `Project_userId_idx` ON `project`(`userId`)'
      );
      console.log('✓ userId索引已创建');
    }
    
    // Step 5: 检查现有数据
    const [projects] = await connection.query(
      'SELECT COUNT(*) as count FROM `project`'
    );
    const projectCount = projects[0].count;
    console.log(`\n当前项目数量: ${projectCount}`);
    
    if (projectCount > 0) {
      const [nullProjects] = await connection.query(
        'SELECT COUNT(*) as count FROM `project` WHERE `userId` IS NULL'
      );
      const nullCount = nullProjects[0].count;
      console.log(`需要分配userId的项目: ${nullCount}`);
      
      if (nullCount > 0) {
        // 检查是否有用户
        const [users] = await connection.query(
          'SELECT id, username FROM `user` LIMIT 1'
        );
        
        if (users.length > 0) {
          const defaultUserId = users[0].id;
          console.log(`\n将使用默认用户: ${users[0].username} (${defaultUserId})`);
          console.log('为现有项目分配默认用户...');
          
          await connection.query(
            'UPDATE `project` SET `userId` = ? WHERE `userId` IS NULL',
            [defaultUserId]
          );
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
    throw error;
  } finally {
    await connection.end();
  }
}

migrate().catch(console.error);
