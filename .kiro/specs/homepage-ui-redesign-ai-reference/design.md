# 设计文档

## 概述

本设计文档描述了首页UI重新设计功能的技术实现方案。该功能旨在创建一个完全符合设计参考图的简约中文知识图谱界面，包含顶部导航栏、主标题区域、搜索功能、统计数据展示和功能图标按钮。

### 设计目标

1. 一比一复刻设计参考图的视觉效果
2. 保持与现有 Paper 设计系统的一致性
3. 确保响应式布局在所有设备上正常工作
4. 提供流畅的用户交互体验
5. 遵循可访问性最佳实践

### 技术栈

- React 18+ (Next.js App Router)
- TypeScript
- CSS Modules
- 现有的 Paper 设计系统组件

## 架构

### 组件层次结构

```
HomePage (app/page.tsx)
├── Navbar (components/PaperNavbar.tsx) - 已存在，需要验证
├── HeroSection (components/PaperHeroSection.tsx) - 已存在，需要验证
│   ├── Title
│   ├── Subtitle
│   └── SearchBar
├── StatisticsDisplay (components/StatisticsDisplay.tsx) - 已存在
└── IconButtonGroup (新组件)
    ├── ShareButton
    ├── GraphButton
    └── SettingsButton
```

### 数据流

```mermaid
graph TD
    A[HomePage] --> B[用户交互]
    B --> C{交互类型}
    C -->|点击登录| D[打开登录模态框]
    C -->|点击开始创作| E[导航到创作页面]
    C -->|搜索输入| F[触发搜索处理]
    C -->|点击图标按钮| G[执行对应操作]
    D --> H[LoginModal]
    E --> I[/creation 路由]
    F --> J[搜索结果处理]
    G --> K[分享/图谱/设置功能]
```

### 状态管理

使用 React 本地状态和现有的 Zustand store：

- `isLoginModalOpen`: 控制登录模态框显示
- `isLoggedIn`: 用户登录状态（来自 useUserStore）
- `searchQuery`: 搜索输入值（如果实现搜索功能）

## 组件和接口

### 1. HomePage 组件

主页面组件，整合所有子组件。

```typescript
// app/page.tsx
export default function HomePage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { isLoggedIn, logout, initializeFromStorage } = useUserStore()

  const handleLogin = () => setIsLoginModalOpen(true)
  const handleLogout = () => logout()
  const handleStartCreating = () => {
    if (!isLoggedIn) {
      alert('请先登录后再开始创作')
      setIsLoginModalOpen(true)
      return
    }
    router.push('/creation')
  }
  const handleSearch = (query: string) => {
    // TODO: 实现搜索功能
    console.log('Search query:', query)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAF8' }}>
      <PaperNavbar
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onStartCreating={handleStartCreating}
      />
      
      <div style={{ paddingTop: '64px' }}>
        <PaperHeroSection
          title="构建与发现知识的无尽脉络"
          subtitle="在这里，编织零散的碎片，洞见事物背后的关联。用图谱的力量，重新组织你的知识宇宙。"
          onSearch={handleSearch}
        />
        
        <StatisticsDisplay
          statistics={[
            { value: '2.4千', label: '公开图谱项目' },
            { value: '15 M+', label: '连接的节点' },
            { value: '8,600', label: '活跃创作者' }
          ]}
        />
        
        <IconButtonGroup />
      </div>
      
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </main>
  )
}
```

### 2. PaperNavbar 组件（已存在）

顶部导航栏组件，需要验证是否符合设计要求。

**接口：**
```typescript
interface PaperNavbarProps {
  isLoggedIn: boolean
  onLogin: () => void
  onLogout: () => void
  onStartCreating: () => void
}
```

**设计要求验证：**
- ✓ 左侧显示 "知识图谱" logo
- ✓ 右侧显示 "登录" 按钮
- ✓ 右侧显示 "开始创作" 按钮
- ✓ 简洁的设计和适当的间距
- ✓ 固定高度（64px）

### 3. PaperHeroSection 组件（已存在）

主标题和副标题展示区域，需要验证文本内容。

**接口：**
```typescript
interface PaperHeroSectionProps {
  title: string
  subtitle: string
  onSearch: (query: string) => void
}
```

**设计要求验证：**
- 需要更新 title 为："构建与发现知识的无尽脉络"
- 需要更新 subtitle 为："在这里，编织零散的碎片，洞见事物背后的关联。用图谱的力量，重新组织你的知识宇宙。"
- ✓ 居中对齐
- ✓ 标题字体大于副标题
- ✓ 适当的垂直间距

### 4. StatisticsDisplay 组件（已存在）

统计数据展示组件。

**接口：**
```typescript
interface Statistic {
  value: string
  label: string
}

interface StatisticsDisplayProps {
  statistics: Statistic[]
}
```

