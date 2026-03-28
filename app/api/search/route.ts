import { NextRequest, NextResponse } from 'next/server'
import { searchNodes } from '@/lib/db-helpers'
import { prisma } from '@/lib/db'

// 使用 Node.js Runtime（开发环境）
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') // 'nodes' | 'projects' | 'all'
    
    if (!query) {
      return NextResponse.json(
        { error: '搜索关键词不能为空' },
        { status: 400 }
      )
    }

    // 如果是搜索项目和图谱
    if (type === 'projects' || !type) {
      const results = await searchProjectsAndGraphs(query)
      
      // 保存搜索历史
      await prisma.searchHistory.create({
        data: {
          query,
          results: JSON.stringify(results.map(r => ({ type: r.type, id: r.projectId }))),
        },
      })
      
      return NextResponse.json({
        query,
        count: results.length,
        results,
      })
    }
    
    // 原有的节点搜索逻辑
    const results = await searchNodes(query)
    
    // 保存搜索历史
    await prisma.searchHistory.create({
      data: {
        query,
        results: JSON.stringify(results.map(r => r.id)),
      },
    })
    
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

// 搜索项目和图谱的函数
async function searchProjectsAndGraphs(query: string) {
  const searchTerm = `%${query}%`
  
  try {
    // 搜索项目
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
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    // 搜索图谱
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
            nodeCount: true,
            edgeCount: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const results = []

    // 添加匹配的项目
    for (const project of projects) {
      results.push({
        type: 'project' as const,
        projectId: project.id,
        projectName: project.name,
        matchedText: project.name,
      })
    }

    // 添加匹配的图谱（显示为对应的项目）
    for (const graph of graphs) {
      // 检查该项目是否已经在结果中（避免重复）
      const existingProject = results.find(r => r.projectId === graph.projectId)
      if (!existingProject) {
        results.push({
          type: 'graph' as const,
          projectId: graph.projectId,
          projectName: graph.project.name,
          graphId: graph.id,
          graphName: graph.name,
          matchedText: `${graph.project.name} > ${graph.name}`,
        })
      }
    }

    return results
  } catch (error) {
    console.error('搜索项目和图谱失败:', error)
    throw error
  }
}
