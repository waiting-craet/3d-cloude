/**
 * 统一数据验证器
 * 实现导入页面3D统一化规范中的数据验证逻辑
 * 
 * 主要功能：
 * - 验证3D坐标完整性
 * - 验证节点ID唯一性
 * - 验证边引用完整性
 * - 提供详细的错误信息和修复建议
 */

import { NodeData, EdgeData, ParsedGraphData } from './graph-import'

// 验证错误类型
export interface ValidationError {
  type: 'COORDINATE_MISSING' | 'DUPLICATE_NODE_ID' | 'INVALID_EDGE_REFERENCE' | 'INVALID_FILE_FORMAT' | 'INVALID_COORDINATE_VALUE'
  message: string
  details: string
  suggestions: string[]
  nodeId?: string
  edgeIndex?: number
}

// 验证结果接口
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  data?: ParsedGraphData
}

// 图谱数据接口（强制3D格式）
export interface ValidatedGraphData {
  nodes: ValidatedNode[]
  edges: ValidatedEdge[]
  metadata: {
    type: '3D'
    version: string
    createdAt: Date
    updatedAt: Date
    nodeCount: number
    edgeCount: number
  }
}

// 验证后的节点接口（确保3D坐标）
export interface ValidatedNode {
  id: string
  label: string
  description: string
  x: number
  y: number
  z: number
  color?: string
  size?: number
  shape?: string
}

// 验证后的边接口
export interface ValidatedEdge {
  source: string
  target: string
  label: string
}

/**
 * 统一数据验证器类
 * 实现设计文档中的validateGraphData函数规范
 */
export class DataValidator {
  /**
   * 验证图谱数据
   * 
   * 前置条件：
   * - data包含nodes和edges数组
   * - data.metadata.type为'3D'
   * 
   * 后置条件：
   * - 所有节点ID唯一
   * - 所有边引用存在的节点
   * - 所有节点包含完整的3D坐标
   * - 如果验证失败，抛出详细错误信息
   */
  static validateGraphData(data: ParsedGraphData): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // 验证基本数据结构
    if (!data.nodes || !Array.isArray(data.nodes)) {
      errors.push({
        type: 'INVALID_FILE_FORMAT',
        message: '数据格式错误：缺少节点数组',
        details: '图谱数据必须包含nodes数组',
        suggestions: [
          '确保数据文件包含nodes字段',
          '检查文件格式是否正确',
          '参考模板文件的数据结构'
        ]
      })
    }

    if (!data.edges || !Array.isArray(data.edges)) {
      errors.push({
        type: 'INVALID_FILE_FORMAT',
        message: '数据格式错误：缺少边数组',
        details: '图谱数据必须包含edges数组',
        suggestions: [
          '确保数据文件包含edges字段',
          '如果没有边数据，请提供空数组[]',
          '参考模板文件的数据结构'
        ]
      })
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    // 验证节点数据
    const nodeValidationResult = this.validateNodes(data.nodes)
    errors.push(...nodeValidationResult.errors)
    warnings.push(...nodeValidationResult.warnings)

    // 验证边数据
    const edgeValidationResult = this.validateEdges(data.edges, data.nodes)
    errors.push(...edgeValidationResult.errors)
    warnings.push(...edgeValidationResult.warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data
    }
  }

