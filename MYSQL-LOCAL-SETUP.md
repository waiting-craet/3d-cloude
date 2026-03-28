# 本地 MySQL 数据库配置完成

## ✅ 已完成的配置

### 1. Prisma Schema 更新
- 数据库提供商已从 `postgresql` 切换到 `mysql`
- 文件位置：`prisma/schema.prisma`

### 2. 环境变量更新
- `.env` 文件已更新为本地 MySQL 连接
- 连接字符串：`mysql://root:dhlab431@localhost:3306/neondb`

## 📋 后续步骤

### 1. 重新生成 Prisma Client

在项目根目录执行：

```bash
cd 3d-cloude
npx prisma generate
```

### 2. 验证数据库连接

```bash
npx prisma db pull
```

这会从你的 MySQL 数据库拉取现有的表结构，验证连接是否正常。

### 3. 测试数据库连接

创建一个测试脚本或直接运行：

```bash
npx prisma studio
```

这会打开 Prisma Studio，你可以在浏览器中查看和管理数据库。

### 4. 启动开发服务器

```bash
npm run dev
```

## 🔧 数据库连接信息

- **主机**: localhost
- **端口**: 3306
- **数据库名**: neondb
- **用户名**: root
- **密码**: dhlab431

## 📊 数据库表结构

你的 MySQL 数据库应该包含以下 6 个表：

1. **Project** - 项目管理
2. **Graph** - 知识图谱
3. **Node** - 图谱节点
4. **Edge** - 节点关系边
5. **User** - 用户认证
6. **SearchHistory** - 搜索历史

## ⚠️ 注意事项

### 数据类型差异

MySQL 和 PostgreSQL 之间有一些数据类型差异：

- PostgreSQL 的 `TEXT` 在 MySQL 中对应 `TEXT` 或 `LONGTEXT`
- PostgreSQL 的 `BOOLEAN` 在 MySQL 中对应 `TINYINT(1)`
- PostgreSQL 的 `TIMESTAMP` 在 MySQL 中对应 `DATETIME`

### 如果遇到问题

1. **Prisma Client 生成失败**
   ```bash
   npm install @prisma/client
   npx prisma generate
   ```

2. **连接失败**
   - 检查 MySQL 服务是否运行
   - 验证密码是否正确
   - 确认 neondb 数据库已创建

3. **表结构不匹配**
   ```bash
   npx prisma db push
   ```
   这会将 Prisma schema 推送到数据库（谨慎使用，会修改数据库结构）

## 🔄 切换回 Neon PostgreSQL

如果需要切换回 Neon 数据库：

1. 修改 `prisma/schema.prisma`：
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. 修改 `.env`：
   ```
   DATABASE_URL="postgresql://neondb_owner:npg_N5Dm4sGEpRjM@ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
   ```

3. 重新生成 Prisma Client：
   ```bash
   npx prisma generate
   ```

## 📝 环境变量文件说明

- `.env` - 本地开发环境（现在使用 MySQL）
- `.env.local` - 备份的 Neon PostgreSQL 配置
- `.env.example` - 示例配置文件

## ✨ 完成！

你的应用现在已配置为使用本地 MySQL 数据库。运行 `npm run dev` 启动开发服务器即可。
