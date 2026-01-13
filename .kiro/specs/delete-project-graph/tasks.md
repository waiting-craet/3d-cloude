# Implementation Plan: 删除项目和图谱功能

## Overview

本实现计划将在现有的ProjectGraphManager组件中添加删除功能。主要工作包括：创建DeleteButton组件、创建DeleteConfirmDialog组件、更新ProjectGraphManager组件集成删除功能、编写测试。实现将使用TypeScript和React，利用现有的DELETE API端点。

## Tasks

- [x] 1. 创建DeleteButton组件
  - 创建 `components/DeleteButton.tsx` 文件
  - 实现删除按钮UI，包括垃圾桶图标
  - 添加悬停效果和禁用状态样式
  - 实现点击事件处理，阻止事件冒泡
  - 添加aria-label以支持可访问性
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [x] 1.1 为DeleteButton编写单元测试
  - 测试按钮渲染
  - 测试点击事件触发
  - 测试禁用状态
  - 测试事件冒泡阻止
  - _Requirements: 1.1, 1.2, 9.4_

- [x] 1.2 编写属性测试：删除按钮渲染
  - **Property 1: 删除按钮渲染**
  - **Validates: Requirements 1.1, 2.1**

- [x] 1.3 编写属性测试：悬停视觉反馈
  - **Property 2: 悬停视觉反馈**
  - **Validates: Requirements 1.2, 2.2**

- [x] 1.4 编写属性测试：删除按钮点击反馈
  - **Property 15: 删除按钮点击反馈**
  - **Validates: Requirements 9.1**

- [x] 1.5 编写属性测试：删除按钮事件隔离
  - **Property 16: 删除按钮事件隔离**
  - **Validates: Requirements 9.4**

- [-] 2. 创建DeleteConfirmDialog组件
  - 创建 `components/DeleteConfirmDialog.tsx` 文件
  - 实现模态对话框UI，包括背景遮罩
  - 显示警告图标和红色主题样式
  - 显示实体名称和统计信息（节点数、边数、图谱数）
  - 实现确认和取消按钮
  - 添加ESC键关闭功能
  - 添加加载状态显示
  - _Requirements: 3.3, 3.4, 3.5, 3.7_

- [ ] 2.1 为DeleteConfirmDialog编写单元测试
  - 测试对话框打开/关闭
  - 测试显示正确的实体信息
  - 测试确认和取消按钮
  - 测试ESC键关闭
  - 测试加载状态
  - _Requirements: 3.3, 3.4, 3.5, 3.6_

- [ ] 2.2 编写属性测试：确认对话框显示正确信息
  - **Property 4: 确认对话框显示正确信息**
  - **Validates: Requirements 3.3, 3.4**

- [ ] 2.3 编写属性测试：取消操作不删除数据
  - **Property 5: 取消操作不删除数据**
  - **Validates: Requirements 3.6**

- [x] 3. 更新ProjectGraphManager组件 - 添加删除状态管理
  - 在 `components/ProjectGraphManager.tsx` 中添加删除对话框状态
  - 添加isDeleting状态用于防止重复操作
  - 实现handleDeleteProject函数
  - 实现handleDeleteGraph函数
  - 实现confirmDelete函数
  - _Requirements: 3.1, 3.2, 4.1, 5.1_

- [x] 4. 更新ProjectGraphManager组件 - 集成DeleteButton
  - 在项目列表项中添加DeleteButton组件
  - 在图谱列表项中添加DeleteButton组件
  - 确保删除按钮与列表项选择事件隔离
  - 传递正确的回调函数和禁用状态
  - _Requirements: 1.1, 2.1, 9.4_

- [x] 5. 更新ProjectGraphManager组件 - 集成DeleteConfirmDialog
  - 在组件中添加DeleteConfirmDialog组件
  - 传递正确的props（isOpen, onClose, onConfirm等）
  - 实现删除确认逻辑
  - _Requirements: 3.1, 3.2, 3.5_

