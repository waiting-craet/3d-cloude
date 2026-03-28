# 首页卡片点击404错误修复设计

## Overview

修复首页项目卡片点击后导致404错误的问题。当前实现错误地尝试跳转到不存在的 `/project/${projectId}` 路由。正确的行为应该是在首页本页通过状态切换展示该项目下的知识图谱列表，实现"推荐广场"和"项目图谱列表"两种视图模式的切换，而不是进行路由跳转。

修复策略：在 `app/page.tsx` 中添加视图状态管理，通过条件渲染实现两种视图模式的切换，并调用现有的 `/api/projects/[id]/graphs` API获取图谱数据。

## Glossary

- **Bug_Condition (C)**: 用户点击首页项目卡片时触发的错误路由跳转行为
- **Property (P)**: 点击项目卡片后应该在当前页面切换视图显示图谱列表，而不是跳转路由
- **Preservation**: 现有的推荐广场显示、图谱卡片点击跳转、API调用等功能必须保持不变
- **handleProjectClick**: `app/page.tsx` 中的函数，当前错误地调用 `router.push('/project/${projectId}')`
- **viewMode**: 新增的状态变量，用于区分"推荐广场"和"项目图谱列表"两种视图模式
- **selectedProject**: 新增的状态变量，存储当前选中的项目信息

## Bug Details

### Fault Condition

当用户点击首页的项目卡片时，`handleProjectClick` 函数尝试跳转到 `/project/${projectId}` 路由，但该路由不存在，导致404错误。正确的行为应该是在当前页面切换视图状态，展示该项目下的图谱列表。

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { eventType: string, projectId: string, currentRoute: string }
  OUTPUT: boolean
  
  RETURN input.eventType === 'projectCardClick'
         AND input.projectId !== null
         AND input.currentRoute === '/'
         AND navigationAttemptedTo('/project/' + input.projectId)
