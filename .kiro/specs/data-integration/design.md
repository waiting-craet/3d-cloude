# Design Document: Data Integration System

## Overview

本文档描述知识图谱系统的完整数据集成设计方案。该系统将建立项目-图谱-节点-边的四层数据关联架构，将所有数据操作从 localStorage 迁移到云端数据库（Neon PostgreSQL 和 Vercel Blob），确保三维视图和二维视图的数据完全同步，并实现下拉框、统计信息等UI组件与数据库的实时对接。

核心设计原则：
1. **单一数据源**：所有数据从 Neon 数据库读取，不使用 localStorage
2. **完整关联**：Project → Graph → Node/Edge 的完整外键关联
3. **实时同步**：所有视图共享同一数据源，确保一致性
4. **事务保证**：使用数据库事务确保数据完整性

## Architecture

系统采用分层架构，从底层到顶层依次为：

### 1. 数据层（Data Layer）

**Neon PostgreSQL 数据库**：
- Project 表：存储项目信息
- Graph 表：存储知识图谱信息，关联到 Project
- Node 表：存储节点信息，关联到 Project 和 Graph
- Edge 表：存储边信息，关联到 Project 和 Graph

**Vercel Blob 存储**：
- 存储节点的图片、图标等媒体文件
- 路径结构：`projects/{projectId}/graphs/{graphId}/nodes/{nodeId}/`

### 2. API 层（API Layer）

**项目管理 API**：
- `GET /api/projects` - 获取所有项目
- `POST /api/projects` - 创建项目
- `GET /api/projects/[id]` - 获取项目详情
- `DELETE /api/projects/[id]` - 删除项目

**图谱管理 API**：
- `GET /api/projects/[id]/graphs` - 获取项目的所有图谱
- `POST /api/projects/[id]/graphs` - 在项目中创建图谱
- `GET /api/graphs/[id]` - 获取图谱的完整数据（节点+边）
- `PUT /api/graphs/[id]` - 更新图谱信息
- `DELETE /api/graphs/[id]` - 删除图谱

**节点管理 API**：
- `GET /api/graphs/[id]/nodes` - 获取图谱的所有节点
- `POST /api/graphs/[id]/nodes` - 在图谱中创建节点
- `PATCH /api/nodes/[id]` - 更新节点（已存在，需扩展）
- `DELETE /api/nodes/[id]` - 删除节点（已存在，需扩展）

**边管理 API**：
- `GET /api/graphs/[id]/edges` - 获取图谱的所有边
- `POST /api/graphs/[id]/edges` - 在图谱中创建边
- `DELETE /api/edges/[id]` - 删除边（已存在，需扩展）

### 3. 状态管理层（State Management Layer）

**Zustand Store 重构**：
- 移除 localStorage 相关逻辑
- 所有数据操作通过 API 调用
- 添加 loading 和 error 状态管理
- 添加数据刷新机制

### 4. 表示层（Presentation Layer）

**TopNavbar 组件**：
- 从 API 加载项目和图谱列表
- 显示实时统计信息（节点数、边数）
- 处理图谱切换逻辑

**KnowledgeGraph 组件（三维视图）**：
- 从当前图谱加载节点和边
- 创建节点时关联 projectId 和 graphId
- 创建边时关联 projectId 和 graphId

**WorkflowCanvas 组件（二维视图）**：
- 从当前图谱加载节点和边
- 与三维视图共享相同的数据源
- 确保数据同步

## Components and Interfaces

### Database Schema Extensions

扩展现有的 Prisma schema，建立完整的数据关联：

