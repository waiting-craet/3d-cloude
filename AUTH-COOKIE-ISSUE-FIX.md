# 认证Cookie问题修复指南

## 问题描述

保存节点位置时收到 403 Forbidden 错误：
```
❌ [保存位置] 保存失败: 无权限修改此图谱
响应状态: 403
```

## 根本原因

前端和后端的认证机制不匹配：

1. **前端认证**：使用 localStorage 存储用户信息
   - `useUserStore` 从 localStorage 读取用户数据
   - `isLoggedIn` 状态基于 localStorage 中的数据

2. **后端认证**：使用 Cookie 验证用户身份
   - `/api/graphs/save-positions` 需要 `userId` cookie
   - `getCurrentUserId()` 从 `request.cookies.get('userId')` 读取
   - `verifyGraphOwnership()` 检查图谱是否属于该用户

3. **问题**：前端显示已登录，但后端看不到 `userId` cookie

## 临时解决方案（开发/测试）

### 方法 1：手动设置 Cookie

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 运行以下命令：

```javascript
// 替换 YOUR_USER_ID 为你的实际用户ID
document.cookie = "userId=YOUR_USER_ID; path=/; max-age=86400";
```

4. 刷新页面
5. 再次尝试保存节点位置

### 方法 2：查找你的用户ID

如果你不知道你的用户ID，可以：

1. 打开数据库管理工具
2. 查询 `User` 表：
```sql
SELECT id, username, email FROM User;
```
3. 找到你的用户记录，复制 `id` 字段
4. 使用方法1设置cookie

### 方法 3：检查现有Cookie

1. 打开开发者工具（F12）
2. 切换到 Application 标签
3. 左侧菜单：Storage → Cookies → 选择你的域名
4. 查看是否有 `userId` cookie
5. 如果没有，使用方法1添加

## 长期解决方案

需要实现完整的登录流程，确保登录时同时设置：
1. localStorage 中的用户数据（前端状态）
2. HttpOnly Cookie 中的 userId（后端验证）

### 实现步骤

1. **创建登录API** (`/api/auth/login`)：
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  
  // 验证用户凭据
  const user = await validateCredentials(username, password);
  
  if (!user) {
    return NextResponse.json(
      { error: '用户名或密码错误' },
      { status: 401 }
    );
  }
  
  // 设置 userId cookie
  const cookie = serialize('userId', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
  
  response.headers.set('Set-Cookie', cookie);
  
  return response;
}
```

2. **更新前端登录逻辑**：
```typescript
// 在登录组件中
const handleLogin = async (username: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (response.ok) {
    const data = await response.json();
    // Cookie 会自动设置，只需更新前端状态
    useUserStore.getState().login(data.user);
  }
};
```

3. **创建登出API** (`/api/auth/logout`)：
```typescript
export async function POST(request: NextRequest) {
  const cookie = serialize('userId', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // 立即过期
    path: '/',
  });
  
  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', cookie);
  
  return response;
}
```

## 验证修复

修复后，验证以下内容：

1. **Cookie 已设置**：
   - 开发者工具 → Application → Cookies
   - 应该看到 `userId` cookie

2. **保存功能正常**：
   - 拖拽节点
   - 点击保存按钮
   - 应该看到 "✅ 已保存" 提示

3. **控制台日志**：
```
🔄 [保存位置] 开始保存节点位置...
   图谱 ID: xxx
   节点数量: 5
📤 [保存位置] 发送请求: {...}
✅ [保存位置] 保存成功
```

## 相关文件

- 前端认证：`3d-cloude/lib/userStore.ts`
- 后端认证：`3d-cloude/lib/auth.ts`
- 保存API：`3d-cloude/app/api/graphs/save-positions/route.ts`
- TopNavbar：`3d-cloude/components/TopNavbar.tsx`

## 注意事项

1. **开发环境**：可以使用手动设置cookie的方式
2. **生产环境**：必须实现完整的登录流程
3. **安全性**：生产环境应使用 HttpOnly + Secure cookies
4. **会话管理**：考虑添加 token 过期和刷新机制
