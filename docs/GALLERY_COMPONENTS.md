# 首页广场组件文档

## 目录

1. [GalleryTopNavbar](#gallerytopnavbar)
2. [FilterBar](#filterbar)
3. [GalleryGrid](#gallerygrid)
4. [GraphCard](#graphcard)
5. [SearchBar](#searchbar)
6. [NotificationBell](#notificationbell)
7. [ThemeToggle](#themetoggle)
8. [UserMenu](#usermenu)
9. [HelpMenu](#helpmenu)

---

## GalleryTopNavbar

首页顶部导航栏组件，包含搜索、按钮、通知、主题切换等功能。

### Props

```typescript
interface GalleryTopNavbarProps {
  currentTheme?: 'light' | 'dark'      // 当前主题
  onThemeToggle?: () => void            // 主题切换回调
  onCreateClick?: () => void            // 开始创作按钮回调
  onCommunityClick?: () => void         // 社区按钮回调
}
```

### 功能

- ✅ 响应式设计（移动/平板/桌面）
- ✅ 搜索功能
- ✅ 通知系统
- ✅ 主题切换
- ✅ 用户菜单
- ✅ 帮助菜单
- ✅ 移动菜单（汉堡菜单）

### 使用示例

```typescript
import GalleryTopNavbar from '@/components/GalleryTopNavbar'

export default function Page() {
  return (
    <GalleryTopNavbar
      currentTheme="dark"
      onThemeToggle={() => console.log('切换主题')}
      onCreateClick={() => console.log('开始创作')}
      onCommunityClick={() => console.log('进入社区')}
    />
  )
}
```

### 响应式断点

- **移动**: < 768px（显示汉堡菜单）
- **平板**: 768px - 1024px（显示汉堡菜单）
- **桌面**: > 1024px（显示完整导航）

---

## FilterBar

筛选栏组件，支持 3D、2D 和模板筛选。

### Props

```typescript
interface FilterBarProps {
  activeFilters: FilterType[]           // 当前活跃的筛选条件
  onFilterChange: (filters: FilterType[]) => void  // 筛选条件变化回调
  theme?: 'light' | 'dark'              // 主题
}

type FilterType = '3d' | '2d' | 'template'
```

### 功能

- ✅ 单个筛选条件选择
- ✅ 多条件组合筛选
- ✅ 清除所有筛选
- ✅ URL 查询参数同步
- ✅ 响应式设计

### 使用示例

```typescript
import FilterBar from '@/components/gallery/FilterBar'
import { useState } from 'react'

export default function Page() {
  const [filters, setFilters] = useState<FilterType[]>([])

  return (
    <FilterBar
      activeFilters={filters}
      onFilterChange={setFilters}
      theme="dark"
    />
  )
}
```

### 筛选类型

| 类型 | 描述 |
|------|------|
| `3d` | 3D 图谱 |
| `2d` | 2D 图谱 |
| `template` | 模板 |

---

## GalleryGrid

图谱网格组件，显示图谱卡片列表。

### Props

```typescript
interface GalleryGridProps {
  filters?: FilterType[]                // 筛选条件
  theme?: 'light' | 'dark'              // 主题
}
```

### 功能

- ✅ 响应式网格布局
- ✅ 分页支持
- ✅ 加载状态显示
- ✅ 错误处理
- ✅ 无结果提示
- ✅ 结果统计

### 使用示例

```typescript
import GalleryGrid from '@/components/gallery/GalleryGrid'

export default function Page() {
  return (
    <GalleryGrid
      filters={['3d']}
      theme="dark"
    />
  )
}
```

### 响应式列数

| 屏幕宽度 | 列数 |
|---------|------|
| < 640px | 1 列 |
| 640-1024px | 2-3 列 |
| > 1024px | 4 列 |

---

## GraphCard

单个图谱卡片组件。

### Props

```typescript
interface GraphCardProps {
  graph: GraphCard                      // 图谱数据
  onClick?: (graphId: string) => void   // 点击回调
  theme?: 'light' | 'dark'              // 主题
}

interface GraphCard {
  id: string
  title: string
  description: string
  type: '3d' | '2d'
  isTemplate: boolean
  thumbnail: string
  creator: {
    id: string
    name: string
    avatar: string
  }
  stats: {
    nodes: number
    edges: number
    views: number
    likes: number
  }
  createdAt: string
}
```

### 功能

- ✅ 缩略图显示
- ✅ 类型徽章
- ✅ 模板徽章
- ✅ 创建者信息
- ✅ 统计信息
- ✅ 悬停效果
- ✅ 点击导航

### 使用示例

```typescript
import GraphCard from '@/components/gallery/GraphCard'

export default function Page() {
  const graph = {
    id: '1',
    title: 'Python 学习路线',
    description: '完整的 Python 学习指南',
    type: '3d',
    isTemplate: false,
    thumbnail: 'https://...',
    creator: {
      id: 'user-1',
      name: '张三',
      avatar: 'https://...'
    },
    stats: {
      nodes: 50,
      edges: 120,
      views: 1000,
      likes: 50
    },
    createdAt: '2024-02-11T10:00:00Z'
  }

  return (
    <GraphCard
      graph={graph}
      onClick={(id) => console.log('点击:', id)}
      theme="dark"
    />
  )
}
```

---

## SearchBar

搜索栏组件，支持搜索建议。

### Props

```typescript
interface SearchBarProps {
  onSearch?: (query: string) => void    // 搜索回调
  onSuggestionClick?: (suggestion: SearchSuggestion) => void  // 建议点击回调
  theme?: 'light' | 'dark'              // 主题
}
```

### 功能

- ✅ 实时搜索
- ✅ 防抖处理（300ms）
- ✅ 搜索建议
- ✅ 键盘导航
- ✅ 清除功能

### 使用示例

```typescript
import SearchBar from '@/components/gallery/SearchBar'

export default function Page() {
  return (
    <SearchBar
      onSearch={(query) => console.log('搜索:', query)}
      onSuggestionClick={(suggestion) => console.log('选择:', suggestion)}
      theme="dark"
    />
  )
}
```

---

## NotificationBell

通知铃铛组件，显示未读通知数量。

### Props

```typescript
interface NotificationBellProps {
  theme?: 'light' | 'dark'              // 主题
}
```

### 功能

- ✅ 未读通知徽章
- ✅ 通知列表下拉菜单
- ✅ 标记全部已读
- ✅ 通知项点击

### 使用示例

```typescript
import NotificationBell from '@/components/gallery/NotificationBell'

export default function Page() {
  return <NotificationBell theme="dark" />
}
```

---

## ThemeToggle

主题切换组件。

### Props

```typescript
interface ThemeToggleProps {
  currentTheme?: 'light' | 'dark'       // 当前主题
  onToggle?: () => void                 // 切换回调
}
```

### 功能

- ✅ 浅色/深色主题切换
- ✅ localStorage 持久化
- ✅ 视觉反馈

### 使用示例

```typescript
import ThemeToggle from '@/components/gallery/ThemeToggle'

export default function Page() {
  return (
    <ThemeToggle
      currentTheme="dark"
      onToggle={() => console.log('切换主题')}
    />
  )
}
```

---

## UserMenu

用户菜单组件。

### Props

```typescript
interface UserMenuProps {
  isLoggedIn: boolean                   // 是否已登录
  currentUser?: {
    name: string
    avatar?: string
  }
  theme?: 'light' | 'dark'              // 主题
}
```

### 功能

- ✅ 登录/未登录状态
- ✅ 用户信息显示
- ✅ 菜单项导航
- ✅ 登出功能

### 使用示例

```typescript
import UserMenu from '@/components/gallery/UserMenu'

export default function Page() {
  return (
    <UserMenu
      isLoggedIn={true}
      currentUser={{ name: '张三' }}
      theme="dark"
    />
  )
}
```

---

## HelpMenu

帮助菜单组件。

### Props

```typescript
interface HelpMenuProps {
  theme?: 'light' | 'dark'              // 主题
}
```

### 功能

- ✅ 快速开始
- ✅ 文档链接
- ✅ FAQ
- ✅ 支持联系

### 使用示例

```typescript
import HelpMenu from '@/components/gallery/HelpMenu'

export default function Page() {
  return <HelpMenu theme="dark" />
}
```

---

## 主题系统

所有组件都支持浅色和深色主题。

### 主题颜色

**深色主题**:
- 背景: `rgba(20, 20, 20, 0.95)`
- 文字: `#ffffff`
- 边框: `rgba(255, 255, 255, 0.1)`
- 强调色: `#4A9EFF`

**浅色主题**:
- 背景: `rgba(255, 255, 255, 0.95)`
- 文字: `#000000`
- 边框: `rgba(0, 0, 0, 0.1)`
- 强调色: `#4A9EFF`

---

## 最佳实践

1. **使用 Props 控制主题**: 通过 Props 传递主题，而不是硬编码
2. **处理加载状态**: 始终显示加载指示器
3. **错误处理**: 显示用户友好的错误消息
4. **响应式设计**: 测试所有屏幕尺寸
5. **性能优化**: 使用 SWR 缓存减少 API 调用
6. **无障碍性**: 确保键盘导航和屏幕阅读器支持

---

## 常见问题

### Q: 如何自定义主题颜色？

A: 修改组件中的 `themeConfig` 对象，或通过 CSS 变量覆盖。

### Q: 如何处理 API 错误？

A: 所有 hooks 都返回 `error` 属性，检查该属性并显示错误消息。

### Q: 如何优化性能？

A: 使用 SWR 的缓存机制，避免不必要的重新渲染，使用 React.memo 包装组件。

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2024-02-11 | 初始版本 |

