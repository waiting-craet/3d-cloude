# CSV导入列验证修复设计文档

## Overview

本修复解决CSV文件导入时列名大小写不敏感匹配的问题。当前实现在`lib/services/graph-import.ts`的`parseCSVFile`函数中将headers转换为小写，但在某些边缘情况下（如空格、特殊字符、BOM标记等）可能导致匹配失败。修复将增强列名规范化逻辑，并改进错误消息以提供更好的诊断信息。

## Glossary

- **Bug_Condition (C)**: CSV文件包含有效的列名（如"Source", "Target"或其变体），但由于大小写、空格或特殊字符问题导致列名匹配失败
- **Property (P)**: 系统应正确识别任意大小写形式的有效列名，并在匹配失败时提供清晰的错误消息
- **Preservation**: 现有的CSV解析功能（标准小写列名、别名支持、节点数据解析）必须保持不变
- **parseCSVFile**: `lib/services/graph-import.ts`中的主解析函数，负责读取CSV文件并路由到相应的解析器
- **parseCSVWithEdgeData**: 解析source-target格式CSV的函数，包含列名验证逻辑
- **headers**: CSV文件第一行的列名数组，应被规范化为小写以进行匹配

## Bug Details

### Fault Condition

当CSV文件包含有效的列名但由于以下原因导致匹配失败时，bug会显现：
1. 列名包含额外的空格（如" Source ", "Target "）
2. CSV文件包含BOM（Byte Order Mark）标记，影响第一个列名
3. 列名包含不可见字符（如零宽空格、制表符）
4. 大小写转换在某些Unicode字符上失败

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { csvContent: string, headers: string[] }
  OUTPUT: boolean
  
  RETURN hasValidColumnNames(input.csvContent)
         AND (hasExtraWhitespace(input.headers) 
              OR hasBOM(input.csvContent)
              OR hasInvisibleCharacters(input.headers)
              OR caseConversionFailed(input.headers))
         AND columnMatchingFails(input.headers)
END FUNCTION
```

### Examples

- **示例1**: CSV文件列名为"Source, Target, Label"（大写S、T、L），但headers数组在trim()后仍包含额外空格，导致`['source ', 'target ', 'label ']`无法匹配`['source', 'from', 'src']`
- **示例2**: CSV文件以UTF-8 BOM开头，第一个列名变成`"\uFEFFsource"`，toLowerCase后仍为`"\uFEFFsource"`，无法匹配
- **示例3**: 用户使用Excel保存CSV，列名包含不可见的零宽空格，导致`"source\u200B"`无法匹配
- **边缘情况**: CSV文件列名为"FROM, TO"（全大写），应正确识别为source和target的别名

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- 使用标准小写列名（source, target, label）的CSV文件必须继续正常工作
- 支持的列名别名（from, to, src, dst, dest, relationship, relation, type）必须继续被识别
- 包含完整节点数据（x, y坐标）的CSV文件必须继续使用parseCSVWithNodeData函数
- parseCSVLine函数的行为必须保持不变
- 返回的ParsedGraphData结构必须保持不变

**Scope:**
所有不涉及列名验证的CSV解析功能应完全不受影响。这包括：
- 节点和边数据的提取逻辑
- 坐标转换和布局生成
- 空行和空值的处理
- 其他文件格式（JSON、Excel）的导入

## Hypothesized Root Cause

基于bug描述和代码分析，最可能的问题是：

1. **不完整的字符串规范化**: 当前代码只使用`trim()`和`toLowerCase()`，但没有处理：
   - BOM标记（\uFEFF）
   - 零宽空格（\u200B, \u200C, \u200D）
   - 其他不可见Unicode字符
   - 多余的内部空格

2. **错误消息不足**: 当列名匹配失败时，错误消息不显示实际找到的列名，用户无法诊断问题

3. **缺少防御性编程**: 没有对headers数组进行额外验证，假设trim()和toLowerCase()总是足够的

## Correctness Properties

Property 1: Fault Condition - 大小写不敏感的列名匹配

_For any_ CSV文件输入，其中包含有效的列名（source/target或其别名）但使用任意大小写、包含额外空格或特殊字符，修复后的parseCSVFile函数SHALL正确识别这些列名，成功解析文件并返回有效的ParsedGraphData结构。

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - 现有CSV解析行为

_For any_ CSV文件输入，其中使用标准格式（小写列名、无特殊字符），修复后的代码SHALL产生与原始代码完全相同的解析结果，保持所有现有功能（别名支持、节点数据解析、坐标处理）不变。

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

Property 3: Fault Condition - 改进的错误消息

_For any_ CSV文件输入，其中列名匹配失败，修复后的parseCSVWithEdgeData函数SHALL在错误消息中包含实际找到的列名列表，帮助用户诊断问题。

**Validates: Requirements 2.3**

## Fix Implementation

### Changes Required

假设我们的根因分析正确：

**File**: `lib/services/graph-import.ts`

**Function**: `parseCSVFile` 和 `parseCSVWithEdgeData`

**Specific Changes**:

1. **增强列名规范化函数**: 创建一个新的辅助函数`normalizeColumnName`
   - 移除BOM标记（\uFEFF）
   - 移除所有不可见Unicode字符（零宽空格等）
   - 转换为小写
   - Trim前后空格
   - 移除内部多余空格

2. **更新parseCSVFile函数**: 使用新的规范化函数处理headers
   ```typescript
   const headers = lines[0].split(',').map(h => normalizeColumnName(h))
   ```

3. **改进错误消息**: 在parseCSVWithEdgeData中，当列名匹配失败时显示实际列名
   ```typescript
   if (sourceIndex === -1 || targetIndex === -1) {
     throw new Error(`CSV文件必须包含source和target列。找到的列：${headers.join(', ')}`)
   }
   ```

4. **添加单元测试**: 测试各种边缘情况
   - BOM标记
   - 额外空格
   - 大小写变体
   - 零宽字符

5. **添加日志记录**: 在开发模式下记录原始和规范化后的列名，便于调试

## Testing Strategy

### Validation Approach

测试策略采用两阶段方法：首先在未修复的代码上演示bug（探索性测试），然后验证修复正确工作且保持现有行为不变。

### Exploratory Fault Condition Checking

**Goal**: 在实施修复之前，在未修复的代码上演示bug。确认或反驳根因分析。如果反驳，需要重新假设。

**Test Plan**: 编写测试用例，使用包含各种边缘情况的CSV内容（BOM、额外空格、大小写变体）调用parseCSVFile。在未修复的代码上运行这些测试，观察失败并理解根本原因。

**Test Cases**:
1. **BOM标记测试**: CSV内容以"\uFEFFSource,Target,Label"开头（将在未修复代码上失败）
2. **额外空格测试**: CSV列名为" Source , Target , Label "（可能在未修复代码上失败）
3. **大写变体测试**: CSV列名为"SOURCE,TARGET,LABEL"（应该工作，但验证）
4. **零宽字符测试**: CSV列名为"Source\u200B,Target\u200B"（将在未修复代码上失败）
5. **混合别名测试**: CSV列名为"FROM,TO,Type"（应该工作，但验证）

**Expected Counterexamples**:
- 包含BOM或不可见字符的列名无法匹配
- 可能的原因：trim()和toLowerCase()不足以处理所有Unicode边缘情况

### Fix Checking

**Goal**: 验证对于所有满足bug条件的输入，修复后的函数产生预期行为。

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := parseCSVFile_fixed(input)
  ASSERT result.nodes.length > 0
  ASSERT result.edges.length > 0
  ASSERT noErrorThrown()
END FOR
```

