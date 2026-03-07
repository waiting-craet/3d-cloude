# Workflow保存跳转修复

## 问题描述

在workflow页面（2D图谱编辑器）点击"保存并转换为3D"按钮后，页面跳转到首页，而不是跳转到3D图谱编辑器页面。

## 问题原因

在 `components/WorkflowCanvas.tsx` 的 `saveAndConvert` 方法中，跳转URL设置错误：

```typescript
// ❌ 错误：跳转到首页
const redirectUrl = `/?projectId=${currentProject.id}&graphId=${currentGraph.id}`
window.location.href = redirectUrl
```

## 解决方案

修改跳转URL，直接跳转到3D编辑器页面：

```typescript
// ✅ 修复后：跳转到3D编辑器
const redirectUrl = `/3d-editor?graphId=${currentGraph.id}`
window.location.href = redirectUrl
```

## 完整的修复代码

```typescript
// 保存并转换为三维图谱
const saveAndConvert = async () => {
  try {
    // 0. 检查是否选择了图谱
    if (!currentGraph || !currentProject) {
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
    setSavingStatus('正在保存到数据库...')
    setIsConverting(true)
    setConversionError(null)
    
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
    
    // 4. 刷新项目列表
    setSavingStatus('保存成功！正在刷新数据...')
    try {
      await refreshProjects()
    } catch (refreshError) {
      console.error('⚠️ 刷新项目列表失败，但仍然继续跳转:', refreshError)
    }
    
    // 5. 显示成功并跳转到3D编辑器
    setSavingStatus('即将跳转到3D视图...')
    setConversionSuccess(true)
    
    // ✅ 跳转到3D编辑器页面
    const redirectUrl = `/3d-editor?graphId=${currentGraph.id}`
    console.log('🔄 准备跳转到:', redirectUrl)
    
    setTimeout(() => {
      window.location.href = redirectUrl
    }, 1500)
    
  } catch (error) {
    console.error('❌ 同步失败:', error)
    setSavingStatus('')
    setConversionError(error instanceof Error ? error.message : '同步失败')
    setTimeout(() => setConversionError(null), 5000)
  } finally {
    setIsConverting(false)
  }
}
```

## 用户流程

### 修复前（错误）
```
Workflow页面（2D编辑器）
  ↓ 点击"保存并转换为3D"
保存数据到数据库
  ↓ 跳转
首页 ❌（错误的目标）
```

### 修复后（正确）
```
Workflow页面（2D编辑器）
  ↓ 点击"保存并转换为3D"
保存数据到数据库
  ↓ 跳转
3D编辑器页面 ✅（正确的目标）
  ↓ 自动加载
显示转换后的3D图谱
```

## 为什么跳转到3D编辑器而不是首页？

1. **用户期望**：
   - 用户在2D编辑器中创建了图谱
   - 点击"保存并转换为3D"
   - 期望立即看到3D效果

2. **工作流连续性**：
   - 2D编辑 → 保存 → 3D查看
   - 这是一个连续的工作流
   - 不应该中断到首页

3. **减少操作步骤**：
   - 修复前：保存 → 首页 → 找到项目 → 点击图谱 → 进入3D（4步）
   - 修复后：保存 → 3D编辑器（1步）

## 导航模式

从workflow页面跳转到3D编辑器时：
- **Referrer**: `http://localhost:3000/workflow`
- **检测结果**: 完整模式（因为不是从首页进入）
- **UI表现**: 显示所有编辑按钮

这是正确的，因为用户刚刚在编辑图谱，应该继续拥有编辑权限。

## 相关API

### `/api/graphs/{graphId}/sync`
- **方法**: POST
- **功能**: 同步2D图谱数据到数据库
- **参数**: 
  - `nodes`: 节点数组
  - `connections`: 连接数组
- **返回**: 同步统计信息

## 测试步骤

1. **访问workflow页面**
   ```
   http://localhost:3000/workflow?graphId=xxx
   ```

2. **创建一些节点和连接**
   - 添加至少2个节点
   - 创建节点之间的连接

3. **点击"保存并转换为3D"按钮**

4. **预期结果**：
   - 显示"正在保存到数据库..."
   - 显示"保存成功！正在刷新数据..."
   - 显示"即将跳转到3D视图..."
   - 1.5秒后跳转到 `/3d-editor?graphId=xxx`
   - 3D编辑器加载并显示转换后的图谱
   - 显示完整模式（所有编辑按钮）

5. **控制台日志**：
   ```
   🔄 开始同步2D数据到图谱: [图谱名称]
   📊 节点数: X 连接数: Y
   ✅ 同步成功: {...}
   📊 统计: {...}
   🔄 刷新项目列表...
   ✅ 项目列表刷新成功
   🔄 准备跳转到: /3d-editor?graphId=xxx
   ```

## 其他改进

### 移除了不必要的localStorage操作

修复前：
```typescript
// ❌ 不需要：3D编辑器会从URL参数加载
localStorage.setItem('currentProjectId', currentProject.id)
localStorage.setItem('currentGraphId', currentGraph.id)
```

修复后：
```typescript
// ✅ 直接通过URL参数传递graphId
const redirectUrl = `/3d-editor?graphId=${currentGraph.id}`
```

3D编辑器页面会自动从URL参数中读取graphId并加载相应的图谱数据。

## 相关文件

- ✅ `components/WorkflowCanvas.tsx` - 已修复跳转逻辑
- ✅ `app/workflow/page.tsx` - Workflow页面
- ✅ `app/3d-editor/page.tsx` - 3D编辑器页面（跳转目标）

## 总结

修复完成！现在：
- ✅ 点击"保存并转换为3D" → 跳转到3D编辑器
- ✅ 自动加载转换后的图谱
- ✅ 显示完整模式（可以继续编辑）
- ✅ 用户体验更流畅

刷新页面后，在workflow页面保存应该会正确跳转到3D编辑器了！
