# 3D 渲染调试指南

## 问题描述
页面上没有显示 3D 区域

## 已完成的检查

### 1. 服务器状态 ✓
- Dev server 正在运行在 http://localhost:3000
- API 端点正常工作 (200/201 状态码)
- 数据库连接正常

### 2. 数据库数据 ✓
- 8 个节点已创建（树状结构）
- 7 条边已创建
- 数据可以通过 API 获取

### 3. 组件结构 ✓
- `app/page.tsx` - 主页面组件
- `components/KnowledgeGraph.tsx` - Canvas 容器
- `components/GraphNodes.tsx` - 节点渲染
- `components/GraphEdges.tsx` - 边渲染
- `components/TopNavbar.tsx` - 顶部导航栏
- `components/NodeDetailPanel.tsx` - 详情面板

### 4. CSS 样式 ✓
- `#canvas-container` 设置为 100vw × 100vh
- position: fixed
- 背景渐变色正常

### 5. 依赖包 ✓
- @react-three/fiber: ^8.17.10
- @react-three/drei: ^9.117.3
- three: ^0.170.0
- 所有依赖已安装

## 可能的原因

### 1. 浏览器控制台错误
打开浏览器开发者工具 (F12)，检查 Console 标签是否有错误信息

### 2. Canvas 渲染问题
- Three.js 可能需要 WebGL 支持
- 检查浏览器是否支持 WebGL

### 3. 相机位置
已调整相机位置以适应树状布局：
- 旧位置: `[0, 15, 35]`
- 新位置: `[0, 0, 30]`
- 目标点: `[0, 0, 0]`

## 调试步骤

### 步骤 1: 检查浏览器控制台
1. 打开 http://127.0.0.1:3000/
2. 按 F12 打开开发者工具
3. 查看 Console 标签
4. 查看 Network 标签，确认 API 请求成功

### 步骤 2: 检查 WebGL 支持
访问: https://get.webgl.org/
确认浏览器支持 WebGL

### 步骤 3: 硬刷新
按 Ctrl + Shift + R (Windows) 或 Cmd + Shift + R (Mac) 进行硬刷新

### 步骤 4: 清除缓存
1. 已删除 `.next` 文件夹
2. 已重启开发服务器
3. 尝试在浏览器中清除缓存

## 下一步操作

如果问题仍然存在，请提供：
1. 浏览器控制台的错误信息（截图或文字）
2. Network 标签中的 API 请求状态
3. 使用的浏览器名称和版本
