# Implementation Plan: Node Detail Panel Edit Feature

## Overview

本实现计划将节点详情面板从只读模式改造为可编辑模式，支持直接编辑节点信息和上传图片，并在关闭时自动保存。实现将分为 4 个主要阶段，每个阶段都包含核心功能实现和相应的测试任务。

## Tasks

- [x] 1. 修改 API 支持 imageUrl 更新
  - 更新 `app/api/nodes/[id]/route.ts` 的 PATCH 方法
  - 添加 `imageUrl` 字段到更新逻辑中
  - 确保向后兼容（imageUrl 为可选字段）
  - _Requirements: 2.2, 3.7_

- [ ]* 1.1 编写 API 更新测试
  - 测试 PATCH 请求可以更新 imageUrl
  - 测试 imageUrl 为 undefined 时不影响其他字段
  - _Requirements: 2.2, 3.7_

- [x] 2. 更新全局状态管理
  - 在 `lib/store.ts` 中添加 `updateNode` 方法
  - 实现更新单个节点的逻辑
  - 同时更新 nodes 数组和 selectedNode
  - _Requirements: 2.3_

- [ ]* 2.1 编写状态更新测试
  - 测试 updateNode 正确更新 nodes 数组
  - 测试 updateNode 正确更新 selectedNode
  - 测试更新不存在的节点不影响状态
  - _Requirements: 2.3_

- [x] 3. 创建 EditableInput 组件
  - 创建 `components/EditableInput.tsx` 文件
  - 实现可编辑输入框组件
  - 支持单行和多行模式
  - 显示字符计数
  - 支持 disabled 状态
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 3.1 编写 EditableInput 单元测试
  - 测试组件正确渲染
  - 测试 disabled 状态下不可编辑
  - 测试字符计数显示
  - _Requirements: 1.1, 1.2_

- [ ]* 3.2 编写输入状态同步属性测试
  - **Property 1: 输入状态同步**
  - **Validates: Requirements 1.3, 1.4**
  - 对于任何输入的文本，验证 onChange 回调被正确调用
  - _Requirements: 1.3, 1.4_

- [x] 4. 创建 InlineImageUpload 组件
  - 创建 `components/InlineImageUpload.tsx` 文件
  - 实现图片上传组件
  - 显示上传提示区域（无图片时）
  - 显示图片预览（有图片时）
  - 实现文件选择和上传逻辑
  - 实现删除图片功能
  - 添加文件类型和大小验证
  - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.4, 4.5_

- [ ]* 4.1 编写 InlineImageUpload 单元测试
  - 测试无图片时显示上传提示
  - 测试有图片时显示预览
  - 测试点击触发文件选择
  - 测试删除按钮功能
  - _Requirements: 3.3, 3.4, 3.5, 3.9_

- [ ]* 4.2 编写图片上传属性测试
  - **Property 6: 图片上传触发**
  - **Validates: Requirements 3.6**
  - 对于任何有效的图片文件，验证上传被触发
  - _Requirements: 3.6_

- [ ]* 4.3 编写非图片文件拒绝属性测试
  - **Property 8: 非图片文件拒绝**
  - **Validates: Requirements 4.4**
  - 对于任何非图片格式的文件，验证被拒绝并显示错误
  - _Requirements: 4.4_

- [x] 5. Checkpoint - 确保组件测试通过
  - 运行所有测试确保新组件工作正常
  - 如有问题请向用户询问

- [x] 6. 修改 NodeDetailPanel 组件 - 添加编辑状态
  - 在 `components/NodeDetailPanel.tsx` 中添加本地状态
  - 添加 `editedName`、`editedDescription`、`editedImageUrl` 状态
  - 添加 `isSaving` 状态
  - 在组件加载时初始化编辑状态
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 7. 修改 NodeDetailPanel 组件 - 替换为可编辑字段
  - 用 EditableInput 组件替换名称的只读展示
  - 用 EditableInput 组件替换描述的只读展示
  - 根据 isAdmin 状态设置 disabled 属性
  - _Requirements: 1.1, 1.2, 6.1, 6.3_

- [x] 8. 修改 NodeDetailPanel 组件 - 添加图片上传
  - 移除现有的媒体展示区域代码
  - 在原位置添加 InlineImageUpload 组件
  - 传递 nodeId、currentImageUrl 和 onImageChange 回调
  - 根据 isAdmin 状态设置 disabled 属性
  - _Requirements: 3.1, 3.2, 6.2, 6.4_

