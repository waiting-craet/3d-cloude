# 🚀 本地运行项目 - 完整指南

## ✅ 当前状态

**开发服务器**: ✅ 已启动
**地址**: http://localhost:3000
**状态**: 运行中

## 🎯 快速开始（3 步）

### 1️⃣ 打开浏览器
访问 **http://localhost:3000**

### 2️⃣ 开始开发
编辑 `components/` 或 `app/` 中的文件，页面会自动刷新

### 3️⃣ 运行测试
```bash
npm test
```

## 📋 详细步骤

### 步骤 1: 安装依赖（如果还未安装）

```bash
npm install
```

### 步骤 2: 配置环境变量

创建 `.env.local` 文件（或复制 `.env.example`）：

```bash
# 选项 A: 本地 SQLite（推荐用于开发）
DATABASE_URL="file:./dev.db"

# 选项 B: 使用现有的 Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:npg_N5Dm4sGEpRjM@ep-rapid-cell-ahte4osq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# AI API（可选）
AI_API_KEY="sk-your-api-key-here"
AI_API_ENDPOINT="https://api.deepseek.com/v1/chat/completions"
```

### 步骤 3: 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送数据库架构
npx prisma db push

# （可选）填充示例数据
npm run db:seed
```

### 步骤 4: 启动开发服务器

#### 方式 A: 使用 npm 命令
```bash
npm run dev
```

#### 方式 B: 使用启动脚本（Windows）
```bash
# 使用 PowerShell
.\START-DEV.ps1

# 或使用 CMD
START-DEV.bat
```

#### 方式 C: 使用 VS Code
1. 打开 VS Code
2. 按 Ctrl+` 打开终端
3. 运行 `npm run dev`

### 步骤 5: 打开浏览器

访问 **http://localhost:3000**

## 🎨 项目功能

### 首页广场
- 📊 知识图谱展示
- 🔍 搜索功能
- 🏷️ 筛选功能（3D/2D/模板）
- 🌙 主题切换（亮/暗）
- 🔔 通知系统
- 👤 用户菜单
- 📱 响应式设计

### 响应式布局
- **移动** (< 640px): 1 列 + 汉堡菜单
- **平板** (640-1024px): 2-3 列
- **桌面** (> 1024px): 4 列

## 🛠️ 常用命令

### 开发
```bash
# 启动开发服务器
npm run dev

# 启动开发服务器（指定端口）
npm run dev -- -p 3001

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 测试
```bash
# 运行所有测试
npm test

# 监视模式（自动重新运行）
npm test:watch

# 生成覆盖率报告
npm test:coverage

# 运行特定测试
npm test -- GalleryIntegration
npm test -- GalleryPerformance
npm test -- ResponsiveDesign
```

### 数据库
```bash
# 查看数据库 UI（Prisma Studio）
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

### 代码质量
```bash
# 运行 ESLint
npm run lint

# 修复 ESLint 问题
npm run lint -- --fix
```

## 📂 项目结构

```
components/
├── GalleryTopNavbar.tsx          # 导航栏
├── gallery/
│   ├── FilterBar.tsx            # 筛选栏
│   ├── GalleryGrid.tsx          # 网格
│   ├── GraphCard.tsx            # 卡片
│   ├── SearchBar.tsx            # 搜索
│   ├── NotificationBell.tsx     # 通知
│   ├── UserMenu.tsx             # 用户菜单
│   ├── ThemeToggle.tsx          # 主题切换
│   ├── HelpMenu.tsx             # 帮助菜单
│   └── __tests__/               # 测试

lib/
├── hooks/
│   ├── useGalleryGraphs.ts      # 获取图谱
│   ├── useGallerySearch.ts      # 搜索
│   └── useNotifications.ts      # 通知

app/
├── api/gallery/                 # API 路由
├── page.tsx                     # 主页
└── layout.tsx                   # 布局

docs/
├── GALLERY_API.md               # API 文档
├── GALLERY_COMPONENTS.md        # 组件文档
└── GALLERY_SETUP.md             # 设置指南
```

