# 创建工作流页面 - 新建功能需求更新

## 介绍

本文档扩展了创建工作流页面的需求，为现有的"新建"按钮添加弹出对话框功能，用于创建项目和图谱。该功能参考 graph 页面的 CreateProjectModal 实现，允许用户创建新项目或在现有项目中添加图谱。

## 术语表

- **System**: 知识图谱创建和管理系统
- **Create_Dialog**: 新建项目/图谱对话框
- **Project**: 项目，是知识图谱的容器
- **Graph**: 知识图谱，属于某个项目
- **Neon_Database**: Neon PostgreSQL 数据库，用于存储项目和图谱数据

## 需求

### 需求 1: 新建按钮交互

**用户故事**: 作为用户，我想点击"新建"按钮打开创建对话框，以便快速创建项目和图谱。

#### 验收标准

1. WHEN 用户点击左侧导航栏的"新建"按钮 THEN THE System SHALL 显示创建对话框
2. THE Create_Dialog SHALL 覆盖整个页面并具有半透明背景
3. THE Create_Dialog SHALL 具有模糊背景效果（backdrop-filter）
4. THE Create_Dialog SHALL 居中显示
5. THE Create_Dialog SHALL 具有淡入动画效果

### 需求 2: 对话框布局和样式

**用户故事**: 作为用户，我想看到美观的对话框界面，以便舒适地创建项目。

#### 验收标准

1. THE Create_Dialog SHALL 使用深色背景（rgba(30, 30, 30, 0.98)）
2. THE Create_Dialog SHALL 具有圆角边框（16px）
3. THE Create_Dialog SHALL 具有阴影效果
4. THE Create_Dialog SHALL 具有细微的边框（rgba(255, 255, 255, 0.1)）
5. THE Create_Dialog SHALL 宽度为 90%，最大宽度为 480px
6. THE Create_Dialog SHALL 具有向上滑动的进入动画

### 需求 3: 对话框标题区域

**用户故事**: 作为用户，我想看到清晰的对话框标题，以便了解当前操作。

#### 验收标准

1. THE Create_Dialog SHALL 在顶部显示"新建知识图谱"标题
2. THE 标题 SHALL 使用 24px 字体大小和 700 字重
3. THE Create_Dialog SHALL 在标题下方显示描述文本
4. THE 描述文本 SHALL 说明"创建新项目或在现有项目中添加图谱"
5. THE 描述文本 SHALL 使用较小的字体和半透明颜色

### 需求 4: 项目类型选择

**用户故事**: 作为用户，我想选择创建新项目或使用现有项目，以便灵活组织我的图谱。

#### 验收标准

1. THE Create_Dialog SHALL 显示两个切换按钮："新建项目"和"选择现有项目"
2. THE 切换按钮 SHALL 横向排列，各占一半宽度
3. WHEN 用户点击"新建项目"按钮 THEN THE System SHALL 高亮该按钮并显示项目名称输入框
4. WHEN 用户点击"选择现有项目"按钮 THEN THE System SHALL 高亮该按钮并显示项目选择下拉框
5. THE 选中的按钮 SHALL 使用蓝色渐变背景
6. THE 未选中的按钮 SHALL 使用半透明白色背景

### 需求 5: 新建项目模式

**用户故事**: 作为用户，我想输入新项目名称，以便创建全新的项目。

#### 验收标准

1. WHEN 用户选择"新建项目"模式 THEN THE System SHALL 显示项目名称输入框
2. THE 项目名称输入框 SHALL 具有"请输入项目名称"占位符
3. THE 项目名称输入框 SHALL 具有自动聚焦功能
4. THE 项目名称输入框 SHALL 使用深色背景和白色文字
5. WHEN 输入框获得焦点 THEN THE System SHALL 显示蓝色边框和更亮的背景
6. WHEN 用户输入文本 THEN THE System SHALL 清除任何错误提示

### 需求 6: 选择现有项目模式

**用户故事**: 作为用户，我想从现有项目中选择，以便在该项目下添加新图谱。

#### 验收标准

1. WHEN 用户选择"选择现有项目"模式 THEN THE System SHALL 显示项目选择下拉框
2. THE 下拉框 SHALL 从数据库加载所有现有项目
3. THE 下拉框 SHALL 默认选中第一个项目
4. WHEN 没有现有项目 THEN THE System SHALL 显示"暂无项目，请先创建新项目"提示
5. THE 下拉框 SHALL 使用深色背景和白色文字
6. WHEN 用户选择项目 THEN THE System SHALL 清除任何错误提示

### 需求 7: 图谱名称输入

**用户故事**: 作为用户，我想输入图谱名称，以便标识新创建的图谱。

#### 验收标准

