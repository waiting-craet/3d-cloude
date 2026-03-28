# 节点间距更新至1000单位

## 概述
已将所有节点之间的最小距离从100单位大幅增加到1000单位（10倍），这将使连线显著变长，节点分布更加宽松。

## 修改的参数

### 关键变化对比

| 参数 | 之前值 | 现在值 | 变化倍数 |
|------|--------|--------|----------|
| 最小距离 (minDistance) | 100 | 1000 | 10x |
| 弹簧长度 (springLength) | 100 | 1000 | 10x |
| 排斥力强度 (repulsionStrength) | 5,000 | 50,000 | 10x |
| 弹簧强度 (springStrength) | 0.08 | 0.05 | 0.625x |
| 迭代次数 (iterations) | 100 | 120 | 1.2x |

## 详细配置

### 1. `lib/force-layout.ts` - 默认配置
```typescript
const DEFAULT_CONFIG = {
  iterations: 120,          // 增加到120次（需要更多迭代来稳定）
  springLength: 1000,       // 连接节点的理想距离：1000单位
  springStrength: 0.05,     // 降低弹簧强度（避免过度拉扯）
  repulsionStrength: 50000, // 大幅增加排斥力（10倍）
  damping: 0.9,            // 保持不变
  minDistance: 1000,       // 最小节点距离：1000单位
}
```

### 2. `lib/coordinate-converter.ts`
```typescript
// 默认最小距离：1000
const { heightVariation = 8, minNodeDistance = 1000 } = config
```

### 3. `app/api/convert/route.ts`
```typescript
// 坐标转换
convertTo3DCoordinates(node2d, nodes2d, {
  heightVariation: 8,
  minNodeDistance: 1000,
})

// 距离强制
enforceMinimumDistance(convertedCoords, 1000, 50)

// 力导向布局
applyForceLayout(nodePositions, layoutEdges, {
  iterations: 120,
  springLength: 1000,
  springStrength: 0.05,
  repulsionStrength: 50000,
  damping: 0.85,
  minDistance: 1000,
})
```

### 4. `app/api/graphs/[id]/sync/route.ts`
```typescript
// 相同的配置应用于同步API
```

## 参数调整原理

### 为什么大幅增加排斥力？
- 最小距离增加10倍（100 → 1000）
- 排斥力也需要增加10倍（5000 → 50000）
- 确保节点能够真正推开到1000单位的距离
- 物理模拟中，排斥力与距离的平方成反比

### 为什么降低弹簧强度？
- 弹簧长度增加10倍（100 → 1000）
- 如果保持相同的弹簧强度，拉力会过大
- 降低到0.05可以让连接更自然
- 避免连接的节点被过度拉扯

### 为什么增加迭代次数？
- 更大的距离需要更多时间达到平衡
- 从100增加到120（增加20%）
- 确保布局充分收敛到稳定状态

## 预期效果

### 视觉效果
- ✅ 节点之间距离非常大（1000单位）
- ✅ 连线显著变长
- ✅ 整体布局极其宽松、开阔
- ✅ 每个节点都有充足的空间
- ✅ 适合展示大型、复杂的知识图谱

### 空间范围
- ⚠️ 整个图谱的空间范围会非常大
- ⚠️ 可能需要调整相机位置和视野
- ⚠️ 10个节点的图谱可能跨越10,000+单位的空间
- ⚠️ 需要更多的缩放和平移来浏览

### 性能影响
- ⚠️ 迭代次数增加20%，处理时间略有增加
- ⚠️ 更大的空间可能影响渲染性能
- ℹ️ 对于50个节点，布局时间约增加30-40%
- ℹ️ 对于100+节点，可能需要5-10秒完成布局

## 可能需要的相机调整

由于节点分布范围大幅增加，可能需要调整 `components/KnowledgeGraph.tsx`：

```typescript
// 建议的相机配置
<PerspectiveCamera
  makeDefault
  position={[-400, 200, 500]}  // 相机距离更远
  fov={90}                      // 更大的视野角度
/>

// 建议的雾效配置
<fog attach="fog" args={['#000000', 100, 5000]} />  // 更远的雾效范围
```

## 测试方法

### 1. 重新转换数据
```
1. 打开 http://localhost:3000
2. 进入2D工作流页面
3. 编辑或创建节点
4. 点击"转换为3D"
5. 切换到3D视图
```

### 2. 观察控制台日志
```
🎯 开始力导向布局: X 个节点, Y 条边
   配置: 迭代=120, 弹簧长度=1000, 排斥力=50000
   迭代 0: 总能量 = ...
   迭代 20: 总能量 = ...
   迭代 40: 总能量 = ...
   ...
   迭代 100: 总能量 = ...
✅ 力导向布局完成
```

### 3. 检查效果
- 使用鼠标滚轮缩小视图
- 观察节点之间的距离
- 检查连线长度
- 确认没有节点重叠

## 适用场景

### 最适合
- ✅ 节点数量较少（10-30个）
- ✅ 需要清晰展示每个节点的细节
- ✅ 强调节点之间的独立性
- ✅ 大屏幕展示或演示场景

### 可能不适合
- ❌ 节点数量很多（100+个）
- ❌ 需要在一个视图中看到全部节点
- ❌ 小屏幕设备
- ❌ 需要快速浏览整体结构

## 如果效果不理想

### 节点太分散，难以浏览
可以考虑：
- 减少 `minDistance` 到 500 或 700
- 减少 `springLength` 到 500 或 700
- 减少 `repulsionStrength` 到 25000 或 30000

### 连线太长，不美观
可以考虑：
- 减少 `springLength` 到 600-800
- 增加 `springStrength` 到 0.08
- 这样连接的节点会更靠近

### 性能问题
可以考虑：
- 减少 `iterations` 到 80-100
- 对于大型图谱，考虑分批处理
- 优化渲染设置

### 相机视角不合适
调整 `components/KnowledgeGraph.tsx`：
- 增加相机距离（position z值）
- 增加FOV（视野角度）
- 调整雾效范围

## 回退方案

如果1000单位太大，可以尝试中间值：

### 方案A: 500单位（中等间距）
```typescript
minDistance: 500
springLength: 500
repulsionStrength: 25000
springStrength: 0.06
iterations: 110
```

### 方案B: 300单位（适中间距）
```typescript
minDistance: 300
springLength: 300
repulsionStrength: 15000
springStrength: 0.07
iterations: 100
```

## 注意事项

⚠️ **重要提示**:
1. 这个修改只影响新转换或新同步的数据
2. 已存在的节点位置不会自动更新
3. 需要重新转换才能看到新的间距效果
4. 可能需要调整相机设置以适应更大的空间范围

## 文件清单

### 修改的文件
- `lib/force-layout.ts` - 力导向布局算法
- `lib/coordinate-converter.ts` - 坐标转换器
- `app/api/convert/route.ts` - 转换API
- `app/api/graphs/[id]/sync/route.ts` - 同步API

### 可能需要调整的文件
- `components/KnowledgeGraph.tsx` - 相机和雾效设置

---
**状态**: ✅ 完成
**日期**: 2026-01-18
**最小节点距离**: 100 → 1000（增加10倍）
**排斥力强度**: 5,000 → 50,000（增加10倍）
**弹簧长度**: 100 → 1000（增加10倍）
**连线长度**: 显著增加，更加清晰可见
