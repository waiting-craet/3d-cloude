# 节点间距更新至100单位

## 修改内容

已将所有节点之间的最小距离从20单位增加到100单位，这将使节点分布更加宽松。

## 修改的文件和参数

### 1. `lib/force-layout.ts` - 力导向布局默认配置
```typescript
const DEFAULT_CONFIG = {
  iterations: 100,        // 保持100次迭代
  springLength: 100,      // 从30增加到100（连接节点的理想距离）
  springStrength: 0.1,    // 保持不变
  repulsionStrength: 5000, // 从1000增加到5000（更强的排斥力）
  damping: 0.9,          // 保持不变
  minDistance: 100,      // 从20增加到100（最小节点距离）
}
```

### 2. `lib/coordinate-converter.ts` - 坐标转换默认配置
```typescript
// 默认最小距离从15改为100
const { heightVariation = 8, minNodeDistance = 100 } = config
```

### 3. `app/api/convert/route.ts` - 转换API配置
```typescript
// 坐标转换配置
convertTo3DCoordinates(node2d, nodes2d, {
  heightVariation: 8,
  minNodeDistance: 100,  // 从20改为100
})

// 距离强制配置
enforceMinimumDistance(convertedCoords, 100, 50)  // 从20改为100

// 力导向布局配置
applyForceLayout(nodePositions, layoutEdges, {
  iterations: 100,         // 从80增加到100
  springLength: 100,       // 从25增加到100
  springStrength: 0.08,    // 保持不变
  repulsionStrength: 5000, // 从800增加到5000
  damping: 0.85,          // 保持不变
  minDistance: 100,       // 从20增加到100
})
```

### 4. `app/api/graphs/[id]/sync/route.ts` - 同步API配置
```typescript
// 坐标转换配置
convertTo3DCoordinates(node2d, nodesToConvert, {
  heightVariation: 8,
  minNodeDistance: 100,  // 从20改为100
})

// 距离强制配置
enforceMinimumDistance(convertedCoords, 100, 50)  // 从20改为100

// 力导向布局配置
applyForceLayout(nodePositions, layoutEdges, {
  iterations: 100,         // 从80增加到100
  springLength: 100,       // 从25增加到100
  springStrength: 0.08,    // 保持不变
  repulsionStrength: 5000, // 从800增加到5000
  damping: 0.85,          // 保持不变
  minDistance: 100,       // 从20增加到100
})
```

## 参数调整说明

### 为什么增加排斥力强度？
- 最小距离从20增加到100（5倍）
- 排斥力从800/1000增加到5000（约5倍）
- 这样可以确保节点能够真正分散到100单位的距离

### 为什么增加弹簧长度？
- 弹簧长度从25/30增加到100
- 这样有连接的节点之间也会保持更大的距离
- 避免连接的节点聚集得太紧密

### 为什么增加迭代次数？
- 从80次增加到100次
- 更大的距离需要更多的迭代来达到稳定状态
- 确保布局充分优化

## 预期效果

### 视觉效果
- ✅ 节点之间的距离显著增加（5倍）
- ✅ 整体布局更加宽松、开阔
- ✅ 更容易看清单个节点
- ✅ 减少视觉拥挤感

### 性能影响
- ⚠️ 迭代次数增加可能稍微延长处理时间
- ⚠️ 更大的空间范围可能需要调整相机位置
- ℹ️ 对于大量节点（100+），布局时间可能增加20-30%

## 测试方法

1. **重新转换数据**
   - 在2D工作流页面编辑节点
   - 点击"转换为3D"按钮
   - 切换到3D视图查看效果

2. **观察控制台日志**
   ```
   🎯 开始力导向布局: X 个节点, Y 条边
      配置: 迭代=100, 弹簧长度=100, 排斥力=5000
      迭代 0: 总能量 = ...
      迭代 20: 总能量 = ...
      ...
   ✅ 力导向布局完成
   ```

3. **检查节点间距**
   - 所有节点之间应该至少相距100个单位
   - 即使有连接的节点也会保持较大距离
   - 整体布局应该非常宽松

## 可能需要的额外调整

### 如果节点太分散
可以考虑：
- 减少 `repulsionStrength`（比如改为3000）
- 减少 `springLength`（比如改为80）

### 如果相机视角不合适
可能需要调整 `components/KnowledgeGraph.tsx` 中的：
- 相机位置（更远）
- FOV（视野角度）
- 雾效范围

### 如果性能不佳
可以考虑：
- 减少 `iterations`（比如改为80）
- 对于大型图谱（200+节点），考虑分批处理

## 注意事项

⚠️ **重要**: 这个修改只影响新转换或新同步的数据。已经存在于数据库中的节点位置不会自动更新。

要看到新的间距效果，您需要：
1. 重新从2D转换到3D，或
2. 在2D页面修改后重新同步到3D

## 文件清单

### 修改的文件
- `lib/force-layout.ts` - 力导向布局算法
- `lib/coordinate-converter.ts` - 坐标转换器
- `app/api/convert/route.ts` - 转换API
- `app/api/graphs/[id]/sync/route.ts` - 同步API

---
**状态**: ✅ 完成
**日期**: 2026-01-18
**最小节点距离**: 20 → 100（增加5倍）
**排斥力强度**: 800/1000 → 5000（增加约5倍）
**弹簧长度**: 25/30 → 100（增加约4倍）