```prisma
// Graph 模型 - 知识图谱
model Graph {
  id          String   @id @default(cuid())
  name        String
  description String?
  
  // 项目关联
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  // 配置
  settings    String?  // JSON 格式
  isPublic    Boolean  @default(false)
  
  // 统计信息
  nodeCount   Int      @default(0)
  edgeCount   Int      @default(0)
  
  // 时间戳
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联关系
  nodes       Node[]
  edges       Edge[]
  
  @@index([projectId])
  @@index([createdAt])
}

// Project 模型扩展
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  settings    String?
  
  // 统计信息（聚合所有图谱）
  nodeCount   Int      @default(0)
  edgeCount   Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联关系
  graphs      Graph[]  // 新增：一个项目包含多个图谱
  nodes       Node[]
  edges       Edge[]
  
  @@index([createdAt])
}

// Node 模型扩展
model Node {
  // ... 现有字段 ...
  
  // 图谱关联（新增）
  graphId     String?
  graph       Graph?   @relation(fields: [graphId], references: [id], onDelete: Cascade)
  
  // 项目关联（已存在）
  projectId   String?
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([graphId])
  @@index([projectId])
}

// Edge 模型扩展
model Edge {
  // ... 现有字段 ...
  
  // 图谱关联（新增）
  graphId     String?
  graph       Graph?   @relation(fields: [graphId], references: [id], onDelete: Cascade)
  
  // 项目关联（已存在）
  projectId   String?
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([graphId])
  @@index([projectId])
}
```

### API Interfaces

#### Project API

```typescript
// GET /api/projects
interface GetProjectsResponse {
  projects: Array<{
    id: string
    name: string
    description: string | null
    nodeCount: number
    edgeCount: number
    graphCount: number  // 图谱数量
    createdAt: string
    updatedAt: string
  }>
}

// POST /api/projects
interface CreateProjectRequest {
  name: string
  description?: string
  initialGraphName?: string  // 可选：同时创建第一个图谱
}

interface CreateProjectResponse {
  project: {
    id: string
    name: string
    description: string | null
    createdAt: string
  }
  graph?: {  // 如果创建了初始图谱
    id: string
    name: string
    projectId: string
  }
}

// GET /api/projects/[id]
interface GetProjectResponse {
  project: {
    id: string
    name: string
    description: string | null
    nodeCount: number
    edgeCount: number
    createdAt: string
    updatedAt: string
  }
  graphs: Array<{
    id: string
    name: string
    nodeCount: number
    edgeCount: number
    createdAt: string
  }>
}
```

#### Graph API

```typescript
// GET /api/projects/[id]/graphs
interface GetProjectGraphsResponse {
  graphs: Array<{
    id: string
    name: string
    description: string | null
    nodeCount: number
    edgeCount: number
    createdAt: string
    updatedAt: string
  }>
}

// POST /api/projects/[id]/graphs
interface CreateGraphRequest {
  name: string
  description?: string
}

interface CreateGraphResponse {
  graph: {
    id: string
    name: string
    projectId: string
    nodeCount: number
    edgeCount: number
    createdAt: string
  }
}

// GET /api/graphs/[id]
interface GetGraphResponse {
  graph: {
    id: string
    name: string
    description: string | null
    projectId: string
    nodeCount: number
    edgeCount: number
    createdAt: string
  }
  nodes: Node[]
  edges: Edge[]
}

// PUT /api/graphs/[id]
interface UpdateGraphRequest {
  name?: string
  description?: string
  nodeCount?: number  // 用于统计更新
  edgeCount?: number  // 用于统计更新
}

interface UpdateGraphResponse {
  graph: {
    id: string
    name: string
    nodeCount: number
    edgeCount: number
    updatedAt: string
  }
}
```

#### Node API Extensions

```typescript
// POST /api/graphs/[id]/nodes
interface CreateNodeInGraphRequest {
  name: string
  type: string
  description?: string
  x?: number
  y?: number
  z?: number
  color?: string
  size?: number
  imageUrl?: string
}

interface CreateNodeInGraphResponse {
  node: Node
  graph: {
    id: string
    nodeCount: number  // 更新后的计数
  }
}

// GET /api/graphs/[id]/nodes
interface GetGraphNodesResponse {
  nodes: Node[]
}
```

#### Edge API Extensions

