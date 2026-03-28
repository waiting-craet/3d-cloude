# 管理员权限控制更新

## 更新内容

为浮动添加按钮添加了管理员权限控制，确保只有管理员才能添加节点。

## 修改的文件

### 1. `components/FloatingAddButton.tsx`

**新增功能**:
- 添加 `isAdmin` 状态管理
- 使用 `useEffect` 检查 localStorage 中的管理员状态
- 监听 `loginStateChange` 自定义事件
- 非管理员时返回 `null`，不渲染按钮

**关键代码**:
```typescript
const [isAdmin, setIsAdmin] = useState(false)

useEffect(() => {
  const savedIsAdmin = localStorage.getItem('isAdmin')
  setIsAdmin(savedIsAdmin === 'true')

  const handleLoginStateChange = () => {
    const currentIsAdmin = localStorage.getItem('isAdmin')
    setIsAdmin(currentIsAdmin === 'true')
  }
  
  window.addEventListener('loginStateChange', handleLoginStateChange)
  return () => {
    window.removeEventListener('loginStateChange', handleLoginStateChange)
  }
}, [])

// 只在管理员登录时显示按钮
if (!isAdmin) return null
```

### 2. `components/TopNavbar.tsx`

**新增功能**:
- 在 `handleLogin` 和 `handleLogout` 函数中触发自定义事件
- 通知其他组件登录状态已改变

**关键代码**:
```typescript
const handleLogin = (username: string, password: string) => {
  setIsAdmin(true)
  setAdminUsername(username)
  localStorage.setItem('isAdmin', 'true')
  localStorage.setItem('adminUsername', username)
  // 触发自定义事件通知其他组件
  window.dispatchEvent(new Event('loginStateChange'))
}

const handleLogout = () => {
  setIsAdmin(false)
  setAdminUsername('')
  localStorage.removeItem('isAdmin')
  localStorage.removeItem('adminUsername')
  // 触发自定义事件通知其他组件
  window.dispatchEvent(new Event('loginStateChange'))
}
```

### 3. `ADD-NODE-FEATURE.md`

**更新内容**:
- 添加权限控制说明章节
- 更新使用流程，说明需要管理员登录
- 更新测试清单，添加权限控制测试项
- 更新功能完成说明

## 功能说明

### 权限控制逻辑

1. **初始状态检查**
   - 组件加载时从 localStorage 读取 `isAdmin` 状态
   - 如果为 `true`，显示按钮；否则隐藏

2. **实时状态监听**
   - 监听 `loginStateChange` 自定义事件
   - 当用户登录或登出时，事件被触发
   - 组件自动更新显示状态

3. **按钮渲染控制**
   - 使用条件渲染：`if (!isAdmin) return null`
   - 非管理员时不渲染任何内容
   - 管理员时正常渲染浮动按钮

### 用户体验

**普通用户**:
- 看不到右下角的浮动添加按钮
- 无法添加节点
- 只能查看现有的知识图谱

**管理员用户**:
- 登录后立即看到浮动添加按钮
- 可以添加新节点
- 可以管理项目和图谱
- 登出后按钮自动隐藏

### 测试步骤

1. **未登录状态**
   - 打开页面
   - 确认右下角没有浮动按钮 ✓

2. **管理员登录**
   - 点击"登录"按钮
   - 输入 admin / admin123
   - 登录成功后，右下角出现浮动按钮 ✓

3. **添加节点**
   - 点击浮动按钮
   - 填写节点信息
   - 成功创建节点 ✓

4. **管理员登出**
   - 点击"登出"按钮
   - 浮动按钮立即消失 ✓

## 技术实现

### 事件驱动架构

使用自定义事件实现组件间通信：

```
TopNavbar (登录/登出)
    ↓
触发 loginStateChange 事件
    ↓
FloatingAddButton (监听事件)
    ↓
更新 isAdmin 状态
    ↓
重新渲染 (显示/隐藏按钮)
```

### 优势

1. **解耦**: 组件之间不需要直接引用
2. **实时**: 状态变化立即响应，无需刷新页面
3. **简单**: 使用原生浏览器事件 API
4. **可扩展**: 其他组件也可以监听同一事件

## 安全性说明

⚠️ **注意**: 当前实现是前端权限控制，仅用于 UI 显示。

**生产环境建议**:
1. 后端 API 必须验证用户权限
2. 添加节点的 API 应该检查用户身份
3. 使用 JWT 或 Session 进行身份验证
4. 前端权限控制只是第一层防护

**当前实现适用于**:
- 演示和原型开发
- 本地开发环境
- 单用户场景
- 教学和学习项目

## 总结

✅ 浮动添加按钮现在只对管理员可见
✅ 登录/登出状态实时响应
✅ 用户体验流畅自然
✅ 代码结构清晰易维护

下一步可以考虑：
- 添加更多管理员专属功能
- 实现后端权限验证
- 添加用户角色系统
- 实现更细粒度的权限控制
