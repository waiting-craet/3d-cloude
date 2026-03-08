# 首页搜索功能实现

## 功能概述

为首页搜索框添加了完整的搜索功能，支持实时过滤项目和知识图谱。

## 实现的功能

### 1. 搜索状态管理
- 添加了 `searchQuery` 状态来跟踪用户的搜索输入
- 搜索查询在组件中持久化，直到用户清除或返回

### 2. 项目搜索
- 在推荐广场视图中搜索项目
- 支持按项目名称和描述搜索
- 不区分大小写的模糊匹配

### 3. 图谱搜索
- 在项目图谱视图中搜索知识图谱
- 支持按图谱名称和描述搜索
- 不区分大小写的模糊匹配

### 4. 搜索结果显示
- 显示搜索关键词和结果数量
- 提供"清除"按钮快速清除搜索
- 根据搜索状态显示不同的空状态消息

### 5. 用户体验优化
- 搜索结果实时更新
- 返回推荐广场时自动清除搜索
- 友好的空状态提示

## 使用方法

1. 在首页搜索框中输入关键词
2. 按回车键或点击搜索按钮
3. 页面会自动过滤显示匹配的项目或图谱
4. 点击"清除"按钮可以清除搜索并显示所有内容

## 技术实现

### 搜索过滤逻辑
```typescript
// 项目过滤
const displayProjects = useCallback(() => {
  let filtered = projects
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(project => 
      project.name.toLowerCase().includes(query) ||
      (project.description && project.description.toLowerCase().includes(query))
    )
  }
  
  return filtered.slice(0, 12)
}, [projects, searchQuery])()

// 图谱过滤
const displayGraphs = useCallback(() => {
  let filtered = graphs
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(graph => 
      graph.name.toLowerCase().includes(query) ||
      (graph.description && graph.description.toLowerCase().includes(query))
    )
  }
  
  return filtered
}, [graphs, searchQuery])()
```

### 搜索处理函数
```typescript
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query)
}, [])
```

## 改进的文件

- `app/page.tsx` - 添加搜索状态和过滤逻辑
- `components/PaperHeroSection.tsx` - 已有搜索框UI（无需修改）

## 测试建议

1. 测试空搜索查询
2. 测试匹配单个结果
3. 测试匹配多个结果
4. 测试无匹配结果
5. 测试中文和英文搜索
6. 测试清除搜索功能
7. 测试在项目视图和图谱视图之间切换时的搜索行为

## 未来改进建议

1. 添加搜索历史记录
2. 支持高级搜索选项（按日期、节点数等）
3. 添加搜索建议/自动完成
4. 支持正则表达式搜索
5. 添加搜索结果高亮显示
