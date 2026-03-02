# 数据库连接问题修复指南

## 问题描述

创建项目时出现 500 错误，错误信息：
```
Error: P1001: Can't reach database server at `ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech:5432`
```

## 原因分析

数据库服务器无法连接，可能的原因：

1. **Neon 数据库暂停** - Neon 免费版在不活动一段时间后会自动暂停数据库
2. **网络连接问题** - 无法访问 AWS 上的 Neon 服务器
3. **防火墙/代理限制** - 网络环境阻止了数据库连接
4. **数据库凭证过期** - 连接字符串可能已失效

## 解决方案

### 方案 1: 唤醒 Neon 数据库（推荐）

Neon 免费版数据库在不活动后会自动暂停，需要手动唤醒：

1. **访问 Neon 控制台**
   - 打开 https://console.neon.tech/
   - 登录您的账号

2. **找到您的项目**
   - 在项目列表中找到 `neondb` 项目
   - 点击进入项目详情

3. **唤醒数据库**
   - 如果看到 "Database is suspended" 或类似提示
   - 点击 "Resume" 或 "Wake up" 按钮
   - 等待几秒钟，数据库会重新启动

4. **测试连接**
   ```bash
   npx prisma db push
   ```

### 方案 2: 使用本地 SQLite 数据库（快速测试）

如果需要快速测试功能，可以临时切换到本地 SQLite：

1. **修改 `.env` 文件**
   ```env
   # 注释掉 Neon 数据库
   # DATABASE_URL="postgresql://neondb_owner:npg_N5Dm4sGEpRjM@ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

   # 启用本地 SQLite
   DATABASE_URL="file:./dev.db"
   ```

2. **修改 `prisma/schema.prisma`**
   ```prisma
   datasource db {
     provider = "sqlite"  // 改为 sqlite
     url      = env("DATABASE_URL")
   }
   ```

3. **运行迁移**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **重启开发服务器**
   ```bash
   npm run dev
   ```

### 方案 3: 检查网络连接

1. **测试网络连接**
   ```bash
   ping ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech
   ```

2. **检查防火墙设置**
   - 确保防火墙允许访问端口 5432
   - 如果使用公司网络，可能需要配置代理

3. **尝试使用 VPN**
   - 如果在中国大陆，可能需要使用 VPN 访问 AWS 服务

### 方案 4: 更新数据库连接字符串

如果凭证已过期，需要重新获取：

1. **访问 Neon 控制台**
   - https://console.neon.tech/

2. **获取新的连接字符串**
   - 进入项目详情
   - 点击 "Connection Details"
   - 复制新的连接字符串

3. **更新 `.env` 文件**
   ```env
   DATABASE_URL="新的连接字符串"
   ```

4. **重启服务器**

## 验证修复

修复后，运行以下命令验证：

```bash
# 1. 测试数据库连接
npx prisma db push

# 2. 查看数据库状态
npx prisma migrate status

# 3. 启动开发服务器
npm run dev
```

## 推荐的长期解决方案

### 使用 Neon 的自动唤醒功能

Neon 提供了自动唤醒功能，可以在收到请求时自动启动数据库：

1. **在 Neon 控制台中启用自动唤醒**
   - 项目设置 → Compute → Auto-suspend
   - 设置合理的暂停时间（如 5 分钟）

2. **添加连接重试逻辑**

在 `3d-cloude/lib/prisma.ts` 中添加：

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 添加连接重试逻辑
export async function connectWithRetry(maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect()
      console.log('✅ 数据库连接成功')
      return true
    } catch (error) {
      console.log(`⚠️ 数据库连接失败 (尝试 ${i + 1}/${maxRetries})`)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  console.error('❌ 数据库连接失败，已达到最大重试次数')
  return false
}
```

### 升级到 Neon Pro（付费方案）

如果需要更稳定的服务：

- Neon Pro 提供更长的活动时间
- 更快的唤醒速度
- 更好的性能和可靠性

## 当前状态

根据错误信息，您的数据库很可能是**暂停状态**。

**建议操作**：
1. 访问 Neon 控制台唤醒数据库（最快）
2. 或者临时切换到本地 SQLite 进行开发

## 相关文件

- `.env` - 数据库连接配置
- `prisma/schema.prisma` - 数据库模型定义
- `app/api/projects/route.ts` - 创建项目的 API

## 需要帮助？

如果问题仍然存在，请提供：
1. Neon 控制台的数据库状态截图
2. 完整的错误日志
3. 网络环境信息（是否使用代理/VPN）
