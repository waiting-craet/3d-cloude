# Implementation Plan: Data Integration System

## Overview

本实现计划将数据集成系统分解为离散的编码任务。该功能建立项目-图谱-节点-边的完整数据关联，将所有数据操作从 localStorage 迁移到云端数据库，确保三维和二维视图的数据同步。实现遵循增量方法：数据库架�?�?API 路由 �?状态管�?�?UI 组件 �?集成测试�?

## Tasks

- [ ] 1. 扩展数据库架�?
  - [ ] 1.1 更新 Prisma schema 添加 Graph 模型和关�?
    - �?`prisma/schema.prisma` 中添�?Graph 模型定义
    - 添加 Graph �?Project 的多对一关系
    - �?Project 模型中添�?graphs 关系
    - �?Node 模型添加 graphId 字段�?graph 关系
    - �?Edge 模型添加 graphId 字段�?graph 关系
    - 添加必要的索引（graphId, projectId�?
    - 配置级联删除（onDelete: Cascade�?
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 1.2 编写数据库架构验证单元测�?
    - 测试 Graph 模型字段定义
    - 测试关联关系配置
    - 测试索引配置
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 1.3 创建并应用数据库迁移
    - 运行 `npx prisma migrate dev --name add_graph_model_and_associations`
    - 验证迁移文件生成正确
    - 测试迁移在开发数据库上成功应�?
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 1.4 生成 Prisma Client
    - 运行 `npx prisma generate`
    - 验证 TypeScript 类型生成正确
    - _Requirements: 1.1_


- [ ] 2. 实现项目管理 API
  - [ ] 2.1 创建 GET /api/projects 路由
    - 创建或更�?`app/api/projects/route.ts` 文件
    - 实现 GET 处理器，查询所有项�?
    - 使用 Prisma 聚合计算每个项目的图谱数�?
    - 按创建时间降序排�?
    - 返回项目列表 JSON（包�?graphCount�?
    - 添加错误处理
    - _Requirements: 2.1, 11.2_

  - [ ] 2.2 编写项目列表查询属性测�?
    - **Property 3: 项目列表查询完整�?*
    - **Validates: Requirements 2.1, 11.2**

  - [ ] 2.3 创建 POST /api/projects 路由
    - �?`app/api/projects/route.ts` 中实�?POST 处理�?
    - 解析请求体（name, description, initialGraphName�?
    - 验证项目名称不为�?
    - 如果提供 initialGraphName，使用事务创建项目和初始图谱
    - 返回创建的项目和图谱 JSON（状态码 201�?
    - 添加验证错误处理�?00�?
    - 添加数据库错误处理（500�?
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 2.4 编写项目创建往返属性测�?
    - **Property 7: 项目创建往返一致�?*
    - **Validates: Requirements 3.1**

  - [ ] 2.5 编写创建操作返回有效 ID 属性测�?
    - **Property 10: 创建操作返回有效 ID**
    - **Validates: Requirements 3.4**

  - [ ] 2.6 创建 GET /api/projects/[id] 路由
    - 创建 `app/api/projects/[id]/route.ts` 文件
    - 实现 GET 处理器，查询指定项目
    - 使用 Prisma include 加载关联�?graphs
    - 返回项目及其图谱列表 JSON
    - 添加 404 错误处理（项目不存在�?
    - _Requirements: 2.2_

  - [ ] 2.7 编写项目图谱查询属性测�?
    - **Property 4: 项目图谱查询完整�?*
    - **Validates: Requirements 2.2**

  - [ ] 2.8 创建 DELETE /api/projects/[id] 路由
    - �?`app/api/projects/[id]/route.ts` 中实�?DELETE 处理�?
    - 查询项目的所有节点，收集 imageUrl
    - 使用 Prisma 删除项目（级联删除图谱、节点和边）
    - 批量删除 Blob 存储中的图片文件
    - 返回删除统计信息 JSON
    - 添加错误处理和日志记�?
    - _Requirements: 1.4_

  - [ ] 2.9 编写项目删除级联属性测�?
    - **Property 1: 项目删除级联完整�?*
    - **Validates: Requirements 1.4, 15.2**


