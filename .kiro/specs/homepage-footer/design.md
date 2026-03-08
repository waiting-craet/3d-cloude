# 设计文档：首页页脚组件

## Overview

本设计文档描述了首页页脚组件的技术实现方案。页脚组件将作为首页的底部区域，提供网站基本信息、快速导航链接和版权声明，增强页面的完整性和专业性。

### 设计目标

1. **一致性**: 与现有的纸质风格（莫兰迪色系）设计保持视觉一致性
2. **可访问性**: 符合 WCAG AA 标准，支持键盘导航和屏幕阅读器
3. **响应式**: 在所有设备尺寸上提供良好的用户体验
4. **性能**: 轻量级实现，不影响页面加载性能
5. **可维护性**: 使用模块化的 CSS Modules 和 TypeScript

### 技术栈

- **框架**: React 18+ (Next.js App Router)
- **样式**: CSS Modules
- **类型**: TypeScript
- **测试**: Jest + React Testing Library + fast-check (property-based testing)

## Architecture

### 组件结构

页脚组件采用单一组件设计，包含三个主要区域：

```
PaperFooter (组件)
├── Brand Section (网站信息区)
│   ├── Site Name
│   └── Site Description
├── Navigation Section (导航链接区)
│   └── Navigation Links (首页、开始创作、关于我们、帮助中心)
└── Copyright Section (版权信息区)
    └── Copyright Text (© 年份 + 网站名称)
```

### 文件组织

```
components/
├── PaperFooter.tsx          # 页脚组件主文件
├── PaperFooter.module.css   # 页脚样式文件
└── __tests__/
    ├── PaperFooter.test.tsx           # 单元测试
    └── PaperFooter.property.test.tsx  # 属性测试
```

### 集成方式

页脚组件将直接集成到 `app/page.tsx` 中，作为主页面的最后一个子元素：

```tsx
<main>
  <PaperNavbar />
  <div id="main-content">
    <PaperHeroSection />
    <PaperGallerySection />
  </div>
  <PaperFooter />  {/* 新增页脚 */}
</main>
```

## Components and Interfaces

### PaperFooter 组件

#### Props 接口

```typescript
interface PaperFooterProps {
  // 页脚组件不需要外部 props，所有内容都是静态的
}
```

#### 组件签名

```typescript
export default function PaperFooter(): JSX.Element
```

#### 内部数据结构

```typescript
// 导航链接配置
interface NavigationLink {
  label: string      // 链接文本
  href: string       // 链接地址
  ariaLabel: string  // 可访问性标签
}

const navigationLinks: NavigationLink[] = [
  { label: '首页', href: '/', ariaLabel: '返回首页' },
  { label: '开始创作', href: '/creation', ariaLabel: '前往创作页面' },
  { label: '关于我们', href: '/about', ariaLabel: '了解关于我们' },
  { label: '帮助中心', href: '/help', ariaLabel: '访问帮助中心' }
]
```

### 样式模块

CSS Modules 类名结构：

```css
.footer          /* 页脚容器 */
.container       /* 内容容器（最大宽度限制） */
.brandSection    /* 网站信息区 */
.siteName        /* 网站名称 */
.siteDescription /* 网站描述 */
.navSection      /* 导航链接区 */
.navList         /* 导航列表 */
.navLink         /* 导航链接 */
.copyrightSection /* 版权信息区 */
.copyrightText   /* 版权文本 */
```

## Data Models

### 配置数据

页脚组件使用静态配置数据，不涉及动态数据获取：

```typescript
// 网站信息
const SITE_INFO = {
  name: '知识图谱平台',
  description: '构建与发现知识的无尽脉络'
} as const

// 版权信息
const COPYRIGHT_INFO = {
  symbol: '©',
  year: new Date().getFullYear(),
  owner: '知识图谱平台'
} as const

// 导航链接
const NAVIGATION_LINKS: ReadonlyArray<NavigationLink> = [
  { label: '首页', href: '/', ariaLabel: '返回首页' },
  { label: '开始创作', href: '/creation', ariaLabel: '前往创作页面' },
  { label: '关于我们', href: '/about', ariaLabel: '了解关于我们' },
  { label: '帮助中心', href: '/help', ariaLabel: '访问帮助中心' }
] as const
```

### 样式常量

