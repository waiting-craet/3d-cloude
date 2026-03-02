# Requirements Document

## Introduction

本功能旨在实现从 creation 页面的项目列表点击图谱卡片后，能够正确导航到 graph 页面（3D 图谱编辑器），并加载对应的图谱数据，确保图谱与创建的节点存在正确的对应关系。

## Glossary

- **Creation_Page**: 项目创建和管理页面，显示所有项目和图谱的列表
- **Graph_Page**: 3D 知识图谱编辑和查看页面
- **Graph_Card**: 在 Creation_Page 上显示的图谱卡片组件
- **Graph_Data**: 图谱的完整数据，包括节点（nodes）和边（edges）
- **Navigation_System**: 页面路由和导航系统
- **Data_Loading_System**: 从后端 API 加载图谱数据的系统

## Requirements

### Requirement 1: 图谱卡片导航

**User Story:** 作为用户，我希望在 creation 页面点击图谱卡片时能够跳转到 graph 页面，以便查看和编辑该图谱的 3D 视图。

#### Acceptance Criteria

1. WHEN 用户在 Creation_Page 点击 Graph_Card THEN THE Navigation_System SHALL 导航到 Graph_Page 并传递图谱 ID
2. WHEN Navigation_System 导航到 Graph_Page THEN THE URL SHALL 包含图谱 ID 作为查询参数（格式：`/graph?graphId={id}`）
3. WHEN 用户点击 Graph_Card THEN THE Navigation_System SHALL 在导航前验证图谱 ID 存在且有效
4. IF 图谱 ID 无效或不存在 THEN THE Navigation_System SHALL 显示错误提示并阻止导航

### Requirement 2: 图谱数据加载

**User Story:** 作为用户，我希望 graph 页面能够自动加载我选择的图谱数据，以便我可以立即查看和编辑图谱内容。

#### Acceptance Criteria

1. WHEN Graph_Page 接收到图谱 ID 参数 THEN THE Data_Loading_System SHALL 从后端 API 获取对应的图谱数据
2. WHEN Data_Loading_System 获取图谱数据 THEN THE System SHALL 同时加载节点数据和边数据
3. WHEN 图谱数据加载成功 THEN THE Graph_Page SHALL 在 3D 视图中渲染所有节点和边
4. IF 图谱数据加载失败 THEN THE System SHALL 显示错误消息并提供重试选项
5. WHILE 图谱数据正在加载 THEN THE Graph_Page SHALL 显示加载指示器

### Requirement 3: 节点和边的对应关系

**User Story:** 作为用户，我希望在 graph 页面看到的节点和边与我在创建时定义的完全一致，以便确保数据的准确性和完整性。

#### Acceptance Criteria

1. WHEN Graph_Page 渲染图谱 THEN THE System SHALL 保持节点的所有属性（名称、颜色、大小、形状、位置）
2. WHEN Graph_Page 渲染图谱 THEN THE System SHALL 保持边的所有属性（源节点、目标节点、标签、颜色）
3. WHEN 用户在 Graph_Page 修改节点或边 THEN THE System SHALL 将更改保存到数据库并关联到正确的图谱 ID
4. FOR ALL 节点和边 THEN THE System SHALL 验证它们属于当前加载的图谱

### Requirement 4: 状态管理和同步

**User Story:** 作为用户，我希望在 graph 页面对图谱的修改能够正确保存，并在返回 creation 页面时看到更新后的信息。

#### Acceptance Criteria

1. WHEN 用户在 Graph_Page 添加或删除节点 THEN THE System SHALL 立即更新数据库中的图谱数据
2. WHEN 用户在 Graph_Page 添加或删除边 THEN THE System SHALL 立即更新数据库中的图谱数据
3. WHEN 用户从 Graph_Page 返回 Creation_Page THEN THE Creation_Page SHALL 显示更新后的节点数量和边数量
4. WHEN 图谱数据发生变化 THEN THE System SHALL 更新图谱的 `updatedAt` 时间戳

### Requirement 5: URL 参数处理

**User Story:** 作为开发者，我希望 graph 页面能够正确处理 URL 参数，以便支持直接链接访问和浏览器前进/后退功能。

#### Acceptance Criteria

1. WHEN Graph_Page 加载 THEN THE System SHALL 从 URL 查询参数中提取图谱 ID
2. WHEN URL 不包含图谱 ID 参数 THEN THE Graph_Page SHALL 显示提示信息并提供返回 Creation_Page 的链接
3. WHEN 用户使用浏览器后退按钮 THEN THE System SHALL 正确返回到 Creation_Page
4. WHEN 用户刷新 Graph_Page THEN THE System SHALL 重新加载相同的图谱数据

### Requirement 6: 错误处理和用户反馈

**User Story:** 作为用户，我希望在出现错误时能够收到清晰的提示信息，以便我知道发生了什么问题以及如何解决。

#### Acceptance Criteria

1. IF 图谱 ID 不存在 THEN THE System SHALL 显示"图谱不存在"错误消息
2. IF 网络请求失败 THEN THE System SHALL 显示"加载失败，请检查网络连接"错误消息
3. IF 图谱数据为空 THEN THE System SHALL 显示"该图谱暂无数据"提示信息
4. WHEN 显示错误消息 THEN THE System SHALL 提供"返回"或"重试"操作按钮
5. WHEN 数据加载超时（超过 10 秒）THEN THE System SHALL 显示超时错误并提供重试选项
