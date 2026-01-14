import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { convertTo3DCoordinates, type Node2D } from '@/lib/coordinate-converter'
import { detectChanges, type WorkflowNode, type WorkflowConnection } from '@/lib/graph-sync'

interface SyncRequest {
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
}

interface SyncResponse {
  success: boolean
  stats: {
    nodesAdded: number
    nodesUpdated: number
    nodesDeleted: number
    edgesAdded: number
    edgesUpdated: number
    edgesDeleted: number
  }
  message?: string
  errors?: string[]
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const graphId = params.id
    const body: SyncRequest = await request.json()
    const { nodes: workflowNodes, connections: workflowConnections } = body

    console.log('🔄 开始同步图谱:', graphId)
    console.log('📊 工作流数据 - 节点:', workflowNodes.length, '连接:', workflowConnections.length)

    // 1. Verify graph exists
    const graph = await prisma.graph.findUnique({
      where: { id: graphId },
      select: { id: true, projectId: true, name: true },
    })

    if (!graph) {
      return NextResponse.json(
        {
          success: false,
          message: '图谱不存在',
        } as SyncResponse,
        { status: 404 }
      )
    }

    // 2. Fetch existing graph data
    const [dbNodesRaw, dbEdges] = await Promise.all([
      prisma.node.findMany({
        where: { graphId },
      }),
      prisma.edge.findMany({
        where: { graphId },
      }),
    ])

    // Convert database nodes to match the Node interface
    const dbNodes = dbNodesRaw.map(node => ({
      ...node,
      description: node.description || undefined,
      tags: node.tags || undefined,
      imageUrl: node.imageUrl || undefined,
      videoUrl: undefined, // videoUrl is not in the database schema
    }))

    console.log('📊 数据库数据 - 节点:', dbNodes.length, '边:', dbEdges.length)

    // 3. Detect changes
    const changes = detectChanges(workflowNodes, workflowConnections, dbNodes, dbEdges)

    console.log('🔍 检测到的变更:')
    console.log('  - 添加节点:', changes.nodesToAdd.length)
    console.log('  - 更新节点:', changes.nodesToUpdate.length)
    console.log('  - 删除节点:', changes.nodesToDelete.length)
    console.log('  - 添加边:', changes.edgesToAdd.length)
    console.log('  - 更新边:', changes.edgesToUpdate.length)
    console.log('  - 删除边:', changes.edgesToDelete.length)

