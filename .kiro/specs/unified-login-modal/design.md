# Design Document

## Overview

本设计文档描述了统一登录弹窗功能的技术实现方案。该功能将使首页(Landing Page)和3D编辑页面共享同一个登录弹窗组件,确保用户体验的一致性。

核心设计原则:
- 组件复用: 使用现有的 LoginModal 组件
- 状态管理: 使用 React state 和 localStorage 管理登录状态
- 事件驱动: 使用自定义事件同步登录状态
- 渐进增强: 在不破坏现有功能的前提下添加新功能

## Architecture

### 组件层次结构

```
app/page.tsx (Landing Page)
├── LoginModal (复用现有组件)
└── 登录按钮 (新增状态管理)

components/GalleryTopNavbar.tsx
├── UserMenu
│   └── LoginModal (已存在)
└── 其他导航组件

components/TopNavbar.tsx (3D Editor)
├── LoginModal (已存在)
└── 其他导航组件
```

### 状态流

```
用户点击登录按钮
    ↓
设置 isLoginModalOpen = true
    ↓
LoginModal 显示
    ↓
用户提交登录表单
    ↓
API 调用 /api/auth/login
    ↓
登录成功
    ↓
更新 localStorage
    ↓
触发 loginStateChange 事件
    ↓
所有监听组件更新状态
    ↓
关闭 LoginModal
```

## Components and Interfaces

### 1. Landing Page 修改

**文件**: `app/page.tsx`

**新增状态**:
```typescript
const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
```

**新增导入**:
```typescript
import LoginModal from '@/components/LoginModal'
```

**登录按钮修改**:
```typescript
<button
  onClick={() => setIsLoginModalOpen(true)}
  // ... 保持现有样式
>
  登录
</button>
```

**新增组件**:
```typescript
<LoginModal
  isOpen={isLoginModalOpen}
  onClose={() => setIsLoginModalOpen(false)}
/>
```

### 2. LoginModal 组件接口

**文件**: `components/LoginModal.tsx`

**现有接口**:
```typescript
interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}
```

**组件行为**:
- 接收 `isOpen` 控制显示/隐藏
- 接收 `onClose` 回调函数
- 内部管理登录/注册表单状态
- 登录成功后调用 `useUserStore.login()`
- 登录成功后自动调用 `onClose()`

### 3. 用户状态管理

**文件**: `lib/userStore.ts`

**现有 Store**:
```typescript
interface UserStore {
  user: User | null
  isLoggedIn: boolean
  login: (user: User) => void
  logout: () => void
  initializeFromStorage: () => void
}
```

**登录流程**:
1. `login()` 方法更新 store 状态
2. 将用户信息保存到 localStorage
3. 触发 `loginStateChange` 事件

### 4. 事件同步机制

**事件名称**: `loginStateChange`

**触发时机**:
- 用户登录成功
- 用户退出登录

**监听位置**:
- `GalleryTopNavbar` 组件
- `TopNavbar` 组件
- 其他需要响应登录状态的组件

**实现方式**:
```typescript
// 触发事件
window.dispatchEvent(new Event('loginStateChange'))

// 监听事件
useEffect(() => {
  const handleLoginStateChange = () => {
    // 重新检查登录状态
    initializeFromStorage()
  }
  
  window.addEventListener('loginStateChange', handleLoginStateChange)
  return () => {
    window.removeEventListener('loginStateChange', handleLoginStateChange)
  }
}, [])
```

## Data Models

### User Model

```typescript
interface User {
  id: string
  username: string
  email?: string
  name?: string
  avatar?: string
}
```

### LocalStorage Schema

