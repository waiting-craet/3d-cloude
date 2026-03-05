/**
 * Enhanced Duplicate Detection Service
 * 
 * Compares AI-generated nodes and edges against existing graph data to identify
 * duplicates and conflicts with advanced classification and confidence scoring.
 * Implements comprehensive conflict detection including orphaned relationships
 * and content conflicts.
 * 
 * Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 5.1, 5.2, 5.3, 5.4, 7.1, 7.2
 */

/**
 * Types of conflicts that can be detected
 */
export enum ConflictType {
  DUPLICATE_NODES = 'duplicate_nodes',
  CONFLICTING_EDGES = 'conflicting_edges',
  MISSING_REFERENCES = 'missing_references',
  CONTENT_CONFLICTS = 'content_conflicts',
  PROPERTY_MISMATCHES = 'property_mismatches',
  TYPE_INCONSISTENCIES = 'type_inconsistencies'
}

/**
 * Confidence score for conflict detection
 */
export interface ConflictConfidenceScore {
  overall: number; // 0-1 confidence score
  factors: {
    nameSimilarity: number;
    contentOverlap: number;
    propertyAlignment: number;
    contextualRelevance: number;
  };
  reasoning: string[];
}

/**
 * Enhanced conflict information
 */
export interface DetectedConflict {
  type: ConflictType;
  confidence: ConflictConfidenceScore;
  description: string;
  affectedItems: {
    newItem: any;
    existingItem?: any;
  };
  resolutionOptions: ResolutionOption[];
}

/**
 * Resolution options for conflicts
 */
export interface ResolutionOption {
  id: string;
  label: string;
  description: string;
  action: 'keep_existing' | 'use_new' | 'merge' | 'skip' | 'manual_review';
}

/**
 * Orphaned relationship information
 */
export interface OrphanedRelationship {
  edgeIndex: number;
  missingNodeName: string;
  edgeData: NewEdgeData;
  reason: 'source_missing' | 'target_missing' | 'both_missing';
}

/**
 * Content conflict information
 */
export interface ContentConflict {
  field: string;
  conflictType: 'semantic_difference' | 'format_mismatch' | 'value_contradiction';
  existingContent: any;
  newContent: any;
  similarity: number; // 0-1 similarity score
}

/**
 * Comprehensive conflict analysis result
 */
export interface ConflictAnalysisResult {
  analyzedNodes: number;
  analyzedEdges: number;
  conflicts: DetectedConflict[];
  classifiedConflicts: ClassifiedConflicts;
  summary: {
    totalConflicts: number;
    highConfidenceConflicts: number;
    criticalConflicts: number;
  };
}

/**
 * Conflicts organized by type
 */
export interface ClassifiedConflicts {
  [ConflictType.DUPLICATE_NODES]: DetectedConflict[];
  [ConflictType.CONFLICTING_EDGES]: DetectedConflict[];
  [ConflictType.MISSING_REFERENCES]: DetectedConflict[];
  [ConflictType.CONTENT_CONFLICTS]: DetectedConflict[];
  [ConflictType.PROPERTY_MISMATCHES]: DetectedConflict[];
  [ConflictType.TYPE_INCONSISTENCIES]: DetectedConflict[];
}

/**
 * Generated graph data structure
 */
export interface GeneratedGraphData {
  nodes: NewNodeData[];
  edges: NewEdgeData[];
}

/**
 * Existing graph data structure
 */
export interface ExistingGraphData {
  nodes: ExistingNodeData[];
  edges: ExistingEdgeData[];
}

/**
 * Represents a conflict between property values
 */
export interface PropertyConflict {
  property: string;
  existingValue: any;
  newValue: any;
}

/**
 * Information about a detected duplicate node
 */
export interface DuplicateNodeInfo {
  newNodeIndex: number;
  existingNodeId: string;
  conflicts: PropertyConflict[];
}

/**
 * Node data from AI analysis
 */
export interface NewNodeData {
  name: string;
  properties: Record<string, any>;
}

/**
 * Existing node data from database
 */
