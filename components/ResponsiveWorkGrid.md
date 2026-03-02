# ResponsiveWorkGrid 组件

一个功能完整的响应式作品网格组件，支持多种布局、主题和交互功能。

## 功能特性

### 🎯 核心功能
- **响应式布局**: 自动适配不同屏幕尺寸（移动端、平板、桌面、宽屏、超宽屏）
- **CSS Grid 布局**: 使用现代 CSS Grid 技术实现灵活的网格系统
- **动态列数**: 根据屏幕宽度和容器大小自动调整列数
- **多种间距**: 支持紧凑、舒适、宽松三种间距模式

### 🎨 视觉效果
- **双主题支持**: 深色和浅色主题
- **悬停动画**: 卡片悬停时的平滑过渡效果
- **多种宽高比**: 支持自动、正方形、4:3、16:9、3:2 等比例
- **特色标识**: 特色作品的特殊边框和标识

### 📱 加载状态
- **骨架屏**: 高保真度的加载占位符
- **旋转器**: 经典的加载指示器
- **脉冲动画**: 优雅的脉冲加载效果
- **闪烁动画**: 现代的闪烁加载效果

### 🔧 错误处理
- **网络状态检测**: 自动检测在线/离线状态
- **错误重试**: 支持手动重试功能
- **友好提示**: 清晰的错误信息和解决建议

### 🎪 交互功能
- **点击事件**: 作品卡片点击处理
- **点赞功能**: 悬停时显示点赞按钮
- **分享功能**: 支持原生分享 API
- **空状态操作**: 自定义空状态行动按钮

## 使用方法

### 基础用法

```tsx
import ResponsiveWorkGrid from '@/components/ResponsiveWorkGrid'
import { GraphCard } from '@/lib/types/homepage-gallery'

const works: GraphCard[] = [
  // 你的作品数据
]

function MyPage() {
  const handleWorkClick = (work: GraphCard) => {
    console.log('点击作品:', work)
  }

  return (
    <ResponsiveWorkGrid
      works={works}
      loading={false}
      onWorkClick={handleWorkClick}
    />
  )
}
```

### 完整配置

```tsx
<ResponsiveWorkGrid
  works={works}
  loading={loading}
  error={error}
  onWorkClick={handleWorkClick}
  onWorkLike={handleWorkLike}
  onWorkShare={handleWorkShare}
  onRetry={handleRetry}
  theme="dark"
  spacing="comfortable"
  alignment="stretch"
  justifyContent="start"
  loadingType="skeleton"
  aspectRatio="4:3"
  gridColumns={{
    mobile: 1,
    tablet: 3,
    desktop: 4,
    wide: 6,
    ultraWide: 8
  }}
  emptyStateConfig={{
    title: '暂无作品',
    description: '还没有找到符合条件的作品',
    icon: '🎨',
    actionText: '创建作品',
    onAction: handleCreateWork
  }}
/>
```