END FUNCTION
```

### Examples

- **示例1**: 用户在首页点击"知识图谱系统"项目卡片 → 系统跳转到 `/project/abc123` → 显示404错误页面（实际行为）
  - 预期：在首页切换视图，显示"知识图谱系统项目中的知识图谱"标题和该项目的图谱列表
  
- **示例2**: 用户在首页点击"AI研究"项目卡片 → 系统跳转到 `/project/def456` → 显示404错误页面（实际行为）
  - 预期：在首页切换视图，显示"AI研究项目中的知识图谱"标题和该项目的图谱列表

- **示例3**: 用户点击项目卡片后看到图谱列表，点击返回按钮 → 应该返回推荐广场视图
  - 预期：视图切换回推荐广场，显示所有项目卡片

- **边缘情况**: 用户点击的项目没有任何图谱 → 应该显示空状态提示"该项目还没有创建任何图谱"

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- 推荐广场视图中的项目卡片显示必须继续正常工作
- 用户点击图谱卡片跳转到 `/graph/${graphId}` 的行为必须继续正常工作
- 导航栏、Hero Section、搜索功能等其他UI组件必须继续正常工作

**Scope:**
所有不涉及项目卡片点击的交互应该完全不受影响。这包括：
- 点击"开始创作"按钮跳转到创作页面
- 点击图谱卡片跳转到图谱详情页面
- 登录/登出功能
- 搜索功能
- 页面加载时的项目数据获取

## Hypothesized Root Cause

基于bug描述和代码分析，最可能的问题是：

1. **错误的交互模式**: `handleProjectClick` 函数使用了路由跳转 `router.push('/project/${projectId}')`，但该路由从未定义
   - 应该使用状态管理实现视图切换，而不是路由跳转
   - 需要在同一页面内通过条件渲染实现两种视图模式

2. **缺少视图状态管理**: 当前页面没有状态来区分"推荐广场"和"项目图谱列表"两种视图
   - 需要添加 `viewMode` 状态：'gallery' | 'projectGraphs'
   - 需要添加 `selectedProject` 状态存储当前选中的项目

3. **缺少图谱数据获取逻辑**: 当前页面只获取项目列表，没有获取特定项目的图谱列表
   - 需要添加调用 `/api/projects/[id]/graphs` 的逻辑
   - 需要添加 `graphs` 状态存储图谱数据

4. **缺少返回功能**: 没有提供从"项目图谱列表"返回"推荐广场"的UI和逻辑
   - 需要在图谱列表视图中添加返回按钮
   - 需要添加 `handleBackToGallery` 函数重置视图状态

## Correctness Properties

Property 1: Fault Condition - 项目卡片点击应切换视图而非跳转路由

_For any_ 用户点击事件，当点击的是首页的项目卡片时，修复后的 handleProjectClick 函数 SHALL 切换页面视图状态到"项目图谱列表"模式，获取该项目的图谱数据，更新标题为"xxx项目中的知识图谱"，并在原位置显示图谱卡片列表，而不是尝试进行路由跳转。

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - 非项目卡片点击的交互行为

_For any_ 用户交互，当交互不是点击项目卡片时（如点击图谱卡片、点击导航按钮、点击搜索等），修复后的代码 SHALL 产生与原代码完全相同的行为，保持所有现有功能不变，包括图谱卡片的路由跳转、导航功能、数据加载等。

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

假设我们的根因分析正确：

**File**: `app/page.tsx`

**Function**: `handleProjectClick` 及相关状态管理

**Specific Changes**:

1. **添加视图状态管理**:
   - 添加 `viewMode` 状态：`useState<'gallery' | 'projectGraphs'>('gallery')`
   - 添加 `selectedProject` 状态：`useState<Project | null>(null)`
   - 添加 `graphs` 状态：`useState<Graph[]>([])`
   - 添加 `graphsLoading` 状态：`useState(false)`
   - 添加 `graphsError` 状态：`useState<string | null>(null)`

2. **修改 handleProjectClick 函数**:
   - 移除 `router.push('/project/${projectId}')` 调用
   - 添加查找选中项目的逻辑：`const project = projects.find(p => p.id === projectId)`
   - 设置 `selectedProject` 状态
   - 设置 `viewMode` 为 'projectGraphs'
   - 调用新的 `fetchProjectGraphs(projectId)` 函数

3. **添加 fetchProjectGraphs 函数**:
   - 接收 `projectId` 参数
   - 设置 `graphsLoading` 为 true
   - 调用 `/api/projects/${projectId}/graphs` API
   - 处理响应并更新 `graphs` 状态
   - 处理错误并更新 `graphsError` 状态
   - 设置 `graphsLoading` 为 false

4. **添加 handleBackToGallery 函数**:
   - 重置 `viewMode` 为 'gallery'
   - 清空 `selectedProject`
   - 清空 `graphs`
   - 清空 `graphsError`

5. **修改 PaperGallerySection 的 heading 属性**:
   - 使用条件表达式：`viewMode === 'gallery' ? '推荐广场' : `${selectedProject?.name}项目中的知识图谱``
   - 在图谱列表视图中添加返回按钮

6. **修改内容渲染逻辑**:
   - 使用条件渲染：`viewMode === 'gallery' ? <项目卡片列表> : <图谱卡片列表>`
   - 在图谱列表视图中复用 PaperWorkCard 组件显示图谱（或创建新的 GraphCard 组件）
   - 图谱卡片点击时跳转到 `/graph/${graphId}`

7. **添加 Graph 类型定义**:
   ```typescript
   interface Graph {
     id: string
     name: string
     description?: string
     nodeCount: number
     edgeCount: number
     createdAt: string
     updatedAt: string
   }
   ```

## Testing Strategy

### Validation Approach

测试策略采用两阶段方法：首先在未修复的代码上运行探索性测试以确认bug的存在和根因，然后验证修复后的代码正确实现了视图切换功能并保持了现有行为不变。

### Exploratory Fault Condition Checking

**Goal**: 在实施修复之前，在未修复的代码上演示bug。确认或反驳根因分析。如果反驳，需要重新假设。

**Test Plan**: 编写测试模拟用户点击项目卡片，断言系统尝试跳转到 `/project/${projectId}` 路由。在未修复的代码上运行这些测试以观察失败并理解根因。

**Test Cases**:
1. **项目卡片点击测试**: 模拟点击项目卡片，验证 `router.push` 被调用且参数为 `/project/${projectId}`（在未修复代码上会失败，因为会导致404）
2. **路由不存在测试**: 验证 `/project/${projectId}` 路由未定义（在未修复代码上会确认）
3. **视图状态缺失测试**: 验证页面没有 `viewMode` 或 `selectedProject` 状态（在未修复代码上会确认）
4. **图谱数据获取缺失测试**: 验证点击项目卡片后没有调用图谱API（在未修复代码上会确认）

**Expected Counterexamples**:
- 点击项目卡片后 `router.push` 被调用，尝试跳转到不存在的路由
- 可能原因：使用了错误的交互模式（路由跳转而非状态切换），缺少视图状态管理，缺少图谱数据获取逻辑

### Fix Checking

**Goal**: 验证对于所有满足bug条件的输入，修复后的函数产生预期行为。

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := handleProjectClick_fixed(input.projectId)
  ASSERT viewMode === 'projectGraphs'
  ASSERT selectedProject !== null
  ASSERT selectedProject.id === input.projectId
  ASSERT fetchProjectGraphs was called with input.projectId
  ASSERT router.push was NOT called
END FOR
```

