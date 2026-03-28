# Design Document: Project Management System

## Overview

本文档描述项目管理系统的设计方案。该系统允许用户创建和管理项目，每个项目包含独立的知识图谱（节点和边），所有数据存储在云端（Neon PostgreSQL 数据库和 Vercel Blob 存储）。系统采用 Next.js App Router 架构，使用 Prisma ORM 进行数据库操作，使用 Vercel Blob SDK 进行文件存储。

## Architecture

系统采用三层架构：

1. **表示层（Presentation Layer）**：React 组件和 Next.js 页面
   - 项目列表页面（主页）
   - 知识图谱画布页面（项目详情）
   - 项目创建/编辑模态框

2. **API 层（API Layer）**：Next.js API Routes
   - `/api/projects` - 项目 CRUD 操作
   - `/api/projects/[id]/nodes` - 项目节点操作
   - `/api/projects/[id]/edges` - 项目边操作
   - `/api/upload` - 媒体文件上传（已存在，需扩展）

3. **数据层（Data Layer）**：
   - Prisma Client - 数据库 ORM
   - Vercel Blob SDK - 文件存储
   - Neon PostgreSQL - 关系型数据库

### Data Flow

```
用户操作 → React 组件 → API Route → Prisma/Blob SDK → Neon DB/Blob Storage
                ↓                                              ↓
            UI 更新 ← JSON 响应 ← 数据处理 ← 数据库响应/文件 URL
```

## Components and Interfaces

### Database Schema Extensions

需要扩展现有的 Prisma schema，添加项目模型并建立关联关系：

```prisma
// 项目模型
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  
  // 项目配置
  settings    String?  // JSON 格式的配置
  
  // 统计信息
  nodeCount   Int      @default(0)
  edgeCount   Int      @default(0)
  
  // 时间戳
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联关系
  nodes       Node[]
  edges       Edge[]
  
  @@index([createdAt])
}

// 扩展 Node 模型
model Node {
  // ... 现有字段 ...
  
  // 新增项目关联
  projectId   String?
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId])
}

// 扩展 Edge 模型
model Edge {
  // ... 现有字段 ...
  
  // 新增项目关联
  projectId   String?
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId])
}
```

### API Interfaces

#### Project API

```typescript
// GET /api/projects - 获取所有项目
interface GetProjectsResponse {
  projects: Project[]
}

// POST /api/projects - 创建项目
interface CreateProjectRequest {
  name: string
  description?: string
}

interface CreateProjectResponse {
  project: Project
}

// GET /api/projects/[id] - 获取项目详情
interface GetProjectResponse {
  project: Project
  nodes: Node[]
  edges: Edge[]
}

// PUT /api/projects/[id] - 更新项目
interface UpdateProjectRequest {
  name?: string
  description?: string
}

interface UpdateProjectResponse {
  project: Project
}

// DELETE /api/projects/[id] - 删除项目
interface DeleteProjectResponse {
  success: boolean
  deletedNodeCount: number
  deletedEdgeCount: number
  deletedFileCount: number
}
```

#### Node API Extensions

```typescript
// POST /api/projects/[id]/nodes - 在项目中创建节点
interface CreateNodeRequest {
  name: string
  type: string
  description?: string
  x?: number
  y?: number
  z?: number
  color?: string
  imageUrl?: string
}

interface CreateNodeResponse {
  node: Node
}

// GET /api/projects/[id]/nodes - 获取项目的所有节点
interface GetProjectNodesResponse {
  nodes: Node[]
}
```

#### Edge API Extensions

```typescript
// POST /api/projects/[id]/edges - 在项目中创建边
interface CreateEdgeRequest {
  fromNodeId: string
  toNodeId: string
  label: string
  weight?: number
}

interface CreateEdgeResponse {
  edge: Edge
}

// GET /api/projects/[id]/edges - 获取项目的所有边
interface GetProjectEdgesResponse {
  edges: Edge[]
}
```

### React Components

#### ProjectList Component

