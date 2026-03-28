# 数据库使用指南

## 📋 目录
- [快速开始](#快速开始)
- [数据库命令](#数据库命令)
- [常见操作](#常见操作)
- [故障排除](#故障排除)

---

## 🚀 快速开始

### 1. 检查数据库连接

最快速的方式检查数据库是否正常：

```bash
npm run db:quick-check
```

输出示例：
```
🔍 快速数据库检查...
✅ 数据库连接: 正常
📊 数据统计:
   项目: 6 个
   图谱: 7 个
   节点: 22 个
   边:   15 条
✅ 数据库状态: 正常
🟢 所有检查通过！
```

### 2. 完整数据库测试

运行完整的数据库和 Blob 存储测试：

```bash
npm run db:test-full
```

这将测试：
- ✅ PostgreSQL 连接
- ✅ 数据库读写操作
- ✅ Vercel Blob 存储
- ✅ 所有 CRUD 操作

### 3. 查看数据库详情

查看完整的数据库结构和数据：

```bash
npm run db:check
```

---

## 🛠️ 数据库命令

### 开发命令

| 命令 | 说明 | 用途 |
|------|------|------|
| `npm run db:quick-check` | 快速检查 | 日常检查数据库状态 |
| `npm run db:check` | 详细检查 | 查看完整数据结构 |
| `npm run db:test-full` | 完整测试 | 测试所有数据库功能 |
| `npm run db:studio` | 打开 Prisma Studio | 可视化管理数据库 |
| `npm run db:push` | 推送 schema | 更新数据库结构 |

### 测试命令

| 命令 | 说明 |
|------|------|
| `npm run db:test` | 测试基本连接 |
| `npm run db:test-blob` | 测试 Blob 存储 |
| `npm run db:seed` | 填充测试数据 |

---

## 📝 常见操作

### 查看数据库数据

使用 Prisma Studio（推荐）：

```bash
npm run db:studio
```

这会打开一个网页界面，你可以：
- 📊 查看所有表的数据
- ✏️ 编辑数据
- ➕ 添加新数据
- 🗑️ 删除数据

### 更新数据库结构

1. 修改 `prisma/schema.prisma` 文件
2. 运行推送命令：

```bash
npm run db:push
```

### 重置数据库

⚠️ **警告：这会删除所有数据！**

```bash
npx prisma db push --force-reset
```

### 备份数据库

使用 Neon 控制台进行备份：
1. 访问 [Neon Console](https://console.neon.tech/)
2. 选择你的项目
3. 点击 "Backups" 标签
4. 创建手动备份

---

## 🔧 故障排除

### 问题 1: 连接失败

**症状**：
```
❌ 数据库连接失败
Error: Can't reach database server
```

**解决方案**：
1. 检查 `.env` 文件中的 `DATABASE_URL` 是否正确
2. 确认网络连接正常
3. 检查 Neon 数据库是否在运行

```bash
# 快速检查
npm run db:quick-check
```

### 问题 2: Prisma Client 未生成

**症状**：
```
Error: @prisma/client did not initialize yet
```

**解决方案**：
```bash
npx prisma generate
```

### 问题 3: Schema 不同步

**症状**：
```
Error: Schema is out of sync
```

**解决方案**：
```bash
npm run db:push
```

### 问题 4: Blob 上传失败

**症状**：
```
Error: Blob upload failed
```

**解决方案**：
1. 检查 `BLOB_READ_WRITE_TOKEN` 是否正确
2. 确认 token 有写入权限
3. 检查文件大小是否超过限制

```bash
# 测试 Blob 连接
npm run db:test-blob
```

---

## 📊 数据库配置

### 当前配置

**数据库**: Neon PostgreSQL
```
主机: ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech
数据库: neondb
SSL: 启用
连接池: 启用
```

**存储**: Vercel Blob
```
Token: vercel_blob_rw_l68XKsC2rFHdhJpQ_3rRV4EhY6aOPIFFRJEQJUYhLkCUhBs
权限: 读写
```

### 环境变量

确保 `.env` 文件包含：

```env
# Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:npg_N5Dm4sGEpRjM@ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Vercel Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_l68XKsC2rFHdhJpQ_3rRV4EhY6aOPIFFRJEQJUYhLkCUhBs"
```

---

## 🎯 最佳实践

### 开发流程

1. **开始开发前**：
   ```bash
   npm run db:quick-check
   ```

2. **修改 schema 后**：
   ```bash
   npm run db:push
   npx prisma generate
   ```

3. **部署前**：
   ```bash
   npm run db:test-full
   ```

### 数据管理

1. **定期备份**：每周在 Neon 控制台创建备份
2. **清理测试数据**：定期删除不需要的测试项目
3. **监控使用量**：检查 Neon 和 Vercel Blob 的使用量

### 安全建议

1. ✅ 不要将 `.env` 文件提交到 Git
2. ✅ 定期更换数据库密码
3. ✅ 使用环境变量管理敏感信息
4. ✅ 在生产环境使用不同的数据库

---

## 📚 相关文档

- [Prisma 文档](https://www.prisma.io/docs)
- [Neon 文档](https://neon.tech/docs)
- [Vercel Blob 文档](https://vercel.com/docs/storage/vercel-blob)

---

## 🆘 获取帮助

如果遇到问题：

1. 运行诊断命令：
   ```bash
   npm run db:check
   ```

2. 查看错误日志

3. 检查 Neon 控制台的数据库状态

4. 查看 Vercel 控制台的 Blob 使用情况

---

**最后更新**: 2026-01-14  
**数据库状态**: 🟢 正常运行
