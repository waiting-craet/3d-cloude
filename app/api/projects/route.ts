import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取所有项目
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        graphs: true,
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('获取项目失败:', error);
    return NextResponse.json(
      { error: '获取项目失败' },
      { status: 500 }
    );
  }
}

// 创建新项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { graphName, graphType } = body;

    if (!graphName) {
      return NextResponse.json(
        { error: '图谱名称不能为空' },
        { status: 400 }
      );
    }

    if (!graphType || !['2d', '3d'].includes(graphType)) {
      return NextResponse.json(
        { error: '图谱类型必须为 2d 或 3d' },
        { status: 400 }
      );
    }

    // 创建项目
    const project = await prisma.project.create({
      data: {
        name: graphName,
        description: `${graphType.toUpperCase()}知识图谱`,
        graphs: {
          create: {
            name: graphName,
            description: `${graphName}的${graphType === '2d' ? '二维' : '三维'}知识图谱`,
            settings: JSON.stringify({ graphType }),
          },
        },
      },
      include: {
        graphs: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json(
      { error: '创建项目失败' },
      { status: 500 }
    );
  }
}
