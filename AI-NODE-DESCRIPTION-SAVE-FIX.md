# AI节点描述保存修复

## 问题描述

在AI生成页面中，当用户在预览弹窗中点击"保存图谱"后：
- ✅ 节点的名称可以成功保存
- ❌ 节点的描述无法成功保存

在3D知识图谱页面，点击节点查看详情时：
- ✅ 节点名称正常显示
- ❌ 节点描述为空

## 根本原因

在 `app/api/ai/save-graph/route.ts` 中，保存节点时存在以下问题：

1. **创建新节点时**：描述被存储在 `properties.description` 中，然后序列化到 `metadata` JSON字段，但没有保存到独立的 `description` 字段
2. **更新现有节点时**：合并操作只更新了 `metadata` 字段，没有提取并更新 `description` 字段

数据库schema中，Node模型有一个独立的 `description` 字段（`description String?`），但保存逻辑没有正确使用它。

## 修复方案

### 1. 修复节点创建逻辑

在创建新节点时，从 `properties` 中提取 `description` 并保存到独立字段：

```typescript
// Step 3: Create new nodes
const createdNodes = await Promise.all(
  mergeResult.nodesToCreate.map(async (nodeData: NodeToCreate) => {
    // Extract description from properties if it exists
    const description = nodeData.properties?.description || '';
    
    return await tx.node.create({
      data: {
        name: nodeData.name,
        type: nodeData.type || 'entity',
        description: description, // ✅ Save description to dedicated field
        metadata: JSON.stringify(nodeData.properties || {}),
        projectId: body.projectId,
        graphId: graph.id,
        x: 0,
        y: 0,
        z: 0,
        color: '#3b82f6',
        size: 2.0,
        shape: 'sphere',
      },
    });
  })
);
```

### 2. 修复节点更新逻辑

在更新现有节点时，从 `metadata` 中解析并提取 `description`：

```typescript
// Step 4: Update existing nodes (merge)
await Promise.all(
  mergeResult.nodesToUpdate.map(async (update: NodeToUpdate) => {
    // Parse metadata to extract description
    let description = '';
    try {
      const metadata = JSON.parse(update.updates.metadata);
      description = metadata.description || '';
    } catch (error) {
      console.warn('[AI Save Graph] Failed to parse metadata for description:', error);
    }
    
    return await tx.node.update({
      where: { id: update.id },
      data: {
        description: description, // ✅ Update description field
        metadata: update.updates.metadata,
        updatedAt: new Date(),
      },
    });
  })
);
```

## 修改的文件

- `app/api/ai/save-graph/route.ts` - 修复节点创建和更新逻辑

## 测试验证

创建了测试脚本 `scripts/test-ai-description-save.ts` 来验证修复：

```bash
# 运行测试（需要先启动开发服务器）
npm run dev

# 在另一个终端运行测试
npx tsx scripts/test-ai-description-save.ts
```

测试内容：
1. 创建测试项目
2. 模拟AI保存图谱API调用，包含带描述的节点
3. 验证节点的 `description` 字段是否正确保存
4. 清理测试数据

## 预期效果

修复后：
1. ✅ AI生成的节点描述会正确保存到数据库的 `description` 字段
2. ✅ 在3D知识图谱页面点击节点时，节点详情弹窗会正确显示描述
3. ✅ 节点的名称和描述都能成功保存和显示

## 相关文件

- `app/api/ai/save-graph/route.ts` - AI保存图谱API
- `components/NodeDetailPanel.tsx` - 节点详情面板（显示描述）
- `components/AIPreviewModal.tsx` - AI预览弹窗
- `app/text-page/page.tsx` - AI生成页面
- `prisma/schema.prisma` - 数据库schema定义

## 注意事项

1. 描述同时存储在两个地方：
   - `description` 字段：独立字段，用于快速查询和显示
   - `metadata.description`：JSON字段中，保持向后兼容

2. 节点详情面板 (`NodeDetailPanel.tsx`) 使用 `selectedNode.description` 来显示描述，因此必须确保 `description` 字段被正确填充

3. 此修复不影响现有数据，只影响新创建或更新的节点
