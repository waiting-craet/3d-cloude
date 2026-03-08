import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { del, list } from '@vercel/blob';
import { getCurrentUserId, verifyGraphOwnership } from '@/lib/auth';

// 使用 Node.js Runtime
export const runtime = 'nodejs';

// 类型定义
export interface BatchDeleteGraphsRequest {
  graphIds: string[];
}

export interface GraphDeleteResult {
  graphId: string;
  graphName: string;
  success: boolean;
  error?: string;
  deletedCounts?: {
    nodes: number;
    edges: number;
    files: number;
  };
}

export interface BatchDeleteGraphsResponse {
  success: boolean;
  results: GraphDeleteResult[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
  deletedNodeCount: number;
  deletedEdgeCount: number;
}

// POST - 批量删除图谱
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
    const { graphIds } = body as BatchDeleteGraphsRequest;

    // 请求验证逻辑
    if (!Array.isArray(graphIds) || graphIds.length === 0) {
      return NextResponse.json(
        { error: '无效的请求参数：图谱ID数组不能为空' },
        { status: 400 }
      );
    }

    // 验证每个ID格式
    const invalidIds = graphIds.filter(id => !id || typeof id !== 'string');
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: '无效的图谱ID格式' },
        { status: 400 }
      );
    }

    console.log('[BatchDeleteGraphs] 开始批量删除:', {
      timestamp: new Date().toISOString(),
      graphIds,
      count: graphIds.length,
      userId,
    });

    // 批量删除主逻辑 - 使用 Promise.allSettled 并行处理
    const deletePromises = graphIds.map(graphId => 
      deleteGraph(graphId, userId)
    );

    const results = await Promise.allSettled(deletePromises);

    // 处理结果
    const graphResults: GraphDeleteResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // 处理失败的情况
        return {
          graphId: graphIds[index],
          graphName: 'Unknown',
          success: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      }
    });

    // 生成摘要
    const summary = {
      total: graphIds.length,
      succeeded: graphResults.filter(r => r.success).length,
      failed: graphResults.filter(r => !r.success).length,
    };

    // 计算总删除数量
    const deletedNodeCount = graphResults
      .filter(r => r.success && r.deletedCounts)
      .reduce((sum, r) => sum + (r.deletedCounts?.nodes || 0), 0);
    
    const deletedEdgeCount = graphResults
      .filter(r => r.success && r.deletedCounts)
      .reduce((sum, r) => sum + (r.deletedCounts?.edges || 0), 0);

    console.log('[BatchDeleteGraphs] 批量删除完成:', {
      timestamp: new Date().toISOString(),
      summary,
      deletedNodeCount,
      deletedEdgeCount,
    });

    const response: BatchDeleteGraphsResponse = {
      success: summary.failed === 0,
      results: graphResults,
      summary,
      deletedNodeCount,
      deletedEdgeCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    // 错误处理和日志记录
    console.error('[BatchDeleteGraphs] 批量删除失败:', {
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
 * 删除单个图谱
 * 使用 Prisma 事务确保数据完整性
 */
async function deleteGraph(graphId: string, userId: string): Promise<GraphDeleteResult> {
  try {
    console.log(`[BatchDeleteGraphs] 开始删除图谱: ${graphId}`);

    // 验证图谱所有权
    const isOwner = await verifyGraphOwnership({ graphId, userId });
    if (!isOwner) {
      return {
        graphId,
        graphName: 'Unknown',
        success: false,
        error: '无权限操作此图谱',
      };
    }

    // 查询图谱及其关联数据
    const graph = await prisma.graph.findUnique({
      where: { id: graphId },
      include: {
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

    if (!graph) {
      return {
        graphId,
        graphName: 'Unknown',
        success: false,
        error: '图谱不存在',
      };
    }

    const graphName = graph.name;
    const nodeCount = graph.nodes.length;
    const edgeCount = graph.edges.length;

    console.log(`[BatchDeleteGraphs] 图谱 ${graphName} (${graphId}): ${nodeCount} 个节点, ${edgeCount} 条边`);

    // 收集需要删除的 Blob URL
    const blobUrls: string[] = [];
    graph.nodes.forEach(node => {
      if (node.imageUrl) blobUrls.push(node.imageUrl);
      if (node.iconUrl) blobUrls.push(node.iconUrl);
      if (node.coverUrl) blobUrls.push(node.coverUrl);
      if (node.videoUrl) blobUrls.push(node.videoUrl);
    });

    // 使用事务删除图谱（级联删除关联数据）
    await prisma.$transaction(async (tx) => {
      await tx.graph.delete({
        where: { id: graphId },
      });
    });

    console.log(`[BatchDeleteGraphs] 图谱 ${graphName} 已从数据库删除`);

    // 删除 Blob 文件（失败不阻止数据库删除）
    let deletedFileCount = 0;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        // 尝试批量删除图谱文件夹
        const blobs = await list({ prefix: `graphs/${graphId}/` });
        if (blobs.blobs.length > 0) {
          await Promise.all(blobs.blobs.map(blob => del(blob.url)));
          deletedFileCount += blobs.blobs.length;
        }

        // 删除单独的文件
        if (blobUrls.length > 0) {
          const deleteResults = await Promise.allSettled(
            blobUrls.map(url => del(url))
          );
          
          deleteResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              deletedFileCount++;
            } else {
              console.warn(`[BatchDeleteGraphs] Blob 删除失败: ${blobUrls[index]}`, result.reason);
            }
          });
        }

        console.log(`[BatchDeleteGraphs] 图谱 ${graphName} 已删除 ${deletedFileCount} 个 Blob 文件`);
      } catch (error) {
        console.warn(`[BatchDeleteGraphs] 图谱 ${graphName} Blob 删除时出错:`, error);
        // 不阻止主流程，继续返回成功
      }
    }

    return {
      graphId,
      graphName,
      success: true,
      deletedCounts: {
        nodes: nodeCount,
        edges: edgeCount,
        files: deletedFileCount,
      },
    };
  } catch (error) {
    console.error(`[BatchDeleteGraphs] 删除图谱 ${graphId} 失败:`, {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 检查是否是 Prisma 错误
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2025') {
        return {
          graphId,
          graphName: 'Unknown',
          success: false,
          error: '图谱不存在',
        };
      }
    }

    return {
      graphId,
      graphName: 'Unknown',
      success: false,
      error: error instanceof Error ? error.message : '删除失败',
    };
  }
}