- [ ] 3. 实现图谱管理 API
  - [ ] 3.1 创建 GET /api/projects/[id]/graphs 路由
    - 创建 `app/api/projects/[id]/graphs/route.ts` 文件
    - 实现 GET 处理器，查询指定项目的所有图�?
    - 按创建时间降序排�?
    - 返回图谱列表 JSON
    - 添加 404 错误处理（项目不存在�?
    - _Requirements: 2.2, 10.3_

  - [ ] 3.2 编写图谱查询数据隔离属性测�?
    - **Property 33: 图谱查询数据隔离**
    - **Validates: Requirements 10.3**

  - [ ] 3.3 创建 POST /api/projects/[id]/graphs 路由
    - �?`app/api/projects/[id]/graphs/route.ts` 中实�?POST 处理�?
    - 解析请求体（name, description�?
    - 验证图谱名称不为�?
    - 验证项目存在
    - 创建图谱记录，设�?projectId
    - 返回创建的图�?JSON（状态码 201�?
    - 添加验证错误处理
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ] 3.4 编写图谱创建往返属性测�?
    - **Property 8: 图谱创建往返一致�?*
    - **Validates: Requirements 3.2**

  - [ ] 3.5 编写图谱项目关联属性测�?
    - **Property 9: 图谱项目关联正确�?*
    - **Validates: Requirements 3.3**

  - [ ] 3.6 创建 GET /api/graphs/[id] 路由
    - 创建 `app/api/graphs/[id]/route.ts` 文件
    - 实现 GET 处理器，查询指定图谱
    - 使用 Prisma include 加载关联�?nodes �?edges
    - 返回图谱及其节点和边 JSON
    - 添加 404 错误处理（图谱不存在�?
    - _Requirements: 6.1, 6.2_

  - [ ] 3.7 编写图谱节点查询属性测�?
    - **Property 16: 图谱节点查询完整�?*
    - **Validates: Requirements 6.1**

  - [ ] 3.8 编写图谱边查询属性测�?
    - **Property 17: 图谱边查询完整�?*
    - **Validates: Requirements 6.2**

  - [ ] 3.9 创建 PUT /api/graphs/[id] 路由
    - �?`app/api/graphs/[id]/route.ts` 中实�?PUT 处理�?
    - 支持更新 name, description, nodeCount, edgeCount
    - 返回更新后的图谱 JSON
    - 添加 404 错误处理
    - _Requirements: 9.5_

  - [ ] 3.10 创建 DELETE /api/graphs/[id] 路由
    - �?`app/api/graphs/[id]/route.ts` 中实�?DELETE 处理�?
    - 查询图谱的所有节点，收集 imageUrl
    - 使用事务删除图谱并更新项目统�?
    - 批量删除 Blob 存储中的图片文件
    - 返回删除统计信息 JSON
    - _Requirements: 1.5_

  - [ ] 3.11 编写图谱删除级联属性测�?
    - **Property 2: 图谱删除级联完整�?*
    - **Validates: Requirements 1.5**


- [ ] 4. Checkpoint - 验证项目和图�?API
  - 使用 Postman �?curl 测试所有项目和图谱 API 端点
  - 验证创建、查询、删除功能正�?
  - 验证数据关联正确（图谱关联到项目�?
  - 验证级联删除正常工作
  - 确保错误处理正确
  - 如有问题，询问用�?

- [ ] 5. 扩展节点 API 支持图谱关联
  - [ ] 5.1 创建 GET /api/graphs/[id]/nodes 路由
    - 创建 `app/api/graphs/[id]/nodes/route.ts` 文件
    - 实现 GET 处理器，查询指定图谱的所有节�?
    - WHERE graphId = id
    - 返回节点列表 JSON
    - _Requirements: 6.1, 10.1_

  - [ ] 5.2 编写节点查询数据隔离属性测�?
    - **Property 31: 节点查询数据隔离**
    - **Validates: Requirements 10.1**

  - [ ] 5.3 创建 POST /api/graphs/[id]/nodes 路由
    - �?`app/api/graphs/[id]/nodes/route.ts` 中实�?POST 处理�?
    - 解析请求体（name, type, description, x, y, z, color, size, imageUrl�?
    - 验证图谱存在并获取其 projectId
    - 使用事务�?
      1. 创建节点记录（设�?graphId �?projectId�?
      2. 更新图谱�?nodeCount
      3. 更新项目�?nodeCount
    - 返回创建的节点和更新后的统计信息 JSON
    - _Requirements: 4.1, 4.2, 4.5, 10.4_

  - [ ] 5.4 编写节点项目和图谱关联属性测�?
    - **Property 12: 节点项目和图谱关联正确�?*
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ] 5.5 编写节点创建更新统计属性测�?
    - **Property 13: 节点创建更新图谱统计**
    - **Validates: Requirements 4.5, 9.1**

  - [ ] 5.6 编写节点创建验证属性测�?
    - **Property 34: 节点创建验证项目和图谱存�?*
    - **Validates: Requirements 10.4**

  - [ ] 5.7 更新 PATCH /api/nodes/[id] 路由
    - 修改 `app/api/nodes/[id]/route.ts` 文件
    - 保持现有的更新逻辑
    - 确保可以更新 graphId �?projectId（如果需要）
    - _Requirements: 7.4_

  - [ ] 5.8 编写节点更新往返属性测�?
    - **Property 23: 节点更新往返一致�?*
    - **Validates: Requirements 7.4**

  - [ ] 5.9 更新 DELETE /api/nodes/[id] 路由
    - 修改 `app/api/nodes/[id]/route.ts` 文件
    - 在删除节点前，查询节点的 imageUrl, graphId, projectId
    - 使用事务�?
      1. 删除节点记录（级联删除关联的边）
      2. 更新图谱�?nodeCount
      3. 更新项目�?nodeCount
    - 如果�?imageUrl，从 Blob 删除文件
    - 返回删除统计信息 JSON
    - _Requirements: 9.2_

  - [ ] 5.10 编写节点删除更新统计属性测�?
    - **Property 28: 节点删除更新图谱统计**
    - **Validates: Requirements 9.2**