export interface ExistingNodeData {
  id: string;
  name: string;
  metadata: string | null;
}

/**
 * Edge data from AI analysis
 */
export interface NewEdgeData {
  from: string;  // Entity name
  to: string;    // Entity name
  type: string;
}

/**
 * Existing edge data from database
 */
export interface ExistingEdgeData {
  fromNodeId: string;
  toNodeId: string;
  label: string;
}

/**
 * Enhanced Duplicate Detection Service interface
 */
export interface DuplicateDetectionService {
  /**
   * Detects duplicate nodes by comparing labels (case-insensitive)
   * 
   * @param newNodes - Array of AI-generated nodes to check
   * @param existingNodes - Array of existing nodes from the database
   * @returns Array of duplicate node information including conflicts
   */
  detectDuplicateNodes(
    newNodes: NewNodeData[],
    existingNodes: ExistingNodeData[]
  ): DuplicateNodeInfo[];

  /**
   * Detects redundant edges by comparing source, target, and relationship type
   * 
   * @param newEdges - Array of AI-generated edges to check
   * @param existingEdges - Array of existing edges from the database
   * @param nodeMapping - Map of node names to their database IDs
   * @returns Array of indices of redundant edges
   */
  detectRedundantEdges(
    newEdges: NewEdgeData[],
    existingEdges: ExistingEdgeData[],
    nodeMapping: Map<string, string>
  ): number[];

  /**
   * Comprehensive conflict analysis with classification and confidence scoring
   * 
   * @param generatedGraph - Generated graph data from AI
   * @param existingGraph - Existing graph data from database
   * @returns Comprehensive conflict analysis result
   */
  analyzeConflicts(
    generatedGraph: GeneratedGraphData,
    existingGraph: ExistingGraphData
  ): ConflictAnalysisResult;

  /**
   * Classify conflicts into distinct categories
   * 
   * @param conflicts - Array of detected conflicts
   * @returns Conflicts organized by type
   */
  classifyConflicts(conflicts: DetectedConflict[]): ClassifiedConflicts;

  /**
   * Calculate confidence scores for conflict detection
   * 
   * @param newItem - New item being analyzed
   * @param existingItem - Existing item for comparison
   * @param conflictType - Type of conflict being analyzed
   * @returns Confidence score with reasoning
   */
  calculateConfidenceScore(
    newItem: any,
    existingItem: any,
    conflictType: ConflictType
  ): ConflictConfidenceScore;

  /**
   * Detect orphaned relationships where target nodes don't exist
   * 
   * @param edges - Array of new edges to check
   * @param nodeMapping - Map of node names to their database IDs
   * @returns Array of orphaned relationships
   */
  detectOrphanedRelationships(
    edges: NewEdgeData[],
    nodeMapping: Map<string, string>
  ): OrphanedRelationship[];

  /**
   * Identify content conflicts within node properties
   * 
   * @param newNode - New node data
   * @param existingNode - Existing node data
   * @returns Array of content conflicts
   */
  detectContentConflicts(
    newNode: NewNodeData,
    existingNode: ExistingNodeData
  ): ContentConflict[];
}

/**
 * Implementation of Duplicate Detection Service
 */
export class DuplicateDetectionServiceImpl implements DuplicateDetectionService {
  /**
   * Detects duplicate nodes using case-insensitive name comparison
   * and identifies property conflicts
   */
  detectDuplicateNodes(
    newNodes: NewNodeData[],
    existingNodes: ExistingNodeData[]
  ): DuplicateNodeInfo[] {
    const duplicates: DuplicateNodeInfo[] = [];

    // Create a map of lowercase names to existing nodes for efficient lookup
    const existingNodesMap = new Map<string, ExistingNodeData>();
    for (const existingNode of existingNodes) {
      const normalizedName = existingNode.name.toLowerCase().trim();
      existingNodesMap.set(normalizedName, existingNode);
    }

    // Check each new node for duplicates
    for (let i = 0; i < newNodes.length; i++) {
      const newNode = newNodes[i];
      const normalizedNewName = newNode.name.toLowerCase().trim();
      
      const existingNode = existingNodesMap.get(normalizedNewName);
      
      if (existingNode) {
        // Found a duplicate - now check for property conflicts
        const conflicts = this.detectPropertyConflicts(
          newNode.properties,
          this.parseMetadata(existingNode.metadata)
        );

        duplicates.push({
          newNodeIndex: i,
          existingNodeId: existingNode.id,
          conflicts,
        });
      }
    }

    return duplicates;
  }

