/**
 * Relationship Manager Service
 * 
 * Provides comprehensive CRUD operations for knowledge graph relationships (edges)
 * with validation, duplicate detection, and relationship type management.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

/**
 * Relationship query options for filtering and pagination
 */
export interface RelationshipQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  fromNodeId?: string;
  toNodeId?: string;
  bidirectional?: boolean;
  sortBy?: 'label' | 'createdAt' | 'updatedAt' | 'type';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

/**
 * Paginated relationships result
 */
export interface PaginatedRelationships {
  relationships: Edge[];
  totalCount: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Relationship data for creation
 */
export interface CreateRelationshipData {
  fromNodeId: string;
  toNodeId: string;
  label: string;
  properties?: Record<string, any>;
  bidirectional?: boolean;
  visualProperties?: EdgeVisualProperties;
  weight?: number;
  confidence?: number;
}

/**
 * Relationship data for updates
 */
export interface UpdateRelationshipData extends Partial<CreateRelationshipData> {
  id: string;
}

/**
 * Visual properties for edge display
 */
export interface EdgeVisualProperties {
  color?: string;
  thickness?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  animated?: boolean;
}
/**
 * Relationship type definition
 */
export interface RelationshipType {
  id: string;
  label: string;
  description: string;
  category: string;
  defaultProperties?: Record<string, any>;
  allowsBidirectional: boolean;
  color?: string;
  icon?: string;
  weight?: number;
}

/**
 * Edge/Relationship data structure
 */
export interface Edge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string;
  properties: Record<string, any>;
  bidirectional: boolean;
  visualProperties?: EdgeVisualProperties;
  weight: number;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  // Populated node information
  fromNode?: {
    id: string;
    name: string;
    type: string;
  };
  toNode?: {
    id: string;
    name: string;
    type: string;
  };
}

/**
 * Duplicate relationship result
 */
export interface DuplicateRelationshipResult {
  isDuplicate: boolean;
  existingRelationships: Edge[];
  similarityScore: number;
  conflicts: Array<{
    field: string;
    existingValue: any;
    newValue: any;
  }>;
}

/**
 * Relationship validation result
 */
export interface RelationshipValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
    impact: string;
  }>;
}

/**
 * Relationship deletion result
 */
export interface RelationshipDeletionResult {
  success: boolean;
  deletedRelationshipId: string;
  warnings: string[];
  backupData?: any;
}
/**
 * Relationship Manager Service interface
 */
export interface RelationshipManagerService {
  /**
   * Get relationships with filtering and pagination
   */
  getRelationships(options: RelationshipQueryOptions): Promise<PaginatedRelationships>;

  /**
   * Get a single relationship by ID
   */
  getRelationshipById(id: string): Promise<Edge | null>;

  /**
   * Create new relationship with validation
   */
  createRelationship(relationshipData: CreateRelationshipData): Promise<RelationshipValidationResult & { data?: Edge }>;

  /**
   * Update existing relationship
   */
  updateRelationship(
    edgeId: string,
    updates: UpdateRelationshipData
  ): Promise<RelationshipValidationResult & { data?: Edge }>;

  /**
   * Delete relationship with impact analysis
   */
  deleteRelationship(edgeId: string): Promise<RelationshipDeletionResult>;

  /**
   * Validate relationship data
   */
  validateRelationshipData(data: CreateRelationshipData | UpdateRelationshipData): RelationshipValidationResult;

  /**
   * Get available relationship types
   */
  getRelationshipTypes(): Promise<RelationshipType[]>;

  /**
   * Detect duplicate relationships
   */
  detectDuplicateRelationships(
    newRelationship: CreateRelationshipData,
    existingRelationships?: Edge[]
  ): Promise<DuplicateRelationshipResult>;

  /**
   * Get relationships for a specific node
   */
  getNodeRelationships(nodeId: string, direction?: 'incoming' | 'outgoing' | 'both'): Promise<Edge[]>;

