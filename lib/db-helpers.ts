import { prisma } from './db'
import type { Node, Edge } from '@prisma/client'

// ==================== 节点操作 ====================

/**
 * 创建文档节点
 */
export async function createDocumentNode(data: {
  name: string
  content?: string
  description?: string
  metadata?: Record<string, any>
  tags?: string[]
  category?: string
  position?: { x: number; y: number; z: number }
}) {
  return await prisma.node.create({
    data: {
      name: data.name,
      type: 'document',
      content: data.content,
      description: data.description,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      category: data.category,
      x: data.position?.x ?? Math.random() * 20 - 10,
      y: data.position?.y ?? Math.random() * 10,
      z: data.position?.z ?? Math.random() * 20 - 10,
      color: '#FFB6C1',
      size: 2.0,
    },
  })
}

/**
 * 创建 Chunk 节点
 */
export async function createChunkNode(data: {
  name: string
  content: string
  documentId: string
  chunkIndex: number
  position?: { x: number; y: number; z: number }
}) {
  return await prisma.node.create({
    data: {
      name: data.name,
      type: 'chunk',
      content: data.content,
      documentId: data.documentId,
      chunkIndex: data.chunkIndex,
      x: data.position?.x ?? Math.random() * 20 - 10,
      y: data.position?.y ?? Math.random() * 10 - 20,
      z: data.position?.z ?? Math.random() * 20 - 10,
      color: '#FFE4B5',
      size: 1.5,
    },
  })
}

/**
 * 将文档分割成多个 chunks
 */
export async function splitDocumentIntoChunks(
  documentId: string,
  content: string,
  chunkSize: number = 500
) {
  const chunks: string[] = []
  
  // 简单的分割逻辑（按字符数）
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize))
  }

  const document = await prisma.node.findUnique({
    where: { id: documentId },
  })

  if (!document) {
    throw new Error('文档不存在')
  }

  // 创建 chunk 节点
  const chunkNodes = await Promise.all(
    chunks.map((chunk, index) =>
      createChunkNode({
        name: `${document.name} - Chunk ${index + 1}`,
        content: chunk,
        documentId,
        chunkIndex: index,
        position: {
          x: document.x + (index - chunks.length / 2) * 5,
          y: document.y - 10,
          z: document.z,
        },
      })
    )
  )

  // 创建 PART_OF 关系
  await Promise.all(
    chunkNodes.map((chunk) =>
      prisma.edge.create({
        data: {
          fromNodeId: chunk.id,
          toNodeId: documentId,
          label: 'PART_OF',
          weight: 1.0,
        },
      })
    )
  )

  return chunkNodes
}

/**
 * 获取文档的所有 chunks
 */
export async function getDocumentChunks(documentId: string) {
  return await prisma.node.findMany({
    where: {
      documentId,
      type: 'chunk',
    },
    orderBy: {
      chunkIndex: 'asc',
    },
  })
}

// ==================== 关系操作 ====================

/**
 * 创建节点之间的关系
 */
export async function createRelationship(data: {
  fromNodeId: string
  toNodeId: string
  label: string
  weight?: number
  properties?: Record<string, any>
  bidirectional?: boolean
}) {
  return await prisma.edge.create({
    data: {
      fromNodeId: data.fromNodeId,
      toNodeId: data.toNodeId,
      label: data.label,
      weight: data.weight ?? 1.0,
      properties: data.properties ? JSON.stringify(data.properties) : null,
      bidirectional: data.bidirectional ?? false,
    },
  })
}

/**
 * 获取节点的所有关系
 */
export async function getNodeRelationships(nodeId: string) {
  const [outgoing, incoming] = await Promise.all([
    prisma.edge.findMany({
      where: { fromNodeId: nodeId },
      include: { toNode: true },
    }),
    prisma.edge.findMany({
      where: { toNodeId: nodeId },
      include: { fromNode: true },
    }),
  ])

  return { outgoing, incoming }
}

// ==================== 搜索操作 ====================

/**
 * 搜索节点（按名称、内容、标签）
 */
export async function searchNodes(query: string) {
  return await prisma.node.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
        { content: { contains: query } },
        { tags: { contains: query } },
      ],
    },
    take: 20,
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * 按类型获取节点
 */
export async function getNodesByType(type: string) {
  return await prisma.node.findMany({
    where: { type },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * 按分类获取节点
 */
export async function getNodesByCategory(category: string) {
  return await prisma.node.findMany({
    where: { category },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

// ==================== 图谱统计 ====================

/**
 * 获取图谱统计信息
 */
export async function getGraphStats() {
  const [nodeCount, edgeCount, nodesByType] = await Promise.all([
    prisma.node.count(),
    prisma.edge.count(),
    prisma.node.groupBy({
      by: ['type'],
      _count: true,
    }),
  ])

  return {
    nodeCount,
    edgeCount,
    nodesByType: nodesByType.map((item) => ({
      type: item.type,
      count: item._count,
    })),
  }
}

/**
 * 获取节点的邻居节点
 */
export async function getNodeNeighbors(nodeId: string, depth: number = 1) {
  const visited = new Set<string>([nodeId])
  const neighbors: Node[] = []

  async function traverse(currentId: string, currentDepth: number) {
    if (currentDepth > depth) return

    const edges = await prisma.edge.findMany({
      where: {
        OR: [{ fromNodeId: currentId }, { toNodeId: currentId }],
      },
      include: {
        fromNode: true,
        toNode: true,
      },
    })

    for (const edge of edges) {
      const neighbor = edge.fromNodeId === currentId ? edge.toNode : edge.fromNode
      
      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id)
        neighbors.push(neighbor)
        
        if (currentDepth < depth) {
          await traverse(neighbor.id, currentDepth + 1)
        }
      }
    }
  }

  await traverse(nodeId, 1)
  return neighbors
}

// ==================== 批量操作 ====================

/**
 * 批量创建节点
 */
export async function bulkCreateNodes(nodes: Array<{
  name: string
  type: string
  content?: string
  x?: number
  y?: number
  z?: number
  color?: string
}>) {
  return await prisma.node.createMany({
    data: nodes.map((node) => ({
      name: node.name,
      type: node.type,
      content: node.content,
      x: node.x ?? Math.random() * 20 - 10,
      y: node.y ?? Math.random() * 10,
      z: node.z ?? Math.random() * 20 - 10,
      color: node.color ?? '#3b82f6',
    })),
  })
}

/**
 * 批量创建关系
 */
export async function bulkCreateEdges(edges: Array<{
  fromNodeId: string
  toNodeId: string
  label: string
  weight?: number
}>) {
  return await prisma.edge.createMany({
    data: edges.map((edge) => ({
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
      label: edge.label,
      weight: edge.weight ?? 1.0,
    })),
  })
}

/**
 * 清空所有数据
 */
export async function clearAllData() {
  await prisma.edge.deleteMany()
  await prisma.node.deleteMany()
  await prisma.searchHistory.deleteMany()
}
