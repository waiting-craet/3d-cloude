# Implementation Plan: User Authentication

## Overview

实现用户登录和注册功能，包括数据库表创建、API 路由、登录模态框组件和状态管理。

## Tasks

- [ ] 1. 创建数据库表和 API 路由
  - 创建 SQL 文件用于 Neon 数据库
  - 实现注册 API (`/api/auth/register`)
  - 实现登录 API (`/api/auth/login`)
  - 添加 bcrypt 密码加密
  - _Requirements: 1.2, 1.3, 2.2, 2.3, 5.1, 5.2_

- [ ]* 1.1 编写注册 API 的单元测试
  - 测试用户名唯一性验证
  - 测试密码加密
  - 测试错误处理
  - _Requirements: 1.2, 1.4, 5.1_

- [ ]* 1.2 编写登录 API 的单元测试
  - 测试密码验证
  - 测试用户不存在的情况
  - 测试错误处理
  - _Requirements: 2.2, 2.3, 2.4_

- [ ] 2. 创建 LoginModal 组件
  - [ ] 2.1 创建基础模态框结构
    - 实现模态框打开/关闭逻辑
    - 添加登录/注册标签页切换
    - 创建表单 UI（用户名、密码输入框）
    - _Requirements: 1.1, 2.1_

  - [ ] 2.2 实现注册功能
    - 表单验证（用户名、密码非空，密码长度）
    - 调用注册 API
    - 显示错误提示
    - 注册成功后自动登录
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [ ] 2.3 实现登录功能
    - 表单验证
    - 调用登录 API
    - 显示错误提示
    - 登录成功后关闭弹窗
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.4 编写 LoginModal 组件测试
  - 测试标签页切换
  - 测试表单验证
  - 测试 API 调用
  - _Requirements: 1.1, 2.1_

- [ ] 3. 更新 TopNavbar 组件
  - 添加"登录"按钮（未登录时显示）
  - 显示用户名（登录后显示）
  - 添加"退出登录"按钮
  - 集成 LoginModal
  - _Requirements: 2.1, 2.5, 4.3_

- [ ] 4. 实现登录状态管理
  - [ ] 4.1 创建用户状态 store (Zustand)
    - 定义用户状态接口
    - 实现登录/退出登录方法
    - 实现 localStorage 持久化
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 4.2 在应用启动时恢复登录状态
    - 从 localStorage 读取用户信息
    - 更新全局状态
    - _Requirements: 4.2_

- [ ]* 4.3 编写状态管理测试
  - 测试登录状态持久化
  - 测试退出登录
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 5. Checkpoint - 测试完整流程
  - 确保所有测试通过
  - 手动测试注册流程
  - 手动测试登录流程
  - 手动测试退出登录
  - 验证登录状态持久化

## Notes

- 任务标记 `*` 的为可选测试任务
- SQL 文件已创建在 `prisma/migrations/create-user-table.sql`
- 需要在 Neon 数据库的 SQL 编译器中手动执行 SQL 文件
- 使用 bcrypt 加密密码（salt rounds = 10）
- 登录状态存储在 localStorage 中
