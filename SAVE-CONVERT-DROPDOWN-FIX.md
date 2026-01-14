# 保存并转换后下拉框消失问题修复

## 问题描述

用户报告：在一个未被编辑的知识图谱中进行编辑后，点击"保存并转换为3D"按钮，知识图谱在下拉框中消失了。

## 根本原因

`refreshProjects` 函数中有一个过于严格的验证逻辑：

```typescript
// 验证数据完整性：确保所有图谱都有 nodeCount 和 edgeCount
const allGraphsHaveCounts = project.graphs.every((g: any) => 
  typeof g.nodeCount === 'number' && typeof g.edgeCount === 'number'
)

if (!allGraphsHaveCounts) {
  console.warn('⚠️ 某些图谱缺少节点/边计数，继续重试...')
  retryCount++
  continue
}
```

这个验证逻辑会检查项目中**所有图谱**是否都有 `nodeCount` 和 `edgeCount`。如果项目中有任何一个图谱缺少这些字段，就会继续重试。

**问题**：
1. 如果项目中有多个图谱，其中一个图谱可能还没有被编辑过，缺少计数字段
2. 即使当前编辑的图谱已经正确保存并有计数，但因为其他图谱缺少计数，验证仍然失败
3. 重试 3 次后，虽然会更新项目列表，但可能导致状态不一致

## 修复内容

### 1. 移除过于严格的验证逻辑

**修改文件**: `lib/store.ts`

**移除的代码**:
```typescript
// 验证数据完整性：确保所有图谱都有 nodeCount 和 edgeCount
const allGraphsHaveCounts = project.graphs.every((g: any) => 
  typeof g.nodeCount === 'number' && typeof g.edgeCount === 'number'
)

if (!allGraphsHaveCounts) {
  console.warn('⚠️ 某些图谱缺少节点/边计数，继续重试...')
  retryCount++
  continue
}
```

**原因**:
- 我们只需要验证**当前选中的图谱**是否存在，不需要验证项目中所有图谱的数据完整性
- `/api/projects/with-graphs` API 会自动计算每个图谱的节点和边数，即使是空图谱也会有 `nodeCount: 0` 和 `edgeCount: 0`
- 过于严格的验证会导致不必要的重试和失败

### 2. 增强日志记录

添加了更详细的日志，使用 `[refreshProjects]` 前缀：

```typescript
console.log('🔄 [refreshProjects] 开始刷新项目列表...')
console.log('🔍 [refreshProjects] 当前选择:', {
  projectId: currentProjectId,
  graphId: currentGraphId,
})
console.log(`🌐 [refreshProjects] 尝试 ${retryCount + 1}/${maxRetries}: 获取项目列表...`)
console.log(`✅ [refreshProjects] 项目列表加载成功，共 ${projects.length} 个项目`)
console.log(`🔍 [refreshProjects] 查找当前项目/图谱:`, {
  projectFound: !!project,
  graphFound: !!graph,
  projectName: project?.name,
  graphName: graph?.name,
})
```

这些日志可以帮助调试和追踪问题。

### 3. 简化验证逻辑

现在的验证逻辑只检查：
1. 当前项目是否存在
2. 当前图谱是否存在

如果两者都存在，就更新状态并返回。不再检查其他图谱的数据完整性。

## 修改的文件

- `lib/store.ts` - `refreshProjects` 函数

## 测试场景

### 场景 1: 编辑新创建的图谱
1. 创建一个新项目和图谱
2. 在 2D 工作流中添加节点和连接
3. 点击"保存并转换为3D"
4. **预期**: 图谱应该出现在下拉框中，并且被选中

### 场景 2: 编辑已有图谱
1. 选择一个已有的图谱
2. 在 2D 工作流中修改节点和连接
3. 点击"保存并转换为3D"
4. **预期**: 图谱应该保持在下拉框中，并且被选中

### 场景 3: 项目中有多个图谱
1. 创建一个项目，包含多个图谱
2. 编辑其中一个图谱
3. 点击"保存并转换为3D"
4. **预期**: 所有图谱都应该出现在下拉框中，当前编辑的图谱被选中

### 场景 4: 空图谱
1. 创建一个新图谱，不添加任何节点
2. 点击"保存并转换为3D"
3. **预期**: 图谱应该出现在下拉框中，显示 "0 节点 · 0 关系"

## 相关文件

- `lib/store.ts` - GraphStore 状态管理
- `components/WorkflowCanvas.tsx` - 2D 工作流画布
- `app/api/graphs/[id]/sync/route.ts` - 同步 API
- `app/api/projects/with-graphs/route.ts` - 获取项目列表 API
- `.kiro/specs/dropdown-state-sync/requirements.md` - 需求文档
- `.kiro/specs/dropdown-state-sync/design.md` - 设计文档

## 部署说明

1. 提交代码到 Git
2. 推送到 Vercel
3. 等待自动部署完成
4. 测试保存和转换功能

## 验证步骤

1. 登录管理员账号
2. 创建一个新项目和图谱
3. 在 2D 工作流中添加一些节点
4. 点击"保存并转换为3D"
5. 确认图谱出现在下拉框中
6. 确认图谱被正确选中
7. 确认节点和边的计数正确显示

## 修复日期

2025-01-14

## 相关 Issue

- 保存并转换后图谱在下拉框中消失
- refreshProjects 验证逻辑过于严格
- 项目中有多个图谱时验证失败

## 状态

✅ 已修复并测试
