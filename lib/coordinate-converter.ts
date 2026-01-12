/**
 * 二维到三维坐标转换模块
 * 
 * 该模块负责将二维工作流画布的节点坐标转换为三维知识图谱的空间坐标
 */

export interface Node2D {
  id: string
  label: string
  description: string
  x: number  // 二维 x 坐标
  y: number  // 二维 y 坐标
}

export interface Node3D {
  label: string
  description: string
  x2d: number
  y2d: number
  x3d: number  // 三维 x 坐标
  y3d: number  // 三维 y 坐标（高度）
  z3d: number  // 三维 z 坐标
}

export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * 计算节点集合的边界框
 * @param nodes 二维节点数组
 * @returns 边界框坐标
 */
export function calculateBounds(nodes: Node2D[]): Bounds {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  }
  
  return {
    minX: Math.min(...nodes.map(n => n.x)),
    maxX: Math.max(...nodes.map(n => n.x)),
    minY: Math.min(...nodes.map(n => n.y)),
    maxY: Math.max(...nodes.map(n => n.y)),
  }
}

/**
 * 将二维坐标转换为三维坐标
 * 
 * 转换规则：
 * - 二维 x → 三维 x (保持水平位置)
 * - 二维 y → 三维 z (二维的垂直变为三维的深度)
 * - 三维 y 设为 0 (所有节点在同一水平面)
 * - 应用缩放使图谱适应三维视图
 * - 居中显示
 * 
 * @param node 单个二维节点
 * @param allNodes 所有节点（用于计算边界和缩放）
 * @returns 转换后的三维节点数据
 */
export function convertTo3DCoordinates(
  node: Node2D,
  allNodes: Node2D[]
): Node3D {
  // 1. 计算所有节点的边界框
  const bounds = calculateBounds(allNodes)
  
  // 2. 计算缩放因子（使图谱适应三维视图）
  const targetSize = 40  // 目标显示范围
  const scaleX = targetSize / (bounds.maxX - bounds.minX || 1)
  const scaleY = targetSize / (bounds.maxY - bounds.minY || 1)
  const scale = Math.min(scaleX, scaleY)
  
  // 3. 计算中心点
  const centerX = (bounds.maxX + bounds.minX) / 2
  const centerY = (bounds.maxY + bounds.minY) / 2
  
  // 4. 转换坐标
  // x2d → x3d (保持水平位置)
  const x3d = (node.x - centerX) * scale * 0.05
  
  // y2d → z3d (二维的垂直变为三维的深度)
  // 注意：y 轴反转，因为二维画布的 y 向下增长，而三维空间的 z 向前增长
  const z3d = -(node.y - centerY) * scale * 0.05
  
  // y3d 设为 0 (所有节点在同一水平面)
  const y3d = 0
  
  return {
    label: node.label,
    description: node.description,
    x2d: node.x,
    y2d: node.y,
    x3d,
    y3d,
    z3d,
  }
}

/**
 * 批量转换节点坐标
 * @param nodes 二维节点数组
 * @returns 转换后的三维节点数组
 */
export function convertNodesToCoordinates(nodes: Node2D[]): Node3D[] {
  return nodes.map(node => convertTo3DCoordinates(node, nodes))
}
