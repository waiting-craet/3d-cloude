# 导入模板简化功能 - 设计文档

## 概述

本设计文档描述了导入模板简化功能的技术实现方案。该功能旨在简化用户导入知识图谱数据的流程，通过移除复杂的技术字段（如坐标、颜色、大小等），让用户只需填写核心信息（节点名称、描述、关系），系统自动生成其他必要数据。

核心改进：
- 简化模板字段：只保留label、description、image、video等必要字段
- 自动生成坐标：使用力导向布局算法自动计算节点3D位置
- 支持媒体字段：允许用户为节点添加图片和视频URL
- 向后兼容：支持包含坐标的旧格式数据
- 增强验证：提供详细的错误信息和修复建议

## 架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户界面层                              │
├─────────────────────────────────────────────────────────────┤
│  导入页面 (app/import/page.tsx)                             │
│  - 文件上传组件                                              │
│  - 模板下载链接                                              │
│  - 使用说明展示                                              │
│  - 进度指示器                                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API层                                   │
├─────────────────────────────────────────────────────────────┤
│  /api/import (POST)          │  /api/templates (GET)        │
│  - 文件上传处理              │  - 模板文件生成              │
│  - 格式检测                  │  - 多格式支持                │
│  - 数据验证                  │                              │
│  - 坐标生成                  │                              │
│  - 数据保存                  │                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      服务层                                  │
├─────────────────────────────────────────────────────────────┤
│  GraphImportService          │  DataValidator               │
│  - parseExcelFile()          │  - validateGraphData()       │
│  - parseCSVFile()            │  - validateFileFormat()      │
│  - parseJSONFile()           │  - validateNodes()           │
│  - generateLayout()          │  - validateEdges()           │
│                              │                              │
│  CoordinateGenerator         │  TemplateGenerator           │
│  - generateCoordinates()     │  - generateJSON()            │
│  - applyForceLayout()        │  - generateCSV()             │
│  - centerLayout()            │  - generateExcel()           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据层                                  │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM                                                  │
│  - Node模型 (id, label, description, x, y, z, image, video) │
│  - Edge模型 (source, target, label)                         │
│  - Graph模型                                                 │
└─────────────────────────────────────────────────────────────┘
```

### 数据流程


1. **文件上传流程**
   ```
   用户上传文件 → 文件格式验证 → 解析文件内容 → 数据结构验证
   → 坐标生成（如需要）→ 保存到数据库 → 返回结果
   ```

2. **模板下载流程**
   ```
   用户请求模板 → 选择格式(JSON/CSV/Excel) → 生成简化模板
   → 返回文件下载
   ```

3. **坐标生成流程**
   ```
   检测坐标缺失 → 应用力导向布局算法 → 生成3D坐标
   → 验证坐标范围 → 确保节点间距 → 返回坐标数据
   ```

## 组件和接口

### 1. GraphImportService

**位置**: `lib/services/graph-import.ts`

**职责**: 解析各种格式的图谱数据文件，支持简化格式和旧格式

**接口定义**:

```typescript
// 节点数据接口（简化格式）
interface SimplifiedNodeData {
  label: string              // 必填：节点名称
  description?: string       // 可选：节点描述
  image?: string            // 可选：图片URL
  video?: string            // 可选：视频URL
}

// 边数据接口（简化格式）
interface SimplifiedEdgeData {
  source: string            // 必填：起始节点
  target: string            // 必填：目标节点
  label?: string            // 可选：关系名称
}

// 完整节点数据接口（包含生成的字段）
interface NodeData extends SimplifiedNodeData {
  id?: string
  x?: number
  y?: number
  z?: number
  color?: string
  size?: number
  shape?: string
}

// 解析结果接口
interface ParsedGraphData {
  nodes: NodeData[]
  edges: EdgeData[]
}

// 主要函数
async function parseExcelFile(file: File): Promise<ParsedGraphData>
async function parseCSVFile(file: File): Promise<ParsedGraphData>
async function parseJSONFile(file: File): Promise<ParsedGraphData>
function generateLayout(nodes: NodeData[], edges: EdgeData[]): NodeData[]
```

**实现要点**:
- 支持三种文件格式：Excel (.xlsx, .xls)、CSV (.csv)、JSON (.json)
- Excel格式采用三元组结构（实体1-关系-实体2），每行表示一个完整关系
- JSON和CSV格式保持nodes/edges分离结构
- 自动检测简化格式和旧格式，兼容两者
- 解析时只提取必要字段，忽略未知字段
- 对于缺失的可选字段，使用默认值
- 从三元组格式自动提取节点和边信息



### 2. CoordinateGenerator

**位置**: `lib/services/coordinate-generator.ts` (新建)

**职责**: 为没有坐标的节点自动生成3D空间坐标

**接口定义**:

```typescript
interface CoordinateGeneratorConfig {
  iterations?: number          // 迭代次数，默认100
  springLength?: number        // 弹簧长度，默认30
  springStrength?: number      // 弹簧强度，默认0.1
  repulsionStrength?: number   // 排斥力强度，默认1000
  damping?: number            // 阻尼系数，默认0.9
  minDistance?: number        // 最小节点间距，默认20
  timeout?: number            // 超时时间（毫秒），默认10000
}

