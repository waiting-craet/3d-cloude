# Vercel Blob 存储配置指南

## 概述

本项目使用双数据库架构：
- **Neon PostgreSQL**: 存储结构化数据（节点、边、用户等）
- **Vercel Blob**: 存储文件（图片、文档等）

## Vercel Blob 配置

### 1. 在 Vercel 控制台创建 Blob 存储

你已经创建了 Blob 存储 "3D云状斑点"，现在需要连接到项目。

### 2. 连接 Blob 到项目

1. 在 Vercel Dashboard 中打开你的项目
2. 进入 **Storage** 标签
3. 选择 **Connect Store**
4. 选择你创建的 "3D云状斑点" Blob 存储
5. 点击 **Connect**

Vercel 会自动添加环境变量 `BLOB_READ_WRITE_TOKEN` 到你的项目。

### 3. 验证配置

部署后，你可以通过以下方式验证：

```bash
# 测试上传 API
curl -X POST https://your-app.vercel.app/api/upload \
  -F "file=@test-image.png" \
  -F "type=general"
```

## 使用方式

### 在代码中上传图片

```typescript
import { uploadImage } from '@/lib/blob-storage'

// 上传文件
const url = await uploadImage(file, 'my-image.png')
console.log('图片 URL:', url)
```

### 在 API 路由中使用

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { uploadNodeImage } from '@/lib/blob-storage'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const nodeId = formData.get('nodeId') as string
  
  const url = await uploadNodeImage(file, nodeId)
  
  return NextResponse.json({ url })
}
```

### 在组件中使用

```tsx
import ImageUpload from '@/components/ImageUpload'

function MyComponent() {
  const handleUploadSuccess = (url: string) => {
    console.log('上传成功:', url)
    // 更新节点的 imageUrl
  }
  
  return (
    <ImageUpload
      onUploadSuccess={handleUploadSuccess}
      type="node"
      id="node-123"
      buttonText="上传节点图片"
    />
  )
}
```

## 数据库 Schema 更新

已为 Node 模型添加图片字段：

```prisma
model Node {
  // ... 其他字段
  
  imageUrl    String?  // 节点的图片 URL
  iconUrl     String?  // 节点的图标 URL
  coverUrl    String?  // 文档封面图 URL（仅用于 document 类型）
}
```

运行迁移：

```bash
npx prisma db push
```

## API 端点

### 上传图片

**POST** `/api/upload`

请求体（FormData）：
- `file`: 图片文件
- `type`: 类型（'node' | 'document' | 'general'）
- `id`: 节点或文档的 ID（可选）

响应：
```json
{
  "url": "https://xxx.public.blob.vercel-storage.com/xxx.png",
  "filename": "image.png",
  "size": 12345,
  "type": "image/png"
}
```

### 删除图片

**DELETE** `/api/upload/delete`

请求体：
```json
{
  "url": "https://xxx.public.blob.vercel-storage.com/xxx.png"
}
```

响应：
```json
{
  "success": true
}
```

## 文件组织结构

Blob 存储中的文件按以下结构组织：

```
nodes/
  {nodeId}/
    {timestamp}.png
documents/
  {documentId}/
    cover.png
    {timestamp}.png
general/
  {timestamp}.png
```

## 限制

- 单个文件最大 5MB
- 支持格式：JPEG、PNG、GIF、WebP
- 文件名会自动添加随机后缀避免冲突

## 本地开发

本地开发时，你需要：

1. 在 Vercel 控制台获取 `BLOB_READ_WRITE_TOKEN`
2. 添加到 `.env.local` 文件：

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

或者使用 Vercel CLI：

```bash
vercel env pull .env.local
```

## 成本

Vercel Blob 定价：
- 免费额度：1GB 存储 + 100GB 带宽/月
- 超出部分：$0.15/GB 存储 + $0.30/GB 带宽

## 最佳实践

1. **图片优化**: 上传前压缩图片
2. **命名规范**: 使用有意义的文件名和路径
3. **清理旧文件**: 定期删除不再使用的图片
4. **CDN 缓存**: Vercel Blob 自带 CDN，无需额外配置

## 故障排查

### 上传失败

1. 检查 `BLOB_READ_WRITE_TOKEN` 是否正确配置
2. 检查文件大小是否超过 5MB
3. 检查文件格式是否支持
4. 查看 Vercel 日志获取详细错误信息

### 图片无法访问

1. 确认 Blob 存储的访问权限设置为 `public`
2. 检查 URL 是否正确
3. 确认文件是否已成功上传

## 相关文档

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Blob SDK](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk)
