-- 添加用户-项目关系迁移脚本
-- 此脚本为现有项目添加userId字段

-- Step 1: 添加userId字段（允许NULL，因为现有数据没有userId）
ALTER TABLE `project` ADD COLUMN `userId` VARCHAR(191) NULL;

-- Step 2: 创建userId索引
CREATE INDEX `Project_userId_idx` ON `project`(`userId`);

-- Step 3: 为现有项目分配默认用户（如果有数据）
-- 注意：这里需要根据实际情况调整
-- 选项1：如果有默认用户，使用该用户ID
-- 选项2：如果没有数据，跳过此步骤
-- 选项3：手动为每个项目分配所有者

-- 检查是否有现有项目数据
-- 如果有，需要手动为这些项目分配userId
-- UPDATE `project` SET `userId` = 'default-user-id' WHERE `userId` IS NULL;

-- Step 4: 在所有现有项目都有userId后，将字段设为NOT NULL
-- 注意：只有在确保所有项目都有userId后才执行此步骤
-- ALTER TABLE `project` MODIFY COLUMN `userId` VARCHAR(191) NOT NULL;

-- Step 5: 添加外键约束
-- 注意：只有在userId字段为NOT NULL后才添加外键
-- ALTER TABLE `project` ADD CONSTRAINT `Project_userId_fkey` 
--   FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
