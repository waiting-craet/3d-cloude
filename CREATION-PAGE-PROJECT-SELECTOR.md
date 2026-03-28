# Creation 页面项目选择器实现

## 概述

在 creation 页面的"我的项目"筛选栏中添加了项目选择下拉框，用户可以选择不同的项目来查看对应的图谱和文档。

## 实现的功能

### 1. 项目选择下拉框
- 位置：在"我的项目"文本的右侧
- 显示所有项目的名称（从数据库 Project 表的 name 字段加载）
- 默认选中第一个项目
- 用户可以切换选择不同的项目

### 2. 数据加载
- 页面加载时自动从 `/api/projects` 获取所有项目
- 使用 React useEffect 钩子在组件挂载时加载数据
- 项目列表存储在 `projects` 状态中
- 当前选中的项目 ID 存储在 `selectedProjectId` 状态中

### 3. 自动刷新
- 创建新项目后自动刷新项目列表
- 确保新创建的项目立即出现在下拉框中

### 4. 空状态处理
- 当没有项目时，显示"暂无项目"提示
- 不显示空的下拉框，提供更好的用户体验

## 技术实现

### 状态管理
```typescript
const [projects, setProjects] = useState<Project[]>([]);
const [selectedProjectId, setSelectedProjectId] = useState<string>('');
```

### 数据加载函数
```typescript
const fetchAllProjects = async () => {
  try {
    const response = await fetch('/api/projects');
    if (response.ok) {
      const data = await response.json();
      const projectList = data.projects || [];
      setProjects(projectList);
      // 默认选中第一个项目
      if (projectList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectList[0].id);
      }
    }
  } catch (error) {
    console.error('加载项目列表失败:', error);
  }
};
```

### UI 布局
- 使用 flexbox 布局将"我的项目"文本和下拉框水平排列
- 设置 16px 的间距
- 下拉框最小宽度为 200px
- 复用现有的 `filterSelect` 样式类

## 数据库对接

### API 端点
- **GET** `/api/projects` - 获取所有项目列表

### 返回数据格式
```json
{
  "projects": [
    {
      "id": "项目ID",
      "name": "项目名称",
      "description": "项目描述",
      "nodeCount": 0,
      "edgeCount": 0,
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  ]
}
```

### 数据库表
- 表名：`Project`
- 使用字段：`id`, `name`
- 排序：按 `updatedAt` 降序

## 用户体验

### 正常流程
1. 用户访问 creation 页面
2. 页面自动加载所有项目
3. 第一个项目被自动选中
4. 用户可以点击下拉框选择其他项目
5. 选择项目后，可以查看该项目下的图谱和文档（待实现）

### 空状态
1. 如果数据库中没有项目
2. 显示"暂无项目"文本提示
3. 用户可以点击"新建"按钮创建第一个项目

### 创建新项目后
1. 用户通过"新建"按钮创建项目
2. 创建成功后自动刷新项目列表
3. 新项目出现在下拉框中

## 后续优化建议

1. **图谱列表过滤**：根据选中的项目 ID 过滤显示的图谱列表
2. **加载状态**：在加载项目时显示加载指示器
3. **错误处理**：更友好的错误提示和重试机制
4. **项目详情**：显示选中项目的统计信息（节点数、边数等）
5. **搜索功能**：在项目较多时提供搜索功能
6. **最近使用**：记住用户最后选择的项目
7. **项目图标**：为每个项目添加图标或颜色标识

## 文件修改

### 修改的文件
1. `components/creation/NewCreationWorkflowPage.tsx`
   - 添加 `projects` 和 `selectedProjectId` 状态
   - 添加 `fetchAllProjects` 函数
   - 在 useEffect 中加载项目列表
   - 更新 UI 添加项目选择下拉框
   - 创建成功后刷新项目列表

## 测试建议

1. 测试页面加载时自动加载项目列表
2. 测试默认选中第一个项目
3. 测试切换选择不同项目
4. 测试空状态显示
5. 测试创建新项目后列表自动刷新
6. 测试 API 请求失败的情况
