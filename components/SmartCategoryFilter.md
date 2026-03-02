# SmartCategoryFilter 组件

智能分类筛选器组件，用于提供直观的内容分类和筛选功能。支持键盘导航、动画效果、作品数量显示等高级功能。

## 功能特性

- ✅ **直观的分类筛选**: 提供清晰的分类按钮布局
- ✅ **作品数量显示**: 显示每个分类的作品数量
- ✅ **键盘导航支持**: 完整的键盘导航和可访问性支持
- ✅ **平滑动画效果**: 切换动画和悬停效果
- ✅ **响应式设计**: 适配不同屏幕尺寸
- ✅ **多种样式变体**: 支持不同的视觉风格
- ✅ **加载状态管理**: 优雅的加载状态处理
- ✅ **可访问性优化**: ARIA 标签和屏幕阅读器支持

## 基础用法

```tsx
import SmartCategoryFilter from '@/components/SmartCategoryFilter'

const categories = [
  { id: 'all', name: '全部', icon: '📚' },
  { id: 'tech', name: '科技', icon: '💻', color: '#2196F3' },
  { id: 'education', name: '教育', icon: '🎓', color: '#4CAF50' }
]

const workCount = {
  all: 120,
  tech: 45,
  education: 32
}

function MyComponent() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <SmartCategoryFilter
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      workCount={workCount}
    />
  )
}
```

## API 参考

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `categories` | `Category[]` | - | **必需**。分类列表 |
| `selectedCategory` | `string` | - | **必需**。当前选中的分类 ID |
| `onCategoryChange` | `(category: string) => void` | - | **必需**。分类切换回调函数 |
| `workCount` | `Record<string, number>` | - | **必需**。各分类的作品数量 |
| `loading` | `boolean` | `false` | 是否处于加载状态 |
| `showCount` | `boolean` | `true` | 是否显示作品数量 |
| `animated` | `boolean` | `true` | 是否启用动画效果 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 按钮尺寸 |
| `variant` | `'default' \| 'pills' \| 'tabs'` | `'pills'` | 样式变体 |

### Category 接口

```typescript
interface Category {
  id: string          // 分类唯一标识
  name: string        // 分类显示名称
  icon?: string       // 可选图标
  color?: string      // 可选主题色（十六进制）
}
```

## 样式变体

### Pills（药丸样式）
```tsx
<SmartCategoryFilter variant="pills" {...props} />
```
圆角按钮样式，适合现代化界面。

### Tabs（标签页样式）
```tsx
<SmartCategoryFilter variant="tabs" {...props} />
```
标签页样式，底部有活动指示器。

### Default（默认样式）
```tsx
<SmartCategoryFilter variant="default" {...props} />
```
标准按钮样式，适合传统界面。

## 尺寸选项

### Small（小尺寸）
```tsx
<SmartCategoryFilter size="small" {...props} />
```
紧凑布局，适合空间有限的场景。

### Medium（中等尺寸）
```tsx
<SmartCategoryFilter size="medium" {...props} />
```
标准尺寸，适合大多数场景。

### Large（大尺寸）
```tsx
<SmartCategoryFilter size="large" {...props} />
```
较大按钮，适合触摸设备或强调场景。

## 键盘导航

组件支持完整的键盘导航：

- **方向键（←/→）**: 在分类间导航
- **Home**: 跳转到第一个分类
- **End**: 跳转到最后一个分类
- **Enter/空格**: 选择当前聚焦的分类
- **Tab**: 进入/离开组件

## 可访问性

组件遵循 WCAG 2.1 可访问性标准：

- 使用语义化的 `tablist` 和 `tab` 角色
- 提供适当的 ARIA 属性
- 支持屏幕阅读器
- 键盘导航友好
- 高对比度模式支持
- 减少动画偏好支持

## 响应式设计

组件会根据屏幕尺寸自动调整：

- **桌面端**: 完整布局，所有功能可用
- **平板端**: 调整间距和字体大小
- **移动端**: 紧凑布局，优化触摸交互

## 主题支持

组件支持浅色和深色主题：

```css
/* 浅色主题（默认） */
.categoryButton {
  background: #ffffff;
  color: #666666;
}

/* 深色主题（自动检测） */
@media (prefers-color-scheme: dark) {
  .categoryButton {
    background: #2a2a2a;
    color: #e0e0e0;
  }
}
```

## 自定义样式

### CSS 变量

组件使用 CSS 变量支持主题定制：

```css
.categoryButton {
  --category-color: #00bfa5; /* 主题色 */
}
```

### 自定义类名

可以通过 CSS 模块覆盖样式：

```css
/* 自定义样式 */
.customFilter .categoryButton {
  border-radius: 4px;
  font-weight: 700;
}
```

## 性能优化

- 使用 `React.memo` 优化重渲染
- 事件处理函数使用 `useCallback` 缓存
- CSS 动画使用 `transform` 和 `opacity`
- 支持大量分类的高效渲染

## 最佳实践

### 分类设计
- 保持分类名称简洁明了
- 使用有意义的图标
- 选择合适的主题色
- 避免过多的分类（建议 ≤ 10 个）

### 交互设计
- 提供清晰的视觉反馈
- 保持一致的交互模式
- 考虑加载状态的用户体验
- 确保键盘导航的流畅性

### 性能考虑
- 避免频繁的分类切换
- 合理使用动画效果
- 考虑大数据量的分页处理
- 优化移动端的触摸体验

## 故障排除

### 常见问题

**Q: 分类按钮没有显示图标？**
A: 确保 `Category` 对象包含有效的 `icon` 属性。

**Q: 键盘导航不工作？**
A: 检查组件是否正确获得焦点，确保没有其他元素阻止键盘事件。

**Q: 动画效果不流畅？**
A: 检查 CSS 是否被其他样式覆盖，确保浏览器支持 CSS 动画。

**Q: 响应式布局异常？**
A: 检查父容器的 CSS 样式，确保没有固定宽度限制。

### 调试技巧

1. 使用浏览器开发者工具检查 DOM 结构
2. 查看控制台是否有 JavaScript 错误
3. 检查 CSS 样式是否正确应用
4. 测试不同屏幕尺寸的表现

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础分类筛选功能
- 实现键盘导航
- 添加动画效果
- 支持响应式设计
- 完整的可访问性支持

## 许可证

MIT License