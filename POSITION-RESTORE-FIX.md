# 位置恢复功能修复

## 问题描述

用户报告：保存节点位置后，再次打开图谱时，节点位置没有恢复到保存的位置。

## 根本原因

经过调查，发现了以下问题：

1. **`KnowledgeGraph` 接口缺少 `settings` 字段**
   - 接口定义中没有 `settings?: any` 字段
   - 导致 TypeScript 类型检查时忽略了这个字段

2. **`loadGraphById` 函数没有包含 `settings`**
   - 虽然 API 返回了完整的 `graph` 对象（包括 `settings`）
   - 但在构建 `KnowledgeGraph` 对象时，没有包含 `settings` 字段
   - 导致保存的位置数据被丢弃

3. **保存后没有刷新 `currentGraph`**
   - 保存位置后，`currentGraph` 对象中的 `settings` 字段没有更新
   - 导致下次访问时可能读取到旧数据

## 修复内容

### 1. 更新 `KnowledgeGraph` 接口 (`lib/store.ts`)

```typescript
export interface KnowledgeGraph {
  id: string
  name: string
  projectId: string
  nodeCount: number
  edgeCount: number
  createdAt: string
  settings?: any  // 图谱设置（包括保存的位置数据）
}
```

### 2. 修复 `loadGraphById` 函数 (`lib/store.ts`)

```typescript
// 3. 构建图谱对象
const knowledgeGraph: KnowledgeGraph = {
  id: graph.id,
  name: graph.name,
  projectId: graph.projectId,
  nodeCount: nodes?.length || 0,
  edgeCount: edges?.length || 0,
  createdAt: graph.createdAt,
  settings: graph.settings,  // 包含settings字段（保存的位置数据）
}
```

### 3. 修复其他创建 `KnowledgeGraph` 的地方

在 `createProject` 和 `addGraphToProject` 函数中，为新创建的图谱添加 `settings: null`：

```typescript
{
  id: graph.id,
  name: graph.name,
  projectId: project.id,
  nodeCount: 0,
  edgeCount: 0,
  createdAt: graph.createdAt,
  settings: null,  // 新图谱没有保存的设置
}
```

### 4. 保存后刷新 `currentGraph` (`components/WorkflowCanvas.tsx`)

```typescript
// 刷新currentGraph以包含更新后的settings
if (result.graph && result.graph.settings) {
  console.log('🔄 更新currentGraph的settings字段')
  useGraphStore.setState(state => ({
    currentGraph: state.currentGraph ? {
      ...state.currentGraph,
      settings: result.graph.settings
    } : null
  }))
}
```

### 5. API 返回更新后的 `graph` 对象 (`api/graphs/save-positions/route.ts`)

```typescript
// 保存到数据库
const updatedGraph = await prisma.graph.update({
  where: { id: graphId },
  data: {
    settings: JSON.stringify(currentSettings),
    updatedAt: new Date()
  }
});

return NextResponse.json({
  success: true,
  message: '位置保存成功',
  graph: updatedGraph  // 返回更新后的graph对象
});
```

## 测试步骤

1. **保存位置**
   - 在 workflow 页面中移动节点
   - 点击"返回"按钮或"保存并转换为3D"按钮
   - 检查控制台日志，确认保存成功

2. **验证数据库**
   - 运行 `node 3d-cloude/debug-positions.js` 查看数据库中的 settings 字段
   - 确认 `workflowPositions` 数据已保存

3. **测试恢复**
   - 离开 workflow 页面
   - 重新进入同一个图谱的 workflow 页面
   - 检查控制台日志：
     - 应该看到 "📊 currentGraph.settings: ..." 显示 settings 数据
     - 应该看到 "🔄 发现保存的位置数据，节点数量: X"
     - 应该看到 "✅ 节点 XXX 使用保存的位置: (x, y)"
   - 验证节点位置是否恢复到保存的位置

## 预期结果

- ✅ 保存位置时，API 返回更新后的 graph 对象
- ✅ `currentGraph.settings` 包含保存的位置数据
- ✅ 重新打开图谱时，`loadGraphById` 加载 settings 字段
- ✅ WorkflowCanvas 组件读取 settings 并恢复节点位置
- ✅ 控制台显示完整的调试日志

## 相关文件

- `3d-cloude/lib/store.ts` - Store 定义和 loadGraphById 函数
- `3d-cloude/components/WorkflowCanvas.tsx` - 位置保存和恢复逻辑
- `3d-cloude/app/api/graphs/save-positions/route.ts` - 保存位置 API
- `3d-cloude/app/api/graphs/[id]/route.ts` - 获取图谱详情 API
- `3d-cloude/app/workflow/page.tsx` - Workflow 页面
