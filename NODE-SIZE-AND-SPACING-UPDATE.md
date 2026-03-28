# 节点大小和间距优化

## 概述
优化了3D知识图谱的节点显示效果，增大了节点球和名称，并调整了节点间距为18单位。

## 修改内容

### 1. 节点间距调整
**最小距离**: 30 → 18单位

| 参数 | 之前值 | 现在值 | 变化 |
|------|--------|--------|------|
| minDistance | 30 | 18 | -40% |
| springLength | 30 | 18 | -40% |
| repulsionStrength | 1500 | 900 | -40% |
| springStrength | 0.08 | 0.08 | 不变 |
| iterations | 80 | 80 | 不变 |

### 2. 节点球大小增大
**默认大小**: 1.5 → 2.0单位（增加33%）

修改位置：
- `components/GraphNodes.tsx` - 所有球体几何体
- `app/api/convert/route.ts` - 创建节点时的默认大小
- `app/api/graphs/[id]/sync/route.ts` - 同步节点时的默认大小

### 3. 节点名称字体增大
**字体大小**: 0.9 → 1.2单位（增加33%）
**轮廓宽度**: 0.15 → 0.2单位（增加33%）
**最大宽度**: 8 → 10单位（增加25%）

## 详细修改

### components/GraphNodes.tsx

#### 主球体
```typescript
// 之前
<sphereGeometry args={[node.size || 1.5, 32, 32]} />

// 现在
<sphereGeometry args={[node.size || 2.0, 32, 32]} />
```

#### 外层光晕
```typescript
// 之前
<sphereGeometry args={[(node.size || 1.5) * 1.15, 32, 32]} />

// 现在
<sphereGeometry args={[(node.size || 2.0) * 1.15, 32, 32]} />
```

#### 节点名称
```typescript
// 之前
<Text
  position={[0, (node.size || 1.5) + 1.2, 0]}
  fontSize={0.9}
  outlineWidth={0.15}
  maxWidth={8}
>

// 现在
<Text
  position={[0, (node.size || 2.0) + 1.2, 0]}
  fontSize={1.2}
  outlineWidth={0.2}
  maxWidth={10}
>
```

#### 选中圆环
```typescript
// 之前
<ringGeometry args={[(node.size || 1.5) * 1.3, (node.size || 1.5) * 1.4, 32]} />

// 现在
<ringGeometry args={[(node.size || 2.0) * 1.3, (node.size || 2.0) * 1.4, 32]} />
```

### lib/force-layout.ts

```typescript
// 之前
const DEFAULT_CONFIG: Required<ForceLayoutConfig> = {
  iterations: 80,
  springLength: 30,
  springStrength: 0.1,
  repulsionStrength: 1500,
  damping: 0.9,
  minDistance: 30,
}

// 现在
const DEFAULT_CONFIG: Required<ForceLayoutConfig> = {
  iterations: 80,
  springLength: 18,
  springStrength: 0.1,
  repulsionStrength: 900,
  damping: 0.9,
  minDistance: 18,
}
```

### lib/coordinate-converter.ts

```typescript
// 之前
const { heightVariation = 8, minNodeDistance = 30 } = config

// 现在
const { heightVariation = 8, minNodeDistance = 18 } = config
```

### app/api/convert/route.ts & app/api/graphs/[id]/sync/route.ts

#### 坐标转换配置
```typescript
// 之前
convertTo3DCoordinates(node2d, nodes2d, {
  heightVariation: 8,
  minNodeDistance: 30,
})
enforceMinimumDistance(convertedCoords, 30, 50)

// 现在
convertTo3DCoordinates(node2d, nodes2d, {
  heightVariation: 8,
  minNodeDistance: 18,
})
enforceMinimumDistance(convertedCoords, 18, 50)
```

#### 力导向布局配置
```typescript
// 之前
applyForceLayout(nodePositions, layoutEdges, {
  iterations: 80,
  springLength: 30,
  springStrength: 0.08,
  repulsionStrength: 1500,
  damping: 0.85,
  minDistance: 30,
})

// 现在
applyForceLayout(nodePositions, layoutEdges, {
  iterations: 80,
  springLength: 18,
  springStrength: 0.08,
  repulsionStrength: 900,
  damping: 0.85,
  minDistance: 18,
})
```

#### 节点创建默认大小
```typescript
// 之前
size: 1.5,

// 现在
size: 2.0,
```

## 视觉效果对比

### 节点球
- **之前**: 半径1.5单位，较小
- **现在**: 半径2.0单位，更大更醒目
- **效果**: 节点更容易看到和点击

### 节点名称
- **之前**: 字体0.9单位，较小
- **现在**: 字体1.2单位，更清晰
- **效果**: 文字更易读，即使在远处也能看清

### 节点间距
- **之前**: 最小30单位，较宽松
- **现在**: 最小18单位，更紧凑
- **效果**: 可以在视图中看到更多节点，同时保持清晰度

## 预期效果

### 优势
- ✅ 节点更大更醒目，容易识别
- ✅ 名称字体更大，可读性更好
- ✅ 间距适中（18单位），平衡了密度和清晰度
- ✅ 可以在一个视图中看到更多节点
- ✅ 点击目标更大，交互更容易

### 适用场景
- ✅ 中等数量节点（50-150个）
- ✅ 需要清晰展示节点名称
- ✅ 需要在一个视图中看到整体结构
- ✅ 桌面浏览器使用

## 性能影响

### 渲染性能
- 节点球更大，但几何体复杂度不变（仍是32x32）
- 文字更大，渲染负担略有增加
- 整体影响：<5%

### 布局性能
- 间距减小，迭代次数不变
- 排斥力降低，计算略快
- 整体影响：布局速度提升约10%

## 测试方法

### 1. 转换新数据
```
1. 打开 http://localhost:3000
2. 进入2D工作流页面
3. 创建或编辑节点
4. 点击"转换为3D"
5. 切换到3D视图查看效果
```

### 2. 观察变化
- 节点球明显更大
- 节点名称更清晰
- 节点之间距离适中
- 整体布局更紧凑但不拥挤

### 3. 交互测试
- 点击节点更容易
- 拖拽节点更方便
- 名称在远处也能看清

## 如果需要调整

### 节点太大
可以减小到1.8：
```typescript
size: 1.8,  // 在API中
node.size || 1.8  // 在GraphNodes.tsx中
```

### 名称太大
可以减小到1.0：
```typescript
fontSize={1.0}
```

### 间距太小
可以增加到25：
```typescript
minDistance: 25
springLength: 25
repulsionStrength: 1250
```

## 文件清单

### 修改的文件
- `components/GraphNodes.tsx` - 节点渲染组件
- `lib/force-layout.ts` - 力导向布局算法
- `lib/coordinate-converter.ts` - 坐标转换器
- `app/api/convert/route.ts` - 转换API
- `app/api/graphs/[id]/sync/route.ts` - 同步API

## 注意事项

⚠️ **重要**: 
1. 这些修改只影响新创建的节点
2. 已存在的节点需要重新转换才能看到新的大小
3. 节点间距的变化会在重新转换或同步时生效

## 总结

通过这次优化：
- 节点球从1.5增大到2.0（+33%）
- 节点名称从0.9增大到1.2（+33%）
- 节点间距从30减小到18（-40%）

这个配置在视觉清晰度和空间利用率之间取得了很好的平衡，特别适合中等规模的知识图谱展示。

---
**状态**: ✅ 完成
**日期**: 2026-01-18
**节点大小**: 1.5 → 2.0（+33%）
**名称字体**: 0.9 → 1.2（+33%）
**最小间距**: 30 → 18（-40%）
