# Implementation Plan: Project Management System

## Overview

本实现计划将项目管理系统分解为离散的编码任务。该功能使用户能够创建和管理项目，每个项目包含独立的知识图谱。实现遵循增量方法：数据库架构 → API 路由 → React 组件 → 集成测试。

## Tasks

- [ ] 1. 扩展数据库架构
  - [x] 1.1 更新 Prisma schema 添加 Project 模型
    - 在 `prisma/schema.prisma` 中添加 Project 模型定义
    - 添加 Project 与 Node 的一对多关系
    - 添加 Project 与 Edge 的一对多关系
    - 在 Node 模型中添加 projectId 字段和关系
    - 在 Edge 模型中添加 projectId 字段和关系
    - 添加必要的索引（projectId, createdAt）
    - 配置级联删除（onDelete: Cascade）
    - _Requirements: 3.1, 3.2, 3.3, 4.4, 5.3, 8.2, 8.3, 8.4_

  - [ ] 1.2 编写 schema 验证单元测试
    - 测试 Project 模型字段定义
    - 测试关系配置
    - 测试索引配置
    - _Requirements: 3.1, 3.2_

  - [x] 1.3 创建并应用数据库迁移
    - 运行 `npx prisma migrate dev --name add_project_model`
    - 验证迁移文件生成正确
    - 测试迁移在开发数据库上成功应用
    - _Requirements: 1.3, 3.1, 3.2_

  - [x] 1.4 生成 Prisma Client
    - 运行 `npx prisma generate`
    - 验证 TypeScript 类型生成正确
    - _Requirements: 1.3_

- [ ] 2. 实现项目 API 路由
  - [x] 2.1 创建 GET /api/projects 路由
    - 创建 `app/api/projects/route.ts` 文件
    - 实现 GET 处理器，从数据库查询所有项目
    - 按创建时间降序排序
    - 返回项目列表 JSON
    - 添加错误处理（数据库连接失败）
    - _Requirements: 2.1, 9.2_

  - [ ] 2.2 编写项目列表查询属性测试
    - **Property 4: 项目列表完整性**
    - **Validates: Requirements 2.1**

  - [x] 2.3 创建 POST /api/projects 路由
    - 在 `app/api/projects/route.ts` 中实现 POST 处理器
    - 解析请求体（name, description）
    - 验证项目名称不为空且不是纯空白字符
    - 使用 Prisma 创建项目记录
    - 返回创建的项目 JSON（状态码 201）
    - 添加验证错误处理（400）
    - 添加数据库错误处理（500）
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 2.4 编写项目名称验证属性测试
    - **Property 1: 项目名称验证**
    - **Validates: Requirements 1.2**

  - [ ] 2.5 编写项目创建往返属性测试
    - **Property 2: 项目创建往返一致性**
    - **Validates: Requirements 1.3, 1.5**

  - [ ] 2.6 编写项目 ID 唯一性属性测试
    - **Property 3: 项目 ID 唯一性**
    - **Validates: Requirements 1.4**

  - [x] 2.7 创建 GET /api/projects/[id] 路由
    - 创建 `app/api/projects/[id]/route.ts` 文件
    - 实现 GET 处理器，查询指定项目
    - 使用 Prisma include 加载关联的 nodes 和 edges
    - 返回项目及其数据 JSON
    - 添加 404 错误处理（项目不存在）
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ] 2.8 编写项目数据加载属性测试
    - **Property 17: 项目数据加载完整性**
    - **Validates: Requirements 6.1, 6.2**

  - [x] 2.9 创建 DELETE /api/projects/[id] 路由
    - 在 `app/api/projects/[id]/route.ts` 中实现 DELETE 处理器
    - 查询项目的所有节点，收集 imageUrl
    - 使用 Prisma 删除项目（级联删除节点和边）
    - 批量删除 Blob 存储中的图片文件
    - 返回删除统计信息 JSON
    - 添加错误处理和日志记录
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 2.10 编写项目删除级联属性测试
    - **Property 20: 项目删除级联完整性**
    - **Validates: Requirements 8.2, 8.3, 8.4**

  - [ ] 2.11 编写项目删除文件清理属性测试
    - **Property 21: 项目删除时清理所有 Blob 文件**
    - **Validates: Requirements 8.5**

