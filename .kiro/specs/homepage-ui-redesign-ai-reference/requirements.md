# 需求文档

## 介绍

本功能旨在将首页完全重新设计，一比一复刻提供的设计图。新设计采用简约风格的中文知识图谱界面，包含顶部导航栏、主标题区域、搜索功能、统计数据展示和功能图标按钮。

## 术语表

- **Homepage**: 应用程序的首页组件
- **Navbar**: 顶部导航栏组件
- **Hero_Section**: 主标题和副标题展示区域
- **Search_Bar**: 搜索输入框组件
- **Statistics_Display**: 统计数据展示组件
- **Action_Button**: 可点击的操作按钮（登录、开始创作等）
- **Icon_Button**: 带图标的圆形按钮（分享、图谱、设置）

## 需求

### 需求 1: 顶部导航栏

**用户故事:** 作为用户，我希望看到清晰的顶部导航栏，以便快速访问登录和创作功能。

#### 验收标准

1. THE Navbar SHALL display "知识图谱" logo on the left side
2. THE Navbar SHALL display "登录" button on the right side
3. THE Navbar SHALL display "开始创作" button on the right side next to "登录" button
4. THE Navbar SHALL use a clean, minimal design with appropriate spacing
5. THE Navbar SHALL maintain consistent height across all viewport widths

### 需求 2: 主标题区域

**用户故事:** 作为用户，我希望看到引人注目的主标题和副标题，以便理解平台的核心价值。

#### 验收标准

1. THE Hero_Section SHALL display "构建与发现知识的无尽脉络" as the main title
2. THE Hero_Section SHALL display "在这里，编织零散的碎片，洞见事物背后的关联。用图谱的力量，重新组织你的知识宇宙。" as the subtitle
3. THE Hero_Section SHALL center-align both title and subtitle
4. THE Hero_Section SHALL use appropriate font sizes with title larger than subtitle
5. THE Hero_Section SHALL maintain proper vertical spacing between title and subtitle

### 需求 3: 搜索功能

**用户故事:** 作为用户，我希望使用搜索框查找内容，以便快速定位感兴趣的知识图谱。

#### 验收标准

1. THE Search_Bar SHALL display a search input field with placeholder text
2. THE Search_Bar SHALL display a search icon on the left side of the input
3. THE Search_Bar SHALL display an arrow button on the right side of the input
4. WHEN the user clicks the arrow button, THE Search_Bar SHALL trigger a search action
5. THE Search_Bar SHALL be horizontally centered on the page
6. THE Search_Bar SHALL have rounded corners and appropriate padding

### 需求 4: 统计数据展示

**用户故事:** 作为用户，我希望看到平台的统计数据，以便了解平台的活跃度和规模。

#### 验收标准

1. THE Statistics_Display SHALL show "2.4千 公开图谱项目" statistic
2. THE Statistics_Display SHALL show "15 M+ 连接的节点" statistic
3. THE Statistics_Display SHALL show "8,600 活跃创作者" statistic
4. THE Statistics_Display SHALL arrange statistics horizontally with equal spacing
5. THE Statistics_Display SHALL center-align all statistics on the page
6. THE Statistics_Display SHALL use consistent typography for all statistics

### 需求 5: 功能图标按钮

**用户故事:** 作为用户，我希望通过图标按钮快速访问常用功能，以便提高操作效率。

#### 验收标准

1. THE Homepage SHALL display three Icon_Button components on the right side
2. THE Homepage SHALL display a share icon button
3. THE Homepage SHALL display a graph icon button
4. THE Homepage SHALL display a settings icon button
5. THE Icon_Button SHALL be circular with consistent size
6. THE Icon_Button SHALL arrange vertically with appropriate spacing
7. WHEN the user hovers over an Icon_Button, THE Icon_Button SHALL provide visual feedback

### 需求 6: 响应式布局

**用户故事:** 作为用户，我希望在不同设备上都能正常浏览首页，以便在任何场景下使用平台。

#### 验收标准

1. WHEN the viewport width is less than 768px, THE Homepage SHALL adjust layout for mobile devices
2. WHEN the viewport width is less than 768px, THE Statistics_Display SHALL stack statistics vertically
3. WHEN the viewport width is less than 768px, THE Icon_Button components SHALL remain accessible
4. THE Homepage SHALL maintain readability across all viewport sizes
5. THE Homepage SHALL prevent horizontal scrolling on small screens

### 需求 7: 视觉一致性

**用户故事:** 作为用户，我希望首页的视觉效果与设计图完全一致，以便获得预期的用户体验。

#### 验收标准

1. THE Homepage SHALL match the design reference for all color values
2. THE Homepage SHALL match the design reference for all font sizes
3. THE Homepage SHALL match the design reference for all spacing values
4. THE Homepage SHALL match the design reference for all border radius values
5. THE Homepage SHALL match the design reference for all component positions
6. THE Homepage SHALL use the same icon styles as shown in the design reference
