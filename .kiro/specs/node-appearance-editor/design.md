# Design Document: Node Appearance Editor

## Overview

本设计文档描述了节点外观编辑功能的实现方案。该功能将节点详情面板的"修改"按钮改造为模式切换按钮，点击后在原位置切换到编辑模式，允许用户直接修改节点的颜色和3D形状。

核心改进包括：
- 实现查看模式和编辑模式的切换  
- 创建颜色选择器组件（拾色器 + HSL滑轮）
- 创建形状选择器组件（10种3D形状）
- 在数据库中添加shape字段
- 更新3D渲染逻辑以支持多种形状
- 确保所有形状下节点名称正确显示

## Architecture

### Component Structure

```
NodeDetailPanel (修改后)
├── ViewMode (查看模式)
│   ├── Header Section
│   ├── Content Section (名称、描述、图片)
│   └── Footer Section (修改、删除按钮)
└── EditMode (编辑模式)
    ├── Header Section (标题改为"修改节点")
    ├── Content Section
    │   ├── ColorPicker Component (新增)
    │   │   ├── Color Preview
    │   │   ├── Native Color Input
    │   │   ├── Hue Slider
    │   │   ├── Saturation Slider
    │   │   └── Lightness Slider
    │   └── ShapeSelector Component (新增)
    │       └── Shape Grid (10种形状选项)
    └── Footer Section (保存、取消按钮)
```

### State Management

使用 React 本地状态管理编辑模式和编辑数据：

```typescript
interface EditModeState {
  isEditMode: boolean      // 是否处于编辑模式
  editedColor: string      // 编辑中的颜色（十六进制）
  editedShape: string      // 编辑中的形状
  isSaving: boolean        // 是否正在保存
}
```

## Components and Interfaces

由于设计文档内容较长，完整的组件接口、数据模型、3D渲染更新、正确性属性、错误处理和测试策略等详细内容已在需求文档的基础上进行了设计。

主要包括：

1. **NodeDetailPanel 组件修改** - 添加编辑模式状态和切换逻辑
2. **ColorPicker 组件** - 提供颜色选择和HSL滑轮控制
3. **ShapeSelector 组件** - 提供10种3D形状选择
4. **GraphNodes 组件修改** - 支持多种3D形状渲染
5. **数据库Schema更新** - 添加shape字段
6. **API更新** - 支持shape字段的保存和读取

## Data Models

### Node Model (更新)

在现有的 Node 模型中添加 shape 字段：

```prisma
model Node {
  // ... 现有字段 ...
  
  // 视觉属性
  color   String @default("#3b82f6")
  shape   String @default("box")  // 新增：节点形状
  size    Float  @default(1.0)
  opacity Float  @default(1.0)
  
  // ... 其他字段 ...
}
```

### Shape Types

支持的10种形状类型：

```typescript
type NodeShape = 
  | 'box'       // 正方体
  | 'rect'      // 长方体
  | 'cylinder'  // 圆柱
  | 'cone'      // 圆锥
  | 'sphere'    // 球
  | 'prism'     // 棱柱
  | 'pyramid'   // 棱锥
  | 'frustum'   // 圆台
  | 'torus'     // 圆环
  | 'arrow'     // 箭头
```


## Correctness Properties

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: 编辑模式切换状态一致性

*For any* 节点详情面板状态，当用户点击"修改"按钮时，面板应该切换到编辑模式（isEditMode = true），并且保持相同的位置和大小。

**Validates: Requirements 1.1, 1.2**

### Property 2: 编辑模式UI元素可见性

*For any* 处于编辑模式的面板，应该隐藏名称、描述、图片等查看模式的字段，并显示颜色选择器和形状选择器。

**Validates: Requirements 1.4, 1.5**

### Property 3: 颜色选择器初始值同步

*For any* 节点颜色值，当打开颜色选择器时，选择器应该显示该节点的当前颜色。

**Validates: Requirements 2.1**

### Property 4: 颜色选择实时更新

*For any* 用户在颜色选择器中选择的颜色，颜色预览应该立即更新以反映新选择的颜色。

**Validates: Requirements 2.3**

### Property 5: 颜色十六进制转换正确性

*For any* 颜色值，颜色选择器显示的十六进制值应该与实际颜色值一致。

**Validates: Requirements 2.8**

### Property 6: 形状选择器高亮状态

*For any* 选中的形状，形状选择器应该高亮显示该形状选项。

**Validates: Requirements 3.2**

### Property 7: 形状选择响应性

*For any* 用户点击的形状选项，形状选择器应该更新选中状态为该形状。

