/**
 * Merge Resolution Service
 * 
 * Handles merging of duplicate nodes and resolution of property conflicts
 * based on user decisions. Updates edge references to maintain referential integrity.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

/**
 * User's decision on how to handle a duplicate node
 */
export interface MergeDecision {
  action: 'merge' | 'keep-both' | 'skip';
  newNodeIndex: number;  // Index in the newNodes array
  existingNodeId: string;  // ID of existing node in database
  propertyResolutions?: Record<string, 'keep-existing' | 'use-new' | 'combine'>;
}

/**
 * Node data to be created
 */
export interface NodeToCreate {
  name: string;
  type: string;
  properties: Record<string, any>;
  tempId: string;  // Temporary client-side ID
}

/**
 * Node update data
 */
export interface NodeToUpdate {
  id: string;  // Database ID
  updates: {
    metadata: string;  // JSON string of merged properties
  };
}

/**
 * Result of node merging operation
 */
export interface MergeNodesResult {
  nodesToCreate: NodeToCreate[];
  nodesToUpdate: NodeToUpdate[];
  nodeIdMapping: Map<string, string>;  // Maps temp IDs to final IDs
}

/**
 * Edge data with temporary node references
 */
export interface EdgeData {
  id: string;  // Temporary client-side ID
  fromNodeId: string;  // Temporary or database ID
  toNodeId: string;    // Temporary or database ID
  label: string;
  properties: Record<string, any>;
}

/**
 * Processed edge data with updated node references
 */
export interface ProcessedEdge {
  fromNodeId: string;  // Database ID
  toNodeId: string;    // Database ID
  label: string;
  properties: Record<string, any>;
}

/**
 * Merge Resolution Service interface
 */
export interface MergeResolutionService {
  /**
   * Merges nodes according to user decisions
   * 
   * @param decisions - Array of user merge decisions
   * @param newNodes - Array of new nodes from AI analysis
   * @param existingNodes - Map of existing node IDs to their data
   * @returns Object containing nodes to create, update, and ID mapping
   */
  mergeNodes(
    decisions: MergeDecision[],
    newNodes: NodeToCreate[],
    existingNodes: Map<string, { name: string; metadata: string | null }>
  ): MergeNodesResult;

  /**
   * Filters out redundant edges and updates node references
   * 
   * @param edges - Array of edges with temporary node IDs
   * @param nodeIdMapping - Map of temporary IDs to final database IDs
   * @param redundantIndices - Indices of edges to filter out
   * @returns Array of processed edges with updated node references
   */
  processEdges(
    edges: EdgeData[],
    nodeIdMapping: Map<string, string>,
    redundantIndices: number[]
  ): ProcessedEdge[];
}

/**
 * Implementation of Merge Resolution Service
 */
export class MergeResolutionServiceImpl implements MergeResolutionService {
  /**
   * Merges nodes according to user decisions
   */
  mergeNodes(
    decisions: MergeDecision[],
    newNodes: NodeToCreate[],
    existingNodes: Map<string, { name: string; metadata: string | null }>
  ): MergeNodesResult {
    const nodesToCreate: NodeToCreate[] = [];
    const nodesToUpdate: NodeToUpdate[] = [];
    const nodeIdMapping = new Map<string, string>();

    // Create a set of indices that have merge decisions
    const processedIndices = new Set<number>();

    // Process each merge decision
    for (const decision of decisions) {
      const newNode = newNodes[decision.newNodeIndex];
      
      if (!newNode) {
        console.warn('[Merge Resolution] Invalid node index in decision:', decision.newNodeIndex);
        continue;
      }

      processedIndices.add(decision.newNodeIndex);

      if (decision.action === 'merge') {
        // Merge the new node with the existing node
        const existingNode = existingNodes.get(decision.existingNodeId);
        
        if (!existingNode) {
          console.warn('[Merge Resolution] Existing node not found:', decision.existingNodeId);
          continue;
        }

        // Parse existing metadata
        const existingProps = this.parseMetadata(existingNode.metadata);

        // Resolve property conflicts
        const mergedProperties = this.resolveProperties(
          existingProps,
          newNode.properties,
          decision.propertyResolutions || {}
        );

        // Add to update list
        nodesToUpdate.push({
          id: decision.existingNodeId,
          updates: {
            metadata: JSON.stringify(mergedProperties),
          },
        });

        // Map the temporary ID to the existing node ID
        nodeIdMapping.set(newNode.tempId, decision.existingNodeId);

      } else if (decision.action === 'keep-both') {
        // Create the new node as-is (user wants to keep both)
        // The new node will get a database ID when created
        nodesToCreate.push(newNode);
        // Note: The actual database ID will be assigned during creation
        // For now, we keep the temp ID in the mapping
        // The caller will need to update this mapping after creation

      } else if (decision.action === 'skip') {
        // Don't create the new node
        // Map to the existing node ID so edges can reference it
        nodeIdMapping.set(newNode.tempId, decision.existingNodeId);
      }
    }

    // Add all nodes that weren't part of any merge decision
    for (let i = 0; i < newNodes.length; i++) {
      if (!processedIndices.has(i)) {
        nodesToCreate.push(newNodes[i]);
      }
    }

    return {
      nodesToCreate,
      nodesToUpdate,
      nodeIdMapping,
    };
  }

