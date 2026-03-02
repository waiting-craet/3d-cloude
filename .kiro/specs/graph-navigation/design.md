# Design Document

## Overview

本设计文档描述了如何实现从 creation 页面点击图谱卡片导航到 graph 页面，并正确加载和显示对应图谱数据的功能。该功能将修改现有的导航逻辑，使用户能够直接访问 3D 图谱编辑器，而不是 2D workflow 页面。

## Architecture

### 系统架构

```
┌─────────────────────┐
│  Creation Page      │
│  (NewCreationWorkflow)│
│                     │
│  ┌───────────────┐ │
│  │ Graph Cards   │ │──┐
│  │ (onClick)     │ │  │
│  └───────────────┘ │  │
└─────────────────────┘  │
                         │ Navigation with graphId
                         │
                         ▼
┌─────────────────────────────────────┐
│  Graph Page                         │
│  (3D Knowledge Graph Editor)        │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  URL Parameter Handler       │  │
│  │  - Extract graphId from URL  │  │
│  │  - Validate graphId          │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Data Loading System         │  │
│  │  - Fetch graph data          │  │
│  │  - Load nodes and edges      │  │
│  │  - Update GraphStore         │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  KnowledgeGraph Component    │  │
│  │  - Render 3D visualization   │  │
│  │  - Display nodes and edges   │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
         │
         │ API Calls
         ▼
┌─────────────────────┐
│  Backend API        │
│  /api/graphs/[id]   │
│  - GET graph data   │
│  - GET nodes        │
│  - GET edges        │
└─────────────────────┘
```

### 数据流

1. **用户点击图谱卡片** → 触发导航事件
2. **导航系统** → 跳转到 `/graph?graphId={id}`
3. **Graph Page 加载** → 从 URL 提取 graphId
4. **数据加载系统** → 调用 API 获取图谱数据
5. **GraphStore 更新** → 存储节点和边数据
6. **3D 渲染** → KnowledgeGraph 组件渲染图谱

## Components and Interfaces

### 1. NewCreationWorkflowPage 组件修改

**文件**: `3d-cloude/components/creation/NewCreationWorkflowPage.tsx`

**修改内容**:
- 修改图谱卡片的 `onClick` 处理函数
- 将导航目标从 `/workflow?graphId=${graph.id}` 改为 `/graph?graphId=${graph.id}`

```typescript
// 修改前
onClick={() => {
  router.push(`/workflow?graphId=${graph.id}`);
}}

// 修改后
onClick={() => {
  router.push(`/graph?graphId=${graph.id}`);
}}
```

### 2. Graph Page 组件增强

**文件**: `3d-cloude/app/graph/page.tsx`

**新增功能**:
- URL 参数解析
- 图谱数据加载逻辑
- 错误处理和用户反馈
- 加载状态显示

**组件结构**:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useGraphStore } from '@/lib/store'
import KnowledgeGraph from '@/components/KnowledgeGraph'
import TopNavbar from '@/components/TopNavbar'
import NodeDetailPanel from '@/components/NodeDetailPanel'
import FloatingAddButton from '@/components/FloatingAddButton'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function GraphPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const graphId = searchParams.get('graphId')
  
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  
  const { 
    setCurrentGraph, 
    setCurrentProject, 
    fetchGraph,
    projects,
    currentGraph 
  } = useGraphStore()

  // 初始化：加载图谱数据
  useEffect(() => {
    initializeGraph()
  }, [graphId])

  const initializeGraph = async () => {
    // 实现逻辑...
  }

  // 渲染逻辑...
}
```

### 3. GraphStore 增强

**文件**: `3d-cloude/lib/store.ts`

**新增方法**:
```typescript
interface GraphStore {
  // ... 现有属性
  
