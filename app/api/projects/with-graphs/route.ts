import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/projects/with-graphs - 获取所有项目及其图谱（优化版）
 * 
 * 一次性返回所有项目和图谱，避免多次请求
 */
export async function GET() {
  try {
    // 一次性查询所有项目及其图谱
    const projects = await prisma.project.findMany({
      include: {
        graphs: {
          select: {
            id: true,
            name: true,
            projectId: true,
            createdAt: true,
            _count: {
              select: {
                nodes: true,
                edges: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 格式化数据
    const formattedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      graphs: project.graphs.map(graph => ({
        id: graph.id,
        name: graph.name,
        projectId: graph.projectId,
        nodeCount: graph._count.nodes,
        edgeCount: graph._count.edges,
        createdAt: graph.createdAt,
      })),
    }))

    return NextResponse.json({
      projects: formattedProjects,
    })
  } catch (error) {
    console.error('获取项目和图谱失败:', error)
    return NextResponse.json(
      { 
        error: '获取项目和图谱失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
