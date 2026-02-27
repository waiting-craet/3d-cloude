import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return NextResponse.json(
      { error: '获取项目列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新项目和图谱
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

    if (!graphName || !graphName.trim()) {
      return NextResponse.json(
        { error: '图谱名称不能为空' },
        { status: 400 }
      );
    }

    // 使用事务创建项目和图谱
    const result = await prisma.$transaction(async (tx) => {
      // 创建项目
      const project = await tx.project.create({
        data: {
          name: name.trim(),
        },
      });

      // 在项目下创建图谱
      const graph = await tx.graph.create({
        data: {
          name: graphName.trim(),
          projectId: project.id,
        },
      });

      return { project, graph };
    });

    return NextResponse.json({
      success: true,
      project: result.project,
      graph: result.graph,
    });
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json(
      { error: '创建项目失败' },
      { status: 500 }
    );
  }
}
