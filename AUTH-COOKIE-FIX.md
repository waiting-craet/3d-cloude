# 认证Cookie修复说明

## 问题描述

之前的实现中，用户登录后信息只存储在前端的localStorage中，后端API无法获取用户身份，导致创建项目时出现"用户未登录"错误。

## 解决方案

修改了认证API，在用户登录/注册时设置HttpOnly cookie，使后端能够识别用户身份。

## 修改的文件

### 1. `app/api/auth/login/route.ts`
- 登录成功后设置`userId` cookie
- Cookie配置：
  - `httpOnly: true` - 防止JavaScript访问，提高安全性
  - `secure: true` (生产环境) - 只在HTTPS下传输
  - `sameSite: 'lax'` - 防止CSRF攻击
  - `maxAge: 30天` - Cookie有效期
  - `path: '/'` - 全站可用

### 2. `app/api/auth/register/route.ts`
- 注册成功后自动设置`userId` cookie
- 用户注册后无需再次登录

### 3. `app/api/auth/logout/route.ts`
- 登出时删除`userId` cookie
- 确保用户完全登出

## Cookie工作流程

```
用户登录/注册
    ↓
服务器设置 userId cookie
    ↓
浏览器自动在后续请求中携带cookie
    ↓
后端API从cookie中读取userId
    ↓
验证用户身份和权限
```

## 使用说明

### 用户需要做什么

1. **重新登录**：如果之前已经登录，需要重新登录以设置cookie
2. **清除旧数据**（可选）：可以清除浏览器localStorage中的旧数据

### 开发者需要知道什么

1. **Cookie读取**：
   ```typescript
   const userId = request.cookies.get('userId')?.value;
   ```

2. **Cookie设置**：
   ```typescript
   response.cookies.set('userId', user.id, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: 60 * 60 * 24 * 30,
     path: '/'
   });
   ```

3. **Cookie删除**：
   ```typescript
   response.cookies.delete('userId');
   ```

## 安全考虑

1. **HttpOnly Cookie**：
   - JavaScript无法访问，防止XSS攻击窃取用户身份
   - 只能通过HTTP请求传输

2. **Secure Flag**：
   - 生产环境下只在HTTPS连接中传输
   - 防止中间人攻击

3. **SameSite**：
   - 设置为'lax'，防止CSRF攻击
   - 允许从外部链接导航时携带cookie

4. **有效期**：
   - 30天后自动过期
   - 用户需要重新登录

## 测试步骤

1. **清除现有cookie**：
   - 打开浏览器开发者工具
   - Application → Cookies → 删除所有cookie

2. **重新登录**：
   - 访问登录页面
   - 输入用户名和密码
   - 登录成功

3. **验证cookie**：
   - 开发者工具 → Application → Cookies
   - 应该看到`userId` cookie

4. **测试创建项目**：
   - 访问Creation页面
   - 点击"新建图谱"
   - 应该能成功创建项目

## 故障排除

### 问题1：仍然显示"用户未登录"

**解决方案**：
1. 清除所有cookie
2. 重新登录
3. 检查浏览器是否阻止了cookie

### 问题2：Cookie没有设置

**可能原因**：
1. 浏览器隐私设置阻止了第三方cookie
2. 开发环境下HTTPS配置问题

**解决方案**：
1. 检查浏览器cookie设置
2. 确保允许本地开发的cookie

### 问题3：登出后仍然能访问

**解决方案**：
1. 确保调用了logout API
2. 检查cookie是否被正确删除
3. 刷新页面

## 与前端状态管理的关系

- **localStorage**：仍然用于前端状态管理（用户信息显示等）
- **Cookie**：用于后端身份验证
- **两者独立**：登录时同时设置localStorage和cookie

## 后续改进建议

1. **JWT Token**：
   - 使用JWT替代简单的userId cookie
   - 包含更多用户信息和权限
   - 支持token刷新机制

2. **Session管理**：
   - 实现服务器端session存储
   - 支持多设备登录管理
   - 添加session过期检查

3. **双因素认证**：
   - 添加2FA支持
   - 提高账户安全性

## 相关文件

- `lib/auth.ts` - 认证工具函数
- `app/api/auth/login/route.ts` - 登录API
- `app/api/auth/register/route.ts` - 注册API
- `app/api/auth/logout/route.ts` - 登出API
- `app/api/projects/route.ts` - 项目API（使用认证）

## 总结

通过添加HttpOnly cookie，我们实现了：
- ✅ 后端能够识别用户身份
- ✅ 提高了安全性（HttpOnly + Secure + SameSite）
- ✅ 用户体验更好（自动携带认证信息）
- ✅ 符合Web安全最佳实践

现在用户登录后，所有需要认证的API都能正常工作！
