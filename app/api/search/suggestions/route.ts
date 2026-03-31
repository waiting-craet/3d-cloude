import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '5', 10)

    if (!query || query.trim().length < 1) {
      return NextResponse.json({
        query: '',
        suggestions: [],
      })
    }

    const trimmedQuery = query.trim()
    const suggestions = await getSearchSuggestions(trimmedQuery, limit)

    return NextResponse.json({
      query: trimmedQuery,
      suggestions,
    })
  } catch (error) {
    console.error('获取搜索建议失败:', error)
    return NextResponse.json(
      { error: '获取搜索建议失败', suggestions: [] },
      { status: 500 }
    )
  }
}

async function getSearchSuggestions(query: string, limit: number) {
  const suggestions: Array<{
    id: string
    type: 'project' | 'graph'
    name: string
    description?: string | null
    projectName?: string
    projectId?: string
    nodeCount: number
    edgeCount: number
  }> = []

  const projectLimit = Math.ceil(limit / 2)
  const graphLimit = Math.ceil(limit / 2)

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      nodeCount: true,
      edgeCount: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: projectLimit,
  })

  for (const project of projects) {
    suggestions.push({
      id: project.id,
      type: 'project',
      name: project.name,
      description: project.description,
      nodeCount: project.nodeCount,
      edgeCount: project.edgeCount,
    })
  }

  const graphs = await prisma.graph.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      nodeCount: true,
      edgeCount: true,
      projectId: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: graphLimit,
  })

  for (const graph of graphs) {
    suggestions.push({
      id: graph.id,
      type: 'graph',
      name: graph.name,
      description: graph.description,
      projectName: graph.project.name,
      projectId: graph.projectId || undefined,
      nodeCount: graph.nodeCount,
      edgeCount: graph.edgeCount,
    })
  }

  return suggestions.slice(0, limit)
}