1. THE Create_Dialog SHALL 显示图谱名称输入框
2. THE 图谱名称输入框 SHALL 具有"请输入知识图谱名称"占位符
3. THE 图谱名称输入框 SHALL 使用深色背景和白色文字
4. WHEN 输入框获得焦点 THEN THE System SHALL 显示蓝色边框和更亮的背景
5. WHEN 用户输入文本 THEN THE System SHALL 清除任何错误提示

### 需求 8: 表单验证

**用户故事**: 作为用户，我想在提交前看到验证错误，以便正确填写表单。

#### 验收标准

1. WHEN 用户提交空图谱名称 THEN THE System SHALL 显示"请输入知识图谱名称"错误
2. WHEN 用户在新建项目模式下提交空项目名称 THEN THE System SHALL 显示"请输入项目名称"错误
3. WHEN 用户在选择项目模式下未选择项目 THEN THE System SHALL 显示"请选择一个项目"错误
4. THE 错误提示 SHALL 显示在表单下方
5. THE 错误提示 SHALL 使用红色背景和红色文字
6. THE 错误提示 SHALL 居中显示

### 需求 9: 数据库操作

**用户故事**: 作为系统，我需要将项目和图谱数据保存到数据库，以便持久化存储。

#### 验收标准

1. WHEN 用户在新建项目模式下提交表单 THEN THE System SHALL 在 Neon 数据库中创建新项目记录
2. WHEN 项目创建成功 THEN THE System SHALL 在该项目下创建新图谱记录
3. WHEN 用户在选择项目模式下提交表单 THEN THE System SHALL 在选中的项目下创建新图谱记录
4. THE System SHALL 为新项目生成唯一的 ID
5. THE System SHALL 为新图谱生成唯一的 ID
6. THE System SHALL 记录创建时间戳
7. WHEN 数据库操作失败 THEN THE System SHALL 显示错误消息并保持对话框打开

### 需求 10: 提交按钮状态

**用户故事**: 作为用户，我想看到提交按钮的状态变化，以便了解操作进度。

#### 验收标准

1. THE Create_Dialog SHALL 显示"取消"和"创建"两个按钮
2. THE 按钮 SHALL 横向排列，各占一半宽度
3. WHEN 用户点击"创建"按钮 THEN THE System SHALL 禁用按钮并显示加载状态
4. WHEN 创建中 THEN THE 按钮文本 SHALL 变为"创建中..."
5. WHEN 创建中 THEN THE 按钮 SHALL 显示旋转的加载图标
6. WHEN 创建中 THEN THE 按钮 SHALL 使用半透明背景
7. WHEN 创建中 THEN THE "取消"按钮 SHALL 也被禁用
8. WHEN 创建成功 THEN THE System SHALL 关闭对话框
9. WHEN 创建失败 THEN THE System SHALL 恢复按钮状态并显示错误

### 需求 11: 对话框关闭

**用户故事**: 作为用户，我想能够关闭对话框，以便取消创建操作。

#### 验收标准

1. WHEN 用户点击"取消"按钮 THEN THE System SHALL 关闭对话框
2. WHEN 用户点击对话框外部区域 THEN THE System SHALL 关闭对话框
3. WHEN 对话框关闭 THEN THE System SHALL 清空所有输入字段
4. WHEN 对话框关闭 THEN THE System SHALL 清除所有错误提示
5. WHEN 创建中 THEN THE System SHALL 阻止用户关闭对话框

### 需求 12: 创建成功后的行为

**用户故事**: 作为用户，我想在创建成功后看到更新的项目列表，以便确认操作成功。

#### 验收标准

1. WHEN 创建成功 THEN THE System SHALL 刷新项目列表
2. WHEN 创建成功 THEN THE System SHALL 在列表中显示新创建的项目
3. WHEN 创建成功 THEN THE System SHALL 关闭对话框
4. WHEN 创建成功 THEN THE System SHALL 重置表单状态
5. THE System SHALL 在项目列表中按更新时间排序显示项目

### 需求 13: 防止重复提交

**用户故事**: 作为系统，我需要防止用户重复提交表单，以便避免创建重复的项目。

#### 验收标准

1. WHEN 用户点击"创建"按钮 THEN THE System SHALL 设置提交中状态
2. WHEN 提交中 THEN THE System SHALL 忽略后续的提交请求
3. WHEN 提交完成（成功或失败）THEN THE System SHALL 清除提交中状态
4. THE System SHALL 在提交中时禁用所有表单控件

### 需求 14: 加载现有项目

**用户故事**: 作为用户，我想在对话框打开时自动加载现有项目列表，以便快速选择。

#### 验收标准

1. WHEN 对话框打开 THEN THE System SHALL 从数据库加载所有项目
2. WHEN 项目加载完成 THEN THE System SHALL 填充项目下拉框
3. WHEN 项目加载失败 THEN THE System SHALL 显示错误提示
4. THE System SHALL 在加载时显示加载指示器
5. WHEN 项目列表为空 THEN THE System SHALL 自动切换到"新建项目"模式
