# 设计文档 - 导入冗余数据检测

## 概述

本功能为导入数据页面添加冗余数据检测能力。当用户点击"生成图谱"按钮导入数据时,系统将在导入前检测上传文件中的节点和边是否与当前项目和图谱中已存在的数据冗余,仅导入非冗余数据,并在导入进度弹窗中显示冗余数据统计信息。

### 设计目标

1. **数据质量保证**: 防止重复数据导入,保持数据库的数据一致性
2. **用户透明度**: 向用户清晰展示哪些数据被过滤,哪些数据被导入
3. **性能优化**: 使用高效的数据结构确保检测过程不显著影响导入性能
4. **无缝集成**: 在现有导入流程中集成检测功能,不破坏原有逻辑

### 关键设计决策

1. **检测时机**: 在数据验证之后、数据库写入之前进行冗余检测
2. **检测范围**: 检测当前选定的项目和图谱中的数据,不跨项目/图谱检测
3. **冗余判断标准**:
   - 节点: 基于 `name` 字段判断(因为导入模板使用label/name作为节点标识)
   - 边: 基于源节点name、目标节点name和关系类型(label)的组合判断
4. **UI反馈**: 在现有的加载模态框中添加统计信息显示

## 架构

### 系统组件

```
┌─────────────────────────────────────────────────────────────┐
│                      Import Page (UI)                        │
│  - 文件选择                                                   │
│  - 项目/图谱选择                                              │
│  - 生成图谱按钮                                               │
│  - 导入进度弹窗(显示统计信息)                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Import API Route                            │
│  1. 接收文件和参数                                            │
│  2. 验证项目和图谱                                            │
│  3. 解析和验证数据                                            │
│  4. 调用冗余检测服务 ◄─────────────┐                         │
│  5. 导入非冗余数据                  │                         │
│  6. 返回统计信息                    │                         │
└────────────────────┬────────────────┼─────────────────────────┘
                     │                │
                     ▼                │
┌─────────────────────────────────────┴───────────────────────┐
│              Duplicate Detection Service                     │
│  - detectDuplicateNodes(uploadNodes, existingNodes)         │
│  - detectDuplicateEdges(uploadEdges, existingEdges)         │
│  - filterNonDuplicateData(data, duplicates)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (Prisma)                         │
│  - 查询现有节点和边                                           │
│  - 写入非冗余数据                                             │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

1. **用户操作**: 用户选择文件、项目、图谱,点击"生成图谱"按钮
2. **文件上传**: 前端发送POST请求到 `/api/import`
3. **数据解析**: 后端解析文件,提取节点和边数据
4. **数据验证**: 验证数据格式和完整性
5. **查询现有数据**: 从数据库查询当前项目和图谱的所有节点和边
6. **冗余检测**: 比对上传数据和现有数据,识别冗余项
7. **过滤数据**: 从上传数据中移除冗余项
8. **数据导入**: 将非冗余数据写入数据库
9. **返回结果**: 返回统计信息(冗余数量、导入数量)
10. **UI更新**: 前端在进度弹窗中显示统计信息

## 组件和接口

### 1. Duplicate Detection Service

**文件位置**: `lib/services/duplicate-detection.ts`

**接口定义**:

```typescript
// 冗余检测结果
interface DuplicateDetectionResult {
  duplicateNodes: Set<string>      // 冗余节点的name集合
  duplicateEdges: Set<string>      // 冗余边的唯一键集合
  duplicateNodeCount: number       // 冗余节点数量
  duplicateEdgeCount: number       // 冗余边数量
}

// 过滤后的数据
interface FilteredData {
  nodes: NodeData[]                // 非冗余节点
  edges: EdgeData[]                // 非冗余边
  originalNodeCount: number        // 原始节点数量
  originalEdgeCount: number        // 原始边数量
}

/**
 * 检测冗余节点
 * @param uploadNodes - 上传文件中的节点
 * @param existingNodes - 数据库中已存在的节点
 * @returns 冗余节点的name集合
 */
function detectDuplicateNodes(
  uploadNodes: NodeData[],
  existingNodes: { name: string }[]
): Set<string>

/**
 * 检测冗余边
 * @param uploadEdges - 上传文件中的边
 * @param existingEdges - 数据库中已存在的边
 * @param nodeMap - 节点name到id的映射(用于边的源和目标节点查找)
 * @returns 冗余边的唯一键集合
 */
function detectDuplicateEdges(
  uploadEdges: EdgeData[],
  existingEdges: { fromNode: { name: string }, toNode: { name: string }, label: string }[],
  nodeMap: Map<string, string>
): Set<string>

/**
 * 过滤冗余数据
 * @param nodes - 原始节点数据
 * @param edges - 原始边数据
 * @param duplicateNodes - 冗余节点集合
 * @param duplicateEdges - 冗余边集合
 * @returns 过滤后的数据和统计信息
 */
