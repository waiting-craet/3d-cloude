/**
 * Duplicate Detection Service
 * 
 * Compares AI-generated nodes and edges against existing graph data to identify
 * duplicates and conflicts. Implements case-insensitive node name comparison
 * and property conflict detection.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 7.1, 7.2
 */

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
 * Duplicate Detection Service interface
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
}

/**
 * Factory function to create Duplicate Detection Service instance
 */
export function createDuplicateDetectionService(): DuplicateDetectionService {
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
