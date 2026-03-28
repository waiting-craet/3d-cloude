# Vercel 部署指南

## 问题说明

在 Vercel 部署时遇到 `DATABASE_URL 环境变量未设置` 错误，这是因为构建时 Prisma 客户端需要数据库连接。

## 解决方案

### 1. 在 Vercel 中配置环境变量

登录 Vercel 控制台，进入你的项目设置：

1. 进入项目 → Settings → Environment Variables
2. 添加以下环境变量：

```
DATABASE_URL=your_neon_database_url
```

**重要提示：**
- 确保在 **Production**、**Preview** 和 **Development** 三个环境都添加此变量
- 使用你的 Neon PostgreSQL 连接字符串

### 2. Neon 数据库连接字符串格式

```
postgresql://username:password@host/database?sslmode=require
```

示例：
```
postgresql://user:pass@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3. 获取 Neon 连接字符串

1. 登录 [Neon Console](https://console.neon.tech)
2. 选择你的项目
3. 在 Dashboard 中找到 "Connection String"
4. 复制完整的连接字符串

### 4. 重新部署

配置好环境变量后：

1. 在 Vercel 控制台点击 "Redeploy"
2. 或者推送新的提交触发自动部署

```bash
git add .
git commit -m "Fix: Configure database for Vercel deployment"
git push
```

## 代码修改说明

我们已经修改了 `lib/db.ts`，使其在构建时不会因为缺少 `DATABASE_URL` 而失败：

- 构建时：允许 `DATABASE_URL` 不存在，只显示警告
- 运行时：实际使用数据库时才会检查连接

## 验证部署

部署成功后，访问以下端点验证：

- `https://your-app.vercel.app/api/nodes` - 应该返回节点列表
- `https://your-app.vercel.app/api/edges` - 应该返回边列表

## 常见问题

### Q: 部署成功但 API 返回 500 错误？

A: 检查 Vercel 日志，确认：
1. `DATABASE_URL` 环境变量已正确设置
2. Neon 数据库可以从外部访问
3. 数据库 schema 已经同步（运行 `prisma db push`）

### Q: 如何在 Vercel 中运行数据库迁移？

A: Vercel 不支持在构建时运行迁移。建议：
1. 在本地运行 `npx prisma db push`
2. 或使用 Neon 的 SQL Editor 手动执行迁移

### Q: 本地开发和 Vercel 使用不同的数据库？

A: 是的，推荐配置：
- 本地开发：SQLite (`file:./dev.db`)
- Vercel 部署：Neon PostgreSQL

在 `.env.local` 中使用 SQLite，在 Vercel 环境变量中使用 PostgreSQL。

## 下一步

部署成功后，你可以：

1. 配置自定义域名
2. 设置 CI/CD 自动部署
3. 监控应用性能和错误日志
4. 配置 Vercel Analytics

## 相关文档

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
