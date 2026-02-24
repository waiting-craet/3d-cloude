# Design Document: Landing Page

## Overview

本设计文档描述了知识图谱应用首页（Landing Page）的技术实现方案。首页将作为应用的入口，提供简洁的用户界面和明确的行动号召，引导用户进入3D知识图谱创建页面。

设计采用 Next.js 13+ App Router 架构，使用 TypeScript 和 React 实现，保持与现有应用的视觉风格一致。

## Architecture

### 技术栈
- **框架**: Next.js 13+ (App Router)
- **语言**: TypeScript
- **UI**: React 18+
- **路由**: Next.js 内置路由系统
- **样式**: 内联样式（与现有代码风格保持一致）

### 页面结构
```
app/
├── page.tsx              # 首页（Landing Page）- 需要重新设计
├── text-page/
│   └── page.tsx         # 3D知识图谱页面（目标跳转页面）
└── layout.tsx           # 根布局
```

### 路由映射
- `/` → Landing Page（首页）
- `/text-page` → 3D知识图谱创建页面

## Components and Interfaces

### 1. Landing Page Component

主要的首页组件，包含所有UI元素和交互逻辑。

```typescript
// app/page.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  
  const handleStartCreating = () => {
    router.push('/text-page')
  }
  
  return (
    <main>
      {/* 导航栏 */}
      <nav>...</nav>
      
      {/* 主内容区 */}
      <section>
        <h1>知识图谱作品广场</h1>
        <button onClick={handleStartCreating}>
          开始创作
        </button>
      </section>
    </main>
  )
}
```

### 2. 组件接口定义

```typescript
// 导航栏配置
interface NavbarConfig {
  appName: string
  showLoginButton: boolean
}

// CTA按钮配置
interface CTAButtonProps {
  text: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}
```

## Data Models

### 页面状态

```typescript
// 首页不需要复杂的状态管理
// 仅使用 Next.js 路由进行页面导航
interface LandingPageState {
  // 无需额外状态
}
```

### 路由参数

