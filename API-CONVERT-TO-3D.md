# 2D到3D图谱转换API文档

## 概述

此API端点将2D工作流图谱转换为3D知识图谱，使用先进的布局算法优化节点分布，消除重叠，并提供高质量的3D可视化效果。

## 端点

```
POST /api/graphs/[graphId]/convert-to-3d
```

## 请求参数

### URL参数

- `graphId` (string, required): 要转换的图谱ID

### 请求体 (JSON, optional)

```typescript
{
  strategy?: 'hierarchical' | 'radial' | 'force_directed' | 'grid' | 'spherical',
  config?: {
    heightVariation?: number,      // Y轴变化范围，默认8
    minNodeDistance?: number,      // 最小节点间距，默认18
    iterations?: number,           // 力模拟迭代次数，默认80
    springLength?: number,         // 弹簧长度，默认18
    repulsionStrength?: number,    // 排斥力强度，默认900
    damping?: number,              // 阻尼系数，默认0.9
    convergenceThreshold?: number, // 收敛阈值，默认0.01
    batchSize?: number,            // 批处理大小，默认15
    batchDelay?: number            // 批次延迟（毫秒），默认100
  }
}
```

### 布局策略说明

- `hierarchical`: 层级布局 - 适用于有向无环图（DAG）
- `radial`: 径向布局 - 适用于有明显中心节点的图谱
- `force_directed`: 力导向布局 - 适用于密集图谱（默认推荐）
- `grid`: 网格布局 - 适用于稀疏大图
- `spherical`: 球形布局 - 适用于完全连接图

如果不指定策略，系统会根据图谱特征自动选择最合适的策略。

## 响应格式

### 成功响应 (200 OK)

```json
{
  "success": true,
  "nodes": [
    {
      "id": "node-1",
      "x2d": 100,
      "y2d": 200,
      "x3d": 150.5,
      "y3d": 12.3,
      "z3d": 220.8,
      "label": "Node 1"
    }
  ],
  "qualityMetrics": {
    "nodeDistanceStdDev": 15.2,
    "edgeLengthStdDev": 8.5,
    "spatialUniformity": 0.85,
    "spaceUtilization": 0.72,
    "overlapCount": 0,
    "qualityScore": 92.5
  },
  "strategy": "force_directed",
  "processingTime": 1250
}
```

### 错误响应

#### 400 Bad Request - 无效的graphId
```json
{
  "success": false,
  "error": "Invalid graphId",
  "details": "graphId must be a non-empty string"
}
```

#### 404 Not Found - 图谱不存在
```json
{
  "success": false,
  "error": "Graph not found"
}
```

#### 504 Gateway Timeout - 转换超时
```json
{
  "success": false,
  "error": "Conversion timeout: The graph is too large or complex"
}
```

#### 503 Service Unavailable - 数据库连接错误
```json
{
  "success": false,
  "error": "Database connection error"
}
```

#### 500 Internal Server Error - 其他错误
```json
{
  "success": false,
  "error": "Database error: ...",
  "details": "..." // 仅在开发环境中显示
}
```

## 使用示例

### 基本使用（自动选择策略）

```bash
curl -X POST http://localhost:3000/api/graphs/abc123/convert-to-3d \
  -H "Content-Type: application/json"
```

### 指定布局策略

```bash
curl -X POST http://localhost:3000/api/graphs/abc123/convert-to-3d \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "force_directed"
  }'
```

### 自定义配置参数

```bash
curl -X POST http://localhost:3000/api/graphs/abc123/convert-to-3d \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "force_directed",
    "config": {
      "heightVariation": 10,
      "minNodeDistance": 20,
      "iterations": 100,
      "repulsionStrength": 1000
    }
  }'
```

### JavaScript/TypeScript客户端

```typescript
async function convertGraphTo3D(graphId: string) {
  const response = await fetch(`/api/graphs/${graphId}/convert-to-3d`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      strategy: 'force_directed',
      config: {
        heightVariation: 10,
        minNodeDistance: 20
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const result = await response.json();
  console.log(`Conversion completed in ${result.processingTime}ms`);
  console.log(`Quality score: ${result.qualityMetrics.qualityScore}`);
  
  return result.nodes;
}
```

## 性能特性

### 处理时间预期

- **< 20个节点**: 约2秒
- **20-50个节点**: 约5秒
- **50-100个节点**: 约10秒
- **> 100个节点**: 约20秒

### 超时保护

- API设置了30秒的超时限制
- 如果转换超时，将返回504错误
- 对于超大图谱，建议调整配置参数以加快处理速度

### 批处理机制

- 节点坐标保存使用批处理策略，避免数据库连接池耗尽
- 默认每批15个节点，批次之间延迟100毫秒
- 可通过`config.batchSize`和`config.batchDelay`调整

### 重试机制

- 数据库操作自动重试最多3次
- 使用指数退避策略（1秒、2秒、4秒）
- 适应Neon数据库的暂停/唤醒机制

## 质量指标说明

### nodeDistanceStdDev
节点间距的标准差。值越小表示节点分布越均匀。

### edgeLengthStdDev
边长度的标准差。值越小表示边长度越一致。

### spatialUniformity
空间均匀性（0-1）。值越接近1表示节点在3D空间中分布越均匀。

### spaceUtilization
空间利用率（0-1）。理想范围是0.6-0.85。

### overlapCount
重叠节点对的数量。应该为0，表示没有节点重叠。

### qualityScore
综合质量分数（0-100）。分数越高表示布局质量越好。
- **90-100**: 优秀
- **70-89**: 良好
- **50-69**: 一般
- **< 50**: 较差，建议调整参数或更换策略

## 故障排除

### 问题：转换超时

**原因**: 图谱太大或太复杂

**解决方案**:
1. 减少迭代次数: `config.iterations = 50`
2. 增加收敛阈值: `config.convergenceThreshold = 0.05`
3. 使用更简单的策略: `strategy = 'grid'`

### 问题：质量分数低

**原因**: 节点重叠或分布不均

**解决方案**:
1. 增加最小节点间距: `config.minNodeDistance = 25`
2. 增加排斥力强度: `config.repulsionStrength = 1200`
3. 增加迭代次数: `config.iterations = 120`

### 问题：数据库连接错误

**原因**: Neon数据库暂停或网络问题

**解决方案**:
- API已内置重试机制，通常会自动恢复
- 如果持续失败，请检查数据库连接状态
- 确认DATABASE_URL环境变量配置正确

## 数据库迁移

当前实现使用现有的`x`, `y`, `z`字段存储3D坐标。

要启用完整的2D/3D坐标分离功能，需要运行数据库迁移：

```bash
mysql -u root -p neondb < migrations/001_add_3d_layout_fields.sql
```

迁移后将支持：
- `x2d`, `y2d`: 原始2D坐标
- `x3d`, `y3d`, `z3d`: 转换后的3D坐标
- `layoutVersion`: 布局版本号
- `lastLayoutUpdate`: 最后布局更新时间

## 相关文档

- [布局引擎实现文档](./LAYOUT-ENGINE-IMPLEMENTATION.md)
- [需求文档](./.kiro/specs/2d-to-3d-layout-optimization/requirements.md)
- [设计文档](./.kiro/specs/2d-to-3d-layout-optimization/design.md)
- [任务列表](./.kiro/specs/2d-to-3d-layout-optimization/tasks.md)

## 技术支持

如有问题或建议，请查看相关文档或联系开发团队。
