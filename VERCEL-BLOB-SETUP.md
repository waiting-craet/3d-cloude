# Vercel Blob 存储配置指南

## 概述

本项目使用双数据库架构：
- **Neon PostgreSQL**: 存储结构化数据（节点、边、用户等）
- **Vercel Blob**: 存储图片和文件

## 已完成的配置

### 1. 安装依赖

```bash
npm install @vercel/blob
```

### 2. 创建的文件

- `lib/blob-storage.ts` - Blob 存储辅助函数
- `app/api/upload/route.ts` - 图片上传 API
- `app/api/upload/delete/route.ts` - 图片删除 API
- `scripts/test-blob.ts` - Blob 连接测试脚本

### 3. 数据库 Schema 更新

在 `Node` 模型中添加了图片字段：
- `imageUrl` - 节点的主图片 URL
- `iconUrl` - 节点的图标 URL
- `coverUrl` - 文档封面图 URL（仅用于 document 类型）

## 环境变量配置

### Vercel 部署（自动配置）

当你在 Vercel 控制台创建 Blob 存储后，以下环境变量会自动添加：

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

### 本地开发

1. 在 Vercel 控制台获取 Blob Token：
   - 进入项目 → Storage → Blob
   - 点击 "Connect" 或查看连接信息
   - 复制 `BLOB_READ_WRITE_TOKEN`

2. 在本地 `.env` 文件中添加：

```env
# Neon 数据库（已配置）
DATABASE_URL="postgresql://neondb_owner:npg_N5Dm4sGEpRjM@ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Vercel Blob（需要添加）
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"
```

## 测试连接

### 本地测试

```bash
npm run db:test-blob
```

或直接运行：

```bash
npx tsx scripts/test-blob.ts
```

### 预期输出

```
🔍 测试 Vercel Blob 连接...

📤 上传测试文件...
✅ 上传成功!
   URL: https://xxxxx.public.blob.vercel-storage.com/test/connection-test.txt
   路径: test/connection-test.txt
   大小: 45 bytes

📋 列出 Blob 中的文件...
✅ 找到 1 个文件:
   1. test/connection-test.txt
      URL: https://xxxxx.public.blob.vercel-storage.com/test/connection-test.txt
      大小: 45 bytes
      上传时间: 2024-01-12T10:30:00.000Z

🎉 Vercel Blob 连接测试成功!
```

## API 使用示例

### 上传图片

```typescript
// 前端代码
const formData = new FormData()
formData.append('file', file)
formData.append('nodeId', 'node-123')
formData.append('type', 'thumbnail')

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
})

const data = await response.json()
console.log('图片 URL:', data.url)
```

### 删除图片

```typescript
const response = await fetch('/api/upload/delete', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: imageUrl }),
})
```

### 使用辅助函数

```typescript
import { uploadNodeThumbnail, deleteNodeImages } from '@/lib/blob-storage'

// 上传节点缩略图
const thumbnailUrl = await uploadNodeThumbnail('node-123', file)

// 删除节点的所有图片
await deleteNodeImages('node-123')
```

## 文件组织结构

Blob 中的文件按以下结构组织：

```
nodes/
  {nodeId}/
    thumbnail.jpg          # 节点缩略图
    attachments/
      image1.jpg          # 附件图片
      image2.png
uploads/
  {timestamp}-{filename}  # 临时上传的文件
test/
  connection-test.txt     # 测试文件
```

## 限制和配额

### 免费计划
- 存储空间: 1 GB
- 带宽: 100 GB/月
- 文件大小限制: 5 MB（在代码中配置）

### Pro 计划
- 存储空间: 100 GB
- 带宽: 1 TB/月
- 文件大小限制: 可自定义

## 支持的图片格式

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)

## 安全性

- 所有上传的文件都是公开访问的（`access: 'public'`）
- 文件 URL 包含随机字符串，难以猜测
- 建议在上传前进行文件类型和大小验证
- 敏感文件应使用私有访问模式

## 数据库同步

上传图片后，记得更新 Neon 数据库中的节点记录：

```typescript
// 上传图片
const imageUrl = await uploadNodeThumbnail(nodeId, file)

// 更新数据库
await prisma.node.update({
  where: { id: nodeId },
  data: { imageUrl },
})
```

## 故障排除

### 错误: BLOB_READ_WRITE_TOKEN is not defined

**原因**: 环境变量未设置

**解决方案**:
1. 检查 `.env` 文件是否包含 `BLOB_READ_WRITE_TOKEN`
2. 在 Vercel 控制台确认环境变量已配置
3. 重启开发服务器

### 错误: 上传失败 (403 Forbidden)

**原因**: Token 无效或过期

**解决方案**:
1. 在 Vercel 控制台重新生成 Token
2. 更新 `.env` 文件
3. 重新部署应用

### 错误: 文件大小超过限制

**原因**: 文件超过 5MB

**解决方案**:
1. 压缩图片
2. 或修改 `app/api/upload/route.ts` 中的 `maxSize` 限制

## 下一步

1. ✅ 配置 Vercel Blob 存储
2. ✅ 创建上传和删除 API
3. ✅ 更新数据库 Schema
4. ⏳ 在前端组件中集成图片上传功能
5. ⏳ 添加图片预览和管理界面
6. ⏳ 实现图片压缩和优化

## 相关文档

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Blob SDK](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk)
- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#request-body-formdata)
