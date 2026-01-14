# Requirements Document

## Introduction

在三维知识图谱页面新建项目和图谱后，导航栏的"现有图谱"下拉框没有显示新建的项目和图谱。这是因为创建操作后没有重新从数据库加载最新的项目列表。本需求旨在修复这个数据刷新问题。

## Glossary

- **TopNavbar**: 顶部导航栏组件，包含项目/图谱下拉选择器
- **CreateProjectModal**: 创建项目/图谱的弹窗组件
- **GraphStore**: Zustand 状态管理 store，管理项目、图谱、节点和边的数据
- **Projects_API**: `/api/projects/with-graphs` 端点，返回所有项目及其关联的图谱列表

## Requirements

### Requirement 1: 创建项目后刷新下拉框

**User Story:** 作为管理员，当我创建新项目和图谱后，我希望在"现有图谱"下拉框中立即看到新建的内容，这样我就可以确认创建成功并快速切换到新图谱。

#### Acceptance Criteria

1. WHEN 管理员成功创建新项目和图谱 THEN THE TopNavbar SHALL 从 Projects_API 重新加载项目列表
2. WHEN 项目列表重新加载完成 THEN THE TopNavbar SHALL 在下拉框中显示新创建的项目和图谱
3. WHEN 创建操作完成 THEN THE GraphStore SHALL 自动切换到新创建的图谱
4. WHEN 下拉框数据更新后 THEN THE TopNavbar SHALL 保持下拉框的展开状态，以便用户查看新内容

### Requirement 2: 添加图谱到现有项目后刷新下拉框

**User Story:** 作为管理员，当我在现有项目中添加新图谱后，我希望在"现有图谱"下拉框中立即看到新图谱，这样我就可以确认添加成功。

#### Acceptance Criteria

1. WHEN 管理员在现有项目中成功添加新图谱 THEN THE TopNavbar SHALL 从 Projects_API 重新加载项目列表
2. WHEN 项目列表重新加载完成 THEN THE TopNavbar SHALL 在对应项目下显示新添加的图谱
3. WHEN 添加操作完成 THEN THE GraphStore SHALL 自动切换到新添加的图谱
4. WHEN 下拉框数据更新后 THEN THE TopNavbar SHALL 展开对应的项目，显示新添加的图谱

### Requirement 3: 保持 UI 状态一致性

**User Story:** 作为管理员，当我创建或添加图谱后，我希望界面状态保持一致，不会出现数据不同步的情况。

#### Acceptance Criteria

1. WHEN 创建或添加图谱操作完成 THEN THE GraphStore SHALL 确保本地状态与数据库状态一致
2. WHEN 重新加载项目列表 THEN THE TopNavbar SHALL 保留当前选中的项目和图谱（如果它们仍然存在）
3. WHEN 数据刷新失败 THEN THE System SHALL 显示错误提示并保持当前状态不变
4. WHEN 用户关闭创建弹窗 THEN THE TopNavbar SHALL 清理所有临时状态
