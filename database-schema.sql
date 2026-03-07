-- =====================================================
-- 3D Knowledge Graph Database Schema
-- 完整的数据库结构导出文件
-- 适用于 MySQL 数据库 (兼容 MySQL 5.7+)
-- 生成时间: 2026-03-06
-- =====================================================

-- 设置字符集和排序规则
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 删除已存在的表（如果需要重建）
-- 注意：这将删除所有数据，请谨慎使用
DROP TABLE IF EXISTS `SearchHistory`;
DROP TABLE IF EXISTS `User`;
DROP TABLE IF EXISTS `Edge`;
DROP TABLE IF EXISTS `Node`;
DROP TABLE IF EXISTS `Graph`;
DROP TABLE IF EXISTS `Project`;

-- =====================================================
-- 1. Project 表 - 项目管理
-- =====================================================
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

-- =====================================================
-- 2. Graph 表 - 知识图谱
-- =====================================================
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

-- =====================================================
-- 3. Node 表 - 知识图谱节点
-- =====================================================
CREATE TABLE `Node` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `content` LONGTEXT DEFAULT NULL,
    `metadata` TEXT DEFAULT NULL,
    
    -- 3D 位置坐标
    `x` DOUBLE NOT NULL DEFAULT 0,
    `y` DOUBLE NOT NULL DEFAULT 0,
    `z` DOUBLE NOT NULL DEFAULT 0,
    
    -- 视觉属性
    `color` VARCHAR(50) NOT NULL DEFAULT '#3b82f6',
    `textColor` VARCHAR(50) NOT NULL DEFAULT '#FFFFFF',
    `shape` VARCHAR(50) NOT NULL DEFAULT 'sphere',
    `size` DOUBLE NOT NULL DEFAULT 1.0,
    `opacity` DOUBLE NOT NULL DEFAULT 1.0,
    `isGlowing` TINYINT(1) NOT NULL DEFAULT 0,
    
    -- 媒体资源 URL
    `imageUrl` TEXT DEFAULT NULL,
    `videoUrl` TEXT DEFAULT NULL,
    `iconUrl` TEXT DEFAULT NULL,
    `image` TEXT DEFAULT NULL,
    `video` TEXT DEFAULT NULL,
    
    -- 文档相关
    `documentId` VARCHAR(191) DEFAULT NULL,
    `chunkIndex` INT DEFAULT NULL,
    `coverUrl` TEXT DEFAULT NULL,
    
    -- 向量嵌入（用于语义搜索）
    `embedding` TEXT DEFAULT NULL,
    
    -- 标签和分类
    `tags` TEXT DEFAULT NULL,
    `category` VARCHAR(100) DEFAULT NULL,
    
    -- 项目和图谱关联
    `projectId` VARCHAR(191) DEFAULT NULL,
    `graphId` VARCHAR(191) DEFAULT NULL,
    
    -- 时间戳
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

-- =====================================================
-- 4. Edge 表 - 节点之间的关系边
-- =====================================================
CREATE TABLE `Edge` (
    `id` VARCHAR(191) NOT NULL,
    `fromNodeId` VARCHAR(191) NOT NULL,
    `toNodeId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    
    -- 关系属性
    `properties` TEXT DEFAULT NULL,
    `bidirectional` TINYINT(1) NOT NULL DEFAULT 0,
    
    -- 视觉属性
    `color` VARCHAR(50) DEFAULT NULL,
    `style` VARCHAR(50) DEFAULT NULL,
    
    -- 项目和图谱关联
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

-- =====================================================
-- 5. User 表 - 用户认证和管理
-- =====================================================
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

-- =====================================================
-- 6. SearchHistory 表 - 搜索历史记录
-- =====================================================
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

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 数据库结构说明
-- =====================================================

-- 表关系说明：
-- 1. Project (1) -> (N) Graph: 一个项目可以包含多个图谱
-- 2. Project (1) -> (N) Node: 一个项目可以包含多个节点
-- 3. Project (1) -> (N) Edge: 一个项目可以包含多个边
-- 4. Graph (1) -> (N) Node: 一个图谱可以包含多个节点
-- 5. Graph (1) -> (N) Edge: 一个图谱可以包含多个边
-- 6. Node (1) -> (N) Edge: 一个节点可以有多条出边和入边
-- 7. Node (1) -> (N) Node: 文档节点可以包含多个块节点（自引用关系）

-- 字段说明：
-- Node.type: 节点类型，如 document, chunk, concept, entity 等
-- Node.metadata: JSON 格式的元数据
-- Node.embedding: JSON 数组格式的向量嵌入，用于语义搜索
-- Node.tags: JSON 数组格式的标签
-- Edge.label: 关系类型，如 PART_OF, RELATES_TO, REFERENCES 等
-- Edge.properties: JSON 格式的额外属性
-- TINYINT(1): 用于表示布尔值，0=false, 1=true

-- 级联删除说明：
-- 1. 删除 Project 时，会级联删除关联的 Graph, Node, Edge
-- 2. 删除 Graph 时，会级联删除关联的 Node, Edge
-- 3. 删除 Node 时，会级联删除关联的 Edge 和子节点（chunks）

-- =====================================================
-- 使用说明
-- =====================================================

-- 1. 在 MySQL 命令行中执行：
--    mysql -u root -p neondb < database-schema.sql
--    或者
--    mysql -u root -p
--    USE neondb;
--    SOURCE /path/to/database-schema.sql;

-- 2. 在 Navicat / MySQL Workbench / phpMyAdmin 中：
--    - 选择 neondb 数据库
--    - 打开 SQL 编辑器
--    - 粘贴整个文件内容
--    - 点击执行

-- 3. 验证表是否创建成功：
--    SHOW TABLES;
--    DESCRIBE Project;
--    DESCRIBE Graph;
--    DESCRIBE Node;
--    DESCRIBE Edge;
--    DESCRIBE User;
--    DESCRIBE SearchHistory;

-- 4. 如果需要迁移现有数据：
--    mysqldump -u root -p source_db --no-create-info > data.sql
--    mysql -u root -p neondb < database-schema.sql
--    mysql -u root -p neondb < data.sql

-- 5. MySQL 版本要求：
--    - MySQL 5.7 或更高版本（支持 DATETIME(3) 毫秒精度）
--    - 推荐使用 MySQL 8.0 或更高版本

-- 6. 字符集说明：
--    - 使用 utf8mb4 字符集，支持完整的 Unicode 字符（包括 emoji）
--    - 排序规则使用 utf8mb4_unicode_ci

-- 7. 常见问题排查：
--    - 如果提示外键错误，检查是否先创建了父表
--    - 如果提示字符集错误，确保 MySQL 支持 utf8mb4
--    - 如果提示 DATETIME(3) 错误，升级到 MySQL 5.7+

-- =====================================================
-- 完成
-- =====================================================
