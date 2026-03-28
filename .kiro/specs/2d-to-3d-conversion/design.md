# Design Document: 2D to 3D Conversion with Project List Refresh

## Overview

本设计文档描述如何修复"保存并转换为3D后下拉框中项目消失"的问题。核心解决方案是在`saveAndConvert`函数中,数据同步成功后,在跳转到首页之前,先调用store的方法重新加载项目列表,确保UI显示最新的数据库状态。

## Architecture

系统采用以下架构:

1. **UI Layer (WorkflowCanvas)**: 2D编辑器,提供保存并转换功能
2. **State Management (GraphStore)**: 使用Zustand管理全局状态,包括项目列表
3. **API Layer**: 提供数据同步和查询接口
4. **Database**: PostgreSQL数据库存储持久化数据

数据流:
```
WorkflowCanvas.saveAndConvert() → Sync API (POST /api/graphs/[id]/sync)
                                       ↓
                                  Database (更新节点和边)
                                       ↓
                                  GraphStore.refreshProjects()
                                       ↓
                                  GET /api/projects/with-graphs
                                       ↓
                                  GraphStore.setProjects()
                                       ↓
                                  window.location.href = '/'
                                       ↓
                                  TopNavbar (显示最新数据)
```

## Components and Interfaces

### 1. GraphStore 新增方法

在`lib/store.ts`中添加`refreshProjects`方法:

