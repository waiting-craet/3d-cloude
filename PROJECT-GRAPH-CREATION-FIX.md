# 项目与图谱创建功能修复

## 问题描述
在文本页面的"项目与图谱"模块中，点击"新建项目"或"新建图谱"按钮后，虽然显示了创建对话框，但实际上并没有调用API创建项目或图谱，只是打印了日志。

## 根本原因
`handleCreateProject` 和 `handleCreateGraph` 函数中只有占位代码：
```typescript
// 旧代码
const handleCreateProject = () => {
  if (newProjectName.trim()) {
    console.log('创建项目:', newProjectName)
    // 实际应该调用API创建项目  ← 只有注释，没有实现
    setShowNewProjectModal(false)
    setNewProjectName('')
  }
}
```

## 修复方案

### 1. 实现 `handleCreateProject` 函数
**文件**: `app/text-page/page.tsx`

**功能**:
- 调用 `POST /api/projects` API创建项目
- 验证项目名称非空
- 创建成功后刷新项目列表
- 自动选中新创建的项目
- 显示错误消息（如果失败）

**实现**:
```typescript
const handleCreateProject = async () => {
  if (!newProjectName.trim()) return

  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newProjectName.trim(),
      }),
    })

    const result = await response.json()

    if (response.ok && result.project) {
      // 关闭模态框
      setShowNewProjectModal(false)
      setNewProjectName('')
      
      // 刷新项目列表
      const projectsResponse = await fetch('/api/projects')
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setProjects(projectsData.projects || [])
        
        // 自动选中新创建的项目
        setSelectedProject(result.project.id)
      }
    } else {
      alert(`创建项目失败: ${result.error || '未知错误'}`)
    }
  } catch (error) {
    console.error('Create project error:', error)
    alert('创建项目失败，请重试')
  }
}
```

### 2. 实现 `handleCreateGraph` 函数
**文件**: `app/text-page/page.tsx`

**功能**:
- 调用 `POST /api/projects/[id]/graphs` API创建图谱
- 验证图谱名称非空且已选择项目
- 创建成功后刷新图谱列表
- 自动选中新创建的图谱
- 显示错误消息（如果失败）

**实现**:
```typescript
const handleCreateGraph = async () => {
  if (!newGraphName.trim() || !selectedProject) return

  try {
    const response = await fetch(`/api/projects/${selectedProject}/graphs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newGraphName.trim(),
      }),
    })

    const result = await response.json()

    if (response.ok && result.graph) {
      // 关闭模态框
      setShowNewGraphModal(false)
      setNewGraphName('')
      
      // 刷新图谱列表
      const graphsResponse = await fetch(`/api/projects/${selectedProject}/graphs`)
      if (graphsResponse.ok) {
        const graphsData = await graphsResponse.json()
        setGraphs(graphsData.graphs || [])
        
        // 自动选中新创建的图谱
        setSelectedGraph(result.graph.id)
      }
    } else {
      alert(`创建图谱失败: ${result.error || '未知错误'}`)
    }
  } catch (error) {
    console.error('Create graph error:', error)
    alert('创建图谱失败，请重试')
  }
}
```

## 修复内容总结

### ✅ 已修复功能
1. **创建项目**: 
   - 调用 `/api/projects` POST API
   - 刷新项目列表
   - 自动选中新项目
   - 错误处理和用户提示

2. **创建图谱**: 
   - 调用 `/api/projects/[id]/graphs` POST API
   - 刷新图谱列表
   - 自动选中新图谱
   - 错误处理和用户提示

### 🎯 用户体验改进
- **自动选中**: 创建成功后自动选中新创建的项目/图谱，用户可以立即使用
- **列表刷新**: 创建后立即刷新列表，确保UI与数据库同步
- **错误提示**: 如果创建失败，显示友好的错误消息
- **输入验证**: 确保名称非空才允许创建

### 📋 API端点
- `POST /api/projects` - 创建项目
  - 请求体: `{ name: string, description?: string }`
  - 响应: `{ project: Project }`

- `POST /api/projects/[id]/graphs` - 创建图谱
  - 请求体: `{ name: string, description?: string, isPublic?: boolean }`
  - 响应: `{ graph: Graph }`

## 验证
✅ TypeScript编译无错误  
✅ 使用正确的API响应格式 (`data.projects`, `data.graphs`)  
✅ 包含完整的错误处理  
✅ 自动刷新和选中新创建的项目/图谱

## 测试建议
1. 点击"新建项目"按钮，输入项目名称，确认创建
2. 验证项目列表已刷新，新项目已自动选中
3. 选中一个项目后，点击"新建图谱"按钮，输入图谱名称，确认创建
4. 验证图谱列表已刷新，新图谱已自动选中
5. 测试空名称验证（应该不允许创建）
6. 测试网络错误情况（应该显示错误提示）

---

**修复日期**: 2026-02-10  
**状态**: ✅ 完成并验证
