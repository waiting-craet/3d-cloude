# 拖拽相机旋转问题修复

## 🐛 问题描述

**原问题**: 拖动节点时，相机也会跟着旋转，导致体验很差。

**原因**: OrbitControls 在拖拽节点时仍然处于激活状态，导致鼠标移动同时触发了节点拖拽和相机旋转。

## ✅ 解决方案

### 修复方法

通过正确地禁用和启用 OrbitControls 来解决：

1. **拖拽开始时**: 禁用 OrbitControls (`controls.enabled = false`)
2. **拖拽过程中**: OrbitControls 保持禁用状态
3. **拖拽结束时**: 重新启用 OrbitControls (`controls.enabled = true`)

### 技术实现

```typescript
// 在 GraphNodes 组件中
const { controls } = useThree()

const handleDragStart = () => {
  // 禁用 OrbitControls
  if (controls) {
    (controls as any).enabled = false
  }
}

const handleDragEnd = () => {
  // 重新启用 OrbitControls
  if (controls) {
    (controls as any).enabled = true
  }
}
```

### 代码改动

**修改文件**: `components/GraphNodes.tsx`

**主要变化**:
1. 添加 `onDragStart` 和 `onDragEnd` 回调到 Node 组件
2. 在 GraphNodes 组件中获取 `controls` 对象
3. 实现 `handleDragStart` 和 `handleDragEnd` 方法
4. 将这些方法传递给每个 Node 组件

## 🎯 预期效果

### 修复前 ❌
- 拖动节点时相机会旋转
- 无法精确控制节点位置
- 体验混乱

### 修复后 ✅
- ✅ 拖动节点时相机完全静止
- ✅ 可以精确拖动节点到任意位置
- ✅ 松开鼠标后相机控制立即恢复
- ✅ 流畅的拖拽体验

## 🧪 测试步骤

1. **刷新浏览器** (http://localhost:3000)
2. **测试拖拽**:
   - 将鼠标移到任意节点上
   - 按住鼠标左键
   - 移动鼠标
   - 观察：相机应该保持静止，只有节点在移动
3. **测试相机控制**:
   - 松开鼠标
   - 在空白处拖动鼠标
   - 观察：相机应该正常旋转

## 📊 对比测试

### 场景 1: 拖动节点
- **操作**: 按住节点并移动鼠标
- **修复前**: 节点移动 + 相机旋转（混乱）
- **修复后**: 只有节点移动（清晰）

### 场景 2: 旋转相机
- **操作**: 在空白处拖动鼠标
- **修复前**: 相机正常旋转
- **修复后**: 相机正常旋转（无变化）

### 场景 3: 拖拽后立即旋转
- **操作**: 拖动节点后立即旋转相机
- **修复前**: 可能卡顿或不响应
- **修复后**: 流畅切换

## 🔧 技术细节

### OrbitControls 控制

OrbitControls 是 Three.js 提供的相机控制器，通过 `enabled` 属性可以启用/禁用：

```typescript
// 禁用
controls.enabled = false  // 相机不响应鼠标操作

// 启用
controls.enabled = true   // 相机正常响应鼠标操作
```

### 事件流程

```
用户按下鼠标
  ↓
onPointerDown 触发
  ↓
调用 onDragStart()
  ↓
禁用 OrbitControls
  ↓
用户移动鼠标
  ↓
onPointerMove 触发
  ↓
只更新节点位置（相机不动）
  ↓
用户松开鼠标
  ↓
onPointerUp 触发
  ↓
调用 onDragEnd()
  ↓
启用 OrbitControls
  ↓
相机控制恢复正常
```

## 💡 为什么之前的方法不工作？

### 之前的尝试
```typescript
// ❌ 这个方法不工作
(gl.domElement as any).style.pointerEvents = 'none'
```

**问题**: 这会禁用整个 Canvas 的鼠标事件，导致：
- 节点的 `onPointerMove` 也无法触发
- 无法继续拖拽
- 鼠标事件完全丢失

### 正确的方法
```typescript
// ✅ 这个方法正确
controls.enabled = false
```

**优势**:
- 只禁用相机控制
- 节点的鼠标事件仍然正常工作
- 可以继续接收 `onPointerMove` 事件
- 拖拽流畅

## 🎉 修复完成

现在拖动节点时，相机会保持完全静止，提供完美的拖拽体验！

**立即测试**: 刷新浏览器并尝试拖动节点，你会发现相机不再跟着转动了！
