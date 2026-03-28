# 首页图谱卡片显示修复

## 问题描述

首页中点击项目卡片后显示的图谱卡片仍然显示"已建立*个图谱",而不是预期的"包括X个节点,Y个关系"。

## 根本原因

在 `app/page.tsx` 文件中,当显示项目的图谱列表时,代码错误地使用了 `PaperWorkCard` 组件(项目卡片),并将图谱的 `nodeCount` 赋值给了 `graphCount` 字段:

```typescript
// 错误的代码
<PaperWorkCard
  project={{
    id: graph.id,
    name: graph.name,
    graphCount: graph.nodeCount,  // ❌ 错误:将节点数当作图谱数
    ...
  }}
/>
```

这导致图谱卡片显示为"已建立X个图谱"而不是"包括X个节点,Y个关系"。

## 解决方案

### 1. 导入正确的组件

在 `app/page.tsx` 中导入 `GraphCard` 组件:

```typescript
import GraphCard from '@/components/GraphCard'
```

### 2. 使用GraphCard组件显示图谱

将图谱列表的渲染逻辑从 `PaperWorkCard` 改为 `GraphCard`:

```typescript
// 正确的代码
<GraphCard
  key={graph.id}
  graph={{
    id: graph.id,
    name: graph.name,
    description: graph.description || null,
    nodeCount: graph.nodeCount,      // ✅ 正确:使用节点数
    edgeCount: graph.edgeCount,      // ✅ 正确:使用边数
    createdAt: new Date(graph.createdAt),
    updatedAt: new Date(graph.updatedAt),
    projectId: selectedProject?.id || '',
  }}
  onClick={(graphId) => router.push(`/graph?graphId=${graphId}&from=homepage`)}
/>
```

## 修改的文件

- `3d-cloude/app/page.tsx`
  - 添加 `GraphCard` 组件导入
  - 将图谱列表渲染从 `PaperWorkCard` 改为 `GraphCard`

## 验证

修复后的显示效果:

### 项目卡片 (PaperWorkCard)
- 显示: "已建立 X 个图谱"
- 用途: 在推荐广场显示项目

### 图谱卡片 (GraphCard)
- 显示: "包括X个节点,Y个关系"
- 用途: 在项目详情中显示图谱列表

## 测试

1. 访问首页
2. 点击任意项目卡片
3. 验证图谱卡片显示"包括X个节点,Y个关系"
4. 返回推荐广场
5. 验证项目卡片仍显示"已建立X个图谱"

## 状态

✅ 已修复
✅ TypeScript类型检查通过
✅ 组件隔离正确

## 相关文件

- `components/GraphCard.tsx` - 图谱卡片组件
- `components/PaperWorkCard.tsx` - 项目卡片组件
- `app/page.tsx` - 首页主文件

---

修复日期: 2024年
修复人: Kiro AI Assistant
