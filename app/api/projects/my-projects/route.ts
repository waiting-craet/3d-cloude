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
        coverUrl: true,
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
      coverUrl: project.coverUrl,
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
