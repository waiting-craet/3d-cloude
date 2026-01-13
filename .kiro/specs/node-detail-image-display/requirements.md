# Requirements Document

## Introduction

本规范定义了节点详情弹窗中图片显示功能的优化需求。当用户点击三维知识图谱中的节点时，弹出的详情面板应在简介下方显示节点关联的图片（如果存在）。图片数据从数据库的 Node 表中读取，如果节点没有关联图片，则不显示该UI模块。

## Glossary

- **NodeDetailPanel**: 节点详情面板组件，显示节点的详细信息
- **Node**: 数据库中的节点模型，包含节点的所有属性
- **imageUrl**: 节点的图片URL字段，存储在 Vercel Blob 或其他存储服务中
- **UI模块**: 用户界面中的一个独立显示区域

## Requirements

### Requirement 1: 图片显示位置

**User Story:** 作为用户，我希望在节点详情面板的简介下方看到节点的图片，以便更直观地了解节点内容。

#### Acceptance Criteria

1. WHEN 节点详情面板打开时，THE NodeDetailPanel SHALL 在简介字段下方渲染图片显示模块
2. THE 图片显示模块 SHALL 位于简介字段和元信息区域之间
3. THE 图片显示模块 SHALL 保持与其他UI元素一致的视觉风格

### Requirement 2: 条件渲染

**User Story:** 作为用户，我希望只在节点有图片时才看到图片模块，以避免空白区域影响界面美观。

#### Acceptance Criteria

1. WHEN 节点的 imageUrl 字段存在且不为空时，THE NodeDetailPanel SHALL 显示图片模块
2. WHEN 节点的 imageUrl 字段为 null 或空字符串时，THE NodeDetailPanel SHALL 完全隐藏图片模块
3. THE 隐藏状态 SHALL 不占用任何布局空间

### Requirement 3: 图片加载与显示

**User Story:** 作为用户，我希望图片能够正确加载并以合适的尺寸显示，以获得良好的视觉体验。

#### Acceptance Criteria

1. WHEN 图片URL有效时，THE NodeDetailPanel SHALL 加载并显示图片
2. THE 图片 SHALL 保持原始宽高比进行缩放
3. THE 图片 SHALL 限制最大高度为 300px
4. THE 图片 SHALL 在容器内居中显示
5. WHEN 图片加载失败时，THE NodeDetailPanel SHALL 显示友好的错误提示或占位符

### Requirement 4: 数据读取

**User Story:** 作为系统，我需要从数据库中正确读取节点的图片URL，以便在UI中显示。

#### Acceptance Criteria

1. WHEN 节点被选中时，THE System SHALL 从数据库 Node 表中读取 imageUrl 字段
2. THE imageUrl 字段 SHALL 包含在节点数据的查询结果中
3. THE System SHALL 将 imageUrl 传递给 NodeDetailPanel 组件

### Requirement 5: 视觉设计

**User Story:** 作为用户，我希望图片模块的设计与整体界面风格一致，以获得统一的视觉体验。

#### Acceptance Criteria

1. THE 图片模块 SHALL 使用与其他字段相同的标签样式
2. THE 图片容器 SHALL 使用圆角边框（8px）
3. THE 图片容器 SHALL 使用与其他只读字段相同的边框颜色（#e5e7eb）
4. THE 图片容器 SHALL 使用浅灰色背景（#f9fafb）
5. THE 图片模块 SHALL 与其他字段保持一致的间距（20px margin-bottom）
