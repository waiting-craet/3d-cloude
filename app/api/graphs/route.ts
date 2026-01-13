import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 使用 Node.js Runtime
export const runtime = 'nodejs'

/**
 * GET /api/graphs - 获取所有图谱
 * 查询参数: projectId (可选) - 筛选特定项目的图谱
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    const graphs = await prisma.graph.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            nodes: true,
            edges: true,
          },
        },
      },
    })
    
    // 将 _count 转换为 nodeCount 和 edgeCount
    const graphsWithCounts = graphs.map(graph => ({
      ...graph,
      nodeCount: graph._count.nodes,
      edgeCount: graph._count.edges,
      _count: undefined,
    }))
    
    return NextResponse.json({ graphs: graphsWithCounts })
  } catch (error) {
    console.error('获取图谱列表失败:', error)
    return NextResponse.json(
      { 
        error: '获取图谱列表失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/graphs - 创建新图谱
 * 请求体: { name: string, description?: string, projectId: string, isPublic?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, projectId, isPublic } = body
    
    // 验证必填字段
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: '图谱名称为必填项' },
        { status: 400 }
      )
    }
    
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: '项目ID为必填项' },
        { status: 400 }
      )
    }
    
    // 验证名称不是纯空白字符
    if (name.trim().length === 0) {
      return NextResponse.json(
        { error: '图谱名称不能为空' },
        { status: 400 }
      )
    }
    
    // 验证项目存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })
    
    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }
    
    // 创建图谱
    const graph = await prisma.graph.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        projectId,
        isPublic: isPublic ?? false,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
    
    return NextResponse.json({ graph }, { status: 201 })
  } catch (error) {
    console.error('创建图谱失败:', error)
    return NextResponse.json(
      { 
        error: '创建图谱失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
