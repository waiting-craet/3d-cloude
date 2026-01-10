import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'edge'

export async function GET() {
  try {
    const nodes = await prisma.node.findMany({
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(nodes)
  } catch (error) {
    console.error('获取节点失败:', error)
    return NextResponse.json(
      { error: '获取节点失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, description, x, y, z, color } = body
    
    if (!name || !type) {
      return NextResponse.json(
        { error: '节点名称和类型为必填项' },
        { status: 400 }
      )
    }
    
    const node = await prisma.node.create({
      data: {
        name,
        type,
        description,
        x: x ?? 0,
        y: y ?? 0,
        z: z ?? 0,
        color: color ?? '#3b82f6',
      },
    })
    
    return NextResponse.json(node, { status: 201 })
  } catch (error) {
    console.error('创建节点失败:', error)
    return NextResponse.json(
      { error: '创建节点失败' },
      { status: 500 }
    )
  }
}
