import { NextRequest, NextResponse } from 'next/server'
import { getNodeNeighbors } from '@/lib/db-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const depth = parseInt(searchParams.get('depth') || '1')
    
    const neighbors = await getNodeNeighbors(params.id, depth)
    
    return NextResponse.json({
      nodeId: params.id,
      depth,
      count: neighbors.length,
      neighbors,
    })
  } catch (error) {
    console.error('获取邻居节点失败:', error)
    return NextResponse.json(
      { error: '获取邻居节点失败', details: String(error) },
      { status: 500 }
    )
  }
}
