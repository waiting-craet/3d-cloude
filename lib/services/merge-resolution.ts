/**
 * Enhanced Merge Resolution Service
 * 
 * Handles merging of duplicate nodes and resolution of property conflicts
 * based on user decisions with enhanced batch processing and validation.
 * Updates edge references to maintain referential integrity.
 * 
 * Requirements: 1.6, 1.7, 1.8, 8.1, 8.2, 8.3, 8.4, 8.5
 */

// Import enhanced conflict detection types
import { 
  ConflictType, 
  DetectedConflict, 
  ResolutionOption, 
  ConflictAnalysisResult,
  ClassifiedConflicts 
} from './duplicate-detection';

/**
 * Enhanced resolution decision with conflict context
 */
export interface EnhancedResolutionDecision {
  conflictId: string;
  conflictType: ConflictType;
  selectedOption: ResolutionOption;
  customParameters?: Record<string, any>;
  timestamp: Date;
}

/**
 * Batch resolution request
 */
export interface BatchResolutionRequest {
  decisions: EnhancedResolutionDecision[];
  conflictAnalysis: ConflictAnalysisResult;
  validationOptions?: {
    validateReferentialIntegrity: boolean;
    validateDataConsistency: boolean;
    allowPartialResolution: boolean;
  };
}

/**
 * Resolution validation result
 */
export interface ResolutionValidationResult {
  isValid: boolean;
  errors: ResolutionValidationError[];
  warnings: ResolutionValidationWarning[];
  affectedItems: {
    nodes: string[];
    edges: string[];
  };
}

/**
 * Resolution validation error
 */
export interface ResolutionValidationError {
  code: string;
  message: string;
  conflictId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestedFix?: string;
}

/**
 * Resolution validation warning
 */
export interface ResolutionValidationWarning {
  code: string;
  message: string;
  conflictId: string;
  impact: string;
}

/**
 * Batch resolution result
 */
