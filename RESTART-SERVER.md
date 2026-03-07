# 🔄 重启开发服务器指南

## 问题原因

切换数据库后，Prisma Client 需要重新生成，但开发服务器正在运行，文件被锁定。

## 解决步骤

### 1️⃣ 停止开发服务器

在运行 `npm run dev` 的终端窗口中：
- 按 `Ctrl + C` 停止服务器

### 2️⃣ 重新生成 Prisma Client

```bash
cd 3d-cloude
npx prisma generate
```

### 3️⃣ 重启开发服务器

```bash
npm run dev
```

## 🚀 一键重启脚本

我已经为你创建了一个重启脚本，直接运行：

**Windows (PowerShell):**
```powershell
.\RESTART-DEV.ps1
```

**Windows (CMD):**
```cmd
RESTART-DEV.bat
```

## ✅ 验证

重启后，访问 http://localhost:3000，应该能正常加载项目列表了。

## 🔍 如果还有问题

查看服务器终端的错误日志，或运行测试脚本：

```bash
node test-mysql-connection.js
```
