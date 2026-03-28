# Design Document

## Overview

用户认证系统设计，包含登录/注册模态框、API 路由、状态管理和密码加密。系统使用 bcrypt 加密密码，使用 localStorage 持久化登录状态。

## Architecture

```
┌─────────────────┐
│  TopNavbar      │ ← 登录按钮
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  LoginModal     │ ← 登录/注册表单
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  API Routes     │ ← /api/auth/register, /api/auth/login
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Neon Database  │ ← User 表
└─────────────────┘
```

## Components and Interfaces

### 1. LoginModal Component

**位置**: `components/LoginModal.tsx`

**Props**:
```typescript
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}
```

**功能**:
- 显示登录/注册表单
- 标签页切换（登录 ↔ 注册）
- 表单验证
- API 调用
- 错误提示

### 2. TopNavbar 更新

**新增功能**:
- 登录按钮（未登录时显示）
- 用户名显示（登录后显示）
- 退出登录按钮

### 3. API Routes

#### POST /api/auth/register

**Request**:
```typescript
{
  username: string;
  password: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  user?: {
    id: string;
    username: string;
  };
  error?: string;
}
```

**逻辑**:
1. 验证用户名是否已存在
2. 使用 bcrypt 加密密码
3. 生成唯一 ID (cuid)
4. 插入数据库
5. 返回用户信息（不含密码）

#### POST /api/auth/login

**Request**:
```typescript
{
  username: string;
  password: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  user?: {
    id: string;
    username: string;
  };
  error?: string;
}
```

**逻辑**:
1. 查询用户是否存在
2. 使用 bcrypt 验证密码
3. 返回用户信息（不含密码）

## Data Models

### User Table (Neon PostgreSQL)

```sql
CREATE TABLE "User" (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    avatar TEXT,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明**:
- `id`: 用户唯一标识 (cuid)
- `username`: 用户名（唯一）
- `password`: bcrypt 加密后的密码
- `name`: 显示名称（可选）
- `avatar`: 头像 URL（可选）
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### Client State (localStorage)

```typescript
interface StoredUser {
  id: string;
  username: string;
}
```

存储键: `currentUser`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 用户名唯一性

*For any* 两个注册请求，如果用户名相同，则第二个请求应该失败并返回错误

**Validates: Requirements 1.2, 1.4**

### Property 2: 密码加密存储

*For any* 注册的用户，数据库中存储的密码应该是 bcrypt 加密后的哈希值，而不是明文

**Validates: Requirements 5.1**

### Property 3: 登录验证正确性

*For any* 登录请求，当且仅当用户名存在且密码匹配时，登录应该成功

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 4: 登录状态持久化

*For any* 成功登录的用户，刷新页面后应该仍然保持登录状态

**Validates: Requirements 4.1, 4.2**

### Property 5: 注册后自动登录

*For any* 成功注册的用户，应该自动登录并关闭弹窗

**Validates: Requirements 1.5**

## Error Handling

### 注册错误

- 用户名已存在: `"用户名已被使用"`
- 用户名为空: `"请输入用户名"`
- 密码为空: `"请输入密码"`
- 密码过短: `"密码至少需要 6 个字符"`
- 数据库错误: `"注册失败，请稍后重试"`

### 登录错误

- 用户不存在: `"用户名或密码错误"`
- 密码错误: `"用户名或密码错误"`
- 用户名为空: `"请输入用户名"`
- 密码为空: `"请输入密码"`
- 数据库错误: `"登录失败，请稍后重试"`

## Testing Strategy

### Unit Tests

- 测试 bcrypt 密码加密和验证
- 测试 API 路由的错误处理
- 测试表单验证逻辑

### Property-Based Tests

使用 fast-check 库进行属性测试：

- 生成随机用户名和密码
- 验证注册后密码已加密
- 验证登录验证逻辑
- 验证用户名唯一性约束

每个测试运行至少 100 次迭代。

### Integration Tests

- 完整的注册流程测试
- 完整的登录流程测试
- 登录状态持久化测试
- 退出登录测试

## Security Considerations

1. **密码加密**: 使用 bcrypt (salt rounds = 10)
2. **SQL 注入防护**: 使用 Prisma ORM 参数化查询
3. **XSS 防护**: React 自动转义输出
4. **密码强度**: 最少 6 个字符（可扩展）
5. **错误信息**: 登录失败时不透露用户是否存在
