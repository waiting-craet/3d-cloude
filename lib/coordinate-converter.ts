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
 * Configuration for 3D coordinate conversion
 */
export interface ConversionConfig {
  heightVariation?: number  // Y-axis variation (default: 5)
  minNodeDistance?: number  // Minimum distance between nodes (default: 2)
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
 * - 三维 y 使用多种模式添加高度变化，创造层次感
 * - 应用大幅缩放使节点分散
 * - 居中显示
 * - 根据节点数量动态调整间距
 * 
 * @param node 单个二维节点
 * @param allNodes 所有节点（用于计算边界和缩放）
 * @param config 转换配置
 * @returns 转换后的三维节点数据
 */
export function convertTo3DCoordinates(
  node: Node2D,
  allNodes: Node2D[],
  config: ConversionConfig = {}
): Node3D {
  const { heightVariation = 8, minNodeDistance = 18 } = config
  
  // 1. 计算所有节点的边界框
  const bounds = calculateBounds(allNodes)
  
  // 2. 计算缩放因子（使图谱适应三维视图）
  const targetSize = 60  // 增加目标显示范围从 40 到 60
  const scaleX = targetSize / (bounds.maxX - bounds.minX || 1)
  const scaleY = targetSize / (bounds.maxY - bounds.minY || 1)
  const scale = Math.min(scaleX, scaleY)
  
  // 3. 根据节点数量动态调整间距因子
  // 节点越多，间距因子越大，确保不会太拥挤
  const nodeCount = allNodes.length
  let spacingFactor = 1.5  // 基础间距从 1.0 增加到 1.5
  
  if (nodeCount <= 10) {
    spacingFactor = 1.5      // 10个节点以内：1.5倍间距
  } else if (nodeCount <= 20) {
    spacingFactor = 2.0      // 11-20个节点：2倍间距
  } else if (nodeCount <= 50) {
    spacingFactor = 2.5      // 21-50个节点：2.5倍间距
  } else if (nodeCount <= 100) {
    spacingFactor = 3.0      // 51-100个节点：3倍间距
  } else {
    spacingFactor = 4.0      // 100+个节点：4倍间距
  }
  
  // 4. 计算中心点
  const centerX = (bounds.maxX + bounds.minX) / 2
  const centerY = (bounds.maxY + bounds.minY) / 2
  
  // 5. 找到当前节点的索引（用于 Y 轴变化）
  const nodeIndex = allNodes.findIndex(n => n.id === node.id)
  
  // 6. 转换坐标
  // x2d → x3d (保持水平位置)
  // 应用动态间距因子，节点多时自动增加间距
  // 增加基础缩放从 0.6 到 1.2
  const x3d = (node.x - centerX) * scale * 1.2 * spacingFactor
  
  // y2d → z3d (二维的垂直变为三维的深度)
  // 注意：y 轴反转，因为二维画布的 y 向下增长，而三维空间的 z 向前增长
  const z3d = -(node.y - centerY) * scale * 1.2 * spacingFactor
  
  // 7. y3d 使用多种模式创建丰富的高度变化，增加层次感
  // 组合正弦波、余弦波和线性变化
  const heightFactor = nodeCount > 50 ? 2.0 : 1.5  // 增加高度因子
  
  // 使用多个波形叠加创造更丰富的高度变化
  const wave1 = Math.sin(nodeIndex * 0.5) * heightVariation
  const wave2 = Math.cos(nodeIndex * 0.3) * heightVariation * 0.5
  const linear = (nodeIndex % 5) * heightVariation * 0.3  // 添加阶梯式变化
  
  const y3d = (wave1 + wave2 + linear) * heightFactor
  
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
 * @param config 转换配置
 * @returns 转换后的三维节点数组
 */
export function convertNodesToCoordinates(
  nodes: Node2D[],
  config: ConversionConfig = {}
): Node3D[] {
  const converted = nodes.map(node => convertTo3DCoordinates(node, nodes, config))
  
  // 应用最小距离强制
  if (config.minNodeDistance && config.minNodeDistance > 0) {
    return enforceMinimumDistance(converted, config.minNodeDistance)
  }
  
  return converted
}

/**
 * 强制节点之间的最小距离
 * 
 * 使用增强的迭代方法推开距离过近的节点对
 * 
 * @param nodes 三维节点数组
 * @param minDistance 最小距离
 * @param maxIterations 最大迭代次数
 * @returns 调整后的节点数组
 */
export function enforceMinimumDistance(
  nodes: Node3D[],
  minDistance: number,
  maxIterations: number = 50  // 增加迭代次数到 50
): Node3D[] {
  if (nodes.length <= 1) return nodes
  
  console.log(`🔧 开始强制最小距离: ${minDistance} 单位，最多 ${maxIterations} 次迭代`)
  
  // 创建可变的坐标数组
  const positions = nodes.map(n => ({ x: n.x3d, y: n.y3d, z: n.z3d }))
  
  // 迭代调整位置
  for (let iter = 0; iter < maxIterations; iter++) {
    let adjusted = false
    let maxAdjustment = 0
    let violationCount = 0
    
    // 检查所有节点对
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const pos1 = positions[i]
        const pos2 = positions[j]
        
        // 计算当前距离
        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        const dz = pos2.z - pos1.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
        
        // 如果距离太近，推开它们
        if (distance < minDistance && distance > 0.01) {  // 避免除以零
          adjusted = true
          violationCount++
          
          // 计算推开的方向和距离
          // 使用非常强的推力，确保节点真正分开
          const pushDistance = (minDistance - distance) / 2 * 2.0  // 增加推力到 2.0
          const factor = pushDistance / distance
          
          maxAdjustment = Math.max(maxAdjustment, pushDistance)
          
          // 沿着连接向量推开两个节点
          pos1.x -= dx * factor
          pos1.y -= dy * factor
          pos1.z -= dz * factor
          
          pos2.x += dx * factor
          pos2.y += dy * factor
          pos2.z += dz * factor
        }
      }
    }
    
    if (iter % 10 === 0 || !adjusted) {
      console.log(`   迭代 ${iter}: ${violationCount} 个违规, 最大调整 ${maxAdjustment.toFixed(2)}`)
    }
    
    // 如果调整很小或没有调整，提前退出
    if (!adjusted || maxAdjustment < 0.01) {
      console.log(`✅ 完成于迭代 ${iter}`)
      break
    }
  }
  
  // 返回更新后的节点
  return nodes.map((node, i) => ({
    ...node,
    x3d: positions[i].x,
    y3d: positions[i].y,
    z3d: positions[i].z,
  }))
}

/**
 * 计算两个3D点之间的欧几里得距离
 */
export function calculateDistance3D(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number }
): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dz = p2.z - p1.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}