  /**
   * 验证节点数据
   * 检查3D坐标完整性和节点ID唯一性
   */
  private static validateNodes(nodes: NodeData[]): { errors: ValidationError[], warnings: ValidationError[] } {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    const nodeIds = new Set<string>()
    const duplicateIds = new Set<string>()

    nodes.forEach((node, index) => {
      const nodeId = node.id || node.label || `node-${index}`

      // 验证节点ID唯一性（属性4）
      if (nodeIds.has(nodeId)) {
        duplicateIds.add(nodeId)
        errors.push({
          type: 'DUPLICATE_NODE_ID',
          message: `重复的节点ID: ${nodeId}`,
          details: `节点ID "${nodeId}" 在数据中出现多次`,
          suggestions: [
            '确保每个节点都有唯一的ID',
            '检查数据文件中是否有重复的节点',
            '可以在ID后添加数字后缀来区分重复节点'
          ],
          nodeId
        })
      } else {
        nodeIds.add(nodeId)
      }

      // 验证3D坐标完整性（属性1）
      if (node.x === undefined || node.x === null || isNaN(node.x)) {
        errors.push({
          type: 'COORDINATE_MISSING',
          message: `节点 ${nodeId} 缺少有效的x坐标`,
          details: `节点的x坐标值为: ${node.x}`,
          suggestions: [
            '确保所有节点都包含有效的x坐标',
            '坐标值必须是数字类型',
            '参考3D模板文件的坐标格式'
          ],
          nodeId
        })
      }

      if (node.y === undefined || node.y === null || isNaN(node.y)) {
        errors.push({
          type: 'COORDINATE_MISSING',
          message: `节点 ${nodeId} 缺少有效的y坐标`,
          details: `节点的y坐标值为: ${node.y}`,
          suggestions: [
            '确保所有节点都包含有效的y坐标',
            '坐标值必须是数字类型',
            '参考3D模板文件的坐标格式'
          ],
          nodeId
        })
      }

      if (node.z === undefined || node.z === null || isNaN(node.z)) {
        errors.push({
          type: 'COORDINATE_MISSING',
          message: `节点 ${nodeId} 缺少有效的z坐标`,
          details: `节点的z坐标值为: ${node.z}`,
          suggestions: [
            '确保所有节点都包含有效的z坐标',
            '对于2D数据，z坐标可以设置为0',
            '参考3D模板文件的坐标格式'
          ],
          nodeId
        })
      }

      // 验证坐标值的合理性
      if (typeof node.x === 'number' && (Math.abs(node.x) > 10000)) {
        warnings.push({
          type: 'INVALID_COORDINATE_VALUE',
          message: `节点 ${nodeId} 的x坐标值过大`,
          details: `x坐标值为: ${node.x}，建议在-10000到10000范围内`,
          suggestions: [
            '检查坐标值是否正确',
            '考虑缩放坐标值到合理范围',
            '确保坐标单位正确'
          ],
          nodeId
        })
      }

      if (typeof node.y === 'number' && (Math.abs(node.y) > 10000)) {
        warnings.push({
          type: 'INVALID_COORDINATE_VALUE',
          message: `节点 ${nodeId} 的y坐标值过大`,
          details: `y坐标值为: ${node.y}，建议在-10000到10000范围内`,
          suggestions: [
            '检查坐标值是否正确',
            '考虑缩放坐标值到合理范围',
            '确保坐标单位正确'
          ],
          nodeId
        })
      }

      if (typeof node.z === 'number' && (Math.abs(node.z) > 10000)) {
        warnings.push({
          type: 'INVALID_COORDINATE_VALUE',
          message: `节点 ${nodeId} 的z坐标值过大`,
          details: `z坐标值为: ${node.z}，建议在-10000到10000范围内`,
          suggestions: [
            '检查坐标值是否正确',
            '考虑缩放坐标值到合理范围',
            '确保坐标单位正确'
          ],
          nodeId
        })
      }

      // 验证必需字段
      if (!node.label || node.label.trim() === '') {
        warnings.push({
          type: 'INVALID_FILE_FORMAT',
          message: `节点 ${nodeId} 缺少标签`,
          details: '节点标签为空或未定义',
          suggestions: [
            '为每个节点提供有意义的标签',
            '标签用于在图谱中显示节点名称',
            '可以使用节点ID作为默认标签'
          ],
          nodeId
        })
      }
    })

    return { errors, warnings }
  }

  /**
   * 验证边数据
   * 检查边引用完整性
   */
  private static validateEdges(edges: EdgeData[], nodes: NodeData[]): { errors: ValidationError[], warnings: ValidationError[] } {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // 创建节点ID集合用于快速查找
    const nodeIds = new Set<string>()
    nodes.forEach((node, index) => {
      const nodeId = node.id || node.label || `node-${index}`
      nodeIds.add(nodeId)
    })

    edges.forEach((edge, index) => {
      // 验证边引用完整性（属性5）
      if (!edge.source || edge.source.trim() === '') {
        errors.push({
          type: 'INVALID_EDGE_REFERENCE',
          message: `边 ${index + 1} 缺少源节点`,
          details: '边的source字段为空或未定义',
          suggestions: [
            '确保每条边都有有效的源节点ID',
            '检查数据文件中的source列',
            '源节点ID必须对应存在的节点'
          ],
          edgeIndex: index
        })
      } else if (!nodeIds.has(edge.source)) {
        errors.push({
          type: 'INVALID_EDGE_REFERENCE',
          message: `边 ${index + 1} 引用了不存在的源节点: ${edge.source}`,
          details: `源节点 "${edge.source}" 在节点列表中不存在`,
          suggestions: [
            '检查源节点ID是否正确',
            '确保所有引用的节点都在节点列表中',
            '检查节点ID的大小写和空格'
          ],
          edgeIndex: index
        })
      }

      if (!edge.target || edge.target.trim() === '') {
        errors.push({
          type: 'INVALID_EDGE_REFERENCE',
          message: `边 ${index + 1} 缺少目标节点`,
          details: '边的target字段为空或未定义',
          suggestions: [
            '确保每条边都有有效的目标节点ID',
            '检查数据文件中的target列',
            '目标节点ID必须对应存在的节点'
          ],
          edgeIndex: index
        })
      } else if (!nodeIds.has(edge.target)) {
        errors.push({
          type: 'INVALID_EDGE_REFERENCE',
          message: `边 ${index + 1} 引用了不存在的目标节点: ${edge.target}`,
          details: `目标节点 "${edge.target}" 在节点列表中不存在`,
          suggestions: [
            '检查目标节点ID是否正确',
            '确保所有引用的节点都在节点列表中',
            '检查节点ID的大小写和空格'
          ],
          edgeIndex: index
        })
      }

      // 检查自环边（警告）
      if (edge.source === edge.target) {
        warnings.push({
          type: 'INVALID_EDGE_REFERENCE',
          message: `边 ${index + 1} 是自环边`,
          details: `边连接同一个节点: ${edge.source}`,
          suggestions: [
            '检查边数据是否正确',
            '自环边在某些情况下是有效的',
            '确认这是预期的连接关系'
          ],
          edgeIndex: index
        })
      }
    })

    return { errors, warnings }
  }

