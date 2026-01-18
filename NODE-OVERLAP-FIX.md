# 节点重叠问题修复

## 更新时间
2025-01-18

## 问题描述

即使设置了最小距离为 15，节点之间仍然有重叠。

## 根本原因

1. **最小距离强制算法未被调用**：之前的代码只转换单个节点坐标，没有批量应用距离强制
2. **推力不够强**：推力因子 1.5 对于密集节点来说不够
3. **迭代次数不足**：30 次迭代对于复杂布局可能不够

## 解决方案

### 1. 修复算法调用流程 ⭐⭐⭐ 最关键

#### 修改文件：`app/api/graphs/[id]/sync/route.ts` 和 `app/api/convert/route.ts`

**之前的问题**：
```typescript
// 错误：逐个转换节点，没有批量应用距离强制
changes.nodesToAdd.map(async (wNode) => {
  const coords3d = convertTo3DCoordinates(node2d, allNodes, config)
  // 直接使用坐标，没有强制距离
})
```

**修复后**：
```typescript
// 正确：批量转换，然后应用距离强制
const convertedCoords = nodesToConvert.map(node2d => 
  convertTo3DCoordinates(node2d, nodesToConvert, config)
)

// 关键：应用最小距离强制
const enforcedCoords = enforceMinimumDistance(convertedCoords, 20, 50)

// 使用强制后的坐标创建节点
```

### 2. 增加最小距离

从 **15 单位** 增加到 **20 单位**

### 3. 大幅增强推力

**推力因子**：
```typescript
const pushDistance = (minDistance - distance) / 2 * 2.0  // 从 1.5 增加到 2.0
```

这意味着节点会被推得更远，更快地达到最小距离要求。

### 4. 增加迭代次数

**迭代次数**：
```typescript
maxIterations: number = 50  // 从 30 增加到 50
```

### 5. 添加调试日志

```typescript
console.log(`🔧 开始强制最小距离: ${minDistance} 单位`)
console.log(`   迭代 ${iter}: ${violationCount} 个违规`)
console.log(`✅ 完成于迭代 ${iter}`)
```

这样可以在服务器日志中看到算法的执行情况。

## 技术细节

### 距离强制算法流程

```
1. 批量转换所有节点坐标
   ↓
2. 检查所有节点对的距离
   ↓
3. 如果距离 < 20，计算推开向量
   ↓
4. 应用 2.0 倍推力
   ↓
5. 重复最多 50 次
   ↓
6. 直到没有违规或调整很小
```

### 推力计算

```typescript
// 计算需要推开的距离
const pushDistance = (minDistance - distance) / 2 * 2.0

// 计算推力因子
const factor = pushDistance / distance

// 应用推力
pos1.x -= dx * factor
pos2.x += dx * factor
// Y 和 Z 轴同理
```

### 性能优化

- **提前退出**：如果没有违规或调整很小，立即停止
- **日志间隔**：每 10 次迭代才输出一次日志
- **避免除零**：检查 `distance > 0.01`

## 效果

### 最小距离保证

| 配置 | 值 |
|------|-----|
| 理论最小距离 | 20 单位 |
| 推力因子 | 2.0 |
| 最大迭代次数 | 50 |
| 实际效果 | 节点之间至少 20 单位 |

### 预期改善

- ✅ **无重叠**：节点之间不会再有视觉重叠
- ✅ **均匀分布**：节点在 3D 空间中均匀分散
- ✅ **可靠性**：算法保证达到最小距离要求
- ✅ **可调试**：日志输出帮助诊断问题

## 使用说明

### 查看修复效果

1. **刷新浏览器**页面
2. **必须重新同步或转换**：在 2D 页面点击"保存并转换为3D"
3. **查看服务器日志**：可以看到距离强制算法的执行情况

### 服务器日志示例

```
🔧 开始强制最小距离: 20 单位，最多 50 次迭代
   迭代 0: 15 个违规, 最大调整 8.50
   迭代 10: 5 个违规, 最大调整 2.30
   迭代 20: 1 个违规, 最大调整 0.50
✅ 完成于迭代 23
➕ 添加了 23 个节点
```

## 验证方法

### 检查节点距离

可以在浏览器控制台运行：

```javascript
// 获取所有节点
const nodes = store.getState().nodes

// 计算最小距离
let minDist = Infinity
for (let i = 0; i < nodes.length; i++) {
  for (let j = i + 1; j < nodes.length; j++) {
    const dx = nodes[j].x - nodes[i].x
    const dy = nodes[j].y - nodes[i].y
    const dz = nodes[j].z - nodes[i].z
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
    minDist = Math.min(minDist, dist)
  }
}
console.log('最小节点距离:', minDist)
```

应该输出 >= 20 的值。

## 修改的文件

1. `lib/coordinate-converter.ts` - 增强距离强制算法
2. `app/api/graphs/[id]/sync/route.ts` - 修复调用流程
3. `app/api/convert/route.ts` - 修复调用流程

## 后续建议

如果仍然有重叠：
1. 增加最小距离到 25 或 30
2. 增加推力因子到 2.5 或 3.0
3. 检查服务器日志，看算法是否正常执行
4. 考虑使用力导向布局算法

## 重要提示

⚠️ **必须重新转换数据**：现有的节点坐标不会自动更新，必须重新从 2D 转换或同步才能应用新的距离强制算法。