- [ ] 3. Checkpoint - 验证项目 API
  - 使用 Postman 或 curl 测试所有项目 API 端点
  - 验证创建、查询、删除功能正常
  - 确保错误处理正确
  - 如有问题，询问用户

- [ ] 4. 扩展节点 API 支持项目关联
  - [x] 4.1 创建 POST /api/projects/[id]/nodes 路由
    - 创建 `app/api/projects/[id]/nodes/route.ts` 文件
    - 实现 POST 处理器，在指定项目中创建节点
    - 从 URL 参数获取 projectId
    - 创建节点时设置 projectId 字段
    - 使用事务更新项目的 nodeCount
    - 返回创建的节点 JSON
    - _Requirements: 3.1, 4.1_

  - [ ] 4.2 编写节点项目关联属性测试
    - **Property 6: 节点项目关联**
    - **Validates: Requirements 3.1**

  - [ ] 4.3 编写节点数据往返属性测试
    - **Property 10: 节点数据往返一致性**
    - **Validates: Requirements 4.1, 4.3**

  - [x] 4.4 创建 GET /api/projects/[id]/nodes 路由
    - 在 `app/api/projects/[id]/nodes/route.ts` 中实现 GET 处理器
    - 查询指定项目的所有节点（WHERE projectId = id）
    - 返回节点列表 JSON
    - _Requirements: 3.3, 6.1_

  - [ ] 4.5 编写项目数据隔离属性测试
    - **Property 8: 项目数据隔离**
    - **Validates: Requirements 3.3**

  - [ ] 4.6 更新现有 DELETE /api/nodes/[id] 路由
    - 修改 `app/api/nodes/[id]/route.ts` 文件
    - 在删除节点前，查询节点的 imageUrl
    - 删除节点后，如果有 imageUrl，从 Blob 删除文件
    - 使用事务确保节点和边同时删除
    - 更新项目的 nodeCount
    - _Requirements: 4.4, 4.5, 5.3_

  - [ ] 4.7 编写节点删除完整性属性测试
    - **Property 12: 节点删除完整性**
    - **Validates: Requirements 4.4, 5.3**

  - [ ] 4.8 编写节点删除文件清理属性测试
    - **Property 13: 节点删除时清理 Blob 文件**
    - **Validates: Requirements 4.5, 10.5**

- [ ] 5. 扩展边 API 支持项目关联
  - [x] 5.1 创建 POST /api/projects/[id]/edges 路由
    - 创建 `app/api/projects/[id]/edges/route.ts` 文件
    - 实现 POST 处理器，在指定项目中创建边
    - 验证 fromNodeId 和 toNodeId 存在于数据库
    - 验证两个节点都属于当前项目
    - 创建边时设置 projectId 字段
    - 使用事务更新项目的 edgeCount
    - 返回创建的边 JSON
    - _Requirements: 3.2, 5.1, 5.4, 7.2_

  - [ ] 5.2 编写边项目关联属性测试
    - **Property 7: 边项目关联**
    - **Validates: Requirements 3.2**

  - [ ] 5.3 编写边创建节点验证属性测试
    - **Property 16: 边创建时节点存在性验证**
    - **Validates: Requirements 5.4, 7.2**

  - [ ] 5.4 编写边数据往返属性测试
    - **Property 14: 边数据往返一致性**
    - **Validates: Requirements 5.1**

  - [x] 5.5 创建 GET /api/projects/[id]/edges 路由
    - 在 `app/api/projects/[id]/edges/route.ts` 中实现 GET 处理器
    - 查询指定项目的所有边（WHERE projectId = id）
    - 返回边列表 JSON
    - _Requirements: 3.3, 6.2_

  - [ ] 5.6 更新现有 DELETE /api/edges/[id] 路由
    - 修改 `app/api/edges/[id]/route.ts` 文件
    - 删除边后更新项目的 edgeCount
    - _Requirements: 5.2_

  - [ ] 5.7 编写边删除完整性属性测试
    - **Property 15: 边删除完整性**
    - **Validates: Requirements 5.2**

- [ ] 6. Checkpoint - 验证节点和边 API
  - 测试在项目上下文中创建节点和边
  - 验证数据隔离（不同项目的数据不混淆）
  - 验证级联删除（删除节点时边也被删除）
  - 如有问题，询问用户

