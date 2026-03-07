import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { retryOperation, getDescriptiveErrorMessage } from '@/lib/db-helpers';
import { getCurrentUserId } from '@/lib/auth';

// GET - 获取当前用户的项目列表
export async function GET(request: NextRequest) {
  try {
    // 获取当前用户ID
    const userId = await getCurrentUserId(request, { required: false });
    
    // 如果用户未登录，返回空列表
    if (!userId) {
      return NextResponse.json({ projects: [] });
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
    console.error('获取项目列表失败:', error);
    return NextResponse.json(
      { error: '获取项目列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新项目，自动关联当前用户
export async function POST(request: NextRequest) {
  try {
    // 获取当前用户ID（必须登录）
    const userId = await getCurrentUserId(request, { required: true });
    
    if (!userId) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      );
    }

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
        // 创建项目并关联当前用户
        const project = await tx.project.create({
          data: {
            name: name.trim(),
            userId: userId, // 关联当前用户
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
