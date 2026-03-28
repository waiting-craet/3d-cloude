# Requirements Document

## Introduction

本规范定义了节点详情弹窗中图片显示功能的优化需求。当用户点击三维知识图谱中的节点时，弹出的详情面板应在简介下方显示节点关联的图片（如果存在）。图片数据从数据库的 Node 表中读取，如果节点没有关联图片，则不显示该UI模块。

## Glossary

- **NodeDetailPanel**: 节点详情面板组件，显示节点的详细信息
- **Node**: 数据库中的节点模型，包含节点的所有属性
- **imageUrl**: 节点的图片URL字段，存储在 Vercel Blob 或其他存储服务中
- **videoUrl**: 节点的视频URL字段，存储在 Vercel Blob 或其他存储服务中
- **UI模块**: 用户界面中的一个独立显示区域
- **Modal**: 模态弹窗，用于全屏或放大展示媒体内容
- **MediaViewer**: 媒体查看器，用于放大展示图片或视频的组件

## Requirements

### Requirement 1: 媒体内容显示位置

**User Story:** 作为用户，我希望在节点详情面板的简介下方看到节点的图片或视频，以便更直观地了解节点内容。

#### Acceptance Criteria

1. WHEN 节点详情面板打开时，THE NodeDetailPanel SHALL 在简介字段下方渲染媒体内容显示模块
2. THE 媒体内容显示模块 SHALL 位于简介字段和元信息区域之间
3. THE 媒体内容显示模块 SHALL 保持与其他UI元素一致的视觉风格
4. WHEN 节点同时有图片和视频时，THE NodeDetailPanel SHALL 优先显示视频

### Requirement 2: 条件渲染

**User Story:** 作为用户，我希望只在节点有图片或视频时才看到媒体内容模块，以避免空白区域影响界面美观。

#### Acceptance Criteria

1. WHEN 节点的 imageUrl 或 videoUrl 字段存在且不为空时，THE NodeDetailPanel SHALL 显示媒体内容模块
2. WHEN 节点的 imageUrl 和 videoUrl 字段都为 null 或空字符串时，THE NodeDetailPanel SHALL 完全隐藏媒体内容模块
3. THE 隐藏状态 SHALL 不占用任何布局空间

### Requirement 3: 媒体内容加载与显示

**User Story:** 作为用户，我希望图片和视频能够正确加载并以合适的尺寸显示，以获得良好的视觉体验。

#### Acceptance Criteria

1. WHEN 图片URL有效时，THE NodeDetailPanel SHALL 加载并显示图片
2. WHEN 视频URL有效时，THE NodeDetailPanel SHALL 加载并显示视频播放器
3. THE 图片 SHALL 保持原始宽高比进行缩放
4. THE 视频 SHALL 保持原始宽高比进行缩放
5. THE 图片和视频 SHALL 限制最大高度为 300px
6. THE 图片和视频 SHALL 在容器内居中显示
7. WHEN 图片或视频加载失败时，THE NodeDetailPanel SHALL 显示友好的错误提示或占位符
8. THE 视频播放器 SHALL 显示标准的播放控制按钮

### Requirement 4: 数据读取

**User Story:** 作为系统，我需要从数据库中正确读取节点的图片和视频URL，以便在UI中显示。

#### Acceptance Criteria

1. WHEN 节点被选中时，THE System SHALL 从数据库 Node 表中读取 imageUrl 和 videoUrl 字段
2. THE imageUrl 和 videoUrl 字段 SHALL 包含在节点数据的查询结果中
3. THE System SHALL 将 imageUrl 和 videoUrl 传递给 NodeDetailPanel 组件

### Requirement 5: 视觉设计

**User Story:** 作为用户，我希望媒体内容模块的设计与整体界面风格一致，以获得统一的视觉体验。

#### Acceptance Criteria

1. THE 媒体内容模块 SHALL 使用与其他字段相同的标签样式
2. THE 媒体容器 SHALL 使用圆角边框（8px）
3. THE 媒体容器 SHALL 使用与其他只读字段相同的边框颜色（#e5e7eb）
4. THE 媒体容器 SHALL 使用浅灰色背景（#f9fafb）
5. THE 媒体内容模块 SHALL 与其他字段保持一致的间距（20px margin-bottom）
6. THE 图片和视频 SHALL 显示鼠标悬停效果，提示可点击

### Requirement 6: 图片点击放大功能

**User Story:** 作为用户，我希望点击图片后能够在放大视图中查看完整图片，以便更清晰地查看细节。

#### Acceptance Criteria

1. WHEN 用户点击图片时，THE System SHALL 打开一个模态弹窗显示放大的图片
2. THE 放大视图 SHALL 显示图片的完整尺寸（不超过屏幕尺寸）
3. THE 放大视图 SHALL 保持图片的原始宽高比
4. THE 放大视图 SHALL 有深色半透明背景遮罩
5. THE 放大视图 SHALL 提供关闭按钮
6. WHEN 用户点击背景遮罩时，THE System SHALL 关闭放大视图
7. WHEN 用户按下 ESC 键时，THE System SHALL 关闭放大视图
8. THE 图片 SHALL 在放大视图中居中显示
9. THE 放大视图 SHALL 有平滑的打开和关闭动画效果

### Requirement 7: 视频点击放大播放功能

**User Story:** 作为用户，我希望点击视频后能够在放大视图中播放视频，以便获得更好的观看体验。

#### Acceptance Criteria

1. WHEN 用户点击视频时，THE System SHALL 打开一个模态弹窗显示放大的视频播放器
2. THE 放大视图 SHALL 显示更大尺寸的视频播放器（不超过屏幕尺寸）
3. THE 放大视图 SHALL 保持视频的原始宽高比
4. THE 放大视图 SHALL 有深色半透明背景遮罩
5. THE 放大视图 SHALL 提供关闭按钮
6. WHEN 用户点击背景遮罩时，THE System SHALL 关闭放大视图并暂停视频
7. WHEN 用户按下 ESC 键时，THE System SHALL 关闭放大视图并暂停视频
8. THE 视频播放器 SHALL 在放大视图中居中显示
9. THE 视频播放器 SHALL 显示完整的播放控制按钮
10. THE 放大视图 SHALL 有平滑的打开和关闭动画效果
11. WHEN 放大视图打开时，THE 视频 SHALL 自动开始播放（如果之前未播放）

### Requirement 8: 交互反馈

**User Story:** 作为用户，我希望在与媒体内容交互时获得清晰的视觉反馈，以便了解哪些元素是可交互的。

#### Acceptance Criteria

1. WHEN 鼠标悬停在图片上时，THE System SHALL 显示放大图标或提示
2. WHEN 鼠标悬停在视频上时，THE System SHALL 显示播放图标或提示
3. THE 图片和视频 SHALL 在鼠标悬停时显示轻微的缩放或阴影效果
4. THE 鼠标指针 SHALL 在悬停时变为 pointer 样式
5. THE 放大视图的关闭按钮 SHALL 在鼠标悬停时有视觉反馈
