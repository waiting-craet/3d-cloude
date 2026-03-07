# 导航模式检测修复

## 问题描述

从Creation页面进入Graph页面时，错误地显示了只读模式，应该显示完整模式（所有编辑按钮）。

## 根本原因

导航模式检测逻辑有缺陷：

```typescript
// ❌ 错误的逻辑
function determineNavigationMode(referrer: string | undefined): NavigationMode {
  const isFromHomepage = 
    !referrer ||  // ❌ 问题：referrer为空时返回只读模式
    referrer === '/' || 
    referrer.includes('homepage') ||
    referrer.includes('gallery') ||
    referrer.endsWith('/');
  
  return isFromHomepage ? 'readonly' : 'full';
}
```

### 问题分析

1. **referrer为空的情况**：
   - 刷新页面
   - 直接在地址栏输入URL
   - 某些浏览器隐私设置
   - 从HTTPS到HTTP（浏览器安全策略）

2. **错误行为**：
   - 当referrer为空时，函数返回只读模式
   - 这导致从Creation页面进入时，如果referrer被浏览器清空，就会错误地显示只读模式

## 修复方案

### 新的检测逻辑

```typescript
// ✅ 修复后的逻辑
function determineNavigationMode(referrer: string | undefined): NavigationMode {
  console.log('🔍 [determineNavigationMode] Full referrer:', referrer)
  
  // 如果没有referrer，默认使用完整模式
  if (!referrer) {
    console.log('🔍 [determineNavigationMode] No referrer, using full mode')
    return 'full'  // ✅ 默认完整模式更安全
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

### 关键改进

1. **referrer为空时默认完整模式**：更安全的默认值，避免误判
2. **明确检查Creation页面**：`isFromCreation` 单独判断
3. **优先级处理**：Creation页面优先级高于首页判断
4. **详细日志**：便于调试和验证

## 决策树

```
referrer存在？
├─ 否 → 完整模式（默认）
└─ 是 → 包含'/creation'？
    ├─ 是 → 完整模式（Creation页面）
    └─ 否 → 是首页相关？
        ├─ 是 → 只读模式（首页/gallery）
        └─ 否 → 完整模式（其他页面）
```

## 测试矩阵

| 来源 | Referrer | 预期模式 | 实际结果 |
|------|----------|----------|----------|
| 首页 | `http://localhost:3000/` | readonly | ✅ |
| Creation页面 | `http://localhost:3000/creation` | full | ✅ |
| Gallery页面 | `http://localhost:3000/gallery` | readonly | ✅ |
| 刷新页面 | (empty) | full | ✅ |
| 直接访问 | (empty) | full | ✅ |
| 其他页面 | `http://localhost:3000/other` | full | ✅ |

## 修改的文件

- ✅ `app/graph/page.tsx` - 更新检测逻辑
- ✅ `app/3d-editor/page.tsx` - 更新检测逻辑

## 验证步骤

### 1. 从Creation页面进入
```bash
# 操作
1. 访问 http://localhost:3000/creation
2. 点击任意项目
3. 选择一个图谱进入

# 预期控制台输出
🔍 [determineNavigationMode] Full referrer: http://localhost:3000/creation
🔍 [determineNavigationMode] isFromHomepage: false
🔍 [determineNavigationMode] isFromCreation: true
🔍 [GraphPage] Navigation Mode: full

# 预期UI
- 显示项目菜单下拉框
- 显示搜索栏
- 显示快速创建按钮
- 显示新建图谱按钮
- 显示FloatingAddButton
```

### 2. 从首页进入
```bash
# 操作
1. 访问 http://localhost:3000/
2. 点击任意项目卡片
3. 选择一个图谱进入

# 预期控制台输出
🔍 [determineNavigationMode] Full referrer: http://localhost:3000/
🔍 [determineNavigationMode] isFromHomepage: true
🔍 [determineNavigationMode] isFromCreation: false
🔍 [GraphPage] Navigation Mode: readonly

# 预期UI
- 只显示返回按钮
- 隐藏所有编辑功能
```

### 3. 刷新页面
```bash
# 操作
1. 在Graph页面按F5刷新

# 预期控制台输出
🔍 [determineNavigationMode] Full referrer: undefined
🔍 [determineNavigationMode] No referrer, using full mode
🔍 [GraphPage] Navigation Mode: full

# 预期UI
- 显示所有编辑功能
```

## 为什么选择"完整模式"作为默认值？

### 理由

1. **用户体验优先**：
   - 如果误判为只读模式，用户无法编辑（功能受限）
   - 如果误判为完整模式，用户仍然可以浏览（功能更多）

2. **安全性考虑**：
   - 只读模式主要用于公开浏览场景
   - 完整模式需要用户登录才能使用编辑功能
   - 即使显示编辑按钮，后端API仍然有权限验证

3. **实际场景**：
   - 刷新页面应该保持当前模式（通常是完整模式）
   - 直接访问URL通常是用户自己的操作（应该有完整权限）

## 边界情况处理

### 情况1：浏览器隐私模式
- **现象**：某些浏览器在隐私模式下不发送referrer
- **处理**：默认完整模式，用户可以正常使用

### 情况2：HTTPS → HTTP
- **现象**：从HTTPS页面跳转到HTTP页面时，浏览器不发送referrer
- **处理**：默认完整模式（但生产环境应该全站HTTPS）

### 情况3：书签访问
- **现象**：从浏览器书签打开，没有referrer
- **处理**：默认完整模式，用户可以正常编辑

## 相关文档

- `READONLY-MODE-FIX.md` - 只读模式实现文档
- `GRAPH-API-500-ERROR-FIX.md` - Graph API修复文档
- `.kiro/specs/user-project-ownership-and-permissions/requirements.md` - 需求文档

## 总结

修复完成！现在：
- ✅ 从首页进入 → 只读模式（只有返回按钮）
- ✅ 从Creation页面进入 → 完整模式（所有编辑功能）
- ✅ 刷新页面 → 完整模式（保持功能）
- ✅ 直接访问 → 完整模式（正常使用）

导航模式检测现在更加准确和可靠！
