import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'

// 使用 Node.js Runtime
export const runtime = 'nodejs'

/**
 * GET /api/projects/with-graphs - 获取当前用户的所有项目及其图谱（优化版）
 * 
 * 一次性返回所有项目和图谱，避免多次请求
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 [with-graphs] 开始查询项目和图谱...')
    
    // 获取当前用户ID
    const userId = await getCurrentUserId(request, { required: false });
    
    // 如果用户未登录，返回空列表
    if (!userId) {
      console.log('⚠️ [with-graphs] 用户未登录，返回空列表')
      return NextResponse.json({ projects: [] });
    }
    
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
    
    // 一次性查询当前用户的所有项目及其图谱
    const projects = await prisma.project.findMany({
      where: {
        userId: userId, // 只返回当前用户的项目
      },
      select: {
        id: true,
        name: true,
        description: true,
        userId: true,
        coverUrl: true,
        createdAt: true,
        updatedAt: true,
        graphs: {
          select: {
            id: true,
            name: true,
            projectId: true,
            coverUrl: true,
            createdAt: true,
            updatedAt: true,
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
      description: project.description,
      userId: project.userId,
      coverUrl: project.coverUrl,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      graphs: project.graphs.map(graph => ({
        id: graph.id,
        name: graph.name,
        projectId: graph.projectId,
        coverUrl: graph.coverUrl,
        createdAt: graph.createdAt,
        updatedAt: graph.updatedAt,
        nodeCount: graph._count.nodes,
        edgeCount: graph._count.edges,
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