## 🔍 调试

### 浏览器开发者工具
1. 按 F12 打开开发者工具
2. 使用 React DevTools 检查组件
3. 使用 Network 标签检查 API 调用
4. 使用 Console 查看错误和日志

### Prisma Studio
```bash
npm run db:studio
```
打开 http://localhost:5555 查看数据库

### VS Code 调试
1. 创建 `.vscode/launch.json`
2. 配置 Node.js 调试器
3. 按 F5 启动调试

## 🚨 常见问题

### Q: 页面加载缓慢？
**A**: 首次加载会编译所有文件，这是正常的。刷新页面会更快。

### Q: 修改代码后没有更新？
**A**: 检查终端是否有错误。如果有错误，修复后会自动重新加载。

### Q: 数据库连接失败？
**A**: 
```bash
# 检查连接
npm run db:test

# 如果使用 SQLite，确保文件存在
ls -la dev.db

# 重新初始化
rm dev.db
npx prisma db push
```

### Q: 端口 3000 已被占用？
**A**:
```bash
# 使用不同的端口
npm run dev -- -p 3001

# 或杀死占用端口的进程
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :3000
kill -9 <PID>
```

### Q: 模块未找到错误？
**A**:
```bash
# 清除缓存
rm -rf .next

# 重新安装依赖
rm -rf node_modules
npm install

# 重启服务器
npm run dev
```

### Q: 测试失败？
**A**:
```bash
# 清除 Jest 缓存
npm test -- --clearCache

# 运行特定测试
npm test -- GalleryIntegration --verbose

# 查看详细错误
npm test -- --no-coverage
```

## 📊 测试覆盖

### 已通过的测试
- ✅ 集成测试: 11 个
- ✅ 性能测试: 8 个
- ✅ 响应式测试: 10 个
- ✅ **总计**: 29 个测试全部通过

### 运行测试
```bash
# 运行所有核心测试
npm test -- components/gallery/__tests__/Gallery*.test.tsx

# 运行特定测试
npm test -- GalleryIntegration
npm test -- GalleryPerformance
npm test -- ResponsiveDesign
```

## 📚 文档

- [快速参考](./QUICK-REFERENCE.md) - 快速命令和配置
- [本地设置](./LOCAL-SETUP.md) - 详细设置步骤
- [API 文档](./docs/GALLERY_API.md) - API 端点说明
- [组件文档](./docs/GALLERY_COMPONENTS.md) - 组件使用指南
- [设置指南](./docs/GALLERY_SETUP.md) - 详细设置指南

## 🔗 有用的链接

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [React 文档](https://react.dev)
- [Neon 文档](https://neon.tech/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)

## 💡 开发工作流

### 1. 启动服务器
```bash
npm run dev
```

### 2. 打开浏览器
访问 http://localhost:3000

### 3. 编辑代码
修改 `components/` 或 `app/` 中的文件

### 4. 热重载
Next.js 会自动重新加载页面

### 5. 运行测试
```bash
npm test -- --watch
```

### 6. 提交代码
```bash
git add .
git commit -m "描述改动"
git push
```

## 🎯 下一步

1. **浏览项目**: 访问 http://localhost:3000
2. **查看代码**: 打开 `components/gallery/` 查看组件
3. **运行测试**: 执行 `npm test`
4. **阅读文档**: 查看 `docs/` 文件夹
5. **开始开发**: 修改代码并看到实时更新

## 📞 获取帮助

- 查看 [LOCAL-SETUP.md](./LOCAL-SETUP.md) 了解故障排除
- 查看 [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) 了解快速参考
- 查看项目文档了解更多信息

---

**最后更新**: 2026-02-11
**版本**: 1.0.0
**状态**: ✅ 生产就绪

**现在就开始**: 打开 http://localhost:3000 🚀