- [ ] 7. 扩展上传 API 支持项目
  - [ ] 7.1 更新 POST /api/upload 路由
    - 修改 `app/api/upload/route.ts` 文件
    - 添加 projectId 参数到 formData
    - 修改文件路径为 `projects/${projectId}/nodes/${nodeId}/...`
    - 验证文件类型（仅支持图片）
    - 验证文件大小（最大 5MB）
    - 返回上传的 URL
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 7.2 编写文件类型验证属性测试
    - **Property 23: 文件类型验证**
    - **Validates: Requirements 10.1**

  - [ ] 7.3 编写上传成功 URL 返回属性测试
    - **Property 24: 上传成功返回 URL**
    - **Validates: Requirements 10.2, 10.3**

  - [ ] 7.4 创建 DELETE /api/upload/delete 路由（如果不存在）
    - 创建或更新 `app/api/upload/delete/route.ts` 文件
    - 实现 DELETE 处理器，接收 URL 参数
    - 使用 Vercel Blob SDK 删除文件
    - 返回成功响应
    - 添加错误处理
    - _Requirements: 4.5, 8.5_

- [ ] 8. 创建 React 组件
  - [ ] 8.1 创建 ProjectContext
    - 创建 `lib/ProjectContext.tsx` 文件
    - 定义 ProjectContextValue 接口
    - 实现 ProjectProvider 组件
    - 提供 currentProjectId, currentProject, loadProject 方法
    - 使用 useState 管理状态
    - _Requirements: 3.4_

  - [ ] 8.2 创建 ProjectList 组件
    - 创建 `components/ProjectList.tsx` 文件
    - 使用 useEffect 从 API 加载项目列表
    - 渲染项目卡片网格
    - 每个卡片显示：名称、描述、节点数、边数、创建时间
    - 添加点击处理器，导航到项目详情
    - 处理加载状态和空状态
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 8.3 编写项目列表渲染属性测试
    - **Property 5: 项目列表渲染完整性**
    - **Validates: Requirements 2.2**

  - [ ] 8.4 创建 CreateProjectModal 组件
    - 创建 `components/CreateProjectModal.tsx` 文件
    - 实现模态框 UI（使用现有的模态框样式）
    - 添加表单：项目名称输入、描述输入
    - 实现客户端验证（名称不为空）
    - 实现提交处理器，调用 POST /api/projects
    - 显示加载状态和错误消息
    - 成功后关闭模态框并刷新列表
    - _Requirements: 1.1, 1.2_

  - [ ] 8.5 更新主页使用 ProjectList
    - 修改 `app/page.tsx` 文件
    - 导入并渲染 ProjectList 组件
    - 添加"创建项目"按钮
    - 集成 CreateProjectModal
    - _Requirements: 2.1, 2.4_

  - [ ] 8.6 创建项目详情页面
    - 创建 `app/projects/[id]/page.tsx` 文件
    - 使用 ProjectContext 加载项目数据
    - 渲染 KnowledgeGraph 组件，传入项目的节点和边
    - 添加返回按钮导航到主页
    - 处理加载状态和错误状态
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ] 8.7 编写数据加载渲染属性测试
    - **Property 19: 数据加载成功后渲染**
    - **Validates: Requirements 6.5**

- [ ] 9. 更新现有组件支持项目
  - [ ] 9.1 更新 KnowledgeGraph 组件
    - 修改 `components/KnowledgeGraph.tsx` 文件
    - 从 ProjectContext 获取 currentProjectId
    - 修改节点创建 API 调用为 `/api/projects/${projectId}/nodes`
    - 修改边创建 API 调用为 `/api/projects/${projectId}/edges`
    - 确保所有数据操作都在项目上下文中
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 9.2 更新 AddNodeModal 组件
    - 修改 `components/AddNodeModal.tsx` 文件
    - 从 ProjectContext 获取 currentProjectId
    - 修改图片上传时传递 projectId 参数
    - 更新节点创建 API 端点
    - _Requirements: 3.1, 4.2_

  - [ ] 9.3 编写图片上传 URL 保存属性测试
    - **Property 11: 图片上传和 URL 保存**
    - **Validates: Requirements 4.2**

  - [ ] 9.3 更新 WorkflowCanvas 组件
    - 修改 `components/WorkflowCanvas.tsx` 文件
    - 从 URL 参数或 ProjectContext 获取 projectId
    - 修改节点和边的 API 调用使用项目端点
    - _Requirements: 3.1, 3.2_

