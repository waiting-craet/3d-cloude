/**
 * AI Analysis API Endpoint
 * 
 * Receives document text, calls AI Model API, performs duplicate detection,
 * and returns structured graph data with conflict information.
 * 
 * Requirements: 1.1, 1.2, 1.3, 5.5, 6.4, 1.5, 12.1, 12.2, 12.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAIIntegrationService } from '@/lib/services/ai-integration';
import { getDuplicateDetectionService } from '@/lib/services/duplicate-detection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request body interface
 */
interface AnalyzeRequest {
  documentText: string;
  projectId?: string;
  graphId?: string;
  visualizationType: '2d' | '3d';
  customPrompt?: string; // 用户自定义提示词
}

/**
 * Preview node structure with duplicate detection metadata
 */
interface PreviewNode {
  id: string;  // Temporary UUID
  name: string;
  description?: string;  // Optional description
  type?: string;  // Optional, for backward compatibility
  properties?: Record<string, any>;  // Optional, for backward compatibility
  isDuplicate?: boolean;
  duplicateOf?: string;
  conflicts?: Array<{
    property: string;
    existingValue: any;
    newValue: any;
  }>;
}

/**
 * Preview edge structure with redundancy detection metadata
 */
interface PreviewEdge {
  id: string;  // Temporary UUID
  fromNodeId: string;
  toNodeId: string;
  label: string;
  properties?: Record<string, any>;  // Optional, for backward compatibility
  isRedundant?: boolean;
}

