import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'edge'

export async function GET() {
  try {
    const edges = await prisma.edge.findMany({
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(edges)
  } catch (error) {
    console.error('获取关系失败:', error)
    return NextResponse.json(
      { error: '获取关系失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromNodeId, toNodeId, label, weight } = body
    
    if (!fromNodeId || !toNodeId || !label) {
      return NextResponse.json(
        { error: '起始节点、目标节点和标签为必填项' },
        { status: 400 }
      )
    }
    
    const edge = await prisma.edge.create({
      data: {
        fromNodeId,
        toNodeId,
        label,
        weight: weight ?? 1.0,
      },
    })
    
    return NextResponse.json(edge, { status: 201 })
  } catch (error) {
    console.error('创建关系失败:', error)
    return NextResponse.json(
      { error: '创建关系失败' },
      { status: 500 }
    )
  }
}
