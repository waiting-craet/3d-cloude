/**
 * Node Manager Service
 * 
 * Provides comprehensive CRUD operations for knowledge graph nodes
 * with validation, search, filtering, and bulk operations support.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

/**
 * Node query options for filtering and pagination
 */
export interface NodeQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'type';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

/**
 * Paginated nodes result
 */
export interface PaginatedNodes {
  nodes: Node[];
  totalCount: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Node data for creation
 */
export interface CreateNodeData {
  name: string;
  type: string;
  content?: string;
  properties?: Record<string, any>;
  position?: { x: number; y: number; z: number };
  visualProperties?: VisualProperties;
  imageFile?: File;
  tags?: string[];
}

/**
 * Node data for updates
 */
export interface UpdateNodeData extends Partial<CreateNodeData> {
  id: string;
}

/**
 * Visual properties for node display
 */
export interface VisualProperties {
  color?: string;
  size?: number;
  shape?: 'circle' | 'square' | 'triangle' | 'diamond';
  opacity?: number;
}

/**
 * Node validation result
 */
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
/**
 * Validation error information
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Validation warning information
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  impact: string;
}

/**
 * Node operation for bulk processing
 */
export interface NodeOperation {
  type: 'create' | 'update' | 'delete';
  data: CreateNodeData | UpdateNodeData | { id: string };
  id?: string;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    operation: NodeOperation;
    error: string;
  }>;
  createdNodes: Node[];
  updatedNodes: Node[];
  deletedNodeIds: string[];
}

/**
 * Node deletion options
 */
export interface DeleteOptions {
  force?: boolean;
  cascadeEdges?: boolean;
  backup?: boolean;
}

/**
 * Node deletion result
 */
export interface DeletionResult {
  success: boolean;
  deletedNodeId: string;
  affectedEdges: number;
  warnings: string[];
  backupData?: any;
}

/**
 * Node data structure
 */
export interface Node {
  id: string;
  name: string;
  type: string;
  content?: string;
  properties: Record<string, any>;
  position?: { x: number; y: number; z: number };
  visualProperties?: VisualProperties;
  imageUrl?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
/**
 * Node Manager Service interface
 */
export interface NodeManagerService {
  /**
   * Get nodes with pagination and filtering
   */
  getNodes(options: NodeQueryOptions): Promise<PaginatedNodes>;

  /**
   * Get a single node by ID
   */
  getNodeById(id: string): Promise<Node | null>;

  /**
   * Create a new node with validation
   */
  createNode(nodeData: CreateNodeData): Promise<ValidationResult<Node>>;

  /**
   * Update existing node with conflict resolution
   */
  updateNode(
    nodeId: string, 
    updates: UpdateNodeData,
    conflictResolution?: any
  ): Promise<ValidationResult<Node>>;

  /**
   * Delete node with dependency checking
   */
  deleteNode(nodeId: string, options: DeleteOptions): Promise<DeletionResult>;

  /**
   * Validate node data before operations
   */
  validateNodeData(nodeData: CreateNodeData | UpdateNodeData): ValidationResult<any>;

  /**
   * Bulk operations for multiple nodes
   */
  bulkOperations(operations: NodeOperation[]): Promise<BulkOperationResult>;

  /**
   * Search nodes by text content
   */
  searchNodes(query: string, options?: NodeQueryOptions): Promise<PaginatedNodes>;

  /**
   * Get node statistics
   */
  getNodeStatistics(): Promise<{
    totalNodes: number;
    nodesByType: Record<string, number>;
    recentlyCreated: number;
    recentlyUpdated: number;
  }>;

  /**
   * Duplicate node detection
   */
  findDuplicateNodes(nodeData: CreateNodeData): Promise<Node[]>;

  /**
   * Get node relationships
   */
  getNodeRelationships(nodeId: string): Promise<{
    incomingEdges: any[];
    outgoingEdges: any[];
    totalConnections: number;
  }>;
}
/**
 * Implementation of Node Manager Service
 */
export class NodeManagerServiceImpl implements NodeManagerService {
  /**
   * Get nodes with pagination and filtering
   */
  async getNodes(options: NodeQueryOptions = {}): Promise<PaginatedNodes> {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      tags,
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
        conditions.type = type;
      }

