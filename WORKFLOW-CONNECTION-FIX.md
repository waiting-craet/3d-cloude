# 二维工作流连线功能修复

## 问题描述

用户报告二维页面中的连线功能存在问题，无法正常连线。

## 问题分析

经过代码审查，发现了以下问题：

### 1. SVG 连接线无法接收鼠标事件

**问题代码：**
```tsx
<svg style={{
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',  // ❌ 阻止了所有鼠标事件
  overflow: 'visible',
}}>
```

**影响：**
- 连接线无法被点击
- 双击编辑连接线标签功能失效
- 悬停高亮效果无法触发

### 2. 连接点位置计算使用了错误的尺寸

**问题代码：**
```tsx
// 在 handleMouseMove 中
const rightPointX = node.x + node.width  // ❌ 使用初始宽度（200px）
const rightPointY = node.y + node.height / 2  // ❌ 使用初始高度（100px）
```

**影响：**
- 节点实际渲染尺寸与初始尺寸不同（特别是有媒体内容时）
- 连接点位置计算不准确
- 拖拽连线时无法正确检测目标节点

## 修复内容

### 1. 修复 SVG 鼠标事件

**修改文件：** `3d-cloude/components/WorkflowCanvas.tsx`

```tsx
<svg style={{
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'auto',  // ✅ 允许SVG接收鼠标事件
  overflow: 'visible',
}}>
```

**效果：**
- ✅ 连接线可以被点击
- ✅ 双击编辑功能恢复
- ✅ 悬停高亮效果正常工作

### 2. 修复连接点位置计算

**修改文件：** `3d-cloude/components/WorkflowCanvas.tsx`

```tsx
// 在 handleMouseMove 中
nodes.forEach(node => {
  if (node.id === connectingFrom) return
  
  // ✅ 使用实际渲染尺寸
  const actualWidth = node.actualWidth || node.width
  const actualHeight = node.actualHeight || node.height
  
  // 计算到右侧连接点的距离
  const rightPointX = node.x + actualWidth
  const rightPointY = node.y + actualHeight / 2
  // ...
  
  // 计算到左侧连接点的距离
  const leftPointX = node.x
  const leftPointY = node.y + actualHeight / 2
  // ...
})
```

**效果：**
- ✅ 连接点位置准确
- ✅ 拖拽连线时正确检测目标节点
- ✅ 支持动态尺寸的节点（包含图片/视频）

## 技术细节

### ResizeObserver 机制

组件使用 `ResizeObserver` 来跟踪节点的实际渲染尺寸：

```tsx
useEffect(() => {
  const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const nodeElement = entry.target as HTMLDivElement
      const nodeId = nodeElement.dataset.nodeId
      
      if (nodeId) {
        const { width, height } = entry.contentRect
        
        // 更新节点状态，记录实际尺寸
        updateNodeDimensions(nodeId, {
          actualWidth: width,
          actualHeight: height
        })
      }
    })
  })
  
  // 观察所有节点元素
  nodeRefsMap.current.forEach((element, nodeId) => {
    if (element) {
      resizeObserver.observe(element)
    }
  })
  
  return () => {
    resizeObserver.disconnect()
  }
}, [nodes])
```

### 连接点位置计算

连接点位置使用 `calculateConnectionPoint` 函数计算：

```tsx
const calculateConnectionPoint = (node: Node, side: 'left' | 'right'): ConnectionPointPosition => {
  // 优先使用实际渲染尺寸
  const actualHeight = node.actualHeight || node.height
  const actualWidth = node.actualWidth || node.width
  
  if (side === 'right') {
    return {
      x: node.x + actualWidth,
      y: node.y + actualHeight / 2,
      side: 'right'
    }
  } else {
    return {
      x: node.x,
      y: node.y + actualHeight / 2,
      side: 'left'
    }
  }
}
```

## 测试步骤

### 1. 测试基本连线功能

1. 打开二维工作流页面
2. 创建两个节点
3. 点击第一个节点的连接点（右侧或左侧的 ⊕ 按钮）
4. 拖动鼠标到第二个节点
5. 当鼠标接近第二个节点时，连接点应该变绿并放大
6. 释放鼠标，连接线应该成功创建

### 2. 测试连接线交互

1. 创建一条连接线
2. 将鼠标悬停在连接线上
3. 连接线应该变粗并变色（蓝色高亮）
4. 双击连接线
5. 应该弹出编辑对话框
6. 输入标签文字并点击"确定"
7. 标签应该显示在连接线中间

### 3. 测试动态尺寸节点

1. 创建一个节点
2. 双击节点进入编辑模式
3. 上传一张图片或视频
4. 完成编辑
5. 节点尺寸应该自动调整
6. 创建连接线到这个节点
7. 连接点位置应该在节点中心高度

### 4. 测试连接线删除

1. 双击连接线打开编辑对话框
2. 点击"删除"按钮
3. 连接线应该被删除

## 预期结果

- ✅ 连接点可以正常点击和拖拽
- ✅ 连接线可以成功创建
- ✅ 连接线可以被悬停高亮
- ✅ 连接线可以被双击编辑
- ✅ 连接线标签可以正常显示
- ✅ 连接点位置在节点中心高度
- ✅ 支持动态尺寸的节点（包含媒体内容）

## 相关文件

- `3d-cloude/components/WorkflowCanvas.tsx` - 主要修复文件
  - SVG `pointerEvents` 属性修改
  - `handleMouseMove` 中的连接点位置计算修复

## 注意事项

1. **SVG 事件层级**：SVG 设置为 `pointerEvents: 'auto'` 后，需要确保不会干扰节点的拖拽。通过在 `handleMouseDown` 中检查 `closest('.workflow-node')` 来避免冲突。

2. **实际尺寸回退**：使用 `node.actualWidth || node.width` 确保在 ResizeObserver 还没有测量到尺寸时，使用初始值作为回退。

3. **连接缓存失效**：当节点尺寸改变时，需要清除连接线的缓存点位置，强制重新计算。这通过 `useEffect` 监听节点尺寸变化来实现。

## 后续优化建议

1. **性能优化**：考虑使用 `requestAnimationFrame` 来优化连线拖拽时的渲染性能
2. **视觉反馈**：增强连接点的视觉反馈，例如添加脉冲动画
3. **连接验证**：添加连接规则验证，防止创建无效的连接（例如自连接）
4. **撤销/重做**：实现连接操作的撤销/重做功能
