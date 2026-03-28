# 批量删除字段名称错误修复设计

## Overview

此 bug 是由于 `app/api/projects/batch-delete/route.ts` 中的 Prisma 查询使用了错误的关系字段名称导致的。在第 145-156 行的 `include` 语句中使用了单数形式 `node` 和 `edge`，但在第 167-169 行访问数据时使用了复数形式 `project.nodes` 和 `project.edges`。根据 `prisma/schema.prisma`，Project 模型的关系字段名称是 `nodes` 和 `edges`（复数形式）。这导致查询返回的数据结构与代码访问不匹配，引发运行时错误，使批量删除功能失败。

修复策略：将 Prisma 查询中的 `include` 字段名称从单数形式改为复数形式，使其与 schema 定义和代码访问保持一致。

## Glossary

- **Bug_Condition (C)**: 当 Prisma 查询使用错误的字段名称（单数 `node`/`edge`）时触发的条件
- **Property (P)**: 查询应使用正确的字段名称（复数 `nodes`/`edges`），使代码能够正确访问节点和边的数据
- **Preservation**: 批量删除的其他功能（验证、事务、Blob 清理、错误处理）必须保持不变
- **deleteProject**: `app/api/projects/batch-delete/route.ts` 中的函数，负责删除单个项目及其关联数据
- **Prisma include**: Prisma 查询中用于加载关联数据的选项，字段名称必须与 schema 中定义的关系名称完全匹配

## Bug Details

### Fault Condition

该 bug 在 `deleteProject` 函数执行 Prisma 查询时触发。查询使用了错误的关系字段名称（单数形式），导致返回的数据结构与后续代码访问不匹配。

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { projectId: string }
  OUTPUT: boolean
  
  RETURN prismaQuery.include.node EXISTS
         AND prismaQuery.include.edge EXISTS
         AND codeAccesses.includes('project.nodes')
         AND codeAccesses.includes('project.edges')
         AND schemaDefinition.relationNames = ['nodes', 'edges']
