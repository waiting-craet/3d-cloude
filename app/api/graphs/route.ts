import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST - 在现有项目中创建图谱
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name } = body;

    if (!projectId || !projectId.trim()) {
      return NextResponse.json(
        { error: '项目ID不能为空' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '图谱名称不能为空' },
        { status: 400 }
      );
    }

    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    // 创建图谱
    const graph = await prisma.graph.create({
      data: {
        name: name.trim(),
        projectId: projectId,
      },
    });

    return NextResponse.json({
      success: true,
      graph,
    });
  } catch (error) {
    console.error('创建图谱失败:', error);
    return NextResponse.json(
      { error: '创建图谱失败' },
      { status: 500 }
    );
  }
}
