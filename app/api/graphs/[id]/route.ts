import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFiles, deleteDirectory } from '@/lib/local-storage'
import { getCurrentUserId, verifyGraphOwnership } from '@/lib/auth'

// 使用 Node.js Runtime
export const runtime = 'nodejs'

/**
 * GET /api/graphs/[id] - 获取图谱详情及其所有节点和边
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const graph = await prisma.graph.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        nodes: {
          orderBy: { createdAt: 'desc' },
        },
        edges: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    
    if (!graph) {
      return NextResponse.json(
        { error: '图谱不存在' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      graph,
      nodes: graph.nodes,
      edges: graph.edges,
    })
  } catch (error) {
    console.error('获取图谱详情失败:', error)
    return NextResponse.json(
      { 
        error: '获取图谱详情失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/graphs/[id] - 更新图谱信息
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // 验证用户登录
    const userId = await getCurrentUserId(request, { required: true })
    if (!userId) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      )
    }
    
    // 验证图谱所有权
    const isOwner = await verifyGraphOwnership({ graphId: id, userId })
    if (!isOwner) {
      return NextResponse.json(
        { error: '无权限操作此图谱' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { name, description, isPublic, settings } = body
    
    // 验证图谱存在
    const existingGraph = await prisma.graph.findUnique({
      where: { id },
    })
    
    if (!existingGraph) {
      return NextResponse.json(
        { error: '图谱不存在' },
        { status: 404 }
      )
    }
    
    // 更新图谱
    const graph = await prisma.graph.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isPublic !== undefined && { isPublic }),
        ...(settings !== undefined && { settings }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
    
    return NextResponse.json({ graph })
  } catch (error) {
    console.error('更新图谱失败:', error)
    return NextResponse.json(
      { 
        error: '更新图谱失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/graphs/[id] - 删除图谱及其所有关联数据
 * 包括：节点、边、Blob 存储文件
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    console.log(`[DELETE] 开始删除图谱 ID: ${id}`)
    
    // 验证用户登录
    const userId = await getCurrentUserId(request, { required: true })
    if (!userId) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      )
    }
    
    // 验证图谱所有权
    const isOwner = await verifyGraphOwnership({ graphId: id, userId })
    if (!isOwner) {
      return NextResponse.json(
        { error: '无权限操作此图谱' },
        { status: 403 }
      )
    }
    
    // 查询图谱及其节点（获取图片 URL）
    const graph = await prisma.graph.findUnique({
      where: { id },
      include: {
        nodes: {
          select: {
            id: true,
            imageUrl: true,
            iconUrl: true,
            coverUrl: true,
          },
        },
        edges: {
          select: { id: true },
        },
      },
    })
    
    if (!graph) {
      console.log(`[DELETE] 图谱不存在 ID: ${id}`)
      return NextResponse.json(
        { error: '图谱不存在' },
        { status: 404 }
      )
    }
    
    console.log(`[DELETE] 找到图谱，节点数: ${graph.nodes.length}, 边数: ${graph.edges.length}`)
    
    // 收集所有需要删除的图片 URL
    const imageUrls: string[] = []
    graph.nodes.forEach(node => {
      if (node.imageUrl) imageUrls.push(node.imageUrl)
      if (node.iconUrl) imageUrls.push(node.iconUrl)
      if (node.coverUrl) imageUrls.push(node.coverUrl)
    })
    
    console.log(`[DELETE] 收集到 ${imageUrls.length} 个图片URL`)
    
    // 删除图谱（级联删除节点和边）
    console.log(`[DELETE] 开始从数据库删除图谱...`)
    await prisma.graph.delete({
      where: { id },
    })
    console.log(`[DELETE] 数据库删除成功`)
    
    // 删除本地存储的文件
    let deletedFileCount = 0
    try {
      await deleteDirectory(`graphs/${id}`)
      if (imageUrls.length > 0) {
        deletedFileCount = await deleteFiles(imageUrls)
      }
    } catch (error) {
      console.warn('删除本地文件时出错:', error)
    }
    
    console.log(`[DELETE] 删除完成`)
    return NextResponse.json({
      success: true,
      deletedNodeCount: graph.nodes.length,
      deletedEdgeCount: graph.edges.length,
      deletedFileCount,
    })
  } catch (error) {
    console.error('[DELETE] 删除图谱失败:', error)
    console.error('[DELETE] 错误堆栈:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: '删除图谱失败',
        details: error instanceof Error ? error.message : '未知错误',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