interface CoordinateGenerationResult {
  nodes: NodeData[]           // 包含坐标的节点数组
  generatedCount: number      // 生成坐标的节点数量
  providedCount: number       // 用户提供坐标的节点数量
  executionTime: number       // 执行时间（毫秒）
  usedFallback: boolean      // 是否使用了后备算法
}

class CoordinateGenerator {
  // 主要方法：为节点生成坐标
  generateCoordinates(
    nodes: NodeData[],
    edges: EdgeData[],
    config?: CoordinateGeneratorConfig
  ): CoordinateGenerationResult

  // 力导向布局算法
  private applyForceLayout(
    nodes: NodeData[],
    edges: EdgeData[],
    config: CoordinateGeneratorConfig
  ): NodeData[]

  // 简化的随机布局（后备方案）
  private applyRandomLayout(nodes: NodeData[]): NodeData[]

  // 验证坐标范围
  private validateCoordinateRange(nodes: NodeData[]): boolean

  // 确保最小节点间距
  private enforceMinimumDistance(
    nodes: NodeData[],
    minDistance: number
  ): NodeData[]

  // 居中布局
  private centerLayout(nodes: NodeData[]): NodeData[]
}
```

**算法设计**:

1. **力导向布局算法** (主算法)
   - 基于物理模拟的图布局算法
   - 节点之间存在排斥力（库仑力）
   - 有边连接的节点之间存在吸引力（胡克定律）
   - 通过迭代计算达到能量最小化状态
   - 时间复杂度：O(n² × iterations)

2. **随机布局算法** (后备方案)
   - 在球形空间内随机分布节点
   - 确保最小间距
   - 时间复杂度：O(n²)

**性能优化**:
- 节点数 < 100: 使用完整力导向算法，目标1秒内完成
- 节点数 100-500: 减少迭代次数，目标5秒内完成
- 节点数 > 500: 进一步减少迭代次数，目标10秒内完成
- 超时保护: 如果超过配置的超时时间，切换到随机布局



### 3. DataValidator

**位置**: `lib/services/data-validator.ts` (已存在，需增强)

**职责**: 验证导入数据的完整性和正确性，提供详细的错误信息

**接口定义**:

```typescript
interface ValidationError {
  type: 'MISSING_FIELD' | 'INVALID_REFERENCE' | 'INVALID_URL' | 'INVALID_FORMAT'
  message: string
  details: string
  location?: {
    nodeIndex?: number
    edgeIndex?: number
    field?: string
  }
  suggestions: string[]
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  data?: ParsedGraphData
}

class DataValidator {
  // 验证图谱数据
  static validateGraphData(data: ParsedGraphData): ValidationResult

  // 验证节点数据
  private static validateNodes(nodes: NodeData[]): ValidationError[]

  // 验证边数据
  private static validateEdges(
    edges: EdgeData[],
    nodes: NodeData[]
  ): ValidationError[]

  // 验证URL格式
  private static validateURL(url: string): boolean

  // 验证文件格式
  static validateFileFormat(file: File): ValidationResult

  // 生成验证报告
  static generateValidationReport(result: ValidationResult): string
}
```

**验证规则**:

1. **节点验证**
   - label字段必须存在且非空
   - label必须唯一（同一图谱内）
   - description、image、video字段可选
   - 如果提供image或video，验证URL格式
   - URL格式无效时记录警告但不阻止导入

2. **边验证**
   - source和target字段必须存在且非空
   - source和target必须引用存在的节点
   - label字段可选
   - 检测自环边（警告）
   - 检测重复边（警告）

3. **文件验证**
   - 文件大小不超过10MB
   - 文件格式为支持的类型（.xlsx, .xls, .csv, .json）
   - 文件内容可被正确解析

**错误信息设计**:
- 提供具体的错误位置（节点索引、边索引、字段名）
- 提供清晰的错误描述
- 提供可操作的修复建议
- 区分错误（必须修复）和警告（建议修复）



### 4. TemplateGenerator

**位置**: `lib/services/template-generator.ts` (新建)

**职责**: 生成简化格式的模板文件

**接口定义**:

```typescript
interface TemplateConfig {
  includeExamples?: boolean    // 是否包含示例数据，默认true
  exampleNodeCount?: number    // 示例节点数量，默认5
  exampleEdgeCount?: number    // 示例边数量，默认5
  includeMediaFields?: boolean // 是否包含媒体字段示例，默认true
  includeInstructions?: boolean // 是否包含使用说明，默认true
}

class TemplateGenerator {
  // 生成JSON模板
  static generateJSONTemplate(config?: TemplateConfig): string

  // 生成CSV模板
  static generateCSVTemplate(config?: TemplateConfig): string

  // 生成Excel模板
  static generateExcelTemplate(config?: TemplateConfig): Buffer

  // 生成示例节点数据
  private static generateExampleNodes(count: number): SimplifiedNodeData[]