**设计要求：**
- 显示三个统计数据
- 水平排列，等间距
- 居中对齐
- 一致的排版

**样式规范：**
```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 60px;
  padding: 40px 24px;
}

.statistic {
  text-align: center;
}

.value {
  font-size: 32px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 8px;
}

.label {
  font-size: 14px;
  color: #666666;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
    gap: 32px;
  }
}
```

### 5. IconButtonGroup 组件（新组件）

功能图标按钮组，包含分享、图谱、设置三个按钮。

**接口：**
```typescript
interface IconButtonGroupProps {
  onShare?: () => void
  onGraph?: () => void
  onSettings?: () => void
}
```

**组件实现：**
```typescript
export default function IconButtonGroup({
  onShare,
  onGraph,
  onSettings
}: IconButtonGroupProps) {
  return (
    <div className={styles.container}>
      <button
        className={styles.iconButton}
        onClick={onShare}
        aria-label="分享"
        title="分享"
      >
        <ShareIcon />
      </button>
      
      <button
        className={styles.iconButton}
        onClick={onGraph}
        aria-label="图谱"
        title="图谱"
      >
        <GraphIcon />
      </button>
      
      <button
        className={styles.iconButton}
        onClick={onSettings}
        aria-label="设置"
        title="设置"
      >
        <SettingsIcon />
      </button>
    </div>
  )
}
```

**样式规范：**
```css
.container {
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 50;
}

.iconButton {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 1px solid #E8E8E6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.iconButton:hover {
  background: #6b8e85;
  border-color: #6b8e85;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(107, 142, 133, 0.3);
}

.iconButton:hover svg {
  color: #FFFFFF;
}

.iconButton svg {
  width: 20px;
  height: 20px;
  color: #666666;
  transition: color 0.3s;
}

@media (max-width: 768px) {
  .container {
    right: 16px;
    gap: 12px;
  }
  
  .iconButton {
    width: 40px;
    height: 40px;
  }
  
  .iconButton svg {
    width: 18px;
    height: 18px;
  }
}
```

## 数据模型

### 统计数据模型

```typescript
interface Statistic {
  value: string      // 统计数值（如 "2.4千"）
  label: string      // 统计标签（如 "公开图谱项目"）
}

interface StatisticsData {
  projectsCount: string
  nodesCount: string
  creatorsCount: string
}
```

### 用户状态模型（来自现有 userStore）

```typescript
interface UserState {
  user: User | null
  isLoggedIn: boolean
  login: (user: User) => void
  logout: () => void
  initializeFromStorage: () => void
}
```


## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性反思

在分析验收标准后，我识别出以下可测试的属性。为了避免冗余，我将相关的属性合并：

**合并决策：**
1. 需求 7 的所有视觉一致性属性（7.1-7.6）可以合并为一个综合属性，测试所有设计规范的符合性
2. 响应式布局属性（6.1, 6.2, 6.3, 6.5）可以合并为一个综合的响应式行为属性
3. 图标按钮的属性（5.5, 5.6, 5.7）可以合并为一个综合的图标按钮行为属性
4. 统计数据的布局属性（4.4, 4.5, 4.6）可以合并为一个综合的统计显示属性

### 属性 1: 导航栏高度一致性

*对于任何*视口宽度，导航栏的高度应该保持一致（64px）

**验证需求: 1.5**

### 属性 2: 主标题区域文本对齐

*对于任何*视口宽度，主标题和副标题应该居中对齐

**验证需求: 2.3**

### 属性 3: 标题字体大小层次

*对于任何*渲染状态，主标题的字体大小应该大于副标题的字体大小

**验证需求: 2.4**

### 属性 4: 标题间距存在性

*对于任何*渲染状态，主标题和副标题之间应该有垂直间距

**验证需求: 2.5**

### 属性 5: 搜索按钮交互

*对于任何*搜索输入状态，当用户点击搜索按钮时，应该触发搜索回调函数

**验证需求: 3.4**

### 属性 6: 搜索框居中对齐

*对于任何*视口宽度，搜索框应该在页面上水平居中

**验证需求: 3.5**

### 属性 7: 搜索框样式属性

*对于任何*渲染状态，搜索框应该有圆角（border-radius > 0）和内边距（padding > 0）

**验证需求: 3.6**

### 属性 8: 统计数据显示布局

*对于任何*桌面视口宽度（≥768px），统计数据应该水平排列、居中对齐，并使用一致的排版样式

**验证需求: 4.4, 4.5, 4.6**

### 属性 9: 图标按钮一致性

*对于所有*图标按钮，它们应该是圆形的（border-radius: 50%）、具有相同的尺寸、垂直排列，并在悬停时提供视觉反馈

