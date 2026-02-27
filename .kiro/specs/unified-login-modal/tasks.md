# Implementation Plan: Unified Login Modal

## Overview

本实现计划将首页的登录按钮与现有的 LoginModal 组件集成,实现统一的登录体验。实现策略是最小化代码修改,复用现有组件,确保向后兼容。

## Tasks

- [x] 1. 修改首页登录按钮
  - 在 `app/page.tsx` 中导入 LoginModal 组件
  - 添加 isLoginModalOpen 状态管理
  - 修改登录按钮的 onClick 事件处理
  - 添加 LoginModal 组件实例
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 1.1 编写首页登录按钮的单元测试
  - 测试点击登录按钮显示弹窗
  - 测试弹窗关闭后状态重置
  - _Requirements: 1.1_

- [x] 2. 更新首页登录按钮样式
  - 将登录按钮样式改为与 UserMenu 一致的渐变样式
  - 添加悬停效果和过渡动画
  - 确保响应式设计
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 2.1 编写样式一致性测试
  - 测试登录按钮样式属性
  - 测试悬停状态变化
  - _Requirements: 4.1, 4.3_

- [x] 3. 验证登录状态同步
  - 确认 LoginModal 使用 useUserStore
  - 确认登录成功后触发 loginStateChange 事件
  - 测试跨页面状态同步
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 3.1 编写登录状态同步的属性测试
  - **Property 2: 登录状态同步**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [x] 4. 添加可访问性支持
  - 为 LoginModal 添加 role="dialog" 和 aria-modal="true"
  - 添加 aria-labelledby 指向标题
  - 实现 ESC 键关闭弹窗
  - 实现焦点自动移到第一个输入框
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 4.1 编写可访问性测试
  - 测试键盘导航
  - 测试 ARIA 属性
  - 测试焦点管理
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 5. Checkpoint - 基本功能验证
  - 在首页点击登录按钮显示弹窗
  - 登录成功后弹窗关闭
  - 登录状态在导航栏更新
  - 确保所有测试通过,询问用户是否有问题

- [ ]* 6. 编写属性测试
  - [ ]* 6.1 编写 Property 1: 登录弹窗状态一致性测试
    - **Property 1: 登录弹窗状态一致性**
    - **Validates: Requirements 1.1, 2.3**
  
  - [ ]* 6.2 编写 Property 3: 弹窗关闭行为测试
    - **Property 3: 弹窗关闭行为**
    - **Validates: Requirements 1.3, 1.4**
  
  - [ ]* 6.3 编写 Property 4: 登录成功后状态更新测试
    - **Property 4: 登录成功后状态更新**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [ ]* 6.4 编写 Property 5: 错误状态显示测试
    - **Property 5: 错误状态显示**
    - **Validates: Requirements 6.1, 6.2**
  
  - [ ]* 6.5 编写 Property 6: 加载状态管理测试
    - **Property 6: 加载状态管理**
    - **Validates: Requirements 6.3**

- [ ]* 7. 编写集成测试
  - 测试首页到3D编辑页面的登录状态保持
  - 测试登录后点击"开始创作"的导航
  - 测试多页面登录状态同步
  - _Requirements: 5.4, 3.1, 3.2_

- [x] 8. 最终验证和文档更新
  - 运行所有测试确保通过
  - 更新 README.md 说明登录功能
  - 创建用户使用文档
  - 确保所有测试通过,询问用户是否有问题

## Notes

- 任务标记 `*` 的为可选任务,可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号以便追溯
- Checkpoint 任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
