# 数据库切换指南

本项目支持在 Neon PostgreSQL 和本地 MySQL 之间切换。

## 当前配置：Neon PostgreSQL ✅

---

## 切换到本地 MySQL

### 步骤 1：停止开发服务器
```bash
# 按 Ctrl+C 停止服务器
```

### 步骤 2：备份当前 Prisma schema
```bash
cp prisma/schema.prisma prisma/schema.postgresql.prisma
```

### 步骤 3：使用 MySQL schema
```bash
cp prisma/schema.mysql.prisma prisma/schema.prisma
```

### 步骤 4：更新环境变量
```bash
# 方法 1：直接修改 .env.local
# 将 DATABASE_URL 改为：
DATABASE_URL="mysql://root:dhlab431@localhost:3306/neondb"

# 方法 2：使用备份的 .env.mysql
cp .env.mysql .env.local
```

### 步骤 5：重新生成 Prisma Client
```bash
npx prisma generate
```

### 步骤 6：启动开发服务器
```bash
npm run dev
```

### 步骤 7：更新所有 API 文件中的字段名
MySQL 使用小写表名，关系字段名也会变成单数形式：
- `graphs` → `graph`
- `nodes` → `node`
- `edges` → `edge`
- `_count.graphs` → `_count.graph`

已提供自动修复脚本：
```bash
node fix-all-field-names.js
```

---

## 切换回 Neon PostgreSQL

### 步骤 1：停止开发服务器
```bash
# 按 Ctrl+C 停止服务器
```

### 步骤 2：恢复 PostgreSQL schema
```bash
# 如果有备份
cp prisma/schema.postgresql.prisma prisma/schema.prisma

# 或者从 Git 恢复
git checkout prisma/schema.prisma
```

### 步骤 3：更新环境变量
在 `.env.local` 中设置：
```bash
DATABASE_URL="postgresql://neondb_owner:npg_N5Dm4sGEpRjM@ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 步骤 4：重新生成 Prisma Client
```bash
npx prisma generate
```

### 步骤 5：恢复 API 文件中的字段名
PostgreSQL 使用大写表名，关系字段名是复数形式：
- `graph` → `graphs`
- `node` → `nodes`
- `edge` → `edges`
- `_count.graph` → `_count.graphs`

如果之前修改过，需要手动恢复或从 Git 恢复。

### 步骤 6：启动开发服务器
```bash
npm run dev
```

---

## 关键差异对比

| 特性 | PostgreSQL (Neon) | MySQL (本地) |
|------|-------------------|--------------|
| 表名 | PascalCase (Project, Graph, Node) | lowercase (project, graph, node) |
| 关系字段 | 复数 (graphs, nodes, edges) | 单数 (graph, node, edge) |
| JSON 类型 | `Json` | `String` (需要序列化) |
| 数组类型 | `String[]` | `String` (需要序列化) |
| 时间戳 | `DateTime` | `DateTime @db.DateTime(0)` |
| UUID 生成 | `@default(uuid())` | `@default(uuid())` |

---

## 备份文件说明

- `prisma/schema.mysql.prisma` - MySQL 版本的 Prisma schema
- `.env.mysql` - MySQL 数据库连接配置
- `database-schema.sql` - MySQL 数据库 SQL 脚本
- `database-schema-simple.sql` - 简化版 MySQL SQL 脚本
- `database-schema-step-by-step.sql` - 分步执行版 MySQL SQL 脚本

---

## 故障排除

### 问题 1：Prisma generate 失败
**错误**：`EPERM: operation not permitted`

**解决方案**：
1. 停止所有开发服务器
2. 删除 `node_modules/.prisma` 文件夹
3. 重新运行 `npx prisma generate`

### 问题 2：API 返回 500 错误
**错误**：`the URL must start with the protocol mysql://` 或 `postgresql://`

**解决方案**：
1. 检查 `.env.local` 中的 `DATABASE_URL` 是否正确
2. 确保 Prisma schema 中的 `provider` 与数据库 URL 匹配
3. 重新生成 Prisma Client

### 问题 3：字段名不匹配
**错误**：`Invalid field name` 或 `Property does not exist`

**解决方案**：
1. 检查 API 文件中使用的字段名
2. MySQL 使用单数形式：`graph`, `node`, `edge`
3. PostgreSQL 使用复数形式：`graphs`, `nodes`, `edges`
4. 运行 `node verify-field-names.js` 检查所有文件

### 问题 4：创建记录时缺少 ID
**错误**：`Argument 'id' is missing`

**解决方案**：
确保 Prisma schema 中所有模型的 `id` 字段都有 `@default(uuid())`：
```prisma
model Project {
  id String @id @default(uuid())
  // ...
}
```

---

## 快速切换命令

### 切换到 MySQL
```bash
# 一键切换脚本（需要先创建）
./switch-to-mysql.sh
```

### 切换到 PostgreSQL
```bash
# 一键切换脚本（需要先创建）
./switch-to-postgresql.sh
```

---

## 注意事项

1. **数据不会自动同步**：切换数据库后，两个数据库的数据是独立的
2. **API 代码需要调整**：字段名在两个数据库中不同
3. **测试后再切换**：在生产环境切换前，请在开发环境充分测试
4. **备份数据**：切换前请备份重要数据

---

## 联系支持

如果遇到问题，请查看：
- `MYSQL-MIGRATION-COMPLETE.md` - MySQL 迁移完整指南
- `MYSQL-FIELD-MAPPING.md` - 字段映射参考
- `DATABASE-MIGRATION-SUMMARY.md` - 迁移总结