### Preservation Checking

**Goal**: 验证对于所有不满足bug条件的输入，修复后的函数产生与原函数相同的结果。

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleProjectClick_original(input) = handleProjectClick_fixed(input)
END FOR
```

**Testing Approach**: 推荐使用基于属性的测试进行保留性检查，因为：
- 它自动生成大量测试用例覆盖输入域
- 它能捕获手动单元测试可能遗漏的边缘情况
- 它为所有非bug输入提供强有力的行为不变保证

**Test Plan**: 首先在未修复的代码上观察非项目卡片点击的行为（如图谱卡片点击、导航按钮点击），然后编写基于属性的测试捕获这些行为。

**Test Cases**:
1. **图谱卡片点击保留**: 在未修复代码上观察点击图谱卡片跳转到 `/graph/${graphId}` 的行为正常，然后编写测试验证修复后此行为继续工作
2. **导航功能保留**: 在未修复代码上观察导航栏按钮（开始创作、登录等）正常工作，然后编写测试验证修复后此行为继续工作
3. **数据加载保留**: 在未修复代码上观察页面加载时项目数据正常获取，然后编写测试验证修复后此行为继续工作
4. **其他UI交互保留**: 验证搜索、登录弹窗等功能在修复后继续正常工作

### Unit Tests

- 测试 `handleProjectClick` 在点击项目卡片时正确设置视图状态
- 测试 `fetchProjectGraphs` 正确调用API并处理响应
- 测试 `handleBackToGallery` 正确重置视图状态
- 测试边缘情况（项目不存在、项目无图谱、API错误）
- 测试条件渲染逻辑正确切换视图

### Property-Based Tests

- 生成随机项目ID，验证点击后视图状态正确切换
- 生成随机图谱数据，验证图谱列表正确显示
- 生成随机交互序列（点击项目→查看图谱→返回→再次点击），验证状态转换正确
- 测试所有非项目卡片点击的交互在多种场景下继续正常工作

### Integration Tests

- 测试完整流程：加载首页 → 点击项目卡片 → 显示图谱列表 → 点击返回 → 返回推荐广场
- 测试图谱卡片点击跳转到图谱详情页面
- 测试在图谱列表视图中点击"开始创作"等导航功能
- 测试错误处理：API失败时的错误提示和重试功能
