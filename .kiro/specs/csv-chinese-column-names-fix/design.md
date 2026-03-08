# CSV中文列名识别修复设计文档

## Overview

当前系统在解析CSV文件时只支持英文列名（source, target, from, to等），导致使用中文列名（源节点、目标节点、关系等）的CSV文件无法被识别，抛出"CSV文件必须包含source和target列"错误。

本修复将扩展`parseCSVWithEdgeData`函数中的列名识别逻辑，添加对常见中文列名的支持。修复策略是在现有的英文列名数组中添加对应的中文列名，使系统能够自动识别并映射到正确的字段。这是一个最小化的修改，不会影响现有的英文列名识别功能。

## Glossary

- **Bug_Condition (C)**: CSV文件的headers包含中文列名（如"源节点"、"目标节点"、"关系"等）
- **Property (P)**: 系统能够正确识别中文列名并成功解析CSV数据，创建正确的节点和边
- **Preservation**: 现有的英文列名识别功能必须保持不变，所有使用英文列名的CSV文件继续正常工作
- **parseCSVWithEdgeData**: `lib/services/graph-import.ts`中的函数，负责解析包含边数据的CSV文件
- **normalizeColumnName**: `lib/services/graph-import.ts`中的函数，负责规范化列名（移除BOM、空格、转小写等）
- **sourceIndex/targetIndex/labelIndex**: 在headers数组中查找source、target、label列的索引位置

## Bug Details

### Fault Condition

当CSV文件的列名使用中文时，`parseCSVWithEdgeData`函数无法在headers数组中找到匹配的列名索引。函数使用`findIndex`方法在预定义的英文列名数组中查找，但这些数组不包含中文列名，导致返回-1。

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type CSVInput with properties {headers: string[], lines: string[]}
  OUTPUT: boolean
  
  RETURN input.headers CONTAINS ANY OF [
    "源节点", "起点", "来源",           // source的中文别名
    "目标节点", "终点", "目的地",       // target的中文别名
    "关系", "关系类型", "边类型", "连接类型"  // label的中文别名
  ]
END FUNCTION
```

### Examples

- **示例1**: CSV包含列名["源节点", "目标节点", "关系"] → 当前抛出错误"CSV文件必须包含source和target列"，应该成功解析
- **示例2**: CSV包含列名["起点", "终点"] → 当前抛出错误，应该成功解析
- **示例3**: CSV包含列名["source", "目标节点"] → 当前抛出错误（只识别source，target未识别），应该成功解析
- **边缘情况**: CSV包含列名["源节点", "target", "关系类型"] → 应该正确识别所有三列

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- 使用英文列名"source"、"from"、"src"的CSV文件必须继续正常工作
- 使用英文列名"target"、"to"、"dest"、"dst"的CSV文件必须继续正常工作
- 使用英文列名"label"、"relationship"、"relation"、"type"的CSV文件必须继续正常工作
- 缺少必需列时的错误提示必须保持清晰
- 空行跳过逻辑必须保持不变
- 节点去重逻辑必须保持不变
- 边数据结构必须保持不变

**Scope:**
所有不包含中文列名的CSV文件应该完全不受此修复影响。这包括：
- 纯英文列名的CSV文件
- 包含其他语言列名的CSV文件（将继续报错，符合预期）
- 格式错误的CSV文件（将继续报错，符合预期）

## Hypothesized Root Cause

基于代码分析，根本原因非常明确：

1. **列名识别数组不完整**: `parseCSVWithEdgeData`函数在第426-428行使用硬编码的英文列名数组进行匹配
   - `sourceIndex`只查找`['source', 'from', 'src']`
   - `targetIndex`只查找`['target', 'to', 'dest', 'dst']`
   - `labelIndex`只查找`['label', 'relationship', 'relation', 'type']`
   - 这些数组不包含任何中文列名

2. **findIndex返回-1**: 当headers包含中文列名时，`findIndex`无法找到匹配项，返回-1

3. **错误检查触发**: 第430行的条件`if (sourceIndex === -1 || targetIndex === -1)`为true，抛出错误

## Correctness Properties

Property 1: Fault Condition - 中文列名识别

_For any_ CSV输入，当headers包含中文列名（如"源节点"、"目标节点"、"关系"等）时，修复后的parseCSVWithEdgeData函数SHALL成功识别这些列名，正确解析数据，并返回包含nodes和edges的ParsedGraphData对象，不抛出"CSV文件必须包含source和target列"错误。

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - 英文列名继续工作

_For any_ CSV输入，当headers不包含中文列名（即只包含英文列名或其他列名）时，修复后的parseCSVWithEdgeData函数SHALL产生与原始函数完全相同的结果，保持所有现有的解析行为、错误处理和数据结构。

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

根本原因分析确认后，修复方案非常直接：

**File**: `lib/services/graph-import.ts`

**Function**: `parseCSVWithEdgeData`

**Specific Changes**:
1. **扩展source列名数组**: 在第426行，将`['source', 'from', 'src']`扩展为包含中文别名
   - 添加: `'源节点'`, `'起点'`, `'来源'`
   - 新数组: `['source', 'from', 'src', '源节点', '起点', '来源']`

2. **扩展target列名数组**: 在第427行，将`['target', 'to', 'dest', 'dst']`扩展为包含中文别名
   - 添加: `'目标节点'`, `'终点'`, `'目的地'`
   - 新数组: `['target', 'to', 'dest', 'dst', '目标节点', '终点', '目的地']`

3. **扩展label列名数组**: 在第428行，将`['label', 'relationship', 'relation', 'type']`扩展为包含中文别名
   - 添加: `'关系'`, `'关系类型'`, `'边类型'`, `'连接类型'`
   - 新数组: `['label', 'relationship', 'relation', 'type', '关系', '关系类型', '边类型', '连接类型']`

4. **不需要修改normalizeColumnName**: 该函数已经正确处理中文字符，只需要保持现有的BOM移除、空格处理和小写转换逻辑

5. **不需要修改错误消息**: 第430行的错误消息已经包含`${headers.join(', ')}`，会自动显示中文列名

## Testing Strategy

### Validation Approach

测试策略遵循两阶段方法：首先在未修复的代码上运行探索性测试以确认bug存在，然后验证修复后的代码能够正确处理中文列名并保持英文列名的功能不变。

### Exploratory Fault Condition Checking

**Goal**: 在实施修复之前，在未修复的代码上运行测试以展示bug的存在。确认或反驳根本原因分析。如果反驳，需要重新假设。

**Test Plan**: 编写测试用例模拟包含中文列名的CSV输入，在未修复的代码上运行这些测试，观察失败并理解根本原因。

**Test Cases**:
1. **纯中文列名测试**: CSV包含["源节点", "目标节点", "关系"] (将在未修复代码上失败)
2. **中文别名测试**: CSV包含["起点", "终点"] (将在未修复代码上失败)
3. **混合中英文测试**: CSV包含["源节点", "target", "关系类型"] (将在未修复代码上失败)
4. **所有中文别名测试**: CSV包含["来源", "目的地", "边类型"] (将在未修复代码上失败)

**Expected Counterexamples**:
- 抛出错误: "CSV文件必须包含source和target列。找到的列：源节点, 目标节点, 关系"
- 可能原因: findIndex返回-1，列名数组不包含中文列名

### Fix Checking

**Goal**: 验证对于所有包含中文列名的输入，修复后的函数能够产生预期的行为。

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := parseCSVWithEdgeData_fixed(input.lines, input.headers)
  ASSERT (
    result.nodes.length > 0 AND
    result.edges.length > 0 AND
    no_error_thrown(result)
  )
END FOR
```

