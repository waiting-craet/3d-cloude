# Bugfix Requirements Document

## Introduction

导入功能在成功处理数据后返回 500 错误，错误信息为 "Cannot read properties of undefined (reading 'length')"。根本原因是在构建响应对象时，代码尝试访问不存在的属性 `validatedData.edge.length`，而正确的属性名应该是 `validatedData.edges`（复数形式）。这导致即使导入操作成功完成，用户也会收到错误响应。

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN 导入 API 成功处理文件数据并尝试构建响应对象时 THEN 系统访问 `validatedData.edge.length`（不存在的属性）导致 TypeError

1.2 WHEN 上述 TypeError 发生时 THEN 系统返回 500 Internal Server Error 给客户端，错误信息为 "Cannot read properties of undefined (reading 'length')"

1.3 WHEN 用户收到 500 错误时 THEN 用户认为导入失败，但实际上数据已经成功导入到数据库中

### Expected Behavior (Correct)

2.1 WHEN 导入 API 成功处理文件数据并尝试构建响应对象时 THEN 系统 SHALL 访问 `validatedData.edges.length`（正确的复数形式属性）

2.2 WHEN 系统访问正确的属性名时 THEN 系统 SHALL 成功计算跳过的边数量并返回 200 成功响应

2.3 WHEN 用户收到成功响应时 THEN 响应 SHALL 包含准确的统计信息，包括 `skippedEdges` 字段的正确值

### Unchanged Behavior (Regression Prevention)

3.1 WHEN 导入操作遇到验证错误时 THEN 系统 SHALL CONTINUE TO 返回 400 错误和详细的验证错误信息

3.2 WHEN 导入操作遇到数据库连接错误时 THEN 系统 SHALL CONTINUE TO 返回 500 错误和描述性的连接错误信息

3.3 WHEN 导入操作遇到冗余检测错误时 THEN 系统 SHALL CONTINUE TO 返回 500 错误和描述性的检测错误信息

3.4 WHEN 导入操作成功创建节点和边时 THEN 系统 SHALL CONTINUE TO 正确更新图谱和项目的节点/边计数

3.5 WHEN 导入操作成功完成时 THEN 系统 SHALL CONTINUE TO 返回包含所有统计信息的成功响应（除了 `skippedEdges` 字段的计算方式）