```typescript
interface ProjectListProps {
  projects: Project[]
  onProjectClick: (projectId: string) => void
  onCreateProject: () => void
}

// 显示项目卡片列表
// 每个卡片显示：项目名称、描述、节点数、边数、创建时间
// 支持点击卡片导航到项目详情
```

#### CreateProjectModal Component

```typescript
interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateProjectRequest) => Promise<void>
}

// 项目创建表单模态框
// 包含：项目名称输入、描述输入、提交按钮
// 验证：项目名称不能为空
```

#### ProjectContext

```typescript
interface ProjectContextValue {
  currentProjectId: string | null
  setCurrentProjectId: (id: string | null) => void
  currentProject: Project | null
  loadProject: (id: string) => Promise<void>
}

// React Context 用于管理当前活动项目
// 在整个应用中共享当前项目状态
```

## Data Models

### Project Model

```typescript
interface Project {
  id: string              // 唯一标识符（cuid）
  name: string            // 项目名称
  description: string | null  // 项目描述
  settings: string | null     // JSON 格式的配置
  nodeCount: number       // 节点数量
  edgeCount: number       // 边数量
  createdAt: Date         // 创建时间
  updatedAt: Date         // 更新时间
}
```

### Extended Node Model

```typescript
interface Node {
  // ... 现有字段 ...
  projectId: string | null  // 所属项目 ID
}
```

### Extended Edge Model

```typescript
interface Edge {
  // ... 现有字段 ...
  projectId: string | null  // 所属项目 ID
}
```

## Correctness Properties

*属性（Property）是系统在所有有效执行中都应该保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: 项目名称验证
*对于任何* 项目创建请求，如果项目名称为空或仅包含空白字符，系统应该拒绝该请求并返回验证错误
**Validates: Requirements 1.2**

### Property 2: 项目创建往返一致性
*对于任何* 有效的项目数据，创建项目后立即查询应该返回相同的项目名称和描述
**Validates: Requirements 1.3, 1.5**

### Property 3: 项目 ID 唯一性
*对于任何* 一组创建的项目，所有项目 ID 都应该是唯一的
**Validates: Requirements 1.4**

### Property 4: 项目列表完整性
*对于任何* 数据库状态，查询项目列表应该返回数据库中所有存在的项目
**Validates: Requirements 2.1**

### Property 5: 项目列表渲染完整性
*对于任何* 项目对象，渲染后的内容应该包含项目名称、描述和创建时间
**Validates: Requirements 2.2**

### Property 6: 节点项目关联
*对于任何* 在项目上下文中创建的节点，该节点的 projectId 应该等于当前项目的 ID
**Validates: Requirements 3.1**

### Property 7: 边项目关联
*对于任何* 在项目上下文中创建的边，该边的 projectId 应该等于当前项目的 ID
**Validates: Requirements 3.2**

### Property 8: 项目数据隔离
*对于任何* 项目 ID，查询该项目的节点和边应该只返回 projectId 等于该 ID 的记录
**Validates: Requirements 3.3**

### Property 9: 项目切换数据加载
*对于任何* 项目切换操作，加载的节点和边应该全部属于新项目，不包含旧项目的数据
**Validates: Requirements 3.4**

### Property 10: 节点数据往返一致性
*对于任何* 节点，创建后查询应该返回相同的元数据（名称、类型、描述、位置等）
**Validates: Requirements 4.1, 4.3**

### Property 11: 图片上传和 URL 保存
*对于任何* 包含图片的节点创建请求，节点记录中的 imageUrl 字段应该包含有效的 Blob 存储 URL
**Validates: Requirements 4.2**

### Property 12: 节点删除完整性
*对于任何* 节点删除操作，该节点应该从数据库中完全移除，且所有关联的边也应该被删除
**Validates: Requirements 4.4, 5.3**

### Property 13: 节点删除时清理 Blob 文件
*对于任何* 包含图片的节点删除操作，关联的 Blob 存储文件应该被删除
**Validates: Requirements 4.5, 10.5**

### Property 14: 边数据往返一致性
*对于任何* 边，创建后查询应该返回相同的源节点 ID、目标节点 ID 和标签
**Validates: Requirements 5.1**

