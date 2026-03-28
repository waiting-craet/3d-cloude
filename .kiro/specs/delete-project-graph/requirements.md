# Requirements Document

## Introduction

本文档定义了项目和图谱删除功能的需求。该功能允许用户在项目-图谱管理界面的下拉选择框中，为每个项目和图谱选项添加删除按钮，用户点击删除按钮后会弹出确认对话框，确认后删除相应的项目或图谱及其所有关联数据。

## Glossary

- **Project**: 项目，是组织知识图谱的顶层容器，包含多个图谱、节点和边
- **Graph**: 知识图谱，属于某个项目，包含多个节点和边
- **Node**: 节点，属于某个项目和图谱，表示知识图谱中的实体
- **Edge**: 边，属于某个项目和图谱，表示节点之间的关系
- **Cascade_Delete**: 级联删除，删除父实体时自动删除所有关联的子实体
- **Confirmation_Dialog**: 确认对话框，在执行危险操作前要求用户确认的弹窗
- **Delete_Button**: 删除按钮，触发删除操作的UI元素

## Requirements

### Requirement 1: 项目删除按钮

**User Story:** 作为用户，我想在项目选择框中看到每个项目旁边的删除按钮，以便我可以删除不需要的项目。

#### Acceptance Criteria

1. WHEN 项目列表显示时，THE System SHALL 在每个项目选项的右侧显示一个删除按钮
2. WHEN 用户将鼠标悬停在删除按钮上时，THE System SHALL 显示视觉反馈（如颜色变化或提示）
3. THE Delete_Button SHALL 使用清晰的图标（如垃圾桶图标）表示删除操作
4. THE Delete_Button SHALL 与项目名称在视觉上保持适当的间距和对齐

### Requirement 2: 图谱删除按钮

**User Story:** 作为用户，我想在图谱选择框中看到每个图谱旁边的删除按钮，以便我可以删除不需要的图谱。

#### Acceptance Criteria

1. WHEN 图谱列表显示时，THE System SHALL 在每个图谱选项的右侧显示一个删除按钮
2. WHEN 用户将鼠标悬停在删除按钮上时，THE System SHALL 显示视觉反馈（如颜色变化或提示）
3. THE Delete_Button SHALL 使用清晰的图标（如垃圾桶图标）表示删除操作
4. THE Delete_Button SHALL 与图谱名称在视觉上保持适当的间距和对齐

### Requirement 3: 删除确认对话框

**User Story:** 作为用户，我想在删除项目或图谱前看到确认对话框，以防止误删除重要数据。

#### Acceptance Criteria

1. WHEN 用户点击项目删除按钮时，THE System SHALL 显示确认对话框并阻止立即删除
2. WHEN 用户点击图谱删除按钮时，THE System SHALL 显示确认对话框并阻止立即删除
3. THE Confirmation_Dialog SHALL 清晰显示将要删除的项目或图谱名称
4. THE Confirmation_Dialog SHALL 显示将被删除的关联数据数量（节点数、边数、图谱数）
5. THE Confirmation_Dialog SHALL 提供"确认删除"和"取消"两个操作按钮
6. WHEN 用户点击"取消"按钮或关闭对话框时，THE System SHALL 关闭对话框且不执行删除操作
7. THE Confirmation_Dialog SHALL 使用警告性的视觉样式（如红色）强调操作的危险性

### Requirement 4: 项目级联删除

**User Story:** 作为用户，我想删除项目时自动删除该项目下的所有数据，以保持数据一致性。

#### Acceptance Criteria

1. WHEN 用户确认删除项目时，THE System SHALL 删除该项目记录
2. WHEN 项目被删除时，THE System SHALL 级联删除该项目下的所有图谱
3. WHEN 项目被删除时，THE System SHALL 级联删除该项目下的所有节点
4. WHEN 项目被删除时，THE System SHALL 级联删除该项目下的所有边
5. WHEN 项目被删除时，THE System SHALL 删除关联的所有媒体文件（图片、封面等）
6. THE System SHALL 在单个数据库事务中完成所有删除操作以保证原子性

