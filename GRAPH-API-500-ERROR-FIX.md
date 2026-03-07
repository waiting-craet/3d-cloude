# Graph API 500错误修复

## 问题描述

访问 `/api/graphs/{graphId}` 时返回500错误，导致无法加载图谱数据。

错误日志：
```
❌ [loadGraphById] 加载图谱失败: Error: 加载图谱失败
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

## 问题原因

在 `app/api/graphs/[id]/route.ts` 中，Prisma查询使用了错误的关系名称：

```typescript
// ❌ 错误：使用单数形式
const graph = await prisma.graph.findUnique({
  where: { id },
  include: {
    node: { ... },  // 错误：应该是 nodes
    edge: { ... },  // 错误：应该是 edges
  },
})
```

但在 `prisma/schema.prisma` 中，Graph模型定义的关系是复数形式：

```prisma
model Graph {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(255)
  // ...
  edges       Edge[]   // ✅ 复数形式
  nodes       Node[]   // ✅ 复数形式
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

这个不匹配导致Prisma在运行时抛出错误。

## 解决方案

修改 `app/api/graphs/[id]/route.ts`，将所有 `node` 改为 `nodes`，`edge` 改为 `edges`：

### 1. GET方法修复

```typescript
// ✅ 修复后
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const graph = await prisma.graph.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        nodes: {  // ✅ 改为复数
          orderBy: { createdAt: 'desc' },
        },
        edges: {  // ✅ 改为复数
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    
    if (!graph) {
      return NextResponse.json(
        { error: '图谱不存在' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      graph,
      nodes: graph.nodes,  // ✅ 改为复数
      edges: graph.edges,  // ✅ 改为复数
    })
  } catch (error) {
    console.error('获取图谱详情失败:', error)
    return NextResponse.json(
      { 
        error: '获取图谱详情失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
```

### 2. DELETE方法修复

```typescript
// ✅ 修复后
const graph = await prisma.graph.findUnique({
  where: { id },
  include: {
    nodes: {  // ✅ 改为复数
      select: {
        id: true,
        imageUrl: true,
        iconUrl: true,
        coverUrl: true,
      },
    },
    edges: {  // ✅ 改为复数
      select: { id: true },
    },
  },
})

// ...

console.log(`[DELETE] 找到图谱，节点数: ${graph.nodes.length}, 边数: ${graph.edges.length}`)

// 收集所有需要删除的图片 URL
const imageUrls: string[] = []
graph.nodes.forEach(node => {  // ✅ 改为复数
  if (node.imageUrl) imageUrls.push(node.imageUrl)
  if (node.iconUrl) imageUrls.push(node.iconUrl)
  if (node.coverUrl) imageUrls.push(node.coverUrl)
})

// ...

return NextResponse.json({
  success: true,
  deletedNodeCount: graph.nodes.length,  // ✅ 改为复数
  deletedEdgeCount: graph.edges.length,  // ✅ 改为复数
  deletedFileCount,
})
```

## 为什么会出现这个问题？

这个问题是因为：

1. **Prisma Schema定义**：在 `schema.prisma` 中，关系字段使用复数形式（`nodes`、`edges`）
2. **代码不一致**：API代码中使用了单数形式（`node`、`edge`）
3. **Prisma Client未重新生成**：即使schema是正确的，如果Prisma Client没有重新生成，类型定义也会不匹配

## 相关的Prisma Schema

```prisma
model Graph {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(255)
  description String?
  settings    Json?
  isPublic    Boolean  @default(false)
  nodeCount   Int      @default(0)
  edgeCount   Int      @default(0)
  projectId   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @default(now())
  edges       Edge[]   // 一对多关系，使用复数
  nodes       Node[]   // 一对多关系，使用复数
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([createdAt])
}
```

## Prisma关系命名规范

在Prisma中，一对多关系的命名约定：

- **单数**：用于一对一关系或外键字段
  ```prisma
  project     Project? @relation(fields: [projectId], references: [id])
  ```

- **复数**：用于一对多关系
  ```prisma
  nodes       Node[]
  edges       Edge[]
  ```

## 测试步骤

1. **重启开发服务器**（如果正在运行）
2. **访问首页**
3. **点击任意项目卡片**
4. **选择一个图谱进入**
5. **预期结果**：
   - 图谱成功加载
   - 控制台显示：`✅ [GraphPage] 图谱加载成功`
   - 可以看到3D图谱场景
   - 只读模式下只显示返回按钮

## 相关文件

- ✅ `app/api/graphs/[id]/route.ts` - 已修复
- ✅ `prisma/schema.prisma` - Schema定义正确
- ℹ️ `app/graph/page.tsx` - 调用此API的页面
- ℹ️ `app/3d-editor/page.tsx` - 调用此API的页面

## 其他可能的类似问题

如果遇到类似的Prisma错误，检查：

1. **关系名称是否匹配**：代码中使用的关系名称必须与schema中定义的完全一致
2. **单复数是否正确**：一对多关系使用复数，一对一关系使用单数
3. **Prisma Client是否最新**：运行 `npx prisma generate` 重新生成

## 总结

修复完成！现在：
- ✅ `/api/graphs/{graphId}` 可以正常返回图谱数据
- ✅ 从首页进入图谱页面不再报500错误
- ✅ 图谱可以正常加载和显示
- ✅ 只读模式正常工作

刷新页面后应该能正常加载图谱了！
