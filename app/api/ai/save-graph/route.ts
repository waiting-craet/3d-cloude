/**
 * AI Save Graph API Endpoint
 * 
 * Saves AI-generated graph data to the database with merge resolution.
 * Uses Prisma transactions for atomicity.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { 
  getMergeResolutionService, 
  MergeDecision,
  NodeToCreate,
  NodeToUpdate 
} from '@/lib/services/merge-resolution';
import { LayoutEngine } from '@/lib/layout/LayoutEngine';
import { LayoutStrategy, Node2D, Edge as LayoutEdge } from '@/lib/layout/types';

function buildSeededPosition(index: number, total: number, radiusBase = 220): { x: number; y: number } {
  if (total <= 0) return { x: 0, y: 0 };
  const angle = (index / total) * Math.PI * 2;
  const layer = Math.floor(index / 24);
  const radius = radiusBase + layer * 110;
  return {
    x: Math.cos(angle) * radius + (Math.random() - 0.5) * 25,
    y: Math.sin(angle) * radius + (Math.random() - 0.5) * 25,
  };
}

function normalizeEdgeLabel(label?: string): string {
  const normalized = (label || '').trim();
  return normalized.length > 0 ? normalized : '关联';
}

function getEdgePairKey(fromNodeId: string, toNodeId: string): string {
  return fromNodeId <= toNodeId
    ? `${fromNodeId}|${toNodeId}`
    : `${toNodeId}|${fromNodeId}`;
}

function isWeakRelationshipLabel(label: string): boolean {
  return new Set(['关联', '相关', '联系', '共现', '有关']).has(label);
}

function pickBetterRelationshipLabel(currentLabel: string, candidateLabel: string): string {
  const currentWeak = isWeakRelationshipLabel(currentLabel);
  const candidateWeak = isWeakRelationshipLabel(candidateLabel);
  if (currentWeak !== candidateWeak) {
    return candidateWeak ? currentLabel : candidateLabel;
  }
  return candidateLabel.length < currentLabel.length ? candidateLabel : currentLabel;
}

function dedupeProcessedEdgesByPair(edges: Array<{ fromNodeId: string; toNodeId: string; label: string; properties: Record<string, any> }>) {
  const pairMap = new Map<string, { fromNodeId: string; toNodeId: string; label: string; properties: Record<string, any> }>();

  for (const edge of edges) {
    if (!edge.fromNodeId || !edge.toNodeId || edge.fromNodeId === edge.toNodeId) continue;

    const pairKey = getEdgePairKey(edge.fromNodeId, edge.toNodeId);
    const normalizedLabel = normalizeEdgeLabel(edge.label);
    const existing = pairMap.get(pairKey);
    if (!existing) {
      pairMap.set(pairKey, { ...edge, label: normalizedLabel });
      continue;
    }

    existing.label = pickBetterRelationshipLabel(existing.label, normalizedLabel);
    existing.properties = { ...existing.properties, ...edge.properties };
  }

  return Array.from(pairMap.values());
}

/**
 * Request body interface
 */
interface SaveGraphRequest {
  nodes: Array<{
    id: string;  // Temporary UUID from preview
    name: string;
    description?: string;  // Optional description
    type?: string;  // Optional, for backward compatibility
    properties?: Record<string, any>;  // Optional, for backward compatibility
    isDuplicate?: boolean;
    duplicateOf?: string;
  }>;
  edges: Array<{
    id: string;  // Temporary UUID from preview
    fromNodeId: string;
    toNodeId: string;
    label: string;
    properties?: Record<string, any>;  // Optional, for backward compatibility
    isRedundant?: boolean;
  }>;
  mergeDecisions: MergeDecision[];
  projectId: string;
  graphId?: string;  // If adding to existing graph
  graphName?: string;  // If creating new graph
  visualizationType: '2d' | '3d';
}

/**
 * POST /api/ai/save-graph
 * 
 * Saves AI-generated graph data to the database
 */
