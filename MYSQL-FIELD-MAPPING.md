# MySQL 数据库字段映射参考

## 📊 数据库表名（全部小写）

根据 Navicat 中显示的实际表名：

| 表名 | 说明 |
|------|------|
| `project` | 项目表 |
| `graph` | 图谱表 |
| `node` | 节点表 |
| `edge` | 边表 |
| `user` | 用户表 |
| `searchhistory` | 搜索历史表 |

## 🔗 Prisma Client 模型名称

```typescript
prisma.project        // ✅ 正确
prisma.graph          // ✅ 正确
prisma.node           // ✅ 正确
prisma.edge           // ✅ 正确
prisma.user           // ✅ 正确
prisma.searchhistory  // ✅ 正确
```

## 🔗 关系字段映射

### Project 模型的关系

**PostgreSQL (旧)** → **MySQL (新)**

```typescript
// ❌ 错误 (PostgreSQL)
project.graphs  // 复数形式
project.nodes   // 复数形式
project.edges   // 复数形式

// ✅ 正确 (MySQL)
project.graph   // 单数形式
project.node    // 单数形式
project.edge    // 单数形式
```

### Graph 模型的关系

```typescript
// ❌ 错误 (PostgreSQL)
graph.nodes     // 复数形式
graph.edges     // 复数形式

// ✅ 正确 (MySQL)
graph.node      // 单数形式
graph.edge      // 单数形式
```

### Node 模型的关系

```typescript
// ❌ 错误 (PostgreSQL)
node.outgoingEdges  // 复数形式
node.incomingEdges  // 复数形式
node.chunks         // 复数形式

// ✅ 正确 (MySQL)
node.edge_edge_fromNodeIdTonode  // Prisma 自动生成的名称
node.edge_edge_toNodeIdTonode    // Prisma 自动生成的名称
node.node_documentIdTonode       // Prisma 自动生成的名称
```

### _count 字段映射

```typescript
// ❌ 错误 (PostgreSQL)
_count: {
  select: {
    graphs: true,
    nodes: true,
    edges: true,
  }
}

// ✅ 正确 (MySQL)
_count: {
  select: {
    graph: true,
    node: true,
    edge: true,
  }
}
```

## 📝 API 路由中的常见用法

### 1. 查询项目列表（带图谱数量）

```typescript
// ✅ 正确
const projects = await prisma.project.findMany({
  select: {
    id: true,
    name: true,
    _count: {
      select: {
        graph: true,  // ← 注意：单数形式
      },
    },
  },
})

// 转换数据
const result = projects.map(p => ({
  ...p,
  graphCount: p._count.graph,  // ← 注意：单数形式
}))
```

### 2. 查询项目及其图谱

```typescript
// ✅ 正确
const project = await prisma.project.findUnique({
  where: { id },
  include: {
    graph: {  // ← 注意：单数形式
      select: {
        id: true,
        name: true,
      },
    },
  },
})

// 访问图谱列表
const graphs = project.graph  // ← 注意：单数形式，但返回的是数组
```

### 3. 查询图谱及其节点和边

```typescript
// ✅ 正确
const graph = await prisma.graph.findUnique({
  where: { id },
  include: {
    node: true,  // ← 注意：单数形式
    edge: true,  // ← 注意：单数形式
  },
})

// 访问节点和边
const nodes = graph.node  // ← 注意：单数形式，但返回的是数组
const edges = graph.edge  // ← 注意：单数形式，但返回的是数组
```

### 4. 统计数量

```typescript
// ✅ 正确
const graph = await prisma.graph.findUnique({
  where: { id },
  select: {
    _count: {
      select: {
        node: true,  // ← 注意：单数形式
        edge: true,  // ← 注意：单数形式
      },
    },
  },
})

const nodeCount = graph._count.node  // ← 注意：单数形式
const edgeCount = graph._count.edge  // ← 注意：单数形式
```

## ⚠️ 常见错误

### 错误 1: 使用复数形式

```typescript
// ❌ 错误
const projects = await prisma.project.findMany({
  include: {
    graphs: true,  // ← 错误！应该是 graph
  },
})
```

**错误信息**: `Unknown field 'graphs'`

### 错误 2: _count 中使用复数

```typescript
// ❌ 错误
_count: {
  select: {
    graphs: true,  // ← 错误！应该是 graph
  }
}
```

**错误信息**: `Unknown field 'graphs' for select statement on model 'ProjectCountOutputType'`

### 错误 3: 访问数据时使用错误的字段名

```typescript
// ❌ 错误
const graphCount = project._count.graphs  // ← 错误！应该是 graph

// ✅ 正确
const graphCount = project._count.graph
```

## 🔍 快速检查清单

在编写 API 代码时，检查以下内容：

- [ ] 所有 `prisma.Project` 改为 `prisma.project`
- [ ] 所有 `prisma.Graph` 改为 `prisma.graph`
- [ ] 所有 `prisma.Node` 改为 `prisma.node`
- [ ] 所有 `prisma.Edge` 改为 `prisma.edge`
- [ ] 所有 `include: { graphs: ... }` 改为 `include: { graph: ... }`
- [ ] 所有 `include: { nodes: ... }` 改为 `include: { node: ... }`
- [ ] 所有 `include: { edges: ... }` 改为 `include: { edge: ... }`
- [ ] 所有 `_count.graphs` 改为 `_count.graph`
- [ ] 所有 `_count.nodes` 改为 `_count.node`
- [ ] 所有 `_count.edges` 改为 `_count.edge`

## 🧪 测试脚本

运行以下脚本验证字段映射是否正确：

```bash
node test-field-mapping.js
```

## 📚 相关文档

- Prisma 文档: https://www.prisma.io/docs
- MySQL 命名规范: https://dev.mysql.com/doc/refman/8.0/en/identifier-case-sensitivity.html

---

**最后更新**: 2026-03-06
**数据库**: MySQL 本地 neondb
