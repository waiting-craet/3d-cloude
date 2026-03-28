# 本地运行指南

## 快速开始（5 分钟）

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
创建 `.env.local` 文件（复制 `.env.example`）：

```bash
# 选项 A: 使用本地 SQLite（推荐用于开发）
DATABASE_URL="file:./dev.db"

# 选项 B: 使用 Neon PostgreSQL（需要账户）
# DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Vercel Blob（可选，用于文件上传）
# BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"

# AI API（可选，用于文档分析）
# AI_API_KEY="sk-your-api-key-here"
# AI_API_ENDPOINT="https://api.deepseek.com/v1/chat/completions"
```

### 3. 初始化数据库
```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送数据库架构
npx prisma db push

# （可选）填充示例数据
npm run db:seed
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## 详细步骤

### 步骤 1: 克隆项目
```bash
git clone <repository-url>
cd 3d-knowledge-graph
```

### 步骤 2: 安装依赖
```bash
npm install
```

### 步骤 3: 配置数据库

#### 选项 A: 本地 SQLite（推荐）
最简单的方式，无需外部服务：

```bash
# 创建 .env.local
echo 'DATABASE_URL="file:./dev.db"' > .env.local

# 初始化数据库
npx prisma db push
```

#### 选项 B: Neon PostgreSQL
需要 Neon 账户（免费）：

1. 访问 https://neon.tech
2. 创建新项目
3. 复制连接字符串
4. 添加到 `.env.local`:
```
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

5. 初始化数据库：
```bash
npx prisma db push
```

### 步骤 4: 启动开发服务器

```bash
npm run dev
```

输出应该显示：
```
> next dev

  ▲ Next.js 14.2.18
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

### 步骤 5: 打开浏览器

访问 http://localhost:3000

## 常见命令

### 开发
```bash
# 启动开发服务器
npm run dev

# 启动开发服务器（带调试）
npm run dev -- --debug

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 数据库
```bash
# 查看数据库 UI
npm run db:studio

# 推送数据库架构
npm run db:push

# 填充示例数据
npm run db:seed

# 测试数据库连接
npm run db:test

# 快速检查数据库
npm run db:quick-check
```

### 测试
```bash
# 运行所有测试
npm test

# 监视模式
npm test:watch

# 生成覆盖率报告
npm test:coverage

# 运行特定测试
npm test -- GalleryIntegration
```

### 代码质量
```bash
# 运行 ESLint
npm run lint

# 修复 ESLint 问题
npm run lint -- --fix
```

## 项目结构

```
.
├── app/                          # Next.js 应用目录
│   ├── api/                      # API 路由
│   │   └── gallery/              # 首页广场 API
│   ├── page.tsx                  # 主页
│   └── layout.tsx                # 根布局
├── components/                   # React 组件
│   ├── GalleryTopNavbar.tsx      # 导航栏
│   ├── gallery/                  # 首页广场组件
│   │   ├── FilterBar.tsx         # 筛选栏
│   │   ├── GalleryGrid.tsx       # 网格
│   │   ├── GraphCard.tsx         # 卡片
│   │   ├── SearchBar.tsx         # 搜索
│   │   ├── NotificationBell.tsx  # 通知
│   │   ├── UserMenu.tsx          # 用户菜单
│   │   ├── ThemeToggle.tsx       # 主题切换
│   │   ├── HelpMenu.tsx          # 帮助菜单
│   │   └── __tests__/            # 测试
│   └── ...
├── lib/                          # 工具库
│   ├── hooks/                    # React Hooks
│   │   ├── useGalleryGraphs.ts   # 获取图谱
│   │   ├── useGallerySearch.ts   # 搜索
│   │   └── useNotifications.ts   # 通知
│   └── ...
├── prisma/                       # Prisma 配置
│   └── schema.prisma             # 数据库架构
├── docs/                         # 文档
│   ├── GALLERY_API.md            # API 文档
│   ├── GALLERY_COMPONENTS.md     # 组件文档
│   └── GALLERY_SETUP.md          # 设置指南
├── .env.example                  # 环境变量示例
├── .env.local                    # 本地环境变量（不提交）
├── package.json                  # 依赖配置
├── tsconfig.json                 # TypeScript 配置
├── jest.config.js                # Jest 配置
└── next.config.js                # Next.js 配置
```

## 故障排除

### 问题 1: 数据库连接失败

**症状**: `Error: connect ECONNREFUSED`

**解决方案**:
```bash
# 检查数据库连接
npm run db:test

# 如果使用 SQLite，确保文件存在
ls -la dev.db

# 重新初始化数据库
rm dev.db
npx prisma db push
```

### 问题 2: Prisma 生成失败

**症状**: `Error: Prisma Client not found`

**解决方案**:
```bash
# 重新生成 Prisma 客户端
npx prisma generate

# 清除缓存
rm -rf node_modules/.prisma
npm install
```

### 问题 3: 端口 3000 已被占用

**症状**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**:
```bash
# 使用不同的端口
npm run dev -- -p 3001

# 或者杀死占用端口的进程
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :3000
kill -9 <PID>
```

### 问题 4: 模块未找到

**症状**: `Module not found: Can't resolve '@/components/...'`

**解决方案**:
```bash
# 清除 Next.js 缓存
rm -rf .next

# 重新安装依赖
rm -rf node_modules
npm install

# 重启开发服务器
npm run dev
```

### 问题 5: 测试失败

**症状**: `FAIL components/gallery/__tests__/...`

**解决方案**:
```bash
# 清除 Jest 缓存
npm test -- --clearCache

# 运行特定测试
npm test -- GalleryIntegration --verbose

# 查看详细错误
npm test -- --no-coverage
```

## 开发工作流

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 打开浏览器
访问 http://localhost:3000

### 3. 编辑代码
- 修改 `components/` 中的文件
- 修改 `app/` 中的页面
- 修改 `lib/` 中的工具

### 4. 热重载
Next.js 会自动重新加载页面

### 5. 运行测试
```bash
npm test -- --watch
```

### 6. 提交代码
```bash
git add .
git commit -m "描述你的改动"
git push
```

## 性能优化

### 开发模式优化
```bash
# 禁用 TypeScript 检查（加快启动）
npm run dev -- --no-type-check
```

### 构建优化
```bash
# 分析构建大小
npm run build -- --analyze
```

## 调试

### 使用 VS Code 调试器

1. 创建 `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

2. 按 F5 启动调试

### 使用浏览器开发者工具

1. 打开 http://localhost:3000
2. 按 F12 打开开发者工具
3. 使用 React DevTools 检查组件
4. 使用 Network 标签检查 API 调用

## 下一步

- 查看 [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) 了解快速参考
- 查看 [docs/GALLERY_SETUP.md](./docs/GALLERY_SETUP.md) 了解详细设置
- 查看 [docs/GALLERY_COMPONENTS.md](./docs/GALLERY_COMPONENTS.md) 了解组件文档
- 查看 [docs/GALLERY_API.md](./docs/GALLERY_API.md) 了解 API 文档

## 获取帮助

- 📖 [Next.js 文档](https://nextjs.org/docs)
- 📖 [Prisma 文档](https://www.prisma.io/docs)
- 📖 [React 文档](https://react.dev)
- 🐛 [GitHub Issues](https://github.com/example/issues)

---

**最后更新**: 2026-02-11
**版本**: 1.0.0
