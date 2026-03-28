# 项目和知识图谱管理功能说明

## ✅ 已完成的功能

### 1. 新建项目弹窗 (CreateProjectModal)

**位置**: `components/CreateProjectModal.tsx`

**功能特性**:
- ✅ 两种创建模式：新建项目 / 选择现有项目
- ✅ 项目名称输入（新建模式）
- ✅ 项目选择下拉框（现有项目模式）
- ✅ 知识图谱名称输入
- ✅ 表单验证
- ✅ 优雅的动画效果
- ✅ 响应式设计

**创建流程**:
1. 点击"新建"按钮
2. 选择创建模式（新建项目 / 现有项目）
3. 输入项目名称（新建）或选择项目（现有）
4. 输入知识图谱名称
5. 点击"创建"

### 2. 现有图谱下拉菜单

**位置**: `components/TopNavbar.tsx`

**功能特性**:
- ✅ 显示当前项目和图谱名称
- ✅ 点击展开项目列表
- ✅ 鼠标悬停显示项目的图谱列表
- ✅ 二级菜单展示所有图谱
- ✅ 当前图谱高亮显示（✓ 标记）
- ✅ 显示图谱统计信息（节点数、关系数）
- ✅ 点击切换到对应图谱

**交互流程**:
1. 点击"现有图谱"按钮
2. 显示所有项目列表
3. 鼠标悬停在项目上
4. 右侧弹出该项目的所有图谱
5. 点击图谱切换到该图谱

### 3. 数据结构扩展 (Store)

**位置**: `lib/store.ts`

**新增数据类型**:
```typescript
interface KnowledgeGraph {
  id: string
  name: string
  projectId: string
  nodeCount: number
  edgeCount: number
  createdAt: string
}

interface Project {
  id: string
  name: string
  graphs: KnowledgeGraph[]
}
```

**新增状态管理**:
- `projects`: 所有项目列表
- `currentProject`: 当前选中的项目
- `currentGraph`: 当前选中的知识图谱

**新增方法**:
- `createProject()`: 创建新项目和图谱
- `addGraphToProject()`: 在现有项目中添加图谱
- `switchGraph()`: 切换到指定图谱

### 4. 数据持久化

**使用 localStorage 存储**:
```javascript
// 存储的数据
localStorage.setItem('projects', JSON.stringify(projects))
localStorage.setItem('currentProjectId', projectId)
localStorage.setItem('currentGraphId', graphId)
```

**页面加载时恢复**:
- 自动加载保存的项目列表
- 恢复上次选中的项目和图谱
- 保持用户的工作状态

## 🎨 视觉设计

### 现有图谱按钮
- 显示当前项目/图谱路径
- 下拉箭头动画
- 悬停效果

### 项目下拉菜单
- 深色半透明背景
- 毛玻璃效果
- 圆角设计（12px）
- 深度阴影

### 图谱子菜单
- 右侧弹出
- 当前图谱高亮
- 显示统计信息
- 悬停效果

### 新建项目弹窗
- 居中显示
- 模式切换按钮
- 表单输入
- 绿色创建按钮

## 📋 使用流程

### 创建新项目和图谱

1. **管理员登录**
   - 用户名: `admin`
   - 密码: `admin123`

2. **点击"新建"按钮**
   - 打开创建项目弹窗

3. **选择"新建项目"**
   - 输入项目名称：例如 "AI 研究"
   - 输入图谱名称：例如 "机器学习知识图谱"
   - 点击"创建"

4. **项目创建成功**
   - 自动切换到新图谱
   - 导航栏显示当前路径
   - 可以开始添加节点

### 在现有项目中添加图谱

1. **点击"新建"按钮**

2. **选择"选择现有项目"**
   - 从下拉框选择项目
   - 输入新图谱名称
   - 点击"创建"

3. **图谱添加成功**
   - 自动切换到新图谱
   - 项目中增加一个图谱

### 切换知识图谱

1. **点击"现有图谱"按钮**
   - 显示所有项目

2. **鼠标悬停在项目上**
   - 右侧显示该项目的所有图谱
   - 当前图谱有 ✓ 标记

3. **点击目标图谱**
   - 切换到该图谱
   - 加载对应的节点和关系
   - 菜单自动关闭

## 🔧 技术实现

### 组件结构

```
TopNavbar
├── 现有图谱下拉菜单
│   ├── 项目列表
│   └── 图谱子菜单（悬停显示）
├── 搜索框
└── 右侧按钮
    ├── 新建按钮（管理员）
    └── 登录/登出

CreateProjectModal
├── 模式切换按钮
├── 项目输入/选择
├── 图谱名称输入
└── 创建/取消按钮
```

### 状态管理流程

