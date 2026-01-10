# 3D 知识图谱

基于 Next.js 14 + Neon PostgreSQL + Prisma 构建的交互式 3D 知识图谱可视化平台，完全兼容 Cloudflare Pages 直接部署。

## 技术栈

- **前端框架**: Next.js 14 (App Router + Edge Runtime)
- **3D 渲染**: Three.js + React Three Fiber
- **数据库**: Neon (PostgreSQL Serverless)
- **ORM**: Prisma with Neon adapter
- **状态管理**: Zustand
- **部署平台**: Cloudflare Pages

## 特性

- ✅ 完全 Edge Runtime 兼容，无 Node.js 依赖
- ✅ 3D 交互式知识图谱可视化
- ✅ 实时添加节点和关系
- ✅ Serverless 数据库（Neon PostgreSQL）
- ✅ 支持 Cloudflare R2 存储
- ✅ 所有密钥通过环境变量配置

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量（本地开发）

创建 `.env` 文件：

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### 3. 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## Cloudflare Pages 部署

### 1. 在 Neon 创建数据库

1. 访问 https://neon.tech
2. 创建新项目
3. 复制连接字符串

### 2. 配置 Cloudflare Pages

在 Cloudflare Pages 项目设置中添加环境变量：

**必需的环境变量：**
- `DATABASE_URL`: Neon 数据库连接字符串

**可选的 R2 环境变量：**
- `R2_ACCOUNT_ID`: Cloudflare 账户 ID
- `R2_ACCESS_KEY_ID`: R2 访问密钥 ID
- `R2_SECRET_ACCESS_KEY`: R2 访问密钥
- `R2_BUCKET_NAME`: R2 存储桶名称

### 3. 构建设置

- **构建命令**: `npm run build`
- **构建输出目录**: `.next`
- **Node 版本**: 18 或更高

### 4. 部署

推送代码到 Git 仓库，Cloudflare Pages 会自动构建和部署。

## 项目结构

```
├── app/
│   ├── api/              # API 路由
│   │   ├── nodes/        # 节点 CRUD
│   │   └── edges/        # 关系 CRUD
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页
│   └── globals.css       # 全局样式
├── components/
│   ├── KnowledgeGraph.tsx    # 3D 图谱主组件
│   ├── GraphNodes.tsx        # 节点渲染
│   ├── GraphEdges.tsx        # 关系渲染
│   └── ControlPanel.tsx      # 控制面板
├── lib/
│   ├── db.ts             # Prisma 客户端
│   ├── r2.ts             # R2 存储配置
│   └── store.ts          # Zustand 状态管理
├── prisma/
│   └── schema.prisma     # 数据库模型
└── package.json
```

## 使用说明

### 添加节点

1. 在右侧控制面板输入节点名称
2. 选择节点类型（概念/人物/事件/地点）
3. 点击"添加节点"

### 添加关系

1. 选择起始节点
2. 选择目标节点
3. 输入关系标签
4. 点击"添加关系"

### 交互操作

- **旋转视图**: 鼠标左键拖拽
- **缩放**: 鼠标滚轮
- **平移**: 鼠标右键拖拽
- **选择节点**: 点击节点球体

## 注意事项

- 所有密钥必须在 Cloudflare Pages 控制台配置，不要写入代码
- 使用 Edge Runtime，禁用 Node.js 特定 API
- Prisma 使用 Neon adapter 以支持 Edge Runtime
- 数据库连接使用 WebSocket（Neon 自动处理）

## License

MIT
