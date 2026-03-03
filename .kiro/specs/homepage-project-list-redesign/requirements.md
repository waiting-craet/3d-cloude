# 需求文档

## 简介

本文档描述首页项目列表区域重新设计功能的需求。该功能旨在优化用户界面，提升视觉体验和数据展示的准确性。主要改进包括：缩小项目卡片面积以展示更多项目、使用统一的项目图标、采用简洁的白色背景、从数据库读取真实项目名称。

## 术语表

- **System**: 首页项目列表系统
- **Project_Card**: 项目卡片组件
- **Project_List**: 项目列表组件
- **API_Route**: API路由处理器
- **Database**: PostgreSQL数据库
- **User**: 访问首页的用户

## 需求

### 需求 1: 项目数据获取

**用户故事:** 作为用户，我希望看到真实的项目列表，以便了解系统中存在的所有项目。

#### 验收标准

1. WHEN 用户访问首页，THE System SHALL 从数据库Project表查询所有项目
2. WHEN 查询成功，THE System SHALL 返回包含项目ID、名称、描述、节点数、边数、创建时间和更新时间的完整数据
3. WHEN 数据库连接失败，THE System SHALL 返回错误信息并显示友好提示
4. THE API_Route SHALL 在500毫秒内响应项目数据请求

### 需求 2: 项目卡片显示

**用户故事:** 作为用户，我希望看到简洁统一的项目卡片，以便快速浏览和识别项目。

#### 验收标准

1. THE Project_Card SHALL 使用统一的项目图标（项目1.png）
2. THE Project_Card SHALL 使用白色背景替代彩色背景
3. THE Project_Card SHALL 显示从数据库读取的项目名称
4. THE Project_Card SHALL 显示项目的节点数和边数统计信息
5. WHEN 项目图标文件缺失，THE System SHALL 显示默认占位符图标

### 需求 3: 卡片尺寸优化

**用户故事:** 作为用户，我希望在首页看到更多项目，以便一次性浏览更多内容。

#### 验收标准

1. THE Project_Card SHALL 使用缩小后的卡片面积
2. THE Project_List SHALL 支持配置每行显示的列数
3. THE Project_List SHALL 支持配置最大显示项目数量
4. WHEN 最大显示数量小于总项目数，THE System SHALL 只显示前N个项目

### 需求 4: 用户交互

**用户故事:** 作为用户，我希望点击项目卡片能够进入项目详情，以便查看和编辑项目内容。

#### 验收标准

1. WHEN 用户点击项目卡片，THE System SHALL 导航到项目编辑页面
2. WHEN 导航发生，THE System SHALL 在URL中包含正确的项目ID参数
3. WHEN 鼠标悬停在卡片上，THE Project_Card SHALL 显示视觉反馈动画
4. THE System SHALL 确保点击事件处理器绑定到所有渲染的卡片

### 需求 5: 加载状态管理

**用户故事:** 作为用户，我希望在数据加载时看到明确的提示，以便了解系统正在工作。

#### 验收标准

1. WHEN 数据正在加载，THE System SHALL 显示加载指示器
2. WHEN 数据加载完成，THE System SHALL 隐藏加载指示器并显示项目列表
3. WHILE 加载状态为真，THE System SHALL 保持项目列表为空
4. THE System SHALL 在2秒内完成首次项目列表渲染

### 需求 6: 错误处理

**用户故事:** 作为用户，我希望在出现错误时看到清晰的提示信息，以便了解问题并采取行动。

#### 验收标准

1. IF API请求失败，THEN THE System SHALL 显示错误提示信息
2. IF 数据库查询失败，THEN THE API_Route SHALL 返回500错误状态码
3. WHEN 错误发生，THE System SHALL 提供重试按钮
4. IF 项目数据缺少必需字段，THEN THE System SHALL 跳过该项目并记录警告日志
5. WHILE 错误状态存在，THE System SHALL 保持项目列表为空

### 需求 7: 数据验证

**用户故事:** 作为系统，我需要验证数据的完整性和有效性，以便确保应用的稳定运行。

#### 验收标准

1. THE System SHALL 验证所有项目具有非空的ID和名称
2. THE System SHALL 验证项目的节点数和边数为非负整数
3. THE System SHALL 验证项目的创建时间不晚于更新时间
4. IF 项目名称长度超过100字符，THEN THE System SHALL 截断显示
5. IF 项目描述长度超过500字符，THEN THE System SHALL 截断存储

### 需求 8: 性能优化

**用户故事:** 作为用户，我希望页面快速加载和响应，以便获得流畅的使用体验。

#### 验收标准

1. THE System SHALL 使用Next.js Image组件优化图标加载
2. WHERE 项目数量超过100，THE System SHALL 实现虚拟滚动
3. THE System SHALL 缓存API响应以减少重复请求
4. THE System SHALL 确保单页面内存占用不超过50MB
5. THE System SHALL 使用WebP格式的图标文件

### 需求 9: 安全性

**用户故事:** 作为系统管理员，我需要确保系统安全，以便保护用户数据和防止恶意攻击。

#### 验收标准

1. THE API_Route SHALL 使用Prisma ORM的参数化查询防止SQL注入
2. THE System SHALL 自动转义所有文本内容防止XSS攻击
3. THE System SHALL 验证和清理所有用户输入
4. THE API_Route SHALL 使用Next.js内置的CSRF保护
5. THE System SHALL 不使用dangerouslySetInnerHTML渲染用户内容

### 需求 10: 数据排序

**用户故事:** 作为用户，我希望看到按时间排序的项目列表，以便优先查看最新的项目。

#### 验收标准

1. THE System SHALL 按创建时间降序排列项目
2. WHEN 显示项目列表，THE System SHALL 确保最新创建的项目显示在最前面
3. FOR ALL 项目对 (i, j)，IF i在j之前，THEN i的创建时间应晚于或等于j的创建时间
