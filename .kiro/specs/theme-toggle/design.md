# 主题切换功能设计文档

## 概述

本设计文档描述了在三维知识图谱应用中实现主题切换功能的架构和实现方案。该功能允许用户在亮色和暗色主题之间切换，并将用户的选择持久化到本地存储。

## 架构

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    应用层 (App)                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         KnowledgeGraph 页面                       │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  TopNavbar (导航栏 + 主题切换按钮)          │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  KnowledgeGraph (三维画布)                  │  │   │
│  │  │  - 背景色根据主题改变                       │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  NodeDetailPanel (节点详情弹窗)             │  │   │
│  │  │  - 样式根据主题改变                         │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         ↓ 使用
┌─────────────────────────────────────────────────────────┐
│              状态管理层 (Zustand Store)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  useGraphStore                                   │   │
│  │  - theme: 'light' | 'dark'                       │   │
│  │  - setTheme(theme)                               │   │
│  │  - toggleTheme()                                 │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         ↓ 读写
┌─────────────────────────────────────────────────────────┐
│              持久化层 (LocalStorage)                     │
│  - 'theme': 'light' | 'dark'                            │
└─────────────────────────────────────────────────────────┘
```

## 组件和接口

### 1. 主题管理 (useGraphStore 扩展)

在现有的 `lib/store.ts` 中添加主题管理功能：

```typescript
interface ThemeState {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
}

// 在 useGraphStore 中添加
const useGraphStore = create<GraphState & ThemeState>((set) => ({
  // ... 现有状态
  theme: 'dark', // 默认暗色主题
  
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme })
    localStorage.setItem('theme', theme)
  },
  
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', newTheme)
      return { theme: newTheme }
    })
  },
}))

// 初始化时从 localStorage 恢复主题
useEffect(() => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
  if (savedTheme) {
    setTheme(savedTheme)
  }
}, [])
```

### 2. 主题配置对象

定义主题的颜色和样式配置：

```typescript
interface ThemeConfig {
  // 三维背景
  canvasBackground: string
  
  // 弹窗样式
  panelBackground: string
  panelBorder: string
  panelText: string
  panelShadow: string
  
  // 导航栏样式
  navbarBackground: string
  navbarText: string
  navbarBorder: string
  
  // 按钮样式
  buttonBackground: string
  buttonHoverBackground: string
  buttonText: string
}

