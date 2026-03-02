# HeroSection 组件

HeroSection 是一个现代化的英雄区域组件，用于创建引人注目的页面顶部区域。它支持多种背景类型、主题、动画效果和响应式设计。

## 功能特性

- ✨ **多种背景类型**: 支持渐变、图案、纯色和图片背景
- 🌓 **双主题支持**: 浅色和深色主题
- 📱 **响应式设计**: 完美适配各种屏幕尺寸
- 🎭 **动画效果**: 优雅的进入动画和交互效果
- 🔍 **集成搜索**: 内置搜索栏功能
- 🎯 **行动号召**: 主要和次要操作按钮
- ♿ **无障碍支持**: 支持键盘导航和屏幕阅读器
- 🎨 **高度可定制**: 丰富的配置选项

## 基础使用

```tsx
import HeroSection from '@/components/HeroSection'

function HomePage() {
  return (
    <HeroSection
      title="知识图谱作品广场"
      subtitle="发现、创建和分享知识的无限可能"
    />
  )
}
```

## API 参考

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `title` | `string` | `"知识图谱作品广场"` | 主标题文本 |
| `subtitle` | `string` | `"发现、创建和分享知识的无限可能"` | 副标题文本 |
| `primaryAction` | `ActionConfig` | 默认创作按钮 | 主要操作按钮配置 |
| `secondaryAction` | `ActionConfig` | 默认浏览按钮 | 次要操作按钮配置 |
| `searchQuery` | `string` | `""` | 搜索查询文本 |
| `onSearchChange` | `(query: string) => void` | - | 搜索文本变化回调 |
| `onSearchSubmit` | `() => void` | - | 搜索提交回调 |
| `backgroundType` | `'gradient' \| 'image' \| 'pattern' \| 'solid'` | `'gradient'` | 背景类型 |
| `backgroundImage` | `string` | - | 背景图片URL（仅当backgroundType为'image'时有效） |
| `theme` | `'light' \| 'dark'` | `'light'` | 主题模式 |
| `className` | `string` | `""` | 自定义CSS类名 |
| `showSearch` | `boolean` | `true` | 是否显示搜索栏 |
| `animated` | `boolean` | `true` | 是否启用动画效果 |

### ActionConfig

```tsx
interface ActionConfig {
  text: string           // 按钮文本
  onClick: () => void    // 点击回调
  disabled?: boolean     // 是否禁用（仅主要按钮支持）
}
```

## 使用示例

### 1. 基础配置

```tsx
<HeroSection />
```

### 2. 自定义内容

```tsx
<HeroSection
  title="欢迎来到我们的平台"
  subtitle="这里是副标题描述"
  primaryAction={{
    text: "立即开始",
    onClick: () => router.push('/start')
  }}
  secondaryAction={{
    text: "了解更多",
    onClick: () => scrollToSection('about')
  }}
/>
```

### 3. 搜索功能

```tsx
const [searchQuery, setSearchQuery] = useState('')

<HeroSection
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  onSearchSubmit={() => handleSearch(searchQuery)}
  showSearch={true}
/>
```

### 4. 深色主题

```tsx
<HeroSection
  theme="dark"
  backgroundType="gradient"
/>
```

### 5. 图片背景

```tsx
<HeroSection
  backgroundType="image"
  backgroundImage="/images/hero-background.jpg"
  theme="dark"
/>
```

### 6. 禁用动画

```tsx
<HeroSection
  animated={false}
/>
```

### 7. 完整配置示例

```tsx
const HeroExample = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const { isLoggedIn } = useUserStore()
  const router = useRouter()

  return (
    <HeroSection
      title="知识图谱作品广场"
      subtitle="发现、创建和分享知识的无限可能"
      primaryAction={{
        text: "开始创作",
        onClick: () => {
          if (!isLoggedIn) {
            alert('请先登录')
            return
          }
          router.push('/creation')
        },
        disabled: !isLoggedIn
      }}
      secondaryAction={{
        text: "浏览作品",
        onClick: () => {
          document.querySelector('[data-works-section]')
            ?.scrollIntoView({ behavior: 'smooth' })
        }
      }}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSearchSubmit={() => {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      }}
      backgroundType="gradient"
      theme="light"
      showSearch={true}
      animated={true}
      className="custom-hero"
    />
  )
}
```

## 样式定制

### CSS 变量

组件支持通过 CSS 变量进行样式定制：

```css
.custom-hero {
  --hero-primary-color: #your-color;
  --hero-secondary-color: #your-color;
  --hero-accent-color: #your-color;
}
```

### 自定义样式

```css
/* 自定义标题样式 */
.custom-hero .hero-title {
  font-family: 'Your Custom Font';
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

/* 自定义按钮样式 */
.custom-hero .primary-button {
  background: linear-gradient(135deg, #your-color1, #your-color2);
}
```

## 响应式断点

| 断点 | 屏幕宽度 | 特性 |
|------|----------|------|
| 移动端 | ≤ 480px | 垂直按钮布局，较小字体 |
| 平板端 | 481px - 768px | 适中间距，隐藏浮动元素 |
| 桌面端 | ≥ 769px | 完整功能，所有动画效果 |

## 无障碍支持

- ✅ 键盘导航支持
- ✅ ARIA 标签
- ✅ 屏幕阅读器兼容
- ✅ 高对比度模式支持
- ✅ 减少动画模式支持

## 性能优化

- 🚀 CSS 模块化，避免样式冲突
- 🚀 条件渲染，减少不必要的DOM
- 🚀 优化的动画，使用 transform 和 opacity
- 🚀 响应式图片支持
- 🚀 懒加载背景图片

## 浏览器兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ 移动端浏览器

## 注意事项

1. **背景图片**: 使用 `backgroundType="image"` 时，确保图片已优化且支持响应式
2. **动画性能**: 在低性能设备上可以设置 `animated={false}` 来禁用动画
3. **搜索功能**: 需要自行实现搜索逻辑和结果处理
4. **用户认证**: 主要按钮的禁用状态需要根据实际的用户登录状态来设置

## 相关组件

- `EnhancedNavbar` - 增强型导航栏
- `ResponsiveWorkGrid` - 响应式作品网格
- `EnhancedWorkCard` - 增强型作品卡片

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础功能和样式
- 响应式设计
- 动画效果
- 双主题支持