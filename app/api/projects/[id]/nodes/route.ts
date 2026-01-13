import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 使用 Node.js Runtime
export const runtime = 'nodejs'

/**
 * GET /api/projects/[id]/nodes - 获取项目的所有节点
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
    
    // 查询项目的所有节点
    const nodes = await prisma.node.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({ nodes })
  } catch (error) {
    console.error('获取项目节点失败:', error)
    return NextResponse.json(
      { 
        error: '获取项目节点失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[id]/nodes - 在项目中创建节点
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params
    const body = await request.json()
    const { name, type, description, x, y, z, color, size, imageUrl, iconUrl, content, metadata } = body
    
    // 验证必填字段
    if (!name || !type) {
      return NextResponse.json(
        { error: '节点名称和类型为必填项' },
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
    
    // 使用事务创建节点并更新项目统计
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
          projectId,
        },
      })
      
      // 更新项目的节点计数
      await tx.project.update({
        where: { id: projectId },
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
