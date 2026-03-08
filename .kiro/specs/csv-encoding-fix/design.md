# CSV编码修复设计文档

## Overview

修复CSV文件导入时的编码问题。当CSV文件使用非UTF-8编码（如GBK、GB2312）保存时，系统当前使用`file.text()`方法默认以UTF-8解码，导致中文字符显示为乱码。

修复策略：在`parseCSVFile()`函数中，先读取文件的原始字节数据，使用编码检测库（jschardet）自动识别文件编码，然后使用正确的编码解码文件内容。这样可以支持GBK、GB2312、Big5、Shift-JIS等多种编码格式。

## Glossary

- **Bug_Condition (C)**: CSV文件使用非UTF-8编码（如GBK、GB2312）保存且包含多字节字符（如中文）
- **Property (P)**: 系统应自动检测文件编码并正确解码，字符正确显示
- **Preservation**: UTF-8编码的CSV文件、英文数字内容、edge-list格式、完整节点格式、Excel/JSON文件导入功能保持不变
- **parseCSVFile**: `lib/services/graph-import.ts`中的函数，负责解析CSV文件内容
- **file.text()**: File API方法，默认使用UTF-8解码文件内容
- **jschardet**: JavaScript编码检测库，可自动识别文件编码类型
- **TextDecoder**: Web API，支持使用指定编码解码字节数据

## Bug Details

### Fault Condition

当用户上传使用非UTF-8编码保存的CSV文件时，`parseCSVFile()`函数使用`file.text()`方法读取文件内容。该方法默认使用UTF-8编码解码字节流，当文件实际使用GBK、GB2312等编码时，多字节字符（如中文）会被错误解码，产生乱码。

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type File (CSV文件)
  OUTPUT: boolean
  
  RETURN input.type == 'text/csv'
         AND input.encoding IN ['GBK', 'GB2312', 'Big5', 'Shift-JIS', 'ISO-8859-1', ...]
         AND input.encoding != 'UTF-8'
         AND containsMultiByteCharacters(input.content)
END FUNCTION
```

### Examples

- **GBK编码CSV**: 文件包含"拥有"字符，使用GBK编码保存，导入后显示为"4???"
- **GB2312编码CSV**: 文件包含"关系"字符，使用GB2312编码保存，导入后显示为乱码
- **Big5编码CSV**: 文件包含繁体中文"擁有"，使用Big5编码保存，导入后显示为乱码
- **边界情况**: 文件仅包含ASCII字符（英文、数字），即使使用GBK编码保存，也能正确显示（因为ASCII在各编码中兼容）

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- UTF-8编码的CSV文件必须继续正确解析，保持现有功能
- 仅包含英文和数字的CSV文件必须继续正确解析
- edge-list格式（source, label, target）的CSV文件必须继续正确解析节点和边数据
- 完整节点数据格式（包含x, y坐标）的CSV文件必须继续正确解析
- Excel文件（.xlsx）和JSON文件的导入功能必须保持不变

**Scope:**
所有不涉及CSV文件编码的输入应完全不受此修复影响。这包括：
- Excel文件导入（使用不同的解析逻辑）
- JSON文件导入（使用不同的解析逻辑）
- UTF-8编码的CSV文件（编码检测应正确识别为UTF-8）
- 纯ASCII内容的CSV文件（在所有编码中兼容）

## Hypothesized Root Cause

基于bug描述，最可能的问题是：

1. **默认UTF-8解码**: `file.text()`方法默认使用UTF-8编码解码文件内容
   - 当文件实际使用GBK编码时，中文字符的字节序列被错误解释
   - 例如："拥有"的GBK编码为`0xD3 0xB5 0xD3 0xD0`，用UTF-8解码会产生乱码

2. **缺少编码检测**: 系统没有检测文件实际编码的机制
   - 无法识别文件是GBK、GB2312还是其他编码
   - 直接假设所有文件都是UTF-8编码

3. **缺少多编码支持**: 系统没有使用支持多种编码的解码器
   - `file.text()`只支持UTF-8解码
   - 需要使用`TextDecoder` API或类似工具支持多种编码

## Correctness Properties

Property 1: Fault Condition - 非UTF-8编码CSV文件正确解码

_For any_ CSV文件，当文件使用非UTF-8编码（如GBK、GB2312、Big5）保存且包含多字节字符时，修复后的parseCSVFile函数应自动检测文件编码，使用正确的编码解码文件内容，使得中文等多字节字符正确显示。

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - UTF-8和ASCII内容行为不变

_For any_ CSV文件，当文件使用UTF-8编码保存或仅包含ASCII字符时，修复后的代码应产生与原始代码完全相同的解析结果，保持所有现有功能（edge-list格式、完整节点格式、Excel/JSON导入）不变。

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

假设我们的根因分析正确：

**File**: `lib/services/graph-import.ts`

**Function**: `parseCSVFile`

**Specific Changes**:
1. **添加编码检测依赖**: 安装`jschardet`库用于自动检测文件编码
   - 运行: `npm install jschardet`
   - 导入: `import jschardet from 'jschardet'`

2. **读取原始字节数据**: 将`file.text()`改为`file.arrayBuffer()`
   - `const buffer = await file.arrayBuffer()`
   - `const uint8Array = new Uint8Array(buffer)`

3. **检测文件编码**: 使用jschardet分析字节数据
   - `const detected = jschardet.detect(uint8Array)`
   - `const encoding = detected.encoding || 'UTF-8'`

4. **使用正确编码解码**: 使用TextDecoder API解码
   - `const decoder = new TextDecoder(encoding)`
   - `const text = decoder.decode(uint8Array)`

5. **保持后续逻辑不变**: 解码后的text字符串继续使用现有的CSV解析逻辑
   - 保持`lines = text.split('\n').filter(line => line.trim())`
   - 保持headers解析和格式检测逻辑
   - 保持`parseCSVWithNodeData`和`parseCSVWithEdgeData`调用

**代码示例**:
```typescript
async function parseCSVFile(file: File): Promise<ParsedGraphData> {
  // 读取原始字节数据
  const buffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(buffer)
  
  // 检测文件编码
  const detected = jschardet.detect(uint8Array)
  const encoding = detected.encoding || 'UTF-8'
  
  // 使用检测到的编码解码文件
  const decoder = new TextDecoder(encoding)
  const text = decoder.decode(uint8Array)
  
  // 后续逻辑保持不变
  const lines = text.split('\n').filter(line => line.trim())
  // ... 现有的解析逻辑
}
```

## Testing Strategy

### Validation Approach

测试策略采用两阶段方法：首先在未修复的代码上演示bug（探索性测试），然后验证修复后的代码正确处理各种编码并保持现有功能不变。

### Exploratory Fault Condition Checking

**Goal**: 在实施修复之前，在未修复的代码上演示bug。确认或反驳根因分析。如果反驳，需要重新假设。

**Test Plan**: 创建使用不同编码保存的CSV测试文件，在未修复的代码上运行导入测试，观察中文字符是否显示为乱码。

**Test Cases**:
1. **GBK编码测试**: 创建包含"拥有"的CSV文件，使用GBK编码保存（在未修复代码上会失败）
2. **GB2312编码测试**: 创建包含"关系"的CSV文件，使用GB2312编码保存（在未修复代码上会失败）
3. **Big5编码测试**: 创建包含繁体中文"擁有"的CSV文件，使用Big5编码保存（在未修复代码上会失败）
4. **混合内容测试**: 创建包含中英文混合的CSV文件，使用GBK编码保存（在未修复代码上会失败）

**Expected Counterexamples**:
- 中文字符显示为乱码（如"拥有"显示为"4???"）
- 可能原因：file.text()使用UTF-8解码非UTF-8编码的字节流

### Fix Checking

**Goal**: 验证对于所有满足bug条件的输入，修复后的函数产生预期行为。

**Pseudocode:**
```
FOR ALL file WHERE isBugCondition(file) DO
  result := parseCSVFile_fixed(file)
  ASSERT allChineseCharactersDisplayCorrectly(result)
  ASSERT noGarbledText(result)
