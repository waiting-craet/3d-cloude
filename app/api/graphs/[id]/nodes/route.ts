import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 使用 Node.js Runtime
export const runtime = 'nodejs'

/**
 * GET /api/graphs/[id]/nodes - 获取图谱的所有节点
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // 验证图谱存在
    const graph = await prisma.graph.findUnique({
      where: { id },
    })
    
    if (!graph) {
      return NextResponse.json(
        { error: '图谱不存在' },
        { status: 404 }
      )
    }
    
    // 查询图谱的所有节点
    const nodes = await prisma.node.findMany({
      where: { graphId: id },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({ nodes })
  } catch (error) {
    console.error('获取图谱节点失败:', error)
    return NextResponse.json(
      { 
        error: '获取图谱节点失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/graphs/[id]/nodes - 在图谱中创建节点
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: graphId } = params
    const body = await request.json()
    const { name, type, description, x, y, z, color, size, imageUrl, iconUrl, coverUrl, content, metadata } = body
    
    // 验证必填字段
    if (!name || !type) {
      return NextResponse.json(
        { error: '节点名称和类型为必填项' },
        { status: 400 }
      )
    }
    
    // 验证图谱存在并获取项目ID
    const graph = await prisma.graph.findUnique({
      where: { id: graphId },
      select: { id: true, projectId: true },
    })
    
    if (!graph) {
      return NextResponse.json(
        { error: '图谱不存在' },
        { status: 404 }
      )
    }
    
    // 使用事务创建节点并更新图谱和项目统计
    const result = await prisma.$transaction(async (tx) => {
      // 创建节点
      const node = await tx.node.create({
        data: {
          name,
          type,
          description,
          content,
          metadata,
          x: x ?? 0,
          y: y ?? 0,
          z: z ?? 0,
          color: color ?? '#6BB6FF',
          size: size ?? 1.5,
          imageUrl,
          iconUrl,
          coverUrl,
          projectId: graph.projectId,
          graphId,
        },
      })
      
      // 更新图谱的节点计数
      await tx.graph.update({
        where: { id: graphId },
        data: { nodeCount: { increment: 1 } },
      })
      
      // 更新项目的节点计数
      await tx.project.update({
        where: { id: graph.projectId },
        data: { nodeCount: { increment: 1 } },
      })
      
      return node
    })
    
    return NextResponse.json({ node: result }, { status: 201 })
  } catch (error) {
    console.error('创建节点失败:', error)
    return NextResponse.json(
      { 
        error: '创建节点失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