## API 参考

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `works` | `GraphCard[]` | - | 作品数据数组 |
| `loading` | `boolean` | - | 加载状态 |
| `onWorkClick` | `(work: GraphCard) => void` | - | 作品点击回调 |
| `onWorkLike` | `(workId: string) => void` | - | 点赞回调 |
| `onWorkShare` | `(work: GraphCard) => void` | - | 分享回调 |
| `theme` | `'light' \| 'dark'` | `'dark'` | 主题模式 |
| `spacing` | `'compact' \| 'comfortable' \| 'spacious'` | `'comfortable'` | 网格间距 |
| `alignment` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` | 对齐方式 |
| `justifyContent` | `'start' \| 'center' \| 'end' \| 'space-between' \| 'space-around' \| 'space-evenly'` | `'start'` | 内容分布 |
| `loadingType` | `'skeleton' \| 'spinner' \| 'pulse' \| 'shimmer'` | `'skeleton'` | 加载动画类型 |
| `aspectRatio` | `'auto' \| 'square' \| '4:3' \| '16:9' \| '3:2'` | `'auto'` | 卡片宽高比 |
| `error` | `string \| null` | `null` | 错误信息 |
| `onRetry` | `() => void` | - | 重试回调 |
| `gridColumns` | `GridColumnsConfig` | 见下方 | 网格列数配置 |
| `emptyStateConfig` | `EmptyStateConfig` | - | 空状态配置 |

### GridColumnsConfig

```tsx
interface GridColumnsConfig {
  mobile: number      // 移动端列数 (< 768px)
  tablet: number      // 平板端列数 (768px - 1023px)
  desktop: number     // 桌面端列数 (1024px - 1439px)
  wide: number        // 宽屏列数 (1440px - 1919px)
  ultraWide?: number  // 超宽屏列数 (>= 1920px)
}
```

默认值：
```tsx
{
  mobile: 1,
  tablet: 3,
  desktop: 4,
  wide: 6,
  ultraWide: 8
}
```

### EmptyStateConfig

```tsx
interface EmptyStateConfig {
  title?: string           // 空状态标题
  description?: string     // 空状态描述
  icon?: string           // 空状态图标
  actionText?: string     // 操作按钮文本
  onAction?: () => void   // 操作按钮回调
}
```

## 响应式断点

| 断点 | 屏幕宽度 | 默认列数 | 典型设备 |
|------|----------|----------|----------|
| mobile | < 768px | 1 | 手机 |
| tablet | 768px - 1023px | 3 | 平板 |
| desktop | 1024px - 1439px | 4 | 笔记本/桌面 |
| wide | 1440px - 1919px | 6 | 大屏显示器 |
| ultraWide | >= 1920px | 8 | 超宽屏 |

## 主题系统

### 深色主题 (默认)
- 背景色：深灰色调
- 文字：白色/浅灰色
- 卡片：半透明深色背景
- 强调色：蓝色 (#4A9EFF)

### 浅色主题
- 背景色：白色/浅灰色
- 文字：深色
- 卡片：白色背景
- 强调色：蓝色 (#4A9EFF)

## 加载状态

### 骨架屏 (skeleton)
高保真度的内容占位符，模拟真实卡片结构。

### 旋转器 (spinner)
经典的圆形旋转加载指示器。

### 脉冲 (pulse)
三个圆点的脉冲动画效果。

### 闪烁 (shimmer)
现代的闪烁光效加载动画。

## 性能优化

### 虚拟化支持
对于大量数据，建议结合虚拟滚动库使用。

### 图片懒加载
组件内置图片懒加载和错误处理。

### 动画优化
- 使用 CSS transforms 进行动画
- 支持 `prefers-reduced-motion` 媒体查询
- 硬件加速优化

### 内存管理
- 自动清理事件监听器
- 优化重渲染性能

## 可访问性

### 键盘导航
- 支持 Tab 键导航
- 支持 Enter/Space 键激活

### 屏幕阅读器
- 语义化 HTML 结构
- 适当的 ARIA 标签
- 图片 alt 文本

### 高对比度模式
- 支持系统高对比度设置
- 增强边框和焦点指示器

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### CSS Grid 支持
现代浏览器均支持 CSS Grid，对于旧版浏览器会自动降级。

### 容器查询
支持现代浏览器的容器查询特性，提供更精确的响应式控制。

## 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build
```

### 测试

组件包含完整的单元测试：

```bash
# 运行测试
npm test ResponsiveWorkGrid

# 运行测试覆盖率
npm run test:coverage
```

### 自定义样式

组件使用 CSS Modules，可以通过以下方式自定义样式：

```tsx
import styles from './CustomWorkGrid.module.css'

<ResponsiveWorkGrid
  className={styles.customGrid}
  // ... 其他 props
/>
```

## 示例

查看 `components/examples/ResponsiveWorkGridExample.tsx` 获取完整的使用示例。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持响应式网格布局
- 多主题支持
- 完整的加载和错误状态
- 丰富的交互功能

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个组件。

## 许可证

MIT License