# AI图谱保存功能修复

## 问题描述
AI生成的知识图谱无法保存，显示错误信息："Nodes array is required"（需要节点数组）

## 根本原因
在 `app/api/ai/save-graph/route.ts` 文件中，API验证代码存在字段名称错误：
- 前端发送的数据使用 `nodes` 和 `edges`（复数形式）
- 后端验证代码检查的是 `body.node` 和 `body.edge`（单数形式）
- 导致验证失败，返回400错误

## 修复内容

### 1. 修复验证逻辑
将所有 `body.node` 改为 `body.nodes`，`body.edge` 改为 `body.edges`

### 2. 修复类型转换
修复了 `existingNodesMap` 的元数据类型转换问题，确保与merge服务的类型兼容

### 3. 添加详细日志
在前端和后端都添加了详细的调试日志，帮助追踪问题：
- 前端：记录请求体结构和响应状态
- 后端：记录接收到的数据结构和验证失败原因

## 修改的文件
- `app/api/ai/save-graph/route.ts` - 修复字段名称和类型转换
- `app/text-page/page.tsx` - 添加调试日志
- `scripts/test-ai-save-graph.ts` - 新增测试脚本

## 测试方法

### 方法1：手动测试
1. 启动开发服务器：`npm run dev`
2. 在AI文本输入页面输入文本
3. 点击"生成图谱"按钮
4. 在预览模态框中查看生成的图谱
5. 点击"确定保存"按钮
6. 查看浏览器控制台和服务器日志，验证请求/响应数据
7. 验证图谱成功保存，没有错误提示

### 方法2：使用测试脚本
```bash
# 确保开发服务器正在运行
npm run dev

# 在另一个终端运行测试脚本
npx tsx scripts/test-ai-save-graph.ts
```

测试脚本会：
1. 创建一个测试项目
2. 发送包含测试节点和边的保存请求
3. 显示详细的请求/响应信息
4. 验证保存是否成功

## 调试步骤
如果问题仍然存在，请检查：
1. 浏览器控制台中的 `[handleAISave]` 日志
2. 服务器控制台中的 `[AI Save Graph]` 日志
3. 确认 `selectedProject` 有值
4. 确认 `editedData.nodes` 和 `editedData.edges` 是数组

## 修复日期
2026-03-08
