/**
 * 布局重置API端点
 * 
 * POST /api/graphs/[id]/reset-layout
 * 
 * 功能：
 * - 清除现有的3D布局
 * - 重新执行完整的2D到3D转换
 * - 支持指定新的布局策略
 * 
 * 验证需求: 12.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { retryOperation, getDescriptiveErrorMessage } from '@/lib/db-helpers';
import { LayoutEngine } from '@/lib/layout/LayoutEngine';
import type { Node2D, Node3D, Edge, LayoutStrategy } from '@/lib/layout/types';

interface ResetLayoutRequestBody {
  strategy?: LayoutStrategy;
}

interface ResetLayoutResponse {
  success: boolean;
  nodes?: Node3D[];
  strategy?: LayoutStrategy;
  processingTime?: number;
  error?: string;
  details?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ResetLayoutResponse>> {
  const startTime = Date.now();
  const graphId = params.id;

  try {
    if (!graphId || typeof graphId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid graphId'
        },
        { status: 400 }
      );
    }

    const body: ResetLayoutRequestBody = await request.json().catch(() => ({}));
    const { strategy } = body;

    console.log(`[Reset-Layout] Resetting layout for graph ${graphId}`);
    console.log(`[Reset-Layout] Strategy: ${strategy || 'auto'}`);

    // 加载图谱数据
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

      const edges = await prisma.edge.findMany({
        where: { 
          fromNode: { graphId },
          toNode: { graphId }
        },
        select: {
          id: true,
          fromNodeId: true,
          toNodeId: true,
          weight: true
        }
      });

      return { graph, nodes, edges };
    }, 3, 1000);

    const { nodes: dbNodes, edges: dbEdges } = graphData;

    // 转换数据格式
    const nodes2D: Node2D[] = dbNodes.map(node => ({
      id: node.id,
      x2d: node.x,
      y2d: node.y,
      label: node.name
    }));

    const edges: Edge[] = dbEdges.map(edge => ({
      id: edge.id,
      source: edge.fromNodeId,
      target: edge.toNodeId,
      weight: edge.weight
    }));

    // 执行转换
    const engine = new LayoutEngine();
    const { nodes: nodes3D } = await engine.convert3D(nodes2D, edges, strategy);

    // 保存布局
    await retryOperation(async () => {
      await saveLayoutToDatabase(graphId, nodes3D);
    }, 3, 1000);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      nodes: nodes3D,
      strategy: strategy || 'auto',
      processingTime
    });

  } catch (error) {
    console.error('[Reset-Layout] Error:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNotFound = errorMessage.includes('not found');

    return NextResponse.json(
      {
        success: false,
        error: isNotFound ? 'Graph not found' : getDescriptiveErrorMessage(error),
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: isNotFound ? 404 : 500 }
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