```typescript
// POST /api/graphs/[id]/edges
interface CreateEdgeInGraphRequest {
  fromNodeId: string
  toNodeId: string
  label: string
  weight?: number
}

interface CreateEdgeInGraphResponse {
  edge: Edge
  graph: {
    id: string
    edgeCount: number  // 更新后的计数
  }
}

// GET /api/graphs/[id]/edges
interface GetGraphEdgesResponse {
  edges: Edge[]
}
```

### Zustand Store Refactoring

重构后的 store 接口：

```typescript
interface GraphStore {
  // 数据状态
  nodes: Node[]
  edges: Edge[]
  projects: Project[]
  currentProject: Project | null
  currentGraph: Graph | null
  
  // UI 状态
  selectedNode: Node | null
  connectingFromNode: Node | null
  isDragging: boolean
  
  // 加载状态
  isLoading: boolean
  error: string | null
  
  // 数据加载方法
  loadProjects: () => Promise<void>
  loadProjectGraphs: (projectId: string) => Promise<void>
  loadGraphData: (graphId: string) => Promise<void>
  
  // 项目操作
  createProject: (name: string, description?: string, initialGraphName?: string) => Promise<Project>
  deleteProject: (projectId: string) => Promise<void>
  
  // 图谱操作
  createGraph: (projectId: string, name: string, description?: string) => Promise<Graph>
  switchGraph: (projectId: string, graphId: string) => Promise<void>
  deleteGraph: (graphId: string) => Promise<void>
  
  // 节点操作
  addNode: (graphId: string, node: Partial<Node>) => Promise<Node>
  updateNode: (nodeId: string, updates: Partial<Node>) => Promise<Node>
  deleteNode: (nodeId: string) => Promise<void>
  
  // 边操作
  addEdge: (graphId: string, edge: Partial<Edge>) => Promise<Edge>
  deleteEdge: (edgeId: string) => Promise<void>
  
  // UI 状态设置
  setSelectedNode: (node: Node | null) => void
  setConnectingFromNode: (node: Node | null) => void
  setIsDragging: (isDragging: boolean) => void
}
```

## Data Models

### Extended Models

```typescript
interface Project {
  id: string
  name: string
  description: string | null
  settings: string | null
  nodeCount: number
  edgeCount: number
  createdAt: Date
  updatedAt: Date
  graphs: Graph[]  // 包含的图谱列表
}

interface Graph {
  id: string
  name: string
  description: string | null
  projectId: string
  settings: string | null
  isPublic: boolean
  nodeCount: number
  edgeCount: number
  createdAt: Date
  updatedAt: Date
}

interface Node {
  // ... 现有字段 ...
  graphId: string | null  // 新增：所属图谱 ID
  projectId: string | null  // 已存在：所属项目 ID
}

interface Edge {
  // ... 现有字段 ...
  graphId: string | null  // 新增：所属图谱 ID
  projectId: string | null  // 已存在：所属项目 ID
}
```

## Data Flow

### 1. 页面加载流程

```
用户打开页面
  ↓
TopNavbar 组件挂载
  ↓
调用 store.loadProjects()
  ↓
GET /api/projects
  ↓
Prisma 查询所有项目（包含图谱列表和统计信息）
  ↓
返回项目数据
  ↓
更新 store.projects
  ↓
TopNavbar 渲染下拉框
```

### 2. 切换图谱流程

```
用户在下拉框选择图谱
  ↓
调用 store.switchGraph(projectId, graphId)
  ↓
设置 currentProject 和 currentGraph
  ↓
调用 store.loadGraphData(graphId)
  ↓
GET /api/graphs/[graphId]
  ↓
Prisma 查询图谱的所有节点和边
  ↓
返回节点和边数据
  ↓
更新 store.nodes 和 store.edges
  ↓
KnowledgeGraph 和 WorkflowCanvas 重新渲染
```

### 3. 创建节点流程

