import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 使用 Node.js Runtime
export const runtime = 'nodejs'

/**
 * GET /api/projects - 获取所有项目
 * 返回按创建时间降序排序的项目列表
 */
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            nodes: true,
            edges: true,
          },
        },
      },
    })
    
    // 将 _count 转换为 nodeCount 和 edgeCount
    const projectsWithCounts = projects.map(project => ({
      ...project,
      nodeCount: project._count.nodes,
      edgeCount: project._count.edges,
      _count: undefined,
    }))
    
    return NextResponse.json({ projects: projectsWithCounts })
  } catch (error) {
    console.error('获取项目列表失败:', error)
    return NextResponse.json(
      { 
        error: '获取项目列表失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects - 创建新项目
 * 请求体: { name: string, description?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body
    
    // 验证项目名称
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: '项目名称为必填项' },
        { status: 400 }
      )
    }
    
    // 验证名称不是纯空白字符
    if (name.trim().length === 0) {
      return NextResponse.json(
        { error: '项目名称不能为空' },
        { status: 400 }
      )
    }
    
    // 创建项目
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    })
    
    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('创建项目失败:', error)
    return NextResponse.json(
      { 
        error: '创建项目失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
