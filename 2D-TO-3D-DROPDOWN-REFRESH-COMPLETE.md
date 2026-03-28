# 2D转3D保存后下拉框刷新功能 - 实现完成

## 问题描述

用户在2D工作流编辑器中编辑完知识流后,点击"保存并转换为3D"按钮,数据会被同步到数据库。但是跳转回首页后,导航栏的"现有图谱"下拉框中该项目和图谱消失了,没有显示出来。

## 根本原因

保存转换成功后,页面直接跳转到首页(`window.location.href = '/'`),但是首页的TopNavbar组件从store中读取的projects列表没有被刷新,导致显示的是旧数据。

## 解决方案

### 1. 在GraphStore中添加refreshProjects方法

**文件**: `lib/store.ts`

**修改内容**:
- 在GraphStore接口中添加`refreshProjects: () => Promise<void>`方法签名
- 实现refreshProjects方法,调用`/api/projects/with-graphs` API加载最新项目列表
- 添加缓存控制头(`Cache-Control: no-cache, no-store, must-revalidate`)确保获取最新数据
- 实现重试机制,最多重试3次,每次重试之间递增延迟(500ms, 1000ms, 1500ms)
- 验证currentProject和currentGraph是否存在于新加载的数据中
- 更新GraphStore状态,保持currentProject和currentGraph的选中状态

### 2. 修改WorkflowCanvas的saveAndConvert函数

**文件**: `components/WorkflowCanvas.tsx`

**修改内容**:
- 从useGraphStore中导入refreshProjects方法
- 在数据同步成功后,调用refreshProjects()刷新项目列表
- 使用try-catch包裹refreshProjects调用,即使刷新失败也继续跳转(因为数据已保存)
- 添加详细的日志输出

### 3. 添加用户反馈状态

**文件**: `components/WorkflowCanvas.tsx`

**修改内容**:
- 添加`savingStatus`状态变量
- 在saveAndConvert的不同阶段更新savingStatus:
  - "正在保存到数据库..."
  - "保存成功！正在刷新数据..."
  - "即将跳转到3D视图..."
- 修改现有的转换状态提示,显示savingStatus内容

### 4. 改进错误处理

**修改内容**:
- Sync API失败时显示错误消息并保持在2D编辑器页面
- refreshProjects失败时记录错误日志但继续跳转
- 所有错误都有详细的日志输出
- 错误发生时清空savingStatus状态

## 实现细节

### refreshProjects方法的重试机制

```typescript
let retryCount = 0
const maxRetries = 3

while (retryCount < maxRetries) {
  // 添加递增延迟
  if (retryCount > 0) {
    await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
  }
  
  // 调用API获取最新数据
  const projectsRes = await fetch('/api/projects/with-graphs', {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  })
  
  // 验证数据是否包含当前项目和图谱
  if (project && graph) {
    // 找到了,更新状态并返回
    set({ projects, currentProject: project, currentGraph: graph })
    return
  }
  
  retryCount++
}
```

### saveAndConvert的完整流程

1. **验证数据** - 检查是否选择了图谱,是否有有效节点
2. **准备数据** - 将2D节点和连接转换为API格式
3. **同步到数据库** - 调用`/api/graphs/[id]/sync` API
4. **刷新项目列表** - 调用refreshProjects()确保UI显示最新数据
5. **跳转到首页** - 显示成功提示并跳转

## 测试建议

### 手动测试步骤

1. **测试新项目创建和编辑**:
   - 在首页创建新项目和图谱
   - 点击加号进入2D编辑器
   - 添加节点和连接
   - 点击"保存并转换为3D"
   - 验证跳转后下拉框中显示新项目和图谱
   - 验证当前图谱保持选中状态

2. **测试现有图谱编辑**:
   - 选择一个现有图谱
   - 点击加号进入2D编辑器
   - 修改节点和连接
   - 点击"保存并转换为3D"
   - 验证跳转后下拉框中显示更新后的图谱
   - 验证当前图谱保持选中状态

3. **测试用户反馈**:
   - 观察保存过程中的状态提示
   - 验证显示"正在保存到数据库..."
   - 验证显示"保存成功！正在刷新数据..."
   - 验证显示"即将跳转到3D视图..."

4. **测试错误处理**:
   - 模拟网络错误(断网)
   - 验证显示错误消息
   - 验证保持在2D编辑器页面
   - 验证编辑内容不丢失

### 验证缓存控制

打开浏览器开发者工具的Network标签:
1. 点击"保存并转换为3D"
2. 查找对`/api/projects/with-graphs`的请求
3. 验证请求头包含:
   - `Cache-Control: no-cache, no-store, must-revalidate`
   - `Pragma: no-cache`

### 验证重试机制

在`lib/store.ts`的refreshProjects方法中添加人工延迟:
```typescript
// 在API调用前添加
await new Promise(resolve => setTimeout(resolve, 2000))
```

然后测试是否能正确重试并最终成功加载数据。

## 数据流图

```
用户点击"保存并转换为3D"
         ↓
验证数据(图谱、节点)
         ↓
准备payload数据
         ↓
调用 POST /api/graphs/[id]/sync
         ↓
数据库更新节点和边
         ↓
调用 refreshProjects()
         ↓
GET /api/projects/with-graphs (带缓存控制)
         ↓
重试机制(最多3次,递增延迟)
         ↓
更新 GraphStore.projects
         ↓
保持 currentProject 和 currentGraph
         ↓
显示成功提示
         ↓
跳转到首页 (window.location.href = '/')
         ↓
TopNavbar 显示最新的项目列表
         ↓
当前图谱保持选中状态
```

## 关键改进点

1. **数据一致性**: 通过刷新项目列表,确保UI显示的数据与数据库一致
2. **重试机制**: 处理数据库同步延迟,最多重试3次
3. **缓存控制**: 添加HTTP头确保获取最新数据而不是缓存
4. **用户体验**: 显示详细的进度状态,让用户了解系统正在做什么
5. **错误处理**: 即使刷新失败也继续跳转,因为数据已保存到数据库
6. **状态保持**: 刷新后保持currentProject和currentGraph的选中状态

## 相关文件

- `.kiro/specs/2d-to-3d-conversion/requirements.md` - 需求文档
- `.kiro/specs/2d-to-3d-conversion/design.md` - 设计文档
- `.kiro/specs/2d-to-3d-conversion/tasks.md` - 任务列表
- `lib/store.ts` - GraphStore实现
- `components/WorkflowCanvas.tsx` - 2D编辑器组件

## 部署注意事项

1. 确保数据库连接正常
2. 确保`/api/projects/with-graphs` API正常工作
3. 确保`/api/graphs/[id]/sync` API正常工作
4. 测试在生产环境中的网络延迟情况
5. 监控重试机制的日志,了解是否需要调整重试次数或延迟时间

## 完成状态

✅ 所有任务已完成
✅ 代码无语法错误
✅ 功能逻辑闭环已实现

现在可以部署到生产环境进行测试!