```
用户在三维/二维视图创建节点
  ↓
调用 store.addNode(graphId, nodeData)
  ↓
POST /api/graphs/[graphId]/nodes
  ↓
Prisma 事务：
  1. 创建节点记录（设置 graphId 和 projectId）
  2. 更新图谱的 nodeCount
  3. 更新项目的 nodeCount
  ↓
返回新节点和更新后的统计信息
  ↓
更新 store.nodes
  ↓
更新 store.currentGraph.nodeCount
  ↓
UI 自动刷新显示新节点
```

### 4. 创建边流程

```
用户在三维/二维视图创建边
  ↓
调用 store.addEdge(graphId, edgeData)
  ↓
POST /api/graphs/[graphId]/edges
  ↓
Prisma 事务：
  1. 验证源节点和目标节点存在且属于当前图谱
  2. 创建边记录（设置 graphId 和 projectId）
  3. 更新图谱的 edgeCount
  4. 更新项目的 edgeCount
  ↓
返回新边和更新后的统计信息
  ↓
更新 store.edges
  ↓
更新 store.currentGraph.edgeCount
  ↓
UI 自动刷新显示新边
```

### 5. 创建项目和图谱流程

```
用户点击"新建图谱"按钮
  ↓
打开 CreateProjectModal
  ↓
用户选择"新建项目"或"添加到现有项目"
  ↓
情况 A：新建项目
  调用 store.createProject(projectName, description, graphName)
  ↓
  POST /api/projects
  body: { name, description, initialGraphName }
  ↓
  Prisma 事务：
    1. 创建项目记录
    2. 创建初始图谱记录
  ↓
  返回项目和图谱数据
  ↓
  更新 store.projects
  ↓
  自动切换到新图谱

情况 B：添加到现有项目
  调用 store.createGraph(projectId, graphName, description)
  ↓
  POST /api/projects/[projectId]/graphs
  body: { name, description }
  ↓
  Prisma 创建图谱记录
  ↓
  返回图谱数据
  ↓
  更新 store.projects 中对应项目的 graphs 数组
  ↓
  自动切换到新图谱
```

## Error Handling

### Validation Errors

- **空项目名称**：400 Bad Request - "项目名称不能为空"
- **空图谱名称**：400 Bad Request - "图谱名称不能为空"
- **项目不存在**：404 Not Found - "项目不存在"
- **图谱不存在**：404 Not Found - "图谱不存在"
- **节点不属于图谱**：400 Bad Request - "节点不属于当前图谱"
- **边的节点不在同一图谱**：400 Bad Request - "边的两个节点必须在同一图谱中"

### Database Errors

- **连接失败**：503 Service Unavailable - "数据库连接失败，请稍后重试"
- **查询超时**：504 Gateway Timeout - "数据库查询超时"
- **外键约束违反**：409 Conflict - "数据关联错误，请检查输入"
- **事务失败**：500 Internal Server Error - "操作失败，已回滚所有更改"

### UI Error Handling

```typescript
// Store 中的错误处理模式
try {
  setIsLoading(true)
  setError(null)
  
  const response = await fetch('/api/...')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '操作失败')
  }
  
  const data = await response.json()
  // 更新状态
  
} catch (error) {
  setError(error.message)
  console.error('操作失败:', error)
  
  // 显示 Toast 通知
  showToast({
    type: 'error',
    message: error.message,
  })
} finally {
  setIsLoading(false)
}
```

## Testing Strategy

### Unit Tests

单元测试验证特定示例和边界情况：

- **数据库架构**：测试外键关联、级联删除配置
- **API 端点**：测试每个端点的请求和响应格式
- **数据验证**：测试空值、无效 ID、不存在的资源
- **边界情况**：测试空项目、空图谱、大量数据
- **错误场景**：测试数据库连接失败、事务回滚

### Property-Based Tests

属性测试使用 fast-check 库验证通用属性，每个测试运行最少 100 次迭代。

