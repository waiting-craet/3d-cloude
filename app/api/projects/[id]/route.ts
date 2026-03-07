import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { del, list } from '@vercel/blob'
import { getCurrentUserId, verifyProjectOwnership } from '@/lib/auth'

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
        edge: {
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
 * 需要验证用户所有权
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // 获取当前用户ID
    const userId = await getCurrentUserId(request, { required: true });
    
    if (!userId) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      );
    }
    
    // 验证项目所有权
    const isOwner = await verifyProjectOwnership({ projectId: id, userId });
    
    if (!isOwner) {
      return NextResponse.json(
        { error: '无权限操作此项目' },
        { status: 403 }
      );
    }
    
    console.log(`🗑️ [projects/${id}] 开始删除项目...`)
    console.log(`🗑️ [projects/${id}] 项目ID: ${id}`)
    
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
        graphs: {
          select: { id: true, name: true },
        },
      },
    })
    
    if (!project) {
      console.error(`❌ [projects/${id}] 项目不存在`)
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }
    
    console.log(`📊 [projects/${id}] 项目: ${project.name}`)
    console.log(`📊 [projects/${id}] 包含: ${project.graphs.length} 个图谱, ${project.nodes.length} 个节点, ${project.edges.length} 条边`)
    
    // 收集所有需要删除的图片 URL
    const imageUrls: string[] = []
    project.nodes.forEach(node => {
      if (node.imageUrl) imageUrls.push(node.imageUrl)
      if (node.iconUrl) imageUrls.push(node.iconUrl)
      if (node.coverUrl) imageUrls.push(node.coverUrl)
    })
    
    // 删除项目（级联删除图谱、节点和边）
    console.log(`🗑️ [projects/${id}] 正在删除项目...`)
    await prisma.project.delete({
      where: { id },
    })
    console.log(`✅ [projects/${id}] 项目已从数据库删除`)
    
    // 删除 Blob 存储中的文件
    let deletedFileCount = 0
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        console.log(`🗑️ [projects/${id}] 正在删除 Blob 文件...`)
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
        console.log(`✅ [projects/${id}] 已删除 ${deletedFileCount} 个 Blob 文件`)
      } catch (error) {
        console.warn('删除 Blob 文件时出错:', error)
        // 不阻塞主流程，继续返回成功
      }
    }
    
    console.log(`✅ [projects/${id}] 项目删除完成`)
    
    return NextResponse.json({
      success: true,
      deletedNodeCount: project.nodes.length,
      deletedEdgeCount: project.edges.length,
      deletedGraphCount: project.graphs.length,
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

/**
 * PATCH /api/projects/[id] - 更新项目信息
 * 需要验证用户所有权
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // 获取当前用户ID
    const userId = await getCurrentUserId(request, { required: true });
    
    if (!userId) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      );
    }
    
    // 验证项目所有权
    const isOwner = await verifyProjectOwnership({ projectId: id, userId });
    
    if (!isOwner) {
      return NextResponse.json(
        { error: '无权限操作此项目' },
        { status: 403 }
      );
    }
    
    const body = await request.json()
    const { name, description } = body

    // 验证项目是否存在
    const existingProject = await prisma.project.findUnique({
      where: { id },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }

    // 构建更新数据
    const updateData: any = {}
    if (name !== undefined) {
      updateData.name = name.trim()
    }
    if (description !== undefined) {
      updateData.description = description
    }

    // 更新项目
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      project: updatedProject,
    })
  } catch (error) {
    console.error('更新项目失败:', error)
    return NextResponse.json(
      { 
        error: '更新项目失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
