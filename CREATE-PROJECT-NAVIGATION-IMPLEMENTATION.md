# 创建项目后自动跳转功能实现

## 功能概述

用户在创建知识图谱时，根据选择的图谱类型（2D或3D），系统会自动跳转到相应的编辑页面。

## 实现细节

### 1. API 更新 (`app/api/projects/route.ts`)

**修改内容：**
- 更新POST端点以接收 `graphType` 参数（'2d' 或 '3d'）
- 移除对 `projectName` 的依赖
- 在创建图谱时，将 `graphType` 存储在 `settings` JSON字段中
- 添加图谱类型验证

**关键改动：**
```typescript
const { graphName, graphType } = body;

// 验证 graphType
if (!graphType || !['2d', '3d'].includes(graphType)) {
  return NextResponse.json(
    { error: '图谱类型必须为 2d 或 3d' },
    { status: 400 }
  );
}

// 创建图谱时存储类型信息
graphs: {
  create: {
    name: graphName,
    description: `${graphName}的${graphType === '2d' ? '二维' : '三维'}知识图谱`,
    settings: JSON.stringify({ graphType }),
  },
}
```

### 2. 前端组件更新 (`components/creation/content/MyProjectsContent.tsx`)

**修改内容：**
- 导入 `useRouter` 用于页面跳转
- 更新 `handleCreateProject` 函数以接收 `graphType` 参数
- 创建项目成功后，根据图谱类型跳转到相应页面

**跳转逻辑：**
```typescript
// 获取第一个图谱的ID并跳转
if (newProject.graphs && newProject.graphs.length > 0) {
  const graphId = newProject.graphs[0].id;
  // 根据图谱类型跳转到相应的页面
  if (graphType === '2d') {
    router.push(`/workflow?graphId=${graphId}`);
  } else {
    router.push(`/gallery?graphId=${graphId}`);
  }
}
```

**跳转目标：**
- **2D图谱**: `/workflow?graphId={graphId}` - 二维知识图谱编辑页面
- **3D图谱**: `/gallery?graphId={graphId}` - 三维知识图谱编辑页面

### 3. 测试更新

**更新的测试文件：**
- `components/creation/__tests__/MyProjectsContent.test.tsx`
  - 添加 `useRouter` mock
  - 更新API响应以包含 `graphs` 数组
  - 验证创建项目后的跳转逻辑

**测试覆盖：**
- ✅ 所有30个测试通过
- ✅ 无诊断错误

## 用户流程

1. 用户点击"新建项目"按钮
2. 弹出创建对话框
3. 用户输入图谱名称
4. 用户选择图谱类型（2D或3D）
5. 用户点击"创建"按钮
6. 系统创建项目和图谱
7. **自动跳转到相应的编辑页面**
   - 2D图谱 → `/workflow?graphId={graphId}`
   - 3D图谱 → `/gallery?graphId={graphId}`

## 数据流

```
CreateProjectDialog
    ↓
handleCreateProject(graphName, graphType)
    ↓
POST /api/projects
    ↓
创建Project和Graph（带graphType）
    ↓
返回项目数据（包含graphs数组）
    ↓
提取graphId
    ↓
根据graphType跳转
    ↓
/workflow 或 /gallery
```

## 技术栈

- **前端框架**: Next.js 13+ (App Router)
- **路由**: next/navigation useRouter
- **数据库**: Prisma + PostgreSQL
- **测试**: Jest + React Testing Library

## 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|--------|------|
| `app/api/projects/route.ts` | 修改 | 更新POST端点支持graphType |
| `components/creation/content/MyProjectsContent.tsx` | 修改 | 添加路由跳转逻辑 |
| `components/creation/__tests__/MyProjectsContent.test.tsx` | 修改 | 更新测试以支持新功能 |

## 验证清单

- ✅ API接收并验证graphType参数
- ✅ 图谱类型信息存储在数据库
- ✅ 创建成功后获取graphId
- ✅ 根据类型跳转到正确的页面
- ✅ 所有单元测试通过
- ✅ 无TypeScript诊断错误
- ✅ 代码符合项目规范

## 后续可能的改进

1. 添加加载状态指示器（创建中...）
2. 添加错误处理和重试机制
3. 在跳转前预加载编辑页面
4. 添加创建成功的提示信息
5. 支持自定义跳转目标URL
