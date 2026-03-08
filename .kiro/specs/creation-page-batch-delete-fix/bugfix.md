# Bugfix Requirements Document

## Introduction

在 localhost:3000/creation 页面执行批量删除项目操作时，删除功能失败。根本原因是 `app/api/projects/batch-delete/route.ts` 文件中的 Prisma 查询使用了错误的关系字段名称。在第 145-156 行的 `include` 语句中使用了单数形式 `node` 和 `edge`，但在第 167-169 行访问数据时使用了复数形式 `project.nodes` 和 `project.edges`。根据 `prisma/schema.prisma`，Project 模型的关系字段名称是 `nodes` 和 `edges`（复数形式），导致查询返回的数据结构与代码访问不匹配，从而引发删除失败。

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN 用户在 creation 页面选择多个项目并点击"确认删除"按钮 THEN 系统显示"删除失败"错误消息

1.2 WHEN deleteProject 函数执行 Prisma 查询时使用 `include: { node: {...}, edge: {...} }` THEN 查询返回的 project 对象包含 `project.node` 和 `project.edge` 字段（单数）

1.3 WHEN 代码尝试访问 `project.nodes.length` 和 `project.edges.length` THEN 系统抛出运行时错误，因为这些属性未定义（undefined）

1.4 WHEN 批量删除操作失败 THEN 用户选择的项目未被删除，数据库保持不变

### Expected Behavior (Correct)

2.1 WHEN 用户在 creation 页面选择多个项目并点击"确认删除"按钮 THEN 系统应成功删除所有选中的项目及其关联数据

2.2 WHEN deleteProject 函数执行 Prisma 查询时 THEN 系统应使用正确的字段名 `include: { nodes: {...}, edges: {...} }`（复数形式）

2.3 WHEN 代码访问 `project.nodes.length` 和 `project.edges.length` THEN 系统应正确获取节点和边的数量，不抛出错误

2.4 WHEN 批量删除操作成功 THEN 系统应返回成功响应，包含删除的项目数量和详细信息

### Unchanged Behavior (Regression Prevention)

3.1 WHEN 用户提供无效的项目ID数组（空数组或非字符串ID）THEN 系统应继续返回 400 错误响应

3.2 WHEN 用户尝试删除不存在的项目 THEN 系统应继续返回相应的错误信息"项目不存在"

3.3 WHEN 删除项目时需要清理 Blob 文件 THEN 系统应继续尝试删除关联的图片、视频等文件

3.4 WHEN 单个项目删除失败 THEN 系统应继续使用 Promise.allSettled 确保其他项目的删除操作不受影响

3.5 WHEN 批量删除完成后 THEN 系统应继续返回包含成功和失败统计的详细响应
