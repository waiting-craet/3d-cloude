# 图片上传 500 错误修复指南

## 问题描述
在二维知识图谱页面上传图片时出现 500 错误：
```
Failed to load resource: the server responded with a status of 500 ()
上传失败: Error: 上传失败
```

## 根本原因
开发服务器未正确加载 `.env` 文件中的 `BLOB_READ_WRITE_TOKEN` 环境变量。

## 解决方案

### 步骤 1: 验证环境变量配置
检查 `.env` 文件是否包含正确的 Vercel Blob token:

```bash
type .env
```

应该看到:
```
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_l68XKsC2rFHdhJpQ_3rRV4EhY6aOPIFFRJEQJUYhLkCUhBs"
```

✅ 已确认：环境变量已正确配置

### 步骤 2: 重启开发服务器
环境变量只在服务器启动时加载，需要重启开发服务器：

1. **停止当前服务器**
   - 在运行 `npm run dev` 的终端按 `Ctrl+C`

2. **重新启动服务器**
   ```bash
   npm run dev
   ```

3. **等待服务器完全启动**
   - 看到 "Ready in X ms" 消息后再测试

### 步骤 3: 测试上传功能
1. 打开浏览器访问 `http://localhost:3000/workflow`
2. 创建或编辑一个节点
3. 点击"上传图片"按钮
4. 选择一张图片（小于 5MB）
5. 查看浏览器控制台和服务器终端的日志

### 步骤 4: 查看详细日志
我已经在上传 API 中添加了详细的日志输出，重启服务器后你会看到：

**成功的情况：**
```
🔍 检查 BLOB_READ_WRITE_TOKEN: 已配置
📦 接收到上传请求: { fileName: 'test.jpg', fileSize: 123456, ... }
⬆️ 开始上传到 Vercel Blob: nodes/xxx/image-xxx.jpg
✅ 上传成功: https://...
```

**失败的情况：**
```
🔍 检查 BLOB_READ_WRITE_TOKEN: 未配置
❌ BLOB_READ_WRITE_TOKEN 未配置
```

或者：
```
🔍 检查 BLOB_READ_WRITE_TOKEN: 已配置
📦 接收到上传请求: ...
⬆️ 开始上传到 Vercel Blob: ...
❌ 上传失败: [具体错误信息]
```

## 常见问题

### Q1: 重启后仍然显示"未配置"
**解决方案：**
1. 确认 `.env` 文件在项目根目录
2. 确认文件名是 `.env` 而不是 `.env.local` 或其他
3. 确认没有语法错误（如多余的引号或空格）
4. 尝试删除 `.next` 文件夹后重启：
   ```bash
   rmdir /s /q .next
   npm run dev
   ```

### Q2: 显示"已配置"但上传仍然失败
**可能原因：**
1. **Token 无效或过期**
   - 需要重新生成 Vercel Blob token
   - 参考 `VERCEL-BLOB-SETUP.md` 获取新 token

2. **网络问题**
   - 检查是否能访问 Vercel 服务
   - 尝试使用 VPN 或更换网络

3. **文件问题**
   - 确认文件格式正确（JPEG、PNG、GIF、WebP）
   - 确认文件大小小于 5MB
   - 尝试使用不同的图片

### Q3: 如何获取新的 Vercel Blob Token
参考 `GET-BLOB-TOKEN.md` 文档，或者：

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 Storage 标签
4. 创建或选择一个 Blob Store
5. 复制 Read-Write Token
6. 更新 `.env` 文件中的 `BLOB_READ_WRITE_TOKEN`
7. 重启开发服务器

## 代码更改说明

我已经更新了 `app/api/upload/route.ts`，添加了详细的日志输出：

1. ✅ 检查环境变量是否加载
2. ✅ 记录接收到的文件信息
3. ✅ 记录上传过程
4. ✅ 记录详细的错误堆栈

这些日志会帮助你快速定位问题。

## 下一步

1. **立即执行：** 重启开发服务器
2. **测试：** 尝试上传图片
3. **查看日志：** 检查终端输出
4. **反馈：** 如果问题仍然存在，请提供终端日志信息

## 预期结果

重启服务器后，上传功能应该能正常工作。你会看到：
- ✅ 图片成功上传到 Vercel Blob
- ✅ 图片 URL 保存到节点
- ✅ 图片在节点卡片中正确显示
- ✅ 图片在 3D 视图中也能看到

## 技术细节

### 为什么需要重启？
Next.js 在启动时读取 `.env` 文件并将变量注入到 `process.env`。如果在服务器运行时修改 `.env` 文件，这些更改不会自动生效。

### 环境变量加载顺序
1. `.env` - 所有环境
2. `.env.local` - 本地覆盖（被 git 忽略）
3. `.env.development` - 开发环境
4. `.env.production` - 生产环境

### Vercel Blob 工作原理
- 文件上传到 Vercel 的全球 CDN
- 返回公开访问的 HTTPS URL
- 自动处理缓存和优化
- 按使用量计费（有免费额度）
