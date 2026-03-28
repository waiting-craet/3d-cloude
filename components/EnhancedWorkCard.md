# EnhancedWorkCard 组件

增强型作品卡片组件，用于展示知识图谱作品的详细信息，提供丰富的交互功能和视觉效果。

## 功能特性

### 🎨 视觉设计
- **现代化卡片设计** - 圆角边框、阴影效果、渐变背景
- **响应式布局** - 自适应不同屏幕尺寸和容器宽度
- **主题支持** - 支持浅色和深色主题切换
- **多种尺寸** - 提供小、中、大三种尺寸选项
- **灵活宽高比** - 支持多种图片宽高比设置

### 🖱️ 交互体验
- **悬停效果** - 平滑的缩放和阴影变化动画
- **点击交互** - 支持鼠标点击和键盘导航
- **操作按钮** - 悬停时显示点赞和分享按钮
- **状态反馈** - 点赞状态切换和视觉反馈

### 🏷️ 内容展示
- **作品信息** - 标题、描述、创建者、统计数据
- **标签系统** - 可配置的标签显示和数量限制
- **特色标识** - 特色作品和模板作品的特殊标识
- **类型标签** - 2D/3D 图谱类型标识

### 🖼️ 图片处理
- **懒加载** - 支持图片懒加载优化性能
- **错误处理** - 图片加载失败时显示占位符
- **骨架屏** - 图片加载时的优雅过渡效果
- **自定义占位符** - 可配置的占位符图标

### ♿ 可访问性
- **键盘导航** - 完整的键盘操作支持
- **ARIA 标签** - 正确的语义化标签
- **屏幕阅读器** - 友好的屏幕阅读器支持
- **高对比度** - 支持高对比度模式

## 基础用法

```tsx
import EnhancedWorkCard from '@/components/EnhancedWorkCard'
import { GraphCard } from '@/lib/types/homepage-gallery'

const work: GraphCard = {
  id: '1',
  title: '人工智能知识图谱',
  description: '探索AI领域的核心概念和技术发展',
  thumbnail: 'https://example.com/thumbnail.jpg',
  type: '3d',
  isTemplate: false,
  creator: {
    id: 'user1',
    name: 'AI研究员',
    email: 'ai@example.com',
    avatar: 'https://example.com/avatar.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  likes: 156,
  views: 2340,
  tags: ['人工智能', '机器学习', '深度学习'],
  nodeCount: 45,
  edgeCount: 78
}

function MyComponent() {
  const handleWorkClick = () => {
    console.log('查看作品详情')
  }

  const handleLike = () => {
    console.log('点赞作品')
  }

  const handleShare = () => {
    console.log('分享作品')
  }

  return (
    <EnhancedWorkCard
      work={work}
      onClick={handleWorkClick}
      onLike={handleLike}
      onShare={handleShare}
    />
  )
}
```

## API 参考

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `work` | `GraphCard` | - | **必需** 作品数据对象 |
| `onClick` | `() => void` | - | **必需** 点击卡片的回调函数 |
| `onLike` | `() => void` | - | 可选 点赞按钮的回调函数 |
| `onShare` | `() => void` | - | 可选 分享按钮的回调函数 |
| `featured` | `boolean` | `false` | 是否为特色作品 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 卡片尺寸 |
| `theme` | `'light' \| 'dark'` | `'dark'` | 主题模式 |
| `aspectRatio` | `'auto' \| 'square' \| '4:3' \| '16:9' \| '3:2'` | `'auto'` | 缩略图宽高比 |
| `className` | `string` | `''` | 自定义CSS类名 |
| `showStats` | `boolean` | `true` | 是否显示统计信息 |
| `showTags` | `boolean` | `true` | 是否显示标签 |
| `maxTags` | `number` | `3` | 最大显示标签数量 |
| `lazyLoad` | `boolean` | `true` | 是否启用图片懒加载 |
| `placeholder` | `string` | - | 自定义占位符图标 |

### GraphCard 类型

```tsx
interface GraphCard {
  id: string
  title: string
  description: string
  thumbnail: string
  type: '2d' | '3d'
  isTemplate: boolean
  creator: User
  createdAt: Date
  updatedAt: Date
  likes: number
  views: number
  tags: string[]
  nodeCount: number
  edgeCount: number
}

interface User {
  id: string
  name: string
  email: string
  avatar: string
  createdAt: Date
  updatedAt: Date
}
```

## 使用示例

### 基础卡片

```tsx
<EnhancedWorkCard
  work={work}
  onClick={handleClick}
/>
```

