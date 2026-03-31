import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const node = await prisma.node.findUnique({
      where: { id: params.id },
    })
    
    if (!node) {
      return NextResponse.json(
        { error: '节点不存在' },
        { status: 404 }
      )
    }
    
    console.log('✅ [GET /api/nodes/:id] 节点数据获取成功:', {
      id: node.id,
      name: node.name,
      imageUrl: node.imageUrl,
      videoUrl: node.videoUrl
    })
    
    return NextResponse.json({ node })
  } catch (error) {
    console.error('❌ 获取节点失败:', error)
    return NextResponse.json(
      { error: '获取节点失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, color, textColor, shape, size, tags, imageUrl, videoUrl } = body
    
    console.log('📝 更新节点请求:', {
      id: params.id,
      body: { name, description, color, textColor, shape, size, tags, imageUrl, videoUrl }
    })
    
    const node = await prisma.node.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
        ...(textColor && { textColor }),
        ...(shape !== undefined && { shape }),
        ...(size !== undefined && { size }),
        ...(tags && { tags }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(videoUrl !== undefined && { videoUrl }),
      },
    })
    
    console.log('✅ 节点更新成功:', node.id)
    return NextResponse.json(node)
  } catch (error) {
    console.error('❌ 更新节点失败:', error)
    console.error('错误详情:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: '更新节点失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.node.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除节点失败:', error)
    return NextResponse.json(
      { error: '删除节点失败', details: String(error) },
      { status: 500 }
    )
  }
}