export interface BatchResolutionResult {
  success: boolean;
  processedConflicts: number;
  resolvedConflicts: number;
  skippedConflicts: number;
  errors: ResolutionValidationError[];
  warnings: ResolutionValidationWarning[];
  nodesToCreate: NodeToCreate[];
  nodesToUpdate: NodeToUpdate[];
  edgesToCreate: ProcessedEdge[];
  edgesToUpdate: ProcessedEdge[];
  nodeIdMapping: Map<string, string>;
  summary: {
    totalTime: number;
    conflictsByType: Record<ConflictType, number>;
    resolutionsByAction: Record<string, number>;
  };
}

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
 * Enhanced Merge Resolution Service interface
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

  /**
   * Process batch conflict resolution with enhanced validation
   * 
   * @param request - Batch resolution request with decisions and validation options
   * @returns Comprehensive batch resolution result
   */
  processBatchResolution(request: BatchResolutionRequest): Promise<BatchResolutionResult>;

  /**
   * Validate resolution decisions before processing
   * 
   * @param decisions - Array of resolution decisions to validate
   * @param conflictAnalysis - Original conflict analysis result
   * @returns Validation result with errors and warnings
   */
  validateResolutionDecisions(
    decisions: EnhancedResolutionDecision[],
    conflictAnalysis: ConflictAnalysisResult
  ): ResolutionValidationResult;

  /**
   * Generate resolution options for each conflict type
   * 
   * @param conflict - Detected conflict to generate options for
   * @returns Array of available resolution options
   */
  generateResolutionOptions(conflict: DetectedConflict): ResolutionOption[];

  /**
   * Apply resolution decision to a specific conflict
   * 
   * @param decision - Resolution decision to apply
   * @param conflict - Original conflict being resolved
   * @returns Result of applying the resolution
   */
  applyResolutionDecision(
    decision: EnhancedResolutionDecision,
    conflict: DetectedConflict
  ): {
    nodesToCreate: NodeToCreate[];
    nodesToUpdate: NodeToUpdate[];
    edgesToCreate: ProcessedEdge[];
    edgesToUpdate: ProcessedEdge[];
    nodeIdMapping: Map<string, string>;
  };
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

  /**
   * Process batch conflict resolution with enhanced validation
   */
  async processBatchResolution(request: BatchResolutionRequest): Promise<BatchResolutionResult> {
    const startTime = Date.now();
    const result: BatchResolutionResult = {
      success: false,
      processedConflicts: 0,
      resolvedConflicts: 0,
      skippedConflicts: 0,
      errors: [],
      warnings: [],
      nodesToCreate: [],
      nodesToUpdate: [],
      edgesToCreate: [],
      edgesToUpdate: [],
      nodeIdMapping: new Map(),
      summary: {
        totalTime: 0,
        conflictsByType: {} as Record<ConflictType, number>,
        resolutionsByAction: {}
      }
    };

    try {
      // Validate resolution decisions
      const validation = this.validateResolutionDecisions(request.decisions, request.conflictAnalysis);
      
      if (!validation.isValid && !request.validationOptions?.allowPartialResolution) {
        result.errors = validation.errors;
        result.warnings = validation.warnings;
        return result;
      }

      // Process each resolution decision
      for (const decision of request.decisions) {
        try {
          const conflict = request.conflictAnalysis.conflicts.find(c => 
            this.generateConflictId(c) === decision.conflictId
          );

          if (!conflict) {
            result.errors.push({
              code: 'CONFLICT_NOT_FOUND',
              message: `冲突 ${decision.conflictId} 未找到`,
              conflictId: decision.conflictId,
              severity: 'high'
            });
            continue;
          }

          const resolutionResult = this.applyResolutionDecision(decision, conflict);
          
          // Merge results
          result.nodesToCreate.push(...resolutionResult.nodesToCreate);
          result.nodesToUpdate.push(...resolutionResult.nodesToUpdate);
          result.edgesToCreate.push(...resolutionResult.edgesToCreate);
          result.edgesToUpdate.push(...resolutionResult.edgesToUpdate);
          
          // Merge node ID mappings
          for (const [key, value] of resolutionResult.nodeIdMapping) {
            result.nodeIdMapping.set(key, value);
          }

          result.resolvedConflicts++;

          // Update summary statistics
          const conflictType = conflict.type;
          result.summary.conflictsByType[conflictType] = 
            (result.summary.conflictsByType[conflictType] || 0) + 1;
          
          const action = decision.selectedOption.action;
          result.summary.resolutionsByAction[action] = 
            (result.summary.resolutionsByAction[action] || 0) + 1;

        } catch (error) {
          result.errors.push({
            code: 'RESOLUTION_ERROR',
            message: `处理冲突 ${decision.conflictId} 时出错: ${error instanceof Error ? error.message : String(error)}`,
            conflictId: decision.conflictId,
            severity: 'high'
          });
          result.skippedConflicts++;
        }

        result.processedConflicts++;
      }

      // Final validation if requested
      if (request.validationOptions?.validateReferentialIntegrity) {
        const integrityValidation = this.validateReferentialIntegrity(result);
        result.errors.push(...integrityValidation.errors);
        result.warnings.push(...integrityValidation.warnings);
      }

      result.success = result.errors.length === 0 || 
        (Boolean(request.validationOptions?.allowPartialResolution) && result.resolvedConflicts > 0);

    } catch (error) {
      result.errors.push({
        code: 'BATCH_PROCESSING_ERROR',
        message: `批量处理失败: ${error instanceof Error ? error.message : String(error)}`,
        conflictId: 'batch',
        severity: 'critical'
      });
    }

    result.summary.totalTime = Date.now() - startTime;
    return result;
  }

  /**
   * Validate resolution decisions before processing
   */
  validateResolutionDecisions(
    decisions: EnhancedResolutionDecision[],
    conflictAnalysis: ConflictAnalysisResult
  ): ResolutionValidationResult {
    const errors: ResolutionValidationError[] = [];
    const warnings: ResolutionValidationWarning[] = [];
    const affectedNodes = new Set<string>();
    const affectedEdges = new Set<string>();

    // Create conflict lookup map
    const conflictMap = new Map<string, DetectedConflict>();
    for (const conflict of conflictAnalysis.conflicts) {
      conflictMap.set(this.generateConflictId(conflict), conflict);
    }

    // Validate each decision
    for (const decision of decisions) {
      const conflict = conflictMap.get(decision.conflictId);
      
      if (!conflict) {
        errors.push({
          code: 'INVALID_CONFLICT_ID',
          message: `冲突ID ${decision.conflictId} 无效`,
          conflictId: decision.conflictId,
          severity: 'high',
          suggestedFix: '请检查冲突ID是否正确'
        });
        continue;
      }

      // Validate conflict type matches
      if (decision.conflictType !== conflict.type) {
        errors.push({
          code: 'CONFLICT_TYPE_MISMATCH',
          message: `冲突类型不匹配: 期望 ${conflict.type}, 实际 ${decision.conflictType}`,
          conflictId: decision.conflictId,
          severity: 'medium'
        });
      }

      // Validate resolution option is available
      const availableOptions = this.generateResolutionOptions(conflict);
      const isValidOption = availableOptions.some(option => option.id === decision.selectedOption.id);
      
      if (!isValidOption) {
        errors.push({
          code: 'INVALID_RESOLUTION_OPTION',
          message: `解决方案选项 ${decision.selectedOption.id} 对此冲突类型无效`,
          conflictId: decision.conflictId,
          severity: 'high',
          suggestedFix: `可用选项: ${availableOptions.map(o => o.id).join(', ')}`
        });
      }

      // Track affected items
      if (conflict.affectedItems.newItem?.id) {
        if (conflict.type === ConflictType.DUPLICATE_NODES || conflict.type === ConflictType.CONTENT_CONFLICTS) {
          affectedNodes.add(conflict.affectedItems.newItem.id);
        } else if (conflict.type === ConflictType.CONFLICTING_EDGES || conflict.type === ConflictType.MISSING_REFERENCES) {
          affectedEdges.add(conflict.affectedItems.newItem.id);
        }
      }

      // Check for high-confidence conflicts with risky resolutions
      if (conflict.confidence.overall > 0.9 && decision.selectedOption.action === 'skip') {
        warnings.push({
          code: 'HIGH_CONFIDENCE_SKIP',
          message: `跳过高置信度冲突可能导致数据丢失`,
          conflictId: decision.conflictId,
          impact: '可能丢失重要的节点或关系数据'
        });
      }
    }

    // Check for missing critical conflict resolutions
    const criticalConflicts = conflictAnalysis.conflicts.filter(c => 
      c.type === ConflictType.MISSING_REFERENCES || 
      (c.confidence.overall > 0.95 && c.type === ConflictType.DUPLICATE_NODES)
    );

    const resolvedCriticalIds = new Set(decisions.map(d => d.conflictId));
    for (const critical of criticalConflicts) {
      const criticalId = this.generateConflictId(critical);
      if (!resolvedCriticalIds.has(criticalId)) {
        warnings.push({
          code: 'UNRESOLVED_CRITICAL_CONFLICT',
          message: `关键冲突未解决`,
          conflictId: criticalId,
          impact: '可能导致数据完整性问题'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      affectedItems: {
        nodes: Array.from(affectedNodes),
        edges: Array.from(affectedEdges)
      }
    };
  }

  /**
   * Generate resolution options for each conflict type
   */
  generateResolutionOptions(conflict: DetectedConflict): ResolutionOption[] {
    switch (conflict.type) {
      case ConflictType.DUPLICATE_NODES:
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

      case ConflictType.CONFLICTING_EDGES:
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

      case ConflictType.MISSING_REFERENCES:
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

      case ConflictType.CONTENT_CONFLICTS:
        return [
          {
            id: 'keep_existing',
            label: '保留现有内容',
            description: '保持字段的现有值',
            action: 'keep_existing'
          },
          {
            id: 'use_new',
            label: '使用新内容',
            description: '用新值替换字段',
            action: 'use_new'
          },
          {
            id: 'merge',
            label: '合并内容',
            description: '尝试合并字段的内容',
            action: 'merge'
          }
        ];

      default:
        return [
          {
            id: 'manual_review',
            label: '手动审查',
            description: '需要手动处理此类型的冲突',
            action: 'manual_review'
          }
        ];
    }
  }

  /**
   * Apply resolution decision to a specific conflict
   */
  applyResolutionDecision(
    decision: EnhancedResolutionDecision,
    conflict: DetectedConflict
  ): {
    nodesToCreate: NodeToCreate[];
    nodesToUpdate: NodeToUpdate[];
    edgesToCreate: ProcessedEdge[];
    edgesToUpdate: ProcessedEdge[];
    nodeIdMapping: Map<string, string>;
  } {
    const result = {
      nodesToCreate: [] as NodeToCreate[],
      nodesToUpdate: [] as NodeToUpdate[],
      edgesToCreate: [] as ProcessedEdge[],
      edgesToUpdate: [] as ProcessedEdge[],
      nodeIdMapping: new Map<string, string>()
    };

    switch (conflict.type) {
      case ConflictType.DUPLICATE_NODES:
        this.applyNodeConflictResolution(decision, conflict, result);
        break;

      case ConflictType.CONFLICTING_EDGES:
        this.applyEdgeConflictResolution(decision, conflict, result);
        break;

      case ConflictType.MISSING_REFERENCES:
        this.applyMissingReferenceResolution(decision, conflict, result);
        break;

      case ConflictType.CONTENT_CONFLICTS:
        this.applyContentConflictResolution(decision, conflict, result);
        break;

      default:
        // For other conflict types, mark for manual review
        console.warn(`[Merge Resolution] Unhandled conflict type: ${conflict.type}`);
        break;
    }

    return result;
  }

  // Private helper methods for enhanced functionality

  private generateConflictId(conflict: DetectedConflict): string {
    // Generate a unique ID for the conflict based on its properties
    const items = conflict.affectedItems;
    const newItemId = items.newItem?.id || items.newItem?.name || 'unknown';
    const existingItemId = items.existingItem?.id || items.existingItem?.name || 'none';
    return `${conflict.type}_${newItemId}_${existingItemId}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private validateReferentialIntegrity(result: BatchResolutionResult): {
    errors: ResolutionValidationError[];
    warnings: ResolutionValidationWarning[];
  } {
    const errors: ResolutionValidationError[] = [];
    const warnings: ResolutionValidationWarning[] = [];

    // Check that all edge references point to valid nodes
    const allNodeIds = new Set<string>();
    
    // Add existing node IDs from updates
    for (const update of result.nodesToUpdate) {
      allNodeIds.add(update.id);
    }
    
    // Add new node IDs (these would be generated during creation)
    for (const create of result.nodesToCreate) {
      allNodeIds.add(create.tempId);
    }

    // Check edge references
    for (const edge of [...result.edgesToCreate, ...result.edgesToUpdate]) {
      if (!allNodeIds.has(edge.fromNodeId) && !result.nodeIdMapping.has(edge.fromNodeId)) {
        errors.push({
          code: 'INVALID_EDGE_SOURCE',
          message: `边的源节点 ${edge.fromNodeId} 不存在`,
          conflictId: 'referential_integrity',
          severity: 'high',
          suggestedFix: '确保所有引用的节点都存在或已映射'
        });
      }

      if (!allNodeIds.has(edge.toNodeId) && !result.nodeIdMapping.has(edge.toNodeId)) {
        errors.push({
          code: 'INVALID_EDGE_TARGET',
          message: `边的目标节点 ${edge.toNodeId} 不存在`,
          conflictId: 'referential_integrity',
          severity: 'high',
          suggestedFix: '确保所有引用的节点都存在或已映射'
        });
      }
    }

    return { errors, warnings };
  }

  private applyNodeConflictResolution(
    decision: EnhancedResolutionDecision,
    conflict: DetectedConflict,
    result: any
  ): void {
    const newNode = conflict.affectedItems.newItem;
    const existingNode = conflict.affectedItems.existingItem;

    switch (decision.selectedOption.action) {
      case 'keep_existing':
        // Map new node ID to existing node ID
        if (newNode?.tempId && existingNode?.id) {
          result.nodeIdMapping.set(newNode.tempId, existingNode.id);
        }
        break;

      case 'use_new':
        // Update existing node with new node data
        if (existingNode?.id && newNode) {
          result.nodesToUpdate.push({
            id: existingNode.id,
            updates: {
              metadata: JSON.stringify(newNode.properties || {})
            }
          });
          result.nodeIdMapping.set(newNode.tempId, existingNode.id);
        }
        break;

      case 'merge':
        // Merge properties and update existing node
        if (existingNode?.id && newNode) {
          const existingProps = this.parseMetadata(existingNode.metadata);
          const mergedProps = { ...existingProps, ...newNode.properties };
          
          result.nodesToUpdate.push({
            id: existingNode.id,
            updates: {
              metadata: JSON.stringify(mergedProps)
            }
          });
          result.nodeIdMapping.set(newNode.tempId, existingNode.id);
        }
        break;

      case 'manual_review':
        // Create new node for manual review
        if (newNode) {
          result.nodesToCreate.push({
            ...newNode,
            name: `${newNode.name} (需审查)`,
            tempId: newNode.tempId
          });
        }
        break;
    }
  }

  private applyEdgeConflictResolution(
    decision: EnhancedResolutionDecision,
    conflict: DetectedConflict,
    result: any
  ): void {
    const newEdge = conflict.affectedItems.newItem;

    switch (decision.selectedOption.action) {
      case 'skip':
        // Do nothing - skip the conflicting edge
        break;

      case 'use_new':
        // Update existing edge with new properties
        if (newEdge) {
          result.edgesToUpdate.push({
            fromNodeId: newEdge.fromNodeId,
            toNodeId: newEdge.toNodeId,
            label: newEdge.label,
            properties: newEdge.properties || {}
          });
        }
        break;

      case 'manual_review':
        // Create edge for manual review
        if (newEdge) {
          result.edgesToCreate.push({
            fromNodeId: newEdge.fromNodeId,
            toNodeId: newEdge.toNodeId,
            label: `${newEdge.label} (需审查)`,
            properties: newEdge.properties || {}
          });
        }
        break;
    }
  }

  private applyMissingReferenceResolution(
    decision: EnhancedResolutionDecision,
    conflict: DetectedConflict,
    result: any
  ): void {
    const orphanedEdge = conflict.affectedItems.newItem;

    switch (decision.selectedOption.action) {
      case 'skip':
        // Do nothing - skip the orphaned edge
        break;

      case 'manual_review':
        // Mark edge for manual review and potential node creation
        if (orphanedEdge) {
          result.edgesToCreate.push({
            fromNodeId: orphanedEdge.fromNodeId,
            toNodeId: orphanedEdge.toNodeId,
            label: `${orphanedEdge.label} (缺失节点)`,
            properties: orphanedEdge.properties || {}
          });
        }
        break;
    }
  }

  private applyContentConflictResolution(
    decision: EnhancedResolutionDecision,
    conflict: DetectedConflict,
    result: any
  ): void {
    const contentConflict = conflict.affectedItems;
    const field = contentConflict.newItem?.field;
    const newContent = contentConflict.newItem?.content;
    const existingContent = contentConflict.existingItem?.content;

    // This would typically be handled as part of node conflict resolution
    // For now, we'll create an update record
    switch (decision.selectedOption.action) {
      case 'keep_existing':
        // Do nothing - keep existing content
        break;

      case 'use_new':
        // This would be handled by the calling context
        break;

      case 'merge':
        // Combine the content values
        const mergedContent = this.combineValues(existingContent, newContent);
        // This would be applied to the node update
        break;
    }
  }
}

/**
 * Enhanced Merge Resolution Service interface for external use
 */
export interface EnhancedMergeResolutionService extends MergeResolutionService {
  // All methods are already included in the base interface
}

/**
 * Factory function to create Merge Resolution Service instance
 */
export function createMergeResolutionService(): MergeResolutionService {
  return new MergeResolutionServiceImpl();
}

/**
 * Factory function to create Enhanced Merge Resolution Service instance
 */
export function createEnhancedMergeResolutionService(): EnhancedMergeResolutionService {
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

/**
 * Get enhanced merge resolution service instance
 */
export function getEnhancedMergeResolutionService(): EnhancedMergeResolutionService {
  if (!defaultInstance) {
    defaultInstance = createEnhancedMergeResolutionService();
  }
  return defaultInstance as EnhancedMergeResolutionService;
}
