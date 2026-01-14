# Design Document: Dropdown Refresh After Project/Graph Creation

## Overview

本设计文档描述如何修复"新建项目/图谱后下拉框不刷新"的问题。核心解决方案是在 `createProject` 和 `addGraphToProject` 函数执行成功后，重新从数据库 API 加载最新的项目列表，确保 UI 显示的数据与数据库保持同步。

## Architecture

系统采用以下架构：

1. **UI Layer (TopNavbar)**: 负责显示项目/图谱下拉框，从 GraphStore 读取项目列表
2. **State Management (GraphStore)**: 使用 Zustand 管理全局状态，包括项目列表、当前项目和图谱
3. **API Layer**: 提供 RESTful 接口用于创建和查询项目/图谱
4. **Database**: PostgreSQL 数据库存储持久化数据

数据流：
```
CreateProjectModal → GraphStore.createProject() → API (POST) → Database
                                                ↓
                                    API (GET /api/projects/with-graphs)
                                                ↓
                                    GraphStore.setProjects() → TopNavbar (re-render)
```

## Components and Interfaces

### 1. GraphStore 修改

在 `lib/store.ts` 中修改以下函数：

**createProject 函数**:
```typescript
createProject: async (projectName, graphName) => {
  try {
    // 1. 创建项目
    const projectRes = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: projectName,
        description: `项目: ${projectName}`,
      }),
    })
    
    if (!projectRes.ok) {
      throw new Error('创建项目失败')
    }
    
    const projectData = await projectRes.json()
    const project = projectData.project
    
    // 2. 在项目中创建图谱
    const graphRes = await fetch(`/api/projects/${project.id}/graphs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: graphName,
        description: `图谱: ${graphName}`,
      }),
    })
    
    if (!graphRes.ok) {
      throw new Error('创建图谱失败')
    }
    
    const graphData = await graphRes.json()
    const graph = graphData.graph
    
    // 3. 重新从数据库加载所有项目（关键修改）
    const projectsRes = await fetch('/api/projects/with-graphs')
    if (projectsRes.ok) {
      const projectsData = await projectsRes.json()
      const projects = projectsData.projects || []
      
      // 找到刚创建的项目和图谱
      const newProject = projects.find((p: any) => p.id === project.id)
      const newGraph = newProject?.graphs.find((g: any) => g.id === graph.id)
      
      if (newProject && newGraph) {
        set({
          projects: projects,
          currentProject: newProject,
          currentGraph: newGraph,
          nodes: [],
          edges: [],
        })
        
        // 保存到 localStorage
        localStorage.setItem('currentProjectId', project.id)
        localStorage.setItem('currentGraphId', graph.id)
        
        console.log('✅ 项目和图谱创建成功，数据已刷新')
      }
    }
  } catch (error) {
    console.error('❌ 创建项目失败:', error)
    throw error
  }
}
```

**addGraphToProject 函数**:
```typescript
addGraphToProject: async (projectId, graphName) => {
  try {
    // 1. 在项目中创建图谱
    const graphRes = await fetch(`/api/projects/${projectId}/graphs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: graphName,
        description: `图谱: ${graphName}`,
      }),
    })
    
    if (!graphRes.ok) {
      throw new Error('创建图谱失败')
    }
    
    const graphData = await graphRes.json()
    const graph = graphData.graph
    
    // 2. 重新从数据库加载所有项目（关键修改）
    const projectsRes = await fetch('/api/projects/with-graphs')
    if (projectsRes.ok) {
      const projectsData = await projectsRes.json()
      const projects = projectsData.projects || []
      
      // 找到对应的项目和新创建的图谱
      const project = projects.find((p: any) => p.id === projectId)
      const newGraph = project?.graphs.find((g: any) => g.id === graph.id)
      
      if (project && newGraph) {
        set({
          projects: projects,
          currentProject: project,
          currentGraph: newGraph,
          nodes: [],
          edges: [],
        })
        
        // 保存到 localStorage
        localStorage.setItem('currentProjectId', projectId)
        localStorage.setItem('currentGraphId', graph.id)
        
        console.log('✅ 图谱创建成功，数据已刷新')
      }
    }
  } catch (error) {
    console.error('❌ 添加图谱失败:', error)
    throw error
  }
}
```

### 2. TopNavbar 修改

在 `components/TopNavbar.tsx` 中，确保在创建成功后保持下拉框展开状态：

**handleCreateProject 函数**:
```typescript
const handleCreateProject = async (projectName: string, graphName: string, isNewProject: boolean) => {
  try {
    if (isNewProject) {
      await createProject(projectName, graphName)
    } else {
      const project = projects.find(p => p.name === projectName)
      if (project) {
        await addGraphToProject(project.id, graphName)
      }
    }
    
    // 创建成功后，保持下拉框展开状态
    setShowProjectMenu(true)
    
    // 如果是添加到现有项目，展开该项目
    if (!isNewProject) {
      const project = projects.find(p => p.name === projectName)
      if (project) {
        setHoveredProjectId(project.id)
      }
    }
  } catch (error) {
    console.error('创建失败:', error)
    alert(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}
```

### 3. CreateProjectModal 修改

在 `components/CreateProjectModal.tsx` 中，将 `onCreate` 改为异步函数：

```typescript
interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (projectName: string, graphName: string, isNewProject: boolean) => Promise<void>
  existingProjects: Project[]
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // ... 验证逻辑 ...
  
  const finalProjectName = isNewProject ? projectName : 
    existingProjects.find(p => p.id === selectedProjectId)?.name || ''

  try {
    await onCreate(finalProjectName, graphName, isNewProject)
    
    // 重置表单
    setProjectName('')
    setGraphName('')
    setError('')
    onClose()
  } catch (error) {
    setError(error instanceof Error ? error.message : '创建失败')
  }
}
```

## Data Models

无需修改数据模型，使用现有的 Project 和 KnowledgeGraph 接口。

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 创建后数据一致性
*For any* 成功的项目/图谱创建操作，GraphStore 中的 projects 列表应该与数据库中的数据完全一致。

**Validates: Requirements 1.1, 2.1, 3.1**

### Property 2: 当前图谱自动切换
*For any* 成功的创建操作，GraphStore 的 currentGraph 应该指向新创建的图谱。

**Validates: Requirements 1.3, 2.3**

### Property 3: UI 状态保持
*For any* 创建操作完成后，如果下拉框在创建前是展开的，创建后应该保持展开状态。

**Validates: Requirements 1.4, 2.4**

### Property 4: 错误处理不破坏状态
*For any* 创建操作失败的情况，GraphStore 的状态应该保持不变，不会出现部分更新的情况。

**Validates: Requirements 3.3**

## Error Handling

1. **API 调用失败**: 
   - 捕获所有 fetch 错误
   - 使用 try-catch 包裹异步操作
   - 失败时抛出错误，由调用方处理

2. **数据不一致**:
   - 创建成功后，如果重新加载失败，保持原有状态
   - 记录详细的错误日志

3. **用户反馈**:
   - 创建失败时显示 alert 提示
   - 在 CreateProjectModal 中显示错误消息

## Testing Strategy

### Unit Tests

1. **GraphStore.createProject 测试**:
   - 测试成功创建项目和图谱
   - 测试 API 调用失败的情况
   - 测试数据刷新逻辑

2. **GraphStore.addGraphToProject 测试**:
   - 测试成功添加图谱到现有项目
   - 测试项目不存在的情况
   - 测试数据刷新逻辑

3. **TopNavbar.handleCreateProject 测试**:
   - 测试创建新项目的流程
   - 测试添加到现有项目的流程
   - 测试下拉框状态保持

### Property-Based Tests

由于这是一个 UI 交互和数据同步的功能，主要依赖集成测试和手动测试。Property-based tests 不太适用于这个场景。

### Integration Tests

1. **端到端创建流程测试**:
   - 打开创建弹窗
   - 填写项目和图谱名称
   - 提交创建
   - 验证下拉框显示新项目/图谱
   - 验证自动切换到新图谱

2. **数据一致性测试**:
   - 创建项目后，验证 GraphStore 和数据库数据一致
   - 刷新页面后，验证数据持久化

### Manual Testing

1. 创建新项目和图谱，检查下拉框是否立即显示
2. 在现有项目中添加图谱，检查下拉框是否更新
3. 测试网络失败情况下的错误处理
4. 测试快速连续创建多个项目/图谱

## Implementation Notes

1. **关键修改点**: 在 `createProject` 和 `addGraphToProject` 函数中，创建成功后调用 `/api/projects/with-graphs` 重新加载数据
2. **性能考虑**: 重新加载所有项目可能在项目数量很大时有性能问题，但目前项目数量较少，可以接受
3. **未来优化**: 如果项目数量增长，可以考虑只更新受影响的项目，而不是重新加载所有数据
4. **错误处理**: 使用 try-catch 确保错误不会导致状态不一致
5. **用户体验**: 保持下拉框展开状态，让用户立即看到新创建的内容
