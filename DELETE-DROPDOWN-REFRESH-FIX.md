# 删除后下拉框未刷新问题修复

## 问题描述

当删除项目或图谱后，虽然删除操作成功，但下拉框中仍然显示已删除的项目或图谱。再次点击删除按钮时，会出现 404 错误：

```
DELETE https://3d-cloude-2hpe.vercel.app/api/graphs/cmkci8s5j002d98y7tojm1zc5 404 (Not Found)
删除失败: Error: 图谱不存在
```

## 根本原因

1. **数据已删除但界面未更新**：删除成功后，虽然调用了 `/api/projects/with-graphs` 重新加载数据，但可能因为缓存问题导致获取的仍是旧数据
2. **用户体验问题**：删除后下拉框保持打开状态，用户看到的是删除前的列表

## 解决方案

### 1. 添加缓存控制

在重新加载项目列表时，添加缓存控制头，确保获取最新数据：

```typescript
const projectsRes = await fetch('/api/projects/with-graphs', {
  // 添加缓存控制，确保获取最新数据
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  },
})
```

### 2. 保持用户体验

删除图谱后，保持项目的展开状态，让用户能看到更新后的图谱列表：

```typescript
// 记住当前展开的项目ID（如果删除的是图谱）
const expandedProjectId = deleteDialog.type === 'graph' ? hoveredProjectId : null

// 重新加载数据后
if (projectsRes.ok) {
  const projectsData = await projectsRes.json()
  setProjects(projectsData.projects || [])
  
  // 如果删除的是图谱，保持项目展开状态
  if (expandedProjectId) {
    setHoveredProjectId(expandedProjectId)
  }
}
```

## 修改的文件

### 1. `components/TopNavbar.tsx`

在 `confirmDelete` 函数中添加缓存控制：

```typescript
// 否则，使用优化的 API 一次性重新加载所有项目和图谱
const projectsRes = await fetch('/api/projects/with-graphs', {
  // 添加缓存控制，确保获取最新数据
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  },
})
```

### 2. `components/ProjectGraphManager.tsx`

在所有数据加载函数中添加缓存控制：

- `loadProjects()` - 加载项目列表
- `loadGraphs(projectId)` - 加载项目的图谱
- `loadNodes(graphId)` - 加载图谱的节点

```typescript
const res = await fetch('/api/projects', {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  },
})
```

## API 路由验证

确认以下 API 路由正常工作：

- ✅ `DELETE /api/projects/[id]` - 删除项目
- ✅ `DELETE /api/graphs/[id]` - 删除图谱
- ✅ `GET /api/projects/with-graphs` - 获取所有项目和图谱

## 测试步骤

1. 登录管理员账号
2. 打开"现有图谱"下拉菜单
3. 展开一个项目，查看其图谱列表
4. 点击某个图谱的删除按钮
5. 确认删除
6. 验证：
   - ✅ 删除成功提示
   - ✅ 图谱从列表中消失
   - ✅ 项目保持展开状态
   - ✅ 其他图谱正常显示
7. 尝试删除项目
8. 验证：
   - ✅ 删除成功提示
   - ✅ 项目从列表中消失
   - ✅ 下拉框显示更新后的项目列表

## 预期结果

- 删除项目或图谱后，下拉框立即显示最新数据
- 不会出现"图谱不存在"或"项目不存在"的错误
- 用户体验流畅，无需手动刷新页面

## 注意事项

1. **缓存问题**：如果仍然出现旧数据，可能是 CDN 或浏览器缓存问题
2. **数据库同步**：在云数据库环境中，可能存在短暂的同步延迟
3. **当前选中的项目/图谱**：如果删除的是当前选中的项目或图谱，会自动刷新整个页面

## 相关文件

- `components/TopNavbar.tsx` - 导航栏组件（包含删除逻辑）
- `app/api/projects/[id]/route.ts` - 项目删除 API
- `app/api/graphs/[id]/route.ts` - 图谱删除 API
- `app/api/projects/with-graphs/route.ts` - 获取项目和图谱列表 API

## 额外优化建议

如果问题持续存在，可以考虑：

1. **乐观更新**：删除前先从界面移除，如果删除失败再恢复
2. **WebSocket**：使用实时通信，确保多个客户端同步
3. **版本号**：为数据添加版本号，检测数据是否过期
