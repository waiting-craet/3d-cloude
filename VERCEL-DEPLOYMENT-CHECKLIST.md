# Vercel 部署检查清单

## ✅ 部署前检查

### 1. 环境变量配置

在 Vercel 控制台确认以下环境变量已配置：

#### 必需的环境变量

- [x] `DATABASE_URL` - Neon PostgreSQL 连接字符串
  ```
  postgresql://neondb_owner:npg_N5Dm4sGEpRjM@ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
  ```

- [x] `BLOB_READ_WRITE_TOKEN` - Vercel Blob 存储 Token
  ```
  vercel_blob_rw_l68XKsC2rFHdhJpQ_3rRV4EhY6aOPIFFRJEQJUYhLkCUhBs
  ```

#### 配置步骤

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 "3D云状点"
3. 进入 **Settings** → **Environment Variables**
4. 确认两个变量都已添加
5. 确保在 **Production**、**Preview** 和 **Development** 都已启用

### 2. 代码检查

- [x] 所有代码已提交到 GitHub
- [x] 最新代码已推送到 main 分支
- [x] 没有语法错误或类型错误

### 3. 功能检查

#### 已实现的功能

- [x] 3D 知识图谱可视化
- [x] 2D 工作流画布
- [x] 节点创建和编辑
- [x] 节点连接
- [x] 图片上传（Blob 存储）
- [x] 视频上传（Blob 存储）
- [x] 数据库集成（Neon PostgreSQL）

## 🚀 部署流程

### 自动部署

每次推送到 GitHub main 分支，Vercel 会自动触发部署：

1. **推送代码**
   ```bash
   git push origin main
   ```

2. **Vercel 自动构建**
   - 检测到新提交
   - 开始构建流程
   - 运行 `npm run build`
   - 生成生产版本

3. **部署完成**
   - 自动部署到生产环境
   - 生成部署 URL
   - 发送部署通知

### 手动部署

如果需要手动触发部署：

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 "3D云状点"
3. 进入 **Deployments** 标签
4. 点击 **Redeploy** 按钮

## 📊 部署后验证

### 1. 检查部署状态

访问 Vercel 控制台查看：
- ✅ 构建成功
- ✅ 部署成功
- ✅ 没有错误日志

### 2. 功能测试

访问生产环境 URL，测试以下功能：

#### 基础功能
- [ ] 首页加载正常
- [ ] 3D 图谱显示正常
- [ ] 导航栏功能正常

#### 工作流画布
- [ ] 访问 `/workflow` 页面
- [ ] 创建新卡片
- [ ] 编辑卡片内容
- [ ] 连接卡片

#### 媒体上传
- [ ] 上传图片（测试小于 5MB 的图片）
- [ ] 上传视频（测试小于 50MB 的视频）
- [ ] 媒体预览显示正常
- [ ] 删除媒体功能正常

#### 数据库
- [ ] 节点数据保存成功
- [ ] 刷新页面后数据仍然存在
- [ ] 连接关系保存正常

### 3. 性能检查

- [ ] 页面加载速度 < 3秒
- [ ] 图片加载正常
- [ ] 视频播放流畅
- [ ] 没有明显的性能问题

## 🔍 常见部署问题

### 问题 1: 构建失败

**症状**: Vercel 显示构建错误

**解决方案**:
1. 检查 Vercel 构建日志
2. 确认 `DATABASE_URL` 环境变量已配置
3. 确认没有 TypeScript 类型错误
4. 本地运行 `npm run build` 测试

### 问题 2: 上传功能不工作

**症状**: 上传图片/视频时报 500 错误

**解决方案**:
1. 确认 `BLOB_READ_WRITE_TOKEN` 已配置
2. 检查 Token 是否正确
3. 确认 Blob 存储已创建
4. 查看 Vercel 函数日志

### 问题 3: 数据库连接失败

**症状**: API 请求返回数据库错误

**解决方案**:
1. 确认 `DATABASE_URL` 正确
2. 检查 Neon 数据库是否在线
3. 确认数据库 schema 已同步
4. 查看 Vercel 函数日志

### 问题 4: 页面 404

**症状**: 访问某些页面显示 404

**解决方案**:
1. 确认路由文件存在
2. 检查文件命名是否正确
3. 清除 Vercel 缓存并重新部署

## 📝 部署记录

### 最新部署

- **日期**: 2026-01-12
- **提交**: `b8e4510` - "fix: Update test-blob script to load env variables"
- **功能**: 
  - ✅ 工作流卡片媒体上传
  - ✅ Vercel Blob 集成
  - ✅ 图片和视频支持

### 环境配置

- **Node.js 版本**: 20.x
- **Next.js 版本**: 14.2.18
- **数据库**: Neon PostgreSQL
- **存储**: Vercel Blob

## 🔗 相关链接

- **生产环境**: https://your-app.vercel.app
- **Vercel 控制台**: https://vercel.com/dashboard
- **GitHub 仓库**: https://github.com/waiting-craet/3d-cloude
- **Neon 控制台**: https://console.neon.tech

## 📚 相关文档

- [Vercel 部署指南](./VERCEL-DEPLOYMENT.md)
- [Blob 存储配置](./VERCEL-BLOB-SETUP.md)
- [工作流媒体上传](./WORKFLOW-MEDIA-UPLOAD.md)

## 🎯 下一步

部署成功后：

1. **测试所有功能** - 确保一切正常工作
2. **监控性能** - 使用 Vercel Analytics
3. **收集反馈** - 记录用户反馈和问题
4. **持续优化** - 根据使用情况优化性能

---

**部署完成后，你的应用就可以在全球范围内访问了！** 🌍🎉
