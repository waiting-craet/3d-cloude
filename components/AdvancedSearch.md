# AdvancedSearch Component

高级搜索组件，提供搜索建议、自动完成、搜索历史和多条件筛选功能。

## 功能特性

### 🔍 搜索建议和自动完成
- 实时搜索建议显示
- 支持关键词、作者、分类、标签等多种类型建议
- 智能高亮匹配文本
- 键盘导航支持（上下箭头、回车、ESC）
- 防抖优化，避免频繁请求

### 📝 搜索历史记录
- 自动保存搜索历史到本地存储
- 支持历史记录选择和删除
- 显示搜索时间和结果数量
- 支持清空所有历史记录

### ⚙️ 多条件筛选
- 分类筛选（科技、教育、商业等）
- 作者筛选
- 标签筛选
- 排序选项（最新、最热、浏览量、点赞数）
- 筛选条件重置功能

### 🎨 用户体验优化
- 响应式设计，适配移动端
- 平滑动画和过渡效果
- 直观的视觉反馈
- 无障碍访问支持
- 深色模式支持

## 使用方法

### 基础用法

```tsx
import AdvancedSearch from '@/components/AdvancedSearch'

function HomePage() {
  const handleSearch = (filters) => {
    console.log('搜索条件:', filters)
    // 执行搜索逻辑
  }

  return (
    <AdvancedSearch
      onSearch={handleSearch}
      placeholder="搜索知识图谱、作者、标签..."
    />
  )
}
```

### 完整配置

```tsx
import AdvancedSearch from '@/components/AdvancedSearch'

function SearchPage() {
  const handleSearch = (filters) => {
    // 处理搜索
    console.log('搜索条件:', filters)
  }

  const handleSuggestionSelect = (suggestion) => {
    // 处理建议选择
    console.log('选择建议:', suggestion)
  }

  return (
    <AdvancedSearch
      onSearch={handleSearch}
      onSuggestionSelect={handleSuggestionSelect}
      placeholder="搜索知识图谱、作者、标签..."
      className="max-w-4xl mx-auto"
      showFilters={true}
      showHistory={true}
      maxSuggestions={10}
      maxHistory={20}
    />
  )
}
```

## API 接口

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `onSearch` | `(filters: SearchFilters) => void` | - | 搜索回调函数 |
| `onSuggestionSelect` | `(suggestion: SearchSuggestion) => void` | - | 建议选择回调 |
| `placeholder` | `string` | `"搜索知识图谱、作者、标签..."` | 输入框占位符 |
| `className` | `string` | `""` | 自定义样式类 |
| `showFilters` | `boolean` | `true` | 是否显示筛选面板 |
| `showHistory` | `boolean` | `true` | 是否显示搜索历史 |
| `maxSuggestions` | `number` | `8` | 最大建议数量 |
| `maxHistory` | `number` | `10` | 最大历史记录数量 |

### 数据类型

#### SearchFilters
```typescript
interface SearchFilters {
  query: string              // 搜索关键词
  category?: string          // 分类筛选
  author?: string           // 作者筛选
  tags: string[]            // 标签筛选
  sortBy: 'newest' | 'popular' | 'views' | 'likes'  // 排序方式
  sortOrder: 'asc' | 'desc' // 排序顺序
}
```

#### SearchSuggestion
```typescript
interface SearchSuggestion {
  id: string                                    // 唯一标识
  text: string                                 // 建议文本
  type: 'keyword' | 'author' | 'category' | 'tag'  // 建议类型
  count?: number                               // 相关结果数量
  icon?: string                                // 显示图标
}
```

#### SearchHistory
```typescript
interface SearchHistory {
  id: string        // 唯一标识
  query: string     // 搜索查询
  timestamp: Date   // 搜索时间
  results?: number  // 结果数量
}
```

## 样式定制

### CSS 变量
```css
:root {
  --search-border-color: #e5e7eb;
  --search-focus-color: #14b8a6;
  --search-bg-color: #ffffff;
  --search-text-color: #374151;
  --search-placeholder-color: #9ca3af;
}
```

### 自定义样式类
```css
.custom-search {
  /* 自定义搜索框样式 */
}

.custom-search .searchBox {
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.custom-search .searchInput {
  font-size: 16px;
  padding: 16px 24px;
}
```

## 集成示例

### 与现有导航栏集成

```tsx
// 在 EnhancedNavbar 中集成
import AdvancedSearch from './AdvancedSearch'

const EnhancedNavbar = () => {
  const [searchFilters, setSearchFilters] = useState({
    query: '',
    category: '',
    author: '',
    tags: [],
    sortBy: 'newest',
    sortOrder: 'desc'
  })

  const handleSearch = (filters) => {
    setSearchFilters(filters)
    // 执行搜索或导航到搜索结果页
    router.push(`/search?q=${encodeURIComponent(filters.query)}`)
  }

  return (
    <nav className="navbar">
      <div className="navbar-search">
        <AdvancedSearch
          onSearch={handleSearch}
          showFilters={false} // 导航栏中隐藏筛选面板
          maxSuggestions={5}  // 减少建议数量
        />
      </div>
    </nav>
  )
}
```

### 与 HeroSection 集成

```tsx
// 在 HeroSection 中集成
import AdvancedSearch from './AdvancedSearch'

const HeroSection = () => {
  const handleSearch = (filters) => {
    // 滚动到搜索结果区域
    const resultsSection = document.querySelector('#search-results')
    resultsSection?.scrollIntoView({ behavior: 'smooth' })
    
    // 执行搜索
    performSearch(filters)
  }

  return (
    <section className="hero">
      <h1>知识图谱作品广场</h1>
      <p>发现、创建和分享知识的无限可能</p>
      
      <div className="hero-search">
        <AdvancedSearch
          onSearch={handleSearch}
          placeholder="搜索你感兴趣的知识图谱..."
          className="max-w-2xl"
        />
      </div>
    </section>
  )
}
```

## 性能优化

### 防抖处理
- 搜索建议请求使用 300ms 防抖
- 避免频繁的 API 调用
- 提升用户体验和系统性能

### 本地存储
- 搜索历史保存在 localStorage
- 自动清理过期记录
- 支持跨会话保持

### 虚拟滚动
- 大量建议时使用虚拟滚动
- 优化渲染性能
- 减少内存占用

## 无障碍访问

### 键盘导航
- Tab 键切换焦点
- 上下箭头选择建议
- Enter 键确认选择
- ESC 键关闭下拉框

### 屏幕阅读器
- 适当的 ARIA 标签
- 语义化 HTML 结构
- 状态变化通知

### 颜色对比
- 符合 WCAG 2.1 AA 标准
- 高对比度模式支持
- 色盲友好设计

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- 移动端 Safari 和 Chrome

## 更新日志

### v1.0.0
- 初始版本发布
- 基础搜索建议功能
- 搜索历史记录
- 多条件筛选
- 响应式设计

### 计划功能
- 语音搜索支持
- 搜索结果预览
- 智能搜索推荐
- 多语言支持