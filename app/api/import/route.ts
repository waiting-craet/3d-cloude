import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 解析 Excel 文件
async function parseExcel(file: File) {
  // 这里需要使用 xlsx 库来解析 Excel
  // 暂时返回示例数据结构
  return {
    nodes: [],
    edges: []
  }
}

// 解析 CSV 文件
async function parseCSV(file: File) {
  const text = await file.text()
  const lines = text.split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  
  const nodes: any[] = []
  const edges: any[] = []
  
  // 假设 CSV 格式: source,target,relationship
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = line.split(',').map(v => v.trim())
    if (values.length >= 2) {
      const source = values[0]
      const target = values[1]
      const relationship = values[2] || '关联'
      
      // 添加节点
      if (!nodes.find(n => n.label === source)) {
        nodes.push({ label: source })
      }
      if (!nodes.find(n => n.label === target)) {
        nodes.push({ label: target })
      }
      
      // 添加边
      edges.push({
        source,
        target,
        label: relationship
      })
    }
  }
  
  return { nodes, edges }
}

// 解析 JSON 文件
async function parseJSON(file: File) {
  const text = await file.text()
  const data = JSON.parse(text)
  
  // 假设 JSON 格式: { nodes: [...], edges: [...] }
  return {
    nodes: data.nodes || [],
    edges: data.edges || []
  }
}

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

    // 根据文件类型解析数据
    let parsedData: { nodes: any[], edges: any[] }
    
    switch (fileType) {
      case 'excel':
        parsedData = await parseExcel(file)
        break
      case 'csv':
        parsedData = await parseCSV(file)
        break
      case 'json':
        parsedData = await parseJSON(file)
        break
      default:
        return NextResponse.json(
          { message: '不支持的文件类型' },
          { status: 400 }
        )
    }

    // 创建节点映射（label -> id）
    const nodeMap = new Map<string, string>()

    // 批量创建节点
    for (const nodeData of parsedData.nodes) {
      const node = await prisma.node.create({
        data: {
          label: nodeData.label || nodeData.name || '未命名节点',
          description: nodeData.description || '',
          x: nodeData.x || Math.random() * 1000 - 500,
          y: nodeData.y || Math.random() * 1000 - 500,
          z: nodeData.z || Math.random() * 1000 - 500,
          color: nodeData.color || '#00bfa5',
          size: nodeData.size || 1,
          shape: nodeData.shape || 'sphere',
          graphId: graphId
        }
      })
      
      nodeMap.set(nodeData.label || nodeData.name, node.id)
    }

    // 批量创建边
    for (const edgeData of parsedData.edges) {
      const sourceId = nodeMap.get(edgeData.source)
      const targetId = nodeMap.get(edgeData.target)
      
      if (sourceId && targetId) {
        await prisma.edge.create({
          data: {
            label: edgeData.label || edgeData.relationship || '',
            sourceId: sourceId,
            targetId: targetId,
            graphId: graphId
          }
        })
      }
    }

    return NextResponse.json({
      message: '导入成功',
      nodesCount: parsedData.nodes.length,
      edgesCount: parsedData.edges.length
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { message: '导入失败', error: String(error) },
      { status: 500 }
    )
  }
}
