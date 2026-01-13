# 删除按钮样式修复

## 问题诊断

从用户提供的 HTML 代码中发现：
```html
<button aria-label="删除项目 111" 
        class="p-2 rounded transition-all duration-200text-gray-500 hover:text-red-600 hover:bg-red-50 active:bg-red-100" 
        type="button">
```

**问题**：
1. Tailwind CSS 类名之间缺少空格（`duration-200text-gray-500` 应该是 `duration-200 text-gray-500`）
2. 更重要的是，这个项目使用的是**内联样式（inline styles）**，而不是 Tailwind CSS
3. `DeleteButton` 组件使用了 Tailwind CSS 类名，但项目中没有配置 Tailwind CSS

## 解决方案

将 `DeleteButton.tsx` 从 Tailwind CSS 改为内联样式，与项目其他组件保持一致。

### 修改前（使用 Tailwind CSS）
```typescript
<button
  className={`
    p-2 rounded transition-all duration-200
    ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-600 hover:bg-red-50 active:bg-red-100'}
  `}
>
```

### 修改后（使用内联样式）
```typescript
const [isHovered, setIsHovered] = useState(false)

<button
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  style={{
    padding: '8px',
    background: isHovered && !disabled ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: disabled ? 'rgba(255, 255, 255, 0.3)' : isHovered ? '#ef4444' : 'rgba(255, 255, 255, 0.5)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
```

## 样式效果

### 默认状态
- 背景：透明
- 颜色：半透明白色 `rgba(255, 255, 255, 0.5)`
- 图标大小：20x20px

### 悬停状态
- 背景：淡红色 `rgba(239, 68, 68, 0.1)`
- 颜色：红色 `#ef4444`
- 过渡动画：0.2s

### 禁用状态
- 颜色：更淡的白色 `rgba(255, 255, 255, 0.3)`
- 鼠标样式：`not-allowed`
- 不响应悬停效果

## 测试步骤

1. 刷新浏览器页面（http://localhost:3000）
2. 以管理员身份登录
3. 打开"现有图谱"下拉菜单
4. 现在应该能清楚地看到删除按钮（垃圾桶图标）
5. 悬停时按钮应该变红色并有淡红色背景

## 文件修改

- `components/DeleteButton.tsx` - 从 Tailwind CSS 改为内联样式
