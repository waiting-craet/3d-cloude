# Requirements Document

## Introduction

本功能扩展了知识图谱管理系统的 /creation 页面，使用户能够在点击项目卡片后查看该项目下的所有知识图谱，并支持对这些知识图谱进行批量删除操作。这提供了更深层次的项目内容浏览和管理能力。

## Glossary

- **Creation_Page**: 位于 http://localhost:3000/creation 的页面，显示项目列表
- **Project_Card**: 在 Creation_Page 上显示的项目卡片组件
- **Graph_List_View**: 点击 Project_Card 后显示的知识图谱列表视图
- **Knowledge_Graph**: 项目中的知识图谱实体，包含节点和边的数据结构
- **Batch_Delete_Feature**: 导航栏中的批量删除功能，允许选择多个项目进行删除
- **Navigation_Bar**: 页面顶部的导航栏组件，包含批量删除等操作按钮
- **Graph_Selection_State**: 用户在 Graph_List_View 中选择的知识图谱集合状态

## Requirements

### Requirement 1: 项目卡片点击导航

**User Story:** 作为用户，我想点击项目卡片后查看该项目下的所有知识图谱，以便浏览和管理项目内容。

#### Acceptance Criteria

1. WHEN 用户在 Creation_Page 上点击 Project_Card, THE System SHALL 显示 Graph_List_View
2. THE Graph_List_View SHALL 显示被点击项目下的所有 Knowledge_Graph
3. THE Graph_List_View SHALL 保留 Navigation_Bar 的可见性和功能
4. THE Graph_List_View SHALL 显示当前项目的名称或标识
5. WHEN Graph_List_View 中没有 Knowledge_Graph, THE System SHALL 显示空状态提示信息

### Requirement 2: 知识图谱列表显示

**User Story:** 作为用户，我想在图谱列表中看到每个知识图谱的关键信息，以便识别和选择需要操作的图谱。

#### Acceptance Criteria

1. THE Graph_List_View SHALL 为每个 Knowledge_Graph 显示图谱名称
2. THE Graph_List_View SHALL 为每个 Knowledge_Graph 显示创建时间
3. THE Graph_List_View SHALL 为每个 Knowledge_Graph 显示节点数量
4. THE Graph_List_View SHALL 为每个 Knowledge_Graph 显示边数量
5. THE Graph_List_View SHALL 支持选择框用于批量操作
6. WHEN 用户点击 Knowledge_Graph 卡片（非选择框区域）, THE System SHALL 导航到该图谱的详情页面

### Requirement 3: 批量删除功能保留

**User Story:** 作为用户，我想在查看项目图谱列表时仍能使用批量删除功能，以便高效管理多个知识图谱。

#### Acceptance Criteria

1. WHILE 用户在 Graph_List_View 中, THE Navigation_Bar SHALL 保持 Batch_Delete_Feature 可见
2. WHEN 用户在 Graph_List_View 中选择一个或多个 Knowledge_Graph, THE Batch_Delete_Feature SHALL 变为可用状态
3. WHEN 用户未选择任何 Knowledge_Graph, THE Batch_Delete_Feature SHALL 处于禁用状态
4. THE Batch_Delete_Feature SHALL 仅删除当前项目下被选中的 Knowledge_Graph
5. THE Batch_Delete_Feature SHALL 不影响其他项目的 Knowledge_Graph

### Requirement 4: 批量删除操作执行

**User Story:** 作为用户，我想批量删除选中的知识图谱，以便快速清理不需要的内容。

#### Acceptance Criteria

1. WHEN 用户点击 Batch_Delete_Feature 按钮, THE System SHALL 显示确认对话框
2. THE 确认对话框 SHALL 显示将被删除的 Knowledge_Graph 数量
3. WHEN 用户确认删除操作, THE System SHALL 删除所有选中的 Knowledge_Graph
4. WHEN 删除操作成功, THE System SHALL 从 Graph_List_View 中移除已删除的 Knowledge_Graph
5. WHEN 删除操作成功, THE System SHALL 显示成功提示消息
6. IF 删除操作失败, THEN THE System SHALL 显示错误消息并保留 Graph_Selection_State

### Requirement 5: 选择状态管理

**User Story:** 作为用户，我想清晰地看到哪些知识图谱被选中，以便确认批量操作的目标。

#### Acceptance Criteria

1. THE System SHALL 为选中的 Knowledge_Graph 提供视觉反馈（如高亮或勾选标记）
2. WHEN 用户点击 Knowledge_Graph 的选择框, THE System SHALL 切换该图谱的选择状态
3. THE System SHALL 提供全选功能用于选择当前项目的所有 Knowledge_Graph
4. THE System SHALL 提供取消全选功能用于清除所有选择
5. THE System SHALL 在 Navigation_Bar 中显示当前选中的 Knowledge_Graph 数量

### Requirement 6: 导航和返回功能

**User Story:** 作为用户，我想能够返回项目列表视图，以便在不同项目之间切换。

#### Acceptance Criteria

1. THE Graph_List_View SHALL 提供返回按钮或面包屑导航
2. WHEN 用户点击返回按钮, THE System SHALL 导航回 Creation_Page 的项目列表视图
3. WHEN 用户返回 Creation_Page, THE System SHALL 清除 Graph_Selection_State
4. THE System SHALL 保持 URL 路径反映当前视图状态（项目列表或图谱列表）
5. WHEN 用户直接访问图谱列表 URL, THE System SHALL 正确显示对应项目的 Graph_List_View

### Requirement 7: 数据一致性和错误处理

**User Story:** 作为用户，我想在操作过程中获得可靠的数据显示和错误提示，以便了解系统状态。

#### Acceptance Criteria

1. WHEN Graph_List_View 加载时, THE System SHALL 从数据库获取最新的 Knowledge_Graph 列表
2. IF 项目不存在或已被删除, THEN THE System SHALL 显示错误消息并导航回 Creation_Page
3. IF 网络请求失败, THEN THE System SHALL 显示错误消息并提供重试选项
4. WHEN 批量删除操作执行时, THE System SHALL 禁用相关操作按钮防止重复提交
5. THE System SHALL 在删除操作完成后重新启用操作按钮

### Requirement 8: 性能和用户体验

**User Story:** 作为用户，我想获得流畅的交互体验，以便高效完成图谱管理任务。

#### Acceptance Criteria

1. WHEN 用户点击 Project_Card, THE System SHALL 在 500ms 内开始显示 Graph_List_View
2. WHEN Graph_List_View 加载数据时, THE System SHALL 显示加载指示器
3. WHEN 批量删除操作执行时, THE System SHALL 显示进度指示器
4. THE System SHALL 在删除操作完成后在 200ms 内更新 Graph_List_View
5. THE Graph_List_View SHALL 支持至少 100 个 Knowledge_Graph 的流畅显示和选择
