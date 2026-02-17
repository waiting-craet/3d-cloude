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
        { message: '文件解析失败', error: String(parseError) },
        { status: 400 }
      )
    }

    // 为没有坐标的节点生成布局
    const nodesWithLayout = generateLayout(parsedData.nodes, parsedData.edges, graphType)

    // 创建节点映射（label/id -> database id）
    const nodeMap = new Map<string, string>()

    // 批量创建节点
    for (const nodeData of nodesWithLayout) {
      const node = await prisma.node.create({
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
      
      // 使用原始id或label作为映射键
      const key = nodeData.id || nodeData.label
      nodeMap.set(key, node.id)
    }

    // 批量创建边
    let edgesCreated = 0
    for (const edgeData of parsedData.edges) {
      const sourceId = nodeMap.get(edgeData.source)
      const targetId = nodeMap.get(edgeData.target)
      
      if (sourceId && targetId) {
        await prisma.edge.create({
          data: {
            label: edgeData.label || '',
            sourceId: sourceId,
            targetId: targetId,
            projectId: projectId,
            graphId: graphId
          }
        })
        edgesCreated++
      } else {
        console.warn(`Edge skipped: ${edgeData.source} -> ${edgeData.target} (nodes not found)`)
      }
    }

    // 更新图谱的节点和边计数
    await prisma.graph.update({
      where: { id: graphId },
      data: {
        nodeCount: { increment: nodesWithLayout.length },
        edgeCount: { increment: edgesCreated }
      }
    })

    return NextResponse.json({
      message: '导入成功',
      nodesCount: nodesWithLayout.length,
      edgesCount: edgesCreated,
      graphType: graphType
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { message: '导入失败', error: String(error) },
      { status: 500 }
    )
  }
}
