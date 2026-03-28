# 数据库架构文档

## 概述

3D 知识图谱使用 Prisma ORM 管理数据库，支持 SQLite（本地开发）和 PostgreSQL（生产环境/Neon）。

## 数据模型

### Node（节点）

知识图谱中的实体，可以是文档、文档块、概念等。

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 唯一标识符 |
| name | String | 节点名称 |
| type | String | 节点类型（document, chunk, concept, entity） |
| description | String? | 节点描述 |
| content | String? | 节点内容（用于文档块） |
| metadata | String? | JSON 格式的元数据 |
| x, y, z | Float | 3D 空间坐标 |
| color | String | 节点颜色（十六进制） |
| size | Float | 节点大小 |
| opacity | Float | 节点透明度 |
| documentId | String? | 所属文档 ID（仅 chunk 类型） |
| chunkIndex | Int? | 在文档中的顺序 |
| embedding | String? | 向量嵌入（用于语义搜索） |
| tags | String? | JSON 数组格式的标签 |
| category | String? | 分类 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**关系：**
- `outgoingEdges`: 从该节点出发的边
- `incomingEdges`: 指向该节点的边
- `chunks`: 文档的所有块（仅 document 类型）
- `document`: 所属文档（仅 chunk 类型）

### Edge（边）

节点之间的关系。

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 唯一标识符 |
| fromNodeId | String | 起始节点 ID |
| toNodeId | String | 目标节点 ID |
| label | String | 关系标签（PART_OF, RELATES_TO, REFERENCES） |
| weight | Float | 关系权重（0-1） |
| properties | String? | JSON 格式的额外属性 |
| bidirectional | Boolean | 是否双向关系 |
| color | String? | 边的颜色 |
| style | String? | 边的样式（solid, dashed, dotted） |
| createdAt | DateTime | 创建时间 |

**关系：**
- `fromNode`: 起始节点
- `toNode`: 目标节点

### Graph（图谱）

管理多个知识图谱。

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 唯一标识符 |
| name | String | 图谱名称 |
| description | String? | 图谱描述 |
| settings | String? | JSON 格式的配置 |
| isPublic | Boolean | 是否公开 |
| nodeCount | Int | 节点数量 |
| edgeCount | Int | 边数量 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### User（用户）

用户管理（可选）。

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 唯一标识符 |
| email | String | 邮箱（唯一） |
| name | String? | 用户名 |
| avatar | String? | 头像 URL |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### SearchHistory（搜索历史）

记录用户搜索历史。

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 唯一标识符 |
| query | String | 搜索关键词 |
| results | String? | JSON 格式的搜索结果 |
| userId | String? | 用户 ID |
| createdAt | DateTime | 创建时间 |

## API 端点

### 节点操作

- `GET /api/nodes` - 获取所有节点
- `POST /api/nodes` - 创建节点
- `PATCH /api/nodes/[id]` - 更新节点
- `DELETE /api/nodes/[id]` - 删除节点
- `GET /api/nodes/[id]/neighbors?depth=1` - 获取邻居节点

### 边操作

- `GET /api/edges` - 获取所有边
- `POST /api/edges` - 创建边
- `DELETE /api/edges/[id]` - 删除边

### 文档操作

- `POST /api/documents` - 创建文档（支持自动分割）

### 搜索

- `GET /api/search?q=关键词` - 搜索节点

### 统计

- `GET /api/stats` - 获取图谱统计信息

## 辅助函数

位于 `lib/db-helpers.ts`：

### 节点操作
- `createDocumentNode()` - 创建文档节点
- `createChunkNode()` - 创建 chunk 节点
- `splitDocumentIntoChunks()` - 将文档分割成多个 chunks
- `getDocumentChunks()` - 获取文档的所有 chunks

### 关系操作
- `createRelationship()` - 创建节点关系
- `getNodeRelationships()` - 获取节点的所有关系

### 搜索操作
- `searchNodes()` - 搜索节点
- `getNodesByType()` - 按类型获取节点
- `getNodesByCategory()` - 按分类获取节点

### 图谱统计
- `getGraphStats()` - 获取统计信息
- `getNodeNeighbors()` - 获取邻居节点

### 批量操作
- `bulkCreateNodes()` - 批量创建节点
- `bulkCreateEdges()` - 批量创建边
- `clearAllData()` - 清空所有数据

## 数据库命令

```bash
# 推送数据库结构
npm run db:push

# 打开 Prisma Studio（可视化管理）
npm run db:studio

# 填充示例数据
npm run db:seed
```

## 索引优化

数据库已为以下字段创建索引以提高查询性能：

- Node: `type`, `documentId`, `category`, `createdAt`
- Edge: `fromNodeId`, `toNodeId`, `label`
- User: `email`
- SearchHistory: `userId`, `createdAt`

## 迁移到生产环境

参考 `scripts/migrate-to-neon.md` 了解如何迁移到 Neon PostgreSQL。
