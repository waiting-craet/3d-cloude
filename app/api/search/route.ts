import { NextRequest, NextResponse } from 'next/server'
import { searchNodes } from '@/lib/db-helpers'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type')
    const fuzzy = searchParams.get('fuzzy') === 'true'
    
    if (!query) {
      return NextResponse.json(
        { error: '搜索关键词不能为空' },
        { status: 400 }
      )
    }

    if (type === 'projects' || !type) {
      const results = await searchProjectsAndGraphs(query, fuzzy)
      
      if (results.length > 0) {
        await prisma.searchHistory.create({
          data: {
            query,
            results: JSON.stringify(results.slice(0, 10).map(r => ({ type: r.type, id: r.projectId }))),
          },
        }).catch(() => {})
      }
      
      return NextResponse.json({
        query,
        count: results.length,
        results,
        fuzzy,
      })
    }
    
    const results = await searchNodes(query)
    
    await prisma.searchHistory.create({
      data: {
        query,
        results: JSON.stringify(results.map(r => r.id)),
      },
    }).catch(() => {})
    
    return NextResponse.json({
      query,
      count: results.length,
      results,
    })
  } catch (error) {
    console.error('搜索失败:', error)
    return NextResponse.json(
      { error: '搜索失败', details: String(error) },
      { status: 500 }
    )
  }
}

function generateFuzzyPatterns(query: string): string[] {
  const patterns: string[] = []
  const chars = query.split('')
  
  patterns.push(query)
  
  for (let i = 0; i < chars.length; i++) {
    patterns.push(query.slice(0, i) + query.slice(i + 1))
  }
  
  if (chars.length > 2) {
    for (let i = 0; i < chars.length - 1; i++) {
      patterns.push(query.slice(0, i) + chars[i + 1] + chars[i] + query.slice(i + 2))
    }
  }
  
  return [...new Set(patterns)]
}

async function searchProjectsAndGraphs(query: string, fuzzy: boolean = false) {
  try {
    const searchTerms = fuzzy ? generateFuzzyPatterns(query) : [query]
    const whereConditions = searchTerms.flatMap(term => [
      { name: { contains: term, mode: 'insensitive' as const } },
      { description: { contains: term, mode: 'insensitive' as const } },
    ])

    const projects = await prisma.project.findMany({
      where: { OR: whereConditions },
      select: {
        id: true,
        name: true,
        description: true,
        nodeCount: true,
        edgeCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })

    const graphs = await prisma.graph.findMany({
      where: { OR: whereConditions },
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
            nodeCount: true,
            edgeCount: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })

    const results: Array<{
      type: 'project' | 'graph'
      projectId: string
      projectName: string
      graphId?: string
      graphName?: string
      matchedText: string
      nodeCount?: number
      edgeCount?: number
    }> = []

    for (const project of projects) {
      results.push({
        type: 'project',
        projectId: project.id,
        projectName: project.name,
        matchedText: project.name,
        nodeCount: project.nodeCount,
        edgeCount: project.edgeCount,
      })
    }

    for (const graph of graphs) {
      const existingProject = results.find(r => r.projectId === graph.projectId)
      if (!existingProject) {
        results.push({
          type: 'graph',
          projectId: graph.projectId || '',
          projectName: graph.project?.name || '',
          graphId: graph.id,
          graphName: graph.name,
          matchedText: `${graph.project?.name || ''} > ${graph.name}`,
          nodeCount: graph.nodeCount,
          edgeCount: graph.edgeCount,
        })
      }
    }

    return results
  } catch (error) {
    console.error('搜索项目和图谱失败:', error)
    throw error
  }
}
