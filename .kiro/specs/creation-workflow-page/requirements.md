# 创建工作流页面 - 需求文档

## 介绍

用户从首页点击"开始创作"按钮后，跳转到创建工作流页面。该页面采用现代化设计，左侧为白色竖状导航栏（占页面宽度1/6），右侧为主内容区域（占页面宽度5/6），提供快速创建和项目管理功能。

## 术语表

- **System**: 知识图谱创建和管理系统
- **Navigation_Bar**: 页面左侧竖状导航栏，宽度占页面1/6
- **Main_Content_Area**: 页面右侧主内容区域，宽度占页面5/6
- **Action_Cards**: 右侧页面顶部的横向功能卡片
- **Filter_Bar**: 项目列表上方的筛选控制栏

## 需求

### 需求 1: 左侧导航栏布局

**用户故事**: 作为用户，我想看到清晰的左侧导航栏，以便快速访问不同的创建功能。

#### 验收标准

1. THE Navigation_Bar SHALL 显示在页面最左侧
2. THE Navigation_Bar SHALL 占据页面宽度的1/6
3. THE Navigation_Bar SHALL 采用白色背景
4. THE Navigation_Bar SHALL 在页面滚动时保持固定位置
5. THE Navigation_Bar SHALL 包含标题、新建按钮、导入按钮和AI创建按钮

### 需求 2: 导航栏标题

**用户故事**: 作为用户，我想在导航栏顶部看到"3DGraph"标题，以便识别应用。

#### 验收标准

1. THE Navigation_Bar SHALL 在最上方显示"3DGraph"文本
2. THE 标题文本 SHALL 使用加粗字体
3. THE 标题 SHALL 具有适当的上边距和下边距
4. THE 标题 SHALL 使用深色文字以确保可读性

### 需求 3: 新建按钮

**用户故事**: 作为用户，我想点击新建按钮快速创建新项目。

#### 验收标准

1. THE 新建按钮 SHALL 显示在标题下方
2. THE 新建按钮 SHALL 使用蓝色背景
3. THE 新建按钮 SHALL 显示"新建"文本
4. THE 新建按钮 SHALL 具有悬停效果
5. WHEN 用户点击新建按钮 THEN THE System SHALL 打开新建项目对话框

### 需求 4: 导入按钮

**用户故事**: 作为用户，我想点击导入按钮导入现有数据。

#### 验收标准

1. THE 导入按钮 SHALL 显示在新建按钮下方
2. THE 导入按钮 SHALL 使用白色背景
3. THE 导入按钮 SHALL 没有边框
4. THE 导入按钮 SHALL 显示"导入"文本
5. THE 导入按钮 SHALL 具有悬停效果
6. WHEN 用户点击导入按钮 THEN THE System SHALL 打开文件导入对话框

### 需求 5: AI创建按钮

**用户故事**: 作为用户，我想点击AI创建按钮使用AI辅助创建功能。

#### 验收标准

1. THE AI创建按钮 SHALL 显示在导入按钮下方
2. THE AI创建按钮 SHALL 使用紫色背景
3. THE AI创建按钮 SHALL 显示"AI创建"文本
4. THE AI创建按钮 SHALL 具有悬停效果
5. WHEN 用户点击AI创建按钮 THEN THE System SHALL 显示AI创建选项

### 需求 6: 右侧搜索框

**用户故事**: 作为用户，我想在右上角使用搜索框快速查找项目。

#### 验收标准

1. THE 搜索框 SHALL 显示在Main_Content_Area的右上角
2. THE 搜索框 SHALL 具有占位符文本提示用户输入
3. THE 搜索框 SHALL 具有搜索图标
4. WHEN 用户输入搜索文本 THEN THE System SHALL 过滤显示的项目

### 需求 7: 功能卡片

**用户故事**: 作为用户，我想看到醒目的功能卡片，以便快速访问主要功能。

#### 验收标准

1. THE Action_Cards SHALL 显示在搜索框下方
2. THE Action_Cards SHALL 包含两个卡片："AI创建"和"导入数据"
3. THE Action_Cards SHALL 横向排布
4. THE Action_Cards SHALL 使用鲜艳的不同颜色
5. THE Action_Cards SHALL 大小适中
6. THE Action_Cards SHALL 具有悬停效果
7. WHEN 用户点击卡片 THEN THE System SHALL 执行相应的功能

### 需求 8: 项目筛选栏

**用户故事**: 作为用户，我想使用筛选栏来组织和查看我的项目。

#### 验收标准

1. THE Filter_Bar SHALL 显示在Action_Cards下方
2. THE Filter_Bar SHALL 宽度适中，长度占右侧页面的全部宽度
3. THE Filter_Bar SHALL 使用白色背景，无边框
4. THE Filter_Bar SHALL 在左侧显示"我的项目"文本
5. THE Filter_Bar SHALL 在右侧显示两个下拉筛选框
6. THE 第一个下拉框 SHALL 默认显示"全部类型"
7. THE 第二个下拉框 SHALL 默认显示"更新时间"
8. WHEN 用户点击第二个下拉框 THEN THE System SHALL 显示"标题"选项

### 需求 9: 页面整体布局

**用户故事**: 作为用户，我想看到清晰的页面布局，便于使用。

#### 验收标准

1. THE 页面 SHALL 左侧为Navigation_Bar（1/6宽度），右侧为Main_Content_Area（5/6宽度）
2. THE 页面 SHALL 采用白色主题
3. THE 页面 SHALL 具有适当的间距和对齐
4. THE 页面 SHALL 响应式设计，适应不同屏幕尺寸

### 需求 10: 首页导航集成

**用户故事**: 作为用户，我想从首页点击"开始创作"按钮进入创建工作流页面。

#### 验收标准

1. WHEN 用户在首页点击"开始创作"按钮 THEN THE System SHALL 导航到创建工作流页面
2. THE 页面导航 SHALL 平滑过渡
3. THE 创建工作流页面 SHALL 正确加载所有组件