### Property 15: 边删除完整性
*对于任何* 边删除操作，该边应该从数据库中完全移除
**Validates: Requirements 5.2**

### Property 16: 边创建时节点存在性验证
*对于任何* 边创建请求，如果源节点或目标节点不存在于数据库中，系统应该拒绝该请求
**Validates: Requirements 5.4, 7.2**

### Property 17: 项目数据加载完整性
*对于任何* 项目，打开项目应该加载该项目的所有节点和所有边
**Validates: Requirements 6.1, 6.2**

### Property 18: 图片 URL 有效性
*对于任何* 包含 imageUrl 的节点，该 URL 应该指向可访问的 Blob 存储资源
**Validates: Requirements 6.3**

### Property 19: 数据加载成功后渲染
*对于任何* 成功加载的项目数据，画布上渲染的节点数和边数应该等于加载的数据数量
**Validates: Requirements 6.5**

### Property 20: 项目删除级联完整性
*对于任何* 项目删除操作，该项目的所有节点、所有边和项目记录本身都应该从数据库中删除
**Validates: Requirements 8.2, 8.3, 8.4**

### Property 21: 项目删除时清理所有 Blob 文件
*对于任何* 项目删除操作，该项目所有节点关联的 Blob 文件都应该被删除
**Validates: Requirements 8.5**

### Property 22: API 请求后连接清理
*对于任何* API 请求，无论成功或失败，Prisma 客户端连接都应该被正确释放
**Validates: Requirements 9.3**

### Property 23: 文件类型验证
*对于任何* 文件上传请求，如果文件类型不是支持的图片格式，系统应该拒绝该请求
**Validates: Requirements 10.1**

### Property 24: 上传成功返回 URL
*对于任何* 成功的图片上传，响应应该包含有效的公开访问 URL
**Validates: Requirements 10.2, 10.3**

## Error Handling

### Validation Errors

- **空项目名称**：返回 400 Bad Request，消息："项目名称不能为空"
- **无效文件类型**：返回 400 Bad Request，消息："不支持的文件类型，仅支持图片"
- **文件过大**：返回 400 Bad Request，消息："文件大小超过限制（最大 5MB）"
- **节点不存在**：返回 404 Not Found，消息："源节点或目标节点不存在"

### Database Errors

- **连接失败**：返回 503 Service Unavailable，消息："数据库连接失败，请稍后重试"
- **查询超时**：返回 504 Gateway Timeout，消息："数据库查询超时"
- **约束违反**：返回 409 Conflict，消息："数据冲突，请检查输入"
- **事务失败**：回滚所有操作，返回 500 Internal Server Error

### Storage Errors

- **上传失败**：返回 500 Internal Server Error，消息："文件上传失败"
- **删除失败**：记录错误日志，继续执行（不阻塞主流程）
- **Blob Token 未配置**：返回 503 Service Unavailable，消息："文件存储服务未配置"

### Error Recovery

- **部分删除失败**：如果删除 Blob 文件失败，记录错误但不回滚数据库操作
- **数据不一致检测**：定期运行清理脚本，删除孤立的 Blob 文件
- **连接池耗尽**：使用 Prisma 的连接池管理，自动等待可用连接

## Testing Strategy

### Unit Tests

单元测试验证特定示例和边界情况：

- **项目创建**：测试有效项目名称、空名称、特殊字符
- **数据验证**：测试各种无效输入（null、undefined、空字符串）
- **边界情况**：测试空项目列表、单个项目、大量项目
- **错误场景**：测试数据库连接失败、上传失败、删除失败
- **级联删除**：测试删除项目时节点和边的清理
- **文件清理**：测试删除节点时 Blob 文件的清理

### Property-Based Tests

属性测试使用 fast-check 库验证通用属性，每个测试运行最少 100 次迭代：

- **数据往返**：生成随机项目/节点/边数据，验证创建后查询的一致性
- **ID 唯一性**：生成多个项目，验证所有 ID 唯一
- **数据隔离**：生成多个项目和节点，验证查询只返回当前项目的数据
- **级联删除**：生成项目和关联数据，验证删除项目时所有数据被清理
- **输入验证**：生成各种输入（包括无效输入），验证验证逻辑正确

