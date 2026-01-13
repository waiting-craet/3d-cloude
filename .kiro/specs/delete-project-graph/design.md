# Design Document: 删除项目和图谱功能

## Overview

本设计文档描述了在项目-图谱管理界面中添加删除功能的实现方案。该功能允许用户通过点击删除按钮来删除项目或图谱，并在删除前通过确认对话框防止误操作。删除操作将级联删除所有关联数据，包括节点、边和媒体文件。

现有系统已经实现了DELETE API端点（`/api/projects/[id]` 和 `/api/graphs/[id]`），本设计主要关注前端UI组件的实现，包括删除按钮、确认对话框和状态管理。

## Architecture

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    ProjectGraphManager                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Project     │  │   Graph      │  │    Node      │      │
│  │  List        │  │   List       │  │    List      │      │
│  │  + Delete    │  │   + Delete   │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                  │                                 │
│         └──────────┬───────┘                                 │
│                    │                                         │
│         ┌──────────▼──────────┐                             │
│         │ DeleteConfirmDialog │                             │
│         └──────────┬──────────┘                             │
└────────────────────┼──────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │   API Layer         │
          │  DELETE /api/       │
          │  projects/[id]      │
          │  graphs/[id]        │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │   Database          │
          │   (Prisma + Neon)   │
          │   + Blob Storage    │
          └─────────────────────┘
```

### 组件层次结构

```
ProjectGraphManager
├── ProjectList
│   └── ProjectItem
│       ├── ProjectInfo (name, stats)
│       └── DeleteButton → triggers DeleteConfirmDialog
├── GraphList
│   └── GraphItem
│       ├── GraphInfo (name, stats)
│       └── DeleteButton → triggers DeleteConfirmDialog
└── DeleteConfirmDialog (shared component)
    ├── WarningIcon
    ├── EntityInfo (name, stats)
    ├── ConfirmButton
    └── CancelButton
```

## Components and Interfaces

### 1. DeleteButton Component

删除按钮组件，显示在项目和图谱列表项的右侧。

```typescript
interface DeleteButtonProps {
  onDelete: (e: React.MouseEvent) => void
  disabled?: boolean
  ariaLabel: string
}

// 使用示例
<DeleteButton
  onDelete={handleDeleteClick}
  disabled={isDeleting}
  ariaLabel="删除项目"
/>
```

**设计要点：**
- 使用垃圾桶图标（Trash icon）
- 悬停时显示红色高亮
- 点击时阻止事件冒泡，避免触发父元素的选择事件
- 禁用状态下显示灰色并不可点击

### 2. DeleteConfirmDialog Component

确认对话框组件，用于确认删除操作。

```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  entityType: 'project' | 'graph'
  entityName: string
  stats: {
    nodeCount: number
    edgeCount: number
    graphCount?: number // 仅项目有此字段
  }
}

// 使用示例
<DeleteConfirmDialog
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  onConfirm={handleConfirmDelete}
  entityType="project"
  entityName="我的项目"
  stats={{ nodeCount: 10, edgeCount: 5, graphCount: 2 }}
/>
```

**设计要点：**
- 模态对话框，背景半透明遮罩
- 显示警告图标和红色主题
- 清晰展示将被删除的实体名称和统计信息
- 两个按钮：取消（灰色）和确认删除（红色）
- 删除进行中时显示加载状态并禁用按钮
- 支持ESC键关闭对话框

### 3. ProjectGraphManager Updates

更新主组件以集成删除功能。

```typescript
// 新增状态
const [deleteDialog, setDeleteDialog] = useState<{
  isOpen: boolean
  type: 'project' | 'graph' | null
  id: string | null
  name: string | null
  stats: any
}>({
  isOpen: false,
  type: null,
  id: null,
  name: null,
  stats: {}
})
const [isDeleting, setIsDeleting] = useState(false)

// 删除处理函数
const handleDeleteProject = async (project: Project) => {
  setDeleteDialog({
    isOpen: true,
    type: 'project',
    id: project.id,
    name: project.name,
    stats: {
      nodeCount: project.nodeCount,
      edgeCount: project.edgeCount,
      graphCount: graphs.filter(g => g.projectId === project.id).length
    }
  })
}

