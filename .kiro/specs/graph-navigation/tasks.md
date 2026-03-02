# Implementation Plan: Graph Navigation

## Overview

本实现计划将功能分解为离散的编码步骤，每个步骤都建立在前面的步骤之上。重点是修改现有组件以支持从 creation 页面导航到 graph 页面，并确保图谱数据正确加载和显示。

## Tasks

- [x] 1. 修改 Creation Page 的导航逻辑
  - 更新 NewCreationWorkflowPage 组件中图谱卡片的点击处理函数
  - 将导航目标从 `/workflow?graphId=${graph.id}` 改为 `/graph?graphId=${graph.id}`
  - 添加图谱 ID 验证逻辑，确保只有有效的 ID 才能触发导航
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 1.1 编写导航逻辑的单元测试
  - 测试有效 graphId 的导航
  - 测试无效 graphId 的错误处理
  - _Requirements: 1.3, 1.4_

- [ ]* 1.2 编写导航 URL 格式的属性测试
  - **Property 1: 导航 URL 格式正确性**
  - **Validates: Requirements 1.1, 1.2**

- [x] 2. 增强 GraphStore 以支持按 ID 加载图谱
  - 在 GraphStore 中添加 `loadGraphById` 方法
  - 实现从 API 获取图谱详情的逻辑
  - 实现自动加载或刷新项目列表的逻辑
  - 添加错误状态管理（`error` 属性和 `setError` 方法）
  - 更新 localStorage 以保存当前图谱 ID
  - _Requirements: 2.1, 2.2, 3.3, 4.1, 4.2, 4.4_

- [ ]* 2.1 编写 loadGraphById 方法的单元测试
  - 测试成功加载图谱数据
  - 测试图谱不存在的错误处理
  - 测试网络错误的处理
  - _Requirements: 2.1, 2.4, 6.1, 6.2_

- [ ]* 2.2 编写数据加载完整性的属性测试
  - **Property 3: 数据加载完整性**
  - **Validates: Requirements 2.1, 2.2**

- [ ]* 2.3 编写数据归属正确性的属性测试
  - **Property 7: 数据归属正确性**
  - **Validates: Requirements 3.4**

- [x] 3. 重构 Graph Page 以支持 URL 参数
  - 将 Graph Page 改为客户端组件（'use client'）
  - 添加 useSearchParams 和 useRouter hooks
  - 实现 URL 参数解析逻辑（提取 graphId）
  - 添加初始化状态管理（isInitializing, error）
  - _Requirements: 5.1, 5.2_

- [ ]* 3.1 编写 URL 参数解析的单元测试
  - 测试有效 graphId 参数的提取
  - 测试缺失参数的处理
  - 测试无效参数的处理
  - _Requirements: 5.1, 5.2_

- [ ]* 3.2 编写 URL 参数解析的属性测试
  - **Property 11: URL 参数解析**
  - **Validates: Requirements 5.1**

- [x] 4. 实现 Graph Page 的数据加载逻辑
  - 创建 initializeGraph 函数
  - 在 useEffect 中调用 initializeGraph
  - 处理无效 graphId 的情况（显示错误提示）
  - 调用 GraphStore 的 loadGraphById 方法
  - 实现加载状态的显示（LoadingSpinner）
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 5.1_

- [ ]* 4.1 编写数据加载逻辑的单元测试
  - 测试成功加载场景
  - 测试加载失败场景
  - 测试加载状态的显示
  - _Requirements: 2.3, 2.4, 2.5_

- [ ]* 4.2 编写渲染数据一致性的属性测试
  - **Property 4: 渲染数据一致性**
  - **Validates: Requirements 2.3**

- [x] 5. 实现 Graph Page 的错误处理和用户反馈
  - 创建错误显示组件或区域
  - 实现不同错误类型的消息显示
  - 添加"返回"按钮（导航回 Creation Page）
  - 添加"重试"按钮（重新加载图谱数据）
  - 处理空图谱数据的情况（显示提示信息）
  - _Requirements: 2.4, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5.3 增强 TopNavbar 以支持只有 graphId 的 URL
  - 修改 TopNavbar 的 URL 参数处理逻辑
  - 当 URL 只包含 graphId 时，自动从项目列表中查找对应的项目
  - 确保"现有图谱"下拉菜单能够正确显示当前选中的项目和图谱
  - _Requirements: 1.1, 1.2, 5.1_