```typescript
// 颜色系统（莫兰迪色系）
const COLORS = {
  primary: '#5a7a6e',      // 主色调
  primaryHover: '#6b8e85', // 悬停色
  text: '#3d5a50',         // 文本色
  textLight: '#6b8578',    // 浅文本色
  border: '#b8cfc7',       // 边框色
  background: '#f5f8f7'    // 背景色
} as const

// 断点
const BREAKPOINTS = {
  mobile: '768px'
} as const

// 尺寸
const SIZES = {
  minTouchTarget: '44px',  // 最小触摸目标尺寸
  maxWidth: '1200px',      // 最大内容宽度
  copyrightFontSize: '14px' // 版权信息字体大小
} as const
```

### 响应式布局模型

页脚采用 Flexbox 布局，根据视口宽度自动调整：

- **桌面端 (≥768px)**: 三列水平布局
  - Brand Section: 左对齐
  - Navigation Section: 居中
  - Copyright Section: 右对齐

- **移动端 (<768px)**: 单列垂直布局
  - 所有区域居中对齐
  - 顺序：Brand → Navigation → Copyright


## Correctness Properties

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: 导航链接功能性

*对于任意*导航链接，当用户点击该链接时，应该导航到该链接对应的正确页面路径。

**Validates: Requirements 3.3**

### Property 2: 链接悬停反馈

*对于任意*页脚中的导航链接，当用户将鼠标悬停在链接上时，该链接应该显示视觉反馈（颜色变化或下划线）。

**Validates: Requirements 3.4**

### Property 3: 交互元素可访问性标签

*对于任意*页脚中的交互元素（链接），该元素应该具有适当的 aria-label 或 aria-labelledby 属性以支持屏幕阅读器。

**Validates: Requirements 3.5, 6.2**

### Property 4: 移动端触摸目标尺寸

*对于任意*页脚中的链接，在移动视口（宽度 < 768px）下，该链接的可点击区域应该至少为 44x44 像素。

**Validates: Requirements 5.5**

### Property 5: 文本对比度标准

*对于任意*页脚中的文本元素，该文本与其背景的颜色对比度应该至少为 4.5:1，符合 WCAG AA 标准。

**Validates: Requirements 6.3**

### Property 6: 键盘导航可访问性

*对于任意*页脚中的链接，该链接应该可以通过键盘 Tab 键获得焦点并可以通过 Enter 键激活。

**Validates: Requirements 6.4**

### Property 7: 焦点指示器可见性

*对于任意*页脚中的链接，当该链接获得键盘焦点时，应该显示清晰可见的焦点指示器（outline 或其他视觉样式）。

**Validates: Requirements 6.5**

## Error Handling

### 导航错误处理

页脚组件使用 Next.js 的 `Link` 组件进行导航，该组件内置了错误处理机制：

1. **无效路径**: 如果导航路径不存在，Next.js 会显示 404 页面
2. **导航失败**: 如果客户端导航失败，会自动回退到服务器端导航
3. **链接验证**: 在开发环境中，Next.js 会警告无效的链接配置

### 可访问性降级

1. **无 JavaScript 环境**: 使用标准的 `<a>` 标签确保在禁用 JavaScript 时仍可导航
2. **屏幕阅读器**: 所有链接都包含 aria-label，确保辅助技术可以正确识别
3. **键盘导航**: 使用原生 HTML 元素确保键盘导航始终可用

### 样式加载失败

1. **CSS Modules 失败**: 组件使用语义化的 HTML 结构，即使样式未加载也能保持基本可用性
2. **回退样式**: 使用浏览器默认样式作为回退，确保内容始终可读

## Testing Strategy

### 测试方法

本功能采用双重测试策略：

1. **单元测试**: 验证特定示例、边缘情况和错误条件
2. **属性测试**: 验证跨所有输入的通用属性

两者是互补的，共同提供全面的测试覆盖：
- 单元测试捕获具体的错误
- 属性测试验证通用的正确性

### 单元测试范围

使用 Jest 和 React Testing Library 进行单元测试：

#### 结构测试
- 验证页脚使用 `<footer>` 语义标签（需求 6.1）
- 验证包含三个主要区域：品牌区、导航区、版权区（需求 1.2）
- 验证页脚显示在页面底部（需求 1.1）
- 验证 DOM 节点数量不超过 20 个（需求 7.5）

