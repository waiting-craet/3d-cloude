import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  importAndValidateGraphData,
  generateLayout,
  type ParsedGraphData
} from '@/lib/services/graph-import'
import { retryOperation, getDescriptiveErrorMessage } from '@/lib/db-helpers'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const graphId = formData.get('graphId') as string
    const fileType = formData.get('fileType') as string

    if (!file || !projectId || !graphId || !fileType) {
      return NextResponse.json(
        { message: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 验证项目和图谱是否存在 - 使用重试机制处理数据库唤醒
    const graph = await retryOperation(async () => {
      // 显式连接以唤醒暂停的数据库
      await prisma.$connect()
      
      return await prisma.graph.findUnique({
        where: { id: graphId },
        include: { project: true }
      })
    }, 3, 1000) // 3次重试，初始延迟1000ms

    if (!graph || graph.projectId !== projectId) {
      return NextResponse.json(
        { message: '项目或图谱不存在' },
        { status: 404 }
      )
    }

    // 使用统一的导入和验证函数
    const importResult = await importAndValidateGraphData(file)
    
    if (!importResult.success) {
      return NextResponse.json(
        { 
          message: '数据验证失败',
          errors: importResult.errors,
          warnings: importResult.warnings
        },
        { status: 400 }
      )
    }

    const parsedData = importResult.data!
    const validatedData = importResult.validatedData!

    // 为没有坐标的节点生成布局 - 统一使用3D模式
    const nodesWithLayout = generateLayout(validatedData.node, validatedData.edge)

    // 创建节点映射（label/id -> database id）
    const nodeMap = new Map<string, string>()

    // 批量创建节点 - 使用事务提高性能，并添加重试机制
    const createdNodes = await retryOperation(async () => {
      return await prisma.$transaction(
        nodesWithLayout.map(nodeData => 
          prisma.node.create({
            data: {
              name: nodeData.label || '未命名节点',
              type: 'entity',
              description: nodeData.description || '',
              x: nodeData.x || 0,
              y: nodeData.y || 0,
              z: nodeData.z || 0,
              color: nodeData.color || '#00bfa5',
              size: nodeData.size || 1,
              shape: nodeData.shape || 'sphere',
              projectId: projectId,
              graphId: graphId
            }
          })
        )
      )
    }, 3, 1000)

    // 建立节点映射
    createdNodes.forEach((node, index) => {
      const originalNode = nodesWithLayout[index]
      const key = originalNode.id || originalNode.label
      nodeMap.set(key, node.id)
    })

    // 批量创建边 - 过滤无效边并使用事务，添加重试机制
    const validEdges = validatedData.edge.filter((edgeData: { source: string; target: string; label?: string }) => {
      const sourceId = nodeMap.get(edgeData.source)
      const targetId = nodeMap.get(edgeData.target)
      
      if (!sourceId || !targetId) {
        console.warn(`Edge skipped: ${edgeData.source} -> ${edgeData.target} (nodes not found)`)
        return false
      }
      return true
    })

    const createdEdges = validEdges.length > 0 ? await retryOperation(async () => {
      return await prisma.$transaction(
        validEdges.map((edgeData: { source: string; target: string; label?: string }) => 
          prisma.edge.create({
            data: {
              label: edgeData.label || '',
              fromNodeId: nodeMap.get(edgeData.source)!,
              toNodeId: nodeMap.get(edgeData.target)!,
              projectId: projectId,
              graphId: graphId
            }
          })
        )
      )
    }, 3, 1000) : []

    // 更新图谱的节点和边计数 - 添加重试机制
    await retryOperation(async () => {
      return await prisma.graph.update({
        where: { id: graphId },
        data: {
          nodeCount: { increment: createdNodes.length },
          edgeCount: { increment: createdEdges.length }
        }
      })
    }, 3, 1000)

    // 更新项目的节点和边计数 - 添加重试机制
    await retryOperation(async () => {
      return await prisma.project.update({
        where: { id: projectId },
        data: {
          nodeCount: { increment: createdNodes.length },
          edgeCount: { increment: createdEdges.length }
        }
      })
    }, 3, 1000)

    return NextResponse.json({
      message: '导入成功',
      nodesCount: createdNodes.length,
      edgesCount: createdEdges.length,
      coordinateSystem: '3D', // 系统已统一为3D
      skippedEdges: validatedData.edge.length - createdEdges.length,
      warnings: importResult.warnings
    })

  } catch (error) {
    console.error('Import error:', error)
    
    // 检测连接相关错误
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isConnectionError = 
      errorMessage.toLowerCase().includes('connection') ||
      errorMessage.toLowerCase().includes('connect') ||
      errorMessage.toLowerCase().includes('database server')
    
    // 使用描述性错误消息
    const descriptiveMessage = isConnectionError 
      ? '数据库连接失败，请稍后重试'
      : getDescriptiveErrorMessage(error)
    
    return NextResponse.json(
      { message: `导入失败: ${descriptiveMessage}` },
      { status: 500 }
    )
  }
}