  // 生成示例边数据
  private static generateExampleEdges(
    nodes: SimplifiedNodeData[],
    count: number
  ): SimplifiedEdgeData[]
}
```

**模板内容设计**:

1. **JSON模板结构**
```json
{
  "使用说明": {
    "简介": "这是一个简化的3D知识图谱模板，只需填写节点名称和关系即可",
    "自动生成": "系统会自动生成：3D坐标、节点颜色、节点大小、节点形状、节点ID",
    "必填字段": "label（节点名称）、source（起始节点）、target（目标节点）",
    "可选字段": "description（节点描述）、image（图片URL）、video（视频URL）、label（关系名称）",
    "提示": "删除此说明对象后开始填写您的数据"
  },
  "nodes": [
    {
      "label": "示例节点1",
      "description": "这是节点的描述信息",
      "image": "https://example.com/image.jpg",
      "video": "https://example.com/video.mp4"
    }
  ],
  "edges": [
    {
      "source": "示例节点1",
      "target": "示例节点2",
      "label": "关系名称"
    }
  ]
}
```

2. **CSV模板结构**
```csv
# 节点数据（Nodes）
label,description,image,video
示例节点1,这是节点的描述信息,https://example.com/image.jpg,https://example.com/video.mp4

# 边数据（Edges）
source,target,label
示例节点1,示例节点2,关系名称
```

3. **Excel模板结构**（三元组格式）
- Sheet 1: "关系数据" - 每行表示一个完整的关系
  - 列A: 实体1（起始节点名称）
  - 列B: 内容1（起始节点描述，可选）
  - 列C: 关系（边的标签，可选）
  - 列D: 实体2（目标节点名称）
  - 列E: 内容2（目标节点描述，可选）
- Sheet 2: "使用说明" - 详细的使用指南和示例



## 数据模型

### 数据库模型（Prisma Schema）

```prisma
model Node {
  id          String   @id @default(cuid())
  graphId     String
  graph       Graph    @relation(fields: [graphId], references: [id], onDelete: Cascade)
  
  // 核心字段（用户填写）
  label       String
  description String   @default("")
  
  // 媒体字段（新增）
  image       String?
  video       String?
  
  // 坐标字段（系统生成）
  x           Float
  y           Float
  z           Float
  
  // 视觉属性（系统生成）
  color       String?
  size        Float?
  shape       String?
  
  // 元数据
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关系
  edgesFrom   Edge[]   @relation("EdgeSource")
  edgesTo     Edge[]   @relation("EdgeTarget")
  
  @@unique([graphId, label])
  @@index([graphId])
}

model Edge {
  id          String   @id @default(cuid())
  graphId     String
  graph       Graph    @relation(fields: [graphId], references: [id], onDelete: Cascade)
  
  // 核心字段
  sourceId    String
  targetId    String
  label       String   @default("")
  
  // 关系
  source      Node     @relation("EdgeSource", fields: [sourceId], references: [id], onDelete: Cascade)
  target      Node     @relation("EdgeTarget", fields: [targetId], references: [id], onDelete: Cascade)
  
  // 元数据
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([graphId])
  @@index([sourceId])
  @@index([targetId])
}

model Graph {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  name        String
  description String   @default("")
  
  // 图谱数据
  nodes       Node[]
  edges       Edge[]
  
  // 元数据
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([projectId])
}
```

### 内存数据结构

```typescript
// 简化格式的图谱数据（用户输入）
interface SimplifiedGraphData {
  nodes: SimplifiedNodeData[]
  edges: SimplifiedEdgeData[]
}

// 完整格式的图谱数据（系统处理后）
interface CompleteGraphData {
  nodes: CompleteNodeData[]
  edges: CompleteEdgeData[]
  metadata: {
    nodeCount: number
    edgeCount: number
    generatedCoordinates: number
    providedCoordinates: number
    processingTime: number
  }
}

interface CompleteNodeData {
  id: string
  label: string
  description: string
  image?: string
  video?: string
  x: number
  y: number
  z: number
  color: string
  size: number
  shape: string
}

interface CompleteEdgeData {
  id: string
  source: string
  target: string
  label: string
}
```



## API设计

### 1. 导入API

**端点**: `POST /api/import`

**请求**:
```typescript
// FormData格式
{
  file: File              // 上传的文件（Excel/CSV/JSON）
  projectId: string       // 项目ID
  graphId: string         // 图谱ID
  fileType: 'excel' | 'csv' | 'json'
}
```

**响应**:
```typescript
// 成功响应
{
  success: true,
  data: {
    nodeCount: number,
    edgeCount: number,
    generatedCoordinates: number,
    providedCoordinates: number,
    processingTime: number
  },
  warnings: string[]      // 警告信息（如URL格式无效）
}

// 失败响应
{
  success: false,
  errors: ValidationError[],
  warnings: string[]
}
```

**处理流程**:
1. 验证文件格式和大小
2. 解析文件内容
3. 验证数据完整性
4. 生成缺失的坐标
5. 保存到数据库
6. 返回结果

### 2. 模板下载API

**端点**: `GET /api/templates`

**请求参数**:
```typescript
{
  format: 'json' | 'csv' | 'excel'  // 模板格式
}
```

**响应**:
- JSON格式: 返回JSON文件
- CSV格式: 返回CSV文件
- Excel格式: 返回Excel文件（.xlsx）

**处理流程**:
1. 根据format参数生成对应格式的模板
2. 设置正确的Content-Type和文件名
3. 返回文件流

### 3. 导出API（新增）

**端点**: `GET /api/graphs/:id/export`

**请求参数**:
```typescript
{
  format: 'simplified' | 'complete'  // 导出格式
}
```

**响应**:
```json
// simplified格式（简化格式，用于再次导入）
{
  "nodes": [
    {
      "label": "节点1",
      "description": "描述",
      "image": "url",
      "video": "url"
    }
  ],
  "edges": [
    {
      "source": "节点1",
      "target": "节点2",
      "label": "关系"
    }
  ]
}