#### 内容测试
- 验证品牌区显示网站名称和描述（需求 2.1, 2.2）
- 验证描述文本不超过 50 个字符（需求 2.2）
- 验证网站名称无悬停交互效果（需求 2.4）
- 验证导航区包含所有必需链接（需求 3.2）
- 验证版权区显示年份、符号和网站名称（需求 4.2, 4.3）
- 验证版权信息字体大小在 12-14px 范围内（需求 4.4）
- 验证版权区无交互元素（需求 4.5）

#### 响应式测试
- 验证桌面端（≥768px）三列水平布局（需求 5.2）
- 验证移动端（<768px）单列垂直布局（需求 5.1）

#### 性能测试
- 验证不加载外部图片或字体（需求 7.2）
- 验证不触发额外网络请求（需求 7.4）

### 属性测试范围

使用 fast-check 进行属性测试，每个测试至少运行 100 次迭代：

#### Property 1: 导航链接功能性
```typescript
// Feature: homepage-footer, Property 1: 对于任意导航链接，点击应导航到正确页面
```
- 生成器: 从导航链接列表中随机选择链接
- 验证: 点击后 href 属性与预期路径匹配

#### Property 2: 链接悬停反馈
```typescript
// Feature: homepage-footer, Property 2: 对于任意链接，悬停应显示视觉反馈
```
- 生成器: 从所有链接中随机选择
- 验证: 悬停状态下样式发生变化（颜色或文本装饰）

#### Property 3: 交互元素可访问性标签
```typescript
// Feature: homepage-footer, Property 3: 对于任意交互元素，应具有可访问性标签
```
- 生成器: 从所有交互元素中随机选择
- 验证: 元素具有 aria-label 或 aria-labelledby 属性

#### Property 4: 移动端触摸目标尺寸
```typescript
// Feature: homepage-footer, Property 4: 对于任意链接，移动端触摸目标至少 44x44px
```
- 生成器: 从所有链接中随机选择，设置移动视口
- 验证: 计算的宽度和高度都 ≥ 44px

#### Property 5: 文本对比度标准
```typescript
// Feature: homepage-footer, Property 5: 对于任意文本元素，对比度至少 4.5:1
```
- 生成器: 从所有文本元素中随机选择
- 验证: 使用对比度计算算法验证比率 ≥ 4.5

#### Property 6: 键盘导航可访问性
```typescript
// Feature: homepage-footer, Property 6: 对于任意链接，可通过键盘访问
```
- 生成器: 从所有链接中随机选择
- 验证: tabIndex 不为 -1，可以接收焦点

#### Property 7: 焦点指示器可见性
```typescript
// Feature: homepage-footer, Property 7: 对于任意链接，焦点时显示指示器
```
- 生成器: 从所有链接中随机选择
- 验证: 焦点状态下 outline 或其他焦点样式存在

### 测试工具配置

#### Jest 配置
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  }
}
```

#### fast-check 配置
```typescript
// 每个属性测试至少 100 次迭代
fc.assert(
  fc.property(/* ... */),
  { numRuns: 100 }
)
```

### 测试覆盖率目标

- 语句覆盖率: ≥ 90%
- 分支覆盖率: ≥ 85%
- 函数覆盖率: 100%
- 行覆盖率: ≥ 90%

### 持续集成

测试应在以下情况下自动运行：
1. 每次代码提交（pre-commit hook）
2. Pull Request 创建或更新
3. 合并到主分支之前

### 手动测试检查清单

除自动化测试外，还需进行以下手动测试：

#### 视觉回归测试
- [ ] 页脚与首页其他组件视觉风格一致
- [ ] 莫兰迪色系应用正确
- [ ] 间距和对齐符合设计规范

#### 跨浏览器测试
- [ ] Chrome (最新版本)
- [ ] Firefox (最新版本)
- [ ] Safari (最新版本)
- [ ] Edge (最新版本)

#### 响应式测试
- [ ] 桌面端 (1920x1080, 1366x768)
- [ ] 平板端 (768x1024, 1024x768)
- [ ] 移动端 (375x667, 414x896)

#### 可访问性测试
- [ ] 使用 NVDA/JAWS 屏幕阅读器测试
- [ ] 使用 VoiceOver (macOS/iOS) 测试
- [ ] 仅使用键盘完成所有导航
- [ ] 使用 axe DevTools 扫描可访问性问题