- [ ]* 5.1 编写错误处理的单元测试
  - 测试图谱不存在错误
  - 测试网络错误
  - 测试空数据提示
  - 测试超时错误
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ]* 5.2 编写错误状态 UI 完整性的属性测试
  - **Property 13: 错误状态 UI 完整性**
  - **Validates: Requirements 6.4**

- [ ] 6. Checkpoint - 确保基本导航和加载功能正常
  - 测试从 Creation Page 点击卡片能否正确导航
  - 测试 Graph Page 能否正确加载图谱数据
  - 测试错误情况的处理是否正确
  - 确保所有测试通过，如有问题请询问用户

- [ ] 7. 实现数据属性不变性验证
  - 在 GraphStore 的 loadGraphById 中添加数据验证逻辑
  - 确保节点属性在加载过程中不被修改
  - 确保边属性在加载过程中不被修改
  - 添加控制台警告，当检测到数据不一致时
  - _Requirements: 3.1, 3.2_

- [ ]* 7.1 编写节点属性不变性的属性测试
  - **Property 5: 节点属性不变性**
  - **Validates: Requirements 3.1**

- [ ]* 7.2 编写边属性不变性的属性测试
  - **Property 6: 边属性不变性**
  - **Validates: Requirements 3.2**

- [ ] 8. 实现数据修改的持久化和同步
  - 验证 GraphStore 的 addNode 和 addEdge 方法正确更新数据库
  - 验证 GraphStore 的 deleteNode 方法正确更新数据库和边
  - 确保修改操作更新图谱的 updatedAt 时间戳
  - 确保修改操作更新图谱的节点/边计数
  - _Requirements: 3.3, 4.1, 4.2, 4.4_

- [ ]* 8.1 编写数据修改持久化的属性测试
  - **Property 8: 数据修改持久化**
  - **Validates: Requirements 3.3, 4.1, 4.2**

- [ ]* 8.2 编写时间戳更新的属性测试
  - **Property 10: 时间戳更新**
  - **Validates: Requirements 4.4**

- [ ] 9. 实现统计信息同步
  - 验证 Creation Page 在返回时能获取最新的图谱统计
  - 确保 GraphStore 的 refreshProjects 方法正确更新统计信息
  - 测试从 Graph Page 返回 Creation Page 的流程
  - _Requirements: 4.3_

- [ ]* 9.1 编写统计信息同步的属性测试
  - **Property 9: 统计信息同步**
  - **Validates: Requirements 4.3**

- [ ] 10. 实现页面刷新的幂等性
  - 确保 Graph Page 刷新后能重新加载相同的图谱
  - 验证 URL 参数在刷新后仍然有效
  - 测试刷新后的数据一致性
  - _Requirements: 5.4_

- [ ]* 10.1 编写页面刷新幂等性的属性测试
  - **Property 12: 页面刷新幂等性**
  - **Validates: Requirements 5.4**

- [ ] 11. 集成测试和端到端验证
  - 编写端到端测试：从 Creation Page 到 Graph Page 的完整流程
  - 测试数据修改和返回的完整流程
  - 测试各种错误场景的恢复流程
  - _Requirements: 所有需求_

- [ ]* 11.1 编写端到端集成测试
  - 测试完整的导航和数据加载流程
  - 测试数据修改和同步流程
  - 测试错误恢复流程

- [ ] 12. Final Checkpoint - 确保所有功能正常
  - 运行所有单元测试和属性测试
  - 手动测试所有用户场景
  - 验证错误处理的完整性
  - 确保所有测试通过，如有问题请询问用户

## Notes

- 标记为 `*` 的任务是可选的测试任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求，以确保可追溯性
- Checkpoint 任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证特定示例和边界情况
