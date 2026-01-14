# Requirements Document

## Introduction

当用户在2D工作流编辑器中编辑完知识流后,点击"保存并转换为3D"按钮,数据会被同步到数据库。但是跳转回首页后,导航栏的"现有图谱"下拉框中该项目和图谱消失了,没有显示出来。这是因为保存转换后没有刷新store中的projects列表,导致UI显示的是旧数据。

## Glossary

- **WorkflowCanvas**: 2D工作流编辑器组件,提供节点和连接的可视化编辑
- **saveAndConvert**: WorkflowCanvas中的函数,负责将2D数据同步到数据库并跳转到3D视图
- **GraphStore**: Zustand状态管理store,管理项目、图谱、节点和边的数据
- **TopNavbar**: 顶部导航栏组件,包含项目/图谱下拉选择器
- **Sync_API**: `/api/graphs/[id]/sync` 端点,用于同步2D数据到数据库

## Requirements

### Requirement 1: 保存转换后刷新项目列表

**User Story:** 作为用户,当我在2D编辑器中完成编辑并点击"保存并转换为3D"后,我希望在首页的下拉框中能看到我刚才编辑的项目和图谱,这样我就可以确认保存成功并继续使用。

#### Acceptance Criteria

1. WHEN 用户在2D编辑器中点击"保存并转换为3D"按钮 THEN THE System SHALL 调用Sync_API同步数据到数据库
2. WHEN Sync_API同步成功 THEN THE System SHALL 重新从数据库加载最新的项目列表
3. WHEN 项目列表重新加载完成 THEN THE System SHALL 更新GraphStore中的projects状态
4. WHEN GraphStore状态更新完成 THEN THE System SHALL 跳转到首页
5. WHEN 首页加载完成 THEN THE TopNavbar SHALL 在下拉框中显示刚才编辑的项目和图谱

### Requirement 2: 保持当前图谱选中状态

**User Story:** 作为用户,当我保存并转换后跳转到首页,我希望系统自动选中我刚才编辑的图谱,这样我就可以立即看到转换后的3D效果。

#### Acceptance Criteria

1. WHEN 保存转换成功后 THEN THE GraphStore SHALL 保持currentProject和currentGraph指向刚才编辑的项目和图谱
2. WHEN 跳转到首页后 THEN THE TopNavbar SHALL 在下拉框中高亮显示当前选中的项目和图谱
3. WHEN 首页加载完成 THEN THE KnowledgeGraph SHALL 自动加载并显示当前图谱的3D数据

### Requirement 3: 处理数据同步延迟

**User Story:** 作为用户,即使数据库有轻微的同步延迟,我也希望系统能正确加载最新数据,不会出现数据不一致的情况。

#### Acceptance Criteria

1. WHEN 重新加载项目列表时 THEN THE System SHALL 添加缓存控制头,确保获取最新数据而不是缓存数据
2. WHEN 首次加载未找到最新数据 THEN THE System SHALL 使用重试机制,最多重试3次
3. WHEN 重试时 THEN THE System SHALL 在每次重试之间添加递增的延迟(500ms, 1000ms, 1500ms)
4. WHEN 所有重试都失败 THEN THE System SHALL 使用API响应中的数据构建项目对象,确保UI显示正确

### Requirement 4: 提供用户反馈

**User Story:** 作为用户,在保存转换过程中,我希望看到清晰的进度提示,让我知道系统正在处理我的请求。

#### Acceptance Criteria

1. WHEN 用户点击"保存并转换为3D"按钮 THEN THE System SHALL 显示"正在保存..."的加载状态
2. WHEN 数据同步完成 THEN THE System SHALL 显示"保存成功"的提示消息
3. WHEN 正在刷新项目列表 THEN THE System SHALL 显示"正在加载..."的提示
4. WHEN 发生错误 THEN THE System SHALL 显示具体的错误消息,并保持在当前页面
5. WHEN 所有操作成功完成 THEN THE System SHALL 在跳转前显示"即将跳转..."的提示

### Requirement 5: 错误处理和回滚

**User Story:** 作为用户,如果保存转换过程中出现错误,我希望系统能妥善处理,不会丢失我的编辑内容。

#### Acceptance Criteria

1. WHEN Sync_API调用失败 THEN THE System SHALL 显示错误消息并保持在2D编辑器页面
2. WHEN 刷新项目列表失败 THEN THE System SHALL 显示错误消息但仍然跳转到首页
3. WHEN 任何步骤失败 THEN THE System SHALL 记录详细的错误日志,便于调试
4. WHEN 用户在2D编辑器中 THEN THE System SHALL 保持编辑内容不丢失,即使刷新页面
