import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { convertTo3DCoordinates, type Node2D } from '@/lib/coordinate-converter'
import {
  validateWorkflowData,
  cleanWorkflowData,
  type WorkflowNode,
  type WorkflowConnection,
} from '@/lib/data-validator'

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

    // 4. 坐标转换
    const convertedNodes = cleaned.nodes.map(node => {
      const node2d: Node2D = {
        id: node.id,
        label: node.label,
        description: node.description,
        x: node.x,
        y: node.y,
      }
      return {
        ...convertTo3DCoordinates(node2d, cleaned.nodes as Node2D[]),
        originalId: node.id,
      }
    })

    // 5. 使用事务创建或更新数据库记录
    const result = await prisma.$transaction(async (tx) => {
      let createdNodes
      let idMap: Map<string, string>

      if (updateMode) {
        // 更新模式：先删除所有现有数据，然后重新创建
        await tx.edge.deleteMany({})
        await tx.node.deleteMany({})
        
        // 创建新节点
        createdNodes = await Promise.all(
          convertedNodes.map(node =>
            tx.node.create({
              data: {
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
              },
            })
          )
        )

        // 创建ID映射：原始ID -> 数据库ID
        idMap = new Map(
          createdNodes.map((node, i) => [convertedNodes[i].originalId, node.id])
        )
      } else {
        // 创建模式：直接创建新节点
        createdNodes = await Promise.all(
          convertedNodes.map(node =>
            tx.node.create({
              data: {
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
              },
            })
          )
        )

        // 创建ID映射：原始ID -> 数据库ID
        idMap = new Map(
          createdNodes.map((node, i) => [convertedNodes[i].originalId, node.id])
        )
      }

      // 创建边
      const createdEdges = await Promise.all(
        cleaned.connections
          .filter(conn => idMap.has(conn.from) && idMap.has(conn.to))
          .map(conn =>
            tx.edge.create({
              data: {
                fromNodeId: idMap.get(conn.from)!,
                toNodeId: idMap.get(conn.to)!,
                label: conn.label || 'RELATES_TO',
                weight: 1.0,
                color: '#3b82f6',
                properties: JSON.stringify({
                  original2DConnection: conn.id,
                  convertedAt: new Date().toISOString(),
                }),
              },
            })
          )
      )

      return {
        nodes: createdNodes,
        edges: createdEdges,
      }
    })

    // 6. 返回成功响应
    return NextResponse.json({
      success: true,
      stats: {
        nodesCreated: result.nodes.length,
        edgesCreated: result.edges.length,
      },
      warnings: validationResult.warnings.length > 0 
        ? validationResult.warnings 
        : undefined,
    } as ConversionResponse)

  } catch (error) {
    console.error('转换失败:', error)
    
    // 返回错误响应
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '转换过程中发生未知错误',
      } as ConversionResponse,
      { status: 500 }
    )
  }
}