  /**
   * Detects property conflicts between new and existing node properties
   * 
   * @param newProps - Properties from the new node
   * @param existingProps - Properties from the existing node
   * @returns Array of property conflicts
   */
  private detectPropertyConflicts(
    newProps: Record<string, any>,
    existingProps: Record<string, any>
  ): PropertyConflict[] {
    const conflicts: PropertyConflict[] = [];

    // Check each property in the new node
    for (const [key, newValue] of Object.entries(newProps)) {
      // Skip if property doesn't exist in existing node
      if (!(key in existingProps)) {
        continue;
      }

      const existingValue = existingProps[key];

      // Compare values - consider them different if they don't match
      if (!this.areValuesEqual(existingValue, newValue)) {
        conflicts.push({
          property: key,
          existingValue,
          newValue,
        });
      }
    }

    return conflicts;
  }

  /**
   * Compares two values for equality, handling different types
   * 
   * @param value1 - First value to compare
   * @param value2 - Second value to compare
   * @returns True if values are equal, false otherwise
   */
  private areValuesEqual(value1: any, value2: any): boolean {
    // Handle null/undefined
    if (value1 === null || value1 === undefined) {
      return value2 === null || value2 === undefined;
    }
    if (value2 === null || value2 === undefined) {
      return false;
    }

    // Handle primitive types
    if (typeof value1 !== 'object' && typeof value2 !== 'object') {
      // For strings, do case-insensitive comparison
      if (typeof value1 === 'string' && typeof value2 === 'string') {
        return value1.toLowerCase().trim() === value2.toLowerCase().trim();
      }
      return value1 === value2;
    }

    // Handle arrays
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length !== value2.length) {
        return false;
      }
      for (let i = 0; i < value1.length; i++) {
        if (!this.areValuesEqual(value1[i], value2[i])) {
          return false;
        }
      }
      return true;
    }

    // Handle objects
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      const keys1 = Object.keys(value1);
      const keys2 = Object.keys(value2);
      
      if (keys1.length !== keys2.length) {
        return false;
      }
      
      for (const key of keys1) {
        if (!keys2.includes(key)) {
          return false;
        }
        if (!this.areValuesEqual(value1[key], value2[key])) {
          return false;
        }
      }
      return true;
    }

    // Different types
    return false;
  }

  /**
   * Parses metadata JSON string into an object
   * 
   * @param metadata - JSON string or null
   * @returns Parsed object or empty object if parsing fails
   */
  private parseMetadata(metadata: string | null): Record<string, any> {
    if (!metadata) {
      return {};
    }

    try {
      const parsed = JSON.parse(metadata);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (error) {
      console.warn('[Duplicate Detection] Failed to parse metadata:', error);
      return {};
    }
  }

  /**
   * Detects redundant edges by comparing source, target, and relationship type
   */
  detectRedundantEdges(
    newEdges: NewEdgeData[],
    existingEdges: ExistingEdgeData[],
    nodeMapping: Map<string, string>
  ): number[] {
    const redundantIndices: number[] = [];

    // Create a set of existing edge signatures for efficient lookup
    // Signature format: "fromNodeId|toNodeId|label"
    const existingEdgeSignatures = new Set<string>();
    
    for (const edge of existingEdges) {
      const signature = this.createEdgeSignature(
        edge.fromNodeId,
        edge.toNodeId,
        edge.label
      );
      existingEdgeSignatures.add(signature);
    }

    // Check each new edge for redundancy
    for (let i = 0; i < newEdges.length; i++) {
      const newEdge = newEdges[i];
      
      // Get the node IDs from the mapping
      const fromId = nodeMapping.get(newEdge.from.toLowerCase().trim());
      const toId = nodeMapping.get(newEdge.to.toLowerCase().trim());

      // Skip if we can't find the node IDs (shouldn't happen if data is valid)
      if (!fromId || !toId) {
        continue;
      }

      // Create signature for the new edge
      const signature = this.createEdgeSignature(fromId, toId, newEdge.type);

      // Check if this edge already exists
      if (existingEdgeSignatures.has(signature)) {
        redundantIndices.push(i);
      }
    }

    return redundantIndices;
  }

  /**
   * Creates a unique signature for an edge
   * Uses case-insensitive label comparison
   * 
   * @param fromNodeId - Source node ID
   * @param toNodeId - Target node ID
   * @param label - Edge label/type
   * @returns Unique signature string
   */
  private createEdgeSignature(
    fromNodeId: string,
    toNodeId: string,
    label: string
  ): string {
    // Normalize label to lowercase for case-insensitive comparison
    const normalizedLabel = label.toLowerCase().trim();
    return `${fromNodeId}|${toNodeId}|${normalizedLabel}`;
  }

  /**
   * Comprehensive conflict analysis with classification and confidence scoring
   */
  analyzeConflicts(
    generatedGraph: GeneratedGraphData,
    existingGraph: ExistingGraphData
  ): ConflictAnalysisResult {
    const conflicts: DetectedConflict[] = [];

    // Create node mapping for efficient lookups
    const nodeMapping = this.createNodeMapping(generatedGraph.nodes, existingGraph.nodes);

    // Analyze node conflicts
    const nodeConflicts = this.analyzeNodeConflicts(generatedGraph.nodes, existingGraph.nodes);
    conflicts.push(...nodeConflicts);

    // Analyze edge conflicts
    const edgeConflicts = this.analyzeEdgeConflicts(generatedGraph.edges, existingGraph.edges, nodeMapping);
    conflicts.push(...edgeConflicts);

    // Detect orphaned relationships
    const orphanedRelationships = this.detectOrphanedRelationships(generatedGraph.edges, nodeMapping);
    const orphanedConflicts = orphanedRelationships.map(orphaned => this.createOrphanedConflict(orphaned));
    conflicts.push(...orphanedConflicts);

    // Classify conflicts
    const classifiedConflicts = this.classifyConflicts(conflicts);

    // Generate summary
    const summary = this.generateConflictSummary(conflicts);

    return {
      analyzedNodes: generatedGraph.nodes.length,
      analyzedEdges: generatedGraph.edges.length,
      conflicts,
      classifiedConflicts,
      summary
    };
  }

  /**
   * Classify conflicts into distinct categories
   */
  classifyConflicts(conflicts: DetectedConflict[]): ClassifiedConflicts {
    const classified: ClassifiedConflicts = {
      [ConflictType.DUPLICATE_NODES]: [],
      [ConflictType.CONFLICTING_EDGES]: [],
      [ConflictType.MISSING_REFERENCES]: [],
      [ConflictType.CONTENT_CONFLICTS]: [],
      [ConflictType.PROPERTY_MISMATCHES]: [],
      [ConflictType.TYPE_INCONSISTENCIES]: []
    };

    for (const conflict of conflicts) {
      classified[conflict.type].push(conflict);
    }

    return classified;
  }

  /**
   * Calculate confidence scores for conflict detection
   */
  calculateConfidenceScore(
    newItem: any,
    existingItem: any,
    conflictType: ConflictType
  ): ConflictConfidenceScore {
    const factors = {
      nameSimilarity: this.calculateNameSimilarity(newItem, existingItem),
      contentOverlap: this.calculateContentOverlap(newItem, existingItem),
      propertyAlignment: this.calculatePropertyAlignment(newItem, existingItem),
      contextualRelevance: this.calculateContextualRelevance(newItem, existingItem, conflictType)
    };

    // Calculate overall confidence based on conflict type
    const overall = this.calculateOverallConfidence(factors, conflictType);

    const reasoning = this.generateConfidenceReasoning(factors, conflictType);

    return {
      overall,
      factors,
      reasoning
    };
  }

  /**
   * Detect orphaned relationships where target nodes don't exist
   */
  detectOrphanedRelationships(
    edges: NewEdgeData[],
    nodeMapping: Map<string, string>
  ): OrphanedRelationship[] {
    const orphaned: OrphanedRelationship[] = [];

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const fromExists = nodeMapping.has(edge.from.toLowerCase().trim());
      const toExists = nodeMapping.has(edge.to.toLowerCase().trim());

      if (!fromExists || !toExists) {
        let reason: 'source_missing' | 'target_missing' | 'both_missing';
        let missingNodeName: string;

        if (!fromExists && !toExists) {
          reason = 'both_missing';
          missingNodeName = `${edge.from}, ${edge.to}`;
        } else if (!fromExists) {
          reason = 'source_missing';
          missingNodeName = edge.from;
        } else {
          reason = 'target_missing';
          missingNodeName = edge.to;
        }

        orphaned.push({
          edgeIndex: i,
          missingNodeName,
          edgeData: edge,
          reason
        });
      }
    }

    return orphaned;
  }

  /**
   * Identify content conflicts within node properties
   */
  detectContentConflicts(
    newNode: NewNodeData,
    existingNode: ExistingNodeData
  ): ContentConflict[] {
    const conflicts: ContentConflict[] = [];
    const existingProps = this.parseMetadata(existingNode.metadata);

    for (const [field, newContent] of Object.entries(newNode.properties)) {
      if (field in existingProps) {
        const existingContent = existingProps[field];
        const conflict = this.analyzeContentConflict(field, existingContent, newContent);
        
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    return conflicts;
  }

  // Private helper methods for enhanced functionality

  private createNodeMapping(newNodes: NewNodeData[], existingNodes: ExistingNodeData[]): Map<string, string> {
    const mapping = new Map<string, string>();

    // Add existing nodes to mapping
    for (const node of existingNodes) {
      mapping.set(node.name.toLowerCase().trim(), node.id);
    }

    // Add new nodes that don't conflict (they would get new IDs)
    for (const node of newNodes) {
      const normalizedName = node.name.toLowerCase().trim();
      if (!mapping.has(normalizedName)) {
        // Generate a temporary ID for new nodes
        mapping.set(normalizedName, `temp_${Date.now()}_${Math.random()}`);
      }
    }

    return mapping;
  }

  private analyzeNodeConflicts(newNodes: NewNodeData[], existingNodes: ExistingNodeData[]): DetectedConflict[] {
    const conflicts: DetectedConflict[] = [];
    const duplicates = this.detectDuplicateNodes(newNodes, existingNodes);

    for (const duplicate of duplicates) {
      const newNode = newNodes[duplicate.newNodeIndex];
      const existingNode = existingNodes.find(n => n.id === duplicate.existingNodeId);

      if (existingNode) {
        const confidence = this.calculateConfidenceScore(newNode, existingNode, ConflictType.DUPLICATE_NODES);
        const contentConflicts = this.detectContentConflicts(newNode, existingNode);

        // Create duplicate node conflict
        conflicts.push({
          type: ConflictType.DUPLICATE_NODES,
          confidence,
          description: `节点 "${newNode.name}" 与现有节点冲突`,
          affectedItems: {
            newItem: newNode,
            existingItem: existingNode
          },
          resolutionOptions: this.generateNodeResolutionOptions(newNode, existingNode)
        });

        // Create content conflicts if any
        for (const contentConflict of contentConflicts) {
          conflicts.push({
            type: ConflictType.CONTENT_CONFLICTS,
            confidence: this.calculateConfidenceScore(
              contentConflict.newContent,
              contentConflict.existingContent,
              ConflictType.CONTENT_CONFLICTS
            ),
            description: `节点 "${newNode.name}" 的 ${contentConflict.field} 字段内容冲突`,
            affectedItems: {
              newItem: { field: contentConflict.field, content: contentConflict.newContent },
              existingItem: { field: contentConflict.field, content: contentConflict.existingContent }
            },
            resolutionOptions: this.generateContentResolutionOptions(contentConflict)
          });
        }
      }
    }

    return conflicts;
  }

  private analyzeEdgeConflicts(
    newEdges: NewEdgeData[],
    existingEdges: ExistingEdgeData[],
    nodeMapping: Map<string, string>
  ): DetectedConflict[] {
    const conflicts: DetectedConflict[] = [];
    const redundantIndices = this.detectRedundantEdges(newEdges, existingEdges, nodeMapping);

    for (const index of redundantIndices) {
      const newEdge = newEdges[index];
      const confidence = this.calculateConfidenceScore(newEdge, null, ConflictType.CONFLICTING_EDGES);

      conflicts.push({
        type: ConflictType.CONFLICTING_EDGES,
        confidence,
        description: `关系 "${newEdge.from}" -> "${newEdge.to}" (${newEdge.type}) 已存在`,
        affectedItems: {
          newItem: newEdge
        },
        resolutionOptions: this.generateEdgeResolutionOptions(newEdge)
      });
    }

    return conflicts;
  }

  private createOrphanedConflict(orphaned: OrphanedRelationship): DetectedConflict {
    const confidence = this.calculateConfidenceScore(orphaned.edgeData, null, ConflictType.MISSING_REFERENCES);

    return {
      type: ConflictType.MISSING_REFERENCES,
      confidence,
      description: `关系引用了不存在的节点: ${orphaned.missingNodeName}`,
      affectedItems: {
        newItem: orphaned.edgeData
      },
      resolutionOptions: this.generateOrphanedResolutionOptions(orphaned)
    };
  }

  private generateConflictSummary(conflicts: DetectedConflict[]) {
    const highConfidenceConflicts = conflicts.filter(c => c.confidence.overall >= 0.8).length;
    const criticalConflicts = conflicts.filter(c => 
      c.type === ConflictType.MISSING_REFERENCES || 
      (c.type === ConflictType.DUPLICATE_NODES && c.confidence.overall >= 0.9)
    ).length;

    return {
      totalConflicts: conflicts.length,
      highConfidenceConflicts,
      criticalConflicts
    };
  }

  // Confidence calculation helper methods

  private calculateNameSimilarity(newItem: any, existingItem: any): number {
    if (!newItem?.name || !existingItem?.name) return 0;
    
    const name1 = newItem.name.toLowerCase().trim();
    const name2 = existingItem.name.toLowerCase().trim();
    
    if (name1 === name2) return 1.0;
    
    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(name1, name2);
    const maxLength = Math.max(name1.length, name2.length);
    return maxLength === 0 ? 1.0 : 1.0 - (distance / maxLength);
  }

  private calculateContentOverlap(newItem: any, existingItem: any): number {
    if (!newItem?.properties || !existingItem) return 0;
    
    const existingProps = typeof existingItem.metadata === 'string' 
      ? this.parseMetadata(existingItem.metadata)
      : existingItem.properties || {};
    
    const newProps = newItem.properties;
    const commonKeys = Object.keys(newProps).filter(key => key in existingProps);
    
    if (commonKeys.length === 0) return 0;
    
    let totalSimilarity = 0;
    for (const key of commonKeys) {
      const similarity = this.calculateValueSimilarity(newProps[key], existingProps[key]);
      totalSimilarity += similarity;
    }
    
    return totalSimilarity / commonKeys.length;
  }

  private calculatePropertyAlignment(newItem: any, existingItem: any): number {
    if (!newItem?.properties || !existingItem) return 0;
    
    const existingProps = typeof existingItem.metadata === 'string' 
      ? this.parseMetadata(existingItem.metadata)
      : existingItem.properties || {};
    
    const newKeys = Object.keys(newItem.properties);
    const existingKeys = Object.keys(existingProps);
    const allKeys = new Set([...newKeys, ...existingKeys]);
    
    if (allKeys.size === 0) return 1.0;
    
    const commonKeys = newKeys.filter(key => existingKeys.includes(key));
    return commonKeys.length / allKeys.size;
  }

  private calculateContextualRelevance(newItem: any, existingItem: any, conflictType: ConflictType): number {
    // Context-specific relevance based on conflict type
    switch (conflictType) {
      case ConflictType.DUPLICATE_NODES:
        return this.calculateNameSimilarity(newItem, existingItem) * 0.8 + 
               this.calculateContentOverlap(newItem, existingItem) * 0.2;
      
      case ConflictType.CONFLICTING_EDGES:
        return 0.9; // High relevance for edge conflicts
      
      case ConflictType.MISSING_REFERENCES:
        return 1.0; // Critical relevance for missing references
      
      case ConflictType.CONTENT_CONFLICTS:
        return this.calculateContentOverlap(newItem, existingItem);
      
      default:
        return 0.5;
    }
  }

  private calculateOverallConfidence(factors: any, conflictType: ConflictType): number {
    // Weighted average based on conflict type
    switch (conflictType) {
      case ConflictType.DUPLICATE_NODES:
        return factors.nameSimilarity * 0.4 + 
               factors.contentOverlap * 0.3 + 
               factors.propertyAlignment * 0.2 + 
               factors.contextualRelevance * 0.1;
      
      case ConflictType.CONFLICTING_EDGES:
        return factors.contextualRelevance * 0.6 + 
               factors.nameSimilarity * 0.4;
      
      case ConflictType.MISSING_REFERENCES:
        return 1.0; // Always high confidence for missing references
      
      case ConflictType.CONTENT_CONFLICTS:
        return factors.contentOverlap * 0.5 + 
               factors.contextualRelevance * 0.5;
      
      default:
        return (factors.nameSimilarity + factors.contentOverlap + 
                factors.propertyAlignment + factors.contextualRelevance) / 4;
    }
  }

  private generateConfidenceReasoning(factors: any, conflictType: ConflictType): string[] {
    const reasoning: string[] = [];
    
    if (factors.nameSimilarity > 0.8) {
      reasoning.push('节点名称高度相似');
    } else if (factors.nameSimilarity > 0.5) {
      reasoning.push('节点名称部分相似');
    }
    
    if (factors.contentOverlap > 0.7) {
      reasoning.push('内容重叠度较高');
    } else if (factors.contentOverlap > 0.3) {
      reasoning.push('存在部分内容重叠');
    }
    
    if (factors.propertyAlignment > 0.8) {
      reasoning.push('属性结构高度一致');
    }
    
    if (conflictType === ConflictType.MISSING_REFERENCES) {
      reasoning.push('引用的节点不存在');
    }
    
    return reasoning;
  }

  // Resolution options generators

  private generateNodeResolutionOptions(newNode: NewNodeData, existingNode: ExistingNodeData): ResolutionOption[] {
    return [
      {
        id: 'keep_existing',
        label: '保留现有节点',
        description: '忽略新节点，保持现有节点不变',
        action: 'keep_existing'
      },
      {
        id: 'use_new',
        label: '使用新节点',
        description: '用新节点替换现有节点',
        action: 'use_new'
      },
      {
        id: 'merge',
        label: '合并节点',
        description: '将新节点的属性合并到现有节点',
        action: 'merge'
      },
      {
        id: 'manual_review',
        label: '手动审查',
        description: '标记为需要手动审查的冲突',
        action: 'manual_review'
      }
    ];
  }

  private generateEdgeResolutionOptions(newEdge: NewEdgeData): ResolutionOption[] {
    return [
      {
        id: 'skip',
        label: '跳过重复关系',
        description: '忽略这个重复的关系',
        action: 'skip'
      },
      {
        id: 'use_new',
        label: '更新关系属性',
        description: '用新关系的属性更新现有关系',
        action: 'use_new'
      },
      {
        id: 'manual_review',
        label: '手动审查',
        description: '标记为需要手动审查的关系冲突',
        action: 'manual_review'
      }
    ];
  }

  private generateContentResolutionOptions(contentConflict: ContentConflict): ResolutionOption[] {
    return [
      {
        id: 'keep_existing',
        label: '保留现有内容',
        description: `保持 ${contentConflict.field} 字段的现有值`,
        action: 'keep_existing'
      },
      {
        id: 'use_new',
        label: '使用新内容',
        description: `用新值替换 ${contentConflict.field} 字段`,
        action: 'use_new'
      },
      {
        id: 'merge',
        label: '合并内容',
        description: `尝试合并 ${contentConflict.field} 字段的内容`,
        action: 'merge'
      }
    ];
  }

  private generateOrphanedResolutionOptions(orphaned: OrphanedRelationship): ResolutionOption[] {
    return [
      {
        id: 'skip',
        label: '跳过此关系',
        description: '忽略这个引用不存在节点的关系',
        action: 'skip'
      },
      {
        id: 'manual_review',
        label: '手动创建节点',
        description: '标记为需要手动创建缺失的节点',
        action: 'manual_review'
      }
    ];
  }

  // Content analysis helper methods

  private analyzeContentConflict(field: string, existingContent: any, newContent: any): ContentConflict | null {
    if (this.areValuesEqual(existingContent, newContent)) {
      return null; // No conflict
    }

    const similarity = this.calculateValueSimilarity(existingContent, newContent);
    let conflictType: 'semantic_difference' | 'format_mismatch' | 'value_contradiction';

    if (typeof existingContent !== typeof newContent) {
      conflictType = 'format_mismatch';
    } else if (similarity < 0.3) {
      conflictType = 'value_contradiction';
    } else {
      conflictType = 'semantic_difference';
    }

    return {
      field,
      conflictType,
      existingContent,
      newContent,
      similarity
    };
  }

  private calculateValueSimilarity(value1: any, value2: any): number {
    if (value1 === value2) return 1.0;
    if (typeof value1 !== typeof value2) return 0.0;

    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return this.calculateStringSimilarity(value1, value2);
    }

    if (typeof value1 === 'number' && typeof value2 === 'number') {
      const diff = Math.abs(value1 - value2);
      const max = Math.max(Math.abs(value1), Math.abs(value2));
      return max === 0 ? 1.0 : Math.max(0, 1.0 - (diff / max));
    }

    if (Array.isArray(value1) && Array.isArray(value2)) {
      const commonElements = value1.filter(item => value2.includes(item));
      const totalElements = new Set([...value1, ...value2]).size;
      return totalElements === 0 ? 1.0 : commonElements.length / totalElements;
    }

    return 0.5; // Default similarity for complex objects
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    return maxLength === 0 ? 1.0 : 1.0 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}

/**
 * Enhanced Duplicate Detection Service interface for external use
 */
export interface EnhancedDuplicateDetectionService extends DuplicateDetectionService {
  // All methods are already included in the base interface
}

/**
 * Factory function to create Enhanced Duplicate Detection Service instance
 */
export function createDuplicateDetectionService(): DuplicateDetectionService {
  return new DuplicateDetectionServiceImpl();
}

/**
 * Factory function to create Enhanced Duplicate Detection Service instance
 */
export function createEnhancedDuplicateDetectionService(): EnhancedDuplicateDetectionService {
  return new DuplicateDetectionServiceImpl();
}

/**
 * Default singleton instance for convenience
 */
let defaultInstance: DuplicateDetectionService | null = null;

export function getDuplicateDetectionService(): DuplicateDetectionService {
  if (!defaultInstance) {
    defaultInstance = createDuplicateDetectionService();
  }
  return defaultInstance;
}

/**
 * Get enhanced duplicate detection service instance
 */
export function getEnhancedDuplicateDetectionService(): EnhancedDuplicateDetectionService {
  if (!defaultInstance) {
    defaultInstance = createEnhancedDuplicateDetectionService();
  }
  return defaultInstance as EnhancedDuplicateDetectionService;
}
