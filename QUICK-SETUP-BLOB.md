# 快速配置 Vercel Blob 存储

## ✅ 已完成

1. ✅ 在 Vercel 控制台创建了 Blob 存储
2. ✅ 安装了 `@vercel/blob` SDK
3. ✅ 创建了上传和删除 API
4. ✅ 更新了数据库 Schema（添加图片字段）
5. ✅ 创建了测试脚本

## 📋 下一步操作

### 1. 获取 Blob Token（本地开发）

如果你想在本地测试 Blob 功能：

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目 "3D云状点"
3. 进入 **Storage** → **Blob**
4. 点击 **Connect** 或查看连接信息
5. 复制 `BLOB_READ_WRITE_TOKEN` 的值

### 2. 配置本地环境变量

在项目根目录的 `.env` 文件中添加：

```env
# 已有的 Neon 数据库配置
DATABASE_URL="postgresql://neondb_owner:npg_N5Dm4sGEpRjM@ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 新增 Vercel Blob 配置
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"  # 替换为你的实际 token
```

### 3. 测试连接

运行测试脚本验证配置：

```bash
npm run db:test-blob
```

预期输出：
```
🔍 测试 Vercel Blob 连接...
📤 上传测试文件...
✅ 上传成功!
🎉 Vercel Blob 连接测试成功!
```

### 4. Vercel 部署配置

**好消息**: Vercel 会自动配置 `BLOB_READ_WRITE_TOKEN`！

当你在 Vercel 控制台创建 Blob 存储后，环境变量会自动添加到你的项目中。

验证方法：
1. 进入 Vercel 项目 → **Settings** → **Environment Variables**
2. 确认 `BLOB_READ_WRITE_TOKEN` 已存在
3. 确保在 **Production**、**Preview** 和 **Development** 都已启用

## 🎯 使用示例

### 前端上传图片

```typescript
// 在 React 组件中
const handleUpload = async (file: File, nodeId: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('nodeId', nodeId)
  formData.append('type', 'thumbnail')
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })
  
  const data = await response.json()
  console.log('图片 URL:', data.url)
  
  // 更新节点的图片 URL
  await fetch(`/api/nodes/${nodeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl: data.url }),
  })
}
```

### 后端使用辅助函数

```typescript
import { uploadNodeThumbnail } from '@/lib/blob-storage'

// 上传节点缩略图
const imageUrl = await uploadNodeThumbnail(nodeId, file)

// 更新数据库
await prisma.node.update({
  where: { id: nodeId },
  data: { imageUrl },
})
```

## 📊 存储架构

```
┌─────────────────────────────────────────┐
│         你的应用                         │
└─────────────────────────────────────────┘
           │                │
           │                │
           ▼                ▼
┌──────────────────┐  ┌──────────────────┐
│  Neon PostgreSQL │  │  Vercel Blob     │
│                  │  │                  │
│  • 节点数据      │  │  • 图片文件      │
│  • 边关系        │  │  • 文档附件      │
│  • 用户信息      │  │  • 缩略图        │
│  • 元数据        │  │                  │
└──────────────────┘  └──────────────────┘
```

## 🔧 API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/upload` | POST | 上传图片 |
| `/api/upload/delete` | DELETE | 删除图片 |

## 📝 数据库字段

在 `Node` 模型中新增的字段：

- `imageUrl`: 节点的主图片 URL
- `iconUrl`: 节点的图标 URL  
- `coverUrl`: 文档封面图 URL

## ⚠️ 注意事项

1. **文件大小限制**: 当前设置为 5MB
2. **支持格式**: JPEG, PNG, GIF, WebP
3. **访问权限**: 所有上传的文件都是公开访问
4. **免费配额**: 1GB 存储空间，100GB/月带宽

## 🚀 准备就绪！

现在你的应用已经配置好了双数据库架构：
- ✅ Neon PostgreSQL 用于结构化数据
- ✅ Vercel Blob 用于图片存储

下一步可以开始在前端组件中集成图片上传功能了！
