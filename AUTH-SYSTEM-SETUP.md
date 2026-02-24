# 用户认证系统设置指南

## 已完成的改动

### 1. 数据库模型更新
- 更新了 `prisma/schema.prisma` 中的 User 模型
- 添加了 `password`、`username` 和 `lastLoginAt` 字段
- 添加了邮箱和用户名的唯一索引

### 2. 前端组件
- **LoginModal**: 登录弹窗，底部有"立即注册"链接
- **RegisterModal**: 注册弹窗，包含用户名、邮箱、密码和确认密码字段
- **TopNavbar**: 更新了状态管理，支持登录/注册弹窗切换

### 3. 后端 API
- **POST /api/auth/register**: 用户注册，验证并存储到数据库
- **POST /api/auth/login**: 用户登录，从数据库验证
- **POST /api/auth/logout**: 用户登出
- **GET /api/auth/me**: 获取当前用户信息

## 需要执行的步骤

### 1. 运行数据库迁移

```bash
npx prisma migrate dev --name add_user_authentication
```

这将：
- 更新数据库 schema
- 添加 password、username 和 lastLoginAt 字段到 User 表
- 创建必要的索引

### 2. 生成 Prisma Client

```bash
npx prisma generate
```

### 3. 测试功能

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 打开浏览器访问应用

3. 点击"登录"按钮

4. 点击"立即注册"链接进入注册页面

5. 填写注册信息：
   - 用户名：3-30个字符，只能包含字母、数字、下划线和连字符
   - 邮箱：有效的邮箱地址
   - 密码：至少8个字符，包含大小写字母和数字
   - 确认密码：必须与密码一致

6. 注册成功后会自动登录

7. 使用注册的账号登录

## 功能特性

### 注册功能
- ✅ 用户名、邮箱、密码验证
- ✅ 密码强度检查（至少8字符，包含大小写字母和数字）
- ✅ 密码确认匹配检查
- ✅ 邮箱和用户名唯一性检查
- ✅ 数据存储到数据库
- ✅ 密码哈希存储（简单实现，生产环境需要 bcrypt）

### 登录功能
- ✅ 邮箱和密码验证
- ✅ 从数据库查询用户
- ✅ 密码验证
- ✅ 更新最后登录时间
- ✅ 登录成功后显示用户名

### UI/UX
- ✅ 登录弹窗底部有"立即注册"链接
- ✅ 注册弹窗底部有"立即登录"链接
- ✅ 密码显示/隐藏切换
- ✅ 实时错误提示
- ✅ 加载状态显示
- ✅ 表单验证

## 安全注意事项

### 当前实现（临时）
- 使用简单的 Base64 编码存储密码
- 没有实现真正的会话管理

### 生产环境需要改进
1. **密码哈希**: 使用 bcrypt 替代简单的 Base64 编码
   ```bash
   npm install bcryptjs
   npm install --save-dev @types/bcryptjs
   ```

2. **会话管理**: 实现 JWT 或其他会话机制
   ```bash
   npm install jose
   ```

3. **HTTPS**: 生产环境必须使用 HTTPS

4. **CSRF 保护**: 添加 CSRF token

5. **速率限制**: 防止暴力破解

6. **邮箱验证**: 添加邮箱验证流程

## 下一步

如果需要完整的生产级认证系统，请参考 `.kiro/specs/user-authentication/` 目录中的规范文档，按照 `tasks.md` 中的任务列表实现：

1. 安装 bcryptjs 和 jose
2. 实现 PasswordService（密码哈希）
3. 实现 SessionService（JWT 会话管理）
4. 实现 AuthService（完整的认证逻辑）
5. 添加会话验证中间件
6. 实现完整的错误处理
7. 添加单元测试和属性测试

## 故障排除

### 数据库连接错误
确保 `.env` 文件中的 `DATABASE_URL` 正确配置。

### Prisma Client 错误
运行 `npx prisma generate` 重新生成 Prisma Client。

### 迁移失败
如果迁移失败，可以尝试：
```bash
npx prisma db push
```

这会直接推送 schema 更改到数据库，跳过迁移历史。
