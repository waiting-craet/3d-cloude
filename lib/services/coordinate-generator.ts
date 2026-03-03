/**
 * CoordinateGenerator - 为节点自动生成3D空间坐标
 * 
 * 使用力导向布局算法为没有坐标的节点生成合理的3D位置
 * 支持向后兼容（保留用户提供的坐标）
 */

export interface CoordinateGeneratorConfig {
  iterations?: number          // 迭代次数，默认100
  springLength?: number        // 弹簧长度，默认30
  springStrength?: number      // 弹簧强度，默认0.1
  repulsionStrength?: number   // 排斥力强度，默认1000
  damping?: number            // 阻尼系数，默认0.9
  minDistance?: number        // 最小节点间距，默认20
  timeout?: number            // 超时时间（毫秒），默认10000
}

export interface NodeData {
  id?: string
  label: string
  description?: string
  image?: string
  video?: string
  x?: number
  y?: number
  z?: number
  color?: string
  size?: number
  shape?: string
}

export interface EdgeData {
  source: string
  target: string
  label?: string
}

export interface CoordinateGenerationResult {
  nodes: NodeData[]           // 包含坐标的节点数组
  generatedCount: number      // 生成坐标的节点数量
  providedCount: number       // 用户提供坐标的节点数量
  executionTime: number       // 执行时间（毫秒）
  usedFallback: boolean      // 是否使用了后备算法
}

interface Vector3D {
  x: number
  y: number
  z: number
}

export class CoordinateGenerator {
  private readonly DEFAULT_CONFIG: Required<CoordinateGeneratorConfig> = {
    iterations: 100,
    springLength: 100,        // 增加弹簧长度,使连接的节点距离更远
    springStrength: 0.1,
    repulsionStrength: 3000,  // 增加排斥力,使节点分散得更开
    damping: 0.9,
    minDistance: 50,          // 增加最小间距,避免节点重叠
    timeout: 10000
  }

  /**
   * 主要方法：为节点生成坐标
   */
  generateCoordinates(
    nodes: NodeData[],
    edges: EdgeData[],
    config?: CoordinateGeneratorConfig
  ): CoordinateGenerationResult {
    const startTime = Date.now()
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }

    // 根据节点数量动态调整参数
    this.adjustConfigForNodeCount(finalConfig, nodes.length)

    // 分离有坐标和无坐标的节点
    const nodesWithCoords: NodeData[] = []
    const nodesWithoutCoords: NodeData[] = []

    nodes.forEach(node => {
      if (
        typeof node.x === 'number' &&
        typeof node.y === 'number' &&
        typeof node.z === 'number'
      ) {
        nodesWithCoords.push(node)
      } else {
        nodesWithoutCoords.push(node)
      }
    })

    let generatedNodes: NodeData[] = []
    let usedFallback = false

    // 如果有需要生成坐标的节点
    if (nodesWithoutCoords.length > 0) {
      try {
        // 尝试使用力导向布局算法
        generatedNodes = this.applyForceLayout(
          nodesWithoutCoords,
          edges,
          finalConfig
        )

        // 检查是否超时
        const elapsed = Date.now() - startTime
        if (elapsed > finalConfig.timeout) {
          throw new Error('Force layout timeout')
        }
      } catch (error) {
        // 超时或失败时使用后备算法
        console.warn('Force layout failed, using fallback:', error)
        generatedNodes = this.applyRandomLayout(nodesWithoutCoords)
        usedFallback = true
      }

      // 确保最小节点间距
      generatedNodes = this.enforceMinimumDistance(
        generatedNodes,
        finalConfig.minDistance
      )

      // 居中布局
      generatedNodes = this.centerLayout(generatedNodes)
    }

    // 合并有坐标和生成坐标的节点
    const allNodes = [...nodesWithCoords, ...generatedNodes]

    // 验证坐标范围
    if (!this.validateCoordinateRange(allNodes)) {
      console.warn('Some coordinates are out of range')
    }

    const executionTime = Date.now() - startTime