```
创建项目
  ↓
生成 ID
  ↓
创建数据结构
  ↓
更新 Store
  ↓
保存到 localStorage
  ↓
切换到新图谱
```

### 切换图谱流程

```
点击图谱
  ↓
查找项目和图谱
  ↓
更新当前状态
  ↓
清空节点和边
  ↓
保存到 localStorage
  ↓
（可选）从后端加载数据
```

## 📊 数据示例

### 项目数据结构

```json
{
  "id": "project-1704067200000",
  "name": "AI 研究",
  "graphs": [
    {
      "id": "graph-1704067200001",
      "name": "机器学习知识图谱",
      "projectId": "project-1704067200000",
      "nodeCount": 15,
      "edgeCount": 23,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "graph-1704067200002",
      "name": "深度学习知识图谱",
      "projectId": "project-1704067200000",
      "nodeCount": 8,
      "edgeCount": 12,
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

## 🚀 下一步扩展建议

### 后端集成
1. 实现项目和图谱的 API 接口
2. 数据库存储项目结构
3. 按图谱 ID 加载节点和边
4. 实现图谱的导入导出

### 功能增强
1. 项目重命名
2. 图谱重命名
3. 删除项目/图谱
4. 图谱复制
5. 项目分享
6. 协作编辑

### UI 改进
1. 拖拽排序项目
2. 图谱缩略图预览
3. 最近访问的图谱
4. 收藏夹功能
5. 搜索项目和图谱

### 数据管理
1. 图谱模板
2. 批量导入
3. 数据备份
4. 版本控制
5. 变更历史

## 💡 使用技巧

### 组织项目
- 按主题创建项目（如：AI、生物、历史）
- 每个项目包含相关的多个图谱
- 使用清晰的命名规范

### 命名建议
- 项目名：简短明确（如：机器学习研究）
- 图谱名：具体描述（如：神经网络架构图谱）

### 工作流程
1. 创建项目
2. 在项目中创建多个相关图谱
3. 在不同图谱间切换工作
4. 使用搜索快速定位节点

## 🎯 测试清单

- [x] 创建新项目和图谱
- [x] 在现有项目中添加图谱
- [x] 切换到不同的图谱
- [x] 显示当前项目和图谱路径
- [x] 项目列表正确显示
- [x] 图谱子菜单正确显示
- [x] 当前图谱高亮显示
- [x] 数据持久化到 localStorage
- [x] 页面刷新后恢复状态
- [x] 点击外部关闭菜单
- [x] 表单验证正常工作

## 📸 界面预览

### 现有图谱下拉菜单

```
┌─────────────────────────────────┐
│ 📁 AI 研究                      │
│    2 个图谱                  ▶  │ ──┐
├─────────────────────────────────┤   │
│ 📁 生物研究                     │   │
│    3 个图谱                  ▶  │   │
└─────────────────────────────────┘   │
                                      │
    ┌─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ ✓ 机器学习知识图谱          │
│   15 节点 · 23 关系         │
├─────────────────────────────┤
│   深度学习知识图谱          │
│   8 节点 · 12 关系          │
└─────────────────────────────┘
```

### 新建项目弹窗

```
┌───────────────────────────────┐
│      新建知识图谱              │
│  创建新项目或在现有项目中添加  │
│                                │
│  [新建项目] [选择现有项目]    │
│                                │
│  项目名称                      │
│  [________________]            │
│                                │
│  知识图谱名称                  │
│  [________________]            │
│                                │
│  [取消]        [创建]          │
└───────────────────────────────┘
```

## 🔑 关键代码

### 创建项目

```typescript
createProject: (projectName, graphName) => {
  const projectId = `project-${Date.now()}`
  const graphId = `graph-${Date.now()}`
  
  const newGraph: KnowledgeGraph = {
    id: graphId,
    name: graphName,
    projectId: projectId,
    nodeCount: 0,
    edgeCount: 0,
    createdAt: new Date().toISOString(),
  }
  
  const newProject: Project = {
    id: projectId,
    name: projectName,
    graphs: [newGraph],
  }
  
  set((state) => ({
    projects: [...state.projects, newProject],
    currentProject: newProject,
    currentGraph: newGraph,
    nodes: [],
    edges: [],
  }))

  localStorage.setItem('projects', JSON.stringify(get().projects))
}
```

### 切换图谱

```typescript
switchGraph: (projectId, graphId) => {
  const state = get()
  const project = state.projects.find((p) => p.id === projectId)
  const graph = project?.graphs.find((g) => g.id === graphId)
  
  if (project && graph) {
    set({
      currentProject: project,
      currentGraph: graph,
      nodes: [],
      edges: [],
    })

    localStorage.setItem('currentProjectId', projectId)
    localStorage.setItem('currentGraphId', graphId)
  }
}
```