- [ ] 6. 扩展�?API 支持图谱关联
  - [ ] 6.1 创建 GET /api/graphs/[id]/edges 路由
    - 创建 `app/api/graphs/[id]/edges/route.ts` 文件
    - 实现 GET 处理器，查询指定图谱的所有边
    - WHERE graphId = id
    - 返回边列�?JSON
    - _Requirements: 6.2, 10.2_

  - [ ] 6.2 编写边查询数据隔离属性测�?
    - **Property 32: 边查询数据隔�?*
    - **Validates: Requirements 10.2**

  - [ ] 6.3 创建 POST /api/graphs/[id]/edges 路由
    - �?`app/api/graphs/[id]/edges/route.ts` 中实�?POST 处理�?
    - 解析请求体（fromNodeId, toNodeId, label, weight�?
    - 验证图谱存在并获取其 projectId
    - 验证 fromNode �?toNode 存在且都属于当前图谱
    - 使用事务�?
      1. 创建边记录（设置 graphId �?projectId�?
      2. 更新图谱�?edgeCount
      3. 更新项目�?edgeCount
    - 返回创建的边和更新后的统计信�?JSON
    - _Requirements: 5.1, 5.2, 5.5, 10.5_

  - [ ] 6.4 编写边项目和图谱关联属性测�?
    - **Property 14: 边项目和图谱关联正确�?*
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [ ] 6.5 编写边创建更新统计属性测�?
    - **Property 15: 边创建更新图谱统�?*
    - **Validates: Requirements 5.5, 9.3**

  - [ ] 6.6 编写边创建验证属性测�?
    - **Property 35: 边创建验证节点属于同一图谱**
    - **Validates: Requirements 10.5**

  - [ ] 6.7 更新 DELETE /api/edges/[id] 路由
    - 修改 `app/api/edges/[id]/route.ts` 文件
    - 在删除边前，查询边的 graphId �?projectId
    - 使用事务�?
      1. 删除边记�?
      2. 更新图谱�?edgeCount
      3. 更新项目�?edgeCount
    - 返回删除统计信息 JSON
    - _Requirements: 9.4_

  - [ ] 6.8 编写边删除更新统计属性测�?
    - **Property 29: 边删除更新图谱统�?*
    - **Validates: Requirements 9.4**

- [ ] 7. Checkpoint - 验证节点和边 API
  - 测试在图谱上下文中创建节点和�?
  - 验证数据关联正确（节点和边关联到图谱和项目）
  - 验证统计信息更新正确
  - 验证数据隔离（不同图谱的数据不混淆）
  - 验证级联删除（删除节点时边也被删除）
  - 如有问题，询问用�?


