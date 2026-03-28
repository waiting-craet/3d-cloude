# 获取 Vercel Blob Token 指南

## 🚨 当前问题

本地运行时上传图片/视频失败，错误信息：
```
Failed to load resource: the server responded with a status of 500
❌ Upload failed: Error: 上传文件失败
```

**原因**: 缺少 `BLOB_READ_WRITE_TOKEN` 环境变量

## 📋 解决步骤

### 1. 访问 Vercel 控制台

打开浏览器，访问：https://vercel.com/dashboard

### 2. 选择你的项目

找到并点击 **"3D云状点"** 项目

### 3. 进入 Storage 设置

- 点击顶部导航栏的 **Storage** 标签
- 或者点击左侧菜单的 **Storage**
- 选择 **Blob** 存储

### 4. 获取 Token

你应该能看到类似这样的界面：

```
Blob 存储
├── 快速入门
├── 连接信息
│   └── BLOB_READ_WRITE_TOKEN: vercel_blob_rw_xxxxx
└── 浏览器
```

**方法 1**: 直接复制显示的 Token

**方法 2**: 点击 "Connect" 或 "View Connection String" 按钮，会显示完整的连接信息

### 5. 配置本地环境

复制 Token 后，打开项目根目录的 `.env.local` 文件：

```env
DATABASE_URL="postgresql://neondb_owner:npg_N5Dm4sGEpRjM@ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 将复制的 Token 粘贴到这里
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"
```

### 6. 重启开发服务器

**重要**: 修改环境变量后必须重启开发服务器！

1. 在终端按 `Ctrl + C` 停止当前服务器
2. 重新运行 `npm run dev`
3. 刷新浏览器页面

## ✅ 验证配置

### 测试 Blob 连接

运行测试脚本：

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

### 测试上传功能

1. 访问 http://localhost:3000/workflow
2. 点击 + 创建新卡片
3. 输入标题和描述
4. 点击 🖼️ 上传图片 或 🎬 上传视频
5. 选择一个文件
6. 应该能看到上传成功并显示预览

## 🔍 常见问题

### Q: 找不到 Blob 存储？

**A**: 确认你已经在 Vercel 控制台创建了 Blob 存储。如果没有：
1. 进入项目 → Storage
2. 点击 "Create Database" 或 "Add Storage"
3. 选择 "Blob"
4. 点击 "Create"

### Q: Token 在哪里？

**A**: Token 通常显示在：
- Storage → Blob → Connection String
- 或者 Settings → Environment Variables（如果已配置）

### Q: 配置后还是报错？

**A**: 检查以下几点：
1. Token 是否正确复制（没有多余空格）
2. 是否重启了开发服务器
3. 是否修改的是 `.env.local` 文件（不是 `.env`）
4. 浏览器是否刷新了页面

### Q: 可以不配置 Blob 吗？

**A**: 可以！如果暂时不需要上传功能：
- 其他功能（创建卡片、连接、编辑等）都能正常使用
- 只是上传图片/视频会失败
- 等需要时再配置即可

## 📝 Token 格式示例

正确的 Token 格式：
```
vercel_blob_rw_XXXXXXXXXX_YYYYYYYYYYYYYYYYYYYYYYYYYYYY
```

- 以 `vercel_blob_rw_` 开头
- 后面跟随一串随机字符
- 总长度约 50-60 个字符

## 🔒 安全提示

- **不要** 将 Token 提交到 Git
- **不要** 在公开场合分享 Token
- `.env.local` 已经在 `.gitignore` 中，不会被提交
- 如果 Token 泄露，可以在 Vercel 控制台重新生成

## 📚 相关文档

- [Vercel Blob 配置指南](./VERCEL-BLOB-SETUP.md)
- [快速配置指南](./QUICK-SETUP-BLOB.md)
- [工作流媒体上传功能](./WORKFLOW-MEDIA-UPLOAD.md)

---

**配置完成后，你就可以在本地测试图片和视频上传功能了！** 🎉