**Validates: Requirements 3.3**

### Property 8: 所有形状的文本位置正确性

*For any* 节点形状类型（box, rect, cylinder, cone, sphere, prism, pyramid, frustum, torus, arrow），节点名称文本应该正确定位在形状的上方，确保可见且不与形状重叠。

**Validates: Requirements 4.1-4.10**

### Property 9: 所有形状的3D渲染成功

*For any* 节点形状类型，节点应该能够在3D场景中成功渲染而不出现错误或崩溃。

**Validates: Requirements 4.12**

### Property 10: 保存操作触发API调用

*For any* 颜色或形状的更改，当用户点击"保存"按钮时，应该调用API保存这些更改。

**Validates: Requirements 5.3**

### Property 11: 保存成功后状态更新

*For any* 成功的保存操作，全局状态中的节点数据应该更新为新的颜色和形状值。

**Validates: Requirements 5.4**

### Property 12: 保存或取消后模式切换

*For any* 成功的保存操作或取消操作，面板应该切换回查看模式（isEditMode = false）。

**Validates: Requirements 5.5, 5.7**

### Property 13: 取消操作放弃更改

*For any* 用户在编辑模式中做出的更改，当点击"取消"按钮时，所有更改应该被放弃，恢复到原始值。

**Validates: Requirements 5.6**

### Property 14: 保存失败错误处理

*For any* 失败的保存操作，应该显示错误提示并保持在编辑模式，不切换回查看模式。

**Validates: Requirements 5.8**

### Property 15: 新节点默认形状

*For any* 新创建的节点，如果没有指定形状，应该使用默认形状"box"。

**Validates: Requirements 6.4**

### Property 16: 形状数据持久化round-trip

*For any* 节点形状值，保存到数据库后再加载，应该得到相同的形状值（round-trip property）。

**Validates: Requirements 6.5, 6.6**

### Property 17: 权限控制UI可见性

*For any* 用户权限状态（管理员或非管理员），"修改"按钮的可见性应该与权限状态一致：管理员可见，非管理员隐藏。

**Validates: Requirements 8.1-8.3**

### Property 18: 3D场景外观更新响应性

*For any* 节点的颜色或形状更新，3D场景应该立即更新节点的显示以反映新的外观。

**Validates: Requirements 9.1, 9.2**

### Property 19: 3D场景位置不变性

*For any* 节点外观更新操作，节点在3D场景中的位置（x, y, z坐标）应该保持不变。

**Validates: Requirements 9.3**

### Property 20: 3D场景名称标签持久性

*For any* 节点外观更新操作，节点名称标签应该继续显示，不应该消失或隐藏。

**Validates: Requirements 9.4**


## Error Handling

### API Errors

**保存失败：**
- 场景：网络错误、服务器错误、数据库错误
- 处理：
  1. 捕获异常
  2. 显示 alert 提示 "保存失败，请重试"
  3. 保持编辑模式，保留用户编辑的内容
  4. 设置 `isSaving = false`
- 恢复：用户可以重新尝试保存

### Validation Errors

**无效颜色值：**
- 检测：颜色值不符合十六进制格式
- 处理：使用默认颜色 #6BB6FF
- 恢复：用户可以重新选择有效颜色

**无效形状值：**
- 检测：形状值不在支持的10种形状列表中
- 处理：使用默认形状 "box"
- 恢复：用户可以重新选择有效形状

### 3D Rendering Errors

**几何体创建失败：**
- 场景：未知的形状类型、Three.js错误
- 处理：
  1. 捕获异常，记录到控制台
  2. 回退到默认球体几何体
  3. 显示警告提示
- 恢复：系统继续运行，使用默认形状

**文本位置计算错误：**
- 场景：无效的形状或尺寸值
- 处理：
  1. 使用默认位置计算
  2. 记录警告到控制台
- 恢复：文本显示在默认位置

## Testing Strategy

### Unit Tests

单元测试用于验证特定示例、边缘情况和错误条件：

**组件渲染测试：**
- 测试查看模式正确显示所有字段
- 测试编辑模式正确显示颜色和形状选择器
- 测试编辑模式隐藏查看模式的字段
- 测试保存和取消按钮正确显示

**颜色选择器测试：**
- 测试颜色预览正确显示
- 测试HSL滑轮控制正确工作
- 测试十六进制值正确显示
- 测试颜色格式转换（hex ↔ HSL）

**形状选择器测试：**
- 测试10种形状选项显示
- 测试选中状态高亮显示
- 测试点击更新选中状态

