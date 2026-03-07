# 首页显示所有项目修复

## 问题描述

当前首页的项目列表只显示当前登录用户创建的项目，但需求是首页应该显示数据库中的所有项目（无论是谁创建的）。

## 问题原因

在 `app/api/projects/route.ts` 的 GET 方法中，添加了用户过滤：

```typescript
const projects = await prisma.project.findMany({
  where: {
    userId: userId, // ❌ 只返回当前用户的项目
  },
  // ...
});
```

## 解决方案

### 1. 修改 `/api/projects` - 首页使用（显示所有项目）

修改GET方法，移除用户过滤，返回所有项目：

```typescript
// GET - 获取所有项目列表（首页显示所有项目）
export async function GET(request: NextRequest) {
  try {
    // 首页显示所有项目，不需要用户验证和过滤
    const projects = await prisma.project.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        nodeCount: true,
        edgeCount: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            graphs: true,
          },
        },
      },
    });

    // 将 _count.graphs 转换为 graphCount
    const projectsWithGraphCount = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      nodeCount: project.nodeCount,
      edgeCount: project.edgeCount,
      userId: project.userId,
      graphCount: project._count.graphs,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    return NextResponse.json({ projects: projectsWithGraphCount });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return NextResponse.json(
      { error: '获取项目列表失败' },
      { status: 500 }
    );
  }
}
```

### 2. 创建 `/api/projects/my-projects` - Creation页面使用（只显示用户项目）

创建新的API端点 `app/api/projects/my-projects/route.ts`，专门用于Creation页面：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

// GET - 获取当前用户的项目列表（用于Creation页面）
export async function GET(request: NextRequest) {
  try {
    // 获取当前用户ID（必须登录）
    const userId = await getCurrentUserId(request, { required: true });
    
    if (!userId) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      );
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: userId, // 只返回当前用户的项目
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        nodeCount: true,
        edgeCount: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            graphs: true,
          },
        },
      },
    });

    // 将 _count.graphs 转换为 graphCount
    const projectsWithGraphCount = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      nodeCount: project.nodeCount,
      edgeCount: project.edgeCount,
      userId: project.userId,
      graphCount: project._count.graphs,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    return NextResponse.json({ projects: projectsWithGraphCount });
  } catch (error) {
    console.error('获取用户项目列表失败:', error);
    return NextResponse.json(
      { error: '获取项目列表失败' },
      { status: 500 }
    );
  }
}
```

### 3. 更新前端组件

修改以下组件使用新的API端点：

#### `components/creation/NewCreationWorkflowPage.tsx`
```typescript
const fetchProjects = async () => {
  try {
    const response = await fetch('/api/projects/my-projects'); // ✅ 使用新端点
    // ...
  }
}
```

#### `components/creation/content/MyProjectsContent.tsx`
```typescript
const fetchProjects = async () => {
  try {
    setIsLoading(true);
    const response = await fetch('/api/projects/my-projects'); // ✅ 使用新端点
    // ...
  }
}
```

#### `components/ProjectGraphManager.tsx`
```typescript
const loadProjects = async () => {
  setLoading(true)
  try {
    const res = await fetch('/api/projects/my-projects', { // ✅ 使用新端点
      cache: 'no-store',
      // ...
    })
    // ...
  }
}
```

## 权限控制说明

### 首页（Homepage）
- **路由**: `/` 或 `/home`
- **API**: `GET /api/projects`
- **权限**: 无需登录，显示所有项目
- **用途**: 让所有用户（包括未登录用户）浏览所有项目

### Creation页面
- **路由**: `/creation`
- **API**: `GET /api/projects/my-projects`
- **权限**: 需要登录，只显示当前用户的项目
- **用途**: 用户管理自己的项目

## 修改后的行为

### 首页（使用 `/api/projects`）
- ✅ 显示所有项目（不管是谁创建的）
- ✅ 未登录用户也能浏览
- ✅ 可以看到项目的创建者（userId字段）

### Creation页面（使用 `/api/projects/my-projects`）
- ✅ 只显示当前用户创建的项目
- ✅ 需要登录才能访问
- ✅ 可以编辑/删除自己的项目

### 项目操作权限
- ✅ 创建项目：需要登录
- ✅ 查看项目：无需登录（首页）
- ✅ 编辑项目：只有所有者
- ✅ 删除项目：只有所有者

## Prisma Client类型错误

如果遇到类型错误（如 `userId does not exist in type 'projectWhereInput'`），需要：

1. **停止开发服务器**（如果正在运行）
2. **重新生成Prisma Client**:
   ```bash
   cd 3d-cloude
   npx prisma generate
   ```
3. **重启开发服务器**

### 常见的Prisma类型错误

- `userId does not exist in type 'projectWhereInput'` - Prisma Client未更新
- `graphs does not exist, did you mean 'graph'?` - 关系名称错误（应该是单数）
- `Property 'userId' does not exist` - Prisma Client未包含新字段

## 相关文件

### 修改的文件
- ✅ `app/api/projects/route.ts` - 修改GET方法，返回所有项目
- ✅ `app/api/projects/my-projects/route.ts` - 新建，返回当前用户的项目
- ✅ `components/creation/NewCreationWorkflowPage.tsx` - 使用新API端点
- ✅ `components/creation/content/MyProjectsContent.tsx` - 使用新API端点
- ✅ `components/ProjectGraphManager.tsx` - 使用新API端点

### 未修改的文件（继续使用 `/api/projects`）
- `components/ProjectList.tsx` - 首页项目列表，显示所有项目
- `app/text-page/page.tsx` - 文本页面，显示所有项目

## 总结

通过创建两个不同的API端点，我们实现了：
- ✅ 首页显示所有项目，让用户可以浏览和发现内容
- ✅ Creation页面只显示用户自己的项目，方便管理
- ✅ 权限控制在操作层面（创建、编辑、删除）而不是查看层面
- ✅ 符合原始需求规范中的要求
