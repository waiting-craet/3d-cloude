import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/gallery/graphs
 * 获取首页广场的图谱列表
 * 
 * 查询参数:
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 20）
 * - type: 筛选类型 (2d, 3d, template)
 * - sort: 排序方式 (latest, popular, trending)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const type = searchParams.get('type')
    const sort = searchParams.get('sort') || 'latest'

    // 验证分页参数
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: '无效的分页参数' },
        { status: 400 }
      )
    }

    // 构建查询条件
    const where: any = {}

    // 根据类型筛选
    if (type === '2d') {
      where.settings = {
        contains: '"graphType":"2d"',
      }
    } else if (type === '3d') {
      where.settings = {
        contains: '"graphType":"3d"',
      }
    } else if (type === 'template') {
      where.settings = {
        contains: '"isTemplate":true',
      }
    }

    // 计算总数
    const total = await prisma.graph.count({ where })

    // 构建排序条件
    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'popular') {
      orderBy = { nodeCount: 'desc' }
    } else if (sort === 'trending') {
      orderBy = { updatedAt: 'desc' }
    }

    // 获取图谱列表
    const graphs = await prisma.graph.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        nodes: {
          select: {
            id: true,
            imageUrl: true,
            coverUrl: true,
          },
          take: 1, // 只获取第一个节点的图片作为缩略图
        },
      },
    })

    // 转换为前端需要的格式
    const graphCards = graphs.map((graph) => {
      let graphType = '3d'
      let isTemplate = false
      let thumbnail = ''

      // 从 settings 中解析图谱类型和模板标记
      if (graph.settings) {
        try {
          const settings = JSON.parse(graph.settings)
          graphType = settings.graphType || '3d'
          isTemplate = settings.isTemplate || false
          thumbnail = settings.thumbnail || ''
        } catch (e) {
          // 如果 JSON 解析失败，使用默认值
        }
      }

      // 如果没有缩略图，尝试从节点的图片获取
      if (!thumbnail && graph.nodes.length > 0) {
        thumbnail = graph.nodes[0].imageUrl || graph.nodes[0].coverUrl || ''
      }

      return {
        id: graph.id,
        title: graph.name,
        description: graph.description || '',
        thumbnail,
        type: graphType as '2d' | '3d',
        isTemplate,
        creator: {
          id: graph.project.id,
          name: graph.project.name,
          email: '',
          avatar: '',
        },
        createdAt: graph.createdAt,
        updatedAt: graph.updatedAt,
        likes: 0,
        views: 0,
        tags: [],
        nodeCount: graph.nodeCount,
        edgeCount: graph.edgeCount,
      }
    })

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      success: true,
      data: {
        items: graphCards,
        total,
        page,
        pageSize,
        totalPages,
      },
    })
  } catch (error) {
    console.error('获取图谱列表失败:', error)
    return NextResponse.json(
      { error: '获取图谱列表失败' },
      { status: 500 }
    )
  }
}
