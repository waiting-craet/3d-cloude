# 数据库迁移指南

## 问题诊断

### 症状
部署后的网站无法加载已有的项目和图谱数据。

### 根本原因
旧数据是在项目-图谱系统实现之前创建的，节点和边的 `projectId` 和 `graphId` 字段为 `null`，导致 API 无法返回这些数据。

### 诊断结果
```
节点未关联项目: 23
节点未关联图谱: 23
边未关联项目: 12
边未关联图谱: 12
```

## 解决方案

### 1. 数据迁移（已完成 ✅）

运行迁移脚本将旧数据关联到新的项目-图谱系统：

```bash
npx tsx scripts/migrate-old-data.ts
```

**迁移结果：**
- ✅ 创建了 "历史数据" 项目
- ✅ 创建了 "默认图谱" 图谱
- ✅ 迁移了 23 个节点
- ✅ 迁移了 12 条边
- ✅ 所有数据关联完整

### 2. 验证迁移

运行检查脚本验证数据完整性：

```bash
npx tsx scripts/check-database.ts
```

**验证结果：**
```
✅ 找到 4 个项目
   - 历史数据 (23 节点, 12 边, 1 图谱)
   - 测试项目 (6 节点, 4 边, 2 图谱)
   - 测试项目2 (4 节点, 3 边, 1 图谱)
   - 测试项目3 (0 节点, 0 边, 1 图谱)

✅ 所有数据关联完整
```

## 部署到 Vercel

### 前提条件

确保 Vercel 环境变量已配置：

1. **DATABASE_URL** - Neon PostgreSQL 连接字符串
   ```
   postgresql://neondb_owner:npg_N5Dm4sGEpRjM@ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

2. **BLOB_READ_WRITE_TOKEN** - Vercel Blob 存储 Token
   ```
   vercel_blob_rw_l68XKsC2rFHdhJpQ_3rRV4EhY6aOPIFFRJEQJUYhLkCUhBs
   ```

### 部署步骤

1. **提交代码**
   ```bash
   git add .
   git commit -m "fix: 修复数据库数据关联问题"
   git push
   ```

2. **Vercel 自动部署**
   - Vercel 会自动检测到代码变更
   - 等待构建和部署完成

3. **验证部署**
   访问部署后的网站，检查：
   - ✅ 点击 "现有图谱" 下拉框
   - ✅ 应该能看到 4 个项目
   - ✅ 展开 "历史数据" 项目
   - ✅ 应该能看到 "默认图谱" (23 节点, 12 边)
   - ✅ 点击切换到该图谱
   - ✅ 应该能看到所有节点和边

## 数据库结构

### 当前数据概览

```
项目总数: 4
图谱总数: 5
节点总数: 33
边总数: 19

项目列表:
1. 历史数据
   └── 默认图谱 (23 节点, 12 边)

2. 测试项目
   ├── 知识图谱A (3 节点, 2 边)
   └── 知识图谱B (3 节点, 2 边)

3. 测试项目2
   └── 测试 (4 节点, 3 边)

4. 测试项目3
   └── 测试项目3 (0 节点, 0 边)
```

## 常见问题

### Q1: 为什么部署后看不到数据？

**A:** 数据库连接正常，但旧数据没有关联到项目和图谱。运行迁移脚本即可解决。

### Q2: 迁移会影响现有数据吗？

**A:** 不会。迁移脚本只更新未关联的数据（`projectId` 或 `graphId` 为 `null` 的数据），已关联的数据不受影响。

### Q3: 如何在生产环境运行迁移？

**A:** 有两种方式：

**方式 1: 本地运行（推荐）**
```bash
# 确保 .env 中的 DATABASE_URL 指向生产数据库
npx tsx scripts/migrate-old-data.ts
```

**方式 2: 使用 Vercel CLI**
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 在项目目录运行
vercel env pull .env.production
DATABASE_URL=$(cat .env.production | grep DATABASE_URL | cut -d '=' -f2) npx tsx scripts/migrate-old-data.ts
```

### Q4: 迁移后如何清理测试数据？

**A:** 可以通过网站的管理员功能删除不需要的项目和图谱：

1. 登录管理员账号
2. 点击 "现有图谱" 下拉框
3. 点击项目或图谱旁边的删除按钮

或使用 Prisma Studio：
```bash
npm run db:studio
```

## 脚本说明

### check-database.ts
检查数据库连接和数据完整性，用于诊断问题。

**功能：**
- 测试数据库连接
- 统计项目、图谱、节点、边数量
- 检查数据关联完整性
- 模拟 API 查询

**使用：**
```bash
npx tsx scripts/check-database.ts
```

### migrate-old-data.ts
将未关联的节点和边迁移到项目-图谱系统。

**功能：**
- 检测未关联的数据
- 创建或使用 "历史数据" 项目
- 创建或使用 "默认图谱" 图谱
- 批量更新节点和边
- 更新统计信息
- 验证迁移结果

**使用：**
```bash
npx tsx scripts/migrate-old-data.ts
```

## 后续优化建议

1. **数据整理**
   - 将 "历史数据" 中的节点重新分类到合适的项目
   - 删除不需要的测试数据

2. **性能优化**
   - 为大型图谱添加分页加载
   - 使用 Redis 缓存热门图谱数据

3. **数据备份**
   - 定期备份 Neon 数据库
   - 使用 Neon 的分支功能进行测试

4. **监控告警**
   - 设置 Vercel 函数日志监控
   - 添加数据库连接失败告警

## 相关文档

- [VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md) - Vercel 部署指南
- [PROJECT-GRAPH-API-GUIDE.md](./PROJECT-GRAPH-API-GUIDE.md) - API 使用指南
- [快速开始-项目图谱系统.md](./快速开始-项目图谱系统.md) - 系统使用指南

---

**迁移完成时间：** 2026-01-14
**状态：** ✅ 已完成并验证
