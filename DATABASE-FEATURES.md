# 数据库功能总结

## ✅ 已完成的功能

### 1. 数据模型设计

**Node（节点）模型** - 扩展功能：
- ✅ 基础字段：id, name, type, description
- ✅ 3D 位置：x, y, z
- ✅ 视觉属性：color, size, opacity
- ✅ 内容存储：content（用于文档和 chunks）
- ✅ 元数据：metadata（JSON 格式）
- ✅ 文档关系：documentId, chunkIndex
- ✅ 向量嵌入：embedding（为语义搜索预留）
- ✅ 标签分类：tags, category
- ✅ 时间戳：createdAt, updatedAt
- ✅ 自引用关系：文档-chunks 层级结构

**Edge（边）模型** - 扩展功能：
- ✅ 基础关系：fromNodeId, toNodeId, label
- ✅ 权重系统：weight（0-1）
- ✅ 关系属性：properties（JSON 格式）
- ✅ 双向关系：bidirectional 标记
- ✅ 视觉样式：color, style
- ✅ 级联删除：删除节点自动删除相关边

**Graph（图谱）模型**：
- ✅ 多图谱支持
- ✅ 图谱配置：settings（JSON）
- ✅ 公开/私有：isPublic
- ✅ 统计信息：nodeCount, edgeCount

**User（用户）模型**：
- ✅ 用户管理基础结构
- ✅ 邮箱唯一索引

**SearchHistory（搜索历史）**：
- ✅ 搜索记录
- ✅ 结果缓存

### 2. 数据库辅助函数（lib/db-helpers.ts）

**节点操作：**
- ✅ `createDocumentNode()` - 创建文档节点
- ✅ `createChunkNode()` - 创建 chunk 节点
- ✅ `splitDocumentIntoChunks()` - 自动分割文档
- ✅ `getDocumentChunks()` - 获取文档的所有 chunks

**关系操作：**
- ✅ `createRelationship()` - 创建关系（支持属性和双向）
- ✅ `getNodeRelationships()` - 获取节点的所有关系

**搜索操作：**
- ✅ `searchNodes()` - 全文搜索（名称、内容、标签）
- ✅ `getNodesByType()` - 按类型筛选
- ✅ `getNodesByCategory()` - 按分类筛选

**图谱分析：**
- ✅ `getGraphStats()` - 统计信息
- ✅ `getNodeNeighbors()` - 获取邻居节点（支持深度遍历）

**批量操作：**
- ✅ `bulkCreateNodes()` - 批量创建节点
- ✅ `bulkCreateEdges()` - 批量创建边
- ✅ `clearAllData()` - 清空数据库

### 3. API 端点

**节点 API：**
- ✅ `GET /api/nodes` - 获取所有节点
- ✅ `POST /api/nodes` - 创建节点
- ✅ `PATCH /api/nodes/[id]` - 更新节点
- ✅ `DELETE /api/nodes/[id]` - 删除节点
- ✅ `GET /api/nodes/[id]/neighbors?depth=1` - 获取邻居

**边 API：**
- ✅ `GET /api/edges` - 获取所有边
- ✅ `POST /api/edges` - 创建边
- ✅ `DELETE /api/edges/[id]` - 删除边

**文档 API：**
- ✅ `POST /api/documents` - 创建文档（支持自动分割）

**搜索 API：**
- ✅ `GET /api/search?q=关键词` - 搜索节点

**统计 API：**
- ✅ `GET /api/stats` - 获取图谱统计

### 4. 数据库工具

**Prisma 命令：**
- ✅ `npm run db:push` - 推送数据库结构
- ✅ `npm run db:studio` - 打开可视化管理界面
- ✅ `npm run db:seed` - 填充示例数据

**种子脚本（scripts/seed.ts）：**
- ✅ 自动创建示例文档
- ✅ 自动创建 chunks
- ✅ 自动创建关系
- ✅ 创建图谱记录

### 5. UI 组件

**DatabasePanel 组件：**
- ✅ 实时统计信息显示
- ✅ 节点/边数量统计
- ✅ 按类型分组统计
- ✅ 搜索功能
- ✅ 快速创建文档
- ✅ 刷新统计按钮

### 6. 性能优化

**数据库索引：**
- ✅ Node: type, documentId, category, createdAt
- ✅ Edge: fromNodeId, toNodeId, label
- ✅ User: email（唯一索引）
- ✅ SearchHistory: userId, createdAt

**查询优化：**
- ✅ 使用 Prisma 的 include 减少查询次数
- ✅ 批量操作使用 createMany
- ✅ 级联删除避免孤立数据

### 7. 文档

- ✅ `DATABASE.md` - 完整的数据库架构文档
- ✅ `DATABASE-FEATURES.md` - 功能总结（本文件）
- ✅ `scripts/migrate-to-neon.md` - Neon 迁移指南

## 🎯 核心特性

### 文档分割系统
```typescript
// 自动将长文档分割成多个 chunks
await splitDocumentIntoChunks(documentId, content, chunkSize)
```

### 图谱遍历
```typescript
// 获取节点的 N 度邻居
const neighbors = await getNodeNeighbors(nodeId, depth)
```

### 全文搜索
```typescript
// 搜索名称、内容、标签
const results = await searchNodes('关键词')
```

### 关系属性
```typescript
// 创建带属性的关系
await createRelationship({
  fromNodeId,
  toNodeId,
  label: 'RELATES_TO',
  properties: { strength: 0.8, type: 'semantic' },
  bidirectional: true
})
```

## 📊 数据示例

运行 `npm run db:seed` 后会创建：
- 2 个文档节点（Next.js 文档、Three.js 教程）
- 4 个 chunk 节点
- 5 条关系（PART_OF, RELATES_TO）
- 1 个图谱记录

## 🚀 下一步扩展

### 建议的功能：
1. **向量搜索** - 使用 embedding 字段实现语义搜索
2. **用户权限** - 基于 User 模型实现多用户支持
3. **版本控制** - 记录节点的历史版本
4. **标签系统** - 完善标签管理和筛选
5. **导入导出** - JSON/CSV 格式的数据导入导出
6. **图谱模板** - 预定义的图谱结构模板
7. **协作功能** - 实时协作编辑
8. **AI 集成** - 自动生成关系和标签

## 💡 使用示例

### 创建文档并自动分割
```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的文档",
    "content": "这是一段很长的文档内容...",
    "autoSplit": true,
    "tags": ["技术", "教程"]
  }'
```

### 搜索节点
```bash
curl http://localhost:3001/api/search?q=Next.js
```

### 获取统计信息
```bash
curl http://localhost:3001/api/stats
```

### 获取邻居节点
```bash
curl http://localhost:3001/api/nodes/{nodeId}/neighbors?depth=2
```

## 🔧 数据库管理

### 查看数据
```bash
npm run db:studio
```
在浏览器中打开 Prisma Studio 可视化管理界面。

### 重置数据
```bash
# 清空并重新填充
npm run db:seed
```

### 备份数据
```bash
# SQLite
cp prisma/dev.db prisma/dev.db.backup

# PostgreSQL
pg_dump $DATABASE_URL > backup.sql
```

## 📝 注意事项

1. **本地开发** 使用 SQLite（file:./dev.db）
2. **生产环境** 使用 Neon PostgreSQL
3. **环境变量** DATABASE_URL 必须配置
4. **级联删除** 删除文档会自动删除所有 chunks
5. **JSON 字段** metadata, tags, properties 存储为 JSON 字符串
