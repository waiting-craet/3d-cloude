/**
 * 冗余数据检测服务
 * 
 * 本服务用于检测导入数据中的冗余节点和边,确保不会重复导入已存在的数据。
 * 
 * 冗余判断标准:
 * - 节点: 基于 name 字段判断(导入模板的 label 字段映射为数据库的 name 字段)
 * - 边: 基于源节点name、目标节点name和关系类型(label)的组合判断
 */

import type { PrismaClient } from '@prisma/client'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 节点数据类型(用于导入)
 * 对应导入模板中的节点结构
 */
export interface NodeData {
  id?: string
  label: string          // 导入时的节点标识,映射到数据库的 name 字段
  description?: string
  x?: number
  y?: number
  z?: number
  color?: string
  size?: number
  shape?: string
}

/**
 * 边数据类型(用于导入)
 * 对应导入模板中的边结构
 */
export interface EdgeData {
  source: string         // 源节点的 label/name
  target: string         // 目标节点的 label/name
  label?: string         // 关系类型
}

/**
 * 数据库中的节点类型(简化版,仅包含检测所需字段)
 */
export interface ExistingNode {
  name: string
}

/**
 * 数据库中的边类型(简化版,仅包含检测所需字段)
 */
export interface ExistingEdge {
  label: string
  fromNode: {
    name: string
  }
  toNode: {
    name: string
  }
}

/**
 * 冗余检测结果
 */
export interface DuplicateDetectionResult {
  duplicateNodes: Set<string>      // 冗余节点的 name 集合
  duplicateEdges: Set<string>      // 冗余边的唯一键集合
  duplicateNodeCount: number       // 冗余节点数量
  duplicateEdgeCount: number       // 冗余边数量
}

/**
 * 过滤后的数据
 */
export interface FilteredData {
  nodes: NodeData[]                // 非冗余节点
  edges: EdgeData[]                // 非冗余边
  originalNodeCount: number        // 原始节点数量
  originalEdgeCount: number        // 原始边数量
}

/**
 * 解析后的图谱数据(与 graph-import.ts 保持一致)
 */
export interface ParsedGraphData {
  nodes: NodeData[]
  edges: EdgeData[]
  metadata?: {
    format: 'edge-list' | 'matrix-list' | 'unknown'
    version?: string
  }
}

// ============================================================================
// 核心检测函数
// ============================================================================

/**
 * 检测冗余节点
 * 
 * 基于节点的 name 字段判断是否冗余。
 * 使用 Set 数据结构实现 O(1) 查找性能。
 * 
 * @param uploadNodes - 上传文件中的节点
 * @param existingNodes - 数据库中已存在的节点
 * @returns 冗余节点的 name 集合
 */
export function detectDuplicateNodes(
  uploadNodes: NodeData[],
  existingNodes: ExistingNode[]
): Set<string> {
  // 创建现有节点 name 的 Set,用于 O(1) 查找
  const existingNodeNames = new Set<string>(
    existingNodes.map(node => node.name)
  )

  // 检测上传节点中的冗余项
  const duplicates = new Set<string>()
  
  for (const node of uploadNodes) {
    // 导入模板中的 label 字段对应数据库的 name 字段
    const nodeName = node.label
    
    if (existingNodeNames.has(nodeName)) {
      duplicates.add(nodeName)
    }
  }

  return duplicates
}

/**
 * 生成边的唯一键
 * 
 * 格式: ${sourceName}|${targetName}|${label}
 * 
 * @param source - 源节点 name
 * @param target - 目标节点 name
 * @param label - 关系类型
 * @returns 边的唯一键
 */
export function generateEdgeKey(
  source: string,
  target: string,
  label: string
): string {
  return `${source}|${target}|${label}`
}

/**
 * 检测冗余边
 * 
 * 基于源节点name、目标节点name和关系类型的组合判断是否冗余。
 * 使用唯一键格式: ${sourceName}|${targetName}|${label}
 * 
 * @param uploadEdges - 上传文件中的边
 * @param existingEdges - 数据库中已存在的边
 * @returns 冗余边的唯一键集合
 */
export function detectDuplicateEdges(
  uploadEdges: EdgeData[],
  existingEdges: ExistingEdge[]
): Set<string> {
  // 创建现有边的唯一键 Set,用于 O(1) 查找
  const existingEdgeKeys = new Set<string>(
    existingEdges.map(edge =>
      generateEdgeKey(
        edge.fromNode.name,
        edge.toNode.name,
        edge.label
      )
    )
  )

  // 检测上传边中的冗余项
  const duplicates = new Set<string>()
  
  for (const edge of uploadEdges) {
    const edgeKey = generateEdgeKey(
      edge.source,
      edge.target,
      edge.label || ''  // 如果没有 label,使用空字符串
    )
    
    if (existingEdgeKeys.has(edgeKey)) {
      duplicates.add(edgeKey)
    }
  }

  return duplicates
}

