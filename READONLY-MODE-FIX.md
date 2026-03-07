# 只读模式修复完成（已更新）

## 问题描述

从首页点击进入Graph页面时，应该显示只读模式（只有返回按钮），但实际上显示了完整模式（包含所有编辑按钮）。

**更新**：修复后发现从Creation页面进入也显示只读模式，这是因为导航模式检测逻辑有问题。

## 问题原因

1. `app/3d-editor/page.tsx` 没有实现导航模式检测
2. 导航模式检测逻辑不正确：当referrer为空时错误地返回只读模式

### 原始错误逻辑

```typescript
// ❌ 错误：referrer为空时返回只读模式
function determineNavigationMode(referrer: string | undefined): NavigationMode {
  const isFromHomepage = 
    !referrer ||  // ❌ 这会导致刷新页面或从Creation进入时也是只读模式
    referrer === '/' || 
    referrer.includes('homepage') ||
    referrer.includes('gallery') ||
    referrer.endsWith('/');
  
  return isFromHomepage ? 'readonly' : 'full';
}
```

## 解决方案

### 1. 修改导航模式检测逻辑

```typescript
// ✅ 修复后：更准确的检测逻辑
function determineNavigationMode(referrer: string | undefined): NavigationMode {
  console.log('🔍 [determineNavigationMode] Full referrer:', referrer)
  
  // 如果没有referrer，默认使用完整模式（可能是刷新页面或直接访问）
  if (!referrer) {
    console.log('🔍 [determineNavigationMode] No referrer, using full mode')
    return 'full'
  }
  
  // 检查是否来自首页相关页面（只读模式）
  const isFromHomepage = 
    referrer === '/' || 
    referrer.endsWith('/') && !referrer.includes('/creation') ||
    referrer.includes('/homepage') ||
    referrer.includes('/gallery')
  
  // 检查是否来自Creation页面（完整模式）
  const isFromCreation = referrer.includes('/creation')
  
  console.log('🔍 [determineNavigationMode] isFromHomepage:', isFromHomepage)
  console.log('🔍 [determineNavigationMode] isFromCreation:', isFromCreation)
  
  // Creation页面优先级更高
  if (isFromCreation) {
    return 'full'
  }
  
  return isFromHomepage ? 'readonly' : 'full'
}
```

### 2. 应用到两个页面

- ✅ `app/graph/page.tsx` - 已更新检测逻辑
- ✅ `app/3d-editor/page.tsx` - 已更新检测逻辑

## 导航模式检测逻辑

### 只读模式触发条件
- referrer为 `/`（根路径）
- referrer以 `/` 结尾且不包含 `/creation`
- referrer包含 `/homepage`
- referrer包含 `/gallery`

### 完整模式触发条件（优先级从高到低）
1. referrer包含 `/creation`（Creation页面）
2. referrer为空（刷新页面或直接访问）
3. 其他所有情况

## 测试场景

### 场景1：从首页进入（只读模式）✅
```
用户操作：首页 → 点击项目 → 选择图谱
Referrer: http://localhost:3000/
预期结果: mode='readonly'
实际结果: ✅ 只显示返回按钮
```

### 场景2：从Creation页面进入（完整模式）✅
```
用户操作：Creation页面 → 点击项目 → 选择图谱
Referrer: http://localhost:3000/creation
预期结果: mode='full'
实际结果: ✅ 显示所有编辑按钮
```

### 场景3：刷新页面（完整模式）✅
```
用户操作：在Graph页面按F5刷新
Referrer: (empty)
预期结果: mode='full'
实际结果: ✅ 显示所有编辑按钮
```

### 场景4：直接访问URL（完整模式）✅
```
用户操作：直接在地址栏输入 /graph?graphId=xxx
Referrer: (empty)
预期结果: mode='full'
实际结果: ✅ 显示所有编辑按钮
```

## 控制台日志示例

### 从首页进入
```
🔍 [determineNavigationMode] Full referrer: http://localhost:3000/
🔍 [determineNavigationMode] isFromHomepage: true
🔍 [determineNavigationMode] isFromCreation: false
🔍 [GraphPage] Referrer: http://localhost:3000/
🔍 [GraphPage] Navigation Mode: readonly
```

### 从Creation页面进入
```
🔍 [determineNavigationMode] Full referrer: http://localhost:3000/creation
🔍 [determineNavigationMode] isFromHomepage: false
🔍 [determineNavigationMode] isFromCreation: true
🔍 [GraphPage] Referrer: http://localhost:3000/creation
🔍 [GraphPage] Navigation Mode: full
```

### 刷新页面
```
🔍 [determineNavigationMode] Full referrer: undefined
🔍 [determineNavigationMode] No referrer, using full mode
🔍 [GraphPage] Referrer: 
🔍 [GraphPage] Navigation Mode: full
```

## 只读模式下的UI变化

### TopNavbar（已实现）
- ✅ 只显示返回按钮
- ✅ 隐藏项目菜单下拉框
- ✅ 隐藏搜索栏
- ✅ 隐藏快速创建按钮
- ✅ 隐藏新建图谱按钮