  /**
   * 验证文件格式
   * 检查文件类型和基本结构
   */
  static validateFileFormat(file: File): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // 验证文件大小（需求6.3）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      errors.push({
        type: 'INVALID_FILE_FORMAT',
        message: '文件大小超过限制',
        details: `文件大小: ${(file.size / 1024 / 1024).toFixed(2)}MB，最大允许: 10MB`,
        suggestions: [
          '请将文件分割为多个较小的文件',
          '删除不必要的数据列',
          '压缩文件内容'
        ]
      })
    }

    // 验证文件类型（属性8）
    const supportedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
      'application/json'
    ]

    const supportedExtensions = ['.xlsx', '.xls', '.csv', '.json']
    const fileName = file.name.toLowerCase()
    const hasValidExtension = supportedExtensions.some(ext => fileName.endsWith(ext))

    if (!supportedTypes.includes(file.type) && !hasValidExtension) {
      errors.push({
        type: 'INVALID_FILE_FORMAT',
        message: '不支持的文件格式',
        details: `文件类型: ${file.type}，文件名: ${file.name}`,
        suggestions: [
          '支持的格式：Excel (.xlsx, .xls)、CSV (.csv)、JSON (.json)',
          '请转换文件格式后重新上传',
          '下载模板文件参考正确格式'
        ]
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 生成验证报告
   * 提供详细的错误信息和修复建议
   */
  static generateValidationReport(result: ValidationResult): string {
    if (result.isValid) {
      return '✅ 数据验证通过！所有数据符合3D图谱格式要求。'
    }

    let report = '❌ 数据验证失败，发现以下问题：\n\n'

    // 错误信息
    if (result.errors.length > 0) {
      report += '🚨 错误（必须修复）：\n'
      result.errors.forEach((error, index) => {
        report += `${index + 1}. ${error.message}\n`
        report += `   详情: ${error.details}\n`
        report += `   建议: ${error.suggestions.join('；')}\n\n`
      })
    }

    // 警告信息
    if (result.warnings.length > 0) {
      report += '⚠️ 警告（建议修复）：\n'
      result.warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning.message}\n`
        report += `   详情: ${warning.details}\n`
        report += `   建议: ${warning.suggestions.join('；')}\n\n`
      })
    }

    report += '📋 修复完成后请重新上传文件。'
    return report
  }

  /**
   * 创建验证后的图谱数据
   * 确保所有数据符合3D格式要求
   */
  static createValidatedGraphData(data: ParsedGraphData): ValidatedGraphData {
    const validatedNodes: ValidatedNode[] = data.nodes.map((node, index) => ({
      id: node.id || node.label || `node-${index}`,
      label: node.label || `节点-${index}`,
      description: node.description || '',
      x: node.x || 0,
      y: node.y || 0,
      z: node.z || 0,
      color: node.color,
      size: node.size,
      shape: node.shape
    }))

    const validatedEdges: ValidatedEdge[] = data.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      label: edge.label || ''
    }))

    return {
      nodes: validatedNodes,
      edges: validatedEdges,
      metadata: {
        type: '3D',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        nodeCount: validatedNodes.length,
        edgeCount: validatedEdges.length
      }
    }
  }
}

/**
 * 便捷函数：验证并创建图谱数据
 * 组合验证和创建过程
 */
export function validateAndCreateGraphData(data: ParsedGraphData): {
  result: ValidationResult
  validatedData?: ValidatedGraphData
} {
  const result = DataValidator.validateGraphData(data)
  
  if (result.isValid) {
    const validatedData = DataValidator.createValidatedGraphData(data)
    return { result, validatedData }
  }
  
  return { result }
}