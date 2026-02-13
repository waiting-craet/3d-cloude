# DeepSeek API 配置完成

## 问题描述
AI 文档分析功能返回 500 错误，无法调用大模型 API 进行文档分析。

## 根本原因
1. 环境变量配置的是 OpenAI API 端点 (`https://api.openai.com/v1/chat/completions`)
2. 实际使用的是 DeepSeek API 密钥
3. DeepSeek API 端点应该是 `https://api.deepseek.com/v1/chat/completions`
4. 连接 OpenAI 端点时出现网络超时错误

## 解决方案

### 1. 更新环境变量配置
修改 `.env` 文件中的 API 端点：

```env
# AI Model API 配置（用于文档分析和实体提取）
AI_API_KEY="sk-ace40498292242fbbb272d2cb7d8fee7"
AI_API_ENDPOINT="https://api.deepseek.com/v1/chat/completions"
```

### 2. 更新 AI 集成服务代码
修改 `lib/services/ai-integration.ts`：

- 将默认端点从 OpenAI 改为 DeepSeek
- 将模型名称从 `gpt-4` 改为 `deepseek-chat`
- 改进错误处理，支持 DeepSeek 响应格式

### 3. 重启开发服务器
环境变量更改后必须重启 Next.js 开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

## 测试结果

### API 连接测试
```bash
npx tsx scripts/test-ai-env.ts
```

测试结果：
- ✅ 环境变量加载成功
- ✅ DeepSeek API 连接成功
- ✅ 返回状态码 200
- ✅ 成功获取 JSON 格式响应

### 测试文档
创建了 `test-deepseek.txt` 测试文件，包含中文实体和关系，用于测试文档分析功能。

## 使用说明

### 在文本页面测试
1. 访问 `http://localhost:3000/text-page`
2. 上传 `test-deepseek.txt` 文件或直接输入文本
3. 点击"分析文档"按钮
4. 系统将调用 DeepSeek API 提取实体和关系
5. 在预览模态框中查看提取结果

### 支持的功能
- 实体提取（人物、组织、地点、概念等）
- 关系提取（实体之间的连接）
- 重复检测（如果选择了现有图谱）
- 冲突标记（属性值不一致时）
- 2D/3D 可视化

## 技术细节

### DeepSeek API 格式
DeepSeek API 兼容 OpenAI 的 Chat Completion 格式：

```typescript
{
  model: 'deepseek-chat',
  messages: [
    { role: 'system', content: '系统提示词' },
    { role: 'user', content: '用户输入' }
  ],
  temperature: 0.3,
  response_format: { type: 'json_object' }
}
```

### 响应格式
```json
{
  "choices": [
    {
      "message": {
        "content": "{\"entities\": [...], \"relationships\": [...]}"
      }
    }
  ]
}
```

## 相关文件
- `.env` - 环境变量配置
- `lib/services/ai-integration.ts` - AI 集成服务
- `app/api/ai/analyze/route.ts` - 分析 API 端点
- `scripts/test-ai-env.ts` - API 连接测试脚本
- `test-deepseek.txt` - 测试文档

## 注意事项
1. DeepSeek API 密钥格式：`sk-` 开头
2. 需要网络连接到 `api.deepseek.com`
3. 环境变量更改后必须重启开发服务器
4. 支持中文文档分析
5. 响应时间取决于文档长度和网络状况

## 下一步
现在可以正常使用 AI 文档分析功能了。尝试上传不同类型的文档来测试实体提取和关系识别的准确性。
