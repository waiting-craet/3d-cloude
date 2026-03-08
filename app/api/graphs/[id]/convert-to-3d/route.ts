/**
 * 2D到3D图谱转换API端点
 * 
 * POST /api/graphs/[id]/convert-to-3d
 * 
 * 功能：
 * - 从数据库加载2D节点和边数据
 * - 使用LayoutEngine执行2D到3D转换
 * - 将3D坐标保存回数据库
 * - 返回转换结果和质量指标
 * 
 * 注意：
 * - 当前实现使用现有的x/y/z字段存储3D坐标
 * - 要使用完整的2D/3D坐标分离功能，需要先运行数据库迁移：
 *   migrations/001_add_3d_layout_fields.sql
 * - 迁移后将支持：x2d/y2d（原始2D坐标）和x3d/y3d/z3d（转换后的3D坐标）
 * 
 * 验证需求: 1.1-6.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { retryOperation, getDescriptiveErrorMessage } from '@/lib/db-helpers';
import { LayoutEngine } from '@/lib/layout/LayoutEngine';
import { LayoutDiagnostics } from '@/lib/layout/LayoutDiagnostics';
import type { 
  Node2D, 
  Node3D, 
  Edge, 
  LayoutStrategy, 
  LayoutConfig,
  LayoutQualityMetrics 
} from '@/lib/layout/types';
import type { PerformanceMetrics } from '@/lib/layout/PerformanceMonitor';

/**
 * 请求体接口
 */
interface ConvertTo3DRequestBody {
  strategy?: LayoutStrategy;
  config?: Partial<LayoutConfig>;
}

/**
 * 响应接口
 */
interface ConvertTo3DResponse {
  success: boolean;
  nodes?: Node3D[];
  qualityMetrics?: LayoutQualityMetrics;
  performanceMetrics?: PerformanceMetrics;
  strategy?: LayoutStrategy;
  processingTime?: number;
  error?: string;
  details?: string;
}

