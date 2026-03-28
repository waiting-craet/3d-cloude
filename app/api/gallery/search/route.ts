import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/gallery/search
 * 搜索图谱、用户和标签
 * 
 * 查询参数:
 * - q: 搜索关键词（必需）
 * - limit: 返回结果数量（默认 10）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    // 验证查询参数
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: '搜索关键词不能为空' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: '无效的 limit 参数' },
        { status: 400 }
      )
    }

    const searchTerm = query.toLowerCase()

    // 搜索图谱
    const graphs = await prisma.graph.findMany({
      where: {
        AND: [
          { isPublic: true },
          {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: limit,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // 搜索项目（作为用户）
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit,
    })

    // 构建搜索建议
    const suggestions = [
      ...graph.map((graph) => ({
        id: graph.id,
        type: 'graph' as const,
        title: graph.name,
        description: graph.description || '',
        icon: '📊',
      })),
      ...projects.map((project) => ({
        id: project.id,
        type: 'user' as const,
        title: project.name,
        description: project.description || '',
        icon: '👤',
      })),
    ]

    return NextResponse.json({
      success: true,
      data: suggestions.slice(0, limit),
    })
  } catch (error) {
    console.error('搜索失败:', error)
    return NextResponse.json(
      { error: '搜索失败' },
      { status: 500 }
    )
  }
}