测试配置：
- 库：fast-check（TypeScript 属性测试库）
- 迭代次数：每个属性测试最少 100 次
- 标签格式：`// Feature: data-integration, Property N: [property text]`

测试方法：
- 单元测试关注具体场景和边界情况
- 属性测试验证所有可能输入的行为
- 两种方法互补，共同提供全面覆盖

## Implementation Notes

### Database Migration Strategy

```bash
# 1. 添加 Graph 模型和关联关系
npx prisma migrate dev --name add_graph_model

# 2. 为 Node 和 Edge 添加 graphId 字段
npx prisma migrate dev --name add_graph_id_to_nodes_edges

# 3. 生成新的 Prisma Client
npx prisma generate
```

### Transaction Patterns

#### 创建节点时更新统计

```typescript
await prisma.$transaction(async (tx) => {
  // 1. 创建节点
  const node = await tx.node.create({
    data: {
      ...nodeData,
      graphId,
      projectId,
    },
  })
  
  // 2. 更新图谱统计
  await tx.graph.update({
    where: { id: graphId },
    data: { nodeCount: { increment: 1 } },
  })
  
  // 3. 更新项目统计
  await tx.project.update({
    where: { id: projectId },
    data: { nodeCount: { increment: 1 } },
  })
  
  return node
})
```

#### 删除图谱时级联删除

```typescript
await prisma.$transaction(async (tx) => {
  // 1. 获取图谱信息（用于更新项目统计）
  const graph = await tx.graph.findUnique({
    where: { id: graphId },
    select: { nodeCount: true, edgeCount: true, projectId: true },
  })
  
  // 2. 删除图谱（级联删除节点和边）
  await tx.graph.delete({
    where: { id: graphId },
  })
  
  // 3. 更新项目统计
  await tx.project.update({
    where: { id: graph.projectId },
    data: {
      nodeCount: { decrement: graph.nodeCount },
      edgeCount: { decrement: graph.edgeCount },
    },
  })
})
```

### Blob Storage Path Structure

```
projects/
  {projectId}/
    graphs/
      {graphId}/
        nodes/
          {nodeId}/
            image.jpg
            icon.png
```

### Performance Optimizations

1. **数据库索引**：
   - `Graph.projectId` - 加速项目图谱查询
   - `Node.graphId` - 加速图谱节点查询
   - `Edge.graphId` - 加速图谱边查询

2. **查询优化**：
   - 使用 `select` 限制返回字段
   - 使用 `include` 预加载关联数据
   - 避免 N+1 查询问题

3. **前端优化**：
   - 使用 React.memo 避免不必要的重渲染
   - 使用 useMemo 缓存计算结果
   - 使用 useCallback 稳定函数引用

### Migration from localStorage

迁移步骤：

1. **保留现有数据**：
   - 在开发环境中，可以编写脚本将 localStorage 数据导入数据库
   - 脚本读取 localStorage 的 projects 数据
   - 为每个项目和图谱创建数据库记录

2. **移除 localStorage 代码**：
   - 从 store.ts 中移除所有 localStorage.setItem 和 localStorage.getItem 调用
   - 移除 useEffect 中的 localStorage 恢复逻辑

3. **测试验证**：
   - 清空 localStorage
   - 测试所有功能是否正常工作
   - 验证数据持久化到数据库

### Component Update Strategy

#### TopNavbar 更新

```typescript
// 移除 localStorage 逻辑
useEffect(() => {
  // 从 API 加载项目
  loadProjects()
}, [])

// 使用 store 中的数据
const { projects, currentProject, currentGraph } = useGraphStore()
```

#### KnowledgeGraph 更新

```typescript
// 确保使用当前图谱 ID
const { currentGraph, addNode, addEdge } = useGraphStore()

const handleAddNode = async (nodeData) => {
  if (!currentGraph) {
    showToast({ type: 'error', message: '请先选择一个图谱' })
    return
  }
  
  await addNode(currentGraph.id, nodeData)
}
```