const handleDeleteGraph = async (graph: Graph) => {
  setDeleteDialog({
    isOpen: true,
    type: 'graph',
    id: graph.id,
    name: graph.name,
    stats: {
      nodeCount: graph.nodeCount,
      edgeCount: graph.edgeCount
    }
  })
}

const confirmDelete = async () => {
  if (!deleteDialog.id || !deleteDialog.type) return
  
  setIsDeleting(true)
  try {
    const endpoint = deleteDialog.type === 'project'
      ? `/api/projects/${deleteDialog.id}`
      : `/api/graphs/${deleteDialog.id}`
    
    const res = await fetch(endpoint, { method: 'DELETE' })
    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.error || '删除失败')
    }
    
    // 显示成功消息
    alert(`成功删除 ${deleteDialog.name}！\n删除了 ${data.deletedNodeCount} 个节点和 ${data.deletedEdgeCount} 条边`)
    
    // 刷新列表
    if (deleteDialog.type === 'project') {
      loadProjects()
      setSelectedProject(null)
      setGraphs([])
      setNodes([])
    } else {
      loadGraphs(selectedProject!.id)
      setSelectedGraph(null)
      setNodes([])
    }
    
    // 关闭对话框
    setDeleteDialog({ isOpen: false, type: null, id: null, name: null, stats: {} })
  } catch (error) {
    console.error('删除失败:', error)
    alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    setIsDeleting(false)
  }
}
```

## Data Models

### DeleteDialog State

```typescript
interface DeleteDialogState {
  isOpen: boolean
  type: 'project' | 'graph' | null
  id: string | null
  name: string | null
  stats: {
    nodeCount: number
    edgeCount: number
    graphCount?: number // 仅项目删除时有此字段
  }
}
```

### API Response

现有的DELETE API响应格式：

```typescript
// 成功响应
interface DeleteSuccessResponse {
  success: true
  deletedNodeCount: number
  deletedEdgeCount: number
  deletedFileCount: number
}