- [ ] 10. 添加项目删除功能
  - [ ] 10.1 在 ProjectList 添加删除按钮
    - 修改 `components/ProjectList.tsx` 文件
    - 在每个项目卡片添加删除图标按钮
    - 点击时显示确认对话框
    - 确认后调用 DELETE /api/projects/[id]
    - 删除成功后刷新项目列表
    - 显示删除进度和结果
    - _Requirements: 8.1, 8.6_

  - [ ] 10.2 创建确认对话框组件
    - 创建 `components/ConfirmDialog.tsx` 文件
    - 实现通用的确认对话框
    - 支持自定义标题、消息、确认/取消按钮
    - _Requirements: 8.1_

- [ ] 11. Checkpoint - 端到端测试
  - 测试完整工作流：创建项目 → 添加节点 → 创建边 → 删除项目
  - 测试项目切换和数据隔离
  - 测试图片上传和删除
  - 验证所有 UI 交互正常
  - 如有问题，询问用户

- [ ] 12. 添加错误处理和用户反馈
  - [ ] 12.1 创建 Toast 通知组件
    - 创建 `components/Toast.tsx` 文件
    - 实现 Toast 通知系统（成功、错误、警告）
    - 支持自动消失和手动关闭
    - _Requirements: 6.4, 7.4, 9.2_

  - [ ] 12.2 集成 Toast 到所有 API 调用
    - 在项目创建、删除时显示 Toast
    - 在节点、边创建时显示 Toast
    - 在上传成功/失败时显示 Toast
    - 在数据加载失败时显示 Toast
    - _Requirements: 6.4, 7.4, 10.4_

  - [ ] 12.3 添加加载状态指示器
    - 在数据加载时显示 Spinner
    - 在 API 请求时禁用按钮
    - 添加骨架屏（Skeleton）到项目列表
    - _Requirements: 6.4_

- [ ] 13. 性能优化
  - [ ] 13.1 添加项目列表分页
    - 修改 GET /api/projects 支持分页参数
    - 在 ProjectList 组件添加分页控件
    - 实现"加载更多"或页码导航
    - _Requirements: 2.1_

  - [ ] 13.2 优化图片加载
    - 使用 Next.js Image 组件
    - 添加图片懒加载
    - 添加图片加载占位符
    - _Requirements: 6.3_

  - [ ] 13.3 编写图片 URL 有效性属性测试
    - **Property 18: 图片 URL 有效性**
    - **Validates: Requirements 6.3**

  - [ ] 13.4 添加数据库查询优化
    - 在 Prisma 查询中使用 select 限制返回字段
    - 添加适当的索引
    - 使用 Prisma 的连接池配置
    - _Requirements: 9.3_

  - [ ] 13.5 编写 API 连接清理属性测试
    - **Property 22: API 请求后连接清理**
    - **Validates: Requirements 9.3**

- [ ] 14. 编写集成测试
  - [ ] 14.1 编写完整工作流集成测试
    - 测试：创建项目 → 添加节点 → 创建边 → 查询数据 → 删除项目
    - 验证每一步的数据正确性
    - _Requirements: All_

  - [ ] 14.2 编写项目切换集成测试
    - 创建多个项目
    - 在不同项目间切换
    - 验证数据隔离
    - _Requirements: 3.3, 3.4_

  - [ ] 14.3 编写文件上传流程集成测试
    - 上传图片 → 创建节点 → 验证 URL → 删除节点 → 验证文件清理
    - _Requirements: 4.2, 4.5, 10.1, 10.2, 10.3_

  - [ ] 14.4 编写错误恢复集成测试
    - 模拟上传失败，验证数据库回滚
    - 模拟数据库连接失败，验证错误处理
    - _Requirements: 7.4, 9.2_

- [ ] 15. 最终 Checkpoint - 确保所有测试通过
  - 运行所有单元测试
  - 运行所有属性测试
  - 运行所有集成测试
  - 修复任何失败的测试
  - 确保代码质量和覆盖率
  - 如有问题，询问用户

## Notes

- 每个任务都引用了具体的需求以便追溯
- Checkpoint 确保增量验证
- 属性测试使用 fast-check 库验证通用正确性属性
- 单元测试验证具体示例和边界情况
- 所有坐标计算必须考虑画布偏移和缩放变换
- 连接状态必须正确清理以防止内存泄漏
