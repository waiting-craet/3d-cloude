# 首页广场设计文档

## 概述

首页广场是知识图谱平台的核心入口页面，采用现代化的网格布局展示社区优秀作品。页面包含一个功能完整的导航栏、灵活的筛选系统和响应式设计，为用户提供流畅的浏览和发现体验。

## 架构

### 页面结构

```
┌─────────────────────────────────────────────────────────┐
│                    导航栏 (TopNavbar)                     │
│  Logo | 搜索框 | 开始创作 | 社区 | 通知 | 主题 | 帮助 | 账户 │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    筛选栏 (FilterBar)                     │
│  [3D图谱] [2D图谱] [热门模板] [清除筛选]                  │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                  广场内容区 (GalleryGrid)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ 图谱卡片 │  │ 图谱卡片 │  │ 图谱卡片 │  │ 图谱卡片 │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ 图谱卡片 │  │ 图谱卡片 │  │ 图谱卡片 │  │ 图谱卡片 │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

- **前端框架**: Next.js 13+ (App Router)
- **UI 库**: React 18+
- **样式**: Tailwind CSS
- **状态管理**: React Context / Zustand
- **数据获取**: React Query / SWR
- **动画**: Framer Motion
- **图标**: Lucide React

## 组件和接口

### 1. TopNavbar 组件

**职责**: 渲染顶部导航栏，包含所有导航功能

**Props**:
```typescript
interface TopNavbarProps {
  currentUser?: User;
  onCreateClick: () => void;
  onCommunityClick: () => void;
  onSearchSubmit: (query: string) => void;
  onThemeToggle: () => void;
  currentTheme: 'light' | 'dark';
  unreadNotifications: number;
}
```

**子组件**:
- SearchBar - 搜索输入框和建议下拉菜单
- NotificationBell - 通知铃铛和下拉列表
- UserMenu - 用户账户菜单
- ThemeToggle - 主题切换按钮
- HelpMenu - 帮助菜单

### 2. FilterBar 组件

**职责**: 渲染筛选栏，管理筛选状态

**Props**:
```typescript
interface FilterBarProps {
  activeFilters: FilterType[];
  onFilterChange: (filters: FilterType[]) => void;
  onClearFilters: () => void;
}

type FilterType = '3d' | '2d' | 'template';
```

**功能**:
- 多选筛选（可同时选择多个类型）
- 清除所有筛选
- 筛选状态持久化到 URL 查询参数

### 3. GalleryGrid 组件

**职责**: 渲染图谱卡片网格

**Props**:
```typescript
interface GalleryGridProps {
  graphs: GraphCard[];
  isLoading: boolean;
  onGraphClick: (graphId: string) => void;
  filters: FilterType[];
}

interface GraphCard {
  id: string;
  title: string;
  thumbnail: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: Date;
  likes: number;
  type: '2d' | '3d';
  isTemplate: boolean;
  description: string;
}
```

**功能**:
- 响应式网格布局（桌面 4 列，平板 2-3 列，手机 1 列）
- 加载状态显示
- 无结果提示
- 虚拟滚动优化性能（可选）

### 4. GraphCard 组件

**职责**: 渲染单个图谱卡片

**Props**:
```typescript
interface GraphCardProps {
  graph: GraphCard;
  onClick: () => void;
}
```

**UI 元素**:
- 缩略图（带类型标签：3D/2D/模板）
- 标题
- 创建者信息（头像 + 名称）
- 创建时间
- 点赞数
- 悬停效果（放大、阴影增强）

### 5. SearchBar 组件

**职责**: 搜索输入和实时建议

**Props**:
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
}

interface SearchSuggestion {
  id: string;
  type: 'graph' | 'user' | 'tag';
  title: string;
  icon: string;
}
```

**功能**:
- 实时搜索建议（防抖 300ms）
- 支持搜索图谱、用户、标签
- 键盘导航（上下箭头、Enter 确认）
- 点击建议直接跳转

### 6. NotificationPanel 组件

**职责**: 显示通知列表

**Props**:
```typescript
interface NotificationPanelProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  actor: User;
  targetGraph?: GraphCard;
  message: string;
  createdAt: Date;
  isRead: boolean;
}
```

**功能**:
- 显示最近 10 条通知
- 未读通知高亮
- 标记全部已读
- 点击通知跳转到相关页面