    return {
      nodes: allNodes,
      generatedCount: generatedNodes.length,
      providedCount: nodesWithCoords.length,
      executionTime,
      usedFallback
    }
  }

  /**
   * 根据节点数量动态调整参数
   */
  private adjustConfigForNodeCount(
    config: Required<CoordinateGeneratorConfig>,
    nodeCount: number
  ): void {
    if (nodeCount < 100) {
      // 小规模：使用完整迭代
      config.iterations = 100
    } else if (nodeCount < 500) {
      // 中等规模：减少迭代次数
      config.iterations = 50
    } else {
      // 大规模：进一步减少迭代次数
      config.iterations = 30
    }
  }

  /**
   * 力导向布局算法
   */
  private applyForceLayout(
    nodes: NodeData[],
    edges: EdgeData[],
    config: Required<CoordinateGeneratorConfig>
  ): NodeData[] {
    // 初始化节点位置（随机分布）
    const positions = new Map<string, Vector3D>()
    const velocities = new Map<string, Vector3D>()

    nodes.forEach(node => {
      positions.set(node.label, {
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        z: (Math.random() - 0.5) * 100
      })
      velocities.set(node.label, { x: 0, y: 0, z: 0 })
    })

    // 迭代优化
    for (let iter = 0; iter < config.iterations; iter++) {
      // 计算排斥力（所有节点对之间）
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i]
          const node2 = nodes[j]
          const pos1 = positions.get(node1.label)!
          const pos2 = positions.get(node2.label)!

          const dx = pos2.x - pos1.x
          const dy = pos2.y - pos1.y
          const dz = pos2.z - pos1.z
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1

          // 库仑力（排斥力）
          const force = config.repulsionStrength / (distance * distance)
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force
          const fz = (dz / distance) * force

          const vel1 = velocities.get(node1.label)!
          const vel2 = velocities.get(node2.label)!

          vel1.x -= fx
          vel1.y -= fy
          vel1.z -= fz
          vel2.x += fx
          vel2.y += fy
          vel2.z += fz
        }
      }

      // 计算吸引力（有边连接的节点之间）
      edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.label === edge.source)
        const targetNode = nodes.find(n => n.label === edge.target)

        if (sourceNode && targetNode) {
          const pos1 = positions.get(sourceNode.label)!
          const pos2 = positions.get(targetNode.label)!

          const dx = pos2.x - pos1.x
          const dy = pos2.y - pos1.y
          const dz = pos2.z - pos1.z
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1

          // 胡克定律（吸引力）
          const force = config.springStrength * (distance - config.springLength)
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force
          const fz = (dz / distance) * force

          const vel1 = velocities.get(sourceNode.label)!
          const vel2 = velocities.get(targetNode.label)!

          vel1.x += fx
          vel1.y += fy
          vel1.z += fz
          vel2.x -= fx
          vel2.y -= fy
          vel2.z -= fz
        }
      })

      // 更新位置（应用速度和阻尼）
      nodes.forEach(node => {
        const pos = positions.get(node.label)!
        const vel = velocities.get(node.label)!

        pos.x += vel.x
        pos.y += vel.y
        pos.z += vel.z

        vel.x *= config.damping
        vel.y *= config.damping
        vel.z *= config.damping
      })
    }

    // 将位置应用到节点
    return nodes.map(node => ({
      ...node,
      ...positions.get(node.label)!
    }))
  }

  /**
   * 简化的随机布局（后备方案）
   */
  private applyRandomLayout(nodes: NodeData[]): NodeData[] {
    const radius = Math.max(100, nodes.length * 10)

    return nodes.map(node => {
      // 在球形空间内随机分布
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      return {
        ...node,
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi)
      }
    })
  }

  /**
   * 验证坐标范围
   */
  private validateCoordinateRange(nodes: NodeData[]): boolean {
    return nodes.every(node => {
      if (
        typeof node.x !== 'number' ||
        typeof node.y !== 'number' ||
        typeof node.z !== 'number'
      ) {
        return false
      }

      return (
        Math.abs(node.x) <= 10000 &&
        Math.abs(node.y) <= 10000 &&
        Math.abs(node.z) <= 10000
      )
    })
  }

  /**
   * 确保最小节点间距
   */
  private enforceMinimumDistance(
    nodes: NodeData[],
    minDistance: number
  ): NodeData[] {
    const result = nodes.map(n => ({ ...n }))

    // 多次迭代以确保所有节点都满足最小间距
    for (let iter = 0; iter < 10; iter++) {
      let adjusted = false

      for (let i = 0; i < result.length; i++) {
        for (let j = i + 1; j < result.length; j++) {
          const node1 = result[i]
          const node2 = result[j]

          const dx = node2.x! - node1.x!
          const dy = node2.y! - node1.y!
          const dz = node2.z! - node1.z!
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (distance < minDistance) {
            // 调整位置以满足最小间距
            const adjustment = (minDistance - distance) / 2
            const factor = adjustment / distance

            node1.x! -= dx * factor
            node1.y! -= dy * factor
            node1.z! -= dz * factor
            node2.x! += dx * factor
            node2.y! += dy * factor
            node2.z! += dz * factor

            adjusted = true
          }
        }
      }

      if (!adjusted) break
    }

    return result
  }

  /**
   * 居中布局
   */
  private centerLayout(nodes: NodeData[]): NodeData[] {
    if (nodes.length === 0) return nodes

    // 计算中心点
    let sumX = 0, sumY = 0, sumZ = 0
    nodes.forEach(node => {
      sumX += node.x!
      sumY += node.y!
      sumZ += node.z!
    })

    const centerX = sumX / nodes.length
    const centerY = sumY / nodes.length
    const centerZ = sumZ / nodes.length

    // 将所有节点移动到中心
    return nodes.map(node => ({
      ...node,
      x: node.x! - centerX,
      y: node.y! - centerY,
      z: node.z! - centerZ
    }))
  }
}