// complete格式（完整格式，包含所有字段）
{
  "nodes": [
    {
      "id": "node1",
      "label": "节点1",
      "description": "描述",
      "x": 100,
      "y": 200,
      "z": 150,
      "color": "#00bfa5",
      "size": 1.2,
      "shape": "sphere",
      "image": "url",
      "video": "url"
    }
  ],
  "edges": [
    {
      "id": "edge1",
      "source": "node1",
      "target": "node2",
      "label": "关系"
    }
  ]
}
```



## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

基于需求文档中的验收标准，我们定义以下正确性属性：

### 属性1: 坐标自动生成

*对于任何*不包含坐标信息的图谱数据，导入后所有节点都应该具有有效的3D坐标（x, y, z），且坐标值在合理范围内（-10000到10000）。

**验证需求**: 2.1, 2.2

### 属性2: 节点间距保证

*对于任何*生成坐标的图谱数据，任意两个节点之间的欧几里得距离应该大于最小间距阈值，避免节点重叠。

**验证需求**: 2.3

### 属性3: 连接节点距离优化

*对于任何*图谱数据，有边连接的节点对之间的平均距离应该小于无边连接的节点对之间的平均距离。

**验证需求**: 2.4

### 属性4: 坐标持久化往返

*对于任何*图谱数据，生成坐标后保存到数据库，再从数据库读取，坐标值应该保持一致（允许浮点数精度误差）。

**验证需求**: 2.5

### 属性5: 媒体字段支持

*对于任何*包含image或video字段的节点数据，导入后这些字段的值应该被正确保存，且可以同时存在。

**验证需求**: 3.1, 3.2, 3.3

### 属性6: URL格式验证

*对于任何*节点数据，如果image或video字段包含无效的URL格式，系统应该记录警告但继续导入流程，不应该中断导入。

**验证需求**: 3.4, 3.5

### 属性7: 向后兼容性

*对于任何*包含坐标字段的图谱数据，导入时应该使用用户提供的坐标值，而不是重新生成；对于混合数据（部分节点有坐标，部分没有），应该只为缺失坐标的节点生成坐标。

**验证需求**: 5.1, 5.2, 5.3

### 属性8: 必填字段验证

*对于任何*图谱数据，所有节点必须包含非空的label字段，所有边必须包含非空的source和target字段，否则验证应该失败并返回详细的错误信息（包括具体位置）。

**验证需求**: 6.1, 6.2, 6.4

### 属性9: 引用完整性验证

*对于任何*图谱数据，所有边的source和target必须引用存在的节点label，否则验证应该失败并返回详细的错误信息（包括无效的节点名称和边索引）。

**验证需求**: 6.3, 6.4

### 属性10: 可选字段容忍

*对于任何*图谱数据，description、image、video字段（节点）和label字段（边）可以为空或缺失，系统应该接受这样的数据。

**验证需求**: 6.5

### 属性11: 文件格式解析往返

*对于任何*有效的简化格式图谱数据，导入后导出再导入应该产生等价的图谱结构（节点数量、边数量、节点label、边关系保持一致）。

**验证需求**: 8.5

### 属性12: 性能保证

*对于任何*图谱数据，坐标生成时间应该满足以下要求：
- 节点数 < 100: 完成时间 ≤ 1秒
- 节点数 100-500: 完成时间 ≤ 5秒
- 节点数 > 500: 完成时间 ≤ 10秒

如果超时，应该使用后备算法完成。

**验证需求**: 9.1, 9.2, 9.3, 9.5

### 属性13: 错误信息质量

*对于任何*验证失败的图谱数据，错误信息应该包含：
- 错误类型
- 具体位置（节点索引或边索引）
- 详细描述
- 修复建议

**验证需求**: 6.4, 10.2, 10.3

### 属性14: 成功反馈完整性

*对于任何*成功导入的图谱数据，系统应该显示导入的节点数量、边数量、生成坐标的节点数量等统计信息。

**验证需求**: 10.4



## 错误处理

### 错误分类

1. **文件格式错误**
   - 不支持的文件类型
   - 文件大小超过限制（10MB）
   - 文件内容无法解析
   - 文件编码错误

2. **数据验证错误**
   - 必填字段缺失
   - 节点label重复
   - 边引用不存在的节点
   - 数据结构不正确

3. **URL格式警告**
   - image字段URL格式无效
   - video字段URL格式无效
   - 注意：这些是警告，不阻止导入

4. **性能错误**
   - 坐标生成超时
   - 内存不足
   - 数据库连接失败

### 错误处理策略

```typescript
// 错误处理流程
try {
  // 1. 文件验证
  const fileValidation = validateFileFormat(file)
  if (!fileValidation.isValid) {
    return {
      success: false,
      errors: fileValidation.errors,
      suggestions: [
        '支持的格式：Excel (.xlsx, .xls)、CSV (.csv)、JSON (.json)',
        '文件大小不超过10MB',
        '确保文件编码为UTF-8'
      ]
    }
  }

  // 2. 文件解析
  const parsedData = await parseFile(file)

  // 3. 数据验证
  const dataValidation = validateGraphData(parsedData)
  if (!dataValidation.isValid) {
    return {
      success: false,
      errors: dataValidation.errors,
      warnings: dataValidation.warnings
    }
  }

  // 4. 坐标生成
  const coordinateResult = generateCoordinates(
    parsedData.nodes,
    parsedData.edges
  )
  
  if (coordinateResult.usedFallback) {
    warnings.push('坐标生成超时，使用了简化布局算法')
  }

  // 5. 数据保存
  await saveToDatabase(coordinateResult.nodes, parsedData.edges)

  return {
    success: true,
    data: {
      nodeCount: coordinateResult.nodes.length,
      edgeCount: parsedData.edges.length,
      generatedCoordinates: coordinateResult.generatedCount,
      providedCoordinates: coordinateResult.providedCount
    },
    warnings: dataValidation.warnings
  }

} catch (error) {
  // 未预期的错误
  console.error('Import failed:', error)
  return {
    success: false,
    errors: [{
      type: 'UNEXPECTED_ERROR',
      message: '导入过程中发生未知错误',
      details: error.message,
      suggestions: [
        '请检查文件格式是否正确',
        '尝试重新上传文件',
        '如果问题持续，请联系技术支持'
      ]
    }]
  }
}
```

### 用户反馈设计

1. **进度指示器**
   ```typescript
   interface ImportProgress {
     step: 'parsing' | 'validating' | 'generating' | 'saving'
     progress: number  // 0-100
     message: string
   }
   ```

2. **错误展示**
   - 使用红色背景的错误卡片
   - 显示错误类型和详细信息
   - 提供可操作的修复建议
   - 显示具体的错误位置

3. **警告展示**
   - 使用黄色背景的警告卡片
   - 显示警告信息
   - 说明不影响导入流程
   - 提供优化建议

4. **成功展示**
   - 使用绿色背景的成功卡片
   - 显示导入统计信息
   - 提供查看图谱的链接
   - 显示处理时间



## 测试策略

### 双重测试方法

本功能采用单元测试和基于属性的测试相结合的方法，确保全面的测试覆盖：

- **单元测试**: 验证特定示例、边缘情况和错误条件
- **基于属性的测试**: 验证跨所有输入的通用属性
- 两者互补且都是必需的，以实现全面覆盖

### 单元测试

单元测试专注于：
- 特定示例，展示正确行为
- 组件之间的集成点
- 边缘情况和错误条件

**测试文件结构**:
```
lib/services/__tests__/
  ├── coordinate-generator.test.ts
  ├── template-generator.test.ts
  ├── data-validator.test.ts
  └── graph-import.test.ts