      if (search) {
        conditions.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (tags && tags.length > 0) {
        conditions.tags = {
          hasSome: tags
        };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query (this would use Prisma in real implementation)
      const [nodes, totalCount] = await Promise.all([
        this.queryNodes(conditions, { skip, take: limit, sortBy, sortOrder }),
        this.countNodes(conditions)
      ]);

      return {
        nodes,
        totalCount,
        page,
        limit,
        hasNextPage: skip + limit < totalCount,
        hasPreviousPage: page > 1
      };
    } catch (error) {
      console.error('[Node Manager] Error getting nodes:', error);
      throw new Error(`获取节点失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a single node by ID
   */
  async getNodeById(id: string): Promise<Node | null> {
    try {
      // This would use Prisma in real implementation
      const node = await this.findNodeById(id);
      return node;
    } catch (error) {
      console.error('[Node Manager] Error getting node by ID:', error);
      throw new Error(`获取节点失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  /**
   * Create a new node with validation
   */
  async createNode(nodeData: CreateNodeData): Promise<ValidationResult<Node>> {
    // Validate input data
    const validation = this.validateNodeData(nodeData);
    if (!validation.isValid) {
      return validation as ValidationResult<Node>;
    }

    try {
      // Check for duplicates
      const duplicates = await this.findDuplicateNodes(nodeData);
      if (duplicates.length > 0) {
        return {
          isValid: false,
          errors: [{
            field: 'name',
            message: `节点名称 "${nodeData.name}" 已存在`,
            code: 'DUPLICATE_NAME',
            severity: 'error'
          }],
          warnings: []
        };
      }

      // Process image if provided
      let imageUrl: string | undefined;
      if (nodeData.imageFile) {
        imageUrl = await this.processNodeImage(nodeData.imageFile);
      }

      // Create node data
      const nodeToCreate = {
        name: nodeData.name,
        type: nodeData.type,
        content: nodeData.content,
        properties: nodeData.properties || {},
        position: nodeData.position,
        visualProperties: nodeData.visualProperties,
        imageUrl,
        tags: nodeData.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      // Save to database (this would use Prisma in real implementation)
      const createdNode = await this.saveNode(nodeToCreate);

      return {
        isValid: true,
        data: createdNode,
        errors: [],
        warnings: []
      };
    } catch (error) {
      console.error('[Node Manager] Error creating node:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: `创建节点失败: ${error instanceof Error ? error.message : String(error)}`,
          code: 'CREATE_ERROR',
          severity: 'error'
        }],
        warnings: []
      };
    }
  }

  /**
   * Update existing node with conflict resolution
   */
  async updateNode(
    nodeId: string, 
    updates: UpdateNodeData,
    conflictResolution?: any
  ): Promise<ValidationResult<Node>> {
    // Validate input data
    const validation = this.validateNodeData(updates);
    if (!validation.isValid) {
      return validation as ValidationResult<Node>;
    }

    try {
      // Get existing node
      const existingNode = await this.getNodeById(nodeId);
      if (!existingNode) {
        return {
          isValid: false,
          errors: [{
            field: 'id',
            message: `节点 ${nodeId} 不存在`,
            code: 'NODE_NOT_FOUND',
            severity: 'error'
          }],
          warnings: []
        };
      }

      // Process image if provided
      let imageUrl = existingNode.imageUrl;
      if (updates.imageFile) {
        imageUrl = await this.processNodeImage(updates.imageFile);
      }

      // Merge updates with existing data
      const updatedData = {
        ...existingNode,
        ...updates,
        imageUrl,
        updatedAt: new Date(),
        version: existingNode.version + 1
      };

      // Save updated node
      const updatedNode = await this.saveNode(updatedData);

      return {
        isValid: true,
        data: updatedNode,
        errors: [],
        warnings: []
      };
    } catch (error) {
      console.error('[Node Manager] Error updating node:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: `更新节点失败: ${error instanceof Error ? error.message : String(error)}`,
          code: 'UPDATE_ERROR',
          severity: 'error'
        }],
        warnings: []
      };
    }
  }
  /**
   * Delete node with dependency checking
   */
  async deleteNode(nodeId: string, options: DeleteOptions = {}): Promise<DeletionResult> {
    const { force = false, cascadeEdges = true, backup = true } = options;

    try {
      // Get existing node
      const existingNode = await this.getNodeById(nodeId);
      if (!existingNode) {
        return {
          success: false,
          deletedNodeId: nodeId,
          affectedEdges: 0,
          warnings: [`节点 ${nodeId} 不存在`]
        };
      }

      // Check for relationships
      const relationships = await this.getNodeRelationships(nodeId);
      const totalConnections = relationships.totalConnections;

      if (totalConnections > 0 && !force) {
        return {
          success: false,
          deletedNodeId: nodeId,
          affectedEdges: totalConnections,
          warnings: [`节点有 ${totalConnections} 个关系连接，请使用 force 选项强制删除`]
        };
      }

      // Create backup if requested
      let backupData: any;
      if (backup) {
        backupData = {
          node: existingNode,
          relationships: relationships,
          timestamp: new Date()
        };
      }

      // Delete relationships if cascading
      let affectedEdges = 0;
      if (cascadeEdges && totalConnections > 0) {
        affectedEdges = await this.deleteNodeRelationships(nodeId);
      }

      // Delete the node
      await this.deleteNodeById(nodeId);

      return {
        success: true,
        deletedNodeId: nodeId,
        affectedEdges,
        warnings: [],
        backupData
      };
    } catch (error) {
      console.error('[Node Manager] Error deleting node:', error);
      return {
        success: false,
        deletedNodeId: nodeId,
        affectedEdges: 0,
        warnings: [`删除节点失败: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Validate node data before operations
   */
  validateNodeData(nodeData: CreateNodeData | UpdateNodeData): ValidationResult<any> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate required fields for creation
    if ('name' in nodeData && !nodeData.name) {
      errors.push({
        field: 'name',
        message: '节点名称不能为空',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    if ('type' in nodeData && !nodeData.type) {
      errors.push({
        field: 'type',
        message: '节点类型不能为空',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    // Validate name length
    if (nodeData.name && nodeData.name.length > 200) {
      errors.push({
        field: 'name',
        message: '节点名称不能超过200个字符',
        code: 'MAX_LENGTH',
        severity: 'error'
      });
    }

    // Validate content length
    if (nodeData.content && nodeData.content.length > 10000) {
      warnings.push({
        field: 'content',
        message: '节点内容较长，可能影响性能',
        code: 'LONG_CONTENT',
        impact: '可能导致加载缓慢'
      });
    }

    // Validate position coordinates
    if (nodeData.position) {
      const { x, y, z } = nodeData.position;
      if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
        errors.push({
          field: 'position',
          message: '位置坐标必须是数字',
          code: 'INVALID_TYPE',
          severity: 'error'
        });
      }
    }

    // Validate visual properties
    if (nodeData.visualProperties) {
      const visual = nodeData.visualProperties;
      if (visual.size && (visual.size < 0.1 || visual.size > 10)) {
        warnings.push({
          field: 'visualProperties.size',
          message: '节点大小建议在0.1到10之间',
          code: 'SIZE_RANGE',
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

    // Validate tags
    if (nodeData.tags) {
      if (nodeData.tags.length > 20) {
        warnings.push({
          field: 'tags',
          message: '标签数量较多，建议控制在20个以内',
          code: 'TOO_MANY_TAGS',
          impact: '可能影响搜索性能'
        });
      }

      for (const tag of nodeData.tags) {
        if (tag.length > 50) {
          errors.push({
            field: 'tags',
            message: `标签 "${tag}" 长度不能超过50个字符`,
            code: 'TAG_TOO_LONG',
            severity: 'error'
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  /**
   * Bulk operations for multiple nodes
   */
  async bulkOperations(operations: NodeOperation[]): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: false,
      processedCount: 0,
      successCount: 0,
      failureCount: 0,
      errors: [],
      createdNodes: [],
      updatedNodes: [],
      deletedNodeIds: []
    };

    for (const operation of operations) {
      result.processedCount++;

      try {
        switch (operation.type) {
          case 'create':
            const createResult = await this.createNode(operation.data as CreateNodeData);
            if (createResult.isValid && createResult.data) {
              result.createdNodes.push(createResult.data);
              result.successCount++;
            } else {
              result.errors.push({
                operation,
                error: createResult.errors.map(e => e.message).join(', ')
              });
              result.failureCount++;
            }
            break;

          case 'update':
            const updateData = operation.data as UpdateNodeData;
            const updateResult = await this.updateNode(updateData.id, updateData);
            if (updateResult.isValid && updateResult.data) {
              result.updatedNodes.push(updateResult.data);
              result.successCount++;
            } else {
              result.errors.push({
                operation,
                error: updateResult.errors.map(e => e.message).join(', ')
              });
              result.failureCount++;
            }
            break;

          case 'delete':
            const deleteData = operation.data as { id: string };
            const deleteResult = await this.deleteNode(deleteData.id);
            if (deleteResult.success) {
              result.deletedNodeIds.push(deleteResult.deletedNodeId);
              result.successCount++;
            } else {
              result.errors.push({
                operation,
                error: deleteResult.warnings.join(', ')
              });
              result.failureCount++;
            }
            break;
        }
      } catch (error) {
        result.errors.push({
          operation,
          error: error instanceof Error ? error.message : String(error)
        });
        result.failureCount++;
      }
    }

    result.success = result.failureCount === 0;
    return result;
  }

  /**
   * Search nodes by text content
   */
  async searchNodes(query: string, options: NodeQueryOptions = {}): Promise<PaginatedNodes> {
    const searchOptions = {
      ...options,
      search: query
    };
    return this.getNodes(searchOptions);
  }

  /**
   * Get node statistics
   */
  async getNodeStatistics(): Promise<{
    totalNodes: number;
    nodesByType: Record<string, number>;
    recentlyCreated: number;
    recentlyUpdated: number;
  }> {
    try {
      const [totalNodes, nodesByType, recentlyCreated, recentlyUpdated] = await Promise.all([
        this.countNodes({}),
        this.getNodesByType(),
        this.countRecentlyCreated(),
        this.countRecentlyUpdated()
      ]);

      return {
        totalNodes,
        nodesByType,
        recentlyCreated,
        recentlyUpdated
      };
    } catch (error) {
      console.error('[Node Manager] Error getting statistics:', error);
      throw new Error(`获取统计信息失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Duplicate node detection
   */
  async findDuplicateNodes(nodeData: CreateNodeData): Promise<Node[]> {
    try {
      // Search for nodes with similar names
      const similarNodes = await this.queryNodes({
        name: { contains: nodeData.name, mode: 'insensitive' }
      });

      // Filter for exact matches or high similarity
      return similarNodes.filter(node => 
        node.name.toLowerCase().trim() === nodeData.name.toLowerCase().trim()
      );
    } catch (error) {
      console.error('[Node Manager] Error finding duplicates:', error);
      return [];
    }
  }

  /**
   * Get node relationships
   */
  async getNodeRelationships(nodeId: string): Promise<{
    incomingEdges: any[];
    outgoingEdges: any[];
    totalConnections: number;
  }> {
    try {
      const [incomingEdges, outgoingEdges] = await Promise.all([
        this.getIncomingEdges(nodeId),
        this.getOutgoingEdges(nodeId)
      ]);

      return {
        incomingEdges,
        outgoingEdges,
        totalConnections: incomingEdges.length + outgoingEdges.length
      };
    } catch (error) {
      console.error('[Node Manager] Error getting relationships:', error);
      return {
        incomingEdges: [],
        outgoingEdges: [],
        totalConnections: 0
      };
    }
  }
  // Private helper methods (these would integrate with actual database in real implementation)

  private async queryNodes(conditions: any, options?: any): Promise<Node[]> {
    // This would use Prisma or another ORM in real implementation
    // For now, return mock data
    return [];
  }

  private async countNodes(conditions: any): Promise<number> {
    // This would use Prisma count in real implementation
    return 0;
  }

  private async findNodeById(id: string): Promise<Node | null> {
    // This would use Prisma findUnique in real implementation
    return null;
  }

  private async saveNode(nodeData: any): Promise<Node> {
    // This would use Prisma create/update in real implementation
    return {
      id: `node_${Date.now()}`,
      ...nodeData
    } as Node;
  }

  private async deleteNodeById(id: string): Promise<void> {
    // This would use Prisma delete in real implementation
  }

  private async deleteNodeRelationships(nodeId: string): Promise<number> {
    // This would delete all edges connected to the node
    return 0;
  }

  private async processNodeImage(imageFile: File): Promise<string> {
    // This would handle image upload and processing
    // For now, return a mock URL
    return `https://example.com/images/${Date.now()}_${imageFile.name}`;
  }

  private async getNodesByType(): Promise<Record<string, number>> {
    // This would group nodes by type and count them
    return {};
  }

  private async countRecentlyCreated(): Promise<number> {
    // Count nodes created in the last 7 days
    return 0;
  }

  private async countRecentlyUpdated(): Promise<number> {
    // Count nodes updated in the last 7 days
    return 0;
  }

  private async getIncomingEdges(nodeId: string): Promise<any[]> {
    // Get edges where this node is the target
    return [];
  }

  private async getOutgoingEdges(nodeId: string): Promise<any[]> {
    // Get edges where this node is the source
    return [];
  }
}

/**
 * Factory function to create Node Manager Service instance
 */
export function createNodeManagerService(): NodeManagerService {
  return new NodeManagerServiceImpl();
}

/**
 * Default singleton instance for convenience
 */
let defaultInstance: NodeManagerService | null = null;

export function getNodeManagerService(): NodeManagerService {
  if (!defaultInstance) {
    defaultInstance = createNodeManagerService();
  }
  return defaultInstance;
}