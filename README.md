# 3D 知识图谱

基于 Next.js 14 + Neon PostgreSQL + Prisma 构建的交互式 3D 知识图谱可视化平台，完全兼容 Cloudflare Pages 直接部署。

![3D Knowledge Graph](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-0.170-green?style=flat-square&logo=three.js)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma)

## ✨ 特性

- 🎨 **简洁的顶部导航栏** - 所有操作集中在顶部，保持界面整洁
- 🌐 **3D 交互式可视化** - 使用 Three.js 和 React Three Fiber
- 📊 **RAG 知识图谱** - 预置 Retrieval-Augmented Generation 示例
- 🔗 **实时节点连接** - 直观的连线操作
- 💾 **完整的数据库支持** - Prisma ORM + SQLite/PostgreSQL
- 🚀 **Cloudflare Pages 部署** - 支持 Edge Runtime
- 🎯 **类型安全** - 完整的 TypeScript 支持

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量（DeepSeek + 数据库）

创建本地 `.env` 文件（不要提交真实密钥）：

```bash
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
AI_API_KEY=sk-your-api-key-here
AI_API_ENDPOINT=https://api.deepseek.com/v1/chat/completions
```

> Docker Compose 已支持自动读取上述变量并注入 `app` 服务：
> - `AI_API_KEY=${AI_API_KEY}`
> - `AI_API_ENDPOINT=${AI_API_ENDPOINT}`

### 3. 初始化数据库

```bash
# 推送数据库结构
npm run db:push

# 填充示例数据（RAG 知识图谱）
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 📖 使用指南

### 界面操作

**顶部导航栏：**
- **+ 添加节点** - 创建新的知识节点
- **🔗 连线** - 连接两个节点
- **已选中** - 显示当前选中的节点
- **🔄 刷新** - 重新加载页面

**3D 场景：**
- 鼠标左键拖拽 - 旋转视角
- 鼠标滚轮 - 缩放场景
- 鼠标右键拖拽 - 平移视角
- 点击节点 - 选中节点
- 点击空白 - 取消选择

### 基本操作

1. **添加节点**：点击 "+ 添加节点"，输入名称，按 Enter
2. **连接节点**：选中节点 → 点击 "🔗 连线" → 点击目标节点
3. **查看信息**：鼠标悬停在节点上显示名称

详细使用说明请查看 [QUICK-START.md](./QUICK-START.md)

## 🎯 示例数据

项目预置了 RAG（Retrieval-Augmented Generation）知识图谱：

```
RAG 系统（中心）
├── 检索模块
│   └── 重排序
├── 生成模块
│   └── LLM
└── 知识库
    ├── 向量数据库
    └── 嵌入模型
```

## 🛠️ 技术栈

- **前端框架**: Next.js 14 (App Router)
- **3D 渲染**: Three.js + React Three Fiber + Drei
- **数据库**: SQLite (开发) / Neon PostgreSQL (生产)
- **ORM**: Prisma
- **状态管理**: Zustand
- **语言**: TypeScript
- **部署**: Cloudflare Pages

## 📁 项目结构

```
├── app/
│   ├── api/              # API 路由
│   │   ├── nodes/        # 节点 CRUD
│   │   ├── edges/        # 关系 CRUD
│   │   ├── documents/    # 文档管理
│   │   ├── search/       # 搜索
│   │   └── stats/        # 统计
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页
│   └── globals.css       # 全局样式
├── components/
│   ├── KnowledgeGraph.tsx    # 3D 图谱主组件
│   ├── GraphNodes.tsx        # 节点渲染
│   ├── GraphEdges.tsx        # 关系渲染
│   └── TopNavbar.tsx         # 顶部导航栏
├── lib/
│   ├── db.ts             # Prisma 客户端
│   ├── db-helpers.ts     # 数据库辅助函数
│   └── store.ts          # Zustand 状态管理
├── prisma/
│   └── schema.prisma     # 数据库模型
└── scripts/
    └── seed.ts           # 数据填充脚本
```

## 🗄️ 数据库

### 数据模型

- **Node** - 节点（文档、chunks、实体等）
- **Edge** - 关系（支持属性、双向、样式）
- **Graph** - 图谱管理
- **User** - 用户系统
- **SearchHistory** - 搜索历史

### 数据库命令

```bash
# 推送数据库结构
npm run db:push

# 打开 Prisma Studio（可视化管理）
npm run db:studio

# 填充示例数据
npm run db:seed
```

详细数据库文档请查看 [DATABASE.md](./DATABASE.md)

## 🌐 API 端点

### 节点操作
- `GET /api/nodes` - 获取所有节点
- `POST /api/nodes` - 创建节点
- `PATCH /api/nodes/[id]` - 更新节点
- `DELETE /api/nodes/[id]` - 删除节点
- `GET /api/nodes/[id]/neighbors?depth=1` - 获取邻居

### 关系操作
- `GET /api/edges` - 获取所有边
- `POST /api/edges` - 创建边
- `DELETE /api/edges/[id]` - 删除边

### 其他
- `POST /api/documents` - 创建文档（支持自动分割）
- `GET /api/search?q=关键词` - 搜索节点
- `GET /api/stats` - 获取统计信息

## 🚀 部署到 Cloudflare Pages

### 1. 创建 Neon 数据库

1. 访问 https://neon.tech
2. 创建新项目
3. 复制连接字符串

### 2. 配置环境变量

在 Cloudflare Pages 项目设置中添加：

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
AI_API_KEY=sk-your-api-key-here
AI_API_ENDPOINT=https://api.deepseek.com/v1/chat/completions
```

### 3. 构建设置

- **构建命令**: `npm run build`
- **构建输出目录**: `.next`
- **Node 版本**: 18+

详细部署指南请查看 [scripts/migrate-to-neon.md](./scripts/migrate-to-neon.md)

## 📚 文档

- [QUICK-START.md](./QUICK-START.md) - 快速开始指南
- [DATABASE.md](./DATABASE.md) - 数据库架构文档
- [DATABASE-FEATURES.md](./DATABASE-FEATURES.md) - 数据库功能总结
- [scripts/migrate-to-neon.md](./scripts/migrate-to-neon.md) - Neon 迁移指南

## 🎨 自定义

### 修改节点颜色

编辑 `components/TopNavbar.tsx`：

```typescript
color: '#4A9EFF',  // 蓝色
color: '#10b981',  // 绿色
color: '#ef4444',  // 红色
```

### 修改背景

编辑 `app/globals.css`：

```css
background: linear-gradient(to bottom, #2a2a2a 0%, #1a1a1a 100%);
```

## 🔧 开发

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 📝 注意事项

- 本地开发使用 SQLite（`file:./dev.db`）
- 生产环境使用 Neon PostgreSQL
- 环境变量 `DATABASE_URL` 必须配置
- 删除文档会自动删除所有相关 chunks
- JSON 字段（metadata, tags, properties）存储为字符串

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

---

**Made with ❤️ using Next.js, Three.js, and Prisma**