function filterNonDuplicateData(
  nodes: NodeData[],
  edges: EdgeData[],
  duplicateNodes: Set<string>,
  duplicateEdges: Set<string>
): FilteredData

/**
 * 执行完整的冗余检测流程
 * @param uploadData - 上传的数据
 * @param projectId - 项目ID
 * @param graphId - 图谱ID
 * @returns 检测结果和过滤后的数据
 */
async function detectAndFilterDuplicates(
  uploadData: ParsedGraphData,
  projectId: string,
  graphId: string
): Promise<{
  filtered: FilteredData
  detection: DuplicateDetectionResult
}>
```

**实现要点**:

1. **高效数据结构**: 使用 `Set` 和 `Map` 进行O(1)查找
2. **边的唯一键**: 使用 `${sourceName}|${targetName}|${label}` 作为边的唯一标识
3. **批量查询**: 一次性查询所有现有节点和边,避免多次数据库访问
4. **内存优化**: 只存储必要的字段(name, label等),不加载完整对象

### 2. Import API Route 修改

**文件位置**: `app/api/import/route.ts`

**修改点**:

```typescript
// 在数据验证之后添加冗余检测
const { filtered, detection } = await detectAndFilterDuplicates(
  validatedData,
  projectId,
  graphId
)

// 使用过滤后的数据进行导入
const nodesWithLayout = generateLayout(filtered.nodes, filtered.edges)

// 在返回结果中添加统计信息
return NextResponse.json({
  message: '导入成功',
  nodesCount: createdNodes.length,
  edgesCount: createdEdges.length,
  duplicateNodesCount: detection.duplicateNodeCount,
  duplicateEdgesCount: detection.duplicateEdgeCount,
  totalNodesInFile: filtered.originalNodeCount,
  totalEdgesInFile: filtered.originalEdgeCount,
  coordinateSystem: '3D',
  warnings: importResult.warnings
})
```

### 3. Import Page UI 修改

**文件位置**: `app/import/page.tsx`

**修改点**:

在加载模态框中添加统计信息显示:

```typescript
// 添加状态
const [importStats, setImportStats] = useState<{
  duplicateNodesCount?: number
  duplicateEdgesCount?: number
  importedNodesCount?: number
  importedEdgesCount?: number
} | null>(null)

// 在handleUpload中更新统计信息
if (response.ok) {
  setImportStats({
    duplicateNodesCount: result.duplicateNodesCount,
    duplicateEdgesCount: result.duplicateEdgesCount,
    importedNodesCount: result.nodesCount,
    importedEdgesCount: result.edgesCount
  })
  // ... 显示成功消息
}

// 在加载模态框中显示统计信息
{importStats && (
  <div style={{ /* 统计信息样式 */ }}>
    <div>冗余节点: {importStats.duplicateNodesCount}</div>
    <div>冗余边: {importStats.duplicateEdgesCount}</div>
    <div>导入节点: {importStats.importedNodesCount}</div>
    <div>导入边: {importStats.importedEdgesCount}</div>
  </div>
)}
```

## 数据模型

### 节点冗余判断

**判断依据**: 节点的 `name` 字段

**原因**: 
- 导入模板使用 `label` 字段作为节点标识,在系统中映射为 `name` 字段
- 数据库生成的 `id` (cuid) 在导入时不可用
- `name` 是用户可见的唯一标识符

**示例**:
```typescript
// 现有节点
{ id: 'abc123', name: '人工智能', type: 'concept' }

// 上传节点
{ label: '人工智能', description: '...' }

// 判断: name === label → 冗余
```

### 边冗余判断

**判断依据**: 源节点name + 目标节点name + 关系类型(label)的组合

**唯一键格式**: `${sourceName}|${targetName}|${relationLabel}`

**原因**:
- 边没有独立的唯一标识符
- 同一对节点之间可能有多种关系类型
- 需要考虑节点的方向性

**示例**:
```typescript
// 现有边
{
  fromNode: { name: '深度学习' },
  toNode: { name: '人工智能' },
  label: 'PART_OF'
}

// 上传边
{ source: '深度学习', target: '人工智能', label: 'PART_OF' }

