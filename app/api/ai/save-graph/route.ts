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

/**
 * Request body interface
 */
interface SaveGraphRequest {
  nodes: Array<{
    id: string;  // Temporary UUID from preview
    name: string;
    type: string;
    properties: Record<string, any>;
    isDuplicate?: boolean;
    duplicateOf?: string;
  }>;
  edges: Array<{
    id: string;  // Temporary UUID from preview
    fromNodeId: string;
    toNodeId: string;
    label: string;
    properties: Record<string, any>;
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
  try {
    // Parse request body
    const body: SaveGraphRequest = await request.json();
    
    // Validate required fields
    if (!body.nodes || !Array.isArray(body.nodes)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nodes array is required.',
        },
        { status: 400 }
      );
    }

    if (!body.edges || !Array.isArray(body.edges)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Edges array is required.',
        },
        { status: 400 }
      );
    }

    if (!body.projectId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project ID is required.',
        },
        { status: 400 }
      );
    }

    if (!body.graphId && !body.graphName) {
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

    // Use Prisma transaction for atomicity
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
        type: n.type,
        properties: n.properties,
      }));

      // Create existing nodes map
      const existingNodesMap = new Map(
        graph.nodes.map(n => [n.id, { name: n.name, metadata: n.metadata }])
      );

      // Process nodes and get merge results
      const mergeResult = mergeService.mergeNodes(
        body.mergeDecisions || [],
        newNodes,
        existingNodesMap
      );

      // Step 3: Create new nodes
      const createdNodes = await Promise.all(
        mergeResult.nodesToCreate.map(async (nodeData: NodeToCreate) => {
          return await tx.node.create({
            data: {
              name: nodeData.name,
              type: nodeData.type || 'entity',
              metadata: JSON.stringify(nodeData.properties || {}),
              projectId: body.projectId,
              graphId: graph.id,
              x: 0,
              y: 0,
              z: 0,
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
          return await tx.node.update({
            where: { id: update.id },
            data: {
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
          properties: e.properties,
        })),
        mergeResult.nodeIdMapping,
        redundantEdgeIndices
      );

      // Step 6: Create edges
      const createdEdges = await Promise.all(
        processedEdges.map(async (edgeData) => {
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
    });

    console.log('[AI Save Graph] Save complete:', result);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    // Catch-all error handler
    console.error('[AI Save Graph] Error:', error);
    
    // Check if it's a known error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Don't expose internal error details to client
    if (errorMessage.includes('not found') || errorMessage.includes('does not belong')) {
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save graph. Please try again.',
      },
      { status: 500 }
    );
  }
}