// 错误响应
interface DeleteErrorResponse {
  error: string
  details?: string
}
```

## Correctness Properties

*属性是关于系统应该做什么的特征或行为的正式陈述，它应该在系统的所有有效执行中保持为真。属性是人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: 删除按钮渲染

*For any* 项目或图谱列表，当列表渲染时，每个列表项都应该在右侧包含一个删除按钮元素。

**Validates: Requirements 1.1, 2.1**

### Property 2: 悬停视觉反馈

*For any* 删除按钮，当用户将鼠标悬停在按钮上时，按钮的样式类或属性应该发生变化以提供视觉反馈。

**Validates: Requirements 1.2, 2.2**

### Property 3: 点击删除按钮显示确认对话框

*For any* 项目或图谱，当用户点击其删除按钮时，系统应该显示确认对话框，并且该实体不应该被立即删除。

**Validates: Requirements 3.1, 3.2**

### Property 4: 确认对话框显示正确信息

*For any* 待删除的项目或图谱，确认对话框应该显示该实体的名称和正确的统计信息（节点数、边数、图谱数）。

**Validates: Requirements 3.3, 3.4**

### Property 5: 取消操作不删除数据

*For any* 项目或图谱，当用户在确认对话框中点击取消或关闭对话框时，对话框应该关闭且该实体及其数据不应该被删除。

**Validates: Requirements 3.6**

### Property 6: 项目级联删除

*For any* 项目，当用户确认删除该项目时，系统应该删除该项目记录以及该项目下的所有图谱、节点和边。

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 7: 图谱级联删除

*For any* 图谱，当用户确认删除该图谱时，系统应该删除该图谱记录以及该图谱下的所有节点和边。

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 8: 图谱删除不影响其他数据

*For any* 图谱，当该图谱被删除后，同一项目下的其他图谱、节点、边以及项目本身应该保持不变。

**Validates: Requirements 5.6**

### Property 9: 删除成功后显示反馈并刷新列表

*For any* 项目或图谱，当删除操作成功完成时，系统应该显示成功提示消息，自动刷新相应的列表，并清除已删除实体的选中状态。

**Validates: Requirements 6.1, 6.3, 6.4**

### Property 10: 删除失败显示错误信息

*For any* 删除操作，当操作失败时（包括网络错误、服务器错误、超时等），系统应该显示错误提示消息并说明失败原因。

**Validates: Requirements 6.2, 8.1, 8.2, 8.4**

### Property 11: 删除进行中禁用操作

*For any* 删除操作，当操作进行中时，系统应该显示加载指示器，禁用删除按钮，并禁用所有可能导致冲突的操作。

**Validates: Requirements 6.5, 9.3**

### Property 12: API验证实体存在性

*For any* 删除请求，当请求的项目或图谱不存在时，API应该返回404错误响应。

**Validates: Requirements 7.3, 7.4**

### Property 13: API成功响应格式

*For any* 成功的删除操作，API应该返回200状态码、成功消息以及被删除的数据统计（节点数、边数等）。

**Validates: Requirements 7.5, 7.7**

### Property 14: API错误响应格式

*For any* 失败的删除操作，API应该返回适当的错误状态码（如500）和包含错误详情的响应。

**Validates: Requirements 7.6**

### Property 15: 删除按钮点击反馈

*For any* 删除按钮，当用户点击时，按钮应该提供即时的视觉反馈（如状态变化）。

**Validates: Requirements 9.1**

### Property 16: 删除按钮事件隔离

*For any* 删除按钮，当用户点击删除按钮时，不应该触发父元素的选择事件，确保删除和选择操作相互独立。

**Validates: Requirements 9.4**

### Property 17: 防止重复删除请求

*For any* 删除按钮，当用户快速连续点击时，系统应该只触发一次删除请求，防止重复提交。

**Validates: Requirements 9.5**



## Error Handling

### 前端错误处理

1. **网络错误**
   - 捕获fetch请求失败
   - 显示用户友好的错误消息："网络连接失败，请检查网络后重试"
   - 保持UI状态不变，允许用户重试

2. **API错误响应**
   - 解析服务器返回的错误信息
   - 显示具体的错误原因（如"项目不存在"、"删除失败"等）
   - 记录错误到控制台以便调试

3. **超时处理**
   - 设置合理的请求超时时间（如30秒）
   - 超时后显示："操作超时，请重试"
   - 提供重试按钮

4. **状态恢复**
   - 删除失败后，确保UI状态恢复到删除前
   - 关闭确认对话框
   - 重新启用所有按钮

### 后端错误处理

现有的DELETE API已经实现了以下错误处理：

1. **实体不存在**
   - 返回404状态码和错误消息
   - 示例：`{ error: '项目不存在' }`

2. **数据库操作失败**
   - 返回500状态码和错误详情
   - 示例：`{ error: '删除项目失败', details: 'Database connection failed' }`

3. **Blob存储错误**
   - 使用try-catch包裹Blob删除操作
   - 即使Blob删除失败，也不阻塞主流程
   - 记录警告日志但继续返回成功

### 错误边界

在React组件中实现错误边界，捕获渲染错误：

```typescript
// 如果删除操作导致组件状态异常，错误边界会捕获并显示友好的错误页面
<ErrorBoundary fallback={<ErrorMessage />}>
  <ProjectGraphManager />