**Test Plan**: 使用各种边缘情况CSV文件测试修复后的代码，验证所有情况都能正确解析。

**Test Cases**:
1. **BOM标记**: 验证包含BOM的CSV文件能正确解析
2. **各种大小写**: 验证"Source", "SOURCE", "source", "SoUrCe"都能识别
3. **额外空格**: 验证" Source ", "Target "能正确识别
4. **零宽字符**: 验证包含零宽空格的列名能正确处理
5. **别名大小写**: 验证"FROM", "From", "from"都能识别为source别名

### Preservation Checking

**Goal**: 验证对于所有不满足bug条件的输入，修复后的函数产生与原始函数相同的结果。

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT parseCSVFile_original(input) = parseCSVFile_fixed(input)
END FOR
```

**Testing Approach**: 推荐使用基于属性的测试进行保持性检查，因为：
- 它自动生成跨输入域的许多测试用例
- 它捕获手动单元测试可能遗漏的边缘情况
- 它为所有非bug输入提供强有力的保证，确保行为不变

**Test Plan**: 首先在未修复的代码上观察标准CSV文件的行为，然后编写基于属性的测试捕获该行为。

**Test Cases**:
1. **标准小写列名**: 观察"source,target,label"在未修复代码上正常工作，验证修复后继续工作
2. **别名支持**: 观察"from,to,relationship"在未修复代码上正常工作，验证修复后继续工作
3. **节点数据格式**: 观察包含x,y坐标的CSV在未修复代码上使用parseCSVWithNodeData，验证修复后继续使用
4. **空行处理**: 观察空行被正确跳过，验证修复后继续跳过
5. **特殊字符在数据中**: 观察节点名称中的特殊字符被正确保留，验证修复后继续保留

### Unit Tests

- 测试normalizeColumnName函数处理各种输入（BOM、空格、大小写、零宽字符）
- 测试parseCSVFile正确路由到parseCSVWithEdgeData或parseCSVWithNodeData
- 测试parseCSVWithEdgeData的错误消息包含实际列名
- 测试边缘情况（空文件、只有headers、单行数据）

### Property-Based Tests

- 生成随机CSV内容，包含各种列名变体，验证所有有效变体都能被识别
- 生成随机标准格式CSV，验证修复后的解析结果与原始代码相同
- 测试大量随机输入，确保没有回归

### Integration Tests

- 测试完整的CSV导入流程，从文件上传到图数据生成
- 测试与前端组件的集成，验证错误消息正确显示
- 测试与其他导入格式（JSON、Excel）的兼容性保持不变