/**
 * 过滤冗余数据
 * 
 * 从原始数据中移除冗余的节点和边,返回过滤后的数据和统计信息。
 * 
 * @param nodes - 原始节点数据
 * @param edges - 原始边数据
 * @param duplicateNodes - 冗余节点的 name 集合
 * @param duplicateEdges - 冗余边的唯一键集合
 * @returns 过滤后的数据和统计信息
 */
export function filterNonDuplicateData(
  nodes: NodeData[],
  edges: EdgeData[],
  duplicateNodes: Set<string>,
  duplicateEdges: Set<string>
): FilteredData {
  // 过滤非冗余节点
  const filteredNodes = nodes.filter(
    node => !duplicateNodes.has(node.label)
  )

  // 过滤非冗余边
  const filteredEdges = edges.filter(edge => {
    const edgeKey = generateEdgeKey(
      edge.source,
      edge.target,
      edge.label || ''
    )
    return !duplicateEdges.has(edgeKey)
  })

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    originalNodeCount: nodes.length,
    originalEdgeCount: edges.length
  }
}

// ============================================================================
// 数据库查询函数
// ============================================================================

/**
 * 查询项目和图谱中的现有节点
 * 
 * 只查询 name 字段以优化性能。
 * 
 * @param prisma - Prisma 客户端实例
 * @param projectId - 项目 ID
 * @param graphId - 图谱 ID
 * @returns 现有节点列表
 */
