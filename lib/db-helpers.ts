/**
 * Database Helper Utilities
 * 
 * Provides batch operations for creating nodes and edges to avoid
 * transaction timeouts and connection pool exhaustion.
 */

import { prisma } from '@/lib/db'
import type { Node, Edge } from '@prisma/client'

/**
 * Node data for batch creation
 */
export interface NodeData {
  name: string
  type: string
  description?: string | null
  x: number
  y: number
  z: number
  color: string
  size: number
  metadata?: string
}

/**
 * Edge data for batch creation
 */
export interface EdgeData {
  fromNodeId: string
  toNodeId: string
  label: string
  weight: number
  color: string
  properties?: string
}

/**
 * Batch creation result
 */
export interface BatchResult<T> {
  items: T[]
  errors: Error[]
}

/**
 * Create nodes in batches to avoid transaction timeouts
 * 
 * @param nodes Array of node data to create
 * @param batchSize Number of nodes to create per batch (default: 15)
 * @param delayMs Delay between batches in milliseconds (default: 100)
 * @returns Array of created nodes
 */
export async function createNodesBatch(
  nodes: NodeData[],
  batchSize: number = 15,
  delayMs: number = 100
): Promise<BatchResult<Node>> {
  const createdNodes: Node[] = []
  const errors: Error[] = []

  // Split nodes into batches
  const batches: NodeData[][] = []
  for (let i = 0; i < nodes.length; i += batchSize) {
    batches.push(nodes.slice(i, i + batchSize))
  }

  // Process each batch sequentially
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    
    try {
      // Create all nodes in this batch
      const batchNodes = await Promise.all(
        batch.map(nodeData =>
          prisma.node.create({
            data: nodeData,
          })
        )
      )
      
      createdNodes.push(...batchNodes)
      
      // Add delay between batches to allow connection cleanup
      if (i < batches.length - 1) {
        await delay(delayMs)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      errors.push(err)
      
      // If a batch fails, try to continue with remaining batches
      console.error(`Batch ${i + 1}/${batches.length} failed:`, err.message)
    }
  }

  return { items: createdNodes, errors }
}

/**
 * Create edges in batches to avoid transaction timeouts
 * 
 * @param edges Array of edge data to create
 * @param batchSize Number of edges to create per batch (default: 20)
 * @param delayMs Delay between batches in milliseconds (default: 50)
 * @returns Array of created edges
 */
export async function createEdgesBatch(
  edges: EdgeData[],
  batchSize: number = 20,
  delayMs: number = 50
): Promise<BatchResult<Edge>> {
  const createdEdges: Edge[] = []
  const errors: Error[] = []

  // Split edges into batches
  const batches: EdgeData[][] = []
  for (let i = 0; i < edges.length; i += batchSize) {
    batches.push(edges.slice(i, i + batchSize))
  }

  // Process each batch sequentially
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    
    try {
      // Create all edges in this batch
      const batchEdges = await Promise.all(
        batch.map(edgeData =>
          prisma.edge.create({
            data: edgeData,
          })
        )
      )
      
      createdEdges.push(...batchEdges)
      
      // Add delay between batches to allow connection cleanup
      if (i < batches.length - 1) {
        await delay(delayMs)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      errors.push(err)
      
      // If a batch fails, try to continue with remaining batches
      console.error(`Edge batch ${i + 1}/${batches.length} failed:`, err.message)
    }
  }

  return { items: createdEdges, errors }
}

/**
 * Delete all nodes and edges (for update mode)
 * Uses batching to avoid timeout on large datasets
 */
export async function clearAllGraphData(): Promise<void> {
  // Delete edges first (due to foreign key constraints)
  await prisma.edge.deleteMany({})
  
  // Then delete nodes
  await prisma.node.deleteMany({})
}

/**
 * Retry a database operation with exponential backoff
 * 
 * @param operation Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelayMs Initial delay in milliseconds
 * @returns Result of the operation
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Exponential backoff
      const delayTime = initialDelayMs * Math.pow(2, attempt)
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayTime}ms...`)
      await delay(delayTime)
    }
  }
  
  throw lastError || new Error('Operation failed after retries')
}

/**
 * Check if an error is a transaction timeout error
 */
export function isTransactionTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  
  const message = error.message.toLowerCase()
  return (
    message.includes('transaction') &&
    (message.includes('timeout') || message.includes('unable to start'))
  )
}

/**
 * Get a descriptive error message for database errors
 */
export function getDescriptiveErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unknown error occurred during database operation'
  }
  
  const message = error.message
  
  // Transaction timeout
  if (isTransactionTimeoutError(error)) {
    return 'Database transaction timeout: The operation took too long. Try with fewer nodes or contact support.'
  }
  
  // Connection errors
  if (message.includes('connection') || message.includes('connect')) {
    return 'Database connection error: Unable to connect to the database. Please try again.'
  }
  
  // Constraint violations
  if (message.includes('unique constraint') || message.includes('duplicate')) {
    return 'Data conflict: A node or connection with this identifier already exists.'
  }
  
  // Foreign key violations
  if (message.includes('foreign key') || message.includes('reference')) {
    return 'Data integrity error: Referenced node does not exist.'
  }
  
  // Default: return the original message
  return `Database error: ${message}`
}

/**
 * Utility function to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
