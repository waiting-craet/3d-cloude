-- =====================================================
-- 简化版数据库结构（兼容旧版 MySQL）
-- 如果 DATETIME(3) 不支持，使用此版本
-- =====================================================

USE neondb;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `SearchHistory`;
DROP TABLE IF EXISTS `Edge`;
DROP TABLE IF EXISTS `Node`;
DROP TABLE IF EXISTS `Graph`;
DROP TABLE IF EXISTS `Project`;
DROP TABLE IF EXISTS `User`;

-- User 表（必须先创建，因为 Project 依赖它）
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191),
    `password` VARCHAR(255) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255),
    `avatar` TEXT,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `User_email_key` (`email`),
    UNIQUE KEY `User_username_key` (`username`),
    KEY `User_email_idx` (`email`),
    KEY `User_username_idx` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Project 表
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `settings` TEXT,
    `nodeCount` INT NOT NULL DEFAULT 0,
    `edgeCount` INT NOT NULL DEFAULT 0,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `Project_createdAt_idx` (`createdAt`),
    KEY `Project_userId_idx` (`userId`),
    CONSTRAINT `Project_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Graph 表
CREATE TABLE `Graph` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `settings` TEXT,
    `isPublic` TINYINT(1) NOT NULL DEFAULT 0,
    `nodeCount` INT NOT NULL DEFAULT 0,
    `edgeCount` INT NOT NULL DEFAULT 0,
    `projectId` VARCHAR(191) DEFAULT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `Graph_createdAt_idx` (`createdAt`),
    KEY `Graph_projectId_idx` (`projectId`),
    CONSTRAINT `Graph_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Node 表
CREATE TABLE `Node` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `content` LONGTEXT,
    `metadata` TEXT,
    `x` DOUBLE NOT NULL DEFAULT 0,
    `y` DOUBLE NOT NULL DEFAULT 0,
    `z` DOUBLE NOT NULL DEFAULT 0,
    `color` VARCHAR(50) NOT NULL DEFAULT '#3b82f6',
    `textColor` VARCHAR(50) NOT NULL DEFAULT '#FFFFFF',
    `shape` VARCHAR(50) NOT NULL DEFAULT 'sphere',
    `size` DOUBLE NOT NULL DEFAULT 1.0,
    `opacity` DOUBLE NOT NULL DEFAULT 1.0,
    `isGlowing` TINYINT(1) NOT NULL DEFAULT 0,
    `imageUrl` TEXT,
    `videoUrl` TEXT,
    `iconUrl` TEXT,
    `image` TEXT,
    `video` TEXT,
    `documentId` VARCHAR(191),
    `chunkIndex` INT,
    `coverUrl` TEXT,
    `embedding` TEXT,
    `tags` TEXT,
    `category` VARCHAR(100),
    `projectId` VARCHAR(191),
    `graphId` VARCHAR(191),
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `Node_type_idx` (`type`),
    KEY `Node_documentId_idx` (`documentId`),
    KEY `Node_category_idx` (`category`),
    KEY `Node_createdAt_idx` (`createdAt`),
    KEY `Node_projectId_idx` (`projectId`),
    KEY `Node_graphId_idx` (`graphId`),
    CONSTRAINT `Node_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Node_graphId_fkey` FOREIGN KEY (`graphId`) REFERENCES `Graph`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Node_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Node`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Edge 表
CREATE TABLE `Edge` (
    `id` VARCHAR(191) NOT NULL,
    `fromNodeId` VARCHAR(191) NOT NULL,
    `toNodeId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `properties` TEXT,
    `bidirectional` TINYINT(1) NOT NULL DEFAULT 0,
    `color` VARCHAR(50),
    `style` VARCHAR(50),
    `projectId` VARCHAR(191),
    `graphId` VARCHAR(191),
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `Edge_fromNodeId_idx` (`fromNodeId`),
    KEY `Edge_toNodeId_idx` (`toNodeId`),
    KEY `Edge_label_idx` (`label`),
    KEY `Edge_projectId_idx` (`projectId`),
    KEY `Edge_graphId_idx` (`graphId`),
    CONSTRAINT `Edge_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Edge_graphId_fkey` FOREIGN KEY (`graphId`) REFERENCES `Graph`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Edge_fromNodeId_fkey` FOREIGN KEY (`fromNodeId`) REFERENCES `Node`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Edge_toNodeId_fkey` FOREIGN KEY (`toNodeId`) REFERENCES `Node`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SearchHistory 表
CREATE TABLE `SearchHistory` (
    `id` VARCHAR(191) NOT NULL,
    `query` VARCHAR(500) NOT NULL,
    `results` TEXT,
    `userId` VARCHAR(191),
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `SearchHistory_userId_idx` (`userId`),
    KEY `SearchHistory_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- 验证
SHOW TABLES;
SELECT '所有表创建完成！' AS Status;
