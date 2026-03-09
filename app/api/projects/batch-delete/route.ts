import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteFiles, deleteDirectory } from '@/lib/local-storage';
import { getCurrentUserId, verifyProjectOwnership } from '@/lib/auth';

// 使用 Node.js Runtime
export const runtime = 'nodejs';

// 类型定义
export interface BatchDeleteRequest {
  projectIds: string[];
}

export interface ProjectDeleteResult {
  projectId: string;
  projectName: string;
  success: boolean;
  error?: string;
  deletedCounts?: {
    graph: number;
    nodes: number;
    edges: number;
    files: number;
  };
}

export interface BatchDeleteResponse {
  success: boolean;
  results: ProjectDeleteResult[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

// POST - 批量删除项目
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const userId = await getCurrentUserId(request, { required: true });
    if (!userId) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectIds } = body as BatchDeleteRequest;

    // 任务 3.2: 请求验证逻辑
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { error: '无效的请求参数：项目ID数组不能为空' },
        { status: 400 }
      );
    }

    // 验证每个ID格式
    const invalidIds = projectIds.filter(id => !id || typeof id !== 'string');
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: '无效的项目ID格式' },
        { status: 400 }
      );
    }

    console.log('[BatchDelete] 开始批量删除:', {
      timestamp: new Date().toISOString(),
      projectIds,
      count: projectIds.length,
      userId,
    });

    // 任务 3.5: 批量删除主逻辑 - 使用 Promise.allSettled 并行处理
    const deletePromises = projectIds.map(projectId => 
      deleteProject(projectId, userId)
    );

    const results = await Promise.allSettled(deletePromises);

    // 处理结果
    const projectResults: ProjectDeleteResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // 处理失败的情况
        return {
          projectId: projectIds[index],
          projectName: 'Unknown',
          success: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      }
    });

    // 生成摘要
    const summary = {
      total: projectIds.length,
      succeeded: projectResults.filter(r => r.success).length,
      failed: projectResults.filter(r => !r.success).length,
    };

    console.log('[BatchDelete] 批量删除完成:', {
      timestamp: new Date().toISOString(),
      summary,
    });

    const response: BatchDeleteResponse = {
      success: summary.failed === 0,
      results: projectResults,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    // 任务 3.6: 错误处理和日志记录
    console.error('[BatchDelete] 批量删除失败:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: '批量删除操作失败' },
      { status: 500 }
    );
  }
}

/**
 * 任务 3.3: 删除单个项目
 * 使用 Prisma 事务确保数据完整性
 */
async function deleteProject(projectId: string, userId: string): Promise<ProjectDeleteResult> {
  try {
    console.log(`[BatchDelete] 开始删除项目: ${projectId}`);

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

    // 查询项目及其关联数据
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
    graphs: {
          select: { id: true, name: true },
        },
        nodes: {
          select: {
            id: true,
            imageUrl: true,
            iconUrl: true,
            coverUrl: true,
            videoUrl: true,
          },
        },
        edges: {
          select: { id: true },
        },
      },
    });

    if (!project) {
      return {
        projectId,
        projectName: 'Unknown',
        success: false,
        error: '项目不存在',
      };
    }

    const projectName = project.name;
    const graphCount = project.graphs.length;
    const nodeCount = project.nodes.length;
    const edgeCount = project.edges.length;

    console.log(`[BatchDelete] 项目 ${projectName} (${projectId}): ${graphCount} 个图谱, ${nodeCount} 个节点, ${edgeCount} 条边`);

    // 任务 3.4: 收集需要删除的 Blob URL
    const blobUrls: string[] = [];
    project.nodes.forEach(node => {
      if (node.imageUrl) blobUrls.push(node.imageUrl);
      if (node.iconUrl) blobUrls.push(node.iconUrl);
      if (node.coverUrl) blobUrls.push(node.coverUrl);
      if (node.videoUrl) blobUrls.push(node.videoUrl);
    });

    // 使用事务删除项目（级联删除关联数据）
    await prisma.$transaction(async (tx) => {
      await tx.project.delete({
        where: { id: projectId },
      });
    });

    console.log(`[BatchDelete] 项目 ${projectName} 已从数据库删除`);

    let deletedFileCount = 0;
    try {
      await deleteDirectory(`projects/${projectId}`);
      if (blobUrls.length > 0) {
        deletedFileCount = await deleteFiles(blobUrls);
      }
    } catch (error) {
      console.warn(`[BatchDelete] 项目 ${projectName} 文件删除时出错:`, error);
    }

    return {
      projectId,
      projectName,
      success: true,
      deletedCounts: {
        graph: graphCount,
        nodes: nodeCount,
        edges: edgeCount,
        files: deletedFileCount,
      },
    };
  } catch (error) {
    console.error(`[BatchDelete] 删除项目 ${projectId} 失败:`, {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 检查是否是 Prisma 错误
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2025') {
        return {
          projectId,
          projectName: 'Unknown',
          success: false,
          error: '项目不存在',
        };
      }
    }

    return {
      projectId,
      projectName: 'Unknown',
      success: false,
      error: error instanceof Error ? error.message : '删除失败',
    };
  }
}