  /**
   * Resolves property conflicts based on user decisions
   * 
   * @param existingProps - Properties from the existing node
   * @param newProps - Properties from the new node
   * @param resolutions - User's resolution decisions for each property
   * @returns Merged properties object
   */
  private resolveProperties(
    existingProps: Record<string, any>,
    newProps: Record<string, any>,
    resolutions: Record<string, 'keep-existing' | 'use-new' | 'combine'>
  ): Record<string, any> {
    // Start with existing properties
    const merged = { ...existingProps };

    // Process each property from the new node
    for (const [key, newValue] of Object.entries(newProps)) {
      const resolution = resolutions[key];

      if (!resolution) {
        // No explicit resolution - use default behavior
        if (key in existingProps) {
          // Property exists in both - keep existing by default
          // (user should have provided a resolution if they wanted to change it)
          continue;
        } else {
          // Property only in new node - add it
          merged[key] = newValue;
        }
      } else if (resolution === 'use-new') {
        // Replace with new value
        merged[key] = newValue;
      } else if (resolution === 'combine') {
        // Combine values
        merged[key] = this.combineValues(existingProps[key], newValue);
      }
      // 'keep-existing' means don't change - already handled by starting with existingProps
    }

    return merged;
  }

  /**
   * Combines two property values
   * 
   * @param existingValue - Existing property value
   * @param newValue - New property value
   * @returns Combined value
   */
  private combineValues(existingValue: any, newValue: any): any {
    // Handle null/undefined
    if (existingValue === null || existingValue === undefined) {
      return newValue;
    }
    if (newValue === null || newValue === undefined) {
      return existingValue;
    }

    // Handle strings - concatenate with separator
    if (typeof existingValue === 'string' && typeof newValue === 'string') {
      // Avoid duplicates
      if (existingValue.toLowerCase().includes(newValue.toLowerCase())) {
        return existingValue;
      }
      if (newValue.toLowerCase().includes(existingValue.toLowerCase())) {
        return newValue;
      }
      return `${existingValue}; ${newValue}`;
    }

    // Handle arrays - merge and deduplicate
    if (Array.isArray(existingValue) && Array.isArray(newValue)) {
      const combined = [...existingValue, ...newValue];
      // Simple deduplication for primitive values
      return Array.from(new Set(combined.map(v => JSON.stringify(v))))
        .map(v => JSON.parse(v));
    }

    // Handle numbers - sum them
    if (typeof existingValue === 'number' && typeof newValue === 'number') {
      return existingValue + newValue;
    }

    // Handle objects - merge properties
    if (typeof existingValue === 'object' && typeof newValue === 'object' &&
        !Array.isArray(existingValue) && !Array.isArray(newValue)) {
      return { ...existingValue, ...newValue };
    }

    // Default: prefer new value if types don't match
    return newValue;
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
      console.warn('[Merge Resolution] Failed to parse metadata:', error);
      return {};
    }
  }

  /**
   * Filters out redundant edges and updates node references
   */
  processEdges(
    edges: EdgeData[],
    nodeIdMapping: Map<string, string>,
    redundantIndices: number[]
  ): ProcessedEdge[] {
    const processedEdges: ProcessedEdge[] = [];
    const redundantSet = new Set(redundantIndices);

    for (let i = 0; i < edges.length; i++) {
      // Skip redundant edges
      if (redundantSet.has(i)) {
        continue;
      }

      const edge = edges[i];

      // Update node references using the mapping
      const fromNodeId = nodeIdMapping.get(edge.fromNodeId) || edge.fromNodeId;
      const toNodeId = nodeIdMapping.get(edge.toNodeId) || edge.toNodeId;

      // Validate that we have valid node IDs
      if (!fromNodeId || !toNodeId) {
        console.warn('[Merge Resolution] Edge has invalid node references:', edge);
        continue;
      }

      processedEdges.push({
        fromNodeId,
        toNodeId,
        label: edge.label,
        properties: edge.properties,
      });
    }

    return processedEdges;
  }
}

/**
 * Factory function to create Merge Resolution Service instance
 */
export function createMergeResolutionService(): MergeResolutionService {
  return new MergeResolutionServiceImpl();
}

/**
 * Default singleton instance for convenience
 */
let defaultInstance: MergeResolutionService | null = null;

export function getMergeResolutionService(): MergeResolutionService {
  if (!defaultInstance) {
    defaultInstance = createMergeResolutionService();
  }
  return defaultInstance;
}
