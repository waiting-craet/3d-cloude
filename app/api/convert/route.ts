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
    const { nodes, connections, metadata, updateMode = false } = body

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
          minNodeDistance: 2,
        }),
        originalId: node.id,
      }
    })

    // 5. 使用批处理创建数据库记录
    let createdNodes
    let idMap: Map<string, string>

    try {
      if (updateMode) {
        // 更新模式：先删除所有现有数据
        await clearAllGraphData()
      }
      
      // 准备节点数据
      const nodeDataArray: NodeData[] = convertedNodes.map(node => ({
        name: node.label,
        type: 'concept',
        description: node.description || null,
        x: node.x3d,
        y: node.y3d,
        z: node.z3d,
        color: '#3b82f6',
        size: 1.0,
        metadata: JSON.stringify({
          original2D: {
            x: node.x2d,
            y: node.y2d,
          },
          convertedAt: new Date().toISOString(),
          canvasMetadata: metadata,
        }),
      }))
      
      // 使用批处理创建节点
      const nodeResult = await createNodesBatch(nodeDataArray, 15, 100)
      
      if (nodeResult.errors.length > 0) {
        throw nodeResult.errors[0]
      }
      
      createdNodes = nodeResult.items
      
      // 创建ID映射：原始ID -> 数据库ID
      idMap = new Map(
        createdNodes.map((node, i) => [convertedNodes[i].originalId, node.id])
      )
      
      // 准备边数据
      const edgeDataArray: EdgeData[] = cleaned.connections
        .filter(conn => idMap.has(conn.from) && idMap.has(conn.to))
        .map(conn => ({
          fromNodeId: idMap.get(conn.from)!,
          toNodeId: idMap.get(conn.to)!,
          label: conn.label || 'RELATES_TO',
          weight: 1.0,
          color: '#3b82f6',
          properties: JSON.stringify({
            original2DConnection: conn.id,
            convertedAt: new Date().toISOString(),
          }),
        }))
      
      // 使用批处理创建边
      const edgeResult = await createEdgesBatch(edgeDataArray, 20, 50)
      
      if (edgeResult.errors.length > 0) {
        console.warn('Some edges failed to create:', edgeResult.errors)
      }
      
      const createdEdges = edgeResult.items

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
      console.error('Database operation failed:', dbError)
      
      // 尝试清理部分创建的数据
      try {
        if (updateMode) {
          await clearAllGraphData()
        }
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError)
      }
      
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
