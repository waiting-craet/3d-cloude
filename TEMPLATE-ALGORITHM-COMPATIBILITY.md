# 模板与算法兼容性验证

## 概述

本文档验证所有模板文件与导入算法的数据结构完全兼容。

## 数据结构对照

### 节点（Node）数据结构

#### 算法期望的接口
```typescript
interface NodeData {
  id?: string           // 可选，用于节点映射
  label: string         // 必需，节点显示名称
  description?: string  // 可选，节点描述
  x?: number           // 可选，X坐标
  y?: number           // 可选，Y坐标
  z?: number           // 可选，Z坐标（3D）
  color?: string       // 可选，颜色
  size?: number        // 可选，大小
  shape?: string       // 可选，形状
}
```

#### 模板提供的字段

**JSON模板（2D）**：
```json
{
  "id": "node1",
  "label": "节点A",
  "description": "这是节点A的描述",
  "x": 100,
  "y": 100,
  "color": "#00bfa5",
  "size": 1,
  "shape": "sphere"
}
```
✅ 完全匹配

**JSON模板（3D）**：
```json
{
  "id": "node1",
  "label": "中心节点",
  "description": "这是中心节点的描述",
  "x": 0,
  "y": 0,
  "z": 0,
  "color": "#00bfa5",
  "size": 1.5,
  "shape": "sphere"
}
```
✅ 完全匹配

**Excel模板（2D）**：
| id | label | description | x | y | color | size | shape |
|----|-------|-------------|---|---|-------|------|-------|
✅ 完全匹配

**Excel模板（3D）**：
| id | label | description | x | y | z | color | size | shape |
|----|-------|-------------|---|---|---|-------|------|-------|
✅ 完全匹配

**CSV模板（边格式）**：
```csv
source,target,label
```
✅ 算法会自动从边数据提取节点

### 边（Edge）数据结构

#### 算法期望的接口
```typescript
interface EdgeData {
  source: string  // 必需，源节点id或label
  target: string  // 必需，目标节点id或label
  label?: string  // 可选，边标签
}
```

#### 模板提供的字段

**JSON模板**：
```json
{
  "source": "node1",
  "target": "node2",
  "label": "关系1"
}
```
✅ 完全匹配

**Excel模板**：
| source | target | label |
|--------|--------|-------|
✅ 完全匹配

**CSV模板**：
```csv
source,target,label
```
✅ 完全匹配

## 算法处理流程验证

### 1. Excel文件解析

#### 双工作表格式
```typescript
parseExcelWithSeparateSheets(workbook, graphType)
```
- ✅ 读取Nodes工作表
- ✅ 读取Edges工作表
- ✅ 映射所有字段（id, label, description, x, y, z, color, size, shape）
- ✅ 支持大小写变体（Label/label, X/x等）

#### 单工作表格式
```typescript
parseExcelWithSingleSheet(workbook, graphType)
```
- ✅ 读取边数据（source, target, label）
- ✅ 自动提取节点
- ✅ 创建节点集合

### 2. CSV文件解析

#### 完整节点数据格式
```typescript
parseCSVWithNodeData(lines, headers, graphType)
```
- ✅ 解析所有节点字段
- ✅ 处理CSV引号和逗号
- ✅ 支持2D和3D坐标

#### 边数据格式
```typescript
parseCSVWithEdgeData(lines, headers)
```
- ✅ 识别source/target列
- ✅ 支持多种列名变体（source/from/src, target/to/dest）
- ✅ 自动提取节点

### 3. JSON文件解析

#### 标准格式
```typescript
parseJSONWithNodesEdges(data, graphType)
```
- ✅ 解析nodes数组
- ✅ 解析edges数组
- ✅ 映射所有可选字段
- ✅ 支持嵌套data字段（Cytoscape格式）

### 4. 布局生成

```typescript
generateLayout(nodes, edges, graphType)
```
- ✅ 检测现有坐标
- ✅ 为缺失坐标的节点生成位置
- ✅ 使用力导向算法
- ✅ 支持2D和3D布局

## 字段映射兼容性

### 算法支持的列名变体

#### 节点字段
- `id` / `ID`
- `label` / `Label` / `name` / `Name`
- `description` / `Description`
- `x` / `X`
- `y` / `Y`
- `z` / `Z`
- `color` / `Color`
- `size` / `Size`
- `shape` / `Shape`

#### 边字段
- `source` / `Source` / `from` / `From` / `src`
- `target` / `Target` / `to` / `To` / `dest` / `dst`
- `label` / `Label` / `relationship` / `Relationship` / `relation` / `type`

### 模板使用的列名

所有模板统一使用小写列名：
- ✅ `id`, `label`, `description`
- ✅ `x`, `y`, `z`
- ✅ `color`, `size`, `shape`
- ✅ `source`, `target`, `label`

## 默认值处理

### 算法提供的默认值

```typescript
// 节点默认值
{
  label: '未命名节点',
  description: '',
  x: 自动生成,
  y: 自动生成,
  z: 自动生成（3D）,
  color: '#00bfa5',
  size: 1,
  shape: 'sphere'
}
```

### 模板提供的示例值

```typescript
// 2D节点示例
{
  color: '#00bfa5', '#ff6b6b', '#4ecdc4', '#ffe66d'
  size: 0.8, 1, 1.2, 1.5
  shape: 'sphere'
}

// 3D节点示例
{
  color: '#00bfa5', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf'
  size: 0.8, 1, 1.5
  shape: 'sphere'
}
```

✅ 所有示例值都在合理范围内

## 测试场景

### 场景1：完整数据导入
- 模板：JSON（包含所有字段）
- 结果：✅ 所有字段正确导入
- 布局：✅ 使用提供的坐标

### 场景2：最小数据导入
- 模板：CSV（仅source, target, label）
- 结果：✅ 自动提取节点
- 布局：✅ 自动生成坐标

### 场景3：混合数据导入
- 模板：JSON（部分节点有坐标）
- 结果：✅ 保留已有坐标
- 布局：✅ 为缺失坐标的节点生成位置

### 场景4：2D到3D
- 模板：2D JSON（x, y坐标）
- 图谱类型：3D
- 结果：✅ 自动生成z坐标

### 场景5：Excel双工作表
- 模板：Excel（Nodes + Edges）
- 结果：✅ 正确解析两个工作表
- 布局：✅ 使用提供的坐标

## 兼容性总结

| 格式 | 模板字段 | 算法支持 | 兼容性 |
|------|---------|---------|--------|
| JSON 2D | 8个字段 | 完全支持 | ✅ 100% |
| JSON 3D | 9个字段 | 完全支持 | ✅ 100% |
| CSV 边格式 | 3个字段 | 完全支持 | ✅ 100% |
| CSV 节点格式 | 8-9个字段 | 完全支持 | ✅ 100% |
| Excel 2D | 8个字段 | 完全支持 | ✅ 100% |
| Excel 3D | 9个字段 | 完全支持 | ✅ 100% |

## 结论

✅ 所有模板文件与导入算法的数据结构完全兼容
✅ 算法支持所有模板提供的字段
✅ 算法提供合理的默认值
✅ 支持多种数据格式和结构
✅ 自动布局功能正常工作

模板和算法已经完全对齐，可以安全使用！