- [x] 9. 实现变更检测逻辑
  - 在 NodeDetailPanel 中实现 `hasChanges` 函数
  - 比较编辑状态与原始节点数据
  - 检测名称、描述、imageUrl 的变更
  - _Requirements: 2.1_

- [ ]* 9.1 编写变更检测属性测试
  - **Property 2: 变更检测准确性**
  - **Validates: Requirements 2.1**
  - 对于任何初始状态和编辑后状态，验证 hasChanges 正确识别变更
  - _Requirements: 2.1_

- [x] 10. 实现输入验证逻辑
  - 在 NodeDetailPanel 中实现 `validateInput` 函数
  - 验证名称不为空
  - 验证名称长度不超过 100 字符
  - 验证描述长度不超过 1000 字符
  - 返回验证结果和错误信息
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 10.1 编写输入验证单元测试
  - 测试空白名称被拒绝（边缘情况）
  - 测试超长名称被拒绝（边缘情况）
  - 测试超长描述被拒绝（边缘情况）
  - 测试有效输入通过验证
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 11. 实现自动保存逻辑
  - 在 NodeDetailPanel 中实现 `saveChanges` 函数
  - 检查是否有变更
  - 执行输入验证
  - 调用 PATCH API 保存数据
  - 处理保存成功和失败的情况
  - 更新全局状态
  - _Requirements: 2.2, 2.3, 2.5_

- [ ]* 11.1 编写保存逻辑属性测试
  - **Property 3: 保存触发条件**
  - **Validates: Requirements 2.2**
  - 对于任何有变更的数据，验证 API 被调用
  - _Requirements: 2.2_

- [ ]* 11.2 编写全局状态更新属性测试
  - **Property 4: 全局状态更新**
  - **Validates: Requirements 2.3**
  - 对于任何成功保存的数据，验证全局状态被更新
  - _Requirements: 2.3_

- [ ]* 11.3 编写保存后关闭属性测试
  - **Property 5: 保存后关闭**
  - **Validates: Requirements 2.4**
  - 对于任何成功的保存操作，验证面板关闭
  - _Requirements: 2.4_

- [x] 12. 修改关闭按钮处理逻辑
  - 修改 `handleClose` 函数
  - 在关闭前检查是否有变更
  - 如果有变更且是管理员，调用 saveChanges
  - 只有保存成功后才关闭面板
  - 保存失败时保持面板打开
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [ ]* 12.1 编写关闭处理单元测试
  - 测试无变更时直接关闭
  - 测试有变更时触发保存
  - 测试保存失败时面板保持打开
  - 测试 ESC 键触发相同的保存流程
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

- [x] 13. 添加加载状态指示器
  - 在保存过程中显示加载动画
  - 在上传过程中显示上传进度
  - 禁用输入字段和按钮（防止重复操作）
  - _Requirements: 5.1, 5.2_

- [ ]* 13.1 编写加载状态单元测试
  - 测试保存中显示加载指示器
  - 测试上传中显示进度提示
  - _Requirements: 5.1, 5.2_

- [x] 14. 实现错误处理和提示
  - 为所有错误情况添加 alert 提示
  - 验证错误显示具体的错误信息
  - API 错误显示友好的错误提示
  - _Requirements: 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.4_

- [ ]* 14.1 编写错误提示属性测试
  - **Property 9: 错误信息显示**
  - **Validates: Requirements 5.4**
  - 对于任何失败的操作，验证显示错误信息
  - _Requirements: 5.4_

- [x] 15. Checkpoint - 确保所有功能测试通过
  - 运行所有单元测试和属性测试
  - 确保测试覆盖率达到目标
  - 如有问题请向用户询问

- [x] 16. 集成测试 - 完整编辑流程
  - 测试打开面板 → 编辑字段 → 上传图片 → 关闭面板的完整流程
  - 验证数据正确保存
  - 验证全局状态正确更新
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.6, 3.7_

- [ ]* 16.1 集成测试 - 权限控制流程
  - 测试非管理员模式下字段为只读
  - 测试管理员模式下字段可编辑
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 17. 最终验证和优化
  - 手动测试所有功能
  - 检查用户体验和视觉反馈
  - 优化性能（如有需要）
  - 确保向后兼容性

## Notes

- 任务标记 `*` 的为可选测试任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，便于追溯
- 属性测试使用 fast-check 库，每个测试运行最少 100 次迭代
- 在 Checkpoint 任务处暂停，确保增量验证
- 保留现有的"修改"和"删除"按钮功能，确保向后兼容