### Requirement 5: 图谱级联删除

**User Story:** 作为用户，我想删除图谱时自动删除该图谱下的所有数据，以保持数据一致性。

#### Acceptance Criteria

1. WHEN 用户确认删除图谱时，THE System SHALL 删除该图谱记录
2. WHEN 图谱被删除时，THE System SHALL 级联删除该图谱下的所有节点
3. WHEN 图谱被删除时，THE System SHALL 级联删除该图谱下的所有边
4. WHEN 图谱被删除时，THE System SHALL 删除关联的所有媒体文件（图片、封面等）
5. THE System SHALL 在单个数据库事务中完成所有删除操作以保证原子性
6. WHEN 图谱被删除后，THE System SHALL 保留该项目及其他图谱的数据不受影响

### Requirement 6: 删除操作反馈

**User Story:** 作为用户，我想在删除操作完成后看到明确的反馈，以确认操作成功或失败。

#### Acceptance Criteria

1. WHEN 删除操作成功完成时，THE System SHALL 显示成功提示消息
2. WHEN 删除操作失败时，THE System SHALL 显示错误提示消息并说明失败原因
3. WHEN 项目删除成功后，THE System SHALL 自动刷新项目列表并清除已删除项目的选中状态
4. WHEN 图谱删除成功后，THE System SHALL 自动刷新图谱列表并清除已删除图谱的选中状态
5. WHEN 删除操作进行中时，THE System SHALL 显示加载指示器并禁用删除按钮防止重复操作

### Requirement 7: API端点实现

**User Story:** 作为开发者，我需要DELETE API端点来处理项目和图谱的删除请求。

#### Acceptance Criteria

1. THE System SHALL 提供 DELETE /api/projects/[id] 端点用于删除项目
2. THE System SHALL 提供 DELETE /api/graphs/[id] 端点用于删除图谱
3. WHEN 接收到删除请求时，THE System SHALL 验证请求的项目或图谱是否存在
4. WHEN 项目或图谱不存在时，THE System SHALL 返回404错误响应
5. WHEN 删除操作成功时，THE System SHALL 返回200状态码和成功消息
6. WHEN 删除操作失败时，THE System SHALL 返回适当的错误状态码（如500）和错误详情
7. THE System SHALL 在API响应中包含被删除的数据统计（删除的节点数、边数等）

### Requirement 8: 错误处理

**User Story:** 作为用户，我想在删除操作遇到错误时得到清晰的错误信息，以便我了解问题所在。

#### Acceptance Criteria

1. WHEN 网络请求失败时，THE System SHALL 显示网络错误提示
2. WHEN 服务器返回错误时，THE System SHALL 显示服务器错误信息
3. WHEN 数据库操作失败时，THE System SHALL 回滚所有更改并显示错误提示
4. WHEN 删除操作超时时，THE System SHALL 显示超时错误并建议用户重试
5. IF 删除操作部分失败，THEN THE System SHALL 显示详细的失败信息说明哪些数据未能删除

### Requirement 9: 用户体验优化

**User Story:** 作为用户，我想要流畅的删除操作体验，包括合理的视觉反馈和交互设计。

#### Acceptance Criteria

1. THE Delete_Button SHALL 在点击时提供即时的视觉反馈（如按钮状态变化）
2. THE Confirmation_Dialog SHALL 在打开和关闭时使用平滑的动画过渡
3. WHEN 删除操作进行中时，THE System SHALL 禁用所有可能导致冲突的操作
4. THE System SHALL 在删除按钮和选择项目/图谱的点击区域之间提供清晰的分隔，防止误触
5. WHEN 用户快速连续点击删除按钮时，THE System SHALL 防止重复提交删除请求
