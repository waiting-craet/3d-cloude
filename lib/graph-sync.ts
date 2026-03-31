/**
 * Graph Data Synchronization Module
 * 
 * This module provides functions to detect changes between workflow data
 * and database data, enabling intelligent sync operations.
 */

import { Node, Edge } from '@/lib/store'

export interface WorkflowNode {
  id?: string  // Database ID if exists
  tempId?: string  // Temporary ID for new nodes
  label: string
  description?: string
  x: number
  y: number
  imageUrl?: string
  videoUrl?: string
}

export interface WorkflowConnection {
  id?: string  // Database ID if exists
  from: string  // Node ID or tempId
  to: string  // Node ID or tempId
  label?: string
}

export interface NodeChange {
  id: string
  updates: Partial<Node>
}

export interface EdgeChange {
  id: string
  updates: Partial<Edge>
}

export interface ChangeSet {
  nodesToAdd: WorkflowNode[]
  nodesToUpdate: NodeChange[]
  nodesToDelete: string[]  // Node IDs
  edgesToAdd: WorkflowConnection[]
  edgesToUpdate: EdgeChange[]
  edgesToDelete: string[]  // Edge IDs
}

/**
 * Detect changes between workflow nodes and database nodes
 */
export function detectNodeChanges(
  workflowNodes: WorkflowNode[],
  dbNodes: Node[]
): { toAdd: WorkflowNode[], toUpdate: NodeChange[], toDelete: string[] } {
  const toAdd: WorkflowNode[] = []
  const toUpdate: NodeChange[] = []
  const toDelete: string[] = []

  // Create a map of database nodes for quick lookup
  const dbNodeMap = new Map(dbNodes.map(node => [node.id, node]))
  
  // Create a set of workflow node IDs (only those with database IDs)
  const workflowNodeIds = new Set(
    workflowNodes
      .filter(n => n.id && !n.tempId)
      .map(n => n.id!)
  )

  // Check each workflow node
  for (const wNode of workflowNodes) {
    if (!wNode.id || wNode.tempId) {
      // No database ID = new node
      toAdd.push(wNode)
    } else {
      // Has database ID = check if it needs updating
      const dbNode = dbNodeMap.get(wNode.id)
      if (dbNode) {
        // Compare properties to see if update is needed
        const updates: Partial<Node> = {}
        
        if (wNode.label !== dbNode.name) {
          updates.name = wNode.label
        }
        if (wNode.description !== (dbNode.description || '')) {
          updates.description = wNode.description || ''
        }
        if (wNode.imageUrl !== dbNode.imageUrl) {
          updates.imageUrl = wNode.imageUrl
        }
        if (wNode.videoUrl !== dbNode.videoUrl) {
          updates.videoUrl = wNode.videoUrl
        }
        if (wNode.x !== dbNode.x) {
          updates.x = wNode.x
        }
        if (wNode.y !== dbNode.y) {
          updates.y = wNode.y
        }
        
        // If any property changed, add to update list
        if (Object.keys(updates).length > 0) {
          toUpdate.push({ id: wNode.id, updates })
        }
      } else {
        // Node has ID but doesn't exist in database - treat as new
        toAdd.push(wNode)
      }
    }
  }

  // Find deleted nodes (in database but not in workflow)
  for (const dbNode of dbNodes) {
    if (!workflowNodeIds.has(dbNode.id)) {
      toDelete.push(dbNode.id)
    }
  }

  return { toAdd, toUpdate, toDelete }
}

/**
 * Detect changes between workflow connections and database edges
 */
export function detectEdgeChanges(
  workflowConnections: WorkflowConnection[],
  dbEdges: Edge[],
  nodeIdMap: Map<string, string>  // tempId/workflowId -> dbId mapping
): { toAdd: WorkflowConnection[], toUpdate: EdgeChange[], toDelete: string[] } {
  const toAdd: WorkflowConnection[] = []
  const toUpdate: EdgeChange[] = []
  const toDelete: string[] = []

  // Create a map of database edges for quick lookup
  const dbEdgeMap = new Map(dbEdges.map(edge => [edge.id, edge]))
  
  // Create a set of workflow edge IDs (only those with database IDs)
  const workflowEdgeIds = new Set(
    workflowConnections
      .filter(c => c.id)
      .map(c => c.id!)
  )

  // Check each workflow connection
  for (const wConn of workflowConnections) {
    // Resolve node IDs (convert tempIds to dbIds if needed)
    const fromNodeId = nodeIdMap.get(wConn.from) || wConn.from
    const toNodeId = nodeIdMap.get(wConn.to) || wConn.to

    if (!wConn.id) {
      // No database ID = new edge
      toAdd.push({
        ...wConn,
        from: fromNodeId,
        to: toNodeId,
      })
    } else {
      // Has database ID = check if it needs updating
      const dbEdge = dbEdgeMap.get(wConn.id)
      if (dbEdge) {
        // Compare properties to see if update is needed
        const updates: Partial<Edge> = {}
        
        if (fromNodeId !== dbEdge.fromNodeId) {
          updates.fromNodeId = fromNodeId
        }
        if (toNodeId !== dbEdge.toNodeId) {
          updates.toNodeId = toNodeId
        }
        if ((wConn.label || '') !== (dbEdge.label || '')) {
          updates.label = wConn.label || ''
        }
        
        // If any property changed, add to update list
        if (Object.keys(updates).length > 0) {
          toUpdate.push({ id: wConn.id, updates })
        }
      } else {
        // Edge has ID but doesn't exist in database - treat as new
        toAdd.push({
          ...wConn,
          from: fromNodeId,
          to: toNodeId,
        })
      }
    }
  }

  // Find deleted edges (in database but not in workflow)
  for (const dbEdge of dbEdges) {
    if (!workflowEdgeIds.has(dbEdge.id)) {
      toDelete.push(dbEdge.id)
    }
  }

  return { toAdd, toUpdate, toDelete }
}

/**
 * Detect all changes between workflow data and database data
 */
export function detectChanges(
  workflowNodes: WorkflowNode[],
  workflowConnections: WorkflowConnection[],
  dbNodes: Node[],
  dbEdges: Edge[]
): ChangeSet {
  // Detect node changes
  const nodeChanges = detectNodeChanges(workflowNodes, dbNodes)
  
  // Create node ID mapping (for resolving edge references)
  // This will be populated with actual database IDs after nodes are synced
  const nodeIdMap = new Map<string, string>()
  
  // Map existing workflow node IDs to database IDs
  for (const wNode of workflowNodes) {
    if (wNode.id && !wNode.tempId) {
      nodeIdMap.set(wNode.id, wNode.id)
    }
  }
  
  // Detect edge changes
  const edgeChanges = detectEdgeChanges(workflowConnections, dbEdges, nodeIdMap)
  
  return {
    nodesToAdd: nodeChanges.toAdd,
    nodesToUpdate: nodeChanges.toUpdate,
    nodesToDelete: nodeChanges.toDelete,
    edgesToAdd: edgeChanges.toAdd,
    edgesToUpdate: edgeChanges.toUpdate,
    edgesToDelete: edgeChanges.toDelete,
  }
}
