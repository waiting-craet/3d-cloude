# 问题修复指南

## 已解决的问题

### 1. 网站404错误 ✅
**原因**：开发服务器没有运行

**解决方案**：
- 已启动开发服务器
- 服务器运行在：http://localhost:3000

### 2. 数据库配置 ✅
**原因**：缺少.env文件和数据库配置

**解决方案**：
- 创建了.env文件，配置SQLite数据库
- 更新了prisma/schema.prisma，从PostgreSQL改为SQLite
- 运行了数据库迁移

### 3. 依赖安装 ✅
**原因**：node_modules未安装

**解决方案**：
- 运行了npm install
- 所有依赖已安装

## 如何使用

### 访问网站
1. 打开浏览器
2. 访问：http://localhost:3000
3. 你应该能看到3D知识图谱主页

### 测试2D到3D转换
1. 在主页点击导航栏的"工作流"按钮（或直接访问 http://localhost:3000/workflow）
2. 在2D画布上创建一些节点：
   - 点击左上角的"+"按钮添加节点
   - 填写节点标题和描述
   - 点击节点右侧的连接点，拖动到另一个节点创建连接
3. 点击右上角的"保存并转换为3D"按钮
4. 系统会将2D工作流转换为3D知识图谱并跳转到主页

### 如果转换失败
如果仍然出现"Failed to fetch"错误，可能的原因：

1. **API端点问题**
   - 检查浏览器控制台的错误信息
   - 确认API路由 /api/convert 可访问

2. **数据验证失败**
   - 确保至少有一个节点有非空标题
   - 检查浏览器控制台的验证错误信息

3. **数据库连接问题**
   - 检查.env文件是否存在
   - 确认DATABASE_URL配置正确

## 开发服务器管理

### 启动服务器
```bash
npm run dev
```

### 停止服务器
按 Ctrl+C

### 重启服务器
1. 停止当前服务器（Ctrl+C）
2. 重新运行 `npm run dev`

## 数据库管理

### 查看数据库
```bash
npm run db:studio
```
这会打开Prisma Studio，你可以在浏览器中查看和编辑数据库内容。

### 重置数据库
如果需要清空数据库：
```bash
# 删除数据库文件
rm prisma/dev.db

# 重新创建数据库
npm run db:push
```

## 下一步

现在你的开发环境已经配置好了，你可以：

1. **测试现有功能**
   - 创建3D节点
   - 创建2D工作流并转换为3D
   - 测试搜索功能

2. **开发新功能**
   - 查看.kiro/specs文件夹中的规格文档
   - 按照任务列表实现新功能

3. **调试问题**
   - 使用浏览器开发者工具查看网络请求
   - 检查控制台错误信息
   - 使用Prisma Studio查看数据库状态

## 常见问题

### Q: 为什么改用SQLite而不是PostgreSQL？
A: 为了简化本地开发环境配置。SQLite不需要额外的数据库服务器，适合开发和测试。如果需要部署到生产环境，可以再改回PostgreSQL。

### Q: 如何切换回PostgreSQL？
A: 
1. 修改prisma/schema.prisma中的provider为"postgresql"
2. 更新.env中的DATABASE_URL为PostgreSQL连接字符串
3. 运行 `npm run db:push`

### Q: 开发服务器启动很慢怎么办？
A: 这是正常的，Next.js需要编译页面。首次启动会比较慢，后续的热重载会快很多。

## 技术栈

- **前端框架**：Next.js 14 + React 18
- **3D渲染**：Three.js + React Three Fiber
- **数据库**：SQLite (开发) / PostgreSQL (生产)
- **ORM**：Prisma
- **状态管理**：Zustand
- **样式**：CSS-in-JS (内联样式)

## 项目结构

```
.
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   ├── convert/       # 2D到3D转换API
│   │   ├── nodes/         # 节点CRUD API
│   │   └── edges/         # 边CRUD API
│   ├── workflow/          # 2D工作流页面
│   └── page.tsx           # 3D知识图谱主页
├── components/            # React组件
│   ├── KnowledgeGraph.tsx # 3D图谱组件
│   ├── WorkflowCanvas.tsx # 2D画布组件
│   └── ...
├── lib/                   # 工具库
│   ├── db.ts             # Prisma客户端
│   ├── coordinate-converter.ts  # 坐标转换
│   └── data-validator.ts # 数据验证
├── prisma/               # 数据库
│   ├── schema.prisma     # 数据库模型
│   └── dev.db           # SQLite数据库文件
└── .env                  # 环境变量
```

## 支持

如果遇到其他问题，请：
1. 检查浏览器控制台的错误信息
2. 检查开发服务器的终端输出
3. 查看相关的规格文档（.kiro/specs/）
