# 故障排除指南

## ✅ 已修复的问题

### 1. setConnectingFromNode is not a function

**问题**: 点击画布时出现 `TypeError: setConnectingFromNode is not a function`

**原因**: `lib/store.ts` 缺少 `connectingFromNode` 状态和 `setConnectingFromNode` 函数

**解决方案**: ✅ 已修复
- 添加了 `connectingFromNode: Node | null` 状态
- 添加了 `setConnectingFromNode` 函数
- 重启开发服务器

### 2. API 500 错误

**问题**: `/api/nodes` 和 `/api/edges` 返回 500 错误

**可能原因**:
1. 数据库连接问题
2. Prisma 客户端未正确初始化
3. 环境变量未加载

**解决方案**: 
```bash
# 1. 检查环境变量
cat .env

# 2. 重新生成 Prisma 客户端
npx prisma generate

# 3. 测试数据库连接
npm run db:test

# 4. 重启开发服务器
# Ctrl+C 停止，然后：
npm run dev
```

## 常见问题

### Q1: 页面空白，没有节点显示

**检查步骤**:
1. 打开浏览器控制台查看错误
2. 检查 API 是否返回数据：
   ```bash
   curl http://localhost:3000/api/nodes
   curl http://localhost:3000/api/edges
   ```
3. 确认数据库中有数据：
   ```bash
   npm run db:studio
   ```
4. 如果没有数据，重新填充：
   ```bash
   npm run db:seed
   ```

### Q2: 数据库连接失败

**错误信息**: `Can't reach database server`

**解决方案**:
1. 检查网络连接
2. 确认 Neon 项目状态（访问 console.neon.tech）
3. 验证 DATABASE_URL 是否正确：
   ```bash
   # Windows
   echo %DATABASE_URL%
   
   # 或查看 .env 文件
   type .env
   ```
4. 测试连接：
   ```bash
   npm run db:test
   ```

### Q3: 节点创建失败

**症状**: 点击"添加节点"后没有反应

**检查步骤**:
1. 打开浏览器控制台查看错误
2. 检查 API 响应：
   ```javascript
   // 在浏览器控制台运行
   fetch('/api/nodes', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       name: '测试节点',
       type: 'entity',
       color: '#4A9EFF',
       size: 1.5
     })
   }).then(r => r.json()).then(console.log)
   ```
3. 检查数据库权限
4. 查看服务器日志

### Q4: 连线功能不工作

**症状**: 点击"连线"按钮后无法连接节点

**解决方案**:
1. 确保已选中一个节点
2. 点击"连线"按钮进入连线模式
3. 点击目标节点完成连接
4. 如果仍然失败，检查浏览器控制台错误

### Q5: 3D 场景渲染问题

**症状**: 黑屏或渲染异常

**可能原因**:
1. WebGL 不支持
2. 显卡驱动问题
3. 浏览器兼容性

**解决方案**:
1. 检查 WebGL 支持：访问 https://get.webgl.org/
2. 更新显卡驱动
3. 尝试其他浏览器（推荐 Chrome 或 Edge）
4. 禁用硬件加速后重试

### Q6: 环境变量未加载

**症状**: `DATABASE_URL 环境变量未设置`

**解决方案**:
1. 确认 `.env` 文件存在
2. 检查文件内容：
   ```bash
   type .env
   ```
3. 确保没有语法错误（如多余的引号）
4. 重启开发服务器

### Q7: Prisma 生成失败

**错误信息**: `Prisma schema validation error`

**解决方案**:
1. 检查 `prisma/schema.prisma` 语法
2. 确认 DATABASE_URL 格式正确
3. 重新生成：
   ```bash
   npx prisma generate
   ```

## 调试技巧

### 1. 查看服务器日志

开发服务器的终端会显示所有请求和错误。

### 2. 使用浏览器开发工具

- **Console**: 查看 JavaScript 错误
- **Network**: 查看 API 请求和响应
- **Application**: 查看本地存储和 cookies

### 3. 测试 API 端点

```bash
# 获取所有节点
curl http://localhost:3000/api/nodes

# 获取所有关系
curl http://localhost:3000/api/edges

# 获取统计信息
curl http://localhost:3000/api/stats

# 搜索
curl "http://localhost:3000/api/search?q=RAG"
```

### 4. 使用 Prisma Studio

```bash
npm run db:studio
```

可视化查看和编辑数据库数据。

### 5. 检查数据库连接

```bash
npm run db:test
```

运行连接测试脚本。

## 性能问题

### 场景卡顿

**原因**: 节点或关系太多

**解决方案**:
1. 减少节点数量
2. 优化渲染（降低节点质量）
3. 使用更强大的显卡

### API 响应慢

**原因**: 数据库查询慢或网络延迟

**解决方案**:
1. 检查数据库索引
2. 优化查询（使用 Prisma 的 include 和 select）
3. 考虑添加缓存

## 重置项目

如果遇到无法解决的问题，可以尝试重置：

```bash
# 1. 停止开发服务器（Ctrl+C）

# 2. 删除 node_modules 和锁文件
rm -rf node_modules
rm package-lock.json

# 3. 重新安装依赖
npm install

# 4. 重新生成 Prisma 客户端
npx prisma generate

# 5. 重置数据库
npm run db:seed

# 6. 启动开发服务器
npm run dev
```

## 获取帮助

如果以上方法都无法解决问题：

1. 查看项目文档：
   - [README.md](./README.md)
   - [QUICK-START.md](./QUICK-START.md)
   - [DATABASE.md](./DATABASE.md)

2. 检查相关文档：
   - Next.js: https://nextjs.org/docs
   - Prisma: https://www.prisma.io/docs
   - Neon: https://neon.tech/docs
   - Three.js: https://threejs.org/docs

3. 查看浏览器控制台的完整错误信息

4. 检查服务器终端的错误日志

## 预防措施

1. **定期备份数据**
   ```bash
   cp prisma/dev.db prisma/dev.db.backup
   ```

2. **使用版本控制**
   - 提交前确保代码可以运行
   - 不要提交 `.env` 文件

3. **保持依赖更新**
   ```bash
   npm outdated
   npm update
   ```

4. **监控 Neon 使用量**
   - 访问 console.neon.tech
   - 查看存储和计算时间使用情况

---

**最后更新**: 2026-01-10

如果发现新的问题或解决方案，请更新此文档。