END FUNCTION
```

### Examples

- **示例 1**: 用户选择 2 个项目进行批量删除
  - 预期：两个项目及其关联数据被成功删除
  - 实际：删除失败，错误信息显示无法读取 undefined 的属性 'length'

- **示例 2**: 用户选择 1 个包含 5 个节点和 3 条边的项目进行删除
  - 预期：项目、5 个节点、3 条边及关联的 Blob 文件被删除
  - 实际：Prisma 查询返回 `project.node` 和 `project.edge`，但代码尝试访问 `project.nodes.length` 时抛出错误

- **示例 3**: 用户选择 3 个项目，其中 1 个不存在
  - 预期：2 个存在的项目被删除，1 个返回"项目不存在"错误
  - 实际：所有删除操作都失败，因为字段名称错误导致运行时错误

- **边缘情况**: 用户选择的项目没有任何节点和边
  - 预期：项目被成功删除，节点和边计数为 0
  - 实际：由于字段名称错误，无法访问空数组的 length 属性

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- 请求验证逻辑必须继续工作（验证 projectIds 数组格式和内容）
- 使用 Promise.allSettled 并行处理多个删除操作的机制必须保持不变
- Prisma 事务确保数据完整性的逻辑必须保持不变
- Blob 文件清理逻辑（包括项目文件夹和单独文件）必须继续工作
- 错误处理和日志记录机制必须保持不变
- 返回的响应格式（BatchDeleteResponse）必须保持不变

**Scope:**
所有不涉及 Prisma 查询 `include` 字段名称的代码应完全不受影响。这包括：
- 请求参数验证逻辑
- Promise.allSettled 并行处理逻辑
- Prisma 事务删除逻辑
- Blob 文件删除逻辑
- 错误处理和响应生成逻辑

## Hypothesized Root Cause

基于 bug 描述和代码分析，最可能的问题是：

1. **字段名称不匹配**: 在第 145-156 行，Prisma 查询使用了 `include: { node: {...}, edge: {...} }`（单数形式），但 Prisma schema 中 Project 模型定义的关系名称是 `nodes` 和 `edges`（复数形式）

2. **代码访问不一致**: 在第 167-169 行，代码尝试访问 `project.nodes.length` 和 `project.edges.length`，期望这些字段存在，但由于查询使用了错误的字段名称，实际返回的是 `project.node` 和 `project.edge`

3. **TypeScript 类型检查未捕获**: 可能由于使用了 `any` 类型或类型断言，TypeScript 编译器未能在编译时捕获此错误

4. **复制粘贴错误**: 可能是从其他代码复制时使用了错误的字段名称，未与 schema 定义核对

## Correctness Properties

Property 1: Fault Condition - Prisma 查询字段名称正确性

_For any_ 批量删除请求，当 deleteProject 函数执行 Prisma 查询时，查询的 `include` 字段名称 SHALL 使用复数形式 `nodes` 和 `edges`，与 Prisma schema 中 Project 模型的关系定义完全匹配，使代码能够正确访问 `project.nodes` 和 `project.edges` 属性。

**Validates: Requirements 2.2, 2.3**

Property 2: Preservation - 批量删除功能完整性

_For any_ 批量删除请求，修复后的代码 SHALL 保持所有现有功能不变，包括请求验证、并行处理、事务管理、Blob 清理、错误处理和响应格式，确保除字段名称修复外的所有行为与原始代码完全相同。

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

假设我们的根本原因分析是正确的：

**File**: `app/api/projects/batch-delete/route.ts`

**Function**: `deleteProject`

**Specific Changes**:
1. **修复 Prisma 查询字段名称（第 145-156 行）**:
   - 将 `node: { select: {...} }` 改为 `nodes: { select: {...} }`
   - 将 `edge: { select: {...} }` 改为 `edges: { select: {...} }`
   - 确保字段名称与 Prisma schema 中的关系定义一致

2. **验证代码访问一致性（第 167-169 行）**:
   - 确认代码访问 `project.nodes.length` 和 `project.edges.length` 保持不变
   - 确保修复后的查询返回的数据结构与代码访问匹配

3. **验证类型定义**:
   - 检查是否需要更新 TypeScript 类型定义以反映正确的字段名称
   - 确保类型检查能够捕获类似的错误

## Testing Strategy

### Validation Approach

测试策略采用两阶段方法：首先在未修复的代码上运行探索性测试以确认 bug 存在，然后验证修复后的代码能够正确工作并保持现有功能不变。

### Exploratory Fault Condition Checking

**Goal**: 在实施修复之前，在未修复的代码上运行测试以确认 bug 存在。验证或反驳根本原因分析。如果反驳，需要重新假设。

**Test Plan**: 编写测试模拟批量删除请求，在未修复的代码上运行，观察是否因字段名称错误而失败。

**Test Cases**:
1. **单项目删除测试**: 删除 1 个包含节点和边的项目（在未修复代码上将失败）
2. **多项目删除测试**: 删除 3 个项目（在未修复代码上将失败）
3. **空项目删除测试**: 删除没有节点和边的项目（在未修复代码上可能失败）
4. **混合场景测试**: 删除存在和不存在的项目混合（在未修复代码上将失败）

**Expected Counterexamples**:
- 代码尝试访问 `project.nodes.length` 时抛出 TypeError: Cannot read property 'length' of undefined
- 可能的原因：Prisma 查询使用了 `node` 而不是 `nodes`，导致返回的对象没有 `nodes` 属性

### Fix Checking

**Goal**: 验证对于所有触发 bug 条件的输入，修复后的函数产生预期行为。

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := deleteProject_fixed(input.projectId)
  ASSERT result.success = true OR result.error = "项目不存在"
  ASSERT result.deletedCounts.nodes >= 0
  ASSERT result.deletedCounts.edges >= 0
END FOR
```

### Preservation Checking

**Goal**: 验证对于所有不触发 bug 条件的输入，修复后的函数产生与原始函数相同的结果。

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT deleteProject_original(input) = deleteProject_fixed(input)
END FOR
```

**Testing Approach**: 使用基于属性的测试进行保留检查，因为：
- 它自动生成大量测试用例覆盖输入域
- 它能捕获手动单元测试可能遗漏的边缘情况
- 它为所有非 bug 输入提供强有力的保证，确保行为不变

**Test Plan**: 首先在未修复的代码上观察其他功能的行为（请求验证、错误处理、Blob 清理），然后编写基于属性的测试捕获这些行为。

**Test Cases**:
1. **请求验证保留**: 观察未修复代码对无效请求的处理，验证修复后继续返回 400 错误
2. **错误处理保留**: 观察未修复代码对不存在项目的处理，验证修复后继续返回相应错误
3. **Blob 清理保留**: 观察未修复代码的 Blob 删除逻辑，验证修复后继续尝试删除文件
4. **响应格式保留**: 观察未修复代码的响应结构，验证修复后返回相同格式的响应

### Unit Tests

- 测试 Prisma 查询返回正确的数据结构（包含 `nodes` 和 `edges` 字段）
- 测试代码能够正确访问 `project.nodes.length` 和 `project.edges.length`
- 测试边缘情况（空项目、不存在的项目、包含大量节点和边的项目）
- 测试请求验证逻辑继续工作
- 测试错误处理逻辑继续工作

### Property-Based Tests

- 生成随机项目 ID 数组，验证批量删除功能正确工作
- 生成随机项目配置（不同数量的节点、边、Blob 文件），验证删除计数正确
- 测试所有验证和错误处理路径在多种场景下继续工作

### Integration Tests

- 测试完整的批量删除流程（从请求到响应）
- 测试 Prisma 事务确保数据完整性
- 测试 Blob 文件清理在实际环境中工作
- 测试并行删除多个项目的性能和正确性