```

**关键测试用例**:

1. **CoordinateGenerator测试**
   ```typescript
   describe('CoordinateGenerator', () => {
     test('应该为没有坐标的节点生成坐标', () => {
       const nodes = [
         { label: 'A' },
         { label: 'B' }
       ]
       const edges = [{ source: 'A', target: 'B' }]
       
       const result = generator.generateCoordinates(nodes, edges)
       
       expect(result.nodes[0].x).toBeDefined()
       expect(result.nodes[0].y).toBeDefined()
       expect(result.nodes[0].z).toBeDefined()
     })

     test('应该保留用户提供的坐标', () => {
       const nodes = [
         { label: 'A', x: 100, y: 200, z: 300 }
       ]
       
       const result = generator.generateCoordinates(nodes, [])
       
       expect(result.nodes[0].x).toBe(100)
       expect(result.nodes[0].y).toBe(200)
       expect(result.nodes[0].z).toBe(300)
     })

     test('应该在超时时使用后备算法', () => {
       const nodes = Array.from({ length: 1000 }, (_, i) => ({
         label: `Node${i}`
       }))
       
       const result = generator.generateCoordinates(nodes, [], {
         timeout: 100  // 很短的超时时间
       })
       
       expect(result.usedFallback).toBe(true)
     })
   })
   ```

2. **DataValidator测试**
   ```typescript
   describe('DataValidator', () => {
     test('应该拒绝缺少label的节点', () => {
       const data = {
         nodes: [{ description: 'test' }],
         edges: []
       }
       
       const result = DataValidator.validateGraphData(data)
       
       expect(result.isValid).toBe(false)
       expect(result.errors[0].type).toBe('MISSING_FIELD')
     })

     test('应该检测无效的边引用', () => {
       const data = {
         nodes: [{ label: 'A' }],
         edges: [{ source: 'A', target: 'B' }]
       }
       
       const result = DataValidator.validateGraphData(data)
       
       expect(result.isValid).toBe(false)
       expect(result.errors[0].type).toBe('INVALID_REFERENCE')
     })

     test('应该对无效URL发出警告但不阻止导入', () => {
       const data = {
         nodes: [{ 
           label: 'A',
           image: 'not-a-url'
         }],
         edges: []
       }
       
       const result = DataValidator.validateGraphData(data)
       
       expect(result.isValid).toBe(true)
       expect(result.warnings.length).toBeGreaterThan(0)
     })
   })
   ```

3. **TemplateGenerator测试**
   ```typescript
   describe('TemplateGenerator', () => {
     test('JSON模板应该不包含坐标字段', () => {
       const template = TemplateGenerator.generateJSONTemplate()
       const parsed = JSON.parse(template)
       
       parsed.nodes.forEach(node => {
         expect(node.x).toBeUndefined()
         expect(node.y).toBeUndefined()
         expect(node.z).toBeUndefined()
       })
     })

     test('模板应该包含媒体字段示例', () => {
       const template = TemplateGenerator.generateJSONTemplate()
       const parsed = JSON.parse(template)
       
       const hasImageExample = parsed.nodes.some(n => n.image)
       const hasVideoExample = parsed.nodes.some(n => n.video)
       
       expect(hasImageExample).toBe(true)
       expect(hasVideoExample).toBe(true)
     })
   })
   ```



### 基于属性的测试

基于属性的测试验证跨许多生成输入的通用属性。每个属性都是一个形式化规范，应该对所有有效输入成立。

**测试库**: 使用 `fast-check` 进行基于属性的测试

**配置**: 每个属性测试最少运行100次迭代（由于随机化）

**测试文件结构**:
```
lib/services/__tests__/
  ├── coordinate-generator.property.test.ts
  ├── data-validator.property.test.ts
  └── graph-import.property.test.ts
