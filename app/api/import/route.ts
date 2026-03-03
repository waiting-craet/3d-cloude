import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  importAndValidateGraphData,
  generateLayout,
  type ParsedGraphData
} from '@/lib/services/graph-import'

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

    // 验证项目和图谱是否存在
    const graph = await prisma.graph.findUnique({
      where: { id: graphId },
      include: { project: true }
    })

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
    const nodesWithLayout = generateLayout(validatedData.nodes, validatedData.edges)

    // 创建节点映射（label/id -> database id）
    const nodeMap = new Map<string, string>()

    // 批量创建节点 - 使用事务提高性能
    const createdNodes = await prisma.$transaction(
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

    // 建立节点映射
    createdNodes.forEach((node, index) => {
      const originalNode = nodesWithLayout[index]
      const key = originalNode.id || originalNode.label
      nodeMap.set(key, node.id)
    })

    // 批量创建边 - 过滤无效边并使用事务
    const validEdges = validatedData.edges.filter(edgeData => {
      const sourceId = nodeMap.get(edgeData.source)
      const targetId = nodeMap.get(edgeData.target)
      
      if (!sourceId || !targetId) {
        console.warn(`Edge skipped: ${edgeData.source} -> ${edgeData.target} (nodes not found)`)
        return false
      }
      return true
    })

    const createdEdges = validEdges.length > 0 ? await prisma.$transaction(
      validEdges.map(edgeData => 
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
    ) : []

    // 更新图谱的节点和边计数
    await prisma.graph.update({
      where: { id: graphId },
      data: {
        nodeCount: { increment: createdNodes.length },
        edgeCount: { increment: createdEdges.length }
      }
    })

    // 更新项目的节点和边计数
    await prisma.project.update({
      where: { id: projectId },
      data: {
        nodeCount: { increment: createdNodes.length },
        edgeCount: { increment: createdEdges.length }
      }
    })

    return NextResponse.json({
      message: '导入成功',
      nodesCount: createdNodes.length,
      edgesCount: createdEdges.length,
      coordinateSystem: '3D', // 系统已统一为3D
      skippedEdges: validatedData.edges.length - createdEdges.length,
      warnings: importResult.warnings
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { message: `导入失败: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
