import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { convertTo3DCoordinates, type Node2D } from '@/lib/coordinate-converter'
import {
  validateWorkflowData,
  cleanWorkflowData,
  type WorkflowNode,
  type WorkflowConnection,
} from '@/lib/data-validator'
import {
  createNodesBatch,
  createEdgesBatch,
  clearAllGraphData,
  getDescriptiveErrorMessage,
  isTransactionTimeoutError,
  type NodeData,
  type EdgeData,
} from '@/lib/db-helpers'

/**
 * 转换API请求体
 */
interface ConversionRequest {
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  graphId?: string  // 添加图谱ID
  metadata?: {
    canvasScale?: number
    canvasOffset?: { x: number; y: number }
  }
  updateMode?: boolean // 是否为更新模式
}

/**
 * 转换API响应
 */
interface ConversionResponse {
  success: boolean
  stats?: {
    nodesCreated: number
    edgesCreated: number
  }
  message?: string
  errors?: string[]
  warnings?: string[]
  progress?: {
    stage: string
    percentage: number
  }
}

/**
 * POST /api/convert
 * 
 * 将二维工作流数据转换为三维知识图谱数据
 */
export async function POST(request: Request) {
  try {
    // 1. 解析请求体
    const body: ConversionRequest = await request.json()
    const { nodes, connections, graphId, metadata, updateMode = false } = body

    console.log('🔄 收到转换请求 - 图谱ID:', graphId, '节点数:', nodes?.length)

    // 2. 数据验证
    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json(
        {
          success: false,
          message: '请求数据格式错误：缺少节点数组',
        } as ConversionResponse,
        { status: 400 }
      )
    }

    // 验证图谱ID
    if (!graphId) {
      return NextResponse.json(
        {
          success: false,
          message: '请先选择一个图谱',
        } as ConversionResponse,
        { status: 400 }
      )
    }

    // 验证图谱是否存在
    const graph = await prisma.graph.findUnique({
      where: { id: graphId },
      select: { id: true, projectId: true, name: true },
    })

    if (!graph) {
      return NextResponse.json(
        {
          success: false,
          message: '图谱不存在',
        } as ConversionResponse,
        { status: 404 }
      )
    }

    console.log('✅ 图谱验证通过:', graph.name)

    // 验证数据完整性
    const validationResult = validateWorkflowData(nodes, connections || [])
    
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: '数据验证失败',
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        } as ConversionResponse,
        { status: 400 }
      )
    }

    // 3. 清理无效数据
    const cleaned = cleanWorkflowData(nodes, connections || [])
    
    if (cleaned.nodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: '没有有效的节点数据（所有节点标题都为空）',
        } as ConversionResponse,
        { status: 400 }
      )
    }

    // 4. 坐标转换（使用增强的配置）
    const convertedNodes = cleaned.nodes.map(node => {
      const node2d: Node2D = {
        id: node.id,
        label: node.label,
        description: node.description,
        x: node.x,
        y: node.y,
      }
      return {
        ...convertTo3DCoordinates(node2d, cleaned.nodes as Node2D[], {
          heightVariation: 5,
          minNodeDistance: 4,  // 增加最小节点距离从 2 到 4
        }),
        originalId: node.id,
      }
    })

    // 5. 直接使用数据库创建节点和边
    let createdNodes: any[] = []
    let createdEdges: any[] = []

    try {
      console.log('📝 开始创建节点...')
      
      // 使用事务批量创建节点
      createdNodes = await Promise.all(
        convertedNodes.map(async (node) => {
          const created = await prisma.node.create({
            data: {
              name: node.label,
              type: 'concept',
              description: node.description || '',
              x: node.x3d,
              y: node.y3d,
              z: node.z3d,
              color: '#3b82f6',
              size: 1.5,
              projectId: graph.projectId,
              graphId: graphId,
            },
          })
          return {
            ...created,
            originalId: node.originalId,
          }
        })
      )

      console.log(`✅ 创建了 ${createdNodes.length} 个节点`)

      // 更新图谱的节点计数
      await prisma.graph.update({
        where: { id: graphId },
        data: { nodeCount: { increment: createdNodes.length } },
      })

      // 更新项目的节点计数
      await prisma.project.update({
        where: { id: graph.projectId },
        data: { nodeCount: { increment: createdNodes.length } },
      })

      // 创建ID映射：原始ID -> 数据库ID
      const idMap = new Map(
        createdNodes.map(node => [node.originalId, node.id])
      )

      // 创建边
      console.log('🔗 开始创建边...')
      
      const edgesToCreate = cleaned.connections
        .filter(conn => idMap.has(conn.from) && idMap.has(conn.to))
        .map(conn => ({
          fromNodeId: idMap.get(conn.from)!,
          toNodeId: idMap.get(conn.to)!,
          label: conn.label || '',
          weight: 1.0,
          projectId: graph.projectId,
          graphId: graphId,
        }))

      if (edgesToCreate.length > 0) {
        createdEdges = await Promise.all(
          edgesToCreate.map(edgeData => 
            prisma.edge.create({ data: edgeData })
          )
        )

        // 更新图谱的边计数
        await prisma.graph.update({
          where: { id: graphId },
          data: { edgeCount: { increment: createdEdges.length } },
        })

        // 更新项目的边计数
        await prisma.project.update({
          where: { id: graph.projectId },
          data: { edgeCount: { increment: createdEdges.length } },
        })
      }

      console.log(`✅ 创建了 ${createdEdges.length} 条边`)

      // 6. 返回成功响应
      return NextResponse.json({
        success: true,
        stats: {
          nodesCreated: createdNodes.length,
          edgesCreated: createdEdges.length,
        },
        warnings: validationResult.warnings.length > 0 
          ? validationResult.warnings 
          : undefined,
      } as ConversionResponse)
      
    } catch (dbError) {
      // 数据库错误处理
      console.error('❌ Database operation failed:', dbError)
      throw dbError
    }

  } catch (error) {
    console.error('转换失败:', error)
    
    // 获取描述性错误消息
    const errorMessage = getDescriptiveErrorMessage(error)
    
    // 检查是否是事务超时错误
    if (isTransactionTimeoutError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          errors: ['事务超时。请尝试减少节点数量或联系支持。'],
        } as ConversionResponse,
        { status: 408 } // Request Timeout
      )
    }
    
    // 返回错误响应
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      } as ConversionResponse,
      { status: 500 }
    )
  }
}
