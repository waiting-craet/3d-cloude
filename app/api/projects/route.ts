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
    console.log('📝 [projects] 开始创建项目...')
    
    // 检查数据库连接
    if (!process.env.DATABASE_URL) {
      console.error('❌ [projects] DATABASE_URL 未设置')
      return NextResponse.json(
        { 
          error: 'DATABASE_URL 环境变量未设置',
          details: '请在 Vercel 中配置 DATABASE_URL 环境变量'
        },
        { status: 500 }
      )
    }
    
    const body = await request.json()
    const { name, description } = body
    
    console.log(`📝 [projects] 项目名称: ${name}`)
    
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
    
    console.log(`✅ [projects] 项目创建成功: ${project.id}`)
    
    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('❌ [projects] 创建项目失败:', error)
    return NextResponse.json(
      { 
        error: '创建项目失败',
        details: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