</ErrorBoundary>
```

## Testing Strategy

### 单元测试

使用Jest和React Testing Library进行组件单元测试：

1. **DeleteButton组件测试**
   - 测试按钮渲染
   - 测试点击事件触发
   - 测试禁用状态
   - 测试事件冒泡阻止

2. **DeleteConfirmDialog组件测试**
   - 测试对话框打开/关闭
   - 测试显示正确的实体信息
   - 测试确认和取消按钮
   - 测试ESC键关闭

3. **ProjectGraphManager删除功能测试**
   - 测试删除项目流程
   - 测试删除图谱流程
   - 测试状态更新
   - 测试错误处理

### 属性测试

使用fast-check进行属性测试（每个测试至少100次迭代）：

1. **Property 1: 删除按钮渲染**
   ```typescript
   // Feature: delete-project-graph, Property 1: 删除按钮渲染
   test('每个列表项都包含删除按钮', () => {
     fc.assert(
       fc.property(
         fc.array(projectArbitrary, { minLength: 1 }),
         (projects) => {
           const { container } = render(<ProjectList projects={projects} />)
           const deleteButtons = container.querySelectorAll('[aria-label*="删除"]')
           expect(deleteButtons.length).toBe(projects.length)
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

2. **Property 3: 点击删除按钮显示确认对话框**
   ```typescript
   // Feature: delete-project-graph, Property 3: 点击删除按钮显示确认对话框
   test('点击删除按钮显示对话框且不立即删除', () => {
     fc.assert(
       fc.property(
         projectArbitrary,
         async (project) => {
           const { getByLabelText, queryByRole } = render(<ProjectItem project={project} />)
           const deleteButton = getByLabelText('删除项目')
           
           fireEvent.click(deleteButton)
           
           expect(queryByRole('dialog')).toBeInTheDocument()
           // 验证项目未被删除（通过检查API未被调用）
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

3. **Property 6: 项目级联删除**
   ```typescript
   // Feature: delete-project-graph, Property 6: 项目级联删除
   test('删除项目级联删除所有关联数据', () => {
     fc.assert(
       fc.property(
         projectWithDataArbitrary,
         async (projectData) => {
           // 创建项目及其数据
           const project = await createTestProject(projectData)
           
           // 执行删除
           await deleteProject(project.id)
           
           // 验证项目和所有关联数据都被删除
           expect(await getProject(project.id)).toBeNull()
           expect(await getGraphsByProject(project.id)).toHaveLength(0)
           expect(await getNodesByProject(project.id)).toHaveLength(0)
           expect(await getEdgesByProject(project.id)).toHaveLength(0)
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

### 集成测试

1. **完整删除流程测试**
   - 创建项目和图谱
   - 添加节点和边
   - 执行删除操作
   - 验证数据库状态

2. **并发删除测试**
   - 测试同时删除多个项目
   - 验证数据一致性

3. **Blob存储集成测试**
   - 上传测试图片
   - 删除项目
   - 验证Blob文件被删除

### 端到端测试

使用Playwright进行E2E测试：

1. **用户删除项目流程**
   - 登录系统
   - 选择项目
   - 点击删除按钮
   - 确认删除
   - 验证项目从列表中消失

2. **用户取消删除流程**
   - 点击删除按钮
   - 点击取消
   - 验证项目仍然存在

## Implementation Notes

### 关键实现点

1. **事件冒泡处理**
   ```typescript
   const handleDeleteClick = (e: React.MouseEvent) => {
     e.stopPropagation() // 阻止事件冒泡到父元素
     onDelete()
   }
   ```

2. **防抖处理**
   ```typescript
   const [isDeleting, setIsDeleting] = useState(false)
   
   const handleDelete = async () => {
     if (isDeleting) return // 防止重复点击
     setIsDeleting(true)
     try {
       await deleteEntity()
     } finally {
       setIsDeleting(false)
     }
   }
   ```

3. **乐观更新 vs 悲观更新**
   - 采用悲观更新策略：等待API响应成功后再更新UI
   - 原因：删除是不可逆操作，需要确保操作成功

4. **状态管理**
   - 使用本地状态管理删除对话框状态
   - 删除成功后通过回调函数通知父组件刷新列表

### 性能考虑

1. **批量删除优化**
   - 当前实现为单个删除
   - 未来可扩展为批量删除功能

2. **大数据量处理**
   - 对于包含大量节点的项目，删除可能耗时较长
   - 考虑添加进度指示器
   - 考虑后台任务处理

### 可访问性

1. **键盘导航**
   - 删除按钮支持Tab键聚焦
   - 对话框支持ESC键关闭
   - 确认按钮支持Enter键触发

2. **屏幕阅读器**
   - 使用aria-label描述删除按钮
   - 对话框使用role="dialog"和aria-labelledby

3. **视觉反馈**
   - 使用颜色和图标双重提示
   - 悬停和聚焦状态清晰可见

## Future Enhancements

1. **批量删除**
   - 支持选择多个项目或图谱进行批量删除
   - 显示批量删除进度

2. **软删除**
   - 实现软删除机制，允许恢复已删除的数据
   - 添加回收站功能

3. **删除历史**
   - 记录删除操作历史
   - 支持审计和追溯

4. **权限控制**
   - 添加用户权限验证
   - 只有项目所有者或管理员可以删除

5. **删除预览**
   - 在确认对话框中显示将被删除的数据预览
   - 帮助用户更好地理解删除影响
