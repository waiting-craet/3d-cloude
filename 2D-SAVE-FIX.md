# 2D转3D保存功能修复

## 🔍 问题描述

用户在2D视图中创建节点后，点击"保存并转换为3D"，发现：
1. 节点没有显示在3D视图中
2. "现有图谱"下拉框中的节点数量没有变化

## 🐛 根本原因

### 问题1: 没有传递图谱ID
**位置**: `components/WorkflowCanvas.tsx`

`saveAndConvert`函数调用`/api/convert`时，没有传递当前选择的图谱ID，导致创建的节点无法关联到正确的图谱。

### 问题2: API使用全局创建方式
**位置**: `app/api/convert/route.ts`

`/api/convert` API使用旧的全局创建方式，没有关联到项目和图谱，导致：
- 节点没有`projectId`和`graphId`
- 无法按图谱隔离数据
- 统计数量不更新

## 🔧 修复内容

### 修复1: WorkflowCanvas传递图谱ID

**文件**: `components/WorkflowCanvas.tsx`

**修复前**:
```typescript
const payload = {
  nodes: validNodes.map(n => ({...})),
  connections: connections.filter(...),
  metadata: {...}
}
```

**修复后**:
```typescript
// 0. 检查是否选择了图谱
if (!currentGraph) {
  setConversionError('请先选择一个图谱')
  return
}

const payload = {
  nodes: validNodes.map(n => ({...})),
  connections: connections.filter(...),
  graphId: currentGraph.id,  // ✅ 添加图谱ID
  metadata: {...}
}
```

**改进点**:
- ✅ 检查是否选择了图谱
- ✅ 传递图谱ID到API
- ✅ 添加调试日志
- ✅ 包含媒体URL

### 修复2: Convert API支持图谱

**文件**: `app/api/convert/route.ts`

**修复前**:
```typescript
// 使用全局批处理创建
const nodeResult = await createNodesBatch(nodeDataArray, 15, 100)
```

**修复后**:
```typescript
// 1. 验证图谱ID
if (!graphId) {
  return NextResponse.json({
    success: false,
    message: '请先选择一个图谱',
  }, { status: 400 })
}

// 2. 验证图谱存在
const graph = await prisma.graph.findUnique({
  where: { id: graphId },
  select: { id: true, projectId: true, name: true },
})

// 3. 创建节点时关联项目和图谱
createdNodes = await Promise.all(
  convertedNodes.map(async (node) => {
    const created = await prisma.node.create({
      data: {
        name: node.label,
        type: 'concept',
        description: node.description || '',
        x: node.x3d,
        y: node.y3d,
        z: node.z3d,
        color: '#3b82f6',
        size: 1.5,
        projectId: graph.projectId,  // ✅ 关联项目
        graphId: graphId,            // ✅ 关联图谱
      },
    })
    return created
  })
)

// 4. 更新统计数量
await prisma.graph.update({
  where: { id: graphId },
  data: { nodeCount: { increment: createdNodes.length } },
})

await prisma.project.update({
  where: { id: graph.projectId },
  data: { nodeCount: { increment: createdNodes.length } },
})
```

**改进点**:
- ✅ 验证图谱ID和存在性
- ✅ 节点关联到项目和图谱
- ✅ 边关联到项目和图谱
- ✅ 自动更新图谱和项目的统计数量
- ✅ 添加详细的日志输出

## 📊 数据流程

### 修复后的完整流程

```
用户在2D视图创建节点
    ↓
点击"保存并转换为3D"
    ↓
WorkflowCanvas.saveAndConvert()
    ├─ 检查是否选择了图谱
    ├─ 准备数据（包含graphId）
    └─ POST /api/convert
        ↓
Convert API
    ├─ 验证图谱ID
    ├─ 验证图谱存在
    ├─ 转换2D坐标到3D
    ├─ 创建节点（关联projectId和graphId）
    ├─ 创建边（关联projectId和graphId）
    ├─ 更新图谱统计（nodeCount, edgeCount）
    └─ 更新项目统计（nodeCount, edgeCount）
        ↓
返回成功
    ↓
跳转到3D视图
    ↓
自动显示新创建的节点
```

