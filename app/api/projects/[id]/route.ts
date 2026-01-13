import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { del, list } from '@vercel/blob'

// 使用 Node.js Runtime
export const runtime = 'nodejs'

/**
 * GET /api/projects/[id] - 获取项目详情及其所有节点和边
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        nodes: {
          orderBy: { createdAt: 'desc' },
        },
        edges: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    
    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      project,
      nodes: project.nodes,
      edges: project.edges,
    })
  } catch (error) {
    console.error('获取项目详情失败:', error)
    return NextResponse.json(
      { 
        error: '获取项目详情失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[id] - 删除项目及其所有关联数据
 * 包括：节点、边、Blob 存储文件
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // 查询项目及其节点（获取图片 URL）
    const project = await prisma.project.findUnique({
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
    
    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }
    
    // 收集所有需要删除的图片 URL
    const imageUrls: string[] = []
    project.nodes.forEach(node => {
      if (node.imageUrl) imageUrls.push(node.imageUrl)
      if (node.iconUrl) imageUrls.push(node.iconUrl)
      if (node.coverUrl) imageUrls.push(node.coverUrl)
    })
    
    // 删除项目（级联删除节点和边）
    await prisma.project.delete({
      where: { id },
    })
    
    // 删除 Blob 存储中的文件
    let deletedFileCount = 0
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        // 尝试批量删除项目文件夹
        const blobs = await list({ prefix: `projects/${id}/` })
        if (blobs.blobs.length > 0) {
          await Promise.all(blobs.blobs.map(blob => del(blob.url)))
          deletedFileCount = blobs.blobs.length
        }
        
        // 删除单独的图片文件
        if (imageUrls.length > 0) {
          await Promise.all(
            imageUrls.map(url => del(url).catch(err => {
              console.warn(`删除文件失败: ${url}`, err)
            }))
          )
        }
      } catch (error) {
        console.warn('删除 Blob 文件时出错:', error)
        // 不阻塞主流程，继续返回成功
      }
    }
    
    return NextResponse.json({
      success: true,
      deletedNodeCount: project.nodes.length,
      deletedEdgeCount: project.edges.length,
      deletedFileCount,
    })
  } catch (error) {
    console.error('删除项目失败:', error)
    return NextResponse.json(
      { 
        error: '删除项目失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