- [ ] 8. 重构 Zustand Store
  - [ ] 8.1 更新 store 接口定义
    - 修改 `lib/store.ts` 文件
    - 添加 Graph 类型定义
    - 更新 Project 类型包含 graphs 数组
    - 添加 isLoading �?error 状�?
    - 添加新的方法签名（loadProjects, loadGraphData, createGraph, switchGraph 等）
    - _Requirements: 11.1, 11.3_

  - [ ] 8.2 实现项目加载方法
    - 实现 loadProjects 方法
    - 调用 GET /api/projects
    - 更新 projects 状�?
    - 处理加载状态和错误
    - 移除所�?localStorage.getItem 调用
    - _Requirements: 2.1, 11.2_

  - [ ] 8.3 实现图谱数据加载方法
    - 实现 loadGraphData 方法
    - 调用 GET /api/graphs/[id]
    - 更新 nodes �?edges 状�?
    - 处理加载状态和错误
    - _Requirements: 6.1, 6.2_

  - [ ] 8.4 实现项目创建方法
    - 实现 createProject 方法
    - 调用 POST /api/projects
    - 更新 projects 状�?
    - 自动切换到新创建的项目和图谱
    - 移除所�?localStorage.setItem 调用
    - 返回创建的项目对�?
    - _Requirements: 3.1, 3.5, 11.3_

  - [ ] 8.5 编写创建�?UI 数据刷新属性测�?
    - **Property 11: 创建�?UI 数据刷新**
    - **Validates: Requirements 3.5**

  - [ ] 8.6 实现图谱创建方法
    - 实现 createGraph 方法
    - 调用 POST /api/projects/[id]/graphs
    - 更新 projects 状态中对应项目�?graphs 数组
    - 自动切换到新创建的图�?
    - 返回创建的图谱对�?
    - _Requirements: 3.2, 3.5_

  - [ ] 8.7 实现图谱切换方法
    - 实现 switchGraph 方法
    - 设置 currentProject �?currentGraph
    - 清空当前�?nodes �?edges
    - 调用 loadGraphData 加载新图谱的数据
    - 移除所�?localStorage 相关代码
    - _Requirements: 6.4_

  - [ ] 8.8 编写切换图谱清空旧数据属性测�?
    - **Property 19: 切换图谱清空旧数�?*
    - **Validates: Requirements 6.4**

  - [ ] 8.9 更新节点操作方法
    - 更新 addNode 方法，接�?graphId 参数
    - 调用 POST /api/graphs/[graphId]/nodes
    - 更新 nodes 状态和 currentGraph.nodeCount
    - 更新 updateNode 方法保持现有逻辑
    - 更新 deleteNode 方法，更�?currentGraph.nodeCount
    - _Requirements: 4.1, 4.2, 4.5, 9.2_

  - [ ] 8.10 更新边操作方�?
    - 更新 addEdge 方法，接�?graphId 参数
    - 调用 POST /api/graphs/[graphId]/edges
    - 更新 edges 状态和 currentGraph.edgeCount
    - 更新 deleteEdge 方法（如果存在），更�?currentGraph.edgeCount
    - _Requirements: 5.1, 5.2, 5.5, 9.4_

  - [ ] 8.11 添加错误处理�?Toast 通知
    - 在所�?API 调用中添�?try-catch
    - 设置 isLoading �?error 状�?
    - 集成 Toast 通知显示错误和成功消�?
    - _Requirements: 13.2, 13.4_

  - [ ] 8.12 编写错误消息具体性属性测�?
    - **Property 36: 创建操作错误消息具体�?*
    - **Validates: Requirements 13.2**

  - [ ] 8.13 编写操作成功反馈属性测�?
    - **Property 37: 操作成功反馈**
    - **Validates: Requirements 13.4**


- [ ] 9. 更新 TopNavbar 组件
  - [ ] 9.1 移除 localStorage 逻辑
    - 修改 `components/TopNavbar.tsx` 文件
    - 移除所�?localStorage.getItem �?localStorage.setItem 调用
    - 移除 useEffect 中的 localStorage 恢复逻辑
    - _Requirements: 11.1, 11.3_

  - [ ] 9.2 使用 store 加载项目数据
    - 在组件挂载时调用 store.loadProjects()
    - 使用 store.projects 渲染下拉�?
    - 显示加载状态（isLoading�?
    - 显示错误状态（error�?
    - _Requirements: 2.1_

  - [ ] 9.3 更新项目和图谱显�?
    - 显示项目名称和图谱数�?
    - 显示图谱名称、节点数量和边数�?
    - 使用 store.currentProject �?store.currentGraph 高亮当前选择
    - _Requirements: 2.3, 2.4_

  - [ ] 9.4 编写项目显示信息属性测�?
    - **Property 5: 项目显示信息完整�?*
    - **Validates: Requirements 2.3**

  - [ ] 9.5 编写图谱显示信息属性测�?
    - **Property 6: 图谱显示信息完整�?*
    - **Validates: Requirements 2.4**

  - [ ] 9.6 实现图谱切换逻辑
    - 点击图谱时调�?store.switchGraph(projectId, graphId)
    - 等待数据加载完成
    - 显示加载指示�?
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ] 9.7 更新 CreateProjectModal 集成
    - 修改 handleCreateProject 方法
    - 调用 store.createProject �?store.createGraph
    - 等待创建完成
    - 关闭模态框
    - 显示成功提示
    - _Requirements: 3.1, 3.2, 3.5_