/**
 * POST /api/ai/analyze
 * 
 * Analyzes document text using AI and returns structured graph data
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: AnalyzeRequest = await request.json();
    
    // Validate required fields
    if (!body.documentText || body.documentText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Document text is required and cannot be empty.',
        },
        { status: 400 }
      );
    }

    if (!body.visualizationType || body.visualizationType !== '3d') {
      return NextResponse.json(
        {
          success: false,
          error: 'Visualization type must be "3d". 2D mode is no longer supported.',
        },
        { status: 400 }
      );
    }

    // Log analysis start (server-side only)
    console.log('[AI Analysis] Starting analysis:', {
      textLength: body.documentText.length,
      projectId: body.projectId,
      graphId: body.graphId,
      visualizationType: body.visualizationType,
    });

    // Check environment variables
    console.log('[AI Analysis] Environment check:', {
      hasApiKey: !!process.env.AI_API_KEY,
      apiKeyPrefix: process.env.AI_API_KEY?.substring(0, 10),
      hasEndpoint: !!process.env.AI_API_ENDPOINT,
      endpoint: process.env.AI_API_ENDPOINT,
    });

    // Step 1: Call AI Integration Service
    const aiService = getAIIntegrationService();
    let aiResult;
    
    try {
      aiResult = await aiService.analyzeDocument(body.documentText, body.customPrompt);
    } catch (error) {
      console.error('[AI Analysis] AI service error:', error);
      
      // Return user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        {
          success: false,
          error: errorMessage.includes('AI API') || errorMessage.includes('timeout') || errorMessage.includes('timed out') || errorMessage.includes('analyze')
            ? errorMessage
            : 'Unable to analyze document. Please try again later.',
        },
        { status: 500 }
      );
    }

    // Step 2: Create preview nodes with temporary IDs
    const nodeNameToTempId = new Map<string, string>();
    const previewNodes: PreviewNode[] = aiResult.entities.map(entity => {
      const tempId = uuidv4();
      nodeNameToTempId.set(entity.name.toLowerCase().trim(), tempId);
      
      return {
        id: tempId,
        name: entity.name,
        description: entity.description,  // Use description instead of type/properties
      };
    });

    // Step 3: Create preview edges with temporary node references
    const previewEdges: PreviewEdge[] = aiResult.relationships.map(rel => ({
      id: uuidv4(),
      fromNodeId: nodeNameToTempId.get(rel.from.toLowerCase().trim()) || '',
      toNodeId: nodeNameToTempId.get(rel.to.toLowerCase().trim()) || '',
      label: rel.type,
    }));

    // Step 4: Perform duplicate detection if graphId is provided
    let duplicateNodes = 0;
    let redundantEdges = 0;
    let conflicts = 0;

    if (body.graphId) {
      try {
        console.log('[AI Analysis] Starting duplicate detection for graphId:', body.graphId);
        
        // Add timeout to database queries
        const queryTimeout = 5000; // 5 seconds timeout
        
        // Fetch existing graph data with timeout
        const existingNodesPromise = prisma.node.findMany({
          where: { graphId: body.graphId },
          select: {
            id: true,
            name: true,
            metadata: true,
          },
          take: 1000, // Limit to prevent excessive data
        });

        const existingEdgesPromise = prisma.edge.findMany({
          where: { graphId: body.graphId },
          select: {
            fromNodeId: true,
            toNodeId: true,
            label: true,
          },
          take: 1000, // Limit to prevent excessive data
        });

        // Race against timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timed out')), queryTimeout)
        );

        const [existingNodes, existingEdges] = await Promise.race([
          Promise.all([existingNodesPromise, existingEdgesPromise]),
          timeoutPromise
        ]) as [any[], any[]];

        console.log('[AI Analysis] Fetched existing data:', {
          nodes: existingNodes.length,
          edges: existingEdges.length,
        });

        // Detect duplicate nodes
        const duplicateDetectionService = getDuplicateDetectionService();
        const duplicateInfo = duplicateDetectionService.detectDuplicateNodes(
          aiResult.entities.map(e => ({
            name: e.name,
            properties: e.properties || {},
          })),
          existingNodes
        );

        // Mark duplicate nodes and add conflict information
        for (const dup of duplicateInfo) {
          const previewNode = previewNodes[dup.newNodeIndex];
          if (previewNode) {
            previewNode.isDuplicate = true;
            previewNode.duplicateOf = dup.existingNodeId;
            previewNode.conflicts = dup.conflicts;
            
            duplicateNodes++;
            conflicts += dup.conflicts.length;
          }
        }

        // Create node name to ID mapping for existing nodes
        const nodeMapping = new Map<string, string>();
        for (const node of existingNodes) {
          nodeMapping.set(node.name.toLowerCase().trim(), node.id);
        }

        // Add mappings for duplicate nodes (map to existing node IDs)
        for (const dup of duplicateInfo) {
          const newNode = aiResult.entities[dup.newNodeIndex];
          if (newNode) {
            nodeMapping.set(newNode.name.toLowerCase().trim(), dup.existingNodeId);
          }
        }

        // Detect redundant edges
        const redundantIndices = duplicateDetectionService.detectRedundantEdges(
          aiResult.relationships.map(r => ({
            from: r.from,
            to: r.to,
            type: r.type,
          })),
          existingEdges,
          nodeMapping
        );

        // Mark redundant edges
        for (const index of redundantIndices) {
          const previewEdge = previewEdges[index];
          if (previewEdge) {
            previewEdge.isRedundant = true;
            redundantEdges++;
          }
        }

        console.log('[AI Analysis] Duplicate detection complete:', {
          duplicateNodes,
          redundantEdges,
          conflicts,
        });

      } catch (error) {
        // Enhanced error handling - log but don't fail the entire request
        console.error('[AI Analysis] Duplicate detection failed (continuing without it):', {
          error: error instanceof Error ? error.message : String(error),
          errorName: error instanceof Error ? error.name : 'Unknown',
          graphId: body.graphId,
        });

        // Log warning but continue - duplicate detection is optional
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          console.warn('[AI Analysis] Duplicate detection timed out - skipping duplicate check');
        } else if (errorMessage.includes('connection') || errorMessage.includes('Connection')) {
          console.warn('[AI Analysis] Database connection error - skipping duplicate check');
        } else {
          console.warn('[AI Analysis] Duplicate detection error - skipping duplicate check');
        }
        
        // Continue without duplicate detection
        // duplicateNodes, redundantEdges, and conflicts remain 0
      }
    }

    // Step 5: Return structured response
    const response = {
      success: true,
      data: {
        nodes: previewNodes,
        edges: previewEdges,
        stats: {
          totalNodes: previewNodes.length,
          totalEdges: previewEdges.length,
          duplicateNodes,
          redundantEdges,
          conflicts,
        },
      },
    };

    console.log('[AI Analysis] Analysis complete:', response.data.stats);

    return NextResponse.json(response);

  } catch (error) {
    // Catch-all error handler with detailed logging
    console.error('[AI Analysis] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      context: 'top_level_handler',
    });
    
    // Don't expose internal error details to client
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
