# Neon 数据库快速参考

## 🔗 连接信息

**数据库**: Neon PostgreSQL  
**区域**: US East 1  
**状态**: ✅ 已连接

## 📝 常用命令

### 数据库操作
```bash
# 推送数据库结构
npm run db:push

# 打开可视化管理界面
npm run db:studio

# 填充示例数据
npm run db:seed

# 测试数据库连接
npm run db:test
```

### 开发命令
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🌐 访问地址

- **网站**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555 (运行 `npm run db:studio` 后)
- **Neon 控制台**: https://console.neon.tech

## 📊 当前数据

- **节点**: 8 个（RAG 知识图谱）
- **关系**: 8 条
- **图谱**: 1 个

## 🔍 验证步骤

### 1. 测试连接
```bash
npm run db:test
```
应该显示：✅ 所有测试通过！

### 2. 查看数据
```bash
npm run db:studio
```
在浏览器中查看所有表和数据

### 3. 访问网站
打开 http://localhost:3000  
应该看到 8 个蓝色节点的 3D 图谱

## 🛠️ 故障排除

### 连接失败
```bash
# 1. 检查环境变量
cat .env

# 2. 重新生成 Prisma 客户端
npx prisma generate

# 3. 测试连接
npm run db:test
```

### 数据丢失
```bash
# 重新填充数据
npm run db:seed
```

### 服务器错误
```bash
# 重启开发服务器
# Ctrl+C 停止，然后：
npm run dev
```

## 📚 相关文档

- [NEON-SETUP-COMPLETE.md](./NEON-SETUP-COMPLETE.md) - 完整配置说明
- [QUICK-START.md](./QUICK-START.md) - 快速开始
- [DATABASE.md](./DATABASE.md) - 数据库架构
- [README.md](./README.md) - 项目文档

## 🔐 安全提示

⚠️ **不要分享或提交以下文件到公共仓库：**
- `.env`
- `.env.local`
- 任何包含数据库密码的文件

这些文件已在 `.gitignore` 中，但请务必检查！

## 📞 获取帮助

- Neon 文档: https://neon.tech/docs
- Prisma 文档: https://www.prisma.io/docs
- Next.js 文档: https://nextjs.org/docs
