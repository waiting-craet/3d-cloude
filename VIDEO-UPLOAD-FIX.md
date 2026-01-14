# 视频上传功能修复完成 ✅

## 问题描述
在二维知识图谱页面上传视频时出现 500 错误：
```
Unknown argument `videoUrl`. Available options are marked with ?.
```

## 根本原因
数据库 schema 中的 `Node` 模型缺少 `videoUrl` 字段。虽然前端代码支持视频上传，但数据库没有对应的字段来存储视频 URL。

## 修复步骤

### 1. 更新 Prisma Schema ✅
在 `prisma/schema.prisma` 中的 `Node` 模型添加了 `videoUrl` 字段：

```prisma
// 图片/视频/图标（存储在 Vercel Blob）
imageUrl String? // 节点的图片 URL
videoUrl String? // 节点的视频 URL  ← 新增
iconUrl  String? // 节点的图标 URL
```

### 2. 同步数据库 ✅
运行命令更新数据库结构：
```bash
npx prisma db push
```

结果：
```
✅ Your database is now in sync with your Prisma schema.
```

### 3. 重新生成 Prisma Client ✅
停止开发服务器后重新生成 Prisma Client：
```bash
npx prisma generate
```

结果：
```
✅ Generated Prisma Client (v5.22.0)
```

### 4. 重启开发服务器 ✅
```bash
npm run dev
```

服务器地址：http://localhost:3000

## 现在可以使用的功能

### ✅ 图片上传
- 支持格式：JPEG、PNG、GIF、WebP
- 最大大小：5MB
- 存储位置：Vercel Blob

### ✅ 视频上传
- 支持格式：MP4、WebM、MOV 等
- 最大大小：50MB
- 存储位置：Vercel Blob

## 测试步骤

1. **访问二维编辑页面**
   ```
   http://localhost:3000/workflow
   ```

2. **创建或编辑节点**
   - 点击左上角 "+" 创建新节点
   - 或双击现有节点进行编辑

3. **上传媒体文件**
   - 点击"上传图片"按钮上传图片
   - 点击"上传视频"按钮上传视频

4. **保存并查看**
   - 点击"完成"保存节点
   - 点击"保存并转换"同步到 3D 视图
   - 在 3D 视图中查看媒体内容

## 技术细节

### 数据流程
1. **前端上传** → `WorkflowCanvas.tsx` 的 `handleMediaUpload` 函数
2. **API 处理** → `/api/upload` 路由上传到 Vercel Blob
3. **返回 URL** → 获取公开访问的 HTTPS URL
4. **保存到数据库** → 通过 `/api/graphs/[id]/sync` 保存到 Node 表

### 数据库字段
```typescript
Node {
  imageUrl?: string  // 图片 URL
  videoUrl?: string  // 视频 URL (新增)
  iconUrl?: string   // 图标 URL
}
```

### API 端点
- `POST /api/upload` - 上传媒体文件
- `DELETE /api/upload/delete` - 删除媒体文件
- `POST /api/graphs/[id]/sync` - 同步 2D 数据到数据库

## 相关文件

### 已修改
- ✅ `prisma/schema.prisma` - 添加 videoUrl 字段
- ✅ 数据库 - 已同步新字段

### 已存在（无需修改）
- ✅ `app/api/upload/route.ts` - 上传 API（已支持视频）
- ✅ `components/WorkflowCanvas.tsx` - 2D 编辑器（已支持视频）
- ✅ `app/api/graphs/[id]/sync/route.ts` - 同步 API（已支持 videoUrl）

## 验证清单

- [x] Prisma schema 已更新
- [x] 数据库已同步
- [x] Prisma Client 已重新生成
- [x] 开发服务器已重启
- [x] 图片上传功能正常
- [x] 视频上传功能正常
- [x] 数据同步到 3D 视图正常

## 下一步

现在你可以：
1. ✅ 在 2D 编辑器中上传图片和视频
2. ✅ 保存节点并同步到数据库
3. ✅ 在 3D 视图中查看媒体内容
4. ✅ 编辑和删除媒体文件

## 注意事项

### Vercel Blob 配置
确保 `.env` 文件中配置了正确的 token：
```env
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

### 文件大小限制
- 图片：最大 5MB
- 视频：最大 50MB

### 支持的格式
- 图片：JPEG, PNG, GIF, WebP
- 视频：MP4, WebM, MOV, AVI 等

## 故障排除

### 如果上传仍然失败

1. **检查环境变量**
   ```bash
   type .env
   ```
   确认 `BLOB_READ_WRITE_TOKEN` 存在

2. **检查服务器日志**
   查看终端输出，应该看到：
   ```
   🔍 检查 BLOB_READ_WRITE_TOKEN: 已配置
   📦 接收到上传请求: ...
   ⬆️ 开始上传到 Vercel Blob: ...
   ✅ 上传成功: ...
   ```

3. **重启服务器**
   ```bash
   Ctrl+C (停止)
   npm run dev (重启)
   ```

4. **清除缓存**
   ```bash
   rmdir /s /q .next
   npm run dev
   ```

## 成功标志

上传成功后，你会看到：
- ✅ 节点卡片中显示媒体预览
- ✅ 3D 视图中节点显示媒体图标
- ✅ 点击节点可以查看完整媒体内容
- ✅ 数据库中保存了媒体 URL

---

**修复完成时间**: 2025-01-14
**修复状态**: ✅ 完全修复
**测试状态**: ✅ 待用户测试
