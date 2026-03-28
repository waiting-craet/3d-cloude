# 🚀 快速开始

## 界面说明

### 顶部导航栏
- **+ 添加节点** - 创建新的知识节点
- **🔗 连线** - 连接两个节点（选中节点后显示）
- **已选中** - 显示当前选中的节点
- **🔄 刷新** - 重新加载页面

### 3D 场景操作
- **鼠标左键拖拽** - 旋转视角
- **鼠标滚轮** - 缩放场景
- **鼠标右键拖拽** - 平移视角
- **点击节点** - 选中节点
- **点击空白** - 取消选择

## 基本操作

### 1. 添加节点
1. 点击顶部 **"+ 添加节点"** 按钮
2. 输入节点名称
3. 按 Enter 或点击 **"确定"**

### 2. 连接节点
1. 点击选中第一个节点
2. 点击顶部 **"🔗 连线"** 按钮
3. 点击目标节点完成连接
4. 或点击 **"取消"** 退出连线模式

### 3. 查看节点信息
- 鼠标悬停在节点上会显示节点名称
- 选中节点后，顶部导航栏会显示节点信息

## 示例数据

项目已预置 RAG（Retrieval-Augmented Generation）知识图谱：

**中心节点：**
- RAG 系统（蓝色大球）

**第一层节点：**
- 检索模块
- 生成模块
- 知识库

**第二层节点：**
- 向量数据库
- 嵌入模型
- LLM
- 重排序

## 数据管理

### 查看数据库
```bash
npm run db:studio
```
在浏览器中打开 Prisma Studio 可视化管理界面

### 重置数据
```bash
npm run db:seed
```
清空并重新填充示例数据

### 备份数据
```bash
# 复制数据库文件
cp prisma/dev.db prisma/dev.db.backup
```

## API 使用

### 创建节点
```bash
curl -X POST http://localhost:3000/api/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新节点",
    "type": "entity",
    "color": "#4A9EFF",
    "size": 1.5
  }'
```

### 创建关系
```bash
curl -X POST http://localhost:3000/api/edges \
  -H "Content-Type: application/json" \
  -d '{
    "fromNodeId": "节点1的ID",
    "toNodeId": "节点2的ID",
    "label": "RELATES_TO"
  }'
```

### 搜索节点
```bash
curl http://localhost:3000/api/search?q=RAG
```

### 获取统计信息
```bash
curl http://localhost:3000/api/stats
```

## 自定义配置

### 修改节点颜色
编辑 `components/TopNavbar.tsx`，修改 `addNode` 中的 `color` 值：
```typescript
color: '#4A9EFF',  // 蓝色
color: '#10b981',  // 绿色
color: '#ef4444',  // 红色
color: '#f59e0b',  // 橙色
```

### 修改节点大小
修改 `size` 值：
```typescript
size: 1.5,  // 默认大小
size: 2.0,  // 大节点
size: 1.0,  // 小节点
```

### 修改背景颜色
编辑 `app/globals.css`：
```css
background: linear-gradient(to bottom, #2a2a2a 0%, #1a1a1a 100%);
```

## 常见问题

### Q: 节点太多看不清？
A: 使用鼠标滚轮缩放场景，或者删除一些节点

### Q: 如何删除节点？
A: 目前需要通过 Prisma Studio 或 API 删除

### Q: 连线后看不到线？
A: 检查两个节点是否距离太远，尝试旋转视角

### Q: 如何导出数据？
A: 复制 `prisma/dev.db` 文件即可备份所有数据

## 下一步

- 📚 查看 [DATABASE.md](./DATABASE.md) 了解数据库结构
- 🔧 查看 [DATABASE-FEATURES.md](./DATABASE-FEATURES.md) 了解所有功能
- 🚀 查看 [scripts/migrate-to-neon.md](./scripts/migrate-to-neon.md) 了解如何部署到生产环境

## 技术支持

遇到问题？
1. 检查浏览器控制台是否有错误
2. 确保数据库文件存在（`prisma/dev.db`）
3. 尝试重启开发服务器：`npm run dev`
4. 重置数据库：`npm run db:seed`