- [ ] 10. 更新 KnowledgeGraph 组件（三维视图）
  - [ ] 10.1 使用当前图谱上下�?
    - 修改 `components/KnowledgeGraph.tsx` 文件
    - �?store 获取 currentGraph
    - 验证 currentGraph 存在后才允许操作
    - _Requirements: 4.1, 4.2_

  - [ ] 10.2 更新节点创建逻辑
    - 修改 handleAddNode 方法
    - 调用 store.addNode(currentGraph.id, nodeData)
    - 显示加载状�?
    - 处理错误情况
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ] 10.3 更新边创建逻辑
    - 修改 handleAddEdge 方法
    - 调用 store.addEdge(currentGraph.id, edgeData)
    - 显示加载状�?
    - 处理错误情况
    - _Requirements: 5.1, 5.2, 5.5_

  - [ ] 10.4 确保数据�?store 渲染
    - 使用 store.nodes �?store.edges 渲染图谱
    - 监听 currentGraph 变化，自动重新渲�?
    - _Requirements: 6.3, 8.1_

  - [ ] 10.5 编写数据加载后渲染属性测�?
    - **Property 18: 数据加载后渲染完整�?*
    - **Validates: Requirements 6.3**

  - [ ] 10.6 编写跨视图节点创建同步属性测�?
    - **Property 25: 跨视图节点创建同�?*
    - **Validates: Requirements 8.1, 8.2**


- [ ] 11. 更新 WorkflowCanvas 组件（二维视图）
  - [ ] 11.1 使用当前图谱上下�?
    - 修改 `components/WorkflowCanvas.tsx` 文件
    - �?store 获取 currentGraph
    - 验证 currentGraph 存在后才允许操作
    - _Requirements: 4.3, 4.4_

  - [ ] 11.2 更新节点创建逻辑
    - 修改节点创建方法
    - 调用 store.addNode(currentGraph.id, nodeData)
    - 确保与三维视图使用相同的 API
    - _Requirements: 4.3, 4.4, 4.5_

  - [ ] 11.3 更新边创建逻辑
    - 修改边创建方�?
    - 调用 store.addEdge(currentGraph.id, edgeData)
    - 确保与三维视图使用相同的 API
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ] 11.4 确保数据同步
    - 使用 store.nodes �?store.edges 渲染画布
    - 监听 currentGraph 变化，自动重新渲�?
    - 验证与三维视图显示相同的数据
    - _Requirements: 8.1, 8.2, 8.5_

  - [ ] 11.5 编写视图切换数据一致性属性测�?
    - **Property 27: 视图切换数据一致�?*
    - **Validates: Requirements 8.5**

  - [ ] 11.6 编写跨视图节点删除同步属性测�?
    - **Property 26: 跨视图节点删除同�?*
    - **Validates: Requirements 8.3, 8.4**

- [ ] 12. 更新 AddNodeModal 组件
  - [ ] 12.1 支持编辑模式数据加载
    - 修改 `components/AddNodeModal.tsx` 文件
    - 当传�?nodeId 时，�?API 加载节点完整数据
    - 预填充所有表单字�?
    - _Requirements: 7.1, 7.3_

  - [ ] 12.2 编写节点编辑数据加载属性测�?
    - **Property 20: 节点编辑数据加载完整�?*
    - **Validates: Requirements 7.1**

  - [ ] 12.3 编写编辑模态框预填充属性测�?
    - **Property 22: 编辑模态框预填充完整�?*
    - **Validates: Requirements 7.3**

  - [ ] 12.4 支持图片替换
    - 当用户上传新图片时，记录旧图�?URL
    - 上传新图片到 Blob 存储
    - 更新节点时，删除旧图�?
    - _Requirements: 7.5_

  - [ ] 12.5 编写节点图片替换属性测�?
    - **Property 24: 节点图片替换完整�?*
    - **Validates: Requirements 7.5**

  - [ ] 12.6 确保使用当前图谱上下�?
    - �?store 获取 currentGraph
    - 创建节点时传�?graphId
    - _Requirements: 4.1, 4.2_