### Preservation Checking

**Goal**: 验证对于所有不包含中文列名的输入，修复后的函数产生与原始函数相同的结果。

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT parseCSVWithEdgeData_original(input.lines, input.headers) = 
         parseCSVWithEdgeData_fixed(input.lines, input.headers)
END FOR
```

**Testing Approach**: 强烈推荐使用基于属性的测试进行保持性检查，因为：
- 它自动生成大量测试用例覆盖输入域
- 它能捕获手动单元测试可能遗漏的边缘情况
- 它提供强有力的保证，确保所有非bug输入的行为保持不变

**Test Plan**: 首先在未修复的代码上观察英文列名的行为，然后编写基于属性的测试捕获该行为。

**Test Cases**:
1. **英文列名保持性**: 观察未修复代码对["source", "target", "label"]的处理，然后验证修复后行为相同
2. **英文别名保持性**: 观察未修复代码对["from", "to", "type"]的处理，然后验证修复后行为相同
3. **缺少必需列保持性**: 观察未修复代码对缺少source或target列的错误处理，然后验证修复后行为相同
4. **空值处理保持性**: 观察未修复代码对空source或target值的跳过逻辑，然后验证修复后行为相同

### Unit Tests

- 测试每个中文列名别名（源节点、起点、来源、目标节点、终点、目的地）
- 测试每个中文label别名（关系、关系类型、边类型、连接类型）
- 测试混合中英文列名的组合
- 测试边缘情况（只有source和target，没有label）
- 测试错误情况（缺少必需列，即使使用中文列名）

### Property-Based Tests

- 生成随机的中文列名组合，验证都能被正确识别
- 生成随机的英文列名组合，验证保持性（与原始函数结果相同）
- 生成随机的CSV数据行，验证节点和边的创建逻辑
- 测试大量随机输入以确保没有回归

### Integration Tests

- 测试完整的CSV导入流程，从文件上传到图数据创建
- 测试中文列名CSV文件在实际应用场景中的表现
- 测试与其他CSV解析功能（如Excel导入、JSON导入）的兼容性
- 验证错误消息在包含中文列名时的显示效果