**验证需求: 5.5, 5.6, 5.7**

### 属性 10: 响应式布局行为

*对于任何*视口宽度小于768px的情况，页面应该调整为移动布局（统计数据垂直堆叠、图标按钮保持可访问、无水平滚动）

**验证需求: 6.1, 6.2, 6.3, 6.5**

### 属性 11: 设计规范符合性

*对于所有*页面元素，它们的颜色、字体大小、间距、圆角、位置和图标样式应该匹配设计参考规范

**验证需求: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

## 错误处理

### 用户交互错误

1. **未登录用户尝试创作**
   - 检测：用户点击"开始创作"但 `isLoggedIn === false`
   - 处理：显示提示信息并打开登录模态框
   - 用户反馈：Alert 提示 "请先登录后再开始创作"

2. **搜索功能未实现**
   - 检测：用户输入搜索查询
   - 处理：记录到控制台（开发阶段）
   - 用户反馈：暂无（待实现）

3. **图标按钮功能未实现**
   - 检测：用户点击分享/图谱/设置按钮
   - 处理：记录到控制台或显示"功能开发中"提示
   - 用户反馈：可选的 Toast 通知

### 组件渲染错误

1. **组件加载失败**
   - 检测：React Error Boundary
   - 处理：显示降级UI或错误消息
   - 用户反馈：友好的错误提示

2. **样式加载失败**
   - 检测：CSS Module 导入失败
   - 处理：使用内联样式作为后备
   - 用户反馈：功能正常但样式可能不完整

### 响应式布局错误

1. **视口尺寸检测失败**
   - 检测：`window.innerWidth` 不可用
   - 处理：使用默认桌面布局
   - 用户反馈：布局可能不是最优但仍可用

2. **媒体查询不支持**
   - 检测：旧浏览器不支持 CSS 媒体查询
   - 处理：提供基础的桌面布局
   - 用户反馈：建议升级浏览器

## 测试策略

### 双重测试方法

本功能将采用单元测试和基于属性的测试相结合的方法：

- **单元测试**：验证特定示例、边缘情况和错误条件
- **基于属性的测试**：验证跨所有输入的通用属性
- 两者互补，共同提供全面的覆盖

### 单元测试

单元测试专注于：
- 特定的UI元素存在性（例如：导航栏显示"知识图谱"）
- 特定的文本内容（例如：主标题显示正确的文本）
- 特定的用户交互（例如：点击登录按钮打开模态框）
- 边缘情况（例如：未登录用户点击"开始创作"）

**测试框架**：Jest + React Testing Library

**示例测试：**

```typescript
// components/__tests__/HomePage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import HomePage from '@/app/page'

describe('HomePage', () => {
  it('should display the correct main title', () => {
    render(<HomePage />)
    expect(screen.getByText('构建与发现知识的无尽脉络')).toBeInTheDocument()
  })

  it('should display the correct subtitle', () => {
    render(<HomePage />)
    expect(screen.getByText(/在这里，编织零散的碎片/)).toBeInTheDocument()
  })

  it('should display three statistics', () => {
    render(<HomePage />)
    expect(screen.getByText('2.4千')).toBeInTheDocument()
    expect(screen.getByText('15 M+')).toBeInTheDocument()
    expect(screen.getByText('8,600')).toBeInTheDocument()
  })

  it('should display three icon buttons', () => {
    render(<HomePage />)
    const buttons = screen.getAllByRole('button', { name: /分享|图谱|设置/ })
    expect(buttons).toHaveLength(3)
  })

  it('should open login modal when clicking login button', () => {
    render(<HomePage />)
    const loginButton = screen.getByText('登录')
    fireEvent.click(loginButton)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should prompt login when unauthenticated user clicks start creating', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
    render(<HomePage />)
    const createButton = screen.getByText('开始创作')
    fireEvent.click(createButton)
    expect(alertSpy).toHaveBeenCalledWith('请先登录后再开始创作')
    alertSpy.mockRestore()
  })
})
```

### 基于属性的测试

基于属性的测试专注于：
- 跨不同视口宽度的响应式行为
- 所有图标按钮的一致性
- 所有统计项的一致性
- 设计规范的符合性

**测试框架**：fast-check (JavaScript 的基于属性测试库)

**配置**：每个属性测试最少运行 100 次迭代

**标签格式**：Feature: homepage-ui-redesign-ai-reference, Property {number}: {property_text}

**示例测试：**

