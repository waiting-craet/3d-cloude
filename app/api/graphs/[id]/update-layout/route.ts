/**
 * 增量布局更新API端点
 * 
 * POST /api/graphs/[id]/update-layout
 * 
 * 功能：
 * - 加载现有的3D布局
 * - 处理新增节点和删除节点
 * - 使用LayoutEngine.incrementalUpdate执行增量更新
 * - 保持现有节点位置稳定性
 * - 返回更新结果和质量变化
 * 
 * 验证需求: 11.1-11.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { retryOperation, getDescriptiveErrorMessage } from '@/lib/db-helpers';
import { LayoutEngine } from '@/lib/layout/LayoutEngine';
import type { Node2D, Node3D, Edge } from '@/lib/layout/types';

/**
 * 请求体接口
 */
interface UpdateLayoutRequestBody {
  newNodes?: Node2D[];
  deletedNodeIds?: string[];
}

/**
 * 响应接口
 */
interface UpdateLayoutResponse {
  success: boolean;
  nodes?: Node3D[];
  qualityChange?: number;
  shouldReLayout?: boolean;
  processingTime?: number;
  error?: string;
  details?: string;
}

/**
 * POST /api/graphs/[id]/update-layout
 * 
 * 增量更新图谱布局
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<UpdateLayoutResponse>> {
  const startTime = Date.now();
  const graphId = params.id;

  try {
    // 步骤1: 验证graphId
    if (!graphId || typeof graphId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid graphId',
          details: 'graphId must be a non-empty string'
        },
        { status: 400 }
      );
    }

    // 步骤2: 解析请求体
    const body: UpdateLayoutRequestBody = await request.json();
    const { newNodes = [], deletedNodeIds = [] } = body;

    console.log(`[Update-Layout] Starting incremental update for graph ${graphId}`);
    console.log(`[Update-Layout] New nodes: ${newNodes.length}, Deleted nodes: ${deletedNodeIds.length}`);

    // 步骤3: 从数据库加载现有布局
    const graphData = await retryOperation(async () => {
      await prisma.$connect();

      const graph = await prisma.graph.findUnique({
        where: { id: graphId },
        select: { id: true, name: true }
      });

      if (!graph) {
        throw new Error(`Graph not found: ${graphId}`);
      }

      const nodes = await prisma.node.findMany({
        where: { graphId },
        select: {
          id: true,
          name: true,
          x: true,
          y: true,
          z: true
        }
      });

      return { graph, nodes };
    }, 3, 1000);

    const { nodes: dbNodes } = graphData;

    // 步骤4: 转换为3D节点格式
    const existingNodes: Node3D[] = dbNodes.map(node => ({
      id: node.id,
      x2d: node.x,
      y2d: node.y,
      x3d: node.x,
      y3d: node.y,
      z3d: node.z,
      label: node.name
    }));

    // 步骤5: 执行增量更新（带超时）
    const updatePromise = (async () => {
      const engine = new LayoutEngine();
      return await engine.incrementalUpdate(existingNodes, newNodes, deletedNodeIds);
    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Update timeout after 15 seconds')), 15000);
    });

    const result = await Promise.race([updatePromise, timeoutPromise]);

    console.log(`[Update-Layout] Update completed, quality change: ${result.qualityChange}`);
    console.log(`[Update-Layout] Should re-layout: ${result.shouldReLayout}`);

    // 步骤6: 保存更新后的布局
    await retryOperation(async () => {
      await saveLayoutToDatabase(graphId, result.nodes);
    }, 3, 1000);

    // 步骤7: 返回响应
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      nodes: result.nodes,
      qualityChange: result.qualityChange,
      shouldReLayout: result.shouldReLayout,
      processingTime
    });

  } catch (error) {
    console.error('[Update-Layout] Error:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('timeout');
    const isNotFound = errorMessage.includes('not found');

    let statusCode = 500;
    if (isNotFound) statusCode = 404;
    else if (isTimeout) statusCode = 504;

    return NextResponse.json(
      {
        success: false,
        error: isTimeout 
          ? 'Update timeout'
          : isNotFound
          ? 'Graph not found'
          : getDescriptiveErrorMessage(error),
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: statusCode }
    );
  }
}

async function saveLayoutToDatabase(
  graphId: string,
  nodes: Node3D[],
  batchSize: number = 15
): Promise<void> {
  for (let i = 0; i < nodes.length; i += batchSize) {
    const batch = nodes.slice(i, i + batchSize);
    
    await prisma.$transaction(
      batch.map(node =>
        prisma.node.update({
          where: { id: node.id },
          data: {
            x: node.x3d,
            y: node.y3d,
            z: node.z3d,
            updatedAt: new Date()
          }
        })
      )
    );

    if (i + batchSize < nodes.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