#### WorkflowCanvas 更新

```typescript
// 与 KnowledgeGraph 使用相同的数据源
const { nodes, edges, currentGraph } = useGraphStore()

// 确保数据同步
useEffect(() => {
  if (currentGraph) {
    // 数据已经在 store 中，无需额外加载
  }
}, [currentGraph])
```



## Correctness Properties

*属性（Property）是系统在所有有效执行中都应该保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: 项目删除级联完整性
*对于任何* 项目，删除该项目后，该项目的所有图谱、节点和边都应该从数据库中完全移除
**Validates: Requirements 1.4, 15.2**

### Property 2: 图谱删除级联完整性
*对于任何* 图谱，删除该图谱后，该图谱的所有节点和边都应该从数据库中完全移除
**Validates: Requirements 1.5**

### Property 3: 项目列表查询完整性
*对于任何* 数据库状态，查询项目列表应该返回数据库中所有存在的项目
**Validates: Requirements 2.1, 11.2**

### Property 4: 项目图谱查询完整性
*对于任何* 项目，查询该项目的图谱列表应该返回该项目的所有图谱
**Validates: Requirements 2.2**

### Property 5: 项目显示信息完整性
*对于任何* 项目，渲染后的显示内容应该包含项目名称和图谱数量
**Validates: Requirements 2.3**

### Property 6: 图谱显示信息完整性
*对于任何* 图谱，渲染后的显示内容应该包含图谱名称、节点数量和边数量
**Validates: Requirements 2.4**

### Property 7: 项目创建往返一致性
*对于任何* 有效的项目数据，创建项目后立即查询应该返回相同的项目名称和描述
**Validates: Requirements 3.1**

### Property 8: 图谱创建往返一致性
*对于任何* 有效的图谱数据，创建图谱后立即查询应该返回相同的图谱名称和描述
**Validates: Requirements 3.2**

### Property 9: 图谱项目关联正确性
*对于任何* 在项目上下文中创建的图谱，该图谱的 projectId 应该等于指定项目的 ID
**Validates: Requirements 3.3**

### Property 10: 创建操作返回有效 ID
*对于任何* 成功的创建操作（项目或图谱），返回的 ID 应该不为空且在数据库中可查询到对应记录
**Validates: Requirements 3.4**

### Property 11: 创建后 UI 数据刷新
*对于任何* 项目或图谱创建操作，创建成功后查询列表应该包含新创建的项目或图谱
**Validates: Requirements 3.5**

### Property 12: 节点项目和图谱关联正确性
*对于任何* 在项目和图谱上下文中创建的节点（无论在三维还是二维视图），该节点的 projectId 和 graphId 应该分别等于当前项目和图谱的 ID
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 13: 节点创建更新图谱统计
*对于任何* 图谱，创建节点后该图谱的 nodeCount 应该增加 1
**Validates: Requirements 4.5, 9.1**

### Property 14: 边项目和图谱关联正确性
*对于任何* 在项目和图谱上下文中创建的边（无论在三维还是二维视图），该边的 projectId 和 graphId 应该分别等于当前项目和图谱的 ID
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 15: 边创建更新图谱统计
*对于任何* 图谱，创建边后该图谱的 edgeCount 应该增加 1
**Validates: Requirements 5.5, 9.3**

### Property 16: 图谱节点查询完整性
*对于任何* 图谱，查询该图谱的节点列表应该返回该图谱的所有节点
**Validates: Requirements 6.1**

### Property 17: 图谱边查询完整性
*对于任何* 图谱，查询该图谱的边列表应该返回该图谱的所有边
**Validates: Requirements 6.2**

### Property 18: 数据加载后渲染完整性
*对于任何* 成功加载的图谱数据，三维视图渲染的节点数和边数应该等于加载的数据数量
**Validates: Requirements 6.3**

