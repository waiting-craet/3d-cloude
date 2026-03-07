-- =====================================================
-- 2D到3D布局优化 - 数据库迁移脚本
-- 迁移编号: 001
-- 创建时间: 2024-01-15
-- 描述: 为Node表添加3D布局相关字段，创建布局配置和历史表
-- =====================================================

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. 扩展 Node 表 - 添加3D布局字段
-- =====================================================

-- 添加2D坐标字段（保留原始2D位置）
ALTER TABLE `Node` 
ADD COLUMN `x2d` DOUBLE DEFAULT NULL COMMENT '原始2D X坐标' AFTER `z`,
ADD COLUMN `y2d` DOUBLE DEFAULT NULL COMMENT '原始2D Y坐标' AFTER `x2d`;

-- 添加3D坐标字段（转换后的3D位置）
ALTER TABLE `Node` 
ADD COLUMN `x3d` DOUBLE DEFAULT NULL COMMENT '转换后的3D X坐标' AFTER `y2d`,
ADD COLUMN `y3d` DOUBLE DEFAULT NULL COMMENT '转换后的3D Y坐标（高度）' AFTER `x3d`,
ADD COLUMN `z3d` DOUBLE DEFAULT NULL COMMENT '转换后的3D Z坐标' AFTER `y3d`;

-- 添加布局版本和更新时间字段
ALTER TABLE `Node` 
ADD COLUMN `layout_version` INT NOT NULL DEFAULT 1 COMMENT '布局版本号' AFTER `z3d`,
ADD COLUMN `last_layout_update` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后布局更新时间' AFTER `layout_version`;

-- 为布局相关字段添加索引以提高查询性能
CREATE INDEX `Node_layout_version_idx` ON `Node`(`layout_version`);
CREATE INDEX `Node_last_layout_update_idx` ON `Node`(`last_layout_update`);

-- =====================================================
-- 2. 创建 layout_configs 表 - 布局配置存储
-- =====================================================

CREATE TABLE IF NOT EXISTS `layout_configs` (
    `id` VARCHAR(191) NOT NULL COMMENT '配置ID',
    `graph_id` VARCHAR(191) NOT NULL COMMENT '关联的图谱ID',
    `strategy` VARCHAR(50) NOT NULL COMMENT '布局策略（hierarchical/radial/force_directed/grid/spherical）',
    `config_json` TEXT NOT NULL COMMENT '配置参数JSON',
    `quality_score` DOUBLE DEFAULT NULL COMMENT '布局质量分数（0-100）',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    PRIMARY KEY (`id`),
    INDEX `layout_configs_graph_id_idx` (`graph_id`),
    INDEX `layout_configs_created_at_idx` (`created_at`),
    
    CONSTRAINT `layout_configs_graph_id_fkey` 
        FOREIGN KEY (`graph_id`) 
        REFERENCES `Graph`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='布局配置表 - 存储每个图谱的布局策略和参数';

-- =====================================================
-- 3. 创建 layout_history 表 - 布局历史记录（可选）
-- =====================================================

CREATE TABLE IF NOT EXISTS `layout_history` (
    `id` VARCHAR(191) NOT NULL COMMENT '历史记录ID',
    `graph_id` VARCHAR(191) NOT NULL COMMENT '关联的图谱ID',
    `node_id` VARCHAR(191) NOT NULL COMMENT '节点ID',
    `x3d` DOUBLE NOT NULL COMMENT '历史3D X坐标',
    `y3d` DOUBLE NOT NULL COMMENT '历史3D Y坐标',
    `z3d` DOUBLE NOT NULL COMMENT '历史3D Z坐标',
    `version` INT NOT NULL COMMENT '布局版本号',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    PRIMARY KEY (`id`),
    INDEX `layout_history_graph_id_idx` (`graph_id`),
    INDEX `layout_history_node_id_idx` (`node_id`),
    INDEX `layout_history_version_idx` (`version`),
    INDEX `layout_history_created_at_idx` (`created_at`),
    
    CONSTRAINT `layout_history_graph_id_fkey` 
        FOREIGN KEY (`graph_id`) 
        REFERENCES `Graph`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT `layout_history_node_id_fkey` 
        FOREIGN KEY (`node_id`) 
        REFERENCES `Node`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='布局历史表 - 记录节点位置的历史版本，用于回退功能';

-- =====================================================
-- 4. 数据迁移 - 将现有x,y,z坐标复制到x2d,y2d
-- =====================================================

-- 将现有的x,y坐标作为2D坐标保存
UPDATE `Node` 
SET `x2d` = `x`, 
    `y2d` = `y`
WHERE `x2d` IS NULL AND `y2d` IS NULL;

-- =====================================================
-- 5. 恢复外键检查
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 迁移说明
-- =====================================================

-- 字段说明：
-- Node.x2d, y2d: 原始的2D坐标，用于保存工作流图谱的平面位置
-- Node.x3d, y3d, z3d: 转换后的3D坐标，用于3D知识图谱显示
-- Node.layout_version: 布局版本号，每次重新布局时递增
-- Node.last_layout_update: 最后一次布局更新的时间戳
-- layout_configs.strategy: 布局策略类型
-- layout_configs.config_json: JSON格式的配置参数，包含heightVariation、minNodeDistance等
-- layout_configs.quality_score: 布局质量评分，范围0-100
-- layout_history: 可选表，用于记录布局历史，支持回退功能

-- 使用说明：
-- 1. 在MySQL命令行中执行：
--    mysql -u root -p neondb < migrations/001_add_3d_layout_fields.sql
--
-- 2. 或在Navicat/MySQL Workbench中：
--    - 选择neondb数据库
--    - 打开SQL编辑器
--    - 粘贴并执行此脚本
--
-- 3. 验证迁移是否成功：
--    DESCRIBE Node;
--    SHOW TABLES LIKE 'layout_%';
--    SELECT COUNT(*) FROM Node WHERE x2d IS NOT NULL;

-- 回滚说明（如需回滚）：
-- ALTER TABLE `Node` DROP COLUMN `x2d`;
-- ALTER TABLE `Node` DROP COLUMN `y2d`;
-- ALTER TABLE `Node` DROP COLUMN `x3d`;
-- ALTER TABLE `Node` DROP COLUMN `y3d`;
-- ALTER TABLE `Node` DROP COLUMN `z3d`;
-- ALTER TABLE `Node` DROP COLUMN `layout_version`;
-- ALTER TABLE `Node` DROP COLUMN `last_layout_update`;
-- DROP TABLE IF EXISTS `layout_history`;
-- DROP TABLE IF EXISTS `layout_configs`;

-- =====================================================
-- 完成
-- =====================================================
