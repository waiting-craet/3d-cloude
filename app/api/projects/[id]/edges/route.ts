import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 使用 Node.js Runtime
export const runtime = 'nodejs'

/**
 * GET /api/projects/[id]/edges - 获取项目的所有边
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // 验证项目存在
    const project = await prisma.project.findUnique({
      where: { id },
    })
    
    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }
    
    // 查询项目的所有边
    const edges = await prisma.edge.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({ edges })
  } catch (error) {
    console.error('获取项目边失败:', error)
    return NextResponse.json(
      { 
        error: '获取项目边失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[id]/edges - 在项目中创建边
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params
    const body = await request.json()
    const { fromNodeId, toNodeId, label, weight, color, style, properties } = body
    
    // 验证必填字段
    if (!fromNodeId || !toNodeId || !label) {
      return NextResponse.json(
        { error: '起始节点、目标节点和标签为必填项' },
        { status: 400 }
      )
    }
    
    // 验证项目存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })
    
    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }
    
    // 验证源节点和目标节点存在且属于当前项目
    const [fromNode, toNode] = await Promise.all([
      prisma.node.findUnique({ where: { id: fromNodeId } }),
      prisma.node.findUnique({ where: { id: toNodeId } }),
    ])
    
    if (!fromNode || !toNode) {
      return NextResponse.json(
        { error: '源节点或目标节点不存在' },
        { status: 404 }
      )
    }
    
    if (fromNode.projectId !== projectId || toNode.projectId !== projectId) {
      return NextResponse.json(
        { error: '节点不属于当前项目' },
        { status: 400 }
      )
    }
    
    // 使用事务创建边并更新项目统计
    const result = await prisma.$transaction(async (tx) => {
      // 创建边
      const edge = await tx.edge.create({
        data: {
          fromNodeId,
          toNodeId,
          label,
          weight: weight ?? 1.0,
          color,
          style,
          properties,
          projectId,
        },
      })
      
      // 更新项目的边计数
      await tx.project.update({
        where: { id: projectId },
        data: { edgeCount: { increment: 1 } },
      })
      
      return edge
    })
    
    return NextResponse.json({ edge: result }, { status: 201 })
  } catch (error) {
    console.error('创建边失败:', error)
    return NextResponse.json(
      { 
        error: '创建边失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
