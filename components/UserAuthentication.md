# 用户认证系统文档

## 概述

这是一个完整的用户认证系统，包含登录、注册、用户状态管理、会话持久化和自动状态检查功能。

## 核心组件

### 1. UserStore (lib/userStore.ts)

Zustand状态管理器，负责用户状态和认证令牌管理。

**功能特性：**
- 用户信息存储和更新
- 认证令牌管理（包含过期时间和刷新令牌）
- localStorage持久化
- 自动令牌过期检查
- 令牌刷新机制

**主要方法：**
```typescript
const { user, isLoggedIn, login, logout, updateUser, checkTokenExpiration } = useUserStore()
```

### 2. AuthProvider (components/AuthProvider.tsx)

认证提供者组件，处理应用级别的认证状态管理。

**功能特性：**
- 应用启动时自动初始化认证状态
- 定期验证令牌有效性
- 页面可见性变化时重新验证
- 多标签页同步
- 网络状态变化处理

**使用方法：**
```tsx
import AuthProvider from '@/components/AuthProvider'

export default function App({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
```

### 3. LoginModal (components/LoginModal.tsx)

增强的登录/注册模态框。

**功能特性：**
- 统一的登录和注册界面
- 实时表单验证
- 密码可见性切换
- 加载状态和错误处理
- 键盘导航支持
- 无障碍访问优化

### 4. UserProfile (components/UserProfile.tsx)

用户资料管理组件。

**功能特性：**
- 用户信息显示和编辑
- 头像上传功能
- 表单验证
- 加载状态管理

### 5. EnhancedNavbar (components/EnhancedNavbar.tsx)

增强的导航栏，集成用户认证功能。

**功能特性：**
- 用户头像和菜单
- 登录状态指示
- 响应式设计
- 移动端适配

## 使用指南

### 基本设置

1. **在应用根部添加 AuthProvider：**

```tsx
// app/layout.tsx
import AuthProvider from '@/components/AuthProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

2. **在组件中使用认证状态：**

```tsx
import { useAuthStatus } from '@/components/AuthProvider'

function MyComponent() {
  const { isLoggedIn, user, isInitialized } = useAuthStatus()
  
  if (!isInitialized) return <div>加载中...</div>
  
  return (
    <div>
      {isLoggedIn ? (
        <p>欢迎, {user?.username}!</p>
      ) : (
        <p>请登录</p>
      )}
    </div>
  )
}
```

3. **创建受保护的页面：**

```tsx
import { withAuth } from '@/components/AuthProvider'

const ProtectedPage = withAuth(() => {
  return <div>这是受保护的内容</div>
})

export default ProtectedPage
```

### API 端点要求

认证系统需要以下API端点：

#### POST /api/auth/login
```json
// 请求
{
  "username": "string",
  "password": "string"
}

// 响应
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "avatar": "string",
    "createdAt": "string"
  },
  "token": "string",
  "expiresIn": 3600,
  "refreshToken": "string"
}
```

#### POST /api/auth/register
```json
// 请求
{
  "username": "string",
  "password": "string",
  "email": "string"
}

// 响应 - 同登录响应
```

#### POST /api/auth/validate
```json
// 请求头
Authorization: Bearer <token>

// 响应
{
  "success": true,
  "user": { /* 用户信息 */ }
}
```

#### POST /api/auth/refresh
```json
// 请求
{
  "refreshToken": "string"
}

// 响应
{
  "success": true,
  "token": "string",
  "expiresIn": 3600,
  "refreshToken": "string"
}
```

#### PUT /api/user/profile
```json
// 请求
{
  "username": "string",
  "email": "string"
}

// 响应
{
  "success": true,
  "user": { /* 更新后的用户信息 */ }
}
```

#### POST /api/user/avatar
```
// 请求：FormData with 'avatar' file field

// 响应
{
  "success": true,
  "avatarUrl": "string"
}
```

## 安全特性

### 1. 令牌管理
- JWT令牌自动过期检查
- 刷新令牌机制
- 安全的localStorage存储

### 2. 表单验证
- 客户端实时验证
- 服务端验证支持
- XSS防护

### 3. 会话管理
- 自动登录状态检查
- 多标签页同步
- 页面可见性检测

### 4. 错误处理
- 网络错误恢复
- 令牌过期处理
- 用户友好的错误消息

## 自定义配置

### 令牌过期时间
```typescript
// 在 userStore.ts 中修改
const MAX_LOGIN_AGE = 30 * 24 * 60 * 60 * 1000 // 30天
```

### 验证间隔
```typescript
// 在 AuthProvider.tsx 中修改
const interval = setInterval(validatePeriodically, 10 * 60 * 1000) // 10分钟
```

### 头像颜色
```typescript
// 在 EnhancedNavbar.tsx 中修改 getAvatarColor 函数
const colors = ['bg-red-500', 'bg-blue-500', /* 更多颜色 */]
```

## 最佳实践

1. **始终使用 AuthProvider 包装应用**
2. **在需要认证的页面使用 withAuth HOC**
3. **使用 useAuthStatus 获取认证状态**
4. **处理加载状态和错误情况**
5. **实现适当的服务端验证**
6. **定期更新安全策略**

## 故障排除

### 常见问题

1. **用户状态不同步**
   - 确保 AuthProvider 在应用根部
   - 检查 localStorage 权限

2. **令牌验证失败**
   - 检查 API 端点实现
   - 验证令牌格式

3. **页面刷新后丢失状态**
   - 检查 localStorage 存储
   - 确保 initializeFromStorage 被调用

4. **多标签页不同步**
   - 检查 storage 事件监听
   - 验证 localStorage 键名一致性

## 更新日志

### v1.0.0
- 基础认证功能
- 登录/注册模态框
- 用户状态管理

### v2.0.0
- 增强的用户体验
- 自动状态检查
- 令牌刷新机制
- 用户资料管理
- 响应式设计优化