  /**
   * Get relationship statistics
   */
  getRelationshipStatistics(): Promise<{
    totalRelationships: number;
    relationshipsByType: Record<string, number>;
    bidirectionalCount: number;
    averageWeight: number;
  }>;

  /**
   * Find shortest path between two nodes
   */
  findShortestPath(fromNodeId: string, toNodeId: string, maxDepth?: number): Promise<{
    path: Edge[];
    distance: number;
    found: boolean;
  }>;

  /**
   * Get relationship recommendations for a node
   */
  getRelationshipRecommendations(nodeId: string, limit?: number): Promise<{
    recommendedNodes: Array<{
      nodeId: string;
      nodeName: string;
      relationshipType: string;
      confidence: number;
      reason: string;
    }>;
  }>;
}
/**
 * Implementation of Relationship Manager Service
 */
export class RelationshipManagerServiceImpl implements RelationshipManagerService {
  private relationshipTypes: RelationshipType[] = [
    {
      id: 'related_to',
      label: '相关',
      description: '一般性关联关系',
      category: 'general',
      allowsBidirectional: true,
      color: '#6B7280',
      weight: 1
    },
    {
      id: 'contains',
      label: '包含',
      description: '包含或组成关系',
      category: 'hierarchical',
      allowsBidirectional: false,
      color: '#3B82F6',
      weight: 2
    },
    {
      id: 'depends_on',
      label: '依赖',
      description: '依赖关系',
      category: 'dependency',
      allowsBidirectional: false,
      color: '#EF4444',
      weight: 2
    },
    {
      id: 'similar_to',
      label: '相似',
      description: '相似性关系',
      category: 'similarity',
      allowsBidirectional: true,
      color: '#10B981',
      weight: 1
    },
    {
      id: 'causes',
      label: '导致',
      description: '因果关系',
      category: 'causal',
      allowsBidirectional: false,
      color: '#F59E0B',
      weight: 3
    }
  ];

  /**
   * Get relationships with filtering and pagination
   */
  async getRelationships(options: RelationshipQueryOptions = {}): Promise<PaginatedRelationships> {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      fromNodeId,
      toNodeId,
      bidirectional,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      includeDeleted = false
    } = options;

