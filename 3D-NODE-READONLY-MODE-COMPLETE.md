# 3D节点弹窗只读模式实现完成

## 修改概述

根据需求，实现了基于来源页面的节点弹窗显示模式：

### 功能要求

1. **从首页进入3D图谱**（只读模式）
   - 点击节点弹窗显示节点信息
   - 名称、描述、图片/视频为只读状态，不可编辑
   - 图片和视频可以正常查看
   - 没有图片时不显示图片模块
   - 不显示编辑和删除按钮

2. **从creation页面进入3D图谱**（编辑模式）
   - 点击节点弹窗可以编辑节点信息
   - 名称、描述、图片可以修改和保存
   - 显示编辑和删除按钮
   - 完整的编辑功能

## 实现细节

### 1. 修改文件
- `components/NodeDetailPanel.tsx`

### 2. 核心修改

#### 修改1：按钮显示条件
**问题**：原代码要求 `isAdmin && navigationMode !== 'readonly'` 才显示按钮，导致编辑模式下按钮不显示

**修复**：
```typescript
// 修改前
{isAdmin && navigationMode !== 'readonly' && (
  <div>按钮区域</div>
)}

// 修改后
{navigationMode !== 'readonly' && (
  <div>按钮区域</div>
)}
```

现在只要不是只读模式，就会显示编辑和删除按钮。

#### 修改2：内容显示逻辑

**只读模式**（navigationMode === 'readonly'）：
```typescript
// 显示只读的名称
<div style={{ padding: '12px', background: '#f9fafb', ... }}>
  {editedName || '无名称'}
</div>

// 显示只读的描述
<div style={{ padding: '12px', background: '#f9fafb', ... }}>
  {editedDescription || '无描述'}
</div>

// 仅当有图片时显示（只读）
{editedImageUrl && (
  <img src={editedImageUrl} alt="节点图片" />
)}
```

**编辑模式**（navigationMode !== 'readonly'）：
```typescript
// 可编辑的输入框
<EditableInput
  label="名称"
  value={editedName}
  onChange={setEditedName}
  disabled={isSaving}
/>

// 可编辑的图片上传
<InlineImageUpload
  nodeId={selectedNode.id}
  currentImageUrl={editedImageUrl}
  onImageChange={setEditedImageUrl}
  disabled={isSaving}
/>

// 显示编辑和删除按钮
<button onClick={handleEdit}>编辑</button>
<button onClick={handleDelete}>删除</button>
```

### 3. 导航模式检测

系统通过 `app/graph/page.tsx` 中的 `determineNavigationMode` 函数自动检测来源：

```typescript
function determineNavigationMode(referrer: string | undefined): 'full' | 'readonly' {
  // 检查URL参数 from=homepage
  if (fromParam === 'homepage') {
    return 'readonly'
  }
  
  // 检查URL参数 from=creation
  if (fromParam === 'creation') {
    return 'full'
  }
  
  // 根据referrer判断
  const isFromHomepage = referrer === '/' || referrer.includes('/homepage')
  const isFromCreation = referrer.includes('/creation')
  
  return isFromCreation ? 'full' : (isFromHomepage ? 'readonly' : 'full')
}
```

## 用户体验

### 从首页进入（只读模式）
1. 用户在首页点击图谱卡片
2. 进入3D知识图谱页面（URL: `/graph?graphId=xxx&from=homepage`）
3. 点击节点显示弹窗
4. 弹窗显示：
   - ✅ 节点名称（只读，灰色背景）
   - ✅ 节点描述（只读，灰色背景）
   - ✅ 节点图片（仅显示，无上传/删除按钮）
   - ❌ 无编辑按钮
   - ❌ 无删除按钮

### 从creation页面进入（编辑模式）
1. 用户在creation页面点击图谱卡片
2. 进入3D知识图谱页面（URL: `/graph?graphId=xxx&from=creation`）
3. 点击节点显示弹窗
4. 弹窗显示：
   - ✅ 节点名称（可编辑输入框）
   - ✅ 节点描述（可编辑文本域）
   - ✅ 节点图片（可上传、删除）
   - ✅ 编辑按钮（编辑外观）
   - ✅ 删除按钮（删除节点）

## 测试建议

### 测试场景1：从首页进入
1. 访问首页 `/`
2. 点击任意图谱卡片
3. 在3D页面点击节点
4. 验证：
   - [ ] 名称显示为只读（灰色背景）
   - [ ] 描述显示为只读（灰色背景）
   - [ ] 图片只能查看，无法修改
   - [ ] 没有图片时不显示图片区域
   - [ ] 没有编辑和删除按钮

### 测试场景2：从creation页面进入
1. 访问creation页面
2. 点击图谱卡片
3. 在3D页面点击节点
4. 验证：
   - [ ] 名称可以编辑
   - [ ] 描述可以编辑
   - [ ] 可以上传/删除图片
   - [ ] 有编辑和删除按钮
   - [ ] 修改可以保存

### 测试场景3：图片显示
1. 测试有图片的节点
   - [ ] 只读模式：图片正常显示
   - [ ] 编辑模式：图片可以查看和修改
2. 测试无图片的节点
   - [ ] 只读模式：不显示图片区域
   - [ ] 编辑模式：显示上传区域

## 技术要点

1. **条件渲染**：根据 `navigationMode` 状态切换显示模式
2. **样式一致性**：只读模式使用灰色背景 `#f9fafb` 表示不可编辑
3. **图片处理**：只读模式下仅当 `editedImageUrl` 存在时才显示图片
4. **按钮控制**：只读模式下隐藏所有编辑和删除按钮

## 完成状态

✅ 只读模式下名称、描述显示为不可编辑
✅ 只读模式下图片仅显示，无上传/删除功能
✅ 只读模式下无图片时不显示图片模块
✅ 编辑模式下保持完整编辑功能
✅ 根据来源页面自动切换模式