export async function POST(request: NextRequest) {
  let retryCount = 0;
  const maxRetries = 3; // Increased from 2 to 3
  
  while (retryCount <= maxRetries) {
    try {
      return await handleSaveGraph(request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry on transaction timeout or connection errors
      const isRetryableError = 
        errorMessage.includes('Unable to start a transaction') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ETIMEDOUT');
      
      if (isRetryableError && retryCount < maxRetries) {
        retryCount++;
        const waitTime = 2000 * Math.pow(2, retryCount - 1); // 2s, 4s, 8s
        console.log(`[AI Save Graph] Retrying after error (${retryCount}/${maxRetries}), waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If not a retryable error or max retries reached, throw the error
      throw error;
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new Error('Max retries exceeded');
}

async function handleSaveGraph(request: NextRequest) {
  try {
    // Parse request body
    const body: SaveGraphRequest = await request.json();
    
    // Debug logging
    console.log('[AI Save Graph] Received request body keys:', Object.keys(body));
    console.log('[AI Save Graph] Body structure:', {
      hasNodes: 'nodes' in body,
      hasEdges: 'edges' in body,
      hasProjectId: 'projectId' in body,
      hasGraphId: 'graphId' in body,
      hasGraphName: 'graphName' in body,
      nodesType: typeof body.nodes,
      edgesType: typeof body.edges,
      nodesIsArray: Array.isArray(body.nodes),
      edgesIsArray: Array.isArray(body.edges),
    });
    
    // Validate required fields
    if (!body.nodes || !Array.isArray(body.nodes)) {
      console.error('[AI Save Graph] Validation failed: nodes', { nodes: body.nodes });
      return NextResponse.json(
        {
          success: false,
          error: 'Nodes array is required.',
        },
        { status: 400 }
      );
    }

    if (!body.edges || !Array.isArray(body.edges)) {
      console.error('[AI Save Graph] Validation failed: edges', { edges: body.edges });
      return NextResponse.json(
        {
          success: false,
          error: 'Edges array is required.',
        },
        { status: 400 }
      );
    }

    if (!body.projectId) {
      console.error('[AI Save Graph] Validation failed: projectId', { projectId: body.projectId });
      return NextResponse.json(
        {
          success: false,
          error: 'Project ID is required.',
        },
        { status: 400 }
      );
    }

    if (!body.graphId && !body.graphName) {
      console.error('[AI Save Graph] Validation failed: graphId/graphName', { 
        graphId: body.graphId, 
        graphName: body.graphName 
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Either graphId or graphName is required.',
        },
        { status: 400 }
      );
    }

    // Log save start (server-side only)
    console.log('[AI Save Graph] Starting save:', {
      projectId: body.projectId,
      graphId: body.graphId,
      graphName: body.graphName,
      nodeCount: body.nodes.length,
      edgeCount: body.edges.length,
      mergeDecisionCount: body.mergeDecisions?.length || 0,
    });

    // Step 0: Verify project exists (outside transaction for faster validation)
    let project;
    try {
      project = await prisma.project.findUnique({
        where: { id: body.projectId },
      });
    } catch (dbError) {
      console.error('[AI Save Graph] Database query failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database is temporarily unavailable. Please wait a moment and try again.',
        },
        { status: 503 }
      );
    }

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found. Please select a valid project.',
        },
        { status: 404 }
      );
    }

    // Use Prisma transaction for atomicity with extended timeout
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Get or create graph
      let graph;
      
      if (body.graphId) {
        // Verify graph exists and belongs to project
        graph = await tx.graph.findUnique({
          where: { id: body.graphId },
          include: {
    nodes: {
              select: {
                id: true,
                name: true,
                metadata: true,
              },
            },
          },
        });

        if (!graph) {
          throw new Error('Graph not found.');
        }

        if (graph.projectId !== body.projectId) {
          throw new Error('Graph does not belong to the specified project.');
        }
      } else {
        // Create new graph
        graph = await tx.graph.create({
          data: {
            name: body.graphName!,
            projectId: body.projectId,
            nodeCount: 0,
            edgeCount: 0,
          },
          include: {
    nodes: {
              select: {
                id: true,
                name: true,
                metadata: true,
              },
            },
          },
        });
      }

      // Step 2: Process merge decisions using Merge Resolution Service
      const mergeService = getMergeResolutionService();
      
      // Get redundant edge indices (edges marked as redundant)
      const redundantEdgeIndices = body.edges
        .map((edge, index) => edge.isRedundant ? index : -1)
        .filter(index => index !== -1);

      // Prepare new nodes data
      const newNodes = body.nodes.map(n => ({
        tempId: n.id,
        name: n.name,
        type: n.type || 'entity',
        properties: n.description ? { description: n.description } : (n.properties || {}),
      }));

      // Create existing nodes map
      const existingNodesMap = new Map(
        graph.nodes.map(n => [n.id, { 
          name: n.name, 
          metadata: typeof n.metadata === 'string' ? n.metadata : JSON.stringify(n.metadata)
        }])
      );

      // Process nodes and get merge results
      const mergeResult = mergeService.mergeNodes(
        body.mergeDecisions || [],
        newNodes,
        existingNodesMap
      );

      // Step 3: Create new nodes using LayoutEngine for 3D layout
      // First, get all nodes (existing and new) to calculate proper layout
      
      // Prepare nodes for LayoutEngine
      const allNodesForLayout: Node2D[] = mergeResult.nodesToCreate.map((n: NodeToCreate, index: number) => {
        const seeded = buildSeededPosition(index, mergeResult.nodesToCreate.length || 1, 240);
        return {
          id: n.tempId,
          label: n.name,
          x2d: seeded.x,
          y2d: seeded.y,
        };
      });
      
      // Add existing nodes to layout calculation if any
      graph.nodes.forEach(n => {
        const fallbackSeed = buildSeededPosition(allNodesForLayout.length, Math.max(1, graph.nodes.length + mergeResult.nodesToCreate.length), 260);
        allNodesForLayout.push({
          id: n.id,
          label: n.name,
          x2d: typeof n.x === 'number' ? n.x : fallbackSeed.x,
          y2d: typeof n.y === 'number' ? n.y : fallbackSeed.y
        });
      });
      
      // Prepare edges for LayoutEngine
      const layoutEdges: LayoutEdge[] = body.edges.map((e) => ({
        id: e.tempId || `edge-${e.fromNodeId}-${e.toNodeId}`,
        source: e.fromNodeId,
        target: e.toNodeId
      }));

      const density = allNodesForLayout.length > 1
        ? layoutEdges.length / allNodesForLayout.length
        : 0;
      const selectedStrategy =
        density <= 0.7 ? LayoutStrategy.RADIAL : LayoutStrategy.FORCE_DIRECTED;

      // Initialize and run LayoutEngine
      console.log(`[AI Save] Running LayoutEngine for ${allNodesForLayout.length} nodes...`, {
        edges: layoutEdges.length,
        density: Number(density.toFixed(2)),
        strategy: selectedStrategy,
      });
      const layoutEngine = new LayoutEngine({
        iterations: allNodesForLayout.length > 90 ? 180 : 220,
        springLength: density <= 0.7 ? 95 : 75,
        repulsionStrength: allNodesForLayout.length > 100 ? 6800 : 5600,
        minNodeDistance: allNodesForLayout.length > 100 ? 42 : 50,
        heightVariation: allNodesForLayout.length > 100 ? 60 : 75,
        damping: 0.88
      });
      const { nodes: layoutNodes } = await layoutEngine.convert3D(
        allNodesForLayout,
        layoutEdges,
        selectedStrategy
      );
      
      // Map layout results back to tempIds
      const positions = new Map<string, {x: number, y: number, z: number}>();
      layoutNodes.forEach(n => {
        positions.set(n.id, { x: n.x3d, y: n.y3d, z: n.z3d });
      });

      const createdNodes = await Promise.all(
        mergeResult.nodesToCreate.map(async (nodeData: NodeToCreate, index: number) => {
          // Extract description from properties if it exists
          const description = nodeData.properties?.description || '';
          
          // Use calculated layout positions from LayoutEngine
          const pos = positions.get(nodeData.tempId) || { x: 0, y: 0, z: 0 };
          
          return await tx.node.create({
            data: {
              name: nodeData.name,
              type: nodeData.type || 'entity',
              description: description, // Save description to dedicated field
              metadata: JSON.stringify(nodeData.properties || {}),
              projectId: body.projectId,
              graphId: graph.id,
              x: pos.x,
              y: pos.y,
              z: pos.z,
              color: '#3b82f6', // 恢复默认蓝色
              size: 2.0, // 恢复默认大小
              shape: 'sphere',
            },
          });
        })
      );

      // Add created nodes to ID mapping
      for (let i = 0; i < mergeResult.nodesToCreate.length; i++) {
        const nodeData = mergeResult.nodesToCreate[i];
        const createdNode = createdNodes[i];
        mergeResult.nodeIdMapping.set(nodeData.tempId, createdNode.id);
      }

      // Step 4: Update existing nodes (merge)
      await Promise.all(
        mergeResult.nodesToUpdate.map(async (update: NodeToUpdate) => {
          // Parse metadata to extract description
          let description = '';
          try {
            const metadata = JSON.parse(update.updates.metadata);
            description = metadata.description || '';
          } catch (error) {
            console.warn('[AI Save Graph] Failed to parse metadata for description:', error);
          }
          
          return await tx.node.update({
            where: { id: update.id },
            data: {
              description: description, // Update description field
              metadata: update.updates.metadata,
              updatedAt: new Date(),
            },
          });
        })
      );

      // Step 5: Process edges with node ID mapping
      const processedEdges = mergeService.processEdges(
        body.edges.map(e => ({
          id: e.id,
          fromNodeId: e.fromNodeId,
          toNodeId: e.toNodeId,
          label: e.label,
          properties: e.properties || {},
        })),
        mergeResult.nodeIdMapping,
        redundantEdgeIndices
      );
      const uniqueProcessedEdges = dedupeProcessedEdgesByPair(processedEdges);

      // Step 6: Create edges
      const createdEdges = await Promise.all(
        uniqueProcessedEdges.map(async (edgeData) => {
          return await tx.edge.create({
            data: {
              fromNodeId: edgeData.fromNodeId,
              toNodeId: edgeData.toNodeId,
              label: edgeData.label,
              properties: JSON.stringify(edgeData.properties || {}),
              projectId: body.projectId,
              graphId: graph.id,
            },
          });
        })
      );

      // Step 7: Update graph statistics
      const totalNodes = await tx.node.count({
        where: { graphId: graph.id },
      });

      const totalEdges = await tx.edge.count({
        where: { graphId: graph.id },
      });

      await tx.graph.update({
        where: { id: graph.id },
        data: {
          nodeCount: totalNodes,
          edgeCount: totalEdges,
          updatedAt: new Date(),
        },
      });

      // Step 8: Update project statistics
      const projectTotalNodes = await tx.node.count({
        where: { projectId: body.projectId },
      });

      const projectTotalEdges = await tx.edge.count({
        where: { projectId: body.projectId },
      });

      await tx.project.update({
        where: { id: body.projectId },
        data: {
          nodeCount: projectTotalNodes,
          edgeCount: projectTotalEdges,
          updatedAt: new Date(),
        },
      });

      return {
        graphId: graph.id,
        graphName: graph.name,
        nodesCreated: createdNodes.length,
        nodesUpdated: mergeResult.nodesToUpdate.length,
        edgesCreated: createdEdges.length,
        totalNodes,
        totalEdges,
      };
    }, {
      maxWait: 15000, // Maximum time to wait for a transaction slot (15 seconds)
      timeout: 60000, // Maximum time for the transaction to complete (60 seconds)
    });

    console.log('[AI Save Graph] Save complete:', result);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    // Catch-all error handler
    console.error('[AI Save Graph] Error:', error);
    console.error('[AI Save Graph] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Check if it's a known error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return specific error messages for known issues
    if (errorMessage.includes('Project not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found. Please select a valid project.',
        },
        { status: 404 }
      );
    }
    
    if (errorMessage.includes('Graph not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Graph not found.',
        },
        { status: 404 }
      );
    }
    
    if (errorMessage.includes('does not belong')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Graph does not belong to the specified project.',
        },
        { status: 403 }
      );
    }
    
    // Database connection errors
    if (errorMessage.includes('connect') || errorMessage.includes('timeout')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection error. Please try again.',
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: `Failed to save graph: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