// 唯一键: '深度学习|人工智能|PART_OF'
// 判断: 唯一键匹配 → 冗余
```

### 数据库查询

**查询现有节点**:
```typescript
const existingNodes = await prisma.node.findMany({
  where: {
    projectId: projectId,
    graphId: graphId
  },
  select: {
    name: true
  }
})
```

**查询现有边**:
```typescript
const existingEdges = await prisma.edge.findMany({
  where: {
    projectId: projectId,
    graphId: graphId
  },
  select: {
    label: true,
    fromNode: {
      select: { name: true }
    },
    toNode: {
      select: { name: true }
    }
  }
})
```

## 正确性属性

*属性是一个特征或行为,应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1: 节点冗余检测准确性

*对于任意*上传的节点集合和现有的节点集合,如果上传节点的name与现有节点的name相同,则该上传节点应被标记为冗余。

**验证需求**: 1.1, 1.3

### 属性 2: 边冗余检测准确性

*对于任意*上传的边集合和现有的边集合,如果上传边的源节点name、目标节点name和关系类型与现有边完全相同,则该上传边应被标记为冗余。

**验证需求**: 1.2, 1.4

### 属性 3: 检测时序正确性

*对于任意*导入操作,冗余检测必须在数据库写入操作之前完成,且检测结果必须影响后续的写入操作。

**验证需求**: 1.5

### 属性 4: 非冗余数据导入完整性

*对于任意*包含冗余和非冗余数据的上传集合,导入后数据库中新增的数据应该恰好等于非冗余数据集合。

**验证需求**: 2.1, 2.2

### 属性 5: 全冗余数据处理

*对于任意*完全由冗余数据组成的上传集合,导入操作应该成功完成但不向数据库写入任何新数据。

**验证需求**: 2.4 (edge case)

### 属性 6: 统计信息一致性

*对于任意*导入操作,返回的统计信息应满足: 冗余节点数 + 导入节点数 = 上传文件中的总节点数,且冗余边数 + 导入边数 = 上传文件中的总边数。

**验证需求**: 3.2, 3.3, 3.4, 3.5

### 属性 7: 错误处理完整性

*对于任意*在冗余检测过程中发生的错误(数据库错误、数据格式错误等),系统应该显示描述性错误消息并中止导入操作。

**验证需求**: 5.1, 5.2, 5.3

### 属性 8: 错误日志记录

*对于任意*在冗余检测或导入过程中发生的错误,系统应该记录包含错误类型、错误消息和上下文信息的日志条目。

**验证需求**: 5.4

## 错误处理

### 错误类型

1. **数据库连接错误**
   - 场景: 查询现有数据时数据库不可用
   - 处理: 使用现有的重试机制(retryOperation)
   - 消息: "数据库连接失败,请稍后重试"

2. **数据查询错误**
   - 场景: 查询现有节点/边时发生错误
   - 处理: 捕获错误,记录日志,返回错误响应
   - 消息: "查询现有数据失败: {具体错误}"

3. **数据格式错误**
   - 场景: 上传数据缺少必要字段(如节点没有name/label)
   - 处理: 在数据验证阶段捕获,返回详细错误信息
   - 消息: "数据格式错误: 节点缺少必要的标识字段"

4. **内存不足错误**
   - 场景: 处理大量数据时内存不足
   - 处理: 捕获错误,记录日志,建议用户分批导入
   - 消息: "数据量过大,请尝试分批导入"

### 错误恢复策略

1. **数据库错误**: 使用重试机制,最多重试3次
2. **验证错误**: 不重试,直接返回错误信息给用户
3. **部分失败**: 如果节点导入成功但边导入失败,回滚整个事务

### 日志记录

```typescript
// 错误日志格式
console.error('Duplicate detection error:', {
  type: 'database_query_error',
  projectId,
  graphId,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
})
```

## 测试策略

### 单元测试

**测试文件**: `lib/services/__tests__/duplicate-detection.test.ts`

测试用例:
1. 检测完全冗余的节点集合
2. 检测完全冗余的边集合
3. 检测部分冗余的混合数据
4. 检测无冗余的全新数据
5. 处理空数据集
6. 处理节点缺少name字段的情况
7. 处理边缺少必要字段的情况
8. 验证边的唯一键生成逻辑
9. 验证过滤后的数据完整性

### 属性测试

**测试文件**: `lib/services/__tests__/duplicate-detection.property.test.ts`

**配置**: 每个属性测试运行至少100次迭代

测试属性:
1. **属性1**: 节点冗余检测准确性
   - 标签: `Feature: import-duplicate-detection, Property 1: 节点冗余检测准确性`
   - 生成: 随机节点集合,部分节点name重复
   - 验证: 所有name重复的节点被标记为冗余

2. **属性2**: 边冗余检测准确性
   - 标签: `Feature: import-duplicate-detection, Property 2: 边冗余检测准确性`
   - 生成: 随机边集合,部分边的源、目标、类型组合重复
   - 验证: 所有组合重复的边被标记为冗余

3. **属性3**: 检测时序正确性
   - 标签: `Feature: import-duplicate-detection, Property 3: 检测时序正确性`
   - 生成: 随机导入操作序列
   - 验证: 检测总是在写入之前执行

4. **属性4**: 非冗余数据导入完整性
   - 标签: `Feature: import-duplicate-detection, Property 4: 非冗余数据导入完整性`
   - 生成: 包含冗余和非冗余数据的随机集合
   - 验证: 导入的数据恰好是非冗余数据

5. **属性5**: 全冗余数据处理
   - 标签: `Feature: import-duplicate-detection, Property 5: 全冗余数据处理`
   - 生成: 完全冗余的数据集
   - 验证: 导入成功但无新数据写入

6. **属性6**: 统计信息一致性
   - 标签: `Feature: import-duplicate-detection, Property 6: 统计信息一致性`
   - 生成: 随机数据集
   - 验证: 冗余数 + 导入数 = 总数

7. **属性7**: 错误处理完整性
   - 标签: `Feature: import-duplicate-detection, Property 7: 错误处理完整性`
   - 生成: 触发各种错误的场景
   - 验证: 错误被捕获,消息被显示,操作被中止

8. **属性8**: 错误日志记录
   - 标签: `Feature: import-duplicate-detection, Property 8: 错误日志记录`
   - 生成: 触发各种错误的场景
   - 验证: 日志被正确记录

### 集成测试

**测试文件**: `app/api/import/__tests__/duplicate-detection.integration.test.ts`

测试场景:
1. 完整的导入流程(包含冗余检测)
2. 多次导入相同数据(验证冗余检测)
3. 跨项目导入(验证不会误判为冗余)
4. 跨图谱导入(验证不会误判为冗余)
5. 大数据集导入(验证性能)

### UI测试

**测试文件**: `app/import/__tests__/duplicate-detection.ui.test.tsx`

测试场景:
1. 统计信息正确显示在进度弹窗中
2. 冗余数据过滤后的成功消息
3. 全冗余数据的提示消息
4. 错误情况下的错误消息显示

### 性能测试

虽然性能需求(4.1, 4.2)不在自动化测试范围内,但应该进行手动性能验证:

1. 测试1000个节点的检测时间(目标: <2秒)
2. 测试5000条边的检测时间(目标: <3秒)
3. 监控内存使用情况
4. 验证数据库查询次数(应该是固定的,不随数据量增长)

### 测试库选择

- **单元测试**: Jest
- **属性测试**: fast-check (JavaScript/TypeScript的属性测试库)
- **集成测试**: Jest + Supertest
- **UI测试**: React Testing Library

## 实现计划

### 阶段1: 核心检测服务
1. 创建 `duplicate-detection.ts` 服务
2. 实现节点冗余检测函数
3. 实现边冗余检测函数
4. 实现数据过滤函数
5. 编写单元测试

### 阶段2: API集成
1. 修改 `/api/import` 路由
2. 添加数据库查询逻辑
3. 集成冗余检测服务
4. 修改返回结果格式
5. 编写集成测试

### 阶段3: UI更新
1. 修改导入页面状态管理
2. 更新加载模态框UI
3. 添加统计信息显示
4. 优化错误消息显示
5. 编写UI测试

### 阶段4: 属性测试
1. 设置fast-check测试环境
2. 实现所有8个属性测试
3. 配置测试运行参数(100次迭代)
4. 验证测试覆盖率

### 阶段5: 性能优化和验证
1. 性能测试和基准测试
2. 优化数据结构和算法
3. 添加性能监控
4. 文档更新

## 性能考虑

### 数据结构选择

1. **Set vs Array**: 使用Set进行冗余检查,时间复杂度O(1) vs O(n)
2. **Map vs Object**: 使用Map存储节点映射,支持任意类型的键
3. **批量查询**: 一次性查询所有数据,避免N+1查询问题

### 内存优化

1. **选择性字段**: 只查询必要的字段(name, label),不加载完整对象
2. **流式处理**: 对于超大文件,考虑流式处理(未来优化)
3. **及时释放**: 检测完成后立即释放临时数据结构

### 数据库优化

1. **索引利用**: 确保name和label字段有索引
2. **查询优化**: 使用select限制返回字段
3. **连接池**: 利用Prisma的连接池管理

### 预期性能指标

- 1000个节点检测: <2秒
- 5000条边检测: <3秒
- 内存使用: <100MB (对于10000个节点+边)
- 数据库查询: 固定2次(节点+边)

## 安全考虑

1. **输入验证**: 在冗余检测前验证数据格式
2. **SQL注入防护**: 使用Prisma的参数化查询
3. **权限检查**: 验证用户对项目和图谱的访问权限
4. **资源限制**: 限制单次导入的数据量,防止DoS攻击

## 未来扩展

1. **智能合并**: 允许用户选择合并冗余数据而不是跳过
2. **冗余报告**: 生成详细的冗余数据报告供用户下载
3. **增量导入**: 支持更新现有节点的属性而不是完全跳过
4. **跨图谱检测**: 可选的跨图谱冗余检测
5. **自定义规则**: 允许用户自定义冗余判断规则
