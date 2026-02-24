import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  parseExcelFile,
  parseCSVFile,
  parseJSONFile,
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
    const graphType = formData.get('graphType') as '2D' | '3D'

    if (!file || !projectId || !graphId || !fileType || !graphType) {
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

    // 根据文件类型解析数据
    let parsedData: ParsedGraphData
    
    try {
      switch (fileType) {
        case 'excel':
          parsedData = await parseExcelFile(file, graphType)
          break
        case 'csv':
          parsedData = await parseCSVFile(file, graphType)
          break
        case 'json':
          parsedData = await parseJSONFile(file, graphType)
          break
        default:
          return NextResponse.json(
            { message: '不支持的文件类型' },
            { status: 400 }
          )
      }
    } catch (parseError) {
      console.error('Parse error:', parseError)
      return NextResponse.json(
        { message: `文件解析失败: ${parseError instanceof Error ? parseError.message : String(parseError)}` },
        { status: 400 }
      )
    }

    // 验证数据
    if (!parsedData.nodes || parsedData.nodes.length === 0) {
      return NextResponse.json(
        { message: '文件中没有找到有效的节点数据' },
        { status: 400 }
      )
    }

    // 为没有坐标的节点生成布局
    const nodesWithLayout = generateLayout(parsedData.nodes, parsedData.edges, graphType)

    // 创建节点映射（label/id -> database id）
    const nodeMap = new Map<string, string>()

    // 批量创建节点 - 使用事务提高性能
    const createdNodes = await prisma.$transaction(
      nodesWithLayout.map(nodeData => 
        prisma.node.create({
          data: {
            label: nodeData.label || '未命名节点',
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
    const validEdges = parsedData.edges.filter(edgeData => {
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
            sourceId: nodeMap.get(edgeData.source)!,
            targetId: nodeMap.get(edgeData.target)!,
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
      graphType: graphType,
      skippedEdges: parsedData.edges.length - createdEdges.length
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { message: `导入失败: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
