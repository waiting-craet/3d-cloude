-- =====================================================
-- 分步创建数据库表（用于调试）
-- 请在 Navicat 中逐步执行每个部分
-- =====================================================

-- 步骤 0: 选择数据库
USE neondb;

-- 步骤 1: 设置环境
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 步骤 2: 清理旧表（如果存在）
DROP TABLE IF EXISTS `SearchHistory`;
DROP TABLE IF EXISTS `User`;
DROP TABLE IF EXISTS `Edge`;
DROP TABLE IF EXISTS `Node`;
DROP TABLE IF EXISTS `Graph`;
DROP TABLE IF EXISTS `Project`;

-- 验证：查看当前表列表（应该为空或不包含上述表）
SHOW TABLES;

-- 步骤 3: 创建 Project 表
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `settings` TEXT,
    `nodeCount` INT NOT NULL DEFAULT 0,
    `edgeCount` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `Project_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 验证 Project 表
SELECT 'Project 表创建成功' AS Status;
DESCRIBE Project;

-- 步骤 4: 创建 Graph 表
CREATE TABLE `Graph` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `settings` TEXT,
    `isPublic` TINYINT(1) NOT NULL DEFAULT 0,
    `nodeCount` INT NOT NULL DEFAULT 0,
    `edgeCount` INT NOT NULL DEFAULT 0,
    `projectId` VARCHAR(191) DEFAULT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `Graph_createdAt_idx` (`createdAt`),
    INDEX `Graph_projectId_idx` (`projectId`),
    CONSTRAINT `Graph_projectId_fkey` 
        FOREIGN KEY (`projectId`) 
        REFERENCES `Project`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 验证 Graph 表
SELECT 'Graph 表创建成功' AS Status;
DESCRIBE Graph;

-- 步骤 5: 创建 Node 表
CREATE TABLE `Node` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `content` LONGTEXT DEFAULT NULL,
    `metadata` TEXT DEFAULT NULL,
    `x` DOUBLE NOT NULL DEFAULT 0,
    `y` DOUBLE NOT NULL DEFAULT 0,
    `z` DOUBLE NOT NULL DEFAULT 0,
    `color` VARCHAR(50) NOT NULL DEFAULT '#3b82f6',
    `textColor` VARCHAR(50) NOT NULL DEFAULT '#FFFFFF',
    `shape` VARCHAR(50) NOT NULL DEFAULT 'sphere',
    `size` DOUBLE NOT NULL DEFAULT 1.0,
    `opacity` DOUBLE NOT NULL DEFAULT 1.0,
    `isGlowing` TINYINT(1) NOT NULL DEFAULT 0,
    `imageUrl` TEXT DEFAULT NULL,
    `videoUrl` TEXT DEFAULT NULL,
    `iconUrl` TEXT DEFAULT NULL,
    `image` TEXT DEFAULT NULL,
    `video` TEXT DEFAULT NULL,
    `documentId` VARCHAR(191) DEFAULT NULL,
    `chunkIndex` INT DEFAULT NULL,
    `coverUrl` TEXT DEFAULT NULL,
    `embedding` TEXT DEFAULT NULL,
    `tags` TEXT DEFAULT NULL,
    `category` VARCHAR(100) DEFAULT NULL,
    `projectId` VARCHAR(191) DEFAULT NULL,
    `graphId` VARCHAR(191) DEFAULT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `Node_type_idx` (`type`),
    INDEX `Node_documentId_idx` (`documentId`),
    INDEX `Node_category_idx` (`category`),
    INDEX `Node_createdAt_idx` (`createdAt`),
    INDEX `Node_projectId_idx` (`projectId`),
    INDEX `Node_graphId_idx` (`graphId`),
    CONSTRAINT `Node_projectId_fkey` 
        FOREIGN KEY (`projectId`) 
        REFERENCES `Project`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `Node_graphId_fkey` 
        FOREIGN KEY (`graphId`) 
        REFERENCES `Graph`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `Node_documentId_fkey` 
        FOREIGN KEY (`documentId`) 
        REFERENCES `Node`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 验证 Node 表
SELECT 'Node 表创建成功' AS Status;
DESCRIBE Node;

-- 步骤 6: 创建 Edge 表
CREATE TABLE `Edge` (
    `id` VARCHAR(191) NOT NULL,
    `fromNodeId` VARCHAR(191) NOT NULL,
    `toNodeId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `properties` TEXT DEFAULT NULL,
    `bidirectional` TINYINT(1) NOT NULL DEFAULT 0,
    `color` VARCHAR(50) DEFAULT NULL,
    `style` VARCHAR(50) DEFAULT NULL,
    `projectId` VARCHAR(191) DEFAULT NULL,
    `graphId` VARCHAR(191) DEFAULT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `Edge_fromNodeId_idx` (`fromNodeId`),
    INDEX `Edge_toNodeId_idx` (`toNodeId`),
    INDEX `Edge_label_idx` (`label`),
    INDEX `Edge_projectId_idx` (`projectId`),
    INDEX `Edge_graphId_idx` (`graphId`),
    CONSTRAINT `Edge_projectId_fkey` 
        FOREIGN KEY (`projectId`) 
        REFERENCES `Project`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `Edge_graphId_fkey` 
        FOREIGN KEY (`graphId`) 
        REFERENCES `Graph`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `Edge_fromNodeId_fkey` 
        FOREIGN KEY (`fromNodeId`) 
        REFERENCES `Node`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `Edge_toNodeId_fkey` 
        FOREIGN KEY (`toNodeId`) 
        REFERENCES `Node`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 验证 Edge 表
SELECT 'Edge 表创建成功' AS Status;
DESCRIBE Edge;

-- 步骤 7: 创建 User 表
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) DEFAULT NULL,
    `password` VARCHAR(255) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) DEFAULT NULL,
    `avatar` TEXT DEFAULT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `User_email_key` (`email`),
    UNIQUE KEY `User_username_key` (`username`),
    INDEX `User_email_idx` (`email`),
    INDEX `User_username_idx` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 验证 User 表
SELECT 'User 表创建成功' AS Status;
DESCRIBE User;

-- 步骤 8: 创建 SearchHistory 表
CREATE TABLE `SearchHistory` (
    `id` VARCHAR(191) NOT NULL,
    `query` VARCHAR(500) NOT NULL,
    `results` TEXT DEFAULT NULL,
    `userId` VARCHAR(191) DEFAULT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `SearchHistory_userId_idx` (`userId`),
    INDEX `SearchHistory_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 验证 SearchHistory 表
SELECT 'SearchHistory 表创建成功' AS Status;
DESCRIBE SearchHistory;

-- 步骤 9: 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 步骤 10: 最终验证 - 显示所有表
SELECT '========== 所有表创建完成 ==========' AS Status;
SHOW TABLES;

-- 显示表的数量
SELECT COUNT(*) AS '创建的表数量' 
FROM information_schema.tables 
WHERE table_schema = 'neondb' 
AND table_name IN ('Project', 'Graph', 'Node', 'Edge', 'User', 'SearchHistory');
