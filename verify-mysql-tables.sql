-- =====================================================
-- MySQL 数据库表验证脚本
-- 用于检查表是否成功创建
-- =====================================================

-- 1. 选择数据库
USE neondb;

-- 2. 显示所有表
SHOW TABLES;

-- 3. 显示每个表的结构
SHOW CREATE TABLE Project;
SHOW CREATE TABLE Graph;
SHOW CREATE TABLE Node;
SHOW CREATE TABLE Edge;
SHOW CREATE TABLE User;
SHOW CREATE TABLE SearchHistory;

-- 4. 显示表的详细信息
DESCRIBE Project;
DESCRIBE Graph;
DESCRIBE Node;
DESCRIBE Edge;
DESCRIBE User;
DESCRIBE SearchHistory;

-- 5. 统计每个表的记录数
SELECT 'Project' as TableName, COUNT(*) as RecordCount FROM Project
UNION ALL
SELECT 'Graph', COUNT(*) FROM Graph
UNION ALL
SELECT 'Node', COUNT(*) FROM Node
UNION ALL
SELECT 'Edge', COUNT(*) FROM Edge
UNION ALL
SELECT 'User', COUNT(*) FROM User
UNION ALL
SELECT 'SearchHistory', COUNT(*) FROM SearchHistory;