    // 4. Execute sync operations in a transaction with extended timeout
    const result = await prisma.$transaction(async (tx) => {
      const stats = {
        nodesAdded: 0,
        nodesUpdated: 0,
        nodesDeleted: 0,
        edgesAdded: 0,
        edgesUpdated: 0,
        edgesDeleted: 0,
      }

      // Create a map to track new node IDs (tempId -> dbId)
      const nodeIdMap = new Map<string, string>()

      // Map existing node IDs
      for (const wNode of workflowNodes) {
        if (wNode.id && !wNode.tempId) {
          nodeIdMap.set(wNode.id, wNode.id)
        }
      }

      // 4.1 Delete nodes (and their edges will be cascade deleted)
      if (changes.nodesToDelete.length > 0) {
        // First delete edges connected to these nodes
        await tx.edge.deleteMany({
          where: {
            OR: [
              { fromNodeId: { in: changes.nodesToDelete } },
              { toNodeId: { in: changes.nodesToDelete } },
            ],
          },
        })

        const deleteResult = await tx.node.deleteMany({
          where: { id: { in: changes.nodesToDelete } },
        })
        stats.nodesDeleted = deleteResult.count
        console.log(`🗑️ 删除了 ${stats.nodesDeleted} 个节点`)
      }

      // 4.2 Update existing nodes (batch update)
      if (changes.nodesToUpdate.length > 0) {
        // Use Promise.all for parallel updates
        await Promise.all(
          changes.nodesToUpdate.map(change =>
            tx.node.update({
              where: { id: change.id },
              data: change.updates,
            })
          )
        )
        stats.nodesUpdated = changes.nodesToUpdate.length
        console.log(`✏️ 更新了 ${stats.nodesUpdated} 个节点`)
      }

      // 4.3 Add new nodes (batch create)
      if (changes.nodesToAdd.length > 0) {
        // Use Promise.all for parallel creates
        const createdNodes = await Promise.all(
          changes.nodesToAdd.map(async (wNode) => {
            // Convert 2D coordinates to 3D
            const node2d: Node2D = {
              id: wNode.tempId || wNode.id || `temp-${Date.now()}`,
              label: wNode.label,
              description: wNode.description || '',
              x: wNode.x,
              y: wNode.y,
            }
            
            const coords3d = convertTo3DCoordinates(
              node2d,
              workflowNodes.map(n => ({
                id: n.id || n.tempId || '',
                label: n.label,
                description: n.description || '',
                x: n.x,
                y: n.y,
              })),
              {
                heightVariation: 5,
                minNodeDistance: 2,
              }
            )

            const createdNode = await tx.node.create({
              data: {
                name: wNode.label,
                type: 'concept',
                description: wNode.description || '',
                x: coords3d.x3d,
                y: coords3d.y3d,
                z: coords3d.z3d,
                color: '#3b82f6',
                size: 1.5,
                imageUrl: wNode.imageUrl,
                projectId: graph.projectId,
                graphId: graphId,
              },
            })

            // Map the temporary/workflow ID to the new database ID
            const workflowId = wNode.tempId || wNode.id || node2d.id
            return { workflowId, dbId: createdNode.id }
          })
        )

        // Update the node ID map
        createdNodes.forEach(({ workflowId, dbId }) => {
          nodeIdMap.set(workflowId, dbId)
        })

        stats.nodesAdded = createdNodes.length
        console.log(`➕ 添加了 ${stats.nodesAdded} 个节点`)
      }

      // 4.4 Delete edges
      if (changes.edgesToDelete.length > 0) {
        const deleteResult = await tx.edge.deleteMany({
          where: { id: { in: changes.edgesToDelete } },
        })
        stats.edgesDeleted = deleteResult.count
        console.log(`🗑️ 删除了 ${stats.edgesDeleted} 条边`)
      }

      // 4.5 Update existing edges (batch update)
      if (changes.edgesToUpdate.length > 0) {
        await Promise.all(
          changes.edgesToUpdate.map(change =>
            tx.edge.update({
              where: { id: change.id },
              data: change.updates,
            })
          )
        )
        stats.edgesUpdated = changes.edgesToUpdate.length
        console.log(`✏️ 更新了 ${stats.edgesUpdated} 条边`)
      }

      // 4.6 Add new edges (batch create)
      if (changes.edgesToAdd.length > 0) {
        // Prepare edge data
        const edgesToCreate = changes.edgesToAdd
          .map(wConn => {
            // Resolve node IDs using the map
            const fromNodeId = nodeIdMap.get(wConn.from) || wConn.from
            const toNodeId = nodeIdMap.get(wConn.to) || wConn.to

            // Verify both nodes exist
            if (!fromNodeId || !toNodeId) {
              console.warn(`⚠️ 跳过边: 无法解析节点ID from=${wConn.from} to=${wConn.to}`)
              return null
            }

            return {
              fromNodeId,
              toNodeId,
              label: wConn.label || '',
              weight: 1.0,
              projectId: graph.projectId,
              graphId: graphId,
            }
          })
          .filter(edge => edge !== null)

        // Create edges in parallel
        if (edgesToCreate.length > 0) {
          await Promise.all(
            edgesToCreate.map(edgeData =>
              tx.edge.create({ data: edgeData! })
            )
          )
          stats.edgesAdded = edgesToCreate.length
          console.log(`➕ 添加了 ${stats.edgesAdded} 条边`)
        }
      }

      // 4.7 Update graph counts
      const finalNodeCount = await tx.node.count({ where: { graphId } })
      const finalEdgeCount = await tx.edge.count({ where: { graphId } })

      await tx.graph.update({
        where: { id: graphId },
        data: {
          nodeCount: finalNodeCount,
          edgeCount: finalEdgeCount,
        },
      })

      // Also update project counts
      const projectNodeCount = await tx.node.count({ where: { projectId: graph.projectId } })
      const projectEdgeCount = await tx.edge.count({ where: { projectId: graph.projectId } })

      await tx.project.update({
        where: { id: graph.projectId },
        data: {
          nodeCount: projectNodeCount,
          edgeCount: projectEdgeCount,
        },
      })

      return stats
    }, {
      maxWait: 10000, // 最大等待时间 10秒
      timeout: 15000, // 事务超时时间 15秒
    })

    console.log('✅ 同步完成:', result)

    return NextResponse.json({
      success: true,
      stats: result,
    } as SyncResponse)

  } catch (error) {
    console.error('❌ 同步失败:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '同步失败',
      } as SyncResponse,
      { status: 500 }
    )
  }
}
