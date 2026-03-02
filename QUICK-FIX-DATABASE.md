# 数据库连接问题 - 快速修复

## 问题

创建项目时出现错误：`创建项目失败`

原因：**Neon 数据库无法连接**（很可能是数据库已暂停）

## 快速解决方案（3 步）

### 方案 A: 唤醒 Neon 数据库（推荐，2 分钟）

1. **打开 Neon 控制台**
   ```
   https://console.neon.tech/
   ```

2. **找到并唤醒数据库**
   - 登录后找到 `neondb` 项目
   - 如果看到 "Suspended" 或 "Paused" 状态
   - 点击 "Resume" 或 "Wake up" 按钮
   - 等待 10-30 秒

3. **测试连接**
   ```bash
   node test-db-connection.js
   ```

   如果看到 ✅ 表示成功！

### 方案 B: 使用本地数据库（快速测试，5 分钟）

如果无法访问 Neon 或需要快速测试：

1. **修改 `.env` 文件**
   ```env
   # 注释掉这行
   # DATABASE_URL="postgresql://..."
   
   # 添加这行
   DATABASE_URL="file:./dev.db"
   ```

2. **修改 `prisma/schema.prisma`**
   ```prisma
   datasource db {
     provider = "sqlite"  // 改这里
     url      = env("DATABASE_URL")
   }
   ```

3. **初始化数据库**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **重启服务器**
   ```bash
   npm run dev
   ```

## 验证修复

运行测试脚本：
```bash
node test-db-connection.js
```

应该看到：
```
✅ 数据库连接成功！
📊 当前项目数量: X
📊 当前图谱数量: X
✅ 数据库工作正常！
```

## 现在可以做什么？

修复后，您可以：
- ✅ 创建新项目和图谱
- ✅ 点击图谱卡片进入 graph 页面
- ✅ TopNavbar 自动切换到对应的项目和图谱
- ✅ 编辑和保存图谱数据

## 需要更多帮助？

查看详细文档：`DATABASE-CONNECTION-FIX.md`
