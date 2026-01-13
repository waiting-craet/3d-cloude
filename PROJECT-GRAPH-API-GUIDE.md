# 项目-图谱-节点 API 使用指南

## 📋 数据结构概览

```
项目 (Project)
  ├── 唯一ID (id)
  ├── 名称 (name)
  ├── 简介 (description)
  └── 图谱列表 (graphs)
       ├── 图谱A (Graph)
       │    ├── 唯一ID (id)
       │    ├── 名称 (name)
       │    ├── 简介 (description)
       │    ├── 所属项目ID (projectId)
       │    ├── 节点列表 (nodes)
       │    │    ├── 节点1 (Node)
       │    │    │    ├── 唯一ID (id)
       │    │    │    ├── 名称 (name)
       │    │    │    ├── 类型 (type)
       │    │    │    ├── 位置 (x, y, z)
       │    │    │    ├── 图片URL (imageUrl)
       │    │    │    ├── 视频URL (coverUrl)
       │    │    │    ├── 所属项目ID (projectId)
       │    │    │    └── 所属图谱ID (graphId)
       │    │    └── 节点2...
       │    └── 边列表 (edges)
       │         ├── 边1 (Edge)
       │         │    ├── 唯一ID (id)
       │         │    ├── 起始节点ID (fromNodeId)
       │         │    ├── 目标节点ID (toNodeId)
       │         │    ├── 关系类型 (label)
       │         │    ├── 所属项目ID (projectId)
       │         │    └── 所属图谱ID (graphId)
       │         └── 边2...
       └── 图谱B...
```

## 🔑 核心特性

1. **三层数据关联**: 项目 → 图谱 → 节点/边
2. **唯一标识符**: 每个实体都有唯一的 `id` (使用 cuid)
3. **级联删除**: 删除项目会自动删除所有图谱、节点和边
4. **媒体存储**: 节点支持存储图片和视频的 URL
5. **数据隔离**: 每个项目的数据完全独立，互不干扰

## 📡 API 接口

### 1. 项目管理 (Projects)

#### 创建项目
```http
POST /api/projects
Content-Type: application/json

{
  "name": "委屈",
  "description": "项目简介"
}
```

响应:
```json
{
  "project": {
    "id": "clx1234567890",
    "name": "委屈",
    "description": "项目简介",
    "nodeCount": 0,
    "edgeCount": 0,
    "createdAt": "2026-01-13T10:00:00.000Z",
    "updatedAt": "2026-01-13T10:00:00.000Z"
  }
}
```

#### 获取所有项目
```http
GET /api/projects
```

#### 获取项目详情
```http
GET /api/projects/{projectId}
```

#### 删除项目
```http
DELETE /api/projects/{projectId}
```

### 2. 图谱管理 (Graphs)

#### 在项目中创建图谱
```http
POST /api/projects/{projectId}/graphs
Content-Type: application/json

{
  "name": "知识图谱A",
  "description": "图谱简介",
  "isPublic": false
}
```

响应:
```json
{
  "graph": {
    "id": "clx9876543210",
    "name": "知识图谱A",
    "description": "图谱简介",
    "projectId": "clx1234567890",
    "isPublic": false,
    "nodeCount": 0,
    "edgeCount": 0,
    "createdAt": "2026-01-13T10:05:00.000Z",
    "updatedAt": "2026-01-13T10:05:00.000Z",
    "project": {
      "id": "clx1234567890",
      "name": "委屈"
    }
  }
}
```

#### 获取项目的所有图谱
```http
GET /api/projects/{projectId}/graphs
```

#### 获取图谱详情
```http
GET /api/graphs/{graphId}
```

#### 更新图谱
```http
PATCH /api/graphs/{graphId}
Content-Type: application/json

{
  "name": "新名称",
  "description": "新简介",
  "isPublic": true
}
```

#### 删除图谱
```http
DELETE /api/graphs/{graphId}
```

### 3. 节点管理 (Nodes)

#### 在图谱中创建节点
```http
POST /api/graphs/{graphId}/nodes
Content-Type: application/json

{
  "name": "核心概念",
  "type": "concept",
  "description": "节点描述",
  "content": "详细内容",
  "x": 0,
  "y": 0,
  "z": 0,
  "color": "#FF6B6B",
  "size": 2.0,
  "imageUrl": "https://blob.vercel-storage.com/xxx.jpg",
  "coverUrl": "https://blob.vercel-storage.com/yyy.mp4"
}
```

响应:
```json
{
  "node": {
    "id": "clxabc123456",
    "name": "核心概念",
    "type": "concept",
    "description": "节点描述",
    "content": "详细内容",
    "x": 0,
    "y": 0,
    "z": 0,
    "color": "#FF6B6B",
    "size": 2.0,
    "imageUrl": "https://blob.vercel-storage.com/xxx.jpg",
    "coverUrl": "https://blob.vercel-storage.com/yyy.mp4",
    "projectId": "clx1234567890",
    "graphId": "clx9876543210",
    "createdAt": "2026-01-13T10:10:00.000Z",
    "updatedAt": "2026-01-13T10:10:00.000Z"
  }
}
```

#### 获取图谱的所有节点
```http
GET /api/graphs/{graphId}/nodes
```

#### 获取项目的所有节点
```http
GET /api/projects/{projectId}/nodes
```

### 4. 边管理 (Edges)

