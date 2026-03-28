# AI重复检测超时修复

## 问题描述
在AI分析时，如果选择了现有图谱，系统会尝试检测重复节点和边。当图谱数据量较大时，数据库查询会超时，导致整个AI分析失败，返回500错误。

错误信息：
```
Failed to check for duplicates. Database query timed out.
POST http://localhost:3000/api/ai/analyze 500 (Internal Server Error)
```

## 根本原因
1. 数据库查询没有超时限制，可能无限期等待
2. 没有限制查询的数据量，大图谱会导致查询缓慢
3. 重复检测失败时会中断整个AI分析流程

## 解决方案

### 1. 添加查询超时机制
```typescript
const queryTimeout = 5000; // 5秒超时

const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Database query timed out')), queryTimeout)
);

const [existingNodes, existingEdges] = await Promise.race([
  Promise.all([existingNodesPromise, existingEdgesPromise]),
  timeoutPromise
]) as [any[], any[]];
```

### 2. 限制查询数据量
```typescript
const existingNodes = await prisma.node.findMany({
  where: { graphId: body.graphId },
  select: {
    id: true,
    name: true,
    metadata: true,
  },
  take: 1000, // 限制最多1000条
});
```

### 3. 使重复检测失败不影响主流程
当重复检测失败时（超时、连接错误等），记录警告日志但继续执行，不返回错误：

```typescript
catch (error) {
  console.warn('[AI Analysis] Duplicate detection failed - skipping duplicate check');
  // 继续执行，不返回错误
}
```

## 修改的文件
- `app/api/ai/analyze/route.ts`

## 行为变化

### 修改前
- 重复检测失败 → 返回500错误 → AI分析完全失败
- 用户无法继续使用

### 修改后
- 重复检测失败 → 记录警告 → 继续AI分析
- 用户可以正常使用，只是没有重复检测功能
- 所有节点和边都被视为新数据

## 优点
1. 提高了系统的容错性
2. 即使数据库慢或超时，用户仍然可以使用AI功能
3. 重复检测变为可选功能，不影响核心流程

## 注意事项
1. 当重复检测超时时，可能会创建重复的节点和边
2. 建议在数据库层面优化查询性能（添加索引等）
3. 对于大型图谱，考虑使用分页或增量检测

## 测试方法

### 测试1：正常情况
1. 选择一个小型图谱（<100个节点）
2. 输入文本并生成图谱
3. 验证重复检测正常工作

### 测试2：超时情况
1. 选择一个大型图谱（>1000个节点）
2. 输入文本并生成图谱
3. 验证即使超时也能成功生成图谱
4. 检查服务器日志，应该看到超时警告

### 测试3：不选择图谱
1. 不选择现有图谱（创建新图谱）
2. 输入文本并生成图谱
3. 验证正常工作（不进行重复检测）

## 未来优化建议
1. 添加数据库索引以加快查询速度
2. 实现增量重复检测（只检查最近的数据）
3. 使用缓存减少数据库查询
4. 在前端显示重复检测状态（进行中/跳过/完成）

## 完成日期
2026-03-08
