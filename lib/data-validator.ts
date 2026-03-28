/**
 * 数据验证模块
 * 
 * 负责验证二维工作流数据的完整性和有效性
 */

export interface WorkflowNode {
  id: string
  label: string
  description: string
  x: number
  y: number
}

export interface WorkflowConnection {
  id: string
  from: string
  to: string
  label?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 验证节点标题是否有效（非空且非纯空白）
 * @param label 节点标题
 * @returns 是否有效
 */
export function isValidNodeLabel(label: string): boolean {
  return typeof label === 'string' && label.trim().length > 0
}

/**
 * 验证单个节点数据
 * @param node 节点数据
 * @returns 验证结果
 */
export function validateNode(node: WorkflowNode): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 验证 ID
  if (!node.id || typeof node.id !== 'string') {
    errors.push(`节点缺少有效的 ID`)
  }

  // 验证标题
  if (!isValidNodeLabel(node.label)) {
    errors.push(`节点 ${node.id} 的标题为空或无效`)
  }

  // 验证坐标
  if (typeof node.x !== 'number' || typeof node.y !== 'number') {
    errors.push(`节点 ${node.id} 的坐标无效`)
  }

  // 验证描述（可选，但如果存在应该是字符串）
  if (node.description !== undefined && typeof node.description !== 'string') {
    warnings.push(`节点 ${node.id} 的描述类型无效`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 验证连接数据
 * @param connection 连接数据
 * @param validNodeIds 有效的节点 ID 集合
 * @returns 验证结果
 */
export function validateConnection(
  connection: WorkflowConnection,
  validNodeIds: Set<string>
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 验证 ID
  if (!connection.id || typeof connection.id !== 'string') {
    errors.push(`连接缺少有效的 ID`)
  }

  // 验证起点节点存在
  if (!connection.from || !validNodeIds.has(connection.from)) {
    errors.push(`连接 ${connection.id} 的起点节点 ${connection.from} 不存在`)
  }

  // 验证终点节点存在
  if (!connection.to || !validNodeIds.has(connection.to)) {
    errors.push(`连接 ${connection.id} 的终点节点 ${connection.to} 不存在`)
  }

  // 验证不是自连接
  if (connection.from === connection.to) {
    warnings.push(`连接 ${connection.id} 是自连接（起点和终点相同）`)
  }

  // 验证标签（可选）
  if (connection.label !== undefined && typeof connection.label !== 'string') {
    warnings.push(`连接 ${connection.id} 的标签类型无效`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 验证完整的工作流数据
 * @param nodes 节点数组
 * @param connections 连接数组
 * @returns 验证结果
 */
export function validateWorkflowData(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 验证至少有一个节点
  if (!nodes || nodes.length === 0) {
    errors.push('工作流数据中没有节点')
    return { isValid: false, errors, warnings }
  }

  // 验证每个节点
  const validNodeIds = new Set<string>()
  nodes.forEach(node => {
    const result = validateNode(node)
    if (result.isValid) {
      validNodeIds.add(node.id)
    }
    errors.push(...result.errors)
    warnings.push(...result.warnings)
  })

  // 如果没有有效节点，返回错误
  if (validNodeIds.size === 0) {
    errors.push('没有有效的节点（所有节点标题都为空）')
    return { isValid: false, errors, warnings }
  }

  // 验证每个连接
  if (connections && connections.length > 0) {
    connections.forEach(connection => {
      const result = validateConnection(connection, validNodeIds)
      errors.push(...result.errors)
      warnings.push(...result.warnings)
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 清理无效数据
 * 移除标题为空的节点和指向不存在节点的连接
 * @param nodes 节点数组
 * @param connections 连接数组
 * @returns 清理后的数据
 */
export function cleanWorkflowData(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): {
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  removed: {
    nodes: number
    connections: number
  }
} {
  // 过滤有效节点
  const validNodes = nodes.filter(node => isValidNodeLabel(node.label))
  const validNodeIds = new Set(validNodes.map(n => n.id))

  // 过滤有效连接
  const validConnections = connections.filter(
    conn => validNodeIds.has(conn.from) && validNodeIds.has(conn.to)
  )

  return {
    nodes: validNodes,
    connections: validConnections,
    removed: {
      nodes: nodes.length - validNodes.length,
      connections: connections.length - validConnections.length,
    },
  }
}
