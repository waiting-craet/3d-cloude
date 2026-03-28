# 数据库迁移指南

本目录包含2D到3D布局优化功能的数据库迁移脚本。

## 迁移文件

### 001_add_3d_layout_fields.sql

此迁移脚本为系统添加3D布局支持，包括：

1. **扩展Node表**
   - 添加 `x2d`, `y2d` 字段：保存原始2D坐标
   - 添加 `x3d`, `y3d`, `z3d` 字段：保存转换后的3D坐标
   - 添加 `layout_version` 字段：跟踪布局版本
   - 添加 `last_layout_update` 字段：记录最后更新时间

2. **创建layout_configs表**
   - 存储每个图谱的布局策略和配置参数
   - 记录布局质量分数

3. **创建layout_history表（可选）**
   - 记录节点位置的历史版本
   - 支持布局回退功能

## 执行迁移

### 方法1：MySQL命令行

```bash
mysql -u root -p neondb < migrations/001_add_3d_layout_fields.sql
```

### 方法2：MySQL客户端工具

在Navicat、MySQL Workbench或phpMyAdmin中：

1. 选择 `neondb` 数据库
2. 打开SQL编辑器
3. 复制并粘贴迁移脚本内容
4. 执行脚本

## 验证迁移

执行以下SQL命令验证迁移是否成功：

```sql
-- 检查Node表的新字段
DESCRIBE Node;

-- 检查新表是否创建
SHOW TABLES LIKE 'layout_%';

-- 验证数据迁移
SELECT COUNT(*) FROM Node WHERE x2d IS NOT NULL;

-- 查看layout_configs表结构
DESCRIBE layout_configs;

-- 查看layout_history表结构
DESCRIBE layout_history;
```

## 回滚迁移

如果需要回滚此迁移，执行以下SQL：

```sql
-- 删除Node表的新字段
ALTER TABLE `Node` DROP COLUMN `x2d`;
ALTER TABLE `Node` DROP COLUMN `y2d`;
ALTER TABLE `Node` DROP COLUMN `x3d`;
ALTER TABLE `Node` DROP COLUMN `y3d`;
ALTER TABLE `Node` DROP COLUMN `z3d`;
ALTER TABLE `Node` DROP COLUMN `layout_version`;
ALTER TABLE `Node` DROP COLUMN `last_layout_update`;

-- 删除索引
DROP INDEX `Node_layout_version_idx` ON `Node`;
DROP INDEX `Node_last_layout_update_idx` ON `Node`;

-- 删除新表
DROP TABLE IF EXISTS `layout_history`;
DROP TABLE IF EXISTS `layout_configs`;
```

## 数据迁移说明

迁移脚本会自动将现有的 `x`, `y` 坐标复制到 `x2d`, `y2d` 字段，保留原始的2D位置信息。

3D坐标字段（`x3d`, `y3d`, `z3d`）初始为NULL，将在首次执行3D转换时填充。

## 注意事项

1. **备份数据**：执行迁移前请备份数据库
2. **测试环境**：建议先在测试环境中执行迁移
3. **性能影响**：迁移过程中会锁定表，建议在低峰期执行
4. **外键约束**：脚本会临时禁用外键检查，执行完成后自动恢复

## 相关文件

- `/lib/layout/types.ts` - TypeScript类型定义
- `/lib/layout/LayoutEngine.ts` - 布局引擎实现（待创建）
- `/.kiro/specs/2d-to-3d-layout-optimization/` - 完整的规格文档
