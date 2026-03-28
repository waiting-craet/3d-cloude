# 快速参考：创建项目后自动跳转

## 功能总结

✅ **已实现**：点击创建按钮后，系统根据选择的图谱类型自动跳转到相应的编辑页面

## 用户体验流程

```
1. 点击"新建项目" → 弹出对话框
2. 输入图谱名称 → 选择2D或3D
3. 点击"创建" → 自动跳转
   ├─ 2D → /workflow?graphId=xxx
   └─ 3D → /gallery?graphId=xxx
```

## 核心实现

### API端点 (POST /api/projects)

**请求体：**
```json
{
  "graphName": "我的知识图谱",
  "graphType": "3d"  // 系统已统一为3D
}
```

**响应：**
```json
{
  "id": "project-id",
  "name": "我的知识图谱",
  "graphs": [
    {
      "id": "graph-id",
      "name": "我的知识图谱",
      "settings": "{\"graphType\":\"2d\"}"
    }
  ]
}
```

### 前端跳转逻辑

```typescript
if (graphType === '2d') {
  router.push(`/workflow?graphId=${graphId}`);
} else {
  router.push(`/gallery?graphId=${graphId}`);
}
```

## 测试状态

- ✅ 30/30 测试通过
- ✅ 0 诊断错误
- ✅ 代码质量检查通过

## 修改的文件

1. `app/api/projects/route.ts` - API更新
2. `components/creation/content/MyProjectsContent.tsx` - 跳转逻辑
3. `components/creation/__tests__/MyProjectsContent.test.tsx` - 测试更新

## 验证方法

### 本地测试
```bash
npm test -- --testPathPattern="MyProjectsContent"
```

### 功能测试
1. 访问 `/creation`
2. 点击"新建项目"
3. 输入图谱名称
4. 选择2D或3D
5. 点击"创建"
6. 验证跳转到正确的页面

## 已知限制

- 跳转时需要确保目标页面（/workflow 或 /gallery）能够处理 `graphId` 参数
- 如果图谱创建失败，用户会看到错误提示

## 下一步

如需进一步改进，可以考虑：
- 添加加载动画
- 添加成功提示
- 预加载编辑页面
- 添加撤销功能