    try {
      // Build query conditions
      const conditions: any = {};
      
      if (!includeDeleted) {
        conditions.deletedAt = null;
      }

      if (type) {
        conditions.label = type;
      }

      if (fromNodeId) {
        conditions.fromNodeId = fromNodeId;
      }

      if (toNodeId) {
        conditions.toNodeId = toNodeId;
      }

      if (bidirectional !== undefined) {
        conditions.bidirectional = bidirectional;
      }

      if (search) {
        conditions.OR = [
          { label: { contains: search, mode: 'insensitive' } },
          { fromNode: { name: { contains: search, mode: 'insensitive' } } },
          { toNode: { name: { contains: search, mode: 'insensitive' } } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query (this would use Prisma in real implementation)
      const [relationships, totalCount] = await Promise.all([
        this.queryRelationships(conditions, { skip, take: limit, sortBy, sortOrder }),
        this.countRelationships(conditions)
      ]);

      return {
        relationships,
        totalCount,
        page,
        limit,
        hasNextPage: skip + limit < totalCount,
        hasPreviousPage: page > 1
      };
    } catch (error) {
      console.error('[Relationship Manager] Error getting relationships:', error);
      throw new Error(`获取关系失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a single relationship by ID
   */
  async getRelationshipById(id: string): Promise<Edge | null> {
    try {
      const relationship = await this.findRelationshipById(id);
      return relationship;
    } catch (error) {
      console.error('[Relationship Manager] Error getting relationship by ID:', error);
      throw new Error(`获取关系失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  /**
   * Create new relationship with validation
   */
  async createRelationship(relationshipData: CreateRelationshipData): Promise<RelationshipValidationResult & { data?: Edge }> {
    // Validate input data
    const validation = this.validateRelationshipData(relationshipData);
    if (!validation.isValid) {
      return validation;
    }

    try {
      // Check for duplicates
      const duplicateCheck = await this.detectDuplicateRelationships(relationshipData);
      if (duplicateCheck.isDuplicate) {
        return {
          isValid: false,
          errors: [{
            field: 'relationship',
            message: `关系已存在: ${relationshipData.fromNodeId} -> ${relationshipData.toNodeId} (${relationshipData.label})`,
            code: 'DUPLICATE_RELATIONSHIP',
            severity: 'error'
          }],
          warnings: []
        };
      }

      // Validate node existence
      const nodesExist = await this.validateNodeExistence(relationshipData.fromNodeId, relationshipData.toNodeId);
      if (!nodesExist.valid) {
        return {
          isValid: false,
          errors: [{
            field: 'nodes',
            message: nodesExist.message,
            code: 'INVALID_NODES',
            severity: 'error'
          }],
          warnings: []
        };
      }

      // Create relationship data
      const relationshipToCreate = {
        fromNodeId: relationshipData.fromNodeId,
        toNodeId: relationshipData.toNodeId,
        label: relationshipData.label,
        properties: relationshipData.properties || {},
        bidirectional: relationshipData.bidirectional || false,
        visualProperties: relationshipData.visualProperties,
        weight: relationshipData.weight || 1,
        confidence: relationshipData.confidence || 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      // Save to database
      const createdRelationship = await this.saveRelationship(relationshipToCreate);

      return {
        isValid: true,
        data: createdRelationship,
        errors: [],
        warnings: []
      };
    } catch (error) {
      console.error('[Relationship Manager] Error creating relationship:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: `创建关系失败: ${error instanceof Error ? error.message : String(error)}`,
          code: 'CREATE_ERROR',
          severity: 'error'
        }],
        warnings: []
      };
    }
  }

  /**
   * Update existing relationship
   */
  async updateRelationship(
    edgeId: string,
    updates: UpdateRelationshipData
  ): Promise<RelationshipValidationResult & { data?: Edge }> {
    // Validate input data
    const validation = this.validateRelationshipData(updates);
    if (!validation.isValid) {
      return validation;
    }

    try {
      // Get existing relationship
      const existingRelationship = await this.getRelationshipById(edgeId);
      if (!existingRelationship) {
        return {
          isValid: false,
          errors: [{
            field: 'id',
            message: `关系 ${edgeId} 不存在`,
            code: 'RELATIONSHIP_NOT_FOUND',
            severity: 'error'
          }],
          warnings: []
        };
      }

      // Merge updates with existing data
      const updatedData = {
        ...existingRelationship,
        ...updates,
        updatedAt: new Date(),
        version: existingRelationship.version + 1
      };

      // Save updated relationship
      const updatedRelationship = await this.saveRelationship(updatedData);

      return {
        isValid: true,
        data: updatedRelationship,
        errors: [],
        warnings: []
      };
    } catch (error) {
      console.error('[Relationship Manager] Error updating relationship:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: `更新关系失败: ${error instanceof Error ? error.message : String(error)}`,
          code: 'UPDATE_ERROR',
          severity: 'error'
        }],
        warnings: []
      };
    }
  }

  /**
   * Delete relationship with impact analysis
   */
  async deleteRelationship(edgeId: string): Promise<RelationshipDeletionResult> {
    try {
      // Get existing relationship
      const existingRelationship = await this.getRelationshipById(edgeId);
      if (!existingRelationship) {
        return {
          success: false,
          deletedRelationshipId: edgeId,
          warnings: [`关系 ${edgeId} 不存在`]
        };
      }

      // Create backup
      const backupData = {
        relationship: existingRelationship,
        timestamp: new Date()
      };

      // Delete the relationship
      await this.deleteRelationshipById(edgeId);

      return {
        success: true,
        deletedRelationshipId: edgeId,
        warnings: [],
        backupData
      };
    } catch (error) {
      console.error('[Relationship Manager] Error deleting relationship:', error);
      return {
        success: false,
        deletedRelationshipId: edgeId,
        warnings: [`删除关系失败: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }
  /**
   * Validate relationship data
   */
  validateRelationshipData(data: CreateRelationshipData | UpdateRelationshipData): RelationshipValidationResult {
    const errors: Array<{
      field: string;
      message: string;
      code: string;
      severity: 'error' | 'warning' | 'info';
    }> = [];
    const warnings: Array<{
      field: string;
      message: string;
      code: string;
      impact: string;
    }> = [];

    // Validate required fields for creation
    if ('fromNodeId' in data && !data.fromNodeId) {
      errors.push({
        field: 'fromNodeId',
        message: '源节点ID不能为空',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    if ('toNodeId' in data && !data.toNodeId) {
      errors.push({
        field: 'toNodeId',
        message: '目标节点ID不能为空',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    if ('label' in data && !data.label) {
      errors.push({
        field: 'label',
        message: '关系标签不能为空',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    // Validate self-reference
    if (data.fromNodeId && data.toNodeId && data.fromNodeId === data.toNodeId) {
      warnings.push({
        field: 'nodes',
        message: '节点自引用关系',
        code: 'SELF_REFERENCE',
        impact: '可能导致图形显示异常'
      });
    }

    // Validate label length
    if (data.label && data.label.length > 100) {
      errors.push({
        field: 'label',
        message: '关系标签不能超过100个字符',
        code: 'MAX_LENGTH',
        severity: 'error'
      });
    }

    // Validate weight range
    if (data.weight !== undefined && (data.weight < 0 || data.weight > 10)) {
      errors.push({
        field: 'weight',
        message: '权重必须在0到10之间',
        code: 'INVALID_RANGE',
        severity: 'error'
      });
    }

    // Validate confidence range
    if (data.confidence !== undefined && (data.confidence < 0 || data.confidence > 1)) {
      errors.push({
        field: 'confidence',
        message: '置信度必须在0到1之间',
        code: 'INVALID_RANGE',
        severity: 'error'
      });
    }

    // Validate visual properties
    if (data.visualProperties) {
      const visual = data.visualProperties;
      
      if (visual.thickness && (visual.thickness < 0.1 || visual.thickness > 10)) {
        warnings.push({
          field: 'visualProperties.thickness',
          message: '线条粗细建议在0.1到10之间',
          code: 'THICKNESS_RANGE',
          impact: '可能影响视觉效果'
        });
      }

      if (visual.opacity && (visual.opacity < 0 || visual.opacity > 1)) {
        errors.push({
          field: 'visualProperties.opacity',
          message: '透明度必须在0到1之间',
          code: 'INVALID_RANGE',
          severity: 'error'
        });
      }
    }

    // Validate relationship type
    if (data.label) {
      const relationshipType = this.relationshipTypes.find(rt => rt.id === data.label || rt.label === data.label);
      if (!relationshipType) {
        warnings.push({
          field: 'label',
          message: `未知的关系类型: ${data.label}`,
          code: 'UNKNOWN_TYPE',
          impact: '可能缺少类型特定的验证和显示规则'
        });
      } else if (!relationshipType.allowsBidirectional && data.bidirectional) {
        errors.push({
          field: 'bidirectional',
          message: `关系类型 "${relationshipType.label}" 不支持双向关系`,
          code: 'BIDIRECTIONAL_NOT_ALLOWED',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get available relationship types
   */
  async getRelationshipTypes(): Promise<RelationshipType[]> {
    return this.relationshipTypes;
  }

  /**
   * Detect duplicate relationships
   */
  async detectDuplicateRelationships(
    newRelationship: CreateRelationshipData,
    existingRelationships?: Edge[]
  ): Promise<DuplicateRelationshipResult> {
    try {
      // Get existing relationships if not provided
      if (!existingRelationships) {
        const result = await this.getRelationships({
          fromNodeId: newRelationship.fromNodeId,
          toNodeId: newRelationship.toNodeId,
          limit: 100
        });
        existingRelationships = result.relationships;
      }

      // Check for exact duplicates
      const exactDuplicates = existingRelationships.filter(edge => 
        edge.fromNodeId === newRelationship.fromNodeId &&
        edge.toNodeId === newRelationship.toNodeId &&
        edge.label.toLowerCase() === newRelationship.label.toLowerCase()
      );

      if (exactDuplicates.length > 0) {
        return {
          isDuplicate: true,
          existingRelationships: exactDuplicates,
          similarityScore: 1.0,
          conflicts: []
        };
      }

      // Check for bidirectional duplicates
      if (newRelationship.bidirectional) {
        const bidirectionalDuplicates = existingRelationships.filter(edge => 
          edge.fromNodeId === newRelationship.toNodeId &&
          edge.toNodeId === newRelationship.fromNodeId &&
          edge.label.toLowerCase() === newRelationship.label.toLowerCase() &&
          edge.bidirectional
        );

        if (bidirectionalDuplicates.length > 0) {
          return {
            isDuplicate: true,
            existingRelationships: bidirectionalDuplicates,
            similarityScore: 0.9,
            conflicts: [{
              field: 'direction',
              existingValue: 'reverse',
              newValue: 'forward'
            }]
          };
        }
      }

      return {
        isDuplicate: false,
        existingRelationships: [],
        similarityScore: 0,
        conflicts: []
      };
    } catch (error) {
      console.error('[Relationship Manager] Error detecting duplicates:', error);
      return {
        isDuplicate: false,
        existingRelationships: [],
        similarityScore: 0,
        conflicts: []
      };
    }
  }
  /**
   * Get relationships for a specific node
   */
  async getNodeRelationships(nodeId: string, direction: 'incoming' | 'outgoing' | 'both' = 'both'): Promise<Edge[]> {
    try {
      const conditions: any = {};

      switch (direction) {
        case 'incoming':
          conditions.toNodeId = nodeId;
          break;
        case 'outgoing':
          conditions.fromNodeId = nodeId;
          break;
        case 'both':
          conditions.OR = [
            { fromNodeId: nodeId },
            { toNodeId: nodeId }
          ];
          break;
      }

      const relationships = await this.queryRelationships(conditions);
      return relationships;
    } catch (error) {
      console.error('[Relationship Manager] Error getting node relationships:', error);
      return [];
    }
  }

  /**
   * Get relationship statistics
   */
  async getRelationshipStatistics(): Promise<{
    totalRelationships: number;
    relationshipsByType: Record<string, number>;
    bidirectionalCount: number;
    averageWeight: number;
  }> {
    try {
      const [totalRelationships, relationshipsByType, bidirectionalCount, averageWeight] = await Promise.all([
        this.countRelationships({}),
        this.getRelationshipsByType(),
        this.countBidirectionalRelationships(),
        this.getAverageWeight()
      ]);

      return {
        totalRelationships,
        relationshipsByType,
        bidirectionalCount,
        averageWeight
      };
    } catch (error) {
      console.error('[Relationship Manager] Error getting statistics:', error);
      throw new Error(`获取统计信息失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find shortest path between two nodes
   */
  async findShortestPath(fromNodeId: string, toNodeId: string, maxDepth: number = 6): Promise<{
    path: Edge[];
    distance: number;
    found: boolean;
  }> {
    try {
      // Implement breadth-first search
      const visited = new Set<string>();
      const queue: Array<{ nodeId: string; path: Edge[]; distance: number }> = [
        { nodeId: fromNodeId, path: [], distance: 0 }
      ];

      while (queue.length > 0) {
        const current = queue.shift()!;
        
        if (current.nodeId === toNodeId) {
          return {
            path: current.path,
            distance: current.distance,
            found: true
          };
        }

        if (current.distance >= maxDepth || visited.has(current.nodeId)) {
          continue;
        }

        visited.add(current.nodeId);

        // Get outgoing relationships
        const outgoingRelationships = await this.getNodeRelationships(current.nodeId, 'outgoing');
        
        for (const edge of outgoingRelationships) {
          if (!visited.has(edge.toNodeId)) {
            queue.push({
              nodeId: edge.toNodeId,
              path: [...current.path, edge],
              distance: current.distance + 1
            });
          }
        }
      }

      return {
        path: [],
        distance: -1,
        found: false
      };
    } catch (error) {
      console.error('[Relationship Manager] Error finding shortest path:', error);
      return {
        path: [],
        distance: -1,
        found: false
      };
    }
  }

  /**
   * Get relationship recommendations for a node
   */
  async getRelationshipRecommendations(nodeId: string, limit: number = 10): Promise<{
    recommendedNodes: Array<{
      nodeId: string;
      nodeName: string;
      relationshipType: string;
      confidence: number;
      reason: string;
    }>;
  }> {
    try {
      // This is a simplified recommendation algorithm
      // In a real implementation, this would use more sophisticated ML/AI techniques
      
      const existingRelationships = await this.getNodeRelationships(nodeId);
      const connectedNodeIds = new Set([
        ...existingRelationships.map(r => r.fromNodeId),
        ...existingRelationships.map(r => r.toNodeId)
      ]);
      connectedNodeIds.delete(nodeId);

      // Find nodes that are connected to the same nodes (collaborative filtering approach)
      const recommendations: Array<{
        nodeId: string;
        nodeName: string;
        relationshipType: string;
        confidence: number;
        reason: string;
      }> = [];

      // This would be implemented with actual graph analysis
      // For now, return empty recommendations
      return { recommendedNodes: recommendations };
    } catch (error) {
      console.error('[Relationship Manager] Error getting recommendations:', error);
      return { recommendedNodes: [] };
    }
  }
  // Private helper methods (these would integrate with actual database in real implementation)

  private async queryRelationships(conditions: any, options?: any): Promise<Edge[]> {
    // This would use Prisma or another ORM in real implementation
    // For now, return mock data
    return [];
  }

  private async countRelationships(conditions: any): Promise<number> {
    // This would use Prisma count in real implementation
    return 0;
  }

  private async findRelationshipById(id: string): Promise<Edge | null> {
    // This would use Prisma findUnique in real implementation
    return null;
  }

  private async saveRelationship(relationshipData: any): Promise<Edge> {
    // This would use Prisma create/update in real implementation
    return {
      id: `edge_${Date.now()}`,
      ...relationshipData
    } as Edge;
  }

  private async deleteRelationshipById(id: string): Promise<void> {
    // This would use Prisma delete in real implementation
  }

  private async validateNodeExistence(fromNodeId: string, toNodeId: string): Promise<{
    valid: boolean;
    message: string;
  }> {
    // This would check if both nodes exist in the database
    // For now, assume they exist
    return {
      valid: true,
      message: ''
    };
  }

  private async getRelationshipsByType(): Promise<Record<string, number>> {
    // This would group relationships by type and count them
    return {};
  }

  private async countBidirectionalRelationships(): Promise<number> {
    // Count bidirectional relationships
    return 0;
  }

  private async getAverageWeight(): Promise<number> {
    // Calculate average weight of all relationships
    return 1.0;
  }
}

/**
 * Factory function to create Relationship Manager Service instance
 */
export function createRelationshipManagerService(): RelationshipManagerService {
  return new RelationshipManagerServiceImpl();
}

/**
 * Default singleton instance for convenience
 */
let defaultInstance: RelationshipManagerService | null = null;

export function getRelationshipManagerService(): RelationshipManagerService {
  if (!defaultInstance) {
    defaultInstance = createRelationshipManagerService();
  }
  return defaultInstance;
}