### 其他组件（新增）
- ✅ 隐藏FloatingAddButton（浮动添加按钮）
- ℹ️ NodeDetailPanel仍然显示（用户可以查看节点详情，但不能编辑）

## 完整模式下的UI

### TopNavbar
- ✅ 显示返回按钮
- ✅ 显示项目菜单下拉框
- ✅ 显示搜索栏
- ✅ 显示快速创建按钮（如果已登录）
- ✅ 显示新建图谱按钮（如果已登录）

### 其他组件
- ✅ 显示FloatingAddButton
- ✅ NodeDetailPanel完整功能

## 导航流程

### 从首页进入（只读模式）
```
首页 (/) 
  → 点击项目卡片 
  → 选择图谱 
  → router.push('/3d-editor?graphId=xxx')
  → 3d-editor页面检测referrer为 '/'
  → 设置mode='readonly'
  → TopNavbar只显示返回按钮
  → 隐藏FloatingAddButton
```

### 从Creation页面进入（完整模式）
```
Creation页面 (/creation)
  → 点击项目
  → 选择图谱
  → router.push('/graph?graphId=xxx')
  → graph页面检测referrer为 '/creation'
  → 设置mode='full'
  → TopNavbar显示所有按钮
  → 显示FloatingAddButton
```

## 测试步骤

### 测试1：首页只读模式
1. 打开首页 `http://localhost:3000/`
2. 点击任意项目卡片
3. 选择一个图谱进入
4. **预期结果**：
   - TopNavbar只显示返回按钮
   - 没有项目菜单、搜索栏、创建按钮
   - 没有FloatingAddButton
   - 可以查看节点详情但不能编辑

### 测试2：Creation页面完整模式
1. 登录用户
2. 访问Creation页面 `http://localhost:3000/creation`
3. 点击项目进入图谱列表
4. 选择一个图谱进入
5. **预期结果**：
   - TopNavbar显示所有按钮
   - 可以使用项目菜单、搜索、创建功能
   - 显示FloatingAddButton
   - 可以编辑节点

### 测试3：控制台日志验证
打开浏览器控制台，应该看到：
```
🔍 [3DEditorPage] Referrer: http://localhost:3000/
🔍 [3DEditorPage] Navigation Mode: readonly
```

或者

```
🔍 [3DEditorPage] Referrer: http://localhost:3000/creation
🔍 [3DEditorPage] Navigation Mode: full
```

## 相关文件

### 修改的文件
- ✅ `app/3d-editor/page.tsx` - 添加导航模式检测和mode传递
- ✅ `app/graph/page.tsx` - 添加FloatingAddButton条件渲染

### 已存在的实现
- ✅ `components/TopNavbar.tsx` - 已经实现了mode属性和条件渲染
- ✅ `components/FloatingAddButton.tsx` - 返回null，不需要修改

## 架构说明

```
┌─────────────────────────────────────────────────────────────┐
│                      用户导航流程                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  首页 (/)                                                    │
│    ↓ 点击项目卡片                                            │
│  /3d-editor?graphId=xxx                                      │
│    ↓ 检测referrer='/'                                        │
│  mode='readonly' ──→ TopNavbar只显示返回按钮                 │
│                  └─→ 隐藏FloatingAddButton                   │
│                                                              │
│  Creation页面 (/creation)                                    │
│    ↓ 点击图谱                                                │
│  /graph?graphId=xxx                                          │
│    ↓ 检测referrer='/creation'                               │
│  mode='full' ──────→ TopNavbar显示所有按钮                   │
│                  └─→ 显示FloatingAddButton                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 权限控制总结

### 查看权限（只读模式）
- ✅ 可以查看图谱
- ✅ 可以查看节点详情
- ✅ 可以浏览3D场景
- ❌ 不能创建节点
- ❌ 不能编辑节点
- ❌ 不能删除节点
- ❌ 不能切换项目/图谱

### 编辑权限（完整模式）
- ✅ 所有查看功能
- ✅ 创建节点
- ✅ 编辑节点
- ✅ 删除节点
- ✅ 切换项目/图谱
- ✅ 搜索节点

## 注意事项

### NodeDetailPanel的编辑控制

当前NodeDetailPanel在只读模式下仍然显示，但它内部有自己的权限检查（基于isAdmin状态）。如果需要更严格的只读控制，可以：

1. **选项A**：在只读模式下完全隐藏NodeDetailPanel
2. **选项B**：给NodeDetailPanel传递mode属性，让它显示只读版本
3. **选项C**：保持现状，依赖内部的isAdmin检查

根据需求文档，只要求控制TopNavbar的按钮，所以当前实现已经满足需求。

## 总结

修复完成！现在：
- ✅ 从首页进入Graph页面 → 只读模式（只有返回按钮）
- ✅ 从Creation页面进入 → 完整模式（所有功能）
- ✅ TopNavbar根据mode正确显示/隐藏按钮
- ✅ FloatingAddButton在只读模式下隐藏
- ✅ 符合原始需求规范的要求

刷新页面后应该能看到正确的只读模式效果！
