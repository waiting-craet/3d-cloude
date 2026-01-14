import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 使用 Node.js Runtime
export const runtime = 'nodejs'

/**
 * GET /api/projects/with-graphs - 获取所有项目及其图谱（优化版）
 * 
 * 一次性返回所有项目和图谱，避免多次请求
 */
export async function GET() {
  try {
    console.log('📊 [with-graphs] 开始查询项目和图谱...')
    
    // 检查数据库连接
    if (!process.env.DATABASE_URL) {
      console.error('❌ [with-graphs] DATABASE_URL 未设置')
      return NextResponse.json(
        { 
          error: 'DATABASE_URL 环境变量未设置',
          details: '请在 Vercel 中配置 DATABASE_URL 环境变量'
        },
        { status: 500 }
      )
    }
    
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

    console.log(`✅ [with-graphs] 查询成功，找到 ${projects.length} 个项目`)

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
    console.error('❌ [with-graphs] 获取项目和图谱失败:', error)
    return NextResponse.json(
      { 
        error: '获取项目和图谱失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
