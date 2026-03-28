# Vercel 部署问题诊断

## 当前错误

### 1. 404 错误
```
Failed to load resource: the server responded with a status of 404 ()
/api/projects/with-graphs
```

### 2. 500 错误
```
POST https://3d-cloude431.vercel.app/api/projects 500 (Internal Server Error)
```

## 可能的原因

### 原因 1: 环境变量未配置
Vercel 部署环境中 `DATABASE_URL` 未正确配置。

### 原因 2: API 路由未正确部署
Next.js API 路由在 Vercel 上可能没有正确构建。

### 原因 3: Prisma 客户端未生成
构建时 Prisma 客户端可能没有正确生成。

## 解决步骤

### 步骤 1: 检查 Vercel 环境变量

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 "3D云状点"
3. 进入 **Settings** → **Environment Variables**
4. 确认以下变量已配置：

```
DATABASE_URL=postgresql://neondb_owner:npg_N5Dm4sGEpRjM@ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

BLOB_READ_WRITE_TOKEN=vercel_blob_rw_l68XKsC2rFHdhJpQ_3rRV4EhY6aOPIFFRJEQJUYhLkCUhBs
```

5. **重要**: 确保在 **Production**、**Preview** 和 **Development** 三个环境都已添加

### 步骤 2: 检查 Vercel 构建日志

1. 在 Vercel Dashboard 中进入 **Deployments**
2. 点击最新的部署
3. 查看 **Build Logs**
4. 检查是否有以下错误：
   - Prisma 相关错误
   - 环境变量相关警告
   - API 路由构建失败

### 步骤 3: 检查 Vercel 函数日志

1. 在 Vercel Dashboard 中进入 **Functions**
2. 查看最近的函数调用日志
3. 查找 500 错误的详细信息

### 步骤 4: 强制重新部署

如果环境变量已配置但仍然报错，尝试强制重新部署：

1. 在 Vercel Dashboard 中进入 **Deployments**
2. 点击最新部署旁边的 **...** 菜单
3. 选择 **Redeploy**
4. 勾选 **Use existing Build Cache** 取消勾选（强制重新构建）
5. 点击 **Redeploy**

### 步骤 5: 本地测试生产构建

在本地测试生产构建，确保没有构建错误：

```bash
# 清理缓存
rm -rf .next node_modules/.cache

# 重新安装依赖
npm install

# 生成 Prisma 客户端
npm run db:push

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

如果本地构建成功，访问 `http://localhost:3000` 测试所有功能。

## 代码修复

我已经在代码中添加了以下改进：

### 1. 添加 runtime 配置
所有 API 路由都添加了 `export const runtime = 'nodejs'`

### 2. 增强错误日志
API 路由现在会输出详细的日志信息：
- 请求开始
- 数据库连接状态
- 操作结果
- 错误详情

### 3. 数据库连接检查
在每个 API 路由中检查 `DATABASE_URL` 是否存在

## 验证清单

部署完成后，按以下步骤验证：

### ✅ 基础检查

1. **访问首页**
   - URL: `https://3d-cloude431.vercel.app`
   - 应该能正常加载

2. **检查浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 标签
   - 不应该有 404 或 500 错误

3. **测试 API 端点**
   - 访问: `https://3d-cloude431.vercel.app/api/projects/with-graphs`
   - 应该返回 JSON 数据，不是 404

### ✅ 功能测试

1. **加载项目列表**
   - 点击 "现有图谱" 下拉框
   - 应该能看到项目列表
   - 应该包含 "历史数据" 项目

2. **切换图谱**
   - 展开 "历史数据" 项目
   - 点击 "默认图谱"
   - 应该能看到 23 个节点和 12 条边

3. **创建新项目**（需要管理员权限）
   - 点击 "登录" 按钮
   - 输入管理员账号密码
   - 点击 "新建图谱"
   - 创建测试项目
   - 应该能成功创建

## 常见问题

### Q1: 为什么 API 返回 404？

**可能原因：**
- API 路由文件位置不正确
- Next.js 版本不兼容
- Vercel 构建配置问题

**解决方法：**
1. 确认文件路径：`app/api/projects/with-graphs/route.ts`
2. 检查 Next.js 版本：应该是 14.x
3. 查看 Vercel 构建日志

### Q2: 为什么 API 返回 500？

**可能原因：**
- `DATABASE_URL` 未配置
- 数据库连接失败
- Prisma 客户端未生成

**解决方法：**
1. 检查 Vercel 环境变量
2. 查看 Vercel 函数日志
3. 测试数据库连接

### Q3: 本地正常，部署后报错？

**可能原因：**
- 环境变量不一致
- 构建缓存问题
- Node.js 版本不同

**解决方法：**
1. 对比本地和 Vercel 的环境变量
2. 清除 Vercel 构建缓存重新部署
3. 检查 Vercel 的 Node.js 版本设置

## 获取帮助

如果问题仍然存在，请提供以下信息：

1. **Vercel 构建日志**
   - 完整的构建输出
   - 特别是 Prisma 相关的日志

2. **Vercel 函数日志**
   - 500 错误的详细堆栈信息
   - 数据库连接相关的日志

3. **浏览器控制台日志**
   - 完整的错误信息
   - Network 标签中的请求详情

4. **环境变量截图**
   - Vercel 环境变量配置页面
   - 确认已在所有环境中配置

## 下一步

1. **立即执行**
   ```bash
   git add .
   git commit -m "fix: 添加 API 路由错误处理和日志"
   git push
   ```

2. **等待部署完成**
   - 在 Vercel Dashboard 中监控部署进度
   - 查看构建日志

3. **验证修复**
   - 访问网站
   - 测试所有功能
   - 检查浏览器控制台

4. **查看日志**
   - 如果仍有错误，查看 Vercel 函数日志
   - 记录错误详情

---

**创建时间：** 2026-01-14
**状态：** 🔧 待验证
