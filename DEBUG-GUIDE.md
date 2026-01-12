# 3D 知识图谱调试指南

## ✅ 当前状态

### 服务器状态
- **开发服务器**: ✅ 运行中 (http://localhost:3000)
- **API 端点**: ✅ 正常工作
  - GET /api/nodes - 200 OK
  - GET /api/edges - 200 OK
  - POST /api/nodes - 201 Created
- **数据库连接**: ✅ Neon PostgreSQL 已连接
- **数据**: ✅ 7个节点，6条边（RAG知识图谱）

### 已修复的问题
1. ✅ 移除了 `app/layout.tsx` 中的 Edge Runtime 配置
2. ✅ 所有 API 路由使用 Node.js Runtime
3. ✅ Prisma Client 配置正确

## 🔍 如何调试

### 1. 检查浏览器控制台
打开浏览器开发者工具（F12），查看：
- **Console 标签**: 查看 JavaScript 错误
- **Network 标签**: 查看 API 请求状态
- **Elements 标签**: 检查 DOM 结构

### 2. 常见问题排查

#### 问题：页面空白或只显示标题
**可能原因**:
- Three.js 加载失败
- Canvas 渲染错误
- 数据未正确加载

**解决方法**:
```bash
# 1. 检查浏览器控制台是否有错误
# 2. 刷新页面（Ctrl+F5 强制刷新）
# 3. 清除浏览器缓存
```

#### 问题：节点不显示
**检查步骤**:
1. 打开浏览器控制台
2. 查看 Network 标签，确认 `/api/nodes` 返回数据
3. 在 Console 中输入：
```javascript
fetch('/api/nodes').then(r => r.json()).then(console.log)
```

#### 问题：无法添加节点
**检查步骤**:
1. 点击"添加节点"按钮
2. 输入节点名称
3. 查看 Network 标签中的 POST 请求
4. 检查响应状态码（应该是 201）

### 3. 实时日志查看

在项目目录运行：
```bash
# 查看服务器日志
npm run dev
```

### 4. 测试 API 端点

使用 PowerShell 测试：
```powershell
# 获取所有节点
curl http://localhost:3000/api/nodes

# 获取所有边
curl http://localhost:3000/api/edges

# 创建新节点
$body = @{
    name = "测试节点"
    type = "entity"
    x = 0
    y = 0
    z = 0
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/nodes" -Method POST -Body $body -ContentType "application/json"
```

## 🎯 预期行为

### 页面加载时
1. 显示顶部导航栏（深灰色背景）
2. 显示 3D 画布（渐变背景）
3. 自动加载 7 个节点：
   - RAG
   - 向量数据库
   - Embedding
   - 检索器
   - LLM
   - 提示工程
   - 文档处理
4. 显示节点之间的连线

### 交互功能
1. **鼠标拖拽**: 旋转视角
2. **鼠标滚轮**: 缩放
3. **点击节点**: 
   - 相机平滑移动到节点附近
   - 右侧显示详情面板
   - 顶部显示"已选中"提示
4. **添加节点**: 
   - 点击"添加节点"按钮
   - 输入名称
   - 节点出现在随机位置
5. **创建连线**:
   - 选中一个节点
   - 点击"连线"按钮
   - 点击目标节点
   - 连线自动创建

## 🐛 当前可能的问题

### 如果看到空白页面
1. **检查浏览器兼容性**: 需要支持 WebGL 的现代浏览器
2. **检查 GPU 加速**: 确保浏览器启用了硬件加速
3. **检查控制台错误**: 可能有 Three.js 或 React Three Fiber 错误

### 如果节点名称不显示
- 检查 `@react-three/drei` 包是否正确安装
- 查看控制台是否有字体加载错误

### 如果无法交互
- 检查 OrbitControls 是否正常工作
- 尝试在不同浏览器中测试

## 📊 数据库内容

当前数据库中的节点：
```
1. RAG (0, 0, 0)
2. 向量数据库 (-8, -2, 3)
3. Embedding (8, -2, -3)
4. 检索器 (-5, 5, -5)
5. LLM (8, -2, -3)
6. 提示工程 (5, 5, 5)
7. 文档处理 (0, -5, 8)
```

连接关系：
- 文档处理 → RAG (PART_OF)
- Embedding → RAG (PART_OF)
- 向量数据库 → RAG (PART_OF)
- 检索器 → RAG (PART_OF)
- LLM → RAG (PART_OF)
- 提示工程 → RAG (PART_OF)

## 🔧 快速修复命令

```bash
# 重启开发服务器
npm run dev

# 重新生成 Prisma Client
npx prisma generate

# 查看数据库数据
npm run db:test

# 清除 Next.js 缓存
Remove-Item -Recurse -Force .next
npm run dev
```

## 📞 需要帮助？

如果遇到问题，请提供：
1. 浏览器控制台的错误信息（截图或文字）
2. Network 标签中的 API 请求状态
3. 具体的操作步骤和预期行为