- [ ] 13. Checkpoint - 端到端测�?
  - 测试完整工作流：创建项目 �?创建图谱 �?添加节点 �?创建�?�?切换图谱 �?删除图谱
  - 测试三维和二维视图的数据同步
  - 测试图谱切换和数据隔�?
  - 测试统计信息实时更新
  - 测试节点编辑和图片上�?
  - 验证所�?UI 交互正常
  - 验证不再使用 localStorage
  - 如有问题，询问用�?


- [ ] 14. 添加 Toast 通知系统
  - [ ] 14.1 创建 Toast 组件
    - 创建 `components/Toast.tsx` 文件
    - 实现 Toast 通知 UI（成功、错误、警告、信息）
    - 支持自动消失（可配置时间�?
    - 支持手动关闭
    - 支持多个 Toast 堆叠显示
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 14.2 创建 Toast Context
    - 创建 `lib/ToastContext.tsx` 文件
    - 提供 showToast 方法
    - 管理 Toast 队列
    - _Requirements: 13.4_

  - [ ] 14.3 集成 Toast 到应�?
    - �?`app/layout.tsx` 中添�?ToastProvider
    - �?store 中使�?showToast 显示通知
    - 在组件中使用 showToast 显示通知
    - _Requirements: 13.4_

- [ ] 15. 添加加载状态指示器
  - [ ] 15.1 �?TopNavbar 添加加载状�?
    - 显示项目列表加载中的 Spinner
    - 显示图谱切换时的加载指示�?
    - _Requirements: 2.1, 6.1, 6.2_

  - [ ] 15.2 �?KnowledgeGraph 添加加载状�?
    - 显示数据加载中的 Spinner
    - 在操作进行时禁用按钮
    - _Requirements: 6.3_

  - [ ] 15.3 �?WorkflowCanvas 添加加载状�?
    - 显示数据加载中的 Spinner
    - 在操作进行时禁用按钮
    - _Requirements: 6.3_

- [ ] 16. 编写集成测试
  - [ ] 16.1 编写完整工作流集成测�?
    - 测试：创建项�?�?创建图谱 �?添加节点 �?创建�?�?查询数据 �?删除图谱
    - 验证每一步的数据正确�?
    - _Requirements: All_

  - [ ] 16.2 编写图谱切换集成测试
    - 创建多个项目和图�?
    - 在不同图谱间切换
    - 验证数据隔离和同�?
    - _Requirements: 6.4, 10.1, 10.2, 10.3_

  - [ ] 16.3 编写三维和二维视图同步集成测�?
    - 在三维视图创建节�?
    - 验证二维视图显示该节�?
    - 在二维视图删除节�?
    - 验证三维视图不显示该节点
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 16.4 编写统计信息更新集成测试
    - 创建节点和边
    - 验证图谱和项目的统计信息更新
    - 删除节点和边
    - 验证统计信息减少
    - _Requirements: 4.5, 5.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 16.5 编写事务原子性集成测�?
    - 模拟创建节点时更新统计失�?
    - 验证节点创建被回�?
    - 验证数据库状态保持一�?
    - _Requirements: 15.1, 15.4_

  - [ ] 16.6 编写节点图片 URL 有效性属性测�?
    - **Property 21: 节点图片 URL 有效�?*
    - **Validates: Requirements 7.2**

  - [ ] 16.7 编写 UI 统计信息实时更新属性测�?
    - **Property 30: UI 统计信息实时更新**
    - **Validates: Requirements 9.5**

  - [ ] 16.8 编写事务原子性保证属性测�?
    - **Property 38: 事务原子性保�?*
    - **Validates: Requirements 15.1, 15.4**

- [ ] 17. 最�?Checkpoint - 确保所有测试通过
  - 运行所有单元测�?
  - 运行所有属性测�?
  - 运行所有集成测�?
  - 修复任何失败的测�?
  - 验证所有功能正常工�?
  - 验证性能满足要求
  - 确保代码质量和覆盖率
  - 如有问题，询问用�?


## Notes

- 每个任务都引用了具体的需求以便追溯
- Checkpoint 确保增量验证
- 属性测试使用 fast-check 库验证通用正确性属性
- 单元测试验证具体示例和边界情况
- 所有数据操作必须通过 API，不使用 localStorage
- 事务必须确保数据一致性
- 三维和二维视图必须共享相同的数据源
- 所有测试任务都是必做的，确保全面的质量保证