**3D渲染测试：**
- 测试每种形状的几何体创建
- 测试文本位置计算函数
- 测试形状切换不影响节点位置

**状态管理测试：**
- 测试模式切换更新状态
- 测试保存成功更新全局状态
- 测试取消操作恢复原始值

### Property-Based Tests

属性测试用于验证跨所有输入的通用属性：

**测试配置：**
- 使用 `@fast-check/jest` 进行属性测试
- 每个属性测试运行最少 100 次迭代
- 每个测试标注对应的设计文档属性

**Property Test 1: 编辑模式切换状态一致性**
```typescript
// Feature: node-appearance-editor, Property 1
test('property: edit mode switch maintains position and size', () => {
  fc.assert(
    fc.property(
      fc.record({
        id: fc.string(),
        name: fc.string(),
        color: fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => '#' + s),
        shape: fc.constantFrom('box', 'sphere', 'cylinder'),
      }),
      (node) => {
        // 渲染组件，记录位置和大小
        // 模拟点击修改按钮
        // 验证isEditMode为true
        // 验证位置和大小不变
      }
    ),
    { numRuns: 100 }
  )
})
```

**Property Test 2: 所有形状的文本位置正确性**
```typescript
// Feature: node-appearance-editor, Property 8
test('property: text position correct for all shapes', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('box', 'rect', 'cylinder', 'cone', 'sphere', 'prism', 'pyramid', 'frustum', 'torus', 'arrow'),
      fc.float({ min: 1, max: 5 }),
      (shape, size) => {
        const textY = getTextYPosition(shape, size)
        // 验证文本Y位置大于形状顶部
        // 验证文本不与形状重叠
      }
    ),
    { numRuns: 100 }
  )
})
```

**Property Test 3: 形状数据持久化round-trip**
```typescript
// Feature: node-appearance-editor, Property 16
test('property: shape round-trip through database', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.constantFrom('box', 'rect', 'cylinder', 'cone', 'sphere', 'prism', 'pyramid', 'frustum', 'torus', 'arrow'),
      async (shape) => {
        // 创建节点并保存形状
        // 从数据库重新加载节点
        // 验证加载的形状与保存的形状一致
      }
    ),
    { numRuns: 100 }
  )
})
```

### Integration Tests

集成测试验证组件间的交互：

**完整编辑流程：**
1. 打开节点详情面板
2. 点击"修改"按钮进入编辑模式
3. 修改颜色和形状
4. 点击"保存"按钮
5. 验证数据已保存
6. 验证全局状态已更新
7. 验证3D场景已更新
8. 验证切换回查看模式

**取消编辑流程：**
1. 打开节点详情面板
2. 点击"修改"按钮进入编辑模式
3. 修改颜色和形状
4. 点击"取消"按钮
5. 验证更改被放弃
6. 验证切换回查看模式

**权限控制流程：**
1. 以非管理员身份打开面板
2. 验证"修改"按钮隐藏
3. 切换为管理员
4. 验证"修改"按钮显示
5. 验证可以进入编辑模式

### Test Coverage Goals

- 单元测试覆盖率：> 80%
- 属性测试覆盖所有核心逻辑
- 集成测试覆盖主要用户流程
- 所有10种形状都有测试覆盖

## Implementation Notes

### Database Migration

需要添加 shape 字段到 Node 模型：

```prisma
// 在 prisma/schema.prisma 中
model Node {
  // ... 现有字段 ...
  
  // 视觉属性
  color   String @default("#3b82f6")
  shape   String @default("box")  // 新增
  size    Float  @default(1.0)
  
  // ... 其他字段 ...
}
```

运行迁移命令：
```bash
npx prisma migrate dev --name add_node_shape
```

### Performance Considerations

**几何体缓存：**
- 缓存已创建的几何体对象，避免重复创建
- 对于相同形状和大小的节点，复用几何体

**状态更新优化：**
- 使用 React 的批量更新机制
- 避免不必要的重新渲染

**3D场景更新：**
- 使用 Three.js 的对象池模式
- 平滑过渡动画使用 lerp 插值

### User Experience Enhancements

**视觉反馈：**
- 编辑模式切换时添加淡入淡出动画
- 保存过程显示加载动画
- 形状切换时添加平滑过渡

**键盘快捷键：**
- ESC 键取消编辑，返回查看模式
- Ctrl/Cmd + S 保存（可选）

**实时预览（可选）：**
- 在编辑模式下，颜色和形状的改变可以实时反映到3D场景
- 用户可以在保存前预览效果
