# Requirements Document

## Introduction

用户认证系统，支持用户注册和登录功能。用户点击登录按钮后弹出模态框，可以在登录和注册之间切换。

## Glossary

- **User**: 系统用户，包含用户名和密码
- **Authentication_System**: 用户认证系统
- **Login_Modal**: 登录/注册弹窗组件
- **User_Table**: Neon PostgreSQL 数据库中的用户表

## Requirements

### Requirement 1: 用户注册

**User Story:** 作为新用户，我想要注册账号，以便我可以使用系统功能

#### Acceptance Criteria

1. WHEN 用户点击"注册"标签页 THEN THE Login_Modal SHALL 显示注册表单
2. WHEN 用户输入用户名和密码并提交 THEN THE Authentication_System SHALL 验证用户名是否已存在
3. WHEN 用户名不存在 THEN THE Authentication_System SHALL 将用户信息存入 User_Table
4. WHEN 用户名已存在 THEN THE Authentication_System SHALL 返回错误提示
5. WHEN 注册成功 THEN THE Authentication_System SHALL 自动登录用户并关闭弹窗

### Requirement 2: 用户登录

**User Story:** 作为已注册用户，我想要登录系统，以便我可以访问我的数据

#### Acceptance Criteria

1. WHEN 用户点击顶部导航栏的"登录"按钮 THEN THE Login_Modal SHALL 显示登录表单
2. WHEN 用户输入用户名和密码并提交 THEN THE Authentication_System SHALL 验证 User_Table 中是否存在该用户
3. WHEN 用户名和密码匹配 THEN THE Authentication_System SHALL 登录用户并关闭弹窗
4. WHEN 用户名或密码不匹配 THEN THE Authentication_System SHALL 返回错误提示
5. WHEN 登录成功 THEN THE System SHALL 在导航栏显示用户名

### Requirement 3: 数据库表结构

**User Story:** 作为系统管理员，我需要在 Neon 数据库中创建用户表，以便存储用户信息

#### Acceptance Criteria

1. THE User_Table SHALL 包含 id、username、password、createdAt、updatedAt 字段
2. THE User_Table SHALL 使用 username 作为唯一索引
3. THE User_Table SHALL 使用 bcrypt 加密存储密码
4. THE SQL_File SHALL 可以直接在 Neon SQL 编译器中执行

### Requirement 4: 登录状态管理

**User Story:** 作为用户，我希望登录状态能够持久化，以便刷新页面后仍保持登录

#### Acceptance Criteria

1. WHEN 用户登录成功 THEN THE System SHALL 将用户信息存储到 localStorage
2. WHEN 页面加载 THEN THE System SHALL 从 localStorage 读取用户信息
3. WHEN 用户点击"退出登录" THEN THE System SHALL 清除 localStorage 并更新 UI

### Requirement 5: 密码安全

**User Story:** 作为系统，我需要安全地存储用户密码，以保护用户隐私

#### Acceptance Criteria

1. WHEN 用户注册 THEN THE Authentication_System SHALL 使用 bcrypt 加密密码
2. WHEN 用户登录 THEN THE Authentication_System SHALL 使用 bcrypt 验证密码
3. THE System SHALL NOT 在客户端或日志中暴露明文密码