### 特色作品卡片

```tsx
<EnhancedWorkCard
  work={work}
  onClick={handleClick}
  featured={true}
  onLike={handleLike}
  onShare={handleShare}
/>
```

### 自定义主题和尺寸

```tsx
<EnhancedWorkCard
  work={work}
  onClick={handleClick}
  theme="light"
  size="large"
  aspectRatio="16:9"
/>
```

### 限制标签显示

```tsx
<EnhancedWorkCard
  work={work}
  onClick={handleClick}
  showTags={true}
  maxTags={2}
/>
```

### 隐藏统计信息

```tsx
<EnhancedWorkCard
  work={work}
  onClick={handleClick}
  showStats={false}
/>
```

### 自定义占位符

```tsx
<EnhancedWorkCard
  work={workWithoutThumbnail}
  onClick={handleClick}
  placeholder="🔬"
/>
```

## 样式定制

### CSS 变量

组件支持通过 CSS 变量进行样式定制：

```css
.enhancedWorkCard {
  --card-border-radius: 12px;
  --card-padding: 16px;
  --card-gap: 8px;
  --card-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --card-hover-scale: 1.02;
  --card-hover-translate: -4px;
}
```

### 自定义样式

```css
.custom-card {
  border: 2px solid #4A9EFF;
  box-shadow: 0 8px 32px rgba(74, 158, 255, 0.3);
}

.custom-card:hover {
  transform: translateY(-8px) scale(1.05);
}
```

## 响应式设计

组件自动适配不同屏幕尺寸：

- **桌面端** (≥1024px): 完整功能，悬停显示操作按钮
- **平板端** (768px-1023px): 适中尺寸，保持所有功能
- **移动端** (<768px): 紧凑布局，操作按钮始终显示

## 性能优化

### 图片懒加载

```tsx
<EnhancedWorkCard
  work={work}
  onClick={handleClick}
  lazyLoad={true} // 默认启用
/>
```

### 减少重渲染

使用 `React.memo` 和 `useCallback` 优化性能：

```tsx
const MemoizedWorkCard = React.memo(EnhancedWorkCard)

const handleClick = useCallback(() => {
  // 处理点击
}, [])
```

## 可访问性最佳实践

### 键盘导航

- `Tab` - 聚焦到卡片
- `Enter` 或 `Space` - 激活卡片
- `Tab` - 在操作按钮间导航

### 屏幕阅读器

组件提供完整的 ARIA 标签支持：

```tsx
<EnhancedWorkCard
  work={work}
  onClick={handleClick}
  // 自动生成 aria-label="查看作品: {work.title}"
/>
```

### 高对比度模式

组件自动适配系统的高对比度设置。

## 常见问题

### Q: 如何自定义卡片的悬停效果？

A: 可以通过 CSS 覆盖默认样式：

```css
.enhancedWorkCard:hover {
  transform: translateY(-6px) scale(1.03);
  box-shadow: 0 16px 40px rgba(74, 158, 255, 0.25);
}
```

### Q: 如何处理图片加载失败？

A: 组件内置了错误处理机制，会自动显示占位符图标。你也可以自定义占位符：

```tsx
<EnhancedWorkCard
  work={work}
  onClick={handleClick}
  placeholder="🎨"
/>
```

### Q: 如何在网格布局中使用？

A: 推荐与 `ResponsiveWorkGrid` 组件配合使用：

```tsx
<ResponsiveWorkGrid
  works={works}
  loading={false}
  onWorkClick={handleWorkClick}
  onWorkLike={handleLike}
  onWorkShare={handleShare}
/>
```

### Q: 如何实现无限滚动？

A: 可以结合 `react-intersection-observer` 实现：

```tsx
import { useInView } from 'react-intersection-observer'

const { ref, inView } = useInView({
  threshold: 0.1,
  triggerOnce: true
})

useEffect(() => {
  if (inView) {
    loadMoreWorks()
  }
}, [inView])

return (
  <div ref={ref}>
    <EnhancedWorkCard work={work} onClick={handleClick} />
  </div>
)
```

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础卡片展示功能
- 实现悬停效果和动画
- 添加点赞和分享功能
- 支持主题切换和响应式设计
- 实现图片懒加载和错误处理
- 完整的可访问性支持

## 相关组件

- [`ResponsiveWorkGrid`](./ResponsiveWorkGrid.md) - 响应式作品网格容器
- [`EnhancedNavbar`](./EnhancedNavbar.md) - 增强型导航栏组件