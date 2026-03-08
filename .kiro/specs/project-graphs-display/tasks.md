# Implementation Plan: Project Graphs Display

## Overview

本实施计划将为 /creation 页面添加图谱批量删除功能。现有代码已经实现了项目卡片点击后显示图谱列表的基本功能，本计划将重点实现图谱视图中的批量删除功能，包括选择状态管理、批量删除 API 和 UI 交互。

## Tasks

- [x] 1. 实现图谱批量删除 API
  - 创建 `/api/graphs/batch-delete` 端点
  - 实现批量删除逻辑（删除图谱及其关联的节点和边）
  - 返回删除结果统计信息
  - 处理部分失败场景
  - _Requirements: 4.3, 7.4_

- [ ]* 1.1 编写批量删除 API 的属性测试
  - **Property 9: 批量删除仅影响选中图谱**
  - **Property 10: 批量删除不跨项目影响**
  - **Validates: Requirements 3.4, 3.5**

- [ ]* 1.2 编写批量删除 API 的单元测试
  - 测试成功删除场景
  - 测试部分失败场景
  - 测试权限验证
  - _Requirements: 4.3, 4.6_

- [x] 2. 扩展图谱视图的批量删除状态管理
  - [x] 2.1 在 NewCreationWorkflowPage 中添加 selectedGraphIds 状态
    - 添加 `selectedGraphIds: Set<string>` 状态
    - 实现 `handleToggleGraphSelection` 函数
    - 实现 `handleSelectAllGraphs` 函数
    - 实现 `handleDeselectAllGraphs` 函数
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 2.2 实现图谱批量删除的事件处理函数
    - 实现 `handleConfirmDeleteGraphs` 函数
    - 添加删除后的数据刷新逻辑
    - 添加错误处理和重试机制
    - 实现删除成功后清除选择状态
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 6.3, 7.1, 7.4, 7.5_

- [ ]* 2.3 编写选择状态管理的属性测试
  - **Property 17: 选择框切换状态**
  - **Property 18: 全选和取消全选往返**
  - **Property 22: 返回时清除选择状态**
  - **Validates: Requirements 5.2, 5.3, 5.4, 6.3**

- [x] 3. 创建 GraphCardCheckbox 组件
  - 创建 `components/creation/GraphCardCheckbox.tsx` 文件
  - 实现复选框 UI 和交互逻辑
  - 添加无障碍支持（aria-label）
  - 使用现有的 Morandi 色系样式
  - _Requirements: 2.5, 5.1, 5.2_

- [ ]* 3.1 编写 GraphCardCheckbox 组件的单元测试
  - 测试复选框渲染
  - 测试点击切换行为
  - 测试无障碍属性
  - _Requirements: 2.5, 5.1, 5.2_

- [x] 4. 修改图谱卡片以支持批量删除模式
  - [x] 4.1 在图谱视图中添加 GraphCardCheckbox
    - 在批量删除模式下显示复选框
    - 连接复选框到选择状态
    - 添加选中状态的视觉反馈（高亮样式）
    - _Requirements: 2.5, 5.1_

  - [x] 4.2 修改图谱卡片点击行为
    - 在批量删除模式下阻止导航
    - 保持非批量删除模式下的导航功能
    - _Requirements: 2.6_

- [ ]* 4.3 编写图谱卡片交互的属性测试
  - **Property 6: 图谱卡片包含选择框**
  - **Property 7: 图谱卡片点击触发导航**
  - **Property 16: 选中图谱提供视觉反馈**
  - **Validates: Requirements 2.5, 2.6, 5.1**

- [x] 5. 扩展 BatchDeleteControls 组件以支持图谱删除
  - 修改 `BatchDeleteControls` 组件以区分项目和图谱视图
  - 根据 `isProjectView` 属性调整显示文本
  - 在图谱视图中使用 `selectedGraphIds` 而不是 `selectedProjectIds`
  - _Requirements: 3.1, 3.2, 3.3, 5.5_

- [ ]* 5.1 编写 BatchDeleteControls 扩展的单元测试
  - 测试图谱视图模式下的按钮状态
  - 测试选中数量显示
  - 测试按钮启用/禁用逻辑
  - _Requirements: 3.2, 3.3, 5.5_

- [x] 6. 扩展 DeleteConfirmDialog 组件以支持图谱删除
  - 修改 `DeleteConfirmDialog` 组件以支持图谱删除确认
  - 添加 `itemType` 属性（'project' | 'graph'）
  - 根据类型显示不同的确认消息
  - _Requirements: 4.1, 4.2_

- [ ]* 6.1 编写 DeleteConfirmDialog 扩展的单元测试
  - 测试项目删除确认对话框
  - 测试图谱删除确认对话框
  - 测试数量显示
  - _Requirements: 4.1, 4.2_

- [x] 7. 集成批量删除功能到图谱视图
  - [x] 7.1 连接批量删除控件到图谱视图
    - 在图谱视图中传递正确的 props 到 BatchDeleteControls
    - 传递 `selectedGraphIds.size` 作为 selectedCount
    - 传递图谱删除处理函数
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 7.2 添加图谱删除确认对话框
    - 在图谱视图中显示删除确认对话框
    - 传递 `itemType='graph'` 和 `selectedGraphIds.size`
    - 连接确认和取消处理函数
    - _Requirements: 4.1, 4.2_

  - [x] 7.3 实现删除后的 UI 更新
    - 删除成功后刷新项目和图谱列表
    - 显示成功提示消息
    - 显示加载指示器
    - _Requirements: 4.4, 4.5, 8.2, 8.3_

- [ ]* 7.4 编写端到端集成测试
  - 测试完整的批量删除流程
  - 测试从项目视图到图谱视图的导航
  - 测试批量删除后返回项目视图
  - _Requirements: 1.1, 2.6, 4.3, 4.4, 6.2_

- [x] 8. 添加错误处理和用户反馈
  - [x] 8.1 实现网络错误处理
    - 捕获 API 请求失败
    - 显示用户友好的错误消息
    - 提供重试按钮
    - _Requirements: 7.3_

  - [x] 8.2 实现数据不存在错误处理
    - 检测项目不存在的情况
    - 显示错误消息并导航回项目列表
    - _Requirements: 7.2_

  - [x] 8.3 实现部分失败错误处理
    - 显示详细的成功/失败统计
    - 列出失败的图谱和原因
    - 允许用户重试失败的项
    - _Requirements: 4.6_

- [ ]* 8.4 编写错误处理的单元测试
  - 测试网络错误场景
  - 测试数据不存在场景
  - 测试部分失败场景
  - _Requirements: 7.2, 7.3, 4.6_

- [x] 9. 添加 CSS 样式
  - 为选中状态的图谱卡片添加高亮样式
  - 为 GraphCardCheckbox 添加样式
  - 确保样式与现有 Morandi 色系一致
  - 添加批量删除模式下的视觉反馈
  - _Requirements: 5.1_

- [x] 10. Checkpoint - 确保所有测试通过
  - 确保所有测试通过，询问用户是否有问题

## Notes

- 任务标记 `*` 的为可选任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求条款以确保可追溯性
- 属性测试验证通用的正确性属性
- 单元测试验证具体的示例和边界情况
- 现有代码已经实现了基本的视图切换功能，本计划重点实现批量删除功能
- 批量删除功能需要在项目和图谱两个视图中都能正常工作
- 使用现有的 Morandi 色系和组件样式保持 UI 一致性