- [ ] 6. 实现删除API调用和错误处理
  - 在confirmDelete函数中调用DELETE API
  - 处理成功响应：显示成功消息，刷新列表，清除选中状态
  - 处理错误响应：显示错误消息
  - 处理网络错误和超时
  - 实现加载状态管理
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.4_

- [ ] 6.1 编写属性测试：点击删除按钮显示确认对话框
  - **Property 3: 点击删除按钮显示确认对话框**
  - **Validates: Requirements 3.1, 3.2**

- [ ] 6.2 编写属性测试：删除成功后显示反馈并刷新列表
  - **Property 9: 删除成功后显示反馈并刷新列表**
  - **Validates: Requirements 6.1, 6.3, 6.4**

- [ ] 6.3 编写属性测试：删除失败显示错误信息
  - **Property 10: 删除失败显示错误信息**
  - **Validates: Requirements 6.2, 8.1, 8.2, 8.4**

- [ ] 6.4 编写属性测试：删除进行中禁用操作
  - **Property 11: 删除进行中禁用操作**
  - **Validates: Requirements 6.5, 9.3**

- [ ] 6.5 编写属性测试：防止重复删除请求
  - **Property 17: 防止重复删除请求**
  - **Validates: Requirements 9.5**

- [ ] 7. Checkpoint - 测试前端功能
  - 在浏览器中测试删除项目功能
  - 在浏览器中测试删除图谱功能
  - 测试确认对话框显示和交互
  - 测试取消操作
  - 测试错误处理
  - 确保所有测试通过，如有问题请向用户反馈

- [ ] 8. 验证API端点（可选 - API已存在）
  - 验证 DELETE /api/projects/[id] 端点正常工作
  - 验证 DELETE /api/graphs/[id] 端点正常工作
  - 测试404错误响应
  - 测试成功响应格式
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 8.1 编写属性测试：API验证实体存在性
  - **Property 12: API验证实体存在性**
  - **Validates: Requirements 7.3, 7.4**

- [ ] 8.2 编写属性测试：API成功响应格式
  - **Property 13: API成功响应格式**
  - **Validates: Requirements 7.5, 7.7**

- [ ] 8.3 编写属性测试：API错误响应格式
  - **Property 14: API错误响应格式**
  - **Validates: Requirements 7.6**

- [ ] 9. 编写集成测试
  - 测试完整的删除项目流程（创建→删除→验证）
  - 测试完整的删除图谱流程（创建→删除→验证）
  - 测试级联删除（验证关联数据被删除）
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.6_

- [ ] 9.1 编写属性测试：项目级联删除
  - **Property 6: 项目级联删除**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ] 9.2 编写属性测试：图谱级联删除
  - **Property 7: 图谱级联删除**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 9.3 编写属性测试：图谱删除不影响其他数据
  - **Property 8: 图谱删除不影响其他数据**
  - **Validates: Requirements 5.6**

- [ ] 10. 优化用户体验
  - 优化删除按钮的视觉样式和动画
  - 优化确认对话框的动画过渡
  - 确保键盘导航流畅（Tab键、ESC键、Enter键）
  - 添加aria属性以支持屏幕阅读器
  - 测试在不同屏幕尺寸下的显示效果
  - _Requirements: 9.1, 9.2_

- [ ] 11. Final Checkpoint - 完整功能测试
  - 测试所有删除场景（项目、图谱）
  - 测试所有错误场景（网络错误、API错误、超时）
  - 测试可访问性（键盘导航、屏幕阅读器）
  - 测试性能（大数据量项目的删除）
  - 确保所有测试通过，如有问题请向用户反馈

## Notes

- 所有任务都是必需的，包括测试任务，以确保全面的测试覆盖
- 每个任务都引用了具体的需求以便追溯
- Checkpoint任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边缘情况
- DELETE API端点已经存在，任务8为验证任务
