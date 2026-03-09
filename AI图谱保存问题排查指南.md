# AI图谱保存问题排查指南

## 已完成的修复

### 1. 字段名称不匹配问题
- **问题**：后端验证使用 `body.node` 和 `body.edge`（单数），但前端发送 `nodes` 和 `edges`（复数）
- **修复**：已将后端所有引用改为复数形式
- **文件**：`app/api/ai/save-graph/route.ts`

### 2. 类型转换问题
- **问题**：数据库返回的 `metadata` 类型与 merge 服务期望的类型不匹配
- **修复**：添加类型转换逻辑
- **文件**：`app/api/ai/save-graph/route.ts`

### 3. 调试日志
已在关键位置添加详细日志：

#### 前端日志（浏览器控制台）
```
[handleAISave] Request body: {
  nodeCount: 数量,
  edgeCount: 数量,
  projectId: ID,
  hasNodes: true/false,
  hasEdges: true/false,
  ...
}

[handleAISave] Response: {
  status: 状态码,
  ok: true/false,
  success: true/false,
  error: 错误信息
}
```

#### 后端日志（服务器控制台）
```
[AI Save Graph] Received request body keys: [...]
[AI Save Graph] Body structure: {
  hasNodes: true/false,
  hasEdges: true/false,
  nodesIsArray: true/false,
  ...
}

[AI Save Graph] Validation failed: ... (如果验证失败)
[AI Save Graph] Starting save: ... (如果验证通过)
```

## 下一步排查步骤

### 步骤1：查看日志
1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 尝试保存图谱
4. 查找 `[handleAISave]` 开头的日志
5. 同时查看服务器终端中的 `[AI Save Graph]` 日志

### 步骤2：检查数据
根据日志检查：
- `nodeCount` 和 `edgeCount` 是否大于 0
- `projectId` 是否有值（不是 null 或 undefined）
- `hasNodes` 和 `hasEdges` 是否为 true
- `nodesIsArray` 和 `edgesIsArray` 是否为 true

### 步骤3：运行测试脚本
```bash
# 确保开发服务器正在运行
npm run dev

# 在另一个终端运行
npx tsx scripts/test-ai-save-graph.ts
```

测试脚本会创建一个测试项目并尝试保存图谱，显示详细的调试信息。

## 常见问题

### 问题1：projectId 为空
**症状**：日志显示 `projectId: null` 或 `projectId: undefined`

**原因**：用户没有选择项目

**解决**：
1. 确保在保存前选择了项目
2. 检查项目下拉框是否正常工作
3. 查看 `selectedProject` 状态是否正确设置

### 问题2：nodes 或 edges 为空数组
**症状**：日志显示 `nodeCount: 0` 或 `edgeCount: 0`

**原因**：AI 分析没有生成节点或边

**解决**：
1. 检查 AI 分析是否成功完成
2. 查看预览模态框中是否显示了节点和边
3. 检查 `editedData` 是否正确传递

### 问题3：400 错误但日志显示数据正确
**症状**：数据看起来正确，但仍然返回 400

**可能原因**：
1. 请求体格式问题（JSON 解析失败）
2. 字段类型不匹配
3. 缺少必需字段

**解决**：
1. 检查后端日志中的 "Validation failed" 消息
2. 确认具体是哪个字段验证失败
3. 检查该字段的值和类型

### 问题4：500 错误
**症状**：前面的 400 错误解决后出现 500 错误

**可能原因**：
1. 数据库连接问题
2. Prisma 事务失败
3. 数据格式问题

**解决**：
1. 查看服务器日志中的完整错误堆栈
2. 检查数据库连接是否正常
3. 验证 `mergeDecisions` 格式是否正确

## 需要提供的信息

如果问题仍未解决，请提供：
1. 浏览器控制台的完整日志（包括 `[handleAISave]` 部分）
2. 服务器控制台的完整日志（包括 `[AI Save Graph]` 部分）
3. 错误发生时的截图
4. 测试脚本的输出（如果运行了）

## 联系方式
将上述信息整理后，可以更快地定位和解决问题。