  // 新增方法
  loadGraphById: (graphId: string) => Promise<void>
  setError: (error: string | null) => void
  error: string | null
}
```

**loadGraphById 实现**:
```typescript
loadGraphById: async (graphId: string) => {
  try {
    set({ isLoading: true, error: null })
    
    // 1. 获取图谱详情
    const graphResponse = await fetch(`/api/graphs/${graphId}`)
    if (!graphResponse.ok) {
      throw new Error('图谱不存在或已被删除')
    }
    
    const graphData = await graphResponse.json()
    const { graph, nodes, edges } = graphData
    
    // 2. 查找或加载项目信息
    let project = get().projects.find(p => p.id === graph.projectId)
    if (!project) {
      // 如果项目不在列表中，加载项目列表
      await get().refreshProjects()
      project = get().projects.find(p => p.id === graph.projectId)
    }
    
    // 3. 更新状态
    set({
      currentProject: project || null,
      currentGraph: {
        id: graph.id,
        name: graph.name,
        projectId: graph.projectId,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        createdAt: graph.createdAt,
      },
      nodes: nodes || [],
      edges: edges || [],
      isLoading: false,
    })
    
    // 4. 保存到 localStorage
    if (project) {
      localStorage.setItem('currentProjectId', project.id)
    }
    localStorage.setItem('currentGraphId', graphId)
    
  } catch (error) {
    console.error('加载图谱失败:', error)
    set({ 
      error: error instanceof Error ? error.message : '加载图谱失败',
      isLoading: false 
    })
    throw error
  }
}
```

## Data Models

### Graph 数据模型

```typescript
interface Graph {
  id: string
  name: string
  projectId: string
  description?: string
  isPublic: boolean
  settings?: any
  createdAt: string
  updatedAt: string
  nodeCount: number
  edgeCount: number
}
```

### Node 数据模型

```typescript
interface Node {
  id: string
  name: string
  type: string
  description?: string
  tags?: string
  x: number
  y: number
  z: number
  color: string
  textColor?: string
  size?: number
  shape?: string
  isGlowing?: boolean
  imageUrl?: string
  videoUrl?: string
  graphId: string
}
```

### Edge 数据模型

```typescript
interface Edge {
  id: string
  fromNodeId: string
  toNodeId: string
  label: string
  weight: number
  color?: string
  graphId: string
}
```

## Correctness Properties

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: 导航 URL 格式正确性

*For any* 有效的图谱 ID，当用户点击图谱卡片时，导航系统生成的 URL 应该包含格式为 `/graph?graphId={id}` 的查询参数。

**Validates: Requirements 1.1, 1.2**

### Property 2: 图谱 ID 验证

*For any* 图谱卡片点击事件，如果图谱 ID 为空、undefined 或无效格式，导航系统应该阻止导航并显示错误提示。

**Validates: Requirements 1.3, 1.4**

### Property 3: 数据加载完整性

*For any* 有效的图谱 ID，当 Graph_Page 加载时，系统应该同时获取节点数据和边数据，并且两者都不应为 null 或 undefined。

**Validates: Requirements 2.1, 2.2**

### Property 4: 渲染数据一致性

*For any* 成功加载的图谱数据，渲染的节点数量应该等于数据中的节点数量，渲染的边数量应该等于数据中的边数量。

**Validates: Requirements 2.3**

### Property 5: 节点属性不变性

*For any* 节点，从 API 加载后到渲染前，节点的所有属性（name, color, size, shape, x, y, z）应该保持不变。

**Validates: Requirements 3.1**

### Property 6: 边属性不变性

*For any* 边，从 API 加载后到渲染前，边的所有属性（fromNodeId, toNodeId, label, color）应该保持不变。

**Validates: Requirements 3.2**

### Property 7: 数据归属正确性

*For any* 在 Graph_Page 中显示的节点或边，其 graphId 属性应该等于当前加载的图谱 ID。

**Validates: Requirements 3.4**

### Property 8: 数据修改持久化

*For any* 在 Graph_Page 中对节点或边的修改操作，修改后立即查询数据库应该返回更新后的数据。

**Validates: Requirements 3.3, 4.1, 4.2**

### Property 9: 统计信息同步

*For any* 图谱，在 Graph_Page 中添加或删除节点/边后，返回 Creation_Page 时显示的节点数量和边数量应该反映最新的变化。

**Validates: Requirements 4.3**

### Property 10: 时间戳更新

*For any* 图谱数据的修改操作（添加、删除、更新节点或边），图谱的 updatedAt 时间戳应该被更新为操作发生的时间。

**Validates: Requirements 4.4**

### Property 11: URL 参数解析

*For any* 包含 graphId 查询参数的 URL，Graph_Page 应该能够正确提取该参数值。

**Validates: Requirements 5.1**

### Property 12: 页面刷新幂等性

*For any* 图谱 ID，在 Graph_Page 加载图谱数据后刷新页面，应该加载相同的图谱数据（节点和边的 ID 集合相同）。

**Validates: Requirements 5.4**

### Property 13: 错误状态 UI 完整性

*For any* 错误状态（加载失败、图谱不存在、网络错误等），系统应该显示错误消息并提供至少一个操作按钮（返回或重试）。

**Validates: Requirements 6.4**

## Error Handling

### 错误类型和处理策略

#### 1. 图谱不存在错误
- **触发条件**: API 返回 404 状态码
- **处理方式**: 
  - 显示错误消息："图谱不存在或已被删除"
  - 提供"返回项目列表"按钮
  - 清空当前图谱状态

#### 2. 网络请求失败
- **触发条件**: API 请求超时或网络错误
- **处理方式**:
  - 显示错误消息："加载失败，请检查网络连接"
  - 提供"重试"按钮
  - 保持当前状态，允许用户重试

#### 3. 无效的图谱 ID
- **触发条件**: URL 参数缺失或格式无效
- **处理方式**:
  - 显示提示消息："请从项目列表选择一个图谱"
  - 提供"返回项目列表"按钮
  - 不尝试加载数据

#### 4. 空图谱数据
- **触发条件**: 图谱存在但没有节点和边
- **处理方式**:
  - 显示提示消息："该图谱暂无数据，开始添加节点吧"
  - 正常显示编辑界面
  - 允许用户添加节点

#### 5. 数据加载超时
- **触发条件**: API 请求超过 10 秒未响应
- **处理方式**:
  - 取消当前请求
  - 显示错误消息："加载超时，请重试"
  - 提供"重试"按钮

### 错误恢复流程

```typescript
const handleError = (error: Error, errorType: ErrorType) => {
  // 1. 记录错误日志
  console.error(`[Graph Navigation Error] ${errorType}:`, error)
  
  // 2. 更新 UI 状态
  setError({
    type: errorType,
    message: getErrorMessage(errorType),
    actions: getErrorActions(errorType),
  })
  
  // 3. 清理加载状态
  setIsLoading(false)
  
  // 4. 根据错误类型决定是否清空数据
  if (errorType === 'GRAPH_NOT_FOUND' || errorType === 'INVALID_ID') {
    clearGraphData()
  }
}
```

## Testing Strategy

### 单元测试

单元测试用于验证特定的功能点和边界情况：

1. **URL 参数解析测试**
   - 测试有效的 graphId 参数提取
   - 测试缺失参数的处理
   - 测试无效格式的处理

2. **导航逻辑测试**
   - 测试点击卡片触发正确的路由
   - 测试 graphId 验证逻辑
   - 测试错误情况的处理

3. **数据加载测试**
   - 测试 API 调用的正确性
   - 测试数据转换逻辑
   - 测试错误响应的处理

4. **状态管理测试**
   - 测试 GraphStore 的状态更新
   - 测试 localStorage 的读写
   - 测试状态同步逻辑

### 属性测试

属性测试用于验证系统在各种输入下的通用正确性：

1. **导航属性测试**
   - 生成随机的有效图谱 ID，验证 URL 格式
   - 生成随机的无效图谱 ID，验证错误处理

2. **数据完整性属性测试**
   - 生成随机的图谱数据，验证加载后的数据一致性
   - 验证节点和边的属性不变性

3. **数据归属属性测试**
   - 生成随机的节点和边，验证它们都属于正确的图谱

4. **幂等性属性测试**
   - 多次加载同一图谱，验证数据一致性

### 集成测试

集成测试验证组件之间的交互：

1. **端到端导航流程**
   - 从 Creation Page 点击卡片
   - 验证 Graph Page 正确加载
   - 验证数据正确显示

2. **数据修改同步流程**
   - 在 Graph Page 修改数据
   - 返回 Creation Page
   - 验证统计信息更新

3. **错误恢复流程**
   - 模拟各种错误情况
   - 验证错误提示显示
   - 验证恢复操作有效

### 测试配置

- **属性测试迭代次数**: 最少 100 次
- **超时设置**: API 请求超时 10 秒
- **测试框架**: Jest + React Testing Library
- **属性测试库**: fast-check (TypeScript)

### 测试标签格式

每个属性测试必须包含以下标签：

```typescript
// Feature: graph-navigation, Property 1: 导航 URL 格式正确性
test('navigation URL format is correct for any valid graph ID', () => {
  // 测试实现
})
```