#### 在图谱中创建边
```http
POST /api/graphs/{graphId}/edges
Content-Type: application/json

{
  "fromNodeId": "clxabc123456",
  "toNodeId": "clxdef789012",
  "label": "RELATES_TO",
  "weight": 1.5,
  "color": "#FFD93D",
  "style": "solid"
}
```

响应:
```json
{
  "edge": {
    "id": "clxghi345678",
    "fromNodeId": "clxabc123456",
    "toNodeId": "clxdef789012",
    "label": "RELATES_TO",
    "weight": 1.5,
    "color": "#FFD93D",
    "style": "solid",
    "projectId": "clx1234567890",
    "graphId": "clx9876543210",
    "createdAt": "2026-01-13T10:15:00.000Z"
  }
}
```

#### 获取图谱的所有边
```http
GET /api/graphs/{graphId}/edges
```

#### 获取项目的所有边
```http
GET /api/projects/{projectId}/edges
```

## 🎯 使用场景示例

### 场景1: 创建完整的项目结构

```javascript
// 1. 创建项目
const projectRes = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '委屈',
    description: '我的第一个项目'
  })
})
const { project } = await projectRes.json()

// 2. 在项目中创建图谱
const graphRes = await fetch(`/api/projects/${project.id}/graphs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '知识图谱A',
    description: '核心知识图谱'
  })
})
const { graph } = await graphRes.json()

// 3. 在图谱中创建节点
const node1Res = await fetch(`/api/graphs/${graph.id}/nodes`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '概念1',
    type: 'concept',
    x: 0, y: 0, z: 0,
    imageUrl: 'https://example.com/image1.jpg'
  })
})
const { node: node1 } = await node1Res.json()

const node2Res = await fetch(`/api/graphs/${graph.id}/nodes`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '概念2',
    type: 'concept',
    x: 5, y: 0, z: 0
  })
})
const { node: node2 } = await node2Res.json()

// 4. 创建节点之间的关系
const edgeRes = await fetch(`/api/graphs/${graph.id}/edges`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromNodeId: node1.id,
    toNodeId: node2.id,
    label: 'RELATES_TO'
  })
})
```

### 场景2: 获取项目的完整数据

```javascript
// 获取项目及其所有图谱、节点、边
const res = await fetch(`/api/projects/${projectId}`)
const { project, nodes, edges } = await res.json()

// 或者分别获取
const graphsRes = await fetch(`/api/projects/${projectId}/graphs`)
const { graphs } = await graphsRes.json()

// 获取特定图谱的数据
const graphRes = await fetch(`/api/graphs/${graphId}`)
const { graph, nodes, edges } = await graphRes.json()
```

### 场景3: 在2D/3D视图中显示项目数据

```javascript
// 获取当前项目的所有节点和边
const nodesRes = await fetch(`/api/projects/${currentProjectId}/nodes`)
const { nodes } = await nodesRes.json()

const edgesRes = await fetch(`/api/projects/${currentProjectId}/edges`)
const { edges } = await edgesRes.json()

// 在2D或3D视图中渲染
nodes.forEach(node => {
  // 渲染节点
  renderNode(node.x, node.y, node.z, node.color, node.size)
  
  // 显示节点图片
  if (node.imageUrl) {
    displayImage(node.imageUrl)
  }
})

edges.forEach(edge => {
  // 渲染边
  renderEdge(edge.fromNodeId, edge.toNodeId, edge.color, edge.style)
})
```

## 🔒 数据隔离保证

1. **项目级隔离**: 每个项目的数据完全独立
2. **图谱级隔离**: 每个图谱的节点和边只属于该图谱
3. **级联删除**: 删除项目会自动清理所有关联数据
4. **查询过滤**: API 自动过滤，只返回当前项目/图谱的数据

## 🧪 测试

运行测试脚本验证数据结构:

```bash
npx tsx scripts/test-project-graph-structure.ts
```

## 📊 数据库表结构

### Project (项目表)
- `id`: 唯一标识符
- `name`: 项目名称
- `description`: 项目描述
- `nodeCount`: 节点总数
- `edgeCount`: 边总数
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### Graph (图谱表)
- `id`: 唯一标识符
- `name`: 图谱名称
- `description`: 图谱描述
- `projectId`: 所属项目ID (外键)
- `isPublic`: 是否公开
- `nodeCount`: 节点数
- `edgeCount`: 边数
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### Node (节点表)
- `id`: 唯一标识符
- `name`: 节点名称
- `type`: 节点类型
- `description`: 节点描述
- `content`: 节点内容
- `x, y, z`: 3D坐标
- `color`: 颜色
- `size`: 大小
- `imageUrl`: 图片URL
- `iconUrl`: 图标URL
- `coverUrl`: 封面/视频URL
- `projectId`: 所属项目ID (外键)
- `graphId`: 所属图谱ID (外键)
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### Edge (边表)
- `id`: 唯一标识符
- `fromNodeId`: 起始节点ID (外键)
- `toNodeId`: 目标节点ID (外键)
- `label`: 关系类型
- `weight`: 权重
- `color`: 颜色
- `style`: 样式
- `projectId`: 所属项目ID (外键)
- `graphId`: 所属图谱ID (外键)
- `createdAt`: 创建时间

## 💡 最佳实践

1. **创建顺序**: 项目 → 图谱 → 节点 → 边
2. **删除顺序**: 使用级联删除，只需删除项目即可
3. **媒体文件**: 使用 Vercel Blob 存储，只在数据库中保存 URL
4. **数据查询**: 优先使用项目/图谱级别的 API，避免全局查询
5. **统计信息**: 创建/删除节点和边时自动更新计数
