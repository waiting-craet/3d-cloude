# 加载状态功能实现总结

## 概述
为项目添加了"正在加载中"的提示功能，提升用户体验。当加载项目、图谱、节点数据时，会显示友好的加载动画和提示信息。

## 实现的功能

### 1. 通用加载组件 (LoadingSpinner)
创建了一个可复用的加载组件 `components/LoadingSpinner.tsx`

**特性：**
- 旋转的加载动画
- 可自定义主消息和副消息
- 支持全屏和局部显示模式
- 半透明黑色背景遮罩
- 白色卡片样式的加载提示框

**使用方式：**
```tsx
<LoadingSpinner 
  message="正在加载中..." 
  submessage="可选的副标题"
  fullScreen={true}
/>
```

### 2. 项目图谱管理器加载状态
在 `components/ProjectGraphManager.tsx` 中添加了加载状态

**加载场景：**
- 加载所有项目列表
- 加载项目的图谱列表
- 加载图谱的节点列表

**实现方式：**
- 使用 `loading` 状态控制显示
- 在所有异步操作中设置加载状态
- 添加错误提示，提升用户体验

### 3. 知识图谱加载状态
在 `components/KnowledgeGraph.tsx` 中添加了加载状态

**加载场景：**
- 加载3D知识图谱数据
- 加载2D知识图谱数据
- 切换图谱时的数据加载

**实现方式：**
- 从 store 中获取 `isLoading` 状态
- 显示图谱名称作为副标题
- 全屏遮罩确保用户等待加载完成

### 4. Store 状态管理增强
在 `lib/store.ts` 中添加了全局加载状态

**新增状态：**
- `isLoading: boolean` - 全局加载状态
- `setIsLoading: (isLoading: boolean) => void` - 设置加载状态

**更新的方法：**
- `fetchGraph()` - 加载图谱数据时显示加载状态
- `switchGraph()` - 切换图谱时显示加载状态

## 视觉效果

### 加载动画
- 蓝色旋转圆环 (12px 宽度)
- 平滑的旋转动画
- 居中显示

### 加载提示框
- 白色背景，圆角设计
- 阴影效果，突出显示
- 垂直居中布局
- 主标题：大号字体，深灰色
- 副标题：小号字体，浅灰色

### 背景遮罩
- 半透明黑色背景 (50% 透明度)
- 全屏覆盖
- 防止用户在加载时进行其他操作

## 用户体验改进

1. **明确的反馈**：用户知道系统正在处理请求
2. **防止误操作**：加载时禁用其他交互
3. **友好的提示**：显示正在加载的内容名称
4. **统一的风格**：所有加载状态使用相同的视觉设计
5. **错误处理**：加载失败时显示友好的错误提示

## 技术细节

### 状态管理
- 使用 Zustand 进行全局状态管理
- 在异步操作前后设置加载状态
- 确保错误情况下也能正确重置状态

### 组件设计
- 可复用的 LoadingSpinner 组件
- 支持自定义消息和显示模式
- 使用 Tailwind CSS 进行样式设计

### 性能优化
- 加载状态仅在必要时显示
- 使用 CSS 动画而非 JavaScript 动画
- 最小化重渲染

## 使用示例

### 在新组件中使用

```tsx
import LoadingSpinner from './LoadingSpinner'
import { useGraphStore } from '@/lib/store'

function MyComponent() {
  const { isLoading } = useGraphStore()
  
  return (
    <div>
      {isLoading && <LoadingSpinner message="加载中..." />}
      {/* 其他内容 */}
    </div>
  )
}
```

### 手动控制加载状态

```tsx
const { setIsLoading } = useGraphStore()

async function loadData() {
  setIsLoading(true)
  try {
    await fetchData()
  } finally {
    setIsLoading(false)
  }
}
```

## 未来改进建议

1. **进度条**：对于长时间加载，显示具体进度
2. **骨架屏**：使用骨架屏代替加载动画
3. **取消操作**：允许用户取消长时间的加载操作
4. **加载时间提示**：显示预计加载时间
5. **离线提示**：网络断开时显示特殊提示

## 测试建议

1. 测试各种加载场景
2. 测试网络慢速情况
3. 测试加载失败情况
4. 测试快速切换操作
5. 测试移动端显示效果