**测试配置**：
- 库：fast-check（TypeScript 属性测试库）
- 迭代次数：每个属性测试最少 100 次
- 标签格式：`// Feature: project-management, Property N: [property text]`

**测试方法**：
- 单元测试关注具体场景和边界情况
- 属性测试验证所有可能输入的行为
- 两种方法互补，共同提供全面覆盖
- 属性测试处理输入空间探索，单元测试验证重要的具体案例

### Integration Tests

- **完整工作流**：创建项目 → 添加节点 → 创建边 → 删除项目
- **项目切换**：创建多个项目，切换并验证数据隔离
- **文件上传流程**：上传图片 → 创建节点 → 验证 URL → 删除节点 → 验证文件清理
- **错误恢复**：模拟上传失败，验证数据库回滚
- **并发操作**：多个用户同时操作不同项目，验证数据一致性

## Implementation Notes

### Database Migrations

使用 Prisma Migrate 管理数据库架构变更：

```bash
# 创建迁移
npx prisma migrate dev --name add_project_model

# 应用迁移到生产环境
npx prisma migrate deploy
```

### Prisma Client Usage

```typescript
// 创建项目
const project = await prisma.project.create({
  data: {
    name: 'My Project',
    description: 'Project description',
  },
})

// 查询项目及其关联数据
const projectWithData = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    nodes: true,
    edges: true,
  },
})

// 删除项目（级联删除节点和边）
await prisma.project.delete({
  where: { id: projectId },
})
```

### Blob Storage Best Practices

```typescript
// 上传文件时使用项目 ID 作为路径前缀
const filename = `projects/${projectId}/nodes/${nodeId}/image.jpg`

// 删除项目时批量删除文件
const blobs = await list({ prefix: `projects/${projectId}/` })
await Promise.all(blobs.map(blob => del(blob.url)))
```

### Transaction Handling

对于需要原子性的操作，使用 Prisma 事务：

```typescript
await prisma.$transaction(async (tx) => {
  // 创建节点
  const node = await tx.node.create({ data: nodeData })
  
  // 更新项目统计
  await tx.project.update({
    where: { id: projectId },
    data: { nodeCount: { increment: 1 } },
  })
})
```

### Error Handling Pattern

```typescript
try {
  // 数据库操作
  const result = await prisma.project.create({ data })
  return NextResponse.json(result)
} catch (error) {
  console.error('Error:', error)
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // 处理已知的 Prisma 错误
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '项目名称已存在' },
        { status: 409 }
      )
    }
  }
  
  return NextResponse.json(
    { error: '操作失败' },
    { status: 500 }
  )
}
```

### State Management

使用 React Context 管理当前项目状态：

```typescript
// ProjectContext.tsx
const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  
  const loadProject = async (id: string) => {
    const response = await fetch(`/api/projects/${id}`)
    const data = await response.json()
    setCurrentProject(data.project)
    setCurrentProjectId(id)
  }
  
  return (
    <ProjectContext.Provider value={{
      currentProjectId,
      setCurrentProjectId,
      currentProject,
      loadProject,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}
```

### URL Structure

- 主页（项目列表）：`/`
- 项目详情（知识图谱）：`/projects/[id]`
- 工作流画布：`/workflow?projectId=[id]`

### Performance Considerations

- **分页加载**：项目列表支持分页，避免一次加载过多数据
- **懒加载图片**：使用 Next.js Image 组件优化图片加载
- **索引优化**：在 projectId、createdAt 等字段上创建数据库索引
- **连接池**：配置合适的 Prisma 连接池大小
- **缓存策略**：使用 Next.js 的 revalidate 选项缓存项目列表

### Security Considerations

- **输入验证**：所有用户输入都需要验证和清理
- **SQL 注入防护**：使用 Prisma 的参数化查询
- **文件类型验证**：严格验证上传文件的 MIME 类型
- **文件大小限制**：限制上传文件大小（图片 5MB）
- **访问控制**：未来可以添加用户认证和项目权限管理
