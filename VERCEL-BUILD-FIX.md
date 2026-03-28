# Vercel 部署构建错误修复

## 问题描述

Vercel 部署时出现多个编译错误：

### 错误 1: 缺少导出函数
提示多个函数从 `@/lib/db-helpers` 导入失败：

```
Module '"@/lib/db-helpers"' has no exported member 'createDocumentNode'.
Module '"@/lib/db-helpers"' has no exported member 'splitDocumentIntoChunks'.
Module '"@/lib/db-helpers"' has no exported member 'getNodeNeighbors'.
Module '"@/lib/db-helpers"' has no exported member 'searchNodes'.
Module '"@/lib/db-helpers"' has no exported member 'getGraphStats'.
```

### 错误 2: PutBlobResult 类型错误
```
Property 'size' does not exist on type 'PutBlobResult'.
```

### 错误 3: Graph 模型缺少必需字段
```
Property 'project' is missing in type '{ name: string; description: string; nodeCount: number; edgeCount: number; isPublic: true; }' but required in type 'GraphCreateInput'.
```

### 错误 4: Project 模型不存在的字段
```
Object literal may only specify known properties, and 'isPublic' does not exist in type 'ProjectCreateInput'.
```

## 根本原因

### 原因 1: 缺少函数实现
`lib/db-helpers.ts` 文件中缺少以下 API 路由所需的函数实现。

### 原因 2: 错误的属性访问
`app/api/upload/route.ts` 中尝试从 `PutBlobResult` 获取 `size` 属性，但该类型不包含此属性。

### 原因 3: 数据模型关系错误
`scripts/seed.ts` 中创建 Graph 时没有关联到 Project，但根据 Prisma schema，Graph 必须关联到一个 Project（`projectId` 是必需字段）。

### 原因 4: 使用了不存在的字段
`scripts/seed.ts` 中创建 Project 时使用了 `isPublic` 字段，但 Project 模型中不存在此字段（只有 Graph 模型有 `isPublic` 字段）。

## 解决方案

### 修复 1: 添加缺失函数
在 `lib/db-helpers.ts` 中添加了所有缺失的函数：

1. **createDocumentNode** - 创建文档节点，支持内容、标签和分类
2. **splitDocumentIntoChunks** - 将文档内容分割成多个 chunk 节点，并创建关联边
3. **getNodeNeighbors** - 获取指定节点的邻居节点，支持深度遍历
4. **searchNodes** - 根据名称、描述或类型搜索节点
5. **getGraphStats** - 获取图谱统计信息，包括节点数、边数、节点类型分布和平均连接数

### 修复 2: 修正文件大小获取
将 `blob.size` 改为 `file.size`，从原始 File 对象获取文件大小而不是从 PutBlobResult。

```typescript
// 修改前
size: blob.size,

// 修改后
size: file.size,
```

### 修复 3: 修正数据模型关系
修改 `scripts/seed.ts` 以正确创建数据层级关系：

1. 先创建 Project
2. 创建 Graph 并关联到 Project（通过 `projectId`）
3. 创建所有 Node 并关联到 Graph（通过 `graphId`）
4. 创建所有 Edge 并关联到 Graph（通过 `graphId`）

```typescript
// 创建项目（移除不存在的 isPublic 字段）
const project = await prisma.project.create({
  data: {
    name: 'RAG 知识图谱项目',
    description: 'Retrieval-Augmented Generation 系统演示',
    // isPublic: true,  // ❌ 删除：Project 模型没有此字段
  },
})

// 创建图谱并关联到项目
const graph = await prisma.graph.create({
  data: {
    name: 'RAG 树状知识图谱',
    description: 'RAG 系统的树状结构展示',
    nodeCount: 8,
    edgeCount: 7,
    isPublic: true,  // ✅ Graph 模型有此字段
    projectId: project.id,  // 关联到项目
  },
})

// 创建节点并关联到图谱
const node = await prisma.node.create({
  data: {
    // ... 其他字段
    graphId: graph.id,  // 关联到图谱
  },
})
```

## 其他修复

修复了 `scripts/test-graph-sync.ts` 文件的语法错误（文件不完整）。

## 验证

所有相关文件现在都能正确编译：
- ✅ app/api/documents/route.ts
- ✅ app/api/nodes/[id]/neighbors/route.ts
- ✅ app/api/search/route.ts
- ✅ app/api/stats/route.ts
- ✅ app/api/upload/route.ts
- ✅ lib/db-helpers.ts
- ✅ scripts/seed.ts

## 下一步

现在可以重新部署到 Vercel，构建应该会成功。

注意：测试文件中的 TypeScript 错误不会影响 Vercel 构建，因为 Next.js 构建过程不包含测试文件。
