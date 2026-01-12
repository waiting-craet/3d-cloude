# 迁移到 Neon PostgreSQL 指南

## 步骤 1: 创建 Neon 数据库

1. 访问 https://neon.tech
2. 注册/登录账号
3. 创建新项目
4. 复制连接字符串（格式：`postgresql://user:password@host/database?sslmode=require`）

## 步骤 2: 更新 Prisma Schema

编辑 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 步骤 3: 更新数据库连接

编辑 `lib/db.ts`：

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL 环境变量未设置')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool)
  
  return new PrismaClient({ adapter })
}
```

## 步骤 4: 安装依赖

```bash
npm install @prisma/adapter-neon @neondatabase/serverless
```

## 步骤 5: 更新环境变量

本地开发 (`.env.local`):
```
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

Cloudflare Pages 控制台:
- 添加环境变量 `DATABASE_URL`
- 粘贴 Neon 连接字符串

## 步骤 6: 推送数据库结构

```bash
npx prisma db push
```

## 步骤 7: 填充示例数据（可选）

```bash
npx tsx scripts/seed.ts
```

## 步骤 8: 启用 Edge Runtime

编辑 `next.config.js`:

```javascript
const nextConfig = {
  experimental: {
    runtime: 'edge',
  },
}
```

在所有 API 路由中添加:
```typescript
export const runtime = 'edge'
```

## 注意事项

- Neon 提供免费套餐（500MB 存储）
- 连接字符串包含密码，不要提交到 Git
- Edge Runtime 不支持某些 Node.js API
- Prisma 需要使用 Neon adapter 才能在 Edge Runtime 中工作