```typescript
{
  "isAdmin": "true" | "false",
  "adminUsername": string,
  "currentUser": JSON.stringify(User)
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 登录弹窗状态一致性

*For any* page (Landing Page, 3D Editor, Gallery), when the login button is clicked, the LoginModal component should be displayed with the same UI and behavior.

**Validates: Requirements 1.1, 2.3**

### Property 2: 登录状态同步

*For any* successful login action on any page, all components listening to the loginStateChange event should update their state to reflect the logged-in status.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 3: 弹窗关闭行为

*For any* LoginModal instance, clicking outside the modal or clicking the cancel button should close the modal and reset the isOpen state to false.

**Validates: Requirements 1.3, 1.4**

### Property 4: 登录成功后状态更新

*For any* successful login, the system should update localStorage, trigger the loginStateChange event, and close the modal in that order.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 5: 错误状态显示

*For any* failed login attempt, the LoginModal should display an error message without closing the modal, allowing the user to retry.

**Validates: Requirements 6.1, 6.2**

### Property 6: 加载状态管理

*For any* login request in progress, the submit button should be disabled and show a loading state until the request completes or fails.

**Validates: Requirements 6.3**

## Error Handling

### 1. 网络错误

**场景**: API 请求失败

**处理**:
```typescript
try {
  const response = await fetch('/api/auth/login', {...})
  // ...
} catch (err) {
  setError('网络错误,请稍后重试')
}
```

### 2. 认证错误

**场景**: 用户名或密码错误

**处理**:
```typescript
if (!data.success) {
  setError(data.error || '登录失败')
}
```

### 3. 状态同步错误

**场景**: localStorage 不可用

**处理**:
```typescript
try {
  localStorage.setItem('isAdmin', 'true')
} catch (err) {
  console.warn('无法保存登录状态到本地存储')
  // 仍然允许用户继续使用(仅会话期间有效)
}
```

### 4. 组件卸载时的清理

**场景**: 组件在请求进行中被卸载

**处理**:
```typescript
useEffect(() => {
  let isMounted = true
  
  const handleLogin = async () => {
    const data = await fetch(...)
    if (isMounted) {
      // 更新状态
    }
  }
  
  return () => {
    isMounted = false
  }
}, [])
```

## Testing Strategy

### Unit Tests

**测试文件**: `components/__tests__/LoginModal.unified.test.tsx`

**测试用例**:
1. 登录弹窗在 isOpen=true 时显示
2. 登录弹窗在 isOpen=false 时隐藏
3. 点击外部区域调用 onClose
4. 点击取消按钮调用 onClose
5. 登录成功后调用 onClose
6. 登录失败时显示错误信息
7. 加载状态下禁用提交按钮

### Property-Based Tests

**测试文件**: `components/__tests__/LoginModal.property.test.tsx`

**Property 1: 登录弹窗状态一致性**
```typescript
// Feature: unified-login-modal, Property 1: 登录弹窗状态一致性
fc.assert(
  fc.property(fc.boolean(), (isOpen) => {
    const { container } = render(
      <LoginModal isOpen={isOpen} onClose={() => {}} />
    )
    const modal = container.querySelector('[role="dialog"]')
    return isOpen ? modal !== null : modal === null
  }),
  { numRuns: 100 }
)
```

**Property 2: 登录状态同步**
```typescript
// Feature: unified-login-modal, Property 2: 登录状态同步
fc.assert(
  fc.property(
    fc.record({
      username: fc.string({ minLength: 1 }),
      password: fc.string({ minLength: 6 }),
    }),
    async (credentials) => {
      // 模拟登录成功
      const eventFired = await new Promise((resolve) => {
        window.addEventListener('loginStateChange', () => resolve(true), { once: true })
        // 触发登录
        setTimeout(() => resolve(false), 1000)
      })
      return eventFired === true
    }
  ),
  { numRuns: 100 }
)
```

**Property 3: 弹窗关闭行为**
```typescript
// Feature: unified-login-modal, Property 3: 弹窗关闭行为
fc.assert(
  fc.property(fc.constant(null), () => {
    const onClose = jest.fn()
    const { container } = render(
      <LoginModal isOpen={true} onClose={onClose} />
    )
    
    // 点击背景
    const backdrop = container.firstChild
    fireEvent.click(backdrop)
    
    return onClose.mock.calls.length === 1
  }),
  { numRuns: 100 }
)
```

### Integration Tests

**测试文件**: `app/__tests__/page.integration.test.tsx`

**测试场景**:
1. 首页加载后登录按钮可见
2. 点击登录按钮显示弹窗
3. 在弹窗中登录成功后更新导航栏
4. 登录后点击"开始创作"导航到创作页面

### Manual Testing Checklist

- [ ] 在首页点击登录按钮显示弹窗
- [ ] 在3D编辑页面点击登录按钮显示弹窗
- [ ] 两个页面的弹窗UI完全一致
- [ ] 在首页登录后,导航到3D编辑页面显示已登录状态
- [ ] 在3D编辑页面登录后,返回首页显示已登录状态
- [ ] 点击弹窗外部关闭弹窗
- [ ] 按ESC键关闭弹窗
- [ ] 登录失败显示错误信息
- [ ] 登录成功后弹窗自动关闭
- [ ] 加载状态下按钮禁用

## Implementation Notes

### 1. 最小化代码修改

只需修改 `app/page.tsx` 文件,添加:
- 导入 LoginModal 组件
- 添加 isLoginModalOpen 状态
- 修改登录按钮的 onClick 处理
- 添加 LoginModal 组件实例

### 2. 保持向后兼容

- 不修改 LoginModal 组件的现有接口
- 不修改 userStore 的现有逻辑
- 不影响 GalleryTopNavbar 和 TopNavbar 的现有功能

### 3. 性能考虑

- LoginModal 只在需要时渲染(isOpen=true)
- 使用 React 的条件渲染避免不必要的 DOM 操作
- 事件监听器在组件卸载时正确清理

### 4. 样式一致性

首页登录按钮应使用与 UserMenu 组件相同的样式:
```typescript
style={{
  padding: '10px 20px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  border: 'none',
  borderRadius: '8px',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  transition: 'all 0.2s',
  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
}}
```

## Accessibility Considerations

### 1. 键盘导航

- 弹窗打开时焦点自动移到第一个输入框
- Tab 键在表单元素间导航
- Enter 键提交表单
- ESC 键关闭弹窗

### 2. ARIA 属性

```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="login-modal-title"
>
  <h2 id="login-modal-title">登录</h2>
  {/* ... */}
</div>
```

### 3. 焦点管理

```typescript
useEffect(() => {
  if (isOpen) {
    const firstInput = document.querySelector('input[type="text"]')
    firstInput?.focus()
  }
}, [isOpen])
```

## Security Considerations

### 1. 密码处理

- 密码字段使用 `type="password"`
- 密码不在客户端存储
- 使用 HTTPS 传输

### 2. 会话管理

- 使用 httpOnly cookies 存储会话令牌(如果实现)
- localStorage 只存储非敏感信息(用户名、登录状态)

### 3. XSS 防护

- 所有用户输入经过 React 的自动转义
- 不使用 dangerouslySetInnerHTML

## Future Enhancements

1. **社交登录**: 支持 Google、GitHub 等第三方登录
2. **记住我**: 添加"记住我"选项延长会话时间
3. **密码重置**: 添加忘记密码功能
4. **双因素认证**: 增强账户安全性
5. **登录历史**: 记录登录时间和设备信息