/**
 * POST /api/graphs/[id]/convert-to-3d
 * 
 * 将指定图谱的2D节点转换为3D布局
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ConvertTo3DResponse>> {
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
    let requestBody: ConvertTo3DRequestBody = {};
    try {
      const body = await request.json();
      requestBody = body;
    } catch (error) {
      // 如果没有请求体或解析失败，使用默认值
      console.log('No request body or invalid JSON, using defaults');
    }

    const { strategy, config } = requestBody;

    console.log(`[Convert-to-3D] Starting conversion for graph ${graphId}`);
    console.log(`[Convert-to-3D] Strategy: ${strategy || 'auto'}`);
    console.log(`[Convert-to-3D] Config:`, config);

    // 步骤3: 从数据库加载图谱数据（带重试机制）
    const graphData = await retryOperation(async () => {
      // 确保数据库连接
      await prisma.$connect();

      // 验证图谱是否存在
      const graph = await prisma.graph.findUnique({
        where: { id: graphId },
        select: { id: true, name: true }
      });

      if (!graph) {
        throw new Error(`Graph not found: ${graphId}`);
      }

      // 加载节点数据
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

      // 加载边数据
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

    const { graph, nodes: dbNodes, edges: dbEdges } = graphData;

    console.log(`[Convert-to-3D] Loaded ${dbNodes.length} nodes and ${dbEdges.length} edges`);

    // 步骤4: 验证数据
    if (dbNodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No nodes found',
          details: `Graph ${graphId} has no nodes to convert`
        },
        { status: 400 }
      );
    }

    // 步骤5: 转换数据格式为LayoutEngine所需格式
    const nodes2D: Node2D[] = dbNodes.map(node => ({
      id: node.id,
      // 使用现有的x/y坐标作为2D坐标
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

    // 步骤6: 执行转换（带超时机制和进度回调）
    const conversionPromise = (async () => {
      const engine = new LayoutEngine(config);
      
      // Progress callback for logging
      const onProgress = (progress: number, message: string) => {
        console.log(`[Convert-to-3D] Progress: ${progress}% - ${message}`);
      };
      
      const result = await engine.convert3D(nodes2D, edges, strategy, onProgress);
      const qualityMetrics = engine.calculateQualityMetrics(result.nodes, edges);
      const usedStrategy = strategy || 'auto';

      return { 
        nodes3D: result.nodes, 
        performanceMetrics: result.performanceMetrics,
        qualityMetrics, 
        usedStrategy 
      };
    })();

    // 30秒超时
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Conversion timeout after 30 seconds')), 30000);
    });

    const { nodes3D, performanceMetrics, qualityMetrics, usedStrategy } = await Promise.race([
      conversionPromise,
      timeoutPromise
    ]);

    console.log(`[Convert-to-3D] Conversion completed, quality score: ${qualityMetrics.qualityScore}`);
    console.log(`[Convert-to-3D] Performance: ${performanceMetrics.totalTime}ms total`);

    // 生成并打印诊断报告
    const diagnosticReport = LayoutDiagnostics.generateReport(
      nodes3D,
      edges,
      qualityMetrics,
      config?.minNodeDistance || 5
    );
    LayoutDiagnostics.printReport(diagnosticReport);

    // 步骤7: 保存3D坐标到数据库（带重试和批处理）
    await retryOperation(async () => {
      await saveLayoutToDatabase(graphId, nodes3D, config?.batchSize || 15, config?.batchDelay || 100);
    }, 3, 1000);

    console.log(`[Convert-to-3D] Layout saved to database`);

    // 步骤8: 返回成功响应
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      nodes: nodes3D,
      qualityMetrics,
      performanceMetrics,
      strategy: usedStrategy as LayoutStrategy,
      processingTime
    });

  } catch (error) {
    // 错误处理
    console.error('[Convert-to-3D] Error:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('timeout');
    const isNotFound = errorMessage.includes('not found');
    const isConnectionError = 
      errorMessage.toLowerCase().includes('connection') ||
      errorMessage.toLowerCase().includes('connect');

    // 确定HTTP状态码
    let statusCode = 500;
    if (isNotFound) {
      statusCode = 404;
    } else if (isTimeout) {
      statusCode = 504;
    } else if (isConnectionError) {
      statusCode = 503;
    }

    // 构建错误响应
    const errorResponse: ConvertTo3DResponse = {
      success: false,
      error: isTimeout 
        ? 'Conversion timeout: The graph is too large or complex'
        : isNotFound
        ? 'Graph not found'
        : isConnectionError
        ? 'Database connection error'
        : getDescriptiveErrorMessage(error),
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * 将布局保存到数据库（批处理）
 * 
 * @param graphId 图谱ID
 * @param nodes 3D节点列表
 * @param batchSize 批处理大小
 * @param batchDelay 批次延迟（毫秒）
 */
async function saveLayoutToDatabase(
  graphId: string,
  nodes: Node3D[],
  batchSize: number = 15,
  batchDelay: number = 100
): Promise<void> {
  console.log(`[Save-Layout] Saving ${nodes.length} nodes in batches of ${batchSize}`);

  // 分批处理
  for (let i = 0; i < nodes.length; i += batchSize) {
    const batch = nodes.slice(i, i + batchSize);
    
    try {
      // 使用事务更新一批节点
      await prisma.$transaction(
        batch.map(node =>
          prisma.node.update({
            where: { id: node.id },
            data: {
              // 更新x, y, z坐标为3D坐标
              x: node.x3d,
              y: node.y3d,
              z: node.z3d,
              // 更新时间戳
              updatedAt: new Date()
            }
          })
        )
      );

      console.log(`[Save-Layout] Saved batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(nodes.length / batchSize)}`);

      // 批次之间延迟
      if (i + batchSize < nodes.length) {
        await delay(batchDelay);
      }
    } catch (error) {
      console.error(`[Save-Layout] Failed to save batch starting at index ${i}:`, error);
      throw error;
    }
  }

  console.log(`[Save-Layout] All batches saved successfully`);
}

/**
 * 延迟函数
 * 
 * @param ms 延迟毫秒数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