### 7. UserMenu 组件

**职责**: 用户账户菜单

**Props**:
```typescript
interface UserMenuProps {
  user: User;
  onMyWorksClick: () => void;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
}
```

**菜单项**:
- 我的作品
- 账户设置
- 退出登录

## 数据模型

### User 模型
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### GraphCard 模型
```typescript
interface GraphCard {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  type: '2d' | '3d';
  isTemplate: boolean;
  creator: User;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  views: number;
  tags: string[];
}
```

### Notification 模型
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  actor: User;
  targetGraphId?: string;
  targetUserId?: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}
```

## 页面流程

### 首页加载流程

```
1. 用户访问首页
   ↓
2. 检查用户登录状态
   ├─ 已登录: 加载用户信息和通知
   └─ 未登录: 显示登录提示
   ↓
3. 加载图谱列表（默认最新）
   ↓
4. 渲染导航栏、筛选栏、广场内容
   ↓
5. 监听筛选变化，更新图谱列表
```

### 筛选流程

```
用户选择筛选条件
   ↓
更新 URL 查询参数
   ↓
触发数据重新获取
   ↓
显示加载状态
   ↓
渲染筛选后的图谱列表
```

### 搜索流程

```
用户输入搜索关键词
   ↓
防抖 300ms
   ↓
调用搜索 API 获取建议
   ↓
显示建议下拉菜单
   ↓
用户选择建议或按 Enter
   ↓
