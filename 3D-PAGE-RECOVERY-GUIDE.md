# 3D知识图谱页面恢复指南

## 概述

你的3D知识图谱页面已从提交 `31ba0759e52f58b29ee95666e05cb5aac5e873ef` 中成功恢复。

## 恢复的文件

以下文件已从该提交中恢复，并保存为 `.recovered` 版本：

### 核心组件
- `components/KnowledgeGraph.tsx.recovered` - 3D知识图谱主组件（19.3 KB）
- `components/GraphNodes.tsx.recovered` - 3D节点渲染组件（34.6 KB）
- `components/GraphEdges.tsx.recovered` - 3D边/连接线渲染组件（5.0 KB）
- `components/TopNavbar.tsx.recovered` - 顶部导航栏（75.7 KB）
- `components/NodeDetailPanel.tsx.recovered` - 节点详情面板（39.7 KB）
- `components/WorkflowCanvas.tsx.recovered` - 工作流画布（156.5 KB）

### 页面文件
- `app/page.tsx.recovered` - 主页面（0.8 KB）

## 恢复的功能特性

### 3D知识图谱核心功能
✅ **3D可视化**
- 使用 React Three Fiber 和 Three.js 的完整3D渲染
- 支持多种几何体形状（球体、立方体、圆柱体、圆锥体等）
- 优化的光照系统（环境光、方向光、点光源、半球光）
- 雾效和深度感

✅ **相机控制**
- OrbitControls 轨道控制
- 智能相机聚焦动画（带缓动函数）
- 自适应距离计算
- 360度旋转支持

✅ **节点交互**
- 节点选择和高亮
- 节点拖拽移动
- 节点编辑（标签、描述、媒体）
- 节点复制和删除
- 媒体上传（图片和视频）

✅ **连接线管理**
- 节点间连接
- 连接线标签编辑
- 连接线删除
- 连接点可视化

✅ **主题系统**
- 明暗主题切换
- 主题配置管理
- 动态背景色

✅ **UI组件**
- 顶部导航栏
- 节点详情面板
- 浮动添加按钮
- 加载提示
- 转换状态提示

## 如何使用恢复的文件

### 方案 1：直接替换（推荐）

如果你想完全恢复到该提交的状态，可以直接替换当前文件：

```bash
# 备份当前文件（可选）
Copy-Item components/KnowledgeGraph.tsx components/KnowledgeGraph.tsx.backup
Copy-Item components/GraphNodes.tsx components/GraphNodes.tsx.backup
# ... 其他文件

# 恢复文件
Copy-Item components/KnowledgeGraph.tsx.recovered components/KnowledgeGraph.tsx
Copy-Item components/GraphNodes.tsx.recovered components/GraphNodes.tsx
Copy-Item components/GraphEdges.tsx.recovered components/GraphEdges.tsx
Copy-Item components/TopNavbar.tsx.recovered components/TopNavbar.tsx
Copy-Item components/NodeDetailPanel.tsx.recovered components/NodeDetailPanel.tsx
Copy-Item components/WorkflowCanvas.tsx.recovered components/WorkflowCanvas.tsx
Copy-Item app/page.tsx.recovered app/page.tsx
```

### 方案 2：选择性合并

如果你想保留某些现有的改进，可以选择性地合并特定组件：

1. 打开 `.recovered` 文件查看代码
2. 复制需要的部分到当前文件
3. 测试功能是否正常

### 方案 3：创建新分支

为了安全起见，建议在新分支中测试恢复的代码：

```bash
git checkout -b restore/3d-knowledge-graph
# 然后执行方案1或2
```

## 关键代码特性

### 1. 智能相机聚焦动画
```typescript
// 自动计算最佳观察距离
function calculateOptimalDistance(nodeSize, camera, targetCoverage)

// 平滑的相机动画
function animateCameraToNode(node, camera, controls)
```

### 2. Billboard文本系统
- 文本始终面向相机
- 平滑旋转过渡
- 自适应Y位置

### 3. 粒子效果
- 节点周围的发光粒子
- 动态运动效果

### 4. 媒体处理
- 图片和视频上传
- 自适应尺寸计算
- 预览和删除功能

## 依赖项检查

确保你的 `package.json` 包含以下依赖：

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "@react-three/fiber": "^8.x",
    "@react-three/drei": "^9.x",
    "three": "^r128.x",
    "zustand": "^4.x"
  }
}
```

## 测试步骤

恢复后，请按以下步骤测试：

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **检查3D渲染**
   - 访问 `http://localhost:3000`
   - 确认3D知识图谱正常显示

3. **测试交互功能**
   - 尝试旋转、缩放相机
   - 点击节点进行选择
   - 拖拽节点移动
   - 编辑节点信息
   - 创建节点连接

4. **检查主题切换**
   - 切换明暗主题
   - 确认样式正确应用

5. **测试媒体上传**
   - 上传图片和视频
   - 验证预览功能

## 可能的问题和解决方案

### 问题1：导入错误
**症状**：`Cannot find module '@/components/...'`
**解决**：检查 `tsconfig.json` 中的路径别名配置

### 问题2：Three.js 版本不兼容
**症状**：3D场景不显示或报错
**解决**：
```bash
npm install three@r128 @react-three/fiber@8 @react-three/drei@9
```

### 问题3：样式丢失
**症状**：UI组件样式不正确
**解决**：检查 CSS 导入和 Tailwind 配置

### 问题4：性能问题
**症状**：帧率低或卡顿
**解决**：
- 减少粒子数量
- 优化光照数量
- 使用 LOD（细节级别）

## 文件大小统计

| 文件 | 大小 | 行数 |
|------|------|------|
| KnowledgeGraph.tsx | 19.3 KB | ~400 |
| GraphNodes.tsx | 34.6 KB | ~515 |
| GraphEdges.tsx | 5.0 KB | ~150 |
| TopNavbar.tsx | 75.7 KB | ~1200 |
| NodeDetailPanel.tsx | 39.7 KB | ~600 |
| WorkflowCanvas.tsx | 156.5 KB | ~2500 |
| page.tsx | 0.8 KB | ~15 |

## 后续建议

1. **版本控制**
   - 创建新的git分支来管理这个恢复
   - 定期提交以保存进度

2. **代码审查**
   - 检查是否有过时的依赖
   - 更新到最新的API

3. **性能优化**
   - 考虑使用 React.memo 优化组件
   - 实现虚拟化以处理大量节点

4. **功能增强**
   - 添加更多的几何体形状
   - 实现节点搜索和过滤
   - 添加导出功能

## 获取帮助

如果在恢复过程中遇到问题：

1. 检查 git 日志：`git log --oneline | grep 31ba075`
2. 查看提交详情：`git show 31ba075`
3. 比较文件差异：`git diff 31ba075 HEAD -- components/KnowledgeGraph.tsx`

---

**恢复时间**：2026-02-12
**源提交**：31ba0759e52f58b29ee95666e05cb5aac5e873ef
**提交信息**：节点更新,三维优化,明暗风格
