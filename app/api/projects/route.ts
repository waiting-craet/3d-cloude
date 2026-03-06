import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { retryOperation, getDescriptiveErrorMessage } from '@/lib/db-helpers';

// GET - 获取所有项目
export async function GET() {
  try {
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
      ...project,
      graphCount: project._count.graphs,
      _count: undefined,
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

// POST - 创建新项目，可选择是否创建图谱
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, graphName } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '项目名称不能为空' },
        { status: 400 }
      );
    }

    // 如果提供了graphName，验证其不为空
    if (graphName !== undefined && (!graphName || !graphName.trim())) {
      return NextResponse.json(
        { error: '图谱名称不能为空' },
        { status: 400 }
      );
    }

    // Wrap entire project creation logic in retryOperation with exponential backoff
    const result = await retryOperation(async () => {
      // Explicit connection health check to wake up paused Neon databases
      await prisma.$connect();

      // 使用事务创建项目，可选择创建图谱
      return await prisma.$transaction(async (tx) => {
        // 创建项目
        const project = await tx.project.create({
          data: {
            name: name.trim(),
          },
        });

        let graph = null;
        let graphCreationWarning = null;
        
        // 只有在提供graphName时才创建图谱
        if (graphName && graphName.trim()) {
          try {
            graph = await tx.graph.create({
              data: {
                name: graphName.trim(),
                projectId: project.id,
              },
            });
          } catch (graphError) {
            // 图谱创建失败，但项目创建成功
            console.warn('图谱创建失败，但项目创建成功:', graphError);
            graphCreationWarning = '项目创建成功，但图谱创建失败';
          }
        }

        return { project, graph, graphCreationWarning };
      });
    }, 3, 1000); // 3 retries, 1000ms initial delay

    // 构建响应，包含图谱创建状态元数据
    const response: any = {
      success: true,
      project: result.project,
      graphCreated: !!result.graph,
    };

    // 只有在创建了图谱时才包含graph字段
    if (result.graph) {
      response.graph = result.graph;
    }

    // 如果有图谱创建警告，添加到响应中
    if (result.graphCreationWarning) {
      response.warnings = [result.graphCreationWarning];
    }

    return NextResponse.json(response);
  } catch (error) {
    // Log detailed error information for diagnostics
    console.error('创建项目失败:', error);
    if (error instanceof Error) {
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }

    // Detect connection-specific errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isConnectionError = 
      errorMessage.toLowerCase().includes('connection') ||
      errorMessage.toLowerCase().includes('connect') ||
      errorMessage.toLowerCase().includes('econnrefused');

    // Use descriptive error message utility
    const descriptiveMessage = isConnectionError 
      ? '数据库连接失败，请稍后重试'
      : getDescriptiveErrorMessage(error);

    // Build error response with diagnostic metadata in development mode
    const errorResponse: any = { error: descriptiveMessage };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.diagnostics = {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        originalMessage: errorMessage,
        isConnectionError,
      };
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