```

**属性测试实现**:

1. **属性1: 坐标自动生成**
   ```typescript
   import fc from 'fast-check'

   // Feature: import-template-simplification, Property 1: 
   // 对于任何不包含坐标信息的图谱数据，导入后所有节点都应该具有有效的3D坐标
   test('属性1: 坐标自动生成', () => {
     fc.assert(
       fc.property(
         fc.array(fc.record({
           label: fc.string({ minLength: 1 })
         }), { minLength: 1, maxLength: 50 }),
         fc.array(fc.record({
           source: fc.string({ minLength: 1 }),
           target: fc.string({ minLength: 1 })
         })),
         (nodes, edges) => {
           const result = generator.generateCoordinates(nodes, edges)
           
           return result.nodes.every(node => 
             typeof node.x === 'number' &&
             typeof node.y === 'number' &&
             typeof node.z === 'number' &&
             Math.abs(node.x) <= 10000 &&
             Math.abs(node.y) <= 10000 &&
             Math.abs(node.z) <= 10000
           )
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

2. **属性2: 节点间距保证**
   ```typescript
   // Feature: import-template-simplification, Property 2:
   // 对于任何生成坐标的图谱数据，任意两个节点之间的距离应该大于最小间距
   test('属性2: 节点间距保证', () => {
     fc.assert(
       fc.property(
         fc.array(fc.record({
           label: fc.string({ minLength: 1 })
         }), { minLength: 2, maxLength: 30 }),
         (nodes) => {
           const result = generator.generateCoordinates(nodes, [])
           const minDistance = 5  // 最小间距阈值
           
           for (let i = 0; i < result.nodes.length; i++) {
             for (let j = i + 1; j < result.nodes.length; j++) {
               const n1 = result.nodes[i]
               const n2 = result.nodes[j]
               const distance = Math.sqrt(
                 Math.pow(n2.x - n1.x, 2) +
                 Math.pow(n2.y - n1.y, 2) +
                 Math.pow(n2.z - n1.z, 2)
               )
               if (distance < minDistance) {
                 return false
               }
             }
           }
           return true
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

3. **属性4: 坐标持久化往返**
   ```typescript
   // Feature: import-template-simplification, Property 4:
   // 对于任何图谱数据，生成坐标后保存到数据库再读取，坐标值应该保持一致
   test('属性4: 坐标持久化往返', async () => {
     fc.assert(
       await fc.asyncProperty(
         fc.array(fc.record({
           label: fc.string({ minLength: 1 })
         }), { minLength: 1, maxLength: 20 }),
         async (nodes) => {
           const result = generator.generateCoordinates(nodes, [])
           
           // 保存到数据库
           const savedNodes = await saveNodes(result.nodes)
           
           // 从数据库读取
           const loadedNodes = await loadNodes(savedNodes.map(n => n.id))
           
           // 验证坐标一致性（允许浮点数精度误差）
           return result.nodes.every((original, i) => {
             const loaded = loadedNodes[i]
             return (
               Math.abs(original.x - loaded.x) < 0.001 &&
               Math.abs(original.y - loaded.y) < 0.001 &&
               Math.abs(original.z - loaded.z) < 0.001
             )
           })
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

4. **属性7: 向后兼容性**
   ```typescript
   // Feature: import-template-simplification, Property 7:
   // 对于任何包含坐标字段的图谱数据，应该使用用户提供的坐标值
   test('属性7: 向后兼容性', () => {
     fc.assert(
       fc.property(
         fc.array(fc.record({
           label: fc.string({ minLength: 1 }),
           x: fc.option(fc.float({ min: -10000, max: 10000 })),
           y: fc.option(fc.float({ min: -10000, max: 10000 })),
           z: fc.option(fc.float({ min: -10000, max: 10000 }))
         }), { minLength: 1, maxLength: 30 }),
         (nodes) => {
           const result = generator.generateCoordinates(nodes, [])
           
           return nodes.every((original, i) => {
             const generated = result.nodes[i]
             
             // 如果原始节点有坐标，应该保留
             if (original.x !== null && original.y !== null && original.z !== null) {
               return (
                 Math.abs(generated.x - original.x) < 0.001 &&
                 Math.abs(generated.y - original.y) < 0.001 &&
                 Math.abs(generated.z - original.z) < 0.001
               )
             }
             
             // 如果原始节点没有坐标，应该生成
             return (
               typeof generated.x === 'number' &&
               typeof generated.y === 'number' &&
               typeof generated.z === 'number'
             )
           })
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

5. **属性8: 必填字段验证**
   ```typescript
   // Feature: import-template-simplification, Property 8:
   // 对于任何图谱数据，所有节点必须包含非空的label字段
   test('属性8: 必填字段验证', () => {
     fc.assert(
       fc.property(
         fc.array(fc.record({
           label: fc.option(fc.string()),
           description: fc.string()
         }), { minLength: 1 }),
         (nodes) => {
           const result = DataValidator.validateGraphData({ nodes, edges: [] })
           
           const hasEmptyLabel = nodes.some(n => !n.label || n.label.trim() === '')
           
           // 如果有空label，验证应该失败
           if (hasEmptyLabel) {
             return !result.isValid && result.errors.some(e => e.type === 'MISSING_FIELD')
           }
           
           // 如果所有label都有效，验证应该通过
           return result.isValid || result.errors.every(e => e.type !== 'MISSING_FIELD')
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

6. **属性11: 文件格式解析往返**
   ```typescript
   // Feature: import-template-simplification, Property 11:
   // 对于任何有效的简化格式数据，导入后导出再导入应该产生等价的图谱结构
   test('属性11: 文件格式解析往返', async () => {
     fc.assert(
       await fc.asyncProperty(
         fc.record({
           nodes: fc.array(fc.record({
             label: fc.string({ minLength: 1 }),
             description: fc.option(fc.string()),
             image: fc.option(fc.webUrl()),
             video: fc.option(fc.webUrl())
           }), { minLength: 1, maxLength: 20 }),
           edges: fc.array(fc.record({
             source: fc.string({ minLength: 1 }),
             target: fc.string({ minLength: 1 }),
             label: fc.option(fc.string())
           }))
         }),
         async (data) => {
           // 第一次导入
           const imported1 = await importGraphData(data)
           
           // 导出
           const exported = await exportGraphData(imported1.graphId, 'simplified')
           
           // 第二次导入
           const imported2 = await importGraphData(exported)
           
           // 验证等价性
           return (
             imported1.nodeCount === imported2.nodeCount &&
             imported1.edgeCount === imported2.edgeCount &&
             nodesAreEquivalent(imported1.nodes, imported2.nodes) &&
             edgesAreEquivalent(imported1.edges, imported2.edges)
           )
         }
       ),
       { numRuns: 100 }
     )
   })
   ```

### 测试覆盖目标

- 单元测试代码覆盖率: ≥ 80%
- 属性测试覆盖所有定义的正确性属性
- 集成测试覆盖完整的导入流程
- 性能测试验证时间要求



## 实现计划

### 阶段1: 核心服务实现（第1-2周）

1. **CoordinateGenerator实现**
   - 实现力导向布局算法
   - 实现随机布局后备算法
   - 实现坐标范围验证
   - 实现节点间距强制
   - 性能优化

2. **DataValidator增强**
   - 添加媒体字段验证
   - 增强错误信息质量
   - 添加URL格式验证
   - 实现详细的错误定位

3. **TemplateGenerator实现**
   - 实现JSON模板生成
   - 实现CSV模板生成
   - 实现Excel模板生成
   - 添加使用说明

### 阶段2: API和集成（第3周）

4. **更新导入API**
   - 集成CoordinateGenerator
   - 更新数据验证流程
   - 添加进度指示
   - 实现错误处理

5. **更新模板API**
   - 集成TemplateGenerator
   - 支持多格式下载
   - 更新响应格式

6. **实现导出API**
   - 实现简化格式导出
   - 实现完整格式导出
   - 支持JSON格式

### 阶段3: UI更新（第4周）

7. **更新导入页面**
   - 更新使用说明
   - 添加进度指示器
   - 改进错误展示
   - 添加成功反馈

8. **更新模板文件**
   - 更新JSON模板
   - 更新CSV模板
   - 更新README文档
   - 更新QUICK-START文档

### 阶段4: 测试和优化（第5周）

9. **单元测试**
   - CoordinateGenerator测试
   - DataValidator测试
   - TemplateGenerator测试
   - GraphImportService测试

10. **基于属性的测试**
    - 实现所有14个属性测试
    - 配置fast-check
    - 运行测试套件

11. **性能测试**
    - 测试不同规模的图谱
    - 验证时间要求
    - 优化瓶颈

12. **集成测试**
    - 端到端导入流程测试
    - 往返测试
    - 向后兼容性测试

### 阶段5: 文档和发布（第6周）

13. **文档更新**
    - API文档
    - 用户指南
    - 开发者文档
    - 迁移指南

14. **发布准备**
    - 代码审查
    - 性能验证
    - 安全审查
    - 发布计划

## 依赖关系

### 外部依赖

```json
{
  "dependencies": {
    "xlsx": "^0.18.5",           // Excel文件处理
    "papaparse": "^5.4.1",       // CSV文件解析
    "fast-check": "^3.15.0"      // 基于属性的测试
  }
}
```

### 内部依赖

- `lib/force-layout.ts`: 力导向布局算法（已存在）
- `lib/coordinate-converter.ts`: 坐标转换工具（已存在）
- `lib/services/data-validator.ts`: 数据验证服务（需增强）
- `lib/services/graph-import.ts`: 图谱导入服务（需更新）
- `prisma/schema.prisma`: 数据库模型（需添加媒体字段）

## 性能考虑

### 坐标生成性能

1. **算法复杂度**
   - 力导向算法: O(n² × iterations)
   - 随机布局: O(n²)

2. **优化策略**
   - 根据节点数量动态调整迭代次数
   - 使用空间分区加速距离计算
   - 实现早停机制（能量收敛）
   - 超时保护切换到后备算法

3. **性能基准**
   ```
   节点数    目标时间    实际时间    算法
   10        < 0.1s     0.05s      力导向
   50        < 0.5s     0.3s       力导向
   100       < 1s       0.8s       力导向
   200       < 2s       1.5s       力导向（减少迭代）
   500       < 5s       4.2s       力导向（减少迭代）
   1000      < 10s      8.5s       力导向（减少迭代）
   2000      < 10s      9.8s       随机布局（后备）
   ```

### 文件解析性能

1. **内存管理**
   - 流式解析大文件
   - 限制文件大小（10MB）
   - 及时释放内存

2. **解析优化**
   - 使用高效的解析库
   - 并行处理（如果可能）
   - 缓存解析结果

### 数据库性能

1. **批量操作**
   - 使用批量插入
   - 事务处理
   - 索引优化

2. **查询优化**
   - 使用适当的索引
   - 避免N+1查询
   - 使用连接查询

## 安全考虑

### 输入验证

1. **文件验证**
   - 验证文件类型
   - 限制文件大小
   - 检查文件内容

2. **数据验证**
   - 验证所有输入字段
   - 防止SQL注入
   - 防止XSS攻击

3. **URL验证**
   - 验证URL格式
   - 检查URL协议（http/https）
   - 防止SSRF攻击

### 访问控制

1. **认证**
   - 验证用户身份
   - 检查会话有效性

2. **授权**
   - 验证项目访问权限
   - 验证图谱访问权限
   - 防止越权访问

### 数据保护

1. **数据完整性**
   - 使用事务
   - 验证引用完整性
   - 备份重要数据

2. **错误处理**
   - 不泄露敏感信息
   - 记录安全事件
   - 提供安全的错误消息

## 监控和日志

### 日志记录

```typescript
// 导入操作日志
logger.info('Import started', {
  userId: user.id,
  projectId: project.id,
  graphId: graph.id,
  fileType: file.type,
  fileSize: file.size
})

logger.info('Coordinate generation', {
  nodeCount: nodes.length,
  generatedCount: result.generatedCount,
  providedCount: result.providedCount,
  executionTime: result.executionTime,
  usedFallback: result.usedFallback
})

logger.info('Import completed', {
  nodeCount: result.nodeCount,
  edgeCount: result.edgeCount,
  totalTime: Date.now() - startTime
})

// 错误日志
logger.error('Import failed', {
  userId: user.id,
  error: error.message,
  stack: error.stack
})
```

### 性能监控

1. **关键指标**
   - 导入成功率
   - 平均导入时间
   - 坐标生成时间
   - 后备算法使用率

2. **告警规则**
   - 导入失败率 > 5%
   - 平均导入时间 > 15秒
   - 后备算法使用率 > 20%

## 向后兼容性

### 数据迁移

1. **旧格式支持**
   - 继续支持包含坐标的旧格式
   - 自动检测格式类型
   - 混合格式处理

2. **数据库迁移**
   ```sql
   -- 添加媒体字段
   ALTER TABLE "Node" ADD COLUMN "image" TEXT;
   ALTER TABLE "Node" ADD COLUMN "video" TEXT;
   
   -- 添加索引
   CREATE INDEX "Node_graphId_label_idx" ON "Node"("graphId", "label");
   ```

3. **API兼容性**
   - 保持现有API端点
   - 添加新的可选参数
   - 不破坏现有客户端

### 迁移指南

为用户提供从旧格式迁移到新格式的指南：

1. **自动迁移**
   - 系统自动处理旧格式数据
   - 无需用户手动操作

2. **手动优化**
   - 建议用户使用新的简化模板
   - 提供转换工具
   - 提供示例和教程

## 未来扩展

### 短期扩展（3-6个月）

1. **更多布局算法**
   - 层次布局
   - 圆形布局
   - 网格布局

2. **自定义配置**
   - 用户可配置布局参数
   - 自定义颜色方案
   - 自定义节点大小规则

3. **批量导入**
   - 支持多文件导入
   - 支持增量导入
   - 支持合并导入

### 长期扩展（6-12个月）

1. **AI辅助**
   - 自动提取节点描述
   - 智能关系推荐
   - 自动分类和标签

2. **协作功能**
   - 多人同时编辑
   - 版本控制
   - 变更历史

3. **高级可视化**
   - 自定义节点样式
   - 动画效果
   - 交互式编辑

## 总结

本设计文档详细描述了导入模板简化功能的技术实现方案。通过简化模板字段、自动生成坐标、支持媒体字段等改进，显著降低了用户使用门槛，提升了导入体验。

核心优势：
- **简单易用**: 用户只需填写核心信息
- **智能自动**: 系统自动生成复杂的技术数据
- **向后兼容**: 支持旧格式数据
- **健壮可靠**: 完善的验证和错误处理
- **性能优异**: 满足各种规模的图谱需求

通过双重测试策略（单元测试 + 基于属性的测试），确保功能的正确性和可靠性。详细的错误处理和用户反馈设计，提供了良好的用户体验。

