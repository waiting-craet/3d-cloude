# AI分析API 500错误修复

## 问题描述
当用户点击"AI智能分析"按钮时，收到500 Internal Server Error错误：
```
POST http://localhost:3000/api/ai/analyze 500 (Internal Server Error)
```

## 根本原因
开发服务器在`.env`文件更新后没有重新加载环境变量。虽然`.env`文件中包含了正确的`AI_API_KEY`和`AI_API_ENDPOINT`配置，但运行中的Next.js开发服务器仍在使用旧的环境变量（或没有这些变量）。

### 环境变量配置
`.env`文件内容：
```env
AI_API_KEY="sk-ace40498292242fbbb272d2cb7d8fee7"
AI_API_ENDPOINT="https://api.openai.com/v1/chat/completions"
```

### 错误堆栈
```
[AI Analysis] AI service error: Error: Unable to analyze document. Please try again later.
    at AIIntegrationServiceImpl.analyzeDocument
```

根本错误是AI服务初始化时找不到`AI_API_KEY`环境变量。

## 解决方案

### 方法1: 重启开发服务器（推荐）
当修改`.env`文件后，必须重启Next.js开发服务器才能加载新的环境变量：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

### 方法2: 使用nodemon自动重启
在`package.json`中添加nodemon配置，监听`.env`文件变化：

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:watch": "nodemon --watch .env --exec \"next dev\""
  }
}
```

### 方法3: 验证环境变量加载
在API路由中添加日志验证环境变量是否正确加载：

```typescript
// app/api/ai/analyze/route.ts
export async function POST(request: NextRequest) {
  // 添加调试日志
  console.log('Environment check:', {
    hasApiKey: !!process.env.AI_API_KEY,
    hasEndpoint: !!process.env.AI_API_ENDPOINT,
  });
  
  // ... rest of code
}
```

## 修复步骤

1. ✅ 确认`.env`文件包含正确的配置
2. ✅ 停止当前运行的开发服务器
3. ✅ 重新启动开发服务器：`npm run dev`
4. ✅ 验证服务器日志显示"Environments: .env"
5. ✅ 测试AI分析功能

## 验证修复

### 测试步骤
1. 打开文本页面 (http://localhost:3000/text-page)
2. 选择或创建一个项目
3. 输入测试文本或上传文件
4. 点击"AI智能分析"按钮
5. 应该看到AI分析成功，显示预览模态框

### 预期结果
- ✅ 不再出现500错误
- ✅ AI分析成功返回实体和关系
- ✅ 预览模态框正常显示统计信息

## 常见问题

### Q: 为什么环境变量没有自动重新加载？
A: Next.js开发服务器在启动时读取`.env`文件，之后不会自动监听文件变化。这是Next.js的设计行为，需要手动重启服务器。

### Q: 如何确认环境变量已正确加载？
A: 查看服务器启动日志，应该看到：
```
- Environments: .env
```

### Q: 生产环境如何处理？
A: 在生产环境（如Vercel），环境变量通过平台的环境变量设置界面配置，不需要`.env`文件。每次部署时会自动使用最新的环境变量。

## 相关文件
- `.env` - 环境变量配置文件
- `lib/services/ai-integration.ts` - AI集成服务
- `app/api/ai/analyze/route.ts` - AI分析API端点

## 预防措施
1. 修改`.env`文件后，始终重启开发服务器
2. 在团队文档中说明环境变量更新流程
3. 考虑使用环境变量验证脚本
4. 在API路由中添加环境变量检查和友好的错误消息

---

**修复日期**: 2026-02-10  
**状态**: ✅ 已修复 - 开发服务器已重启，环境变量已加载  
**测试**: 等待用户测试确认