```typescript
// 导航到3D图谱页面时不需要传递参数
// 用户在目标页面选择项目和图谱
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation on CTA Button Click

*For any* CTA button click event, the system should navigate to the `/text-page` route.

**Validates: Requirements 2.2, 4.2**

### Property 2: Visual Feedback on Button Interaction

*For any* hover or click event on the CTA button, the button should provide visual feedback through style changes.

**Validates: Requirements 2.4**

### Property 3: Browser History Management

*For any* navigation action triggered by the CTA button, the browser history should be updated to allow back/forward navigation.

**Validates: Requirements 4.4**

### Property 4: Responsive Layout Adaptation

*For any* viewport width (mobile: <768px, tablet: 768-1024px, desktop: >1024px), the landing page layout should adapt appropriately without breaking functionality.

**Validates: Requirements 5.1, 3.4, 5.4**

### Property 5: Button Accessibility Across Screen Sizes

*For any* screen size, the CTA button should remain accessible and clickable (not hidden or overlapped).

**Validates: Requirements 5.3**

## Error Handling

### 导航错误处理

```typescript
const handleStartCreating = () => {
  try {
    router.push('/text-page')
  } catch (error) {
    console.error('Navigation failed:', error)
    // 降级方案：使用传统链接导航
    window.location.href = '/text-page'
  }
}
```

### 路由不存在处理

Next.js 自动处理 404 错误，如果目标路由不存在，会显示 404 页面。

## Testing Strategy

### 测试方法

本功能采用双重测试策略：

1. **单元测试（Unit Tests）**: 验证特定示例、边缘情况和错误条件
2. **属性测试（Property Tests）**: 验证跨所有输入的通用属性

两种测试方法是互补的，共同提供全面的测试覆盖。

### 单元测试重点

单元测试应专注于：
- 特定示例：验证页面元素是否正确渲染
- 集成点：验证组件之间的交互
- 边缘情况：验证特殊场景（如快速多次点击按钮）

避免编写过多的单元测试 - 属性测试已经处理了大量输入覆盖。

### 属性测试配置

- **测试库**: fast-check (JavaScript/TypeScript 的属性测试库)
- **最小迭代次数**: 100次（由于随机化）
- **标签格式**: `Feature: landing-page, Property {number}: {property_text}`

每个正确性属性必须由单个属性测试实现。

### 测试用例示例

#### 单元测试示例

```typescript
// 测试页面基本结构
describe('Landing Page Structure', () => {
  it('should display navigation bar at the top', () => {
    render(<LandingPage />)
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
  })
  
  it('should display main heading', () => {
    render(<LandingPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
  })
  
  it('should display CTA button with correct text', () => {
    render(<LandingPage />)
    const button = screen.getByRole('button', { name: /开始创作/i })
    expect(button).toBeInTheDocument()
  })
})

// 测试路由行为
describe('Landing Page Routing', () => {
  it('should be displayed when accessing root URL', () => {
    // 测试根路由显示首页
  })
  
  it('should use Next.js router for navigation', () => {
    // 验证使用 useRouter hook
  })
})
```

#### 属性测试示例

```typescript
import fc from 'fast-check'

// Feature: landing-page, Property 1: Navigation on CTA Button Click
describe('Property: Navigation on CTA Button Click', () => {
  it('should navigate to /text-page on any button click', () => {
    fc.assert(
      fc.property(fc.nat(100), (clickCount) => {
        // 对于任意次数的点击，都应该触发导航
        const mockPush = jest.fn()
        const { getByRole } = render(<LandingPage router={{ push: mockPush }} />)
        const button = getByRole('button', { name: /开始创作/i })
        
        for (let i = 0; i < clickCount; i++) {
          fireEvent.click(button)
        }
        
        expect(mockPush).toHaveBeenCalledWith('/text-page')
      }),
      { numRuns: 100 }
    )
  })
})

// Feature: landing-page, Property 4: Responsive Layout Adaptation
describe('Property: Responsive Layout Adaptation', () => {
  it('should adapt layout for any viewport width', () => {
    fc.assert(
      fc.property(fc.integer(320, 2560), (width) => {
        // 对于任意视口宽度，布局应该正常工作
        global.innerWidth = width
        global.dispatchEvent(new Event('resize'))
        
        const { container } = render(<LandingPage />)
        const button = screen.getByRole('button', { name: /开始创作/i })
        
        // 验证按钮可见且可点击
        expect(button).toBeVisible()
        expect(button).not.toBeDisabled()
      }),
      { numRuns: 100 }
    )
  })
})
```

## Implementation Details

### 视觉设计

首页将采用与现有应用一致的深色主题设计：

- **背景**: 渐变深色背景 `linear-gradient(135deg, #1e1e2e 0%, #0f0f1e 50%, #1a1a2e 100%)`
- **主色调**: 紫色/蓝色渐变 `rgba(99, 102, 241, x)` 到 `rgba(168, 85, 247, x)`
- **文字**: 白色和半透明白色
- **卡片**: 半透明背景 + 毛玻璃效果 `backdrop-filter: blur(10px)`

### 布局结构

```
┌─────────────────────────────────────┐
│  Navigation Bar                     │
│  [Logo/Name]              [Login]   │
└─────────────────────────────────────┘
│                                     │
│         Hero Section                │
│                                     │
│    知识图谱作品广场                   │
│                                     │
│    [开始创作] ← CTA Button           │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### 响应式断点

- **Mobile**: < 768px
  - 单列布局
  - 较小的字体和间距
  - 全宽按钮
  
- **Tablet**: 768px - 1024px
  - 适中的字体和间距
  - 居中对齐
  
- **Desktop**: > 1024px
  - 最大宽度限制（1200px）
  - 较大的字体和间距
  - 居中对齐

### 动画和过渡

- 按钮悬停: `transform: scale(1.05)` + 背景色变化
- 页面加载: 淡入动画
- 所有过渡: `transition: all 0.2s ease`

## Dependencies

- `next`: ^13.0.0 (Next.js 框架)
- `react`: ^18.0.0 (React 库)
- `next/navigation`: Next.js 路由 hook

## Performance Considerations

- 首页为静态页面，无需数据获取
- 使用 Next.js 静态生成（SSG）以获得最佳性能
- 内联样式避免额外的 CSS 文件加载
- 最小化 JavaScript 包大小

## Accessibility

- 使用语义化 HTML 标签（`<nav>`, `<main>`, `<button>`）
- 按钮具有清晰的文本标签
- 支持键盘导航（Tab 键和 Enter 键）
- 足够的颜色对比度（WCAG AA 标准）
- 响应式设计支持不同设备

## Security Considerations

- 无需身份验证（公开页面）
- 无敏感数据处理
- 使用 Next.js 内置的 XSS 防护
- CSP（内容安全策略）由 Next.js 处理
