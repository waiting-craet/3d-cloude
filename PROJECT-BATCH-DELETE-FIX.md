# 项目批量删除功能修复

## 问题描述

用户报告在 `/creation` 页面尝试批量删除项目时，出现"删除失败"的错误提示。

## 根本原因

项目批量删除 API (`app/api/projects/batch-delete/route.ts`) 缺少身份验证和授权检查：

1. **缺少用户身份验证**：API 没有验证用户是否已登录
2. **缺少所有权验证**：API 没有验证用户是否拥有要删除的项目
3. **前端错误处理不完善**：前端没有针对 401 未授权错误提供友好的提示

## 修复内容

### 1. 后端 API 修复 (`app/api/projects/batch-delete/route.ts`)

#### 添加身份验证导入
```typescript
import { getCurrentUserId, verifyProjectOwnership } from '@/lib/auth';
```

#### 在 POST 处理函数中添加用户验证
```typescript
// 验证用户登录
const userId = await getCurrentUserId(request, { required: true });
if (!userId) {
  return NextResponse.json(
    { error: '用户未登录' },
    { status: 401 }
  );
}
```

#### 在删除函数中添加所有权验证
```typescript
async function deleteProject(projectId: string, userId: string): Promise<ProjectDeleteResult> {
  // 验证项目所有权
  const isOwner = await verifyProjectOwnership({ projectId, userId });
  if (!isOwner) {
    return {
      projectId,
      projectName: 'Unknown',
      success: false,
      error: '无权限操作此项目',
    };
  }
  // ... 其余删除逻辑
}
```

### 2. 前端修复 (`components/creation/NewCreationWorkflowPage.tsx`)

#### 添加用户状态导入
```typescript
import { useUserStore } from '@/lib/userStore';
```

#### 在组件中使用登录状态
```typescript
const { isLoggedIn } = useUserStore();
```

#### 在进入批量删除模式前检查登录状态
```typescript
const handleEnterBatchDeleteMode = () => {
  if (!isLoggedIn) {
    alert('请先登录后再进行批量删除操作');
    return;
  }
  setIsBatchDeleteMode(true);
  setSelectedProjectIds(new Set());
};
```

#### 改进删除确认处理的错误提示
```typescript
const handleConfirmDelete = async () => {
  // ...
  if (response.status === 401) {
    alert('请先登录后再进行删除操作');
    return;
  }
  
  if (response.ok && data.success) {
    alert(`成功删除 ${data.summary.succeeded} 个项目`);
    // ...
  } else if (data.summary && data.summary.succeeded > 0) {
    // 部分成功的情况
    const failedProjects = data.results
      .filter((r: any) => !r.success)
      .map((r: any) => r.projectName || r.projectId)
      .join(', ');
    alert(
      `部分删除成功：${data.summary.succeeded} 个成功，${data.summary.failed} 个失败\n` +
      `失败的项目：${failedProjects}`
    );
    // ...
  }
  // ...
};
```

## 安全改进

1. **身份验证**：确保只有登录用户才能执行删除操作
2. **授权检查**：确保用户只能删除自己拥有的项目
3. **错误处理**：提供清晰的错误消息，帮助用户理解问题

## 测试建议

### 测试场景 1：未登录用户
1. 访问 `/creation` 页面（未登录状态）
2. 点击"批量删除"按钮
3. **预期结果**：显示提示"请先登录后再进行批量删除操作"

### 测试场景 2：已登录用户删除自己的项目
1. 登录系统
2. 访问 `/creation` 页面
3. 点击"批量删除"按钮
4. 选择一个或多个自己的项目
5. 点击"确认删除"
6. **预期结果**：成功删除项目，显示成功消息

### 测试场景 3：尝试删除其他用户的项目
1. 登录系统
2. 尝试删除不属于自己的项目（需要手动构造请求）
3. **预期结果**：删除失败，返回"无权限操作此项目"错误

## 与图谱批量删除的一致性

修复后，项目批量删除 API 现在与图谱批量删除 API (`app/api/graphs/batch-delete/route.ts`) 保持一致：

- ✅ 都使用 `getCurrentUserId` 验证用户登录
- ✅ 都使用所有权验证函数（`verifyProjectOwnership` / `verifyGraphOwnership`）
- ✅ 都返回详细的错误信息
- ✅ 都支持部分成功的场景

## 相关文件

- `app/api/projects/batch-delete/route.ts` - 项目批量删除 API
- `app/api/graphs/batch-delete/route.ts` - 图谱批量删除 API（参考实现）
- `components/creation/NewCreationWorkflowPage.tsx` - 创建工作流页面
- `lib/auth.ts` - 身份验证和授权工具函数
- `lib/userStore.ts` - 用户状态管理

## 注意事项

1. 用户必须先登录才能使用批量删除功能
2. 用户只能删除自己创建的项目
3. 如果用户的登录会话过期，需要重新登录
4. 批量删除支持部分成功场景（某些项目删除成功，某些失败）