END FOR
```

### Preservation Checking

**Goal**: 验证对于所有不满足bug条件的输入，修复后的函数产生与原始函数相同的结果。

**Pseudocode:**
```
FOR ALL file WHERE NOT isBugCondition(file) DO
  ASSERT parseCSVFile_original(file) = parseCSVFile_fixed(file)
END FOR
```

**Testing Approach**: 推荐使用基于属性的测试进行保留性检查，因为：
- 它自动生成跨输入域的多个测试用例
- 它捕获手动单元测试可能遗漏的边界情况
- 它为所有非bug输入提供强有力的行为不变保证

**Test Plan**: 首先在未修复的代码上观察UTF-8文件和ASCII内容的行为，然后编写基于属性的测试捕获该行为。

**Test Cases**:
1. **UTF-8编码保留**: 观察UTF-8编码的CSV文件在未修复代码上正确解析，然后验证修复后继续正确解析
2. **ASCII内容保留**: 观察仅包含英文数字的CSV文件在未修复代码上正确解析，然后验证修复后继续正确解析
3. **Edge-list格式保留**: 观察source-label-target格式在未修复代码上正确解析，然后验证修复后继续正确解析
4. **完整节点格式保留**: 观察包含x,y坐标的格式在未修复代码上正确解析，然后验证修复后继续正确解析

### Unit Tests

- 测试GBK编码的CSV文件正确解码中文字符
- 测试GB2312编码的CSV文件正确解码中文字符
- 测试Big5编码的CSV文件正确解码繁体中文字符
- 测试UTF-8编码的CSV文件继续正确解析（保留性）
- 测试仅包含ASCII字符的CSV文件继续正确解析（保留性）
- 测试编码检测失败时的降级处理（默认使用UTF-8）

### Property-Based Tests

- 生成随机中文字符串，使用不同编码保存为CSV，验证解码后字符串正确
- 生成随机ASCII字符串，使用不同编码保存为CSV，验证解码后字符串与原始相同
- 生成随机节点和边数据，使用不同编码保存为CSV，验证解析结果的节点和边数据正确
- 测试跨多种编码（UTF-8、GBK、GB2312、Big5）的行为一致性

### Integration Tests

- 测试完整的CSV导入流程：上传GBK编码文件 → 解析 → 显示在3D图谱中
- 测试edge-list格式的GBK编码CSV文件导入完整流程
- 测试完整节点格式的GBK编码CSV文件导入完整流程
- 测试在导入页面切换不同编码的CSV文件，验证都能正确显示