跳转到搜索结果页面或图谱详情页
```

## 错误处理

### 加载失败
- 显示错误提示信息
- 提供重试按钮
- 记录错误日志

### 网络超时
- 显示超时提示
- 自动重试（最多 3 次）
- 提供手动重试选项

### 无结果
- 显示"暂无相关内容"提示
- 建议清除筛选条件
- 显示热门图谱推荐

## 性能优化

### 图片优化
- 使用 Next.js Image 组件
- 缩略图压缩和懒加载
- WebP 格式支持

### 数据获取优化
- 分页加载（每页 20 条）
- 虚拟滚动（可选）
- 缓存策略（SWR 默认缓存）

### 渲染优化
- React.memo 包装卡片组件
- 使用 useCallback 优化事件处理
- 代码分割（动态导入模态框等）

## 响应式设计

### 断点
- 手机: < 640px (1 列)
- 平板: 640px - 1024px (2-3 列)
- 桌面: > 1024px (4 列)

### 导航栏适配
- 手机: 汉堡菜单 + 侧边栏
- 平板: 简化导航 + 搜索框
- 桌面: 完整导航栏

### 筛选栏适配
- 手机: 竖向排列 + 下拉菜单
- 平板及以上: 横向排列

## 正确性属性

一个属性是一个特征或行为，应该在系统的所有有效执行中保持真实——本质上是关于系统应该做什么的形式化陈述。属性充当人类可读规范和机器可验证的正确性保证之间的桥梁。

### 属性 1: 3D 筛选一致性

**对于任何** 图谱列表和 3D 筛选条件，返回的所有图谱的 type 字段应该都等于 '3d'。

**验证**: 需求 2.2

### 属性 2: 2D 筛选一致性

**对于任何** 图谱列表和 2D 筛选条件，返回的所有图谱的 type 字段应该都等于 '2d'。

**验证**: 需求 2.3

### 属性 3: 模板筛选一致性

**对于任何** 图谱列表和模板筛选条件，返回的所有图谱的 isTemplate 字段应该都为 true。

**验证**: 需求 2.4

### 属性 4: 多条件筛选组合

**对于任何** 图谱列表和多个筛选条件的组合，返回的图谱应该同时满足所有筛选条件。

**验证**: 需求 2.5

### 属性 5: 筛选清除幂等性

**对于任何** 筛选状态，清除筛选后再清除一次应该产生相同的结果（都返回所有图谱）。

**验证**: 需求 2.6

**数学表达**: `clearFilters(clearFilters(state)) == clearFilters(state)`

### 属性 6: 搜索建议准确性

**对于任何** 搜索关键词，返回的所有建议的标题都应该包含该关键词（不区分大小写）。

**验证**: 需求 6.2

### 属性 7: 通知未读徽章准确性

**对于任何** 通知列表，未读徽章显示的数字应该等于列表中 isRead 为 false 的通知数量。

**验证**: 需求 7.2

### 属性 8: 标记全部已读

**对于任何** 通知列表，点击"标记全部已读"后，所有通知的 isRead 字段应该都为 true。

**验证**: 需求 7.6

### 属性 9: 主题切换持久化

**对于任何** 主题选择（'light' 或 'dark'），切换后保存到 localStorage，刷新页面后应该恢复相同的主题。

**验证**: 需求 8.3, 8.4

**往返属性**: `loadTheme(saveTheme(theme)) == theme`

### 属性 10: 卡片信息完整性

**对于任何** 图谱卡片，渲染的 HTML 应该包含标题、创建者名称、创建时间和点赞数这四个必需字段。

**验证**: 需求 1.3

### 属性 11: 默认排序一致性

**对于任何** 图谱列表，默认加载时应该按 createdAt 字段倒序排列（最新的在前）。

**验证**: 需求 1.2

### 属性 12: 响应式列数一致性

**对于任何** 屏幕宽度，图谱卡片网格应该按以下规则排列：
- 宽度 < 640px: 1 列
- 宽度 640px - 1024px: 2-3 列
- 宽度 > 1024px: 4 列

**验证**: 需求 10.1, 10.3

### 属性 13: 汉堡菜单响应式显示

**对于任何** 屏幕宽度小于 768px 的设备，导航栏应该显示汉堡菜单而不是完整导航栏。

**验证**: 需求 10.2

### 属性 14: 用户菜单完整性

**对于任何** 已登录用户，点击头像/用户名后显示的菜单应该包含"我的作品"、"账户设置"、"退出登录"这三个选项。

**验证**: 需求 5.3

### 属性 15: 帮助菜单完整性

**对于任何** 用户，点击帮助图标后显示的菜单应该包含"快速入门"、"文档"、"常见问题"、"联系支持"这四个选项。

**验证**: 需求 9.3

## 测试策略

### 单元测试

**FilterBar 组件**:
- 测试筛选条件的添加和移除
- 测试清除所有筛选
- 测试 URL 查询参数的更新

**GraphCard 组件**:
- 测试卡片信息的正确显示
- 测试点击事件
- 测试悬停效果

**SearchBar 组件**:
- 测试搜索建议的获取
- 测试防抖功能
- 测试键盘导航

**UserMenu 组件**:
- 测试菜单项的显示
- 测试点击事件
- 测试登录/未登录状态

### 属性测试

**属性 1: 筛选一致性**
- 生成随机筛选条件
- 验证返回的图谱都匹配筛选条件

**属性 2: 筛选清除幂等性**
- 应用筛选，清除，再清除
- 验证两次清除的结果相同

**属性 3: 搜索建议准确性**
- 生成随机搜索关键词
- 验证所有建议都包含关键词

**属性 4: 通知未读状态一致性**
- 生成随机通知列表
- 标记通知为已读
- 验证未读数减少

**属性 5: 主题切换持久化**
- 切换主题
- 模拟页面刷新
- 验证主题保持不变

**属性 6: 卡片信息完整性**
- 生成随机图谱卡片
- 验证所有必需信息都显示

**属性 7: 登录状态导航**
- 模拟未登录用户
- 点击"开始创作"
- 验证显示登录模态框

**属性 8: 响应式布局一致性**
- 模拟不同屏幕宽度
- 验证卡片列数正确

### 集成测试

- 完整的首页加载流程
- 筛选和搜索的交互
- 用户菜单的操作
- 通知系统的交互

## 部署考虑

### 环境变量
```
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_SEARCH_API_URL=https://search.example.com
```

### API 端点
- `GET /api/graphs` - 获取图谱列表
- `GET /api/graphs/search` - 搜索图谱
- `GET /api/users/search` - 搜索用户
- `GET /api/notifications` - 获取通知
- `POST /api/notifications/:id/read` - 标记通知为已读

### 缓存策略
- 图谱列表: 5 分钟
- 搜索建议: 1 分钟
- 通知: 实时（WebSocket）

## 安全考虑

- 搜索输入验证和清理
- 防止 XSS 攻击
- CSRF 保护
- 速率限制（搜索 API）
- 用户隐私保护（不显示敏感信息）