const THEME_CONFIGS: Record<'light' | 'dark', ThemeConfig> = {
  dark: {
    canvasBackground: '#1a1a1a', // 暗色背景（保持不变）
    panelBackground: 'linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(25, 25, 25, 0.98) 100%)',
    panelBorder: 'rgba(255, 255, 255, 0.1)',
    panelText: '#ffffff',
    panelShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    navbarBackground: 'rgba(26, 26, 26, 0.95)',
    navbarText: '#ffffff',
    navbarBorder: 'rgba(255, 255, 255, 0.1)',
    buttonBackground: 'rgba(74, 158, 255, 0.15)',
    buttonHoverBackground: 'rgba(255, 255, 255, 0.08)',
    buttonText: '#ffffff',
  },
  light: {
    canvasBackground: '#ffffff', // 亮色背景（白色）
    panelBackground: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.98) 100%)',
    panelBorder: 'rgba(107, 182, 255, 0.2)',
    panelText: '#1a1a1a',
    panelShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
    navbarBackground: 'rgba(255, 255, 255, 0.95)',
    navbarText: '#1a1a1a',
    navbarBorder: 'rgba(0, 0, 0, 0.1)',
    buttonBackground: 'rgba(74, 158, 255, 0.1)',
    buttonHoverBackground: 'rgba(74, 158, 255, 0.15)',
    buttonText: '#1a1a1a',
  },
}
```

### 3. TopNavbar 中的主题切换按钮

在 `components/TopNavbar.tsx` 中添加主题切换按钮：

```typescript
// 在导航栏右侧添加主题切换按钮
<button
  onClick={() => toggleTheme()}
  title={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
  style={{
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  }}
>
  {theme === 'dark' ? '☀️' : '🌙'}
</button>
```

### 4. KnowledgeGraph 背景应用

在 `components/KnowledgeGraph.tsx` 中应用主题背景：

```typescript
const { theme } = useGraphStore()
const themeConfig = THEME_CONFIGS[theme]

return (
  <Canvas
    style={{
      background: themeConfig.canvasBackground,
      transition: 'background 0.3s ease',
    }}
    // ... 其他配置
  >
    {/* Canvas 内容 */}
  </Canvas>
)
```

### 5. NodeDetailPanel 样式应用

在 `components/NodeDetailPanel.tsx` 中应用主题样式：

```typescript
const { theme } = useGraphStore()
const themeConfig = THEME_CONFIGS[theme]

return (
  <div style={{
    // ... 现有样式
    background: themeConfig.panelBackground,
    border: `1px solid ${themeConfig.panelBorder}`,
    boxShadow: themeConfig.panelShadow,
    color: themeConfig.panelText,
    transition: 'all 0.3s ease',
  }}>
    {/* 面板内容 */}
  </div>
)
```

## 数据模型

### 主题状态

```typescript
interface ThemeState {
  theme: 'light' | 'dark'
}
```

### 主题配置

```typescript
interface ThemeConfig {
  canvasBackground: string
  panelBackground: string
  panelBorder: string
  panelText: string
  panelShadow: string
  navbarBackground: string
  navbarText: string
  navbarBorder: string
  buttonBackground: string
  buttonHoverBackground: string
  buttonText: string
}
```

## 正确性属性

一个属性是一个特征或行为，应该在系统的所有有效执行中保持真实——本质上是对系统应该做什么的形式化陈述。属性充当人类可读规范和机器可验证正确性保证之间的桥梁。

### 属性 1: 主题切换一致性

**对于任何** 主题状态，当用户切换主题时，所有依赖主题的组件应该立即应用新主题的样式。

**验证: 需求 1.4, 5.1, 5.2, 5.3, 5.4**

### 属性 2: 主题持久化往返

**对于任何** 主题选择（亮色或暗色），保存主题到本地存储，然后重新加载页面，应该恢复相同的主题。

**验证: 需求 4.1, 4.2**

### 属性 3: 主题切换幂等性

**对于任何** 初始主题状态，连续切换主题两次应该返回到原始主题。

**验证: 需求 1.2**

### 属性 4: 默认主题应用

**对于任何** 新用户（本地存储中没有保存的主题），系统应该应用暗色主题作为默认主题。

**验证: 需求 4.3**

### 属性 5: 背景颜色正确性

**对于任何** 主题状态，三维画布的背景颜色应该与该主题的配置相匹配。

**验证: 需求 2.1, 3.1**

### 属性 6: 弹窗样式一致性

**对于任何** 主题状态，节点详情弹窗的所有样式属性（背景、边框、文本颜色）应该与该主题的配置相匹配。

**验证: 需求 2.2, 2.3, 2.4, 3.2, 3.3, 3.4**

## 错误处理

### 1. 无效的主题值

如果本地存储中的主题值不是 'light' 或 'dark'，系统应该使用默认的暗色主题。

```typescript
const savedTheme = localStorage.getItem('theme')
const validTheme = (savedTheme === 'light' || savedTheme === 'dark') 
  ? savedTheme 
  : 'dark'
setTheme(validTheme)
```

### 2. LocalStorage 不可用

如果本地存储不可用（例如在隐私浏览模式下），系统应该继续工作，使用默认主题，但不会持久化用户的选择。

```typescript
try {
  localStorage.setItem('theme', theme)
} catch (e) {
  console.warn('LocalStorage 不可用，主题选择不会被保存')
}
```

## 测试策略

### 单元测试

1. **主题切换测试**: 验证 toggleTheme() 正确地在亮色和暗色之间切换
2. **主题持久化测试**: 验证主题被正确保存到和恢复自本地存储
3. **默认主题测试**: 验证当没有保存的主题时使用暗色作为默认
4. **主题配置测试**: 验证主题配置对象包含所有必需的属性

### 属性测试

1. **主题切换一致性**: 生成随机主题状态，切换主题，验证所有组件都应用了新主题
2. **主题持久化往返**: 生成随机主题，保存，重新加载，验证恢复相同的主题
3. **主题切换幂等性**: 生成随机初始主题，切换两次，验证返回到原始主题
4. **背景颜色正确性**: 对于每个主题，验证画布背景颜色与配置匹配
5. **弹窗样式一致性**: 对于每个主题，验证弹窗的所有样式属性与配置匹配

### 集成测试

1. **完整主题切换流程**: 用户点击主题按钮 → 主题改变 → 所有组件更新 → 主题被保存
2. **页面重新加载**: 用户切换主题 → 刷新页面 → 主题被恢复
3. **多个组件同步**: 在多个组件中验证主题同时改变

