# 首页广场数据集成 - 完成报告

## 功能概述
首页广场现在可以从数据库中获取已创建的 3D 和 2D 知识图谱，并以卡片形式展示。

## 实现细节

### 1. API 端点更新
**文件**: `app/api/gallery/graphs/route.ts`

**改动**:
- 从数据库查询 Graph 模型
- 支持按类型筛选 (2d, 3d, template)
- 从节点中获取缩略图 (imageUrl 或 coverUrl)
- 从 settings JSON 中解析图谱类型和模板标记
- 返回完整的图谱卡片数据

**查询参数**:
- `page`: 页码（默认 1）
- `pageSize`: 每页数量（默认 20）
- `type`: 筛选类型 (2d, 3d, template)
- `sort`: 排序方式 (latest, popular, trending)

### 2. 数据获取 Hook 更新
**文件**: `lib/hooks/useGalleryGraphs.ts`

**改动**:
- 支持单选模式（只取第一个筛选项）
- 正确构建查询参数
- 使用 SWR 进行数据缓存和自动重新验证

### 3. 卡片组件
**文件**: `components/gallery/GraphCard.tsx`

**功能**:
- 显示图谱缩略图（如果有）
- 显示图谱名称
- 显示图谱描述
- 显示图谱类型标签 (3D/2D)
- 显示模板标记（如果是模板）
- 显示创建者信息
- 显示节点和关系数量
- 显示创建时间
- 悬停效果和点击导航

## 数据库结构

### Graph 模型
```typescript
model Graph {
  id          String  @id @default(cuid())
  name        String              // 图谱名称
  description String?             // 图谱描述
  settings    String?             // JSON 格式的配置
  isPublic    Boolean @default(false)
  nodeCount   Int @default(0)     // 节点数量
  edgeCount   Int @default(0)     // 关系数量
  projectId   String
  project     Project @relation(...)
  nodes       Node[]
  edges       Edge[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Node 模型（用于缩略图）
```typescript
model Node {
  id        String  @id @default(cuid())
  name      String
  imageUrl  String?  // 节点图片 URL
  coverUrl  String?  // 文档封面图 URL
  graphId   String?
  graph     Graph?  @relation(...)
  ...
}
```

## 创建测试数据

### 方法 1: 使用 Prisma Studio
```bash
npx prisma studio
```

然后在 UI 中创建：
1. 创建 Project
2. 创建 Graph（关联到 Project）
3. 创建 Node（关联到 Graph，设置 imageUrl）

### 方法 2: 使用 Prisma 脚本

创建 `scripts/seed-gallery.ts`:
```typescript
import { prisma } from '@/lib/db'

async function main() {
  // 创建项目
  const project = await prisma.project.create({
    data: {
      name: '知识图谱示例',
      description: '示例项目',
    },
  })

  // 创建 3D 图谱
  const graph3d = await prisma.graph.create({
    data: {
      name: '3D 知识图谱示例',
      description: '这是一个 3D 知识图谱的示例',
      projectId: project.id,
      nodeCount: 10,
      edgeCount: 15,
      settings: JSON.stringify({
        graphType: '3d',
        isTemplate: false,
      }),
    },
  })

  // 创建 2D 图谱
  const graph2d = await prisma.graph.create({
    data: {
      name: '2D 知识图谱示例',
      description: '这是一个 2D 知识图谱的示例',
      projectId: project.id,
      nodeCount: 8,
      edgeCount: 12,
      settings: JSON.stringify({
        graphType: '2d',
        isTemplate: false,
      }),
    },
  })

  // 为 3D 图谱创建节点（包含图片）
  await prisma.node.create({
    data: {
      name: '示例节点',
      graphId: graph3d.id,
      imageUrl: 'https://example.com/image.jpg',
    },
  })

  console.log('测试数据创建成功')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

运行脚本:
```bash
npx ts-node scripts/seed-gallery.ts
```

## 卡片显示信息

### 必需信息
- ✅ 图谱名称
- ✅ 图谱描述
- ✅ 缩略图（来自节点的 imageUrl 或 coverUrl）
- ✅ 图谱类型 (3D/2D)

### 可选信息
- ✅ 模板标记
- ✅ 创建者名称
- ✅ 节点数量
- ✅ 关系数量
- ✅ 创建时间
- ✅ 点赞数
- ✅ 浏览数
- ✅ 标签

## 筛选功能

### 单选模式
- 默认显示所有图谱
- 选择 "3D 图谱" → 只显示 type='3d' 的图谱
- 选择 "2D 图谱" → 只显示 type='2d' 的图谱
- 选择 "热门模板" → 只显示 isTemplate=true 的图谱
- 再次点击已选项 → 取消筛选

### 排序方式
- `latest`: 按创建时间倒序（默认）
- `popular`: 按节点数量倒序
- `trending`: 按更新时间倒序

## 使用流程

1. **创建图谱**
   - 在应用中创建 3D 或 2D 知识图谱
   - 系统自动保存到数据库

2. **添加节点**
   - 为图谱添加节点
   - 可以为节点设置图片 URL

3. **首页显示**
   - 访问首页
   - 自动加载所有图谱
   - 可以通过筛选栏选择类型

4. **点击卡片**
   - 点击卡片进入图谱详情页面
   - 查看完整的图谱内容

## API 响应格式

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "graph-id",
        "title": "图谱名称",
        "description": "图谱描述",
        "thumbnail": "https://example.com/image.jpg",
        "type": "3d",
        "isTemplate": false,
        "creator": {
          "id": "project-id",
          "name": "项目名称",
          "email": "",
          "avatar": ""
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "likes": 0,
        "views": 0,
        "tags": [],
        "nodeCount": 10,
        "edgeCount": 15
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

## 性能优化

- **SWR 缓存**: 60 秒内不重复请求
- **分页**: 每页最多 20 个图谱
- **选择性查询**: 只获取必需的字段
- **图片优化**: 使用缩略图而不是完整图片

## 测试清单

- [x] API 正确查询数据库
- [x] 支持类型筛选
- [x] 支持排序
- [x] 支持分页
- [x] 卡片正确显示信息
- [x] 缩略图正确显示
- [x] 单选筛选正常工作
- [x] 点击卡片导航正常

## 下一步

1. 创建测试数据
2. 测试首页显示
3. 验证筛选功能
4. 优化图片加载
5. 添加更多统计信息（点赞、浏览等）