```typescript
// components/__tests__/HomePage.property.test.tsx
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import HomePage from '@/app/page'

describe('HomePage Property Tests', () => {
  // Feature: homepage-ui-redesign-ai-reference, Property 1: Navbar height consistency
  it('should maintain consistent navbar height across all viewport widths', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 2560 }), // viewport width
        (viewportWidth) => {
          // Set viewport width
          global.innerWidth = viewportWidth
          window.dispatchEvent(new Event('resize'))
          
          const { container } = render(<HomePage />)
          const navbar = container.querySelector('nav')
          
          expect(navbar).toBeTruthy()
          const height = navbar!.getBoundingClientRect().height
          expect(height).toBe(64)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: homepage-ui-redesign-ai-reference, Property 8: Statistics display layout
  it('should arrange statistics horizontally with consistent typography on desktop', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 768, max: 2560 }), // desktop viewport width
        (viewportWidth) => {
          global.innerWidth = viewportWidth
          window.dispatchEvent(new Event('resize'))
          
          const { container } = render(<HomePage />)
          const statistics = container.querySelectorAll('[data-testid="statistic"]')
          
          expect(statistics.length).toBe(3)
          
          // Check horizontal arrangement
          const positions = Array.from(statistics).map(s => 
            s.getBoundingClientRect().top
          )
          expect(new Set(positions).size).toBe(1) // All at same vertical position
          
          // Check consistent typography
          const fontSizes = Array.from(statistics).map(s => 
            window.getComputedStyle(s).fontSize
          )
          expect(new Set(fontSizes).size).toBe(1) // All same font size
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: homepage-ui-redesign-ai-reference, Property 9: Icon button consistency
  it('should render all icon buttons with consistent circular shape and size', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('share', 'graph', 'settings'),
        (buttonType) => {
          const { container } = render(<HomePage />)
          const button = container.querySelector(`[aria-label="${buttonType}"]`)
          
          expect(button).toBeTruthy()
          const styles = window.getComputedStyle(button!)
          
          // Check circular shape
          expect(styles.borderRadius).toBe('50%')
          
          // Check consistent size
          const width = parseInt(styles.width)
          const height = parseInt(styles.height)
          expect(width).toBe(height)
          expect(width).toBe(48)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: homepage-ui-redesign-ai-reference, Property 10: Responsive layout behavior
  it('should adjust to mobile layout when viewport is less than 768px', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 767 }), // mobile viewport width
        (viewportWidth) => {
          global.innerWidth = viewportWidth
          window.dispatchEvent(new Event('resize'))
          
          const { container } = render(<HomePage />)
          
          // Check statistics stack vertically
          const statistics = container.querySelectorAll('[data-testid="statistic"]')
          const positions = Array.from(statistics).map(s => 
            s.getBoundingClientRect().top
          )
          expect(new Set(positions).size).toBe(3) // All at different vertical positions
          
          // Check no horizontal scroll
          expect(document.body.scrollWidth).toBeLessThanOrEqual(viewportWidth)
          
          // Check icon buttons remain accessible
          const iconButtons = container.querySelectorAll('[data-testid="icon-button"]')
          iconButtons.forEach(button => {
            const rect = button.getBoundingClientRect()
            expect(rect.width).toBeGreaterThan(0)
            expect(rect.height).toBeGreaterThan(0)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: homepage-ui-redesign-ai-reference, Property 11: Design specification compliance
  it('should match design reference for colors, fonts, spacing, and borders', () => {
    const { container } = render(<HomePage />)
    
    // Check navbar background color
    const navbar = container.querySelector('nav')
    expect(window.getComputedStyle(navbar!).backgroundColor).toBe('rgb(250, 250, 248)')
    
    // Check primary button color
    const primaryButton = container.querySelector('[data-testid="primary-button"]')
    expect(window.getComputedStyle(primaryButton!).backgroundColor).toBe('rgb(107, 142, 133)')
    
    // Check title font size
    const title = container.querySelector('h1')
    expect(window.getComputedStyle(title!).fontSize).toBe('42px')
    
    // Check search bar border radius
    const searchInput = container.querySelector('input[type="text"]')
    expect(window.getComputedStyle(searchInput!).borderRadius).toBe('8px')
  })
})
```

### 视觉回归测试

除了功能测试外，还应该进行视觉回归测试以确保UI与设计参考完全一致：

**工具**：Playwright + Percy 或 Chromatic

**测试场景**：
1. 桌面视口（1920x1080）
2. 平板视口（768x1024）
3. 移动视口（375x667）
4. 悬停状态（按钮、图标）
5. 登录/未登录状态

### 可访问性测试

**工具**：jest-axe + Lighthouse

**测试内容**：
- ARIA 标签正确性
- 键盘导航支持
- 颜色对比度
- 语义化 HTML
- 屏幕阅读器兼容性

### 测试覆盖率目标

- 单元测试覆盖率：≥ 80%
- 基于属性的测试：所有 11 个属性
- 视觉回归测试：所有主要视口和状态
- 可访问性测试：WCAG 2.1 AA 级别