### Property 19: 切换图谱清空旧数据
*对于任何* 图谱切换操作，切换后当前显示的节点和边应该全部属于新图谱，不包含旧图谱的数据
**Validates: Requirements 6.4**

### Property 20: 节点编辑数据加载完整性
*对于任何* 节点，点击编辑按钮后查询应该返回该节点的所有字段数据
**Validates: Requirements 7.1**

### Property 21: 节点图片 URL 有效性
*对于任何* 包含图片的节点，查询返回的 imageUrl 应该是有效的 Blob 存储 URL
**Validates: Requirements 7.2**

### Property 22: 编辑模态框预填充完整性
*对于任何* 节点，打开编辑模态框后所有输入字段应该被预填充为节点的当前值
**Validates: Requirements 7.3**

### Property 23: 节点更新往返一致性
*对于任何* 节点更新操作，更新后立即查询应该返回更新后的值
**Validates: Requirements 7.4**

### Property 24: 节点图片替换完整性
*对于任何* 包含图片的节点，上传新图片后旧图片应该从 Blob 存储中删除，新图片应该存在且可访问
**Validates: Requirements 7.5**

### Property 25: 跨视图节点创建同步
*对于任何* 在三维或二维视图中创建的节点，该节点应该在两个视图中都可见
**Validates: Requirements 8.1, 8.2**

### Property 26: 跨视图节点删除同步
*对于任何* 在三维或二维视图中删除的节点，该节点应该在两个视图中都不可见
**Validates: Requirements 8.3, 8.4**

### Property 27: 视图切换数据一致性
*对于任何* 视图切换操作，切换后两个视图显示的节点和边数据应该完全相同
**Validates: Requirements 8.5**

### Property 28: 节点删除更新图谱统计
*对于任何* 图谱，删除节点后该图谱的 nodeCount 应该减少 1
**Validates: Requirements 9.2**

### Property 29: 边删除更新图谱统计
*对于任何* 图谱，删除边后该图谱的 edgeCount 应该减少 1
**Validates: Requirements 9.4**

### Property 30: UI 统计信息实时更新
*对于任何* 数据修改操作（创建/删除节点或边），刷新下拉框后显示的统计数字应该反映最新的数据库状态
**Validates: Requirements 9.5**

### Property 31: 节点查询数据隔离
*对于任何* 图谱，查询该图谱的节点应该只返回 graphId 等于该图谱 ID 的节点，不包含其他图谱的节点
**Validates: Requirements 10.1**

### Property 32: 边查询数据隔离
*对于任何* 图谱，查询该图谱的边应该只返回 graphId 等于该图谱 ID 的边，不包含其他图谱的边
**Validates: Requirements 10.2**

### Property 33: 图谱查询数据隔离
*对于任何* 项目，查询该项目的图谱应该只返回 projectId 等于该项目 ID 的图谱，不包含其他项目的图谱
**Validates: Requirements 10.3**

### Property 34: 节点创建验证项目和图谱存在
*对于任何* 节点创建请求，如果指定的项目 ID 或图谱 ID 不存在于数据库中，系统应该拒绝该请求并返回错误
**Validates: Requirements 10.4**

### Property 35: 边创建验证节点属于同一图谱
*对于任何* 边创建请求，如果源节点或目标节点不属于指定的图谱，系统应该拒绝该请求并返回错误
**Validates: Requirements 10.5**

### Property 36: 创建操作错误消息具体性
*对于任何* 失败的创建操作，返回的错误消息应该包含失败的具体原因（如"项目不存在"、"节点名称不能为空"等）
**Validates: Requirements 13.2**

### Property 37: 操作成功反馈
*对于任何* 成功的数据操作（创建、更新、删除），系统应该显示成功提示消息
**Validates: Requirements 13.4**

### Property 38: 事务原子性保证
*对于任何* 需要多步操作的事务（如创建节点并更新统计），如果任何一步失败，所有操作都应该被回滚，数据库状态应该保持不变
**Validates: Requirements 15.1, 15.4**

