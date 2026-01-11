# 拖拽断触问题修复

## 🐛 问题描述

**原问题**: 拖动小球时经常出现断触现象，鼠标移动太快时拖拽会中断。

**原因**: 
- 之前的实现只监听节点本身的 `onPointerMove` 事件
- 当鼠标移动太快时，会离开节点的碰撞区域
- 一旦离开节点，`onPointerMove` 就不再触发
- 导致拖拽中断

## ✅ 解决方案

### 核心改进

将拖拽事件监听从**节点本身**改为**全局 window**：

```typescript
// ❌ 之前：只监听节点的事件
<mesh onPointerMove={handlePointerMove} />

// ✅ 现在：监听全局 window 事件
useEffect(() => {
  window.addEventListener('pointermove', handleGlobalPointerMove)
  window.addEventListener('pointerup', handleGlobalPointerUp)
}, [isPressed, isDraggingRef.current])
```

### 技术实现

#### 1. 使用全局事件监听
```typescript
useEffect(() => {
  const handleGlobalPointerMove = (e: PointerEvent) => {
    if (!isDraggingRef.current) return
    // 拖拽逻辑...
  }

  const handleGlobalPointerUp = () => {
    // 结束拖拽...
  }

  if (isPressed || isDraggingRef.current) {
    window.addEventListener('pointermove', handleGlobalPointerMove)
    window.addEventListener('pointerup', handleGlobalPointerUp)
  }

  return () => {
    window.removeEventListener('pointermove', handleGlobalPointerMove)
    window.removeEventListener('pointerup', handleGlobalPointerUp)
  }
}, [isPressed, isDraggingRef.current])
```

#### 2. 使用 ref 追踪拖拽状态
```typescript
const isDraggingRef = useRef(false)  // 本地 ref，更快响应

// 开始拖拽
isDraggingRef.current = true
setIsDragging(true)  // 同时更新全局状态

// 结束拖拽
isDraggingRef.current = false
setIsDragging(false)
```

#### 3. 优化时间参数
```typescript
// 长按时间：100ms（0.1秒）
setTimeout(() => {
  isDraggingRef.current = true
  setIsDragging(true)
}, 100)
```

## 🎯 改进效果

### 修复前 ❌
- 鼠标移动太快时拖拽中断
- 需要小心翼翼地慢慢拖动
- 体验不流畅

### 修复后 ✅
- ✅ 鼠标可以快速移动
- ✅ 即使离开节点也能继续拖拽
- ✅ 拖拽过程流畅不中断
- ✅ 可以拖到屏幕任意位置

## 📊 工作原理

### 事件流程

```
1. 按下节点
   ↓
2. 100ms 后进入拖拽模式
   ↓
3. 全局监听 window.pointermove
   ↓
4. 鼠标移动（即使离开节点）
   ↓
5. 持续更新节点位置
   ↓
6. 松开鼠标（anywhere）
   ↓
7. 结束拖拽，移除监听
```

### 关键点

1. **全局监听**: 鼠标在屏幕任何位置都能响应
2. **ref 追踪**: 使用 `isDraggingRef` 快速判断状态
3. **自动清理**: useEffect 返回清理函数，避免内存泄漏

## 🧪 测试步骤

### 测试 1: 快速拖动
```
1. 刷新浏览器 (Ctrl+F5)
2. 按住节点 0.1 秒
3. 快速移动鼠标
4. 观察：节点应该流畅跟随
```

### 测试 2: 离开节点
```
1. 按住节点开始拖拽
2. 快速移动鼠标离开节点
3. 继续移动鼠标
4. 观察：拖拽不应该中断
```

### 测试 3: 大范围移动
```
1. 按住节点
2. 从屏幕左侧拖到右侧
3. 观察：全程流畅，无断触
```

### 测试 4: 松开鼠标
```
1. 拖动节点
2. 在屏幕任意位置松开鼠标
3. 观察：拖拽正确结束
```

## 💡 使用技巧

### 快速调整布局
- 现在可以快速拖动节点
- 不需要小心翼翼
- 大胆移动鼠标

### 精确定位
- 按住 0.1 秒后开始拖拽
- 快速移动到大致位置
- 松开后微调

### 批量调整
- 快速拖动多个节点
- 不用担心断触
- 效率大幅提升

## 🔍 技术细节

### 为什么使用 window 事件？

**节点事件的局限**:
```typescript
// ❌ 问题：鼠标离开节点后不再触发
<mesh onPointerMove={handleMove} />
```

**全局事件的优势**:
```typescript
// ✅ 优势：鼠标在任何位置都能触发
window.addEventListener('pointermove', handleMove)
```

### 为什么使用 ref？

**状态更新有延迟**:
```typescript
// ❌ 问题：setState 是异步的
setIsDragging(true)
// 这里 isDragging 可能还是 false
```

**ref 立即生效**:
```typescript
// ✅ 优势：ref 是同步的
isDraggingRef.current = true
// 这里立即可用
```

### 内存泄漏防护

```typescript
useEffect(() => {
  // 添加监听
  window.addEventListener('pointermove', handler)
  
  // 清理函数：组件卸载或依赖变化时执行
  return () => {
    window.removeEventListener('pointermove', handler)
  }
}, [dependencies])
```

## 📝 代码对比

### 之前的实现
```typescript
// ❌ 只监听节点事件
<mesh
  onPointerMove={(e) => {
    // 鼠标离开节点后不再触发
    if (isDragging) {
      updatePosition(e)
    }
  }}
/>
```

### 现在的实现
```typescript
// ✅ 监听全局事件
useEffect(() => {
  const handleMove = (e) => {
    // 鼠标在任何位置都能触发
    if (isDraggingRef.current) {
      updatePosition(e)
    }
  }
  
  window.addEventListener('pointermove', handleMove)
  return () => window.removeEventListener('pointermove', handleMove)
}, [isDraggingRef.current])
```

## 🎉 完成！

现在拖拽功能已经完全优化：
- ✅ 无断触现象
- ✅ 快速移动流畅
- ✅ 可以拖到任意位置
- ✅ 完美的用户体验

**立即体验**: 刷新浏览器（Ctrl+F5）并快速拖动节点！