```typescript
export interface GraphStore {
  // ... 现有接口 ...
  refreshProjects: () => Promise<void>
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  // ... 现有实现 ...
  
  refreshProjects: async () => {
    try {
      console.log('🔄 刷新项目列表...')
      
      const state = get()
      const currentProjectId = state.currentProject?.id
      const currentGraphId = state.currentGraph?.id
      
      let projects: any[] = []
      let retryCount = 0
      const maxRetries = 3
      
      // 重试逻辑：确保数据库写入已完成
      while (retryCount < maxRetries) {
        // 添加短暂延迟，让数据库有时间同步
        if (retryCount > 0) {
          console.log(`⏳ 等待数据库同步... (尝试 ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
        }
        
        const projectsRes = await fetch('/api/projects/with-graphs', {
          // 添加缓存控制，确保获取最新数据
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        
        if (!projectsRes.ok) {
          throw new Error('加载项目列表失败')
        }
        
        const projectsData = await projectsRes.json()
        projects = projectsData.projects || []
        console.log('✅ 项目列表加载成功，共', projects.length, '个项目')
        
        // 如果有当前项目和图谱，验证它们是否存在
        if (currentProjectId && currentGraphId) {
          const project = projects.find((p: any) => p.id === currentProjectId)
          const graph = project?.graphs.find((g: any) => g.id === currentGraphId)
          
          if (project && graph) {
            console.log('✅ 找到当前项目和图谱')
            
            // 更新状态，保持当前选中的项目和图谱
            set({
              projects: projects,
              currentProject: project,
              currentGraph: graph,
            })
            
            return
          }
        }
        
        retryCount++
        if (retryCount < maxRetries) {
          console.log('⚠️ 未找到当前项目/图谱，准备重试...')
        }
      }
      
      // 如果没有当前项目或重试后仍未找到，只更新projects列表
      console.log('⚠️ 更新项目列表，但未找到当前项目/图谱')
      set({ projects: projects })
      
    } catch (error) {
      console.error('❌ 刷新项目列表失败:', error)
      throw error
    }
  },
}))
```

### 2. WorkflowCanvas 修改

修改`components/WorkflowCanvas.tsx`中的`saveAndConvert`函数:

```typescript
const saveAndConvert = async () => {
  try {
    // 0. 检查是否选择了图谱
    if (!currentGraph) {
      setConversionError('请先选择一个图谱')
      setTimeout(() => setConversionError(null), 3000)
      return
    }

    // 1. 验证数据
    const validNodes = nodes.filter(n => n.label.trim() !== '')
    if (validNodes.length === 0) {
      setConversionError('请至少创建一个有效节点')
      setTimeout(() => setConversionError(null), 3000)
      return
    }

    // 2. 准备数据
    const payload = {
      nodes: validNodes.map(n => ({
        id: n.id,
        label: n.label,
        description: n.description,
        x: n.x,
        y: n.y,
        imageUrl: n.imageUrl,
        videoUrl: n.videoUrl,
      })),
      connections: connections.filter(c => 
        validNodes.some(n => n.id === c.from) &&
        validNodes.some(n => n.id === c.to)
      ).map(c => ({
        id: c.id,
        from: c.from,
        to: c.to,
        label: c.label,
      })),
    }

    // 3. 调用同步API
    setIsConverting(true)
    setConversionError(null)
    
    console.log('🔄 开始同步2D数据到图谱:', currentGraph.name)
    console.log('📊 节点数:', payload.nodes.length, '连接数:', payload.connections.length)
    
    const response = await fetch(`/api/graphs/${currentGraph.id}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '同步失败')
    }

    const result = await response.json()
    
    console.log('✅ 同步成功:', result)
    console.log('📊 统计:', result.stats)
    
    // 4. 刷新项目列表（关键修改）
    console.log('🔄 刷新项目列表...')
    try {
      await refreshProjects()
      console.log('✅ 项目列表刷新成功')
    } catch (refreshError) {
      console.error('⚠️ 刷新项目列表失败，但仍然继续跳转:', refreshError)
      // 即使刷新失败，也继续跳转，因为数据已经保存到数据库
    }
    
    // 5. 显示成功并跳转
    setConversionSuccess(true)
    setTimeout(() => {
      window.location.href = '/'
    }, 1500)
    
  } catch (error) {
    console.error('❌ 同步失败:', error)
    setConversionError(error instanceof Error ? error.message : '同步失败')
    setTimeout(() => setConversionError(null), 5000)
  } finally {
    setIsConverting(false)
  }
}
```

需要在组件顶部导入`refreshProjects`:

```typescript
const { 
  currentGraph, 
  nodes: storeNodes, 
  edges: storeEdges,
  refreshProjects  // 新增
} = useGraphStore()
```

### 3. 用户反馈优化

在`WorkflowCanvas`中添加更详细的状态提示:

```typescript
// 在组件中添加新的状态
const [savingStatus, setSavingStatus] = useState<string>('')

// 在saveAndConvert中更新状态
const saveAndConvert = async () => {
  try {
    // ... 验证逻辑 ...
    
    setSavingStatus('正在保存到数据库...')
    setIsConverting(true)
    
    // 同步数据
    const response = await fetch(...)
    // ...
    
    setSavingStatus('保存成功！正在刷新数据...')
    
    // 刷新项目列表
    await refreshProjects()
    
    setSavingStatus('即将跳转到3D视图...')
    setConversionSuccess(true)
    
    setTimeout(() => {
      window.location.href = '/'
    }, 1500)
    
  } catch (error) {
    setSavingStatus('')
    // ... 错误处理 ...
  }
}

// 在UI中显示状态
{savingStatus && (
  <div style={{
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'white',
    padding: '24px 32px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    zIndex: 10000,
    fontSize: '16px',
    fontWeight: '600',
    color: '#3b82f6',
  }}>
    {savingStatus}
  </div>
)}
```

## Data Models

无需修改数据模型,使用现有的Project和KnowledgeGraph接口。

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 保存后数据一致性
*For any* 成功的保存转换操作,跳转到首页后,TopNavbar下拉框中显示的项目列表应该与数据库中的数据完全一致。

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: 当前图谱保持选中
*For any* 成功的保存转换操作,跳转到首页后,GraphStore的currentProject和currentGraph应该仍然指向刚才编辑的项目和图谱。

**Validates: Requirements 2.1, 2.2**

### Property 3: 重试机制有效性
*For any* 数据库同步延迟的情况,重试机制应该能在最多3次尝试内成功加载最新数据。

**Validates: Requirements 3.2, 3.3**

### Property 4: 错误不丢失数据
*For any* 保存转换过程中的错误,2D编辑器中的节点和连接数据应该保持不变,不会丢失。

**Validates: Requirements 5.1, 5.4**

## Error Handling

1. **Sync API失败**:
   - 捕获API错误
   - 显示具体错误消息
   - 保持在2D编辑器页面
   - 不清空编辑内容

2. **刷新项目列表失败**:
   - 记录错误日志
   - 使用try-catch包裹,不阻止跳转
   - 因为数据已经保存到数据库,首页刷新时会重新加载

3. **重试机制**:
   - 最多重试3次
   - 每次重试之间递增延迟(500ms, 1000ms, 1500ms)
   - 添加缓存控制头,确保获取最新数据

4. **用户反馈**:
   - 显示详细的进度状态
   - 错误时显示具体消息
   - 成功时显示确认提示

## Testing Strategy

### Unit Tests

1. **GraphStore.refreshProjects测试**:
   - 测试成功刷新项目列表
   - 测试保持当前项目和图谱选中
   - 测试重试机制
   - 测试缓存控制头

2. **WorkflowCanvas.saveAndConvert测试**:
   - 测试完整的保存转换流程
   - 测试刷新项目列表的调用
   - 测试错误处理
   - 测试用户反馈显示

### Integration Tests

1. **端到端保存转换测试**:
   - 在2D编辑器中创建节点和连接
   - 点击"保存并转换为3D"
   - 验证数据同步到数据库
   - 验证项目列表刷新
   - 验证跳转到首页
   - 验证下拉框显示最新数据
   - 验证当前图谱保持选中

2. **数据一致性测试**:
   - 保存转换后,验证数据库、store和UI三者一致
   - 刷新页面后,验证数据持久化

3. **错误恢复测试**:
   - 模拟API失败
   - 模拟网络延迟
   - 验证重试机制
   - 验证错误提示

### Manual Testing

1. 创建新项目和图谱,在2D编辑器中编辑,保存转换,检查下拉框
2. 编辑现有图谱,保存转换,检查下拉框
3. 测试网络慢的情况下的重试机制
4. 测试保存失败时的错误处理
5. 测试快速连续保存转换

## Implementation Notes

1. **关键修改点**: 在`saveAndConvert`中,同步成功后调用`refreshProjects()`刷新项目列表
2. **重试机制**: 使用递增延迟的重试策略,处理数据库同步延迟
3. **缓存控制**: 添加`Cache-Control`头,确保获取最新数据而不是缓存
4. **错误处理**: 即使刷新失败也继续跳转,因为数据已保存到数据库
5. **用户体验**: 显示详细的进度状态,让用户了解系统正在做什么
6. **性能考虑**: 重试延迟设置合理,避免过长等待时间

## Alternative Solutions Considered

### 方案1: 在首页加载时刷新
- **优点**: 不需要修改WorkflowCanvas
- **缺点**: 首页加载时间变长,用户体验差

### 方案2: 使用WebSocket实时同步
- **优点**: 实时性最好
- **缺点**: 实现复杂,需要额外的基础设施

### 方案3: 使用乐观更新
- **优点**: UI响应快
- **缺点**: 可能出现数据不一致,需要复杂的回滚逻辑

**选择当前方案的原因**: 平衡了实现复杂度和用户体验,使用重试机制处理数据库延迟,确保数据一致性。