## 🎯 修复效果

### 修复前 ❌
- 2D创建的节点不显示在3D视图
- 节点没有关联到图谱
- 统计数量不更新
- 数据无法隔离

### 修复后 ✅
- 2D创建的节点正确显示在3D视图
- 节点正确关联到当前图谱
- 统计数量自动更新
- 数据按图谱正确隔离
- 详细的调试日志

## 🧪 测试步骤

### 1. 选择图谱
1. 打开 http://localhost:3000
2. 点击"现有图谱"
3. 选择"测试项目" → "知识图谱A"
4. 记住当前节点数（例如：5个节点）

### 2. 创建2D节点
1. 访问 http://localhost:3000/workflow
2. 点击"添加节点"按钮
3. 创建2-3个节点
4. 连接节点（可选）

### 3. 保存并转换
1. 点击右上角"保存并转换为3D"按钮
2. 等待转换完成
3. 自动跳转到3D视图

### 4. 验证结果

**3D视图**:
- ✅ 看到新创建的节点
- ✅ 节点位置正确（根据2D坐标转换）
- ✅ 节点可以交互

**统计数量**:
- ✅ 点击"现有图谱"
- ✅ 查看"知识图谱A"的节点数
- ✅ 应该增加了2-3个（刚才创建的数量）

**控制台日志**:
```
🔄 开始转换2D数据到图谱: 知识图谱A
📊 节点数: 3 连接数: 2
✅ 转换成功: {success: true, stats: {...}}
```

**服务器日志**:
```
🔄 收到转换请求 - 图谱ID: cmkxxx... 节点数: 3
✅ 图谱验证通过: 知识图谱A
📝 开始创建节点...
✅ 创建了 3 个节点
🔗 开始创建边...
✅ 创建了 2 条边
```

### 5. 验证数据隔离
1. 切换到"知识图谱B"
2. 应该看不到刚才创建的节点
3. 切换回"知识图谱A"
4. 节点仍然存在

## 🔍 调试技巧

### 如果节点没有显示

1. **检查控制台日志**
   - 是否有"请先选择一个图谱"的错误？
   - 是否有转换成功的日志？

2. **检查Network标签**
   - POST /api/convert 的状态码是否为200？
   - 响应数据中的stats是否正确？

3. **检查图谱选择**
   ```javascript
   // 在控制台执行
   useGraphStore.getState().currentGraph
   ```
   应该返回图谱对象，不是null

4. **刷新页面**
   - 转换成功后会自动跳转
   - 如果没有跳转，手动刷新页面

### 如果统计数量没有更新

1. **检查API响应**
   - 查看Network标签中的响应
   - 确认stats.nodesCreated有值

2. **刷新图谱列表**
   - 关闭"现有图谱"下拉框
   - 重新打开查看

3. **检查数据库**
   ```bash
   # 查询图谱的节点数
   npx prisma studio
   # 打开Graph表，查看nodeCount字段
   ```

## 📝 注意事项

### 使用前提
1. **必须先选择图谱** - 在3D视图中选择一个图谱后再跳转到2D视图
2. **节点必须有名称** - 空白节点不会被保存
3. **网络连接正常** - 确保可以访问数据库

### 最佳实践
1. **先选择图谱** - 在主页选择图谱后再创建2D节点
2. **合理命名** - 给节点起有意义的名称
3. **适量创建** - 一次不要创建太多节点（建议<20个）
4. **保存前检查** - 确认节点和连接都正确

## 🎉 总结

### 修复内容
1. ✅ WorkflowCanvas传递图谱ID
2. ✅ Convert API验证图谱
3. ✅ 节点关联到项目和图谱
4. ✅ 自动更新统计数量
5. ✅ 添加详细日志

### 功能特性
- ✅ 2D节点正确保存到数据库
- ✅ 自动转换为3D坐标
- ✅ 关联到当前选择的图谱
- ✅ 统计数量实时更新
- ✅ 数据按图谱隔离
- ✅ 支持节点连接

### 用户体验
- 🎨 创建流程流畅
- 🎨 即时反馈
- 🎨 自动跳转
- 🎨 数据持久化

现在2D转3D功能已经完全正常工作了！🚀
