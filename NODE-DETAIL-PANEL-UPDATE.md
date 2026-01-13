# 节点详情面板更新说明

## 更新时间
2025-01-12

## 更新内容

### 1. NodeDetailPanel 组件修改

#### 删除的功能
- ✅ 删除了标签（tags）模块
- ✅ 删除了所有输入框，改为只读展示
- ✅ 移除了非管理员的提示信息

#### 新增的功能
- ✅ 添加了管理员权限检查（使用 localStorage）
- ✅ 添加了"修改"按钮（仅管理员可见）
- ✅ 添加了"删除"按钮（仅管理员可见）
- ✅ 添加了媒体展示模块（支持图片和视频）

#### 媒体展示功能
- 支持显示节点的图片（imageUrl）
- 支持显示节点的视频（videoUrl）
- 视频使用 HTML5 video 标签，带播放控制
- 图片自适应容器大小，最大高度 300px
- 优先显示视频，如果没有视频则显示图片

#### 按钮功能
- **修改按钮**：点击后跳转到 `/workflow` 页面进行二维图谱编辑
- **删除按钮**：删除当前节点及其所有关联的连接

### 2. WorkflowCanvas 组件修改

#### 新增数据加载功能
- ✅ 添加了 `useEffect` 钩子，在组件加载时自动从数据库加载现有图谱数据
- ✅ 从节点的 metadata 中恢复原始的 2D 坐标
- ✅ 如果没有 2D 坐标，使用随机位置
- ✅ 添加了加载状态提示

#### 更新保存逻辑
- ✅ 添加了 `updateMode` 参数，标记为更新模式
- ✅ 在更新模式下，会先删除所有现有数据，然后重新创建

### 3. Convert API 修改

#### 新增更新模式
- ✅ 添加了 `updateMode` 参数支持
- ✅ 在更新模式下：
  - 先删除所有现有的边（edges）
  - 再删除所有现有的节点（nodes）
  - 然后重新创建所有节点和边
- ✅ 保持原有的创建模式不变

### 4. Store 接口更新

#### Node 接口
- ✅ 添加了 `imageUrl?: string` 字段
- ✅ 添加了 `videoUrl?: string` 字段

## 数据流程

### 三维图谱 → 二维编辑
1. 用户在三维图谱中点击节点
2. 显示节点详情面板（只读模式）
3. 管理员点击"修改"按钮
4. 跳转到 `/workflow` 页面
5. WorkflowCanvas 自动加载数据库中的所有节点和边
6. 从 metadata 中恢复原始的 2D 坐标
7. 用户可以在二维画布上编辑

### 二维编辑 → 三维图谱
1. 用户在二维画布上编辑节点和连接
2. 点击"保存并转换为3D"按钮
3. 调用 `/api/convert` API，传入 `updateMode: true`
4. API 删除所有现有数据
5. API 重新创建所有节点和边
6. 在 metadata 中保存 2D 坐标
7. 自动跳转回三维图谱页面

## 技术细节

### 管理员权限检查
```typescript
const savedIsAdmin = localStorage.getItem('isAdmin')
setIsAdmin(savedIsAdmin === 'true')
```

### 媒体展示逻辑
```typescript
{selectedNode.videoUrl ? (
  <video src={selectedNode.videoUrl} controls />
) : selectedNode.imageUrl ? (
  <img src={selectedNode.imageUrl} alt={selectedNode.name} />
) : null}
```

### 2D 坐标恢复
```typescript
const metadata = JSON.parse(dbNode.metadata || '{}')
if (metadata.original2D) {
  x2d = metadata.original2D.x
  y2d = metadata.original2D.y
}
```

### 更新模式处理
```typescript
if (updateMode) {
  await tx.edge.deleteMany({})
  await tx.node.deleteMany({})
  // 然后重新创建
}
```

## 使用说明

### 普通用户
- 可以查看节点详情
- 可以查看节点的图片和视频
- 无法修改或删除节点

### 管理员用户
- 可以查看节点详情
- 可以查看节点的图片和视频
- 可以点击"修改"按钮进入二维编辑模式
- 可以点击"删除"按钮删除节点
- 在二维编辑模式下可以修改节点和连接
- 保存后会更新三维图谱

## 注意事项

1. **数据一致性**：更新模式会删除所有现有数据，确保数据的一致性
2. **2D 坐标保存**：所有节点的 2D 坐标都保存在 metadata 中，方便恢复
3. **权限控制**：只有管理员才能看到修改和删除按钮
4. **媒体支持**：节点可以包含图片或视频，但不能同时包含两者（优先显示视频）

## 文件修改清单

- ✅ `components/NodeDetailPanel.tsx` - 节点详情面板
- ✅ `components/WorkflowCanvas.tsx` - 二维画布组件
- ✅ `app/api/convert/route.ts` - 转换 API
- ✅ `lib/store.ts` - 状态管理和接口定义

## 测试建议

1. 测试普通用户查看节点详情
2. 测试管理员修改节点
3. 测试管理员删除节点
4. 测试二维编辑模式的数据加载
5. 测试保存后的数据更新
6. 测试图片和视频的显示
7. 测试 2D 坐标的恢复
