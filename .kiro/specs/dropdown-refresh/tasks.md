# Implementation Plan: Dropdown Refresh After Project/Graph Creation

## Overview

修复"新建项目/图谱后下拉框不刷新"的问题。主要修改 GraphStore 中的 `createProject` 和 `addGraphToProject` 函数，在创建成功后重新从 API 加载最新的项目列表。

## Tasks

- [x] 1. 修改 GraphStore.createProject 函数
  - 在创建项目和图谱成功后，调用 `/api/projects/with-graphs` 重新加载项目列表
  - 从重新加载的数据中找到新创建的项目和图谱
  - 更新 GraphStore 状态（projects, currentProject, currentGraph）
  - 添加错误处理，确保失败时不破坏现有状态
  - 添加详细的日志输出
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.3_

- [x] 2. 修改 GraphStore.addGraphToProject 函数
  - 在创建图谱成功后，调用 `/api/projects/with-graphs` 重新加载项目列表
  - 从重新加载的数据中找到对应项目和新创建的图谱
  - 更新 GraphStore 状态（projects, currentProject, currentGraph）
  - 添加错误处理，确保失败时不破坏现有状态
  - 添加详细的日志输出
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.3_

- [x] 3. 修改 TopNavbar.handleCreateProject 函数
  - 将函数改为 async，等待创建操作完成
  - 添加 try-catch 错误处理
  - 创建成功后，保持下拉框展开状态（setShowProjectMenu(true)）
  - 如果是添加到现有项目，展开该项目（setHoveredProjectId）
  - 创建失败时显示 alert 错误提示
  - _Requirements: 1.4, 2.4, 3.3_

- [x] 4. 修改 CreateProjectModal 组件
  - 将 onCreate prop 类型改为返回 Promise 的异步函数
  - 修改 handleSubmit 为 async 函数
  - 使用 await 等待 onCreate 完成
  - 添加 try-catch 处理创建失败的情况
  - 失败时在弹窗中显示错误消息（setError）
  - _Requirements: 3.3_

- [x] 5. 测试和验证
  - 测试创建新项目和图谱，验证下拉框立即显示新内容
  - 测试在现有项目中添加图谱，验证下拉框更新
  - 测试下拉框状态保持（展开状态、选中项目）
  - 测试错误处理（网络失败、API 错误）
  - 测试快速连续创建多个项目/图谱
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

## Notes

- 所有任务都是核心实现任务，没有标记为可选
- 重点是确保数据一致性和良好的用户体验
- 错误处理非常重要，避免部分更新导致状态不一致
- 测试时注意验证数据库和 UI 的同步