export async function fetchExistingNodes(
  prisma: PrismaClient,
  projectId: string,
  graphId: string
): Promise<ExistingNode[]> {
  // Connection validation with retry logic
  const maxRetries = 2
  const timeout = 5000 // 5 seconds
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Validate Prisma client connection
      await prisma.$connect()
      
      // Execute query with timeout
      const result = await Promise.race([
        prisma.node.findMany({
          where: {
            projectId,
            graphId
          },
          select: {
            name: true
          }
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
      ])
      
      return result
    } catch (error) {
      const isLastAttempt = attempt === maxRetries
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Log the error
      console.error(`fetchExistingNodes attempt ${attempt + 1}/${maxRetries + 1} failed:`, errorMessage)
      
      // Check if it's a timeout error
      if (errorMessage.includes('timeout')) {
        console.warn(`Database query timeout in fetchExistingNodes (attempt ${attempt + 1})`)
      }
      
      // Check if it's a connection error
      if (errorMessage.includes('connection') || errorMessage.includes('connect')) {
        console.warn(`Database connection error in fetchExistingNodes (attempt ${attempt + 1})`)
      }
      
      // If this is the last attempt, return empty array for graceful degradation
      if (isLastAttempt) {
        console.error('fetchExistingNodes failed after all retries, returning empty array for graceful degradation')
        return []
      }
      
      // Wait before retry with exponential backoff
      const delayMs = 500 * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  // Fallback (should never reach here due to return in last attempt)
  return []
}

/**
 * 查询项目和图谱中的现有边
 * 
 * 只查询必要字段(label, fromNode.name, toNode.name)以优化性能。
 * 
 * @param prisma - Prisma 客户端实例
 * @param projectId - 项目 ID
 * @param graphId - 图谱 ID
 * @returns 现有边列表
 */
export async function fetchExistingEdges(
  prisma: PrismaClient,
  projectId: string,
  graphId: string
): Promise<ExistingEdge[]> {
  // Connection validation with retry logic
  const maxRetries = 2
  const timeout = 5000 // 5 seconds
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Validate Prisma client connection
      await prisma.$connect()
      
      // Execute query with timeout
      const result = await Promise.race([
        prisma.edge.findMany({
          where: {
            projectId,
            graphId
          },
          select: {
            label: true,
            fromNode: {
              select: {
                name: true
              }
            },
            toNode: {
              select: {
                name: true
              }
            }
          }
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
      ])
      
      return result
    } catch (error) {
      const isLastAttempt = attempt === maxRetries
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Log the error
      console.error(`fetchExistingEdges attempt ${attempt + 1}/${maxRetries + 1} failed:`, errorMessage)
      
      // Check if it's a timeout error
      if (errorMessage.includes('timeout')) {
        console.warn(`Database query timeout in fetchExistingEdges (attempt ${attempt + 1})`)
      }
      
      // Check if it's a connection error
      if (errorMessage.includes('connection') || errorMessage.includes('connect')) {
        console.warn(`Database connection error in fetchExistingEdges (attempt ${attempt + 1})`)
      }
      
      // If this is the last attempt, return empty array for graceful degradation
      if (isLastAttempt) {
        console.error('fetchExistingEdges failed after all retries, returning empty array for graceful degradation')
        return []
      }
      
      // Wait before retry with exponential backoff
      const delayMs = 500 * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  // Fallback (should never reach here due to return in last attempt)
  return []
}

// ============================================================================
// AI Analysis Duplicate Detection (for /api/ai/analyze)
// ============================================================================

/**
 * AI Entity type (from AI analysis)
 */
export interface AIEntity {
  name: string
  properties: Record<string, any>
}

/**
 * AI Relationship type (from AI analysis)
 */
export interface AIRelationship {
  from: string
  to: string
  type: string
}

/**
 * Existing node type for AI duplicate detection
 */
export interface ExistingNodeForAI {
  id: string
  name: string
  metadata?: any
}

/**
 * Existing edge type for AI duplicate detection
 */
export interface ExistingEdgeForAI {
  fromNodeId: string
  toNodeId: string
  label: string
}

/**
 * Duplicate node information with conflicts
 */
export interface DuplicateNodeInfo {
  newNodeIndex: number
  existingNodeId: string
  conflicts: Array<{
    property: string
    existingValue: any
    newValue: any
  }>
}

/**
 * Duplicate Detection Service for AI Analysis
 */
export interface DuplicateDetectionService {
  detectDuplicateNodes(
    entities: AIEntity[],
    existingNodes: ExistingNodeForAI[]
  ): DuplicateNodeInfo[]

  detectRedundantEdges(
    relationships: AIRelationship[],
    existingEdges: ExistingEdgeForAI[],
    nodeMapping: Map<string, string>
  ): number[]
}

/**
 * Implementation of Duplicate Detection Service for AI Analysis
 */
class DuplicateDetectionServiceImpl implements DuplicateDetectionService {
  /**
   * Detect duplicate nodes in AI-generated entities
   * Returns information about duplicates including property conflicts
   */
  detectDuplicateNodes(
    entities: AIEntity[],
    existingNodes: ExistingNodeForAI[]
  ): DuplicateNodeInfo[] {
    const duplicates: DuplicateNodeInfo[] = []

    // Create a map of existing nodes by normalized name
    const existingNodeMap = new Map<string, ExistingNodeForAI>()
    for (const node of existingNodes) {
      const normalizedName = node.name.toLowerCase().trim()
      existingNodeMap.set(normalizedName, node)
    }

    // Check each entity for duplicates
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i]
      const normalizedName = entity.name.toLowerCase().trim()
      const existingNode = existingNodeMap.get(normalizedName)

      if (existingNode) {
        // Found a duplicate - check for property conflicts
        const conflicts: Array<{
          property: string
          existingValue: any
          newValue: any
        }> = []

        // Compare properties
        const existingMetadata = existingNode.metadata || {}
        for (const [key, newValue] of Object.entries(entity.properties)) {
          const existingValue = existingMetadata[key]
          
          // If property exists in both and values differ, it's a conflict
          if (existingValue !== undefined && existingValue !== newValue) {
            conflicts.push({
              property: key,
              existingValue,
              newValue
            })
          }
        }

        duplicates.push({
          newNodeIndex: i,
          existingNodeId: existingNode.id,
          conflicts
        })
      }
    }

    return duplicates
  }

  /**
   * Detect redundant edges in AI-generated relationships
   * Returns indices of redundant edges
   */
  detectRedundantEdges(
    relationships: AIRelationship[],
    existingEdges: ExistingEdgeForAI[],
    nodeMapping: Map<string, string>
  ): number[] {
    const redundantIndices: number[] = []

    // Create a set of existing edge keys for O(1) lookup
    const existingEdgeKeys = new Set<string>()
    for (const edge of existingEdges) {
      const key = `${edge.fromNodeId}|${edge.toNodeId}|${edge.label}`
      existingEdgeKeys.add(key)
    }

    // Check each relationship for redundancy
    for (let i = 0; i < relationships.length; i++) {
      const rel = relationships[i]
      
      // Get node IDs from mapping (handles both new and duplicate nodes)
      const fromNodeId = nodeMapping.get(rel.from.toLowerCase().trim())
      const toNodeId = nodeMapping.get(rel.to.toLowerCase().trim())

      if (fromNodeId && toNodeId) {
        const edgeKey = `${fromNodeId}|${toNodeId}|${rel.type}`
        
        if (existingEdgeKeys.has(edgeKey)) {
          redundantIndices.push(i)
        }
      }
    }

    return redundantIndices
  }
}

/**
 * Factory function to get duplicate detection service instance
 */
export function getDuplicateDetectionService(): DuplicateDetectionService {
  return new DuplicateDetectionServiceImpl()
}

// ============================================================================
// 主检测流程
// ============================================================================

/**
 * 执行完整的冗余检测流程
 * 
 * 1. 从数据库查询现有节点和边
 * 2. 检测上传数据中的冗余项
 * 3. 过滤冗余数据
 * 4. 返回检测结果和过滤后的数据
 * 
 * @param prisma - Prisma 客户端实例
 * @param uploadData - 上传的图谱数据
 * @param projectId - 项目 ID
 * @param graphId - 图谱 ID
 * @returns 检测结果和过滤后的数据
 */
export async function detectAndFilterDuplicates(
  prisma: PrismaClient,
  uploadData: ParsedGraphData,
  projectId: string,
  graphId: string
): Promise<{
  filtered: FilteredData
  detection: DuplicateDetectionResult
}> {
  try {
    // 验证上传数据格式
    if (!uploadData.nodes || !Array.isArray(uploadData.nodes)) {
      const error = new Error('数据格式错误: 缺少有效的节点数组')
      console.error('Data format validation error:', {
        type: 'data_format_error',
        projectId,
        graphId,
        error: error.message,
        context: 'nodes array missing or invalid',
        timestamp: new Date().toISOString()
      })
      throw error
    }

    if (!uploadData.edges || !Array.isArray(uploadData.edges)) {
      const error = new Error('数据格式错误: 缺少有效的边数组')
      console.error('Data format validation error:', {
        type: 'data_format_error',
        projectId,
        graphId,
        error: error.message,
        context: 'edges array missing or invalid',
        timestamp: new Date().toISOString()
      })
      throw error
    }

    // 验证节点数据格式
    for (let i = 0; i < uploadData.nodes.length; i++) {
      const node = uploadData.nodes[i]
      if (!node.label || typeof node.label !== 'string') {
        const error = new Error(`数据格式错误: 节点 ${i} 缺少必要的 label 字段`)
        console.error('Data format validation error:', {
          type: 'data_format_error',
          projectId,
          graphId,
          error: error.message,
          context: `node at index ${i}`,
          nodeData: node,
          timestamp: new Date().toISOString()
        })
        throw error
      }
    }

    // 1. 查询现有数据
    let existingNodes: ExistingNode[]
    let existingEdges: ExistingEdge[]
    
    try {
      [existingNodes, existingEdges] = await Promise.all([
        fetchExistingNodes(prisma, projectId, graphId),
        fetchExistingEdges(prisma, projectId, graphId)
      ])
    } catch (error) {
      // 记录数据库查询错误
      console.error('Database query error:', {
        type: 'database_query_error',
        projectId,
        graphId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'fetching existing nodes and edges',
        timestamp: new Date().toISOString()
      })
      
      // 重新抛出带有描述性消息的错误
      throw new Error(`数据库查询错误: ${error instanceof Error ? error.message : String(error)}`)
    }

    // 2. 检测冗余数据
    const duplicateNodes = detectDuplicateNodes(
      uploadData.nodes,
      existingNodes
    )
    
    const duplicateEdges = detectDuplicateEdges(
      uploadData.edges,
      existingEdges
    )

    // 3. 过滤冗余数据
    const filtered = filterNonDuplicateData(
      uploadData.nodes,
      uploadData.edges,
      duplicateNodes,
      duplicateEdges
    )

    // 4. 构建检测结果
    const detection: DuplicateDetectionResult = {
      duplicateNodes,
      duplicateEdges,
      duplicateNodeCount: duplicateNodes.size,
      duplicateEdgeCount: duplicateEdges.size
    }

    return {
      filtered,
      detection
    }
  } catch (error) {
    // 如果错误已经被记录过(有特定类型),直接重新抛出
    if (error instanceof Error && 
        (error.message.includes('数据格式错误') || 
         error.message.includes('数据库查询错误'))) {
      throw error
    }

    // 记录未预期的错误
    console.error('Unexpected duplicate detection error:', {
      type: 'unexpected_error',
      projectId,
      graphId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })

    // 重新抛出错误,让调用方处理
    throw error
  }
}

// Types required by merge-resolution service

export enum ConflictType {
  DUPLICATE_NODES = 'DUPLICATE_NODES',
  CONFLICTING_EDGES = 'CONFLICTING_EDGES',
  MISSING_REFERENCES = 'MISSING_REFERENCES',
  CONTENT_CONFLICTS = 'CONTENT_CONFLICTS',
}

export interface DetectedConflict {
  type: ConflictType;
  affectedItems: {
    newItem?: any;
    existingItem?: any;
  };
  confidence: {
    overall: number;
  };
  description?: string;
}

export interface ResolutionOption {
  id: string;
  label: string;
  description: string;
  action: string;
  isDefault?: boolean;
}

export interface ConflictAnalysisResult {
  conflicts: DetectedConflict[];
  summary: {
    total: number;
    byType: Record<ConflictType, number>;
  };
}

export interface ClassifiedConflicts {
  duplicateNodes: DetectedConflict[];
  conflictingEdges: DetectedConflict[];
  missingReferences: DetectedConflict[];
  contentConflicts: DetectedConflict[];
}
